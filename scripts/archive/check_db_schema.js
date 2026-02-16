import { createClient } from '@supabase/supabase-js';

// Configuration
const url = "https://wuhyevecubtsuioklbvz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHlldmVjdWJ0c3Vpb2tsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3NDIsImV4cCI6MjA4NjU2NDc0Mn0.GuB7E4wajxvE_zdhYdCKw2RRxsgnc_gfFYjVdUvoyxI";

const supabase = createClient(url, key);

async function main() {
    console.log("Checking 'students' table schema...");

    // Fetch one record to see available columns
    const { data, error } = await supabase.from('students').select('*').limit(1);

    if (error) {
        console.error("Error connecting to DB:", error.message);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log("Existing Columns:", columns.join(", "));

        const missing = [];
        if (!columns.includes('target_sessions')) missing.push('target_sessions');
        if (!columns.includes('institution')) missing.push('institution');
        if (!columns.includes('group_data')) missing.push('group_data');

        if (missing.length > 0) {
            console.log("\n[MISSING COLUMNS DETECTED]:", missing.join(", "));
        } else {
            console.log("\n[OK] All expected columns appear to be present.");
        }
    } else {
        console.log("Could not retrieve a record to check schema (table might be empty).");
    }
}

main();
