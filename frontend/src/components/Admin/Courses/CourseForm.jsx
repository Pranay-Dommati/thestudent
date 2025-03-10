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
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Publish course</span>
          </label>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Course'
            )}
          </button>
        </div>
      </div>

      {/* Form Content */}
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
    </div>
  );
};

export default CourseForm;