-- Add certificate_enabled column to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT false;
