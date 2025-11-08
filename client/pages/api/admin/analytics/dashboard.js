import { supabase } from '../../../../lib/supabase';
import { requireRole } from '../../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const [examsResult, usersResult, questionsResult, resultsResult, reexamResult] = await Promise.all([
    supabase.from('exams').select('id'),
    supabase.from('users').select('id, role'),
    supabase.from('questions').select('id, status'),
    supabase.from('exam_results').select('id, percentage, submitted_at'),
    supabase.from('reexam_requests').select('id, status')
  ]);

  const results = resultsResult.data || [];
  const passedResults = results.filter(r => r.percentage >= 50);
  
  const analytics = {
    totalExams: examsResult.data?.length || 0,
    totalUsers: {
      admin: usersResult.data?.filter(u => u.role === 'admin').length || 0,
      contributor: usersResult.data?.filter(u => u.role === 'contributor').length || 0,
      employee: usersResult.data?.filter(u => u.role === 'employee').length || 0
    },
    questions: {
      pending: questionsResult.data?.filter(q => q.status === 'pending').length || 0,
      approved: questionsResult.data?.filter(q => q.status === 'approved').length || 0,
      rejected: questionsResult.data?.filter(q => q.status === 'rejected').length || 0
    },
    examResults: {
      totalAttempts: results.length,
      passedCount: passedResults.length,
      failedCount: results.length - passedResults.length,
      passRate: results.length > 0 ? ((passedResults.length / results.length) * 100).toFixed(1) : 0
    },
    averageScore: results.length > 0 ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1) : 0,
    reexamRequests: reexamResult.data?.filter(r => r.status === 'pending').length || 0
  };

  res.json(analytics);
});