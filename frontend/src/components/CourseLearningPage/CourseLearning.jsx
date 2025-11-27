import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import LessonVideo from './LessonVideo';
import CourseProgress from './CourseProgress';
import ResourcesPage from './templ/ResourcesPage';
import QuizIntro from './templ/QuizIntro';
import InstructionsPage from './templ/InstructionsPage';
import Sidebar from './Sidebar';
import CourseLoadingSkeleton from './CourseLoadingSkeleton';
import axiosInstance from '../../utils/axios';
import courseCache from '../../utils/courseCache';
import universalToast from '../../utils/universalToast';
import { useAuth } from '../../context/AuthContext';
import preprocessLatex from '../../utils/latexPreprocessor';

const buildCourseKey = (id, path) => (id ? `course:${id}` : `path:${path || ''}`);

// Update the function signature to accept the new props
const CourseLearning = ({ courseId, pathname, onSidebarToggle }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeTab, setActiveTab] = useState('about');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [contentType, setContentType] = useState('video'); // 'video', 'resources', 'quiz', 'instructions'
  const [courseProgress, setCourseProgress] = useState(null);
  // Keep a server-computed snapshot so UI counts match backend/certificate logic
  const [serverProgress, setServerProgress] = useState(null); // { completed, total, percentage }
  const [savingProgress, setSavingProgress] = useState(false);
  const [internetResourcesOpen, setInternetResourcesOpen] = useState(false);
  const [downloadResourcesOpen, setDownloadResourcesOpen] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressLoading, setProgressLoading] = useState(false); // NEW: Track when progress is being fetched
  const [certificate, setCertificate] = useState(null);
  // When subject-only URL matches multiple courses (e.g., Mathematics 1A vs 1B), show chooser
  const [disambiguationOptions, setDisambiguationOptions] = useState(null); // array of brief course objects
  const [issuingCert, setIssuingCert] = useState(false);
  const videoRef = useRef(null);
  // Track which lessons have been fetched to avoid duplicate API calls
  const fetchedLessonsRef = useRef(new Set());
  // Track if progress has been fetched for this course to avoid duplicate calls
  const progressFetchedRef = useRef(null);
  // Track the currently loaded course ID to prevent re-fetching on URL changes
  const loadedCourseIdRef = useRef(null);
  const loadedCourseKeyRef = useRef(null);
  // Track if a course fetch is currently in progress to prevent duplicate parallel fetches
  const courseFetchInProgressRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, validateAuth } = useAuth();

  // **HELPER FUNCTION: Update course with progress data**
  const updateCourseWithProgress = (courseData, progressData) => {
    const updatedCourse = { ...courseData };
    
    if (progressData.chapters) {
      progressData.chapters.forEach(chapter => {
        const chapterIndex = updatedCourse.chapters.findIndex(c => c.title === chapter.name);
        if (chapterIndex !== -1) {
          chapter.lessons.forEach(lessonProgress => {
            const lessonIndex = updatedCourse.chapters[chapterIndex].lessons.findIndex(l => 
              String(l.id) === String(lessonProgress.id)
            );
            if (lessonIndex !== -1) {
              updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = !!lessonProgress.completed;
            }
          });
        }
      });
    }
    
    return updatedCourse;
  };

  // **HELPER FUNCTION: Fetch progress in background for logged-in users**
  const fetchProgressInBackground = async (courseIdToFetch, courseData, cacheKey) => {
    // Prevent duplicate progress fetches for the same course
    if (progressFetchedRef.current === courseIdToFetch) {
      console.log('⏭️ Skipping duplicate progress fetch for course:', courseIdToFetch);
      return;
    }
    progressFetchedRef.current = courseIdToFetch;
    setProgressLoading(true); // Show loading state for checkboxes
    
    try {
      await validateAuth();
      const progressResponse = await axiosInstance.get(`/courses/progress/${courseIdToFetch}/`);
      
      // Silently update progress without loading state
      setCourseProgress(progressResponse.data);
      if (progressResponse?.data?.progress) {
        setServerProgress(progressResponse.data.progress);
        // Also update percentage for UI
        const pct = progressResponse.data.progress.percentage ?? 0;
        setProgressPercent(pct);
      }
      
      // Check for certificate in response
      if (progressResponse.data?.certificate) {
        setCertificate(progressResponse.data.certificate);
      }
      
      // Update course with fresh progress
      const updatedCourse = updateCourseWithProgress(courseData, progressResponse.data);
      setCourse(updatedCourse);
      
      // Update cache with fresh data
      courseCache.set(cacheKey, {
        course: updatedCourse,
        progress: progressResponse.data
      });
      console.log('🔄 Background progress sync completed');
    } catch (error) {
      console.error('⚠️ Background progress sync failed (non-critical):', error);
      // Reset the ref so it can be retried
      progressFetchedRef.current = null;
      // Don't show error to user - cache is good enough
    } finally {
      setProgressLoading(false); // Hide loading state for checkboxes
    }
  };

  useEffect(() => {
    const localSearchParams = new URLSearchParams(location.search || '');
    const queryCourseId = localSearchParams.get('courseId');
    const resolvedCourseId = courseId || queryCourseId || loadedCourseIdRef.current;
    const currentCourseKey = buildCourseKey(resolvedCourseId, pathname);

    // Skip if we already have course data loaded for this key
    // IMPORTANT: Don't check `course` state here - it's stale in this closure!
    // Trust the ref which is updated synchronously when course is set.
    if (loadedCourseKeyRef.current === currentCourseKey) {
      return;
    }
    
    // Also skip if the course ID matches what we already loaded (handles URL param additions)
    if (loadedCourseIdRef.current && loadedCourseIdRef.current === resolvedCourseId) {
      // Update the key ref to prevent future checks
      loadedCourseKeyRef.current = currentCourseKey;
      return;
    }
    
    // CRITICAL: Skip if a fetch is already in progress for this course
    // This prevents React 18 Strict Mode double-mount from causing parallel fetches
    if (courseFetchInProgressRef.current === resolvedCourseId) {
      return;
    }
    
    // Mark fetch as in progress IMMEDIATELY (synchronously) before any async work
    courseFetchInProgressRef.current = resolvedCourseId;
    
    // Reset tracking refs when courseId changes
    fetchedLessonsRef.current = new Set();
    progressFetchedRef.current = null;
    
    // Extract URL path to determine course type and proper API endpoint
    const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // **IMPROVED CACHING STRATEGY**
        // 1. For guest users: Use cache freely (no progress to worry about)
        // 2. For logged-in users: Use cache if fresh, but always sync progress in background
        // IMPORTANT: Include auth state in cache key to prevent showing locked content after login
        const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
        const cachedData = courseCache.get(cacheKey);
        const isCacheFresh = courseCache.isFresh(cacheKey);
        
        // Use cache if available (for both guest and logged-in users)
        // Validate cache has proper structure before using
        if (cachedData && cachedData.course && cachedData.course.chapters && Array.isArray(cachedData.course.chapters)) {
          if (!isLoggedIn) {
            // Guest users: Use cache and stop (no progress to fetch)
            const keyToSet = buildCourseKey(cachedData.course.id, pathname);
            setCourse(cachedData.course);
            loadedCourseIdRef.current = cachedData.course.id; // Mark as loaded
            loadedCourseKeyRef.current = keyToSet;
            courseFetchInProgressRef.current = null; // Fetch complete
            setExpandedChapters(cachedData.course.chapters && cachedData.course.chapters.length > 0 ? { 0: true } : {});
            setLoading(false);
            return;
          } else if (isCacheFresh) {
            // Logged-in users with fresh cache: Use cache immediately for instant load
            // PREVIEW MODE: Ignore cached progress completely - just show content fast
            const keyToSet = buildCourseKey(cachedData.course.id, pathname);
            setCourse(cachedData.course);
            loadedCourseIdRef.current = cachedData.course.id; // Mark as loaded
            loadedCourseKeyRef.current = keyToSet;
            courseFetchInProgressRef.current = null; // Fetch complete
            // Show loading skeleton for checkboxes
            setProgressLoading(true);
            // DO NOT apply cached progress - show content immediately without ticks
            setExpandedChapters(cachedData.course.chapters && cachedData.course.chapters.length > 0 ? { 0: true } : {});
            setLoading(false);
            // Fetch progress in background
            const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + ':auth');
            setTimeout(() => fetchProgressInBackground(cachedData.course.id, cachedData.course, cacheKey), 100);
            return;
          } else {
            // Logged-in users with stale cache: Use cache to show content quickly
            // PREVIEW MODE: Ignore cached progress completely - just show content fast
            setCourse(cachedData.course);
            loadedCourseIdRef.current = cachedData.course.id; // Mark as loaded
            loadedCourseKeyRef.current = buildCourseKey(cachedData.course.id, pathname);
            courseFetchInProgressRef.current = null; // Fetch complete
            // Show loading skeleton for checkboxes
            setProgressLoading(true);
            // DO NOT apply cached progress - show content immediately without ticks
            setExpandedChapters(cachedData.course.chapters && cachedData.course.chapters.length > 0 ? { 0: true } : {});
            setLoading(false);
            // Fetch progress in background
            const staleCacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + ':auth');
            setTimeout(() => fetchProgressInBackground(cachedData.course.id, cachedData.course, staleCacheKey), 100);
            return; // Don't fetch fresh data - use cache as-is for speed
          }
        } else if (cachedData) {
          // Cache exists but has invalid structure - clear it
          courseCache.invalidate(cacheKey);
        }
        
        // Fetch fresh data from server
        await fetchRegularCourse(pathParts);
        
      } catch (error) {
        console.error('❌ Error fetching course data:', error);
        setError(error.message || 'Failed to load course data');
        setContentType('notFound');
      } finally {
        setLoading(false);
      }
    };
    
  const fetchRegularCourse = async (pathParts = pathname ? pathname.split('/').filter(Boolean) : []) => {
      try {
    // axiosInstance already prefixes with '/api' via its baseURL
        
        // Extract proper course type and ID from URL path
        let apiUrl;
        let isSchoolCourse = false;
        let response;
        // If a specific courseId is present in the query string, prefer fetching by ID
  const searchParams = new URLSearchParams(location.search || '');
  const selectedCourseId = searchParams.get('courseId');
        const grades = ['6th','7th','8th','9th','10th','11th','12th'];
        const hasGradeInPath = grades.some(g => pathParts.includes(g));

        // Support the generic ID-based learning route: /courses/:courseId/learning for both school and engineering
        if (!hasGradeInPath && courseId) {
          try {
            isSchoolCourse = true;
            apiUrl = `/courses/school/${courseId}/?structure_only=true`;
            console.log('🔍 Fetching school course structure by ID:', courseId);
            response = await axiosInstance.get(apiUrl);
            console.log('✅ School course fetched successfully');
          } catch (e) {
            // Fallback to engineering by ID if not a school course
            console.log('⚠️ Not a school course, trying engineering course by ID:', courseId);
            isSchoolCourse = false;
            apiUrl = `/courses/engineering/${courseId}/?structure_only=true`;
            try {
              response = await axiosInstance.get(apiUrl);
              console.log('✅ Engineering course fetched successfully');
            } catch (engError) {
              console.error('❌ Course not found in either school or engineering:', courseId);
              throw new Error(`Course with ID "${courseId}" not found. It may have been deleted or you may not have access to it.`);
            }
          }
        } else {
        
        // Check if it's a school course (e.g., /courses/6th/cbse/math/learning)
        if (hasGradeInPath) {
          isSchoolCourse = true;
          if (selectedCourseId) {
            apiUrl = `/courses/school/${selectedCourseId}/?structure_only=true`;
            console.log('🔍 Fetching school course structure by query courseId:', selectedCourseId);
          } else {
            // Strict ID-only mode: do not attempt subject/state fallbacks
            throw new Error('Missing courseId. Please start learning from the course page so we can lock to the correct course.');
          }
        } else {
          // Engineering course by path structure
          apiUrl = `/courses/engineering/${courseId}/?structure_only=true`;
        }

        if (!apiUrl) {
          throw new Error("Could not determine API URL from path");
        }
        console.log("🔍 Fetching course from API URL:", apiUrl);
        response = await axiosInstance.get(apiUrl);
        
        // Validate response
        if (!response || !response.data) {
          console.error('❌ Empty response from API');
          throw new Error('Server returned empty response. Please try again.');
        }
        console.log("📝 API Response status:", response.status);
        console.log("📝 API Response data:", response.data);
        }
        console.log("📝 Processing API Response:", response.data);
        let courseData;
        courseData = response.data;
          console.log("Fetched Course Data:", courseData);
        
        // Check if courseData is valid and has the expected structure
        if (!courseData || 
            (isSchoolCourse && (!courseData.chapters || !Array.isArray(courseData.chapters))) ||
            (!isSchoolCourse && (!courseData.sections || !Array.isArray(courseData.sections)))) {
          throw new Error("No course data found or course data is in an unexpected format");
        }
          
        // Transform sections or chapters into a consistent format for the sidebar
        const transformedCourse = {
          ...courseData,
          chapters: isSchoolCourse 
            ? courseData.chapters.map((chapter) => ({
                title: chapter.name,
                isLocked: !!chapter.is_locked,
                isPreview: !!chapter.is_preview,
                lessons: chapter.lessons.map((lesson) => ({
                  id: lesson.id,
                  title: lesson.title,
                  type: lesson.type,
                  videoUrl: lesson.video_url,
                  description: lesson.description,
                  aboutLesson: lesson.about_lesson || lesson.aboutLesson,
                  completed: lesson.completed || false,
                  isAIGenerated: false,
                  isLocked: !!lesson.is_locked,
                  isPreview: !!lesson.is_preview,
                  // Include quiz questions with both possible field names
                  quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                  quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                  // Include resources
                  resources: lesson.resources || { downloadable: [], internet: [] }
                })),
              }))
            : courseData.sections.map((section) => ({
                title: section.name,
                isLocked: !!section.is_locked,
                isPreview: !!section.is_preview,
                lessons: section.lessons.map((lesson) => ({
                  id: lesson.id,
                  title: lesson.title,
                  type: lesson.type,
                  videoUrl: lesson.video_url,
                  description: lesson.description,
                  aboutLesson: lesson.about_lesson || lesson.aboutLesson,
                  completed: lesson.completed || false,
                  isAIGenerated: false,
                  isLocked: !!lesson.is_locked,
                  isPreview: !!lesson.is_preview,
                  // Include quiz questions with both possible field names
                  quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                  quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                  // Include resources - they should now be properly grouped
                  resources: lesson.resources || { downloadable: [], internet: [] }
                })),
              }))
        };

        // Final validation before setting course
        if (!transformedCourse || !transformedCourse.chapters || transformedCourse.chapters.length === 0) {
          console.error('❌ Transformed course has no chapters:', transformedCourse);
          throw new Error('Course has no content available. Please contact support.');
        }
        
        console.log('✅ Course transformation complete. Chapters:', transformedCourse.chapters.length);
        
        // **OPTIMIZATION: Set course and stop loading IMMEDIATELY**
        // Don't wait for progress or first lesson details - show content fast!
        setCourse(transformedCourse);
        loadedCourseIdRef.current = transformedCourse.id; // Mark as loaded
        
        // For logged-in users, show skeleton for checkboxes until progress loads
        if (isLoggedIn) {
          setProgressLoading(true);
        }
        
        // CRITICAL: Set the key ref BEFORE navigate() to prevent race condition
        // We need to use the FINAL URL (with courseId param if it will be added)
        const willNormalize = isSchoolCourse && transformedCourse?.id && !new URLSearchParams(location.search || '').get('courseId');
        loadedCourseKeyRef.current = buildCourseKey(transformedCourse.id, pathname);
        courseFetchInProgressRef.current = null; // Fetch complete - clear in-progress flag
        
        setExpandedChapters({ 0: true });
        setLoading(false); // <-- CRITICAL: Stop loading spinner now!

        // If we loaded a school course by filters and we have its exact ID but the URL
        // lacks ?courseId, normalize the URL to an ID-locked variant to keep future
        // API calls ID-based and avoid ambiguity on refresh.
        if (willNormalize) {
          const params = new URLSearchParams(location.search || '');
          params.set('courseId', transformedCourse.id);
          navigate({ pathname, search: `?${params.toString()}` }, { replace: true });
        }
        
        // Cache course without progress for non-logged-in users
        const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
        courseCache.set(cacheKey, { course: transformedCourse });
        
        // Fetch progress in background for logged-in users AFTER showing content
        if (isLoggedIn && transformedCourse?.id) {
          // Small delay to ensure UI has rendered first
          setTimeout(() => {
            fetchProgressInBackground(transformedCourse.id, transformedCourse, cacheKey);
          }, 100);
        }
        
      } catch (error) {
        console.error('❌ Error fetching course data:', error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          pathname,
          courseId: searchParams.get('courseId')
        });
        
        // Clear fetch in progress flag on error
        courseFetchInProgressRef.current = null;
        
        // Clear potentially corrupted cache
        const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
        courseCache.invalidate(cacheKey);
        console.log('🗑️ Cleared cache due to error');
        
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to load course content';
        
        // Special handling for state board course errors
        const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
        const isStateBoard = pathParts.includes('state');
        if (isStateBoard) {
          const stateIndex = pathParts.indexOf('state');
          if (stateIndex !== -1 && stateIndex + 1 < pathParts.length) {
            const stateId = pathParts[stateIndex + 1];
            console.error(`⚠️ State board course error with state code: ${stateId}`);
            setError(`Unable to find courses for the specified state. Make sure state code "${stateId}" is correct.`);
            setCourse(null);
            setContentType('notFound');
            return;
          }
        }
        
        // Don't overwrite specific error messages
        setError(errorMessage);
        setCourse(null);
        setContentType('notFound');
      }
    };

    fetchData();
  }, [courseId, pathname, location.search]);

  // Progress fetching is now handled by fetchProgressInBackground called from the cache logic
  // This eliminates duplicate API calls. The fetchProgressInBackground function:
  // 1. Validates auth once
  // 2. Fetches progress once
  // 3. Updates course state with completion status
  // 4. Updates cache

  const handleIssueCertificate = async () => {
    if (!course?.id) return;
    if (!isLoggedIn) {
  universalToast.error('Please log in to claim your certificate');
      return;
    }
    // Navigate to the certificate page; it will issue if eligible
    navigate(`/courses/${course.id}/certificate`, { state: { courseTitle: course?.title } });
  };

  // Handle chapter toggling
  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Select a lesson
  const selectLesson = (chapterIndex, lessonIndex) => {
    setActiveChapter(chapterIndex);
    setActiveLesson(lessonIndex);
    setExpandedChapters(prev => ({
      ...prev,
      [chapterIndex]: true
    }));
    
    // Scroll to video on mobile
    // Always provide feedback by scrolling content area into view
    videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Mark lesson as complete (with backend integration)
  const markLessonComplete = async () => {
    if (!course) return;
    if (!isLoggedIn) {
  universalToast.error('Please log in to track your progress');
      return;
    }
    
    try {
      const currentLesson = course.chapters[activeChapter].lessons[activeLesson];
      
      // Don't mark if already completed
      if (currentLesson.completed) {
        return;
      }
      
      // Optimistic UI update for instant tick
      const updatedCourse = { ...course };
      updatedCourse.chapters[activeChapter].lessons[activeLesson].completed = true;
      setCourse(updatedCourse);

      if (currentLesson.id) {
        // Fire and then sync progress from server response
  const response = await axiosInstance.post(`/lessons/toggle-completion/${currentLesson.id}/`);
        const pct = response?.data?.progress?.percentage;
        const completed = response?.data?.progress?.completed;
        const total = response?.data?.progress?.total;
        if (typeof pct === 'number' && !Number.isNaN(pct)) {
          setProgressPercent(pct);
        }
        if (typeof completed === 'number' && typeof total === 'number') {
          setServerProgress({ completed, total, percentage: pct });
        }
        
        // **OPTIMIZATION: Update cache directly instead of invalidating**
        const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
        
        // Update cache with new course state
        courseCache.set(cacheKey, {
          course: updatedCourse,
          progress: {
            progress: { completed, total, percentage: pct },
            chapters: updatedCourse.chapters.map(ch => ({
              name: ch.title,
              lessons: ch.lessons.map(l => ({
                id: l.id,
                completed: l.completed
              }))
            }))
          }
        });
        console.log('💾 Cache updated with new completion status');

        // Notify other parts of the app (Learning Hub) so progress refreshes immediately
        try {
          const ev = new CustomEvent('learning:progress-updated', {
            detail: {
              courseId: course?.id,
              lessonId: currentLesson.id,
              percentage: pct,
              completed,
              total
            }
          });
          window.dispatchEvent(ev);
        } catch (_) {}
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      // keep optimistic completion; user can toggle off if needed
      universalToast.error('Failed to save progress. Please try again.');
    }
  };

  // Toggle lesson completion from sidebar
  const toggleLessonCompletion = async (chapterIndex, lessonIndex) => {
    if (!course) return;
    if (!isLoggedIn) {
  universalToast.error('Please log in to track your progress');
      return;
    }
    
    // Store the previous state for potential rollback
    const prevCourse = course;
    
    try {
      const lesson = course.chapters[chapterIndex].lessons[lessonIndex];
      const newCompletionState = !lesson.completed;

      // Optimistic UI update for instant feedback
      const updatedCourse = { ...course };
      updatedCourse.chapters = course.chapters.map((ch, idx) =>
        idx !== chapterIndex ? ch : { ...ch, lessons: ch.lessons.map((l, li) => li !== lessonIndex ? l : { ...l, completed: newCompletionState }) }
      );
      setCourse(updatedCourse);

      if (lesson.id) {
        const response = await axiosInstance.post(`/lessons/toggle-completion/${lesson.id}/`);
        // Sync server-computed progress to ensure certificate eligibility reflects correctly
        const pct = response?.data?.progress?.percentage;
        const completed = response?.data?.progress?.completed;
        const total = response?.data?.progress?.total;
        if (typeof pct === 'number' && !Number.isNaN(pct)) {
          setProgressPercent(pct);
        }
        if (typeof completed === 'number' && typeof total === 'number') {
          setServerProgress({ completed, total, percentage: pct });
        }
        
        // **OPTIMIZATION: Update cache directly with new state**
        const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
        courseCache.set(cacheKey, {
          course: updatedCourse,
          progress: {
            progress: { completed, total, percentage: pct },
            chapters: updatedCourse.chapters.map(ch => ({
              name: ch.title,
              lessons: ch.lessons.map(l => ({
                id: l.id,
                completed: l.completed
              }))
            }))
          }
        });
        console.log('💾 Cache updated with new completion status');
      }
    } catch (error) {
      console.error('Error toggling lesson completion:', error);
      // Revert optimistic update on error
      setCourse(prevCourse);
      universalToast.error('Failed to update lesson progress. Please try again.');
    }
  };

  // Navigate to next lesson
  const goToNextLesson = async () => {
    if (!course) return;
    
    // If not already completed, mark the lesson as complete
    const currentLesson = getCurrentLesson();
    if (!currentLesson.completed) {
      await markLessonComplete();
    }
    
    const currentChapter = course.chapters[activeChapter];
    
    if (activeLesson < currentChapter.lessons.length - 1) {
      // Move to next lesson in current chapter
      setActiveLesson(activeLesson + 1);
    } else if (activeChapter < course.chapters.length - 1) {
      // Move to first lesson of next chapter
      setActiveChapter(activeChapter + 1);
      setActiveLesson(0);
      setExpandedChapters(prev => ({
        ...prev,
        [activeChapter + 1]: true
      }));
    }
  };

  // Navigate to previous lesson
  const goToPrevLesson = () => {
    if (!course) return;
    
    if (activeLesson > 0) {
      setActiveLesson(activeLesson - 1);
    } else if (activeChapter > 0) {
      const prevChapter = course.chapters[activeChapter - 1];
      setActiveChapter(activeChapter - 1);
      setActiveLesson(prevChapter.lessons.length - 1);
      setExpandedChapters(prev => ({
        ...prev,
        [activeChapter - 1]: true
      }));
    }
  };

  // Get current lesson
  const getCurrentLesson = () => {
    if (!course || !course.chapters || !Array.isArray(course.chapters)) {
      return null;
    }
    
    const chapter = course.chapters[activeChapter];
    if (!chapter || !chapter.lessons || !Array.isArray(chapter.lessons)) {
      return null;
    }
    
    return chapter.lessons[activeLesson] || null;
  };

  // Filter lessons based on search
  const filteredChapters = () => {
    if (!course || !searchQuery.trim()) return course?.chapters;
    
    const query = searchQuery.toLowerCase();
    return course.chapters.map(chapter => {
      const filteredLessons = chapter.lessons.filter(lesson => 
        lesson.title.toLowerCase().includes(query)
      );
      return filteredLessons.length > 0 ? { ...chapter, lessons: filteredLessons } : null;
    }).filter(Boolean);
  };

  // Fetch full details for a specific lesson (lazy loading)
  const fetchLessonDetails = useCallback(async (lessonId, chapterIndex, lessonIndex) => {
    if (!lessonId) return;
    
    // Prevent duplicate fetches for the same lesson
    const lessonKey = `${lessonId}`;
    if (fetchedLessonsRef.current.has(lessonKey)) {
      console.log('⏭️ Skipping duplicate fetch for lesson:', lessonId);
      return;
    }
    fetchedLessonsRef.current.add(lessonKey);
    
    try {
      const response = await axiosInstance.get(`/lessons/${lessonId}/`);
      const lessonDetails = response.data;
      
      // Update the course state with the full lesson details
      setCourse(prevCourse => {
        const newCourse = { ...prevCourse };
        const chapter = newCourse.chapters[chapterIndex];
        const lessonBefore = chapter.lessons[lessonIndex];
        
        // Merge existing lesson data with new details
        newCourse.chapters[chapterIndex].lessons[lessonIndex] = {
          ...lessonBefore,
          ...lessonDetails,
          // Ensure we map backend fields to frontend expected fields
          videoUrl: lessonDetails.video_url,
          aboutLesson: lessonDetails.about_lesson,
          quizQuestions: lessonDetails.quiz_questions,
          // Ensure resources are properly formatted
          resources: lessonDetails.resources || { downloadable: [], internet: [] }
        };
        
        return newCourse;
      });
      
      // Update cache with the new details
      const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
      const cachedData = courseCache.get(cacheKey);
      if (cachedData && cachedData.course) {
        const newCachedCourse = { ...cachedData.course };
        if (newCachedCourse.chapters && newCachedCourse.chapters[chapterIndex]) {
           const cachedLesson = newCachedCourse.chapters[chapterIndex].lessons[lessonIndex];
           newCachedCourse.chapters[chapterIndex].lessons[lessonIndex] = {
             ...cachedLesson,
             ...lessonDetails,
             videoUrl: lessonDetails.video_url,
             aboutLesson: lessonDetails.about_lesson,
             quizQuestions: lessonDetails.quiz_questions,
             resources: lessonDetails.resources || { downloadable: [], internet: [] }
           };
           courseCache.set(cacheKey, { ...cachedData, course: newCachedCourse });
        }
      }
      
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      universalToast.error('Failed to load lesson content');
    }
  }, [pathname, location.search, isLoggedIn]);

  // Handle lesson click
  const handleLessonClick = (chapterIndex, lessonIndex) => {
    const lesson = course.chapters[chapterIndex].lessons[lessonIndex]; 
    // Debug information
    console.log('🎯 Lesson clicked:', lesson);
    
    // Gate access for locked lessons when user is not logged in
    if (!isLoggedIn && lesson.isLocked) {
      // Soft nudge; prevent navigation
      universalToast.info('Login to unlock this lesson');
      return;
    }
    
    // Lazy load lesson details if they are missing (aboutLesson is undefined in light serializer)
    // We check for undefined specifically, as empty string '' means it was fetched but is empty
    if (lesson.aboutLesson === undefined && lesson.id) {
      console.log('📥 Lazy loading lesson details for:', lesson.id);
      fetchLessonDetails(lesson.id, chapterIndex, lessonIndex);
    }
    
    // Only update state if we're actually changing lessons to prevent re-renders
    if (activeChapter !== chapterIndex || activeLesson !== lessonIndex) {
      setActiveChapter(chapterIndex);
      setActiveLesson(lessonIndex);
      setExpandedChapters(prev => ({
        ...prev,
        [chapterIndex]: true
      }));
    }
  };
  // Update content type based on current lesson type
  useEffect(() => {
    const currentLesson = getCurrentLesson();
    console.log('🎯 Current lesson for content type detection:', currentLesson);
    if (!currentLesson) return;

    // Prefer explicit type when present
    if (currentLesson.type) {
      console.log('🎮 Setting content type based on lesson type:', currentLesson.type);
      switch (currentLesson.type) {
        case 'quiz':
          setContentType('quiz');
          return;
        case 'reading':
        case 'instructions':
          setContentType('instructions');
          return;
        case 'resources':
          setContentType('resources');
          return;
        case 'video':
        default:
          // Fall through to heuristics in case videoUrl is missing
          break;
      }
    }

    // Heuristic fallback when type is missing or unreliable
    const hasVideo = Boolean(currentLesson.videoUrl && String(currentLesson.videoUrl).trim());
    const about = currentLesson.aboutLesson && String(currentLesson.aboutLesson).trim();
    const hasAbout = Boolean(about);
    console.log('[CONTENT-TYPE-META]', { hasVideo, hasAbout, type: currentLesson.type });
    const qlen = (currentLesson.quiz_questions || currentLesson.quizQuestions || []).length;
    const hasQuiz = qlen > 0;
    const res = currentLesson.resources || { downloadable: [], internet: [] };
    const hasResources = (Array.isArray(res.downloadable) && res.downloadable.length > 0) ||
                         (Array.isArray(res.internet) && res.internet.length > 0);

    if (hasQuiz) {
      setContentType('quiz');
      return;
    }
    if (hasResources) {
      setContentType('resources');
      return;
    }
    if (hasAbout && !hasVideo) {
      // Treat as reading/instructions when text exists but no video
      setContentType('instructions');
      return;
    }
    // Default: video
    setContentType('video');
  }, [activeChapter, activeLesson, course]);

  // Add effect to notify parent when sidebar visibility changes
  useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(sidebarVisible);
    }
  }, [sidebarVisible, onSidebarToggle]);

  // Effect to lazy load lesson details when active lesson changes
  // NOTE: We intentionally exclude `course` from dependencies to prevent re-triggers
  // when course state updates. Instead, we check course existence inside the effect.
  useEffect(() => {
    if (!course || !course.chapters) return;
    
    const chapter = course.chapters[activeChapter];
    if (!chapter || !chapter.lessons) return;
    
    const lesson = chapter.lessons[activeLesson];
    if (!lesson) return;
    
    // Check if already fetched to prevent triggering duplicate fetches
    const lessonKey = `${lesson.id}`;
    if (fetchedLessonsRef.current.has(lessonKey)) {
      console.log('⏭️ Skipping auto-fetch - already fetched:', lesson.id);
      return;
    }
    console.log('[AUTO-FETCH-CHECK]', {
      activeChapter,
      activeLesson,
      lessonId: lesson.id,
      aboutUndefined: lesson.aboutLesson === undefined,
      dedupHas: fetchedLessonsRef.current.has(lessonKey)
    });
    
    // Check if we need to fetch details (aboutLesson is undefined in light serializer)
    if (lesson.aboutLesson === undefined && lesson.id) {
      console.log('🔄 Auto-fetching details for active lesson:', lesson.id);
      fetchLessonDetails(lesson.id, activeChapter, activeLesson);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapter, activeLesson]);

  // Effect to fetch first lesson details when course initially loads
  // This handles the case where activeChapter and activeLesson are already 0 when course arrives
  useEffect(() => {
    // Only run when course first becomes available and loading is complete
    if (loading || !course || !course.chapters) return;
    
    const chapter = course.chapters[activeChapter];
    if (!chapter || !chapter.lessons) return;
    
    const lesson = chapter.lessons[activeLesson];
    if (!lesson) return;
    
    // Check if already fetched
    const lessonKey = `${lesson.id}`;
    if (fetchedLessonsRef.current.has(lessonKey)) {
      return;
    }
    
    // Fetch first lesson details if needed
    if (lesson.aboutLesson === undefined && lesson.id) {
      console.log('🚀 Initial load - fetching first lesson details:', lesson.id);
      fetchLessonDetails(lesson.id, activeChapter, activeLesson);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, course?.id]); // Triggers when loading completes AND course is available

  // Loading and error states
  if (loading) {
    return <CourseLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8">
        <div className="mb-6 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8">
        <div className="mb-6 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
        <p className="text-gray-600 text-center mb-6">The course you're looking for could not be found. It may have been removed or you might not have access to it.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  const currentLesson = getCurrentLesson();
  const isLessonLoading = currentLesson?.aboutLesson === undefined && !!currentLesson?.id;

  const completedLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.filter(l => l.completed).length, 0
  );
  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length, 0
  );
  // Display values: prefer server-computed to match certificate logic
  const displayCompleted = serverProgress?.completed ?? completedLessons;
  const displayTotal = serverProgress?.total ?? totalLessons;
  const displayPercent = typeof serverProgress?.percentage === 'number'
    ? serverProgress.percentage
    : (progressPercent || Math.round((displayCompleted / Math.max(1, displayTotal)) * 100));
  
  // Content rendering section in the return statement
  const renderContent = () => {
    if (loading) {
      return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
    }    if (contentType === 'notFound') {
      return (
        <div className="p-8 text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The content you're looking for could not be found. It may have been deleted or is unavailable."}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/learning-hub')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Learning Hub
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Browse Courses
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Disambiguation UI when multiple courses match subject-only URL (e.g., 1A vs 1B)
    if (contentType === 'disambiguate' && Array.isArray(disambiguationOptions)) {
      const chooseCourse = (id) => {
        // Navigate to same path with explicit courseId so we fetch exact course by UUID
        navigate(`${pathname}?courseId=${encodeURIComponent(id)}`);
      };
      return (
        <div className="p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Select the exact course</h2>
          <p className="text-gray-600 mb-6">We found multiple courses for this subject. Please choose one to continue.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disambiguationOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => chooseCourse(opt.id)}
                className="flex items-start gap-3 p-4 border rounded-lg hover:shadow transition bg-white text-left"
                aria-label={`Choose ${opt.title}`}
              >
                {opt.thumbnail ? (
                  <img src={opt.thumbnail} alt="thumbnail" className="w-16 h-16 rounded object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-gray-400">📘</div>
                )}
                <div>
                  <div className="font-semibold text-gray-900 line-clamp-2">{opt.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {(opt.class_level || '').toString()} • {(opt.board || '').toString()}
                    {opt.board?.toLowerCase() === 'state' && opt.state ? ` • ${opt.state}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6">
            <button onClick={() => navigate('/courses')} className="text-sm text-gray-600 hover:text-gray-800 underline">Back to Courses</button>
          </div>
        </div>
      );
    }

    switch (contentType) {
      case 'resources':
        return <ResourcesPage lessonResources={currentLesson?.resources} isLoading={isLessonLoading} />; 

      case 'quiz':
        // Render quiz content
        const quizData = {
          title: currentLesson?.title || 'Quiz',
          description: currentLesson?.description || 'Test your knowledge',
          timeLimit: '15 minutes',
          totalQuestions: currentLesson?.quiz_questions?.length || currentLesson?.quizQuestions?.length || 0,
          passingScore: 80,
          attempts: 'Unlimited',
          questions: currentLesson?.quiz_questions || currentLesson?.quizQuestions || [],
          instructions: [
            'Read each question carefully before selecting your answer',
            'You can change your answers before submitting',
            'Make sure to answer all questions before submitting',
            'You need 80% or higher to pass this quiz'
          ]
        };
        return <QuizIntro quizData={quizData} lessonId={currentLesson?.id} isLoading={isLessonLoading} />; 
        
      case 'instructions':
      case 'reading':
        return <InstructionsPage lessonContent={currentLesson} isLoading={isLessonLoading} />;
        
      case 'video':
      default:
        return (
          <>
            {/* Video Container */}
            <div className="mb-8">
              <div ref={videoRef} className="mb-6">
                <LessonVideo 
                  videoUrl={currentLesson?.videoUrl} 
                  title={currentLesson?.title}
                  locked={!isLoggedIn && (currentLesson?.isLocked === true)}
                />
              </div>
                {/* Content Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'about'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'resources'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Resources
                  </button>
                </nav>
              </div>
                {/* Tab Content */}
              <div className="mb-8">                {activeTab === 'about' && (
                  <div className="prose prose-lg max-w-none markdown-body">                    {isLessonLoading ? (
                      <div className="animate-pulse space-y-4 p-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mt-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    ) : currentLesson?.aboutLesson ? (
                      // Use actual lesson content if available with proper markdown components
                      <div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />,
                            li: ({node, children, ...props}) => {
                              // Skip rendering empty list items
                              if (!children || (Array.isArray(children) && children.length === 0) || 
                                  (typeof children === 'string' && children.trim() === '')) {
                                return null;
                              }
                              return <li className="ml-2 my-1" {...props}>{children}</li>;
                            },
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-bold my-3" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-base font-bold my-2" {...props} />,
                            h5: ({node, ...props}) => <h5 className="text-sm font-bold my-2" {...props} />,
                            h6: ({node, ...props}) => <h6 className="text-xs font-bold my-2" {...props} />,
                            p: ({node, children, ...props}) => {
                              // Skip rendering empty paragraphs
                              if (!children || (Array.isArray(children) && children.length === 0) || 
                                  (typeof children === 'string' && children.trim() === '')) {
                                return null;
                              }
                              // Enhanced paragraph handling for plain text with line breaks
                              return <p className="my-3 leading-relaxed" {...props}>{children}</p>;
                            },
                            // Add table rendering components
                            table: ({node, ...props}) => <table className="min-w-full border border-gray-200 my-4" {...props} />,
                            thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-gray-50" {...props} />,
                            th: ({node, ...props}) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border border-gray-200" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-2 text-sm text-gray-500 border border-gray-200" {...props} />,
                            code: ({node, inline, className, children, ...props}) => {
                              if (inline) {
                                return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                              }
                              return (
                                <div className="bg-gray-800 rounded-md my-4">
                                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                                    <span className="text-xs text-gray-400">code</span>
                                  </div>
                                  <pre className="p-4 overflow-x-auto">
                                    <code className="text-green-400 text-sm" {...props}>{children}</code>
                                  </pre>
                                </div>
                              )
                            },
                            pre: ({node, children, ...props}) => {
                              // Return children directly to let code component handle styling
                              return <>{children}</>;
                            },
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,                            hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                          }}
                        >
                          {preprocessLatex(currentLesson.aboutLesson)}
                        </ReactMarkdown>
                      </div>
                    ) : currentLesson?.description ? (
                      // Fallback to description if aboutLesson is not available
                      <div>
                        <h3 className="text-lg font-semibold mb-4">About This Lesson</h3>
                        <p className="text-gray-700 mb-4">{currentLesson.description}</p>
                        
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">What you'll learn:</h4>
                            <ul className="list-disc pl-5 space-y-2 text-gray-700">
                              <li>Understanding the core concepts of {currentLesson.title}</li>
                              <li>Practical applications and real-world examples</li>
                              <li>Best practices and common techniques</li>
                              <li>Key takeaways for your learning journey</li>
                            </ul>
                          </div>
                      </div>                    ) : (                      // Simple message when no content is provided
                      <div>
                        <h3 className="text-lg font-semibold mb-4">About This Lesson</h3>
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-500">No description is available for this lesson.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'resources' && (
                  <ResourcesPage lessonResources={currentLesson?.resources} isLoading={isLessonLoading} />
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button 
                  className={`px-6 py-3 rounded-lg border font-medium flex items-center ${
                    activeChapter === 0 && activeLesson === 0 
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors'
                  }`}
                  onClick={goToPrevLesson}
                  disabled={activeChapter === 0 && activeLesson === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Previous Lesson
                </button>
                
                <button 
                  className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                    savingProgress ? 'bg-gray-400 cursor-not-allowed' : 
                    'bg-indigo-600 hover:bg-indigo-700 transition-colors'
                  } text-white`}
                  onClick={goToNextLesson}
                  disabled={savingProgress}
                >
                  {savingProgress ? (
                    <>
                      <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      {currentLesson?.completed ? "Next Lesson" : "Mark as Complete"}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  // In the return statement, remove the footer and adjust the layout:
  return (
    <div className="min-h-screen flex bg-white">
      {/* Main Content Area - Professional Layout */}
      <div className="flex-1 flex flex-col">
        {/* Content Container - Clean spacing */}
        <div className={`transition-all duration-300 ${sidebarVisible ? 'mr-[400px]' : ''}`}>
          <div className="p-6 w-full">
            {loading ? (
              <CourseLoadingSkeleton />
            ) : error ? (
              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600">{error}</p>
              </div>
            ) : course ? (
              <>
                {/* Dynamic Content */}
                {renderContent()}
              </>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No course data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className={`fixed top-32 z-40 h-12 w-8 shadow-md rounded-l-lg flex items-center justify-center border border-r-0 transition-all duration-300 ease-in-out ${
          sidebarVisible 
            ? 'right-[400px] bg-white border-gray-200 hover:bg-gray-50' 
            : 'right-0 bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
        }`}
        aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarVisible ? 
          <FaChevronRight className="w-4 h-4 text-gray-600" /> : 
          <FaChevronLeft className="w-4 h-4 text-white" />
        }
      </button>

      {/* Sidebar - Professional design */}
      <div 
        className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-[400px] bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-30 ${
          sidebarVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Sidebar
          isSidebarOpen={sidebarVisible}
          course={course}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          expandedChapters={expandedChapters}
          activeChapter={activeChapter}
          activeLesson={activeLesson}
          handleLessonClick={handleLessonClick}
          completedLessons={displayCompleted}
          totalLessons={displayTotal}
          toggleChapter={toggleChapter}
          toggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          toggleLessonCompletion={toggleLessonCompletion}
          navigate={navigate}
          isLoggedIn={isLoggedIn}
          progressLoading={progressLoading && isLoggedIn}
          progressPercent={displayPercent}
          certificate={certificate}
          issuingCert={issuingCert}
          onIssueCertificate={handleIssueCertificate}
        />
      </div>
    </div>
  );
};

export default CourseLearning;
