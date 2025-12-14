# Phase 1 Implementation Plan - Subscription System

**Start Date:** December 13, 2024  
**Target Completion:** 4 weeks  
**Status:** 🎯 Ready to Start

---

## 🎯 Overview

Implement subscription-based tier system that gates advanced analytics and charts, creating clear monetization path and upgrade incentives.

---

## 📋 Week 1: Database & Backend Foundation

### Task 1.1: Database Schema
**File:** `supabase/migrations/025_add_subscription_system.sql`  
**Estimated Time:** 4 hours

- [ ] Add subscription fields to `users` table (tier, status, dates)
- [ ] Create `subscription_history` table
- [ ] Add RLS policies for subscription data
- [ ] Create `has_tier_access()` function
- [ ] Create `check_team_limit()` function and trigger
- [ ] Create `check_player_limit()` function and trigger
- [ ] Test migration in Supabase SQL Editor
- [ ] Apply migration to production

**Acceptance Criteria:**
- Free tier users limited to 1 team, 15 players
- Pro tier users limited to 5 teams, unlimited players
- Premium/Enterprise unlimited
- Database enforces limits via triggers

---

### Task 1.2: Subscription Service
**File:** `services/subscriptionService.ts`  
**Estimated Time:** 6 hours

- [ ] Create `SubscriptionInfo` interface
- [ ] Define `TIER_LIMITS` constant
- [ ] Define `TIER_FEATURES` constant (which features each tier has)
- [ ] Implement `getUserSubscription()` method
- [ ] Implement `hasFeature()` method
- [ ] Implement `getTierLimits()` method
- [ ] Implement `canUseAIInsights()` method (with usage tracking)
- [ ] Implement `incrementAIInsightsUsage()` method
- [ ] Implement `startTrial()` method (14-day Pro trial)
- [ ] Add comprehensive error handling
- [ ] Write unit tests

**Acceptance Criteria:**
- Service correctly identifies user tier
- Feature checks work for all tiers
- AI insights usage is tracked and limited
- Trial starts correctly

---

### Task 1.3: Update User Profile
**File:** `components/Profile.tsx`  
**Estimated Time:** 2 hours

- [ ] Display current subscription tier
- [ ] Display subscription status (active/trial/expired)
- [ ] Display trial end date if on trial
- [ ] Add "Upgrade Plan" button
- [ ] Add "Manage Subscription" button (if subscribed)
- [ ] Display AI insights usage (X/5 used this month)

**Acceptance Criteria:**
- Users can see their current plan
- Clear indication of trial status
- Easy access to upgrade flow

---

## 📋 Week 2: Feature Gating & UI Components

### Task 2.1: Upgrade Prompt Component
**File:** `components/UpgradePrompt.tsx`  
**Estimated Time:** 4 hours

- [ ] Create base component with props interface
- [ ] Add tier-specific icons and colors
- [ ] Implement feature description display
- [ ] Add CTA buttons ("Upgrade" and "View Plans")
- [ ] Add blur/lock visual effect
- [ ] Make responsive for mobile
- [ ] Add analytics tracking for impressions

**Acceptance Criteria:**
- Visually appealing prompt that encourages upgrades
- Clear value proposition for the gated feature
- Works on all screen sizes

---

### Task 2.2: Gate Radar Charts
**File:** `components/Reports.tsx`  
**Estimated Time:** 3 hours

- [ ] Load user subscription on component mount
- [ ] Check `radarCharts` feature flag
- [ ] Show `<UpgradePrompt>` if not allowed
- [ ] Show radar chart if allowed
- [ ] Add "Pro Feature" badge on chart header
- [ ] Test with Free, Pro, and Premium tiers

**Acceptance Criteria:**
- Free users see upgrade prompt instead of radar chart
- Pro+ users see full radar chart
- Clear visual distinction

---

### Task 2.3: Gate Evolution Charts
**File:** `components/Reports.tsx`  
**Estimated Time:** 3 hours

- [ ] Check `evolutionCharts` feature flag
- [ ] Show `<UpgradePrompt>` if not allowed
- [ ] Show evolution line chart if allowed
- [ ] Add date range filter only for Pro+
- [ ] Show preview/teaser for free users (blurred chart?)
- [ ] Test with all tiers

**Acceptance Criteria:**
- Free users see upgrade prompt
- Pro+ users see full evolution tracking
- Teaser increases upgrade desire

---

### Task 2.4: Gate AI Insights
**File:** `components/Reports.tsx`  
**Estimated Time:** 4 hours

- [ ] Check `aiInsights` feature flag
- [ ] Check AI insights quota with `canUseAIInsights()`
- [ ] Show upgrade prompt if Free tier
- [ ] Show usage indicator if Pro (3/5 used)
- [ ] Show "Generate Insights" button if quota available
- [ ] Show "Upgrade for Unlimited" if quota exceeded
- [ ] Call `incrementAIInsightsUsage()` after generation
- [ ] Test quota limits

**Acceptance Criteria:**
- Free users cannot generate insights
- Pro users limited to 5/month
- Premium+ users unlimited
- Usage tracked correctly

---

### Task 2.5: Gate PDF Export
**File:** `components/Reports.tsx`  
**Estimated Time:** 2 hours

- [ ] Check `pdfExport` feature flag
- [ ] Disable PDF export button for Free tier
- [ ] Show tooltip: "Upgrade to Pro for PDF export"
- [ ] Show upgrade modal on click if Free
- [ ] Enable PDF export for Pro+

**Acceptance Criteria:**
- Free users cannot export PDF
- Pro+ users can export
- Clear messaging about limitation

---

### Task 2.6: Gate CSV Export
**File:** `components/Profile.tsx` (Data Export)  
**Estimated Time:** 2 hours

- [ ] Check `csvExport` feature flag
- [ ] Disable CSV format option for Free tier
- [ ] Show "Pro Feature" badge
- [ ] Only allow JSON export for Free
- [ ] Enable CSV for Pro+

**Acceptance Criteria:**
- Free users can only export JSON
- Pro+ users can export CSV
- Clear indication of limitation

---

## 📋 Week 3: Pricing Page & Trial Flow

### Task 3.1: Pricing Page
**File:** `components/Pricing.tsx`  
**Estimated Time:** 8 hours

- [ ] Create pricing page layout
- [ ] Add 4 tier cards (Free, Pro, Premium, Enterprise)
- [ ] Display prices (monthly and annual)
- [ ] Show "Save 17%" badge for annual
- [ ] Add feature comparison table
- [ ] Add toggle: Monthly/Annual
- [ ] Highlight "Most Popular" (Pro tier)
- [ ] Add "Start Free Trial" CTA
- [ ] Add "Current Plan" indicator if logged in
- [ ] Add FAQ section
- [ ] Add testimonials section (placeholder)
- [ ] Make fully responsive
- [ ] Add navigation from Layout sidebar

**Acceptance Criteria:**
- Professional, conversion-focused design
- Clear value proposition for each tier
- Easy to compare features
- Mobile-friendly

---

### Task 3.2: Trial Flow
**File:** `components/TrialModal.tsx`  
**Estimated Time:** 4 hours

- [ ] Create trial activation modal
- [ ] Show benefits of Pro trial
- [ ] Display "14 days free" prominently
- [ ] Add "No credit card required" badge
- [ ] Implement "Start Trial" button
- [ ] Call `subscriptionService.startTrial()`
- [ ] Show success message
- [ ] Redirect to dashboard
- [ ] Add countdown in header during trial ("12 days left")

**Acceptance Criteria:**
- New users can easily start trial
- Trial period tracked correctly
- User notified of trial status
- Smooth onboarding experience

---

### Task 3.3: Team & Player Limits
**File:** `components/Teams/Teams.tsx`, `components/Teams/Players.tsx`  
**Estimated Time:** 3 hours

- [ ] Show team count limit in Teams page header ("1/1 teams" for Free)
- [ ] Disable "Create Team" button if limit reached
- [ ] Show upgrade modal on click if at limit
- [ ] Show player count limit in Players page
- [ ] Disable "Add Player" button if limit reached
- [ ] Show clear messaging about limits

**Acceptance Criteria:**
- Free users cannot exceed 1 team
- Free users cannot exceed 15 players per team
- Pro users cannot exceed 5 teams
- Clear upgrade path when limits hit

---

## 📋 Week 4: Payment Integration & Subscription Management

### Task 4.1: Choose Payment Provider
**Research Task**  
**Estimated Time:** 4 hours

**Options:**
- **Stripe** (International standard, easy integration)
- **Mercado Pago** (Brazilian market leader)
- **PagSeguro** (Alternative Brazilian option)

- [ ] Research Stripe + Brazilian payment methods support
- [ ] Research Mercado Pago API and pricing
- [ ] Compare transaction fees
- [ ] Choose provider based on Brazilian market needs
- [ ] Create account and get API keys

**Decision Factors:**
- Pix support (essential for Brazil)
- Boleto support
- Credit card fees
- Subscription management features
- Documentation quality

---

### Task 4.2: Payment Integration
**File:** `services/paymentService.ts`  
**Estimated Time:** 12 hours

- [ ] Install payment provider SDK
- [ ] Create `paymentService.ts`
- [ ] Implement checkout flow
- [ ] Create webhook endpoint for subscription events
- [ ] Handle successful payment
- [ ] Handle failed payment
- [ ] Handle subscription cancellation
- [ ] Update user tier in database on payment
- [ ] Send confirmation emails
- [ ] Test with test mode

**Acceptance Criteria:**
- Users can upgrade via payment
- Subscription status syncs correctly
- Webhooks handle all scenarios
- Error handling for failed payments

---

### Task 4.3: Subscription Management Dashboard
**File:** `components/SubscriptionManagement.tsx`  
**Estimated Time:** 6 hours

- [ ] Display current plan details
- [ ] Display next billing date
- [ ] Display payment method
- [ ] Add "Change Plan" button (upgrade/downgrade)
- [ ] Add "Cancel Subscription" button
- [ ] Add confirmation modals
- [ ] Display invoice history
- [ ] Add "Download Invoice" links
- [ ] Show cancellation survey on cancel

**Acceptance Criteria:**
- Users can self-manage subscriptions
- Clear billing information
- Easy upgrade/downgrade path
- Proper cancellation flow

---

### Task 4.4: Billing Page
**File:** `components/Billing.tsx`  
**Estimated Time:** 4 hours

- [ ] Create billing history table
- [ ] Display invoice date, amount, status
- [ ] Add "Download PDF" for each invoice
- [ ] Show payment method on file
- [ ] Add "Update Payment Method" button
- [ ] Show next charge date and amount
- [ ] Add link to subscription management

**Acceptance Criteria:**
- Complete billing transparency
- Easy invoice access
- Payment method management

---

## 📋 Testing & Quality Assurance

### Task 5.1: End-to-End Testing
**Estimated Time:** 8 hours

- [ ] Test Free tier experience
  - [ ] Cannot create 2nd team
  - [ ] Cannot add 16th player
  - [ ] Cannot see radar charts
  - [ ] Cannot see evolution charts
  - [ ] Cannot generate AI insights
  - [ ] Cannot export PDF
  - [ ] Can export JSON only

- [ ] Test Pro tier experience
  - [ ] Can create up to 5 teams
  - [ ] Unlimited players
  - [ ] Can see radar charts
  - [ ] Can see evolution charts
  - [ ] Can generate 5 AI insights/month
  - [ ] Can export PDF and CSV

- [ ] Test Premium tier experience
  - [ ] Unlimited teams
  - [ ] Unlimited AI insights
  - [ ] All features unlocked

- [ ] Test trial flow
  - [ ] Trial activates correctly
  - [ ] 14-day countdown works
  - [ ] Trial expiration handled
  - [ ] Downgrade to Free after trial

- [ ] Test upgrade flow
  - [ ] Payment succeeds
  - [ ] Tier updated immediately
  - [ ] Features unlock immediately

- [ ] Test downgrade flow
  - [ ] Downgrade scheduled correctly
  - [ ] Data preserved
  - [ ] Limits enforced

**Acceptance Criteria:**
- All tier restrictions work correctly
- No feature gate bypasses
- Smooth user experience across all tiers

---

### Task 5.2: Performance & Security
**Estimated Time:** 4 hours

- [ ] Verify RLS policies work correctly
- [ ] Test subscription checks performance
- [ ] Add caching for subscription status
- [ ] Verify webhook security (signature validation)
- [ ] Test payment error scenarios
- [ ] Load test with multiple users

**Acceptance Criteria:**
- No security vulnerabilities
- Fast subscription checks
- Robust error handling

---

## 📊 Success Metrics

### Week 1 Goals:
- [ ] Database schema deployed
- [ ] Subscription service functional
- [ ] Profile shows subscription info

### Week 2 Goals:
- [ ] All charts gated correctly
- [ ] Upgrade prompts displaying
- [ ] AI insights usage tracked

### Week 3 Goals:
- [ ] Pricing page live
- [ ] Trial flow working
- [ ] Limits enforced

### Week 4 Goals:
- [ ] Payment integration complete
- [ ] First paid subscription processed
- [ ] Subscription management working

---

## 🚀 Launch Checklist

Before public launch:
- [ ] All features tested in production
- [ ] Payment provider in live mode
- [ ] Pricing confirmed and competitive
- [ ] Legal: Terms of Service updated
- [ ] Legal: Privacy Policy updated (payment info)
- [ ] Legal: Refund policy defined
- [ ] Email templates ready (welcome, trial ending, payment failed)
- [ ] Analytics tracking set up
- [ ] Customer support process defined
- [ ] FAQ page complete
- [ ] Announce to beta users

---

## 📝 Notes

### Pricing Strategy:
- Start with R$49 Pro, R$149 Premium
- Monitor conversion rates
- Adjust pricing based on market feedback
- Consider regional pricing for different Brazilian states

### Marketing:
- Emphasize 14-day free trial (no credit card)
- Highlight chart visualizations as killer feature
- Show before/after (Free vs Pro experience)
- Use social proof from beta users

### Support:
- Prepare for billing questions
- Have refund policy ready
- Monitor trial-to-paid conversion rate
- Set up automated trial ending reminders (Day 7, Day 13)

---

**Status:** 📋 Ready for implementation  
**Owner:** Development Team  
**Next Review:** Weekly standup

