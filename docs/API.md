# API Documentation

This document explains all the API endpoints (the ways the frontend talks to the backend). Each endpoint does one specific thing.

**Base URL:** `http://localhost:5000/api`

---

## How to Use This Documentation

Each endpoint shows:
- **Method** - What type of request (GET, POST, PUT, DELETE, PATCH)
- **Endpoint** - The URL path
- **Auth** - If you need to be logged in
- **Request** - What data to send
- **Response** - What you get back
- **Example** - Real example with data

**Important:** Most endpoints need a JWT token. When you login, you get a token. Then send it in the header like this:
```
Authorization: Bearer your_token_here
```

---

## 🔐 Authentication Endpoints

These endpoints handle login and registration.

### 1. Register New Tenant

Create a new company and admin account at the same time.

**Method:** `POST`  
**Endpoint:** `/auth/register`  
**Auth Required:** No  

**Request Body:**
```json
{
  "tenantName": "My Company",
  "email": "admin@mycompany.com",
  "fullName": "John Doe",
  "password": "SecurePass123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Tenant and admin created successfully",
  "data": {
    "tenantId": "uuid-here",
    "userId": "uuid-here",
    "email": "admin@mycompany.com",
    "token": "jwt-token-here"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**What It Does:**
- Creates a new company (tenant)
- Creates an admin user for that company
- Returns a login token so you can use the app right away

---

### 2. Login

Login with email and password to get a token. Tenant context is required.

**Method:** `POST`  
**Endpoint:** `/auth/login`  
**Auth Required:** No  

**Request Body (using tenantSubdomain):**
```json
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}
```

**Alternative Request Body (using tenantId):**
```json
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantId": "11111111-1111-1111-1111-111111111111"
}
```

Note: Provide either `tenantSubdomain` or `tenantId` for tenant users. Super admins can log in without tenant context.

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@demo.com",
      "fullName": "Demo Admin",
      "role": "tenant_admin",
      "tenantId": "uuid-here"
    },
    "token": "jwt-token-here",
    "expiresIn": 86400
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**What It Does:**
- Checks if email and password are correct
- Resolves tenant by `tenantSubdomain` or `tenantId`
- Returns a token for authenticated requests

---

## 📊 Project Endpoints

These endpoints manage projects (containers for tasks).

### 3. Get All Projects

Get list of all projects for your company.

**Method:** `GET`  
**Endpoint:** `/projects`  
**Auth Required:** Yes (add token to header)  

**Query Parameters (optional):**
```
status=active      (active or archived)
search=website     (search by name)
limit=10           (how many to return)
offset=0           (skip this many)
```

**Example Request:**
```
GET /api/projects?status=active&search=website
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "tenantId": "uuid-tenant",
      "name": "Website Redesign",
      "description": "Update our company website",
      "status": "active",
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z",
      "taskCount": 5
    },
    {
      "id": "uuid-2",
      "tenantId": "uuid-tenant",
      "name": "Mobile App",
      "description": "Build iOS and Android apps",
      "status": "active",
      "createdAt": "2024-12-19T10:00:00Z",
      "updatedAt": "2024-12-19T10:00:00Z",
      "taskCount": 8
    }
  ]
}
```

**What It Does:**
- Returns all projects for your company
- Can filter by status or search by name
- Shows how many tasks each project has

---

### 4. Create New Project

Create a new project in your company.

**Method:** `POST`  
**Endpoint:** `/projects`  
**Auth Required:** Yes  

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Update our company website design",
  "status": "active"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "uuid-here",
    "tenantId": "uuid-tenant",
    "name": "Website Redesign",
    "description": "Update our company website design",
    "status": "active",
    "createdAt": "2024-12-20T10:00:00Z",
    "updatedAt": "2024-12-20T10:00:00Z"
  }
}
```

**What It Does:**
- Creates a new project for your company
- Only you can see this project, not other companies
- Status can be "active" or "archived"

---

### 5. Get One Project Details

Get all information about one project.

**Method:** `GET`  
**Endpoint:** `/projects/:id`  
**Auth Required:** Yes  

**Example Request:**
```
GET /api/projects/uuid-here
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "tenantId": "uuid-tenant",
    "name": "Website Redesign",
    "description": "Update our company website design",
    "status": "active",
    "createdAt": "2024-12-20T10:00:00Z",
    "updatedAt": "2024-12-20T10:00:00Z",
    "tasks": [
      {
        "id": "uuid-task-1",
        "title": "Design homepage",
        "status": "in_progress",
        "priority": "high"
      }
    ]
  }
}
```

**What It Does:**
- Returns one project and all its tasks
- Only if you have permission (same company)

---

### 6. Update Project

Change project name, description, or status.

**Method:** `PUT`  
**Endpoint:** `/projects/:id`  
**Auth Required:** Yes  

**Request Body:**
```json
{
  "name": "Website Redesign Phase 2",
  "description": "Second phase of website update",
  "status": "archived"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "uuid-here",
    "tenantId": "uuid-tenant",
    "name": "Website Redesign Phase 2",
    "description": "Second phase of website update",
    "status": "archived",
    "createdAt": "2024-12-20T10:00:00Z",
    "updatedAt": "2024-12-20T11:00:00Z"
  }
}
```

**What It Does:**
- Changes project information
- Can change name, description, or mark as archived
- Only project owner can update

---

### 7. Delete Project

Delete a project (and all its tasks).

**Method:** `DELETE`  
**Endpoint:** `/projects/:id`  
**Auth Required:** Yes  

**Example Request:**
```
DELETE /api/projects/uuid-here
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "You don't have permission to delete this project"
}
```

**What It Does:**
- Permanently deletes a project
- Also deletes all tasks in that project
- Cannot be undone!

---

## ✅ Task Endpoints

These endpoints manage tasks (things to do inside projects).

### 8. Get All Tasks in Project

Get list of all tasks in one project.

**Method:** `GET`  
**Endpoint:** `/projects/:projectId/tasks`  
**Auth Required:** Yes  

**Query Parameters (optional):**
```
status=todo           (todo, in_progress, or completed)
priority=high         (low, medium, or high)
assignedTo=user-id    (filter by user)
```

**Example Request:**
```
GET /api/projects/uuid-project/tasks?status=in_progress
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-task-1",
      "projectId": "uuid-project",
      "title": "Design homepage",
      "description": "Create homepage design in Figma",
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2024-12-25",
      "assignedTo": {
        "id": "uuid-user",
        "fullName": "John Doe",
        "email": "john@company.com"
      },
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z"
    }
  ]
}
```

**What It Does:**
- Returns all tasks in a project
- Can filter by status, priority, or assigned user
- Shows who the task is assigned to

---

### 9. Create New Task

Add a new task to a project.

**Method:** `POST`  
**Endpoint:** `/projects/:projectId/tasks`  
**Auth Required:** Yes  

**Request Body:**
```json
{
  "title": "Design homepage",
  "description": "Create homepage design in Figma",
  "priority": "high",
  "dueDate": "2024-12-25",
  "assignedTo": "uuid-user-id"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "uuid-here",
    "projectId": "uuid-project",
    "title": "Design homepage",
    "description": "Create homepage design in Figma",
    "status": "todo",
    "priority": "high",
    "dueDate": "2024-12-25",
    "assignedTo": "uuid-user-id",
    "createdAt": "2024-12-20T10:00:00Z",
    "updatedAt": "2024-12-20T10:00:00Z"
  }
}
```

**What It Does:**
- Creates a new task in a project
- Can assign to a team member
- Status starts as "todo"

---

### 10. Get One Task Details

Get all information about one task.

**Method:** `GET`  
**Endpoint:** `/tasks/:id`  
**Auth Required:** Yes  

**Example Request:**
```
GET /api/tasks/uuid-task-id
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-task-id",
    "projectId": "uuid-project",
    "title": "Design homepage",
    "description": "Create homepage design in Figma",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2024-12-25",
    "assignedTo": {
      "id": "uuid-user",
      "fullName": "John Doe",
      "email": "john@company.com"
    },
    "createdAt": "2024-12-20T10:00:00Z",
    "updatedAt": "2024-12-20T10:00:00Z"
  }
}
```

**What It Does:**
- Returns one task with all details
- Shows who it's assigned to

---

### 11. Update Task

Change task title, description, priority, or due date.

**Method:** `PUT`  
**Endpoint:** `/tasks/:id`  
**Auth Required:** Yes  

**Request Body:**
```json
{
  "title": "Design homepage and footer",
  "description": "Create homepage and footer design in Figma",
  "priority": "medium",
  "dueDate": "2024-12-28",
  "assignedTo": "uuid-user-id"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "uuid-task-id",
    "projectId": "uuid-project",
    "title": "Design homepage and footer",
    "description": "Create homepage and footer design in Figma",
    "status": "in_progress",
    "priority": "medium",
    "dueDate": "2024-12-28",
    "assignedTo": "uuid-user-id",
    "updatedAt": "2024-12-20T11:00:00Z"
  }
}
```

**What It Does:**
- Changes task information
- Can change title, description, priority, or due date
- Can reassign to different person

---

### 12. Change Task Status

Change task from todo → in_progress → completed.

**Method:** `PATCH`  
**Endpoint:** `/tasks/:id/status`  
**Auth Required:** Yes  

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Valid Status Values:**
- `todo` - Not started yet
- `in_progress` - Currently being worked on
- `completed` - Finished

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Task status updated to in_progress",
  "data": {
    "id": "uuid-task-id",
    "status": "in_progress",
    "updatedAt": "2024-12-20T11:00:00Z"
  }
}
```

**What It Does:**
- Only changes the status
- Faster than full update when you just want to change status
- Common when team member marks task as done

---

### 13. Delete Task

Delete a task.

**Method:** `DELETE`  
**Endpoint:** `/tasks/:id`  
**Auth Required:** Yes  

**Example Request:**
```
DELETE /api/tasks/uuid-task-id
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**What It Does:**
- Permanently deletes a task
- Cannot be undone
- Only project owner can delete

---

## 👥 User Endpoints

These endpoints manage team members in your company.

### 14. Get All Users in Company

Get list of all team members.

**Method:** `GET`  
**Endpoint:** `/tenants/:tenantId/users`  
**Auth Required:** Yes  

**Query Parameters (optional):**
```
role=tenant_admin     (filter by role)
isActive=true         (active or inactive users)
search=john           (search by name or email)
```

**Example Request:**
```
GET /api/tenants/uuid-tenant/users
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-user-1",
      "email": "john@company.com",
      "fullName": "John Doe",
      "role": "tenant_admin",
      "isActive": true,
      "createdAt": "2024-12-20T10:00:00Z"
    },
    {
      "id": "uuid-user-2",
      "email": "jane@company.com",
      "fullName": "Jane Smith",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-12-20T10:30:00Z"
    }
  ]
}
```

**What It Does:**
- Shows all team members in your company
- Can filter by role (admin or regular user)
- Can see if they're active or deactivated

---

### 15. Create New User

Add a new team member to your company.

**Method:** `POST`  
**Endpoint:** `/tenants/:tenantId/users`  
**Auth Required:** Yes (must be admin)  

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "fullName": "Bob Johnson",
  "password": "SecurePass123",
  "role": "user",
  "isActive": true
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid-new-user",
    "email": "newuser@company.com",
    "fullName": "Bob Johnson",
    "role": "user",
    "isActive": true,
    "tenantId": "uuid-tenant",
    "createdAt": "2024-12-20T11:00:00Z"
  }
}
```

**What It Does:**
- Adds new team member to company
- Only admin can create users
- Role can be "user" (regular) or "tenant_admin" (admin)

---

### 16. Update User

Change user information (name, role, or status).

**Method:** `PUT`  
**Endpoint:** `/users/:id`  
**Auth Required:** Yes (must be admin)  

**Request Body:**
```json
{
  "fullName": "Robert Johnson",
  "role": "tenant_admin",
  "isActive": true
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid-user",
    "email": "newuser@company.com",
    "fullName": "Robert Johnson",
    "role": "tenant_admin",
    "isActive": true,
    "updatedAt": "2024-12-20T11:30:00Z"
  }
}
```

**What It Does:**
- Changes user name, role, or active status
- Can't change email
- Deactivating user prevents them from logging in

---

### 17. Delete User

Remove a team member from your company.

**Method:** `DELETE`  
**Endpoint:** `/users/:id`  
**Auth Required:** Yes (must be admin)  

**Example Request:**
```
DELETE /api/users/uuid-user-id
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**What It Does:**
- Removes user from company
- User can no longer login
- Their assignments stay (tasks still assigned to them)

---

## 🏢 Tenant Endpoints

These endpoints manage companies. Only super admin can use these.

### 18. Get All Companies

Get list of all companies (super admin only).

**Method:** `GET`  
**Endpoint:** `/tenants`  
**Auth Required:** Yes (must be super admin)  

**Example Request:**
```
GET /api/tenants
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-tenant-1",
      "name": "Company A",
      "email": "admin@companya.com",
      "createdAt": "2024-12-20T10:00:00Z",
      "userCount": 5
    },
    {
      "id": "uuid-tenant-2",
      "name": "Company B",
      "email": "admin@companyb.com",
      "createdAt": "2024-12-20T10:30:00Z",
      "userCount": 3
    }
  ]
}
```

**What It Does:**
- Shows all companies in the system
- Only super admin can see this
- Shows how many users each company has

---

### 19. Get One Company Details

Get information about one company (super admin only).

**Method:** `GET`  
**Endpoint:** `/tenants/:id`  
**Auth Required:** Yes (must be super admin)  

**Example Request:**
```
GET /api/tenants/uuid-tenant-id
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-tenant-id",
    "name": "Company A",
    "email": "admin@companya.com",
    "createdAt": "2024-12-20T10:00:00Z",
    "users": 5,
    "projects": 3,
    "tasks": 12
  }
}
```

**What It Does:**
- Shows information about one company
- Includes stats about users, projects, tasks

---

### 20. Update Company

Change company name (super admin only).

**Method:** `PUT`  
**Endpoint:** `/tenants/:id`  
**Auth Required:** Yes (must be super admin)  

**Request Body:**
```json
{
  "name": "Company A Renamed"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "uuid-tenant-id",
    "name": "Company A Renamed",
    "updatedAt": "2024-12-20T11:00:00Z"
  }
}
```

**What It Does:**
- Changes company name
- Only super admin can do this

---

### 21. Delete Company

Delete entire company (super admin only).

**Method:** `DELETE`  
**Endpoint:** `/tenants/:id`  
**Auth Required:** Yes (must be super admin)  

**Example Request:**
```
DELETE /api/tenants/uuid-tenant-id
Authorization: Bearer your-token
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

**What It Does:**
- Permanently deletes company
- Also deletes all users, projects, tasks
- Cannot be undone!

---

## 🏥 Health Check Endpoint

Check if backend is running.

### 22. Health Check

Check backend and database status.

**Method:** `GET`  
**Endpoint:** `/health`  
**Auth Required:** No  

**Example Request:**
```
GET /api/health
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Server is healthy",
  "status": "ok",
  "database": "connected"
}
```

**Response (Error - 503):**
```json
{
  "success": false,
  "message": "Database connection failed",
  "status": "unhealthy",
  "database": "disconnected"
}
```

**What It Does:**
- Checks if backend is running
- Checks if database is connected
- Used to verify everything is working

---

## 📋 Response Format

All responses follow this pattern:

**Success Response:**
```json
{
  "success": true,
  "message": "What happened",
  "data": { /* the actual data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "What went wrong"
}
```

---

## 🔑 Authentication

Most endpoints need a JWT token. When you login, you get a token like:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ...
```

**How to use the token:**

Add it to every request header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires after 24 hours. Login again to get a new token.

---

## ❌ Common Errors

### 401 Unauthorized
**Problem:** You forgot the token or it expired  
**Solution:** Login again to get new token

### 403 Forbidden
**Problem:** You don't have permission  
**Solution:** Only admin can do this action

### 404 Not Found
**Problem:** That resource doesn't exist  
**Solution:** Check the ID is correct

### 400 Bad Request
**Problem:** Your data is wrong  
**Solution:** Check required fields are filled correctly

### 500 Server Error
**Problem:** Server crashed  
**Solution:** Try again, if it keeps happening check logs

---

## Testing the API

### Using curl (Command line)

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123"}'

# Get projects (replace TOKEN with your token)
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Download Postman from postman.com
2. Create new request
3. Choose method (GET, POST, etc)
4. Enter URL (e.g., http://localhost:5000/api/projects)
5. Go to Headers tab
6. Add: `Authorization: Bearer your-token`
7. Click Send

---

**Last Updated:** December 2025  
**API Version:** 1.0.0  
**Status:** Ready for use
