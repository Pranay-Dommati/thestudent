/**
 * StructuredBlockRenderer.jsx
 * 
 * Enterprise-grade deterministic renderer for structured content blocks.
 * 
 * Eliminates all ambiguity between code and math:
 * - Code blocks are ALWAYS rendered as code (never KaTeX)
 * - Math blocks are ONLY rendered when explicitly typed as "math"
 * - Text blocks are plain text with light formatting
 * 
 * Block Types:
 * - heading: Section headers
 * - text: Plain explanatory text
 * - code: Variables, conditions, operators, code snippets
 * - list: Bullet point lists
 * - math: Mathematical expressions (KaTeX)
 */

import React, { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import katex from 'katex';

/**
 * CodeChip - Inline code display without any math processing
 */
const CodeChip = ({ code, className = '' }) => {
    return (
        <code
            className={`inline-block px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-sm border border-slate-200 ${className}`}
        >
            {code}
        </code>
    );
};

/**
 * CodeBlock - Multi-line code display
 */
const CodeBlock = ({ code, language = 'python' }) => {
    return (
        <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto my-2">
            <code className="text-sm font-mono text-slate-800 whitespace-pre-wrap">
                {code}
            </code>
        </pre>
    );
};

/**
 * Main StructuredBlockRenderer
 */
const StructuredBlockRenderer = ({ blocks, fallbackContent = null }) => {
    // If no blocks provided, fall back to legacy content
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
        if (fallbackContent) {
            // Render legacy markdown content
            return (
                <div className="text-slate-700 text-sm leading-relaxed">
                    {fallbackContent}
                </div>
            );
        }
        return null;
    }

    return (
        <div className="space-y-4">
            {blocks.map((block, index) => {
                const { type, content, items } = block;
                const key = `block-${index}`;

                switch (type) {
                    case 'heading':
                        return (
                            <h4 key={key} className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                                {content}
                            </h4>
                        );

                    case 'text':
                        return (
                            <div key={key} className="text-slate-700 text-sm leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        code: ({ node, inline, className, children, ...props }) => {
                                            return <CodeChip code={children} />;
                                        },
                                        p: Fragment // Don't wrap in <p> since wrapper is div
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        );

                    case 'code':
                        // Check if it's multiline or long
                        const isMultiline = content && (content.includes('\n') || content.length > 60);
                        if (isMultiline) {
                            return <CodeBlock key={key} code={content} />;
                        }
                        return (
                            <span key={key} className="inline">
                                <CodeChip code={content} />
                            </span>
                        );

                    case 'list':
                        if (!items || !Array.isArray(items)) return null;
                        return (
                            <ul key={key} className="list-none space-y-1 ml-2">
                                {items.map((item, i) => (
                                    <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                                        <span className="text-indigo-500 mt-0.5">•</span>
                                        <div className="flex-1">
                                            <ReactMarkdown
                                                components={{
                                                    p: Fragment,
                                                    code: ({ node, inline, className, children, ...props }) => {
                                                        return <CodeChip code={children} />;
                                                    }
                                                }}
                                            >
                                                {item}
                                            </ReactMarkdown>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        );

                    case 'math':
                        // Heuristic: If it looks like text (no latex symbols, has spaces, long), render as text
                        // This prevents "SpaceComplexity:O(n)" squashed rendering
                        const isLikelyText = !content.includes('\\') && content.includes(' ') && content.length > 15 && !/[=^<>]/.test(content);

                        if (isLikelyText) {
                            return (
                                <div key={key} className="text-slate-700 text-sm leading-relaxed">
                                    <ReactMarkdown components={{ p: Fragment }}>{content}</ReactMarkdown>
                                </div>
                            );
                        }

                        // Only true math blocks go through KaTeX
                        try {
                            const isBlock = content && (content.includes('\\frac') || content.includes('\\sum') || content.length > 30);
                            const mathHtml = katex.renderToString(content, {
                                throwOnError: false,
                                displayMode: isBlock
                            });
                            if (isBlock) {
                                return (
                                    <div
                                        key={key}
                                        className="my-2 overflow-x-auto text-center"
                                        dangerouslySetInnerHTML={{ __html: mathHtml }}
                                    />
                                );
                            }
                            return (
                                <span
                                    key={key}
                                    className="inline font-serif text-slate-800"
                                    dangerouslySetInnerHTML={{ __html: mathHtml }}
                                />
                            );
                        } catch (e) {
                            // Fallback if KaTeX fails
                            return (
                                <code key={key} className="text-sm text-slate-600">
                                    {content}
                                </code>
                            );
                        }

                    default:
                        // Unknown block type or fallback - render as text using ReactMarkdown
                        return (
                            <div key={key} className="text-slate-700 text-sm leading-relaxed">
                                <ReactMarkdown components={{ p: Fragment }}>{content || JSON.stringify(block)}</ReactMarkdown>
                            </div>
                        );
                }
            })}
        </div >
    );
};

export { CodeChip, CodeBlock };
export default StructuredBlockRenderer;
