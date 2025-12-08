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
import { ViewState, Evaluation } from './types';
import { sessionService } from './services/sessionService';

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
  // Session state
  const [sessionEvaluations, setSessionEvaluations] = useState<Evaluation[]>([]);
  const [sessionData, setSessionData] = useState<{
    teamId: string;
    categoryId: string | null;
    selectedValenceIds: string[];
  } | null>(null);

  const handleStartSessionSetup = () => {
    setCurrentView("SESSION_SETUP");
  };

  const handleStartSession = (data: {
    teamId: string;
    categoryId: string | null;
    selectedValenceIds: string[];
  }) => {
    setSessionData(data);
    setCurrentView("ACTIVE_SESSION");
  };

  const handleEndSession = async (newEvaluations: Evaluation[]) => {
    if (!sessionData) return;

    try {
      // Create session record
      const { session, error: sessionError } = await sessionService.createSession({
        team_id: sessionData.teamId,
        category_id: sessionData.categoryId,
        date: new Date().toISOString(),
        selected_valences: sessionData.selectedValenceIds,
      });

      if (sessionError || !session) {
        alert('Erro ao salvar sessão: ' + sessionError?.message);
        return;
      }

      // Transform and save evaluations
      const evaluationsToSave = newEvaluations.flatMap(evaluation => 
        Object.entries(evaluation.scores).map(([valenceId, score]) => ({
          player_id: evaluation.playerId,
          valence_id: valenceId, // Using valence_id (as per migration 019)
          score: score,
        }))
      );

      if (evaluationsToSave.length > 0) {
        const { error: evalError } = await sessionService.saveEvaluations(
          session.id,
          evaluationsToSave
        );

        if (evalError) {
          alert('Erro ao salvar avaliações: ' + evalError.message);
          return;
        }
      }

      // Save to local state for Reports view
      setSessionEvaluations(prev => [...prev, ...newEvaluations]);
      
      // Show success and redirect
      alert('✅ Sessão salva com sucesso! ' + evaluationsToSave.length + ' avaliações registradas.');
      setCurrentView("DASHBOARD");
    } catch (error: any) {
      console.error('Error saving session:', error);
      alert('Erro inesperado ao salvar sessão: ' + error.message);
    }
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
            onStartSession={handleStartSession}
            onCancel={() => setCurrentView("DASHBOARD")}
          />
        );
      case "ACTIVE_SESSION":
        // We override Layout for active session to maximize screen space and focus
        if (!sessionData) {
          setCurrentView("DASHBOARD");
          return null;
        }
        return (
             <ActiveSession 
                teamId={sessionData.teamId}
                categoryId={sessionData.categoryId}
                selectedValenceIds={sessionData.selectedValenceIds}
                onEndSession={handleEndSession} 
                onCancel={() => setCurrentView("DASHBOARD")} 
             />
        );
      case "DRILLS":
        return <DrillLibrary />;
      case "REPORTS":
        return <Reports evaluations={sessionEvaluations} />;
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
