import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const migration = fs.readFileSync('./server/migrations/009_add_assigned_to_questions.sql', 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql: migration });
    
    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();