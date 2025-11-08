import { supabase } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default requireRole('admin')(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabase.from('users').select('id, employee_id, name, email, department, role, personnel_number, personnel_area, employee_group, discom, gender, personal_mobile');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});