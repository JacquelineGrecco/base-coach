import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SessionSetup from './components/SessionSetup';
import ActiveSession from './components/ActiveSession';
import DrillLibrary from './components/DrillLibrary';
import Reports from './components/Reports';
import { MOCK_TEAMS } from './constants';
import { ViewState, Evaluation } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("DASHBOARD");
  // In a real app, this would be in a context or global state
  const [activeTeam] = useState(MOCK_TEAMS[0]);
  const [sessionEvaluations, setSessionEvaluations] = useState<Evaluation[]>([]);
  const [selectedValenceIds, setSelectedValenceIds] = useState<string[]>([]);

  const handleStartSessionSetup = () => {
    setCurrentView("SESSION_SETUP");
  };

  const handleStartSession = (valenceIds: string[]) => {
    setSelectedValenceIds(valenceIds);
    setCurrentView("ACTIVE_SESSION");
  };

  const handleEndSession = (newEvaluations: Evaluation[]) => {
    // In a real app, this would POST to an API
    console.log("Saving evaluations:", newEvaluations);
    setSessionEvaluations(prev => [...prev, ...newEvaluations]);
    setCurrentView("DASHBOARD");
  };

  const renderView = () => {
    switch (currentView) {
      case "DASHBOARD":
        return <Dashboard teams={MOCK_TEAMS} onStartSession={handleStartSessionSetup} />;
      case "SESSION_SETUP":
        return (
          <SessionSetup 
            team={activeTeam}
            onStartSession={handleStartSession}
            onCancel={() => setCurrentView("DASHBOARD")}
          />
        );
      case "ACTIVE_SESSION":
        // We override Layout for active session to maximize screen space and focus
        return (
             <ActiveSession 
                team={activeTeam}
                selectedValenceIds={selectedValenceIds}
                onEndSession={handleEndSession} 
                onCancel={() => setCurrentView("DASHBOARD")} 
             />
        );
      case "DRILLS":
        return <DrillLibrary />;
      case "REPORTS":
        return <Reports team={activeTeam} evaluations={sessionEvaluations} />;
      default:
        return <Dashboard teams={MOCK_TEAMS} onStartSession={handleStartSessionSetup} />;
    }
  };

  // If in active session, don't show standard layout (sidebar)
  if (currentView === "ACTIVE_SESSION") {
      return (
          <div className="h-screen bg-gray-50 overflow-hidden font-sans">
              {renderView()}
          </div>
      );
  }

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
