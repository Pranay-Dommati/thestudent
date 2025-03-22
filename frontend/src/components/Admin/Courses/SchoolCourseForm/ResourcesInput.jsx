import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

const ResourcesInput = ({ 
  chapterIndex, 
  lessonIndex, 
  resources,
  resourceType,
  addResource,
  removeResource,
  handleResourceChange,
  errors
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-gray-700">{resourceType === 'downloadable' ? 'Downloadable Resources' : 'Internet Resources'}</label>
        <button
          type="button"
          onClick={() => addResource(chapterIndex, lessonIndex, resourceType)}
          className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
        >
          <FaPlus className="mr-1" /> Add
        </button>
      </div>
      
      {resources.map((resource, resourceIndex) => (
        <div 
          key={`${resourceType}-${chapterIndex}-${lessonIndex}-${resourceIndex}`}
          className="p-3 bg-gray-50 rounded-lg space-y-2"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Resource {resourceIndex + 1}</span>
            <button
              type="button"
              onClick={() => removeResource(chapterIndex, lessonIndex, resourceType, resourceIndex)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
          
          <input
            type="text"
            value={resource.name}
            onChange={(e) => handleResourceChange(chapterIndex, lessonIndex, resourceType, resourceIndex, 'name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Resource name"
          />
          
          <textarea
            value={resource.description}
            onChange={(e) => handleResourceChange(chapterIndex, lessonIndex, resourceType, resourceIndex, 'description', e.target.value)}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Resource description"
          ></textarea>
          
          <input
            type="text"
            value={resource.link}
            onChange={(e) => handleResourceChange(chapterIndex, lessonIndex, resourceType, resourceIndex, 'link', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder={resourceType === 'downloadable' ? "Download link" : "Resource link"}
          />
        </div>
      ))}
      
      {errors && <p className="text-red-500 text-sm">{errors}</p>}
    </div>
  );
};

export default ResourcesInput;