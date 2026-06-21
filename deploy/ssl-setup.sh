#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Enterprise Admin Dashboard - SSL Certificate Setup Script
# =============================================================================
# Installs and configures Let's Encrypt SSL certificates for the dashboard.
# Supports both standalone Nginx and Docker-based Nginx setups.
#
# Usage:
#   sudo ./deploy/ssl-setup.sh --domain dashboard.yourdomain.com --email admin@yourdomain.com
#   sudo ./deploy/ssl-setup.sh --domain yourdomain.com --email admin@yourdomain.com --docker
#   sudo ./deploy/ssl-setup.sh --renew
# =============================================================================

DOMAIN=""
EMAIL=""
DOCKER_MODE=false
RENEW_ONLY=false
STAGING=false
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSL_DIR="${PROJECT_DIR}/deploy/ssl"
LETSENCRYPT_DIR="${PROJECT_DIR}/deploy/letsencrypt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --docker) DOCKER_MODE=true; shift ;;
    --renew) RENEW_ONLY=true; shift ;;
    --staging) STAGING=true; shift ;;
    --help)
      echo "Usage: $0 [--domain DOMAIN] [--email EMAIL] [--docker] [--renew] [--staging]"
      echo ""
      echo "Options:"
      echo "  --domain DOMAIN    Domain name for SSL certificate"
      echo "  --email EMAIL      Email for Let's Encrypt notifications"
      echo "  --docker           Configure for Docker Nginx container"
      echo "  --renew            Only renew existing certificates"
      echo "  --staging          Use Let's Encrypt staging (test)"
      exit 0
      ;;
    *) log_error "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ "$RENEW_ONLY" == "true" ]]; then
  log_info "Renewing SSL certificates..."
  certbot renew --quiet --deploy-hook "systemctl reload nginx || docker compose -f ${PROJECT_DIR}/docker-compose.yml exec nginx nginx -s reload" 2>&1
  log_success "Certificate renewal complete"
  exit 0
fi

if [[ -z "$DOMAIN" ]] || [[ -z "$EMAIL" ]]; then
  log_error "Both --domain and --email are required"
  exit 1
fi

# Root check
if [[ $EUID -ne 0 ]]; then
  log_error "This script must be run as root"
  exit 1
fi

# =============================================================================
# Step 1: Install Certbot
# =============================================================================
log_info "Installing Certbot..."
if ! command -v certbot &>/dev/null; then
  apt-get update -qq
  apt-get install -y -qq certbot python3-certbot-nginx
  log_success "Certbot installed"
else
  log_info "Certbot is already installed"
fi

# =============================================================================
# Step 2: Stop any service on port 80/443 for standalone mode
# =============================================================================
if [[ "$DOCKER_MODE" == "true" ]]; then
  log_info "Stopping Docker Nginx for certificate acquisition..."
  cd "$PROJECT_DIR"
  docker compose stop nginx 2>/dev/null || true
fi

# =============================================================================
# Step 3: Get SSL Certificate
# =============================================================================
log_info "Obtaining SSL certificate for $DOMAIN..."

CERTBOT_ARGS=""
if [[ "$STAGING" == "true" ]]; then
  CERTBOT_ARGS="--staging"
  log_warn "Using Let's Encrypt staging environment (test certificates)"
fi

if [[ "$DOCKER_MODE" == "true" ]]; then
  # Use standalone mode
  certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domain "$DOMAIN" \
    --domain "www.$DOMAIN" \
    $CERTBOT_ARGS \
    --preferred-challenges http-01
else
  # Use nginx mode
  certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domain "$DOMAIN" \
    --domain "www.$DOMAIN" \
    $CERTBOT_ARGS
fi

if [[ $? -ne 0 ]]; then
  log_error "Failed to obtain SSL certificate"
  if [[ "$DOCKER_MODE" == "true" ]]; then
    log_info "Restarting Docker Nginx..."
    cd "$PROJECT_DIR" && docker compose up -d nginx
  fi
  exit 1
fi

log_success "SSL certificate obtained for $DOMAIN"

# =============================================================================
# Step 4: Copy Certificates for Docker
# =============================================================================
if [[ "$DOCKER_MODE" == "true" ]]; then
  log_info "Copying certificates to Docker volume..."
  mkdir -p "$SSL_DIR" "$LETSENCRYPT_DIR"

  CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
  if [[ -d "$CERT_DIR" ]]; then
    cp "${CERT_DIR}/fullchain.pem" "${SSL_DIR}/fullchain.pem"
    cp "${CERT_DIR}/privkey.pem" "${SSL_DIR}/privkey.pem"
    cp "${CERT_DIR}/chain.pem" "${SSL_DIR}/chain.pem"
    chmod 600 "${SSL_DIR}/privkey.pem"
    chmod 644 "${SSL_DIR}/fullchain.pem" "${SSL_DIR}/chain.pem"
    log_success "Certificates copied to ${SSL_DIR}"

    # Create symlink for letsencrypt directory
    if [[ ! -L "$LETSENCRYPT_DIR/live" ]]; then
      mkdir -p "$LETSENCRYPT_DIR"
      cp -rL "/etc/letsencrypt/live/$DOMAIN" "$LETSENCRYPT_DIR/"
    fi
  else
    log_warn "Certificate directory $CERT_DIR not found"
  fi
fi

# =============================================================================
# Step 5: Configure Auto-Renewal
# =============================================================================
log_info "Setting up auto-renewal..."

if [[ "$DOCKER_MODE" == "true" ]]; then
  # Create renewal hook
  cat > /etc/letsencrypt/renewal-hooks/deploy/enterprise-dashboard.sh << 'HOOK'
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/enterprise-dashboard"
DOMAIN=$(basename $(ls -d /etc/letsencrypt/live/*/ 2>/dev/null | head -1) 2>/dev/null || echo "")

if [[ -n "$DOMAIN" && -d "$PROJECT_DIR" ]]; then
  mkdir -p "${PROJECT_DIR}/deploy/ssl"
  cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${PROJECT_DIR}/deploy/ssl/"
  cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${PROJECT_DIR}/deploy/ssl/"
  cp "/etc/letsencrypt/live/${DOMAIN}/chain.pem" "${PROJECT_DIR}/deploy/ssl/"
  chmod 600 "${PROJECT_DIR}/deploy/ssl/privkey.pem"

  cd "$PROJECT_DIR"
  docker compose exec -T nginx nginx -s reload 2>/dev/null || docker compose restart nginx 2>/dev/null || true
fi
HOOK
  chmod +x /etc/letsencrypt/renewal-hooks/deploy/enterprise-dashboard.sh
fi

# Add cron for renewal
RENEWAL_CMD="/usr/bin/certbot renew --quiet"
if [[ "$DOCKER_MODE" == "true" ]]; then
  RENEWAL_CMD="/usr/bin/certbot renew --quiet --deploy-hook /etc/letsencrypt/renewal-hooks/deploy/enterprise-dashboard.sh"
fi

(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * $RENEWAL_CMD") | crontab -
log_success "Auto-renewal cron job configured (daily at 3 AM)"

# =============================================================================
# Step 6: Restart Services
# =============================================================================
if [[ "$DOCKER_MODE" == "true" ]]; then
  log_info "Restarting Docker Nginx..."
  cd "$PROJECT_DIR"
  docker compose up -d nginx
  log_success "Docker Nginx restarted"
else
  log_info "Testing Nginx configuration..."
  nginx -t && systemctl reload nginx && log_success "Nginx reloaded" || log_error "Nginx configuration test failed"
fi

# =============================================================================
# Step 7: Verify SSL
# =============================================================================
log_info "Verifying SSL certificate..."
sleep 2
CERT_EXPIRY=$(openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [[ -n "$CERT_EXPIRY" ]]; then
  log_success "SSL certificate valid until: $CERT_EXPIRY"
else
  log_warn "Could not verify SSL certificate. Check manually."
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================================="
echo -e "${GREEN}SSL Setup Complete!${NC}"
echo "============================================================================="
echo ""
echo -e "${BLUE}Domain:${NC}         $DOMAIN"
echo -e "${BLUE}Email:${NC}          $EMAIL"
echo -e "${BLUE}Certificate Path:${NC} /etc/letsencrypt/live/$DOMAIN/"
echo -e "${BLUE}Auto-Renewal:${NC}     Daily at 3 AM"
echo ""
echo -e "${GREEN}Your site is now secured with HTTPS!${NC}"
echo "============================================================================="
