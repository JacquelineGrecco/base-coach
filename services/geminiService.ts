import { GoogleGenAI, Type } from "@google/genai";
import { Drill } from "../types";

// Initialize Gemini Client (lazy initialization)
// NOTE: In a real production app, calls should go through a backend to protect the API Key.
let ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to .env.local');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export const generateDrillSuggestions = async (
  focusArea: string, 
  difficulty: string
): Promise<Drill[]> => {
  
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Create 2 unique futsal training drills focusing on "${focusArea}" suitable for "${difficulty}" level players.
    Return the data strictly as a JSON array of objects.
  `;

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              durationMin: { type: Type.INTEGER },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              }
            },
            required: ["title", "description", "durationMin", "tags"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    
    // Map to our Drill interface
    return rawData.map((item: any, index: number) => ({
      id: `ai-gen-${Date.now()}-${index}`,
      title: item.title,
      description: item.description,
      durationMin: item.durationMin,
      difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced",
      tags: item.tags,
      isAiGenerated: true
    }));

  } catch (error) {
    console.error("Error generating drills:", error);
    return [];
  }
};

export const analyzePlayerStats = async (playerName: string, statsSummary: string): Promise<string> => {
    try {
         const client = getGeminiClient();
         const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a professional futsal coach. Analyze the following stats for player ${playerName} and give a concise, constructive 3-sentence feedback summary on what they need to improve.\n\nStats: ${statsSummary}`,
         });
         return response.text || "Could not generate analysis.";
    } catch (e) {
        console.error("Analysis failed", e);
        return "Analysis unavailable.";
    }
}
