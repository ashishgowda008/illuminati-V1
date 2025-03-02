-- Add new columns to sponsorship_requests table
ALTER TABLE sponsorship_requests
ADD COLUMN IF NOT EXISTS event_category text,
ADD COLUMN IF NOT EXISTS application_deadline timestamptz,
ADD COLUMN IF NOT EXISTS expected_footfall integer DEFAULT 0;

-- Update existing rows with default values
UPDATE sponsorship_requests
SET 
  event_category = 'Tech Fest',
  application_deadline = event_date - interval '7 days',
  expected_footfall = 1000
WHERE event_category IS NULL;

-- Make these columns required for future entries
ALTER TABLE sponsorship_requests
ALTER COLUMN event_category SET NOT NULL,
ALTER COLUMN application_deadline SET NOT NULL,
ALTER COLUMN expected_footfall SET NOT NULL;