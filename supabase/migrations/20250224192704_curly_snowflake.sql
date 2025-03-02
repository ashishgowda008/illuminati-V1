-- First, disable the trigger to prevent automatic user creation
DROP TRIGGER IF EXISTS on_university_credential_created ON university_credentials;
DROP FUNCTION IF EXISTS create_university_auth_user();

-- Clean up existing data
TRUNCATE university_credentials CASCADE;

-- Delete existing university auth users
DELETE FROM auth.users 
WHERE email LIKE 'university_%@illuminatii.com';

-- Create auth users for universities
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert the fixed credentials first
  INSERT INTO university_credentials (uid, password, auth_password, is_assigned)
  VALUES
    ('615266', '2QyRzd76', '2QyRzd76', false),
    ('783941', 'Kj9mNp4X', 'Kj9mNp4X', false),
    ('234789', 'Ht5vWq8L', 'Ht5vWq8L', false);

  -- Create auth users for each credential
  FOR new_user_id IN
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
    SELECT
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'university_' || uid || '@illuminatii.com',
      crypt(auth_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"university","user_type":"university"}',
      now(),
      now()
    FROM university_credentials
    RETURNING id
  LOOP
    -- Create profile for each user
    INSERT INTO profiles (id, name, email, user_type)
    SELECT
      new_user_id,
      'University ' || uc.uid,
      'university_' || uc.uid || '@illuminatii.com',
      'university'
    FROM university_credentials uc
    WHERE NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = new_user_id
    );

    -- Update university_credentials with email
    UPDATE university_credentials uc
    SET email = 'university_' || uc.uid || '@illuminatii.com'
    WHERE email IS NULL;
  END LOOP;
END $$;