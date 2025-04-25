import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import LessonVideo from './LessonVideo';
import CourseProgress from './CourseProgress';
import ResourcesPage from './templ/ResourcesPage';
import QuizIntro from './templ/QuizIntro'; // Make sure to import QuizIntro instead of QuizzesPage directly
import InstructionsPage from './templ/InstructionsPage';
import Sidebar from './Sidebar';
import axios from 'axios';

// Update the function signature to accept the new props
const CourseLearning = ({ params, pathname, onSidebarToggle }) => {
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
  const location = useLocation();

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        let apiUrl;
        const path = pathname;
        
        // Extract URL parameters manually from the pathname
        // Example URL: /courses/12th/state/ts/english/learning
        const pathParts = path.split('/').filter(part => part !== '');
        
        console.log("Path parts:", pathParts);
        
        // Determine the type of course based on the URL path
        if (path.includes('/engineering/')) {
          // Engineering course
          apiUrl = `http://127.0.0.1:8000/api/courses/engineering/${params.courseId}/`;
          
          const response = await axios.get(apiUrl);
          const courseData = response.data;
          console.log("Fetched Engineering Course Data:", courseData);
          
          // Transform sections into chapters for the sidebar
          const transformedCourse = {
            ...courseData,
            chapters: courseData.sections.map((section) => ({
              title: section.name,
              lessons: section.lessons.map((lesson) => ({
                title: lesson.title,
                type: lesson.type,
                videoUrl: lesson.video_url,
                description: lesson.description,
                aboutLesson: lesson.about_lesson,
                completed: false // Default to not completed
              })),
            })),
          };
          setCourse(transformedCourse);
        } else {
          // School course (10th, 11th, 12th)
          // Extract parameters from URL parts based on the URL pattern
          let classLevel, board, stateCode, subject;
          
          if (pathParts.length >= 4) {
            classLevel = pathParts[1]; // e.g., '10th', '11th', '12th'
            board = pathParts[2];      // e.g., 'cbse', 'state'
            
            if (board === 'state' && pathParts.length >= 5) {
              stateCode = pathParts[3];  // e.g., 'ts', 'ap'
              subject = pathParts[4];    // e.g., 'english', 'math'
            } else {
              subject = pathParts[3];    // For CBSE, subject is the 4th part
            }
          }
          
          console.log("Extracted parameters:", { classLevel, board, stateCode, subject });
          
          // Convert state code to full state name if needed
          let stateName = null;
          if (stateCode) {
            stateName = stateCode === 'ts' ? 'Telangana' : 
                       stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
          }
          
          // Build the API URL
          if (board === 'state' && stateName) {
            apiUrl = `http://127.0.0.1:8000/api/courses/school/?class=${classLevel}&board=${board}&state=${stateName}&subject=${subject}`;
          } else {
            apiUrl = `http://127.0.0.1:8000/api/courses/school/?class=${classLevel}&board=${board}&subject=${subject}`;
          }
          
          console.log("Fetching from API URL:", apiUrl);
          const response = await axios.get(apiUrl);
          let courseData;
          
          if (Array.isArray(response.data)) {
            console.log("API response courses:", response.data);
            console.log("Looking for subject:", subject);
            
            // More flexible matching - convert to lowercase and trim whitespace
            courseData = response.data.find(course => {
              const courseSubject = (course.subject || '').toLowerCase().trim();
              const urlSubject = (subject || '').toLowerCase().trim();
              console.log(`Comparing '${courseSubject}' with '${urlSubject}'`);
              return courseSubject === urlSubject;
            });
            
            if (!courseData) {
              // If exact match fails, try a more relaxed matching approach
              console.log("Exact match failed, trying partial match...");
              courseData = response.data.find(course => {
                const courseSubject = (course.subject || '').toLowerCase().trim();
                const urlSubject = (subject || '').toLowerCase().trim();
                return courseSubject.includes(urlSubject) || urlSubject.includes(courseSubject);
              });
            }
            
            if (!courseData && response.data.length > 0) {
              // If all matching fails but we have courses, use the first one as fallback
              console.log("No matching course found, using first available course as fallback");
              courseData = response.data[0];
            }
            
            if (!courseData) {
              // If the array is empty or no match found, create a default course template
              console.log("No courses returned from API, creating default template");
              courseData = {
                id: 1,
                title: `${classLevel} ${board.toUpperCase()} ${subject}`,
                subject: subject || "General Course",
                description: "Course content coming soon",
                chapters: []
              };
            }
            
            console.log("Found/created school course:", courseData);
            
            // For school courses, we need to transform the structure
            const transformedCourse = {
              ...courseData,
              chapters: courseData.chapters && courseData.chapters.length > 0 
                ? courseData.chapters.map((chapter) => ({
                  title: chapter.name,
                  lessons: chapter.lessons.map((lesson) => ({
                    title: lesson.title,
                    type: lesson.type || 'video',
                    videoUrl: lesson.videoUrl || lesson.video_url,
                    description: lesson.description || '',
                    aboutLesson: lesson.aboutLesson || '',
                    completed: false
                  }))
                })) 
                : [{
                  title: "Main Content",
                  lessons: [{
                    title: courseData.title || "Introduction",
                    type: 'video',
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Default video if none is provided
                    description: courseData.description || '',
                    completed: false
                  }]
                }]
            };
            setCourse(transformedCourse);
          } else {
            console.error("Unexpected API response format", response.data);
            throw new Error("Invalid API response format");
          }
        }

        // Expand the first chapter by default
        setCourse(prevCourse => {
          if (prevCourse?.chapters && prevCourse.chapters.length > 0) {
            setExpandedChapters({ 0: true });
          }
          return prevCourse;
        });
      } catch (error) {
        console.error('Error fetching course data:', error);
        
        // Set up a fallback course with default content when API fails
        const pathParts = pathname.split('/').filter(part => part !== '');
        if (pathParts.length >= 4) {
          const classLevel = pathParts[1];
          const board = pathParts[2];
          const subject = pathParts[pathParts.length - 2]; // Get the subject from URL
          
          console.log("Creating fallback course for:", { classLevel, board, subject });
          
          const fallbackCourse = {
            id: 1,
            title: `${classLevel} ${board.toUpperCase()} ${subject}`,
            subject: subject || "General Course",
            description: "This is a placeholder course while we prepare the full content.",
            chapters: [{
              title: "Getting Started",
              lessons: [{
                title: "Introduction",
                type: 'video',
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                description: "Welcome to the course! More content will be added soon.",
                aboutLesson: "This is a placeholder lesson.",
                completed: false
              }]
            }]
          };
          
          setCourse(fallbackCourse);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [pathname, params]);

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

  // Handle lesson click
  const handleLessonClick = (chapterIndex, lessonIndex) => {
    const lesson = course.chapters[chapterIndex].lessons[lessonIndex];
    setActiveChapter(chapterIndex);
    setActiveLesson(lessonIndex);
    
    // Important: Set the content type based on the lesson type
    console.log("Lesson clicked:", lesson.title, "Type:", lesson.type);
    setContentType(lesson.type || 'video');
    
    // Expand the chapter
    setExpandedChapters(prev => ({
      ...prev,
      [chapterIndex]: true
    }));
    
    // Only scroll to video ref if it's a video content type
    if (lesson.type === 'video' && videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add effect to notify parent when sidebar visibility changes
  useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(sidebarVisible);
    }
  }, [sidebarVisible, onSidebarToggle]);

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
    const currentLesson = getCurrentLesson();
    console.log("Rendering content for type:", contentType);
    
    switch(contentType) {
      case 'resources':
        return <ResourcesPage />; // Removed the white container div
        
      case 'quiz':
        return (
          <QuizIntro 
            quizData={{
              title: currentLesson.title,
              description: "Test your understanding of the concepts covered in this lesson",
              timeLimit: "15 minutes",
              totalQuestions: 5,
              passingScore: 80,
              attempts: "Unlimited",
              instructions: [
                "Read each question carefully",
                "You can review your answers before submission",
                "You need to score 80% or higher to pass",
                "You can retake the quiz if needed"
              ]
            }}
          /> // Removed the white container div
        );
        
      case 'instructions':
        return <InstructionsPage />; // Removed the white container div
        
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
                {/* Remove the Transcript tab button */}
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
              
              {/* Remove the transcript tab content section */}
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

  // In the return statement, remove the footer and adjust the layout:
  return (
    <div className="min-h-screen flex">
      {/* Main Content Area - Adjust width to fill available space */}
      <div className="flex-1 flex flex-col">
        {/* Content Container - Fixed right margin to match sidebar exactly */}
        <div className={`transition-all duration-300 ${sidebarVisible ? 'mr-[400px]' : ''}`}>
          <div className="p-5 w-full">
            {/* Video content navigation */}
            {contentType === 'video' && (
              <div className="mb-6">
                <nav className="flex items-center text-sm text-gray-600">
                  <span>Course</span>
                  <span className="mx-2">•</span>
                  <span>{course.chapters[activeChapter].title}</span>
                  <span className="mx-2">•</span>
                  <span>{currentLesson.title}</span>
                </nav>
              </div>
            )}

            {/* Dynamic Content */}
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Always visible sidebar toggle button positioned at the top of sidebar */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className={`fixed top-17 transition-all duration-300 ${
          sidebarVisible ? 'right-[400px]' : 'right-0'
        } transform bg-white p-3 shadow-md rounded-l-lg z-40 hover:bg-gray-50`}
        aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarVisible ? 
          <FaChevronRight className="w-5 h-5 text-gray-600" /> : 
          <FaChevronLeft className="w-5 h-5 text-gray-600" />
        }
      </button>

      {/* Sidebar - Keep fixed width */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[400px] bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-30 ${
          sidebarVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Sidebar
          isSidebarOpen={sidebarVisible}
          course={course}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          expandedChapters={expandedChapters}
          activeChapter={activeChapter}
          activeLesson={activeLesson}
          handleLessonClick={handleLessonClick}
          completedLessons={completedLessons}
          totalLessons={totalLessons}
          toggleChapter={toggleChapter}
          toggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        />
      </div>
    </div>
  );
};

export default CourseLearning;