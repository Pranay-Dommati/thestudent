import React, { useRef, useEffect } from 'react';
// You'll need to install these packages:
// npm install react-quill quill

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder, className }) => {
  const quillRef = useRef(null);

  // Configure Quill modules - toolbar and paste handling
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      // This is the key setting that enables proper formatting preservation when pasting
      matchVisual: false
    }
  };

  // Configure Quill formats - what styles/formats are allowed
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link', 'image'
  ];

  // Enhanced paste handling
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      quill.root.addEventListener('paste', function(e) {
        // If we have HTML content in the clipboard, let Quill's internal handlers manage it
        // This will preserve formatting when pasting from external sources
        if (e.clipboardData && e.clipboardData.types.includes('text/html')) {
          // We don't need to do anything special, Quill will handle it with matchVisual: false setting
          // This allows Quill to preserve the HTML formatting
        }
      });
    }
  }, [quillRef]);

  return (
    <div className={`rich-text-editor-container ${className || ''}`}>
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Write something or paste formatted content..."}
        theme="snow"
      />
    </div>
  );
};

export default RichTextEditor;