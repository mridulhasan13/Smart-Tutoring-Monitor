
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Manually load env if dotenv doesn't work out of the box in this context, 
// but we'll try to use the key directly or rely on process.env if loaded.
// Since we are running this with ts-node or similar, we might need to be careful about env vars.
// Let's rely on the user having the key in .env.local and we'll read it manually if needed,
// OR just paste the key if we knew it (we don't).
// Actually, I'll try to read .env.local manually to get the key.

import fs from 'fs';
import path from 'path';

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
    console.error("Invalid API Key found:", apiKey);
    process.exit(1);
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // The SDK might not expose listModels directly on the main class in all versions,
        // but usually it's on the model manager or confirmed via a simple generation test.
        // Actually, listModels is not directly on GoogleGenerativeAI instance in the client web SDK usually,
        // it's often a server-side admin operation. 

        // WAIT. The client SDK (@google/generative-ai) is for generating content.
        // It might not have listModels.
        // Let's try a standard model name that is very likely to exist: "gemini-1.5-flash-latest" or just "gemini-pro" (which failed).

        console.log("Testing model connectivity...");

        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.0-pro", "gemini-pro"];

        for (const modelName of modelsToTest) {
            console.log(`Testing ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`SUCCESS: ${modelName} works! Response: ${response.text()}`);
                return; // Found one!
            } catch (error: any) {
                console.log(`FAILED: ${modelName} - ${error.message.split(':')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
