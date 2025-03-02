-- Recreate auth users for all predefined credentials
DO $$
DECLARE
  cred RECORD;
BEGIN
  -- First, clean up any existing auth users and profiles
  DELETE FROM profiles 
  WHERE email IN (
    SELECT user_type || '_' || username || '@illuminatii.com'
    FROM predefined_credentials
  );
  
  DELETE FROM auth.users 
  WHERE email IN (
    SELECT user_type || '_' || username || '@illuminatii.com'
    FROM predefined_credentials
  );

  -- Now recreate all users
  FOR cred IN SELECT * FROM predefined_credentials
  LOOP
    DECLARE
      v_email text := cred.user_type || '_' || cred.username || '@illuminatii.com';
      v_user_id uuid;
    BEGIN
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
        crypt(cred.password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object(
          'role', cred.user_type,
          'user_type', cred.user_type
        ),
        now(),
        now()
      )
      RETURNING id INTO v_user_id;

      -- Create profile
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
        CASE 
          WHEN cred.user_type = 'university' THEN 'University ' || cred.username
          ELSE 'Brand ' || cred.username
        END,
        v_email,
        cred.user_type,
        now(),
        now()
      );
      
      RAISE NOTICE 'Created user for %: %', cred.username, v_email;
    END;
  END LOOP;
END $$;