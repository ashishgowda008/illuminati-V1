/*
  # Fix sponsorship request flow

  1. Changes
    - Update policies to allow brands to create sponsorship requests
    - Allow admins to view and manage all sponsorship requests
    - Fix activity logging for both brands and admins
*/

-- Drop existing policies for sponsorship_requests
DROP POLICY IF EXISTS "Brands can manage their own requests" ON sponsorship_requests;
DROP POLICY IF EXISTS "Admins can manage all sponsorship requests" ON sponsorship_requests;

-- Create new policies for sponsorship_requests
CREATE POLICY "Brands can create and view their own requests"
  ON sponsorship_requests
  FOR ALL
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brand_info WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT id FROM brand_info WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view and manage all requests"
  ON sponsorship_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Update sponsorship_activity_logs policies
DROP POLICY IF EXISTS "Only admins can view activity logs" ON sponsorship_activity_logs;

CREATE POLICY "Admins can view all activity logs"
  ON sponsorship_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Brands can view their own activity logs"
  ON sponsorship_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    sponsorship_id IN (
      SELECT id FROM sponsorship_requests 
      WHERE brand_id IN (
        SELECT id FROM brand_info WHERE user_id = auth.uid()
      )
    )
  );

-- Update the log_sponsorship_activity function
CREATE OR REPLACE FUNCTION log_sponsorship_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sponsorship_activity_logs (
    sponsorship_id,
    admin_id,
    action,
    previous_status,
    new_status,
    feedback
  )
  VALUES (
    NEW.id,
    CASE 
      WHEN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      THEN auth.uid()
      ELSE NULL
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE TG_OP::text
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status,
    NEW.admin_feedback
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;