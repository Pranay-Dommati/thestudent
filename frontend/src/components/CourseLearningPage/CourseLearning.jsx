import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LessonVideo from './LessonVideo';
import CourseProgress from './CourseProgress';
import ResourcesPage from './templ/ResourcesPage';
import QuizIntro from './templ/QuizIntro'; // Make sure to import QuizIntro instead of QuizzesPage directly
import InstructionsPage from './templ/InstructionsPage';
import Sidebar from './Sidebar';
import axios from 'axios';
import axiosInstance from '../../utils/axios'; // Import the configured axiosInstance with auth headers
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext'; // Import auth context

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
  const [courseProgress, setCourseProgress] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [internetResourcesOpen, setInternetResourcesOpen] = useState(false); // Initially closed
  const [downloadResourcesOpen, setDownloadResourcesOpen] = useState(false); // Initially closed
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth(); // Get authentication state

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        let apiUrl;
        const path = pathname;
        
        // Extract URL parameters manually from the pathname
        // Example URL: /courses/12th/state/ts/english/learning
        const pathParts = path.split('/').filter(part => part !== '');
        
        // Determine the type of course based on the URL path
        if (path.includes('/engineering/')) {
          // Engineering course
          apiUrl = `http://127.0.0.1:8000/api/courses/engineering/${params.courseId}/`;
          
          const response = await axiosInstance.get(apiUrl);
          const courseData = response.data;
          
          // Transform sections into chapters for the sidebar
          const transformedCourse = {
            ...courseData,
            chapters: courseData.sections.map((section) => ({
              title: section.name,
              lessons: section.lessons.map((lesson) => {
                // Format resources correctly
                let formattedResources = { downloadable: [], internet: [] };
                
                if (lesson.resources && Array.isArray(lesson.resources)) {
                  // Group resources by type
                  lesson.resources.forEach(resource => {
                    if (resource.type === 'downloadable') {
                      // Check if the URL is a relative path (doesn't start with http)
                      const fileLink = resource.url || resource.file;
                      const absoluteFileLink = fileLink && !fileLink.startsWith('http') ? 
                        `http://127.0.0.1:8000${fileLink}` : fileLink;
                        
                      formattedResources.downloadable.push({
                        name: resource.title,
                        description: resource.description || `Download ${resource.title}`, // Improved fallback with resource name
                        link: absoluteFileLink // Now using the absolute URL
                      });
                    } else if (resource.type === 'internet') {
                      formattedResources.internet.push({
                        name: resource.title,
                        description: resource.description || `Online resource for ${resource.title}`, // Improved fallback with resource name
                        link: resource.url
                      });
                    }
                  });
                }
                
                return {
                  title: lesson.title,
                  type: lesson.type,
                  videoUrl: lesson.video_url,
                  description: lesson.description,
                  aboutLesson: lesson.about_lesson,
                  resources: formattedResources,
                  completed: false // Default to not completed
                };
              }),
            })),
          };
          setCourse(transformedCourse);
          
          // Set initial content type based on the first lesson's type
          if (transformedCourse.chapters && 
              transformedCourse.chapters.length > 0 && 
              transformedCourse.chapters[0].lessons &&
              transformedCourse.chapters[0].lessons.length > 0) {
            const firstLessonType = transformedCourse.chapters[0].lessons[0].type;
            if (firstLessonType === 'reading') {
              setContentType('instructions');
            } else if (firstLessonType) {
              setContentType(firstLessonType);
            }
          }
        } else {
          // School course (10th, 11th, 12th)
          // Extract parameters from URL parts based on the URL pattern
          // Example URL: /courses/12th/state/ts/english/learning
          // Extract class level, board, state code, and subject from the URL parts
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
          
          // Convert state code to full state name if needed
          let stateName = null;
          if (stateCode) {
            stateName = stateCode === 'ts' ? 'Telangana' : 
                       stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
          }
          
          // First, fetch the list to get the course ID
          let listApiUrl;
          if (board === 'state' && stateName) {
            listApiUrl = `http://127.0.0.1:8000/api/courses/school/?class=${classLevel}&board=${board}&state=${stateName}&subject=${subject}`;
          } else {
            listApiUrl = `http://127.0.0.1:8000/api/courses/school/?class=${classLevel}&board=${board}&subject=${subject}`;
          }
          
          const listResponse = await axiosInstance.get(listApiUrl);
          let courseId;
          
          if (Array.isArray(listResponse.data) && listResponse.data.length > 0) {
            // More precise matching to prevent "Science" vs "Social Science" confusion
            const matchedCourse = listResponse.data.find(course => {
              const courseSubject = (course.subject || '').toLowerCase().trim();
              const urlSubject = (subject || '').toLowerCase().trim();
              
              // First try for an exact match (ignoring case)
              if (courseSubject === urlSubject) {
                return true;
              }
              
              // Special case for Social vs Social Science (legacy support)
              if ((urlSubject === "social" && (courseSubject === "social science" || courseSubject === "social")) ||
                  (courseSubject === "social" && (urlSubject === "social science" || urlSubject === "social"))) {
                return true;
              }
              
              // If no exact match and URL is "science", make sure we don't match "social science"
              if (urlSubject === "science" && courseSubject.includes("social")) {
                return false;
              }
              
              // Prevent "science" from matching "social science" when looking for science courses
              if ((urlSubject === "social" || urlSubject === "social science") && courseSubject === "science") {
                return false;
              }
              
              // Fallback to more flexible matching
              return courseSubject.includes(urlSubject) || urlSubject.includes(courseSubject);
            });
            
            if (matchedCourse) {
              courseId = matchedCourse.id;
            } else if (listResponse.data.length > 0) {
              courseId = listResponse.data[0].id;
            }
          }
          
          // Now fetch the detailed course data using the specific ID
          if (courseId) {
            const detailApiUrl = `http://127.0.0.1:8000/api/courses/school/${courseId}/`;
            const detailResponse = await axiosInstance.get(detailApiUrl);
            const courseData = detailResponse.data;
            
            // Transform the course data with proper structure
            const transformedCourse = {
              ...courseData,
              chapters: courseData.chapters && courseData.chapters.length > 0 
                ? courseData.chapters.map((chapter) => ({
                    title: chapter.name,
                    lessons: chapter.lessons && chapter.lessons.length > 0
                      ? chapter.lessons.map((lesson) => {
                          // Format resources correctly
                          let formattedResources = { downloadable: [], internet: [] };
                          
                          if (lesson.resources && Array.isArray(lesson.resources)) {
                            // Group resources by type
                            lesson.resources.forEach(resource => {
                              if (resource.type === 'downloadable') {
                                // Check if the URL is a relative path (doesn't start with http)
                                const fileLink = resource.url || resource.file;
                                const absoluteFileLink = fileLink && !fileLink.startsWith('http') ? 
                                  `http://127.0.0.1:8000${fileLink}` : fileLink;
                                  
                                formattedResources.downloadable.push({
                                  name: resource.title,
                                  description: resource.description || `Download ${resource.title}`, // Improved fallback with resource name
                                  link: absoluteFileLink // Now using the absolute URL
                                });
                              } else if (resource.type === 'internet') {
                                formattedResources.internet.push({
                                  name: resource.title,
                                  description: resource.description || `Online resource for ${resource.title}`, // Improved fallback with resource name
                                  link: resource.url
                                });
                              }
                            });
                          }
                          
                          return {
                            title: lesson.title,
                            type: lesson.type || 'video',
                            videoUrl: lesson.video_url || '',
                            description: lesson.description || '',
                            aboutLesson: lesson.about_lesson || '',
                            resources: formattedResources,
                            completed: false
                          };
                        })
                      : [{
                          title: "Introduction to " + chapter.name,
                          type: 'video',
                          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                          description: "Introduction to this chapter",
                          aboutLesson: "Basic introduction to the concepts in this chapter",
                          resources: { downloadable: [], internet: [] },
                          completed: false
                        }]
                  })) 
                : [{
                    title: "Main Content",
                    lessons: [{
                      title: courseData.title || "Introduction",
                      type: 'video',
                      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Default video if none is provided
                      description: courseData.description || '',
                      resources: { downloadable: [], internet: [] }, // Empty resources
                      completed: false
                    }]
                  }]
            };
            setCourse(transformedCourse);
            
            // Set initial content type based on the first lesson's type
            if (transformedCourse.chapters && 
                transformedCourse.chapters.length > 0 && 
                transformedCourse.chapters[0].lessons &&
                transformedCourse.chapters[0].lessons.length > 0) {
              const firstLessonType = transformedCourse.chapters[0].lessons[0].type;
              if (firstLessonType === 'reading') {
                setContentType('instructions');
              } else if (firstLessonType) {
                setContentType(firstLessonType);
              }
            }
          } else {
            throw new Error("Course not found");
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
        // Set up a fallback course with default content when API fails
        const pathParts = pathname.split('/').filter(part => part !== '');
        if (pathParts.length >= 4) {
          const classLevel = pathParts[1];
          const board = pathParts[2];
          const subject = pathParts[pathParts.length - 2]; // Get the subject from URL
          
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

  // Add a useEffect to fetch user progress when course data is loaded
  useEffect(() => {
    // Only fetch progress if the user is logged in and we have a course
    const fetchUserProgress = async () => {
      if (!isLoggedIn || !course || !course.id) return;
      
      try {
        // Call the backend API to get the user's progress for this course
        const response = await axiosInstance.get(`http://127.0.0.1:8000/api/courses/progress/${course.id}/`);
        
        setCourseProgress(response.data);
        
        // Update the course lessons with completion status from the API
        const updatedCourse = {...course};
        
        // Check if it's a school course with chapters
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
        } 
        // Check if it's an engineering course with sections
        else if (response.data.sections) {
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
        
        // Use a ref to track if this is the initial load to prevent infinite loops
        setCourse(updatedCourse);
        
      } catch (error) {
        console.error('Error fetching user progress:', error);
        // Don't show error toast if 401 Unauthorized (user not logged in)
        if (error.response?.status !== 401) {
          toast.error('Failed to load your course progress');
        }
      }
    };
    
    fetchUserProgress();
  // Only run this effect when the course ID changes or login status changes,
  // not when the course content itself changes
  }, [course?.id, isLoggedIn]);

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
  const markLessonComplete = async () => {
    if (!course || !isLoggedIn) return;
    
    const currentLesson = course.chapters[activeChapter].lessons[activeLesson];
    if (currentLesson.completed) return; // Already completed
    
    setSavingProgress(true);
    
    try {
      // Look for the actual lesson ID in our courseProgress data
      let lessonId;
      
      if (courseProgress) {
        if (courseProgress.chapters) {
          // For school courses
          for (const chapter of courseProgress.chapters) {
            if (chapter.name === course.chapters[activeChapter].title) {
              const lessonData = chapter.lessons.find(l => l.title === currentLesson.title);
              if (lessonData) {
                lessonId = lessonData.id;
                break;
              }
            }
          }
        } else if (courseProgress.sections) {
          // For engineering courses
          for (const section of courseProgress.sections) {
            if (section.name === course.chapters[activeChapter].title) {
              const lessonData = section.lessons.find(l => l.title === currentLesson.title);
              if (lessonData) {
                lessonId = lessonData.id;
                break;
              }
            }
          }
        }
      }
      
      if (!lessonId) {
        console.warn("Lesson ID not found in progress data. Progress won't be saved.");
        return;
      }
      
      // Call the API to toggle lesson completion
      const response = await axiosInstance.post(
        `http://127.0.0.1:8000/api/lessons/complete/${lessonId}/`,
        {},
        { withCredentials: true }
      );
      
      // Update the local course state
      const updatedCourse = {...course};
      updatedCourse.chapters[activeChapter].lessons[activeLesson].completed = true;
      setCourse(updatedCourse);
      
      // Update progress data
      setCourseProgress(prevProgress => {
        if (!prevProgress) return response.data;
        
        return {
          ...prevProgress,
          progress: response.data.progress
        };
      });
      
    } catch (error) {
      console.error('Error saving lesson progress:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to save your progress');
      } else {
        toast.error('Failed to save your progress');
      }
    } finally {
      setSavingProgress(false);
    }
  };

  // Toggle lesson completion status
  const toggleLessonCompletion = async (chapterIndex, lessonIndex) => {
    if (!course || !isLoggedIn) return;
    
    const lesson = course.chapters[chapterIndex].lessons[lessonIndex];
    setSavingProgress(true);
    
    try {
      // Look for the actual lesson ID in our courseProgress data
      let lessonId;
      
      if (courseProgress) {
        if (courseProgress.chapters) {
          // For school courses
          for (const chapter of courseProgress.chapters) {
            if (chapter.name === course.chapters[chapterIndex].title) {
              const lessonData = chapter.lessons.find(l => l.title === lesson.title);
              if (lessonData) {
                lessonId = lessonData.id;
                break;
              }
            }
          }
        } else if (courseProgress.sections) {
          // For engineering courses
          for (const section of courseProgress.sections) {
            if (section.name === course.chapters[chapterIndex].title) {
              const lessonData = section.lessons.find(l => l.title === lesson.title);
              if (lessonData) {
                lessonId = lessonData.id;
                break;
              }
            }
          }
        }
      }
      
      if (!lessonId) {
        console.warn("Lesson ID not found in progress data. Progress won't be saved.");
        return;
      }
      
      // Call the API to toggle lesson completion
      const response = await axiosInstance.post(
        `http://127.0.0.1:8000/api/lessons/complete/${lessonId}/`,
        {},
        { withCredentials: true }
      );
      
      // Update the local course state based on the response
      const updatedCourse = {...course};
      const newCompletionStatus = response.data.status === 'complete';
      updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = newCompletionStatus;
      setCourse(updatedCourse);
      
      // Update progress data
      setCourseProgress(prevProgress => {
        if (!prevProgress) return response.data;
        
        return {
          ...prevProgress,
          progress: response.data.progress
        };
      });
      
    } catch (error) {
      console.error('Error toggling lesson completion:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to save your progress');
      } else {
        toast.error('Failed to save your progress');
      }
    } finally {
      setSavingProgress(false);
    }
  };

  // Navigate to next lesson
  const goToNextLesson = async () => {
    if (!course) return;
    
    // If not already completed, mark the lesson as complete
    if (!currentLesson.completed) {
      await markLessonComplete();
    }
    
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
      toast.success("🎉 Congratulations! You've completed the course!");
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
    // Only update state if we're actually changing lessons to prevent re-renders
    if (activeChapter !== chapterIndex || activeLesson !== lessonIndex) {
      setActiveChapter(chapterIndex);
      setActiveLesson(lessonIndex);
      
      // Set content type based on the lesson type
      if (lesson.type) {
        // Map 'reading' type to 'instructions' content type for UI rendering
        if (lesson.type === 'reading') {
          setContentType('instructions');
        } else {
          setContentType(lesson.type);
        }
      } else {
        setContentType('video'); // Default to video
      }
      
      // Expand the chapter
      if (!expandedChapters[chapterIndex]) {
        setExpandedChapters(prev => ({
          ...prev,
          [chapterIndex]: true
        }));
      }
      
      // Only scroll to video ref if it's a video content type
      if (lesson.type === 'video' && videoRef.current) {
        videoRef.current.scrollIntoView({ behavior: 'smooth' });
      }
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
      case 'reading':
        return <InstructionsPage lessonContent={currentLesson} />; // Pass the current lesson content
        
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
                  Additional Resources
                </button>
                {/* Remove the Transcript tab button */}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'content' && (
                <div className="prose prose-lg max-w-none markdown-body">                  {currentLesson.aboutLesson ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />,
                        li: ({node, children, ordered, ...props}) => {
                          // Skip rendering empty list items
                          if (!children || (Array.isArray(children) && children.length === 0) || 
                              (typeof children === 'string' && children.trim() === '')) {
                            return null;
                          }
                          return <li className="ml-2 my-1" {...props}>{children}</li>;
                        },
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold my-3" {...props} />,
                        p: ({node, children, ...props}) => {
                          // Skip rendering empty paragraphs
                          if (!children || (Array.isArray(children) && children.length === 0) || 
                              (typeof children === 'string' && children.trim() === '')) {
                            return null;
                          }
                          return <p className="my-4" {...props}>{children}</p>;
                        },
                        // Add table rendering components
                        table: ({node, ...props}) => <table className="min-w-full border border-gray-200 my-4" {...props} />,
                        thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                        tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200" {...props} />,
                        tr: ({node, ...props}) => <tr className="hover:bg-gray-50" {...props} />,
                        th: ({node, ...props}) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border border-gray-200" {...props} />,
                        td: ({node, ...props}) => <td className="px-4 py-2 text-sm text-gray-500 border border-gray-200" {...props} />,
                      }}
                    >
                      {currentLesson.aboutLesson}
                    </ReactMarkdown>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
              
              {activeTab === 'resources' && (
                <div>
                  <div className="space-y-6">
                    {/* Internet Resources collapsible section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button 
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        onClick={() => setInternetResourcesOpen(!internetResourcesOpen)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                            {/* Changed icon style to be more clear and properly sized */}
                            <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                          </div>
                          <div className="text-left">
                            <h4 className="font-medium">Internet Resources</h4>
                            <p className="text-sm text-gray-600 mt-1">Online documentation and references</p>
                          </div>
                        </div>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${internetResourcesOpen ? 'transform rotate-180' : ''}`} 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Internet Resources content - collapsible */}
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${internetResourcesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 border-t border-gray-100 space-y-3">
                          {currentLesson && currentLesson.resources && currentLesson.resources.internet && currentLesson.resources.internet.length > 0 ? (
                            currentLesson.resources.internet.map((resource, index) => (
                              <div key={`internet-${index}`} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                                <div>
                                  <h5 className="font-medium text-gray-800">{resource.name}</h5>
                                  <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                                </div>
                                <a
                                  href={resource.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                  Open Link
                                </a>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500">No internet resources available for this lesson</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Downloadable Resources collapsible section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button 
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        onClick={() => setDownloadResourcesOpen(!downloadResourcesOpen)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 rounded-lg p-2 flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <h4 className="font-medium">Downloadable Resources</h4>
                            <p className="text-sm text-gray-600 mt-1">Files and documents to download</p>
                          </div>
                        </div>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${downloadResourcesOpen ? 'transform rotate-180' : ''}`} 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Downloadable Resources content - collapsible */}
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${downloadResourcesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 border-t border-gray-100 space-y-3">
                          {currentLesson && currentLesson.resources && currentLesson.resources.downloadable && currentLesson.resources.downloadable.length > 0 ? (
                            // Map through and display actual downloadable resources
                            currentLesson.resources.downloadable.map((resource, index) => (
                              <div key={`download-${index}`} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                                <div>
                                  <h5 className="font-medium text-gray-800">{resource.name}</h5>
                                  <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                                </div>
                                <a
                                  href={resource.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-green-50 text-green-600 rounded text-sm font-medium hover:bg-green-100 transition-colors flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </a>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500">No downloadable resources available for this lesson</div>
                          )}
                        </div>
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
                className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                  savingProgress ? 'bg-gray-400 cursor-not-allowed' : 
                  'bg-indigo-600 hover:bg-indigo-700 transition-colors'
                } text-white`}
                onClick={goToNextLesson}
                disabled={savingProgress}
              >
                {savingProgress ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    {currentLesson.completed ? "Next Lesson" : "Mark as Complete"}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10 10l-2.707-2.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
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
          toggleLessonCompletion={toggleLessonCompletion} // Pass the function to toggle lesson completion
        />
      </div>
    </div>
  );
};

export default CourseLearning;