/**
 * BubbleSortSyncedVisualizer
 *
 * "Code Execution" tab for Bubble Sort.
 * Flat single-array view: each pass animates with sliding j/j+1 comparison
 * pointers, swap arc animations, and a growing emerald sorted zone from the right.
 * Code panel on the right with line highlighting + VisualizerControls.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';

// ── Layout constants ─────────────────────────────────────────────────────────
const CELL_W   = 40;
const CELL_H   = 40;
const CELL_GAP = 5;
const STRIDE   = CELL_W + CELL_GAP;   // 45

// ── Line numbers (1-indexed, matching the code template) ────────────────────
const LINE = {
    FN_DEF:        1,
    INIT_N:        2,
    OUTER_FOR:     4,
    SWAPPED_FALSE: 5,
    INNER_FOR:     7,
    COMPARE:       8,
    SWAP_EXEC:     9,
    SWAPPED_TRUE:  10,
    CHECK_SORTED:  13,
    EARLY_BREAK:   14,
    RETURN_ARR:    16,
    ARR_ASSIGN:    20,
    CALL_BUBBLE:   22,
    PRINT:         23,
};

// ── Delays per event type (ms at 1× speed) ──────────────────────────────────
const DELAY = {
    arr_assign:    1800,
    call_bubble:   2000,
    init_n:        1800,
    outer_iter:    2200,
    swapped_false: 1600,
    inner_iter:    1000,
    compare:       1600,
    swap_exec:     2000,
    swapped_true:  1400,
    check_sorted:  2200,
    early_break:   2600,
    return_arr:    2000,
    final_done:    2600,
};

const getDelay = (ev, speed) => (DELAY[ev.type] ?? 1200) / speed;

// ── Simulation: walks through bubble sort and emits rich events ──────────────
const simulateBubbleSort = (inputArr) => {
    const arr = [...inputArr];
    const n   = arr.length;
    const events = [];

    const push = (type, extra = {}, codeLine, annotation) => {
        events.push({ type, arr: [...arr], codeLine, annotation, ...extra });
    };

    // Preamble
    push('arr_assign',  { sortedFrom: n }, LINE.ARR_ASSIGN,  `arr = [${arr.join(', ')}]`);
    push('call_bubble', { sortedFrom: n }, LINE.CALL_BUBBLE, `Calling bubble_sort(arr)`);
    push('init_n',      { sortedFrom: n }, LINE.INIT_N,      `n = len(arr) = ${n}`);

    let sortedFrom = n;   // elements starting from sortedFrom are fully sorted

    for (let i = 0; i < n; i++) {
        const prevSortedFrom = sortedFrom; // from previous passes

        push('outer_iter',    { i, sortedFrom: prevSortedFrom }, LINE.OUTER_FOR,
             `Pass ${i + 1}: i = ${i}`);
        push('swapped_false', { i, sortedFrom: prevSortedFrom }, LINE.SWAPPED_FALSE,
             `swapped = False`);

        let swapped      = false;
        const innerBound = n - i - 1;   // last j value (exclusive upper bound)

        for (let j = 0; j < innerBound; j++) {
            push('inner_iter', { i, j, sortedFrom: prevSortedFrom }, LINE.INNER_FOR,
                 `j = ${j}  →  comparing arr[${j}] and arr[${j + 1}]`);

            const lv = arr[j], rv = arr[j + 1];
            push('compare', { i, j, sortedFrom: prevSortedFrom, lval: lv, rval: rv },
                 LINE.COMPARE,
                 `arr[${j}] = ${lv}  >  arr[${j + 1}] = ${rv}?  ${lv > rv ? 'Yes → swap!' : 'No → skip'}`);

            if (lv > rv) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];

                push('swap_exec', { i, j, swapJ: j, sortedFrom: prevSortedFrom },
                     LINE.SWAP_EXEC,
                     `Swapped arr[${j}] ↔ arr[${j + 1}]  →  [${arr.join(', ')}]`);

                push('swapped_true', { i, j, sortedFrom: prevSortedFrom },
                     LINE.SWAPPED_TRUE,
                     `swapped = True`);

                swapped = true;
            }
        }

        // After the inner loop: innerBound is now in its final sorted position
        sortedFrom = innerBound;           // = n - i - 1

        push('check_sorted', { i, sortedFrom }, LINE.CHECK_SORTED,
             swapped
                 ? `swapped is True → continue to next pass`
                 : `swapped is False → array is already sorted!`);

        if (!swapped) {
            push('early_break', { i, sortedFrom: 0 }, LINE.EARLY_BREAK,
                 `break — no swaps occurred, done early!`);
            sortedFrom = 0;
            break;
        }
    }

    push('return_arr', { sortedFrom: 0 }, LINE.RETURN_ARR, `return [${arr.join(', ')}]`);
    push('final_done', { sortedFrom: 0 }, LINE.PRINT,      `Sorted Array: [${arr.join(', ')}]`);

    return { events, finalArr: [...arr] };
};

// ── Syntax highlight (matches QuickSort / MergeSort panels) ─────────────────
const KW = new Set([
    'def', 'if', 'for', 'while', 'return', 'True', 'False',
    'break', 'in', 'not', 'and', 'or', 'range', 'print', 'len',
]);

const highlightSyntax = (line) => {
    const tokens = line.split(/(\s+|[(),=\[\]#:+><!])/);
    let key = 0;
    const result = [];
    for (const tok of tokens) {
        if (!tok) continue;
        if (tok.startsWith('#')) {
            result.push(<span key={key++} className="text-slate-500 italic">{tok}</span>);
            break;
        }
        if (KW.has(tok)) {
            result.push(<span key={key++} className="text-purple-400 font-semibold">{tok}</span>);
            continue;
        }
        if (/^[0-9]+$/.test(tok)) {
            result.push(<span key={key++} className="text-amber-300">{tok}</span>);
            continue;
        }
        if (/^["']/.test(tok)) {
            result.push(<span key={key++} className="text-emerald-300">{tok}</span>);
            continue;
        }
        result.push(<span key={key++} className="text-slate-300">{tok}</span>);
    }
    return result;
};

// ── Code panel (identical interface to QuickSort / MergeSort) ────────────────
const SyncedCodePanel = ({ code, activeLine, executedLines }) => {
    const lines    = code ? code.split('\n') : [];
    const lineRefs = useRef({});

    useEffect(() => {
        if (activeLine && lineRefs.current[activeLine]) {
            lineRefs.current[activeLine].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeLine]);

    return (
        <div className="flex-1 overflow-y-auto py-2 font-mono text-[13px] leading-[1.7]">
            {lines.map((line, idx) => {
                const num     = idx + 1;
                const isCur   = num === activeLine;
                const wasDone = executedLines.includes(num);
                return (
                    <div
                        key={idx}
                        ref={el => lineRefs.current[num] = el}
                        className={`flex transition-all duration-200 ${
                            isCur    ? 'bg-blue-500/20 border-l-2 border-blue-400'
                            : wasDone ? 'bg-slate-800/30 border-l-2 border-emerald-500/30'
                            : 'border-l-2 border-transparent'
                        }`}
                    >
                        <span className={`w-10 text-right pr-3 select-none shrink-0 ${
                            isCur    ? 'text-blue-400 font-bold'
                            : wasDone ? 'text-emerald-500/70'
                            : 'text-slate-600'
                        }`}>
                            {num}
                        </span>
                        <span
                            className={`pr-4 select-text cursor-text ${
                                isCur ? 'text-blue-100' : wasDone ? 'text-slate-400' : 'text-slate-500'
                            }`}
                            style={{ whiteSpace: 'pre' }}
                        >
                            {highlightSyntax(line) || <span>&nbsp;</span>}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// ── Array visual ─────────────────────────────────────────────────────────────
const ArrayVisual = ({ arr, ev, n }) => {
    if (!arr || arr.length === 0) return null;

    const { type, j: jIdx, sortedFrom = n, swapJ } = ev ?? {};

    const showPointers = ['inner_iter', 'compare', 'swap_exec', 'swapped_true'].includes(type);
    const isSwapEvent  = type === 'swap_exec';

    // Determine cell coloring states
    const getCellBg = (idx, val) => {
        const isSorted = idx >= sortedFrom;
        const isJ      = showPointers && jIdx !== undefined && idx === jIdx;
        const isJ1     = showPointers && jIdx !== undefined && idx === jIdx + 1;
        const isSwpJ   = isSwapEvent && idx === swapJ;
        const isSwpJ1  = isSwapEvent && idx === swapJ + 1;

        if (isSwpJ || isSwpJ1)           return 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300 shadow-lg shadow-rose-500/50';
        if (isSorted)                    return 'bg-emerald-600 border-emerald-400 text-white ring-1 ring-emerald-300/50';
        if (isJ && type === 'compare')   return 'bg-sky-500 border-sky-300 text-white ring-2 ring-sky-300 shadow-md shadow-sky-400/50';
        if (isJ1 && type === 'compare')  return 'bg-pink-500 border-pink-300 text-white ring-2 ring-pink-300 shadow-md shadow-pink-400/50';
        if (isJ)                         return 'bg-sky-700 border-sky-500 text-white ring-1 ring-sky-400/60';
        if (isJ1)                        return 'bg-pink-700 border-pink-500 text-white ring-1 ring-pink-400/60';
        return 'bg-slate-700 border-slate-500 text-slate-100';
    };

    const cells = arr.map((val, idx) => {
        const isSwpJ   = isSwapEvent && idx === swapJ;
        const isSwpJ1  = isSwapEvent && idx === swapJ + 1;
        const isSwpAny = isSwpJ || isSwpJ1;

        // arr is POST-swap: value at swapJ came from swapJ+1 → animate from +STRIDE
        //                   value at swapJ+1 came from swapJ   → animate from -STRIDE
        let swapAnim = { x: 0, y: 0 };
        if (isSwpJ)  swapAnim = { x: [STRIDE,  STRIDE * 0.5,  0], y: [0, -18, 0] };
        if (isSwpJ1) swapAnim = { x: [-STRIDE, -STRIDE * 0.5, 0], y: [0,  18, 0] };

        return (
            <motion.div
                key={idx}
                className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 select-none ${getCellBg(idx, val)}`}
                style={{
                    width: CELL_W, height: CELL_H,
                    minWidth: CELL_W,
                    position: 'relative',
                    zIndex: isSwpAny ? 10 : 0,
                }}
                animate={swapAnim}
                transition={isSwpAny ? { duration: 0.45, ease: 'easeInOut' } : { duration: 0 }}
            >
                {val}
            </motion.div>
        );
    });

    // Index row
    const indexRow = arr.map((_, idx) => (
        <div
            key={idx}
            style={{ width: CELL_W }}
            className="flex justify-center text-[10px] text-slate-600 font-mono select-none"
        >
            {idx}
        </div>
    ));

    const totalW = n * CELL_W + Math.max(0, n - 1) * CELL_GAP;

    return (
        <div className="flex flex-col items-center gap-1" style={{ position: 'relative' }}>
            {/* Cell row */}
            <div className="flex items-center" style={{ gap: CELL_GAP }}>
                {cells}
            </div>

            {/* Index numbers */}
            <div className="flex items-center" style={{ gap: CELL_GAP }}>
                {indexRow}
            </div>

            {/* Pointer badges — slide smoothly using x animation */}
            <div className="relative" style={{ width: totalW, height: 34 }}>
                <AnimatePresence>
                    {showPointers && jIdx !== undefined && jIdx !== null && jIdx >= 0 && jIdx < n && (
                        <motion.div
                            key="j-badge"
                            className="absolute flex flex-col items-center"
                            style={{ top: 2, left: 0, width: CELL_W }}
                            animate={{ x: jIdx * STRIDE }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.7 }}
                            initial={{ opacity: 0, y: -4 }}
                            exit={{ opacity: 0 }}
                        >
                            <div style={{
                                width: 0, height: 0,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderBottom: '6px solid rgb(56,189,248)',
                            }} />
                            <span className="px-1.5 py-0.5 rounded-md bg-sky-900/80 border border-sky-500/60 text-[10px] font-bold font-mono text-sky-300 whitespace-nowrap mt-0.5">
                                j
                            </span>
                        </motion.div>
                    )}
                    {showPointers && jIdx !== undefined && jIdx !== null && (jIdx + 1) < n && (
                        <motion.div
                            key="j1-badge"
                            className="absolute flex flex-col items-center"
                            style={{ top: 2, left: 0, width: CELL_W }}
                            animate={{ x: (jIdx + 1) * STRIDE }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.7 }}
                            initial={{ opacity: 0, y: -4 }}
                            exit={{ opacity: 0 }}
                        >
                            <div style={{
                                width: 0, height: 0,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderBottom: '6px solid rgb(244,114,182)',
                            }} />
                            <span className="px-1.5 py-0.5 rounded-md bg-pink-900/80 border border-pink-500/60 text-[10px] font-bold font-mono text-pink-300 whitespace-nowrap mt-0.5">
                                j+1
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sorted zone label */}
            {sortedFrom < n && (
                <div className="flex items-center" style={{ gap: CELL_GAP, marginTop: 4 }}>
                    {arr.map((_, idx) => (
                        <div key={idx} style={{ width: CELL_W }} className="flex justify-center">
                            {idx === sortedFrom && (
                                <span className="text-[9px] text-emerald-400/80 font-semibold tracking-wide whitespace-nowrap">
                                    ← sorted
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const BubbleSortSyncedVisualizer = ({
    customArray = '[5, 1, 4, 2, 8, 0, 2]',
    code        = '',
    onProgress,
    seekRef,
}) => {
    const inputArr = useMemo(() => {
        try {
            const p = JSON.parse(customArray.trim());
            if (Array.isArray(p)) return p.map(Number);
        } catch {}
        return [5, 1, 4, 2, 8, 0, 2];
    }, [customArray]);

    const { events, finalArr } = useMemo(() => simulateBubbleSort(inputArr), [inputArr]);

    // ── Animation state ───────────────────────────────────────────────────────
    const [eventIdx, setEventIdx] = useState(-1);
    const [playing,  setPlaying]  = useState(false);
    const [finished, setFinished] = useState(false);
    const [speed,    setSpeed]    = useState(1);

    // Reset when input changes
    useEffect(() => {
        setEventIdx(-1); setPlaying(false); setFinished(false);
    }, [inputArr]);

    // Auto-advance timer
    useEffect(() => {
        if (!playing || finished) return;
        const nextIdx = eventIdx + 1;
        if (nextIdx >= events.length) { setFinished(true); setPlaying(false); return; }
        const t = setTimeout(() => {
            setEventIdx(nextIdx);
            if (nextIdx >= events.length - 1) { setFinished(true); setPlaying(false); }
        }, getDelay(events[nextIdx], speed));
        return () => clearTimeout(t);
    }, [playing, eventIdx, events, finished, speed]);

    // Controls
    const handlePlay  = () => {
        if (finished) { setEventIdx(-1); setFinished(false); setTimeout(() => setPlaying(true), 80); }
        else setPlaying(true);
    };
    const handlePause = () => setPlaying(false);
    const handleReset = () => { setPlaying(false); setFinished(false); setEventIdx(-1); };
    const handleBack  = () => {
        setPlaying(false); setFinished(false);
        setEventIdx(i => Math.max(-1, i - 1));
    };
    const handleNext  = () => {
        setPlaying(false);
        const ni = eventIdx + 1;
        if (ni >= events.length) { setFinished(true); }
        else { setEventIdx(ni); if (ni >= events.length - 1) setFinished(true); }
    };

    // Seek support (scrubber in header)
    useEffect(() => {
        if (seekRef) seekRef.current = (idx) => {
            setPlaying(false);
            setFinished(idx >= events.length - 1);
            setEventIdx(Math.max(-1, Math.min(events.length - 1, idx)));
        };
    }, [seekRef, events.length]);

    // Report progress to header scrubber
    useEffect(() => { onProgress?.({ idx: eventIdx, total: events.length }); }, [eventIdx, events.length, onProgress]);

    // ── Derived state ─────────────────────────────────────────────────────────
    const currentEv     = events[eventIdx] ?? null;
    const activeLine    = currentEv?.codeLine ?? null;
    const executedLines = useMemo(() => {
        const s = new Set();
        events.slice(0, eventIdx + 1).forEach(e => { if (e.codeLine) s.add(e.codeLine); });
        return [...s];
    }, [events, eventIdx]);

    const displayArr    = currentEv?.arr ?? inputArr;
    const n             = inputArr.length;

    // Pass badge label
    const passLabel = currentEv?.i !== undefined
        ? `Pass ${currentEv.i + 1} — i = ${currentEv.i}`
        : null;

    // Status bar label
    const statusLabel = (() => {
        if (!currentEv) return '▶ Press Start to begin the Bubble Sort visualization';
        if (finished)   return '✅ Bubble Sort complete! Array is fully sorted.';
        const map = {
            arr_assign:    '📋 Assigning input array',
            call_bubble:   '📞 Calling bubble_sort(arr)',
            init_n:        '📏 Computing n = len(arr)',
            outer_iter:    '🔁 Starting outer pass (i loop)',
            swapped_false: '🔄 Resetting swap flag: swapped = False',
            inner_iter:    '→ Advancing j to next pair',
            compare:       '🔎 Comparing adjacent elements',
            swap_exec:     '↔️ Swapping arr[j] and arr[j + 1]',
            swapped_true:  '✓ Recording swap: swapped = True',
            check_sorted:  '🔍 Checking if array is already sorted',
            early_break:   '⚡ No swaps this pass — breaking early!',
            return_arr:    '↩️ Returning sorted array',
            final_done:    '✅ Printing sorted result',
        };
        return map[currentEv.type] ?? '';
    })();

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
            <div className="flex-1 flex overflow-hidden min-h-0">

                {/* ── Left: array visualization ────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
                    <div className="flex-1 flex flex-col items-center justify-center overflow-auto px-8 py-10 gap-8">

                        {/* Pass / outer-loop indicator */}
                        <AnimatePresence mode="wait">
                            {passLabel && (
                                <motion.div
                                    key={passLabel}
                                    className="flex items-center gap-3"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1,  y: 0   }}
                                    exit={{ opacity: 0,     y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <span className="px-4 py-1.5 rounded-xl bg-indigo-900/60 border border-indigo-500/50 text-indigo-200 text-sm font-semibold font-mono">
                                        {passLabel}
                                    </span>
                                    <span className="text-slate-600 text-xs">
                                        Comparing up to index {n - (currentEv?.i ?? 0) - 2}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Array */}
                        <ArrayVisual arr={displayArr} ev={currentEv} n={n} />

                        {/* Annotation card */}
                        <AnimatePresence mode="wait">
                            {currentEv?.annotation && (
                                <motion.div
                                    key={currentEv.annotation}
                                    className="max-w-lg text-center px-5 py-3 rounded-xl border border-amber-600/50 bg-amber-900/40 text-amber-200 text-sm font-medium leading-snug shadow-xl backdrop-blur-sm"
                                    initial={{ opacity: 0, y: 8  }}
                                    animate={{ opacity: 1, y: 0  }}
                                    exit={{    opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {currentEv.annotation}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Legend */}
                        <div className="flex items-center gap-5 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-sky-500 inline-block" /> j (left)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-pink-500 inline-block" /> j+1 (right)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-rose-600 inline-block" /> swapping
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> sorted
                            </span>
                        </div>
                    </div>

                    {/* Status bar */}
                    <div className="flex-shrink-0 px-6 py-3 bg-slate-900/80 border-t border-slate-700/50 text-slate-300 text-sm font-medium">
                        {statusLabel}
                    </div>
                </div>

                {/* ── Right: code panel + controls ─────────────────────────── */}
                <div className="w-[380px] flex-shrink-0 h-full flex flex-col border-l border-slate-700/60 bg-slate-900 overflow-hidden">
                    <VisualizerControls
                        speed={speed} setSpeed={setSpeed}
                        eventIdx={eventIdx} playing={playing} finished={finished}
                        onPlay={handlePlay} onPause={handlePause}
                        onReset={handleReset} onBack={handleBack} onNext={handleNext}
                    />
                    <SyncedCodePanel
                        code={code}
                        activeLine={activeLine}
                        executedLines={[...executedLines]}
                    />
                </div>

            </div>
        </div>
    );
};

export default BubbleSortSyncedVisualizer;
