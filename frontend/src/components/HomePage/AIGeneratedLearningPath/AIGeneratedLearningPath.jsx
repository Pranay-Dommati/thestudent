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
      title: "AI Study Tools",
      description: "Generate personalized summaries, quizzes, and videos for any topic with your smart AI companion.",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Syllabus-Aligned Courses",
      description: "Learn with structured courses for Classes 6–12, tailored to your board curriculum.",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "Track Your Progress",
      description: "Stay on top of your learning with clear progress insights and analytics.",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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