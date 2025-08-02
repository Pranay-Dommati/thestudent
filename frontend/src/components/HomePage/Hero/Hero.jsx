import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[85vh] lg:min-h-[90vh] pt-14 pb-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-32 xl:pt-32 xl:pb-48 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 overflow-hidden">
      {/* Mobile version - modern and visually appealing */}
      <div className="block sm:hidden">
        {/* Mobile background elements */}
        <div className="absolute top-10 right-4 w-24 h-24 rounded-full bg-gradient-to-br from-pink-400/20 to-purple-400/20 blur-xl animate-pulse"></div>
        <div className="absolute top-32 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20 blur-xl animate-pulse delay-2000"></div>
        
        {/* Mobile floating geometric shapes */}
        <div className="absolute top-24 left-8 w-3 h-3 bg-white/30 rounded rotate-45 animate-bounce"></div>
        <div className="absolute top-40 right-12 w-2 h-8 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-32 left-6 w-4 h-4 border-2 border-white/30 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
        
        <div className="container mx-auto px-4 relative z-20 min-h-[70vh] flex flex-col justify-center">
          <div className="text-center max-w-sm mx-auto">
            {/* Mobile AI badge - more prominent */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-lg">
              <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-md"></div>
              <span className="text-white text-xs font-bold tracking-wide">AI-POWERED LEARNING</span>
            </div>
            
            {/* Mobile hero heading - larger and more impactful */}
            <h1 className="text-2xl leading-tight font-black text-white mb-4 tracking-tight">
              Your Personal
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-300 animate-pulse">
                AI Study Companion
              </span>
            </h1>
            
            {/* Mobile description with better spacing */}
            <p className="text-base leading-relaxed text-white/90 mb-8 font-medium">
              Expert courses for Classes 6–12 or create personalized study materials with AI.
            </p>
            
            {/* Mobile action buttons - stacked with modern design */}
            <div className="space-y-3 mb-8">
              <Link 
                to="/courses" 
                className="w-full block px-6 py-4 rounded-2xl bg-white text-indigo-600 font-bold text-base
                         transition-all duration-300 ease-out transform
                         hover:shadow-xl hover:shadow-white/30 hover:-translate-y-1
                         active:translate-y-0 active:scale-95
                         focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Browse Ready Courses
                </div>
              </Link>
              
              <Link 
                to="/chat" 
                className="w-full block group px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md text-white 
                         border-2 border-white/30 font-bold text-base
                         transition-all duration-300 ease-out transform
                         hover:bg-white/20 hover:border-white/50 hover:-translate-y-1
                         active:translate-y-0 active:scale-95
                         focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Custom Course
                </div>
              </Link>
            </div>
            
            {/* Mobile feature highlights */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                <div className="text-lg font-bold text-white mb-1">1000+</div>
                <div className="text-xs text-white/80 font-medium">Expert Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                <div className="text-lg font-bold text-white mb-1">AI</div>
                <div className="text-xs text-white/80 font-medium">Study Materials</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop version - preserved original experience */}
      <div className="hidden sm:block">
        {/* Desktop decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 lg:w-72 xl:w-96 h-48 lg:h-72 xl:h-96 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 lg:w-72 xl:w-96 h-48 lg:h-72 xl:h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-20 blur-3xl"></div>
        
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px] lg:bg-[length:30px_30px]"></div>
        
        <div className="container mx-auto px-4 lg:px-6 xl:px-8 max-w-7xl relative z-20">
          <div className="max-w-3xl lg:max-w-4xl mx-auto text-center">
            {/* Desktop AI badge */}
            <div className="inline-flex items-center px-3 py-1.5 lg:px-4 lg:py-2 rounded-full bg-white border border-gray-200 mb-6 lg:mb-8 shadow-lg">
              <span className="animate-pulse mr-2 h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-green-400 shadow-sm"></span>
              <span className="text-black text-sm lg:text-sm font-semibold">AI-Powered Learning</span>
            </div>
            
            {/* Desktop heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-white mb-4 lg:mb-6 leading-tight">
              Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">AI Study Companion</span> and Expert-Crafted Courses
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 lg:mb-10 max-w-2xl mx-auto px-4">
              Explore expertly crafted courses for Classes 6–12, aligned with your board syllabus — or use our AI Companion to generate personalized study materials like summaries, quizzes, videos, and more.
            </p>
            
            {/* Desktop buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-4 mb-12 lg:mb-16 xl:mb-20 px-4">
              <Link 
                to="/courses" 
                className="w-full sm:w-auto px-5 py-3 lg:px-6 lg:py-3.5 xl:px-8 xl:py-4 rounded-lg bg-white text-indigo-600 font-bold text-base lg:text-lg
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
                className="w-full sm:w-auto group px-5 py-3 lg:px-6 lg:py-3.5 xl:px-8 xl:py-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white 
                         border border-indigo-400 border-opacity-30 backdrop-blur-sm font-bold text-base lg:text-lg
                         transition-all duration-300 ease-out transform
                         hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-1
                         hover:bg-opacity-60 hover:border-opacity-50
                         active:translate-y-0
                         focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                <span className="flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 lg:h-5 lg:w-5 mr-2 transition-transform duration-300 group-hover:scale-110" 
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
      </div>
      
      {/* Wave pattern - responsive */}
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