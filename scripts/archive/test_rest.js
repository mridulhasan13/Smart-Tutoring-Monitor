
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env.local');
let apiKey = '';

try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        if (line.startsWith('VITE_GEMINI_API_KEY=')) {
            apiKey = line.split('=')[1].trim();
            break;
        }
    }
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    console.error("Invalid API Key found");
    process.exit(1);
}

console.log("Testing Raw REST API...");

async function testRestApi() {
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const data = {
        contents: [{
            parts: [{ text: "Hello" }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log(`HTTP Status: ${response.status} ${response.statusText}`);

        const responseData = await response.json();
        console.log("Response Body:", JSON.stringify(responseData, null, 2));

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testRestApi();
