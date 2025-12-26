// CourseContent.js
import React from 'react';
import CourseLesson from './CourseLesson';
const CourseContent = ({ course }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Course Content</h2>
        <div className="text-sm text-gray-600">
          {course.chapters.reduce((acc, chapter) => acc + chapter.lessons.length, 0)} lessons • {course.duration}
        </div>
      </div>
      <div className="space-y-4">
        {course.chapters.map((chapter, index) => (
          <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="bg-gray-50 px-4 py-3 font-medium flex justify-between items-center cursor-pointer">
              <div className="flex items-center">
                <span className="bg-indigo-100 text-indigo-800 h-6 w-6 rounded-full flex items-center justify-center mr-3 font-bold text-sm">
                  {index + 1}
                </span>
                {chapter.title}
              </div>
              <span className="text-sm text-gray-500">
                {chapter.lessons.length} lessons
              </span>
            </div>
            <ul className="divide-y">
              {chapter.lessons.map((lesson, idx) => (
                <CourseLesson key={idx} lesson={lesson} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseContent;