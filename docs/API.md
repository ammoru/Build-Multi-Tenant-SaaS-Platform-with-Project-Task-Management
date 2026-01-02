# API Documentation - Multi-Tenant SaaS Platform

Complete documentation of all 19 API endpoints with request/response examples, authentication requirements, and error handling.

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Tenant Management APIs](#tenant-management-apis)
3. [User Management APIs](#user-management-apis)
4. [Project Management APIs](#project-management-apis)
5. [Task Management APIs](#task-management-apis)
6. [Health Check](#health-check)
7. [Response Format](#response-format)
8. [Error Handling](#error-handling)

---

## API Base URL

### Development
```
http://localhost:5000/api
```

### Production (Docker)
```
http://backend:5000/api
```

---

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

**Token Expiration**: 24 hours

**Token Payload**:
```json
{
  "userId": "uuid",
  "tenantId": "uuid or null for super_admin",
  "role": "super_admin|tenant_admin|user"
}
```

---

## Authentication APIs

### API 1: Register Tenant

Creates a new organization (tenant) with an admin user.

**Endpoint**: `POST /api/auth/register-tenant`

**Authentication**: None (Public)

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "tenantName": "Acme Corporation",
  "subdomain": "acme",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePass@123",
  "adminFullName": "John Smith"
}
```

**Request Validation**:
- `tenantName`: Required, string, min 2 chars
- `subdomain`: Required, string, unique, lowercase alphanumeric + hyphens
- `adminEmail`: Required, valid email format, unique per tenant
- `adminPassword`: Required, min 8 characters
- `adminFullName`: Required, string, min 2 chars

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "subdomain": "acme",
    "adminUser": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "admin@acme.com",
      "fullName": "John Smith",
      "role": "tenant_admin"
    }
  }
}
```

**Error Responses**:

400 - Validation Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "tenantName": "Tenant name must be at least 2 characters",
    "adminPassword": "Password must be at least 8 characters"
  }
}
```

409 - Conflict:
```json
{
  "success": false,
  "message": "Subdomain already exists"
}
```

**Business Logic**:
- Creates tenant with default 'free' plan
- Hashes password using bcrypt
- Uses database transaction (atomic operation)
- Logs action in audit_logs

---

### API 2: Login

Authenticates a user and returns JWT token.

**Endpoint**: `POST /api/auth/login`

**Authentication**: None (Public)

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "admin@acme.com",
  "password": "SecurePass@123",
  "tenantSubdomain": "acme"
}
```

**Notes**: 
- `tenantSubdomain` is optional for super_admin users
- Super admin can login with just email/password
- Tenant users must provide subdomain OR tenantId

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "admin@acme.com",
      "fullName": "John Smith",
      "role": "tenant_admin",
      "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJ0ZW5hbnRJZCI6ImY0N2FjMTBiLTU4Y2MtNDM3Mi1hNTY3LTBlMDJiMmMzZDQ3OSIsInJvbGUiOiJ0ZW5hbnRfYWRtaW4iLCJpYXQiOjE3MDQxOTI0NDAsImV4cCI6MTcwNDI3ODg0MH0.sJg_pWe_qWx8z9m0k1-6y2v3u4t5s6r7q8p9o0n1m2",
    "expiresIn": 86400
  }
}
```

**Error Responses**:

401 - Invalid Credentials:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

404 - Tenant Not Found:
```json
{
  "success": false,
  "message": "Tenant not found"
}
```

403 - Account Suspended:
```json
{
  "success": false,
  "message": "Your account is suspended. Please contact administrator."
}
```

**Business Logic**:
- Verifies tenant exists and is active
- Verifies user belongs to tenant (or is super_admin)
- Compares password hash
- Generates JWT token with 24h expiry
- Logs login in audit_logs

---

### API 3: Get Current User

Retrieves the authenticated user's profile and tenant information.

**Endpoint**: `GET /api/auth/me`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "admin@acme.com",
    "fullName": "John Smith",
    "role": "tenant_admin",
    "isActive": true,
    "tenant": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Acme Corporation",
      "subdomain": "acme",
      "status": "active",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Responses**:

401 - Unauthorized:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

404 - User Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

**Business Logic**:
- Validates JWT token
- Fetches user with tenant information
- Does NOT return password hash
- Returns full tenant info for frontend initialization

---

### API 4: Logout

Logs out the authenticated user.

**Endpoint**: `POST /api/auth/logout`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**: None (can be empty)

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses**:

401 - Unauthorized:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Business Logic**:
- Validates JWT token
- Logs logout action in audit_logs
- Client removes token from localStorage

---

## Tenant Management APIs

### API 5: Get Tenant Details

Retrieves detailed information about a specific tenant including statistics.

**Endpoint**: `GET /api/tenants/:tenantId`

**Authentication**: Required

**Authorization**: User must belong to tenant OR be super_admin

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `tenantId` (uuid): The ID of the tenant to retrieve

**Query Parameters**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Acme Corporation",
    "subdomain": "acme",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z",
    "stats": {
      "totalUsers": 8,
      "totalProjects": 5,
      "totalTasks": 42
    }
  }
}
```

**Error Responses**:

403 - Forbidden:
```json
{
  "success": false,
  "message": "You don't have permission to access this tenant"
}
```

404 - Not Found:
```json
{
  "success": false,
  "message": "Tenant not found"
}
```

---

### API 6: Update Tenant

Updates tenant information.

**Endpoint**: `PUT /api/tenants/:tenantId`

**Authentication**: Required

**Authorization**: tenant_admin OR super_admin

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `tenantId` (uuid): The ID of the tenant to update

**Request Body**:
```json
{
  "name": "Acme Corporation Updated",
  "status": "suspended",
  "subscriptionPlan": "enterprise",
  "maxUsers": 100,
  "maxProjects": 50
}
```

**Field Permissions**:
- `name`: Can be updated by tenant_admin or super_admin
- `status`: Can be updated by super_admin only
- `subscriptionPlan`: Can be updated by super_admin only
- `maxUsers`: Can be updated by super_admin only
- `maxProjects`: Can be updated by super_admin only

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Acme Corporation Updated",
    "status": "suspended",
    "subscriptionPlan": "enterprise",
    "maxUsers": 100,
    "maxProjects": 50,
    "updatedAt": "2024-01-21T09:15:00Z"
  }
}
```

**Error Responses**:

403 - Forbidden:
```json
{
  "success": false,
  "message": "You don't have permission to update this field"
}
```

400 - Validation Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "subscriptionPlan": "Invalid subscription plan"
  }
}
```

---

### API 7: List All Tenants

Lists all tenants in the system (super_admin only).

**Endpoint**: `GET /api/tenants`

**Authentication**: Required

**Authorization**: super_admin only

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 10, max: 100): Items per page
- `status` (string, optional): Filter by status (active|suspended|trial)
- `subscriptionPlan` (string, optional): Filter by plan (free|pro|enterprise)

**Example Request**:
```
GET /api/tenants?page=1&limit=20&status=active&subscriptionPlan=pro
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "name": "Acme Corporation",
        "subdomain": "acme",
        "status": "active",
        "subscriptionPlan": "pro",
        "maxUsers": 25,
        "maxProjects": 15,
        "totalUsers": 8,
        "totalProjects": 5,
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
        "name": "Tech Startup Inc",
        "subdomain": "techstartup",
        "status": "active",
        "subscriptionPlan": "free",
        "maxUsers": 5,
        "maxProjects": 3,
        "totalUsers": 3,
        "totalProjects": 2,
        "createdAt": "2024-01-10T15:45:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTenants": 47,
      "limit": 10
    }
  }
}
```

**Error Responses**:

403 - Forbidden:
```json
{
  "success": false,
  "message": "Only super admin can access this endpoint"
}
```

---

## User Management APIs

### API 8: Add User to Tenant

Creates a new user in a tenant.

**Endpoint**: `POST /api/tenants/:tenantId/users`

**Authentication**: Required

**Authorization**: tenant_admin only

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `tenantId` (uuid): The tenant ID to add user to

**Request Body**:
```json
{
  "email": "newuser@acme.com",
  "password": "NewUserPass@123",
  "fullName": "Jane Doe",
  "role": "user"
}
```

**Request Validation**:
- `email`: Required, valid email, unique per tenant
- `password`: Required, min 8 characters
- `fullName`: Required, string
- `role`: Optional, enum: "user" or "tenant_admin" (default: "user")

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
    "email": "newuser@acme.com",
    "fullName": "Jane Doe",
    "role": "user",
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "isActive": true,
    "createdAt": "2024-01-21T10:00:00Z"
  }
}
```

**Error Responses**:

403 - Subscription Limit Reached:
```json
{
  "success": false,
  "message": "User limit reached for your subscription plan"
}
```

409 - Email Already Exists:
```json
{
  "success": false,
  "message": "Email already exists in this tenant"
}
```

**Business Logic**:
- Checks user limit (maxUsers) for tenant's subscription plan
- Hashes password with bcrypt
- Email must be unique within tenant
- Logs action in audit_logs

---

### API 9: List Tenant Users

Lists all users in a tenant with filtering and pagination.

**Endpoint**: `GET /api/tenants/:tenantId/users`

**Authentication**: Required

**Authorization**: User must belong to tenant OR be super_admin

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `tenantId` (uuid): The tenant ID

**Query Parameters**:
- `search` (string, optional): Search by name or email (case-insensitive)
- `role` (string, optional): Filter by role (user|tenant_admin)
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 50, max: 100): Items per page

**Example Request**:
```
GET /api/tenants/f47ac10b-58cc-4372-a567-0e02b2c3d479/users?search=john&role=tenant_admin&page=1&limit=20
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "admin@acme.com",
        "fullName": "John Smith",
        "role": "tenant_admin",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
        "email": "newuser@acme.com",
        "fullName": "Jane Doe",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-21T10:00:00Z"
      }
    ],
    "total": 2,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 50
    }
  }
}
```

**Business Logic**:
- Filters by tenant automatically
- Does NOT return password hashes
- Ordered by createdAt DESC
- Case-insensitive search on name and email

---

### API 10: Update User

Updates user information.

**Endpoint**: `PUT /api/users/:userId`

**Authentication**: Required

**Authorization**: tenant_admin OR the user themselves (self)

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `userId` (uuid): The user ID to update

**Request Body**:
```json
{
  "fullName": "Jane Doe Updated",
  "role": "tenant_admin",
  "isActive": true
}
```

**Field Permissions**:
- `fullName`: Can update own or by tenant_admin
- `role`: Can update by tenant_admin only
- `isActive`: Can update by tenant_admin only

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
    "fullName": "Jane Doe Updated",
    "role": "tenant_admin",
    "isActive": true,
    "updatedAt": "2024-01-21T11:30:00Z"
  }
}
```

**Error Responses**:

403 - Forbidden:
```json
{
  "success": false,
  "message": "You don't have permission to update this user"
}
```

---

### API 11: Delete User

Deletes a user from the tenant.

**Endpoint**: `DELETE /api/users/:userId`

**Authentication**: Required

**Authorization**: tenant_admin only

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `userId` (uuid): The user ID to delete

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses**:

403 - Cannot Delete Self:
```json
{
  "success": false,
  "message": "You cannot delete yourself"
}
```

404 - User Not Found:
```json
{
  "success": false,
  "message": "User not found or doesn't belong to your tenant"
}
```

**Business Logic**:
- Tenant admin cannot delete themselves
- Sets assigned_to = NULL in tasks for this user
- Logs action in audit_logs

---

## Project Management APIs

### API 12: Create Project

Creates a new project in a tenant.

**Endpoint**: `POST /api/projects`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "active"
}
```

**Request Validation**:
- `name`: Required, string, min 2 chars
- `description`: Optional, string
- `status`: Optional, enum: "active"|"archived"|"completed" (default: "active")

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defg-234567890def",
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "active",
    "createdBy": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "createdAt": "2024-01-21T12:00:00Z"
  }
}
```

**Error Responses**:

403 - Project Limit Reached:
```json
{
  "success": false,
  "message": "Project limit reached for your subscription plan"
}
```

**Business Logic**:
- Gets tenantId from JWT token
- Gets createdBy from JWT token
- Checks project limit (maxProjects)
- Returns 403 if limit reached
- Logs action in audit_logs

---

### API 13: List Projects

Lists all projects for the authenticated user's tenant.

**Endpoint**: `GET /api/projects`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `status` (string, optional): Filter by status (active|archived|completed)
- `search` (string, optional): Search by project name
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page

**Example Request**:
```
GET /api/projects?status=active&search=website&page=1&limit=20
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "d4e5f6a7-b8c9-0123-defg-234567890def",
        "name": "Website Redesign",
        "description": "Complete redesign of company website",
        "status": "active",
        "createdBy": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "fullName": "John Smith"
        },
        "taskCount": 5,
        "completedTaskCount": 2,
        "createdAt": "2024-01-21T12:00:00Z"
      }
    ],
    "total": 3,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 20
    }
  }
}
```

**Business Logic**:
- Filters by user's tenantId automatically
- Joins with users table for creator info
- Calculates taskCount and completedTaskCount
- Supports pagination and filtering

---

### API 14: Update Project

Updates project information.

**Endpoint**: `PUT /api/projects/:projectId`

**Authentication**: Required

**Authorization**: tenant_admin OR project creator

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `projectId` (uuid): The project ID to update

**Request Body**:
```json
{
  "name": "Website Redesign v2",
  "description": "Updated description",
  "status": "in_progress"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defg-234567890def",
    "name": "Website Redesign v2",
    "description": "Updated description",
    "status": "in_progress",
    "updatedAt": "2024-01-21T13:30:00Z"
  }
}
```

**Error Responses**:

403 - Forbidden:
```json
{
  "success": false,
  "message": "You don't have permission to update this project"
}
```

404 - Not Found:
```json
{
  "success": false,
  "message": "Project not found"
}
```

---

### API 15: Delete Project

Deletes a project and all associated tasks.

**Endpoint**: `DELETE /api/projects/:projectId`

**Authentication**: Required

**Authorization**: tenant_admin OR project creator

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `projectId` (uuid): The project ID to delete

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Responses**:

403 - Forbidden:
```json
{
  "success": false,
  "message": "You don't have permission to delete this project"
}
```

404 - Not Found:
```json
{
  "success": false,
  "message": "Project not found"
}
```

---

## Task Management APIs

### API 16: Create Task

Creates a new task in a project.

**Endpoint**: `POST /api/projects/:projectId/tasks`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `projectId` (uuid): The project ID

**Request Body**:
```json
{
  "title": "Design homepage mockup",
  "description": "Create high-fidelity design for homepage",
  "assignedTo": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
  "priority": "high",
  "dueDate": "2024-07-15"
}
```

**Request Validation**:
- `title`: Required, string, min 2 chars
- `description`: Optional, string
- `assignedTo`: Optional, valid user UUID
- `priority`: Optional, enum: "low"|"medium"|"high" (default: "medium")
- `dueDate`: Optional, valid date format (YYYY-MM-DD)

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
    "projectId": "d4e5f6a7-b8c9-0123-defg-234567890def",
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Design homepage mockup",
    "description": "Create high-fidelity design for homepage",
    "status": "todo",
    "priority": "high",
    "assignedTo": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
    "dueDate": "2024-07-15",
    "createdAt": "2024-01-21T14:00:00Z"
  }
}
```

**Error Responses**:

403 - Invalid Assigned User:
```json
{
  "success": false,
  "message": "Assigned user doesn't belong to your tenant"
}
```

404 - Project Not Found:
```json
{
  "success": false,
  "message": "Project not found"
}
```

**Business Logic**:
- Verifies project belongs to user's tenant
- Gets tenantId from project (not JWT)
- Validates assigned user belongs to same tenant
- Default status: 'todo'

---

### API 17: List Project Tasks

Lists all tasks for a project with filtering and pagination.

**Endpoint**: `GET /api/projects/:projectId/tasks`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Path Parameters**:
- `projectId` (uuid): The project ID

**Query Parameters**:
- `status` (string, optional): Filter by status (todo|in_progress|completed)
- `assignedTo` (uuid, optional): Filter by assigned user
- `priority` (string, optional): Filter by priority (low|medium|high)
- `search` (string, optional): Search by task title
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 50, max: 100): Items per page

**Example Request**:
```
GET /api/projects/d4e5f6a7-b8c9-0123-defg-234567890def/tasks?status=in_progress&priority=high&page=1
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
        "title": "Design homepage mockup",
        "description": "Create high-fidelity design",
        "status": "in_progress",
        "priority": "high",
        "assignedTo": {
          "id": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
          "fullName": "Jane Doe",
          "email": "jane@acme.com"
        },
        "dueDate": "2024-07-15",
        "createdAt": "2024-01-21T14:00:00Z"
      }
    ],
    "total": 5,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 50
    }
  }
}
```

**Business Logic**:
- Verifies project belongs to user's tenant
- Joins with users for assignedTo details
- Ordered by priority DESC, dueDate ASC
- Supports all query filters

---

### API 18: Update Task Status

Updates only the status field of a task (quick status change).

**Endpoint**: `PATCH /api/tasks/:taskId/status`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `taskId` (uuid): The task ID to update

**Request Body**:
```json
{
  "status": "completed"
}
```

**Request Validation**:
- `status`: Required, enum: "todo"|"in_progress"|"completed"

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
    "status": "completed",
    "updatedAt": "2024-01-21T15:30:00Z"
  }
}
```

**Error Responses**:

404 - Task Not Found:
```json
{
  "success": false,
  "message": "Task not found"
}
```

403 - Forbidden:
```json
{
  "success": false,
  "message": "Task doesn't belong to your tenant"
}
```

**Business Logic**:
- Quick update for status only
- Any user in tenant can update status
- Logs action in audit_logs

---

### API 19: Update Task

Updates all task fields.

**Endpoint**: `PUT /api/tasks/:taskId`

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `taskId` (uuid): The task ID to update

**Request Body**:
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
  "dueDate": "2024-08-01"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
    "title": "Updated task title",
    "description": "Updated description",
    "status": "in_progress",
    "priority": "high",
    "assignedTo": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
      "fullName": "Jane Doe",
      "email": "jane@acme.com"
    },
    "dueDate": "2024-08-01",
    "updatedAt": "2024-01-21T16:00:00Z"
  }
}
```

**Error Responses**:

403 - Invalid Assigned User:
```json
{
  "success": false,
  "message": "Assigned user doesn't belong to your tenant"
}
```

404 - Task Not Found:
```json
{
  "success": false,
  "message": "Task not found"
}
```

---

## Health Check

### GET /api/health

Checks API and database health status.

**Endpoint**: `GET /api/health`

**Authentication**: None (Public)

**Request Headers**:
```
Content-Type: application/json
```

**Success Response** (200 OK):
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Error Response** (503 Service Unavailable):
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Connection refused"
}
```

---

## Response Format

### Success Response Structure
```json
{
  "success": true,
  "message": "Optional message describing the action",
  "data": {
    // Response data object
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "message": "Description of the error",
  "errors": {
    // Optional: validation errors per field
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, POST (data update) |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation errors, malformed request |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks permission, limit reached |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (email, subdomain) |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database connection failed |

### Common Error Messages

```
"Invalid credentials" - Wrong email/password combination
"Invalid or expired token" - JWT token is invalid or expired
"You don't have permission" - Authorization check failed
"Validation failed" - Request body validation error
"User limit reached" - Subscription limit exceeded
"Email already exists" - Duplicate email in tenant
"Subdomain already exists" - Duplicate subdomain
"Tenant not found" - Invalid tenant ID or subdomain
"User not found" - Invalid user ID
"Project not found" - Invalid project ID
"Task not found" - Invalid task ID
```

---

## Authentication Best Practices

1. **Store Token Securely**: Use localStorage or sessionStorage on frontend
2. **Always Include Token**: Add `Authorization: Bearer {token}` to all protected requests
3. **Handle Token Expiry**: Implement auto-logout when token expires
4. **Refresh Token**: Implement token refresh mechanism (optional, 24h expiry is reasonable)
5. **HTTPS Only**: Always use HTTPS in production
6. **CORS Configuration**: Ensure CORS allows your frontend domain

---

## Rate Limiting (Recommended for Production)

Implement rate limiting to prevent abuse:

```
- Login: 5 requests per minute per IP
- Register: 10 requests per hour per IP
- API: 100 requests per minute per user
```

---

## Pagination Guidelines

When using pagination parameters:
- Default page: 1 (first page)
- Default limit: varies by endpoint (10-50)
- Max limit: 100 (cannot request more than 100 items per page)
- Total count: Returned in response for frontend pagination controls

Example pagination calculation:
```
offset = (page - 1) * limit
totalPages = Math.ceil(totalCount / limit)
```

---

**Last Updated**: January 2, 2026  
**API Version**: 1.0.0
