// CourseOverview.js
import React from 'react';

const CourseOverview = ({ course }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">About This Course</h2>
      <p className="text-gray-700 leading-relaxed">{course.description}</p>
      
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="text-xl font-bold mb-4">What you'll learn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <LearningPoint text="Build production-ready Next.js applications" />
          <LearningPoint text="Master React and server-side rendering" />
          <LearningPoint text="Implement advanced routing patterns" />
          <LearningPoint text="Deploy applications to production" />
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Instructor</h3>
        <InstructorCard instructor={course.instructor} />
      </div>
    </div>
  );
};

export default CourseOverview;