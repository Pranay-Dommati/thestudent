import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { IoSend, IoHome, IoMenu, IoChevronBack, IoPlayCircle } from "react-icons/io5";
import { FaRobot, FaHistory } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { callGeminiAPI, getYoutubeResources, generateLearningPlan, getLearningPath } from "./ChatbotAPI";

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

const LearningPlanDisplay = ({ content, learningPlanId }) => {
  // Parse the markdown content to extract days and details
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
    <div className="mt-4 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-blue-100 text-sm mt-1">{days.length} days learning journey</p>
      </div>
      
      {/* Day navigation */}
      <div className="flex overflow-x-auto py-2 bg-gray-50 border-b">
        {days.map(day => (
          <button
            key={day.number}
            onClick={() => setActiveDay(day.number)}
            className={`px-4 py-2 mx-1 rounded-full text-sm font-medium whitespace-nowrap ${activeDay === day.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Day {day.number}
          </button>
        ))}
      </div>

      {/* Active day content */}
      {days.map(day => day.number === activeDay && (
        <div key={day.number} className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800">{day.topic}</h3>
            <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-semibold text-yellow-800 mb-1">Project Idea</h4>
              <p className="text-gray-700">{day.projectIdea}</p>
            </div>
          </div>

          {day.videos.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Recommended Videos</h4>
              <div className="space-y-3">
                {day.videos.map((video, index) => (
                  <a
                    key={index}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-blue-50 transition-colors group"
                  >
                    <div className="bg-red-600 text-white p-2 rounded-md mr-3">
                      <IoPlayCircle size={20} />
                    </div>
                    <span className="text-gray-700 group-hover:text-blue-600">{video.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Learning path card */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link 
              to={`/learning/${extractedPlanId || learningPlanId || '40f897b9-1f2e-4db4-932e-78a8d3a033b4'}`}
              className="block w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1">Continue Your Learning Journey</h3>
                  <p className="text-blue-100 text-sm">Access your full learning path with interactive videos</p>
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
      // Check if this is a learning plan request
      const isLearningPlanRequest = (
        messageToSend.toLowerCase().includes('learning plan') ||
        messageToSend.toLowerCase().includes('learn ') ||
        messageToSend.toLowerCase().includes('study plan') ||
        messageToSend.toLowerCase().includes('teach me') ||
        messageToSend.toLowerCase().includes('day-wise') ||
        messageToSend.toLowerCase().includes('day by day')
      );

      if (isLearningPlanRequest) {
        // Generate a learning plan using the new API
        const planResult = await generateLearningPlan(messageToSend);
        
        if (planResult.success) {
          // Format the learning plan response
          let formattedContent;
          
          if (planResult.data.days) {
            // Format from Django backend response
            formattedContent = `# Learning Plan: ${planResult.data.title}\n\n`;
            
            planResult.data.days.forEach(day => {
              formattedContent += `## Day ${day.day}: ${day.topic}\n\n`;
              formattedContent += `**Project idea:** ${day.project_idea}\n\n`;
              
              if (day.videos && day.videos.length > 0) {
                formattedContent += '**Recommended videos:**\n';
                day.videos.forEach(video => {
                  // Make sure we have a valid video ID before adding the link
                  if (video.video_id || video.id) {
                    const videoId = video.video_id || video.id;
                    formattedContent += `- [${video.title}](https://www.youtube.com/watch?v=${videoId})\n`;
                  } else {
                    // Fallback for videos without IDs
                    formattedContent += `- ${video.title}\n`;
                  }
                });
                formattedContent += '\n';
              }
            });

            // --- AUTO SAVE AI-GENERATED PLAN TO BACKEND ---
            import("./ChatbotAPI").then(({ saveLearningPlanToDatabase }) => {
              saveLearningPlanToDatabase(planResult.data)
                .then(() => {
                  if (window.toast) window.toast.success("AI learning plan saved to your account!");
                })
                .catch(() => {
                  if (window.toast) window.toast.error("Failed to save AI plan. Please log in.");
                });
            });
            // --- END AUTO SAVE ---

          } else {
            // Format from direct API response
            formattedContent = `# Learning Path: ${planResult.data.title}\n\n`;
            
            if (planResult.data.sections) {
              planResult.data.sections.forEach((section, index) => {
                formattedContent += `## ${section.name}\n\n`;
                
                if (section.lessons) {
                  section.lessons.forEach(lesson => {
                    formattedContent += `- [${lesson.title}](https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.title)})\n`;
                  });
                  formattedContent += '\n';
                }
              });
            }
          }
          
          const botResponse = {
            id: chatHistory.length + 2,
            type: "bot",
            content: formattedContent,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isLearningPlan: true,
            learningPlanId: planResult.data.id || null
          };
          
          setChatHistory((prev) => [...prev, botResponse]);
        } else {
          // Fallback to regular chatbot response if learning plan generation failed
          const response = await callGeminiAPI(messageToSend);
          
          const botResponse = {
            id: chatHistory.length + 2,
            type: "bot",
            content: response,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          
          setChatHistory((prev) => [...prev, botResponse]);
        }
      } else {
        // Regular chatbot response for non-learning plan requests
        const response = await callGeminiAPI(messageToSend);

        const botResponse = {
          id: chatHistory.length + 2,
          type: "bot",
          content: response,
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
    // Simple pattern to detect YouTube section format
    const isCourseContent = message.content.includes("# ") && message.content.includes("## ");
    const sections = isCourseContent ? parseMarkdownResponse(message.content) : [];
    const isLearningPlan = message.isLearningPlan || (message.content.includes("Learning Plan") && message.content.includes("Day "));

    return (
      <div
        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`rounded-lg py-2 px-4 ${message.type === "user"
            ? "bg-blue-600 text-white rounded-br-none max-w-[80%]"
            : isLearningPlan 
              ? "bg-white w-full md:w-5/6 lg:w-3/4" 
              : "bg-gray-100 text-gray-800 rounded-bl-none max-w-[80%]"
            }`}
        >
          {message.type === "bot" && !isCourseContent && !isLearningPlan && (
            <div className="prose max-w-none dark:prose-invert">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}

          {message.type === "bot" && isCourseContent && !isLearningPlan && (
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

          {message.type === "user" && <div>{message.content}</div>}

          <div
            className={`text-xs mt-1 ${message.type === "user" ? "text-blue-200" : isLearningPlan ? "text-gray-400 pl-2" : "text-gray-500"}`}
          >
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  };

  const suggestionTopics = [
    "Course recommendations",
    "Study techniques",
    "Career paths",
    "Programming help",
    "Learn ReactJS in 30 days",
    "Create a Python learning plan",
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
              <MessageBubble key={chat.id} message={chat} />
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