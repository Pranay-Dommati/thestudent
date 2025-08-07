import React, { useState, useEffect } from "react";
import ChatbotPage from "./ChatbotPage";
import MobileChatbotPage from "./MobileChatbotPage";

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
  return width < 768 ? <MobileChatbotPage /> : <ChatbotPage />;
};

export default ChatbotWrapper;
