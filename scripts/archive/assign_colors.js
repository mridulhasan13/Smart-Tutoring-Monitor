import { createClient } from '@supabase/supabase-js';

// Configuration
const url = "https://wuhyevecubtsuioklbvz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHlldmVjdWJ0c3Vpb2tsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3NDIsImV4cCI6MjA4NjU2NDc0Mn0.GuB7E4wajxvE_zdhYdCKw2RRxsgnc_gfFYjVdUvoyxI";

const COLORS = ['#2563eb', '#06b6d4', '#7c3aed', '#db2777', '#059669', '#d97706', '#4f46e5', '#be123c'];

const supabase = createClient(url, key);

async function main() {
    console.log("Connecting to Smart Tutoring Monitor Database (Node.js)...");

    console.log("Fetching students...");
    const { data: students, error } = await supabase.from('students').select('*');

    if (error) {
        console.error("Error fetching students:", error);
        return;
    }

    if (!students || students.length === 0) {
        console.log("No students found.");
        return;
    }

    console.log(`Processing ${students.length} students...`);
    let updatedCount = 0;

    for (const student of students) {
        const currentColor = student.color;

        // If missing or not in palette (optional check)
        if (!currentColor || !COLORS.includes(currentColor)) {
            const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            console.log(`Assigning color ${newColor} to ${student.name}...`);

            const { error: updateError } = await supabase
                .from('students')
                .update({ color: newColor })
                .eq('id', student.id);

            if (updateError) {
                console.error(`Error updating student ${student.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`\n[SUCCESS] Updated ${updatedCount} student records with colors.`);
}

main();
