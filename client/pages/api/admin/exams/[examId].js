import { supabase } from '../../../../lib/supabase';
import { requireRole } from '../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  const { examId } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } else if (req.method === 'PUT') {
    const { title, description, duration, passingScore, startTime, endTime } = req.body;
    const { data, error } = await supabase.from('exams').update({ title, description, duration, passing_score: passingScore, start_time: startTime, end_time: endTime }).eq('id', examId).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } else if (req.method === 'DELETE') {
    const { error } = await supabase.from('exams').delete().eq('id', examId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Exam deleted successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});