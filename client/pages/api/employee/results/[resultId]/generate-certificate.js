import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = await requireAuth(req, res, 'employee');
    const { resultId } = req.query;

    const { data: result, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('id', resultId)
      .eq('employee_id', decoded.id)
      .single();

    if (error || !result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.percentage < 50) {
      return res.status(400).json({ error: 'Certificate only for passed exams' });
    }

    const certificateNumber = `CERT-${Date.now()}-${result.id.substring(0, 8).toUpperCase()}`;

    await supabase.from('exam_results').update({ certificate_number: certificateNumber }).eq('id', resultId);

    res.json({ certificateNumber });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: error.message });
  }
}
