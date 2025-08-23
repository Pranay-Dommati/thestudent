import React, { useState } from 'react';
import { FaSave, FaTimes, FaSpinner, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Import the step components from creation form
import BasicInfoStep from './EngineeringCourseForm/BasicInfoStep';
import CourseStructureStep from './EngineeringCourseForm/CourseStructureStep';

const EngineeringCourseEditForm = ({ course, onSubmit, onCancel, isUpdating, isDarkMode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  
  // Initialize form data with course structure
  const [formData, setFormData] = useState({
    title: course.title || '',
    category: course.category || '',
    proficiency_level: course.proficiency_level || 'beginner',
    duration: course.duration || '',
    sources: course.sources || '',
    certificate: course.certificate || '',
    price: course.price || '0',
    description: course.description || '',
    short_description: course.short_description || '',
    is_published: course.is_published || false,
    learning_objectives: course.learning_objectives || [],
    prerequisites: course.prerequisites || [],
    course_content: course.course_content || [],
  });

  // Initialize sections from course data
  const [sections, setSections] = useState(() => {
    if (course.sections && course.sections.length > 0) {
      return course.sections.map(section => ({
        id: section.id,
        name: section.name || '',
        lessons: section.lessons.map(lesson => ({
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
      // Default single section if none exist
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleArrayInputChange = (name, index, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: [...prev[name], '']
    }));
  };

  const removeArrayItem = (name, index) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index)
    }));
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
  const handleSectionNameChange = (sectionIndex, value) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex ? { ...section, name: value } : section
    ));
  };

  const addLesson = (sectionIndex) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: [
              ...section.lessons,
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
        : section
    ));
  };

  const removeLesson = (sectionIndex, lessonIndex) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.filter((_, li) => li !== lessonIndex)
          }
        : section
    ));
  };

  const handleLessonChange = (sectionIndex, lessonIndex, field, value) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
              li === lessonIndex ? { ...lesson, [field]: value } : lesson
            )
          }
        : section
    ));
  };

  const addResource = (sectionIndex, lessonIndex, resourceType) => {
    const newResource = resourceType === 'downloadable' 
      ? { id: null, title: '', description: '', file: null }
      : { id: null, title: '', description: '', url: '' };

    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
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
        : section
    ));
  };

  const removeResource = (sectionIndex, lessonIndex, resourceType, resourceIndex) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
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
        : section
    ));
  };

  const handleResourceChange = (sectionIndex, lessonIndex, resourceType, resourceIndex, field, value) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
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
        : section
    ));
  };

  const handleFileChange = (sectionIndex, lessonIndex, resourceIndex, file) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
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
        : section
    ));
  };

  const addQuizQuestion = (sectionIndex, lessonIndex) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
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
        : section
    ));
  };

  const removeQuizQuestion = (sectionIndex, lessonIndex, questionIndex) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
              li === lessonIndex 
                ? {
                    ...lesson,
                    quizQuestions: lesson.quizQuestions.filter((_, qi) => qi !== questionIndex)
                  }
                : lesson
            )
          }
        : section
    ));
  };

  const handleQuizQuestionChange = (sectionIndex, lessonIndex, questionIndex, field, value) => {
    setSections(prev => prev.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            lessons: section.lessons.map((lesson, li) => 
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
        : section
    ));
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
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
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.proficiency_level) newErrors.proficiency_level = 'Proficiency level is required';
      if (!formData.sources.trim()) newErrors.sources = 'Sources are required';
      if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.short_description.trim()) newErrors.short_description = 'Short description is required';
    } else if (step === 2) {
      // Validate course structure
      sections.forEach((section, sectionIndex) => {
        if (!section.name.trim()) {
          newErrors[`section${sectionIndex}name`] = 'Section name is required';
        }
        
        section.lessons.forEach((lesson, lessonIndex) => {
          if (!lesson.title.trim()) {
            newErrors[`section${sectionIndex}lesson${lessonIndex}`] = 'Lesson title is required';
          }
          
          if (lesson.type === 'video' && !lesson.videoUrl.trim()) {
            newErrors[`section${sectionIndex}lesson${lessonIndex}video`] = 'Video URL is required for video lessons';
          }
        });
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.proficiency_level) newErrors.proficiency_level = 'Proficiency level is required';
    if (!formData.sources.trim()) newErrors.sources = 'Sources are required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.short_description.trim()) newErrors.short_description = 'Short description is required';
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitFormData = new FormData();
    
    // Add all form fields
    Object.keys(formData).forEach(key => {
      if (Array.isArray(formData[key])) {
        submitFormData.append(key, JSON.stringify(formData[key].filter(item => item.trim())));
      } else {
        submitFormData.append(key, formData[key]);
      }
    });
    
    // Add thumbnail if changed
    if (thumbnailFile) {
      submitFormData.append('thumbnail', thumbnailFile);
    }

    await onSubmit(submitFormData);
  };

  const inputClasses = `w-full px-4 py-3 rounded-lg border transition-colors ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-600 focus:border-blue-500'
  }`;

  const labelClasses = `block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Basic Information
          </h3>
          
          <div>
            <label className={labelClasses}>
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`${inputClasses} ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter course title"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={labelClasses}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`${inputClasses} ${errors.category ? 'border-red-500' : ''}`}
            >
              <option value="">Select category</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className={labelClasses}>
              Proficiency Level <span className="text-red-500">*</span>
            </label>
            <select
              name="proficiency_level"
              value={formData.proficiency_level}
              onChange={handleInputChange}
              className={`${inputClasses} ${errors.proficiency_level ? 'border-red-500' : ''}`}
            >
              {PROFICIENCY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            {errors.proficiency_level && <p className="text-red-500 text-sm mt-1">{errors.proficiency_level}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className={`${inputClasses} ${errors.duration ? 'border-red-500' : ''}`}
                placeholder="e.g., 10 weeks, 40 hours"
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>

            <div>
              <label className={labelClasses}>Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`${inputClasses} ${errors.price ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>
                Sources <span className="text-red-500">*</span>
              </label>
              <select
                name="sources"
                value={formData.sources}
                onChange={handleInputChange}
                className={`${inputClasses} ${errors.sources ? 'border-red-500' : ''}`}
              >
                <option value="">Select source</option>
                {SOURCES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              {errors.sources && <p className="text-red-500 text-sm mt-1">{errors.sources}</p>}
            </div>

            <div>
              <label className={labelClasses}>Certificate</label>
              <select
                name="certificate"
                value={formData.certificate}
                onChange={handleInputChange}
                className={inputClasses}
              >
                <option value="">Select certificate type</option>
                {CERTIFICATE_OPTIONS.map(cert => (
                  <option key={cert} value={cert}>{cert}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Thumbnail and Additional Info */}
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Course Details
          </h3>

          {/* Thumbnail Upload */}
          <div>
            <label className={labelClasses}>Course Thumbnail</label>
            <div className="space-y-3">
              {thumbnailPreview && (
                <div className="relative inline-block">
                  <img 
                    src={thumbnailPreview} 
                    alt="Course thumbnail preview" 
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              )}
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                  : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaImage className={`w-8 h-8 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="font-semibold">Click to upload</span> thumbnail
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    PNG, JPG up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </label>
            </div>
          </div>

          <div>
            <label className={labelClasses}>
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
              rows={3}
              className={`${inputClasses} ${errors.short_description ? 'border-red-500' : ''}`}
              placeholder="Brief description for course card"
            />
            {errors.short_description && <p className="text-red-500 text-sm mt-1">{errors.short_description}</p>}
          </div>

          <div>
            <label className={labelClasses}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`${inputClasses} ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Detailed course description"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_published"
              checked={formData.is_published}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className={`ml-2 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Publish course immediately
            </label>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div>
        <label className={labelClasses}>Learning Objectives</label>
        <div className="space-y-2">
          {formData.learning_objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleArrayFieldChange('learning_objectives', index, e.target.value)}
                className={`flex-1 ${inputClasses}`}
                placeholder="Enter learning objective"
              />
              <button
                type="button"
                onClick={() => removeArrayField('learning_objectives', index)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('learning_objectives')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <FaPlus /> Add Learning Objective
          </button>
        </div>
      </div>

      {/* Prerequisites */}
      <div>
        <label className={labelClasses}>Prerequisites</label>
        <div className="space-y-2">
          {formData.prerequisites.map((prerequisite, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={prerequisite}
                onChange={(e) => handleArrayFieldChange('prerequisites', index, e.target.value)}
                className={`flex-1 ${inputClasses}`}
                placeholder="Enter prerequisite"
              />
              <button
                type="button"
                onClick={() => removeArrayField('prerequisites', index)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('prerequisites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <FaPlus /> Add Prerequisite
          </button>
        </div>
      </div>

      {/* Course Content */}
      <div>
        <label className={labelClasses}>Course Content</label>
        <div className="space-y-2">
          {formData.course_content.map((content, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => handleArrayFieldChange('course_content', index, e.target.value)}
                className={`flex-1 ${inputClasses}`}
                placeholder="Enter course content topic"
              />
              <button
                type="button"
                onClick={() => removeArrayField('course_content', index)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('course_content')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <FaPlus /> Add Content Topic
          </button>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
        <button
          type="submit"
          disabled={isUpdating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
      </div>
    </form>
  );
};

export default EngineeringCourseEditForm;
