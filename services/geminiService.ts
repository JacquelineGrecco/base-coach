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

export interface PlayerInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallAssessment: string;
}

export const generatePlayerInsights = async (
  playerName: string,
  playerStats: Array<{ valence_name: string; average: number; trend: number; count: number }>,
  sessionCount: number
): Promise<PlayerInsights> => {
  try {
    const client = getGeminiClient();
    
    const statsText = playerStats.map(stat => 
      `- ${stat.valence_name}: ${stat.average.toFixed(1)}/5.0 (${stat.count} avaliações, tendência: ${stat.trend > 0 ? '+' : ''}${stat.trend.toFixed(1)})`
    ).join('\n');

    const prompt = `Você é um treinador profissional de futsal com anos de experiência. 
Analise o desempenho do atleta ${playerName} com base nos seguintes dados:

Total de Sessões: ${sessionCount}
Desempenho por Critério:
${statsText}

Forneça uma análise detalhada em português incluindo:
1. Pontos Fortes (2-3 habilidades onde o atleta se destaca)
2. Pontos a Melhorar (2-3 áreas que precisam de atenção)
3. Recomendações de Treino (3-4 sugestões específicas e práticas)
4. Avaliação Geral (1 parágrafo resumindo o desenvolvimento do atleta)

Seja específico, construtivo e focado em ações práticas que o atleta pode tomar.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            overallAssessment: { type: Type.STRING }
          },
          required: ["strengths", "weaknesses", "recommendations", "overallAssessment"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      return {
        strengths: [],
        weaknesses: [],
        recommendations: [],
        overallAssessment: "Não foi possível gerar análise no momento."
      };
    }

    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating player insights:", error);
    return {
      strengths: ["Análise não disponível"],
      weaknesses: ["Análise não disponível"],
      recommendations: ["Por favor, tente novamente mais tarde"],
      overallAssessment: "Não foi possível gerar insights no momento. Verifique se a chave da API Gemini está configurada corretamente."
    };
  }
};
