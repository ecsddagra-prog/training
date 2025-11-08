import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = await requireAuth(req, res, 'admin');
    const { id } = req.query;

    const { error } = await supabase
      .from('reexam_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: decoded.id
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Request approved' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: error.message });
  }
}
