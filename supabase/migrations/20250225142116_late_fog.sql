-- Create table for predefined credentials
CREATE TABLE predefined_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('university', 'brand')),
  is_assigned boolean DEFAULT false,
  assigned_to text,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_username CHECK (username ~ '^[0-9]{6}$')
);

-- Enable RLS
ALTER TABLE predefined_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage predefined credentials"
  ON predefined_credentials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow authentication check"
  ON predefined_credentials
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for faster lookups
CREATE INDEX idx_predefined_credentials_username ON predefined_credentials(username);
CREATE INDEX idx_predefined_credentials_user_type ON predefined_credentials(user_type);

-- Insert predefined credentials for universities
INSERT INTO predefined_credentials (username, password, user_type)
VALUES
  -- Universities (15 credentials)
  ('615266', '2QyRzd76', 'university'),
  ('783941', 'Kj9mNp4X', 'university'),
  ('234789', 'Ht5vWq8L', 'university'),
  ('456123', 'Pn3bMc7Y', 'university'),
  ('891234', 'Xw6dRf9S', 'university'),
  ('345678', 'Bg4hJk2M', 'university'),
  ('567890', 'Vy7tLp5N', 'university'),
  ('123456', 'Qz8cWm3F', 'university'),
  ('789012', 'Ds5nHt6B', 'university'),
  ('234567', 'Jk9pRv4X', 'university'),
  ('345789', 'Mw2bNc8L', 'university'),
  ('456890', 'Ft6vHj3Y', 'university'),
  ('567123', 'Rp4kSm7Q', 'university'),
  ('678234', 'Xt9gWd5B', 'university'),
  ('789345', 'Ln3cKf8H', 'university'),

  -- Brands (15 credentials)
  ('890456', 'Bv7tMp2X', 'brand'),
  ('901567', 'Qy5hRj9N', 'brand'),
  ('112678', 'Zw4bLc6S', 'brand'),
  ('223789', 'Dk8nWm3F', 'brand'),
  ('334890', 'Ht6pRv5X', 'brand'),
  ('445901', 'Jk2bNc7L', 'brand'),
  ('556012', 'Mw9vHj4Y', 'brand'),
  ('667123', 'Ft3kSm8Q', 'brand'),
  ('778234', 'Rp6gWd2B', 'brand'),
  ('889345', 'Xt4cKf7H', 'brand'),
  ('990456', 'Ln8tMp3X', 'brand'),
  ('100567', 'Bv5hRj9N', 'brand'),
  ('200678', 'Qy2bLc6S', 'brand'),
  ('300789', 'Zw7nWm4F', 'brand'),
  ('400890', 'Dk3pRv8X', 'brand');