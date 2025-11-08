import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseUrl = process.env.SUPABASE_URL || 'https://cgpwrlclywbahahrcaov.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHdybGNseXdiYWhhaHJjYW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4MDAsImV4cCI6MjA3ODA4NzgwMH0.Tu-Vzoq93J67YM-3bqWPZq0vHi_6AWcYvgu3kwtltq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        employee_id: 'ADMIN001',
        name: 'System Admin',
        email: 'admin@company.com',
        password_hash: passwordHash,
        role: 'admin',
        password_reset_required: false
      }, {
        onConflict: 'employee_id'
      })
      .select();

    if (error) {
      console.error('Error creating admin:', error);
    } else {
      console.log('Admin user created/updated successfully!');
      console.log('Login with: employee_id=ADMIN001, password=admin123');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createAdmin();