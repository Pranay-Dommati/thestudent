import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Ghost, ArrowLeft, Home, BookOpen, Bot, Lightbulb, LogIn, UserPlus } from "lucide-react";
import Footer from "../Footer/Footer"; // Import your existing Footer

const NotFound = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [countdown, setCountdown] = useState(30);
  
  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/');
      return;
    }
    
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  // Hide the fixed navbar when this component mounts
  useEffect(() => {
    // Find the fixed navbar and hide it
    const fixedNavbar = document.querySelector('nav.fixed');
    if (fixedNavbar) {
      fixedNavbar.style.display = 'none';
    }

    // When component unmounts, show the navbar again
    return () => {
      if (fixedNavbar) {
        fixedNavbar.style.display = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-600 to-indigo-700">
      {/* Custom Navbar for 404 page - matched to your site's style */}
      <nav className="w-full bg-transparent py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center w-[200px]">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">S</div>
                <span className="font-bold text-xl text-white">Students Hub</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center flex-1 max-w-[600px]">
              <div className="flex items-center space-x-8">
                <Link to="/" className="font-medium transition-colors text-white hover:text-blue-200">Home</Link>
                <Link to="/courses" className="font-medium transition-colors text-white hover:text-blue-200">Courses</Link>
                <Link to="/chat" className="font-medium transition-colors text-white hover:text-blue-200">AI Chatbot</Link>
                <Link to="/learning-hub" className="font-medium transition-colors text-white hover:text-blue-200">Learning Hub</Link>
              </div>
            </div>
            <div className="flex items-center justify-end w-[200px]">
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/auth?mode=login" className="px-4 py-2 rounded-full font-medium transition-all duration-300 text-white border border-white hover:bg-white/20">Log In</Link>
                <Link to="/auth?mode=signup" className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-shadow">Sign Up</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with animation */}
      <div className="flex-grow flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="bg-white shadow-xl rounded-2xl p-8 md:p-10 max-w-md w-full border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex flex-col items-center gap-6">
            {/* Animated Ghost */}
            <div className="relative">
              <div className="animate-bounce-slow">
                <Ghost className="w-20 h-20 text-indigo-500" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-gray-200 rounded-full opacity-50 blur-sm"></div>
            </div>
            
            {/* Error Content */}
            <div>
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-2">404</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
              <p className="text-lg text-gray-600 mb-1">Oops! The page you're looking for doesn't exist.</p>
              <p className="text-sm text-gray-500">It might have been moved or deleted.</p>
            </div>
            
            {/* Auto-redirect notice */}
            <div className="w-full bg-indigo-50 rounded-lg p-3">
              <div className="text-sm text-indigo-700 mb-1">
                Redirecting to homepage in <span className="font-bold">{countdown}</span> seconds
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all ease-linear"
                  style={{ width: `${(countdown / 30) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row w-full gap-3 mt-2">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
              >
                Home Page
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Use your existing Footer component */}
      <Footer />
    </div>
  );
};

export default NotFound;