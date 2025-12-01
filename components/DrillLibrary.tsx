import React, { useState } from 'react';
import { MOCK_DRILLS } from '../constants';
import { Drill } from '../types';
import { generateDrillSuggestions } from '../services/geminiService';
import { Search, Sparkles, Loader2, Filter, Play } from 'lucide-react';

const DrillLibrary: React.FC = () => {
  const [drills, setDrills] = useState<Drill[]>(MOCK_DRILLS);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Intermediate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const newDrills = await generateDrillSuggestions(aiPrompt, aiDifficulty);
      setDrills(prev => [...newDrills, ...prev]); // Add new drills to top
      setShowAiModal(false);
      setAiPrompt("");
    } catch (error) {
      console.error("Failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Drill Library</h2>
            <p className="text-slate-500">Manage and discover training activities</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
            </button>
            <button 
                onClick={() => setShowAiModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
            >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Coach Assistant
            </button>
        </div>
      </div>

      {/* Drill Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drills.map(drill => (
            <div key={drill.id} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col h-full transition hover:shadow-md ${drill.isAiGenerated ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        drill.difficulty === 'Advanced' ? 'bg-red-100 text-red-800' :
                        drill.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        {drill.difficulty}
                    </span>
                    {drill.isAiGenerated && (
                        <span className="flex items-center text-xs text-indigo-600 font-semibold">
                            <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                        </span>
                    )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{drill.title}</h3>
                <p className="text-slate-600 text-sm mb-4 flex-grow">{drill.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {drill.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">{drill.durationMin} mins</span>
                    <button className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-600">
                        <Play className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center">
                        <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
                        Generate Drills with AI
                    </h3>
                    <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">What does your team need to improve?</label>
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g., Defensive coordination against flying goalkeeper..."
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32 resize-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Level</label>
                        <select 
                            value={aiDifficulty}
                            onChange={(e) => setAiDifficulty(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={!aiPrompt || isGenerating}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center mt-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Designing drills...
                            </>
                        ) : (
                            "Generate Drills"
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DrillLibrary;
