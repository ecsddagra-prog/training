-- Fix timezone issue in exams table
-- Convert existing timestamps to UTC and make columns timezone aware

-- First, update existing data assuming it's in IST (UTC+5:30)
UPDATE exams 
SET 
  start_time = (start_time AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC',
  end_time = (end_time AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC'
WHERE start_time IS NOT NULL OR end_time IS NOT NULL;

-- Alter columns to use TIMESTAMPTZ (timezone aware)
ALTER TABLE exams 
  ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
  ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
