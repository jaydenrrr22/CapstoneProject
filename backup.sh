#!/bin/bash
set -euo pipefail

ENV_FILE="/home/ubuntu/CapstoneProject/backend/.env"
if [ -f "$ENV_FILE" ]; then
    set -o allexport
    source "$ENV_FILE"
    set +o allexport
fi

# =========================
# CONFIG
# =========================
DB_NAME="${DB_NAME:-trace_db}"
DB_USER="${DB_USER:-trace_user}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD must be set in the environment or .env file}"

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Optional S3 upload (set S3_BUCKET to enable)
S3_BUCKET="${S3_BUCKET:-}"

LOG_FILE="/home/ubuntu/trace-backend.log"

# =========================
# SETUP
# =========================
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$TIMESTAMP.sql"

echo "[$TIMESTAMP] Starting backup..."

# =========================
# DATABASE BACKUP
# =========================
if MYSQL_PWD="$DB_PASSWORD" mysqldump --no-tablespaces -u "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    echo "[$TIMESTAMP] Backup completed: $BACKUP_FILE"
else
    echo "[$TIMESTAMP] Backup FAILED for database '$DB_NAME'" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# =========================
# COMPRESSION
# =========================
echo "[$TIMESTAMP] Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

# =========================
# RETENTION POLICY
# =========================
echo "[$TIMESTAMP] Cleaning old backups (>$RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -print -delete || true

# =========================
# OPTIONAL S3 UPLOAD
# =========================
if [ -n "$S3_BUCKET" ]; then
    echo "[$TIMESTAMP] Uploading backup to S3: $S3_BUCKET"

    S3_PATH="s3://$S3_BUCKET/backups/$DB_NAME/$(basename "$BACKUP_FILE")"

    if aws s3 cp "$BACKUP_FILE" "$S3_PATH" --sse AES256; then
        echo "[$TIMESTAMP] Upload successful"

        # Verify upload
        if aws s3 ls "s3://$S3_BUCKET/backups/$DB_NAME/" | grep -q "$(basename "$BACKUP_FILE")"; then
            echo "[$TIMESTAMP] Upload verified in S3"
        else
            echo "[$TIMESTAMP] Upload verification FAILED" >&2
        fi
    else
        echo "[$TIMESTAMP] S3 upload FAILED" >&2
    fi

    # =========================
    # OPTIONAL LOG UPLOAD
    # =========================
    if [ -f "$LOG_FILE" ]; then
        echo "[$TIMESTAMP] Uploading logs to S3..."
        aws s3 cp "$LOG_FILE" "s3://$S3_BUCKET/logs/trace-backend-$(date +%F-%H-%M).log" || true
    fi
fi

echo "[$TIMESTAMP] Backup job finished"
