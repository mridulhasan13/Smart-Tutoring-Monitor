
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

console.log("Testing ListModels REST API...");

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`HTTP Status: ${response.status} ${response.statusText}`);

        const responseData = await response.json();

        if (responseData.models) {
            const modelNames = responseData.models.map(m => m.name).join('\n');
            fs.writeFileSync('models_list.txt', modelNames);
            console.log("Model list saved to models_list.txt");
        } else {
            console.log("No models found or error structure:", JSON.stringify(responseData, null, 2));
        }

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

listModels();
