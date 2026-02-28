/**
 * DSAImmersiveVisualizer - Full-screen DSA Problem Visualizer
 * 
 * Combines:
 * - Left: Algorithm-specific visualizer (MergeSortVisualizer)
 * - Right: Code panel with line highlighting + Ask SIA
 * 
 * Uses same layout as ImmersiveVisualizer but with custom visualization
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import CoreLogicVisualizer from './CoreLogicVisualizer';
import SyncedCoreLogicVisualizer from './SyncedCoreLogicVisualizer';

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
    const [activeTab, setActiveTab] = useState('logic'); // 'logic' | 'combined'

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

                {/* Center: View Tabs */}
                <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => setActiveTab('logic')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'logic'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        Core Logic Visualization
                    </button>
                    <button
                        onClick={() => setActiveTab('combined')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'combined'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        New Code Exec Vis
                    </button>
                </div>

                {/* Right of center: Array Input */}
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
                    {activeTab === 'combined' ? (
                        <SyncedCoreLogicVisualizer customArray={customArray} code={code} />
                    ) : (
                        <CoreLogicVisualizer customArray={customArray} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DSAImmersiveVisualizer;
