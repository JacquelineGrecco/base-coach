// Re-registration After Account Deletion - Fix Guide

## 🐛 Problem

When a user deletes their account and tries to re-register with the same email:

1. ❌ **Signup fails** with "User already registered" error
2. ❌ **"Conta Deletada" message persists** when switching to signup
3. ❌ **No confirmation email arrives**

### Why This Happens

```
User deletes account:
  ├─ Profile deleted from public.users ✅
  ├─ All data deleted (teams, players, etc.) ✅
  └─ Auth record remains in auth.users ⚠️
      (Cannot delete from client-side code)

User tries to re-register:
  ├─ Supabase checks: "Email exists in auth.users" ❌
  ├─ Rejects signup
  └─ No confirmation email sent
```

---

## ✅ Solutions Implemented

### Fix 1: Clear "Conta Deletada" Message on Navigation

**What:** The "Conta Deletada" error now clears when switching between Login/Signup pages.

**Files Changed:**
- `components/Auth/AuthPage.tsx` - Calls `clearProfileError()` on view changes
- `components/Auth/Signup.tsx` - Clears error on component mount

**Result:** ✅ No more stale error messages

### Fix 2: Better Error Message for Orphaned Auth Users

**What:** When someone tries to signup with a previously deleted email:

**Before:**  
❌ `"Este email já está cadastrado. Faça login ou use outro email."`

**After:**  
✅ `"Este email já foi usado anteriormente. Se você deletou sua conta, entre em contato com o suporte para reativar ou use outro email."`

**Result:** ✅ Clear explanation of the situation

### Fix 3: Database Function for Profile Recreation (Migration 008)

**What:** Automatically recreates profiles for orphaned auth users.

**How:** When an auth user has no profile, the database automatically creates one on:
- New signup attempts (though Supabase still blocks duplicate emails)
- Login attempts (catches edge cases)

**File:** `supabase/migrations/008_handle_orphaned_auth_users.sql`

**Result:** ✅ Handles edge cases where profile is missing

---

## 🎯 Current User Experience

### Scenario: User Deleted Account and Tries to Re-register

1. **User goes to Signup page**
   - ✅ "Conta Deletada" message is cleared
   - ✅ Clean signup form

2. **User enters previously deleted email**
   - ✅ Form accepts input
   - ✅ Submits to Supabase

3. **Supabase rejects duplicate email**
   - ❌ Returns "User already registered" error

4. **App shows helpful error:**
   ```
   Este email já foi usado anteriormente. 
   Se você deletou sua conta, entre em 
   contato com o suporte para reativar 
   ou use outro email.
   ```

5. **User options:**
   - Use a different email address ✅
   - Contact support to clean up old auth record ✅
   - Wait for proper admin cleanup ⏳

---

## 🔧 Workarounds for Users

### Option 1: Use a Different Email (Recommended)
```
1. Use a new email address to sign up
2. Complete registration normally
3. Old auth record remains but is harmless
```

### Option 2: Contact Support
```
1. Email support with the deleted email
2. Admin manually deletes auth record
3. User can then re-register with same email
```

### Option 3: Add "+tag" to Email (Gmail)
```
Before: user@gmail.com (deleted)
New:    user+basecoach@gmail.com (works!)

Gmail treats these as the same inbox but 
Supabase treats them as different emails.
```

---

## 🚀 Proper Fix (Future Enhancement)

To fully solve this, you need **admin privileges** to delete auth users. Options:

### Solution A: Supabase Edge Function

Create a server-side function with admin privileges:

```typescript
// supabase/functions/delete-auth-user/index.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Admin key
)

Deno.serve(async (req) => {
  const { userId } = await req.json()
  
  // Delete from auth.users (requires admin)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  
  return new Response(
    JSON.stringify({ success: !error }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### Solution B: Supabase Dashboard Manual Cleanup

1. Go to Supabase Dashboard
2. Authentication → Users
3. Find the user by email
4. Click "..." → Delete user
5. User can now re-register

### Solution C: Automated Cleanup Job

```sql
-- Run daily to clean up orphaned auth users
CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users()
RETURNS void AS $$
DECLARE
  auth_user_id uuid;
BEGIN
  FOR auth_user_id IN 
    SELECT au.id 
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
    AND au.created_at < NOW() - INTERVAL '30 days'
  LOOP
    -- This would require admin privileges
    -- Cannot be done from regular function
    RAISE NOTICE 'Orphaned auth user: %', auth_user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Testing the Fix

### Test 1: Deleted Account Message Clears

1. ✅ Try to login with deleted account
2. ✅ See "Conta Deletada" message
3. ✅ Click "Criar conta" (Signup)
4. ✅ Message disappears
5. ✅ Clean signup form appears

**Expected:** No stale error messages

### Test 2: Re-registration with Same Email

1. ✅ Delete an account
2. ✅ Go to signup page
3. ✅ Try to register with same email
4. ✅ See helpful error message:
   ```
   Este email já foi usado anteriormente...
   ```

**Expected:** Clear explanation, not confusing

### Test 3: Re-registration with Different Email

1. ✅ Delete an account
2. ✅ Sign up with NEW email
3. ✅ Receive confirmation email
4. ✅ Complete registration
5. ✅ Access app normally

**Expected:** Works perfectly

---

## 🔒 Security Considerations

### Is it safe to leave orphaned auth records?

**Yes, it's safe:**
- ✅ Profile data is completely deleted
- ✅ User cannot access the app (profile validation blocks them)
- ✅ All user data (teams, players, sessions) is deleted
- ✅ No data leakage possible

**What remains:**
- ⚠️ Email address in `auth.users` (no other data)
- ⚠️ Password hash (cannot be used without profile)

**GDPR Compliance:**
For full compliance, you should implement admin cleanup to delete auth records. This is a known Supabase limitation.

---

## 📝 Files Modified

### Updated:
1. **`components/Auth/AuthPage.tsx`**
   - Clears `profileError` on view changes

2. **`components/Auth/Signup.tsx`**
   - Imports `clearProfileError` from auth context
   - Clears error on mount
   - Improved error message for orphaned auth users

3. **`contexts/AuthContext.tsx`**
   - Exports `clearProfileError` function

### Created:
4. **`supabase/migrations/008_handle_orphaned_auth_users.sql`**
   - Creates `recreate_missing_profile()` function
   - Creates `ensure_profile_exists()` function
   - Auto-recreates profiles for orphaned auth users

5. **`docs/REREGISTRATION_FIX.md`**
   - This documentation file

---

## ✅ Quick Fix Checklist

- [x] Run migration 007 (DELETE policy)
- [x] Run migration 008 (orphaned auth users)
- [x] Test: "Conta Deletada" clears on navigation
- [x] Test: Helpful error for re-registration
- [x] Test: New email signup works
- [ ] Optional: Set up Edge Function for admin deletion
- [ ] Optional: Add support contact form

---

## 💡 Recommended Next Steps

### For MVP (Current):
1. ✅ Use the current workarounds
2. ✅ Direct users to use different emails
3. ✅ Manually clean up auth records in dashboard if needed

### For Production:
1. 🔜 Implement Supabase Edge Function with admin privileges
2. 🔜 Add automated cleanup job
3. 🔜 Create support contact form for account issues
4. 🔜 Add grace period (30 days) before permanent deletion

---

**Status:** ✅ **IMPROVED** (not fully solved)  
**Limitation:** Supabase auth user deletion requires admin privileges  
**Workaround:** Use different email or manual dashboard cleanup  
**Future:** Implement Edge Function with admin API

