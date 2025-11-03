import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useNavigate, useParams } from "react-router-dom";
import universalToast from '../../../utils/universalToast';
import { 
  IoHome, IoChevronBack, IoPlayCircle, IoBookmark, IoDownload, 
  IoCheckmarkCircle, IoTime, IoEye, IoStar, IoSparkles, IoRocket, 
  IoTrendingUp, IoMenu, IoClose, IoChevronDown, IoShare, IoStatsChart
} from "react-icons/io5";
import { 
  FaRobot, FaYoutube, FaGithub, FaFilePdf, FaExternalLinkAlt, 
  FaBookOpen, FaBrain, FaVideo, FaQuestionCircle, FaLink, 
  FaGraduationCap, FaClock, FaUsers, FaChartLine, FaLightbulb,
  FaBolt, FaBullseye, FaCheck, FaTrophy, FaBook, FaNewspaper,
  FaCode, FaDownload, FaBookmark, FaCertificate, FaLaptopCode,
  FaStar, FaRegHandPaper, FaArrowLeft, FaExclamationTriangle
} from "react-icons/fa";
import { 
  BiLoaderAlt, BiTrophy, BiCode, BiTargetLock, BiCheckShield,
  BiBookReader, BiStats, BiTime, BiPlay
} from "react-icons/bi";
import { 
  HiSparkles, HiAcademicCap, HiLightningBolt, HiFire, 
  HiChartBar, HiLightBulb, HiOutlineSparkles, HiOutlineFire
} from "react-icons/hi";
import { 
  MdOutlineAutoAwesome, MdTrendingUp, MdTimer, MdPlayArrow,
  MdSchool, MdAutoAwesome, MdTimeline, MdExplore
} from "react-icons/md";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  splitMarkdownSections,
  generateProContent,
  generateReadingContent,
  generateSummaryContent,
  generateVideosContent,
  generateQuizContent,
  generateResourcesContent,
  nextQuestion,
  prevQuestion
} from '../ProLearningLogic';
import {
  formatDuration,
  formatViewCount,
  formatSubscriberCount,
  getResourceIcon
} from '../services/index.js';
// Debug cache utilities (exposed to window.debugReadingCache)
import '../services/debugReadingCache';
import { 
  batchGenerateAllTopics, 
  isTopicContentGenerated,
  getStoredTopicContent,
  getGenerationProgress,
  initializeCourseStorage
} from '../ProBatchGenerator';
import progressiveContentGenerator, {
  initializeProgressiveGeneration,
  startProgressiveGeneration,
  stopProgressiveGeneration,
  getProgressiveGenerationStatus,
  isTabContentAvailable,
  getAvailableTabsForTopic,
  getProgressiveTopicContent
} from '../ProgressiveContentGenerator';
import proContentManager from '../../../services/ProContentManager';
import tracking from '../../../services/trackingService';
import contentStorageService from '../../../services/ContentStorageService.js';
import { startLearningTracking, stopLearningTracking } from '../../../services/activityTracker';
import Navbar from '../../Navbar/Navbar';
import { classifyTopicsWithGemini } from '../topicclassifier';
// import BatchGenerationStatus from '../BatchGenerationStatus'; // REMOVED - eliminated duplicate loading card
import ProLearningMobile from '../ProLearningMobile';
// Reading utilities
import {
  preSanitizeMarkdown,
  parseReadingSections,
  flattenReactChildren,
  isMathTopicName,
  looksLikeAsciiDiagram,
  isLikelyProgramming,
  isReadingReadyForTopic,
  shouldRenderAsInlineCode,
  shouldRenderAsPlainText,
  debugHash as _debugHash,
  shortDebugString as _short
} from '../utils/ReadingUtils';
// Summary utilities
import {
  getSummaryContent,
  hasValidSummary,
  validateSummaryForTab,
  isSummaryAvailable,
  getSummaryMetadata,
  isSummaryReady,
  estimateSummaryReadingTime,
  getSummaryWordCount,
  contentHasSummary,
  formatSummaryForStorage,
  mergeSummaryContent,
  isNotPlaceholder,
  shouldRegenerateSummary
} from '../utils/SummaryUtils';
// Video utilities
import {
  hasValidVideos,
  VideoPlayerModal as VideoModalComponent
} from '../utils/VideosUtils.jsx';
// Quiz utilities
import {
  quizHasItems,
  QuizRenderer
} from '../utils/QuizUtils.jsx';
// Resources utilities
import {
  isResourcesGenerationComplete,
  hasValidResources,
  getIconComponent as getResourceIconComponent,
  getResourceIconName,
  ResourcesRenderer
} from '../utils/ResourcesUtils.jsx';
// Tab Content Renderer
import TabContentRenderer from './TabContentRenderer.jsx';
// Content Management Handlers
import * as ContentHandlers from './ContentManagementHandlers.jsx';
// Course Orchestration Handlers
import * as CourseOrchestration from './CourseOrchestrationHandlers.jsx';
// Pro Learning Utilities
import * as ProLearningUtils from './ProLearningUtilities.jsx';
// Render Tab Content
import { renderTabContent as renderTabContentHandler } from './RenderTabContent.jsx';
// Content Sanitization
import { createSetContentWithSanitization } from './ContentSanitization.jsx';
// Topic Content Loader
import { createLoadTopicContent } from './TopicContentLoader.jsx';
import MainContentLayout from './MainContentLayout.jsx';
// Loading Component
import LoadingComponent from './LoadingComponent.jsx';
// Course Initialization
import { createInitializeCourseData } from './CourseInitialization.jsx';
// Content Loading Effect
import { createContentLoadingEffect } from './ContentLoadingEffect.jsx';
// Topics Initialization Effect
import { createTopicsInitializationEffect } from './TopicsInitializationEffect.jsx';
// Tutor Chat (Reading Assistant)
import TutorChat from '../TutorChat/TutorChat.jsx';


const ProLearningPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  
  // UI state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // Video modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // Video modal handlers
  const openVideoModal = (video) => {
    setCurrentVideo(video);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    // Clear current video to stop playback when closing
    setIsVideoModalOpen(false);
    setCurrentVideo(null);
  };

  // Course and topic management with enhanced URL structure
  const courseId = params.courseId; // Get courseId from URL path
  const courseTitle = searchParams.get("courseTitle") || "";
  const topicParam = searchParams.get("topic"); // Get topic from URL if provided
  const activeTabParam = searchParams.get("tab") || "reading"; // Get active tab from URL
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicsList, setTopicsList] = useState([]);
  const [sectionGenerating, setSectionGenerating] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState([]);

  // Course ID management handlers - MOVED UP to be available early
  const { generateCourseId, getCourseId, setAndNavigateToCourseId } = ProLearningUtils.createCourseIdHandlers({
    courseId,
    navigate
  });

  // Parser for topics passed in the URL query param "topic"
  // Topics are confirmed by AI and user in /chat page, so we trust the format
  // - Multiple topics use ||| delimiter (no comma splitting needed)
  // - Single topics are kept intact with any internal commas, colons, etc.
  // - Limits to 4 topics for consistency
  const parseTopicsFromParam = (param) => {
    if (!param || typeof param !== 'string') return [];
    const s = param.trim();
    
    // Check if using delimiter (|||) for multiple topics
    if (s.includes('|||')) {
      const topics = s.split('|||').map(t => t.trim()).filter(Boolean);
      return topics.slice(0, 4);
    }
    
    // Single topic - keep it intact (don't split by commas)
    return [s];
  };

  // Helper to get the first/current topic name from URL param
  // No comma splitting - topics from /chat are already properly formatted
  const getCurrentTopicFromParam = (param) => {
    if (!param || typeof param !== 'string') return null;
    const topics = parseTopicsFromParam(param);
    return topics[0] || null;
  };
  
  // Function to fetch course data from database (delegates to ProContentManager with deduping)
  const fetchCourseFromDB = async (courseId) => {
    try {
      // Use the centralized manager which coalesces in-flight requests and negative-caches 404s
      return await proContentManager.fetchCourseFromDB(courseId);
    } catch (error) {
      console.error('❌ Error fetching course from database (manager):', error);
      return null;
    }
  };
  
  // Activity tracking useEffect - Start tracking when component mounts
  useEffect(() => {
    try { tracking.capture('pro_learning.page_view', { courseId: courseId || null }, { feature: 'pro_learning' }); } catch {}
    startLearningTracking();
    
    return () => {
      stopLearningTracking();
      try { tracking.capture('pro_learning.page_leave', { courseId: courseId || null }, { feature: 'pro_learning' }); } catch {}
    };
  }, []); // Empty dependency array - run once on mount/unmount

  // Mobile detection useEffect - Hide navbar on mobile and tablet for immersive experience
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // Use 1024px as breakpoint to include tablets
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Simple content loader for reload mode - no generation, just load from storage
  const loadContentForReloadMode = async (topicName) => {
    const currentCourseId = getCourseId();
    if (!currentCourseId || !topicName) return;

    console.log('⚡ Reload mode: Loading content for topic:', topicName);

    try {
      const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
      if (storedContent && storedContent.reading) {
        console.log('✅ Reload mode: Found content for topic:', topicName);
        // Double-check the topic didn’t change while awaiting
        if (selectedTopic?.name && selectedTopic.name !== topicName) {
          return;
        }
        setContentWithSanitization({
          reading: storedContent.reading,
          summary: storedContent.summary || 'Summary not available',
          quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
          videos: storedContent.videos || [],
          resources: storedContent.resources || []
        }, 'reload:storedContent');
        setContentTopicName(topicName);

        if (storedContent.reading) {
          const sections = parseReadingSections(storedContent.reading);
          setReadingSections(sections);
          setReadingSectionIndex(0);
        }

        setIsLoading(false);
        setLoadingStep('');
      } else {
        console.warn('⚠️ Reload mode: No content found for topic:', topicName);
        // Avoid injecting fallback reading in reload mode to prevent preservation conflicts.
        // Just clear loading; UI will indicate missing content without altering reading.
        setIsLoading(false);
        setLoadingStep('');
      }
    } catch (error) {
      console.error('❌ Reload mode: Error loading content for topic:', topicName, error);
      // Avoid injecting error content as reading in reload mode; keep current reading intact.
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Check if course is already saved when loading
  // Skip this check for shared links (they're already loaded from public endpoint)
  useEffect(() => {
    const checkIfCourseSaved = async () => {
      if (!courseId) return;
      
      // Skip DB check for shared courses (they're loaded via public endpoint)
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`course_content_${courseId}`) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.metadata?.source === 'shared-link') {
            return;
          }
        }
      } catch {}
      
      const databaseCourse = await fetchCourseFromDB(courseId);
      if (databaseCourse) {
        console.log('✅ Course found in database');
      }
    };
    checkIfCourseSaved();
  }, [courseId]);

  // Content state
  const [content, setContent] = useState(null);
  // Track which topic the current `content` belongs to to prevent cross-topic leaks
  const [contentTopicName, setContentTopicName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stats, setStats] = useState({});
  
  // Overall course generation state
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [courseGenerationProgress, setCourseGenerationProgress] = useState(0);
  const [courseGenerationStatus, setCourseGenerationStatus] = useState("");
  const [allTopicsGenerated, setAllTopicsGenerated] = useState(false);
  
  // Batch generation state
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchGenerationProgress, setBatchGenerationProgress] = useState(0);
  const [batchGenerationStatus, setBatchGenerationStatus] = useState("");
  
  // Progressive generation state
  const [isProgressiveGenerating, setIsProgressiveGenerating] = useState(false);
  const [progressiveGenerationProgress, setProgressiveGenerationProgress] = useState({});
  const [availableTabsForTopics, setAvailableTabsForTopics] = useState({});
  const [useProgressiveGeneration, setUseProgressiveGeneration] = useState(true); // Feature flag
  const [loadScenario, setLoadScenario] = useState(null); // 'first-time' or 'reload'

  // Safety: when generation stops, clear any lingering progress UI/flags
  useEffect(() => {
    if (!isProgressiveGenerating) {
      // Ensure we don't accidentally show spinners with stale progress topic/tab
      setProgressiveGenerationProgress({});
      setShowSkeletons(false);
      setLoadingStep('');
    }
  }, [isProgressiveGenerating]);

  // Safety: if we ever mark all topics as generated, also ensure generation flag is down
  useEffect(() => {
    if (allTopicsGenerated) {
      setIsProgressiveGenerating(false);
    }
  }, [allTopicsGenerated]);

  // If we arrive with a UUID course (DB-saved), proactively clear any stale fresh-generation marker
  useEffect(() => {
    const id = courseId;
    const isUUID = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem('proLearning_batchMarker'); } catch {}
    }
  }, [courseId]);
  
  // Reading sections state
  const [readingSections, setReadingSections] = useState([]);
  const [readingSectionIndex, setReadingSectionIndex] = useState(0);
  
  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false);
  
  // Copy code functionality
  const [copySuccessMap, setCopySuccessMap] = useState({});
  
  // Quiz submission state - topic-specific to prevent cross-topic interference
  const [quizSubmittedByTopic, setQuizSubmittedByTopic] = useState({});

  // Lightweight debug logger to reduce console noise; enable by setting window.__PRO_LEARNING_DEBUG = true
  const debugLog = (...args) => {
    try {
      if (typeof window !== 'undefined' && window.__PRO_LEARNING_DEBUG) {
        // eslint-disable-next-line no-console
        console.log(...args);
      }
    } catch {}
  };

  // State-gated sanitized reading to ensure we never paint raw content
  const [sanitizedReading, setSanitizedReading] = useState('');
  const [readingRenderReady, setReadingRenderReady] = useState(false);
  // Track which topic the sanitized reading belongs to, to avoid readiness mismatches
  const [sanitizedReadingTopicName, setSanitizedReadingTopicName] = useState(null);
  // Note: Sanitization is now handled immediately in setContentWithSanitization helper
  // No useEffect needed since sanitization happens synchronously when content is set

  // Helper to set content while preserving FIRST reading and controlling sanitization
  // Behavior:
  // - First reading wins; later variants are ignored to prevent visual flips
  // - During progressive generation (or when sourceLabel starts with 'progressive:'),
  //   we DO NOT sanitize the first reading — we render it raw immediately
  // - Otherwise, first reading is pre-sanitized to avoid initial formatting flashes
  const setContentWithSanitization = createSetContentWithSanitization({
    contentTopicName,
    selectedTopic,
    content,
    topicParam,
    setSanitizedReading,
    setReadingRenderReady,
    getCurrentTopicFromParam,
    setSanitizedReadingTopicName,
    sanitizedReading,
    debugLog,
    setContent
  });

  // Reset client-side readiness when switching topics to avoid flashing prior sanitized content
  useEffect(() => {
    if (!selectedTopic?.name) return;
    setReadingRenderReady(false);
    setSanitizedReading('');
    setSanitizedReadingTopicName(null);
  }, [selectedTopic?.name]);

  // Emergency sanitization: if raw content exists but no sanitized version, sanitize it
  // This should rarely trigger as setContentWithSanitization handles it normally
  useEffect(() => {
    const currentTopic = selectedTopic?.name || getCurrentTopicFromParam(topicParam);
    
    // Only trigger if we have raw content but no sanitized version for current topic
    if (!sanitizedReading && 
        contentTopicName === currentTopic && 
        content?.reading &&
        typeof content.reading === 'string' &&
        content.reading.trim().length > 0) {
      
      console.warn('⚠️ Emergency sanitization triggered - raw content detected without sanitized version');
      
      try {
        const sanitized = preSanitizeMarkdown(content.reading);
        setSanitizedReading(sanitized);
        setReadingRenderReady(true);
        setSanitizedReadingTopicName(currentTopic);
      } catch (error) {
        console.error('❌ Emergency sanitization failed:', error);
        // Don't set anything on error to avoid showing broken content
      }
    }
  }, [content?.reading, contentTopicName, sanitizedReading, selectedTopic?.name, topicParam]);

  // Derived: does any topic have any generated tab available?
  const hasAnyContent = useMemo(() => {
    // Check tabs availability map first
    if (topicsList && topicsList.length > 0) {
      for (const t of topicsList) {
        const tabs = availableTabsForTopics?.[t?.name];
        if (Array.isArray(tabs) && tabs.length > 0) return true;
      }
    }
    // Fallback to immediate content state
    const c = content;
    if (c) {
      if (typeof c.reading === 'string' && c.reading.trim().length > 0) return true;
      if (hasValidSummary(c)) return true;
      if (Array.isArray(c.videos) && c.videos.length > 0) return true;
      if (Array.isArray(c.resources) && c.resources.length > 0) return true;
      if (Array.isArray(c.quiz) && c.quiz.length > 0) return true;
      if (c.quiz && Array.isArray(c.quiz?.questions) && c.quiz.questions.length > 0) return true;
    }
    return false;
  }, [topicsList, availableTabsForTopics, content]);
  
  // Completion tracking
  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      // Only load completion data if we have a valid courseId from URL
      const courseIdFromUrl = window.location.pathname.split('/')[2];
      
      if (courseIdFromUrl && courseIdFromUrl.startsWith('course_')) {
        const courseSpecificKey = `proLearning_completedTopics_${courseIdFromUrl}`;
        const courseSpecific = localStorage.getItem(courseSpecificKey);
        if (courseSpecific) {
          const parsed = JSON.parse(courseSpecific);
          // Ensure it's an array and has valid data
          return Array.isArray(parsed) ? parsed : [];
        }
      }
      
      // For new courses or invalid data, start with empty completion state
      return [];
    } catch {
      return [];
    }
  });
  
  // Validate and clean completion data when topics change
  useEffect(() => {
    if (topicsList.length > 0) {
      const validTopicIds = topicsList.map(t => t.id);
      const currentCompleted = completedTopics.filter(id => validTopicIds.includes(id));
      
      // Only update if there are invalid IDs to remove
      if (currentCompleted.length !== completedTopics.length) {
        console.log('🧹 Cleaning invalid completion data:', {
          before: completedTopics,
          after: currentCompleted,
          validTopicIds
        });
        setCompletedTopics(currentCompleted);
        
        // Update localStorage with cleaned data
        try {
          const courseId = getCourseId();
          const storageKey = courseId ? `proLearning_completedTopics_${courseId}` : 'proLearning_completedTopics';
          localStorage.setItem(storageKey, JSON.stringify(currentCompleted));
        } catch (error) {
          console.warn('Failed to save cleaned completion data:', error);
        }
      }
    }
  }, [topicsList]); // Run when topics change
  
  // Load completed topics from backend API
  useEffect(() => {
    const loadCompletedTopicsFromBackend = async () => {
      if (topicsList.length === 0) return;
      
      try {
        const axiosInstance = (await import('../../../utils/axios')).default;
        const courseId = getCourseId();
        
        if (!courseId) return;
        
        // Fetch course progress from backend
        const response = await axiosInstance.get(`/api/courses/${courseId}/progress/`);
        
        if (response.data) {
          const completedLessonIds = [];
          
          // Extract completed lesson IDs from chapters or sections
          if (response.data.chapters) {
            // School course structure
            response.data.chapters.forEach(chapter => {
              chapter.lessons?.forEach(lesson => {
                if (lesson.completed) {
                  completedLessonIds.push(lesson.id);
                }
              });
            });
          } else if (response.data.sections) {
            // Engineering course structure
            response.data.sections.forEach(section => {
              section.lessons?.forEach(lesson => {
                if (lesson.completed) {
                  completedLessonIds.push(lesson.id);
                }
              });
            });
          }
          
          // Update state with backend data
          setCompletedTopics(completedLessonIds);
          
          // Also update localStorage
          const storageKey = courseId ? `proLearning_completedTopics_${courseId}` : 'proLearning_completedTopics';
          localStorage.setItem(storageKey, JSON.stringify(completedLessonIds));
          
          console.log('✅ Loaded completed topics from backend:', completedLessonIds.length);
        }
      } catch (error) {
        console.warn('Failed to load completed topics from backend:', error);
        // Fall back to localStorage data (already loaded in initial state)
      }
    };
    
    loadCompletedTopicsFromBackend();
  }, [topicsList]); // Run when topics are loaded
  
  // Flag to prevent storage loading during direct URL generation
  const [isDirectUrlGeneration, setIsDirectUrlGeneration] = useState(false);

  // Initialize sidebar visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarVisible(true);
      } else {
        setSidebarVisible(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize ProContentManager with course context
  useEffect(() => {
    if (courseTitle) {
      const currentCourseId = getCourseId();
      proContentManager.setCourse(courseTitle, currentCourseId);
    }
  }, [courseTitle, courseId]);

  // Frontend no longer holds Gemini API key; classification uses backend
  const GEMINI_API_KEY = undefined;

  // Initialize course in ProContentManager when component mounts
  useEffect(() => {
    const currentCourseId = getCourseId();
    if (currentCourseId && courseTitle) {
      // Set the current course in ProContentManager
      proContentManager.setCourse(courseTitle, currentCourseId);
      console.log('✅ Course initialized in ProContentManager:', { courseTitle, currentCourseId });
    }
  }, [courseTitle]);

  // Topic generation and caching
  const geminiCache = useRef({});
  const debounceTimeout = useRef();

  useEffect(() => {
    if (!courseTitle || courseTitle === "") return;

    // Skip topic classification for shared courses (topics already loaded)
    try {
      const raw = typeof localStorage !== 'undefined' && courseId ? localStorage.getItem(`course_content_${courseId}`) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.metadata?.source === 'shared-link' && parsed?.topics) {
          // Extract topics from shared course data
          const topicsObj = parsed.topics || {};
          const topicsArray = Object.keys(topicsObj).map(name => ({
            name,
            id: topicsObj[name]?.id
          }));
          if (topicsArray.length > 0) {
            setTopicsList(topicsArray);
            console.log('✅ Using topics from shared course:', topicsArray.length);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to check for shared course topics:', e);
    }

    // If cached, use it immediately
    if (geminiCache.current[courseTitle]) {
      setTopicsList(geminiCache.current[courseTitle]);
      console.log('✅ Using cached topics for:', courseTitle);
      return;
    }

    // Debounce topic generation
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      // Prevent generation for very short titles
      if (courseTitle.trim().length < 3) {
        console.log('⚠️ Course title too short:', courseTitle);
        return;
      }
      try {

  const classified = await classifyTopicsWithGemini(courseTitle, GEMINI_API_KEY);
        geminiCache.current[courseTitle] = classified;
        setTopicsList(classified);
        
        // Store topics in ProContentManager
        const currentCourseId = getCourseId();
        if (currentCourseId && classified.length > 0) {
          proContentManager.setCourse(courseTitle, currentCourseId);
          await proContentManager.storeTopics(classified);
        }
      } catch (error) {
        setTopicsList([]);
        // Optionally, show error to user via toast or UI
      }
    }, 1000); // 1000ms debounce

    // Cleanup on unmount/change
    return () => clearTimeout(debounceTimeout.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseTitle, courseId, GEMINI_API_KEY]);

  // Separate useEffect to handle batch/progressive generation when topics are available
  useEffect(() => {
    const currentCourseId = getCourseId();
    if (topicsList.length === 0 || !currentCourseId) return;
    
    if (useProgressiveGeneration) {
      // CRITICAL: Auto-start progressive generation for fresh courses
      // Check if this is a fresh generation (first-time mode with batch marker)
      const hasBatchMarker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
      const isFirstTime = loadScenario === 'first-time';
      const isEphemeralCourse = String(currentCourseId).startsWith('course_');
      
      console.log('🔍 Progressive generation check:', {
        loadScenario,
        hasBatchMarker: !!hasBatchMarker,
        isEphemeralCourse,
        isProgressiveGenerating,
        topicsCount: topicsList.length
      });
      // If we've already completed generation, never auto-start again
      if (allTopicsGenerated) {
        console.log('✅ Progressive generation already completed; skipping auto-start');
        return;
      }
      
      // Auto-start progressive generation if:
      // 1. We're in first-time mode for an ephemeral course (course_...), OR
      // 2. We have a batch marker AND we're on an ephemeral course (ignore marker for UUID DB courses)
      if (((isFirstTime && isEphemeralCourse) || (hasBatchMarker && isEphemeralCourse)) && !isProgressiveGenerating) {
        console.log('🚀 Auto-starting progressive generation for fresh course');
        handleProLearningStart();
      }
      return; // progressive flow manages its own generation lifecycle
    }
    
    // Batch generation mode (non-progressive)
    if (!isBatchGenerating) {
      // Check if we need to start batch generation using new storage system
      const progress = getGenerationProgress(currentCourseId);
      
      // If all topics already have content, set completion state
      if (progress.generated >= progress.total && progress.total > 0) {
        console.log('🎉 Course already complete, setting completion state');
        setAllTopicsGenerated(true);
        setBatchGenerationProgress(100);
        setBatchGenerationStatus('Course generation completed!');
        setIsBatchGenerating(false);
      }
      // If not all topics have content, start batch generation
      else if (progress.generated < progress.total) {
        setIsBatchGenerating(true);
        setBatchGenerationStatus('Starting content generation for all topics...');
        
        // Generate content for all topics using new storage system
        setTimeout(async () => {
          const result = await batchGenerateAllTopics(
            currentCourseId,
            topicsList, 
            generateProContent, 
            setBatchGenerationStatus, 
            setIsBatchGenerating, 
            setBatchGenerationProgress
          );
          
          // Ensure completion state is properly set
          if (result && result.success) {
            console.log('✅ Batch generation completed successfully');
            setBatchGenerationProgress(100);
            setIsBatchGenerating(false);
            setAllTopicsGenerated(true);
          }
        }, 500);
      }
    }
  }, [topicsList, courseTitle, useProgressiveGeneration, loadScenario, isProgressiveGenerating, allTopicsGenerated]); // Depend on loadScenario to detect fresh generation

  // Helper function to check if topic content exists in batch-generated data
  const hasTopicContent = (topicName) => {
    const currentCourseId = getCourseId();
    if (!currentCourseId) return false;
    
    const storedContent = proContentManager.getStoredTopicContent(currentCourseId, topicName);
    return storedContent && Object.keys(storedContent).length > 0;
  };

  // Helper function to determine if we should skip old cached content but allow fresh progressive content
  const shouldSkipOldCachedContent = () => {
    const batchMarkerValue = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
    
    if (!batchMarkerValue) {
  debugLog('🔍 DEBUG: No batch marker found - normal content loading');
      return false;
    }
    
    try {
      // Check if the batch marker is recent (within last 5 minutes)
      const markerTimestamp = parseInt(batchMarkerValue);
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      const isRecent = markerTimestamp > fiveMinutesAgo;
      
      if (!isRecent) {
        // Batch marker is too old, clear it and don't skip content
  debugLog('🧹 DEBUG: Clearing expired batch marker (older than 5 minutes)');
        localStorage.removeItem('proLearning_batchMarker');
        return false;
      }
      
  debugLog('🔄 DEBUG: Recent batch marker detected - WILL SKIP old cached content');
      return true;
    } catch (error) {
      // If we can't parse the timestamp, clear the marker
      console.warn('⚠️ DEBUG: Invalid batch marker format, clearing:', error);
      localStorage.removeItem('proLearning_batchMarker');
      return false;
    }
  };

  // Track content generation to prevent infinite loops
  const generatingContentRef = useRef(new Set());
  const lastGeneratedTopicRef = useRef(null);

  // Load content for initially active topic using new storage system
  useEffect(createContentLoadingEffect({
    loadScenario,
    isDirectUrlGeneration,
    topicParam,
    topicsList,
    shouldSkipOldCachedContent,
    getProgressiveGenerationStatus,
    debugLog,
    courseTitle,
    getCourseId,
    generatingContentRef,
    content,
    setIsLoading,
    setShowSkeletons,
    getStoredTopicContent,
    setContentWithSanitization,
    parseReadingSections,
    setReadingSections,
    setReadingSectionIndex,
    isBatchGenerating,
    setLoadingStep,
    setSectionGenerating,
    setGeneratingTopics,
    proContentManager,
    generateProContent,
    lastGeneratedTopicRef,
    getCurrentTopicFromParam,
    fetchCourseFromDB
  }), [topicsList, courseTitle, isBatchGenerating, topicParam, isDirectUrlGeneration, loadScenario]);

  // Watch for content updates and trigger regeneration if content is empty
  const [regenerationAttempted, setRegenerationAttempted] = useState(false);
  
  // Reset regeneration flag when topic changes
  useEffect(() => {
    setRegenerationAttempted(false);
    setIsDirectUrlGeneration(false); // Reset direct generation flag when topic changes
  }, [topicParam]);
  

  // Helper function to check if content is freshly generated (very recent, within current session)
  const isContentFreshlyGenerated = (content, strictMode = false) => {
    if (!content || !content.metadata) {
  debugLog('🔍 DEBUG: No content metadata found - considering as old content');
      return false;
    }
    
    // In strict mode (during fresh course creation), be very strict about what's considered fresh
    if (strictMode) {
      // Only consider content fresh if it was generated within the last 10 minutes
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      const latestTimestamp = Math.max(
        content.metadata.readingGeneratedAt ? new Date(content.metadata.readingGeneratedAt).getTime() : 0,
        content.metadata.summaryGeneratedAt ? new Date(content.metadata.summaryGeneratedAt).getTime() : 0,
        content.metadata.videosGeneratedAt ? new Date(content.metadata.videosGeneratedAt).getTime() : 0,
        content.metadata.quizGeneratedAt ? new Date(content.metadata.quizGeneratedAt).getTime() : 0,
        content.metadata.resourcesGeneratedAt ? new Date(content.metadata.resourcesGeneratedAt).getTime() : 0
      );
      
      const isFresh = latestTimestamp > tenMinutesAgo.getTime();
      const latestDate = new Date(latestTimestamp);
      
      console.log(`🔍 DEBUG: Strict mode content check - Latest generation: ${latestDate.toLocaleTimeString()}, Is Fresh: ${isFresh}`);
      
      return isFresh;
    }
    
    // Normal mode - just check if content has progressive generation timestamps
    const hasGenerationTimestamps = content.metadata.readingGeneratedAt || 
                                   content.metadata.summaryGeneratedAt || 
                                   content.metadata.videosGeneratedAt || 
                                   content.metadata.quizGeneratedAt || 
                                   content.metadata.resourcesGeneratedAt;
    
    console.log(`🔍 DEBUG: Normal mode content check - Has timestamps: ${!!hasGenerationTimestamps}`);
    
    return !!hasGenerationTimestamps;
  };

  // Helper functions for progressive gating
  const isFirstTopicComplete = () => {
    if (!topicsList || topicsList.length === 0) return false;
    const first = topicsList[0];
    const firstName = first?.name || first;
    // During an active progressive run, only trust the in-session tabs map
    const ready = availableTabsForTopics[firstName] || [];
    const allReady = ['reading','summary','videos','quiz','resources'].every(t => ready.includes(t));
    if (isProgressiveGenerating) {
      return allReady;
    }
    // Otherwise (e.g., revisits), allow storage fallback
    if (allReady) return true;
    try {
      const id = getCourseId();
      const stored = id ? contentStorageService.getContentByTopicName(firstName, id) : null;
      return !!(stored && typeof stored.reading === 'string' && stored.reading.trim() &&
        hasValidSummary(stored) &&
        Array.isArray(stored.videos) && stored.videos.length > 0 &&
        (Array.isArray(stored.quiz) ? stored.quiz.length > 0 : (stored?.quiz?.questions?.length > 0)) &&
        Array.isArray(stored.resources) && stored.resources.length > 0);
    } catch { return false; }
  };

  // Helper function to determine if a topic should be blocked
  const isTopicBlocked = (topicName) => {
    // In reload mode (content already saved in DB), never block topics
    if (loadScenario === 'reload') return false;
    // Also never block if this course was opened via a DB ID (UUID-style) link
    try {
      const cid = typeof window !== 'undefined' ? (window.location.pathname.split('/')[2] || '') : '';
      const isDbCourse = !!cid && !cid.startsWith('course_');
      if (isDbCourse) return false;
    } catch {}

    if (!topicsList || topicsList.length === 0) return false;

    // First topic (index 0) is never blocked - it gets progressive generation
    const topicIndex = topicsList.findIndex(topic => topic.name === topicName || topic === topicName);
    if (topicIndex === 0) return false;

    // During a fresh progressive session, keep topics after the first FULLY BLOCKED
    // until at least one tab is ready for that topic. Once a tab is ready, allow access to ready tabs.
    if (useProgressiveGeneration) {
      let fresh = false;
      try {
        if (typeof localStorage !== 'undefined') {
          fresh = !!localStorage.getItem('proLearning_batchMarker');
        }
      } catch {}
      if (isProgressiveGenerating || fresh) {
        // Block entire topic until READING is ready (strict per-topic order)
        const readyTabs = availableTabsForTopics[topicName] || [];
        let readingReady = readyTabs.includes('reading');
        if (!readingReady) {
          try {
            const id = getCourseId();
            const stored = id ? contentStorageService.getContentByTopicName(topicName, id) : null;
            readingReady = !!(stored && typeof stored.reading === 'string' && stored.reading.trim());
          } catch {}
        }
        return !readingReady;
      }
    }

    // Otherwise (e.g., revisits/older sessions), allow unblocking if this topic already has full content
    try {
      const id = getCourseId();
      const stored = id ? contentStorageService.getContentByTopicName(topicName, id) : null;
      
      // Check for resources generation completion (not necessarily having resources)
      // If metadata.generatedAt exists, resources generation completed (even if 0 results)
      const resourcesCompleted = stored?.resourcesMetadata?.generatedAt || 
        (Array.isArray(stored?.resources) && stored.resources.length > 0);
      
      const hasFull = stored && typeof stored.reading === 'string' && stored.reading.trim() &&
        hasValidSummary(stored) &&
        Array.isArray(stored.videos) && stored.videos.length > 0 &&
        (Array.isArray(stored.quiz) ? stored.quiz.length > 0 : (stored?.quiz?.questions?.length > 0)) &&
        resourcesCompleted;  // ← Fixed: Check completion, not content
      if (hasFull) return false;
    } catch {}

    // Fallback: block until entire course completes
    return !allTopicsGenerated;
  };

  // Helper function to load topic content from progressive generation data
  // MOVED UP to be available for loadTopicContent factory
  const loadProgressiveTopicContent = (topicName, options = {}) => {
    return ContentHandlers.loadProgressiveTopicContent(topicName, options, {
      setIsLoading,
      setLoadingStep,
      shouldSkipOldCachedContent,
      getCourseId,
      courseTitle,
      topicsList,
      isContentFreshlyGenerated,
      content,
      contentTopicName,
      setContentWithSanitization,
      setContentTopicName,
      setAvailableTabsForTopics,
      setReadingSections,
      setReadingSectionIndex
    });
  };

  // Helper function to load topic content from batch-generated data
  const loadTopicContent = createLoadTopicContent({
    getCourseId,
    useProgressiveGeneration,
    getProgressiveGenerationStatus,
    shouldSkipOldCachedContent,
    loadProgressiveTopicContent,
    selectedTopic,
    content,
    isLoading,
    setContentTopicName,
    setAvailableTabsForTopics,
    setIsLoading,
    setLoadingStep,
    setContentWithSanitization,
    setReadingSections,
    setReadingSectionIndex,
    courseTitle,
    topicsList,
    fetchCourseFromDB,
    generateProContent
  });

  // Handle topic selection from sidebar using new storage system
  const handleTopicSelect = (topicId) => {
    return ContentHandlers.handleTopicSelect(topicId, {
      topicsList,
      setTopicsList,
      setSelectedTopic,
      updateTopicInUrl,
      setContent,
      setContentTopicName,
      setReadingSections,
      setReadingSectionIndex,
      setActiveTab,
      setAvailableTabsForTopics,
      getCourseId,
      isTopicBlocked,
      setIsLoading,
      setLoadingStep,
      loadScenario,
      loadContentForReloadMode,
      useProgressiveGeneration,
      loadProgressiveTopicContent,
      availableTabsForTopics,
      isProgressiveGenerating,
      setIsProgressiveGenerating,
      allTopicsGenerated,
      hasTopicContent,
      loadTopicContent
    });
  };

  // Toggle topic completion status
  const toggleTopicCompletion = (topicId, event) => {
    return ContentHandlers.toggleTopicCompletion(topicId, event, {
      setCompletedTopics,
      getCourseId
    });
  };

  // Sidebar toggle handlers
  const handleSidebarToggle = (isVisible) => {
    ContentHandlers.handleSidebarToggle(isVisible, setSidebarVisible);
  };

  // Copy code functionality
  const handleCopyCode = (codeString, blockId) => {
    ContentHandlers.handleCopyCode(codeString, blockId, setCopySuccessMap);
  };

  // Save to Learning Hub functionality
  const generateSmartCourseName = (topicsData, fallbackTitle) => {
    return ContentHandlers.generateSmartCourseName(topicsData, fallbackTitle);
  };

  // Auto-save function for post-generation saves (no UI state updates)
  const autoSaveToBackend = async () => {
    return ContentHandlers.autoSaveToBackend({
      getCourseId,
      topicsList,
      content,
      selectedTopic,
      courseTitle
    });
  };

  const handleSaveToLearningHub = async () => {
    return ContentHandlers.handleSaveToLearningHub({
      getCourseId,
      topicsList,
      selectedTopic,
      courseTitle
    });
  };

  // Check for pending topics
  useEffect(() => {
    // If progressive generation is enabled, don't kick off the legacy batch flow here
    if (useProgressiveGeneration) {
      return;
    }
    
    // Check if we have pending topics from the chatbot
    try {
      const pendingTopicsString = localStorage.getItem('proLearning_pendingTopics');
      const generationTriggered = localStorage.getItem('proLearning_generationTriggered');
      
      if (pendingTopicsString && generationTriggered === 'true') {
        const pendingTopics = JSON.parse(pendingTopicsString);
        
        // Use these topics if we don't have topics yet
        if (pendingTopics.length > 0 && (!topicsList || topicsList.length === 0)) {
          setTopicsList(pendingTopics);
        }
        
        // Clear the pending topics so we don't process them again
        localStorage.removeItem('proLearning_pendingTopics');
        localStorage.removeItem('proLearning_generationTriggered');
      }
    } catch (error) {
    }
    
    // Start batch generation for all topics if needed
    const timer = setTimeout(() => {
      if (topicsList.length > 0 && courseTitle) {
        CourseOrchestration.initializeBatchGeneration({
          topicsList,
          courseTitle,
          getGenerationProgress,
          setAllTopicsGenerated,
          setBatchGenerationProgress,
          setBatchGenerationStatus,
          setIsBatchGenerating,
          batchGenerateAllTopics,
          generateProContent
        });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [topicsList, courseTitle, useProgressiveGeneration]); // Add courseTitle dependency

  // Handle initial content loading when page loads with topic parameter
  useEffect(() => {
    // Run after a small delay to ensure ProContentManager is initialized
    // Only run for first-time generation, not for reload scenarios
    if (loadScenario === 'first-time' || loadScenario === null) {
      const timer = setTimeout(() => {
        CourseOrchestration.loadInitialTopicContent({
          topicParam,
          isLoading,
          content,
          parseTopicsFromParam,
          getCourseId,
          shouldSkipOldCachedContent,
          isContentFreshlyGenerated,
          setContentWithSanitization,
          setAvailableTabsForTopics
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [topicParam, loadScenario]); // Depend on loadScenario to control when this runs

  // Get currently active topic
  const getCurrentTopic = () => {
    return ProLearningUtils.getCurrentTopic({ topicsList, topicParam });
  };

  // Handle Pro Learning Experience button click - Generate all topics
  const handleProLearningStart = async () => {
    return CourseOrchestration.handleProLearningStart({
      topicsList,
      getCourseId,
      setIsGeneratingCourse,
      setAllTopicsGenerated,
      setCourseGenerationProgress,
      setCourseGenerationStatus,
      useProgressiveGeneration,
      selectedTopic,
      setSelectedTopic,
      initializeProgressiveGeneration,
      courseTitle,
      setProgressiveGenerationProgress,
      setAvailableTabsForTopics,
      getProgressiveTopicContent,
      setContent,
      setContentTopicName,
      parseReadingSections,
      setReadingSections,
      setReadingSectionIndex,
      preSanitizeMarkdown,
      setSanitizedReading,
      setReadingRenderReady,
      setSanitizedReadingTopicName,
      setIsLoading,
      setLoadingStep,
      setIsProgressiveGenerating,
      startProgressiveGeneration,
      loadProgressiveTopicContent,
      topicParam,
      proContentManager,
      autoSaveToBackend,
      setLoadScenario,
      setShowSkeletons,
      clearTopicFromBothStorages,
      loadTopicContent,
      content
    });
  };

  // Clear storage function (for debugging/development)
  const clearContentStorage = () => {
    ProLearningUtils.clearContentStorage({
      clearReadingContentCache,
      setContent,
      setReadingSections,
      setReadingSectionIndex,
      setTopicsList,
      setCompletedTopics
    });
  };

  // Clear content for a specific topic from both storage systems (for fresh generation)
  const clearTopicFromBothStorages = (courseId, topicName) => {
    ProLearningUtils.clearTopicFromBothStorages(courseId, topicName);
  };

  // Reading section navigation handlers
  const { handlePrevSection, handleNextSection } = ProLearningUtils.createReadingNavigationHandlers({
    readingSectionIndex,
    setReadingSectionIndex,
    readingSections
  });
  
  // Define tabs array with icons and labels - MOVED ABOVE LoadingComponent
  const tabs = [
    { id: 'reading', label: 'Reading', icon: FaBookOpen, description: 'Comprehensive study content' },
    { id: 'summary', label: 'Summary', icon: FaBrain, description: 'Key points and overview' },
    { id: 'videos', label: 'Videos', icon: FaVideo, description: 'Visual learning resources' },
    { id: 'quiz', label: 'Quiz', icon: FaQuestionCircle, description: 'Test your knowledge' },
    { id: 'resources', label: 'Resources', icon: FaLink, description: 'Additional materials' }
  ];
  
  
  const [activeTab, setActiveTab] = useState(activeTabParam);
  const [completedTabs, setCompletedTabs] = useState([]); // Track completed tabs

  // Guard to avoid double-switching when URL sync is pending
  const tabUrlSyncPendingRef = useRef(false);
  
  // Ref for debounced tab updates
  const debouncedUpdateActiveTab = useRef(null);

  // Tab navigation handlers
  const { updateActiveTab, updateActiveTabDesktop, updateTopicInUrl } = ProLearningUtils.createTabNavigationHandlers({
    setActiveTab,
    setSearchParams,
    searchParams,
    tabUrlSyncPendingRef,
    debouncedUpdateActiveTab
  });

  // Set default topics and initialize with consistent course ID
  useEffect(createTopicsInitializationEffect({
    setIsLoading,
    setLoadingStep,
    proContentManager,
    setAvailableTabsForTopics,
    createInitializeCourseData,
    getCourseId,
    topicParam,
    courseTitle,
    setTopicsList,
    setSelectedTopic,
    getCurrentTopicFromParam,
    navigate,
    setActiveTab,
    loadScenario,
    loadContentForReloadMode,
    loadTopicContent,
    parseTopicsFromParam,
    setLoadScenario,
    fetchCourseFromDB
  }), [courseTitle, courseId, topicParam]); // Add topicParam dependency for immediate sync

  // Handle URL tab parameter changes (after topic initialization is complete)
  // Coerce invalid/unready tabs to the first available tab for the current topic
  useEffect(() => {
    if (topicsList.length === 0 || !selectedTopic) return; // Wait for initialization to complete
    if (tabUrlSyncPendingRef.current) return; // Skip while a local sync is pending

    const requestedTab = searchParams.get('tab') || 'reading';
    // Detect DB-style course (UUID) where we should not enforce progressive gating
    const isDbCourse = !!courseId && !String(courseId).startsWith('course_');

    // In progressive mode, only allow tabs that are ready for the selected topic
    if (useProgressiveGeneration && !(loadScenario === 'reload' || isDbCourse)) {
      const topicName = selectedTopic.name;
      const ready = [...(availableTabsForTopics[topicName] || [])];
      // Treat already-loaded content as ready ONLY if it belongs to this topic
      if (content && contentTopicName === topicName) {
        if (content.reading && !ready.includes('reading')) ready.push('reading');
        if (content.summary && !ready.includes('summary')) ready.push('summary');
        if ((content.videos?.length || 0) > 0 && !ready.includes('videos')) ready.push('videos');
        if (((Array.isArray(content.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0)) && !ready.includes('quiz')) ready.push('quiz');
        // Consider resources ready if array has items OR metadata indicates generation completion
        const otherTabsPresent = (
          (!!content?.reading && String(content.reading).trim().length > 0) ||
          (!!content?.summary && String(content.summary).trim().length > 0) ||
          (Array.isArray(content?.videos) && content.videos.length > 0) ||
          (Array.isArray(content?.quiz) && content.quiz.length > 0) ||
          (!!content?.quiz?.questions && Array.isArray(content?.quiz?.questions) && content.quiz.questions.length > 0)
        );
        const resourcesReady = ((content.resources?.length || 0) > 0) || !!content?.resourcesMetadata?.generatedAt;
        if (resourcesReady && !ready.includes('resources')) ready.push('resources');
        // Not adding reload fallback here because this branch is strictly for active progressive gating
      }

      // If the requested tab isn't ready (or nothing is ready yet), force a valid fallback
      if (!ready.includes(requestedTab)) {
        const preferredOrder = ['reading', 'summary', 'videos', 'quiz', 'resources'];
        const fallbackTab = preferredOrder.find(t => ready.includes(t)) || 'reading';
        if (fallbackTab) {
          tabUrlSyncPendingRef.current = true;
          setActiveTab(fallbackTab);
          const sp = new URLSearchParams(searchParams);
          sp.set('tab', fallbackTab);
          setSearchParams(sp, { replace: true });
          setTimeout(() => { tabUrlSyncPendingRef.current = false; }, 0);
        }
        return;
      }
    }

    // Non-progressive or valid progressive tab: sync state if different
    if (requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [topicsList.length, selectedTopic, searchParams, useProgressiveGeneration, availableTabsForTopics, content]);

  // Auto-switch to the first ready tab for current topic when content becomes available
  useEffect(() => {
    if (!useProgressiveGeneration) return; // Only for progressive mode
    const topicName = selectedTopic?.name;
    if (!topicName) return;

    const readyTabs = [...(availableTabsForTopics[topicName] || [])];
    // Consider content already loaded as ready as well
    if (content) {
      if (content.reading && !readyTabs.includes('reading')) readyTabs.push('reading');
      if (content.summary && !readyTabs.includes('summary')) readyTabs.push('summary');
      if ((content.videos?.length || 0) > 0 && !readyTabs.includes('videos')) readyTabs.push('videos');
      if ((content.quiz?.length || 0) > 0 && !readyTabs.includes('quiz')) readyTabs.push('quiz');
      const resourcesReady = ((content.resources?.length || 0) > 0) || !!content?.resourcesMetadata?.generatedAt;
      if (resourcesReady && !readyTabs.includes('resources')) readyTabs.push('resources');
    }

    if (readyTabs.length === 0) return;

    // Only enforce auto-switching for the FIRST topic while progressive generation is active,
    // to avoid exposing later topics prematurely.
    const firstTopicName = topicsList?.[0]?.name || topicsList?.[0];
    const isFirstTopic = topicName === firstTopicName;
    if (!isFirstTopic && isProgressiveGenerating && !allTopicsGenerated) return;
    // In reload/DB mode, avoid auto-switching away from a user-selected tab
    const isDbCourse = !!courseId && !String(courseId).startsWith('course_');
    if (loadScenario === 'reload' || isDbCourse) return;

    // If the current tab isn't ready, switch to the first ready tab
    if (!readyTabs.includes(activeTab)) {
      const preferredOrder = ['reading', 'summary', 'videos', 'quiz', 'resources'];
      const firstReady = preferredOrder.find(t => readyTabs.includes(t)) || readyTabs[0];
      if (firstReady) updateActiveTab(firstReady);
    }
  }, [availableTabsForTopics, selectedTopic?.name, content, useProgressiveGeneration, isProgressiveGenerating, allTopicsGenerated, topicsList]); // Remove activeTab to prevent loops

  // Cleanup debounced timer on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateActiveTab.current) {
        clearTimeout(debouncedUpdateActiveTab.current);
      }
    };
  }, []);

  // Effect to handle missing courseId: do NOT auto-generate; redirect to NotFound
  useEffect(() => {
    if (!courseId) {
      // Clear any stale ephemeral ID to avoid surprising redirects later
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem('currentCourseId'); } catch {}
      navigate('/not-found', { replace: true });
    }
  }, [courseId, navigate]);

  // Initialize course ID on first render
  useEffect(() => {
    const id = getCourseId();
  }, []);

  // Derive the count of completed topics for display purposes
  const completedTopicsCount = useMemo(() => {
    return ProLearningUtils.computeCompletedTopicsCount({
      topicsList,
      courseId: getCourseId(),
      hasValidSummary,
      contentStorageService
    });
  }, [topicsList, availableTabsForTopics, content, courseId, hasAnyContent, sectionGenerating, generatingTopics]);

  // Handle batch generation from ChatbotPage
  useEffect(() => {
    const handleContentGeneration = async () => {
      return CourseOrchestration.handleContentGeneration({
        courseId,
        proContentManager,
        setTopicsList,
        setAllTopicsGenerated,
        useProgressiveGeneration,
        courseTitle,
        topicParam,
        clearTopicFromBothStorages,
        initializeProgressiveGeneration,
        setProgressiveGenerationProgress,
        setAvailableTabsForTopics,
        loadProgressiveTopicContent,
        selectedTopic,
        setSelectedTopic,
        setIsProgressiveGenerating,
        startProgressiveGeneration,
        setLoadScenario,
        setShowSkeletons,
        setIsLoading,
        setLoadingStep,
        autoSaveToBackend,
        setIsBatchGenerating,
        setBatchGenerationProgress,
        setBatchGenerationStatus,
        loadTopicContent
      });
    };

    // Run the handler
    handleContentGeneration();
  }, []); // Remove courseId dependency to prevent multiple triggers

  // Auto-load first topic's content when all topics generation is completed
  useEffect(() => {
    // Only trigger when allTopicsGenerated becomes true and we don't have content loaded yet
    if (allTopicsGenerated && !content && topicsList.length > 0) {
      console.log('🎯 All topics generated! Auto-loading first topic content...');
      console.log('🎯 Current loading states - isLoading:', isLoading, 'isBatchGenerating:', isBatchGenerating);
      
      // Determine which topic to load
      const topicToLoad = topicParam || topicsList[0]?.name;
      
      if (topicToLoad) {
        console.log('📖 Loading content for topic:', topicToLoad);
        
        // Set the first topic as active if no topic is currently active
        if (!topicsList.some(t => t.isActive)) {
          const topicIndex = topicsList.findIndex(t => t.name === topicToLoad);
          if (topicIndex !== -1) {
            setTopicsList(prevTopics => 
              prevTopics.map((topic, index) => ({
                ...topic,
                isActive: index === topicIndex
              }))
            );
          }
        }
        
        // Ensure loading states are cleared first
        setIsLoading(false);
        setLoadingStep('');
        
        // Load the content
        loadTopicContent(topicToLoad);
        
        // Update URL if needed (only if no topic param exists)
        if (!topicParam && topicsList[0]?.name) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set("topic", topicsList[0].name);
          newSearchParams.set("tab", "reading"); // Default to reading tab
          navigate(`/pro-learning/${courseId}?${newSearchParams.toString()}`, { replace: true });
        }
      }
    }
  }, [allTopicsGenerated, content, topicsList, topicParam, courseId, navigate, searchParams]);

  // Safety mechanism: Clear loading states if content exists but loading states are still active
  useEffect(() => {
    if (content && (isLoading || loadingStep) && !isBatchGenerating) {
      console.log('🛠️ Safety mechanism: Clearing stuck loading states');
      console.log('🛠️ Content exists:', !!content, 'isLoading:', isLoading, 'loadingStep:', loadingStep);
      setIsLoading(false);
      setLoadingStep('');
    }
  }, [content, isLoading, loadingStep, isBatchGenerating]);

  // Debug: Log active tab's content whenever content, selectedTopic, or activeTab changes
  useEffect(() => {
    if (content && selectedTopic && activeTab) {
      const activeTabContent = content[activeTab];
      console.log('🎯 ACTIVE TAB CONTENT DEBUG:', {
        topic: selectedTopic.name,
        tab: activeTab,
        hasContent: !!activeTabContent,
        contentType: typeof activeTabContent,
        contentLength: Array.isArray(activeTabContent) ? activeTabContent.length : 
                      typeof activeTabContent === 'string' ? activeTabContent.length : 
                      activeTabContent && typeof activeTabContent === 'object' ? Object.keys(activeTabContent).length : 0,
        contentPreview: Array.isArray(activeTabContent) ? `Array with ${activeTabContent.length} items` :
                       typeof activeTabContent === 'string' ? activeTabContent.substring(0, 100) + (activeTabContent.length > 100 ? '...' : '') :
                       activeTabContent && typeof activeTabContent === 'object' ? Object.keys(activeTabContent).join(', ') : 
                       String(activeTabContent)
      });
    }
  }, [content, selectedTopic, activeTab]);

  // ...existing code...

  // Safety: when progressive generation marks a tab ready for the selected topic, hydrate content if empty
  useEffect(() => {
    if (!useProgressiveGeneration) return;
    const topicName = selectedTopic?.name;
    if (!topicName) return;
    const readyTabs = availableTabsForTopics[topicName] || [];
    const activeHasContent = (
      (activeTab === 'reading' && !!content?.reading) ||
      (activeTab === 'summary' && !!content?.summary) ||
      (activeTab === 'videos' && (content?.videos?.length || 0) > 0) ||
      (activeTab === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
      // Consider Resources "ready" if generation completed (metadata.generatedAt), even with 0 results
      (activeTab === 'resources' && (((content?.resources?.length || 0) > 0) || !!content?.resourcesMetadata?.generatedAt))
    );
    if (!activeHasContent && readyTabs.length > 0) {
      console.log('🧩 DEBUG: Hydrating content for', topicName, 'tabs ready:', readyTabs);
      loadProgressiveTopicContent(topicName, { showLoader: false });
    }
  }, [availableTabsForTopics, selectedTopic?.name, activeTab]);

  const renderTabContent = () => {
    // Get current topic name for quiz submission state
    const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam);
    const quizSubmitted = currentTopicName ? (quizSubmittedByTopic[currentTopicName] || false) : false;
    
    // Create setter that updates the topic-specific quiz submission state
    const setQuizSubmitted = (value) => {
      if (currentTopicName) {
        setQuizSubmittedByTopic(prev => ({
          ...prev,
          [currentTopicName]: value
        }));
      }
    };
    
    return renderTabContentHandler({
      selectedTopic,
      getCurrentTopicFromParam,
      topicParam,
      contentTopicName,
      content,
      activeTab,
      sanitizedReadingTopicName,
      sanitizedReading,
      isTopicBlocked,
      LoadingComponent,
      useProgressiveGeneration,
      availableTabsForTopics,
      isBatchGenerating,
      batchGenerationProgress,
      batchGenerationStatus,
      isGeneratingCourse,
      isLoading,
      loadingStep,
      isProgressiveGenerating,
      progressiveGenerationProgress,
      allTopicsGenerated,
      topicsList,
      handleProLearningStart,
      getCurrentTopic,
      courseTitle,
      tabs,
      copySuccessMap,
      handleCopyCode,
      openVideoModal,
      quizSubmitted,
      setQuizSubmitted,
      setContent,
      loadScenario,
      setActiveTab
    });
  };

  // Handle closing of batch generation status notification
  const { handleCloseBatchStatus } = ProLearningUtils.createBatchStatusHandler({
    setBatchGenerationProgress,
    setBatchGenerationStatus
  });

  return (
    <>
      {/* Only show navbar on desktop (>1024px) for immersive mobile/tablet experience */}
      {!isMobile && <Navbar initialStyle="light" />}
      <div className={`bg-gradient-to-br from-gray-50 via-white to-blue-50 ${!isMobile ? 'pt-14 lg:pt-0' : 'pt-0'}`}>
        <style>{`
          body {
            background: linear-gradient(to bottom right, #f9fafb, #ffffff, #eff6ff);
            min-height: 100vh;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .custom-syntax-highlight .token.punctuation,
          .custom-syntax-highlight .token.punctuation * {
            color: #fff !important;
            font-weight: 900 !important;
            text-shadow: 0 0 2px #fff, 0 0 1px #fff;
          }
          @keyframes slide-up {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
        


      {/* Main Content with Sidebar Layout */}
      <MainContentLayout
        sidebarVisible={sidebarVisible}
        handleSidebarToggle={handleSidebarToggle}
        tabs={tabs}
        activeTab={activeTab}
        updateActiveTab={updateActiveTab}
        updateActiveTabDesktop={updateActiveTabDesktop}
        content={content}
        contentTopicName={contentTopicName}
        renderTabContent={renderTabContent}
        topicsList={topicsList}
        selectedTopic={selectedTopic}
        topicParam={topicParam}
        getCurrentTopicFromParam={getCurrentTopicFromParam}
        isTopicBlocked={isTopicBlocked}
        handleTopicSelect={handleTopicSelect}
        completedTopics={completedTopics}
        toggleTopicCompletion={toggleTopicCompletion}
        useProgressiveGeneration={useProgressiveGeneration}
        availableTabsForTopics={availableTabsForTopics}
        isProgressiveGenerating={isProgressiveGenerating}
        progressiveGenerationProgress={progressiveGenerationProgress}
        loadProgressiveTopicContent={loadProgressiveTopicContent}
        isLoading={isLoading}
        loadScenario={loadScenario}
        setShowSkeletons={setShowSkeletons}
        setLoadingStep={setLoadingStep}
        courseTitle={courseTitle}
      />

      {/* Reading-specific Tutor Chat: visible when Reading tab is active and reading exists */}
      {(() => {
        try {
          const topicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam) || contentTopicName;
          const hasReading = !!(content && contentTopicName === topicName && typeof content.reading === 'string' && content.reading.trim().length > 0);
          const showTutor = activeTab === 'reading' && hasReading;
          return showTutor ? (
            <TutorChat
              readingContent={content.reading}
              topicName={topicName}
              courseId={getCourseId()}
              sidebarVisible={sidebarVisible}
            />
          ) : null;
        } catch { return null; }
      })()}
      
      {/* Global video modal */}
      <VideoModalComponent 
        isOpen={isVideoModalOpen}
        video={currentVideo}
        onClose={closeVideoModal}
      />
      </div>
    </>
  );
};

export default ProLearningPage; 
