# ✅ AWS SES Email Configuration - Complete Setup

## Summary

AWS SES (Simple Email Service) has been successfully configured for EasyLearnova to handle:
- ✅ **Password Reset Emails** (Forgot Password)
- ✅ **OTP Verification Emails** (New User Signup)
- ✅ **Admin Password Reset Emails**
- ✅ **Any other transactional emails**

---

## 🔑 AWS SES Credentials

### SMTP Configuration (ap-south-1 - Mumbai Region)

```
SMTP Host: email-smtp.ap-south-1.amazonaws.com
SMTP Port: 587
SMTP Username: AKIAWEBLRWIXBWW2J65X
SMTP Password: BAJqr+MIuFWHTTxocuq4DW9d3M8EeGqS+ftMwUNv52zV
Use TLS: true
Use SSL: false
Region: Asia Pacific (Mumbai)
```

### ✅ Connection Test Results

All tests passed successfully:
- ✅ DNS Resolution: Working
- ✅ Port Connectivity: Port 587 accessible
- ✅ SMTP Banner: Connection established
- ✅ STARTTLS: TLS encryption working
- ✅ Authentication: Credentials valid

---

## 📁 Files Updated

### 1. `.env.development` (Local Development)
```bash
# SMTP Settings - AWS SES (Mumbai Region)
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=AKIAWEBLRWIXBWW2J65X
SMTP_PASSWORD=BAJqr+MIuFWHTTxocuq4DW9d3M8EeGqS+ftMwUNv52zV
SMTP_USE_SSL=false
SMTP_USE_TLS=true
DEFAULT_FROM_EMAIL=info@easylearnova.com
```

### 2. `.env.production` (Production Deployment)
```bash
# Email Settings - AWS SES (Mumbai Region)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=AKIAWEBLRWIXBWW2J65X
EMAIL_HOST_PASSWORD=BAJqr+MIuFWHTTxocuq4DW9d3M8EeGqS+ftMwUNv52zV
DEFAULT_FROM_EMAIL=info@easylearnova.com
```

### 3. `backend/backend/settings.py`
Updated to support AWS SES defaults:
- Changed default port from 465 → 587
- Changed default SMTP_USE_SSL from true → false
- Changed default SMTP_USE_TLS from false → true
- Added DEFAULT_FROM_EMAIL setting

---

## 🔧 How It Works

### Existing Email Functions (Already Working)

The application already has the `send_email_via_smtp()` function in `backend/authentication/views.py` that handles all email sending. It automatically uses the SMTP settings from Django settings.

**No code changes needed** - The function already supports:
- SSL connections (port 465)
- TLS connections (port 587) ✅ AWS SES uses this
- Timeout handling (60 seconds)
- Error logging
- HTML email support

### Email Use Cases

#### 1. **User Signup (OTP Verification)**
File: `backend/authentication/views.py` → `signup_otp()`

When a new user signs up:
1. User enters email and password
2. System generates 6-digit OTP
3. **Email sent via AWS SES** with OTP code
4. User enters OTP to verify email
5. Account activated

#### 2. **Forgot Password (User)**
File: `backend/authentication/views.py` → `forgot_password()`

When user forgets password:
1. User enters email
2. System generates password reset token
3. **Email sent via AWS SES** with reset link
4. User clicks link to reset password
5. Password updated

#### 3. **Admin Forgot Password**
File: `backend/authentication/views.py` → `admin_forgot_password()`

Same as above but for admin users with superuser status.

---

## ⚠️ AWS SES Sandbox Mode Limitations

Your AWS SES account is currently in **Sandbox Mode**, which has these limitations:

### Restrictions:
- ✅ Can send TO: **Verified email addresses only**
- ✅ Can send FROM: **Verified email addresses only**
- ⚠️ Daily limit: **200 emails per day**
- ⚠️ Sending rate: **1 email per second**

### What This Means:
1. **For Development/Testing**: Works perfectly
2. **For Production**: You need to:
   - Verify `info@easylearnova.com` in AWS SES Console
   - OR verify the domain `easylearnova.com`
   - OR request Production Access (recommended)

---

## 🚀 Moving to Production Access

### Why You Need It:
- Send emails to **any email address** (not just verified ones)
- Increased limits: **50,000 emails per day** (initially)
- Higher sending rate: **14 emails per second**
- Essential for real user signups and password resets

### How to Request:

1. **Go to AWS SES Console**
   - Region: Asia Pacific (Mumbai) `ap-south-1`
   - Navigate to: Account dashboard → Production access

2. **Click "Request production access"**

3. **Fill out the form:**
   - **Use case**: Transactional emails (password resets, OTP verification)
   - **Website URL**: https://easylearnova.com
   - **Compliance**: Yes, users opted in (signup/account creation)
   - **Bounce handling**: We monitor bounce rates
   - **Complaint handling**: We have unsubscribe links (if applicable)

4. **Wait for Approval**
   - Usually 24-48 hours
   - Sometimes instant approval

### Alternative (For Immediate Testing):

**Verify Your Email Addresses:**
1. Go to AWS SES Console
2. Click "Verified identities"
3. Click "Create identity"
4. Select "Email address"
5. Enter: `info@easylearnova.com`
6. Check email and click verification link
7. Repeat for any test email addresses

---

## 🧪 Testing

### Test Script Locations:
- `backend/test_aws_ses_diagnostic.py` - Connection diagnostics
- `backend/test_ses_regions.py` - Region discovery
- `backend/test_django_email.py` - Django integration test

### Test Emails:

#### Simple Test (Command Line):
```bash
cd backend
python test_aws_ses_diagnostic.py
```

#### Django Integration Test:
```bash
cd backend
python test_django_email.py
```

### Test Signup OTP (Real Flow):
1. Start Django server: `python manage.py runserver`
2. Use frontend or API to create account
3. Check email for OTP code

### Test Password Reset:
1. Use "Forgot Password" feature
2. Check email for reset link
3. Click link to reset password

---

## 📊 Monitoring

### AWS SES Console
- **Sending statistics**: Track emails sent, bounces, complaints
- **Reputation dashboard**: Monitor sender reputation
- **Bounce notifications**: Set up SNS notifications for bounces

### Django Logs
Check `backend/django.log` for email sending events:
```
Email sent to user@example.com with subject 'Password Reset'
SMTP error sending email to user@example.com: ...
```

---

## 🔒 Security Best Practices

### ✅ Current Implementation:
1. ✅ Credentials stored in `.env` files (not hardcoded)
2. ✅ `.env` files in `.gitignore` (not committed)
3. ✅ TLS encryption enabled (port 587)
4. ✅ Timeout handling (prevents hangs)
5. ✅ Error logging (no sensitive data exposed)

### 🔐 Additional Recommendations:
1. **Rotate SMTP credentials** every 90 days
2. **Use AWS Secrets Manager** in production (optional)
3. **Set up bounce handling** via SNS
4. **Monitor sending reputation** weekly
5. **Enable DKIM** for better deliverability
6. **Set up SPF/DMARC** records for domain

---

## 🌐 Domain Verification (Optional but Recommended)

Instead of verifying individual email addresses, verify your entire domain:

### Benefits:
- Send from **any email address** @easylearnova.com
- Better sender reputation
- More professional
- Easier management

### Steps:
1. Go to AWS SES Console → Verified identities
2. Click "Create identity" → Select "Domain"
3. Enter: `easylearnova.com`
4. AWS will provide DNS records (TXT, CNAME, MX)
5. Add these records to your domain registrar
6. Wait for verification (few hours to 72 hours)

### Required DNS Records:
- **TXT Record** (Domain verification)
- **CNAME Records** (DKIM signing)
- **MX Record** (Optional - for receiving bounces)

---

## 🚨 Troubleshooting

### Issue: Emails not received

**Check:**
1. Is sender email verified in AWS SES?
2. Is recipient email verified (if in Sandbox mode)?
3. Check spam/junk folder
4. Check AWS SES sending statistics for bounces
5. Check Django logs for SMTP errors

### Issue: Authentication failed

**Solutions:**
1. Verify credentials are correct
2. Ensure you're using **SMTP credentials** (not IAM credentials)
3. Generate new SMTP credentials from AWS SES Console
4. Update `.env` files with new credentials

### Issue: Timeout errors

**Solutions:**
1. Check firewall/antivirus blocking port 587
2. Try port 465 with SSL instead of TLS
3. Check network connectivity
4. Increase timeout in `authentication/views.py`

### Issue: Rate limit exceeded

**Solutions:**
1. Request production access (increases limits)
2. Implement email queuing with Celery
3. Add retry logic with exponential backoff
4. Monitor sending rate in application

---

## 📝 Configuration Files Quick Reference

### Development (.env.development)
```bash
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=AKIAWEBLRWIXBWW2J65X
SMTP_PASSWORD=BAJqr+MIuFWHTTxocuq4DW9d3M8EeGqS+ftMwUNv52zV
SMTP_USE_SSL=false
SMTP_USE_TLS=true
DEFAULT_FROM_EMAIL=info@easylearnova.com
```

### Production (.env.production)
```bash
EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com
EMAIL_PORT=587
EMAIL_HOST_USER=AKIAWEBLRWIXBWW2J65X
EMAIL_HOST_PASSWORD=BAJqr+MIuFWHTTxocuq4DW9d3M8EeGqS+ftMwUNv52zV
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=info@easylearnova.com
```

### Render/Hostinger Deployment
Add these environment variables in your hosting platform:
```
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=AKIAWEBLRWIXBWW2J65X
SMTP_PASSWORD=BAJqr+MIuFWHTTxocuq4DW9d3M8EeGqS+ftMwUNv52zV
SMTP_USE_SSL=false
SMTP_USE_TLS=true
DEFAULT_FROM_EMAIL=info@easylearnova.com
```

---

## ✅ Final Checklist

Before going live:
- [x] AWS SES credentials configured
- [x] Connection test passed
- [ ] Email address verified in AWS SES
- [ ] Request production access submitted
- [ ] Test signup OTP email
- [ ] Test password reset email
- [ ] Update production .env on hosting platform
- [ ] Set up bounce handling (optional)
- [ ] Configure domain verification (optional)
- [ ] Monitor first 100 emails in AWS Console

---

## 📞 Support

### AWS SES Documentation:
- https://docs.aws.amazon.com/ses/

### Common Issues:
- **Sandbox limits**: Request production access
- **Verification**: Verify sender email/domain
- **Deliverability**: Set up DKIM, SPF, DMARC
- **Bounces**: Configure SNS notifications

### Contact:
- AWS Support: Through AWS Console
- EasyLearnova Team: Check internal docs

---

**Status**: ✅ **READY FOR TESTING**

All configurations are in place. AWS SES is working and ready to send emails for:
- User signup OTP verification
- Password reset emails
- Admin password reset
- Any other transactional emails

Next step: **Verify `info@easylearnova.com` in AWS SES Console** or **Request Production Access** for unrestricted sending.
