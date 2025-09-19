import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-toastify';
import axiosInstance from '../../../utils/axios';
import { CheckIcon } from '@heroicons/react/24/solid';
import BasicInfoStep from './EngineeringCourseForm/BasicInfoStep';
import CourseStructureStep from './EngineeringCourseForm/CourseStructureStep';

const EngineeringCourseEditForm = ({ course, onSuccess, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [isLoading, setIsLoading] = useState(false);

  // Basic info state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    proficiency_level: 'beginner',
    language: 'English',
    duration: '',
    price: '',
    description: '',
    shortDescription: '',
    sources: '',
    prerequisites: [],
    learning_outcomes: [],
    skills_gained: [],
    tags: [],
    is_active: true,
    is_featured: false,
    proficiency: 'beginner',
    sectionCount: 1,
    // Initialize camelCase versions for the BasicInfoStep component
    learningPoints: [],
    learningOutcomes: [],
    skillsGained: [],
    requirements: []
  });

  // Course structure state
  const [sections, setSections] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Helper function to ensure all required arrays exist in formData
  const ensureRequiredArrays = (data) => {
    const result = { ...data };
    
    // Ensure all these arrays exist
    const requiredArrays = [
      'prerequisites', 
      'learning_outcomes', 
      'skills_gained', 
      'tags', 
      'learningPoints',
      'learningOutcomes', 
      'skillsGained',
      'requirements'
    ];
    
    requiredArrays.forEach(arrayName => {
      if (!result[arrayName]) {
        result[arrayName] = [];
      }
    });
    
    // Ensure special mappings
    if (result.learning_outcomes && !result.learningPoints) {
      result.learningPoints = [...result.learning_outcomes];
    }
    
    if (result.learningPoints && !result.learning_outcomes) {
      result.learning_outcomes = [...result.learningPoints];
    }
    
    if (result.skills_gained && !result.skillsGained) {
      result.skillsGained = [...result.skills_gained];
    }
    
    if (result.skillsGained && !result.skills_gained) {
      result.skills_gained = [...result.skillsGained];
    }
    
    return result;
  };

  useEffect(() => {
    if (course) {
      // Console log to debug what's coming from the backend
      console.log("Course data from backend:", course);
      
      // Ensure all required fields have default values
      const defaultValues = {
        title: '',
        category: '',
        proficiency_level: 'beginner',
        language: 'English',
        duration: '',
        price: '',
        description: '',
        shortDescription: '',
        sources: '',
        prerequisites: [],
        learning_outcomes: [],
        skills_gained: [],
        tags: [],
        is_active: true,
        is_featured: false,
        proficiency: 'beginner',
        sectionCount: 1,
        learningPoints: [],
        learningOutcomes: [],
        skillsGained: [],
        requirements: []
      };
      
      const initialFormData = {
        ...defaultValues,
        title: course.title || '',
        category: course.category || '',
        proficiency_level: course.proficiency_level || defaultValues.proficiency_level,
        language: course.language || defaultValues.language,
        duration: course.duration || '',
        price: course.price || '',
        description: course.description || '',
        shortDescription: course.short_description || '',
        sources: course.sources || '',
        prerequisites: course.prerequisites || [],
        learning_outcomes: course.learning_outcomes || [],
        skills_gained: course.skills_gained || [],
        tags: course.tags || [],
        is_active: course.is_active !== undefined ? course.is_active : true,
        is_featured: course.is_featured !== undefined ? course.is_featured : false,
        // Add section count based on available sections
        sectionCount: course.sections ? course.sections.length : 1,
        // Add camelCase versions for the BasicInfoStep component
        learningPoints: course.learning_outcomes || [],
        learningOutcomes: course.learning_outcomes || [],
        skillsGained: course.skills_gained || [],
        requirements: course.requirements || []
      };
      
      // Ensure all required arrays exist
      const validatedFormData = ensureRequiredArrays(initialFormData);
      setFormData(validatedFormData);
      
      // Debug the formData after setting it
      console.log("Initial formData state:", {
        title: validatedFormData.title,
        learningPoints: validatedFormData.learningPoints,
        learning_outcomes: validatedFormData.learning_outcomes
      });

      if (course.thumbnail) {
        setThumbnailPreview(course.thumbnail);
      }

      // Set sections data from course.sections if available
      if (course.sections && course.sections.length > 0) {
        const sectionsData = course.sections.map(section => ({
          id: section.id,
          name: section.name,
          lessons: section.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            type: lesson.type || 'video',
            videoUrl: lesson.video_url || '',
            aboutLesson: lesson.about_lesson || '',
            hasResources: lesson.resources ? (lesson.resources.downloadable?.length > 0 || lesson.resources.internet?.length > 0) : false,
            resources: {
              downloadable: lesson.resources?.downloadable ?? [],
              internet: lesson.resources?.internet ?? []
            },
            quizQuestions: lesson.quiz_questions || []
          }))
        }));
        setSections(sectionsData);
      } else {
        // Initialize with one empty section
        setSections([{
          id: null,
          name: '',
          lessons: []
        }]);
      }
    }
  }, [course]);

  // Handler functions for step 1 (Basic Info)
  const handleInputChange = (name, value) => {
    console.log("Engineering handleInputChange called with", name, value);
    
    // Field mapping for camelCase to snake_case and vice versa
    const fieldMapping = {
      'prerequisites': 'prerequisites',
      'learningOutcomes': 'learning_outcomes',
      // Removed duplicate key 'learning_outcomes'
      'learningPoints': 'learning_outcomes',
      // Using a property with a different name to achieve the same mapping
      'learning_outcomes_reverse': 'learningPoints',
      'skillsGained': 'skills_gained',
      'skills_gained': 'skillsGained',
      'tags': 'tags',
      'requirements': 'requirements'
    };
    
    setFormData(prev => {
      const updates = {
        [name]: value
      };
      
      // Update mapped field if it exists
      if (fieldMapping[name]) {
        updates[fieldMapping[name]] = value;
      }
      
      // Special handling for learning_outcomes/learningPoints relation
      if (name === 'learning_outcomes') {
        updates['learningPoints'] = value;
      }
      else if (name === 'learningPoints') {
        updates['learning_outcomes'] = value;
      }
      
      return { ...prev, ...updates };
    });

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Event handler to work with standard React input events
  const handleInputChangeEvent = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    console.log("Engineering handleInputChangeEvent called with", name, fieldValue);
    handleInputChange(name, fieldValue);
  };

  const handleArrayInputChange = (name, index, value) => {
    console.log("Engineering handleArrayInputChange called with", name, index, value);
    
    // Field mapping for camelCase to snake_case and vice versa
    const fieldMapping = {
      'prerequisites': 'prerequisites',
      'learningOutcomes': 'learning_outcomes',
      // Removed duplicate key 'learning_outcomes'
      'learningPoints': 'learning_outcomes',
      // Using a property with a different name to achieve the same mapping
      'learning_outcomes_reverse': 'learningPoints',
      'skillsGained': 'skills_gained',
      'skills_gained': 'skillsGained',
      'tags': 'tags',
      'requirements': 'requirements'
    };
    
    setFormData(prev => {
      // Ensure the array exists before trying to update it
      const currentArray = prev[name] || [];
      
      // Update both camelCase and snake_case versions if there's a mapping
      const updates = {
        [name]: currentArray.map((item, i) => i === index ? value : item)
      };
      
      if (fieldMapping[name]) {
        updates[fieldMapping[name]] = [...updates[name]];
      }
      
      // Special handling for learning_outcomes/learningPoints relation
      if (name === 'learning_outcomes') {
        updates['learningPoints'] = [...updates[name]];
      }
      else if (name === 'learningPoints') {
        updates['learning_outcomes'] = [...updates[name]];
      }
      
      return { ...prev, ...updates };
    });
  };

  const addArrayItem = (name) => {
    console.log("Engineering addArrayItem called for", name);
    
    // Field mapping for camelCase to snake_case and vice versa
    const fieldMapping = {
      'prerequisites': 'prerequisites',
      'learningOutcomes': 'learning_outcomes',
      // Removed duplicate key 'learning_outcomes'
      'learningPoints': 'learning_outcomes',
      // Using a property with a different name to achieve the same mapping
      'learning_outcomes_reverse': 'learningPoints',
      'skillsGained': 'skills_gained',
      'skills_gained': 'skillsGained',
      'tags': 'tags',
      'requirements': 'requirements'
    };
    
    setFormData(prev => {
      // Ensure the array exists before trying to update it
      const currentArray = prev[name] || [];
      
      // Update both camelCase and snake_case versions if there's a mapping
      const updates = {
        [name]: [...currentArray, '']
      };
      
      if (fieldMapping[name]) {
        // If the mapped field doesn't exist in prev, initialize it
        const mappedArray = prev[fieldMapping[name]] || [];
        updates[fieldMapping[name]] = [...mappedArray, ''];
      }
      
      // Special handling for learning_outcomes/learningPoints relation
      if (name === 'learning_outcomes') {
        const learningPointsArray = prev['learningPoints'] || [];
        updates['learningPoints'] = [...learningPointsArray, ''];
      }
      else if (name === 'learningPoints') {
        const learningOutcomesArray = prev['learning_outcomes'] || [];
        updates['learning_outcomes'] = [...learningOutcomesArray, ''];
      }
      
      return { ...prev, ...updates };
    });
  };

  const removeArrayItem = (name, index) => {
    console.log("Engineering removeArrayItem called for", name, index);
    
    // Field mapping for camelCase to snake_case and vice versa
    const fieldMapping = {
      'prerequisites': 'prerequisites',
      'learningOutcomes': 'learning_outcomes',
      // Removed duplicate key 'learning_outcomes'
      'learningPoints': 'learning_outcomes',
      // Using a property with a different name to achieve the same mapping
      'learning_outcomes_reverse': 'learningPoints',
      'skillsGained': 'skills_gained',
      'skills_gained': 'skillsGained',
      'tags': 'tags',
      'requirements': 'requirements'
    };
    
    setFormData(prev => {
      // Ensure the array exists before trying to update it
      const currentArray = prev[name] || [];
      
      // Update both camelCase and snake_case versions if there's a mapping
      const updates = {
        [name]: currentArray.filter((_, i) => i !== index)
      };
      
      if (fieldMapping[name]) {
        const mappedArray = prev[fieldMapping[name]] || [];
        updates[fieldMapping[name]] = mappedArray.filter((_, i) => i !== index);
      }
      
      // Special handling for learning_outcomes/learningPoints relation
      if (name === 'learning_outcomes') {
        const learningPointsArray = prev['learningPoints'] || [];
        updates['learningPoints'] = learningPointsArray.filter((_, i) => i !== index);
      }
      else if (name === 'learningPoints') {
        const learningOutcomesArray = prev['learning_outcomes'] || [];
        updates['learning_outcomes'] = learningOutcomesArray.filter((_, i) => i !== index);
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
    console.log('Next button clicked');
    console.log('Current step:', currentStep);
    console.log('Current form data:', formData);
    
    const isValid = validateStep(currentStep);
    console.log('Validation result:', isValid);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      console.log('Moving to next step');
    } else {
      console.log('Validation failed, staying on current step');
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step) => {
    const newErrors = {};
    console.log('Validating step:', step);
    console.log('Current formData:', formData);

    if (step === 1) {
      // Validate basic info
      if (!formData.title?.trim()) {
        newErrors.title = 'Title is required';
        console.log('Title validation failed');
      }
      if (!formData.category) {
        newErrors.category = 'Category is required';
        console.log('Category validation failed');
      }
      if (!formData.proficiency) {
        newErrors.proficiency = 'Proficiency level is required';
        console.log('Proficiency validation failed');
      }
      if (!formData.sources?.trim()) {
        newErrors.sources = 'Sources are required';
        console.log('Sources validation failed');
      }
      if (!formData.duration?.trim()) {
        newErrors.duration = 'Duration is required';
        console.log('Duration validation failed');
      }
      if (!formData.description?.trim()) {
        newErrors.description = 'Description is required';
        console.log('Description validation failed');
      }
      if (!formData.shortDescription?.trim()) {
        newErrors.shortDescription = 'Short description is required';
        console.log('Short description validation failed');
      }
      console.log('Validation errors:', newErrors);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Save-in-the-middle: do not block submission based on current step validation

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      console.log('Starting course update...');
      const submitData = new FormData();
      console.log('Course ID:', course.id);

      // Add basic info
      console.log('Processing form data:', formData);
      
      // Map field names to their API counterparts
      const fieldMapping = {
        title: 'title',
        shortDescription: 'short_description',
        description: 'description',
        category: 'category',
        proficiency: 'proficiency_level',
        language: 'language',
        duration: 'duration',
        price: 'price',
        sources: 'sources',
        prerequisites: 'prerequisites',
        learning_outcomes: 'learning_outcomes',
        skills_gained: 'skills_gained',
        tags: 'tags',
        is_active: 'is_active',
        is_featured: 'is_featured'
      };

      Object.entries(fieldMapping).forEach(([formKey, apiKey]) => {
        const value = formData[formKey];
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            submitData.append(apiKey, JSON.stringify(value.filter(item => item.trim && item.trim() || item)));
          } else {
            submitData.append(apiKey, value);
          }
        }
      });

      // Add thumbnail if changed
      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      }

      // Pad sections to honor desired sectionCount, even if step 2 isn't complete
      const desiredCount = Math.max(1, parseInt(formData.sectionCount || 1));
      const paddedSections = Array.from({ length: desiredCount }, (_, i) => {
        const existing = (sections || [])[i];
        const name = (existing?.name || '').trim() || `Section ${i + 1}`;
        const validLessons = (existing?.lessons || []).filter(les => les.title && les.title.trim());
        const lessons = validLessons.length > 0
          ? validLessons
          : [
              {
                id: null,
                title: 'Lesson 1',
                type: 'video',
                videoUrl: '',
                description: '',
                aboutLesson: ''
              }
            ];
        return { id: existing?.id || null, name, lessons };
      });

      submitData.append('sections', JSON.stringify(paddedSections));

      // Add resource files
      sections.forEach((section, sectionIndex) => {
        section.lessons.forEach((lesson, lessonIndex) => {
          lesson.resources.downloadable.forEach((resource, resourceIndex) => {
            if (resource.file) {
              submitData.append(
                `resource_file_${sectionIndex}_${lessonIndex}_${resourceIndex}`,
                resource.file
              );
            }
          });
        });
      });

      console.log('Sending request to update course:', course.id);
      console.log('Submit data:', Object.fromEntries(submitData.entries()));
      
      const response = await axiosInstance.put(
        `/courses/${course.id}/update/`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          }
        }
      );
      console.log('Response received:', response);

      if (response.status === 200) {
        toast.success('Course updated successfully!');
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
        // Navigate back after successful update
        if (typeof onCancel === 'function') {
          setTimeout(() => {
            onCancel();  // This will trigger navigation back
          }, 1000);  // Small delay to show the success message
        }
      }
    } catch (error) {
      console.error('Error updating course:', error);
      if (error.response?.status === 400) {
        const validationErrors = error.response.data;
        setErrors(validationErrors);
        toast.error('Please fix the validation errors');
      } else if (error.response) {
        console.error('Server response error:', error.response.data);
        toast.error(`Failed to update course: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            courseInfo={formData}
            setCourseInfo={(updates) => {
              console.log("Setting course info with updates:", updates);
              setFormData(prev => {
                const newFormData = {...prev, ...updates};
                console.log("Updated formData:", newFormData);
                return newFormData;
              });
            }}
            handleCourseInfoChange={(e) => {
              const { name, value, type, checked } = e.target;
              const fieldValue = type === 'checkbox' ? checked : value;
              console.log("Handling course info change:", name, fieldValue);
              handleInputChange(name, fieldValue);
            }}
            handleArrayFieldChange={handleArrayInputChange}
            addArrayField={addArrayItem}
            removeArrayField={removeArrayItem}
            handleThumbnailChange={handleThumbnailChange}
            thumbnailPreview={thumbnailPreview}
            handleSectionCountChange={(e) => {
              const count = Math.max(1, parseInt(e.target.value) || 1);
              // Update the visible count in basic info
              handleInputChange('sectionCount', count);
              // Grow or shrink the sections array to match the count
              setSections(prev => {
                if (count > prev.length) {
                  const toAdd = count - prev.length;
                  const newSections = Array.from({ length: toAdd }, () => ({
                    id: null,
                    name: '',
                    lessons: []
                  }));
                  return [...prev, ...newSections];
                } else if (count < prev.length) {
                  return prev.slice(0, count);
                }
                return prev;
              });
            }}
            errors={errors}
            categories={[
              'Software Engineering',
              'Data Science',
              'Web Development', 
              'Mobile Development',
              'DevOps',
              'Cybersecurity',
              'Artificial Intelligence',
              'Machine Learning'
            ]}
            proficiencyLevels={['Beginner', 'Intermediate', 'Advanced']}
            languages={['English', 'Hindi']}
          />
        );
      case 2:
        return (
          <CourseStructureStep
            sections={sections}
            setSections={setSections}
            handleSectionNameChange={handleSectionNameChange}
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

  console.log('Rendering EngineeringCourseEditForm');
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Engineering Course
            </h2>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step === currentStep
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : step < currentStep
                      ? 'border-green-500 bg-green-500 text-white'
                      : isDarkMode
                      ? 'border-gray-600 text-gray-400'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckIcon className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </div>
                {step < totalSteps && (
                  <div
                    className={`flex-1 h-1 ${
                      step < currentStep
                        ? 'bg-green-500'
                        : isDarkMode
                        ? 'bg-gray-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Basic Information
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Course Structure
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className={`rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Update button clicked');
                  handleSubmit(e);
                }}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{isLoading ? 'Updating...' : 'Update Course'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineeringCourseEditForm;
