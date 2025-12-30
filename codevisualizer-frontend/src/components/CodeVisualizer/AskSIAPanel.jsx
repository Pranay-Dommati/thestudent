import React from 'react';
import { Sparkles, Lightbulb, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';

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
     * Parse and render the explanation with proper formatting
     */
    const renderExplanation = (text) => {
        if (!text) return null;

        // Split by lines and process
        const lines = text.split('\n');
        const elements = [];
        let currentList = [];
        let inList = false;

        lines.forEach((line, idx) => {
            // Header line (💡 Why this step matters)
            if (line.includes('💡') || line.includes('Why this step matters')) {
                elements.push(
                    <div key={idx} className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-200">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                            Why this step matters
                        </h3>
                    </div>
                );
                return;
            }

            // Bold headers (**Condition 1: ...**)
            if (line.startsWith('**') && line.includes(':**')) {
                // Close any open list
                if (inList && currentList.length > 0) {
                    elements.push(
                        <ul key={`list-${idx}`} className="list-disc list-inside text-slate-600 mb-3 pl-2 space-y-1">
                            {currentList}
                        </ul>
                    );
                    currentList = [];
                    inList = false;
                }

                const headerText = line.replace(/\*\*/g, '').trim();
                elements.push(
                    <h4 key={idx} className="font-semibold text-indigo-700 mt-4 mb-1 flex items-start gap-2">
                        <span className="text-indigo-400">▸</span>
                        <span>{headerText}</span>
                    </h4>
                );
                return;
            }

            // Bullet points (- item)
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                inList = true;
                currentList.push(
                    <li key={`li-${idx}`} className="text-slate-700">
                        {line.trim().substring(2)}
                    </li>
                );
                return;
            }

            // Failure/Success case headers
            if (line.toLowerCase().includes('failure case:') || line.toLowerCase().includes('success case:')) {
                // Close any open list
                if (inList && currentList.length > 0) {
                    elements.push(
                        <ul key={`list-${idx}`} className="list-disc list-inside text-slate-600 mb-3 pl-2 space-y-1">
                            {currentList}
                        </ul>
                    );
                    currentList = [];
                    inList = false;
                }

                const isFailure = line.toLowerCase().includes('failure');
                elements.push(
                    <div key={idx} className={`mt-3 p-3 rounded-lg ${isFailure ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <span className={`font-semibold ${isFailure ? 'text-red-700' : 'text-green-700'}`}>
                            {isFailure ? '⚠️ ' : '✓ '}{line}
                        </span>
                    </div>
                );
                return;
            }

            // Code blocks (`code`)
            if (line.includes('`')) {
                const parts = line.split('`');
                const rendered = parts.map((part, i) => {
                    if (i % 2 === 1) {
                        // Code part
                        return (
                            <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-sm">
                                {part}
                            </code>
                        );
                    }
                    return part;
                });

                // Close any open list
                if (inList && currentList.length > 0) {
                    elements.push(
                        <ul key={`list-${idx}`} className="list-disc list-inside text-slate-600 mb-3 pl-2 space-y-1">
                            {currentList}
                        </ul>
                    );
                    currentList = [];
                    inList = false;
                }

                elements.push(
                    <p key={idx} className="text-slate-700 leading-relaxed mb-2">
                        {rendered}
                    </p>
                );
                return;
            }

            // Regular paragraph
            if (line.trim()) {
                // Close any open list
                if (inList && currentList.length > 0) {
                    elements.push(
                        <ul key={`list-${idx}`} className="list-disc list-inside text-slate-600 mb-3 pl-2 space-y-1">
                            {currentList}
                        </ul>
                    );
                    currentList = [];
                    inList = false;
                }

                elements.push(
                    <p key={idx} className="text-slate-700 leading-relaxed mb-2">
                        {line}
                    </p>
                );
            }
        });

        // Close any remaining list
        if (inList && currentList.length > 0) {
            elements.push(
                <ul key="list-final" className="list-disc list-inside text-slate-600 mb-3 pl-2 space-y-1">
                    {currentList}
                </ul>
            );
        }

        return elements;
    };

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
            <div className="flex-1 overflow-y-auto px-4 py-4">
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
                        {lineText && (
                            <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 max-w-full overflow-x-auto">
                                <code className="text-xs text-slate-600 font-mono whitespace-nowrap">
                                    {lineText.length > 50 ? lineText.substring(0, 50) + '...' : lineText}
                                </code>
                            </div>
                        )}
                    </div>
                )}

                {/* No Explanation State */}
                {!isLoading && !explanation && (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                            Explore Why
                        </h3>
                        <p className="text-slate-500 text-sm max-w-xs">
                            Click the <span className="font-semibold text-indigo-600">"Why"</span> button on any step card to understand why that line of code exists.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && explanation && explanation.includes('❌') && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-red-700 text-sm">
                                {renderExplanation(explanation)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Explanation Content - Visual distinction for WHY section */}
                {!isLoading && explanation && !explanation.includes('❌') && (
                    <div className="bg-indigo-50/50 border border-indigo-100 border-l-4 border-l-indigo-400 rounded-lg p-4">
                        <div className="prose prose-slate prose-sm max-w-none">
                            {renderExplanation(explanation)}
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
