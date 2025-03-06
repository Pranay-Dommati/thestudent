import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LessonVideo from './LessonVideo';
import LessonNotes from './LessonNotes';
import CourseProgress from './CourseProgress';

const CourseLearning = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'notes', 'discussion'
  const navigate = useNavigate();

  // Simulated course data (in a real app, you'd fetch this from an API)
  useEffect(() => {
    setLoading(true);
    
    // Simulating API fetch
    setTimeout(() => {
      setCourse({
        id: courseId,
        title: "Master Next.js: From Zero to Production",
        instructor: {
          name: "John Doe",
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
      
      // Initialize expanded state for first chapter
      setExpandedChapters({0: true});
      setLoading(false);
    }, 800);
    
  }, [courseId]);

  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const selectLesson = (chapterIndex, lessonIndex) => {
    setActiveChapter(chapterIndex);
    setActiveLesson(lessonIndex);
    
    // Mark as expanded
    setExpandedChapters(prev => ({
      ...prev,
      [chapterIndex]: true
    }));
  };

  const markLessonComplete = () => {
    if (!course) return;
    
    const updatedCourse = {...course};
    updatedCourse.chapters[activeChapter].lessons[activeLesson].completed = true;
    setCourse(updatedCourse);
  };

  const goToNextLesson = () => {
    if (!course) return;
    
    // Mark current lesson as complete
    markLessonComplete();
    
    // Find the next lesson
    const currentChapter = course.chapters[activeChapter];
    
    if (activeLesson < currentChapter.lessons.length - 1) {
      // Next lesson in same chapter
      setActiveLesson(activeLesson + 1);
    } else if (activeChapter < course.chapters.length - 1) {
      // First lesson in next chapter
      setActiveChapter(activeChapter + 1);
      setActiveLesson(0);
      // Expand the chapter
      setExpandedChapters(prev => ({
        ...prev,
        [activeChapter + 1]: true
      }));
    } else {
      // Course completed
      alert("Congratulations! You've completed the course!");
    }
  };

  const getCurrentLesson = () => {
    if (!course) return null;
    return course.chapters[activeChapter].lessons[activeLesson];
  };

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
  
  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area (Video & Tabs) */}
        <div className="flex-1">
          {/* Course Header */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <button 
                onClick={() => navigate(`/courses/${courseId}`)}
                className="mr-2 text-indigo-600 hover:text-indigo-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">{course.title}</h1>
            </div>
            <p className="text-gray-600">Instructor: {course.instructor.name}</p>
          </div>
          
          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden shadow-lg mb-6">
            <LessonVideo 
              videoUrl={currentLesson.videoUrl} 
              title={currentLesson.title}
            />
          </div>
          
          {/* Tabs */}
          <div className="mb-6 border-b">
            <div className="flex space-x-6">
              <button 
                className={`py-4 font-medium ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('content')}
              >
                Content
              </button>
              <button 
                className={`py-4 font-medium ${activeTab === 'notes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('notes')}
              >
                Notes
              </button>
              <button 
                className={`py-4 font-medium ${activeTab === 'discussion' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('discussion')}
              >
                Discussion
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'content' && (
              <div>
                <h3 className="text-xl font-bold mb-4">{currentLesson.title}</h3>
                <p className="text-gray-700">
                  This lesson covers the essential concepts of {currentLesson.title.toLowerCase()}. 
                  You'll learn the fundamentals and how to apply them in real-world scenarios.
                </p>
                <div className="mt-6">
                  <h4 className="font-bold mb-2">Resources:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><a href="#" className="text-indigo-600 hover:text-indigo-800">Lesson slides</a></li>
                    <li><a href="#" className="text-indigo-600 hover:text-indigo-800">Code examples</a></li>
                    <li><a href="#" className="text-indigo-600 hover:text-indigo-800">Further reading</a></li>
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'notes' && (
              <LessonNotes lessonId={`${activeChapter}-${activeLesson}`} />
            )}
            
            {activeTab === 'discussion' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Discussion</h3>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    New Post
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
                      <div>
                        <h4 className="font-bold">Sarah M.</h4>
                        <p className="text-xs text-gray-500">Posted 2 days ago</p>
                      </div>
                    </div>
                    <p className="text-gray-700">
                      I'm having trouble understanding how dynamic routes work. Can someone explain?
                    </p>
                    <div className="mt-2 flex items-center text-sm">
                      <button className="text-gray-500 hover:text-indigo-600 mr-4">Reply</button>
                      <span className="text-gray-500">3 replies</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
                      <div>
                        <h4 className="font-bold">Mike T.</h4>
                        <p className="text-xs text-gray-500">Posted 5 days ago</p>
                      </div>
                    </div>
                    <p className="text-gray-700">
                      Great explanation of Next.js basics! The examples really helped me understand.
                    </p>
                    <div className="mt-2 flex items-center text-sm">
                      <button className="text-gray-500 hover:text-indigo-600 mr-4">Reply</button>
                      <span className="text-gray-500">1 reply</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button 
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              disabled={activeChapter === 0 && activeLesson === 0}
            >
              Previous Lesson
            </button>
            
            <button 
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              onClick={goToNextLesson}
            >
              {currentLesson.completed ? (
                "Next Lesson"
              ) : (
                <>
                  Mark as Complete
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Sidebar - Course Content */}
        <div className="w-full lg:w-1/3 xl:w-1/4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-bold">Course content</h2>
              <CourseProgress 
                completedLessons={course.chapters.reduce(
                  (acc, chapter) => acc + chapter.lessons.filter(l => l.completed).length, 0
                )}
                totalLessons={course.chapters.reduce(
                  (acc, chapter) => acc + chapter.lessons.length, 0
                )}
              />
            </div>
            
            <div className="max-h-[600px] overflow-y-auto">
              {course.chapters.map((chapter, chapterIndex) => (
                <div key={chapterIndex} className="border-b last:border-b-0">
                  <button 
                    className={`w-full p-4 flex justify-between items-center hover:bg-gray-50 ${activeChapter === chapterIndex ? 'bg-gray-50' : ''}`}
                    onClick={() => toggleChapter(chapterIndex)}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{chapter.title}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-2">
                        {chapter.lessons.filter(l => l.completed).length}/{chapter.lessons.length}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transform transition-transform ${expandedChapters[chapterIndex] ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedChapters[chapterIndex] && (
                    <div className="border-t">
                      {chapter.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lessonIndex}
                          className={`w-full p-3 pl-6 flex items-center hover:bg-gray-50 ${
                            activeChapter === chapterIndex && activeLesson === lessonIndex 
                              ? 'bg-indigo-50 text-indigo-700' 
                              : 'text-gray-700'
                          }`}
                          onClick={() => selectLesson(chapterIndex, lessonIndex)}
                        >
                          <div className={`w-5 h-5 mr-3 flex-shrink-0 rounded-full border flex items-center justify-center ${
                            lesson.completed ? 'bg-green-100 border-green-400' : 'border-gray-300'
                          }`}>
                            {lesson.completed && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="text-left">
                            <span className="block">{lesson.title}</span>
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
      </div>
    </div>
  );
};

export default CourseLearning;