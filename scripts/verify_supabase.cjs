
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let envConfig = {};

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envConfig[key] = value;
        }
    });
} catch (e) {
    console.error('Could not read .env.local', e);
    process.exit(1);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    console.error('❌ Error: Supabase URL or Anon Key missing or incompletely configured in .env.local');
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
            console.error('❌ Connection Error:', error.message);
            if (error.message.includes('relation "students" does not exist') || error.code === '42P01') {
                console.error('   👉 ACTION REQUIRED: The table "students" was not found.');
                console.error('      Please run the SQL content from "supabase/schema.sql" in your Supabase Dashboard SQL Editor.');
            }
            process.exit(1);
        } else {
            console.log('✅ Connection Successful!');
            console.log('✅ "students" table exists and is accessible.');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
        process.exit(1);
    }
}

verify();
