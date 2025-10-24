import universalToast from "../../utils/universalToast";
import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack, IoPlayCircle, IoSchoolOutline, IoCheckmarkCircle, IoTimeOutline, IoBook, IoBookmark, IoInformationCircle, IoChevronForward, IoRocket } from "react-icons/io5";
import { FaGraduationCap, FaBook as FaBookAlt, FaRegUser } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from '../../context/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { classifyTopics, formatRateLimitMessage } from "../ProLearning/topicclassifier";
import RateLimitStatus from './RateLimitStatus';
import CompactRateLimitStatus from './CompactRateLimitStatus';
import proLearningHistoryService from '../../services/ProLearningHistoryService';
// Removed IndexedDBService usage for Pro Learning flows

// Use relative API paths; dev proxy routes to backend
import apiAxios from '../../utils/axios';
import aiAxios from '../../utils/axiosAi';

// Extract learning context from user's prompt - Used for Pro Learning personalization
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
  
  /* Rotating wheel animation for suggestions */
  @keyframes slide-up-out {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
  @keyframes slide-up-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up-out {
    animation: slide-up-out 300ms ease-in forwards;
  }
  .animate-slide-up-in {
    animation: slide-up-in 300ms ease-out forwards;
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
  const location = useLocation();
  const { user, isAuthenticated, isLoggedIn } = useAuth();
  const initialQuery = searchParams.get("q");

  const [message, setMessage] = useState("");
  const [proMode] = useState(true); // Always in Pro Learning mode
  const [coursePlaceholder, setCoursePlaceholder] = useState("Create arrays and strings course...");
  const [showTopicConfirmation, setShowTopicConfirmation] = useState(false);
  const [pendingTopics, setPendingTopics] = useState([]);
  // Guard against multiple rapid clicks on "Create Course" in the confirmation dialog
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const creatingCourseRef = useRef(false);
  const [personalization, setPersonalization] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
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

  const generateMessageId = () => Date.now() + Math.random();
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const initialQueryProcessed = useRef(false);
  const autoSendProcessed = useRef(false); // Additional flag to prevent duplicate auto-sends
  const { width } = useWindowSize();
  const online = useOnlineStatus();
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
  // Rotating suggestions for empty-state heading
  const rotatingSuggestions = [
    "Help me get started with algebra basics",
    "Explain how the human digestive system works",
    "Break down Newton’s laws of motion for me",
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

  useEffect(() => {
    const interval = setInterval(() => {
      // Start exit animation
      setIsAnimatingOut(true);
      
      // After exit animation completes, change text and start enter animation
      setTimeout(() => {
        setSuggestionIndex((prev) => (prev + 1) % rotatingSuggestions.length);
        setSuggestionKey((k) => k + 1);
        setIsAnimatingOut(false);
      }, 300); // Match the slide-up-out duration
  }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

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
          const remainingToday = stats ? (stats.monthly_limit || 15) - (stats.monthly_used || 0) : null;
          if (remainingToday !== null && remainingToday <= 0) {
            universalToast.error('Sorry, your daily limit is over. Please try again tomorrow.');
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
        // Clear the input field after sending
        setTimeout(() => {
          setMessage('');
        }, 100);
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
        // Clear the input field after sending
        setTimeout(() => {
          setMessage('');
        }, 100);
      }, 100);
      navigate("/chat", { replace: true });
    }
  }, [initialQuery, navigate, searchParams]);

  // Handle initial message from onboarding modal (location state)
  useEffect(() => {
    if (location.state?.initialMessage && !autoSendProcessed.current) {
      const { initialMessage, forceProMode } = location.state;
      
      // Mark as processed immediately to prevent double execution
      autoSendProcessed.current = true;
      initialQueryProcessed.current = true;
      
      // Clear the location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
      
      // Set the message in the input
      setMessage(initialMessage);
      
      // Small delay to ensure UI is ready, then send
      setTimeout(() => {
        handleSendMessage(initialMessage, { forceProMode: forceProMode || true });
        // Clear the input field after sending
        setTimeout(() => {
          setMessage('');
        }, 100);
      }, 300);
    }
  }, [location.state?.initialMessage]);

  // Timeout fallback to prevent infinite "Loading stats..." when pro mode is enabled
  useEffect(() => {
    if (proMode && !usageStats) {
      const timeoutId = setTimeout(() => {
        if (!usageStats) {
          console.warn('Stats loading timeout, setting fallback');
          setUsageStats({ monthly_used: 0, monthly_limit: 15, per_request_limit: 4 });
        }
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [proMode, usageStats]);

  // Fetch usage stats on mount so desktop shows correct monthly stats immediately
  useEffect(() => {
    (async () => {
      try {
        await fetchUsageStats();
      } catch (e) {
        // handled inside fetchUsageStats with fallback
      }
    })();
  }, []);

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
        
        // Pro Learning Mode - Always retry with course creation
        // Call the classification API directly
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
            // No topics extracted - show model-provided friendly message if available
            setChatHistory((prev) => 
              prev.map(msg => 
                msg.id === messageId 
                  ? {
                      ...msg,
                      content: (result && typeof result.user_message === 'string')
                        ? result.user_message
                        : "❌ I couldn't extract any learning topics from your query. Please try to be more specific about what you'd like to learn (e.g., 'JavaScript arrays and functions', 'Python data structures', etc.)",
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

    // Block send while offline and inform the user
    if (!online) {
      try { universalToast('You are offline. Please check your internet connection and try again.', 'info'); } catch (_) {}
      return;
    }

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

    // If not authenticated, show a friendly sign-in prompt and stop
    try {
      const authed = typeof isAuthenticated === 'function' ? isAuthenticated() : !!isAuthenticated;
      if (!authed) {
        const returnTo = window.location.pathname + window.location.search;
        const signInUrl = `/auth?mode=login&returnTo=${encodeURIComponent(returnTo)}`;
        const signUpUrl = `/auth?mode=signup&returnTo=${encodeURIComponent(returnTo)}`;
        const authPrompt = {
          id: generateMessageId(),
          type: "bot",
          isAuthPrompt: true,
          signInUrl,
          signUpUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatHistory((prev) => [...prev, authPrompt]);
        return;
      }
    } catch (_) {}

    // Do not block based on local heuristics; let AI validate if this is a study topic.
    // We'll call the classifier first and only show guidance if AI couldn't extract any topics.

    setIsLoading(true);

    try {
      // Pro Learning Mode - Always Active
      // Check monthly quota before processing
      if (usageStats) {
        const remainingToday = (usageStats.monthly_limit || 15) - (usageStats.monthly_used || 0);
        if (remainingToday <= 0) {
          universalToast.error("🚫 Monthly limit reached! You've used all your topic creation quota for this month. Please try again next month.", {
            duration: 5000
          });
          setIsLoading(false);
          return;
        }
      }

      // Extract topics using AI with rate limiting
      try {
        console.log('🚀 Pro Learning mode - calling classifyTopics with:', messageToSend);
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
          
          const extractedTopics = Array.isArray(result.topics) ? result.topics : [];

          // If backend explicitly indicates not a study topic, show its friendly message and stop
          if (result && typeof result.user_message === 'string' && extractedTopics.length === 0) {
            const msg = {
              id: generateMessageId(),
              type: "bot",
              content: result.user_message,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, msg]);
            setIsLoading(false);
            return;
          }

          // If AI couldn't extract topics (or produced only unknowns), guide the user
          if (isAiFailedTopics(extractedTopics)) {
            const botResponse = {
              id: generateMessageId(),
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
                duration: 4000
              }
            );
          }
          
          if (extractedTopics && extractedTopics.length > 0) {
            // Check current rate limit status to determine how many topics user can actually create
            let availableTopics = extractedTopics;
            let limitMessage = "";
            
            if (usageStats) {
              const remainingToday = (usageStats.monthly_limit || 15) - (usageStats.monthly_used || 0);
              const maxPerRequestFromStats = usageStats.per_request_limit || 4;
              
              // Limit topics to the smaller of: remaining monthly limit or max per request
              const maxAllowedTopics = Math.min(remainingToday, maxPerRequestFromStats);
              
              if (availableTopics.length > maxAllowedTopics) {
                // Limit the topics to what user can actually create
                availableTopics = availableTopics.slice(0, maxAllowedTopics);
                
                if (remainingToday <= 0) {
                  limitMessage = `⚠️ You've reached your daily limit of ${usageStats.daily_limit || 16} topics. Please try again tomorrow.`;
                  // Show toast for daily limit reached
                  universalToast.error(`🚫 Daily limit reached (${usageStats.daily_used || 0}/${usageStats.daily_limit || 16} used)`, {
                    duration: 4000
                  });
                } else if (remainingToday < availableTopics.length && availableTopics.length <= maxPerRequestFromStats) {
                  limitMessage = `⚠️ I found ${extractedTopics.length} topics, but you only have ${remainingToday} topic(s) remaining today. Showing first ${availableTopics.length} topic(s).`;
                  // Show informational toast for daily quota limiting
                  universalToast.show(`⚠️ Limited to ${availableTopics.length} topics due to daily quota`, {
                    duration: 4000
                  });
                } else if (availableTopics.length > maxPerRequestFromStats && remainingToday >= maxPerRequestFromStats) {
                  limitMessage = `⚠️ I found ${extractedTopics.length} topics, but you can create maximum ${maxPerRequestFromStats} topics at a time. Showing first ${availableTopics.length} topic(s).`;
                  // Show informational toast for per-request limiting
                  universalToast.show(`ℹ️ Limited to ${maxPerRequestFromStats} topics per request`, {
                    duration: 4000
                  });
                } else if (availableTopics.length > maxPerRequestFromStats && remainingToday < maxPerRequestFromStats) {
                  limitMessage = `⚠️ I found ${extractedTopics.length} topics, but you can only create maximum ${maxPerRequestFromStats} topics at a time and have ${remainingToday} topic(s) remaining today. Showing first ${availableTopics.length} topic(s).`;
                  // Show informational toast for combined limiting
                  universalToast.show(`⚠️ Limited by daily quota (${remainingToday} left) and per-request limit (${maxPerRequestFromStats} max)`, {
                    duration: 5000
                  });
                }
              }
            } else {
              // If no usage stats, just limit to 4 topics max
              if (availableTopics.length > maxPerRequest) {
                availableTopics = availableTopics.slice(0, maxPerRequest);
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
                id: generateMessageId(),
                type: "bot",
                content: limitMessage || "❌ You've reached your monthly topic creation limit. Please try again next month.",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              };
              setChatHistory((prev) => [...prev, limitResponse]);
              setIsLoading(false);
              return;
            }
            
            // Store limited topics for confirmation and show confirmation dialog (normalize to { name })
            const normalizedTopics = availableTopics.map(t => {
              if (typeof t === 'string') return { name: t };
              if (t && typeof t.name === 'string') return { name: t.name };
              return { name: String(t || '').trim() };
            });
            setPendingTopics(normalizedTopics);
            setOriginalPrompt(messageToSend);
            setShowTopicConfirmation(true);
            
            // No need for redundant analysis message - the topic confirmation dialog is self-explanatory
          } else {
            // No topics extracted - show friendly guidance
            const guidanceResponse = {
              id: generateMessageId(),
              type: "bot",
              content: "🤔 I didn't quite get that. Try a short topic like \"Basics of photosynthesis\" or \"Intro to networking\".",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, guidanceResponse]);
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
            universalToast.error('Monthly topic creation limit reached', {
              duration: 5000,
            });
            setIsLoading(false);
            return;
          } else {
            // Generic error handling - show friendly guidance to enter a proper study topic
            const guidanceResponse = {
              id: generateMessageId(),
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

  // Basic client-side prompt validation to provide helpful guidance before calling backend
  const validateCoursePrompt = (text) => {
    if (!text) return { ok: false, reason: 'empty' };
    const trimmed = String(text).trim();
    
    // Allow very short inputs if they contain meaningful alphanumeric content
    // This handles acronyms like DSA, VLSI, AI, ML, etc.
    if (trimmed.length < 2) return { ok: false, reason: 'too_short' };
    
    // Check for meaningful content (letters or numbers)
    const meaningfulChars = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
    
    // If it's very short (2-3 chars), require at least 2 alphanumeric characters
    if (trimmed.length <= 3 && meaningfulChars < 2) {
      return { ok: false, reason: 'low_signal' };
    }
    
    // For longer inputs, be more lenient - just need some letters/numbers
    if (trimmed.length > 3 && meaningfulChars < 2) {
      return { ok: false, reason: 'low_signal' };
    }
    
    // Reject if it's just special characters or whitespace
    if (meaningfulChars === 0) return { ok: false, reason: 'no_content' };
    
    // Detect repeated characters (like "hiiiii", "hellooo", "aaaaa")
    // Check if more than 60% of the text is the same character repeated
    const lowerText = trimmed.toLowerCase();
    const charCounts = {};
    for (let char of lowerText) {
      if (/[a-z0-9]/.test(char)) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
    }
    const maxRepeat = Math.max(...Object.values(charCounts), 0);
    if (maxRepeat > meaningfulChars * 0.6 && meaningfulChars > 3) {
      return { ok: false, reason: 'repetitive' };
    }
    
    // Detect common non-educational greetings and casual phrases
    const casualPatterns = [
      /^(hi+|hey+|hello+|yo+|sup+|hola+|hii+)$/i,
      /^(ok+|okay+|yes+|no+|nope+|yep+|yeah+|nah+)$/i,
      /^(thanks+|thank you+|thx+|ty+)$/i,
      /^(bye+|goodbye+|cya+|see ya+|later+)$/i,
      /^(lol+|lmao+|haha+|hehe+|lmfao+)$/i,
      /^(test+|testing+|hello world+)$/i,
      /^(what+|why+|how+|when+|where+|who+)$/i,
      /^[?.!,\s]+$/,
    ];
    
    for (let pattern of casualPatterns) {
      if (pattern.test(trimmed)) {
        return { ok: false, reason: 'casual_input' };
      }
    }
    
    // Detect if the input is just random gibberish
    // Check for lack of common vowels in longer text (except for acronyms)
    if (trimmed.length > 5) {
      const vowels = (trimmed.match(/[aeiou]/gi) || []).length;
      const consonants = (trimmed.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
      // If there are consonants but almost no vowels, it might be gibberish
      if (consonants > 4 && vowels === 0) {
        return { ok: false, reason: 'no_vowels' };
      }
    }
    
    return { ok: true };
  };

  // Minimal AI-driven failure check: treat AI as failed if no topics
  // or if all topics are exactly 'Unknown Topic'/'Unknown'
  const isAiFailedTopics = (topics) => {
    if (!Array.isArray(topics) || topics.length === 0) return true;
    const normalized = topics.map(t => {
      const name = (typeof t === 'string' ? t : (t && t.name) || '').toString().trim().toLowerCase();
      return name;
    }).filter(Boolean);
    if (normalized.length === 0) return true;
    if (normalized.every(n => n === 'unknown topic' || n === 'unknown')) return true;
    return false;
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
      // Confirmed topic names: topicNames
      // Generated course ID: courseId
      // Topic string for URL: topicString
    
      const proResponse = {
        id: generateMessageId(),
        type: "bot",
        content: ``,
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

  // Auto-resize textarea height up to 200px
  const handleTextareaInput = (e) => {
    try {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    } catch (_) {}
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

    // Special inline auth prompt bubble
    if (message.isAuthPrompt) {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 mb-6">
          <div className="flex justify-start">
            <div className="max-w-[95%] min-w-0">
              <div className="rounded-2xl px-5 py-4 bg-gray-50 text-gray-800 border border-gray-200 shadow-sm">
                <p className="mb-3 text-sm lg:text-base">
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

    return (
      <div className="w-full max-w-3xl mx-auto px-4 mb-6">
        <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`${
            message.type === "user" 
              ? "max-w-[80%]" 
              : isLearningPlan || isProCard 
                ? "w-full" 
                : "max-w-[95%] min-w-0" 
          }`}>
            <div
              className={`rounded-2xl px-5 py-4 ${
                message.type === "user"
                  ? "bg-indigo-600 text-white shadow-sm ml-auto"
                  : isLearningPlan || isProCard
                    ? "bg-white border border-gray-200 shadow-sm rounded-2xl" 
                    : "bg-gray-50 text-gray-800 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              }`}
            >
              {message.type === "bot" && !isCourseContent && !isLearningPlan && !isProCard && (
                <div className="prose prose-sm lg:prose max-w-none dark:prose-invert prose-pre:bg-gray-700 prose-pre:text-gray-100 prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-gray-900 prose-headings:text-gray-900">
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
                                universalToast.success('Code copied to clipboard!', { duration: 2000 });
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
                  <Link 
                    to={`/pro-learning/${message.courseId}?topic=${encodeURIComponent(message.topic)}&tab=reading`}
                    className="block w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
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
                          <h3 className="text-base font-medium mb-1">Access Course</h3>
                          <div className="flex items-center mt-1 text-xs text-purple-200">
                            <span className="mr-3">📘 Reading</span>
                            <span className="mr-3">🎥 Videos</span>
                            <span className="mr-3">✅ Quiz</span>
                            <span>📚 Resources</span>
                          </div>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                    </Link>
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
      const fallback = { monthly_used: 0, monthly_limit: 15, per_request_limit: 4, isFallback: true };
      setUsageStats(fallback);
      return fallback;
    }
  };

  // Handle Create Course button with authentication check
  // Pro Learning mode is always enabled - no toggle needed

  return (
    <div className="h-screen flex overflow-hidden w-full bg-white relative">
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } w-[88vw] max-w-[360px] sm:max-w-[380px] md:max-w-[420px] lg:w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Sidebar Header with Logo and New Chat */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <IoSchoolOutline size={20} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-base">Course Creator</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked, current sidebar state:', isSidebarOpen);
                setIsSidebarOpen(false);
                console.log('Sidebar should now be closed');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors cursor-pointer relative z-50"
              aria-label="Close sidebar"
              type="button"
              style={{ pointerEvents: 'auto' }}
            >
              <IoChevronBack size={18} />
            </button>
          </div>
          <button
            onClick={() => {
              setChatHistory([]);
              setMessage('');
              setShowTopicConfirmation(false);
              setPendingTopics([]);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-600 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Course
          </button>
        </div>
        
        {/* ProLearning Courses Section */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Courses
          </h3>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {isLoadingCourses ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-150 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : proLearningCourses && proLearningCourses.length > 0 ? (
            <div className="space-y-2">
              {proLearningCourses
                .slice()
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
                    className="block p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-indigo-600 truncate">
                          {friendlyName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(course.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="text-gray-400 mb-2">
                <IoBook size={24} className="mx-auto opacity-50" />
              </div>
              <div className="text-sm text-gray-500">No saved courses yet</div>
              <div className="text-xs text-gray-400 mt-1">Create your first course to get started</div>
            </div>
          )}
        </div>
        
        {/* Sidebar Footer */}
  <div className="p-4 border-t border-gray-200 space-y-2 min-h-[120px] md:h-32 flex flex-col justify-center">
          <Link
            to="/learning-hub"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <IoRocket size={16} />
            Learning Hub
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <IoHome size={16} />
            Home
          </Link>
        </div>
      </div>
      {/* Overlay for small/tablet when sidebar open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main chat container */}
      <div className={`flex-1 flex flex-col h-full w-full relative overflow-hidden transition-all duration-300 ${
        isSidebarOpen ? "lg:ml-64" : "ml-0"
      }`}>
        {/* Desktop/Tablet header with menu, brand and back (md+) */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Open sidebar"
              >
                <IoMenu size={18} />
              </button>
            )}
            <div className="text-lg font-semibold text-gray-900">EasyLearnova</div>
          </div>
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <IoChevronBack size={18} />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>
        {/* Minimal mobile header (hidden at md+) */}
        {!isSidebarOpen && (
          <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-600 hover:text-gray-800 transition-colors"
            >
              <IoMenu size={20} />
            </button>
            <h1 className="text-base font-semibold text-gray-900">Course Creator</h1>
            <div className="w-10"></div>
          </div>
        )}

        {/* md+ open button is integrated into the header to avoid overlap */}

        {/* Chat messages - centered max-width container */}
        {!online && (
          <div className="w-full bg-amber-50 border-y border-amber-200 text-amber-800 text-sm text-center px-4 py-2">
            You’re offline. Messages can’t be sent. We’ll resume when you’re back online.
          </div>
        )}
        {chatHistory.length === 0 ? (
          /* Centered welcome screen layout */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            <div className="text-center w-full max-w-[900px] px-4">
              <h1
                key={suggestionKey}
                className={`text-2xl sm:text-3xl md:text-[1.75rem] font-semibold tracking-tight text-gray-900 leading-tight md:leading-snug mb-3 md:mb-4 ${
                  isAnimatingOut ? 'animate-slide-up-out' : 'animate-slide-up-in'
                }`}
              >
                {rotatingSuggestions[suggestionIndex]}
              </h1>

              {/* Centered Input Area */}
              <div className="max-w-[820px] mx-auto px-4 md:px-8 lg:px-12 pt-1 md:pt-2">
                <div className="relative group overflow-visible">
                  <textarea
                    rows={1}
                    placeholder="Ask anything"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onInput={handleTextareaInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isLoading && online) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    aria-disabled={isLoading}
                    className="w-full px-5 py-4 pr-16 bg-white/90 border-2 border-indigo-300 hover:border-indigo-400 rounded-2xl shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400/60 focus:border-indigo-400 text-gray-900 placeholder-gray-500 resize-none overflow-hidden text-base transition-all"
                    style={{ minHeight: '56px', maxHeight: '200px' }}
                  />
                  <div className="absolute right-2 top-3 bottom-4 flex items-center">
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!message.trim() || isLoading || !online}
                      aria-label="Send message"
                      className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        message.trim() && !isLoading && online 
                          ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <BiLoaderAlt className="animate-spin" size={18} />
                      ) : (
                        <IoSend size={18} />
                      )}
                    </button>
                  </div>
                </div>
                {usageStats && isLoggedIn && (
                  <div className="mt-3">
                    <CompactRateLimitStatus usageStats={usageStats} className="text-center" />
                    {usageStats.isFallback && (
                      <div className="mt-1 text-[11px] text-gray-400 text-center">Limits unavailable right now. Showing defaults. We’ll update when connected.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Regular chat messages layout */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full px-4 py-6">

              {chatHistory.map((chat) => (
                <MessageBubble 
                  key={chat.id} 
                  message={chat} 
                  retryLastRequest={retryLastRequest}
                  setLastFailedPrompt={setLastFailedPrompt}
                />
              ))}

              {isLoading && (
                <div className="w-full max-w-3xl mx-auto px-4 mb-6">
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-200 shadow-sm rounded-2xl px-5 py-4">
                      <div className="flex items-center">
                        <BiLoaderAlt className="animate-spin text-indigo-500 w-4 h-4 mr-3" />
                        <span className="text-gray-700 text-sm">Creating your course...</span>
                        <div className="ml-2 flex space-x-1">
                          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Topics Configuration Dialog */}
              {showTopicConfirmation && (
                <div className="w-full max-w-4xl mx-auto px-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                      <h2 className="text-lg font-medium text-gray-900">
                        Configure Course Topics
                      </h2>
                      <span className="text-sm text-gray-500">
                        {pendingTopics.length}/4 topics
                      </span>
                    </div>

                    {/* Topics List */}
                    <div className="space-y-2 mb-4">
                      {pendingTopics.map((topic, index) => (
                        <div key={`pending-topic-${topic.id || `${index}-${topic.name}`}`} className="flex items-center gap-3 group">
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
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            <IoRocket size={20} />
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
          </div>
        )}

        {/* Rate limit status just above composer (keeps composer height constant) */}
        {chatHistory.length > 0 && usageStats && isLoggedIn && (
          <div className="bg-transparent pb-2 md:hidden">
            <div className="max-w-[820px] mx-auto px-4 md:px-8 lg:px-12">
              <CompactRateLimitStatus usageStats={usageStats} className="text-center" />
              {usageStats.isFallback && (
                <div className="mt-1 text-[11px] text-gray-400 text-center">Limits unavailable right now. Showing defaults. We’ll update when connected.</div>
              )}
            </div>
          </div>
        )}

        {/* Fixed Input at Bottom - Enhanced Design - Only show when there are messages */}
        {chatHistory.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-[820px] mx-auto px-4 md:px-8 lg:px-12">
              <div className="relative group overflow-visible">
                <textarea
                  rows={1}
                  placeholder="Describe the course you want to create..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isLoading && online) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  aria-disabled={isLoading}
                  className="w-full px-5 py-4 pr-16 bg-white border-2 border-indigo-300 hover:border-indigo-400 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-400/60 focus:border-indigo-400 text-gray-900 placeholder-gray-500 resize-none overflow-hidden text-base shadow-sm hover:shadow-md transition-all"
                  style={{ minHeight: '56px', maxHeight: '200px' }}
                />
                <div className="absolute right-2 top-4 bottom-4 flex items-center">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!message.trim() || isLoading || !online}
                    aria-label="Send message"
                    className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                      message.trim() && !isLoading && online 
                        ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <BiLoaderAlt className="animate-spin" size={18} />
                    ) : (
                      <IoSend size={18} />
                    )}
                  </button>
                </div>
              </div>
              {usageStats && isLoggedIn && (
                <div className="mt-2 hidden md:block">
                  <CompactRateLimitStatus usageStats={usageStats} className="text-center" />
                  {usageStats.isFallback && (
                    <div className="mt-1 text-[11px] text-gray-400 text-center">Limits unavailable right now. Showing defaults. We’ll update when connected.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Auth modal removed - we now show inline login/signup message within chat */}
    </div>
  );
};

export default ChatbotPage;