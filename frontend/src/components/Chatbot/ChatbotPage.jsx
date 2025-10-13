import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack, IoPlayCircle, IoSchoolOutline, IoCheckmarkCircle, IoTimeOutline, IoBook, IoBookmark, IoInformationCircle, IoChevronForward } from "react-icons/io5";
import { FaRobot, FaGraduationCap, FaBook, FaRegUser } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { classifyTopics, formatRateLimitMessage } from "../ProLearning/topicclassifier";
import AuthModal from '../Common/AuthModal';
import RateLimitStatus from './RateLimitStatus';
import CompactRateLimitStatus from './CompactRateLimitStatus';
import proLearningHistoryService from '../../services/ProLearningHistoryService';
// Removed IndexedDBService usage for Pro Learning flows

// Use relative API paths; dev proxy routes to backend
import apiAxios from '../../utils/axios';
import aiAxios from '../../utils/axiosAi';

// Secure backend chat proxy (DRF-protected)
const callChatBackend = async (message) => {
  const token = (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token')
  );
  const { data } = await aiAxios.post('/chat/', { message });
  return data?.text || 'Sorry, I could not generate a response.';
};

// Extract learning context from user's prompt
const extractLearningContext = (prompt) => {
  if (!prompt) return '';
  
  // Common programming languages and technologies
  const techKeywords = [
    'python', 'javascript', 'java', 'c\\+\\+', 'typescript', 'ruby', 'php', 'golang', 'rust',
    'react', 'angular', 'vue', 'node\\.?js', 'django', 'flask', 'spring', 'express'
  ].join('|');

  const contextPatterns = [
    // Programming language context
    { 
      regex: new RegExp(`\\b(?:in|using|with|for)\\s+(${techKeywords})\\b`, 'i'),
      type: 'language',
      format: (match) => `Using ${match[1].toUpperCase()}`
    },
    // Learning style context
    {
      regex: /\b(?:beginner|intermediate|advanced|new to|experienced in)\s+([^.!?,]+)/i,
      type: 'level',
      format: (match) => `Level: ${match[1].trim()}`
    },
    // Purpose/goal context
    {
      regex: /\b(?:for|to|focus on)\s+([\w\s]+(?:development|engineering|programming|coding))/i,
      type: 'purpose',
      format: (match) => `Purpose: ${match[1].trim()}`
    },
    // Specific preferences
    {
      regex: /\bprefer\s+([^.!?,]+)/i,
      type: 'preference',
      format: (match) => `Preference: ${match[1].trim()}`
    }
  ];

  const contexts = [];
  contextPatterns.forEach(pattern => {
    const match = prompt.match(pattern.regex);
    if (match) {
      contexts.push(pattern.format(match));
    }
  });

  // Handle "X in Y" pattern specially for combining topics
  const inMatch = prompt.match(/\b(\w+(?:\s+\w+)*)\s+in\s+(${techKeywords})\b/i);
  if (inMatch) {
    contexts.push(`Topic: ${inMatch[1]} in ${inMatch[2].toUpperCase()}`);
  }

  return contexts.join(' • ');
};

// Removed client-side Gemini usage in favor of backend proxy

// Vector bot API call for general educational responses
const callVectorBotAPI = async (message) => {
  try {
    const token = (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  const { data } = await apiAxios.post('/chatbot/chat/general/', { message });
    
    return data.response || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('❌ Vector bot API error:', error);
    // If it's a network failure (fetch TypeError/Failed to fetch), throw a special error
    const isNetworkFailure =
      error?.name === 'TypeError' ||
      (typeof error?.message === 'string' && /Failed to fetch|NetworkError|Network request failed/i.test(error.message));

    if (isNetworkFailure) {
      const netErr = new Error('Network connection error');
      netErr.name = 'NetworkConnectionError';
      throw netErr;
    }

    // Otherwise, rethrow to be handled by the caller
    throw error;
  }
};

// Add slide-up animation and glassmorphism styles
const style = document.createElement('style');
style.textContent = `
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
  
  @keyframes slide-down {
    from {
      transform: translateX(-50%) translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-down {
    animation: slide-down 0.4s ease-out forwards;
  }
  
  /* Custom scrollbar styling */
  .scrollbar-glass::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-glass::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .scrollbar-glass::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 10px;
    backdrop-filter: blur(10px);
  }
  .scrollbar-glass::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
  
  /* Background animation */
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(1deg); }
    66% { transform: translateY(-5px) rotate(-1deg); }
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-float-delayed {
    animation: float 6s ease-in-out infinite;
    animation-delay: -2s;
  }
  
  /* Ordered list counter styling */
  .counter-reset-list {
    counter-reset: list-counter;
  }
  
  .counter-reset-list li {
    counter-increment: list-counter;
    position: relative;
    padding-left: 0;
  }
  
  .counter-reset-list li::before {
    content: counter(list-counter) ".";
    font-weight: 600;
    color: #3b82f6;
    margin-right: 8px;
    min-width: 20px;
    display: inline-block;
  }
  
  /* Enhanced code block styling */
  .markdown-code-block {
    position: relative;
  }
  
  .markdown-code-block:hover .copy-button {
    opacity: 1;
  }
`;
document.head.appendChild(style);

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const CourseSection = ({ section, subsections }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="mb-4 lg:mb-6 bg-white rounded-lg shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-base lg:text-lg font-semibold text-gray-800">{section}</h3>
        <svg
          className={`w-4 h-4 lg:w-5 lg:h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-3 lg:p-4">
          {subsections.map((subsection, index) => (
            <div key={index} className="mb-3 lg:mb-4 last:mb-0">
              <h4 className="font-medium text-gray-700 mb-2 text-sm lg:text-base">{subsection.title}</h4>
              {subsection.videos.map((video, vIndex) => (
                <a
                  key={vIndex}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded hover:bg-blue-50 transition-colors group mb-2 last:mb-0"
                >
                  <IoPlayCircle className="text-blue-500 group-hover:text-blue-600 mr-2 w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="text-gray-600 group-hover:text-blue-600 text-sm lg:text-base line-clamp-2">{video.title}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LearningPlanDisplay = ({ content, learningPlanId }) => {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState([]);
  const [activeDay, setActiveDay] = useState(1);
  const [extractedPlanId, setExtractedPlanId] = useState(learningPlanId || null);

  useEffect(() => {
    try {
      // Parse markdown content to extract learning plan data
      const lines = content.split('\n');
      let currentTitle = '';
      let currentDays = [];
      let currentDay = null;
      
      // Try to extract learning plan ID from content
      if (!learningPlanId) {
        const linkMatch = content.match(/\/learning\/([0-9a-f-]{36})/);
        if (linkMatch && linkMatch[1]) {
          setExtractedPlanId(linkMatch[1]);
        }
      }
  
      // Extract the main title (could be a learning plan title)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('# ')) {
          currentTitle = line.replace('# ', '').trim();
          break;
        }
      }
  
      // If no title found, use a default one
      if (!currentTitle) {
        currentTitle = "Your Learning Plan";
      }
  
      // Process each line to extract day info, project ideas, and videos
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Extract day information (matches both "## Day 1: Topic" and "## Day 1 - Topic" formats)
        if (line.startsWith('## Day ')) {
          // Save the previous day if it exists
          if (currentDay) {
            currentDays.push(currentDay);
          }
          
          // Try to match different day header formats
          const dayMatch = line.match(/## Day (\d+)[:\s-]\s*(.+)/);
          if (dayMatch) {
            currentDay = {
              number: parseInt(dayMatch[1]),
              topic: dayMatch[2],
              projectIdea: '',
              videos: []
            };
          }
        }
        // Extract project idea
        else if (line.includes('**Project idea:**') && currentDay) {
          currentDay.projectIdea = line.replace('**Project idea:**', '').trim();
        }
        // Extract videos - handle multiple formats of links
        else if (line.startsWith('- [') && currentDay) {
          // Match markdown link format: [title](url)
          const videoMatch = line.match(/- \[(.+?)\]\((.+?)\)/);
          if (videoMatch) {
            currentDay.videos.push({
              title: videoMatch[1],
              url: videoMatch[2]
            });
          }
        }
      }
  
      // Add the last day if it exists
      if (currentDay) {
        currentDays.push(currentDay);
      }
  
      setTitle(currentTitle);
      setDays(currentDays);
    } catch (error) {
      console.error("Error parsing learning plan:", error);
      setTitle("Learning Plan");
      setDays([]); // Set empty array on error
    }
  }, [content]);

  return (
    <div className="mt-2 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-blue-600 text-white px-3 lg:px-4 py-3 lg:py-4">
        <h2 className="text-lg lg:text-xl font-bold">{title}</h2>
        <p className="text-blue-100 text-xs lg:text-sm mt-1">{days.length} days learning journey</p>
      </div>
      
      {/* Day navigation */}
      <div className="flex overflow-x-auto py-2 bg-gray-50 border-b hide-scrollbar">
        <div className="flex px-2 gap-1 lg:gap-2 min-w-full">
          {days.map(day => (
            <button
              key={day.number}
              onClick={() => setActiveDay(day.number)}
              className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                activeDay === day.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Day {day.number}
            </button>
          ))}
        </div>
      </div>

      {/* Active day content */}
      {days.map(day => day.number === activeDay && (
        <div key={day.number} className="p-3 lg:p-4">
          <div className="mb-4 lg:mb-6">
            <h3 className="text-base lg:text-xl font-bold text-gray-800">{day.topic}</h3>
            <div className="mt-3 p-3 lg:p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-semibold text-yellow-800 mb-1 text-sm lg:text-base">Project Idea</h4>
              <p className="text-gray-700 text-sm lg:text-base">{day.projectIdea}</p>
            </div>
          </div>

          {day.videos.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">Recommended Videos</h4>
              <div className="space-y-2 lg:space-y-3">
                {day.videos.map((video, index) => (
                  <a
                    key={index}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 lg:p-3 border border-gray-200 rounded-md hover:bg-blue-50 transition-colors group"
                  >
                    <div className="bg-red-600 text-white p-1.5 lg:p-2 rounded-md mr-2 lg:mr-3 flex-shrink-0">
                      <IoPlayCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <span className="text-gray-700 group-hover:text-blue-600 text-sm lg:text-base line-clamp-2">{video.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Learning path card */}
          <div className="mt-4 lg:mt-6 pt-4 border-t border-gray-200">
            <Link 
              to="/pro-learning"
              className="block w-full p-3 lg:p-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base lg:text-lg font-bold mb-1">Continue Your Learning Journey</h3>
                  <p className="text-blue-100 text-xs lg:text-sm">Access Pro Learning with interactive content</p>
                </div>
                <div className="bg-white/20 p-2 lg:p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
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

const ChatbotPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoggedIn } = useAuth();
  const initialQuery = searchParams.get("q");

  const [message, setMessage] = useState("");
  const [proMode, setProMode] = useState(false);
  const [coursePlaceholder, setCoursePlaceholder] = useState("Create arrays and strings course...");
  const [showTopicConfirmation, setShowTopicConfirmation] = useState(false);
  const [pendingTopics, setPendingTopics] = useState([]);
  // Guard against multiple rapid clicks on "Create Course" in the confirmation dialog
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const creatingCourseRef = useRef(false);
  const [personalization, setPersonalization] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [usageStats, setUsageStats] = useState(null); // Track rate limit usage stats
  const [learningContext, setLearningContext] = useState(""); // Store learning preferences and context
  const [networkRetryCount, setNetworkRetryCount] = useState(0); // Track network retry attempts
  const [lastFailedPrompt, setLastFailedPrompt] = useState(""); // Store last failed prompt for retry
  const [retryingMessageId, setRetryingMessageId] = useState(null); // Track which specific message is being retried
  const networkErrorTimeouts = useRef({}); // Store timeout IDs for network error messages
  const cancelledRetriesRef = useRef(new Set()); // Track message IDs whose retries were cancelled by a new prompt
  const [proLearningHistory, setProLearningHistory] = useState([]); // Legacy local history (fallback)
  const [proLearningCourses, setProLearningCourses] = useState([]); // Backend DB courses
  const [isLoadingCourses, setIsLoadingCourses] = useState(false); // Loading state for sidebar courses

  // Generate unique message ID
  const generateMessageId = () => Date.now() + Math.random();
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hello! I'm your AI learning assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const initialQueryProcessed = useRef(false);
  const autoSendProcessed = useRef(false); // Additional flag to prevent duplicate auto-sends
  const { width } = useWindowSize();
  // Sidebar default: open on large desktop (>=1024px), closed otherwise
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [chatSessions, setChatSessions] = useState([
    {
      id: 1,
      title: "Course Recommendations",
      timestamp: "2 hours ago",
      preview: "Looking for web development courses...",
    },
    {
      id: 2,
      title: "Learning Path",
      timestamp: "Yesterday",
      preview: "Create a learning path for machine learning...",
    },
  ]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Random course placeholder texts - Topic focused
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

  // Function to get random placeholder
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * coursePlaceholders.length);
    return coursePlaceholders[randomIndex];
  };

  // Check if user has visited chat page before
  useEffect(() => {
    const hasVisitedChat = localStorage.getItem('hasVisitedChat');
    if (!hasVisitedChat) {
      setShowWelcomeMessage(true);
      localStorage.setItem('hasVisitedChat', 'true');
    }
  }, []);

  // Helper to get auth token
  const getAuthToken = async () => {
    try {
      return (
        localStorage.getItem('accessToken') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        null
      );
    } catch {
      return null;
    }
  };

  // Load ProLearning history (fallback) and backend courses on mount
  useEffect(() => {
    const loadHistory = () => {
      const history = proLearningHistoryService.getHistory();
      setProLearningHistory(history);
    };
    const loadBackendCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const token = await getAuthToken();
        if (!token) {
          setIsLoadingCourses(false);
          return;
        }
        const { data } = await apiAxios.get('/courses/pro-learning/');
        if (Array.isArray(data)) setProLearningCourses(data);
      } catch (e) {
        console.warn('Failed to load ProLearning courses from backend:', e);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadHistory();
    loadBackendCourses();
    
    // Listen for storage changes to update history in real-time
    const handleStorageChange = () => {
      loadHistory();
    };
    
    // Listen for custom history update events
  const handleHistoryUpdate = () => { loadHistory(); };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('prolearning-history-updated', handleHistoryUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('prolearning-history-updated', handleHistoryUpdate);
    };
  }, []);

  // Handle ESC key to close welcome message
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showWelcomeMessage) {
        setShowWelcomeMessage(false);
      }
    };

    if (showWelcomeMessage) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showWelcomeMessage]);

  // Scroll to the bottom of the chat when chat history updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle initial query from URL parameter
  useEffect(() => {
    // Check for both old query parameter and new message parameter
    const messageParam = searchParams.get("message");
    const modeParam = searchParams.get("mode");
    const prefillParam = searchParams.get("prefill");
    
    // If coming from Home with explicit createCourse mode, enable pro mode and set a helpful placeholder
    if (modeParam === 'createCourse' && !proMode) {
      // Pre-gate by rate limit if authenticated, same logic as manual toggle
      const tryEnablePro = async () => {
        setCoursePlaceholder(getRandomPlaceholder());
        if (isAuthenticated && typeof isAuthenticated === 'function' && isAuthenticated()) {
          const stats = await fetchUsageStats();
          const remainingToday = stats ? (stats.daily_limit || 16) - (stats.daily_used || 0) : null;
          if (remainingToday !== null && remainingToday <= 0) {
            toast.error('Sorry, your daily limit is over. Please try again tomorrow.');
            return; // don't enable pro mode
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

  // Timeout fallback to prevent infinite "Loading stats..." when pro mode is enabled
  useEffect(() => {
    if (proMode && !usageStats) {
      const timeoutId = setTimeout(() => {
        if (!usageStats) {
          console.warn('Stats loading timeout, setting fallback');
          setUsageStats({ daily_used: 0, daily_limit: 16, per_request_limit: 4 });
        }
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [proMode, usageStats]);

  // Expose setUsageStats globally for ProLearningPage to refresh after course save
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.chatbotSetUsageStats = setUsageStats;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.chatbotSetUsageStats;
      }
    };
  }, []);

  // Do not auto-close/open sidebar on resize; only set default on mount above.

  // Cleanup network error timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all network error timeouts when component unmounts
      Object.values(networkErrorTimeouts.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to check actual connection to the backend
  const checkConnection = async () => {
    try {
      const { status } = await aiAxios.post('/chat/', { message: 'test connection' });
      return status >= 200 && status < 300;
    } catch (error) {
      return false;
    }
  };

  // Retry function for network errors
  const retryLastRequest = async (messageId = null) => {
    if (!lastFailedPrompt || isLoading) return;
    
    const promptToRetry = lastFailedPrompt;
    setNetworkRetryCount(prev => prev + 1);
    setRetryingMessageId(messageId);
    // Don't set loading state during retry - we show loading in the specific message
    // Clear any previous cancellation for this message because user is retrying explicitly
    if (messageId != null) {
      cancelledRetriesRef.current.delete(messageId);
    }
    
    // Update only the specific error message to show reconnection attempt
    setChatHistory((prev) => 
      prev.map(msg => 
        msg.id === messageId && msg.isNetworkError && !msg.isReconnecting 
          ? {
              ...msg,
              content: "🌐 **Network connection lost. Attempting to reconnect...**",
              isReconnecting: true,
              showRetryButton: false,
              isRetryDisabled: false
            }
          : msg
      )
    );
    
    // Add a delay to show proper "trying to reconnect" UX
    // This gives users feedback that we're actually attempting to reconnect
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds loading
    // If a new prompt cancelled this retry in the meantime, stop here
    if (messageId != null && cancelledRetriesRef.current.has(messageId)) {
      return;
    }
    
    // First, check if connection is actually working
    const isConnected = await checkConnection();
    
    if (isConnected) {
      // Connection is working - proceed directly to API call
      try {
        // Clear the failed prompt before retry
        setLastFailedPrompt(null);
        
        // Check if this is a course creation request (pro mode) or regular chat
        const isProModeRequest = proMode;
        
        if (isProModeRequest) {
          // This is a course creation request - call the classification API directly
          const result = await classifyTopics(promptToRetry);
          
          // Capture personalization if provided
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
          
          if (extractedTopics && extractedTopics.length > 0) {
            // Handle rate limiting logic (same as in handleSendMessage)
            let availableTopics = extractedTopics;
            const maxPerRequest = 4;
            
            if (usageStats) {
              const remainingToday = (usageStats.daily_limit || 16) - (usageStats.daily_used || 0);
              const maxPerRequestFromStats = usageStats.per_request_limit || 4;
              const maxAllowedTopics = Math.min(remainingToday, maxPerRequestFromStats);
              
              if (extractedTopics.length > maxAllowedTopics) {
                availableTopics = extractedTopics.slice(0, maxAllowedTopics);
              }
            } else if (extractedTopics.length > maxPerRequest) {
              availableTopics = extractedTopics.slice(0, maxPerRequest);
            }
            
            if (availableTopics.length === 0) {
              // Replace network error with limit message
              setChatHistory((prev) => 
                prev.map(msg => 
                  msg.id === messageId 
                    ? {
                        ...msg,
                        content: "❌ You've reached your monthly topic creation limit. Please try again next month.",
                        isNetworkError: false,
                        isReconnecting: false,
                        showRetryButton: false
                      }
                    : msg
                )
              );
            } else {
              // Remove the network error message and show topic confirmation
              setChatHistory((prev) => prev.filter(msg => msg.id !== messageId));
              
              // Set up the topic confirmation dialog
              setPendingTopics(availableTopics);
              setOriginalPrompt(promptToRetry);
              setShowTopicConfirmation(true);
            }
          } else {
            // No topics extracted - replace with error message
            setChatHistory((prev) => 
              prev.map(msg => 
                msg.id === messageId 
                  ? {
                      ...msg,
                      content: "❌ I couldn't extract any learning topics from your query. Please try to be more specific about what you'd like to learn (e.g., 'JavaScript arrays and functions', 'Python data structures', etc.)",
                      isNetworkError: false,
                      isReconnecting: false,
                      showRetryButton: false
                    }
                  : msg
              )
            );
          }
        } else {
          // This is a regular chat request - call the backend AI chat proxy
          const response = await callChatBackend(promptToRetry);
          
          // Replace the network error message with the bot response
          setChatHistory((prev) => 
            prev.map(msg => 
              msg.id === messageId 
                ? {
                    ...msg,
                    content: response,
                    isNetworkError: false,
                    isReconnecting: false,
                    showRetryButton: false
                  }
                : msg
            )
          );
        }
        
        // Clean up retry state after successful request
        
      } catch (error) {
        // Even though connection check passed, the actual request failed
        
        // Handle different types of errors
        if (error.isRateLimit) {
          const rateLimitMessage = formatRateLimitMessage(error);
          setChatHistory((prev) => 
            prev.map(msg => 
              msg.id === messageId && msg.isNetworkError 
                ? {
                    ...msg,
                    content: `🚫 **Rate Limit Exceeded**\n\n${rateLimitMessage}\n\n**Current Limits:**\n- Max 4 topics per request\n- Max 15 topics per month\n\nPlease try again next month or contact support if you need higher limits.`,
                    isNetworkError: false,
                    isReconnecting: false,
                    showRetryButton: false,
                    isRateLimitError: true
                  }
                : msg
            )
          );
  } else {
          setChatHistory((prev) => 
            prev.map(msg => 
              msg.id === messageId && msg.isNetworkError 
                ? {
                    ...msg,
                    content: "🌐 **Request failed. Please try again.**\n\nThe connection is working but the request encountered an error. This might be a temporary issue.\n\nPlease try again in a moment.",
                    isReconnecting: false,
        // only show when not cancelled/disabled
        showRetryButton: cancelledRetriesRef.current.has(messageId) || msg.isRetryDisabled ? false : true
                  }
                : msg
            )
          );
          
          // Restore the failed prompt for another retry
          setLastFailedPrompt(promptToRetry);
        }
        
        // Clean up retry state after error handling
        
  setChatHistory((prev) => 
          prev.map(msg => 
            msg.id === messageId && msg.isNetworkError 
              ? {
                  ...msg,
                  content: "🌐 **Request failed. Please try again.**\n\nThe connection is working but the request encountered an error. This might be a temporary issue.\n\nPlease try again in a moment.",
                  isReconnecting: false,
      showRetryButton: cancelledRetriesRef.current.has(messageId) || msg.isRetryDisabled ? false : true
                }
              : msg
          )
        );
        
        // Restore the failed prompt for another retry
        setLastFailedPrompt(promptToRetry);
      }
    } else {
      // Connection is still not working
  setChatHistory((prev) => 
        prev.map(msg => 
          msg.id === messageId && msg.isNetworkError 
            ? {
                ...msg,
                content: "🌐 **Internet connection lost. Please check your internet connection and try again.**",
                isReconnecting: false,
        showRetryButton: cancelledRetriesRef.current.has(messageId) || msg.isRetryDisabled ? false : true
              }
            : msg
        )
      );
      
      // Restore the failed prompt for another retry
      setLastFailedPrompt(promptToRetry);
      
      // Restore the failed prompt for another retry
      setLastFailedPrompt(promptToRetry);
    }
    
    // Clean up retry state
    setRetryingMessageId(null);
  };

  // Send message; when options.forceProMode is true, treat as course creation regardless of current proMode transient state
  const handleSendMessage = async (customMessage = null, options = {}) => {
    const forcePro = options?.forceProMode === true;
    const messageToSend = customMessage || message;
    if (!messageToSend.trim() || isLoading) return;

    console.log('🔍 handleSendMessage called with:', { 
      messageToSend, 
      proMode, 
      usageStats,
      isAuthenticated: typeof isAuthenticated === 'function' ? isAuthenticated() : isAuthenticated
    });

    // Hide all retry buttons (but keep messages) when a new prompt is sent
    setChatHistory((prev) => 
      prev.map(msg => {
        if (msg.isNetworkError) {
          // mark this retry as cancelled and disable button permanently for this error instance
          cancelledRetriesRef.current.add(msg.id);
          // Clear timeout for this message if it exists
          if (networkErrorTimeouts.current[msg.id]) {
            clearTimeout(networkErrorTimeouts.current[msg.id]);
            delete networkErrorTimeouts.current[msg.id];
          }
          return { ...msg, showRetryButton: false, isRetryDisabled: true, isReconnecting: false };
        }
        return msg;
      })
    );

    // If topic confirmation is open and user sends a new message, automatically cancel it
    if (showTopicConfirmation && !customMessage) {
      // Add cancellation message to chat history
      const cancellationMessage = {
        id: generateMessageId(),
        type: "bot",
        content: "❌ **Course creation cancelled** - Processing your new request instead.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isCancellation: true,
      };
      
      setChatHistory((prev) => [...prev, cancellationMessage]);
      
      // Cancel the current topic confirmation
      setShowTopicConfirmation(false);
      setPendingTopics([]);
      setOriginalPrompt("");
    }

    // Cancel any ongoing reconnection attempts as well (redundant safety)
    setChatHistory((prev) => 
      prev.map(msg => {
        if (msg.isNetworkError && msg.isReconnecting) {
          cancelledRetriesRef.current.add(msg.id);
          if (networkErrorTimeouts.current[msg.id]) {
            clearTimeout(networkErrorTimeouts.current[msg.id]);
            delete networkErrorTimeouts.current[msg.id];
          }
          return {
            ...msg,
            content: "🌐 **Internet connection lost. Please check your internet connection and try again.**",
            isReconnecting: false,
            showRetryButton: false,
            isRetryDisabled: true
          };
        }
        return msg;
      })
    );

    // Clear any ongoing retry state
    setRetryingMessageId(null);

    const userMessageObj = {
      id: generateMessageId(),
      type: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMessageObj]);
    if (!customMessage) setMessage("");
    setIsLoading(true);

    try {
      if (forcePro || proMode) {
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
          console.log('🚀 Pro mode activated, calling classifyTopics with:', messageToSend);
          const result = await classifyTopics(messageToSend);
          console.log('✅ classifyTopics result:', result);
          
          // Log debug metadata for transparency
          if (result?.debug_meta) {
            console.info('🧭 Classification Debug Info:', result.debug_meta);
          }
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
                } else if (remainingToday < extractedTopics.length && extractedTopics.length <= maxPerRequestFromStats) {
                  limitMessage = `⚠️ I found ${extractedTopics.length} topics, but you only have ${remainingToday} topic(s) remaining today. Showing first ${availableTopics.length} topic(s).`;
                  // Show informational toast for daily quota limiting
                  toast(`📊 Limited to ${availableTopics.length} topics due to daily quota`, {
                    icon: '⚠️',
                    style: {
                      background: '#fff3cd',
                      color: '#856404',
                      border: '1px solid #ffeaa7'
                    },
                    duration: 4000
                  });
                } else if (extractedTopics.length > maxPerRequestFromStats && remainingToday >= maxPerRequestFromStats) {
                  limitMessage = `⚠️ I found ${extractedTopics.length} topics, but you can create maximum ${maxPerRequestFromStats} topics at a time. Showing first ${availableTopics.length} topic(s).`;
                  // Show informational toast for per-request limiting
                  toast(`🔢 Limited to ${maxPerRequestFromStats} topics per request`, {
                    icon: 'ℹ️',
                    style: {
                      background: '#d1ecf1',
                      color: '#0c5460',
                      border: '1px solid #bee5eb'
                    },
                    duration: 4000
                  });
                } else if (extractedTopics.length > maxPerRequestFromStats && remainingToday < maxPerRequestFromStats) {
                  limitMessage = `⚠️ I found ${extractedTopics.length} topics, but you can only create maximum ${maxPerRequestFromStats} topics at a time and have ${remainingToday} topic(s) remaining today. Showing first ${availableTopics.length} topic(s).`;
                  // Show informational toast for combined limiting
                  toast(`📊 Limited by daily quota (${remainingToday} left) and per-request limit (${maxPerRequestFromStats} max)`, {
                    icon: '⚠️',
                    style: {
                      background: '#fff3cd',
                      color: '#856404',
                      border: '1px solid #ffeaa7'
                    },
                    duration: 5000
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
                id: generateMessageId(),
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
            
            // No need for redundant analysis message - the topic confirmation dialog is self-explanatory
          } else {
            // No topics extracted - show error
            const errorResponse = {
              id: generateMessageId(),
              type: "bot",
              content: "❌ I couldn't extract any learning topics from your query. Please try to be more specific about what you'd like to learn (e.g., 'JavaScript arrays and functions', 'Python data structures', etc.)",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, errorResponse]);
          }
        } catch (error) {
          console.error('❌ Topic extraction failed:', error);
          console.error('Error details:', { 
            name: error.name, 
            message: error.message, 
            isRateLimit: error.isRateLimit,
            stack: error.stack 
          });
          
          // Handle network connection errors specifically (like ChatGPT)
          if (error.name === 'NetworkConnectionError') {
            // Store failed prompt for potential retry
            setLastFailedPrompt(messageToSend);
            setNetworkRetryCount(0);
            
            // Show initial loading message
            const networkLoadingResponse = {
              id: generateMessageId(),
              type: "bot",
              content: "🌐 **Network connection lost. Attempting to reconnect...**",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isNetworkError: true,
              isReconnecting: true,
            };
            setChatHistory((prev) => [...prev, networkLoadingResponse]);
            
            // Try to reconnect for 8 seconds, then show failure message
            const timeoutId = setTimeout(() => {
              // if this retry was cancelled or disabled, skip re-enabling the button
              if (cancelledRetriesRef.current.has(networkLoadingResponse.id)) {
                delete networkErrorTimeouts.current[networkLoadingResponse.id];
                return;
              }
              // Update the message to show connection failed
              setChatHistory((prev) => 
                prev.map(msg => 
                  msg.id === networkLoadingResponse.id 
                    ? {
                        ...msg,
                        content: "🌐 **Internet connection lost. Please check your internet connection and try again.**",
                        isReconnecting: false,
                        // only show button when not disabled explicitly
                        showRetryButton: msg.isRetryDisabled ? false : true
                      }
                    : msg
                )
              );
              // Remove the timeout ID from the ref after it's executed
              delete networkErrorTimeouts.current[networkLoadingResponse.id];
            }, 8000); // 8 seconds timeout
            
            // Store the timeout ID in the ref
            networkErrorTimeouts.current[networkLoadingResponse.id] = timeoutId;
            setIsLoading(false);
            return;
          } else if (error.isRateLimit) {
            const rateLimitMessage = formatRateLimitMessage(error);
            const rateLimitResponse = {
              id: generateMessageId(),
              type: "bot",
              content: `🚫 **Rate Limit Exceeded**\n\n${rateLimitMessage}\n\n**Current Limits:**\n- Max 4 topics per request\n- Max 15 topics per month\n\nPlease try again next month or contact support if you need higher limits.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isRateLimitError: true,
            };
            setChatHistory((prev) => [...prev, rateLimitResponse]);
            
            // Show toast notification
            toast.error('Monthly topic creation limit reached', {
              duration: 5000,
              position: 'top-center',
            });
            setIsLoading(false);
            return;
          } else {
            // Generic error handling
            const errorResponse = {
              id: generateMessageId(),
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
        // Regular chatbot response using backend AI chat proxy

        if (!isAuthenticated()) {
          setShowAuthModal(true);
          const authPrompt = {
            id: generateMessageId(),
            type: 'bot',
            content: 'Please sign in to chat with the AI assistant.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setChatHistory((prev) => [...prev, authPrompt]);
          setIsLoading(false);
          return;
        }

        // If the device is offline, use the network-lost UX instead of calling the local API
        if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
          setLastFailedPrompt(messageToSend);
          setNetworkRetryCount(0);

          const networkLoadingResponse = {
            id: generateMessageId(),
            type: "bot",
            content: "🌐 **Network connection lost. Attempting to reconnect...**",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isNetworkError: true,
            isReconnecting: true,
          };
          setChatHistory((prev) => [...prev, networkLoadingResponse]);

          const timeoutId = setTimeout(() => {
            if (cancelledRetriesRef.current.has(networkLoadingResponse.id)) {
              delete networkErrorTimeouts.current[networkLoadingResponse.id];
              return;
            }
            setChatHistory((prev) => 
              prev.map(msg => 
                msg.id === networkLoadingResponse.id 
                  ? {
                      ...msg,
                      content: "🌐 **Internet connection lost. Please check your internet connection and try again.**",
                      isReconnecting: false,
                      showRetryButton: msg.isRetryDisabled ? false : true
                    }
                  : msg
              )
            );
            delete networkErrorTimeouts.current[networkLoadingResponse.id];
          }, 8000);
          networkErrorTimeouts.current[networkLoadingResponse.id] = timeoutId;
          // Avoid global loading spinner during retry UX
          setIsLoading(false);
          return;
        }

        try {
          const response = await callChatBackend(messageToSend);
          
          const botResponse = {
            id: generateMessageId(),
            type: "bot",
            content: typeof response === 'string' ? response : String(response),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          setChatHistory((prev) => {
            const newHistory = [...prev, botResponse];
            return newHistory;
          });
        } catch (error) {
          // Handle network failures with the same UX as course creation mode
          if (error.name === 'NetworkConnectionError') {
            setLastFailedPrompt(messageToSend);
            setNetworkRetryCount(0);

            const networkLoadingResponse = {
              id: generateMessageId(),
              type: "bot",
              content: "🌐 **Network connection lost. Attempting to reconnect...**",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isNetworkError: true,
              isReconnecting: true,
            };
            setChatHistory((prev) => [...prev, networkLoadingResponse]);

            const timeoutId = setTimeout(() => {
              if (cancelledRetriesRef.current.has(networkLoadingResponse.id)) {
                delete networkErrorTimeouts.current[networkLoadingResponse.id];
                return;
              }
              setChatHistory((prev) => 
                prev.map(msg => 
                  msg.id === networkLoadingResponse.id 
                    ? {
                        ...msg,
                        content: "🌐 **Internet connection lost. Please check your internet connection and try again.**",
                        isReconnecting: false,
                        showRetryButton: msg.isRetryDisabled ? false : true
                      }
                    : msg
                )
              );
              delete networkErrorTimeouts.current[networkLoadingResponse.id];
            }, 8000);
            networkErrorTimeouts.current[networkLoadingResponse.id] = timeoutId;
          } else {
            // Non-network error: show a generic failure message (let outer finally clear loading)
            const errorResponse = {
              id: generateMessageId(),
              type: "bot",
              content: `Sorry, I couldn't process your request. ${error.message || ''}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, errorResponse]);
          }
        }
      }
    } catch (error) {
      console.error("Error in chat:", error);
      const errorResponse = {
        id: generateMessageId(),
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

  // Sanitize topic names for backend validation and strip any inline per-topic context/newlines
  const sanitizeTopicName = (name) => {
    if (!name) return '';
    // If AI or UI appended inline context on a new line, keep only the first line as the topic name
    let base = String(name).split('\n')[0];
    // Normalize whitespace and lightly sanitize client-side input.
    // Keep common punctuation (commas, colons, slashes, apostrophes) now allowed by backend.
    const cleaned = base
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  };

  const handleTopicConfirm = async () => {
    // Prevent duplicate submissions from double-clicks or spamming the button
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
      // First show an AI thinking message
      const thinkingResponse = {
        id: generateMessageId(),
        type: "bot",
        content: "🤔 Let me analyze your learning context to create a personalized course plan...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory(prev => [...prev, thinkingResponse]);

      // Extract context from original prompt
      const learningContext = extractLearningContext(originalPrompt);
      
      // Call the new backend endpoint with context
      const token = (
        localStorage.getItem('accessToken') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token')
      );
      const { data: result } = await aiAxios.post('/create-course-topics/', {
        topics: pendingTopics.map(t => ({
          // Only send id/isActive/name; do not send any per-topic context to backend
          id: t.id,
          isActive: t.isActive !== false,
          name: sanitizeTopicName(t.name) || String(t.name || '').trim()
        })),
        learningContext,
        originalPrompt
      });

      if (result?.status === 429) {
        // Some backends may return 200 with a JSON status field; handle gracefully
        const botResponse = {
          id: generateMessageId(),
          type: "bot",
          content: `🚫 ${result.message}`,
          timestamp: new Date().toLocaleTimeString(),
          isRateLimit: true
        };
        setChatHistory(prev => [...prev, botResponse]);
        if (result.usage_stats) setUsageStats(result.usage_stats);
        // Keep the confirmation dialog open and preserve topics so the user can adjust
        return;
      }

      if (!result?.success) {
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
      // Confirmed topic names: topicNames
      // Generated course ID: courseId
      // Topic string for URL: topicString
    
      const proResponse = {
        id: generateMessageId(),
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
      // Handle HTTP 429 from axios (error.response present)
      const status = error?.response?.status;
      const data = error?.response?.data || {};
      if (status === 429) {
        const msg = data?.message || 'You have hit the rate limit. Please try again later or reduce the number of requests.';
        const botResponse = {
          id: generateMessageId(),
          type: "bot",
          content: `🚫 ${msg}`,
          timestamp: new Date().toLocaleTimeString(),
          isRateLimit: true
        };
        setChatHistory(prev => [...prev, botResponse]);
        if (data?.usage_stats) setUsageStats(data.usage_stats);
        // Do NOT clear topics; allow user to adjust and retry
        // Keep the confirmation dialog open
        setShowTopicConfirmation(true);
        return;
      }

      const errorResponse = {
        id: generateMessageId(),
        type: "bot",
        content: `❌ Failed to create course: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory(prev => [...prev, errorResponse]);
      // Keep topics so user can retry; close dialog only if needed
      setShowTopicConfirmation(true);
    } finally {
      creatingCourseRef.current = false;
      setIsCreatingCourse(false);
    }
  };

  const handleTopicCancel = () => {
    const cancelResponse = {
      id: generateMessageId(),
      type: "bot",
      content: "❌ Course creation cancelled. Feel free to ask me anything else or try again with a different query!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    setChatHistory((prev) => [...prev, cancelResponse]);
    setShowTopicConfirmation(false);
    setPendingTopics([]);
    setOriginalPrompt("");
  };

  const MessageBubble = ({ message, retryLastRequest, setLastFailedPrompt }) => {
    // Use a safe text fallback for legacy messages that may have `message` instead of `content`
    const contentText =
      typeof message?.content === 'string'
        ? message.content
        : typeof message?.message === 'string'
          ? message.message
          : '';
    // More specific detection for course content - look for multiple sections with specific course structure
    const isCourseContent = (
      contentText.includes("# ") && 
      contentText.includes("## ") && 
      (contentText.includes("### Reading Materials") || 
       contentText.includes("### Summary") || 
       contentText.includes("### Videos") ||
       contentText.includes("### Quiz") ||
       contentText.includes("### Resources"))
    );
    const sections = isCourseContent ? parseMarkdownResponse(contentText) : [];
    const isLearningPlan = message.isLearningPlan || (contentText.includes("Learning Plan") && contentText.includes("Day "));
    const isProCard = message.isProCard || false;

    return (
      <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 mb-4 lg:mb-6">
        <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`${
            message.type === "user" 
              ? "max-w-[75%] lg:max-w-[65%]" // User messages - more constrained width
              : isLearningPlan || isProCard 
                ? "w-full" 
                : "max-w-[90%] lg:max-w-[85%] min-w-0" // Bot messages - content-dependent width
          }`}>
            <div
              className={`rounded-2xl px-4 py-3 lg:px-5 lg:py-4 w-fit ${
                message.type === "user"
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg backdrop-blur-sm rounded-br-md"
                  : isLearningPlan || isProCard
                    ? "bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl" 
                    : "bg-white/70 backdrop-blur-md text-gray-800 border border-white/30 shadow-sm rounded-bl-md hover:bg-white/80 transition-all duration-200"
              }`}
            >
              {message.type === "bot" && !isCourseContent && !isLearningPlan && !isProCard && (
                <div className="prose prose-sm lg:prose max-w-none dark:prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-gray-900 prose-headings:text-gray-900">
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
                                toast.success('Code copied to clipboard!', { duration: 2000 });
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
                        return <h1 className="text-2xl font-bold text-gray-900 mb-3 mt-6 border-b border-gray-200 pb-2">{children}</h1>;
                      },
                      h2({children}) {
                        return <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">{children}</h2>;
                      },
                      h3({children}) {
                        return <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{children}</h3>;
                      },
                      h4({children}) {
                        return <h4 className="text-base font-semibold text-gray-900 mb-2 mt-3">{children}</h4>;
                      },
                      // Enhanced paragraph styling
                      p({children}) {
                        return <p className="text-gray-800 leading-relaxed mb-3 text-sm lg:text-base">{children}</p>;
                      },
                      // Enhanced blockquote styling
                      blockquote({children}) {
                        return (
                          <blockquote className="border-l-4 border-blue-400 pl-4 py-3 bg-blue-50 text-gray-700 italic my-4 rounded-r-lg">
                            {children}
                          </blockquote>
                        );
                      },
                      // Enhanced table styling
                      table({children}) {
                        return (
                          <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                            <table className="min-w-full">{children}</table>
                          </div>
                        );
                      },
                      thead({children}) {
                        return <thead className="bg-gray-50">{children}</thead>;
                      },
                      th({children}) {
                        return <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-900 text-sm">{children}</th>;
                      },
                      td({children}) {
                        return <td className="border-b border-gray-100 px-4 py-3 text-gray-800 text-sm">{children}</td>;
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
                    {typeof contentText === 'string' ? contentText : JSON.stringify(contentText)}
                  </ReactMarkdown>
                </div>
              )}

              {message.type === "bot" && isCourseContent && !isLearningPlan && !isProCard && (
                <div className="mt-2">
                  {sections.map((section, index) => (
                    <CourseSection
                      key={index}
                      section={section.title}
                      subsections={section.subsections}
                    />
                  ))}
                </div>
              )}

              {message.type === "bot" && isLearningPlan && (
                <div className="w-full">
                  <LearningPlanDisplay content={message.content} learningPlanId={message.learningPlanId} />
                </div>
              )}

              {message.type === "bot" && isProCard && (
                <div className="w-full">
                  <div className="bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm border border-purple-200/50 rounded-xl p-4 mb-2">
                    <div className="text-sm text-gray-700 mb-4">{message.content}</div>
                    <Link 
                      to={`/pro-learning/${message.courseId}?topic=${encodeURIComponent(message.topic)}&tab=reading`}
                      className="block w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 backdrop-blur-sm"
                      onClick={() => {
                        // Store the topics and course data for batch generation
                        try {
                          const batchGenerationData = {
                            courseId: message.courseId,
                            topics: message.extractedTopics || [],
                            topicString: message.topic,
                            triggerBatchGeneration: true,
                            timestamp: Date.now()
                          };
                          
                          try {
                            // Store batch payload only in localStorage (IDB removed)
                            try { localStorage.removeItem('proLearning_batchGeneration'); } catch {}
                            localStorage.setItem('proLearning_batchGeneration', JSON.stringify(batchGenerationData));
                            localStorage.setItem('proLearning_batchMarker', String(batchGenerationData.timestamp));
                          } catch (_) {}
                          // Pro Learning Experience button clicked - batch generation data stored
                          
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
                          <h3 className="text-lg font-bold mb-1">🚀 Pro Learning Experience</h3>
                          <p className="text-purple-100 text-sm">Complete study materials for: {message.topic}</p>
                          <div className="flex items-center mt-2 text-xs text-purple-200">
                            <span className="mr-4">📘 Reading</span>
                            <span className="mr-4">🧠 Summary</span>
                            <span className="mr-4">🎥 Videos</span>
                            <span className="mr-4">✅ Quiz</span>
                            <span>📚 Resources</span>
                          </div>
                        </div>
                        <div className="bg-white/20 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {message.type === "user" && <div className="text-sm lg:text-base">{message.content}</div>}

              {/* Loading spinner for reconnection attempts */}
              {message.isReconnecting && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600">Trying to reconnect...</span>
                </div>
              )}

              {/* Retry button for network errors (only after reconnection timeout) */}
              {message.isNetworkError && message.showRetryButton && !message.isReconnecting && !message.isRetryDisabled && !cancelledRetriesRef.current.has(message.id) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      console.log('🔄 Retry button clicked for message ID:', message.id);
                      retryLastRequest(message.id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Connection
                  </button>
                </div>
              )}

              <div className={`text-[10px] lg:text-xs mt-2 ${
                message.type === "user" 
                  ? "text-blue-100/80" 
                  : isLearningPlan || isProCard
                    ? "text-gray-400 pl-2" 
                    : "text-gray-500"
              }`}>
                {message.timestamp}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fetch usage stats for rate limiting display (returns stats)
  const fetchUsageStats = async () => {
    try {
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
      console.error('Failed to fetch usage stats:', error);
      // Set fallback to prevent infinite "Loading stats..."
      const fallback = { daily_used: 0, daily_limit: 16, per_request_limit: 4 };
      setUsageStats(fallback);
      return fallback;
    }
  };

  // Handle Create Course button with authentication check
  const handleCreateCourse = async () => {
    // Toggle off if already enabled
    if (proMode) {
      setProMode(false);
      return;
    }

    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }

    // Gate enabling by daily limit
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
    <div className="h-screen flex overflow-hidden w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-300/20 to-indigo-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-xl animate-float-delayed"></div>
        <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-gradient-to-br from-indigo-300/20 to-purple-400/20 rounded-full blur-xl animate-float"></div>
      </div>
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 lg:relative lg:flex-shrink-0 ${
        isSidebarOpen ? "w-full lg:w-80" : "w-0"
      } transition-all duration-300 bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-lg flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 mr-3">
              <IoBookmark size={16} />
            </div>
            ProLearning History
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-all duration-200"
            aria-label="Close sidebar"
          >
            <IoChevronBack size={20} />
          </button>
        </div>
        
        {/* ProLearning Courses Section (from backend DB) */}
        <div className="p-4">
          <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4 mb-4">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
                <IoSchoolOutline size={18} />
              </div>
              <h3 className="font-semibold text-gray-800">
                ProLearning Courses
              </h3>
            </div>
            {isLoadingCourses ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-4 bg-blue-100/60 rounded w-3/4 animate-pulse"></div>
                ))}
              </div>
            ) : proLearningCourses && proLearningCourses.length > 0 ? (
              <div className="text-sm text-gray-600 mb-1">
                <span>Your saved courses from the Learning Hub.</span>
              </div>
            ) : (
              <div className="text-sm text-gray-600 mb-1">
                <span>No saved courses found. Create and save a course to see it here.</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoadingCourses ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 w-full">
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <div className="w-5 h-5 bg-indigo-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                          <span className="mx-1.5 text-gray-300">•</span>
                          <div className="h-3 bg-gray-100 rounded w-16 animate-pulse"></div>
                          <div className="h-4 bg-green-100 rounded w-12 ml-2 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : proLearningCourses && proLearningCourses.length > 0 ? (
            <div className="space-y-3">
              {proLearningCourses
                // sort newest first if created_at exists
                .slice() // shallow copy before sort
                .sort((a, b) => {
                  const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return db - da;
                })
                .map((course) => {
                const firstTopic = Array.isArray(course.topics) && course.topics.length > 0 ? course.topics[0] : null;
                const topicParam = firstTopic ? `?topic=${encodeURIComponent(firstTopic.topic_name || firstTopic.name || '')}&tab=reading` : '';
                const href = `/pro-learning/${course.id}${topicParam}`;
                // Compute friendly display name:
                // 1) If title is present and not generic/ID-like, use it
                // 2) Else build from topics: FirstTopic +1 +2 +3 (+...) style
                // 3) Never show raw course_name when it looks like an internal ID (course_...)
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
                  // Fall back to non-ID course_name if it's human friendly
                  friendlyName = course.course_name.trim();
                }
                return (
                  <a
                    key={course.id}
                    href={href}
                    className="block p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 rounded-lg p-2">
                          <IoBook className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-800 group-hover:text-blue-600">
                            {friendlyName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <span>{new Date(course.created_at).toLocaleDateString()}</span>
                            <span className="mx-1.5">•</span>
                            <span>{new Date(course.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-md">Saved</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <IoChevronForward size={18} className="group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>

      {/* Main chat container */}
      <div className="flex-1 flex flex-col h-screen w-full relative">
        {/* Custom Chat Navbar */}
        <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="mr-3 lg:mr-4 p-2 -ml-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors backdrop-blur-sm"
                aria-label="Open sidebar"
              >
                <IoMenu size={22} />
              </button>
            )}
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white mr-3">
                <FaRobot className="w-5 h-5" />
              </div>
              <h2 className="text-lg lg:text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Learning Assistant</h2>
            </div>
          </div>
          <div className="flex items-center mr-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-indigo-600 hover:bg-white/50 hover:scale-105 transition-all duration-200 backdrop-blur-sm"
              aria-label="Go to home"
            >
              <IoHome size={20} />
              <span className="font-medium">Home</span>
            </Link>
          </div>
        </nav>

        {/* Chat messages */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className={`flex-1 overflow-y-auto scrollbar-glass ${
            isMobile && isInputFocused ? 'pb-32' : 'pb-4'
          }`}>
            <div className="min-h-full py-4">
              {/* Welcome Message Popup for First-time Users */}
              {showWelcomeMessage && (
                <>
                  {/* Background Blur Overlay */}
                  <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
                  
                  {/* Top Positioned Welcome Message */}
                  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg mx-4">
                    <div className="bg-white/95 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-2xl animate-slide-down">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                            <IoSchoolOutline className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Welcome!</h3>
                        </div>
                        <button
                          onClick={() => setShowWelcomeMessage(false)}
                          className="text-gray-600 hover:text-gray-800 transition-all duration-200 p-2 hover:bg-gray-100 rounded-full hover:scale-110 cursor-pointer"
                          aria-label="Close welcome message"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <p className="text-gray-800 text-base leading-relaxed font-medium">
                        Use our powerful tool to seamlessly create customized courses on any topic of your choice — just click the 'Create Course' button to begin.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {chatHistory.map((chat) => (
                <MessageBubble 
                  key={chat.id} 
                  message={chat} 
                  retryLastRequest={retryLastRequest}
                  setLastFailedPrompt={setLastFailedPrompt}
                />
              ))}

              {isLoading && (
                <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 mb-4 lg:mb-6">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] lg:max-w-[75%]">
                      <div className="bg-white/90 backdrop-blur-sm text-gray-800 border border-white/30 shadow-lg rounded-2xl rounded-bl-md px-4 py-3 lg:px-5 lg:py-4">
                        <div className="flex items-center">
                          <div className="relative mr-3">
                            <BiLoaderAlt className="animate-spin text-indigo-500 w-5 h-5" />
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-sm opacity-30 animate-pulse"></div>
                          </div>
                          <span className="text-gray-700">Thinking...</span>
                          <div className="ml-2 flex space-x-1">
                            <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic Confirmation Dialog */}
              {showTopicConfirmation && (
                <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 mb-4 lg:mb-6">
                  <div className="flex justify-start">
                    <div className="max-w-[90%] lg:max-w-[80%]">
                      <div className="bg-gradient-to-br from-blue-50/90 to-purple-50/90 backdrop-blur-md border-2 border-blue-200/50 rounded-2xl rounded-bl-md p-4 shadow-xl">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Confirm Course Topics</h3>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          I found <strong>{pendingTopics.length}</strong> topic(s) from your query: "<em>{originalPrompt}</em>". 
                          You can edit, delete, or add topics before creating your course. <strong>Maximum 4 topics per course.</strong>
                        </p>
                        {personalization && (
                          <div className="mb-4">
                            <span className="inline-block text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-1">
                              Personalization: {personalization}
                            </span>
                          </div>
                        )}
                        
                        <div className="space-y-2 mb-4">
                          {pendingTopics.map((topic, index) => (
                            <div key={`pending-topic-${topic.id || `${index}-${topic.name}`}`} className="space-y-1">
                              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                                <span className="text-indigo-500 mr-2 font-bold">{index + 1}.</span>
                                <div className="flex-1 flex flex-col">
                                  <input
                                    type="text"
                                    value={topic.name}
                                    onChange={(e) => handleTopicEdit(index, e.target.value)}
                                    className="w-full px-2 py-1 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                  />
                                  {/* Per-topic context intentionally not displayed */}
                                </div>
                                <button
                                  onClick={() => handleTopicDelete(index)}
                                  className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors backdrop-blur-sm"
                                  title="Delete topic"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <button
                          onClick={handleTopicAdd}
                          disabled={pendingTopics.length >= 4}
                          className={`w-full mb-4 p-2 border-2 border-dashed rounded-lg transition-colors text-sm ${
                            pendingTopics.length >= 4 
                              ? 'border-gray-300/50 text-gray-400 bg-gray-50/50 cursor-not-allowed'
                              : 'border-indigo-300/50 text-indigo-600 hover:bg-indigo-50/50 backdrop-blur-sm'
                          }`}
                        >
                          {pendingTopics.length >= 4 
                            ? `Maximum 4 topics reached` 
                            : `+ Add New Topic (${pendingTopics.length}/4)`
                          }
                        </button>


                        <div className="flex gap-2">
                          <button
                            onClick={handleTopicConfirm}
                            disabled={pendingTopics.length === 0 || isCreatingCourse}
                            className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm ${
                              pendingTopics.length === 0 || isCreatingCourse
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                            }`}
                          >
                            {isCreatingCourse ? 'Creating...' : `✓ Create Course (${pendingTopics.length} topic${pendingTopics.length !== 1 ? 's' : ''})`}
                          </button>
                          <button
                            onClick={handleTopicCancel}
                            className="flex-1 bg-gray-500/80 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-gray-600/80 transition-colors text-sm font-medium"
                          >
                            ✗ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Section */}
          <div className="p-3 lg:p-6 bg-white/80 backdrop-blur-md border-t border-white/20 shadow-lg">
            <div className="w-full max-w-5xl mx-auto px-6 lg:px-8">
              {/* Create Course Button */}
              <div className="mb-4">
                <div className="flex items-center gap-4">
                  {/* Button Section */}
                  <button 
                    onClick={handleCreateCourse}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      proMode 
                        ? 'bg-indigo-50/80 text-indigo-600 border-2 border-indigo-300/50' 
                        : 'bg-white/80 text-gray-700 border-2 border-gray-200/50 hover:bg-gray-50/80 hover:text-gray-800 hover:border-gray-300/50'
                    }`}
                  >
                    {proMode ? (
                      <>
                        <IoCheckmarkCircle size={18} />
                        Course Creation Mode
                      </>
                    ) : (
                      <>
                        <IoSchoolOutline size={18} />
                        Create Course
                      </>
                    )}
                  </button>
                  
                  {/* Compact Rate Limit Status beside the button */}
                  {proMode && usageStats && (
                    <CompactRateLimitStatus 
                      usageStats={usageStats} 
                      className="shrink-0"
                    />
                  )}
                  {proMode && !usageStats && (
                    <div className="text-xs text-gray-500">Loading stats...</div>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder={proMode ? coursePlaceholder : "Type your message here..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  onFocus={() => {
                    setIsInputFocused(true);
                    // On mobile, scroll to make room for suggestions
                    if (isMobile) {
                      setTimeout(() => {
                        window.scrollTo({
                          top: document.body.scrollHeight,
                          behavior: 'smooth'
                        });
                      }, 100);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full pl-5 pr-14 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-800 placeholder-gray-500 shadow-lg transition-all duration-200 hover:shadow-xl"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || isLoading}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                    message.trim() && !isLoading 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105" 
                      : proMode && !isLoading
                        ? "bg-gradient-to-r from-indigo-400 to-purple-500 text-white/80 cursor-not-allowed opacity-75"
                        : "bg-gray-200/50 text-gray-400"
                  }`}
                >
                  <IoSend size={18} />
                </button>
              </div>
              
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

export default ChatbotPage;