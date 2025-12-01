# 🚀 Deployment Guide - BaseCoach

Quick guide to deploy BaseCoach for Fernanda's Friday demo.

---

## ⚡ Quick Deploy with Vercel (Recommended)

**Estimated time:** 10 minutes

### Prerequisites:
- Node.js installed ✓ (you have this)
- Gemini API key ready
- GitHub account (optional but recommended)

---

## Method 1: Vercel CLI (Fastest)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Navigate to project
```bash
cd /Users/jacqueline.grecco/Downloads/all_projects/Projects/futsalpro-coach
```

### Step 3: Test build locally (optional but recommended)
```bash
npm run build
npm run preview
```
Visit `http://localhost:4173` to test

### Step 4: Deploy to Vercel
```bash
vercel
```

**First time prompts:**
- "Set up and deploy?" → **Yes**
- "Which scope?" → Select your account
- "Link to existing project?" → **No**
- "What's your project's name?" → `basecoach` (or keep default)
- "In which directory is your code located?" → `.` (press Enter)
- "Want to modify settings?" → **No** (Vercel auto-detects Vite)

### Step 5: Add Environment Variable

**Option A - Via Dashboard:**
1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add variable:
   - Name: `GEMINI_API_KEY`
   - Value: your-api-key-here
   - Environment: Production, Preview, Development
5. Click **Save**

**Option B - Via CLI:**
```bash
vercel env add GEMINI_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development
```

### Step 6: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 7: Get Your URL
Vercel will output something like:
```
✅ Production: https://basecoach.vercel.app
```

**Share this URL with Fernanda!** 🎉

---

## Method 2: Vercel via GitHub (Better for ongoing work)

### Step 1: Initialize Git (if not already)
```bash
cd /Users/jacqueline.grecco/Downloads/all_projects/Projects/futsalpro-coach
git init
git add .
git commit -m "Initial commit - BaseCoach MVP v1.0"
```

### Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `basecoach`
3. Description: "Youth sports evaluation platform"
4. Privacy: **Private** (for now)
5. Click **Create repository**

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/basecoach.git
git branch -M main
git push -u origin main
```

### Step 4: Import to Vercel
1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your GitHub account → Find `basecoach` repo
4. Click **Import**
5. Configure project:
   - Framework Preset: Vite (auto-detected ✓)
   - Root Directory: `./`
   - Build Command: `vite build` (auto-detected ✓)
   - Output Directory: `dist` (auto-detected ✓)
6. Add Environment Variable:
   - Click **Environment Variables**
   - Name: `GEMINI_API_KEY`
   - Value: your-api-key
   - Environments: All three checkboxes
7. Click **Deploy**

### Step 5: Wait for Deployment (1-2 minutes)
Vercel will:
- Install dependencies
- Build your app
- Deploy to CDN
- Give you a URL

### Step 6: Share the URL!
```
https://basecoach.vercel.app
```

---

## 🎨 Bonus: Custom Domain (Optional)

### If you want a nicer URL:

1. **Buy domain:** (e.g., basecoach.app on Namecheap, GoDaddy)
   - Cost: ~$10-20/year

2. **Add to Vercel:**
   - Vercel Dashboard → Your Project → Settings → Domains
   - Add your domain
   - Follow DNS instructions

3. **Update nameservers** at your domain registrar

**Your app will be at:** `https://basecoach.app` 🎉

---

## 🔧 Troubleshooting

### Build Fails
**Error:** "Module not found"
```bash
# Delete and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variable Not Working
**Problem:** AI analysis not working

**Solution:**
1. Check Vercel Dashboard → Settings → Environment Variables
2. Make sure `GEMINI_API_KEY` is set for all environments
3. Redeploy: Deployments → Latest → "..." → Redeploy

### App Shows Blank Page
**Check browser console** (F12):
- Look for errors
- Usually missing environment variable or import issue

**Fix:**
```bash
# Test locally first
npm run build
npm run preview
# Visit http://localhost:4173
```

---

## 📱 Alternative Deployment Options

### Netlify (If Vercel doesn't work)

```bash
npm install -g netlify-cli
netlify login
netlify deploy
```

Add env var:
```bash
netlify env:set GEMINI_API_KEY your-api-key
netlify deploy --prod
```

### Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Pages → Create a project
3. Connect GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
5. Environment Variables → Add `GEMINI_API_KEY`
6. Save and Deploy

### Railway.app (If you need backend later)

```bash
npm install -g railway
railway login
railway init
railway up
```

---

## ✅ Pre-Friday Checklist

Before sharing with Fernanda:

- [ ] App is deployed and accessible
- [ ] GEMINI_API_KEY is configured
- [ ] Test all features:
  - [ ] Start new session
  - [ ] Select valences
  - [ ] Evaluate players
  - [ ] Generate reports
  - [ ] Export reports
  - [ ] AI analysis works
- [ ] Test on mobile (send link to your phone)
- [ ] Clear browser cache and test as new user
- [ ] Prepare demo account/data if needed

---

## 🎯 Sharing with Fernanda

### Email Template:

```
Assunto: BaseCoach - Aplicativo de Avaliação de Atletas para Testar

Oi Fernanda!

Aqui está o link para testar o aplicativo que desenvolvemos:

🔗 https://basecoach.vercel.app

O que testar:
1. Clique em "Start New Session"
2. Selecione 2-3 critérios de avaliação
3. Avalie alguns jogadores (teste com os botões grandes de 0-5)
4. Clique em "Finish Session"
5. Vá em "Reports" para ver relatórios gerados

Recursos principais:
✅ Avalie até 3 critérios por vez (mais rápido!)
✅ Use setas do teclado (← →) ou arraste no celular
✅ Relatórios automáticos de 200-300 caracteres
✅ Exportar e compartilhar relatórios

**Teste no celular também!** O app funciona muito bem em tablets durante treinos.

Ansiosa para ouvir seu feedback na sexta-feira!

Abs,
Jacqueline
```

---

## 📊 Monitoring & Analytics (Optional)

### Add Vercel Analytics (Free):

1. Vercel Dashboard → Your Project → Analytics tab
2. Click **Enable**
3. See visitor stats, performance metrics

### Add Google Analytics (Optional):

1. Create GA4 property
2. Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🔐 Security Notes

**Important for Production:**

1. **Environment Variables:**
   - Never commit `.env.local` to git (already in .gitignore ✓)
   - Keep API keys secret
   - Rotate keys if exposed

2. **API Key Protection:**
   - Current setup: API key is in frontend (okay for demo)
   - For production: Move to backend/serverless function
   - Use Vercel Serverless Functions or Firebase Functions

3. **HTTPS:**
   - Vercel auto-provides HTTPS ✓
   - Always use HTTPS in production

---

## 🚀 Future: Auto-Deploy on Push

Once connected to GitHub:

1. Make changes locally
2. Commit:
   ```bash
   git add .
   git commit -m "Fixed bug XYZ"
   git push
   ```
3. Vercel auto-deploys! ✨
4. Get deployment notification
5. Preview URL generated automatically

---

## 💡 Pro Tips

1. **Preview Deployments:**
   - Every git branch gets its own URL
   - Test features before merging to main

2. **Rollback:**
   - Vercel Dashboard → Deployments
   - Click any previous deployment → "Promote to Production"

3. **Custom Build:**
   - Create `vercel.json` for advanced config:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "env": {
       "GEMINI_API_KEY": "@gemini-api-key"
     }
   }
   ```

4. **Free SSL Certificate:**
   - Automatic with Vercel
   - No configuration needed

5. **Global CDN:**
   - Your app is served from nearest edge location
   - Fast worldwide!

---

## 📞 Getting Help

**Vercel Docs:** https://vercel.com/docs  
**Vite Deployment:** https://vitejs.dev/guide/static-deploy.html  
**Vercel Discord:** https://vercel.com/discord

---

**Good luck with the Friday demo! 🎉**

If you run into any issues, here's a quick command to redeploy:
```bash
vercel --prod
```

