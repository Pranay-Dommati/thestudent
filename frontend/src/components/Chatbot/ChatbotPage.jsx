import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoBookmark, IoMenu, IoChevronBack } from "react-icons/io5";
import { FaGraduationCap, FaRegLightbulb, FaRobot, FaHistory } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from 'react-markdown';

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

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const ChatbotPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q');
  
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hello! I'm your AI learning assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const messagesEndRef = useRef(null);
  const initialQueryProcessed = useRef(false);
  const { width } = useWindowSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(width >= 1024); // 1024px is typical laptop breakpoint
  const [chatSessions, setChatSessions] = useState([
    {
      id: 1,
      title: "Course Recommendations",
      timestamp: "2 hours ago",
      preview: "Looking for web development courses..."
    },
    {
      id: 2,
      title: "Learning Path",
      timestamp: "Yesterday",
      preview: "Create a learning path for machine learning..."
    }
  ]);
  
  // WARNING: This is not secure for production. API keys should be handled by a backend.
  const GEMINI_API_KEY = "AIzaSyCeEzuEj-HkFd5UcabGy28bULZjnsYy9Ek";
  const YOUTUBE_API_KEY = "AIzaSyCqhODgwcRcBxQfcCyyno2X4uyhbOaAerk"; // Your YouTube API key
  const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

  // Category mapping to improve search relevance
  const CATEGORY_MAP = {
    "html": "html tutorial beginner",
    "css": "css tutorial for beginners",
    "javascript": "javascript fundamentals tutorial",
    "react": "react js tutorial for beginners",
    "python": "python programming tutorial",
    "java": "java programming tutorial",
    "machine learning": "machine learning tutorial for beginners",
    "data science": "data science tutorial",
    "web development": "web development tutorial full stack",
    "mobile development": "mobile app development tutorial",
    "database": "database management tutorial",
    "sql": "sql tutorial for beginners",
    "git": "git and github tutorial",
    "devops": "devops tutorial for beginners",
    "cloud computing": "cloud computing basics tutorial",
    "cybersecurity": "cybersecurity fundamentals"
  };

  // Scroll to bottom of messages when chat history updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle initial query from URL parameter
  useEffect(() => {
    if (initialQuery && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true;
      setMessage(initialQuery);
      // Use setTimeout to ensure the UI renders before processing
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 100);
      
      // Remove the query parameter from URL for cleaner navigation
      navigate('/chat', { replace: true });
    }
  }, [initialQuery, navigate]);

  useEffect(() => {
    setIsSidebarOpen(width >= 1024);
  }, [width]);

  // Enhanced YouTube search with category mapping and result quality filtering
  const getYoutubeResources = async (query, maxResults = 3) => {
    try {
      // Check if we have a specific category mapping for this topic
      let searchQuery = query;
      const lowerQuery = query.toLowerCase();
      
      // Use the category map or add "tutorial" to improve search relevance
      Object.keys(CATEGORY_MAP).forEach(key => {
        if (lowerQuery.includes(key)) {
          searchQuery = CATEGORY_MAP[key];
          return;
        }
      });
      
      if (!searchQuery.includes("tutorial") && !searchQuery.includes("course")) {
        searchQuery += " tutorial";
      }
      
      const params = new URLSearchParams({
        part: "snippet,statistics",
        q: searchQuery,
        key: YOUTUBE_API_KEY,
        maxResults: maxResults * 2, // Fetch more to filter for quality
        type: "video",
        videoDefinition: "high",
        relevanceLanguage: "en",
        order: "relevance" // Options: relevance, viewCount, rating
      });
      
      const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
      if (!response.ok) throw new Error('YouTube API request failed');
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Sort by relevance (already done by API) and take top results
        const filteredResults = data.items
          .filter(video => {
            // Filter out short videos (less than 5 minutes) and non-educational channels
            const title = video.snippet.title.toLowerCase();
            return !title.includes("shorts") && 
                   !title.includes("tiktok") && 
                   !title.includes("trailer");
          })
          .slice(0, maxResults);
        
        return filteredResults.map(video => ({
          title: video.snippet.title,
          url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          thumbnail: video.snippet.thumbnails.default.url,
          channelTitle: video.snippet.channelTitle
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching YouTube resources:', error);
      return [];
    }
  };

  // Get official documentation links based on topic
  const getOfficialDocs = (topic) => {
    const docsMap = {
      "html": "https://developer.mozilla.org/en-US/docs/Web/HTML",
      "css": "https://developer.mozilla.org/en-US/docs/Web/CSS",
      "javascript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      "react": "https://react.dev/learn",
      "python": "https://docs.python.org/3/tutorial/",
      "java": "https://docs.oracle.com/javase/tutorial/",
      "machine learning": "https://scikit-learn.org/stable/tutorial/",
      "data science": "https://pandas.pydata.org/docs/user_guide/index.html",
      "node.js": "https://nodejs.org/en/docs/",
      "sql": "https://www.w3schools.com/sql/",
      "git": "https://git-scm.com/doc",
    };

    const lowerTopic = topic.toLowerCase();
    for (const [key, url] of Object.entries(docsMap)) {
      if (lowerTopic.includes(key)) {
        return { name: `${key.charAt(0).toUpperCase() + key.slice(1)} Documentation`, url };
      }
    }
    return null;
  };

  // Replace the existing getYouTubeResources function with this optimized version
const getYouTubeResources = async (topic, maxResults = 1) => {
  // Use a cache to avoid repeated API calls for the same topics
  if (!window.youtubeCache) window.youtubeCache = {};
  if (window.youtubeCache[topic]) return window.youtubeCache[topic];

  const category = CATEGORY_MAP[topic.toLowerCase()] || topic;
  const params = new URLSearchParams({
    part: "snippet", // Remove statistics as it's not returned in search results
    q: category,
    key: YOUTUBE_API_KEY,
    maxResults: maxResults * 2,
    type: "video",
    videoDefinition: "high",
    relevanceLanguage: "en",
    order: "viewCount",
  });

  try {
    const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      // Filter videos
      const filteredVideos = data.items.filter((video) => {
        const title = video.snippet.title.toLowerCase();
        return (
          !title.includes("shorts") &&
          !title.includes("tiktok") &&
          !title.includes("trailer")
        );
      });

      // Format as markdown link string for direct use in prompts
      if (filteredVideos.length > 0) {
        const result = filteredVideos.slice(0, maxResults).map(video => 
          `[${video.snippet.title}](https://www.youtube.com/watch?v=${video.id.videoId})`
        ).join(", ");
        
        // Cache the result
        window.youtubeCache[topic] = result;
        return result;
      }
    }
    return "No relevant videos found";
  } catch (error) {
    console.error("YouTube API Error:", error);
    return "Error fetching videos";
  }
};

  const getOpenSourceCourses = async (topic) => {
    const coursesMap = {
      "machine learning": [
        { name: "MIT OpenCourseWare - Machine Learning", url: "https://ocw.mit.edu/courses/machine-learning/" },
        { name: "Fast.ai - Practical Deep Learning", url: "https://course.fast.ai/" },
      ],
      "data science": [
        { name: "Kaggle - Data Science Courses", url: "https://www.kaggle.com/learn" },
        { name: "Harvard - Data Science Online", url: "https://cs50.harvard.edu/x/" },
      ],
      "web development": [
        { name: "freeCodeCamp - Full Stack Development", url: "https://www.freecodecamp.org/" },
        { name: "The Odin Project", url: "https://www.theodinproject.com/" },
      ],
    };

    return coursesMap[topic.toLowerCase()] || [];
  };

  const callGeminiAPI = async (userMessage) => {
    try {
      const prompt = `
      You are an AI-powered learning assistant.
      Your job is to provide **structured** learning paths for students.
  
      When asked about a topic (e.g., '${userMessage}'), format the response with **clear step-by-step sections**:
      - Use **Markdown** for structuring responses (# for headings, bullet points for lists).
      - Break topics into **progressive steps** (Beginner → Intermediate → Advanced).
      - Select one **most viewed or highly rated** video per step from different top channels.
      - Provide **official documentation links** alongside videos.
      - Ensure responses remain **concise, structured, and easy to follow**.
  
      Example:
      **# ${userMessage}**
      **## Step 1: HTML Basics**
      - Introduction to HTML
      - Structure of an HTML document
      🔗 ${await getYouTubeResources("HTML")}
      📖 [MDN HTML Docs](https://developer.mozilla.org/en-US/docs/Web/HTML)
  
      **## Step 2: CSS Fundamentals**
      - Styling basics, selectors, and layouts
      🔗 ${await getYouTubeResources("CSS")}
      📖 [MDN CSS Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)
  
      **## Step 3: JavaScript Essentials**
      - Variables, functions, and DOM manipulation
      🔗 ${await getYouTubeResources("JavaScript")}
      📖 [MDN JavaScript Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  
      **## Step 4: Advanced Web Development**
      - React and Node.js introduction
      🔗 ${await getYouTubeResources("React")}, ${await getYouTubeResources("Node.js")}
      📖 [React Docs](https://react.dev/), [Node.js Docs](https://nodejs.org/en/docs/)
      `;
  
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
          topP: 0.8,
          topK: 40,
        },
      };
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }
  
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Unexpected response format from Gemini API");
      }
    } catch (error) {
      console.error("Error generating learning path:", error);
      return "Sorry, I couldn't generate the learning path at this moment.";
    }
  };

  // Enhanced message handler with better resource integration
  const handleSendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || message;
    if (!messageToSend.trim() || isLoading) return;

    const userMessageObj = {
      id: chatHistory.length + 1,
      type: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error in chat:", error);
      const errorResponse = {
        id: chatHistory.length + 2,
        type: "bot",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setChatHistory((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom of messages when chat history updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle initial query from URL parameter
  useEffect(() => {
    if (initialQuery && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true;
      setMessage(initialQuery);
      // Use setTimeout to ensure the UI renders before processing
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 100);
      
      // Remove the query parameter from URL for cleaner navigation
      navigate('/chat', { replace: true });
    }
  }, [initialQuery, navigate]);

  useEffect(() => {
    setIsSidebarOpen(width >= 1024);
  }, [width]);

  const suggestionTopics = [
    "Course recommendations",
    "Study techniques",
    "Career paths",
    "Programming help",
    "Exam preparation"
  ];

  // Handle clicking suggestion buttons
  const handleSuggestion = (topic) => {
    setMessage(topic);
  };

  // Custom markdown components for styling
  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-800 my-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-800 my-2" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-md font-bold text-gray-800 my-1" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
    li: ({node, ...props}) => <li className="my-1" {...props} />,
    p: ({node, ...props}) => <p className="my-2" {...props} />,
    a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
    em: ({node, ...props}) => <em className="italic" {...props} />,
    code: ({node, inline, ...props}) => 
      inline ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} /> 
             : <pre className="bg-gray-100 p-2 rounded my-2 overflow-auto"><code className="font-mono text-sm" {...props} /></pre>
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - keep existing styles but add h-screen */}
      <div

  className={`h-screen flex-shrink-0 ${
    isSidebarOpen ? 'w-80' : 'w-0'
  } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}
>

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

        {/* New Footer Navigation */}
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

      {/* Main chat container - remove bg-gray-50 from this level */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Navbar remains unchanged */}
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

        {/* API Error Banner */}
        {apiError && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  API Error: {apiError}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat messages container - keep the gray background here */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Messages area - keep existing padding and spacing */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {chatHistory.map((chat) => (
              <div 
                key={chat.id} 
                className={`flex ${chat.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                    chat.type === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : chat.isError 
                        ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {chat.type === "user" ? (
                    <div className="mb-1 whitespace-pre-wrap">{chat.content}</div>
                  ) : (
                    <div className="mb-1">
                      <ReactMarkdown components={markdownComponents}>
                        {chat.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div 
                    className={`text-xs ${
                      chat.type === "user" ? "text-blue-200" : "text-gray-500"
                    } text-right`}
                  >
                    {chat.timestamp}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
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
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Redesigned Message Input */}
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
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg 
                          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                          text-gray-800 placeholder-gray-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md
                          transition-colors ${
                            message.trim() && !isLoading
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-gray-400'
                          }`}
                >
                  <IoSend size={20} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {["Study tips", "Career advice"].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion)}
                    className="text-sm bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full
                            hover:bg-blue-50 hover:text-blue-600 transition-colors"
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