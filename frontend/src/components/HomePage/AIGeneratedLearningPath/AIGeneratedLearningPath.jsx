import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AIGeneratedLearningPath = () => {
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const navigate = useNavigate(); // Add this for navigation
  
  const examples = [
    "Full Stack Web Development with React and Node.js",
    "Machine Learning for Beginners",
    "Data Structures and Algorithms Masterclass",
    "UI/UX Design Fundamentals"
  ];
  
  const handleGenerate = () => {
    if (inputValue.trim() === '') return;
    setIsGenerating(true);
    
    // Simulate a brief loading state before redirecting
    setTimeout(() => {
      setIsGenerating(false);
      
      // Create a specific prompt for learning paths
      const formattedQuery = `Create a detailed learning path for: ${inputValue}`;
      
      // Redirect to chat with the query
      navigate(`/chat?q=${encodeURIComponent(formattedQuery)}`);
    }, 1000);
  };

  const handleExampleClick = (example) => {
    setInputValue(example);
    setShowExamples(false);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 text-white relative overflow-hidden">
      {/* Animated decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute right-0 top-0 h-64 w-64 text-indigo-500 opacity-20 animate-pulse">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.3,-32.5,89.9,-16.3,88.8,-0.6C87.7,15,82.8,30,74.9,43.4C67.1,56.7,56.1,68.3,42.8,76.4C29.4,84.4,14.7,88.9,-0.6,89.8C-15.9,90.7,-31.7,88,-46,81.2C-60.3,74.3,-73.1,63.3,-79.6,49.7C-86.1,36,-86.4,18,-85.2,0.7C-84,-16.7,-81.3,-33.3,-73.8,-47.2C-66.3,-61,-53.9,-72,-40.3,-79C-26.6,-86,-13.3,-89.1,1,-91C15.3,-92.9,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="absolute left-0 bottom-0 h-48 w-48 text-indigo-500 opacity-20 animate-pulse" style={{animationDelay: '1s'}}>
          <svg viewBox="0 0 200 200" fill="currentColor">
            <path d="M39.4,-65.6C50.9,-59.5,59.6,-48.7,64.2,-37C68.8,-25.2,69.4,-12.6,69.1,-0.2C68.8,12.3,67.6,24.5,62.1,35.1C56.6,45.7,46.8,54.5,35.7,62C24.5,69.5,12.3,75.6,-0.9,77.1C-14,78.6,-28,75.5,-38.7,68C-49.4,60.5,-56.7,48.5,-62.5,36.2C-68.3,24,-72.6,11.5,-72.8,-0.2C-72.9,-11.9,-68.9,-23.2,-63.2,-34.8C-57.6,-46.4,-50.3,-58.2,-40,-63.7C-29.6,-69.2,-14.8,-68.3,-0.7,-67.1C13.4,-65.9,27.9,-71.7,39.4,-65.6Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        {/* Floating educational icons */}
        <div className="absolute right-1/4 top-1/4 animate-float opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="absolute left-1/3 top-2/3 animate-float opacity-20" style={{animationDelay: '2s'}}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg p-1 rounded-full inline-block mb-6">
            <div className="bg-indigo-600 rounded-full px-5 py-2 text-sm font-medium">
              AI-POWERED LEARNING
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">Personalized Course</span> with Our AI
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
          Give our AI a prompt, get structured playlists, and save them to your learning hub—all in one place          </p>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
            <div className="p-8">
              <div className="relative mb-6">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setShowExamples(true)}
                  placeholder="What do you want to learn today?"
                  className="w-full p-5 border-2 border-gray-200 rounded-xl text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute right-4 top-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                {/* Dropdown examples */}
                {showExamples && inputValue.length === 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fadeIn">
                    <p className="px-4 py-2 text-sm font-medium text-gray-500">POPULAR SEARCHES</p>
                    {examples.map((example, idx) => (
                      <button
                        key={idx}
                        className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-indigo-50 transition-colors duration-150"
                        onClick={() => handleExampleClick(example)}
                      >
                        <div className="flex items-center">
                          <span className="bg-indigo-100 text-indigo-600 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </span>
                          {example}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Example chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                <p className="text-gray-500 text-sm pt-1">Try:</p>
                {examples.slice(0, 2).map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(example)}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100 transition-colors duration-150"
                  >
                    {example}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !inputValue.trim()}
                className={`w-full py-5 rounded-xl font-medium text-lg flex items-center justify-center transition-all duration-300 ${
                  isGenerating 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : !inputValue.trim()
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/30'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Your Learning Path...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate My Learning Path
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-gray-50 p-6 border-t border-gray-100">
              <div className="flex flex-col md:flex-row items-center justify-between text-gray-600">
                <div className="flex items-center mb-4 md:mb-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm">Your data is private and secure</span>
                </div>
                <div className="flex space-x-6">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">Generated in seconds</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-sm">Free to use</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="bg-indigo-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Tailored</h3>
              <p className="text-indigo-100 text-sm">Learning paths customized to your specific interests and goals</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="bg-indigo-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Curated Content</h3>
              <p className="text-indigo-100 text-sm">Only the best free resources, organized in a logical progression</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="bg-indigo-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-indigo-100 text-sm">Save your learning path and track your progress over time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIGeneratedLearningPath;