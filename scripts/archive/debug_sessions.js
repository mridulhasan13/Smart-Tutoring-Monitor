
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
// Note: We need to parse .env.local manually or use dotenv with path
// Since this is a module, we can just read the file
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.config({ path: envPath }).parsed;

if (!envConfig) {
    console.error("Could not load .env.local");
    process.exit(1);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessions() {
    console.log("Checking sessions...");

    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching sessions:", error);
        return;
    }

    console.log(`Found ${sessions.length} sessions.`);
    if (sessions.length > 0) {
        console.log("Sample Session:", sessions[0]);

        const counts = sessions.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {});
        console.log("Status Counts:", counts);

        // Check dates for last 7 days
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        const recent = sessions.filter(s => {
            const d = new Date(s.date);
            return d >= sevenDaysAgo && d <= today;
        });
        console.log(`Sessions in last 7 days: ${recent.length}`);
        recent.forEach(s => console.log(`- ${s.date} [${s.status}] (${s.duration}m)`));
    }
}

checkSessions();
