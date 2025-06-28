import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LessonVideo from './LessonVideo';
import CourseProgress from './CourseProgress';
import ResourcesPage from './templ/ResourcesPage';
import QuizIntro from './templ/QuizIntro';
import InstructionsPage from './templ/InstructionsPage';
import Sidebar from './Sidebar';
import axios from 'axios';
import axiosInstance from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// Update the function signature to accept the new props
const CourseLearning = ({ courseId, pathname, onSidebarToggle }) => {
  const [course, setCourse] = useState(null);
  const [learningPlans, setLearningPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeTab, setActiveTab] = useState('about');
  const [aiGeneratedContent, setAIGeneratedContent] = useState(null);
  const [learningPlanOpen, setLearningPlanOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [contentType, setContentType] = useState('video'); // 'video', 'resources', 'quiz', 'instructions'
  const [courseProgress, setCourseProgress] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [internetResourcesOpen, setInternetResourcesOpen] = useState(false);
  const [downloadResourcesOpen, setDownloadResourcesOpen] = useState(false);
  const [isAIGeneratedPlan, setIsAIGeneratedPlan] = useState(false);
  const [lastCreatedPlanId, setLastCreatedPlanId] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // Helper function to update AI learning plan progress
  const updateAILearningPlanProgress = async (planId, lessonId, isCompleted) => {
    try {
      // Get current progress data
      const currentPlan = await axiosInstance.get(`/learning/plans/${planId}/`);
      const currentProgress = currentPlan.data.plan_data.progress || {};
      
      // Update the specific lesson progress
      const updatedProgress = {
        ...currentProgress,
        [lessonId]: isCompleted
      };
      
      // Calculate overall completion
      const allLessons = course.chapters.reduce((acc, chapter) => {
        return acc.concat(chapter.lessons.map(lesson => lesson.id));
      }, []);
      
      const completedLessonsCount = allLessons.filter(lessonKey => updatedProgress[lessonKey]).length;
      const totalLessonsCount = allLessons.length;
      const isOverallCompleted = totalLessonsCount > 0 && completedLessonsCount === totalLessonsCount;
      
      // Send progress update to backend
      await axiosInstance.patch(`/learning/update-progress/${planId}/`, {
        plan_data: {
          progress: updatedProgress
        },
        is_completed: isOverallCompleted
      });
      
      console.log(`Updated AI learning plan progress: ${completedLessonsCount}/${totalLessonsCount} lessons completed`);
      
    } catch (error) {
      console.error('Error updating AI learning plan progress:', error);
      throw error;
    }
  };

  // Helper to fetch a learning plan by ID
  const fetchLearningPlanById = async (planId) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching learning plan with ID:', planId);
      const response = await axiosInstance.get(`/learning/plans/${planId}/`);
      const planData = response.data;
      console.log('📦 Received plan data:', JSON.stringify(planData, null, 2));
      
      // Check if planData has the expected structure
      if (!planData || !planData.plan_data) {
        throw new Error('Learning plan data is missing or invalid');
      }
      
      // Ensure days is an array (can be empty)
      if (!Array.isArray(planData.plan_data.days)) {
        throw new Error('Learning plan days data is invalid');
      }
      
      // Load existing progress data if available
      const existingProgress = planData.plan_data.progress || {};
        // Apply duplicate video filtering to the plan data first
      console.log('Filtering duplicate videos across all days...');
      const filteredDays = filterDuplicateVideos(planData.plan_data.days);
      
      // Use the filtered days data instead of the original
      planData.plan_data.days = filteredDays;
      
      // Transform days into chapters with progress loading
      const transformedPlan = {
        id: planData.id,
        title: planData.title,
        description: planData.description || "AI-generated learning plan",
        chapters: planData.plan_data.days.map((day, dayIndex) => {
          // DEBUG: Log quiz questions for each day
          console.log(`🧩 Day ${day.day} (${day.topic}) quiz questions:`, day.quizQuestions);
          console.log(`🧩 Quiz questions length:`, day.quizQuestions ? day.quizQuestions.length : 0);          // Create video lessons from day.videos
          // For Day 1 introduction, only use the first video
          const videosToUse = day.day === 1 ? (day.videos || []).slice(0, 1) : (day.videos || []);
          
          // Log video count modification for Day 1
          if (day.day === 1 && (day.videos || []).length > 1) {
            console.log(`ℹ️ Day 1 (${day.topic}): Limited videos from ${day.videos.length} to 1 video for introduction`);
          }
          
          const videoLessons = videosToUse.map((video, videoIndex) => {
            // Create unique lesson identifier for AI learning plans
            const lessonKey = `day_${day.day}_video_${videoIndex}`;
            const isCompleted = existingProgress[lessonKey] || false;
            
            return {
              id: lessonKey,
              title: video.title,
              type: 'video',
              // Log every video as it's processed
              videoUrl: (() => {
                console.log(`Processing video with ID: ${video.video_id}`);
                // Return the ID directly for better compatibility with the LessonVideo component
                return video.video_id;
              })(),
              description: video.description || "",
              completed: isCompleted,
              isAIGenerated: true,
              aiLearningPlanId: planData.id,
              dayIndex: dayIndex,
              videoIndex: videoIndex
            };
          });

          // Create quiz lesson if quiz questions exist
          const quizLessons = [];
          if (day.quizQuestions && day.quizQuestions.length > 0) {
            console.log(`✅ Creating quiz lesson for Day ${day.day}: ${day.topic}`);
            const quizLessonKey = `day_${day.day}_quiz`;
            const isQuizCompleted = existingProgress[quizLessonKey] || false;
            
            quizLessons.push({
              id: quizLessonKey,
              title: `${day.topic} - Knowledge Check`,
              type: 'quiz',
              description: `Test your understanding of ${day.topic} concepts`,
              completed: isQuizCompleted,
              isAIGenerated: true,
              aiLearningPlanId: planData.id,
              dayIndex: dayIndex,
              quiz_questions: day.quizQuestions,
              quizQuestions: day.quizQuestions
            });
          } else {
            console.log(`❌ No quiz questions found for Day ${day.day}: ${day.topic}`);
          }

          console.log(`📊 Day ${day.day} final lessons:`, {
            videoLessons: videoLessons.length,
            quizLessons: quizLessons.length,
            totalLessons: videoLessons.length + quizLessons.length
          });

          return {
            title: `Day ${day.day}: ${day.topic}`,
            lessons: [...videoLessons, ...quizLessons]
          };
        }),
      };
      setCourse(transformedPlan);
      setIsAIGeneratedPlan(true);
      if (transformedPlan.chapters.length > 0) {
        setExpandedChapters({ 0: true });
      }
    } catch (error) {
      console.error('Error fetching learning plan by ID:', error);
      let errorMessage = 'Failed to load learning plan';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Learning plan not found. It may have been deleted or is unavailable.';
          setContentType('notFound');
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred while loading the learning plan. Please try again later.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate a new AI learning plan and fetch it immediately
  const generateAndFetchLearningPlan = async (goal, days=null) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/learning/generate-learning-plan/', { goal, days });
      const newPlan = response.data;
      if (newPlan && newPlan.id) {
        setLastCreatedPlanId(newPlan.id);
        // Immediately fetch the new plan by its ID
        await fetchLearningPlanById(newPlan.id);
      } else {
        console.error('No plan ID returned after creation:', newPlan);
      }
    } catch (error) {
      console.error('Error creating new AI learning plan:', error);
      setError(error.message || 'Failed to generate learning plan');
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Extract URL path to determine course type and proper API endpoint
    const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
    
    // Check if this is a direct learning plan route (/learning/:id)
    const isDirectLearningPlanRoute = pathParts[0] === 'learning' && pathParts.length > 1;
    const learningPlanId = isDirectLearningPlanRoute ? pathParts[1] : null;
    
    // Only treat as AI learning plan if it's a direct learning route or we have a lastCreatedPlanId
    const isLearningPlanId = learningPlanId !== null || lastCreatedPlanId !== null;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Check first if this is an AI-generated learning plan
        if (isLearningPlanId) {
          try {
            // Use the last created plan ID if available, otherwise use the learningPlanId from URL
            const planId = lastCreatedPlanId || learningPlanId;
            console.log(`🔍 Fetching AI learning plan with ID: ${planId}`);
            await fetchLearningPlanById(planId);
            console.log("✅ Learning plan loaded successfully!");
            return; // Exit early since we successfully loaded the plan
          } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to load AI learning plan';
            console.error('❌ Error fetching AI learning plan:', errorMessage);
            setError(errorMessage);
            setContentType('notFound');
          }        } else {
          try {
            // Fetch regular course data
            await fetchRegularCourse(pathParts);
          } catch (error) {
            console.error('❌ Error fetching course data:', error);
            setError(error.message || 'Failed to load course data');
            setContentType('notFound'); 
          }
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
          const classLevel = pathParts.find(part => ['10th', '11th', '12th'].includes(part));          const board = pathParts.find(part => ['cbse', 'state'].includes(part));
          
          // Handle state board case which has an additional parameter
          if (board === 'state') {
            const stateIndex = pathParts.indexOf('state');
            if (stateIndex !== -1 && stateIndex + 1 < pathParts.length) {
              const stateId = pathParts[stateIndex + 1];
              const subjectId = pathParts[stateIndex + 2];
                // Map state codes to full state names
              const stateMap = {
                // Southern States
                'ts': 'Telangana',
                'ap': 'Andhra Pradesh',
                'ka': 'Karnataka',
                'tn': 'Tamil Nadu',
                'kl': 'Kerala',
                
                // Western States
                'mh': 'Maharashtra',
                'gj': 'Gujarat',
                'rj': 'Rajasthan',
                'ga': 'Goa',
                
                // Northern States
                'dl': 'Delhi',
                'pb': 'Punjab',
                'hr': 'Haryana',
                'hp': 'Himachal Pradesh',
                'up': 'Uttar Pradesh',
                'uk': 'Uttarakhand',
                'jk': 'Jammu and Kashmir',
                
                // Eastern States
                'wb': 'West Bengal',
                'br': 'Bihar',
                'or': 'Odisha',
                'jh': 'Jharkhand',
                
                // Central States
                'mp': 'Madhya Pradesh',
                'cg': 'Chhattisgarh',
                
                // North Eastern States
                'as': 'Assam',
                'sk': 'Sikkim',
                'nl': 'Nagaland',
                'mn': 'Manipur',
                'ml': 'Meghalaya',
                'tr': 'Tripura',
                'ar': 'Arunachal Pradesh',
                'mz': 'Mizoram',
                
                // Union Territories
                'ch': 'Chandigarh',
                'an': 'Andaman and Nicobar Islands',
                'dn': 'Dadra and Nagar Haveli and Daman and Diu',
                'ld': 'Lakshadweep',
                'py': 'Puducherry',
                'la': 'Ladakh'
              };                // Use the full state name if available, otherwise use the code
              const stateCode = stateId.toLowerCase();
              const stateParam = stateMap[stateCode] || stateId;
              
              console.log(`🗺️ State code mapping: "${stateCode}" → "${stateParam}"`);
              
              // Warn if state code is not found in the mapping
              if (!stateMap[stateCode]) {
                console.warn(`⚠️ Warning: State code "${stateCode}" not found in state mapping. Using raw value instead.`);
              }
              
              apiUrl = `${API_BASE_URL}/courses/school/?class=${classLevel}&board=${board}&state=${stateParam}&subject=${subjectId}`;
              console.log(`🔍 Looking for state board course: class=${classLevel}, state=${stateParam}, subject=${subjectId}`);
            }
          } else {
            const subjectIndex = pathParts.indexOf(board) + 1;
            if (subjectIndex < pathParts.length) {
              const subjectId = pathParts[subjectIndex];
              // Convert subjectId to lowercase to ensure case-insensitive matching with database
              apiUrl = `${API_BASE_URL}/courses/school/?class=${classLevel}&board=${board}&subject=${subjectId.toLowerCase()}`;
              console.log(`📚 Fetching school course with: class=${classLevel}, board=${board}, subject=${subjectId.toLowerCase()}`);
            }
          }
        } else {
          // Engineering course
          apiUrl = `${API_BASE_URL}/courses/engineering/${courseId}/`;
        }
        
        if (!apiUrl) {
          throw new Error("Could not determine API URL from path");
        }
          console.log("🔍 Fetching course from API URL:", apiUrl);
        const response = await axiosInstance.get(apiUrl);
        console.log("📝 API Response:", response.data);
          let courseData;
        if (isSchoolCourse) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            // For school courses, we get a list, so take the first matching course
            courseData = response.data[0];
            console.log("🎯 Selected course from list:", courseData);
            // Now fetch the complete course details
            const detailResponse = await axiosInstance.get(`/courses/school/${courseData.id}/`);
            console.log("📚 Complete course details:", detailResponse.data);
            courseData = detailResponse.data;
          } else {
            // No courses found for the given criteria
            throw new Error(`No courses found for the specified criteria. Please check if the course exists.`);
          }
        } else {
          courseData = response.data;
        }
          console.log("Fetched Course Data:", courseData);
        
        // Check if courseData is valid and has the expected structure
        if (!courseData || 
            (isSchoolCourse && (!courseData.chapters || !Array.isArray(courseData.chapters))) ||
            (!isSchoolCourse && (!courseData.sections || !Array.isArray(courseData.sections)))) {
          throw new Error("No course data found or course data is in an unexpected format");
        }
          
        // Transform sections or chapters into a consistent format for the sidebar
        const transformedCourse = {
          ...courseData,
          chapters: isSchoolCourse 
            ? courseData.chapters.map((chapter) => ({
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
                  // Include quiz questions with both possible field names
                  quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                  quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                  // Include resources
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
                  // Include quiz questions with both possible field names
                  quiz_questions: lesson.quiz_questions || lesson.quizQuestions || [],
                  quizQuestions: lesson.quiz_questions || lesson.quizQuestions || [],
                  // Include resources
                  resources: lesson.resources || { downloadable: [], internet: [] }
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
      } catch (error) {        console.error('❌ Error fetching course data:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to load course content';
        
        // Special handling for state board course errors
        const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
        const isStateBoard = pathParts.includes('state');
        if (isStateBoard) {
          const stateIndex = pathParts.indexOf('state');
          if (stateIndex !== -1 && stateIndex + 1 < pathParts.length) {
            const stateId = pathParts[stateIndex + 1];
            console.error(`⚠️ State board course error with state code: ${stateId}`);
            setError(`Unable to find courses for the specified state. Make sure state code "${stateId}" is correct.`);
          } else {
            setError('Unable to find state board courses. Invalid URL format.');
          }
        } else {
          setError(errorMessage);
        }
        
        setCourse(null);
        
        // Check if error response indicates ID belongs to a learning plan
        if (error.response?.data?.isLearningPlanId) {
          setError('This learning plan is not available. It may have been deleted or you may not have permission to access it.');
        } else if (isLearningPlanId) {
          setError('Unable to load the learning plan. Please check if the ID is correct.');
          setContentType('notFound');
        }
      }
    };
    
    const fetchAILearningPlans = async () => {
      try {
        const response = await axiosInstance.get('/learning/plans/');
        
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
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to load learning plans';
        console.warn('AI Learning Plans Error:', errorMessage);
        setLearningPlans([]);
      }
    };

    fetchData();
  }, [courseId, pathname]);

  // Add a useEffect to fetch user progress when course data is loaded
  useEffect(() => {
    // Only fetch progress if the user is logged in and we have a course
    const fetchUserProgress = async () => {
      if (!isLoggedIn || !course || !course.id || isAIGeneratedPlan) return;
      
      try {        // Call the backend API to get the user's progress for this course
        const response = await axiosInstance.get(`/courses/progress/${course.id}/`);
        
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
  }, [course?.id, isLoggedIn, isAIGeneratedPlan]);

  // Handle chapter toggling
  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  // Select a lesson
  const selectLesson = (chapterIndex, lessonIndex) => {
    // Reset AI-generated content when changing lessons
    setAIGeneratedContent(null);
    
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

  // Mark lesson as complete (with backend integration)
  const markLessonComplete = async () => {
    if (!course) return;
    
    try {
      const currentLesson = course.chapters[activeChapter].lessons[activeLesson];
      
      if (isAIGeneratedPlan && currentLesson.aiLearningPlanId) {
        // Handle AI learning plan progress
        await updateAILearningPlanProgress(currentLesson.aiLearningPlanId, currentLesson.id, true);
      } else if (currentLesson.id && !isAIGeneratedPlan) {
        // Handle regular course progress
        await axiosInstance.post(`/lessons/toggle-completion/${currentLesson.id}/`);
      }
      
      // Update local state
      const updatedCourse = {...course};
      updatedCourse.chapters[activeChapter].lessons[activeLesson].completed = true;
      setCourse(updatedCourse);
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      // Still update local state even if API call fails
      const updatedCourse = {...course};
      updatedCourse.chapters[activeChapter].lessons[activeLesson].completed = true;
      setCourse(updatedCourse);
    }
  };

  // Toggle lesson completion from sidebar
  const toggleLessonCompletion = async (chapterIndex, lessonIndex) => {
    if (!course) return;
    
    try {
      const lesson = course.chapters[chapterIndex].lessons[lessonIndex];
      const newCompletionState = !lesson.completed;
      
      if (isAIGeneratedPlan && lesson.aiLearningPlanId) {
        // Handle AI learning plan progress
        await updateAILearningPlanProgress(lesson.aiLearningPlanId, lesson.id, newCompletionState);
      } else if (lesson.id && !isAIGeneratedPlan) {
        // Handle regular course progress
        const response = await axiosInstance.post(`/lessons/toggle-completion/${lesson.id}/`);
        console.log('Lesson completion toggled:', response.data);
      }
      
      // Update local state
      const updatedCourse = {...course};
      updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = newCompletionState;
      setCourse(updatedCourse);
    } catch (error) {
      console.error('Error toggling lesson completion:', error);
      // Still update local state even if API call fails
      const updatedCourse = {...course};
      updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed = 
        !updatedCourse.chapters[chapterIndex].lessons[lessonIndex].completed;
      setCourse(updatedCourse);
    }
  };
  // Navigate to next lesson
  const goToNextLesson = async () => {
    if (!course) return;
    
    // If not already completed, mark the lesson as complete
    const currentLesson = getCurrentLesson();
    if (!currentLesson.completed) {
      await markLessonComplete();
    }
    
    // Reset AI-generated content when changing lessons
    setAIGeneratedContent(null);
    
    const currentChapter = course.chapters[activeChapter];
    
    if (activeLesson < currentChapter.lessons.length - 1) {
      // Move to next lesson in current chapter
      setActiveLesson(activeLesson + 1);
    } else if (activeChapter < course.chapters.length - 1) {
      // Move to first lesson of next chapter
      setActiveChapter(activeChapter + 1);
      setActiveLesson(0);
      setExpandedChapters(prev => ({
        ...prev,
        [activeChapter + 1]: true
      }));
    }
  };
  // Navigate to previous lesson
  const goToPrevLesson = () => {
    if (!course) return;
    
    // Reset AI-generated content when changing lessons
    setAIGeneratedContent(null);
    
    if (activeLesson > 0) {
      setActiveLesson(activeLesson - 1);
    } else if (activeChapter > 0) {
      const prevChapter = course.chapters[activeChapter - 1];
      setActiveChapter(activeChapter - 1);
      setActiveLesson(prevChapter.lessons.length - 1);
      setExpandedChapters(prev => ({
        ...prev,
        [activeChapter - 1]: true
      }));
    }
  };

  // Get current lesson
  const getCurrentLesson = () => {
    if (!course || !course.chapters || !Array.isArray(course.chapters)) {
      return null;
    }
    
    const chapter = course.chapters[activeChapter];
    if (!chapter || !chapter.lessons || !Array.isArray(chapter.lessons)) {
      return null;
    }
    
    return chapter.lessons[activeLesson] || null;
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
  };  // Handle lesson click
  const handleLessonClick = (chapterIndex, lessonIndex) => {
    const lesson = course.chapters[chapterIndex].lessons[lessonIndex]; 
    // Debug information
    console.log('🎯 Lesson clicked:', lesson);
    console.log('📝 Lesson type:', lesson.type);
    console.log('❓ Quiz questions:', lesson.quiz_questions);
    console.log('📚 About lesson:', lesson.aboutLesson);
    console.log('📂 Resources:', lesson.resources);
      // Only update state if we're actually changing lessons to prevent re-renders
    if (activeChapter !== chapterIndex || activeLesson !== lessonIndex) {
      // Reset AI-generated content when changing lessons
      setAIGeneratedContent(null);
      
      setActiveChapter(chapterIndex);
      setActiveLesson(lessonIndex);
      setExpandedChapters(prev => ({
        ...prev,
        [chapterIndex]: true
      }));
    }
  };  // Update content type based on current lesson type
  useEffect(() => {
    const currentLesson = getCurrentLesson();
    console.log('🎯 Current lesson for content type detection:', currentLesson);
    
    if (currentLesson && currentLesson.type) {
      console.log('🎮 Setting content type based on lesson type:', currentLesson.type);
      
      // Debug video URL if present
      if (currentLesson.type === 'video') {
        console.log('🎬 Video URL details:', {
          videoUrl: currentLesson.videoUrl,
          type: typeof currentLesson.videoUrl,
          video_id: currentLesson.video_id,
          hasVideoIdProperty: currentLesson.videoUrl && 
            typeof currentLesson.videoUrl === 'object' && 
            currentLesson.videoUrl.video_id ? true : false
        });
      }
      
      // Map lesson types to content types
      switch (currentLesson.type) {
        case 'quiz':
          setContentType('quiz');
          break;
        case 'reading':
        case 'instructions':
          setContentType('instructions');
          break;
        case 'resources':
          setContentType('resources');
          break;
        case 'video':
        default:
          setContentType('video');
          break;
      }
    } else {
      console.log('🎮 Defaulting to video content type - no lesson type specified');
      // Default to video if no lesson type is specified
      setContentType('video');
    }
  }, [activeChapter, activeLesson, course]);

  // Add effect to notify parent when sidebar visibility changes
  useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(sidebarVisible);
    }
  }, [sidebarVisible, onSidebarToggle]);

  // Loading and error states
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-600">Loading your learning content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8">
        <div className="mb-6 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8">
        <div className="mb-6 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
        <p className="text-gray-600 text-center mb-6">The course you're looking for could not be found. It may have been removed or you might not have access to it.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  const currentLesson = getCurrentLesson();
  const completedLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.filter(l => l.completed).length, 0
  );  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length, 0
  );
  
  // Function to generate AI content manually for the current lesson
  const handleGenerateAIContent = async () => {
    const currentLesson = getCurrentLesson();
    if (!currentLesson?.title || !currentLesson?.title.trim()) return;
    
    try {
      // Import the generateAIContent function from LessonVideo
      const { callGeminiAPI } = await import('../Chatbot/ChatbotAPI');
      
      const prompt = `Create a comprehensive educational markdown guide about "${currentLesson.title}". 
      
Structure your response as a well-formatted markdown document with:

1. A main heading with the topic name
2. An introductory section explaining the core concepts
3. 2-3 key sections with subheadings covering important aspects
4. Use bullet points for lists where appropriate
5. Include at least one simple table if relevant 
6. Add emphasis using bold and italics for important terms
7. Include a brief summary or key takeaways section at the end

Make this educational content informative yet concise (around 300-500 words total).`;

      const markdownContent = await callGeminiAPI(prompt);
      
      const content = {
        title: `AI-Generated Guide: ${currentLesson.title}`,
        content: markdownContent,
        isMarkdown: true
      };
      
      setAIGeneratedContent(content);
    } catch (error) {
      console.error('Error generating AI content:', error);
    }
  };
  
  // Content rendering section in the return statement
  const renderContent = () => {
    if (loading) {
      return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
    }    if (contentType === 'notFound') {
      return (
        <div className="p-8 text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The content you're looking for could not be found. It may have been deleted or is unavailable."}</p>
          <div className="flex justify-center space-x-4">
            {isLearningPlanId ? (
              <button
                onClick={() => navigate('/chat')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create a New Learning Plan
              </button>
            ) : (
              <button
                onClick={() => navigate('/courses')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Courses
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>      );
    }

    // Add a special header for AI-generated learning plans
    const aiLearningPlanHeader = isAIGeneratedPlan && (
      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex items-center justify-between">
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
          
          {/* Generate AI Content Button */}
          <div className="ml-4">
            <button
              onClick={handleGenerateAIContent}
              disabled={aiGeneratedContent}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors ${
                aiGeneratedContent 
                  ? 'bg-green-100 text-green-700 cursor-default' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
              }`}
            >
              {aiGeneratedContent ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI Content Generated</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate AI Content</span>
                </>
              )}
            </button>          </div>
        </div>
      </div>
    );
    
    switch (contentType) {
      case 'resources':
        return <ResourcesPage lessonResources={currentLesson?.resources} />; 

      case 'quiz':
        // Render quiz content
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
          <>
            {aiLearningPlanHeader}
            
            {/* Video Container */}
            <div className="mb-8">
              <div ref={videoRef} className="mb-6">                <LessonVideo 
                  videoUrl={currentLesson?.videoUrl} 
                  title={currentLesson?.title}
                  onAIContentGenerated={(content) => setAIGeneratedContent(content)}
                />
              </div>
                {/* Content Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">                  <button
                    onClick={() => setActiveTab('about')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'about'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {aiGeneratedContent ? 'AI Generated Content' : 'About'}
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'resources'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Resources
                  </button>
                </nav>
              </div>
                {/* Tab Content */}              <div className="mb-8">                {activeTab === 'about' && (
                  <div className="prose prose-lg max-w-none markdown-body">                    {aiGeneratedContent ? (
                      // Use AI-generated content when available
                      <div>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mb-6">
                          <h3 className="text-lg font-semibold text-indigo-900 mb-2">{aiGeneratedContent.title}</h3>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}                            components={{
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />,
                              li: ({node, children, ...props}) => {
                                if (!children || (Array.isArray(children) && children.length === 0) || 
                                    (typeof children === 'string' && children.trim() === '')) {
                                  return null;
                                }
                                return <li className="ml-2 my-1" {...props}>{children}</li>;
                              },
                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-bold my-3" {...props} />,
                              h4: ({node, ...props}) => <h4 className="text-base font-bold my-2" {...props} />,
                              h5: ({node, ...props}) => <h5 className="text-sm font-bold my-2" {...props} />,
                              h6: ({node, ...props}) => <h6 className="text-xs font-bold my-2" {...props} />,
                              p: ({node, children, ...props}) => {
                                if (!children || (Array.isArray(children) && children.length === 0) || 
                                    (typeof children === 'string' && children.trim() === '')) {
                                  return null;
                                }
                                return <p className="my-3 leading-relaxed" {...props}>{children}</p>;
                              },
                              table: ({node, ...props}) => <table className="min-w-full border border-gray-200 my-4" {...props} />,
                              thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                              tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200" {...props} />,
                              tr: ({node, ...props}) => <tr className="hover:bg-gray-50" {...props} />,
                              th: ({node, ...props}) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border border-gray-200" {...props} />,
                              td: ({node, ...props}) => <td className="px-4 py-2 text-sm text-gray-500 border border-gray-200" {...props} />,
                              code: ({node, inline, className, children, ...props}) => {
                                if (inline) {
                                  return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                                }
                                return (
                                  <div className="bg-gray-800 rounded-md my-4">
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                                      <span className="text-xs text-gray-400">code</span>
                                    </div>
                                    <pre className="p-4 overflow-x-auto">
                                      <code className="text-green-400 text-sm" {...props}>{children}</code>
                                    </pre>
                                  </div>
                                )
                              },
                              pre: ({node, children, ...props}) => <>{children}</>,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                              em: ({node, ...props}) => <em className="italic" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                              hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                            }}
                          >
                            {aiGeneratedContent.content}
                          </ReactMarkdown>
                          <div className="mt-4 text-xs text-gray-500 italic">
                            This content was generated by AI and may not be 100% accurate.
                          </div>
                        </div>
                      </div>
                    ) : currentLesson?.aboutLesson ? (
                      // Use actual lesson content if available with proper markdown components
                      <div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />,
                            li: ({node, children, ...props}) => {
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
                            h4: ({node, ...props}) => <h4 className="text-base font-bold my-2" {...props} />,
                            h5: ({node, ...props}) => <h5 className="text-sm font-bold my-2" {...props} />,
                            h6: ({node, ...props}) => <h6 className="text-xs font-bold my-2" {...props} />,
                            p: ({node, children, ...props}) => {
                              // Skip rendering empty paragraphs
                              if (!children || (Array.isArray(children) && children.length === 0) || 
                                  (typeof children === 'string' && children.trim() === '')) {
                                return null;
                              }
                              // Enhanced paragraph handling for plain text with line breaks
                              return <p className="my-3 leading-relaxed" {...props}>{children}</p>;
                            },
                            // Add table rendering components
                            table: ({node, ...props}) => <table className="min-w-full border border-gray-200 my-4" {...props} />,
                            thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-gray-50" {...props} />,
                            th: ({node, ...props}) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border border-gray-200" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-2 text-sm text-gray-500 border border-gray-200" {...props} />,
                            code: ({node, inline, className, children, ...props}) => {
                              if (inline) {
                                return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                              }
                              return (
                                <div className="bg-gray-800 rounded-md my-4">
                                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                                    <span className="text-xs text-gray-400">code</span>
                                  </div>
                                  <pre className="p-4 overflow-x-auto">
                                    <code className="text-green-400 text-sm" {...props}>{children}</code>
                                  </pre>
                                </div>
                              )
                            },
                            pre: ({node, children, ...props}) => {
                              // Return children directly to let code component handle styling
                              return <>{children}</>;
                            },
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,                            hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                          }}
                        >
                          {currentLesson.aboutLesson}
                        </ReactMarkdown>
                      </div>
                    ) : currentLesson?.description ? (
                      // Fallback to description if aboutLesson is not available
                      <div>
                        <h3 className="text-lg font-semibold mb-4">About This Lesson</h3>
                        <p className="text-gray-700 mb-4">{currentLesson.description}</p>
                        
                        {isAIGeneratedPlan ? (
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
                        ) : (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">What you'll learn:</h4>
                            <ul className="list-disc pl-5 space-y-2 text-gray-700">
                              <li>Understanding the core concepts of {currentLesson.title}</li>
                              <li>Practical applications and real-world examples</li>
                              <li>Best practices and common techniques</li>
                              <li>Key takeaways for your learning journey</li>
                            </ul>
                          </div>
                        )}
                      </div>                    ) : (                      // Simple message when no content is provided
                      <div>
                        <h3 className="text-lg font-semibold mb-4">About This Lesson</h3>
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-500">No description is available for this lesson.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'resources' && (
                  <ResourcesPage lessonResources={currentLesson?.resources} />
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button 
                  className={`px-6 py-3 rounded-lg border font-medium flex items-center ${
                    activeChapter === 0 && activeLesson === 0 
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors'
                  }`}
                  onClick={goToPrevLesson}
                  disabled={activeChapter === 0 && activeLesson === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Previous Lesson
                </button>
                
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
                      {currentLesson?.completed ? "Next Lesson" : "Mark as Complete"}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
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
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600">{error}</p>
              </div>
            ) : course ? (
              <>
                {/* Video content navigation */}
                {contentType === 'video' && course.chapters && course.chapters[activeChapter] && (
                  <div className="mb-6">
                    <nav className="flex items-center text-sm text-gray-600">
                      <span>Course</span>
                      <span className="mx-2">•</span>
                      <span>{course.chapters[activeChapter].title}</span>
                      <span className="mx-2">•</span>
                      <span>{currentLesson?.title || 'Loading...'}</span>
                    </nav>
                  </div>
                )}

                {/* Dynamic Content */}
                {renderContent()}
              </>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No course data available.</p>
              </div>
            )}
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
          toggleLessonCompletion={toggleLessonCompletion}
          learningPlans={learningPlans}
          isAIGeneratedPlan={isAIGeneratedPlan}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

// Utility function to extract YouTube video ID from various formats
const extractVideoId = (url) => {
  if (!url) return null;
  
  // If already a direct video ID (11 chars)
  if (typeof url === 'string' && /^[\w-]{11}$/.test(url)) {
    return url;
  }
  
  // If it's an object with video_id property
  if (typeof url === 'object' && url !== null && url.video_id) {
    return url.video_id;
  }
  
  // If it's a string URL, extract ID from various YouTube URL formats
  if (typeof url === 'string') {
    const regexPatterns = [
      /(?:youtube\.com\/(?:watch\?v=|v\/|embed\/)|youtu\.be\/)([\w-]{11})/,
      /youtube\.com\/embed\/([\w-]{11})/,
      /youtu\.be\/([\w-]{11})/
    ];
    
    for (const regex of regexPatterns) {
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return null;
};

// Function to filter duplicate videos from course content
const filterDuplicateVideos = (courseDays) => {
  if (!courseDays || !Array.isArray(courseDays)) {
    console.warn('Invalid course days data provided to filterDuplicateVideos');
    return courseDays;
  }
  
  const usedVideoIds = new Set();
  let totalVideos = 0;
  let duplicatesFound = 0;
  let failedExtraction = 0;
  
  // Deep clone to avoid modifying original data
  const filteredDays = JSON.parse(JSON.stringify(courseDays));
  
  filteredDays.forEach(day => {
    if (day.videos && Array.isArray(day.videos)) {
      const originalLength = day.videos.length;
      
      // Filter out duplicates
      day.videos = day.videos.filter(video => {
        totalVideos++;
        const videoId = extractVideoId(video.video_id || video.url);
        
        if (!videoId) {
          failedExtraction++;
          return true; // Keep videos where we can't determine the ID
        }
        
        if (usedVideoIds.has(videoId)) {
          duplicatesFound++;
          return false; // Remove duplicate
        }
        
        usedVideoIds.add(videoId);
        return true; // Keep unique video
      });
      
      console.log(`Day ${day.day}: Filtered ${originalLength - day.videos.length} duplicate videos`);
    }
  });
  
  console.log('Video deduplication summary:', {
    totalVideosProcessed: totalVideos,
    uniqueVideos: usedVideoIds.size,
    duplicatesRemoved: duplicatesFound,
    failedIdExtraction: failedExtraction
  });
  
  return filteredDays;
};

export default CourseLearning;
