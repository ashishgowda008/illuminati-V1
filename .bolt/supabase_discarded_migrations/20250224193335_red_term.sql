-- First, disable the trigger to prevent automatic user creation
DROP TRIGGER IF EXISTS on_university_credential_created ON university_credentials;
DROP FUNCTION IF EXISTS create_university_auth_user();

-- Create auth users for universities
DO $$
DECLARE
  cred RECORD;
  new_user_id uuid;
BEGIN
  -- Insert the fixed credentials if they don't exist
  INSERT INTO university_credentials (uid, password, auth_password, is_assigned)
  VALUES
    ('615266', '2QyRzd76', '2QyRzd76', false),
    ('783941', 'Kj9mNp4X', 'Kj9mNp4X', false),
    ('234789', 'Ht5vWq8L', 'Ht5vWq8L', false)
  ON CONFLICT (uid) DO NOTHING;

  -- Create auth users and profiles for each credential
  FOR cred IN SELECT * FROM university_credentials
  LOOP
    -- Skip if user already exists
    IF NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = 'university_' || cred.uid || '@illuminatii.com'
    ) THEN
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
        'university_' || cred.uid || '@illuminatii.com',
        crypt(cred.auth_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"university","user_type":"university"}',
        now(),
        now()
      )
      RETURNING id INTO new_user_id;

      -- Create profile only if user was created
      INSERT INTO profiles (
        id,
        name,
        email,
        user_type,
        created_at,
        updated_at
      )
      VALUES (
        new_user_id,
        'University ' || cred.uid,
        'university_' || cred.uid || '@illuminatii.com',
        'university',
        now(),
        now()
      );

      -- Update university_credentials with email
      UPDATE university_credentials
      SET email = 'university_' || cred.uid || '@illuminatii.com'
      WHERE uid = cred.uid;
    END IF;
  END LOOP;
END $$;