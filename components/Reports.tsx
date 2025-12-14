import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BarChart, Clock, TrendingUp, AlertCircle, User, Calendar, Award, Activity, Users, Download, FileText, Brain, Sparkles, Target, Lightbulb, Share2, Link, Check } from 'lucide-react';
import { VALENCES } from '../constants';
import { supabase } from '../lib/supabase';
import { sessionService, SessionEvaluation } from '../services/sessionService';
import { teamService, Team } from '../services/teamService';
import jsPDF from 'jspdf';
import { generatePlayerInsights, PlayerInsights } from '../services/geminiService';
import { subscriptionService, SubscriptionInfo, TIER_FEATURES } from '../services/subscriptionService';
import { UpgradePrompt } from './UpgradePrompt';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
  position?: string;
  team_id: string;
}

interface PlayerStats {
  valence_id: string;
  valence_name: string;
  average: number;
  count: number;
  trend: number; // positive = improving, negative = declining
}

interface SessionHistory {
  id: string;
  date: string;
  team_name?: string;
  category_name?: string;
  evaluation_count: number;
}

interface EvolutionData {
  date: string;
  sessionId: string;
  [key: string]: string | number; // Dynamic keys for each valence
}

interface ReportsProps {
  preselectedTeamId?: string | null;
  preselectedPlayerId?: string | null;
  fromSessionDetails?: boolean;
  onTeamChange?: () => void;
}

const Reports: React.FC<ReportsProps> = ({ preselectedTeamId, preselectedPlayerId, fromSessionDetails, onTeamChange }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'team' | 'player'>('team'); // Team overview or individual player
  const [playerViewMode, setPlayerViewMode] = useState<'overview' | 'evolution'>('overview'); // Player sub-view
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [selectedValenceForEvolution, setSelectedValenceForEvolution] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'last7' | 'last30' | 'last90'>('all');
  const [aiInsights, setAiInsights] = useState<PlayerInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  // Load teams on mount
  useEffect(() => {
    loadTeams();
    loadSubscription();
  }, []);

  async function loadSubscription() {
    const sub = await subscriptionService.getUserSubscription();
    setSubscription(sub);
  }

  // Set preselected team if provided
  useEffect(() => {
    if (preselectedTeamId && teams.length > 0) {
      const teamExists = teams.find(t => t.id === preselectedTeamId);
      if (teamExists) {
        setSelectedTeamId(preselectedTeamId);
        // If coming from session details, show team view initially
        if (fromSessionDetails) {
          setViewMode('team');
        }
      }
    }
  }, [preselectedTeamId, teams, fromSessionDetails]);

  // Set preselected player if provided (from session details)
  useEffect(() => {
    console.log('Reports - preselected player check:', {
      preselectedPlayerId,
      playersCount: players.length,
      fromSessionDetails,
      selectedPlayerId,
      players: players.map(p => ({ id: p.id, name: p.name }))
    });
    
    if (preselectedPlayerId && players.length > 0 && fromSessionDetails) {
      const playerExists = players.find(p => p.id === preselectedPlayerId);
      console.log('Player found:', playerExists);
      
      if (playerExists) {
        setSelectedPlayerId(preselectedPlayerId);
        setViewMode('player'); // Switch to player view
      }
    } else if (players.length > 0 && !selectedPlayerId && !fromSessionDetails && !preselectedPlayerId) {
      // Auto-select first player for dropdown, but stay in team view
      console.log('Auto-selecting first player for dropdown (staying in team view):', players[0]);
      setSelectedPlayerId(players[0].id);
      // viewMode stays as 'team' (default)
    }
  }, [preselectedPlayerId, players, fromSessionDetails, selectedPlayerId]);

  // Load players and team stats when team changes
  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers(selectedTeamId);
      loadTeamStats(selectedTeamId);
      // Notify parent that team was manually changed
      if (selectedTeamId !== preselectedTeamId && onTeamChange) {
        onTeamChange();
      }
    }
  }, [selectedTeamId]);

  // Load data for selected player
  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerData(selectedPlayerId);
      loadEvolutionData(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  async function loadTeams() {
    setLoading(true);
    setError('');

    try {
      const { teams: teamsData, error: teamsError } = await teamService.getTeams();

      if (teamsError) throw teamsError;

      setTeams(teamsData || []);
      
      // Auto-select first team (will be overridden by preselected team if exists)
      if (teamsData && teamsData.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsData[0].id);
      }
    } catch (err: any) {
      console.error('Error loading teams:', err);
      setError('Erro ao carregar times: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayers(teamId: string) {
    setLoading(true);
    setError('');

    try {
      const { data, error: playersError } = await supabase
        .from('players')
        .select('id, name, jersey_number, position, team_id')
        .eq('team_id', teamId)
        .is('archived_at', null)
        .order('name');

      if (playersError) throw playersError;

      const players = (data as Player[]) || [];
      setPlayers(players);
      
      // Player selection is handled by useEffect
      // Don't auto-select here to avoid conflicts
    } catch (err: any) {
      console.error('Error loading players:', err);
      setError('Erro ao carregar atletas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamStats(teamId: string) {
    try {
      // Get all evaluations for all players in this team
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', teamId)
        .is('archived_at', null);

      if (playersError) throw playersError;

      const playerIds = (playersData || []).map((p: any) => p.id);

      if (playerIds.length === 0) {
        setTeamStats([]);
        return;
      }

      // Get all evaluations for these players
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .in('player_id', playerIds);

      if (evalError) throw evalError;

      if (!evaluations || evaluations.length === 0) {
        setTeamStats([]);
        return;
      }

      // Calculate team-wide stats by valence
      const statsByValence: { [key: string]: { total: number, count: number, playerCounts: Set<string> } } = {};
      
      (evaluations as any[]).forEach((evaluation: any) => {
        const valenceId = evaluation.valence_id;
        if (!statsByValence[valenceId]) {
          statsByValence[valenceId] = { total: 0, count: 0, playerCounts: new Set() };
        }
        if (evaluation.score > 0) { // Exclude 0 scores
          statsByValence[valenceId].total += evaluation.score;
          statsByValence[valenceId].count++;
          statsByValence[valenceId].playerCounts.add(evaluation.player_id);
        }
      });

      // Calculate averages
      const stats = Object.entries(statsByValence).map(([valenceId, data]) => {
        const average = data.count > 0 ? data.total / data.count : 0;
        const valence = VALENCES.find(v => v.id === valenceId);

        return {
          valence_id: valenceId,
          valence_name: valence?.name || valenceId,
          average: Number(average.toFixed(2)) || 0,
          count: data.count,
          player_count: data.playerCounts.size,
        };
      });

      setTeamStats(stats.sort((a, b) => b.average - a.average));
    } catch (err: any) {
      console.error('Error loading team stats:', err);
    }
  }

  async function loadPlayerData(playerId: string) {
    try {
      // Get all evaluations for this player
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select(`
          *,
          sessions(id, date, team_id, category_id)
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (evalError) throw evalError;

      if (!evaluations || evaluations.length === 0) {
        setPlayerStats([]);
        setSessions([]);
        return;
      }

      // Calculate stats by valence
      const statsByValence: { [key: string]: { scores: number[], sessions: number } } = {};
      
      (evaluations as any[]).forEach((evaluation: any) => {
        const valenceId = evaluation.valence_id;
        if (!statsByValence[valenceId]) {
          statsByValence[valenceId] = { scores: [], sessions: 0 };
        }
        if (evaluation.score > 0) { // Exclude 0 scores (not evaluated)
          statsByValence[valenceId].scores.push(evaluation.score);
          statsByValence[valenceId].sessions++;
        }
      });

      // Calculate averages and trends
      const stats: PlayerStats[] = Object.entries(statsByValence).map(([valenceId, data]) => {
        const average = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
        
        // Calculate trend (compare first half vs second half of scores)
        const midpoint = Math.floor(data.scores.length / 2);
        const firstHalf = data.scores.slice(0, midpoint);
        const secondHalf = data.scores.slice(midpoint);
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
        const trend = secondAvg - firstAvg;

        const valence = VALENCES.find(v => v.id === valenceId);

        return {
          valence_id: valenceId,
          valence_name: valence?.name || valenceId,
          average: Number(average.toFixed(2)) || 0,
          count: data.sessions,
          trend: Number(trend.toFixed(2)) || 0,
        };
      });

      setPlayerStats(stats);

      // Get unique sessions for this player
      const uniqueSessions = new Map<string, any>();
      (evaluations as any[]).forEach((evaluation: any) => {
        if (evaluation.sessions) {
          uniqueSessions.set(evaluation.sessions.id, evaluation.sessions);
        }
      });

      const sessionHistory: SessionHistory[] = Array.from(uniqueSessions.values()).map(session => ({
        id: session.id,
        date: session.date,
        team_name: '',
        category_name: '',
        evaluation_count: evaluations.filter((e: any) => e.sessions?.id === session.id).length,
      }));

      setSessions(sessionHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (err: any) {
      console.error('Error loading player data:', err);
      setError('Erro ao carregar dados do atleta: ' + err.message);
    }
  }

  async function loadEvolutionData(playerId: string) {
    try {
      // Get all evaluations for this player with session info
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select(`
          *,
          sessions(id, date)
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: true });

      if (evalError) throw evalError;

      if (!evaluations || evaluations.length === 0) {
        setEvolutionData([]);
        return;
      }

      // Group evaluations by session
      const sessionMap = new Map<string, any>();
      
      (evaluations as any[]).forEach((evaluation: any) => {
        if (!evaluation.sessions) return;
        
        const sessionId = evaluation.sessions.id;
        const sessionDate = evaluation.sessions.date;
        
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            sessionId,
            date: sessionDate,
            scores: {}
          });
        }
        
        const session = sessionMap.get(sessionId);
        const valenceId = evaluation.valence_id;
        
        if (!session.scores[valenceId]) {
          session.scores[valenceId] = [];
        }
        
        if (evaluation.score > 0) { // Exclude 0 scores
          session.scores[valenceId].push(evaluation.score);
        }
      });

      // Calculate averages and format for chart
      const evolutionArray: EvolutionData[] = Array.from(sessionMap.values()).map(session => {
        const dataPoint: EvolutionData = {
          date: new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          sessionId: session.sessionId
        };
        
        // Add average score for each valence
        Object.entries(session.scores).forEach(([valenceId, scores]: [string, any]) => {
          const average = scores.length > 0 
            ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
            : 0;
          dataPoint[valenceId] = Number(average.toFixed(1));
        });
        
        return dataPoint;
      });

      setEvolutionData(evolutionArray);
      
      // Auto-select first valence for evolution chart
      if (playerStats.length > 0 && !selectedValenceForEvolution) {
        setSelectedValenceForEvolution(playerStats[0].valence_id);
      }

    } catch (err: any) {
      console.error('Error loading evolution data:', err);
    }
  }

  // Prepare radar chart data
  const radarChartData = useMemo(() => {
    return playerStats.map(stat => ({
      subject: stat.valence_name,
      score: stat.average,
      fullMark: 5,
    }));
  }, [playerStats]);

  // Filter evolution data by date range
  const filteredEvolutionData = useMemo(() => {
    if (dateRangeFilter === 'all') return evolutionData;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (dateRangeFilter) {
      case 'last7':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'last30':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'last90':
        cutoffDate.setDate(now.getDate() - 90);
        break;
    }
    
    return evolutionData.filter(data => {
      // Parse the date from DD/MM format
      const [day, month] = data.date.split('/').map(Number);
      const year = now.getFullYear();
      const dataDate = new Date(year, month - 1, day);
      return dataDate >= cutoffDate;
    });
  }, [evolutionData, dateRangeFilter]);

  // Get selected player object
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  // Get player initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Export Player Report to PDF
  const exportPlayerReportToPDF = () => {
    if (!selectedPlayer) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Desempenho', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Player Info
    doc.setFontSize(16);
    doc.text(selectedPlayer.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const playerInfo = [
      selectedPlayer.jersey_number ? `Camisa: #${selectedPlayer.jersey_number}` : '',
      selectedPlayer.position ? `Posição: ${selectedPlayer.position}` : '',
    ].filter(Boolean).join(' | ');
    doc.text(playerInfo, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Date
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Summary Stats
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Resumo Estatístico', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Sessões: ${sessions.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Critérios Avaliados: ${playerStats.length}`, 20, yPos);
    yPos += 6;
    const overallAvg = playerStats.length > 0 
      ? (playerStats.reduce((sum, stat) => sum + stat.average, 0) / playerStats.length).toFixed(1)
      : '0.0';
    doc.text(`Média Geral: ${overallAvg}/5.0`, 20, yPos);
    yPos += 15;

    // Performance by Criterion
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Desempenho por Critério', 20, yPos);
    yPos += 10;

    // Table Header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Critério', 20, yPos);
    doc.text('Média', 100, yPos);
    doc.text('Avaliações', 140, yPos);
    doc.text('Tendência', 170, yPos);
    yPos += 5;

    // Table Body
    doc.setFont('helvetica', 'normal');
    playerStats.slice(0, 15).forEach((stat) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(stat.valence_name.substring(0, 25), 20, yPos);
      doc.text(`${stat.average.toFixed(1)}/5.0`, 100, yPos);
      doc.text(`${stat.count}x`, 140, yPos);
      const trend = stat.trend > 0.1 ? '↗ Melhorando' : stat.trend < -0.1 ? '↘ Declinando' : '— Estável';
      doc.text(trend, 170, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Session History
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Sessões', 20, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    sessions.slice(0, 10).forEach((session) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const date = new Date(session.date).toLocaleDateString('pt-BR');
      const time = new Date(session.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      doc.text(`${date} às ${time} - ${session.evaluation_count} avaliações`, 20, yPos);
      yPos += 6;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
      doc.text('BaseCoach - Sistema de Avaliação de Atletas', pageWidth / 2, 285, { align: 'center' });
    }

    // Save PDF
    const fileName = `relatorio_${selectedPlayer.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Export Team Report to PDF
  const exportTeamReportToPDF = () => {
    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    if (!selectedTeam) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório do Time', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Team Info
    doc.setFontSize(16);
    doc.text(selectedTeam.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Date
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Summary Stats
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Resumo Estatístico', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Atletas Ativos: ${players.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Critérios Avaliados: ${teamStats.length}`, 20, yPos);
    yPos += 6;
    const teamAvg = teamStats.length > 0 
      ? (teamStats.reduce((sum, stat) => sum + stat.average, 0) / teamStats.length).toFixed(1)
      : '0.0';
    doc.text(`Média Geral do Time: ${teamAvg}/5.0`, 20, yPos);
    yPos += 6;
    if (teamStats.length > 0) {
      doc.text(`Melhor Habilidade: ${teamStats[0].valence_name} (${teamStats[0].average.toFixed(1)}/5.0)`, 20, yPos);
    }
    yPos += 15;

    // Performance by Criterion
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Desempenho do Time por Critério', 20, yPos);
    yPos += 10;

    // Table Header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Critério', 20, yPos);
    doc.text('Média', 100, yPos);
    doc.text('Avaliações', 140, yPos);
    doc.text('Atletas', 170, yPos);
    yPos += 5;

    // Table Body
    doc.setFont('helvetica', 'normal');
    teamStats.forEach((stat) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(stat.valence_name.substring(0, 25), 20, yPos);
      doc.text(`${stat.average.toFixed(1)}/5.0`, 100, yPos);
      doc.text(`${stat.count}x`, 140, yPos);
      doc.text(`${stat.player_count}`, 170, yPos);
      yPos += 6;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
      doc.text('BaseCoach - Sistema de Avaliação de Atletas', pageWidth / 2, 285, { align: 'center' });
    }

    // Save PDF
    const fileName = `relatorio_time_${selectedTeam.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Export player report to PDF
  const handleExportPDF = () => {
    if (!selectedPlayer) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text('BaseCoach - Relatório do Atleta', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(selectedPlayer.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const playerInfo = [
      selectedPlayer.jersey_number ? `#${selectedPlayer.jersey_number}` : '',
      selectedPlayer.position || ''
    ].filter(Boolean).join(' - ');
    if (playerInfo) {
      doc.text(playerInfo, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
    }

    const currentTeam = teams.find(t => t.id === selectedTeamId);
    if (currentTeam) {
      doc.text(currentTeam.name, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }

    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Resumo do Desempenho', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const overallAvg = playerStats.length > 0 && playerStats.reduce((sum, stat) => sum + stat.average, 0) > 0
      ? (playerStats.reduce((sum, stat) => sum + stat.average, 0) / playerStats.length).toFixed(1)
      : '0.0';
    
    doc.text(`Média Geral: ${overallAvg} / 5.0`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total de Sessões: ${sessions.length}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Critérios Avaliados: ${playerStats.length}`, 20, yPosition);
    yPosition += 15;

    // Performance by Criteria
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Desempenho por Critério', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const sortedStats = [...playerStats].sort((a, b) => b.average - a.average);
    
    sortedStats.forEach((stat, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const trend = stat.trend > 0.1 ? '↗' : stat.trend < -0.1 ? '↘' : '→';
      const trendText = stat.trend > 0.1 ? `+${stat.trend.toFixed(1)}` : stat.trend < -0.1 ? stat.trend.toFixed(1) : 'estável';
      
      doc.text(`${index + 1}. ${stat.valence_name}`, 20, yPosition);
      doc.text(`${stat.average.toFixed(1)} / 5.0`, 100, yPosition);
      doc.text(`${stat.count}x avaliações`, 140, yPosition);
      doc.text(`${trend} ${trendText}`, 175, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Session History
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Histórico de Sessões', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const recentSessions = sessions.slice(0, 10); // Last 10 sessions
    recentSessions.forEach((session, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      const dateStr = new Date(session.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStr = new Date(session.date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.text(`${dateStr} ${timeStr}`, 20, yPosition);
      doc.text(`${session.evaluation_count} avaliações`, 100, yPosition);
      yPosition += 7;
    });

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${totalPages} - BaseCoach © ${new Date().getFullYear()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = `relatorio_${selectedPlayer.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Generate AI insights for player
  const handleGenerateInsights = async () => {
    if (!selectedPlayer || playerStats.length === 0) return;

    setLoadingInsights(true);
    try {
      const insights = await generatePlayerInsights(
        selectedPlayer.name,
        playerStats,
        sessions.length
      );
      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Share player report
  const handleShareReport = async () => {
    if (!selectedPlayer) return;

    const reportText = `📊 Relatório de Desempenho - ${selectedPlayer.name}

${selectedPlayer.jersey_number ? `Número: #${selectedPlayer.jersey_number}` : ''}
${selectedPlayer.position ? `Posição: ${selectedPlayer.position}` : ''}
${teams.find(t => t.id === selectedTeamId)?.name ? `Time: ${teams.find(t => t.id === selectedTeamId)?.name}` : ''}

📈 Resumo:
• Média Geral: ${playerStats.length > 0 && playerStats.reduce((sum, stat) => sum + stat.average, 0) > 0
      ? (playerStats.reduce((sum, stat) => sum + stat.average, 0) / playerStats.length).toFixed(1)
      : '0.0'} / 5.0
• Sessões Completadas: ${sessions.length}
• Critérios Avaliados: ${playerStats.length}

🏆 Melhor Habilidade: ${playerStats.length > 0 ? playerStats.reduce((max, stat) => stat.average > max.average ? stat : max).valence_name : 'N/A'} (${playerStats.length > 0 ? playerStats.reduce((max, stat) => stat.average > max.average ? stat : max).average.toFixed(1) : '0.0'}/5.0)

📅 Última Atualização: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}

Gerado por BaseCoach - Plataforma de Análise de Desempenho para Futsal`;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Relatório - ${selectedPlayer.name}`,
          text: reportText,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        console.log('Share cancelled');
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(reportText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Não foi possível copiar o relatório. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar relatórios</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum time encontrado</h3>
          <p className="text-slate-600 mb-6">
            Crie um time em "Times" para começar a gerar relatórios de desempenho.
          </p>
        </div>
      </div>
    );
  }

  if (players.length === 0 && selectedTeamId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Relatórios dos Atletas</h1>
          <p className="text-slate-600 mt-1">Análise de desempenho e progresso</p>
        </div>

        {/* Team Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Time</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.player_count || 0} atletas)
              </option>
            ))}
          </select>
        </div>

        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum atleta neste time</h3>
          <p className="text-slate-600 mb-6">
            Adicione atletas ao time selecionado para começar a gerar relatórios.
          </p>
        </div>
      </div>
    );
  }

  // Only show player empty state if we're actually in player view mode
  if (sessions.length === 0 && selectedPlayerId && viewMode === 'player') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Relatórios dos Atletas</h1>
          <p className="text-slate-600 mt-1">Análise de desempenho e progresso</p>
        </div>

        {/* Team Selector and View Mode Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Time</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.player_count || 0} atletas)
              </option>
            ))}
          </select>

          {/* View Mode Tabs */}
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <button
              onClick={() => setViewMode('team')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'team'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Visão Geral do Time
              </div>
            </button>
            <button
              onClick={() => setViewMode('player')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'player'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                Atleta Individual
              </div>
            </button>
          </div>
        </div>

        {/* Player Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Atleta</label>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.jersey_number ? `#${player.jersey_number} - ` : ''}{player.name} {player.position ? `(${player.position})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Empty State */}
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nenhuma sessão encontrada para {selectedPlayer?.name}
          </h3>
          <p className="text-slate-600 mb-6">
            Complete sessões de treino avaliando este atleta para gerar relatórios de desempenho.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios dos Atletas</h1>
          <p className="text-slate-600 mt-1">Análise de desempenho e progresso</p>
        </div>
      </div>

      {/* Team Selector and View Mode Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Time</label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
        >
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.player_count || 0} atletas)
            </option>
          ))}
        </select>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-t border-slate-200 pt-4">
          <button
            onClick={() => setViewMode('team')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Visão Geral do Time
            </div>
          </button>
          <button
            onClick={() => setViewMode('player')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'player'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Atleta Individual
            </div>
          </button>
        </div>
      </div>

      {/* Player Selector (only shown in player mode) */}
      {viewMode === 'player' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Atleta</label>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.jersey_number ? `#${player.jersey_number} - ` : ''}{player.name} {player.position ? `(${player.position})` : ''}
              </option>
            ))}
          </select>

          {/* Player View Sub-Tabs */}
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            <button
              onClick={() => setPlayerViewMode('overview')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                playerViewMode === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setPlayerViewMode('evolution')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                playerViewMode === 'evolution'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Evolução
            </button>
          </div>
        </div>
      )}

      {/* Team Overview Mode */}
      {viewMode === 'team' && teamStats.length > 0 && (
        <>
          {/* Team Summary Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {teams.find(t => t.id === selectedTeamId)?.name}
                </h2>
                <p className="text-emerald-100">Desempenho Geral do Time</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {teamStats.length > 0 
                    ? (teamStats.reduce((sum, stat) => sum + stat.average, 0) / teamStats.length).toFixed(1)
                    : '0.0'}
                </div>
                <div className="text-emerald-100">Média Geral</div>
              </div>
            </div>
          </div>

          {/* Team Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Atletas Ativos</h3>
              </div>
              <div className="text-3xl font-bold text-slate-900">{players.length}</div>
              <p className="text-sm text-slate-500 mt-1">Atletas avaliados</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Critérios</h3>
              </div>
              <div className="text-3xl font-bold text-slate-900">{teamStats.length}</div>
              <p className="text-sm text-slate-500 mt-1">Habilidades avaliadas</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Melhor Habilidade</h3>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {teamStats[0]?.valence_name}
              </div>
              <p className="text-sm text-slate-500 mt-1">{teamStats[0]?.average.toFixed(1)}/5.0</p>
            </div>
          </div>

          {/* Team Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Desempenho do Time por Critério</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Critério</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Média do Time</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Avaliações</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Atletas</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map((stat, index) => (
                    <tr key={stat.valence_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{stat.valence_name}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(stat.average / 5) * 100}%` }}
                            />
                          </div>
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            {stat.average.toFixed(1)} / 5.0
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-slate-600">
                        {stat.count}x
                      </td>
                      <td className="text-center py-3 px-4 text-slate-600">
                        {stat.player_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Individual Player Mode - Overview */}
      {viewMode === 'player' && playerViewMode === 'overview' && selectedPlayer && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {getInitials(selectedPlayer.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{selectedPlayer.name}</h2>
              <div className="flex gap-4 mt-2 text-blue-100">
                {selectedPlayer.jersey_number && (
                  <span>#{selectedPlayer.jersey_number}</span>
                )}
                {selectedPlayer.position && (
                  <span>{selectedPlayer.position}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title="Exportar como PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">PDF</span>
                </button>
                <button
                  onClick={handleShareReport}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    shareSuccess 
                      ? 'bg-green-500/30' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                  title="Compartilhar relatório"
                >
                  {shareSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {shareSuccess ? 'Copiado!' : 'Compartilhar'}
                  </span>
                </button>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{sessions.length}</div>
                <div className="text-xs text-blue-100">Sessões</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {viewMode === 'player' && playerViewMode === 'overview' && (
        <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-700">Critérios Avaliados</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{playerStats.length}</div>
          <p className="text-sm text-slate-500 mt-1">Diferentes habilidades</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-700">Média Geral</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {playerStats.length > 0 && playerStats.reduce((sum, stat) => sum + stat.average, 0) > 0
              ? (playerStats.reduce((sum, stat) => sum + stat.average, 0) / playerStats.length).toFixed(1)
              : '0.0'}
          </div>
          <p className="text-sm text-slate-500 mt-1">Pontuação de 0-5</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-700">Melhor Habilidade</h3>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {playerStats.length > 0
              ? playerStats.reduce((max, stat) => stat.average > max.average ? stat : max).valence_name
              : 'N/A'}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {playerStats.length > 0
              ? `${playerStats.reduce((max, stat) => stat.average > max.average ? stat : max).average.toFixed(1)}/5.0`
              : ''}
          </p>
        </div>
      </div>

      {/* Radar Chart */}
      {radarChartData.length > 0 && (
        subscription && TIER_FEATURES[subscription.tier].radarCharts ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Desempenho por Critério</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 5]} />
                <Radar
                  name={selectedPlayer?.name}
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <UpgradePrompt
            feature="Gráficos Radar"
            description="Visualize o desempenho do atleta em todos os critérios de uma vez com gráficos radar interativos e profissionais."
            requiredTier="pro"
            size="medium"
            showPreview={true}
            previewElement={
              <div className="h-64 flex items-center justify-center bg-slate-100">
                <div className="text-6xl text-slate-300">📊</div>
              </div>
            }
          />
        )
      )}

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Estatísticas Detalhadas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Critério</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Média</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Avaliações</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {playerStats
                .sort((a, b) => b.average - a.average)
                .map((stat, index) => (
                  <tr key={stat.valence_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{stat.valence_name}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {stat.average.toFixed(1)} / 5.0
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-600">
                      {stat.count}x
                    </td>
                    <td className="text-center py-3 px-4">
                      {stat.trend > 0.1 ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <TrendingUp className="w-4 h-4" />
                          +{stat.trend.toFixed(1)}
                        </span>
                      ) : stat.trend < -0.1 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <TrendingUp className="w-4 h-4 rotate-180" />
                          {stat.trend.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Histórico de Sessões
        </h3>
        <div className="space-y-3">
          {sessions.map(session => (
            <div 
              key={session.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {new Date(session.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(session.date).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-700">
                  {session.evaluation_count} avaliações
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border-2 border-indigo-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Análise com IA
          </h3>
          <button
            onClick={handleGenerateInsights}
            disabled={loadingInsights || playerStats.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loadingInsights ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm font-medium">Gerando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {aiInsights ? 'Atualizar Análise' : 'Gerar Análise com IA'}
                </span>
              </>
            )}
          </button>
        </div>

        {aiInsights ? (
          <div className="space-y-6">
            {/* Strengths */}
            <div>
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Pontos Fortes
              </h4>
              <ul className="space-y-2">
                {aiInsights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div>
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Pontos a Melhorar
              </h4>
              <ul className="space-y-2">
                {aiInsights.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-orange-600 font-bold mt-0.5">!</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Recomendações de Treino
              </h4>
              <ul className="space-y-2">
                {aiInsights.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-blue-600 font-bold mt-0.5">→</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Overall Assessment */}
            <div className="bg-white/70 rounded-lg p-4 border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-2">Avaliação Geral</h4>
              <p className="text-slate-700 leading-relaxed">{aiInsights.overallAssessment}</p>
            </div>

            <div className="text-xs text-slate-500 text-center pt-2 border-t border-indigo-200">
              Análise gerada por IA • Powered by Google Gemini • Use como orientação para o desenvolvimento do atleta
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">
              Clique no botão acima para gerar uma análise detalhada com IA sobre o desempenho do atleta.
            </p>
            <p className="text-sm text-slate-500">
              A análise incluirá pontos fortes, áreas de melhoria e recomendações personalizadas de treino.
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Individual Player Mode - Evolution */}
      {viewMode === 'player' && playerViewMode === 'evolution' && selectedPlayer && evolutionData.length > 0 && (
        <>
          {/* Evolution Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Evolução de {selectedPlayer.name}</h2>
                <p className="text-purple-100">Acompanhe o progresso ao longo do tempo</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{evolutionData.length}</div>
                <div className="text-purple-100">Sessões</div>
              </div>
            </div>
          </div>

          {/* Valence Selector and Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Selecionar Critério para Visualizar Evolução
              </label>
              <select
                value={selectedValenceForEvolution}
                onChange={(e) => setSelectedValenceForEvolution(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {playerStats.map(stat => (
                  <option key={stat.valence_id} value={stat.valence_id}>
                    {stat.valence_name} (Média: {stat.average.toFixed(1)})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Período
              </label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todas as Sessões</option>
                <option value="last7">Últimos 7 dias</option>
                <option value="last30">Últimos 30 dias</option>
                <option value="last90">Últimos 90 dias</option>
              </select>
            </div>
          </div>

          {/* Evolution Line Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Evolução: {playerStats.find(s => s.valence_id === selectedValenceForEvolution)?.valence_name}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  label={{ value: 'Data da Sessão', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  domain={[0, 5]}
                  label={{ value: 'Pontuação', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value.toFixed(1)} / 5.0`, 'Pontuação']}
                  labelFormatter={(label) => `Sessão: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedValenceForEvolution} 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Evolution Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Melhor Pontuação</h3>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {filteredEvolutionData.length > 0
                  ? Math.max(...filteredEvolutionData
                      .filter(d => d[selectedValenceForEvolution] !== undefined)
                      .map(d => Number(d[selectedValenceForEvolution]) || 0)
                    ).toFixed(1)
                  : '0.0'}
              </div>
              <p className="text-sm text-slate-500 mt-1">Pontuação máxima alcançada</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Média Total</h3>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {filteredEvolutionData.length > 0
                  ? (filteredEvolutionData
                      .filter(d => d[selectedValenceForEvolution] !== undefined)
                      .reduce((sum, d) => sum + (Number(d[selectedValenceForEvolution]) || 0), 0) / 
                      filteredEvolutionData.filter(d => d[selectedValenceForEvolution] !== undefined).length
                    ).toFixed(1)
                  : '0.0'}
              </div>
              <p className="text-sm text-slate-500 mt-1">Média em todas as sessões</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Progresso</h3>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {(() => {
                  const scores = filteredEvolutionData
                    .filter(d => d[selectedValenceForEvolution] !== undefined)
                    .map(d => Number(d[selectedValenceForEvolution]) || 0);
                  if (scores.length < 2) return '0.0';
                  const first = scores[0];
                  const last = scores[scores.length - 1];
                  const diff = last - first;
                  return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
                })()}
              </div>
              <p className="text-sm text-slate-500 mt-1">Primeira vs Última sessão</p>
            </div>
          </div>
        </>
      )}

      {/* Evolution Empty State */}
      {viewMode === 'player' && playerViewMode === 'evolution' && selectedPlayer && evolutionData.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Dados insuficientes para evolução
          </h3>
          <p className="text-slate-600">
            Complete mais sessões avaliando {selectedPlayer.name} para visualizar gráficos de evolução.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
