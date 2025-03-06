import React from 'react';

const Hero = () => {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-20 blur-3xl"></div>
      
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:30px_30px]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 mb-8">
            <span className="animate-pulse mr-2 h-3 w-3 rounded-full bg-green-400"></span>
            <span className="text-white text-sm font-medium">1,000+ Free Courses Available</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Find the Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">Free Courses</span>, Curated & AI-Generated for You!
          </h1>
          
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Learn at your own pace with structured playlists from YouTube and beyond, 
            organized to maximize your learning efficiency.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#courses" className="px-8 py-4 rounded-lg bg-white text-indigo-600 font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1">
              Start Learning
            </a>
            <a href="#ai-chatbot" className="px-8 py-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white border border-indigo-400 border-opacity-30 backdrop-blur-sm font-bold text-lg hover:bg-opacity-70 transition-all">
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate with AI
              </span>
            </a>
          </div>
          
          <div className="mt-16 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-blue-100">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>100% Free</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Structured Learning Paths</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>AI-Powered Curation</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave pattern at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,202.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;