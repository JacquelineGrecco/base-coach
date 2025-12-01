# 🗄️ Supabase Setup Guide

Complete guide to setting up Supabase for BaseCoach database and authentication.

---

## 📋 Prerequisites

- A Supabase account (free tier is perfect for MVP)
- Node.js 18+ installed
- BaseCoach repository cloned

---

## 🚀 Step 1: Create Supabase Project

### 1.1 Sign Up / Login
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in the details:
   - **Organization:** Create new or select existing
   - **Name:** `basecoach-production` (or your preferred name)
   - **Database Password:** Generate a strong password (save it securely!)
   - **Region:** `South America (São Paulo)` - closest to Brazil
   - **Plan:** Free tier
     - 500 MB database
     - 50k monthly active users
     - 1 GB file storage
     - 2 GB bandwidth

3. Click **"Create new project"**
4. Wait ~2 minutes for provisioning

---

## 🔑 Step 2: Get API Credentials

### 2.1 Navigate to Project Settings
1. In your Supabase dashboard, click **Settings** (gear icon)
2. Go to **API** section

### 2.2 Copy Your Credentials
You'll need two values:

**Project URL:**
```
https://your-project-id.supabase.co
```

**Anon/Public Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Note:** The `anon` key is safe to use in client-side code. It's protected by Row Level Security (RLS) policies.

### 2.3 Create `.env.local` File

In your `base-coach` project root, create a `.env.local` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI API Key (existing)
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

> 🔒 **Security:** `.env.local` is already in `.gitignore` and will never be committed.

---

## 📊 Step 3: Run Database Migration

### 3.1 Open SQL Editor
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**

### 3.2 Run Migration Script
1. Copy the contents of `supabase/migrations/001_initial_schema.sql`
2. Paste into the SQL Editor
3. Click **"Run"** (or press `Cmd/Ctrl + Enter`)

You should see:
```
Success. No rows returned
```

### 3.3 Verify Tables Created
1. Click **Table Editor** (left sidebar)
2. You should see 7 tables:
   - `users`
   - `teams`
   - `players`
   - `sessions`
   - `evaluations`
   - `reports`
   - `attendance`

---

## 🔐 Step 4: Configure Authentication

Authentication is already set up! The migration includes:

✅ **Row Level Security (RLS)** policies  
✅ **User table** synced with Supabase Auth  
✅ **Automatic security** (users can only see their own data)

### 4.1 Email Settings (Optional)
By default, Supabase uses their email service. For production:

1. Go to **Authentication** > **Email Templates**
2. Customize sign-up and password reset emails
3. (Later) Configure SMTP for custom domain emails

### 4.2 Auth Providers (Future)
You can enable social login later:
- Google OAuth
- GitHub OAuth
- Facebook Login

---

## 🧪 Step 5: Test Connection

### 5.1 Install Dependencies
```bash
cd base-coach
npm install
```

### 5.2 Start Dev Server
```bash
npm run dev
```

### 5.3 Check Console
You should see no errors related to Supabase. If you see:
```
Missing Supabase environment variables
```

Double-check your `.env.local` file.

---

## 📊 Understanding the Schema

### Tables Overview

```
users (coaches)
  ├── teams (multiple teams per coach)
  │   ├── players (roster)
  │   └── sessions (training sessions)
  │       ├── evaluations (player scores)
  │       ├── reports (auto-generated)
  │       └── attendance (who showed up)
```

### Key Features

**1. Row Level Security (RLS):**
- Coaches can only see their own data
- Parents can't access coach data
- Automatic security enforcement

**2. Cascading Deletes:**
- Delete a team → all players deleted
- Delete a session → all evaluations deleted
- Protects data integrity

**3. Timestamps:**
- All tables have `created_at` and `updated_at`
- Automatically updated via triggers

**4. Indexes:**
- Optimized for common queries
- Fast lookups on user_id, team_id, player_id

---

## 🔄 Database Queries (Examples)

### Get User's Teams
```typescript
const { data: teams } = await supabase
  .from('teams')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Get Team Players
```typescript
const { data: players } = await supabase
  .from('players')
  .select('*')
  .eq('team_id', teamId)
  .eq('is_active', true)
  .order('jersey_number');
```

### Create Session
```typescript
const { data: session } = await supabase
  .from('sessions')
  .insert({
    team_id: teamId,
    date: new Date().toISOString(),
    selected_valences: ['Passe Curto', 'Drible', 'Finalização'],
  })
  .select()
  .single();
```

### Save Evaluation
```typescript
const { data: evaluation } = await supabase
  .from('evaluations')
  .upsert({
    session_id: sessionId,
    player_id: playerId,
    valence: 'Passe Curto',
    score: 4,
  });
```

---

## 🚨 Troubleshooting

### Error: "Missing Supabase environment variables"
**Solution:** Check `.env.local` file exists and has correct variables.

### Error: "Invalid API key"
**Solution:** Re-copy the `anon` key from Supabase dashboard.

### Error: "Row Level Security policy violation"
**Solution:** Ensure user is authenticated before querying data.

### Error: "relation does not exist"
**Solution:** Re-run the migration script in SQL Editor.

### Can't see tables in Table Editor
**Solution:** Refresh the page or check SQL Editor for errors.

---

## 📈 Monitoring & Usage

### View Database Stats
1. Go to **Database** > **Database**
2. See:
   - Database size
   - Connection count
   - Query performance

### Check API Usage
1. Go to **Settings** > **Usage**
2. Monitor:
   - Database reads/writes
   - Storage usage
   - Bandwidth
   - Auth users

### Free Tier Limits
- **Database:** 500 MB
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **Auth users:** 50k monthly active

---

## 🔄 Migrations (Future)

When adding new features:

1. Create new migration file:
   ```
   supabase/migrations/002_add_match_analysis.sql
   ```

2. Run in SQL Editor

3. Document changes in this file

---

## 🌐 Deploy to Vercel

### Add Environment Variables
1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

5. Redeploy

---

## 🔐 Security Best Practices

✅ **NEVER commit `.env.local`** to Git  
✅ **Use RLS policies** for all tables  
✅ **Validate inputs** before database operations  
✅ **Use parameterized queries** (Supabase does this automatically)  
✅ **Rotate keys** if accidentally exposed  
✅ **Enable MFA** on Supabase account

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development)

---

## 💬 Support

If you encounter issues:
1. Check Supabase status: [status.supabase.com](https://status.supabase.com)
2. Search Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
3. Review database logs in Supabase dashboard

---

**Next Steps:** After setup, proceed to implement authentication UI and migrate app state to database.

