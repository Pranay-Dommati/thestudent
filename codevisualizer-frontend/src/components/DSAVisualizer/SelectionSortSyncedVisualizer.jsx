/**
 * SelectionSortSyncedVisualizer
 *
 * "Code Execution" tab for Selection Sort.
 * Flat single-array view: each pass highlights the outer position (i),
 * scans with a moving j pointer, tracks the running min_index in amber,
 * then shows a swap arc when arr[i] and arr[min_index] are exchanged.
 * Sorted zone grows from the LEFT (emerald) after each pass.
 * Code panel on the right with line highlighting + VisualizerControls.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import { AnnotationCard, parseInputArray, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

// ── Layout constants ─────────────────────────────────────────────────────────
const CELL_W   = 44;
const CELL_H   = 44;
const CELL_GAP = 6;
const STRIDE   = CELL_W + CELL_GAP;   // 50

// ── Line numbers (1-indexed, matching the code template) ────────────────────
const LINE = {
    FN_DEF:          1,
    INIT_N:          2,
    OUTER_FOR:       4,
    INIT_MIN:        5,
    INNER_FOR:       8,
    COMPARE:         9,
    UPDATE_MIN:      10,
    CHECK_SWAP:      13,
    SWAP_EXEC:       14,
    RETURN_ARR:      16,
    ARR_ASSIGN:      20,
    CALL_SELECTION:  22,
    PRINT:           23,
};

// ── Delays per event type (ms at 1× speed) ──────────────────────────────────
const DELAY = {
    arr_assign:      1800,
    call_selection:  2000,
    init_n:          1600,
    outer_iter:      2200,
    init_min:        1800,
    inner_iter:      1000,
    compare:         1600,
    update_min:      1600,
    check_swap:      2000,
    swap_exec:       2200,
    no_swap:         1800,
    return_arr:      2000,
    final_done:      2600,
};

const getDelay = makeGetDelay(DELAY, 1200);

// ── Simulation: walks through selection sort and emits rich events ───────────
const simulateSelectionSort = (inputArr) => {
    const arr    = [...inputArr];
    const n      = arr.length;
    const events = [];

    const push = (type, extra = {}, codeLine, annotation) => {
        events.push({ type, arr: [...arr], codeLine, annotation, ...extra });
    };

    // Preamble
    push('arr_assign',     { sortedCount: 0 },         LINE.ARR_ASSIGN,     `arr = [${arr.join(', ')}]`);
    push('call_selection', { sortedCount: 0 },         LINE.CALL_SELECTION, `Calling selection_sort(arr)`);
    push('init_n',         { sortedCount: 0 },         LINE.INIT_N,         `n = len(arr) = ${n}`);

    for (let i = 0; i < n - 1; i++) {
        push('outer_iter', { i, minIndex: i, sortedCount: i }, LINE.OUTER_FOR,
             `Outer loop — i = ${i}  (filling position ${i})`);

        let minIndex = i;
        push('init_min',   { i, minIndex, sortedCount: i },    LINE.INIT_MIN,
             `min_index = i = ${i}  (current minimum: arr[${i}] = ${arr[i]})`);

        for (let j = i + 1; j < n; j++) {
            push('inner_iter', { i, j, minIndex, sortedCount: i }, LINE.INNER_FOR,
                 `Scanning — j = ${j}`);

            const cmpResult = arr[j] < arr[minIndex];
            push('compare', { i, j, minIndex, sortedCount: i, cmpResult }, LINE.COMPARE,
                 `arr[${j}] = ${arr[j]}  <  arr[${minIndex}] = ${arr[minIndex]}?  ${cmpResult ? 'Yes → new min!' : 'No → skip'}`);

            if (cmpResult) {
                minIndex = j;
                push('update_min', { i, j, minIndex, sortedCount: i }, LINE.UPDATE_MIN,
                     `min_index = ${j}  (new minimum: arr[${j}] = ${arr[j]})`);
            }
        }

        // Check if swap is needed
        const needsSwap = minIndex !== i;
        push('check_swap', { i, minIndex, sortedCount: i, needsSwap }, LINE.CHECK_SWAP,
             needsSwap
                 ? `min_index (${minIndex}) ≠ i (${i}) → swap arr[${i}] ↔ arr[${minIndex}]`
                 : `min_index (${minIndex}) = i (${i}) → already in place, no swap`);

        if (needsSwap) {
            [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
            push('swap_exec', { i, minIndex, swapI: i, swapMin: minIndex, sortedCount: i }, LINE.SWAP_EXEC,
                 `Swapped arr[${i}] ↔ arr[${minIndex}]  →  [${arr.join(', ')}]`);
        } else {
            push('no_swap',   { i, minIndex, sortedCount: i }, LINE.CHECK_SWAP,
                 `No swap needed — arr[${i}] = ${arr[i]} is already the minimum`);
        }
    }

    push('return_arr', { sortedCount: n }, LINE.RETURN_ARR, `return [${arr.join(', ')}]`);
    push('final_done', { sortedCount: n }, LINE.PRINT,      `Sorted Array: [${arr.join(', ')}]`);

    return { events, finalArr: [...arr] };
};

// ── Array visual ──────────────────────────────────────────────────────────────
const BADGE = 20; // circular badge diameter (matches QuickSort)

const ArrayVisual = ({ arr, ev, n }) => {
    if (!arr || arr.length === 0) return null;

    const {
        type,
        i:        iIdx,
        j:        jIdx,
        minIndex: minIdx,
        sortedCount = 0,
        swapI,
        swapMin,
    } = ev ?? {};

    const isSwapEvent = type === 'swap_exec';
    const isInnerScan = ['inner_iter', 'compare', 'update_min'].includes(type);
    const showMinPtr  = ['init_min', 'inner_iter', 'compare', 'update_min', 'check_swap', 'swap_exec', 'no_swap'].includes(type);
    const showIPtr    = ['outer_iter', 'init_min', 'inner_iter', 'compare', 'update_min', 'check_swap', 'swap_exec', 'no_swap'].includes(type);
    const showJPtr    = isInnerScan && jIdx !== undefined && jIdx !== null;

    // Cell highlight only fires at condition-evaluating events (if / while checks), NOT on bare for-loop steps.
    const highlightI  = ['check_swap', 'swap_exec', 'no_swap'].includes(type);
    const highlightJ  = ['compare'].includes(type);

    // centerX: pixel centre of cell `idx` within the row (0-based from row left)
    const centerX = (idx) => idx * STRIDE + CELL_W / 2;

    const getCellBg = (idx) => {
        const isSorted     = idx < sortedCount;
        const isMinCompare = type === 'compare'  && idx === minIdx;
        // highlight min cell only during compare & check/swap steps — NOT during update_min (just move pointer)
        const highlightMin = ['compare', 'check_swap', 'swap_exec', 'no_swap'].includes(type);
        const isI          = highlightI   && idx === iIdx && !isMinCompare;
        const isMin        = highlightMin && idx === minIdx && minIdx !== iIdx && !isMinCompare;
        const isJ          = highlightJ && idx === jIdx;
        const isSwpI       = isSwapEvent && idx === swapI;
        const isSwpMin     = isSwapEvent && idx === swapMin;

        if (isSwpI || isSwpMin) return 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300 shadow-lg shadow-rose-500/50';
        if (isSorted)           return 'bg-emerald-600 border-emerald-400 text-white ring-1 ring-emerald-300/50';
        if (isMinCompare)       return 'bg-yellow-400 border-yellow-300 text-slate-900 ring-2 ring-yellow-200 shadow-md shadow-yellow-400/50';
        if (isMin)              return 'bg-yellow-400 border-yellow-300 text-slate-900 ring-2 ring-yellow-200 shadow-md shadow-yellow-400/50';
        if (isI)                return 'bg-sky-500 border-sky-300 text-white ring-2 ring-sky-300 shadow-md shadow-sky-400/50';
        if (isJ)                return 'bg-pink-500 border-pink-300 text-white ring-2 ring-pink-300 shadow-md shadow-pink-400/50';
        return 'bg-slate-700 border-slate-500 text-slate-100';
    };

    const rowW = n * CELL_W + Math.max(0, n - 1) * CELL_GAP;
    const slideTransition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.7 };

    const cells = arr.map((val, idx) => {
        const isSwpI   = isSwapEvent && idx === swapI;
        const isSwpMin = isSwapEvent && idx === swapMin;
        const isSwpAny = isSwpI || isSwpMin;

        const dist = (swapMin - swapI) * STRIDE;
        let swapAnim = { x: 0, y: 0 };
        if (isSwpI)   swapAnim = { x: [dist,   dist * 0.5,  0], y: [0, -22, 0] };
        if (isSwpMin) swapAnim = { x: [-dist, -dist * 0.5,  0], y: [0,  22, 0] };

        return (
            <motion.div
                key={idx}
                className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 select-none ${getCellBg(idx)}`}
                style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W, position: 'relative', zIndex: isSwpAny ? 10 : 0 }}
                animate={swapAnim}
                transition={isSwpAny ? { duration: 0.55, ease: 'easeInOut' } : { duration: 0 }}
            >
                {val}
            </motion.div>
        );
    });

    return (
        <div className="flex flex-col items-center gap-0" style={{ position: 'relative' }}>

            {/* ── Pointer badge row (above array) — shared PointerBadgeRow ── */}
            <PointerBadgeRow
                cellW={CELL_W}
                cellGap={CELL_GAP}
                count={n}
                iRel={showIPtr && iIdx !== undefined && iIdx !== null && iIdx >= 0 && iIdx < n ? iIdx : null}
                jRel={showJPtr && jIdx !== undefined && jIdx !== null && jIdx >= 0 && jIdx < n ? jIdx : null}
                iClass="bg-sky-500"
                jClass="bg-pink-500"
            />

            {/* ── Cell row ── */}
            <div className="flex items-center" style={{ gap: CELL_GAP }}>
                {cells}
            </div>

            {/* ── Index numbers ── */}
            <div className="flex items-center" style={{ gap: CELL_GAP, marginTop: 3 }}>
                {arr.map((_, idx) => (
                    <div key={idx} style={{ width: CELL_W }} className="flex justify-center text-[10px] text-slate-600 font-mono select-none">
                        {idx}
                    </div>
                ))}
            </div>

            {/* ── min_index badge BELOW index row (amber pill) ── */}
            <div style={{ position: 'relative', width: rowW, height: 22, marginTop: 4 }}>
                <AnimatePresence>
                    {showMinPtr && minIdx !== undefined && minIdx !== null && minIdx >= 0 && minIdx < n && (
                        <motion.div
                            key="min-badge"
                            className="absolute flex justify-center"
                            style={{ top: 0, left: 0, width: CELL_W }}
                            initial={{ x: minIdx * STRIDE }}
                            animate={{ x: minIdx * STRIDE }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
                        >
                            <span className="px-1.5 py-0.5 rounded-md bg-yellow-400 border border-yellow-300 text-[10px] font-bold font-mono text-slate-900 whitespace-nowrap">
                                min
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Sorted zone label ── */}
            {sortedCount > 0 && sortedCount < n && (
                <div className="flex items-center" style={{ gap: CELL_GAP, marginTop: 2 }}>
                    {arr.map((_, idx) => (
                        <div key={idx} style={{ width: CELL_W }} className="flex justify-center">
                            {idx === sortedCount && (
                                <span className="text-[9px] text-emerald-400/80 font-semibold tracking-wide whitespace-nowrap">
                                    sorted →
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
const SelectionSortSyncedVisualizer = ({
    customArray    = '[64, 25, 12, 22, 11]',
    code           = '',
    onProgress,
    seekRef,
    showCode       = true,
    onCloseCode,
    drawerState    = 'peek',
    setDrawerState,
}) => {
    const inputArr = useMemo(() => parseInputArray(customArray, [64, 25, 12, 22, 11]), [customArray]);

    const { events, finalArr } = useMemo(() => simulateSelectionSort(inputArr), [inputArr]);

    // ── Playback state machine ────────────────────────────────────────────────
    const { eventIdx, playing, finished, speed, setSpeed,
            handlePlay, handlePause, handleReset, handleBack, handleNext,
            currentEv, activeLine, executedLines } =
        useVisualizerPlayback({ events, getDelay, inputArr, seekRef, onProgress });

    const displayArr = currentEv?.arr ?? inputArr;
    const n          = inputArr.length;

    // Status bar label
    const statusLabel = (() => {
        if (!currentEv) return '▶ Press Start to begin the Selection Sort visualization';
        if (finished)   return '✅ Selection Sort complete! Array is fully sorted.';
        const map = {
            arr_assign:      '📋 Assigning input array',
            call_selection:  '📞 Calling selection_sort(arr)',
            init_n:          '📏 Computing n = len(arr)',
            outer_iter:      '🔁 Starting outer pass (i loop)',
            init_min:        '📌 Setting min_index = i',
            inner_iter:      '→ Advancing j to scan next element',
            compare:         '🔎 Comparing arr[j] with arr[min_index]',
            update_min:      '🏷 Found new minimum — updating min_index',
            check_swap:      '🔍 Checking if swap is needed',
            swap_exec:       '↔️ Swapping arr[i] and arr[min_index]',
            no_swap:         '✓ Already in place — no swap needed',
            return_arr:      '↩️ Returning sorted array',
            final_done:      '✅ Printing sorted result',
        };
        return map[currentEv.type] ?? '';
    })();

    const controls = (
        <VisualizerControls
            speed={speed} setSpeed={setSpeed}
            eventIdx={eventIdx} playing={playing} finished={finished}
            onPlay={handlePlay} onPause={handlePause}
            onReset={handleReset} onBack={handleBack} onNext={handleNext}
        />
    );

    return (
        <SyncedVisualizerShell
            code={code}
            activeLine={activeLine}
            executedLines={executedLines}
            drawerState={drawerState}
            setDrawerState={setDrawerState}
            controls={controls}
        >
            <div className="scale-110 md:scale-100 origin-center">
                <ArrayVisual arr={displayArr} ev={currentEv} n={n} />
            </div>
            <AnnotationCard text={currentEv?.annotation} />
        </SyncedVisualizerShell>
    );
};

export default SelectionSortSyncedVisualizer;
