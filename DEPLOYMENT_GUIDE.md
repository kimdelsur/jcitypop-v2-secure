# 🚀 Vercel Deployment Guide

This guide will walk you through deploying your Japanese City Pop MIDI app to Vercel securely.

## ⚠️ URGENT: Secure Your API Key FIRST

**Before doing anything else**, if you previously deployed with an exposed API key:

### 1. Rotate Your API Key (Do this NOW!)

1. Go to https://aistudio.google.com/app/apikey
2. Find your current API key
3. Click the **Delete** button (🗑️) to revoke it
4. Click **Create API Key** to generate a new one
5. Copy the new key and save it somewhere safe (you'll need it in Step 3)

**Why?** Your old key was exposed in your client-side JavaScript bundle. Anyone who visited your site could have extracted it. Deleting it ensures it can't be misused.

---

## 📦 Step 1: Upload Code to GitHub

### Option A: Update Your Existing Repository

```bash
# Navigate to your local copy of the repository
cd /path/to/jcitypopv2

# Replace the old files with the refactored version
# (Copy all files from jcitypop-refactored into your repo)

# Add and commit the changes
git add .
git commit -m "Refactor for secure Vercel deployment"

# Push to GitHub
git push origin main
```

### Option B: Create a New Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `jcitypop-v2-secure`)
3. Follow GitHub's instructions to push your code:

```bash
cd /path/to/jcitypop-refactored
git init
git add .
git commit -m "Initial commit - refactored codebase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 🔐 Step 2: Set Up API Key Restrictions (Highly Recommended)

Protect your new API key from abuse:

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your API key in the list and click the pencil icon (✏️) to edit
3. **Application restrictions**:
   - Select **HTTP referrers (websites)**
   - Click **Add an item**
   - Add: `https://*.vercel.app/*` (covers all Vercel deployments)
   - Add: `http://localhost:3000/*` (for local development)
4. **API restrictions**:
   - Select **Restrict key**
   - Check only: **Generative Language API**
5. Click **Save**

**Note**: After deploying to Vercel, come back and add your specific domain (e.g., `https://jcitypop1.vercel.app/*`)

---

## 🌐 Step 3: Deploy to Vercel

### Using Vercel Dashboard (Easiest)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in or create an account

2. **Import Your Repository**
   - Click **Add New...** → **Project**
   - Select **Import Git Repository**
   - Choose your GitHub repository (you may need to authorize Vercel to access your repos)

3. **Configure Build Settings**

   Vercel should auto-detect these settings, but verify:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variable**

   This is **CRITICAL**:
   - Scroll down to **Environment Variables**
   - Click **Add**
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Paste your NEW Gemini API key from Step 1
   - **Environments**: Check all three (Production, Preview, Development)
   - Click **Add**

5. **Deploy**
   - Click **Deploy**
   - Wait for the build to complete (usually 1-2 minutes)
   - You'll get a URL like `https://your-project-name.vercel.app`

---

## ✅ Step 4: Verify Deployment

1. **Visit Your Deployed Site**
   - Click the URL Vercel provides
   - You should see the Japanese City Pop MIDI interface

2. **Check for Errors**
   - Open your browser's Developer Tools (F12 or right-click → Inspect)
   - Go to the **Console** tab
   - Look for any red error messages
   - Common errors:
     - `VITE_GEMINI_API_KEY environment variable is not set` → Go back to Vercel settings and add the env var
     - `Connection error` → Check your API key is valid and restrictions are set correctly

3. **Test the App**
   - Click the Play button
   - Adjust some prompt weights using the knobs
   - You should start hearing AI-generated music within a few seconds

---

## 🎯 Step 5: Update API Restrictions (Final Step)

Now that you have your actual Vercel URL:

1. Go back to https://console.cloud.google.com/apis/credentials
2. Edit your API key
3. Under **HTTP referrers**, add your specific domain:
   - Example: `https://jcitypop1.vercel.app/*`
4. You can remove the wildcard `https://*.vercel.app/*` if you want to be more restrictive
5. Click **Save**

---

## 🔄 Making Updates

After the initial deployment, updates are automatic:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update description"
   git push
   ```
3. Vercel will automatically detect the push and redeploy

---

## 🐛 Troubleshooting

### Build fails with "VITE_GEMINI_API_KEY is not set"

**Solution**:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add `VITE_GEMINI_API_KEY` with your API key
4. Redeploy by going to **Deployments** → click the ⋯ menu → **Redeploy**

### "Connection error, please restart audio"

**Possible causes**:
1. API key is invalid
2. API restrictions are blocking your domain
3. Generative Language API is not enabled

**Solution**:
1. Verify your API key is correct in Vercel settings
2. Check API restrictions allow your Vercel domain
3. Go to https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com and ensure it's enabled

### App loads but no sound plays

**Possible causes**:
1. Browser audio permissions not granted
2. No prompts have weight > 0
3. MIDI controller not connected (optional)

**Solution**:
1. Check browser console for permission errors
2. Make sure at least one knob is turned up
3. MIDI controller is optional - you can use the on-screen controls

### 403 Forbidden Error

**Solution**: This was your original issue. It should be fixed now, but if it persists:
1. Check Vercel deployment logs for errors
2. Ensure `vercel.json` is in your repository root
3. Try redeploying

---

## 📊 Monitoring Usage

To avoid unexpected API bills:

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Enabled APIs**
4. Click **Generative Language API**
5. View usage metrics and set up billing alerts

---

## 🎉 You're Done!

Your app is now securely deployed with:
- ✅ API key protected (not in git)
- ✅ Environment variables properly configured
- ✅ API restrictions enabled
- ✅ Automatic deployments from GitHub
- ✅ No more 403 errors!

Enjoy creating some groovy City Pop! 🎵🌆✨
