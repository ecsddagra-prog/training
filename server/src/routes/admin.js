import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import { supabase } from '../utils/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate, (req, res, next) => {
  console.log('Admin route accessed by:', req.user);
  next();
}, authorize('admin'));

router.post('/upload-employees', upload.single('file'), async (req, res) => {
  try {
    let data;
    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
      const fs = await import('fs');
      const csvContent = fs.default.readFileSync(filePath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    }

    // Filter out empty rows and debug
    console.log('Raw Excel data sample:', data.slice(0, 2));

    const validRows = data.filter((row, index) => {
      const empId = row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '';
      const name = row['Employee Name'] || row['Name'] || '';

      if (!empId || !name) {
          console.log(`Skipping row ${index} due to missing empId or name`);
          return false;
      }

      const empIdStr = String(empId).trim();
      const nameStr = String(name).trim();

      if (empIdStr === '' || nameStr === '' || empIdStr.toLowerCase() === 'null') {
          console.log(`Skipping row ${index} due to empty empId or name or null`);
          return false;
      }

      console.log(`Row ${index}: empId=${empIdStr}, name=${nameStr}`);
      return true;
    });

    console.log(`Valid rows found: ${validRows.length}`);

    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid employee data found. Check column names: Employee Id, Employee Name, or Personnel Number' });
    }

    // Extract all employee IDs and emails first
    const allEmpIds = validRows.map(row => 
      String(row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '').trim()
    );
    const allEmails = validRows.map(row => 
      String(row['Email'] || row['Off. Email'] || row['Personal Email'] || `${String(row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '').trim()}@company.com`).trim()
    );
    
    // Check for existing employees by ID and email in batch
    const { data: existingEmployees } = await supabase
      .from('users')
      .select('employee_id, email')
      .or(`employee_id.in.(${allEmpIds.join(',')}),email.in.(${allEmails.join(',')})`);
    
    const existingIds = new Set(existingEmployees?.map(emp => emp.employee_id) || []);
    const existingEmails = new Set(existingEmployees?.map(emp => emp.email) || []);
    
    const employees = [];
    const processedIds = new Set();
    const skippedExisting = [];
    
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const empId = String(row['Employee Id'] || row['Employee ID'] || row['Personnel Number'] || '').trim();
      const name = String(row['Employee Name'] || row['Name'] || '').trim();

      console.log(`Processing row ${i}: empId='${empId}', name='${name}'`);

      // Skip duplicates within the file
      if (processedIds.has(empId)) {
        console.log(`Skipping duplicate employee ID: ${empId}`);
        continue;
      }
      processedIds.add(empId);

      const email = String(row['Email'] || row['Off. Email'] || row['Personal Email'] || `${empId}@company.com`).trim();

      // Check if employee already exists in database by ID or email
      if (existingIds.has(empId) || existingEmails.has(email)) {
        console.log(`Employee ${empId} or email ${email} already exists, skipping`);
        skippedExisting.push(`${empId} (${email})`);
        continue;
      }

      // Convert Excel date numbers to proper dates
      const convertExcelDate = (excelDate) => {
        if (!excelDate || isNaN(excelDate)) return null;
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      };

      const defaultPassword = String(row['DefaultPassword'] || row['Default Password'] || 'Dvvnl@123').trim();
      
      employees.push({
        employee_id: empId,
        name: name,
        email: String(row['Email'] || row['Off. Email'] || row['Personal Email'] || `${empId}@company.com`).trim(),
        mobile: String(row['Mobile'] || row['Personal Mob.'] || row['Official Mob.'] || '0000000000').trim(),
        department: String(row['Department'] || row['Department Text'] || 'General').trim(),
        password_hash: await bcrypt.hash(defaultPassword, 10),
        role: 'employee',
        password_reset_required: true,
        // All additional fields from Excel
        personnel_number: String(row['Personnel Number'] || '').trim(),
        title: String(row['Title'] || '').trim(),
        previous_personnel_no: String(row['Previous Personnel No.'] || '').trim(),
        old_audit_no: String(row['Old Audit No.'] || '').trim(),
        seniority_no: String(row['Seniority No.'] || '').trim(),
        old_role_no: String(row['Old Role No.'] || '').trim(),
        pf_trust: String(row['PF Trust'] || '').trim(),
        payroll_area_code: String(row['Payroll Area Code'] || '').trim(),
        payroll_area: String(row['Payroll Area'] || '').trim(),
        discom: String(row['DISCOM'] || '').trim(),
        personnel_area_code: String(row['Personnel Area Code'] || '').trim(),
        personnel_area: String(row['Personnel Area'] || '').trim(),
        personnel_sub_area_code: String(row['Personnel Sub-Area Code'] || '').trim(),
        personnel_sub_area: String(row['Personnel Sub-Area'] || '').trim(),
        district: String(row['District'] || '').trim(),
        employee_group_code: String(row['Employee Group Code'] || '').trim(),
        employee_group: String(row['Employee Group'] || '').trim(),
        employee_sub_group_code: String(row['Employee Sub-Group Code'] || '').trim(),
        employee_sub_group: String(row['Employee Sub-Group'] || '').trim(),
        reporting_officer_id: String(row['Reporting Officer Id'] || '').trim(),
        reporting_officer_name: String(row['Reporting Officer Name'] || '').trim(),
        department_id: String(row['Department ID'] || '').trim(),
        ddo_office_code: String(row['DDO Office Code'] || '').trim(),
        ddo_office_name: String(row['DDO Office Name'] || '').trim(),
        ddo_name: String(row['DDO Name'] || '').trim(),
        additional_charge: String(row['Additional Charge'] || '').trim(),
        position_id: String(row['Position ID.'] || '').trim(),
        position_text: String(row['Position Text'] || '').trim(),
        job_id: String(row['Job ID'] || '').trim(),
        job_description: String(row['Job Descrption'] || '').trim(),
        cost_center: String(row['Cost Center'] || '').trim(),
        cost_center_text: String(row['Cost Center Text'] || '').trim(),
        work_schedule: String(row['Work Schedule'] || '').trim(),
        shift_details: String(row['Shift Details'] || '').trim(),
        date_of_joining_pcl: convertExcelDate(row['Date of Joining-PCL']),
        designation_at_joining_pcl: String(row['Designation at Joining-PCL'] || '').trim(),
        employee_group_at_joining_pcl: String(row['Employee group at Joining-PCL'] || '').trim(),
        employee_subgroup_at_joining_pcl: String(row['Employee Subgroup at Joining-PCL'] || '').trim(),
        personnel_area_at_joining_pcl: String(row['Personnel Area at Joining-PCL'] || '').trim(),
        personnel_subarea_at_joining_pcl: String(row['Personnel Subarea at Joining-PCL'] || '').trim(),
        date_of_regularization_pcl: convertExcelDate(row['Date of Regularization-PCL']),
        probation_end_date: convertExcelDate(row['Probation End Date-Joining-PCL']),
        date_of_birth: convertExcelDate(row['Date of Birth']),
        age: String(row['Age'] || '').trim(),
        age_years: parseFloat(row['Age']) || null,
        date_of_retirement_pcl: convertExcelDate(row['Date of Retirement - PCL']),
        gender: String(row['Gender'] || '').trim(),
        religion: String(row['Religion'] || '').trim(),
        category: String(row['Category'] || '').trim(),
        sub_category: String(row['Sub Category'] || '').trim(),
        marital_status: String(row['Marital Status'] || '').trim(),
        personal_mobile: String(row['Personal Mob.'] || '').trim(),
        official_mobile: String(row['Official Mob.'] || '').trim(),
        official_email: String(row['Off. Email'] || '').trim(),
        personal_email: String(row['Personal Email'] || '').trim(),
        pf_acc_no: String(row['PF Acc. No.'] || '').trim(),
        pension_acc_no: String(row['Pension Acc. No.'] || '').trim(),
        fathers_name: String(row['Fathers Name'] || '').trim(),
        mother_name: String(row['Mother Name'] || '').trim()
      });
    }

    if (employees.length === 0) {
      return res.status(400).json({ error: 'No new employees to insert (all may already exist)' });
    }

    console.log(`Inserting ${employees.length} employees:`, employees.map(e => e.employee_id));
    
    // Insert employees one by one to handle any remaining duplicates gracefully
    let successCount = 0;
    const errors = [];
    
    for (const employee of employees) {
      const { error } = await supabase.from('users').insert([employee]);
      if (error) {
        if (error.code === '23505') {
          errors.push(`Employee ID ${employee.employee_id} already exists`);
        } else {
          errors.push(`Error inserting ${employee.employee_id}: ${error.message}`);
        }
      } else {
        successCount++;
      }
    }
    
    const message = `${successCount} employees created successfully`;
    const response = { message, count: successCount };
    
    if (errors.length > 0) {
      response.warnings = errors;
    }
    
    if (skippedExisting.length > 0) {
      response.skipped = `${skippedExisting.length} existing employees ignored: ${skippedExisting.join(', ')}`;
    }
    
    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/exams', async (req, res) => {
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
});

router.get('/exams', async (req, res) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/exams/:examId', async (req, res) => {
  const { examId } = req.params;
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.put('/exams/:examId', async (req, res) => {
  const { examId } = req.params;
  const { title, description, duration, passingScore, startTime, endTime } = req.body;
  
  // Check if exam has started
  const { data: exam } = await supabase
    .from('exams')
    .select('start_time')
    .eq('id', examId)
    .single();
    
  if (exam?.start_time && new Date(exam.start_time) <= new Date()) {
    return res.status(400).json({ error: 'Cannot edit exam after start time' });
  }

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
    .update(examData)
    .eq('id', examId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/exams/:examId', async (req, res) => {
  const { examId } = req.params;
  
  // Check if exam has started
  const { data: exam } = await supabase
    .from('exams')
    .select('start_time')
    .eq('id', examId)
    .single();
    
  if (exam?.start_time && new Date(exam.start_time) <= new Date()) {
    return res.status(400).json({ error: 'Cannot delete exam after start time' });
  }

  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Exam deleted successfully' });
});

router.post('/exams/:examId/assign', async (req, res) => {
  const { examId } = req.params;
  const { employeeIds } = req.body;

  const assignments = employeeIds.map(empId => ({
    exam_id: examId,
    user_id: empId
  }));

  const { error } = await supabase.from('exam_assignments').insert(assignments);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Exam assigned successfully' });
});

router.post('/exams/:examId/questions', async (req, res) => {
  const { examId } = req.params;
  const { questionIds } = req.body;

  const examQuestions = questionIds.map(qId => ({
    exam_id: examId,
    question_id: qId
  }));

  const { error } = await supabase.from('exam_questions').insert(examQuestions);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Questions assigned to exam successfully' });
});

router.get('/questions/approved', async (req, res) => {
  const { subject, difficulty } = req.query;
  
  let query = supabase
    .from('questions')
    .select('*')
    .eq('status', 'approved');
    
  if (subject) query = query.eq('category', subject);
  if (difficulty) query = query.eq('difficulty', difficulty);
  
  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  
  const formatted = data.map(q => ({
    ...q,
    question_text: q.question,
    option_a: q.options?.A || '',
    option_b: q.options?.B || '',
    option_c: q.options?.C || '',
    option_d: q.options?.D || '',
    subject: q.category || q.subject
  }));
  
  res.json(formatted);
});

router.get('/analytics/dashboard', async (req, res) => {
  try {
    const [examsResult, usersResult, questionsResult, resultsResult] = await Promise.all([
      supabase.from('exams').select('id'),
      supabase.from('users').select('id, role'),
      supabase.from('questions').select('id, status'),
      supabase.from('exam_results').select('id, percentage, submitted_at')
    ]);

    const results = resultsResult.data || [];
    const passedResults = results.filter(r => r.percentage >= 50);
    const recentResults = results.filter(r => {
      const submittedDate = new Date(r.submitted_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return submittedDate >= weekAgo;
    });

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
        passRate: results.length > 0 ? ((passedResults.length / results.length) * 100).toFixed(1) : 0,
        recentAttempts: recentResults.length
      },
      averageScore: results.length > 0 
        ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)
        : 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/results/recent', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*, users(name, employee_id), exams(title)')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (error) return res.status(400).json({ error: error.message });
    
    const formatted = data.map(r => ({
      id: r.id,
      user_name: r.users?.name,
      employee_id: r.users?.employee_id,
      exam_title: r.exams?.title,
      score: r.score,
      total_questions: r.total_questions,
      percentage: r.percentage,
      status: r.percentage >= 50 ? 'passed' : 'failed',
      submitted_at: r.submitted_at,
      rank: r.rank
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/questions/pending', async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*, users(name)')
    .eq('status', 'pending');

  if (error) return res.status(400).json({ error: error.message });
  
  const formatted = data.map(q => ({
    ...q,
    question_text: q.question,
    option_a: q.options?.A || '',
    option_b: q.options?.B || '',
    option_c: q.options?.C || '',
    option_d: q.options?.D || '',
    contributor_name: q.users?.name || 'Unknown',
    subject: q.category || q.subject
  }));
  
  res.json(formatted);
});

router.patch('/questions/:id/approve', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('questions')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Question approved' });
});

router.patch('/questions/:id/reject', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('questions')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Question rejected' });
});

router.get('/results/:examId', async (req, res) => {
  const { examId } = req.params;

  const [resultsData, examData] = await Promise.all([
    supabase
      .from('exam_results')
      .select('*, users(name, employee_id, department)')
      .eq('exam_id', examId)
      .order('rank', { ascending: true }),
    supabase
      .from('exams')
      .select('title, passing_score')
      .eq('id', examId)
      .single()
  ]);

  if (resultsData.error) return res.status(400).json({ error: resultsData.error.message });
  
  const results = resultsData.data || [];
  const exam = examData.data;
  
  // Calculate analytics
  const totalAttempts = results.length;
  const passedResults = results.filter(r => r.percentage >= (exam?.passing_score || 50));
  const failedResults = results.filter(r => r.percentage < (exam?.passing_score || 50));
  
  const analytics = {
    totalAttempts,
    passed: passedResults.length,
    failed: failedResults.length,
    passRate: totalAttempts > 0 ? ((passedResults.length / totalAttempts) * 100).toFixed(1) : 0,
    averageScore: totalAttempts > 0 ? (results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts).toFixed(1) : 0,
    highestScore: totalAttempts > 0 ? Math.max(...results.map(r => r.percentage)) : 0,
    lowestScore: totalAttempts > 0 ? Math.min(...results.map(r => r.percentage)) : 0,
    topPerformers: results.slice(0, 5).map(r => ({
      name: r.users?.name,
      employee_id: r.users?.employee_id,
      percentage: r.percentage,
      rank: r.rank
    })),
    departmentWise: results.reduce((acc, r) => {
      const dept = r.users?.department || 'Unknown';
      if (!acc[dept]) acc[dept] = { total: 0, passed: 0 };
      acc[dept].total++;
      if (r.percentage >= (exam?.passing_score || 50)) acc[dept].passed++;
      return acc;
    }, {})
  };
  
  const formatted = results.map(r => ({
    ...r,
    user_name: r.users?.name,
    employee_id: r.users?.employee_id,
    department: r.users?.department,
    status: r.percentage >= (exam?.passing_score || 50) ? 'passed' : 'failed',
    total_marks: r.total_questions
  }));
  
  res.json({ results: formatted, analytics, exam });
});

router.get('/employees', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, employee_id, name, email, department, role, personnel_number, personnel_area, employee_group, discom, gender, personal_mobile');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/reset-password/:employeeId', async (req, res) => {
  const { employeeId } = req.params;

  const hash = await bcrypt.hash('Dvvnl@123', 10);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: hash, password_reset_required: true })
    .eq('employee_id', employeeId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Password reset successfully' });
});

router.patch('/employees/:userId/role', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['admin', 'contributor', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Role updated to ${role} successfully` });
});

router.patch('/exams/:examId/certificate', async (req, res) => {
  const { examId } = req.params;
  const { enabled } = req.body;

  const { error } = await supabase
    .from('exams')
    .update({ certificate_enabled: enabled })
    .eq('id', examId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Certificate ${enabled ? 'enabled' : 'disabled'} successfully` });
});

router.post('/results/:resultId/generate-certificate', async (req, res) => {
  const { resultId } = req.params;

  const { data: result, error } = await supabase
    .from('exam_results')
    .select('*, users(name, employee_id), exams(certificate_enabled)')
    .eq('id', resultId)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (!result) return res.status(404).json({ error: 'Result not found' });
  if (result.percentage < 50) return res.status(400).json({ error: 'Certificate only for passed students' });

  try {
    const { generateCertificate } = await import('../utils/certificate.js');
    const certificateUrl = await generateCertificate(result);
    
    await supabase
      .from('exam_results')
      .update({ certificate_url: certificateUrl })
      .eq('id', resultId);

    res.json({ message: 'Certificate generated successfully', certificateUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/questions/:questionId/assign', async (req, res) => {
  const { questionId } = req.params;
  const { contributorId } = req.body;

  const { error } = await supabase
    .from('questions')
    .update({ assigned_to: contributorId })
    .eq('id', questionId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Question assigned successfully' });
});

router.post('/questions/bulk-assign', async (req, res) => {
  const { questionIds, contributorId, filters } = req.body;

  let query = supabase.from('questions').select('id');
  
  if (questionIds?.length) {
    query = query.in('id', questionIds);
  } else {
    if (filters?.subject) query = query.eq('category', filters.subject);
    if (filters?.lot) query = query.eq('lot', filters.lot);
    if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
  }

  const { data: questions } = await query;
  const ids = questions.map(q => q.id);

  const { error } = await supabase
    .from('questions')
    .update({ assigned_to: contributorId })
    .in('id', ids);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `${ids.length} questions assigned successfully` });
});

router.post('/upload-questions', upload.single('file'), async (req, res) => {
  try {
    let data;
    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
      const fs = await import('fs');
      const csvContent = fs.default.readFileSync(filePath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    } else {
      const workbook = xlsx.readFile(filePath, { codepage: 65001 });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });
    }

    console.log('Raw Questions data sample:', data.slice(0, 2));

    const validRows = data.filter((row, index) => {
      const question = String(row['Question'] || row['question'] || '').trim();
      const optionA = String(row['Option A'] || row['A'] || '').trim();
      const optionB = String(row['Option B'] || row['B'] || '').trim();
      const correctAnswer = String(row['Correct Answer'] || row['Answer'] || '').trim();

      if (!question || !optionA || !optionB || !correctAnswer) {
        console.log(`Skipping question row ${index} due to missing required fields`);
        return false;
      }
      return true;
    });

    console.log(`Valid question rows found: ${validRows.length}`);

    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid questions found. Required columns: Question, Option A, Option B, Correct Answer' });
    }

    const questions = [];
    const processedQuestions = new Set();
    const skipped = [];

    for (const row of validRows) {
      const questionText = String(row['Question'] || row['question'] || '').trim();
      
      if (processedQuestions.has(questionText)) {
        skipped.push(questionText.substring(0, 50));
        continue;
      }

      const { data: existing } = await supabase
        .from('questions')
        .select('id')
        .eq('question', questionText)
        .single();

      if (existing) {
        skipped.push(questionText.substring(0, 50));
        continue;
      }

      processedQuestions.add(questionText);

      const optionA = String(row['Option A'] || row['A'] || '').trim();
      const optionB = String(row['Option B'] || row['B'] || '').trim();
      const optionC = String(row['Option C'] || row['C'] || '').trim();
      const optionD = String(row['Option D'] || row['D'] || '').trim();
      
      const options = { A: optionA, B: optionB };
      if (optionC) options.C = optionC;
      if (optionD) options.D = optionD;

      const questionData = {
        question: questionText,
        type: 'mcq',
        options: options,
        correct_answer: String(row['Correct Answer'] || row['Answer'] || '').trim().toUpperCase(),
        category: String(row['Subject'] || 'General').trim(),
        difficulty: ['easy', 'medium', 'hard'].includes(String(row['Difficulty'] || 'medium').toLowerCase()) ? String(row['Difficulty'] || 'medium').toLowerCase() : 'medium',
        status: 'approved',
        created_by: req.user.id
      };

      const lot = String(row['Lot'] || row['Group'] || row['Batch'] || '').trim();
      if (lot) questionData.lot = lot;

      questions.push(questionData);
    }

    if (questions.length === 0) {
      return res.status(400).json({ error: 'No new questions to insert (all duplicates)' });
    }

    const { data: insertedQuestions, error } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const response = { 
      message: `${insertedQuestions.length} questions uploaded successfully`,
      count: insertedQuestions.length 
    };

    if (skipped.length > 0) {
      response.skipped = `${skipped.length} duplicate questions ignored`;
    }

    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
