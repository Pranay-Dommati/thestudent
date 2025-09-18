import React, { useState } from 'react';
import { FaSave, FaTimes, FaSpinner, FaImage, FaPlus, FaTrash, FaUpload, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Import the step components from creation form
import BasicInfoStep from './SchoolCourseForm/BasicInfoStep';
import CourseStructureStep from './SchoolCourseForm/CourseStructureStep';

const SchoolCourseEditForm = ({ course, onSubmit, onCancel, isUpdating, isDarkMode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  
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

  // Initialize chapters from course data
  const [chapters, setChapters] = useState(() => {
    if (course.chapters && course.chapters.length > 0) {
      return course.chapters.map(chapter => ({
        id: chapter.id,
        name: chapter.name || '',
        lessons: chapter.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title || '',
          type: lesson.type || 'video',
          videoUrl: lesson.video_url || '',
          aboutLesson: lesson.about_lesson || '',
          hasResources: lesson.resources && lesson.resources.length > 0,
          resources: {
            downloadable: lesson.resources.filter(r => r.type === 'downloadable').map(r => ({
              id: r.id,
              title: r.title || '',
              description: r.description || '',
              file: r.file
            })),
            internet: lesson.resources.filter(r => r.type === 'internet').map(r => ({
              id: r.id,
              title: r.title || '',
              description: r.description || '',
              url: r.url || ''
            }))
          },
          quizQuestions: lesson.quiz_questions.map(q => ({
            id: q.id,
            question: q.question || '',
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correct_answer || ''
          }))
        }))
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
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(
    course.thumbnail ? `http://localhost:8000${course.thumbnail}` : null
  );
  const [errors, setErrors] = useState({});

  // Handler functions for step 1 (Basic Info)
  const handleInputChange = (name, value) => {
    console.log("handleInputChange called with", name, value);
    
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
    // Grow or shrink the chapters array to match the count
    setChapters(prev => {
      if (count > prev.length) {
        const toAdd = count - prev.length;
        const newChapters = Array.from({ length: toAdd }, () => ({
          id: null,
          name: '',
          lessons: [
            {
              id: null,
              title: '',
              type: 'video',
              videoUrl: '',
              aboutLesson: '',
              hasResources: false,
              resources: { downloadable: [], internet: [] },
              quizQuestions: []
            }
          ]
        }));
        return [...prev, ...newChapters];
      } else if (count < prev.length) {
        return prev.slice(0, count);
      }
      return prev;
    });
  };

  // Event handler to work with standard React input events
  const handleInputChangeEvent = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    console.log("handleInputChangeEvent called with", name, fieldValue);
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
        toast.error('File size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
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
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex ? { ...chapter, name: value } : chapter
    ));
  };

  const addLesson = (chapterIndex) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: [
              ...chapter.lessons,
              {
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
              }
            ]
          }
        : chapter
    ));
  };

  const removeLesson = (chapterIndex, lessonIndex) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.filter((_, li) => li !== lessonIndex)
          }
        : chapter
    ));
  };

  const handleLessonChange = (chapterIndex, lessonIndex, field, value) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex ? { ...lesson, [field]: value } : lesson
            )
          }
        : chapter
    ));
  };

  const addResource = (chapterIndex, lessonIndex, resourceType) => {
    const newResource = resourceType === 'downloadable' 
      ? { id: null, title: '', description: '', file: null }
      : { id: null, title: '', description: '', url: '' };

    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    resources: {
                      ...lesson.resources,
                      [resourceType]: [...lesson.resources[resourceType], newResource]
                    }
                  }
                : lesson
            )
          }
        : chapter
    ));
  };

  const removeResource = (chapterIndex, lessonIndex, resourceType, resourceIndex) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    resources: {
                      ...lesson.resources,
                      [resourceType]: lesson.resources[resourceType].filter((_, ri) => ri !== resourceIndex)
                    }
                  }
                : lesson
            )
          }
        : chapter
    ));
  };

  const handleResourceChange = (chapterIndex, lessonIndex, resourceType, resourceIndex, field, value) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    resources: {
                      ...lesson.resources,
                      [resourceType]: lesson.resources[resourceType].map((resource, ri) => 
                        ri === resourceIndex ? { ...resource, [field]: value } : resource
                      )
                    }
                  }
                : lesson
            )
          }
        : chapter
    ));
  };

  const handleFileChange = (chapterIndex, lessonIndex, resourceIndex, file) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    resources: {
                      ...lesson.resources,
                      downloadable: lesson.resources.downloadable.map((resource, ri) => 
                        ri === resourceIndex ? { ...resource, file } : resource
                      )
                    }
                  }
                : lesson
            )
          }
        : chapter
    ));
  };

  const addQuizQuestion = (chapterIndex, lessonIndex) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    quizQuestions: [
                      ...lesson.quizQuestions,
                      {
                        id: null,
                        question: '',
                        options: ['', '', '', ''],
                        correctAnswer: ''
                      }
                    ]
                  }
                : lesson
            )
          }
        : chapter
    ));
  };

  const removeQuizQuestion = (chapterIndex, lessonIndex, questionIndex) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    quizQuestions: lesson.quizQuestions.filter((_, qi) => qi !== questionIndex)
                  }
                : lesson
            )
          }
        : chapter
    ));
  };

  const handleQuizQuestionChange = (chapterIndex, lessonIndex, questionIndex, field, value) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === chapterIndex 
        ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    quizQuestions: lesson.quizQuestions.map((question, qi) => 
                      qi === questionIndex ? { ...question, [field]: value } : question
                    )
                  }
                : lesson
            )
          }
        : chapter
    ));
  };

  // Navigation functions
  const nextStep = () => {
    console.log("Current step before:", currentStep, "totalSteps:", totalSteps);
    if (validateStep(currentStep)) {
      // Use setTimeout to ensure state update is processed correctly
      setTimeout(() => {
        setCurrentStep(prev => {
          const next = Math.min(prev + 1, totalSteps);
          console.log("Setting current step from", prev, "to", next);
          return next;
        });
      }, 0);
    } else {
      console.log("Validation failed for step", currentStep);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step) => {
    console.log("Validating step:", step);
    const newErrors = {};

    if (step === 1) {
      // Validate basic info
      console.log("Form data for validation:", formData);
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
    console.log("Validation result for step", step, ":", isValid, "errors:", Object.keys(newErrors));
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
    
    // Add chapters data (only include valid chapters/lessons)
    const chaptersData = (chapters || [])
      .map(ch => {
        const validLessons = (ch.lessons || []).filter(les => les.title && les.title.trim());
        if (!ch.name || !ch.name.trim() || validLessons.length === 0) return null;
        return { ...ch, lessons: validLessons };
      })
      .filter(Boolean);

    if (chaptersData.length > 0) {
      submitFormData.append('chapters', JSON.stringify(chaptersData));
    }
    
    // Add thumbnail if changed
    if (thumbnailFile) {
      submitFormData.append('thumbnail', thumbnailFile);
    }

    await onSubmit(submitFormData);
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
        return (
          <CourseStructureStep
            chapters={chapters}
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
      <form 
        onSubmit={handleSubmit} 
        onClick={(e) => {
          // Prevent form submission if clicked outside a submit button
          if (e.target.tagName !== 'BUTTON' || e.target.type !== 'submit') {
            e.preventDefault();
          }
        }}
      >
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
              onClick={onCancel}
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

export default SchoolCourseEditForm;
