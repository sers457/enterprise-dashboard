#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Enterprise Admin Dashboard - AWS Infrastructure Setup Script
# =============================================================================
# This script creates all necessary AWS resources for the enterprise dashboard:
#   - ECS Cluster & Service
#   - ECR Repository
#   - RDS PostgreSQL Instance
#   - ElastiCache Redis
#   - Application Load Balancer
#   - CloudFront CDN
#   - CloudWatch Alarms
#
# Prerequisites:
#   - AWS CLI installed and configured
#   - jq installed
#   - Appropriate IAM permissions
#
# Usage:
#   chmod +x setup-aws.sh
#   ./setup-aws.sh --profile prod --region us-east-1
# =============================================================================

AWS_PROFILE="${AWS_PROFILE:-default}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-enterprise-dashboard}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DOMAIN="${DOMAIN:-dashboard.yourdomain.com}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --profile) AWS_PROFILE="$2"; shift 2 ;;
    --region) AWS_REGION="$2"; shift 2 ;;
    --stack) STACK_NAME="$2"; shift 2 ;;
    --env) ENVIRONMENT="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --help) echo "Usage: $0 [--profile PROFILE] [--region REGION] [--stack NAME] [--env ENV] [--domain DOMAIN]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

AWS="aws --profile $AWS_PROFILE --region $AWS_REGION"
log() { echo "[$(date +%T)] $1"; }

log "Starting AWS infrastructure setup for $STACK_NAME in $AWS_REGION..."

# =============================================================================
# 1. Create ECR Repository
# =============================================================================
log "Creating ECR repository..."
ECR_REPO_NAME="${STACK_NAME}-app"
ECR_URI=$($AWS ecr create-repository \
  --repository-name "$ECR_REPO_NAME" \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME \
  --query 'repository.repositoryUri' \
  --output text 2>/dev/null || \
  $AWS ecr describe-repositories --repository-names "$ECR_REPO_NAME" --query 'repositories[0].repositoryUri' --output text)

log "ECR Repository: $ECR_URI"

# =============================================================================
# 2. Create ECS Cluster
# =============================================================================
log "Creating ECS cluster..."
$AWS ecs create-cluster \
  --cluster-name "${STACK_NAME}-cluster" \
  --capacity-providers FARGATE FARGATE_SPOT \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME \
  --settings name=containerInsights,value=enabled > /dev/null

log "ECS Cluster: ${STACK_NAME}-cluster"

# =============================================================================
# 3. Create RDS PostgreSQL Instance
# =============================================================================
log "Creating RDS PostgreSQL instance..."
DB_INSTANCE_ID="${STACK_NAME}-db"
DB_PASSWORD=$(openssl rand -hex 32)
DB_SECRET_ARN=""

if ! $AWS rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" &>/dev/null; then
  $AWS rds create-db-instance \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --db-instance-class db.t3.medium \
    --engine postgres \
    --engine-version 15 \
    --master-username enterprise_admin \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 50 \
    --storage-type gp3 \
    --storage-encrypted \
    --db-name enterprise_dashboard \
    --vpc-security-group-ids "$($AWS ec2 describe-security-groups --filters Name=group-name,Values=default --query 'SecurityGroups[0].GroupId' --output text)" \
    --db-subnet-group-name default \
    --backup-retention-period 7 \
    --preferred-backup-window "02:00-03:00" \
    --preferred-maintenance-window "sun:04:00-sun:05:00" \
    --multi-az \
    --auto-minor-version-upgrade \
    --performance-insights-enabled \
    --monitoring-interval 60 \
    --monitoring-role-arn "$($AWS iam get-role --role-name rds-monitoring-role --query 'Role.Arn' --output text 2>/dev/null || echo '')" \
    --enable-cloudwatch-logs-exports postgresql upgrade \
    --deletion-protection \
    --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME > /dev/null

  # Store secret in Secrets Manager
  DB_SECRET_ARN=$($AWS secretsmanager create-secret \
    --name "${STACK_NAME}/database" \
    --description "Database credentials for $STACK_NAME" \
    --secret-string "{\"username\":\"enterprise_admin\",\"password\":\"$DB_PASSWORD\",\"engine\":\"postgres\",\"host\":\"$DB_INSTANCE_ID.$($AWS rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null || echo 'pending')\",\"port\":5432,\"dbname\":\"enterprise_dashboard\"}" \
    --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME \
    --query 'ARN' --output text)

  log "Waiting for RDS instance to become available (this may take 10-15 minutes)..."
  $AWS rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_ID"
  log "RDS Instance: $DB_INSTANCE_ID"
else
  log "RDS instance $DB_INSTANCE_ID already exists"
fi

# =============================================================================
# 4. Create ElastiCache Redis
# =============================================================================
log "Creating ElastiCache Redis cluster..."
CACHE_CLUSTER_ID="${STACK_NAME}-redis"

if ! $AWS elasticache describe-cache-clusters --cache-cluster-id "$CACHE_CLUSTER_ID" &>/dev/null; then
  $AWS elasticache create-cache-cluster \
    --cache-cluster-id "$CACHE_CLUSTER_ID" \
    --cache-node-type cache.t3.medium \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-nodes 1 \
    --az-mode cross-az \
    --preferred-availability-zones "$AWS_REGION"a "$AWS_REGION"b \
    --automatic-failover-enabled \
    --snapshot-retention-limit 7 \
    --snapshot-window "03:00-04:00" \
    --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME > /dev/null

  log "Waiting for Redis cluster to become available..."
  $AWS elasticache wait cache-cluster-available --cache-cluster-id "$CACHE_CLUSTER_ID"
  log "Redis Cluster: $CACHE_CLUSTER_ID"
else
  log "Redis cluster $CACHE_CLUSTER_ID already exists"
fi

# =============================================================================
# 5. Create Application Load Balancer
# =============================================================================
log "Creating Application Load Balancer..."
VPC_ID=$($AWS ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SUBNETS=$($AWS ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID --query 'Subnets[?DefaultForAz==`true`].SubnetId' --output text | tr '\t' ',')

# Create security group for ALB
ALB_SG_ID=$($AWS ec2 create-security-group \
  --group-name "${STACK_NAME}-alb-sg" \
  --description "Security group for $STACK_NAME ALB" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' --output text 2>/dev/null || \
  $AWS ec2 describe-security-groups --filters Name=group-name,Values="${STACK_NAME}-alb-sg" --query 'SecurityGroups[0].GroupId' --output text)

$AWS ec2 authorize-security-group-ingress \
  --group-id "$ALB_SG_ID" \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 2>/dev/null || true

$AWS ec2 authorize-security-group-ingress \
  --group-id "$ALB_SG_ID" \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 2>/dev/null || true

# Create ALB
ALB_ARN=$($AWS elbv2 create-load-balancer \
  --name "${STACK_NAME}-alb" \
  --subnets $SUBNETS \
  --security-groups "$ALB_SG_ID" \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create target group
TG_ARN=$($AWS elbv2 create-target-group \
  --name "${STACK_NAME}-tg" \
  --protocol HTTP \
  --port 80 \
  --vpc-id "$VPC_ID" \
  --target-type ip \
  --health-check-path "/api/health" \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode="200" \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create HTTPS listener (will need ACM certificate)
$AWS elbv2 create-listener \
  --load-balancer-arn "$ALB_ARN" \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" > /dev/null

log "ALB ARN: $ALB_ARN"
log "Target Group ARN: $TG_ARN"

# =============================================================================
# 6. Request ACM Certificate
# =============================================================================
log "Requesting ACM certificate for $DOMAIN..."
CERT_ARN=$($AWS acm request-certificate \
  --domain-name "$DOMAIN" \
  --validation-method DNS \
  --subject-alternative-names "www.$DOMAIN" \
  --tags Key=Environment,Value=$ENVIRONMENT \
  --query 'CertificateArn' --output text)

log "ACM Certificate ARN: $CERT_ARN"
log "Please create the required DNS validation records in your DNS provider"

# =============================================================================
# 7. Create HTTPS Listener
# =============================================================================
$AWS elbv2 create-listener \
  --load-balancer-arn "$ALB_ARN" \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
  --certificates CertificateArn="$CERT_ARN" \
  --default-actions Type=forward,TargetGroupArn="$TG_ARN" > /dev/null 2>/dev/null || true

# =============================================================================
# 8. Create CloudFront Distribution
# =============================================================================
log "Creating CloudFront distribution..."
# Create origin access control
OAC_ID=$($AWS cloudfront create-origin-access-control \
  --origin-access-control-config "Name=${STACK_NAME}-oac,Description=OAC for ${STACK_NAME},SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=elbv2" \
  --query 'OriginAccessControl.Id' --output text 2>/dev/null || \
  $AWS cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='${STACK_NAME}-oac'].Id" --output text)

# Get ALB domain name
ALB_DNS=$($AWS elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].DNSName' --output text)

# Create CloudFront distribution
$AWS cloudfront create-distribution \
  --distribution-config "{
    \"CallerReference\": \"$(date +%s)\",
    \"Comment\": \"CDN for $STACK_NAME\",
    \"Enabled\": true,
    \"HttpVersion\": \"http2and3\",
    \"DefaultRootObject\": \"\",
    \"Origins\": [{
      \"Id\": \"ALB-$STACK_NAME\",
      \"DomainName\": \"$ALB_DNS\",
      \"OriginPath\": \"\",
      \"CustomOriginConfig\": {
        \"HTTPPort\": 80,
        \"HTTPSPort\": 443,
        \"OriginProtocolPolicy\": \"https-only\",
        \"OriginSslProtocols\": [\"TLSv1.2\"]
      },
      \"OriginAccessControlId\": \"$OAC_ID\"
    }],
    \"DefaultCacheBehavior\": {
      \"TargetOriginId\": \"ALB-$STACK_NAME\",
      \"ViewerProtocolPolicy\": \"redirect-to-https\",
      \"AllowedMethods\": {
        \"Quantity\": 7,
        \"Items\": [\"GET\",\"HEAD\",\"OPTIONS\",\"PUT\",\"POST\",\"PATCH\",\"DELETE\"],
        \"CachedMethods\": {
          \"Quantity\": 3,
          \"Items\": [\"GET\",\"HEAD\",\"OPTIONS\"]
        }
      },
      \"Compress\": true,
      \"MinTTL\": 0,
      \"DefaultTTL\": 0,
      \"MaxTTL\": 31536000,
      \"ForwardedValues\": {
        \"QueryString\": true,
        \"Cookies\": {\"Forward\": \"none\"},
        \"Headers\": [\"Origin\", \"Authorization\", \"Content-Type\"]
      }
    },
    \"CustomErrorResponses\": {
      \"Quantity\": 2,
      \"Items\": [
        {\"ErrorCode\": 403, \"ResponsePagePath\": \"/index.html\", \"ResponseCode\": 200, \"ErrorCachingMinTTL\": 10},
        {\"ErrorCode\": 404, \"ResponsePagePath\": \"/index.html\", \"ResponseCode\": 200, \"ErrorCachingMinTTL\": 10}
      ]
    },
    \"PriceClass\": \"PriceClass_100\",
    \"Aliases\": {
      \"Quantity\": 1,
      \"Items\": [\"$DOMAIN\"]
    },
    \"ViewerCertificate\": {
      \"ACMCertificateArn\": \"$CERT_ARN\",
      \"SSLSupportMethod\": \"sni-only\",
      \"MinimumProtocolVersion\": \"TLSv1.2_2021\"
    }
  }" > /dev/null 2>/dev/null || log_warn "CloudFront setup incomplete. Create manually."

log "CloudFront distribution created"

# =============================================================================
# 9. Create CloudWatch Alarms
# =============================================================================
log "Creating CloudWatch alarms..."

# CPU utilization alarm
$AWS cloudwatch put-metric-alarm \
  --alarm-name "${STACK_NAME}-high-cpu" \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$($AWS sns create-topic --name "${STACK_NAME}-alerts" --query 'TopicArn' --output text)" \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME

# Memory utilization alarm
$AWS cloudwatch put-metric-alarm \
  --alarm-name "${STACK_NAME}-high-memory" \
  --alarm-description "Alert when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$($AWS sns create-topic --name "${STACK_NAME}-alerts" --query 'TopicArn' --output text 2>/dev/null)" \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME

# RDS Connection count alarm
$AWS cloudwatch put-metric-alarm \
  --alarm-name "${STACK_NAME}-rds-connections" \
  --alarm-description "Alert when DB connections exceed 80% of max" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$($AWS sns list-topics --query 'Topics[?contains(TopicArn,`${STACK_NAME}-alerts`)].TopicArn' --output text)" \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME

# HTTP 5xx errors alarm
$AWS cloudwatch put-metric-alarm \
  --alarm-name "${STACK_NAME}-http-5xx" \
  --alarm-description "Alert on 5XX errors" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$($AWS sns list-topics --query 'Topics[?contains(TopicArn,`alerts`)].TopicArn' --output text)" \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME

log "CloudWatch alarms configured"

# =============================================================================
# 10. Create ECS Task Definition and Service
# =============================================================================
log "Creating ECS task definition and service..."

# Create ECS service role if not exists
$AWS iam create-role \
  --role-name "${STACK_NAME}-ecs-exec-role" \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' 2>/dev/null || true

# Task execution role
$AWS iam create-role \
  --role-name "${STACK_NAME}-ecs-task-execution-role" \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' 2>/dev/null || true

$AWS iam attach-role-policy \
  --role-name "${STACK_NAME}-ecs-task-execution-role" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>/dev/null || true

$AWS iam attach-role-policy \
  --role-name "${STACK_NAME}-ecs-task-execution-role" \
  --policy-arn "arn:aws:iam::aws:policy/AmazonECR-ReadOnly" 2>/dev/null || true

# Create ECS service
$AWS ecs create-service \
  --cluster "${STACK_NAME}-cluster" \
  --service-name "${STACK_NAME}-service" \
  --task-definition "${STACK_NAME}-task:1" \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[\"$ALB_SG_ID\"],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=app,containerPort=8000" \
  --service-connect-configuration "enabled=true,namespace=\"${STACK_NAME}\"" \
  --enable-execute-command \
  --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$STACK_NAME 2>/dev/null || \
  log "ECS service already exists or will be created via CI/CD"

log "ECS service configured"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================================="
echo "AWS Infrastructure Setup Complete!"
echo "============================================================================="
echo ""
echo "ECR Repository:       $ECR_URI"
echo "ECS Cluster:          ${STACK_NAME}-cluster"
echo "RDS Instance:         $DB_INSTANCE_ID"
echo "Redis Cluster:        $CACHE_CLUSTER_ID"
echo "ALB DNS:              $ALB_DNS"
echo "ACM Certificate:      $CERT_ARN"
echo "Database Secret:      ${STACK_NAME}/database"
echo ""
echo "Next steps:"
echo "  1. Validate ACM certificate via DNS records"
echo "  2. Update ECS task definition with correct environment variables"
echo "  3. Push Docker images to ECR"
echo "  4. Configure CI/CD secrets:"
echo "     - AWS_ROLE_ARN"
echo "     - AWS_ACCOUNT_ID"
echo ""
echo "Access:"
echo "  ALB URL:            http://$ALB_DNS"
echo "  CloudFront URL:     https://\$distribution.cloudfront.net"
echo "  Custom Domain:      https://$DOMAIN"
echo "============================================================================="
