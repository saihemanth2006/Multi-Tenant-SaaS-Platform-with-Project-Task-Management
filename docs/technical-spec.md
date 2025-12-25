# Technical Specification

## Project Structure

### Backend
```
backend/
  package.json
  tsconfig.json
  dockerfile
  .env.example
  prisma/
    schema.prisma          # DB models, tenant_id on all tenant tables
    migrations/            # Auto-generated migrations
    seed.ts                # Seed super_admin and sample tenant
  src/
    server.ts              # App entrypoint
    app.ts                 # Express app wiring
    config/                # Env, database client, CORS, logger config
    routes/                # Route registrations by module
      auth.routes.ts
      tenants.routes.ts
      users.routes.ts
      projects.routes.ts
      tasks.routes.ts
      audit.routes.ts
      health.routes.ts
    controllers/           # Request handlers (thin; delegate to services)
    services/              # Business logic and plan enforcement
    middleware/            # Auth, RBAC, tenant resolution, validation
    validators/            # Zod/Joi schemas per endpoint
    models/                # DTOs/types (if not using Prisma types directly)
    utils/                 # Helpers (responses, error formatting)
    rbac/                  # Role/permission maps
    audit/                 # Audit logging helpers
  tests/
    integration/           # supertest-powered API specs
    unit/                  # Service and helper tests
```

### Frontend
```
frontend/
  package.json
  vite.config.ts
  dockerfile
  .env.example
  src/
    main.tsx               # App bootstrap
    App.tsx                # Routes
    routes/                # Route definitions and loaders/guards
    pages/                 # Page-level views (Login, Register, Dashboard, Projects, ProjectDetail, Users)
    components/            # Reusable UI (forms, tables, nav, cards)
    hooks/                 # Auth, API, tenant context hooks
    api/                   # Fetch/Axios clients, typed endpoints
    context/               # Auth and tenant providers
    utils/                 # Helpers (formatters, guards)
    styles/                # Global styles / theme tokens
    types/                 # Shared TypeScript types
  tests/
    unit/                  # Component tests
    e2e/                   # Cypress/Playwright (optional)
```

### Infrastructure
```
docker-compose.yml         # Services: frontend:3000, backend:5000, database:5432
.env                       # Unified env for compose (dev/demo values)
```

## Development Setup Guide

### Prerequisites
- Node.js 18+ (LTS)
- npm 9+ or pnpm/yarn (choose one)
- Docker + Docker Compose
- Git

### Environment Variables
Create `.env` at repo root (used by docker-compose) and per service `.env` copies:
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `POSTGRES_DB=multitenant`
- `DATABASE_URL=postgresql://postgres:postgres@database:5432/multitenant?schema=public`
- `PORT=5000` (backend)
- `JWT_SECRET=devsecret`
- `CORS_ORIGIN=http://frontend:3000`
- `PLAN_FREE_MAX_USERS=5`
- `PLAN_FREE_MAX_PROJECTS=3`
- `PLAN_PRO_MAX_USERS=25`
- `PLAN_PRO_MAX_PROJECTS=15`
- `PLAN_ENTERPRISE_MAX_USERS=100`
- `PLAN_ENTERPRISE_MAX_PROJECTS=50`
- Frontend dev: `VITE_API_BASE=http://backend:5000`

### Installation Steps
1) Clone repo.
2) Install backend deps: `cd backend && npm install`.
3) Install frontend deps: `cd frontend && npm install`.

### Run Locally (without Docker)
1) Start Postgres locally (match env vars) or via `docker compose up database -d`.
2) Apply migrations and seed (example with Prisma): `npm run prisma:migrate && npm run prisma:seed` (from backend).
3) Start backend: `npm run dev` (port 5000).
4) Start frontend: `npm run dev -- --port 3000` (ensure it points to backend via `VITE_API_BASE`).

### Run with Docker (recommended)
1) Ensure `.env` exists at repo root with values above.
2) Run `docker-compose up -d` from repo root (brings up database, backend, frontend).
3) Frontend available at http://localhost:3000, backend at http://localhost:5000, Postgres at localhost:5432.
4) Migrations/seed run automatically on backend container start (entrypoint script or prisma migrate + seed).

### Run Tests
- Backend unit/integration: `cd backend && npm test` (Jest/Vitest + supertest).
- Frontend unit: `cd frontend && npm test` (Vitest/RTL).
- E2E (optional): `cd frontend && npx playwright test` or `npx cypress run`.

### Notes
- Use service names inside Docker network: `http://backend:5000` from frontend; `database` hostname from backend.
- JWT expiry fixed at 24h; plan limits enforced in services before creates.
- Health check: GET /api/health returns service and DB status.
