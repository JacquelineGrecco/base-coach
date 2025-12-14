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
  sessionHistoryDays: number | 'unlimited';
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
// Constants
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
    sessionHistoryDays: 'unlimited',
  },
  premium: {
    teams: Infinity,
    playersPerTeam: Infinity,
    aiInsightsPerMonth: Infinity,
    sessionHistoryDays: 'unlimited',
  },
  enterprise: {
    teams: Infinity,
    playersPerTeam: Infinity,
    aiInsightsPerMonth: Infinity,
    sessionHistoryDays: 'unlimited',
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

export const TIER_INFO = {
  free: {
    name: 'Gratuito',
    displayName: 'Free',
    price: 'R$0',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Para testar e conhecer a plataforma',
    color: 'gray',
  },
  pro: {
    name: 'Profissional',
    displayName: 'Pro',
    price: 'R$49',
    priceMonthly: 49,
    priceYearly: 490, // Save 17%
    description: 'Para treinadores sérios',
    color: 'blue',
    popular: true,
  },
  premium: {
    name: 'Premium',
    displayName: 'Premium',
    price: 'R$149',
    priceMonthly: 149,
    priceYearly: 1490, // Save 17%
    description: 'Para academias e múltiplos times',
    color: 'purple',
  },
  enterprise: {
    name: 'Empresarial',
    displayName: 'Enterprise',
    price: 'Sob consulta',
    priceMonthly: null,
    priceYearly: null,
    description: 'Para clubes e organizações',
    color: 'slate',
  },
};

// =====================================================
// Subscription Service Class
// =====================================================

class SubscriptionService {
  /**
   * Get current user's subscription information
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

      const tier = (data.subscription_tier as SubscriptionTier) || 'free';
      const aiInsightsLimit = TIER_LIMITS[tier].aiInsightsPerMonth;

      return {
        tier,
        status: (data.subscription_status as SubscriptionStatus) || 'active',
        startDate: data.subscription_start_date,
        endDate: data.subscription_end_date,
        trialEndsAt: data.trial_ends_at,
        aiInsightsUsed: data.ai_insights_used || 0,
        aiInsightsLimit: typeof aiInsightsLimit === 'number' ? aiInsightsLimit : Infinity,
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
   * Get tier limits for a specific tier
   */
  getTierLimits(tier: SubscriptionTier): TierLimits {
    return TIER_LIMITS[tier];
  }

  /**
   * Get tier features for a specific tier
   */
  getTierFeatures(tier: SubscriptionTier): TierFeatures {
    return TIER_FEATURES[tier];
  }

  /**
   * Check if user can use AI insights (with quota check)
   */
  async canUseAIInsights(): Promise<{ 
    allowed: boolean; 
    used: number; 
    limit: number; 
    remaining: number;
  }> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription) {
      return { allowed: false, used: 0, limit: 0, remaining: 0 };
    }

    const { tier, aiInsightsUsed, aiInsightsLimit } = subscription;
    
    // Premium and Enterprise have unlimited
    if (tier === 'premium' || tier === 'enterprise') {
      return { 
        allowed: true, 
        used: aiInsightsUsed, 
        limit: Infinity,
        remaining: Infinity,
      };
    }

    // Pro tier has monthly limit
    if (tier === 'pro') {
      const remaining = aiInsightsLimit - aiInsightsUsed;
      return {
        allowed: aiInsightsUsed < aiInsightsLimit,
        used: aiInsightsUsed,
        limit: aiInsightsLimit,
        remaining: Math.max(0, remaining),
      };
    }

    // Free tier cannot use AI insights
    return { allowed: false, used: 0, limit: 0, remaining: 0 };
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
   * Start a 14-day Pro trial for the user
   */
  async startTrial(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user has already had a trial
      const { data: existingUser } = await supabase
        .from('users')
        .select('subscription_tier, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (existingUser?.trial_ends_at) {
        throw new Error('Trial already used');
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days

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
    } catch (error: any) {
      console.error('Error starting trial:', error);
      throw error;
    }
  }

  /**
   * Check if user is on a trial
   */
  async isOnTrial(): Promise<boolean> {
    const subscription = await this.getUserSubscription();
    return subscription?.status === 'trialing';
  }

  /**
   * Get days remaining in trial
   */
  async getTrialDaysRemaining(): Promise<number | null> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription?.trialEndsAt || subscription.status !== 'trialing') {
      return null;
    }

    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Check if user has reached team limit
   */
  async hasReachedTeamLimit(): Promise<{ reached: boolean; current: number; limit: number }> {
    try {
      const subscription = await this.getUserSubscription();
      if (!subscription) {
        return { reached: true, current: 0, limit: 0 };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { reached: true, current: 0, limit: 0 };
      }

      // Count active teams
      const { count, error } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('is_active', true)
        .is('archived_at', null);

      if (error) throw error;

      const current = count || 0;
      const limit = TIER_LIMITS[subscription.tier].teams;
      const reached = limit !== Infinity && current >= limit;

      return { reached, current, limit };
    } catch (error: any) {
      console.error('Error checking team limit:', error);
      return { reached: true, current: 0, limit: 0 };
    }
  }

  /**
   * Check if team has reached player limit
   */
  async hasReachedPlayerLimit(teamId: string): Promise<{ reached: boolean; current: number; limit: number }> {
    try {
      const subscription = await this.getUserSubscription();
      if (!subscription) {
        return { reached: true, current: 0, limit: 0 };
      }

      // Count active players in team
      const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('archived_at', null);

      if (error) throw error;

      const current = count || 0;
      const limit = TIER_LIMITS[subscription.tier].playersPerTeam;
      const reached = limit !== Infinity && current >= limit;

      return { reached, current, limit };
    } catch (error: any) {
      console.error('Error checking player limit:', error);
      return { reached: true, current: 0, limit: 0 };
    }
  }

  /**
   * Get subscription history for current user
   */
  async getSubscriptionHistory(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching subscription history:', error);
      return [];
    }
  }

  /**
   * Update user's subscription tier (admin function or payment webhook)
   */
  async updateSubscriptionTier(
    userId: string, 
    tier: SubscriptionTier, 
    status: SubscriptionStatus = 'active'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_status: status,
          subscription_start_date: status === 'active' ? new Date().toISOString() : undefined,
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating subscription tier:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription (downgrade to free at end of period)
   */
  async cancelSubscription(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_end_date: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();

// Export individual functions for convenience
export const {
  getUserSubscription,
  hasFeature,
  getTierLimits,
  getTierFeatures,
  canUseAIInsights,
  incrementAIInsightsUsage,
  startTrial,
  isOnTrial,
  getTrialDaysRemaining,
  hasReachedTeamLimit,
  hasReachedPlayerLimit,
  getSubscriptionHistory,
  updateSubscriptionTier,
  cancelSubscription,
} = subscriptionService;
