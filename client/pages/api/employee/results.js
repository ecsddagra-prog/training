import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const { data, error } = await supabase.from('exam_results').select('*, exams(title)').eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });

  const examIds = data.map(r => r.exam_id);
  const { data: requests } = await supabase
    .from('reexam_requests')
    .select('exam_id')
    .eq('employee_id', req.user.id)
    .in('exam_id', examIds);

  const requestedExams = new Set(requests?.map(r => r.exam_id) || []);
  const results = data.map(r => ({ ...r, reexam_requested: requestedExams.has(r.exam_id) }));

  res.json(results);
});