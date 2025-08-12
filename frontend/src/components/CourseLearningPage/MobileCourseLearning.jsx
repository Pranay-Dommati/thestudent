import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaList, FaTimes, FaPlay, FaCheck, FaBook, FaQuestionCircle, FaDownload, FaGlobe } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LessonVideo from './LessonVideo';
import ResourcesPage from './templ/ResourcesPage';
import QuizIntro from './templ/QuizIntro';
import InstructionsPage from './templ/InstructionsPage';
import axios from 'axios';
import axiosInstance from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const MobileCourseLearning = ({ courseId, pathname, onSidebarToggle }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeTab, setActiveTab] = useState('about');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false); // Default closed on mobile
  const [contentType, setContentType] = useState('video');
  const [courseProgress, setCourseProgress] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // Reuse the same course fetching logic from the desktop version
  useEffect(() => {
    const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
    
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchRegularCourse(pathParts);
      } catch (error) {
        console.error('❌ Error fetching course data:', error);
        setError(error.message || 'Failed to load course data');
        setContentType('notFound');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRegularCourse = async (pathParts = pathname ? pathname.split('/').filter(Boolean) : []) => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        
        let apiUrl;
        let isSchoolCourse = false;
        
        if (pathParts.includes('6th') || pathParts.includes('7th') || pathParts.includes('8th') || pathParts.includes('9th') || pathParts.includes('10th') || pathParts.includes('11th') || pathParts.includes('12th')) {
          isSchoolCourse = true;
          const classLevel = pathParts.find(part => ['6th', '7th', '8th', '9th', '10th', '11th', '12th'].includes(part));
          const board = pathParts.find(part => ['cbse', 'state'].includes(part));
          
          if (board === 'state') {
            const stateIndex = pathParts.indexOf('state');
            if (stateIndex !== -1 && stateIndex + 1 < pathParts.length) {
              const stateId = pathParts[stateIndex + 1];
              const subjectId = pathParts[stateIndex + 2];
              const stateMap = {
                'ts': 'Telangana', 'ap': 'Andhra Pradesh', 'ka': 'Karnataka', 'tn': 'Tamil Nadu', 'kl': 'Kerala',
                'mh': 'Maharashtra', 'gj': 'Gujarat', 'rj': 'Rajasthan', 'ga': 'Goa',
                'dl': 'Delhi', 'pb': 'Punjab', 'hr': 'Haryana', 'hp': 'Himachal Pradesh', 'up': 'Uttar Pradesh', 'uk': 'Uttarakhand', 'jk': 'Jammu and Kashmir',
                'wb': 'West Bengal', 'bh': 'Bihar', 'jh': 'Jharkhand', 'or': 'Odisha', 'as': 'Assam', 'ml': 'Meghalaya', 'mn': 'Manipur', 'mz': 'Mizoram', 'nl': 'Nagaland', 'tr': 'Tripura', 'sk': 'Sikkim', 'ar': 'Arunachal Pradesh',
                'mp': 'Madhya Pradesh', 'cg': 'Chhattisgarh'
              };
              const stateName = stateMap[stateId] || stateId;
              apiUrl = `${API_BASE_URL}/courses/school/${classLevel}/${board}/${stateName}/${subjectId}/`;
            } else {
              throw new Error('Invalid state board URL format');
            }
          } else {
            const subjectId = pathParts[pathParts.indexOf(board) + 1];
            apiUrl = `${API_BASE_URL}/courses/school/${classLevel}/${board}/${subjectId}/`;
          }
        } else {
          apiUrl = `${API_BASE_URL}/courses/engineering/${courseId}/`;
        }

        console.log('🔥 Fetching course data from:', apiUrl);
        const response = await axios.get(apiUrl);
        const courseData = response.data;

        const transformedCourse = {
          id: courseData.id,
          title: courseData.title || courseData.name,
          description: courseData.description,
          instructor: courseData.instructor,
          chapters: courseData.chapters ? 
            courseData.chapters.map((chapter) => ({
              title: chapter.name,
              lessons: chapter.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                videoUrl: lesson.video_url,
                description: lesson.description,
                aboutLesson: lesson.about_lesson || lesson.aboutLesson,
                completed: lesson.completed || false,
                isAIGenerated: false,
                quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                resources: lesson.resources || { downloadable: [], internet: [] }
              })),
            }))
          : courseData.sections.map((section) => ({
              title: section.name,
              lessons: section.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                videoUrl: lesson.video_url,
                description: lesson.description,
                aboutLesson: lesson.about_lesson || lesson.aboutLesson,
                completed: lesson.completed || false,
                isAIGenerated: false,
                quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                resources: lesson.resources || { downloadable: [], internet: [] }
              })),
            }))
        };

        setCourse(transformedCourse);
        
        if (transformedCourse.chapters.length > 0) {
          setExpandedChapters({ 0: true });
        }
        
      } catch (error) {
        console.error('❌ Error fetching course data:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to load course content';
        setError(errorMessage);
        setCourse(null);
        setContentType('notFound');
      }
    };

    fetchData();
  }, [courseId, pathname]);

  // Progress tracking logic (reused from desktop)
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!isLoggedIn || !course || !course.id) return;
      
      try {
        const response = await axiosInstance.get(`/courses/progress/${course.id}/`);
        setCourseProgress(response.data);
        
        const updatedCourse = {...course};
        
        if (response.data.chapters) {
          response.data.chapters.forEach(chapter => {
            const chapterIndex = updatedCourse.chapters.findIndex(c => c.title === chapter.name);
            if (chapterIndex !== -1) {
              chapter.lessons.forEach(lessonProgress => {
                const lessonIndex = updatedCourse.chapters[chapterIndex].lessons.findIndex(l => 
                  l.title === lessonProgress.title
                );
                if (lessonIndex !== -1) {
                  updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = lessonProgress.completed;
                }
              });
            }
          });
        } else if (response.data.sections) {
          response.data.sections.forEach(section => {
            const sectionIndex = updatedCourse.chapters.findIndex(c => c.title === section.name);
            if (sectionIndex !== -1) {
              section.lessons.forEach(lessonProgress => {
                const lessonIndex = updatedCourse.chapters[sectionIndex].lessons.findIndex(l => 
                  l.title === lessonProgress.title
                );
                if (lessonIndex !== -1) {
                  updatedCourse.chapters[sectionIndex].lessons[lessonIndex].completed = lessonProgress.completed;
                }
              });
            }
          });
        }
        
        setCourse(updatedCourse);
        
      } catch (error) {
        console.error('❌ Error fetching user progress:', error);
      }
    };

    fetchUserProgress();
  }, [isLoggedIn, course?.id]);

  // Navigation helpers
  const handleLessonClick = (chapterIndex, lessonIndex) => {
    setActiveChapter(chapterIndex);
    setActiveLesson(lessonIndex);
    const lesson = course.chapters[chapterIndex]?.lessons[lessonIndex];
    
    if (lesson?.type === 'quiz') {
      setContentType('quiz');
    } else if (lesson?.type === 'instructions' || lesson?.type === 'reading') {
      setContentType('instructions');
    } else {
      setContentType('video');
    }
    
    setShowMobileMenu(false); // Close mobile menu when lesson is selected
    setActiveTab('about');
  };

  const toggleChapter = (chapterIndex) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterIndex]: !prev[chapterIndex]
    }));
  };

  const toggleLessonCompletion = async (chapterIndex, lessonIndex) => {
    if (!isLoggedIn) {
      toast.error('Please log in to track your progress');
      return;
    }

    const lesson = course.chapters[chapterIndex]?.lessons[lessonIndex];
    if (!lesson) return;

    setSavingProgress(true);
    
    try {
      const response = await axiosInstance.post('/courses/mark-lesson-completed/', {
        course_id: course.id,
        lesson_id: lesson.id,
        completed: !lesson.completed
      });

      if (response.status === 200) {
        const updatedCourse = { ...course };
        updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = !lesson.completed;
        setCourse(updatedCourse);
        
        toast.success(lesson.completed ? 'Lesson marked as incomplete' : 'Lesson completed!');
      }
    } catch (error) {
      console.error('❌ Error updating lesson completion:', error);
      toast.error('Failed to update lesson progress');
    } finally {
      setSavingProgress(false);
    }
  };

  const navigateToLesson = (direction) => {
    const totalLessons = course.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
    let currentIndex = 0;
    
    for (let i = 0; i < activeChapter; i++) {
      currentIndex += course.chapters[i].lessons.length;
    }
    currentIndex += activeLesson;
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0 || newIndex >= totalLessons) return;
    
    let newChapter = 0;
    let newLesson = newIndex;
    
    for (let i = 0; i < course.chapters.length; i++) {
      if (newLesson < course.chapters[i].lessons.length) {
        newChapter = i;
        break;
      }
      newLesson -= course.chapters[i].lessons.length;
      newChapter++;
    }
    
    handleLessonClick(newChapter, newLesson);
  };

  // Get current lesson
  const currentLesson = course?.chapters[activeChapter]?.lessons[activeLesson];
  const currentChapter = course?.chapters[activeChapter];

  // Calculate progress
  const completedLessons = course ? course.chapters.reduce((total, chapter) => 
    total + chapter.lessons.filter(lesson => lesson.completed).length, 0
  ) : 0;
  const totalLessons = course ? course.chapters.reduce((total, chapter) => 
    total + chapter.lessons.length, 0
  ) : 0;

  const renderContent = () => {
    if (!currentLesson) {
      return (
        <div className="p-4 text-center">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-4 text-sm">{error || "The content you're looking for could not be found."}</p>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => navigate('/learning-hub')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Go to Learning Hub
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Browse Courses
            </button>
          </div>
        </div>
      );
    }

    switch (contentType) {
      case 'resources':
        return <ResourcesPage lessonResources={currentLesson?.resources} />; 

      case 'quiz':
        const quizData = {
          title: currentLesson?.title || 'Quiz',
          description: currentLesson?.description || 'Test your knowledge',
          timeLimit: '15 minutes',
          totalQuestions: currentLesson?.quiz_questions?.length || currentLesson?.quizQuestions?.length || 0,
          passingScore: 80,
          attempts: 'Unlimited',
          questions: currentLesson?.quiz_questions || currentLesson?.quizQuestions || [],
          instructions: [
            'Read each question carefully before selecting your answer',
            'You can change your answers before submitting',
            'Make sure to answer all questions before submitting',
            'You need 80% or higher to pass this quiz'
          ]
        };
        return <QuizIntro quizData={quizData} lessonId={currentLesson?.id} />; 
        
      case 'instructions':
      case 'reading':
        return <InstructionsPage lessonContent={currentLesson} />;
        
      case 'video':
      default:
        return (
          <div className="pb-12"> {/* Reduced padding for compact navigation */}
            {/* Video Container - Full width, no padding */}
            <div className="mb-3">
              <div ref={videoRef} className="mb-3">
                <LessonVideo 
                  videoUrl={currentLesson?.videoUrl} 
                  title={currentLesson?.title}
                />
              </div>
              
              {/* Content Tabs - Mobile optimized */}
              <div className="border-b border-gray-200 mb-3 px-3">
                <nav className="flex space-x-6">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'about'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'resources'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    Resources
                  </button>
                </nav>
              </div>
              
              {/* Tab Content - Compact padding */}
              <div className="px-3">
                {activeTab === 'about' && (
                  <div className="prose prose-sm max-w-none">
                    {currentLesson?.aboutLesson ? (
                      <div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                            li: ({node, children, ...props}) => {
                              if (!children || (Array.isArray(children) && children.length === 0) || 
                                  (typeof children === 'string' && children.trim() === '')) {
                                return null;
                              }
                              return <li className="ml-1 my-1" {...props}>{children}</li>;
                            },
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold my-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold my-2" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-sm font-bold my-1" {...props} />,
                            p: ({node, children, ...props}) => {
                              if (!children || (Array.isArray(children) && children.length === 0) || 
                                  (typeof children === 'string' && children.trim() === '')) {
                                return null;
                              }
                              return <p className="my-2 leading-relaxed text-sm" {...props}>{children}</p>;
                            },
                            table: ({node, ...props}) => <div className="overflow-x-auto"><table className="min-w-full border border-gray-200 my-2 text-sm" {...props} /></div>,
                            th: ({node, ...props}) => <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 border border-gray-200" {...props} />,
                            td: ({node, ...props}) => <td className="px-2 py-1 text-xs text-gray-500 border border-gray-200" {...props} />,
                            code: ({node, inline, className, children, ...props}) => {
                              if (inline) {
                                return <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                              }
                              return (
                                <div className="bg-gray-800 rounded-md my-2">
                                  <pre className="p-3 overflow-x-auto">
                                    <code className="text-green-400 text-xs" {...props}>{children}</code>
                                  </pre>
                                </div>
                              )
                            },
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic text-gray-600 text-sm" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-600 underline" {...props} />,
                          }}
                        >
                          {currentLesson.aboutLesson}
                        </ReactMarkdown>
                      </div>
                    ) : currentLesson?.description ? (
                      <div>
                        <h3 className="text-base font-semibold mb-2">About This Lesson</h3>
                        <p className="text-gray-700 mb-3 text-sm">{currentLesson.description}</p>
                        <div className="mt-2">
                          <h4 className="font-medium mb-2 text-sm">What you'll learn:</h4>
                          <ul className="list-disc pl-4 space-y-1 text-gray-700 text-sm">
                            <li>Understanding the core concepts of {currentLesson.title}</li>
                            <li>Practical applications and real-world examples</li>
                            <li>Best practices and common techniques</li>
                            <li>Key takeaways for your learning journey</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-semibold mb-2">About This Lesson</h3>
                        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-500 text-sm">No description is available for this lesson.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'resources' && (
                  <ResourcesPage lessonResources={currentLesson?.resources} />
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header - Compact */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">{currentLesson?.title || 'Course Learning'}</h1>
            <p className="text-xs text-gray-500 truncate">{currentChapter?.title}</p>
          </div>
          <button
            onClick={() => setShowMobileMenu(true)}
            className="ml-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <FaList className="w-3 h-3" />
          </button>
        </div>
        
        {/* Compact Progress bar */}
        <div className="px-3 pb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-600">Progress</span>
            <span className="text-indigo-600 font-medium">{Math.round((completedLessons / totalLessons) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-12"> {/* Reduced bottom padding for more compact navigation */}
        {renderContent()}
      </div>

      {/* Mobile Navigation - Fixed Bottom - Compact */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-40 shadow-lg">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <button 
            onClick={() => navigateToLesson('prev')}
            disabled={activeChapter === 0 && activeLesson === 0}
            className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm ${
              activeChapter === 0 && activeLesson === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            <FaChevronLeft className="w-3 h-3 mr-1" />
            Prev
          </button>
          
          <button
            onClick={() => toggleLessonCompletion(activeChapter, activeLesson)}
            disabled={savingProgress}
            className={`p-2 rounded-full ${
              currentLesson?.completed
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } transition-colors`}
          >
            {savingProgress ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
            ) : (
              <FaCheck className="w-3 h-3" />
            )}
          </button>
          
          <button 
            onClick={() => navigateToLesson('next')}
            disabled={activeChapter === course?.chapters.length - 1 && activeLesson === course?.chapters[activeChapter]?.lessons.length - 1}
            className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm ${
              activeChapter === course?.chapters.length - 1 && activeLesson === course?.chapters[activeChapter]?.lessons.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } transition-colors`}
          >
            Next
            <FaChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      {/* Mobile Course Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform duration-300">
            {/* Menu Header - Compact */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h2 className="text-base font-bold">Course Content</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            {/* Course chapters list */}
            <div className="overflow-y-auto h-full pb-16">
              {course?.chapters?.map((chapter, chapterIndex) => (
                <div key={chapterIndex} className="border-b border-gray-100">
                  <button 
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                    onClick={() => toggleChapter(chapterIndex)}
                  >
                    <div className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                        {chapterIndex + 1}
                      </span>
                      <span className="font-medium text-sm">{chapter.title}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        {chapter.lessons.filter(l => l.completed).length}/{chapter.lessons.length}
                      </span>
                      <svg 
                        className={`h-3 w-3 text-gray-500 transform transition-transform ${
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
                  
                  {/* Lessons */}
                  {expandedChapters[chapterIndex] && (
                    <div className="bg-gray-50">
                      {chapter.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lessonIndex}
                          className={`w-full p-2 pl-10 flex items-center justify-between hover:bg-gray-100 transition-colors text-left ${
                            activeChapter === chapterIndex && activeLesson === lessonIndex
                              ? 'bg-indigo-50 border-r-2 border-indigo-500'
                              : ''
                          }`}
                          onClick={() => handleLessonClick(chapterIndex, lessonIndex)}
                        >
                          <div className="flex items-center">
                            <div className="mr-2">
                              {lesson.type === 'quiz' ? (
                                <FaQuestionCircle className="w-3 h-3 text-orange-500" />
                              ) : lesson.type === 'reading' || lesson.type === 'instructions' ? (
                                <FaBook className="w-3 h-3 text-blue-500" />
                              ) : (
                                <FaPlay className="w-3 h-3 text-indigo-500" />
                              )}
                            </div>
                            <span className="text-sm">{lesson.title}</span>
                          </div>
                          <div className="flex items-center">
                            {lesson.completed && (
                              <FaCheck className="w-3 h-3 text-green-500" />
                            )}
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
      )}
    </div>
  );
};

export default MobileCourseLearning;
