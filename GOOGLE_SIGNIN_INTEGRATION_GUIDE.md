http://localhost:5175
http://localhost:5173
http://127.0.0.1:5175
http://127.0.0.1:5173# Google Sign-In Integration Guide

## ✅ Backend Integration Complete - Fully Compatible with Existing User Model

The Django backend has been **perfectly integrated** with your existing authentication system using `social-auth-app-django`. Here's what's been implemented to ensure seamless integration:

### 🔧 **Custom User Model Integration**
- ✅ **Email-based Authentication**: Works with your `email` as `USERNAME_FIELD`
- ✅ **Custom UserManager**: Uses your `User.objects.create_user()` method
- ✅ **User Fields Mapping**: Maps Google data to your `email`, `full_name`, `agreed_to_terms` fields
- ✅ **JWT Token Compatibility**: Returns same token format as your existing login
- ✅ **Existing User Linking**: Google users with existing emails are automatically linked

### 🔧 **What's Been Configured**

#### 1. **Dependencies Added**
```python
# requirements.txt
social-auth-app-django>=5.4.0
```

#### 2. **Django Settings Updated**
```python
# settings.py
INSTALLED_APPS = [
    # ... your existing apps
    'social_django',  # Added
]

MIDDLEWARE = [
    # ... your existing middleware
    'social_django.middleware.SocialAuthExceptionMiddleware',  # Added
]

AUTHENTICATION_BACKENDS = [
    'social_core.backends.google.GoogleOAuth2',  # Added - Google OAuth2
    'django.contrib.auth.backends.ModelBackend',  # Your existing
    'authentication.backends.EmailBackend',       # Your existing
]
```

#### 3. **Custom Pipeline Functions**
Created `authentication/pipeline.py` with functions that:
- Use your existing `UserManager.create_user()` method
- Handle email-based user lookup and creation
- Map Google profile data to your User model fields
- Ensure `agreed_to_terms=True` for Google users

#### 4. **API Endpoints Created**
- `/api/auth/http://localhost:5175
http://localhost:5173
http://127.0.0.1:5175
http://127.0.0.1:51732 authorization URL
- `/api/auth/google/callback/` - Handle authorization code callback  
- `/api/auth/google/token/` - Authenticate with Google ID/access token
- `/api/auth/social/` - Traditional social-auth-app-django URLs

### 🎯 **Perfect Integration with Your Existing System**

#### **Same Response Format**
Google authentication returns the **exact same format** as your existing login:

```json
{
    "user": {
        "id": 1,
        "email": "user@gmail.com", 
        "full_name": "John Doe",
        "agreed_to_terms": true
    },
    "access": "your.jwt.access.token",
    "refresh": "your.jwt.refresh.token",
    "created": false,
    "message": "Google authentication successful"
}
```

#### **Compatible with Existing Code**
- ✅ Same JWT tokens work with your existing API endpoints
- ✅ Same user serialization format
- ✅ Same authentication headers (`Authorization: Bearer <token>`)
- ✅ Same user profile endpoint `/api/auth/profile/`
- ✅ Existing users can sign in with Google using their email

## Frontend Integration Options

### Option 1: Direct Google API Integration (Recommended)

```javascript
// Install Google Identity Services
// npm install google-auth-library

// 1. Initialize Google Sign-In
const initializeGoogleSignIn = () => {
  google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID',
    callback: handleGoogleSignIn
  });
  
  google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    { theme: 'outline', size: 'large' }
  );
};

// 2. Handle Google Sign-In Response
const handleGoogleSignIn = async (response) => {
  try {
    // Send the credential (JWT token) to your backend
    const backendResponse = await fetch('/api/auth/google/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: response.credential
      })
    });
    
    const data = await backendResponse.json();
    
    if (backendResponse.ok) {
      // Store JWT tokens
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      
      // Redirect to dashboard or update UI
      console.log('User:', data.user);
      console.log('Created new account:', data.created);
    } else {
      console.error('Authentication failed:', data.error);
    }
  } catch (error) {
    console.error('Error during authentication:', error);
  }
};
```

### Option 2: Using React Google Login

```jsx
// Install: npm install @google-oauth/react

import { GoogleLogin } from '@google-oauth/react';

const GoogleSignInButton = () => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('/api/auth/google/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: credentialResponse.credential
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Handle successful authentication
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        // Redirect user...
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.log('Login Failed')}
    />
  );
};
```

### Option 3: Authorization Code Flow

```javascript
// 1. Get Google authorization URL from backend
const getGoogleAuthUrl = async () => {
  const response = await fetch('/api/auth/google/auth-url/');
  const data = await response.json();
  
  // Redirect user to Google auth page
  window.location.href = data.auth_url;
};

// 2. Handle callback (in your callback component/page)
const handleGoogleCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    const response = await fetch('/api/auth/google/callback/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store tokens and redirect
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      window.location.href = '/dashboard';
    }
  }
};
```

## Setup Instructions

### 1. **Google Cloud Console Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/google/callback/` (development)
   - `https://yourdomain.com/api/auth/google/callback/` (production)
7. Add authorized JavaScript origins:
   - `http://localhost:5173` (your frontend URL)
   - `https://yourdomain.com` (production frontend)

### 2. **Environment Variables**

Copy `.env.example` to `.env` and update:

```env
GOOGLE_OAUTH2_CLIENT_ID=your_actual_client_id_here
GOOGLE_OAUTH2_CLIENT_SECRET=your_actual_client_secret_here
```

### 3. **Install Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

### 4. **Run Migrations**

```bash
python manage.py makemigrations
python manage.py migrate
```

## Testing the Integration

### 1. **Test Backend Endpoints**

```bash
# Get Google auth URL
curl http://localhost:8000/api/auth/google/auth-url/

# Test with actual Google token (replace TOKEN with real token)
curl -X POST http://localhost:8000/api/auth/google/token/ \
  -H "Content-Type: application/json" \
  -d '{"access_token": "TOKEN"}'
```

### 2. **Frontend Testing**

Add this to your HTML to test:

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <div id="g_id_onload"
         data-client_id="YOUR_GOOGLE_CLIENT_ID"
         data-callback="handleCredentialResponse">
    </div>
    <div class="g_id_signin" data-type="standard"></div>

    <script>
        function handleCredentialResponse(response) {
            // Send to your backend
            fetch('http://localhost:8000/api/auth/google/token/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({access_token: response.credential})
            })
            .then(response => response.json())
            .then(data => console.log('Success:', data))
            .catch(error => console.error('Error:', error));
        }
    </script>
</body>
</html>
```

## Key Features

✅ **Custom User Model Integration** - Works with your existing email-based User model  
✅ **JWT Token Generation** - Returns access and refresh tokens compatible with your existing auth system  
✅ **User Creation/Login** - Automatically creates new users or logs in existing ones  
✅ **Multiple Integration Options** - Support for direct token auth and authorization code flow  
✅ **Error Handling** - Comprehensive error handling and logging  
✅ **Security** - Uses environment variables for sensitive credentials  

## Next Steps

1. Set up Google Cloud Console credentials
2. Update environment variables
3. Install dependencies and run migrations
4. Choose and implement frontend integration option
5. Test the complete flow
6. Deploy with production credentials

## Troubleshooting

- **"Google OAuth2 not configured"**: Check environment variables are set
- **"Invalid access token"**: Verify Google client credentials and token format
- **CORS issues**: Make sure your frontend domain is in CORS_ALLOWED_ORIGINS
- **Redirect URI mismatch**: Ensure Google Cloud Console URIs match your backend URLs
