import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, ChevronLeft, Play, Code2, List } from 'lucide-react';
import EnterpriseVisualizer from './EnterpriseVisualizer';

// CSS animation for smooth card appearance
const cardAnimationStyles = `
@keyframes fadeSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

/**
 * MobileImmersiveVisualizer - Dedicated mobile component for code visualization
 * Uses focus scroll effect - centered card is highlighted, others are blurred
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
    const cardRefs = useRef([]);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [focusModeEnabled, setFocusModeEnabled] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'visualize' // Default: normal scroll
    const hasMoreSteps = visibleSteps.length < totalSteps;

    // Calculate which card is most centered in the viewport
    const updateFocusedCard = useCallback(() => {
        if (!contentRef.current || cardRefs.current.length === 0) return;

        const container = contentRef.current;
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;

        let closestIndex = 0;
        let closestDistance = Infinity;

        cardRefs.current.forEach((card, index) => {
            if (!card) return;
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.top + cardRect.height / 2;
            const distance = Math.abs(containerCenter - cardCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        setFocusedIndex(closestIndex);
    }, []);

    // Add scroll listener
    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        container.addEventListener('scroll', updateFocusedCard);
        // Initial calculation
        updateFocusedCard();

        return () => container.removeEventListener('scroll', updateFocusedCard);
    }, [updateFocusedCard, visibleSteps.length]);

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
            {/* Inject animation styles */}
            <style>{cardAnimationStyles}</style>

            {/* Mobile Header */}
            <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 safe-area-top">
                <div className="flex items-center justify-between">
                    {/* Left: Back & Steps */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold text-slate-800">
                            {visibleSteps.length} of {totalSteps} Steps
                        </span>
                    </div>

                    {/* Right: Mode Toggles */}
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/50">
                        {/* Current Mode: Steps */}
                        <button
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`}
                            title="Steps View"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        {/* Visualization Mode */}
                        <button
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'visualize' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`}
                            title="Code View"
                            onClick={() => setViewMode('visualize')}
                        >
                            <Code2 className="w-4 h-4" />
                        </button>
                    </div>
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

            {/* Fixed Focus Button (Only when ON) - Placed outside scroll container */}
            {focusModeEnabled && (
                <div className="fixed top-16 right-4 z-50 animate-[fadeSlideIn_0.3s_ease-out]">
                    <button
                        onClick={() => setFocusModeEnabled(false)}
                        className="bg-indigo-50/95 backdrop-blur-sm text-indigo-700 border border-indigo-200/60 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.95] hover:bg-indigo-100"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        Exit Focus Mode
                    </button>
                </div>
            )}

            {/* Main Content - Scroll Container */}
            {!isLoading && visibleSteps.length > 0 && (
                viewMode === 'list' ? (
                    <main
                        ref={contentRef}
                        className={`flex-1 overflow-y-auto px-4 ${focusModeEnabled ? 'scroll-smooth' : 'py-0'} ${hasMoreSteps ? 'pb-24' : ''}`}
                        style={{
                            ...(focusModeEnabled ? { scrollSnapType: 'y proximity' } : {}),
                            overflowAnchor: 'none'
                        }}
                    >
                        {/* Controls & Spacing */}
                        {/* Controls & Spacing */}
                        {/* Inline Focus Button (Only when OFF) */}
                        {!focusModeEnabled && (
                            <div className="py-4 animate-[fadeSlideIn_0.3s_ease-out]">
                                <button
                                    onClick={() => {
                                        setFocusModeEnabled(true);
                                        if (contentRef.current) {
                                            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                        setFocusedIndex(0);
                                    }}
                                    className="w-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 font-semibold shadow-sm transition-all active:scale-[0.98]"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Enable Focus Mode
                                </button>
                            </div>
                        )}

                        {/* Top padding to allow first card to be centered (Focus Mode only) */}
                        <div
                            className={`transition-all ease-in-out ${focusModeEnabled ? 'duration-500' : 'duration-[1500ms]'}`}
                            style={{ height: focusModeEnabled ? '30vh' : '0px' }}
                        />

                        {/* Step Cards Container */}
                        <div className={focusModeEnabled ? 'space-y-2' : 'space-y-3'}>
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

                                // Calculate focus level for Focus Mode (0 = focused, 1+ = distance from focused)
                                const distanceFromFocus = Math.abs(idx - focusedIndex);
                                const isFocused = distanceFromFocus === 0;
                                const isNearFocus = distanceFromFocus === 1;

                                // Style based on Focus Mode
                                const cardWrapperStyle = focusModeEnabled ? {
                                    transform: isFocused ? 'scale(1)' : isNearFocus ? 'scale(0.97)' : 'scale(0.94)',
                                    opacity: isFocused ? 1 : isNearFocus ? 0.7 : 0.4,
                                    filter: isFocused ? 'blur(0px)' : isNearFocus ? 'blur(1px)' : 'blur(2px)',
                                } : {};

                                return (
                                    <div
                                        key={idx}
                                        ref={el => cardRefs.current[idx] = el}
                                        className={`transition-all ease-in-out ${focusModeEnabled ? 'duration-500' : 'duration-[1500ms]'}`}
                                        style={cardWrapperStyle}
                                    >
                                        {/* Horizontal line separator between cards */}
                                        {idx > 0 && (
                                            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-3" />
                                        )}

                                        {/* Step Card */}
                                        <div
                                            className={`bg-white rounded-xl shadow-sm border overflow-hidden animate-[fadeSlideIn_0.3s_ease-out] ${focusModeEnabled && isFocused ? 'border-indigo-200 shadow-md ring-2 ring-indigo-100' : 'border-slate-100'}`}
                                            style={{ animationFillMode: 'both', animationDelay: `${(idx % 6) * 50}ms` }}
                                        >
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
                                    </div>
                                );
                            })}

                            {/* Loading More Indicator - Simple bouncing dots */}
                            {isLoadingMore && (
                                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-4">
                                    <span className="inline-flex gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                    Receiving steps...
                                </div>
                            )}

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

                        {/* Bottom padding to allow last card to be centered (Focus Mode only) */}
                        <div
                            className={`transition-all ease-in-out ${focusModeEnabled ? 'duration-500' : 'duration-[1500ms]'}`}
                            style={{ height: focusModeEnabled ? '30vh' : '0px' }}
                        />
                    </main>
                ) : (
                    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative animate-[fadeSlideIn_0.3s_ease-out]">
                        <EnterpriseVisualizer
                            steps={visibleSteps}
                            code={code}
                            isGenerating={isGenerating}
                            currentStepIndex={focusedIndex}
                            width={window.innerWidth}
                            height={window.innerHeight - 120}
                        />
                    </div>
                )
            )}

            {/* Fixed Floating Load More Button - Like Desktop */}
            {!isLoading && hasMoreSteps && !isStreaming && viewMode === 'list' && (
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
