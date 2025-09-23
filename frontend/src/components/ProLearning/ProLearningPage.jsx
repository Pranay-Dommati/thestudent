import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-hot-toast';
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
import rehypeHighlight from "rehype-highlight";
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
} from './ProLearningLogic';
import {
  formatDuration,
  formatViewCount,
  formatSubscriberCount,
  getResourceIcon,
  clearReadingContentCache,
  getReadingContentCacheInfo
} from './services/index.js';
import { 
  batchGenerateAllTopics, 
  isTopicContentGenerated,
  getStoredTopicContent,
  getGenerationProgress,
  initializeCourseStorage
} from './ProBatchGenerator';
import progressiveContentGenerator, {
  initializeProgressiveGeneration,
  startProgressiveGeneration,
  stopProgressiveGeneration,
  getProgressiveGenerationStatus,
  isTabContentAvailable,
  getAvailableTabsForTopic,
  getProgressiveTopicContent
} from './ProgressiveContentGenerator';
import proContentManager from '../../services/ProContentManager';
import tracking from '../../services/trackingService';
import contentStorageService from '../../services/ContentStorageService.js';
import { startLearningTracking, stopLearningTracking } from '../../services/activityTracker';
import Navbar from '../Navbar/Navbar';
import { classifyTopicsWithGemini } from './topicclassifier';
// import BatchGenerationStatus from './BatchGenerationStatus'; // REMOVED - eliminated duplicate loading card
import ProLearningMobile from './ProLearningMobile';


const ProLearningPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  
  // UI state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // Video modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // Helpers to support in-app video playback
  const extractYouTubeId = (value) => {
    if (!value) return '';
    const s = String(value);
    // If it's already a likely YouTube video ID
    if (/^[\w-]{11}$/.test(s)) return s;
    // Try to extract from common URL formats including shorts
    const match = s.match(
      /(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
    );
    return match && match[1] ? match[1] : '';
  };

  const getEmbedUrlForVideo = (video) => {
    if (!video) return '';
    // Prefer extracting from URL; DB 'id' is a UUID, not a YouTube ID
    const idFromUrl = extractYouTubeId(video.url || video.video_url || '');
    const idFallback = extractYouTubeId(video.videoId || video.youtubeId || '');
    const id = idFromUrl || idFallback;
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '';
  };

  const openVideoModal = (video) => {
    setCurrentVideo(video);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    // Clear current video to stop playback when closing
    setIsVideoModalOpen(false);
    setCurrentVideo(null);
  };

  // Inline modal for playing videos inside the platform
  const VideoPlayerModal = () => {
    if (!isVideoModalOpen || !currentVideo) return null;
    const embedUrl = getEmbedUrlForVideo(currentVideo);
    return (
      <div className="fixed inset-0 z-[60]">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" onClick={closeVideoModal} />
        {/* Modal container */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <FaYoutube className="text-red-500" />
                <h3 className="font-semibold text-gray-900 line-clamp-1">{currentVideo?.title || 'Video'}</h3>
              </div>
              <button onClick={closeVideoModal} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close video">
                <IoClose className="w-5 h-5" />
              </button>
            </div>
            {/* Player */}
            <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={currentVideo?.title || 'Video player'}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  frameBorder="0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <p className="text-gray-600">Unable to play this video</p>
                </div>
              )}
            </div>
            {/* Footer actions */}
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600 truncate">
                {currentVideo?.channel || currentVideo?.channelTitle}
              </div>
              {currentVideo?.url && (
                <a href={currentVideo.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  Open on YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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

  // Robust parser for topics passed in the URL query param "topic"
  // - Keeps phrases like "Components, Props, and State" together
  // - Limits to 4 topics
  // - Trims whitespace and filters empties
  const parseTopicsFromParam = (param) => {
    if (!param || typeof param !== 'string') return [];
    const s = param.trim();
    // Fast path: no commas => single topic
    if (!s.includes(',')) return [s];

    // Split by comma, then merge known triplet pattern: X, Y, and Z
    const parts = s.split(',').map(t => t.trim()).filter(Boolean);
    const merged = [];
    for (let i = 0; i < parts.length; i++) {
      const cur = parts[i];
      const next = parts[i + 1];
      const next2 = parts[i + 2];
      // Detect pattern: cur, next, and something => merge three with commas
      if (
        typeof next === 'string' && typeof next2 === 'string' &&
        /^and\s+/i.test(next2)
      ) {
        merged.push(`${cur}, ${next}, ${next2}`);
        i += 2;
        continue;
      }
      merged.push(cur);
    }

    // Enforce max 4 topics by merging any extras into the last
    if (merged.length > 4) {
      const firstThree = merged.slice(0, 3);
      const rest = merged.slice(3).join(', ');
      return [...firstThree, rest];
    }
    return merged;
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
    
    // Simple content loader for reload mode - no generation, just load from storage
    const loadContentForReloadMode = async (topicName) => {
      const currentCourseId = getCourseId();
      if (!currentCourseId || !topicName) return;

      console.log('⚡ Reload mode: Loading content for topic:', topicName);

      try {
        const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
        
        if (storedContent && storedContent.reading) {
          console.log('✅ Reload mode: Found content for topic:', topicName);
          
          // Set content directly
          setContent({
            reading: storedContent.reading,
            summary: storedContent.summary || 'Summary not available',
            quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
            videos: storedContent.videos || [],
            resources: storedContent.resources || []
          });
          setContentTopicName(topicName);

          // Set reading sections
          if (storedContent.reading) {
            const sections = parseReadingSections(storedContent.reading);
            setReadingSections(sections);
            setReadingSectionIndex(0);
          }

          console.log('✅ Reload mode: Content loaded successfully for:', topicName);
          
          // Clear loading states
          setIsLoading(false);
          setLoadingStep('');
        } else {
          console.warn('⚠️ Reload mode: No content found for topic:', topicName);
          setContent({
            reading: 'Content not available. Please regenerate the course.',
            summary: 'Summary not available',
            quiz: { questions: [], currentQuestion: 0 },
            videos: [],
            resources: []
          });
          setContentTopicName(topicName);
          
          // Clear loading states for fallback content
          setIsLoading(false);
          setLoadingStep('');
        }
      } catch (error) {
        console.error('❌ Reload mode: Error loading content for topic:', topicName, error);
        setContent({
          reading: 'Error loading content. Please try again.',
          summary: 'Error loading summary',
          quiz: { questions: [], currentQuestion: 0 },
          videos: [],
          resources: []
        });
        setContentTopicName(topicName);
        
        // Clear loading states for error content
        setIsLoading(false);
        setLoadingStep('');
      }
    };
    
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
                if (storedContent.resources?.length > 0) availableTabs.push('resources');
                
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
        const currentTopicParam = topicParam ? (topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam) : null;
        
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
          
          // Use handleTopicSelection for database topics (but force reload mode logic)
          setLoadScenario('reload');
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
      // IMPORTANT: Handle both multiple topics (comma-separated) and single-topic URLs
      if (topicParam && topicParam.includes(',')) {
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
      
  // Step 4: Fallback - only create default topics when truly nothing else is available
  const hasBatchMarker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
  if (!courseTitle && !topicParam && !hasBatchMarker && !foundFromBatch) {
        // No data found - create fresh default topics
        const defaultTopics = [
          { id: 1, name: "Introduction", isActive: true }, // First topic is active
          { id: 2, name: "Getting Started", isActive: false },
          { id: 3, name: "Key Concepts", isActive: false },
          { id: 4, name: "Best Practices", isActive: false },
          { id: 5, name: "Advanced Topics", isActive: false }
        ];
        setTopicsList(defaultTopics);
        
        // Set the first topic as selected
        setSelectedTopic(defaultTopics[0]);
        
        try {
          proContentManager.setCourse("Default Course", currentCourseId);
          await proContentManager.storeTopics(defaultTopics, currentCourseId);
        } catch (error) {
          console.error('❌ Failed to store default topics:', error);
        }
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
  
  // Reading sections state
  const [readingSections, setReadingSections] = useState([]);
  const [readingSectionIndex, setReadingSectionIndex] = useState(0);
  
  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false);
  
  // Copy code functionality
  const [copySuccessMap, setCopySuccessMap] = useState({});

  // Lightweight client-side pre-sanitizer to avoid initial flash of bad fences/math
  // Notes:
  // - Preserves real code blocks (has a language or typical code patterns)
  // - Converts language-less tiny fenced tokens to inline math ($x$)
  // - Converts short, non-code fenced blocks to simple bullet lines
  // - Falls back to blockquotes for other non-code fenced blocks
  const preSanitizeMarkdown = (md) => {
    if (!md || typeof md !== 'string') return '';
    let out = md;
    try {
      // Normalize Windows newlines just in case
      out = out.replace(/\r\n?/g, '\n');

      // Helpers
      const isLikelyProgramming = (s) => /[{;}]|<\w|<\/|=>|\bdef\b|\bclass\b|\bfunction\b|\bconst\b|\blet\b|\bvar\b|#include|\bimport\b\s|\bfrom\b\s|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bBEGIN\b|\bEND\b|^\s{2,}\S/m.test(s);
      const isMathLike = (s) => {
        const t = (s || '').trim();
        if (!t) return false;
        // Strong math tokens or LaTeX commands/symbols
        if (/\\(frac|sum|int|sqrt|alpha|beta|gamma|theta|lambda|pi|mu|sigma|Delta|nabla|partial)\b|[∑∫√∞≤≥≠≈→⇔∂∇]/.test(t)) return true;
        // Derivatives and powers
        if (/(d[xyzt]|dx|dy|dt)\s*\/(d[xyzt]|dx|dy|dt)\b/.test(t)) return true; // dy/dx
        if (/[\^_]/.test(t) && /[=+\-*/]/.test(t) && !isLikelyProgramming(t)) return true; // x^2 + y
        // Equations comprised of mostly math-friendly chars (avoid braces/semicolons typical of code)
        if (/=/.test(t) && /^[\sA-Za-z0-9.,:+\-*/^_|=()\\{}\[\]<>%]+$/.test(t) && !/[;]{1}|\bconst\b|\bfunction\b|<\/?\w/.test(t)) return true;
        // Trig/log common names
        if (/\b(sin|cos|tan|log|ln)\b/.test(t) && !isLikelyProgramming(t)) return true;
        return false;
      };

      // Handle triple-fenced blocks
      out = out.replace(/```([^\n]*)\n([\s\S]*?)```/g, (m, langRaw, body) => {
        const lang = (langRaw || '').trim();
        const content = (body || '').trim();
        const langLower = lang.toLowerCase();
        const mathLang = /^(math|latex|tex|katex|equation|formula)$/i.test(langLower);
        const likelyProg = isLikelyProgramming(content);
        const likelyMath = mathLang || isMathLike(content) || (!likelyProg && /^(code|text)?$/.test(langLower) && isMathLike(content));

        // Convert math-like fenced content (even if labeled 'code') to KaTeX-friendly math
        if (likelyMath) {
          const isMulti = /\n/.test(content) || content.length > 40 || /\\(frac|sum|int|sqrt)/.test(content);
          return isMulti ? `$$\n${content}\n$$` : `$${content}$`;
        }

        // Keep real programming code as-is
        if (likelyProg || lang) return m;

        // Tiny single token -> inline math
        const tiny = content.replace(/\s+/g, ' ').trim();
        if (tiny.length > 0 && tiny.length <= 5 && !/\s/.test(tiny) && /^[A-Za-z0-9()+\-/*=^_.,]+$/.test(tiny)) {
          return `$${tiny}$`;
        }

        const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);
        // If all lines look mathy, render as display math
        if (lines.length > 0 && lines.every(isMathLike)) {
          return `$$\n${lines.join(' \\ \n')}\n$$`;
        }
        if (lines.length <= 3 && lines.every(l => l.length <= 80)) {
          // short non-code block -> bullets
          return lines.map(l => `- ${l}`).join('\n');
        }
        // default non-code block -> blockquote
        return lines.map(l => `> ${l}`).join('\n');
      });

      // Convert very short inline backtick tokens to inline math
      out = out.replace(/`([^`]+)`/g, (m, tok) => {
        const t = tok.trim();
        if (isMathLike(t)) {
          return /\s|\n/.test(t) ? `$$${t}$$` : `$${t}$`;
        }
        return m; // keep regular inline code
      });

      return out;
    } catch (e) {
      // On any issue, just return original content to avoid breaking
      return md;
    }
  };

  // State-gated sanitized reading to ensure we never paint raw content
  const [sanitizedReading, setSanitizedReading] = useState('');
  const [readingRenderReady, setReadingRenderReady] = useState(false);
  useEffect(() => {
    // When reading changes, compute sanitization synchronously and gate rendering
    const raw = (content && typeof content.reading === 'string') ? content.reading : '';
    if (raw && raw.trim().length) {
      setReadingRenderReady(false);
      const sanitized = preSanitizeMarkdown(String(raw));
      setSanitizedReading(sanitized);
      // Gate render until state is committed
      Promise.resolve().then(() => setReadingRenderReady(true));
    } else {
      setSanitizedReading('');
      setReadingRenderReady(false);
    }
  }, [content && content.reading]);

  // Reset client-side readiness when switching topics to avoid flashing prior sanitized content
  useEffect(() => {
    if (!selectedTopic?.name) return;
    setReadingRenderReady(false);
    setSanitizedReading('');
  }, [selectedTopic?.name]);

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
      if (typeof c.summary === 'string' && c.summary.trim().length > 0) return true;
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

  // Separate useEffect to handle batch generation when topics are available
  // Skip this entirely when progressive generation is enabled
  useEffect(() => {
    if (useProgressiveGeneration) {
      return; // progressive flow manages its own generation lifecycle
    }
    const currentCourseId = getCourseId();
    if (topicsList.length > 0 && !isBatchGenerating && currentCourseId) {
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
  }, [topicsList, courseTitle, useProgressiveGeneration]); // Depend on both topicsList and courseTitle

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
      console.log('🔄 DEBUG: Fresh course creation detected - skipping cached content loading in initial topic effect');
      return;
    }
    
    if (topicsList.length > 0 && courseTitle) {
      const activeTopic = topicsList.find(t => t.isActive);
      if (activeTopic) {
        // Check if content exists in storage for the active topic
        const storedContent = getStoredTopicContent(activeTopic.name, courseTitle, getCourseId());
        
        if (storedContent) {
          setContent(storedContent);
          
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
              setContent(newStoredContent);
              
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
          
          proContentManager.getTopicContent(activeTopic.name, generateProContent, dbTopic)
            .then(result => {
              setSectionGenerating(false);
              setGeneratingTopics(prev => prev.filter(t => t !== activeTopic.name));
              if (result && result.content) {
                setContent(result.content);
                
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
              console.error('❌ Failed to load content:', error);
              setIsLoading(false);
              setShowSkeletons(false);
            });
        }
      }
    } else if (topicParam && !topicsList.length) {
      // If no topics list but we have a topic from URL, handle content loading/generation
      const actualTopic = topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam;
      const currentCourseId = getCourseId();
      
      if (currentCourseId) {
        setIsLoading(true);
        setShowSkeletons(true);
        setLoadingStep(`Loading content for ${actualTopic}...`);
        
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
            if (result?.content?.reading) {
              setContent(result.content);
              const sections = parseReadingSections(result.content.reading);
              setReadingSections(sections);
              setReadingSectionIndex(0);
              console.log('✅ Content ready:', result.source === 'storage' ? 'from storage' : result.source === 'database' ? 'from database' : 'newly generated');
            } else {
              throw new Error('Invalid content received');
            }
          })
          .catch(error => {
            console.error('❌ Failed to load/generate content:', error);
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
  
  // DISABLED: Content watcher that was causing timing conflicts
  /*
  useEffect(() => {
      hasContent: !!content,
      hasReading: !!content?.reading,
      readingLength: content?.reading?.length || 0,
      isLoading,
      topicParam,
      regenerationAttempted
    });

    if (content && !content.reading && !isLoading && topicParam && !regenerationAttempted) {
      
      // Check if this is a newly created empty content that needs population
      const isEmpty = !content.reading && !content.summary && 
                     (!content.videos || content.videos.length === 0) &&
                     (!content.quiz || content.quiz.length === 0) &&
                     (!content.resources || content.resources.length === 0);

      if (isEmpty) {
        setRegenerationAttempted(true); // Prevent infinite loops
        setIsLoading(true);
        setShowSkeletons(true);
        setLoadingStep(`Generating content for ${topicParam}...`);

        const actualTopic = topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam;
        
        // Force regeneration by clearing stored content first
        
        // Call generateProContent directly to bypass storage
        generateProContent({
          topic: actualTopic,
          setIsLoading: () => {},
          setLoadingProgress: () => {},
          setShowSkeletons: () => {},
          setLoadingStep: () => {},
          setContent: (newContent) => {
              hasReading: !!newContent?.reading,
              readingLength: newContent?.reading?.length || 0,
              contentType: typeof newContent
            });
            
            if (newContent && newContent.reading) {
              setContent(newContent);
              const sections = parseReadingSections(newContent.reading);
              setReadingSections(sections);
              setReadingSectionIndex(0);
            } else {
            }
            setIsLoading(false);
            setShowSkeletons(false);
          },
          setStats: () => {},
          content: null
        }).catch(error => {
          setIsLoading(false);
          setShowSkeletons(false);
        });
      }
    }
  }, [content, isLoading, topicParam, regenerationAttempted]); // Watch for content changes
  */

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
      console.log('🔍 DEBUG: No batch marker found - normal content loading');
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
        console.log('🧹 DEBUG: Clearing expired batch marker (older than 5 minutes)');
        localStorage.removeItem('proLearning_batchMarker');
        return false;
      }
      
      console.log('🔄 DEBUG: Recent batch marker detected - WILL SKIP old cached content');
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
      console.log('🔍 DEBUG: No content metadata found - considering as old content');
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
        typeof stored.summary === 'string' && stored.summary.trim() &&
        Array.isArray(stored.videos) && stored.videos.length > 0 &&
        (Array.isArray(stored.quiz) ? stored.quiz.length > 0 : (stored?.quiz?.questions?.length > 0)) &&
        Array.isArray(stored.resources) && stored.resources.length > 0);
    } catch { return false; }
  };

  // Helper function to determine if a topic should be blocked
  const isTopicBlocked = (topicName) => {
    // In reload mode (content already saved in DB), never block topics
    if (loadScenario === 'reload') return false;

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
      const hasFull = stored && typeof stored.reading === 'string' && stored.reading.trim() &&
        typeof stored.summary === 'string' && stored.summary.trim() &&
        Array.isArray(stored.videos) && stored.videos.length > 0 &&
        (Array.isArray(stored.quiz) ? stored.quiz.length > 0 : (stored?.quiz?.questions?.length > 0)) &&
        Array.isArray(stored.resources) && stored.resources.length > 0;
      if (hasFull) return false;
    } catch {}

    // Fallback: block until entire course completes
    return !allTopicsGenerated;
  };

  // Helper function to load topic content from batch-generated data
  const loadTopicContent = async (topicName) => {
    const currentCourseId = getCourseId();
    if (!currentCourseId) return;

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
      if (content.resources?.length > 0) availableTabs.push('resources');
      
      setAvailableTabsForTopics(prev => ({
        ...prev,
        [topicName]: availableTabs
      }));
      
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
          reading: storedContent.reading || 'Content not available',
          summary: storedContent.summary || 'Summary not available',
          quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
          videos: storedContent.videos || [],
          resources: storedContent.resources || []
        };
        
  setContent(transformedContent);
  setContentTopicName(topicName);
        
        // Update available tabs for the topic based on loaded content
        const availableTabs = [];
        if (transformedContent.reading) availableTabs.push('reading');
        if (transformedContent.summary) availableTabs.push('summary');
        if (transformedContent.videos?.length > 0) availableTabs.push('videos');
        if (transformedContent.quiz?.length > 0 || (transformedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
        if (transformedContent.resources?.length > 0) availableTabs.push('resources');
        
        setAvailableTabsForTopics(prev => ({
          ...prev,
          [topicName]: availableTabs
        }));
        
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
          
          setContent(result.content);
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
  setContent(errorContent);
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
  const loadProgressiveTopicContent = async (topicName, options = {}) => {
    const { showLoader = true } = options;
    if (!topicName) return;

    console.log('🔄 DEBUG: loadProgressiveTopicContent called for:', topicName);

    try {
      if (showLoader) setIsLoading(true);
      setLoadingStep(`Loading ${topicName} content...`);

      // Check if we should skip old cached content during fresh course creation
      const shouldSkipOld = shouldSkipOldCachedContent();
      console.log('🔍 DEBUG: Should skip old content:', shouldSkipOld);
      
      // Get content from progressive generator (ensure generator knows courseId)
      if (!getProgressiveGenerationStatus()?.courseId) {
        try {
          // Best-effort nudge: initialize internal courseId for the generator without restarting
          const cid = getCourseId();
          if (cid) {
            await initializeProgressiveGeneration(courseTitle || 'Pro Learning Course', topicsList.length ? topicsList : [{ name: topicName }], {}, { courseId: cid });
          }
        } catch {}
      }
      const progressiveContent = getProgressiveTopicContent(topicName);
      console.log('🔍 DEBUG: Progressive content found:', !!progressiveContent);
      if (progressiveContent) {
        console.log('🔍 DEBUG: Progressive content details:', {
          hasReading: !!progressiveContent.reading,
          hasSummary: !!progressiveContent.summary,
          hasMetadata: !!progressiveContent.metadata,
          metadataKeys: progressiveContent.metadata ? Object.keys(progressiveContent.metadata) : []
        });
      }
      
      if (progressiveContent) {
        // Check if we should use this content
        let shouldUseContent = true;
        
        if (shouldSkipOld) {
          // During fresh course creation, only use freshly generated content
          shouldUseContent = isContentFreshlyGenerated(progressiveContent, true); // Enable strict mode
          console.log('🔍 DEBUG: Should use progressive content (strict mode):', shouldUseContent);
          if (!shouldUseContent) {
            console.log('❌ DEBUG: Skipping old cached progressive content for:', topicName);
          }
        } else {
          console.log('✅ DEBUG: Normal mode - using available progressive content for:', topicName);
        }
        
        if (shouldUseContent) {
          console.log('📚 DEBUG: Loading progressive content for:', topicName);
          
          // Transform content to expected format
          const formattedContent = {
            reading: progressiveContent.reading || '',
            summary: progressiveContent.summary || '',
            quiz: progressiveContent.quiz || [],
            videos: progressiveContent.videos || [],
            resources: progressiveContent.resources || []
          };

          // Set content for this topic only - don't merge with previous topic's content
          setContent({
            reading: formattedContent.reading,
            summary: formattedContent.summary,
            quiz: formattedContent.quiz,
            videos: formattedContent.videos,
            resources: formattedContent.resources
          });
          setContentTopicName(topicName);

          // Immediately mark available tabs based on loaded progressive content
          const newReady = [];
          if (formattedContent.reading) newReady.push('reading');
          if (formattedContent.summary) newReady.push('summary');
          if ((formattedContent.videos?.length || 0) > 0) newReady.push('videos');
          if ((Array.isArray(formattedContent.quiz) && formattedContent.quiz.length > 0) || (formattedContent?.quiz?.questions?.length > 0)) newReady.push('quiz');
          if ((formattedContent.resources?.length || 0) > 0) newReady.push('resources');
          if (newReady.length > 0) {
            setAvailableTabsForTopics(prev => ({
              ...prev,
              [topicName]: Array.from(new Set([...(prev[topicName] || []), ...newReady]))
            }));
          }
          
          // Parse and set reading sections
          if (progressiveContent.reading) {
            const sections = parseReadingSections(progressiveContent.reading);
            setReadingSections(sections);
            setReadingSectionIndex(0);
          } else {
            // Ensure stale sections are cleared if reading isn't ready yet
            setReadingSections([]);
            setReadingSectionIndex(0);
          }
        } else {
          // Show empty content and let the generation process fill it
          console.log('🆕 DEBUG: Initializing empty content for fresh generation:', topicName);
          setContent({
            reading: '',
            summary: '',
            quiz: [],
            videos: [],
            resources: []
          });
          setContentTopicName(topicName);
        }
        
      } else {
        
        // Show empty content with placeholders for topic that hasn't started generating
        setContent({
          reading: '',
          summary: '',
          quiz: [],
          videos: [],
          resources: []
        });
        setContentTopicName(topicName);
  setReadingSections([]);
  setReadingSectionIndex(0);
      }
    } catch (error) {
      console.error('❌ Failed to load progressive content:', error);
      setContent({
        reading: 'Failed to load content. Please try again.',
        summary: 'Failed to load summary.',
        quiz: [],
        videos: [],
        resources: []
      });
      setContentTopicName(topicName);
    } finally {
      if (showLoader) setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Handle topic selection from sidebar using new storage system
  const handleTopicSelect = (topicId) => {
    // Find the topic in the list
    const selectedTopic = topicsList.find(t => t.id === topicId);
    if (!selectedTopic) return;

    // Update URL with new topic
    updateTopicInUrl(selectedTopic.name);

    // Update active states and set selected topic
    setTopicsList(topics => topics.map(topic => ({
      ...topic,
      isActive: topic.id === topicId
    })));
    
    setSelectedTopic(selectedTopic);

    // CRITICAL: Clear content immediately when switching topics to prevent cross-topic content display
    setContent(null);
  setContentTopicName(null);
    // Also clear reading sections so previous topic's text doesn't persist
    setReadingSections([]);
    setReadingSectionIndex(0);
    
    // Reset active tab to 'reading' for new topic
    setActiveTab('reading');

    // CRITICAL: Always check and update available tabs for the selected topic
    const updateTabsForTopic = async (topicName) => {
      try {
        const currentCourseId = getCourseId();
        if (currentCourseId) {
          const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
          if (storedContent) {
            const availableTabs = [];
            if (storedContent.reading) availableTabs.push('reading');
            if (storedContent.summary) availableTabs.push('summary');
            if (storedContent.videos?.length > 0) availableTabs.push('videos');
            if (storedContent.quiz?.length > 0 || (storedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
            if (storedContent.resources?.length > 0) availableTabs.push('resources');
            
            if (availableTabs.length > 0) {
              setAvailableTabsForTopics(prev => ({
                ...prev,
                [topicName]: availableTabs
              }));
              console.log('🎯 Updated tabs for selected topic:', topicName, availableTabs);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to update tabs for topic:', topicName, error);
      }
    };
    
    // Update tabs asynchronously
    updateTabsForTopic(selectedTopic.name);

    // Check if this topic is blocked (2nd topic onwards until course completion)
    if (isTopicBlocked(selectedTopic.name)) {
      // For blocked topics, set loading state with appropriate message
      setIsLoading(true);
      setLoadingStep(`Loading ${selectedTopic.name} content...`);
      console.log('🚫 Topic is blocked until course completion:', selectedTopic.name);
      return; // Exit early, content will show loading UI
    }

    // Handle content loading for non-blocked topics
    if (loadScenario === 'reload') {
      // RELOAD MODE: Simple content loading
      loadContentForReloadMode(selectedTopic.name);
    } else if (useProgressiveGeneration) {
      // FIRST-TIME MODE: Progressive generation
      loadProgressiveTopicContent(selectedTopic.name, { showLoader: false });
      
      // If no content is available yet for this topic, ensure we're in generation mode
      const hasProgressiveContent = getProgressiveTopicContent(selectedTopic.name);
      const hasAvailableTabs = availableTabsForTopics[selectedTopic.name]?.length > 0;
      
      if (!hasProgressiveContent && !hasAvailableTabs && !isProgressiveGenerating) {
        console.log('🚀 Topic has no content yet, ensuring progressive generation is running for:', selectedTopic.name);
        // The progressive generation should already be running for all topics
        // but ensure we show the generation status
        setIsProgressiveGenerating(true);
      }
    } else {
      // FIRST-TIME MODE: Batch generation
      if (allTopicsGenerated || hasTopicContent(selectedTopic.name)) {
        loadTopicContent(selectedTopic.name);
      } else {
        // Show message that content needs to be generated
        setContent(null);
      }
    }
  };

  // Toggle topic completion status
  const toggleTopicCompletion = (topicId, event) => {
    event.stopPropagation(); // Prevent topic selection when clicking the toggle
    
    setCompletedTopics(prev => {
      const isCurrentlyCompleted = prev.includes(topicId);
      const updated = isCurrentlyCompleted
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId];
      
      // Save to localStorage with course-specific key
      try {
        const courseId = getCourseId();
        const storageKey = courseId ? `proLearning_completedTopics_${courseId}` : 'proLearning_completedTopics';
        localStorage.setItem(storageKey, JSON.stringify(updated));
        
        // Show brief feedback
        console.log(isCurrentlyCompleted ? '✅ Topic marked as incomplete' : '🎉 Topic completed!');
      } catch (error) {
        console.warn('Failed to save completion status:', error);
      }
      
      return updated;
    });
  };

  // Sidebar toggle handlers
  const handleSidebarToggle = (isVisible) => {
    setSidebarVisible(isVisible);
  };

  // Copy code functionality
  const handleCopyCode = (codeString, blockId) => {
    navigator.clipboard.writeText(codeString).then(() => {
      setCopySuccessMap(prev => ({ ...prev, [blockId]: true }));
      setTimeout(() => {
        setCopySuccessMap(prev => ({ ...prev, [blockId]: false }));
      }, 2000);
    });
  };

  // Save to Learning Hub functionality
  const generateSmartCourseName = (topicsData, fallbackTitle) => {
    // If explicit non-generic title exists, prefer it
    if (fallbackTitle && !/^AI Course:|^ProLearning Course|^Generated Course|^Database Course/i.test(fallbackTitle)) {
      return fallbackTitle;
    }
    // Normalize topicsData to an array of { name }
    let topicArray = [];
    if (Array.isArray(topicsData)) {
      topicArray = topicsData;
    } else if (topicsData && typeof topicsData === 'object') {
      topicArray = Object.keys(topicsData).map(name => ({ name }));
    }
    if (!topicArray || topicArray.length === 0) {
      return 'AI Generated Course';
    }
    const names = topicArray.map(t => (t?.name || '').trim()).filter(Boolean);
    if (names.length === 0) return 'AI Generated Course';
    // Build: FirstTopic +2 +3 (+...)
    const first = names[0];
    const additional = Math.max(0, names.length - 1);
    if (additional === 0) return first;
    if (additional === 1) return `${first} +1`;
    if (additional === 2) return `${first} +1 +2`;
    // For more than 2 additional, show first two increments then ellipsis
    return `${first} +1 +2 +...`;
  };

  // Auto-save function for post-generation saves (no UI state updates)
  const autoSaveToBackend = async () => {
    try {
      console.log('🤖 AUTO-SAVE: Starting auto-save process...');
      
      // Try to get course ID from multiple sources
      let currentCourseId = getCourseId();
      console.log('🤖 AUTO-SAVE: Course ID from getCourseId():', currentCourseId);
      
      if (!currentCourseId && currentCourse?.id) {
        currentCourseId = currentCourse.id;
        console.log('📝 Using course ID from current course:', currentCourseId);
      }
      
      // Try getting from local storage
      if (!currentCourseId) {
        const savedCourseId = localStorage.getItem('currentCourseId');
        if (savedCourseId) {
          currentCourseId = savedCourseId;
          console.log('📝 Using course ID from localStorage:', currentCourseId);
        }
      }

      if (!currentCourseId) {
        currentCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('currentCourseId', currentCourseId);
        console.log('🤖 AUTO-SAVE: Generated new course ID:', currentCourseId);
      }

      console.log('🤖 AUTO-SAVE: Final course ID:', currentCourseId);
      
      // Wait a moment for content to be fully saved to storage
      console.log('🤖 AUTO-SAVE: Waiting 3 seconds for content stabilization...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Initialize course content gathering
      let courseContent = null;
      let topicsWithContent = [];
      const sanitizeTopicName = (name) => (name || '').toString().replace(/\s*:\s*true$/i, '').trim();
      
      console.log('🤖 AUTO-SAVE: Checking topics list:', topicsList?.length, 'topics');
      console.log('🤖 AUTO-SAVE: Checking content state:', content ? 'has content' : 'no content');
      
      // Try to get content from multiple sources
      // First check if we have current content in state
      if (content && Object.keys(content).length > 0) {
        console.log('🤖 AUTO-SAVE: Found content in current state');
        // Convert current content state to topics format
        topicsWithContent.push({
          name: selectedTopic || 'Current Topic',
          content: {
            reading: content.reading || content.readingMaterial || '',
            summary: content.summary || content.topicSummary || '',
            videos: Array.isArray(content.videos) ? content.videos : [],
            quiz: Array.isArray(content.quiz) ? content.quiz : 
                  Array.isArray(content.quizQuestions) ? content.quizQuestions : [],
            resources: Array.isArray(content.resources) ? content.resources : []
          }
        });
        console.log(`🤖 AUTO-SAVE: Added current content (reading: ${content.reading?.length || 0} chars, summary: ${content.summary?.length || 0} chars)`);
      }
      
      // If no content from current state, try topics list approach
      if (topicsWithContent.length === 0 && Array.isArray(topicsList) && topicsList.length > 0) {
        console.log('🤖 AUTO-SAVE: Using topics from current state:', topicsList.length, 'topics');
        
        // Try to gather content for each topic in the current state
        for (const topic of topicsList) {
          try {
            const rawName = typeof topic === 'string' ? topic : topic?.name;
            const topicName = sanitizeTopicName(rawName);
            if (!topicName) continue;

            let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
            // Fallback: search without courseId (global scan) if not found
            if (!content) {
              content = await proContentManager.getStoredTopicContent(null, topicName);
            }
            if (content) {
              topicsWithContent.push({
                name: topicName,
                content: {
                  reading: content.reading || content.readingMaterial || '',
                  summary: content.summary || content.topicSummary || '',
                  videos: Array.isArray(content.videos) ? content.videos : [],
                  quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                  resources: Array.isArray(content.resources) ? content.resources : []
                }
              });
              console.log(`📝 Added content for topic: ${topicName} (reading: ${content.reading?.length || 0} chars, summary: ${content.summary?.length || 0} chars)`);
            }
          } catch (e) {
            console.warn('Failed to get content for topic:', topic.name, e);
          }
        }
      }
      
      // If still nothing, try a more comprehensive storage scan
      if (topicsWithContent.length === 0) {
        try {
          console.log('🤖 AUTO-SAVE: Doing comprehensive storage scan...');
          
          // Try getting complete course content first
          const storedCourseContent = await proContentManager.getStoredCourseContent(currentCourseId);
          if (storedCourseContent && storedCourseContent.topics) {
            console.log('🤖 AUTO-SAVE: Found stored course content with topics');
            // Evaluate if storedCourseContent actually has non-empty topics
            const tmp = (() => {
              const topics = storedCourseContent.topics;
              const entries = Array.isArray(topics) ? topics : Object.values(topics);
              const nonEmpty = entries.filter(t => {
                const c = (t?.content ?? t) || {};
                const r = c.reading || c.readingMaterial || '';
                const s = c.summary || c.topicSummary || '';
                return (r && String(r).trim().length) || (s && String(s).trim().length);
              }).length;
              return { count: nonEmpty };
            })();
            if (tmp.count > 0) {
              courseContent = storedCourseContent;
            } else {
              console.log('🤖 AUTO-SAVE: Stored course content has 0 non-empty topics, will try per-topic scan');
            }
          }
          if (!courseContent) {
            // Try to get any stored topics for this course
            const allStoredTopics = await proContentManager.getStoredTopics(currentCourseId);
            console.log('🤖 AUTO-SAVE: Found stored topics:', allStoredTopics?.length || 0);
            
            if (Array.isArray(allStoredTopics) && allStoredTopics.length > 0) {
              for (const topic of allStoredTopics) {
                try {
                  const topicName = sanitizeTopicName(topic?.name);
                  // Probe multiple name variants to avoid key mismatches
                  const nameVariants = [
                    topicName,
                    topicName.toLowerCase(),
                    topicName.toUpperCase(),
                    topicName.replace(/\s+/g, ' ').trim(),
                  ];
                  let topicContent = null;
                  for (const n of nameVariants) {
                    topicContent = await proContentManager.getStoredTopicContent(currentCourseId, n);
                    if (topicContent && (topicContent.reading || topicContent.summary)) break;
                  }
                  if (topicContent && (topicContent.reading || topicContent.summary)) {
                    topicsWithContent.push({
                      name: topicName,
                      content: {
                        reading: topicContent.reading || topicContent.readingMaterial || '',
                        summary: topicContent.summary || topicContent.topicSummary || '',
                        videos: Array.isArray(topicContent.videos) ? topicContent.videos : [],
                        quiz: Array.isArray(topicContent.quiz) ? topicContent.quiz : [],
                        resources: Array.isArray(topicContent.resources) ? topicContent.resources : []
                      }
                    });
                    console.log(`🤖 AUTO-SAVE: Found content for "${topicName}" (reading: ${topicContent.reading?.length || 0}, summary: ${topicContent.summary?.length || 0})`);
                  }
                } catch (e) {
                  console.warn('Error getting content for topic:', topic.name, e);
                }
              }
              
              if (topicsWithContent.length > 0) {
                courseContent = { topics: topicsWithContent };
                console.log('🤖 AUTO-SAVE: Assembled course content from stored topics');
              }
            }
          }
        } catch (e) {
          console.error('🤖 AUTO-SAVE: Error in comprehensive storage scan:', e);
        }
      }
      
      // If still nothing and we have a selectedTopic, try to fetch just that one
      if (topicsWithContent.length === 0 && selectedTopic) {
        try {
          const rawName = typeof selectedTopic === 'string' ? selectedTopic : selectedTopic?.name;
          const topicName = sanitizeTopicName(rawName);
          if (topicName) {
            let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
            if (!content) content = await proContentManager.getStoredTopicContent(null, topicName);
            if (content) {
              topicsWithContent.push({
                name: topicName,
                content: {
                  reading: content.reading || content.readingMaterial || '',
                  summary: content.summary || content.topicSummary || '',
                  videos: Array.isArray(content.videos) ? content.videos : [],
                  quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                  resources: Array.isArray(content.resources) ? content.resources : []
                }
              });
              console.log('📝 Added content from selectedTopic:', topicName);
            }
          }
        } catch (e) {
          console.warn('Failed to get content for selectedTopic:', e);
        }
      }

      // If we already have topics from current state, use them
      if (topicsWithContent.length > 0 && !courseContent) {
        courseContent = { topics: topicsWithContent };
        console.log('📝 Using course content from current state topics:', topicsWithContent.length);
      }

      // If no content found from current state, try storage methods
      if (topicsWithContent.length === 0) {
        try {
          // Try getting complete course content first
          courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
          console.log('📝 Retrieved stored course content:', courseContent ? 'found' : 'not found');
          
          // If no course content, try assembling from stored topics
          if (!courseContent || !courseContent.topics) {
            const storedTopics = await proContentManager.getStoredTopics(currentCourseId);
            console.log('📝 Retrieved stored topics:', storedTopics?.length || 0);
            
            if (Array.isArray(storedTopics) && storedTopics.length > 0) {
              for (const topic of storedTopics) {
                try {
                  const topicName = sanitizeTopicName(topic?.name);
                  let topicContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
                  if (!topicContent) {
                    topicContent = await proContentManager.getStoredTopicContent(null, topicName);
                  }
                  if (topicContent) {
                    topicsWithContent.push({
                      name: topicName,
                      content: {
                        reading: topicContent.reading || topicContent.readingMaterial || '',
                        summary: topicContent.summary || topicContent.topicSummary || '',
                        videos: Array.isArray(topicContent.videos) ? topicContent.videos : [],
                        quiz: Array.isArray(topicContent.quiz) ? topicContent.quiz : 
                              Array.isArray(topicContent.quizQuestions) ? topicContent.quizQuestions : [],
                        resources: Array.isArray(topicContent.resources) ? topicContent.resources : []
                      }
                    });
                    console.log('📝 Assembled content for stored topic:', topicName);
                  }
                } catch (e) {
                  console.warn('Failed to get content for stored topic:', topic.name, e);
                }
              }
              
              if (topicsWithContent.length > 0) {
                courseContent = { topics: topicsWithContent };
                console.log('📝 Successfully assembled course content from stored topics');
              }
            }
          }
        } catch (e) {
          console.warn('Failed to get content from storage:', e);
        }
      }
      
      const topicsEmpty = !courseContent || !courseContent.topics ||
        (Array.isArray(courseContent.topics) ? courseContent.topics.length === 0 : Object.keys(courseContent.topics).length === 0);
      if (topicsEmpty) {
        console.error('❌ AUTO-SAVE: No course content found for auto-save');
        console.log('🤖 AUTO-SAVE: Debug info:', {
          hasCourseContent: !!courseContent,
          hasTopics: !!(courseContent?.topics),
          topicsIsArray: Array.isArray(courseContent?.topics),
          topicsLength: Array.isArray(courseContent?.topics) ? courseContent.topics.length : Object.keys(courseContent?.topics || {}).length
        });
        return; // Silently fail for auto-save
      }

      console.log('🤖 AUTO-SAVE: Found course content with', 
        Array.isArray(courseContent.topics) ? courseContent.topics.length : Object.keys(courseContent.topics).length, 
        'topics');
      
      console.log('🤖 AUTO-SAVE: Raw course content structure:', {
        hasTopics: Array.isArray(courseContent.topics),
        topicsCount: courseContent.topics?.length || 0,
        sampleTopic: courseContent.topics?.[0],
        fullCourseContent: courseContent
      });

      // Generate smart course name based on topics
      const smartCourseName = generateSmartCourseName(courseContent.topics, courseTitle);

      // Helper to build topics object and compute non-empty stats
      const buildTopicsObjectAndStats = (cc) => {
        let nonEmpty = 0;
        if (!cc || !cc.topics) return { topicsObj: {}, nonEmpty };

        if (Array.isArray(cc.topics)) {
          const topicsObj = Object.fromEntries(cc.topics.map((t, idx) => {
            let c = t?.content ?? t ?? {};
            const reading = c.reading || c.readingMaterial || '';
            const summary = c.summary || c.topicSummary || '';
            const videos = Array.isArray(c.videos) ? c.videos : [];
            let quiz = [];
            if (Array.isArray(c.quiz)) quiz = c.quiz;
            else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
            else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
            const resources = Array.isArray(c.resources) ? c.resources : [];

            let finalReading = reading;
            let finalSummary = summary;
            // If empty, attempt to enrich from ContentStorageService
      if (!(finalReading && finalReading.trim().length) && !(finalSummary && finalSummary.trim().length)) {
              try {
        let stored = contentStorageService.getContentByTopicName(sanitizeTopicName(t.name), currentCourseId);
        if (!stored) stored = contentStorageService.getContentByTopicName(sanitizeTopicName(t.name));
                if (stored) {
                  finalReading = stored.reading || finalReading;
                  finalSummary = stored.summary || finalSummary;
                }
              } catch {}
            }

            if ((finalReading && finalReading.trim().length) || (finalSummary && finalSummary.trim().length)) nonEmpty++;

            console.log(`🤖 AUTO-SAVE: Processing topic "${t.name}":`, {
              hasReading: !!finalReading,
              readingLength: finalReading?.length || 0,
              readingPreview: finalReading?.substring(0, 100) + '...',
              hasSummary: !!finalSummary,
              summaryLength: finalSummary?.length || 0,
              summaryPreview: finalSummary?.substring(0, 100) + '...',
              videosCount: videos.length,
              quizCount: quiz.length,
              resourcesCount: resources.length,
              rawContent: c
            });

            return [
              sanitizeTopicName(t.name),
              { content: { reading: finalReading, summary: finalSummary, videos, quiz, resources }, order: idx, readingMaterial: finalReading, summary: finalSummary, videos, quiz, resources }
            ];
          }));
          return { topicsObj, nonEmpty };
        }

        const topicsObj = Object.fromEntries(Object.entries(cc.topics).map(([name, t], idx) => {
          let c = t?.content ?? t ?? {};
          let reading = c.reading || c.readingMaterial || '';
          let summary = c.summary || c.topicSummary || '';
          const videos = Array.isArray(c.videos) ? c.videos : [];
          let quiz = [];
          if (Array.isArray(c.quiz)) quiz = c.quiz;
          else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
          else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
          const resources = Array.isArray(c.resources) ? c.resources : [];

      if (!(reading && reading.trim().length) && !(summary && summary.trim().length)) {
            try {
        let stored = contentStorageService.getContentByTopicName(sanitizeTopicName(name), currentCourseId);
        if (!stored) stored = contentStorageService.getContentByTopicName(sanitizeTopicName(name));
              if (stored) {
                reading = stored.reading || reading;
                summary = stored.summary || summary;
              }
            } catch {}
          }

          if ((reading && reading.trim().length) || (summary && summary.trim().length)) nonEmpty++;

          return [
            sanitizeTopicName(name),
            { content: { reading, summary, videos, quiz, resources }, order: idx, readingMaterial: reading, summary, videos, quiz, resources }
          ];
        }));
        return { topicsObj, nonEmpty };
      };

      // Retry loop: ensure we have at least one non-empty topic before POST
      let topicsObject = {};
      let nonEmptyCount = 0;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const built = buildTopicsObjectAndStats(courseContent);
        topicsObject = built.topicsObj;
        nonEmptyCount = built.nonEmpty;
        console.log(`🤖 AUTO-SAVE: Build attempt ${attempt}/5 -> nonEmptyTopics=${nonEmptyCount}`);
        if (nonEmptyCount > 0) break;
        console.warn(`⏳ AUTO-SAVE: All topics empty on attempt ${attempt}. Retrying after 1500ms...`);
        await new Promise(r => setTimeout(r, 1500));
        try {
          const refreshed = await proContentManager.getStoredCourseContent(currentCourseId);
          if (refreshed && refreshed.topics) {
            courseContent = refreshed;
            console.log('🔁 AUTO-SAVE: Refreshed course content from storage');
          }
        } catch (e) {
          console.warn('🔁 AUTO-SAVE: Failed to refresh stored course content', e);
        }
      }

      if (nonEmptyCount === 0) {
        console.error('❌ AUTO-SAVE: Aborting POST — all topics have empty reading/summary after retries');
        return; // avoid saving empty topics
      }

      const courseData = {
        course_name: currentCourseId, // stable identifier used by backend
        title: smartCourseName,
        overwrite: true,
        topics: topicsObject
      };

  // Get auth token from localStorage only (no IndexedDB)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      if (!token) {
        console.error('❌ AUTO-SAVE: No authentication token found for auto-save');
        return; // Silently fail for auto-save
      }

      console.log('🤖 AUTO-SAVE: Found auth token, preparing to save...');

      // Save to backend using Django endpoint
      console.log('🤖 AUTO-SAVE: Sending POST request to /api/courses/pro-learning/save-course/');
      console.log('🤖 AUTO-SAVE: Final course data being sent:', JSON.stringify(courseData, null, 2));
      console.log('🤖 AUTO-SAVE: POST payload size:', JSON.stringify(courseData).length, 'characters');
      console.log('🤖 AUTO-SAVE: Topics in payload:', Object.keys(courseData.topics || {}));
      
      // Log each topic's content in detail
      if (courseData.topics) {
        Object.entries(courseData.topics).forEach(([topicName, topicData]) => {
          console.log(`🤖 AUTO-SAVE: Topic "${topicName}" payload:`, {
            hasContent: !!topicData.content,
            reading: topicData.content?.reading || 'EMPTY',
            readingLength: (topicData.content?.reading || '').length,
            summary: topicData.content?.summary || 'EMPTY', 
            summaryLength: (topicData.content?.summary || '').length,
            fullTopicData: topicData
          });
        });
      }

      console.log('🤖 AUTO-SAVE: Making POST request to /api/courses/pro-learning/save-course/...');
      
      const axios = (await import('../../utils/axios')).default;
      const response = await axios.post('/courses/pro-learning/save-course/', courseData);
      const responseData = response.data;

      if (response.status >= 200 && response.status < 300) {
        console.log('✅ AUTO-SAVE: Course auto-saved to backend successfully!', responseData);
        
        // Mark course as ready (but don't force UI updates)
        localStorage.setItem(`proLearning_courseReady_${currentCourseId}`, 'true');

        // Show a one-time notification that generation completed and was added to Learning Hub
        try {
          const notifiedKey = `proLearning_savedNotified_${currentCourseId}`;
          const alreadyNotified = localStorage.getItem(notifiedKey) === 'true';
          if (!alreadyNotified) {
            toast.success('🎉 Course generation completed and added to your Learning Hub');
            localStorage.setItem(notifiedKey, 'true');
          }
        } catch (_) {
          // ignore toast/localStorage failures
        }
        
      } else {
        console.error('❌ AUTO-SAVE: Failed to auto-save course. Status:', response.status, 'Response:', responseData);
        // Don't show UI errors for auto-save failures
      }

    } catch (error) {
      console.error('❌ AUTO-SAVE: Failed to auto-save course to backend:', error);
      try { tracking.capture('pro_learning.save_failed', { auto: true, status: error?.response?.status || null }, { feature: 'pro_learning', success: false, error_code: String(error?.response?.status || 'ERR') }); } catch {}
      // Silently fail for auto-save
    }
  };

  const handleSaveToLearningHub = async () => {
    try {
      
      // Try to get course ID from multiple sources
      let currentCourseId = getCourseId();
      
      if (!currentCourseId && currentCourse?.id) {
        currentCourseId = currentCourse.id;
        console.log('📝 Using course ID from current course:', currentCourseId);
      }
      
      // Try getting from local storage
      if (!currentCourseId) {
        const savedCourseId = localStorage.getItem('currentCourseId');
        if (savedCourseId) {
          currentCourseId = savedCourseId;
          console.log('📝 Using course ID from localStorage:', currentCourseId);
        }
      }

      // If still no ID, create a new one
      if (!currentCourseId) {
        currentCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('currentCourseId', currentCourseId);
        console.log('📝 Generated new course ID:', currentCourseId);
      }

  // Initialize course content gathering
      let courseContent = null;
      let topicsWithContent = [];
  const sanitizeTopicName = (name) => (name || '').toString().replace(/\s*:\s*true$/i, '').trim();
      
      // First try to get topics from current state
      if (Array.isArray(topicsList) && topicsList.length > 0) {
        console.log('📝 Using topics from current state:', topicsList.length, 'topics');
        
        // Try to gather content for each topic in the current state
        for (const topic of topicsList) {
          try {
            const rawName = typeof topic === 'string' ? topic : topic?.name;
            const topicName = sanitizeTopicName(rawName);
            if (!topicName) continue;

            let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
            // Fallback: search without courseId (global scan) if not found
            if (!content) {
              content = await proContentManager.getStoredTopicContent(null, topicName);
            }
            if (content) {
              topicsWithContent.push({
                name: topicName,
                content: {
                  reading: content.reading || content.readingMaterial || '',
                  summary: content.summary || content.topicSummary || '',
                  videos: Array.isArray(content.videos) ? content.videos : [],
                  quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                  resources: Array.isArray(content.resources) ? content.resources : []
                }
              });
              console.log('📝 Added content for topic:', topic.name);
            }
          } catch (e) {
            console.warn('Failed to get content for topic:', topic.name, e);
          }
        }
      }
      
      // If still nothing and we have a selectedTopic, try to fetch just that one
      if (topicsWithContent.length === 0 && selectedTopic) {
        try {
          const rawName = typeof selectedTopic === 'string' ? selectedTopic : selectedTopic?.name;
          const topicName = sanitizeTopicName(rawName);
          if (topicName) {
            let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
            if (!content) content = await proContentManager.getStoredTopicContent(null, topicName);
            if (content) {
              topicsWithContent.push({
                name: topicName,
                content: {
                  reading: content.reading || content.readingMaterial || '',
                  summary: content.summary || content.topicSummary || '',
                  videos: Array.isArray(content.videos) ? content.videos : [],
                  quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                  resources: Array.isArray(content.resources) ? content.resources : []
                }
              });
              console.log('📝 Added content from selectedTopic:', topicName);
            }
          }
        } catch (e) {
          console.warn('Failed to get content for selectedTopic:', e);
        }
      }

      // If we already have topics from current state, use them
      if (topicsWithContent.length > 0 && !courseContent) {
        courseContent = { topics: topicsWithContent };
        console.log('📝 Using course content from current state topics:', topicsWithContent.length);
      }

      // If no content found from current state, try storage methods
      if (topicsWithContent.length === 0) {
        try {
          // Try getting complete course content first
          courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
          console.log('📝 Retrieved stored course content:', courseContent ? 'found' : 'not found');
          
          // If no course content, try assembling from stored topics
          if (!courseContent || !courseContent.topics) {
            const storedTopics = await proContentManager.getStoredTopics(currentCourseId);
            console.log('📝 Retrieved stored topics:', storedTopics?.length || 0);
            
            if (Array.isArray(storedTopics) && storedTopics.length > 0) {
              for (const topic of storedTopics) {
                try {
                  const topicName = sanitizeTopicName(topic?.name);
                  let topicContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
                  if (!topicContent) {
                    topicContent = await proContentManager.getStoredTopicContent(null, topicName);
                  }
                  if (topicContent) {
                    topicsWithContent.push({
                      name: topicName,
                      content: {
                        reading: topicContent.reading || topicContent.readingMaterial || '',
                        summary: topicContent.summary || topicContent.topicSummary || '',
                        videos: Array.isArray(topicContent.videos) ? topicContent.videos : [],
                        quiz: Array.isArray(topicContent.quiz) ? topicContent.quiz : 
                              Array.isArray(topicContent.quizQuestions) ? topicContent.quizQuestions : [],
                        resources: Array.isArray(topicContent.resources) ? topicContent.resources : []
                      }
                    });
                    console.log('📝 Assembled content for stored topic:', topic.name);
                  }
                } catch (e) {
                  console.warn('Failed to get content for stored topic:', topic.name, e);
                }
              }
              
              if (topicsWithContent.length > 0) {
                courseContent = { topics: topicsWithContent };
                console.log('📝 Successfully assembled course content from stored topics');
              }
            }
          }
        } catch (e) {
          console.warn('Failed to get content from storage:', e);
        }
      }
      
      const topicsEmpty = !courseContent || !courseContent.topics ||
        (Array.isArray(courseContent.topics) ? courseContent.topics.length === 0 : Object.keys(courseContent.topics).length === 0);
      if (topicsEmpty) {
        console.error('❌ No course content found in local storage (after fallback)');
        alert('Error: No course content found. Please generate content first.');
        return;
      }

      // Generate smart course name based on topics
      const smartCourseName = generateSmartCourseName(courseContent.topics, courseTitle);
      
      // Prepare course data for working Django endpoint (expects topics as object)
      const topicsObject = Array.isArray(courseContent.topics)
        ? Object.fromEntries(courseContent.topics.map((t, idx) => {
            const c = t?.content ?? t ?? {};
            const reading = c.reading || c.readingMaterial || '';
            const summary = c.summary || c.topicSummary || '';
            const videos = Array.isArray(c.videos) ? c.videos : [];
            let quiz = [];
            if (Array.isArray(c.quiz)) quiz = c.quiz;
            else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
            else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
            const resources = Array.isArray(c.resources) ? c.resources : [];
            return [
              sanitizeTopicName(t.name),
              {
                content: { reading, summary, videos, quiz, resources },
                order: idx,
                readingMaterial: reading,
                summary,
                videos,
                quiz,
                resources
              }
            ]
          }))
        : Object.fromEntries(Object.entries(courseContent.topics).map(([name, t], idx) => {
            const c = t?.content ?? t ?? {};
            const reading = c.reading || c.readingMaterial || '';
            const summary = c.summary || c.topicSummary || '';
            const videos = Array.isArray(c.videos) ? c.videos : [];
            let quiz = [];
            if (Array.isArray(c.quiz)) quiz = c.quiz;
            else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
            else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
            const resources = Array.isArray(c.resources) ? c.resources : [];
            return [
              sanitizeTopicName(name),
              {
                content: { reading, summary, videos, quiz, resources },
                order: idx,
                readingMaterial: reading,
                summary,
                videos,
                quiz,
                resources
              }
            ];
          }));

      const courseData = {
        course_name: currentCourseId, // stable identifier used by backend
        title: smartCourseName,
        overwrite: true,
        topics: topicsObject
      };

  // Get auth token from localStorage only (no IndexedDB)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      if (!token) {
        console.error('❌ No authentication token found');
        alert('Please log in to save courses to your Learning Hub.');
        return;
      }

  // Save to SQLite using Django endpoint
  try { tracking.capture('pro_learning.save_attempted', { course_id: currentCourseId }, { feature: 'pro_learning' }); } catch {}
      const axios = (await import('../../utils/axios')).default;
      const response = await axios.post('/courses/pro-learning/save-course/', courseData);
      const responseData = response.data;

      if (response.status >= 200 && response.status < 300) {
  console.log('✅ Course saved to Learning Hub successfully!', responseData);
  try { tracking.capture('pro_learning.save_succeeded', { course_id: currentCourseId }, { feature: 'pro_learning' }); } catch {}
        toast.success('✅ Course saved to your Learning Hub successfully!');
        
        // Update course saved status
        const courseKey = `${currentCourseId}_${smartCourseName}`;
        const savedStatus = localStorage.getItem('coursesSavedToHub');
        let savedCourses = [];
        
        if (savedStatus) {
          try {
            savedCourses = JSON.parse(savedStatus);
          } catch (error) {
            console.error('Error parsing saved courses:', error);
          }
        }
        
        if (!savedCourses.includes(courseKey)) {
          savedCourses.push(courseKey);
          localStorage.setItem('coursesSavedToHub', JSON.stringify(savedCourses));
        }
        
        // Mark course as ready and mark notified to avoid duplicate toasts later
        localStorage.setItem(`proLearning_courseReady_${currentCourseId}`, 'true');
        try {
          localStorage.setItem(`proLearning_savedNotified_${currentCourseId}`, 'true');
        } catch (_) {}
        
      } else {
  console.error('❌ Failed to save course:', responseData);
  try { tracking.capture('pro_learning.save_failed', { course_id: currentCourseId, status: response.status }, { feature: 'pro_learning', success: false, error_code: String(response.status) }); } catch {}
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 409) {
          toast.warning('This course already exists in your Learning Hub.');
          // Mark as saved locally to reflect existing state
          try {
            const courseKey = `${currentCourseId}_${smartCourseName}`;
            const savedStatus = localStorage.getItem('coursesSavedToHub');
            const savedCourses = savedStatus ? JSON.parse(savedStatus) : [];
            if (!savedCourses.includes(courseKey)) {
              savedCourses.push(courseKey);
              localStorage.setItem('coursesSavedToHub', JSON.stringify(savedCourses));
            }
          } catch {}
        } else {
          toast.error(responseData.error || 'Failed to save course');
        }
      }

    } catch (error) {
      console.error('❌ Failed to save course to Learning Hub:', error);
      try { tracking.capture('pro_learning.save_failed', { course_id: currentCourseId, message: String(error) }, { feature: 'pro_learning', success: false, error_code: 'NETWORK' }); } catch {}
      toast.error('Network error. Please check your connection and try again.');
    }
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
  const initializeBatchGeneration = async () => {
      if (topicsList.length > 0 && courseTitle) {
        
        // Get current generation progress using the storage service
        const progress = getGenerationProgress(courseTitle);
        
        // If all topics already have content, set completion state
        if (progress.generated >= progress.total && progress.total > 0) {
          console.log('🎉 Direct URL course already complete, setting completion state');
          setAllTopicsGenerated(true);
          setBatchGenerationProgress(100);
          setBatchGenerationStatus('Course generation completed!');
          setIsBatchGenerating(false);
          return;
        }
        
        // If not all topics have content, start batch generation
        if (progress.generated < progress.total) {
          setIsBatchGenerating(true);
          setBatchGenerationStatus('Starting batch content generation...');
          
          // Generate content for all topics using new storage system
          await batchGenerateAllTopics(
            courseTitle,
            topicsList, 
            generateProContent, 
            setBatchGenerationStatus, 
            setIsBatchGenerating, 
            setBatchGenerationProgress
          );
        } else {
        }
      }
    };
    
    // Add a small delay to ensure topicsList and courseTitle are populated
    const timer = setTimeout(() => {
      if (topicsList.length > 0 && courseTitle) {
        initializeBatchGeneration();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [topicsList, courseTitle, useProgressiveGeneration]); // Add courseTitle dependency

  // Handle initial content loading when page loads with topic parameter
  useEffect(() => {
    const loadInitialTopicContent = async () => {
      if (topicParam && !isLoading && !content) {
        // Use robust parser to get the primary topic
        const parsed = parseTopicsFromParam(topicParam);
        const actualTopic = parsed.length > 0 ? parsed[0] : topicParam;
        console.log('🎯 Loading initial content for topic from URL:', actualTopic);
        
        const currentCourseId = getCourseId();
        if (!currentCourseId) {
          console.log('❌ No course ID found, cannot load topic content');
          return;
        }

        console.log('🎯 DEBUG: Initial topic loading for:', actualTopic);
        console.log('🎯 DEBUG: Course ID:', currentCourseId);
        
        // Check if we should skip old cached content
        const shouldSkipOld = shouldSkipOldCachedContent();
        
        if (shouldSkipOld) {
          console.log('🔄 DEBUG: Fresh course creation mode - checking for fresh content for:', actualTopic);
          
          // Check if there's any freshly generated content
          const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, actualTopic);
          console.log('🔍 DEBUG: ProContentManager stored content:', !!storedContent);
          if (storedContent) {
            console.log('🔍 DEBUG: ProContentManager content details:', {
              hasReading: !!storedContent.reading,
              hasSummary: !!storedContent.summary,
              hasMetadata: !!storedContent.metadata,
              metadataKeys: storedContent.metadata ? Object.keys(storedContent.metadata) : []
            });
          }
          
          if (storedContent && isContentFreshlyGenerated(storedContent, true)) { // Enable strict mode
            console.log('✅ DEBUG: Using freshly generated content for topic:', actualTopic);
            // Use the fresh content
            setContent({
              reading: storedContent.reading,
              summary: storedContent.summary || 'Summary not available',
              quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
              videos: storedContent.videos || [],
              resources: storedContent.resources || []
            });
          } else {
            console.log('❌ DEBUG: No fresh content found - skipping all cached content for:', actualTopic);
            // Don't load any cached content, let the generation process handle it
            return;
          }
        } else {
          console.log('📚 DEBUG: Normal mode - checking for any stored content for:', actualTopic);
          // Normal navigation - check if we have stored content for this topic
          const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, actualTopic);
          console.log('🔍 DEBUG: Found stored content:', !!storedContent);
        
          if (storedContent && storedContent.reading) {
            console.log('✅ DEBUG: Loading existing stored content for topic:', actualTopic);
            
            // Set content directly from storage
            setContent({
              reading: storedContent.reading,
              summary: storedContent.summary || 'Summary not available',
              quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
              videos: storedContent.videos || [],
              resources: storedContent.resources || []
            });
            
            // CRITICAL: Also update available tabs for this topic
            const availableTabs = [];
            if (storedContent.reading) availableTabs.push('reading');
            if (storedContent.summary) availableTabs.push('summary');
            if (storedContent.videos?.length > 0) availableTabs.push('videos');
            if (storedContent.quiz?.length > 0 || (storedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
            if (storedContent.resources?.length > 0) availableTabs.push('resources');
            
            setAvailableTabsForTopics(prev => ({
              ...prev,
              [actualTopic]: availableTabs
            }));
            
            console.log('✅ DEBUG: Content loaded successfully for:', actualTopic);
          } else {
            console.log('🆕 DEBUG: No stored content found - will trigger generation for:', actualTopic);
            // No stored content found for topic
            // The existing logic will handle generating content
          }
        }
      }
    };

    // Run after a small delay to ensure ProContentManager is initialized
    // Only run for first-time generation, not for reload scenarios
    if (loadScenario === 'first-time' || loadScenario === null) {
      const timer = setTimeout(loadInitialTopicContent, 100);
      return () => clearTimeout(timer);
    }
  }, [topicParam, loadScenario]); // Depend on loadScenario to control when this runs

  // Get currently active topic
  const getCurrentTopic = () => {
    const activeTopic = topicsList.find(t => t.isActive);
    return activeTopic ? activeTopic.name : (topicParam || (topicsList.length > 0 ? topicsList[0].name : ''));
  };

  // Handle Pro Learning Experience button click - Generate all topics
  const handleProLearningStart = async () => {
    if (topicsList.length === 0) {
      return;
    }

    // Set batch marker to indicate fresh course creation
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('proLearning_batchMarker', String(Date.now()));
        console.log('🔄 DEBUG: Batch marker set for fresh course generation');
        
        // Clear existing content from both storage systems to ensure fresh generation (only once)
        const topicToClear = (topicParam || topicsList?.[0]?.name || topicsList?.[0]) || '';
        const id = getCourseId();
        if (topicToClear && id) {
          // Only clear if we haven't already cleared this topic in this session
          const clearKey = `cleared_${id}_${topicToClear}`;
          if (!sessionStorage.getItem(clearKey)) {
            clearTopicFromBothStorages(id, topicToClear);
            sessionStorage.setItem(clearKey, 'true');
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ DEBUG: Failed to set batch marker:', error);
    }

    setIsGeneratingCourse(true);
    setAllTopicsGenerated(false);
    setCourseGenerationProgress(0);
    setCourseGenerationStatus("🚀 Initializing Pro Learning Experience...");

    const currentCourseId = getCourseId();
    if (!currentCourseId) {
      setIsGeneratingCourse(false);
      setCourseGenerationStatus("❌ No course ID found");
      return;
    }

    try {
      if (useProgressiveGeneration) {
        // Progressive generation: reveal tabs as they are ready
        // Ensure a selected topic is set so onTabComplete can hydrate immediately
        if (!selectedTopic && topicsList?.length > 0) {
          try {
            setSelectedTopic(topicsList[0]);
          } catch {}
        }
        await initializeProgressiveGeneration(courseTitle, topicsList, {
          onProgress: (progress) => {
            setProgressiveGenerationProgress(progress);
            setCourseGenerationProgress(progress.overallProgress || 0);
            setCourseGenerationStatus(`Generating ${progress.tabName} for ${progress.topic}...`);
          },
          onTabComplete: (tabInfo) => {
            // Make this tab clickable immediately for this topic (for all topics progressively)
            setAvailableTabsForTopics(prev => {
              const topicTabs = prev[tabInfo.topic] || [];
              return topicTabs.includes(tabInfo.tabType)
                ? prev
                : { ...prev, [tabInfo.topic]: [...topicTabs, tabInfo.tabType] };
            });

            // Immediately update content if this is the currently selected topic
            if (selectedTopic?.name === tabInfo.topic) {
              console.log(`📝 DEBUG: Tab ${tabInfo.tabName} completed for ${tabInfo.topic} - updating content immediately`);
              
              // Get the fresh content and update immediately
              const freshContent = getProgressiveTopicContent(tabInfo.topic);
              if (freshContent) {
                const formattedContent = {
                  reading: freshContent.reading || '',
                  summary: freshContent.summary || '',
                  quiz: freshContent.quiz || [],
                  videos: freshContent.videos || [],
                  resources: freshContent.resources || []
                };

                // Merge new tab content into existing state
                setContent(prev => ({
                  reading: formattedContent.reading || prev?.reading || '',
                  summary: formattedContent.summary || prev?.summary || '',
                  quiz: (Array.isArray(formattedContent.quiz) && formattedContent.quiz.length > 0) ? formattedContent.quiz : (prev?.quiz || []),
                  videos: (Array.isArray(formattedContent.videos) && formattedContent.videos.length > 0) ? formattedContent.videos : (prev?.videos || []),
                  resources: (Array.isArray(formattedContent.resources) && formattedContent.resources.length > 0) ? formattedContent.resources : (prev?.resources || [])
                }));
                
                // Parse and set reading sections if reading was updated
                if (tabInfo.tabType === 'reading' && freshContent.reading) {
                  const sections = parseReadingSections(freshContent.reading);
                  setReadingSections(sections);
                  setReadingSectionIndex(0);
                }
              }
            } else if (!selectedTopic && topicsList?.length > 0 && (topicsList[0].name === tabInfo.topic || (topicsList[0] === tabInfo.topic))) {
              // If no selectedTopic yet, set it and hydrate
              setSelectedTopic(typeof topicsList[0] === 'string' ? { name: topicsList[0] } : topicsList[0]);
              loadProgressiveTopicContent(tabInfo.topic, { showLoader: false });
            }
          },
          onTopicComplete: () => {},
          onAllComplete: () => {
            // Progressive generation across ALL topics has finished
            console.log('🔥 DEBUG: Progressive generation completed for all topics');
            setIsProgressiveGenerating(false);
            setAllTopicsGenerated(true);
            setIsLoading(false);
            setCourseGenerationStatus('✅ All topics generated successfully!');

            // Auto-save after full progressive completion
            autoSaveToBackend().catch(error => {
              console.warn('Auto-save failed:', error);
            });

            // Clear the batch marker since generation is complete
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('proLearning_batchMarker');
                console.log('🧹 DEBUG: Batch marker cleared after progressive completion');
              }
            } catch (error) {
              console.warn('⚠️ DEBUG: Failed to clear batch marker:', error);
            }
          },
          onError: (err) => {
            console.error('❌ Progressive generation error:', err);
            setIsProgressiveGenerating(false);
          }
  }, { courseId: getCourseId() });

        setIsProgressiveGenerating(true);
        // Do not block the UI with the generic loader; tabs should appear as they become ready
        setIsGeneratingCourse(false);
        
  // Start progressive generation across ALL topics (do not await)
  startProgressiveGeneration();

        // Load first topic immediately (hydrate without blocking loader)
        const topicToLoad = topicParam || topicsList[0]?.name;
        if (topicToLoad) {
          await loadProgressiveTopicContent(topicToLoad, { showLoader: false });
        }
      } else {
        // Legacy batch generation (kept as fallback)
        await proContentManager.generateAllContentBatch(
          topicsList,
          currentCourseId,
          (current, total, topicName, contentType) => {
            const progress = Math.round((current / total) * 100);
            setCourseGenerationProgress(progress);
            setCourseGenerationStatus(`Generating ${contentType} for ${topicName}...`);
            console.log(`📈 Pro Learning Start Progress: ${progress}% - ${contentType} for ${topicName}`);
          }
        );

        // Mark all topics as generated
        setAllTopicsGenerated(true);
        setCourseGenerationStatus("✅ All topics generated successfully!");
        
        // Auto-load first topic content or topic from URL
        const topicToLoad = topicParam || topicsList[0]?.name;
        if (topicToLoad) {
          console.log('🎯 Auto-loading topic after Pro Learning start:', topicToLoad);
          await loadTopicContent(topicToLoad);
        }
      }

    } catch (error) {
      console.error('❌ Pro Learning start failed:', error);
      setCourseGenerationStatus("❌ Generation failed. Please try again.");
    } finally {
      setTimeout(() => {
        setIsGeneratingCourse(false);
        setCourseGenerationProgress(0);
        setCourseGenerationStatus("");
      }, 2000);
    }
  };

  // Clear storage function (for debugging/development)
  const clearContentStorage = () => {
    proContentManager.clearStorage();
    contentStorageService.clearStorage(); // Clear Map-based storage too
    clearReadingContentCache();
    
    // Reset local state to force regeneration
    setContent(null);
    setReadingSections([]);
    setReadingSectionIndex(0);
    setTopicsList([]);
    setCompletedTopics([]);
  };

  // Clear content for a specific topic from both storage systems (for fresh generation)
  const clearTopicFromBothStorages = (courseId, topicName) => {
    try {
      console.log('🗑️ DEBUG: Clearing topic content from both storage systems:', topicName);
      
      // Clear from ProContentManager (localStorage/IndexedDB)
      if (proContentManager.clearTopicStorage) {
        proContentManager.clearTopicStorage(courseId, topicName);
      }
      
      // Clear from ContentStorageService (Map-based) - but preserve the topic, just clear content
      const topic = contentStorageService.getTopicByName(topicName, courseId);
      if (topic && topic.id) {
        console.log('🗑️ DEBUG: Removing content for topic ID:', topic.id);
        // Only remove the content, not the topic itself to avoid ID mismatches
        if (contentStorageService.removeTopicContent) {
          contentStorageService.removeTopicContent(topic.id);
        }
        // Don't remove the topic itself - just mark it as not having content
        const topicData = contentStorageService.storage?.topics?.get(topic.id);
        if (topicData) {
          topicData.contentGenerated = false;
          topicData.contentId = null;
          topicData.updatedAt = new Date().toISOString();
          contentStorageService.storage.topics.set(topic.id, topicData);
          console.log('🗑️ DEBUG: Topic content cleared but topic preserved:', topic.id);
        }
      }
      
      console.log('🗑️ DEBUG: Topic content cleared from both storage systems');
    } catch (error) {
      console.error('❌ Error clearing topic content:', error);
    }
  };

  // Reading section navigation handlers
  const handlePrevSection = () => {
    if (readingSectionIndex > 0) {
      setReadingSectionIndex(readingSectionIndex - 1);
    }
  };

  const handleNextSection = () => {
    if (readingSectionIndex < readingSections.length - 1) {
      setReadingSectionIndex(readingSectionIndex + 1);
    }
  };

  // Parse reading content into sections
  const parseReadingSections = (readingContent) => {
    if (!readingContent || typeof readingContent !== 'string') {
      return [{ header: 'Reading Material', content: readingContent || '' }];
    }

    // Split by ## headers (markdown H2)
    const sections = readingContent.split(/^## /m).filter(section => section.trim());
    
    if (sections.length <= 1) {
      // No clear sections, return as single section
      return [{ header: 'Reading Material', content: readingContent }];
    }

    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const header = index === 0 ? 'Introduction' : lines[0].trim();
      const content = index === 0 ? section : lines.slice(1).join('\n').trim();
      
      return {
        header: header || `Section ${index + 1}`,
        content: content || ''
      };
    });
  };

  // Map icon names to actual React components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'FaBookOpen': FaBookOpen,
      'FaGraduationCap': FaGraduationCap,
      'FaVideo': FaVideo,
      'FaCode': FaCode,
      'FaDownload': FaDownload,
      'FaBook': FaBook,
      'FaNewspaper': FaNewspaper,
      'FaLaptopCode': FaLaptopCode,
      'FaUsers': FaUsers,
      'FaBookmark': FaBookmark,
      'FaYoutube': FaYoutube,
      'FaCertificate': FaCertificate,
      'FaExternalLinkAlt': FaExternalLinkAlt,
      'FaStar': FaStar
    };
    return iconMap[iconName] || FaExternalLinkAlt;
  };
  
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

  // Update URL when activeTab changes
  const updateActiveTab = (newTab) => {
  tabUrlSyncPendingRef.current = true;
  setActiveTab(newTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
  setSearchParams(newSearchParams, { replace: true });
  // Clear the pending flag on next tick
  setTimeout(() => { tabUrlSyncPendingRef.current = false; }, 0);
  };

  // Debounced version for desktop to prevent rapid clicking issues
  const debouncedUpdateActiveTab = useRef(null);
  
  const updateActiveTabDesktop = (newTab) => {
    // Clear any pending debounced calls
    if (debouncedUpdateActiveTab.current) {
      clearTimeout(debouncedUpdateActiveTab.current);
    }
    
    // Immediately update the UI
    tabUrlSyncPendingRef.current = true;
    setActiveTab(newTab);
    
    // Debounce the URL update to prevent excessive navigation
    debouncedUpdateActiveTab.current = setTimeout(() => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', newTab);
      setSearchParams(newSearchParams, { replace: true });
      tabUrlSyncPendingRef.current = false;
    }, 100); // 100ms debounce
  };

  // Update URL when topic changes
  const updateTopicInUrl = (newTopic) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('topic', newTopic);
    // Reset tab to reading when changing topics
  newSearchParams.set('tab', 'reading');
  // Avoid double setSearchParams race: update activeTab state locally, then set both params once
  setActiveTab('reading');
  setSearchParams(newSearchParams, { replace: true });
  };

  // Handle URL tab parameter changes (after topic initialization is complete)
  // Coerce invalid/unready tabs to the first available tab for the current topic
  useEffect(() => {
    if (topicsList.length === 0 || !selectedTopic) return; // Wait for initialization to complete
    if (tabUrlSyncPendingRef.current) return; // Skip while a local sync is pending

    const requestedTab = searchParams.get('tab') || 'reading';

    // In progressive mode, only allow tabs that are ready for the selected topic
    if (useProgressiveGeneration) {
      const topicName = selectedTopic.name;
      const ready = [...(availableTabsForTopics[topicName] || [])];
      // Treat already-loaded content as ready ONLY if it belongs to this topic
      if (content && contentTopicName === topicName) {
        if (content.reading && !ready.includes('reading')) ready.push('reading');
        if (content.summary && !ready.includes('summary')) ready.push('summary');
        if ((content.videos?.length || 0) > 0 && !ready.includes('videos')) ready.push('videos');
        if (((Array.isArray(content.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0)) && !ready.includes('quiz')) ready.push('quiz');
        if ((content.resources?.length || 0) > 0 && !ready.includes('resources')) ready.push('resources');
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

    const readyTabs = availableTabsForTopics[topicName] || [];
    // Consider content already loaded as ready as well
    if (content) {
      if (content.reading && !readyTabs.includes('reading')) readyTabs.push('reading');
      if (content.summary && !readyTabs.includes('summary')) readyTabs.push('summary');
      if ((content.videos?.length || 0) > 0 && !readyTabs.includes('videos')) readyTabs.push('videos');
      if ((content.quiz?.length || 0) > 0 && !readyTabs.includes('quiz')) readyTabs.push('quiz');
      if ((content.resources?.length || 0) > 0 && !readyTabs.includes('resources')) readyTabs.push('resources');
    }

    if (readyTabs.length === 0) return;

    // Only enforce auto-switching for the FIRST topic while progressive generation is active,
    // to avoid exposing later topics prematurely.
    const firstTopicName = topicsList?.[0]?.name || topicsList?.[0];
    const isFirstTopic = topicName === firstTopicName;
    if (!isFirstTopic && isProgressiveGenerating && !allTopicsGenerated) return;

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

  // Generate or get course ID for current session
  const generateCourseId = () => `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const getCourseId = () => {
    // Prefer URL param; otherwise use cached localStorage. The IndexedDB write happens when setting.
    return courseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('currentCourseId') : null) || null;
  };

  const setAndNavigateToCourseId = async (id) => {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('currentCourseId', id); } catch {}
    navigate(`/pro-learning/${id}${window.location.search}`, { replace: true });
  };

  // Effect to handle course ID generation and redirection
  useEffect(() => {
    if (!courseId) {
      const existingId = getCourseId();
      if (existingId) {
        setAndNavigateToCourseId(existingId);
      } else {
        const newId = generateCourseId();
        setAndNavigateToCourseId(newId);
      }
    }
  }, [courseId, navigate]);

  // Initialize course ID on first render
  useEffect(() => {
    const id = getCourseId();
  }, []);

  // Derive the count of completed topics for display purposes
  const completedTopicsCount = useMemo(() => {
    const currentCourseId = getCourseId();
    if (!currentCourseId || !topicsList || topicsList.length === 0) {
      return 0;
    }

    const isTopicComplete = (topic) => {
      // Prefer stored content when available (progressive/batch paths)
      const stored = contentStorageService.getContentByTopicName(topic.name || topic, currentCourseId);
      const fromDB = topic.dbTopic || null;
      const c = stored || (fromDB
        ? {
            reading: fromDB.reading_material,
            summary: fromDB.summary,
            videos: Array.isArray(fromDB.videos) ? fromDB.videos : [],
            quiz: Array.isArray(fromDB.quiz_questions) ? fromDB.quiz_questions : [],
            resources: Array.isArray(fromDB.resources) ? fromDB.resources : [],
          }
        : null);
      if (!c) return false;
      const readingOk = typeof c.reading === 'string' && c.reading.trim().length > 0;
      const summaryOk = typeof c.summary === 'string' && c.summary.trim().length > 0;
      const videosOk = Array.isArray(c.videos) && c.videos.length > 0;
      const quizOk = Array.isArray(c.quiz)
        ? c.quiz.length > 0
        : (c.quiz && Array.isArray(c.quiz?.questions) && c.quiz.questions.length > 0);
      const resourcesOk = Array.isArray(c.resources) && c.resources.length > 0;
      return readingOk && summaryOk && videosOk && quizOk && resourcesOk;
    };

    let completeCount = 0;
    for (const t of topicsList) {
      if (isTopicComplete(t)) completeCount += 1;
    }
    return completeCount;
  }, [topicsList, availableTabsForTopics, content, courseId, hasAnyContent, sectionGenerating, generatingTopics]);

  // Handle batch generation from ChatbotPage
  useEffect(() => {
    const handleContentGeneration = async () => {
      try {
        // Read batch payload from localStorage only
        const marker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
        let payload = null;
        if (typeof localStorage !== 'undefined') {
          const legacy = localStorage.getItem('proLearning_batchGeneration');
          if (legacy) {
            try { payload = JSON.parse(legacy); } catch {}
          }
        }
        if (!payload) return;

        const { courseId: batchCourseId, topics, topicString, triggerBatchGeneration, timestamp } = payload;

        // Only trigger if this is a recent request (within 5 minutes) and for this course
        const isRecent = timestamp && (Date.now() - timestamp < 5 * 60 * 1000);
        const isCurrentCourse = batchCourseId === courseId;
        
        if (!triggerBatchGeneration || !isRecent || !isCurrentCourse) {
          return;
        }

        // Starting content generation for course
        // Topics to generate: topics

        // Check if content already exists for this course
        const existingContent = await proContentManager.getStoredCourseContent(batchCourseId);
        if (existingContent && existingContent.metadata.status === 'completed') {
          console.log('✅ Course content already exists, loading from storage');
          setTopicsList(topics);
          setAllTopicsGenerated(true);
          return;
        }

        setTopicsList(topics);

        if (useProgressiveGeneration) {
          // Set batch marker to indicate fresh course creation
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('proLearning_batchMarker', String(Date.now()));
              console.log('🔄 DEBUG: Batch marker set for automatic progressive generation');

              // Clear existing content from both storage systems to ensure fresh generation (only once)
              // Use batchCourseId and first topic from topics list (or URL param) to scope clearing
              const topicToClear = (topicParam || topics?.[0]?.name || topics?.[0]) || '';
              if (topicToClear && batchCourseId) {
                // Only clear if we haven't already cleared this topic in this session
                const clearKey = `cleared_${batchCourseId}_${topicToClear}`;
                if (!sessionStorage.getItem(clearKey)) {
                  clearTopicFromBothStorages(batchCourseId, topicToClear);
                  sessionStorage.setItem(clearKey, 'true');
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ DEBUG: Failed to set batch marker:', error);
          }

          // Using progressive content generation
          // Initialize progressive generation
          await initializeProgressiveGeneration(courseTitle, topics, {
            onProgress: (progress) => {
              setProgressiveGenerationProgress(progress);
              // Progressive Generation Progress: progress
            },
            onTabComplete: (tabInfo) => {
              console.log(`✅ Tab completed: ${tabInfo.tabName} for ${tabInfo.topic}`);
              
              // Update available tabs ONLY if content is meaningful for this tab
              setAvailableTabsForTopics(prev => {
                const topicTabs = prev[tabInfo.topic] || [];
                const c = tabInfo.content;
                const hasMeaningful = (tabType, content) => {
                  switch (tabType) {
                    case 'reading': return typeof content === 'string' && content.trim().length > 0;
                    case 'summary': return typeof content === 'string' && content.trim().length > 0;
                    case 'videos': return Array.isArray(content) && content.length > 0;
                    case 'quiz': return Array.isArray(content) && content.length > 0;
                    case 'resources': return Array.isArray(content) && content.length > 0;
                    default: return false;
                  }
                };
                if (!topicTabs.includes(tabInfo.tabType) && hasMeaningful(tabInfo.tabType, c)) {
                  return {
                    ...prev,
                    [tabInfo.topic]: [...topicTabs, tabInfo.tabType]
                  };
                }
                return prev;
              });

              // If this is the first tab of the first topic, auto-load it
              if (tabInfo.topicIndex === 0 && tabInfo.tabIndex === 0) {
                const topicToLoad = topicParam || topics[0]?.name;
                if (topicToLoad === tabInfo.topic) {
                  console.log('🎯 Auto-loading first topic content after first tab generation');
                  loadProgressiveTopicContent(tabInfo.topic, { showLoader: false });
                  
                  // Set the selected topic
                  const topicData = topics.find(t => (t.name || t) === tabInfo.topic);
                  if (topicData) {
                    setSelectedTopic(topicData);
                  }
                }
              }
              
              // If the current selected topic just got new content, refresh it
              if (selectedTopic && (selectedTopic.name || selectedTopic) === tabInfo.topic) {
                console.log('🔄 Refreshing content for current topic:', tabInfo.topic);
                loadProgressiveTopicContent(tabInfo.topic, { showLoader: false });
              }
            },
            onTopicComplete: (topicInfo) => {
              console.log(`🎉 Topic completed: ${topicInfo.topic}`);
            },
            onAllComplete: () => {
              // All progressive content generation completed!
              setIsProgressiveGenerating(false);
              setAllTopicsGenerated(true);
              
              // Auto-save for progressive generation completion
              console.log('🚀 Progressive generation completed, triggering auto-save...');
              autoSaveToBackend().catch(error => {
                console.warn('Auto-save failed:', error);
              });
            },
            onError: (error) => {
              console.error('❌ Progressive generation error:', error);
              setIsProgressiveGenerating(false);
            }
          }, { courseId: batchCourseId });

          // Start progressive generation
          setIsProgressiveGenerating(true);
          await startProgressiveGeneration();
        } else {
          // Fallback to batch generation
          console.log('🎯 Using batch content generation');
          setIsBatchGenerating(true);
          setBatchGenerationProgress(0);
          setBatchGenerationStatus('Initializing course generation...');

          // Start batch generation
          await proContentManager.generateAllContentBatch(
            topics,
            batchCourseId,
            (current, total, topicName, contentType) => {
              const progress = Math.round((current / total) * 100);
              setBatchGenerationProgress(progress);
              setBatchGenerationStatus(`Generating ${contentType} for ${topicName}...`);
              console.log(`📈 Batch Generation Progress: ${progress}% - ${contentType} for ${topicName}`);
            }
          );

          // Mark generation as complete
          setIsBatchGenerating(false);
          setAllTopicsGenerated(true);
          setBatchGenerationProgress(100);
          setBatchGenerationStatus('Course generation completed!');
          
          // Auto-save is now handled directly in generateAllContentBatch
          console.log('✅ Legacy batch generation completed with auto-save');
        }
        
        // Auto-load the first topic or topic from URL for batch generation
        if (!useProgressiveGeneration) {
          const topicToLoad = topicParam || topics[0]?.name;
          if (topicToLoad) {
            console.log('🎯 Auto-loading topic after batch generation:', topicToLoad);
            loadTopicContent(topicToLoad);
          }
        }
        
        // Clear the trigger so it doesn't run again
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('proLearning_batchGeneration'); // legacy
            localStorage.removeItem('proLearning_batchMarker'); // new marker
          }
        } catch {}

      } catch (error) {
        console.error('❌ Content generation failed:', error);
        setIsBatchGenerating(false);
        setIsProgressiveGenerating(false);
        setBatchGenerationStatus('Generation failed. Please try again.');
      }
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
      (activeTab === 'resources' && (content?.resources?.length || 0) > 0)
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
    // Derive current topic name robustly (fallback to URL param if selectedTopic not yet set)
    const currentTopicName = selectedTopic?.name || (topicParam ? (topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam) : null);
    // Client-side reading readiness (strict): require sanitized content for current topic
    const readingClientReadyForCurrentTopic = (
      activeTab === 'reading' &&
      contentTopicName === currentTopicName &&
      !!readingRenderReady && typeof sanitizedReading === 'string' && sanitizedReading.trim().length > 0
    );
    
    // CRITICAL: Check if current topic is blocked (2nd topic onwards until course completion)
    if (currentTopicName && isTopicBlocked(currentTopicName)) {
      // For blocked topics, show the existing loading component instead of content
      return <LoadingComponent />;
    }
    
    // Show loading thoughtfully: in progressive mode, enforce reading-first for non-first topics
    if (useProgressiveGeneration) {
      const readyTabs = (currentTopicName && availableTabsForTopics[currentTopicName]) || [];
      const hasAnyContent = !!content && contentTopicName === currentTopicName && (
        // For reading, treat as content only if client-sanitized is ready
        (readingClientReadyForCurrentTopic) ||
        (content.summary && content.summary.trim()) ||
        ((content.videos?.length || 0) > 0) ||
        ((Array.isArray(content.quiz) ? content.quiz.length : (content.quiz?.questions?.length || 0)) > 0) ||
        ((content.resources?.length || 0) > 0)
      );
      if (isBatchGenerating) return <LoadingComponent />;
      // Only treat active tab as ready if its content belongs to this topic
      const activeHasContent = (contentTopicName === currentTopicName) && (
        // Require sanitized readiness for reading tab
        (activeTab === 'reading' && readingClientReadyForCurrentTopic) ||
        (activeTab === 'summary' && !!content?.summary) ||
        (activeTab === 'videos' && (content?.videos?.length || 0) > 0) ||
        (activeTab === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
        (activeTab === 'resources' && (content?.resources?.length || 0) > 0)
      );
      // If viewing a non-reading tab for a later topic while generating, require reading readiness
      const topicIndex = topicsList.findIndex(t => (t.name || t) === currentTopicName);
      // Enforce reading-first based on client-side sanitized readiness, not raw presence
      const readingReady = readingClientReadyForCurrentTopic;
      const enforceReadingFirst = (isProgressiveGenerating && topicIndex > 0 && activeTab !== 'reading' && !readingReady);
      if (enforceReadingFirst) {
        return <LoadingComponent />;
      }

      if ((isGeneratingCourse || isLoading) && !readyTabs.includes(activeTab) && !activeHasContent) {
        return <LoadingComponent />;
      }
    } else {
      // Legacy/batch mode: keep original blocking loader behavior
      if (isGeneratingCourse || isLoading || isBatchGenerating) {
        return <LoadingComponent />;
      }
    }
    
    // Decide whether to show the progressive generation card or the actual content
    // Show the status card only when the active tab is not ready and has no data yet
    if (isProgressiveGenerating) {
  const currentTopicName = selectedTopic?.name || (topicParam ? (topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam) : null);
      const readyTabs = (currentTopicName && availableTabsForTopics[currentTopicName]) || [];
      // Consider a tab ready if we already have content for it
      const activeHasContent = (contentTopicName === currentTopicName) && (
        (activeTab === 'reading' && readingClientReadyForCurrentTopic) ||
        (activeTab === 'summary' && !!content?.summary) ||
        (activeTab === 'videos' && (content?.videos?.length || 0) > 0) ||
        (activeTab === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
        (activeTab === 'resources' && (content?.resources?.length || 0) > 0)
      );
      const activeReady = (activeTab === 'reading')
        ? (readingClientReadyForCurrentTopic)
        : (readyTabs.includes(activeTab) || activeHasContent);

      if (!activeReady) {
        return <LoadingComponent />;
      }
    }

    // Global gate for Reading tab: keep loader until sanitization completes for current topic
    if (activeTab === 'reading' && !readingClientReadyForCurrentTopic) {
      return <LoadingComponent />;
    }

    // If no content and course not generated, show Pro Learning Experience button
    // ONLY if we truly have no course data at all
    const hasActiveTopic = topicsList.some(t => t.isActive);
    const isTopicFromDatabase = topicsList.some(t => t.dbTopic); // Check if any topic has database data
    const contentAlreadyLoaded = !!content;
    
    // Only show the "get started" screen if we have absolutely no course data
    if (!content && !allTopicsGenerated && !hasActiveTopic && !isTopicFromDatabase && !contentAlreadyLoaded && topicsList.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl text-center">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-12 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50"></div>
              
              <div className="relative z-10">
                {/* Hero Icon */}
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                  <FaRobot className="text-3xl text-white" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  🚀 Pro Learning Experience
                </h1>
                
                <p className="text-lg text-gray-600 mb-2">
                  Complete study materials for: <span className="font-bold text-blue-600">{getCurrentTopic()}</span>
                </p>

                <div className="flex justify-center space-x-6 my-8 text-sm text-gray-700">
                  <div className="flex items-center">
                    <FaBookOpen className="text-blue-500 mr-2" />
                    <span>📘 Reading</span>
                  </div>
                  <div className="flex items-center">
                    <FaBrain className="text-purple-500 mr-2" />
                    <span>🧠 Summary</span>
                  </div>
                  <div className="flex items-center">
                    <FaVideo className="text-red-500 mr-2" />
                    <span>🎥 Videos</span>
                  </div>
                  <div className="flex items-center">
                    <FaQuestionCircle className="text-green-500 mr-2" />
                    <span>✅ Quiz</span>
                  </div>
                  <div className="flex items-center">
                    <FaLink className="text-indigo-500 mr-2" />
                    <span>📚 Resources</span>
                  </div>
                </div>

                <button
                  onClick={handleProLearningStart}
                  disabled={topicsList.length === 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {topicsList.length === 0 ? 
                    'Loading Topics...' : 
                    `🚀 Start Pro Learning Experience`
                  }
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // If no content but course is generated, show message
    if (!content) {
      console.log('🔍 No content found - debugging values:', {
        content: !!content,
        allTopicsGenerated,
        hasActiveTopic,
        isTopicFromDatabase,
        contentAlreadyLoaded,
        courseTitle,
        selectedTopic: selectedTopic?.name,
        topicsListLength: topicsList.length
      });
      
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-lg">
            {!courseTitle && topicsList.length === 0 ? (
              <div>
                <p className="text-gray-600 mb-4">Enter a course title to get started</p>
                <div className="text-gray-500 text-sm space-y-2">
                  <p>Try clicking the Pro Learning title above and entering a course like:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Web Development with React</li>
                    <li>Python Programming Basics</li>
                    <li>Machine Learning Fundamentals</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-600 ml-3">Loading content for "{selectedTopic?.name || 'selected topic'}"...</p>
                </div>
                <p className="text-gray-500 text-sm">Content will appear automatically once loaded</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Check if current tab content is available in progressive generation
    const isCurrentTabAvailable = useProgressiveGeneration && selectedTopic?.name
      ? (availableTabsForTopics[selectedTopic.name]?.includes(activeTab))
      : true;

    // Show "content being generated" message for progressive generation ONLY if no content exists
    if (useProgressiveGeneration && !isCurrentTabAvailable && !content) {
      return (
        <div className="max-w-none pt-6">
          <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border border-yellow-200 rounded-xl p-8 mb-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <FaClock className="text-xl animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Content Being Generated</h3>
            <p className="text-gray-600 mb-4">
              {tabs.find(t => t.id === activeTab)?.label} content for <strong>{selectedTopic?.name}</strong> is currently being generated.
            </p>
            {isProgressiveGenerating && progressiveGenerationProgress.topic === selectedTopic?.name && (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="text-sm text-gray-700 mb-2">
                  Currently generating: <strong>{progressiveGenerationProgress.tabName}</strong>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressiveGenerationProgress.overallProgress || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {progressiveGenerationProgress.overallProgress || 0}% Complete
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Content will appear here automatically once it's ready. You can switch to other topics or check available tabs.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "reading":
        // BLOCK CHECK: If topic is blocked, don't show empty content panels
        if (currentTopicName && isTopicBlocked(currentTopicName)) {
          return <LoadingComponent />;
        }
        
        // Additional fallback: if content exists but reading is empty, try to show other content
        const hasAnyContent = content && (content.reading || content.summary || content.videos?.length || content.quiz?.length || content.resources?.length);
        
        return (
          <div className="max-w-none pt-6">
            {/* Compact Reading Header */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaBookOpen className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Reading Material</h2>
                    <p className="text-sm text-gray-600">Comprehensive study content</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Enhanced Content with better typography, all content together */}
            <div className="prose prose-lg max-w-none">
              {readingRenderReady && sanitizedReading ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeKatex]}
                  components={{
                    h1: ({children}) => (
                      <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {children}
                      </h1>
                    ),
                    h2: ({children}) => (
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6 flex items-center">
                        <FaLightbulb className="text-yellow-500 mr-2" />
                        {children}
                      </h3>
                    ),
                    p: ({children}) => {
                      // Check if children contains code blocks or SyntaxHighlighter components
                      const hasCodeBlock = React.Children.toArray(children).some(child => {
                        if (React.isValidElement(child)) {
                          // Check for pre elements, code elements with language classes, or SyntaxHighlighter
                          return child.type === 'pre' || 
                                 (child.props && child.props.className && child.props.className.includes('language-')) ||
                                 (child.type && child.type.displayName === 'SyntaxHighlighter');
                        }
                        return false;
                      });
                      
                      // Use div for paragraphs containing code blocks to avoid nesting issues
                      if (hasCodeBlock) {
                        return (
                          <div className="text-gray-700 leading-relaxed mb-4 text-base">
                            {children}
                          </div>
                        );
                      }
                      
                      return (
                        <p className="text-gray-700 leading-relaxed mb-4 text-base">
                          {children}
                        </p>
                      );
                    },
                    pre: ({children}) => {
                      // Ensure pre elements are not wrapped in paragraphs
                      return (
                        <div className="my-4">
                          {children}
                        </div>
                      );
                    },
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || "");
                      const lang = match ? match[1] : "";
                      if (inline) {
                        return (
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono border" {...props}>{children}</code>
                        );
                      }
                      // Use the code string as a unique id for this code block
                      const codeString = String(children).replace(/\n$/, "");
                      const blockId = codeString;
                      return (
                        <div className="relative my-6 inline-block max-w-full" style={{ width: 'fit-content' }}>
                          <div className="inline-flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-xl" style={{ width: '100%' }}>
                            <span className="text-xs text-gray-500 font-mono">{lang || "code"}</span>
                            <button
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-100 bg-white ml-2 flex items-center gap-1 cursor-pointer"
                              onClick={() => handleCopyCode(codeString, blockId)}
                              type="button"
                            >
                              {copySuccessMap[blockId] ? (
                                <>
                                  <FaCheck className="inline-block text-green-600" /> Copied!
                                </>
                              ) : (
                                <>Copy</>
                              )}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={{
                              'code[class*="language-"]': {
                                color: '#f8f8f2',
                                background: 'none',
                                fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                fontSize: '1rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre',
                                wordSpacing: 'normal',
                                wordBreak: 'normal',
                                wordWrap: 'normal',
                                tabSize: 4,
                                hyphens: 'none'
                              },
                              'pre[class*="language-"]': {
                                color: '#f8f8f2',
                                background: '#23272f',
                                overflow: 'auto'
                              },
                              comment: { color: '#6272a4', fontStyle: 'italic' },
                              prolog: { color: '#6272a4' },
                              doctype: { color: '#6272a4' },
                              cdata: { color: '#6272a4' },
                              punctuation: { color: '#f8f8f2' },
                              property: { color: '#50fa7b' },
                              tag: { color: '#ff79c6' },
                              constant: { color: '#bd93f9' },
                              symbol: { color: '#bd93f9' },
                              deleted: { color: '#ff5555' },
                              boolean: { color: '#bd93f9' },
                              number: { color: '#bd93f9' },
                              selector: { color: '#50fa7b' },
                              'attr-name': { color: '#50fa7b' },
                              string: { color: '#f1fa8c' },
                              char: { color: '#f1fa8c' },
                              builtin: { color: '#8be9fd' },
                              inserted: { color: '#50fa7b' },
                              operator: { color: '#ff79c6' },
                              entity: { color: '#f8f8f2', cursor: 'help' },
                              url: { color: '#f8f8f2' },
                              variable: { color: '#f8f8f2' },
                              atrule: { color: '#8be9fd' },
                              'attr-value': { color: '#f1fa8c' },
                              function: { color: '#50fa7b' },
                              'class-name': { color: '#8be9fd' },
                              keyword: { color: '#ff79c6' },
                              regex: { color: '#f1fa8c' },
                              important: { color: '#ff5555', fontWeight: 'bold' }
                            }}
                            language={lang}
                            customStyle={{
                              borderRadius: "0 0 0.75rem 0.75rem",
                              fontSize: "1rem",
                              margin: 0,
                              padding: "1rem",
                              background: "#23272f",
                              border: "1px solid #222c37",
                              color: "#f8f8f2",
                              lineHeight: "1.4",
                              display: 'inline-block',
                              maxWidth: '100%'
                            }}
                            codeTagProps={{
                              style: { 
                                fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                color: '#f8f8f2'
                              },
                              className: 'custom-syntax-highlight'
                            }}
                            showLineNumbers={false}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      );
                    },
                    ul: ({children}) => <ul className="space-y-2 mb-6 ml-6">{children}</ul>,
                    li: ({children}) => (
                      <li className="flex items-start text-gray-700">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                        <span>{children}</span>
                      </li>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-6 py-4 my-6 rounded-r-lg">
                        <div className="flex items-start">
                          <FaLightbulb className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                          <div className="text-blue-800 italic">{children}</div>
                        </div>
                      </blockquote>
                    )
                  }}
                >
                  {sanitizedReading}
                </ReactMarkdown>
              ) : (
                // Fallback: waiting state or missing sanitized content
                readingRenderReady && sanitizedReading ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeHighlight, rehypeKatex]}
                    components={{
                      h1: ({children}) => (
                        <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {children}
                        </h1>
                      ),
                      h2: ({children}) => (
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                          {children}
                        </h2>
                      ),
                      h3: ({children}) => (
                        <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6 flex items-center">
                          <FaLightbulb className="text-yellow-500 mr-2" />
                          {children}
                        </h3>
                      ),
                      p: ({children}) => {
                        // Check if children contains code blocks or SyntaxHighlighter components
                        const hasCodeBlock = React.Children.toArray(children).some(child => {
                          if (React.isValidElement(child)) {
                            // Check for pre elements, code elements with language classes, or SyntaxHighlighter
                            return child.type === 'pre' || 
                                   (child.props && child.props.className && child.props.className.includes('language-')) ||
                                   (child.type && child.type.displayName === 'SyntaxHighlighter');
                          }
                          return false;
                        });
                        
                        // Use div for paragraphs containing code blocks to avoid nesting issues
                        if (hasCodeBlock) {
                          return (
                            <div className="text-gray-700 leading-relaxed mb-4 text-base">
                              {children}
                            </div>
                          );
                        }
                        
                        return (
                          <p className="text-gray-700 leading-relaxed mb-4 text-base">
                            {children}
                          </p>
                        );
                      },
                      pre: ({children}) => {
                        // Ensure pre elements are not wrapped in paragraphs
                        return (
                          <div className="my-4">
                            {children}
                          </div>
                        );
                      },
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || "");
                        const lang = match ? match[1] : "";
                        if (inline) {
                          return (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono border" {...props}>{children}</code>
                          );
                        }
                        // Use the code string as a unique id for this code block
                        const codeString = String(children).replace(/\n$/, "");
                        const blockId = codeString;
                        return (
                          <div className="relative my-6 inline-block max-w-full" style={{ width: 'fit-content' }}>
                            <div className="inline-flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-xl" style={{ width: '100%' }}>
                              <span className="text-xs text-gray-500 font-mono">{lang || "code"}</span>
                              <button
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-100 bg-white ml-2 flex items-center gap-1 cursor-pointer"
                                onClick={() => handleCopyCode(codeString, blockId)}
                                type="button"
                              >
                                {copySuccessMap[blockId] ? (
                                  <>
                                    <FaCheck className="inline-block text-green-600" /> Copied!
                                  </>
                                ) : (
                                  <>Copy</>
                                )}
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={{
                                'code[class*="language-"]': {
                                  color: '#f8f8f2',
                                  background: 'none',
                                  fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                  fontSize: '1rem',
                                  lineHeight: '1.5',
                                  whiteSpace: 'pre',
                                  wordSpacing: 'normal',
                                  wordBreak: 'normal',
                                  wordWrap: 'normal',
                                  tabSize: 4,
                                  hyphens: 'none'
                                },
                                'pre[class*="language-"]': {
                                  color: '#f8f8f2',
                                  background: '#23272f',
                                  overflow: 'auto'
                                },
                                comment: { color: '#6272a4', fontStyle: 'italic' },
                                prolog: { color: '#6272a4' },
                                doctype: { color: '#6272a4' },
                                cdata: { color: '#6272a4' },
                                punctuation: { color: '#f8f8f2' },
                                property: { color: '#50fa7b' },
                                tag: { color: '#ff79c6' },
                                constant: { color: '#bd93f9' },
                                symbol: { color: '#bd93f9' },
                                deleted: { color: '#ff5555' },
                                boolean: { color: '#bd93f9' },
                                number: { color: '#bd93f9' },
                                selector: { color: '#50fa7b' },
                                'attr-name': { color: '#50fa7b' },
                                string: { color: '#f1fa8c' },
                                char: { color: '#f1fa8c' },
                                builtin: { color: '#8be9fd' },
                                inserted: { color: '#50fa7b' },
                                operator: { color: '#ff79c6' },
                                entity: { color: '#f8f8f2', cursor: 'help' },
                                url: { color: '#f8f8f2' },
                                variable: { color: '#f8f8f2' },
                                atrule: { color: '#8be9fd' },
                                'attr-value': { color: '#f1fa8c' },
                                function: { color: '#50fa7b' },
                                'class-name': { color: '#8be9fd' },
                                keyword: { color: '#ff79c6' },
                                regex: { color: '#f1fa8c' },
                                important: { color: '#ff5555', fontWeight: 'bold' }
                              }}
                              language={lang}
                              customStyle={{
                                borderRadius: "0 0 0.75rem 0.75rem",
                                fontSize: "1rem",
                                margin: 0,
                                padding: "1rem",
                                background: "#23272f",
                                border: "1px solid #222c37",
                                color: "#f8f8f2",
                                lineHeight: "1.4",
                                display: 'inline-block',
                                maxWidth: '100%'
                              }}
                              codeTagProps={{
                                style: { 
                                  fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                                  color: '#f8f8f2'
                                },
                                className: 'custom-syntax-highlight'
                              }}
                              showLineNumbers={false}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                      ul: ({children}) => <ul className="space-y-2 mb-6 ml-6">{children}</ul>,
                      li: ({children}) => (
                        <li className="flex items-start text-gray-700">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                          <span>{children}</span>
                        </li>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-6 py-4 my-6 rounded-r-lg">
                          <div className="flex items-start">
                            <FaLightbulb className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                            <div className="text-blue-800 italic">{children}</div>
                          </div>
                        </blockquote>
                      )
                    }}
                  >
                    {sanitizedReading}
                  </ReactMarkdown>
                  ) : (isLoading || (content && content.reading && !readingRenderReady)) ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center px-6 py-3 bg-blue-50 rounded-lg">
                      <BiLoaderAlt className="animate-spin text-blue-600 mr-3" />
                      <span className="text-blue-800 font-medium">
                        {loadingStep || `Generating content for ${topicParam || 'topic'}...`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                      <FaExclamationTriangle className="text-yellow-600 text-2xl mx-auto mb-3" />
                      <p className="text-yellow-800 font-medium mb-2">No reading content available</p>
                      <p className="text-yellow-700 text-sm mb-4">
                        The content may still be generating or there was an issue loading it.
                      </p>
                      <button
                        onClick={() => {
                          setRegenerationAttempted(false); // Reset flag
                          setIsLoading(true);
                          setShowSkeletons(true);
                          setLoadingStep('Regenerating content...');
                          
                          const actualTopic = topicParam?.includes(',') ? topicParam.split(',')[0].trim() : topicParam;
                          if (actualTopic) {
                            // Force regeneration by calling generateProContent directly
                            generateProContent({
                              topic: actualTopic,
                              setIsLoading: () => {},
                              setLoadingProgress: () => {},
                              setShowSkeletons: () => {},
                              setLoadingStep: () => {},
                              setContent: (newContent) => {
                                if (newContent && newContent.reading) {
                                  setContent(newContent);
                                  const sections = parseReadingSections(newContent.reading);
                                  setReadingSections(sections);
                                  setReadingSectionIndex(0);
                                }
                                setIsLoading(false);
                                setShowSkeletons(false);
                              },
                              setStats: () => {},
                              content: null
                            }).catch(error => {
                              setIsLoading(false);
                              setShowSkeletons(false);
                            });
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Refresh Content
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        );

      case "summary":
        // BLOCK CHECK: If topic is blocked, don't show empty content panels
        if (currentTopicName && isTopicBlocked(currentTopicName)) {
          return <LoadingComponent />;
        }
        
        return (
          <div className="max-w-none pt-6">
            {/* Compact Summary Header */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaBrain className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Quick Summary</h2>
                    <p className="text-sm text-gray-600">Key points and concepts</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-purple-600 font-medium">Quick Review</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaBolt className="text-yellow-500 mr-1" />
                    <span>5-min read</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Summary Content */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={{
                  h1: ({children}) => (
                    <h1 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-purple-200 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></div>
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  p: ({children}) => {
                    // Check if children contains code blocks or SyntaxHighlighter components
                    const hasCodeBlock = React.Children.toArray(children).some(child => {
                      if (React.isValidElement(child)) {
                        // Check for pre elements, code elements with language classes, or SyntaxHighlighter
                        return child.type === 'pre' || 
                               (child.props && child.props.className && child.props.className.includes('language-')) ||
                               (child.type && child.type.displayName === 'SyntaxHighlighter');
                      }
                      return false;
                    });
                    
                    // Use div for paragraphs containing code blocks to avoid nesting issues
                    if (hasCodeBlock) {
                      return (
                        <div className="text-gray-700 leading-relaxed mb-4">
                          {children}
                        </div>
                      );
                    }
                    
                    return (
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {children}
                      </p>
                    );
                  },
                  pre: ({children}) => {
                    // Ensure pre elements are not wrapped in paragraphs
                    return (
                      <div className="my-4">
                        {children}
                      </div>
                    );
                  },
                  ul: ({children}) => <ul className="space-y-3 mb-6 ml-6">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex items-start text-gray-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <span className="leading-relaxed">{children}</span>
                    </li>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-6">
                      <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({children}) => (
                    <th className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100">
                      {children}
                    </td>
                  )
                }}
              >
                {content.summary}
              </ReactMarkdown>
            </div>
          </div>
        );

      case "videos":
        // BLOCK CHECK: If topic is blocked, don't show empty content panels
        if (currentTopicName && isTopicBlocked(currentTopicName)) {
          return <LoadingComponent />;
        }
        
        return (
          <div className="pt-6">
            {/* Compact Videos Header */}
            <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaVideo className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Video Learning</h2>
                    <p className="text-sm text-gray-600">
                      {content.videosMetadata?.source === 'youtube_api' ? 'Live YouTube Data' : 'Curated educational content'}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-red-600 font-medium">{content.videos.length} videos</span>
                  </div>
                  {content.videosMetadata?.avgViewCount && (
                    <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                      <span className="text-gray-600">
                        Avg: {formatViewCount(content.videosMetadata.avgViewCount)}
                      </span>
                    </div>
                  )}
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-gray-600">HD Quality</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaYoutube className="text-red-500 mr-1" />
                    <span>
                      {content.videosMetadata?.source === 'youtube_api' ? 'Real YouTube Data' : 'YouTube Curated'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Video Stats Summary */}
              {content.videosMetadata?.source === 'youtube_api' && content.videos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {content.videos.reduce((sum, v) => sum + (v.viewCount || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {content.videos.reduce((sum, v) => sum + (v.subscriberCount || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Subscribers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {content.videosMetadata.totalDuration || 0} min
                      </div>
                      <div className="text-xs text-gray-600">Total Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {content.videos.filter(v => v.isEducationalChannel).length}
                      </div>
                      <div className="text-xs text-gray-600">Verified Channels</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Video Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {content.videos.map((video, index) => (
                <div key={video.id} className="group bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="flex flex-col">
                    {/* Video Thumbnail */}
                    <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => openVideoModal(video)}>
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <IoPlayCircle className="text-red-500 text-2xl ml-1" />
                        </div>
                      </div>
                      {/* Duration badge */}
                      <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded-lg text-sm font-medium">
                        {video.formattedDuration || formatDuration(video.duration) || video.duration + ' min'}
                      </div>
                      {/* Quality badge */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        HD
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-red-600 transition-colors">
                          {video.title}
                        </h3>
                        <div className="ml-2 flex-shrink-0">
                          {video.isEducationalChannel && (
                            <div className="flex items-center bg-blue-100 px-2 py-1 rounded-full">
                              <IoCheckmarkCircle className="text-blue-500 mr-1 text-xs" />
                              <span className="text-xs font-semibold text-blue-700">Verified</span>
                            </div>
                          )}
                          {video.difficulty && (
                            <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                              video.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                              video.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {video.difficulty}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-4">
                        <FaYoutube className="text-red-500 mr-2" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{video.channel}</span>
                          {video.formattedSubscriberCount && (
                            <span className="text-xs text-gray-500">{video.formattedSubscriberCount}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <IoEye className="mr-1" />
                            <span>{video.formattedViewCount || (video.viewCount ? formatViewCount(video.viewCount) : video.views + ' views')}</span>
                          </div>
                          <div className="flex items-center">
                            <BiTime className="mr-1" />
                            <span>{video.formattedDuration || formatDuration(video.duration) || video.duration + ' min'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Video Description/Key Topics */}
                      {video.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      
                      {/* Key Topics Tags */}
                      {video.keyTopics && video.keyTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {video.keyTopics.slice(0, 3).map((topic, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openVideoModal(video)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                        >
                          <IoPlayCircle className="mr-1" />
                          Watch
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <IoBookmark className="text-lg" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                          <IoShare className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Video learning tips */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <FaLightbulb className="text-yellow-500 mr-3 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">Video Learning Tips</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Take notes while watching</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Practice along with examples</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Pause and replay difficult sections</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Apply concepts immediately</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "quiz":
        // BLOCK CHECK: If topic is blocked, don't show empty content panels
        if (currentTopicName && isTopicBlocked(currentTopicName)) {
          return <LoadingComponent />;
        }
        
        const answeredQuestions = content.quiz.filter(q => q.userAnswer !== null).length;
        const correctAnswers = content.quiz.filter(q => q.userAnswer === q.correct).length;
        const quizProgress = (answeredQuestions / content.quiz.length) * 100;
        const allQuestionsAnswered = answeredQuestions === content.quiz.length;
        
        return (
          <div className="pt-6">
            {/* Compact Quiz Header */}
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaQuestionCircle className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Knowledge Quiz</h2>
                    <p className="text-sm text-gray-600">Test your understanding</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-green-600 font-medium">{content.quiz.length} questions</span>
                  </div>
                  {quizSubmitted && (
                    <>
                      <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                        <span className="text-gray-600">{correctAnswers}/{answeredQuestions} correct</span>
                      </div>
                      <button 
                        onClick={() => {
                          // Restart quiz by resetting all user answers and submission state
                          setContent(prev => ({
                            ...prev,
                            quiz: prev.quiz.map(q => ({ ...q, userAnswer: null }))
                          }));
                          setQuizSubmitted(false);
                        }}
                        className="flex items-center border border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 font-medium rounded px-3 py-1 transition-colors duration-150 ml-2 cursor-pointer"
                        style={{gap: '0.4em'}}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.582 9A7.003 7.003 0 0112 5c3.314 0 6.127 2.163 6.918 5M18.418 15A7.003 7.003 0 0112 19c-3.314 0-6.127-2.163-6.918-5" /></svg>
                        Restart Quiz
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Compact Quiz Progress */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-600">
                  {quizSubmitted ? `Quiz completed: ${Math.round(quizProgress)}%` : `Progress: ${Math.round(quizProgress)}% complete`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{width: `${quizProgress}%`}}
                />
              </div>
            </div>
            
            {/* Quiz Questions */}
            <div className="space-y-6">
              {content.quiz.map((question, index) => {
                const isAnswered = question.userAnswer !== null;
                return (
                  <div key={question.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    {/* Question Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white mr-4 bg-gradient-to-br from-blue-500 to-purple-600">
                            {index + 1}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Question {index + 1} of {content.quiz.length}</span>
                          </div>
                        </div>
                      </div>
                      {question.code && (
                        <pre className="mb-4 bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm"><code>{question.code.replace(/^```[a-zA-Z]*|```$/g, '').trim()}</code></pre>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                        {question.question}
                      </h3>
                    </div>
                    {/* Answer Options */}
                    <div className="p-6">
                      <div className="space-y-3 mb-6">
                        {question.options.map((option, optionIndex) => {
                          let buttonStyle = "border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                          let iconStyle = "border-gray-300 text-gray-600";
                          
                          if (question.userAnswer === optionIndex) {
                            if (quizSubmitted) {
                              // Show correct/incorrect styling after submission
                              if (optionIndex === question.correct) {
                                buttonStyle = "border-2 border-green-500 bg-green-50 text-green-800";
                                iconStyle = "border-green-500 bg-green-500 text-white";
                              } else {
                                buttonStyle = "border-2 border-red-500 bg-red-50 text-red-800";
                                iconStyle = "border-red-500 bg-red-500 text-white";
                              }
                            } else {
                              // Show selected styling before submission
                              buttonStyle = "border-2 border-blue-500 bg-blue-50 text-blue-800";
                              iconStyle = "border-blue-500 bg-blue-500 text-white";
                            }
                          } else if (quizSubmitted && optionIndex === question.correct) {
                            // Show correct answer after submission
                            buttonStyle = "border-2 border-green-500 bg-green-50 text-green-800";
                            iconStyle = "border-green-500 bg-green-500 text-white";
                          }
                          
                          return (
                            <button
                              key={optionIndex}
                              onClick={() => {
                                // Only allow changes before quiz is submitted
                                if (!quizSubmitted) {
                                  setContent(prev => ({
                                    ...prev,
                                    quiz: prev.quiz.map(q =>
                                      q.id === question.id ? { ...q, userAnswer: optionIndex } : q
                                    )
                                  }));
                                }
                              }}
                              disabled={quizSubmitted}
                              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${buttonStyle} ${
                                quizSubmitted ? 'cursor-default' : 'cursor-pointer transform hover:scale-[1.02]'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold text-sm transition-all duration-200 ${iconStyle}`}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <span className="font-medium leading-relaxed">{option}</span>
                                {quizSubmitted && optionIndex === question.correct && (
                                  <span className="ml-auto text-green-600 font-semibold text-sm">✓ Correct</span>
                                )}
                                {quizSubmitted && question.userAnswer === optionIndex && optionIndex !== question.correct && (
                                  <span className="ml-auto text-red-600 font-semibold text-sm">✗ Your answer</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Submit Quiz Button */}
              {allQuestionsAnswered && !quizSubmitted && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-blue-100">
                    <FaQuestionCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Submit?</h3>
                  <p className="text-gray-600 mb-4">
                    You've answered all {content.quiz.length} questions. You can still change your answers before submitting.
                  </p>
                  <button 
                    onClick={() => setQuizSubmitted(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Submit Quiz
                  </button>
                </div>
              )}
              
              {/* Quiz Summary - Only show after submission */}
              {quizSubmitted && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-green-100">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Quiz Results</h3>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {correctAnswers}/{content.quiz.length} correct
                  </div>
                  <div className="text-gray-600 mb-4">
                    Score: {((correctAnswers / content.quiz.length) * 100).toFixed(0)}%
                  </div>
                  <div className="mb-4 text-gray-700 font-medium">
                    {((correctAnswers / content.quiz.length) * 100) >= 80
                      ? 'Excellent work! 🎉'
                      : ((correctAnswers / content.quiz.length) * 100) >= 60
                        ? 'Good job! Review explanations to improve. 📚'
                        : 'Keep practicing and try again! 💪'}
                  </div>
                  {/* Show explanations for all questions after quiz is submitted */}
                  <div className="text-left mt-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Question Review</h4>
                    <div className="space-y-4">
                      {content.quiz.map((question, idx) => {
                        const isCorrect = question.userAnswer === question.correct;
                        return (
                          <div key={question.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-2">Q{idx + 1}: {question.question}</div>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                {isCorrect ? (
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600 font-medium">Your Answer: </span>
                                <span className="text-gray-800">{question.options[question.userAnswer]}</span>
                              </div>
                              
                              <div>
                                <span className="text-gray-600 font-medium">Correct Answer: </span>
                                <span className="text-gray-800">{question.options[question.correct]}</span>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-gray-600 font-medium">Explanation:</span>
                                <p className="text-gray-700 mt-1">{question.explanation}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Restart quiz by resetting all user answers and submission state
                      setContent(prev => ({
                        ...prev,
                        quiz: prev.quiz.map(q => ({ ...q, userAnswer: null }))
                      }));
                      setQuizSubmitted(false);
                    }}
                    className="px-5 py-2 mt-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'resources':
        // Resources Renderer: Grid of resource cards with icons and descriptions
        // If resources are not yet available, keep showing the loader
        if (!Array.isArray(content?.resources) || content.resources.length === 0) {
          return <LoadingComponent />;
        }
        if (currentTopicName && isTopicBlocked(currentTopicName)) {
          return <LoadingComponent />;
        }
        
        return (
          <div className="space-y-6 pt-6">
            {/* Compact Resources Header */}
            <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaLink className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Learning Resources</h2>
                    <p className="text-sm text-gray-600">Curated materials for {getCurrentTopic()} mastery</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-blue-600 font-medium">{content.resources.length} Resources</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>⭐ Quality</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Compact Professional Resources Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {content.resources.map((resource, index) => {
                const iconName = getResourceIcon(resource.type);
                const IconComponent = getIconComponent(iconName);
                
                return (
                  <div
                    key={resource.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-2 h-full"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <IconComponent className="text-xl text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium mb-1">{resource.type}</div>
                        <div className="text-base font-semibold text-gray-900 line-clamp-2">{resource.title}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-3 mb-2">{resource.description}</div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-block text-blue-600 hover:underline text-sm font-medium"
                    >
                      Visit Resource
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        // BLOCK CHECK: If topic is blocked, don't show any content
        if (currentTopicName && isTopicBlocked(currentTopicName)) {
          return <LoadingComponent />;
        }
        return null;
    }
  };

  // Handle closing of batch generation status notification
  const handleCloseBatchStatus = () => {
    setBatchGenerationProgress(0);
    setBatchGenerationStatus('');
  };

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
                      const currentTopicName = selectedTopic?.name || (topicParam ? (topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam) : null);
                      
                      // Check if current topic is blocked (2nd topic onwards)
                      const currentTopicBlocked = currentTopicName ? isTopicBlocked(currentTopicName) : false;
                      
                      // Check if tab has content already (treat as available even if tabs map isn’t filled yet)
                      const hasTabContent = !!content && contentTopicName === currentTopicName && (
                        (tab.id === 'reading' && !!content?.reading && String(content.reading).trim().length > 0) ||
                        (tab.id === 'summary' && !!content?.summary && String(content.summary).trim().length > 0) ||
                        (tab.id === 'videos' && Array.isArray(content?.videos) && content.videos.length > 0) ||
                        (tab.id === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
                        (tab.id === 'resources' && Array.isArray(content?.resources) && content.resources.length > 0)
                      );

                      // Check if tab content is available for progressive generation
                      let isTabAvailable = true;
                      if (useProgressiveGeneration) {
                        // Progressive gating per topic: if the topic is blocked (no tabs ready yet), keep hidden; otherwise allow ready tabs.
                        let fresh = false;
                        try { if (typeof localStorage !== 'undefined') fresh = !!localStorage.getItem('proLearning_batchMarker'); } catch {}
                        // Reading-first rule: require reading to be ready before exposing other tabs while generating
                        const readingReady = ((currentTopicName && availableTabsForTopics[currentTopicName]?.includes('reading')) ||
                          (content && contentTopicName === currentTopicName && typeof content.reading === 'string' && content.reading.trim().length > 0));

                        if (currentTopicBlocked) {
                          isTabAvailable = false;
                        } else {
                          isTabAvailable = ((currentTopicName && availableTabsForTopics[currentTopicName]?.includes(tab.id)) || hasTabContent);
                          if ((isProgressiveGenerating || fresh) && tab.id !== 'reading' && !readingReady) {
                            isTabAvailable = false;
                          }
                        }
                      }
                      
                      // Tab is disabled if topic is blocked OR if progressive tab is not available
                      const isTabDisabled = currentTopicBlocked || (useProgressiveGeneration && !isTabAvailable);
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            if (!currentTopicBlocked && !isTabDisabled) {
                              updateActiveTabDesktop(tab.id); // Use debounced version for desktop
                              // Only reload content if progressive generation is enabled AND content is not already available
                              if (useProgressiveGeneration && currentTopicName && isTabAvailable && !content?.[tab.id]) {
                                // Only refresh if this specific tab content doesn't exist yet
                                loadProgressiveTopicContent(currentTopicName, { showLoader: false });
                              }
                            } else if (!currentTopicBlocked && useProgressiveGeneration && !isTabAvailable) {
                              // If disabled due to not ready, show skeletons briefly to convey loading
                              setShowSkeletons(true);
                              setLoadingStep(`Preparing ${tab.label}...`);
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
                            currentTopicBlocked 
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
                currentTopicName={selectedTopic?.name || (topicParam ? (topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam) : null)}
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
      <VideoPlayerModal />
    </>
  );
};

export default ProLearningPage;
