-- Drop existing policies for sponsorship_requests
DROP POLICY IF EXISTS "Admins can manage sponsorship requests" ON sponsorship_requests;
DROP POLICY IF EXISTS "Brands can view their own requests" ON sponsorship_requests;

-- Create new policies for sponsorship_requests
CREATE POLICY "Brands can manage their own requests"
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

CREATE POLICY "Admins can manage all sponsorship requests"
  ON sponsorship_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );