import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear messages when user starts typing
    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - show messages when clicked
    if (!email.trim()) {
      setMessage("⚠️ Please enter your email address");
      setMessageType("error");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setMessage("⚠️ Please enter a valid email address");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
        await axios.post('/newsletter/', { email: email.trim() });

      const data = await response.json();

      if (response.ok) {
        setMessage("🎉 Successfully subscribed to newsletter!");
        setMessageType("success");
        setEmail("");
      } else {
        setMessage(data.message || "Failed to subscribe. Please try again.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      setMessage("Network error. Please check your connection and try again.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Button is always enabled and looks good
  const isButtonDisabled = isSubmitting;

  return (
    <footer className="block bg-gray-900 text-white py-6 md:py-10 px-4 mt-0 border-t-0">
      <div className="max-w-6xl mx-auto text-center space-y-6">
        {/* Subscribe Section */}
        <h3 className="text-2xl font-semibold">Start Learning Today!</h3>
        <div className="max-w-md mx-auto">
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col items-center gap-3">
            <div className="w-full">
              <input
                type="email"
                placeholder="Enter your email for updates"
                value={email}
                onChange={handleEmailChange}
                className={`p-3 border rounded-md w-full bg-gray-800 text-white focus:outline-none focus:ring-2 transition-all duration-200 text-left ${
                  messageType === "error" && message
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-500 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isButtonDisabled}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 w-full sm:w-auto min-w-[140px] flex items-center justify-center ${
                isSubmitting
                  ? "bg-blue-500 text-white cursor-wait"
                  : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg transform hover:scale-105"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subscribing...
                </>
              ) : (
                <>
                  Subscribe
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`max-w-md mx-auto p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            messageType === "success" 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
          <Link to="/chat" className="hover:text-white transition-colors">AI Chatbot</Link>
          <Link to="/feedback" className="hover:text-white transition-colors">Feedback</Link>
          <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center space-x-8 text-xl mt-4">
          <a
            href="https://x.com/easylearnova"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
            title="X (Twitter)"
            aria-label="Visit us on X (Twitter)"
          >
            <FaXTwitter />
          </a>
          <a
            href="https://www.linkedin.com/company/easylearnova/?viewAsMember=true"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
            title="LinkedIn"
            aria-label="Visit us on LinkedIn"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://www.instagram.com/easylearnova"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-500 transition-colors"
            title="Instagram"
            aria-label="Visit us on Instagram"
          >
            <FaInstagram />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-gray-400 text-sm mt-4">
          © {new Date().getFullYear()} EasyLearnova. Empowering learners worldwide.
        </p>
      </div>
    </footer>
  );
};

export default Footer;