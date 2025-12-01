import React, { useState } from 'react';
import { VALENCES } from '../constants';
import { Team } from '../types';
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SessionSetupProps {
  team: Team;
  onStartSession: (selectedValenceIds: string[]) => void;
  onCancel: () => void;
}

const SessionSetup: React.FC<SessionSetupProps> = ({ team, onStartSession, onCancel }) => {
  const [selectedValences, setSelectedValences] = useState<string[]>([]);

  const toggleValence = (valenceId: string) => {
    if (selectedValences.includes(valenceId)) {
      setSelectedValences(selectedValences.filter(id => id !== valenceId));
    } else {
      if (selectedValences.length < 3) {
        setSelectedValences([...selectedValences, valenceId]);
      }
    }
  };

  const handleStart = () => {
    if (selectedValences.length === 0) return;
    onStartSession(selectedValences);
  };

  // Group valences by category
  const valencesByCategory = VALENCES.reduce((acc, valence) => {
    if (!acc[valence.category]) {
      acc[valence.category] = [];
    }
    acc[valence.category].push(valence);
    return acc;
  }, {} as Record<string, typeof VALENCES>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Configure Training Session</h2>
          <p className="text-blue-100">Select up to 3 criteria to evaluate during this session</p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {team.name}
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {team.players.length} athletes
            </div>
          </div>
        </div>

        {/* Selection Counter */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedValences.length === 3 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              )}
              <span className="font-semibold text-slate-900">
                {selectedValences.length} of 3 criteria selected
              </span>
            </div>
            <span className="text-sm text-slate-600">
              {selectedValences.length === 0 && "Select at least 1 criterion"}
              {selectedValences.length > 0 && selectedValences.length < 3 && "Add more criteria or start"}
              {selectedValences.length === 3 && "Maximum reached - ready to start!"}
            </span>
          </div>
        </div>

        {/* Valence Selection Grid */}
        <div className="p-6 space-y-6">
          {Object.entries(valencesByCategory).map(([category, valences]) => (
            <div key={category}>
              <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 flex items-center ${
                category === 'Technical' ? 'text-blue-700' :
                category === 'Physical' ? 'text-red-700' :
                category === 'Tactical' ? 'text-purple-700' :
                'text-yellow-700'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  category === 'Technical' ? 'bg-blue-500' :
                  category === 'Physical' ? 'bg-red-500' :
                  category === 'Tactical' ? 'bg-purple-500' :
                  'bg-yellow-500'
                }`}></span>
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {valences.map((valence) => {
                  const isSelected = selectedValences.includes(valence.id);
                  const isDisabled = !isSelected && selectedValences.length >= 3;
                  
                  return (
                    <button
                      key={valence.id}
                      onClick={() => toggleValence(valence.id)}
                      disabled={isDisabled}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all transform
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' 
                          : isDisabled
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01]'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{valence.name}</div>
                          <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                            category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                            category === 'Physical' ? 'bg-red-100 text-red-700' :
                            category === 'Tactical' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {category}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={selectedValences.length === 0}
            className={`
              px-8 py-2.5 rounded-lg font-semibold flex items-center transition-all
              ${selectedValences.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:scale-105'
              }
            `}
          >
            Start Session
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Helper Text */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-slate-600 text-center">
            💡 <strong>Tip:</strong> Selecting fewer criteria (1-3) allows faster evaluation during training. 
            You can focus on different criteria in each session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;

