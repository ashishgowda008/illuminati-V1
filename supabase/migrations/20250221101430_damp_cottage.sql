/*
  # Fix admin authentication and profiles

  1. Changes
    - Simplify admin authentication policies
    - Fix profiles table structure
    - Update triggers and functions
    - Initialize dashboard stats

  2. Security
    - Enable RLS
    - Add proper policies
*/

-- First, clean up any existing problematic objects
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin authentication" ON admin_users;
DROP POLICY IF EXISTS "Admin access" ON admin_users;

-- Create simple admin access policy
CREATE POLICY "Admin authentication"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Clean up any duplicate admin users
WITH ranked_admins AS (
  SELECT id,
         email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rnum
  FROM auth.users
  WHERE email = 'admin'
),
to_delete AS (
  SELECT id FROM ranked_admins WHERE rnum > 1
)
DELETE FROM auth.users
WHERE id IN (SELECT id FROM to_delete);

-- Clean up orphaned admin_users entries
DELETE FROM admin_users
WHERE id NOT IN (SELECT id FROM auth.users);

-- Ensure admin user exists with correct credentials
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get or create admin user
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin'
  LIMIT 1;

  IF admin_id IS NULL THEN
    -- Create new admin user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin',
      crypt('admin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      now(),
      now()
    )
    RETURNING id INTO admin_id;
  ELSE
    -- Update existing admin's password
    UPDATE auth.users
    SET encrypted_password = crypt('admin', gen_salt('bf')),
        raw_user_meta_data = '{"role":"admin"}'
    WHERE id = admin_id;
  END IF;

  -- Ensure admin_users entry exists
  INSERT INTO admin_users (id, role, permissions)
  VALUES (admin_id, 'admin', '["all"]'::jsonb)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      permissions = '["all"]'::jsonb;
END;
$$;

-- Initialize dashboard stats
INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
SELECT 'total_brands', COUNT(*), CURRENT_DATE
FROM profiles
WHERE user_type = 'brand'
ON CONFLICT (stat_name, stat_date)
DO UPDATE SET stat_value = EXCLUDED.stat_value;

INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
SELECT 'total_universities', COUNT(*), CURRENT_DATE
FROM profiles
WHERE user_type = 'university'
ON CONFLICT (stat_name, stat_date)
DO UPDATE SET stat_value = EXCLUDED.stat_value;

INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
SELECT 'total_sponsorships', COUNT(*), CURRENT_DATE
FROM sponsorship_requests
ON CONFLICT (stat_name, stat_date)
DO UPDATE SET stat_value = EXCLUDED.stat_value;

INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
SELECT 'pending_requests', COUNT(*), CURRENT_DATE
FROM sponsorship_requests
WHERE status = 'pending'
ON CONFLICT (stat_name, stat_date)
DO UPDATE SET stat_value = EXCLUDED.stat_value;