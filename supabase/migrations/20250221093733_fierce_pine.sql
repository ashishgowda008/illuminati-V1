/*
  # Fix Admin Dashboard Stats

  1. Changes
    - Add triggers to automatically update dashboard stats when:
      - Brand info is created/deleted
      - University info is created/deleted
      - Sponsorship requests are created/updated/deleted
    - Add policies to allow admins to manage stats
*/

-- Create trigger functions for automatic stats updates
CREATE OR REPLACE FUNCTION update_stats_on_brand_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total brands count
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_brands', COUNT(*), CURRENT_DATE
  FROM brand_info
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_stats_on_university_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total universities count
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_universities', COUNT(*), CURRENT_DATE
  FROM university_info
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_stats_on_sponsorship_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total sponsorships and pending requests
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_sponsorships', COUNT(*), CURRENT_DATE
  FROM sponsorship_requests
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;

  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'pending_requests', COUNT(*), CURRENT_DATE
  FROM sponsorship_requests
  WHERE status = 'pending'
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for brand_info
CREATE TRIGGER update_stats_after_brand_change
  AFTER INSERT OR DELETE OR UPDATE ON brand_info
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_stats_on_brand_change();

-- Create triggers for university_info
CREATE TRIGGER update_stats_after_university_change
  AFTER INSERT OR DELETE OR UPDATE ON university_info
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_stats_on_university_change();

-- Create triggers for sponsorship_requests
CREATE TRIGGER update_stats_after_sponsorship_change
  AFTER INSERT OR DELETE OR UPDATE ON sponsorship_requests
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_stats_on_sponsorship_change();

-- Add policies for dashboard_stats
CREATE POLICY "Admins can manage dashboard stats"
  ON dashboard_stats
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Refresh all stats
SELECT update_dashboard_stats();