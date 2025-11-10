# Testing Guide: Course Cache Optimization

## Quick Test Instructions

### Prerequisites
1. Have the app running: `npm run dev` (frontend) and backend server
2. Open browser DevTools (F12) → Console tab
3. Clear localStorage: `localStorage.clear()` in console (for fresh start)

## Test 1: First Time Visit (No Cache)
**What to test:** Initial course load creates cache

### Steps:
1. Navigate to any course learning page, e.g.:
   ```
   http://localhost:5173/courses/11th/state/ts/mathematics/learning?courseId=...
   ```

2. **Look for in console:**
   ```
   🔍 Fetching course from API URL: /api/courses/school/...
   📝 API Response: {...}
   💾 Cached course data for: ...
   ```

3. **Expected behavior:**
   - Loading skeleton appears
   - Content loads in ~2-3 seconds
   - Cache is created in localStorage

4. **Verify cache created:**
   ```javascript
   // In browser console:
   Object.keys(localStorage).filter(k => k.startsWith('course_cache_'))
   // Should show: ["course_cache_courses_11th_state_ts_mathematics_learning..."]
   ```

✅ **Pass criteria:** Content loads, cache created, console shows "Cached course data"

---

## Test 2: Page Reload (Cache Hit)
**What to test:** Reload uses cache immediately

### Steps:
1. On the same course page, press `F5` (reload)

2. **Look for in console:**
   ```
   ✅ Cache hit (fresh) for: ... - 15s old
   👤 Logged in user - using fresh cache for instant load
   🔄 Background progress sync completed
   ```

3. **Expected behavior:**
   - **No loading skeleton**
   - Content appears **instantly** (~100ms)
   - Background sync happens silently

4. **Timing check:**
   ```javascript
   // In browser console, before reload:
   console.time('pageLoad');
   // Then reload
   // After content appears:
   console.timeEnd('pageLoad');
   // Should be < 200ms
   ```

✅ **Pass criteria:** Instant load, no loading spinner, console shows "fresh cache"

---

## Test 3: Navigate Away and Return (Main Fix!)
**What to test:** Cache persists across navigation

### Steps:
1. From the course page, navigate to **Learning Hub** or any other page
   ```
   Click "Back to Learning Hub" or use browser back button
   ```

2. Wait 2-3 seconds on the other page

3. Navigate back to the **same course** (use browser forward or click course again)

4. **Look for in console:**
   ```
   ✅ Cache hit (fresh) for: ... - 45s old
   👤 Logged in user - using fresh cache for instant load
   🔄 Background progress sync completed
   ```

5. **Expected behavior:**
   - Content appears **instantly** (~100ms)
   - No database fetch delay
   - Background sync updates progress

✅ **Pass criteria:** 
- ⚡ Instant load (< 200ms)
- No loading skeleton
- This is the **KEY FIX** - should work now!

---

## Test 4: Mark Lesson Complete (Cache Update)
**What to test:** Progress updates don't break cache

### Steps:
1. On a course page, mark a lesson as complete
   - Click checkmark next to a lesson OR
   - Click "Mark as Complete" button

2. **Look for in console:**
   ```
   💾 Cache updated with new completion status
   ```

3. Navigate away to another page

4. Navigate back to the same course

5. **Expected behavior:**
   - Course loads **instantly**
   - Lesson still shows as completed
   - No re-fetch from database

✅ **Pass criteria:** Cache persists with completion status, instant load on return

---

## Test 5: Stale Cache (30-60 minutes)
**What to test:** Old cache shows content while fetching fresh

### Steps:
1. **Option A (Real Wait):**
   - Visit course
   - Wait 35 minutes
   - Return to course

2. **Option B (Quick Test - Modify Code Temporarily):**
   ```javascript
   // In courseCache.js, temporarily change:
   const STALE_TIME = 30 * 1000; // 30 seconds instead of 30 minutes
   
   // Then:
   // 1. Visit course
   // 2. Wait 35 seconds  
   // 3. Return to course
   ```

3. **Look for in console:**
   ```
   ✅ Cache hit (stale but valid) for: ... - 1845s old
   👤 Logged in user - using stale cache while fetching fresh data
   🔍 Fetching course from API URL: ...
   ```

4. **Expected behavior:**
   - Content shows **immediately** from stale cache
   - Fresh data fetches in background
   - UI updates seamlessly when fresh data arrives

✅ **Pass criteria:** Instant content display, then smooth update with fresh data

---

## Test 6: Expired Cache (> 60 minutes)
**What to test:** Old cache is discarded, fresh fetch happens

### Steps:
1. **Quick Test (Modify Code Temporarily):**
   ```javascript
   // In courseCache.js:
   const CACHE_TTL = 60 * 1000; // 60 seconds instead of 60 minutes
   
   // Then:
   // 1. Visit course
   // 2. Wait 65 seconds
   // 3. Return to course
   ```

2. **Look for in console:**
   ```
   🗑️ Cache expired for: ...
   🔍 Fetching course from API URL: ...
   💾 Cached course data for: ...
   ```

3. **Expected behavior:**
   - Loading skeleton appears
   - Fresh fetch from database (~2-3 seconds)
   - New cache created

✅ **Pass criteria:** Cache expired message, fresh fetch, new cache created

---

## Test 7: Guest User (No Login)
**What to test:** Cache works for guest users

### Steps:
1. **Logout** if logged in

2. Visit a course with preview/unlocked content

3. **Look for in console:**
   ```
   👻 Guest user - using cached course data
   ```

4. Navigate away and return

5. **Expected behavior:**
   - Cache used immediately
   - No progress sync (guest users don't have progress)
   - Instant loads on return visits

✅ **Pass criteria:** Guest users get instant cache benefits without progress tracking

---

## Test 8: Multiple Courses
**What to test:** Cache works for different courses independently

### Steps:
1. Visit **Course A** (e.g., Mathematics)
   - Wait for load
   
2. Visit **Course B** (e.g., Physics)
   - Wait for load

3. Return to **Course A**
   - Should load **instantly** from cache

4. Return to **Course B**
   - Should load **instantly** from cache

5. **Check localStorage:**
   ```javascript
   Object.keys(localStorage).filter(k => k.startsWith('course_cache_'))
   // Should show multiple cache entries
   ```

✅ **Pass criteria:** Each course has separate cache, all load instantly on return

---

## Test 9: Different Boards/States
**What to test:** Cache handles URL variations

### Steps:
1. Visit: `11th/state/ts/mathematics/learning`
2. Visit: `11th/cbse/mathematics/learning`
3. Visit: `10th/state/ap/mathematics/learning`

4. Return to each - all should load instantly

5. **Verify in console:**
   - Each URL gets unique cache key
   - Each loads from its own cache

✅ **Pass criteria:** Different boards/states have separate caches, no conflicts

---

## Test 10: Cache After Multiple Operations
**What to test:** Cache survives complex workflows

### Steps:
1. Visit course
2. Mark 2 lessons complete
3. Navigate to Learning Hub
4. Navigate to another course
5. Navigate back to first course
6. Mark another lesson complete
7. Reload page
8. Navigate away and return

**All steps should:**
- Load instantly after first fetch
- Maintain completion status
- Never lose cache

✅ **Pass criteria:** Cache persists through complex user journeys

---

## Performance Benchmarks

### Measuring Load Time

```javascript
// In browser console before navigation:
performance.mark('nav-start');

// Then navigate to course

// After content fully loads:
performance.mark('nav-end');
performance.measure('navigation', 'nav-start', 'nav-end');
console.log(performance.getEntriesByType('measure'));
```

### Expected Results:
| Scenario | Target Time | Status |
|----------|-------------|---------|
| First visit | < 3000ms | ⏱️ Normal |
| Reload (fresh cache) | < 200ms | ⚡ Fast |
| Navigate back (< 30 min) | < 200ms | ⚡ Fast |
| Navigate back (30-60 min) | < 200ms initial | ⚡ Fast |
| Cache expired (> 60 min) | < 3000ms | ⏱️ Normal |

---

## Troubleshooting

### Issue: Cache not being used
**Check:**
```javascript
// Console:
courseCache.get(courseCache.generateKey(window.location.pathname + window.location.search))
// Should return cached data, not null
```

**Solution:** 
- Clear localStorage: `localStorage.clear()`
- Reload and try again

### Issue: Progress not updating
**Check console for:**
- `🔄 Background progress sync completed`
- `💾 Cache updated with new completion status`

**Solution:**
- Check network tab for API calls
- Verify you're logged in
- Check backend API is running

### Issue: Console errors
**Look for:**
- JSON parse errors → Clear localStorage
- API 401 errors → Re-login
- Network errors → Check backend server

### Issue: Stale data showing
**This is intentional!** 
- Stale cache shows immediately
- Fresh data fetches in background
- UI updates smoothly

If truly stuck, run:
```javascript
// Clear all course caches
courseCache.clearAll();
```

---

## Success Checklist

After running all tests, verify:

- ✅ First visit creates cache
- ✅ Reload uses cache (instant)
- ✅ **Navigate back uses cache (instant)** ← **MAIN FIX**
- ✅ Lesson completion updates cache
- ✅ Stale cache shows content + fetches fresh
- ✅ Expired cache re-fetches
- ✅ Guest users get cache benefits
- ✅ Multiple courses cached independently
- ✅ Different boards/states cached separately
- ✅ Cache survives complex workflows

**If all green:** 🎉 Cache optimization is working perfectly!

## Visual Confirmation

You should see these improvements:
1. **No more "bouncing" spinners** when navigating back
2. **Instant content display** on return visits
3. **Smooth experience** moving between courses
4. **Lower server load** (check Network tab - fewer requests)

## Next Steps

After testing:
1. If issues found → Report with console logs
2. If working well → Deploy to production
3. Monitor cache hit rates in production
4. Consider analytics to track performance improvements

---

## Additional Debug Commands

```javascript
// Check all cached courses
Object.keys(localStorage)
  .filter(k => k.startsWith('course_cache_'))
  .forEach(k => {
    const data = JSON.parse(localStorage.getItem(k));
    const age = Date.now() - data.timestamp;
    console.log(k, `${Math.round(age/1000)}s old`);
  });

// Clear specific course cache
courseCache.invalidate('courses_11th_state_ts_mathematics_learning');

// Check cache size
const cacheSize = JSON.stringify(localStorage).length;
console.log(`Cache size: ${(cacheSize / 1024).toFixed(2)} KB`);

// Force fresh fetch (bypass cache)
localStorage.removeItem('course_cache_' + courseCache.generateKey(window.location.pathname + window.location.search));
window.location.reload();
```
