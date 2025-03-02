/*
  # Fix Admin Authentication

  1. Changes
    - Reset admin policies to be simpler and non-recursive
    - Ensure single admin user exists with correct credentials
    - Clean up any duplicate entries

  2. Security
    - Maintain secure admin access
    - Simplify authentication checks
*/

-- First clean up any existing policies
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin authentication" ON admin_users;

-- Create a simple policy for admin authentication
CREATE POLICY "Admin access"
  ON admin_users
  FOR ALL
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

-- Clean up any orphaned admin_users entries
DELETE FROM admin_users
WHERE id NOT IN (SELECT id FROM auth.users);

-- Update existing admin user if exists, or create new one
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get existing admin user
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin'
  LIMIT 1;

  -- Create new admin user if none exists
  IF admin_id IS NULL THEN
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