import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import BasicInfoStep from './BasicInfoStep';
import CourseStructureStep from './CourseStructureStep';
import { createCourse } from '../../../../services/courseApi';
import { sanitizeFileName } from '../../../../utils/fileHelpers';

const EngineeringCourseForm = ({ onSubmit, onCancel }) => {
  const STORAGE_KEY = 'draft_engineering_course';
  const saveTimer = useRef(null);
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
    category: '', // Add this line
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
  
  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.courseInfo) setCourseInfo(ci => ({ ...ci, ...parsed.courseInfo, thumbnail: null }));
        if (parsed.sections) setSections(parsed.sections);
      }
    } catch (_) { /* ignore */ }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  // Debounced autosave
  const autosave = useMemo(() => (data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const sanitized = {
          courseInfo: { ...data.courseInfo, thumbnail: null },
          sections: data.sections
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch (e) { /* ignore */ }
    }, 400);
  }, []);

  useEffect(() => {
    autosave({ courseInfo, sections });
  }, [courseInfo, sections, autosave]);

  // Errors for validation
  const [errors, setErrors] = useState({});
  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast('Image size must be less than 5MB', {
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
      toast('File name was too long and has been truncated', {
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
      toast('At least 2 learning points are required', {
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
      toast('Each section must have at least one lesson', {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
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
    if (!courseInfo.category.trim()) newErrors.category = 'Course category is required';
    
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
      if (courseInfo.thumbnail) {
        formData.append('thumbnail', courseInfo.thumbnail);
      }
      formData.append('title', courseInfo.title);
      formData.append('shortDescription', courseInfo.shortDescription);
      formData.append('description', courseInfo.description);
      formData.append('duration', courseInfo.duration);
      formData.append('proficiency', courseInfo.proficiency);
      formData.append('certificateGiven', courseInfo.certificateGiven ? 'true' : 'false');
      formData.append('projectBased', courseInfo.projectBased ? 'true' : 'false');
      formData.append('sources', courseInfo.sources);
      formData.append('category', courseInfo.category);
      formData.append('learningPoints', JSON.stringify(courseInfo.learningPoints));
      formData.append('requirements', JSON.stringify(courseInfo.requirements));
      
      // Track resource files with unique identifiers
      let resourceFileCounter = 0;
      const resourceFiles = [];
      
      // Make sure sections data is properly formatted and handle file uploads
      const sectionsData = sections.map(section => ({
        name: section.name,
        lessons: section.lessons.map(lesson => {
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
                resourceFiles.push({
                  id: fileId,
                  file: resource.file
                });
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
          
          return {
            title: lesson.title,
            type: lesson.type,
            videoUrl: lesson.videoUrl,
            description: lesson.description,
            aboutLesson: lesson.aboutLesson,
            resources: lesson.hasResources || lesson.type === 'resources' ? processedResources : { downloadable: [], internet: [] },
            quizQuestions: lesson.quizQuestions || []
          };
        })
      }));
      
      // Add sections data
      formData.append('sections', JSON.stringify(sectionsData));
      
      // Append all resource files with their unique IDs
      resourceFiles.forEach(({ id, file }) => {
        formData.append(id, file);
      });
      
      // Add resource files info
      formData.append('resourceFilesInfo', JSON.stringify(resourceFiles.map(({ id }) => id)));
      
      console.log('Sending formData with files:', resourceFiles.map(rf => rf.id));
      
      // Call createCourse API
      await createCourse(formData);
      toast('Course created successfully!', {
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
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
        toast(`Failed to create course: ${JSON.stringify(error.response.data)}`, {
          icon: '❌',
          style: {
            backgroundColor: '#EF4444',
            color: 'white',
          }
        });
      } else {
        toast('Failed to create course. Please try again.', {
          icon: '❌',
          style: {
            backgroundColor: '#EF4444',
            color: 'white',
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle file change for downloadable resources
  const handleFileChange = (sectionIndex, lessonIndex, resourceIndex, file) => {
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast('File size must be less than 10MB', {
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
      toast('File name was too long and has been truncated', {
        icon: 'ℹ️',
        style: {
          backgroundColor: '#3B82F6',
          color: 'white',
        }
      });
    }
    
    setSections(sections.map((section, i) => 
      i === sectionIndex ? {
        ...section,
        lessons: section.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            resources: {
              ...lesson.resources,
              downloadable: lesson.resources.downloadable.map((resource, k) => 
                k === resourceIndex ? {...resource, file: sanitizedFile} : resource
              )
            }
          } : lesson
        )
      } : section
    ));
  };
  
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
                handleSectionCountChange={handleSectionCountChange}
              />
            )}
            {activeStep === 2 && (
              <CourseStructureStep
                sections={sections}
                handleSectionNameChange={handleSectionNameChange}
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