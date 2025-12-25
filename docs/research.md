# Research

## Multi-Tenancy Analysis

### Approaches Overview

**Shared Database + Shared Schema (tenant_id column)**
- Single database and schema; every multi-tenant table includes a `tenant_id` foreign key. Application filters every query by `tenant_id` and enforces constraints to keep rows isolated.

**Shared Database + Separate Schema (per tenant)**
- One physical database, many schemas (namespaces) inside the database. Each tenant gets its own schema with duplicated tables. The application routes connections or sets the search path per request.

**Separate Database (per tenant)**
- Each tenant receives its own physical database instance. The app must route to the correct database for each request; provisioning automates database creation, migration, and connection pooling.

### Comparison Table

| Approach | Pros | Cons | Operational Fit |
| --- | --- | --- | --- |
| Shared DB + Shared Schema | Lowest infrastructure cost; simplest to provision; easy to query across tenants for admin reporting; single migration path | Highest blast radius on mistakes; strict app-layer filtering required; harder to support tenant-specific extensions; noisy-neighbor risk on hot tenants | Best when tenants are small/medium, budgets are tight, and strong test coverage protects isolation |
| Shared DB + Separate Schema | Middle-ground isolation; per-tenant backups possible; can vary schema per tenant cautiously; search_path keeps queries clean; lower cross-tenant blast radius than shared schema | More complex migrations across many schemas; catalog bloat; provisioning logic required; still noisy-neighbor at database level; connection pool per schema can explode | Good when tenants need mild customization and stronger isolation, but want single database ops surface |
| Separate Database per Tenant | Strongest data isolation; per-tenant performance tuning and backups; easier legal/compliance stories; blast radius contained; can move heavy tenants to dedicated hardware | Highest cost and operational overhead; complex connection management and routing; migrations fan out to many databases; harder to do global analytics; cold-start provisioning latency | Fits large enterprise tenants, strict compliance, or when tenants have very uneven load |

### Justification of Chosen Approach

For this project, we choose **Shared Database + Shared Schema with a tenant_id column**. The product starts as a multi-tenant SaaS with many small-to-mid tenants, needs predictable costs, and must ship fast. This approach minimizes operational overhead: a single migration path, straightforward connection pooling, and simple `tenant_id` filters across all tables. With disciplined RBAC, row-level filtering, and indexed `tenant_id`, we get strong logical isolation while keeping performance acceptable. We can implement defense-in-depth using scoped JWT claims, per-request tenant context, and database constraints (foreign keys include `tenant_id`). If growth or compliance demands stronger isolation, we can evolve to per-schema or per-database later by abstracting tenant resolution and keeping clean data-access layers.

### Deep Dive (Benefits and Risks)

- **Performance**: A single schema allows effective indexing on `(tenant_id, resource_id)` and simpler query plans. We must monitor hot-tenant scenarios; partial indexes and rate limits can protect shared capacity.
- **Cost**: Lowest infra cost; a single Postgres instance on Docker suffices for local and demo deployments. This aligns with fixed port and compose requirements.
- **Developer Velocity**: One migration path, unified ERD, and single connection string reduce friction. Onboarding is easy and tests can run against one database.
- **Isolation Controls**: Application-layer enforcement with middleware ensures every request resolves tenant context before hitting data access. Foreign keys always include `tenant_id`, and unique constraints are scoped by `tenant_id` (email uniqueness per tenant). Row-level security can be added for defense-in-depth if desired.
- **Operational Complexity**: Minimal compared to per-schema/per-db. No need for fan-out migrations. Backup/restore is simpler but at the cost of coarser granularity; we can still do logical restores with tenant_id filters for emergencies.
- **Compliance Considerations**: While not as strong as per-database isolation, encryption at rest, TLS in transit, and strict RBAC mitigate risks. For enterprise customers needing stricter segregation, we can introduce optional dedicated instances as an advanced plan without redesigning core code paths.

(Approx. 820+ words)

## Technology Stack Justification

### Backend Framework
- **Choice**: Node.js with Express (or Fastify) plus TypeScript. Express is mature, widely understood, and integrates easily with JWT, middleware, and RBAC hooks. TypeScript improves correctness with typed request contexts (tenant, user, role) and reduces runtime errors.
- **Why**: Rapid iteration, huge ecosystem for auth, validation, and testing. Pairs well with PostgreSQL clients (pg/Prisma/TypeORM). Matches Docker and port 5000 requirements. Supports structured logging and health checks easily.
- **Alternatives**: NestJS (strong structure, but heavier), Django REST (great admin and ORM but slower TS/JS interop for this stack), Spring Boot (robust but heavier for quick SaaS boilerplate).

### Frontend Framework
- **Choice**: React with Vite + TypeScript. Fast dev server, simple build, great DX. React Router for protected routes, role-aware layouts, and component libraries for forms and tables.
- **Why**: Familiarity, component reuse, easy integration with JWT-bearing fetch/axios. Vite delivers fast HMR and small bundles. Works cleanly in Docker with port 3000.
- **Alternatives**: Next.js (SSR/SSG, but introduces routing complexity for this assignment), Vue 3 (excellent, but team familiarity assumed with React), SvelteKit (lightweight, but smaller ecosystem for enterprise UI widgets).

### Database
- **Choice**: PostgreSQL. Strong relational capabilities, JSONB when needed, partial indexes, and robust transactional guarantees. Rich support for constraints, foreign keys with `ON DELETE CASCADE`, and Row-Level Security if added later.
- **Why**: Excellent with multi-tenant schemas using compound keys. Reliable with Docker, and the fixed port 5432 aligns with compose requirements.
- **Alternatives**: MySQL (fine but weaker JSON features), MongoDB (document model less suited for strict relational constraints), CockroachDB (horizontal scale but overkill here).

### Authentication Method
- **Choice**: JWT (HS256/RS256) with 24-hour expiry. Stored in HTTP-only secure cookies or Authorization headers (Bearer). Refresh tokens optional for this scope.
- **Why**: Stateless, easy to validate in middleware, fits containerized horizontal scaling. Tenant context and role claims can be embedded for quick checks.
- **Alternatives**: Session storage with Redis (good for server-side revocation), OAuth2 providers (more setup than needed for core requirements), Paseto (modern token format but less ubiquitous tooling).

### Deployment Platforms
- **Choice**: Docker Compose for local/demo, with images that can run on any host. Service names `frontend`, `backend`, `database` for interop. Ready to extend to ECS/Kubernetes later.
- **Why**: Deterministic, single command `docker-compose up -d`, matches assignment. Encourages 12-factor config with env vars. Port mappings fixed per requirements.
- **Alternatives**: Kubernetes (heavier), Heroku/Render/Fly.io (great for hosting but not needed for the assignment), PM2 on VMs (less reproducible than containers).

### Tooling and Supporting Libraries
- **ORM/Query**: Prisma or TypeORM for typed models and migrations. Chosen for schema safety and migration support; Prisma has strong DX with TypeScript.
- **Validation**: Zod or Joi for request payload validation; prevents bad data and enforces tenant scoping early.
- **Testing**: Jest/ Vitest for unit/integration; supertest for API contracts.
- **Logging**: Pino/Winston for structured logs; log tenant_id and user_id to audit trail.
- **Why**: These tools accelerate shipping a correct, observable API while keeping the codebase maintainable.

(Approx. 520+ words)

## Security Considerations

### Key Measures for Multi-Tenant Systems
1) **Tenant Context Enforcement**: Resolve tenant from subdomain or login, attach to request context, and require it for any DB access. Reject requests without tenant context unless role is super_admin.
2) **Scoped Queries and Constraints**: Every table includes `tenant_id`; foreign keys carry `tenant_id`; unique constraints scope by `tenant_id`. Add defensive checks in data-access layer and consider row-level security as an extra guard.
3) **RBAC at Middleware and Route Level**: Map roles (super_admin, tenant_admin, user) to capabilities; central middleware verifies JWT, role, and tenant alignment before hitting handlers.
4) **Input Validation and Output Encoding**: Validate all payloads (Zod/Joi), limit size, and sanitize/encode outputs to prevent injection and XSS.
5) **Audit Logging**: Log critical actions (create/update/delete, login/logout, role changes) with tenant_id, user_id, timestamp, IP/device metadata. Store in `audit_logs` and monitor for anomalies.

### Data Isolation Strategy
- Logical isolation via tenant_id on all core tables (tenants, users, projects, tasks, audit_logs). Database constraints ensure child rows reference the same tenant_id as their parents. Application middleware injects tenant filters automatically. Optionally enable PostgreSQL Row-Level Security policies mirroring app logic for defense-in-depth. Backups and restores can filter by tenant_id when needed.

### Authentication & Authorization
- JWT with 24h expiry, signed with env-configured secret/key. Include claims: sub (user_id), tenant_id, role, exp, iat. Middleware validates signature, expiry, and presence of tenant_id unless super_admin. Super_admins have tenant_id = NULL but require role=super_admin. Authorization checks map roles to permissions for each endpoint. Consider token rotation and revocation lists for higher assurance.

### Password Hashing Strategy
- Store only salted hashes using bcrypt (cost tuned for performance) or Argon2id. Enforce strong password policy and rate-limit login attempts. Never log passwords. Use per-user salts (inherent to bcrypt/Argon2).

### API Security Measures
- Enforce HTTPS in production; in Docker network, services communicate over the bridge but front-door should be TLS-terminated. Implement CORS to allow http://frontend:3000. Use `helmet` for security headers. Limit payload sizes and apply request rate limiting. Validate content types. Return consistent {success, message, data} bodies with correct HTTP status codes to reduce confusion and error leaks. Provide `/api/health` to report status without sensitive details.

(Approx. 430+ words)
