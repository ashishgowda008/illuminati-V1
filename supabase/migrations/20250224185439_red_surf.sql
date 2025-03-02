/*
  # Add university credentials table

  1. New Tables
    - `university_credentials`
      - `id` (uuid, primary key)
      - `uid` (text, unique)
      - `password` (text)
      - `email` (text)
      - `auth_password` (text)
      - `is_assigned` (boolean)
      - `assigned_to` (text)
      - `last_used` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add policies for authentication
*/

CREATE TABLE university_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  password text NOT NULL,
  email text,
  auth_password text,
  is_assigned boolean DEFAULT false,
  assigned_to text,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE university_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage university credentials"
  ON university_credentials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow authentication check"
  ON university_credentials
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_university_credentials_updated_at
  BEFORE UPDATE ON university_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();