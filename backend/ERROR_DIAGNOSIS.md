# 🔧 Backend 500/404 Error Troubleshooting Guide

## Error Summary from Console Logs

### 1. **500 Internal Server Error** - `/ai/create-course-topics/`
- **Status**: Endpoint exists ✅
- **Likely Cause**: Authentication or rate limiting runtime error

### 2. **500 Internal Server Error** - `/api/courses/engineering/?category=all`
- **Status**: Endpoint exists ✅  
- **Likely Cause**: Runtime error in view (possibly model field issue)

### 3. **404 Not Found** - `/api/courses/enrollment-status/{course_id}/`
- **Status**: Endpoint exists ✅
- **Likely Cause**: URL routing issue or server not running

### 4. **404 Not Found** - `/api/courses/enroll/`
- **Status**: Endpoint exists ✅
- **Likely Cause**: URL routing issue or server not running

---

## Diagnostic Results ✅

- ✅ Database connectivity: WORKING
- ✅ Engineering Courses: 1 course found
- ✅ School Courses: 1 course found  
- ✅ Users: 13 users found
- ✅ URL patterns: Correctly defined
- ✅ View decorators: Properly set

---

## Root Causes & Fixes

### Issue 1: Server Not Running or Crashed
**Solution**: Restart the Django development server

```bash
cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend
python manage.py runserver 0.0.0.0:8000
```

### Issue 2: Authentication/CORS Issues
The frontend is trying to access authenticated endpoints. Ensure:
1. JWT token is being sent in requests
2. CORS is properly configured
3. Session is active

### Issue 3: Rate Limiting in create_course_topics
Check if rate limiting is blocking requests:

```python
# In backend/backend/ai/views.py around line 1503
# The check_topic_rate_limit_with_auth might be failing
```

### Issue 4: Model Field Encoding Issues
The `list_engineering_courses` view might fail on certain model fields with encoding issues.

---

## Quick Fixes to Apply

### Fix 1: Add Better Error Logging to create_course_topics

The `create_course_topics` function needs better error reporting. Check lines 1469-1530 in `backend/backend/ai/views.py`.

### Fix 2: Verify all endpoints are accessible
Run this test:

```bash
cd backend
python test_endpoints.py
```

### Fix 3: Check Django Server Logs
When starting the server, watch for any import errors or configuration issues.

---

## Testing Steps

1. **Start Backend Server**:
   ```bash
   cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend
   python manage.py runserver
   ```

2. **Test Endpoints Manually**:
   ```bash
   # Test engineering courses
   curl http://127.0.0.1:8000/api/courses/engineering/?category=all
   
   # Test enrollment status (requires auth token)
   curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:8000/api/courses/enrollment-status/COURSE_ID/
   ```

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Go to Network tab
   - Retry the failing requests
   - Click on failed request to see detailed error response

---

## Recommended Actions

1. ✅ **Restart Django server** - Most common fix for 500 errors
2. ✅ **Check browser console** for actual error messages from backend
3. ✅ **Verify authentication** - Make sure JWT tokens are valid
4. ✅ **Check CORS settings** in `backend/backend/settings.py`
5. ✅ **Review Django server console** output for Python exceptions

---

## Files to Check

1. `backend/backend/settings.py` - CORS and authentication config
2. `backend/courses/views.py` - View functions (lines 387, 1857)
3. `backend/backend/ai/views.py` - AI endpoints (line 1469)
4. `backend/backend/urls.py` - Main URL routing
5. `backend/courses/urls.py` - Courses URL patterns

---

## Next Steps

After restarting the server:
1. Try the actions that caused errors again
2. Check the **Django server terminal output** for detailed Python stack traces
3. Share any new error messages you see in the Django console
4. Check the Network tab in browser DevTools for response details

The endpoints are correctly configured, so the issue is likely:
- ✅ Server not running
- ⚠️ Runtime exception in view functions  
- ⚠️ Authentication/permission issues
- ⚠️ Database query errors
