/*
  # Fix activity logs and authentication

  1. Changes
    - Remove admin_id foreign key requirement from activity logs
    - Update activity logging trigger to handle non-admin users
    - Fix admin user creation and authentication
*/

-- First, drop the foreign key constraint on admin_activity_logs
ALTER TABLE admin_activity_logs
DROP CONSTRAINT IF EXISTS admin_activity_logs_admin_id_fkey;

-- Modify the log_sponsorship_activity function to not require admin_id
CREATE OR REPLACE FUNCTION log_sponsorship_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sponsorship_activity_logs (
    sponsorship_id,
    action,
    previous_status,
    new_status
  )
  VALUES (
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE TG_OP::text
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate admin user with correct credentials
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM auth.users WHERE email = 'admin@illuminatii.com';
  
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
    'admin@illuminatii.com',
    crypt('illuminatii@2025', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    now(),
    now()
  )
  RETURNING id INTO admin_id;

  -- Create admin user entry
  INSERT INTO admin_users (id, role, permissions)
  VALUES (admin_id, 'admin', '["all"]'::jsonb)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      permissions = '["all"]'::jsonb;
END;
$$;