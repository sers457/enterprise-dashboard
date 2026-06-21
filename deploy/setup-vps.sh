#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Enterprise Admin Dashboard - VPS Setup Script
# =============================================================================
# This script provisions a Linux VPS with Docker, Nginx, SSL, fail2ban,
# monitoring, and deploys the enterprise admin dashboard using Docker Compose.
#
# Usage:
#   chmod +x setup-vps.sh
#   sudo ./setup-vps.sh [--domain yourdomain.com] [--email admin@yourdomain.com]
#
# Prerequisites:
#   - Fresh Ubuntu 22.04+ or Debian 11+ installation
#   - Root or sudo access
#   - Domain pointing to server IP
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Default values
DOMAIN="${DOMAIN:-yourdomain.com}"
EMAIL="${EMAIL:-admin@yourdomain.com}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/enterprise-dashboard}"
TIMEZONE="${TIMEZONE:-UTC}"
SSH_PORT="${SSH_PORT:-22}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --user) DEPLOY_USER="$2"; shift 2 ;;
    --dir) DEPLOY_DIR="$2"; shift 2 ;;
    --timezone) TIMEZONE="$2"; shift 2 ;;
    --ssh-port) SSH_PORT="$2"; shift 2 ;;
    --help)
      echo "Usage: $0 [--domain DOMAIN] [--email EMAIL] [--user USER] [--dir DIR] [--timezone TZ] [--ssh-port PORT]"
      exit 0
      ;;
    *) log_error "Unknown option: $1"; exit 1 ;;
  esac
done

# Root check
if [[ $EUID -ne 0 ]]; then
  log_error "This script must be run as root. Use sudo."
  exit 1
fi

# =============================================================================
# Step 1: System Updates & Prerequisites
# =============================================================================
log_info "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    neofetch \
    git \
    wget \
    unzip \
    jq \
    build-essential \
    certbot \
    python3-certbot-nginx \
    logrotate \
    rsync \
    tree \
    nano

# Set timezone
timedatectl set-timezone "$TIMEZONE"
log_success "System packages updated"

# =============================================================================
# Step 2: Create Deploy User
# =============================================================================
log_info "Creating deploy user..."
if id "$DEPLOY_USER" &>/dev/null; then
  log_warn "User $DEPLOY_USER already exists"
else
  useradd -m -s /bin/bash -G sudo "$DEPLOY_USER"
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/bin/systemctl" > "/etc/sudoers.d/$DEPLOY_USER"
  chmod 440 "/etc/sudoers.d/$DEPLOY_USER"
  log_success "User $DEPLOY_USER created"
fi

# Set up SSH key-based auth
mkdir -p "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
chmod 700 "/home/$DEPLOY_USER/.ssh"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
log_success "SSH directory configured for $DEPLOY_USER"

# =============================================================================
# Step 3: Install Docker
# =============================================================================
log_info "Installing Docker..."
if command -v docker &>/dev/null; then
  log_warn "Docker already installed, skipping"
else
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$DEPLOY_USER"
  systemctl enable docker
  systemctl start docker
  log_success "Docker installed"
fi

# Install Docker Compose plugin
if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
  DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker/cli-plugins}
  mkdir -p "$DOCKER_CONFIG"
  curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o "$DOCKER_CONFIG/docker-compose"
  chmod +x "$DOCKER_CONFIG/docker-compose"
  ln -sf "$DOCKER_CONFIG/docker-compose" /usr/local/bin/docker-compose
  log_success "Docker Compose installed"
fi

# =============================================================================
# Step 4: Configure Firewall (UFW)
# =============================================================================
log_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT/tcp" comment "SSH"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw --force enable
log_success "Firewall configured"

# =============================================================================
# Step 5: Configure fail2ban
# =============================================================================
log_info "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-botsearch]
enabled = true
port = http,https
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
FAIL2BAN

systemctl enable fail2ban
systemctl restart fail2ban
log_success "fail2ban configured"

# =============================================================================
# Step 6: Configure Log Rotation
# =============================================================================
log_info "Configuring log rotation..."
cat > /etc/logrotate.d/enterprise-dashboard << 'LOGROTATE'
/opt/enterprise-dashboard/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
    maxsize 100M
    dateext
    dateformat -%Y-%m-%d
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
    maxsize 100M
    dateext
    dateformat -%Y-%m-%d
}
LOGROTATE

logrotate -f /etc/logrotate.conf || true
log_success "Log rotation configured"

# =============================================================================
# Step 7: Clone Repository
# =============================================================================
log_info "Setting up application..."
if [[ -d "$DEPLOY_DIR" ]]; then
  log_warn "Directory $DEPLOY_DIR already exists, pulling latest changes"
  cd "$DEPLOY_DIR"
  git pull origin main
else
  git clone https://github.com/yourorg/enterprise-dashboard.git "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# Create necessary directories
mkdir -p "$DEPLOY_DIR/logs"
mkdir -p "$DEPLOY_DIR/deploy/ssl"
mkdir -p "$DEPLOY_DIR/deploy/letsencrypt"
mkdir -p "$DEPLOY_DIR/backups"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
log_success "Repository cloned to $DEPLOY_DIR"

# =============================================================================
# Step 8: Configure Environment Variables
# =============================================================================
log_info "Setting up environment variables..."
if [[ ! -f "$DEPLOY_DIR/.env" ]]; then
  cat > "$DEPLOY_DIR/.env" << ENV
# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
POSTGRES_USER=enterprise_admin
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=enterprise_dashboard

# Redis
REDIS_PASSWORD=$(openssl rand -hex 16)

# DeepSeek AI
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Email
SENDGRID_API_KEY=
FROM_EMAIL=admin@${DOMAIN}

# OAuth
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=

# CORS
CORS_ORIGINS=https://${DOMAIN}
ALLOWED_HOSTS=${DOMAIN}

# Frontend
VITE_API_URL=/api
VITE_WS_URL=/ws

# Domain
DOMAIN=${DOMAIN}
ENV

  chmod 600 "$DEPLOY_DIR/.env"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/.env"
  log_success "Environment file created at $DEPLOY_DIR/.env"
  log_warn "Please review $DEPLOY_DIR/.env and update any missing values"
else
  log_warn "Environment file already exists, skipping"
fi

# =============================================================================
# Step 9: Setup SSL with Let's Encrypt
# =============================================================================
log_info "Setting up SSL certificate..."
if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  certbot certonly --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domain "$DOMAIN" \
    --domain "www.$DOMAIN" \
    || log_warn "SSL certificate setup failed. Run deploy/ssl-setup.sh manually"
else
  log_success "SSL certificate already exists"
fi

# Set up auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
log_success "SSL auto-renewal configured"

# Copy certificates for Docker Nginx
if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$DEPLOY_DIR/deploy/ssl/"
  cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$DEPLOY_DIR/deploy/ssl/"
  cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$DEPLOY_DIR/deploy/ssl/"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/deploy/ssl"
  log_success "SSL certificates copied to Docker volume"
fi

# =============================================================================
# Step 10: Setup Monitoring
# =============================================================================
log_info "Setting up basic monitoring..."

# Install netdata
if ! command -v netdata &>/dev/null; then
  bash <(curl -Ss https://my-netdata.io/kickstart.sh) --disable-telemetry --non-interactive
  log_success "Netdata monitoring installed"
fi

# System monitoring script
cat > "$DEPLOY_DIR/deploy/node-exporter.sh" << 'MONITOR'
#!/usr/bin/env bash
while true; do
  CPU=$(awk '{u=$2+$4; t=$2+$4+$5; if (NR==1){u1=u; t1=t;} else print ($2+$4-u1) * 100 / (t-t1) "%";}' <(grep 'cpu ' /proc/stat) <(sleep 1;grep 'cpu ' /proc/stat))
  MEM=$(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2}')
  DISK=$(df -h / | awk 'NR==2{print $5}')
  echo "{\"timestamp\":\"$(date -Iseconds)\",\"cpu\":\"$CPU\",\"memory\":\"$MEM\",\"disk\":\"$DISK\"}" >> /opt/enterprise-dashboard/logs/system-metrics.log
  sleep 60
done
MONITOR

chmod +x "$DEPLOY_DIR/deploy/node-exporter.sh"

# Create systemd service for metrics
cat > /etc/systemd/system/enterprise-metrics.service << 'SYSTEMD'
[Unit]
Description=Enterprise Dashboard System Metrics
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/enterprise-dashboard/deploy/node-exporter.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable enterprise-metrics
systemctl start enterprise-metrics
log_success "System metrics monitoring configured"

# =============================================================================
# Step 11: Setup Backup Cron
# =============================================================================
log_info "Configuring automated backups..."
cat > /etc/cron.d/enterprise-backup << CRON
# Enterprise Dashboard - Daily backup at 2 AM
0 2 * * * root /opt/enterprise-dashboard/deploy/backup.sh > /var/log/enterprise-backup.log 2>&1
CRON

chmod 644 /etc/cron.d/enterprise-backup
log_success "Backup cron job configured"

# =============================================================================
# Step 12: Run Docker Compose
# =============================================================================
log_info "Starting Docker containers..."
cd "$DEPLOY_DIR"
docker compose pull
docker compose up -d --remove-orphans
log_success "Docker containers started"

# =============================================================================
# Step 13: Configure Docker System Prune
# =============================================================================
cat > /etc/cron.d/docker-cleanup << 'CRON'
# Docker cleanup - run weekly at 4 AM Sunday
0 4 * * 0 root docker system prune -af --filter "until=72h" > /dev/null 2>&1
CRON

chmod 644 /etc/cron.d/docker-cleanup
log_success "Docker cleanup cron configured"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================================="
echo -e "${GREEN}Enterprise Admin Dashboard - Setup Complete!${NC}"
echo "============================================================================="
echo ""
echo -e "${BLUE}Dashboard URL:${NC}     https://$DOMAIN"
echo -e "${BLUE}API URL:${NC}           https://$DOMAIN/api"
echo -e "${BLUE}Health Check:${NC}      https://$DOMAIN/api/health"
echo -e "${BLUE}Netdata Monitor:${NC}   http://$DOMAIN:19999"
echo ""
echo -e "${BLUE}Deploy User:${NC}       $DEPLOY_USER"
echo -e "${BLUE}Deploy Directory:${NC}  $DEPLOY_DIR"
echo -e "${BLUE}Environment File:${NC}  $DEPLOY_DIR/.env"
echo -e "${BLUE}Backup Dir:${NC}        $DEPLOY_DIR/backups"
echo ""
echo -e "${YELLOW}Important Next Steps:${NC}"
echo "  1. Review and update $DEPLOY_DIR/.env with your API keys"
echo "  2. Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "  3. Configure DNS: A record for $DOMAIN pointing to server IP"
echo "  4. Run deploy/ssl-setup.sh if SSL was not configured"
echo "  5. Set up monitoring alerting in deploy/monitoring.sh"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View logs:        docker compose -f $DEPLOY_DIR/docker-compose.yml logs -f"
echo "  Restart services: docker compose -f $DEPLOY_DIR/docker-compose.yml restart"
echo "  Run backup:       sudo $DEPLOY_DIR/deploy/backup.sh"
echo "  Health check:     $DEPLOY_DIR/deploy/healthcheck.sh"
echo "============================================================================="
