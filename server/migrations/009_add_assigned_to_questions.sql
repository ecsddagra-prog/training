-- Add assigned_to column to questions table for contributor assignment
ALTER TABLE questions ADD COLUMN assigned_to UUID REFERENCES users(id);

-- Add index for better performance
CREATE INDEX idx_questions_assigned_to ON questions(assigned_to);