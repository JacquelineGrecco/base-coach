import React from 'react';
import { BarChart, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface ReportsProps {
  evaluations: any[];
}

const Reports: React.FC<ReportsProps> = ({ evaluations }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <BarChart className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Relatórios dos Atletas</h1>
          <p className="text-slate-600">
            Análise de desempenho e progresso dos atletas
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Relatórios Detalhados em Desenvolvimento
              </h3>
              <p className="text-slate-700 leading-relaxed">
                O sistema de relatórios está sendo atualizado para trabalhar com as sessões salvas no banco de dados.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Próximas Funcionalidades:
            </h4>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Gráficos de evolução individual por critério</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Comparação de desempenho entre sessões</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Relatórios com IA (análise personalizada)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Exportar relatórios em PDF</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Compartilhar com pais e responsáveis</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Preview */}
        {evaluations.length > 0 && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-slate-600" />
              <h4 className="font-semibold text-slate-900">Sessão Atual</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{evaluations.length}</div>
                <div className="text-sm text-slate-600">Avaliações</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(evaluations.map(e => e.playerId)).size}
                </div>
                <div className="text-sm text-slate-600">Atletas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {evaluations.length > 0 ? Object.keys(evaluations[0].scores).length : 0}
                </div>
                <div className="text-sm text-slate-600">Critérios</div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💡 Dica:</strong> Continue realizando sessões de treino para acumular dados. 
            O sistema de relatórios detalhados será ativado automaticamente quando houver dados históricos suficientes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
