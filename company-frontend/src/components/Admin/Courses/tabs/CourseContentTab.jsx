import React from 'react';
import { FaTrash } from 'react-icons/fa';

const CourseContentTab = ({ form, setForm, errors }) => {
  const handleSubtopicChange = (index, field, value) => {
    const newSubtopics = [...form.subtopics];
    newSubtopics[index] = { ...newSubtopics[index], [field]: value };
    setForm({ ...form, subtopics: newSubtopics });
  };

  const addSubtopic = () => {
    setForm({
      ...form,
      subtopics: [...form.subtopics, { title: '', link: '', type: 'video', duration: '' }]
    });
  };

  const removeSubtopic = (index) => {
    setForm({
      ...form,
      subtopics: form.subtopics.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      {form.subtopics.map((subtopic, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Module {index + 1}</h3>
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
            placeholder="Content Link (YouTube/Article)"
            className="w-full p-2 border rounded-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={subtopic.type}
              onChange={(e) => handleSubtopicChange(index, 'type', e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="quiz">Quiz</option>
            </select>

            <input
              type="text"
              value={subtopic.duration}
              onChange={(e) => handleSubtopicChange(index, 'duration', e.target.value)}
              placeholder="Duration (e.g., 15:00)"
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSubtopic}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        + Add New Module
      </button>
    </div>
  );
};

export default CourseContentTab;