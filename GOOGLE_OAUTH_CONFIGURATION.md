# 🔐 Google OAuth Configuration Guide

## 📋 Current Setup Overview

Your backend has TWO different Google OAuth methods:

### Method 1: **Authorization Code Flow** (Traditional OAuth)
- **Flow**: Frontend → Backend → Google → Backend Callback → Frontend
- **Endpoints**: 
  - Start: `GET /api/auth/google/`
  - Callback: `POST /api/auth/google/callback/`
- **Status**: ⚠️ **Requires redirect URI configuration**

### Method 2: **Google Sign-In JavaScript (One-Tap)**
- **Flow**: Frontend → Google → Frontend gets ID token → Backend validates
- **Endpoint**: `POST /api/auth/google/token/`
- **Status**: ✅ **Already working** (this is what you're currently using)

---

## ✅ RECOMMENDED: Keep Using Method 2 (Current Setup)

**Your frontend already uses the Google Sign-In button with ID token validation**, which is:
- ✅ Simpler to configure
- ✅ Better UX (popup instead of redirects)
- ✅ Already working on your site

### Google Cloud Console Configuration (Current - Method 2)

```
Authorized JavaScript origins:
✅ https://easylearnova.com
✅ https://www.easylearnova.com

Authorized redirect URIs:
✅ Leave EMPTY or just add:
   https://easylearnova.com
   https://www.easylearnova.com
```

**Why no backend URLs?** Because Method 2 (Google Sign-In button) doesn't use redirect URIs - it returns the ID token directly to your JavaScript, which then sends it to your backend.

---

## 🔄 ALTERNATIVE: If You Want Method 1 (Authorization Code Flow)

If you prefer the traditional OAuth flow with redirects:

### Google Cloud Console Configuration (Method 1)

```
Authorized JavaScript origins:
✅ https://easylearnova.com
✅ https://www.easylearnova.com

Authorized redirect URIs:
✅ https://easylearnova-backend.onrender.com/api/auth/google/callback/
```

### How Method 1 Works

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Sign in with Google" on frontend                │
│    URL: https://www.easylearnova.com/auth?mode=login            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend redirects user to backend OAuth start endpoint      │
│    GET https://easylearnova-backend.onrender.com/api/auth/google/│
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend generates OAuth URL and redirects to Google          │
│    https://accounts.google.com/o/oauth2/auth?                   │
│    client_id=...&redirect_uri=...&scope=...                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. User authenticates with Google                               │
│    (Google's login page)                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Google redirects back to backend callback with auth code     │
│    POST https://easylearnova-backend.onrender.com/               │
│         api/auth/google/callback/?code=XXXXX                    │
│                                                                  │
│    ⚠️ THIS IS THE "AUTHORIZED REDIRECT URI" ⚠️                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Backend exchanges code for tokens, creates/logs in user      │
│    Returns JWT tokens to frontend                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Frontend stores tokens and redirects user to dashboard       │
│    URL: https://www.easylearnova.com/dashboard                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 What to Configure Right Now

Based on your build success, you're using **Method 2** (Google Sign-In button). Here's what to do:

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `144742361946-79uh0mjrfnsr8tdbmk8t8mof6b7ih38a`

### Step 2: Configure Authorized JavaScript Origins

```
✅ https://easylearnova.com
✅ https://www.easylearnova.com
```

**Remove or leave out**:
- ❌ `http://localhost` (only for development)
- ❌ Backend URLs (not needed for Method 2)

### Step 3: Configure Authorized Redirect URIs

For **Method 2** (current setup), you can either:

**Option A**: Leave empty (not needed for Google Sign-In button)

**Option B**: Add your frontend URLs (for future flexibility):
```
✅ https://easylearnova.com
✅ https://www.easylearnova.com
```

**Do NOT add**: `https://easylearnova-backend.onrender.com/api/auth/google/callback/` unless you switch to Method 1

### Step 4: Save and Wait

- Click **Save**
- Wait **5-10 minutes** for Google to propagate changes

### Step 5: Test

1. Visit: https://www.easylearnova.com/auth?mode=login
2. Click "Sign in with Google"
3. Complete authentication
4. Should work! ✅

---

## 🔍 How to Check Which Method You're Using

Check your frontend code:

### Method 2 (Google Sign-In Button) - Current Setup
```javascript
// frontend/src/components/Auth/GoogleSignIn.jsx or similar
google.accounts.id.initialize({
  client_id: 'YOUR_CLIENT_ID',
  callback: handleCredentialResponse
});

function handleCredentialResponse(response) {
  // Send ID token to backend
  fetch('/api/auth/google/token/', {
    method: 'POST',
    body: JSON.stringify({ credential: response.credential })
  });
}
```

### Method 1 (Authorization Code Flow)
```javascript
// frontend/src/components/Auth/GoogleSignIn.jsx or similar
const handleGoogleLogin = () => {
  // Redirect to backend OAuth start
  window.location.href = 'https://easylearnova-backend.onrender.com/api/auth/google/';
};
```

---

## 🚨 Troubleshooting

### Error: `redirect_uri_mismatch` or `origin_mismatch`

**Cause**: Google OAuth configuration doesn't match your actual URLs

**Solution**:

1. **Check what you have in Google Cloud Console**:
   - Authorized JavaScript origins: Should include `https://easylearnova.com` and `https://www.easylearnova.com`
   - Authorized redirect URIs: Depends on your method (see above)

2. **Check your frontend domain**:
   - Visit your site at `https://easylearnova.com` (not `https://www.easylearnova.com/auth?mode=login`)
   - Make sure the domain matches what's in Google console

3. **Check backend CORS**:
   ```bash
   # In root .env
   CORS_ALLOWED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com
   ```

4. **Wait 5-10 minutes** after saving changes in Google Cloud Console

### Error: `Invalid token` or `400 Bad Request`

**Cause**: Backend can't validate the Google ID token

**Solution**:

1. **Check backend environment variables** (Render dashboard):
   ```
   SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=144742361946-79uh0mjrfnsr8tdbmk8t8mof6b7ih38a.apps.googleusercontent.com
   SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=GOCSPX-...
   ```

2. **Check backend logs** in Render dashboard:
   ```bash
   # Look for errors like:
   "Failed to verify Google token"
   "Invalid JWT signature"
   ```

3. **Verify endpoint**:
   ```bash
   # Should return 400 (expected without token)
   curl -X POST https://easylearnova-backend.onrender.com/api/auth/google/token/
   ```

### Error: `User account is disabled` or `Email not provided`

**Cause**: Google account doesn't have email permission or user is inactive

**Solution**:

1. **Request email scope** in frontend:
   ```javascript
   google.accounts.id.initialize({
     client_id: 'YOUR_CLIENT_ID',
     scope: 'email profile'  // Add this
   });
   ```

2. **Check user in database**:
   ```bash
   # Connect to Hostinger MySQL
   mysql -h srv1990.hstgr.io -u u787111463_easylearnovadb -p
   
   # Check user
   SELECT email, full_name, is_active FROM authentication_user WHERE email='user@example.com';
   ```

---

## 📝 Quick Configuration Checklist

Before testing Google OAuth:

- [ ] **Google Cloud Console**:
  - [ ] Client ID: `144742361946-79uh0mjrfnsr8tdbmk8t8mof6b7ih38a`
  - [ ] Authorized JavaScript origins: `https://easylearnova.com`, `https://www.easylearnova.com`
  - [ ] Authorized redirect URIs: Add frontend URLs OR leave empty (Method 2)
  - [ ] Saved and waited 5-10 minutes

- [ ] **Frontend (dist/ uploaded to Hostinger)**:
  - [ ] `.env.production` has `VITE_API_BASE_URL=https://easylearnova-backend.onrender.com/api`
  - [ ] Built with `npm run build`
  - [ ] Uploaded to Hostinger `public_html/`

- [ ] **Backend (Render)**:
  - [ ] Environment variables set: `SOCIAL_AUTH_GOOGLE_OAUTH2_KEY`, `SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET`
  - [ ] `CORS_ALLOWED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com`
  - [ ] `ALLOWED_HOSTS` includes `easylearnova-backend.onrender.com`

- [ ] **Test**:
  - [ ] Visit `https://easylearnova.com` (or `www`)
  - [ ] Click "Sign in with Google"
  - [ ] Authenticate
  - [ ] Should redirect back and log in ✅

---

## 🎯 FINAL ANSWER

### For Your Current Setup (Method 2 - Google Sign-In Button):

**Google Cloud Console → Authorized redirect URIs**:

```
ADD THESE (or leave empty):
✅ https://easylearnova.com
✅ https://www.easylearnova.com

DO NOT ADD:
❌ https://easylearnova-backend.onrender.com/api/auth/google/callback/
   (Only needed for Method 1 - Authorization Code Flow)
```

**Google Cloud Console → Authorized JavaScript origins**:

```
✅ https://easylearnova.com
✅ https://www.easylearnova.com
```

---

**You're using Method 2**, so you DON'T need the backend callback URL in redirect URIs! 🎉

Test it now by visiting your site and clicking "Sign in with Google"!
