import { supabase } from '../../../../../lib/supabase';
import { requireRole } from '../../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  const { error } = await supabase.from('questions').update({ status: 'rejected' }).eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Question rejected' });
});