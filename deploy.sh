#!/bin/bash

set -e

APP_DIR="$HOME/CapstoneProject"
BACKEND_DIR="$APP_DIR/backend/api"
REQUIREMENTS_FILE="$APP_DIR/requirements.txt"
SERVICE_NAME="trace-backend.service"
BRANCH="main"
LOG_FILE="$APP_DIR/deploy.log"
ROLLBACK_FILE="$APP_DIR/.last_deploy_commit"

# Try common venv locations
if [ -f "$APP_DIR/backend/venv/bin/activate" ]; then
    VENV_PATH="$APP_DIR/backend/venv"
elif [ -f "$APP_DIR/venv/bin/activate" ]; then
    VENV_PATH="$APP_DIR/venv"
elif [ -f "$BACKEND_DIR/venv/bin/activate" ]; then
    VENV_PATH="$BACKEND_DIR/venv"
else
    echo "ERROR: Could not find a virtual environment." | tee -a "$LOG_FILE"
    exit 1
fi

echo "===================================" | tee -a "$LOG_FILE"
echo "Starting deployment: $(date)" | tee -a "$LOG_FILE"
echo "===================================" | tee -a "$LOG_FILE"

cd "$APP_DIR"

CURRENT_COMMIT=$(git rev-parse HEAD)
echo "$CURRENT_COMMIT" > "$ROLLBACK_FILE"
echo "Saved rollback commit: $CURRENT_COMMIT" | tee -a "$LOG_FILE"

git checkout "$BRANCH" | tee -a "$LOG_FILE"
git pull origin "$BRANCH" | tee -a "$LOG_FILE"

source "$VENV_PATH/bin/activate"

if [ -f "$REQUIREMENTS_FILE" ]; then
    pip install -r "$REQUIREMENTS_FILE" | tee -a "$LOG_FILE"
else
    echo "No requirements.txt found at $REQUIREMENTS_FILE, skipping pip install." | tee -a "$LOG_FILE"
fi

deactivate

sudo systemctl restart "$SERVICE_NAME"

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Service $SERVICE_NAME restarted successfully." | tee -a "$LOG_FILE"
else
    echo "ERROR: Service $SERVICE_NAME failed to restart." | tee -a "$LOG_FILE"
    exit 1
fi

echo "Deployment completed successfully: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
