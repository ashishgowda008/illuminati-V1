-- First, clean up any existing data
TRUNCATE university_credentials;

-- Insert the fixed credentials
INSERT INTO university_credentials (uid, password, auth_password, is_assigned)
VALUES
  -- First 10 UIDs
  ('615266', '2QyRzd76', '2QyRzd76', false),
  ('783941', 'Kj9mNp4X', 'Kj9mNp4X', false),
  ('234789', 'Ht5vWq8L', 'Ht5vWq8L', false),
  ('456123', 'Pn3bMc7Y', 'Pn3bMc7Y', false),
  ('891234', 'Xw6dRf9S', 'Xw6dRf9S', false),
  ('345678', 'Bg4hJk2M', 'Bg4hJk2M', false),
  ('567890', 'Vy7tLp5N', 'Vy7tLp5N', false),
  ('123456', 'Qz8cWm3F', 'Qz8cWm3F', false),
  ('789012', 'Ds5nHt6B', 'Ds5nHt6B', false),
  ('234567', 'Jk9pRv4X', 'Jk9pRv4X', false),
  
  -- Next 10 UIDs
  ('345789', 'Mw2bNc8L', 'Mw2bNc8L', false),
  ('456890', 'Ft6vHj3Y', 'Ft6vHj3Y', false),
  ('567123', 'Rp4kSm7Q', 'Rp4kSm7Q', false),
  ('678234', 'Xt9gWd5B', 'Xt9gWd5B', false),
  ('789345', 'Ln3cKf8H', 'Ln3cKf8H', false),
  ('890456', 'Bv7tMp2X', 'Bv7tMp2X', false),
  ('901567', 'Qy5hRj9N', 'Qy5hRj9N', false),
  ('112678', 'Zw4bLc6S', 'Zw4bLc6S', false),
  ('223789', 'Dk8nWm3F', 'Dk8nWm3F', false),
  ('334890', 'Ht6pRv5X', 'Ht6pRv5X', false),
  
  -- Final 10 UIDs
  ('445901', 'Jk2bNc7L', 'Jk2bNc7L', false),
  ('556012', 'Mw9vHj4Y', 'Mw9vHj4Y', false),
  ('667123', 'Ft3kSm8Q', 'Ft3kSm8Q', false),
  ('778234', 'Rp6gWd2B', 'Rp6gWd2B', false),
  ('889345', 'Xt4cKf7H', 'Xt4cKf7H', false),
  ('990456', 'Ln8tMp3X', 'Ln8tMp3X', false),
  ('100567', 'Bv5hRj9N', 'Bv5hRj9N', false),
  ('200678', 'Qy2bLc6S', 'Qy2bLc6S', false),
  ('300789', 'Zw7nWm4F', 'Zw7nWm4F', false),
  ('400890', 'Dk3pRv8X', 'Dk3pRv8X', false);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_university_credentials_uid ON university_credentials(uid);
CREATE INDEX IF NOT EXISTS idx_university_credentials_email ON university_credentials(email);

-- Update RLS policies
DROP POLICY IF EXISTS "Allow authentication check" ON university_credentials;
CREATE POLICY "Allow authentication check"
  ON university_credentials
  FOR SELECT
  TO public
  USING (true);