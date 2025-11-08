import { supabase } from '../../../../../lib/supabase';
import { requireRole } from '../../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { examId } = req.query;
  const { employeeIds } = req.body;

  const assignments = employeeIds.map(empId => ({ exam_id: examId, user_id: empId }));
  const { error } = await supabase.from('exam_assignments').insert(assignments);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Exam assigned successfully' });
});