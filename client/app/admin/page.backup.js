'use client';
import { useState, useEffect } from 'react';
import {
  uploadEmployees,
  uploadQuestions,
  createExam,
  getExams,
  assignExam,
  getPendingQuestions,
  approveQuestion,
  rejectQuestion,
  getExamResults,
  getEmployees,
  resetEmployeePassword,
  getApprovedQuestions,
  assignQuestionsToExam,
  getAdminAnalytics,
} from '@/lib/api';
import Head from 'next/head';

export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState({ analytics: false });
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  useEffect(() => {
    loadAnalytics();
  }, []);



  const loadAnalytics = async () => {
    setLoading((prev) => ({ ...prev, analytics: true }));
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  };

  const menuItems = [
    { id: 'upload-employees', title: 'Upload Employees', icon: '👥', description: 'Bulk upload employees via Excel/CSV' },
    { id: 'upload-questions', title: 'Upload Questions', icon: '❓', description: 'Bulk upload questions via Excel/CSV' },
    { id: 'create-exam', title: 'Create Exam', icon: '📝', description: 'Create new examination' },
    { id: 'assign-questions', title: 'Assign Questions to Exam', icon: '🔗', description: 'Link questions to exams' },
    { id: 'assign-exam', title: 'Assign Exam to Employees', icon: '📋', description: 'Assign exams to employees' },
    { id: 'employee-management', title: 'Employee Management', icon: '⚙️', description: 'Manage employee accounts' },
    { id: 'exam-results', title: 'Exam Results', icon: '📊', description: 'View examination results' },
    { id: 'pending-questions', title: 'Pending Questions', icon: '⏳', description: 'Review pending questions' }
  ];

  const renderPageContent = () => {
    switch (currentPage) {
      case 'upload-employees':
        return <UploadEmployeesPage setFeedback={setFeedback} />;
      case 'upload-questions':
        return <UploadQuestionsPage setFeedback={setFeedback} />;
      case 'create-exam':
        return <CreateExamPage setFeedback={setFeedback} />;
      case 'assign-questions':
        return <AssignQuestionsPage setFeedback={setFeedback} />;
      case 'assign-exam':
        return <AssignExamPage setFeedback={setFeedback} />;
      case 'employee-management':
        return <EmployeeManagementPage setFeedback={setFeedback} />;
      case 'exam-results':
        return <ExamResultsPage setFeedback={setFeedback} />;
      case 'pending-questions':
        return <PendingQuestionsPage setFeedback={setFeedback} />;
      default:
        return null;
    }
  };

  if (currentPage !== 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="mr-4 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                  {menuItems.find(item => item.id === currentPage)?.title}
                </h1>
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {feedback.error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-red-700 font-medium">{feedback.error}</p>
            </div>
          </div>
        )}
        {feedback.success && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <p className="text-green-700 font-medium">{feedback.success}</p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderPageContent()}
        </div>
      </div>
    );
  }

  // Component definitions
  const UploadEmployeesPage = ({ setFeedback }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        const result = await uploadEmployees(file);
        let message = result.message;
        if (result.skipped) message += ` (${result.skipped})`;
        setFeedback({ success: message });
        setFile(null);
      } catch (err) {
        let errorMsg = err.response?.data?.error || 'Upload failed.';
        if (err.response?.data?.skipped) errorMsg += ` (${err.response.data.skipped})`;
        setFeedback({ error: errorMsg });
      } finally {
        setLoading(false);
      }
    };

    const downloadSample = () => {
      const sampleData = [
        ['Employee Id', 'Employee Name', 'Email', 'Mobile', 'Department', 'DefaultPassword'],
        ['EMP001', 'Rajesh Kumar', 'rajesh@company.com', '9876543210', 'IT Department', 'Dvvnl@123'],
        ['EMP002', 'Priya Sharma', 'priya@company.com', '9876543211', 'HR Department', 'Dvvnl@123']
      ];
      const csv = sampleData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-lg"
              disabled={loading}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-blue-400 hover:bg-blue-700"
              disabled={!file || loading}
            >
              {loading ? 'Uploading...' : 'Upload Employees'}
            </button>
            <button
              type="button"
              onClick={downloadSample}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Download Sample
            </button>
          </div>
        </form>
      </div>
    );
  };

  const UploadQuestionsPage = ({ setFeedback }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        const result = await uploadQuestions(file);
        setFeedback({ success: result.message });
        setFile(null);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Question upload failed.' });
      } finally {
        setLoading(false);
      }
    };

    const downloadSample = () => {
      const sampleData = [
        ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Subject', 'Difficulty'],
        ['What is 2+2?', '3', '4', '5', '6', 'B', 'Mathematics', 'easy'],
        ['Capital of India?', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'B', 'General Knowledge', 'medium']
      ];
      const csv = sampleData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-lg"
              disabled={loading}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg disabled:bg-purple-400 hover:bg-purple-700"
              disabled={!file || loading}
            >
              {loading ? 'Uploading...' : 'Upload Questions'}
            </button>
            <button
              type="button"
              onClick={downloadSample}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Download Sample
            </button>
          </div>
        </form>
      </div>
    );
  };

  const CreateExamPage = ({ setFeedback }) => {
    const [examForm, setExamForm] = useState({
      title: '', description: '', duration: 60, passingScore: 50,
      totalQuestions: 10, marksPerQuestion: 1, startTime: '', endTime: ''
    });
    const [loading, setLoading] = useState(false);

    const calculateEndTime = (startTime, duration) => {
      if (!startTime || !duration) return '';
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60000);
      return end.toISOString().slice(0, 16);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        await createExam(examForm);
        setFeedback({ success: 'Exam created successfully!' });
        setExamForm({ title: '', description: '', duration: 60, passingScore: 50, totalQuestions: 10, marksPerQuestion: 1, startTime: '', endTime: '' });
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Exam creation failed.' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
            <input
              type="text"
              placeholder="Enter exam title"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              placeholder="Enter exam description"
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              className="w-full p-3 border rounded-lg h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={examForm.duration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value) || 60;
                  const newEndTime = calculateEndTime(examForm.startTime, newDuration);
                  setExamForm({ ...examForm, duration: newDuration, endTime: newEndTime });
                }}
                className="w-full p-3 border rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
              <input
                type="number"
                value={examForm.passingScore}
                onChange={(e) => setExamForm({ ...examForm, passingScore: parseInt(e.target.value) || 50 })}
                className="w-full p-3 border rounded-lg"
                min="1" max="100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={examForm.startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value;
                  const newEndTime = calculateEndTime(newStartTime, examForm.duration);
                  setExamForm({ ...examForm, startTime: newStartTime, endTime: newEndTime });
                }}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time (Auto-calculated)</label>
              <input
                type="datetime-local"
                value={examForm.endTime}
                className="w-full p-3 border rounded-lg bg-gray-100"
                disabled readOnly
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg disabled:bg-green-400 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </form>
      </div>
    );
  };

  const AssignQuestionsPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadExams();
      loadQuestions();
    }, []);

    const loadExams = async () => {
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    };

    const loadQuestions = async () => {
      try {
        const data = await getApprovedQuestions();
        setQuestions(data);
      } catch (err) {
        console.error('Failed to load questions:', err);
      }
    };

    const handleAssign = async () => {
      if (!selectedExam || selectedQuestions.length === 0) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        await assignQuestionsToExam(selectedExam, selectedQuestions);
        setFeedback({ success: 'Questions assigned successfully!' });
        setSelectedQuestions([]);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to assign questions.' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Choose an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Questions ({selectedQuestions.length} selected)</label>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {questions.map((q) => (
                <label key={q.id} className="flex items-start p-3 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions([...selectedQuestions, q.id]);
                      } else {
                        setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                      }
                    }}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{q.question_text}</p>
                    <p className="text-sm text-gray-500">Subject: {q.subject} | Difficulty: {q.difficulty}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleAssign}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-blue-400 hover:bg-blue-700"
            disabled={!selectedExam || selectedQuestions.length === 0 || loading}
          >
            {loading ? 'Assigning...' : 'Assign Questions to Exam'}
          </button>
        </div>
      </div>
    );
  };

  const AssignExamPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadExams();
      loadEmployees();
    }, []);

    const loadExams = async () => {
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    };

    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data.filter(u => u.role === 'employee'));
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };

    const handleAssign = async () => {
      if (!selectedExam || selectedEmployees.length === 0) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        await assignExam(selectedExam, selectedEmployees);
        setFeedback({ success: `Exam assigned to ${selectedEmployees.length} employees!` });
        setSelectedEmployees([]);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to assign exam.' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Choose an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employees ({selectedEmployees.length} selected)</label>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees([...selectedEmployees, emp.id]);
                      } else {
                        setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                      }
                    }}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.email} | {emp.employee_id}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleAssign}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg disabled:bg-green-400 hover:bg-green-700"
            disabled={!selectedExam || selectedEmployees.length === 0 || loading}
          >
            {loading ? 'Assigning...' : 'Assign Exam to Employees'}
          </button>
        </div>
      </div>
    );
  };

  const EmployeeManagementPage = ({ setFeedback }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
      loadEmployees();
    }, []);

    const loadEmployees = async () => {
      setLoading(true);
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load employees:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleResetPassword = async (userId) => {
      if (!confirm('Reset password for this employee?')) return;
      try {
        await resetEmployeePassword(userId);
        setFeedback({ success: 'Password reset successfully!' });
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to reset password.' });
      }
    };

    const filteredEmployees = employees.filter(emp =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{emp.employee_id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{emp.name}</td>
                    <td className="px-4 py-3 text-sm">{emp.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        emp.role === 'admin' ? 'bg-red-100 text-red-700' :
                        emp.role === 'contributor' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleResetPassword(emp.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const ExamResultsPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadExams();
    }, []);

    const loadExams = async () => {
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    };

    const loadResults = async (examId) => {
      setLoading(true);
      try {
        const data = await getExamResults(examId);
        setResults(data);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to load results.' });
      } finally {
        setLoading(false);
      }
    };

    const handleExamChange = (examId) => {
      setSelectedExam(examId);
      if (examId) loadResults(examId);
      else setResults([]);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
          <select
            value={selectedExam}
            onChange={(e) => handleExamChange(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Choose an exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading results...</p>
        ) : results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Percentage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{result.user_name}</td>
                    <td className="px-4 py-3 text-sm">{result.score}/{result.total_marks}</td>
                    <td className="px-4 py-3 text-sm">{result.percentage}%</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        #{result.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(result.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedExam ? (
          <p className="text-center text-gray-500">No results found for this exam.</p>
        ) : null}
      </div>
    );
  };

  const PendingQuestionsPage = ({ setFeedback }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadPendingQuestions();
    }, []);

    const loadPendingQuestions = async () => {
      setLoading(true);
      try {
        const data = await getPendingQuestions();
        setQuestions(data);
      } catch (err) {
        console.error('Failed to load pending questions:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleApprove = async (questionId) => {
      try {
        await approveQuestion(questionId);
        setFeedback({ success: 'Question approved!' });
        loadPendingQuestions();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to approve question.' });
      }
    };

    const handleReject = async (questionId) => {
      if (!confirm('Reject this question?')) return;
      try {
        await rejectQuestion(questionId);
        setFeedback({ success: 'Question rejected!' });
        loadPendingQuestions();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to reject question.' });
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="mb-3">
                  <p className="font-medium text-gray-800 mb-2">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className={q.correct_answer === 'A' ? 'text-green-600 font-medium' : 'text-gray-600'}>A) {q.option_a}</p>
                    <p className={q.correct_answer === 'B' ? 'text-green-600 font-medium' : 'text-gray-600'}>B) {q.option_b}</p>
                    <p className={q.correct_answer === 'C' ? 'text-green-600 font-medium' : 'text-gray-600'}>C) {q.option_c}</p>
                    <p className={q.correct_answer === 'D' ? 'text-green-600 font-medium' : 'text-gray-600'}>D) {q.option_d}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Subject: {q.subject}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Difficulty: {q.difficulty}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">By: {q.contributor_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(q.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(q.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No pending questions.</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Head>
        <title>Admin Dashboard - HR Exam System</title>
      </Head>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Manage exams, users, and questions</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 font-medium">{feedback.error}</p>
          </div>
        )}
        {feedback.success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <p className="text-green-700 font-medium">{feedback.success}</p>
          </div>
        )}

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Exams</p>
                  <p className="text-4xl font-bold mt-2">{analytics.totalExams}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Employees</p>
                  <p className="text-4xl font-bold mt-2">{analytics.totalUsers.employee}</p>
                  <p className="text-green-100 text-xs mt-1">{analytics.totalUsers.contributor} Contributors</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Questions</p>
                  <p className="text-4xl font-bold mt-2">{analytics.questions.pending}</p>
                  <p className="text-yellow-100 text-xs mt-1">{analytics.questions.approved} Approved</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Average Score</p>
                  <p className="text-4xl font-bold mt-2">{analytics.averageScore}%</p>
                  <p className="text-purple-100 text-xs mt-1">Overall Performance</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 4 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer group"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}
