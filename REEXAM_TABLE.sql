-- Re-exam Requests Table
CREATE TABLE IF NOT EXISTS reexam_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL,
  exam_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  admin_notes TEXT
);

CREATE INDEX idx_reexam_employee ON reexam_requests(employee_id);
CREATE INDEX idx_reexam_status ON reexam_requests(status);
