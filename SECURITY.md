# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Enterprise Admin Dashboard seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to security@enterprise-dashboard.com.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:
- Type of issue (e.g., SQL injection, XSS, privilege escalation)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Authentication Flow

### Password-Based Authentication
1. User submits credentials (email + password)
2. Password is verified using bcrypt with work factor 12
3. On success, JWT access token (30 min) and refresh token (7 days) are issued
4. Access token is sent in `Authorization: Bearer <token>` header
5. Refresh token is sent in `X-Refresh-Token` header
6. Tokens are signed using HS256 with server-side secret

### Multi-Factor Authentication (2FA)
1. User enables 2FA in settings
2. TOTP secret is generated using `pyotp`
3. QR code is displayed for authenticator app setup
4. User scans QR code and enters verification code
5. 8 recovery codes are generated and displayed once
6. Subsequent logins require password + TOTP code
7. Recovery codes can be used as backup (each can be used once)

### OAuth2 Authentication
1. User clicks "Sign in with Google/GitHub"
2. User is redirected to provider's OAuth consent screen
3. Provider redirects back with authorization code
4. Server exchanges code for access token
5. Server fetches user profile from provider
6. If email matches existing user, account is linked
7. If no existing user, a new account is created
8. JWT tokens are issued as with password auth

## Authorization Model

### Role-Based Access Control (RBAC)

#### Built-in Roles
| Role | Description | Permissions |
|------|-------------|------------|
| `super_admin` | Full system access | All permissions |
| `admin` | Administrative access | User management, settings, reports |
| `manager` | Department management | CRM, finance, inventory modules |
| `analyst` | Read-only analytics | View dashboards, export reports |
| `user` | Basic access | Own profile, assigned tasks |

#### Permission Structure
```python
PERMISSIONS = {
    "users:read": "View user profiles",
    "users:write": "Create/update users",
    "users:delete": "Delete users",
    "roles:manage": "Manage roles and permissions",
    "analytics:read": "View analytics",
    "analytics:export": "Export analytics data",
    "crm:read": "View CRM data",
    "crm:write": "Create/update CRM entries",
    "crm:delete": "Delete CRM entries",
    "finance:read": "View financial data",
    "finance:write": "Create/update financial records",
    "finance:delete": "Delete financial records",
    "inventory:read": "View inventory",
    "inventory:write": "Create/update inventory",
    "inventory:delete": "Delete inventory items",
    "settings:read": "View system settings",
    "settings:write": "Update system settings",
    "audit:read": "View audit logs",
    "ai:query": "Use AI features",
    "admin:panel": "Access admin panel",
}
```

### Permission Checking
```python
# Decorator-based permission checking
@router.get("/users")
@require_permissions(["users:read"])
async def get_users(current_user: User = Depends(get_current_user)):
    ...

# Inside service layer
def can_access_resource(user: User, resource: str, action: str) -> bool:
    if user.role == "super_admin":
        return True
    return user.has_permission(f"{resource}:{action}")
```

## Data Encryption

### In Transit
- All HTTP traffic is encrypted using TLS 1.2 or 1.3
- Minimum TLS version: 1.2
- Supported ciphers: ECDHE + AES-GCM, CHACHA20-Poly1305
- HSTS enabled with 1-year max-age
- OCSP stapling configured for certificate validation

### At Rest
- Database connection uses SSL/TLS
- Sensitive user data encrypted at column level using AES-256
- Passwords hashed using bcrypt (work factor 12)
- JWT tokens signed with server-side secret
- TOTP secrets encrypted before storage
- API keys stored using environment variables (not in database)
- File uploads scanned for malware

#### Encryption Implementation
```python
from cryptography.fernet import Fernet
from app.core.config import settings

cipher = Fernet(settings.ENCRYPTION_KEY.encode())

def encrypt_sensitive_data(data: str) -> str:
    return cipher.encrypt(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data: str) -> str:
    return cipher.decrypt(encrypted_data.encode()).decode()
```

### Key Management
- Encryption keys stored in environment variables
- Keys rotated quarterly
- Old keys retained for decryption of existing data
- Keys generated using cryptographically secure random

## API Security

### Authentication Requirements
- All API endpoints require authentication (except login, register, health check)
- JWT tokens are validated on every request
- Refresh tokens have limited lifetime (7 days)
- Failed login attempts are rate-limited (10 per minute per IP)

### Rate Limiting
```python
# Configuration
RATE_LIMITS = {
    "default": "100/hour",
    "login": "10/minute",
    "register": "3/hour",
    "api": "1000/minute",
    "ai": "50/hour",
    "export": "10/hour",
}
```

### Input Validation
- All inputs validated using Pydantic schemas
- SQL injection prevented via ORM parameterized queries
- XSS prevented via output encoding
- CSRF tokens required for state-changing operations
- File uploads restricted by type and size (50MB max)

### API Security Headers
All API responses include:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Network Security

### Firewall Rules (UFW)
| Service | Port | Source |
|---------|------|--------|
| SSH | 22/tcp | Admin IPs only |
| HTTP | 80/tcp | Any (redirects to HTTPS) |
| HTTPS | 443/tcp | Any |
| PostgreSQL | 5432/tcp | Internal Docker network |
| Redis | 6379/tcp | Internal Docker network |
| API | 8000/tcp | Internal Docker network |

### Docker Security
- Containers run as non-root user
- Read-only root filesystem where possible
- Dropped all capabilities, added only required ones
- No-new-privileges security option enabled
- Internal Docker networks for service isolation
- Resource limits enforced on all containers
- Health checks configured for all services

### Fail2ban Configuration
| Jail | Max Retries | Ban Time | Log Path |
|------|-------------|----------|----------|
| SSH | 3 | 24 hours | /var/log/auth.log |
| Nginx HTTP Auth | 5 | 24 hours | /var/log/nginx/error.log |
| Nginx Bot Search | 2 | 24 hours | /var/log/nginx/access.log |

## Security Headers

### HTTP Response Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

### Content Security Policy
```nginx
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https: wss:;
frame-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

## Security Best Practices

### For Developers
1. Never commit secrets, API keys, or passwords to version control
2. Use environment variables for all configuration
3. Run linters and security scanners before committing
4. Keep dependencies up to date (Dependabot configured)
5. Use parameterized queries (ORM) - never raw SQL
6. Validate and sanitize all user inputs
7. Implement proper error handling (no stack traces to users)
8. Use HTTPS in all environments
9. Enable 2FA for admin accounts
10. Regular security training

### For Administrators
1. Regularly review audit logs for suspicious activity
2. Monitor failed login attempts
3. Keep the application and dependencies updated
4. Rotate encryption keys quarterly
5. Review user permissions periodically
6. Enable automatic security updates on the server
7. Use strong, unique passwords for all services
8. Implement network segmentation
9. Regular backup testing
10. Incident response plan in place

### Security Auditing
- All authentication events logged
- All permission changes logged
- All data modifications tracked
- All admin actions audited
- Failed login attempts recorded
- API access patterns monitored
- Anomaly detection for unusual activity

### Compliance
- GDPR compliance for EU users
- Data encryption at rest and in transit
- Right to data deletion
- Data portability support
- Audit logs for compliance reporting
- Privacy policy and terms of service

## Vulnerability Disclosure Timeline

1. **Day 0:** Vulnerability reported
2. **Day 1-2:** Security team acknowledges receipt
3. **Day 3-7:** Investigation and impact assessment
4. **Day 8-14:** Development of fix
5. **Day 15-21:** Testing and validation
6. **Day 22:** Release of fix and public disclosure
7. **Day 23+:** Monitoring for exploitation attempts

## Security Checklist

### Pre-deployment
- [ ] All default passwords changed
- [ ] Secret keys generated (not default values)
- [ ] SSL certificates installed and valid
- [ ] Firewall configured
- [ ] fail2ban configured
- [ ] Database accessible only from application
- [ ] Debug mode disabled
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Backups configured
- [ ] Monitoring configured
- [ ] Docker containers not running as root
- [ ] All dependencies audited

### Regular Maintenance
- [ ] Review access logs (weekly)
- [ ] Check for dependency updates (weekly)
- [ ] Rotate encryption keys (quarterly)
- [ ] Review user permissions (monthly)
- [ ] Penetration testing (quarterly)
- [ ] Security audit (semi-annual)
- [ ] Update SSL certificates (as needed)
- [ ] Review firewall rules (monthly)
- [ ] Test backup restoration (monthly)
- [ ] Update incident response plan (annually)
