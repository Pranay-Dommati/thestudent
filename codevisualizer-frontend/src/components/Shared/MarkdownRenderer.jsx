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
    isLikelyProgramming,
    debugHash
} from '../../utils/ReadingUtils';

const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const lang = match ? match[1] : "";

    const handleCopyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    // Helper to strip extra quotes/backticks that AI might add
    const cleanContent = (text) => {
        if (typeof text !== 'string') return text;
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

    const blockId = `code-${debugHash(codeString)}`;

    if (looksLikeAsciiDiagram(codeString)) {
        return (
            <pre className="my-4 p-4 rounded-lg bg-gray-50 border border-gray-200 overflow-auto text-sm leading-6 whitespace-pre font-mono text-gray-800">
                {codeString}
            </pre>
        );
    }

    return (
        <div className="relative my-3 w-full max-w-full rounded-lg overflow-hidden bg-slate-100/50">
            <div className="flex items-center justify-between px-3 py-1.5 bg-transparent">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang || "code"}</span>
                <button
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${isCopied ? 'text-green-600 font-medium' : 'text-slate-400 hover:text-indigo-600'}`}
                    onClick={() => handleCopyCode(codeString)}
                >
                    {isCopied ? (
                        <>
                            <FaCheck className="text-green-500" /> Copied!
                        </>
                    ) : (
                        'Copy'
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={lang || 'text'}
                style={{
                    'code[class*="language-"]': {
                        color: '#334155', // slate-700
                        background: 'none',
                        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                        fontSize: '0.85rem',
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
                        color: '#334155',
                        background: 'transparent', // Transparent to blend
                        padding: '0 1rem 1rem 1rem', // No top padding, let header spacing handle it
                        margin: 0,
                        overflow: 'auto',
                    },
                    // Prism Default minimal overrides - softer colors
                    comment: { color: '#94a3b8', fontStyle: 'italic' },
                    keyword: { color: '#6366f1' }, // indigo-500
                    string: { color: '#0f766e' }, // teal-700
                    function: { color: '#7c3aed' }, // violet-600
                    number: { color: '#ea580c' }, // orange-600
                    operator: { color: '#64748b' },
                    class: { color: '#7c3aed' },
                    variable: { color: '#0f172a' },
                }}
                customStyle={{
                    margin: 0,
                    padding: '0 1rem 1rem 1rem', // Remove top padding
                    background: 'transparent',
                    fontSize: '0.875rem',
                }}
                showLineNumbers={false}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    );
};

const MarkdownRenderer = ({ content, className = '' }) => {
    // Local copy map removed - each CodeBlock handles its own state now

    if (!content) return null;

    return (
        <div className={`markdown-content prose prose-lg max-w-none ${className}`}>
            <style>{`
          .markdown-content {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
          }
          .markdown-content .katex-display {
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.5rem 0;
            margin: 0;
          }
          .markdown-content .katex {
            max-width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
          }
          .markdown-content p {
            overflow-wrap: break-word;
            word-wrap: break-word;
          }
          /* Custom scrollbar for KaTeX math formulas */
          .markdown-content .katex-display::-webkit-scrollbar,
          .markdown-content .katex::-webkit-scrollbar {
            height: 5px;
          }
          .markdown-content .katex-display::-webkit-scrollbar-track,
          .markdown-content .katex::-webkit-scrollbar-track {
            background: transparent;
          }
          .markdown-content .katex-display::-webkit-scrollbar-thumb,
          .markdown-content .katex::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .markdown-content .katex-display::-webkit-scrollbar-thumb:hover,
          .markdown-content .katex::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
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
                    ul: ({ children }) => <ul className="space-y-2 mb-4 ml-0 pl-0 list-none">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-2 mb-4 ml-0 pl-0 list-decimal marker:text-indigo-500 marker:font-semibold">{children}</ol>,
                    li: ({ children }) => (
                        <li className="flex items-start text-gray-700">
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
                    code: CodeBlock
                }}
            >
                {preSanitizeMarkdown(content)}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
