/**
 * BinarySearchVisualizer
 *
 * Step-by-step visualizer for Binary Search.
 * Follows the exact same structure as BubbleSortSyncedVisualizer:
 *   Left:  ArrayVisual (PointerBadgeRow + array box + index row) + AnnotationCard + status bar
 *   Right: VisualizerControls + SyncedCodePanel
 *
 * Input format: "[3,12,18,25,31,42,63],31"  (sorted array, target)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import PointerBadgeRow    from './PointerBadgeRow';
import VisualizerControls from './VisualizerControls';
import { SyncedCodePanel, AnnotationCard, useVisualizerPlayback, BLINK_ANIM, BLINK_TRANS } from './visualizerShared';

// ── Layout constants (match BubbleSortSyncedVisualizer exactly) ──────────────
const CELL_W   = 40;
const CELL_H   = 40;
const CELL_GAP = 5;
const STRIDE   = CELL_W + CELL_GAP;   // 45

// ── Line numbers (1-indexed, matching code template in DSAProblemPage) ────────
const LINE = {
    FN_DEF:        1,
    INIT_LEFT:     2,
    INIT_RIGHT:    3,
    WHILE_CHECK:   5,
    CALC_MID:      6,
    IF_EQUAL:      8,
    RETURN_FOUND:  9,
    ELIF_LESS:    11,
    UPDATE_LEFT:  12,
    ELSE:         14,
    UPDATE_RIGHT: 15,
    RETURN_NEG1:  17,
    ARR_ASSIGN:   20,
    TARGET_ASSIGN:21,
    CALL_FN:      22,
    PRINT:        23,
};

// ── Delays per event type (ms at 1× speed) ───────────────────────────────────
const DELAY = {
    arr_assign:      1800,
    target_assign:   1600,
    call_fn:         1800,
    fn_entry:        1600,
    init_left:       1400,
    init_right:      1400,
    while_check:     1800,
    calc_mid:        1600,
    compare_equal:   2000,
    return_found:    2400,
    check_elif:      1600,
    compare_less:    1800,
    update_left:     1800,
    compare_greater: 1800,
    update_right:    1800,
    while_fail:      2200,
    return_not_found:2400,
    assign_result:   1800,
    print_result:    2000,
};

const getDelay = (ev, speed) => (DELAY[ev.type] ?? 1400) / speed;

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_ARR    = [3, 12, 18, 25, 31, 42, 63];
const DEFAULT_TARGET = 31;

// ── Simulation — push pattern matching BubbleSortSyncedVisualizer ─────────────
function simulate(arr, target) {
    const events = [];
    const push = (type, extra = {}, codeLine, annotation) => {
        events.push({ type, arr: [...arr], target, codeLine, annotation, ...extra });
    };

    push('arr_assign',    { left: 0, right: arr.length - 1, mid: null, found: false },
         LINE.ARR_ASSIGN,    `arr = [${arr.join(', ')}]`);
    push('target_assign', { left: 0, right: arr.length - 1, mid: null, found: false },
         LINE.TARGET_ASSIGN, `target = ${target}`);
    push('call_fn',       { left: 0, right: arr.length - 1, mid: null, found: false },
         LINE.CALL_FN,       `Calling binary_search(arr, ${target})`);
    push('fn_entry',      { left: 0, right: arr.length - 1, mid: null, found: false },
         LINE.FN_DEF,        `Entering binary_search — will halve the search range each iteration`);
    push('init_left',     { left: 0, right: arr.length - 1, mid: null, found: false },
         LINE.INIT_LEFT,     `left = 0  →  search starts at index 0`);
    push('init_right',    { left: 0, right: arr.length - 1, mid: null, found: false },
         LINE.INIT_RIGHT,    `right = ${arr.length - 1}  →  search ends at last index`);

    let left  = 0;
    let right = arr.length - 1;

    while (left <= right) {
        push('while_check', { left, right, mid: null, found: false },
             LINE.WHILE_CHECK,
             `left(${left}) ≤ right(${right}) → True, search space has ${right - left + 1} element(s)`);

        const mid = left + Math.floor((right - left) / 2);
        push('calc_mid', { left, right, mid, found: false },
             LINE.CALC_MID,
             `mid = ${left} + (${right} − ${left}) // 2 = ${mid}  →  check arr[${mid}] = ${arr[mid]}`);

        // Always evaluate the if-check at line 8 before branching
        push('check_if', { left, right, mid, found: false },
             LINE.IF_EQUAL,
             `if arr[${mid}] == target  →  ${arr[mid]} == ${target}? ${arr[mid] === target ? 'Yes ✓ → Found!' : 'No'}`);

        if (arr[mid] === target) {
            push('return_found', { left, right, mid, found: true },
                 LINE.RETURN_FOUND,
                 `return ${mid}  →  target ${target} is at index ${mid} ✓`);
            push('assign_result', { left, right, mid, found: true, result: mid },
                 LINE.CALL_FN,
                 `result = binary_search(arr, ${target})  →  result = ${mid}`);
            push('print_result',  { left, right, mid, found: true, result: mid },
                 LINE.PRINT,
                 `print("Index:", result)  →  Index: ${mid}`);
            return { events };
        } else if (arr[mid] < target) {
            push('compare_less', { left, right, mid, found: false },
                 LINE.ELIF_LESS,
                 `arr[${mid}] = ${arr[mid]} < target(${target}) → discard left half, move L right`);
            left = mid + 1;
            push('update_left', { left, right, mid, found: false },
                 LINE.UPDATE_LEFT,
                 `left = ${mid} + 1 = ${left}  →  new search range [${left}..${right}]`);
        } else {
            // Show elif being evaluated (and found False) before reaching else
            push('check_elif', { left, right, mid, found: false },
                 LINE.ELIF_LESS,
                 `elif arr[${mid}] < target  →  ${arr[mid]} < ${target}? No`);
            push('compare_greater', { left, right, mid, found: false },
                 LINE.ELSE,
                 `arr[${mid}] = ${arr[mid]} > target(${target}) → discard right half, move R left`);
            right = mid - 1;
            push('update_right', { left, right, mid, found: false },
                 LINE.UPDATE_RIGHT,
                 `right = ${mid} - 1 = ${right}  →  new search range [${left}..${right}]`);
        }
    }

    push('while_fail',       { left, right, mid: null, found: false },
         LINE.WHILE_CHECK,
         `left(${left}) > right(${right}) → False, search space exhausted`);
    push('return_not_found', { left, right, mid: null, found: false },
         LINE.RETURN_NEG1,
         `return -1  →  ${target} is not present in the array`);
    push('assign_result', { left, right, mid: null, found: false, result: -1 },
         LINE.CALL_FN,
         `result = binary_search(arr, ${target})  →  result = -1`);
    push('print_result',  { left, right, mid: null, found: false, result: -1 },
         LINE.PRINT,
         `print("Index:", result)  →  Index: -1`);

    return { events };
}

// ── Cell background (matching BubbleSortSyncedVisualizer style) ──────────────
const getCellBg = (idx, ev) => {
    if (!ev) return 'bg-slate-700 border-slate-500 text-slate-100';

    const { type, left = 0, right = -1, mid = null, found = false } = ev;
    const isNotFound = type === 'return_not_found' || type === 'while_fail';

    if (isNotFound)
        return 'bg-slate-800 border-slate-700 text-slate-600';
    if (found && idx === mid)
        return 'bg-emerald-500 border-emerald-300 text-white ring-2 ring-emerald-300 shadow-lg shadow-emerald-400/50';
    if (type === 'check_if' && idx === mid && mid !== null)
        return 'bg-sky-500 border-amber-400 text-white ring-2 ring-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.5)]';
    if (idx === mid && mid !== null)
        return 'bg-sky-500 border-sky-300 text-white ring-2 ring-sky-300 shadow-md shadow-sky-400/40';
    if (idx < left || idx > right)
        return 'bg-slate-800 border-slate-700 text-slate-500';
    return 'bg-slate-700 border-slate-500 text-slate-100';
};

// ── ArrayVisual — PointerBadgeRow + array box + index row ────────────────────
const ArrayVisual = ({ arr, ev, n }) => {
    if (!arr || arr.length === 0) return null;

    const type = ev?.type ?? '';
    const left = ev?.left ?? 0;
    const right = ev?.right ?? n - 1;
    const mid   = ev?.mid  ?? null;

    const SHOW_L = new Set([
        'init_left','init_right','while_check','calc_mid','check_if','compare_equal','compare_less',
        'compare_greater','return_found','update_left','update_right',
        'while_fail','return_not_found',
    ]);
    const SHOW_R = new Set([
        'init_right','while_check','calc_mid','check_if','compare_equal','compare_less',
        'compare_greater','return_found','update_left','update_right',
        'while_fail','return_not_found',
    ]);

    const showLeft  = SHOW_L.has(type);
    const showRight = SHOW_R.has(type);
    const showMid   = mid !== null && SHOW_R.has(type);

    const target      = ev?.target ?? null;
    const isCheckIf   = type === 'check_if' || type === 'check_elif' || type === 'compare_equal' || type === 'compare_less';

    const isLRSame  = type === 'while_check';

    return (
        <div className="flex flex-col items-center gap-0">

            {/* Target box — above the pointer row */}
            {target !== null && (
                <div
                    className={isCheckIf ? 'shimmer-border' : ''}
                    style={{ marginBottom: 28 }}
                >
                    <div
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold select-none text-slate-200 transition-colors duration-300 ${
                            isCheckIf
                                ? 'rounded-[8px] bg-slate-800'
                                : 'rounded-xl border-2 border-slate-600 bg-slate-800/60'
                        }`}
                    >
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">target</span>
                        <span>{target}</span>
                    </div>
                </div>
            )}

            {/* PointerBadgeRow — L (emerald), M (sky, j1), R (rose) */}
            <PointerBadgeRow
                cellW={CELL_W}
                cellGap={CELL_GAP}
                count={n}
                iRel={showLeft  ? left  : null}
                jRel={showRight ? right : null}
                j1Rel={showMid  ? mid   : null}
                iClass="bg-emerald-500"
                jClass="bg-rose-500"
                j1Class="bg-sky-500"
                iLabel="L"
                jLabel="R"
                j1Label="M"
                blink={isLRSame}
            />

            {/* Array box — same style as BubbleSortSyncedVisualizer */}
            <div
                className="flex flex-col rounded-xl border-2 border-slate-600 bg-slate-800/60"
                style={{ padding: '10px 16px' }}
            >
                <div className="flex items-center" style={{ gap: CELL_GAP }}>
                    {arr.map((val, idx) => {
                        const isShimmerCell = isCheckIf && idx === mid && mid !== null;
                        return isShimmerCell ? (
                            <div
                                key={idx}
                                className="shimmer-border flex-shrink-0"
                                style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W, borderRadius: 8, padding: 2 }}
                            >
                                <div
                                    className="flex items-center justify-center rounded-[6px] bg-sky-500 text-white text-sm font-bold w-full h-full"
                                >
                                    {val}
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                key={idx}
                                layout
                                className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 select-none transition-colors duration-300 ${getCellBg(idx, ev)}`}
                                style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0 }}
                            >
                                {val}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Index row */}
            <div className="flex items-center mt-1" style={{ gap: CELL_GAP }}>
                {arr.map((_, idx) => (
                    <div key={idx} style={{ width: CELL_W }}
                        className="flex justify-center text-[10px] text-slate-600 font-mono select-none">
                        {idx}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const BinarySearchVisualizer = ({
    customArray = '[3,12,18,25,31,42,63],31',
    code        = '',
    onProgress,
    seekRef,
    showCode    = true,
    onCloseCode,
}) => {
    const [arr, target] = useMemo(() => {
        try {
            const str      = String(customArray ?? '').trim();
            const commaIdx = str.lastIndexOf(',');
            if (commaIdx < 0) return [DEFAULT_ARR, DEFAULT_TARGET];
            const arrPart = str.slice(0, commaIdx).trim();
            const tgtPart = str.slice(commaIdx + 1).trim();
            const parsed  = JSON.parse(arrPart);
            const tgt     = parseInt(tgtPart, 10);
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
            const sorted  = [...parsed].map(Number).sort((a, b) => a - b);
            return [sorted, isNaN(tgt) ? DEFAULT_TARGET : tgt];
        } catch {
            return [DEFAULT_ARR, DEFAULT_TARGET];
        }
    }, [customArray]);

    const { events } = useMemo(() => simulate(arr, target), [arr, target]);

    const { eventIdx, playing, finished, speed, setSpeed,
            handlePlay, handlePause, handleReset, handleBack, handleNext,
            currentEv, activeLine, executedLines } =
        useVisualizerPlayback({ events, getDelay, inputArr: arr, seekRef, onProgress });

    const displayArr = currentEv?.arr ?? arr;
    const n          = arr.length;

    // Status bar — same pattern as BubbleSortSyncedVisualizer
    const statusLabel = (() => {
        if (!currentEv) return '▶ Press Play to begin the Binary Search visualization';
        if (finished) {
            const found = currentEv.found;
            return `✅ Binary Search complete! ${found ? `Target found at index ${currentEv.mid}` : 'Target not found — returned −1'}`;
        }
        const map = {
            arr_assign:      '📋 Assigning sorted input array',
            target_assign:   '🎯 Setting target value to search for',
            call_fn:         '📞 Calling binary_search(arr, target)',
            fn_entry:        '⚙️ Entering function — initialising left and right pointers',
            init_left:       '← Setting left = 0 (start of array)',
            init_right:      '→ Setting right = len(arr) − 1 (end of array)',
            while_check:     '🔁 Checking if search space is non-empty (left ≤ right)',
            calc_mid:        '📐 Computing mid — checking the middle element',
            compare_equal:   '🎯 arr[mid] == target — element found!',
            return_found:    '✅ Returning mid index — target located',
            compare_less:    '→ arr[mid] < target — target is in the RIGHT half',
            update_left:     '↪ Moving L pointer right: left = mid + 1',
            compare_greater: '← arr[mid] > target — target is in the LEFT half',
            update_right:    '↩ Moving R pointer left: right = mid − 1',
            while_fail:      '❌ left > right — search space exhausted',
            return_not_found:'↩️ Returning −1 — target not found in array',
        };
        return map[currentEv.type] ?? '';
    })();

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
            <div className="flex-1 flex overflow-hidden min-h-0">

                {/* ── Left: array visualization ── */}
                <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
                    <div className="flex-1 flex flex-col items-center justify-center overflow-auto px-3 py-4 gap-5 md:px-8 md:py-10 md:gap-8">

                        {/* Array */}
                        <div className="scale-110 md:scale-100 origin-center">
                            <ArrayVisual arr={displayArr} ev={currentEv} n={n} />
                        </div>

                        {/* Annotation card */}
                        <AnnotationCard text={currentEv?.annotation} />

                    </div>

                    {/* Mobile-only controls bar */}
                    <div className="md:hidden flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-slate-800 border-t border-slate-700/50">
                        <button onClick={handleReset} disabled={eventIdx < 0}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700/80 text-slate-300 text-xs font-semibold disabled:opacity-30 active:scale-95 transition-all">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/></svg>
                            Reset
                        </button>
                        <button onClick={handleBack} disabled={eventIdx < 0}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-700/80 text-slate-200 text-sm font-semibold disabled:opacity-30 active:scale-95 transition-all">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd"/></svg>
                            Prev
                        </button>
                        <span className="text-slate-500 text-xs font-mono min-w-[54px] text-center">
                            {eventIdx < 0 ? '\u2014' : `${eventIdx + 1}/${events.length}`}
                        </span>
                        <button onClick={handleNext} disabled={finished}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-30 active:scale-95 transition-all shadow-md shadow-indigo-900/40">
                            Next
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/></svg>
                        </button>
                    </div>

                    {/* Status bar */}
                    <div className="flex-shrink-0 px-3 py-2 md:px-6 md:py-3 bg-slate-900/80 border-t border-slate-700/50 text-slate-300 text-xs md:text-sm font-medium">
                        {statusLabel}
                    </div>
                </div>

                {/* ── Right: controls + code panel ── */}
                <div className={`flex-col border-slate-700/60 bg-slate-900 overflow-hidden fixed inset-y-0 right-0 w-full max-w-[380px] z-40 shadow-2xl md:relative md:inset-auto md:z-auto md:flex-shrink-0 md:h-full md:w-[380px] md:shadow-none md:border-l ${showCode ? 'flex' : 'hidden md:flex'}`}>
                    <VisualizerControls
                        speed={speed} setSpeed={setSpeed}
                        eventIdx={eventIdx} playing={playing} finished={finished}
                        onPlay={handlePlay} onPause={handlePause}
                        onReset={handleReset} onBack={handleBack} onNext={handleNext}
                        onCloseCode={onCloseCode}
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

export default BinarySearchVisualizer;
