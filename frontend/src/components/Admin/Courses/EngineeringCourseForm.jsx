import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaUpload, FaVideo, FaFileAlt, FaQuestionCircle, FaLink, FaBook } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PROFICIENCY_LEVELS = [
  { id: 'beginner', label: 'Beginner (No prior experience needed)' },
  { id: 'intermediate', label: 'Intermediate (Basic knowledge required)' },
  { id: 'advanced', label: 'Advanced (Expert-Level)' }
];

const EngineeringCourseForm = ({ onSubmit, onCancel }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // Basic Course Info
  const [courseInfo, setCourseInfo] = useState({
    thumbnail: null,
    title: '',
    shortDescription: '',
    sources: '',
    duration: '',
    proficiency: 'beginner',
    certificateGiven: false,
    projectBased: false,
    lastUpdated: new Date().toISOString().split('T')[0],
    description: '',
    learningPoints: ['', ''],
    requirements: [''],
    sectionCount: 1
  });
  
  // Course Structure
  const [sections, setSections] = useState([
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
  
  // Errors for validation
  const [errors, setErrors] = useState({});
  
  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
      setCourseInfo({...courseInfo, thumbnail: file});
    };
    reader.readAsDataURL(file);
  };
  
  // Handle course info changes
  const handleCourseInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseInfo({
      ...courseInfo,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle array field changes (learning points, requirements)
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
      toast.error('At least 2 learning points are required');
      return;
    }
    
    setCourseInfo({
      ...courseInfo,
      [fieldName]: courseInfo[fieldName].filter((_, i) => i !== index)
    });
  };
  
  // Set section count and initialize sections
  const handleSectionCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setCourseInfo({...courseInfo, sectionCount: count});
    
    // Adjust sections array to match count
    if (count > sections.length) {
      // Add new sections
      setSections([
        ...sections,
        ...Array(count - sections.length).fill().map(() => ({
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
        }))
      ]);
    } else if (count < sections.length) {
      // Remove excess sections
      setSections(sections.slice(0, count));
    }
  };
  
  // Handle section name change
  const handleSectionNameChange = (index, value) => {
    setSections(sections.map((section, i) => 
      i === index ? {...section, name: value} : section
    ));
  };
  
  // Add lesson to section
  const addLesson = (sectionIndex) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: [
          ...section.lessons,
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
      } : section
    ));
  };
  
  // Remove lesson from section
  const removeLesson = (sectionIndex, lessonIndex) => {
    if (sections[sectionIndex].lessons.length <= 1) {
      toast.error('Each section must have at least one lesson');
      return;
    }
    
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.filter((_, j) => j !== lessonIndex)
      } : section
    ));
  };
  
  // Handle lesson data change
  const handleLessonChange = (sectionIndex, lessonIndex, field, value) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {...lesson, [field]: value} : lesson
        )
      } : section
    ));
  };
  
  // Add resource to lesson
  const addResource = (sectionIndex, lessonIndex, resourceType) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            resources: {
              ...lesson.resources,
              [resourceType]: [
                ...lesson.resources[resourceType],
                { name: '', description: '', link: '' }
              ]
            }
          } : lesson
        )
      } : section
    ));
  };
  
  // Remove resource from lesson
  const removeResource = (sectionIndex, lessonIndex, resourceType, resourceIndex) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            resources: {
              ...lesson.resources,
              [resourceType]: lesson.resources[resourceType].filter((_, k) => k !== resourceIndex)
            }
          } : lesson
        )
      } : section
    ));
  };
  
  // Handle resource change
  const handleResourceChange = (sectionIndex, lessonIndex, resourceType, resourceIndex, field, value) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            resources: {
              ...lesson.resources,
              [resourceType]: lesson.resources[resourceType].map((resource, k) => 
                k === resourceIndex ? {...resource, [field]: value} : resource
              )
            }
          } : lesson
        )
      } : section
    ));
  };
  
  // Add quiz question
  const addQuizQuestion = (sectionIndex, lessonIndex) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            quizQuestions: [
              ...lesson.quizQuestions,
              { question: '', options: ['', '', '', ''], correctAnswer: 0 }
            ]
          } : lesson
        )
      } : section
    ));
  };
  
  // Remove quiz question
  const removeQuizQuestion = (sectionIndex, lessonIndex, questionIndex) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            quizQuestions: lesson.quizQuestions.filter((_, k) => k !== questionIndex)
          } : lesson
        )
      } : section
    ));
  };
  
  // Handle quiz question change
  const handleQuizQuestionChange = (sectionIndex, lessonIndex, questionIndex, field, value, optionIndex = null) => {
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            quizQuestions: lesson.quizQuestions.map((question, k) => 
              k === questionIndex ? (
                field === 'options' ? 
                {
                  ...question,
                  options: question.options.map((option, l) => l === optionIndex ? value : option)
                } : 
                {...question, [field]: value}
              ) : question
            )
          } : lesson
        )
      } : section
    ));
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Validate course info
    if (!courseInfo.thumbnail) newErrors.thumbnail = 'Course thumbnail is required';
    if (!courseInfo.title.trim()) newErrors.title = 'Course title is required';
    if (!courseInfo.shortDescription.trim()) newErrors.shortDescription = 'Course short description is required';
    if (!courseInfo.sources.trim()) newErrors.sources = 'Course sources are required';
    if (!courseInfo.duration.trim()) newErrors.duration = 'Course duration is required';
    if (!courseInfo.description.trim()) newErrors.description = 'Course description is required';
    
    // Validate learning points (at least 2)
    if (courseInfo.learningPoints.length < 2) {
      newErrors.learningPoints = 'At least 2 learning points are required';
    } else if (courseInfo.learningPoints.some(point => !point.trim())) {
      newErrors.learningPoints = 'All learning points must be filled';
    }
    
    // Validate requirements
    if (courseInfo.requirements.some(req => !req.trim())) {
      newErrors.requirements = 'All requirements must be filled';
    }
    
    // Validate sections if on step 2
    if (activeStep === 2) {
      // Validate section names
      if (sections.some(section => !section.name.trim())) {
        newErrors.sectionNames = 'All section names must be filled';
      }
      
      // Validate lessons
      sections.forEach((section, sectionIndex) => {
        section.lessons.forEach((lesson, lessonIndex) => {
          if (!lesson.title.trim()) {
            newErrors[`section${sectionIndex}lesson${lessonIndex}`] = 'Lesson title is required';
          }
          
          if (lesson.type === 'video' && !lesson.videoUrl.trim()) {
            newErrors[`section${sectionIndex}lesson${lessonIndex}video`] = 'Video URL is required';
          }
          
          if (lesson.type === 'quiz' && lesson.quizQuestions.length < 1) {
            newErrors[`section${sectionIndex}lesson${lessonIndex}quiz`] = 'At least 1 quiz question is required';
          }
          
          if (lesson.hasResources) {
            // Validate resources
            const hasDownloadable = lesson.resources.downloadable.length > 0;
            const hasInternet = lesson.resources.internet.length > 0;
            
            if (!hasDownloadable && !hasInternet) {
              newErrors[`section${sectionIndex}lesson${lessonIndex}resources`] = 'At least one resource is required';
            }
            
            if (hasDownloadable && lesson.resources.downloadable.some(r => !r.name.trim() || !r.description.trim() || !r.link.trim())) {
              newErrors[`section${sectionIndex}lesson${lessonIndex}downloadable`] = 'All downloadable resource fields must be filled';
            }
            
            if (hasInternet && lesson.resources.internet.some(r => !r.name.trim() || !r.description.trim() || !r.link.trim())) {
              newErrors[`section${sectionIndex}lesson${lessonIndex}internet`] = 'All internet resource fields must be filled';
            }
          }
        });
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (validateForm()) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleBack = () => {
    setActiveStep(activeStep - 1);
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Prepare form data
      const formData = new FormData();
      
      // Add basic course info
      formData.append('thumbnail', courseInfo.thumbnail);
      formData.append('title', courseInfo.title);
      formData.append('shortDescription', courseInfo.shortDescription);
      formData.append('sources', courseInfo.sources);
      formData.append('duration', courseInfo.duration);
      formData.append('proficiency', courseInfo.proficiency);
      formData.append('certificateGiven', courseInfo.certificateGiven);
      formData.append('projectBased', courseInfo.projectBased);
      formData.append('lastUpdated', courseInfo.lastUpdated);
      formData.append('description', courseInfo.description);
      formData.append('learningPoints', JSON.stringify(courseInfo.learningPoints));
      formData.append('requirements', JSON.stringify(courseInfo.requirements));
      
      // Add sections data
      formData.append('sections', JSON.stringify(sections));
      
      await onSubmit(formData);
      toast.success('Course created successfully');
      navigate('/admin-p/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render Step 1: Basic Course Info
  const renderBasicInfo = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Basic Course Information</h2>
      
      {/* Thumbnail */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          Course Thumbnail <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-6">
          <div 
            className={`w-32 h-32 border-2 ${errors.thumbnail ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50`}
            onClick={() => document.getElementById('thumbnail-upload').click()}
          >
            {thumbnailPreview ? (
              <img 
                src={thumbnailPreview} 
                alt="Thumbnail preview" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <>
                <FaUpload className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload image</span>
              </>
            )}
            <input 
              type="file" 
              id="thumbnail-upload" 
              className="hidden"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
          </div>
          <div className="text-sm text-gray-500">
            <p>Recommended size: 1280 x 720 pixels</p>
            <p>Max file size: 5MB</p>
            <p>Formats: JPG, PNG</p>
          </div>
        </div>
        {errors.thumbnail && <p className="text-red-500 text-sm">{errors.thumbnail}</p>}
      </div>
      
      {/* Title */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          Course Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={courseInfo.title}
          onChange={handleCourseInfoChange}
          className={`w-full p-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
          placeholder="e.g., Master Next.js: Complete Developer's Guide"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>
      
      {/* Short Description */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          One-line Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="shortDescription"
          value={courseInfo.shortDescription}
          onChange={handleCourseInfoChange}
          className={`w-full p-2 border ${errors.shortDescription ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
          placeholder="e.g., Build modern, production-ready web applications with Next.js and React"
        />
        {errors.shortDescription && <p className="text-red-500 text-sm">{errors.shortDescription}</p>}
      </div>
      
      {/* Sources */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          Source Names <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="sources"
          value={courseInfo.sources}
          onChange={handleCourseInfoChange}
          className={`w-full p-2 border ${errors.sources ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
          placeholder="e.g., YouTube, Udemy, etc."
        />
        {errors.sources && <p className="text-red-500 text-sm">{errors.sources}</p>}
      </div>
      
      {/* Duration */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          Course Duration <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="duration"
          value={courseInfo.duration}
          onChange={handleCourseInfoChange}
          className={`w-full p-2 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
          placeholder="e.g., 10 hours"
        />
        {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
      </div>
      
      {/* Proficiency, Certificate, Project */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">Proficiency Level</label>
          <select
            name="proficiency"
            value={courseInfo.proficiency}
            onChange={handleCourseInfoChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            {PROFICIENCY_LEVELS.map(level => (
              <option key={level.id} value={level.id}>{level.label}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <span className="block text-gray-700 font-medium">Certificate</span>
          <label className="inline-flex items-center mt-2">
            <input
              type="checkbox"
              name="certificateGiven"
              checked={courseInfo.certificateGiven}
              onChange={handleCourseInfoChange}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2">Certificate provided upon completion</span>
          </label>
        </div>
        
        <div className="space-y-2">
          <span className="block text-gray-700 font-medium">Project-Based</span>
          <label className="inline-flex items-center mt-2">
            <input
              type="checkbox"
              name="projectBased"
              checked={courseInfo.projectBased}
              onChange={handleCourseInfoChange}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2">Includes hands-on projects</span>
          </label>
        </div>
      </div>
      
      {/* Last Updated */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">Last Updated</label>
        <input
          type="date"
          name="lastUpdated"
          value={courseInfo.lastUpdated}
          onChange={handleCourseInfoChange}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          About This Course <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={courseInfo.description}
          onChange={handleCourseInfoChange}
          rows={5}
          className={`w-full p-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
          placeholder="Provide a detailed description of your course"
        ></textarea>
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>
      
      {/* What You'll Learn */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-gray-700 font-medium">
            What You'll Learn <span className="text-red-500">*</span> <span className="text-sm text-gray-500">(minimum 2)</span>
          </label>
          <button
            type="button"
            onClick={() => addArrayField('learningPoints')}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
          >
            <FaPlus className="mr-1" /> Add Point
          </button>
        </div>
        
        {courseInfo.learningPoints.map((point, index) => (
          <div key={`learn-${index}`} className="flex items-center space-x-2">
            <input
              type="text"
              value={point}
              onChange={(e) => handleArrayFieldChange('learningPoints', index, e.target.value)}
              className={`flex-1 p-2 border ${errors.learningPoints ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
              placeholder={`Learning point ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeArrayField('learningPoints', index)}
              className="p-2 text-red-500 hover:text-red-700"
              disabled={courseInfo.learningPoints.length <= 2}
            >
              <FaTrash />
            </button>
          </div>
        ))}
        {errors.learningPoints && <p className="text-red-500 text-sm">{errors.learningPoints}</p>}
      </div>
      
      {/* Requirements */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-gray-700 font-medium">Requirements</label>
          <button
            type="button"
            onClick={() => addArrayField('requirements')}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
          >
            <FaPlus className="mr-1" /> Add Requirement
          </button>
        </div>
        
        {courseInfo.requirements.map((requirement, index) => (
          <div key={`req-${index}`} className="flex items-center space-x-2">
            <input
              type="text"
              value={requirement}
              onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
              className={`flex-1 p-2 border ${errors.requirements ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
              placeholder={`Requirement ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeArrayField('requirements', index)}
              className="p-2 text-red-500 hover:text-red-700"
              disabled={courseInfo.requirements.length <= 1}
            >
              <FaTrash />
            </button>
          </div>
        ))}
        {errors.requirements && <p className="text-red-500 text-sm">{errors.requirements}</p>}
      </div>
      
      {/* Number of Sections */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          Number of Sections <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="sectionCount"
          value={courseInfo.sectionCount}
          onChange={handleSectionCountChange}
          min="1"
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
  
  // Render Step 2: Course Structure
  const renderCourseStructure = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Course Structure</h2>
      
      {sections.map((section, sectionIndex) => (
        <div key={`section-${sectionIndex}`} className="border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Section {sectionIndex + 1}</h3>
          </div>
          
          {/* Section Name */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">
              Section Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={section.name}
              onChange={(e) => handleSectionNameChange(sectionIndex, e.target.value)}
              className={`w-full p-2 border ${errors.sectionNames ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
              placeholder="e.g., Getting Started with Next.js"
            />
          </div>
          
          {/* Lessons */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Lessons</h4>
              <button
                type="button"
                onClick={() => addLesson(sectionIndex)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
              >
                <FaPlus className="mr-1" /> Add Lesson
              </button>
            </div>
            
            {section.lessons.map((lesson, lessonIndex) => (
              <div 
                key={`lesson-${sectionIndex}-${lessonIndex}`} 
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Lesson {lessonIndex + 1}</h5>
                  <button
                    type="button"
                    onClick={() => removeLesson(sectionIndex, lessonIndex)}
                    className="p-2 text-red-500 hover:text-red-700"
                    disabled={section.lessons.length <= 1}
                  >
                    <FaTrash />
                  </button>
                </div>
                
                {/* Lesson Type */}
                <div className="space-y-2">
                  <label className="block text-gray-700">Lesson Type</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'video')}
                      className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      <FaVideo className="mr-2" /> Video
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'reading')}
                      className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'reading' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      <FaFileAlt className="mr-2" /> Reading/Instructions
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'quiz')}
                      className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      <FaQuestionCircle className="mr-2" /> Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'resources')}
                      className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'resources' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      <FaBook className="mr-2" /> Additional Resources
                    </button>
                  </div>
                </div>
                
                {/* Lesson Title */}
                <div className="space-y-2">
                  <label className="block text-gray-700">
                    Lesson Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'title', e.target.value)}
                    className={`w-full p-2 border ${errors[`section${sectionIndex}lesson${lessonIndex}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    placeholder="e.g., Introduction to Next.js"
                  />
                  {errors[`section${sectionIndex}lesson${lessonIndex}`] && 
                    <p className="text-red-500 text-sm">{errors[`section${sectionIndex}lesson${lessonIndex}`]}</p>
                  }
                </div>
                
                {/* Video specific fields */}
                {lesson.type === 'video' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-gray-700">
                        Video URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lesson.videoUrl}
                        onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'videoUrl', e.target.value)}
                        className={`w-full p-2 border ${errors[`section${sectionIndex}lesson${lessonIndex}video`] ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                        placeholder="e.g., https://www.youtube.com/watch?v=..."
                      />
                      {errors[`section${sectionIndex}lesson${lessonIndex}video`] && 
                        <p className="text-red-500 text-sm">{errors[`section${sectionIndex}lesson${lessonIndex}video`]}</p>
                      }
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-gray-700">About This Lesson</label>
                      <textarea
                        value={lesson.aboutLesson}
                        onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'aboutLesson', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Describe what this lesson covers"
                      ></textarea>
                    </div>
                    
                    {/* Resources toggle */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`has-resources-${sectionIndex}-${lessonIndex}`}
                          checked={lesson.hasResources}
                          onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'hasResources', e.target.checked)}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <label htmlFor={`has-resources-${sectionIndex}-${lessonIndex}`} className="ml-2 text-gray-700">
                          This lesson has resources
                        </label>
                      </div>
                    </div>
                    
                    {/* Resources section */}
                    {lesson.hasResources && (
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        <h6 className="font-medium">Resources</h6>
                        
                        {/* Downloadable resources */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-gray-700">Downloadable Resources</label>
                            <button
                              type="button"
                              onClick={() => addResource(sectionIndex, lessonIndex, 'downloadable')}
                              className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
                            >
                              <FaPlus className="mr-1" /> Add
                            </button>
                          </div>
                          
                          {lesson.resources.downloadable.map((resource, resourceIndex) => (
                            <div 
                              key={`download-${sectionIndex}-${lessonIndex}-${resourceIndex}`}
                              className="p-3 bg-gray-50 rounded-lg space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Resource {resourceIndex + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => removeResource(sectionIndex, lessonIndex, 'downloadable', resourceIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                              
                              <input
                                type="text"
                                value={resource.name}
                                onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'downloadable', resourceIndex, 'name', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Resource name"
                              />
                              
                              <textarea
                                value={resource.description}
                                onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'downloadable', resourceIndex, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Resource description"
                              ></textarea>
                              
                              <input
                                type="text"
                                value={resource.link}
                                onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'downloadable', resourceIndex, 'link', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Download link"
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Internet resources */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-gray-700">Internet Resources</label>
                            <button
                              type="button"
                              onClick={() => addResource(sectionIndex, lessonIndex, 'internet')}
                              className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
                            >
                              <FaPlus className="mr-1" /> Add
                            </button>
                          </div>
                          
                          {lesson.resources.internet.map((resource, resourceIndex) => (
                            <div 
                              key={`internet-${sectionIndex}-${lessonIndex}-${resourceIndex}`}
                              className="p-3 bg-gray-50 rounded-lg space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Resource {resourceIndex + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => removeResource(sectionIndex, lessonIndex, 'internet', resourceIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                              
                              <input
                                type="text"
                                value={resource.name}
                                onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'internet', resourceIndex, 'name', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Resource name"
                              />
                              
                              <textarea
                                value={resource.description}
                                onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'internet', resourceIndex, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Resource description"
                              ></textarea>
                              
                              <input
                                type="text"
                                value={resource.link}
                                onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'internet', resourceIndex, 'link', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Resource link"
                              />
                            </div>
                          ))}
                        </div>
                        
                        {errors[`section${sectionIndex}lesson${lessonIndex}resources`] && 
                          <p className="text-red-500 text-sm">{errors[`section${sectionIndex}lesson${lessonIndex}resources`]}</p>
                        }
                      </div>
                    )}
                  </div>
                )}
                
                {/* Reading specific fields */}
                {lesson.type === 'reading' && (
                  <div className="space-y-2">
                    <label className="block text-gray-700">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={lesson.aboutLesson}
                      onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'aboutLesson', e.target.value)}
                      rows={6}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Enter the instruction content (supports Markdown)"
                    ></textarea>
                  </div>
                )}
                
                {/* Quiz specific fields */}
                {lesson.type === 'quiz' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h6 className="font-medium">Quiz Questions</h6>
                      <button
                        type="button"
                        onClick={() => addQuizQuestion(sectionIndex, lessonIndex)}
                        className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
                      >
                        <FaPlus className="mr-1" /> Add Question
                      </button>
                    </div>
                    
                    {lesson.quizQuestions.map((question, questionIndex) => (
                      <div 
                        key={`question-${sectionIndex}-${lessonIndex}-${questionIndex}`}
                        className="p-4 border border-gray-200 rounded-lg space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Question {questionIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeQuizQuestion(sectionIndex, lessonIndex, questionIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuizQuestionChange(sectionIndex, lessonIndex, questionIndex, 'question', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Enter question"
                        />
                        
                        <div className="space-y-2">
                          <label className="block text-gray-700">Options</label>
                          {question.options.map((option, optionIndex) => (
                            <div key={`option-${sectionIndex}-${lessonIndex}-${questionIndex}-${optionIndex}`} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct-${sectionIndex}-${lessonIndex}-${questionIndex}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => handleQuizQuestionChange(sectionIndex, lessonIndex, questionIndex, 'correctAnswer', optionIndex)}
                                className="form-radio h-4 w-4 text-blue-600"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleQuizQuestionChange(sectionIndex, lessonIndex, questionIndex, 'options', e.target.value, optionIndex)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                            </div>
                          ))}
                          <p className="text-sm text-gray-500">Select the radio button for the correct answer</p>
                        </div>
                      </div>
                    ))}
                    
                    {errors[`section${sectionIndex}lesson${lessonIndex}quiz`] && 
                      <p className="text-red-500 text-sm">{errors[`section${sectionIndex}lesson${lessonIndex}quiz`]}</p>
                    }
                  </div>
                )}
                
                {/* Additional Resources specific fields */}
                {lesson.type === 'resources' && (
                  <div className="space-y-4">
                    {/* Downloadable resources */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-gray-700">Downloadable Resources</label>
                        <button
                          type="button"
                          onClick={() => addResource(sectionIndex, lessonIndex, 'downloadable')}
                          className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
                        >
                          <FaPlus className="mr-1" /> Add
                        </button>
                      </div>
                      
                      {lesson.resources.downloadable.map((resource, resourceIndex) => (
                        <div 
                          key={`download-${sectionIndex}-${lessonIndex}-${resourceIndex}`}
                          className="p-3 bg-gray-50 rounded-lg space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Resource {resourceIndex + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeResource(sectionIndex, lessonIndex, 'downloadable', resourceIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={resource.name}
                            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'downloadable', resourceIndex, 'name', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Resource name"
                          />
                          
                          <textarea
                            value={resource.description}
                            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'downloadable', resourceIndex, 'description', e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Resource description"
                          ></textarea>
                          
                          <input
                            type="text"
                            value={resource.link}
                            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'downloadable', resourceIndex, 'link', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Download link"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Internet resources */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-gray-700">Internet Resources</label>
                        <button
                          type="button"
                          onClick={() => addResource(sectionIndex, lessonIndex, 'internet')}
                          className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
                        >
                          <FaPlus className="mr-1" /> Add
                        </button>
                      </div>
                      
                      {lesson.resources.internet.map((resource, resourceIndex) => (
                        <div 
                          key={`internet-${sectionIndex}-${lessonIndex}-${resourceIndex}`}
                          className="p-3 bg-gray-50 rounded-lg space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Resource {resourceIndex + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeResource(sectionIndex, lessonIndex, 'internet', resourceIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={resource.name}
                            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'internet', resourceIndex, 'name', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Resource name"
                          />
                          
                          <textarea
                            value={resource.description}
                            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'internet', resourceIndex, 'description', e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Resource description"
                          ></textarea>
                          
                          <input
                            type="text"
                            value={resource.link}
                            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, 'internet', resourceIndex, 'link', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Resource link"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Engineering Course</h1>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeStep === 1 && renderBasicInfo()}
            {activeStep === 2 && renderCourseStructure()}
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
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
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

export default EngineeringCourseForm;