/*
  # Create Brand and University Information Tables

  1. New Tables
    - `brand_info`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `industry` (text, required)
      - `website` (text)
      - `contact_email` (text, required)
      - `contact_phone` (text)
      - `logo_url` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

    - `university_info`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `location` (text, required)
      - `website` (text)
      - `contact_email` (text, required)
      - `contact_phone` (text)
      - `logo_url` (text)
      - `description` (text)
      - `student_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to basic information
*/

-- Create brand_info table
CREATE TABLE IF NOT EXISTS brand_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL,
  website text,
  contact_email text NOT NULL,
  contact_phone text,
  logo_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create university_info table
CREATE TABLE IF NOT EXISTS university_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  website text,
  contact_email text NOT NULL,
  contact_phone text,
  logo_url text,
  description text,
  student_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE brand_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_info ENABLE ROW LEVEL SECURITY;

-- Policies for brand_info
CREATE POLICY "Users can read all brand info"
  ON brand_info
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own brand info"
  ON brand_info
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand info"
  ON brand_info
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand info"
  ON brand_info
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for university_info
CREATE POLICY "Users can read all university info"
  ON university_info
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own university info"
  ON university_info
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own university info"
  ON university_info
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own university info"
  ON university_info
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_brand_info_updated_at
  BEFORE UPDATE ON brand_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_university_info_updated_at
  BEFORE UPDATE ON university_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();