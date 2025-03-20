import React, { useState } from 'react';
import CourseForm from './CourseForm';
import CourseList from './CourseList';

const CourseManagement = () => {
  const [view, setView] = useState('list'); // 'list' or 'add'
  
  return (
    <div className="p-6">
      {view === 'list' ? (
        <CourseList onAddNew={() => setView('add')} />
      ) : (
        <CourseForm 
          onCancel={() => setView('list')} 
          onSubmit={() => {
            // Handle form submission
            setView('list');
          }}
        />
      )}
    </div>
  );
};

export default CourseManagement;