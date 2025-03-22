import React, { useState, useCallback } from 'react';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import BasicInfoTab from './tabs/BasicInfoTab';
import CourseContentTab from './tabs/CourseContentTab';
import RequirementsTab from './tabs/RequirementsTab';
import PreviewTab from './tabs/PreviewTab';

const courseCategories = [
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
  { id: '10th', label: 'Class 10' },
  { id: '11th', label: 'Class 11' },
  { id: '12th', label: 'Class 12' }
];

const CourseForm = ({ onSubmit, onCancel, initialData = null }) => {
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
  const [showLevelSelection, setShowLevelSelection] = useState(true);

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
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {initialData ? 'Edit Course' : 'Create New Course'}
        </h2>
        {!showLevelSelection && (
          <button
            onClick={() => setShowLevelSelection(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Change Education Level
          </button>
        )}
      </div>

      {showLevelSelection ? (
        <div className="space-y-6">
          <p className="text-gray-600">Select the education level for your new course:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EDUCATION_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelSelect(level)}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-lg font-medium text-gray-800">{level.label}</span>
                <p className="text-sm text-gray-500 text-center">
                  {level.id === 'engineering' 
                    ? 'Professional skill development'
                    : `${level.label} standard courses`}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </form>
      )}
    </div>
  );
};

export default CourseForm;