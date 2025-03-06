import React, { useState, useEffect } from 'react';

const LessonNotes = ({ lessonId }) => {
  const [notes, setNotes] = useState('');
  
  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`course-notes-${lessonId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [lessonId]);
  
  // Save notes to localStorage when they change
  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    localStorage.setItem(`course-notes-${lessonId}`, newNotes);
  };
  
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Your Notes</h3>
      <p className="text-gray-600 mb-2">
        Take notes for this lesson. Your notes are saved automatically and are only visible to you.
      </p>
      <textarea
        className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Start typing your notes here..."
        value={notes}
        onChange={handleNotesChange}
      ></textarea>
    </div>
  );
};

export default LessonNotes;