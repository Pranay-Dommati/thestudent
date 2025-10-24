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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-600 to-indigo-700">
      {/* Global Navbar is used; no custom override here to ensure auth state is accurate */}

      {/* Main Content with animation */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 pt-24 sm:pt-28 text-center">
        <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 md:p-10 max-w-md w-full border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            {/* Animated Ghost */}
            <div className="relative">
              <div className="animate-bounce-slow">
                <Ghost className="w-16 h-16 sm:w-20 sm:h-20 text-indigo-500" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 sm:w-12 h-2 bg-gray-200 rounded-full opacity-50 blur-sm"></div>
            </div>
            
            {/* Error Content */}
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-2">404</h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
              <p className="text-base sm:text-lg text-gray-600 mb-1">Oops! The page you're looking for doesn't exist.</p>
              <p className="text-xs sm:text-sm text-gray-500">It might have been moved or deleted.</p>
            </div>
            
            {/* Auto-redirect notice */}
            <div className="w-full bg-indigo-50 rounded-lg p-2 sm:p-3">
              <div className="text-xs sm:text-sm text-indigo-700 mb-1">
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
            <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3 mt-2">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-200 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors shadow-sm text-sm sm:text-base"
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