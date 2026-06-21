# API Documentation

## Base URL

Production: `https://yourdomain.com/api`
Development: `http://localhost:8000/api`

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

### Headers
```
Authorization: Bearer <access_token>
X-Refresh-Token: <refresh_token>
```

### Get Access Token
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

### Refresh Token
```http
POST /auth/refresh
X-Refresh-Token: <refresh_token>
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 2FA Verification
```http
POST /auth/2fa/verify
Content-Type: application/json
Authorization: Bearer <temp_token>

{
  "code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `invalid_credentials` | Invalid email or password |
| `token_expired` | Access token has expired |
| `token_invalid` | Invalid or malformed token |
| `insufficient_permissions` | User lacks required permissions |
| `rate_limit_exceeded` | Too many requests |
| `validation_error` | Request validation failed |
| `resource_not_found` | Requested resource not found |
| `duplicate_resource` | Resource already exists |
| `2fa_required` | 2FA verification needed |
| `2fa_invalid` | Invalid 2FA code |
| `account_locked` | Account temporarily locked |

## Rate Limits

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Default | 100 requests | 1 hour |
| Login | 10 requests | 1 minute |
| Registration | 3 requests | 1 hour |
| API (authenticated) | 1000 requests | 1 minute |
| AI features | 50 requests | 1 hour |
| Data export | 10 requests | 1 hour |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Authentication Endpoints

### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "organization": "Acme Corp"
}
```

**Response:** `201 Created`

### POST /auth/logout
Invalidate current session.

### POST /auth/forgot-password
Send password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset-token",
  "password": "newpassword"
}
```

### GET /auth/me
Get current user profile.

### PUT /auth/me
Update current user profile.

## User Management

### GET /users
List users (admin only).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20, max: 100) |
| `search` | string | Search by name/email |
| `role` | string | Filter by role |
| `status` | string | Filter by status (active/inactive) |
| `sort_by` | string | Sort field |
| `sort_order` | string | asc/desc |

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### POST /users
Create new user (admin only).

### GET /users/:id
Get user details.

### PUT /users/:id
Update user (admin only).

### DELETE /users/:id
Delete user (admin only).

### GET /users/:id/permissions
Get user permissions.

### PUT /users/:id/permissions
Update user permissions.

### GET /users/:id/activity
Get user activity log.

### POST /users/:id/2fa/disable
Disable 2FA for user (admin only).

### POST /users/:id/reset-password
Reset user password (admin only).

## Roles

### GET /roles
List all roles.

### POST /roles
Create new role.

### PUT /roles/:id
Update role.

### DELETE /roles/:id
Delete role.

### GET /roles/:id/permissions
Get role permissions.

### PUT /roles/:id/permissions
Update role permissions.

## Analytics

### GET /analytics/dashboard
Get main dashboard metrics.

**Response:**
```json
{
  "total_users": 1523,
  "active_users": 847,
  "daily_active_users": 423,
  "monthly_active_users": 1120,
  "total_revenue": 1250000.00,
  "revenue_growth": 12.5,
  "total_orders": 8934,
  "conversion_rate": 3.2,
  "avg_order_value": 139.99,
  "churn_rate": 2.1,
  "customer_lifetime_value": 2450.00,
  "period": "2024-01"
}
```

### GET /analytics/revenue
Get revenue analytics.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | string | Start date (ISO 8601) |
| `end_date` | string | End date (ISO 8601) |
| `interval` | string | day/week/month/quarter/year |
| `group_by` | string | category/product/region |

### GET /analytics/users
Get user analytics.

### GET /analytics/traffic
Get traffic and engagement metrics.

### GET /analytics/trends
Get trend analysis with predictions.

### POST /analytics/export
Export analytics data.

**Request:**
```json
{
  "format": "csv",
  "metrics": ["revenue", "users", "orders"],
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "interval": "day"
}
```

### GET /analytics/reports
List saved reports.

### POST /analytics/reports
Create custom report.

### POST /analytics/reports/:id/generate
Generate saved report.

## CRM

### GET /crm/leads
List CRM leads.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | new/contacted/qualified/proposal/closed_won/closed_lost |
| `source` | string | website/referral/social/email/call |
| `assigned_to` | uuid | Filter by assignee |
| `priority` | string | low/medium/high/critical |
| `tag` | string | Filter by tag |

### POST /crm/leads
Create new lead.

**Request:**
```json
{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "company": "Acme Corporation",
  "website": "https://acme.com",
  "source": "website",
  "priority": "high",
  "notes": "Interested in enterprise plan"
}
```

### GET /crm/leads/:id
Get lead details.

### PUT /crm/leads/:id
Update lead.

### DELETE /crm/leads/:id
Delete lead.

### POST /crm/leads/:id/convert
Convert lead to deal.

### GET /crm/contacts
List contacts.

### POST /crm/contacts
Create contact.

### GET /crm/contacts/:id
Get contact details.

### PUT /crm/contacts/:id
Update contact.

### DELETE /crm/contacts/:id
Delete contact.

### GET /crm/deals
List deals.

### POST /crm/deals
Create deal.

### PUT /crm/deals/:id/stage
Update deal stage.

### GET /crm/pipeline
Get sales pipeline overview.

### GET /crm/activities
List activities.

### POST /crm/activities
Log activity.

### GET /crm/tasks
List tasks.

### POST /crm/tasks
Create task.

### PUT /crm/tasks/:id
Update task.

### POST /crm/email/send
Send email via CRM.

## Finance

### GET /finance/dashboard
Get finance dashboard metrics.

### GET /finance/invoices
List invoices.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | draft/sent/paid/overdue/cancelled |
| `date_from` | string | Filter by date range |
| `date_to` | string | Filter by date range |
| `customer_id` | uuid | Filter by customer |

### POST /finance/invoices
Create invoice.

**Request:**
```json
{
  "customer_id": "uuid",
  "items": [
    {
      "description": "Enterprise Plan - Monthly",
      "quantity": 1,
      "unit_price": 999.00,
      "tax_rate": 20.0
    }
  ],
  "due_date": "2024-02-15",
  "notes": "Payment due within 30 days"
}
```

### GET /finance/invoices/:id
Get invoice details.

### PUT /finance/invoices/:id
Update invoice.

### DELETE /finance/invoices/:id
Delete invoice.

### POST /finance/invoices/:id/send
Send invoice via email.

### POST /finance/invoices/:id/pay
Record payment.

### POST /finance/invoices/:id/remind
Send payment reminder.

### GET /finance/invoices/:id/pdf
Download invoice PDF.

### GET /finance/expenses
List expenses.

### POST /finance/expenses
Create expense.

### GET /finance/expenses/:id
Get expense details.

### GET /finance/reports/profit-loss
Get P&L statement.

### GET /finance/reports/balance-sheet
Get balance sheet.

### GET /finance/reports/cash-flow
Get cash flow statement.

### GET /finance/reports/tax
Get tax summary.

### GET /finance/budgets
List budgets.

### POST /finance/budgets
Create budget.

### GET /finance/budgets/:id
Get budget details with spending.

## Inventory

### GET /inventory/products
List products.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `status` | string | active/inactive/discontinued |
| `low_stock` | boolean | Filter low stock items |
| `search` | string | Search by name/SKU |

### POST /inventory/products
Create product.

**Request:**
```json
{
  "name": "Widget Pro",
  "sku": "WGT-001",
  "description": "High-quality widget",
  "category": "widgets",
  "price": 29.99,
  "cost": 15.00,
  "stock_quantity": 100,
  "reorder_level": 20,
  "unit": "piece",
  "images": ["https://cdn.example.com/widget.jpg"]
}
```

### GET /inventory/products/:id
Get product details.

### PUT /inventory/products/:id
Update product.

### DELETE /inventory/products/:id
Delete product.

### GET /inventory/products/:id/movements
Get stock movement history.

### GET /inventory/categories
List categories.

### POST /inventory/categories
Create category.

### GET /inventory/warehouses
List warehouses.

### POST /inventory/warehouses
Create warehouse.

### GET /inventory/stock
Get stock levels overview.

### POST /inventory/stock/adjust
Adjust stock levels.

**Request:**
```json
{
  "product_id": "uuid",
  "warehouse_id": "uuid",
  "quantity": -5,
  "reason": "damaged",
  "reference": "RMA-001"
}
```

### GET /inventory/orders
List purchase orders.

### POST /inventory/orders
Create purchase order.

### PUT /inventory/orders/:id/status
Update purchase order status.

## AI Features

### POST /ai/query
Natural language query on business data.

**Request:**
```json
{
  "query": "What were our top 5 products by revenue last month?",
  "context": {
    "module": "analytics",
    "timeframe": "last_month"
  }
}
```

**Response:**
```json
{
  "answer": "Your top 5 products by revenue last month were: Widget Pro ($45,230), Super Gadget ($38,100), Mega Tool ($29,450), Ultra Device ($22,800), and Power Kit ($18,900).",
  "data": [
    {"product": "Widget Pro", "revenue": 45230},
    {"product": "Super Gadget", "revenue": 38100},
    {"product": "Mega Tool", "revenue": 29450},
    {"product": "Ultra Device", "revenue": 22800},
    {"product": "Power Kit", "revenue": 18900}
  ],
  "confidence": 0.95,
  "query_time_ms": 1234
}
```

### POST /ai/predict
Generate predictions.

**Request:**
```json
{
  "metric": "revenue",
  "periods": 6,
  "interval": "month",
  "include_factors": ["seasonality", "trend", "marketing_spend"]
}
```

**Response:**
```json
{
  "predictions": [
    {"date": "2024-02-01", "value": 125000, "lower_bound": 115000, "upper_bound": 135000},
    {"date": "2024-03-01", "value": 132000, "lower_bound": 120000, "upper_bound": 144000}
  ],
  "accuracy_metrics": {
    "mape": 8.5,
    "rmse": 5200,
    "r2_score": 0.92
  },
  "factors": [
    {"name": "seasonality", "impact": 0.15},
    {"name": "trend", "impact": 0.08}
  ]
}
```

### POST /ai/report
Generate AI-powered report.

**Request:**
```json
{
  "type": "monthly_summary",
  "period": "2024-01",
  "format": "markdown",
  "sections": ["executive_summary", "revenue", "users", "operations"]
}
```

**Response:**
```json
{
  "report": "# Monthly Summary - January 2024\n\n## Executive Summary\nJanuary showed strong performance...",
  "generated_at": "2024-02-01T00:00:00Z",
  "model": "deepseek-chat",
  "tokens_used": 2450
}
```

### POST /ai/anomalies
Detect anomalies in data.

**Request:**
```json
{
  "dataset": "transactions",
  "timeframe": "last_30_days",
  "sensitivity": 0.95,
  "metrics": ["amount", "frequency", "location"]
}
```

**Response:**
```json
{
  "anomalies": [
    {
      "id": "txn-1234",
      "type": "unusual_amount",
      "severity": "high",
      "timestamp": "2024-01-15T14:30:00Z",
      "details": "Transaction amount $15,000 exceeds normal range by 500%",
      "recommended_action": "Review and verify transaction"
    }
  ],
  "total_analyzed": 15000,
  "anomalies_found": 3,
  "anomaly_rate": 0.02
}
```

### POST /ai/chat
Conversational AI assistant.

**Request:**
```json
{
  "message": "Show me the revenue trend for the last quarter",
  "conversation_id": "conv-123",
  "context": {
    "module": "finance",
    "user_role": "admin"
  }
}
```

**Response:**
```json
{
  "response": "Here's the revenue trend for Q4 2023...",
  "actions": [
    {"type": "navigate", "target": "/finance/reports"},
    {"type": "apply_filter", "filter": {"period": "q4_2023"}}
  ],
  "conversation_id": "conv-123",
  "suggestions": [
    "Compare with previous quarter",
    "Break down by product category"
  ]
}
```

### GET /ai/insights
Get AI-generated business insights.

### POST /ai/summarize
Summarize text or data.

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('wss://yourdomain.com/ws/notifications?token=<jwt_token>');
```

### Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `{id, type, title, message, data}` | Real-time notification |
| `metric_update` | `{metric, value, timestamp}` | Live metric update |
| `user_activity` | `{user, action, resource}` | User activity alert |
| `system_alert` | `{level, message, details}` | System alert |
| `chart_data` | `{chart_id, data}` | Real-time chart update |
| `ai_insight` | `{insight, confidence, source}` | AI-generated insight |

### Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe` | `["analytics", "notifications"]` | Subscribe to channels |
| `unsubscribe` | `["analytics"]` | Unsubscribe from channels |
| `ping` | `{}` | Keepalive ping |

### WebSocket Example
```javascript
// Connect
const ws = new WebSocket('wss://yourdomain.com/ws/notifications?token=' + token);

ws.onopen = () => {
  // Subscribe to updates
  ws.send(JSON.stringify({
    event: 'subscribe',
    data: ['analytics', 'notifications', 'metrics']
  }));
};

ws.onmessage = (event) => {
  const { event: eventName, data } = JSON.parse(event.data);
  console.log('Received:', eventName, data);
};

// Keepalive
setInterval(() => {
  ws.send(JSON.stringify({ event: 'ping' }));
}, 30000);
```

## API Versioning

API is versioned through URL prefix:
- Current version: `/api/v1`
- Beta features: `/api/v2`

The current stable version is accessible via `/api/` which redirects to the latest version.

## API Conventions

### Pagination
All list endpoints support pagination:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5,
  "next": "/api/resource?page=2&limit=20",
  "prev": null
}
```

### Sorting
Sort using `sort_by` and `sort_order` parameters:
```
GET /api/users?sort_by=created_at&sort_order=desc
```

### Filtering
Filter using query parameters:
```
GET /api/crm/leads?status=new&priority=high
```

### Field Selection
Select specific fields using `fields` parameter:
```
GET /api/users?fields=id,name,email,role
```

### Error Response Format
```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_email"
      }
    ],
    "request_id": "req-abc-123"
  }
}
```

### Success Response Format
```json
{
  "data": { ... },
  "meta": {
    "request_id": "req-abc-123",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```
