feat: comprehensive improvements and fixes for Module 1 and UX enhancements

## 🎯 Major Features Added

### 1. Dominant Leg Field for Players
- Added `dominant_leg` column to players table (migration 024)
- Options: Esquerda, Direita, Ambos
- Visible in player creation and edit forms
- Database migration: `024_add_dominant_leg_to_players.sql`

### 2. Age Display Instead of Birth Date
- Player list now shows age (e.g., "15 anos") instead of birth date
- Automatic age calculation with birthday consideration
- More useful for coaches - no mental math needed!

### 3. Session Details Modal
- Click "Ver detalhes" on recent sessions opens modal
- Shows session info: team, category, evaluations, duration
- Displays all evaluated players with scores
- Shows criteria/valences used in the session (color-coded badges)
- "Ver Relatório Completo" button navigates to Reports with correct team preselected

### 4. Smart Session Setup
- Only shows categories that have active players
- Only shows "Sem Categoria" if there are uncategorized players
- Prevents starting sessions with no players
- "Adicionar Atletas" button when team has no players (goes directly to Teams page)

### 5. Password Reset Translation
- All password reset error messages now in Portuguese
- Translates Supabase errors: "New password should be different" → "A nova senha deve ser diferente da senha antiga"

### 6. WhatsApp Support Number from Environment Variable
- `VITE_SUPPORT_WHATSAPP` env variable for support contact
- Used in deactivated account recovery flow
- Includes `ENV_SETUP.md` documentation

## 🐛 Bug Fixes

### 1. "Ver detalhes" Button Fixed
- Previously did nothing
- Now opens session details modal with full context

### 2. Reports Navigation Context
- Fixed issue where Reports showed wrong player/team
- Now passes team context from session modal to Reports
- Auto-selects correct team when navigating from session details

### 3. Vercel SPA Routing
- Added `vercel.json` for proper client-side routing
- Fixes 404 errors on direct URL access

## 📝 Files Changed

### New Files:
- `ENV_SETUP.md` - Environment variables documentation
- `env.example.txt` - Example env file template
- `supabase/migrations/024_add_dominant_leg_to_players.sql` - Dominant leg field migration

### Modified Files:
- `App.tsx` - Added preselected team context for Reports
- `components/Auth/ResetPassword.tsx` - Portuguese error translations
- `components/Auth/Login.tsx` - WhatsApp env variable
- `components/Dashboard.tsx` - Session details modal, navigation improvements
- `components/Reports.tsx` - Accept preselected team prop
- `components/SessionSetup.tsx` - Smart category filtering, player validation
- `components/Teams/Players.tsx` - Dominant leg field, age calculation
- `vercel.json` - SPA routing configuration

## 🎨 UX Improvements

1. ✅ Better error messages (all in Portuguese)
2. ✅ Contextual navigation (takes users where they need to go)
3. ✅ Smart forms (only show relevant options)
4. ✅ Helpful modals (session details at a glance)
5. ✅ Age display (no more birth date calculations)
6. ✅ Visual criteria badges (color-coded by category)

## 🗃️ Database Changes

**Migration 024:** `add_dominant_leg_to_players`
```sql
ALTER TABLE players
ADD COLUMN dominant_leg TEXT CHECK (dominant_leg IN ('left', 'right', 'both', 'Esquerda', 'Direita', 'Ambos'));
```

## 📋 Testing Notes

- All features tested on Vercel preview deployments
- Session modal shows correct data
- Reports navigation maintains context
- Age calculation verified for various birth dates
- Smart category filtering works as expected

## 🚀 Deployment

Ready for merge to main and production deployment.

---

**Branch:** `fix/improvements-and-polish`
**Target:** `main`
**Version:** v1.5.0 (suggested)

