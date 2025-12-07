# Profile & Settings Feature - Setup Guide

## 🎉 What Was Added

A comprehensive Profile/Settings page where users can:
1. ✅ Edit personal information (name, email, phone)
2. ✅ Change their password
3. ✅ Manage subscription plans (Free, Basic, Premium)
4. ✅ Delete their account permanently

---

## 📁 Files Created/Modified

### New Files:
1. **`services/userService.ts`** - User profile management service
2. **`components/Profile.tsx`** - Profile/Settings page component
3. **`supabase/migrations/005_add_plan_type_to_users.sql`** - Database migration for plan types
4. **`docs/PROFILE_SETUP.md`** - This guide

### Modified Files:
1. **`types.ts`** - Added "PROFILE" to ViewState
2. **`components/Layout.tsx`** - Added "Configurações" navigation item
3. **`App.tsx`** - Added Profile route

---

## 🗄️ Database Migration Required

**IMPORTANT:** You need to run the new migration to add the `plan_type` column.

### Steps:

1. **Go to Supabase Dashboard:**
   - Visit [https://app.supabase.com](https://app.supabase.com)
   - Select your project: `htdplqoestywzzzfhokc`

2. **Open SQL Editor:**
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run the migration:**
   Copy and paste the contents of `supabase/migrations/005_add_plan_type_to_users.sql`:

```sql
-- Add plan_type column to users table
-- This enables subscription/plan management for coaches

-- Add plan_type column with default 'free'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_type TEXT 
CHECK (plan_type IN ('free', 'basic', 'premium'))
DEFAULT 'free';

-- Create index for faster plan type queries
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Update existing users to have 'free' plan
UPDATE users 
SET plan_type = 'free' 
WHERE plan_type IS NULL;

-- Add comment to the column
COMMENT ON COLUMN users.plan_type IS 'User subscription plan: free, basic, or premium';
```

4. **Click "Run"** (or press `Cmd/Ctrl + Enter`)

5. **Verify:**
```sql
-- Check if column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'plan_type';
```

---

## 🚀 How to Access

### In Development:
1. Make sure `npm run dev` is running
2. Log in to your app
3. Click **"Configurações"** in the sidebar (gear icon)

### Navigation Flow:
```
Dashboard → Sidebar → Configurações (Settings)
```

---

## 🎨 Features Overview

### Tab 1: Informações Pessoais (Personal Information)
- Edit name
- Update email (with confirmation)
- Add/update phone number
- Change password securely

### Tab 2: Plano (Plan Management)
- View current plan
- Switch between:
  - **Free:** 1 team, 15 players, basic evaluations
  - **Basic (R$ 29/mo):** 3 teams, 50 players, professional reports
  - **Premium (R$ 79/mo):** Unlimited teams/players, advanced AI, sell reports (70% commission)

### Tab 3: Conta (Account)
- Delete account with confirmation
- Requires typing "DELETAR" to confirm
- Optional feedback on deletion reason
- **Permanent action** - all data is deleted

---

## 🔐 Security Features

### RLS Policies:
- Users can only view/edit their own profile
- Email changes trigger Supabase confirmation
- Password changes use Supabase auth securely
- Account deletion cascades to all related data

### Data Protection:
- All updates require authentication
- Sensitive operations use SECURITY DEFINER
- Passwords never stored in plain text
- Email confirmation for critical changes

---

## 📊 Plan Features Comparison

| Feature | Free | Basic | Premium |
|---------|------|-------|---------|
| Teams | 1 | 3 | Unlimited |
| Players | 15 | 50 | Unlimited |
| Evaluations | Basic | Complete | Complete |
| Professional Reports | ❌ | ✅ | ✅ |
| AI Features | Basic | Standard | Advanced |
| Sell Reports | ❌ | ❌ | ✅ (70%) |
| Price | R$ 0 | R$ 29/mo | R$ 79/mo |

---

## 🧪 Testing Checklist

- [ ] Run database migration
- [ ] Navigate to Profile page
- [ ] Update personal information
- [ ] Change password
- [ ] Switch between plans (Free → Basic → Premium)
- [ ] Verify plan changes in database
- [ ] Test account deletion flow (use test account!)
- [ ] Verify all user data is deleted after account deletion

---

## 🎯 Next Steps (Optional Enhancements)

### Payment Integration (Future):
1. Integrate Stripe or Mercado Pago
2. Add webhook handlers for subscription events
3. Implement automatic plan expiration
4. Add invoicing/receipts

### Account Deletion Improvements:
1. Add 30-day grace period before permanent deletion
2. Send confirmation email
3. Allow reactivation during grace period
4. Export user data before deletion (GDPR compliance)

### Profile Enhancements:
1. Upload profile photo
2. Two-factor authentication
3. Session management (view active devices)
4. Email notification preferences

---

## 🐛 Troubleshooting

### "Column plan_type does not exist"
**Solution:** Run the migration `005_add_plan_type_to_users.sql`

### "Cannot read profile"
**Solution:** Ensure RLS policies are enabled and user is authenticated

### "Email update failed"
**Solution:** Check Supabase email settings and ensure email is unique

### Account deletion doesn't work
**Solution:** Check RLS policies and cascade delete configuration

---

## 📚 Related Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

**Created:** December 7, 2025  
**Status:** ✅ Ready to Use  
**Migration Required:** Yes - Run `005_add_plan_type_to_users.sql`

