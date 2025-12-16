# Complete Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide will help you deploy the Queue Management System with:
- **Backend**: Render (for WebSocket + SQLite support)
- **Frontend**: Vercel (for fast, global CDN)

## Prerequisites

1. GitHub account
2. Render account (sign up at [render.com](https://render.com))
3. Vercel account (sign up at [vercel.com](https://vercel.com))
4. Your code pushed to a GitHub repository

---

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account & Connect GitHub

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign up/Login with GitHub
3. Authorize Render to access your repositories

### Step 2: Create Backend Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (if not already connected)
3. Select your repository

### Step 3: Configure Backend Service

**Basic Settings:**
- **Name**: `queue-management-backend` (or any name you prefer)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

**Build & Deploy:**
- **Root Directory**: Leave empty (or `/` if needed)
- **Build Command**: `npm install`
- **Start Command**: `node server/index.js`

**Environment Variables:**
Click "Advanced" → "Add Environment Variable":
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render provides this automatically, but set it for safety)

**Advanced Settings:**
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: `Yes` (deploys on every push to main branch)

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (usually 2-5 minutes)
4. **IMPORTANT**: Copy your backend URL: `https://your-backend-name.onrender.com`
   - You'll need this for the frontend configuration!

### Step 5: Test Backend

Visit: `https://your-backend-name.onrender.com/api/health`
Should return: `{"status":"ok"}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account & Connect GitHub

1. Go to [Vercel Dashboard](https://vercel.com)
2. Sign up/Login with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import Project to Vercel

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Select your repository

### Step 3: Configure Frontend Project

**Project Settings:**
- **Framework Preset**: Create React App (auto-detected)
- **Root Directory**: `client` ⚠️ **IMPORTANT - Change this!**
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `build` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

**Environment Variables:**
Click "Environment Variables" and add:

```
REACT_APP_API_URL = https://your-backend-name.onrender.com/api
REACT_APP_WS_URL = wss://your-backend-name.onrender.com
```

**⚠️ CRITICAL:**
- Replace `your-backend-name` with your actual Render backend service name
- Use `wss://` (secure WebSocket) not `ws://`
- Add for all environments: Production, Preview, Development

### Step 4: Deploy Frontend

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Your frontend will be live at: `https://your-project.vercel.app`

### Step 5: Test Frontend

1. Visit your Vercel URL
2. Try generating a token
3. Check browser console (F12) for any errors
4. Verify it connects to your Render backend

---

## Part 3: Update Backend CORS

Your backend needs to allow requests from your Vercel domain.

### Option 1: Using Environment Variable (Recommended)

1. Go to your Render backend service
2. Click **"Environment"** tab
3. Add environment variable:
   ```
   FRONTEND_URL = https://your-project.vercel.app
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

### Option 2: Manual Update

Update `server/index.js` to include your Vercel URL in CORS origins (already configured to read from `FRONTEND_URL` env var).

---

## Complete Configuration Summary

### Backend (Render) Environment Variables:
```
NODE_ENV = production
PORT = 10000
FRONTEND_URL = https://your-project.vercel.app
```

### Frontend (Vercel) Environment Variables:
```
REACT_APP_API_URL = https://your-backend-name.onrender.com/api
REACT_APP_WS_URL = wss://your-backend-name.onrender.com
```

### URLs You'll Have:
- **Backend**: `https://your-backend-name.onrender.com`
- **Frontend**: `https://your-project.vercel.app`

---

## Testing Your Deployment

### 1. Test Backend Health
```
https://your-backend-name.onrender.com/api/health
```
Expected: `{"status":"ok"}`

### 2. Test Backend Root
```
https://your-backend-name.onrender.com/
```
Expected: API information JSON

### 3. Test Frontend
- Visit your Vercel URL
- Generate a token
- Check if queue updates in real-time
- Try admin panel features

### 4. Check WebSocket Connection
- Open browser DevTools (F12)
- Go to Network tab
- Filter by "WS" (WebSocket)
- Should see connection to `wss://your-backend-name.onrender.com`

---

## Troubleshooting

### Backend Issues

**Service won't start:**
1. Check Render logs (service → "Logs" tab)
2. Verify `node server/index.js` is correct start command
3. Check if all dependencies are in `package.json`

**Database errors:**
- SQLite should work on Render
- Check file permissions in logs
- Database file persists between deployments

**Port errors:**
- Render provides `PORT` automatically
- Code uses `process.env.PORT || 5000` (correct)

### Frontend Issues

**Build fails:**
- Check Vercel build logs
- Verify all dependencies in `client/package.json`
- Ensure Root Directory is set to `client`

**Can't connect to backend:**
- Verify `REACT_APP_API_URL` is correct
- Check backend is running (test health endpoint)
- Verify CORS is configured correctly
- Check browser console for specific errors

**WebSocket connection failed:**
- Verify `REACT_APP_WS_URL` uses `wss://` (not `ws://`)
- Check backend WebSocket is running
- App will fall back to polling (5-second intervals) if WebSocket fails
- Check browser console for WebSocket errors

**Environment variables not working:**
- Variables must start with `REACT_APP_`
- Redeploy after adding variables
- Clear browser cache
- Check variables are set for correct environment

### CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Requests fail with CORS policy errors

**Solution:**
1. Add `FRONTEND_URL` to Render backend environment variables
2. Or manually update `server/index.js` CORS origins
3. Redeploy backend

---

## Important Notes

### Render Free Tier Limitations

- **Spin-down**: Services spin down after 15 minutes of inactivity
- **Cold start**: First request after spin-down takes ~30 seconds
- **WebSocket**: May disconnect when service spins down
- **Solution**: Consider upgrading to paid plan ($7/month) for production

### Vercel Free Tier

- **Unlimited deployments**
- **100GB bandwidth/month**
- **Automatic HTTPS**
- **Perfect for this project**

### WebSocket on Render

- ✅ WebSocket is supported
- ⚠️ Free tier may have connection limits
- 💰 Paid plans have better WebSocket support
- 🔄 App falls back to polling if WebSocket fails

### Database (SQLite)

- ✅ SQLite file persists on Render's disk
- ✅ Data is retained between deployments
- 💡 For production, consider PostgreSQL (Render provides free addon)

---

## Updating Your App

### Automatic Deployments

**Render:**
- Push to `main` branch = Auto-deploy backend
- Check "Auto-Deploy" is enabled in settings

**Vercel:**
- Push to `main` branch = Auto-deploy frontend (production)
- Create PR = Preview deployment

### Manual Deployments

**Render:**
1. Go to service → "Manual Deploy"
2. Select branch/commit
3. Click "Deploy"

**Vercel:**
1. Go to project → "Deployments" tab
2. Click "Redeploy" on any deployment

---

## Custom Domains

### Render Custom Domain

1. Go to backend service → "Settings"
2. Click "Custom Domains"
3. Add your domain
4. Follow DNS configuration instructions

### Vercel Custom Domain

1. Go to project → "Settings" → "Domains"
2. Add your domain
3. Follow DNS configuration instructions
4. Vercel handles SSL automatically

---

## Monitoring & Logs

### Render Logs

1. Go to service → "Logs" tab
2. Real-time logs available
3. Logs retained for 7 days (free tier)

### Vercel Logs

1. Go to project → "Deployments"
2. Click on any deployment
3. View build logs and runtime logs

---

## Cost Estimate

### Free Tier (Development/Testing)

**Render:**
- 750 hours/month per service
- Services spin down after inactivity
- Perfect for development

**Vercel:**
- Unlimited deployments
- 100GB bandwidth/month
- Perfect for this project

**Total: $0/month** ✅

### Paid Tier (Production)

**Render:**
- $7/month per service (always-on)
- Better WebSocket support
- No spin-down delays

**Vercel:**
- Free tier is sufficient
- Or $20/month for Pro (if needed)

**Total: ~$7/month** for production-ready setup

---

## Quick Reference

### Backend URL Format
```
https://your-backend-name.onrender.com
```

### Frontend URL Format
```
https://your-project.vercel.app
```

### Environment Variables Checklist

**Render (Backend):**
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `FRONTEND_URL` = `https://your-project.vercel.app`

**Vercel (Frontend):**
- [ ] `REACT_APP_API_URL` = `https://your-backend-name.onrender.com/api`
- [ ] `REACT_APP_WS_URL` = `wss://your-backend-name.onrender.com`

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Get backend URL
3. ✅ Deploy frontend to Vercel
4. ✅ Set environment variables
5. ✅ Update backend CORS
6. ✅ Test both services
7. ✅ Add custom domains (optional)
8. ✅ Set up monitoring
9. ✅ Consider upgrading for production

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Vercel Docs**: https://vercel.com/docs
- **Vercel Community**: https://github.com/vercel/vercel/discussions

---

**You're all set!** Your Queue Management System is now live on Render (backend) + Vercel (frontend). 🚀


