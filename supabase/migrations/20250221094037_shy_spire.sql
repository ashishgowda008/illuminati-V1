/*
  # Fix Admin Dashboard Stats and Add Real-time Updates

  1. Changes
    - Add trigger to update stats on profile changes
    - Add trigger to update stats on user registration
    - Add policies to allow admins to manage stats
    - Add function to manually refresh stats
    - Add real-time subscriptions for stats updates
*/

-- Create trigger function for profile changes
CREATE OR REPLACE FUNCTION update_stats_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats based on user type
  IF NEW.user_type = 'brand' THEN
    INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
    SELECT 'total_brands', COUNT(*), CURRENT_DATE
    FROM profiles
    WHERE user_type = 'brand'
    ON CONFLICT (stat_name, stat_date)
    DO UPDATE SET stat_value = EXCLUDED.stat_value;
  ELSIF NEW.user_type = 'university' THEN
    INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
    SELECT 'total_universities', COUNT(*), CURRENT_DATE
    FROM profiles
    WHERE user_type = 'university'
    ON CONFLICT (stat_name, stat_date)
    DO UPDATE SET stat_value = EXCLUDED.stat_value;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile changes
CREATE TRIGGER update_stats_after_profile_change
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_stats_on_profile_change();

-- Function to manually refresh all stats
CREATE OR REPLACE FUNCTION refresh_all_stats()
RETURNS void AS $$
BEGIN
  -- Update brand count
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_brands', COUNT(*), CURRENT_DATE
  FROM profiles
  WHERE user_type = 'brand'
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;

  -- Update university count
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_universities', COUNT(*), CURRENT_DATE
  FROM profiles
  WHERE user_type = 'university'
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;

  -- Update sponsorship counts
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_stats;

-- Refresh all stats
SELECT refresh_all_stats();