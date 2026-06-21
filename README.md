# Enterprise Admin Dashboard

A modern, full-featured enterprise administration dashboard built with FastAPI, React, PostgreSQL, and Redis. Features AI-powered analytics, real-time monitoring, multi-factor authentication, and comprehensive business management modules.

## Screenshots

![Dashboard Overview](screenshots/dashboard.png)
*Dashboard overview with key metrics and AI insights*

![Analytics Module](screenshots/analytics.png)
*Advanced analytics with interactive charts and predictive forecasting*

![CRM Module](screenshots/crm.png)
*Customer relationship management with lead tracking*

![Finance Module](screenshots/finance.png)
*Financial management with invoicing and expense tracking*

## Features

### Core Platform
- **Role-Based Access Control (RBAC)** - Granular permissions with role management
- **Multi-Factor Authentication** - TOTP-based 2FA with recovery codes
- **OAuth2 Integration** - Google and GitHub single sign-on
- **Real-Time Notifications** - WebSocket-based live updates
- **Activity Logging** - Comprehensive audit trail with search
- **Rate Limiting** - Per-user and per-endpoint rate limiting
- **Dark/Light Theme** - Full theme support with custom theming

### Analytics Module
- **Interactive Dashboards** - Drag-and-drop dashboard builder
- **Real-Time Metrics** - Live data streaming via WebSockets
- **Custom Reports** - Scheduled and on-demand report generation
- **Data Export** - CSV, Excel, PDF export formats
- **Predictive Analytics** - ML-based forecasting and trend analysis
- **3D Data Visualization** - Three.js-powered 3D charts and graphs

### CRM Module
- **Contact Management** - Full contact lifecycle management
- **Lead Tracking** - Pipeline management with stages
- **Deal Management** - Sales pipeline with forecasting
- **Activity Timeline** - Complete interaction history
- **Email Integration** - SendGrid-powered email campaigns
- **Task Management** - Assignable tasks with deadlines

### Finance Module
- **Invoice Management** - Create, send, and track invoices
- **Expense Tracking** - Categorized expense management
- **Financial Reports** - P&L, balance sheets, cash flow
- **Budget Management** - Department and project budgets
- **Tax Calculations** - Automated tax computation
- **Multi-Currency** - Support for 150+ currencies

### Inventory Module
- **Stock Management** - Real-time inventory tracking
- **Warehouse Management** - Multi-warehouse support
- **Supply Chain** - Purchase order management
- **Product Catalog** - Categorized product management
- **Barcode/RFID** - Scanning and tracking support
- **Low Stock Alerts** - Automated reorder notifications

### AI Features
- **Intelligent Insights** - AI-powered business recommendations
- **Predictive Analytics** - Forecast trends and outcomes
- **Natural Language Queries** - Query data using plain English
- **Automated Reporting** - AI-generated business reports
- **Anomaly Detection** - Automatic anomaly identification
- **Smart Search** - AI-enhanced global search
- **Chat Assistant** - Conversational AI helper

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **Routing:** React Router v6
- **3D Graphics:** Three.js with React Three Fiber
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.11)
- **ORM:** SQLAlchemy 2.0 with async support
- **Database Migrations:** Alembic
- **Authentication:** JWT (python-jose) with OAuth2
- **Password Hashing:** passlib with bcrypt
- **Task Queue:** Celery with Redis broker
- **WebSocket:** FastAPI WebSockets with SSE
- **API Documentation:** OpenAPI/Swagger (auto-generated)
- **Validation:** Pydantic v2

### AI Integration
- **LLM Provider:** DeepSeek API
- **AI Features:** Natural language queries, predictive analytics, automated reporting, anomaly detection

### Database & Cache
- **Primary Database:** PostgreSQL 15
- **Cache Layer:** Redis 7
- **Async Driver:** asyncpg
- **Connection Pooling:** SQLAlchemy pool

### DevOps
- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions
- **Web Server:** Nginx
- **Monitoring:** Prometheus & Grafana
- **Logging:** Loki & Promtail
- **SSL:** Let's Encrypt with Certbot

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          Cloudflare                          │
│                   (CDN / WAF / API Gateway)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                         Nginx                                │
│              (Reverse Proxy / SSL / Rate Limiting)           │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                  │
┌────────▼────────┐               ┌─────────▼──────────┐
│    Frontend      │               │     Backend API     │
│   React + Vite   │               │  FastAPI + Uvicorn  │
│   Port 3000      │               │  Port 8000          │
└────────┬────────┘               └─────────┬──────────┘
         │                                  │
         │                    ┌──────────────┼──────────────┐
         │                    │              │              │
         │           ┌────────▼───┐  ┌───────▼──────┐  ┌───▼────────┐
         │           │ PostgreSQL │  │    Redis     │  │   Celery   │
         │           │   Port 5432│  │   Port 6379  │  │  Workers   │
         │           └────────────┘  └──────────────┘  └────────────┘
         │
         │           ┌─────────────────────────────────────┐
         └──────────►│         Monitoring Stack            │
                     │  Prometheus + Grafana + Loki        │
                     └─────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20)
- Python 3.11+
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 15 (for local setup)
- Redis 7 (for local setup)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourorg/enterprise-dashboard.git
   cd enterprise-dashboard
   ```

2. **Backend setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your database credentials
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open the application**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs
   - Admin UI: http://localhost:8000/admin

### Docker Setup (Recommended)

```bash
# Start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Access the application
# Frontend: http://localhost
# API: http://localhost/api
# API Docs: http://localhost/api/docs
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | - | Django-style secret key for JWT signing |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `ENVIRONMENT` | No | `development` | Runtime environment |
| `DEBUG` | No | `true` | Debug mode |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | JWT token expiry |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token expiry |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Allowed CORS origins |
| `DEEPSEEK_API_KEY` | No | - | DeepSeek AI API key |
| `SENDGRID_API_KEY` | No | - | SendGrid email API key |
| `OAUTH_GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `OAUTH_GITHUB_CLIENT_ID` | No | - | GitHub OAuth client ID |

## Project Structure

```
enterprise-dashboard/
├── backend/
│   ├── app/
│   │   ├── ai/              # AI integration (DeepSeek)
│   │   ├── api/             # API endpoints (FastAPI routers)
│   │   ├── core/            # Core configuration, security, database
│   │   ├── middleware/       # Custom middleware
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic layer
│   │   └── websocket/       # WebSocket handlers
│   ├── migrations/          # Alembic migrations
│   ├── tests/               # Test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── 3d/              # Three.js 3D components
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand state stores
│   │   ├── styles/          # Global styles
│   │   └── types/           # TypeScript types
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── Dockerfile
├── deploy/
│   ├── setup-vps.sh         # VPS provisioning script
│   ├── setup-aws.sh         # AWS infrastructure script
│   ├── backup.sh            # Database backup script
│   ├── monitoring.sh        # Monitoring stack setup
│   ├── ssl-setup.sh         # SSL certificate setup
│   ├── env-setup.sh         # Environment configuration
│   ├── healthcheck.sh       # Service health check
│   └── prometheus.yml       # Prometheus configuration
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # Continuous Integration
│   │   ├── cd.yml           # Continuous Deployment
│   │   ├── deploy-aws.yml   # AWS ECS deployment
│   │   ├── deploy-railway.yml # Railway deployment
│   │   └── deploy-render.yml  # Render deployment
│   └── dependabot.yml       # Dependency updates
├── docker-compose.yml       # Development Docker Compose
├── docker-compose.prod.yml  # Production Docker Compose
├── Makefile                 # Common command shortcuts
└── README.md
```

## API Documentation

Full API documentation is available at `/api/docs` (Swagger UI) or `/api/redoc` (Redoc) when the server is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/refresh` | Token refresh |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/analytics/dashboard` | Dashboard metrics |
| GET | `/api/crm/leads` | CRM leads list |
| GET | `/api/finance/invoices` | Finance invoices |
| GET | `/api/inventory/products` | Inventory products |
| POST | `/api/ai/query` | AI natural language query |
| WS | `/ws/notifications` | Real-time notifications |

## AI Features Documentation

### Natural Language Queries
Query your business data using natural language:
```python
POST /api/ai/query
{
  "query": "What were our top 5 products by revenue last month?"
}
```

### Predictive Analytics
Get AI-powered forecasts for your business metrics:
```python
POST /api/ai/predict
{
  "metric": "revenue",
  "periods": 12,
  "interval": "month"
}
```

### Automated Reports
Generate comprehensive business reports with AI:
```python
POST /api/ai/report
{
  "type": "monthly_summary",
  "period": "2024-01",
  "format": "pdf"
}
```

### Anomaly Detection
Automatically detect unusual patterns in your data:
```python
POST /api/ai/anomalies
{
  "dataset": "transactions",
  "sensitivity": 0.95
}
```

## Deployment

### Docker Deployment
```bash
# Production deployment
docker compose -f docker-compose.prod.yml up -d --build

# With monitoring stack
docker compose -f docker-compose.prod.yml -f deploy/docker-compose.monitoring.yml up -d
```

### VPS Deployment
```bash
# Run the VPS setup script
sudo ./deploy/setup-vps.sh --domain yourdomain.com --email admin@yourdomain.com
```

### AWS Deployment
```bash
# Setup AWS infrastructure
./deploy/setup-aws.sh --profile prod --region us-east-1

# Or use GitHub Actions workflow
# Push to main branch triggers automatic deployment
```

### Railway / Render
Click the buttons below for one-click deployment:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/enterprise-dashboard)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourorg/enterprise-dashboard)

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

### CI Pipeline (`.github/workflows/ci.yml`)
- Triggered by push/PR to main
- Lints and builds frontend (Node 18, 20)
- Lints and tests backend (Python 3.11)
- Runs database migrations
- Builds Docker images
- Uploads build artifacts

### CD Pipeline (`.github/workflows/cd.yml`)
- Triggered by push to main (after CI passes)
- Builds and pushes Docker images to GHCR/DockerHub
- Deploys to production server via SSH
- Runs health checks
- Supports automatic rollback on failure

## Security Features

- **Password Hashing:** bcrypt with configurable work factor
- **JWT Tokens:** Signed with HS256, short-lived access tokens
- **MFA/2FA:** TOTP-based with recovery codes
- **OAuth2:** Google and GitHub SSO
- **Rate Limiting:** Per-endpoint and per-user limits
- **CORS:** Strict origin validation
- **Security Headers:** HSTS, CSP, XSS protection
- **Input Validation:** Pydantic schema validation
- **SQL Injection:** ORM-based query building
- **CSRF Protection:** Token-based CSRF protection
- **Audit Logging:** All sensitive operations logged
- **Encryption:** AES-256 for sensitive data at rest

## Testing

```bash
# Run all tests
make test

# Backend tests only
make test-backend

# Frontend tests only
make test-frontend

# Run tests with coverage
cd backend && pytest tests/ -v --cov=app --cov-report=term-missing

# Watch mode
cd backend && ptw tests/
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript strict mode for frontend
- Write tests for new features
- Update API documentation for endpoint changes
- Run linting before committing
- Use conventional commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation:** [docs.enterprise-dashboard.com](https://docs.enterprise-dashboard.com)
- **Issue Tracker:** [GitHub Issues](https://github.com/yourorg/enterprise-dashboard/issues)
- **Discord:** [Join our Discord](https://discord.gg/enterprise-dashboard)
- **Email:** support@enterprise-dashboard.com

---

Built with ❤️ by the Enterprise Dashboard Team
