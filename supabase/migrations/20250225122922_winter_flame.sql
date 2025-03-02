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

-- Insert all 30 permanent credentials
INSERT INTO university_credentials (uid, password, auth_password, is_assigned)
VALUES
  -- First set of 10
  ('615266', '2QyRzd76', '2QyRzd76', false),
  ('783941', 'Kj9mNp4X', 'Kj9mNp4X', false),
  ('234789', 'Ht5vWq8L', 'Ht5vWq8L', false),
  ('456123', 'Pn3bMc7Y', 'Pn3bMc7Y', false),
  ('891234', 'Xw6dRf9S', 'Xw6dRf9S', false),
  ('345678', 'Bg4hJk2M', 'Bg4hJk2M', false),
  ('567890', 'Vy7tLp5N', 'Vy7tLp5N', false),
  ('123456', 'Qz8cWm3F', 'Qz8cWm3F', false),
  ('789012', 'Ds5nHt6B', 'Ds5nHt6B', false),
  ('234567', 'Jk9pRv4X', 'Jk9pRv4X', false),
  
  -- Second set of 10
  ('345789', 'Mw2bNc8L', 'Mw2bNc8L', false),
  ('456890', 'Ft6vHj3Y', 'Ft6vHj3Y', false),
  ('567123', 'Rp4kSm7Q', 'Rp4kSm7Q', false),
  ('678234', 'Xt9gWd5B', 'Xt9gWd5B', false),
  ('789345', 'Ln3cKf8H', 'Ln3cKf8H', false),
  ('890456', 'Bv7tMp2X', 'Bv7tMp2X', false),
  ('901567', 'Qy5hRj9N', 'Qy5hRj9N', false),
  ('112678', 'Zw4bLc6S', 'Zw4bLc6S', false),
  ('223789', 'Dk8nWm3F', 'Dk8nWm3F', false),
  ('334890', 'Ht6pRv5X', 'Ht6pRv5X', false),
  
  -- Third set of 10
  ('445901', 'Jk2bNc7L', 'Jk2bNc7L', false),
  ('556012', 'Mw9vHj4Y', 'Mw9vHj4Y', false),
  ('667123', 'Ft3kSm8Q', 'Ft3kSm8Q', false),
  ('778234', 'Rp6gWd2B', 'Rp6gWd2B', false),
  ('889345', 'Xt4cKf7H', 'Xt4cKf7H', false),
  ('990456', 'Ln8tMp3X', 'Ln8tMp3X', false),
  ('100567', 'Bv5hRj9N', 'Bv5hRj9N', false),
  ('200678', 'Qy2bLc6S', 'Qy2bLc6S', false),
  ('300789', 'Zw7nWm4F', 'Zw7nWm4F', false),
  ('400890', 'Dk3pRv8X', 'Dk3pRv8X', false)
ON CONFLICT (uid) DO NOTHING;

-- Create users for each credential
DO $$
BEGIN
  PERFORM create_university_user(uid, auth_password)
  FROM university_credentials;
END $$;