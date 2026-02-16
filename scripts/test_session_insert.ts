
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Anon Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing session insert...');

    // 1. Get a student ID to use
    const { data: students, error: studentError } = await supabase.from('students').select('id, user_id, name').limit(1);

    if (studentError || !students || students.length === 0) {
        console.error('❌ Could not find a student to test with:', studentError?.message);
        return;
    }

    const student = students[0];
    console.log(`Using student: ${student.name} (${student.id}) for user: ${student.user_id}`);

    const now = new Date();
    const dbSession = {
        user_id: student.user_id,
        student_id: student.id,
        student_name: student.name,
        date: now.toISOString().split('T')[0],
        start_time: now.toISOString(),
        duration: 0,
        status: 'in-progress',
        subject_taught: 'Math',
        notes: 'TEST INSERT'
    };

    console.log('Attempting insert:', dbSession);
    const { data, error } = await supabase.from('sessions').insert(dbSession).select().single();

    if (error) {
        console.error('❌ Insert failed:', error.message);
        console.error('Error details:', error);
    } else {
        console.log('✅ Insert successful!');
        console.log('New session:', data);

        // Clean up
        await supabase.from('sessions').delete().eq('id', data.id);
        console.log('🗑️ Test session deleted.');
    }
}

testInsert();
