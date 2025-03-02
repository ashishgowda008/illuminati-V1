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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate university users
DO $$
DECLARE
  cred RECORD;
BEGIN
  FOR cred IN 
    SELECT * FROM university_credentials 
    WHERE uid IN ('615266', '783941', '234789')
  LOOP
    PERFORM create_university_user(cred.uid, cred.auth_password);
  END LOOP;
END $$;