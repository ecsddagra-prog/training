import { supabase } from '../../../../lib/supabase';
import { requireAuth } from '../../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { examId } = req.query;
  const userId = req.user.id;

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (examError || !exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }



  const { data: assignment } = await supabase
    .from('exam_assignments')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .single();

  if (!assignment) {
    return res.status(403).json({ error: 'You are not assigned to this exam' });
  }

  const { data: existingResult } = await supabase
    .from('exam_results')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .single();

  if (existingResult) {
    return res.status(400).json({ error: 'Exam already attempted' });
  }

  const { data: questions, error: questionsError } = await supabase
    .from('exam_questions')
    .select('questions(*)')
    .eq('exam_id', examId);

  if (questionsError) {
    return res.status(400).json({ error: questionsError.message });
  }

  if (!questions || questions.length === 0) {
    return res.status(400).json({ error: 'No questions assigned to this exam' });
  }

  const formattedQuestions = questions.map(eq => ({
    id: eq.questions.id,
    question: eq.questions.question,
    options: eq.questions.options,
    type: eq.questions.type
  }));

  res.json({
    exam,
    questions: formattedQuestions,
    startTime: new Date().toISOString()
  });
});