/*
  # Enhanced Admin Dashboard Schema

  1. New Tables
    - `dashboard_stats` - Stores aggregated statistics
    - `user_activity_logs` - Tracks user activities
    - `sponsorship_activity_logs` - Tracks sponsorship-related activities

  2. Functions
    - Added functions to calculate and update real-time stats
    - Added triggers for activity logging

  3. Views
    - Added materialized views for performance optimization
*/

-- Create dashboard_stats table
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_name text NOT NULL,
  stat_value numeric NOT NULL,
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (stat_name, stat_date)
);

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create sponsorship_activity_logs table
CREATE TABLE IF NOT EXISTS sponsorship_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id uuid REFERENCES sponsorship_requests(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  previous_status text,
  new_status text,
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read dashboard stats"
  ON dashboard_stats
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can read user activity logs"
  ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can read sponsorship activity logs"
  ON sponsorship_activity_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Create function to update dashboard stats
CREATE OR REPLACE FUNCTION update_dashboard_stats()
RETURNS void AS $$
BEGIN
  -- Update or insert total brands count
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_brands', COUNT(*), CURRENT_DATE
  FROM brand_info
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;

  -- Update or insert total universities count
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_universities', COUNT(*), CURRENT_DATE
  FROM university_info
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;

  -- Update or insert total pending requests
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'pending_requests', COUNT(*), CURRENT_DATE
  FROM sponsorship_requests
  WHERE status = 'pending'
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;

  -- Update or insert total sponsorships
  INSERT INTO dashboard_stats (stat_name, stat_value, stat_date)
  SELECT 'total_sponsorships', COUNT(*), CURRENT_DATE
  FROM sponsorship_requests
  ON CONFLICT (stat_name, stat_date)
  DO UPDATE SET stat_value = EXCLUDED.stat_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for logging sponsorship activities
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
    NEW.reviewed_by,
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

-- Create trigger for sponsorship activities
CREATE TRIGGER log_sponsorship_activity_trigger
  AFTER INSERT OR UPDATE ON sponsorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_sponsorship_activity();

-- Create materialized view for daily stats
CREATE MATERIALIZED VIEW daily_stats AS
SELECT
  stat_date,
  jsonb_object_agg(stat_name, stat_value) as stats
FROM dashboard_stats
GROUP BY stat_date
ORDER BY stat_date DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX daily_stats_date_idx ON daily_stats (stat_date);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial stats calculation
SELECT update_dashboard_stats();