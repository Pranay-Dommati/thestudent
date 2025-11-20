import React from 'react';
import { FaSearch, FaChevronRight, FaChevronLeft, FaRobot, FaBook, FaCertificate, FaCheckCircle, FaDownload, FaLock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

          {/* Preview banner for guests */}
          {!isLoggedIn && (
            <div className="mt-4 mb-2">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FaLock className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                      Unlock full course
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                      Log in to track progress.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
                    navigate(`/auth?mode=login&returnTo=${returnTo}`);
                  }}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Log in
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Course chapters list with scroll */}
  <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 pr-1 relative" ref={listRef}>
          {filteredChapters()?.map((chapter, chapterIndex) => (
            <div
              key={chapterIndex}
              className="border-b border-gray-200 last:border-b-0"
              ref={(el) => (chapterRefs.current[chapterIndex] = el)}
            >
              {(() => {
                // Honor server-provided lock regardless of client auth state to avoid stale tokens causing mismatch
                const chapterLocked = !!chapter.isLocked;
                return (
                  <button 
                    className={`w-full p-4 flex justify-between items-start transition-colors hover:bg-gray-50`}
                    onClick={() => {
                      // Allow expanding even if locked so users can see lesson titles
                      // Toggle expand/collapse
                      const isExpanding = !expandedChapters[chapterIndex];
                      toggleChapter(chapterIndex);
                      
                      // After state update, scroll the expanded area into view
                      if (isExpanding) {
                        setTimeout(() => {
                          const container = listRef.current;
                          const target = chapterRefs.current[chapterIndex];
                          if (container && target) {
                            // Scroll the chapter to the top of the container so it starts right below the header
                            container.scrollTo({ 
                              top: target.offsetTop, 
                              behavior: 'smooth' 
                            });
                          }
                        }, 350); // Increased delay slightly to account for animation start
                      }
                    }}
                  >
                    <div className="flex items-start text-left">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs mr-3 flex-shrink-0 mt-0.5">
                        {chapterIndex + 1}
                      </span>
                      <span className="font-medium text-sm leading-snug line-clamp-2">
                        {chapterLocked && <FaLock className="inline-block mr-1.5 text-gray-400 w-3.5 h-3.5 relative -top-0.5" />}
                        {chapter.title}
                      </span>
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-2 mt-0.5">
                      <span className="text-xs text-gray-500 mr-2">
                        {chapter.lessons.filter(l => l.completed).length}/{chapter.lessons.length}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedChapters[chapterIndex] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 ${chapterLocked ? 'text-gray-300' : 'text-gray-500'}`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </button>
                );
              })()}
              
              <AnimatePresence initial={false}>
                {expandedChapters[chapterIndex] && (
                  <motion.div
                    key="content"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { opacity: 1, height: "auto" },
                      collapsed: { opacity: 0, height: 0 }
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {chapter.lessons.length === 0 && (
                      <div className="px-4 pb-4 pl-12 text-sm text-gray-500">
                        No lessons are available in this chapter.
                      </div>
                    )}
                    {chapter.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lessonIndex}
                        className={`w-full p-3 pl-12 flex items-start text-left transition-colors duration-150 ${
                          activeChapter === chapterIndex && activeLesson === lessonIndex 
                            ? 'bg-indigo-50 border-l-4 border-indigo-600 pl-11' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Clickable completion indicator - larger touch target for mobile */}
                        <div 
                          className={`w-6 h-6 md:w-5 md:h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 cursor-pointer touch-manipulation
                            ${lesson.completed ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300 hover:border-gray-400'}
                            active:scale-95 transition-all
                          `}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent's onClick
                            if (!isLoggedIn || lesson.isLocked) return; // don't allow when locked/guest
                            toggleLessonCompletion(chapterIndex, lessonIndex);
                          }}
                          role="checkbox"
                          aria-checked={lesson.completed}
                          aria-label={`Mark "${lesson.title}" as ${lesson.completed ? 'incomplete' : 'complete'}`}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (!isLoggedIn || lesson.isLocked) return;
                              toggleLessonCompletion(chapterIndex, lessonIndex);
                            }
                          }}
                        >
                          {lesson.completed && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-3 md:w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        {/* Lesson title and duration - clicking this navigates to lesson */}
                        <div 
                          className={`flex-1 flex flex-col min-w-0 ${lesson.isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (lesson.isLocked) return;
                            handleLessonClick(chapterIndex, lessonIndex)
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm text-gray-700 font-medium line-clamp-2 leading-snug">
                              {lesson.isLocked && <FaLock className="inline-block mr-1.5 text-gray-400 w-3 h-3 relative -top-0.5" />}
                              {lesson.title}
                            </span>
                          </div>
                          
                          {lesson.duration && (
                             <div className="flex items-center mt-1 text-xs text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                {lesson.duration}
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
