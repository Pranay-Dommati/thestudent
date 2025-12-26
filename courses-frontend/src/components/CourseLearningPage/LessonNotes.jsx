import React, { useState, useEffect } from 'react';
import RichTextEditor from '../Common/RichTextEditor';

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
  const handleNotesChange = (content) => {
    // The rich text editor provides HTML content directly
    setNotes(content);
    localStorage.setItem(`course-notes-${lessonId}`, content);
  };
  
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Your Notes</h3>
      <p className="text-gray-600 mb-2">
        Take notes for this lesson. Your notes are saved automatically and are only visible to you.
      </p>
      <RichTextEditor
        value={notes}
        onChange={handleNotesChange}
        placeholder="Start typing your notes here or paste formatted content..."
        className="notes-editor"
      />
    </div>
  );
};

export default LessonNotes;