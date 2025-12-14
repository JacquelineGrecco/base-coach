import { supabase } from '../lib/supabase';

// =====================================================
// Types
// =====================================================

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  trialEndsAt: string | null;
  aiInsightsUsed: number;
  aiInsightsLimit: number;
  aiInsightsResetAt: string | null;
}

export interface TierLimits {
  teams: number;
  playersPerTeam: number;
  aiInsightsPerMonth: number;
  sessionHistoryDays: number;
}

export interface TierFeatures {
  radarCharts: boolean;
  evolutionCharts: boolean;
  aiInsights: boolean;
  pdfExport: boolean;
  csvExport: boolean;
  attendanceTracking: boolean;
  sessionTemplates: boolean;
  customValences: boolean;
  parentPortal: boolean;
  customBranding: boolean | 'logo' | 'full' | 'white-label';
  multiCoach: boolean;
  apiAccess: boolean;
}

// =====================================================
// Configuration
// =====================================================

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    teams: 1,
    playersPerTeam: 15,
    aiInsightsPerMonth: 0,
    sessionHistoryDays: 30,
  },
  pro: {
    teams: 5,
    playersPerTeam: Infinity,
    aiInsightsPerMonth: 5,
    sessionHistoryDays: Infinity,
  },
  premium: {
    teams: Infinity,
    playersPerTeam: Infinity,
    aiInsightsPerMonth: Infinity,
    sessionHistoryDays: Infinity,
  },
  enterprise: {
    teams: Infinity,
    playersPerTeam: Infinity,
    aiInsightsPerMonth: Infinity,
    sessionHistoryDays: Infinity,
  },
};

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    radarCharts: false,
    evolutionCharts: false,
    aiInsights: false,
    pdfExport: false,
    csvExport: false,
    attendanceTracking: false,
    sessionTemplates: false,
    customValences: false,
    parentPortal: false,
    customBranding: false,
    multiCoach: false,
    apiAccess: false,
  },
  pro: {
    radarCharts: true,
    evolutionCharts: true,
    aiInsights: true, // Limited to 5/month
    pdfExport: true,
    csvExport: true,
    attendanceTracking: true,
    sessionTemplates: true,
    customValences: false,
    parentPortal: false,
    customBranding: 'logo', // Logo only
    multiCoach: false,
    apiAccess: false,
  },
  premium: {
    radarCharts: true,
    evolutionCharts: true,
    aiInsights: true, // Unlimited
    pdfExport: true,
    csvExport: true,
    attendanceTracking: true,
    sessionTemplates: true,
    customValences: true,
    parentPortal: true,
    customBranding: 'full', // Full white-label
    multiCoach: true,
    apiAccess: false,
  },
  enterprise: {
    radarCharts: true,
    evolutionCharts: true,
    aiInsights: true,
    pdfExport: true,
    csvExport: true,
    attendanceTracking: true,
    sessionTemplates: true,
    customValences: true,
    parentPortal: true,
    customBranding: 'white-label',
    multiCoach: true,
    apiAccess: true,
  },
};

export const TIER_PRICES = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 49, yearly: 490 }, // Save 17% on yearly
  premium: { monthly: 149, yearly: 1490 }, // Save 17% on yearly
  enterprise: { monthly: 500, yearly: 5000 }, // Custom pricing
};

export const TIER_NAMES = {
  free: 'Gratuito',
  pro: 'Pro',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

// =====================================================
// Subscription Service
// =====================================================

class SubscriptionService {
  /**
   * Get user's current subscription information
   */
  async getUserSubscription(): Promise<SubscriptionInfo | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, trial_ends_at, ai_insights_used, ai_insights_reset_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const tier = (data.subscription_tier || 'free') as SubscriptionTier;
      const aiInsightsLimit = TIER_LIMITS[tier].aiInsightsPerMonth;

      return {
        tier,
        status: (data.subscription_status || 'active') as SubscriptionStatus,
        startDate: data.subscription_start_date,
        endDate: data.subscription_end_date,
        trialEndsAt: data.trial_ends_at,
        aiInsightsUsed: data.ai_insights_used || 0,
        aiInsightsLimit,
        aiInsightsResetAt: data.ai_insights_reset_at,
      };
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  hasFeature(tier: SubscriptionTier, feature: keyof TierFeatures): boolean {
    return !!TIER_FEATURES[tier][feature];
  }

  /**
   * Get limits for a specific tier
   */
  getTierLimits(tier: SubscriptionTier): TierLimits {
    return TIER_LIMITS[tier];
  }

  /**
   * Get features for a specific tier
   */
  getTierFeatures(tier: SubscriptionTier): TierFeatures {
    return TIER_FEATURES[tier];
  }

  /**
   * Check if user can use AI insights (considers quota)
   */
  async canUseAIInsights(): Promise<{ allowed: boolean; used: number; limit: number; message?: string }> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription) {
      return { 
        allowed: false, 
        used: 0, 
        limit: 0,
        message: 'Você precisa estar logado para usar insights de IA.'
      };
    }

    const { tier, status, aiInsightsUsed, aiInsightsLimit } = subscription;
    
    // Check if subscription is active
    if (status !== 'active' && status !== 'trialing') {
      return { 
        allowed: false, 
        used: aiInsightsUsed, 
        limit: aiInsightsLimit,
        message: 'Sua assinatura não está ativa. Renove para continuar usando insights de IA.'
      };
    }

    // Free tier has no AI insights
    if (tier === 'free') {
      return { 
        allowed: false, 
        used: 0, 
        limit: 0,
        message: 'Insights de IA estão disponíveis a partir do plano Pro. Faça upgrade para desbloquear!'
      };
    }

    // Premium and Enterprise have unlimited
    if (tier === 'premium' || tier === 'enterprise') {
      return { 
        allowed: true, 
        used: aiInsightsUsed, 
        limit: Infinity
      };
    }

    // Pro tier - check quota
    if (tier === 'pro') {
      const hasQuota = aiInsightsUsed < aiInsightsLimit;
      return {
        allowed: hasQuota,
        used: aiInsightsUsed,
        limit: aiInsightsLimit,
        message: hasQuota 
          ? undefined 
          : `Você atingiu o limite de ${aiInsightsLimit} insights de IA neste mês. Faça upgrade para o plano Premium para insights ilimitados!`
      };
    }

    return { 
      allowed: false, 
      used: 0, 
      limit: 0 
    };
  }

  /**
   * Increment AI insights usage counter
   */
  async incrementAIInsightsUsage(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('increment_ai_insights_usage', { 
        user_id_param: user.id 
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error incrementing AI insights usage:', error);
      throw error;
    }
  }

  /**
   * Start a 14-day Pro trial
   */
  async startTrial(): Promise<{ success: boolean; message: string; trialEndsAt?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'Você precisa estar logado para iniciar o teste gratuito.' };
      }

      // Check if user already had a trial
      const { data: currentUser } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (currentUser?.subscription_tier === 'pro' || currentUser?.subscription_tier === 'premium' || currentUser?.subscription_tier === 'enterprise') {
        return { success: false, message: 'Você já tem uma assinatura ativa!' };
      }

      if (currentUser?.trial_ends_at) {
        return { success: false, message: 'Você já usou seu teste gratuito.' };
      }

      // Calculate trial end date (14 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // Update user to Pro trial
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: 'pro',
          subscription_status: 'trialing',
          subscription_start_date: new Date().toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Teste gratuito de 14 dias ativado com sucesso!',
        trialEndsAt: trialEndsAt.toISOString()
      };
    } catch (error: any) {
      console.error('Error starting trial:', error);
      return { success: false, message: 'Erro ao iniciar teste gratuito: ' + error.message };
    }
  }

  /**
   * Check team count limit
   */
  async canCreateTeam(): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
    try {
      const subscription = await this.getUserSubscription();
      if (!subscription) {
        return { allowed: false, current: 0, limit: 0, message: 'Você precisa estar logado.' };
      }

      const { tier, status } = subscription;
      
      if (status !== 'active' && status !== 'trialing') {
        return { allowed: false, current: 0, limit: 0, message: 'Sua assinatura não está ativa.' };
      }

      const limits = this.getTierLimits(tier);
      
      // Count current active teams
      const { data: { user } } = await supabase.auth.getUser();
      const { count } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user!.id)
        .eq('is_active', true)
        .is('archived_at', null);

      const currentTeams = count || 0;
      const canCreate = currentTeams < limits.teams;

      return {
        allowed: canCreate,
        current: currentTeams,
        limit: limits.teams,
        message: canCreate 
          ? undefined 
          : `Você atingiu o limite de ${limits.teams} time(s) do plano ${TIER_NAMES[tier]}. Faça upgrade para adicionar mais times!`
      };
    } catch (error: any) {
      console.error('Error checking team limit:', error);
      return { allowed: false, current: 0, limit: 0, message: 'Erro ao verificar limite de times.' };
    }
  }

  /**
   * Check player count limit for a team
   */
  async canAddPlayer(teamId: string): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
    try {
      const subscription = await this.getUserSubscription();
      if (!subscription) {
        return { allowed: false, current: 0, limit: 0, message: 'Você precisa estar logado.' };
      }

      const { tier, status } = subscription;
      
      if (status !== 'active' && status !== 'trialing') {
        return { allowed: false, current: 0, limit: 0, message: 'Sua assinatura não está ativa.' };
      }

      const limits = this.getTierLimits(tier);
      
      // Count current active players in team
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('archived_at', null);

      const currentPlayers = count || 0;
      const canAdd = currentPlayers < limits.playersPerTeam;

      return {
        allowed: canAdd,
        current: currentPlayers,
        limit: limits.playersPerTeam,
        message: canAdd 
          ? undefined 
          : `Você atingiu o limite de ${limits.playersPerTeam} atletas por time do plano ${TIER_NAMES[tier]}. Faça upgrade para adicionar mais atletas!`
      };
    } catch (error: any) {
      console.error('Error checking player limit:', error);
      return { allowed: false, current: 0, limit: 0, message: 'Erro ao verificar limite de atletas.' };
    }
  }

  /**
   * Get subscription tier display name
   */
  getTierName(tier: SubscriptionTier): string {
    return TIER_NAMES[tier];
  }

  /**
   * Get subscription tier price
   */
  getTierPrice(tier: SubscriptionTier, interval: 'monthly' | 'yearly' = 'monthly'): number {
    return TIER_PRICES[tier][interval];
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(status: SubscriptionStatus): boolean {
    return status === 'active' || status === 'trialing';
  }

  /**
   * Get days remaining in trial
   */
  getTrialDaysRemaining(trialEndsAt: string | null): number {
    if (!trialEndsAt) return 0;
    
    const endDate = new Date(trialEndsAt);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Format tier for display with features
   */
  formatTierDescription(tier: SubscriptionTier): string {
    const features = this.getTierFeatures(tier);
    const limits = this.getTierLimits(tier);
    
    const teamLimit = limits.teams === Infinity ? 'Ilimitados' : `${limits.teams}`;
    const playerLimit = limits.playersPerTeam === Infinity ? 'Ilimitados' : `${limits.playersPerTeam} por time`;
    
    return `${teamLimit} times • ${playerLimit} atletas`;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();

// Export service class for testing
export { SubscriptionService };

