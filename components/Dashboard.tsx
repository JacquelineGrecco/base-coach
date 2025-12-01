import React from 'react';
import { Team } from '../types';
import { Users, Activity, Calendar, ArrowRight } from 'lucide-react';

interface DashboardProps {
  teams: Team[];
  onStartSession: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ teams, onStartSession }) => {
  const activeTeam = teams[0]; // Simplification for MVP

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Coach Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back, Coach. Ready for today's session?</p>
            </div>
            <button 
                onClick={onStartSession}
                className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center font-semibold"
            >
                Start New Session
                <ArrowRight className="w-5 h-5 ml-2" />
            </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Total Players</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{activeTeam.players.length}</div>
                <div className="text-sm text-slate-500 mt-1">{activeTeam.name}</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                        <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Weekly Load</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">High</div>
                <div className="text-sm text-green-600 mt-1">+12% vs last week</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Next Match</span>
                </div>
                <div className="text-xl font-bold text-slate-900">Sat, 14:00</div>
                <div className="text-sm text-slate-500 mt-1">vs. City rivals</div>
            </div>
        </div>

        {/* Recent Activity / Team List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Active Roster - {activeTeam.name}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3 font-medium">Player</th>
                            <th className="px-6 py-3 font-medium">Position</th>
                            <th className="px-6 py-3 font-medium">Category</th>
                            <th className="px-6 py-3 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activeTeam.players.map(player => (
                            <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <img src={player.photoUrl} alt="" className="w-8 h-8 rounded-full mr-3 object-cover" />
                                        <span className="font-medium text-slate-900">{player.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-sm">{player.position}</td>
                                <td className="px-6 py-4 text-slate-600 text-sm">{player.category}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Available
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
