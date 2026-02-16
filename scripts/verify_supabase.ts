
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local manually since we are running this script standalone
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Anon Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Supabase Connection...');
    console.log(`URL: ${supabaseUrl}`);

    try {
        // Try to select from 'students' table
        const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });

        if (error) {
            if (error.code === '42P01') { // undefined_table
                console.error('❌ Error: Table "students" does not exist.');
                console.error('   Please run the "supabase/schema.sql" script in your Supabase SQL Editor.');
            } else {
                console.error('❌ Connection Error:', error.message);
            }
            process.exit(1);
        } else {
            console.log('✅ Connection Successful!');
            console.log('✅ "students" table exists.');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
        process.exit(1);
    }
}

verify();
