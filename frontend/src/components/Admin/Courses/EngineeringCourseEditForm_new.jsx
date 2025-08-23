import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { CheckIcon } from '@heroicons/react/24/solid';
import BasicInfoStep from './EngineeringCourseForm/BasicInfoStep';
import CourseStructureStep from './EngineeringCourseForm/CourseStructureStep';

const EngineeringCourseEditForm = ({ course, onSuccess, onCancel, isLoading, setIsLoading }) => {
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Basic info state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    proficiency_level: '',
    language: '',
    duration: '',
    price: '',
    description: '',
    short_description: '',
    sources: '',
    prerequisites: [],
    learning_outcomes: [],
    skills_gained: [],
    tags: [],
    is_active: true,
    is_featured: false
  });

  // Course structure state
  const [sections, setSections] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        category: course.category || '',
        proficiency_level: course.proficiency_level || '',
        language: course.language || 'English',
        duration: course.duration || '',
        price: course.price || '',
        description: course.description || '',
        short_description: course.short_description || '',
        sources: course.sources || '',
        prerequisites: course.prerequisites || [],
        learning_outcomes: course.learning_outcomes || [],
        skills_gained: course.skills_gained || [],
        tags: course.tags || [],
        is_active: course.is_active !== undefined ? course.is_active : true,
        is_featured: course.is_featured !== undefined ? course.is_featured : false
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
            hasResources: lesson.resources && (lesson.resources.downloadable.length > 0 || lesson.resources.internet.length > 0),
            resources: {
              downloadable: lesson.resources?.downloadable || [],
              internet: lesson.resources?.internet || []
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const submitData = new FormData();

      // Add basic info
      Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Add thumbnail if changed
      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      }

      // Add sections data
      submitData.append('sections', JSON.stringify(sections));

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

      const response = await axios.put(
        `http://localhost:8000/api/courses/${course.id}/`,
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200) {
        toast.success('Course updated successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating course:', error);
      if (error.response?.status === 400) {
        const validationErrors = error.response.data;
        setErrors(validationErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error('Failed to update course. Please try again.');
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
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayInputChange={handleArrayInputChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            handleThumbnailChange={handleThumbnailChange}
            thumbnailPreview={thumbnailPreview}
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
                      : 'border-gray-300 text-gray-500'
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
                        : 'bg-gray-300'
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
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                type="submit"
                onClick={handleSubmit}
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
