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
import { InitResultAnimation, InitPointersAnimation } from './MergeSort/animations';
import LoopConditionAnimation from './MergeSort/animations/LoopConditionAnimation';
import CompareAnimation from './MergeSort/animations/CompareAnimation';
import AppendAnimation from './MergeSort/animations/AppendAnimation';
import IncrementPointerAnimation from './MergeSort/animations/IncrementPointerAnimation';
import ExtendAnimation from './MergeSort/animations/ExtendAnimation';
import ReturnMergedAnimation from './MergeSort/animations/ReturnMergedAnimation';

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
    onPlayPause,
    playbackSpeed = 1500,
    onSpeedChange
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
        if (code.includes('left_sorted') && code.includes('merge_sort')) return 'recurse_left';
        if (code.includes('right_sorted') && code.includes('merge_sort')) return 'recurse_right';
        if (code.includes('merge') && code.includes('left_sorted') && code.includes('right_sorted')) return 'call_merge';
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
    const leftSorted = getArray(currentVars.left_sorted) || getPredictedArray('left_sorted');
    const rightSorted = getArray(currentVars.right_sorted) || getPredictedArray('right_sorted');

    // Flags to distinguish CALL phase from RETURN phase
    // CALL phase: We're on the line "left_sorted = merge_sort(left)" and CALLING into the function
    // RETURN phase: We're on the same line but the recursive call has completed and we're RECEIVING the result
    // 
    // Key insight: Even if leftSorted has a value (from a previous deeper recursion), 
    // if stepType is 'recurse_left', we're at the CALL site, not the RETURN site.
    // We should show return animation only when leftSorted exists AND we're NOT at the call step.
    // Additionally, when we're on 'recurse_right', we should NOT show the left return animation at all.
    // 
    // IMPORTANT: Detect if current step is specifically about right_sorted assignment
    // If so, don't show left return animation (even if leftSorted has a value)
    const codeInvolvesRightSorted = code.includes('right_sorted');
    const codeInvolvesLeftSorted = code.includes('left_sorted') && !code.includes('right_sorted');

    // isLeftReturnPhase: Only true when:
    // - leftSorted exists
    // - We're not at a recursion CALL step
    // - We're not at base case return
    // - We're not at the merge call (which has its own animation)
    // - The current code is NOT about right_sorted (otherwise we'd show both animations)
    const isLeftReturnPhase = leftSorted && leftSorted.length > 0
        && stepType !== 'recurse_left'
        && stepType !== 'recurse_right'
        && stepType !== 'return_base'
        && stepType !== 'call_merge'
        && stepType !== 'return_merged'
        && !codeInvolvesRightSorted;

    // isRightReturnPhase: Only true when:
    // - rightSorted exists  
    // - We're not at a recursion CALL step
    // - We're not at base case return
    // - We're not at the merge call (which has its own animation)
    // - The current code is NOT specifically about left_sorted only
    const isRightReturnPhase = rightSorted && rightSorted.length > 0
        && stepType !== 'recurse_right'
        && stepType !== 'recurse_left'
        && stepType !== 'return_base'
        && stepType !== 'call_merge'
        && stepType !== 'return_merged'
        && !codeInvolvesLeftSorted;

    // Explicit Phase: 'CALL' vs 'RETURN'
    // During RETURN phase, we HIDE the parent frame context to focus solely on the value flow
    const phase = (isLeftReturnPhase || isRightReturnPhase) ? 'RETURN' : 'CALL';

    // Get pointers for comparison highlighting (extract raw values)
    const iPtr = getValue(currentVars.i);
    const jPtr = getValue(currentVars.j);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">

            {/* Main Visualization Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto relative">


                {/* Context Panel - Shows current scope's assigned variables at top-left */}
                {/* Hide during return_base since those values are from a parent scope */}
                {stepType !== 'return_base' && ((leftSorted && leftSorted.length > 0) || (rightSorted && rightSorted.length > 0)) ? (
                    <motion.div
                        className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-3 shadow-lg z-10"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="text-xs text-slate-400 uppercase mb-2 font-medium">Current Scope</div>
                        <div className="flex flex-col gap-2">
                            {/* Show left_sorted if available */}
                            {leftSorted && leftSorted.length > 0 && (
                                <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <span className="text-cyan-400 font-mono text-sm font-bold">left_sorted</span>
                                    <span className="text-slate-500">=</span>
                                    <div className="flex items-center gap-0.5">
                                        {leftSorted.map((val, idx) => (
                                            <motion.div
                                                key={`ctx-left-${idx}`}
                                                className="w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm bg-cyan-600/80 border border-cyan-400/50 text-white"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.15 + idx * 0.05, type: "spring" }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            {/* Show right_sorted if available */}
                            {rightSorted && rightSorted.length > 0 && (
                                <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <span className="text-amber-400 font-mono text-sm font-bold">right_sorted</span>
                                    <span className="text-slate-500">=</span>
                                    <div className="flex items-center gap-0.5">
                                        {rightSorted.map((val, idx) => (
                                            <motion.div
                                                key={`ctx-right-${idx}`}
                                                className="w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm bg-amber-600/80 border border-amber-400/50 text-white"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.25 + idx * 0.05, type: "spring" }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                ) : null}
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

                        {/* Special Animation for Base Case Check */}
                        {stepType === 'check_base' && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Step-by-step expression evaluation */}
                                <div className="flex flex-col items-center gap-4 font-mono text-lg">
                                    {/* Original expression */}
                                    <motion.div
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span className="text-purple-400 font-bold">if</span>
                                        <span className="text-amber-400">len</span>
                                        <span className="text-slate-400">(</span>
                                        <span className="text-blue-400">arr</span>
                                        <span className="text-slate-400">)</span>
                                        <span className="text-slate-500">&lt;=</span>
                                        <span className="text-emerald-400">1</span>
                                        <span className="text-slate-400">:</span>
                                    </motion.div>

                                    {/* Arrow 1 */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="text-slate-500"
                                    >
                                        ↓
                                    </motion.div>

                                    {/* Expanded len with array */}
                                    <motion.div
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 }}
                                    >
                                        <span className="text-purple-400 font-bold">if</span>
                                        <span className="text-amber-400">len</span>
                                        <span className="text-slate-400">(</span>
                                        <motion.span
                                            className="text-emerald-400 text-sm px-2 py-1 bg-emerald-500/10 rounded"
                                            animate={{
                                                boxShadow: ['0 0 0px #10b981', '0 0 15px #10b981', '0 0 0px #10b981']
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            [{mainArray.join(', ')}]
                                        </motion.span>
                                        <span className="text-slate-400">)</span>
                                        <span className="text-slate-500">&lt;=</span>
                                        <span className="text-emerald-400">1</span>
                                    </motion.div>

                                    {/* Arrow 2 */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.4 }}
                                        className="text-slate-500"
                                    >
                                        ↓
                                    </motion.div>

                                    {/* Length computed */}
                                    <motion.div
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1.6 }}
                                    >
                                        <span className="text-purple-400 font-bold">if</span>
                                        <motion.span
                                            className="text-xl font-bold text-cyan-400 px-3 py-1 bg-cyan-500/10 rounded-lg"
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                boxShadow: ['0 0 0px #22d3ee', '0 0 20px #22d3ee', '0 0 0px #22d3ee']
                                            }}
                                            transition={{ duration: 0.5, delay: 1.8 }}
                                        >
                                            {mainArray.length}
                                        </motion.span>
                                        <span className="text-slate-500">&lt;=</span>
                                        <span className="text-emerald-400">1</span>
                                    </motion.div>

                                    {/* Arrow 3 */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2.2 }}
                                        className="text-slate-500"
                                    >
                                        ↓
                                    </motion.div>

                                    {/* Final result */}
                                    <motion.div
                                        className="flex items-center gap-3"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 2.4, type: "spring", stiffness: 200 }}
                                    >
                                        <span className="text-slate-400">{mainArray.length} &lt;= 1</span>
                                        <span className="text-slate-500">=</span>
                                        <motion.span
                                            className={`text-xl font-bold px-4 py-2 rounded-xl ${mainArray.length <= 1
                                                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
                                                : 'text-red-400 bg-red-500/20 border border-red-500/30'
                                                }`}
                                            animate={{
                                                scale: [1, 1.15, 1]
                                            }}
                                            transition={{ delay: 2.6, duration: 0.3 }}
                                        >
                                            {mainArray.length <= 1 ? '✓ True' : '✗ False'}
                                        </motion.span>
                                    </motion.div>

                                    {/* Explanation */}
                                    <motion.div
                                        className="mt-4 text-sm text-slate-400 text-center max-w-md"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 3 }}
                                    >
                                        {mainArray.length <= 1
                                            ? '✅ Base case reached! Array has 0 or 1 elements, so it\'s already sorted.'
                                            : '❌ Not a base case. Array has more than 1 element, continue dividing...'
                                        }
                                    </motion.div>
                                </div>

                                {/* The array below */}
                                <motion.div
                                    className="mt-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs text-slate-500 uppercase">Current Array (arr)</span>
                                        <ArrayRow
                                            id="base-check-array"
                                            data={mainArray}
                                            state="active"
                                            highlightIndices={[]}
                                        />
                                        <span className="text-xs text-cyan-400">length = {mainArray.length}</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Special Animation for Base Case Return: return arr */}
                        {stepType === 'return_base' && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Return statement header */}
                                <motion.div
                                    className="flex items-center gap-2 text-lg font-mono"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <span className="text-purple-400 font-bold">return</span>
                                    <span className="text-amber-400">arr</span>
                                </motion.div>

                                {/* The array being returned */}
                                <motion.div
                                    className="flex flex-col items-center gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <span className="text-xs text-purple-400 uppercase">Returning Value</span>
                                    <motion.div
                                        className="px-6 py-4 bg-purple-950/40 border-2 border-purple-500/50 rounded-xl"
                                        animate={{
                                            boxShadow: ['0 0 0px rgba(168,85,247,0.3)', '0 0 20px rgba(168,85,247,0.5)', '0 0 0px rgba(168,85,247,0.3)']
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <div className="flex items-center gap-1">
                                            {mainArray.map((val, idx) => (
                                                <motion.div
                                                    key={`return-arr-${idx}`}
                                                    className="w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg bg-purple-600 border-2 border-purple-400 text-white"
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.6 + idx * 0.1, type: "spring" }}
                                                >
                                                    {val}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* Upward arrow showing value returning */}
                                <motion.div
                                    className="flex flex-col items-center gap-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <motion.div
                                        animate={{ y: [-5, 5, -5] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-purple-400 text-2xl"
                                    >
                                        ▲
                                    </motion.div>
                                    <motion.span
                                        className="text-xs text-purple-300"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        returning to caller
                                    </motion.span>
                                </motion.div>

                                {/* Explanation */}
                                <motion.div
                                    className="text-sm text-slate-400 text-center max-w-md"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                >
                                    ✅ Base case: Array has {mainArray.length} element{mainArray.length !== 1 ? 's' : ''}, already sorted. Returning as-is.
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Special Animation for Split Left: left = arr[:mid] */}
                        {stepType === 'split_left' && mid !== undefined && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Code expression evaluation */}
                                <div className="flex flex-col items-center gap-3 font-mono">
                                    {/* Original expression */}
                                    <motion.div
                                        className="flex items-center gap-2 text-lg"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span className="text-blue-400 font-bold">left</span>
                                        <span className="text-slate-500">=</span>
                                        <span className="text-amber-400">arr</span>
                                        <span className="text-slate-400">[</span>
                                        <span className="text-slate-400">:</span>
                                        <span className="text-purple-400">mid</span>
                                        <span className="text-slate-400">]</span>
                                    </motion.div>

                                    {/* Arrow */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-slate-500"
                                    >
                                        ↓
                                    </motion.div>

                                    {/* Expanded with mid value */}
                                    <motion.div
                                        className="flex items-center gap-2 text-lg"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.7 }}
                                    >
                                        <span className="text-blue-400 font-bold">left</span>
                                        <span className="text-slate-500">=</span>
                                        <span className="text-amber-400">arr</span>
                                        <span className="text-slate-400">[</span>
                                        <span className="text-emerald-400">0</span>
                                        <span className="text-slate-400">:</span>
                                        <motion.span
                                            className="text-purple-400 font-bold px-2 py-0.5 bg-purple-500/20 rounded"
                                            animate={{
                                                boxShadow: ['0 0 0px #a855f7', '0 0 15px #a855f7', '0 0 0px #a855f7']
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            {mid}
                                        </motion.span>
                                        <span className="text-slate-400">]</span>
                                    </motion.div>
                                </div>

                                {/* Main array with extraction animation */}
                                <motion.div
                                    className="flex flex-col items-center gap-4 mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <span className="text-xs text-slate-500 uppercase">Original Array (arr)</span>

                                    {/* Array with highlighted left portion */}
                                    <div className="flex items-center gap-1">
                                        {mainArray.map((val, idx) => (
                                            <motion.div
                                                key={`main-${idx}`}
                                                className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg border-2 ${idx < mid
                                                    ? 'bg-blue-600 border-blue-400 text-white'
                                                    : 'bg-slate-700 border-slate-600 text-slate-400'
                                                    }`}
                                                initial={{ scale: 1 }}
                                                animate={idx < mid ? {
                                                    scale: [1, 1.1, 1],
                                                    boxShadow: ['0 0 0px #3b82f6', '0 0 20px #3b82f6', '0 0 0px #3b82f6']
                                                } : {}}
                                                transition={{ delay: 1 + idx * 0.1, duration: 0.4 }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Index markers */}
                                    <div className="flex items-center gap-1">
                                        {mainArray.map((_, idx) => (
                                            <div
                                                key={`idx-${idx}`}
                                                className={`w-12 text-center text-xs ${idx < mid ? 'text-blue-400' : 'text-slate-600'
                                                    }`}
                                            >
                                                [{idx}]
                                            </div>
                                        ))}
                                    </div>

                                    {/* Slice indicator */}
                                    <motion.div
                                        className="flex items-center gap-2 text-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.9 }}
                                    >
                                        <span className="text-blue-400">← indices 0 to {mid - 1}</span>
                                        <span className="text-slate-600">|</span>
                                        <span className="text-slate-500">indices {mid} to {mainArray.length - 1} →</span>
                                    </motion.div>
                                </motion.div>

                                {/* Animated extraction arrow */}
                                <motion.div
                                    className="flex flex-col items-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                >
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-blue-400 text-2xl"
                                    >
                                        ↓
                                    </motion.div>
                                    <motion.span
                                        className="text-xs text-blue-300"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        extracting left half
                                    </motion.span>
                                </motion.div>

                                {/* Resulting left array */}
                                <motion.div
                                    className="flex flex-col items-center gap-2"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8, type: "spring", stiffness: 150 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <motion.span
                                            className="text-blue-400 font-bold font-mono"
                                            animate={{
                                                textShadow: ['0 0 0px #60a5fa', '0 0 10px #60a5fa', '0 0 0px #60a5fa']
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            left
                                        </motion.span>
                                        <span className="text-slate-500">=</span>
                                    </div>

                                    {/* Animated elements moving in */}
                                    <div className="flex items-center gap-1">
                                        {mainArray.slice(0, mid).map((val, idx) => (
                                            <motion.div
                                                key={`left-${idx}`}
                                                className="w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg bg-blue-600 border-2 border-blue-400 text-white"
                                                initial={{ opacity: 0, y: -30, scale: 0.5 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{
                                                    delay: 2 + idx * 0.15,
                                                    type: "spring",
                                                    stiffness: 200
                                                }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Result code */}
                                    <motion.div
                                        className="mt-2 font-mono text-sm px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2.5 }}
                                    >
                                        <span className="text-blue-400">left</span>
                                        <span className="text-slate-500"> = </span>
                                        <span className="text-emerald-400">[{mainArray.slice(0, mid).join(', ')}]</span>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Special Animation for Split Right: right = arr[mid:] */}
                        {stepType === 'split_right' && mid !== undefined && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Code expression evaluation */}
                                <div className="flex flex-col items-center gap-3 font-mono">
                                    {/* Original expression */}
                                    <motion.div
                                        className="flex items-center gap-2 text-lg"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span className="text-orange-400 font-bold">right</span>
                                        <span className="text-slate-500">=</span>
                                        <span className="text-amber-400">arr</span>
                                        <span className="text-slate-400">[</span>
                                        <span className="text-purple-400">mid</span>
                                        <span className="text-slate-400">:</span>
                                        <span className="text-slate-400">]</span>
                                    </motion.div>

                                    {/* Arrow */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-slate-500"
                                    >
                                        ↓
                                    </motion.div>

                                    {/* Expanded with mid value */}
                                    <motion.div
                                        className="flex items-center gap-2 text-lg"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.7 }}
                                    >
                                        <span className="text-orange-400 font-bold">right</span>
                                        <span className="text-slate-500">=</span>
                                        <span className="text-amber-400">arr</span>
                                        <span className="text-slate-400">[</span>
                                        <motion.span
                                            className="text-purple-400 font-bold px-2 py-0.5 bg-purple-500/20 rounded"
                                            animate={{
                                                boxShadow: ['0 0 0px #a855f7', '0 0 15px #a855f7', '0 0 0px #a855f7']
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            {mid}
                                        </motion.span>
                                        <span className="text-slate-400">:</span>
                                        <span className="text-emerald-400">{mainArray.length}</span>
                                        <span className="text-slate-400">]</span>
                                    </motion.div>
                                </div>

                                {/* Main array with extraction animation */}
                                <motion.div
                                    className="flex flex-col items-center gap-4 mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <span className="text-xs text-slate-500 uppercase">Original Array (arr)</span>

                                    {/* Array with highlighted right portion */}
                                    <div className="flex items-center gap-1">
                                        {mainArray.map((val, idx) => (
                                            <motion.div
                                                key={`main-${idx}`}
                                                className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg border-2 ${idx >= mid
                                                    ? 'bg-orange-600 border-orange-400 text-white'
                                                    : 'bg-slate-700 border-slate-600 text-slate-400'
                                                    }`}
                                                initial={{ scale: 1 }}
                                                animate={idx >= mid ? {
                                                    scale: [1, 1.1, 1],
                                                    boxShadow: ['0 0 0px #ea580c', '0 0 20px #ea580c', '0 0 0px #ea580c']
                                                } : {}}
                                                transition={{ delay: 1 + (idx - mid) * 0.1, duration: 0.4 }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Index markers */}
                                    <div className="flex items-center gap-1">
                                        {mainArray.map((_, idx) => (
                                            <div
                                                key={`idx-${idx}`}
                                                className={`w-12 text-center text-xs ${idx >= mid ? 'text-orange-400' : 'text-slate-600'
                                                    }`}
                                            >
                                                [{idx}]
                                            </div>
                                        ))}
                                    </div>

                                    {/* Slice indicator */}
                                    <motion.div
                                        className="flex items-center gap-2 text-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.9 }}
                                    >
                                        <span className="text-slate-500">← indices 0 to {mid - 1}</span>
                                        <span className="text-slate-600">|</span>
                                        <span className="text-orange-400">indices {mid} to {mainArray.length - 1} →</span>
                                    </motion.div>
                                </motion.div>

                                {/* Animated extraction arrow */}
                                <motion.div
                                    className="flex flex-col items-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                >
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-orange-400 text-2xl"
                                    >
                                        ↓
                                    </motion.div>
                                    <motion.span
                                        className="text-xs text-orange-300"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        extracting right half
                                    </motion.span>
                                </motion.div>

                                {/* Resulting right array */}
                                <motion.div
                                    className="flex flex-col items-center gap-2"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8, type: "spring", stiffness: 150 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <motion.span
                                            className="text-orange-400 font-bold font-mono"
                                            animate={{
                                                textShadow: ['0 0 0px #fb923c', '0 0 10px #fb923c', '0 0 0px #fb923c']
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            right
                                        </motion.span>
                                        <span className="text-slate-500">=</span>
                                    </div>

                                    {/* Animated elements moving in */}
                                    <div className="flex items-center gap-1">
                                        {mainArray.slice(mid).map((val, idx) => (
                                            <motion.div
                                                key={`right-${idx}`}
                                                className="w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg bg-orange-600 border-2 border-orange-400 text-white"
                                                initial={{ opacity: 0, y: -30, scale: 0.5 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{
                                                    delay: 2 + idx * 0.15,
                                                    type: "spring",
                                                    stiffness: 200
                                                }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Result code */}
                                    <motion.div
                                        className="mt-2 font-mono text-sm px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2.5 }}
                                    >
                                        <span className="text-orange-400">right</span>
                                        <span className="text-slate-500"> = </span>
                                        <span className="text-emerald-400">[{mainArray.slice(mid).join(', ')}]</span>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Special Animation for Recursive Left: left_sorted = merge_sort(left) */}
                        {/* Show when: stepType is recurse_left (CALL phase) OR isLeftReturnPhase is true (RETURN phase) */}
                        {(stepType === 'recurse_left' || isLeftReturnPhase) && (leftArray || leftSorted) && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >


                                {/* CONDITIONAL: Show return animation only when left_sorted is ACTUALLY returned (in currentVars) */}
                                {isLeftReturnPhase && leftSorted && leftSorted.length > 0 ? (
                                    /* Cinematic Return Animation */
                                    <>
                                        {/* Container for the variable we are filling */}
                                        <motion.div
                                            className="flex flex-col items-center gap-2 mb-4"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <span className="text-cyan-400 font-mono text-sm font-bold">left_sorted</span>
                                            <motion.div
                                                className="px-6 py-4 bg-cyan-950/30 border-2 border-dashed border-cyan-500/30 rounded-xl min-w-[120px] flex justify-center items-center"
                                                animate={{
                                                    borderColor: ['rgba(6,182,212,0.3)', 'rgba(6,182,212,0.8)', 'rgba(6,182,212,0.3)'],
                                                    backgroundColor: ['rgba(8,51,68,0.3)', 'rgba(8,51,68,0.5)', 'rgba(8,51,68,0.3)']
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                {/* The final resting place for the array */}
                                                <div className="flex items-center gap-1">
                                                    {leftSorted.map((val, idx) => (
                                                        <motion.div
                                                            key={`final-left-${idx}`}
                                                            className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base bg-cyan-600 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                                            initial={{ opacity: 0, scale: 0, y: 20 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            transition={{ delay: 1.5 + idx * 0.1, type: "spring" }}
                                                        >
                                                            {val}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </motion.div>

                                        {/* Upward Flow Animation */}
                                        <div className="relative flex flex-col items-center h-32 justify-end">
                                            {/* Rising values from recursion */}
                                            <motion.div
                                                className="absolute bottom-0 flex items-center gap-1"
                                                initial={{ y: 60, opacity: 0 }}
                                                animate={{ y: -60, opacity: [0, 1, 1, 0] }} // Move UP into the box
                                                transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                                            >
                                                {leftSorted.map((val, idx) => (
                                                    <div key={`rising-${idx}`} className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base bg-emerald-600 border-2 border-emerald-400 text-white opacity-60 filter blur-[1px]">
                                                        {val}
                                                    </div>
                                                ))}
                                            </motion.div>

                                            {/* Up Arrow Effect */}
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <motion.div
                                                    className="w-0.5 h-full bg-gradient-to-t from-emerald-500/0 via-cyan-500/50 to-cyan-500/0"
                                                />
                                                <motion.div
                                                    className="absolute top-0 text-cyan-400 text-2xl"
                                                    animate={{ y: [-10, 0, -10], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    ▲
                                                </motion.div>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            className="mt-2 text-xs text-emerald-400/80 font-mono"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1 }}
                                        >
                                            Returning sorted sub-array...
                                        </motion.div>
                                    </>
                                ) : leftArray && leftArray.length > 0 ? (
                                    /* Diving In Animation - original behavior */
                                    <>
                                        {/* Code expression header ONLY for diving phase */}
                                        <div className="flex flex-col items-center gap-2 mb-4 font-mono">
                                            <motion.div
                                                className="flex items-center gap-2 text-lg"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <span className="text-cyan-400 font-bold">left_sorted</span>
                                                <span className="text-slate-500">=</span>
                                                <span className="text-indigo-400 font-bold">merge_sort(left)</span>
                                            </motion.div>
                                        </div>
                                        {/* The left array being passed */}
                                        <motion.div
                                            className="flex flex-col items-center gap-4"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <span className="text-xs text-blue-400 uppercase">left array</span>
                                            <motion.div
                                                initial={{ y: 0 }}
                                                animate={{ y: 30 }}
                                                transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {leftArray.map((val, idx) => (
                                                        <motion.div
                                                            key={`left-${idx}`}
                                                            className="w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg bg-blue-600 border-2 border-blue-400 text-white"
                                                            animate={{
                                                                boxShadow: ['0 0 0px #3b82f6', '0 0 15px #3b82f6', '0 0 0px #3b82f6']
                                                            }}
                                                            transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 }}
                                                        >
                                                            {val}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </motion.div>

                                        {/* Animated Arrow */}
                                        <motion.div
                                            className="flex flex-col items-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
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
                                                recursive call
                                            </motion.span>
                                        </motion.div>

                                        {/* Recursive Function Box */}
                                        <motion.div
                                            className="relative px-8 py-6 bg-indigo-950/50 border-2 border-indigo-500/50 rounded-2xl"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1, duration: 0.4 }}
                                        >
                                            <motion.div
                                                className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl"
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            <div className="relative flex flex-col items-center gap-3">
                                                <motion.div
                                                    className="text-indigo-300 font-mono text-sm"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1.2 }}
                                                >
                                                    merge_sort(arr)
                                                </motion.div>
                                                <motion.div
                                                    className="flex items-center gap-2 text-xs text-slate-400"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1.4 }}
                                                >
                                                    <span className="text-amber-400">arr</span>
                                                    <span>=</span>
                                                    <span className="text-emerald-400">[{leftArray.join(', ')}]</span>
                                                </motion.div>
                                                <motion.div
                                                    className="flex items-center gap-2 mt-2 text-sm text-indigo-400"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1.6 }}
                                                >
                                                    <motion.span
                                                        animate={{ rotate: [0, 360] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        🔄
                                                    </motion.span>
                                                    <span>Diving deeper into left half...</span>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    </>
                                ) : null}
                            </motion.div>
                        )}

                        {/* Special Animation for Recursive Right: right_sorted = merge_sort(right) */}
                        {/* Show when: stepType is recurse_right (CALL phase) OR isRightReturnPhase is true (RETURN phase) */}
                        {(stepType === 'recurse_right' || isRightReturnPhase) && (rightArray || rightSorted) && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >


                                {/* CONDITIONAL: Show return animation only when right_sorted is ACTUALLY returned (in currentVars) */}
                                {isRightReturnPhase && rightSorted && rightSorted.length > 0 ? (
                                    /* Cinematic Return Animation */
                                    <>
                                        {/* Container for the variable we are filling */}
                                        <motion.div
                                            className="flex flex-col items-center gap-2 mb-4"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <span className="text-amber-400 font-mono text-sm font-bold">right_sorted</span>
                                            <motion.div
                                                className="px-6 py-4 bg-amber-950/30 border-2 border-dashed border-amber-500/30 rounded-xl min-w-[120px] flex justify-center items-center"
                                                animate={{
                                                    borderColor: ['rgba(251,191,36,0.3)', 'rgba(251,191,36,0.8)', 'rgba(251,191,36,0.3)'],
                                                    backgroundColor: ['rgba(69,26,3,0.3)', 'rgba(69,26,3,0.5)', 'rgba(69,26,3,0.3)']
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                {/* The final resting place for the array */}
                                                <div className="flex items-center gap-1">
                                                    {rightSorted.map((val, idx) => (
                                                        <motion.div
                                                            key={`final-right-${idx}`}
                                                            className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base bg-amber-600 border-2 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                                            initial={{ opacity: 0, scale: 0, y: 20 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            transition={{ delay: 1.5 + idx * 0.1, type: "spring" }}
                                                        >
                                                            {val}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </motion.div>

                                        {/* Upward Flow Animation */}
                                        <div className="relative flex flex-col items-center h-32 justify-end">
                                            {/* Rising values from recursion */}
                                            <motion.div
                                                className="absolute bottom-0 flex items-center gap-1"
                                                initial={{ y: 60, opacity: 0 }}
                                                animate={{ y: -60, opacity: [0, 1, 1, 0] }} // Move UP into the box
                                                transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                                            >
                                                {rightSorted.map((val, idx) => (
                                                    <div key={`rising-${idx}`} className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base bg-emerald-600 border-2 border-emerald-400 text-white opacity-60 filter blur-[1px]">
                                                        {val}
                                                    </div>
                                                ))}
                                            </motion.div>

                                            {/* Up Arrow Effect */}
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <motion.div
                                                    className="w-0.5 h-full bg-gradient-to-t from-emerald-500/0 via-amber-500/50 to-amber-500/0"
                                                />
                                                <motion.div
                                                    className="absolute top-0 text-amber-400 text-2xl"
                                                    animate={{ y: [-10, 0, -10], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    ▲
                                                </motion.div>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            className="mt-2 text-xs text-emerald-400/80 font-mono"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1 }}
                                        >
                                            Returning sorted sub-array...
                                        </motion.div>
                                    </>
                                ) : rightArray && rightArray.length > 0 ? (
                                    /* Diving In Animation - original behavior */
                                    <>
                                        {/* Code expression header ONLY for diving phase */}
                                        <div className="flex flex-col items-center gap-2 mb-4 font-mono">
                                            <motion.div
                                                className="flex items-center gap-2 text-lg"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <span className="text-amber-400 font-bold">right_sorted</span>
                                                <span className="text-slate-500">=</span>
                                                <span className="text-indigo-400 font-bold">merge_sort(right)</span>
                                            </motion.div>
                                        </div>
                                        {/* The right array being passed */}
                                        <motion.div
                                            className="flex flex-col items-center gap-4"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <span className="text-xs text-orange-400 uppercase">right array</span>
                                            <motion.div
                                                initial={{ y: 0 }}
                                                animate={{ y: 30 }}
                                                transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {rightArray.map((val, idx) => (
                                                        <motion.div
                                                            key={`right-${idx}`}
                                                            className="w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg bg-orange-600 border-2 border-orange-400 text-white"
                                                            animate={{
                                                                boxShadow: ['0 0 0px #ea580c', '0 0 15px #ea580c', '0 0 0px #ea580c']
                                                            }}
                                                            transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 }}
                                                        >
                                                            {val}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </motion.div>

                                        {/* Animated Arrow */}
                                        <motion.div
                                            className="flex flex-col items-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
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
                                                recursive call
                                            </motion.span>
                                        </motion.div>

                                        {/* Recursive Function Box */}
                                        <motion.div
                                            className="relative px-8 py-6 bg-indigo-950/50 border-2 border-indigo-500/50 rounded-2xl"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1, duration: 0.4 }}
                                        >
                                            <motion.div
                                                className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl"
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            <div className="relative flex flex-col items-center gap-3">
                                                <motion.div
                                                    className="text-indigo-300 font-mono text-sm"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1.2 }}
                                                >
                                                    merge_sort(arr)
                                                </motion.div>
                                                <motion.div
                                                    className="flex items-center gap-2 text-xs text-slate-400"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1.4 }}
                                                >
                                                    <span className="text-amber-400">arr</span>
                                                    <span>=</span>
                                                    <span className="text-emerald-400">[{rightArray.join(', ')}]</span>
                                                </motion.div>
                                                <motion.div
                                                    className="flex items-center gap-2 mt-2 text-sm text-indigo-400"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1.6 }}
                                                >
                                                    <motion.span
                                                        animate={{ rotate: [0, 360] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        🔄
                                                    </motion.span>
                                                    <span>Diving deeper into right half...</span>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    </>
                                ) : null}
                            </motion.div>
                        )}

                        {/* Special Animation for Call Merge: return merge(left_sorted, right_sorted) */}
                        {stepType === 'call_merge' && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Code expression */}
                                <div className="flex flex-col items-center gap-3 font-mono">
                                    <motion.div
                                        className="flex items-center gap-2 text-lg"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span className="text-purple-400 font-bold">return</span>
                                        <motion.span
                                            className="text-emerald-400 font-bold"
                                            animate={{
                                                textShadow: ['0 0 0px #10b981', '0 0 15px #10b981', '0 0 0px #10b981']
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            merge
                                        </motion.span>
                                        <span className="text-slate-400">(</span>
                                        <span className="text-cyan-400">left_sorted</span>
                                        <span className="text-slate-500">,</span>
                                        <span className="text-amber-400">right_sorted</span>
                                        <span className="text-slate-400">)</span>
                                    </motion.div>
                                </div>

                                {/* Two arrays coming together */}
                                <motion.div
                                    className="flex items-center gap-8"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {/* Left sorted array */}
                                    <motion.div
                                        className="flex flex-col items-center gap-2"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    >
                                        <span className="text-xs text-cyan-400 uppercase">left_sorted</span>
                                        <div className="flex items-center gap-1">
                                            {(leftSorted || leftArray || []).map((val, idx) => (
                                                <motion.div
                                                    key={`left-sorted-${idx}`}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg font-bold bg-cyan-600 border-2 border-cyan-400 text-white"
                                                    animate={{
                                                        boxShadow: ['0 0 0px #06b6d4', '0 0 12px #06b6d4', '0 0 0px #06b6d4']
                                                    }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 }}
                                                >
                                                    {val}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Plus icon */}
                                    <motion.div
                                        className="text-3xl text-emerald-400 font-bold"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.8, type: "spring" }}
                                    >
                                        +
                                    </motion.div>

                                    {/* Right sorted array */}
                                    <motion.div
                                        className="flex flex-col items-center gap-2"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    >
                                        <span className="text-xs text-amber-400 uppercase">right_sorted</span>
                                        <div className="flex items-center gap-1">
                                            {(rightSorted || rightArray || []).map((val, idx) => (
                                                <motion.div
                                                    key={`right-sorted-${idx}`}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg font-bold bg-amber-600 border-2 border-amber-400 text-white"
                                                    animate={{
                                                        boxShadow: ['0 0 0px #d97706', '0 0 12px #d97706', '0 0 0px #d97706']
                                                    }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 }}
                                                >
                                                    {val}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* Animated arrows converging */}
                                <motion.div
                                    className="flex flex-col items-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                >
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-emerald-400 text-2xl"
                                    >
                                        ↓
                                    </motion.div>
                                    <motion.span
                                        className="text-xs text-emerald-300"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        merging sorted halves
                                    </motion.span>
                                </motion.div>

                                {/* Merge Function Box */}
                                <motion.div
                                    className="relative px-8 py-6 bg-emerald-950/50 border-2 border-emerald-500/50 rounded-2xl"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.3, duration: 0.4 }}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl"
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <div className="relative flex flex-col items-center gap-3">
                                        <motion.div
                                            className="text-emerald-300 font-mono text-sm"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.5 }}
                                        >
                                            merge(left, right)
                                        </motion.div>
                                        <motion.div
                                            className="flex items-center gap-4 text-xs"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.7 }}
                                        >
                                            <span className="text-cyan-400">[{(leftSorted || leftArray || []).join(', ')}]</span>
                                            <span className="text-slate-500">+</span>
                                            <span className="text-amber-400">[{(rightSorted || rightArray || []).join(', ')}]</span>
                                        </motion.div>
                                        <motion.div
                                            className="flex items-center gap-2 mt-2 text-sm text-emerald-400"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.9 }}
                                        >
                                            <motion.span
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                🔗
                                            </motion.span>
                                            <span>Combining into sorted result...</span>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Init Result Animation: result = [] */}
                        {stepType === 'init_result' && (
                            <InitResultAnimation
                                leftArray={leftArray || leftSorted}
                                rightArray={rightArray || rightSorted}
                            />
                        )}

                        {/* Init Pointers Animation: i = j = 0 */}
                        {stepType === 'init_pointers' && (
                            <InitPointersAnimation
                                leftArray={leftArray || leftSorted}
                                rightArray={rightArray || rightSorted}
                            />
                        )}

                        {/* Improved Cinematic Loop Condition Animation */
                            stepType === 'compare_loop' && (
                                <LoopConditionAnimation
                                    i={iPtr}
                                    j={jPtr}
                                    leftLen={leftArray?.length || 0}
                                    rightLen={rightArray?.length || 0}
                                />
                            )}

                        {/* Cinematic Comparison Animation */}
                        {stepType === 'compare' && (
                            <CompareAnimation
                                leftVal={leftArray ? leftArray[iPtr] : 0}
                                rightVal={rightArray ? rightArray[jPtr] : 0}
                                i={iPtr}
                                j={jPtr}
                            />
                        )}

                        {/* Direct Append Animation (replacing fallback) */}
                        {(stepType === 'append_left' || stepType === 'append_right') && (
                            <AppendAnimation
                                value={stepType === 'append_left' ? (leftArray ? leftArray[iPtr] : 0) : (rightArray ? rightArray[jPtr] : 0)}
                                source={stepType === 'append_left' ? 'left' : 'right'}
                                currentResult={resultArray}
                            />
                        )}

                        {/* Increment Pointer Animation */}
                        {(stepType === 'inc_i' || stepType === 'inc_j') && (
                            <IncrementPointerAnimation
                                pointerName={stepType === 'inc_i' ? 'i' : 'j'}
                                oldValue={stepType === 'inc_i' ? iPtr : jPtr}
                                newValue={(stepType === 'inc_i' ? iPtr : jPtr) + 1}
                            />
                        )}

                        {/* Extend Animation for remaining elements */}
                        {(stepType === 'extend_left' || stepType === 'extend_right') && (
                            <ExtendAnimation
                                values={stepType === 'extend_left'
                                    ? (leftArray ? leftArray.slice(iPtr) : [])
                                    : (rightArray ? rightArray.slice(jPtr) : [])}
                                source={stepType === 'extend_left' ? 'left' : 'right'}
                                currentResult={resultArray}
                            />
                        )}

                        {/* Return Merged Result Animation */}
                        {stepType === 'return_merged' && (
                            <ReturnMergedAnimation
                                result={resultArray}
                            />
                        )}

                        {/* Main Array Display (for standard steps) - ONLY VISIBLE IN CALL PHASE */}
                        {phase === 'CALL' && stepType !== 'call_function' && stepType !== 'check_base' && stepType !== 'split_left' && stepType !== 'split_right' && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'call_merge' && stepType !== 'init_result' && stepType !== 'init_pointers' && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && mainArray.length > 0 && (
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

                        {/* Split View: Left and Right Arrays (hide during special animations and return phases) - ONLY VISIBLE IN CALL PHASE */}
                        {phase === 'CALL' && stepType !== 'split_left' && stepType !== 'split_right' && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'call_merge' && stepType !== 'init_result' && stepType !== 'init_pointers' && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && (leftArray || rightArray) && (
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

                        {/* Sorted Halves Display - hide during return phases where animation shows it */}
                        {/* Also hide when any return animation is showing (isLeftReturnPhase or isRightReturnPhase) */}
                        {(leftSorted || rightSorted) && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'return_base' && !isLeftReturnPhase && !isRightReturnPhase && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && (
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
                        {resultArray && stepType !== 'init_result' && stepType !== 'init_pointers' && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && (
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
                        {(iPtr !== undefined || jPtr !== undefined) && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && (
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
            <div className="px-6 py-3 bg-slate-800 border-t border-slate-700">
                {/* Top row: main playback controls + progress */}
                <div className="flex items-center justify-center gap-3">
                    {/* Restart */}
                    <button
                        onClick={handleRestart}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        title="Restart"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6" />
                            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                        </svg>
                    </button>

                    {/* Previous */}
                    <button
                        onClick={handlePrev}
                        disabled={isAtStart}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous step"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="19,20 9,12 19,4" />
                            <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>

                    {/* ▶/⏸ Auto-play toggle (addon icon button) */}
                    <button
                        onClick={onPlayPause}
                        disabled={isAtEnd}
                        className={`p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isPlaying
                            ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30'
                            : 'bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white'
                            }`}
                        title={isPlaying ? 'Pause auto-play (Space)' : 'Auto-play all steps (Space)'}
                    >
                        {isPlaying ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Next (original big button — unchanged) */}
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

                    {/* Progress */}
                    <div className="flex-1 max-w-xs flex items-center gap-3 ml-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <span className="text-sm text-slate-400 font-mono whitespace-nowrap">
                            {currentStepIndex + 1}/{steps.length}
                        </span>
                    </div>
                </div>

                {/* Bottom row: Speed control */}
                <div className="flex items-center justify-center gap-3 mt-2.5">
                    <span className="text-xs text-slate-500 font-medium">Speed</span>
                    <span className="text-xs text-slate-400">🐢</span>
                    <input
                        type="range"
                        min={800}
                        max={8000}
                        step={100}
                        value={8800 - playbackSpeed}  // invert so right = faster
                        onChange={e => onSpeedChange?.(8800 - Number(e.target.value))}
                        className="w-36 h-1.5 appearance-none rounded-full cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((8800 - playbackSpeed - 800) / 7200) * 100
                                }%, #334155 ${((8800 - playbackSpeed - 800) / 7200) * 100
                                }%, #334155 100%)`
                        }}
                        title="Drag to change playback speed"
                    />
                    <span className="text-xs text-slate-400">🐇</span>
                    <span className="text-xs font-mono text-indigo-400 w-12 text-center">
                        {playbackSpeed <= 900 ? '4×'
                            : playbackSpeed <= 1400 ? '2×'
                                : playbackSpeed <= 2000 ? '1.5×'
                                    : playbackSpeed <= 3500 ? '1×'
                                        : playbackSpeed <= 5000 ? '0.7×'
                                            : playbackSpeed <= 6500 ? '0.5×'
                                                : '0.3×'}
                    </span>
                </div>
            </div>
        </div >
    );
};

export default MergeSortVisualizer;
