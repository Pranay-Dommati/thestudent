import React from 'react';
import { FaUpload } from 'react-icons/fa';
import universalToast from '../../../../utils/universalToast';

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

const BasicInfoTab = ({ form, setForm, errors }) => {
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setForm({ ...form, thumbnail: file });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={`w-full p-2 border rounded-lg ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter course title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Category and Board */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value, board: '' })}
              className={`w-full p-2 border rounded-lg ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Category</option>
              {courseCategories.map(c => (
                <option key={c.level} value={c.level}>{c.level}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Board <span className="text-red-500">*</span>
            </label>
            <select
              value={form.board}
              onChange={(e) => setForm({ ...form, board: e.target.value })}
              className={`w-full p-2 border rounded-lg ${errors.board ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Board</option>
              {courseCategories.find(c => c.level === form.category)?.boards.map(board => (
                <option key={board} value={board}>{board}</option>
              ))}
            </select>
            {errors.board && <p className="mt-1 text-sm text-red-500">{errors.board}</p>}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={`w-full p-2 border rounded-lg ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select Subject</option>
            {subjects[form.category?.includes('Undergraduate') ? 'undergraduate' : 'school']?.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject}</p>}
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        {/* Thumbnail Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course Thumbnail
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleThumbnailChange}
                    accept="image/*"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className={`w-full p-2 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter course description"
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;