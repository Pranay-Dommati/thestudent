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


const ProLearningPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  
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
  useEffect(() => {
    const checkIfCourseSaved = async () => {
      if (!courseId) return;
      const databaseCourse = await fetchCourseFromDB(courseId);
      if (databaseCourse) {
        console.log('✅ Course found in database');
      }
    };
    checkIfCourseSaved();
  }, [courseId]);

  // Set default topics and initialize with consistent course ID
  useEffect(() => {
    // Removed IndexedDB waits; Pro Learning no longer relies on IDB
    // Note: using component-scoped loadContentForReloadMode declared above
    
    // Handle reload scenario - content already exists, load quickly
    const handleReloadScenario = async (courseId, handleTopicSelection) => {
      console.log('⚡ Reload scenario: Loading existing content quickly');
      setIsLoading(true);
      setLoadingStep('Loading course content...');
      
      try {
        // Get all stored topics
        const storedTopics = await proContentManager.getStoredTopics(courseId);
        
        if (storedTopics.length > 0) {
          console.log('✅ Found stored topics for reload:', storedTopics.map(t => t.name));
          
          // Populate available tabs for all topics at once
          const tabsMap = {};
          for (const topic of storedTopics) {
            try {
              const content = await proContentManager.getStoredTopicContent(courseId, topic.name);
              if (content) {
                const availableTabs = [];
                if (content.reading) availableTabs.push('reading');
                if (content.summary) availableTabs.push('summary');
                if (content.videos?.length > 0) availableTabs.push('videos');
                if (content.quiz?.length > 0 || (content.quiz?.questions?.length > 0)) availableTabs.push('quiz');
                if (content.resources?.length > 0) availableTabs.push('resources');
                
                if (availableTabs.length > 0) {
                  tabsMap[topic.name] = availableTabs;
                }
              }
            } catch (error) {
              console.warn(`Failed to load content for topic: ${topic.name}`, error);
            }
          }
          
          // Set all available tabs at once
          if (Object.keys(tabsMap).length > 0) {
            setAvailableTabsForTopics(tabsMap);
            console.log('🎯 Set available tabs for reload:', Object.keys(tabsMap));
          }
          
          // Handle topic selection (this will load the specific topic content)
          handleTopicSelection(storedTopics);
          
          setIsLoading(false);
          setLoadingStep('');
          console.log('✅ Reload scenario completed successfully');
        } else {
          console.warn('⚠️ No stored topics found in reload scenario, falling back to generation');
          setIsLoading(false);
          return false; // Indicate fallback needed
        }
        return true;
      } catch (error) {
        console.error('❌ Error in reload scenario:', error);
        setIsLoading(false);
        return false; // Indicate fallback needed
      }
    };
    
    // Helper function to detect if this is first-time generation vs subsequent reload
    const detectLoadScenario = async (courseId) => {
      try {
        // Check if we have topics stored with content in ProContentManager
        const storedTopics = await proContentManager.getStoredTopics(courseId);
        
        if (storedTopics.length === 0) {
          return 'first-time'; // No topics stored at all
        }
        
        // Check if any topics have generated content
        let hasGeneratedContent = false;
        for (const topic of storedTopics) {
          const content = await proContentManager.getStoredTopicContent(courseId, topic.name);
          if (content && content.reading) {
            hasGeneratedContent = true;
            break;
          }
        }
        
        return hasGeneratedContent ? 'reload' : 'first-time';
      } catch (error) {
        console.error('Error detecting load scenario:', error);
        return 'first-time'; // Default to first-time on error
      }
    };
    
    const initializeCourseData = async () => {
      const currentCourseId = getCourseId();
      
      if (!currentCourseId) {
        return;
      }

      // Helper function to handle URL-based topic selection
      const handleTopicSelection = (topics) => {
        if (!topics || topics.length === 0) return;
        
        let matchingTopicIndex = -1;
        
        if (topicParam) {
          // Use robust parser; pick the first parsed topic for selection
          const parsedFromParam = parseTopicsFromParam(topicParam);
          const actualTopic = parsedFromParam.length > 0 ? parsedFromParam[0] : topicParam;
          
          // Strategy 1: Exact match (case insensitive)
          matchingTopicIndex = topics.findIndex(topic => 
            topic.name.toLowerCase().trim() === actualTopic.toLowerCase().trim()
          );
          
          // Strategy 2: Partial match
          if (matchingTopicIndex === -1) {
            matchingTopicIndex = topics.findIndex(topic => 
              topic.name.toLowerCase().includes(actualTopic.toLowerCase()) ||
              actualTopic.toLowerCase().includes(topic.name.toLowerCase())
            );
          }
        }
        
        // If no match found or no topicParam, use first topic
        if (matchingTopicIndex === -1) {
          matchingTopicIndex = 0;
        }
        
        const selectedTopicObject = topics[matchingTopicIndex];
        
        // Update topics with active state
        const updatedTopics = topics.map((topic, index) => ({
          ...topic,
          isActive: index === matchingTopicIndex
        }));
        
        // Update the topics list with active state
        setTopicsList(updatedTopics);
        setSelectedTopic(selectedTopicObject);
        
        // CRITICAL: Populate available tabs for all topics that have content
        const populateAvailableTabsForAllTopics = async () => {
          const currentCourseId = getCourseId();
          if (!currentCourseId) return;
          
          const tabsMap = {};
          for (const topic of updatedTopics) {
            try {
              const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topic.name);
              if (storedContent) {
                const availableTabs = [];
                if (storedContent.reading) availableTabs.push('reading');
                if (storedContent.summary) availableTabs.push('summary');
                if (storedContent.videos?.length > 0) availableTabs.push('videos');
                if (storedContent.quiz?.length > 0 || (storedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
                // Consider resources generation complete if metadata.generatedAt exists (even with 0 results)
                if ((storedContent.resources?.length > 0) || (storedContent.resourcesMetadata?.generatedAt)) availableTabs.push('resources');
                
                if (availableTabs.length > 0) {
                  tabsMap[topic.name] = availableTabs;
                }
              }
            } catch (error) {
              console.warn(`Failed to check content for topic: ${topic.name}`, error);
            }
          }
          
          if (Object.keys(tabsMap).length > 0) {
            setAvailableTabsForTopics(prev => ({
              ...prev,
              ...tabsMap
            }));
            console.log('🎯 Populated available tabs for topics:', Object.keys(tabsMap));
          }
        };
        
        // Run tab population asynchronously
        populateAvailableTabsForAllTopics();
        
        // Update URL if needed
        const selectedTopicName = selectedTopicObject.name;
        const currentTopicParam = getCurrentTopicFromParam(topicParam);
        
        if (selectedTopicName !== currentTopicParam) {
          const newSearchParams = new URLSearchParams(window.location.search);
          newSearchParams.set("topic", selectedTopicName);
          navigate(`/pro-learning/${currentCourseId}?${newSearchParams.toString()}`, { replace: true });
        }
        
        // Handle tab parameter from URL
        const currentTabParam = new URLSearchParams(window.location.search).get("tab");
        if (currentTabParam) {
          setActiveTab(currentTabParam);
        }
        
        // Auto-load content for the selected topic
        setTimeout(() => {
          if (loadScenario === 'reload') {
            // RELOAD MODE: Simple content loading without generation
            loadContentForReloadMode(selectedTopicName);
          } else {
            // FIRST-TIME MODE: Full generation logic
            loadTopicContent(selectedTopicName);
          }
        }, 100);
      };

  // Ensure ProContentManager cache is hydrated from backend/local storage before any synchronous getters
      try {
        await proContentManager.initializeCourse(currentCourseId);
        // Cache initialized; synchronous getters will now return data reliably
      } catch (e) {
        // If initialization fails, continue with other fallbacks below
      }

      // CRITICAL: Detect if this is first-time generation or subsequent reload
      const detectedScenario = await detectLoadScenario(currentCourseId);
      setLoadScenario(detectedScenario);
      console.log('🔍 Load scenario detected:', detectedScenario);

      if (detectedScenario === 'reload') {
        // RELOAD SCENARIO: Content already exists, load quickly
        const reloadSuccess = await handleReloadScenario(currentCourseId, handleTopicSelection);
        if (reloadSuccess) {
          return; // Successfully handled as reload
        }
        // If reload failed, fall through to first-time generation logic
        console.log('🔄 Reload scenario failed, falling back to generation logic');
      }

      // FIRST-TIME SCENARIO: Continue with existing generation logic
      console.log('🚀 First-time generation scenario - proceeding with generation flow');

      // Step 1: Check localStorage for course data
      const storedTopics = await proContentManager.getStoredTopics(currentCourseId);
      console.log('🔍 Step 1 - Stored topics check:', {
        courseId: currentCourseId,
        topicsFound: storedTopics.length,
        topics: storedTopics.map(t => t.name)
      });
      
      if (storedTopics.length > 0) {
        handleTopicSelection(storedTopics);
        return;
      }
      
      // Step 2: Check batch generation data (localStorage only; legacy payload)
      let foundFromBatch = false;
      try {
        let payload = null;
        if (typeof localStorage !== 'undefined') {
          const legacy = localStorage.getItem('proLearning_batchGeneration');
          if (legacy) {
            try { payload = JSON.parse(legacy); } catch {}
          }
        }
        if (payload && payload.courseId === currentCourseId && Array.isArray(payload.topics) && payload.topics.length > 0) {
          console.log('🔍 Step 2 - Batch generation data found (localStorage):', {
            courseId: currentCourseId,
            topicsFound: payload.topics.length,
            topics: payload.topics.map(t => t.name || t)
          });

          // Use handleTopicSelection for batch topics too
          handleTopicSelection(payload.topics);
          // Persist topics immediately so refresh shows them in sidebar
          try {
            const normalized = payload.topics.map((t, i) => ({ id: (t.id || i + 1), name: t.name || t }));
            proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
            await proContentManager.storeTopics(normalized, currentCourseId);
            console.log('✅ Batch topics stored successfully');
          } catch (e) {
            console.error('❌ Failed to store batch topics:', e);
          }
          foundFromBatch = true;
          return;
        }
      } catch (error) {
        // ignore and continue
      }

  // Step 3: Try to fetch from database
      const databaseCourse = await fetchCourseFromDB(currentCourseId);
      
      console.log('🗄️ Database course fetch result:', {
        courseId: currentCourseId,
        found: !!databaseCourse,
        topics: databaseCourse?.topics?.length || 0,
        courseName: databaseCourse?.course_name
      });
      
  if (databaseCourse) {
        // Transform database course data to the format expected by the UI
        if (databaseCourse.topics && databaseCourse.topics.length > 0) {
          console.log('🔍 Step 3 - Database topics found:', {
            courseId: currentCourseId,
            topicsFound: databaseCourse.topics.length,
            topics: databaseCourse.topics.map(t => t.topic_name)
          });
          // Find the index of the first topic that matches URL parameter
          let activeTopicIndex = -1;
          if (topicParam) {
            activeTopicIndex = databaseCourse.topics.findIndex(topic => 
              topic.topic_name.toLowerCase().trim() === topicParam.toLowerCase().trim()
            );
          }
          
          // If no match found and we have topics, use first topic
          if (activeTopicIndex === -1 && databaseCourse.topics.length > 0) {
            activeTopicIndex = 0;
          }
          
          const transformedTopics = databaseCourse.topics.map((topic, index) => ({
            id: index + 1,
            name: topic.topic_name,
            dbTopic: topic, // Keep reference to original database topic
            isActive: index === activeTopicIndex // Only ONE topic is active
          }));
          
          console.log('🔄 Transformed database topics:', {
            activeTopicIndex,
            topicParam,
            topics: transformedTopics.map(t => ({ name: t.name, isActive: t.isActive }))
          });
          
          // CRITICAL FIX: Differentiate between three cases:
          // 1. Fresh generation: course_TIMESTAMP_ID (e.g., course_1760070219554_jd70zm6tc)
          // 2. LocalStorage reload: Same course_TIMESTAMP_ID, reload page
          // 3. Database reload: UUID format (e.g., 7fce76ea-85c4-44c9-bcf9-77197b8d2ad2)
          
          // Check if courseId is a UUID (database reload) or timestamp-based (fresh/localStorage)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentCourseId);
          const isTimestampBased = currentCourseId.startsWith('course_');
          
          console.log('🔍 Course ID analysis:', {
            courseId: currentCourseId,
            isUUID,
            isTimestampBased,
            hasBatchMarker: !!(typeof localStorage !== 'undefined' && localStorage.getItem('proLearning_batchMarker'))
          });
          
          if (isUUID) {
            // Case 3: Database reload with UUID - completed course from database
            console.log('✅ Database reload (UUID) - loading completed course from database');
            setLoadScenario('reload');
            try {
              // Set course context explicitly with DB title to avoid any fallback generation flows
              const title = databaseCourse.title || databaseCourse.course_name || courseTitle || 'Saved Course';
              proContentManager.setCourse(title, currentCourseId);
            } catch {}
          } else if (isTimestampBased) {
            // Case 1 or 2: Fresh generation or localStorage reload with course_TIMESTAMP_ID
            // Check if there's an active batch marker indicating ongoing generation
            const hasBatchMarker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
            
            if (hasBatchMarker) {
              // Case 1: Fresh generation in progress
              console.log('🆕 Fresh generation (course_TIMESTAMP) - progressive generation mode');
              setLoadScenario('first-time');
            } else {
              // Case 2: LocalStorage reload - page refreshed during or after generation
              console.log('💾 LocalStorage reload (course_TIMESTAMP) - using cached content');
              setLoadScenario('reload');
            }
          } else {
            // Fallback: treat as reload
            console.log('⚠️ Unknown course ID format - defaulting to reload mode');
            setLoadScenario('reload');
          }
          
          handleTopicSelection(transformedTopics);
          // Persist DB topics so they’re available on refresh
          try {
            const normalized = transformedTopics.map(t => ({ id: t.id, name: t.name }));
            proContentManager.setCourse(databaseCourse.course_name || courseTitle || 'Database Course', currentCourseId);
            await proContentManager.storeTopics(normalized, currentCourseId);
            console.log('✅ Database topics stored successfully');
          } catch (e) {
            console.error('❌ Failed to store database topics:', e);
          }          // CRITICAL: Set course context in ProContentManager for database-loaded courses
          proContentManager.setCourse(databaseCourse.course_name, currentCourseId);
          
          return;
        }
      }
      
      // Step 3.5: If no stored/batch/db topics, but URL has topic(s), derive topics from URL
      // IMPORTANT: Handle both multiple topics (||| delimiter) and single-topic URLs
      // Only split by comma if ||| delimiter is present, otherwise treat as single topic
      if (topicParam && topicParam.includes('|||')) {
        try {
          const topicNames = parseTopicsFromParam(topicParam);
          if (topicNames.length > 1) { // Only if multiple topics in URL
            const derivedTopics = topicNames.map((name, idx) => ({ 
              id: idx + 1, 
              name,
              isActive: false // Will be set by handleTopicSelection
            }));
            
            // Use handleTopicSelection for URL-derived topics
            handleTopicSelection(derivedTopics);
            
            // Persist immediately so sidebar/progress work and refresh is safe
            try {
              proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
              await proContentManager.storeTopics(derivedTopics, currentCourseId);
            } catch (e) {
            }
            return; // We’ve initialized topics from URL; stop here
          }
        } catch (e) {
        }
      }
      // Single-topic URL: still initialize topics list so sidebar shows the current topic
      else if (topicParam) {
        try {
          const parsed = parseTopicsFromParam(topicParam);
          const actualTopic = (parsed[0] || '').trim();
          if (actualTopic) {
            const derivedTopics = [{ id: 1, name: actualTopic, isActive: false }];

            // Use handleTopicSelection to set active topic and sync URL/tab
            handleTopicSelection(derivedTopics);

            // Persist immediately so refresh shows topic in sidebar and progress isn’t 0/0
            try {
              proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
              await proContentManager.storeTopics(derivedTopics, currentCourseId);
            } catch (e) {
            }
            return; // Initialized from single-topic URL
          }
        } catch (e) {
        }
      }
      
  // Step 4: Fallback - if nothing is available, treat as invalid URL and redirect to NotFound
  const hasBatchMarker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
  if (!courseTitle && !topicParam && !hasBatchMarker && !foundFromBatch) {
        console.warn('⚠️ No course context found (no title, topics, batch, or DB). Redirecting to 404.');
        navigate('/not-found', { replace: true });
        return;
      } else {
        // Could show error message to user here
      }
    };

    // Properly await the async initialization
    initializeCourseData().catch(error => {
      console.error('❌ Failed to initialize course data:', error);
    });
  }, [courseTitle, courseId, topicParam]); // Add topicParam dependency for immediate sync
  
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

  // Lightweight debug logger to reduce console noise; enable by setting window.__PRO_LEARNING_DEBUG = true
  const debugLog = (...args) => {
    try {
      if (typeof window !== 'undefined' && window.__PRO_LEARNING_DEBUG) {
        // eslint-disable-next-line no-console
        console.log(...args);
      }
    } catch {}
  };

  // Helper to set content while preserving FIRST reading and controlling sanitization
  // Behavior:
  // - First reading wins; later variants are ignored to prevent visual flips
  // - During progressive generation (or when sourceLabel starts with 'progressive:'),
  //   we DO NOT sanitize the first reading — we render it raw immediately
  // - Otherwise, first reading is pre-sanitized to avoid initial formatting flashes
  const setContentWithSanitization = (incoming, sourceLabel = 'unknown') => {
    // Only consider an existing reading if it belongs to the CURRENT selected topic
    const belongsToCurrentTopic = !!(contentTopicName && selectedTopic?.name && contentTopicName === selectedTopic.name);
    const hasExistingReading = !!(belongsToCurrentTopic && content && typeof content.reading === 'string' && content.reading.trim().length);

    // Normalize incoming object (clone so we can safely adjust fields)
    const newContent = incoming ? { ...incoming } : incoming;

    if (newContent && typeof newContent.reading === 'string') {
      // If we already have a reading shown, never overwrite it with a later variant
      if (hasExistingReading) {
        const oldHash = _debugHash(content.reading);
        const newHash = _debugHash(newContent.reading);
        if (newContent.reading !== content.reading) {
          console.warn('🔒 [READING-PRESERVE] Incoming reading ignored to preserve first render', {
            source: sourceLabel,
            topicParam,
            contentTopicName,
            selectedTopic: selectedTopic?.name,
            oldLen: content.reading?.length || 0,
            newLen: newContent.reading?.length || 0,
            oldHash,
            newHash,
            newPreview: _short(newContent.reading)
          });
          // Preserve existing reading and do NOT re-sanitize
          newContent.reading = content.reading;
        } else {
          console.log('ℹ️ [READING-SAME] Incoming reading equals existing', { source: sourceLabel, hash: oldHash });
        }
        // Keep current sanitizedReading and readiness as-is
      } else if (newContent.reading.trim()) {
        // First time reading is arriving
        console.log('✨ [READING-FIRST] Accepting first reading from', {
          source: sourceLabel,
          topicParam,
          contentTopicName,
          selectedTopic: selectedTopic?.name,
          len: newContent.reading.length,
          hash: _debugHash(newContent.reading),
          preview: _short(newContent.reading)
        });
        
        // ALWAYS sanitize reading content IMMEDIATELY when it arrives (for ALL topics)
        // This ensures proper markup from first render and prevents broken code blocks
        // The sanitized version is stored and will never be re-sanitized (first reading wins)
        const sanitized = preSanitizeMarkdown(newContent.reading);
        console.log('🧹 [SANITIZE] Pre-sanitized reading content', {
          source: sourceLabel,
          originalLen: newContent.reading.length,
          sanitizedLen: sanitized.length,
          originalHash: _debugHash(newContent.reading),
          sanitizedHash: _debugHash(sanitized)
        });
        setSanitizedReading(sanitized);
        setReadingRenderReady(true);
        try {
          const currentTopic = selectedTopic?.name || getCurrentTopicFromParam(topicParam) || null;
          setSanitizedReadingTopicName(currentTopic);
        } catch {}
      } else {
        // Empty reading coming in: preserve existing sanitized reading if present
        console.log('⚪ [READING-EMPTY] No reading in payload', { 
          source: sourceLabel,
          readingType: typeof newContent.reading,
          readingLength: newContent.reading?.length || 0,
          readingTrimLength: newContent.reading?.trim()?.length || 0,
          readingPreview: newContent.reading ? newContent.reading.substring(0, 100) : 'N/A'
        });
        if (!(sanitizedReading && String(sanitizedReading).trim().length > 0)) {
          setSanitizedReading('');
          setReadingRenderReady(false);
          setSanitizedReadingTopicName(null);
        } else {
          // Keep current sanitized reading as-is
          debugLog('🛡️ [READING-PRESERVE-EMPTY] Keeping existing sanitized reading');
        }
      }
    } else {
      // No reading field provided: do not clear existing sanitized reading
      // This can happen when other tabs update (videos/resources/quiz). Preserve reading UI.
      debugLog('🛡️ [READING-PRESERVE-NONE] No reading field provided; preserving existing sanitized state');
    }
    // Merge strategy: do NOT wipe existing non-empty tabs when partial updates arrive
    const prev = content || {};
    const merged = { ...prev };

    const isNonEmptyString = (s) => typeof s === 'string' && s.trim().length > 0;
    const isNonEmptyArray = (a) => Array.isArray(a) && a.length > 0;

    // Reading: if provided, keep the adjusted newContent.reading; else preserve previous
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'reading')) {
      merged.reading = newContent.reading;
    }

    // Summary: only overwrite if new has non-empty; else keep existing if it has content
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'summary')) {
      merged.summary = isNonEmptyString(newContent.summary)
        ? newContent.summary
        : (isNonEmptyString(prev.summary) ? prev.summary : (newContent.summary || ''));
    }

    // Videos: only overwrite if new has items; else keep existing if it has items
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'videos')) {
      merged.videos = isNonEmptyArray(newContent.videos)
        ? newContent.videos
        : (isNonEmptyArray(prev.videos) ? prev.videos : (newContent.videos || []));
    }

    // Quiz: support both array and object-with-questions; avoid wiping non-empty with empty
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'quiz')) {
      merged.quiz = quizHasItems(newContent.quiz)
        ? newContent.quiz
        : (quizHasItems(prev.quiz) ? prev.quiz : (newContent.quiz || (prev.quiz || [])));
    }

    // Resources: reflect current state even if empty (so empty-state can render), and always keep metadata if provided
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'resources')) {
      merged.resources = Array.isArray(newContent.resources) ? newContent.resources : (prev.resources || []);
    }
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'resourcesMetadata')) {
      merged.resourcesMetadata = newContent.resourcesMetadata || prev.resourcesMetadata || null;
    }

    // If newContent contains other keys (stats, metadata, etc.), shallow-merge them without clobbering known ones
    if (newContent) {
      for (const k of Object.keys(newContent)) {
        if (!(k in merged)) merged[k] = newContent[k];
      }
    }

    // Log non-reading tabs lengths for traceability
    try {
      debugLog('🧩 [CONTENT-SET]', {
        source: sourceLabel,
        topicParam,
        contentTopicName,
        selectedTopic: selectedTopic?.name,
        readingLen: (merged?.reading || '').length,
        summaryLen: (merged?.summary || '').length,
        quizCount: Array.isArray(merged?.quiz) ? merged.quiz.length : (merged?.quiz?.questions?.length || 0),
        videosCount: Array.isArray(merged?.videos) ? merged.videos.length : 0,
        resourcesCount: Array.isArray(merged?.resources) ? merged.resources.length : 0
      });
    } catch {}

    setContent(merged);
  };

  // State-gated sanitized reading to ensure we never paint raw content
  const [sanitizedReading, setSanitizedReading] = useState('');
  const [readingRenderReady, setReadingRenderReady] = useState(false);
  // Track which topic the sanitized reading belongs to, to avoid readiness mismatches
  const [sanitizedReadingTopicName, setSanitizedReadingTopicName] = useState(null);
  // Note: Sanitization is now handled immediately in setContentWithSanitization helper
  // No useEffect needed since sanitization happens synchronously when content is set

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
  }, [courseTitle, GEMINI_API_KEY]);

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

  // Load content for initially active topic using new storage system
  useEffect(() => {
    // If this page was opened for an already-saved course (DB reload),
    // skip this effect entirely to avoid kicking off any new generation.
    if (loadScenario === 'reload') {
      return;
    }
    // Skip if we're handling URL-based topic loading directly or during direct URL generation
    if (isDirectUrlGeneration || (topicParam && !topicsList.length)) {
      return; // Let the URL topic loading useEffect handle this
    }
    
    // Check if we're in fresh course creation mode using consistent logic
    const shouldSkipOld = shouldSkipOldCachedContent();
    const progressiveStatus = getProgressiveGenerationStatus();
    const isProgressiveGeneration = progressiveStatus && progressiveStatus.isGenerating;
    const shouldForceGeneration = shouldSkipOld || isProgressiveGeneration;
    
    if (shouldForceGeneration) {
  debugLog('🔄 DEBUG: Fresh course creation detected - skipping cached content loading in initial topic effect');
      return;
    }
    
    if (topicsList.length > 0 && courseTitle) {
      const activeTopic = topicsList.find(t => t.isActive);
      if (activeTopic) {
        // CRITICAL: Check if we're already generating content for this topic
        const generationKey = `${getCourseId()}_${activeTopic.name}`;
        if (generatingContentRef.current.has(generationKey)) {
          console.log('🛑 Already generating content for:', activeTopic.name, '- skipping duplicate request');
          return;
        }
        
        // If we already have content in state, avoid hydrating from storage to prevent overwriting
        // progressive content with a different post-generation copy.
        if (content && (content.reading || content.summary || content.videos?.length || content.quiz?.length || content.resources?.length)) {
          console.log('🛡️ Skipping stored content hydration to preserve already displayed content for:', activeTopic.name);
          setIsLoading(false);
          setShowSkeletons(false);
          return;
        }

        // Check if content exists in storage for the active topic
        const storedContent = getStoredTopicContent(activeTopic.name, courseTitle, getCourseId());
        
        if (storedContent) {
            setContentWithSanitization(storedContent, 'initialActiveTopic:stored');
          
          // Parse reading content into sections if available
          if (storedContent.reading) {
            const sections = parseReadingSections(storedContent.reading);
            setReadingSections(sections);
            setReadingSectionIndex(0);
          }
          
          setIsLoading(false);
          setShowSkeletons(false);
        } else if (isBatchGenerating) {
          // Show loading if content is being generated in batch
          setIsLoading(true);
          setShowSkeletons(true);
          setLoadingStep(`Generating content for ${activeTopic.name}... Please wait.`);
          
          // Check periodically if content becomes available in storage
          const checkContentInterval = setInterval(() => {
            const newStoredContent = getStoredTopicContent(activeTopic.name, courseTitle, getCourseId());
            if (newStoredContent) {
              setContentWithSanitization(newStoredContent, 'initialActiveTopic:storedPolling');
              
              // Parse reading content into sections
              if (newStoredContent.reading) {
                const sections = parseReadingSections(newStoredContent.reading);
                setReadingSections(sections);
                setReadingSectionIndex(0);
              }
              
              setIsLoading(false);
              setShowSkeletons(false);
              clearInterval(checkContentInterval);
            }
          }, 1000); // Check every second
          
          // Clean up interval
          return () => clearInterval(checkContentInterval);
        } else {
          // If not in batch generation and no stored content, load from ProContentManager
          setIsLoading(true);
          setShowSkeletons(true);
          setSectionGenerating(true);
          setGeneratingTopics(prev => [...prev, activeTopic.name]);
          
          // Pass database topic data if available
          const dbTopic = activeTopic?.dbTopic || null;
          
          // Mark this topic as being generated
          const generationKey = `${getCourseId()}_${activeTopic.name}`;
          generatingContentRef.current.add(generationKey);
          console.log('🚀 Starting content generation for:', activeTopic.name);
          
          proContentManager.getTopicContent(activeTopic.name, generateProContent, dbTopic)
            .then(result => {
              // Remove from generating set when done
              generatingContentRef.current.delete(generationKey);
              lastGeneratedTopicRef.current = activeTopic.name;
              console.log('✅ Completed content generation for:', activeTopic.name);
              
              setSectionGenerating(false);
              setGeneratingTopics(prev => prev.filter(t => t !== activeTopic.name));
              if (result && result.content) {
                setContentWithSanitization(result.content, 'initialActiveTopic:getTopicContent');
                
                // Parse reading content into sections
                if (result.content && result.content.reading) {
                  const sections = parseReadingSections(result.content.reading);
                  setReadingSections(sections);
                  setReadingSectionIndex(0);
                } else {
                  setReadingSections([]);
                  setReadingSectionIndex(0);
                }
                
              }
              setIsLoading(false);
              setShowSkeletons(false);
            })
            .catch(error => {
              // Remove from generating set on error too
              generatingContentRef.current.delete(generationKey);
              console.error('❌ Failed to load content for:', activeTopic.name, error);
              setIsLoading(false);
              setShowSkeletons(false);
            });
        }
      }
    } else if (topicParam && !topicsList.length) {
      // If no topics list but we have a topic from URL, handle content loading/generation
      const actualTopic = getCurrentTopicFromParam(topicParam);
      const currentCourseId = getCourseId();
      
      if (currentCourseId) {
        // CRITICAL: Check if we're already generating content for this topic
        const generationKey = `${currentCourseId}_${actualTopic}`;
        if (generatingContentRef.current.has(generationKey)) {
          console.log('🛑 Already generating content for:', actualTopic, '- skipping duplicate URL request');
          return;
        }
        
        setIsLoading(true);
        setShowSkeletons(true);
        setLoadingStep(`Loading content for ${actualTopic}...`);
        
        // Mark this topic as being generated
        generatingContentRef.current.add(generationKey);
        console.log('🚀 Starting URL-based content generation for:', actualTopic);
        
        // First try to get database topic data
        const getDatabaseTopicData = async () => {
          const databaseCourse = await fetchCourseFromDB(currentCourseId);
          if (databaseCourse?.topics) {
            // Set course context with database course name if courseTitle is empty
            const courseName = courseTitle || databaseCourse.course_name || "Database Course";
            proContentManager.setCourse(courseName, currentCourseId);
            console.log('✅ ProContentManager initialized for direct URL with course:', courseName);
            
            return {
              dbTopic: databaseCourse.topics.find(topic => topic.topic_name === actualTopic),
              courseName: databaseCourse.course_name
            };
          }
          return null;
        };
        
  // Use ProContentManager to handle content retrieval/generation
  proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
        
        getDatabaseTopicData().then(result => {
          const dbTopic = result?.dbTopic || null;
          return proContentManager.getTopicContent(actualTopic, generateProContent, dbTopic);
        })
          .then(result => {
            // Remove from generating set when done
            generatingContentRef.current.delete(generationKey);
            lastGeneratedTopicRef.current = actualTopic;
            console.log('✅ Completed URL-based content generation for:', actualTopic);
            
            if (result?.content?.reading) {
              setContentWithSanitization(result.content, 'direct:getTopicContentWithReading');
              const sections = parseReadingSections(result.content.reading);
              setReadingSections(sections);
              setReadingSectionIndex(0);
              console.log('✅ Content ready:', result.source === 'storage' ? 'from storage' : result.source === 'database' ? 'from database' : 'newly generated');
            } else {
              throw new Error('Invalid content received');
            }
          })
          .catch(error => {
            // Remove from generating set on error
            generatingContentRef.current.delete(generationKey);
            console.error('❌ Failed to load/generate content for:', actualTopic, error);
          })
          .finally(() => {
            setIsLoading(false);
            setShowSkeletons(false);
          });
      }
    }
  }, [topicsList, courseTitle, isBatchGenerating, topicParam, isDirectUrlGeneration]);

  // Watch for content updates and trigger regeneration if content is empty
  const [regenerationAttempted, setRegenerationAttempted] = useState(false);
  
  // Reset regeneration flag when topic changes
  useEffect(() => {
    setRegenerationAttempted(false);
    setIsDirectUrlGeneration(false); // Reset direct generation flag when topic changes
  }, [topicParam]);
  

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

  // Helper function to load topic content from batch-generated data
  const loadTopicContent = async (topicName) => {
    const currentCourseId = getCourseId();
    if (!currentCourseId) return;

    // During active progressive generation or fresh-batch window, avoid hydrating from storage/DB
    // to ensure the reading shown is the raw progressive one.
    try {
      if (useProgressiveGeneration) {
        const status = getProgressiveGenerationStatus();
        const activelyGenerating = !!(status && status.isGenerating);
        const freshBatch = shouldSkipOldCachedContent();
        if (activelyGenerating || freshBatch) {
          await loadProgressiveTopicContent(topicName, { showLoader: true });
          return;
        }
      }
    } catch {}

    // OPTIMIZATION: Check if content is already loaded for this topic and user hasn't switched topics
    if (selectedTopic?.name === topicName && content && content.reading && !isLoading) {
      console.log('🚀 Content already loaded for topic:', topicName, '- updating tabs and skipping reload');
      setContentTopicName(topicName);
      
      // CRITICAL: Even if content is loaded, always update available tabs for the topic
      const availableTabs = [];
      if (content.reading) availableTabs.push('reading');
      if (content.summary) availableTabs.push('summary');
      if (content.videos?.length > 0) availableTabs.push('videos');
      if (content.quiz?.length > 0 || (content.quiz?.questions?.length > 0)) availableTabs.push('quiz');
  // Consider resources generation complete if metadata.generatedAt exists (even with 0 results)
  if ((content.resources?.length > 0) || (content.resourcesMetadata?.generatedAt)) availableTabs.push('resources');
      
      setAvailableTabsForTopics(prev => {
        const prevTabs = prev[topicName] || [];
        const same = prevTabs.length === availableTabs.length && prevTabs.every((t, i) => t === availableTabs[i]);
        if (same) return prev; // idempotent - avoid unnecessary state update
        return {
          ...prev,
          [topicName]: availableTabs
        };
      });
      
      console.log('🎯 Updated available tabs for already loaded topic:', topicName, availableTabs);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStep(`Loading ${topicName} content...`);

      // Attempting to load content for topic
      // Course ID: currentCourseId
      
      // Try multiple ways to get stored content
      let storedContent = null;
      
      // Method 1: Try the ProContentManager method
      storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
      // Method 1 (ProContentManager): result
      
      // Method 2: Try direct storage access if Method 1 fails
      if (!storedContent) {
        try {
          const courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
          // Course content structure
          
          if (courseContent && courseContent.topics) {
            storedContent = courseContent.topics[topicName]?.content;
            console.log('🔍 Method 2 (Direct access):', storedContent ? 'Found' : 'Not found');
          }
        } catch (err) {
          console.warn('🔍 Method 2 failed:', err);
        }
      }
      
      // Method 3: Try checking with different topic name formats if still not found
      if (!storedContent && topicName) {
        const courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
        if (courseContent && courseContent.topics) {
          // Try to find topic with similar names (case insensitive, trimmed)
          const topicKeys = Object.keys(courseContent.topics);
          const matchingKey = topicKeys.find(key => 
            key.toLowerCase().trim() === topicName.toLowerCase().trim()
          );
          
          if (matchingKey) {
            storedContent = courseContent.topics[matchingKey]?.content;
            console.log('🔍 Method 3 (Case insensitive):', storedContent ? `Found with key: ${matchingKey}` : 'Not found');
          }
        }
      }
      
      if (storedContent && (storedContent.reading || storedContent.summary)) {
        console.log('✅ Successfully found stored content for:', topicName);
        
        // Transform stored content to the expected format
        const transformedContent = {
          // Do NOT inject placeholder reading; keep empty string so first real reading can win
          reading: typeof storedContent.reading === 'string' ? storedContent.reading : '',
          summary: storedContent.summary || 'Summary not available',
          quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
          videos: storedContent.videos || [],
          resources: storedContent.resources || []
        };
        
  setContentWithSanitization(transformedContent, 'reload:transformedContent');
  setContentTopicName(topicName);
        
        // Update available tabs for the topic based on loaded content
        const availableTabs = [];
        if (transformedContent.reading) availableTabs.push('reading');
        if (transformedContent.summary) availableTabs.push('summary');
        if (transformedContent.videos?.length > 0) availableTabs.push('videos');
        if (transformedContent.quiz?.length > 0 || (transformedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
        if (transformedContent.resources?.length > 0) availableTabs.push('resources');
        
        setAvailableTabsForTopics(prev => {
          const prevTabs = prev[topicName] || [];
          const same = prevTabs.length === availableTabs.length && prevTabs.every((t, i) => t === availableTabs[i]);
          if (same) return prev;
          return {
            ...prev,
            [topicName]: availableTabs
          };
        });
        
        // Parse and set reading sections
        if (storedContent.reading) {
          const sections = parseReadingSections(storedContent.reading);
          setReadingSections(sections);
          setReadingSectionIndex(0);
        }
        
        console.log('✅ Content loaded successfully from storage');
        setIsLoading(false);
        setLoadingStep('');
        return; // CRITICAL: Exit here to avoid continuing to database fetch logic
      } else {
        // Fallback to generating content if not in storage
        // No stored content found, attempting database then generation
        // Available topic keys from storage
        
        // CRITICAL: Set course context in ProContentManager before calling getTopicContent
        proContentManager.setCourse(courseTitle || "Database Course", currentCourseId);
        
        // Try to get database topic data - first check if it's already in the topics list
        let dbTopic = null;
        const topicWithDbData = topicsList.find(t => t.name === topicName && t.dbTopic);
        if (topicWithDbData) {
          dbTopic = topicWithDbData.dbTopic;
          console.log('🗄️ Using cached database topic:', {
            topicName,
            hasDbTopic: !!dbTopic,
            dbTopicKeys: dbTopic ? Object.keys(dbTopic) : [],
            hasReadingMaterial: !!dbTopic?.reading_material,
            hasSummary: !!dbTopic?.summary,
            hasVideos: !!dbTopic?.videos?.length,
            hasQuiz: !!dbTopic?.quiz_questions?.length,
            hasResources: !!dbTopic?.resources?.length
          });
        } else {
          // Fallback: fetch from database if not cached
          console.log('⚠️ No cached database topic found, fetching from database');
          const databaseCourse = await fetchCourseFromDB(currentCourseId);
          if (databaseCourse?.topics) {
            dbTopic = databaseCourse.topics.find(topic => topic.topic_name === topicName);
            console.log('🗄️ Fetched database topic:', dbTopic ? 'Found' : 'Not found');
          }
        }
        
        console.log('🔄 Calling proContentManager.getTopicContent with:', {
          topicName,
          hasDbTopic: !!dbTopic,
          hasGenerateCallback: !!generateProContent
        });
        
        const result = await proContentManager.getTopicContent(topicName, generateProContent, dbTopic);
        
        console.log('📝 ProContentManager result for topic:', topicName, {
          hasResult: !!result,
          source: result?.source,
          hasContent: !!result?.content,
          contentKeys: result?.content ? Object.keys(result.content) : []
        });
        
        if (result && result.content) {
          console.log('✅ Setting content for topic:', topicName, {
            hasReading: !!result.content.reading,
            hasSummary: !!result.content.summary,
            hasVideos: !!result.content.videos?.length,
            hasQuiz: !!result.content.quiz?.length,
            hasResources: !!result.content.resources?.length
          });
          
          setContentWithSanitization(result.content, 'direct:generateProContent');
          setContentTopicName(topicName);
          
          // Update available tabs for the topic based on generated content
          const availableTabs = [];
          if (result.content.reading) availableTabs.push('reading');
          if (result.content.summary) availableTabs.push('summary');
          if (result.content.videos?.length > 0) availableTabs.push('videos');
          if (result.content.quiz?.length > 0 || (result.content.quiz?.questions?.length > 0)) availableTabs.push('quiz');
          if (result.content.resources?.length > 0) availableTabs.push('resources');
          
          setAvailableTabsForTopics(prev => ({
            ...prev,
            [topicName]: availableTabs
          }));
          
          // Parse and set reading sections for generated content
          if (result.content && result.content.reading) {
            const sections = parseReadingSections(result.content.reading);
            setReadingSections(sections);
            setReadingSectionIndex(0);
          }
          
          // Clear loading states after content is successfully set
          setIsLoading(false);
          setLoadingStep('');
          
          // Content generated and loaded
        } else {
          throw new Error('Failed to generate or retrieve content');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load topic content:', error);
      const errorContent = {
        reading: 'Failed to load content. Please try again.',
        summary: 'Failed to load summary.',
        quiz: { questions: [], currentQuestion: 0 },
        videos: [],
        resources: []
      };
  setContentWithSanitization(errorContent, 'progressive:loadError');
  setContentTopicName(topicName);
      
      // Even for error content, set the reading tab as available
      setAvailableTabsForTopics(prev => ({
        ...prev,
        [topicName]: ['reading', 'summary'] // At least show reading/summary tabs for error content
      }));
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Helper function to load topic content from progressive generation data
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
  const [quizSubmitted, setQuizSubmitted] = useState(false); // Track if quiz is submitted

  // Guard to avoid double-switching when URL sync is pending
  const tabUrlSyncPendingRef = useRef(false);
  
  // Ref for debounced tab updates
  const debouncedUpdateActiveTab = useRef(null);
  
  // Track content generation to prevent infinite loops
  const generatingContentRef = useRef(new Set());
  const lastGeneratedTopicRef = useRef(null);

  // Tab navigation handlers
  const { updateActiveTab, updateActiveTabDesktop, updateTopicInUrl } = ProLearningUtils.createTabNavigationHandlers({
    setActiveTab,
    setSearchParams,
    searchParams,
    tabUrlSyncPendingRef,
    debouncedUpdateActiveTab
  });

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

  // Course ID management handlers
  const { generateCourseId, getCourseId, setAndNavigateToCourseId } = ProLearningUtils.createCourseIdHandlers({
    courseId,
    navigate
  });

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

  // Enhanced loading component with batch generation support
  const LoadingComponent = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xs sm:max-w-md">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50"></div>
          
          {/* Main loading icon */}
          <div className="relative z-10 mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <BiLoaderAlt className="text-xl sm:text-2xl text-white animate-spin" />
            </div>
            {/* Floating particles */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>

          {/* Progress section for batch generation */}
          {isBatchGenerating && (
            <div className="mb-4 sm:mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 sm:mb-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                  style={{ width: `${batchGenerationProgress}%` }}
                ></div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mb-2">
                {batchGenerationProgress}% Complete
              </div>
            </div>
          )}

          {/* Status messages */}
          <div className="relative z-10 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
              {isBatchGenerating ? '🚀 Generating Your Course' : 'Preparing Content'}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              {isBatchGenerating ? batchGenerationStatus : (loadingStep || 'Setting up your learning materials...')}
            </p>
          </div>

          {/* Content types being generated */}
          {isBatchGenerating && (
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center justify-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <FaBookOpen className="text-blue-500 mr-1 sm:mr-2 text-sm sm:text-base" />
                <span className="text-xs text-blue-700 font-medium">Reading</span>
              </div>
              <div className="flex items-center justify-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                <FaBrain className="text-purple-500 mr-1 sm:mr-2 text-sm sm:text-base" />
                <span className="text-xs text-purple-700 font-medium">Summary</span>
              </div>
              <div className="flex items-center justify-center p-2 sm:p-3 bg-red-50 rounded-lg">
                <FaVideo className="text-red-500 mr-1 sm:mr-2 text-sm sm:text-base" />
                <span className="text-xs text-red-700 font-medium">Videos</span>
              </div>
              <div className="flex items-center justify-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <FaQuestionCircle className="text-green-500 mr-1 sm:mr-2 text-sm sm:text-base" />
                <span className="text-xs text-green-700 font-medium">Quiz</span>
              </div>
            </div>
          )}

          {/* Loading dots animation */}
          <div className="relative z-10">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
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
      isGeneratingCourse,
      isLoading,
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
      <Navbar initialStyle="light" />
      <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-14 lg:pt-0">
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
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('proLearning_batchGeneration');
                localStorage.removeItem('proLearning_batchMarker');
              }
            } catch {}
            animation: slide-up 0.3s ease-out forwards;
          }
        `}</style>
        
      {/* Batch Generation Status Indicator - REMOVED to eliminate duplicate loading cards */}
      {/* 
      <BatchGenerationStatus
        isGenerating={isBatchGenerating}
        progress={batchGenerationProgress}
        status={batchGenerationStatus}
        onClose={handleCloseBatchStatus}
      />
      */}
      
      {/* Enhanced Header */}
      {/* <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50"> ... </header> */}

      {/* Main Content with Sidebar Layout */}
      <div className="relative">
        {/* Main Content Area */}
        <div className={`transition-all duration-300 ${
          sidebarVisible 
            ? 'lg:mr-[400px]' // Add right margin on large screens when sidebar is visible
            : ''
        }`}>
          <div className="w-full px-0 lg:px-6 py-0 lg:pt-20 lg:pb-4 max-w-full overflow-x-hidden">{/* Remove mobile padding for edge-to-edge design, add enough top padding for desktop to clear navbar */}
              {/* Enhanced Tab Navigation - Desktop Only */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border mb-6 hidden lg:block overflow-hidden">
                <div className="p-2">
                  <nav className="flex space-x-2 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                    {tabs.map((tab) => {
                      const IconComponent = tab.icon;
                      const isActive = activeTab === tab.id;
                      
                      // Derive current topic name (fallback to URL param for single-topic flows)
                      const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam);
                      
                      // Check if current topic is blocked (2nd topic onwards)
                      const currentTopicBlocked = currentTopicName ? isTopicBlocked(currentTopicName) : false;
                      
                      // Check if tab has content already (treat as available even if tabs map isn’t filled yet)
                      const hasTabContent = !!content && contentTopicName === currentTopicName && (
                        (tab.id === 'reading' && !!content?.reading && String(content.reading).trim().length > 0) ||
                        (tab.id === 'summary' && !!content?.summary && String(content.summary).trim().length > 0) ||
                        (tab.id === 'videos' && Array.isArray(content?.videos) && content.videos.length > 0) ||
                        (tab.id === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
                        // Treat resources as ready if array has items OR metadata indicates completion
                        (tab.id === 'resources' && (
                          (Array.isArray(content?.resources) && content.resources.length > 0) ||
                          !!content?.resourcesMetadata?.generatedAt ||
                          // Reload/DB mode fallback: if other tabs exist, allow clicking to show empty state
                          (loadScenario === 'reload' && (
                            (!!content?.reading && String(content.reading).trim().length > 0) ||
                            (!!content?.summary && String(content.summary).trim().length > 0) ||
                            (Array.isArray(content?.videos) && content.videos.length > 0) ||
                            (Array.isArray(content?.quiz) && content.quiz.length > 0) ||
                            (!!content?.quiz?.questions && Array.isArray(content?.quiz?.questions) && content.quiz.questions.length > 0)
                          ))
                        ))
                      );

                      // Check if tab content is available for progressive generation
                      let isTabAvailable = true;
                      if (useProgressiveGeneration) {
                        // Progressive gating per topic: if the topic is blocked (no tabs ready yet), keep hidden; otherwise allow ready tabs.
                        // Reading-first rule: require reading to be ready before exposing other tabs while generating
                        const readingReady = ((currentTopicName && availableTabsForTopics[currentTopicName]?.includes('reading')) ||
                          (content && contentTopicName === currentTopicName && typeof content.reading === 'string' && content.reading.trim().length > 0));
                        // In reload/DB mode, if other tabs exist, let users click Resources to see the empty-state UI
                        const otherTabsPresent = (
                          (!!content?.reading && String(content.reading).trim().length > 0) ||
                          (!!content?.summary && String(content.summary).trim().length > 0) ||
                          (Array.isArray(content?.videos) && content.videos.length > 0) ||
                          (Array.isArray(content?.quiz) && content.quiz.length > 0) ||
                          (!!content?.quiz?.questions && Array.isArray(content?.quiz?.questions) && content.quiz.questions.length > 0)
                        );

                        if (currentTopicBlocked) {
                          isTabAvailable = false;
                        } else {
                          isTabAvailable = ((currentTopicName && availableTabsForTopics[currentTopicName]?.includes(tab.id)) || hasTabContent);
                          // Relax gating for Resources in reload mode so users can see the empty state
                          if (!isTabAvailable && loadScenario === 'reload' && tab.id === 'resources' && otherTabsPresent) {
                            isTabAvailable = true;
                          }
                          if ((isProgressiveGenerating) && tab.id !== 'reading' && !readingReady) {
                            isTabAvailable = false;
                          }
                        }
                        
                        // Debug logging for resources tab
                        // Avoid render-time logging to prevent noisy consoles and potential loops
                      }
                      
                      // Tab is disabled if topic is blocked OR if progressive tab is not available
                      const isTabDisabled = currentTopicBlocked || (useProgressiveGeneration && !isTabAvailable);
                      
                      // Avoid render-time logging to prevent noisy consoles and potential loops
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            // DIAGNOSTIC LOGGING FOR TAB CLICK
                            console.log(`🖱️ [TAB CLICK] User clicked ${tab.label} tab`, {
                              tabId: tab.id,
                              timestamp: new Date().toISOString(),
                              currentTopicName,
                              currentTopicBlocked,
                              isTabDisabled,
                              isTabAvailable,
                              hasTabContent,
                              willUpdateTab: !currentTopicBlocked && !isTabDisabled
                            });
                            
                            if (tab.id === 'resources') {
                              console.log(`🖱️ [RESOURCES TAB CLICK] Detailed resources state:`, {
                                hasContent: !!content,
                                resourcesInContent: 'resources' in (content || {}),
                                resourcesType: typeof content?.resources,
                                resourcesIsArray: Array.isArray(content?.resources),
                                resourcesCount: content?.resources?.length || 0,
                                hasResourcesMetadata: !!content?.resourcesMetadata,
                                generatedAt: content?.resourcesMetadata?.generatedAt || 'MISSING',
                                availableTabsForCurrentTopic: availableTabsForTopics[currentTopicName] || [],
                                resourcesIsInAvailableTabs: (availableTabsForTopics[currentTopicName] || []).includes('resources')
                              });
                            }
                            
                            if (!currentTopicBlocked && !isTabDisabled) {
                              console.log(`✅ [TAB CLICK] Tab ${tab.label} is clickable, updating active tab`);
                              updateActiveTabDesktop(tab.id); // Use debounced version for desktop
                              // Only reload content if progressive generation is enabled AND content is not already available
                              if (useProgressiveGeneration && currentTopicName && isTabAvailable && !content?.[tab.id]) {
                                console.log(`🔄 [TAB CLICK] Will reload content for ${tab.label}`);
                                // Only refresh if this specific tab content doesn't exist yet
                                loadProgressiveTopicContent(currentTopicName, { showLoader: false });
                              } else {
                                console.log(`✓ [TAB CLICK] Content already available for ${tab.label}, no reload needed`);
                              }
                            } else if (!currentTopicBlocked && useProgressiveGeneration && !isTabAvailable) {
                              console.log(`⏳ [TAB CLICK] Tab ${tab.label} not ready yet, showing loading skeleton`);
                              // If disabled due to not ready, show skeletons briefly to convey loading
                              setShowSkeletons(true);
                              setLoadingStep(`Preparing ${tab.label}...`);
                            } else {
                              console.log(`🚫 [TAB CLICK] Tab ${tab.label} is blocked or disabled:`, {
                                currentTopicBlocked,
                                isTabDisabled,
                                reason: currentTopicBlocked ? 'Topic is blocked' : 'Tab is disabled'
                              });
                            }
                          }}
                          disabled={isLoading || isTabDisabled}
                          className={`group flex-1 min-w-[120px] p-4 rounded-xl font-medium transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                              : isTabDisabled
                                ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          } ${(isLoading || isTabDisabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={
                            currentTopicBlocked && loadScenario !== 'first-time'
                              ? `${tab.label} will be available after course generation completes`
                              : isTabDisabled 
                                ? `${tab.label} is being generated...` 
                                : tab.description
                          }
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`relative p-2 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-white/20' 
                                : isTabDisabled
                                  ? 'bg-gray-200'
                                  : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                              <IconComponent className="text-lg" />
                              {/* Progressive generation status indicator - only show while generating */}
                              {useProgressiveGeneration && (
                                (() => {
                                  const isGenerating = isProgressiveGenerating &&
                                    progressiveGenerationProgress.topic === selectedTopic?.name &&
                                    progressiveGenerationProgress.tabType === tab.id;
                                  return isGenerating ? (
                                    <div className="absolute -top-1 -right-1">
                                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="Generating..." />
                                    </div>
                                  ) : null;
                                })()
                              )}
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>
                            {/* Tiny status label: show only when generating */}
                            {useProgressiveGeneration && isProgressiveGenerating &&
                              progressiveGenerationProgress.topic === selectedTopic?.name &&
                              progressiveGenerationProgress.tabType === tab.id && (
                                <span className="text-[10px] leading-none text-blue-600" aria-live="polite">Loading…</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Mobile Version */}
              <ProLearningMobile
                activeTab={activeTab}
                setActiveTab={updateActiveTab}
                content={content}
                topicsList={topicsList}
                completedTopics={completedTopics}
                toggleTopicCompletion={toggleTopicCompletion}
                handleTopicSelect={handleTopicSelect}
                tabs={tabs}
                renderTabContent={renderTabContent}
                courseTitle={courseTitle}
                isLoading={isLoading}
                useProgressiveGeneration={useProgressiveGeneration}
                availableTabsForTopics={availableTabsForTopics}
                selectedTopic={selectedTopic}
                isProgressiveGenerating={isProgressiveGenerating}
                progressiveGenerationProgress={progressiveGenerationProgress}
                currentTopicName={selectedTopic?.name || getCurrentTopicFromParam(topicParam)}
                currentTopicBlocked={selectedTopic?.name ? isTopicBlocked(selectedTopic.name) : false}
              />

              {/* Desktop Tab Content */}
              <div className="hidden lg:block bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border overflow-hidden">
                <div className="p-4 lg:p-6 max-w-full overflow-x-hidden">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => handleSidebarToggle(!sidebarVisible)}
          className={`fixed transition-all duration-300 z-40 hover:bg-gray-50 ${
            sidebarVisible 
              ? 'top-20 right-[400px] lg:right-[400px] xl:right-[400px] transform bg-white p-3 shadow-md rounded-l-lg' 
              : 'top-20 right-4 bg-white p-3 shadow-lg rounded-lg'
          } hidden lg:flex items-center justify-center`}
          aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarVisible ? 
            <IoChevronBack className="w-5 h-5 text-gray-600" /> : 
            <IoMenu className="w-5 h-5 text-gray-600" />
          }
        </button>

        {/* Mobile Sidebar Backdrop */}
        {sidebarVisible && (
          <div 
            className="fixed inset-0 bg-black/50 z-[25] lg:hidden"
            onClick={() => handleSidebarToggle(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-screen bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-30 flex flex-col ${
            sidebarVisible ? 'translate-x-0' : 'translate-x-full'
          } ${
            // Responsive width
            'w-full sm:w-[380px] md:w-[400px] lg:w-[400px] xl:w-[400px]'
          } ${
            // Hide on mobile by default, show only when explicitly opened
            'lg:block'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex-shrink-0 pt-20 px-4 pb-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Learning Guide</h2>
              <button
                onClick={() => handleSidebarToggle(false)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <IoClose className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            {/* Topic Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <FaRobot className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {topicsList.length > 1 ? 'Learning Topics' : 'Current Topic'}
                  </h3>
                  {topicsList.length === 1 && (
                    <p className="text-sm text-gray-700 mt-0.5 truncate max-w-[260px]">
                      {topicsList[0]?.name}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Display topics (both single and multiple) */}
              <div className="space-y-2">
                {topicsList.length > 1 && (
                  <p className="text-blue-700 font-medium text-sm mb-3">
                    Select a topic to focus on:
                  </p>
                )}
                {(topicsList.length === 0 && topicParam) ? (
                  // Edge case: no topics yet but URL has a topic — show a placeholder button
                  <div className="text-sm text-gray-600">Loading topic…</div>
                ) : topicsList.map((topicItem) => (
                  <button
                    key={topicItem.id}
                    onClick={() => handleTopicSelect(topicItem.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 relative group ${
                      topicItem.isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : completedTopics.includes(topicItem.id)
                          ? 'bg-white text-gray-700 border border-gray-200 shadow-sm opacity-75'
                          : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Completion checkbox - moved to left */}
                      <div
                        className={`relative flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                          completedTopics.includes(topicItem.id)
                            ? 'bg-green-500 border-green-500 shadow-sm'
                            : topicItem.isActive
                              ? 'border-white/40 hover:border-white/60'
                              : 'border-gray-300 hover:border-green-400 group-hover:border-green-400'
                        }`}
                        onClick={(e) => toggleTopicCompletion(topicItem.id, e)}
                        title={
                          topicItem.isActive 
                            ? 'Complete this topic'
                            : completedTopics.includes(topicItem.id) 
                              ? 'Mark as incomplete' 
                              : 'Mark as complete'
                        }
                      >
                        {completedTopics.includes(topicItem.id) && (
                          <IoCheckmarkCircle className="text-white text-sm" />
                        )}
                      </div>
                      
                      {/* Topic content */}
                      <div className="flex items-center justify-between flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {topicItem.name}
                          </span>
                          {/* Completion status indicator */}
                          {completedTopics.includes(topicItem.id) && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Progress indicator - show for both single and multiple topics */}
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {completedTopics.length} / {topicsList.length} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${topicsList.length > 0 ? (completedTopics.length / topicsList.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  {completedTopics.length === topicsList.length && topicsList.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-green-600">
                      <FaTrophy className="text-sm" />
                      <span className="text-xs font-medium">
                        {topicsList.length === 1 ? 'Topic completed! 🎉' : 'Course completed! 🎉'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Removed Learning Progress and Learning Tips sections from sidebar */}
          </div>
          
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            <div className="space-y-4">
              {/* Reading material now displays as a single, unified content block */}
              {/* Removed Reading Sections navigation - content is no longer split into sections */}
            </div>
          </div>
        </div>
      </div>
      {/* Global video modal */}
      <VideoModalComponent 
        isOpen={isVideoModalOpen}
        video={currentVideo}
        onClose={closeVideoModal}
      />
    </>
  );
};

export default ProLearningPage;
