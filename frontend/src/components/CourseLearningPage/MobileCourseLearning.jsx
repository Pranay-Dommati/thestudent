import React, { useState, useEffect, useRef, useCallback } from 'react';
import logger from '../../utils/logger';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaList, FaTimes, FaPlay, FaCheck, FaBook, FaQuestionCircle, FaDownload, FaGlobe, FaArrowLeft, FaLock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import LessonVideo from './LessonVideo';
import ResourcesPage from './templ/ResourcesPage';
import QuizIntro from './templ/QuizIntro';
import InstructionsPage from './templ/InstructionsPage';
import axiosInstance from '../../utils/axios';
import universalToast from '../../utils/universalToast';
import courseCache from '../../utils/courseCache';
import { useAuth } from '../../context/AuthContext';
import MobileCourseLoadingSkeleton from './MobileCourseLoadingSkeleton';
import preprocessLatex from '../../utils/latexPreprocessor';

const buildCourseKey = (id, path) => (id ? `course:${id}` : `path:${path || ''}`);

const MobileCourseLearning = ({ courseId, pathname, onSidebarToggle }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeTab, setActiveTab] = useState('about');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false); // Default closed on mobile
  const [contentType, setContentType] = useState('video');
  const [courseProgress, setCourseProgress] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false); // Default to false since we lazy load
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const videoRef = useRef(null);
  const listRef = useRef(null);
  const chapterRefs = useRef([]);
  // Track which lessons have been fetched to avoid duplicate API calls
  const fetchedLessonsRef = useRef(new Set());
  // Track if progress has been fetched for this course to avoid duplicate calls
  const progressFetchedRef = useRef(null);
  // Track the currently loaded course ID to prevent re-fetching on URL changes
  const loadedCourseIdRef = useRef(null);
  const loadedCourseKeyRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // Fetch full details for a specific lesson (lazy loading)
  const fetchLessonDetails = useCallback(async (lessonId, chapterIndex, lessonIndex) => {
    if (!lessonId) return;
    
    // Prevent duplicate fetches for the same lesson
    const lessonKey = `${lessonId}`;
    if (fetchedLessonsRef.current.has(lessonKey)) {
      logger.log('⏭️ Skipping duplicate fetch for lesson:', lessonId);
      return;
    }
    fetchedLessonsRef.current.add(lessonKey);
    
    try {
      const response = await axiosInstance.get(`/lessons/${lessonId}/`);
      const lessonDetails = response.data;
      
      // Update the course state with the full lesson details
      setCourse(prevCourse => {
        if (!prevCourse) return prevCourse;
        const newCourse = { ...prevCourse };
        
        if (newCourse.chapters && newCourse.chapters[chapterIndex]) {
          const chapter = newCourse.chapters[chapterIndex];
          if (chapter.lessons && chapter.lessons[lessonIndex]) {
            const lesson = chapter.lessons[lessonIndex];
            
            // Merge existing lesson data with new details
            newCourse.chapters[chapterIndex].lessons[lessonIndex] = {
              ...lesson,
              ...lessonDetails,
              // Ensure we map backend fields to frontend expected fields
              videoUrl: lessonDetails.video_url,
              aboutLesson: lessonDetails.about_lesson,
              quizQuestions: lessonDetails.quiz_questions,
              // Ensure resources are properly formatted
              resources: lessonDetails.resources || { downloadable: [], internet: [] }
            };
          }
        }
        
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
      logger.error('Error fetching lesson details:', error);
      // Don't show toast for background fetches to avoid spamming user
    }
  }, [pathname, location.search, isLoggedIn]);

  // Effect to lazy load lesson details when navigating between lessons
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
      return;
    }
    
    // Check if we need to fetch details (aboutLesson is undefined in light serializer)
    if (lesson.aboutLesson === undefined && lesson.id) {
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
      fetchLessonDetails(lesson.id, activeChapter, activeLesson);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, course?.id]); // Triggers when loading completes AND course is available

  // Reuse the same course fetching logic from the desktop version
  useEffect(() => {
    const localSearchParams = new URLSearchParams(location.search || '');
    const queryCourseId = localSearchParams.get('courseId');
    const resolvedCourseId = courseId || queryCourseId || loadedCourseIdRef.current;
    const currentCourseKey = buildCourseKey(resolvedCourseId, pathname);

    // Skip if we already have course data loaded for this key
    // IMPORTANT: Don't check `course` state here - it's stale in this closure!
    // Trust the ref which is updated synchronously when course is set.
    if (loadedCourseKeyRef.current === currentCourseKey) {
      logger.log('⏭️ Skipping fetch - course already loaded for key:', currentCourseKey);
      return;
    }
    
    // Also skip if the course ID matches what we already loaded (handles URL param additions)
    if (loadedCourseIdRef.current && loadedCourseIdRef.current === resolvedCourseId) {
      logger.log('⏭️ Skipping fetch - course ID already loaded:', resolvedCourseId);
      // Update the key ref to prevent future checks
      loadedCourseKeyRef.current = currentCourseKey;
      return;
    }
    
    // Reset tracking refs when courseId changes
    fetchedLessonsRef.current = new Set();
    progressFetchedRef.current = null;
    
    const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // **IMPROVED CACHING STRATEGY FOR MOBILE**
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
            logger.log('📱 Guest user - using cached course data');
            setCourse(cachedData.course);
            loadedCourseIdRef.current = cachedData.course.id;
            loadedCourseKeyRef.current = buildCourseKey(cachedData.course.id, pathname);
            setExpandedChapters(cachedData.course.chapters && cachedData.course.chapters.length > 0 ? { 0: true } : {});
            setLoading(false);
            return;
          } else if (isCacheFresh) {
            // Logged-in users with fresh cache: Use cache immediately for instant load
            // PREVIEW MODE: Ignore cached progress completely - just show content fast
            logger.log('📱 Logged in user - using fresh cache for instant load (Preview Mode)');
            setCourse(cachedData.course);
            loadedCourseIdRef.current = cachedData.course.id;
            loadedCourseKeyRef.current = buildCourseKey(cachedData.course.id, pathname);
            // DO NOT apply cached progress - show content immediately without ticks
            setExpandedChapters(cachedData.course.chapters && cachedData.course.chapters.length > 0 ? { 0: true } : {});
            setLoading(false);
            return;
          } else {
            // Logged-in users with stale cache: Use cache to show content quickly
            // PREVIEW MODE: Ignore cached progress completely - just show content fast
            logger.log('📱 Logged in user - using stale cache for instant load (Preview Mode)');
            setCourse(cachedData.course);
            loadedCourseIdRef.current = cachedData.course.id;
            loadedCourseKeyRef.current = buildCourseKey(cachedData.course.id, pathname);
            // DO NOT apply cached progress - show content immediately without ticks
            setExpandedChapters(cachedData.course.chapters && cachedData.course.chapters.length > 0 ? { 0: true } : {});
            setLoading(false);
            return; // Don't fetch fresh data - use cache as-is for speed
          }
        } else if (cachedData) {
          // Cache exists but has invalid structure - clear it
          logger.warn('⚠️ Cached data has invalid structure, clearing cache');
          courseCache.invalidate(cacheKey);
        }
        
        // Fetch fresh data from server
        await fetchRegularCourse(pathParts);
      } catch (error) {
        logger.error('❌ Error fetching course data:', error);
        setError(error.message || 'Failed to load course data');
        setContentType('notFound');
      } finally {
        setLoading(false);
      }
    };
    
  const fetchRegularCourse = async (pathParts = pathname ? pathname.split('/').filter(Boolean) : []) => {
    try {
      let apiUrl = null;
      let isSchoolCourse = false;
      const searchParams = new URLSearchParams(location.search || '');
      const selectedCourseId = searchParams.get('courseId');
      const hasGradeInPath = ['6th','7th','8th','9th','10th','11th','12th'].some(g => pathParts.includes(g));

      if (hasGradeInPath) {
        if (!selectedCourseId) {
          throw new Error('Missing courseId. Please use Start Learning from the course page to lock to the exact course.');
        }
        isSchoolCourse = true;
        apiUrl = `/courses/school/${selectedCourseId}/?structure_only=true`;
      } else if (pathParts.includes('engineering')) {
        apiUrl = `/courses/engineering/${courseId}/?structure_only=true`;
      } else {
        if (!courseId) throw new Error('Missing courseId in URL.');
        // Try school first, then engineering by ID
        try {
          isSchoolCourse = true;
          apiUrl = `/courses/school/${courseId}/?structure_only=true`;
          await axiosInstance.get(apiUrl); // probe existence
        } catch {
          isSchoolCourse = false;
          apiUrl = `/courses/engineering/${courseId}/?structure_only=true`;
        }
      }

      if (!apiUrl) throw new Error('Could not determine API URL from path');

      const response = await axiosInstance.get(apiUrl);
      const courseData = response.data;

      if (!courseData || (!courseData.chapters && !courseData.sections)) {
        throw new Error('No course data found or unexpected format');
      }

      const transformedCourse = {
        id: courseData.id,
        title: courseData.title || courseData.name,
        description: courseData.description,
        instructor: courseData.instructor,
        chapters: courseData.chapters
          ? courseData.chapters.map((chapter) => ({
              title: chapter.name,
              isLocked: !!(chapter.is_locked || chapter.isLocked),
              lessons: chapter.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                videoUrl: lesson.video_url,
                description: lesson.description,
                aboutLesson: lesson.about_lesson || lesson.aboutLesson,
                completed: lesson.completed || false,
                isAIGenerated: false,
                quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                resources: lesson.resources || { downloadable: [], internet: [] },
                isLocked: !!(lesson.is_locked || lesson.isLocked),
              })),
            }))
          : courseData.sections.map((section) => ({
              title: section.name,
              isLocked: !!(section.is_locked || section.isLocked),
              lessons: section.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                videoUrl: lesson.video_url,
                description: lesson.description,
                aboutLesson: lesson.about_lesson || lesson.aboutLesson,
                completed: lesson.completed || false,
                isAIGenerated: false,
                quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                resources: lesson.resources || { downloadable: [], internet: [] },
                isLocked: !!(lesson.is_locked || lesson.isLocked),
              })),
            })),
      };

        setCourse(transformedCourse);
        loadedCourseIdRef.current = transformedCourse.id; // Mark as loaded
        loadedCourseKeyRef.current = buildCourseKey(transformedCourse.id, pathname);
      if (transformedCourse.chapters.length > 0) {
        setExpandedChapters({ 0: true });
        setActiveChapter(0);
        setActiveLesson(0);
      }
      
      // **OPTIMIZATION: Set loading to false IMMEDIATELY**
      // Don't wait for first lesson details - show content fast!
      setLoading(false);
      
      const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
      courseCache.set(cacheKey, { course: transformedCourse });
      logger.log('💾 Mobile: Course data cached for faster future loads');
    } catch (error) {
      logger.error('❌ Error fetching course data:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load course content';
      setError(errorMessage);
      setCourse(null);
      setContentType('notFound');
    }
  };

    fetchData();
  }, [courseId, pathname, location.search]);

  // Progress tracking logic (reused from desktop)
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!isLoggedIn) {
        setProgressLoading(false);
        return;
      }
      if (!course || !course.id) return;
      
      // Prevent duplicate progress fetches for the same course
      if (progressFetchedRef.current === course.id) {
        logger.log('⏭️ Mobile: Skipping duplicate progress fetch for course:', course.id);
        setProgressLoading(false);
        return;
      }
      progressFetchedRef.current = course.id;
      
      // Only show loading if we don't have progress data yet
      if (!courseProgress) {
        setProgressLoading(true);
      }
      
      try {
        const response = await axiosInstance.get(`/courses/progress/${course.id}/`);
        setCourseProgress(response.data);
        
        setCourse(prevCourse => {
          if (!prevCourse) return prevCourse;
          const updatedCourse = {...prevCourse};
          
          if (response.data.chapters) {
            response.data.chapters.forEach(chapter => {
              const chapterIndex = updatedCourse.chapters.findIndex(c => c.title === chapter.name);
              if (chapterIndex !== -1) {
                chapter.lessons.forEach(lessonProgress => {
                  const lessonIndex = updatedCourse.chapters[chapterIndex].lessons.findIndex(l => 
                    l.title === lessonProgress.title
                  );
                  if (lessonIndex !== -1) {
                    updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = lessonProgress.completed;
                  }
                });
              }
            });
          } else if (response.data.sections) {
            response.data.sections.forEach(section => {
              const sectionIndex = updatedCourse.chapters.findIndex(c => c.title === section.name);
              if (sectionIndex !== -1) {
                section.lessons.forEach(lessonProgress => {
                  const lessonIndex = updatedCourse.chapters[sectionIndex].lessons.findIndex(l => 
                    l.title === lessonProgress.title
                  );
                  if (lessonIndex !== -1) {
                    updatedCourse.chapters[sectionIndex].lessons[lessonIndex].completed = lessonProgress.completed;
                  }
                });
              }
            });
          }
          return updatedCourse;
        });
        
        // Update cache with progress data
        // We use the latest course state from the closure if available, but it might be slightly stale regarding lesson details.
        // However, for progress sync, the critical part is the progress data.
        const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
        // We can't easily get the *result* of the functional update above to put in cache.
        // But we can update the progress part of the cache.
        const cachedData = courseCache.get(cacheKey);
        if (cachedData && cachedData.course) {
             courseCache.set(cacheKey, { 
              course: cachedData.course, // Keep existing cached course (which might have details)
              progress: response.data 
            });
        }
        console.log('💾 Mobile: Updated cache with progress data');
        
      } catch (error) {
        logger.error('❌ Error fetching user progress:', error);
      } finally {
        setProgressLoading(false);
      }
    };

    // TEMPORARILY DISABLED FOR PERFORMANCE - PREVIEW MODE STYLE LOADING
    // fetchUserProgress();
  }, [isLoggedIn, course?.id, pathname]);

  // Navigation helpers
  const handleLessonClick = (chapterIndex, lessonIndex) => {
    const lesson = course.chapters[chapterIndex]?.lessons[lessonIndex];
    // Block navigation to locked lessons for guests
    if (lesson?.isLocked && !isLoggedIn) {
      universalToast.info('Log in to access this lesson');
      return;
    }

    // Lazy load lesson details if they are missing
    if (lesson.aboutLesson === undefined && lesson.id) {
      fetchLessonDetails(lesson.id, chapterIndex, lessonIndex);
    }

    setActiveChapter(chapterIndex);
    setActiveLesson(lessonIndex);
    
    if (lesson?.type === 'quiz') {
      setContentType('quiz');
    } else if (lesson?.type === 'instructions' || lesson?.type === 'reading') {
      setContentType('instructions');
    } else {
      setContentType('video');
    }
    setActiveTab('about');
  };

  // Keep contentType in sync with the currently selected lesson (parity with desktop)
  useEffect(() => {
    if (!course || !course.chapters || course.chapters.length === 0) return;
    const lesson = course.chapters[activeChapter]?.lessons?.[activeLesson];
    if (!lesson) return;

    const rawType = typeof lesson.type === 'string' ? lesson.type.toLowerCase() : '';
    let derivedType = rawType;

    // Heuristics if type is missing or ambiguous
    if (!derivedType) {
      if (lesson.quiz_questions?.length || lesson.quizQuestions?.length) derivedType = 'quiz';
      else if (lesson.resources && !lesson.videoUrl) derivedType = 'resources';
      else if (lesson.aboutLesson && !lesson.videoUrl) derivedType = 'instructions';
      else derivedType = 'video';
    }

    switch (derivedType) {
      case 'quiz':
        setContentType('quiz');
        break;
      case 'reading':
      case 'instructions':
        setContentType('instructions');
        break;
      case 'resources':
        setContentType('resources');
        break;
      default:
        setContentType('video');
        break;
    }
  }, [course, activeChapter, activeLesson]);

  const toggleChapter = (chapterIndex) => {
    const isExpanding = !expandedChapters[chapterIndex];
    setExpandedChapters(prev => ({
      ...prev,
      [chapterIndex]: !prev[chapterIndex]
    }));
    
    if (isExpanding) {
      // Use requestAnimationFrame to ensure DOM update is complete
      requestAnimationFrame(() => {
        setTimeout(() => {
          const container = listRef.current;
          const target = chapterRefs.current[chapterIndex];
          if (container && target) {
            container.scrollTo({
              top: target.offsetTop,
              behavior: 'smooth'
            });
          }
        }, 350);
      });
    }
  };

  const toggleLessonCompletion = async (chapterIndex, lessonIndex) => {
    if (!isLoggedIn) {
  universalToast.error('Please log in to track your progress');
      return;
    }

    const lesson = course.chapters[chapterIndex]?.lessons[lessonIndex];
    if (!lesson) return;
    if (lesson.isLocked) {
      universalToast.info('This lesson is locked');
      return;
    }

    // Store previous state for potential rollback
    const prevCourse = course;
    setSavingProgress(true);

    // Optimistic UI update
    const updatedCourse = { ...course };
    updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = !lesson.completed;
    setCourse(updatedCourse);

    try {
      if (lesson.id) {
        const response = await axiosInstance.post(`/lessons/toggle-completion/${lesson.id}/`);
        
        // **FIX: Invalidate cache after successful completion toggle**
        const cacheKey = courseCache.generateKey((pathname || '') + (location.search || '') + (isLoggedIn ? ':auth' : ':guest'));
        courseCache.invalidate(cacheKey);
        console.log('🗑️ Mobile: Cache invalidated after lesson completion toggle');
        
        // **FIX: Update cache with new course state**
        const pct = response?.data?.progress?.percentage;
        const completed = response?.data?.progress?.completed;
        const total = response?.data?.progress?.total;
        
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
        console.log('💾 Mobile: Cache updated with new completion status');
      }
    } catch (error) {
      logger.error('❌ Error updating lesson completion:', error);
      universalToast.error('Failed to update lesson progress');
      // Revert optimistic change on failure
      setCourse(prevCourse);
    } finally {
      setSavingProgress(false);
    }
  };

  const navigateToLesson = (direction) => {
    const totalLessons = course.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
    let currentIndex = 0;
    
    for (let i = 0; i < activeChapter; i++) {
      currentIndex += course.chapters[i].lessons.length;
    }
    currentIndex += activeLesson;
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0 || newIndex >= totalLessons) return;
    
    let newChapter = 0;
    let newLesson = newIndex;
    
    for (let i = 0; i < course.chapters.length; i++) {
      if (newLesson < course.chapters[i].lessons.length) {
        newChapter = i;
        break;
      }
      newLesson -= course.chapters[i].lessons.length;
      newChapter++;
    }
    
    handleLessonClick(newChapter, newLesson);
  };

  // Get current lesson
  const currentLesson = course?.chapters[activeChapter]?.lessons[activeLesson];
  const currentChapter = course?.chapters[activeChapter];
  
  // Check if lesson details are loading
  const isLessonLoading = currentLesson?.aboutLesson === undefined && !!currentLesson?.id;

  // Calculate progress
  const completedLessons = course ? course.chapters.reduce((total, chapter) => 
    total + chapter.lessons.filter(lesson => lesson.completed).length, 0
  ) : 0;
  const totalLessons = course ? course.chapters.reduce((total, chapter) => 
    total + chapter.lessons.length, 0
  ) : 0;

  const renderContent = () => {
    if (!currentLesson) {
      return (
        <div className="p-4 text-center">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-4 text-sm">{error || "The content you're looking for could not be found."}</p>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => navigate('/learning-hub')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Go to Learning Hub
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Browse Courses
            </button>
          </div>
        </div>
      );
    }

    // For guests, show lock overlay instead of content for locked lessons
    if (currentLesson?.isLocked && !isLoggedIn) {
      const returnTo = encodeURIComponent((location?.pathname || '') + (location?.search || ''));
      return (
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FaLock className="w-7 h-7 text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">This lesson is locked</h2>
          <p className="text-sm text-gray-600 mb-4">Log in to access the full course content.</p>
          <button
            onClick={() => navigate(`/auth?returnTo=${returnTo}`)}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Log in
          </button>
        </div>
      );
    }

    switch (contentType) {
      case 'resources':
        return <ResourcesPage lessonResources={currentLesson?.resources} />; 

      case 'quiz':
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
        return <QuizIntro quizData={quizData} lessonId={currentLesson?.id} />; 
        
      case 'instructions':
      case 'reading':
        if (isLessonLoading) {
          return (
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-100 rounded w-3/4 mb-6"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-11/12"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          );
        }
        return <InstructionsPage lessonContent={currentLesson} />;
        
      case 'video':
      default:
        return (
          <div className="pb-12"> {/* Reduced padding for compact navigation */}
            {/* Video Container - Full width, no padding */}
            <div className="mb-3">
              <div ref={videoRef} className="mb-3">
                <LessonVideo 
                  videoUrl={currentLesson?.videoUrl} 
                  title={currentLesson?.title}
                />
              </div>
              
              {/* Content Tabs - Mobile optimized */}
              <div className="border-b border-gray-200 mb-3 px-3">
                <nav className="flex space-x-6">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'about'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'resources'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    Resources
                  </button>
                </nav>
              </div>
              
              {/* Tab Content - Compact padding */}
              <div className="px-3">
                {activeTab === 'about' && (
                  <div className="prose prose-sm max-w-none break-words overflow-wrap-anywhere">
                    {isLessonLoading ? (
                      <div className="animate-pulse space-y-3 py-2">
                        <div className="h-5 bg-gray-100 rounded w-1/3 mb-4"></div>
                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-100 rounded w-full mt-4"></div>
                        <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                      </div>
                    ) : currentLesson?.aboutLesson ? (
                      <div className="break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1 break-words" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1 break-words" {...props} />,
                            li: ({node, children, ...props}) => {
                              if (!children || (Array.isArray(children) && children.length === 0) || 
                                  (typeof children === 'string' && children.trim() === '')) {
                                return null;
                              }
                              return <li className="ml-1 my-1 break-words" {...props}>{children}</li>;
                            },
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2 break-words" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold my-2 break-words" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold my-2 break-words" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-sm font-bold my-1 break-words" {...props} />,
                            p: ({node, children, ...props}) => {
                              if (!children || (Array.isArray(children) && children.length === 0) || 
                                  (typeof children === 'string' && children.trim() === '')) {
                                return null;
                              }
                              return <p className="my-2 leading-relaxed text-sm break-words overflow-wrap-anywhere" {...props}>{children}</p>;
                            },
                            table: ({node, ...props}) => (
                              <div className="overflow-x-auto my-4 -mx-3 px-3 bg-white rounded-lg shadow-sm">
                                <div className="min-w-max">
                                  <table className="w-full border-collapse border border-gray-300 text-sm bg-white rounded-lg overflow-hidden" {...props} />
                                </div>
                                {/* Custom scrollbar indicator */}
                                <div className="flex justify-center mt-2 text-xs text-gray-400">
                                  <span className="bg-gray-100 px-2 py-1 rounded-full">← Scroll horizontally →</span>
                                </div>
                              </div>
                            ),
                            th: ({node, ...props}) => <th className="px-3 py-2 text-left text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 whitespace-nowrap" {...props} />,
                            td: ({node, ...props}) => <td className="px-3 py-2 text-sm text-gray-700 border border-gray-300 whitespace-nowrap" {...props} />,
                            code: ({node, inline, className, children, ...props}) => {
                              if (inline) {
                                return <code className="bg-gray-100 px-1 py-0.5 rounded text-xs break-words" {...props}>{children}</code>
                              }
                              return (
                                <div className="bg-white border border-gray-300 rounded-lg my-4 overflow-x-auto -mx-3 shadow-sm">
                                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                                    Code
                                  </div>
                                  <pre className="p-3 bg-gray-800">
                                    <code className="text-green-400 text-sm whitespace-pre" {...props}>{children}</code>
                                  </pre>
                                  <div className="flex justify-center py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
                                    <span className="bg-gray-100 px-2 py-1 rounded-full">← Scroll horizontally →</span>
                                  </div>
                                </div>
                              )
                            },
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic text-gray-600 text-sm break-words" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold break-words" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-600 underline break-words" {...props} />,
                          }}
                        >
                          {preprocessLatex(currentLesson.aboutLesson)}
                        </ReactMarkdown>
                      </div>
                    ) : currentLesson?.description ? (
                      <div>
                        <h3 className="text-base font-semibold mb-2">About This Lesson</h3>
                        <p className="text-gray-700 mb-3 text-sm">{currentLesson.description}</p>
                        <div className="mt-2">
                          <h4 className="font-medium mb-2 text-sm">What you'll learn:</h4>
                          <ul className="list-disc pl-4 space-y-1 text-gray-700 text-sm">
                            <li>Understanding the core concepts of {currentLesson.title}</li>
                            <li>Practical applications and real-world examples</li>
                            <li>Best practices and common techniques</li>
                            <li>Key takeaways for your learning journey</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-semibold mb-2">About This Lesson</h3>
                        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-500 text-sm">No description is available for this lesson.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'resources' && (
                  <ResourcesPage lessonResources={currentLesson?.resources} />
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  // Simple back navigation: go back to the previous page
  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <MobileCourseLoadingSkeleton />;
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Mobile Header - Compact and well-aligned */}
  <div className="flex-shrink-0 bg-white border-b border-gray-200 relative z-10">
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 8px)`, paddingBottom: '8px' }}
        >
          <div className="flex items-center space-x-1.5 flex-1 min-w-0">
            <button
      onClick={handleBack}
              className="h-9 w-9 inline-flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 border border-gray-200"
      aria-label="Go back"
      title="Back"
            >
              <FaArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate leading-tight">{currentLesson?.title || 'Course Learning'}</h1>
              <p className="text-xs text-gray-500 truncate leading-tight">{currentChapter?.title}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(true)}
            className="ml-2 h-9 w-9 inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white flex-shrink-0"
            aria-label="Open course topics"
            title="Topics"
          >
            <FaList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20"> {/* Reduced bottom padding since we only have lesson nav now */}
        {renderContent()}
      </div>

      {/* Mobile Navigation - Fixed Bottom - Professional */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 shadow-2xl backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between gap-2 px-3 py-3 max-w-lg mx-auto">
          <button 
            onClick={() => navigateToLesson('prev')}
            disabled={activeChapter === 0 && activeLesson === 0}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
              activeChapter === 0 && activeLesson === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 active:scale-95'
            }`}
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          
          {/* Center action: open course sidebar (topics) */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all active:scale-95"
            aria-label="Open course topics"
          >
            <FaList className="w-3.5 h-3.5" />
            <span>Topics</span>
          </button>
          
          <button 
            onClick={() => navigateToLesson('next')}
            disabled={activeChapter === course?.chapters.length - 1 && activeLesson === course?.chapters[activeChapter]?.lessons.length - 1}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
              activeChapter === course?.chapters.length - 1 && activeLesson === course?.chapters[activeChapter]?.lessons.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg active:scale-95'
            }`}
          >
            <span>Next</span>
            <FaChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Course Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={() => setShowMobileMenu(false)}>
          {/* Partial-width drawer to keep page content visible */}
          <div 
            className="fixed inset-y-0 right-0 w-[85vw] max-w-[420px] bg-white shadow-2xl transform transition-transform duration-300 rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header - Enhanced */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">Course Content</h2>
                <p className="text-sm text-gray-600 truncate">{course?.title}</p>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors flex-shrink-0"
              >
                <FaTimes className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Progress Summary */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Your Progress</span>
                {progressLoading ? (
                  <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-sm font-bold text-indigo-600">
                    {Math.round((completedLessons / totalLessons) * 100)}%
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                {progressLoading ? (
                  <div className="h-full w-full bg-indigo-100 animate-pulse"></div>
                ) : (
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
                  ></div>
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                {progressLoading ? (
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span>{completedLessons} of {totalLessons} lessons completed</span>
                )}
                <span>{course?.chapters?.length || 0} chapters</span>
              </div>
            </div>
            
            {/* Guest CTA */}
            {!isLoggedIn && (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <FaLock className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                        Unlock full course
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                        Log in to track progress.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const returnTo = encodeURIComponent((location?.pathname || '') + (location?.search || ''));
                      navigate(`/auth?returnTo=${returnTo}`);
                    }}
                    className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Log in
                  </button>
                </div>
              </div>
            )}

            {/* Course chapters list */}
            <div className="overflow-y-auto h-full pb-48 relative" ref={listRef}>
              {course?.chapters?.length === 0 && (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FaBook className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
                  <p className="text-sm text-gray-500">This course doesn't have any chapters or lessons yet.</p>
                </div>
              )}

              {course?.chapters?.map((chapter, chapterIndex) => (
                <div 
                  key={chapterIndex} 
                  className="border-b border-gray-100 last:border-b-0"
                  ref={(el) => (chapterRefs.current[chapterIndex] = el)}
                >
                  <button 
                    className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left group"
                    onClick={() => toggleChapter(chapterIndex)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0 ${
                        chapter.lessons.every(l => l.completed) 
                          ? 'bg-green-100 text-green-700' 
                          : chapter.lessons.some(l => l.completed)
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {chapter.lessons.every(l => l.completed) ? (
                          <FaCheck className="w-3 h-3" />
                        ) : (
                          chapterIndex + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors flex items-center">
                          <span className="truncate">{chapter.title}</span>
                          {chapter.isLocked && (
                            <FaLock className="w-3.5 h-3.5 text-gray-400 ml-2 flex-shrink-0" title="Chapter locked" />
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center ml-2">
                      <div className="text-right mr-3">
                        <div className="text-xs font-medium text-gray-900">
                          {chapter.lessons.filter(l => l.completed).length}/{chapter.lessons.length}
                        </div>
                        <div className="text-xs text-gray-500">completed</div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedChapters[chapterIndex] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg 
                          className={`h-4 w-4 text-gray-400`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </button>
                  
                  {/* Lessons */}
                  <AnimatePresence initial={false}>
                    {expandedChapters[chapterIndex] && (
                      <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                          open: { opacity: 1, height: "auto" },
                          collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden bg-gray-50"
                      >
                        {chapter.lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lessonIndex}
                            className={`w-full p-3 pl-4 flex items-center justify-between hover:bg-gray-100 transition-colors text-left group ${
                              activeChapter === chapterIndex && activeLesson === lessonIndex
                                ? 'bg-indigo-50 border-r-4 border-indigo-500'
                                : ''
                            } ${lesson.isLocked && !isLoggedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
                            aria-disabled={lesson.isLocked && !isLoggedIn}
                            onClick={() => handleLessonClick(chapterIndex, lessonIndex)}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              {/* Completion toggle moved to the left of title */}
                              <div
                                className={`mr-3 w-5 h-5 flex items-center justify-center rounded-full border-2 cursor-pointer select-none touch-manipulation active:scale-95 transition-all ${
                                  progressLoading 
                                    ? 'bg-gray-50 border-gray-200 cursor-wait' 
                                    : lesson.completed 
                                      ? 'bg-green-50 border-green-500' 
                                      : 'bg-white border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!progressLoading) {
                                    toggleLessonCompletion(chapterIndex, lessonIndex);
                                  }
                                }}
                                role="checkbox"
                                aria-checked={!!lesson.completed}
                                aria-label={`Mark \"${lesson.title}\" as ${lesson.completed ? 'incomplete' : 'complete'}`}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (!progressLoading) {
                                      toggleLessonCompletion(chapterIndex, lessonIndex);
                                    }
                                  }
                                }}
                              >
                                {progressLoading ? (
                                  <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                ) : (
                                  lesson.completed && <FaCheck className="w-3 h-3 text-green-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-medium truncate ${
                                  activeChapter === chapterIndex && activeLesson === lessonIndex
                                    ? 'text-indigo-700'
                                    : 'text-gray-900 group-hover:text-indigo-600'
                                }`}>
                                  {lesson.title}
                                </h4>
                                <p className="text-xs text-gray-500 capitalize">
                                  {lesson.type || 'video'} lesson
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center ml-2">
                              {lesson.isLocked && (
                                <FaLock className="w-3.5 h-3.5 text-gray-400 mr-2" title="Lesson locked" />
                              )}
                              {activeChapter === chapterIndex && activeLesson === lessonIndex && (
                                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                              )}
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCourseLearning;
