import React from 'react';
import { FaSearch, FaChevronRight, FaChevronLeft, FaRobot, FaBook } from 'react-icons/fa';

const Sidebar = ({ 
  isSidebarOpen, 
  course, 
  searchQuery = '', 
  setSearchQuery = () => {}, 
  expandedChapters,
  activeChapter,
  activeLesson,
  handleLessonClick,
  completedLessons = 0, 
  totalLessons = 0, 
  toggleChapter,
  toggleSidebar,  // Add this prop to receive the toggle function
  learningPlans = [], // AI-generated learning plans
  isAIGeneratedPlan = false, // Whether the current course is an AI-generated plan
  navigate // For navigation to other learning plans
}) => {
  // Filter lessons based on search
  const filteredChapters = () => {
    if (!course || !searchQuery.trim()) return course?.chapters;
    
    const query = searchQuery.toLowerCase();
    return course.chapters.map(chapter => {
      const filteredLessons = chapter.lessons.filter(lesson => 
        lesson.title.toLowerCase().includes(query)
      );
      return filteredLessons.length > 0 ? { ...chapter, lessons: filteredLessons } : null;
    }).filter(Boolean);
  };

  return (
    <div 
      className={`w-[400px] border-l border-gray-200 bg-white h-screen sticky top-0 overflow-hidden flex flex-col transform transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="pt-8 px-4 pb-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Course content</h2>
            {/* Add the toggle button here */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <FaChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Your progress</span>
              <span>{Math.round((completedLessons / totalLessons) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{completedLessons}/{totalLessons} lessons completed</span>
            </div>
          </div>
        </div>
        
        {/* AI Learning Plans Section (only show when viewing a regular course) */}
        {!isAIGeneratedPlan && learningPlans.length > 0 && (
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <FaRobot className="text-indigo-600 mr-2" />
              <h3 className="font-semibold text-gray-800">AI Learning Plans</h3>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">
                Your personalized learning journeys:
              </div>
              {learningPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => navigate(`/learning/${plan.id}`)}
                  className="w-full p-3 text-left text-sm bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-md flex items-center transition-colors border border-indigo-100"
                >
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs mr-3 border border-indigo-200">
                    <FaRobot className="text-sm" />
                  </span>
                  <div>
                    <span className="font-medium text-indigo-800 block">{plan.title}</span>
                    <span className="text-xs text-gray-500 mt-1 block">Tap to continue learning</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Current Plan Type Indicator */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            {isAIGeneratedPlan ? (
              <>
                <FaRobot className="text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">AI-Generated Learning Plan</span>
              </>
            ) : (
              <>
                <FaBook className="text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Course Content</span>
              </>
            )}
          </div>
        </div>
        
        {/* Course chapters list with scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredChapters()?.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="border-b border-gray-200 last:border-b-0">
              <button 
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => toggleChapter(chapterIndex)}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs mr-3">
                    {chapterIndex + 1}
                  </span>
                  <span className="font-medium">{chapter.title}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {chapter.lessons.filter(l => l.completed).length}/{chapter.lessons.length}
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 text-gray-500 transform transition-transform ${
                      expandedChapters[chapterIndex] ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {expandedChapters[chapterIndex] && (
                <div>
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <button
                      key={lessonIndex}
                      className={`w-full p-3 pl-12 flex items-center text-left hover:bg-gray-50 transition-colors duration-150 ${
                        activeChapter === chapterIndex && activeLesson === lessonIndex 
                          ? 'bg-indigo-50 border-l-4 border-indigo-600 pl-11' 
                          : ''
                      }`}
                      onClick={() => handleLessonClick(chapterIndex, lessonIndex)}
                    >
                      <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center mr-3 ${
                        lesson.completed ? 'bg-green-100 border-green-400' : 'border-gray-300'
                      }`}>
                        {lesson.completed && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-gray-700">{lesson.title}</span>
                        <span className="text-xs text-gray-500">{lesson.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;