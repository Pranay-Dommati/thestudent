import React from 'react';
import { FaSearch, FaChevronRight, FaChevronLeft, FaRobot, FaBook, FaCertificate, FaCheckCircle, FaDownload } from 'react-icons/fa';

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

  // Refs for auto-scrolling behavior
  const listRef = React.useRef(null);
  const chapterRefs = React.useRef([]);

  return (
    <div 
      className={`w-full border-l border-gray-200 bg-white h-full overflow-hidden flex flex-col transform transition-transform duration-300 ${
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

          {/* Certificate CTA */}
          {isLoggedIn && location.pathname.includes('/courses/engineering/') && (
            <div className="mt-5">
              {/* Not completed state */}
              {(!certificate && progressPercent < 100) && (
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                  <div className="flex items-center justify-center mb-2 text-gray-400">
                    <FaCertificate className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Complete the course to unlock your certificate</p>
                  <p className="text-xs text-gray-500 mt-1">Finish all lessons to enable generation.</p>
                </div>
              )}

              {/* Ready to generate (100% complete, no certificate yet) */}
              {(!certificate && progressPercent >= 100) && (
                <button
                  disabled={issuingCert}
                  onClick={() => navigate(`/courses/${course?.id}/certificate`, { state: { courseTitle: course?.title } })}
                  className={`group w-full relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow ${
                    issuingCert ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600'
                  }`}
                >
                  <FaCertificate className="w-4 h-4" />
                  {issuingCert ? 'Opening…' : 'Generate Certificate'}
                </button>
              )}

              {/* Certificate issued */}
              {certificate && (
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/courses/${course?.id}/certificate`, { state: { courseTitle: course?.title } })}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 transition font-medium text-sm shadow"
                  >
                    <FaCheckCircle className="w-4 h-4" />
                    View Certificate
                  </button>
                  <div className="rounded-md bg-green-50 p-3 text-xs text-green-700 border border-green-200">
                    <div className="flex items-center gap-2">
                      <FaCertificate className="w-3.5 h-3.5" />
                      <span>ID: {certificate.certificate_id}</span>
                    </div>
                    <div className="mt-1">Issued: {new Date(certificate.issued_at).toLocaleString()}</div>
                    {certificate.download_url && (
                      <div className="mt-2">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const res = await fetch(certificate.download_url);
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `certificate-${(course?.title || 'course').replace(/\s+/g,'-').toLowerCase()}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            } catch (err) {
                              // non-fatal; optionally show toast if available
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-green-300 text-green-700 hover:bg-green-100 text-xs font-medium transition"
                        >
                          <FaDownload className="w-3 h-3" /> Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Course chapters list with scroll */}
  <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 pr-1" ref={listRef}>
          {filteredChapters()?.map((chapter, chapterIndex) => (
            <div
              key={chapterIndex}
              className="border-b border-gray-200 last:border-b-0"
              ref={(el) => (chapterRefs.current[chapterIndex] = el)}
            >
              <button 
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // Toggle expand/collapse
                  toggleChapter(chapterIndex);
                  // After state update, scroll the expanded area into view
                  // Use a short delay to allow DOM to render the expanded section
                  setTimeout(() => {
                    const container = listRef.current;
                    const target = chapterRefs.current[chapterIndex];
                    if (container && target) {
                      const top = target.offsetTop;
                      const targetHeight = target.offsetHeight || 0;
                      const containerHeight = container.clientHeight || 0;
                      // Try to ensure the bottom of the expanded area is visible, with some offset
                      const desiredTop = Math.max(0, top + targetHeight - containerHeight + 80);
                      // If content is small, still nudge a bit below the header
                      const fallbackTop = Math.max(top - 80, 0);
                      container.scrollTo({ top: Math.max(desiredTop, fallbackTop), behavior: 'smooth' });
                    }
                  }, 50);
                }}
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
                  {chapter.lessons.length === 0 && (
                    <div className="px-4 pb-4 pl-12 text-sm text-gray-500">
                      No lessons are available in this chapter.
                    </div>
                  )}
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
