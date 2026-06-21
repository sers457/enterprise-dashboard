#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Enterprise Admin Dashboard - Environment Setup Script
# =============================================================================
# Generates secure secrets and creates the .env file for all environments.
#
# Usage:
#   chmod +x env-setup.sh
#   ./env-setup.sh                            # Development
#   ./env-setup.sh --env production --domain dashboard.yourdomain.com
#   ./env-setup.sh --env staging --domain staging.yourdomain.com
#   ./env-setup.sh --show-secrets             # Generate and display only
# =============================================================================

# Configuration
ENVIRONMENT="${ENVIRONMENT:-development}"
DOMAIN="${DOMAIN:-localhost}"
OUTPUT_DIR="${OUTPUT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SHOW_ONLY=false
GENERATE_ALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENVIRONMENT="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --output) OUTPUT_DIR="$2"; shift 2 ;;
    --show-secrets) SHOW_ONLY=true; shift ;;
    --generate-all) GENERATE_ALL=true; shift ;;
    --help)
      echo "Usage: $0 [--env ENV] [--domain DOMAIN] [--output DIR] [--show-secrets] [--generate-all]"
      echo ""
      echo "Environments: development, staging, production"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# =============================================================================
# Generate Secrets
# =============================================================================
generate_secret_key() {
  openssl rand -hex 32
}

generate_jwt_secret() {
  openssl rand -base64 32 | tr -d '=+/'
}

generate_db_password() {
  openssl rand -hex 16
}

generate_redis_password() {
  openssl rand -hex 16
}

generate_oauth_state() {
  openssl rand -hex 32
}

generate_encryption_key() {
  openssl rand -base64 32
}

generate_api_key() {
  openssl rand -base64 24 | tr -d '=+/'
}

# =============================================================================
# Build environment configuration
# =============================================================================
SECRET_KEY=$(generate_secret_key)
JWT_SECRET=$(generate_jwt_secret)
JWT_REFRESH_SECRET=$(generate_jwt_secret)
DB_PASSWORD=$(generate_db_password)
REDIS_PASSWORD=$(generate_redis_password)
ENCRYPTION_KEY=$(generate_encryption_key)
INTERNAL_API_KEY=$(generate_api_key)
OAUTH_STATE_SECRET=$(generate_oauth_state)

case "$ENVIRONMENT" in
  production)
    DEBUG="false"
    LOG_LEVEL="info"
    CORS_ORIGINS="https://${DOMAIN}"
    DB_HOST="postgres"
    REDIS_HOST="redis"
    ;;
  staging)
    DEBUG="false"
    LOG_LEVEL="debug"
    CORS_ORIGINS="https://${DOMAIN}"
    DB_HOST="postgres"
    REDIS_HOST="redis"
    ;;
  development)
    DEBUG="true"
    LOG_LEVEL="debug"
    CORS_ORIGINS="http://localhost:5173,http://localhost:3000,http://localhost:8000"
    DB_HOST="localhost"
    REDIS_HOST="localhost"
    ;;
  test)
    DEBUG="true"
    LOG_LEVEL="debug"
    CORS_ORIGINS="*"
    DB_HOST="localhost"
    REDIS_HOST="localhost"
    ;;
  *)
    warn "Unknown environment: $ENVIRONMENT, using defaults"
    DEBUG="false"
    LOG_LEVEL="info"
    CORS_ORIGINS="https://${DOMAIN}"
    DB_HOST="postgres"
    REDIS_HOST="redis"
    ;;
esac

# =============================================================================
# Display secrets (for --show-secrets mode)
# =============================================================================
if [[ "$SHOW_ONLY" == "true" ]]; then
  echo ""
  echo "============================================================================="
  echo -e "${YELLOW}Generated Secrets for $ENVIRONMENT${NC}"
  echo "============================================================================="
  echo ""
  echo "SECRET_KEY=$SECRET_KEY"
  echo "JWT_SECRET=$JWT_SECRET"
  echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
  echo "DB_PASSWORD=$DB_PASSWORD"
  echo "REDIS_PASSWORD=$REDIS_PASSWORD"
  echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
  echo "INTERNAL_API_KEY=$INTERNAL_API_KEY"
  echo "OAUTH_STATE_SECRET=$OAUTH_STATE_SECRET"
  echo ""
  echo -e "${YELLOW}Save these securely! They will not be shown again.${NC}"
  exit 0
fi

# =============================================================================
# Write .env file
# =============================================================================
ENV_FILE="${OUTPUT_DIR}/.env"

if [[ -f "$ENV_FILE" ]] && [[ "$GENERATE_ALL" == "false" ]]; then
  warn "File $ENV_FILE already exists. Use --generate-all to overwrite."
  exit 0
fi

log "Creating environment file for $ENVIRONMENT at $ENV_FILE..."

cat > "$ENV_FILE" << ENVEOF
# =============================================================================
# Enterprise Admin Dashboard - Environment Configuration
# Environment: ${ENVIRONMENT}
# Generated: $(date)
# =============================================================================

# --- Application ---
ENVIRONMENT=${ENVIRONMENT}
DEBUG=${DEBUG}
LOG_LEVEL=${LOG_LEVEL}
APP_NAME="Enterprise Admin Dashboard"
APP_VERSION=1.0.0

# --- Security ---
SECRET_KEY=${SECRET_KEY}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENCRYPTION_KEY=${ENCRYPTION_KEY}
INTERNAL_API_KEY=${INTERNAL_API_KEY}
OAUTH_STATE_SECRET=${OAUTH_STATE_SECRET}
CORS_ORIGINS=${CORS_ORIGINS}
ALLOWED_HOSTS=${DOMAIN}

# --- Database (PostgreSQL) ---
POSTGRES_USER=enterprise_admin
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=enterprise_dashboard
POSTGRES_HOST=${DB_HOST}
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://enterprise_admin:${DB_PASSWORD}@${DB_HOST}:5432/enterprise_dashboard
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30
DATABASE_ECHO=false

# --- Redis ---
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=6379
REDIS_DB=0
REDIS_URL=redis://:${REDIS_PASSWORD}@${REDIS_HOST}:6379/0

# --- Celery ---
CELERY_BROKER_URL=redis://:${REDIS_PASSWORD}@${REDIS_HOST}:6379/1
CELERY_RESULT_BACKEND=redis://:${REDIS_PASSWORD}@${REDIS_HOST}:6379/1
CELERY_TASK_ALWAYS_EAGER=false
CELERY_WORKER_CONCURRENCY=4
CELERY_TASK_SERIALIZER=json
CELERY_RESULT_SERIALIZER=json
CELERY_ACCEPT_CONTENT=json

# --- DeepSeek AI ---
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4096
DEEPSEEK_TEMPERATURE=0.7

# --- Email (SendGrid) ---
SENDGRID_API_KEY=
FROM_EMAIL=admin@${DOMAIN}
FROM_NAME="Enterprise Dashboard"
EMAIL_TEMPLATE_DIR=app/templates/email

# --- OAuth ---
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
OAUTH_REDIRECT_URL=https://${DOMAIN}/api/auth/callback

# --- 2FA ---
OTP_ISSUER_NAME="Enterprise Dashboard"
OTP_VALIDITY_PERIOD=30

# --- File Upload ---
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=52428800
ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv

# --- Rate Limiting ---
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=100/hour
RATE_LIMIT_LOGIN=10/minute
RATE_LIMIT_API=1000/minute

# --- WebSocket ---
WS_HEARTBEAT_INTERVAL=30
WS_MAX_CONNECTIONS=1000

# --- Monitoring ---
SENTRY_DSN=
PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus
METRICS_ENABLED=true

# --- Frontend (Vite) ---
VITE_API_URL=/api
VITE_WS_URL=/ws
VITE_APP_NAME="Enterprise Dashboard"
VITE_SENTRY_DSN=
VITE_GA_ID=

# --- Domain ---
DOMAIN=${DOMAIN}
ENVEOF

chmod 600 "$ENV_FILE"
success "Environment file created: $ENV_FILE"

# =============================================================================
# Generate example .env files
# =============================================================================
if [[ "$GENERATE_ALL" == "true" ]]; then
  log "Generating example .env files for all environments..."

  # Production example
  cp "$ENV_FILE" "${OUTPUT_DIR}/.env.production.example"
  sed -i "s/ENVIRONMENT=.*/ENVIRONMENT=production/" "${OUTPUT_DIR}/.env.production.example"
  sed -i "s/DEBUG=.*/DEBUG=false/" "${OUTPUT_DIR}/.env.production.example"
  sed -i "s/LOG_LEVEL=.*/LOG_LEVEL=info/" "${OUTPUT_DIR}/.env.production.example"
  success "Created .env.production.example"

  # Staging example
  cp "$ENV_FILE" "${OUTPUT_DIR}/.env.staging.example"
  sed -i "s/ENVIRONMENT=.*/ENVIRONMENT=staging/" "${OUTPUT_DIR}/.env.staging.example"
  sed -i "s/DEBUG=.*/DEBUG=false/" "${OUTPUT_DIR}/.env.staging.example"
  sed -i "s/LOG_LEVEL=.*/LOG_LEVEL=debug/" "${OUTPUT_DIR}/.env.staging.example"
  success "Created .env.staging.example"

  warn "Example files contain sample secrets. Replace before committing."
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================================="
echo -e "${GREEN}Environment Setup Complete${NC}"
echo "============================================================================="
echo ""
echo -e "Environment: ${BLUE}${ENVIRONMENT}${NC}"
echo -e "Domain:      ${BLUE}${DOMAIN}${NC}"
echo -e "File:        ${BLUE}${ENV_FILE}${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "  1. Review the .env file and update any missing values"
echo "  2. Keep .env file secure - never commit to version control"
echo "  3. Generate unique secrets for each environment"
echo "  4. Configure API keys (DeepSeek, SendGrid, OAuth)"
echo "============================================================================="
