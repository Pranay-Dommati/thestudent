import React from 'react';
import { FaPlay, FaBook, FaClock, FaRupeeSign } from 'react-icons/fa';

const PreviewTab = ({ form }) => {
  return (
    <div className="space-y-8">
      <div className="relative bg-gray-100 rounded-xl p-6">
        {form.thumbnail && (
          <img
            src={URL.createObjectURL(form.thumbnail)}
            alt="Course thumbnail"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}

        <h1 className="text-2xl font-bold mb-2">{form.title || 'Course Title'}</h1>
        <div className="flex items-center gap-4 text-gray-600 mb-4">
          <span>{form.category}</span>
          <span>•</span>
          <span>{form.board}</span>
          <span>•</span>
          <span>{form.subject}</span>
        </div>

        <p className="text-gray-700 mb-4">{form.description}</p>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <FaClock className="text-gray-500" />
            <span>{form.duration || '0'} hours</span>
          </div>
          <div className="flex items-center gap-2">
            <FaRupeeSign className="text-gray-500" />
            <span>{form.price || '0'}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Course Content</h2>
        <div className="space-y-3">
          {form.subtopics.map((subtopic, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {subtopic.type === 'video' ? (
                <FaPlay className="text-blue-500" />
              ) : (
                <FaBook className="text-green-500" />
              )}
              <div>
                <h3 className="font-medium">{subtopic.title}</h3>
                <p className="text-sm text-gray-600">{subtopic.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {form.requirements.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Requirements</h2>
          <ul className="list-disc pl-5 space-y-2">
            {form.requirements.map((req, index) => (
              <li key={index} className="text-gray-700">{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PreviewTab;