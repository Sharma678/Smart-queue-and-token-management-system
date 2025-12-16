# Deploy Queue Management System to Vercel

This guide will help you deploy the frontend to Vercel. **Note:** The backend must be deployed separately (Render/Railway) as Vercel doesn't support persistent WebSocket connections.

## Architecture

- **Frontend**: Deploy to Vercel ✅
- **Backend**: Deploy to Render/Railway (required for WebSocket + SQLite)

## Prerequisites

1. GitHub account
2. Vercel account (sign up at [vercel.com](https://vercel.com))
3. Backend deployed on Render/Railway (get the backend URL first)

## Step 1: Deploy Backend First (Required)

Before deploying frontend, you need the backend URL. Deploy backend to:

### Option A: Render (Recommended)
- Follow `RENDER_DEPLOYMENT.md` to deploy backend
- Get your backend URL: `https://your-backend-name.onrender.com`

### Option B: Railway
- Go to [railway.app](https://railway.app)
- Create new project from GitHub
- Set start command: `node server/index.js`
- Get your backend URL: `https://your-app.railway.app`

**Note down your backend URL** - you'll need it for Step 2.

## Step 2: Deploy Frontend to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Select your repository

3. **Configure Project**
   - **Framework Preset**: Create React App
   - **Root Directory**: `client` (important!)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables**
   - Click **"Environment Variables"**
   - Add the following:
   
   ```
   REACT_APP_API_URL = https://your-backend-url.com/api
   REACT_APP_WS_URL = wss://your-backend-url.com
   ```
   
   **Important:**
   - Replace `your-backend-url.com` with your actual backend URL
   - Use `wss://` (secure WebSocket) not `ws://`
   - Add for all environments: Production, Preview, Development

5. **Deploy**
   - Click **"Deploy"**
   - Wait for build to complete (2-5 minutes)
   - Your app will be live at: `https://your-project.vercel.app`

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Client Directory**
   ```bash
   cd client
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No**
   - Project name? (press enter for default)
   - Directory? `./` (current directory)
   - Override settings? **No**

5. **Add Environment Variables**
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter: https://your-backend-url.com/api
   # Select: Production, Preview, Development
   
   vercel env add REACT_APP_WS_URL
   # Enter: wss://your-backend-url.com
   # Select: Production, Preview, Development
   ```

6. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Step 3: Update Backend CORS

Make sure your backend allows requests from your Vercel domain.

**In Render/Railway backend settings, add environment variable:**
```
FRONTEND_URL = https://your-project.vercel.app
```

Or update `server/index.js` manually to include your Vercel URL in CORS origins.

## Step 4: Test Your Deployment

### Test Backend
Visit: `https://your-backend-url.com/api/health`
Should return: `{"status":"ok"}`

### Test Frontend
1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Try generating a token
3. Check browser console (F12) for errors
4. Verify WebSocket connection in Network tab

## Environment Variables Reference

### Frontend (Vercel)
```
REACT_APP_API_URL = https://your-backend-url.com/api
REACT_APP_WS_URL = wss://your-backend-url.com
```

### Backend (Render/Railway)
```
PORT = 10000 (or auto-provided)
NODE_ENV = production
FRONTEND_URL = https://your-project.vercel.app
```

## Vercel Features

### Automatic Deployments
- Every push to `main` branch = Production deployment
- Pull requests = Preview deployments
- Automatic HTTPS
- Global CDN

### Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel handles SSL certificates automatically

### Environment Variables
- Set different values for Production, Preview, Development
- Access in code via `process.env.REACT_APP_*`
- Secure and encrypted

## Troubleshooting

### Build Fails

**Error: Module not found**
- Check all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: Build timeout**
- Vercel free tier: 45 seconds build time
- Optimize build or upgrade plan

### Frontend Can't Connect to Backend

**CORS Errors:**
1. Check backend CORS includes Vercel domain
2. Verify `REACT_APP_API_URL` is correct
3. Check backend is running

**Network Errors:**
1. Verify backend URL is correct
2. Check backend health endpoint
3. Ensure backend is not sleeping (Render free tier)

### WebSocket Connection Failed

**Solutions:**
1. Verify `REACT_APP_WS_URL` uses `wss://` (not `ws://`)
2. Check backend WebSocket is running
3. App will fall back to polling (5-second intervals) if WebSocket fails
4. Check browser console for specific errors

### Environment Variables Not Working

**Check:**
1. Variables are prefixed with `REACT_APP_`
2. Variables are set for correct environment
3. Redeploy after adding variables
4. Clear browser cache

## Updating Your App

### Automatic Updates
- Push to `main` branch = Auto-deploy to production
- Create PR = Preview deployment

### Manual Deploy
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" tab
4. Click "Redeploy" on any deployment

## Vercel Pricing

**Free Tier (Hobby):**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Custom domains
- Perfect for this project

**Pro Tier ($20/month):**
- Everything in Hobby
- More bandwidth
- Team collaboration
- Advanced analytics

## Project Structure for Vercel

```
your-repo/
├── client/              ← Vercel deploys from here
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vercel.json
├── server/             ← Deploy separately to Render/Railway
└── vercel.json          ← Root config (optional)
```

## Quick Commands

### Deploy via CLI
```bash
cd client
vercel
```

### View Deployments
```bash
vercel ls
```

### View Logs
```bash
vercel logs
```

### Remove Deployment
```bash
vercel remove
```

## Next Steps

1. ✅ Deploy backend to Render/Railway
2. ✅ Get backend URL
3. ✅ Deploy frontend to Vercel
4. ✅ Set environment variables
5. ✅ Test both services
6. ✅ Add custom domain (optional)
7. ✅ Set up monitoring

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions

---

**Remember:** Vercel is for frontend only. Backend must be on Render/Railway for WebSocket support.


