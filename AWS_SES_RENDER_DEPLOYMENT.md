# AWS SES API Deployment to Render

## Changes Made

### 1. Requirements Update
✅ Added `boto3>=1.40.0` to `requirements.txt` for AWS SES API support

### 2. Environment Variables Added to render.yaml
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY  
✅ AWS_REGION (ap-south-1)
✅ DEFAULT_FROM_EMAIL (info@easylearnova.com)

### 3. Code Changes Already Applied
✅ Fixed exception handling bug in `send_email_via_ses()` function
✅ Both OTP signup and password reset emails using AWS SES API

---

## Deployment Steps

### Step 1: Commit and Push Changes
```bash
cd C:/Users/Varun/Downloads/new-easylearnova/thestudent
git add requirements.txt render.yaml
git commit -m "Add boto3 for AWS SES API email delivery"
git push origin dep-backend
```

### Step 2: Update Render Environment Variables
Go to Render Dashboard → Your Service → Environment

**Add these AWS SES credentials:**
```
AWS_ACCESS_KEY_ID = AKIAWEBLRWIXDGUAFCVW
AWS_SECRET_ACCESS_KEY = 7VGiWsrjPSVfVxaL3UlvPYQPc5GB2pRNwaLDGeU7
AWS_REGION = ap-south-1
DEFAULT_FROM_EMAIL = info@easylearnova.com
```

### Step 3: Trigger Deployment
- Render will automatically detect the push to `dep-backend` branch
- Or manually trigger: Dashboard → Manual Deploy → Deploy latest commit

### Step 4: Monitor Build Logs
Watch for:
```
✅ Installing boto3==1.40.69
✅ Successfully installed boto3
✅ Build completed successfully
```

### Step 5: Verify Email Functionality
Test on production (www.easylearnova.com):

1. **Test OTP Signup:**
   - Try signing up with a new email
   - Check if OTP email arrives
   - Verify email headers show `amazonses.com`

2. **Test Password Reset:**
   - Click "Forgot Password?"
   - Enter email and request reset
   - Check if reset email arrives
   - Verify email headers show `amazonses.com`

---

## Verification Checklist

### Before Deployment
- ✅ boto3 added to requirements.txt
- ✅ render.yaml updated with AWS SES env vars
- ✅ Exception handling bug fixed in views.py
- ✅ Local testing passed (both email flows work)
- ✅ Email headers show AWS SES locally

### After Deployment
- ⏳ Check Render build logs for boto3 installation
- ⏳ Verify no "boto3 not installed" errors in logs
- ⏳ Test OTP signup on www.easylearnova.com
- ⏳ Test password reset on www.easylearnova.com
- ⏳ Check production email headers show amazonses.com

---

## Why AWS SES API (not SMTP)?

### Problem with SMTP on Render Free Tier:
- ❌ Render blocks SMTP ports (465, 587) on free tier
- ❌ Previous error: "boto3 not installed"
- ❌ Emails would fail silently or timeout

### Solution with AWS SES API:
- ✅ Uses HTTPS API calls (not blocked by Render)
- ✅ Works on free tier without port restrictions
- ✅ More reliable and faster delivery
- ✅ Better error handling and logging

---

## Troubleshooting

### If "boto3 not installed" error persists:
1. Check build logs for pip install errors
2. Verify requirements.txt is in root directory
3. Try manual deploy with "Clear build cache"

### If emails still fail:
1. Check Render logs: `Dashboard → Logs`
2. Look for AWS SES API errors
3. Verify environment variables are set correctly
4. Check AWS SES region matches (ap-south-1)

### If email headers still show Hostinger:
1. Verify AWS credentials are correct in Render
2. Check settings.py is reading AWS env vars
3. Restart the service after env var changes

---

## Expected Production Behavior

### Success Indicators:
```
✅ OTP email sent successfully to user@example.com via AWS SES
✅ Password reset email sent successfully to user@example.com
✅ MessageId: 0109019a65009c72-f5b6d4cb-9eba-4997-81c3-af1ad7575a61-000000
```

### Email Headers Should Show:
```
Return-Path: <bounce@email-smtp.ap-south-1.amazonaws.com>
Received: from email-smtp.ap-south-1.amazonaws.com
Message-ID: <...@email.amazonses.com>
X-SES-Outgoing: 2025.11.09-01:35:47
```

---

## Render Free Tier Compatibility

| Feature | SMTP Method | AWS SES API |
|---------|-------------|-------------|
| Port 465/587 Access | ❌ Blocked | ✅ Not needed |
| HTTPS API Calls | N/A | ✅ Allowed |
| Installation | None needed | ✅ pip install boto3 |
| Cost | Free | ✅ Free tier (62,000 emails/month) |
| Reliability on Render | ❌ Fails | ✅ Works |

---

## Next Steps After Successful Deployment

1. **Monitor Production Logs** for 24-48 hours
   - Check for any AWS SES API errors
   - Monitor email delivery success rates

2. **Test Edge Cases:**
   - Multiple signups in quick succession
   - Password reset for non-existent users
   - Resending OTP multiple times

3. **Set Up AWS SES Monitoring:**
   - Configure AWS SNS for bounce notifications
   - Monitor AWS SES sending statistics
   - Track reputation dashboard

4. **Production Email Verification:**
   - Verify SPF/DKIM/DMARC records for easylearnova.com
   - Check spam folder rates
   - Monitor AWS SES reputation score

---

## Rollback Plan (If Needed)

If AWS SES API causes issues:

1. Revert to previous commit:
   ```bash
   git revert HEAD
   git push origin dep-backend
   ```

2. Or manually revert:
   - Remove boto3 from requirements.txt
   - Remove AWS env vars from render.yaml
   - Restore old SMTP email sending code

3. Wait for Render to redeploy
4. Verify SMTP method works (if ports aren't blocked)

---

## AWS SES API Credentials

**IAM User:** easylearnova-ses-api
**Region:** ap-south-1 (Mumbai)
**From Email:** info@easylearnova.com

**Production Credentials (Set in Render Dashboard):**
```
AWS_ACCESS_KEY_ID = AKIAWEBLRWIXDGUAFCVW
AWS_SECRET_ACCESS_KEY = 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
```

⚠️ **Never commit these to Git!** Only set in Render dashboard.

---

## Summary

This deployment switches email delivery from SMTP (blocked on Render) to AWS SES API (works via HTTPS). The fix includes:

1. Installing boto3 library
2. Setting AWS credentials in Render
3. Using send_email_via_ses() function
4. Fixed exception handling for production reliability

Expected result: All transactional emails work on Render free tier via AWS SES API ✅
