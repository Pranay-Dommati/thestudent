import React from 'react';
import { FaPlus } from 'react-icons/fa';
import LessonForm from './LessonForm';

const CourseStructureStep = ({
  chapters,
  handleChapterNameChange,
  addLesson,
  removeLesson,
  handleLessonChange,
  addResource,
  removeResource,
  handleResourceChange,
  handleFileChange,
  addQuizQuestion,
  removeQuizQuestion,
  handleQuizQuestionChange,
  errors
}) => {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Course Structure</h2>
      
      {chapters.map((chapter, chapterIndex) => (
        <div key={`chapter-${chapterIndex}`} className="border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Chapter {chapterIndex + 1}</h3>
          </div>
          
          {/* Chapter Name */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">
              Chapter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={chapter.name}
              onChange={(e) => handleChapterNameChange(chapterIndex, e.target.value)}
              className={`w-full p-2 border ${errors[`chapter${chapterIndex}name`] ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
              placeholder="e.g., Introduction to Algebra"
            />
            {errors[`chapter${chapterIndex}name`] && 
              <p className="text-red-500 text-sm">{errors[`chapter${chapterIndex}name`]}</p>
            }
          </div>
          
          {/* Lessons */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Lessons</h4>
              <button
                type="button"
                onClick={() => addLesson(chapterIndex)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
              >
                <FaPlus className="mr-1" /> Add Lesson
              </button>
            </div>
            
            {chapter.lessons.map((lesson, lessonIndex) => (
              <LessonForm
                key={`lesson-${chapterIndex}-${lessonIndex}`}
                chapterIndex={chapterIndex}
                lessonIndex={lessonIndex}
                lesson={lesson}
                removeLesson={removeLesson}
                handleLessonChange={handleLessonChange}
                addResource={addResource}
                removeResource={removeResource}
                handleResourceChange={handleResourceChange}
                handleFileChange={handleFileChange}
                addQuizQuestion={addQuizQuestion}
                removeQuizQuestion={removeQuizQuestion}
                handleQuizQuestionChange={handleQuizQuestionChange}
                errors={errors}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseStructureStep;