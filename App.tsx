import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/Auth/AuthPage';
import { ResetPassword } from './components/Auth/ResetPassword';
import { EmailVerificationRequired } from './components/EmailVerificationRequired';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SessionSetup from './components/SessionSetup';
import ActiveSession from './components/ActiveSession';
import DrillLibrary from './components/DrillLibrary';
import Reports from './components/Reports';
import Profile from './components/Profile';
import TeamsContainer from './components/Teams/TeamsContainer';
import { MOCK_TEAMS } from './constants';
import { ViewState, Evaluation } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>("DASHBOARD");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Check if we're in password recovery mode
  React.useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
  }, []);
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
        return <Dashboard 
          onStartSession={handleStartSessionSetup} 
          onNavigateToTeams={() => setCurrentView("TEAMS")}
        />;
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
      case "PROFILE":
        return <Profile />;
      case "TEAMS":
        return <TeamsContainer />;
      default:
        return <Dashboard teams={MOCK_TEAMS} onStartSession={handleStartSessionSetup} />;
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show reset password page if in recovery mode (even if logged in)
  if (isRecoveryMode && user) {
    return (
      <ResetPassword
        onSuccess={() => {
          setIsRecoveryMode(false);
          // Clear the hash from URL
          window.location.hash = '';
          window.location.reload();
        }}
      />
    );
  }

  // Show auth page if user is not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Check if email is verified
  // @ts-ignore - email_confirmed_at exists on user object
  const emailConfirmed = user.email_confirmed_at || user.confirmed_at;
  
  if (!emailConfirmed) {
    return <EmailVerificationRequired email={user.email || ''} />;
  }

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
}

// Wrap the app with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
