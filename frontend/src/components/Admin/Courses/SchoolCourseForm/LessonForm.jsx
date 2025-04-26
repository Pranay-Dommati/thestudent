import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { FaPlus, FaTrash } from 'react-icons/fa';
import ResourcesInput from './ResourcesInput';
import QuizQuestions from './QuizQuestions';

const LessonForm = ({
  chapterIndex,
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
          onClick={() => removeLesson(chapterIndex, lessonIndex)}
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
            onClick={() => handleLessonChange(chapterIndex, lessonIndex, 'type', 'video')}
            className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <FaVideo className="mr-2" /> Video
          </button>
          <button
            type="button"
            onClick={() => handleLessonChange(chapterIndex, lessonIndex, 'type', 'reading')}
            className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'reading' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <FaFileAlt className="mr-2" /> Reading/Instructions
          </button>
          <button
            type="button"
            onClick={() => handleLessonChange(chapterIndex, lessonIndex, 'type', 'quiz')}
            className={`px-3 py-2 rounded-md flex items-center ${lesson.type === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <FaQuestionCircle className="mr-2" /> Quiz
          </button>
          <button
            type="button"
            onClick={() => handleLessonChange(chapterIndex, lessonIndex, 'type', 'resources')}
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
          onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'title', e.target.value)}
          className={`w-full p-2 border ${errors[`chapter${chapterIndex}lesson${lessonIndex}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
          placeholder="e.g., Understanding Linear Equations"
        />
        {errors[`chapter${chapterIndex}lesson${lessonIndex}`] && 
          <p className="text-red-500 text-sm">{errors[`chapter${chapterIndex}lesson${lessonIndex}`]}</p>
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
              onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'videoUrl', e.target.value)}
              className={`w-full p-2 border ${errors[`chapter${chapterIndex}lesson${lessonIndex}video`] ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
              placeholder="e.g., https://www.youtube.com/watch?v=..."
            />
            {errors[`chapter${chapterIndex}lesson${lessonIndex}video`] && 
              <p className="text-red-500 text-sm">{errors[`chapter${chapterIndex}lesson${lessonIndex}video`]}</p>
            }
          </div>
          
          <div className="space-y-2">
            <label className="block text-gray-700">
              About This Lesson <span className="text-xs text-gray-500">(Supports Markdown)</span>
            </label>
            <MDEditor
              value={lesson.aboutLesson}
              onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'aboutLesson', e)}
              height={200}
            />
            <div className="text-xs text-gray-500 italic">
              Tip: Use markdown syntax for formatting - **bold**, *italic*, ## headings, - list items, [links](url), etc.
            </div>
          </div>
          
          {/* Resources toggle */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`has-resources-${chapterIndex}-${lessonIndex}`}
                checked={lesson.hasResources}
                onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'hasResources', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <label htmlFor={`has-resources-${chapterIndex}-${lessonIndex}`} className="ml-2 text-gray-700">
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
                chapterIndex={chapterIndex}
                lessonIndex={lessonIndex}
                resources={lesson.resources.downloadable}
                resourceType="downloadable"
                addResource={addResource}
                removeResource={removeResource}
                handleResourceChange={handleResourceChange}
                errors={errors[`chapter${chapterIndex}lesson${lessonIndex}downloadable`]}
              />
              
              {/* Internet resources */}
              <ResourcesInput
                chapterIndex={chapterIndex}
                lessonIndex={lessonIndex}
                resources={lesson.resources.internet}
                resourceType="internet"
                addResource={addResource}
                removeResource={removeResource}
                handleResourceChange={handleResourceChange}
                errors={errors[`chapter${chapterIndex}lesson${lessonIndex}internet`]}
              />
              
              {errors[`chapter${chapterIndex}lesson${lessonIndex}resources`] && 
                <p className="text-red-500 text-sm">{errors[`chapter${chapterIndex}lesson${lessonIndex}resources`]}</p>
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
          <MDEditor
            value={lesson.aboutLesson}
            onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'aboutLesson', e)}
            height={300}
            preview="edit"
            hideToolbar={false}
            enableScroll={true}
            textareaProps={{
              placeholder: "Paste your formatted content here or start typing...",
              onPaste: (e) => {
                // Try to get rich text content
                const richText = e.clipboardData.getData('text/html');
                
                if (richText) {
                  e.preventDefault();
                  // Convert HTML to Markdown while preserving structure
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = richText;
                  
                  // Process headings
                  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
                  headings.forEach(h => {
                    const level = h.tagName[1];
                    const text = h.textContent.trim();
                    h.textContent = '\n' + '#'.repeat(parseInt(level)) + ' ' + text + '\n';
                  });
                  
                  // Process lists
                  const lists = tempDiv.querySelectorAll('ul, ol');
                  lists.forEach(list => {
                    const isOrdered = list.tagName.toLowerCase() === 'ol';
                    const items = list.querySelectorAll('li');
                    items.forEach((item, index) => {
                      const text = item.textContent.trim();
                      item.textContent = '\n' + (isOrdered ? `${index + 1}. ` : '- ') + text;
                    });
                  });
                  
                  // Process bold text
                  const boldElements = tempDiv.querySelectorAll('b, strong');
                  boldElements.forEach(el => {
                    const text = el.textContent.trim();
                    el.textContent = '**' + text + '**';
                  });
                  
                  // Process italic text
                  const italicElements = tempDiv.querySelectorAll('i, em');
                  italicElements.forEach(el => {
                    const text = el.textContent.trim();
                    el.textContent = '*' + text + '*';
                  });
                  
                  // Process links
                  const links = tempDiv.querySelectorAll('a');
                  links.forEach(link => {
                    const text = link.textContent.trim();
                    const href = link.getAttribute('href');
                    if (href) {
                      link.textContent = `[${text}](${href})`;
                    }
                  });
                  
                  // Process paragraphs and add line breaks
                  const paragraphs = tempDiv.querySelectorAll('p');
                  paragraphs.forEach(p => {
                    const text = p.textContent.trim();
                    if (text && !text.startsWith('#') && !text.startsWith('-') && !text.startsWith('1.')) {
                      p.textContent = text + '\n\n';
                    }
                  });
                  
                  // Get the processed text
                  let markdown = '';
                  // If we're dealing with complex Word formatting, traverse nodes carefully
                  function extractText(node) {
                    if (node.nodeType === 3) { // Text node
                      return node.textContent;
                    }
                    
                    let result = '';
                    // Check if this is a formatting node we've already processed
                    if (node.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'B', 'STRONG', 'I', 'EM', 'A', 'LI'].includes(node.tagName.toUpperCase())) {
                      return node.textContent;
                    }
                    
                    // For other node types, concatenate children
                    for (const child of node.childNodes) {
                      result += extractText(child);
                    }
                    return result;
                  }
                  
                  markdown = extractText(tempDiv);
                  
                  // Clean up excessive newlines
                  markdown = markdown.replace(/\n{3,}/g, '\n\n');
                  
                  // Insert at cursor position
                  const textarea = e.target;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = textarea.value;
                  const newText = text.substring(0, start) + markdown + text.substring(end);
                  handleLessonChange(chapterIndex, lessonIndex, 'aboutLesson', newText);
                }
              }
            }}
          />
          <div className="flex items-center bg-blue-50 text-blue-800 p-3 rounded-lg mt-2">
            <div className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <p className="font-medium">Paste formatting supported</p>
              <p>You can paste formatted text from Word, Google Docs, or other rich text editors to preserve headings, lists, bold, and italic formatting.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Quiz specific fields */}
      {lesson.type === 'quiz' && (
        <QuizQuestions
          chapterIndex={chapterIndex}
          lessonIndex={lessonIndex}
          questions={lesson.quizQuestions}
          addQuizQuestion={addQuizQuestion}
          removeQuizQuestion={removeQuizQuestion}
          handleQuizQuestionChange={handleQuizQuestionChange}
          errors={errors[`chapter${chapterIndex}lesson${lessonIndex}quiz`]}
        />
      )}
      
      {/* Additional Resources specific fields */}
      {lesson.type === 'resources' && (
        <div className="space-y-4">
          {/* Downloadable resources */}
          <ResourcesInput
            chapterIndex={chapterIndex}
            lessonIndex={lessonIndex}
            resources={lesson.resources.downloadable}
            resourceType="downloadable"
            addResource={addResource}
            removeResource={removeResource}
            handleResourceChange={handleResourceChange}
            errors={errors[`chapter${chapterIndex}lesson${lessonIndex}downloadable`]}
          />
          
          {/* Internet resources */}
          <ResourcesInput
            chapterIndex={chapterIndex}
            lessonIndex={lessonIndex}
            resources={lesson.resources.internet}
            resourceType="internet"
            addResource={addResource}
            removeResource={removeResource}
            handleResourceChange={handleResourceChange}
            errors={errors[`chapter${chapterIndex}lesson${lessonIndex}internet`]}
          />
        </div>
      )}
    </div>
  );
};

export default LessonForm;