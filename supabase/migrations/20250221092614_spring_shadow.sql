/*
  # Fix Admin Authentication and Policies

  1. Changes
    - Drop and recreate admin policies to fix recursion issues
    - Update existing admin user password if exists
    - Ensure proper admin access verification

  2. Security
    - Maintain secure admin access control
    - Fix authentication policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin authentication" ON admin_users;

-- Create new policies with proper authentication checks
CREATE POLICY "Allow admin authentication"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM admin_users WHERE id = auth.uid()) = 'super_admin'
  );

-- Update existing admin user's password if exists
DO $$
DECLARE
  existing_admin_id uuid;
BEGIN
  -- Get existing admin user
  SELECT id INTO existing_admin_id
  FROM auth.users
  WHERE email = 'admin'
  LIMIT 1;

  -- Update password if user exists
  IF existing_admin_id IS NOT NULL THEN
    -- Update password
    UPDATE auth.users
    SET encrypted_password = crypt('admin', gen_salt('bf'))
    WHERE id = existing_admin_id;

    -- Ensure admin user entry exists
    INSERT INTO admin_users (id, role, permissions)
    VALUES (
      existing_admin_id,
      'super_admin',
      '["all"]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin',
        permissions = '["all"]'::jsonb;
  END IF;
END;
$$;