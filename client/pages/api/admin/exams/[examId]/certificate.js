import { supabase } from '../../../../../lib/supabase';
import { requireRole } from '../../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const { examId } = req.query;
  const { enabled } = req.body;
  const { error } = await supabase.from('exams').update({ certificate_enabled: enabled }).eq('id', examId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Certificate ${enabled ? 'enabled' : 'disabled'}` });
});