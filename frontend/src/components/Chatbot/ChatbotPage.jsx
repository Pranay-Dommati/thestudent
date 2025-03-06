import React, { useState } from "react";
import { Link } from "react-router-dom";
import { IoSend, IoHome, IoBookmark, IoMenu, IoLogoGithub } from "react-icons/io5";
import { FaGraduationCap, FaRegLightbulb } from "react-icons/fa";

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

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    const newUserMessage = {
      id: chatHistory.length + 1,
      type: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory([...chatHistory, newUserMessage]);
    setMessage("");
    
    // Simulate bot response (in a real app, you'd call your API here)
    setTimeout(() => {
      const botResponse = {
        id: chatHistory.length + 2,
        type: "bot",
        content: "Thanks for your message! This is a placeholder response. In a real implementation, I would provide helpful information about your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, botResponse]);
    }, 1000);
  };

  const suggestionTopics = [
    "Course recommendations",
    "Study techniques",
    "Career paths",
    "Programming help",
    "Exam preparation"
  ];

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
                <button className="w-full text-left p-2 hover:bg-blue-50 rounded-md text-gray-700 flex items-center">
                  <FaRegLightbulb className="mr-2 text-blue-500" />
                  {topic}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
             className="flex items-center text-gray-600 hover:text-blue-600">
            <IoLogoGithub className="mr-2" />
            GitHub Repository
          </a>
        </div>
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
            <h2 className="hidden md:block text-xl font-semibold text-gray-800">AI Chatbot Assistant</h2>
          </div>
          <div>
            <Link to="/" className="mr-2 text-gray-600 hover:text-blue-600">
              <IoHome size={20} />
            </Link>
            <Link to="/bookmarks" className="text-gray-600 hover:text-blue-600">
              <IoBookmark size={20} />
            </Link>
          </div>
        </nav>
        
        {/* Chat Container */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {chatHistory.map((chat) => (
              <div 
                key={chat.id} 
                className={`flex ${chat.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    chat.type === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <div className="mb-1">{chat.content}</div>
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
          </div>
          
          {/* Message Input */}
          <div className="mt-auto">
            <div className="bg-white border border-gray-300 rounded-lg flex items-center p-1">
              <input
                type="text"
                placeholder="Type your question here..."
                className="flex-1 p-2 bg-transparent outline-none text-gray-800"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className={`p-2 rounded-lg ${
                  message.trim() ? "text-blue-600 hover:bg-blue-50" : "text-gray-400"
                }`}
              >
                <IoSend size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100">
                Course recommendations
              </button>
              <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100">
                Study tips
              </button>
              <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100">
                Career advice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
