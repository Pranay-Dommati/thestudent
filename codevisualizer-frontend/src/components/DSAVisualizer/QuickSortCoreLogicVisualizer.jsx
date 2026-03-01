/**
 * QuickSortCoreLogicVisualizer
 *
 * Core Logic tab — animated call-tree for Quick Sort (in-place, middle pivot).
 * Shows: recursive call tree, pivot selection, two-pointer scan, swaps,
 * partition zones, and step-by-step merge-style detail panel.
 *
 * Completely self-contained. Mirrors the Python code:
 *   pivot = nums[(low + high) // 2]
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Layout constants ─────────────────────────────────────────────────────────
const CELL_W       = 40;
const CELL_H       = 40;
const CELL_GAP     = 4;
const ELEM_W       = 56;   // px per array-index slot  (X axis)
const LEVEL_H      = 170;  // px between tree levels    (Y axis)
const NODE_PAD     = 14;   // internal padding inside node box
const LEFT_PAD     = 340;  // left canvas margin

// ── Simulation: run quick_sort, capture call tree ────────────────────────────
const simulateQuickSort = (inputArr) => {
    const nums = [...inputArr];
    let counter = 0;
    const nodeMap = new Map();

    const dfs = (low, high, depth, parentId) => {
        const id = `qs-${counter++}`;
        const node = {
            id, low, high, depth, parentId,
            isBase: low >= high,
            arrAtEntry: nums.slice(0, nums.length), // full array snapshot at entry
            pivot: null, pivotIdx: null,
            partitionSteps: [],
            finalI: null, finalJ: null,
            arrAfterPartition: null,
            leftChildId: null, rightChildId: null,
            left: null, right: null,
            x: 0, y: 0,
        };
        nodeMap.set(id, node);

        if (low >= high) return id;

        const pivotIdx = Math.floor((low + high) / 2);
        node.pivot = nums[pivotIdx];
        node.pivotIdx = pivotIdx;

        let i = low, j = high;

        while (i <= j) {
            const iFrom = i, jFrom = j;
            const arrBefore = [...nums];

            while (nums[i] < node.pivot) i++;
            while (nums[j] > node.pivot) j--;

            const iStop = i, jStop = j;
            let didSwap = false;
            let si = null, sj = null;

            if (i <= j) {
                didSwap = true;
                si = i; sj = j;
                [nums[i], nums[j]] = [nums[j], nums[i]];
                i++; j--;
            }

            node.partitionSteps.push({
                iFrom, jFrom,    // where scan started
                iStop, jStop,    // where pointers stopped (before possible swap)
                didSwap, si, sj,
                arrBefore,
                arrAfter: [...nums],
            });
        }

        node.finalI = i;
        node.finalJ = j;
        node.arrAfterPartition = [...nums];

        if (j >= low)  node.leftChildId  = dfs(low, j, depth + 1, id);
        if (i <= high) node.rightChildId = dfs(i, high, depth + 1, id);

        return id;
    };

    const rootId = dfs(0, nums.length - 1, 0, null);

    for (const node of nodeMap.values()) {
        node.left  = node.leftChildId  ? nodeMap.get(node.leftChildId)  : null;
        node.right = node.rightChildId ? nodeMap.get(node.rightChildId) : null;
    }

    return { nodeMap, rootId, finalArr: [...nums] };
};

// ── Layout: x = index-midpoint based, y = depth based ───────────────────────
const assignLayout = (nodeMap) => {
    for (const node of nodeMap.values()) {
        const mid = (node.low + node.high) / 2;
        node.x = mid * ELEM_W + LEFT_PAD;
        node.y = node.depth * LEVEL_H;
    }
};

// ── Build event list ─────────────────────────────────────────────────────────
const BUILD_EVENTS = (nodeMap, rootId) => {
    const evs = [];
    const fmt = arr => `[${arr.join(', ')}]`;

    const dfs = (node) => {
        evs.push({
            type: 'appear', nodeId: node.id,
            scrollY: node.y,
            annotation: node.isBase
                ? `sort(${node.low}, ${node.high}) — base case, already sorted`
                : `sort(${node.low}, ${node.high}) — subarray of ${node.high - node.low + 1} elements`,
        });

        if (node.isBase) {
            evs.push({ type: 'base_case', nodeId: node.id, scrollY: node.y,
                annotation: `${node.low} >= ${node.high} → return (nothing to sort)` });
            return;
        }

        evs.push({ type: 'pivot_select', nodeId: node.id, scrollY: node.y,
            annotation: `pivot = nums[(${node.low}+${node.high})//2] = nums[${node.pivotIdx}] = ${node.pivot}` });

        evs.push({ type: 'init_pointers', nodeId: node.id, scrollY: node.y,
            annotation: `i = ${node.low} (left pointer), j = ${node.high} (right pointer)` });

        node.partitionSteps.forEach((step, idx) => {
            const desc = step.didSwap
                ? `Swap nums[${step.si}]=${step.arrBefore[step.si]} ↔ nums[${step.sj}]=${step.arrBefore[step.sj]}, then i++, j--`
                : `nums[${step.iStop}]=${step.arrBefore[step.iStop]} ≥ pivot and nums[${step.jStop}]=${step.arrBefore[step.jStop]} ≤ pivot — ${step.iStop > step.jStop ? 'i > j, exit loop' : 'pointers met at pivot, i++, j--'}`;
            evs.push({ type: 'partition_step', nodeId: node.id, stepIdx: idx,
                scrollY: node.y, annotation: desc });
        });

        evs.push({ type: 'partition_done', nodeId: node.id,
            scrollY: Math.max(0, node.y + LEVEL_H - 80),
            annotation: `Partition done — left [${node.low}..${node.finalJ}] ≤ ${node.pivot} ≤ right [${node.finalI}..${node.high}]` });

        if (node.left) {
            evs.push({ type: 'spawn_child', nodeId: node.id, childId: node.leftChildId,
                scrollY: Math.max(0, node.y + LEVEL_H - 80),
                annotation: `Recurse left: sort(${node.low}, ${node.finalJ})` });
            dfs(node.left);
        }
        if (node.right) {
            evs.push({ type: 'spawn_child', nodeId: node.id, childId: node.rightChildId,
                scrollY: Math.max(0, node.y + LEVEL_H - 80),
                annotation: `Recurse right: sort(${node.finalI}, ${node.high})` });
            dfs(node.right);
        }

        evs.push({ type: 'node_sorted', nodeId: node.id,
            scrollY: Math.max(0, node.y - 40),
            annotation: `Range [${node.low}..${node.high}] fully sorted ✓` });
    };

    dfs(nodeMap.get(rootId));
    evs.push({ type: 'final_done', scrollY: 0,
        annotation: `Quick Sort complete! Array is sorted.` });
    return evs;
};

// ── Event delays ─────────────────────────────────────────────────────────────
const DELAY = {
    appear:          700,
    base_case:      1000,
    pivot_select:   1200,
    init_pointers:   900,
    partition_step: 1100,
    partition_done: 1000,
    spawn_child:     700,
    node_sorted:     900,
    final_done:     1800,
};
const getDelay = (ev, speed) => (DELAY[ev.type] ?? 800) / speed;

// ── Small UI: single array cell ───────────────────────────────────────────────
const ArrayCell = ({ val, highlight, sorted, dim, pivotGlow, swapped, small }) => {
    const size   = small ? 28 : CELL_H;
    const font   = small ? 'text-xs' : 'text-sm font-bold';
    let bg = 'bg-slate-700 border-slate-500 text-slate-200';
    if (dim)       bg = 'bg-slate-800/50 border-slate-700 text-slate-600';
    if (sorted)    bg = 'bg-emerald-600 border-emerald-400 text-white';
    if (highlight) bg = 'bg-amber-500 border-amber-300 text-white';
    if (swapped)   bg = 'bg-rose-500 border-rose-300 text-white ring-2 ring-rose-300';
    if (pivotGlow) bg = 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-300 shadow-lg shadow-amber-500/50';
    return (
        <div className={`flex items-center justify-center rounded-lg border-2 ${font} ${bg} flex-shrink-0`}
            style={{ width: size, height: size, minWidth: size }}>
            {val}
        </div>
    );
};

// ── Pointer badge (i or j) ────────────────────────────────────────────────────
const PointerBadge = ({ label, color }) => (
    <motion.div key={label + color}
        className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[11px] leading-none text-white ${color}`}
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        {label}
    </motion.div>
);

// ── Node display: computes what to show based on node phase ───────────────────
const NodeDisplay = ({ node, phase, stepIdx, currentEv }) => {
    const n = node.high - node.low + 1;

    if (phase === 'base_case') {
        // Single element (or empty) — always green
        const cell = node.low <= node.high ? node.arrAtEntry[node.low] : null;
        return (
            <div className="flex flex-col items-center gap-1">
                <motion.div
                    className="flex items-center justify-center rounded-xl border-2 bg-emerald-900/40 border-emerald-500/70 shadow-lg shadow-emerald-900/30"
                    style={{ padding: `6px ${NODE_PAD}px`, gap: CELL_GAP }}>
                    {cell !== null
                        ? <ArrayCell val={cell} sorted />
                        : <span className="text-slate-500 text-xs italic px-2">empty</span>}
                </motion.div>
                <span className="text-[11px] text-emerald-400 font-semibold">sorted ✓</span>
            </div>
        );
    }

    // Determine which array slice and highlights to display
    let arr, pivotRelIdx = null, iPos = null, jPos = null, swappedI = null, swappedJ = null, zones = null;

    if (phase === 'appear') {
        arr = node.arrAtEntry.slice(node.low, node.high + 1);
    } else if (phase === 'pivot_select' || phase === 'init_pointers') {
        arr = node.arrAtEntry.slice(node.low, node.high + 1);
        pivotRelIdx = node.pivotIdx - node.low;
        if (phase === 'init_pointers') { iPos = 0; jPos = n - 1; }
    } else if (phase === 'partition_step') {
        const step = node.partitionSteps[stepIdx] ?? node.partitionSteps[node.partitionSteps.length - 1];
        if (step) {
            arr = step.arrAfter.slice(node.low, node.high + 1);
            pivotRelIdx = null; // don't show pivot highlight during swap
            if (step.didSwap) {
                swappedI = step.si - node.low;
                swappedJ = step.sj - node.low;
            }
            // Show where i and j ended up (after increment/decrement)
            const nextI = step.didSwap ? step.si + 1 : step.iStop;
            const nextJ = step.didSwap ? step.sj - 1 : step.jStop;
            iPos = Math.min(nextI - node.low, n - 1);
            jPos = Math.max(nextJ - node.low, 0);
        } else {
            arr = node.arrAtEntry.slice(node.low, node.high + 1);
        }
    } else if (phase === 'partition_done' || phase === 'waiting') {
        arr = node.arrAfterPartition.slice(node.low, node.high + 1);
        // Color zones: [low..finalJ] = left, [finalJ+1..finalI-1] = pivot zone, [finalI..high] = right
        zones = { leftEnd: node.finalJ - node.low, rightStart: node.finalI - node.low };
    } else if (phase === 'node_sorted') {
        arr = node.arrAfterPartition.slice(node.low, node.high + 1);
        zones = 'all_sorted';
    } else {
        arr = node.arrAtEntry.slice(node.low, node.high + 1);
    }

    if (!arr) arr = node.arrAtEntry.slice(node.low, node.high + 1);

    const getZoneColor = (idx) => {
        if (zones === 'all_sorted') return 'sorted';
        if (!zones) return null;
        if (idx <= zones.leftEnd)   return 'left';
        if (idx < zones.rightStart) return 'pivot';
        return 'right';
    };

    const boxBg = zones === 'all_sorted'
        ? 'bg-emerald-900/40 border-emerald-500/70 shadow-emerald-900/30'
        : zones ? 'bg-slate-800/60 border-slate-600/50'
        : 'bg-slate-800/80 border-indigo-500/40';

    return (
        <div className="flex flex-col items-center gap-1">
            {zones === 'all_sorted' && (
                <motion.span className="text-xs text-emerald-400 font-semibold"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    sorted ✓
                </motion.span>
            )}
            {/* Pointer badges row */}
            <div className="flex items-end" style={{ gap: CELL_GAP, height: 22 }}>
                {arr.map((_, idx) => {
                    const isI = iPos !== null && idx === iPos;
                    const isJ = jPos !== null && idx === jPos;
                    return (
                        <div key={idx} style={{ width: CELL_W }} className="flex justify-center">
                            {isI && !isJ && <PointerBadge label="i" color="bg-indigo-600" />}
                            {isJ && !isI && <PointerBadge label="j" color="bg-pink-600" />}
                            {isI && isJ  && <PointerBadge label="i=j" color="bg-indigo-500" />}
                        </div>
                    );
                })}
            </div>
            {/* Array box */}
            <motion.div
                className={`flex items-center rounded-xl border-2 shadow-lg ${boxBg}`}
                style={{ padding: `6px ${NODE_PAD}px`, gap: CELL_GAP }}>
                {arr.map((v, idx) => {
                    const zone = getZoneColor(idx);
                    const isPivot   = pivotRelIdx !== null && idx === pivotRelIdx;
                    const isSorted  = zone === 'sorted';
                    const isHighlight = isPivot;
                    const isSwapped  = idx === swappedI || idx === swappedJ;
                    const isLeft    = zone === 'left';
                    const isPivZone = zone === 'pivot';
                    const isRight   = zone === 'right';

                    let cellBg = 'bg-slate-700 border-slate-500 text-slate-200';
                    if (isSorted)   cellBg = 'bg-emerald-600 border-emerald-400 text-white';
                    if (isLeft)     cellBg = 'bg-indigo-800 border-indigo-500 text-white';
                    if (isPivZone)  cellBg = 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300';
                    if (isRight)    cellBg = 'bg-slate-600 border-slate-400 text-slate-200';
                    if (isHighlight) cellBg = 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-300 shadow-amber-500/60 shadow-md';
                    if (isSwapped)  cellBg = 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300';

                    return (
                        <motion.div key={idx}
                            className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 ${cellBg}`}
                            style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W }}
                            animate={isSwapped ? { scale: [1, 1.25, 1] } : {}}
                            transition={isSwapped ? { duration: 0.4 } : {}}>
                            {v}
                        </motion.div>
                    );
                })}
            </motion.div>
            {/* Zone legend */}
            {zones && zones !== 'all_sorted' && (
                <motion.div className="flex items-center gap-2 mt-0.5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {node.finalJ >= node.low && (
                        <span className="text-[10px] text-indigo-300 font-medium px-1.5 py-0.5 rounded bg-indigo-900/40">
                            left ≤ {node.pivot}
                        </span>
                    )}
                    {node.finalJ < node.finalI - 1 && (
                        <span className="text-[10px] text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-900/40">
                            ={node.pivot}
                        </span>
                    )}
                    {node.finalI <= node.high && (
                        <span className="text-[10px] text-slate-300 font-medium px-1.5 py-0.5 rounded bg-slate-700/60">
                            right ≥ {node.pivot}
                        </span>
                    )}
                </motion.div>
            )}
        </div>
    );
};

// ── Detail panel (bottom) — shows full array during partition ─────────────────
const PartitionDetailPanel = ({ node, stepIdx, partitionCount }) => {
    if (!node || node.isBase) return null;

    const step = node.partitionSteps[stepIdx] ?? null;
    if (!step) return null;

    const { low, high, pivot } = node;
    const arr = step.arrAfter;
    const i = step.didSwap ? step.si + 1 : step.iStop;
    const j = step.didSwap ? step.sj - 1 : step.jStop;

    return (
        <motion.div
            className="flex-shrink-0 border-t-2 border-indigo-900/60 bg-slate-900 px-5 py-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
            <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                        Partition {partitionCount} — sort({node.low}, {node.high})
                    </span>
                </div>
                <div className="h-px flex-1 bg-slate-700/60" />
                <span className="text-xs text-slate-500">
                    pivot = {pivot}
                </span>
            </div>

            <div className="flex items-start gap-3 overflow-x-auto pb-1">
                {/* Full array view */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Array</span>
                    {/* Pointer row */}
                    <div className="flex items-end" style={{ gap: CELL_GAP, height: 24 }}>
                        {arr.map((_, idx) => {
                            const relI = i - low;
                            const relJ = j - low;
                            const relIdx = idx - low;
                            const isI = idx >= low && idx <= high && relIdx === relI;
                            const isJ = idx >= low && idx <= high && relIdx === relJ;
                            return (
                                <div key={idx} style={{ width: 32, minWidth: 32 }} className="flex justify-center">
                                    {isI && !isJ && (
                                        <motion.div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold"
                                            initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>i</motion.div>
                                    )}
                                    {isJ && !isI && (
                                        <motion.div className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] font-bold"
                                            initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>j</motion.div>
                                    )}
                                    {isI && isJ && (
                                        <motion.div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-[9px] font-bold"
                                            initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>ij</motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* Cells */}
                    <div className="flex items-center" style={{ gap: CELL_GAP }}>
                        {arr.map((v, idx) => {
                            const inRange = idx >= low && idx <= high;
                            const relIdx = idx - low;
                            const relI = i - low;
                            const relJ = j - low;
                            const isPivotCell = v === pivot && inRange;
                            const justSwappedI = step.didSwap && idx === step.si;
                            const justSwappedJ = step.didSwap && idx === step.sj;
                            let cellBg = 'bg-slate-800 border-slate-700 text-slate-600';
                            if (inRange) cellBg = 'bg-slate-700 border-slate-500 text-slate-200';
                            if (isPivotCell) cellBg = 'bg-amber-600/40 border-amber-400 text-amber-200';
                            if (justSwappedI || justSwappedJ) cellBg = 'bg-rose-600 border-rose-400 text-white ring-1 ring-rose-300';
                            return (
                                <motion.div key={idx}
                                    className={`flex items-center justify-center rounded-md border-2 text-xs font-bold flex-shrink-0 ${cellBg}`}
                                    style={{ width: 32, height: 32, minWidth: 32 }}
                                    animate={(justSwappedI || justSwappedJ) ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.35 }}>
                                    {v}
                                </motion.div>
                            );
                        })}
                    </div>
                    {/* Index labels */}
                    <div className="flex items-center" style={{ gap: CELL_GAP }}>
                        {arr.map((_, idx) => (
                            <div key={idx} style={{ width: 32, minWidth: 32 }}
                                className={`text-center text-[9px] ${idx === low || idx === high ? 'text-slate-400' : 'text-slate-600'}`}>
                                {idx}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step info */}
                <div className="flex flex-col gap-2 flex-shrink-0 ml-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">i</div>
                        <span className="text-xs text-indigo-300 font-mono">= {i < low ? low : i > high + 1 ? high + 1 : i}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-pink-600 flex items-center justify-center text-[10px] font-bold text-white">j</div>
                        <span className="text-xs text-pink-300 font-mono">= {j < low - 1 ? low - 1 : j > high ? high : j}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-xs text-amber-300 font-mono">pivot = {pivot}</span>
                    </div>
                    {step.didSwap && (
                        <motion.div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-900/40 border border-rose-600/40"
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                            <span className="text-[11px] text-rose-300 font-semibold">
                                Swapped [{step.si}] ↔ [{step.sj}]
                            </span>
                        </motion.div>
                    )}
                    {!step.didSwap && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/40 border border-slate-600/40">
                            <span className="text-[11px] text-slate-400">i {'>'} j → exit loop</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const QuickSortCoreLogicVisualizer = ({
    customArray = '[8, 3, 1, 5, 2, 7, 4]',
    onProgress,
    seekRef,
}) => {
    const inputArr = useMemo(() => {
        try {
            const p = JSON.parse(customArray.trim());
            if (Array.isArray(p)) return p.map(Number);
        } catch {}
        return [8, 3, 1, 5, 2, 7, 4];
    }, [customArray]);

    const { nodeMap, rootId, finalArr } = useMemo(() => simulateQuickSort(inputArr), [inputArr]);

    useMemo(() => assignLayout(nodeMap), [nodeMap]);

    const allNodes    = useMemo(() => [...nodeMap.values()], [nodeMap]);
    const events      = useMemo(() => BUILD_EVENTS(nodeMap, rootId), [nodeMap, rootId]);
    const maxDepth    = useMemo(() => Math.max(...allNodes.map(n => n.depth)), [allNodes]);

    const n        = inputArr.length;
    const canvasW  = n * ELEM_W + LEFT_PAD * 2;
    const canvasH  = (maxDepth + 1) * LEVEL_H + 180;

    // ── Animation state ───────────────────────────────────────────────────────
    const [eventIdx, setEventIdx] = useState(-1);
    const [playing,  setPlaying]  = useState(false);
    const [finished, setFinished] = useState(false);
    const [speed,    setSpeed]    = useState(1);
    const scrollRef = useRef(null);

    useEffect(() => {
        setEventIdx(-1); setPlaying(false); setFinished(false);
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, [inputArr]);

    useEffect(() => {
        if (!playing || finished) return;
        const nextIdx = eventIdx + 1;
        if (nextIdx >= events.length) { setFinished(true); setPlaying(false); return; }
        const t = setTimeout(() => setEventIdx(nextIdx), getDelay(events[nextIdx], speed));
        return () => clearTimeout(t);
    }, [playing, eventIdx, events, finished, speed]);

    useEffect(() => {
        const ev = events[eventIdx];
        if (!ev || !scrollRef.current || ev.type === 'partition_step') return;
        const c = scrollRef.current;
        c.scrollTo({ top: Math.max(0, ev.scrollY - c.clientHeight / 3), behavior: 'smooth' });
    }, [eventIdx, events]);

    const handlePlay = () => {
        if (finished) { setEventIdx(-1); setFinished(false); setTimeout(() => setPlaying(true), 80); }
        else setPlaying(true);
    };

    useEffect(() => {
        if (seekRef) seekRef.current = (idx) => {
            setPlaying(false);
            setFinished(idx >= events.length - 1);
            setEventIdx(Math.max(-1, Math.min(events.length - 1, idx)));
        };
    }, [seekRef, events.length]);

    useEffect(() => { onProgress?.({ idx: eventIdx, total: events.length }); }, [eventIdx, events.length, onProgress]);

    // ── Derived state ─────────────────────────────────────────────────────────
    const processed = useMemo(() => events.slice(0, eventIdx + 1), [events, eventIdx]);

    // Per-node phase
    const nodePhases = useMemo(() => {
        const phases = new Map();
        const stepIdxMap = new Map();
        processed.forEach(ev => {
            if (!ev.nodeId) return;
            if (ev.type === 'appear')         phases.set(ev.nodeId, 'appear');
            if (ev.type === 'base_case')      phases.set(ev.nodeId, 'base_case');
            if (ev.type === 'pivot_select')   phases.set(ev.nodeId, 'pivot_select');
            if (ev.type === 'init_pointers')  phases.set(ev.nodeId, 'init_pointers');
            if (ev.type === 'partition_step') {
                phases.set(ev.nodeId, 'partition_step');
                stepIdxMap.set(ev.nodeId, ev.stepIdx);
            }
            if (ev.type === 'partition_done') phases.set(ev.nodeId, 'partition_done');
            if (ev.type === 'spawn_child')    { /* parent stays at partition_done */ }
            if (ev.type === 'node_sorted')    phases.set(ev.nodeId, 'node_sorted');
        });
        return { phases, stepIdxMap };
    }, [processed]);

    // Visible node IDs (appeared)
    const visibleIds = useMemo(() => {
        const s = new Set();
        processed.forEach(ev => { if (ev.type === 'appear') s.add(ev.nodeId); });
        return s;
    }, [processed]);

    // SVG connector lines
    const svgLines = useMemo(() => {
        const lines = [];
        allNodes.forEach(node => {
            if (!visibleIds.has(node.id)) return;
            if (node.isBase) return;
            const phase = nodePhases.phases.get(node.id);
            const isSorted = phase === 'node_sorted';
            [node.left, node.right].forEach(child => {
                if (!child || !visibleIds.has(child.id)) return;
                lines.push({
                    key: `${node.id}->${child.id}`,
                    x1: node.x, y1: node.y + CELL_H + 14,
                    x2: child.x, y2: child.y - 4,
                    sorted: isSorted,
                });
            });
        });
        return lines;
    }, [allNodes, visibleIds, nodePhases]);

    // Current event for detail panel
    const currentEv = events[eventIdx];
    const detailEvent = currentEv?.type === 'partition_step' ? currentEv : null;
    const detailNode  = detailEvent ? nodeMap.get(detailEvent.nodeId) : null;

    const partitionCount = useMemo(() => {
        let c = 0; let lastId = null;
        for (let k = 0; k <= eventIdx; k++) {
            const e = events[k];
            if (e?.type === 'pivot_select' && e.nodeId !== lastId) { c++; lastId = e.nodeId; }
        }
        return c;
    }, [events, eventIdx]);

    const statusLabel = (() => {
        if (!currentEv) return 'Press ▶ Start to begin';
        if (finished)   return '✅ Array sorted! Replay to watch again.';
        const map = {
            appear:          '📋 New recursive call',
            base_case:       '↩️ Base case — returns',
            pivot_select:    '🎯 Selecting pivot',
            init_pointers:   '👆 Initializing i & j pointers',
            partition_step:  '🔄 Partitioning — scan & swap',
            partition_done:  '✂️ Partition complete',
            spawn_child:     '🔁 Recursing into sub-range',
            node_sorted:     '✅ Range sorted',
            final_done:      '🎉 Quick Sort complete',
        };
        return map[currentEv.type] ?? '';
    })();

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden">
            {/* Status bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-3 border-b border-slate-800 bg-slate-900">
                <span className="text-sm text-slate-200 font-medium">{statusLabel}</span>
                <div className="flex items-center gap-3">
                    {/* Speed */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                        {[0.5, 1, 1.5, 2, 3].map(s => (
                            <button key={s} onClick={() => setSpeed(s)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${speed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                                {s}×
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-6 bg-slate-700" />
                    {/* Reset */}
                    <button onClick={() => { setPlaying(false); setFinished(false); setEventIdx(-1); }}
                        disabled={eventIdx < 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="w-px h-6 bg-slate-700" />
                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setPlaying(false); setFinished(false); setEventIdx(i => Math.max(-1, i - 1)); }}
                            disabled={eventIdx < 0}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 transition-all text-slate-300 hover:text-white">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                            </svg>
                        </button>

                        {!playing && !finished && eventIdx < 0 && (
                            <button onClick={handlePlay}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/40">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 translate-x-px">
                                    <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd" />
                                </svg>
                                Start
                            </button>
                        )}
                        {playing && (
                            <button onClick={() => setPlaying(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded-xl transition-all">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" clipRule="evenodd" />
                                </svg>
                                Pause
                            </button>
                        )}
                        {!playing && eventIdx >= 0 && !finished && (
                            <button onClick={handlePlay}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 translate-x-px">
                                    <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd" />
                                </svg>
                                Resume
                            </button>
                        )}
                        {finished && (
                            <button onClick={handlePlay}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                </svg>
                                Replay
                            </button>
                        )}

                        <button onClick={() => { setPlaying(false); const ni = eventIdx + 1; if (ni >= events.length) setFinished(true); else setEventIdx(ni); }}
                            disabled={finished}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 transition-all text-slate-300 hover:text-white">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable tree */}
            <div ref={scrollRef} className="flex-1 overflow-auto">
                <div className="relative mx-auto" style={{ width: canvasW, height: canvasH + 80, minHeight: '100%' }}>
                    {/* SVG connector lines */}
                    <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH + 80} overflow="visible">
                        <defs>
                            <marker id="qs-arr-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                <path d="M0,0 L0,8 L8,4 Z" fill="#6366f1" />
                            </marker>
                            <marker id="qs-arr-sort" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                <path d="M0,0 L0,8 L8,4 Z" fill="#10b981" />
                            </marker>
                        </defs>
                        <AnimatePresence>
                            {svgLines.map(l => (
                                <motion.line key={l.key}
                                    x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                                    stroke={l.sorted ? '#10b981' : '#6366f1'} strokeWidth={2}
                                    markerEnd={!l.sorted ? 'url(#qs-arr-down)' : 'url(#qs-arr-sort)'}
                                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                            ))}
                        </AnimatePresence>
                    </svg>

                    {/* Nodes */}
                    <AnimatePresence>
                        {allNodes.map(node => {
                            if (!visibleIds.has(node.id)) return null;
                            const phase   = nodePhases.phases.get(node.id) ?? 'appear';
                            const stepIdx = nodePhases.stepIdxMap.get(node.id) ?? -1;
                            const boxW = Math.max(
                                (node.high - node.low + 1) * (CELL_W + CELL_GAP) + NODE_PAD * 2,
                                80
                            );

                            return (
                                <motion.div key={node.id}
                                    className="absolute flex flex-col items-center"
                                    style={{ left: node.x - boxW / 2, top: node.y }}
                                    initial={{ opacity: 0, scale: 0.6, y: -12 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.4, y: 20 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
                                    {/* Call label */}
                                    <div className="text-[10px] text-slate-500 font-mono mb-0.5">
                                        sort({node.low}, {node.high})
                                    </div>
                                    <NodeDisplay
                                        node={node}
                                        phase={phase}
                                        stepIdx={stepIdx}
                                        currentEv={currentEv}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Annotation badge */}
                    <AnimatePresence mode="wait">
                        {currentEv?.annotation && (() => {
                            const activeNode = allNodes.find(n => n.id === currentEv.nodeId && visibleIds.has(n.id));
                            if (!activeNode) return null;
                            const boxW = Math.max((activeNode.high - activeNode.low + 1) * (CELL_W + CELL_GAP) + NODE_PAD * 2, 80);
                            const parentNode = allNodes.find(n => !n.isBase && (n.left?.id === activeNode.id || n.right?.id === activeNode.id));
                            const isRight = !parentNode || parentNode.right?.id === activeNode.id;
                            return (
                                <motion.div key={currentEv.annotation}
                                    style={{
                                        position: 'absolute',
                                        left: isRight ? activeNode.x + boxW / 2 + 12 : activeNode.x - boxW / 2 - 12,
                                        top: activeNode.y + 2,
                                        zIndex: 30, maxWidth: 260,
                                        transform: isRight ? 'none' : 'translateX(-100%)',
                                    }}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}>
                                    <div className="rounded-xl border border-amber-600/50 px-4 py-2.5 text-sm font-medium leading-snug shadow-xl backdrop-blur bg-amber-900/60 text-amber-200">
                                        {currentEv.annotation}
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </div>
            </div>

            {/* Partition detail panel */}
            <AnimatePresence>
                {detailNode && (
                    <PartitionDetailPanel
                        key={detailNode.id}
                        node={detailNode}
                        stepIdx={detailEvent?.stepIdx ?? 0}
                        partitionCount={partitionCount}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickSortCoreLogicVisualizer;
