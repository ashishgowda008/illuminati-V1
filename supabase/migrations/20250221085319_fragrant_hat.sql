/*
  # Clean up duplicate admin users and ensure single admin

  1. Changes
    - Remove all duplicate admin users
    - Ensure only one admin user exists
    - Clean up any orphaned admin_users entries
  
  2. Security
    - Maintains existing RLS policies
    - Preserves admin role restrictions
*/

-- First, identify and keep only the most recent admin user
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

-- Ensure the remaining admin user has correct permissions
UPDATE admin_users
SET role = 'super_admin',
    permissions = '["all"]'::jsonb
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin'
);

-- Create admin user if none exists
DO $$
DECLARE
  admin_exists boolean;
  new_user_id uuid;
BEGIN
  -- Check if admin user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin'
  ) INTO admin_exists;

  IF NOT admin_exists THEN
    -- Create the user in auth.users
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
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
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
      '{"role":"super_admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    -- Create the admin user entry
    INSERT INTO admin_users (id, role, permissions)
    VALUES (
      new_user_id,
      'super_admin',
      '["all"]'::jsonb
    );
  END IF;
END;
$$;