/**
 * DSAImmersiveVisualizer - Full-screen DSA Problem Visualizer
 * 
 * Combines:
 * - Left: Algorithm-specific visualizer (MergeSortVisualizer)
 * - Right: Code panel with line highlighting + Ask SIA
 * 
 * Uses same layout as ImmersiveVisualizer but with custom visualization
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import CoreLogicVisualizer from './CoreLogicVisualizer';
import SyncedCoreLogicVisualizer from './SyncedCoreLogicVisualizer';
import QuickSortCoreLogicVisualizer from './QuickSortCoreLogicVisualizer';
import QuickSortSyncedVisualizer from './QuickSortSyncedVisualizer';
import BubbleSortSyncedVisualizer from './BubbleSortSyncedVisualizer';
import SelectionSortSyncedVisualizer from './SelectionSortSyncedVisualizer';
import InsertionSortSyncedVisualizer from './InsertionSortSyncedVisualizer';
import CharReplacementVisualizer from './CharReplacementVisualizer';
import BinarySearchVisualizer from './BinarySearchVisualizer';

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
    const [activeTab, setActiveTab] = useState('combined'); // 'logic' | 'combined'

    // Scrubber state (shared across tabs)
    const [progress, setProgress]   = useState({ idx: -1, total: 0 });
    const [hoverFrac, setHoverFrac] = useState(null);
    const scrubberRef  = useRef(null);
    const scrubbingRef = useRef(false);
    const logicSeekRef = useRef(null);  // CoreLogicVisualizer seek fn
    const synthSeekRef = useRef(null);  // SyncedCoreLogicVisualizer seek fn

    // Reset progress indicator when switching tabs
    useEffect(() => { setProgress({ idx: -1, total: 0 }); }, [activeTab]);

    const seekFraction = useCallback((clientX) => {
        if (!scrubberRef.current || !progress.total) return;
        const rect = scrubberRef.current.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newIdx = Math.round(frac * progress.total) - 1;
        const fn = activeTab === 'logic' ? logicSeekRef.current : synthSeekRef.current;
        fn?.(newIdx);
    }, [progress.total, activeTab]);

    useEffect(() => {
        const onMove = (e) => { if (scrubbingRef.current) seekFraction(e.clientX); };
        const onUp   = () => { scrubbingRef.current = false; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
        };
    }, [seekFraction]);

    // Local array input state for inline editing
    const [localArrayInput, setLocalArrayInput] = useState(customArray);
    const [inputError, setInputError] = useState('');
    const [showInputPanel, setShowInputPanel] = useState(false);

    // Mobile code panel toggle
    const [showCode, setShowCode] = useState(false);
    const closeCode = () => setShowCode(false);

    // Update local input when prop changes
    useEffect(() => {
        setLocalArrayInput(customArray);
    }, [customArray]);

    // Validate array input
    const validateInput = (input) => {
        if (algorithmType === 'char-replacement') {
            const trimmed = input.trim();
            const parts = trimmed.split(',');
            if (parts.length !== 2) return 'Format: LETTERS,k';
            const s = parts[0].trim();
            const k = parts[1].trim();
            if (!/^[A-Za-z]+$/.test(s)) return 'Letters only before comma';
            if (!/^\d+$/.test(k)) return 'Number required after comma';
            if (s.length > 20) return 'Max 20 chars';
            return '';
        }
        if (algorithmType === 'binary-search') {
            const trimmed = input.trim();
            const commaIdx = trimmed.lastIndexOf(',');
            if (commaIdx < 0) return 'Format: [arr],target';
            const arrPart = trimmed.slice(0, commaIdx).trim();
            const tgtPart = trimmed.slice(commaIdx + 1).trim();
            if (!arrPart.startsWith('[') || !arrPart.endsWith(']')) return 'Array must be in []';
            if (!/^-?\d+$/.test(tgtPart)) return 'Target must be a number';
            return '';
        }
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

    // (execution-tab step machinery removed)

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-900">
            {/* Header */}
            <header className="relative flex-shrink-0 flex items-center justify-between px-3 md:px-6 py-2.5 md:py-3 bg-slate-900 border-b border-slate-700/60">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        <span className="text-sm">Back</span>
                        Back
                    </button>

                    <div className="h-4 w-px bg-white/20" />

                    <h1 className="text-sm md:text-base font-semibold text-white flex items-center gap-1.5 md:gap-2 truncate">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 flex-shrink-0" />
                        <span className="truncate">
                            {algorithmType === 'quick-sort' ? 'Quick Sort'
                             : algorithmType === 'bubble-sort' ? 'Bubble Sort'
                             : algorithmType === 'selection-sort' ? 'Selection Sort'
                             : algorithmType === 'insertion-sort' ? 'Insertion Sort'
                             : algorithmType === 'char-replacement'
                                 ? <><span className="md:hidden">Char Replacement</span><span className="hidden md:inline">Longest Repeating Char Replacement</span></>
                             : algorithmType === 'binary-search' ? 'Binary Search'
                             : 'Merge Sort'}
                        </span>
                    </h1>
                </div>

                {/* Right: Compact Scrubber + Array Input */}
                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">

                    {/* Inline seek scrubber — desktop only */}
                    {progress.total > 0 && (
                        <div className="hidden md:flex items-center gap-2">
                            <div
                                ref={scrubberRef}
                                className="relative w-64 h-[6px] rounded-full bg-white/10 cursor-pointer group/scrub"
                                onMouseDown={(e) => { scrubbingRef.current = true; seekFraction(e.clientX); }}
                                onMouseMove={(e) => {
                                    const rect = scrubberRef.current.getBoundingClientRect();
                                    setHoverFrac(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                                }}
                                onMouseLeave={() => setHoverFrac(null)}
                            >
                                {/* Fill */}
                                <div className="absolute left-0 top-0 h-full rounded-full bg-indigo-500 transition-[width] duration-75"
                                    style={{ width: `${((progress.idx + 1) / progress.total) * 100}%` }} />
                                {/* Ghost hover */}
                                {hoverFrac !== null && (
                                    <div className="absolute left-0 top-0 h-full rounded-full bg-white/10 pointer-events-none"
                                        style={{ width: `${hoverFrac * 100}%` }} />
                                )}
                                {/* Thumb */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover/scrub:opacity-100 transition-opacity pointer-events-none"
                                    style={{ left: `${((progress.idx + 1) / progress.total) * 100}%` }}
                                />

                            </div>
                        </div>
                    )}

                    {showInputPanel ? (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-sm">
                            <span className="text-white/40 text-xs font-mono">
                                {algorithmType === 'char-replacement' ? 's, k =' : algorithmType === 'binary-search' ? 'arr, target =' : 'arr ='}
                            </span>
                            <input
                                type="text"
                                value={localArrayInput}
                                onChange={handleInputChange}
                                className={`w-44 px-2 py-1 bg-black/30 border rounded-lg font-mono text-sm text-white focus:outline-none transition-all ${inputError ? 'border-red-500/60' : 'border-white/20 focus:border-indigo-400'}`}
                                placeholder={algorithmType === 'char-replacement' ? 'AABCBA,2' : algorithmType === 'binary-search' ? '[3,12,25,31,42],31' : '[1, 2, 3]'}
                            />
                            {inputError && (
                                <span className="text-red-400 text-xs">{inputError}</span>
                            )}
                            <button
                                onClick={handleRerun}
                                disabled={!!inputError || !onRerun}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                    inputError || !onRerun
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                }`}
                            >
                                Run
                            </button>
                            <button
                                onClick={() => setShowInputPanel(false)}
                                className="text-white/30 hover:text-white/70 text-xs px-1"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        onRerun && (
                            <button
                                onClick={() => setShowInputPanel(true)}
                                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/25 text-white/70 hover:text-white rounded-xl text-sm font-medium transition-all shadow-sm"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400 flex-shrink-0">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span className="hidden md:inline">Change Input</span>
                            </button>
                        )
                    )}
                    {/* Mobile: toggle code panel */}
                    <button
                        className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/15 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-medium flex-shrink-0"
                        onClick={() => setShowCode(v => !v)}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
                        </svg>
                        {showCode ? 'Hide' : 'Code'}
                    </button>
                </div>
            </header>

            {/* Mobile backdrop for code panel */}
            {showCode && (
                <div
                    className="md:hidden fixed inset-0 z-30 bg-black/60"
                    onClick={closeCode}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visualization Area */}
                <div className="flex-1 min-w-0">
                    {algorithmType === 'quick-sort' ? (
                        activeTab === 'combined' ? (
                            <QuickSortSyncedVisualizer customArray={customArray} code={code} onProgress={setProgress} seekRef={synthSeekRef} showCode={showCode} onCloseCode={closeCode} />
                        ) : (
                            <QuickSortCoreLogicVisualizer customArray={customArray} onProgress={setProgress} seekRef={logicSeekRef} />
                        )
                    ) : algorithmType === 'bubble-sort' ? (
                        <BubbleSortSyncedVisualizer customArray={customArray} code={code} onProgress={setProgress} seekRef={synthSeekRef} showCode={showCode} onCloseCode={closeCode} />
                    ) : algorithmType === 'selection-sort' ? (
                        <SelectionSortSyncedVisualizer customArray={customArray} code={code} onProgress={setProgress} seekRef={synthSeekRef} showCode={showCode} onCloseCode={closeCode} />
                    ) : algorithmType === 'insertion-sort' ? (
                        <InsertionSortSyncedVisualizer customArray={customArray} code={code} onProgress={setProgress} seekRef={synthSeekRef} showCode={showCode} onCloseCode={closeCode} />
                    ) : algorithmType === 'char-replacement' ? (
                        <CharReplacementVisualizer customArray={customArray} code={code} onProgress={setProgress} seekRef={synthSeekRef} showCode={showCode} onCloseCode={closeCode} />
                    ) : algorithmType === 'binary-search' ? (
                        <BinarySearchVisualizer customArray={customArray} code={code} onProgress={setProgress} seekRef={synthSeekRef} showCode={showCode} onCloseCode={closeCode} />
                    ) : (
                        activeTab === 'combined' ? (
                            <SyncedCoreLogicVisualizer customArray={customArray} code={code} onProgress={setProgress} seekRef={synthSeekRef} showCode={showCode} onCloseCode={closeCode} />
                        ) : (
                            <CoreLogicVisualizer customArray={customArray} onProgress={setProgress} seekRef={logicSeekRef} />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default DSAImmersiveVisualizer;
