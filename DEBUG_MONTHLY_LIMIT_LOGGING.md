# Debug Logging for Monthly Topic Limit Issue

## Problem
Monthly topic count reduces correctly during session (15 → 14 → 13...) but resets to 15 after page reload.

## Logging Added

### Backend Logging (`backend/backend/ai/`)

#### 1. **Rate Limit Status Endpoint** (`views.py` - `get_topic_rate_limit_status`)
```
📊 RATE LIMIT STATUS - User ID: {user_id}
📊 Monthly Used: {value}
📊 Monthly Limit: {value}
📊 Monthly Remaining: {value}
📊 Full stats: {json}
```

#### 2. **Monthly Count Retrieval** (`rate_limiter.py` - `_get_user_monthly_count`)
```
🔍 Monthly count: User not authenticated, returning 0
🔍 Monthly count cache key: {cache_key}
🔍 Monthly count from cache for user {user_id}: {value}
```

#### 3. **Topic Creation Recording** (`views.py` - `create_course_topics`)
```
🎯 RECORDING TOPIC CREATION for {count} topics
📈 AFTER RECORDING - monthly_used: {value}
📈 AFTER RECORDING - monthly_limit: {value}
📈 AFTER RECORDING - monthly_remaining: {value}
```

#### 4. **Monthly Count Increment** (`rate_limiter.py` - `record_usage`)
```
💾 Recording monthly count for user {user_id}
💾 Cache key: {cache_key}
💾 Monthly count INCREMENT: {old} + {increment} = {new}
💾 Cache timeout: {seconds} seconds
✅ Successfully updated monthly count for user {user_id}: {old} -> {new}
🔍 Verification read: {value}
```

### Frontend Logging (`frontend/src/components/Chatbot/`)

#### Desktop (`ChatbotPage.jsx` - `fetchUsageStats`)
```
✅ Usage stats fetched successfully: {object}
📊 FRONTEND: monthly_used = {value}
📊 FRONTEND: monthly_limit = {value}
📊 FRONTEND: monthly_remaining = {value}
📊 FRONTEND: Full stats object: {json}
```

#### Mobile (`MobileChatbotPage.jsx` - `fetchUsageStats`)
```
✅ [Mobile] Usage stats fetched successfully: {object}
📊 [Mobile] FRONTEND: monthly_used = {value}
📊 [Mobile] FRONTEND: monthly_limit = {value}
📊 [Mobile] FRONTEND: monthly_remaining = {value}
📊 [Mobile] FRONTEND: Full stats object: {json}
```

## How to Debug

### Step 1: Start Backend
```bash
cd backend
python manage.py runserver
```
Watch the terminal for backend logs.

### Step 2: Open Browser Console
- Chrome/Edge: F12 → Console tab
- Firefox: F12 → Console tab

### Step 3: Reproduce the Issue

1. **Login to the application**
   - Backend should log: `📊 RATE LIMIT STATUS - User ID: {your_id}`
   - Frontend console should show: `📊 FRONTEND: monthly_used = 0`

2. **Create a course with topics**
   - Backend should log:
     ```
     🎯 RECORDING TOPIC CREATION for 4 topics
     💾 Recording monthly count for user {your_id}
     💾 Monthly count INCREMENT: 0 + 4 = 4
     ✅ Successfully updated monthly count: 0 -> 4
     🔍 Verification read: 4
     ```
   - Frontend should show: `📊 FRONTEND: monthly_used = 4`

3. **Reload the page**
   - Backend should log: `🔍 Monthly count from cache for user {your_id}: 4`
   - Frontend should show: `📊 FRONTEND: monthly_used = 4` (NOT 0!)

### Step 4: Analyze the Logs

#### ✅ If Working Correctly:
```
Backend logs:
  🔍 Monthly count from cache: 4
  📊 Monthly Used: 4
  
Frontend logs:
  📊 FRONTEND: monthly_used = 4
```

#### ❌ If Cache Not Working:
```
Backend logs:
  🔍 Monthly count from cache: 0  ← Should be 4!
  📊 Monthly Used: 0
  
Frontend logs:
  📊 FRONTEND: monthly_used = 0  ← Resets to 0!
```

#### ❌ If Cache Write Failing:
```
Backend logs:
  💾 Monthly count INCREMENT: 0 + 4 = 4
  🔍 Verification read: 0  ← Should be 4!
  
This means cache.set() is failing silently
```

#### ❌ If Frontend Not Reading Correctly:
```
Backend logs:
  📊 Monthly Used: 4  ← Backend has correct value
  
Frontend logs:
  📊 FRONTEND: monthly_used = 0  ← Frontend sees wrong value
  
This means API response structure is wrong
```

## Common Issues to Check

### 1. Cache Not Configured
**Symptom**: Verification read returns 0 immediately after write
**Check**: 
```bash
# In Django shell
python manage.py shell
>>> from django.core.cache import cache
>>> cache.set('test_key', 123, 3600)
>>> cache.get('test_key')  # Should return 123
```

### 2. Cache Backend Not Running
**Symptom**: All cache operations return None or 0
**Check**:
- If using Redis: `redis-cli ping` should return `PONG`
- If using Memcached: `telnet localhost 11211` should connect

### 3. User Not Authenticated
**Symptom**: `Monthly count: User not authenticated, returning 0`
**Check**:
- Verify JWT token in browser localStorage
- Check `request.user.is_authenticated` in backend

### 4. Cache Key Mismatch
**Symptom**: Write succeeds but read returns 0
**Check**: Compare cache keys in logs:
```
💾 Cache key: topic_monthly_count_user_123_2025-11
🔍 Monthly count cache key: topic_monthly_count_user_123_2025-11
```
Keys must match exactly!

### 5. Cache Timeout Too Short
**Symptom**: Works initially but resets after some time
**Check**: `💾 Cache timeout: {seconds} seconds` - should be ~2.6M seconds for monthly

## What to Report

Copy the relevant logs and answer:

1. **When you create a course, what does backend log?**
   - Look for: `💾 Monthly count INCREMENT`
   - Look for: `🔍 Verification read`

2. **When you reload the page, what does backend log?**
   - Look for: `🔍 Monthly count from cache`

3. **What does frontend console show on reload?**
   - Look for: `📊 FRONTEND: monthly_used = ?`

4. **Cache configuration in `settings.py`:**
   ```python
   CACHES = {
       'default': {
           'BACKEND': '?',  # What's here?
           ...
       }
   }
   ```

## Expected Flow

```
User creates course (4 topics)
  ↓
Backend: create_course_topics()
  ↓
Backend: record_topic_creation_with_auth()
  ↓
Backend: limiter.record_usage()
  ↓
Backend: cache.set("topic_monthly_count_user_123_2025-11", 4)
  ↓
Backend: cache.get() → Verify = 4 ✅
  ↓
Backend: Response with monthly_used=4 sent to frontend
  ↓
Frontend: setUsageStats({ monthly_used: 4, ... })
  ↓
User reloads page
  ↓
Frontend: fetchUsageStats()
  ↓
Backend: get_topic_rate_limit_status()
  ↓
Backend: limiter.get_usage_stats()
  ↓
Backend: _get_user_monthly_count()
  ↓
Backend: cache.get("topic_monthly_count_user_123_2025-11") → 4 ✅
  ↓
Backend: Response with monthly_used=4 sent to frontend
  ↓
Frontend: setUsageStats({ monthly_used: 4, ... })
  ↓
UI shows: "11 topics remaining" ✅
```

---

**Files Modified:**
- `backend/backend/ai/views.py` - Added logging in endpoints
- `backend/backend/ai/rate_limiter.py` - Added logging in cache operations
- `frontend/src/components/Chatbot/ChatbotPage.jsx` - Added console logs
- `frontend/src/components/Chatbot/MobileChatbotPage.jsx` - Added console logs
