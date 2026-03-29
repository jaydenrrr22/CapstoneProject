#!/bin/bash

set -e

APP_DIR="$HOME/CapstoneProject"
BACKEND_DIR="$APP_DIR/backend/api"
REQUIREMENTS_FILE="$APP_DIR/requirements.txt"
SERVICE_NAME="trace-backend.service"
LOG_FILE="$APP_DIR/deploy.log"
ROLLBACK_FILE="$APP_DIR/.last_deploy_commit"

# Detect virtual environment location
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
echo "Starting rollback: $(date)" | tee -a "$LOG_FILE"
echo "===================================" | tee -a "$LOG_FILE"

cd "$APP_DIR"

if [ ! -f "$ROLLBACK_FILE" ]; then
    echo "ERROR: No rollback commit found." | tee -a "$LOG_FILE"
    exit 1
fi

ROLLBACK_COMMIT=$(cat "$ROLLBACK_FILE")
echo "Rolling back to commit: $ROLLBACK_COMMIT" | tee -a "$LOG_FILE"

git checkout "$ROLLBACK_COMMIT" | tee -a "$LOG_FILE"

source "$VENV_PATH/bin/activate"

if [ -f "$REQUIREMENTS_FILE" ]; then
    pip install -r "$REQUIREMENTS_FILE" | tee -a "$LOG_FILE"
else
    echo "No requirements.txt found at $REQUIREMENTS_FILE, skipping pip install." | tee -a "$LOG_FILE"
fi

deactivate

sudo systemctl restart "$SERVICE_NAME"

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Rollback completed successfully." | tee -a "$LOG_FILE"
else
    echo "ERROR: Service failed after rollback." | tee -a "$LOG_FILE"
    exit 1
fi

echo "Rollback finished: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
