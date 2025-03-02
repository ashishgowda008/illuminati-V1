-- Clean up any orphaned data first
DELETE FROM profiles 
WHERE email LIKE 'university_%@illuminatii.com';

DELETE FROM auth.users 
WHERE email LIKE 'university_%@illuminatii.com';

-- Drop any related functions
DROP FUNCTION IF EXISTS create_university_user CASCADE;

-- Remove any related indexes
DROP INDEX IF EXISTS idx_university_credentials_uid;
DROP INDEX IF EXISTS idx_university_credentials_email;

-- Clean up any constraints
ALTER TABLE IF EXISTS university_credentials 
DROP CONSTRAINT IF EXISTS valid_uid;

-- Update any existing university profiles to use email-based authentication
UPDATE profiles
SET updated_at = NOW()
WHERE user_type = 'university';