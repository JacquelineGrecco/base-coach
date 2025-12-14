# BaseCoach - Subscription Tiers & Feature Gating

**Last Updated:** December 13, 2024  
**Status:** 🎯 Phase 1 Implementation Plan

---

## 🎯 Overview

BaseCoach will implement a **freemium model** with tiered subscriptions that gate advanced analytics, charts, and features. This document outlines what features are available in each tier and the technical implementation plan.

---

## 💎 Subscription Tiers

### **🆓 Free Tier** (Trial/Basic)
**Price:** R$0/month  
**Target:** New coaches, small teams, trial users

#### ✅ Included Features:
**Core Functionality:**
- ✅ 1 team, max 15 players
- ✅ Unlimited sessions per month
- ✅ Basic player evaluations (3 valences per session)
- ✅ Session history (last 30 days)
- ✅ Dashboard with team overview

**Reports & Analytics:**
- ✅ Basic player list with scores
- ✅ Simple performance table (text-based)
- ✅ Individual player view (no charts)
- ✅ Session detail view (basic info)

**Export:**
- ✅ Export as plain text (.txt)
- ❌ PDF export (upgrade required)
- ❌ CSV export (upgrade required)

#### ❌ NOT Included (Upgrade to unlock):
- ❌ Radar charts
- ❌ Evolution/progress charts
- ❌ AI-powered insights
- ❌ PDF reports
- ❌ Advanced analytics
- ❌ Multiple teams
- ❌ Attendance tracking
- ❌ Session templates
- ❌ Custom branding

**Watermark:** Free tier exports include "Created with BaseCoach - Upgrade for more features"

---

### **⭐ Pro Tier** (Recommended)
**Price:** R$49/month or R$490/year (save 17%)  
**Target:** Professional coaches, serious users

#### ✅ All Free Features PLUS:
**Teams & Players:**
- ✅ Up to 5 teams
- ✅ Unlimited players per team
- ✅ Attendance tracking
- ✅ Player notes and observations

**Advanced Reports & Charts:**
- ✅ **Radar Charts** for player performance visualization
- ✅ **Evolution Charts** (line graphs showing progress over time)
- ✅ **Trend Analysis** (improving/declining indicators)
- ✅ Team-wide statistics with visual charts
- ✅ Date range filtering (7/30/90 days, all time)
- ✅ Performance comparison (before/after)

**Export & Sharing:**
- ✅ **PDF Export** with professional layout
- ✅ **CSV Export** for data analysis
- ✅ Share reports via link (with permissions)
- ✅ Email reports directly
- ✅ Print-friendly format

**Productivity:**
- ✅ Session templates (save and reuse)
- ✅ Quick player creation modal
- ✅ Bulk actions
- ✅ Calendar view for sessions
- ✅ Session reminders

**AI Features:**
- ✅ **AI-Powered Insights** (5 reports per month)
- ✅ Personalized recommendations
- ✅ Strength/weakness analysis

**Support:**
- ✅ Email support (24-48h response)
- ✅ Priority feature requests

**Branding:**
- ✅ Remove watermarks
- ✅ Custom club logo on reports

---

### **🚀 Premium Tier**
**Price:** R$149/month or R$1,490/year (save 17%)  
**Target:** Multi-team coaches, academies, serious professionals

#### ✅ All Pro Features PLUS:
**Unlimited Everything:**
- ✅ Unlimited teams
- ✅ Unlimited players
- ✅ Unlimited AI insights
- ✅ Unlimited PDF exports

**Advanced Analytics:**
- ✅ **Cross-team comparison charts**
- ✅ **Custom valences** (create your own criteria)
- ✅ **Advanced statistics** (percentiles, distributions)
- ✅ **Benchmarking** against team/category averages
- ✅ **Predictive analytics** (future performance trends)

**Professional Features:**
- ✅ **Parent portal access** (parents can view reports)
- ✅ **Multi-coach collaboration** (assistant coaches)
- ✅ **Custom branding** (full white-label reports)
- ✅ **Media uploads** (photos/videos in sessions)
- ✅ **Custom report templates**

**Priority Support:**
- ✅ Priority email support (4-12h response)
- ✅ WhatsApp support channel
- ✅ Video call support (scheduled)
- ✅ Onboarding assistance

**Business Features:**
- ✅ Revenue dashboard (if selling reports to parents)
- ✅ Commission tracking
- ✅ Invoice generation

---

### **🏢 Enterprise Tier** (Custom)
**Price:** R$500+/month (Custom pricing)  
**Target:** Large clubs, academies, organizations

#### ✅ All Premium Features PLUS:
- ✅ Multi-coach accounts (unlimited coaches)
- ✅ Bulk parent accounts
- ✅ API access
- ✅ Custom integrations
- ✅ Dedicated account manager
- ✅ Custom training for staff
- ✅ White-label option (fully branded)
- ✅ On-premise deployment option
- ✅ SLA guarantees
- ✅ Custom development requests

---

## 📊 Feature Comparison Table

| Feature | Free | Pro | Premium | Enterprise |
|---------|------|-----|---------|------------|
| **Teams** | 1 | 5 | Unlimited | Unlimited |
| **Players per Team** | 15 | Unlimited | Unlimited | Unlimited |
| **Sessions** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Session History** | 30 days | Unlimited | Unlimited | Unlimited |
| **Basic Evaluations** | ✅ | ✅ | ✅ | ✅ |
| **Attendance Tracking** | ❌ | ✅ | ✅ | ✅ |
| **Session Templates** | ❌ | ✅ | ✅ | ✅ |
| **Radar Charts** | ❌ | ✅ | ✅ | ✅ |
| **Evolution Charts** | ❌ | ✅ | ✅ | ✅ |
| **Trend Analysis** | ❌ | ✅ | ✅ | ✅ |
| **PDF Export** | ❌ | ✅ | ✅ | ✅ |
| **CSV Export** | ❌ | ✅ | ✅ | ✅ |
| **AI Insights** | ❌ | 5/month | Unlimited | Unlimited |
| **Custom Valences** | ❌ | ❌ | ✅ | ✅ |
| **Parent Portal** | ❌ | ❌ | ✅ | ✅ |
| **Multi-Coach** | ❌ | ❌ | ✅ | ✅ |
| **Custom Branding** | ❌ | Logo only | Full | White-label |
| **Support** | Community | Email | Priority | Dedicated |
| **API Access** | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Technical Implementation Plan

### Phase 1.1: Database Schema (Week 1)
**Migration:** `025_add_subscription_system.sql`

```sql
-- Add subscription fields to users table
ALTER TABLE users
ADD COLUMN subscription_tier TEXT DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'pro', 'premium', 'enterprise')),
ADD COLUMN subscription_status TEXT DEFAULT 'active' 
  CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ai_insights_used INTEGER DEFAULT 0,
ADD COLUMN ai_insights_reset_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Create subscription history table
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Function to check tier access
CREATE OR REPLACE FUNCTION has_tier_access(required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM users
  WHERE id = auth.uid();
  
  RETURN CASE required_tier
    WHEN 'free' THEN TRUE
    WHEN 'pro' THEN user_tier IN ('pro', 'premium', 'enterprise')
    WHEN 'premium' THEN user_tier IN ('premium', 'enterprise')
    WHEN 'enterprise' THEN user_tier = 'enterprise'
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add team count limits
ALTER TABLE teams
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Function to check team limit
CREATE OR REPLACE FUNCTION check_team_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  team_count INTEGER;
  max_teams INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM users
  WHERE id = NEW.coach_id;
  
  -- Set max teams based on tier
  max_teams := CASE user_tier
    WHEN 'free' THEN 1
    WHEN 'pro' THEN 5
    WHEN 'premium' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 1
  END;
  
  -- Count active teams
  SELECT COUNT(*) INTO team_count
  FROM teams
  WHERE coach_id = NEW.coach_id
    AND is_active = true
    AND archived_at IS NULL;
  
  -- Check limit
  IF team_count >= max_teams THEN
    RAISE EXCEPTION 'Team limit reached for your subscription tier. Please upgrade to add more teams.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for team limit
CREATE TRIGGER enforce_team_limit
  BEFORE INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION check_team_limit();

-- Function to check player limit
CREATE OR REPLACE FUNCTION check_player_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  player_count INTEGER;
  max_players INTEGER;
BEGIN
  -- Get user's subscription tier via team
  SELECT u.subscription_tier INTO user_tier
  FROM users u
  JOIN teams t ON t.coach_id = u.id
  WHERE t.id = NEW.team_id;
  
  -- Set max players per team based on tier
  max_players := CASE user_tier
    WHEN 'free' THEN 15
    WHEN 'pro' THEN 999999
    WHEN 'premium' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 15
  END;
  
  -- Count active players in team
  SELECT COUNT(*) INTO player_count
  FROM players
  WHERE team_id = NEW.team_id
    AND archived_at IS NULL;
  
  -- Check limit
  IF player_count >= max_players THEN
    RAISE EXCEPTION 'Player limit reached for your subscription tier. Please upgrade to add more players to this team.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for player limit
CREATE TRIGGER enforce_player_limit
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION check_player_limit();
```

---

### Phase 1.2: Subscription Service (Week 1)

**File:** `services/subscriptionService.ts`

```typescript
import { supabase } from '../lib/supabase';

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
}

const TIER_LIMITS = {
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

export const TIER_FEATURES = {
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
  },
};

class SubscriptionService {
  async getUserSubscription(): Promise<SubscriptionInfo | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, trial_ends_at, ai_insights_used')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const tier = data.subscription_tier as SubscriptionTier;
      const aiInsightsLimit = TIER_LIMITS[tier].aiInsightsPerMonth;

      return {
        tier,
        status: data.subscription_status as SubscriptionStatus,
        startDate: data.subscription_start_date,
        endDate: data.subscription_end_date,
        trialEndsAt: data.trial_ends_at,
        aiInsightsUsed: data.ai_insights_used || 0,
        aiInsightsLimit,
      };
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  hasFeature(tier: SubscriptionTier, feature: keyof typeof TIER_FEATURES.free): boolean {
    return TIER_FEATURES[tier][feature] as boolean;
  }

  getTierLimits(tier: SubscriptionTier) {
    return TIER_LIMITS[tier];
  }

  async canUseAIInsights(): Promise<{ allowed: boolean; used: number; limit: number }> {
    const subscription = await this.getUserSubscription();
    if (!subscription) {
      return { allowed: false, used: 0, limit: 0 };
    }

    const { tier, aiInsightsUsed, aiInsightsLimit } = subscription;
    
    if (tier === 'premium' || tier === 'enterprise') {
      return { allowed: true, used: aiInsightsUsed, limit: Infinity };
    }

    if (tier === 'pro') {
      return {
        allowed: aiInsightsUsed < aiInsightsLimit,
        used: aiInsightsUsed,
        limit: aiInsightsLimit,
      };
    }

    return { allowed: false, used: 0, limit: 0 };
  }

  async incrementAIInsightsUsage(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('increment_ai_insights_usage', { user_id_param: user.id });
    } catch (error: any) {
      console.error('Error incrementing AI insights usage:', error);
    }
  }

  async startTrial(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

      await supabase
        .from('users')
        .update({
          subscription_tier: 'pro',
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .eq('id', user.id);
    } catch (error: any) {
      console.error('Error starting trial:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
```

---

### Phase 1.3: Feature Gates in Components (Week 2)

**Example: Reports Component with Gating**

```typescript
// components/Reports.tsx
import { subscriptionService, TIER_FEATURES } from '../services/subscriptionService';

const Reports: React.FC<Props> = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      const sub = await subscriptionService.getUserSubscription();
      setSubscription(sub);
    }
    loadSubscription();
  }, []);

  const canShowRadarChart = subscription && TIER_FEATURES[subscription.tier].radarCharts;
  const canShowEvolutionChart = subscription && TIER_FEATURES[subscription.tier].evolutionCharts;
  const canUseAI = subscription && TIER_FEATURES[subscription.tier].aiInsights;

  // ... rest of component

  return (
    <>
      {/* Basic stats - available to all */}
      <PlayerStatsTable data={playerStats} />

      {/* Radar Chart - Pro+ only */}
      {canShowRadarChart ? (
        <RadarChart data={radarData} />
      ) : (
        <UpgradePrompt
          feature="Radar Charts"
          description="Visualize player performance across all valences with interactive radar charts."
          requiredTier="pro"
        />
      )}

      {/* Evolution Charts - Pro+ only */}
      {canShowEvolutionChart ? (
        <EvolutionLineChart data={evolutionData} />
      ) : (
        <UpgradePrompt
          feature="Evolution Charts"
          description="Track player progress over time with beautiful line charts."
          requiredTier="pro"
        />
      )}

      {/* AI Insights - Pro+ with limits */}
      {canUseAI ? (
        <AIInsightsSection subscription={subscription} />
      ) : (
        <UpgradePrompt
          feature="AI-Powered Insights"
          description="Get personalized recommendations and analysis powered by artificial intelligence."
          requiredTier="pro"
        />
      )}
    </>
  );
};
```

---

### Phase 1.4: Upgrade Prompt Component (Week 2)

**File:** `components/UpgradePrompt.tsx`

```typescript
import React from 'react';
import { Lock, Sparkles, TrendingUp } from 'lucide-react';
import { SubscriptionTier } from '../services/subscriptionService';

interface UpgradePromptProps {
  feature: string;
  description: string;
  requiredTier: SubscriptionTier;
  ctaText?: string;
}

const TIER_INFO = {
  pro: {
    name: 'Pro',
    price: 'R$49/mês',
    icon: Sparkles,
    color: 'blue',
  },
  premium: {
    name: 'Premium',
    price: 'R$149/mês',
    icon: TrendingUp,
    color: 'purple',
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Sob consulta',
    icon: Lock,
    color: 'gray',
  },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  description,
  requiredTier,
  ctaText = 'Fazer Upgrade',
}) => {
  const tierInfo = TIER_INFO[requiredTier];
  const Icon = tierInfo.icon;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-md mb-4">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {feature}
      </h3>
      
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        {description}
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 mb-4">
        <Icon className={`w-5 h-5 text-${tierInfo.color}-600`} />
        <span className="text-sm font-medium text-slate-700">
          Disponível no plano <strong>{tierInfo.name}</strong>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={() => window.location.href = '/pricing'}
          className={`px-6 py-3 bg-${tierInfo.color}-600 text-white rounded-lg hover:bg-${tierInfo.color}-700 transition-colors font-medium`}
        >
          {ctaText} - {tierInfo.price}
        </button>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
        >
          Ver Planos
        </button>
      </div>
    </div>
  );
};
```

---

### Phase 1.5: Pricing Page (Week 2)

Create a professional pricing page showcasing all tiers with:
- Feature comparison table
- FAQ section
- "Start Free Trial" CTAs
- Money-back guarantee badge
- Testimonials (when available)

---

## 📈 Business Metrics to Track

1. **Conversion Rate:** Free → Pro → Premium
2. **Trial Conversion:** % of trial users who become paying
3. **Average Revenue Per User (ARPU)**
4. **Customer Lifetime Value (CLV)**
5. **Churn Rate** per tier
6. **Feature Usage** (which gated features drive upgrades)
7. **Upgrade Triggers** (which prompts convert best)

---

## 🎁 Growth Strategies

### 1. Free Trial
- 14-day Pro trial for all new signups
- No credit card required
- Full access to Pro features
- Email drip campaign during trial

### 2. Seasonal Promotions
- Black Friday: 50% off annual plans
- Back-to-School: 2 months free on annual
- Holiday specials

### 3. Referral Program (Future)
- Refer a coach, get 1 month free
- Referred coach gets 20% off first month

### 4. Educational Discount
- 30% off for academic coaches
- School program partnerships

---

## ✅ Next Steps

1. **Week 1:**
   - [ ] Create migration 025 for subscription system
   - [ ] Build `subscriptionService.ts`
   - [ ] Add subscription fields to user profile

2. **Week 2:**
   - [ ] Implement feature gates in Reports component
   - [ ] Create `UpgradePrompt` component
   - [ ] Gate radar charts, evolution charts, AI insights

3. **Week 3:**
   - [ ] Build pricing page
   - [ ] Add trial flow
   - [ ] Implement team/player limits

4. **Week 4:**
   - [ ] Payment integration (Stripe or Mercado Pago)
   - [ ] Upgrade/downgrade flows
   - [ ] Subscription management dashboard

---

**Status:** 📋 Ready for implementation  
**Priority:** 🔥 Phase 1 Critical Feature

