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
  toggleLessonCompletion, // Add this prop for handling lesson completion toggle
  navigate, // For navigation
  isLoggedIn = false,
  progressPercent = 0,
  certificate = null,
  issuingCert = false,
  onIssueCertificate = () => {}
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
          
          {/* Progress bar - moved up */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Your progress</span>
              <span>{progressPercent || Math.round((completedLessons / totalLessons) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${progressPercent || Math.round((completedLessons / Math.max(1,totalLessons)) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{completedLessons}/{totalLessons} lessons completed</span>
            </div>
          </div>

          {/* Certificate CTA - Only show for engineering courses */}
          {isLoggedIn && location.pathname.includes('/courses/engineering/') && (
            <div className="mt-4">
              {certificate ? (
                <button
                  onClick={() => navigate(`/courses/${course?.id}/certificate`, { state: { courseTitle: course?.title } })}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Certificate earned ✅
                </button>
              ) : (
                <button
                  disabled={(progressPercent < 100) || issuingCert}
                  onClick={() => navigate(`/courses/${course?.id}/certificate`, { state: { courseTitle: course?.title } })}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md transition text-white ${
                    (progressPercent < 100) || issuingCert ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {issuingCert ? 'Opening…' : '🎓 Generate Certificate'}
                </button>
              )}
              {certificate && (
                <div className="mt-2 text-xs text-gray-500">
                  <div>Issued: {new Date(certificate.issued_at).toLocaleString()}</div>
                  <div>ID: {certificate.certificate_id}</div>
          {certificate.download_url && (
                    <div className="mt-1">
            <a href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Download PDF</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
                    <div
                      key={lessonIndex}
                      className={`w-full p-3 pl-12 flex items-center text-left hover:bg-gray-50 transition-colors duration-150 ${
                        activeChapter === chapterIndex && activeLesson === lessonIndex 
                          ? 'bg-indigo-50 border-l-4 border-indigo-600 pl-11' 
                          : ''
                      }`}
                    >
                      {/* Clickable completion indicator - stops event propagation */}
                      <div 
                        className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center mr-3 cursor-pointer ${
                          lesson.completed ? 'bg-green-100 border-green-400' : 'border-gray-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent's onClick
                          toggleLessonCompletion(chapterIndex, lessonIndex);
                        }}
                      >
                        {lesson.completed && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Lesson title and duration - clicking this navigates to lesson */}
                      <div 
                        className="flex-1 flex items-center justify-between cursor-pointer"
                        onClick={() => handleLessonClick(chapterIndex, lessonIndex)}
                      >
                        <span className="text-sm text-gray-700">{lesson.title}</span>
                        <span className="text-xs text-gray-500">{lesson.duration}</span>
                      </div>
                    </div>
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
