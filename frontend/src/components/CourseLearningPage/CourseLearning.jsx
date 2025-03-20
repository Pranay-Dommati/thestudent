import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LessonVideo from './LessonVideo';
import CourseProgress from './CourseProgress';
import ResourcesPage from './templ/ResourcesPage';
import QuizzesPage from './templ/QuizzesPage';
import InstructionsPage from './templ/InstructionsPage';

const CourseLearning = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeTab, setActiveTab] = useState('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [contentType, setContentType] = useState('video'); // 'video', 'resources', 'quiz', 'instructions'
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Simulated course data
  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      setCourse({
        id: courseId,
        title: "Web Development: From Zero to Hero",
        instructor: {
          name: "YT",
          avatar: "https://via.placeholder.com/150",
        },
        description: "This comprehensive course takes you from the basics of Next.js to deploying production-ready applications.",
        duration: "56 hours 20 minutes",
        totalLessons: 592,
        totalSections: 101,
        progress: 23,
        chapters: [
          {
            title: "Getting Started with Next.js",
            lessons: [
              { 
                title: "Introduction to Next.js", 
                duration: "12:45", 
                completed: true,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              },
              { 
                title: "Setting Up Your Environment", 
                duration: "18:30", 
                completed: false,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              },
              { 
                title: "Creating Your First Next.js App", 
                duration: "25:10", 
                completed: false,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              }
            ]
          },
          {
            title: "Routing in Next.js",
            lessons: [
              { 
                title: "File-based Routing", 
                duration: "15:20", 
                completed: false,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              },
              { 
                title: "Dynamic Routes", 
                duration: "22:15", 
                completed: false,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              }
            ]
          },
          {
            title: "Data Fetching in Next.js",
            lessons: [
              { 
                title: "getStaticProps", 
                duration: "18:45", 
                completed: false,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              },
              { 
                title: "getServerSideProps", 
                duration: "20:30", 
                completed: false,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              },
              { 
                title: "API Routes", 
                duration: "16:15", 
                completed: false,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" 
              }
            ]
          },
        ]
      });
      
      setExpandedChapters({0: true});
      setLoading(false);
    }, 800);
  }, [courseId]);

  // Handle chapter toggling
  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Select a lesson
  const selectLesson = (chapterIndex, lessonIndex) => {
    setActiveChapter(chapterIndex);
    setActiveLesson(lessonIndex);
    setExpandedChapters(prev => ({
      ...prev,
      [chapterIndex]: true
    }));
    
    // Scroll to video on mobile
    if (window.innerWidth < 1024) {
      videoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mark lesson as complete
  const markLessonComplete = () => {
    if (!course) return;
    
    const updatedCourse = {...course};
    updatedCourse.chapters[activeChapter].lessons[activeLesson].completed = true;
    setCourse(updatedCourse);
  };

  // Navigate to next lesson
  const goToNextLesson = () => {
    if (!course) return;
    
    markLessonComplete();
    const currentChapter = course.chapters[activeChapter];
    
    if (activeLesson < currentChapter.lessons.length - 1) {
      setActiveLesson(activeLesson + 1);
    } else if (activeChapter < course.chapters.length - 1) {
      setActiveChapter(activeChapter + 1);
      setActiveLesson(0);
      setExpandedChapters(prev => ({
        ...prev,
        [activeChapter + 1]: true
      }));
    } else {
      // Course completed
      alert("🎉 Congratulations! You've completed the course!");
    }
  };

  // Navigate to previous lesson
  const goToPrevLesson = () => {
    if (!course) return;
    
    if (activeLesson > 0) {
      setActiveLesson(activeLesson - 1);
    } else if (activeChapter > 0) {
      setActiveChapter(activeChapter - 1);
      setActiveLesson(course.chapters[activeChapter - 1].lessons.length - 1);
      setExpandedChapters(prev => ({
        ...prev,
        [activeChapter - 1]: true
      }));
    }
  };

  // Get current lesson
  const getCurrentLesson = () => {
    if (!course) return null;
    return course.chapters[activeChapter].lessons[activeLesson];
  };

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

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center">Course not found</div>;
  }

  const currentLesson = getCurrentLesson();
  const completedLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.filter(l => l.completed).length, 0
  );
  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length, 0
  );
  
  // Modified content area rendering
  const renderContent = () => {
    switch(contentType) {
      case 'resources':
        return <ResourcesPage />;
      case 'quiz':
        return <QuizzesPage />;
      case 'instructions':
        return <InstructionsPage />;
      case 'video':
      default:
        return (
          <>
            {/* Video Player */}
            <div ref={videoRef} className="bg-black rounded-lg overflow-hidden shadow-lg mb-6">
              <LessonVideo 
                videoUrl={currentLesson.videoUrl} 
                title={currentLesson.title}
              />
            </div>

            {/* Content Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex space-x-6">
                <button 
                  className={`py-4 px-1 font-medium ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setActiveTab('content')}
                >
                  About This Lesson
                </button>
                <button 
                  className={`py-4 px-1 font-medium ${activeTab === 'resources' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setActiveTab('resources')}
                >
                  Resources
                </button>
                <button 
                  className={`py-4 px-1 font-medium ${activeTab === 'transcript' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setActiveTab('transcript')}
                >
                  Transcript
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'content' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700">
                    This lesson covers the essential concepts of {currentLesson.title.toLowerCase()}. 
                    You'll learn the fundamentals and how to apply them in real-world scenarios.
                  </p>
                  <h3 className="text-lg font-semibold mt-6">What you'll learn</h3>
                  <ul className="list-disc pl-5 space-y-2 mt-2 mb-4">
                    <li>Understanding the core concepts of {currentLesson.title}</li>
                    <li>How to implement these patterns in your own projects</li>
                    <li>Best practices and common pitfalls to avoid</li>
                    <li>Integration with other Next.js features</li>
                  </ul>
                  <p>
                    After completing this lesson, you'll have a solid understanding of how to use {currentLesson.title.toLowerCase()} 
                    to build more dynamic and efficient React applications with Next.js.
                  </p>
                </div>
              )}
              
              {activeTab === 'resources' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Lesson Resources</h3>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 flex items-start hover:bg-gray-50 transition-colors">
                      <div className="bg-blue-100 rounded p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Lesson Slides</h4>
                        <p className="text-sm text-gray-600 mt-1">PDF presentation with all key concepts from this lesson</p>
                        <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 inline-block">Download PDF</a>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 flex items-start hover:bg-gray-50 transition-colors">
                      <div className="bg-purple-100 rounded p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Code Examples</h4>
                        <p className="text-sm text-gray-600 mt-1">Sample code used in this lesson</p>
                        <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 inline-block">View on GitHub</a>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 flex items-start hover:bg-gray-50 transition-colors">
                      <div className="bg-green-100 rounded p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M5 5h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Further Reading</h4>
                        <p className="text-sm text-gray-600 mt-1">Additional articles and documentation</p>
                        <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 inline-block">Read More</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'transcript' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Lesson Transcript</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700 prose max-w-none">
                    <p className="mb-4">
                      <strong>0:00</strong> - Hello and welcome to this lesson on {currentLesson.title}. Today we're going to explore how this feature works in Next.js.
                    </p>
                    <p className="mb-4">
                      <strong>0:12</strong> - Let's start by understanding what {currentLesson.title.toLowerCase()} actually is and why it's an important part of the Next.js framework.
                    </p>
                    <p className="mb-4">
                      <strong>0:35</strong> - The main benefit of using this approach is that it allows for better performance and user experience.
                    </p>
                    <p className="mb-4">
                      <strong>1:15</strong> - Now let's look at some code examples to see how this works in practice. First, we'll create a basic setup...
                    </p>
                    <p className="text-center text-gray-500 mt-4 border-t pt-4">
                      Full transcript available for download in the resources section.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center mt-8 border-t pt-6">
              <button 
                className="px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-800 font-medium flex items-center"
                onClick={goToPrevLesson}
                disabled={activeChapter === 0 && activeLesson === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </button>
              
              <div className="text-center hidden md:block">
                <p className="text-sm text-gray-600 mb-1">
                  {activeLesson + 1} of {course.chapters[activeChapter].lessons.length} in this section
                </p>
                <div className="w-36 bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1" 
                    style={{ width: `${((activeLesson + 1) / course.chapters[activeChapter].lessons.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <button 
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center"
                onClick={goToNextLesson}
              >
                {currentLesson.completed ? "Next Lesson" : "Mark as Complete"}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </>
        );
    }
  };

  // Add additional navigation buttons in the sidebar
  const renderAdditionalNavigation = () => {
    return (
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-4">Additional Resources</h3>
        <button
          onClick={() => setContentType('resources')}
          className={`w-full text-left px-4 py-2 text-sm ${contentType === 'resources' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          Lesson Resources
        </button>
        <button
          onClick={() => setContentType('quiz')}
          className={`w-full text-left px-4 py-2 text-sm ${contentType === 'quiz' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          Practice Quiz
        </button>
        <button
          onClick={() => setContentType('instructions')}
          className={`w-full text-left px-4 py-2 text-sm ${contentType === 'instructions' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          Project Instructions
        </button>
        <button
          onClick={() => setContentType('video')}
          className={`w-full text-left px-4 py-2 text-sm ${contentType === 'video' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          Back to Video
        </button>
      </div>
    );
  };

  // Update the main layout wrapper
  return (
    <div className="min-h-screen flex">
      {/* Main Content Area - Left side, takes remaining width */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <button 
                onClick={() => navigate(`/courses/${courseId}`)}
                className="hover:text-indigo-600 transition-colors"
              >
                Course
              </button>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-700">{course.chapters[activeChapter].title}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">{currentLesson.title}</span>
            </div>
            <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
          </div>
          
          {/* Content Area - Takes remaining space */}
          <div className="max-w-none">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Course Content Sidebar - Fixed width on right */}
      <div className="w-[400px] border-l border-gray-200 bg-white h-screen sticky top-0 overflow-hidden flex flex-col">
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Course content</h2>
              <button 
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarVisible(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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
          
          {/* Course chapters list with scroll */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredChapters()?.map((chapter, chapterIndex) => (
              <div key={chapterIndex} className="border-b border-gray-200 last:border-b-0">
                <button 
                  className={`w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors duration-150 ${activeChapter === chapterIndex ? 'bg-gray-50' : ''}`}
                  onClick={() => toggleChapter(chapterIndex)}
                >
                  <div className="flex items-center text-left">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs mr-3">
                      {chapterIndex + 1}
                    </span>
                    <span className="font-medium line-clamp-1">{chapter.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2 whitespace-nowrap">
                      {chapter.lessons.filter(l => l.completed).length}/{chapter.lessons.length}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 text-gray-500 transform transition-transform ${expandedChapters[chapterIndex] ? 'rotate-180' : ''}`}
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
                        onClick={() => selectLesson(chapterIndex, lessonIndex)}
                      >
                        <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center mr-3 ${
                          lesson.completed ? 'bg-green-100 border-green-400' : 'border-gray-300'
                        }`}>
                          {lesson.completed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="h-3 w-3"></span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="block text-sm font-medium line-clamp-2">{lesson.title}</span>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {lesson.duration}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Add the new navigation options */}
          {renderAdditionalNavigation()}
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button 
        className="lg:hidden fixed bottom-5 right-5 z-10 bg-indigo-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setSidebarVisible(!sidebarVisible)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
    </div>
  );
};

export default CourseLearning;