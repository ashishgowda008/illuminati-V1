-- Delete all university users and their associated data
DELETE FROM profiles 
WHERE email LIKE 'university_%@illuminatii.com';

DELETE FROM auth.users 
WHERE email LIKE 'university_%@illuminatii.com';

-- Clear all data from university_credentials
TRUNCATE university_credentials CASCADE;

-- Add constraint to prevent accidental data entry
ALTER TABLE university_credentials
ADD CONSTRAINT valid_uid CHECK (uid ~ '^[0-9]{6}$');

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Allow authentication check" ON university_credentials;

CREATE POLICY "Allow authentication check"
  ON university_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );