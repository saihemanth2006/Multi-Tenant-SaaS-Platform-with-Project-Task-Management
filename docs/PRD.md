# Product Requirements Document (PRD)

## User Personas

### Super Admin (System-level administrator)
- Role: Oversees the entire platform across all tenants; configures global settings and monitors system health.
- Responsibilities: Manage system-wide configurations, onboard new tenants, audit activity, enforce policies, handle escalations.
- Goals: Ensure platform reliability, security, and compliance; provide smooth tenant onboarding; maintain visibility into usage and health.
- Pain Points: High blast radius of misconfiguration, need for strong observability, balancing security with usability, handling compliance inquiries.

### Tenant Admin (Organization administrator)
- Role: Operates at the tenant scope; controls users, projects, and subscription plans.
- Responsibilities: Register tenant, manage subdomain and plan, invite users, assign roles, create projects, review audit logs.
- Goals: Quickly set up workspace, enforce access control, keep within plan limits, maintain team productivity.
- Pain Points: Hitting plan limits, onboarding friction, ensuring correct permissions, needing clear usage visibility.

### End User (Regular team member)
- Role: Contributes to projects and tasks within a tenant.
- Responsibilities: View and update assigned tasks, collaborate on projects, track progress, consume notifications.
- Goals: Simple, fast UI to manage work; clear visibility on priorities; minimal friction in daily workflows.
- Pain Points: Cluttered UI, slow responses, unclear permissions, lack of mobile-friendly experience.

## Functional Requirements

### Auth
- FR-001: The system shall allow users to register/login with email and password scoped to tenant subdomains.
- FR-002: The system shall issue JWTs with 24-hour expiry containing user_id, tenant_id, and role claims.
- FR-003: The system shall enforce role-based access control for all protected endpoints.
- FR-004: The system shall provide a health endpoint `/api/health` returning service and database status.

### Tenant
- FR-005: The system shall allow tenant registration with unique subdomains.
- FR-006: The system shall enforce subscription plan limits before creating users or projects.
- FR-007: The system shall allow tenant admins to upgrade/downgrade between free, pro, and enterprise plans.
- FR-008: The system shall isolate tenant data so no tenant can access another tenant's resources.
- FR-009: The system shall log tenant-level actions into audit logs.

### User
- FR-010: The system shall allow tenant admins to invite and manage users within their tenant.
- FR-011: The system shall enforce email uniqueness per tenant.
- FR-012: The system shall allow role assignment of user, tenant_admin, and support super_admin (tenant_id = NULL).

### Project
- FR-013: The system shall allow creation, listing, updating, and deletion of projects within a tenant.
- FR-014: The system shall enforce plan-based maximum projects per tenant (free=3, pro=15, enterprise=50).
- FR-015: The system shall restrict project access to authenticated users within the same tenant.

### Task
- FR-016: The system shall allow creation, listing, updating, and deletion of tasks under projects.
- FR-017: The system shall allow assigning tasks to users within the same tenant.
- FR-018: The system shall track task status (e.g., todo, in_progress, done) and timestamps.
- FR-019: The system shall record task-related actions in audit logs with tenant_id context.

## Non-Functional Requirements

- NFR-001 (Performance): 90% of API responses shall complete within 200ms under nominal load.
- NFR-002 (Security): All passwords shall be hashed (bcrypt/Argon2), and JWTs shall expire in 24 hours.
- NFR-003 (Scalability): The system shall support at least 100 concurrent active users without degradation beyond SLA targets.
- NFR-004 (Availability): The system shall target 99% uptime for core services.
- NFR-005 (Usability): The frontend shall be mobile-responsive and provide clear error messaging for failed actions.
