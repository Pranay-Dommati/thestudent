import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import LessonVideo from './LessonVideo';
import CourseProgress from './CourseProgress';
import ResourcesPage from './templ/ResourcesPage';
import QuizIntro from './templ/QuizIntro'; // Make sure to import QuizIntro instead of QuizzesPage directly
import InstructionsPage from './templ/InstructionsPage';
import Sidebar from './Sidebar';
import axios from 'axios';

// Update the function signature to accept pathname and onSidebarToggle prop
const CourseLearning = ({ courseId, pathname, onSidebarToggle }) => {
  const [course, setCourse] = useState(null);
  const [learningPlans, setLearningPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeTab, setActiveTab] = useState('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [contentType, setContentType] = useState('video'); // 'video', 'resources', 'quiz', 'instructions'
  const [isAIGeneratedPlan, setIsAIGeneratedPlan] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Extract URL path to determine course type and proper API endpoint
    const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
    
    // Check if this is a direct learning plan route (/learning/:id)
    const isDirectLearningPlanRoute = pathParts[0] === 'learning' && pathParts.length > 1;
    const learningPlanId = isDirectLearningPlanRoute ? pathParts[1] : null;
    
    // Check if this is an AI-generated learning plan by UUID format
    const isLearningPlanId = courseId && courseId.length === 36 && courseId.includes('-') || // UUID format check
                           learningPlanId !== null; // Direct learning route check

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check first if this is an AI-generated learning plan
        if (isLearningPlanId) {
          try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
            const planId = learningPlanId || courseId;
            console.log(`🔍 Fetching AI learning plan with ID: ${planId}`);
            console.log(`🌐 Making request to: ${API_BASE_URL}/learning/plans/${planId}/`);
            
            const response = await axios.get(`${API_BASE_URL}/learning/plans/${planId}/`);
            const planData = response.data;
            console.log("✅ Fetched AI Learning Plan successfully:", planData);
            
            // Transform learning plan days into chapters for the sidebar
            const transformedPlan = {
              id: planData.id,
              title: planData.title,
              description: planData.description || "AI-generated learning plan",
              chapters: planData.days.map((day) => ({
                title: `Day ${day.day}: ${day.topic}`,
                lessons: day.videos.map((video) => ({
                  title: video.title,
                  type: 'video',
                  videoUrl: video.video_id ? `https://www.youtube.com/embed/${video.video_id}` : 
                    (video.url && video.url.includes('youtube.com/watch?v=') ? 
                      `https://www.youtube.com/embed/${video.url.split('v=')[1].split('&')[0]}` : 
                      video.url || ''),
                  description: video.description || "",
                  completed: false,
                  isAIGenerated: true
                })),
              })),
            };
            
            console.log("🔄 Transformed learning plan:", transformedPlan);
            setCourse(transformedPlan);
            setIsAIGeneratedPlan(true);
            
            // Expand the first chapter by default
            if (transformedPlan.chapters.length > 0) {
              setExpandedChapters({ 0: true });
            }
            
            console.log("✅ Learning plan loaded successfully!");
            return; // Exit early since we successfully loaded the plan
          } catch (error) {
            console.error('❌ Error fetching AI learning plan:', error);
            console.error('Error details:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              url: error.config?.url
            });
            // If AI plan fetch fails, try regular course as fallback
            await fetchRegularCourse(pathParts);
          }
        } else {
          // Fetch regular course data
          await fetchRegularCourse(pathParts);
        }
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRegularCourse = async (pathParts = pathname ? pathname.split('/').filter(Boolean) : [], isLearningPlanIdParam = false) => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        
        // Extract proper course type and ID from URL path
        let apiUrl;
        let isSchoolCourse = false;
        
        // Check if it's a school course (e.g., /courses/10th/cbse/math/learning)
        if (pathParts.includes('10th') || pathParts.includes('11th') || pathParts.includes('12th')) {
          isSchoolCourse = true;
          const classLevel = pathParts.find(part => ['10th', '11th', '12th'].includes(part));
          const board = pathParts.find(part => ['cbse', 'state'].includes(part));
          
          // Handle state board case which has an additional parameter
          if (board === 'state') {
            const stateIndex = pathParts.indexOf('state');
            if (stateIndex !== -1 && stateIndex + 1 < pathParts.length) {
              const stateId = pathParts[stateIndex + 1];
              const subjectId = pathParts[stateIndex + 2];
              apiUrl = `${API_BASE_URL}/courses/school/?class=${classLevel}&board=${board}&state=${stateId}&subject=${subjectId}`;
            }
          } else {
            const subjectIndex = pathParts.indexOf(board) + 1;
            if (subjectIndex < pathParts.length) {
              const subjectId = pathParts[subjectIndex];
              apiUrl = `${API_BASE_URL}/courses/school/?class=${classLevel}&board=${board}&subject=${subjectId}`;
            }
          }
        } else {
          // Engineering course
          apiUrl = `${API_BASE_URL}/courses/engineering/${courseId}/`;
        }
        
        if (!apiUrl) {
          throw new Error("Could not determine API URL from path");
        }
        
        const response = await axios.get(apiUrl);
        let courseData;
        
        if (isSchoolCourse && Array.isArray(response.data) && response.data.length > 0) {
          // For school courses, we get a list, so take the first matching course
          courseData = response.data[0];
          // Now fetch the complete course details
          const detailResponse = await axios.get(`${API_BASE_URL}/courses/school/${courseData.id}/`);
          courseData = detailResponse.data;
        } else {
          courseData = response.data;
        }
        
        console.log("Fetched Course Data:", courseData);
        
        // Transform sections or chapters into a consistent format for the sidebar
        const transformedCourse = {
          ...courseData,
          chapters: isSchoolCourse 
            ? courseData.chapters.map((chapter) => ({
                title: chapter.name,
                lessons: chapter.lessons.map((lesson) => ({
                  title: lesson.title,
                  type: lesson.type,
                  videoUrl: lesson.video_url,
                  description: lesson.description,
                  completed: false,
                  isAIGenerated: false
                })),
              }))
            : courseData.sections.map((section) => ({
                title: section.name,
                lessons: section.lessons.map((lesson) => ({
                  title: lesson.title,
                  type: lesson.type,
                  videoUrl: lesson.video_url,
                  description: lesson.description,
                  completed: false,
                  isAIGenerated: false
                })),
              })),
        };

        setCourse(transformedCourse);
        setIsAIGeneratedPlan(false);
        
        // Expand the first chapter by default
        if (transformedCourse.chapters.length > 0) {
          setExpandedChapters({ 0: true });
        }
        
        // Also fetch AI-generated learning plans to display in sidebar
        fetchAILearningPlans();
      } catch (error) {
        console.error('❌ Error fetching course data:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
          isLearningPlanId: isLearningPlanId
        });
        
        // Create a fallback course if all attempts fail
        const fallbackCourse = {
          id: courseId,
          title: "Placeholder Course",
          description: "We're having trouble loading the course content. Please try again later.",
          chapters: [{
            title: "Introduction",
            lessons: [{
              title: "Getting Started",
              type: 'video',
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder video
              description: "Placeholder content",
              completed: false
            }]
          }]
        };
        
        setCourse(fallbackCourse);
        
        // Check if it was a learning plan that couldn't be loaded
        if (isLearningPlanId) {
          console.log("🚨 Setting contentType to 'notFound' for learning plan");
          setContentType('notFound'); // Special content type for not found learning plans
        }
      }
    };
    
    const fetchAILearningPlans = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const response = await axios.get(`${API_BASE_URL}/learning/plans/`);
        
        // Check if response is valid
        if (response.status === 200 && Array.isArray(response.data)) {
          const plans = response.data;
          console.log("Fetched AI Learning Plans:", plans);
          setLearningPlans(plans);
        } else {
          console.warn("Unexpected learning plans response format:", response.data);
          setLearningPlans([]);
        }
      } catch (error) {
        console.error('Error fetching AI learning plans:', error);
        setLearningPlans([]); // Set empty array to prevent undefined errors
      }
    };

    fetchData();
  }, [courseId, pathname]);

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
  
  // Content rendering section in the return statement
  const renderContent = () => {
    if (loading) {
      return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
    }

    if (contentType === 'notFound') {
      return (
        <div className="p-8 text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Learning Plan Not Found</h2>
          <p className="text-gray-600 mb-6">The learning plan you're looking for could not be found. It may have been deleted or is unavailable.</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create a New Learning Plan
            </button>
          </div>
        </div>
      );
    }

    // Add a special header for AI-generated learning plans
    const aiLearningPlanHeader = isAIGeneratedPlan && (
      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex items-center">
          <div className="bg-white p-3 rounded-full mr-4 border border-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-indigo-900">AI-Generated Learning Plan</h2>
            <p className="text-gray-600">This personalized learning journey was created based on your interests and learning goals.</p>
          </div>
        </div>
      </div>
    );

    switch (contentType) {
      case 'video':
      default:
        return (
          <>
            {/* Display AI Learning Plan header if applicable */}
            {aiLearningPlanHeader}
            
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
                  {isAIGeneratedPlan ? (
                    // AI-generated content description
                    <div>
                      <p className="text-gray-700">
                        This video was selected as part of your AI-generated learning plan on {course.title}. 
                        It covers key concepts about {currentLesson.title.toLowerCase()}.
                      </p>
                      
                      {currentLesson.description && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                          <h4 className="font-medium mb-2">Video Description</h4>
                          <p className="text-sm text-gray-600">{currentLesson.description}</p>
                        </div>
                      )}
                      
                      <div className="mt-6 p-4 border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-md">
                        <h4 className="font-semibold text-indigo-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Learning Tips
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-700">
                          <li>Take notes on key concepts as you watch</li>
                          <li>Try to implement what you learn right away</li>
                          <li>Revisit challenging sections multiple times</li>
                          <li>Continue to the next video once you understand the material</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    // Standard content description
                    <div>
                      <p className="text-gray-700">
                        This lesson covers the essential concepts of {currentLesson.title.toLowerCase()}. 
                        You'll learn the fundamentals and how to apply them in real-world scenarios.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">What you'll learn</h3>
                      <ul className="list-disc pl-5 space-y-2 mt-2 mb-4">
                        <li>Understanding the core concepts of {currentLesson.title}</li>
                        <li>How to implement these patterns in your own projects</li>
                        <li>Best practices and common pitfalls to avoid</li>
                        <li>Integration with other related technologies</li>
                      </ul>
                      <p>
                        After completing this lesson, you'll have a solid understanding of how to use {currentLesson.title.toLowerCase()} 
                        in your own projects and applications.
                      </p>
                    </div>
                  )}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
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
          learningPlans={learningPlans}
          isAIGeneratedPlan={isAIGeneratedPlan}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default CourseLearning;