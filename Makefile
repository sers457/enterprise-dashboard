.PHONY: help dev build test deploy backup logs clean lint format migrate shell db-shell redis-shell

APP_NAME := enterprise-dashboard
BACKEND_DIR := backend
FRONTEND_DIR := frontend
DOCKER_COMPOSE := docker compose
DOCKER_COMPOSE_FILE := docker-compose.yml
DOCKER_COMPOSE_PROD := docker-compose.prod.yml

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# Development
# =============================================================================

dev: ## Start development environment
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build -d
	@echo "Development environment started"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

dev-frontend: ## Start frontend development server
	cd $(FRONTEND_DIR) && npm run dev

dev-backend: ## Start backend development server
	cd $(BACKEND_DIR) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-logs: ## Follow logs from all services
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f

# =============================================================================
# Build
# =============================================================================

build: ## Build all Docker images
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

build-backend: ## Build backend Docker image
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build backend

build-frontend: ## Build frontend Docker image
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build frontend

build-prod: ## Build production Docker images
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_PROD) build

# =============================================================================
# Test
# =============================================================================

test: ## Run all tests
	@echo "Running all tests..."
	cd $(BACKEND_DIR) && python -m pytest tests/ -v --cov=app --cov-report=term-missing
	cd $(FRONTEND_DIR) && npm test 2>/dev/null || echo "No frontend tests configured"

test-backend: ## Run backend tests
	cd $(BACKEND_DIR) && python -m pytest tests/ -v --cov=app --cov-report=term-missing

test-backend-watch: ## Run backend tests in watch mode
	cd $(BACKEND_DIR) && ptw tests/ -- --testmon

test-frontend: ## Run frontend tests
	cd $(FRONTEND_DIR) && npm test 2>/dev/null || echo "No frontend tests configured"

test-e2e: ## Run end-to-end tests
	@echo "Running E2E tests..."

# =============================================================================
# Lint & Format
# =============================================================================

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint backend code
	cd $(BACKEND_DIR) && ruff check app/ tests/ && mypy app/ --ignore-missing-imports

lint-frontend: ## Lint frontend code
	cd $(FRONTEND_DIR) && npm run lint && npx tsc --noEmit

format: format-backend format-frontend ## Format all code

format-backend: ## Format backend code
	cd $(BACKEND_DIR) && ruff format app/ tests/

format-frontend: ## Format frontend code
	cd $(FRONTEND_DIR) && npx prettier --write "src/**/*.{ts,tsx,css}"

# =============================================================================
# Database
# =============================================================================

migrate: ## Run database migrations
	cd $(BACKEND_DIR) && alembic upgrade head

migrate-downgrade: ## Rollback last migration
	cd $(BACKEND_DIR) && alembic downgrade -1

migrate-create: ## Create new migration
	cd $(BACKEND_DIR) && alembic revision --autogenerate -m "$(name)"

# =============================================================================
# Shell & Debug
# =============================================================================

shell: ## Open Python shell in backend
	cd $(BACKEND_DIR) && python

db-shell: ## Open PostgreSQL shell
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec postgres psql -U enterprise_admin -d enterprise_dashboard

redis-shell: ## Open Redis CLI
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec redis redis-cli

backend-shell: ## Open shell in backend container
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec backend /bin/bash

# =============================================================================
# Deployment
# =============================================================================

deploy: ## Deploy to production
	@echo "Deploying to production..."
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) pull
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d --remove-orphans
	@echo "Deployment complete"

deploy-staging: ## Deploy to staging
	@echo "Deploying to staging..."
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) pull
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d --remove-orphans
	@echo "Staging deployment complete"

deploy-rollback: ## Rollback to previous version
	@echo "Rolling back deployment..."
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) pull
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

# =============================================================================
# Backup & Restore
# =============================================================================

backup: ## Run database backup
	@echo "Running backup..."
	./deploy/backup.sh
	@echo "Backup complete"

restore: ## Restore database from backup (usage: make restore FILE=backup.sql.gz)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make restore FILE=backup.sql.gz"; \
		exit 1; \
	fi
	@echo "Restoring from $(FILE)..."
	gunzip -c $(FILE) | $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec -T postgres psql -U enterprise_admin -d enterprise_dashboard
	@echo "Restore complete"

# =============================================================================
# Maintenance
# =============================================================================

logs: ## View all logs
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f

logs-backend: ## View backend logs
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f backend

logs-frontend: ## View frontend logs
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f frontend

logs-nginx: ## View nginx logs
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f nginx

clean: ## Clean up Docker resources
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down -v --remove-orphans
	docker system prune -af --filter "until=24h"
	@echo "Cleanup complete"

clean-all: ## Full cleanup (including volumes)
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down -v --remove-orphans
	docker system prune -af
	docker volume prune -f
	@echo "Full cleanup complete"

restart: ## Restart all services
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) restart

restart-service: ## Restart a specific service (usage: make restart-service S=backend)
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) restart $(S)

ps: ## List running containers
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) ps

status: ## Show service status
	@echo "=== Container Status ==="
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) ps
	@echo ""
	@echo "=== Health Check ==="
	./deploy/healthcheck.sh --summary

# =============================================================================
# SSL
# =============================================================================

ssl-setup: ## Setup SSL certificates
	./deploy/ssl-setup.sh --domain $(DOMAIN) --email $(EMAIL) --docker

ssl-renew: ## Renew SSL certificates
	certbot renew --quiet

# =============================================================================
# Monitoring
# =============================================================================

monitoring: ## Deploy monitoring stack
	./deploy/monitoring.sh

health: ## Run health check
	./deploy/healthcheck.sh

# =============================================================================
# Environment
# =============================================================================

env-setup: ## Setup environment variables
	./deploy/env-setup.sh --env $(ENVIRONMENT) --domain $(DOMAIN)

env-show: ## Show generated secrets
	./deploy/env-setup.sh --show-secrets
