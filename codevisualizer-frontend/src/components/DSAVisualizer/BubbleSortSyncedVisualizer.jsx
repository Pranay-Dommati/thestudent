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
import PointerBadgeRow from './PointerBadgeRow';
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

    const { type, i: outerI, j: jIdx, sortedFrom = n, swapJ } = ev ?? {};

    const isSwapEvent  = type === 'swap_exec';

    // Which events show the j pointer sliding
    const showJ = ['inner_iter', 'compare', 'swap_exec', 'swapped_true'].includes(type);
    // Which events show the i boundary pointer
    const showI = ['outer_iter', 'inner_iter', 'compare',
                   'swap_exec', 'swapped_true', 'check_sorted', 'early_break'].includes(type);

    // i badge sits at index outerI (0, 1, 2 … as passes progress)
    const iPos = outerI !== undefined && outerI !== null ? outerI : null;

    // Cell coloring
    const getCellBg = (idx) => {
        const isSorted = idx >= sortedFrom;
        const isSwpJ   = isSwapEvent && idx === swapJ;
        const isSwpJ1  = isSwapEvent && idx === swapJ + 1;
        const isAtJ    = showJ && jIdx !== undefined && idx === jIdx;
        const isAtJ1   = showJ && jIdx !== undefined && idx === jIdx + 1;
        const isAtI    = showI && iPos !== null && idx === iPos;

        if (isSwpJ || isSwpJ1)          return 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300 shadow-lg shadow-rose-500/50';
        if (isSorted)                   return 'bg-emerald-600 border-emerald-400 text-white ring-1 ring-emerald-300/50';
        if (isAtJ && type === 'compare') return 'bg-pink-500 border-pink-300 text-white ring-2 ring-pink-300 shadow-md shadow-pink-400/50';
        if (isAtJ1 && type === 'compare') return 'bg-yellow-400 border-yellow-300 text-slate-900 ring-2 ring-yellow-200 shadow-md shadow-yellow-400/50';
        return 'bg-slate-700 border-slate-500 text-slate-100';
    };

    return (
        <div className="flex flex-col items-center gap-0" style={{ position: 'relative' }}>

            {/* ── Boundary marker — arrow + label at cell n-i-1 ── */}
            {(() => {
                const showBoundary = jIdx !== null && jIdx !== undefined
                    && outerI !== null && outerI !== undefined;
                if (!showBoundary) return <div style={{ height: 36 }} />;
                const a    = n - outerI - 1;
                const rowW = n * CELL_W + (n - 1) * CELL_GAP;
                const cx   = a * STRIDE + CELL_W / 2;
                return (
                    <div style={{ position: 'relative', width: rowW, height: 36, flexShrink: 0 }}>
                        <motion.div
                            key={a}
                            style={{ position: 'absolute', left: cx, transform: 'translateX(-50%)', bottom: 0,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="text-[9px] text-indigo-300 font-mono whitespace-nowrap leading-tight">
                                n-i-1&nbsp;=&nbsp;{a},&nbsp;j:&nbsp;(0,&nbsp;{a - 1})
                            </span>
                            <span className="text-indigo-400 leading-none" style={{ fontSize: 14 }}>↓</span>
                        </motion.div>
                    </div>
                );
            })()}

            {/* ── Pointer badge row (above array) — i and j spring-slide ── */}
            <PointerBadgeRow
                cellW={CELL_W}
                cellGap={CELL_GAP}
                count={n}
                iRel={showI && iPos !== null ? iPos : null}
                jRel={showJ && jIdx !== null && jIdx !== undefined ? jIdx : null}
                j1Rel={type === 'compare' && jIdx !== null && jIdx !== undefined ? jIdx + 1 : null}
                iClass="bg-sky-500"
                jClass="bg-pink-600"
                j1Class="bg-yellow-400"
                blink={false}
                extraLabel={null}
            />

            {/* ── Array box ── */}
            <div className="flex flex-col rounded-xl border-2 border-slate-600 bg-slate-800/60"
                style={{ padding: `10px 16px` }}>
                <div className="flex items-center" style={{ gap: CELL_GAP }}>
                    {arr.map((val, idx) => {
                        const isSwpJ   = isSwapEvent && idx === swapJ;
                        const isSwpJ1  = isSwapEvent && idx === swapJ + 1;
                        const isSwpAny = isSwpJ || isSwpJ1;

                        let swapAnim = { x: 0, y: 0 };
                        if (isSwpJ)  swapAnim = { x: [STRIDE,  STRIDE * 0.5,  0], y: [0, -18, 0] };
                        if (isSwpJ1) swapAnim = { x: [-STRIDE, -STRIDE * 0.5, 0], y: [0,  18, 0] };

                        return (
                            <motion.div
                                key={idx}
                                className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 select-none ${getCellBg(idx)}`}
                                style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W, position: 'relative', zIndex: isSwpAny ? 10 : 0 }}
                                animate={swapAnim}
                                transition={isSwpAny ? { duration: 0.45, ease: 'easeInOut' } : { duration: 0 }}
                            >
                                {val}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Index row ── */}
            <div className="flex items-center mt-1" style={{ gap: CELL_GAP }}>
                {arr.map((_, idx) => (
                    <div key={idx} style={{ width: CELL_W }}
                        className="flex justify-center text-[10px] text-slate-600 font-mono select-none">
                        {idx}
                    </div>
                ))}
            </div>

            {/* ── Sorted boundary label ── */}
            {sortedFrom < n && (
                <div className="flex items-center mt-1" style={{ gap: CELL_GAP }}>
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
