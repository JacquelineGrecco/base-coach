# 🚨 Critical Missing Features

This document tracks essential features that are missing from BaseCoach and should be prioritized after the subscription system is complete.

---

## 🎯 Priority 1 - Essential for Launch

### 1. ✅ Player Presence Control (Controle de Presença)
**Status:** NOT IMPLEMENTED  
**Estimated Time:** 8-12 hours  
**Gated Feature:** Yes (Pro+)

**Description:**  
Coaches need to track which players attended each training session. This is essential for:
- Understanding player commitment
- Making informed decisions about playing time
- Identifying patterns of absence
- Generating attendance reports

**Requirements:**
- [ ] Add presence tracking to session setup/active session
- [ ] Allow marking players as Present/Absent/Justified Absence
- [ ] Store attendance data in database (new `attendance` table)
- [ ] Display attendance stats in player profile (Reports page)
- [ ] Show attendance rate (%) for each player
- [ ] Add attendance filter to session history
- [ ] Export attendance data (CSV - Pro+)
- [ ] Generate attendance reports (PDF - Pro+)

**Database Schema:**
```sql
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'justified')),
  notes TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, player_id)
);

CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_player ON attendance(player_id);
CREATE INDEX idx_attendance_status ON attendance(status);
```

**UI Mockup:**
- Session Setup: Checkbox next to each player (Present by default)
- Active Session: Tap player card to toggle presence status
- Reports: Attendance section with stats and charts
- Dashboard: "Attendance Overview" widget (team-wide stats)

---

### 2. ⚠️ Session Notes & Player-Specific Notes
**Status:** PARTIALLY IMPLEMENTED (fields exist, UI incomplete)  
**Estimated Time:** 4-6 hours  
**Gated Feature:** No (Free)

**Description:**  
Coaches need to add notes during sessions for:
- General session observations
- Individual player feedback
- Injury tracking
- Special circumstances

**Requirements:**
- [ ] Complete UI for session notes (ActiveSession component)
- [ ] Complete UI for player-specific notes per evaluation
- [ ] Display notes in session details modal (Dashboard)
- [ ] Display notes in player history (Reports)
- [ ] Rich text editor for formatting (optional)
- [ ] Auto-save notes to prevent data loss

**Current Status:**
- ✅ Database fields exist (`sessions.notes`, `evaluations.notes`)
- ✅ Input fields in ActiveSession component
- ⚠️ Not fully integrated with UI/UX flow
- ❌ No display in reports

---

### 3. 🔔 Trial Expiration Warnings & Header Countdown
**Status:** NOT IMPLEMENTED  
**Estimated Time:** 3-4 hours  
**Gated Feature:** N/A (System feature)

**Description:**  
Users on trial need clear visibility of their trial status to encourage conversion.

**Requirements:**
- [ ] Show trial countdown in header ("12 dias restantes")
- [ ] Change color based on days left (green → yellow → red)
- [ ] Show modal 7 days before trial ends
- [ ] Show modal 3 days before trial ends
- [ ] Show modal on trial expiration day
- [ ] Auto-redirect to pricing page after trial ends
- [ ] Email notifications (7 days, 3 days, expired)

**UI Mockup:**
```
Header: [BaseCoach Logo] ... [🎁 Teste Pro: 12 dias restantes] [User Menu]
```

---

## 🎯 Priority 2 - Important for Growth

### 4. 📊 Team Statistics & Insights (Dashboard Widget)
**Status:** PARTIALLY IMPLEMENTED  
**Estimated Time:** 6-8 hours  
**Gated Feature:** Charts (Pro+)

**Description:**  
Dashboard should show high-level team metrics at a glance.

**Requirements:**
- [ ] Team-wide average performance by valence category
- [ ] Most improved players this month
- [ ] Attendance rate this month
- [ ] Sessions completed this month vs. last month
- [ ] Top performers by category (Technical, Physical, Tactical, Psychological)
- [ ] Charts/graphs for visual insights (Pro+)

---

### 5. 🔄 Session Templates (Save & Reuse)
**Status:** NOT IMPLEMENTED  
**Estimated Time:** 8-10 hours  
**Gated Feature:** Yes (Pro+)

**Description:**  
Coaches often run similar sessions (e.g., "Technical Drills - Passing", "Physical Conditioning"). Allow them to save session configurations as templates.

**Requirements:**
- [ ] Save session as template (team, category, valences, drills)
- [ ] Browse saved templates
- [ ] Quick-start session from template
- [ ] Edit/delete templates
- [ ] Share templates with other coaches (Premium+)

---

### 6. 📱 Progressive Web App (PWA) Improvements
**Status:** BASIC IMPLEMENTATION  
**Estimated Time:** 6-8 hours  
**Gated Feature:** No (Free)

**Description:**  
Improve mobile experience and offline capabilities.

**Requirements:**
- [ ] Service worker for offline mode
- [ ] Cache evaluations locally (sync when online)
- [ ] Better touch interactions (swipe, tap, hold)
- [ ] Optimize for small screens (< 375px)
- [ ] Add splash screen
- [ ] Add app shortcuts (Quick Actions)

---

### 7. 🎨 Custom Valences (User-Defined Criteria)
**Status:** NOT IMPLEMENTED  
**Estimated Time:** 10-12 hours  
**Gated Feature:** Yes (Premium+)

**Description:**  
Allow coaches to create custom evaluation criteria beyond the default valences.

**Requirements:**
- [ ] UI to create/edit custom valences
- [ ] Assign custom valences to categories
- [ ] Use custom valences in sessions
- [ ] Display custom valences in reports
- [ ] Import/export valence sets

---

## 🎯 Priority 3 - Nice to Have

### 8. 📧 Email Notifications & Digests
**Status:** NOT IMPLEMENTED  
**Estimated Time:** 12-16 hours  
**Gated Feature:** Yes (Pro+)

**Requirements:**
- [ ] Weekly performance digest
- [ ] Player milestone notifications (e.g., "João improved 20% this month!")
- [ ] Trial expiration reminders
- [ ] Session reminder (scheduled sessions)

---

### 9. 🔗 Share Reports with Parents/Players
**Status:** NOT IMPLEMENTED  
**Estimated Time:** 10-14 hours  
**Gated Feature:** Yes (Premium+)

**Requirements:**
- [ ] Generate shareable report link (time-limited token)
- [ ] Public report view (read-only, watermarked)
- [ ] Track who viewed the report
- [ ] Revoke access to shared reports

---

### 10. 📹 Video Analysis Integration
**Status:** NOT IMPLEMENTED  
**Estimated Time:** 20-30 hours  
**Gated Feature:** Yes (Enterprise)

**Requirements:**
- [ ] Upload video clips per player/session
- [ ] Annotate videos with timestamps
- [ ] Link videos to evaluations
- [ ] Store in Supabase Storage

---

## 📝 Implementation Priority Order

Based on user needs and business impact:

1. **Player Presence Control** (8-12h) - Essential for core product
2. **Session Notes UI Completion** (4-6h) - Quick win, high value
3. **Trial Countdown Header** (3-4h) - Critical for monetization
4. **Team Dashboard Stats** (6-8h) - Improves user engagement
5. **Session Templates** (8-10h) - High-value productivity feature
6. **PWA Improvements** (6-8h) - Better mobile UX
7. **Custom Valences** (10-12h) - Differentiator for Premium
8. **Email Notifications** (12-16h) - Retention tool
9. **Share Reports** (10-14h) - Viral growth potential
10. **Video Analysis** (20-30h) - Enterprise differentiator

---

## 🚀 Next Steps After Subscription System

1. **Finish Week 3 & 4** (Trial Flow, Team/Player Limits, Payment Integration)
2. **Review & Test Subscription System** (End-to-End Testing)
3. **Implement Priority 1 Features** (~15-22 hours total)
4. **Beta Testing with Real Coaches** (Get feedback)
5. **Implement Priority 2 Features Based on Feedback**
6. **Public Launch** 🎉

---

**Last Updated:** December 14, 2025  
**Status:** v1.8.2 - Week 2 Complete (Feature Gating)

