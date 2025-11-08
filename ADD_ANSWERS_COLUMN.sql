-- Add answers column to exam_results table
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;