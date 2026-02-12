/**
 * DSAImmersiveVisualizer - Full-screen DSA Problem Visualizer
 * 
 * Combines:
 * - Left: Algorithm-specific visualizer (MergeSortVisualizer)
 * - Right: Code panel with line highlighting + Ask SIA
 * 
 * Uses same layout as ImmersiveVisualizer but with custom visualization
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import MergeSortVisualizer from './MergeSortVisualizer';

// ============ CODE PANEL WITH LINE HIGHLIGHTING ============
const CodePanel = ({ code, currentLineNumber, executedLines = [], width = 400 }) => {
    const lines = code.split('\n');

    return (
        <div
            style={{ width: `${width}px` }}
            className="flex-shrink-0 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-slate-400 font-mono ml-2">merge_sort.py</span>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-y-auto py-2 font-mono text-[13px] leading-[1.7]">
                {lines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const isCurrentLine = lineNum === currentLineNumber;
                    const wasExecuted = executedLines.includes(lineNum);

                    return (
                        <div
                            key={idx}
                            className={`flex transition-all duration-300 ${isCurrentLine
                                ? 'bg-blue-500/20 border-l-2 border-blue-400'
                                : wasExecuted
                                    ? 'bg-slate-800/30 border-l-2 border-emerald-500/30'
                                    : 'border-l-2 border-transparent'
                                }`}
                        >
                            <span className={`w-10 text-right pr-3 select-none shrink-0 ${isCurrentLine
                                ? 'text-blue-400 font-bold'
                                : wasExecuted
                                    ? 'text-emerald-500/70'
                                    : 'text-slate-600'
                                }`}>
                                {lineNum}
                            </span>
                            <span className={`pr-4 ${isCurrentLine
                                ? 'text-blue-100'
                                : wasExecuted
                                    ? 'text-slate-400'
                                    : 'text-slate-500'
                                }`}>
                                {highlightSyntax(line) || ' '}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Simple syntax highlighting - returns React elements with preserved indentation
const highlightSyntax = (line) => {
    if (!line) return <span>&nbsp;</span>;

    // Extract leading whitespace first
    const leadingSpaces = line.match(/^(\s*)/)[1];
    const codeContent = line.slice(leadingSpaces.length);

    const result = [];
    let key = 0;

    // Add preserved indentation
    if (leadingSpaces) {
        result.push(<span key={key++} style={{ whiteSpace: 'pre' }}>{leadingSpaces}</span>);
    }

    let remaining = codeContent;

    const keywords = ['def', 'if', 'else', 'elif', 'for', 'while', 'return', 'and', 'or', 'not', 'in', 'True', 'False', 'None'];
    const builtins = ['len', 'print', 'range', 'append', 'extend'];

    while (remaining.length > 0) {
        // Check for comment
        if (remaining.startsWith('#')) {
            result.push(<span key={key++} className="text-slate-500 italic">{remaining}</span>);
            break;
        }

        // Check for string
        const stringMatch = remaining.match(/^(["'])(?:(?!\1)[^\\]|\\.)*?\1/);
        if (stringMatch) {
            result.push(<span key={key++} className="text-green-400">{stringMatch[0]}</span>);
            remaining = remaining.slice(stringMatch[0].length);
            continue;
        }

        // Check for number
        const numMatch = remaining.match(/^\d+/);
        if (numMatch) {
            result.push(<span key={key++} className="text-amber-400">{numMatch[0]}</span>);
            remaining = remaining.slice(numMatch[0].length);
            continue;
        }

        // Check for word
        const wordMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
        if (wordMatch) {
            const word = wordMatch[0];
            let className = 'text-slate-300';
            if (keywords.includes(word)) className = 'text-purple-400 font-semibold';
            else if (builtins.includes(word)) className = 'text-blue-400';
            result.push(<span key={key++} className={className}>{word}</span>);
            remaining = remaining.slice(word.length);
            continue;
        }

        // Default: single character
        result.push(<span key={key++} className="text-slate-400">{remaining[0]}</span>);
        remaining = remaining.slice(1);
    }

    return result;
};

// ============ MAIN DSA IMMERSIVE VISUALIZER ============
const DSAImmersiveVisualizer = ({
    isOpen,
    onClose,
    steps = [],
    code = '',
    isLoading = false,
    loadingPhase = 0,
    algorithmType = 'merge-sort',
    customArray = '[38, 27, 43, 3, 9, 82, 10]',
    onRerun = null // Callback to rerun with new array: (arrayString) => void
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showCodePanel, setShowCodePanel] = useState(true);
    const [executedLines, setExecutedLines] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);

    // Local array input state for inline editing
    const [localArrayInput, setLocalArrayInput] = useState(customArray);
    const [inputError, setInputError] = useState('');
    const [showInputPanel, setShowInputPanel] = useState(false);

    // Update local input when prop changes
    useEffect(() => {
        setLocalArrayInput(customArray);
    }, [customArray]);

    // Validate array input
    const validateInput = (input) => {
        const trimmed = input.trim();
        if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return 'Invalid format';
        const inner = trimmed.slice(1, -1).trim();
        if (!inner) return 'Empty array';
        const parts = inner.split(',').map(p => p.trim());
        for (const part of parts) {
            if (!/^-?\d+$/.test(part)) return `Invalid: ${part}`;
        }
        if (parts.length > 15) return 'Max 15 elements';
        return '';
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setLocalArrayInput(value);
        setInputError(validateInput(value));
    };

    const handleRerun = () => {
        if (!inputError && onRerun) {
            setShowInputPanel(false);
            onRerun(localArrayInput);
        }
    };

    // Create initialization step for array creation
    // This shows before the actual trace begins - uses the custom array
    const parseArrayFromString = (str) => {
        try {
            const inner = str.trim().slice(1, -1);
            return inner.split(',').map(p => parseInt(p.trim(), 10));
        } catch { return [38, 27, 43, 3, 9, 82, 10]; }
    };

    const initStep = useMemo(() => ({
        lineNumber: 39, // Line 39 is where arr = [...] is defined
        line_no: 39,
        code: `arr = ${customArray}`,
        explanation: 'Creating the initial unsorted array that we will sort using merge sort.',
        variables: {
            arr: parseArrayFromString(customArray)
        },
        stepType: 'init_array'
    }), [customArray]);

    // Second synthetic step for the function call line (which tracer skips)
    const callStep = useMemo(() => ({
        lineNumber: 40, // Line 40 is where result = merge_sort(arr) is called
        line_no: 40,
        code: 'result = merge_sort(arr)',
        explanation: 'Calling the merge_sort function with our array. This will recursively divide and conquer the array.',
        variables: {
            arr: parseArrayFromString(customArray)
        },
        stepType: 'call_function'
    }), [customArray]);

    // Prepend the initialization steps to the steps array
    const allSteps = useMemo(() => {
        if (steps.length === 0) return [];
        return [initStep, callStep, ...steps];
    }, [steps, initStep, callStep]);

    // Get current step from allSteps (includes init step)
    const currentStep = allSteps[currentStepIndex];
    const currentLineNumber = currentStep?.lineNumber || currentStep?.line_no || 0;

    // Track executed lines
    useEffect(() => {
        if (currentStep) {
            setExecutedLines(prev => {
                const line = currentStep.lineNumber || currentStep.line_no;
                if (line && !prev.includes(line)) {
                    return [...prev, line];
                }
                return prev;
            });
        }
    }, [currentStep]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setCurrentStepIndex(0);
            setExecutedLines([]);
            setIsPlaying(false);
        }
    }, [isOpen]);

    // Handle step change
    const handleStepChange = useCallback((newIndex) => {
        if (newIndex >= 0 && newIndex < allSteps.length) {
            setCurrentStepIndex(newIndex);
            // Rebuild executed lines for the new index
            const newExecutedLines = allSteps.slice(0, newIndex + 1).map(s => s.lineNumber || s.line_no).filter(Boolean);
            setExecutedLines([...new Set(newExecutedLines)]);
        }
    }, [allSteps]);

    // Auto-play
    useEffect(() => {
        if (isPlaying && currentStepIndex < allSteps.length - 1) {
            const timer = setTimeout(() => {
                handleStepChange(currentStepIndex + 1);
            }, 1500);
            return () => clearTimeout(timer);
        } else if (isPlaying && currentStepIndex >= allSteps.length - 1) {
            setIsPlaying(false);
        }
    }, [isPlaying, currentStepIndex, allSteps.length, handleStepChange]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleStepChange(currentStepIndex + 1);
            if (e.key === 'ArrowLeft') handleStepChange(currentStepIndex - 1);
            if (e.key === ' ') {
                e.preventDefault();
                setIsPlaying(p => !p);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, currentStepIndex, handleStepChange]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>

                    <div className="h-5 w-px bg-slate-700" />

                    <h1 className="text-base font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Merge Sort Visualizer
                    </h1>
                </div>

                {/* Center: Array Input */}
                <div className="flex items-center gap-3">
                    {showInputPanel ? (
                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-3 py-1.5">
                            <span className="text-slate-400 text-sm">arr =</span>
                            <input
                                type="text"
                                value={localArrayInput}
                                onChange={handleInputChange}
                                className={`w-48 px-2 py-1 bg-slate-900 border rounded-lg font-mono text-sm text-white focus:outline-none transition-all ${inputError ? 'border-red-500/50' : 'border-slate-600 focus:border-blue-500'
                                    }`}
                                placeholder="[1, 2, 3]"
                            />
                            {inputError && (
                                <span className="text-red-400 text-xs">{inputError}</span>
                            )}
                            <button
                                onClick={handleRerun}
                                disabled={!!inputError || !onRerun}
                                className={`px-3 py-1 text-sm font-medium rounded-lg transition-all ${inputError || !onRerun
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                            >
                                ▶ Run
                            </button>
                            <button
                                onClick={() => setShowInputPanel(false)}
                                className="text-slate-400 hover:text-white text-sm"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        onRerun && (
                            <button
                                onClick={() => setShowInputPanel(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all"
                            >
                                <span className="text-amber-400">✎</span>
                                Change Input
                            </button>
                        )
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCodePanel(!showCodePanel)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${showCodePanel
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {showCodePanel ? 'Hide Code' : 'Show Code'}
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-red-500 text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visualization Area */}
                <div className="flex-1 min-w-0">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-slate-400">
                                    {loadingPhase === 1 && 'Reading code...'}
                                    {loadingPhase === 2 && 'Analyzing algorithm...'}
                                    {loadingPhase === 3 && 'Preparing visualization...'}
                                    {loadingPhase === 4 && 'Starting execution...'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <MergeSortVisualizer
                            steps={allSteps}
                            currentStepIndex={currentStepIndex}
                            onStepChange={handleStepChange}
                            isPlaying={isPlaying}
                            onPlayPause={() => setIsPlaying(p => !p)}
                        />
                    )}
                </div>

                {/* Code Panel */}
                <AnimatePresence>
                    {showCodePanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 400, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0 overflow-hidden"
                        >
                            <CodePanel
                                code={code}
                                currentLineNumber={currentLineNumber}
                                executedLines={executedLines}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DSAImmersiveVisualizer;
