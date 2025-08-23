import React, { useState } from 'react';
import { FaSave, FaTimes, FaSpinner, FaImage, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'AI',
  'Cybersecurity',
  'Cloud Computing',
  'DevOps',
  'Blockchain',
  'Game Development',
  'Software Engineering',
  'Database',
  'Network',
  'System Administration'
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

const EngineeringCourseEditForm = ({ course, onSubmit, onCancel, isUpdating, isDarkMode }) => {
  const [formData, setFormData] = useState({
    title: course.title || '',
    category: course.category || '',
    proficiency_level: course.proficiency_level || 'beginner',
    duration: course.duration || '',
    description: course.description || '',
    short_description: course.short_description || '',
    is_published: course.is_published || false,
    price: course.price || '0',
    learning_objectives: course.learning_objectives || [],
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(
    course.thumbnail ? `http://localhost:8000${course.thumbnail}` : null
  );
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target.result);
      reader.readAsDataURL(file);
    }
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
    if (!formData.description.trim()) newErrors.description = 'Description is required';
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
      if (key === 'learning_objectives') {
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
            <label className={labelClasses}>Proficiency Level</label>
            <select
              name="proficiency_level"
              value={formData.proficiency_level}
              onChange={handleInputChange}
              className={inputClasses}
            >
              {PROFICIENCY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className={inputClasses}
                placeholder="e.g., 10 weeks, 40 hours"
              />
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
                min="0"
                step="0.01"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
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
            <label className={labelClasses}>Short Description</label>
            <textarea
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
              rows={3}
              className={inputClasses}
              placeholder="Brief description for course card"
            />
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
