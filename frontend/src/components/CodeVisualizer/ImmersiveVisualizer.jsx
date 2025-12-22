import React, { useEffect, useRef, useState, useCallback } from 'react';
import EnterpriseVisualizer from './EnterpriseVisualizer';

const ImmersiveVisualizer = ({
    isOpen,
    onClose,
    steps,
    code,
    codeLines,
    isLoading,
    loadingPhase,
    isGenerating = false
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);

    // Resizable sidebar state
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);

    const scrollContainerRef = useRef(null);

    // Reset when opened
    useEffect(() => {
        if (isOpen && !isLoading) {
            setCurrentStepIndex(-1);
        }
    }, [isOpen, isLoading]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // Don't capture shortcuts when typing in an input field
            const activeElement = document.activeElement;
            const isTyping = activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable;

            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);


    // Resizing logic
    const startResizing = useCallback((e) => {
        setIsResizing(true);
        e.preventDefault(); // Prevent text selection
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing) {
            // Calculate width from the right edge
            const newWidth = window.innerWidth - e.clientX;
            // Min width 300px, Max width 800px (or percentage of screen)
            if (newWidth > 300 && newWidth < window.innerWidth * 0.6) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // Get syntax highlighted code line - returns React elements
    const highlightSyntax = (codeLine) => {
        if (!codeLine) return <span>&nbsp;</span>;

        const keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'break', 'continue', 'pass', 'raise', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'self'];
        const builtins = ['print', 'range', 'len', 'int', 'str', 'list', 'dict', 'set', 'tuple', 'float', 'bool', 'type', 'input', 'open', 'map', 'filter', 'sorted', 'enumerate', 'zip', 'sum', 'max', 'min', 'abs'];

        const result = [];
        let remaining = codeLine;
        let key = 0;

        while (remaining.length > 0) {
            // Check for string (single or double quotes)
            const stringMatch = remaining.match(/^(["'])(?:(?!\1)[^\\]|\\.)*?\1/);
            if (stringMatch) {
                result.push(<span key={key++} className="text-green-400">{stringMatch[0]}</span>);
                remaining = remaining.slice(stringMatch[0].length);
                continue;
            }

            // Check for comment
            if (remaining.startsWith('#')) {
                result.push(<span key={key++} className="text-slate-500 italic">{remaining}</span>);
                break;
            }

            // Check for number
            const numMatch = remaining.match(/^\d+(\.\d+)?/);
            if (numMatch) {
                result.push(<span key={key++} className="text-orange-400">{numMatch[0]}</span>);
                remaining = remaining.slice(numMatch[0].length);
                continue;
            }

            // Check for word (keyword, builtin, or identifier)
            const wordMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            if (wordMatch) {
                const word = wordMatch[0];
                let className = 'text-slate-200';

                if (keywords.includes(word)) {
                    className = 'text-pink-400 font-semibold';
                } else if (builtins.includes(word)) {
                    className = 'text-blue-400';
                }

                result.push(<span key={key++} className={className}>{word}</span>);
                remaining = remaining.slice(word.length);
                continue;
            }

            // Check for operators and punctuation
            const opMatch = remaining.match(/^[+\-*/%=<>!&|^~@:,.\[\](){}]+/);
            if (opMatch) {
                result.push(<span key={key++} className="text-cyan-400">{opMatch[0]}</span>);
                remaining = remaining.slice(opMatch[0].length);
                continue;
            }

            // Default: take one character (whitespace or unknown)
            result.push(<span key={key++}>{remaining[0]}</span>);
            remaining = remaining.slice(1);
        }

        return result;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back to Editor
                    </button>

                    <div className="h-6 w-px bg-slate-700" />

                    <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        Code Execution Visualizer
                    </h1>
                </div>

            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-row-reverse overflow-hidden">
                {/* Left Side - Code Panel (Fixed) */}
                <div
                    style={{ width: `${sidebarWidth}px` }}
                    className="flex-shrink-0 bg-slate-900/50 border-l border-slate-800 flex flex-col relative"
                >
                    {/* Drag Handle */}
                    <div
                        onMouseDown={startResizing}
                        className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-teal-500/50 transition-colors z-10 ${isResizing ? 'bg-teal-500' : 'bg-transparent'}`}
                        style={{ transform: 'translateX(-50%)' }}
                    />
                    <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-center">
                        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                            <button
                                className="px-3 py-1.5 text-xs font-medium rounded-md transition-all bg-slate-700 text-white shadow-sm"
                            >
                                Source Code
                            </button>
                        </div>
                    </div>

                    {/* Source Code Panel */}
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                        {codeLines.map((line, idx) => {
                            const lineNum = idx + 1;
                            
                            // Use currentStepIndex to determine active step
                            const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
                            
                            const isCurrentLine = activeStep?.lineNumber === lineNum || 
                                activeStep?.line_no === lineNum || 
                                activeStep?.line === lineNum;
                            
                            // Check which lines have been executed so far
                            const executedLines = steps.slice(0, currentStepIndex + 1).map(s => s.lineNumber || s.line_no || s.line);
                            const wasExecuted = executedLines.includes(lineNum);

                            return (
                                <div
                                    key={idx}
                                    className={`flex transition-all duration-300 rounded-lg ${isCurrentLine
                                        ? 'bg-teal-500/20 border-l-4 border-teal-400 -ml-1 pl-1'
                                        : wasExecuted
                                            ? 'bg-slate-800/30'
                                            : ''
                                        }`}
                                >
                                    <span className={`w-10 text-right pr-4 select-none ${isCurrentLine ? 'text-teal-400 font-bold' : 'text-slate-600'
                                        }`}>
                                        {lineNum}
                                    </span>
                                    <span
                                        className={`flex-1 whitespace-pre ${isCurrentLine
                                            ? 'text-white'
                                            : wasExecuted
                                                ? 'text-slate-300'
                                                : 'text-slate-500'
                                            }`}
                                    >
                                        {highlightSyntax(line)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side - Execution Timeline (Scrollable) */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900"
                >
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-teal-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 animate-pulse" />
                                </div>
                            </div>
                            <p className="mt-6 text-lg text-slate-300 animate-pulse">
                                {loadingPhase === 1 && "📖 Reading your code..."}
                                {loadingPhase === 2 && "🧠 Analyzing execution flow..."}
                                {loadingPhase === 3 && "✨ Preparing visualization..."}
                                {loadingPhase === 4 && "🚀 Starting execution..."}
                            </p>
                        </div>
                    )}

                    {/* Enterprise Mode - PixiJS + GSAP Visualizer */}
                    {!isLoading && (
                        <div className="h-full p-6">
                            <EnterpriseVisualizer
                                steps={steps}
                                code={code}
                                onStepChange={(index, step) => setCurrentStepIndex(index)}
                                className="h-full"
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 h-1 bg-slate-800">
                <div
                    className="h-full transition-all duration-300 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"
                    style={{ width: `${steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0}%` }}
                />
            </div>
        </div>
    );
};

export default ImmersiveVisualizer;
