/**
 * Centralized AI prompt templates for Gemini API
 * All prompts are versioned and can be easily A/B tested or modified
 */

export const aiPrompts = {
  /**
   * Generate futsal training drills based on focus area and difficulty
   */
  drillGeneration: (focusArea: string, difficulty: string): string => {
    return `Create 2 unique futsal training drills focusing on "${focusArea}" suitable for "${difficulty}" level players.
    
Each drill should include:
- A clear, descriptive title
- Detailed step-by-step description
- Duration in minutes
- Relevant tags for categorization

Return the data strictly as a JSON array of objects.`;
  },

  /**
   * Analyze player statistics and provide constructive feedback
   */
  playerStatsAnalysis: (playerName: string, statsSummary: string): string => {
    return `Act as a professional futsal coach with years of experience. Analyze the following statistics for player ${playerName} and provide a concise, constructive 3-sentence feedback summary focusing on what they need to improve.

Be specific, actionable, and encouraging in your feedback.

Player Statistics:
${statsSummary}`;
  },

  /**
   * Generate comprehensive player insights in Portuguese
   */
  playerInsights: (
    playerName: string,
    statsText: string,
    sessionCount: number
  ): string => {
    return `Você é um treinador profissional de futsal com anos de experiência no desenvolvimento de atletas. 
Analise o desempenho do atleta ${playerName} com base nos seguintes dados:

Total de Sessões Avaliadas: ${sessionCount}
Desempenho por Critério:
${statsText}

Forneça uma análise detalhada e profissional incluindo:

1. **Pontos Fortes** (2-3 habilidades onde o atleta se destaca)
   - Identifique as competências em que o jogador demonstra excelência
   - Base sua análise nos scores mais altos e tendências positivas

2. **Pontos a Melhorar** (2-3 áreas que precisam de atenção)
   - Identifique aspectos técnicos, táticos, físicos ou mentais que necessitam desenvolvimento
   - Seja específico sobre o que precisa melhorar

3. **Recomendações de Treino** (3-4 sugestões específicas e práticas)
   - Sugira exercícios e drills concretos
   - Foque em ações práticas que podem ser implementadas imediatamente
   - Priorize melhorias com maior impacto no desempenho geral

4. **Avaliação Geral** (1 parágrafo resumindo o desenvolvimento do atleta)
   - Faça um balanço geral do desempenho
   - Contextualize a evolução do jogador
   - Seja encorajador mas realista

Seja específico, construtivo e focado em ações práticas que o atleta e o treinador podem tomar para melhorar o desempenho.`;
  },

  /**
   * Generate tactical analysis for a team
   */
  teamTacticalAnalysis: (
    teamName: string,
    sessionData: string,
    playerCount: number
  ): string => {
    return `Como treinador profissional de futsal, analise o desempenho tático do time ${teamName} com base nos dados de ${playerCount} jogadores:

${sessionData}

Forneça uma análise tática focada em:
1. Padrões ofensivos identificados
2. Eficiência defensiva
3. Transições e contra-ataques
4. Recomendações táticas para próximas sessões

Seja conciso e focado em insights acionáveis.`;
  },

  /**
   * Generate session summary and highlights
   */
  sessionSummary: (
    sessionDate: string,
    duration: number,
    playersEvaluated: number,
    topPerformers: string[]
  ): string => {
    return `Crie um resumo profissional da sessão de treino de futsal realizada em ${sessionDate}.

Dados da Sessão:
- Duração: ${duration} minutos
- Jogadores avaliados: ${playersEvaluated}
- Destaques da sessão: ${topPerformers.join(', ')}

Forneça:
1. Um título atrativo para a sessão
2. Resumo executivo (2-3 sentenças)
3. Principais destaques
4. Recomendações para próxima sessão

Mantenha um tom profissional e motivador.`;
  },

  /**
   * Generate comprehensive post-match report with tactical and player management analysis
   */
  postMatchReport: (sessionData: {
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
  }): string => {
    const topPlayers = Object.entries(sessionData.playerMinutes)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([name, data]) => `- ${name}: ${data.total}min (${data.stints.length} períodos)`)
      .join('\n');

    const playerNotes = sessionData.notes
      .filter(n => n.type === 'player')
      .map(n => `- ${n.playerName} (${Math.floor(n.matchMinute / 60)}min): ${n.content}`)
      .join('\n');

    const sessionNotes = sessionData.notes
      .filter(n => n.type === 'session')
      .map(n => `- ${Math.floor(n.matchMinute / 60)}min: ${n.content}`)
      .join('\n');

    return `Você é um treinador profissional de futsal com anos de experiência. Analise a sessão de treino/jogo que acabou de terminar e forneça um relatório estruturado e profissional.

**Dados da Sessão:**
- Duração: ${Math.floor(sessionData.duration / 60)} minutos
- Placar: ${sessionData.teamScore} × ${sessionData.opponentScore}
- Total de Substituições: ${sessionData.substitutions.length}
- Notas do Treinador: ${sessionData.notes.length}

**Distribuição de Minutos (Top 5):**
${topPlayers || 'Nenhum dado disponível'}

${playerNotes ? `**Observações sobre Atletas:**\n${playerNotes}\n` : ''}
${sessionNotes ? `**Observações da Sessão:**\n${sessionNotes}\n` : ''}

**Substituições Realizadas:**
${sessionData.substitutions.length > 0 
  ? sessionData.substitutions.map(s => `- ${Math.floor(s.matchMinute / 60)}min: ${s.playerOutName} → ${s.playerInName}`).join('\n')
  : 'Nenhuma substituição realizada'}

Forneça uma análise profissional e estruturada incluindo:

## 1. Resumo Tático
Principais observações sobre o desempenho coletivo, padrões de jogo identificados e eficiência tática.

## 2. Gestão de Atletas
Análise da rotação de jogadores, distribuição de minutos e impacto das substituições no desempenho do time.

## 3. Pontos Fortes
Aspectos do jogo que funcionaram bem, com exemplos específicos baseados nas notas e observações.

## 4. Áreas de Melhoria
Aspectos técnicos, táticos ou físicos que necessitam atenção, com sugestões específicas de correção.

## 5. Recomendações para Próxima Sessão
Próximos passos concretos, foco de treino e ajustes táticos para implementar.

Seja objetivo, específico e construtivo. Use as notas do treinador para dar contexto e profundidade à análise.`;
  },
};

/**
 * Prompt configuration for schema-based responses
 */
export const promptSchemas = {
  drill: {
    type: 'ARRAY' as const,
    items: {
      type: 'OBJECT' as const,
      properties: {
        title: { type: 'STRING' as const },
        description: { type: 'STRING' as const },
        durationMin: { type: 'INTEGER' as const },
        tags: {
          type: 'ARRAY' as const,
          items: { type: 'STRING' as const },
        },
      },
      required: ['title', 'description', 'durationMin', 'tags'],
    },
  },

  playerInsights: {
    type: 'OBJECT' as const,
    properties: {
      strengths: {
        type: 'ARRAY' as const,
        items: { type: 'STRING' as const },
      },
      weaknesses: {
        type: 'ARRAY' as const,
        items: { type: 'STRING' as const },
      },
      recommendations: {
        type: 'ARRAY' as const,
        items: { type: 'STRING' as const },
      },
      overallAssessment: { type: 'STRING' as const },
    },
    required: ['strengths', 'weaknesses', 'recommendations', 'overallAssessment'],
  },
};

/**
 * Version tracking for prompts (useful for A/B testing)
 */
export const PROMPT_VERSION = '1.0.0';

