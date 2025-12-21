# Supabase Storage Setup - Profile Pictures

## 🎯 What This Enables

Users can upload profile pictures (avatars) that:
- ✅ Store securely in Supabase Storage
- ✅ Display throughout the app
- ✅ Auto-resize and optimize
- ✅ Have size limits (2MB max)

---

## 🚀 Setup Steps

### Step 1: Create Storage Bucket

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `htdplqoestywzzzfhokc`
3. Click **Storage** in the left sidebar
4. Click **"New bucket"**

**Bucket Settings:**
```
Name: avatars
Public: ✅ Yes (checked)
File size limit: 2097152 (2MB in bytes)
Allowed MIME types: image/jpeg, image/png, image/webp
```

5. Click **"Create bucket"**

---

### Step 2: Set Up RLS Policies for Storage

After creating the bucket, set up security policies:

1. Click on the **"avatars"** bucket
2. Go to **"Policies"** tab
3. Click **"New policy"**

#### **Policy 1: Users can upload to their own folder**

```sql
-- Policy name: Users can upload own avatars
-- Operation: INSERT
-- Policy definition:
(bucket_id = 'avatars'::text) AND 
((storage.foldername(name))[1] = (auth.uid())::text)
```

#### **Policy 2: Anyone can view avatars (public)**

```sql
-- Policy name: Public avatars are viewable
-- Operation: SELECT
-- Policy definition:
(bucket_id = 'avatars'::text)
```

#### **Policy 3: Users can delete their own avatars**

```sql
-- Policy name: Users can delete own avatars
-- Operation: DELETE
-- Policy definition:
(bucket_id = 'avatars'::text) AND 
((storage.foldername(name))[1] = (auth.uid())::text)
```

---

### Step 3: Alternative (SQL Editor Method)

Or run this in **SQL Editor**:

```sql
-- Create storage bucket (if using SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload to own folder
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public read access
CREATE POLICY "Public avatars are viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can delete own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🎨 How It Works

### File Structure:
```
avatars/
  ├─ user-id-1/
  │   └─ user-id-1-1234567890.jpg
  ├─ user-id-2/
  │   └─ user-id-2-1234567891.png
  └─ user-id-3/
      └─ user-id-3-1234567892.webp
```

### Upload Flow:
```
1. User selects image → File picker opens
2. File selected → Validate (type, size)
3. Upload to Supabase → {userId}/{userId}-{timestamp}.ext
4. Get public URL → https://...supabase.co/storage/v1/object/public/avatars/...
5. Update profile → profile_picture_url = public URL
6. Display avatar → <img src={profile_picture_url} />
```

### Default Avatar:
If no picture uploaded, shows **circular badge with initials**:
```
┌─────────┐
│         │
│   JG    │  ← User's initials
│         │
└─────────┘
```

---

## 🔒 Security

### What's Protected:
- ✅ Users can only upload to their own folder (`/userId/`)
- ✅ Users can only delete their own images
- ✅ File size limited to 2MB
- ✅ Only image types allowed (jpg, png, webp)

### What's Public:
- ✅ All avatars are publicly viewable (by design)
- ✅ Anyone with URL can see the image
- ⚠️ Don't upload sensitive images

---

## 🧪 Testing

### Test Upload:
1. Go to Configurações
2. Click camera icon on avatar
3. Select an image (< 2MB)
4. Watch it upload
5. See new avatar displayed ✅

### Test Delete:
1. Click "Remover" link
2. Avatar deleted
3. Back to initials ✅

### Test Size Limit:
1. Try to upload 3MB+ image
2. Should show error: "A imagem deve ter no máximo 2MB" ❌

### Test Invalid File:
1. Try to upload a PDF or video
2. Should show error: "O arquivo deve ser uma imagem" ❌

---

## 📊 Storage Limits (Free Tier)

- **Storage:** 1 GB total
- **Bandwidth:** 2 GB/month
- **File uploads:** Unlimited count

**Estimate:** 1GB = ~2,000 profile pictures (500KB each)

---

## 🐛 Troubleshooting

### Error: "new row violates row-level security policy"
**Solution:** RLS policies not set up correctly. Re-run the policy creation SQL.

### Error: "Bucket not found"
**Solution:** Create the "avatars" bucket in dashboard first.

### Error: "File too large"
**Solution:** User trying to upload >2MB. Message already shows this.

### Images not displaying
**Solution:** Check if bucket is set to "Public". URLs should work without auth.

---

## ✅ Checklist

- [ ] Create "avatars" bucket in Supabase Storage
- [ ] Set bucket to Public
- [ ] Set file size limit to 2MB
- [ ] Add RLS policies (INSERT, SELECT, DELETE)
- [ ] Run migration 010 (add bio and profile_picture_url columns)
- [ ] Test image upload
- [ ] Test image delete
- [ ] Test default avatar (initials)

---

**Next Steps:** Create the bucket in Supabase dashboard, then test!






