
import { GoogleGenerativeAI } from "@google/generative-ai";
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
    console.error("Invalid API Key found:", apiKey);
    process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 5) + "...");

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
    const modelsToTest = [
        "gemini-2.5-flash"
    ];

    console.log("Starting model connectivity test...");

    for (const modelName of modelsToTest) {
        console.log(`\n----------------------------------------`);
        console.log(`Testing Model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            console.log(`Attempting to generate content...`);
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`SUCCESS! Model '${modelName}' is working.`);
            console.log(`Response Preview: ${response.text().substring(0, 50)}...`);
            // We found a working one, but let's test them all to see options? 
            // No, let's just stop at the first working one to give a quick answer.
            console.log(`\nRECOMMENDATION: Use '${modelName}' in your code.`);
            return;
        } catch (error) {
            console.log(`FAILED.`);
            // Log the full error to understand the 404 better
            console.log(`Error Message: ${error.message}`);
            if (error.response) {
                console.log(`Error Response: ${JSON.stringify(error.response)}`);
            }
        }
    }
    console.log(`\n----------------------------------------`);
    console.log("ALL MODELS FAILED. Please check your API Key permissions or region availability.");
}

testModels();
