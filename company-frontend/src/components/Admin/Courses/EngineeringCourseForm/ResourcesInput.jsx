import React from 'react';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';

const ResourcesInput = ({ 
  sectionIndex, 
  lessonIndex, 
  resources,
  resourceType,
  addResource,
  removeResource,
  handleResourceChange,
  handleFileChange,
  errors
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-gray-700">{resourceType === 'downloadable' ? 'Downloadable Resources' : 'Internet Resources'}</label>
        <button
          type="button"
          onClick={() => addResource(sectionIndex, lessonIndex, resourceType)}
          className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
        >
          <FaPlus className="mr-1" /> Add
        </button>
      </div>
      
      {resources.map((resource, resourceIndex) => (
        <div 
          key={`${resourceType}-${sectionIndex}-${lessonIndex}-${resourceIndex}`}
          className="p-3 bg-gray-50 rounded-lg space-y-2"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Resource {resourceIndex + 1}</span>
            <button
              type="button"
              onClick={() => removeResource(sectionIndex, lessonIndex, resourceType, resourceIndex)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
          
          <input
            type="text"
            value={resource.name}
            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, resourceType, resourceIndex, 'name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Resource name"
          />
          
          <textarea
            value={resource.description}
            onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, resourceType, resourceIndex, 'description', e.target.value)}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Resource description"
          ></textarea>
          
          {resourceType === 'downloadable' ? (
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Upload a file or provide a link:</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="file"
                  id={`file-${resourceType}-${sectionIndex}-${lessonIndex}-${resourceIndex}`}
                  onChange={(e) => handleFileChange(sectionIndex, lessonIndex, resourceIndex, e.target.files[0])}
                  className="hidden"
                />
                <label 
                  htmlFor={`file-${resourceType}-${sectionIndex}-${lessonIndex}-${resourceIndex}`}
                  className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300"
                >
                  <FaUpload className="mr-2" />
                  {resource.file ? resource.file.name : "Choose file"}
                </label>
                <span className="text-xs text-gray-500">
                  {resource.file ? `Selected: ${resource.file.name}` : "No file selected"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">OR</span>
                <input
                  type="text"
                  value={resource.link}
                  onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, resourceType, resourceIndex, 'link', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="External download link (optional if file uploaded)"
                />
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={resource.link}
              onChange={(e) => handleResourceChange(sectionIndex, lessonIndex, resourceType, resourceIndex, 'link', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Resource link"
            />
          )}
        </div>
      ))}
      
      {errors && <p className="text-red-500 text-sm">{errors}</p>}
    </div>
  );
};

export default ResourcesInput;