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
      } else if (e.key === 'Enter' && selectedIndex !== -1) {
        e.preventDefault();
        handleExampleClick(examples[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowExamples(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'Enter' && inputValue.trim()) {
      handleSubmit(e);
    }
  };

  const handleExampleClick = (example) => {
    setInputValue(example);
    setShowExamples(false);
    setSelectedIndex(-1);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to learning page with the topic
      navigate(`/learning-path?topic=${encodeURIComponent(inputValue.trim())}`);
    } catch (error) {
      console.error('Error generating learning path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Show examples only when input is empty
    if (value.length === 0) {
      setShowExamples(true);
      setSelectedIndex(-1);
    } else {
      setShowExamples(false);
    }
  };

  const handleInputFocus = () => {
    if (inputValue.length === 0) {
      setShowExamples(true);
    }
  };

  return (
    <section className="relative py-8 sm:py-20 xl:py-24 overflow-hidden">
      {/* Mobile version - compact and simplified */}
      <div className="block sm:hidden">
        <div className="container mx-auto max-w-lg px-4 relative z-10">
          {/* Mobile header */}
          <div className="text-center mb-6">
            <div className="inline-block mb-2">
              <div className="flex items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-3 py-1 text-purple-700 font-medium text-xs">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Powered
              </div>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight mb-2">
              Generate <span className="text-purple-600">Learning Path</span>
            </h2>
            <p className="text-sm text-gray-600">
              Get a personalized course instantly
            </p>
          </div>
          
          {/* Mobile form - simplified */}
          <div className="relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Type any topic..."
                  className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                  disabled={isGenerating}
                />
                
                {/* Mobile dropdown */}
                {showExamples && inputValue.length === 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
                  >
                    {examples.map((example, index) => (
                      <div
                        key={index}
                        ref={el => optionRefs.current[index] = el}
                        onClick={() => handleExampleClick(example)}
                        className={`px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                          selectedIndex === index 
                            ? 'bg-purple-50 text-purple-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        } ${index === 0 ? 'rounded-t-xl' : ''} ${index === examples.length - 1 ? 'rounded-b-xl' : ''}`}
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!inputValue.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg text-sm"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Generate Course'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Desktop version - full experience */}
      <div className="hidden sm:block">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        {/* Floating icons */}
        <div className="absolute top-20 left-10 opacity-10">
          <svg className="w-16 h-16 text-purple-500 animate-bounce" style={{animationDelay: '1s'}} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="absolute bottom-20 right-10 opacity-10">
          <svg className="w-20 h-20 text-blue-500 animate-bounce" style={{animationDelay: '3s'}} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
        
        <div className="container mx-auto relative z-10">
          {/* Header section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <div className="flex items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-6 py-3 text-purple-700 font-medium">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI-Powered Learning
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              Generate Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Learning Path
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tell us what you want to learn, and our AI will create a comprehensive, 
              personalized course just for you in seconds.
            </p>
          </div>

          {/* Main form */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="relative">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    placeholder="What would you like to learn today? (e.g., Machine Learning, React.js, Digital Marketing)"
                    className="w-full px-8 py-6 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 shadow-lg placeholder-gray-400"
                    disabled={isGenerating}
                  />
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Examples dropdown */}
                {showExamples && inputValue.length === 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Popular Learning Topics</h4>
                      <p className="text-xs text-gray-500">Click on any topic to get started</p>
                    </div>
                    {examples.map((example, index) => (
                      <div
                        key={index}
                        ref={el => optionRefs.current[index] = el}
                        onClick={() => handleExampleClick(example)}
                        className={`px-6 py-4 cursor-pointer transition-all duration-200 ${
                          selectedIndex === index 
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-l-4 border-purple-500' 
                            : 'text-gray-700 hover:bg-gray-50'
                        } ${index === examples.length - 1 ? 'rounded-b-2xl' : 'border-b border-gray-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{example}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isGenerating}
                  className="group relative inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                      Creating Your Learning Path...
                    </>
                  ) : (
                    <>
                      <span>Generate My Course</span>
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {/* Features highlight */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🎯",
                  title: "Personalized Content",
                  description: "Tailored to your skill level and learning goals"
                },
                {
                  icon: "⚡",
                  title: "Instant Generation",
                  description: "Get your complete course structure in seconds"
                },
                {
                  icon: "🏆",
                  title: "Expert Curated",
                  description: "Content reviewed and optimized by industry experts"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:bg-white/70 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default AIGeneratedLearningPath;
