
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppData } from "../types";



export const geminiService = {
  getInsights: async (data: AppData) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      console.warn("Gemini API Key is missing or invalid.");
      return "AI Insights are unavailable. Please configure the VITE_GEMINI_API_KEY in .env.local.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
      As an expert Tutoring Business Analyst, analyze this data to provide actionable behavioral insights.
      
      Current Data:
      - Students: ${data.students.length}
      - Sessions: ${data.sessions.length}
      - Payments: ${data.payments.length}
      
      Provide exactly 4 distinct insights in a bulleted list. Each bullet must start with one of these keywords to trigger UI styling:
      1. "Earnings: [Analysis of income/revenue]"
      2. "Reminder: [Upcoming urgent sessions or tasks]"
      3. "Overdue: [Payment or task alerts]"
      4. "Progress Suggestion: [Student growth or retention tip]"
      
      Keep each insight under 15 words. Be professional yet motivating.
      User Data Context: ${JSON.stringify({
      recentSessions: data.sessions.slice(0, 5),
      pendingPayments: data.payments.filter(p => p.status === 'pending'),
      students: data.students.map(s => ({ name: s.name, subject: s.subject }))
    })}
    `;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini Error:", error);
      if (error.message?.includes('429')) {
        return "⚠️ AI Quota Exceeded. Please try again in a few minutes.";
      }
      return `Unable to connect to AI service. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
};
