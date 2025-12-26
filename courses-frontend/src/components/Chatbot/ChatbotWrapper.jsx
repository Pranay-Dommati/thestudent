import React, { useState, useEffect } from "react";
import ChatbotPage from "./ChatbotPage";
import MobileChatbotPage from "./MobileChatbotPage";
import SEO from "../SEO/SEO";

const ChatbotWrapper = () => {
  const [width, setWidth] = useState(window.innerWidth);

  // Effect for handling window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Conditionally render based on screen width
  // Using 768px as the breakpoint for mobile/desktop
  return (
    <>
      <SEO
        title="AI Chatbot - Create Custom Courses with Pro Learning | EasyLearnova"
        description="Learn like a pro with EasyLearnova's AI-powered Pro Learning feature. Chat with our intelligent AI to create personalized courses, generate custom learning paths, and master any subject with curated videos, quizzes, and resources—all tailored just for you."
        keywords="AI chatbot, Pro Learning, create custom courses, AI course generator, personalized learning paths, AI tutor, custom course creation, learn with AI, EasyLearnova chatbot"
        canonical="https://easylearnova.com/chat"
      />
      {width < 768 ? <MobileChatbotPage /> : <ChatbotPage />}
    </>
  );
};

export default ChatbotWrapper;
