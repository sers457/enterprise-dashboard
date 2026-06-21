#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Enterprise Admin Dashboard - Automated Backup Script
# =============================================================================
# This script performs PostgreSQL database backups with encryption, uploads
# to S3 (or stores locally), and cleans up old backups.
#
# Usage:
#   sudo ./deploy/backup.sh              # Run backup with defaults
#   S3_BUCKET=my-bucket ./deploy/backup.sh  # Upload to S3
#   ENCRYPTION_KEY=... ./deploy/backup.sh   # Encrypt backup
# =============================================================================

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$PROJECT_DIR/.env" ]]; then
  set -a; source "$PROJECT_DIR/.env"; set +a
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
S3_BUCKET="${S3_BUCKET:-}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="enterprise_dashboard_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
LOG_FILE="${BACKUP_DIR}/backup.log"
NOTIFY_ON_FAILURE="${NOTIFY_ON_FAILURE:-true}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Database connection (from environment or defaults)
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_NAME="${POSTGRES_DB:-enterprise_dashboard}"
DB_USER="${POSTGRES_USER:-enterprise_admin}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"; }
log_info() { log "${GREEN}[INFO]${NC} $1"; }
log_warn() { log "${YELLOW}[WARN]${NC} $1"; }
log_error() { log "${RED}[ERROR]${NC} $1"; }

cleanup() {
  log_info "Cleaning up temporary files..."
  rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
}

trap cleanup EXIT

# =============================================================================
# Pre-flight checks
# =============================================================================
mkdir -p "$BACKUP_DIR"

if ! command -v pg_dump &>/dev/null; then
  log_error "pg_dump not found. Install postgresql-client."
  exit 1
fi

if [[ -n "$ENCRYPTION_KEY" ]] && ! command -v gpg &>/dev/null; then
  log_error "gpg not found. Install gnupg."
  exit 1
fi

if [[ -n "$S3_BUCKET" ]] && ! command -v aws &>/dev/null; then
  log_warn "AWS CLI not found. Backup will be stored locally only."
  S3_BUCKET=""
fi

# =============================================================================
# Step 1: Export PGPASSWORD and dump database
# =============================================================================
export PGPASSWORD="$DB_PASSWORD"

log_info "Starting PostgreSQL backup of '$DB_NAME'..."
log_info "Database host: $DB_HOST:$DB_PORT"

pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --verbose \
  --no-owner \
  --compress=9 \
  --file="${BACKUP_DIR}/${BACKUP_FILE}" 2>> "$LOG_FILE"

DUMP_EXIT_CODE=$?
unset PGPASSWORD

if [[ $DUMP_EXIT_CODE -ne 0 ]]; then
  log_error "Database dump failed with exit code $DUMP_EXIT_CODE"
  send_notification "Database dump failed for $DB_NAME"
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log_info "Database dump completed successfully. Size: $BACKUP_SIZE"

# =============================================================================
# Step 2: Encrypt backup (if encryption key is provided)
# =============================================================================
if [[ -n "$ENCRYPTION_KEY" ]]; then
  log_info "Encrypting backup..."
  echo "$ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 \
    --symmetric --cipher-algo AES256 \
    -o "${BACKUP_DIR}/${ENCRYPTED_FILE}" \
    "${BACKUP_DIR}/${BACKUP_FILE}"

  rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
  FINAL_FILE="${BACKUP_DIR}/${ENCRYPTED_FILE}"
  log_info "Backup encrypted: $ENCRYPTED_FILE"
else
  FINAL_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

# =============================================================================
# Step 3: Upload to S3
# =============================================================================
if [[ -n "$S3_BUCKET" ]]; then
  log_info "Uploading backup to S3 bucket: $S3_BUCKET"
  S3_PATH="s3://${S3_BUCKET}/backups/$(basename "$FINAL_FILE")"

  if aws s3 cp "$FINAL_FILE" "$S3_PATH" --sse AES256; then
    log_info "Upload to S3 completed: $S3_PATH"
  else
    log_error "S3 upload failed"
  fi

  # Upload backup log
  aws s3 cp "$LOG_FILE" "s3://${S3_BUCKET}/backups/backup.log" --sse AES256 2>/dev/null || true
fi

# =============================================================================
# Step 4: Cleanup old backups (local)
# =============================================================================
log_info "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "enterprise_dashboard_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "enterprise_dashboard_*.sql.gz.gpg" -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true

# =============================================================================
# Step 5: Verify backup integrity
# =============================================================================
log_info "Verifying backup integrity..."
if [[ -n "$ENCRYPTION_KEY" ]]; then
  # Test decryption
  echo "$ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 \
    --decrypt "${BACKUP_DIR}/${ENCRYPTED_FILE}" > /dev/null 2>> "$LOG_FILE" && \
    log_info "Encrypted backup integrity verified" || \
    log_warn "Backup integrity verification failed"
fi

# =============================================================================
# Step 6: Send notification
# =============================================================================
log_info "Backup completed successfully!"
log_info "  File: $(basename "$FINAL_FILE")"
log_info "  Size: $BACKUP_SIZE"
log_info "  Location: $BACKUP_DIR"

# Send success notification
if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
  curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"Backup Successful: $DB_NAME\",
      \"blocks\": [{
        \"type\": \"section\",
        \"text\": {
          \"type\": \"mrkdwn\",
          \"text\": \"*Database Backup Successful*\\nDatabase: $DB_NAME\\nSize: $BACKUP_SIZE\\nFile: $(basename \"$FINAL_FILE\")\\nLocation: ${S3_BUCKET:-local}\\nTime: $(date)\"
        }
      }]
    }" > /dev/null 2>&1 || true
fi

exit 0
