import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import BasicInfoStep from './BasicInfoStep';
import CourseStructureStep from './CourseStructureStep';
import { createCourse } from '../../../../services/courseApi';

const SchoolCourseForm = ({ onSubmit, onCancel, classLevel }) => {
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
  
  // Course Structure
  const [chapters, setChapters] = useState([
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
      toast.error('At least 2 learning points are required');
      return;
    }
    
    if (fieldName === 'keyTopics' && courseInfo.keyTopics.length <= 1) {
      toast.error('At least 1 key topic is required');
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
    
    // Adjust chapters array to match count
    if (count > chapters.length) {
      // Add new chapters
      setChapters([
        ...chapters,
        ...Array(count - chapters.length).fill().map(() => ({
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
    } else if (count < chapters.length) {
      // Remove excess chapters
      setChapters(chapters.slice(0, count));
    }
  };
  
  // Handle chapter name change
  const handleChapterNameChange = (index, value) => {
    setChapters(chapters.map((chapter, i) => 
      i === index ? {...chapter, name: value} : chapter
    ));
  };
  
  // Add lesson to chapter
  const addLesson = (chapterIndex) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: [
          ...chapter.lessons,
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
      } : chapter
    ));
  };
  
  // Remove lesson from chapter
  const removeLesson = (chapterIndex, lessonIndex) => {
    if (chapters[chapterIndex].lessons.length <= 1) {
      toast.error('Each chapter must have at least one lesson');
      return;
    }
    
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.filter((_, j) => j !== lessonIndex)
      } : chapter
    ));
  };
  
  // Handle lesson data change
  const handleLessonChange = (chapterIndex, lessonIndex, field, value) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.map((lesson, j) => 
          j === lessonIndex ? {...lesson, [field]: value} : lesson
        )
      } : chapter
    ));
  };
  
  // Add resource to lesson
  const addResource = (chapterIndex, lessonIndex, resourceType) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.map((lesson, j) => 
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
      } : chapter
    ));
  };
  
  // Remove resource from lesson
  const removeResource = (chapterIndex, lessonIndex, resourceType, resourceIndex) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            resources: {
              ...lesson.resources,
              [resourceType]: lesson.resources[resourceType].filter((_, k) => k !== resourceIndex)
            }
          } : lesson
        )
      } : chapter
    ));
  };
  
  // Handle resource change
  const handleResourceChange = (chapterIndex, lessonIndex, resourceType, resourceIndex, field, value) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.map((lesson, j) => 
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
      } : chapter
    ));
  };
  
  // Add quiz question
  const addQuizQuestion = (chapterIndex, lessonIndex) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            quizQuestions: [
              ...lesson.quizQuestions,
              { question: '', options: ['', '', '', ''], correctAnswer: 0 }
            ]
          } : lesson
        )
      } : chapter
    ));
  };
  
  // Remove quiz question
  const removeQuizQuestion = (chapterIndex, lessonIndex, questionIndex) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.map((lesson, j) => 
          j === lessonIndex ? {
            ...lesson,
            quizQuestions: lesson.quizQuestions.filter((_, k) => k !== questionIndex)
          } : lesson
        )
      } : chapter
    ));
  };
  
  // Handle quiz question change
  const handleQuizQuestionChange = (chapterIndex, lessonIndex, questionIndex, field, value, optionIndex = null) => {
    setChapters(chapters.map((chapter, i) => 
      i === chapterIndex ? {
        ...chapter,
        lessons: chapter.lessons.map((lesson, j) => 
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
      } : chapter
    ));
  };
  
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
      toast.error("Please fill in all required fields correctly");
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add basic info
      formData.append('title', courseInfo.title);
      formData.append('short_description', courseInfo.title); // Use title as shortDescription
      formData.append('description', `${courseInfo.title} - ${classLevel} - ${courseInfo.subject}`); // Generate a description
      formData.append('class_level', classLevel);
      formData.append('board', courseInfo.board);
      
      if (courseInfo.board === 'state') {
        formData.append('state', courseInfo.state);
      }
      
      formData.append('subject', courseInfo.subject);
      formData.append('duration', courseInfo.duration);
      formData.append('sources', courseInfo.sources);
      
      // Add key topics and learning points - use the field names expected by the backend
      // In views.py, the backend expects 'key_topics' and 'learning_points'
      const filteredKeyTopics = courseInfo.keyTopics.filter(topic => topic.trim() !== '');
      const filteredLearningPoints = courseInfo.learningPoints.filter(point => point.trim() !== '');
      
      console.log('Filtered Key Topics:', filteredKeyTopics);
      console.log('Filtered Learning Points:', filteredLearningPoints);
      
      // Change from 'keyTopics' to 'key_topics' to match backend expectations
      formData.append('key_topics', JSON.stringify(filteredKeyTopics));
      formData.append('learning_points', JSON.stringify(filteredLearningPoints));
      
      // Add thumbnail if it exists
      if (courseInfo.thumbnail) {
        formData.append('thumbnail', courseInfo.thumbnail);
      }
      
      // Process chapters data for API
      const chaptersData = chapters.map(chapter => ({
        name: chapter.name,
        lessons: chapter.lessons.map(lesson => ({
          title: lesson.title,
          type: lesson.type,
          videoUrl: lesson.videoUrl,
          aboutLesson: lesson.aboutLesson,
          resources: lesson.hasResources ? lesson.resources : { downloadable: [], internet: [] },
          quizQuestions: lesson.quizQuestions || []
        }))
      }));
      
      // Add chapters data
      formData.append('chapters', JSON.stringify(chaptersData));
      
      // Submit the form
      await createCourse(formData);
      toast.success('Course created successfully');
      navigate('/admin-p/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
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
        <AnimatePresence mode="wait">
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