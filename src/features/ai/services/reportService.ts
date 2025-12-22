import { Evaluation, PlayerReport } from '@/types';
import { VALENCES } from '@/lib/constants';

/**
 * Generate a detailed player report based on evaluations
 * Report description should be 200-300 characters highlighting strengths and weaknesses
 */
export const generatePlayerReport = (
  playerId: string,
  playerName: string,
  evaluations: Evaluation[],
  sessionId: string = 'default',
  isPremium: boolean = false
): PlayerReport | null => {
  const playerEvals = evaluations.filter(e => e.playerId === playerId);
  
  if (playerEvals.length === 0) {
    return null;
  }

  // Calculate average scores per valence
  const valenceScores = VALENCES.map(valence => {
    const scores = playerEvals.map(e => e.scores[valence.id] || 0).filter(s => s > 0);
    if (scores.length === 0) return null;
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      valence: valence.name,
      category: valence.category,
      score: Number(avg.toFixed(1))
    };
  }).filter(v => v !== null) as Array<{ valence: string; category: string; score: number }>;

  if (valenceScores.length === 0) {
    return null;
  }

  // Identify strengths (score >= 4.0) and weaknesses (score <= 2.5)
  const strengths = valenceScores
    .filter(v => v.score >= 4.0)
    .sort((a, b) => b.score - a.score)
    .map(v => v.valence);
    
  const weaknesses = valenceScores
    .filter(v => v.score <= 2.5)
    .sort((a, b) => a.score - b.score)
    .map(v => v.valence);

  // Generate description (200-300 characters)
  const description = generateDescription(playerName, strengths, weaknesses, valenceScores);

  return {
    playerId,
    sessionId,
    description,
    strengths,
    weaknesses,
    generatedAt: Date.now(),
    isPremium
  };
};

/**
 * Generate a concise 200-300 character description
 */
const generateDescription = (
  playerName: string,
  strengths: string[],
  weaknesses: string[],
  allScores: Array<{ valence: string; score: number }>
): string => {
  let description = '';

  if (strengths.length > 0 && weaknesses.length > 0) {
    // Has both strengths and weaknesses
    const strengthList = strengths.slice(0, 2).join(' and ');
    const weaknessList = weaknesses.slice(0, 2).join(' and ');
    description = `${playerName} demonstrates strong abilities in ${strengthList}. Areas for improvement include ${weaknessList}. Continue developing technical fundamentals through focused practice.`;
  } else if (strengths.length > 0) {
    // Mostly strengths
    const strengthList = strengths.slice(0, 3).join(', ');
    description = `${playerName} shows excellent performance across multiple areas, particularly in ${strengthList}. Maintain this consistency and challenge yourself with advanced drills to reach the next level.`;
  } else if (weaknesses.length > 0) {
    // Mostly weaknesses
    const weaknessList = weaknesses.slice(0, 2).join(' and ');
    description = `${playerName} is developing skills but needs significant work on ${weaknessList}. Focused training sessions and consistent practice will help build confidence and ability. Stay committed to improvement.`;
  } else {
    // Moderate performance
    const avgScore = allScores.reduce((sum, v) => sum + v.score, 0) / allScores.length;
    description = `${playerName} shows moderate performance with an average rating of ${avgScore.toFixed(1)}/5. Focus on consistency and repetition to strengthen fundamentals. Continued effort will yield improvement.`;
  }

  // Ensure description is within 200-300 characters
  if (description.length < 200) {
    description += ' Keep up the hard work and dedication to training.';
  }
  if (description.length > 300) {
    description = description.substring(0, 297) + '...';
  }

  return description;
};

/**
 * Format report for export (text format)
 */
export const formatReportForExport = (
  report: PlayerReport,
  playerName: string,
  teamName: string
): string => {
  const date = new Date(report.generatedAt).toLocaleDateString('pt-BR');
  
  let text = `
═══════════════════════════════════════
  RELATÓRIO DE AVALIAÇÃO
═══════════════════════════════════════

Atleta: ${playerName}
Equipe: ${teamName}
Data: ${date}
${report.isPremium ? 'Relatório Premium ⭐' : ''}

DESCRIÇÃO:
${report.description}

PONTOS FORTES:
${report.strengths.length > 0 ? report.strengths.map(s => `✓ ${s}`).join('\n') : 'Continuar desenvolvendo'}

ÁREAS PARA MELHORIA:
${report.weaknesses.length > 0 ? report.weaknesses.map(w => `• ${w}`).join('\n') : 'Manter o bom desempenho'}

═══════════════════════════════════════
Gerado pelo Base Coach App
═══════════════════════════════════════
  `.trim();

  return text;
};

/**
 * Generate simple stats summary for AI analysis
 */
export const generateStatsSummary = (evaluations: Evaluation[], playerId: string): string => {
  const playerEvals = evaluations.filter(e => e.playerId === playerId);
  
  if (playerEvals.length === 0) return 'No evaluation data available';

  const valenceScores = VALENCES.map(valence => {
    const scores = playerEvals.map(e => e.scores[valence.id] || 0).filter(s => s > 0);
    if (scores.length === 0) return null;
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return `${valence.name}: ${avg.toFixed(1)}/5`;
  }).filter(v => v !== null);

  return valenceScores.join(', ');
};

