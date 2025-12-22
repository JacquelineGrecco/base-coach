# 🗺️ Base Coach - Product Roadmap

**Product Name:** Base Coach (formerly FutsalPro Coach)  
**Current Version:** v1.8.3  
**Last Updated:** December 21, 2025  

---

## 🎯 Vision

**The leading youth sports evaluation platform for coaches across all sports in Brazil and LATAM.**

**Current Focus:** Futsal (MVP validation)  
**Future Expansion:** Football, Volleyball, Basketball, Handball, and all youth sports

### Why "Base Coach"?
- **"Base"** = Youth/foundation categories (universal across sports)
- **"Coach"** = Universal term, works globally
- **Multi-Sport Ready:** Not limited to futsal
- **Enterprise Appeal:** Professional, scalable

---

## ✅ Implemented Features

### 🔐 **Authentication & Profile** (v1.0.0 - v1.3.0)
- ✅ Email/password authentication with Supabase
- ✅ Email verification required
- ✅ Password reset with auto-redirect
- ✅ Profile picture upload with interactive cropper
- ✅ Bio field for coaches (500 chars)
- ✅ Show/hide password toggles
- ✅ Remember me checkbox
- ✅ Account deletion with cascade
- ✅ Orphaned auth user cleanup
- ✅ Portuguese error messages

### 👥 **Team & Player Management** (v1.2.0 - v1.3.0)
- ✅ Complete team CRUD (create, edit, archive, delete)
- ✅ Categories system (Sub-12, Sub-15, etc.)
- ✅ Multi-level navigation (Teams → Categories → Players)
- ✅ Player CRUD with validation
- ✅ Jersey number validation (0-99, unique per team)
- ✅ Birth date validation (5-50 years old)
- ✅ Position dropdown (Goleiro, Fixo, Ala, Pivô)
- ✅ Gender field for categories
- ✅ Team selector on dashboard
- ✅ Real-time data loading
- ✅ Empty states with helpful CTAs

### 📊 **Session Evaluation** (v1.0.0 - v1.8.3)
- ✅ Session setup with max 3 valence selection
- ✅ Active session with keyboard/swipe navigation
- ✅ Player presence control
- ✅ Session timer (MM:SS format)
- ✅ Progress tracking
- ✅ 0-5 scoring system
- ✅ Large touch targets (h-16 buttons)
- ✅ Optimized mobile workflow
- ✅ Session history with attendance data

### 📈 **Reports & Analytics** (v1.0.0 - v1.8.3)
- ✅ Individual player reports (200-300 characters)
- ✅ Auto-generated strengths/weaknesses
- ✅ Export reports (TXT format)
- ✅ Share functionality (Web Share API)
- ✅ AI-powered analysis (Google Gemini)
- ✅ Team-wide statistics
- ✅ Player progress tracking
- ✅ Session detail views

### 💳 **Subscription System** (v1.8.0 - v1.8.3)
- ✅ Three-tier pricing (Free, Pro, Premium)
- ✅ 14-day free trial system
- ✅ Trial countdown badges
- ✅ Trial expiration modals (7, 3, 0 days)
- ✅ Upgrade prompts and limit modals
- ✅ Feature gating by tier
- ✅ Subscription management UI
- ⏳ **Payment integration pending** (Stripe/Mercado Pago)

### 🗄️ **Database & Infrastructure** (v1.0.0 - v1.8.3)
- ✅ Supabase integration (PostgreSQL)
- ✅ 26 database migrations
- ✅ Row Level Security (RLS) policies
- ✅ Cascade delete configuration
- ✅ Archive/restore functionality
- ✅ 7-day auto-cleanup (pg_cron)
- ✅ Unique constraints and validation
- ✅ Performance indexes

### 🎨 **UX/UI Enhancements** (v1.8.3 - Latest)
- ✅ **Dashboard Transformation** (Dec 2025)
  - Dynamic time-based greeting
  - Dominant gradient primary CTA
  - Actionable stats cards (2 of 3 interactive)
  - Enhanced player avatars with gradients
  - Color-coded status badges with pulse
  - Quick actions kebab menu
  - Color-coded session pills
  - Performance indicators
- ✅ **Touch-Optimized Design**
  - h-12/h-14 minimum touch targets
  - High-contrast colors for outdoor use
  - Micro-interactions (active:scale-95)
  - Skeleton loaders
  - Enhanced empty states
- ✅ **Typography System**
  - text-5xl font-black for stats
  - tracking-tight for headings
  - tabular-nums for numbers
- ✅ **Mobile-First**
  - Swipe gestures
  - Responsive layouts
  - Touch-friendly navigation

### 📤 **Data Export** (v1.1.0)
- ✅ Export user data as CSV (multiple files)
- ✅ Export user data as JSON
- ✅ Format selector modal
- ✅ Timestamped filenames

---

## 🚀 Planned Features

### Phase 1: Monetization (Next 2-3 Weeks)

#### 💳 Payment Integration (v1.9.0)
**Status:** Not Started  
**Priority:** 🔥 CRITICAL  
**Estimated Time:** 12-16 hours

**Features:**
- [ ] Stripe integration (recommended)
- [ ] Checkout flow
- [ ] Subscription management
- [ ] Webhook handling
- [ ] Invoice generation
- [ ] Billing dashboard
- [ ] Payment success/failure handling

**Deliverable:** Enable real subscription purchases

---

#### 🎨 Final UX Polish (v1.8.4 - v1.8.5)
**Status:** Not Started  
**Priority:** 🔥 HIGH  
**Estimated Time:** 14-17 hours

**Phase 2A: Touch Optimization (8-9h)**
- [ ] All buttons minimum 48×48px
- [ ] Inter variable font integration
- [ ] Soft UI polish (rounded-xl, shadow-sm)
- [ ] Enhanced skeleton loading states

**Phase 2B: Visual Hierarchy (6-8h)**
- [ ] High-contrast dashboard for outdoor use
- [ ] Reusable EmptyState component
- [ ] Enhanced micro-interactions
- [ ] Squint test optimization

**Deliverable:** Premium, field-ready UI

---

### Phase 2: Advanced Features (Month 2+)

#### 📅 Session History & Progress (v2.0.0)
**Priority:** 🟡 MEDIUM  
**Estimated Time:** 2-3 weeks

**Features:**
- [ ] Enhanced session list with filters
- [ ] Player progress timeline
- [ ] Before/after comparisons
- [ ] Improvement percentage calculations
- [ ] Score evolution graphs
- [ ] Session detail page enhancements

---

#### 🤖 Enhanced AI Experience (v2.1.0)
**Priority:** 🟡 MEDIUM  
**Estimated Time:** 8-10 hours

**Features:**
- [ ] Slide-over AI drawer
- [ ] AI insight cards (categorized)
- [ ] Markdown rendering
- [ ] Copy to clipboard
- [ ] Confidence scores
- [ ] AI Coach Assistant chatbot

**Note:** Only implement if beta coaches actively use AI insights (>50% usage)

---

#### ⚽ Live Match Mode (v2.2.0)
**Priority:** 🟡 MEDIUM  
**Estimated Time:** 10-12 hours

**Features:**
- [ ] Swipe gestures for substitutions
- [ ] Status badges (On Pitch, Benched, Injured)
- [ ] Minutes played indicators
- [ ] Live match sorting
- [ ] Match-specific criteria

**Note:** Only implement if coaches request live match tracking

---

#### 🌞 Pitch Mode (v2.3.0)
**Priority:** 🟢 LOW  
**Estimated Time:** 6-8 hours

**Features:**
- [ ] Ultra high-contrast theme
- [ ] Toggle in header
- [ ] Larger text sizes
- [ ] Bright accent colors
- [ ] Save preference to database

**Note:** Only implement if beta coaches report sunlight visibility issues

---

#### ⚙️ Settings Page Refactoring (v2.4.0)
**Priority:** 🟡 MEDIUM  
**Estimated Time:** 12-16 hours

**Problem Identified:**
- Plan comparison table duplicated in both Pricing page AND Settings
- Settings page cluttered (1,352 lines, only 2 tabs)
- Marketing content mixed with management features
- Missing high-value features (2FA, notifications, preferences)

**Solution:**

**New Tab Structure (6 tabs replacing 2):**

1. **Personal Info Tab** (cleaned up)
   - [ ] Name, email, phone, photo, bio only
   - [ ] Remove password change (→ Security tab)
   - [ ] Remove account deletion (→ Data & Privacy tab)

2. **Security Tab** (NEW) 🔒
   - [ ] Password change (moved from Personal)
   - [ ] Two-Factor Authentication (2FA)
   - [ ] Active sessions manager (see all logged-in devices)
   - [ ] Sign out specific sessions
   - [ ] Sign out all sessions
   - [ ] Login history (recent attempts, IP addresses)

3. **Notifications Tab** (NEW) 🔔
   - [ ] Push Notifications toggles
     - Session reminders (24h, 1h before)
     - Athlete absences
     - AI reports ready
   - [ ] Email Notifications toggles
     - Weekly summary
     - Monthly reports
     - Trial expiration warnings
     - Payment receipts
   - [ ] In-App Notifications toggles

4. **Preferences Tab** (NEW) ⚙️
   - [ ] Language selection (PT-BR, English, Spanish)
   - [ ] Theme selection (Light, Dark, High Contrast)
   - [ ] Display options (compact view, show photos, date format)
   - [ ] Session defaults (default valences, auto-save, timer auto-start)

5. **Billing Tab** (simplified from "Plano" tab) 💳
   - [ ] Remove full plan comparison table (keep in Pricing.tsx only)
   - [ ] Current plan summary card
   - [ ] Trial status if applicable
   - [ ] Next billing date
   - [ ] "Change Plan" button → Navigate to Pricing.tsx
   - [ ] Payment method card
   - [ ] Invoice history table
   - [ ] Cancel subscription button

6. **Data & Privacy Tab** (NEW) 🗄️
   - [ ] Export all data (JSON/CSV)
   - [ ] Custom export (specific teams, date ranges)
   - [ ] Delete specific team
   - [ ] Delete old sessions
   - [ ] Clear all evaluations
   - [ ] Account deletion (moved from Personal)

**New Components:**
- `src/components/ui/settings/BillingTab.tsx` (~150 lines)
- `src/components/ui/settings/SecurityTab.tsx` (~200 lines)
- `src/components/ui/settings/NotificationsTab.tsx` (~150 lines)
- `src/components/ui/settings/PreferencesTab.tsx` (~150 lines)
- `src/components/ui/settings/DataPrivacyTab.tsx` (~150 lines)
- `src/components/ui/settings/index.ts` (barrel export)

**New Services:**
- `src/services/notificationService.ts` - Notification preferences
- `src/services/preferencesService.ts` - User preferences storage

**Benefits:**
- ✅ Eliminates duplication (~500 lines of duplicate code removed)
- ✅ Better organization (6 focused tabs vs 2 cluttered)
- ✅ High-value features (2FA, notifications, theme, language)
- ✅ LGPD compliant (granular data export/delete)
- ✅ Clear separation (Pricing for marketing, Settings for management)
- ✅ Single source of truth (plan comparison only in Pricing.tsx)

**Documentation:** `docs/SETTINGS_REFACTORING_PLAN.md`

---

### Phase 3: Multi-Sport Platform (v3.0.0)

#### 🏀 Multi-Sport Support 🌟 GAME CHANGER
**Priority:** 🔥 CRITICAL (after futsal validation)  
**Estimated Time:** 8-10 weeks total

**Why This Matters:**
- **10-20x Market Expansion:** From 50k futsal coaches to 500k+ coaches
- **Network Effects:** Cross-sport referrals
- **Competitive Moat:** Not a niche app, but THE platform
- **Investor Appeal:** Bigger vision, scalable opportunity

**Tier 1 Sports (First):**
- [ ] ⚽ **Football/Soccer** - Biggest market in Brazil
  - Positions: GK, Defender, Midfielder, Winger, Striker
  - 11 players on field
  - Similar valences to futsal

**Tier 2 Sports (Following):**
- [ ] 🏐 **Volleyball** - Very popular in Brazil
  - Positions: Setter, Outside Hitter, Middle Blocker, Libero
  - 6 players on court
  - Valences: Serving, Reception, Blocking, Attack
  
- [ ] 🏀 **Basketball** - Growing youth market
  - Positions: Point Guard, Shooting Guard, Forwards, Center
  - 5 players on court
  - Valences: Shooting, Dribbling, Defense, Rebounding

**Tier 3 Sports (Future):**
- [ ] 🤾 Handball
- [ ] 🎾 Tennis (individual sport model)
- [ ] 🏊 Swimming (by stroke)

**Technical Implementation:**
- [ ] Sport selection when creating team
- [ ] Dynamic position system
- [ ] Sport configuration system (`sportConfigs.ts`)
- [ ] Sport-specific default valences
- [ ] Sport-appropriate terminology
- [ ] Sport filter on dashboard
- [ ] Database schema with `sport` field

**Go-to-Market:**
1. Perfect futsal experience
2. Add football (natural expansion)
3. Add volleyball & basketball (prove flexibility)
4. Open platform (any sport can be configured)

---

### Phase 4: Parent Portal & Monetization (v3.5.0)

#### 👨‍👩‍👧 Parent Portal 🌟 GAME CHANGER
**Priority:** 🔥 CRITICAL (for scaling)  
**Estimated Time:** 4-6 weeks

**Features:**
- [ ] Parent registration/login
- [ ] Parent dashboard (child's progress)
- [ ] Progress graphs
- [ ] Training attendance view
- [ ] Push notifications
- [ ] In-app report purchases (R$20-30 per report)
- [ ] Automatic payment processing
- [ ] Privacy controls
- [ ] Multi-child support

**Why Game Changer:**
- Eliminates coach's sales overhead
- Recurring revenue stream
- Direct parent engagement
- Automated payments
- Coach gets 70%, app gets 30%

---

#### 💰 Enhanced Monetization (v3.6.0)
**Priority:** 🔥 HIGH  
**Estimated Time:** 3-4 weeks

**Features:**
- [ ] Revenue dashboard for coaches
- [ ] Commission tracking
- [ ] Payout management
- [ ] Transaction history
- [ ] Refund handling
- [ ] Tax compliance (NF-e for Brazil)

---

### Phase 5: Enterprise Features (v4.0.0+)

#### 🏢 Multi-Coach & Club Accounts
**Priority:** 🟡 MEDIUM  
**Estimated Time:** 3-4 weeks

**Features:**
- [ ] Club admin dashboard
- [ ] Multiple coaches per club
- [ ] Permission levels (Admin, Head Coach, Assistant, Observer)
- [ ] Shared player database
- [ ] Cross-coach collaboration
- [ ] Club-wide reporting

---

#### 🔗 API & Integrations
**Priority:** 🟢 LOW  
**Estimated Time:** 4-6 weeks

**Features:**
- [ ] REST API for third-party integrations
- [ ] Webhooks for events
- [ ] Zapier integration
- [ ] Google Calendar sync
- [ ] WhatsApp Business API
- [ ] Email service integration (SendGrid)

---

### Phase 6: Advanced Features

#### 🎮 Gamification for Players
**Priority:** 🟢 LOW  
**Estimated Time:** 3-4 weeks

**Features:**
- [ ] Player-facing app
- [ ] Age-appropriate UI
- [ ] Personal dashboard
- [ ] Achievements/badges system
- [ ] Leaderboards
- [ ] XP/points for improvement
- [ ] Personal goal setting

---

#### 🤖 Advanced AI Features
**Priority:** 🟡 MEDIUM  
**Estimated Time:** 6-8 weeks

**Features:**
- [ ] AI suggests which valences to evaluate
- [ ] Auto-evaluation from video
- [ ] AI Coach Assistant chatbot
- [ ] Predictive analytics (injury risk, performance)
- [ ] Talent identification

---

## 🔥 Quick Wins (Can Implement Anytime)

**Low-hanging fruit (< 4 hours each):**
- [ ] Session notes field (2h)
- [ ] Dark mode toggle (4h)
- [ ] Keyboard shortcuts 1-5 for scoring (2h)
- [ ] Undo last evaluation (4h)
- [ ] Quick filter on dashboard (3h)
- [ ] Player search/filter (3h)
- [ ] Session duration target (2h)
- [ ] Export session as JSON (2h)
- [ ] Print view for reports (4h)
- [ ] Team stats on dashboard (4h)

---

## 🚫 Out of Scope

**Too ambitious or not aligned with vision:**
- AR/VR training scenarios
- Wearable device integration (heart rate, GPS)
- Blockchain certificates/NFTs
- Live streaming platform
- Nutrition tracking
- Mental health assessments
- Genetic testing
- Professional scouting network

---

## 📊 Success Metrics

### Phase 1 (v1.9.0 - Monetization)
- [ ] Payment integration complete
- [ ] Can upgrade to Pro/Premium
- [ ] Webhooks update user tier correctly
- [ ] Tested with real payments

### Phase 2 (v2.0.0 - Beta Launch)
- [ ] 5-10 beta coaches onboarded
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] 80%+ complete onboarding rate
- [ ] 50%+ record 3+ sessions

### Phase 3 (v3.0.0 - Multi-Sport)
- [ ] 3+ sports supported
- [ ] 30%+ users coaching multiple sports
- [ ] Cross-sport referral rate > 25%
- [ ] Sport-specific NPS > 50 for each

### Phase 4 (v3.5.0 - Parent Portal)
- [ ] 100+ paying coaches
- [ ] 500+ active parent accounts
- [ ] R$50k+ monthly recurring revenue
- [ ] 100+ premium reports sold/month
- [ ] 20%+ trial-to-paid conversion

### Phase 5 (v4.0.0 - Enterprise)
- [ ] 500+ coaches
- [ ] 10,000+ players across all sports
- [ ] Market leader in LATAM youth sports

---

## 💰 Revenue Projections

### Conservative (Year 1)
- 50 coaches × R$49/month = **R$2,450/month**
- Annual: **R$29,400** (~$6,000 USD)

### Realistic (Year 1)
- 100 coaches (80% Pro, 20% Premium)
- Total: **R$6,900/month**
- Annual: **R$82,800** (~$16,800 USD)

### Optimistic (Year 1)
- 200 coaches (70% Pro, 30% Premium)
- Total: **R$15,800/month**
- Annual: **R$189,600** (~$38,400 USD)

---

## 🎯 Pricing Structure

### Free Tier
- 1 team, max 15 players
- 5 sessions per month
- Basic evaluations
- Watermarked reports

### Pro Tier (R$49/month)
- 3 teams, unlimited players
- Unlimited sessions
- Full evaluation system
- Text report exports
- Email support

### Premium Tier (R$149/month)
- Unlimited teams
- Professional branded reports
- AI analysis unlimited
- Custom valences
- Parent portal access
- Priority support
- Commission on parent purchases

### Enterprise (R$500/month+)
- Multi-coach accounts
- Bulk parent accounts
- Custom branding
- API access
- White-label option

---

## 📅 Timeline

```
CURRENT WEEK (Dec 21-27):
├─ Mon-Tue: UX Polish (14-17h)
├─ Wed-Fri: Payment Integration (12-16h)
└─ Weekend: Testing & Deploy v1.9.0

WEEK 2 (Dec 28 - Jan 3):
├─ Mon-Wed: Documentation (8-12h)
├─ Thu-Fri: Final testing
└─ Weekend: Deploy v2.0.0-beta

WEEK 3 (Jan 4-10):
└─ Soft launch: Invite 5-10 beta coaches

WEEKS 4-6 (Jan 11 - Feb 1):
└─ Beta testing, feedback, iteration

MONTH 2+ (Feb onwards):
└─ Advanced features based on feedback
```

**Total Time to Beta:** ~35-45 hours over 2-3 weeks  
**Total Time to Public Launch:** 6-8 weeks

---

## 🚨 Critical Success Factors

1. **Field Usability** - Must work on the sideline
2. **Touch Targets** - Small buttons = frustration = churn
3. **Visual Hierarchy** - 3-second glanceability required
4. **Payment Integration** - No revenue = can't sustain
5. **Beta Feedback** - Build what coaches need, not assumptions

---

## 💡 Key Principles

1. **Ship, Don't Perfect** - 85% is good enough for beta
2. **Validate Before Building** - Test with real users first
3. **Field-First Always** - Every decision optimizes for sideline use
4. **Revenue Enables Growth** - Payment unlocks everything
5. **Feedback Over Assumptions** - Build what's requested

---

## 🎨 Brand Positioning

### Tagline
"A plataforma de avaliação para esportes de base"  
(The evaluation platform for youth sports)

### Elevator Pitch (Portuguese)
> "BaseCoach é a principal plataforma de avaliação para treinadores de esportes de base no Brasil. Começamos com futsal, onde ajudamos treinadores a avaliar mais de 20 atletas em menos de 30 minutos e gerar relatórios profissionais automaticamente. Nossa visão é expandir para todos os esportes de base - futebol, vôlei, basquete e além."

### Competitive Advantages
- **vs Manual Methods:** 60% faster, professional reports, progress tracking
- **vs Generic Apps:** Purpose-built for youth sports, Portuguese-first
- **vs Single-Sport Tools:** One platform for all teams, cross-sport insights
- **vs Enterprise:** Easy to use, affordable, mobile-first

---

## 📞 Next Steps

### Immediate (Today):
1. Review consolidated documentation
2. Decide: UX polish level (Phase 2A only or 2A + 2B)
3. Decide: Payment provider (Stripe or Mercado Pago)
4. Start Phase 2A implementation

### This Week:
- Mon-Tue: Phase 2 (UX polish)
- Wed-Fri: Phase 3 (Payment)
- Weekend: Testing & deploy v1.9.0

### Next Week:
- Phase 4 (Documentation)
- Soft launch prep
- Deploy v2.0.0-beta

### Month 2:
- Beta testing
- Collect feedback
- Iterate based on real usage
- Public launch! 🎊

---

**Document Version:** 3.0 (Consolidated)  
**Last Updated:** December 21, 2025  
**Status:** 🟢 Ready to Execute

**Recommended Path:** UX Polish (14-17h) → Payment (12-16h) → Beta Launch
