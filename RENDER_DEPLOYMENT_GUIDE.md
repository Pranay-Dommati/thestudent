# 🚀 Deploying Django Backend to Render

This guide walks you through deploying your Django backend to Render.com while using your existing Hostinger MySQL database and frontend.

## 📋 Prerequisites

- ✅ Frontend deployed on Hostinger (easylearnova.com)
- ✅ MySQL database on Hostinger
- ✅ GitHub repository with your backend code
- ✅ Render.com account (free tier works fine for testing)

## 🎯 Architecture Overview

```
Frontend (Hostinger)          Backend (Render)           Database (Hostinger)
https://easylearnova.com  →  https://xxx.onrender.com  →  MySQL on Hostinger
```

## 📝 Step 1: Prepare Your Repository

### 1.1 Verify Files Exist
Make sure you have these files in the correct locations:
- ✅ `render.yaml` - Render configuration (repository root)
- ✅ `requirements.txt` - Python dependencies (repository root)
- ✅ `build.sh` - Build script (repository root)
- ✅ `backend/manage.py` - Django project (in backend/ folder)
- ✅ `backend/backend/settings.py` - Django settings

Your project structure:
```
thestudent/                 ← Repository root (Render starts here)
├── render.yaml            ← Render config
├── requirements.txt       ← Dependencies
├── build.sh              ← Build script
├── .env                  ← Environment variables (not committed)
└── backend/              ← Django project folder
    ├── manage.py         ← Django management
    └── backend/          ← Django app folder
        ├── settings.py
        ├── wsgi.py
        └── urls.py
```

**Why this structure?**
- `requirements.txt` is in root → Render installs from root
- `build.sh` is in root → Render runs it from root
- `build.sh` does `cd backend` → Then runs Django commands
- Start command does `cd backend && gunicorn` → Runs server from backend/

### 1.2 Make build.sh Executable (if on Linux/Mac)
```bash
chmod +x build.sh
```

### 1.3 Commit and Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin dep-backend
```

## 🌐 Step 2: Create Render Web Service

### 2.1 Sign Up / Log In to Render
1. Go to https://render.com
2. Sign up with GitHub (recommended) or email

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository: `Pranay-Dommati/thestudent`
4. Click **"Connect"**

### 2.3 Configure Basic Settings
- **Name**: `easylearnova-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Oregon, Frankfurt)
- **Branch**: `dep-backend`
- **Root Directory**: Leave empty (Render will use repository root where requirements.txt is)
- **Runtime**: `Python 3`
- **Build Command**: `./build.sh`
- **Start Command**: `cd backend && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- **Plan**: `Free` (or `Starter` for production - $7/month, no sleep)

## 🔐 Step 3: Configure Environment Variables

In the Render dashboard for your service, go to **"Environment"** tab and add these variables:

### 3.1 Django Core Settings
```bash
DEBUG=False
PYTHON_VERSION=3.12.0
```

**SECRET_KEY**: Click "Generate" for a secure random key

**ALLOWED_HOSTS**: Your Render URL + Hostinger domain
```bash
ALLOWED_HOSTS=easylearnova-backend.onrender.com,easylearnova.com,www.easylearnova.com
```

### 3.2 Database Settings (Hostinger MySQL)
```bash
DB_ENGINE=mysql
DB_HOST=srv1990.hstgr.io
DB_PORT=3306
DB_NAME=u787111463_easylearnovadb
DB_USER=u787111463_teamlearnova
DB_PASSWORD=EasyLearnova@pranay.23
DB_SSL_REQUIRE=false
DB_CONN_MAX_AGE=60
```

### 3.3 CORS and CSRF Settings
```bash
CORS_ALLOWED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com
CSRF_TRUSTED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com,https://easylearnova-backend.onrender.com
FRONTEND_DOMAIN=https://www.easylearnova.com
```

### 3.4 API Keys
```bash
YOUTUBE_API_KEY=AIzaSyCr1keMD9s-HxO-s2jq46a-yxdDrRDUiuE
GEMINI_API_KEY=AIzaSyCr1keMD9s-HxO-s2jq46a-yxdDrRDUiuE
GOOGLE_SEARCH_API_KEY=AIzaSyCr1keMD9s-HxO-s2jq46a-yxdDrRDUiuE
GOOGLE_SEARCH_ENGINE_ID=b5d49b623e0054ad9
```

### 3.5 Google OAuth2
```bash
GOOGLE_OAUTH2_CLIENT_ID=144742361946-79uh0mjrfnsr8tdbmk8t8mof6b7ih38a.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=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
```

⚠️ **Important**: Update your Google OAuth2 settings in Google Cloud Console:
- Add `https://your-backend.onrender.com` to Authorized JavaScript origins
- Add `https://your-backend.onrender.com/api/auth/google/callback/` to Authorized redirect URIs

### 3.6 SMTP Settings (Hostinger Email)
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=info@easylearnova.com
SMTP_PASSWORD=EasyLearnova@pranay.23
SMTP_USE_SSL=true
SMTP_USE_TLS=false
```

### 3.7 JWT Settings
```bash
JWT_ACCESS_MINUTES=60
JWT_REFRESH_DAYS=7
```

### 3.8 Rate Limiting
```bash
MAX_TOPICS_PER_MONTH=15
MAX_TOPICS_PER_REQUEST=4
ENFORCE_DAILY_LIMIT=false
```

### 3.9 Cookie & Security Settings
```bash
SESSION_COOKIE_SAMESITE=None
CSRF_COOKIE_SAMESITE=None
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
SECURE_SSL_REDIRECT=true
SECURE_CROSS_ORIGIN_OPENER_POLICY=same-origin-allow-popups
```

### 3.10 Logging
```bash
DJANGO_LOG_LEVEL=INFO
```

## 🚀 Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Run `build.sh` (install dependencies, collect static files, run migrations)
   - Start gunicorn server
3. Wait 3-5 minutes for initial deployment
4. Check the **"Logs"** tab for any errors

## 🧪 Step 5: Test Your Backend

### 5.1 Check Health Endpoint
Visit: `https://your-backend.onrender.com/api/`

You should see a JSON response or Django REST framework page.

### 5.2 Test Database Connection
Visit: `https://your-backend.onrender.com/api/courses/school/`

Should return list of school courses from your Hostinger MySQL database.

### 5.3 Test Google OAuth
Try logging in with Google on your frontend. Check Render logs if issues occur.

## 🔧 Step 6: Update Frontend to Use Render Backend

Update your frontend environment variables (Hostinger hosting panel):

```bash
# In your frontend .env or Hostinger environment
VITE_API_BASE_URL=https://easylearnova-backend.onrender.com/api
```

Then rebuild and redeploy your frontend.

## 📊 Step 7: Monitor Your Deployment

### Render Dashboard
- **Logs**: Real-time logs from your Django app
- **Metrics**: CPU, memory, bandwidth usage
- **Events**: Deployment history

### Common Issues & Solutions

#### ❌ Build Fails
- Check `build.sh` has correct commands
- Ensure `requirements.txt` has all dependencies
- Check Render logs for specific error

#### ❌ Database Connection Error
- Verify Hostinger MySQL allows external connections
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct
- Ensure Hostinger firewall isn't blocking Render IPs

#### ❌ CORS Errors
- Add your Render backend URL to `CORS_ALLOWED_ORIGINS`
- Add both frontend and backend URLs to `CSRF_TRUSTED_ORIGINS`

#### ❌ Static Files Not Loading
- Ensure `whitenoise` is in `requirements.txt`
- Check `build.sh` runs `collectstatic`
- Verify `STATIC_ROOT` is set in `settings.py`

#### ⚠️ Free Tier Sleeps After 15 Minutes
- Free tier services sleep after inactivity
- First request after sleep takes 30-50 seconds
- Upgrade to Starter ($7/month) for always-on service

## 🎉 Success Checklist

- ✅ Backend deployed to Render
- ✅ Connected to Hostinger MySQL
- ✅ Frontend communicates with backend
- ✅ Google OAuth works
- ✅ Static files served correctly
- ✅ CORS/CSRF configured properly

## 📚 Additional Resources

- [Render Django Docs](https://render.com/docs/deploy-django)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Render Environment Variables](https://render.com/docs/environment-variables)

## 🆘 Need Help?

1. Check Render logs: Dashboard → Logs tab
2. Check Django logs: Look for ERROR or WARNING messages
3. Test database connection: `python manage.py dbshell` in Render shell
4. Verify environment variables are set correctly

## 🔄 Continuous Deployment

Render automatically redeploys when you push to your branch:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin dep-backend
# Render automatically rebuilds and deploys!
```

---

**Your backend is now live on Render! 🎊**

Backend URL: `https://easylearnova-backend.onrender.com`
Frontend URL: `https://easylearnova.com`
Database: Hostinger MySQL
