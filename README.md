# Multi-Tenant SaaS Platform with Project & Task Management

## Project Description

A complete web application that allows multiple companies (tenants) to manage their own projects and tasks. Each company has their own separate workspace with users, projects, and tasks that are completely isolated from other companies. Users can create projects, add tasks to those projects, assign tasks to team members, and track progress.

**For:** Teams and small businesses that need to organize and track their work  
**Main Goal:** Make it easy for companies to manage projects and tasks in their own private workspace

---

## Key Features

- **Multi-Tenant System** - Multiple companies can use the same app, each with their own completely separate data
- **User Accounts** - Register and login with email and password. Different user roles (super admin, tenant admin, regular user)
- **Project Management** - Create projects, view all projects, edit project names and descriptions, delete projects you don't need
- **Task Management** - Add tasks to projects, assign tasks to team members, set due dates, change task status (todo/in progress/completed)
- **Team Users** - Manage team members, give different roles to different people, activate/deactivate users
- **Search & Filter** - Find projects and tasks quickly by searching or filtering by status and priority
- **Dashboard** - See statistics about your projects and tasks at a glance
- **Docker Ready** - The entire app runs in Docker containers with a single command
- **Automatic Setup** - Database tables and test data are created automatically when you start the app

---

## Technology Stack

### Frontend (User interface)
- **React 18.3.1** - Framework for building the user interface
- **TypeScript 5.4** - JavaScript with type safety to catch errors
- **Tailwind CSS** - Framework for styling and making it look nice
- **React Router 6.22.3** - Handles navigation between pages
- **Axios 1.6.8** - Makes requests to the backend API
- **Vite 5.1** - Tool to build and run the frontend

### Backend (Server API)
- **Node.js 20** - JavaScript runtime for running server code
- **Express.js 4.19** - Framework for creating the API
- **TypeScript 5.4** - JavaScript with type safety
- **PostgreSQL 15** - Database to store all the data
- **JWT (jsonwebtoken)** - Secure way to handle login sessions
- **bcrypt** - Safely store passwords (never store plain passwords)
- **Zod** - Check that data is correct before saving it

### DevOps (Deployment)
- **Docker 20+** - Containers to package the app and make it easy to run anywhere
- **Docker Compose 3.8** - Runs multiple containers together (database, backend, frontend)
- **Alpine Linux** - Lightweight operating system for containers

---

## How It All Works Together

The app has three main parts that work together:

```
┌─────────────────────────────────────────────────────┐
│                  User's Computer                    │
│                  (Browser: localhost:3000)          │
│  ┌──────────────────────────────────────────────┐   │
│  │          React Frontend                      │   │
│  │  - Shows login page, dashboard, projects    │   │
│  │  - User can click buttons to add projects   │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
                        ↕ (talks to API)
┌──────────────────────────────────────────────────────┐
│              Backend Server (localhost:5000)        │
│  ┌──────────────────────────────────────────────┐   │
│  │          Node.js + Express API              │   │
│  │  - Handles login                             │   │
│  │  - Manages projects and tasks               │   │
│  │  - Manages users and permissions            │   │
│  │  - Connects to the database                 │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
                        ↕ (reads/writes data)
┌──────────────────────────────────────────────────────┐
│              Database (localhost:5432)             │
│  ┌──────────────────────────────────────────────┐   │
│  │            PostgreSQL Database              │   │
│  │  - Stores all users                         │   │
│  │  - Stores all projects                      │   │
│  │  - Stores all tasks                         │   │
│  │  - Each company has separate data           │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**How it works step by step:**
1. User opens browser and types `localhost:3000`
2. Frontend (React) loads and shows login page
3. User enters email and password
4. Frontend sends login request to backend
5. Backend checks if email/password is correct
6. If correct, backend sends back a token
7. Frontend saves token and shows dashboard
8. When user clicks "Add Project", frontend sends request to backend
9. Backend creates project in database
10. Backend sends confirmation back to frontend
11. Frontend shows new project on screen

---

## Getting Started

### Prerequisites

Before you can run this app, make sure you have:

1. **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
   - On Windows/Mac: Install and run Docker Desktop app
   - On Linux: Install Docker from your package manager

2. **Internet Connection** - First time takes a few minutes to download code and packages

3. **Available Ports** - Make sure these ports are not being used:
   - `3000` (Frontend)
   - `5000` (Backend API)
   - `5432` (Database)

### How to Run

1. **Open Terminal/Command Prompt**
   - On Windows: Press Windows Key, type "Command Prompt", press Enter
   - On Mac/Linux: Open Terminal application

2. **Navigate to Project**
   ```
   cd /path/to/Multi-Tenant-SaaS-Platform-with-Project-Task-Management
   ```

3. **Start Everything**
   ```
   docker-compose up -d
   ```
   This starts the database, backend, and frontend all at once.

4. **Wait for Services to Start**
   Check status:
   ```
   docker-compose ps
   ```
   All three should show "Up". Wait 30-60 seconds on first run.

5. **Open Your Browser**
   Type this in address bar: `http://localhost:3000`

6. **Login**
   - Super Admin (no tenant context needed): `superadmin@system.com` / `Admin@123`
   - Tenant accounts (include subdomain `demo`):
     - `admin@demo.com` / `Demo@123` / Subdomain: `demo`
     - `user1@demo.com` / `User@123` / Subdomain: `demo`
     - `user2@demo.com` / `User@123` / Subdomain: `demo`

7. **Start Using**
   - Click "Projects" to see projects
   - Click "Users" to manage team members
   - Click "Dashboard" to see overview

### Stop Services

```
docker-compose down
```

---

## Environment Variables

These are settings that control how the app works. They're stored in the `.env` file.

| Variable | What It Is | Example |
|----------|-----------|---------|
| `PORT` | What port the backend listens on | `5000` |
| `NODE_ENV` | If it's development or production | `production` |
| `DATABASE_URL` | Where the database is located | `postgresql://postgres:postgres@database:5432/saas_db` |
| `JWT_SECRET` | Secret key for login tokens | `your_secret_key_min_32_chars` |
| `FRONTEND_URL` | Where the frontend is running | `http://frontend:3000` |
| `DB_HOST` | Database server address | `database` |
| `DB_PORT` | Database server port | `5432` |
| `DB_NAME` | Database name | `saas_db` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |

---

## API Documentation

The backend provides an API (a way for the frontend to talk to it). Here's what endpoints are available:

### Authentication
- `POST /api/auth/register` - Create new tenant and admin account
- `POST /api/auth/login` - Login with email and password

### Projects
- `GET /api/projects` - Get all projects for current tenant
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get one project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/projects/:projectId/tasks` - Get all tasks in a project
- `POST /api/projects/:projectId/tasks` - Add new task to project
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Change task status
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/tenants/:tenantId/users` - Get all users in tenant
- `POST /api/tenants/:tenantId/users` - Add new user to tenant
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tenants
- `GET /api/tenants` - Get all tenants (admin only)
- `POST /api/tenants` - Create new tenant (admin only)
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Health Check
- `GET /api/health` - Check if backend is running and database is connected

Full API documentation is in `docs/API.md`

---

## Project Structure

```
Multi-Tenant-SaaS-Platform-with-Project-Task-Management/
│
├── backend/                    # Backend API code
│   ├── src/
│   │   ├── app.ts             # Express app setup
│   │   ├── server.ts          # Server startup
│   │   ├── db.ts              # Database connection
│   │   ├── routes/            # All API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── projects.routes.ts
│   │   │   ├── tasks.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── tenants.routes.ts
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Authentication, etc
│   │   ├── validators/        # Check data is correct
│   │   └── types/             # TypeScript interfaces
│   ├── migrations/            # Database schema files
│   ├── seeds/                 # Test data
│   ├── Dockerfile             # Instructions to build backend
│   └── docker-entrypoint.sh   # Startup script
│
├── frontend/                   # Frontend React code
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Register.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProjectsList.tsx
│   │   │   ├── ProjectDetails.tsx
│   │   │   └── UsersList.tsx
│   │   ├── components/        # Reusable parts
│   │   │   ├── Navbar.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Modals/
│   │   ├── context/           # Global state
│   │   │   └── AuthContext.tsx
│   │   ├── api/               # Talks to backend
│   │   │   └── client.ts
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── Dockerfile             # Instructions to build frontend
│   └── vite.config.ts         # Build configuration
│
├── docker-compose.yml         # Run all containers together
│
├── docs/                       # Documentation
│   └── API.md                 # Full API documentation
│
├── README.md                  # This file
├── submission.json            # Details for evaluation
│
└── .env                       # Configuration (auto-created)
```

---

## Troubleshooting

### Services won't start
**Problem:** `docker-compose up -d` doesn't work  
**Solution:**
1. Make sure Docker Desktop is running
2. Open a new terminal and try again
3. Check error messages: `docker-compose logs`

### Can't login
**Problem:** Login doesn't work with test accounts  
**Solution:**
1. Include the tenant subdomain `demo` when logging in
2. Wait 30 seconds after starting; the database needs time to load seed data
3. Try: `docker-compose down` then `docker-compose up -d` again
4. Check database: `docker-compose logs database`

### Port already in use
**Problem:** Error about port 3000, 5000, or 5432 already in use  
**Solution:**
1. Find what's using the port:
   - Windows: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess`
   - Mac/Linux: `lsof -i :5000`
2. Stop that program or use different ports
3. Or: `docker-compose down` to free up all ports

### Frontend can't connect to backend
**Problem:** Frontend shows error about connecting to API  
**Solution:**
1. Check backend is running: `docker-compose ps`
2. Check backend health: `curl http://localhost:5000/api/health`
3. If returns error, check logs: `docker-compose logs backend`

### Database connection failed
**Problem:** Backend shows database error  
**Solution:**
1. Check database is running: `docker-compose ps database`
2. Should show "healthy"
3. If not, wait 30 seconds and check again
4. If still fails: `docker-compose down -v` then `docker-compose up -d`

---

## More Information

- **Full API Documentation:** See `docs/API.md`
- **Submission Details:** See `submission.json`
- **Docker Setup:** See `STEP_5_2_COMPLETE.md`
- **Database Setup:** See `TASK_5_2_2_DB_INIT.md`

---

## How to Use the App

### As a Super Admin
1. Login with: `superadmin@system.com` / `Admin@123`
2. You can see all companies (tenants) in the system
3. You can create new companies

### As a Company Admin
1. Login with: `admin@demo.com` / `Demo@123`
2. You can manage projects and tasks
3. You can add/remove team members
4. You control what each team member can do

### As a Team Member
1. Login with: `user1@demo.com` / `User@123`
2. You can see projects and tasks
3. You can see tasks assigned to you
4. You can update task status

---

## Features Explained

### Projects
A project is a container for tasks. For example, "Website Redesign" is a project. You:
- Create a new project
- Give it a name and description
- Mark it as active or archived
- See all tasks in the project

### Tasks
A task is something that needs to be done. For example, "Design homepage" is a task. You:
- Create a task in a project
- Assign it to a team member
- Set a due date
- Change status (todo → in progress → completed)
- Set priority (low, medium, high)

### Users
You can add team members to your company. They can:
- Login with their email
- See projects and tasks
- Only see their company's data (not other companies)
- Have different roles (admin, regular user)

---

## Security

**Passwords:** Stored safely using bcrypt - even if database is hacked, passwords can't be read

**Login:** Uses JWT tokens - when you login, you get a special token that proves you logged in

**Isolation:** Each company's data is completely separate - Company A can never see Company B's data

**Permissions:**
- Super admin can see everything
- Company admins can manage their company
- Regular users can see only their company's projects and tasks

---

## What I Learned Building This

This app shows real-world features that production apps have:
- **Multi-tenancy** - How to build apps for multiple customers
- **Authentication** - How to safely handle login
- **Authorization** - How to control who can see what
- **API Design** - How to design good endpoints
- **Database Design** - How to structure data
- **Docker** - How to package and run apps
- **Full Stack** - Frontend + Backend + Database all together

---

## Support

If something doesn't work:
1. Check the troubleshooting section above
2. Look at error messages in `docker-compose logs`
3. Make sure you waited long enough for services to start
4. Try restarting: `docker-compose down` then `docker-compose up -d`

---

**Created:** December 2025  
**Version:** 1.0.0  
**Status:** Ready for evaluation
