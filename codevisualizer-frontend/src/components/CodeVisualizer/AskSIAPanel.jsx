import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * AskSIAPanel — Read-only explanation renderer panel
 * ===================================================
 * 
 * Phase 1: Displays "Why" explanations in read-only mode.
 * Future: Will support free chat with SIA.
 * 
 * Props:
 * - explanation: The Why explanation content
 * - lineNumber: Target line number
 * - lineText: Target line text
 * - isLoading: Loading state
 * - isReadOnly: Read-only mode (Phase 1: always true)
 * - onClose: Optional callback to close/hide the panel
 */
const AskSIAPanel = ({
    explanation,
    lineNumber,
    lineText,
    isLoading = false,
    isReadOnly = true,
    complexity = 'simple',
    onClose = null
}) => {

    /**
     * Preprocess the explanation to clean up the header
     */
    const preprocessExplanation = (text) => {
        if (!text) return '';

        // Robust cleanup: 
        // 1. Normalize newlines (standardize to \n)
        // 2. Remove quotes from inside inline code: `'var'` -> `var`
        // 3. Remove the header lines
        return text
            .replace(/\r\n?/g, '\n') // Normalize newlines
            .replace(/`'([^`]+)'`/g, '`$1`') // Strip single quotes inside backticks
            .replace(/`"([^`]+)"`/g, '`$1`') // Strip double quotes inside backticks
            .replace(/^💡\s*Why this step matters\s*\n*/i, '')
            .replace(/^Why this step matters\s*\n*/i, '')
            .trim();
    };

    /**
     * Custom components for ReactMarkdown styling
     */
    const markdownComponents = {
        // Headings
        h1: ({ children }) => (
            <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">{children}</h3>
        ),
        h2: ({ children }) => (
            <h4 className="text-base font-semibold text-indigo-700 mt-4 mb-2 flex items-start gap-2">
                <span className="text-indigo-400">▸</span>
                <span>{children}</span>
            </h4>
        ),
        h3: ({ children }) => (
            <h4 className="text-base font-semibold text-indigo-700 mt-3 mb-1 flex items-start gap-2">
                <span className="text-indigo-400">▸</span>
                <span>{children}</span>
            </h4>
        ),
        // Paragraphs
        p: ({ children }) => {
            // Check if this is a failure/success case
            const text = String(children);
            if (text.toLowerCase().includes('failure case:')) {
                return (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                        <span className="font-semibold text-red-700">⚠️ {children}</span>
                    </div>
                );
            }
            if (text.toLowerCase().includes('success case:')) {
                return (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
                        <span className="font-semibold text-green-700">✓ {children}</span>
                    </div>
                );
            }
            return <p className="text-slate-700 leading-relaxed mb-3">{children}</p>;
        },
        // Strong/Bold text
        strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
        ),
        // Inline code - light blue style to match theme
        code: ({ children, inline, className }) => {
            // Check if it's inline (no className means inline in ReactMarkdown)
            if (inline) {
                return (
                    <code className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-mono text-sm border border-indigo-100">
                        {children}
                    </code>
                );
            }
            // Code blocks - light blue theme to match panel
            return (
                <code className="font-mono text-sm text-indigo-900">{children}</code>
            );
        },
        // Pre elements - light blue background (prevents extra black box)
        pre: ({ children }) => (
            <pre className="bg-indigo-50 text-indigo-900 rounded-lg p-4 overflow-x-auto my-3 border border-indigo-100">
                {children}
            </pre>
        ),
        // Lists
        ul: ({ children }) => (
            <ul className="list-disc list-inside text-slate-700 mb-3 pl-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal list-inside text-slate-700 mb-3 pl-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
            <li className="text-slate-700">{children}</li>
        ),
    };

    // Generate cleaned explanation once to ensure consistency across all render paths
    const cleanedExplanation = preprocessExplanation(explanation);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800">Ask SIA</span>
                    {isReadOnly && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                            Read-only
                        </span>
                    )}
                </div>

                {lineNumber && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        Line {lineNumber}
                    </span>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        </div>
                        <p className="mt-4 text-slate-500 text-sm font-medium animate-pulse">
                            SIA is thinking...
                        </p>
                        {/* Show stripped line for context if needed */}
                        <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 max-w-full overflow-x-auto opacity-50">
                            <div className="h-4 bg-slate-200 rounded w-24"></div>
                        </div>
                    </div>
                )}

                {/* No Explanation State */}
                {!isLoading && !cleanedExplanation && (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                            Explore Why
                        </h3>
                        <p className="text-slate-500 text-sm max-w-xs">
                            Click the <span className="font-semibold text-indigo-600"><RotateCcw className="w-3 h-3 inline mr-1" />The Why</span> button on any step card to understand why that line of code exists.
                        </p>
                    </div>
                )}

                {/* Error State - Only if it starts with X and isn't a valid explanation */}
                {!isLoading && cleanedExplanation && cleanedExplanation.trim().startsWith('❌') && !cleanedExplanation.includes('Why this step matters') && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-red-700 text-sm">
                                <ReactMarkdown components={markdownComponents}>
                                    {cleanedExplanation}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* Explanation Content - Visual distinction for WHY section */}
                {!isLoading && cleanedExplanation && !(cleanedExplanation.trim().startsWith('❌') && !cleanedExplanation.includes('Why this step matters')) && (
                    <div className="bg-indigo-50/50 border border-indigo-100 border-l-4 border-l-indigo-400 rounded-lg p-4">
                        {/* Header */}
                        <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-indigo-200">
                            Why this step matters
                        </h3>
                        {/* Markdown Content */}
                        <div className="prose prose-slate prose-sm max-w-none">
                            <ReactMarkdown components={markdownComponents}>
                                {cleanedExplanation}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Read-only indicator for Phase 1 */}
            {isReadOnly && (
                <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Free chat with SIA coming soon...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AskSIAPanel;
