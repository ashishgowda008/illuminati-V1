/*
  # Admin System Tables

  1. New Tables
    - `admin_users`
      - Stores admin user information and permissions
      - Links to auth.users for authentication
    - `sponsorship_requests`
      - Stores sponsorship requests from brands
      - Includes approval status and admin feedback
    - `admin_activity_logs`
      - Tracks all admin actions for auditing

  2. Security
    - Enable RLS on all tables
    - Strict policies for admin access
    - Audit logging for all admin actions
*/

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sponsorship Requests Table
CREATE TABLE IF NOT EXISTS sponsorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brand_info(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  event_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  admin_feedback text,
  reviewed_by uuid REFERENCES admin_users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin Users Policies
CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users
    )
  );

-- Sponsorship Requests Policies
CREATE POLICY "Admins can manage sponsorship requests"
  ON sponsorship_requests
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users
    )
  );

CREATE POLICY "Brands can view their own requests"
  ON sponsorship_requests
  FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brand_info WHERE user_id = auth.uid()
    )
  );

-- Activity Logs Policies
CREATE POLICY "Only admins can view activity logs"
  ON admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users
    )
  );

-- Updated At Trigger
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorship_requests_updated_at
  BEFORE UPDATE ON sponsorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add activity logging triggers
CREATE TRIGGER log_sponsorship_requests_activity
  AFTER INSERT OR UPDATE OR DELETE ON sponsorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_activity();