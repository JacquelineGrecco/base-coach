# Testing Guide - FutsalPro Coach App

## 🚀 Quick Start

### 1. Install Dependencies (if not done yet)
```bash
cd futsalpro-coach
npm install
```

### 2. Set up Gemini API Key
Create a `.env.local` file in the root directory:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Run the App
```bash
npm run dev
```

The app will open at `http://localhost:5173`

---

## 🧪 Testing Checklist

### ✅ Session Setup (NEW Feature)

**Steps:**
1. Click "Start New Session" on Dashboard
2. You should see the **Session Setup** page
3. Try selecting valences:
   - Click on 1-2 criteria → Should allow
   - Click on a 3rd criterion → Should allow
   - Try clicking a 4th → Should be disabled
   - Click on a selected criterion → Should deselect
4. Click "Start Session" (only works if at least 1 selected)

**Expected Result:**
- Beautiful grid layout with categories
- Visual feedback on selection
- Counter shows "X of 3 criteria selected"
- Start button disabled if nothing selected

---

### ✅ Active Session - Optimized Workflow (UPDATED)

**Steps:**
1. After starting session, you're in Active Session view
2. **Only selected valences** should appear (not all 8)
3. Test navigation methods:

**Keyboard Navigation:**
- Press `→` (right arrow) → Should go to next player
- Press `←` (left arrow) → Should go to previous player

**Touch/Swipe (on mobile/tablet):**
- Swipe left → Next player
- Swipe right → Previous player

**Buttons:**
- Click left chevron ← → Previous player
- Click right chevron → → Next player

4. **Score a player:**
   - Click numbers 0-5 for each visible valence
   - Selected score should highlight in blue with shadow
   - Try tapping quickly (buttons should be large enough)

5. **Check timer:**
   - Timer in top-left should be counting up
   - Format: MM:SS

6. **Progress bar:**
   - Should show progress (e.g., "Player 2 of 6")

**Expected Result:**
- **MUCH larger buttons** than before (h-16 instead of h-12)
- Only 1-3 valence cards visible (based on selection)
- Smooth navigation
- Fast workflow for evaluating many players

---

### ✅ Player Reports (NEW Feature)

**Steps:**
1. Complete at least one session with evaluations
2. Go to "Reports" view (sidebar)
3. Select a player from the left panel
4. You should see:
   - **Individual Report Card** (blue gradient box)
   - Description (200-300 characters)
   - Strengths section (green)
   - Weaknesses section (orange)

**Test Export:**
5. Click the **Download** icon (↓)
   - Should download a `.txt` file
   - Open file → Should be formatted report in Portuguese

**Test Share:**
6. Click the **Share** icon (↗)
   - On mobile: Should open native share sheet
   - On desktop: Should copy to clipboard and show alert

**Test Premium Unlock:**
7. If you see "Desbloquear Relatórios Premium" button:
   - Click it
   - Report should show "PREMIUM ⭐" badge
   - Export format should include premium indicator

**Expected Result:**
- Professional-looking reports
- Description is exactly 200-300 characters
- Strengths show players scored ≥ 4.0
- Weaknesses show players scored ≤ 2.5
- Export works smoothly

---

### ✅ AI Analysis (Existing Feature)

**Steps:**
1. In Reports view, with a player selected
2. Click "Análise com IA" button
3. Wait for AI analysis to generate
4. Should see feedback box appear below

**Expected Result:**
- AI gives constructive 3-sentence feedback
- Based on player's actual scores
- In professional coaching language

---

## 📱 Mobile Testing

### Essential Mobile Tests:

1. **Session Setup on Mobile:**
   - Cards should be tappable with finger
   - Layout should be responsive
   - All text readable

2. **Active Session on Mobile:**
   - **Swipe gestures** MUST work
   - Score buttons large enough to tap
   - Player photo and info visible
   - Timer and controls accessible

3. **Reports on Mobile:**
   - Share button should trigger native share
   - Report readable on small screen
   - Export works on mobile browsers

---

## ⏱️ Speed Test (Most Important!)

### Goal: Evaluate 23 players in under 1 hour

**Test Scenario:**
1. Start new session
2. Select 3 valences
3. Start session
4. Time yourself evaluating ALL players
5. For each player:
   - Navigate to player (swipe or arrow key)
   - Rate 3 criteria (tap 3 buttons)
   - Move to next player

**Calculation:**
- 60 minutes ÷ 23 players = ~2.6 minutes per player
- With 3 criteria, you should complete each player in **under 1 minute** easily

**Target:**
- Complete all 23 players in **30-45 minutes** (with optimized workflow)
- Leaving 15-30 minutes for actual training

---

## 🐛 Common Issues & Solutions

### Issue: "No evaluation data"
**Solution:** Make sure you've completed at least one session with scores

### Issue: AI Analysis not working
**Solution:** Check that `VITE_GEMINI_API_KEY` is set in `.env.local`

### Issue: Swipe not working
**Solution:** 
- Make sure you're on a touch device
- Try swiping on the main content area (not buttons)
- Swipe distance must be > 50px

### Issue: Can't download report
**Solution:** 
- Check browser permissions
- Try different browser
- On mobile, allow downloads in browser settings

---

## 📊 Test Data

The app comes with mock data:
- **Team:** Tigers Academy U-15
- **6 Players:**
  1. Lucas Silva (#10 - Ala Left)
  2. Matheus Costa (#5 - Fixo)
  3. Gabriel Jesus (#9 - Pivo)
  4. Rafael Santos (#1 - Goalkeeper)
  5. Enzo Ferrari (#7 - Ala Right)
  6. Bruno Guimaraes (#8 - Universal)

- **8 Valences:**
  - Technical: Short Pass, Finishing, Dribbling (1v1)
  - Tactical: Defensive Transition, Offensive Transition, Positioning
  - Physical: Intensity
  - Mental: Focus

---

## 📸 Screenshots to Take for Friday Meeting

1. **Session Setup** - showing 3 selected valences
2. **Active Session** - showing large buttons and clean layout
3. **Progress** - mid-evaluation showing timer and progress
4. **Individual Report** - showing generated description
5. **Export** - showing downloaded report file

---

## ✨ Demo Script for Fernanda (Friday)

### Part 1: Setup (2 min)
> "Agora antes de começar a avaliar, você escolhe até 3 critérios para focar. 
> Isso deixa a avaliação muito mais rápida durante o treino."

### Part 2: Evaluation (5 min)
> "Olha como é rápido avaliar cada atleta - só 3 critérios grandes.
> Pode usar as setas do teclado ou arrastar com o dedo.
> Com isso, dá pra avaliar os 23 atletas em menos de 1 hora fácil."

### Part 3: Reports (5 min)
> "Depois do treino, o sistema gera automaticamente relatórios individuais de 200-300 caracteres.
> Destaca pontos fortes e fracos. Você pode baixar ou compartilhar direto.
> Esses relatórios você pode vender para os pais!"

### Part 4: Premium (2 min)
> "No plano premium, você desbloqueia relatórios profissionais para venda.
> O app fica com uma porcentagem, mas você não precisa gerir os pais diretamente."

---

## 🎯 Success Criteria

Before Friday, verify:
- [ ] Can select 1-3 valences smoothly
- [ ] Evaluation workflow is FAST (< 1 min per player)
- [ ] Keyboard navigation works
- [ ] Swipe gestures work on mobile
- [ ] Reports generate correctly (200-300 chars)
- [ ] Export downloads properly
- [ ] Share works on mobile
- [ ] Premium unlock button appears
- [ ] No console errors
- [ ] Responsive on mobile and desktop

---

## 📞 Notes for Jacqueline

### What Changed:
1. ✅ You now pick 3 criteria per session (not all 8)
2. ✅ Bigger buttons and faster navigation
3. ✅ Auto-generated reports ready to sell
4. ✅ Export and share built-in
5. ✅ Premium model ready

### What's Still the Same:
- Dashboard
- Drill library
- Overall design
- AI analysis feature

### What's NOT Implemented Yet (Future):
- Calendar (mentioned in meeting)
- Match analysis (training only for MVP)
- Administrative system
- Payment processing

---

**Good luck with testing! 🎉**

If everything works, you're ready to demo on Friday and start testing with real students!

