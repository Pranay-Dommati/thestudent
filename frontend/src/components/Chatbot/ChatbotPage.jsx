import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { IoSend, IoHome, IoBookmark, IoMenu } from "react-icons/io5";
import { FaGraduationCap, FaRegLightbulb, FaRobot } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from 'react-markdown';

const ChatbotPage = () => {
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
  
  // WARNING: This is not secure for production. API keys should be handled by a backend.
  const GEMINI_API_KEY = "AIzaSyCeEzuEj-HkFd5UcabGy28bULZjnsYy9Ek";
  
  // Scroll to bottom of messages when chat history updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const callGeminiAPI = async (userMessage) => {
    try {
      // Corrected Gemini API endpoint
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      // Format request for Gemini API
      const requestBody = {
          contents: [
            {
              role: "user",
              parts: [
                { 
                  text: "You are an AI-powered course assistant for The Students Hub. Your goal is to help users find the best free courses, generate structured learning paths, and recommend curated content from YouTube and other free resources. Ensure responses are clear, structured, and focus on guiding learners to relevant topics. Format your responses using markdown with proper headings (# for main headings, ## for subheadings), bullet points (* or -), and other formatting as appropriate. Here's the user's request: " + userMessage
                }
              ]
            }
          ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 40
        }
      };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }
      
      const data = await response.json();
      
      // Extract text from Gemini response
      if (data.candidates && data.candidates[0]?.content?.parts?.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Unexpected response format from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setApiError(error.message);
      return "Sorry, I encountered an error while processing your request. Please try again later.";
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    // Add user message
    const userMessageObj = {
      id: chatHistory.length + 1,
      type: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const currentMessage = message;
    setChatHistory(prev => [...prev, userMessageObj]);
    setMessage("");
    setIsLoading(true);
    setApiError(null); // Reset any previous API errors
    
    try {
      // Call Gemini API
      const botResponseContent = await callGeminiAPI(currentMessage);
      
      // Add bot response
      const botResponse = {
        id: chatHistory.length + 2,
        type: "bot",
        content: botResponseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Error in chat:", error);
      // Add error message
      const errorResponse = {
        id: chatHistory.length + 2,
        type: "bot",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setChatHistory(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white shadow-md">
        <div className="p-4 border-b">
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center">
            <FaGraduationCap className="mr-2" />
            Students Hub
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Resources</h3>
          <ul>
            {suggestionTopics.map((topic, index) => (
              <li key={index} className="mb-2">
                <button 
                  onClick={() => handleSuggestion(topic)}
                  className="w-full text-left p-2 hover:bg-blue-50 rounded-md text-gray-700 flex items-center"
                >
                  <FaRegLightbulb className="mr-2 text-blue-500" />
                  {topic}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* GitHub repository link removed as requested */}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-600">
              <IoMenu size={24} />
            </button>
            <Link to="/" className="md:hidden text-xl font-bold text-blue-600 flex items-center">
              <FaGraduationCap className="mr-2" />
              Students Hub
            </Link>
            <div className="hidden md:flex items-center">
              <FaRobot className="text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                Learning Assistant
              </h2>
            </div>
          </div>
          <div>
            <Link to="/" className="mr-2 text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50">
              <IoHome size={20} />
            </Link>
            <button className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50">
              <IoBookmark size={20} />
            </button>
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
        
        {/* Chat Container */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden bg-gray-50">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
          
          {/* Message Input */}
          <div className="mt-auto">
            <div className="bg-white border border-gray-300 rounded-lg flex items-center p-1 shadow-sm">
              <input
                type="text"
                placeholder="Type your question here..."
                className="flex-1 p-2 bg-transparent outline-none text-gray-800"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className={`p-2 rounded-lg ${
                  message.trim() && !isLoading ? "text-blue-600 hover:bg-blue-50" : "text-gray-400"
                }`}
              >
                <IoSend size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Course recommendations", "Study tips", "Career advice"].map((suggestion, index) => (
                <button 
                  key={index}
                  onClick={() => handleSuggestion(suggestion)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;