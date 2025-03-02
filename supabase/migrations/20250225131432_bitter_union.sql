-- First, ensure we have the correct extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to safely create university user with proper handling of existing users
CREATE OR REPLACE FUNCTION create_university_user(
  p_uid text,
  p_password text
) RETURNS void AS $$
DECLARE
  v_email text;
  v_user_id uuid;
  v_existing_user_id uuid;
BEGIN
  -- Generate email
  v_email := 'university_' || p_uid || '@illuminatii.com';
  
  -- Check if auth user exists and get their ID
  SELECT id INTO v_existing_user_id
  FROM auth.users 
  WHERE email = v_email
  LIMIT 1;

  IF v_existing_user_id IS NULL THEN
    -- Create new auth user
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

    -- Create profile for new user
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
      'University ' || p_uid,
      v_email,
      'university',
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Update existing user's password
    UPDATE auth.users
    SET 
      encrypted_password = crypt(p_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object(
        'role', 'university',
        'user_type', 'university',
        'name', 'University ' || p_uid
      ),
      updated_at = now()
    WHERE id = v_existing_user_id;

    -- Update existing profile
    UPDATE profiles
    SET 
      name = 'University ' || p_uid,
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
  WHERE uid = p_uid;

EXCEPTION WHEN unique_violation THEN
  -- If we hit a unique constraint, just continue
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up any orphaned profiles
DELETE FROM profiles 
WHERE email LIKE 'university_%@illuminatii.com'
AND id NOT IN (SELECT id FROM auth.users);

-- Clean up any orphaned auth users
DELETE FROM auth.users 
WHERE email LIKE 'university_%@illuminatii.com'
AND id NOT IN (SELECT id FROM profiles);

-- Recreate test users
DO $$
DECLARE
  cred RECORD;
BEGIN
  -- Create or update test credentials
  INSERT INTO university_credentials (uid, password, auth_password, is_assigned)
  VALUES
    ('615266', '2QyRzd76', '2QyRzd76', false),
    ('783941', 'Kj9mNp4X', 'Kj9mNp4X', false),
    ('234789', 'Ht5vWq8L', 'Ht5vWq8L', false)
  ON CONFLICT (uid) DO UPDATE
  SET 
    password = EXCLUDED.password,
    auth_password = EXCLUDED.auth_password,
    updated_at = now();

  -- Create or update users for each credential
  FOR cred IN (
    SELECT uid, auth_password 
    FROM university_credentials
  )
  LOOP
    PERFORM create_university_user(cred.uid, cred.auth_password);
  END LOOP;
END $$;