/**
 * FirstLastPositionVisualizer — LC 34 "Find First and Last Position of Element in Sorted Array"
 *
 * Runs two binary-search passes on the same sorted array:
 *   find_first → leftmost occurrence of target  (search left half when nums[mid] >= target)
 *   find_last  → rightmost occurrence of target (search right half when nums[mid] <= target)
 *
 * Reuses SearchArrayVisual (L / M / R pointer row).
 *
 * Cell coloring:
 *   sky-500     = mid being checked
 *   amber-400   = first / last candidate being recorded (also persists across iterations)
 *   teal-500    = locked-in "first" position shown during find_last pass
 *   emerald-500 = final result range [first..last]
 *   slate-800   = cells outside the active search range
 */

import React, { useMemo } from 'react';
import VisualizerControls from './VisualizerControls';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import SearchArrayVisual from './SearchArrayVisual';
import { AnnotationCard, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

// ── Line numbers (1-indexed, matching code template in DSAProblemPage) ────────
const LINE = {
    // find_first
    FF_DEF:          1,
    FF_INIT_LOW:     2,
    FF_INIT_HIGH:    3,
    FF_INIT_FIRST:   4,
    FF_WHILE:        6,
    FF_CALC_MID:     7,
    FF_IF_LESS:      9,
    FF_MOVE_LOW:    10,
    FF_ELSE:        12,
    FF_IF_EQUAL:    13,
    FF_UPDATE_FIRST:14,
    FF_MOVE_HIGH:   15,
    FF_RETURN:      17,
    // find_last
    FL_DEF:         20,
    FL_INIT_LOW:    21,
    FL_INIT_HIGH:   22,
    FL_INIT_LAST:   23,
    FL_WHILE:       25,
    FL_CALC_MID:    26,
    FL_IF_GREATER:  28,
    FL_MOVE_HIGH:   29,
    FL_ELSE:        31,
    FL_IF_EQUAL:    32,
    FL_UPDATE_LAST: 33,
    FL_MOVE_LOW:    34,
    FL_RETURN:      36,
    // search_range
    SR_DEF:         39,
    SR_CALL_FIRST:  40,
    SR_CALL_LAST:   41,
    SR_RETURN:      42,
    // main
    NUMS_ASSIGN:    46,
    TARGET_ASSIGN:  47,
    RESULT_ASSIGN:  49,
    PRINT:          51,
};

// ── Delays per event type (ms at 1× speed) ───────────────────────────────────
const DELAY = {
    nums_assign:         1600,
    target_assign:       1600,
    result_assign:       1800,
    sr_entry:            1600,
    call_find_first:     1800,
    ff_entry:            1600,
    ff_init_low:         1200,
    ff_init_high:        1200,
    ff_init_first:       1400,
    ff_while_check:      1800,
    ff_calc_mid:         1600,
    ff_check_less:       2000,
    ff_move_low:         1800,
    ff_else_enter:       1600,
    ff_found_candidate:  2400,
    ff_not_equal:        1600,
    ff_move_high:        1800,
    ff_while_exit:       2000,
    ff_return:           2200,
    sr_got_first:        1800,
    call_find_last:      1800,
    fl_entry:            1600,
    fl_init_low:         1200,
    fl_init_high:        1200,
    fl_init_last:        1400,
    fl_while_check:      1800,
    fl_calc_mid:         1600,
    fl_check_greater:    2000,
    fl_move_high:        1800,
    fl_else_enter:       1600,
    fl_found_candidate:  2400,
    fl_not_equal:        1600,
    fl_move_low:         1800,
    fl_while_exit:       2000,
    fl_return:           2200,
    sr_got_last:         2000,
    sr_return:           2400,
    assign_result:       2000,
    print_result:        2400,
};

const getDelay = makeGetDelay(DELAY, 1400);

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_ARR    = [2, 4, 4, 4, 6, 8, 10];
const DEFAULT_TARGET = 4;

// ── Simulation ────────────────────────────────────────────────────────────────
function simulate(nums, target) {
    const events = [];
    const n = nums.length;
    const push = (type, extra = {}, codeLine, annotation) =>
        events.push({ type, nums: [...nums], target, codeLine, annotation, ...extra });

    push('nums_assign',
        { phase: 'main', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.NUMS_ASSIGN, `nums = [${nums.join(', ')}]`);
    push('target_assign',
        { phase: 'main', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.TARGET_ASSIGN, `target = ${target}`);
    push('result_assign',
        { phase: 'search_range', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.RESULT_ASSIGN, `Calling search_range(nums, ${target})`);
    push('sr_entry',
        { phase: 'search_range', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.SR_DEF, `Entering search_range — will run find_first then find_last`);
    push('call_find_first',
        { phase: 'search_range', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.SR_CALL_FIRST, `Calling find_first(nums, ${target}) — binary search for leftmost occurrence`);

    // ── find_first ────────────────────────────────────────────────────────────
    push('ff_entry',
        { phase: 'find_first', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.FF_DEF, `Entering find_first — scan left for leftmost ${target}`);
    push('ff_init_low',
        { phase: 'find_first', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.FF_INIT_LOW, `low = 0`);
    push('ff_init_high',
        { phase: 'find_first', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.FF_INIT_HIGH, `high = ${n - 1}`);
    push('ff_init_first',
        { phase: 'find_first', left: 0, right: n - 1, mid: null, first: -1, last: -1 },
        LINE.FF_INIT_FIRST, `first = -1  (no candidate yet)`);

    let ffLow = 0, ffHigh = n - 1, ffFirst = -1;

    while (ffLow <= ffHigh) {
        push('ff_while_check',
            { phase: 'find_first', left: ffLow, right: ffHigh, mid: null, first: ffFirst, last: -1 },
            LINE.FF_WHILE,
            `low(${ffLow}) ≤ high(${ffHigh}) → True, ${ffHigh - ffLow + 1} elements remain`);

        const ffMid = (ffLow + ffHigh) >> 1;
        push('ff_calc_mid',
            { phase: 'find_first', left: ffLow, right: ffHigh, mid: ffMid, first: ffFirst, last: -1 },
            LINE.FF_CALC_MID,
            `mid = (${ffLow} + ${ffHigh}) // 2 = ${ffMid}  →  nums[${ffMid}] = ${nums[ffMid]}`);

        if (nums[ffMid] < target) {
            push('ff_check_less',
                { phase: 'find_first', left: ffLow, right: ffHigh, mid: ffMid, first: ffFirst, last: -1 },
                LINE.FF_IF_LESS,
                `nums[${ffMid}](${nums[ffMid]}) < ${target} → True  →  target is to the right, move low up`);
            ffLow = ffMid + 1;
            push('ff_move_low',
                { phase: 'find_first', left: ffLow, right: ffHigh, mid: ffMid, first: ffFirst, last: -1 },
                LINE.FF_MOVE_LOW, `low = ${ffMid} + 1 = ${ffLow}`);
        } else {
            push('ff_else_enter',
                { phase: 'find_first', left: ffLow, right: ffHigh, mid: ffMid, first: ffFirst, last: -1 },
                LINE.FF_ELSE,
                `nums[${ffMid}](${nums[ffMid]}) < ${target} → False  →  enter else (nums[mid] ≥ target)`);
            if (nums[ffMid] === target) {
                ffFirst = ffMid;
                push('ff_found_candidate',
                    { phase: 'find_first', left: ffLow, right: ffHigh, mid: ffMid, first: ffFirst, last: -1 },
                    LINE.FF_UPDATE_FIRST,
                    `nums[${ffMid}](${nums[ffMid]}) == ${target} → True  →  record first = ${ffFirst}, keep searching LEFT for earlier occurrence`);
            } else {
                push('ff_not_equal',
                    { phase: 'find_first', left: ffLow, right: ffHigh, mid: ffMid, first: ffFirst, last: -1 },
                    LINE.FF_IF_EQUAL,
                    `nums[${ffMid}](${nums[ffMid]}) == ${target} → False  →  nums[mid] > target, no update`);
            }
            ffHigh = ffMid - 1;
            push('ff_move_high',
                { phase: 'find_first', left: ffLow, right: ffHigh, mid: ffMid, first: ffFirst, last: -1 },
                LINE.FF_MOVE_HIGH,
                `high = ${ffMid} - 1 = ${ffHigh}  →  search left half`);
        }
    }

    push('ff_while_exit',
        { phase: 'find_first', left: ffLow, right: ffHigh, mid: null, first: ffFirst, last: -1 },
        LINE.FF_WHILE,
        `low(${ffLow}) > high(${ffHigh}) → False  →  search exhausted`);
    push('ff_return',
        { phase: 'find_first', left: ffLow, right: ffHigh, mid: null, first: ffFirst, last: -1 },
        LINE.FF_RETURN,
        ffFirst === -1
            ? `return first  →  first = -1  (${target} not found)`
            : `return first  →  first = ${ffFirst}  (leftmost ${target} is at index ${ffFirst})`);

    // Back to search_range
    push('sr_got_first',
        { phase: 'search_range', left: 0, right: n - 1, mid: null, first: ffFirst, last: -1 },
        LINE.SR_CALL_FIRST, `first = find_first(nums, ${target})  →  first = ${ffFirst}`);
    push('call_find_last',
        { phase: 'search_range', left: 0, right: n - 1, mid: null, first: ffFirst, last: -1 },
        LINE.SR_CALL_LAST, `Calling find_last(nums, ${target}) — binary search for rightmost occurrence`);

    // ── find_last ─────────────────────────────────────────────────────────────
    push('fl_entry',
        { phase: 'find_last', left: 0, right: n - 1, mid: null, first: ffFirst, last: -1 },
        LINE.FL_DEF, `Entering find_last — scan right for rightmost ${target}`);
    push('fl_init_low',
        { phase: 'find_last', left: 0, right: n - 1, mid: null, first: ffFirst, last: -1 },
        LINE.FL_INIT_LOW, `low = 0`);
    push('fl_init_high',
        { phase: 'find_last', left: 0, right: n - 1, mid: null, first: ffFirst, last: -1 },
        LINE.FL_INIT_HIGH, `high = ${n - 1}`);
    push('fl_init_last',
        { phase: 'find_last', left: 0, right: n - 1, mid: null, first: ffFirst, last: -1 },
        LINE.FL_INIT_LAST, `last = -1  (no candidate yet)`);

    let flLow = 0, flHigh = n - 1, flLast = -1;

    while (flLow <= flHigh) {
        push('fl_while_check',
            { phase: 'find_last', left: flLow, right: flHigh, mid: null, first: ffFirst, last: flLast },
            LINE.FL_WHILE,
            `low(${flLow}) ≤ high(${flHigh}) → True, ${flHigh - flLow + 1} elements remain`);

        const flMid = (flLow + flHigh) >> 1;
        push('fl_calc_mid',
            { phase: 'find_last', left: flLow, right: flHigh, mid: flMid, first: ffFirst, last: flLast },
            LINE.FL_CALC_MID,
            `mid = (${flLow} + ${flHigh}) // 2 = ${flMid}  →  nums[${flMid}] = ${nums[flMid]}`);

        if (nums[flMid] > target) {
            push('fl_check_greater',
                { phase: 'find_last', left: flLow, right: flHigh, mid: flMid, first: ffFirst, last: flLast },
                LINE.FL_IF_GREATER,
                `nums[${flMid}](${nums[flMid]}) > ${target} → True  →  target is to the left, move high down`);
            flHigh = flMid - 1;
            push('fl_move_high',
                { phase: 'find_last', left: flLow, right: flHigh, mid: flMid, first: ffFirst, last: flLast },
                LINE.FL_MOVE_HIGH, `high = ${flMid} - 1 = ${flHigh}`);
        } else {
            push('fl_else_enter',
                { phase: 'find_last', left: flLow, right: flHigh, mid: flMid, first: ffFirst, last: flLast },
                LINE.FL_ELSE,
                `nums[${flMid}](${nums[flMid]}) > ${target} → False  →  enter else (nums[mid] ≤ target)`);
            if (nums[flMid] === target) {
                flLast = flMid;
                push('fl_found_candidate',
                    { phase: 'find_last', left: flLow, right: flHigh, mid: flMid, first: ffFirst, last: flLast },
                    LINE.FL_UPDATE_LAST,
                    `nums[${flMid}](${nums[flMid]}) == ${target} → True  →  record last = ${flLast}, keep searching RIGHT for later occurrence`);
            } else {
                push('fl_not_equal',
                    { phase: 'find_last', left: flLow, right: flHigh, mid: flMid, first: ffFirst, last: flLast },
                    LINE.FL_IF_EQUAL,
                    `nums[${flMid}](${nums[flMid]}) == ${target} → False  →  nums[mid] < target, no update`);
            }
            flLow = flMid + 1;
            push('fl_move_low',
                { phase: 'find_last', left: flLow, right: flHigh, mid: flMid, first: ffFirst, last: flLast },
                LINE.FL_MOVE_LOW, `low = ${flMid} + 1 = ${flLow}  →  search right half`);
        }
    }

    push('fl_while_exit',
        { phase: 'find_last', left: flLow, right: flHigh, mid: null, first: ffFirst, last: flLast },
        LINE.FL_WHILE,
        `low(${flLow}) > high(${flHigh}) → False  →  search exhausted`);
    push('fl_return',
        { phase: 'find_last', left: flLow, right: flHigh, mid: null, first: ffFirst, last: flLast },
        LINE.FL_RETURN,
        flLast === -1
            ? `return last  →  last = -1  (${target} not found)`
            : `return last  →  last = ${flLast}  (rightmost ${target} is at index ${flLast})`);

    // Back to search_range
    push('sr_got_last',
        { phase: 'search_range', left: 0, right: n - 1, mid: null, first: ffFirst, last: flLast },
        LINE.SR_CALL_LAST, `last = find_last(nums, ${target})  →  last = ${flLast}`);
    push('sr_return',
        { phase: 'search_range', left: 0, right: n - 1, mid: null, first: ffFirst, last: flLast },
        LINE.SR_RETURN, `return [first, last]  →  [${ffFirst}, ${flLast}]`);
    push('assign_result',
        { phase: 'main', left: 0, right: n - 1, mid: null, first: ffFirst, last: flLast },
        LINE.RESULT_ASSIGN, `result = search_range(nums, ${target})  →  result = [${ffFirst}, ${flLast}]`);
    push('print_result',
        { phase: 'main', left: 0, right: n - 1, mid: null, first: ffFirst, last: flLast },
        LINE.PRINT, `print("Range:", [${ffFirst}, ${flLast}])`);

    return { events };
}

// ── Cell highlighting ─────────────────────────────────────────────────────────
const RESULT_TYPES = new Set(['sr_return', 'sr_got_last', 'assign_result', 'print_result']);

const LOOP_TYPES = new Set([
    'ff_while_check', 'ff_calc_mid', 'ff_check_less', 'ff_move_low',
    'ff_else_enter', 'ff_found_candidate', 'ff_not_equal', 'ff_move_high',
    'ff_while_exit', 'ff_return',
    'fl_while_check', 'fl_calc_mid', 'fl_check_greater', 'fl_move_high',
    'fl_else_enter', 'fl_found_candidate', 'fl_not_equal', 'fl_move_low',
    'fl_while_exit', 'fl_return',
]);

const getCellBg = (idx, ev) => {
    if (!ev) return 'bg-slate-700 border-slate-500 text-slate-100';
    const { type, left = 0, right = -1, mid = null, first = -1, last = -1, phase } = ev;

    // Final result phase: emerald highlight for [first..last] range
    if (RESULT_TYPES.has(type)) {
        if (first !== -1 && last !== -1 && idx >= first && idx <= last)
            return 'bg-emerald-500 border-emerald-300 text-white ring-2 ring-emerald-300 shadow-lg shadow-emerald-400/50';
        return 'bg-slate-700 border-slate-500 text-slate-100';
    }

    // "Found candidate and recording" moment — amber highlight at mid
    const isRecording = type === 'ff_found_candidate' || type === 'fl_found_candidate';
    if (isRecording && idx === mid)
        return 'bg-amber-400 border-amber-200 text-slate-900 ring-2 ring-amber-200 shadow-lg shadow-amber-500/60';

    // Mid cell (normal check)
    if (idx === mid)
        return 'bg-sky-500 border-sky-300 text-white ring-2 ring-sky-300 shadow-md shadow-sky-400/40';

    // During find_last: show locked-in first result in teal (it's already confirmed)
    if (phase === 'find_last' && first !== -1 && idx === first)
        return 'bg-teal-500 border-teal-300 text-white ring-2 ring-teal-300 shadow-md shadow-teal-400/30';

    // Persistent amber for candidate cell across loop iterations
    if (phase === 'find_first' && first !== -1 && idx === first)
        return 'bg-amber-400 border-amber-200 text-slate-900 ring-2 ring-amber-200 shadow-md shadow-amber-400/40';
    if (phase === 'find_last' && last !== -1 && idx === last)
        return 'bg-amber-400 border-amber-200 text-slate-900 ring-2 ring-amber-200 shadow-md shadow-amber-400/40';

    // Dim cells outside active search range
    if (LOOP_TYPES.has(type) && (idx < left || idx > right))
        return 'bg-slate-800 border-slate-700 text-slate-500';

    return 'bg-slate-700 border-slate-500 text-slate-100';
};

// ── Pointer visibility sets ───────────────────────────────────────────────────
const SHOW_L = new Set([
    'ff_init_low', 'ff_init_high', 'ff_init_first',
    'ff_while_check', 'ff_calc_mid', 'ff_check_less', 'ff_move_low',
    'ff_else_enter', 'ff_found_candidate', 'ff_not_equal', 'ff_move_high',
    'ff_while_exit', 'ff_return',
    'fl_init_low', 'fl_init_high', 'fl_init_last',
    'fl_while_check', 'fl_calc_mid', 'fl_check_greater', 'fl_move_high',
    'fl_else_enter', 'fl_found_candidate', 'fl_not_equal', 'fl_move_low',
    'fl_while_exit', 'fl_return',
]);

const SHOW_R = new Set([
    'ff_init_high', 'ff_init_first',
    'ff_while_check', 'ff_calc_mid', 'ff_check_less', 'ff_move_low',
    'ff_else_enter', 'ff_found_candidate', 'ff_not_equal', 'ff_move_high',
    'ff_while_exit', 'ff_return',
    'fl_init_high', 'fl_init_last',
    'fl_while_check', 'fl_calc_mid', 'fl_check_greater', 'fl_move_high',
    'fl_else_enter', 'fl_found_candidate', 'fl_not_equal', 'fl_move_low',
    'fl_while_exit', 'fl_return',
]);

const SHOW_M = new Set([
    'ff_calc_mid', 'ff_check_less', 'ff_move_low',
    'ff_else_enter', 'ff_found_candidate', 'ff_not_equal', 'ff_move_high',
    'fl_calc_mid', 'fl_check_greater', 'fl_move_high',
    'fl_else_enter', 'fl_found_candidate', 'fl_not_equal', 'fl_move_low',
]);

// ── Phase indicator (rendered as topSlot above pointer row) ───────────────────
const PhaseTopSlot = ({ ev, target }) => {
    if (!ev) return null;
    const { phase, type, first = -1, last = -1 } = ev;
    const isResult = RESULT_TYPES.has(type);

    let label, badgeCls;
    if (phase === 'find_first') {
        label    = 'Finding First →';
        badgeCls = 'border-amber-500/50 bg-amber-500/10 text-amber-400';
    } else if (phase === 'find_last') {
        label    = '← Finding Last';
        badgeCls = 'border-violet-500/50 bg-violet-500/10 text-violet-400';
    } else if (isResult) {
        label    = `Result: [${first}, ${last}]`;
        badgeCls = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
    } else {
        label    = 'Search Range';
        badgeCls = 'border-slate-600 bg-slate-800/60 text-slate-400';
    }

    return (
        <div className="flex flex-col items-center gap-2" style={{ marginBottom: 28 }}>
            {/* Target + phase badge on one row */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 border-slate-600 bg-slate-800/60 text-sm font-bold text-slate-200">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">target</span>
                    <span>{target}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${badgeCls}`}>
                    {label}
                </div>
            </div>

            {/* first / last result indicators */}
            {(phase === 'find_first' && first !== -1) && (
                <span className="text-[11px] font-mono">
                    <span className="text-amber-400">first</span>
                    <span className="text-slate-500"> = </span>
                    <span className="text-amber-300 font-bold">{first}</span>
                    <span className="text-slate-500 ml-1 italic">— still searching left…</span>
                </span>
            )}
            {(phase === 'find_last' || isResult) && (
                <div className="flex items-center gap-4">
                    <span className="text-[11px] font-mono">
                        <span className="text-teal-400">first</span>
                        <span className="text-slate-500"> = </span>
                        <span className={first !== -1 ? 'text-teal-300 font-bold' : 'text-slate-500'}>{first}</span>
                    </span>
                    <span className="text-[11px] font-mono">
                        <span className="text-amber-400">last</span>
                        <span className="text-slate-500"> = </span>
                        <span className={last !== -1 ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                            {isResult ? last : (last === -1 ? '?' : last)}
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const FirstLastPositionVisualizer = ({
    customArray    = '[2,4,4,4,6,8,10],4',
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
                    blink={type === 'ff_while_check' || type === 'fl_while_check'}
                    topSlot={<PhaseTopSlot ev={currentEv} target={target} />}
                />
            </div>
            <AnnotationCard text={currentEv?.annotation} />
        </SyncedVisualizerShell>
    );
};

export default FirstLastPositionVisualizer;
