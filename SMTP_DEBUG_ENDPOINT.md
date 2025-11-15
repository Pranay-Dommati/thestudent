# SMTP Connection Debug Endpoint

## Purpose
This debug endpoint helps identify whether OTP email timeout issues are caused by:
1. **Render blocking SMTP ports** (25, 465, 587)
2. **SMTP server being slow** to respond
3. **Network/firewall issues** between Render and your email provider

---

## How to Use

### Step 1: Deploy to Render
Push your code to GitHub. Render will automatically redeploy.

### Step 2: Access the Debug Endpoint
Once deployed, visit this URL in your browser:

```
https://easylearnova-backend.onrender.com/api/auth/test-smtp/
```

*(Replace with your actual backend URL if different)*

---

## What the Endpoint Tests

### Test 1: TCP Connection
- Attempts a basic socket connection to your SMTP server
- **Success** = Port is reachable, Render is not blocking it
- **Timeout** = Render may be blocking the port OR server is unreachable

### Test 2: SMTP Handshake
- Performs full SMTP protocol handshake with SSL/TLS
- Measures how long it takes to establish connection
- **Success** = SMTP works, shows connection time
- **Timeout** = Server is too slow or hanging

---

## Interpreting Results

### ✅ **Best Case Scenario:**
```json
{
  "overall_status": "✅ SMTP is working",
  "tests": [
    {"test": "TCP Connection", "status": "✅ success", "duration": "0.45s"},
    {"test": "SMTP Handshake", "status": "✅ success", "duration": "2.3s"}
  ],
  "recommendation": "✅ SMTP is working but consider async email sending"
}
```
**Interpretation:** 
- SMTP works from Render
- Total time ~2-3 seconds is acceptable but could be better
- **Solution:** Implement async email sending (Celery) to avoid blocking users

---

### ⚠️ **Slow SMTP (5-10 seconds):**
```json
{
  "overall_status": "✅ SMTP is working",
  "tests": [
    {"test": "TCP Connection", "status": "✅ success", "duration": "1.2s"},
    {"test": "SMTP Handshake", "status": "✅ success", "duration": "8.5s", "warning": "⚠️ SLOW"}
  ],
  "recommendation": "❌ Switch to a transactional email service"
}
```
**Interpretation:**
- SMTP technically works but is TOO SLOW
- This explains why users experience timeouts
- Geographic latency between Render and Hostinger is the issue
- **Solution:** Switch to SendGrid, Mailgun, or AWS SES (US-based, <1s response)

---

### ❌ **Timeout/Blocked:**
```json
{
  "overall_status": "⏳ Timeout detected",
  "tests": [
    {"test": "TCP Connection", "status": "❌ timeout", "message": "Connection timed out. Render may be blocking port."}
  ],
  "recommendation": "❌ Switch to transactional email service"
}
```
**Interpretation:**
- Render is likely blocking port 465/587
- OR your SMTP server is completely unreachable from Render
- **Solution:** Switch to API-based email service (SendGrid uses HTTPS, not SMTP ports)

---

## Next Steps Based on Results

### If TCP works but SMTP is slow (5-10+ seconds):
**Root Cause:** Geographic latency (Render US ↔ Hostinger EU/Asia)

**Solutions (Pick one):**

1. **Quick Fix:** Switch to US-based email service
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5,000 emails/month)
   - AWS SES (cheapest, $0.10/1000 emails)

2. **Keep Hostinger:** Implement async email sending
   - Install Celery or Django-Q
   - Send emails in background worker
   - User gets instant response

### If TCP connection times out:
**Root Cause:** Render blocking SMTP ports OR firewall issue

**Solutions:**
- **Must** switch to API-based email service (uses HTTPS port 443, not SMTP ports)
- SendGrid, Mailgun, Postmark all use REST APIs

---

## Technical Details

### Endpoint Configuration
- **URL:** `/api/auth/test-smtp/`
- **Method:** GET
- **Authentication:** None (public endpoint)
- **Timeout:** 10s for TCP, 15s for SMTP

### What Gets Tested
1. **TCP Socket Connection** - Raw network connectivity
2. **SMTP SSL/TLS Handshake** - Full protocol negotiation
3. **Connection Duration** - Measures latency

### Security Note
⚠️ **Remove this endpoint after debugging** or add authentication:
```python
@permission_classes([IsAuthenticated])  # Require login
```

---

## Quick Command to Remove Endpoint Later

Once you've debugged the issue, remove the endpoint:

1. Delete the `test_smtp_connection` function from `views.py`
2. Remove the import from `urls.py`
3. Remove the URL path from `urlpatterns`

---

## Current Configuration Being Tested

The endpoint tests these settings from your Django `settings.py`:
- `SMTP_HOST` - Your email server hostname
- `SMTP_PORT` - Usually 465 (SSL) or 587 (TLS)
- `SMTP_USE_SSL` - Whether to use SSL encryption

---

## Expected Timeline

1. **Push to GitHub:** ~1 minute
2. **Render auto-deploy:** ~5-10 minutes
3. **Test endpoint:** Instant
4. **Get results:** 10-30 seconds (includes connection tests)

---

## Support

If you see consistent timeouts (>10 seconds) on production:
- ✅ This confirms SMTP is the bottleneck
- ❌ This is NOT a Render performance issue
- 🎯 Switch to SendGrid/Mailgun for instant emails (<1s)
