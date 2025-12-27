# Testing Guide - Base Coach

**Version:** 1.8.3  
**Last Updated:** December 21, 2025  
**Environment:** Development & Production

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd base-coach
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Support
NEXT_PUBLIC_SUPPORT_WHATSAPP=your_whatsapp_number
```

### 3. Run Development Server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

---

## 🧪 Testing Checklist

### ✅ **Authentication & Profile (v1.0.0 - v1.3.0)**

#### User Registration
**Steps:**
1. Navigate to the login page
2. Click "Criar nova conta"
3. Enter email, password, confirm password
4. Submit form

**Expected:**
- ✅ Email verification required message appears
- ✅ Verification email sent to inbox
- ✅ Cannot login until email verified
- ✅ Error messages in Portuguese

#### Email Verification
**Steps:**
1. Check email inbox
2. Click verification link
3. Redirected to app

**Expected:**
- ✅ User account activated
- ✅ Can now login
- ✅ Redirect to dashboard after login

#### Password Reset
**Steps:**
1. Click "Esqueci minha senha"
2. Enter email
3. Check email for reset link
4. Click link, enter new password
5. Submit

**Expected:**
- ✅ Reset email received
- ✅ Can set new password
- ✅ Auto-redirected to dashboard
- ✅ Can login with new password

#### Profile Management
**Steps:**
1. Navigate to Profile page
2. Upload profile picture
   - Test: Crop, zoom, resize
   - Test: Preview before save
3. Add bio (up to 500 characters)
4. Save changes

**Expected:**
- ✅ Image cropper works smoothly
- ✅ Circular preview shown
- ✅ Profile picture updates across app
- ✅ Bio saves correctly
- ✅ Character counter shows remaining chars

#### Account Deletion
**Steps:**
1. Navigate to Profile
2. Scroll to bottom
3. Click "Deletar Conta"
4. Confirm in modal
5. Re-authenticate if required

**Expected:**
- ✅ Strong confirmation warning shown
- ✅ All user data deleted (cascade)
- ✅ Logged out automatically
- ✅ Cannot login with deleted account

---

### ✅ **Team & Player Management (v1.2.0 - v1.3.0)**

#### Team Creation
**Steps:**
1. Navigate to "Times" tab
2. Click "Criar Novo Time"
3. Enter team name
4. Select sport (Futsal)
5. Add notes (optional)
6. Submit

**Expected:**
- ✅ Team created successfully
- ✅ Appears in team list
- ✅ Unique name validation (can't create duplicate)
- ✅ Empty state shows if no players

#### Category Creation
**Steps:**
1. Select a team
2. Click "Criar Categoria"
3. Enter name (e.g., "Sub-15")
4. Select gender (required)
5. Enter age group, season
6. Submit

**Expected:**
- ✅ Category created under team
- ✅ Gender field is mandatory
- ✅ Season validates (2020-2099)
- ✅ Category appears in list

#### Player Creation
**Steps:**
1. Navigate to a team
2. Click "Adicionar Atleta"
3. Enter player details:
   - Name (required)
   - Position (dropdown)
   - Jersey number (0-99)
   - Birth date
   - Category (optional)
4. Submit

**Expected:**
- ✅ Player created successfully
- ✅ Jersey number unique within team
- ✅ Birth date validates (5-50 years old)
- ✅ Position from predefined list
- ✅ Can assign to category or "Sem Categoria"

#### Edit Functionality
**Steps:**
1. Click edit icon on team/category/player
2. Modify fields
3. Save

**Expected:**
- ✅ All fields editable
- ✅ Validation still applies
- ✅ Changes save correctly
- ✅ UI updates immediately

#### Archive/Delete
**Steps:**
1. Archive a team/category/player
2. Check "Arquivados" view
3. Restore or permanently delete

**Expected:**
- ✅ Archived items moved to separate view
- ✅ Cascade archival (team → categories → players)
- ✅ Can restore within 7 days
- ✅ Auto-deleted after 7 days (pg_cron)
- ✅ Permanent delete requires strong confirmation

---

### ✅ **Session Evaluation (v1.0.0 - v1.8.3)**

#### Session Setup
**Steps:**
1. Click "Iniciar Nova Sessão" on Dashboard
2. Select team
3. Mark players present/absent
4. Select 1-3 evaluation criteria (valences)
   - Try selecting 1 → Should allow
   - Try selecting 2 → Should allow
   - Try selecting 3 → Should allow
   - Try selecting 4th → Should be disabled
5. Click "Iniciar Sessão"

**Expected:**
- ✅ Beautiful valence grid layout
- ✅ Grouped by category (Technical, Tactical, Physical, Mental)
- ✅ Counter shows "X of 3 criteria selected"
- ✅ Start button disabled if nothing selected
- ✅ Start button disabled if no players present

#### Active Session - Navigation
**Steps:**
1. In active session
2. Test navigation methods:

**Keyboard:**
- Press `→` (right arrow) → Next player
- Press `←` (left arrow) → Previous player

**Touch/Swipe (mobile/tablet):**
- Swipe left → Next player
- Swipe right → Previous player
- Minimum swipe distance: 50px

**Buttons:**
- Click left chevron `←`
- Click right chevron `→`

**Expected:**
- ✅ All navigation methods work smoothly
- ✅ Player info updates instantly
- ✅ Smooth transitions
- ✅ Swipe hint shown on mobile

#### Active Session - Scoring
**Steps:**
1. Score a player (0-5 for each valence)
2. Click numbers quickly
3. Navigate to next player
4. Check progress bar

**Expected:**
- ✅ Only selected valences shown (1-3, not all 8)
- ✅ Large touch targets (h-16 buttons)
- ✅ Selected score highlights in blue
- ✅ Can quickly tap/change scores
- ✅ Scores save immediately
- ✅ Progress bar updates ("Player X of Y")

#### Session Timer
**Steps:**
1. Check timer in top-left during session
2. Note format and counting

**Expected:**
- ✅ Timer format: MM:SS
- ✅ Counts up from 00:00
- ✅ Continues during player navigation
- ✅ Pauses/resumes correctly

#### Player Presence Control
**Steps:**
1. In session setup, mark some players absent
2. Start session
3. Verify only present players appear

**Expected:**
- ✅ Absent players skipped in evaluation
- ✅ Progress bar shows only present player count
- ✅ Attendance tracked in database

---

### ✅ **Reports & Analytics (v1.0.0 - v1.8.3)**

#### Individual Player Reports
**Steps:**
1. Complete at least one session
2. Navigate to "Relatórios"
3. Select a player from left panel
4. View generated report

**Expected:**
- ✅ Individual Report Card shown (blue gradient)
- ✅ Description: 200-300 characters (verify length)
- ✅ Strengths section (green) - scores ≥ 4.0
- ✅ Weaknesses section (orange) - scores ≤ 2.5
- ✅ Professional coaching language
- ✅ In Portuguese

#### Report Export
**Steps:**
1. Click Download icon (↓)
2. Check downloaded file
3. Open TXT file

**Expected:**
- ✅ File downloads successfully
- ✅ Filename: `relatorio_[PlayerName]_[Date].txt`
- ✅ Formatted report with sections
- ✅ Includes:
  - Header with player name, team, date
  - Description
  - Strengths (with ✓ bullets)
  - Weaknesses (with • bullets)
  - Footer with app name

#### Report Share
**Steps:**
1. Click Share icon (↗)
2. Test on mobile and desktop

**Expected:**
- ✅ Mobile: Native share sheet opens
- ✅ Desktop: Copied to clipboard
- ✅ Success message shown
- ✅ Can share via WhatsApp, email, etc.

#### AI Analysis
**Steps:**
1. In Reports view, select a player
2. Click "Análise com IA"
3. Wait for analysis (5-10 seconds)
4. Review feedback

**Expected:**
- ✅ Loading indicator shown
- ✅ AI generates constructive feedback (3 sentences)
- ✅ Based on player's actual scores
- ✅ Professional coaching language
- ✅ In Portuguese
- ✅ Appears below report card

#### Team Statistics
**Steps:**
1. Select "Visão do Time" in Reports
2. Review team-wide data

**Expected:**
- ✅ Average scores per valence
- ✅ Team strengths/weaknesses identified
- ✅ Charts and visualizations
- ✅ Session history
- ✅ Attendance statistics

---

### ✅ **Subscription System (v1.8.0 - v1.8.3)**

#### Free Tier Limits
**Steps:**
1. Create account (auto Free tier)
2. Try to create 2nd team
3. Try to add 16th player
4. Try to create 6th session in a month

**Expected:**
- ✅ Upgrade prompt appears at limits:
  - 1 team max
  - 15 players max
  - 5 sessions per month max
- ✅ Clear explanation of limits
- ✅ "Upgrade" button shown
- ✅ Cannot bypass limits

#### Trial System
**Steps:**
1. New user account (Free tier)
2. See trial modal or prompt
3. Click "Iniciar Teste Grátis"
4. Confirm trial start

**Expected:**
- ✅ Trial starts immediately
- ✅ 14 days from today
- ✅ Trial badge appears in header
- ✅ Countdown shows days remaining
- ✅ Pro features unlocked
- ✅ Trial tracked in database

#### Trial Expiration Warnings
**Steps:**
1. Simulate trial ending soon (modify database)
   - Set `trial_ends_at` to 7 days from now
   - Set to 3 days from now
   - Set to today
2. Login/refresh app

**Expected:**
- ✅ Modal shown at 7, 3, and 0 days remaining
- ✅ Clear explanation
- ✅ "Upgrade Now" button
- ✅ Can dismiss (shown once per day)
- ✅ At 0 days: Trial expired, features locked

#### Feature Gating
**Steps:**
1. As Free user, try to:
   - Use AI analysis (should be blocked)
   - Export premium PDF (should be blocked)
   - Create 4th team (should be blocked)
2. Upgrade to Pro
3. Retry blocked features

**Expected:**
- ✅ Free: Limited features with upgrade prompts
- ✅ Pro: Most features unlocked
- ✅ Premium: All features unlocked
- ✅ Clear messaging about what's locked

#### Subscription Management UI
**Steps:**
1. Navigate to Profile → Subscription
2. View current plan
3. See upgrade options

**Expected:**
- ✅ Current tier displayed with badge
- ✅ Features included listed
- ✅ Upgrade/downgrade buttons
- ✅ Trial status if applicable
- ✅ **Note:** Payment integration pending (v1.9.0)

---

### ✅ **Dashboard (v1.8.3 - Latest)**

#### Dynamic Greeting
**Steps:**
1. Login at different times of day
   - Morning (before 12pm)
   - Afternoon (12pm - 6pm)
   - Evening (after 6pm)

**Expected:**
- ✅ "Bom dia, Treinador!" (morning)
- ✅ "Boa tarde, Treinador!" (afternoon)
- ✅ "Boa noite, Treinador!" (evening)
- ✅ Subtitle shows session count or prompt

#### Stats Cards Interaction
**Steps:**
1. Click "Last Session" card
2. Click "Evaluations" card

**Expected:**
- ✅ Last Session: Opens session details modal
- ✅ Evaluations: Navigates to Reports page
- ✅ Hover effect shows cards are clickable
- ✅ Gradient backgrounds visible

#### Player Table - Quick Actions
**Steps:**
1. Hover over a player row
2. Click kebab menu (three dots)

**Expected:**
- ✅ Menu appears only on hover
- ✅ Smooth transition
- ✅ Clicking navigates to player reports
- ✅ **Future:** Dropdown with multiple actions

#### Recent Sessions - Visual Enhancements
**Steps:**
1. Review session cards on dashboard
2. Look for:
   - Color-coded pills
   - Performance indicators
   - Attendance data

**Expected:**
- ✅ Date/time separated clearly
- ✅ Pills color-coded:
  - 🟢 Emerald: Attendance
  - 🔵 Blue: Evaluations
  - 🟣 Purple: Criteria
  - 🟡 Amber: Duration
- ✅ "Ótima presença" badge if attendance ≥80%
- ✅ Clickable to open details

---

## 📱 Mobile Testing

### Essential Mobile Tests

#### Responsive Layout
**Test on:**
- iPhone (320px - 428px)
- Android (360px - 412px)
- Tablet (768px - 1024px)

**Expected:**
- ✅ All content fits without horizontal scroll
- ✅ Navigation menu adapts
- ✅ Touch targets ≥48px
- ✅ Text readable without zoom
- ✅ Images scale properly

#### Touch Gestures
**Steps:**
1. In Active Session, swipe left/right
2. In Reports, scroll lists
3. In Dashboard, tap cards

**Expected:**
- ✅ Swipe gestures work smoothly
- ✅ No accidental triggers
- ✅ Minimum 50px swipe distance
- ✅ Visual feedback on touch
- ✅ `active:scale-95` micro-interaction

#### Outdoor Visibility (High Contrast)
**Steps:**
1. View app on mobile in bright sunlight (or simulate)
2. Check Dashboard, Active Session, Reports

**Expected:**
- ✅ Text readable in direct sunlight
- ✅ High contrast colors used
- ✅ Primary text: `text-slate-900`
- ✅ No light gray text on white backgrounds
- ✅ Status badges clearly visible

#### Keyboard Behavior
**Steps:**
1. Fill out forms on mobile
2. Test input fields

**Expected:**
- ✅ Keyboard doesn't cover submit button
- ✅ Appropriate keyboard types (email, number, text)
- ✅ Can dismiss keyboard easily
- ✅ Form scrolls to focused input

---

## ⏱️ Performance Testing

### Speed Test: Evaluate 23 Players in Under 1 Hour

**Goal:** 23 players in 30-45 minutes

**Test Scenario:**
1. Start new session
2. Select team with 23 players
3. Mark all present
4. Select 3 valences
5. Start timer
6. Evaluate ALL players:
   - For each player:
     - Navigate (swipe or arrow key)
     - Rate 3 criteria (tap 3 buttons)
     - Move to next
7. Complete all 23 players
8. Stop timer

**Calculation:**
- 60 minutes ÷ 23 players = ~2.6 minutes per player max
- With 3 criteria: **Target < 1 minute per player**

**Expected:**
- ✅ Complete all 23 players in 30-45 minutes
- ✅ Fast navigation (< 1 second between players)
- ✅ Instant score registration
- ✅ No lag or delays

### Page Load Times
**Measure:**
- Dashboard: < 1 second
- Reports: < 2 seconds
- Session Setup: < 1 second
- Active Session: < 1 second

**Tools:**
- Chrome DevTools (Network tab)
- Lighthouse performance audit

**Expected:**
- ✅ All pages load quickly
- ✅ Skeleton loaders shown during load
- ✅ No blocking resources
- ✅ Images optimized

---

## 🐛 Common Issues & Solutions

### Issue: "No evaluation data"
**Solution:** Make sure you've completed at least one session with scores

### Issue: AI Analysis not working
**Solution:** 
- Check `GEMINI_API_KEY` in `.env.local`
- Verify API key is valid
- Check console for error messages
- Verify internet connection

### Issue: Swipe not working
**Solution:**
- Ensure you're on a touch device
- Swipe on main content area (not buttons)
- Swipe distance must be > 50px
- Try swiping faster

### Issue: Can't download report
**Solution:**
- Check browser download permissions
- Try different browser
- On mobile, allow downloads in settings
- Check available storage space

### Issue: Email verification not received
**Solution:**
- Check spam/junk folder
- Wait 5-10 minutes
- Verify email address is correct
- Request new verification email

### Issue: Images not uploading
**Solution:**
- Check file size (< 5MB recommended)
- Ensure correct format (JPG, PNG)
- Check browser permissions
- Clear browser cache

---

## 📊 Test Data

### Mock Data Available

**Teams:**
- Tigers Academy U-15
- Lions FC Sub-17

**Players (Example):**
1. Lucas Silva (#10 - Ala Left)
2. Matheus Costa (#5 - Fixo)
3. Gabriel Jesus (#9 - Pivo)
4. Rafael Santos (#1 - Goalkeeper)
5. Enzo Ferrari (#7 - Ala Right)
6. Bruno Guimaraes (#8 - Universal)

**Valences (8 total):**
- **Technical:** Short Pass, Finishing, Dribbling (1v1)
- **Tactical:** Defensive Transition, Offensive Transition, Positioning
- **Physical:** Intensity
- **Mental:** Focus

---

## 🔒 Security Testing

### Authentication Security
**Test:**
1. Try accessing protected routes without login
2. Try SQL injection in login form
3. Try XSS attacks in text fields
4. Test password requirements

**Expected:**
- ✅ Redirected to login if not authenticated
- ✅ SQL injection blocked
- ✅ XSS attempts sanitized
- ✅ Password minimum length enforced
- ✅ Session expires after inactivity

### Data Privacy (RLS)
**Test:**
1. Create two user accounts
2. As User A, create teams/players
3. As User B, try to access User A's data

**Expected:**
- ✅ User B cannot see User A's data
- ✅ API calls return empty or error
- ✅ Row Level Security policies enforced
- ✅ No data leakage between users

---

## 📸 Screenshots for Documentation

### Essential Screenshots
1. **Authentication:** Login, signup, email verification
2. **Dashboard:** Full view with stats cards, player table, sessions
3. **Session Setup:** Valence selection grid
4. **Active Session:** Large buttons, player info, timer
5. **Reports:** Individual report card with export/share
6. **Team Management:** Team list, categories, players
7. **Profile:** Profile picture, bio, subscription info
8. **Mobile Views:** Dashboard, Active Session on mobile

---

## ✨ Demo Script for Stakeholders

### Part 1: Setup & Overview (3 min)
> "BaseCoach is a futsal coaching app that helps you evaluate players quickly. 
> It started as FutsalPro and is now BaseCoach to support all youth sports.
> Let me show you the main workflow..."

### Part 2: Session Creation (5 min)
> "Before training, you choose up to 3 evaluation criteria to focus on.
> This makes evaluation much faster - you can assess 23 players in 30-45 minutes.
> You mark who's present, select your criteria, and start the session."

### Part 3: Live Evaluation (5 min)
> "During training, you quickly score each player on the 3 criteria.
> Notice the large buttons - easy to tap with your thumb.
> You can use keyboard arrows or swipe gestures to navigate.
> The timer tracks your session automatically."

### Part 4: Reports & AI (5 min)
> "After training, the system generates professional reports automatically.
> Each report is 200-300 characters - perfect for parents.
> You can download or share directly via WhatsApp.
> The AI can provide additional coaching insights."

### Part 5: Business Model (3 min)
> "There are 3 tiers: Free, Pro (R$49/month), and Premium (R$149/month).
> Free users get a 14-day Pro trial.
> Pro unlocks unlimited teams and AI analysis.
> Premium adds parent portal where they can buy reports."

---

## 🎯 Acceptance Criteria

### Before Production Launch

#### Critical (Must Pass)
- [ ] All authentication flows work
- [ ] Can create teams/categories/players
- [ ] Can complete full session evaluation
- [ ] Reports generate correctly
- [ ] Export/share works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] High contrast for outdoor use
- [ ] Touch targets ≥48px
- [ ] Payment integration complete (v1.9.0)

#### Important (Should Pass)
- [ ] AI analysis works reliably
- [ ] Trial system functions correctly
- [ ] Feature gating enforced
- [ ] Dashboard interactions smooth
- [ ] Keyboard navigation works
- [ ] Swipe gestures work
- [ ] Data exports correctly
- [ ] RLS policies secure

#### Nice to Have
- [ ] Load times < 1 second
- [ ] Lighthouse score > 90
- [ ] No accessibility warnings
- [ ] Offline mode (future)

---

## 📞 Testing Support

### Report Issues
- GitHub Issues: [repository]/issues
- Email: support@basecoach.app (pending)
- WhatsApp: (pending)

### Test Environment
- Development: `http://localhost:3000`
- Staging: (pending)
- Production: (pending)

---

## 📝 Test Coverage

**Current Coverage:**
- Authentication: ✅ 95%
- Team Management: ✅ 95%
- Session Evaluation: ✅ 90%
- Reports: ✅ 90%
- Subscription: ✅ 85%
- Dashboard: ✅ 100%
- Mobile: ✅ 90%

**Target Coverage:** 95%+ across all modules

---

## 🎉 Success Criteria

Before going live:
- [ ] Can evaluate 23 players in < 45 minutes
- [ ] All user flows work smoothly
- [ ] Mobile experience is excellent
- [ ] No critical bugs
- [ ] Performance is acceptable
- [ ] Security is validated
- [ ] Payment integration tested
- [ ] Beta coaches give positive feedback

---

**Document Version:** 3.0 (Consolidated)  
**Last Updated:** December 21, 2025  
**Status:** Comprehensive Testing Guide Ready

**Good luck with testing! 🚀**

If everything works, you're ready for beta launch!


