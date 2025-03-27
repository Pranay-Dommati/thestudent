import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack, IoPlayCircle } from "react-icons/io5";
import { FaRobot, FaHistory } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { callGeminiAPI, getYoutubeResources } from "./ChatbotAPI";

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
    <div className="mb-6 bg-white rounded-lg shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-800">{section}</h3>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4">
          {subsections.map((subsection, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <h4 className="font-medium text-gray-700 mb-2">{subsection.title}</h4>
              {subsection.videos.map((video, vIndex) => (
                <a
                  key={vIndex}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded hover:bg-blue-50 transition-colors group"
                >
                  <IoPlayCircle className="text-blue-500 group-hover:text-blue-600 mr-2" size={20} />
                  <span className="text-gray-600 group-hover:text-blue-600">{video.title}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
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
      const response = await callGeminiAPI(messageToSend);

      const botResponse = {
        id: chatHistory.length + 2,
        type: "bot",
        content: response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, botResponse]);
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

  const suggestionTopics = [
    "Course recommendations",
    "Study techniques",
    "Career paths",
    "Programming help",
    "Exam preparation",
  ];

  const handleSuggestion = (topic) => {
    setMessage(topic);
  };

  const renderMessage = (message) => {
    // For user messages
    if (message.type === 'user') {
      return message.content;
    }
  
    // For bot responses containing course cards
    if (message.type === 'bot' && message.content?.type === 'course') {
      return (
        <>
          {/* Chat text */}
          {message.content.chatResponse && (
            <div className="mb-4 bg-white p-3 rounded-lg">{message.content.chatResponse}</div>
          )}
          
          {/* Course Card - adjusted width */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 max-w-md">
            <div className="relative h-48">
              <img 
                src={message.content.content.thumbnail}
                alt={message.content.content.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <span className="bg-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                  {message.content.content.proficiency}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {message.content.content.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {message.content.content.short_description}
              </p>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">You'll Learn:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {message.content.content.learning_points.slice(0, 3).map((point, idx) => (
                    <li key={idx} className="text-gray-600">{point}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {message.content.content.sections[1].subsections.map(sub => (
                  <span 
                    key={sub.id}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm"
                  >
                    {sub.name}
                  </span>
                ))}
              </div>
              
              <button 
                onClick={() => console.log('Adding course:', message.content.content.title)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add to Learning Dashboard
              </button>
            </div>
          </div>
        </>
      );
    }
  
    // For regular bot text responses - add white container
    return (
      <div className="bg-white p-3 rounded-lg">
        {typeof message.content === 'string' ? message.content : message.content.content}
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className={`h-screen flex-shrink-0 ${isSidebarOpen ? "w-80" : "w-0"} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main chat container */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Custom Chat Navbar */}
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <IoMenu size={24} />
              </button>
            )}
            <div className="flex items-center">
              <FaRobot className="text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Learning Assistant</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:pr-6">
            <Link
              to="/"
              className="p-2 rounded-full text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all duration-200"
              aria-label="Go to home"
            >
              <IoHome size={20} />
            </Link>
          </div>
        </nav>

        {/* Chat messages */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {chatHistory.map((chat) => (
              <div key={chat.id} className={`flex ${chat.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${
                  chat.type === "user" 
                    ? "bg-blue-600 text-white rounded-br-none rounded-lg" 
                    : "text-gray-800"
                }`}>
                  <div className="p-3">
                    {renderMessage(chat)}
                    <div className={`text-xs ${
                      chat.type === "user" ? "text-blue-200" : "text-gray-500"
                    } text-right mt-1`}>
                      {chat.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-lg rounded-bl-none p-3 flex items-center">
                  <BiLoaderAlt className="animate-spin text-blue-500 mr-2" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Section */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
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
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {suggestionTopics.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion)}
                    className="text-sm bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;