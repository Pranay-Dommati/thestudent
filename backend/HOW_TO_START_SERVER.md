# 🚨 CRITICAL: Django Server Must Be Running!

## The Problem

You're getting **404 errors** because the **Django server is NOT running**.

```
POST http://127.0.0.1:8000/api/courses/enroll/ 404 (Not Found)
GET http://127.0.0.1:8000/api/courses/enrollment-status/... 404 (Not Found)
```

This means your browser **cannot connect** to the backend server.

---

## ✅ SOLUTION: Start the Django Server MANUALLY

### Option 1: Use the Batch File (Windows)

**Double-click this file:**
```
backend/START_SERVER.bat
```

This will:
1. Open a new command prompt
2. Start the Django server
3. Show server logs

**Keep this window OPEN!**

---

### Option 2: Manual Command (In New Terminal)

1. **Open a NEW terminal** (Git Bash, PowerShell, or CMD)

2. **Run these commands:**
```bash
cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend
python manage.py runserver 0.0.0.0:8000
```

3. **Wait for this message:**
```
Starting development server at http://0.0.0.0:8000/
```

4. **Keep this terminal OPEN!** Don't close it or run other commands in it.

---

## ✅ How to Know Server is Running

### In the server terminal, you should see:
```
INFO Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
October 11, 2025 - 16:XX:XX
Django version 5.2.2, using settings 'backend.settings'
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

### When you use your frontend, you'll see logs like:
```
INFO "GET /api/courses/enrollment-status/... HTTP/1.1" 200 50
INFO "POST /api/courses/enroll/ HTTP/1.1" 201 150
```

---

## 🔍 Verify Server is Running

### Test 1: Check if port 8000 is listening

In a NEW terminal:
```bash
netstat -ano | findstr ":8000" | findstr "LISTENING"
```

Should show something like:
```
TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING       12345
```

### Test 2: Test API endpoint

In a NEW terminal:
```bash
curl http://127.0.0.1:8000/api/courses/engineering/?category=all
```

Should return JSON data (not 404).

---

## ⚠️ Common Mistakes

### ❌ DON'T DO THIS:
- Don't run the server and then run other commands in the same terminal
- Don't clear the terminal where server is running
- Don't close the server terminal

### ✅ DO THIS:
- Run server in its OWN dedicated terminal
- Keep that terminal open
- Use OTHER terminals for testing commands
- Watch the server logs for errors

---

## 📋 Summary

**Current Status:**
- ❌ Server is NOT running
- ❌ Frontend cannot connect to backend
- ❌ All API requests return 404

**What You Need to Do:**
1. ✅ Open a NEW terminal (or double-click START_SERVER.bat)
2. ✅ Run: `python manage.py runserver 0.0.0.0:8000`
3. ✅ Wait for "Starting development server" message
4. ✅ Keep that terminal open
5. ✅ Test your frontend again

---

## 🎯 After Starting Server

Once the server is running:
1. Refresh your browser (Ctrl+F5)
2. Try the enrollment action again
3. Watch the server terminal for logs
4. The 404 errors should be GONE

---

## 🆘 If Server Won't Start

If you see errors when starting the server, share:
1. The complete error message
2. The full server startup log
3. Any Python stack traces

Common issues:
- Port 8000 already in use: `netstat -ano | findstr ":8000"` to find and kill process
- Python not found: Make sure Python is installed and in PATH
- Database connection error: Check .env file has correct credentials

---

## ✅ Files Ready for You

1. **START_SERVER.bat** - Double-click to start server
2. **DATABASE_FIXED_SUMMARY.md** - Database configuration details
3. **SERVER_RUNNING.md** - What to expect when server runs
4. **.env** - Updated with Hostinger MySQL credentials

---

# 🚀 START THE SERVER NOW!

**Double-click:** `backend/START_SERVER.bat`

OR

**Run in terminal:**
```bash
cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend
python manage.py runserver 0.0.0.0:8000
```

**Then test your application!** 🎉
