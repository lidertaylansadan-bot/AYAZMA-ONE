# Security & Privacy Checklist

## Overview

This document outlines the security and privacy measures implemented in the North Taylan OS (AYAZMA-ONE) platform.

## Authentication & Authorization

### Supabase Authentication

- ✅ JWT-based authentication via Supabase Auth
- ✅ Token validation on every API request
- ✅ Secure token storage in browser (httpOnly cookies recommended for production)

### Role-Based Access Control (RBAC)

- ✅ User roles stored in `profiles` table
- ✅ Default role: `owner`
- ✅ Supported roles: `owner`, `system`, `service`, `viewer`
- ✅ `requireRole` middleware for endpoint protection
- ✅ Critical endpoints protected (AI optimizer, settings)

### Row-Level Security (RLS)

- ✅ Enabled on all Supabase tables
- ✅ Users can only access their own data
- ✅ Project-based isolation enforced
- ✅ Policies: `SELECT`, `INSERT`, `UPDATE`, `DELETE` restricted by `user_id`

## Audit Logging

### Audit Log System

- ✅ `audit_log` table tracks critical actions
- ✅ Events logged:
  - `agent_run_started` - Agent execution
  - `doc_uploaded` / `doc_deleted` - Document operations
  - `ai_config_changed` - AI settings modifications
  - `web_automation_call` - Web automation requests (if implemented)
- ✅ Metadata captured:
  - User ID, Project ID
  - Event type and severity
  - IP address and User-Agent
  - Custom metadata (JSON)
- ✅ RLS: Users can only view their own audit logs

## Rate Limiting

### IP-Based Rate Limiting

- ✅ Global limit: **1000 requests per 15 minutes** per IP
- ✅ Prevents DDoS and abuse
- ✅ Returns HTTP 429 when exceeded

### User-Based Rate Limiting

- ✅ Heavy endpoints (agent runs): **60 requests per 10 minutes** per user
- ✅ Prevents resource exhaustion
- ✅ Configurable limits (can be moved to environment variables)

### Implementation

- ✅ In-memory store (suitable for single-instance deployments)
- 🔄 **Production Recommendation**: Migrate to Redis for multi-instance support

## Data Privacy

### Data Collection

- ✅ **Minimal data collection**: Only essential user data (email, ID)
- ✅ **Transparent tracking**: All telemetry stored in `ai_usage_logs` and `audit_log`
- ✅ **No hidden tracking**: No third-party analytics, no supercookies
- ✅ **User-owned data**: All data belongs to the user and can be deleted

### Data Storage

- ✅ **Encrypted at rest**: Supabase provides encryption
- ✅ **Encrypted in transit**: HTTPS/TLS for all API communication
- ✅ **Database isolation**: RLS ensures data separation

### Data Retention

- 🔄 **Audit logs**: Retained indefinitely (consider 90-day retention policy)
- 🔄 **AI usage logs**: Retained for analytics (consider 30-day retention)
- 🔄 **Agent evaluations**: Retained for optimization (consider 60-day retention)
- ✅ **User data deletion**: Cascade delete on account removal

## Telemetry & Cost Tracking

### Telemetry Events

- ✅ Compression events (started, completed, failed)
- ✅ OCR completion events
- ✅ Context building events
- ✅ Stored in `ai_usage_logs` table with cost estimates

### Privacy Considerations

- ✅ Telemetry is **user-specific** and **project-scoped**
- ✅ No cross-user data sharing
- ✅ Users can view their own telemetry via API

## Policy Engine (Planned - Issue 5.5)

### Planned Features

- 🔄 Domain allowlist for web automation
- 🔄 Model usage restrictions (e.g., specific models for specific tasks)
- 🔄 Agent execution policies
- 🔄 File-based configuration (`config/policy.json`)

## Web Automation Security (Stage 3)

### Current Measures

- ✅ Domain allowlist (if implemented in Stage 3)
- ✅ Audit logging for automation calls
- 🔄 **Recommendation**: Implement request sanitization and output validation

## AI Model Security

### API Key Management

- ✅ API keys stored in environment variables (`.env`)
- ✅ Never committed to version control
- ✅ Separate keys for development and production

### Model Access

- ✅ AI settings per project (provider, model, preferences)
- ✅ Cost and latency preferences configurable
- 🔄 **Planned**: Auto-optimization based on usage patterns

## Security Best Practices

### Code Security

- ✅ Input validation using Zod schemas
- ✅ Parameterized database queries (Supabase client)
- ✅ Error handling without exposing sensitive details
- ✅ Helmet.js for HTTP security headers

### Dependency Security

- 🔄 **Recommendation**: Regular `npm audit` checks
- 🔄 **Recommendation**: Automated dependency updates (Dependabot)

### Deployment Security

- 🔄 **Recommendation**: Environment-specific configurations
- 🔄 **Recommendation**: Secrets management (e.g., AWS Secrets Manager, Vault)
- 🔄 **Recommendation**: HTTPS enforcement in production

## Incident Response

### Monitoring

- ✅ Structured logging with Pino
- ✅ Error tracking in logs
- 🔄 **Recommendation**: Integrate error monitoring (e.g., Sentry)

### Breach Response

- 🔄 **Planned**: Incident response plan
- 🔄 **Planned**: User notification procedures
- 🔄 **Planned**: Data breach disclosure policy

## Compliance Considerations

### GDPR (if applicable)

- ✅ Right to access: Users can query their data
- ✅ Right to deletion: Cascade delete on account removal
- 🔄 **Planned**: Data export functionality
- 🔄 **Planned**: Privacy policy documentation

### Data Residency

- ✅ Supabase region configurable
- 🔄 **Recommendation**: Document data storage locations

## Future Enhancements

### Short-term (Stage 5)

- [ ] Policy Engine implementation
- [ ] Eval Module for quality scoring
- [ ] Closed-loop optimizer with auto-apply
- [ ] Cockpit Health & Security Panel

### Long-term

- [ ] Two-factor authentication (2FA)
- [ ] API key rotation
- [ ] Advanced threat detection
- [ ] Security audit trail export
- [ ] Compliance certifications (SOC 2, ISO 27001)

## Contact & Reporting

### Security Issues

- **Internal**: Review audit logs and error logs
- **External**: (Define security contact email for production)

### Updates

- This document should be reviewed and updated with each major release
- Last updated: 2025-11-24

---

**Legend:**

- ✅ Implemented
- 🔄 Planned / Recommended
- [ ] Future consideration
