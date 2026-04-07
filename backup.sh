#!/bin/bash
set -euo pipefail

# Config — load credentials from environment variables (no hardcoded secrets)
DB_NAME="${DB_NAME:-trace_db}"
DB_USER="${DB_USER:-trace_user}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD must be set in the environment or .env file}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup file
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$TIMESTAMP.sql"

# Run backup — pass password via env var to avoid exposing it in process listings
if MYSQL_PWD="$DB_PASSWORD" mysqldump --no-tablespaces -u "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    echo "Backup completed: $BACKUP_FILE"
else
    echo "Backup failed for database '$DB_NAME'" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi
