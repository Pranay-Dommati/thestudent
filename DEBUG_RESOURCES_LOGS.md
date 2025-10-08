# Resources Debug Logging Guide

## 🔍 Console Logs to Look For

I've added comprehensive logging throughout the entire resources flow. Here's what to check:

---

## Step-by-Step Diagnosis

### 1️⃣ Resources Service Generation
**Look for these logs when resources are being generated:**

```
✅ [RESOURCES SERVICE] Generated resources successfully: {
  topic: "...",
  resourcesCount: X,
  metadata: { generatedAt: "2025-...", totalResources: X, ... },
  hasGeneratedAt: true
}

📤 [RESOURCES SERVICE] Called setContent with: {
  resourcesCount: X,
  metadataKeys: ["generatedAt", "totalResources", ...],
  generatedAt: "2025-10-07T..."
}
```

**✅ Good**: `hasGeneratedAt: true` and `generatedAt` has a timestamp
**❌ Bad**: `hasGeneratedAt: false` or missing `generatedAt`

---

### 2️⃣ Progressive Generator Extraction
**Look for this when content is extracted from the generator callback:**

```
🔍 [PROG GEN] Extracted resources content: {
  resourcesCount: X,
  hasMetadata: true,
  metadataKeys: ["generatedAt", "totalResources", ...],
  generatedAt: "2025-10-07T..."
}
```

**✅ Good**: `hasMetadata: true` with `generatedAt` timestamp
**❌ Bad**: `hasMetadata: false` or empty `metadataKeys`

**If this fails**: The problem is in the `setContent` callback - metadata isn't being passed correctly

---

### 3️⃣ Storage to LocalStorage
**Look for this when content is saved:**

```
💾 [PROG GEN] Storing resources with metadata: {
  topicName: "...",
  resourcesCount: X,
  hasMetadata: true,
  generatedAt: "2025-10-07T..."
}
```

**✅ Good**: `hasMetadata: true` with `generatedAt`
**❌ Bad**: You see `💾 [PROG GEN] Storing normal tab content` instead (wrong path!)

**If this fails**: The `typeof content === 'object'` check is failing, treating resources as array

---

### 4️⃣ Loading from Storage
**Look for this when loading topic content:**

```
📚 [LOAD CONTENT] Formatted progressive content: {
  topicName: "...",
  resourcesCount: X,
  hasResourcesMetadata: true,
  generatedAt: "2025-10-07T...",
  progressiveContentKeys: ["reading", "summary", ..., "resourcesMetadata"]
}
```

**✅ Good**: `hasResourcesMetadata: true` and `resourcesMetadata` in keys
**❌ Bad**: `hasResourcesMetadata: false` or `resourcesMetadata` not in keys

**If this fails**: Storage didn't save metadata, or retrieval is broken

---

### 5️⃣ Tab Availability Check
**Look for this when determining if tab should unlock:**

```
🔓 [TAB AVAILABILITY] Checking resources availability: {
  topicName: "...",
  hasMetadata: true,
  generatedAt: "2025-10-07T...",
  resourcesCount: X
}

✅ [TAB AVAILABILITY] Unlocking resources tab for: ...
```

**OR if it fails:**

```
❌ [TAB AVAILABILITY] Resources tab stays LOCKED (no generatedAt) for: ...
```

**✅ Good**: See the ✅ unlock message
**❌ Bad**: See the ❌ stays locked message

**If this fails**: Metadata is missing or `generatedAt` is undefined

---

### 6️⃣ Rendering Resources Tab
**Look for this when clicking the Resources tab:**

```
🎨 [RENDER RESOURCES] Rendering resources tab: {
  hasContent: true,
  resourcesCount: X,
  hasMetadata: true,
  generatedAt: "2025-10-07T...",
  generationCompleted: true,
  contentKeys: ["reading", "summary", ..., "resourcesMetadata"]
}
```

**OR if generation not completed:**

```
⏳ [RENDER RESOURCES] Showing loader - generation not completed
```

**✅ Good**: `generationCompleted: true` and `hasMetadata: true`
**❌ Bad**: `generationCompleted: false` - will show infinite spinner

**If this fails**: Content state is missing `resourcesMetadata`

---

## 🎯 Quick Diagnosis Table

| Step | Log Prefix | Key Field | If Missing |
|------|-----------|-----------|------------|
| 1. Generate | `✅ [RESOURCES SERVICE]` | `hasGeneratedAt: true` | Service isn't setting metadata |
| 2. Extract | `🔍 [PROG GEN]` | `hasMetadata: true` | Callback isn't receiving metadata |
| 3. Store | `💾 [PROG GEN]` | `hasMetadata: true` | Object check failing, treating as array |
| 4. Load | `📚 [LOAD CONTENT]` | `hasResourcesMetadata: true` | Storage didn't save or retrieve failed |
| 5. Unlock | `✅ [TAB AVAILABILITY]` | Unlock message | Metadata lost somewhere in flow |
| 6. Render | `🎨 [RENDER RESOURCES]` | `generationCompleted: true` | Content state missing metadata |

---

## 📋 Testing Steps

### 1. Open Browser Console
1. Press F12
2. Go to **Console** tab
3. Clear the console (trash icon)

### 2. Generate New Course
1. Navigate to Pro Learning
2. Generate a **NEW** course (2 topics)
3. Watch the console as generation happens

### 3. Copy All Logs
After resources generate:
1. Right-click in console
2. Select **"Save as..."** or copy all text
3. Share the logs with me

---

## 🔍 What I Need From You

**Please share:**

1. **All console logs** from the generation process (look for the emoji prefixes)
2. **Which step is failing** (where do you stop seeing the ✅ good logs?)
3. **Screenshot of React DevTools** showing the `content` state:
   - Open React DevTools
   - Find `ProLearningPage` component
   - Show the `content` object

---

## 🚨 Common Failure Points

### Failure Point 1: After Step 1 (Service)
**Symptom**: No `📤 [RESOURCES SERVICE] Called setContent` log
**Cause**: Resources service not calling setContent
**Fix**: Check if resources service completed successfully

### Failure Point 2: After Step 2 (Extract)
**Symptom**: `🔍 [PROG GEN]` shows `hasMetadata: false`
**Cause**: Content object doesn't have resourcesMetadata field
**Fix**: Resources service isn't sending metadata correctly

### Failure Point 3: After Step 3 (Store)
**Symptom**: See `💾 [PROG GEN] Storing normal tab content` instead of `Storing resources with metadata`
**Cause**: Content is an array instead of object `{resources, resourcesMetadata}`
**Fix**: Progressive generator extraction not working

### Failure Point 4: After Step 4 (Load)
**Symptom**: `📚 [LOAD CONTENT]` shows `hasResourcesMetadata: false`
**Cause**: Storage didn't save or retrieve failed
**Fix**: Check localStorage in DevTools → Application tab

### Failure Point 5: After Step 5 (Unlock)
**Symptom**: `❌ [TAB AVAILABILITY] Resources tab stays LOCKED`
**Cause**: generatedAt is undefined or null
**Fix**: Metadata was lost somewhere in steps 1-4

### Failure Point 6: After Step 6 (Render)
**Symptom**: `⏳ [RENDER RESOURCES] Showing loader`
**Cause**: Content state doesn't have resourcesMetadata
**Fix**: State management issue, content not updated properly

---

## 🎓 Example of Good Flow

```
✅ [RESOURCES SERVICE] Generated resources successfully: { hasGeneratedAt: true }
📤 [RESOURCES SERVICE] Called setContent with: { generatedAt: "2025-10-07T11:46:00Z" }
🔍 [PROG GEN] Extracted resources content: { hasMetadata: true, generatedAt: "2025-10-07T11:46:00Z" }
💾 [PROG GEN] Storing resources with metadata: { hasMetadata: true, generatedAt: "2025-10-07T11:46:00Z" }
📚 [LOAD CONTENT] Formatted progressive content: { hasResourcesMetadata: true, generatedAt: "2025-10-07T11:46:00Z" }
🔓 [TAB AVAILABILITY] Checking resources availability: { hasMetadata: true, generatedAt: "2025-10-07T11:46:00Z" }
✅ [TAB AVAILABILITY] Unlocking resources tab for: Topic Name
🎨 [RENDER RESOURCES] Rendering resources tab: { generationCompleted: true }
```

If you see ALL these logs, it's working correctly!

---

## 💡 Quick Check Commands

### Check Content State
```javascript
// In browser console
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1).findFiberByHostInstance(document.querySelector('[data-topic]'))
```

### Check LocalStorage
```javascript
// In browser console
JSON.parse(localStorage.getItem('pro_learning_courses_v2'))
```

---

Let me know what logs you see and where they stop! 🔍
