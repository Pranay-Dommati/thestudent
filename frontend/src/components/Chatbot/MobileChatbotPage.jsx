import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoChevronBack, IoPlayCircle, IoSchoolOutline, IoCheckmarkCircle, IoBook, IoPersonOutline, IoHomeOutline, IoMenuOutline, IoClose, IoTimeOutline, IoChevronForward, IoSearchOutline } from "react-icons/io5";
import { FaRobot } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { classifyTopics, formatRateLimitMessage } from "../ProLearning/topicclassifier";
import AuthModal from '../Common/AuthModal';
import ErrorBoundary from '../Common/ErrorBoundary';
import RateLimitStatus from './RateLimitStatus';
import CompactRateLimitStatus from './CompactRateLimitStatus';
import proLearningHistoryService from '../../services/ProLearningHistoryService';

// Custom CSS - added for DeepSeek-like UI
import './mobileChatStyles.css';

import apiAxios from '../../utils/axios';
import aiAxios from '../../utils/axiosAi';

// Secure backend chat proxy (uses JWT)
const callChatBackend = async (message) => {
  const { data } = await aiAxios.post('/chat/', { message });
  return data?.text || 'Sorry, I could not generate a response.';
};

// Vector bot API call for general educational responses
const callVectorBotAPI = async (message) => {
  try {
    console.log('📤 Sending request to vector bot API:', message);
    const token = (localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('token'));
  const { data } = await apiAxios.post('/chatbot/chat/general/', { message });
  return data.response;
  } catch (error) {
    console.error('Error calling vector bot API:', error);
    return 'Sorry, I encountered an error while processing your request. Please try again later.';
  }
};

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
  const [proMode, setProMode] = useState(false);
  const [showTopicConfirmation, setShowTopicConfirmation] = useState(false);
  const [pendingTopics, setPendingTopics] = useState([]);
  const [personalization, setPersonalization] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Generate unique IDs using timestamp and random component
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const [usageStats, setUsageStats] = useState(null); // Track rate limit usage stats
  const [usageStatsHidden, setUsageStatsHidden] = useState(false); // Track if user dismissed usage stats
  const [chatHistory, setChatHistory] = useState([
    {
      id: generateUniqueId(),
      type: "bot",
      content: "Hello! I'm your AI learning assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
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

  // Fetch usage stats when component mounts or when pro mode is enabled (returns stats)
  const fetchUsageStats = async () => {
    try {
      if (!isLoggedIn) return null;
      const { data } = await apiAxios.get('/chatbot/usage-stats/');
      setUsageStats(data);
      return data;
    } catch (error) {
      console.error('📊 Error fetching usage stats:', error);
      // Fallback default
      const fallback = { daily_used: 0, daily_limit: 16, per_request_limit: 4 };
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
            toast.error('Sorry, your daily limit is over. Please try again tomorrow.');
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
            handleSendMessage(decodedMessage);
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
        handleSendMessage(decodedMessage);
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
          console.warn('Mobile stats loading timeout, setting fallback');
          setUsageStats({ daily_used: 0, daily_limit: 16, per_request_limit: 4 });
        }
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [proMode, usageStats]);

  const handleSendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || message;
    if (!messageToSend.trim() || isLoading) return;

    console.log('📱 Mobile handleSendMessage called with:', { 
      messageToSend, 
      proMode, 
      usageStats,
      isLoggedIn
    });

    const userMessageObj = {
      id: generateUniqueId(),
      type: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMessageObj]);
    if (!customMessage) setMessage("");
    setIsLoading(true);

    try {
      if (proMode) {
        // Check daily quota before processing
        if (usageStats) {
          const remainingToday = (usageStats.daily_limit || 16) - (usageStats.daily_used || 0);
          if (remainingToday <= 0) {
            toast.error("🚫 Daily limit reached! You've used all your topic creation quota for today. Please try again tomorrow.", {
              duration: 5000,
              position: 'top-center'
            });
            setIsLoading(false);
            return;
          }
        }

        // Pro mode - extract topics using AI first with rate limiting
        try {
          console.log('🚀 Mobile pro mode activated, calling classifyTopics with:', messageToSend);
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
          
          const extractedTopics = result.topics || [];
          
          // Show toast notification IMMEDIATELY if more than 4 topics were extracted
          const maxPerRequest = 4; // Default max per request
          if (extractedTopics.length > maxPerRequest) {
            toast.info(
              `📝 Maximum ${maxPerRequest} topics per request. Found ${extractedTopics.length} topics, showing first ${maxPerRequest}.`,
              { 
                duration: 4000,
                position: 'top-center',
                icon: '📝'
              }
            );
          }
          
          if (extractedTopics && extractedTopics.length > 0) {
            // Check current rate limit status to determine how many topics user can actually create
            let availableTopics = extractedTopics;
            let limitMessage = "";
            
            if (usageStats) {
              const remainingToday = (usageStats.daily_limit || 16) - (usageStats.daily_used || 0);
              const maxPerRequestFromStats = usageStats.per_request_limit || 4;
              
              // Limit topics to the smaller of: remaining daily limit or max per request
              const maxAllowedTopics = Math.min(remainingToday, maxPerRequestFromStats);
              
              if (extractedTopics.length > maxAllowedTopics) {
                // Limit the topics to what user can actually create
                availableTopics = extractedTopics.slice(0, maxAllowedTopics);
                
                if (remainingToday <= 0) {
                  limitMessage = `⚠️ You've reached your daily limit of ${usageStats.daily_limit || 16} topics. Please try again tomorrow.`;
                  // Show toast for daily limit reached
                  toast.error(`🚫 Daily limit reached (${usageStats.daily_used || 0}/${usageStats.daily_limit || 16} used)`, {
                    duration: 4000
                  });
                } 
              }
            } else {
              // If no usage stats, just limit to 4 topics max
              if (extractedTopics.length > maxPerRequest) {
                availableTopics = extractedTopics.slice(0, maxPerRequest);
                limitMessage = `⚠️ Showing first ${maxPerRequest} topics. You can create maximum ${maxPerRequest} topics at a time.`;
                // Show informational toast for general per-request limiting
                toast(`🔢 Limited to ${maxPerRequest} topics per request`, {
                  icon: 'ℹ️',
                  style: {
                    background: '#d1ecf1',
                    color: '#0c5460',
                    border: '1px solid #bee5eb'
                  },
                  duration: 4000
                });
              }
            }
            
            // If no topics available due to limits, don't show confirmation
            if (availableTopics.length === 0) {
              const limitResponse = {
                id: generateUniqueId(),
                type: "bot",
                content: limitMessage || "❌ You've reached your daily topic creation limit. Please try again tomorrow.",
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
            
            const confirmationResponse = {
              id: generateUniqueId(),
              type: "bot",
              content: `🤔 I've analyzed your query "${messageToSend}" and extracted ${availableTopics.length} learning topic(s). ${limitMessage} Please review and confirm the topics you'd like to include in your course.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isTopicConfirmation: true,
            };
            setChatHistory((prev) => [...prev, confirmationResponse]);
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
              content: `🚫 **Rate Limit Exceeded**\n\n${rateLimitMessage}\n\n**Current Limits:**\n- Max 4 topics per request\n- Max 16 topics per day\n\nPlease try again later or contact support if you need higher limits.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isRateLimitError: true,
            };
            setChatHistory((prev) => [...prev, rateLimitResponse]);
            
            // Show toast notification
            toast.error('Daily topic creation limit reached', {
              duration: 5000,
              position: 'top-center',
            });
            setIsLoading(false);
            return;
          } else {
            // Generic error handling
            const errorResponse = {
              id: generateUniqueId(),
              type: "bot",
              content: `❌ Topic extraction failed: ${error.message}. Please try again with a clearer learning query.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, errorResponse]);
            setIsLoading(false);
            return;
          }
        }
      } else {
        // Regular chatbot response using secure backend proxy
        if (!isAuthenticated) {
          setShowAuthModal(true);
          const authPrompt = {
            id: generateUniqueId(),
            type: 'bot',
            content: 'Please sign in to chat with the AI assistant.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setChatHistory((prev) => [...prev, authPrompt]);
          return;
        }
        console.log('🔄 Calling backend AI chat proxy...');
        const response = await callChatBackend(messageToSend);

        const botResponse = {
          id: generateUniqueId(),
          type: "bot",
          content: typeof response === 'string' ? response : String(response),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChatHistory((prev) => {
          const newHistory = [...prev, botResponse];
          return newHistory;
        });
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
    if (pendingTopics.length === 0) {
      alert("Please add at least one topic to create a course.");
      return;
    }

    try {
      // Call the backend AI endpoint via configured axios client
      const { data: result } = await aiAxios.post('/create-course-topics/', {
        topics: pendingTopics
      });

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
      toast.success(
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
        content: `🎓 Perfect! I'll create a comprehensive course on: **${topicNames.join(', ')}**. Click the card below to access your customized course materials. Content generation will begin automatically and you'll see a loading screen until all materials are ready.`,
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
      console.error('Error creating course:', error);
      const status = error?.response?.status;
      const data = error?.response?.data || {};
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
                <div className="w-full">
                  <div className="bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm border border-purple-200/50 rounded-lg p-3 mb-2">
                    <div className="text-sm text-gray-700 mb-3">{message.content}</div>
        <Link 
                      to={`/pro-learning/${message.courseId}?topic=${encodeURIComponent(message.topic)}&tab=reading`}
                      className="block w-full p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
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
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold mb-1">🚀 Pro Learning Experience</h3>
                          <p className="text-purple-100 text-xs">Complete study materials for: {message.topic}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
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
      toast.error('Sorry, your daily limit is over. Please try again tomorrow.');
      return;
    }

    setProMode(true);
    setCoursePlaceholder(getRandomPlaceholder());
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Mobile Header with Navigation */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: Back button */}
          <Link 
            to="/"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <IoChevronBack size={18} className="text-gray-700" />
          </Link>
          
          {/* Center: Title and subtitle */}
          <div className="flex-1 mx-3 text-center">
            <h1 className="text-base font-bold text-gray-900">AI Chat</h1>
            <p className="text-xs text-gray-500">Learning Assistant</p>
          </div>
          
          {/* Right: Menu Button */}
          <div className="relative">
            <button
              onClick={openCoursesDrawer}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="My Courses"
            >
              <IoMenuOutline size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
        
  {/* Quick Action Suggestions - only show when chat is empty */}
        {!showTopicConfirmation && chatHistory.length === 0 && (
          <div className="px-3 pb-2 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-3 py-2">
              <button
                onClick={() => setMessage("Explain quantum physics in simple terms")}
                className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                📚 Quick Learn
              </button>
              <button
                onClick={() => setMessage("Create a course about")}
                className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors flex-shrink-0"
              >
                🎓 Create Course
              </button>
              <button
                onClick={() => setMessage("Help me with homework")}
                className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                ✏️ Help
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right-side Drawer: ProLearning Courses */}
      <div className={`fixed inset-0 z-40 ${isCoursesDrawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isCoursesDrawerOpen}>
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${isCoursesDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeCoursesDrawer}
        />
        {/* Drawer */}
        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-[88%] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ${isCoursesDrawerOpen ? 'translate-x-0' : 'translate-x-full'} rounded-l-2xl`}
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

      {/* Welcome Message Popup for First-time Users */}
      {showWelcomeMessage && (
        <>
          {/* Background Blur Overlay */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
          
          {/* Top Positioned Welcome Message */}
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm mx-4">
            <div className="bg-white/95 backdrop-blur-lg border border-white/30 rounded-xl p-4 shadow-xl animate-slide-down">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                    <IoSchoolOutline className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">Welcome!</h3>
                </div>
                <button
                  onClick={() => setShowWelcomeMessage(false)}
                  className="text-gray-600 hover:text-gray-800 transition-all duration-200 p-1.5 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-800 text-sm leading-relaxed">
                Use our powerful tool to seamlessly create customized courses on any topic of your choice — just click the 'Create Course' button to begin.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pt-20 pb-32 bg-white chat-container">
        <div className="min-h-full">
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

          {/* Topic Confirmation Dialog - Improved */}
          {showTopicConfirmation && (
            <div className="w-full mb-4">
              <div className="flex justify-start">
                <div className="max-w-[92%]">
                  <div className="bg-white border border-blue-200 rounded-2xl rounded-bl-md p-4 shadow-lg">
                    {/* Header */}
                    <div className="flex items-center mb-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Confirm Course Topics</h3>
                        <p className="text-sm text-gray-500">
                          Found {pendingTopics.length} topic(s) from "<em className="text-gray-700">{originalPrompt}</em>"
                        </p>
                      </div>
                    </div>
                    
                    {/* Topics List */}
                    <div className="space-y-2 mb-4">
                      {personalization && (
                        <div className="mb-3">
                          <span className="inline-block text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-1">
                            Personalization: {personalization}
                          </span>
                        </div>
                      )}
                      {pendingTopics.map((topic, index) => (
                        <div key={topic.id || index} className="flex items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <span className="text-indigo-600 font-semibold mr-3 text-sm w-6">{index + 1}.</span>
                          <input
                            type="text"
                            value={topic.name}
                            onChange={(e) => handleTopicEdit(index, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-2 py-1 text-sm"
                          />
                          <button
                            onClick={() => handleTopicDelete(index)}
                            className="ml-2 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleTopicConfirm}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
                      >
                        Create Course with {pendingTopics.length} Topic{pendingTopics.length !== 1 ? 's' : ''}
                      </button>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleTopicAdd}
                          disabled={pendingTopics.length >= 4}
                          className={`flex-1 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-sm font-medium transition-all ${
                            pendingTopics.length >= 4 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:border-indigo-300'
                          }`}
                        >
                          + Add Topic
                        </button>
                        <button
                          onClick={handleTopicCancel}
                          className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input - Fixed at bottom with no bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="bg-white border-t border-gray-200 shadow-lg">
          {/* Bottom input area */}
          <div className="px-4 py-3">
            {/* Course Mode Section - Compact Horizontal Design */}
            <div className="mb-3">
              {/* Course Creator Button and Usage Info in one row */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleCreateCourse}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm transition-all ${
                    proMode 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <IoSchoolOutline size={16} className="mr-2" />
                  <span className="font-medium">{proMode ? "Course Mode" : "Course Creator"}</span>
                  {proMode && <IoCheckmarkCircle size={14} className="ml-2" />}
                </button>
                
                {/* Minimalistic Usage indicator with dismiss button */}
                {proMode && usageStats && !usageStatsHidden && (
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-600">
                        {Math.max(0, (usageStats.daily_limit || 16) - (usageStats.daily_used || 0))} remaining today
                      </div>
                      <div className="text-xs text-gray-500">
                        Up to {usageStats.per_request_limit || usageStats.request_limit || 4} per request
                      </div>
                    </div>
                    <button
                      onClick={() => setUsageStatsHidden(true)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <IoClose size={14} className="text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Optional: Rate limit warning only when very low */}
              {proMode && usageStats && (usageStats.daily_used || 0) >= (usageStats.daily_limit || 16) && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                  ⚠️ Daily limit reached. Resets tomorrow.
                </div>
              )}
            </div>
            
            {/* Input container - Improved spacing and styling */}
            <div className="relative flex items-center bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus-within:border-indigo-300 focus-within:shadow-md transition-all">
              {/* Left robot button */}
              <button
                onClick={() => {}} // Model toggle
                className="px-3 py-3"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors">
                  <FaRobot size={14} />
                </div>
              </button>
              
              {/* Input field with better styling */}
              <input
                type="text"
                placeholder={proMode ? "Describe your course topic..." : "Ask anything..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1 py-3 pl-2 pr-12 text-base bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400"
                disabled={isLoading}
              />
              
              {/* Send button - improved styling */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isLoading}
                className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                  message.trim() && !isLoading 
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md" 
                    : proMode && !isLoading
                      ? "bg-indigo-500 text-white/80 cursor-not-allowed opacity-75"
                      : "bg-gray-300 text-gray-500"
                }`}
              >
                <IoSend size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Course Creation Requires Account"
        message="Create personalized courses tailored to your learning goals. Save your progress and access advanced features."
        feature="Create Custom Courses"
      />
    </div>
  );
};

export default MobileChatbotPage;
