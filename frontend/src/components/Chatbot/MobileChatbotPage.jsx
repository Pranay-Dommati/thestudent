import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack, IoPlayCircle, IoSchoolOutline, IoCheckmarkCircle } from "react-icons/io5";
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

// Custom CSS - added for DeepSeek-like UI
import './mobileChatStyles.css';

// Simple Gemini API call for regular chat
const callGeminiAPI = async (message) => {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
};

// Vector bot API call for general educational responses
const callVectorBotAPI = async (message) => {
  try {
    console.log('📤 Sending request to vector bot API:', message);
    const response = await fetch('http://localhost:8000/api/chatbot/chat/general/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
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
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageStats, setUsageStats] = useState(null); // Track rate limit usage stats
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Check if user has visited chat page before
  useEffect(() => {
    const hasVisitedChat = localStorage.getItem('hasVisitedChat');
    if (!hasVisitedChat) {
      setShowWelcomeMessage(true);
      localStorage.setItem('hasVisitedChat', 'true');
    }
  }, []);

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

  // Fetch usage stats when component mounts or when pro mode is enabled
  const fetchUsageStats = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('📊 Fetching usage stats...');
      const response = await fetch('http://localhost:8000/api/chatbot/usage-stats/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
        console.log('📊 Usage stats fetched:', data);
      } else {
        console.log('📊 Failed to fetch usage stats, using defaults');
        // Set default stats if API fails
        setUsageStats({
          daily_used: 0,
          daily_limit: 16,
          per_request_limit: 4
        });
      }
    } catch (error) {
      console.error('📊 Error fetching usage stats:', error);
      // Set default stats if fetch fails
      setUsageStats({
        daily_used: 0,
        daily_limit: 16,
        per_request_limit: 4
      });
    }
  };

  // Fetch usage stats when component mounts and when pro mode changes
  useEffect(() => {
    if (proMode && isAuthenticated) {
      fetchUsageStats();
    }
  }, [proMode, isAuthenticated]);

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
    
    // Handle new format for generated course
    if (messageParam && prefillParam === 'true') {
      const decodedMessage = decodeURIComponent(messageParam);
      setMessage(decodedMessage);
      initialQueryProcessed.current = true;
      
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

  const handleSendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || message;
    if (!messageToSend.trim() || isLoading) return;

    const userMessageObj = {
      id: chatHistory.length + 1,
      type: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMessageObj]);
    if (!customMessage) setMessage("");
    setIsLoading(true);

    try {
      if (proMode) {
        // Pro mode - extract topics using AI first with rate limiting
        try {
          console.log('🚀 Starting topic extraction for:', messageToSend);
          const result = await classifyTopics(messageToSend);
          
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
                id: chatHistory.length + 2,
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
              id: chatHistory.length + 2,
              type: "bot",
              content: `🤔 I've analyzed your query "${messageToSend}" and extracted ${availableTopics.length} learning topic(s). ${limitMessage} Please review and confirm the topics you'd like to include in your course.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isTopicConfirmation: true,
            };
            setChatHistory((prev) => [...prev, confirmationResponse]);
          } else {
            // No topics extracted - show error
            const errorResponse = {
              id: chatHistory.length + 2,
              type: "bot",
              content: "❌ I couldn't extract any learning topics from your query. Please try to be more specific about what you'd like to learn (e.g., 'JavaScript arrays and functions', 'Python data structures', etc.)",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, errorResponse]);
          }
        } catch (error) {
          console.error('❌ Topic extraction failed:', error);
          
          // Handle rate limiting specifically
          if (error.isRateLimit) {
            const rateLimitMessage = formatRateLimitMessage(error);
            const rateLimitResponse = {
              id: chatHistory.length + 2,
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
          } else {
            // Generic error handling
            const errorResponse = {
              id: chatHistory.length + 2,
              type: "bot",
              content: `❌ Topic extraction failed: ${error.message}. Please try again with a clearer learning query.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setChatHistory((prev) => [...prev, errorResponse]);
          }
        }
      } else {
        // Regular chatbot response using vector bot for educational topics
        console.log('🔄 Calling vector bot API...');
        const response = await callVectorBotAPI(messageToSend);

        const botResponse = {
          id: chatHistory.length + 2,
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
        id: chatHistory.length + 2,
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
      // Call the new backend endpoint to actually create the course with rate limiting
      const token = localStorage.getItem('token');
      const response = await fetch('/ai/create-course-topics/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          topics: pendingTopics
        })
      });

      const result = await response.json();

      if (response.status === 429) {
        // Rate limit exceeded
        const botResponse = {
          id: chatHistory.length + 1,
          type: "bot",
          message: `🚫 ${result.message}`,
          timestamp: new Date().toLocaleTimeString(),
          isRateLimit: true
        };
        setChatHistory(prev => [...prev, botResponse]);
        setShowTopicConfirmation(false);
        setPendingTopics([]);
        setOriginalPrompt("");
        
        // Update usage stats if provided
        if (result.usage_stats) {
          setUsageStats(result.usage_stats);
        }
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
      const topicNames = pendingTopics.map(topic => topic.name);
      const topicString = topicNames.join(', ');
    
      const proResponse = {
        id: chatHistory.length + 1,
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
      const errorResponse = {
        id: chatHistory.length + 1,
        type: "bot",
        message: `❌ Failed to create course: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory(prev => [...prev, errorResponse]);
      setShowTopicConfirmation(false);
      setPendingTopics([]);
      setOriginalPrompt("");
    }
  };

  const handleTopicCancel = () => {
    const cancelResponse = {
      id: chatHistory.length + 1,
      type: "bot",
      content: "❌ Course creation cancelled. Feel free to ask me anything else or try again with a different query!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    setChatHistory((prev) => [...prev, cancelResponse]);
    setShowTopicConfirmation(false);
    setPendingTopics([]);
    setOriginalPrompt("");
  };

  const MessageBubble = ({ message }) => {
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
      <div className="w-full px-3 mb-3 bg-white">
        <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} py-2`}>
          <div className={`${
            message.type === "user" 
              ? "max-w-[75%]" // User messages - more constrained width
              : isLearningPlan || isProCard 
                ? "w-full" 
                : "max-w-[95%] min-w-0" // Bot messages - content-dependent width
          }`}>
            <div
              className={`px-3 py-2.5 w-fit ${
                message.type === "user"
                  ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                  : isLearningPlan || isProCard
                    ? "bg-white border border-gray-200 shadow-sm rounded-xl" 
                    : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none"
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
                          
                          localStorage.setItem('proLearning_batchGeneration', JSON.stringify(batchGenerationData));
                          console.log('🚀 Mobile Pro Learning Experience button clicked - batch generation data stored:', batchGenerationData);
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

              <div className={`text-[10px] mt-1.5 ${
                message.type === "user" 
                  ? "text-blue-100/80" 
                  : isLearningPlan || isProCard
                    ? "text-gray-400 pl-1" 
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

  // Handle Create Course button with authentication check
  const handleCreateCourse = async () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    const newProMode = !proMode;
    setProMode(newProMode);
    
    // Set random placeholder when entering pro mode (same as desktop)
    if (newProMode) {
      setCoursePlaceholder(getRandomPlaceholder());
      await fetchUsageStats();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Mobile Chat Header - ChatGPT style */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2.5 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="mr-3 p-1.5 text-gray-600"
          >
            <IoMenu size={20} />
          </button>
          <div className="flex items-center">
            <div className="p-1 rounded-full bg-accent-blue text-white mr-2">
              <FaRobot className="w-4 h-4" />
            </div>
            <h2 className="text-base font-medium text-gray-800">Learning Assistant</h2>
          </div>
        </div>
        <div className="flex items-center">
          <Link
            to="/"
            className="p-1.5 text-gray-600"
          >
            <IoHome size={18} />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <div
        className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white shadow-xl z-50 transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-medium text-gray-800">Chat Menu</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <IoChevronBack size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                // Don't toggle proMode here, let handleCreateCourse do it
                handleCreateCourse();
                setIsSidebarOpen(false);
              }}
              className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
            >
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-white/20 mr-3">
                  <IoSchoolOutline size={16} />
                </div>
                <span className="font-medium">Create Course</span>
              </div>
              <IoCheckmarkCircle size={16} className={proMode ? "opacity-100" : "opacity-0"} />
            </button>
            
            <Link
              to="/courses"
              className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:bg-indigo-50/50 shadow-sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                  <FaBook size={16} />
                </div>
                <span className="font-medium text-gray-700">Courses</span>
              </div>
            </Link>
            
            <Link
              to="/pro-learning"
              className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:bg-indigo-50/50 shadow-sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                  <FaGraduationCap size={16} />
                </div>
                <span className="font-medium text-gray-700">Pro Learning</span>
              </div>
            </Link>
            
            <Link
              to="/profile"
              className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:bg-indigo-50/50 shadow-sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                  <FaRegUser size={16} />
                </div>
                <span className="font-medium text-gray-700">Profile</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Welcome Message Popup for First-time Users */}
      {showWelcomeMessage && (
        <>
          {/* Background Blur Overlay */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
          
          {/* Top Positioned Welcome Message */}
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm mx-4">
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
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="min-h-full py-2">
          {chatHistory.map((chat) => (
            <MessageBubble key={chat.id} message={chat} />
          ))}

          {isLoading && (
            <div className="w-full px-3 mb-3">
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 border border-white/30 shadow-sm rounded-xl rounded-bl-md px-3 py-2.5">
                    <div className="flex items-center">
                      <div className="relative mr-2">
                        <BiLoaderAlt className="animate-spin text-indigo-500 w-4 h-4" />
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-sm opacity-30 animate-pulse"></div>
                      </div>
                      <span className="text-gray-700 text-sm">Thinking...</span>
                      <div className="ml-1.5 flex space-x-1">
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
            <div className="w-full px-3 mb-3">
              <div className="flex justify-start">
                <div className="max-w-[90%]">
                  <div className="bg-gradient-to-br from-blue-50/90 to-purple-50/90 backdrop-blur-md border-2 border-blue-200/50 rounded-xl rounded-bl-md p-3 shadow-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">Confirm Course Topics</h3>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      I found <strong>{pendingTopics.length}</strong> topic(s) from your query: "<em>{originalPrompt}</em>"
                    </p>
                    
                    <div className="space-y-1.5 mb-3">
                      {pendingTopics.map((topic, index) => (
                        <div key={topic.id || index} className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-white/30 text-sm">
                          <span className="text-indigo-500 mr-1.5 font-bold">{index + 1}.</span>
                          <input
                            type="text"
                            value={topic.name}
                            onChange={(e) => handleTopicEdit(index, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded px-1 py-0.5 text-sm"
                          />
                          <button
                            onClick={() => handleTopicDelete(index)}
                            className="ml-1 text-gray-400 hover:text-red-500 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={handleTopicConfirm}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm font-medium text-sm hover:from-blue-700 hover:to-indigo-700"
                      >
                        Create Course
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleTopicAdd}
                          disabled={pendingTopics.length >= 4}
                          className={`flex-1 py-2 bg-white text-indigo-600 border border-indigo-300 rounded-lg text-sm font-medium ${
                            pendingTopics.length >= 4 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'
                          }`}
                        >
                          Add Topic
                        </button>
                        <button
                          onClick={handleTopicCancel}
                          className="flex-1 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
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

      {/* Message input - Exactly like DeepSeek/ChatGPT */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="flex flex-col bg-gray-50">
          {/* Bottom input area */}
          <div className="px-3 py-2 border-t border-gray-200">
            {/* Quick action button - Course Creator */}
            <div className="flex items-start gap-3 mb-2 px-1">
              <button
                onClick={handleCreateCourse}
                className={`flex items-center px-4 py-2 rounded-full text-sm border shadow-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  proMode 
                  ? "bg-accent-blue text-white border-transparent"
                  : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <IoSchoolOutline size={15} className="mr-1.5" />
                <span>{proMode ? "Course Mode" : "Course Creator"}</span>
                {proMode && <IoCheckmarkCircle size={14} className="ml-1.5 text-white" />}
              </button>
              
              {/* Rate limit status beside the button - only when in proMode */}
              {proMode && usageStats && (
                <div className="flex-1 min-w-0">
                  <CompactRateLimitStatus 
                    usageStats={usageStats} 
                    className="text-xs leading-tight"
                  />
                </div>
              )}
            </div>
            
            {/* Input container with proper spacing */}
            <div className="relative flex items-center bg-white rounded-md border border-gray-300 shadow-sm">
              {/* Left robot button */}
              <button
                onClick={() => {}} // Model toggle
                className="px-2.5 py-2.5"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-blue text-white">
                  <FaRobot size={12} />
                </div>
              </button>
              
              {/* Input field with exact styling */}
              <input
                type="text"
                placeholder={proMode ? "Describe your course topic..." : "Ask anything"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1 py-3 pl-1 pr-10 text-sm bg-transparent border-none focus:outline-none focus:ring-0"
                disabled={isLoading}
              />
              
              {/* Send button with proper positioning - always visible */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isLoading}
                className={`absolute right-2 p-2 rounded-md ${
                  message.trim() && !isLoading 
                    ? "bg-accent-blue text-white" 
                    : "bg-gray-200 text-gray-400"
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
