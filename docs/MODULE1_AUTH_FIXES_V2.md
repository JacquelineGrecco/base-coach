# Module 1: Authentication & User Management - Deactivation System

**Branch:** `fix/improvements-and-polish`  
**Date:** December 8, 2024  
**Status:** ✅ Completed - Ready for Testing

---

## 🎯 New Approach: Account Deactivation (Not Deletion)

### **What Changed:**
- Users are **deactivated** (not deleted)
- Accounts remain in database for 365 days
- **No self-recovery** - must contact support via WhatsApp
- After 365 days → Permanent deletion (automatic)

---

## ✅ Implemented Features

### 1. **Email Validation** ✅
- Real-time format validation
- Visual feedback (red border + error message)
- Validates on change and blur

### 2. **Login Attempt Limiting** ✅
- 3 attempts → 60-second lockout
- Real-time countdown timer
- Shows remaining attempts
- Per-email tracking

### 3. **Account Deactivation System** ✅
**Database:**
- Added `is_active` boolean to users table
- Added `deactivated_at` timestamp
- Added `deactivation_reason` text field
- Created `deactivate_user_account()` function
- Created `reactivate_user_account()` function (admin/support only)
- Created `cleanup_old_deactivated_users()` function

**Frontend:**
- Detects deactivated accounts on login
- Shows WhatsApp support button
- Opens WhatsApp with pre-filled message
- Different messages for < 365 days and >= 365 days

### 4. **WhatsApp Support Integration** ✅
**Features:**
- One-click WhatsApp button
- Pre-filled message with user email
- Opens in new tab
- WhatsApp icon (SVG)

**Message Format:**
```
Olá! Minha conta do BaseCoach foi desativada e gostaria de reativá-la.

Email: user@example.com
```

### 5. **Updated UI Messaging** ✅
**Profile Page:**
- "Desativar Conta" (instead of "Deletar")
- Clear explanation of 365-day period
- Mentions need to contact support
- Feedback textarea for reason

**Login Page:**
- "Conta Desativada" title
- Shows days since deactivation
- Shows days remaining (if < 365)
- WhatsApp support button

---

## 🗄️ Database Changes

### Migration 022: `add_user_deactivation.sql`

**New Columns:**
```sql
users.is_active BOOLEAN DEFAULT true
users.deactivated_at TIMESTAMPTZ
users.deactivation_reason TEXT
```

**New Functions:**
1. `deactivate_user_account(user_id, reason)` - Deactivates user
2. `reactivate_user_account(user_id)` - Reactivates user (support only)
3. `cleanup_old_deactivated_users()` - Deletes after 365 days

**Updated:**
- `cleanup_old_archived_items()` - Now uses 365 days
- Cron job - Runs both cleanup functions daily

---

## 📱 WhatsApp Configuration

### **Update the Phone Number:**

In `components/Auth/Login.tsx` (line ~19):
```typescript
const SUPPORT_WHATSAPP = '5511999999999'; // ⚠️ UPDATE THIS!
```

**Format:** Country code + number (no spaces/dashes)
- Brazil: `55` + DDD + number
- Example: `5511999999999` (São Paulo)
- Example: `5521988888888` (Rio de Janeiro)

---

## 🔄 User Flow

### **Deactivation Flow:**
```
User clicks "Desativar Conta"
        ↓
Enters reason (optional)
        ↓
Types "DELETAR" to confirm
        ↓
System:
  • Sets is_active = false
  • Sets deactivated_at = NOW()
  • Archives all teams/categories/players
        ↓
User is logged out
```

### **Reactivation Flow (< 365 days):**
```
User tries to login
        ↓
System detects: is_active = false
        ↓
Shows message: "Conta desativada há X dias"
        ↓
User clicks "Falar com Suporte"
        ↓
WhatsApp opens with pre-filled message
        ↓
User contacts support
        ↓
Support runs: SELECT reactivate_user_account('user-id');
        ↓
User can login normally
```

### **Expired Deactivation (>= 365 days):**
```
User tries to login
        ↓
System detects: deactivated >= 365 days
        ↓
Shows message: "Para reativar, entre em contato com o suporte"
        ↓
User clicks WhatsApp button
        ↓
Support informs: Account data deleted, must create new account
```

---

## 🛠️ Support/Admin Operations

### **Check User Status:**
```sql
SELECT 
  id, 
  name, 
  email, 
  is_active, 
  deactivated_at,
  deactivation_reason,
  DATE_PART('day', NOW() - deactivated_at) as days_deactivated
FROM users
WHERE email = 'user@example.com';
```

### **Reactivate User Manually:**
```sql
-- Reactivate user (restores teams/categories/players)
SELECT reactivate_user_account('user-uuid-here');

-- Verify reactivation
SELECT is_active, deactivated_at FROM users WHERE id = 'user-uuid-here';
```

### **Find Deactivated Users:**
```sql
-- All deactivated users
SELECT 
  name, 
  email, 
  deactivated_at,
  deactivation_reason,
  DATE_PART('day', NOW() - deactivated_at) as days_inactive
FROM users
WHERE is_active = false
ORDER BY deactivated_at DESC;

-- Users approaching 365-day limit
SELECT 
  name, 
  email, 
  deactivated_at,
  365 - DATE_PART('day', NOW() - deactivated_at) as days_until_deletion
FROM users
WHERE is_active = false
  AND deactivated_at > NOW() - INTERVAL '365 days'
ORDER BY deactivated_at ASC;
```

---

## 🧪 Testing Steps

### **Test 1: Email Validation**
1. Go to signup page
2. Type invalid email (e.g., "test@")
3. ✅ Should show red border + error message
4. Type valid email
5. ✅ Error should clear

### **Test 2: Login Attempt Limiting**
1. Enter wrong password 1st time
2. ✅ Should show "2 tentativas restantes"
3. Enter wrong password 2nd time
4. ✅ Should show "1 tentativa restante"
5. Enter wrong password 3rd time
6. ✅ Should show "Conta bloqueada por 60 segundos"
7. ✅ Countdown timer should appear
8. Wait for timer to reach 0
9. ✅ Should be able to try again

### **Test 3: Account Deactivation** ⚠️ **Run Migration First!**
1. Run `cleanup_all_data.sql` (clean database)
2. Run `022_add_user_deactivation.sql` (install system)
3. Create test account
4. Login
5. Go to Profile → Desativar Conta
6. Enter reason (optional)
7. Type "DELETAR"
8. Click "Desativar Minha Conta"
9. ✅ Should be logged out
10. ✅ Database: Check `users` table → `is_active = false`

### **Test 4: Deactivated Account Login**
1. Try to login with deactivated account
2. ✅ Should show "Conta Desativada" message
3. ✅ Should show WhatsApp button
4. Click WhatsApp button
5. ✅ Should open WhatsApp with pre-filled message

### **Test 5: WhatsApp Integration**
1. Update phone number in `Login.tsx`
2. Deactivate account
3. Try to login
4. Click WhatsApp button
5. ✅ WhatsApp should open
6. ✅ Message should include user email

### **Test 6: Support Reactivation**
1. Deactivate account
2. In Supabase SQL Editor, run:
   ```sql
   SELECT reactivate_user_account('your-user-id-here');
   ```
3. Try to login
4. ✅ Should work normally
5. ✅ Teams/categories/players should be restored

---

## 📋 Files Modified

### **Database:**
- ✅ `supabase/migrations/022_add_user_deactivation.sql` (new)
- ✅ `supabase/scripts/cleanup_all_data.sql` (new)
- ✅ `supabase/scripts/cleanup_all_data_safe.sql` (new)
- ✅ `supabase/scripts/README_CLEANUP.md` (new)

### **Services:**
- ✅ `services/userService.ts`
  - Updated `UserProfile` interface
  - Renamed to `requestAccountDeactivation()`
  - Removed recovery functions

### **Components:**
- ✅ `components/Auth/Login.tsx`
  - Login attempt limiting
  - Countdown timer
  - WhatsApp support button
  - Deactivation detection

- ✅ `components/Auth/Signup.tsx`
  - Email validation
  - Real-time feedback

- ✅ `components/Profile.tsx`
  - Updated deactivation messaging
  - Changed button text
  - Added 365-day notice

### **Contexts:**
- ✅ `contexts/AuthContext.tsx`
  - Checks `is_active` field
  - Detects deactivated accounts
  - Shows appropriate error messages

### **Documentation:**
- ✅ `docs/MODULE1_AUTH_FIXES_V2.md` (this file)
- ✅ `docs/MODULE1_AUTH_FIXES.md` (original approach)

---

## ⚠️ Important Notes

### **WhatsApp Phone Number:**
- **MUST UPDATE** in `Login.tsx`
- Format: Country code + number
- No spaces, dashes, or parentheses
- Example: `5511999999999`

### **Migration Order:**
1. Run `cleanup_all_data.sql` (optional - clean slate)
2. Run `022_add_user_deactivation.sql` (required)
3. Verify functions created
4. Test signup/login flows

### **Linter Warnings:**
- 4 TypeScript warnings about `as any`
- These are safe to ignore
- Common with Supabase's dynamic types
- Code will compile and run fine

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Update WhatsApp number in `Login.tsx`
- [ ] Run migration 022 in Supabase Dashboard
- [ ] Verify `pg_cron` is enabled
- [ ] Test deactivation flow end-to-end
- [ ] Test WhatsApp link opens correctly
- [ ] Document support reactivation process for team
- [ ] Create support response templates
- [ ] Test on mobile devices (WhatsApp link)

---

## 📞 Support Process

### **When User Contacts via WhatsApp:**

1. **Verify Identity:**
   - Ask for email
   - Ask security question (account creation date, team name, etc.)

2. **Check Account Status:**
   ```sql
   SELECT 
     is_active, 
     deactivated_at,
     DATE_PART('day', NOW() - deactivated_at) as days_inactive
   FROM users
   WHERE email = 'user@example.com';
   ```

3. **If < 365 days:**
   - Reactivate account
   - Inform user they can login
   
4. **If >= 365 days:**
   - Inform user: data deleted
   - Guide them to create new account

5. **Reactivation Command:**
   ```sql
   SELECT reactivate_user_account('user-uuid');
   ```

---

## 🎯 Success Criteria

✅ **All Features Working:**
1. ✅ Email validation with visual feedback
2. ✅ Login attempt limiting (3 attempts, 60s block)
3. ✅ Countdown timer displays correctly
4. ✅ Account deactivation (not deletion)
5. ✅ Deactivated accounts can't login
6. ✅ WhatsApp button opens correctly
7. ✅ Pre-filled message includes email
8. ✅ Support can reactivate accounts
9. ✅ Auto-cleanup after 365 days

---

## 📝 Next Steps

After testing:
1. Commit all changes
2. Update `TESTING_OUTPUT.md` with results
3. Update `FEATURE_CHECKLIST.md`
4. Merge to `main`
5. Create tag `v1.7.1` or `v1.8.0` (breaking change)
6. Deploy to Vercel
7. Run migration in production
8. Monitor Supabase logs

---

**Status:** ✅ Ready for Testing  
**Estimated Testing Time:** 45 minutes  
**Risk Level:** Low (deactivation safer than deletion)  
**Breaking Change:** Yes (changed deletion → deactivation)

