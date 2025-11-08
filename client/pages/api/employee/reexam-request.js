import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = await requireAuth(req, res, 'employee');
    const { examId, reason } = req.body;

    if (!examId || !reason) {
      return res.status(400).json({ error: 'Exam ID and reason required' });
    }

    const { error } = await supabase
      .from('reexam_requests')
      .insert({
        employee_id: decoded.id,
        exam_id: examId,
        reason,
        status: 'pending'
      });

    if (error) throw error;

    res.json({ message: 'Re-exam request submitted successfully' });
  } catch (error) {
    console.error('Re-exam request error:', error);
    res.status(500).json({ error: error.message });
  }
}
