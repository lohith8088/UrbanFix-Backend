import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 🔹 Classify civic issue
export const classifyReport = async (description) => {
  try {
    const prompt = `Classify this civic issue into one of:
    [Pothole, Garbage, Streetlight, Drainage, Other].
    Only return the category name.
    
    Description: "${description}"`;

    const result = await model.generateContent(prompt);
    const category = result.response.text().trim();

    return category || "Other";
  } catch (err) {
    console.error("AI classification error:", err.message);
    return "Other";
  }
};

// 🔹 Draft formal email
export const draftEmail = async (report) => {
  try {
    const prompt = `Draft a short formal email to the concerned civic authority about this issue report.
    Keep it concise and professional 
    *replace the placeholders at end with the "UrbanFix Civic Reporting System"*:

    Title: ${report.title}
    Description: ${report.description}
    Address: ${report.address}
    Category: ${report.category}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("AI email drafting error:", err.message);
    return `Please take necessary action regarding the reported issue: ${report.title}`;
  }
};
