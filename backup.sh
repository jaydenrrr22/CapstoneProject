#!/bin/bash

# Config
DB_NAME="trace_db"
DB_USER="trace_user"
DB_PASSWORD="TraceDb!2026Secure"
BACKUP_DIR="$HOME/backups"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup file
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$TIMESTAMP.sql"

# Run backup
mysqldump --no-tablespaces -u trace_user -pTraceDb!2026Secure trace_db > $BACKUP_FILE

echo "Backup completed: $BACKUP_FILE"
