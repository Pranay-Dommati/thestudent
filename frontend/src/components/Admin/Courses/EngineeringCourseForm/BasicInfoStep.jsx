import React from 'react';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';

const PROFICIENCY_LEVELS = [
  { id: 'beginner', label: 'Beginner (No prior experience needed)' },
  { id: 'intermediate', label: 'Intermediate (Basic knowledge required)' },
  { id: 'advanced', label: 'Advanced (Expert-Level)' }
];

const BasicInfoStep = ({ 
  courseInfo, 
  setCourseInfo, 
  errors, 
  thumbnailPreview, 
  handleThumbnailChange,
  handleCourseInfoChange,
  handleArrayFieldChange,
  addArrayField,
  removeArrayField,
  handleSectionCountChange
}) => {
  return (
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
};

export default BasicInfoStep;