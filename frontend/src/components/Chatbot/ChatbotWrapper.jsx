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
        title="AI Course Creator - Build Personalized Learning Paths"
        description="Create your own AI-powered course on EasyLearnova. Chat with AI to build personalized playlists and start learning instantly."
        keywords="AI course creator, generate learning playlists, EasyLearnova AI chat, personalized learning, free online courses"
        canonical="https://easylearnova.com/chat"
      />
      {width < 768 ? <MobileChatbotPage /> : <ChatbotPage />}
    </>
  );
};

export default ChatbotWrapper;
