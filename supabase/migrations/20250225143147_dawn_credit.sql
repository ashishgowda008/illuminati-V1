-- Function to create auth user for predefined credentials
CREATE OR REPLACE FUNCTION create_auth_user_for_credentials()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
  v_user_id uuid;
BEGIN
  -- Generate email from username and user type
  v_email := NEW.user_type || '_' || NEW.username || '@illuminatii.com';
  
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
    crypt(NEW.password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role', NEW.user_type,
      'user_type', NEW.user_type
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
      WHEN NEW.user_type = 'university' THEN 'University ' || NEW.username
      ELSE 'Brand ' || NEW.username
    END,
    v_email,
    NEW.user_type,
    now(),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new credentials
DROP TRIGGER IF EXISTS on_credential_created ON predefined_credentials;
CREATE TRIGGER on_credential_created
  AFTER INSERT ON predefined_credentials
  FOR EACH ROW
  EXECUTE FUNCTION create_auth_user_for_credentials();

-- Create auth users for existing credentials
DO $$
DECLARE
  cred RECORD;
BEGIN
  FOR cred IN SELECT * FROM predefined_credentials
  LOOP
    DECLARE
      v_email text := cred.user_type || '_' || cred.username || '@illuminatii.com';
      v_user_id uuid;
    BEGIN
      -- Skip if user already exists
      IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        CONTINUE;
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
    EXCEPTION 
      WHEN unique_violation THEN
        -- Skip if user already exists
        NULL;
    END;
  END LOOP;
END $$;