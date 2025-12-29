import React, { useRef } from 'react';
import { Sparkles, ChevronLeft, Play } from 'lucide-react';

/**
 * MobileImmersiveVisualizer - Dedicated mobile component for code visualization
 * Uses vertical scrollable timeline with professional mobile UX
 */
const MobileImmersiveVisualizer = ({
    isOpen,
    onClose,
    visibleSteps = [],
    totalSteps = 0,
    code,
    codeLines,
    isLoading,
    loadingPhase,
    isGenerating = false,
    isStreaming = false,
    onLoadMore,
    isLoadingMore = false,
}) => {
    const contentRef = useRef(null);
    const hasMoreSteps = visibleSteps.length < totalSteps;

    // Syntax highlighting for code
    const highlightSyntax = (codeLine) => {
        if (!codeLine) return <span>&nbsp;</span>;

        const keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'break', 'continue', 'pass', 'raise', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'self'];
        const builtins = ['print', 'range', 'len', 'int', 'str', 'list', 'dict', 'set', 'tuple', 'float', 'bool', 'type', 'input', 'open', 'map', 'filter', 'sorted', 'enumerate', 'zip', 'sum', 'max', 'min', 'abs'];

        const result = [];
        let remaining = codeLine;
        let key = 0;

        while (remaining.length > 0) {
            // String match
            const stringMatch = remaining.match(/^(["'])(?:(?!\1)[^\\]|\\.)*?\1/);
            if (stringMatch) {
                result.push(<span key={key++} className="text-emerald-600">{stringMatch[0]}</span>);
                remaining = remaining.slice(stringMatch[0].length);
                continue;
            }

            // Comment
            if (remaining.startsWith('#')) {
                result.push(<span key={key++} className="text-slate-400 italic">{remaining}</span>);
                break;
            }

            // Number
            const numMatch = remaining.match(/^\d+(\.\d+)?/);
            if (numMatch) {
                result.push(<span key={key++} className="text-orange-500">{numMatch[0]}</span>);
                remaining = remaining.slice(numMatch[0].length);
                continue;
            }

            // Word
            const wordMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            if (wordMatch) {
                const word = wordMatch[0];
                let className = 'text-slate-800';
                if (keywords.includes(word)) className = 'text-purple-600 font-semibold';
                else if (builtins.includes(word)) className = 'text-blue-600';
                result.push(<span key={key++} className={className}>{word}</span>);
                remaining = remaining.slice(word.length);
                continue;
            }

            // Operators
            const opMatch = remaining.match(/^[+\-*/%=<>!&|^~@:,.\[\](){}]+/);
            if (opMatch) {
                result.push(<span key={key++} className="text-indigo-500">{opMatch[0]}</span>);
                remaining = remaining.slice(opMatch[0].length);
                continue;
            }

            // Default
            result.push(<span key={key++}>{remaining[0]}</span>);
            remaining = remaining.slice(1);
        }

        return result;
    };

    // Render dry run section
    const renderDryRun = (dryRunLines) => {
        if (!dryRunLines || dryRunLines.length === 0) return null;

        return (
            <div className="mt-3 bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center">
                        <Play className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Dry Run</span>
                </div>
                <div className="font-mono text-xs space-y-1 text-slate-700">
                    {dryRunLines.map((line, idx) => (
                        <div key={idx} className="leading-relaxed">
                            {line.includes('=') && !line.includes('==') ? (
                                <>
                                    <span className="text-indigo-700 font-medium">{line.split('=')[0]}</span>
                                    <span className="text-slate-400">=</span>
                                    <span className="text-emerald-600">{line.split('=').slice(1).join('=')}</span>
                                </>
                            ) : (
                                <span>{line}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
            {/* Mobile Header */}
            <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 safe-area-top">
                <div className="flex items-center justify-between">
                    {/* Back Button */}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-sm -ml-1 p-1"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>

                    {/* Step Counter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                            {visibleSteps.length} of {totalSteps} Steps
                        </span>
                    </div>

                    {/* Placeholder for balance */}
                    <div className="w-16" />
                </div>
            </header>

            {/* Loading State */}
            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-slate-600 font-medium text-center">
                        {loadingPhase === 1 && "Reading your code..."}
                        {loadingPhase === 2 && "Analyzing execution flow..."}
                        {loadingPhase === 3 && "Preparing visualization..."}
                        {loadingPhase === 4 && "Starting execution..."}
                    </p>
                </div>
            )}

            {/* Main Content - Vertical Scrollable */}
            {!isLoading && visibleSteps.length > 0 && (
                <main
                    ref={contentRef}
                    className={`flex-1 overflow-y-auto px-3 py-3 ${hasMoreSteps ? 'pb-24' : ''}`}
                >
                    {/* Step Cards */}
                    <div className="space-y-3">

                        {/* Step Cards */}
                        {visibleSteps.map((step, idx) => {
                            const isLatest = idx === visibleSteps.length - 1;

                            // Extract explanation text and dry run
                            let explanationText = step.explanation || '';
                            let dryRunLines = [];

                            if (explanationText.includes('DRY-RUN:')) {
                                const dryRunMatch = explanationText.match(/DRY-RUN:\s*([\s\S]*?)(?:$)/i);
                                if (dryRunMatch) {
                                    dryRunLines = dryRunMatch[1].trim().split('\n').filter(line => line.trim());
                                }
                                explanationText = explanationText.substring(0, explanationText.indexOf('DRY-RUN:')).replace(/🔍/g, '').trim();
                            }

                            if (step.dry_run && Array.isArray(step.dry_run) && step.dry_run.length > 0) {
                                dryRunLines = step.dry_run;
                            }

                            return (
                                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    {/* Header */}
                                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                                Line {step.lineNumber || step.line_no || step.line}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                Step {idx + 1}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Code */}
                                    <div className="px-3 py-2 bg-white border-b border-slate-100">
                                        <div className="font-mono text-sm text-slate-800 whitespace-pre overflow-x-auto">
                                            {highlightSyntax(step.code)}
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    {step.explanation && (
                                        <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
                                            <div className="flex items-start gap-2">
                                                <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-700 leading-relaxed">
                                                        {explanationText}
                                                    </p>
                                                    {dryRunLines.length > 0 && renderDryRun(dryRunLines)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Generating Placeholder */}
                                    {!step.explanation && (
                                        <div className="p-3 bg-slate-50">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                                                <span className="text-xs">Generating...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Variables */}
                                    {step.variables && Object.keys(step.variables).length > 0 && (
                                        <div className="px-3 py-2 border-t border-slate-100">
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(step.variables).map(([name, data]) => {
                                                    const value = data.value !== undefined
                                                        ? (typeof data.value === 'object' ? JSON.stringify(data.value) : String(data.value))
                                                        : 'undefined';
                                                    const isChanged = step.changedVars?.includes(name);

                                                    return (
                                                        <span
                                                            key={name}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono ${isChanged
                                                                ? 'bg-indigo-100 text-indigo-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                                }`}
                                                        >
                                                            <span className="font-semibold">{name}</span>
                                                            <span className="text-slate-400">=</span>
                                                            <span>{value.length > 15 ? value.slice(0, 15) + '...' : value}</span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Output */}
                                    {step.output && (
                                        <div className="px-3 py-2 border-t border-slate-100">
                                            <div className="bg-slate-900 rounded-lg p-2 font-mono text-xs text-emerald-400">
                                                <span className="text-slate-500 mr-2">$</span>
                                                {step.output}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Completion Marker - Only show when all steps are visible */}
                        {!isGenerating && !hasMoreSteps && visibleSteps.length > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                        <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-800">Complete! 🎉</h4>
                                    <p className="text-xs text-emerald-600">{totalSteps} steps executed</p>
                                </div>
                            </div>
                        )}

                        {/* Generating Indicator */}
                        {isGenerating && (
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-3">
                                <span className="inline-flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                                Receiving steps...
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* Fixed Floating Load More Button - Like Desktop */}
            {!isLoading && hasMoreSteps && !isStreaming && (
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pointer-events-none">
                    <button
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="pointer-events-auto mx-auto flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl active:scale-[0.97] transition-all disabled:opacity-70"
                    >
                        {isLoadingMore ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Loading explanations...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Continue • {totalSteps - visibleSteps.length} more steps</span>
                            </>
                        )}
                    </button>
                </div>
            )}

        </div>
    );
};

export default MobileImmersiveVisualizer;
