# Database Diagnostics Guide

## 🔍 Is This a Database Issue?

**YES**, it could be! Based on your error "Erro ao carregar atleta", here are the most common database-related causes:

---

## 🎯 Most Likely Causes (in order of probability)

### 1. **RLS Policy Blocking Access** ⭐ MOST COMMON
The Row Level Security policies might be preventing your query from accessing player data.

**Symptoms:**
- Query returns empty results or 404
- No error message in Supabase logs
- Auth session is valid but still can't see data

**Why this happens:**
- The RLS policy checks if `auth.uid()` matches the `user_id` in the teams table
- If the session isn't properly passing `auth.uid()`, the policy blocks access

---

### 2. **Session Not Being Passed to Supabase**
The JWT token from the session might not be included in the database request.

**Symptoms:**
- `auth.uid()` returns `NULL` in database queries
- All data returns empty even though it exists

---

### 3. **All Players Are Archived/Inactive**
The query filters for `is_active = true`, but all your players might be archived.

**Symptoms:**
- Players exist in database but don't show in app
- Query with `is_active = true` returns nothing

---

### 4. **Team Ownership Mismatch**
The team exists but isn't linked to your user account properly.

**Symptoms:**
- Teams show up but players don't
- Can create teams but can't see players in them

---

## 🛠️ How to Diagnose

### Step 1: Run the Diagnostic Script

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `/supabase/diagnostic_query.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Read the Results

The script will check:
- ✅ Is user authenticated?
- ✅ Does user profile exist?
- ✅ Which teams does user own?
- ✅ Which players can user access?
- ✅ Are RLS policies correctly configured?
- ✅ Are there any sync issues?

### Step 3: Look for These Red Flags

| Result | Meaning | Fix |
|--------|---------|-----|
| `❌ NO USER AUTHENTICATED` | Session not reaching database | Frontend auth issue - check session |
| `⚠️  Profile is NOT active` | User account deactivated | Reactivate user account |
| `❌ NOT owned by you` | Team ownership issue | Check `teams.user_id` field |
| `total_players_active = 0` | All players archived | Unarchive players or check `is_active` field |
| `auth_user_id` ≠ `db_user_id` | Profile missing | Run migration 003 to create profile |

---

## 🔧 Quick Fixes

### Fix 1: Check if auth.uid() is NULL

Run this in Supabase SQL Editor:

```sql
SELECT auth.uid() as current_user_id;
```

**Expected:** Your user UUID  
**If NULL:** Session isn't reaching database (auth issue, not database issue)

---

### Fix 2: Manually Check Player Accessibility

```sql
-- Replace 'YOUR-TEAM-ID' with actual team ID
SELECT 
  p.id,
  p.name,
  p.team_id,
  t.user_id as team_owner_id,
  auth.uid() as my_user_id,
  CASE 
    WHEN t.user_id = auth.uid() THEN 'YES - You can access'
    ELSE 'NO - Not your team'
  END as can_i_access
FROM players p
JOIN teams t ON t.id = p.team_id
WHERE t.id = 'YOUR-TEAM-ID'
LIMIT 10;
```

---

### Fix 3: Check if Players Are Active

```sql
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as active_players,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_players,
  COUNT(*) FILTER (WHERE archived_at IS NOT NULL) as archived_players,
  COUNT(*) as total_players
FROM players p
JOIN teams t ON t.id = p.team_id
WHERE t.user_id = auth.uid();
```

---

### Fix 4: Temporarily Disable RLS (for testing ONLY)

⚠️ **WARNING: Only do this for testing, and re-enable immediately after**

```sql
-- DISABLE RLS (testing only!)
ALTER TABLE players DISABLE ROW LEVEL SECURITY;

-- Test your query in the app now
-- If it works, the problem is the RLS policy

-- RE-ENABLE RLS (IMPORTANT!)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Understanding the Error

When you see "Erro ao carregar atleta", it means:

1. **Frontend sends query** → `supabase.from('players').select(...)`
2. **Supabase receives query** → Checks RLS policy
3. **RLS policy checks** → `WHERE EXISTS (teams.user_id = auth.uid())`
4. **If `auth.uid()` is NULL or doesn't match** → Returns empty result
5. **Frontend sees empty result** → Shows error message

---

## 🎯 Action Plan

### Option A: It's a Database Issue

**If diagnostic script shows:**
- Players exist but you can't access them
- RLS policies are blocking access
- Ownership mismatch

**Then fix:**
1. Check team ownership in database
2. Verify RLS policies are correct
3. Check if players are properly linked to teams

### Option B: It's a Session Issue (More Likely)

**If diagnostic script shows:**
- `auth.uid()` is NULL
- "NO USER AUTHENTICATED"

**Then the problem is in the frontend** (which we already fixed!):
- Session not being passed to Supabase
- JWT token expired/invalid
- Our session refresh fixes should resolve this

---

## 🔄 Next Steps

1. **Run the diagnostic script** (`/supabase/diagnostic_query.sql`)
2. **Share the results** so we can pinpoint the exact issue
3. **Based on results**, we'll either:
   - Fix database RLS policies
   - Fix session passing (already done)
   - Fix data issues (inactive players, ownership, etc.)

---

## 📞 Quick Test

Try this in your browser console while logged in:

```javascript
// Check if session exists
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session ? 'EXISTS ✅' : 'MISSING ❌');
console.log('User ID:', session?.user?.id);

// Try to query players directly
const { data, error } = await supabase
  .from('players')
  .select('id, name, team_id')
  .limit(5);
  
console.log('Players:', data);
console.log('Error:', error);
```

This will tell us immediately if it's a session issue or a database issue.

---

**The diagnostic script is ready at:**  
`/supabase/diagnostic_query.sql`

**Run it in Supabase SQL Editor and share the results!** 🚀

