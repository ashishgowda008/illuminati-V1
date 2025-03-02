-- First, ensure we have the correct extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up any problematic data
DELETE FROM auth.users 
WHERE email LIKE 'university_%@illuminatii.com'
AND NOT EXISTS (
  SELECT 1 
  FROM university_credentials uc 
  WHERE uc.email = auth.users.email
);

-- Drop and recreate university_credentials to ensure clean state
DROP TABLE IF EXISTS university_credentials CASCADE;

CREATE TABLE university_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  password text NOT NULL,
  auth_password text NOT NULL,
  email text UNIQUE,
  is_assigned boolean DEFAULT false,
  assigned_to text,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE university_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage university credentials"
  ON university_credentials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow authentication check"
  ON university_credentials
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_university_credentials_uid ON university_credentials(uid);
CREATE INDEX IF NOT EXISTS idx_university_credentials_email ON university_credentials(email);

-- Function to safely create university user
CREATE OR REPLACE FUNCTION create_university_user(
  p_uid text,
  p_password text
) RETURNS void AS $$
DECLARE
  v_email text;
  v_user_id uuid;
BEGIN
  -- Generate email
  v_email := 'university_' || p_uid || '@illuminatii.com';
  
  -- Check if auth user exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RETURN;
  END IF;

  -- Create auth user
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
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role', 'university',
      'user_type', 'university',
      'name', 'University ' || p_uid
    ),
    now(),
    now()
  )
  RETURNING id INTO v_user_id;

  -- Create profile
  INSERT INTO profiles (id, name, email, user_type)
  VALUES (
    v_user_id,
    'University ' || p_uid,
    v_email,
    'university'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    updated_at = now();

  -- Update university_credentials
  UPDATE university_credentials
  SET email = v_email
  WHERE uid = p_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert test credentials and create users
DO $$
BEGIN
  -- Insert credentials
  INSERT INTO university_credentials (uid, password, auth_password, is_assigned)
  VALUES
    ('615266', '2QyRzd76', '2QyRzd76', false),
    ('783941', 'Kj9mNp4X', 'Kj9mNp4X', false),
    ('234789', 'Ht5vWq8L', 'Ht5vWq8L', false)
  ON CONFLICT (uid) DO NOTHING;

  -- Create users for each credential
  PERFORM create_university_user(uid, auth_password)
  FROM university_credentials;
END $$;