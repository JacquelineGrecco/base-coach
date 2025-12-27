import { useState } from 'react';
import { aiPrompts } from '@/lib/ai-prompts';
import { geminiClient } from '@/lib/api/geminiClient';

export interface PostMatchSessionData {
  duration: number;
  teamScore: number;
  opponentScore: number;
  substitutions: Array<{
    playerOutName: string;
    playerInName: string;
    matchMinute: number;
  }>;
  notes: Array<{
    type: 'player' | 'session';
    playerName?: string;
    content: string;
    matchMinute: number;
  }>;
  playerMinutes: Record<string, { total: number; stints: number[] }>;
}

/**
 * Custom hook to generate AI-powered post-match reports
 * Analyzes session data and provides tactical insights
 */
export function usePostMatchReport() {
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (sessionData: PostMatchSessionData) => {
    setIsGenerating(true);
    setError(null);
    setReport(null);

    try {
      const prompt = aiPrompts.postMatchReport(sessionData);
      const response = await geminiClient.generateText(prompt);
      setReport(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório';
      setError(errorMessage);
      console.error('Error generating post-match report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearReport = () => {
    setReport(null);
    setError(null);
  };

  return {
    report,
    isGenerating,
    error,
    generateReport,
    clearReport,
  };
}


