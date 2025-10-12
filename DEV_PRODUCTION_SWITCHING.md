# 🔄 Seamless Dev/Production Mode Switching Guide

## ✅ Configuration Complete!

Your Django backend now **automatically** configures itself based on `DEBUG` setting:

---

## 🎯 How It Works

### When `DEBUG=True` (Local Development):
```properties
✅ CORS_ALLOW_ALL_ORIGINS = True
✅ Allows http://localhost:5173 (and other localhost ports)
✅ CORS_ALLOW_CREDENTIALS = True
✅ All CORS headers allowed
✅ CSRF trusted origins include localhost
✅ Frontend: http://localhost:5173
```

### When `DEBUG=False` (Production/Render):
```properties
✅ CORS restricted to production domains only
✅ CORS_ALLOWED_ORIGINS from environment variable
✅ Only allows https://easylearnova.com, https://www.easylearnova.com
✅ Strict security headers
✅ Frontend: https://www.easylearnova.com
```

---

## 🚀 How to Switch Modes

### Switch to Local Development Mode

**Edit**: Root `.env` file
```properties
DEBUG=True
FRONTEND_DOMAIN=http://localhost:5173
```

**Restart server**:
```bash
# Stop server (Ctrl+C)
cd backend
python manage.py runserver
```

**Expected**:
- ✅ Backend: http://127.0.0.1:8000
- ✅ CORS allows http://localhost:5173
- ✅ Google OAuth works with localhost
- ✅ Remote MySQL connection

### Switch to Production Mode

**Edit**: Root `.env` file
```properties
DEBUG=False
FRONTEND_DOMAIN=https://www.easylearnova.com
```

**Or**: Just push to Render (environment variables override `.env`)

**Expected**:
- ✅ CORS restricted to easylearnova.com
- ✅ Production security settings
- ✅ Remote MySQL connection

---

## 🧪 Testing Local Development Setup

### Step 1: Start Backend
```bash
cd backend
python manage.py runserver
```

**Expected**:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 2: Start Frontend
```bash
# New terminal
cd frontend
npm run dev
```

**Expected**:
```
Local:   http://localhost:5173/
```

### Step 3: Test Google Login

1. Visit: http://localhost:5173/auth?mode=login
2. Click "Sign in with Google"
3. Complete Google authentication
4. **Should work!** ✅

**Check browser console**:
- ✅ No CORS errors
- ✅ API calls to http://127.0.0.1:8000/api/auth/google/token/
- ✅ Response: 200 OK with tokens

---

## 🔧 Troubleshooting

### Issue: CORS Error in Development

**Symptom**:
```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/api/...' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**Solution**:
1. **Check `.env`**: Make sure `DEBUG=True`
2. **Restart Django server**: Ctrl+C then `python manage.py runserver`
3. **Clear browser cache**: Ctrl+Shift+Del
4. **Hard refresh**: Ctrl+F5

### Issue: Frontend Can't Connect to Backend

**Check**:
```bash
# Terminal 1: Is backend running?
curl http://127.0.0.1:8000/api/chatbot/health/

# Expected: {"status":"healthy"} or similar
```

**Check frontend env**:
```bash
# frontend/.env.development (create if doesn't exist)
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_AI_BASE_URL=http://127.0.0.1:8000/ai
```

### Issue: Google OAuth Fails Locally

**Google Cloud Console Configuration**:

**Authorized JavaScript origins** (must include):
```
http://localhost:5173
http://127.0.0.1:5173
https://easylearnova.com
https://www.easylearnova.com
```

**Authorized redirect URIs** (leave empty or add):
```
http://localhost:5173
https://easylearnova.com
https://www.easylearnova.com
```

---

## 📋 Complete Local Development Checklist

- [ ] **Root `.env`**: `DEBUG=True`
- [ ] **Root `.env`**: `FRONTEND_DOMAIN=http://localhost:5173`
- [ ] **Backend running**: `cd backend && python manage.py runserver`
- [ ] **Frontend running**: `cd frontend && npm run dev`
- [ ] **Frontend `.env.development`** (if exists):
  ```
  VITE_API_BASE_URL=http://127.0.0.1:8000/api
  VITE_AI_BASE_URL=http://127.0.0.1:8000/ai
  ```
- [ ] **Google OAuth**: Added localhost to authorized origins
- [ ] **Test**: Visit http://localhost:5173
- [ ] **Test**: Google Sign-In works
- [ ] **Test**: No CORS errors in console

---

## 🎯 Before Deploying to Render

### Option 1: Revert `.env` Changes (Recommended)
```properties
# Root .env
DEBUG=False
FRONTEND_DOMAIN=https://www.easylearnova.com
```

### Option 2: Use Render Environment Variables (Better)
**Don't change `.env`!** Render environment variables override it:

**Render Dashboard → Environment**:
```
DEBUG=False
FRONTEND_DOMAIN=https://www.easylearnova.com
CORS_ALLOWED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com
```

This way you can keep `DEBUG=True` locally without affecting production!

---

## 🚀 Deployment Workflow

### Local Development:
```bash
# 1. Work locally with DEBUG=True
DEBUG=True (in .env)

# 2. Test everything
python manage.py runserver
npm run dev

# 3. Push to GitHub
git add .
git commit -m "Your changes"
git push origin dep-backend
```

### Production Deployment:
```bash
# Render automatically:
# - Reads environment variables (DEBUG=False)
# - Overrides .env file
# - Uses production CORS settings
# - Connects to same MySQL database
```

**You never need to change `.env` for production!** ✅

---

## 📊 Configuration Summary

| Setting | Local (DEBUG=True) | Production (DEBUG=False) |
|---------|-------------------|--------------------------|
| **Backend URL** | http://127.0.0.1:8000 | https://easylearnova-backend.onrender.com |
| **Frontend URL** | http://localhost:5173 | https://easylearnova.com |
| **CORS** | Allow all origins | Restrict to easylearnova.com |
| **Database** | Remote MySQL (same) | Remote MySQL (same) |
| **Google OAuth** | Works with localhost | Works with easylearnova.com |
| **Credentials** | Allow from localhost | Allow from easylearnova.com only |

---

## ✅ Current Status

**Your setup is now configured for seamless switching!**

**Just change**:
```properties
DEBUG=True   # Local development
DEBUG=False  # Production
```

**Everything else adjusts automatically!** 🎉

---

## 🎯 Next Steps

1. **Restart your Django server** (Ctrl+C then restart)
2. **Refresh frontend** (Ctrl+F5)
3. **Try Google Sign-In** on http://localhost:5173
4. **Should work without CORS errors!** ✅

---

## 📞 Quick Commands

```bash
# Local development
cd backend && python manage.py runserver  # Terminal 1
cd frontend && npm run dev                # Terminal 2

# Test Google OAuth locally
# Visit: http://localhost:5173/auth?mode=login

# Deploy to production
git push origin dep-backend
# Render auto-deploys with DEBUG=False from env vars
```

**Your backend now seamlessly switches between dev and production!** 🚀
