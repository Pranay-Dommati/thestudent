# Network Timeout Fix for Content Generation

## Problem Summary
- **Issue**: `/ai/reading/` endpoint failing with "Read timed out" error after 30 seconds
- **Error**: `HTTPSConnectionPool(host='generativelanguage.googleapis.com', port=443): Read timed out. (read timeout=30)`
- **Impact**: Progressive content generation fails when Gemini API takes longer than 30 seconds to generate reading content

## Root Cause
- Gemini API can take longer than 30 seconds to generate comprehensive reading content
- Network timeout was set too low at 30 seconds
- No specific handling for network timeout errors (returned generic 500 error)

## The Fixes

### 1. Increased API Timeout
**File**: `backend/backend/ai/ai_service.py` (line ~63)

**Before:**
```python
response = requests.post(
    f"{model_url}?key={settings.GEMINI_API_KEY}",
    headers=headers,
    json=data,
    timeout=30  # Too short for large content generation
)
```

**After:**
```python
response = requests.post(
    f"{model_url}?key={settings.GEMINI_API_KEY}",
    headers=headers,
    json=data,
    timeout=60  # Increased from 30 to 60 seconds for large content generation
)
```

### 2. Improved Error Handling
**File**: `backend/backend/ai/reading.py`

**Added NetworkError Import:**
```python
from .ai_service import call_gemini_api, call_gemini_flash_api, NetworkError
```

**Added Specific NetworkError Handling:**
```python
except NetworkError as e:
    # Handle network/timeout errors specifically
    print(f"🌐 NETWORK ERROR in handle_reading:")
    print(f"   • Topic: '{topic if 'topic' in locals() else 'unknown'}'")
    print(f"   • Category: '{category if 'category' in locals() else 'unknown'}'")
    print(f"   • Error: {str(e)}")
    
    return JsonResponse({
        'error': 'Network timeout',
        'message': str(e),
        'topic': topic if 'topic' in locals() else 'unknown',
        'retry_recommended': True
    }, status=503)  # Service Unavailable - client should retry
```

## Benefits

### ✅ Longer Timeout Window
- **60 seconds** instead of 30 seconds gives Gemini API more time to generate comprehensive content
- Reduces timeout failures for complex topics or larger content

### ✅ Better Error Responses
- **503 Service Unavailable** instead of 500 Internal Server Error
- Signals to frontend that this is a temporary issue (retry-able)
- Includes `retry_recommended: true` flag

### ✅ Clearer Error Messages
- Specific network timeout detection
- Better logging for debugging
- Topic and category context included in error response

### ✅ Improved UX
- Frontend can implement automatic retries for 503 errors
- Users get clearer feedback about network issues
- Distinguishes between network problems and API errors

## Testing Recommendations

1. **Monitor Backend Logs**: Watch for timeout patterns
   ```bash
   cd backend && tail -f django.log | grep -E "(timeout|NETWORK|ERROR)"
   ```

2. **Check Response Times**: Most reading content should generate within 20-40 seconds
   - If regularly hitting 60s timeout, may need further optimization

3. **Network Stability**: Ensure stable internet connection during content generation

4. **Frontend Retry Logic**: Implement exponential backoff for 503 responses

## Related Configurations

### Current Timeouts in System:
- **Reading Content Generation**: 60 seconds (main fix)
- **Quiz Generation**: 30 seconds (quiz.py - already adequate)
- **Flash Model Calls**: 15-20 seconds (classification, summaries)
- **Pro Model Calls**: 45 seconds first attempt, 20 seconds subsequent

### Token Limits:
- **Reading Content**: 4096 maxOutputTokens
- **Quiz Content**: 4096 maxOutputTokens (recently increased)
- **Classification**: 512 maxOutputTokens

## Status
✅ **Fixed** - Timeout increased to 60 seconds with better error handling
✅ **Deployed** - Ready for testing
🔄 **Monitor** - Watch backend logs for any remaining timeout issues

## If Timeouts Still Occur

If you still see timeouts after this fix:

1. **Check your internet connection** - ensure stable, fast connection
2. **Try a different network** - some networks have restrictive firewall rules
3. **Contact Gemini API support** - may be rate limiting or service issues
4. **Consider content chunking** - break very large topics into smaller subtopics
5. **Increase timeout further** - can go up to 120 seconds if needed (but may indicate other issues)
