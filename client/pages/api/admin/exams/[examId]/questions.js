import { supabase } from '../../../../../lib/supabase';
import { requireRole } from '../../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { examId } = req.query;
  const { questionIds } = req.body;

  const examQuestions = questionIds.map(qId => ({ exam_id: examId, question_id: qId }));
  const { error } = await supabase.from('exam_questions').insert(examQuestions);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Questions assigned to exam successfully' });
});