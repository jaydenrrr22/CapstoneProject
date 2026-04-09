#!/bin/bash

set -u

APP_DIR="$HOME/CapstoneProject"
FRONTEND_DIR="$APP_DIR/frontend"
FRONTEND_DIST_DIR="$FRONTEND_DIR/dist"
WEB_ROOT_DIR="/var/www/trace"
REQUIREMENTS_FILE="$APP_DIR/requirements.txt"

SERVICE_NAME="trace-backend.service"
BRANCH="main"
HEALTH_URL="http://127.0.0.1:8000/healthz"
HEALTH_RETRIES=15
HEALTH_RETRY_DELAY=2

LOG_FILE="$APP_DIR/deploy.log"
ROLLBACK_FILE="$APP_DIR/.last_deploy_commit"
LOCK_DIR="$APP_DIR/.deploy.lock"
ROLLBACK_DONE=0
LOCK_ACQUIRED=0

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log() {
    local level="$1"
    local message="$2"
    printf "[%s] %s %s\n" "$level" "$(timestamp)" "$message" | tee -a "$LOG_FILE"
}

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log "ERROR" "Missing required command: $cmd"
        return 1
    fi
}

acquire_lock() {
    if ! mkdir "$LOCK_DIR" 2>/dev/null; then
        log "ERROR" "Another deployment appears to be running (lock exists: $LOCK_DIR)"
        return 1
    fi

    echo "$$" >"$LOCK_DIR/pid"
    LOCK_ACQUIRED=1
}

release_lock() {
    rm -rf "$LOCK_DIR"
}

cleanup_on_exit() {
    if [ "$LOCK_ACQUIRED" -eq 1 ]; then
        release_lock
    fi
}

trap cleanup_on_exit EXIT INT TERM

activate_venv() {
    if [ -f "$APP_DIR/backend/venv/bin/activate" ]; then
        # shellcheck disable=SC1091
        source "$APP_DIR/backend/venv/bin/activate"
    elif [ -f "$APP_DIR/venv/bin/activate" ]; then
        # shellcheck disable=SC1091
        source "$APP_DIR/venv/bin/activate"
    elif [ -f "$APP_DIR/backend/api/venv/bin/activate" ]; then
        # shellcheck disable=SC1091
        source "$APP_DIR/backend/api/venv/bin/activate"
    else
        log "ERROR" "Could not find virtualenv"
        return 1
    fi
}

wait_for_backend_health() {
    local attempt
    for attempt in $(seq 1 "$HEALTH_RETRIES"); do
        if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
            log "INFO" "Backend health check passed at $HEALTH_URL"
            return 0
        fi

        log "INFO" "Waiting for backend health ($attempt/$HEALTH_RETRIES)"
        sleep "$HEALTH_RETRY_DELAY"
    done

    return 1
}

rollback() {
    if [ "$ROLLBACK_DONE" -eq 1 ]; then
        return
    fi
    ROLLBACK_DONE=1

    log "ROLLBACK" "Reverting to previous commit"

    if [ ! -f "$ROLLBACK_FILE" ]; then
        log "ERROR" "Rollback file not found: $ROLLBACK_FILE"
        return 1
    fi

    PREV=$(cat "$ROLLBACK_FILE")
    if [ -z "$PREV" ]; then
        log "ERROR" "Rollback commit is empty"
        return 1
    fi

    cd "$APP_DIR" || return 1

    if ! git checkout "$PREV"; then
        log "ERROR" "Failed to checkout rollback commit: $PREV"
        return 1
    fi

    log "INFO" "Reinstalling backend dependencies after rollback"
    if ! activate_venv; then
        return 1
    fi

    if [ -f "$REQUIREMENTS_FILE" ]; then
        if ! pip install -r "$REQUIREMENTS_FILE"; then
            deactivate || true
            log "ERROR" "Failed to install dependencies during rollback"
            return 1
        fi
    else
        log "INFO" "No requirements.txt found at $REQUIREMENTS_FILE, skipping pip install"
    fi

    deactivate || true

    if ! sudo -n systemctl restart "$SERVICE_NAME"; then
        log "ERROR" "Failed to restart backend during rollback"
        return 1
    fi

    if ! systemctl is-active --quiet "$SERVICE_NAME"; then
        log "ERROR" "Backend service is not active after rollback"
        return 1
    fi

    log "ROLLBACK" "ROLLBACK SUCCESSFUL"
    return 0
}

fail_deploy() {
    local message="$1"
    log "ERROR" "$message"

    if rollback; then
        log "ERROR" "Deployment failed and rollback completed"
    else
        log "ERROR" "Deployment failed and rollback did not complete cleanly"
    fi

    release_lock

    exit 1
}

log "INFO" "==================================="
log "INFO" "Starting deployment"
log "INFO" "==================================="

cd "$APP_DIR" || fail_deploy "Unable to access application directory: $APP_DIR"

if [ ! -d ".git" ]; then
    fail_deploy "Application directory is not a git repository: $APP_DIR"
fi

log "INFO" "Running preflight checks"
for cmd in git curl npm systemctl nginx sudo; do
    if ! require_command "$cmd"; then
        fail_deploy "Preflight checks failed"
    fi
done

if ! sudo -n true >/dev/null 2>&1; then
    fail_deploy "Passwordless sudo is required for non-interactive deployment"
fi

if ! acquire_lock; then
    exit 1
fi

log "INFO" "Saving rollback commit"

CURRENT_COMMIT=$(git rev-parse HEAD)
log "INFO" "Current commit: $CURRENT_COMMIT"

if ! git rev-parse HEAD >"$ROLLBACK_FILE"; then
    fail_deploy "Unable to record rollback commit"
fi

log "INFO" "Pulling latest code"
if ! git checkout "$BRANCH"; then
    fail_deploy "Failed to checkout branch: $BRANCH"
fi
if ! git pull origin "$BRANCH"; then
    fail_deploy "Failed to pull latest code from origin/$BRANCH"
fi

NEW_COMMIT=$(git rev-parse HEAD)
log "INFO" "Deployed commit: $NEW_COMMIT"

log "INFO" "Installing backend dependencies"
if ! activate_venv; then
    fail_deploy "Virtualenv activation failed"
fi

if [ -f "$REQUIREMENTS_FILE" ]; then
    if ! pip install -r "$REQUIREMENTS_FILE"; then
        deactivate || true
        fail_deploy "Backend dependency installation failed"
    fi
else
    log "INFO" "No requirements.txt found at $REQUIREMENTS_FILE, skipping pip install"
fi

deactivate || true

log "INFO" "Restarting backend"
if ! sudo -n systemctl restart "$SERVICE_NAME"; then
    fail_deploy "Backend restart command failed"
fi

if ! systemctl is-active --quiet "$SERVICE_NAME"; then
    fail_deploy "Backend service is not active after restart"
fi

log "INFO" "Waiting for backend to become healthy"
if ! wait_for_backend_health; then
    fail_deploy "Health check failed: $HEALTH_URL"
fi

log "INFO" "Building frontend"
cd "$FRONTEND_DIR" || fail_deploy "Unable to access frontend directory: $FRONTEND_DIR"

if [ -f "$FRONTEND_DIR/package-lock.json" ]; then
    if ! npm ci; then
        fail_deploy "Frontend dependency installation failed (npm ci)"
    fi
else
    if ! npm install; then
        fail_deploy "Frontend dependency installation failed (npm install)"
    fi
fi

if ! npm run build; then
    fail_deploy "Frontend build failed"
fi

if [ ! -d "$FRONTEND_DIST_DIR" ]; then
    fail_deploy "Frontend build output missing: $FRONTEND_DIST_DIR"
fi

if [ -z "$(ls -A "$FRONTEND_DIST_DIR" 2>/dev/null)" ]; then
    fail_deploy "Frontend build output is empty: $FRONTEND_DIST_DIR"
fi

log "INFO" "Publishing frontend to nginx web root"
if ! sudo -n mkdir -p "$WEB_ROOT_DIR"; then
    fail_deploy "Unable to create web root directory: $WEB_ROOT_DIR"
fi

if ! sudo -n find "$WEB_ROOT_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +; then
    fail_deploy "Unable to clear existing web root contents: $WEB_ROOT_DIR"
fi

if ! sudo -n cp -r "$FRONTEND_DIST_DIR"/. "$WEB_ROOT_DIR"/; then
    fail_deploy "Unable to publish frontend build to $WEB_ROOT_DIR"
fi

log "INFO" "Validating nginx configuration"
if ! sudo -n nginx -t; then
    fail_deploy "Nginx configuration validation failed"
fi

log "INFO" "Reloading nginx"
if ! sudo -n systemctl reload nginx; then
    fail_deploy "Nginx reload failed"
fi

log "SUCCESS" "Deployment complete"
log "INFO" "==================================="

release_lock
