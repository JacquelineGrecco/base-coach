# 🗺️ BaseCoach - Product Roadmap

## 🎯 Vision & Product Name

**Product Name:** BaseCoach (formerly FutsalPro Coach)

**Vision:** The leading youth sports evaluation platform for coaches across all sports in Brazil and LATAM.

**Current Focus:** Futsal (MVP validation)  
**Future Expansion:** Football, Volleyball, Basketball, Handball, Tennis, and all youth sports

**Why "BaseCoach"?**
- **"Base"** = Youth/foundation categories (universal across sports) + Database (tech-forward)
- **"Coach"** = Universal term, works in Portuguese without translation
- **Multi-Sport Ready:** Not limited to futsal, scales to any sport
- **Enterprise Appeal:** Professional, scalable, international potential

**Market Opportunity:**
- Futsal only: ~50k potential coaches in Brazil
- Multi-sport platform: ~500k+ potential coaches across all youth sports
- **10-20x bigger market potential!**

---

## 📋 Current Status (v1.0 MVP - ✅ Complete)

### Completed Features:
- ✅ Session setup with max 3 valence selection
- ✅ Optimized active session with keyboard/swipe navigation
- ✅ Individual player reports (200-300 characters)
- ✅ Export & share functionality
- ✅ Premium reports business model
- ✅ AI-powered analysis (Gemini integration)
- ✅ Mobile-first responsive design
- ✅ Portuguese localization

**Current Capability:** Evaluate 23 players in ~30 minutes with professional report generation

---

## 🛠️ Development Setup & Technical Decisions

### Database Strategy

**Current State (v1.0):**
- ✅ In-memory storage (React state)
- ✅ Perfect for demo and validation
- ❌ No persistence (data lost on refresh)
- ❌ No user accounts or authentication

**For Production (v1.5+):**
- ✅ **Database Required** for:
  - User accounts (coaches, parents)
  - Teams and players (persistent data)
  - Session history and progress tracking
  - Player evaluations over time
  - Premium report purchases
  - Payment/subscription data

**Recommended Database: Supabase** 🌟
- PostgreSQL-based (relational + powerful)
- Real-time subscriptions
- Built-in authentication
- Row-level security
- Free tier (perfect for MVP)
- Easy to scale
- Open source (no vendor lock-in)

**Alternative Options:**
- **Firebase/Firestore:** Easier but proprietary, harder to migrate later
- **MongoDB Atlas:** NoSQL, flexible schema, good for unstructured data
- **PlanetScale:** MySQL, serverless, great for scaling

**Timeline:**
- v1.0 (Current): No database needed
- v1.5 (Phase 1): Implement Supabase for data persistence
- v2.0+: Consider scaling/optimization if needed

---

### Git Flow Strategy

**Recommended: Simplified GitHub Flow** (NOT full GitFlow)

**Why NOT GitFlow:**
- Too complex for startup/small team
- Slows down deployment velocity
- Multiple long-lived branches = merge conflicts
- Better suited for scheduled releases (we need continuous deployment)

**Branch Structure:**

```
main (production - always deployable)
├── feature/session-history
├── feature/attendance-tracking
├── feature/multi-sport-support
├── feature/parent-portal
├── bugfix/export-crash
└── hotfix/critical-production-fix
```

**Branch Naming Convention:**
- `feature/[feature-name]` - New features (e.g., `feature/session-history`)
- `bugfix/[bug-description]` - Bug fixes (e.g., `bugfix/report-export`)
- `hotfix/[critical-fix]` - Emergency production fixes (rare)
- `release/v[version]` - Release preparation (optional)

**Workflow:**

1. **Create feature branch** from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/session-history
   ```

2. **Develop & commit** regularly:
   ```bash
   git add .
   git commit -m "Add session history list view"
   git push origin feature/session-history
   ```

3. **Open Pull Request** (PR) on GitHub:
   - Describe what changed
   - Link to roadmap item
   - Self-review or get feedback

4. **Merge to main**:
   - Squash commits (keep history clean)
   - Delete feature branch after merge

5. **Auto-deploy**:
   - Vercel automatically deploys `main` to production
   - Every merge = new deployment

**Commit Message Convention:**
```
feat: Add session history view
fix: Resolve export crash on mobile
docs: Update README with deployment steps
refactor: Extract report generation to service
chore: Update dependencies
```

**Tags for Releases:**
```bash
git tag -a v1.0.0 -m "Futsal MVP - Initial Release"
git tag -a v1.5.0 -m "Phase 1: Session History & Persistence"
git tag -a v2.0.0 -m "Phase 2: Multi-Sport Support"
git push --tags
```

**Branch Protection Rules (GitHub Settings):**
- ✅ Require pull request before merging
- ✅ Require status checks to pass (when tests added)
- ✅ No force pushes to `main`
- ✅ Delete branch after merge

---

### What's Missing for Production-Ready Futsal MVP

**Current v1.0 Status: 95% Complete for Demo** ✅

**Already Implemented:**
- ✅ Session setup with 3 valence selection
- ✅ Fast evaluation workflow (keyboard + swipe)
- ✅ Individual reports (200-300 characters)
- ✅ Export & share functionality
- ✅ Premium model UI
- ✅ AI-powered analysis (Gemini)
- ✅ Mobile-optimized responsive design
- ✅ Portuguese localization

**Missing for Real-World Usage:**

### 🔥 CRITICAL (Must Have for v1.5):

**1. Data Persistence (Database)**
- [ ] Supabase setup and schema design
- [ ] Migration from in-memory to database
- [ ] Data models: Users, Teams, Players, Sessions, Evaluations
- **Effort:** 1 week
- **Blocks:** All other features depend on this

**2. User Authentication**
- [ ] Coach signup/login
- [ ] Email verification
- [ ] Password reset
- [ ] Session management
- **Effort:** 3-5 days
- **Tech:** Supabase Auth (built-in)

**3. Multi-Team Support**
- [ ] Create/edit/delete teams
- [ ] Team switcher on dashboard
- [ ] Team-specific data filtering
- **Effort:** 3-4 days
- **Prerequisite:** Database

**4. Player Management**
- [ ] Add/edit/remove players
- [ ] Upload player photos (real, not placeholders)
- [ ] Player profile details
- [ ] Import via CSV (bulk add)
- **Effort:** 1 week
- **Prerequisite:** Database + File storage

**5. Session History**
- [ ] View past sessions list
- [ ] Session detail view
- [ ] Filter/search sessions
- [ ] Delete sessions
- **Effort:** 1 week
- **Prerequisite:** Database

### 🟡 IMPORTANT (Phase 1.5 - Nice to Have):

**6. Attendance Tracking**
- [ ] Mark present/absent before session
- [ ] Attendance statistics
- [ ] Skip absent players during evaluation
- **Effort:** 3-4 days

**7. Calendar Integration**
- [ ] Schedule future sessions
- [ ] Calendar view (month/week)
- [ ] Session reminders
- **Effort:** 1 week

**8. Enhanced Player Profiles**
- [ ] Birth date (auto-calculate age)
- [ ] Parent contact info
- [ ] Medical notes
- [ ] Jersey number history
- **Effort:** 3-4 days

### 🟢 LOW PRIORITY (Phase 2):

**9. Custom Valences**
- [ ] Create custom evaluation criteria
- [ ] Position-specific valences
- [ ] Share valence sets
- **Effort:** 1 week

**10. Better Exports**
- [ ] PDF reports (vs .txt)
- [ ] Custom branding
- [ ] Batch export
- **Effort:** 1 week

**11. Session Templates**
- [ ] Save common configurations
- [ ] Quick start from template
- **Effort:** 3-4 days

---

### For Friday Demo with Fernanda

**Current MVP is PERFECT for validation!** ✅

**What works:**
- Complete evaluation workflow
- Fast player navigation
- Report generation
- Export functionality
- Mobile responsiveness

**What to explain:**
> "This is a working prototype demonstrating the workflow. In the production version, your data will be saved, you can manage multiple teams, track progress over time, and parents can access reports. Right now, focus on: Does this workflow fit your training sessions? Is it fast enough? Do the reports make sense?"

**What to ask:**
1. Is the evaluation process fast enough?
2. Are 3 criteria enough per session?
3. Do the reports capture what parents want to know?
4. Would you pay R$50-150/month for this?
5. Do you coach other sports besides futsal?
6. What's missing that you absolutely need?

---

### Development Timeline Post-Friday

**If Fernanda validates:**

**Week 1-2 (Dec):**
- [ ] Set up Supabase
- [ ] Implement authentication
- [ ] Database schema + migrations

**Week 3-4 (Dec-Jan):**
- [ ] Session history
- [ ] Multi-team support
- [ ] Player management

**Week 5-6 (Jan):**
- [ ] Attendance tracking
- [ ] Enhanced profiles
- [ ] Testing with Fernanda's students

**Week 7-8 (Jan-Feb):**
- [ ] Bug fixes from real usage
- [ ] Performance optimization
- [ ] Prepare for beta launch

**Month 3+ (Feb-Mar):**
- [ ] Parent portal (Phase 3)
- [ ] Payment integration
- [ ] Start monetization

---

### Tech Stack Summary

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)
- Recharts (charts)

**Backend/Database (To Add):**
- Supabase (PostgreSQL + Auth + Storage)
- Vercel Serverless Functions (API endpoints)

**AI/ML:**
- Google Gemini 2.5 Flash (analysis)

**Deployment:**
- Vercel (hosting + CDN)
- GitHub (version control)
- GitHub Actions (CI/CD - future)

**Payment (Phase 3):**
- Stripe or PagSeguro (Brazilian market)

**Analytics (Future):**
- Vercel Analytics
- PostHog or Mixpanel

---

## 🎯 Roadmap Overview

```
v1.0 MVP ────────> v1.5 Essential ────────> v2.0 Professional ────────> v3.0 Enterprise
(Complete)        (Q1 2026)                (Q2 2026)                   (Q3-Q4 2026)
```

---

## 🚀 Phase 1: Essential Features (v1.5)
**Target:** Q1 2026 | **Goal:** Make it production-ready for multiple coaches

### 1.1 Session History & Progress Tracking
**Priority:** 🔥 CRITICAL

**Features:**
- [ ] Session list view with filters (date, team, criteria)
- [ ] Session detail page showing:
  - Duration, date, location
  - Which valences were evaluated
  - Average team scores
  - Notes/comments
- [ ] Player progress timeline
  - Score evolution graphs per valence
  - Before/after comparisons
  - Improvement percentage calculations
- [ ] Progress reports showing:
  - "Short Pass: 2.5 → 4.0 in 3 weeks (+60%)"
  - Best improvement areas
  - Stagnant areas needing attention

**Why Critical:** Parents want to see progress over time. "My kid is improving" = easier to sell premium reports.

**Technical Considerations:**
- Need persistent storage (currently in-memory)
- Database options: Firebase, Supabase, or local IndexedDB
- Data migration strategy for existing sessions

**Estimated Effort:** 2-3 weeks

---

### 1.2 Attendance & Availability Tracking
**Priority:** 🔥 CRITICAL

**Features:**
- [ ] Mark players present/absent at session start
- [ ] Attendance rate dashboard (per player, per team)
- [ ] Filter players by:
  - Active/Inactive status
  - Available/Injured/Suspended
- [ ] Session capacity planning:
  - "Expected: 20 players, Confirmed: 15"
- [ ] Absence reasons tracking (injury, illness, personal)
- [ ] Automated alerts for low attendance patterns

**Why Critical:** Can't evaluate players who aren't there. Affects team planning and parent expectations.

**Use Cases:**
- Skip absent players during evaluation
- Don't include absent players in team averages
- Track which players are consistently missing

**Estimated Effort:** 1-2 weeks

---

### 1.3 Multi-Team Management
**Priority:** 🔥 HIGH

**Features:**
- [ ] Team selector on dashboard
- [ ] Create/edit/archive teams
- [ ] Team-specific settings:
  - Default valences
  - Training schedule
  - Location/venue
- [ ] Quick switch between teams
- [ ] Cross-team comparison reports
- [ ] Coach can manage multiple age groups (U-11, U-13, U-15)

**Why Important:** From meeting: *"necessidade de um calendário para gerenciar múltiplos times em diferentes locais"*

**Technical Considerations:**
- Update App.tsx to support team switching
- Persist selected team in localStorage
- Filter all data by teamId

**Estimated Effort:** 1 week

---

### 1.4 Photo Upload & Enhanced Player Profiles
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] Upload actual player photos (replace picsum placeholders)
- [ ] Extended player profile:
  - Birth date (auto-calculate age)
  - Emergency contact
  - Medical notes (allergies, conditions)
  - Parent contact info (email, phone)
  - Jersey number history
  - Height/weight tracking
  - Date joined team
- [ ] Player profile editing interface
- [ ] CSV import for bulk player creation

**Why Important:** Professional apps need real data. Parent contact info essential for premium report sales.

**Technical Considerations:**
- Image storage (Firebase Storage, Cloudinary, or S3)
- Image optimization/compression
- LGPD compliance for personal data

**Estimated Effort:** 1-2 weeks

---

### 1.5 Team-Wide Analytics Dashboard
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] Team overview showing:
  - Average scores per valence
  - Team strengths (green) / weaknesses (red)
  - Improvement trends over time
- [ ] Position analysis:
  - Compare all Fixos, all Alas, etc.
  - Best performer per position
- [ ] Squad depth matrix:
  - Who can play which positions
  - Coverage gaps identification
- [ ] Top/bottom performers lists
- [ ] Suggested training focus based on team data

**Why Important:** Coach needs to answer: "What should we work on next training?"

**Estimated Effort:** 2 weeks

---

## 📱 Phase 2: Professional Features (v2.0)
**Target:** Q2 2026 | **Goal:** Differentiate from competition, increase retention

### 2.1 Session Templates & Planning
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] Save session configurations as templates
  - "Technical Tuesday": Short Pass, Dribbling, Finishing
  - "Tactical Thursday": Positioning, Transitions
- [ ] Pre-plan sessions for the week/month
- [ ] Calendar view of planned sessions
- [ ] Session notes field:
  - Drills performed
  - Weather conditions
  - Field quality
  - Special events
- [ ] Link evaluations to drills from Drill Library
- [ ] Template marketplace (coaches share templates)

**Use Case:** Track if specific drills improve specific valences over time.

**Estimated Effort:** 2 weeks

---

### 2.2 Custom Valences
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] Coach can create custom evaluation criteria
- [ ] Position-specific valences:
  - Goalkeeper: Reflexes, Distribution, Positioning
  - Fixo: Defensive Coverage, Build-up Play
- [ ] Age-appropriate criteria sets (U-11 vs U-15)
- [ ] Save custom valence sets
- [ ] Share valence sets with other coaches
- [ ] Import/export valence configurations

**Why Important:** Different coaches have different philosophies and needs.

**Technical Considerations:**
- Extend Valence type to allow custom entries
- Validate uniqueness
- Handle deleted valences in historical data

**Estimated Effort:** 1-2 weeks

---

### 2.3 Enhanced Export & Reporting
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] PDF exports (prettier than .txt)
- [ ] Custom report branding:
  - Club logo
  - Coach photo/signature
  - Custom color schemes
- [ ] Batch export (all players at once)
- [ ] Email reports directly to parents
- [ ] WhatsApp integration (send via API)
- [ ] Print-ready certificates
- [ ] Export to Excel/CSV for analysis

**Why Important:** Professional presentation increases perceived value for premium reports.

**Estimated Effort:** 2 weeks

---

### 2.4 Bulk Actions & Productivity Features
**Priority:** 🟢 LOW

**Features:**
- [ ] Copy scores to multiple players
- [ ] Bulk mark as "Not evaluated"
- [ ] Quick presets ("All 3s", "All 4s")
- [ ] Compare two players side-by-side
- [ ] Keyboard shortcuts for scoring (1-5 keys)
- [ ] Undo/redo functionality
- [ ] Auto-save drafts

**Why Important:** Speed up workflows even more for large teams.

**Estimated Effort:** 1 week

---

### 2.5 Drill Library Enhancements
**Priority:** 🟢 LOW

**Features:**
- [ ] Drill categories and tagging
- [ ] Search and filter drills
- [ ] Link drills to valences they improve
- [ ] Upload drill diagrams/videos
- [ ] Rate drills (effectiveness)
- [ ] Save favorite drills
- [ ] Create custom drill collections
- [ ] AI drill suggestions based on team weaknesses

**Estimated Effort:** 2 weeks

---

### 2.6 Multi-Sport Support 🌟 GAME CHANGER
**Priority:** 🔥 HIGH

**Vision:** Expand from futsal-only to a universal platform for all youth sports.

**Why Game Changer:**
- **10-20x Market Expansion:** From 50k futsal coaches to 500k+ coaches across all sports
- **Network Effects:** Football coach refers volleyball coach
- **Cross-Sport Clubs:** Many academies teach multiple sports
- **Competitive Moat:** Not a niche futsal app, but THE youth sports platform
- **Investor Appeal:** Bigger vision, bigger opportunity

**Sports to Support (Priority Order):**

**Tier 1 (Next):**
- [ ] ⚽ **Football/Soccer** - Biggest market in Brazil, similar to futsal
  - Positions: GK, Defender, Midfielder, Winger, Striker, etc.
  - 11 players on field
  - Similar valences to futsal

**Tier 2 (Following):**
- [ ] 🏐 **Volleyball** - Very popular in Brazil
  - Positions: Setter, Outside Hitter, Middle Blocker, Libero, Opposite
  - 6 players on court
  - Valences: Serving, Reception, Blocking, Attack, Defense
  
- [ ] 🏀 **Basketball** - Growing youth market
  - Positions: Point Guard, Shooting Guard, Small/Power Forward, Center
  - 5 players on court
  - Valences: Shooting, Dribbling, Passing, Rebounding, Defense

**Tier 3 (Future):**
- [ ] 🤾 **Handball** - Popular in schools
- [ ] 🎾 **Tennis** - Individual sport model
- [ ] 🏊 **Swimming** - Individual, by stroke
- [ ] ⚾ **Baseball** - Growing in Brazil
- [ ] 🥋 **Martial Arts** - Belt progression tracking

**Core Features:**

**Sport Selection:**
- [ ] Choose sport when creating team
- [ ] Sport-specific configurations loaded dynamically
- [ ] Visual sport selector with icons

**Dynamic Position System:**
```typescript
interface Team {
  id: string;
  name: string;
  sport: SportType; // NEW
  category: string;
  players: Player[];
}

type SportType = "Futsal" | "Football" | "Volleyball" | "Basketball" | "Handball" | "Tennis" | ...;
```

**Sport Configuration System:**
- [ ] Create `sportConfigs.ts` with configurations per sport:
  - Available positions
  - Default valences
  - Team size (5 for futsal, 11 for football, etc.)
  - Terminology (quadra/campo/piscina, jogo/partida)
- [ ] Dynamic loading based on team.sport
- [ ] Sport-specific report templates

**Example Configuration:**
```typescript
const SPORT_CONFIGS = {
  futsal: {
    name: "Futsal",
    positions: ["Goalkeeper", "Fixo", "Ala Left", "Ala Right", "Pivo"],
    defaultValences: [...], // Current futsal valences
    teamSize: 5,
    venue: "quadra",
    matchTerm: "jogo"
  },
  football: {
    name: "Futebol",
    positions: ["Goalkeeper", "Defender", "Midfielder", "Winger", "Striker"],
    defaultValences: [...], // Similar but adapted
    teamSize: 11,
    venue: "campo",
    matchTerm: "partida"
  },
  volleyball: {
    name: "Vôlei",
    positions: ["Levantador", "Ponteiro", "Central", "Líbero", "Oposto"],
    defaultValences: [
      { name: "Saque", category: "Technical" },
      { name: "Recepção", category: "Technical" },
      { name: "Ataque", category: "Technical" },
      { name: "Bloqueio", category: "Technical" },
      { name: "Defesa", category: "Tactical" },
      { name: "Posicionamento", category: "Tactical" }
    ],
    teamSize: 6,
    venue: "quadra",
    matchTerm: "set/partida"
  }
}
```

**UI/UX Changes:**
- [ ] Sport icon/badge on team cards
- [ ] Sport filter on dashboard ("Show only Football teams")
- [ ] Sport-appropriate imagery and colors
- [ ] Multi-sport onboarding ("What sport do you coach?")

**Technical Architecture:**
- [ ] Refactor `constants.ts` to be dynamic (move to database/config)
- [ ] Update `types.ts` with SportType and SportConfig
- [ ] Modify `SessionSetup.tsx` to load valences based on sport
- [ ] Update `ActiveSession.tsx` to use sport-specific terminology
- [ ] Adapt `Reports.tsx` for sport-specific language
- [ ] Database schema includes `sport` field on teams

**Data Migration:**
- [ ] Existing teams automatically tagged as "Futsal"
- [ ] Backwards compatibility maintained
- [ ] No breaking changes to current users

**Marketplace & Community:**
- [ ] Sport-specific valence templates
- [ ] Share configurations across sports
- [ ] Coach community by sport
- [ ] Cross-sport best practices

**Go-to-Market Strategy:**

**Phase 1: Launch Futsal (Current)**
- Validate model with Fernanda
- Perfect the experience
- Build case studies
- Position as "Starting with Futsal"

**Phase 2: Add Football (3-6 months after launch)**
- Biggest market opportunity
- Natural expansion from futsal
- Many futsal coaches also coach football
- Marketing: "Now for Football too!"

**Phase 3: Add Volleyball & Basketball (6-12 months)**
- Prove multi-sport flexibility
- Different enough to test adaptability
- Marketing: "BaseCoach - For every sport"

**Phase 4: Open Platform (Year 2)**
- Any sport can be configured
- Coach-created sport templates
- Template approval/curation system
- Marketing: "Your sport, your way"

**Business Impact:**

| Metric | Futsal Only | Multi-Sport |
|--------|-------------|-------------|
| Addressable Market (Coaches) | ~50k | ~500k+ |
| Market Multiplier | 1x | **10-20x** |
| Monthly Revenue Potential | R$150k | R$3M+ |
| Cross-sell Opportunity | None | High |
| Network Effects | Limited | Strong |
| Investor Appeal | Niche | Platform |

**Why Important:**
- Not just a feature, it's a **strategic pivot**
- Changes positioning from "futsal tool" to "sports platform"
- Unlocks massive market opportunity
- Builds stronger competitive moat
- Enables future categories (esports, chess, music, etc.)

**Technical Considerations:**
- Build sport-agnostic from day 1 (even if only futsal launches)
- Database schema supports multiple sports
- UI components are configurable
- Don't hardcode sport-specific logic
- Think: "How would volleyball work?" when building futsal features

**Risks & Mitigation:**
- **Risk:** Trying to be everything to everyone
  - **Mitigation:** Launch one sport at a time, perfect each
- **Risk:** Different sports have very different needs
  - **Mitigation:** Start with similar sports (futsal → football → handball)
- **Risk:** Diluting the brand
  - **Mitigation:** Strong positioning as "THE youth sports platform"

**Success Metrics:**
- [ ] At least 3 sports supported by end of Year 1
- [ ] 30%+ of users coaching multiple sports on the platform
- [ ] Cross-sport referral rate > 25%
- [ ] Sport-specific Net Promoter Score > 50 for each sport

**Estimated Effort:** 
- Core multi-sport infrastructure: 3-4 weeks
- Each additional sport configuration: 1-2 weeks
- Testing and refinement: 2 weeks
- **Total for Football + Volleyball + Basketball:** 8-10 weeks

---

## 💰 Phase 3: Business Model & Parent Portal (v2.5)
**Target:** Q2-Q3 2026 | **Goal:** Automate monetization, recurring revenue

### 3.1 Parent Portal 🌟 GAME CHANGER
**Priority:** 🔥 CRITICAL

**Features:**
- [ ] Parent registration/login system
- [ ] Parent dashboard showing:
  - Their child's latest evaluations
  - Progress graphs over time
  - Training attendance
  - Upcoming sessions
- [ ] Push notifications:
  - "New evaluation available!"
  - "Session tomorrow at 18:00"
- [ ] In-app report purchases:
  - Parent buys premium report (R$20-30)
  - Automatic payment processing
  - Coach gets 70%, App gets 30%
- [ ] Subscription option (R$10/month per parent)
- [ ] Privacy: Parents only see their own child
- [ ] Multi-child support (family account)

**Why Game Changer:** 
- Eliminates coach's sales overhead
- Recurring revenue stream
- Direct parent engagement
- Automated payment collection

**Technical Requirements:**
- User authentication system
- Payment integration (Stripe, PagSeguro, Mercado Pago)
- Email notifications
- Mobile responsive parent interface

**Estimated Effort:** 4-6 weeks

---

### 3.2 Tiered Pricing & Subscriptions
**Priority:** 🔥 HIGH

**Pricing Structure:**

**Free Tier:**
- 1 team, max 15 players
- 5 sessions per month
- Basic evaluations only
- No exports
- Watermarked reports

**Coach Basic (R$50/month):**
- 3 teams, unlimited players
- Unlimited sessions
- Full evaluation system
- Text report exports
- Email support

**Coach Premium (R$150/month):**
- Unlimited teams
- Professional branded reports
- AI analysis unlimited
- Custom valences
- Parent portal access
- Priority support
- Commission on parent purchases

**Enterprise (R$500/month+):**
- Multi-coach accounts
- Bulk parent accounts
- Custom branding
- API access
- Dedicated support
- White-label option

**Features to Implement:**
- [ ] Subscription management system
- [ ] Payment processing integration
- [ ] Feature gating based on plan
- [ ] Usage tracking and limits
- [ ] Upgrade/downgrade flows
- [ ] Billing dashboard

**Estimated Effort:** 3-4 weeks

---

### 3.3 Payment & Transaction System
**Priority:** 🔥 HIGH

**Features:**
- [ ] Stripe/PagSeguro integration
- [ ] Invoice generation
- [ ] Revenue dashboard for coaches:
  - Monthly earnings
  - Report sales tracking
  - Commission breakdown
- [ ] Payout management
- [ ] Transaction history
- [ ] Refund handling
- [ ] Tax compliance (NF-e generation for Brazil)

**Estimated Effort:** 3-4 weeks

---

## 🎮 Phase 4: Match Analysis & Advanced Features (v3.0)
**Target:** Q3-Q4 2026 | **Goal:** "Super hiper ultra mega power" version

### 4.1 Match Analysis Mode
**Priority:** 🟡 MEDIUM

From meeting: *"deixar as funcionalidades de jogo para uma versão super hiper ultra mega power no futuro"*

**Features:**
- [ ] Match-specific evaluation mode
- [ ] Different criteria for matches vs training
- [ ] Real-time scoring during games
- [ ] Match events tracking:
  - Goals, assists, saves
  - Yellow/red cards
  - Substitutions
- [ ] Post-match statistics
- [ ] Opposition scouting (evaluate opponent)
- [ ] Match preparation checklist
- [ ] Video timestamp markers
- [ ] Heat maps and positioning data

**Estimated Effort:** 4-6 weeks

---

### 4.2 Federation & Competition Integration
**Priority:** 🟢 LOW

From meeting: *"integrar métricas do time e resultados anteriores, possivelmente disponíveis no site da FPFS"*

**Features:**
- [ ] FPFS (Federação Paulista) data integration
- [ ] Import match results
- [ ] Competition standings tracker
- [ ] Opponent analysis based on federation data
- [ ] Win probability calculator
- [ ] Strength of schedule analysis
- [ ] Export data to federation formats

**Estimated Effort:** 3-4 weeks

---

### 4.3 Advanced AI Features
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] AI suggests which valences to evaluate:
  - Based on recent weaknesses
  - Based on upcoming opponent
  - Based on training periodization
- [ ] Auto-evaluation from video:
  - Upload training footage
  - AI scores basic metrics
  - Coach reviews and adjusts
- [ ] AI Coach Assistant chatbot:
  - "Which drills improve Short Pass?"
  - "How is Lucas vs his peers?"
  - Generate personalized training plans
- [ ] Predictive analytics:
  - Injury risk based on load
  - Performance predictions
  - Talent identification

**Technical Requirements:**
- Advanced Gemini API usage
- Video processing (Google Cloud Vision)
- ML model training for sport-specific analysis

**Estimated Effort:** 6-8 weeks

---

### 4.4 Gamification for Players
**Priority:** 🟢 LOW

**Features:**
- [ ] Player-facing app/interface
- [ ] Age-appropriate UI for kids
- [ ] Personal dashboard with scores
- [ ] Achievements/badges system:
  - "Hat Trick" - 3 sessions with 5/5
  - "Steady Improver" - Consistent progress
  - "Team Player" - High tactical scores
- [ ] Leaderboards (friendly competition)
- [ ] XP/points for improvement
- [ ] Player of the Week recognition
- [ ] Personal goal setting
- [ ] Motivational challenges

**Why Important:** Increases engagement, makes evaluation feel positive, kids love games.

**Estimated Effort:** 3-4 weeks

---

## 🔧 Phase 5: Enterprise & Infrastructure (v3.5+)
**Target:** 2027 | **Goal:** Scale to clubs and organizations

### 5.1 Administrative System Integration
**Priority:** 🟡 MEDIUM

From meeting: Fernanda uses Hércules Technology (R$130/month + R$0.50/transaction)

**Opportunity:** Replace or integrate with existing admin systems

**Features:**
- [ ] Student enrollment management
- [ ] Recurring payment processing
- [ ] Class/turma management
- [ ] Court/quadra reservation system
- [ ] Inventory management
- [ ] WhatsApp integration
- [ ] Parent portal for payments
- [ ] Financial reporting
- [ ] Automated billing
- [ ] Trial class scheduling

**Why Important:** 
- Fernanda pays R$130/month + ~R$1000-1500 in transaction fees
- Opportunity for all-in-one platform
- Higher customer lifetime value

**Estimated Effort:** 8-12 weeks

---

### 5.2 Multi-Coach & Club Accounts
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] Club admin dashboard
- [ ] Multiple coaches per club
- [ ] Permission levels:
  - Club admin
  - Head coach
  - Assistant coach
  - Observer
- [ ] Shared player database
- [ ] Cross-coach collaboration
- [ ] Evaluation comments/notes
- [ ] Disagreement resolution
- [ ] Club-wide reporting
- [ ] Resource sharing (drills, templates)

**Estimated Effort:** 3-4 weeks

---

### 5.3 API & Integrations
**Priority:** 🟢 LOW

**Features:**
- [ ] REST API for third-party integrations
- [ ] Webhooks for events
- [ ] Zapier integration
- [ ] Google Calendar sync
- [ ] WhatsApp Business API
- [ ] Email service integration (SendGrid)
- [ ] SMS notifications
- [ ] Zoom/Meet integration for remote coaching

**Estimated Effort:** 4-6 weeks

---

### 5.4 Data & Analytics Platform
**Priority:** 🟢 LOW

**Features:**
- [ ] Advanced analytics dashboard
- [ ] Custom report builder
- [ ] Data export (CSV, Excel, JSON)
- [ ] Data visualization tools
- [ ] Benchmarking data:
  - Regional averages
  - Age-group standards
  - Position benchmarks
- [ ] Peer comparison
- [ ] Correlation analysis
- [ ] Predictive modeling
- [ ] Data science API

**Estimated Effort:** 4-6 weeks

---

## 🎨 Phase 6: UX/UI & Accessibility
**Ongoing** | **Goal:** Best-in-class user experience

### 6.1 Mobile Experience Enhancements
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] Native mobile apps (iOS/Android)
- [ ] Offline mode with sync
- [ ] Tablet-optimized layouts
- [ ] Dark mode
- [ ] Haptic feedback
- [ ] Better outdoor visibility (high contrast)
- [ ] Left-handed mode
- [ ] Gesture customization
- [ ] Voice commands
- [ ] Apple Watch companion app

**Estimated Effort:** 6-8 weeks for native apps

---

### 6.2 Accessibility & Internationalization
**Priority:** 🟢 LOW

**Features:**
- [ ] Spanish translation (LATAM expansion)
- [ ] English version (global market)
- [ ] Screen reader support (WCAG AA)
- [ ] High contrast mode
- [ ] Adjustable font sizes
- [ ] Color-blind friendly palettes
- [ ] Keyboard navigation improvements
- [ ] RTL language support

**Estimated Effort:** 2-3 weeks per language

---

### 6.3 Onboarding & Support
**Priority:** 🟡 MEDIUM

**Features:**
- [ ] Interactive tutorial on first launch
- [ ] Video guides for each feature
- [ ] In-app help center
- [ ] Live chat support
- [ ] FAQ section
- [ ] Sample data playground
- [ ] Certification program
- [ ] Coach community forum
- [ ] Webinar training sessions

**Estimated Effort:** 2-3 weeks

---

## 🔒 Phase 7: Security & Compliance
**Ongoing** | **Goal:** Enterprise-ready security

### 7.1 Data Security
**Priority:** 🔥 CRITICAL

**Features:**
- [ ] LGPD compliance (Brazilian data protection)
- [ ] Parental consent for minors
- [ ] Data encryption at rest
- [ ] Encryption in transit (HTTPS)
- [ ] Two-factor authentication
- [ ] Role-based access control
- [ ] Audit logs
- [ ] Data retention policies
- [ ] Right to be forgotten
- [ ] Data export/portability

**Estimated Effort:** 3-4 weeks

---

### 7.2 Backup & Disaster Recovery
**Priority:** 🔥 HIGH

**Features:**
- [ ] Automated daily backups
- [ ] Point-in-time recovery
- [ ] Multi-region redundancy
- [ ] Disaster recovery plan
- [ ] Data migration tools
- [ ] Version control for data

**Estimated Effort:** 2 weeks

---

## 🎯 Quick Wins (Can Implement Anytime)

### Low-Hanging Fruit:
- [ ] **Session notes field** - 2 hours
- [ ] **Dark mode toggle** - 4 hours
- [ ] **Keyboard shortcuts (1-5 for scoring)** - 2 hours
- [ ] **Undo last evaluation** - 4 hours
- [ ] **Quick filter on dashboard** - 3 hours
- [ ] **Player search/filter** - 3 hours
- [ ] **Session duration target** - 2 hours
- [ ] **Export session as JSON** - 2 hours
- [ ] **Print view for reports** - 4 hours
- [ ] **Team stats on dashboard** - 4 hours

---

## 🚫 Out of Scope (Nice but Too Ambitious)

- AR/VR training scenarios
- Wearable device integration (heart rate, GPS)
- Blockchain certificates/NFTs
- Live streaming platform
- Nutrition tracking integration
- Mental health assessments
- Genetic testing integration
- Professional scouting network

---

## 📊 Success Metrics by Phase

### Phase 1 (v1.5):
- [ ] 10+ active coaches using the app
- [ ] 200+ players in system
- [ ] 500+ sessions completed
- [ ] Average session time < 30 minutes
- [ ] 4.5/5 satisfaction rating

### Phase 2 (v2.0):
- [ ] 50+ active coaches
- [ ] 1000+ players
- [ ] 20+ custom valences created
- [ ] 80% retention rate (month-over-month)
- [ ] **Multi-Sport:** Football support launched
- [ ] **Multi-Sport:** At least 10% of users coaching football

### Phase 3 (v2.5):
- [ ] 100+ paying coaches
- [ ] 500+ active parent accounts
- [ ] R$50k+ monthly recurring revenue
- [ ] 100+ premium reports sold/month
- [ ] **Multi-Sport:** 3+ sports supported (Futsal, Football, Volleyball)
- [ ] **Multi-Sport:** 30%+ users managing multiple sports

### Phase 4 (v3.0):
- [ ] 500+ coaches
- [ ] 10,000+ players across all sports
- [ ] 1000+ matches analyzed
- [ ] **Multi-Sport:** 5+ sports supported
- [ ] **Multi-Sport:** Market leader in LATAM youth sports coaching (not just futsal)
- [ ] **Multi-Sport:** Sport distribution: 40% futsal, 40% football, 20% other sports

---

## 💡 Innovation Ideas for Future

### Voice Assistant Integration:
"Hey Coach, show me Lucas's progress in Short Pass"

### Wearable Integration:
Smart vests track movement, app combines with coach evaluation

### Video Analysis:
Upload game footage, AI generates tactical heatmaps

### Social Features:
Coaches share best practices, drill libraries, success stories

### Marketplace:
- Buy/sell drill collections
- Hire certified coaches
- Equipment recommendations

### Certification:
"BaseCoach Certified Coach" training program with badge

---

## 🎨 Branding & Positioning (BaseCoach)

### Product Name Evolution:
**From:** FutsalPro Coach (v1.0 MVP)  
**To:** BaseCoach (v1.5+)

### Why BaseCoach?

**Double Meaning Power:**
1. **"Base"** in Portuguese = Youth/foundation sports categories
2. **"Base"** in Tech = Database, foundation, core platform
3. Universal across all sports (not sport-specific)
4. Enterprise-ready naming convention

**"Coach"** = Universal term that works in Portuguese without translation

### Brand Positioning:

**Tagline Options:**
1. "A plataforma de avaliação para esportes de base" (The evaluation platform for youth sports)
2. "Desenvolva atletas em qualquer esporte" (Develop athletes in any sport)
3. "Da base ao alto rendimento" (From youth to high performance)
4. "Todo esporte, uma plataforma" (Every sport, one platform)

**Recommended:** "A plataforma de avaliação para esportes de base"

### Elevator Pitch (Portuguese):
> "BaseCoach é a principal plataforma de avaliação para treinadores de esportes de base no Brasil. Começamos com futsal, onde ajudamos treinadores a avaliar mais de 20 atletas em menos de 30 minutos e gerar relatórios profissionais automaticamente. Nossa visão é expandir para todos os esportes de base - futebol, vôlei, basquete e além - tornando-nos A plataforma definitiva para desenvolvimento de atletas jovens."

### Elevator Pitch (English):
> "BaseCoach is the leading youth sports evaluation platform helping coaches in Brazil and LATAM quickly assess athletes, track progress, and generate professional reports. We're starting with futsal - where coaches evaluate 20+ players in under 30 minutes - and expanding to all youth sports: football, volleyball, basketball, and beyond. Think Spotify for coaching - one platform for every sport."

### Positioning Statement:
> "For youth sports coaches who need to evaluate many athletes efficiently, BaseCoach is the evaluation platform that transforms training sessions into actionable data and professional reports. Unlike generic sports apps or manual spreadsheets, BaseCoach is purpose-built for the unique needs of Brazilian youth sports, starting with futsal and expanding to all sports."

### Competitive Positioning:

**vs. Manual Methods (Pen & Paper):**
- 60% faster evaluation
- Professional, shareable reports
- Progress tracking over time
- Data-driven insights

**vs. Generic Sports Apps:**
- Purpose-built for youth sports
- Portuguese-first experience
- Optimized for Brazilian market
- Multi-sport from the ground up

**vs. Single-Sport Tools:**
- One platform for all your teams
- Cross-sport insights
- Better value (one subscription)
- Network effects

**vs. Enterprise Solutions (SAP, etc.):**
- Easy to use (no training needed)
- Affordable (not enterprise pricing)
- Mobile-first (coaches are on the field)
- Built for coaches, not IT departments

### Visual Identity:

**Colors:**
- **Primary:** Deep Blue (#1E40AF) - Professional, trust, intelligence
- **Secondary:** Vibrant Green (#10B981) - Growth, youth, energy
- **Accent:** Orange (#F59E0B) - Action, enthusiasm, movement
- **Neutral:** Gray scale for text and backgrounds

**Logo Concept:**
- Abstract representation of multiple sports (ball, court, field)
- Could incorporate a foundation/building block metaphor
- Modern, clean, scalable
- Works in single color (for small sizes)

**Voice & Tone:**
- **Professional** but approachable
- **Data-driven** but human
- **Empowering** (coaches are the heroes)
- **Brazilian Portuguese** as primary language
- Supportive, encouraging, coach-to-coach

### Domain Strategy:

**Primary:**
- basecoach.app ⭐ (preferred - modern, app-focused)
- basecoach.sport (alternative)
- basecoach.com.br (Brazil market)

**Alternatives:**
- usebasecoach.com
- basecoachpro.com
- base.coach (expensive but premium)

### Social Media Handles:
- Instagram: @basecoach.app
- Twitter/X: @basecoach
- YouTube: BaseCoach Brasil
- LinkedIn: BaseCoach
- TikTok: @basecoach (for drill videos)

### Market Segmentation:

**Primary Market (Phase 1):**
- Futsal coaches in São Paulo, Rio, major cities
- Youth categories (U-11 to U-17)
- Independent coaches & small academies
- 100-500 target users first year

**Secondary Market (Phase 2):**
- Football coaches (same audience, bigger sport)
- Volleyball and basketball coaches
- Multi-sport academies
- 1000-5000 users year two

**Enterprise Market (Phase 3):**
- Large sports clubs with multiple teams
- Municipal sports programs
- School athletic programs
- 10,000+ users year three

### Go-to-Market Messaging:

**For Futsal Coaches (Now):**
"Pare de perder tempo com avaliações manuais. Com BaseCoach, você avalia 23 atletas em 30 minutos e gera relatórios profissionais automaticamente."
(Stop wasting time with manual evaluations. With BaseCoach, evaluate 23 athletes in 30 minutes and generate professional reports automatically.)

**For Multi-Sport Coaches (Later):**
"Um único app para todas as suas equipes. Futsal, futebol, vôlei - tudo em um lugar."
(One app for all your teams. Futsal, football, volleyball - all in one place.)

**For Parents (Phase 3):**
"Acompanhe o desenvolvimento do seu filho com relatórios profissionais e análise de progresso."
(Track your child's development with professional reports and progress analysis.)

**For Clubs (Enterprise):**
"A plataforma completa para gerenciar avaliações em todos os seus times e categorias."
(The complete platform to manage evaluations across all your teams and categories.)

### Success Metrics:

**Brand Awareness:**
- [ ] 1000+ Instagram followers (6 months)
- [ ] 100+ YouTube subscribers (6 months)
- [ ] Featured in 3+ sports media outlets (year 1)
- [ ] 50+ organic Google searches for "BaseCoach" per month

**Brand Perception:**
- [ ] Net Promoter Score > 50
- [ ] "Professional" association > 80%
- [ ] "Easy to use" association > 90%
- [ ] Brand recall > 60% among target audience

---

## 🎯 Recommended Next Steps

**For Friday Meeting with Fernanda:**
1. Demo current v1.0 MVP
2. Gather feedback on must-haves
3. Discuss which Phase 1 features to prioritize
4. Validate parent portal concept
5. Discuss pricing model
6. **Present multi-sport vision** (BaseCoach vs FutsalPro)
7. **Validate football expansion** - does she coach football too?
8. Get feedback on BaseCoach name

**Immediate Next Sprint (if approved):**
1. **Session History** (2 weeks)
2. **Attendance Tracking** (1 week)
3. **Multi-Team Support** (1 week)
4. **Optional:** Start multi-sport infrastructure (if Fernanda validates)

**First Month:**
Complete Phase 1 (v1.5) to make it production-ready

**First Quarter:**
Launch parent portal (v2.5) and start monetization

**Second Quarter:**
Launch football support if validated - test multi-sport thesis

**Long-term Vision:**
Position as THE youth sports platform in Brazil, not just futsal tool

---

## 📝 Notes & Assumptions

- All estimates assume single developer
- Estimates don't include testing/QA time (add 30%)
- Backend infrastructure needed (Firebase/Supabase)
- Payment processing requires legal entity setup
- Parent portal requires privacy policy and terms
- LGPD compliance essential before launch

---

## 🤝 Community & Support

Future community features:
- Coach forum
- Feature request voting
- Beta testing program
- Ambassador program
- Referral rewards

---

**Document Version:** 2.1 (Development Setup Added)
**Last Updated:** November 30, 2025
**Next Review:** After Friday meeting with Fernanda

**Key Changes in v2.1:**
- Added Development Setup & Technical Decisions section
- Database strategy (Supabase recommended)
- Git flow strategy (Simplified GitHub Flow)
- What's missing for production-ready MVP
- Development timeline post-Friday
- Tech stack summary
- Questions to ask Fernanda during demo

**Previous Changes (v2.0):**
- Rebranded from "FutsalPro Coach" to "BaseCoach"
- Added multi-sport expansion strategy (Section 2.6)
- Included branding & positioning section
- Updated success metrics for multi-sport
- Added market size analysis (10-20x expansion potential)

**Status:** 🟢 Ready to deploy and validate with Fernanda

