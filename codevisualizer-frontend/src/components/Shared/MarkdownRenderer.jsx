import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { FaCheck, FaLightbulb, FaBookOpen } from 'react-icons/fa';
import 'katex/dist/katex.min.css';

import {
    preSanitizeMarkdown,
    flattenReactChildren,
    looksLikeAsciiDiagram,
    shouldRenderAsInlineCode,
    shouldRenderAsPlainText,
    isLikelyProgramming
} from '../../utils/ReadingUtils';

const MarkdownRenderer = ({ content, className = '' }) => {
    const [copySuccessMap, setCopySuccessMap] = useState({});

    const handleCopyCode = async (code, blockId) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopySuccessMap(prev => ({ ...prev, [blockId]: true }));
            setTimeout(() => {
                setCopySuccessMap(prev => ({ ...prev, [blockId]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    if (!content) return null;

    return (
        <div className={`markdown-content prose prose-lg max-w-none ${className}`}>
            <style>{`
          @media (max-width: 640px) {
            .markdown-content ul,
            .markdown-content ol {
              padding-left: 1rem !important;
              margin-left: 0 !important;
            }
            .markdown-content li {
              margin-left: 0 !important;
              padding-left: 0 !important;
            }
            .markdown-content blockquote {
              margin-left: 0 !important;
              padding-left: 1rem !important;
            }
            .markdown-content pre {
              margin-left: 0 !important;
            }
          }
        `}</style>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-100 text-indigo-900">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-6 flex items-center">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full mr-2"></div>
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-gray-700 mb-2 mt-4 flex items-center">
                            <span className="text-indigo-500 mr-2">●</span>
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => {
                        // Check if children contains code blocks or SyntaxHighlighter components
                        const hasCodeBlock = React.Children.toArray(children).some(child => {
                            if (React.isValidElement(child)) {
                                return child.type === 'pre' ||
                                    (child.props && child.props.className && child.props.className.includes('language-')) ||
                                    (child.type && child.type.displayName === 'SyntaxHighlighter');
                            }
                            return false;
                        });

                        if (hasCodeBlock) {
                            return <div className="text-gray-700 leading-relaxed mb-4 text-base">{children}</div>;
                        }

                        return <p className="text-gray-700 leading-relaxed mb-4 text-base">{children}</p>;
                    },
                    ul: ({ children }) => <ul className="space-y-2 mb-4 ml-4 list-none">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-2 mb-4 ml-4 list-decimal marker:text-indigo-500 marker:font-semibold">{children}</ol>,
                    li: ({ children }) => (
                        <li className="flex items-start text-gray-700">
                            {/* Hacky check to see if parent is UL or OL isn't easy in ReactMarkdown without inspecting props key/index behavior more deeply, 
                   so we'll just style based on class if possible or assume UL default list style */}
                            {/* Actually simpler: Text styling handles list items, but let's add a custom bullet if we want specific look */}
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2.5 mr-2 flex-shrink-0 opacity-80 select-none"></div>
                            <span className="leading-relaxed">{children}</span>
                        </li>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-300 bg-indigo-50 pl-4 py-3 my-4 rounded-r-lg text-indigo-900 italic">
                            {children}
                        </blockquote>
                    ),
                    pre: ({ children }) => <div className="my-4">{children}</div>,
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const lang = match ? match[1] : "";

                        // Helper to strip extra quotes/backticks that AI might add
                        const cleanContent = (text) => {
                            if (typeof text !== 'string') return text;
                            // Trim whitespace first, then remove surrounding backticks/quotes
                            return text.trim().replace(/^['`]+|['`]+$/g, '');
                        };

                        // Inline code
                        if (inline) {
                            const cleanedChildren = Array.isArray(children)
                                ? children.map(c => (typeof c === 'string' ? cleanContent(c) : c))
                                : cleanContent(children);

                            return (
                                <span
                                    style={{
                                        fontWeight: '600',
                                        color: '#0f172a', // slate-900
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        fontFamily: 'inherit' // Ensure it doesn't look like code
                                    }}
                                >
                                    {cleanedChildren}
                                </span>
                            );
                        }

                        const codeString = flattenReactChildren(children).replace(/\n$/, "");

                        // Fallback for single line code that looks like text
                        if (shouldRenderAsInlineCode(codeString, lang)) {
                            return (
                                <span
                                    style={{
                                        fontWeight: '600',
                                        color: '#0f172a', // slate-900
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {cleanContent(codeString)}
                                </span>
                            );
                        }

                        const blockId = `code-${Math.random().toString(36).substr(2, 9)}`;

                        if (looksLikeAsciiDiagram(codeString)) {
                            return (
                                <pre className="my-4 p-4 rounded-lg bg-gray-50 border border-gray-200 overflow-auto text-sm leading-6 whitespace-pre font-mono text-gray-800">
                                    {codeString}
                                </pre>
                            );
                        }

                        return (
                            <div className="relative my-4 w-full max-w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{lang || "code"}</span>
                                    <button
                                        className="text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                        onClick={() => handleCopyCode(codeString, blockId)}
                                    >
                                        {copySuccessMap[blockId] ? (
                                            <>
                                                <FaCheck className="text-green-500" /> Copied!
                                            </>
                                        ) : (
                                            'Copy code'
                                        )}
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    language={lang || 'text'}
                                    style={{
                                        'code[class*="language-"]': {
                                            color: '#24292e',
                                            background: 'none',
                                            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                                            fontSize: '0.9rem',
                                            lineHeight: '1.5',
                                            direction: 'ltr',
                                            textAlign: 'left',
                                            whiteSpace: 'pre',
                                            wordSpacing: 'normal',
                                            wordBreak: 'normal',
                                            tabSize: 4,
                                            hyphens: 'none'
                                        },
                                        'pre[class*="language-"]': {
                                            color: '#24292e',
                                            background: '#ffffff', // White background for clean look
                                            padding: '1rem',
                                            margin: 0,
                                            overflow: 'auto',
                                        },
                                        // Prism Default minimal overrides
                                        comment: { color: '#6a737d', fontStyle: 'italic' },
                                        keyword: { color: '#d73a49' },
                                        string: { color: '#032f62' },
                                        function: { color: '#6f42c1' },
                                        number: { color: '#005cc5' },
                                        operator: { color: '#d73a49' },
                                        class: { color: '#6f42c1' },
                                        variable: { color: '#e36209' },
                                    }}
                                    customStyle={{
                                        margin: 0,
                                        padding: '1rem',
                                        background: '#ffffff',
                                        fontSize: '0.875rem',
                                    }}
                                    showLineNumbers={true}
                                    lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#c4c4c4', textAlign: 'right' }}
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            </div>
                        );
                    }
                }}
            >
                {preSanitizeMarkdown(content)}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
