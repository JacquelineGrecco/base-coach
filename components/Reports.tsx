import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Player, Team, Evaluation, PlayerReport } from '../types';
import { VALENCES } from '../constants';
import { analyzePlayerStats } from '../services/geminiService';
import { generatePlayerReport, formatReportForExport, generateStatsSummary } from '../services/reportService';
import { Brain, Loader2, Download, Share2, FileText, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

interface ReportsProps {
  team: Team;
  evaluations: Evaluation[];
}

const Reports: React.FC<ReportsProps> = ({ team, evaluations }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(team.players[0]?.id || "");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showPremiumReport, setShowPremiumReport] = useState(false);

  const selectedPlayer = team.players.find(p => p.id === selectedPlayerId);

  // Generate player report
  const playerReport = useMemo(() => {
    if (!selectedPlayer) return null;
    return generatePlayerReport(
      selectedPlayerId,
      selectedPlayer.name,
      evaluations,
      'current-session',
      showPremiumReport
    );
  }, [selectedPlayer, selectedPlayerId, evaluations, showPremiumReport]);
  
  // Aggregate scores for the selected player
  const playerStats = React.useMemo(() => {
    if (!selectedPlayer) return [];

    const playerEvals = evaluations.filter(e => e.playerId === selectedPlayerId);
    if (playerEvals.length === 0) return VALENCES.map(v => ({ subject: v.name, A: 0, fullMark: 5 }));

    // Calculate average per valence
    const stats = VALENCES.map(valence => {
        const scores = playerEvals.map(e => e.scores[valence.id] || 0);
        const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
        return {
            subject: valence.name,
            A: Number(avg.toFixed(1)),
            fullMark: 5
        };
    });
    return stats;
  }, [selectedPlayer, evaluations, selectedPlayerId]);

  const handleAiAnalyze = async () => {
    if (!selectedPlayer) return;
    setAnalyzing(true);
    
    const statsStr = generateStatsSummary(evaluations, selectedPlayerId);
    const result = await analyzePlayerStats(selectedPlayer.name, statsStr);
    
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const handleExportReport = () => {
    if (!playerReport || !selectedPlayer) return;
    
    const reportText = formatReportForExport(playerReport, selectedPlayer.name, team.name);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${selectedPlayer.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareReport = async () => {
    if (!playerReport || !selectedPlayer) return;
    
    const reportText = formatReportForExport(playerReport, selectedPlayer.name, team.name);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Relatório - ${selectedPlayer.name}`,
          text: reportText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(reportText);
      alert('Relatório copiado para a área de transferência!');
    }
  };

  const handleUnlockPremium = () => {
    // In real app, this would trigger payment flow
    // For demo, just toggle the premium view
    setShowPremiumReport(true);
  };

  if (!selectedPlayer) return <div className="p-6">No players found in this team.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Performance Reports</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Selector */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4">Select Player</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {team.players.map(player => (
                        <button
                            key={player.id}
                            onClick={() => {
                                setSelectedPlayerId(player.id);
                                setAiAnalysis(null);
                            }}
                            className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                                selectedPlayerId === player.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                        >
                            <img src={player.photoUrl} alt="" className="w-10 h-10 rounded-full mr-3 object-cover" />
                            <div className="text-left">
                                <p className={`font-medium ${selectedPlayerId === player.id ? 'text-blue-800' : 'text-slate-700'}`}>{player.name}</p>
                                <p className="text-xs text-slate-500">{player.position}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div className="lg:col-span-2 space-y-6">
                {/* Player Report Card */}
                {playerReport && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border-2 border-blue-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h4 className="text-lg font-bold text-slate-900">Relatório Individual</h4>
                                {playerReport.isPremium && (
                                    <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                                        PREMIUM ⭐
                                    </span>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleShareReport}
                                    className="p-2 bg-white hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Compartilhar"
                                >
                                    <Share2 className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                    onClick={handleExportReport}
                                    className="p-2 bg-white hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Baixar relatório"
                                >
                                    <Download className="w-4 h-4 text-blue-600" />
                                </button>
                            </div>
                        </div>
                        
                        <p className="text-slate-700 leading-relaxed mb-4 text-sm">
                            {playerReport.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h5 className="font-semibold text-green-700 mb-2 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" /> Pontos Fortes
                                </h5>
                                {playerReport.strengths.length > 0 ? (
                                    <ul className="space-y-1">
                                        {playerReport.strengths.map((s, i) => (
                                            <li key={i} className="text-slate-600">✓ {s}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 text-xs italic">Em desenvolvimento</p>
                                )}
                            </div>
                            <div>
                                <h5 className="font-semibold text-orange-700 mb-2 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-1" /> Áreas para Melhoria
                                </h5>
                                {playerReport.weaknesses.length > 0 ? (
                                    <ul className="space-y-1">
                                        {playerReport.weaknesses.map((w, i) => (
                                            <li key={i} className="text-slate-600">• {w}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 text-xs italic">Manter desempenho</p>
                                )}
                            </div>
                        </div>

                        {!showPremiumReport && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <button
                                    onClick={handleUnlockPremium}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all flex items-center justify-center"
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Desbloquear Relatórios Premium para Venda
                                </button>
                                <p className="text-xs text-slate-600 text-center mt-2">
                                    Gere relatórios profissionais para vender aos pais dos atletas
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {!playerReport && evaluations.length === 0 && (
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-center">
                        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-900 mb-2">Nenhuma avaliação registrada</h4>
                        <p className="text-sm text-slate-600">
                            Inicie uma sessão de treino para começar a avaliar os atletas.
                        </p>
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{selectedPlayer.name}</h3>
                            <p className="text-slate-500 text-sm">{selectedPlayer.position} • {selectedPlayer.category}</p>
                        </div>
                        <button 
                            onClick={handleAiAnalyze}
                            disabled={analyzing || evaluations.length === 0}
                            className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Brain className="w-4 h-4 mr-2" />}
                            Análise com IA
                        </button>
                    </div>

                    {/* AI Analysis Box */}
                    {aiAnalysis && (
                        <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-fade-in">
                            <h4 className="text-sm font-bold text-indigo-800 mb-1 flex items-center">
                                <Brain className="w-3 h-3 mr-1" /> Feedback do Treinador IA
                            </h4>
                            <p className="text-sm text-indigo-700 leading-relaxed">{aiAnalysis}</p>
                        </div>
                    )}

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={playerStats}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} stroke="#cbd5e1" />
                                <Radar
                                    name={selectedPlayer.name}
                                    dataKey="A"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    fill="#3b82f6"
                                    fillOpacity={0.5}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Reports;