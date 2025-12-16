# Environment Variables Setup Guide

## Problem: "Failed to fetch" Error

If you're getting "Failed to fetch" errors when trying to add counters or generate tokens, it's because the frontend doesn't know where your backend is located.

## Solution: Set Environment Variables

### For Vercel Deployment (Production)

1. **Go to Vercel Dashboard**
   - Open your project on Vercel
   - Go to **Settings** → **Environment Variables**

2. **Add These Variables:**

   ```
   REACT_APP_API_URL = https://queue-management-backend-3bh9.onrender.com/api
   REACT_APP_WS_URL = wss://queue-management-backend-3bh9.onrender.com
   ```

3. **Important:**
   - Set these for **Production**, **Preview**, and **Development** environments
   - After adding, **redeploy** your application

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger automatic deployment

### For Local Development

Create a `.env` file in the `client` folder:

```bash
# client/.env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```

**Note:** The `.env` file should be in the `client` folder, not the root folder.

### Verify Environment Variables

After setting up, check the browser console (F12). You should see:
- `API Base URL: https://queue-management-backend-3bh9.onrender.com/api` (for production)
- Or `API Base URL: http://localhost:5000/api` (for local)

## Quick Fix Checklist

- [ ] Environment variables set in Vercel
- [ ] Variables set for all environments (Production, Preview, Development)
- [ ] Application redeployed after adding variables
- [ ] Backend is running and accessible
- [ ] Check browser console for API URL confirmation

## Testing Backend Connection

Test if your backend is accessible:
- Health Check: `https://queue-management-backend-3bh9.onrender.com/api/health`
- Should return: `{"status":"ok"}`

## Common Issues

### Issue: Still getting "Failed to fetch"
**Solution:** 
1. Make sure you redeployed after adding environment variables
2. Clear browser cache
3. Check browser console for the actual API URL being used

### Issue: CORS errors
**Solution:** 
- Backend CORS is already configured to allow all origins
- If still having issues, check backend logs on Render

### Issue: WebSocket connection failed
**Solution:**
- Make sure `REACT_APP_WS_URL` uses `wss://` (secure) not `ws://`
- The app will fall back to polling if WebSocket fails

## Backend URL Reference

Your backend URL: `https://queue-management-backend-3bh9.onrender.com`

- API Endpoint: `https://queue-management-backend-3bh9.onrender.com/api`
- WebSocket: `wss://queue-management-backend-3bh9.onrender.com`

