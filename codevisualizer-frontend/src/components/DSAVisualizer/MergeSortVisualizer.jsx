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

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
// Used by call_function, recurse_left, recurse_right, and call_merge steps.
// Animation: vibrate call line → curvy arrow from parenthesis down-right to def box → box knocked twice.
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
}) => {
    // Flatten all arg chips for the traveling animation
    const allChips = args.flatMap(({ array, chipClass }) =>
        array.map((val) => ({ val, chipClass }))
    );

    return (
        <motion.div
            className="relative w-full flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Line 1: resultVar = fnName( arg1, arg2, ... ) — vibrates */}
            <motion.div
                className="font-mono text-base flex items-center gap-1.5 flex-wrap justify-center"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
                {keyword
                    ? <span className="text-purple-400 font-bold">{keyword}</span>
                    : <><span className={resultVarClass}>{resultVar}</span><span className="text-slate-500"> = </span></>}
                <motion.span
                    className={`font-bold ${fnNameClass}`}
                    animate={{
                        x: [0, -3, 3, -3, 3, -2, 2, -1, 1, 0, 0],
                        textShadow: [`0 0 3px ${fnGlowColor}`, `0 0 18px ${fnGlowColor}`, `0 0 3px ${fnGlowColor}`]
                    }}
                    transition={{
                        x: { delay: 0.4, duration: 0.5, ease: "easeInOut" },
                        textShadow: { duration: 1.6, repeat: Infinity }
                    }}
                >{fnName}</motion.span>
                <motion.span className="text-slate-400"
                    animate={{ x: [0, -2, 2, -2, 2, -1, 1, 0, 0] }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >(</motion.span>
                {args.map(({ name, nameClass }, idx) => (
                    <motion.span key={idx} className="flex items-center gap-1"
                        animate={{ x: [0, -2, 2, -2, 2, -1, 1, 0, 0] }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        {idx > 0 && <span className="text-slate-500">,</span>}
                        <span className={nameClass}>{name}</span>
                    </motion.span>
                ))}
                <motion.span className="text-slate-400"
                    animate={{ x: [0, -2, 2, -2, 2, -1, 1, 0, 0] }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >)</motion.span>
            </motion.div>

            {/* Curvy arrow from call parenthesis down to def box, with box on the right */}
            <div className="relative w-full flex justify-end pr-4" style={{ minHeight: 200 }}>

                {/* SVG arrow — starts from center-top (under the parenthesis), curves right-down to the box */}
                <svg
                    className="absolute left-0 top-0 w-full h-full pointer-events-none"
                    viewBox="0 0 600 200"
                    preserveAspectRatio="none"
                    fill="none"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={gradientFrom} />
                            <stop offset="100%" stopColor={gradientTo} />
                        </linearGradient>
                    </defs>
                    {/* Glow behind the curve */}
                    <motion.path
                        d="M 300 5 C 300 60, 380 130, 470 100"
                        stroke={gradientFrom} strokeWidth="6" strokeLinecap="round" fill="none" opacity={0.1}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.0, duration: 0.5, ease: "easeInOut" }}
                    />
                    {/* Main curvy stroke */}
                    <motion.path
                        d="M 300 5 C 300 60, 380 130, 470 100"
                        stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 1.0, duration: 0.5, ease: "easeInOut" }}
                    />
                    {/* Arrowhead */}
                    <motion.path
                        d="M 470 100 L 458 92 M 470 100 L 460 108"
                        stroke={arrowColor} strokeWidth="2" strokeLinecap="round" fill="none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.48, duration: 0.12 }}
                    />
                </svg>

                {/* Value chips traveling along the curve path */}
                {allChips.map((chip, i) => (
                    <motion.span
                        key={i}
                        className={`absolute px-1.5 py-0.5 rounded border text-xs font-mono font-bold ${chip.chipClass} shadow-lg z-10`}
                        style={{ transform: 'translate(-50%, -50%)' }}
                        initial={{ left: '50%', top: '3%', opacity: 0, scale: 0.3 }}
                        animate={{
                            left: ['50%', '52%', '58%', '71%', '78%'],
                            top:  ['3%', '25%', '55%', '70%', '63%'],
                            opacity: [0, 1, 1, 1, 0],
                            scale: [0.3, 1, 1, 1, 0.6]
                        }}
                        transition={{
                            delay: 1.15 + i * 0.08,
                            duration: 0.55,
                            ease: "easeInOut",
                            times: [0, 0.25, 0.5, 0.75, 1]
                        }}
                    >
                        {chip.val}
                    </motion.span>
                ))}

                {/* Def box — positioned to the right, knocked twice */}
                <motion.div
                    className={`relative mt-10 px-5 py-4 ${boxBg} ${boxBorder} rounded-xl backdrop-blur-sm shadow-xl z-20`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: [0, 0, 10, -4, 0, 10, -4, 0],
                    }}
                    transition={{
                        opacity: { delay: 0.5, duration: 0.3 },
                        scale: { delay: 0.5, duration: 0.3 },
                        x: {
                            delay: 1.55,
                            duration: 0.8,
                            ease: "easeInOut",
                            times: [0, 0.3, 0.4, 0.5, 0.55, 0.65, 0.75, 1.0]
                        }
                    }}
                >
                    {/* Knock flash — flares on impact */}
                    <motion.div
                        className={`absolute -inset-2 ${boxGlowBg} rounded-2xl blur-lg pointer-events-none`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0, 0.8, 0.2, 0, 0.8, 0.2, 0] }}
                        transition={{
                            delay: 1.55,
                            duration: 0.8,
                            times: [0, 0.3, 0.4, 0.5, 0.55, 0.65, 0.75, 1.0]
                        }}
                    />
                    {/* Persistent subtle glow */}
                    <motion.div className={`absolute -inset-3 ${boxGlowBg} rounded-2xl blur-xl pointer-events-none`}
                        animate={{ opacity: [0.3, 0.65, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
                    />
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
            </div>

            {/* Arg bindings — centered below the arrow, one row per param */}
            <motion.div
                className="font-mono text-base flex flex-col items-center gap-2 mt-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.3 }}
            >
                {args.map(({ name, nameClass, array, chipClass }, idx) => (
                    <motion.div
                        key={idx}
                        className="flex items-center gap-2 flex-wrap justify-center"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.65 + idx * 0.15, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <span className={`${nameClass} font-semibold text-lg`}>{name}</span>
                        <span className="text-slate-400 text-lg">=</span>
                        {Array.isArray(array) ? (
                            <span className="text-white text-lg font-semibold">
                                [{array.join(', ')}]
                            </span>
                        ) : (
                            <span className="text-white text-lg font-semibold">{String(array)}</span>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

// ============ BASE CASE CHECK ANIMATION ============
// Phase 0: if len( chips ) <= 1 :
// Phase 1: if 7 <= 1 :            (len(chips) replaced in-place)
// Phase 2: if False :             (7 <= 1 replaced in-place)
const CheckBaseAnimation = ({ arr }) => {
    const [phase, setPhase] = React.useState(0);
    const isBase = arr.length <= 1;

    React.useEffect(() => {
        setPhase(0);
        const t1 = setTimeout(() => setPhase(1), 700);    // replace len(chips) → number
        const t2 = setTimeout(() => setPhase(2), 1500);   // replace num<=1 → boolean
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [arr]);

    const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } };

    return (
        <div className="font-mono text-lg flex items-center justify-center gap-1.5">
            <span className="text-purple-400 font-bold">if</span>

            {/* len(chips) ← swaps to number in phase 1, gone in phase 2 */}
            <AnimatePresence mode="wait">
                {phase === 0 ? (
                    <motion.span key="lenchips" className="inline-flex items-center gap-1.5" {...fade}>
                        <span className="text-amber-400 font-semibold">len</span>
                        <span className="text-slate-400">(</span>
                        {arr.map((val, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-700/80 border border-slate-600 rounded text-slate-200 text-sm font-mono">
                                {val}
                            </span>
                        ))}
                        <span className="text-slate-400">)</span>
                    </motion.span>
                ) : phase === 1 ? (
                    <motion.span key="lenval" {...fade}>
                        <span className="text-cyan-300 font-black px-3 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xl">
                            {arr.length}
                        </span>
                    </motion.span>
                ) : null}
            </AnimatePresence>

            {/* <= 1  ← swaps to boolean in phase 2 */}
            <AnimatePresence mode="wait">
                {phase < 2 ? (
                    <motion.span key="cmp" className="inline-flex items-center gap-1.5" {...fade}>
                        <span className="text-slate-400">&lt;=</span>
                        <span className="text-emerald-400 font-bold">1</span>
                    </motion.span>
                ) : (
                    <motion.span
                        key="bool"
                        className={`font-bold px-4 py-0.5 rounded-xl border text-lg ${
                            isBase
                                ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_14px_#10b98166]'
                                : 'text-red-400 bg-red-500/15 border-red-500/40 shadow-[0_0_14px_#ef444466]'
                        }`}
                        {...fade}
                    >{isBase ? 'True' : 'False'}</motion.span>
                )}
            </AnimatePresence>

            <span className="text-slate-400">:</span>
        </div>
    );
};

// ============ STEP DATA COMPUTATION (pure function) ============
const computeStepData = (steps, idx) => {
    if (!steps || steps.length === 0 || idx < 0 || idx >= steps.length) {
        return { stepType: 'initial', mainArray: [38, 27, 43, 3, 9, 82, 10], mid: undefined, leftArray: null, rightArray: null, resultArray: null, leftSorted: null, rightSorted: null, iPtr: undefined, jPtr: undefined, isLeftReturnPhase: false, isRightReturnPhase: false, phase: 'CALL', stepIndex: idx };
    }
    const step = steps[idx];
    const currentVars = step?.variables || step?.locals || {};
    const code = step?.code?.trim() || '';
    const explanation = step?.explanation || '';
    const nextStep = steps[idx + 1];
    const nextVars = nextStep?.variables || nextStep?.locals || {};

    const getValue = (v) => {
        if (v === null || v === undefined) return undefined;
        if (typeof v === 'object' && 'value' in v) return v.value;
        return v;
    };
    const getArray = (v) => {
        if (!v) return null;
        if (Array.isArray(v)) return v;
        if (typeof v === 'object' && 'value' in v && Array.isArray(v.value)) return v.value;
        return null;
    };
    const parseResultFromExplanation = (name) => {
        const regex = new RegExp(`→\\s*${name}\\s*=\\s*([\\d\\-]+|\\[[^\\]]*\\])`, 'i');
        const match = explanation.match(regex);
        if (match) {
            const val = match[1];
            if (val.startsWith('[')) { try { return JSON.parse(val.replace(/'/g, '"')); } catch { return null; } }
            return parseInt(val, 10);
        }
        return undefined;
    };
    const getPredictedValue = (name) => {
        const fromExplanation = parseResultFromExplanation(name);
        if (fromExplanation !== undefined) return fromExplanation;
        return getValue(nextVars[name]);
    };
    const getPredictedArray = (name) => {
        const fromExplanation = parseResultFromExplanation(name);
        if (Array.isArray(fromExplanation)) return fromExplanation;
        return getArray(nextVars[name]);
    };

    let stepType = 'other';
    if (step?.stepType) { stepType = step.stepType; }
    // synthetic_return: merge_sort is returning — show return_merged animation with the actual merged result
    else if (step?.event === 'synthetic_return') { stepType = 'synthetic_return'; }
    else if (step?.event === 'synthetic_assignment') { stepType = 'synthetic_assignment'; }
    else if (!code) { stepType = 'initial'; }
    else if (code.includes('arr = [') && code.includes(']')) { stepType = 'init_array'; }
    else if (code.includes('if len(arr)') || code.includes('len(arr) <= 1')) { stepType = 'check_base'; }
    else if (code.includes('return arr') && !code.includes('merge')) { stepType = 'return_base'; }
    else if (code.includes('mid =') || code.includes('len(arr) //')) { stepType = 'compute_mid'; }
    else if (code.includes('left = arr[:mid]')) { stepType = 'split_left'; }
    else if (code.includes('right = arr[mid:]')) { stepType = 'split_right'; }
    else if (code.includes('left_sorted') && code.includes('merge_sort')) { stepType = 'recurse_left'; }
    else if (code.includes('right_sorted') && code.includes('merge_sort')) { stepType = 'recurse_right'; }
    else if (code.includes('merge') && code.includes('left_sorted') && code.includes('right_sorted')) { stepType = 'call_merge'; }
    else if (code.includes('result = []')) { stepType = 'init_result'; }
    else if (code.includes('i = j = 0')) { stepType = 'init_pointers'; }
    else if (code.includes('while i < len(left)')) { stepType = 'compare_loop'; }
    else if (code.includes('left[i]') && code.includes('right[j]')) { stepType = 'compare'; }
    else if (code.includes('result.append(left[i])')) { stepType = 'append_left'; }
    else if (code.includes('result.append(right[j])')) { stepType = 'append_right'; }
    else if (code.includes('i += 1')) { stepType = 'inc_i'; }
    else if (code.includes('j += 1')) { stepType = 'inc_j'; }
    else if (code.includes('result.extend(left')) { stepType = 'extend_left'; }
    else if (code.includes('result.extend(right')) { stepType = 'extend_right'; }
    else if (code.includes('return result')) { stepType = 'return_merged'; }

    // ── Assignment-completion override ────────────────────────────────────
    // Python re-hits "right_sorted = merge_sort(right)" after the recursive
    // call returns (to complete the assignment). At that point right_sorted IS
    // in vars, meaning both sorted halves are ready. We show call_merge
    // (return merge(left_sorted, right_sorted)) instead of the recurse animation.
    if (stepType === 'recurse_right' && getArray(currentVars.right_sorted)) {
        stepType = 'call_merge';
    }

    // ── synthetic_return result ───────────────────────────────────────────
    // The return_value field carries the actual merged array returned by merge_sort.
    // Fall back to merging left_sorted+right_sorted if unavailable.
    let syntheticReturnResult = null;
    if (stepType === 'synthetic_return') {
        if (Array.isArray(step?.return_value)) {
            syntheticReturnResult = step.return_value;
        } else if (step?.return_value && typeof step.return_value === 'object' && Array.isArray(step.return_value.value)) {
            syntheticReturnResult = step.return_value.value;
        } else {
            // Parse from explanation: "Returning [27, 43] from merge_sort() back to caller"
            const retMatch = (step?.explanation || '').match(/Returning\s*(\[[^\]]*\])/);
            if (retMatch) { try { syntheticReturnResult = JSON.parse(retMatch[1]); } catch {} }
        }
        // Last resort: sorted merge of left_sorted + right_sorted
        if (!syntheticReturnResult) {
            const ls = getArray(currentVars.left_sorted);
            const rs = getArray(currentVars.right_sorted);
            if (ls && rs) syntheticReturnResult = [...ls, ...rs].sort((a, b) => a - b);
        }
    }

    let mainArray = getArray(currentVars.arr) || [];
    if (mainArray.length === 0 && steps.length > 0) mainArray = [38, 27, 43, 3, 9, 82, 10];
    const mid = stepType === 'compute_mid' ? getPredictedValue('mid') : getValue(currentVars.mid);
    const leftArray = stepType === 'split_left' ? getPredictedArray('left') : getArray(currentVars.left);
    const rightArray = stepType === 'split_right' ? getPredictedArray('right') : getArray(currentVars.right);
    const resultArray = getArray(currentVars.result);
    const leftSorted = getArray(currentVars.left_sorted) || getPredictedArray('left_sorted');
    const rightSorted = getArray(currentVars.right_sorted) || getPredictedArray('right_sorted');
    const codeInvolvesRightSorted = code.includes('right_sorted');
    const codeInvolvesLeftSorted = code.includes('left_sorted') && !code.includes('right_sorted');
    const isLeftReturnPhase = !!(leftSorted && leftSorted.length > 0
        && stepType !== 'recurse_left' && stepType !== 'recurse_right'
        && stepType !== 'return_base' && stepType !== 'call_merge'
        && stepType !== 'return_merged' && !codeInvolvesRightSorted);
    const isRightReturnPhase = !!(rightSorted && rightSorted.length > 0
        && stepType !== 'recurse_right' && stepType !== 'recurse_left'
        && stepType !== 'return_base' && stepType !== 'call_merge'
        && stepType !== 'return_merged' && !codeInvolvesLeftSorted);
    const phase = (isLeftReturnPhase || isRightReturnPhase) ? 'RETURN' : 'CALL';
    const iPtr = getValue(currentVars.i);
    const jPtr = getValue(currentVars.j);
    return { stepType, code, mainArray, mid, leftArray, rightArray, resultArray: stepType === 'synthetic_return' ? syntheticReturnResult : resultArray, leftSorted, rightSorted, iPtr, jPtr, isLeftReturnPhase, isRightReturnPhase, phase, stepIndex: idx };
};

// ============ CALL STACK BUILDER ============
const getArrFromVars = (vars, key = 'arr') => {
    const v = vars?.[key];
    if (!v) return null;
    if (Array.isArray(v)) return v;
    if (typeof v === 'object' && 'value' in v && Array.isArray(v.value)) return v.value;
    return null;
};
const getValFromVars = (vars, key) => {
    const v = vars?.[key];
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'object' && 'value' in v) return v.value;
    if (Array.isArray(v)) return v;
    return v;
};
const inferStepType = (step) => {
    if (step?.stepType) return step.stepType;
    // Detect synthetic events before code-based pattern matching so that
    // 'return merge(left_sorted, right_sorted)' is not mis-classified as call_merge.
    if (step?.event === 'synthetic_return') return 'synthetic_return';
    if (step?.event === 'synthetic_assignment') return 'synthetic_assignment';
    const code = step?.code?.trim() || '';
    if (code.includes('if len(arr)') || code.includes('len(arr) <= 1')) return 'check_base';
    if (code.includes('return arr') && !code.includes('merge')) return 'return_base';
    if (code.includes('mid =')) return 'compute_mid';
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
    if (code.includes('def merge_sort') || code.includes('def merge')) return 'call_function';
    return 'other';
};

const TRACKED_VARS = ['arr', 'mid', 'left', 'right', 'left_sorted', 'right_sorted', 'result', 'i', 'j'];

const buildCallStack = (steps, currentIdx) => {
    if (!steps || steps.length === 0) return [];
    const frames = [];
    let pendingNewFrame = false;

    // Helper: find the last frame with a given status (searched from top)
    const lastWith = (status) => {
        for (let fi = frames.length - 1; fi >= 0; fi--) {
            if (frames[fi].status === status) return frames[fi];
        }
        return null;
    };
    // Helper: find last frame that is still 'active' (receives var writes)
    const lastActive = () => lastWith('active');

    for (let i = 0; i <= currentIdx; i++) {
        const step = steps[i];
        const vars = step?.variables || step?.locals || {};
        const arr = getArrFromVars(vars);
        let st = inferStepType(step);

        // ── Assignment-completion overrides (same as computeStepData) ────
        // Python re-hits the recurse line to complete the assignment after the
        // recursive call returns. Detect this by checking if the result var
        // is already in scope — if so, skip the pendingNewFrame logic.
        if (st === 'recurse_right' && getArrFromVars(vars, 'right_sorted') !== null) {
            st = 'right_sorted_done'; // neutral — no frame push, no seal
        }

        // ── PUSH new frame when pending ─────────────────────────────────
        if (pendingNewFrame) {
            const topFrame = frames[frames.length - 1];
            const arrStr = JSON.stringify(arr);
            const topStr = JSON.stringify(topFrame?.arr);
            if (st === 'init_result') {
                // Entering merge() — push a merge frame immediately
                frames.push({ id: i, arr: arr || [], func: 'merge', vars: {}, status: 'active' });
                pendingNewFrame = false;
            } else if (arr !== null && (arrStr !== topStr || topFrame?.status === 'returned' || topFrame?.status === 'sealing')) {
                frames.push({ id: i, arr, func: 'merge_sort', vars: {}, status: 'active' });
                pendingNewFrame = false;
            }
            // else keep pendingNewFrame=true until the child scope actually starts
        }

        // ── Bootstrap first frame ────────────────────────────────────────
        if (frames.length === 0 && arr !== null) {
            frames.push({ id: i, arr, func: 'merge_sort', vars: {}, status: 'active' });
        }

        // ── If init_result hit without pendingNewFrame, convert top to merge ─
        if (st === 'init_result') {
            const top = frames[frames.length - 1];
            if (top && top.func !== 'merge') top.func = 'merge';
        }

        // ── Pre-blast for synthetic_assignment ─────────────────────────────
        // Blast the returning child frame BEFORE writing vars so that the
        // caller's locals (which the synthetic_assignment step carries) are
        // written to the correct parent frame, not the departing child frame.
        if (st === 'synthetic_assignment') {
            for (let fi = frames.length - 1; fi >= 0; fi--) {
                if (frames[fi].returning && frames[fi].status !== 'returned') {
                    frames[fi].status = 'returned';
                    break;
                }
            }
        }

        // ── Write vars ONLY to the last ACTIVE frame ─────────────────────
        // 'sealing' and 'returned' frames are frozen — no updates allowed.
        const target = lastActive();
        if (target) {
            for (const varName of TRACKED_VARS) {
                const v = getValFromVars(vars, varName);
                if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0 && varName !== 'arr')) {
                    target.vars[varName] = v;
                }
            }
        }

        // ── On recurse_left / recurse_right: schedule new frame ──────────
        if (st === 'recurse_left' || st === 'recurse_right') {
            pendingNewFrame = true;
        }

        // ── On call_merge: SEAL current merge_sort frame + schedule merge frame ─
        // BUT: if this frame's merge() has already returned (mergeCompleted flag),
        // the tracer is re-hitting "return merge(...)" as part of merge_sort's own
        // return — blast this merge_sort frame instead of scheduling another merge.
        if (st === 'call_merge') {
            const active = lastActive();
            if (active && active.func === 'merge_sort' && active.mergeCompleted) {
                // merge_sort is executing its own "return merge(...)" — blast it
                active.status = 'returned';
            } else if (active && active.func === 'merge_sort') {
                // First time: seal this merge_sort, schedule merge() frame
                active.status = 'sealing';
                pendingNewFrame = true;
            }
        }

        // ── On return_base: blast current active merge_sort frame ─────────
        if (st === 'return_base') {
            const active = lastActive();
            if (active) active.status = 'returned';
        }

        // ── On return_merged: blast ONLY merge() frame, re-activate sealed merge_sort ─
        // merge_sort needs to visually resume at its "return merge(...)" line
        // before being blasted by the subsequent synthetic_return step.
        if (st === 'return_merged') {
            const mergeFrame = lastActive();
            if (mergeFrame && mergeFrame.func === 'merge') mergeFrame.status = 'returned';
            // Re-activate the sealed merge_sort and mark that its merge() completed
            const sealedParent = lastWith('sealing');
            if (sealedParent) {
                sealedParent.status = 'active';
                sealedParent.mergeCompleted = true;
            }
        }

        // ── On synthetic_return: keep the frame alive for one extra step ──────
        // This is the intermediate step between merge() finishing and the parent
        // receiving the return value. The frame stays visible in the call stack
        // (and line 16 "return merge(...)" is highlighted in the code panel)
        // until the next synthetic_assignment step blasts it (see pre-blast above).
        if (st === 'synthetic_return') {
            const active = lastActive();
            if (active) active.returning = true; // keep status='active', just flag it
        }
    }
    return frames;
};

// ============ CALL STACK PANEL ============
const VAR_COLORS = {
    arr: 'text-indigo-300', mid: 'text-yellow-300', left: 'text-cyan-300',
    right: 'text-orange-300', left_sorted: 'text-emerald-300',
    right_sorted: 'text-amber-300', result: 'text-purple-300',
    i: 'text-pink-300', j: 'text-rose-300',
};
const VAR_ORDER = ['arr', 'mid', 'left', 'right', 'left_sorted', 'right_sorted', 'result', 'i', 'j'];
const formatCallVal = (v) => {
    if (Array.isArray(v)) return `[${v.join(', ')}]`;
    return String(v);
};

// ── Reusable frame card (used for both vertical stack and horizontal pair) ──
const FrameCard = ({ frame, isTop, pairRole }) => {
    // pairRole: 'parent' | 'child' | null  (null = normal vertical)
    const isMerge = frame.func === 'merge';
    const isSealing = frame.status === 'sealing';
    const orderedVars = VAR_ORDER.filter(
        k => frame.vars[k] !== undefined && frame.vars[k] !== null
    );

    let borderCls, titleCls;
    if (pairRole === 'parent') {
        // sealing merge_sort — FULL brightness, indigo, no dimming
        borderCls = 'border-indigo-500/70 bg-indigo-950/50 shadow-lg shadow-indigo-950/40';
        titleCls  = 'text-indigo-300';
    } else if (pairRole === 'child') {
        // active merge() in pair
        borderCls = 'border-purple-500/70 bg-purple-950/50 shadow-lg shadow-purple-950/40';
        titleCls  = 'text-purple-300';
    } else if (isTop) {
        borderCls = isMerge
            ? 'border-purple-500/70 bg-purple-950/50 shadow-lg shadow-purple-950/40'
            : 'border-indigo-500/70 bg-indigo-950/50 shadow-lg shadow-indigo-950/40';
        titleCls = isMerge ? 'text-purple-300' : 'text-indigo-300';
    } else {
        borderCls = 'border-slate-700/50 bg-slate-800/35';
        titleCls  = 'text-slate-400';
    }

    return (
        <div className={`relative rounded-xl border p-3 h-full ${borderCls}`}>
            {/* ID badge */}
            <span className={`absolute top-2 right-2.5 text-[10px] font-mono font-bold ${
                pairRole ? (pairRole === 'child' ? 'text-purple-500/60' : 'text-indigo-500/60') : isTop ? 'text-indigo-500/60' : 'text-slate-600'
            }`}>#{frame.frameNumber}</span>

            {/* Title */}
            <div className="flex items-center gap-2 mb-2.5 pr-8 flex-wrap">
                <span className={`text-sm font-mono font-bold ${titleCls}`}>{frame.func}(arr)</span>
                {pairRole === 'child' && (
                    <motion.span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-purple-500/25 text-purple-200"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    >▶ running</motion.span>
                )}
                {pairRole === 'parent' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-indigo-500/15 text-indigo-400/70">
                        ↩ called merge
                    </span>
                )}
                {!pairRole && isTop && !isSealing && (
                    <motion.span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${isMerge ? 'bg-purple-500/25 text-purple-200' : 'bg-indigo-500/25 text-indigo-200'}`}
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    >▶ running</motion.span>
                )}
            </div>

            {/* Variables */}
            {orderedVars.length > 0 ? (
                <div className="flex flex-col gap-1">
                    {orderedVars.map(k => (
                        <div key={k} className="flex items-start gap-1.5 font-mono">
                            <span className={`text-sm font-semibold shrink-0 ${pairRole ? 'w-20' : 'w-24'} ${VAR_COLORS[k] || 'text-slate-300'}`}>{k}</span>
                            <span className="text-sm text-slate-500 shrink-0">=</span>
                            <span className="text-sm text-slate-100 break-all leading-snug">{formatCallVal(frame.vars[k])}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <span className="text-xs text-slate-500 font-mono">entering...</span>
            )}
        </div>
    );
};

const CallStackPanel = ({ frames }) => {
    const scrollRef = React.useRef(null);

    const activeFrames = React.useMemo(() => {
        const indexed = frames.map((f, i) => ({ ...f, frameNumber: i + 1 }));
        return indexed.filter(f => f.status !== 'returned').reverse();
    }, [frames]);

    const totalActive = activeFrames.length;

    // Detect merge pair: top frame is merge() + second frame is sealing merge_sort
    const hasMergePair = totalActive >= 2
        && activeFrames[0].func === 'merge'
        && activeFrames[0].status === 'active'
        && activeFrames[1].status === 'sealing';

    // Panel expands when merge pair is visible
    const panelWidth = hasMergePair ? 560 : 290;

    React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [totalActive]);

    // Frames shown in vertical stack: skip the pair when active
    const stackFrames = hasMergePair ? activeFrames.slice(2) : activeFrames;

    return (
        <motion.div
            className="flex flex-col bg-slate-950 border-r border-slate-700/60 overflow-hidden"
            animate={{ width: panelWidth, minWidth: panelWidth }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
            style={{ width: panelWidth, minWidth: panelWidth }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-950 z-10 shrink-0">
                <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Call Stack</span>
                <span className="text-xs font-mono text-slate-600">
                    {totalActive > 0 ? `${totalActive} active` : 'empty'}
                </span>
            </div>

            {/* Frame list */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b #0a0f1a' }}
            >
                {totalActive === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-600 text-sm font-mono">
                        waiting...
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5 p-3">

                        {/* ── Horizontal merge pair ── */}
                        <AnimatePresence initial={false} mode="popLayout">
                            {hasMergePair && (
                                <motion.div
                                    key={`merge-pair-${activeFrames[0].id}-${activeFrames[1].id}`}
                                    layout
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{
                                        y: -100, opacity: 0, scale: 1.1, filter: 'brightness(2.2)',
                                        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                                    }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    className="flex items-stretch gap-0"
                                >
                                    {/* Parent (sealing merge_sort) — full brightness */}
                                    <div className="flex-1 min-w-0">
                                        <FrameCard frame={activeFrames[1]} isTop={false} pairRole="parent" />
                                    </div>

                                    {/* Arrow connector */}
                                    <div className="flex flex-col items-center justify-center px-1 shrink-0" style={{ width: 36 }}>
                                        <svg width="36" height="24" viewBox="0 0 36 24" fill="none">
                                            <motion.line
                                                x1="0" y1="12" x2="28" y2="12"
                                                stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 0.35, delay: 0.1 }}
                                            />
                                            <motion.polyline
                                                points="22,5 32,12 22,19"
                                                stroke="#6366f1" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2, delay: 0.35 }}
                                            />
                                        </svg>
                                        <span className="text-[8px] text-indigo-500/50 font-mono mt-0.5">calls</span>
                                    </div>

                                    {/* Child (active merge()) */}
                                    <div className="flex-1 min-w-0">
                                        <FrameCard frame={activeFrames[0]} isTop={true} pairRole="child" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Regular vertical stack ── */}
                        <AnimatePresence initial={false} mode="popLayout">
                            {stackFrames.map((frame, idx) => {
                                const isTop = !hasMergePair && idx === 0;
                                const depthOpacity = isTop ? 1 : Math.max(0.35, 1 - idx * 0.18);
                                return (
                                    <motion.div
                                        key={frame.id}
                                        layout
                                        initial={{ y: -50, opacity: 0, scale: 0.88 }}
                                        animate={{ y: 0, opacity: depthOpacity, scale: isTop ? 1 : 0.97 }}
                                        exit={{
                                            y: -120, opacity: 0, scale: 1.22, filter: 'brightness(2.5)',
                                            transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                    >
                                        <FrameCard frame={frame} isTop={isTop} pairRole={null} />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Scroll hint */}
            {totalActive > (hasMergePair ? 3 : 2) && (
                <motion.div
                    className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-600 text-center font-mono tracking-wide shrink-0"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    ↓ {stackFrames.length} older frame{stackFrames.length !== 1 ? 's' : ''} below
                </motion.div>
            )}
        </motion.div>
    );
};

// ============ MAIN VISUALIZER COMPONENT ============
const MergeSortVisualizer = ({
    steps = [],
    currentStepIndex = 0,
    onStepChange,
    onScrub,
    isPlaying = false,
    onPlayPause,
    playbackSpeed = 1500,
    onSpeedChange,
    hideCallStack = false
}) => {
    const [slideElements, setSlideElements] = useState([]);
    const scrollContainerRef = useRef(null);

    const currentStep = steps[currentStepIndex];
    const isAtEnd = currentStepIndex >= steps.length - 1;
    const isAtStart = currentStepIndex <= 0;

    // Sync slideElements whenever currentStepIndex changes (handles manual nav + autoplay)
    useEffect(() => {
        setSlideElements(prev => {
            const targetLen = currentStepIndex + 1;
            if (prev.length === targetLen) return prev;
            if (prev.length < targetLen) {
                const newSlides = [...prev];
                for (let i = prev.length; i < targetLen; i++) {
                    newSlides.push(computeStepData(steps, i));
                }
                return newSlides;
            }
            return prev.slice(0, targetLen);
        });
    }, [currentStepIndex, steps]);

    // Auto-scroll to the rightmost (newest) slide.
    // The CallStackPanel spring-animates its width (e.g. 560px → 290px), which
    // continuously resizes the scroll container.  Each slide is min-width:100%,
    // so all slide positions shift during the animation.  A one-shot scrollTo
    // lands in the wrong place once the width settles.
    //
    // Fix: use a ResizeObserver to keep correcting scrollLeft while the container
    // is resizing, then stop after the spring settles (~400 ms).
    const shouldAutoScrollRef = useRef(false);

    // 1) When a NEW slide is appended, instantly jump to it and arm the flag.
    useEffect(() => {
        if (slideElements.length === 0) return;
        shouldAutoScrollRef.current = true;

        const container = scrollContainerRef.current;
        if (container) {
            const containerWidth = container.clientWidth;
            container.scrollLeft = (slideElements.length - 1) * containerWidth;
        }

        // Disarm after springs settle so manual back-scroll still works.
        const timeout = setTimeout(() => { shouldAutoScrollRef.current = false; }, 400);
        return () => clearTimeout(timeout);
    }, [slideElements.length]);

    // 2) While the flag is on, every resize event re-pins to the last slide.
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(() => {
            if (shouldAutoScrollRef.current && slideElements.length > 0) {
                const containerWidth = container.clientWidth;
                container.scrollLeft = (slideElements.length - 1) * containerWidth;
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [slideElements.length]);

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

    // Build the persistent call stack from steps up to current index
    const callStackFrames = useMemo(() => buildCallStack(steps, currentStepIndex), [steps, currentStepIndex]);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">

            {/* Middle row: call stack panel + main visualization canvas */}
            <div className="flex-1 flex flex-row overflow-hidden">

            {/* Call Stack Panel */}
            {!hideCallStack && <CallStackPanel frames={callStackFrames} />}

            {/* Main Visualization Canvas - Horizontal History Scroll */}
            <div
                ref={scrollContainerRef}
                className="flex-1 flex flex-row overflow-x-auto overflow-y-hidden relative dsa-viz-scroll"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #1e293b' }}
            >
                {slideElements.map((slideData, slideIdx) => {
                    const {
                        stepType, code: slideCode, mainArray, mid, leftArray, rightArray, resultArray,
                        leftSorted, rightSorted, iPtr, jPtr, isLeftReturnPhase,
                        isRightReturnPhase, phase
                    } = slideData;
                    return (
                        <div
                            key={slideIdx}
                            className="flex-shrink-0 flex flex-col items-center justify-center p-8 relative"
                            style={{ minWidth: '100%', height: '100%' }}
                        >
                            {/* Context Panel per slide */}
                            {stepType !== 'return_base' && stepType !== 'return_merged' && stepType !== 'synthetic_return' && stepType !== 'synthetic_assignment' && ((leftSorted && leftSorted.length > 0) || (rightSorted && rightSorted.length > 0)) ? (
                                <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-3 shadow-lg z-10">
                                    <div className="text-xs text-slate-400 uppercase mb-2 font-medium">Current Scope</div>
                                    <div className="flex flex-col gap-2">
                                        {leftSorted && leftSorted.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-cyan-400 font-mono text-sm font-bold">left_sorted</span>
                                                <span className="text-slate-500">=</span>
                                                <div className="flex items-center gap-0.5">
                                                    {leftSorted.map((val, i) => (<div key={`ctx-l-${i}`} className="w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm bg-cyan-600/80 border border-cyan-400/50 text-white">{val}</div>))}
                                                </div>
                                            </div>
                                        )}
                                        {rightSorted && rightSorted.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-amber-400 font-mono text-sm font-bold">right_sorted</span>
                                                <span className="text-slate-500">=</span>
                                                <div className="flex items-center gap-0.5">
                                                    {rightSorted.map((val, i) => (<div key={`ctx-r-${i}`} className="w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm bg-amber-600/80 border border-amber-400/50 text-white">{val}</div>))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                            <div className="flex flex-col items-center gap-6" style={{ width: '100%' }}>

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
                            <CheckBaseAnimation arr={mainArray} />
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
                        {/* CALL phase: render FunctionCallAnimation directly (no extra wrapper) */}
                        {stepType === 'recurse_left' && leftArray && leftArray.length > 0 && (
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
                        )}
                        {/* RETURN phase: show sorted result bubbling up */}
                        {isLeftReturnPhase && leftSorted && leftSorted.length > 0 && stepType !== 'synthetic_return' && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
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
                                <div className="relative flex flex-col items-center h-32 justify-end">
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
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <motion.div className="w-0.5 h-full bg-gradient-to-t from-emerald-500/0 via-cyan-500/50 to-cyan-500/0" />
                                        <motion.div
                                            className="absolute top-0 text-cyan-400 text-2xl"
                                            animate={{ y: [-10, 0, -10], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >▲</motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}

                        {/* Special Animation for Recursive Right: right_sorted = merge_sort(right) */}
                        {/* CALL phase: render FunctionCallAnimation directly (no extra wrapper) */}
                        {stepType === 'recurse_right' && rightArray && rightArray.length > 0 && (
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
                        )}
                        {/* RETURN phase: show sorted result bubbling up */}
                        {isRightReturnPhase && rightSorted && rightSorted.length > 0 && stepType !== 'synthetic_return' && (
                            <motion.div
                                className="flex flex-col items-center gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
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
                                <div className="relative flex flex-col items-center h-32 justify-end">
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
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <motion.div className="w-0.5 h-full bg-gradient-to-t from-emerald-500/0 via-amber-500/50 to-amber-500/0" />
                                        <motion.div
                                            className="absolute top-0 text-amber-400 text-2xl"
                                            animate={{ y: [-10, 0, -10], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >▲</motion.div>
                                    </motion.div>
                                </div>
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
                                    leftArray={leftArray || []}
                                    rightArray={rightArray || []}
                                />
                            )}

                        {/* Cinematic Comparison Animation */}
                        {stepType === 'compare' && (
                            <CompareAnimation
                                leftVal={leftArray ? leftArray[iPtr] : 0}
                                rightVal={rightArray ? rightArray[jPtr] : 0}
                                leftArray={leftArray || []}
                                rightArray={rightArray || []}
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
                                iPtr={iPtr}
                                jPtr={jPtr}
                                leftArray={leftArray || []}
                                rightArray={rightArray || []}
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

                        {/* Return Merged Result Animation — also used for synthetic_return (merge_sort returning) */}
                        {(stepType === 'return_merged' || stepType === 'synthetic_return') && (
                            <ReturnMergedAnimation
                                result={resultArray}
                                label={stepType === 'synthetic_return'
                                    ? <span className="flex items-center gap-1 flex-wrap justify-center">
                                        <span className="text-emerald-400">merge</span>
                                        <span className="text-slate-400">(</span>
                                        <span className="text-cyan-300">left_sorted</span>
                                        <span className="text-slate-500">,</span>
                                        <span className="text-amber-300">right_sorted</span>
                                        <span className="text-slate-400">)</span>
                                      </span>
                                    : null}
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
                        {phase === 'CALL' && stepType !== 'init_array' && stepType !== 'compute_mid' && stepType !== 'call_function' && stepType !== 'check_base' && stepType !== 'return_base' && stepType !== 'split_left' && stepType !== 'split_right' && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'call_merge' && stepType !== 'init_result' && stepType !== 'init_pointers' && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && stepType !== 'synthetic_return' && stepType !== 'synthetic_assignment' && mainArray.length > 0 && (
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
                        {phase === 'CALL' && stepType !== 'split_left' && stepType !== 'split_right' && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'call_merge' && stepType !== 'init_result' && stepType !== 'init_pointers' && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && stepType !== 'synthetic_return' && stepType !== 'synthetic_assignment' && (leftArray || rightArray) && (
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
                        {(leftSorted || rightSorted) && stepType !== 'recurse_left' && stepType !== 'recurse_right' && stepType !== 'call_merge' && stepType !== 'return_base' && !isLeftReturnPhase && !isRightReturnPhase && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && stepType !== 'synthetic_return' && stepType !== 'synthetic_assignment' && (
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
                        {resultArray && stepType !== 'init_result' && stepType !== 'init_pointers' && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && stepType !== 'synthetic_return' && stepType !== 'synthetic_assignment' && (
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
                        {(iPtr !== undefined || jPtr !== undefined) && stepType !== 'compare_loop' && stepType !== 'compare' && stepType !== 'append_left' && stepType !== 'append_right' && stepType !== 'inc_i' && stepType !== 'inc_j' && stepType !== 'extend_left' && stepType !== 'extend_right' && stepType !== 'return_merged' && stepType !== 'synthetic_return' && stepType !== 'synthetic_assignment' && (
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
                            </div>
                        </div>
                    );
                })}
            </div>

            </div>{/* end middle row */}

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

                    {/* Progress scrubber */}
                    <div className="flex-1 max-w-sm flex items-center gap-3 ml-2">
                        <input
                            type="range"
                            min={0}
                            max={Math.max(0, steps.length - 1)}
                            step={1}
                            value={currentStepIndex}
                            onChange={e => onScrub?.(Number(e.target.value))}
                            className="dsa-scrubber flex-1"
                            style={{
                                background: steps.length > 1
                                    ? `linear-gradient(to right, #818cf8 0%, #818cf8 ${(currentStepIndex / (steps.length - 1)) * 100}%, #475569 ${(currentStepIndex / (steps.length - 1)) * 100}%, #475569 100%)`
                                    : '#475569'
                            }}
                            title={`Step ${currentStepIndex + 1} of ${steps.length} — drag to jump`}
                        />
                        <span className="text-sm text-slate-200 font-mono whitespace-nowrap bg-slate-700 border border-slate-600 px-2.5 py-0.5 rounded-lg">
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
                        className="dsa-speed w-36"
                        style={{
                            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((8800 - playbackSpeed - 800) / 7200) * 100}%, #475569 ${((8800 - playbackSpeed - 800) / 7200) * 100}%, #475569 100%)`
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
