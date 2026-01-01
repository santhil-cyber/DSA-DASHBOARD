import { GoogleGenAI } from "@google/genai";
import { Problem, Status, Confidence } from "../types";

// Initialize Gemini Client
// NOTE: We are strictly following the instruction to use process.env.API_KEY.
// In a real deployed environment, this must be set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCoachRecommendations = async (problems: Problem[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI Coach unavailable: Missing API Key. Please configure your environment variables.";
  }

  const solvedCount = problems.filter(p => p.status === Status.Solved).length;
  const weakPatterns = problems
    .filter(p => p.confidence === Confidence.Weak)
    .map(p => p.pattern)
    .slice(0, 10);

  const prompt = `
    You are an expert DSA (Data Structures and Algorithms) Coach.
    Here is the student's current status:
    - Total Solved: ${solvedCount}
    - Recent Weak Patterns: ${weakPatterns.join(', ') || 'None identified yet'}
    
    Provide a concise, 3-bullet point summary of what they should focus on next.
    Be encouraging but technical.
    Format as HTML bullet points without <ul> tags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Keep practicing!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate recommendations at this moment.";
  }
};

export const chatWithCoach = async (message: string, contextProblems: Problem[]): Promise<string> => {
   if (!process.env.API_KEY) {
    return "AI Coach unavailable: Missing API Key.";
  }

  const stats = {
    solved: contextProblems.filter(p => p.status === Status.Solved).length,
    total: contextProblems.length,
    patterns: [...new Set(contextProblems.map(p => p.pattern))].join(', ')
  };

  const systemInstruction = `You are AlgoMaster, a top-tier technical interview coach. 
  The user has solved ${stats.solved}/${stats.total} problems.
  Known patterns: ${stats.patterns}.
  Keep answers brief, actionable, and related to coding interviews.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text || "I couldn't process that.";
  } catch (error) {
    return "Error connecting to AI Coach.";
  }
};
