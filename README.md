# Multi-Tenant SaaS Platform - Project & Task Management System

## Project Overview

A production-ready, multi-tenant SaaS application that enables multiple organizations (tenants) to independently register, manage their teams, create projects, and track tasks with complete data isolation and role-based access control. Built with a modern tech stack featuring Express.js backend, React frontend, PostgreSQL database, and Docker containerization.

### Target Audience
- Organizations seeking cloud-based project management solutions
- Enterprises requiring multi-tenant architecture with data isolation
- Teams needing collaborative task tracking and project management
- System administrators managing multiple organizational accounts

---

## Key Features

- **Multi-Tenant Architecture** - Complete data isolation between tenants with unique subdomains
- **Secure Authentication** - JWT-based authentication with 24-hour token expiry and bcrypt password hashing
- **Role-Based Access Control** - Three-tier permission system (Super Admin, Tenant Admin, User)
- **Subscription Plan Management** - Flexible plans (Free, Pro, Enterprise) with configurable user and project limits
- **Project Management** - Create, organize, and track projects with granular control
- **Task Management** - Assign tasks with priority levels, due dates, and status tracking
- **User Management** - Add, edit, and manage team members with role-based permissions
- **Audit Logging** - Complete action logging for security and compliance tracking
- **Responsive Design** - Mobile-friendly interface with Material-UI components
- **Docker Containerization** - Full containerization with docker-compose for one-command deployment
- **RESTful API** - 19 comprehensive APIs with consistent response format and proper error handling
- **Tenant Admin Dashboard** - Statistics, recent activities, and quick access to key features

---

## Technology Stack

### Frontend
- **Framework**: React 19.2.0
- **UI Library**: Material-UI (MUI) 5.x
- **Routing**: React Router 7.11.0
- **HTTP Client**: Axios 1.13.2
- **Build Tool**: Vite 7.2.4
- **State Management**: React Context API
- **Icons**: MUI Icons Material

### Backend
- **Framework**: Express.js 4.x
- **Language**: Node.js 20+
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt 5.x
- **Database ORM**: pg (node-postgres) 8.x
- **Validation**: express-validator
- **CORS**: cors middleware
- **Environment**: dotenv

### Database
- **Primary DB**: PostgreSQL 15
- **Client Library**: pg (node-postgres)
- **Features**:
  - UUID for all primary keys
  - ENUM types for status and roles
  - Foreign key constraints with CASCADE delete
  - Indexes on tenant_id columns
  - Composite unique constraints for email per tenant

### DevOps & Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose 3.8
- **Database Image**: PostgreSQL 15
- **Web Server**: Nginx (for frontend in production)
- **Port Mappings**: 
  - Database: 5432
  - Backend API: 5000
  - Frontend: 3000

---
## Video Tutorial

### Getting Started with the SaaS Platform
[![Watch on YouTube](https://img.shields.io/badge/Watch-YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/m86Fhk6FsRk?si=iTpC3FMg-x1s4RBd)

This comprehensive video tutorial walks you through:
- Project setup and installation
- Database configuration
- Running the application locally
- Deploying with Docker
- Using the dashboard and managing projects

---

## System Architecture Overview

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
        ┌────────────────▼────────────────┐
        │      React Frontend (3000)      │
        │  ┌──────────────────────────┐   │
        │  │  Pages & Components      │   │
        │  │  - Register/Login        │   │
        │  │  - Dashboard             │   │
        │  │  - Projects              │   │
        │  │  - Tasks                 │   │
        │  │  - Users                 │   │
        │  └──────────────────────────┘   │
        │  ┌──────────────────────────┐   │
        │  │  Context (Auth State)    │   │
        │  └──────────────────────────┘   │
        │  ┌──────────────────────────┐   │
        │  │  Axios (API Client)      │   │
        │  └──────────────────────────┘   │
        └────────────────┬─────────────────┘
                         │
        REST API (JWT Token in Header)
                         │
        ┌────────────────▼────────────────┐
        │   Express Backend (5000)        │
        │  ┌──────────────────────────┐   │
        │  │  Authentication Routes   │   │
        │  │  - Register Tenant       │   │
        │  │  - Login                 │   │
        │  │  - Get Current User      │   │
        │  │  - Logout                │   │
        │  └──────────────────────────┘   │
        │  ┌──────────────────────────┐   │
        │  │  Resource Routes         │   │
        │  │  - Tenants               │   │
        │  │  - Users                 │   │
        │  │  - Projects              │   │
        │  │  - Tasks                 │   │
        │  └──────────────────────────┘   │
        │  ┌──────────────────────────┐   │
        │  │  Middleware              │   │
        │  │  - Auth Verification     │   │
        │  │  - Tenant Isolation      │   │
        │  │  - Error Handling        │   │
        │  │  - Audit Logging         │   │
        │  └──────────────────────────┘   │
        └────────────────┬─────────────────┘
                         │
                    SQL Queries
                         │
        ┌────────────────▼────────────────┐
        │  PostgreSQL Database (5432)     │
        │  ┌──────────────────────────┐   │
        │  │  Tables                  │   │
        │  │  - tenants               │   │
        │  │  - users                 │   │
        │  │  - projects              │   │
        │  │  - tasks                 │   │
        │  │  - audit_logs            │   │
        │  └──────────────────────────┘   │
        └─────────────────────────────────┘
```

### Multi-Tenancy Data Isolation
- **Approach**: Shared Database + Shared Schema with tenant_id column
- **Isolation Mechanism**: Row-level filtering based on tenant_id from JWT token
- **Super Admin Exception**: Super admin users have tenant_id = NULL and can access all tenants
- **Foreign Key Constraints**: All tenant-specific tables have foreign key to tenants table

---

## Installation & Setup

### Prerequisites
- **Node.js**: 20.0 or higher
- **npm**: 9.0 or higher
- **PostgreSQL**: 15 or higher (for local development)
- **Docker**: 20.10+ (optional, for containerized deployment)
- **Docker Compose**: 1.29+ (optional, for containerized deployment)

### Local Development Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/ammoru/Build-Multi-Tenant-SaaS-Platform-with-Project-Task-Management.git
cd Build-Multi-Tenant-SaaS-Platform-with-Project-Task-Management.git
```

#### Step 2: Set Up Environment Variables

**Backend Setup:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

**Frontend Setup:**
```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### Step 3: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

#### Step 4: Database Setup

**Create Database:**
```bash
# Using psql
createdb saas_db
```

**Run Migrations:**
```bash
cd backend
npm run migrate
# OR manually:
# psql -U postgres -d saas_db -f migrations/000_enable_pgcrypto.sql
# psql -U postgres -d saas_db -f migrations/001_create_tenants.sql
# psql -U postgres -d saas_db -f migrations/002_create_users.sql
# psql -U postgres -d saas_db -f migrations/003_create_projects.sql
# psql -U postgres -d saas_db -f migrations/004_create_tasks.sql
# psql -U postgres -d saas_db -f migrations/005_create_audit_logs.sql
```

**Seed Sample Data:**
```bash
npm run seed
# OR manually:
# psql -U postgres -d saas_db -f seeds/seed_data.sql
```

#### Step 5: Start Backend Server

```bash
cd backend
nodemon src/server.js
# Server will start on http://localhost:5000
```

#### Step 6: Start Frontend Development Server

```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:5173 (Vite default)
```

Access the application at `http://localhost:5173`

---

## Docker Deployment (Recommended)

### One-Command Deployment
```bash
# From project root directory
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### Stop Services
```bash
docker-compose down

# Remove volumes (database data)
docker-compose down -v
```

### Database Health Check
```bash
# Check if database is ready
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `DB_HOST` | string | Yes | - | PostgreSQL server hostname |
| `DB_PORT` | number | Yes | 5432 | PostgreSQL server port |
| `DB_NAME` | string | Yes | saas_db | Database name |
| `DB_USER` | string | Yes | postgres | Database user |
| `DB_PASSWORD` | string | Yes | - | Database password |
| `JWT_SECRET` | string | Yes | - | Secret key for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN` | string | Yes | 24h | JWT token expiration time |
| `PORT` | number | No | 5000 | Backend server port |
| `NODE_ENV` | string | No | development | Environment (development/production) |
| `FRONTEND_URL` | string | No | http://localhost:3000 | Frontend URL (for CORS) |

### Frontend Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_API_URL` | string | Yes | http://localhost:5000/api | Backend API base URL |

---

## API Documentation

### Authentication Endpoints

#### 1. Register Tenant
```
POST /api/auth/register-tenant
Content-Type: application/json

Request:
{
  "tenantName": "Acme Corporation",
  "subdomain": "acme",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePass@123",
  "adminFullName": "John Admin"
}

Response (201):
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenantId": "uuid",
    "subdomain": "acme",
    "adminUser": {
      "id": "uuid",
      "email": "admin@acme.com",
      "fullName": "John Admin",
      "role": "tenant_admin"
    }
  }
}
```

#### 2. Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "raju@gmail.com",
  "password": "Raju1@123",
  "tenantSubdomain": "raju"
}

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "raju@gmail.com",
      "fullName": "Raju",
      "role": "tenant_admin,
      "tenantId": "uuid"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### 3. Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@acme.com",
    "fullName": "John Admin",
    "role": "tenant_admin",
    "isActive": true,
    "tenant": {
      "id": "uuid",
      "name": "Acme Corporation",
      "subdomain": "acme",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15
    }
  }
}
```

#### 4. Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Tenant Management Endpoints

#### 5. Get Tenant Details
```
GET /api/tenants/:tenantId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Corporation",
    "subdomain": "acme",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "createdAt": "2024-06-15T10:30:00Z",
    "stats": {
      "totalUsers": 8,
      "totalProjects": 5,
      "totalTasks": 42
    }
  }
}
```

#### 6. Update Tenant
```
PUT /api/tenants/:tenantId
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Acme Corporation Updated"
}

Response (200):
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": { ... }
}
```

#### 7. List All Tenants (Super Admin Only)
```
GET /api/tenants?page=1&limit=10&status=active
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "tenants": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTenants": 47,
      "limit": 10
    }
  }
}
```

### User Management Endpoints

#### 8. Add User to Tenant
```
POST /api/tenants/:tenantId/users
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "email": "user@acme.com",
  "password": "UserPass@123",
  "fullName": "Jane User",
  "role": "user"
}

Response (201):
{
  "success": true,
  "message": "User created successfully",
  "data": { ... }
}
```

#### 9. List Tenant Users
```
GET /api/tenants/:tenantId/users?search=john&role=tenant_admin&page=1
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "users": [ ... ],
    "total": 5,
    "pagination": { ... }
  }
}
```

#### 10. Update User
```
PUT /api/users/:userId
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "fullName": "Jane Doe Updated",
  "role": "tenant_admin"
}

Response (200):
{
  "success": true,
  "message": "User updated successfully",
  "data": { ... }
}
```

#### 11. Delete User
```
DELETE /api/users/:userId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Project Management Endpoints

#### 12. Create Project
```
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "active"
}

Response (201):
{
  "success": true,
  "data": { ... }
}
```

#### 13. List Projects
```
GET /api/projects?status=active&search=web&page=1&limit=20
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "projects": [ ... ],
    "total": 3,
    "pagination": { ... }
  }
}
```

#### 14. Update Project
```
PUT /api/projects/:projectId
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Website Redesign v2",
  "description": "Updated description",
  "status": "in_progress"
}

Response (200):
{
  "success": true,
  "message": "Project updated successfully",
  "data": { ... }
}
```

#### 15. Delete Project
```
DELETE /api/projects/:projectId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Task Management Endpoints

#### 16. Create Task
```
POST /api/projects/:projectId/tasks
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Design homepage mockup",
  "description": "Create high-fidelity designs",
  "assignedTo": "user-uuid",
  "priority": "high",
  "dueDate": "2024-07-15"
}

Response (201):
{
  "success": true,
  "data": { ... }
}
```

#### 17. List Project Tasks
```
GET /api/projects/:projectId/tasks?status=in_progress&priority=high&page=1
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "tasks": [ ... ],
    "total": 5,
    "pagination": { ... }
  }
}
```

#### 18. Update Task Status
```
PATCH /api/tasks/:taskId/status
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "status": "completed"
}

Response (200):
{
  "success": true,
  "data": { ... }
}
```

#### 19. Update Task
```
PUT /api/tasks/:taskId
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "medium",
  "status": "in_progress",
  "assignedTo": "user-uuid",
  "dueDate": "2024-08-01"
}

Response (200):
{
  "success": true,
  "message": "Task updated successfully",
  "data": { ... }
}
```

### Health Check

#### GET /api/health
```
GET /api/health

Response (200):
{
  "status": "ok",
  "database": "connected"
}
```

---

## Test Credentials

### Super Admin
```
Email: superadmin@system.com
Password: Admin@123
Role: super_admin
Tenant: None (has access to all tenants)
```

### Demo Tenant Admin
```
Email: raju@gmail.com
Password: Raju@123
Role: tenant_admin
Subdomain: raju
```

### Demo Tenant Users
```
User 1:
Email: care@demo.com
Password: Care@123
Subdomine :speed

User 2:
Email: raju101@gmail.com
Password: Raju@123
SubDomine :raju101
```

---

## Project Structure

```
saas-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/          # API endpoint handlers
│   │   ├── middleware/            # Auth, error handling, validation
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Business logic (auth, audit)
│   │   ├── validators/           # Input validation schemas
│   │   ├── utils/                # Utility functions (JWT, response)
│   │   ├── config/               # Database and environment config
│   │   ├── app.js                # Express app setup
│   │   └── server.js             # Server startup
│   ├── migrations/               # Database migration scripts
│   ├── seeds/                    # Database seed data
│   ├── Dockerfile                # Docker image for backend
│   ├── package.json              # Node dependencies
│   ├── .env.example              # Environment variables template
│   └── .env                      # Environment variables (local)
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # React pages (Register, Login, Dashboard, etc.)
│   │   ├── components/          # Reusable React components
│   │   ├── context/             # React Context (Auth state)
│   │   ├── services/            # API integration (axios)
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── public/                  # Static assets
│   ├── Dockerfile               # Docker image for frontend
│   ├── vite.config.js           # Vite configuration
│   ├── package.json             # React dependencies
│   ├── .env.example             # Environment variables template
│   ├── .env                     # Environment variables (local)
│   └── nginx.conf               # Nginx config (production)
│
├── docker-compose.yml           # Docker Compose configuration
├── README.md                    # This file
├── submission.json              # Test credentials for evaluation
└── docs/                        # Documentation
    ├── research.md              # Multi-tenancy analysis
    ├── PRD.md                   # Product requirements
    ├── architecture.md          # System architecture
    ├── technical-spec.md        # Technical specifications
    ├── API.md                   # API documentation
    └── images/                  # Diagrams and images
```

---

## Database Schema

### Tables Overview

**tenants**
- Stores organization information
- Unique subdomain per tenant
- Subscription plan and user/project limits

**users**
- User accounts with hashed passwords
- Belongs to a tenant (tenant_id)
- Super admin users have tenant_id = NULL

**projects**
- Projects within a tenant
- Created by a user
- Has multiple tasks

**tasks**
- Tasks within a project
- Can be assigned to team members
- Track status, priority, and due dates

**audit_logs**
- Logs all important actions
- Tracks user, action type, and affected entity
- Used for security and compliance

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Security Considerations

- **Data Isolation**: Every query automatically filters by tenant_id
- **Password Security**: Passwords hashed with bcrypt (salt rounds: 10)
- **JWT Security**: Tokens expire after 24 hours, contain minimal information
- **CORS Protection**: Only allows requests from configured frontend URL
- **SQL Injection Prevention**: All queries use parameterized statements
- **Rate Limiting**: Recommended to implement in production
- **HTTPS**: Use HTTPS in production deployments

---

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution:
1. Ensure PostgreSQL is running
2. Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
3. Verify database exists: createdb saas_db
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000

Solution:
1. Change PORT in .env
2. Or kill the process using the port:
   - Linux/Mac: lsof -ti:5000 | xargs kill -9
   - Windows: netstat -ano | findstr :5000 (then taskkill)
```

### CORS Error in Frontend
```
Error: Access to XMLHttpRequest blocked by CORS policy

Solution:
1. Check FRONTEND_URL in backend .env
2. Ensure it matches your frontend URL
3. For Docker: Use FRONTEND_URL=http://frontend:3000
```

### Docker Compose Services Not Starting
```
Error: Service 'backend' failed to build

Solution:
1. Check Docker is installed: docker --version
2. Rebuild images: docker-compose build --no-cache
3. Check logs: docker-compose logs backend
```

---



## Deployment Notes

### Production Checklist
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set NODE_ENV=production
- [ ] Configure production database with backups
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Review security headers
- [ ] Test all API endpoints
- [ ] Verify CORS settings for production domain

### Performance Optimization
- Enable database query caching
- Use connection pooling for database
- Implement Redis for session/cache layer
- Enable gzip compression in Nginx
- Optimize frontend bundle size
- Consider CDN for static assets

---

## Version History

- **v1.0.0** (January 2, 2026) - Initial release with full multi-tenant SaaS functionality

---

**Last Updated**: January 2, 2026
