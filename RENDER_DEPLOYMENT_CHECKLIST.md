# ✅ Render Deployment Final Checklist

## 📁 File Structure Verification

```
thestudent/ (repository root)
├── ✅ render.yaml              (Render configuration)
├── ✅ requirements.txt         (Python dependencies with gunicorn)
├── ✅ build.sh                 (Build script - executable)
├── ✅ .env                     (Local env - NOT committed to git)
├── ✅ .gitignore               (Should exclude .env)
└── backend/                   (Django project)
    ├── ✅ manage.py
    ├── ✅ backend/
    │   ├── ✅ settings.py
    │   ├── ✅ wsgi.py
    │   └── ✅ urls.py
    ├── authentication/
    ├── courses/
    └── ...
```

## ✅ Configuration Files Review

### 1. `render.yaml` ✅
```yaml
✅ buildCommand: ./build.sh
✅ startCommand: cd backend && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
✅ healthCheckPath: /api/
✅ No rootDir specified (uses repository root)
✅ All environment variables defined
```

### 2. `build.sh` ✅
```bash
✅ Installs from requirements.txt (in same directory)
✅ Changes to backend/ directory
✅ Runs collectstatic from backend/
✅ Runs migrate from backend/
✅ Installs gunicorn
```

### 3. `requirements.txt` ✅
```
✅ Django>=4.2.0
✅ djangorestframework>=3.14.0
✅ mysqlclient>=2.2.0
✅ gunicorn>=21.2.0
✅ whitenoise>=6.7.0
✅ All dependencies listed
```

### 4. `backend/backend/settings.py` ✅
```python
✅ ALLOWED_HOSTS reads from environment
✅ DEBUG reads from environment (set to False in production)
✅ CORS_ALLOWED_ORIGINS configured
✅ CSRF_TRUSTED_ORIGINS configured
✅ Database configured for MySQL
✅ Static files configured with WhiteNoise
✅ Google OAuth settings present
```

## 🔐 Environment Variables to Set in Render

### Critical (Must Set):
- ✅ `DEBUG=False`
- ✅ `SECRET_KEY` (generate new)
- ✅ `ALLOWED_HOSTS=.onrender.com,easylearnova.com,www.easylearnova.com`
- ✅ `DB_HOST=srv1990.hstgr.io`
- ✅ `DB_NAME=u787111463_easylearnovadb`
- ✅ `DB_USER=u787111463_teamlearnova`
- ✅ `DB_PASSWORD=EasyLearnova@pranay.23`

### CORS/CSRF:
- ✅ `CORS_ALLOWED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com`
- ✅ `CSRF_TRUSTED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com,https://easylearnova-backend.onrender.com`

### APIs:
- ✅ `YOUTUBE_API_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `GOOGLE_SEARCH_API_KEY`
- ✅ `GOOGLE_OAUTH2_CLIENT_ID`
- ✅ `GOOGLE_OAUTH2_CLIENT_SECRET`

### SMTP:
- ✅ `SMTP_HOST=smtp.hostinger.com`
- ✅ `SMTP_USERNAME=info@easylearnova.com`
- ✅ `SMTP_PASSWORD`

## 🚀 Deployment Steps

### Step 1: Commit & Push ✅
```bash
git add render.yaml build.sh requirements.txt RENDER_DEPLOYMENT_GUIDE.md
git commit -m "Add Render deployment configuration"
git push origin dep-backend
```

### Step 2: Render Setup
1. ✅ Go to https://render.com
2. ✅ New Web Service
3. ✅ Connect GitHub repo
4. ✅ Select `dep-backend` branch
5. ✅ Configure settings:
   - Name: `easylearnova-backend`
   - Root Directory: **Leave empty**
   - Build Command: `./build.sh`
   - Start Command: `cd backend && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### Step 3: Environment Variables
- ✅ Set all variables listed above in Render dashboard

### Step 4: Deploy
- ✅ Click "Create Web Service"
- ✅ Wait for build (3-5 minutes)
- ✅ Check logs for errors

### Step 5: Test
- ✅ Visit `https://your-backend.onrender.com/api/`
- ✅ Test `/api/courses/school/`
- ✅ Test Google OAuth login

### Step 6: Update Frontend
- ✅ Set `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
- ✅ Redeploy frontend on Hostinger

### Step 7: Update Google OAuth
- ✅ Add Render URL to Google Cloud Console:
  - Authorized JavaScript origins: `https://your-backend.onrender.com`
  - Authorized redirect URIs: `https://your-backend.onrender.com/api/auth/google/callback/`

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Backend is accessible: `https://your-backend.onrender.com/api/`
- [ ] Database connection works: Check `/api/courses/school/`
- [ ] Static files load correctly
- [ ] Admin panel accessible: `/admin/`
- [ ] CORS works: Frontend can call backend
- [ ] Google OAuth works: Can sign in with Google
- [ ] SMTP works: Test password reset email
- [ ] Logs show no errors

## 📊 Render Free Tier Notes

⚠️ **Important Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-50 seconds to wake up
- 750 hours/month free (enough for 1 service running 24/7)

💡 **Upgrade to Starter ($7/month) for:**
- No sleep (always-on)
- Better performance
- More resources

## 🔧 Common Issues & Solutions

### Build Fails
- Check `build.sh` is executable: `chmod +x build.sh`
- Verify `requirements.txt` has all dependencies
- Check Render logs for specific error

### Database Connection Error
- Verify Hostinger MySQL allows external connections
- Double-check credentials in Render environment variables
- Check if Hostinger firewall blocks Render IPs

### Static Files 404
- Ensure WhiteNoise is in `MIDDLEWARE` in settings.py
- Verify `collectstatic` ran successfully in build logs
- Check `STATIC_ROOT` and `STATIC_URL` in settings.py

### CORS Errors
- Add Render backend URL to `CORS_ALLOWED_ORIGINS`
- Add both frontend and backend to `CSRF_TRUSTED_ORIGINS`
- Ensure HTTPS in production URLs

### Service Sleeps (Free Tier)
- This is normal for free tier
- Consider upgrading to Starter plan ($7/month)
- Or use a cron job to ping your service every 14 minutes

## ✅ Final Verification

Everything is configured correctly if:
- [x] `render.yaml` is in repository root
- [x] `build.sh` is in repository root and executable
- [x] `requirements.txt` includes gunicorn and mysqlclient
- [x] No `rootDir` in render.yaml
- [x] Start command includes `cd backend &&`
- [x] Build script does `cd backend` before Django commands
- [x] All environment variables prepared
- [x] Google OAuth credentials ready
- [x] Hostinger MySQL credentials ready

## 🎉 You're Ready to Deploy!

Follow the **RENDER_DEPLOYMENT_GUIDE.md** for step-by-step instructions.

---

**Quick Deploy Command:**
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin dep-backend
```

Then go to Render and create your web service! 🚀
