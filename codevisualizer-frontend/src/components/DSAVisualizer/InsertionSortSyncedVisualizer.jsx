/**
 * InsertionSortSyncedVisualizer
 *
 * "Code Execution" tab for Insertion Sort.
 * Flat single-array view:
 *   - i (sky badge) marks the element being inserted (the "key")
 *   - j (pink badge) slides LEFT through the sorted region, shifting elements right
 *   - j+1 (amber cell) shows the shift target cell
 *   - Sorted zone grows from the LEFT (emerald) after each insertion
 *   - Annotation card shows current key value and operation
 * Code panel on the right with line highlighting + VisualizerControls.
 */

import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import { AnnotationCard, BLINK_ANIM, BLINK_TRANS, parseInputArray, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

// ── Layout constants ─────────────────────────────────────────────────────────
const CELL_W   = 44;
const CELL_H   = 44;
const CELL_GAP = 6;
const STRIDE   = CELL_W + CELL_GAP;   // 50

// ── Line numbers (1-indexed, matching the code template) ────────────────────
const LINE = {
    FN_DEF:         1,
    INIT_N:         2,
    OUTER_FOR:      4,
    PICK_KEY:       5,
    INIT_J:         6,
    WHILE_CHECK:    10,
    SHIFT:          11,
    DECREMENT_J:    12,
    PLACE_KEY:      14,
    RETURN_ARR:     16,
    ARR_ASSIGN:     20,
    CALL_INSERTION: 22,
    PRINT:          23,
};

// ── Delays per event type (ms at 1× speed) ──────────────────────────────────
const DELAY = {
    arr_assign:      1800,
    call_insertion:  2000,
    init_n:          1600,
    outer_iter:      2200,
    pick_key:        1800,
    init_j:          1800,
    while_check:     1600,
    shift:           2000,
    decrement_j:     1400,
    place_key:       2200,
    return_arr:      2000,
    final_done:      2600,
};

const getDelay = makeGetDelay(DELAY, 1200);

// ── Simulation: walks through insertion sort and emits rich events ───────────
const simulateInsertionSort = (inputArr) => {
    const arr    = [...inputArr];
    const n      = arr.length;
    const events = [];

    const push = (type, extra = {}, codeLine, annotation) => {
        events.push({ type, arr: [...arr], codeLine, annotation, ...extra });
    };

    // Preamble
    push('arr_assign',     { sortedCount: 0 },         LINE.ARR_ASSIGN,     `arr = [${arr.join(', ')}]`);
    push('call_insertion', { sortedCount: 0 },         LINE.CALL_INSERTION, `Calling insertion_sort(arr)`);
    push('init_n',         { sortedCount: 0 },         LINE.INIT_N,         `n = len(arr) = ${n}`);

    for (let i = 1; i < n; i++) {
        // At the start of each outer iter, indices 0..i-1 are sorted
        push('outer_iter', { i, sortedCount: i }, LINE.OUTER_FOR,
            `Outer loop — i = ${i}  (inserting arr[${i}] = ${arr[i]} into sorted region)`);

        const key = arr[i];
        push('pick_key', { i, key, sortedCount: i }, LINE.PICK_KEY,
            `key = arr[${i}] = ${key}  (element to insert)`);

        let j = i - 1;
        push('init_j', { i, j, key, sortedCount: i }, LINE.INIT_J,
            `j = i - 1 = ${j}  (start scanning left from position ${j})`);

        // While loop iterations
        while (j >= 0 && arr[j] > key) {
            push('while_check', { i, j, key, passed: true, sortedCount: i }, LINE.WHILE_CHECK,
                `j=${j} ≥ 0 and arr[${j}]=${arr[j]} > key=${key}  →  True, shift right`);

            arr[j + 1] = arr[j];
            push('shift', { i, j, key, shiftFrom: j, shiftTo: j + 1, sortedCount: i }, LINE.SHIFT,
                `arr[${j + 1}] = arr[${j}] = ${arr[j + 1]}  (shifted right)`);

            j -= 1;
            push('decrement_j', { i, j, key, sortedCount: i }, LINE.DECREMENT_J,
                `j -= 1  →  j = ${j}`);
        }

        // Check that failed (or first fail if j < 0)
        const failReason = j < 0
            ? `j = ${j} < 0  →  stop (reached left boundary)`
            : `j=${j} ≥ 0 and arr[${j}]=${arr[j]} > key=${key}  →  False, stop`;
        push('while_check', { i, j, key, passed: false, sortedCount: i }, LINE.WHILE_CHECK,
            failReason);

        // Place key
        const placedAt = j + 1;
        arr[placedAt] = key;
        push('place_key', { i, j, key, placedAt, sortedCount: i + 1 }, LINE.PLACE_KEY,
            `arr[${placedAt}] = key = ${key}  →  inserted! Array: [${arr.join(', ')}]`);
    }

    push('return_arr', { sortedCount: n }, LINE.RETURN_ARR,     `return [${arr.join(', ')}]`);
    push('final_done', { sortedCount: n }, LINE.CALL_INSERTION, `sorted_arr = insertion_sort(arr)  →  [${arr.join(', ')}]`);
    push('final_done', { sortedCount: n }, LINE.PRINT,          `Sorted Array: [${arr.join(', ')}]`);

    return { events, finalArr: [...arr] };
};

// ── Array visual ──────────────────────────────────────────────────────────────
const ArrayVisual = ({ arr, ev, n }) => {
    if (!arr || arr.length === 0) return null;

    // Remember the last seen j so badge persists across events that don't carry j
    const lastJRef = useRef(undefined);

    const {
        type,
        i:         iIdx,
        j:         jIdx,
        key:       keyVal,
        sortedCount = 0,
        shiftFrom,
        shiftTo,
        placedAt,
    } = ev ?? {};

    // Update lastJ whenever this event carries a real j value
    if (jIdx !== undefined && jIdx !== null) lastJRef.current = jIdx;
    // Reset when a fresh outer iteration starts (before j is set this pass)
    if (type === 'arr_assign' || type === 'call_insertion' || type === 'init_n') lastJRef.current = undefined;

    const stableJ = lastJRef.current;  // may be -1 (OOB) or undefined (not yet set)

    // Which events show which pointers
    const showIPtr   = ['outer_iter', 'pick_key', 'init_j', 'while_check', 'shift', 'decrement_j', 'place_key'].includes(type);
    const showJPtr   = stableJ !== undefined; // show as long as j has ever been assigned

    // Key box: floats above i; also shows on place_key so it can fly into the slot
    const showKeyBox = ['pick_key', 'init_j', 'while_check', 'shift', 'decrement_j', 'place_key'].includes(type)
                       && keyVal !== undefined && iIdx !== undefined && iIdx >= 0 && iIdx < n;

    const getCellBg = (idx) => {
        const isSorted   = ['return_arr', 'final_done'].includes(type) && idx < sortedCount;
        const isPlaced   = type === 'place_key'   && idx === placedAt;
        const isShiftSrc = type === 'shift'       && idx === shiftFrom;
        const isShiftDst = type === 'shift'       && idx === shiftTo;
        const isJCompare = type === 'while_check' && idx === jIdx;
        const isKeyCell  = type === 'while_check' && idx === iIdx;
        const isIKey     = type === 'pick_key'    && idx === iIdx;

        if (isPlaced)    return 'bg-amber-400 border-amber-300 text-slate-900 ring-2 ring-amber-200 shadow-md shadow-amber-400/50';
        if (isShiftDst)  return 'bg-yellow-400  border-yellow-300 text-slate-900 ring-2 ring-yellow-200 shadow-md shadow-yellow-400/40';
        if (isShiftSrc)  return 'bg-pink-600    border-pink-400   text-white     ring-2 ring-pink-300   shadow-md shadow-pink-500/40';
        if (isJCompare)  return 'bg-pink-600    border-pink-400   text-white     ring-2 ring-pink-300   shadow-md shadow-pink-500/40';
        if (isKeyCell)   return 'bg-amber-400   border-amber-300  text-slate-900 ring-2 ring-amber-200  shadow-md shadow-amber-400/50';
        if (isIKey)      return 'bg-amber-400   border-amber-300  text-slate-900 ring-2 ring-amber-200  shadow-md shadow-amber-400/50';
        if (isSorted)    return 'bg-emerald-600 border-emerald-400 text-white     ring-1 ring-emerald-300/50';
        return 'bg-slate-700 border-slate-500 text-slate-100';
    };

    const shouldBlink = (idx) =>
        type === 'while_check' && idx === jIdx;

    const blinkAnim  = BLINK_ANIM;
    const blinkTrans = BLINK_TRANS;

    const rowW = n * CELL_W + Math.max(0, n - 1) * CELL_GAP;

    const cells = arr.map((val, idx) => {
        // During shift, hide the shiftTo cell's value — the flying copy is the visual actor
        const isShiftDstCell = type === 'shift' && idx === shiftTo;
        return (
            <motion.div
                key={idx}
                className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 select-none ${getCellBg(idx)}`}
                style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W }}
                animate={shouldBlink(idx) ? blinkAnim : { opacity: 1 }}
                transition={shouldBlink(idx) ? blinkTrans : { duration: 0 }}
            >
                <span style={{ opacity: isShiftDstCell ? 0 : 1 }}>{val}</span>
            </motion.div>
        );
    });

    return (
        <div className="flex flex-col items-center gap-0" style={{ position: 'relative' }}>

            {/* ── Key variable box — floats above i; flies into slot on place_key ── */}
            <div style={{ position: 'relative', width: rowW, height: 64, flexShrink: 0 }}>
                <AnimatePresence>
                    {showKeyBox && (
                        <motion.div
                            key="key-box"
                            className="absolute flex flex-col items-center"
                            style={{ bottom: 0, left: 0, width: CELL_W }}
                            initial={{ x: iIdx * STRIDE, opacity: 0, y: -6 }}
                            animate={{
                                x: type === 'place_key' ? placedAt * STRIDE : iIdx * STRIDE,
                                opacity: 1,
                                y: type === 'place_key' ? 76 : 0,
                            }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={type === 'place_key'
                                ? { type: 'spring', stiffness: 200, damping: 24, mass: 1 }
                                : { type: 'spring', stiffness: 300, damping: 26 }
                            }
                        >
                            {/* "key" label */}
                            <span className="text-[9px] font-mono font-bold text-amber-400/90 tracking-wide mb-0.5">
                                key
                            </span>
                            {/* Value cell */}
                            <motion.div
                                className="flex items-center justify-center rounded-lg border-2 border-amber-400 bg-amber-400/20 text-amber-300 font-bold text-sm select-none"
                                style={{ width: CELL_W, height: CELL_H }}
                                animate={type === 'while_check' ? blinkAnim : { opacity: 1 }}
                                transition={type === 'while_check' ? blinkTrans : { duration: 0 }}
                            >
                                {keyVal}
                            </motion.div>
                            {/* Connector line — hide while dropping */}
                            {type !== 'place_key' && (
                                <div className="w-px bg-amber-400/50" style={{ height: 8 }} />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Pointer badge row (above array) — shared PointerBadgeRow ── */}
            {(() => {
                const jOOB      = stableJ !== undefined && stableJ < 0;
                const jBlinking = type === 'while_check' && !ev?.passed && jOOB;
                return (
                    <PointerBadgeRow
                        cellW={CELL_W}
                        cellGap={CELL_GAP}
                        count={n}
                        iRel={showIPtr && iIdx !== undefined && iIdx !== null && iIdx >= 0 && iIdx < n ? iIdx : null}
                        jRel={showJPtr ? (stableJ < 0 ? -1 : stableJ) : null}
                        iClass="bg-sky-500"
                        jClass="bg-pink-600"
                        jBlink={jBlinking}
                    />
                );
            })()}

            {/* ── Cell row ── */}
            <div className="flex items-center" style={{ gap: CELL_GAP, position: 'relative' }}>
                {cells}

                {/* ── Flying copy: arr[j] → arr[j+1] during shift — arc down-right-up ── */}
                <AnimatePresence>
                    {type === 'shift' && shiftFrom !== undefined && shiftTo !== undefined && (
                        <motion.div
                            key={`fly-${shiftFrom}-${shiftTo}`}
                            className="absolute top-0 flex items-center justify-center rounded-lg border-2 border-amber-300 bg-amber-400 text-slate-900 text-sm font-bold pointer-events-none z-20 shadow-lg shadow-amber-400/60"
                            style={{ width: CELL_W, height: CELL_H, left: 0 }}
                            initial={{ x: shiftFrom * STRIDE, y: 0, opacity: 1, scale: 1.05 }}
                            animate={{
                                x: [shiftFrom * STRIDE, shiftFrom * STRIDE, shiftTo * STRIDE, shiftTo * STRIDE],
                                y: [0, 38, 38, 0],
                                opacity: 1,
                                scale: [1.05, 1.1, 1.1, 1],
                            }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.7, ease: 'easeInOut', times: [0, 0.3, 0.7, 1] }}
                        >
                            {arr[shiftFrom]}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Index numbers ── */}
            <div className="flex items-center" style={{ gap: CELL_GAP, marginTop: 3 }}>
                {arr.map((_, idx) => (
                    <div key={idx} style={{ width: CELL_W }} className="flex justify-center text-[10px] text-slate-600 font-mono select-none">
                        {idx}
                    </div>
                ))}
            </div>

            {/* ── j+1 badge below index row — visible during shift and place_key ── */}
            <PointerBadgeRow
                cellW={CELL_W}
                cellGap={CELL_GAP}
                count={n}
                j1Rel={['shift', 'place_key'].includes(type) ? stableJ + 1 : null}
                j1Class="bg-yellow-400"
            />

            {/* ── Sorted zone label — always reserves height to prevent layout shifts ── */}
            <div className="flex items-center" style={{ gap: CELL_GAP, marginTop: 4, height: 16 }}>
                {['return_arr', 'final_done'].includes(type) && sortedCount > 0 && sortedCount < n && arr.map((_, idx) => (
                    <div key={idx} style={{ width: CELL_W }} className="flex justify-center">
                        {idx === sortedCount && (
                            <span className="text-[9px] text-emerald-400/80 font-semibold tracking-wide whitespace-nowrap">
                                ← sorted
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const InsertionSortSyncedVisualizer = ({
    customArray    = '[12, 11, 13, 5, 6]',
    code           = '',
    onProgress,
    seekRef,
    showCode       = true,
    onCloseCode,
    drawerState    = 'peek',
    setDrawerState,
}) => {
    const inputArr = useMemo(() => parseInputArray(customArray, [12, 11, 13, 5, 6]), [customArray]);

    const { events, finalArr } = useMemo(() => simulateInsertionSort(inputArr), [inputArr]);

    // ── Playback state machine ────────────────────────────────────────────────
    const { eventIdx, playing, finished, speed, setSpeed,
            handlePlay, handlePause, handleReset, handleBack, handleNext,
            currentEv, activeLine, executedLines } =
        useVisualizerPlayback({ events, getDelay, inputArr, seekRef, onProgress });

    const displayArr = currentEv?.arr ?? inputArr;
    const n          = inputArr.length;

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

export default InsertionSortSyncedVisualizer;
