import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AIGeneratedLearningPath = () => {
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);
  
  const examples = [
    "Arrays and Strings in Data Structures",
    "Different types of FETs - JFET and MOSFET",
    "Photosynthesis and Plant Biology",
    "Quadratic Equations and Polynomials",
    "Chemical Bonding and Molecular Structure",
    "World War II History and Timeline"
  ];
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) && 
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowExamples(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Modify the handleKeyDown function
  const handleKeyDown = (e) => {
    if (showExamples && inputValue.length === 0) {
      // Dropdown navigation logic
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = selectedIndex < examples.length - 1 ? selectedIndex + 1 : 0;
        setSelectedIndex(newIndex);
        if (optionRefs.current[newIndex]) {
          optionRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : examples.length - 1;
        setSelectedIndex(newIndex);
        if (optionRefs.current[newIndex]) {
          optionRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleExampleClick(examples[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowExamples(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'Enter' && inputValue.trim()) {
      handleGenerate();
    }
  };

  const handleExampleClick = (example) => {
    setInputValue(example);
    setShowExamples(false);
    setSelectedIndex(-1);
  };

  const handleGenerate = async () => {
    if (!inputValue.trim()) return;
    
    setIsGenerating(true);
    // Add a small delay to show the loading state
    setTimeout(() => {
      navigate('/chat', { state: { initialMessage: inputValue } });
    }, 800);
  };

  // Update option refs when examples change
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, examples.length);
  }, [examples]);

  const features = [
    {
      title: "AI Study Tools",
      description: "Generate personalized summaries, quizzes, and videos for any topic with your smart AI companion.",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "Syllabus-Aligned Courses",
      description: "Learn with structured courses for Classes 6–12, tailored to your board curriculum.",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "Track Your Progress",
      description: "Stay on top of your learning with clear progress insights and analytics.",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <section className="relative py-8 sm:py-16 lg:py-20 xl:py-24 px-3 sm:px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Mobile version - compact and focused */}
      <div className="block sm:hidden">
        {/* Simplified background for mobile */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto max-w-lg relative z-20">
          {/* Mobile header - compact */}
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-medium mb-3">
              <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82-1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              AI Learning
            </div>
            <h2 className="text-xl leading-tight font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
              Create Your Perfect
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning Journey</span>
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 max-w-sm mx-auto px-2">
              Tell us what you want to learn, and our AI will create a personalized path with 
              <span className="text-blue-600 font-semibold"> videos and quizzes</span>.
            </p>
          </div>

          {/* Mobile search input - simplified */}
          <div className="relative max-w-md mx-auto mb-8 animate-fade-in-up delay-200 z-50">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-15 group-hover:opacity-25 transition duration-300"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-1.5 shadow-lg">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowExamples(true)}
                  placeholder="e.g., Arrays, Photosynthesis..."
                  className="w-full px-4 py-3 pr-12 bg-transparent border-0 rounded-lg
                           text-sm placeholder-gray-500 focus:outline-none focus:ring-0
                           disabled:cursor-not-allowed font-medium"
                  disabled={isGenerating}
                />
                
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  {isGenerating ? (
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={!inputValue.trim()}
                      className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 
                               rounded-lg text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200
                               disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
                    >
                      <svg className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile dropdown */}
            {showExamples && (
              <div
                ref={dropdownRef}
                className="absolute z-[9999] w-full mt-3 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/50 animate-fade-in-down"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold">Popular Topics</p>
                </div>
                {examples.slice(0, 4).map((example, index) => (
                  <button
                    key={index}
                    ref={el => optionRefs.current[index] = el}
                    onClick={() => handleExampleClick(example)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200
                             hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                             ${selectedIndex === index ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}
                  >
                    <span className="text-gray-700 font-medium">{example}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile features - simplified grid */}
          <div className="grid grid-cols-1 gap-4">
            {features.slice(0, 2).map((feature, index) => (
              <div 
                key={index} 
                className="group animate-fade-in-up relative z-10"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                      {React.cloneElement(feature.icon, { className: "w-5 h-5 text-white" })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop version - full experience */}
      <div className="hidden sm:block">
        {/* Full background elements for desktop */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto max-w-5xl lg:max-w-6xl relative z-20">
          {/* Desktop header with full animation */}
          <div className="text-center mb-10 md:mb-12 lg:mb-16 animate-fade-in-up">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82-1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              AI-Powered Learning
            </div>
            <h2 className="text-3xl leading-tight md:text-4xl md:leading-tight lg:text-5xl lg:leading-tight xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
              Create Your Perfect
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning Journey</span>
            </h2>
            <p className="text-base leading-relaxed md:text-lg md:leading-relaxed lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto px-4">
              Tell us what you want to master, and our advanced AI will craft a personalized learning path with 
              <span className="text-blue-600 font-semibold"> videos, quizzes, and summaries</span> tailored just for you.
            </p>
          </div>

          {/* Desktop search input with glassmorphism */}
          <div className="relative max-w-3xl lg:max-w-4xl mx-auto mb-12 md:mb-16 animate-fade-in-up delay-200 z-50">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-2 shadow-lg">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowExamples(true)}
                  placeholder="e.g., Arrays and Strings, Types of FETs, Photosynthesis..."
                  className="w-full px-5 py-4 md:px-6 md:py-5 pr-16 lg:pr-20 bg-transparent border-0 rounded-xl
                           text-base md:text-lg placeholder-gray-500 focus:outline-none focus:ring-0
                           disabled:cursor-not-allowed font-medium"
                  disabled={isGenerating}
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {isGenerating ? (
                    <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                      <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={!inputValue.trim()}
                      className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-600 to-purple-600 
                               rounded-xl text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200
                               disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
                    >
                      <svg className="h-5 w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop dropdown */}
            {showExamples && (
              <div
                ref={dropdownRef}
                className="absolute z-[9999] w-full mt-4 py-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 animate-fade-in-down"
              >
                <div className="px-6 py-3 border-b border-gray-100">
                  <p className="text-sm text-gray-500 font-semibold flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 717 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    Popular Learning Paths
                  </p>
                </div>
                {examples.map((example, index) => (
                  <button
                    key={index}
                    ref={el => optionRefs.current[index] = el}
                    onClick={() => handleExampleClick(example)}
                    className={`w-full text-left px-6 py-3 text-base transition-all duration-200
                             hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center group
                             ${selectedIndex === index ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-700 group-hover:text-gray-900 font-medium">{example}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative z-10">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group animate-fade-in-up relative h-full z-10"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col justify-between">
                  
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="relative">
                        {feature.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-900 transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default AIGeneratedLearningPath;