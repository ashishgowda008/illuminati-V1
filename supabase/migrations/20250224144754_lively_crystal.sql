/*
  # Add missing columns to sponsorship_requests table

  1. Changes
    - Add requirements column for sponsorship requirements
    - Add target_criteria column for university targeting criteria
*/

-- Add missing columns to sponsorship_requests table
ALTER TABLE sponsorship_requests
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS target_criteria text;

-- Make these columns required for future entries
ALTER TABLE sponsorship_requests
ALTER COLUMN requirements SET NOT NULL,
ALTER COLUMN target_criteria SET NOT NULL;