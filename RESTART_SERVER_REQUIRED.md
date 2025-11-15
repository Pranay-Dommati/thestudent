# 🔄 Server Restart Required

## ⚠️ CORS Changes Made - Restart Needed

The CORS settings have been updated in `backend/backend/settings.py`, but the Django server needs to be restarted for changes to take effect.

---

## 🔧 How to Restart the Server

### Step 1: Stop the Current Server

In the terminal running `python manage.py runserver`:

**Press**: `Ctrl+C` (or `Ctrl+Break` on Windows)

**You should see**:
```
^CQuitting gracefully...
```

### Step 2: Restart the Server

```bash
python manage.py runserver
```

**Expected output**:
```
[DEBUG] ALLOWED_HOSTS env value: '...'
[DEBUG] Final ALLOWED_HOSTS: [...]
System check identified no issues (0 silenced).
October 12, 2025 - XX:XX:XX
Django version 5.2.7, using settings 'backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

---

## ✅ After Restart

### Test 1: Refresh Frontend

1. Go to frontend: http://localhost:5173
2. **Hard refresh**: `Ctrl+F5`
3. Open DevTools: `F12`
4. Try admin login or Google login

### Test 2: Check CORS

**Before restart** (current):
```
❌ Access to XMLHttpRequest blocked by CORS policy
❌ No 'Access-Control-Allow-Origin' header
```

**After restart** (expected):
```
✅ Request succeeds
✅ No CORS errors
✅ API calls work from localhost:5173
```

---

## 🎯 What Changed

**File**: `backend/backend/settings.py`

```python
if DEBUG:  # When DEBUG=True (local development)
    CORS_ALLOW_ALL_ORIGINS = True          # ← NEW: Allow all origins
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_HEADERS = ['*']             # ← NEW: Allow all headers
    CORS_ALLOW_METHODS = [...]             # ← NEW: All methods
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        ...
    ]
```

**This automatically allows**:
- ✅ Requests from `http://localhost:5173`
- ✅ All HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- ✅ Credentials (cookies, auth headers)
- ✅ All custom headers

---

## 🧪 Quick Test After Restart

```bash
# Test from terminal (should work after restart)
curl -X POST http://127.0.0.1:8000/api/auth/admin-login/ \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"test@test.com","password":"test"}'

# Expected: JSON response (not CORS error)
```

---

## 📋 Restart Checklist

- [ ] **Stop server**: Press `Ctrl+C` in terminal running Django
- [ ] **Restart server**: Run `python manage.py runserver`
- [ ] **See startup logs**: Confirm server starts successfully
- [ ] **Refresh frontend**: Hard refresh browser (`Ctrl+F5`)
- [ ] **Clear browser cache**: If needed
- [ ] **Test admin login**: Try logging in
- [ ] **Check console**: Should see no CORS errors ✅

---

## 🚨 If Still Getting CORS Errors After Restart

### 1. Verify DEBUG=True

Check root `.env` file:
```properties
DEBUG=True  # ← Must be True for local development
```

### 2. Check Django Logs

Look at the Django terminal output when request is made:
```
[12/Oct/2025 XX:XX:XX] "OPTIONS /api/auth/admin-login/ HTTP/1.1" 200 0
[12/Oct/2025 XX:XX:XX] "POST /api/auth/admin-login/ HTTP/1.1" 401 XX
```

**Good**: You see `OPTIONS` request first (CORS preflight) ✅
**Bad**: No `OPTIONS` request = CORS middleware not working ❌

### 3. Verify CORS Middleware Order

Should be in `backend/backend/settings.py`:
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ← MUST be first!
    'django.middleware.security.SecurityMiddleware',
    ...
]
```

### 4. Clear Browser Cache

Sometimes browser caches CORS errors:
- `Ctrl+Shift+Del` → Clear cache
- Or use **Incognito mode**

---

## 🎯 Summary

**Current issue**: CORS settings updated but server not restarted

**Solution**: 
1. ✅ Stop server (`Ctrl+C`)
2. ✅ Restart server (`python manage.py runserver`)
3. ✅ Refresh frontend (`Ctrl+F5`)
4. ✅ Test admin login

**After restart, all CORS errors should disappear!** 🚀

---

## 📞 Next Steps

1. **Restart Django server now**
2. **Refresh frontend**
3. **Try admin login or Google login**
4. **Should work perfectly!** ✅

**Press Ctrl+C in your Django terminal to stop the server, then restart it!** 🔄
