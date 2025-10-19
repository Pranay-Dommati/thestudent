# Inactive User Google OAuth Authentication Fix

## Problem Summary

### The Issue
When users attempt to sign up via email/OTP but fail or abandon the process, an **inactive** user record is created in the database. Later, when these same users try to authenticate via Google OAuth, the system would:

1. Find the existing inactive user
2. Return a **401 Unauthorized** error: `"User account is disabled"`
3. Prevent them from logging in via Google

### Error Example
```javascript
POST http://127.0.0.1:8000/api/auth/google/token/ 401 (Unauthorized)
{status: 401, detail: "User account is disabled"}
```

### Root Cause Analysis

#### Scenario 1: Email/OTP Signup Flow
```python
# In otp_signup view (line ~178)
user, created = User.objects.get_or_create(
    email=email,
    defaults={
        'full_name': full_name,
        'is_active': False,  # ❌ User created as INACTIVE
        'agreed_to_terms': serializer.validated_data.get('agreed_to_terms', False),
        'auth_method': 'email',
    }
)
```

**Issue**: User is created immediately as `is_active=False` and only activated after OTP verification.

#### Scenario 2: Google OAuth Login Attempt
```python
# In google_auth_token view (line ~993)
user = User.objects.get(email=email)  # Finds inactive user

# Old problematic code:
if not user.is_active:
    return Response(
        {"error": "User account is disabled"},  # ❌ Rejects inactive users
        status=status.HTTP_401_UNAUTHORIZED
    )
```

**Issue**: System rejected inactive users instead of activating them when authenticated via Google.

---

## The Solution

### Two-Part Fix

#### Part 1: Activate Inactive Users on Google Auth ✅

When a user successfully authenticates via Google OAuth, if they have an existing inactive account (from abandoned email signup), **activate it automatically** since Google has verified their email.

**Modified Files**: 
- `backend/authentication/views.py` (2 locations)
  - `google_auth_token` function (line ~993)
  - `google_auth_callback` function (line ~847)

#### Implementation

```python
# Check if user exists, create if not using your UserManager
try:
    user = User.objects.get(email=email)
    created = False
    logger.info(f"Google auth: Existing user found - {email}")
    
    # ✅ CRITICAL FIX: If user exists but is inactive (e.g., from abandoned email signup),
    # activate them now since Google has verified their email
    if not user.is_active:
        user.is_active = True
        user.auth_method = 'google'  # Update to Google auth
        user.full_name = full_name  # Update name from Google
        user.agreed_to_terms = True  # Google users implicitly agree
        user.save(update_fields=['is_active', 'auth_method', 'full_name', 'agreed_to_terms'])
        logger.info(f"Google auth: Activated previously inactive user - {email}")
        
except User.DoesNotExist:
    # Create new user if they don't exist
    user = User.objects.create_user(
        email=email,
        full_name=full_name,
        auth_method='google',
        agreed_to_terms=True
    )
    created = True
```

### Key Changes

1. **Removed the rejection**: Deleted the check that returned 401 for inactive users
2. **Added activation logic**: If user is inactive, activate them and update their auth method
3. **Updated user data**: Sync full name and terms agreement from Google
4. **Logged the action**: Added clear logging for debugging

---

## Why This Solution Works

### 1. **Email Verification is Already Done**
When a user authenticates via Google OAuth, Google has already verified their email address. There's no security risk in activating an inactive user.

### 2. **User Intent is Clear**
If a user tries to login via Google, they clearly want to use the platform. Their previous abandoned email signup shouldn't block them.

### 3. **Seamless User Experience**
Users can switch authentication methods without getting locked out or needing admin intervention.

### 4. **Data Consistency**
The fix updates the user's:
- `is_active`: Set to `True`
- `auth_method`: Updated to `'google'`
- `full_name`: Updated from Google profile
- `agreed_to_terms`: Set to `True`

---

## Testing the Fix

### Test Scenario 1: Abandoned Email Signup → Google Login

```bash
# Step 1: Create inactive user via email signup (don't verify OTP)
curl -X POST http://127.0.0.1:8000/api/auth/otp/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "SecurePass123!",
    "agreed_to_terms": true
  }'

# Step 2: Check user is inactive in database
python manage.py shell
>>> from authentication.models import User
>>> user = User.objects.get(email='test@example.com')
>>> print(f"Active: {user.is_active}")  # Should print: Active: False

# Step 3: Login via Google OAuth (should now succeed)
# Use Google Sign-In button in frontend
# Result: User should be activated and logged in successfully
```

### Test Scenario 2: Check Database After Fix

```python
# After successful Google login
>>> user = User.objects.get(email='test@example.com')
>>> print(f"Active: {user.is_active}")  # Should print: Active: True
>>> print(f"Auth method: {user.auth_method}")  # Should print: Auth method: google
>>> print(f"Full name: {user.full_name}")  # Should print: Full name: Test User
```

### Expected Results

✅ **Before**: 401 Unauthorized error  
✅ **After**: Successful login with activated account

---

## Future Considerations

### Option: Clean Up Abandoned Inactive Users

You may want to periodically clean up inactive users who were created but never verified:

```python
# Create a management command to clean up old inactive users
# backend/authentication/management/commands/cleanup_inactive_users.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from authentication.models import User

class Command(BaseCommand):
    help = 'Clean up inactive users older than 30 days'

    def handle(self, *args, **options):
        cutoff_date = timezone.now() - timedelta(days=30)
        old_inactive = User.objects.filter(
            is_active=False,
            date_joined__lt=cutoff_date,
            auth_method='email'  # Only clean up email signups
        )
        count = old_inactive.count()
        old_inactive.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {count} inactive users older than 30 days'
            )
        )
```

Run it periodically:
```bash
python manage.py cleanup_inactive_users
```

### Option: Prevent Inactive User Creation (Alternative Approach)

Instead of creating inactive users during OTP signup, you could:

1. Store signup attempts in a separate temporary table
2. Only create the user after OTP verification succeeds
3. Requires more significant refactoring

**Current fix is simpler and more user-friendly.**

---

## Impact Assessment

### ✅ Benefits
1. **Fixes critical login issue**: Users can now login via Google even if they have abandoned email signups
2. **Better user experience**: No more confusing "account disabled" errors
3. **Flexible auth methods**: Users can switch from email to Google auth seamlessly
4. **Security maintained**: Google's email verification is trusted
5. **Minimal code changes**: Only 2 functions modified

### ⚠️ Considerations
1. **Password from email signup is kept**: If user set a password during email signup, it's still in the database (but won't be used if they continue with Google)
2. **Auth method changes**: User's `auth_method` field switches from `'email'` to `'google'`

---

## Deployment Checklist

- [x] Modified `google_auth_token` function
- [x] Modified `google_auth_callback` function
- [x] Added proper logging
- [x] Tested locally
- [ ] Deploy to production
- [ ] Monitor logs for activation events
- [ ] Test with real Google OAuth flow
- [ ] Verify no 401 errors for inactive users

---

## Summary

This fix resolves the critical issue where users with abandoned email signups couldn't login via Google OAuth. The solution activates inactive users automatically when they successfully authenticate via Google, providing a seamless user experience while maintaining security.

**Key Principle**: If Google has verified their email, we trust that verification and activate the user.
