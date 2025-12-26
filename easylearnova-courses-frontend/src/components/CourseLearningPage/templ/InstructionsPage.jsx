import React from 'react';
import { FaInfo, FaCheck, FaLaptopCode, FaDownload, FaTasks } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
// Import our new enterprise-grade processor - no more regex preprocessing!
import { processMarkdownSync } from '../../../utils/markdownProcessor';

const InstructionsPage = ({ lessonContent, isLoading }) => {
  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-8"></div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If lesson content is provided, render it using our new unified processor
  if (lessonContent && lessonContent.aboutLesson) {
    // Process markdown with the new AST-based pipeline
    const processedContent = processMarkdownSync(lessonContent.aboutLesson, {
      convertDelimiters: true, // Handle \(...\) and \[...\] 
      autoLatex: true // Auto-wrap bare LaTeX environments
    });
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div 
          className="prose prose-lg max-w-none markdown-body"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </div>
    );
  }

  // Empty state - No content available
  return (
    <div className="p-12 max-w-4xl mx-auto text-center">
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-100 p-4 rounded-full">
          <FaLaptopCode className="w-12 h-12 text-gray-400" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">No Content Available</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        This lesson doesn't have any written instructions or reading material yet.
      </p>
    </div>
  );
};

export default InstructionsPage;