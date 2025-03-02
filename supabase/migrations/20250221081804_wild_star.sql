/*
  # Update Database Tables

  1. Changes
    - Drop the profiles table
    - Rename waitlist table to student_waitlist

  2. Security
    - Maintain existing RLS policies for student_waitlist
*/

-- Drop the profiles table
DROP TABLE IF EXISTS profiles;

-- Rename waitlist table to student_waitlist
ALTER TABLE IF EXISTS waitlist RENAME TO student_waitlist;

-- Update policy names to reflect new table name
ALTER POLICY "Anyone can insert waitlist entries" 
  ON student_waitlist 
  RENAME TO "Anyone can insert student waitlist entries";

ALTER POLICY "Only admins can read waitlist data" 
  ON student_waitlist 
  RENAME TO "Only admins can read student waitlist data";