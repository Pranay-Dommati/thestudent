import React, { useState, useCallback, useEffect } from 'react';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import BasicInfoTab from './tabs/BasicInfoTab';
import CourseContentTab from './tabs/CourseContentTab';
import RequirementsTab from './tabs/RequirementsTab';
import PreviewTab from './tabs/PreviewTab';
import EngineeringCourseForm from './EngineeringCourseForm/index';
import SchoolCourseForm from './SchoolCourseForm/index'; // Add this import

const courseCategories = [
  { level: '6th', boards: ['CBSE', 'SSC (TS)', 'SSC (AP)'] },
  { level: '7th', boards: ['CBSE', 'SSC (TS)', 'SSC (AP)'] },
  { level: '8th', boards: ['CBSE', 'SSC (TS)', 'SSC (AP)'] },
  { level: '9th', boards: ['CBSE', 'SSC (TS)', 'SSC (AP)'] },
  { level: '10th', boards: ['CBSE', 'SSC (TS)', 'SSC (AP)'] },
  { level: '11th', boards: ['CBSE'] },
  { level: '12th', boards: ['CBSE'] },
  { level: 'Undergraduate', boards: ['All'] },
];

const subjects = {
  'school': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'Social Science'],
  'undergraduate': ['Engineering Mathematics', 'Data Structures', 'Computer Networks', 'Database Management']
};

const EDUCATION_LEVELS = [
  { id: 'engineering', label: 'Engineering' },
  { id: '6th', label: 'Class 6' },
  { id: '7th', label: 'Class 7' },
  { id: '8th', label: 'Class 8' },
  { id: '9th', label: 'Class 9' },
  { id: '10th', label: 'Class 10' },
  { id: '11th', label: 'Class 11' },
  { id: '12th', label: 'Class 12' }
];

const CourseForm = ({ onSubmit, onCancel, initialData = null, isEditMode = false, isDarkMode = false }) => {
  const { courseType, courseId } = useParams();
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState({
    title: initialData?.title || '',
    category: initialData?.category || '',
    board: initialData?.board || '',
    subject: initialData?.subject || '',
    duration: initialData?.duration || '',
    price: initialData?.price || '',
    description: initialData?.description || '',
    thumbnail: null,
    youtubeLink: initialData?.youtubeLink || '',
    subtopics: initialData?.subtopics || [{ title: '', link: '', type: 'video', duration: '' }],
    requirements: initialData?.requirements || [''],
    learningObjectives: initialData?.learningObjectives || [''],
    isPublished: initialData?.isPublished || false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showLevelSelection, setShowLevelSelection] = useState(!isEditMode);
  const [loading, setLoading] = useState(isEditMode);

  // Load course data for edit mode
  useEffect(() => {
    if (isEditMode && courseType && courseId) {
      loadCourseData();
    }
  }, [isEditMode, courseType, courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      // Import the API function based on course type
      let courseData;
      if (courseType === 'engineering') {
        const { getEngineeringCourseById } = await import('../../../services/courseApi');
        courseData = await getEngineeringCourseById(courseId);
      } else {
        // For school courses
        const { getSchoolCourseById } = await import('../../../services/courseApi');
        courseData = await getSchoolCourseById(courseId);
      }

      if (courseData) {
        // Set the form data
        setForm({
          title: courseData.title || '',
          category: courseData.category || '',
          board: courseData.board || '',
          subject: courseData.subject || '',
          duration: courseData.duration || '',
          price: courseData.price || '',
          description: courseData.description || '',
          thumbnail: null, // Don't set existing thumbnail to avoid FormData issues
          youtubeLink: courseData.youtube_link || courseData.youtubeLink || '',
          subtopics: courseData.subtopics || [{ title: '', link: '', type: 'video', duration: '' }],
          requirements: courseData.requirements || [''],
          learningObjectives: courseData.learningObjectives || [''],
          isPublished: courseData.is_published || false
        });

        // Set the selected level based on course type
        if (courseType === 'engineering') {
          setSelectedLevel({ id: 'engineering', label: 'Engineering' });
        } else {
          // For school courses, determine the class level
          const classLevel = courseData.class || courseData.class_level;
          const level = EDUCATION_LEVELS.find(l => l.id === classLevel);
          if (level) {
            setSelectedLevel(level);
          }
        }
        
        setShowLevelSelection(false);
        
        // Dismiss loading toast
        toast.dismiss('edit-course-loading');
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.dismiss('edit-course-loading');
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!form.title) newErrors.title = 'Title is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.board) newErrors.board = 'Board is required';
    if (!form.subject) newErrors.subject = 'Subject is required';
    if (!form.description) newErrors.description = 'Description is required';
    if (form.subtopics.length === 0) newErrors.subtopics = 'At least one subtopic is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'subtopics' || key === 'requirements' || key === 'learningObjectives') {
          formData.append(key, JSON.stringify(form[key]));
        } else if (key === 'thumbnail' && form[key]) {
          formData.append(key, form[key]);
        } else {
          formData.append(key, form[key]);
        }
      });

      await onSubmit(formData);
      toast.success('Course saved successfully!');
      onCancel();
    } catch (error) {
      console.error('Error submitting course:', error);
      toast.error('Failed to save course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) { // 5MB
        toast.error('Image size should be less than 5MB');
        return;
      }
      setForm({ ...form, thumbnail: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleArrayFieldChange = (field, index, value) => {
    const items = [...form[field]];
    items[index] = value;
    setForm({ ...form, [field]: items });
  };

  const addArrayField = (field) => {
    setForm({ ...form, [field]: [...form[field], ''] });
  };

  const removeArrayField = (field, index) => {
    const items = form[field].filter((_, i) => i !== index);
    setForm({ ...form, [field]: items });
  };

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setShowLevelSelection(false);
  };

  const renderFormBasedOnLevel = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading course data...</span>
        </div>
      );
    }

    switch(selectedLevel?.id) {
      case 'engineering':
        return <EngineeringCourseForm onCancel={onCancel} isEditMode={isEditMode} courseId={courseId} />;
      case '6th':
      case '7th':
      case '8th':
      case '9th':
      case '10th':
      case '11th':
      case '12th':
        return <SchoolCourseForm onCancel={onCancel} classLevel={selectedLevel.id} isEditMode={isEditMode} courseId={courseId} />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'content', label: 'Course Content' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'preview', label: 'Preview' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfoTab form={form} setForm={setForm} errors={errors} />;
      case 'content':
        return (
          <CourseContentTab
            form={form}
            setForm={setForm}
            errors={errors}
          />
        );
      case 'requirements':
        return (
          <RequirementsTab
            form={form}
            setForm={setForm}
            errors={errors}
          />
        );
      case 'preview':
        return <PreviewTab form={form} />;
      default:
        return null;
    }
  };
  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl shadow-lg p-4 sm:p-5 md:p-6 max-w-7xl mx-auto`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">
          {isEditMode ? 'Edit Course' : 'Create New Course'}
        </h2>
        {!showLevelSelection && !loading && (
          <button
            onClick={() => setShowLevelSelection(true)}
            className="text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            Change Education Level
          </button>
        )}
      </div>      {showLevelSelection ? (
        <div className="space-y-4 sm:space-y-6">
          <p className="text-gray-600 text-sm sm:text-base">Select the education level for your new course:</p>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {EDUCATION_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelSelect(level)}
                className="p-4 sm:p-6 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center gap-1 sm:gap-2"
              >
                <span className="text-base sm:text-lg font-medium text-gray-800">{level.label}</span>
                <p className="text-xs sm:text-sm text-gray-500 text-center">
                  {level.id === 'engineering' 
                    ? 'Professional skill development'
                    : `${level.label} standard courses`}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        renderFormBasedOnLevel()
      )}
    </div>
  );
};

export default CourseForm;