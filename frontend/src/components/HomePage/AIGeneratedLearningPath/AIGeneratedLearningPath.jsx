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
    "Full Stack Web Development with React and Node.js",
    "Machine Learning for Beginners",
    "Data Structures and Algorithms Masterclass",
    "UI/UX Design Fundamentals"
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
      }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : examples.length - 1;
        setSelectedIndex(newIndex);
        if (optionRefs.current[newIndex]) {
          optionRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleExampleClick(examples[selectedIndex]);
      }
      else if (e.key === 'Escape') {
        setShowExamples(false);
        inputRef.current.blur();
      }
    } 
    // Handle Enter key submission
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleGenerate();
        setShowExamples(false);
      }
    }
  };

  const handleGenerate = () => {
    if (inputValue.trim() === '') return;
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      const formattedQuery = `Create a detailed learning path for: ${inputValue}`;
      navigate(`/chat?q=${encodeURIComponent(formattedQuery)}`);
    }, 1000);
  };

  const handleExampleClick = (example) => {
    setInputValue(example);
    setShowExamples(false);
    setSelectedIndex(-1);
    inputRef.current.focus();
  };

  // Initialize or reset option refs when examples change
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, examples.length);
  }, [examples]);

  const features = [
    {
      title: "Personalized Path",
      description: "Get a learning journey tailored to your goals and experience level",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Smart Recommendations",
      description: "AI analyzes your interests to suggest the most relevant resources",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "Progress Tracking",
      description: "Monitor your advancement with detailed progress analytics",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Learning Path Generator
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Tell us what you want to learn, and our AI will create a personalized learning path just for you.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Search input with improved mobile styling */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowExamples(true)}
              placeholder="e.g., Full Stack Web Development, Machine Learning..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 rounded-xl border-2 border-gray-200 
                       text-sm sm:text-base shadow-sm placeholder-gray-400
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all
                       disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={isGenerating}
            />
            
            {/* Search icon or loading spinner */}
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
              {isGenerating ? (
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-blue-600 border-t-transparent"></div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!inputValue.trim()}
                  className="text-gray-400 hover:text-blue-600 transition-colors disabled:hover:text-gray-400"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Example suggestions dropdown with mobile optimization */}
          {showExamples && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-2 py-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[200px] overflow-y-auto"
            >
              <div className="px-3 py-2">
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Popular searches</p>
              </div>
              {examples.map((example, index) => (
                <button
                  key={index}
                  ref={el => optionRefs.current[index] = el}
                  onClick={() => handleExampleClick(example)}
                  className={`w-full text-left px-4 py-2 text-sm sm:text-base transition-colors
                           hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                           ${selectedIndex === index ? 'bg-gray-50' : ''}`}
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Features grid with responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl">
              <div className="p-3 bg-blue-100 rounded-full mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIGeneratedLearningPath;