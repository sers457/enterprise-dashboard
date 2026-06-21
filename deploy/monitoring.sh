#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Enterprise Admin Dashboard - Monitoring Setup Script
# =============================================================================
# Sets up Prometheus, Grafana, Loki/Promtail for comprehensive monitoring.
#
# Usage:
#   chmod +x monitoring.sh
#   ./monitoring.sh [--domain dashboard.yourdomain.com]
#   ./monitoring.sh --enable-alertmanager
# =============================================================================

DOMAIN="${DOMAIN:-localhost}"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-admin}"
ENABLE_ALERTMANAGER="${ENABLE_ALERTMANAGER:-false}"
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# =============================================================================
# Step 1: Create Docker Compose for Monitoring Stack
# =============================================================================
log_info "Creating monitoring stack configuration..."

MONITORING_COMPOSE="${MONITORING_DIR}/docker-compose.monitoring.yml"

cat > "$MONITORING_COMPOSE" << 'COMPOSE'
version: "3.8"

networks:
  monitoring:
    driver: bridge
  backend:
    external: true

volumes:
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  loki_data:
    driver: local

services:
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: enterprise-prometheus
    restart: unless-stopped
    networks:
      - monitoring
      - backend
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
      - ./alert-rules.yml:/etc/prometheus/alert-rules.yml:ro
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=30d"
      - "--web.console.libraries=/usr/share/prometheus/console_libraries"
      - "--web.console.templates=/usr/share/prometheus/consoles"
      - "--web.enable-lifecycle"
    ports:
      - "9090:9090"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 5s
      retries: 3

  grafana:
    image: grafana/grafana:10.2.2
    container_name: enterprise-grafana
    restart: unless-stopped
    networks:
      - monitoring
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml:ro
      - ./grafana-dashboard.json:/etc/grafana/provisioning/dashboards/dashboard.json:ro
      - ./grafana-dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml:ro
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
      GF_SERVER_ROOT_URL: https://${DOMAIN}/grafana
      GF_AUTH_DISABLE_LOGIN_FORM: "false"
      GF_AUTH_ANONYMOUS_ENABLED: "false"
      GF_SERVER_ENABLE_GZIP: "true"
      GF_METRICS_ENABLED: "true"
      GF_METRICS_BASIC_AUTH_USERNAME: grafana
      GF_METRICS_BASIC_AUTH_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  loki:
    image: grafana/loki:2.9.2
    container_name: enterprise-loki
    restart: unless-stopped
    networks:
      - monitoring
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml:ro
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    ports:
      - "3100:3100"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3100/ready"]
      interval: 30s
      timeout: 5s
      retries: 3

  promtail:
    image: grafana/promtail:2.9.2
    container_name: enterprise-promtail
    restart: unless-stopped
    networks:
      - monitoring
      - backend
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml

  node_exporter:
    image: prom/node-exporter:v1.6.1
    container_name: enterprise-node-exporter
    restart: unless-stopped
    networks:
      - monitoring
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.sysfs=/host/sys"
      - "--path.rootfs=/rootfs"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    ports:
      - "9100:9100"

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    container_name: enterprise-cadvisor
    restart: unless-stopped
    networks:
      - monitoring
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    ports:
      - "8080:8080"
COMPOSE

# Create Grafana datasources config
cat > "${MONITORING_DIR}/grafana-datasources.yml" << 'DS'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    orgId: 1
    url: http://prometheus:9090
    basicAuth: false
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "30s"
      httpMethod: "POST"

  - name: Loki
    type: loki
    access: proxy
    orgId: 1
    url: http://loki:3100
    basicAuth: false
    isDefault: false
    editable: true
    jsonData:
      timeout: 60
      maxLines: 1000

  - name: PostgreSQL
    type: postgres
    access: proxy
    orgId: 1
    url: postgres:5432
    user: enterprise_admin
    secureJsonData:
      password: ${POSTGRES_PASSWORD}
    jsonData:
      database: enterprise_dashboard
      sslmode: disable
      timeInterval: "60s"
DS

# Create Grafana dashboards provisioning config
cat > "${MONITORING_DIR}/grafana-dashboards.yml" << 'DASHBOARDS'
apiVersion: 1
providers:
  - name: "Enterprise Dashboard"
    orgId: 1
    folder: ""
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards
DASHBOARDS

# Create Loki config
cat > "${MONITORING_DIR}/loki-config.yml" << 'LOKI'
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9095
  log_level: info

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s
  max_transfer_retries: 0
  wal:
    dir: /loki/wal

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/index_cache
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

compactor:
  working_directory: /loki/compactor
  shared_store: filesystem

limits_config:
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 336h

ruler:
  storage:
    type: local
    local:
      directory: /loki/rules
  rule_path: /loki/rules-temp
  alertmanager_url: http://alertmanager:9093
  ring:
    kvstore:
      store: inmemory
  enable_api: true
LOKI

# Create Promtail config
cat > "${MONITORING_DIR}/promtail-config.yml" << 'PROMTAIL'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*.log

  - job_name: containers
    pipeline_stages:
      - docker: {}
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/**/*.log

  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log

  - job_name: backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend
          __path__: /opt/enterprise-dashboard/logs/*.log
PROMTAIL

# Create alert rules
cat > "${MONITORING_DIR}/alert-rules.yml" << 'ALERTS'
groups:
  - name: enterprise-dashboard
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
          team: infra
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes (current: {{ $value }}%)"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
          team: infra
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80% (current: {{ $value }}%)"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 20
        for: 5m
        labels:
          severity: critical
          team: infra
        annotations:
          summary: "Low disk space"
          description: "Disk usage is above 80% (available: {{ $value }}%)"

      - alert: ServiceDown
        expr: up{job=~"backend|frontend"} == 0
        for: 1m
        labels:
          severity: critical
          team: infra
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for over 1 minute"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High HTTP error rate"
          description: "Error rate is above 5% for 5 minutes (current: {{ $value }}%)"

      - alert: APIResponseTimeSlow
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "API response time is slow"
          description: "95th percentile response time is above 2 seconds (current: {{ $value }}s)"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_database_numbackends > 50
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High database connections"
          description: "Database connections are above 50 (current: {{ $value }})"

      - alert: FailedLogins
        expr: rate(failed_login_attempts_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
          team: security
        annotations:
          summary: "Multiple failed login attempts"
          description: "Failed login rate is above 10/5min (current: {{ $value }})"
ALERTS

log_success "Monitoring configuration created at $MONITORING_DIR"

# =============================================================================
# Step 2: Deploy monitoring stack
# =============================================================================
log_info "Deploying monitoring stack..."
cd "$MONITORING_DIR"

docker compose -f "$MONITORING_COMPOSE" pull
docker compose -f "$MONITORING_COMPOSE" up -d

log_success "Monitoring stack deployed"

# =============================================================================
# Step 3: Setup Alertmanager (optional)
# =============================================================================
if [[ "$ENABLE_ALERTMANAGER" == "true" ]]; then
  log_info "Configuring Alertmanager..."

  cat > "${MONITORING_DIR}/alertmanager.yml" << 'ALERTMGR'
route:
  group_by: ['alertname', 'team']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        team: infra
      receiver: infra-team
    - match:
        team: backend
      receiver: backend-team
    - match:
        team: security
      receiver: security-team

receivers:
  - name: infra-team
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#infra-alerts'
        title: '{{ template "slack.title" . }}'
        text: '{{ template "slack.text" . }}'
    email_configs:
      - to: infra@yourcompany.com
        from: alertmanager@yourcompany.com
        smarthost: smtp.sendgrid.net:587
        auth_username: apikey
        auth_password: ${SENDGRID_API_KEY}

  - name: backend-team
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#backend-alerts'
        title: '{{ template "slack.title" . }}'
        text: '{{ template "slack.text" . }}'

  - name: security-team
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#security-alerts'
        title: '{{ template "slack.title" . }}'
        text: '{{ template "slack.text" . }}'

templates:
  - '/etc/alertmanager/templates/*.tmpl'
ALERTMGR

  # Add alertmanager to compose
  cat >> "$MONITORING_COMPOSE" << 'ALERTMGR_SERVICE'

  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: enterprise-alertmanager
    restart: unless-stopped
    networks:
      - monitoring
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager_data:/alertmanager
    command:
      - "--config.file=/etc/alertmanager/alertmanager.yml"
      - "--storage.path=/alertmanager"
      - "--web.external-url=https://${DOMAIN}/alertmanager"
    ports:
      - "9093:9093"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:9093/-/healthy"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  alertmanager_data:
    driver: local
ALERTMGR_SERVICE

  docker compose -f "$MONITORING_COMPOSE" up -d alertmanager
  log_success "Alertmanager deployed"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================================="
echo -e "${GREEN}Monitoring Stack Deployed Successfully!${NC}"
echo "============================================================================="
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  Grafana:     http://localhost:3000 (admin:${GRAFANA_ADMIN_PASSWORD})"
echo "  Prometheus:  http://localhost:9090"
echo "  Loki:        http://localhost:3100"
echo "  Promtail:    http://localhost:9080"
echo "  Node Exporter: http://localhost:9100"
echo "  cAdvisor:    http://localhost:8080"
if [[ "$ENABLE_ALERTMANAGER" == "true" ]]; then
  echo "  Alertmanager: http://localhost:9093"
fi
echo ""
echo -e "${BLUE}Dashboards:${NC}"
echo "  Enterprise Dashboard Metrics: Grafana -> Dashboards"
echo ""
echo -e "${YELLOW}To integrate with main docker-compose:${NC}"
echo "  docker compose -f docker-compose.yml -f deploy/docker-compose.monitoring.yml up -d"
echo "============================================================================="
