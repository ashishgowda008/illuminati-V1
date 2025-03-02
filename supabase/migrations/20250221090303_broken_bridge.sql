/*
  # Admin System Setup

  1. New Tables
    - admin_roles enum type
    - admin_users table with role and permissions
  
  2. Security
    - Enable RLS on admin_users
    - Create policies for super admins and regular admins
    - Create helper function to check admin status
  
  3. Changes
    - Add updated_at trigger
    - Create initial super admin user
*/

-- Create admin_roles type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE admin_roles AS ENUM ('super_admin', 'admin', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role admin_roles NOT NULL DEFAULT 'admin',
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
DO $$ BEGIN
  CREATE POLICY "Super admins can manage admin users"
    ON admin_users
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view admin users"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users WHERE id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop the handle_new_user trigger if it exists to prevent profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- Create initial super admin user
DO $$
DECLARE
  new_user_id uuid;
  user_exists boolean;
BEGIN
  -- Check if admin user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin'
  ) INTO user_exists;

  -- Only create if user doesn't exist
  IF NOT user_exists THEN
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