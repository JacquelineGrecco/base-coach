'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AuthPage } from '@/features/auth/components/AuthPage';
import { ResetPassword } from '@/features/auth/components/ResetPassword';
import { EmailVerificationRequired } from '@/features/auth/components/EmailVerificationRequired';
import Layout from '@/components/ui/Layout';
import Dashboard from '@/components/ui/Dashboard';
import SessionSetup from '@/features/match/components/SessionSetup';
import ActiveSession from '@/features/match/components/ActiveSession';
import DrillLibrary from '@/features/ai/components/DrillLibrary';
import Reports from '@/features/ai/components/Reports';
import Profile from '@/components/ui/Profile';
import TeamsContainer from '@/features/roster/components/TeamsContainer';
import { Pricing } from '@/components/ui/Pricing';
import { TrialModal } from '@/components/ui/TrialModal';
import { TrialExpirationModal } from '@/components/ui/TrialExpirationModal';
import { ViewState, Evaluation } from '@/types';
import { sessionService } from '@/features/match/services/sessionService';
import { subscriptionService, SubscriptionInfo } from '@/features/auth/services/subscriptionService';
import { supabase } from '@/lib/supabase';

export default function Home() {
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
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
  }, []);

  // Load subscription and check for trial expiration warnings
  useEffect(() => {
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
      await loadSubscriptionAndCheckTrial();
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
        const attendanceRecords = allPlayers.map((player: { id: string }) => ({
          session_id: session.id,
          player_id: player.id,
          is_present: sessionData.presentPlayerIds.includes(player.id),
          arrival_time: sessionData.presentPlayerIds.includes(player.id) ? new Date().toISOString() : null,
        }));
        
        const { error: attendanceError } = await supabase
          .from('session_attendance')
          .insert(attendanceRecords as any);
        
        if (attendanceError) {
          console.error('Error saving attendance:', attendanceError);
        }
      }

      const evaluationsToSave = newEvaluations.flatMap(evaluation => 
        Object.entries(evaluation.scores).map(([valenceId, score]) => ({
          player_id: evaluation.playerId,
          valence_id: valenceId,
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

      setSessionEvaluations(prev => [...prev, ...newEvaluations]);
      
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

  if (isRecoveryMode && user) {
    return (
      <ResetPassword
        onSuccess={() => {
          setIsRecoveryMode(false);
          window.location.hash = '';
          window.location.reload();
        }}
      />
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // @ts-ignore - email_confirmed_at exists on user object
  const emailConfirmed = user.email_confirmed_at || user.confirmed_at;
  
  if (!emailConfirmed) {
    return <EmailVerificationRequired email={user.email || ''} />;
  }

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
      
      <TrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onStartTrial={handleStartTrial}
      />
      
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

