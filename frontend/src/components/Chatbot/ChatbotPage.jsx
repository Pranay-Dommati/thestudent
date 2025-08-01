import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack, IoPlayCircle, IoSchoolOutline, IoCheckmarkCircle } from "react-icons/io5";
import { FaRobot, FaHistory } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { classifyTopics, formatRateLimitMessage } from "../ProLearning/topicclassifier";
import AuthModal from '../Common/AuthModal';
import RateLimitStatus from './RateLimitStatus';
import CompactRateLimitStatus from './CompactRateLimitStatus';

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
      throw new Error(`Vector bot API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Vector bot API error:', error);
    // Fallback to basic educational response
    return "I'm here to help with your studies! I can assist with math, science, history, English, computer science, and study techniques. What would you like to learn about?";
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
      console.log("Parsing learning plan content:", content.slice(0, 100) + "...");
      
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
          console.log("Extracted learning plan ID:", linkMatch[1]);
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
            console.log("Found video:", videoMatch[1]);
          }
        }
      }
  
      // Add the last day if it exists
      if (currentDay) {
        currentDays.push(currentDay);
      }
  
      console.log("Parsed learning plan days:", currentDays.length);
      
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
  const { width } = useWindowSize();
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Check if user has visited chat page before
  useEffect(() => {
    const hasVisitedChat = localStorage.getItem('hasVisitedChat');
    if (!hasVisitedChat) {
      setShowWelcomeMessage(true);
      localStorage.setItem('hasVisitedChat', 'true');
    }
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
    if (initialQuery && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true;
      setMessage(initialQuery);
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 100);
      navigate("/chat", { replace: true });
    }
  }, [initialQuery, navigate]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [width]);

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      console.log('Pro Mode:', proMode);
      console.log('Message:', messageToSend);

      if (proMode) {
        // Pro mode - extract topics using AI first with rate limiting
        try {
          console.log('🚀 Starting topic extraction for:', messageToSend);
          const result = await classifyTopics(messageToSend);
          console.log('✅ AI Extracted Topics:', result);
          
          // Update usage stats from the response
          if (result.usage_stats) {
            setUsageStats(result.usage_stats);
          }
          
          const extractedTopics = result.topics || [];
          
          if (extractedTopics && extractedTopics.length > 0) {
            // Store topics for confirmation and show confirmation dialog
            setPendingTopics(extractedTopics);
            setOriginalPrompt(messageToSend);
            setShowTopicConfirmation(true);
            
            const confirmationResponse = {
              id: chatHistory.length + 2,
              type: "bot",
              content: `🤔 I've analyzed your query "${messageToSend}" and extracted ${extractedTopics.length} learning topic(s). Please review and confirm the topics you'd like to include in your course.`,
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
        const response = await callVectorBotAPI(messageToSend);
        
        console.log("Vector bot response received:");
        console.log("Response type:", typeof response);
        console.log("Response value:", response);

        const botResponse = {
          id: chatHistory.length + 2,
          type: "bot",
          content: typeof response === 'string' ? response : String(response),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChatHistory((prev) => [...prev, botResponse]);
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
        setShowTopicModal(false);
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

      // Generate a unique course ID
      const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the topic string for URL - extract just the names from objects
      const topicNames = pendingTopics.map(topic => topic.name);
      const topicString = topicNames.join(', ');
      console.log('📝 Confirmed topic names:', topicNames);
      console.log('📝 Generated course ID:', courseId);
      console.log('📝 Topic string for URL:', topicString);
    
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
      setShowTopicModal(false);
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
    const isCourseContent = message.content.includes("# ") && message.content.includes("## ");
    const sections = isCourseContent ? parseMarkdownResponse(message.content) : [];
    const isLearningPlan = message.isLearningPlan || (message.content.includes("Learning Plan") && message.content.includes("Day "));
    const isProCard = message.isProCard || false;

    return (
      <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 mb-4 lg:mb-6">
        <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`${message.type === "user" ? "max-w-[85%] lg:max-w-[75%]" : isLearningPlan || isProCard ? "w-full" : "max-w-[85%] lg:max-w-[75%]"}`}>
            <div
              className={`rounded-2xl px-4 py-3 lg:px-5 lg:py-4 ${
                message.type === "user"
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg backdrop-blur-sm rounded-br-md"
                  : isLearningPlan || isProCard
                    ? "bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl" 
                    : "bg-white/90 backdrop-blur-sm text-gray-800 border border-white/30 shadow-lg rounded-bl-md"
              }`}
            >
              {message.type === "bot" && !isCourseContent && !isLearningPlan && !isProCard && (
                <div className="prose prose-sm lg:prose max-w-none dark:prose-invert">
                  <ReactMarkdown>
                    {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
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
                          
                          localStorage.setItem('proLearning_batchGeneration', JSON.stringify(batchGenerationData));
                          console.log('🚀 Pro Learning Experience button clicked - batch generation data stored:', batchGenerationData);
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

  const suggestionTopics = [
    "Create arrays and strings courses",
    "Learn photosynthesis and water cycle",
    "JavaScript functions and DOM manipulation",
  ];
  
  const handleSuggestion = async (topic) => {
    // First set the message
    setMessage(topic);

    // Handle the send
    await handleSendMessage(topic);

    // Clear the input and remove focus
    setMessage("");
    setIsInputFocused(false);

    // On mobile, ensure the input field is properly updated
    const input = document.querySelector('input[type="text"]');
    if (input && isMobile) {
      input.blur();
    }
  };

  // Fetch usage stats for rate limiting display
  const fetchUsageStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/ai/rate-limit-status/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      const result = await response.json();
      
      if (result.rate_limit_info) {
        setUsageStats(result.rate_limit_info);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  };

  // Handle Create Course button with authentication check
  const handleCreateCourse = async () => {
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }
    
    const newProMode = !proMode;
    setProMode(newProMode);
    
    // Fetch usage stats when entering pro mode
    if (newProMode) {
      await fetchUsageStats();
    }
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
      } transition-all duration-300 bg-white/90 backdrop-blur-md border-r border-white/20 shadow-lg flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-white/20 bg-white/50 backdrop-blur-sm flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <FaHistory className="mr-2 text-indigo-600" />
            Chat History
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-white/50 rounded-full text-gray-500 hover:text-indigo-600 transition-all duration-200"
            aria-label="Close sidebar"
          >
            <IoChevronBack size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-glass">
          {chatSessions.map((session) => (
            <button
              key={session.id}
              className="w-full text-left p-4 hover:bg-white/30 backdrop-blur-sm border-b border-white/10 transition-all duration-200 hover:shadow-sm"
            >
              <div className="text-sm font-medium text-gray-800">{session.title}</div>
              <div className="text-xs text-gray-500 mt-1">{session.timestamp}</div>
              <div className="text-xs text-gray-600 mt-1 truncate">{session.preview}</div>
            </button>
          ))}
        </div>
        {/* Back to Home Button */}
        <div className="p-4 border-t border-white/20 bg-white/30 backdrop-blur-sm">
          <Link
            to="/"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 
                      group transition-all duration-200 border border-transparent 
                      hover:border-white/30 hover:shadow-md backdrop-blur-sm"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 
                            group-hover:text-white transition-colors">
                <IoHome size={18} />
              </div>
              <span className="ml-3 font-medium text-gray-700 group-hover:text-indigo-600">
                Back to Home
              </span>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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
                <MessageBubble key={chat.id} message={chat} />
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
                        
                        <p className="text-sm text-gray-600 mb-4">
                          I found <strong>{pendingTopics.length}</strong> topic(s) from your query: "<em>{originalPrompt}</em>". 
                          You can edit, delete, or add topics before creating your course. <strong>Maximum 4 topics per course.</strong>
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          {pendingTopics.map((topic, index) => (
                            <div key={topic.id || index} className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                              <span className="text-indigo-500 mr-2 font-bold">{index + 1}.</span>
                              <input
                                type="text"
                                value={topic.name}
                                onChange={(e) => handleTopicEdit(index, e.target.value)}
                                className="flex-1 px-2 py-1 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              />
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
                            disabled={pendingTopics.length === 0}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium backdrop-blur-sm"
                          >
                            ✓ Create Course ({pendingTopics.length} topic{pendingTopics.length !== 1 ? 's' : ''})
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
                <div className="flex items-center justify-between gap-2">
                  {/* Button Section */}
                  <div className="relative group">
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
                  </div>
                  
                  {/* Compact Rate Limit Status beside the button */}
                  {proMode && usageStats && (
                    <CompactRateLimitStatus 
                      usageStats={usageStats} 
                      className="shrink-0"
                    />
                  )}
                  {proMode && !usageStats && (
                    <div className="text-xs text-gray-500 px-2">Loading stats...</div>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your message here..."
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
                      : "bg-gray-200/50 text-gray-400"
                  }`}
                >
                  <IoSend size={18} />
                </button>
              </div>
              
              {/* Topic suggestions - Show based on screen size and input focus */}
              {(!isMobile || (isMobile && isInputFocused)) && (
                <div className={`flex flex-wrap gap-2 mt-4 ${
                  isMobile ? 'fixed left-0 right-0 bottom-[72px] bg-white/90 backdrop-blur-md p-4 border-t border-white/20 z-10 shadow-lg animate-slide-up' : ''
                }`}>
                  {suggestionTopics.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSuggestion(suggestion);
                      }}
                      className="text-xs lg:text-sm bg-white/60 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full hover:bg-indigo-50/80 hover:text-indigo-600 transition-all duration-200 active:bg-indigo-100/80 border border-white/30 shadow-sm hover:shadow-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
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