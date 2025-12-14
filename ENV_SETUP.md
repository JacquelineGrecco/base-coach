# Environment Variables Setup

## 📋 Required Environment Variables

BaseCoach uses environment variables for sensitive configuration. Follow these steps to set them up:

---

## 🚀 Quick Setup

### 1. Create `.env.local` file

Copy the example file:
```bash
cp .env.example .env.local
```

### 2. Update the values

Open `.env.local` and replace with your actual values:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini API (Optional - for AI features)
VITE_GEMINI_API_KEY=your-gemini-api-key

# WhatsApp Support Number (Required)
VITE_SUPPORT_WHATSAPP=5511999999999
```

### 3. Restart development server

```bash
npm run dev
```

---

## 📱 WhatsApp Number Format

**Format:** `CountryCode` + `DDD` + `PhoneNumber` (no spaces/dashes)

### Brazil Examples:

| City | DDD | Format | Example |
|------|-----|--------|---------|
| São Paulo | 11 | 5511NNNNNNNNN | `5511987654321` |
| Rio de Janeiro | 21 | 5521NNNNNNNNN | `5521987654321` |
| Brasília | 61 | 5561NNNNNNNNN | `5561987654321` |
| Salvador | 71 | 5571NNNNNNNNN | `5571987654321` |
| Belo Horizonte | 31 | 5531NNNNNNNNN | `5531987654321` |

**Components:**
- `55` = Brazil country code
- `11` = Area code (DDD)
- `9` = Mobile prefix (9th digit)
- `87654321` = Phone number

---

## 🔍 Where to Find Values

### Supabase URL & Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Gemini API Key (Optional)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Copy → `VITE_GEMINI_API_KEY`

### WhatsApp Number
- Use your business/support WhatsApp number
- Format: Country code + DDD + number
- Example: `5511987654321`

---

## ⚠️ Important Notes

### Security
- ✅ `.env.local` is in `.gitignore` (never commit it!)
- ✅ Use different values for dev/staging/production
- ✅ Never share your keys publicly

### Vite Prefix
- All environment variables **must** start with `VITE_`
- Example: `VITE_SUPABASE_URL` ✅
- Example: `SUPABASE_URL` ❌ (won't work)

### Fallback Values
If not set, the app uses these defaults:
- `VITE_SUPPORT_WHATSAPP` → `5511999999999` (placeholder)

---

## 🧪 Testing Setup

Verify your environment variables are loaded:

```typescript
// In your browser console:
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPPORT_WHATSAPP);
```

Should show your actual values (not `undefined`).

---

## 🚀 Deployment (Vercel)

### Option 1: Vercel Dashboard
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPPORT_WHATSAPP`
4. Redeploy

### Option 2: Vercel CLI
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_SUPPORT_WHATSAPP
```

---

## 🐛 Troubleshooting

### "Environment variable not found"
- Check the variable name starts with `VITE_`
- Restart dev server after changing `.env.local`
- Verify `.env.local` is in the project root

### "WhatsApp link not opening"
- Check number format (no spaces/dashes)
- Verify country code is correct
- Test format: `https://wa.me/5511999999999`

### "Supabase errors"
- Verify URL format: `https://xxx.supabase.co`
- Check anon key is correct (long string)
- Ensure keys match your project

---

## 📝 Example `.env.local`

```env
# Complete example - replace with your values
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyA...
VITE_SUPPORT_WHATSAPP=5511987654321
```

---

## ✅ Checklist

Before running the app:

- [ ] Created `.env.local` file
- [ ] Added `VITE_SUPABASE_URL`
- [ ] Added `VITE_SUPABASE_ANON_KEY`
- [ ] Added `VITE_SUPPORT_WHATSAPP` (your actual number)
- [ ] Restarted dev server
- [ ] Tested login/signup works
- [ ] Tested WhatsApp link opens correctly

---

**Need help?** Check the [Vite environment variables docs](https://vitejs.dev/guide/env-and-mode.html)



