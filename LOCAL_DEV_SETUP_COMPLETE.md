# 🔧 Local Development Setup - Complete

## ✅ Configuration Complete!

Your local backend is now configured to connect to **remote Hostinger MySQL** with DEBUG mode enabled.

---

## 📋 Current Configuration

**File**: Root `.env`

```properties
DEBUG=True                                    # ✅ Local development mode
FRONTEND_DOMAIN=http://localhost:5173        # ✅ Local frontend
ALLOWED_HOSTS=...,localhost,127.0.0.1        # ✅ Includes localhost

# Database - Remote Hostinger MySQL
DB_ENGINE=mysql
DB_HOST=srv1990.hstgr.io                     # ✅ Remote server
DB_PORT=3306
DB_NAME=u787111463_easylearnovadb
DB_USER=u787111463_teamlearnova
DB_PASSWORD=EasyLearnova@pranay.23
```

---

## 🚀 Start Local Backend

```bash
cd backend
python manage.py runserver
```

**Expected Output**:
```
System check identified no issues (0 silenced).
October 12, 2025 - XX:XX:XX
Django version 5.2.7, using settings 'backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**Backend URL**: http://127.0.0.1:8000

---

## 🧪 Test Endpoints

### Test 1: Health Check
```bash
curl http://127.0.0.1:8000/api/chatbot/health/
```
**Expected**: `{"status":"healthy"}` or similar

### Test 2: Enroll Endpoint (should return 401, not 404)
```bash
curl -X POST http://127.0.0.1:8000/api/courses/enroll/
```
**Expected**: `{"detail":"Authentication credentials were not provided."}`

### Test 3: Engineering Courses
```bash
curl http://127.0.0.1:8000/api/courses/engineering/
```
**Expected**: JSON array of courses

---

## 🎯 Start Local Frontend

Open a **new terminal**:

```bash
cd frontend
npm run dev
```

**Frontend URL**: http://localhost:5173

---

## ✅ What's Configured

- ✅ **Backend**: Django on `http://127.0.0.1:8000`
- ✅ **Frontend**: Vite on `http://localhost:5173`
- ✅ **Database**: Remote Hostinger MySQL (`srv1990.hstgr.io`)
- ✅ **CORS**: Automatically allows `localhost` when `DEBUG=True`
- ✅ **Google OAuth**: Uses production credentials
- ✅ **AI APIs**: Gemini, YouTube Search configured

---

## 🔄 Switch Back to Production

When you want to deploy to Render again:

**Option 1: Manual** (Change in root `.env`)
```properties
DEBUG=False
FRONTEND_DOMAIN=https://www.easylearnova.com
```

**Option 2: Environment Variables** (Set in Render Dashboard)
- Render reads environment variables which override `.env`
- So your Render deployment will stay `DEBUG=False` even if local is `True`

---

## 📝 Quick Commands Reference

```bash
# Start backend (local dev → remote MySQL)
cd backend && python manage.py runserver

# Start frontend
cd frontend && npm run dev

# Test endpoint
curl http://127.0.0.1:8000/api/courses/enroll/

# Check database connection
curl http://127.0.0.1:8000/api/courses/engineering/

# Push to Render (when ready)
git add .
git commit -m "Your changes"
git push origin dep-backend
```

---

## 🎉 Ready!

Your local backend is now connected to remote Hostinger MySQL. You can:

1. ✅ Test all endpoints locally
2. ✅ Develop new features
3. ✅ Use the same database as production
4. ✅ Test Google OAuth locally
5. ✅ Run frontend locally pointing to local backend

**Start the server**: `cd backend && python manage.py runserver` 🚀
