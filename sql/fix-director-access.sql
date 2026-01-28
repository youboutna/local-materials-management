-- SQL to check and update user roles
-- Run this in your Supabase SQL editor to verify and fix director role access

-- 1. Check current user roles
SELECT 
  u.id,
  u.email,
  u.user_metadata,
  ur.role_name,
  ur.assigned_at
FROM auth.users u
LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';  -- Replace with actual email

-- 2. If user doesn't have director role, add it
INSERT INTO auth.user_roles (user_id, role_name, assigned_by, assigned_at)
SELECT 
  u.id,
  'director',
  u.id,
  NOW()
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- Replace with actual email
AND NOT EXISTS (
  SELECT 1 FROM auth.user_roles ur 
  WHERE ur.user_id = u.id AND ur.role_name = 'director'
);

-- 3. Check all users with director role
SELECT 
  u.id,
  u.email,
  u.user_metadata,
  ur.role_name,
  ur.assigned_at
FROM auth.users u
JOIN auth.user_roles ur ON u.id = ur.user_id
WHERE ur.role_name = 'director';
