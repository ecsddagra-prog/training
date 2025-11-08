-- Add lot/group column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS lot VARCHAR(50);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_questions_lot ON questions(lot);
