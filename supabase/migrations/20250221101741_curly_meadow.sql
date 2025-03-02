-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin authentication" ON admin_users;
DROP POLICY IF EXISTS "Admin access" ON admin_users;
DROP POLICY IF EXISTS "Admin authentication" ON admin_users;

-- Create new admin policies
CREATE POLICY "Allow admin access"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (true);

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
  END IF;

  -- Ensure admin_users entry exists
  INSERT INTO admin_users (id, role, permissions)
  VALUES (admin_id, 'admin', '["all"]'::jsonb)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      permissions = '["all"]'::jsonb;
END;
$$;