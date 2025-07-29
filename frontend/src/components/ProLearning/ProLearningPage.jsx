import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useNavigate, useParams } from "react-router-dom";
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
import proContentManager from '../../services/ProContentManager';
import Navbar from '../Navbar/Navbar';
import { classifyTopicsWithGemini } from './topicclassifier';
import BatchGenerationStatus from './BatchGenerationStatus';
import { saveAIGeneratedPlan, fetchUserAIGeneratedPlans } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { saveAITopicContent, fetchAITopicContent } from '../../services/api';


const ProLearningPage = () => {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  
  // UI state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Course and topic management with enhanced URL structure
  const courseId = params.courseId; // Get courseId from URL path
  const courseTitle = searchParams.get("courseTitle") || "";
  const topicParam = searchParams.get("topic"); // Get topic from URL if provided
  const activeTabParam = searchParams.get("tab") || "reading"; // Get active tab from URL
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicsList, setTopicsList] = useState([]);
  
  // Set default topics and initialize with consistent course ID
  useEffect(() => {
    const initializeDefaultTopics = async () => {
      const currentCourseId = getCourseId();
      
      // First check if we have stored topics for this course
      if (currentCourseId) {
        const storedTopics = proContentManager.getStoredTopics(currentCourseId);
        if (storedTopics.length > 0) {
          console.log('✅ Loading stored topics for course:', currentCourseId, storedTopics);
          setTopicsList(storedTopics);
          return; // Don't set default topics
        }
        
        // Also check if there's batch generation data with topics
        const batchData = localStorage.getItem('proLearning_batchGeneration');
        if (batchData) {
          try {
            const { courseId: batchCourseId, topics, topicString, originalQuery, triggerBatchGeneration } = JSON.parse(batchData);
            if (batchCourseId === currentCourseId && topics && topics.length > 0) {
              console.log('✅ Loading topics from batch generation data:', topics);
              setTopicsList(topics);
              
              // Set the query parameter from the original user input
              if (originalQuery && !searchParams.get('query')) {
                const params = new URLSearchParams(searchParams);
                params.set('query', originalQuery);
                setSearchParams(params);
                console.log('✅ Set query parameter from batch generation:', originalQuery);
              }
              
              return; // Don't set default topics
            }
          } catch (error) {
            console.warn('Failed to parse batch generation data:', error);
          }
        }
      }
      
      // Only set default topics if no courseTitle AND no stored topics found
      if (!courseTitle) {
        const defaultTopics = [
          { id: 1, name: "Introduction" },
          { id: 2, name: "Getting Started" },
          { id: 3, name: "Key Concepts" },
          { id: 4, name: "Best Practices" },
          { id: 5, name: "Advanced Topics" }
        ];
        setTopicsList(defaultTopics);
        
        // Get or generate a consistent course ID
        const existingCourseId = getCourseId();
        const finalCourseId = existingCourseId || generateCourseId();
        
        if (!existingCourseId) {
          // Only navigate if we generated a new ID
          setAndNavigateToCourseId(finalCourseId);
        }

        try {
          proContentManager.setCourse("Default Course", finalCourseId);
          await proContentManager.storeTopics(defaultTopics, finalCourseId);
          console.log('✅ Default topics stored successfully for course:', finalCourseId);
        } catch (error) {
          console.error('❌ Failed to store default topics:', error);
        }
      };
    };

    initializeDefaultTopics();
  }, [courseTitle, courseId]); // Add courseId dependency
  
  // Auto-select first topic when topics list is loaded, or set active topic from URL
  useEffect(() => {
    if (topicsList.length > 0) {
      if (topicParam) {
        // If we have a topic from URL, find and activate the matching topic
        // Handle case where topicParam might contain multiple topics (comma-separated)
        const actualTopic = topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam;
        
        // Find the topic that matches the URL parameter
        const matchingTopicIndex = topicsList.findIndex(topic => 
          topic.name.toLowerCase().trim() === actualTopic.toLowerCase().trim()
        );
        
        if (matchingTopicIndex !== -1) {
          console.log('🎯 Setting active topic from URL:', actualTopic);
          
          // Set the matching topic as active in the topics list
          setTopicsList(prevTopics => 
            prevTopics.map((topic, index) => ({
              ...topic,
              isActive: index === matchingTopicIndex // Only matching topic is active
            }))
          );
          
          // Load content for the matching topic automatically
          console.log('🔄 Auto-loading content for URL topic:', actualTopic);
          loadTopicContent(actualTopic);
        } else {
          // If no matching topic found, activate the first topic as fallback
          console.log('⚠️ Topic from URL not found in list, activating first topic:', actualTopic);
          setTopicsList(prevTopics => 
            prevTopics.map((topic, index) => ({
              ...topic,
              isActive: index === 0 // Only first topic is active
            }))
          );
        }
      } else {
        // If no topic is specified in URL and we have topics, select the first one
        const firstTopic = topicsList[0];
        if (firstTopic) {
          console.log('🎯 Auto-selecting first topic:', firstTopic.name);
          
          // Set the first topic as active in the topics list
          setTopicsList(prevTopics => 
            prevTopics.map((topic, index) => ({
              ...topic,
              isActive: index === 0 // Only first topic is active
            }))
          );
          
          // Update URL to include the first topic
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set("topic", firstTopic.name);
          navigate(`/pro-learning/${courseId}?${newSearchParams.toString()}`, { replace: true });
          
          // Load content for the first topic automatically
          console.log('🔄 Auto-loading content for first topic:', firstTopic.name);
          loadTopicContent(firstTopic.name);
        }
      }
    }
  }, [topicsList.length, topicParam, courseId, navigate, searchParams]); // Trigger when topics are loaded
  
  // Content state
  const [content, setContent] = useState(null);
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
  
  // Reading sections state
  const [readingSections, setReadingSections] = useState([]);
  const [readingSectionIndex, setReadingSectionIndex] = useState(0);
  
  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false);
  
  // Copy code functionality
  const [copySuccessMap, setCopySuccessMap] = useState({});
  
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
        setIsMobileMenuOpen(false);
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

  // Use environment variable for Gemini API key
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
  useEffect(() => {
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
  }, [topicsList, courseTitle]); // Depend on both topicsList and courseTitle

  // Load content for initially active topic using new storage system
  useEffect(() => {
    // Skip if we're handling URL-based topic loading directly or during direct URL generation
    if (isDirectUrlGeneration || (topicParam && !topicsList.length)) {
      return; // Let the URL topic loading useEffect handle this
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
          
          proContentManager.getTopicContent(activeTopic.name, generateProContent)
            .then(result => {
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
        
        // Use ProContentManager to handle content retrieval/generation
        proContentManager.setCourse(courseTitle, currentCourseId);
        proContentManager.getTopicContent(actualTopic, generateProContent)
          .then(result => {
            if (result?.content?.reading) {
              setContent(result.content);
              const sections = parseReadingSections(result.content.reading);
              setReadingSections(sections);
              setReadingSectionIndex(0);
              console.log('✅ Content ready:', result.source === 'storage' ? 'from storage' : 'newly generated');
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

  // Helper function to load topic content from batch-generated data
  const loadTopicContent = async (topicName) => {
    const currentCourseId = getCourseId();
    if (!currentCourseId) return;

    try {
      setIsLoading(true);
      setLoadingStep(`Loading ${topicName} content...`);

      const storedContent = proContentManager.getStoredTopicContent(currentCourseId, topicName);
      
      if (storedContent) {
        // Transform stored content to the expected format
        setContent({
          reading: storedContent.reading || 'Content not available',
          summary: storedContent.summary || 'Summary not available',
          quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
          videos: storedContent.videos || [],
          resources: storedContent.resources || []
        });
        
        // Parse and set reading sections
        if (storedContent.reading) {
          const sections = parseReadingSections(storedContent.reading);
          setReadingSections(sections);
          setReadingSectionIndex(0);
        }
        
        console.log('✅ Loaded content from storage for:', topicName);
      } else {
        // Fallback to generating content if not in storage
        console.log('⚠️ No stored content found, generating for:', topicName);
        const result = await proContentManager.getTopicContent(topicName, generateProContent);
        setContent(result.content);
        
        // Parse and set reading sections for generated content
        if (result.content && result.content.reading) {
          const sections = parseReadingSections(result.content.reading);
          setReadingSections(sections);
          setReadingSectionIndex(0);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load topic content:', error);
      setContent({
        reading: 'Failed to load content. Please try again.',
        summary: 'Failed to load summary.',
        quiz: { questions: [], currentQuestion: 0 },
        videos: [],
        resources: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle topic selection from sidebar using new storage system
  const handleTopicSelect = (topicId) => {
    // Find the topic in the list
    const selectedTopic = topicsList.find(t => t.id === topicId);
    if (!selectedTopic) return;

    // Update URL with new topic
    updateTopicInUrl(selectedTopic.name);

    // Update active states
    setTopicsList(topics => topics.map(topic => ({
      ...topic,
      isActive: topic.id === topicId
    })));

    // If all topics are generated, load from storage
    if (allTopicsGenerated || hasTopicContent(selectedTopic.name)) {
      loadTopicContent(selectedTopic.name);
    } else {
      // Show message that content needs to be generated
      setContent(null);
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

  const handleMobileMenuToggle = (isOpen) => {
    setIsMobileMenuOpen(isOpen);
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

  // Check for pending topics
  useEffect(() => {
    
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
  }, [topicsList, courseTitle]); // Add courseTitle dependency

  // Handle initial content loading when page loads with topic parameter
  useEffect(() => {
    const loadInitialTopicContent = async () => {
      if (topicParam && !isLoading && !content) {
        // Handle case where topicParam might contain multiple topics (comma-separated)
        const actualTopic = topicParam.includes(',') ? topicParam.split(',')[0].trim() : topicParam;
        console.log('🎯 Loading initial content for topic from URL:', actualTopic);
        
        const currentCourseId = getCourseId();
        if (!currentCourseId) {
          console.log('❌ No course ID found, cannot load topic content');
          return;
        }

        // Check if we have stored content for this topic
        const storedContent = proContentManager.getStoredTopicContent(currentCourseId, actualTopic);
        
        if (storedContent && storedContent.reading) {
          console.log('✅ Found stored content for topic:', actualTopic);
          
          // Set content directly from storage
          setContent({
            reading: storedContent.reading,
            summary: storedContent.summary || 'Summary not available',
            quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
            videos: storedContent.videos || [],
            resources: storedContent.resources || []
          });
          
          console.log('✅ Initial content loaded successfully for:', actualTopic);
        } else {
          console.log('⚠️ No stored content found for topic:', actualTopic);
          // The existing logic will handle generating content
        }
      }
    };

    // Run after a small delay to ensure ProContentManager is initialized
    const timer = setTimeout(loadInitialTopicContent, 100);
    return () => clearTimeout(timer);
  }, [topicParam]); // Only depend on topicParam to prevent loops

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
      // Use the new ProContentManager batch generation
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
    clearReadingContentCache();
    
    // Reset local state to force regeneration
    setContent(null);
    setReadingSections([]);
    setReadingSectionIndex(0);
    setTopicsList([]);
    setCompletedTopics([]);
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
    { id: 'reading', label: 'Reading', icon: FaBookOpen },
    { id: 'summary', label: 'Summary', icon: FaBrain },
    { id: 'videos', label: 'Videos', icon: FaVideo },
    { id: 'quiz', label: 'Quiz', icon: FaQuestionCircle },
    { id: 'resources', label: 'Resources', icon: FaLink }
  ];
  
  
  const [activeTab, setActiveTab] = useState(activeTabParam);
  const [completedTabs, setCompletedTabs] = useState([]); // Track completed tabs
  const [quizSubmitted, setQuizSubmitted] = useState(false); // Track if quiz is submitted

  // Update URL when activeTab changes
  const updateActiveTab = (newTab) => {
    setActiveTab(newTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    setSearchParams(newSearchParams, { replace: true });
  };

  // Update URL when topic changes
  const updateTopicInUrl = (newTopic) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('topic', newTopic);
    // Reset tab to reading when changing topics
    newSearchParams.set('tab', 'reading');
    updateActiveTab('reading');
    setSearchParams(newSearchParams, { replace: true });
  };

  // Generate or get course ID for current session
  const generateCourseId = () => `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const getCourseId = () => {
    return courseId || localStorage.getItem('currentCourseId') || null;
  };

  const setAndNavigateToCourseId = (id) => {
    localStorage.setItem('currentCourseId', id);
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

  // Handle batch generation from ChatbotPage
  useEffect(() => {
    const handleBatchGeneration = async () => {
      try {
        const batchData = localStorage.getItem('proLearning_batchGeneration');
        if (!batchData) return;

        const {
          courseId: batchCourseId,
          topics,
          topicString,
          triggerBatchGeneration,
          timestamp
        } = JSON.parse(batchData);

        // Only trigger if this is a recent request (within 5 minutes) and for this course
        const isRecent = Date.now() - timestamp < 5 * 60 * 1000;
        const isCurrentCourse = batchCourseId === courseId;
        
        if (!triggerBatchGeneration || !isRecent || !isCurrentCourse) {
          return;
        }

        console.log('🚀 Starting batch generation for course:', batchCourseId);
        console.log('📚 Topics to generate:', topics);

        // Check if content already exists for this course
        const existingContent = proContentManager.getStoredCourseContent(batchCourseId);
        if (existingContent && existingContent.metadata.status === 'completed') {
          console.log('✅ Course content already exists, loading from storage');
          setTopicsList(topics);
          setAllTopicsGenerated(true);
          return;
        }

        // Set up the batch generation
        setIsBatchGenerating(true);
        setBatchGenerationProgress(0);
        setBatchGenerationStatus('Initializing course generation...');
        setTopicsList(topics);

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
        setBatchGenerationProgress(100); // Set progress to 100% when completed
        setBatchGenerationStatus('Course generation completed!');
        
        // Auto-load the first topic or topic from URL
        const topicToLoad = topicParam || topics[0]?.name;
        if (topicToLoad) {
          console.log('🎯 Auto-loading topic after batch generation:', topicToLoad);
          loadTopicContent(topicToLoad);
        }
        
        // Clear the trigger so it doesn't run again
        localStorage.removeItem('proLearning_batchGeneration');
        
        console.log('🎉 Batch generation completed for course:', batchCourseId);

      } catch (error) {
        console.error('❌ Batch generation failed:', error);
        setIsBatchGenerating(false);
        setBatchGenerationStatus('Generation failed. Please try again.');
      }
    };

    // Run the handler
    handleBatchGeneration();
  }, []); // Remove courseId dependency to prevent multiple triggers

  // ...existing code...

  // Enhanced loading component with batch generation support
  const LoadingComponent = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50"></div>
          
          {/* Main loading icon */}
          <div className="relative z-10 mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BiLoaderAlt className="text-2xl text-white animate-spin" />
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
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${batchGenerationProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {batchGenerationProgress}% Complete
              </div>
            </div>
          )}

          {/* Status messages */}
          <div className="relative z-10 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {isBatchGenerating ? '🚀 Generating Your Course' : 'Preparing Content'}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isBatchGenerating ? batchGenerationStatus : (loadingStep || 'Setting up your learning materials...')}
            </p>
          </div>

          {/* Content types being generated */}
          {isBatchGenerating && (
            <div className="relative z-10 grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                <FaBookOpen className="text-blue-500 mr-2" />
                <span className="text-xs text-blue-700 font-medium">Reading</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-purple-50 rounded-lg">
                <FaBrain className="text-purple-500 mr-2" />
                <span className="text-xs text-purple-700 font-medium">Summary</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg">
                <FaVideo className="text-red-500 mr-2" />
                <span className="text-xs text-red-700 font-medium">Videos</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                <FaQuestionCircle className="text-green-500 mr-2" />
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
    
    // Show loading if generating course, individual content, or batch generating
    if (isGeneratingCourse || isLoading || isBatchGenerating) {
      return <LoadingComponent />;
    }

    // If no content and course not generated, show Pro Learning Experience button
    if (!content && !allTopicsGenerated) {
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
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-lg">
            {!courseTitle ? (
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
                <p className="text-gray-600 mb-4">Select a topic from the sidebar to view content</p>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition-all duration-300 flex items-center space-x-2"
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                >
                  <IoMenu className="text-xl" />
                  <span>Open Topics Menu</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "reading":
        
        // Additional fallback: if content exists but reading is empty, try to show other content
        const hasAnyContent = content && (content.reading || content.summary || content.videos?.length || content.quiz?.length || content.resources?.length);
        
        return (
          <div className="max-w-none">
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
                <div className="hidden md:flex items-center space-x-3 text-xs text-gray-600">
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                    <BiTime className="mr-1 text-blue-500" />
                    <span>{stats.estimatedReadTime}m read</span>
                  </div>
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                    <FaBullseye className="mr-1 text-purple-500" />
                    <span>{stats.difficulty}</span>
                  </div>
                  <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                    <IoBookmark className="mr-1" />
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                </div>
              </div>
              {/* Add debug panel above Save to DB button in the reading tab */}
              <div className="p-2 mb-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700">
                <strong>Debug Info:</strong><br />
                <span>courseTitle: {JSON.stringify(courseTitle)}</span><br />
                <span>topicName: {JSON.stringify(getCurrentTopic())}</span><br />
                <span>content: {content ? 'Loaded' : 'null'}</span><br />
                <span>auth.user: {auth?.user ? 'Logged in' : 'Not logged in'}</span><br />
                <span>auth.token: {auth?.getToken ? (auth.getToken() ? 'Present' : 'Missing') : 'Function not available'}</span><br />
                <span>user.email: {auth?.user?.email || 'N/A'}</span><br />
                <span>totalTopics: {topicsList.length}</span><br />
                <span>topics: {topicsList.map(t => t.name).join(', ')}</span><br />
                <span>completedTopics: {completedTopics.length}</span>
              </div>
              {topicsList.length > 0 && (
                <button
                  onClick={handleSaveToDB}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-all duration-300 mt-4 mb-4"
                  // Always enabled for debugging
                >
                  💾 Save All Topics to DB ({topicsList.length} topics)
                </button>
              )}
            </div>
            {/* Section Navigation */}
            {readingSections.length > 1 && (
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handlePrevSection}
                  disabled={readingSectionIndex === 0}
                  className={`px-4 py-2 rounded bg-blue-100 text-blue-700 font-semibold mr-2 ${readingSectionIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}`}
                >
                  Previous
                </button>
                <span className="text-gray-600 font-medium">
                  Section {readingSectionIndex + 1} of {readingSections.length}
                </span>
                <button
                  onClick={handleNextSection}
                  disabled={readingSectionIndex === readingSections.length - 1}
                  className={`px-4 py-2 rounded bg-blue-100 text-blue-700 font-semibold ml-2 ${readingSectionIndex === readingSections.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}`}
                >
                  Next
                </button>
              </div>
            )}
            {/* Enhanced Content with better typography, one section at a time */}
            <div className="prose prose-lg max-w-none">
              {readingSections.length > 0 ? (
                <ReactMarkdown
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
                    p: ({children}) => (
                      <p className="text-gray-700 leading-relaxed mb-4 text-base">
                        {children}
                      </p>
                    ),
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
                        <div className="relative my-6">
                          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-xl">
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
                              lineHeight: "1.4"
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
                    pre: ({children}) => (
                      <div className="mb-6">
                        <pre className="text-sm">{children}</pre>
                      </div>
                    ),
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
                  {`${readingSections[readingSectionIndex].header}\n${readingSections[readingSectionIndex].content}`}
                </ReactMarkdown>
              ) : (
                // Fallback: render raw content if sections are empty
                content && content.reading ? (
                  <ReactMarkdown
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
                      p: ({children}) => (
                        <p className="text-gray-700 leading-relaxed mb-4 text-base">
                          {children}
                        </p>
                      ),
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
                          <div className="relative my-6">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-xl">
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
                                lineHeight: "1.4"
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
                      pre: ({children}) => (
                        <div className="mb-6">
                          <pre className="text-sm">{children}</pre>
                        </div>
                      ),
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
                    {content.reading}
                  </ReactMarkdown>
                ) : isLoading ? (
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
        return (
          <div className="max-w-none">
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
                  p: ({children}) => (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {children}
                    </p>
                  ),
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
        return (
          <div>
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
                    <div className="relative h-48 overflow-hidden">
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
                        <a 
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                        >
                          <IoPlayCircle className="mr-1" />
                          Watch
                        </a>
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
        const answeredQuestions = content.quiz.filter(q => q.userAnswer !== null).length;
        const correctAnswers = content.quiz.filter(q => q.userAnswer === q.correct).length;
        const quizProgress = (answeredQuestions / content.quiz.length) * 100;
        const allQuestionsAnswered = answeredQuestions === content.quiz.length;
        
        return (
          <div>
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

      case "resources":
        return (
          <div className="space-y-6">
            {/* Compact Resources Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <FaLink className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Learning Resources</h2>
                    <p className="text-indigo-100 text-sm">
                      Curated materials for {getCurrentTopic()} mastery
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{content.resources.length}</div>
                    <div className="text-indigo-200 text-xs">Resources</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">⭐</div>
                    <div className="text-indigo-200 text-xs">Quality</div>
                  </div>
                </div>
              </div>
              
              {/* Removed resource categories display for a cleaner look */}
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
        return null;
    }
  };

  // Handle closing of batch generation status notification
  const handleCloseBatchStatus = () => {
    setBatchGenerationProgress(0);
    setBatchGenerationStatus('');
  };

  // Enhanced handler for saving ALL classified topics to DB
  const handleSaveToDB = async () => {
    try {
      let title = courseTitle;
      if (!title) {
        // Create title from user input and classified topics
        const userInput = searchParams.get('query') || '';
        const topicNames = topicsList.map(topic => topic.name);
        const defaultTitle = topicNames.length > 0 
          ? userInput 
            ? `${userInput} and ${topicNames.join(' and ')}`
            : topicNames.join(' and ')
          : userInput || 'AI Learning Course';
        
        title = window.prompt('Please enter a course title to save:', defaultTitle);
        if (!title) {
          toast.error('Course title is required!');
          return;
        }
        
        // Update the URL with the new courseTitle
        const params = new URLSearchParams(window.location.search);
        params.set('courseTitle', title);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        
        // Update the local state
        setSearchParams(params);
      }

      const user = auth?.user;
      const token = auth?.getToken ? auth.getToken() : auth?.token;
      
      console.log('🔐 Authentication check:', {
        user: !!user,
        token: !!token,
        userEmail: user?.email,
        tokenLength: token?.length
      });
      
      if (!user) {
        toast.error('Please log in to save content to your account!');
        return;
      }
      
      if (!token) {
        // Try to refresh the token first
        try {
          await auth?.validateAuth();
          const refreshedToken = auth?.getToken ? auth.getToken() : auth?.token;
          if (refreshedToken) {
            console.log('✅ Token refreshed successfully');
          } else {
            toast.error('Authentication token missing. Please log in again.');
            return;
          }
        } catch (error) {
          console.error('❌ Failed to refresh token:', error);
          toast.error('Authentication token missing. Please log in again.');
          return;
        }
      }

      if (topicsList.length === 0) {
        toast.error('No topics to save! Please generate some content first.');
        return;
      }

      console.log('🚀 Starting comprehensive save to DB for course:', title);
      console.log('📋 Topics to save:', topicsList);

      // Check which topics have content before saving
      const topicsWithContent = [];
      const topicsWithoutContent = [];
      
      for (const topic of topicsList) {
        const topicContent = proContentManager.getStoredTopicContent(getCourseId(), topic.name);
        if (topicContent && (topicContent.reading || topicContent.summary || 
            (topicContent.videos && topicContent.videos.length > 0) || 
            (topicContent.resources && topicContent.resources.length > 0))) {
          topicsWithContent.push(topic.name);
        } else {
          topicsWithoutContent.push(topic.name);
        }
      }

      console.log('📊 Content analysis:', {
        topicsWithContent,
        topicsWithoutContent,
        totalTopics: topicsList.length
      });

      if (topicsWithContent.length === 0) {
        toast.error('No topics have content to save! Please generate content first.');
        return;
      }

      // Save ALL classified topics to DB
      const savedTopics = [];
      const failedTopics = [];

      // 1. Save each classified topic individually (Inner Level)
      for (const topic of topicsList) {
        try {
          // Get content for this topic from local storage
          const topicContent = proContentManager.getStoredTopicContent(getCourseId(), topic.name);
          
          if (topicContent) {
            const topicData = {
              course_title: title,
              topic_name: topic.name, // Use actual topic name, not title
              reading: topicContent.reading || '',
              summary: topicContent.summary || '',
              videos: topicContent.videos || [],
              resources: topicContent.resources || []
            };

            console.log(`💾 Saving topic "${topic.name}" to DB:`, {
              courseTitle: title,
              topicName: topic.name,
              contentTypes: {
                reading: !!topicContent.reading,
                summary: !!topicContent.summary,
                videos: topicContent.videos?.length || 0,
                resources: topicContent.resources?.length || 0
              }
            });

            await saveAITopicContent(topicData, token);
            savedTopics.push(topic.name);
            console.log(`✅ Successfully saved topic: ${topic.name}`);
          } else {
            console.log(`⚠️ No content found for topic: ${topic.name}`);
            failedTopics.push(topic.name);
          }
        } catch (error) {
          console.error(`❌ Failed to save topic "${topic.name}":`, error);
          failedTopics.push(topic.name);
        }
      }

      // 2. Save overall learning plan with ALL topics (Outer Level)
      if (topicsList.length > 0) {
        const learningPlanData = {
          title: title,
          description: `AI-generated learning plan for ${title} with ${topicsList.length} classified topics`,
          plan_data: {
            goal: title,
            days: topicsList.map((topic, index) => ({
              day: index + 1,
              topic: topic.name,
              description: topic.description || `Topic: ${topic.name}`,
              is_completed: completedTopics.includes(topic.id),
              videos: [],
              resources: []
            })),
            total_topics: topicsList.length,
            saved_topics: savedTopics.length,
            failed_topics: failedTopics.length
          },
          difficulty_level: 'beginner',
          duration_days: topicsList.length,
          category: 'AI Generated'
        };
        
        try {
          await saveAIGeneratedPlan(learningPlanData, token);
          console.log('✅ Saved overall learning plan to DB with all topics');
        } catch (planError) {
          console.warn('⚠️ Failed to save learning plan:', planError);
          // Don't fail the whole operation if plan save fails
        }
      }

      // Show comprehensive success message
      const successMessage = `Saved ${savedTopics.length} topics to your account!`;
      let detailsMessage = '';
      
      if (topicsWithoutContent.length > 0) {
        detailsMessage += ` (${topicsWithoutContent.length} topics had no content)`;
      }
      if (failedTopics.length > 0) {
        detailsMessage += ` (${failedTopics.length} topics failed to save)`;
      }
      
      toast.success(successMessage + detailsMessage);
      console.log('🎉 Save to DB completed:', {
        totalTopics: topicsList.length,
        topicsWithContent: topicsWithContent.length,
        topicsWithoutContent: topicsWithoutContent.length,
        savedTopics,
        failedTopics
      });

    } catch (err) {
      console.error('❌ Save to DB failed:', err);
      toast.error('Failed to save to DB: ' + (err.message || err));
    }
  };

  useEffect(() => {
    const tryLoadFromDB = async () => {
      const token = auth?.getToken ? auth.getToken() : auth?.token;
      if (!auth?.user || !token || !courseTitle) return;
      try {
        console.log('🔄 Loading from DB for course:', courseTitle);
        
        // Enhanced loading structure:
        // 1. Try to load learning plan first to get all topics
        try {
          const plansResult = await fetchUserAIGeneratedPlans(token);
          const matchingPlan = plansResult.find(plan => 
            plan.title === courseTitle || plan.title.toLowerCase().includes(courseTitle.toLowerCase())
          );
          
          if (matchingPlan && matchingPlan.plan_data && matchingPlan.plan_data.days && matchingPlan.plan_data.days.length > 0) {
            console.log('📋 Found learning plan with topics:', matchingPlan.plan_data.days);
            
            // Update topics list from the plan
            const planTopics = matchingPlan.plan_data.days.map((day, index) => ({
              id: index + 1,
              name: day.topic,
              description: day.description || `Topic: ${day.topic}`,
              isActive: index === 0 // First topic active by default
            }));
            
            setTopicsList(planTopics);
            
            // Load content for the first topic
            const firstTopic = matchingPlan.plan_data.days[0];
            const topicResult = await fetchAITopicContent(token, courseTitle, firstTopic.topic);
            if (topicResult && topicResult.results && topicResult.results.length > 0) {
              const topicContent = topicResult.results[0];
              setContent({
                reading: topicContent.reading,
                summary: topicContent.summary,
                videos: topicContent.videos,
                resources: topicContent.resources
              });
              toast.success(`Loaded learning plan with ${matchingPlan.plan_data.days.length} topics from your account!`);
              return;
            }
          }
        } catch (planError) {
          console.warn('⚠️ Failed to load learning plan:', planError);
        }
        
        // 2. Try to load specific topic content
        const currentTopic = getCurrentTopic();
        const topicName = currentTopic || courseTitle;
        
        console.log('🔍 Loading specific topic from DB:', { courseTitle, topicName });
        
        const result = await fetchAITopicContent(token, courseTitle, topicName);
        if (result && result.results && result.results.length > 0) {
          const topicContent = result.results[0];
          setContent({
            reading: topicContent.reading,
            summary: topicContent.summary,
            videos: topicContent.videos,
            resources: topicContent.resources
          });
          toast.success('Loaded AI-generated content from your account!');
          return;
        }
        
        // 3. Fallback to local storage
        const storedContent = proContentManager.getStoredTopicContent(getCourseId(), topicName);
        if (storedContent) {
          setContent(storedContent);
          toast('Loaded content from local storage.');
        }
      } catch (err) {
        console.error('❌ Failed to load from DB:', err);
        toast.error('Failed to load from DB: ' + (err.message || err));
      }
    };
    tryLoadFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.user, auth?.token, courseTitle]);

  return (
    <>
      <Navbar initialStyle="light" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <style>{`
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
          .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
          }
        `}</style>
        
      {/* Batch Generation Status Indicator */}
      <BatchGenerationStatus
        isGenerating={isBatchGenerating}
        progress={batchGenerationProgress}
        status={batchGenerationStatus}
        onClose={handleCloseBatchStatus}
      />
      
      {/* Enhanced Header */}
      {/* <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50"> ... </header> */}

      {/* Main Content with Sidebar Layout */}
      <div className="min-h-screen relative pt-20">
        {/* Main Content Area */}
        <div className={`transition-all duration-300 min-h-screen ${
          sidebarVisible 
            ? 'lg:mr-[400px]' // Add right margin on large screens when sidebar is visible
            : ''
        }`}>
          <div className="w-full px-2 sm:px-4 lg:px-6 py-4 max-w-full overflow-x-hidden">
              {/* Enhanced Tab Navigation */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border mb-6 hidden md:block overflow-hidden">
                <div className="p-2">
                  <nav className="flex space-x-2 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                    {tabs.map((tab) => {
                      const IconComponent = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            updateActiveTab(tab.id);
                          }}
                          disabled={isLoading}
                          className={`group flex-1 min-w-[120px] p-4 rounded-xl font-medium transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`p-2 rounded-lg transition-colors ${
                              isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                              <IconComponent className="text-lg" />
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Mobile Tab Indicator */}
              <div className="md:hidden mb-4">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon, { 
                        className: "mr-2 text-lg text-blue-600" 
                      })}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {tabs.find(tab => tab.id === activeTab)?.label}
                        </div>
                        {/* Removed tab.description here */}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMobileMenuToggle(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <IoChevronDown />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border overflow-hidden">
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
                </div>
              </div>
              
              {/* Display topics (both single and multiple) */}
              <div className="space-y-2">
                {topicsList.length > 1 && (
                  <p className="text-blue-700 font-medium text-sm mb-3">
                    Select a topic to focus on:
                  </p>
                )}
                {topicsList.map((topicItem) => (
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

              {/* Reading Section Navigation */}
              {activeTab === 'reading' && !isLoading && readingSections.length > 1 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Reading Sections</h4>
                  <div className="space-y-2">
                    {readingSections.map((section, index) => (
                      <button
                        key={index}
                        onClick={() => setReadingSectionIndex(index)}
                        className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                          readingSectionIndex === index
                            ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{section.header || `Section ${index + 1}`}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {section.content.substring(0, 60)}...
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Learning Tips section from sidebar */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProLearningPage;
