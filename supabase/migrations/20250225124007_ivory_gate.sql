-- Delete all university users and their associated data
DELETE FROM profiles 
WHERE email LIKE 'university_%@illuminatii.com';

DELETE FROM auth.users 
WHERE email LIKE 'university_%@illuminatii.com';

-- Clear all data from university_credentials
TRUNCATE university_credentials CASCADE;