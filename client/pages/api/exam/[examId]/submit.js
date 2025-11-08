import { supabase } from '../../../../lib/supabase';
import { requireAuth } from '../../../../lib/auth';

export default requireAuth(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { examId } = req.query;
  const { answers, totalTime, submittedAt, clientScore, clientPercentage } = req.body;
  const userId = req.user.id;

  const { data: questions } = await supabase
    .from('exam_questions')
    .select('questions(*)')
    .eq('exam_id', examId);

  let score = 0;
  const totalQuestions = questions.length;

  questions.forEach(eq => {
    const userAnswer = answers[eq.questions.id];
    if (userAnswer === eq.questions.correct_answer) {
      score++;
    }
  });

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const { data: allResults } = await supabase
    .from('exam_results')
    .select('percentage')
    .eq('exam_id', examId)
    .order('percentage', { ascending: false });

  const rank = allResults.filter(r => r.percentage > percentage).length + 1;

  const resultData = {
    exam_id: examId,
    user_id: userId,
    answers: answers,
    score: score,
    total_questions: totalQuestions,
    percentage: percentage,
    total_time: totalTime,
    submitted_at: submittedAt,
    rank: rank
  };

  const { data: result, error } = await supabase
    .from('exam_results')
    .insert(resultData)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await supabase.rpc('update_exam_ranks', { exam_id_param: examId });

  res.json({
    result: result,
    message: percentage >= 50 ? 'Congratulations! You passed the exam.' : 'Better luck next time!'
  });
});