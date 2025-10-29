import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  FaBookOpen,
  FaBrain,
  FaBolt,
  FaLightbulb,
  FaCheck,
  FaVideo,
  FaYoutube
} from "react-icons/fa";
import {
  IoPlayCircle,
  IoCheckmarkCircle,
  IoEye,
  IoBookmark,
  IoShare
} from "react-icons/io5";
import { BiTime } from "react-icons/bi";
import {
  formatDuration,
  formatViewCount
} from '../services/index.js';
import { QuizRenderer } from '../utils/QuizUtils.jsx';
import { ResourcesRenderer } from '../utils/ResourcesUtils.jsx';
import { getResourceIconName } from '../utils/ResourcesUtils.jsx';
import {
  preSanitizeMarkdown,
  flattenReactChildren,
  looksLikeAsciiDiagram,
  shouldRenderAsInlineCode,
  shouldRenderAsPlainText
} from '../utils/ReadingUtils.js';

/**
 * TabContentRenderer - Renders all tab content for ProLearningPage
 * 
 * This component handles rendering for:
 * - Reading tab with ReactMarkdown and syntax highlighting
 * - Summary tab with ReactMarkdown
 * - Videos tab with video grid and modal
 * - Quiz tab using QuizRenderer
 * - Resources tab using ResourcesRenderer
 */
const TabContentRenderer = ({
  activeTab,
  content,
  currentTopicName,
  isTopicBlocked,
  LoadingComponent,
  selectedTopic,
  getCurrentTopicFromParam,
  topicParam,
  sanitizedReading,
  sanitizedReadingTopicName,
  contentTopicName,
  copySuccessMap,
  handleCopyCode,
  openVideoModal,
  quizSubmitted,
  setQuizSubmitted,
  setContent,
  loadScenario,
  getCurrentTopic,
  setActiveTab
}) => {
  switch (activeTab) {
    case "reading":
      // BLOCK CHECK: If topic is blocked, don't show empty content panels
      if (currentTopicName && isTopicBlocked(currentTopicName)) {
        return <LoadingComponent />;
      }
      
      // Additional fallback: if content exists but reading is empty, try to show other content
      const hasAnyContent = content && (content.reading || content.summary || content.videos?.length || content.quiz?.length || content.resources?.length);
      
      return (
        <div className="max-w-none pt-6">
          {/* Compact Reading Header */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                  <FaBookOpen className="text-sm" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Reading Material</h2>
                  <p className="text-sm text-gray-600">Comprehensive study content</p>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Content with better typography, all content together */}
          <div className="prose prose-lg max-w-none px-0 sm:px-4">
            <style>{`
              @media (max-width: 640px) {
                .prose ul,
                .prose ol {
                  padding-left: 1rem !important;
                  margin-left: 0 !important;
                }
                .prose li {
                  margin-left: 0 !important;
                  padding-left: 0 !important;
                }
                .prose blockquote {
                  margin-left: 0 !important;
                  padding-left: 1rem !important;
                }
                .prose pre {
                  margin-left: 0 !important;
                }
              }
            `}</style>
            {(() => {
              const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam) || '';
              // Prefer sanitized reading if it belongs to current topic
              const useSanitized = (sanitizedReadingTopicName === currentTopicName) && (typeof sanitizedReading === 'string') && sanitizedReading.trim().length > 0;
              // Else fallback to raw content reading if content belongs to current topic
              const useRaw = (!useSanitized) && (contentTopicName === currentTopicName) && (typeof content?.reading === 'string') && content.reading.trim().length > 0;
              const displayReading = useSanitized ? sanitizedReading : (useRaw ? content.reading : '');
              if (!displayReading || displayReading.trim().length === 0) {
                return (
                  <div className="text-gray-500">Content not available</div>
                );
              }
              return (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h1: ({children}) => (
                    <h1 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6 flex items-center">
                      <FaLightbulb className="text-yellow-500 mr-2" />
                      {children}
                    </h3>
                  ),
                  p: ({children}) => {
                    // Check if children contains code blocks or SyntaxHighlighter components
                    const hasCodeBlock = React.Children.toArray(children).some(child => {
                      if (React.isValidElement(child)) {
                        // Check for pre elements, code elements with language classes, or SyntaxHighlighter
                        return child.type === 'pre' || 
                               (child.props && child.props.className && child.props.className.includes('language-')) ||
                               (child.type && child.type.displayName === 'SyntaxHighlighter');
                      }
                      return false;
                    });
                    
                    // Use div for paragraphs containing code blocks to avoid nesting issues
                    if (hasCodeBlock) {
                      return (
                        <div className="text-gray-700 leading-relaxed mb-4 text-base">
                          {children}
                        </div>
                      );
                    }
                    
                    return (
                      <p className="text-gray-700 leading-relaxed mb-4 text-base">
                        {children}
                      </p>
                    );
                  },
                  pre: ({children}) => {
                    // Ensure pre elements are not wrapped in paragraphs
                    return (
                      <div className="my-4">
                        {children}
                      </div>
                    );
                  },
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || "");
                    const lang = match ? match[1] : "";
                    if (inline) {
                      return (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono border" {...props}>{children}</code>
                      );
                    }
                    // Flatten children to a clean text string to avoid [object Object]
                    const codeString = flattenReactChildren(children).replace(/\n$/, "");
                    
                    // If it's a single short token that doesn't look like programming, render as inline code (not a block)
                    if (shouldRenderAsInlineCode(codeString, lang)) {
                      return (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono border inline-block" {...props}>{codeString}</code>
                      );
                    }
                    
                    // If current topic is math-related and this doesn't look like programming, render as plain text block
                    const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam) || '';
                    if (shouldRenderAsPlainText(currentTopicName, codeString)) {
                      return (
                        <pre className="my-4 p-4 rounded-lg bg-gray-50 border border-gray-200 overflow-auto text-base leading-7 whitespace-pre text-gray-800">
                          {codeString}
                        </pre>
                      );
                    }
                    
                    // Detect ASCII diagram blocks (triangles, boxes, etc.) and render as plain <pre>
                    if (looksLikeAsciiDiagram(codeString)) {
                      return (
                        <pre className="my-4 p-4 rounded-lg bg-gray-50 border border-gray-200 overflow-auto text-sm leading-6 whitespace-pre font-mono text-gray-800">
                          {codeString}
                        </pre>
                      );
                    }
                    
                    const blockId = codeString;
                    return (
                      <div className="relative my-6 w-full max-w-full">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-xl w-full">
                          <span className="text-xs text-gray-500 font-mono">{lang || "code"}</span>
                          <button
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-100 bg-white ml-2 flex items-center gap-1 cursor-pointer"
                            onClick={() => handleCopyCode(codeString, blockId)}
                            type="button"
                          >
                            {copySuccessMap[blockId] ? (
                              <>
                                <FaCheck className="inline-block text-green-600" /> Copied!
                              </>
                            ) : (
                              <>Copy</>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={{
                            'code[class*="language-"]': {
                              color: '#f8f8f2',
                              background: 'none',
                              fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                              fontSize: '1rem',
                              lineHeight: '1.5',
                              whiteSpace: 'pre',
                              wordSpacing: 'normal',
                              wordBreak: 'normal',
                              wordWrap: 'normal',
                              tabSize: 4,
                              hyphens: 'none'
                            },
                            'pre[class*="language-"]': {
                              color: '#f8f8f2',
                              background: '#23272f',
                              overflow: 'auto'
                            },
                            comment: { color: '#6272a4', fontStyle: 'italic' },
                            prolog: { color: '#6272a4' },
                            doctype: { color: '#6272a4' },
                            cdata: { color: '#6272a4' },
                            punctuation: { color: '#f8f8f2' },
                            property: { color: '#50fa7b' },
                            tag: { color: '#ff79c6' },
                            constant: { color: '#bd93f9' },
                            symbol: { color: '#bd93f9' },
                            deleted: { color: '#ff5555' },
                            boolean: { color: '#bd93f9' },
                            number: { color: '#bd93f9' },
                            selector: { color: '#50fa7b' },
                            'attr-name': { color: '#50fa7b' },
                            string: { color: '#f1fa8c' },
                            char: { color: '#f1fa8c' },
                            builtin: { color: '#8be9fd' },
                            inserted: { color: '#50fa7b' },
                            operator: { color: '#ff79c6' },
                            entity: { color: '#f8f8f2', cursor: 'help' },
                            url: { color: '#f8f8f2' },
                            variable: { color: '#f8f8f2' },
                            atrule: { color: '#8be9fd' },
                            'attr-value': { color: '#f1fa8c' },
                            function: { color: '#50fa7b' },
                            'class-name': { color: '#8be9fd' },
                            keyword: { color: '#ff79c6' },
                            regex: { color: '#f1fa8c' },
                            important: { color: '#ff5555', fontWeight: 'bold' }
                          }}
                          language={lang}
                          customStyle={{
                            borderRadius: "0 0 0.75rem 0.75rem",
                            fontSize: "1rem",
                            margin: 0,
                            padding: "1rem",
                            background: "#23272f",
                            border: "1px solid #222c37",
                            color: "#f8f8f2",
                            lineHeight: "1.4",
                            display: 'block',
                            width: '100%'
                          }}
                          codeTagProps={{
                            style: { 
                              fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                              color: '#f8f8f2'
                            },
                            className: 'custom-syntax-highlight'
                          }}
                          showLineNumbers={false}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                  ul: ({children}) => <ul className="space-y-2 mb-6 ml-6">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex items-start text-gray-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <span>{children}</span>
                    </li>
                  ),
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-6 py-4 my-6 rounded-r-lg">
                      <div className="flex items-start">
                        <FaLightbulb className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                        <div className="text-blue-800 italic">{children}</div>
                      </div>
                    </blockquote>
                  )
                }}
              >
                {displayReading}
              </ReactMarkdown>
              );
            })()}
          </div>
        </div>
      );

    case "summary":
      // BLOCK CHECK: If topic is blocked, don't show empty content panels
      if (currentTopicName && isTopicBlocked(currentTopicName)) {
        return <LoadingComponent />;
      }
      
      return (
        <div className="max-w-none pt-6">
          {/* Compact Summary Header */}
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                  <FaBrain className="text-sm" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Quick Summary</h2>
                  <p className="text-sm text-gray-600">Key points and concepts</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-3 text-xs">
                <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                  <span className="text-purple-600 font-medium">Quick Review</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaBolt className="text-yellow-500 mr-1" />
                  <span>5-min read</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Summary Content */}
          <div className="prose prose-lg max-w-none px-0 sm:px-4">
            <style>{`
              @media (max-width: 640px) {
                .prose ul,
                .prose ol {
                  padding-left: 1rem !important;
                  margin-left: 0 !important;
                }
                .prose li {
                  margin-left: 0 !important;
                  padding-left: 0 !important;
                }
                .prose blockquote {
                  margin-left: 0 !important;
                  padding-left: 1rem !important;
                }
                .prose pre {
                  margin-left: 0 !important;
                }
              }
            `}</style>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({children}) => (
                  <h1 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-purple-200 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {children}
                  </h1>
                ),
                h2: ({children}) => (
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></div>
                    {children}
                  </h2>
                ),
                h3: ({children}) => (
                  <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6">
                    {children}
                  </h3>
                ),
                p: ({children}) => {
                  // Check if children contains code blocks or SyntaxHighlighter components
                  const hasCodeBlock = React.Children.toArray(children).some(child => {
                    if (React.isValidElement(child)) {
                      // Check for pre elements, code elements with language classes, or SyntaxHighlighter
                      return child.type === 'pre' || 
                             (child.props && child.props.className && child.props.className.includes('language-')) ||
                             (child.type && child.type.displayName === 'SyntaxHighlighter');
                    }
                    return false;
                  });
                  
                  // Use div for paragraphs containing code blocks to avoid nesting issues
                  if (hasCodeBlock) {
                    return (
                      <div className="text-gray-700 leading-relaxed mb-4">
                        {children}
                      </div>
                    );
                  }
                  
                  return (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {children}
                    </p>
                  );
                },
                pre: ({children}) => {
                  // Ensure pre elements are not wrapped in paragraphs
                  return (
                    <div className="my-4">
                      {children}
                    </div>
                  );
                },
                ul: ({children}) => <ul className="space-y-3 mb-6 ml-6">{children}</ul>,
                li: ({children}) => (
                  <li className="flex items-start text-gray-700">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                    <span className="leading-relaxed">{children}</span>
                  </li>
                ),
                table: ({children}) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({children}) => (
                  <th className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100">
                    {children}
                  </td>
                ),
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const lang = match ? match[1] : "";
                  if (inline) {
                    return (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono border" {...props}>{children}</code>
                    );
                  }
                  const codeString = flattenReactChildren(children).replace(/\n$/, "");
                  
                  // Convert single short non-programming, language-less blocks to inline code
                  if (shouldRenderAsInlineCode(codeString, lang)) {
                    return (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono border inline-block" {...props}>{codeString}</code>
                    );
                  }
                  
                  // If current topic is math-related and this doesn't look like programming, render as plain text block
                  const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam) || '';
                  if (shouldRenderAsPlainText(currentTopicName, codeString)) {
                    return (
                      <pre className="my-4 p-4 rounded-lg bg-gray-50 border border-gray-200 overflow-auto text-base leading-7 whitespace-pre text-gray-800">
                        {codeString}
                      </pre>
                    );
                  }
                  
                  if (looksLikeAsciiDiagram(codeString)) {
                    return (
                      <pre className="my-4 p-4 rounded-lg bg-gray-50 border border-gray-200 overflow-auto text-sm leading-6 whitespace-pre font-mono text-gray-800">
                        {codeString}
                      </pre>
                    );
                  }
                  
                  // default: keep summary code blocks minimal
                  return (
                    <pre className="my-4 p-4 rounded-lg bg-gray-900 text-gray-100 overflow-auto text-sm leading-6 whitespace-pre font-mono">
                      <code>{codeString}</code>
                    </pre>
                  );
                }
              }}
            >
              {preSanitizeMarkdown(content.summary || '')}
            </ReactMarkdown>
          </div>
        </div>
      );

    case "videos":
      // BLOCK CHECK: If topic is blocked, don't show empty content panels
      if (currentTopicName && isTopicBlocked(currentTopicName)) {
        return <LoadingComponent />;
      }
      
      return (
        <div className="pt-6">
          {/* Compact Videos Header */}
          <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                  <FaVideo className="text-sm" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Video Learning</h2>
                  <p className="text-sm text-gray-600">
                    {content.videosMetadata?.source === 'youtube_api' ? 'Live YouTube Data' : 'Curated educational content'}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-3 text-xs">
                <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                  <span className="text-red-600 font-medium">{content.videos.length} videos</span>
                </div>
                {content.videosMetadata?.avgViewCount && (
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-gray-600">
                      Avg: {formatViewCount(content.videosMetadata.avgViewCount)}
                    </span>
                  </div>
                )}
                <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                  <span className="text-gray-600">HD Quality</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaYoutube className="text-red-500 mr-1" />
                  <span>
                    {content.videosMetadata?.source === 'youtube_api' ? 'Real YouTube Data' : 'YouTube Curated'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Video Stats Summary */}
            {content.videosMetadata?.source === 'youtube_api' && content.videos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {content.videos.reduce((sum, v) => sum + (v.viewCount || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {content.videos.reduce((sum, v) => sum + (v.subscriberCount || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Total Subscribers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {content.videosMetadata.totalDuration || 0} min
                    </div>
                    <div className="text-xs text-gray-600">Total Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {content.videos.filter(v => v.isEducationalChannel).length}
                    </div>
                    <div className="text-xs text-gray-600">Verified Channels</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Video Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {content.videos
              .sort((a, b) => {
                // Sort by view count in descending order (highest views first)
                const viewsA = a.viewCount || parseInt(a.formattedViewCount?.replace(/[^0-9]/g, '') || '0') || 0;
                const viewsB = b.viewCount || parseInt(b.formattedViewCount?.replace(/[^0-9]/g, '') || '0') || 0;
                return viewsB - viewsA;
              })
              .slice(0, 6) // Limit to maximum 6 videos
              .map((video, index) => (
              <div key={video.id} className="group bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                <div className="flex flex-col">
                  {/* Video Thumbnail */}
                  <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => openVideoModal(video)}>
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <IoPlayCircle className="text-red-500 text-2xl ml-1" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded-lg text-sm font-medium">
                      {video.formattedDuration || formatDuration(video.duration) || video.duration + ' min'}
                    </div>
                    {/* Quality badge */}
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                      HD
                    </div>
                  </div>
                  
                  {/* Video Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-red-600 transition-colors">
                        {video.title}
                      </h3>
                      <div className="ml-2 flex-shrink-0">
                        {video.difficulty && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            video.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                            video.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {video.difficulty}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <FaYoutube className="text-red-500 mr-2" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{video.channel}</span>
                        {video.formattedSubscriberCount && (
                          <span className="text-xs text-gray-500">{video.formattedSubscriberCount}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <IoEye className="mr-1" />
                          <span>{video.formattedViewCount || (video.viewCount ? formatViewCount(video.viewCount) : video.views + ' views')}</span>
                        </div>
                        <div className="flex items-center">
                          <BiTime className="mr-1" />
                          <span>{video.formattedDuration || formatDuration(video.duration) || video.duration + ' min'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center">
                      <button 
                        onClick={() => openVideoModal(video)}
                        className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                      >
                        <IoPlayCircle className="mr-1" />
                        Watch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Video learning tips */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <FaLightbulb className="text-yellow-500 mr-3 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">Video Learning Tips</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-start">
                <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Take notes while watching</span>
              </div>
              <div className="flex items-start">
                <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Practice along with examples</span>
              </div>
              <div className="flex items-start">
                <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Pause and replay difficult sections</span>
              </div>
              <div className="flex items-start">
                <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Apply concepts immediately</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "quiz":
      // BLOCK CHECK: If topic is blocked, don't show empty content panels
      if (currentTopicName && isTopicBlocked(currentTopicName)) {
        return <LoadingComponent />;
      }
      
      return (
        <QuizRenderer 
          content={content}
          quizSubmitted={quizSubmitted}
          setQuizSubmitted={setQuizSubmitted}
          setContent={setContent}
        />
      );

    case 'resources':
      return (
        <ResourcesRenderer 
          content={content}
          loadScenario={loadScenario}
          isDbCourse={(() => {
            try {
              const cid = typeof window !== 'undefined' ? (window.location.pathname.split('/')[2] || '') : '';
              return !!cid && !cid.startsWith('course_');
            } catch {
              return false;
            }
          })()}
          getCurrentTopic={getCurrentTopic}
          getResourceIcon={getResourceIconName}
          setActiveTab={setActiveTab}
          LoadingComponent={LoadingComponent}
        />
      );

    default:
      // BLOCK CHECK: If topic is blocked, don't show any content
      if (currentTopicName && isTopicBlocked(currentTopicName)) {
        return <LoadingComponent />;
      }
      return null;
  }
};

export default TabContentRenderer;
