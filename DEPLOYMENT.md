# Deployment Guide

## Prerequisites

- Docker and Docker Compose v2 installed
- Domain name configured with DNS pointing to your server
- SMTP credentials for email notifications
- DeepSeek API key for AI features
- SendGrid API key for email functionality
- OAuth credentials (Google, GitHub) for SSO

## Environment Setup

1. **Generate secrets and create .env file:**
   ```bash
   ./deploy/env-setup.sh --env production --domain yourdomain.com
   ```

2. **Review and update environment variables:**
   ```bash
   nano .env
   ```

3. **Generate secure secrets manually (alternative):**
   ```bash
   SECRET_KEY=$(openssl rand -hex 32)
   echo "SECRET_KEY=$SECRET_KEY"
   ```

## Docker Deployment

### Development
```bash
docker compose up -d --build
```

### Production
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### With Monitoring Stack
```bash
docker compose -f docker-compose.prod.yml -f deploy/docker-compose.monitoring.yml up -d
```

### Common Docker Commands
```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Scale workers
docker compose up -d --scale celery_worker=4

# Stop and remove everything
docker compose down -v
```

## Manual Deployment

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
cd frontend
npm install
npm run build
# Serve with Nginx or any static file server
```

## Cloud Deployment Guides

### AWS

#### Prerequisites
- AWS CLI installed and configured
- IAM permissions for ECS, ECR, RDS, ElastiCache
- Domain in Route53 (optional)

#### Step 1: Setup Infrastructure
```bash
./deploy/setup-aws.sh --profile prod --region us-east-1
```

#### Step 2: Configure ECS
1. Go to [AWS ECS Console](https://console.aws.amazon.com/ecs)
2. Create task definition with Fargate launch type
3. Configure container definitions (backend:8000, nginx:80)
4. Set environment variables from Secrets Manager
5. Create service with ALB target group

#### Step 3: Setup RDS
1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds)
2. Verify PostgreSQL instance creation
3. Configure security group to allow access from ECS tasks

#### Step 4: Configure ElastiCache
1. Go to [AWS ElastiCache Console](https://console.aws.amazon.com/elasticache)
2. Verify Redis cluster creation
3. Note the endpoint for configuration

#### Step 5: Deploy via CI/CD
Push to main branch triggers automatic deployment via GitHub Actions.

#### Step 6: Configure CloudFront
1. Go to [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront)
2. Create distribution with ALB as origin
3. Configure custom domain and SSL certificate
4. Set error pages to serve index.html for SPA routing

### Azure

#### Prerequisites
- Azure CLI installed
- Azure subscription

#### Setup
```bash
# Login to Azure
az login

# Create resource group
az group create --name enterprise-dashboard --location eastus

# Create container registry
az acr create --resource-group enterprise-dashboard --name enterprisedashboard --sku Basic

# Create AKS cluster
az aks create \
  --resource-group enterprise-dashboard \
  --name enterprise-dashboard-aks \
  --node-count 2 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group enterprise-dashboard --name enterprise-dashboard-aks

# Create PostgreSQL
az postgres flexible-server create \
  --resource-group enterprise-dashboard \
  --name enterprise-dashboard-db \
  --admin-user enterprise_admin \
  --admin-password <password>

# Create Redis
az redis create \
  --resource-group enterprise-dashboard \
  --name enterprise-dashboard-redis \
  --sku Standard \
  --vm-size C1

# Deploy using Helm or kubectl
kubectl apply -f k8s/
```

### Google Cloud

#### Prerequisites
- gcloud CLI installed
- GCP project with billing enabled

#### Setup
```bash
# Login to GCP
gcloud auth login
gcloud config set project your-project-id

# Create GKE cluster
gcloud container clusters create enterprise-dashboard \
  --num-nodes=2 \
  --zone=us-central1-a \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5

# Get credentials
gcloud container clusters get-credentials enterprise-dashboard --zone=us-central1-a

# Create Cloud SQL instance
gcloud sql instances create enterprise-dashboard-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --storage-size=50GB

# Create Memorystore Redis
gcloud redis instances create enterprise-dashboard-redis \
  --size=2 \
  --region=us-central1 \
  --redis-version=redis_7

# Deploy
kubectl apply -f k8s/
```

### DigitalOcean

#### Prerequisites
- DigitalOcean account
- doctl CLI installed
- API token

#### Setup Using App Platform (Simple)
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Configure services:
   - Backend: Dockerfile in `/backend`, HTTP port 8000
   - Frontend: Dockerfile in `/frontend`, HTTP port 80
5. Add managed databases:
   - PostgreSQL (production grade)
   - Redis (production grade)
6. Configure environment variables
7. Deploy

#### Setup Using Droplet (VPS)
```bash
# Create droplet
doctl compute droplet create enterprise-dashboard \
  --region nyc1 \
  --size s-4vcpu-8gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys your-key-id

# Get droplet IP
IP=$(doctl compute droplet get enterprise-dashboard --format PublicIPv4 --no-header)

# Run setup script
ssh root@$IP "curl -sL https://raw.githubusercontent.com/yourorg/enterprise-dashboard/main/deploy/setup-vps.sh | bash -s -- --domain yourdomain.com --email admin@yourdomain.com"
```

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/enterprise-dashboard)

1. Click the "Deploy on Railway" button above
2. Connect your GitHub repository
3. Configure environment variables:
   - Add all required variables from `.env.production.example`
   - Railway automatically provisions PostgreSQL and Redis
4. Deploy

### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourorg/enterprise-dashboard)

1. Click the "Deploy to Render" button
2. Create a Web Service for the backend:
   - Name: `enterprise-dashboard-backend`
   - Runtime: Docker
   - Build Command: `docker build -f Dockerfile -t backend .`
   - Start Command: (handled by Dockerfile)
   - Health Check Path: `/api/health`
3. Create a Static Site for the frontend:
   - Name: `enterprise-dashboard-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Create a PostgreSQL database (Render Dashboard)
5. Create a Redis instance (Render Dashboard)
6. Link environment variables between services
7. Configure custom domain

### Vercel (Frontend Only)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy frontend:
   ```bash
   cd frontend
   vercel --prod
   ```

3. Configure environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your backend URL
   - `VITE_WS_URL`: Your backend WebSocket URL

4. Configure rewrites for SPA routing in `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### VPS (Any Provider)

```bash
# SSH into your server
ssh root@your-server-ip

# Download and run setup script
curl -sL https://raw.githubusercontent.com/yourorg/enterprise-dashboard/main/deploy/setup-vps.sh | bash -s -- \
  --domain yourdomain.com \
  --email admin@yourdomain.com \
  --user deploy \
  --dir /opt/enterprise-dashboard

# Or manually:
sudo ./deploy/setup-vps.sh --domain yourdomain.com --email admin@yourdomain.com
```

## Domain Setup

### DNS Configuration
```dns
# A Record
yourdomain.com.     IN  A      <server-ip>

# CNAME Records
www.yourdomain.com. IN  CNAME  yourdomain.com.
api.yourdomain.com. IN  CNAME  yourdomain.com.

# MX Records (for email)
@                   IN  MX 10 mx.sendgrid.net.
```

### SSL Configuration

```bash
# Using the setup script
sudo ./deploy/ssl-setup.sh --domain yourdomain.com --email admin@yourdomain.com --docker

# For manual SSL management
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Monitoring Setup

```bash
# Deploy full monitoring stack
./deploy/monitoring.sh

# Or use individual components
docker compose -f deploy/docker-compose.monitoring.yml up -d

# Access monitoring tools
# Grafana: http://yourdomain.com:3000 (admin:password)
# Prometheus: http://yourdomain.com:9090
# Loki: http://yourdomain.com:3100
```

### Configure Alerts
1. Open Grafana: `http://yourdomain.com:3000`
2. Go to Alerting > Notification channels
3. Add Slack, Email, or PagerDuty channels
4. Import the pre-configured dashboard from `deploy/grafana-dashboard.json`
5. Set up alert rules based on your thresholds

## Backup Strategy

### Automated Backups
```bash
# Configure daily backup cron
sudo ./deploy/backup.sh

# The script:
# 1. Dumps PostgreSQL database (custom format, compressed)
# 2. Encrypts backup with AES-256 (optional)
# 3. Uploads to S3 (optional)
# 4. Retains 7 days of backups
# 5. Notifies on failure via Slack
```

### Backup Schedule
| Frequency | Backup Type | Retention | Storage |
|-----------|-------------|-----------|---------|
| Daily | Full DB dump | 7 days | Local + S3 |
| Weekly | Full DB dump | 4 weeks | S3 |
| Monthly | Full DB dump | 12 months | S3 |
| Real-time | WAL archiving | 24 hours | Local |

### Restore from Backup
```bash
# List available backups
ls -la backups/

# Restore latest backup
gunzip -c backups/enterprise_dashboard_latest.sql.gz | docker exec -i enterprise-postgres psql -U enterprise_admin -d enterprise_dashboard

# Or using pg_restore for custom format
pg_restore -h localhost -U enterprise_admin -d enterprise_dashboard -v enterprise_dashboard_20240101_020000.sql.gz
```

## Scaling Guide

### Vertical Scaling
- Increase Docker resource limits in `docker-compose.prod.yml`
- Upgrade VPS plan (more CPU, RAM)
- Increase RDS instance size
- Increase Redis node type

### Horizontal Scaling
- Run multiple backend containers behind load balancer
- Scale Celery workers:
  ```bash
  docker compose up -d --scale celery_worker=8
  ```
- Implement read replicas for PostgreSQL
- Use Redis Cluster for distributed caching
- Deploy multiple frontend instances behind CDN

### Database Scaling
1. **Connection Pooling:** Already configured with PgBouncer (or use built-in pool)
2. **Read Replicas:** Create read replicas for analytics queries
3. **Sharding:** Implement application-level sharding for multi-tenant
4. **Connection Limits:**
   - Production: 100 connections
   - Staging: 25 connections
   - Development: 10 connections

### Performance Optimization
- Enable Redis persistence (AOF) for cache durability
- Configure PostgreSQL query optimization (indexes, vacuum)
- Use Nginx caching for static assets
- Implement CDN caching for API responses
- Database query optimization:
  - Add indexes for frequently queried columns
  - Use materialized views for complex aggregations
  - Implement query result caching

## Troubleshooting

### Common Issues

#### Containers won't start
```bash
# Check logs
docker compose logs

# Check if ports are available
netstat -tulpn | grep -E ':80|:443|:8000|:5432|:6379'

# Rebuild images
docker compose build --no-cache
```

#### Database connection error
```bash
# Verify PostgreSQL is running
docker compose exec postgres pg_isready -U enterprise_admin

# Check connection string in .env
grep DATABASE_URL .env

# Restart PostgreSQL
docker compose restart postgres
```

#### Redis connection error
```bash
# Verify Redis is running
docker compose exec redis redis-cli ping

# Check Redis password
docker compose exec redis redis-cli -a yourpassword ping

# Restart Redis
docker compose restart redis
```

#### SSL certificate issues
```bash
# Renew certificates
sudo certbot renew --dry-run
sudo ./deploy/ssl-setup.sh --renew

# Check certificate expiry
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com | openssl x509 -noout -dates

# Verify certificate chain
openssl verify -CAfile deploy/ssl/chain.pem deploy/ssl/fullchain.pem
```

#### DNS/domain issues
```bash
# Check DNS propagation
dig yourdomain.com +short
nslookup yourdomain.com

# Verify Nginx configuration
docker compose exec nginx nginx -t

# Check SSL certificate matches domain
openssl x509 -in deploy/ssl/fullchain.pem -noout -subject
```

#### Performance issues
```bash
# Check resource usage
docker stats

# Monitor PostgreSQL performance
docker compose exec postgres psql -U enterprise_admin -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory usage
docker compose exec redis redis-cli info memory

# Analyze slow queries
docker compose exec postgres psql -U enterprise_admin -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Health Check
```bash
# Run comprehensive health check
./deploy/healthcheck.sh

# Quick API health check
curl https://yourdomain.com/api/health

# Check individual services
docker compose ps
```

### Getting Help
- Open an issue on [GitHub](https://github.com/yourorg/enterprise-dashboard/issues)
- Join our [Discord](https://discord.gg/enterprise-dashboard)
- Email: devops@enterprise-dashboard.com
