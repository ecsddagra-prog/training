import { supabase } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method === 'POST') {
    const { title, description, duration, passingScore, startTime, endTime } = req.body;

    const examData = {
      title,
      description,
      duration,
      passing_score: passingScore
    };

    if (startTime) examData.start_time = startTime;
    if (endTime) examData.end_time = endTime;

    const { data, error } = await supabase
      .from('exams')
      .insert(examData)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } else if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});