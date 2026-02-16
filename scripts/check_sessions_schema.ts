
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

async function checkSchema() {
    console.log('Checking sessions table schema...');

    // We can't directly query information_schema with anon key usually, 
    // but we can try to insert a dummy row or just select a single row and check keys.
    const { data, error } = await supabase.from('sessions').select('*').limit(1);

    if (error) {
        console.error('❌ Error fetching sessions:', error.message);
    } else {
        console.log('✅ Successfully fetched sessions.');
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('No sessions found to inspect columns, but table exists.');
            // Try to select specifically the new column
            const { error: colError } = await supabase.from('sessions').select('student_name').limit(1);
            if (colError) {
                console.error('❌ student_name column check failed:', colError.message);
            } else {
                console.log('✅ student_name column exists.');
            }
        }
    }
}

checkSchema();
