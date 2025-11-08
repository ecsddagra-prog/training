import { supabase } from '../../../../lib/supabase';
import { requireRole } from '../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { data, error } = await supabase.from('exam_results').select('*, users(name, employee_id), exams(title)').order('submitted_at', { ascending: false }).limit(10);
  if (error) return res.status(400).json({ error: error.message });
  
  const formatted = data.map(r => ({
    id: r.id,
    user_name: r.users?.name,
    employee_id: r.users?.employee_id,
    exam_title: r.exams?.title,
    score: r.score,
    total_questions: r.total_questions,
    percentage: r.percentage,
    status: r.percentage >= 50 ? 'passed' : 'failed',
    submitted_at: r.submitted_at,
    rank: r.rank
  }));
  
  res.json(formatted);
});