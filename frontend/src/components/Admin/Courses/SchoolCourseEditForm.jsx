import React, { memo, useState, useCallback, useEffect, startTransition, useReducer, useMemo } from 'react';
import { chaptersReducer } from './SchoolCourseForm/chaptersReducer';
import { FaSave, FaTimes, FaSpinner, FaImage, FaPlus, FaTrash, FaUpload, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import universalToast from '../../../utils/universalToast';
import { toAbsoluteMedia } from '../../../utils/apiOrigin';
import useAutoSave from '../../../hooks/useAutoSave';

// Import the step components from creation form
import BasicInfoStep from './SchoolCourseForm/BasicInfoStep';
import CourseStructureStep from './SchoolCourseForm/CourseStructureStep';

const SchoolCourseEditForm = ({ course, onSubmit, onCancel, isUpdating, isDarkMode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  // Defer mounting of heavy structure step to avoid long pointer frames
  const [structureReady, setStructureReady] = useState(false);
  
  // Initialize form data with course structure
  const [formData, setFormData] = useState({
    title: course.title || '',
    class_level: course.class_level || '',
    board: course.board || '',
    state: course.state || '',
    subject: course.subject || '',
    sources: course.sources || '',
    duration: course.duration || '',
    description: course.description || '',
    short_description: course.short_description || '',
    is_published: course.is_published || false,
    key_topics: course.key_topics || [],
    learning_points: course.learning_points || [],
    // Add camelCase versions for the BasicInfoStep component
    keyTopics: course.key_topics || [],
    learningPoints: course.learning_points || [],
    // Add chapterCount based on the number of chapters
    chapterCount: course.chapters ? course.chapters.length : 1
  });

  // Initialize chapters from course data using reducer (normalized updates)
  const initialChapters = (() => {
    if (course.chapters && course.chapters.length > 0) {
      return course.chapters.map(chapter => ({
        id: chapter.id,
        name: chapter.name || '',
        lessons: chapter.lessons.map(lesson => {
          // Handle both old format (flat array) and new format (grouped object)
          let downloadableResources = [];
          let internetResources = [];
          
          if (lesson.resources) {
            if (Array.isArray(lesson.resources)) {
              // Old format: flat array
              downloadableResources = lesson.resources
                .filter(r => r.type === 'downloadable')
                .map(r => ({
                  id: r.id,
                  title: r.title || r.name || '',
                  name: r.title || r.name || '',
                  description: r.description || '',
                  file: r.file
                }));
              
              internetResources = lesson.resources
                .filter(r => r.type === 'internet')
                .map(r => ({
                  id: r.id,
                  title: r.title || r.name || '',
                  name: r.title || r.name || '',
                  description: r.description || '',
                  url: r.url || r.link || '',
                  link: r.url || r.link || ''
                }));
            } else if (lesson.resources.downloadable || lesson.resources.internet) {
              // New format: grouped object
              downloadableResources = (lesson.resources.downloadable || []).map(r => ({
                id: r.id,
                title: r.title || r.name || '',
                name: r.title || r.name || '',
                description: r.description || '',
                file: r.file
              }));
              
              internetResources = (lesson.resources.internet || []).map(r => ({
                id: r.id,
                title: r.title || r.name || '',
                name: r.title || r.name || '',
                description: r.description || '',
                url: r.url || r.link || '',
                link: r.url || r.link || ''
              }));
            }
          }
          
          return {
            id: lesson.id,
            title: lesson.title || '',
            type: lesson.type || 'video',
            videoUrl: lesson.video_url || '',
            aboutLesson: lesson.about_lesson || '',
            hasResources: downloadableResources.length > 0 || internetResources.length > 0,
            resources: {
              downloadable: downloadableResources,
              internet: internetResources
            },
            quizQuestions: (lesson.quiz_questions || []).map(q => ({
              id: q.id,
              question: q.question || '',
              options: q.options || ['', '', '', ''],
              correctAnswer: q.correct_answer || ''
            }))
          };
        })
      }));
    } else {
      // Default single chapter if none exist
      return [{
        id: null,
        name: '',
        lessons: [{
          id: null,
          title: '',
          type: 'video',
          videoUrl: '',
          aboutLesson: '',
          hasResources: false,
          resources: {
            downloadable: [],
            internet: []
          },
          quizQuestions: []
        }]
      }];
    }
  })();
  const [chapters, dispatch] = useReducer(chaptersReducer, initialChapters);

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(
    course.thumbnail ? toAbsoluteMedia(course.thumbnail) : null
  );
  const [errors, setErrors] = useState({});

  // Auto-save integration
  const autoSaveKey = course?.id ? `autoSave_school_${course.id}` : null;
  
  const dataToSave = useMemo(() => ({
    formData,
    chapters,
    currentStep
  }), [formData, chapters, currentStep]);

  const handleRestore = useCallback((savedData) => {
    if (savedData.formData) setFormData(savedData.formData);
    if (savedData.chapters) dispatch({ type: 'INIT_CHAPTERS', payload: savedData.chapters });
    if (savedData.currentStep) setCurrentStep(savedData.currentStep);
  }, []);

  const { clearSavedData } = useAutoSave(
    autoSaveKey, 
    dataToSave, 
    handleRestore, 
    !!course?.id // Only save if we have a course ID
  );

  // Handler functions for step 1 (Basic Info)
  const handleInputChange = (name, value) => {
    
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear state when board changes from state board
    if (name === 'board' && value !== 'state') {
      setFormData(prev => ({
        ...prev,
        state: ''
      }));
    }

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Adjust chapter count and reflect in chapters state
  const handleChapterCountChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    // Update the visible count in basic info
    setFormData(prev => ({ ...prev, chapterCount: count }));
    // Ensure at least `count` chapters exist; do NOT shrink on decrease
    dispatch({ type: 'ENSURE_CHAPTER_COUNT', payload: { count } });
  };

  // Event handler to work with standard React input events
  const handleInputChangeEvent = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    handleInputChange(name, fieldValue);
  };

  const handleArrayInputChange = (name, index, value) => {
    setFormData(prev => {
      // Map between camelCase and snake_case field names
      const fieldMapping = {
        'keyTopics': 'key_topics',
        'learningPoints': 'learning_points',
        'key_topics': 'keyTopics',
        'learning_points': 'learningPoints'
      };

      // Update both camelCase and snake_case versions if there's a mapping
      const updates = {
        [name]: prev[name].map((item, i) => i === index ? value : item)
      };
      
      if (fieldMapping[name]) {
        updates[fieldMapping[name]] = updates[name];
      }
      
      return { ...prev, ...updates };
    });
  };

  const addArrayItem = (name) => {
    setFormData(prev => {
      // Map between camelCase and snake_case field names
      const fieldMapping = {
        'keyTopics': 'key_topics',
        'learningPoints': 'learning_points',
        'key_topics': 'keyTopics',
        'learning_points': 'learningPoints'
      };

      // Update both camelCase and snake_case versions if there's a mapping
      const updates = {
        [name]: [...prev[name], '']
      };
      
      if (fieldMapping[name]) {
        updates[fieldMapping[name]] = [...updates[name]];
      }
      
      return { ...prev, ...updates };
    });
  };

  const removeArrayItem = (name, index) => {
    setFormData(prev => {
      // Map between camelCase and snake_case field names
      const fieldMapping = {
        'keyTopics': 'key_topics',
        'learningPoints': 'learning_points',
        'key_topics': 'keyTopics',
        'learning_points': 'learningPoints'
      };

      // Update both camelCase and snake_case versions if there's a mapping
      const updates = {
        [name]: prev[name].filter((_, i) => i !== index)
      };
      
      if (fieldMapping[name]) {
        updates[fieldMapping[name]] = [...updates[name]];
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        universalToast.error('File size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        universalToast.error('Please select an image file');
        return;
      }

      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target.result);
      reader.readAsDataURL(file);

      // Clear thumbnail error
      if (errors.thumbnail) {
        setErrors(prev => ({ ...prev, thumbnail: undefined }));
      }
    }
  };

  // Handler functions for step 2 (Course Structure)
  const handleChapterNameChange = (chapterIndex, value) => {
    dispatch({ type: 'SET_CHAPTER_NAME', payload: { chapterIndex, name: value } });
  };

  const addLesson = (chapterIndex) => {
    dispatch({ type: 'ADD_LESSON', payload: { chapterIndex } });
  };

  const removeLesson = (chapterIndex, lessonIndex) => {
    // Prevent removing from hidden chapters (preserve data when chapterCount is reduced)
    if (chapterIndex >= (formData.chapterCount || chapters.length)) return;
    dispatch({ type: 'REMOVE_LESSON', payload: { chapterIndex, lessonIndex } });
  };

  const handleLessonChange = (chapterIndex, lessonIndex, field, value) => {
    dispatch({ type: 'UPDATE_LESSON_FIELD', payload: { chapterIndex, lessonIndex, field, value } });
  };

  const addResource = (chapterIndex, lessonIndex, resourceType) => {
    dispatch({ type: 'ADD_RESOURCE', payload: { chapterIndex, lessonIndex, resourceType } });
  };

  const removeResource = (chapterIndex, lessonIndex, resourceType, resourceIndex) => {
    dispatch({ type: 'REMOVE_RESOURCE', payload: { chapterIndex, lessonIndex, resourceType, resourceIndex } });
  };

  const handleResourceChange = (chapterIndex, lessonIndex, resourceType, resourceIndex, field, value) => {
    dispatch({ type: 'UPDATE_RESOURCE', payload: { chapterIndex, lessonIndex, resourceType, resourceIndex, field, value } });
  };

  const handleFileChange = (chapterIndex, lessonIndex, resourceIndex, file) => {
    dispatch({ type: 'UPDATE_RESOURCE', payload: { chapterIndex, lessonIndex, resourceType: 'downloadable', resourceIndex, field: 'file', value: file } });
  };

  const addQuizQuestion = (chapterIndex, lessonIndex) => {
    dispatch({ type: 'ADD_QUIZ_QUESTION', payload: { chapterIndex, lessonIndex } });
  };

  const removeQuizQuestion = (chapterIndex, lessonIndex, questionIndex) => {
    dispatch({ type: 'REMOVE_QUIZ_QUESTION', payload: { chapterIndex, lessonIndex, questionIndex } });
  };

  const handleQuizQuestionChange = (chapterIndex, lessonIndex, questionIndex, field, value) => {
    dispatch({ type: 'UPDATE_QUIZ_QUESTION', payload: { chapterIndex, lessonIndex, questionIndex, field, value } });
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      startTransition(() => {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      });
    } else {
      // keep current step when invalid
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step) => {
    
    const newErrors = {};

    if (step === 1) {
      // Validate basic info
      
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.class_level) newErrors.class_level = 'Class level is required';
      if (!formData.board) newErrors.board = 'Board is required';
      if (formData.board === 'state' && !formData.state) newErrors.state = 'State is required for state board';
      if (!formData.subject) newErrors.subject = 'Subject is required';
      if (!formData.sources?.trim()) newErrors.sources = 'Sources are required';
      if (!formData.duration?.trim()) newErrors.duration = 'Duration is required';
      if (!formData.description?.trim()) newErrors.description = 'Description is required';
      if (!formData.short_description?.trim()) newErrors.short_description = 'Short description is required';
    } else if (step === 2) {
      // Validate course structure
      chapters.forEach((chapter, chapterIndex) => {
        if (!chapter.name.trim()) {
          newErrors[`chapter${chapterIndex}name`] = 'Chapter name is required';
        }
        
        chapter.lessons.forEach((lesson, lessonIndex) => {
          if (!lesson.title.trim()) {
            newErrors[`chapter${chapterIndex}lesson${lessonIndex}`] = 'Lesson title is required';
          }
          
          if (lesson.type === 'video' && !lesson.videoUrl.trim()) {
            newErrors[`chapter${chapterIndex}lesson${lessonIndex}video`] = 'Video URL is required for video lessons';
          }
        });
      });
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    return isValid;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.class_level) newErrors.class_level = 'Class level is required';
    if (!formData.board) newErrors.board = 'Board is required';
    if (formData.board === 'state' && !formData.state) newErrors.state = 'State is required for state board';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.sources.trim()) newErrors.sources = 'Sources are required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.short_description.trim()) newErrors.short_description = 'Short description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submit triggered, current step:", currentStep);

    // Save-in-the-middle: do not block submission on step validations
    // We allow updating even if step 2 (structure) isn't complete

  const submitFormData = new FormData();
    
    // Add all form fields
    Object.keys(formData).forEach(key => {
      // Skip the camelCase versions when adding to submitFormData
      if (key === 'keyTopics' || key === 'learningPoints') {
        return; // Skip these as we'll use the snake_case versions
      }
      
      if (key === 'key_topics' || key === 'learning_points') {
        submitFormData.append(key, JSON.stringify(formData[key].filter(item => item.trim())));
      } else {
        submitFormData.append(key, formData[key]);
      }
    });
    
    // Add chapters data honoring desired chapter count without discarding existing hidden data
    const desiredCount = Math.max(1, parseInt(formData.chapterCount || 1));
    const toSubmitChapters = (chapters || [])
      .slice(0, desiredCount)
      .map((existing, i) => {
        const name = (existing?.name || '').trim() || `Chapter ${i + 1}`;
        const lessons = (existing?.lessons || []).length > 0
          ? existing.lessons.map(lesson => ({
              id: lesson.id || null,
              title: lesson.title || '',
              type: lesson.type || 'video',
              videoUrl: lesson.videoUrl || '',
              aboutLesson: lesson.aboutLesson || '',
              hasResources: lesson.hasResources || false,
              resources: lesson.resources || { downloadable: [], internet: [] },
              quizQuestions: lesson.quizQuestions || []
            }))
          : [{ id: null, title: 'Lesson 1', type: 'video', videoUrl: '', aboutLesson: '', hasResources: false, resources: { downloadable: [], internet: [] }, quizQuestions: [] }];
        return { id: existing?.id || null, name, lessons };
      });

    submitFormData.append('chapters', JSON.stringify(toSubmitChapters));
    
    // Add thumbnail if changed
    if (thumbnailFile) {
      submitFormData.append('thumbnail', thumbnailFile);
    }

    const success = await onSubmit(submitFormData);
    if (success) {
      clearSavedData(); // Clear auto-saved data on success
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            courseInfo={formData}
            setCourseInfo={(updates) => setFormData(prev => ({...prev, ...updates}))}
            handleCourseInfoChange={handleInputChangeEvent}
            handleThumbnailChange={handleThumbnailChange}
            thumbnailPreview={thumbnailPreview}
            handleArrayFieldChange={handleArrayInputChange}
            addArrayField={addArrayItem}
            removeArrayField={removeArrayItem}
            handleChapterCountChange={handleChapterCountChange}
            errors={errors}
            isDarkMode={isDarkMode}
            classLevel={formData.class_level}
          />
        );
      case 2:
        // Render only the number of chapters requested, but keep the full state unmodified
        const chaptersToRender = chapters.slice(0, formData.chapterCount || chapters.length);
        if (!structureReady) {
          return (
            <div className="p-6 border border-gray-200 rounded-lg text-sm text-gray-600">
              Preparing course structure…
            </div>
          );
        }
        return (
          <CourseStructureStep
            chapters={chaptersToRender}
            handleChapterNameChange={handleChapterNameChange}
            addLesson={addLesson}
            removeLesson={removeLesson}
            handleLessonChange={handleLessonChange}
            addResource={addResource}
            removeResource={removeResource}
            handleResourceChange={handleResourceChange}
            handleFileChange={handleFileChange}
            addQuizQuestion={addQuizQuestion}
            removeQuizQuestion={removeQuizQuestion}
            handleQuizQuestionChange={handleQuizQuestionChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  // When switching to step 2, defer heavy render until idle to end the click frame quickly
  useEffect(() => {
    if (currentStep === 2) {
      setStructureReady(false);
      const enable = () => setStructureReady(true);
      try {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(enable, { timeout: 250 });
        } else {
          setTimeout(enable, 0);
        }
      } catch {
        setTimeout(enable, 0);
      }
    } else {
      // Not on structure step; no need to defer
      setStructureReady(false);
    }
  }, [currentStep]);

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Edit Course
          </h2>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              <span
                className={`ml-2 text-sm ${
                  step <= currentStep
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-gray-900'
                    : isDarkMode
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}
              >
                {step === 1 ? 'Basic Information' : 'Course Structure'}
              </span>
              {step < totalSteps && (
                <div
                  className={`ml-4 w-16 h-0.5 ${
                    step < currentStep
                      ? 'bg-blue-600'
                      : isDarkMode
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        {renderStepContent()}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8 border-t border-gray-200 dark:border-gray-700 mt-8">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaArrowLeft className="inline mr-2" />
                Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to discard your changes?')) {
                  clearSavedData();
                  onCancel();
                }
              }}
              disabled={isUpdating}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
              }`}
            >
              <FaTimes className="inline mr-2" />
              Cancel
            </button>
            
            {currentStep < totalSteps ? (
              <button
                type="button" 
                onClick={(e) => {
                  e.preventDefault(); // Prevent any form submission
                  console.log("Next button clicked");
                  nextStep();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next
                <FaArrowRight className="inline ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? (
                  <>
                    <FaSpinner className="inline mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FaSave className="inline mr-2" />
                    Update Course
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default memo(SchoolCourseEditForm);
