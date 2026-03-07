/**
 * FindPeakElementVisualizer
 *
 * Step-by-step visualizer for Find Peak Element (Binary Search variant).
 * A peak element is one that is greater than its neighbours.
 * This algorithm uses binary search: if nums[mid] > nums[mid+1],
 * the peak is in the left half (including mid); otherwise in the right half.
 *
 * Reuses SearchArrayVisual for the pointer-array canvas — same L / M / R
 * pointer visual as BinarySearchVisualizer, with peak-specific cell coloring:
 *   sky-500   = mid cell being evaluated
 *   amber-400 = mid+1 cell being compared against mid
 *   emerald-500 = peak found
 */

import React, { useMemo } from 'react';
import VisualizerControls from './VisualizerControls';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import SearchArrayVisual from './SearchArrayVisual';
import { AnnotationCard, parseInputArray, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

// ── Line numbers (matching the provided Python code, 1-indexed) ───────────────
const LINE = {
    FN_DEF:       1,
    INIT_LEFT:    2,
    INIT_RIGHT:   3,
    WHILE_CHECK:  5,
    CALC_MID:     6,
    IF_COMPARE:   8,
    MOVE_RIGHT:   9,
    MOVE_LEFT:    11,
    RETURN_LEFT:  13,
    NUMS_ASSIGN:  17,
    CALL_FN:      18,
    PRINT_INDEX:  20,
    PRINT_VALUE:  21,
};

// ── Delays per event type (ms at 1× speed) ───────────────────────────────────
const DELAY = {
    nums_assign:   1600,
    call_fn:       1800,
    fn_entry:      1600,
    init_left:     1400,
    init_right:    1400,
    while_check:   1800,
    calc_mid:      1600,
    compare:       2200,
    move_right:    1800,
    move_left:     1800,
    while_exit:    2000,
    return_left:   2400,
    assign_result: 1800,
    print_index:   2000,
    print_value:   2000,
};

const getDelay = makeGetDelay(DELAY, 1400);

// ── Default input ─────────────────────────────────────────────────────────────
const DEFAULT_ARR = [1, 3, 5, 7, 6, 4, 2];

// ── Simulation ────────────────────────────────────────────────────────────────
function simulate(nums) {
    const events = [];
    const push = (type, extra, codeLine, annotation) =>
        events.push({ type, nums: [...nums], ...extra, codeLine, annotation });

    const n = nums.length;

    push('nums_assign', { left: 0, right: n - 1, mid: null, peak: null },
        LINE.NUMS_ASSIGN, `nums = [${nums.join(', ')}]`);
    push('call_fn', { left: 0, right: n - 1, mid: null, peak: null },
        LINE.CALL_FN, `Calling findPeakElement(nums)`);
    push('fn_entry', { left: 0, right: n - 1, mid: null, peak: null },
        LINE.FN_DEF, `Entering findPeakElement — will narrow range using binary search`);
    push('init_left', { left: 0, right: n - 1, mid: null, peak: null },
        LINE.INIT_LEFT, `left = 0  →  search starts at index 0`);
    push('init_right', { left: 0, right: n - 1, mid: null, peak: null },
        LINE.INIT_RIGHT, `right = ${n - 1}  →  search ends at index ${n - 1}`);

    let left  = 0;
    let right = n - 1;

    while (left < right) {
        push('while_check', { left, right, mid: null, peak: null },
            LINE.WHILE_CHECK,
            `left(${left}) < right(${right}) → True, range still has ${right - left + 1} elements`);

        const mid    = left + Math.floor((right - left) / 2);
        const goLeft = nums[mid] > nums[mid + 1];

        push('calc_mid', { left, right, mid, peak: null },
            LINE.CALC_MID,
            `mid = ${left} + (${right} − ${left}) // 2 = ${mid}  →  nums[${mid}] = ${nums[mid]}`);

        push('compare', { left, right, mid, peak: null, goLeft },
            LINE.IF_COMPARE,
            goLeft
                ? `nums[${mid}](${nums[mid]}) > nums[${mid + 1}](${nums[mid + 1]}) → True  →  peak is in left half (at or before mid)`
                : `nums[${mid}](${nums[mid]}) > nums[${mid + 1}](${nums[mid + 1]}) → False  →  peak is in right half (after mid)`);

        if (goLeft) {
            right = mid;
            push('move_right', { left, right, mid, peak: null },
                LINE.MOVE_RIGHT,
                `right = mid = ${mid}  →  discard right half, new range [${left}..${right}]`);
        } else {
            left = mid + 1;
            push('move_left', { left, right, mid, peak: null },
                LINE.MOVE_LEFT,
                `left = mid + 1 = ${left}  →  discard left half, new range [${left}..${right}]`);
        }
    }

    push('while_exit', { left, right, mid: null, peak: null },
        LINE.WHILE_CHECK,
        `left(${left}) < right(${right}) → False  →  left == right, single element remains`);
    push('return_left', { left, right, mid: null, peak: left },
        LINE.RETURN_LEFT,
        `return left  →  peak index = ${left}, peak value = ${nums[left]}`);
    push('assign_result', { left, right, mid: null, peak: left, result: left },
        LINE.CALL_FN,
        `peak_index = findPeakElement(nums)  →  peak_index = ${left}`);
    push('print_index', { left, right, mid: null, peak: left, result: left },
        LINE.PRINT_INDEX,
        `print("Peak index:", ${left})`);
    push('print_value', { left, right, mid: null, peak: left, result: left },
        LINE.PRINT_VALUE,
        `print("Peak value:", nums[${left}])  →  ${nums[left]}`);

    return { events };
}

// ── Cell highlighting ─────────────────────────────────────────────────────────
// Types where the active range (left..right) should dim cells outside it
const RANGE_TYPES = new Set([
    'while_check','calc_mid','compare','move_right','move_left',
    'while_exit','return_left','assign_result','print_index','print_value',
]);

const getCellBg = (idx, ev) => {
    if (!ev) return 'bg-slate-700 border-slate-500 text-slate-100';
    const { type, left = 0, right, mid = null, peak = null } = ev;

    // Peak found — highlight in emerald
    if (peak !== null && idx === peak)
        return 'bg-emerald-500 border-emerald-300 text-white ring-2 ring-emerald-300 shadow-lg shadow-emerald-400/50';

    // Cells outside the active search range → dimmed
    if (RANGE_TYPES.has(type) && (idx < left || idx > right))
        return 'bg-slate-800 border-slate-700 text-slate-500';

    // During comparison step: sky = mid, amber = mid+1
    if ((type === 'compare' || type === 'move_right' || type === 'move_left') && mid !== null) {
        if (idx === mid)
            return 'bg-sky-500 border-sky-300 text-white ring-2 ring-sky-300 shadow-md shadow-sky-400/40';
        if (idx === mid + 1)
            return 'bg-amber-400 border-amber-200 text-slate-900 ring-2 ring-amber-200 shadow-md shadow-amber-400/40';
    }

    // Mid cell at calc step → subtle sky tint
    if (mid !== null && idx === mid && RANGE_TYPES.has(type))
        return 'bg-sky-400/60 border-sky-400 text-white';

    return 'bg-slate-700 border-slate-500 text-slate-100';
};

// ── Pointer visibility sets ───────────────────────────────────────────────────
const FP_SHOW_L = new Set([
    'init_left','init_right','while_check','calc_mid','compare',
    'move_right','move_left','while_exit','return_left','assign_result',
    'print_index','print_value',
]);
const FP_SHOW_R = new Set([
    'init_right','while_check','calc_mid','compare',
    'move_right','move_left','while_exit','return_left','assign_result',
    'print_index','print_value',
]);
const FP_SHOW_M = new Set(['calc_mid','compare','move_right','move_left']);

// ── Main component ────────────────────────────────────────────────────────────
const FindPeakElementVisualizer = ({
    customArray    = '[1,3,5,7,6,4,2]',
    code           = '',
    onProgress,
    seekRef,
    drawerState    = 'peek',
    setDrawerState,
}) => {
    const inputArr = useMemo(() => parseInputArray(customArray, DEFAULT_ARR), [customArray]);

    const { events } = useMemo(() => simulate(inputArr), [inputArr]);

    const { eventIdx, playing, finished, speed, setSpeed,
            handlePlay, handlePause, handleReset, handleBack, handleNext,
            currentEv, activeLine, executedLines } =
        useVisualizerPlayback({ events, getDelay, inputArr, seekRef, onProgress });

    const displayArr = currentEv?.nums ?? inputArr;
    const n          = inputArr.length;
    const type       = currentEv?.type ?? '';

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
                    arr={displayArr}
                    n={n}
                    ev={currentEv}
                    getCellBg={getCellBg}
                    showL={FP_SHOW_L.has(type)}
                    showR={FP_SHOW_R.has(type)}
                    showM={FP_SHOW_M.has(type)}
                    showM1={type === 'compare'}
                    blink={type === 'while_check' || type === 'while_exit'}
                />
            </div>
            <AnnotationCard text={currentEv?.annotation} />
        </SyncedVisualizerShell>
    );
};

export default FindPeakElementVisualizer;
