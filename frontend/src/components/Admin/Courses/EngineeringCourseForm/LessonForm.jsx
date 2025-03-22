import React from 'react';
import { FaTrash, FaVideo, FaFileAlt, FaQuestionCircle, FaBook } from 'react-icons/fa';
import ResourcesInput from './ResourcesInput';
import QuizQuestions from './QuizQuestions';

const LessonForm = ({
  sectionIndex,
  lessonIndex,
  lesson,
  removeLesson,
  handleLessonChange,
  addResource,
  removeResource,
  handleResourceChange,
  addQuizQuestion,
  removeQuizQuestion,
  handleQuizQuestionChange,
  errors
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="font-medium">Lesson {lessonIndex + 1}</h5>
        <button
          type="button"
          onClick={() => removeLesson(sectionIndex, lessonIndex)}
          className="p-2 text-red-500 hover:text-red-700"
        >
          <FaTrash />
        </button>
      </div>
      
      {/* Lesson Type */}
      <div className="space-y-2">
        <label className="block text-gray-700">Lesson Type</label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'video')}
            className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <FaVideo className="mr-2" /> Video
          </button>
          <button
            type="button"
            onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'reading')}
            className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'reading' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <FaFileAlt className="mr-2" /> Reading/Instructions
          </button>
          <button
            type="button"
            onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'quiz')}
            className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <FaQuestionCircle className="mr-2" /> Quiz
          </button>
          <button
            type="button"
            onClick={() => handleLessonChange(sectionIndex, lessonIndex, 'type', 'resources')}
            className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'resources' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <FaBook className="mr-2" /> Additional Resources
          </button>
        </div>
      </div>
      
      {/* Lesson Title */}
      <div className="space-y-2">
        <label className="block text-gray-700">
          Lesson Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={lesson.title}
          onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'title', e.target.value)}
          className={`w-full p-2 border ${errors[`section${sectionIndex}lesson${lessonIndex}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
          placeholder="e.g., Introduction to Next.js"
        />
        {errors[`section${sectionIndex}lesson${lessonIndex}`] && 
          <p className="text-red-500 text-sm">{errors[`section${sectionIndex}lesson${lessonIndex}`]}</p>
        }
      </div>
      
      {/* Video specific fields */}
      {lesson.type === 'video' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-gray-700">
              Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lesson.videoUrl}
              onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'videoUrl', e.target.value)}
              className={`w-full p-2 border ${errors[`section${sectionIndex}lesson${lessonIndex}video`] ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
              placeholder="e.g., https://www.youtube.com/watch?v=..."
            />
            {errors[`section${sectionIndex}lesson${lessonIndex}video`] && 
              <p className="text-red-500 text-sm">{errors[`section${sectionIndex}lesson${lessonIndex}video`]}</p>
            }
          </div>
          
          <div className="space-y-2">
            <label className="block text-gray-700">About This Lesson</label>
            <textarea
              value={lesson.aboutLesson}
              onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'aboutLesson', e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Describe what this lesson covers"
            ></textarea>
          </div>
          
          {/* Resources toggle */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`has-resources-${sectionIndex}-${lessonIndex}`}
                checked={lesson.hasResources}
                onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'hasResources', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <label htmlFor={`has-resources-${sectionIndex}-${lessonIndex}`} className="ml-2 text-gray-700">
                This lesson has resources
              </label>
            </div>
          </div>
          
          {/* Resources section */}
          {lesson.hasResources && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <h6 className="font-medium">Resources</h6>
              
              {/* Downloadable resources */}
              <ResourcesInput
                sectionIndex={sectionIndex}
                lessonIndex={lessonIndex}
                resources={lesson.resources.downloadable}
                resourceType="downloadable"
                addResource={addResource}
                removeResource={removeResource}
                handleResourceChange={handleResourceChange}
                errors={errors[`section${sectionIndex}lesson${lessonIndex}downloadable`]}
              />
              
              {/* Internet resources */}
              <ResourcesInput
                sectionIndex={sectionIndex}
                lessonIndex={lessonIndex}
                resources={lesson.resources.internet}
                resourceType="internet"
                addResource={addResource}
                removeResource={removeResource}
                handleResourceChange={handleResourceChange}
                errors={errors[`section${sectionIndex}lesson${lessonIndex}internet`]}
              />
              
              {errors[`section${sectionIndex}lesson${lessonIndex}resources`] && 
                <p className="text-red-500 text-sm">{errors[`section${sectionIndex}lesson${lessonIndex}resources`]}</p>
              }
            </div>
          )}
        </div>
      )}
      
      {/* Reading specific fields */}
      {lesson.type === 'reading' && (
        <div className="space-y-2">
          <label className="block text-gray-700">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={lesson.aboutLesson}
            onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'aboutLesson', e.target.value)}
            rows={6}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Enter the instruction content (supports Markdown)"
          ></textarea>
        </div>
      )}
      
      {/* Quiz specific fields */}
      {lesson.type === 'quiz' && (
        <QuizQuestions
          sectionIndex={sectionIndex}
          lessonIndex={lessonIndex}
          questions={lesson.quizQuestions}
          addQuizQuestion={addQuizQuestion}
          removeQuizQuestion={removeQuizQuestion}
          handleQuizQuestionChange={handleQuizQuestionChange}
          errors={errors[`section${sectionIndex}lesson${lessonIndex}quiz`]}
        />
      )}
      
      {/* Additional Resources specific fields */}
      {lesson.type === 'resources' && (
        <div className="space-y-4">
          {/* Downloadable resources */}
          <ResourcesInput
            sectionIndex={sectionIndex}
            lessonIndex={lessonIndex}
            resources={lesson.resources.downloadable}
            resourceType="downloadable"
            addResource={addResource}
            removeResource={removeResource}
            handleResourceChange={handleResourceChange}
            errors={errors[`section${sectionIndex}lesson${lessonIndex}downloadable`]}
          />
          
          {/* Internet resources */}
          <ResourcesInput
            sectionIndex={sectionIndex}
            lessonIndex={lessonIndex}
            resources={lesson.resources.internet}
            resourceType="internet"
            addResource={addResource}
            removeResource={removeResource}
            handleResourceChange={handleResourceChange}
            errors={errors[`section${sectionIndex}lesson${lessonIndex}internet`]}
          />
        </div>
      )}
    </div>
  );
};

export default LessonForm;