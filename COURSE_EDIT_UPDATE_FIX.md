# Course Edit/Update Fix

## Issue Summary
When editing courses in the admin panel (`http://localhost:5173/admin-p/edit-course/{courseId}`):
1. **Requirements field** - Was showing empty even though data exists in database
2. **Requirements updates** - Not saving when submitted
3. **Lesson resources** - Not saving when added/updated

## Root Causes

### 1. Edit Page Not Retrieving Proper Data
**Problem**: The GET endpoint `/api/courses/{id}/` was returning field names that didn't match what the admin edit form expected.

- **Backend returned**: `prerequisites`, `learning_objectives`
- **Frontend expected**: `requirements`, `learning_outcomes`

**Fix Applied** (`backend/courses/views.py` - `get_course_by_id` function):
```python
# Added both legacy and new field names for compatibility
'learning_objectives': course.learning_points or [],
'learning_outcomes': course.learning_points or [],  # NEW
'prerequisites': course.requirements or [],
'requirements': course.requirements or [],  # NEW
```

### 2. Update Endpoint Not Handling Requirements Field
**Problem**: The PUT endpoint only checked for `prerequisites` field but the form sends `requirements`.

**Fix Applied** (`backend/courses/views.py` - `update_course` function):
```python
# Before: Only handled 'prerequisites'
if 'prerequisites' in data:
    prereq_data = data.get('prerequisites', '[]')
    
# After: Handles both 'prerequisites' and 'requirements'
if 'prerequisites' in data or 'requirements' in data:
    prereq_data = data.get('requirements') or data.get('prerequisites') or '[]'
    if isinstance(prereq_data, str):
        if not prereq_data.strip():
            prereq_data = '[]'
        engineering_course.requirements = json.loads(prereq_data)
    else:
        engineering_course.requirements = list(prereq_data)
```

### 3. Lesson Resources Not Being Saved
**Problem**: The update endpoint had NO code to handle lesson resources (`downloadable` and `internet` resources).

**Fix Applied** (`backend/courses/views.py` - lesson update section):
```python
# --- Handle lesson resources (downloadable and internet) ---
has_resources = les.get('hasResources', False)
resources_data = les.get('resources', {})

if has_resources and resources_data:
    # Clear existing resources for this lesson
    lesson_obj.resources.all().delete()
    
    # Add downloadable resources
    downloadable_resources = resources_data.get('downloadable', [])
    for res in downloadable_resources:
        if isinstance(res, dict):
            LessonResource.objects.create(
                lesson=lesson_obj,
                type='downloadable',
                title=res.get('title', ''),
                description=res.get('description', ''),
                url=res.get('url', ''),
            )
    
    # Add internet resources
    internet_resources = resources_data.get('internet', [])
    for res in internet_resources:
        if isinstance(res, dict):
            LessonResource.objects.create(
                lesson=lesson_obj,
                type='internet',
                title=res.get('title', ''),
                description=res.get('description', ''),
                url=res.get('url', ''),
            )
elif not has_resources:
    # If hasResources is explicitly false, clear all resources
    lesson_obj.resources.all().delete()
```

### 4. Update Response Consistency
**Problem**: Update endpoint response only returned `prerequisites` and `learning_objectives` keys.

**Fix Applied**: Updated response to include both legacy and new field names:
```python
course_data.update({
    'learning_objectives': course.learning_points or [],
    'learning_outcomes': course.learning_points or [],  # NEW
    'prerequisites': course.requirements or [],
    'requirements': course.requirements or [],  # NEW
})
```

## Files Modified
1. `backend/courses/views.py`:
   - Updated `get_course_by_id()` function (line ~2910)
   - Updated `update_course()` function (lines ~2570-2695)

## Testing Checklist

### Test Requirements Update:
1. ✅ Navigate to `http://localhost:5173/admin-p/edit-course/{courseId}`
2. ✅ Verify existing requirements show up in the form
3. ✅ Add a new requirement: "Sample requirement"
4. ✅ Click "Next" → "Update Course"
5. ✅ Hard refresh the edit page (Ctrl+Shift+R)
6. ✅ Verify the new requirement appears in the form
7. ✅ Check database: `python manage.py shell -c "from courses.models import EngineeringCourse; print(EngineeringCourse.objects.get(id='YOUR_ID').requirements)"`

### Test Learning Points Update:
1. ✅ Add/edit "What You'll Learn" points
2. ✅ Save and verify they persist

### Test Lesson Resources:
1. ✅ Navigate to course structure step
2. ✅ Add a lesson and check "Has Resources"
3. ✅ Add downloadable resource:
   - Title: "Course Notes"
   - URL: "https://example.com/notes.pdf"
4. ✅ Add internet resource:
   - Title: "Documentation"
   - URL: "https://docs.example.com"
5. ✅ Save course
6. ✅ Verify resources appear when viewing the course lesson

## Expected Behavior After Fix

### Edit Page (GET):
- Requirements field pre-fills with existing data
- Learning outcomes field pre-fills with existing data
- All fields display correctly

### Update (PUT):
- Requirements save correctly when submitted
- Learning points save correctly when submitted
- Lesson resources (both downloadable and internet) save correctly
- Update response includes all updated fields

## Migration Status
No database migrations required - only view logic changes.

## Deployment Notes
1. No restart required if Django auto-reloads in development
2. In production, restart Django/Gunicorn service after deploying
3. Clear browser cache on admin panel to avoid stale JavaScript

## Additional Notes

### Field Name Mapping
For future reference, here's the complete field mapping:

| Frontend Field Name | Backend Model Field | Alternative Names Accepted |
|---------------------|---------------------|----------------------------|
| `requirements` | `requirements` | `prerequisites` |
| `learning_outcomes` | `learning_points` | `learning_objectives`, `learningOutcomes`, `learningPoints`, `learningObjectives` |
| `proficiency_level` | `proficiency` | - |
| `shortDescription` | `short_description` | - |

### Why Both Field Names?
We maintain both old and new field names for backward compatibility:
- Some frontend components may still use the old names
- API consumers may expect certain field names
- Gradual migration path without breaking existing integrations
