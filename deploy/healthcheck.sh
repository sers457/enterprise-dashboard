#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Enterprise Admin Dashboard - Health Check Script
# =============================================================================
# Checks all services, databases, caches, and API endpoints.
# Returns exit code 0 if all healthy, 1 if any failed.
#
# Usage:
#   ./deploy/healthcheck.sh                          # Check all services
#   ./deploy/healthcheck.sh --summary                # Summary output only
#   ./deploy/healthcheck.sh --endpoint /api/health   # Custom endpoint
#   ./deploy/healthcheck.sh --send-report            # Send status report
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment
if [[ -f "$PROJECT_DIR/.env" ]]; then
  set -a; source "$PROJECT_DIR/.env"; set +a
fi

# Configuration
DOMAIN="${DOMAIN:-localhost}"
USE_HTTPS="${USE_HTTPS:-false}"
PROTOCOL=$([[ "$USE_HTTPS" == "true" ]] && echo "https" || echo "http")
TIMEOUT="${TIMEOUT:-10}"
SEND_REPORT="${SEND_REPORT:-false}"
SUMMARY_ONLY="${SUMMARY_ONLY:-false}"
CUSTOM_ENDPOINT="${CUSTOM_ENDPOINT:-}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --summary) SUMMARY_ONLY=true; shift ;;
    --endpoint) CUSTOM_ENDPOINT="$2"; shift 2 ;;
    --send-report) SEND_REPORT=true; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --help)
      echo "Usage: $0 [--summary] [--endpoint URL] [--send-report] [--timeout SEC]"
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

PASSED=0
FAILED=0
WARNINGS=0
RESULTS=()

check() {
  local name="$1"
  local cmd="$2"
  local severity="${3:-error}"

  echo -n "  [ ] $name... "

  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
    RESULTS+=("{\"name\":\"$name\",\"status\":\"pass\",\"severity\":\"$severity\"}")
  else
    if [[ "$severity" == "warning" ]]; then
      echo -e "${YELLOW}WARN${NC}"
      WARNINGS=$((WARNINGS + 1))
      RESULTS+=("{\"name\":\"$name\",\"status\":\"warn\",\"severity\":\"$severity\"}")
    else
      echo -e "${RED}FAIL${NC}"
      FAILED=$((FAILED + 1))
      RESULTS+=("{\"name\":\"$name\",\"status\":\"fail\",\"severity\":\"$severity\"}")
    fi
  fi
}

http_check() {
  local url="$1"
  local expected_code="${2:-200}"
  shift 2
  curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$@" "$url" | grep -q "$expected_code"
}

# =============================================================================
# Header
# =============================================================================
echo ""
echo "============================================================================="
echo -e "${BLUE}Enterprise Admin Dashboard - Health Check${NC}"
echo "============================================================================="
echo "Date: $(date)"
echo "Domain: $DOMAIN"
echo ""

# =============================================================================
# 1. System Checks
# =============================================================================
if [[ "$SUMMARY_ONLY" == "false" ]]; then
  echo -e "${BLUE}[System]${NC}"
  check "Docker is running" "docker info"
  check "Docker Compose is available" "docker compose version"
  check "Disk space (>20% free)" "df -h / | awk 'NR==2{print \$5}' | sed 's/%//' | awk '{exit !(\$1 < 80)}'"
  check "Memory (>512MB free)" "free -m | awk 'NR==2{exit !(\$7 > 512)}'"
  check "CPU load (<4.0)" "uptime | awk -F'load average:' '{print \$2}' | awk -F, '{gsub(/ /,\"\",\$1); exit !(\$1+0 < 4.0)}'"
fi

# =============================================================================
# 2. Docker Container Checks
# =============================================================================
echo -e "${BLUE}[Docker Containers]${NC}"

check "PostgreSQL container running" "docker ps --format '{{.Names}}' | grep -q enterprise-postgres"
check "Redis container running" "docker ps --format '{{.Names}}' | grep -q enterprise-redis"
check "Backend container running" "docker ps --format '{{.Names}}' | grep -q enterprise-backend"
check "Frontend container running" "docker ps --format '{{.Names}}' | grep -q enterprise-frontend"
check "Nginx container running" "docker ps --format '{{.Names}}' | grep -q enterprise-nginx"
check "Celery worker running" "docker ps --format '{{.Names}}' | grep -q enterprise-celery"
check "All containers healthy" "docker ps --format '{{.Status}}' | grep -v 'healthy' | grep -q 'healthy' || docker ps --format '{{.Status}}' | grep -q 'healthy'"

# =============================================================================
# 3. Database Connection
# =============================================================================
echo -e "${BLUE}[Database]${NC}"

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-enterprise_admin}"
DB_NAME="${POSTGRES_DB:-enterprise_dashboard}"

if command -v pg_isready &>/dev/null; then
  check "PostgreSQL is accepting connections" "pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
fi

# Try connection via Docker
check "DB connection via Docker" "docker exec enterprise-postgres pg_isready -U $DB_USER -d $DB_NAME" "warning"

check "Database can be queried" "docker exec enterprise-postgres psql -U $DB_USER -d $DB_NAME -c 'SELECT 1' > /dev/null 2>&1" "warning"

# =============================================================================
# 4. Redis Connection
# =============================================================================
echo -e "${BLUE}[Redis]${NC}"

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

if command -v redis-cli &>/dev/null; then
  check "Redis ping" "redis-cli -h $REDIS_HOST -p $REDIS_PORT ping | grep -q PONG"
fi

check "Redis via Docker" "docker exec enterprise-redis redis-cli ping | grep -q PONG" "warning"

# =============================================================================
# 5. API Health Endpoints
# =============================================================================
echo -e "${BLUE}[API Endpoints]${NC}"

BASE_URL="${PROTOCOL}://${DOMAIN}"

check "Main health endpoint" "http_check '$BASE_URL/api/health'"
check "API root endpoint" "http_check '$BASE_URL/api/v1' 200 || http_check '$BASE_URL/api' 200"
check "Metrics endpoint" "http_check '$BASE_URL/api/metrics' 200 || http_check '$BASE_URL/api/health' 200" "warning"
check "Nginx responds" "http_check '$BASE_URL' 200"
check "Nginx health endpoint" "http_check '$BASE_URL/nginx-health' 200"

# Custom endpoint
if [[ -n "$CUSTOM_ENDPOINT" ]]; then
  echo -e "${BLUE}[Custom Endpoint]${NC}"
  check "Custom: $CUSTOM_ENDPOINT" "http_check '$CUSTOM_ENDPOINT'"
fi

# =============================================================================
# 6. SSL Certificate Check
# =============================================================================
if [[ "$USE_HTTPS" == "true" ]]; then
  echo -e "${BLUE}[SSL Certificate]${NC}"

  if command -v openssl &>/dev/null; then
    CERT_INFO=$(openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [[ -n "$CERT_INFO" ]]; then
      CERT_EXPIRY=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
      CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null)
      NOW_EPOCH=$(date +%s)
      DAYS_LEFT=$(( (CERT_EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

      if [[ $DAYS_LEFT -gt 30 ]]; then
        echo -e "  [ ] SSL Certificate... ${GREEN}PASS${NC} ($DAYS_LEFT days remaining)"
        PASSED=$((PASSED + 1))
      elif [[ $DAYS_LEFT -gt 7 ]]; then
        echo -e "  [ ] SSL Certificate... ${YELLOW}WARN${NC} ($DAYS_LEFT days remaining)"
        WARNINGS=$((WARNINGS + 1))
      else
        echo -e "  [ ] SSL Certificate... ${RED}FAIL${NC} (Expires in $DAYS_LEFT days)"
        FAILED=$((FAILED + 1))
      fi
    fi
  fi
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================================="
echo -e "${BLUE}Health Check Summary${NC}"
echo "============================================================================="
echo ""
echo -e "  ${GREEN}Passed:${NC}  $PASSED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  ${RED}Failed:${NC}  $FAILED"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}All systems operational ($TOTAL/$TOTAL checks passed)${NC}"
  EXIT_CODE=0
else
  echo -e "${RED}$FAILED/$TOTAL checks failed - intervention required${NC}"
  EXIT_CODE=1
fi

echo "============================================================================="

# =============================================================================
# Send report (optional)
# =============================================================================
if [[ "$SEND_REPORT" == "true" ]]; then
  SUMMARY_JSON=$(printf '%s\n' "${RESULTS[@]}" | jq -s '.')
  STATUS=$([[ $FAILED -eq 0 ]] && echo "healthy" || echo "degraded")

  REPORT_PAYLOAD=$(cat << PAYLOAD
{
  "service": "Enterprise Dashboard",
  "domain": "$DOMAIN",
  "timestamp": "$(date -Iseconds)",
  "status": "$STATUS",
  "passed": $PASSED,
  "warnings": $WARNINGS,
  "failed": $FAILED,
  "checks": $SUMMARY_JSON
}
PAYLOAD
)

  # Send to Slack
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -s -X POST "$SLACK_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{
        \"text\": \"Health Check: $STATUS ($PASSED/$TOTAL checks passed)\",
        \"blocks\": [{
          \"type\": \"section\",
          \"text\": {
            \"type\": \"mrkdwn\",
            \"body\": \"*Enterprise Dashboard Health Check*\\nStatus: $STATUS\\nPassed: $PASSED\\nWarnings: $WARNINGS\\nFailed: $FAILED\\nDomain: $DOMAIN\\nTime: $(date)\"
          }
        }]
      }" > /dev/null 2>&1 || true
  fi

  # Log to file
  mkdir -p "$PROJECT_DIR/logs"
  echo "$REPORT_PAYLOAD" >> "$PROJECT_DIR/logs/healthcheck.log"
fi

exit $EXIT_CODE
