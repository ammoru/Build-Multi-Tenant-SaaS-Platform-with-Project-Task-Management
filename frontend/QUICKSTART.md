# Frontend Quick Start Guide

## Setup and Run

### 1. Install Dependencies (Already Done)
```bash
cd frontend
npm install
```

### 2. Configure Environment
The `.env` file is already created with:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

## Pages Available

### Public Pages
1. **Login** - http://localhost:5173/login
2. **Register** - http://localhost:5173/register

### Protected Pages (Require Login)
1. **Dashboard** - http://localhost:5173/dashboard
2. **Projects** - http://localhost:5173/projects
3. **Project Details** - http://localhost:5173/projects/:id
4. **Users** (Admin only) - http://localhost:5173/users

## Testing the Application

### Step 1: Register a New Tenant
1. Go to http://localhost:5173/register
2. Fill in:
   - Organization Name: "Test Company"
   - Subdomain: "testco"
   - Admin Full Name: "Test Admin"
   - Admin Email: "admin@testco.com"
   - Password: "Test@123"
   - Confirm Password: "Test@123"
3. Click "Register"
4. You'll be redirected to login page

### Step 2: Login
1. Go to http://localhost:5173/login
2. Fill in:
   - Tenant Subdomain: "testco"
   - Email: "admin@testco.com"
   - Password: "Test@123"
3. Click "Login"
4. You'll be redirected to dashboard

### Step 3: Explore Features

#### Dashboard
- View statistics (projects, tasks, completed/pending)
- See recent projects
- View your assigned tasks

#### Projects
1. Click "Projects" in navigation
2. Click "+ Create Project"
3. Fill in project details and create
4. Click "View Details" on any project
5. Add tasks to the project

#### Users (Admin Only)
1. Click "Users" in navigation
2. Click "+ Add User"
3. Create new users for your tenant
4. Assign roles (User or Tenant Admin)

## API Endpoints Used

The frontend makes calls to these backend endpoints:

### Authentication (Public)
- POST `/api/auth/register-tenant` - Register new tenant
- POST `/api/auth/login` - Login with credentials

### Authentication (Protected)
- GET `/api/auth/me` - Get current user info
- POST `/api/auth/logout` - Logout

### Projects (Protected)
- GET `/api/projects` - List all projects
- POST `/api/projects` - Create new project
- PUT `/api/projects/:id` - Update project
- DELETE `/api/projects/:id` - Delete project

### Tasks (Protected)
- GET `/api/projects/:id/tasks` - List tasks in project
- POST `/api/projects/:id/tasks` - Create task
- PUT `/api/tasks/:id` - Update task
- PATCH `/api/tasks/:id/status` - Update task status only
- DELETE `/api/tasks/:id` - Delete task

### Users (Protected - Admin Only)
- GET `/api/tenants/:id/users` - List users
- POST `/api/tenants/:id/users` - Add user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

## Troubleshooting

### Backend Not Running
If you see "Failed to load" errors, make sure backend is running:
```bash
cd backend
npm start
```

### CORS Errors
Backend should be configured to allow requests from `http://localhost:5173`. Check backend CORS configuration.

### Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port. Check the terminal output for the actual URL.

## Build for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist/` folder.

To preview production build:
```bash
npm run preview
```

## Docker Build

To build and run with Docker:
```bash
docker build -t saas-frontend .
docker run -p 3000:3000 saas-frontend
```

The application will be available at http://localhost:3000

## Features Implemented

✅ Tenant Registration  
✅ User Login with tenant subdomain  
✅ Protected Routes with authentication  
✅ Role-based Access Control  
✅ Dashboard with statistics  
✅ Project Management (CRUD)  
✅ Task Management (CRUD)  
✅ User Management (Admin only)  
✅ Filters and Search  
✅ Responsive Design  
✅ Error Handling  
✅ Loading States  
✅ Form Validation  

## Next Steps

1. Make sure backend is running on port 5000
2. Start frontend dev server
3. Register a new tenant
4. Login and explore all features
5. Test creating projects and tasks
6. Test user management (as tenant admin)
