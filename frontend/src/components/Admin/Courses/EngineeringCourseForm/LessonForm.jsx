import React from 'react';
import { FaTrash, FaVideo, FaFileAlt, FaQuestionCircle, FaBook } from 'react-icons/fa';
import ResourcesInput from './ResourcesInput';
import QuizQuestions from './QuizQuestions';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import preprocessLatex from '../../../../utils/latexPreprocessor';

const LessonForm = ({
  sectionIndex,
  lessonIndex,
  lesson,
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
            <label className="block text-gray-700">
              About This Lesson <span className="text-xs text-gray-500">(Supports Markdown)</span>            </label>            <MDEditor              value={lesson.aboutLesson}
              onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'aboutLesson', e)}              height={200}
              preview="edit"
              visibleDragbar={true}
              style={{ fontSize: '16px' }}
              previewOptions={{
                style: { padding: '20px', fontSize: '16px' }
              }}
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
                handleFileChange={handleFileChange}
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
        <div className="space-y-2" data-color-mode="dark">
          <label className="block text-gray-700">
            Content <span className="text-red-500">*</span>          </label>          <MDEditor            value={lesson.aboutLesson}
            onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'aboutLesson', e)}              height={300}            preview="edit"
            visibleDragbar={true}
            style={{ fontSize: '16px' }}
            previewOptions={{
              style: { padding: '20px', fontSize: '16px' }
            }}
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
                  
                  // Process tables
                  const tables = tempDiv.querySelectorAll('table');
                  tables.forEach(table => {
                    // Get table rows
                    const rows = table.querySelectorAll('tr');
                    let markdownTable = '\n';
                    
                    // Process each row
                    rows.forEach((row, rowIndex) => {
                      const cells = row.querySelectorAll('td, th');
                      const isHeader = rowIndex === 0; // First row is assumed to be header
                      
                      // Process each cell in the row
                      cells.forEach((cell, cellIndex) => {
                        const cellText = cell.textContent.trim() || ' ';
                        markdownTable += '| ' + cellText + ' ';
                        // Add last pipe at the end of the row
                        if (cellIndex === cells.length - 1) {
                          markdownTable += '|';
                        }
                      });
                      
                      markdownTable += '\n';
                      
                      // Add separator row after header
                      if (isHeader) {
                        cells.forEach(() => {
                          markdownTable += '| --- ';
                        });
                        markdownTable += '|\n';
                      }
                    });
                    
                    // Replace the table with its markdown representation
                    table.outerHTML = markdownTable + '\n';
                  });
                  
                  // Process lists
                  const lists = tempDiv.querySelectorAll('ul, ol');
                  lists.forEach(list => {
                    const isOrdered = list.tagName.toLowerCase() === 'ol';
                    
                    // Process nested lists properly
                    const processListItems = (items, level = 0) => {
                      items.forEach((item, index) => {
                        const text = item.textContent.trim();
                        const nestedLists = item.querySelectorAll(':scope > ul, :scope > ol');
                        
                        // Extract just this item's text without nested list text
                        let itemText = item.cloneNode(true);
                        nestedLists.forEach(nl => {
                          const parent = nl.parentNode;
                          if (parent && itemText.contains(parent)) {
                            parent.removeChild(nl);
                          }
                        });
                        itemText = itemText.textContent.trim();
                        
                        // Replace the content with properly formatted markdown
                        // Add indentation based on nesting level
                        const indent = '  '.repeat(level);
                        item.textContent = `\n${indent}${isOrdered ? `${index + 1}. ` : '- '}${itemText}`;
                        
                        // Process any nested lists inside this item
                        if (nestedLists.length > 0) {
                          nestedLists.forEach(nestedList => {
                            const nestedItems = nestedList.querySelectorAll(':scope > li');
                            const isNestedOrdered = nestedList.tagName.toLowerCase() === 'ol';
                            processListItems(nestedItems, level + 1);
                          });
                        }
                      });
                    };
                    
                    // Start processing from top-level list items
                    const items = list.querySelectorAll(':scope > li');
                    processListItems(items);
                  });

                  // Also handle direct list items that might not be in a proper list
                  const directListItems = Array.from(tempDiv.querySelectorAll('li')).filter(
                    li => !li.parentElement || (li.parentElement.tagName.toLowerCase() !== 'ul' && li.parentElement.tagName.toLowerCase() !== 'ol')
                  );
                  directListItems.forEach(item => {
                    const text = item.textContent.trim();
                    item.textContent = '\n- ' + text;
                  });
                  
                  // Handle div elements with list-like formatting (common in Word/Google Docs)
                  const divElements = tempDiv.querySelectorAll('div');
                  divElements.forEach(div => {
                    // Check if this div has bullet-like content (starts with •, -, *, etc.)
                    const text = div.textContent.trim();
                    if (text.match(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]/) && !div.querySelector('ul, ol, li')) {
                      // This div appears to be a bullet point item but isn't in a proper list
                      div.textContent = '\n- ' + text.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*/, '');
                    }
                  });
                  
                  // Handle spans that might be bullet points (common in some word processors)
                  const spanElements = tempDiv.querySelectorAll('span');
                  spanElements.forEach(span => {
                    const text = span.textContent.trim();
                    // If span contains only a bullet character, and next sibling has text
                    if (text.match(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]$/) && span.nextElementSibling) {
                      const nextText = span.nextElementSibling.textContent.trim();
                      if (nextText) {
                        span.textContent = '\n- ';
                        span.nextElementSibling.textContent = nextText;
                      }
                    }
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
                  handleLessonChange(sectionIndex, lessonIndex, 'aboutLesson', newText);
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

          {/* Live Preview with KaTeX rendering */}
          <div className="mt-4 border border-gray-200 rounded-md">
            <div className="px-3 py-2 text-sm bg-gray-50 border-b text-gray-700">Live Preview</div>
            <div className="p-4 prose prose-slate max-w-none">
              {lesson.aboutLesson ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {preprocessLatex(lesson.aboutLesson)}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500 text-sm">Start typing to see a preview. Math supported with $inline$ and $$block$$ syntax.</p>
              )}
            </div>
          </div>
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
            handleFileChange={handleFileChange}
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