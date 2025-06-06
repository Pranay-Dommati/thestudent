import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

export const CourseContentTab = ({ form, handleSubtopicChange, addSubtopic, removeSubtopic, errors }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-lg">Course Content</h3>
    {form.subtopics.map((subtopic, index) => (
      <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="flex justify-between">
          <h4 className="font-medium">Module {index + 1}</h4>
          <button
            type="button"
            onClick={() => removeSubtopic(index)}
            className="text-red-500 hover:text-red-700"
          >
            <FaTrash />
          </button>
        </div>
        <input
          type="text"
          value={subtopic.title}
          onChange={(e) => handleSubtopicChange(index, 'title', e.target.value)}
          placeholder="Module Title"
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="text"
          value={subtopic.link}
          onChange={(e) => handleSubtopicChange(index, 'link', e.target.value)}
          placeholder="Content Link"
          className="w-full p-2 border rounded-lg"
        />
        <select
          value={subtopic.type}
          onChange={(e) => handleSubtopicChange(index, 'type', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>
    ))}
    <button
      type="button"
      onClick={addSubtopic}
      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center"
    >
      <FaPlus className="mr-2" /> Add Module
    </button>
  </div>
);