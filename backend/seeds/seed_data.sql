BEGIN;

-- =========================
-- 1️⃣ SUPER ADMIN (NO TENANT)
-- =========================
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
VALUES (
  gen_random_uuid(),
  NULL,
  'superadmin@system.com',
  '$2b$10$KIXQ1q9YF0K6NwZ7Z6y1he9dZYkTfLZNVVRFl1FdYyqS/fWznuaCG',
  'System Super Admin',
  'super_admin'
);

-- =========================
-- 2️⃣ DEMO TENANT
-- =========================
INSERT INTO tenants (
  id,
  name,
  subdomain,
  status,
  subscription_plan,
  max_users,
  max_projects
)
VALUES (
  gen_random_uuid(),
  'Demo Company',
  'demo',
  'active',
  'pro',
  25,
  15
);

-- =========================
-- 3️⃣ TENANT ADMIN
-- =========================
INSERT INTO users (
  id,
  tenant_id,
  email,
  password_hash,
  full_name,
  role
)
SELECT
  gen_random_uuid(),
  t.id,
  'admin@demo.com',
  '$2b$10$wHn4qR0k0fLh5h2V0M8e9uA2aYB3PZfX8sN4yD5sP6Q1wYx7KkE6G',
  'Demo Admin',
  'tenant_admin'
FROM tenants t
WHERE t.subdomain = 'demo';

-- =========================
-- 4️⃣ REGULAR USERS
-- =========================
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT gen_random_uuid(), t.id, 'user1@demo.com',
'$2b$10$ZrL4z2n9FqQbRkZ8T9XkOe4Y0fQk9B6R1M0T0Qm0J9Q1x7FZ1G4W',
'Demo User One', 'user'
FROM tenants t WHERE t.subdomain = 'demo';

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT gen_random_uuid(), t.id, 'user2@demo.com',
'$2b$10$ZrL4z2n9FqQbRkZ8T9XkOe4Y0fQk9B6R1M0T0Qm0J9Q1x7FZ1G4W',
'Demo User Two', 'user'
FROM tenants t WHERE t.subdomain = 'demo';

-- =========================
-- 5️⃣ PROJECTS
-- =========================
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
SELECT
  gen_random_uuid(),
  t.id,
  'Project Alpha',
  'First demo project',
  'active',
  u.id
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.role = 'tenant_admin'
WHERE t.subdomain = 'demo';

INSERT INTO projects (id, tenant_id, name, description, status, created_by)
SELECT
  gen_random_uuid(),
  t.id,
  'Project Beta',
  'Second demo project',
  'active',
  u.id
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.role = 'tenant_admin'
WHERE t.subdomain = 'demo';

-- =========================
-- 6️⃣ TASKS (5 TOTAL)
-- =========================
INSERT INTO tasks (
  id,
  project_id,
  tenant_id,
  title,
  description,
  status,
  priority
)
SELECT
  gen_random_uuid(),
  p.id,
  p.tenant_id,
  'Initial Planning',
  'Project planning task',
  'todo',
  'medium'
FROM projects p
LIMIT 1;

INSERT INTO tasks (
  id, project_id, tenant_id, title, status, priority
)
SELECT
  gen_random_uuid(),
  p.id,
  p.tenant_id,
  'Design Phase',
  'in_progress',
  'high'
FROM projects p
LIMIT 1;

INSERT INTO tasks (
  id, project_id, tenant_id, title, status, priority
)
SELECT
  gen_random_uuid(),
  p.id,
  p.tenant_id,
  'Development',
  'todo',
  'high'
FROM projects p
OFFSET 1 LIMIT 1;

INSERT INTO tasks (
  id, project_id, tenant_id, title, status, priority
)
SELECT
  gen_random_uuid(),
  p.id,
  p.tenant_id,
  'Testing',
  'todo',
  'medium'
FROM projects p
OFFSET 1 LIMIT 1;

INSERT INTO tasks (
  id, project_id, tenant_id, title, status, priority
)
SELECT
  gen_random_uuid(),
  p.id,
  p.tenant_id,
  'Deployment',
  'completed',
  'low'
FROM projects p
OFFSET 1 LIMIT 1;

COMMIT;
