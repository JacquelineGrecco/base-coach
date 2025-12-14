# Profile UI Update - Summary

## 🎨 What Changed

We redesigned the Profile/Settings page based on your feedback:

### Before (3 tabs):
```
┌─────────────────────────────────────┐
│ [Personal Info] [Plan] [Account]    │
└─────────────────────────────────────┘
```

### After (2 tabs):
```
┌─────────────────────────────────────┐
│ [Personal Info] [Plan]               │
└─────────────────────────────────────┘
```

**Key Change:** Delete account section moved from separate tab to bottom of Personal Info tab.

---

## ✨ New Features

### 1. User Type Badge
Shows if user is a **Coach** or **Player** (future feature):

```
Configurações  🏆 Treinador
```

or

```
Configurações  ⚽ Atleta
```

### 2. Consolidated Personal Info Tab

Now includes everything in one place:
1. **Basic Information** (Name, Email, Phone)
2. **Change Password** (with confirmation)
3. **Delete Account** (with warning and confirmation)

### 3. User Types System

Added support for two user types:
- **🏆 Coach (Treinador):** Manages teams and evaluates players
- **⚽ Player (Atleta):** Athlete being evaluated (future)

---

## 📁 Modified Files

### Updated:
1. **`components/Profile.tsx`**
   - Removed `'account'` tab type
   - Moved delete section into personal tab
   - Added user type badge in header
   - Reorganized layout for better UX

2. **`services/userService.ts`**
   - Added `UserType` type
   - Added `PlanType` type
   - Updated `UserProfile` interface
   - Support for user type in updates

3. **`services/authService.ts`**
   - Added `userType` parameter to signup
   - Defaults to `'coach'`
   - Stores in auth metadata

4. **`contexts/AuthContext.tsx`**
   - Updated signup signature
   - Supports optional user type

### New:
5. **`supabase/migrations/006_add_user_type_to_users.sql`**
   - Adds `user_type` column
   - Updates trigger function
   - Sets all existing users to `'coach'`

6. **`docs/USER_TYPES_GUIDE.md`**
   - Complete guide to user types system
   - Migration instructions
   - Future player features

---

## 🚀 How to Test

### Step 1: Run Migrations

Go to [Supabase Dashboard](https://app.supabase.com) SQL Editor and run:

```sql
-- Migration 005: Add plan_type
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_type TEXT 
CHECK (plan_type IN ('free', 'basic', 'premium'))
DEFAULT 'free';

-- Migration 006: Add user_type
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type TEXT 
CHECK (user_type IN ('coach', 'player'))
DEFAULT 'coach';

CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

UPDATE users SET user_type = 'coach' WHERE user_type IS NULL;

-- Update trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'coach'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Refresh Your App

Your dev server is running, so just refresh the browser at `http://localhost:3000`

### Step 3: Navigate to Profile

1. Log in (if not logged in)
2. Click **"Configurações"** in sidebar
3. You should see:
   - ✅ User type badge: **🏆 Treinador**
   - ✅ Two tabs: Personal Info and Plan
   - ✅ Delete account at bottom of Personal Info

---

## 🎯 UI Layout

### Personal Information Tab

```
┌─────────────────────────────────────────────┐
│ Informações Pessoais                         │
├─────────────────────────────────────────────┤
│                                              │
│  [Name Input] ────────────────────           │
│  [Email Input] ───────────────────           │
│  [Phone Input] ───────────────────           │
│                                              │
│  [💾 Salvar Alterações]                      │
│                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
│                                              │
│  Alterar Senha                               │
│                                              │
│  [New Password] ──────────────────           │
│  [Confirm Password] ──────────────           │
│                                              │
│  [Alterar Senha]                             │
│                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
│                                              │
│  🗑️ Deletar Conta                            │
│                                              │
│  ⚠️ Warning Box:                             │
│  "Esta ação é irreversível..."               │
│                                              │
│  [Reason textarea] ───────────────           │
│  [Confirmation input] "DELETAR" ──           │
│                                              │
│  [🗑️ Deletar Minha Conta...]                │
│                                              │
└─────────────────────────────────────────────┘
```

### Plan Tab
(Unchanged - shows Free, Basic, Premium options)

---

## 💡 Benefits of New Design

### Better UX
- ✅ **Fewer clicks** - Everything in one place
- ✅ **Better flow** - Logical grouping of settings
- ✅ **Less confusion** - No hunting for delete button
- ✅ **Visual hierarchy** - Important actions separated by dividers

### Future-Proof
- ✅ **User types ready** - System supports coaches and players
- ✅ **Extensible** - Easy to add player-specific features
- ✅ **Type-safe** - TypeScript types for all user variants

### Cleaner Code
- ✅ **Less repetition** - One comprehensive tab
- ✅ **Better organization** - Related features grouped
- ✅ **Easier maintenance** - Fewer components to manage

---

## 🔍 What Happens When...

### User Updates Name/Email/Phone
1. Form submitted
2. `userService.updateProfile()` called
3. Database updated
4. Success message shown
5. Profile reloaded

### User Changes Password
1. Password form submitted
2. Validation checks (length, match)
3. `userService.changePassword()` called
4. Supabase auth updated
5. Success message shown
6. Form cleared

### User Deletes Account
1. User types "DELETAR"
2. Confirmation button enabled
3. `userService.deleteAccount()` called
4. All user data cascade deleted:
   - Profile (users table)
   - Teams
   - Players
   - Sessions
   - Evaluations
   - Reports
5. User signed out
6. Redirected to login

---

## 🎨 Visual Indicators

### User Type Badges

**Coach Badge:**
```
🏆 Treinador
Background: emerald-100
Text: emerald-800
```

**Player Badge (future):**
```
⚽ Atleta
Background: blue-100
Text: blue-800
```

### Sections
- **Dividers:** Gray border-top between sections
- **Warnings:** Red background for delete section
- **Success:** Green alerts for confirmations
- **Errors:** Red alerts for problems

---

## ✅ Testing Checklist

- [ ] Migrations run successfully
- [ ] Profile page loads without errors
- [ ] User type badge displays (🏆 Treinador)
- [ ] Can update name, email, phone
- [ ] Can change password
- [ ] Delete account section visible at bottom
- [ ] Confirmation required for deletion
- [ ] All user data deleted on account deletion
- [ ] Plan tab still works correctly

---

## 🚦 Status

**Implementation:** ✅ Complete  
**Testing:** Ready  
**Documentation:** Complete  
**Migration Required:** Yes (005 & 006)

---

**Updated:** December 7, 2025  
**Changes:** Consolidated tabs, added user types  
**Breaking Changes:** None (backward compatible)


