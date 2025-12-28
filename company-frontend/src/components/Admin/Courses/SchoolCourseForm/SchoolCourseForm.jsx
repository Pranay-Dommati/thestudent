import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import universalToast from '../../../../utils/universalToast';
import BasicInfoStep from './BasicInfoStep';
import CourseStructureStep from './CourseStructureStep';
import { createCourse } from '../../../../services/courseApi';
import { sanitizeFileName } from '../../../../utils/fileHelpers';
import { chaptersReducer } from './chaptersReducer';

const SchoolCourseForm = ({ onSubmit, onCancel, classLevel }) => {
  const STORAGE_KEY = `draft_school_course_${classLevel || 'unknown'}`;
  const saveTimer = useRef(null);
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // Basic Course Info
  const [courseInfo, setCourseInfo] = useState({
    thumbnail: null,
    title: '',
    board: '',
    state: '',
    subject: '',
    sources: '',
    duration: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    keyTopics: [''],
    learningPoints: ['', ''],
    chapterCount: 1
  });

  // Course Structure - normalized reducer for O(1) updates
  const [chapters, dispatch] = useReducer(chaptersReducer, [
    {
      name: '',
      lessons: [
        {
          type: 'video',
          title: '',
          videoUrl: '',
          description: '',
          aboutLesson: '',
          hasResources: false,
          resources: {
            downloadable: [],
            internet: []
          },
          quizQuestions: []
        }
      ]
    }
  ]);
  
  // Load draft on mount (but ensure a 'new' form is empty by allowing caller to clear draft beforehand)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.courseInfo) setCourseInfo(ci => ({ ...ci, ...parsed.courseInfo, thumbnail: null }));
        if (parsed.chapters) dispatch({ type: 'INIT_CHAPTERS', payload: parsed.chapters });
      }
    } catch (_) { /* ignore */ }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [STORAGE_KEY]);

  // If admin navigates back to "Add Course" for same class, ensure a clean slate when query param new=true
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        localStorage.removeItem(STORAGE_KEY);
        // reset local states
        setCourseInfo({
          thumbnail: null,
          title: '',
          board: '',
          state: '',
          subject: '',
          sources: '',
          duration: '',
          lastUpdated: new Date().toISOString().split('T')[0],
          keyTopics: [''],
          learningPoints: ['', ''],
          chapterCount: 1
        });
        dispatch({ type: 'INIT_CHAPTERS', payload: [
          {
            name: '',
            lessons: [
              {
                type: 'video',
                title: '',
                videoUrl: '',
                description: '',
                aboutLesson: '',
                hasResources: false,
                resources: { downloadable: [], internet: [] },
                quizQuestions: []
              }
            ]
          }
        ] });
        setThumbnailPreview(null);
        setActiveStep(1);
      }
    } catch {}
  }, [STORAGE_KEY]);

  // Debounced autosave
  const lastSaveRef = useRef(0);
  const autosave = useMemo(() => (data, reason = 'auto') => {
    // Throttle saves to avoid UI stalls (e.g. rapid lesson edits)
    const now = performance.now();
    const sinceLast = now - lastSaveRef.current;
    if (reason === 'auto' && sinceLast < 1200) return; // skip frequent autosaves
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const sanitized = {
          courseInfo: { ...data.courseInfo, thumbnail: null },
          chapters: data.chapters
        };
        const serialized = JSON.stringify(sanitized);
        // Defer heavy localStorage write to idle time if possible
        const writeFn = () => {
          localStorage.setItem(STORAGE_KEY, serialized);
          lastSaveRef.current = performance.now();
          if (window.__SCHOOL_DEBUG_PERF) {
            console.log(`[PERF][School] autosave (${reason}) size=${serialized.length}B`);
          }
        };
        if ('requestIdleCallback' in window) {
          requestIdleCallback(writeFn, { timeout: 500 });
        } else {
          writeFn();
        }
      } catch (e) { /* ignore */ }
    }, 300);
  }, [STORAGE_KEY]);

  useEffect(() => {
    autosave({ courseInfo, chapters });
  }, [courseInfo, chapters, autosave]);
  
  
  
  // Errors for validation
  const [errors, setErrors] = useState({});
  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
  universalToast.show('Image size must be less than 5MB', {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
      return;
    }
    
    // Sanitize the filename to ensure it's not too long (100 chars max)
    const sanitizedFile = sanitizeFileName(file, 100);
    
    if (file.name !== sanitizedFile.name) {
  universalToast.show('File name was too long and has been truncated', {
        icon: 'ℹ️',
        style: {
          backgroundColor: '#3B82F6',
          color: 'white',
        }
      });
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
      setCourseInfo({...courseInfo, thumbnail: sanitizedFile});
    };
    reader.readAsDataURL(sanitizedFile);
  };
  
  // Handle course info changes
  const handleCourseInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseInfo({
      ...courseInfo,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle array field changes (learning points, key topics)
  const handleArrayFieldChange = (fieldName, index, value) => {
    setCourseInfo({
      ...courseInfo,
      [fieldName]: courseInfo[fieldName].map((item, i) => i === index ? value : item)
    });
  };
  
  // Add new item to array field
  const addArrayField = (fieldName) => {
    setCourseInfo({
      ...courseInfo,
      [fieldName]: [...courseInfo[fieldName], '']
    });
  };
  
  // Remove item from array field
  const removeArrayField = (fieldName, index) => {
    if (fieldName === 'learningPoints' && courseInfo.learningPoints.length <= 2) {
  universalToast.show('At least 2 learning points are required', {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
      return;
    }
    
    if (fieldName === 'keyTopics' && courseInfo.keyTopics.length <= 1) {
  universalToast.show('At least 1 key topic is required', {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
      return;
    }
    
    setCourseInfo({
      ...courseInfo,
      [fieldName]: courseInfo[fieldName].filter((_, i) => i !== index)
    });
  };
  
  // Set chapter count and initialize chapters
  const handleChapterCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setCourseInfo({...courseInfo, chapterCount: count});
    dispatch({ type: 'ADJUST_CHAPTER_COUNT', payload: { count } });
  };
  
  // Handle chapter name change
  const handleChapterNameChange = useCallback((chapterIndex, name) => {
    dispatch({ type: 'SET_CHAPTER_NAME', payload: { chapterIndex, name } });
  }, []);
  
  // Add lesson to chapter
  const addLesson = useCallback((chapterIndex) => {
    dispatch({ type: 'ADD_LESSON', payload: { chapterIndex } });
  }, []);
  
  // Remove lesson from chapter
  const removeLesson = useCallback((chapterIndex, lessonIndex) => {
    const chapter = chapters[chapterIndex];
    if (!chapter || (chapter.lessons?.length ?? 0) <= 1) {
      universalToast.show('Each chapter must have at least one lesson', {
        icon: '❌',
        style: { backgroundColor: '#EF4444', color: 'white' }
      });
      return;
    }
    dispatch({ type: 'REMOVE_LESSON', payload: { chapterIndex, lessonIndex } });
  }, [chapters]);
  
  // Handle lesson data change - O(1) targeted update
  const handleLessonChange = useCallback((chapterIndex, lessonIndex, field, value) => {
    dispatch({ type: 'UPDATE_LESSON_FIELD', payload: { chapterIndex, lessonIndex, field, value } });
  }, []);
  
  // Add resource to lesson
  const addResource = useCallback((chapterIndex, lessonIndex, resourceType) => {
    dispatch({ type: 'ADD_RESOURCE', payload: { chapterIndex, lessonIndex, resourceType } });
  }, []);
  
  // Remove resource from lesson
  const removeResource = useCallback((chapterIndex, lessonIndex, resourceType, resourceIndex) => {
    dispatch({ type: 'REMOVE_RESOURCE', payload: { chapterIndex, lessonIndex, resourceType, resourceIndex } });
  }, []);
  
  // Handle resource data change - O(1) targeted update
  const handleResourceChange = useCallback((chapterIndex, lessonIndex, resourceType, resourceIndex, field, value) => {
    dispatch({ type: 'UPDATE_RESOURCE', payload: { chapterIndex, lessonIndex, resourceType, resourceIndex, field, value } });
  }, []);
  
  // Add quiz question to lesson
  const addQuizQuestion = useCallback((chapterIndex, lessonIndex) => {
    dispatch({ type: 'ADD_QUIZ_QUESTION', payload: { chapterIndex, lessonIndex } });
  }, []);
  
  // Remove quiz question from lesson
  const removeQuizQuestion = useCallback((chapterIndex, lessonIndex, questionIndex) => {
    dispatch({ type: 'REMOVE_QUIZ_QUESTION', payload: { chapterIndex, lessonIndex, questionIndex } });
  }, []);
  
  // Handle quiz question change - O(1) targeted update
  const handleQuizQuestionChange = useCallback((chapterIndex, lessonIndex, questionIndex, field, value, optionIndex = null) => {
    dispatch({ 
      type: 'UPDATE_QUIZ_QUESTION', 
      payload: { chapterIndex, lessonIndex, questionIndex, field, value, optionIndex } 
    });
  }, []);
  // Handle file change for downloadable resources - O(1) targeted update
  const handleFileChange = useCallback((chapterIndex, lessonIndex, resourceIndex, file) => {
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      universalToast.show('File size must be less than 10MB', {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
      return;
    }
    
    // Sanitize the filename to ensure it's not too long (100 chars max)
    const sanitizedFile = sanitizeFileName(file, 100);
    
    if (file.name !== sanitizedFile.name) {
      universalToast.show('File name was too long and has been truncated', {
        icon: 'ℹ️',
        style: {
          backgroundColor: '#3B82F6',
          color: 'white',
        }
      });
    }
    
    dispatch({ 
      type: 'UPDATE_RESOURCE', 
      payload: { 
        chapterIndex, 
        lessonIndex, 
        resourceType: 'downloadable', 
        resourceIndex, 
        field: 'file', 
        value: sanitizedFile 
      } 
    });
  }, []);
  
  const validateForm = () => {
    const newErrors = {};
    
    // Only validate first step fields when on first step
    if (activeStep === 1) {
      // Basic info validation
      if (!courseInfo.thumbnail) newErrors.thumbnail = 'Course thumbnail is required';
      if (!courseInfo.title.trim()) newErrors.title = 'Course title is required';
      if (!courseInfo.board) newErrors.board = 'Board selection is required';
      if (courseInfo.board === 'state' && !courseInfo.state) newErrors.state = 'State selection is required';
      if (!courseInfo.subject) newErrors.subject = 'Subject selection is required';
      if (!courseInfo.sources.trim()) newErrors.sources = 'Course sources are required';
      if (!courseInfo.duration.trim()) newErrors.duration = 'Course duration is required';
      
      // Validate key topics
      if (courseInfo.keyTopics.length === 0) {
        newErrors.keyTopics = 'At least one key topic is required';
      } else if (courseInfo.keyTopics.some(topic => !topic.trim())) {
        newErrors.keyTopics = 'All key topics must be filled';
      }
      
      // Validate learning points (at least 2)
      if (courseInfo.learningPoints.length < 2) {
        newErrors.learningPoints = 'At least 2 learning points are required';
      } else if (courseInfo.learningPoints.some(point => !point.trim())) {
        newErrors.learningPoints = 'All learning points must be filled';
      }
    }
    
    // Only validate second step fields when on second step
    if (activeStep === 2) {
      // Validate chapters
      chapters.forEach((chapter, chapterIndex) => {
        if (!chapter.name.trim()) {
          newErrors[`chapter${chapterIndex}name`] = 'Chapter name is required';
        }
        
        chapter.lessons.forEach((lesson, lessonIndex) => {
          if (!lesson.title.trim()) {
            newErrors[`chapter${chapterIndex}lesson${lessonIndex}`] = 'Lesson title is required';
          }
          
          if (lesson.type === 'video' && !lesson.videoUrl.trim()) {
            newErrors[`chapter${chapterIndex}lesson${lessonIndex}video`] = 'Video URL is required';
          }
          
          if (lesson.hasResources || lesson.type === 'resources') {
            // Validate resources
            const hasDownloadable = lesson.resources.downloadable.length > 0;
            const hasInternet = lesson.resources.internet.length > 0;
            
            if (!hasDownloadable && !hasInternet && lesson.type === 'resources') {
              newErrors[`chapter${chapterIndex}lesson${lessonIndex}resources`] = 'At least one resource is required for a resources lesson';
            }
            
            if (hasDownloadable) {
              const invalidResources = lesson.resources.downloadable.some(r => {
                const hasName = !!r.name.trim();
                const hasDescription = !!r.description.trim();
                const hasLinkOrFile = !!r.link.trim() || !!r.file;
                
                return !hasName || !hasDescription || !hasLinkOrFile;
              });
              
              if (invalidResources) {
                newErrors[`chapter${chapterIndex}lesson${lessonIndex}downloadable`] = 
                  'All downloadable resources must have a name, description, and either a link or uploaded file';
              }
            }
            
            if (hasInternet && lesson.resources.internet.some(r => !r.name.trim() || !r.description.trim() || !r.link.trim())) {
              newErrors[`chapter${chapterIndex}lesson${lessonIndex}internet`] = 'All internet resource fields must be filled';
            }
          }
        });
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = (e) => {
    // Prevent form submission when clicking "Next"
    e.preventDefault();
    
    console.log("Next button clicked");
    console.log("Current errors:", errors);
    
    // Validate the form before proceeding
    if (validateForm()) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
    } else {
      console.log("Form validation failed", errors);
  universalToast.show("Please fill in all required fields correctly", {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Allow quick submit with safe defaults instead of blocking
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add basic info
      const title = courseInfo.title || 'Untitled School Course';
      const board = courseInfo.board || 'cbse';
      const subject = courseInfo.subject || 'general';
      formData.append('title', title);
      formData.append('short_description', title); // Use title as shortDescription
      formData.append('description', courseInfo.description || `${title} - ${classLevel} - ${subject}`);
      formData.append('class_level', classLevel);
      formData.append('board', board);
      
      if (board === 'state') {
        formData.append('state', courseInfo.state || '');
      }
      
      formData.append('subject', subject);
      formData.append('duration', courseInfo.duration || '0');
      formData.append('sources', courseInfo.sources || '');
      
      // Add key topics and learning points - use the field names expected by the backend
      const filteredKeyTopics = (courseInfo.keyTopics || []).filter(topic => (topic || '').trim() !== '');
      const filteredLearningPoints = (courseInfo.learningPoints || []).filter(point => (point || '').trim() !== '');
      
      // Change from 'keyTopics' to 'key_topics' to match backend expectations
      formData.append('key_topics', JSON.stringify(filteredKeyTopics));
      formData.append('learning_points', JSON.stringify(filteredLearningPoints));
      
      // Add thumbnail if it exists
      if (courseInfo.thumbnail) {
        formData.append('thumbnail', courseInfo.thumbnail);
      }
      
      // Track resource files with unique identifiers
      let resourceFileCounter = 0;
      const resourceFiles = [];
      
      // Process chapters honoring chapterCount by padding placeholders
      const desiredCount = Math.max(1, parseInt(courseInfo.chapterCount || 1));
      const chaptersData = Array.from({ length: desiredCount }, (_, i) => {
        const chapter = chapters[i];
        const name = (chapter?.name || '').trim() || `Chapter ${i + 1}`;
        // Keep lessons that actually have content even if title is missing
        const rawLessons = (chapter?.lessons || []);

        const hasMeaningfulContent = (l) => {
          const hasTitle = (l.title || '').trim() !== '';
          const hasVideo = (l.videoUrl || '').trim() !== '';
          const hasAbout = (l.aboutLesson || '').trim() !== '';
          const hasQuiz = Array.isArray(l.quizQuestions) && l.quizQuestions.length > 0;
          const hasResources = (l.resources && (
            (Array.isArray(l.resources.downloadable) && l.resources.downloadable.length > 0) ||
            (Array.isArray(l.resources.internet) && l.resources.internet.length > 0)
          ));
          return hasTitle || hasVideo || hasAbout || hasQuiz || hasResources;
        };

        const lessonsSource = rawLessons.filter(hasMeaningfulContent);

        const lessons = (lessonsSource.length > 0 ? lessonsSource : [{
          title: 'Lesson 1',
          type: 'video',
          videoUrl: '',
          description: '',
          aboutLesson: '',
          hasResources: false,
          resources: { downloadable: [], internet: [] },
          quizQuestions: []
        }]).map((lesson, idx) => {
          // Process resources and handle file uploads
          let processedResources = { downloadable: [], internet: [] };
          
          if (lesson.hasResources || lesson.type === 'resources') {
            // Handle downloadable resources with potential file uploads
            processedResources.downloadable = lesson.resources.downloadable.map(resource => {
              const processedResource = {
                name: resource.name,
                description: resource.description,
                link: resource.link || ''
              };
              
              // If there's a file attached, track it for upload
              if (resource.file) {
                const fileId = `resource_file_${resourceFileCounter++}`;
                resourceFiles.push({ id: fileId, file: resource.file });
                processedResource.fileId = fileId;
              }
              return processedResource;
            });
            // Handle internet resources (no file uploads)
            processedResources.internet = lesson.resources.internet.map(resource => ({
              name: resource.name,
              description: resource.description,
              link: resource.link
            }));
          }
          
          // Title fallback: don't lose a reading/resources lesson just because admin forgot title
          const fallbackTitle = () => {
            const base = (lesson.type === 'reading' || lesson.type === 'instructions') ? 'Reading' :
                         (lesson.type === 'resources') ? 'Resources' :
                         (lesson.type === 'quiz') ? 'Quiz' : 'Lesson';
            const snippet = (lesson.aboutLesson || '').replace(/[#*>_`\-]|\s+/g, ' ').trim().slice(0, 40);
            return snippet ? `${base}: ${snippet}` : `${base} ${idx + 1}`;
          };

          return {
            title: (lesson.title || '').trim() || fallbackTitle(),
            type: lesson.type,
            videoUrl: lesson.videoUrl,
            description: lesson.description,
            aboutLesson: lesson.aboutLesson,
            resources: lesson.hasResources || lesson.type === 'resources' ? processedResources : { downloadable: [], internet: [] },
            quizQuestions: lesson.quizQuestions || []
          };
        });

        return { name, lessons };
      });

      // Always include chapters honoring the count
      formData.append('chapters', JSON.stringify(chaptersData));
      
      // Append all resource files with their unique IDs
      resourceFiles.forEach(({ id, file }) => {
        formData.append(id, file);
      });
      
      // Add resource files info
      formData.append('resourceFilesInfo', JSON.stringify(resourceFiles.map(({ id }) => id)));
      
      console.log('Sending formData with files:', resourceFiles.map(rf => rf.id));
      
      // Submit the form
      await createCourse(formData);
  universalToast.show('Course created successfully', {
        icon: '🎉',
        style: {
          backgroundColor: '#10B981',
          color: 'white',
        }
      });
      // Clear draft on success
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
      navigate('/admin-p/courses');
    } catch (error) {
      console.error('Error creating course:', error);
  universalToast.show('Failed to create course. Please try again.', {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create {classLevel} Course</h1>
      </div>
      
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
        </div>
        <div className="flex text-xs justify-between mt-2">
          <span className="font-medium">Basic Information</span>
          <span className="font-medium">Course Structure</span>
        </div>
      </div>
      
      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="sync">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeStep === 1 && (
              <BasicInfoStep
                courseInfo={courseInfo}
                setCourseInfo={setCourseInfo}
                errors={errors}
                thumbnailPreview={thumbnailPreview}
                handleThumbnailChange={handleThumbnailChange}
                handleCourseInfoChange={handleCourseInfoChange}
                handleArrayFieldChange={handleArrayFieldChange}
                addArrayField={addArrayField}
                removeArrayField={removeArrayField}
                handleChapterCountChange={handleChapterCountChange}
                classLevel={classLevel}
              />
            )}
            {activeStep === 2 && (
              <CourseStructureStep
                chapters={chapters}
                handleChapterNameChange={handleChapterNameChange}
                addLesson={addLesson}
                removeLesson={removeLesson}
                handleLessonChange={handleLessonChange}
                addResource={addResource}
                removeResource={removeResource}
                handleResourceChange={handleResourceChange}
                addQuizQuestion={addQuizQuestion}
                removeQuizQuestion={removeQuizQuestion}
                handleQuizQuestionChange={handleQuizQuestionChange}
                errors={errors}
                handleFileChange={handleFileChange}
              />
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Form Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={activeStep === 1 ? onCancel : handleBack}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            {activeStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {activeStep < 2 ? (
            <button
              type="button" // Make sure this is type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Next
            </button>
          ) : (
            <button
              type="submit" // This one should be type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Create Course'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SchoolCourseForm;