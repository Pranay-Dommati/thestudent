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

// ============ REUSABLE CALL ANIMATION COMPONENT ============
// Used by call_function, recurse_left, and recurse_right steps.
/**
 * FunctionCallAnimation — generic reusable call animation.
 *
 * Props:
 *   keyword          string?         — if set (e.g. "return"), renders that keyword instead of resultVar =
 *   resultVar        string          — receiving variable, e.g. "left_sorted"
 *   resultVarClass   string          — Tailwind color for that token
 *   fnName           string          — function name, e.g. "merge_sort" | "merge"
 *   fnNameClass      string          — Tailwind color for fn name in caller line
 *   fnGlowColor      string          — hex color for animated glow on fn name
 *   args             Array<{         — one entry per argument
 *                      name,         —   variable name, e.g. "left"
 *                      nameClass,    —   Tailwind color for that token
 *                      array,        —   array of values to render as chips
 *                      chipClass     —   Tailwind classes for each chip
 *                    }>
 *   defParams        Array<{ name, nameClass }> — parameter list in def line
 *   gradientId       string          — unique SVG linearGradient id
 *   gradientFrom     string          — hex start color for arrow gradient
 *   gradientTo       string          — hex end color for arrow gradient
 *   arrowColor       string          — hex color for arrowhead stroke
 *   boxBg            string          — Tailwind bg class for def box
 *   boxBorder        string          — Tailwind border class for def box
 *   boxGlowBg        string          — Tailwind bg class for def box glow blur
 *   defFnNameClass   string          — Tailwind color for fn name in def box
 *   sideLabelFnClass string          — Tailwind color for fn name in side label
 */
const FunctionCallAnimation = ({
    keyword,
    resultVar,
    resultVarClass,
    fnName,
    fnNameClass,
    fnGlowColor,
    args = [],
    defParams = [],
    gradientId,
    gradientFrom,
    gradientTo,
    arrowColor,
    boxBg,
    boxBorder,
    boxGlowBg,
    defFnNameClass,
    sideLabelFnClass,
}) => (
    <motion.div
        className="relative w-full flex flex-col items-center gap-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
    >
        {/* Line 1: resultVar = fnName( arg1, arg2, ... ) */}
        <motion.div
            className="font-mono text-base flex items-center gap-1.5 flex-wrap justify-center"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
            {keyword
                ? <span className="text-purple-400 font-bold">{keyword}</span>
                : <><span className={resultVarClass}>{resultVar}</span><span className="text-slate-500"> = </span></>}
            <motion.span className={`font-bold ${fnNameClass}`}
                animate={{ textShadow: [`0 0 3px ${fnGlowColor}`, `0 0 16px ${fnGlowColor}`, `0 0 3px ${fnGlowColor}`] }}
                transition={{ duration: 1.8, repeat: Infinity }}
            >{fnName}</motion.span>
            <span className="text-slate-400">(</span>
            {args.map(({ name, nameClass }, idx) => (
                <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-slate-500">,</span>}
                    <span className={nameClass}>{name}</span>
                </span>
            ))}
            <span className="text-slate-400">)</span>
        </motion.div>

        {/* Middle: arrow pinned to center, label + chips to its right */}
        <div className="relative w-full flex items-center justify-center" style={{ height: 80 }}>
            {/* Arrow — absolutely centered so it sits directly under fnName() */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0">
                <svg width="20" height="80" viewBox="0 0 20 80" fill="none">
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradientFrom}/>
                            <stop offset="100%" stopColor={gradientTo}/>
                        </linearGradient>
                    </defs>
                    <motion.line x1="10" y1="2" x2="10" y2="66" stroke={gradientFrom} strokeWidth="5" strokeLinecap="round" opacity={0.12}
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: 'top' }}
                        transition={{ delay: 0.3, duration: 0.4 }}/>
                    <motion.line x1="10" y1="2" x2="10" y2="66" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round"
                        initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} style={{ transformOrigin: 'top' }}
                        transition={{ delay: 0.3, duration: 0.4 }}/>
                    <motion.path d="M 10 66 L 4 54 M 10 66 L 16 54" stroke={arrowColor} strokeWidth="1.5" strokeLinecap="round"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.68, duration: 0.15 }}/>
                </svg>
            </div>

            {/* Label + one row per arg — to the right of the arrow */}
            <motion.div
                className="absolute flex flex-col gap-1.5"
                style={{ left: 'calc(50% + 20px)' }}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38, duration: 0.28 }}
            >
                <span className="text-sm text-slate-400/80 font-mono whitespace-nowrap">
                    calling <span className={sideLabelFnClass}>{fnName}</span> by passing
                </span>
                {args.map(({ name, nameClass, array, chipClass }, argIdx) => (
                    <div key={argIdx} className="flex flex-wrap gap-2 items-center">
                        <span className={`text-sm font-mono font-semibold ${nameClass}`}>{name} =</span>
                        {array.map((val, idx) => (
                            <motion.span key={idx}
                                className={`px-3 py-1 rounded border text-sm font-mono font-semibold ${chipClass}`}
                                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.45 + argIdx * 0.12 + idx * 0.05, duration: 0.18, ease: 'backOut' }}
                            >{val}</motion.span>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>

        {/* Box: def fnName( param1, param2, ... ): ... */}
        <motion.div
            className={`px-5 py-4 ${boxBg} ${boxBorder} rounded-xl backdrop-blur-sm shadow-xl`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
            <motion.div className={`absolute -inset-3 ${boxGlowBg} rounded-2xl blur-xl pointer-events-none`}
                animate={{ opacity: [0.3, 0.65, 0.3] }} transition={{ duration: 3, repeat: Infinity }}/>
            <div className="relative flex flex-col gap-1 font-mono text-base">
                <div className="flex items-center gap-1">
                    <span className="text-purple-400 font-bold">def </span>
                    <motion.span className={`font-bold ${defFnNameClass}`}
                        animate={{ textShadow: [`0 0 3px ${fnGlowColor}`, `0 0 14px ${fnGlowColor}`, `0 0 3px ${fnGlowColor}`] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                    >{fnName}</motion.span>
                    <span className="text-slate-400">(</span>
                    {defParams.map(({ name, nameClass }, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                            {idx > 0 && <span className="text-slate-500">,</span>}
                            <span className={nameClass}>{name}</span>
                        </span>
                    ))}
                    <span className="text-slate-400">):</span>
                </div>
                <motion.div className="pl-6 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.22 }}>
                    <motion.span className="text-slate-500" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }}>...</motion.span>
                </motion.div>
                <motion.div className="pl-6 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.22 }}>
                    <motion.span className="text-slate-500" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}>...</motion.span>
                </motion.div>
            </div>
        </motion.div>
    </motion.div>
);

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

                        {/* Fast Animation for Init Array */}
                        {stepType === 'init_array' && (
                            <motion.div
                                className="flex flex-col items-center gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Current Array (arr)</span>
                                <div className="flex gap-1">
                                    {mainArray.map((val, idx) => (
                                        <motion.div
                                            key={`init-${idx}`}
                                            className="w-12 h-12 flex items-center justify-center font-mono font-bold text-lg rounded-xl border-2 bg-indigo-500 border-indigo-300 text-white shadow-lg shadow-indigo-500/30"
                                            initial={{ opacity: 0, y: -12, scale: 0.8 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.18, delay: idx * 0.03, ease: 'easeOut' }}
                                        >
                                            {val}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Special Animation for Function Call */}
                        {stepType === 'call_function' && (
                            <FunctionCallAnimation
                                resultVar="result"
                                resultVarClass="text-slate-300"
                                fnName="merge_sort"
                                fnNameClass="text-indigo-400"
                                fnGlowColor="#818cf8"
                                args={[{ name: 'arr', nameClass: 'text-amber-400 font-semibold', array: mainArray, chipClass: 'bg-amber-500/15 border-amber-500/35 text-amber-300' }]}
                                defParams={[{ name: 'arr', nameClass: 'text-amber-400' }]}
                                gradientId="ag-main"
                                gradientFrom="#6366f1"
                                gradientTo="#a5b4fc"
                                arrowColor="#a5b4fc"
                                boxBg="bg-indigo-950/60"
                                boxBorder="border border-indigo-500/35"
                                boxGlowBg="bg-indigo-500/8"
                                defFnNameClass="text-indigo-300"
                                sideLabelFnClass="text-indigo-400 font-semibold"
                            />
                        )}

                        {/* Special Animation for Base Case Check */}
                        {stepType === 'check_base' && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {/* Line 1: if len( [chips] ) <= 1 : */}
                                <motion.div
                                    className="font-mono text-base flex items-center flex-wrap gap-1.5 justify-center"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.25 }}
                                >
                                    <span className="text-purple-400 font-bold">if</span>
                                    <span className="text-amber-400 font-semibold">len</span>
                                    <span className="text-slate-500">(</span>
                                    {mainArray.map((val, idx) => (
                                        <motion.span
                                            key={idx}
                                            className="px-2 py-0.5 bg-slate-700/80 border border-slate-600 rounded text-slate-200 text-sm font-mono"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.15 + idx * 0.05, duration: 0.18, ease: 'backOut' }}
                                        >
                                            {val}
                                        </motion.span>
                                    ))}
                                    <span className="text-slate-500">)</span>
                                    <span className="text-slate-400">&lt;=</span>
                                    <span className="text-emerald-400 font-bold">1</span>
                                    <span className="text-slate-500">:</span>
                                </motion.div>

                                {/* Line 2: if 2 <= 1 : True/False */}
                                <motion.div
                                    className="font-mono text-base flex items-center flex-wrap gap-1.5 justify-center"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35, duration: 0.22 }}
                                >
                                    <span className="text-purple-400 font-bold">if</span>
                                    <motion.span
                                        className="text-cyan-400 font-bold px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
                                        animate={{ boxShadow: ['0 0 0px #22d3ee', '0 0 10px #22d3ee44', '0 0 0px #22d3ee'] }}
                                        transition={{ delay: 0.5, duration: 1.6, repeat: Infinity }}
                                    >
                                        {mainArray.length}
                                    </motion.span>
                                    <span className="text-slate-400">&lt;=</span>
                                    <span className="text-emerald-400 font-bold">1</span>
                                    <span className="text-slate-500">:</span>
                                    <motion.span
                                        className={`font-bold text-base px-4 py-1 rounded-xl border ${
                                            mainArray.length <= 1
                                                ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                                                : 'text-red-400 bg-red-500/15 border-red-500/30'
                                        }`}
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.55, type: 'spring', stiffness: 280, damping: 18 }}
                                    >
                                        {mainArray.length <= 1 ? 'True' : 'False'}
                                    </motion.span>
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
                                    <span className="text-xs text-purple-400/70 font-mono">returning <span className="text-amber-400">arr</span></span>
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

                            </motion.div>
                        )}

                        {/* Special Animation for Split Left: left = arr[:mid] */}
                        {stepType === 'split_left' && mid !== undefined && (
                            <motion.div
                                className="flex flex-col items-center gap-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22 }}
                            >
                                {/* Expression */}
                                <motion.div
                                    className="font-mono text-sm flex items-center gap-1"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.2 }}
                                >
                                    <span className="text-blue-400 font-bold">left</span>
                                    <span className="text-slate-500 mx-1">=</span>
                                    <span className="text-amber-400">arr</span>
                                    <span className="text-slate-500">[:</span>
                                    <span className="text-cyan-400 font-bold">{mid}</span>
                                    <span className="text-slate-500">]</span>
                                </motion.div>

                                {/* Full array with index row */}
                                <motion.div
                                    className="flex flex-col items-center gap-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.18, duration: 0.2 }}
                                >
                                    <div className="flex gap-1">
                                        {mainArray.map((val, idx) => (
                                            <div
                                                key={`sl-${idx}`}
                                                className={`w-12 h-12 flex items-center justify-center font-mono font-bold text-lg rounded-xl border-2 ${
                                                    idx < mid
                                                        ? 'bg-blue-600 border-blue-400 text-white'
                                                        : 'bg-slate-700/60 border-slate-600/50 text-slate-400'
                                                }`}
                                            >
                                                {val}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        {mainArray.map((_, idx) => (
                                            <div
                                                key={`sl-i-${idx}`}
                                                className={`w-12 text-center font-mono text-xs ${
                                                    idx < mid ? 'text-blue-400 font-semibold' : 'text-slate-600'
                                                }`}
                                            >
                                                {idx}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Result */}
                                <motion.div
                                    className="flex items-center gap-2 font-mono text-sm"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.2 }}
                                >
                                    <span className="text-blue-400 font-bold">left</span>
                                    <span className="text-slate-500">=</span>
                                    <div className="flex gap-1">
                                        {mainArray.slice(0, mid).map((val, idx) => (
                                            <motion.div
                                                key={`lr-${idx}`}
                                                className="w-10 h-10 flex items-center justify-center font-mono font-bold text-base rounded-lg border-2 bg-blue-600 border-blue-400 text-white"
                                                initial={{ opacity: 0, scale: 0.7 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.32 + idx * 0.04, duration: 0.18, ease: 'backOut' }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Special Animation for Split Right: right = arr[mid:] */}
                        {stepType === 'split_right' && mid !== undefined && (
                            <motion.div
                                className="flex flex-col items-center gap-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22 }}
                            >
                                {/* Expression */}
                                <motion.div
                                    className="font-mono text-sm flex items-center gap-1"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.2 }}
                                >
                                    <span className="text-orange-400 font-bold">right</span>
                                    <span className="text-slate-500 mx-1">=</span>
                                    <span className="text-amber-400">arr</span>
                                    <span className="text-slate-500">[</span>
                                    <span className="text-cyan-400 font-bold">{mid}</span>
                                    <span className="text-slate-500">:]</span>
                                </motion.div>

                                {/* Full array with index row */}
                                <motion.div
                                    className="flex flex-col items-center gap-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.18, duration: 0.2 }}
                                >
                                    <div className="flex gap-1">
                                        {mainArray.map((val, idx) => (
                                            <div
                                                key={`sr-${idx}`}
                                                className={`w-12 h-12 flex items-center justify-center font-mono font-bold text-lg rounded-xl border-2 ${
                                                    idx >= mid
                                                        ? 'bg-orange-600 border-orange-400 text-white'
                                                        : 'bg-slate-700/60 border-slate-600/50 text-slate-400'
                                                }`}
                                            >
                                                {val}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        {mainArray.map((_, idx) => (
                                            <div
                                                key={`sr-i-${idx}`}
                                                className={`w-12 text-center font-mono text-xs ${
                                                    idx >= mid ? 'text-orange-400 font-semibold' : 'text-slate-600'
                                                }`}
                                            >
                                                {idx}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Result */}
                                <motion.div
                                    className="flex items-center gap-2 font-mono text-sm"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.2 }}
                                >
                                    <span className="text-orange-400 font-bold">right</span>
                                    <span className="text-slate-500">=</span>
                                    <div className="flex gap-1">
                                        {mainArray.slice(mid).map((val, idx) => (
                                            <motion.div
                                                key={`rr-${idx}`}
                                                className="w-10 h-10 flex items-center justify-center font-mono font-bold text-base rounded-lg border-2 bg-orange-600 border-orange-400 text-white"
                                                initial={{ opacity: 0, scale: 0.7 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.32 + idx * 0.04, duration: 0.18, ease: 'backOut' }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>
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
                                            transition={{ delay: 0.1 }}
                                        >
                                            <span className="text-cyan-400 font-mono text-sm font-bold">left_sorted</span>
                                            <motion.div
                                                className="px-6 py-4 bg-cyan-950/30 border-2 border-dashed border-cyan-500/30 rounded-xl min-w-[120px] flex justify-center items-center"
                                                animate={{
                                                    borderColor: ['rgba(6,182,212,0.3)', 'rgba(6,182,212,0.8)', 'rgba(6,182,212,0.3)'],
                                                    backgroundColor: ['rgba(8,51,68,0.3)', 'rgba(8,51,68,0.5)', 'rgba(8,51,68,0.3)']
                                                }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                {/* The final resting place for the array */}
                                                <div className="flex items-center gap-1">
                                                    {leftSorted.map((val, idx) => (
                                                        <motion.div
                                                            key={`final-left-${idx}`}
                                                            className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base bg-cyan-600 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                                            initial={{ opacity: 0, scale: 0, y: 20 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            transition={{ delay: 0.5 + idx * 0.05, type: "spring", stiffness: 300, damping: 20 }}
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
                                                animate={{ y: -60, opacity: [0, 1, 1, 0] }}
                                                transition={{ duration: 0.65, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
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
                                                transition={{ delay: 0.2 }}
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
                                            transition={{ delay: 0.3 }}
                                        >
                                            Returning sorted sub-array...
                                        </motion.div>
                                    </>
                                ) : leftArray && leftArray.length > 0 ? (
                                    <FunctionCallAnimation
                                        resultVar="left_sorted"
                                        resultVarClass="text-cyan-400 font-bold"
                                        fnName="merge_sort"
                                        fnNameClass="text-indigo-400"
                                        fnGlowColor="#818cf8"
                                        args={[{ name: 'left', nameClass: 'text-blue-400 font-semibold', array: leftArray, chipClass: 'bg-blue-500/15 border-blue-500/35 text-blue-300' }]}
                                        defParams={[{ name: 'arr', nameClass: 'text-amber-400' }]}
                                        gradientId="ag-left"
                                        gradientFrom="#6366f1"
                                        gradientTo="#a5b4fc"
                                        arrowColor="#a5b4fc"
                                        boxBg="bg-indigo-950/60"
                                        boxBorder="border border-indigo-500/35"
                                        boxGlowBg="bg-indigo-500/8"
                                        defFnNameClass="text-indigo-300"
                                        sideLabelFnClass="text-indigo-400 font-semibold"
                                    />
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
                                            transition={{ delay: 0.1 }}
                                        >
                                            <span className="text-amber-400 font-mono text-sm font-bold">right_sorted</span>
                                            <motion.div
                                                className="px-6 py-4 bg-amber-950/30 border-2 border-dashed border-amber-500/30 rounded-xl min-w-[120px] flex justify-center items-center"
                                                animate={{
                                                    borderColor: ['rgba(251,191,36,0.3)', 'rgba(251,191,36,0.8)', 'rgba(251,191,36,0.3)'],
                                                    backgroundColor: ['rgba(69,26,3,0.3)', 'rgba(69,26,3,0.5)', 'rgba(69,26,3,0.3)']
                                                }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                {/* The final resting place for the array */}
                                                <div className="flex items-center gap-1">
                                                    {rightSorted.map((val, idx) => (
                                                        <motion.div
                                                            key={`final-right-${idx}`}
                                                            className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base bg-amber-600 border-2 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                                            initial={{ opacity: 0, scale: 0, y: 20 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            transition={{ delay: 0.5 + idx * 0.05, type: "spring", stiffness: 300, damping: 20 }}
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
                                                animate={{ y: -60, opacity: [0, 1, 1, 0] }}
                                                transition={{ duration: 0.65, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
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
                                                transition={{ delay: 0.2 }}
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
                                            transition={{ delay: 0.3 }}
                                        >
                                            Returning sorted sub-array...
                                        </motion.div>
                                    </>
                                ) : rightArray && rightArray.length > 0 ? (
                                    <FunctionCallAnimation
                                        resultVar="right_sorted"
                                        resultVarClass="text-amber-400 font-bold"
                                        fnName="merge_sort"
                                        fnNameClass="text-indigo-400"
                                        fnGlowColor="#818cf8"
                                        args={[{ name: 'right', nameClass: 'text-orange-400 font-semibold', array: rightArray, chipClass: 'bg-orange-500/15 border-orange-500/35 text-orange-300' }]}
                                        defParams={[{ name: 'arr', nameClass: 'text-amber-400' }]}
                                        gradientId="ag-right"
                                        gradientFrom="#6366f1"
                                        gradientTo="#a5b4fc"
                                        arrowColor="#a5b4fc"
                                        boxBg="bg-indigo-950/60"
                                        boxBorder="border border-indigo-500/35"
                                        boxGlowBg="bg-indigo-500/8"
                                        defFnNameClass="text-indigo-300"
                                        sideLabelFnClass="text-indigo-400 font-semibold"
                                    />
                                ) : null}
                            </motion.div>
                        )}

                        {/* Special Animation for Call Merge: result = merge(left_sorted, right_sorted) */}
                        {stepType === 'call_merge' && (
                            <FunctionCallAnimation
                                keyword="return"
                                fnName="merge"
                                fnNameClass="text-emerald-400"
                                fnGlowColor="#10b981"
                                args={[
                                    { name: 'left_sorted',  nameClass: 'text-cyan-400 font-semibold',   array: leftSorted  || leftArray  || [], chipClass: 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300' },
                                    { name: 'right_sorted', nameClass: 'text-orange-400 font-semibold', array: rightSorted || rightArray || [], chipClass: 'bg-orange-500/15 border-orange-500/35 text-orange-300' },
                                ]}
                                defParams={[
                                    { name: 'left',  nameClass: 'text-cyan-400' },
                                    { name: 'right', nameClass: 'text-orange-400' },
                                ]}
                                gradientId="ag-merge"
                                gradientFrom="#10b981"
                                gradientTo="#6ee7b7"
                                arrowColor="#6ee7b7"
                                boxBg="bg-emerald-950/60"
                                boxBorder="border border-emerald-500/35"
                                boxGlowBg="bg-emerald-500/8"
                                defFnNameClass="text-emerald-300"
                                sideLabelFnClass="text-emerald-400 font-semibold"
                            />
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

                        {/* Fast Animation for Compute Mid */}
                        {stepType === 'compute_mid' && (
                            <motion.div
                                className="flex flex-col items-center gap-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22 }}
                            >
                                {/* Array with index labels */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex gap-1">
                                        {mainArray.map((val, idx) => (
                                            <motion.div
                                                key={`mid-arr-${idx}`}
                                                className={`w-12 h-12 flex items-center justify-center font-mono font-bold text-lg rounded-xl border-2 ${
                                                    idx === mid
                                                        ? 'bg-emerald-500 border-emerald-300 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300'
                                                        : 'bg-indigo-500 border-indigo-300 text-white'
                                                }`}
                                                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                                                animate={{ opacity: 1, y: 0, scale: idx === mid ? 1.1 : 1 }}
                                                transition={{ duration: 0.18, delay: idx * 0.03, ease: 'easeOut' }}
                                            >
                                                {val}
                                            </motion.div>
                                        ))}
                                    </div>
                                    {/* Index numbers */}
                                    <div className="flex gap-1">
                                        {mainArray.map((_, idx) => (
                                            <motion.div
                                                key={`mid-idx-${idx}`}
                                                className={`w-12 text-center font-mono text-xs ${idx === mid ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.15, delay: 0.2 + idx * 0.03 }}
                                            >
                                                {idx}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                                {/* mid = N */}
                                <motion.div
                                    className="flex items-center gap-2 font-mono text-sm"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.2 }}
                                >
                                    <span className="text-blue-400 font-semibold">mid</span>
                                    <span className="text-slate-500">=</span>
                                    <motion.span
                                        className="text-cyan-400 font-bold text-base px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/25 rounded-lg"
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.38, type: 'spring', stiffness: 280, damping: 18 }}
                                    >
                                        {mid}
                                    </motion.span>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Main Array Display (for standard steps) - ONLY VISIBLE IN CALL PHASE */}
                        {phase === 'CALL' && stepType !== 'init_array' && stepType !== 'compute_mid' && stepType !== 'call_function' && stepType !== 'check_base' && stepType !== 'return_base' && stepType !== 'split_left' && stepType !== 'split_right' && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'call_merge' && stepType !== 'init_result' && stepType !== 'init_pointers' && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && mainArray.length > 0 && (
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
                        {(leftSorted || rightSorted) && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'call_merge' && stepType !== 'return_base' && !isLeftReturnPhase && !isRightReturnPhase && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && (
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
