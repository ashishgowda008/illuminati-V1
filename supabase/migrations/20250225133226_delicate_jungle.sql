-- First, ensure we have the correct extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_uid CHECK (uid ~ '^[0-9]{6}$')
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

-- Clean up any orphaned data
DELETE FROM profiles 
WHERE email LIKE 'university_%@illuminatii.com';

DELETE FROM auth.users 
WHERE email LIKE 'university_%@illuminatii.com';

-- Insert test credentials
INSERT INTO university_credentials (uid, password, auth_password, is_assigned)
VALUES
  ('615266', '2QyRzd76', '2QyRzd76', false),
  ('783941', 'Kj9mNp4X', 'Kj9mNp4X', false),
  ('234789', 'Ht5vWq8L', 'Ht5vWq8L', false);

-- Create auth users and profiles for each credential
DO $$
DECLARE
  cred RECORD;
  v_user_id uuid;
  v_email text;
  v_existing_user_id uuid;
BEGIN
  -- Process each credential
  FOR cred IN (
    SELECT uid, auth_password 
    FROM university_credentials
  )
  LOOP
    BEGIN  -- Start inner transaction block
      -- Generate email
      v_email := 'university_' || cred.uid || '@illuminatii.com';
      
      -- Check if user already exists
      SELECT id INTO v_existing_user_id
      FROM auth.users
      WHERE email = v_email;
      
      IF v_existing_user_id IS NULL THEN
        -- Create new auth user
        v_user_id := gen_random_uuid();
        
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
          v_user_id,
          'authenticated',
          'authenticated',
          v_email,
          crypt(cred.auth_password, gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object(
            'role', 'university',
            'user_type', 'university',
            'name', 'University ' || cred.uid
          ),
          now(),
          now()
        );

        -- Create profile using UPSERT
        INSERT INTO profiles (
          id,
          name,
          email,
          user_type,
          created_at,
          updated_at
        )
        VALUES (
          v_user_id,
          'University ' || cred.uid,
          v_email,
          'university',
          now(),
          now()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          user_type = EXCLUDED.user_type,
          updated_at = now();
      ELSE
        -- Update existing user
        UPDATE auth.users
        SET 
          encrypted_password = crypt(cred.auth_password, gen_salt('bf')),
          raw_user_meta_data = jsonb_build_object(
            'role', 'university',
            'user_type', 'university',
            'name', 'University ' || cred.uid
          ),
          updated_at = now()
        WHERE id = v_existing_user_id;

        -- Update existing profile
        UPDATE profiles
        SET 
          name = 'University ' || cred.uid,
          email = v_email,
          user_type = 'university',
          updated_at = now()
        WHERE id = v_existing_user_id;
      END IF;

      -- Update university_credentials
      UPDATE university_credentials
      SET 
        email = v_email,
        is_assigned = true,
        updated_at = now()
      WHERE uid = cred.uid;

    EXCEPTION 
      WHEN unique_violation THEN
        -- Log error and continue with next credential
        RAISE NOTICE 'Skipping duplicate entry for UID: %', cred.uid;
      WHEN OTHERS THEN
        -- Log other errors and continue
        RAISE NOTICE 'Error processing UID %: %', cred.uid, SQLERRM;
    END;
  END LOOP;
END $$;