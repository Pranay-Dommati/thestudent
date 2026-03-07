/**
 * SearchRotatedArrayVisualizer — LC 33 "Search in Rotated Sorted Array"
 *
 * Binary search on a sorted array that has been rotated at an unknown pivot.
 * At every iteration we first determine which of the two halves is sorted,
 * then check whether the target lies inside that sorted half.
 *
 * Visual highlights:
 *   amber-400/40  = sorted LEFT  half [low..mid-1] when identified
 *   violet-500/40 = sorted RIGHT half [mid+1..high] when identified
 *   sky-500       = mid cell being checked
 *   emerald-500   = target found at mid
 *   slate-800     = cells outside active [low..high] range
 */

import React, { useMemo } from 'react';
import VisualizerControls from './VisualizerControls';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import SearchArrayVisual from './SearchArrayVisual';
import { AnnotationCard, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

// ── Line numbers (1-indexed, matching code template in DSAProblemPage) ────────
const LINE = {
    FN_DEF:              1,
    INIT_LOW:            2,
    INIT_HIGH:           3,
    WHILE:               5,
    CALC_MID:            6,
    IF_EQUAL:            8,
    RETURN_FOUND:        9,
    CHECK_LEFT_SORTED:  12,
    IF_IN_LEFT:         14,
    UPDATE_HIGH:        15,
    UPDATE_LOW_LEFT:    17,
    ELSE_RIGHT:         20,
    IF_IN_RIGHT:        22,
    UPDATE_LOW_RIGHT:   23,
    UPDATE_HIGH_RIGHT:  25,
    RETURN_NEG1:        27,
    NUMS_ASSIGN:        30,
    TARGET_ASSIGN:      31,
    CALL_FN:            32,
    PRINT:              33,
};

// ── Delays per event type (ms at 1× speed) ───────────────────────────────────
const DELAY = {
    nums_assign:          1600,
    target_assign:        1600,
    call_fn:              1800,
    fn_entry:             1600,
    init_low:             1200,
    init_high:            1200,
    while_check:          1800,
    calc_mid:             1600,
    check_equal:          2000,
    return_found:         2400,
    check_left_sorted:    2200,
    check_in_left:        2200,
    update_high:          1800,
    update_low_left:      1800,
    right_sorted_else:    1600,
    check_in_right:       2200,
    update_low_right:     1800,
    update_high_right:    1800,
    while_fail:           2200,
    return_neg1:          2400,
    assign_result:        1800,
    print_result:         2000,
};

const getDelay = makeGetDelay(DELAY, 1400);

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_ARR    = [4, 5, 6, 7, 0, 1, 2];
const DEFAULT_TARGET = 0;

// ── Simulation ────────────────────────────────────────────────────────────────
function simulate(nums, target) {
    const events = [];
    const n = nums.length;

    // Events use `left` / `right` so SearchArrayVisual (which reads ev.left / ev.right) works.
    // `left` = low pointer, `right` = high pointer — same semantics, different name.
    const push = (type, extra = {}, codeLine, annotation) =>
        events.push({ type, nums: [...nums], target, codeLine, annotation,
            left: extra.low ?? 0, right: extra.high ?? n - 1, ...extra });

    const base = { low: 0, high: n - 1, mid: null, found: false, sortedSide: null };

    push('nums_assign',   { ...base }, LINE.NUMS_ASSIGN,   `nums = [${nums.join(', ')}]`);
    push('target_assign', { ...base }, LINE.TARGET_ASSIGN, `target = ${target}`);
    push('call_fn',       { ...base }, LINE.CALL_FN,       `Calling search_rotated(nums, ${target})`);
    push('init_low',      { ...base }, LINE.INIT_LOW,      `low = 0`);
    push('init_high',     { ...base }, LINE.INIT_HIGH,     `high = ${n - 1}`);

    let low = 0, high = n - 1;

    while (low <= high) {
        push('while_check',
            { low, high, mid: null, found: false, sortedSide: null },
            LINE.WHILE,
            `low(${low}) ≤ high(${high}) → True  →  ${high - low + 1} element(s) in range`);

        const mid = low + Math.floor((high - low) / 2);
        push('calc_mid',
            { low, high, mid, found: false, sortedSide: null },
            LINE.CALC_MID,
            `mid = ${low} + (${high} − ${low}) // 2 = ${mid}  →  nums[${mid}] = ${nums[mid]}`);

        const isEqual = nums[mid] === target;
        push('check_equal',
            { low, high, mid, found: isEqual, sortedSide: null },
            LINE.IF_EQUAL,
            `nums[${mid}](${nums[mid]}) == target(${target})? ${isEqual ? 'Yes ✓  →  Found!' : 'No  →  continue searching'}`);

        if (isEqual) {
            push('return_found',
                { low, high, mid, found: true, sortedSide: null },
                LINE.RETURN_FOUND,
                `return ${mid}  →  target ${target} found at index ${mid} ✓`);
            push('assign_result',
                { low, high, mid, found: true, sortedSide: null, result: mid },
                LINE.CALL_FN,
                `result = search_rotated(nums, ${target})  →  result = ${mid}`);
            push('print_result',
                { low, high, mid, found: true, sortedSide: null, result: mid },
                LINE.PRINT,
                `print("Target index:", ${mid})`);
            return { events };
        }

        const leftSorted = nums[low] <= nums[mid];
        push('check_left_sorted',
            { low, high, mid, found: false, sortedSide: leftSorted ? 'left' : 'right' },
            LINE.CHECK_LEFT_SORTED,
            leftSorted
                ? `nums[${low}](${nums[low]}) ≤ nums[${mid}](${nums[mid]}) → True  →  LEFT half [${low}..${mid}] is sorted ★`
                : `nums[${low}](${nums[low]}) ≤ nums[${mid}](${nums[mid]}) → False  →  RIGHT half [${mid}..${high}] is sorted ★`);

        if (leftSorted) {
            const inLeft = nums[low] <= target && target < nums[mid];
            push('check_in_left',
                { low, high, mid, found: false, sortedSide: 'left', inLeft },
                LINE.IF_IN_LEFT,
                inLeft
                    ? `${nums[low]} ≤ ${target} < ${nums[mid]} → True  →  target is inside sorted left half  →  move R left`
                    : `${nums[low]} ≤ ${target} < ${nums[mid]} → False  →  target is outside sorted left half  →  move L right`);

            if (inLeft) {
                high = mid - 1;
                push('update_high',
                    { low, high, mid, found: false, sortedSide: 'left' },
                    LINE.UPDATE_HIGH,
                    `high = ${mid} - 1 = ${high}  →  narrow to left half [${low}..${high}]`);
            } else {
                low = mid + 1;
                push('update_low_left',
                    { low, high, mid, found: false, sortedSide: 'left' },
                    LINE.UPDATE_LOW_LEFT,
                    `low = ${mid} + 1 = ${low}  →  narrow to right half [${low}..${high}]`);
            }
        } else {
            push('right_sorted_else',
                { low, high, mid, found: false, sortedSide: 'right' },
                LINE.ELSE_RIGHT,
                `else  →  RIGHT half [${mid}..${high}] is sorted ★`);

            const inRight = nums[mid] < target && target <= nums[high];
            push('check_in_right',
                { low, high, mid, found: false, sortedSide: 'right', inRight },
                LINE.IF_IN_RIGHT,
                inRight
                    ? `${nums[mid]} < ${target} ≤ ${nums[high]} → True  →  target is inside sorted right half  →  move L right`
                    : `${nums[mid]} < ${target} ≤ ${nums[high]} → False  →  target is outside sorted right half  →  move R left`);

            if (inRight) {
                low = mid + 1;
                push('update_low_right',
                    { low, high, mid, found: false, sortedSide: 'right' },
                    LINE.UPDATE_LOW_RIGHT,
                    `low = ${mid} + 1 = ${low}  →  narrow to right half [${low}..${high}]`);
            } else {
                high = mid - 1;
                push('update_high_right',
                    { low, high, mid, found: false, sortedSide: 'right' },
                    LINE.UPDATE_HIGH_RIGHT,
                    `high = ${mid} - 1 = ${high}  →  narrow to left half [${low}..${high}]`);
            }
        }
    }

    push('while_fail',
        { low, high, mid: null, found: false, sortedSide: null },
        LINE.WHILE,
        `low(${low}) > high(${high}) → False  →  search space exhausted`);
    push('return_neg1',
        { low, high, mid: null, found: false, sortedSide: null },
        LINE.RETURN_NEG1,
        `return -1  →  ${target} is not in the array`);
    push('assign_result',
        { low, high, mid: null, found: false, sortedSide: null, result: -1 },
        LINE.CALL_FN,
        `result = search_rotated(nums, ${target})  →  result = -1`);
    push('print_result',
        { low, high, mid: null, found: false, sortedSide: null, result: -1 },
        LINE.PRINT,
        `print("Target index:", -1)`);

    return { events };
}

// ── Event type sets ───────────────────────────────────────────────────────────

// Event types where the sorted-half cells should receive a tint
const SORTED_TINT_TYPES = new Set([
    'check_left_sorted',
    'check_in_left',   'update_high',       'update_low_left',
    'right_sorted_else',
    'check_in_right',  'update_low_right',  'update_high_right',
]);

// Event types where out-of-range cells should be dimmed
const RANGE_DIM_TYPES = new Set([
    'while_check', 'calc_mid', 'check_equal',
    'check_left_sorted', 'check_in_left', 'update_high', 'update_low_left',
    'right_sorted_else', 'check_in_right', 'update_low_right', 'update_high_right',
    'while_fail', 'return_neg1',
]);

// ── Cell highlighting ─────────────────────────────────────────────────────────
const getCellBg = (idx, ev) => {
    if (!ev) return 'bg-slate-700 border-slate-500 text-slate-100';
    const { type, left = 0, right = -1, mid = null, found = false, sortedSide = null } = ev;

    // Not-found end states — dim everything
    if (type === 'while_fail' || type === 'return_neg1')
        return 'bg-slate-800 border-slate-700 text-slate-600';

    // Found cell
    if (found && idx === mid)
        return 'bg-emerald-500 border-emerald-300 text-white ring-2 ring-emerald-300 shadow-lg shadow-emerald-400/50';

    // Mid cell — skip if also gets sorted tint coloring above it
    if (idx === mid && mid !== null)
        return 'bg-sky-500 border-sky-300 text-white ring-2 ring-sky-300 shadow-md shadow-sky-400/40';

    // Sorted-half tinting (excludes mid which is sky above, and check events
    // where only specific pointer cells should be highlighted)
    if (SORTED_TINT_TYPES.has(type) && mid !== null
        && type !== 'check_left_sorted' && type !== 'right_sorted_else'
        && type !== 'check_in_left' && type !== 'check_in_right') {
        if (sortedSide === 'left' && idx >= left && idx < mid)
            return 'bg-amber-400/40 border-amber-400 text-slate-100 shadow-amber-500/20';
        if (sortedSide === 'right' && idx > mid && idx <= right)
            return 'bg-violet-500/40 border-violet-400 text-slate-100 shadow-violet-500/20';
    }

    // Dim cells outside active search range
    if (RANGE_DIM_TYPES.has(type) && (idx < left || idx > right))
        return 'bg-slate-800 border-slate-700 text-slate-500';

    return 'bg-slate-700 border-slate-500 text-slate-100';
};

// ── Pointer visibility sets ───────────────────────────────────────────────────
const SHOW_L = new Set([
    'init_low', 'init_high',
    'while_check', 'calc_mid', 'check_equal', 'return_found',
    'check_left_sorted', 'check_in_left', 'update_high', 'update_low_left',
    'right_sorted_else', 'check_in_right', 'update_low_right', 'update_high_right',
    'while_fail', 'return_neg1',
]);
const SHOW_R = new Set([
    'init_high',
    'while_check', 'calc_mid', 'check_equal', 'return_found',
    'check_left_sorted', 'check_in_left', 'update_high', 'update_low_left',
    'right_sorted_else', 'check_in_right', 'update_low_right', 'update_high_right',
    'while_fail', 'return_neg1',
]);
const SHOW_M = new Set([
    'calc_mid', 'check_equal',
    'check_left_sorted', 'check_in_left', 'update_high', 'update_low_left',
    'right_sorted_else', 'check_in_right', 'update_low_right', 'update_high_right',
]);

// ── Target + sortedHalf top badge ─────────────────────────────────────────────
const RotatedTopSlot = ({ ev, target }) => {
    if (target === null) return null;
    const sortedSide = ev?.sortedSide ?? null;
    const showBadge  = SORTED_TINT_TYPES.has(ev?.type ?? '');

    const isChecking = ev?.type === 'check_equal' || ev?.type === 'check_in_left' || ev?.type === 'check_in_right';
    const isFound    = ev?.found === true;

    return (
        <div className="flex flex-col items-center gap-2" style={{ marginBottom: 28 }}>
            <div className={isChecking && !isFound ? 'shimmer-border' : ''}>
                <div className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold select-none transition-all duration-200 ${
                    isFound
                        ? 'rounded-xl border-2 border-emerald-400 bg-emerald-900/50 text-emerald-200 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                        : isChecking
                            ? 'rounded-[8px] bg-slate-800 text-slate-200'
                            : 'rounded-xl border-2 border-slate-600 bg-slate-800/60 text-slate-200'
                }`}>
                    <span className={`text-xs font-medium uppercase tracking-wider ${isFound ? 'text-emerald-400' : 'text-slate-500'}`}>target</span>
                    <span>{target}</span>
                </div>
            </div>
            {showBadge && sortedSide && (
                <div className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                    sortedSide === 'left'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                        : 'bg-violet-500/10 border-violet-500/40 text-violet-400'
                }`}>
                    {sortedSide === 'left' ? '← Left half sorted' : 'Right half sorted →'}
                </div>
            )}
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const SearchRotatedArrayVisualizer = ({
    customArray    = '[4,5,6,7,0,1,2],0',
    code           = '',
    onProgress,
    seekRef,
    drawerState    = 'peek',
    setDrawerState,
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
            // Do NOT sort — this is a rotated array; order is intentional
            return [parsed.map(Number), isNaN(tgt) ? DEFAULT_TARGET : tgt];
        } catch {
            return [DEFAULT_ARR, DEFAULT_TARGET];
        }
    }, [customArray]);

    const { events } = useMemo(() => simulate(arr, target), [arr, target]);

    const { eventIdx, playing, finished, speed, setSpeed,
            handlePlay, handlePause, handleReset, handleBack, handleNext,
            currentEv, activeLine, executedLines } =
        useVisualizerPlayback({ events, getDelay, inputArr: arr, seekRef, onProgress });

    const n    = arr.length;
    const type = currentEv?.type ?? '';

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
                <SearchArrayVisual
                    arr={currentEv?.nums ?? arr}
                    n={n}
                    ev={currentEv}
                    getCellBg={getCellBg}
                    showL={SHOW_L.has(type)}
                    showR={SHOW_R.has(type)}
                    showM={SHOW_M.has(type)}
                    blink={type === 'while_check'}
                    shimmerIdx={type === 'check_equal' && currentEv?.mid !== null ? currentEv.mid : null}
                    shimmerIdxs={
                        type === 'check_left_sorted' && currentEv?.mid !== null
                            ? [currentEv.left, currentEv.mid]
                            : type === 'right_sorted_else' && currentEv?.mid !== null
                                ? [currentEv.mid, currentEv.right]
                                : type === 'check_in_left' && currentEv?.mid !== null
                                    ? [currentEv.left, currentEv.mid]
                                    : type === 'check_in_right' && currentEv?.mid !== null
                                        ? [currentEv.mid, currentEv.right]
                                        : null
                    }
                    shimmerColors={
                        type === 'check_left_sorted' && currentEv?.mid !== null
                            ? { [currentEv.left]: 'green', [currentEv.mid]: 'amber' }
                            : type === 'right_sorted_else' && currentEv?.mid !== null
                                ? { [currentEv.mid]: 'amber', [currentEv.right]: 'green' }
                                : type === 'check_in_left' && currentEv?.mid !== null
                                    ? { [currentEv.left]: 'green', [currentEv.mid]: 'amber' }
                                    : type === 'check_in_right' && currentEv?.mid !== null
                                        ? { [currentEv.mid]: 'amber', [currentEv.right]: 'green' }
                                        : null
                    }
                    rLabel="H"
                    topSlot={<RotatedTopSlot ev={currentEv} target={target} />}
                />
            </div>
            <AnnotationCard text={currentEv?.annotation} />
        </SyncedVisualizerShell>
    );
};

export default SearchRotatedArrayVisualizer;
