import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] pt-16 sm:pt-24 pb-24 sm:pb-32 md:pt-32 md:pb-48 lg:pb-56 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 overflow-hidden">
      {/* Decorative elements - adjusted sizes for mobile */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-20 blur-3xl"></div>
      
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px] sm:bg-[length:30px_30px]"></div>
      
      {/* Container with improved mobile spacing */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* AI badge with better mobile visibility */}
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-gray-200 mb-6 sm:mb-8 shadow-lg">
            <span className="animate-pulse mr-2 h-2 sm:h-3 w-2 sm:w-3 rounded-full bg-green-400 shadow-sm"></span>
            <span className="text-black text-xs sm:text-sm font-semibold">AI-Powered Learning</span>
          </div>
          
          {/* Heading with improved readability on mobile */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-4 sm:mb-6 leading-tight px-2 sm:px-0">
            Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">AI Study Companion</span> and Expert-Crafted Courses
          </h1>
          
          {/* Description text with better spacing */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Explore expertly crafted courses for Classes 6–12, aligned with your board syllabus — or use our AI Companion to generate personalized study materials like summaries, quizzes, videos, and more.
          </p>
          
          {/* Button container with improved mobile layout */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-16 sm:mb-20 px-4">
            <Link 
              to="/courses" 
              className="w-full sm:w-auto px-5 sm:px-6 md:px-8 py-3 md:py-4 rounded-lg bg-white text-indigo-600 font-bold text-sm sm:text-base md:text-lg
                       transition-all duration-300 ease-out transform
                       hover:shadow-lg hover:shadow-white/30 hover:-translate-y-1
                       hover:bg-opacity-95 hover:text-indigo-700
                       active:translate-y-0
                       focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Browse Ready Courses
            </Link>
            <Link 
              to="/chat" 
              className="w-full sm:w-auto group px-5 sm:px-6 md:px-8 py-3 md:py-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white 
                       border border-indigo-400 border-opacity-30 backdrop-blur-sm font-bold text-sm sm:text-base md:text-lg
                       transition-all duration-300 ease-out transform
                       hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-1
                       hover:bg-opacity-60 hover:border-opacity-50
                       active:translate-y-0
                       focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            >
              <span className="flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform duration-300 group-hover:scale-110" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Create Custom Course
              </span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Wave pattern with improved mobile scaling */}
      <div className="absolute bottom-0 left-0 right-0 z-10 transform translate-y-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto" preserveAspectRatio="none">
          <path 
            fill="#F9FAFB" 
            fillOpacity="1" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,202.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;