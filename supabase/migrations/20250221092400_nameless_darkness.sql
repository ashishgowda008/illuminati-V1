/*
  # Fix Admin Users Policies

  1. Changes
    - Remove recursive policies that were causing infinite recursion
    - Simplify admin access checks
    - Add direct role-based policies

  2. Security
    - Maintain strict access control for admin users
    - Prevent unauthorized access to admin data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create new, non-recursive policies
CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM admin_users WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM admin_users WHERE id = auth.uid()) IN ('super_admin', 'admin')
  );

-- Update is_admin function to avoid recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = user_id 
    AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;