# AI Learning Content API Implementation

## Overview
Created new API endpoints to replace the deprecated AI Learning Plans functionality. The new system uses the `AITopicContent` model to store AI-generated educational content.

## New API Endpoints

### Base URL: `/api/learning/`

#### 1. **AI Content Plans**
- `GET/POST /api/learning/plans/` - List/Create AI content (ViewSet)
- `GET/PUT/PATCH/DELETE /api/learning/plans/{id}/` - Individual content operations

#### 2. **User AI Content**
- `GET /api/learning/user-plans/` - Get all AI content grouped by course for authenticated user

#### 3. **Course-specific Content**
- `GET /api/learning/course/{course_title}/` - Get AI content for a specific course

## Database Model: `AITopicContent`

### Fields
```python
id = UUIDField (primary key)
user = ForeignKey (User)
course_title = CharField(255)
topic_name = CharField(255)
reading = TextField (AI-generated reading content)
summary = TextField (AI-generated summary)
videos = JSONField (list of video objects)
resources = JSONField (list of resource objects)
quiz = JSONField (list of quiz questions) [NEW]
projects = JSONField (list of project objects) [NEW]
created_at = DateTimeField
updated_at = DateTimeField
```

### Database Constraints
- **Unique Together**: `(user, course_title, topic_name)`
- **Indexes**: 
  - `user + course_title`
  - `created_at`

## API Response Formats

### 1. User Plans Response (`/user-plans/`)
```json
{
  "plans": [
    {
      "id": "uuid",
      "title": "Course Title",
      "type": "ai_topic_content",
      "created_at": "timestamp",
      "updated_at": "timestamp", 
      "topics": [
        {
          "id": "uuid",
          "topic_name": "Topic Name",
          "reading": "AI content...",
          "summary": "Summary...",
          "videos": [...],
          "resources": [...],
          "quiz": [...],
          "projects": [...]
        }
      ]
    }
  ],
  "count": 1
}
```

### 2. Individual Content Response
```json
{
  "id": "uuid",
  "course_title": "Course Title",
  "topic_name": "Topic Name", 
  "reading": "AI-generated content...",
  "summary": "Summary content...",
  "videos": [
    {
      "title": "Video Title",
      "url": "video_url",
      "duration": "10 minutes"
    }
  ],
  "resources": [
    {
      "title": "Resource Title", 
      "url": "resource_url",
      "type": "article"
    }
  ],
  "quiz": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Project description",
      "requirements": [...]
    }
  ],
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "has_content": true,
  "content_summary": {
    "has_reading": true,
    "has_summary": true,
    "video_count": 1,
    "resource_count": 1,
    "quiz_count": 1,
    "project_count": 1
  }
}
```

## Frontend Integration

### Data Storage Flow
1. **Frontend generates AI content** using existing logic
2. **Content stored in localStorage** (existing functionality preserved)
3. **Content sent to backend** via `POST /api/learning/plans/`
4. **Backend stores in database** using `AITopicContent` model
5. **Frontend can retrieve** via `GET /api/learning/user-plans/`

### Compatible Data Structures
The API accepts both:
1. **Direct topic format**:
   ```json
   {
     "course_title": "Course Name",
     "topic_name": "Topic Name",
     "reading": "content...", 
     "videos": [...],
     // ... other fields
   }
   ```

2. **Learning plan format** (for compatibility):
   ```json
   {
     "title": "Course Name",
     "plan_data": {
       "goal": "Course Name",
       "days": [
         {
           "day": 1,
           "topic": "Topic Name",
           "reading": "content...",
           "videos": [...],
           // ... other fields  
         }
       ]
     }
   }
   ```

## Authentication
- All endpoints require user authentication
- Content is automatically associated with the authenticated user
- Users can only access their own content

## Error Handling
- **400 Bad Request**: Missing required fields or invalid data
- **401 Unauthorized**: Authentication required
- **404 Not Found**: Content not found
- **500 Internal Server Error**: Server errors with descriptive messages

## Migration Applied
- `0005_add_quiz_projects_to_ai_content.py` - Added quiz and projects fields + indexes

## Files Created/Modified

### New Files
- `backend/courses/views_ai_content.py` - AI content API views
- `backend/courses/urls_ai_content.py` - AI content URL routing

### Modified Files  
- `backend/courses/models.py` - Enhanced AITopicContent model
- `backend/courses/serializers.py` - Updated serializers with new fields
- `backend/courses/urls.py` - Added AI learning content URLs

## Next Steps
The frontend should now be able to:
1. ✅ Store AI-generated content in the database
2. ✅ Retrieve previously saved content
3. ✅ Update existing content
4. ✅ Maintain compatibility with existing localStorage functionality

The API is backward-compatible and handles both old and new data formats seamlessly.
