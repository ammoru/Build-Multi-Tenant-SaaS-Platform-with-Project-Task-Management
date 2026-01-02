# Multi-Tenant SaaS Platform - Frontend

React-based frontend application for the Multi-Tenant SaaS Platform with project and task management capabilities.

## Features

- **Authentication**
  - Tenant registration with unique subdomain
  - Login with tenant subdomain, email, and password
  - JWT-based authentication with automatic token refresh
  - Protected routes with role-based access control

- **Dashboard**
  - Statistics cards (total projects, tasks, completed/pending)
  - Recent projects overview
  - My tasks view

- **Project Management**
  - Create, read, update, and delete projects
  - Filter by status and search by name
  - Project details with task management

- **Task Management**
  - Create, update, and delete tasks within projects
  - Update task status (To Do, In Progress, Completed)
  - Assign tasks to users
  - Set priority and due dates
  - Filter by status, priority, and assigned user

- **User Management** (Tenant Admin only)
  - Add, edit, and delete users
  - Manage user roles and status
  - Filter by role and search users

- **Role-Based Access Control**
  - Super Admin: Access to all tenants
  - Tenant Admin: Manage users, projects, and tasks in their tenant
  - User: View and manage assigned tasks

## Tech Stack

- **React 19** - UI library
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vite** - Build tool and dev server
- **CSS3** - Styling with custom CSS

## Prerequisites

- Node.js 18+ and npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:
```
VITE_API_URL=http://localhost:5000/api
```

## Development

Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Docker

Build and run with Docker:
```bash
docker build -t saas-frontend .
docker run -p 3000:3000 saas-frontend
```

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Layout.jsx      # Main layout wrapper
│   │   ├── Navbar.jsx      # Navigation bar
│   │   ├── ProtectedRoute.jsx  # Route protection
│   │   ├── ProjectModal.jsx    # Project create/edit modal
│   │   ├── TaskModal.jsx       # Task create/edit modal
│   │   └── UserModal.jsx       # User create/edit modal
│   ├── context/           # React context
│   │   └── AuthContext.jsx    # Authentication context
│   ├── pages/             # Page components
│   │   ├── Login.jsx      # Login page
│   │   ├── Register.jsx   # Tenant registration
│   │   ├── Dashboard.jsx  # Dashboard page
│   │   ├── Projects.jsx   # Projects list
│   │   ├── ProjectDetails.jsx  # Project details with tasks
│   │   └── Users.jsx      # User management
│   ├── services/          # API services
│   │   └── api.js         # Axios instance and API calls
│   ├── App.jsx            # Root component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── .env                   # Environment variables
├── Dockerfile             # Docker configuration
├── nginx.conf             # Nginx configuration
├── package.json           # Dependencies
└── vite.config.js         # Vite configuration
```

## API Integration

All API calls are centralized in `src/services/api.js`:

### Authentication APIs
- `POST /api/auth/register-tenant` - Register new tenant
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Project APIs
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Task APIs
- `GET /api/projects/:id/tasks` - List tasks
- `POST /api/projects/:id/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task

### User APIs (Tenant Admin only)
- `GET /api/tenants/:id/users` - List users
- `POST /api/tenants/:id/users` - Add user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## Features by Role

### Super Admin
- Access all tenants
- View tenant list
- All features of Tenant Admin

### Tenant Admin
- Manage users in their tenant
- Create, edit, delete projects
- Create, edit, delete tasks
- Assign tasks to users
- View all tenant data

### User
- View dashboard
- View assigned projects
- View and update assigned tasks
- Update own profile

## Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
