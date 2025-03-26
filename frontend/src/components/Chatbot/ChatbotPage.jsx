import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack } from "react-icons/io5";
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
      // Fetch structured learning path from Gemini API
      const learningPath = await callGeminiAPI(messageToSend);

      // Fetch YouTube videos for each section in the learning path
      const videoSections = await Promise.all(
        learningPath.sections.map(async (section) => {
          const videos = await getYoutubeResources(section.title, 3);
          return {
            section: section.title,
            videos,
          };
        })
      );

      const botResponse = {
        id: chatHistory.length + 2,
        type: "bot",
        content: formatLearningPath(learningPath, videoSections),
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

  const formatLearningPath = (learningPath, videoSections) => {
    let response = `### Structured Learning Path\n\n${learningPath.title}\n\n`;
    learningPath.sections.forEach((section) => {
      response += `#### ${section.title}\n- ${section.description}\n\n`;
    });

    response += `### Video Resources\n\n`;
    videoSections.forEach((section) => {
      response += `#### ${section.section}\n`;
      if (section.videos.length > 0) {
        section.videos.forEach((video) => {
          response += `- [${video.title}](${video.url}) (Channel: ${video.channelTitle})\n`;
        });
      } else {
        response += `No videos found for this section.\n`;
      }
      response += `\n`;
    });

    return response;
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main chat container */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Navbar */}
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
                <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${chat.type === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"}`}>
                  {chat.type === "user" ? (
                    <div className="mb-1 whitespace-pre-wrap">{chat.content}</div>
                  ) : (
                    <div className="mb-1">
                      <ReactMarkdown>{chat.content}</ReactMarkdown>
                    </div>
                  )}
                  <div className={`text-xs ${chat.type === "user" ? "text-blue-200" : "text-gray-500"} text-right`}>{chat.timestamp}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-lg rounded-bl-none p-3 max-w-[80%] shadow-sm">
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