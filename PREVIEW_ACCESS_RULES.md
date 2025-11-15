Public preview rules for courses

- Unauthenticated visitors can preview a subset of every course to understand the platform.
- Backend gates are applied uniformly to School and Engineering courses.

Defaults
- First 2 sections/chapters are eligible for preview.
- In each of those, only the first 3 lessons are fully accessible.
- All other lessons have their video URL, quizzes and resources removed in API responses.
- The UI shows a subtle blur and a clear "Login to access complete content" overlay.

Configuration
- You can override these limits via environment variables on the backend:
  - PREVIEW_SECTIONS_LIMIT: number of sections/chapters unlocked (default 2)
  - PREVIEW_LESSONS_PER_SECTION: lessons unlocked per unlocked section (default 3)

Implementation notes
- Backend: logic lives in `backend/courses/views.py` in `get_engineering_course_by_id` and `get_school_course_by_id`.
  It annotates sections/chapters and lessons with `is_preview` and `is_locked` flags and scrubs content when locked.
- Frontend: `CourseLearning.jsx`, `LessonVideo.jsx`, and `Sidebar.jsx` respect these flags. Locked lessons prevent navigation, blur the player, and show a login CTA.

QA checklist
- As a guest, you can play the first 3 lessons in the first 2 sections but not the rest.
- As a logged-in user, all content is available with no blur or locks.
- Changing the env vars updates behavior after backend reload.
