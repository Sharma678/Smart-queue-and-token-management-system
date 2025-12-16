# Deploy Queue Management System to Render

This guide will help you deploy both frontend and backend to Render.

## Prerequisites

1. GitHub account
2. Render account (sign up at [render.com](https://render.com))
3. Your code pushed to a GitHub repository

## Step 1: Deploy Backend to Render

### 1.1 Create Backend Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (if not already connected)
4. Select your repository

### 1.2 Configure Backend Service

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
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render provides this automatically, but set it just in case)

**Advanced Settings:**
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: `Yes` (deploys on every push to main branch)

### 1.3 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (usually 2-5 minutes)
4. Note your backend URL: `https://your-backend-name.onrender.com`

## Step 2: Deploy Frontend to Render

### 2.1 Create Static Site

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Select the same GitHub repository

### 2.2 Configure Frontend Service

**Basic Settings:**
- **Name**: `queue-management-frontend` (or any name you prefer)
- **Branch**: `main` (or your default branch)

**Build & Deploy:**
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

**Environment Variables:**
Add these **after** backend is deployed:
- `REACT_APP_API_URL` = `https://your-backend-name.onrender.com/api`
- `REACT_APP_WS_URL` = `wss://your-backend-name.onrender.com`

**Important**: 
- Use `wss://` (secure WebSocket) not `ws://`
- Replace `your-backend-name` with your actual backend service name

### 2.3 Deploy

1. Click **"Create Static Site"**
2. Render will build and deploy your frontend
3. Your frontend will be available at: `https://your-frontend-name.onrender.com`

## Step 3: Update Environment Variables

After both services are deployed:

1. Go to your **Frontend Static Site** settings
2. Navigate to **"Environment"** tab
3. Add/Update:
   - `REACT_APP_API_URL` = `https://your-backend-name.onrender.com/api`
   - `REACT_APP_WS_URL` = `wss://your-backend-name.onrender.com`
4. Click **"Save Changes"**
5. Render will automatically redeploy with new environment variables

## Step 4: Update Backend CORS (if needed)

If you encounter CORS errors, update `server/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-name.onrender.com'
  ],
  credentials: true
}));
```

Or set environment variable in backend:
- `FRONTEND_URL` = `https://your-frontend-name.onrender.com`

## Testing Your Deployment

### Test Backend
Visit: `https://your-backend-name.onrender.com/api/health`
Should return: `{"status":"ok"}`

### Test Frontend
1. Visit your frontend URL
2. Try generating a token
3. Check browser console for any errors
4. Verify WebSocket connection (check Network tab)

## Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- WebSocket connections may disconnect when service spins down
- Consider upgrading to paid plan for production use

### WebSocket on Render

- WebSocket is supported on Render
- Free tier may have connection limits
- Paid plans have better WebSocket support

### Database (SQLite)

- SQLite file persists on Render's disk
- Data is retained between deployments
- For production, consider PostgreSQL (Render provides free PostgreSQL addon)

### Custom Domain

You can add custom domains in Render:
1. Go to service settings
2. Click **"Custom Domains"**
3. Add your domain
4. Follow DNS configuration instructions

## Troubleshooting

### Backend Not Starting

**Check logs:**
1. Go to your backend service
2. Click **"Logs"** tab
3. Look for error messages

**Common issues:**
- Port not set correctly (should use `process.env.PORT`)
- Database file permissions
- Missing environment variables

### Frontend Can't Connect to Backend

**Check:**
1. Backend URL is correct in environment variables
2. Backend is running (check health endpoint)
3. CORS is configured correctly
4. WebSocket URL uses `wss://` not `ws://`

### WebSocket Connection Failed

**Solutions:**
1. Verify `REACT_APP_WS_URL` uses `wss://`
2. Check backend logs for WebSocket errors
3. The app will fall back to polling (5-second intervals) if WebSocket fails
4. Consider upgrading to paid plan for better WebSocket support

### Build Failures

**Frontend build fails:**
- Check Node version (Render uses Node 18 by default)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Backend build fails:**
- Ensure `package.json` has all dependencies
- Check if SQLite native modules compile correctly

## Quick Deploy Using render.yaml

If you have `render.yaml` in your repo:

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Select your repository
3. Render will detect `render.yaml` and create services automatically
4. Update environment variables manually after deployment

## Monitoring

**View Logs:**
- Go to service → **"Logs"** tab
- Real-time logs are available
- Logs are retained for 7 days (free tier)

**Metrics:**
- CPU and Memory usage
- Request count
- Response times

## Updating Your App

**Automatic Deploys:**
- Render automatically deploys on push to main branch
- Manual deploys available in dashboard

**Manual Deploy:**
1. Go to service
2. Click **"Manual Deploy"**
3. Select branch/commit
4. Click **"Deploy"**

## Cost

**Free Tier:**
- 750 hours/month per service
- Services spin down after inactivity
- Perfect for development/testing

**Paid Plans:**
- Starts at $7/month per service
- Always-on services
- Better performance
- Recommended for production

## Next Steps

1. ✅ Deploy backend
2. ✅ Deploy frontend
3. ✅ Set environment variables
4. ✅ Test both services
5. ✅ Consider custom domain
6. ✅ Set up monitoring
7. ✅ Consider upgrading for production

---

**Need Help?**
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com


