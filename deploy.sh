#!/bin/bash

set -e

APP_DIR="$HOME/CapstoneProject"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend/api"
REQUIREMENTS_FILE="$APP_DIR/requirements.txt"

SERVICE_NAME="trace-backend.service"
BRANCH="main"

LOG_FILE="$APP_DIR/deploy.log"
ROLLBACK_FILE="$APP_DIR/.last_deploy_commit"

echo "===================================" | tee -a "$LOG_FILE"
echo "Starting FULL deployment: $(date)" | tee -a "$LOG_FILE"
echo "===================================" | tee -a "$LOG_FILE"

cd "$APP_DIR"

echo "📌 Saving rollback commit..." | tee -a "$LOG_FILE"
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "$CURRENT_COMMIT" > "$ROLLBACK_FILE"

echo "📥 Pulling latest code..." | tee -a "$LOG_FILE"
git checkout "$BRANCH" | tee -a "$LOG_FILE"
git pull origin "$BRANCH" | tee -a "$LOG_FILE"

echo "🐍 Activating backend virtualenv..." | tee -a "$LOG_FILE"

if [ -f "$APP_DIR/backend/venv/bin/activate" ]; then
    source "$APP_DIR/backend/venv/bin/activate"
elif [ -f "$APP_DIR/venv/bin/activate" ]; then
    source "$APP_DIR/venv/bin/activate"
else
    echo "ERROR: Could not find virtualenv" | tee -a "$LOG_FILE"
    exit 1
fi

if [ -f "$REQUIREMENTS_FILE" ]; then
    echo "📦 Installing backend dependencies..." | tee -a "$LOG_FILE"
    pip install -r "$REQUIREMENTS_FILE" | tee -a "$LOG_FILE"
else
    echo "No requirements.txt found, skipping pip install." | tee -a "$LOG_FILE"
fi

deactivate

echo "🔄 Restarting backend service..." | tee -a "$LOG_FILE"
sudo systemctl restart "$SERVICE_NAME"

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Backend restarted successfully." | tee -a "$LOG_FILE"
else
    echo "❌ Backend restart failed." | tee -a "$LOG_FILE"
    exit 1
fi

echo "🎨 Building frontend..." | tee -a "$LOG_FILE"
cd "$FRONTEND_DIR"

npm install | tee -a "$LOG_FILE"
npm run build | tee -a "$LOG_FILE"

echo "🌐 Restarting nginx..." | tee -a "$LOG_FILE"
sudo systemctl restart nginx

echo "✅ Frontend deployed." | tee -a "$LOG_FILE"

echo "===================================" | tee -a "$LOG_FILE"
echo "Deployment completed: $(date)" | tee -a "$LOG_FILE"
echo "===================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
