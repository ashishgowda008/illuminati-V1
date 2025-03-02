/*
  # Fix sponsorship policies and indexes

  1. Changes
    - Add public read access for approved sponsorships
    - Add performance indexes
    - Update status constraints
*/

-- First, create the indexes
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_status 
  ON sponsorship_requests(status);

CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_brand_id 
  ON sponsorship_requests(brand_id);

CREATE INDEX IF NOT EXISTS idx_brand_info_user_id 
  ON brand_info(user_id);

-- Then add the public access policy
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view approved sponsorships" ON sponsorship_requests;
  
  CREATE POLICY "Anyone can view approved sponsorships"
    ON sponsorship_requests
    FOR SELECT
    TO public
    USING (status = 'approved');
END $$;

-- Finally update the status constraint
DO $$
BEGIN
  ALTER TABLE sponsorship_requests
    DROP CONSTRAINT IF EXISTS sponsorship_requests_status_check;
    
  ALTER TABLE sponsorship_requests
    ADD CONSTRAINT sponsorship_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested'));
END $$;