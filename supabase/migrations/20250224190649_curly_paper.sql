-- Add missing columns to university_credentials table
ALTER TABLE university_credentials
ADD COLUMN IF NOT EXISTS auth_password text;

-- Create function to handle university credential creation
CREATE OR REPLACE FUNCTION create_university_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user with a random email
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
    'university_' || NEW.uid || '@illuminatii.com',
    crypt(NEW.auth_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"university"}',
    now(),
    now()
  )
  RETURNING id INTO new_user_id;

  -- Update the university_credentials with the email
  UPDATE university_credentials
  SET email = 'university_' || NEW.uid || '@illuminatii.com'
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for university credential creation
CREATE TRIGGER on_university_credential_created
  AFTER INSERT ON university_credentials
  FOR EACH ROW
  EXECUTE FUNCTION create_university_auth_user();

-- Update existing credentials with auth details if missing
DO $$
DECLARE
  cred RECORD;
BEGIN
  FOR cred IN SELECT * FROM university_credentials WHERE email IS NULL OR auth_password IS NULL
  LOOP
    UPDATE university_credentials
    SET 
      auth_password = COALESCE(cred.auth_password, cred.password),
      email = COALESCE(cred.email, 'university_' || cred.uid || '@illuminatii.com')
    WHERE id = cred.id;
  END LOOP;
END $$;