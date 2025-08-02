import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] pt-14 pb-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-32 xl:pt-32 xl:pb-48 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 overflow-hidden">
      {/* Decorative elements - responsive sizes */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-32 sm:w-48 lg:w-72 xl:w-96 h-32 sm:h-48 lg:h-72 xl:h-96 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-15 sm:opacity-20 blur-2xl lg:blur-3xl"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-32 sm:w-48 lg:w-72 xl:w-96 h-32 sm:h-48 lg:h-72 xl:h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-15 sm:opacity-20 blur-2xl lg:blur-3xl"></div>
      
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.03] sm:bg-grid-white/[0.05] bg-[length:15px_15px] sm:bg-[length:20px_20px] lg:bg-[length:30px_30px]"></div>
      
      {/* Container with mobile-first approach */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl relative z-20">
        <div className="max-w-3xl lg:max-w-4xl mx-auto text-center">
          {/* AI badge - compact on mobile, normal on desktop */}
          <div className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-full bg-white border border-gray-200 mb-4 sm:mb-6 lg:mb-8 shadow-lg">
            <span className="animate-pulse mr-1.5 sm:mr-2 h-1.5 w-1.5 sm:h-2 sm:w-2 lg:h-3 lg:w-3 rounded-full bg-green-400 shadow-sm"></span>
            <span className="text-black text-xs sm:text-sm lg:text-sm font-semibold">AI-Powered Learning</span>
          </div>
          
          {/* Mobile-specific compact heading */}
          <div className="block sm:hidden">
            <h1 className="text-xl leading-tight font-extrabold text-white mb-3 px-1">
              Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">AI Study Companion</span>
            </h1>
            <p className="text-sm leading-relaxed text-white/90 mb-6 px-2">
              Expert courses for Classes 6–12 or AI-generated study materials.
            </p>
          </div>
          
          {/* Desktop and tablet heading - original size preserved */}
          <div className="hidden sm:block">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-white mb-4 lg:mb-6 leading-tight px-2 sm:px-0">
              Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">AI Study Companion</span> and Expert-Crafted Courses
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 lg:mb-10 max-w-2xl mx-auto px-4">
              Explore expertly crafted courses for Classes 6–12, aligned with your board syllabus — or use our AI Companion to generate personalized study materials like summaries, quizzes, videos, and more.
            </p>
          </div>
          
          {/* Button container - compact mobile, normal desktop */}
          <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3 lg:gap-4 mb-8 sm:mb-12 lg:mb-16 xl:mb-20 px-2 sm:px-4">
            <Link 
              to="/courses" 
              className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 xl:px-8 xl:py-4 rounded-lg bg-white text-indigo-600 font-bold text-sm sm:text-base lg:text-lg
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
              className="w-full sm:w-auto group px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 xl:px-8 xl:py-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white 
                       border border-indigo-400 border-opacity-30 backdrop-blur-sm font-bold text-sm sm:text-base lg:text-lg
                       transition-all duration-300 ease-out transform
                       hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-1
                       hover:bg-opacity-60 hover:border-opacity-50
                       active:translate-y-0
                       focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            >
              <span className="flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1.5 sm:mr-2 transition-transform duration-300 group-hover:scale-110" 
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
      
      {/* Wave pattern */}
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