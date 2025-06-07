import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] pt-24 pb-32 md:pt-32 md:pb-48 lg:pb-56 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 overflow-hidden">
      {/* Decorative elements - adjusted sizes */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 md:w-96 h-72 md:h-96 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-72 md:w-96 h-72 md:h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-20 blur-3xl"></div>
      
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:30px_30px]"></div>
      
      {/* Adjusted container max-width and padding */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Adjusted text sizes and spacing */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 mb-8">
            <span className="animate-pulse mr-2 h-3 w-3 rounded-full bg-green-400"></span>
            <span className="text-black text-sm font-medium">AI-Powered Learning</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-6 leading-tight">
            Effortless Study Plans Tailored to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">School Curriculum!</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white mb-10 max-w-2xl mx-auto px-4">
            Leverage AI to create personalized, curriculum-aligned courses for Class 10-12. Access structured playlists, videos, and notes to master your school subjects.
          </p>
          
          {/* Adjusted button sizes */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 px-4">
            <Link 
              to="/courses" 
              className="px-6 md:px-8 py-3 md:py-4 rounded-lg bg-white text-indigo-600 font-bold text-base md:text-lg
                       transition-all duration-300 ease-out transform
                       hover:shadow-lg hover:shadow-white/30 hover:-translate-y-1
                       hover:bg-opacity-95 hover:text-indigo-700
                       active:translate-y-0"            >
              Start Learning Now
            </Link>
            <Link 
              to="/chat" 
              className="group px-6 md:px-8 py-3 md:py-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white 
                       border border-indigo-400 border-opacity-30 backdrop-blur-sm font-bold text-base md:text-lg
                       transition-all duration-300 ease-out transform
                       hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-1
                       hover:bg-opacity-60 hover:border-opacity-50
                       active:translate-y-0"
            >
              <span className="flex items-center justify-center">                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />                </svg>
                Ask AI for Help
              </span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Wave pattern at bottom */}
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