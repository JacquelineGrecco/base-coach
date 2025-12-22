import { Drill } from "@/types";
import { geminiClient } from "@/lib/api";
import { aiPrompts, promptSchemas } from "@/lib/ai-prompts";

interface DrillResponse {
  title: string;
  description: string;
  durationMin: number;
  tags: string[];
}

export const generateDrillSuggestions = async (
  focusArea: string, 
  difficulty: string
): Promise<Drill[]> => {
  const prompt = aiPrompts.drillGeneration(focusArea, difficulty);

  const { data, error } = await geminiClient.generateWithRetry<DrillResponse[]>({
    prompt,
    schema: promptSchemas.drill,
    maxRetries: 3,
  });

  if (error || !data) {
    console.error("Error generating drills:", error);
    return [];
  }

  // Map to our Drill interface
  return data.map((item, index) => ({
    id: `ai-gen-${Date.now()}-${index}`,
    title: item.title,
    description: item.description,
    durationMin: item.durationMin,
    difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced",
    tags: item.tags,
    isAiGenerated: true
  }));
};

export const analyzePlayerStats = async (playerName: string, statsSummary: string): Promise<string> => {
  const prompt = aiPrompts.playerStatsAnalysis(playerName, statsSummary);

  const { data, error } = await geminiClient.generateContent<string>(prompt);

  if (error || !data) {
    console.error("Analysis failed:", error);
    return "Analysis unavailable.";
  }

  return data;
};

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
  const statsText = playerStats.map(stat => 
    `- ${stat.valence_name}: ${stat.average.toFixed(1)}/5.0 (${stat.count} avaliações, tendência: ${stat.trend > 0 ? '+' : ''}${stat.trend.toFixed(1)})`
  ).join('\n');

  const prompt = aiPrompts.playerInsights(playerName, statsText, sessionCount);

  const { data, error } = await geminiClient.generateWithRetry<PlayerInsights>({
    prompt,
    schema: promptSchemas.playerInsights,
    maxRetries: 3,
  });

  if (error || !data) {
    console.error("Error generating player insights:", error);
    return {
      strengths: ["Análise não disponível"],
      weaknesses: ["Análise não disponível"],
      recommendations: ["Por favor, tente novamente mais tarde"],
      overallAssessment: "Não foi possível gerar insights no momento. Verifique se a chave da API Gemini está configurada corretamente."
    };
  }

  return data;
};
