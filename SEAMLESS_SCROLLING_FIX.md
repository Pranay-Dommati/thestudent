# Seamless Scrolling Update

## Changes Implemented

1.  **Admin Dashboard Layout (`AdminDashboard.jsx`)**:
    *   Added `h-[calc(100vh-4rem)]` to the main content area to fix its height to the viewport minus the header.
    *   Added `overflow-y-auto` to enable vertical scrolling within the main area.
    *   Added `custom-scrollbar` class to style the scrollbar.

2.  **School Course Lesson Form (`SchoolCourseForm/LessonForm.jsx`)**:
    *   Added `custom-scrollbar` class to the "About This Lesson" textarea (Video type).
    *   Added `custom-scrollbar` class to the "Content" textarea (Reading type).

3.  **Engineering Course Lesson Form (`EngineeringCourseForm/LessonForm.jsx`)**:
    *   Added `custom-scrollbar` class to the `MDEditor` component's `textareaProps` for both Video and Reading lesson types.

## Result
*   The Admin Edit Course page (and all other admin pages) now has a fixed sidebar and header, with a scrollable main content area featuring a seamless, styled scrollbar.
*   Large content editors within the lesson forms also feature the same seamless scrollbar styling.
