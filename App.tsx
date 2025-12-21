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
import { Pricing } from './components/Pricing';
import { TrialModal } from './components/TrialModal';
import { TrialExpirationModal } from './components/TrialExpirationModal';
import { ViewState, Evaluation } from './types';
import { sessionService } from './services/sessionService';
import { subscriptionService, SubscriptionInfo } from './services/subscriptionService';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>("DASHBOARD");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [preselectedTeamId, setPreselectedTeamId] = useState<string | null>(null);
  const [preselectedPlayerId, setPreselectedPlayerId] = useState<string | null>(null);
  const [fromSessionDetails, setFromSessionDetails] = useState(false);
  
  // Trial modal state
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showTrialExpirationModal, setShowTrialExpirationModal] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  // Check if we're in password recovery mode
  React.useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
  }, []);

  // Load subscription and check for trial expiration warnings
  React.useEffect(() => {
    if (user) {
      loadSubscriptionAndCheckTrial();
    }
  }, [user]);

  async function loadSubscriptionAndCheckTrial() {
    const data = await subscriptionService.getUserSubscription();
    if (!data) {
      console.error('Error loading subscription');
      return;
    }
    setSubscription(data);

    // Check if trial is expiring soon
    if (data.trialEndsAt) {
      const daysLeft = await subscriptionService.getTrialDaysRemaining();
      
      // Show modal at 7, 3, and 0 days
      const lastWarning = localStorage.getItem('lastTrialWarning');
      const today = new Date().toDateString();
      
      if (daysLeft !== null && (daysLeft === 7 || daysLeft === 3 || daysLeft === 0) && lastWarning !== today) {
        setShowTrialExpirationModal(true);
        localStorage.setItem('lastTrialWarning', today);
      }
    }
  }

  const handleStartTrial = async () => {
    if (!user?.id) return;
    try {
      await subscriptionService.startTrial();
      alert('✨ Teste Pro iniciado com sucesso! Você tem 14 dias para explorar todos os recursos.');
      await loadSubscriptionAndCheckTrial(); // Reload subscription
    } catch (error: any) {
      alert('Erro ao iniciar teste: ' + error.message);
    }
  };
  // Session state
  const [sessionEvaluations, setSessionEvaluations] = useState<Evaluation[]>([]);
  const [sessionData, setSessionData] = useState<{
    teamId: string;
    categoryId: string | null;
    selectedValenceIds: string[];
    presentPlayerIds: string[];
  } | null>(null);

  const handleStartSessionSetup = () => {
    setCurrentView("SESSION_SETUP");
  };

  const handleStartSession = (data: {
    teamId: string;
    categoryId: string | null;
    selectedValenceIds: string[];
    presentPlayerIds: string[];
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

      // Save attendance for all players (present + absent)
      // Get all players from the team/category to mark absent ones
      let allPlayersQuery = supabase
        .from('players')
        .select('id')
        .eq('team_id', sessionData.teamId)
        .eq('is_active', true);
      
      if (sessionData.categoryId) {
        allPlayersQuery = allPlayersQuery.eq('category_id', sessionData.categoryId);
      }
      
      const { data: allPlayers } = await allPlayersQuery;
      
      if (allPlayers) {
        const attendanceRecords = allPlayers.map(player => ({
          session_id: session.id,
          player_id: player.id,
          is_present: sessionData.presentPlayerIds.includes(player.id),
          arrival_time: sessionData.presentPlayerIds.includes(player.id) ? new Date().toISOString() : null,
        }));
        
        const { error: attendanceError } = await supabase
          .from('session_attendance')
          .insert(attendanceRecords);
        
        if (attendanceError) {
          console.error('Error saving attendance:', attendanceError);
          // Don't fail the whole session save, just log it
        }
      }

      // Transform and save evaluations
      const evaluationsToSave = newEvaluations.flatMap(evaluation => 
        Object.entries(evaluation.scores).map(([valenceId, score]) => ({
          player_id: evaluation.playerId,
          valence_id: valenceId, // Using valence_id (as per migration 019)
          score: Number(score),
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
      const presentCount = sessionData.presentPlayerIds.length;
      const totalCount = allPlayers?.length || presentCount;
      alert(`✅ Sessão salva com sucesso!\n\n` +
            `📊 ${evaluationsToSave.length} avaliações registradas\n` +
            `✓ ${presentCount}/${totalCount} atletas presentes`);
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
          onNavigateToReports={(teamId?: string, playerId?: string) => {
            if (teamId) {
              setPreselectedTeamId(teamId);
              setFromSessionDetails(true);
            }
            if (playerId) {
              setPreselectedPlayerId(playerId);
            }
            setCurrentView("REPORTS");
          }}
        />;
      case "SESSION_SETUP":
        return (
          <SessionSetup 
            onStartSession={handleStartSession}
            onCancel={() => setCurrentView("DASHBOARD")}
            onNavigateToTeams={() => setCurrentView("TEAMS")}
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
                presentPlayerIds={sessionData.presentPlayerIds}
                onEndSession={handleEndSession} 
                onCancel={() => setCurrentView("DASHBOARD")} 
            />
        );
      case "DRILLS":
        return <DrillLibrary />;
      case "REPORTS":
        return <Reports 
          evaluations={sessionEvaluations}
          preselectedTeamId={preselectedTeamId}
          preselectedPlayerId={preselectedPlayerId}
          fromSessionDetails={fromSessionDetails}
          onTeamChange={() => {
            setPreselectedTeamId(null);
            setPreselectedPlayerId(null);
            setFromSessionDetails(false);
          }}
        />;
      case "PROFILE":
        return <Profile />;
      case "PRICING":
        return <Pricing 
          onStartTrial={() => {
            setShowTrialModal(true);
          }}
          onUpgrade={async (tier: string) => {
            if (!user?.id) return;
            await subscriptionService.updateSubscriptionTier(user.id, tier as any);
            alert(`Plano alterado para ${tier} com sucesso!`);
            await loadSubscriptionAndCheckTrial();
            setCurrentView("DASHBOARD");
          }}
        />;
      case "TEAMS":
        return <TeamsContainer onUpgradeClick={() => setCurrentView("PRICING")} />;
      default:
        return <Dashboard 
          onStartSession={handleStartSessionSetup}
          onNavigateToTeams={() => setCurrentView("TEAMS")}
          onNavigateToReports={(teamId?: string, playerId?: string) => {
            if (teamId) {
              setPreselectedTeamId(teamId);
              setFromSessionDetails(true);
            }
            if (playerId) {
              setPreselectedPlayerId(playerId);
            }
            setCurrentView("REPORTS");
          }}
        />;
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
      
      {/* Trial Modal */}
      <TrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onStartTrial={handleStartTrial}
      />
      
      {/* Trial Expiration Modal */}
      {subscription?.trialEndsAt && (
        <TrialExpirationModal
          isOpen={showTrialExpirationModal}
          daysRemaining={(() => {
            const now = new Date();
            const trialEnd = new Date(subscription.trialEndsAt);
            const diffTime = trialEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(0, diffDays);
          })()}
          onClose={() => setShowTrialExpirationModal(false)}
          onViewPricing={() => {
            setShowTrialExpirationModal(false);
            setCurrentView("PRICING");
          }}
        />
      )}
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
