import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack, IoPlayCircle } from "react-icons/io5";
import { FaRobot, FaHistory } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { callGeminiAPI, getYoutubeResources, generateLearningPlan, getLearningPath } from "./ChatbotAPI";

// Add slide-up animation
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
              to={`/learning/${extractedPlanId || learningPlanId || '40f897b9-1f2e-4db4-932e-78a8d3a033b4'}`}
              className="block w-full p-3 lg:p-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base lg:text-lg font-bold mb-1">Continue Your Learning Journey</h3>
                  <p className="text-blue-100 text-xs lg:text-sm">Access your full learning path with interactive videos</p>
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
  const initialQuery = searchParams.get("q");

  const [message, setMessage] = useState("");
  const [proMode, setProMode] = useState(false);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(width >= 1024);
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
    setIsSidebarOpen(width >= 1024);
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
        // Pro mode - show redirect card
        const proResponse = {
          id: chatHistory.length + 2,
          type: "bot",
          content: `I'll create a comprehensive learning experience for "${messageToSend}". Click the card below to access detailed reading materials, summaries, videos, quizzes, and resources.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isProCard: true,
          topic: messageToSend,
        };
        setChatHistory((prev) => [...prev, proResponse]);
      } else {
        // Regular chatbot response - just AI text
        const response = await callGeminiAPI(messageToSend, { createCourse: false });
        
        console.log("Chat response received:");
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

  const MessageBubble = ({ message }) => {
    const isCourseContent = message.content.includes("# ") && message.content.includes("## ");
    const sections = isCourseContent ? parseMarkdownResponse(message.content) : [];
    const isLearningPlan = message.isLearningPlan || (message.content.includes("Learning Plan") && message.content.includes("Day "));
    const isProCard = message.isProCard || false;

    return (
      <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} mb-3 lg:mb-4 px-1`}>
        <div
          className={`rounded-lg py-2 px-3 lg:px-4 ${
            message.type === "user"
              ? "bg-blue-600 text-white rounded-br-none max-w-[85%] lg:max-w-[80%] ml-8 lg:ml-12"
              : isLearningPlan || isProCard
                ? "bg-white w-full lg:w-5/6" 
                : "bg-gray-100 text-gray-800 rounded-bl-none max-w-[85%] lg:max-w-[80%] mr-8 lg:mr-12"
          } shadow-sm`}
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
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-2">
                <div className="text-sm text-gray-700 mb-4">{message.content}</div>
                <Link 
                  to={`/pro-learning?topic=${encodeURIComponent(message.topic)}`}
                  className="block w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
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

          <div className={`text-[10px] lg:text-xs mt-1 ${
            message.type === "user" 
              ? "text-blue-200" 
              : isLearningPlan || isProCard
                ? "text-gray-400 pl-2" 
                : "text-gray-500"
          }`}>
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  };

  const suggestionTopics = [
    "Learn Web Development in 30 days",
    "Create a Data Science learning plan",
    "Master Digital Marketing in 21 days",
  ];  const handleSuggestion = async (topic) => {
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

  return (
    <div className="h-screen flex overflow-hidden w-full">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 lg:relative lg:flex-shrink-0 ${
        isSidebarOpen ? "w-full lg:w-80" : "w-0"
      } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <FaHistory className="mr-2" />
            Chat History
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-blue-50 rounded-full text-gray-500 hover:text-blue-600 transition-all duration-200"
            aria-label="Close sidebar"
          >
            <IoChevronBack size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatSessions.map((session) => (
            <button
              key={session.id}
              className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <div className="text-sm font-medium text-gray-800">{session.title}</div>
              <div className="text-xs text-gray-500 mt-1">{session.timestamp}</div>
              <div className="text-xs text-gray-600 mt-1 truncate">{session.preview}</div>
            </button>
          ))}
        </div>
        {/* Back to Home Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Link
            to="/"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-white 
                      group transition-all duration-200 border border-transparent 
                      hover:border-gray-200 hover:shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 
                            group-hover:text-white transition-colors">
                <IoHome size={18} />
              </div>
              <span className="ml-3 font-medium text-gray-700 group-hover:text-blue-600">
                Back to Home
              </span>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all"
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
        <nav className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="mr-3 lg:mr-4 p-2 -ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <IoMenu size={22} />
              </button>
            )}
            <div className="flex items-center">
              <FaRobot className="text-blue-500 mr-2 w-5 h-5" />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-800">Learning Assistant</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
              aria-label="Go to home"
            >
              <IoHome size={20} />
            </Link>
          </div>
        </nav>

        {/* Chat messages */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 relative">
          <div className={`flex-1 p-3 lg:p-4 overflow-y-auto space-y-3 lg:space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${
            isMobile && isInputFocused ? 'pb-32' : ''
          }`}>
            {chatHistory.map((chat) => (
              <MessageBubble key={chat.id} message={chat} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-lg rounded-bl-none p-3 max-w-[85%] lg:max-w-[80%] shadow-sm">
                  <div className="flex items-center">
                    <BiLoaderAlt className="animate-spin text-blue-500 mr-2" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-3 lg:p-4 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              {/* Enable Pro Toggle */}
              <div className="mb-3">
                <div 
                  onClick={() => setProMode(!proMode)}
                  className={`inline-block cursor-pointer px-4 py-2 rounded-full text-sm lg:text-base text-center transition-colors ${
                    proMode 
                      ? 'bg-purple-100 text-purple-700 font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Enable Pro
                </div>
              </div>
              
              <div className="relative">                <input
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
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
                    message.trim() && !isLoading ? "text-blue-600 hover:bg-blue-50" : "text-gray-400"
                  }`}
                >
                  <IoSend size={20} />
                </button>
              </div>              {/* Topic suggestions - Show based on screen size and input focus */}
              {(!isMobile || (isMobile && isInputFocused)) && (
                <div className={`flex flex-wrap gap-2 mt-3 ${
                  isMobile ? 'fixed left-0 right-0 bottom-[72px] bg-white p-3 border-t border-gray-200 z-10 shadow-lg animate-slide-up' : ''
                }`}>
                  {suggestionTopics.map((suggestion, index) => (
                    <button
                      key={index}                      onClick={() => {
                        handleSuggestion(suggestion);
                      }}
                      className="text-xs lg:text-sm bg-gray-100 text-gray-700 px-3 lg:px-4 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors active:bg-blue-100"
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
    </div>
  );
};

export default ChatbotPage;