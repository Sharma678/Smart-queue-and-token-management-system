# Deployment Guide

This guide explains how to deploy the Queue Management System.

## Architecture Overview

- **Frontend**: React app (deploy to Vercel)
- **Backend**: Node.js/Express with SQLite (deploy to Railway/Render/Heroku)

## Option 1: Deploy Frontend to Vercel + Backend to Railway (Recommended)

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Configure Railway**
   - Root Directory: `/` (root of repo)
   - Build Command: `npm install` (or leave empty)
   - Start Command: `node server/index.js`
   - Add Environment Variable: `PORT` = `$PORT` (Railway provides this)

4. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL for frontend configuration

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI** (optional, or use web interface)
   ```bash
   npm i -g vercel
   ```

2. **Deploy from Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **Root Directory**: Set to `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Add Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_URL = https://your-app.railway.app/api
     REACT_APP_WS_URL = wss://your-app.railway.app
     ```
   - Note: Change `ws://` to `wss://` for WebSocket (secure WebSocket)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend

### Step 3: Update Backend CORS Settings

Update `server/index.js` to allow your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app'
  ],
  credentials: true
}));
```

## Option 2: Deploy Frontend to Vercel + Backend to Render

### Step 1: Deploy Backend to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: queue-management-backend
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server/index.js`
     - **Plan**: Free tier is fine

3. **Get Backend URL**
   - Render provides: `https://your-app.onrender.com`
   - Note this URL

### Step 2: Deploy Frontend to Vercel

Follow the same steps as Option 1, Step 2, but use your Render URL:
- `REACT_APP_API_URL = https://your-app.onrender.com/api`
- `REACT_APP_WS_URL = wss://your-app.onrender.com`

## Option 3: Full Stack on Railway

Railway can host both frontend and backend:

1. **Deploy Backend** (same as Option 1, Step 1)
2. **Deploy Frontend as Static Site**
   - Create new service in Railway
   - Type: "Static Site"
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Add environment variables for API URL

## Important Notes

### WebSocket Limitations
- Vercel serverless functions don't support persistent WebSocket connections
- Railway and Render support WebSocket on their paid plans
- Free tier on Render may have WebSocket limitations

### Database Considerations
- SQLite works on Railway and Render
- For production, consider PostgreSQL (Railway provides free PostgreSQL)
- Update `server/database.js` to use PostgreSQL if needed

### Environment Variables

**Backend (.env or Railway/Render settings):**
```
PORT=5000
NODE_ENV=production
```

**Frontend (Vercel environment variables):**
```
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_WS_URL=wss://your-backend-url.com
```

## Testing Deployment

1. **Test Backend**
   - Visit: `https://your-backend-url.com/api/health`
   - Should return: `{"status":"ok"}`

2. **Test Frontend**
   - Visit your Vercel URL
   - Try generating a token
   - Check if it connects to backend

## Troubleshooting

### CORS Errors
- Make sure backend CORS includes your Vercel domain
- Check environment variables are set correctly

### WebSocket Connection Failed
- Verify `REACT_APP_WS_URL` uses `wss://` (not `ws://`)
- Check if your hosting provider supports WebSocket
- The app will fall back to polling if WebSocket fails

### Database Issues
- SQLite file may not persist on some platforms
- Consider using PostgreSQL for production
- Railway provides free PostgreSQL addon

## Quick Deploy Commands

### Vercel CLI
```bash
cd client
vercel
```

### Railway CLI
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```


