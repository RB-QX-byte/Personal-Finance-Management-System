# Frontend Deployment Guide - Vercel

## Quick Deployment Steps

### 1. Prerequisites
- GitHub account with repository pushed
- Vercel account (sign up at https://vercel.com)
- Backend deployed on Render (to get the API URL)

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended for First Deployment)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Your Repository**
   - Select "Import Git Repository"
   - Choose your GitHub repository: `Personal-Finance-Management-System`
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend-mern`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add these:

   | Name | Value |
   |------|-------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyAHkQ2fH78BdQGw-NetufYfGCohCpI4u64` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `dashboard-c3caf.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `dashboard-c3caf` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `dashboard-c3caf.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `528433435525` |
   | `VITE_FIREBASE_APP_ID` | `1:528433435525:web:70564df33705ecd345eaec` |
   | `VITE_FIREBASE_MEASUREMENT_ID` | `G-80C0XVMKXL` |
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` |
   | `VITE_APP_ENV` | `production` |
   | `VITE_APP_NAME` | `Personal Finance Manager` |
   | `VITE_ENABLE_AI_FEATURES` | `true` |
   | `VITE_ENABLE_RECEIPT_SCANNING` | `true` |
   | `VITE_ENABLE_MULTI_CURRENCY` | `true` |
   | `VITE_ENABLE_ANALYTICS` | `true` |

   **Important**: Replace `https://your-backend.onrender.com/api` with your actual Render backend URL!

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-3 minutes)
   - You'll get a URL like: `https://your-app.vercel.app`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend-mern

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? personal-finance-frontend
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### 3. Post-Deployment Steps

#### A. Get Your Frontend URL
After deployment, copy your Vercel URL (e.g., `https://personal-finance-frontend.vercel.app`)

#### B. Update Backend CORS
1. Go to Render dashboard → Your backend service
2. Go to "Environment" tab
3. Update `CLIENT_URL` environment variable:
   ```
   CLIENT_URL=https://personal-finance-frontend.vercel.app
   ```
4. Save changes (Render will automatically redeploy)

#### C. Test Your Application
1. Visit your Vercel URL
2. Try to sign up/login
3. Check browser console for any errors
4. Test API calls to backend

### 4. Troubleshooting

#### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure `npm run build` works locally

#### API Connection Issues
- Verify `VITE_API_URL` is correct in Vercel env vars
- Check backend CORS settings include your Vercel URL
- Check Network tab in browser dev tools

#### Firebase Authentication Issues
- Verify all Firebase env vars are set correctly
- Check Firebase Console → Authentication → Settings
- Add your Vercel domain to authorized domains

### 5. Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued (automatic)

### 6. Automatic Deployments

Vercel automatically deploys when you push to GitHub:
- **Production**: Pushes to `main` branch
- **Preview**: Pushes to other branches or pull requests

### 7. Useful Vercel Commands

```bash
# View deployment logs
vercel logs

# List all deployments
vercel ls

# Remove a deployment
vercel rm [deployment-url]

# Open project in browser
vercel open

# Check deployment status
vercel inspect [deployment-url]
```

## Environment Variables Reference

See `.env.production.template` for the complete list of environment variables needed for production deployment.

## Support

- Vercel Documentation: https://vercel.com/docs
- Vite Documentation: https://vitejs.dev/guide/
- React Router with Vercel: https://vercel.com/guides/deploying-react-with-vercel
