# Environment Variables Setup Guide

## 📋 Overview

Base Coach requires specific environment variables to function properly. This guide will help you set them up for both local development and production deployment.

---

## 🚨 Required Variables

### 1. **NEXT_PUBLIC_SUPABASE_URL**
- **Description:** Your Supabase project URL
- **Where to get:** Supabase Dashboard → Project Settings → API
- **Format:** `https://your-project.supabase.co`
- **Required for:** Database access, authentication

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Description:** Your Supabase anonymous/public key
- **Where to get:** Supabase Dashboard → Project Settings → API → anon public
- **Format:** Long JWT token starting with `eyJ...`
- **Required for:** Client-side database queries

### 3. **GEMINI_API_KEY**
- **Description:** Google Gemini AI API key
- **Where to get:** https://ai.google.dev/
- **Format:** Starts with `AIza...`
- **Required for:** AI coaching insights, drill suggestions, player analysis

---

## 🔧 Local Development Setup

### Step 1: Copy Environment Template

```bash
cp .env.example .env.local
```

### Step 2: Fill in Your Values

Edit `.env.local` with your actual credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini AI
GEMINI_API_KEY=AIzaSyC...

# Optional
NEXT_PUBLIC_SUPPORT_WHATSAPP=5511999999999
```

### Step 3: Validate Configuration

```bash
npm run validate-env
```

You should see:
```
✅ All required environment variables are present!
```

### Step 4: Start Development Server

```bash
npm run dev
```

---

## 🚀 Vercel Deployment Setup

### Step 1: Access Environment Variables Settings

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your **base-coach** project
3. Click **Settings** → **Environment Variables**

### Step 2: Add Each Variable

For each required variable:

1. Click **"Add New"** button
2. Enter the variable name (exactly as shown)
3. Paste the value
4. Select **all three** environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

**Add these 3 required variables:**

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [Your Supabase URL]
Environments: ✅ All

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Your Supabase Anon Key]
Environments: ✅ All

Name: GEMINI_API_KEY
Value: [Your Gemini API Key]
Environments: ✅ All
```

**Optional variable:**

```
Name: NEXT_PUBLIC_SUPPORT_WHATSAPP
Value: [Your WhatsApp number]
Environments: ✅ All
```

### Step 3: Trigger Deployment

After adding variables, you must redeploy:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click **•••** on latest deployment
3. Click **Redeploy**

**Option B: Via Git Push**
```bash
git commit --allow-empty -m "chore: trigger redeploy with env vars"
git push
```

### Step 4: Verify Deployment

1. Wait for deployment to complete (~1-2 minutes)
2. Visit your production URL: `https://your-app.vercel.app`
3. You should see the login page (not 404)

---

## ✅ Validation

### Build-Time Validation

The app automatically validates environment variables during build:

```bash
npm run build
```

If variables are missing, you'll see:
```
❌ VALIDATION FAILED!
Missing required environment variables.
```

### Runtime Validation

The app also validates at runtime. Missing variables will show:
- Console errors with specific variable names
- User-friendly error messages
- Links to configuration instructions

---

## 🐛 Troubleshooting

### Problem: "404: NOT_FOUND" on Vercel

**Cause:** Environment variables not configured or deployment not updated

**Solution:**
1. Verify all variables are in Vercel settings
2. Ensure all 3 environments are checked
3. Redeploy the application
4. Hard refresh browser: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)

### Problem: "Missing Supabase environment variables"

**Cause:** Variables not set or incorrectly named

**Solution:**
1. Check variable names match exactly (case-sensitive)
2. Verify no extra spaces in values
3. Run `npm run validate-env` locally
4. Check Vercel dashboard shows all variables

### Problem: Build succeeds but app doesn't work

**Cause:** Variables may be set but with incorrect values

**Solution:**
1. Verify Supabase URL format: `https://[project-ref].supabase.co`
2. Verify anon key starts with `eyJ`
3. Verify Gemini API key starts with `AIza`
4. Test values in `.env.local` first

### Problem: "This module is not supported, and leaks memory" warnings

**Cause:** npm deprecation warnings (not environment related)

**Solution:** These are warnings from dependencies, not errors. Safe to ignore during deployment.

---

## 📚 Additional Resources

### Get Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon)
4. Click **API** in sidebar
5. Copy **Project URL** and **anon public** key

### Get Gemini API Key
1. Go to https://ai.google.dev/
2. Click **Get API Key**
3. Create or select a project
4. Copy the generated API key

### Vercel Documentation
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Deployment Configuration](https://vercel.com/docs/deployments/overview)

---

## 🔒 Security Best Practices

### ✅ DO:
- Use `.env.local` for local development
- Add `.env.local` to `.gitignore` (already done)
- Store sensitive keys in Vercel environment variables
- Rotate keys regularly
- Use different keys for development and production

### ❌ DON'T:
- Commit `.env.local` to git
- Share keys in public channels
- Use production keys in development
- Hardcode keys in source code
- Add `SUPABASE_ACCESS_TOKEN` to Vercel (local only)

---

## 📞 Need Help?

If you continue to have issues:

1. **Check the logs:**
   - Vercel: Deployment → Build Logs
   - Local: Terminal output

2. **Verify configuration:**
   ```bash
   npm run validate-env
   ```

3. **Test locally first:**
   ```bash
   npm run dev
   ```

4. **Contact support:**
   - GitHub Issues: [your-repo]/issues
   - Email: your-support-email

