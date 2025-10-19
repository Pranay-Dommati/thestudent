import universalToast from "../../utils/universalToast";
import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoChevronBack, IoPlayCircle, IoSchoolOutline, IoCheckmarkCircle, IoBook, IoPersonOutline, IoHomeOutline, IoMenuOutline, IoClose, IoTimeOutline, IoChevronForward, IoSearchOutline, IoRocket } from "react-icons/io5";
// Removed FaRobot - using IoSchoolOutline for Pro Learning branding
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from '../../context/AuthContext';
import { classifyTopics, formatRateLimitMessage } from "../ProLearning/topicclassifier";
import ErrorBoundary from '../Common/ErrorBoundary';
import RateLimitStatus from './RateLimitStatus';
import CompactRateLimitStatus from './CompactRateLimitStatus';
import proLearningHistoryService from '../../services/ProLearningHistoryService';

// Custom CSS - added for DeepSeek-like UI and welcome card fix
import './mobileChatStyles.css';
import './welcomeCardFix.css';
import NewWelcomeCard from './NewWelcomeCard';

// Use relative API paths; dev proxy routes to backend
import apiAxios from '../../utils/axios';
import aiAxios from '../../utils/axiosAi';

// Helper function to parse markdown response (legacy - may not be used)
const parseMarkdownResponse = (content) => {
  const sections = [];
  let currentSection = null;
  let currentSubsection = null;

  content.split('\n').forEach(line => {
    if (line.startsWith('# ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace('# ', '').trim(),
        subsections: []
      };
    } else if (line.startsWith('## ') && currentSection) {
      currentSubsection = {
        title: line.replace('## ', '').trim(),
        videos: []
      };
      currentSection.subsections.push(currentSubsection);
    } else if (line.includes('youtube.com') && currentSubsection) {
      const titleMatch = line.match(/\[(.*?)\]/);
      const urlMatch = line.match(/\((.*?)\)/);
      if (titleMatch && urlMatch) {
        currentSubsection.videos.push({
          title: titleMatch[1],
          url: urlMatch[1]
        });
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

const MobileChatbotPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoggedIn } = useAuth();
  const initialQuery = searchParams.get("q");

  const [message, setMessage] = useState("");
  const [proMode] = useState(true); // Always in Pro Learning mode
  const [showTopicConfirmation, setShowTopicConfirmation] = useState(false);
  const [pendingTopics, setPendingTopics] = useState([]);
  // Guard to prevent duplicate course creation on rapid taps
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const creatingCourseRef = useRef(false);
  const [personalization, setPersonalization] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  // Generate unique IDs using timestamp and random component
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const [usageStats, setUsageStats] = useState(null); // Track rate limit usage stats
  const [usageStatsHidden, setUsageStatsHidden] = useState(false); // Track if user dismissed usage stats
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const initialQueryProcessed = useRef(false);
  const autoSendProcessed = useRef(false); // Additional flag to prevent duplicate auto-sends
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [proLearningHistory, setProLearningHistory] = useState([]);
  const [proLearningCourses, setProLearningCourses] = useState([]);
  // Mobile ProLearning Courses drawer state
  const [isCoursesDrawerOpen, setIsCoursesDrawerOpen] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [visibleCoursesCount, setVisibleCoursesCount] = useState(10);
  const drawerContentRef = useRef(null);
  const [coursesSearch, setCoursesSearch] = useState("");
  // Feature flag: hide ProLearning courses preview in mobile chat by default
  const [showMobileCoursesPreview, setShowMobileCoursesPreview] = useState(false);

  // Rotating suggestions for empty-state heading (same as desktop)
  const rotatingSuggestions = [
    "Help me get started with algebra basics",
    "Explain how the human digestive system works",
    "Break down Newton's laws of motion for me",
    "Build a mini course on electricity and magnetism",
    "Guide me through the fundamentals of programming",
    "Design a beginner-friendly Python course for me",
    "Show me how the Internet actually works",
    "Walk me through circuits and microcontrollers step by step",
    "Simplify the basics of thermodynamics",
    "Build me a hands-on course on machine learning",
    "Teach me everything about the water cycle and environment",
    "Explain how database management systems function",
    "Give me a clear introduction to networking and cybersecurity",
    "Help me understand how chemical reactions happen"
  ];
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionKey, setSuggestionKey] = useState(0); // for animation re-trigger
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Rotate suggestions every 10 seconds (same as desktop)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setSuggestionIndex((prev) => (prev + 1) % rotatingSuggestions.length);
        setSuggestionKey((prev) => prev + 1);
        setIsAnimatingOut(false);
      }, 300); // Wait for animation to complete
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Check if user has visited chat page before
  useEffect(() => {
    const hasVisitedChat = localStorage.getItem('hasVisitedChat');
    if (!hasVisitedChat) {
      setShowWelcomeMessage(true);
      localStorage.setItem('hasVisitedChat', 'true');
    }
  }, []);

  // Load ProLearning history on component mount and fetch backend courses
  useEffect(() => {
    const loadHistory = () => {
      const history = proLearningHistoryService.getHistory();
      setProLearningHistory(history);
    };
  const loadBackendCourses = async () => {
      try {
    const token = (localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('token'));
        if (!token) return;
        const { data } = await apiAxios.get('/courses/pro-learning/');
        if (Array.isArray(data)) setProLearningCourses(data);
      } catch (e) {
        console.warn('Failed to load backend ProLearning courses (mobile):', e);
      }
    };
    
    loadHistory();
    loadBackendCourses();
    
    // Listen for storage changes to update history in real-time
    const handleStorageChange = () => {
      loadHistory();
    };
    
    // Listen for custom history update events
    const handleHistoryUpdate = () => {
      loadHistory();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('prolearning-history-updated', handleHistoryUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('prolearning-history-updated', handleHistoryUpdate);
    };
  }, []);

  // Open drawer and ensure courses are fetched
  const openCoursesDrawer = async () => {
    setIsCoursesDrawerOpen(true);
    setVisibleCoursesCount(10);
    setCoursesSearch("");
    if (!proLearningCourses || proLearningCourses.length === 0) {
      try {
        setIsLoadingCourses(true);
        const token = (localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('token'));
        if (!token) return;
        const { data } = await apiAxios.get('/courses/pro-learning/');
        if (Array.isArray(data)) setProLearningCourses(data);
      } catch (e) {
        console.warn('Failed to (re)load ProLearning courses for drawer:', e);
      } finally {
        setIsLoadingCourses(false);
      }
    }
  };

  const closeCoursesDrawer = () => setIsCoursesDrawerOpen(false);

  // Infinite scroll in drawer
  const handleCoursesScroll = (e) => {
    const el = e.currentTarget;
    const threshold = 64;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      setVisibleCoursesCount((prev) => {
        const total = proLearningCourses?.length || 0;
        return Math.min(prev + 10, total);
      });
    }
  };

  // ESC to close drawer
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === 'Escape' && isCoursesDrawerOpen) setIsCoursesDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isCoursesDrawerOpen]);

  // Random course placeholder texts - Topic focused (same as desktop)
  const coursePlaceholders = [
    "Create course on arrays and strings",
    "Create course about photosynthesis and water cycle",
    "Create course on Newton's laws of motion",
    "Create course about acids, bases, and salts",
    "Create course on basic algebra and equations",
    "Create course about ecosystem and food chain",
    "Create course on React components and props",
    "Create course on electric circuits and Ohm's law",
    "Create course about cell structure and function",
    "Create course on data structures like linked lists and stacks",
    "Create course about solar system and planets",
    "Create course on basic trigonometry",
    "Create course on photosynthesis and transpiration",
    "Create course about world war history (WWI & WWII)",
    "Create course on cybersecurity and ethical hacking basics",
    "Create course about types of reproduction in biology",
    "Create course on financial literacy",
    "Create course about AI and machine learning basics"
  ];

  // Function to get random placeholder (same as desktop)
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * coursePlaceholders.length);
    return coursePlaceholders[randomIndex];
  };

  // Basic client-side prompt validation to provide helpful guidance before calling backend
  const validateCoursePrompt = (text) => {
    if (!text) return { ok: false, reason: 'empty' };
    const trimmed = String(text).trim();
    if (trimmed.length < 5) return { ok: false, reason: 'too_short' };
    const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (letters < 3) return { ok: false, reason: 'low_signal' };
    return { ok: true };
  };

  // Fetch usage stats when component mounts or when pro mode is enabled (returns stats)
  const fetchUsageStats = async () => {
    try {
      if (!isLoggedIn) return null;
      const token = (
        localStorage.getItem('accessToken') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token')
      );
      const { data: result } = await aiAxios.get('/rate-limit-status/');
      const stats = result?.rate_limit_info || null;
      if (stats) setUsageStats(stats);
      return stats;
    } catch (error) {
      console.error('📊 Error fetching usage stats:', error);
      // Fallback default with monthly fields and fallback flag
      const fallback = {
        rate_limits: {
          daily: { enforced: false },
          monthly: { limit: 15, used: 0 },
        },
        per_request_limit: 4,
        request_limit: 4,
        monthly_used: 0,
        monthly_limit: 15,
        isFallback: true,
        // Legacy fields for backward-compat (ignored when daily.enforced=false)
        daily_used: 0,
        daily_limit: 16,
      };
      setUsageStats(fallback);
      return fallback;
    }
  };

  // Fetch usage stats when component mounts and when pro mode changes
  useEffect(() => {
    if (proMode && isLoggedIn) {
      fetchUsageStats();
    }
  }, [proMode, isLoggedIn]);

  // Handle ESC key to close welcome message and navigation menu
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showWelcomeMessage) {
          setShowWelcomeMessage(false);
        }
        if (showNavMenu) {
          setShowNavMenu(false);
        }
      }
    };

    if (showWelcomeMessage || showNavMenu) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showWelcomeMessage, showNavMenu]);

  // Close navigation menu when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (showNavMenu) {
        setShowNavMenu(false);
      }
    };

    if (showNavMenu) {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showNavMenu]);

  // Scroll to the bottom of the chat when chat history updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
          console.warn("Scroll error:", error);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [chatHistory]);

  // Handle initial query from URL parameter
  useEffect(() => {
    // Check for both old query parameter and new message parameter
    const messageParam = searchParams.get("message");
    const modeParam = searchParams.get("mode");
    const prefillParam = searchParams.get("prefill");
    
    // If coming from Home with explicit createCourse mode, enable pro mode and set a helpful placeholder
    if (modeParam === 'createCourse' && !proMode) {
      const tryEnablePro = async () => {
        setCoursePlaceholder(getRandomPlaceholder());
        if (isLoggedIn) {
          const stats = await fetchUsageStats();
          const remainingToday = stats ? (stats.daily_limit || 16) - (stats.daily_used || 0) : null;
          if (remainingToday !== null && remainingToday <= 0) {
            universalToast.error('Sorry, your daily limit is over. Please try again tomorrow.');
            return;
          }
        }
        setProMode(true);
        
        // After enabling pro mode, check if we need to auto-send a message
        if (messageParam && prefillParam === 'true' && !autoSendProcessed.current) {
          const decodedMessage = decodeURIComponent(messageParam);
          setMessage(decodedMessage);
          initialQueryProcessed.current = true; // Set this immediately to prevent duplicate processing
          autoSendProcessed.current = true; // Prevent any duplicate auto-sends
          setTimeout(() => {
            handleSendMessage(decodedMessage, { forceProMode: true });
          }, 100); // Small delay to ensure state updates
          // Replace URL without parameters for cleaner history
          navigate("/chat", { replace: true });
        }
      };
      tryEnablePro();
    }

    // Handle new format for generated course (only if not in createCourse mode and not already processed)
    else if (messageParam && prefillParam === 'true' && !autoSendProcessed.current) {
      const decodedMessage = decodeURIComponent(messageParam);
      setMessage(decodedMessage);
      initialQueryProcessed.current = true;
      autoSendProcessed.current = true; // Prevent any duplicate auto-sends
      
      // Auto-send the message when coming from Home page
      setTimeout(() => {
        handleSendMessage(decodedMessage, { forceProMode: true });
      }, 500); // Slight delay to ensure pro mode is enabled first
      
      // Replace URL without parameters for cleaner history
      navigate("/chat", { replace: true });
    }
    // Handle older query parameter format
    else if (initialQuery && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true;
      setMessage(initialQuery);
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 100);
      navigate("/chat", { replace: true });
    }
  }, [initialQuery, navigate, searchParams]);

  // Timeout fallback to prevent infinite "Loading stats..." when pro mode is enabled (mobile)
  useEffect(() => {
    if (proMode && !usageStats) {
      const timeoutId = setTimeout(() => {
        if (!usageStats) {
          // Silently set fallback stats without console warning
          setUsageStats({
            rate_limits: {
              daily: { enforced: false },
              monthly: { limit: 15, used: 0 },
            },
            per_request_limit: 4,
            request_limit: 4,
            daily_used: 0,
            daily_limit: 16,
          });
        }
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [proMode, usageStats]);

  // Send message; when options.forceProMode is true, process as course creation regardless of transient proMode state
  const handleSendMessage = async (customMessage = null, options = {}) => {
    const forcePro = options?.forceProMode === true;
    const messageToSend = customMessage || message;
    if (!messageToSend.trim() || isLoading) return;

    console.log('📱 Mobile handleSendMessage called with:', { 
      messageToSend, 
      proMode, 
      usageStats,
      isLoggedIn
    });

    // If topic confirmation is open and user sends a new message, automatically cancel it (desktop parity)
    if (showTopicConfirmation && !customMessage) {
      const cancellationMessage = {
        id: generateUniqueId(),
        type: "bot",
        content: "❌ **Course creation cancelled** - Processing your new request instead.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isCancellation: true,
      };
      setChatHistory((prev) => [...prev, cancellationMessage]);
      setShowTopicConfirmation(false);
      setPendingTopics([]);
      setOriginalPrompt("");
    }

    const userMessageObj = {
      id: generateUniqueId(),
      type: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMessageObj]);
    if (!customMessage) setMessage("");

    // If not authenticated, show a friendly sign-in prompt and stop
    try {
      const authed = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isLoggedIn;
      if (!authed) {
        const returnTo = window.location.pathname + window.location.search;
        const signInUrl = `/auth?mode=login&returnTo=${encodeURIComponent(returnTo)}`;
        const signUpUrl = `/auth?mode=signup&returnTo=${encodeURIComponent(returnTo)}`;
        const authPrompt = {
          id: generateUniqueId(),
          type: "bot",
          isAuthPrompt: true,
          signInUrl,
          signUpUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatHistory((prev) => [...prev, authPrompt]);
        setIsLoading(false);
        return;
      }
    } catch (_) {}

    // Skip local heuristic validation – rely on AI classification to decide if it's a study topic

    setIsLoading(true);

    try {
      // Pro Learning Mode - Always Active
      // Check quota before processing (prefer monthly if daily not enforced)
      if (usageStats) {
        const dailyEnforced = usageStats?.rate_limits?.daily?.enforced ?? false;
        const dailyRemaining = Math.max(0, (usageStats.daily_limit || usageStats.rate_limits?.daily?.limit || 0) - (usageStats.daily_used || usageStats.rate_limits?.daily?.used || 0));
        const monthlyRemaining = Math.max(0, (usageStats.rate_limits?.monthly?.limit || 15) - (usageStats.rate_limits?.monthly?.used || 0));
        const remainingAllowance = dailyEnforced ? dailyRemaining : monthlyRemaining;
        if (remainingAllowance <= 0) {
          const msg = dailyEnforced
            ? "🚫 Daily limit reached! You've used all your topic creation quota for today. Please try again tomorrow."
            : "🚫 Monthly limit reached! You've used all your topic creation quota for this month. Please try again next month.";
          universalToast.error(msg, { duration: 5000 });
          setIsLoading(false);
          return;
        }
      }

      // Extract topics using AI with rate limiting
      try {
        console.log('🚀 Mobile Pro Learning mode - calling classifyTopics with:', messageToSend);
  const result = await classifyTopics(messageToSend);
        console.log('✅ Mobile classifyTopics result:', result);
          if (result && typeof result.personalization === 'string' && result.personalization.trim()) {
            setPersonalization(result.personalization.trim());
          } else {
            setPersonalization('Beginner-friendly, step-by-step explanations with practical examples.');
          }
          
          // Update usage stats from the response
          if (result.usage_stats) {
            setUsageStats(result.usage_stats);
          }
          
          const extractedTopics = Array.isArray(result.topics) ? result.topics : [];

          // If AI couldn't extract any topics, show guidance and stop
          if (extractedTopics.length === 0) {
            const botResponse = {
              id: generateUniqueId(),
              type: "bot",
              content: "🤔 I didn't quite get that. Try a short topic like \"Basics of photosynthesis\" or \"Intro to networking\".",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, botResponse]);
            setIsLoading(false);
            return;
          }
          
          // Show toast notification IMMEDIATELY if more than 4 topics were extracted
          const maxPerRequest = 4; // Default max per request
          if (extractedTopics.length > maxPerRequest) {
            universalToast.show(
              `📝 Maximum ${maxPerRequest} topics per request. Found ${extractedTopics.length} topics, showing first ${maxPerRequest}.`,
              { 
                duration: 4000,
              }
            );
          }
          
          if (extractedTopics && extractedTopics.length > 0) {
            // Check current rate limit status to determine how many topics user can actually create
            let availableTopics = extractedTopics;
            let limitMessage = "";
            
            if (usageStats) {
              const dailyEnforced = usageStats?.rate_limits?.daily?.enforced ?? false;
              const dailyRemaining = Math.max(0, (usageStats.daily_limit || usageStats.rate_limits?.daily?.limit || 0) - (usageStats.daily_used || usageStats.rate_limits?.daily?.used || 0));
              const monthlyRemaining = Math.max(0, (usageStats.rate_limits?.monthly?.limit || 15) - (usageStats.rate_limits?.monthly?.used || 0));
              const remainingAllowance = dailyEnforced ? dailyRemaining : monthlyRemaining;
              const maxPerRequestFromStats = usageStats.per_request_limit || 4;
              
              // Limit topics to the smaller of: remaining allowance or max per request
              const maxAllowedTopics = Math.min(remainingAllowance, maxPerRequestFromStats);
              
              if (extractedTopics.length > maxAllowedTopics) {
                // Limit the topics to what user can actually create
                availableTopics = extractedTopics.slice(0, Math.max(0, maxAllowedTopics));
                
                if (remainingAllowance <= 0) {
                  if (dailyEnforced) {
                    limitMessage = `⚠️ You've reached your daily limit of ${usageStats.daily_limit || usageStats.rate_limits?.daily?.limit || 0} topics. Please try again tomorrow.`;
                    universalToast.error(`🚫 Daily limit reached (${usageStats.daily_used || usageStats.rate_limits?.daily?.used || 0}/${usageStats.daily_limit || usageStats.rate_limits?.daily?.limit || 0} used)`, { duration: 4000 });
                  } else {
                    const m = usageStats.rate_limits?.monthly;
                    limitMessage = `⚠️ You've reached your monthly limit of ${(m?.limit ?? 15)} topics. Please try again next month.`;
                    universalToast.error(`🚫 Monthly limit reached (${m?.used ?? 0}/${m?.limit ?? 15} used)`, { duration: 4000 });
                  }
                } 
              }
            } else {
              // If no usage stats, just limit to 4 topics max
              if (extractedTopics.length > maxPerRequest) {
                availableTopics = extractedTopics.slice(0, maxPerRequest);
                limitMessage = `⚠️ Showing first ${maxPerRequest} topics. You can create maximum ${maxPerRequest} topics at a time.`;
                // Show informational toast for general per-request limiting
                universalToast.show(`ℹ️ Limited to ${maxPerRequest} topics per request`, {
                  duration: 4000
                });
              }
            }
            
            // If no topics available due to limits, don't show confirmation
            if (availableTopics.length === 0) {
              const limitResponse = {
                id: generateUniqueId(),
                type: "bot",
                content: limitMessage || "❌ You've reached your monthly topic creation limit. Please try again next month.",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              };
              setChatHistory((prev) => [...prev, limitResponse]);
              setIsLoading(false);
              return;
            }
            
            // Store limited topics for confirmation and show confirmation dialog
            setPendingTopics(availableTopics);
            setOriginalPrompt(messageToSend);
            setShowTopicConfirmation(true);
            
            // No need to add a chat message - the dialog is self-explanatory
          } else {
            // No topics extracted - show error
            const errorResponse = {
              id: generateUniqueId(),
              type: "bot",
              content: "❌ I couldn't extract any learning topics from your query. Please try to be more specific about what you'd like to learn (e.g., 'JavaScript arrays and functions', 'Python data structures', etc.)",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, errorResponse]);
          }
        } catch (error) {
          console.error('❌ Mobile topic extraction failed:', error);
          console.error('Mobile error details:', { 
            name: error.name, 
            message: error.message, 
            isRateLimit: error.isRateLimit,
            stack: error.stack 
          });
          
          // Handle rate limiting specifically
          if (error.isRateLimit) {
            const rateLimitMessage = formatRateLimitMessage(error);
            const rateLimitResponse = {
              id: generateUniqueId(),
              type: "bot",
              content: `🚫 **Rate Limit Exceeded**\n\n${rateLimitMessage}\n\n**Current Limits:**\n- Max 4 topics per request\n- Max 15 topics per month\n\nPlease try again next month or contact support if you need higher limits.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isRateLimitError: true,
            };
            setChatHistory((prev) => [...prev, rateLimitResponse]);
            
            // Show toast notification
            universalToast.error('Monthly topic creation limit reached', {
              duration: 5000,
            });
            setIsLoading(false);
            return;
          } else {
            // Generic error handling - show friendly guidance to enter a proper study topic
            const guidanceResponse = {
              id: generateUniqueId(),
              type: "bot",
              content: "🤔 I didn't quite get that. Try a short topic like \"Basics of photosynthesis\" or \"Intro to networking\".",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, guidanceResponse]);
            setIsLoading(false);
            return;
          }
        }
    } catch (error) {
      console.error("Error in chat:", error);
      const errorResponse = {
        id: generateUniqueId(),
        type: "bot",
        content: "Sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Topic confirmation functions
  const handleTopicEdit = (index, newName) => {
    const updatedTopics = [...pendingTopics];
    updatedTopics[index] = { ...updatedTopics[index], name: newName };
    setPendingTopics(updatedTopics);
  };

  const handleTopicDelete = (index) => {
    const updatedTopics = pendingTopics.filter((_, i) => i !== index);
    setPendingTopics(updatedTopics);
  };

  const handleTopicAdd = () => {
    // Enforce 4-topic limit
    if (pendingTopics.length >= 4) {
      return;
    }
    
    const newTopic = {
      id: Date.now(),
      name: "New Topic",
      isActive: true
    };
    setPendingTopics([...pendingTopics, newTopic]);
  };

  const handleTopicConfirm = async () => {
    if (isCreatingCourse || creatingCourseRef.current) return;
    creatingCourseRef.current = true;
    setIsCreatingCourse(true);
    if (pendingTopics.length === 0) {
      alert("Please add at least one topic to create a course.");
      creatingCourseRef.current = false;
      setIsCreatingCourse(false);
      return;
    }

    try {
      // Prepare topics data - ensure clean structure with only required fields
      const topicsData = pendingTopics.map(topic => ({
        name: topic.name,
        id: topic.id,
        isActive: topic.isActive !== undefined ? topic.isActive : true
      }));

      console.log('📤 Sending topics to backend:', topicsData);

      // Call the backend AI endpoint via configured axios client
      const { data: result } = await aiAxios.post('/create-course-topics/', {
        topics: topicsData
      });

      console.log('📥 Backend response:', result);

      if (result?.status === 429) {
        // Some backends may return 200 with a JSON status field; handle gracefully
        const botResponse = {
          id: generateUniqueId(),
          type: "bot",
          message: `🚫 ${result.message}`,
          timestamp: new Date().toLocaleTimeString(),
          isRateLimit: true
        };
        setChatHistory(prev => [...prev, botResponse]);
        if (result.usage_stats) setUsageStats(result.usage_stats);
        // Keep confirmation open and allow adjustments
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create course');
      }

      // Update usage stats from successful creation
      if (result.usage_stats) {
        setUsageStats(result.usage_stats);
      }

      // Show success toast with just the topic count (no rate limit details)
      const actualTopicCount = pendingTopics.length;
      universalToast.success(
        `✅ ${actualTopicCount} topic${actualTopicCount !== 1 ? 's' : ''} created successfully!`,
        { duration: 3000 }
      );

      // Generate a unique course ID
      const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the topic string for URL - extract just the names from objects
      // Use ||| as delimiter to avoid confusion with commas inside topic names
      const topicNames = pendingTopics.map(topic => topic.name);
      const topicString = topicNames.join('|||');
    
      const proResponse = {
        id: generateUniqueId(),
        type: "bot",
        content: ``, // Empty content - only show the card
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isProCard: true,
        topic: topicString,
        extractedTopics: pendingTopics,
        courseId: courseId, // Include the generated course ID
      };
      
  // Update chat history and close confirmation dialog
  setChatHistory((prev) => [...prev, proResponse]);
  setShowTopicConfirmation(false);
  setPendingTopics([]);
  setOriginalPrompt("");
      
    } catch (error) {
      console.error('❌ Error creating course:', error);
      console.error('Error response data:', error?.response?.data);
      console.error('Error response status:', error?.response?.status);
      
      const status = error?.response?.status;
      const data = error?.response?.data || {};
      
      // Handle 400 Bad Request
      if (status === 400) {
        const errorMsg = data?.error || 'Invalid request. Please check your topics.';
        universalToast.error(`❌ ${errorMsg}`, { duration: 4000 });
        console.error('Bad Request Details:', data);
        return;
      }
      
      if (status === 429) {
        const msg = data?.message || 'You have hit the rate limit. Please try again later or reduce the number of requests.';
        const botResponse = {
          id: generateUniqueId(),
          type: "bot",
          message: `🚫 ${msg}`,
          timestamp: new Date().toLocaleTimeString(),
          isRateLimit: true
        };
        setChatHistory(prev => [...prev, botResponse]);
        if (data?.usage_stats) setUsageStats(data.usage_stats);
        // Do NOT clear topics; allow user to adjust and retry
        setShowTopicConfirmation(true);
        return;
      }

      const errorResponse = {
        id: generateUniqueId(),
        type: "bot",
        message: `❌ Failed to create course: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory(prev => [...prev, errorResponse]);
      // Keep topics so user can retry
      setShowTopicConfirmation(true);
    } finally {
      creatingCourseRef.current = false;
      setIsCreatingCourse(false);
    }
  };

  const handleTopicCancel = () => {
    const cancelResponse = {
      id: generateUniqueId(),
      type: "bot",
      content: "❌ Course creation cancelled. Feel free to ask me anything else or try again with a different query!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    setChatHistory((prev) => [...prev, cancelResponse]);
    setShowTopicConfirmation(false);
    setPendingTopics([]);
    setOriginalPrompt("");
  };

  const MessageBubble = React.memo(({ message }) => {
    // Inline auth prompt bubble
    if (message.isAuthPrompt) {
      return (
        <div className="w-full mb-4">
          <div className="flex justify-start">
            <div className="max-w-[90%] min-w-0">
              <div className="px-4 py-3 bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                <p className="mb-3 text-sm">
                  <span className="mr-1">🔒</span>
                  To create personalized learning plans, please sign in.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={message.signInUrl || '/auth?mode=login'}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to={message.signUpUrl || '/auth?mode=signup'}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
                <div className="text-xs mt-2 text-gray-500">{message.timestamp}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // More specific detection for course content - look for multiple sections with specific course structure
    const isCourseContent = (
      message.content.includes("# ") && 
      message.content.includes("## ") && 
      (message.content.includes("### Reading Materials") || 
       message.content.includes("### Summary") || 
       message.content.includes("### Videos") ||
       message.content.includes("### Quiz") ||
       message.content.includes("### Resources"))
    );
    const sections = isCourseContent ? parseMarkdownResponse(message.content) : [];
    const isLearningPlan = message.isLearningPlan || (message.content.includes("Learning Plan") && message.content.includes("Day "));
    const isProCard = message.isProCard || false;

    return (
      <div className="w-full mb-4">
        <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`${
            message.type === "user" 
              ? "max-w-[80%]" // User messages - more constrained width
              : isLearningPlan || isProCard 
                ? "w-full" 
                : "max-w-[90%] min-w-0" // Bot messages - content-dependent width
          }`}>
            <div
              className={`px-4 py-3 ${
                message.type === "user"
                  ? "bg-indigo-600 text-white rounded-2xl rounded-br-md shadow-md"
                  : isLearningPlan || isProCard
                    ? "bg-gray-50 border border-gray-200 shadow-sm rounded-xl" 
                    : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm"
              }`}
            >
              {message.type === "bot" && !isCourseContent && !isLearningPlan && !isProCard && (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-gray-900 prose-headings:text-gray-900">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom code block styling with copy functionality
                      code({node, inline, className, children, ...props}) {
                        const codeString = String(children).replace(/\n$/, '');
                        
                        if (inline) {
                          return (
                            <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded-md text-sm font-mono border border-blue-200" {...props}>
                              {children}
                            </code>
                          );
                        }
                        
                        return (
                          <div className="relative group my-4">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto border border-gray-700">
                              <code className="text-sm font-mono" {...props}>
                                {children}
                              </code>
                            </pre>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeString);
                                // Note: toast may need to be imported if not available
                                console.log('Code copied to clipboard!');
                              }}
                              className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </button>
                          </div>
                        );
                      },
                      // Improved list styling with proper alignment
                      ul({children}) {
                        return (
                          <ul className="space-y-2 my-3 pl-0">
                            {children}
                          </ul>
                        );
                      },
                      li({children, ...props}) {
                        const parentTag = props.node?.parent?.tagName;
                        
                        if (parentTag === 'ol') {
                          return (
                            <li className="flex items-start text-gray-800 pl-0" {...props}>
                              <div className="flex-1">{children}</div>
                            </li>
                          );
                        }
                        
                        return (
                          <li className="flex items-start text-gray-800 pl-0" {...props}>
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <div className="flex-1">{children}</div>
                          </li>
                        );
                      },
                      ol({children}) {
                        return (
                          <ol className="space-y-2 my-3 counter-reset-list pl-0">
                            {children}
                          </ol>
                        );
                      },
                      // Custom heading styling with better spacing
                      h1({children}) {
                        return <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4 border-b border-gray-200 pb-2">{children}</h1>;
                      },
                      h2({children}) {
                        return <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{children}</h2>;
                      },
                      h3({children}) {
                        return <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3">{children}</h3>;
                      },
                      h4({children}) {
                        return <h4 className="text-sm font-semibold text-gray-900 mb-2 mt-3">{children}</h4>;
                      },
                      // Enhanced paragraph styling
                      p({children}) {
                        return <p className="text-gray-800 leading-relaxed mb-2 text-sm">{children}</p>;
                      },
                      // Enhanced blockquote styling
                      blockquote({children}) {
                        return (
                          <blockquote className="border-l-4 border-blue-400 pl-3 py-2 bg-blue-50 text-gray-700 italic my-3 rounded-r-lg">
                            {children}
                          </blockquote>
                        );
                      },
                      // Enhanced table styling
                      table({children}) {
                        return (
                          <div className="overflow-x-auto my-3 rounded-lg border border-gray-200">
                            <table className="min-w-full">{children}</table>
                          </div>
                        );
                      },
                      thead({children}) {
                        return <thead className="bg-gray-50">{children}</thead>;
                      },
                      th({children}) {
                        return <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-900 text-xs">{children}</th>;
                      },
                      td({children}) {
                        return <td className="border-b border-gray-100 px-3 py-2 text-gray-800 text-xs">{children}</td>;
                      },
                      // Enhanced strong/bold styling
                      strong({children}) {
                        return <strong className="font-semibold text-gray-900">{children}</strong>;
                      },
                      // Enhanced emphasis/italic styling
                      em({children}) {
                        return <em className="italic text-gray-700">{children}</em>;
                      },
                    }}
                  >
                    {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                  </ReactMarkdown>
                </div>
              )}

              {message.type === "bot" && isCourseContent && !isLearningPlan && !isProCard && (
                <div className="mt-2">
                  {sections.map((section, index) => (
                    <div key={index} className="mb-3 last:mb-0">
                      <h3 className="font-semibold text-gray-800 mb-1">{section.title}</h3>
                      {section.subsections.map((subsection, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <h4 className="font-medium text-gray-700 text-sm mb-1">{subsection.title}</h4>
                          {subsection.videos.map((video, vIdx) => (
                            <a
                              key={vIdx}
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-2 rounded hover:bg-blue-50 transition-colors group mb-1 last:mb-0"
                            >
                              <IoPlayCircle className="text-blue-500 group-hover:text-blue-600 mr-2 w-4 h-4 flex-shrink-0" />
                              <span className="text-gray-600 group-hover:text-blue-600 text-xs line-clamp-2">{video.title}</span>
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {message.type === "bot" && isProCard && (
                <Link 
                  to={`/pro-learning/${message.courseId}?topic=${encodeURIComponent(message.topic)}&tab=reading`}
                  className="inline-flex items-center justify-between w-full px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
                    onClick={() => {
                      // Store the topics and course data for batch generation (same as desktop)
                      try {
                        const batchGenerationData = {
                          courseId: message.courseId,
                          topics: message.extractedTopics || [],
                          topicString: message.topic,
                          triggerBatchGeneration: true,
                          timestamp: Date.now()
                        };
        // Store in localStorage only (no IndexedDB)
        try { localStorage.setItem('proLearning_batchGeneration', JSON.stringify(batchGenerationData)); } catch {}
        localStorage.setItem('proLearning_batchMarker', String(batchGenerationData.timestamp));
                        console.log('🚀 Mobile Pro Learning Experience button clicked - batch generation data stored:', batchGenerationData);
                        
                        // Track in ProLearning history
                        proLearningHistoryService.trackCourseCreation(message.courseId, message.topic);
                        
                        // Refresh history state
                        setProLearningHistory(proLearningHistoryService.getHistory());
                        
                      } catch (error) {
                        console.error('Failed to store batch generation data:', error);
                      }
                    }}
                  >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Start Learning</h3>
                      <p className="text-sm text-white/80">Professional Course</p>
                    </div>
                  </div>
                  
                  <svg className="w-5 h-5 text-white/90 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {message.type === "user" && <div className="text-sm">{message.content}</div>}

              <div className={`text-xs mt-2 ${
                message.type === "user" 
                  ? "text-indigo-200" 
                  : isLearningPlan || isProCard
                    ? "text-gray-400" 
                    : "text-gray-500"
              }`}>
                {message.timestamp}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Handle Create Course button with authentication check
  const handleCreateCourse = async () => {
    // Toggle off if currently enabled
    if (proMode) {
      setProMode(false);
      return;
    }

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    // Check rate limits before enabling
    const stats = await fetchUsageStats();
    const remainingToday = stats ? (stats.daily_limit || 16) - (stats.daily_used || 0) : null;
    if (remainingToday !== null && remainingToday <= 0) {
      universalToast.error('Sorry, your daily limit is over. Please try again tomorrow.');
      return;
    }

    setProMode(true);
    setCoursePlaceholder(getRandomPlaceholder());
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Mobile Header with Navigation - Always visible on mobile and tablet */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3">
          {/* Left: Menu button */}
          <button
            onClick={openCoursesDrawer}
            className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Menu"
          >
            <IoMenuOutline size={18} className="text-gray-700" />
          </button>
          
          {/* Center: EasyLearnova branding */}
          <div className="flex-1 mx-3 md:mx-4 text-center">
            <h1 className="text-base md:text-lg font-bold text-gray-900">EasyLearnova</h1>
            <p className="text-xs md:text-sm text-gray-500">Course Creator</p>
          </div>
          
          {/* Right: Back button */}
          <Link 
            to="/"
            className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <IoChevronBack size={18} className="text-gray-700" />
          </Link>
        </div>
      </div>

  {/* Left-side Drawer: ProLearning Courses */}
      <div className={`fixed inset-0 z-40 ${isCoursesDrawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isCoursesDrawerOpen ? 'true' : undefined}>
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${isCoursesDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeCoursesDrawer}
          aria-hidden="true"
        />
        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 h-full w-80 max-w-[88%] bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ${isCoursesDrawerOpen ? 'translate-x-0' : '-translate-x-full'} rounded-r-2xl`}
          role="dialog"
          aria-label="ProLearning Courses"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white/95 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-200/60">
                <IoSchoolOutline className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">ProLearning Courses</div>
                <div className="text-xs text-gray-500">Your saved courses</div>
              </div>
            </div>
            <button
              onClick={closeCoursesDrawer}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition"
              aria-label="Close"
            >
              <IoClose className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div
            ref={drawerContentRef}
            onScroll={handleCoursesScroll}
            className="h-[calc(100%-56px)] overflow-y-auto px-3 py-3"
          >
            {/* Search */}
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={coursesSearch}
                  onChange={(e)=>{ setCoursesSearch(e.target.value); setVisibleCoursesCount(10); }}
                  placeholder="Search courses..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <IoSearchOutline className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {isLoadingCourses ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <div className="w-4 h-4 bg-indigo-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : proLearningCourses && proLearningCourses.length > 0 ? (
              <div className="space-y-2">
                {proLearningCourses
                  .slice()
                  .sort((a,b)=>{
                    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return db - da;
                  })
                  .filter((course)=>{
                    if (!coursesSearch.trim()) return true;
                    const q = coursesSearch.toLowerCase();
                    const title = (course.title || "").toLowerCase();
                    const name = (course.course_name || "").toLowerCase();
                    const topics = Array.isArray(course.topics) ? course.topics.map(t => (t.topic_name || t.name || '').toLowerCase()).join(' ') : '';
                    return title.includes(q) || name.includes(q) || topics.includes(q);
                  })
                  .slice(0, visibleCoursesCount)
                  .map((course) => {
                  const firstTopic = Array.isArray(course.topics) && course.topics.length > 0 ? course.topics[0] : null;
                  const topicParam = firstTopic ? `?topic=${encodeURIComponent(firstTopic.topic_name || firstTopic.name || '')}&tab=reading` : '';
                  const href = `/pro-learning/${course.id}${topicParam}`;
                  const topics = Array.isArray(course.topics) ? course.topics : [];
                  const topicNames = topics.map(t => (t.topic_name || t.name || '').trim()).filter(Boolean);
                  const isIdLike = typeof course.course_name === 'string' && /^course_[a-z0-9_]+$/i.test(course.course_name);
                  const isGenericTitle = (t) => !t || /^(AI Course:|AI Generated Course:?|ProLearning Course|Generated Course|Database Course)$/i.test(String(t).trim());
                  let friendlyName = 'ProLearning Course';
                  if (course.title && !isGenericTitle(course.title) && course.title !== course.course_name) {
                    friendlyName = course.title.trim();
                  } else if (topicNames.length > 0) {
                    const first = topicNames[0];
                    const additional = Math.max(0, topicNames.length - 1);
                    if (additional === 0) friendlyName = first;
                    else if (additional === 1) friendlyName = `${first} +1`;
                    else if (additional === 2) friendlyName = `${first} +1 +2`;
                    else if (additional === 3) friendlyName = `${first} +1 +2 +3`;
                    else friendlyName = `${first} +1 +2 +3 +...`;
                  } else if (!isIdLike && course.course_name && !isGenericTitle(course.course_name)) {
                    friendlyName = course.course_name.trim();
                  }
                  return (
                    <Link key={course.id} to={href} onClick={closeCoursesDrawer} className="block p-3 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-indigo-50 rounded-lg p-2">
                            <IoBook className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{friendlyName}</div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(course.created_at).toLocaleDateString()} • {new Date(course.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <IoChevronForward className="text-gray-300" />
                      </div>
                    </Link>
                  );
                })}

                {visibleCoursesCount < (proLearningCourses?.length || 0) && (
                  <div className="py-3 text-center text-xs text-gray-500">Scroll to load more…</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No saved courses found.</div>
            )}
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
          </div>
        </div>
      </div>

      {/* Welcome Message Modal for First-time Users - Using New Component */}
      <NewWelcomeCard 
        showWelcomeMessage={showWelcomeMessage}
        setShowWelcomeMessage={setShowWelcomeMessage}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
      />
      {/* Old welcome card code removed and replaced with component above */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 welcome-message-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          {/* Overlay (click to close) */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowWelcomeMessage(false)}
          />
          {/* Centered Card */}
          <div className="welcome-card-container">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-down welcome-card">
              {/* Header */}
              {/* Minimal header bar */}
              <div className="welcome-card-header"></div>
              
              <div className="welcome-card-content">
                <div className="welcome-card-icon">
                  <IoRocket className="w-6 h-6 text-white" />
                </div>
                
                <h3 id="welcome-title" className="welcome-card-title">Create your dream course in seconds.</h3>
                <p className="welcome-card-subtitle">No limits. No coding. Just start.</p>
                <button
                  onClick={() => setShowWelcomeMessage(false)}
                  className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition"
                  aria-label="Close"
                >
                  <IoClose className="text-white/90" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 welcome-card-content">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  This chat is dedicated to creating courses. Tell us a topic and we’ll extract up to 4 focused topics and generate your course.
                </p>
                <ul className="text-sm text-gray-600 space-y-1.5 mb-4">
                  <li className="welcome-card-list-item"><span className="welcome-card-bullet w-1.5 h-1.5 rounded-full bg-indigo-500"></span> <span>Type a short topic (e.g., "Basics of photosynthesis")</span></li>
                  <li className="welcome-card-list-item"><span className="welcome-card-bullet w-1.5 h-1.5 rounded-full bg-indigo-500"></span> <span>We create up to 4 topics per request</span></li>
                  <li className="welcome-card-list-item"><span className="welcome-card-bullet w-1.5 h-1.5 rounded-full bg-indigo-500"></span> <span>Tap any sample below to try</span></li>
                </ul>

                {/* Sample prompts */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Create course on basic algebra",
                    "Create course about photosynthesis",
                    "Create course on React components",
                  ].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => {
                        setShowWelcomeMessage(false);
                        setMessage(sample);
                        setTimeout(() => handleSendMessage(sample, { forceProMode: true }), 120);
                      }}
                      className="px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition welcome-card-sample-button"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 pt-1 flex justify-end">
                <button
                  onClick={() => setShowWelcomeMessage(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pt-20 pb-32 bg-white chat-container">
        <div className="min-h-full">
          {/* Centered welcome screen layout when no messages */}
          {chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-[60vh]">
              <div className="text-center w-full max-w-sm px-4">
                <h1
                  key={suggestionKey}
                  className={`text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 leading-tight mb-6 ${
                    isAnimatingOut ? 'animate-slide-up-out' : 'animate-slide-up-in'
                  }`}
                >
                  {rotatingSuggestions[suggestionIndex]}
                </h1>
              </div>
            </div>
          ) : (
            /* Regular chat messages layout */
            <div className="w-full">
              {/* Backend ProLearning courses preview list (hidden by default on mobile chat) */}
          {showMobileCoursesPreview && proLearningCourses && proLearningCourses.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-md flex items-center justify-center mr-2">
                  <IoSchoolOutline className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">Your ProLearning Courses</span>
              </div>
              <div className="space-y-2">
                {proLearningCourses
                  .slice() // copy
                  .sort((a,b)=>{
                    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return db - da;
                  })
                  .map((course) => {
                  const firstTopic = Array.isArray(course.topics) && course.topics.length > 0 ? course.topics[0] : null;
                  const topicParam = firstTopic ? `?topic=${encodeURIComponent(firstTopic.topic_name || firstTopic.name || '')}&tab=reading` : '';
                  const href = `/pro-learning/${course.id}${topicParam}`;
                  // Friendly display name logic (avoid ID-like course_name)
                  const topics = Array.isArray(course.topics) ? course.topics : [];
                  const topicNames = topics.map(t => (t.topic_name || t.name || '').trim()).filter(Boolean);
                  const isIdLike = typeof course.course_name === 'string' && /^course_[a-z0-9_]+$/i.test(course.course_name);
                  const isGenericTitle = (t) => !t || /^(AI Course:|AI Generated Course:?|ProLearning Course|Generated Course|Database Course)$/i.test(String(t).trim());
                  let friendlyName = 'ProLearning Course';
                  if (course.title && !isGenericTitle(course.title) && course.title !== course.course_name) {
                    friendlyName = course.title.trim();
                  } else if (topicNames.length > 0) {
                    const first = topicNames[0];
                    const additional = Math.max(0, topicNames.length - 1);
                    if (additional === 0) friendlyName = first;
                    else if (additional === 1) friendlyName = `${first} +1`;
                    else if (additional === 2) friendlyName = `${first} +1 +2`;
                    else if (additional === 3) friendlyName = `${first} +1 +2 +3`;
                    else friendlyName = `${first} +1 +2 +3 +...`;
                  } else if (!isIdLike && course.course_name && !isGenericTitle(course.course_name)) {
                    friendlyName = course.course_name.trim();
                  }
                  return (
                    <a key={course.id} href={href} className="block p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 rounded-lg p-2">
                          <IoBook className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">{friendlyName}</div>
                          <div className="text-[10px] text-gray-500">
                            {new Date(course.created_at).toLocaleDateString()} • {new Date(course.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {chatHistory.map((chat) => (
            <ErrorBoundary key={`error-boundary-${chat.id}`}>
              <MessageBubble key={chat.id} message={chat} />
            </ErrorBoundary>
          ))}

          {isLoading && (
            <div className="w-full mb-4">
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="bg-white text-gray-800 border border-gray-200 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <BiLoaderAlt className="animate-spin text-indigo-500 w-5 h-5" />
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-sm opacity-30 animate-pulse"></div>
                      </div>
                      <span className="text-gray-700">Thinking...</span>
                      <div className="ml-2 flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Course Configuration Dialog - Minimal design to match desktop */}
          {showTopicConfirmation && (
            <div className="w-full mb-6 px-3">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h2 className="text-base font-medium text-gray-900">Configure Course Topics</h2>
                  <span className="text-sm text-gray-500">{pendingTopics.length}/4 topics</span>
                </div>

                {/* Topics List */}
                <div className="space-y-2 mb-4">
                  {pendingTopics.map((topic, index) => (
                    <div key={`pending-topic-${topic.id || `${index}-${topic.name}`}`} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => handleTopicEdit(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Enter topic name..."
                      />
                      <button
                        onClick={() => handleTopicDelete(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        title="Remove topic"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add Topic Button */}
                  {pendingTopics.length < 4 && (
                    <button
                      onClick={handleTopicAdd}
                      className="w-full p-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm"
                    >
                      + Add Topic ({pendingTopics.length}/4)
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleTopicCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTopicConfirm}
                    disabled={pendingTopics.length === 0 || isCreatingCourse}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      pendingTopics.length === 0 || isCreatingCourse
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isCreatingCourse ? (
                      <>
                        <BiLoaderAlt className="animate-spin" size={16} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <IoRocket size={18} />
                        Create Course
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message input - Fixed at bottom - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 sm:px-5 md:px-8 lg:px-12 xl:px-16 py-3">
            {/* Simple input field with send button */}
            <div className="relative">
              <textarea
                rows={1}
                placeholder="Ask anything"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onInput={(e) => {
                  try {
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                  } catch (_) {}
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                aria-disabled={isLoading}
                className="w-full px-4 pt-4 pb-5 pr-14 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400/60 focus:border-indigo-400 text-gray-900 placeholder-gray-500 resize-none overflow-hidden text-base transition-all"
                style={{ minHeight: '54px', maxHeight: '120px' }}
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || isLoading}
                  aria-label="Send message"
                  className={`h-10 w-10 flex items-center justify-center rounded-full transition-all ${
                    message.trim() && !isLoading 
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <BiLoaderAlt className="animate-spin" size={18} />
                  ) : (
                    <IoSend size={18} className="ml-0.5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Usage Stats - Show below input */}
            {usageStats && isLoggedIn && (
              <div className="mt-3 flex justify-center">
                <div className="text-center">
                  <div className="[&>div]:text-center">
                    <CompactRateLimitStatus usageStats={usageStats} className="text-center" />
                  </div>
                  {usageStats.isFallback && (
                    <div className="text-xs text-gray-400 mt-1">Limits unavailable. Showing default.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth modal removed - gating is inline within chat conversation */}
    </div>
  );
};

export default MobileChatbotPage;
