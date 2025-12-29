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

/**
 * Delay utility for rate limiting
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    
    // Check if it's a rate limit/quota error
    const isRateLimit = error?.code === 'RATE_LIMIT_EXCEEDED' || 
                       error?.message?.includes('quota') || 
                       error?.message?.includes('rate limit') ||
                       error?.message?.includes('429');
    
    const errorMessage = isRateLimit
      ? "Limite de requisições da API Gemini excedido. Verifique sua cota no Google AI Studio ou tente novamente mais tarde."
      : "Não foi possível gerar insights no momento. Verifique se a chave da API Gemini está configurada corretamente.";
    
    return {
      strengths: ["Análise não disponível"],
      weaknesses: ["Análise não disponível"],
      recommendations: ["Por favor, tente novamente mais tarde"],
      overallAssessment: errorMessage
    };
  }

  return data;
};

/**
 * Generate insights for multiple players sequentially with optional delay between requests
 * @param delayMs - Optional delay in milliseconds between requests (default: 0, no delay)
 *                  Set to 4000 (4 seconds) to respect 15 RPM limit for free tier
 */
export interface PlayerInsightsInput {
  playerName: string;
  playerStats: Array<{ valence_name: string; average: number; trend: number; count: number }>;
  sessionCount: number;
}

export interface PlayerInsightsResult {
  playerName: string;
  insights: PlayerInsights;
  error?: string;
}

export const generateMultiplePlayerInsights = async (
  players: PlayerInsightsInput[],
  onProgress?: (current: number, total: number, playerName: string) => void,
  delayMs: number = 0
): Promise<PlayerInsightsResult[]> => {
  const results: PlayerInsightsResult[] = [];

  // Process players sequentially (one at a time)
  for (const player of players) {
    try {
      // Call progress callback if provided
      if (onProgress) {
        onProgress(results.length + 1, players.length, player.playerName);
      }

      // Generate insights for this player
      const insights = await generatePlayerInsights(
        player.playerName,
        player.playerStats,
        player.sessionCount
      );

      results.push({
        playerName: player.playerName,
        insights,
      });

      // Wait before processing next player if delay is configured
      // Only delay if not the last player and delay > 0
      if (results.length < players.length && delayMs > 0) {
        await delay(delayMs);
      }
    } catch (error: any) {
      console.error(`Error generating insights for ${player.playerName}:`, error);
      results.push({
        playerName: player.playerName,
        insights: {
          strengths: ["Análise não disponível"],
          weaknesses: ["Análise não disponível"],
          recommendations: ["Por favor, tente novamente mais tarde"],
          overallAssessment: "Erro ao gerar insights para este jogador.",
        },
        error: error?.message || "Erro desconhecido",
      });

      // Still delay even on error if delay is configured
      if (results.length < players.length && delayMs > 0) {
        await delay(delayMs);
      }
    }
  }

  return results;
};
