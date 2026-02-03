/**
 * MergeSortVisualizer - Complete Step-by-Step Animation Engine
 * 
 * Every code line gets a specific animation:
 * - Variable assignments: Show value appearing
 * - Comparisons: Highlight elements being compared
 * - Splits: Animate array dividing into children
 * - Merges: Animate elements combining in order
 * - Returns: Show result moving up the tree
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============ ARRAY BOX COMPONENT ============
const ArrayBox = ({ value, state = 'default', delay = 0, isComparing = false, isActive = false }) => {
    const getStyles = () => {
        switch (state) {
            case 'new': return 'bg-blue-500 border-blue-300 text-white shadow-lg shadow-blue-500/30';
            case 'comparing': return 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-300 shadow-lg shadow-amber-500/40';
            case 'selected': return 'bg-emerald-500 border-emerald-300 text-white shadow-lg shadow-emerald-500/30';
            case 'sorted': return 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 text-white shadow-lg shadow-emerald-500/30';
            case 'active': return 'bg-indigo-500 border-indigo-300 text-white ring-2 ring-indigo-300 shadow-lg shadow-indigo-500/30';
            case 'merging': return 'bg-purple-500 border-purple-300 text-white shadow-lg shadow-purple-500/30';
            default: return 'bg-slate-700 border-slate-500 text-white shadow-md';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{
                opacity: 1,
                scale: isComparing ? 1.15 : isActive ? 1.1 : 1,
                y: 0,
                boxShadow: isComparing ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none'
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, delay, type: 'spring', stiffness: 300 }}
            className={`
        relative w-12 h-12 flex items-center justify-center
        font-mono font-bold text-lg rounded-xl border-2
        transition-all duration-300 shadow-sm
        ${getStyles()}
      `}
        >
            {value}
            {isComparing && (
                <motion.div
                    className="absolute -inset-1 rounded-xl border-2 border-amber-400"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            )}
        </motion.div>
    );
};

// ============ ARRAY ROW COMPONENT ============
const ArrayRow = ({ id, data, label, state = 'default', highlightIndices = [], comparingIndices = [] }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center gap-2"
    >
        {label && (
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-mono text-slate-300 bg-slate-700 px-2 py-0.5 rounded"
            >
                {label}
            </motion.span>
        )}
        <div className="flex gap-1">
            {data.map((value, idx) => (
                <ArrayBox
                    key={`${id}-${idx}`}
                    value={value}
                    state={highlightIndices.includes(idx) ? 'selected' : state}
                    isComparing={comparingIndices.includes(idx)}
                    delay={idx * 0.05}
                />
            ))}
        </div>
    </motion.div>
);

// ============ CONNECTOR LINE ============
const Connector = ({ type = 'split' }) => (
    <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        className="flex justify-center py-1"
    >
        <svg width="80" height="24" viewBox="0 0 80 24">
            {type === 'split' ? (
                <>
                    <motion.path
                        d="M 40 0 L 20 22"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                    <motion.path
                        d="M 40 0 L 60 22"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    />
                </>
            ) : (
                <motion.path
                    d="M 20 0 L 40 22 L 60 0"
                    stroke="#10b981"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                />
            )}
        </svg>
    </motion.div>
);

// ============ STEP INFO PANEL - Dark Theme ============
const StepInfoPanel = ({ step, stepIndex, totalSteps }) => {
    if (!step) return null;

    return (
        <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-4 shadow-lg"
        >
            <div className="flex items-start gap-4">
                {/* Step Number Badge */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
                    {stepIndex + 1}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-400">Line {step.lineNumber || step.line_no}</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{totalSteps} total steps</span>
                    </div>

                    {/* Code Line */}
                    <div className="font-mono text-sm text-indigo-300 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50">
                        {step.code?.trim()}
                    </div>

                    {/* Explanation */}
                    {step.explanation && (
                        <p className="text-sm text-slate-300 leading-relaxed mt-3">
                            {step.explanation}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ============ VISUALIZATION STATE BUILDER ============
const buildVisualizationState = (steps, currentStepIndex) => {
    // This builds the visual tree state based on steps processed so far
    const state = {
        nodes: [],           // Array nodes at different levels
        comparisons: [],     // Current comparison highlights
        activeNode: null,    // Currently active array
        phase: 'initial',    // 'splitting', 'merging', 'complete'
        message: ''
    };

    if (currentStepIndex < 0 || !steps.length) {
        return state;
    }

    // Process steps up to current index to build state
    const processedSteps = steps.slice(0, currentStepIndex + 1);

    // Track all arrays we've seen
    const arrays = new Map();
    let callStack = [];

    for (let i = 0; i <= currentStepIndex; i++) {
        const step = steps[i];
        const code = step.code?.trim() || '';
        const vars = step.variables || {};

        // Detect array in variables
        if (vars.arr && Array.isArray(vars.arr)) {
            const arrKey = JSON.stringify(vars.arr);
            if (!arrays.has(arrKey)) {
                arrays.set(arrKey, {
                    data: vars.arr,
                    level: callStack.length,
                    createdAt: i
                });
            }
        }

        // Track function calls
        if (code.includes('merge_sort(')) {
            callStack.push({ step: i, arr: vars.arr });
            state.phase = 'splitting';
        }

        if (code.includes('return') && callStack.length > 0) {
            callStack.pop();
            if (callStack.length === 0) {
                state.phase = 'complete';
            }
        }

        // Detect comparisons
        if (code.includes('left[i]') && code.includes('right[j]')) {
            state.phase = 'merging';
            if (vars.i !== undefined && vars.j !== undefined) {
                state.comparisons = [
                    { array: 'left', index: vars.i },
                    { array: 'right', index: vars.j }
                ];
            }
        }
    }

    // Convert arrays map to nodes list
    state.nodes = Array.from(arrays.values())
        .sort((a, b) => a.createdAt - b.createdAt);

    return state;
};

// ============ MAIN VISUALIZER COMPONENT ============
const MergeSortVisualizer = ({
    steps = [],
    currentStepIndex = 0,
    onStepChange,
    isPlaying = false,
    onPlayPause
}) => {
    const [visualState, setVisualState] = useState({ nodes: [], comparisons: [], phase: 'initial' });

    // Build visualization state whenever step changes
    useEffect(() => {
        const newState = buildVisualizationState(steps, currentStepIndex);
        setVisualState(newState);
    }, [steps, currentStepIndex]);

    const currentStep = steps[currentStepIndex];
    const isAtEnd = currentStepIndex >= steps.length - 1;
    const isAtStart = currentStepIndex <= 0;

    const handleNext = useCallback(() => {
        if (currentStepIndex < steps.length - 1) {
            onStepChange?.(currentStepIndex + 1);
        }
    }, [currentStepIndex, steps.length, onStepChange]);

    const handlePrev = useCallback(() => {
        if (currentStepIndex > 0) {
            onStepChange?.(currentStepIndex - 1);
        }
    }, [currentStepIndex, onStepChange]);

    const handleRestart = useCallback(() => {
        onStepChange?.(0);
    }, [onStepChange]);

    // Get current variables for display - check multiple possible locations
    const currentVars = currentStep?.variables || currentStep?.locals || {};
    const code = currentStep?.code?.trim() || '';

    // Analyze the code line to determine what type of action this is
    const getStepType = () => {
        // Check if the step already has a stepType property (e.g., synthetic init step)
        if (currentStep?.stepType) return currentStep.stepType;

        if (!code) return 'initial';
        // Check for array initialization line first
        if (code.includes('arr = [') && code.includes(']')) return 'init_array';
        if (code.includes('if len(arr)') || code.includes('len(arr) <= 1')) return 'check_base';
        if (code.includes('return arr') && !code.includes('merge')) return 'return_base';
        if (code.includes('mid =') || code.includes('len(arr) //')) return 'compute_mid';
        if (code.includes('left = arr[:mid]')) return 'split_left';
        if (code.includes('right = arr[mid:]')) return 'split_right';
        if (code.includes('left_sorted = merge_sort(left)')) return 'recurse_left';
        if (code.includes('right_sorted = merge_sort(right)')) return 'recurse_right';
        if (code.includes('merge(left_sorted, right_sorted)')) return 'call_merge';
        if (code.includes('result = []')) return 'init_result';
        if (code.includes('i = j = 0')) return 'init_pointers';
        if (code.includes('while i < len(left)')) return 'compare_loop';
        if (code.includes('left[i]') && code.includes('right[j]')) return 'compare';
        if (code.includes('result.append(left[i])')) return 'append_left';
        if (code.includes('result.append(right[j])')) return 'append_right';
        if (code.includes('i += 1')) return 'inc_i';
        if (code.includes('j += 1')) return 'inc_j';
        if (code.includes('result.extend(left')) return 'extend_left';
        if (code.includes('result.extend(right')) return 'extend_right';
        if (code.includes('return result')) return 'return_merged';
        return 'other';
    };

    const stepType = getStepType();

    // Helper to extract actual value from backend variable format
    // Backend may return {value: 5, type: 'int'} or just 5
    const getValue = (v) => {
        if (v === null || v === undefined) return undefined;
        if (typeof v === 'object' && 'value' in v) return v.value;
        return v;
    };

    // Helper to extract array from variable
    const getArray = (v) => {
        if (!v) return null;
        if (Array.isArray(v)) return v;
        if (typeof v === 'object' && 'value' in v && Array.isArray(v.value)) return v.value;
        return null;
    };

    // PREDICTIVE ANIMATION: Extract values from explanation or next step
    // The backend captures state BEFORE line execution, so we need to "look ahead"
    const explanation = currentStep?.explanation || '';
    const nextStep = steps[currentStepIndex + 1];
    const nextVars = nextStep?.variables || nextStep?.locals || {};

    // Parse explanation to extract computed values
    // Example: "... mid = 7 // 2 → mid = 3" → extract mid = 3
    const parseResultFromExplanation = (name) => {
        // Look for patterns like "→ name = value" or "name = value"
        const regex = new RegExp(`→\\s*${name}\\s*=\\s*([\\d\\-]+|\\[[^\\]]*\\])`, 'i');
        const match = explanation.match(regex);
        if (match) {
            const val = match[1];
            if (val.startsWith('[')) {
                // It's an array - parse it
                try {
                    return JSON.parse(val.replace(/'/g, '"'));
                } catch { return null; }
            }
            return parseInt(val, 10);
        }
        return undefined;
    };

    // Get the "predicted" value - either from explanation or next step's variables
    const getPredictedValue = (name) => {
        // First try to parse from explanation
        const fromExplanation = parseResultFromExplanation(name);
        if (fromExplanation !== undefined) return fromExplanation;
        // Fall back to next step's variables (which has the result after current line runs)
        return getValue(nextVars[name]);
    };

    const getPredictedArray = (name) => {
        // First try to parse from explanation
        const fromExplanation = parseResultFromExplanation(name);
        if (Array.isArray(fromExplanation)) return fromExplanation;
        // Fall back to next step's variables
        return getArray(nextVars[name]);
    };

    // Get display arrays - use CURRENT vars for existing data, PREDICTED for new data
    let mainArray = getArray(currentVars.arr) || [];
    if (mainArray.length === 0 && steps.length > 0) mainArray = [38, 27, 43, 3, 9, 82, 10]; // Default

    // For mid, left, right - use PREDICTED values based on step type
    // This shows the RESULT of the current line immediately
    const mid = stepType === 'compute_mid' ? getPredictedValue('mid') : getValue(currentVars.mid);
    const leftArray = stepType === 'split_left' ? getPredictedArray('left') : getArray(currentVars.left);
    const rightArray = stepType === 'split_right' ? getPredictedArray('right') : getArray(currentVars.right);
    const resultArray = getArray(currentVars.result);
    const leftSorted = getArray(currentVars.left_sorted);
    const rightSorted = getArray(currentVars.right_sorted);

    // Get pointers for comparison highlighting (extract raw values)
    const iPtr = getValue(currentVars.i);
    const jPtr = getValue(currentVars.j);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {/* Step Info Header */}
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                <StepInfoPanel
                    step={currentStep}
                    stepIndex={currentStepIndex}
                    totalSteps={steps.length}
                />
            </div>

            {/* Main Visualization Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`step-${currentStepIndex}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-6"
                    >
                        {/* Step Type Indicator */}
                        <motion.div
                            className="px-4 py-2 rounded-full text-sm font-medium"
                            style={{
                                backgroundColor: stepType.includes('compare') ? '#f59e0b22' :
                                    stepType.includes('split') || stepType.includes('left') || stepType.includes('right') ? '#3b82f622' :
                                        stepType.includes('merge') || stepType.includes('result') || stepType.includes('append') ? '#10b98122' :
                                            stepType.includes('return') ? '#8b5cf622' :
                                                stepType === 'init_array' ? '#22c55e22' :
                                                    stepType === 'call_function' ? '#6366f122' : '#64748b22',
                                color: stepType.includes('compare') ? '#fbbf24' :
                                    stepType.includes('split') || stepType.includes('left') || stepType.includes('right') ? '#60a5fa' :
                                        stepType.includes('merge') || stepType.includes('result') || stepType.includes('append') ? '#34d399' :
                                            stepType.includes('return') ? '#a78bfa' :
                                                stepType === 'init_array' ? '#4ade80' :
                                                    stepType === 'call_function' ? '#a5b4fc' : '#94a3b8'
                            }}
                        >
                            {stepType === 'init_array' && '📊 Creating Initial Array'}
                            {stepType === 'call_function' && '🚀 Calling merge_sort(arr)'}
                            {stepType === 'check_base' && '🔍 Checking Base Case'}
                            {stepType === 'return_base' && '↩️ Base Case: Already Sorted'}
                            {stepType === 'compute_mid' && '📐 Computing Midpoint'}
                            {stepType === 'split_left' && '✂️ Creating Left Half'}
                            {stepType === 'split_right' && '✂️ Creating Right Half'}
                            {stepType === 'recurse_left' && '🔄 Recursively Sorting Left'}
                            {stepType === 'recurse_right' && '🔄 Recursively Sorting Right'}
                            {stepType === 'call_merge' && '🔗 Calling Merge'}
                            {stepType === 'init_result' && '📦 Initializing Result Array'}
                            {stepType === 'init_pointers' && '👆 Setting Up Pointers i=0, j=0'}
                            {stepType === 'compare_loop' && '🔄 Comparison Loop'}
                            {stepType === 'compare' && `⚖️ Comparing left[${iPtr}] vs right[${jPtr}]`}
                            {stepType === 'append_left' && `➕ Adding left[${iPtr}] to result`}
                            {stepType === 'append_right' && `➕ Adding right[${jPtr}] to result`}
                            {stepType === 'inc_i' && '👆 Moving left pointer (i++)'}
                            {stepType === 'inc_j' && '👆 Moving right pointer (j++)'}
                            {stepType === 'extend_left' && '📤 Adding remaining left elements'}
                            {stepType === 'extend_right' && '📤 Adding remaining right elements'}
                            {stepType === 'return_merged' && '✅ Returning Merged Result'}
                            {stepType === 'initial' && '🚀 Ready to Start'}
                            {stepType === 'other' && '⚡ Processing...'}
                        </motion.div>

                        {/* Special Animation for Function Call */}
                        {stepType === 'call_function' && (
                            <motion.div
                                className="flex flex-col items-center gap-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* The calling line */}
                                <motion.div
                                    className="flex items-center gap-3 text-lg font-mono"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <span className="text-slate-400">result</span>
                                    <span className="text-slate-500">=</span>
                                    <motion.span
                                        className="text-indigo-400 font-bold"
                                        animate={{
                                            textShadow: ['0 0 0px #818cf8', '0 0 20px #818cf8', '0 0 0px #818cf8']
                                        }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        merge_sort
                                    </motion.span>
                                    <span className="text-slate-400">(</span>
                                    <span className="text-amber-400">arr</span>
                                    <span className="text-slate-400">)</span>
                                </motion.div>

                                {/* The Array with animated "entering function" effect */}
                                <div className="relative flex flex-col items-center gap-4">
                                    {/* Array */}
                                    <motion.div
                                        initial={{ y: 0, scale: 1 }}
                                        animate={{ y: 40, scale: 0.95 }}
                                        transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
                                    >
                                        <ArrayRow
                                            id="function-call-array"
                                            data={mainArray}
                                            state="active"
                                            highlightIndices={[]}
                                        />
                                    </motion.div>

                                    {/* Animated Arrow pointing down */}
                                    <motion.div
                                        className="flex flex-col items-center gap-1"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <motion.div
                                            animate={{ y: [0, 8, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                            className="text-indigo-400 text-2xl"
                                        >
                                            ↓
                                        </motion.div>
                                        <motion.span
                                            className="text-xs text-indigo-300"
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            passing as argument
                                        </motion.span>
                                    </motion.div>

                                    {/* Function Box */}
                                    <motion.div
                                        className="relative mt-4 px-8 py-6 bg-indigo-950/50 border-2 border-indigo-500/50 rounded-2xl"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6, duration: 0.4 }}
                                    >
                                        {/* Glow effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl"
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />

                                        <div className="relative flex flex-col items-center gap-2">
                                            <motion.div
                                                className="text-indigo-300 font-mono text-sm"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.8 }}
                                            >
                                                def merge_sort(arr):
                                            </motion.div>
                                            <motion.div
                                                className="flex items-center gap-2 text-xs text-slate-400"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1 }}
                                            >
                                                <span className="text-amber-400">arr</span>
                                                <span>=</span>
                                                <span className="text-emerald-400">[{mainArray.join(', ')}]</span>
                                            </motion.div>
                                            <motion.div
                                                className="mt-2 text-xs text-indigo-400"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1.2 }}
                                            >
                                                🚀 Entering function...
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}

                        {/* Main Array Display (for non-call_function steps) */}
                        {stepType !== 'call_function' && mainArray.length > 0 && (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs text-slate-500 uppercase">Current Array (arr)</span>
                                <ArrayRow
                                    id="main"
                                    data={mainArray}
                                    state={stepType === 'return_merged' ? 'sorted' : 'active'}
                                    highlightIndices={mid !== undefined ? [mid] : []}
                                />
                                {mid !== undefined && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-xs text-blue-400"
                                    >
                                        mid = {mid}
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Split View: Left and Right Arrays */}
                        {(leftArray || rightArray) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <Connector type="split" />
                                <div className="flex gap-12">
                                    {leftArray && (
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-xs text-slate-500 uppercase">left</span>
                                            <ArrayRow
                                                id="left"
                                                data={leftArray}
                                                state={stepType === 'split_left' ? 'new' : 'default'}
                                                highlightIndices={iPtr !== undefined ? [iPtr] : []}
                                                comparingIndices={stepType === 'compare' ? [iPtr] : []}
                                            />
                                        </div>
                                    )}
                                    {rightArray && (
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-xs text-slate-500 uppercase">right</span>
                                            <ArrayRow
                                                id="right"
                                                data={rightArray}
                                                state={stepType === 'split_right' ? 'new' : 'default'}
                                                highlightIndices={jPtr !== undefined ? [jPtr] : []}
                                                comparingIndices={stepType === 'compare' ? [jPtr] : []}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Sorted Halves Display */}
                        {(leftSorted || rightSorted) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="flex gap-12">
                                    {leftSorted && (
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-xs text-emerald-400 uppercase">left_sorted</span>
                                            <ArrayRow
                                                id="left_sorted"
                                                data={leftSorted}
                                                state="sorted"
                                                highlightIndices={iPtr !== undefined ? [iPtr] : []}
                                                comparingIndices={stepType === 'compare' ? [iPtr] : []}
                                            />
                                        </div>
                                    )}
                                    {rightSorted && (
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-xs text-emerald-400 uppercase">right_sorted</span>
                                            <ArrayRow
                                                id="right_sorted"
                                                data={rightSorted}
                                                state="sorted"
                                                highlightIndices={jPtr !== undefined ? [jPtr] : []}
                                                comparingIndices={stepType === 'compare' ? [jPtr] : []}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Result Array - Being Built */}
                        {resultArray && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-2 mt-4"
                            >
                                <Connector type="merge" />
                                <span className="text-xs text-purple-400 uppercase">result</span>
                                <ArrayRow
                                    id="result"
                                    data={resultArray}
                                    state="merging"
                                />
                            </motion.div>
                        )}

                        {/* Pointer Display */}
                        {(iPtr !== undefined || jPtr !== undefined) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-6 mt-2"
                            >
                                {iPtr !== undefined && (
                                    <span className="text-sm text-blue-400 font-mono bg-blue-500/20 px-3 py-1 rounded-lg">
                                        i = {iPtr}
                                    </span>
                                )}
                                {jPtr !== undefined && (
                                    <span className="text-sm text-amber-400 font-mono bg-amber-500/20 px-3 py-1 rounded-lg">
                                        j = {jPtr}
                                    </span>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls Bar */}
            <div className="px-6 py-4 bg-slate-800 border-t border-slate-700">
                <div className="flex items-center justify-center gap-4">
                    {/* Restart */}
                    <button
                        onClick={handleRestart}
                        className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        title="Restart"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6" />
                            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                        </svg>
                    </button>

                    {/* Previous */}
                    <button
                        onClick={handlePrev}
                        disabled={isAtStart}
                        className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="19,20 9,12 19,4" />
                            <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>

                    {/* Play/Next */}
                    <button
                        onClick={handleNext}
                        disabled={isAtEnd}
                        className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${isAtEnd
                            ? 'bg-emerald-500 text-white cursor-default'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white hover:scale-105'
                            }`}
                    >
                        {isAtEnd ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20,6 9,17 4,12" />
                                </svg>
                                <span>Complete</span>
                            </>
                        ) : currentStepIndex === 0 ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                <span>Start</span>
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,4 15,12 5,20" />
                                    <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <span>Next</span>
                            </>
                        )}
                    </button>

                    {/* Progress Bar */}
                    <div className="flex-1 max-w-xs flex items-center gap-3 ml-4">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <span className="text-sm text-slate-400 font-mono">
                            {currentStepIndex + 1}/{steps.length}
                        </span>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default MergeSortVisualizer;
