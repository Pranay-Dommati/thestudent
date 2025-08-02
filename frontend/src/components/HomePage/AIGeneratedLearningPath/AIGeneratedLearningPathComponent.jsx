import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AIGeneratedLearningPath = () => {
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate(`/learning-path?topic=${encodeURIComponent(inputValue.trim())}`);
    } catch (error) {
      console.error('Error generating learning path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <section className="relative py-8 sm:py-20 xl:py-24 overflow-visible">
      <div className="block sm:hidden">
        <div className="container mx-auto max-w-lg px-4 relative z-10">
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

          <div className="relative z-[10000]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type any topic..."
                  className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                  disabled={isGenerating}
                />
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

      <div className="hidden sm:block">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="absolute top-20 left-10 opacity-10">
          <svg className="w-16 h-16 text-purple-500 animate-bounce" style={{animationDelay: '1s'}} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="absolute bottom-20 right-10 opacity-10">
          <svg className="w-20 h-20 text-blue-500 animate-bounce" style={{animationDelay: '3s'}} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
        
        <div className="container mx-auto relative z-10">
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

          <div className="max-w-4xl mx-auto relative z-[10000]">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
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
    </section>
  );
};

export default AIGeneratedLearningPath;
