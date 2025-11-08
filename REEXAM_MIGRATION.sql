-- Re-exam Requests Table
CREATE TABLE IF NOT EXISTS reexam_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES employees(id),
  admin_notes TEXT
);

CREATE INDEX idx_reexam_employee ON reexam_requests(employee_id);
CREATE INDEX idx_reexam_status ON reexam_requests(status);
