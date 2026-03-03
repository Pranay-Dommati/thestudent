/**
 * QuickSortCoreLogicVisualizer — redesigned
 *
 * Powerful visual walkthrough of Quick Sort (in-place, middle pivot):
 *  • Recursive call-tree with SVG connector lines
 *  • Sliding i/j pointer badges (sky/pink, spring animation — matches Code Execution tab)
 *  • Amber P-badge at pivot cell; zone coloring (left / pivot-zone / right / sorted)
 *  • Swap highlight with scale bounce; low/high index labels below cells
 *  • Shared VisualizerControls playback bar
 *  • Persistent bottom annotation panel with step description
 *
 * Mirrors Python:  pivot = nums[(low + high) // 2]
 * DO NOT touch QuickSortSyncedVisualizer.jsx (Code Execution tab) — it is final.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';

// ── Layout constants (mirror Code Execution tab) ──────────────────────────────
const CELL_W   = 40;
const CELL_H   = 40;
const CELL_GAP = 4;
const STRIDE   = CELL_W + CELL_GAP;   // per-index stride
const NODE_PAD = 16;                   // horizontal padding inside node box
const ELEM_W   = 56;                   // tree-layout: horizontal spacing per element
const LEVEL_H  = 195;                  // tree-layout: vertical spacing between levels
const LEFT_PAD = 340;                  // tree-layout: left canvas margin

const BADGE   = 20;   // normal badge diameter
const BADGE_S = 14;   // small badge (same-index collision)

// ── Animation helpers ─────────────────────────────────────────────────────────
const slideT    = { type: 'spring', stiffness: 260, damping: 28 };
const badgeT    = { x: slideT, opacity: { duration: 0.18 }, width: { duration: 0.12 }, height: { duration: 0.12 } };
const nodeSpring = { type: 'spring', stiffness: 220, damping: 22 };

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATION — unchanged logic
// ══════════════════════════════════════════════════════════════════════════════

const simulateQuickSort = (inputArr) => {
    const nums = [...inputArr];
    let counter = 0;
    const nodeMap = new Map();

    const dfs = (low, high, depth, parentId) => {
        const id = `qs-${counter++}`;
        const node = {
            id, low, high, depth, parentId,
            isBase: low >= high,
            arrAtEntry: [...nums],
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
        node.pivot    = nums[pivotIdx];
        node.pivotIdx = pivotIdx;

        let i = low, j = high;

        while (i <= j) {
            const iFrom = i, jFrom = j;
            const arrBefore = [...nums];

            while (nums[i] < node.pivot) i++;
            while (nums[j] > node.pivot) j--;

            const iStop = i, jStop = j;
            let didSwap = false, si = null, sj = null;

            if (i <= j) {
                didSwap = true; si = i; sj = j;
                [nums[i], nums[j]] = [nums[j], nums[i]];
                i++; j--;
            }

            node.partitionSteps.push({
                iFrom, jFrom, iStop, jStop,
                didSwap, si, sj,
                arrBefore, arrAfter: [...nums],
            });
        }

        node.finalI = i;
        node.finalJ = j;
        node.arrAfterPartition = [...nums];

        if (j >= low)  node.leftChildId  = dfs(low,  j,    depth + 1, id);
        if (i <= high) node.rightChildId = dfs(i,     high, depth + 1, id);

        return id;
    };

    const rootId = dfs(0, nums.length - 1, 0, null);

    for (const node of nodeMap.values()) {
        node.left  = node.leftChildId  ? nodeMap.get(node.leftChildId)  : null;
        node.right = node.rightChildId ? nodeMap.get(node.rightChildId) : null;
    }

    return { nodeMap, rootId, finalArr: [...nums] };
};

const assignLayout = (nodeMap) => {
    for (const node of nodeMap.values()) {
        const mid = (node.low + node.high) / 2;
        node.x = mid * ELEM_W + LEFT_PAD;
        node.y = node.depth * LEVEL_H;
    }
};

// ── Event stream ──────────────────────────────────────────────────────────────
const BUILD_EVENTS = (nodeMap, rootId) => {
    const evs = [];

    const dfs = (node) => {
        evs.push({
            type: 'appear', nodeId: node.id, scrollY: node.y,
            annotation: node.isBase
                ? `sort(${node.low}, ${node.high})  —  single element, already sorted`
                : `sort(${node.low}, ${node.high})  —  ${node.high - node.low + 1} elements`,
        });

        if (node.isBase) {
            evs.push({
                type: 'base_case', nodeId: node.id, scrollY: node.y,
                annotation: `${node.low} ≥ ${node.high}  →  return immediately (base case)`,
            });
            return;
        }

        evs.push({
            type: 'pivot_select', nodeId: node.id, scrollY: node.y,
            annotation: `Pick pivot:  nums[(${node.low}+${node.high})÷2]  =  nums[${node.pivotIdx}]  =  ${node.pivot}`,
        });

        evs.push({
            type: 'init_pointers', nodeId: node.id, scrollY: node.y,
            annotation: `Init pointers:  i = ${node.low}  (left end),   j = ${node.high}  (right end)`,
        });

        // ── Scan + swap for every partition iteration ─────────────────────
        node.partitionSteps.forEach((step, si_idx) => {
            const ab = step.arrBefore;
            const aa = step.arrAfter;
            const slice = (a) => a.slice(node.low, node.high + 1);

            // i scan — each step: move i to pos AND explain simultaneously
            for (let pos = step.iFrom; pos < step.iStop; pos++) {
                const isFirst = pos === step.iFrom;
                evs.push({
                    type: 'scan_i_move', nodeId: node.id, scrollY: node.y,
                    scanI: pos, arrSlice: slice(ab), iAbs: pos, jAbs: step.jFrom,
                    annotation: isFirst && si_idx === 0
                        ? `Scanning i →  nums[${pos}] = ${ab[pos]} < pivot (${node.pivot}) — not large enough, move right`
                        : `nums[${pos}] = ${ab[pos]} < pivot (${node.pivot}) — not large enough, i moves right →`,
                });
            }
            evs.push({
                type: 'scan_i_found', nodeId: node.id, scrollY: node.y,
                scanI: step.iStop, arrSlice: slice(ab), iAbs: step.iStop, jAbs: step.jFrom,
                annotation: `nums[${step.iStop}] = ${ab[step.iStop]} ≥ pivot (${node.pivot}) — found the large element! i stops here ✓`,
            });

            // j scan — each step: move j to pos AND explain simultaneously
            for (let pos = step.jFrom; pos > step.jStop; pos--) {
                const isFirst = pos === step.jFrom;
                evs.push({
                    type: 'scan_j_move', nodeId: node.id, scrollY: node.y,
                    scanJ: pos, arrSlice: slice(ab), iAbs: step.iStop, jAbs: pos,
                    annotation: isFirst && si_idx === 0
                        ? `Scanning j ←  nums[${pos}] = ${ab[pos]} > pivot (${node.pivot}) — not small enough, move left`
                        : `nums[${pos}] = ${ab[pos]} > pivot (${node.pivot}) — not small enough, j moves left ←`,
                });
            }
            evs.push({
                type: 'scan_j_found', nodeId: node.id, scrollY: node.y,
                scanJ: step.jStop, arrSlice: slice(ab), iAbs: step.iStop, jAbs: step.jStop,
                annotation: `nums[${step.jStop}] = ${ab[step.jStop]} ≤ pivot (${node.pivot}) — found the small element! j stops here ✓`,
            });

            if (step.didSwap) {
                evs.push({
                    type: 'pre_swap', nodeId: node.id, scrollY: node.y,
                    arrSlice: slice(aa), iAbs: step.si, jAbs: step.sj, swapI: step.si, swapJ: step.sj,
                    annotation: `Now swap! nums[${step.si}] = ${ab[step.si]}  ↔  nums[${step.sj}] = ${ab[step.sj]}`,
                });
                evs.push({
                    type: 'post_swap', nodeId: node.id, scrollY: node.y,
                    arrSlice: slice(aa), iAbs: step.si + 1, jAbs: step.sj - 1,
                    annotation: `Swap done! i++ → [${step.si + 1}],  j-- → [${step.sj - 1}]  —  now repeat: scan i → and j ← again until they cross`,
                });
            }
        });
        // No partition_step events — everything is shown educationally above

        evs.push({
            type: 'partition_done', nodeId: node.id,
            scrollY: Math.max(0, node.y + LEVEL_H - 80),
            annotation: `Partition done:  [${node.low}..${node.finalJ}] ≤ ${node.pivot} ≤ [${node.finalI}..${node.high}]`,
        });

        if (node.left) {
            evs.push({
                type: 'spawn_child', nodeId: node.id, childId: node.leftChildId,
                scrollY: Math.max(0, node.y + LEVEL_H - 80),
                annotation: `Recurse left partition:  sort(${node.low}, ${node.finalJ})`,
            });
            dfs(node.left);
        }
        if (node.right) {
            evs.push({
                type: 'spawn_child', nodeId: node.id, childId: node.rightChildId,
                scrollY: Math.max(0, node.y + LEVEL_H - 80),
                annotation: `Recurse right partition:  sort(${node.finalI}, ${node.high})`,
            });
            dfs(node.right);
        }

        evs.push({
            type: 'node_sorted', nodeId: node.id,
            scrollY: Math.max(0, node.y - 40),
            annotation: `Range [${node.low}..${node.high}] is fully sorted ✓`,
        });
    };

    dfs(nodeMap.get(rootId));
    evs.push({ type: 'final_done', scrollY: 0, annotation: `Quick Sort complete! The array is now sorted.` });
    return evs;
};

const DELAY = {
    appear: 650, base_case: 900, pivot_select: 1100, init_pointers: 900,
    scan_i_move: 700, scan_i_found: 1200,
    scan_j_move: 700, scan_j_found: 1200,
    pre_swap: 1500, post_swap: 1400,
    partition_step: 1000, partition_done: 900, spawn_child: 600,
    node_sorted: 800, final_done: 1800,
};
const getDelay = (ev, speed) => (DELAY[ev.type] ?? 800) / speed;

// ════════════════════════════════════════════════════════════════════════════════
// NodeCard  — one call-tree node with sliding i/j/P badges
// ════════════════════════════════════════════════════════════════════════════════

const NodeCard = ({ node, phase, stepIdx, isActive, scanIAbs, scanJAbs, evData }) => {
    const n      = node.high - node.low + 1;
    const cellsW = n * CELL_W + Math.max(0, n - 1) * CELL_GAP;
    const boxW   = cellsW + NODE_PAD * 2 + 4;

    // ── Compute visible state ──────────────────────────────────────────────────
    let arr       = node.arrAtEntry.slice(node.low, node.high + 1);
    let iRel      = null;   // relative to low
    let jRel      = null;
    let pivotRel  = null;
    let zones     = null;   // 'all_sorted' | { leftEnd, rightStart } | null
    let swappedI  = null;
    let swappedJ  = null;

    // Helper: use evData (live event snapshot) when available for scan/swap phases
    const SCAN_SWAP_PHASES = new Set([
        'scan_i_move','scan_i_found',
        'scan_j_move','scan_j_found',
        'pre_swap','post_swap',
    ]);
    if (SCAN_SWAP_PHASES.has(phase) && evData) {
        arr      = evData.arrSlice ?? arr;
        pivotRel = node.pivotIdx - node.low;
        iRel     = evData.iAbs != null ? Math.max(0, Math.min(n - 1, evData.iAbs - node.low)) : null;
        jRel     = evData.jAbs != null ? Math.max(0, Math.min(n - 1, evData.jAbs - node.low)) : null;
        if (phase === 'pre_swap' && evData.swapI != null) {
            swappedI = evData.swapI - node.low;
            swappedJ = evData.swapJ - node.low;
        }
    } else if (phase === 'pivot_select' || phase === 'init_pointers') {
        pivotRel = node.pivotIdx - node.low;
        if (phase === 'init_pointers') { iRel = 0; jRel = n - 1; }
    } else if (phase === 'partition_done') {
        arr   = node.arrAfterPartition.slice(node.low, node.high + 1);
        zones = { leftEnd: node.finalJ - node.low, rightStart: node.finalI - node.low };
    } else if (phase === 'node_sorted') {
        arr   = node.arrAfterPartition.slice(node.low, node.high + 1);
        zones = 'all_sorted';
    }

    // ── Badge positions (x = translate from left edge of cellsW container) ────
    const showI  = iRel !== null;
    const showJ  = jRel !== null;
    const showP  = pivotRel !== null;
    const same   = showI && showJ && iRel === jRel;
    const iSz    = same ? BADGE_S : BADGE;
    const jSz    = same ? BADGE_S : BADGE;

    // Centre of cell k: k*STRIDE + CELL_W/2
    const iXp = iRel !== null
        ? same
            ? iRel * STRIDE + CELL_W / 2 - iSz - 1
            : iRel * STRIDE + CELL_W / 2 - iSz / 2
        : 0;
    const jXp = jRel !== null
        ? same
            ? jRel * STRIDE + CELL_W / 2 + 1
            : jRel * STRIDE + CELL_W / 2 - jSz / 2
        : (n - 1) * STRIDE + CELL_W / 2 - BADGE / 2;
    const pXp = pivotRel !== null ? pivotRel * STRIDE + CELL_W / 2 - BADGE / 2 : 0;

    // ── Zone helper ───────────────────────────────────────────────────────────
    const getZone = (idx) => {
        if (zones === 'all_sorted') return 'sorted';
        if (!zones) return null;
        if (idx <= zones.leftEnd)    return 'left';
        if (idx < zones.rightStart)  return 'pivot';
        return 'right';
    };

    // ── Box border/bg tint by phase ───────────────────────────────────────────
    const isScanPhase = phase === 'scan_i_move' || phase === 'scan_i_found'
        || phase === 'scan_j_move' || phase === 'scan_j_found';
    const isPreSwap = phase === 'pre_swap';
    const boxBorder =
        zones === 'all_sorted'                                      ? 'border-emerald-600/60' :
        zones                                                       ? 'border-slate-600/50'   :
        phase === 'pivot_select' || phase === 'init_pointers'       ? 'border-amber-500/50'   :
        isScanPhase                                                 ? 'border-sky-400/60'     :
        isPreSwap                                                   ? 'border-rose-500/60'    :
        phase === 'partition_step'                                  ? 'border-sky-500/50'     :
        isActive                                                    ? 'border-indigo-500/60'  :
                                                                      'border-slate-700/40';
    const boxBg = zones === 'all_sorted' ? 'bg-emerald-900/40' : 'bg-slate-800/70';

    // ── Base case ─────────────────────────────────────────────────────────────
    if (phase === 'base_case') {
        const v = (node.low <= node.high) ? node.arrAtEntry[node.low] : null;
        return (
            <div className="flex flex-col items-center gap-0.5" style={{ width: boxW }}>
                <div className="flex items-center justify-center rounded-xl border-2 bg-emerald-900/50 border-emerald-600/60 shadow-md"
                    style={{ padding: `7px ${NODE_PAD}px`, gap: CELL_GAP, width: boxW }}>
                    {v !== null
                        ? <div className="flex items-center justify-center rounded-lg border-2 text-sm font-bold bg-emerald-600 border-emerald-400 text-white flex-shrink-0"
                            style={{ width: CELL_W, height: CELL_H }}>{v}</div>
                        : <span className="text-slate-500 text-xs italic px-2">empty</span>}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">sorted ✓</span>
            </div>
        );
    }

    // ── Normal node ───────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center" style={{ width: boxW }}>

            {/* ── i / j badge row (above cells) ── */}
            <div className="relative flex-shrink-0" style={{ width: cellsW, height: BADGE + 6 }}>
                {/* i badge */}
                <motion.div
                    key="i-badge"
                    className="absolute flex items-center justify-center rounded-full bg-sky-500 text-white font-bold text-[11px] leading-none shadow shadow-sky-900/60"
                    style={{ bottom: 2, left: 0, width: iSz, height: iSz }}
                    initial={{ x: iXp, opacity: 0 }}
                    animate={{ x: iXp, opacity: showI ? 1 : 0, width: iSz, height: iSz }}
                    transition={badgeT}>
                    i
                </motion.div>
                {/* j badge */}
                <motion.div
                    key="j-badge"
                    className="absolute flex items-center justify-center rounded-full bg-pink-600 text-white font-bold text-[11px] leading-none shadow shadow-pink-900/60"
                    style={{ bottom: 2, left: 0, width: jSz, height: jSz }}
                    initial={{ x: jXp, opacity: 0 }}
                    animate={{ x: jXp, opacity: showJ ? 1 : 0, width: jSz, height: jSz }}
                    transition={badgeT}>
                    j
                </motion.div>
            </div>

            {/* ── Array cell box ── */}
            <motion.div
                className={`flex items-center rounded-xl border-2 shadow-lg flex-shrink-0 ${boxBg} ${boxBorder}`}
                style={{ padding: `7px ${NODE_PAD}px`, gap: CELL_GAP, width: boxW }}
                animate={isActive && phase !== 'node_sorted' && phase !== 'base_case'
                    ? { boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 14px rgba(99,102,241,0.35)', '0 0 0px rgba(99,102,241,0)'] }
                    : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
                }
                transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}>
                {arr.map((v, idx) => {
                    const zone   = getZone(idx);
                    const isPiv  = pivotRel !== null && idx === pivotRel;
                    const isSwpI = idx === swappedI;
                    const isSwpJ = idx === swappedJ;

                    let cls = 'bg-slate-700 border-slate-500 text-slate-200';
                    if (zone === 'sorted') cls = 'bg-emerald-600 border-emerald-400 text-white';
                    else if (zone === 'left')  cls = 'bg-indigo-800 border-indigo-500 text-indigo-100';
                    else if (zone === 'pivot') cls = 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300/60';
                    else if (zone === 'right') cls = 'bg-slate-600 border-slate-400 text-slate-100';
                    if (isPiv) cls = 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-200/80 shadow-md shadow-amber-500/40';
                    if (isSwpI || isSwpJ) cls = 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300 shadow-lg shadow-rose-500/60';

                    // Flying-cross swap arc (same as Code Execution tab):
                    // arr holds post-swap values, so each cell animates FROM its original offset TO 0.
                    const swapDist = (swappedI !== null && swappedJ !== null)
                        ? (swappedJ - swappedI) * STRIDE : 0;
                    let swapAnim = { x: 0, y: 0 };
                    if (isSwpI && swapDist > 0) {
                        swapAnim = { x: [swapDist, swapDist * 0.5, 0], y: [0, -22, 0] };
                    } else if (isSwpJ && swapDist > 0) {
                        swapAnim = { x: [-swapDist, -swapDist * 0.5, 0], y: [0, 22, 0] };
                    }

                    return (
                        <motion.div key={idx}
                            className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 ${cls}`}
                            style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W, position: 'relative', zIndex: (isSwpI || isSwpJ) ? 10 : 0 }}
                            animate={swapAnim}
                            transition={(isSwpI || isSwpJ) ? { duration: 0.55, ease: 'easeInOut' } : { duration: 0 }}>
                            {v}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* ── P pivot badge row (below cells) ── */}
            <div className="relative flex-shrink-0" style={{ width: cellsW, height: BADGE + 4 }}>
                <motion.div
                    key="p-badge"
                    className="absolute flex items-center justify-center rounded-full bg-amber-500 text-white font-bold text-[10px] leading-none shadow shadow-amber-900/60"
                    style={{ top: 3, left: 0, width: BADGE, height: BADGE }}
                    initial={{ x: pXp, opacity: 0 }}
                    animate={{ x: pXp, opacity: showP ? 1 : 0 }}
                    transition={{ x: slideT, opacity: { duration: 0.2 } }}>
                    P
                </motion.div>
            </div>

            {/* ── Index labels (low / high positions) ── */}
            <div className="flex flex-shrink-0" style={{ width: cellsW, gap: CELL_GAP }}>
                {arr.map((_, idx) => {
                    const absIdx = node.low + idx;
                    const isLow  = idx === 0;
                    const isHigh = idx === n - 1;
                    return (
                        <div key={idx} style={{ width: CELL_W, minWidth: CELL_W }}
                            className="text-center text-[9px] leading-none mt-0.5">
                            {(isLow || isHigh) && (
                                <span className={isLow ? 'text-indigo-400/70' : 'text-pink-400/70'}>
                                    {absIdx}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Zone legend ── */}
            {zones === 'all_sorted' && (
                <motion.span className="text-[10px] text-emerald-400 font-semibold mt-0.5"
                    initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}>
                    sorted ✓
                </motion.span>
            )}
            {zones && zones !== 'all_sorted' && (
                <motion.div className="flex items-center gap-1.5 mt-1"
                    initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}>
                    {node.finalJ >= node.low && (
                        <span className="text-[9px] text-indigo-300 font-medium px-1.5 py-0.5 rounded bg-indigo-900/50 border border-indigo-700/40">
                            ≤ {node.pivot}
                        </span>
                    )}
                    {node.finalJ < node.finalI - 1 && (
                        <span className="text-[9px] text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-700/40">
                            = {node.pivot}
                        </span>
                    )}
                    {node.finalI <= node.high && (
                        <span className="text-[9px] text-slate-300 font-medium px-1.5 py-0.5 rounded bg-slate-700/60 border border-slate-600/40">
                            ≥ {node.pivot}
                        </span>
                    )}
                </motion.div>
            )}
        </div>
    );
};

// ── Annotation step metadata ──────────────────────────────────────────────────
const STEP_META = {
    appear:         { icon: '🔍', color: 'text-slate-200',   bar: 'border-slate-600/40 bg-slate-800/50' },
    base_case:      { icon: '✅', color: 'text-emerald-300', bar: 'border-emerald-700/40 bg-emerald-900/30' },
    pivot_select:   { icon: '🎯', color: 'text-amber-300',   bar: 'border-amber-700/40 bg-amber-900/30' },
    init_pointers:   { icon: '👆', color: 'text-sky-300',     bar: 'border-sky-700/40 bg-sky-900/30' },
    scan_i_move:     { icon: '➡️', color: 'text-slate-300',   bar: 'border-slate-700/30 bg-slate-900/60' },
    scan_i_found:    { icon: '✋', color: 'text-emerald-300', bar: 'border-emerald-700/40 bg-emerald-900/30' },
    scan_j_move:     { icon: '⬅️', color: 'text-slate-300',  bar: 'border-slate-700/30 bg-slate-900/60' },
    scan_j_found:    { icon: '✋', color: 'text-pink-300',   bar: 'border-pink-700/40 bg-pink-900/30' },
    pre_swap:        { icon: '🔀', color: 'text-rose-200',   bar: 'border-rose-600/50 bg-rose-950/60' },
    post_swap:       { icon: '🔁', color: 'text-sky-200',    bar: 'border-sky-700/40 bg-sky-950/50' },
    partition_step:  { icon: '🔄', color: 'text-pink-300',    bar: 'border-pink-700/30 bg-pink-900/20' },
    partition_done: { icon: '✂️', color: 'text-violet-300',  bar: 'border-violet-700/40 bg-violet-900/30' },
    spawn_child:    { icon: '🔁', color: 'text-indigo-300',  bar: 'border-indigo-700/40 bg-indigo-900/30' },
    node_sorted:    { icon: '✅', color: 'text-emerald-300', bar: 'border-emerald-700/40 bg-emerald-900/30' },
    final_done:     { icon: '🎉', color: 'text-emerald-200', bar: 'border-emerald-600/60 bg-emerald-900/40' },
};

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════

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

    const { nodeMap, rootId } = useMemo(() => simulateQuickSort(inputArr), [inputArr]);
    useMemo(() => assignLayout(nodeMap), [nodeMap]);

    const allNodes = useMemo(() => [...nodeMap.values()], [nodeMap]);
    const events   = useMemo(() => BUILD_EVENTS(nodeMap, rootId), [nodeMap, rootId]);
    const maxDepth = useMemo(() => Math.max(...allNodes.map(n => n.depth)), [allNodes]);

    const n       = inputArr.length;
    const canvasW = n * ELEM_W + LEFT_PAD * 2;
    const canvasH = (maxDepth + 1) * LEVEL_H + 220;

    // ── Playback state ────────────────────────────────────────────────────────
    const [eventIdx, setEventIdx] = useState(-1);
    const [playing,  setPlaying]  = useState(false);
    const [finished, setFinished] = useState(false);
    const [speed,    setSpeed]    = useState(1);
    const scrollRef = useRef(null);

    // Reset when array changes
    useEffect(() => {
        setEventIdx(-1); setPlaying(false); setFinished(false);
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [inputArr]);

    // Auto-advance
    useEffect(() => {
        if (!playing || finished) return;
        const next = eventIdx + 1;
        if (next >= events.length) { setFinished(true); setPlaying(false); return; }
        const t = setTimeout(() => setEventIdx(next), getDelay(events[next], speed));
        return () => clearTimeout(t);
    }, [playing, eventIdx, events, finished, speed]);

    // Auto-scroll
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

    // ── Derived: per-node phase ───────────────────────────────────────────────
    const processed = useMemo(() => events.slice(0, eventIdx + 1), [events, eventIdx]);

    const { nodePhases, stepIdxMap, scanIMap, scanJMap, evDataMap } = useMemo(() => {
        const phases  = new Map();
        const stepMap = new Map();
        const scanMap = new Map();
        const scanJM  = new Map();
        const evDM    = new Map(); // nodeId → latest evData for scan/swap phases
        processed.forEach(ev => {
            if (!ev.nodeId) return;
            if (ev.type === 'appear')          phases.set(ev.nodeId, 'appear');
            if (ev.type === 'base_case')       phases.set(ev.nodeId, 'base_case');
            if (ev.type === 'pivot_select')    phases.set(ev.nodeId, 'pivot_select');
            if (ev.type === 'init_pointers')   phases.set(ev.nodeId, 'init_pointers');
            if (ev.type === 'scan_i_move')   { phases.set(ev.nodeId, 'scan_i_move');  scanMap.set(ev.nodeId, ev.scanI); evDM.set(ev.nodeId, ev); }
            if (ev.type === 'scan_i_found')  { phases.set(ev.nodeId, 'scan_i_found'); scanMap.set(ev.nodeId, ev.scanI); evDM.set(ev.nodeId, ev); }
            if (ev.type === 'scan_j_move')   { phases.set(ev.nodeId, 'scan_j_move');  scanJM.set(ev.nodeId, ev.scanJ); evDM.set(ev.nodeId, ev); }
            if (ev.type === 'scan_j_found')  { phases.set(ev.nodeId, 'scan_j_found'); scanJM.set(ev.nodeId, ev.scanJ); evDM.set(ev.nodeId, ev); }
            if (ev.type === 'pre_swap')      { phases.set(ev.nodeId, 'pre_swap');  evDM.set(ev.nodeId, ev); }
            if (ev.type === 'post_swap')     { phases.set(ev.nodeId, 'post_swap'); evDM.set(ev.nodeId, ev); }
            if (ev.type === 'partition_step') { phases.set(ev.nodeId, 'partition_step'); stepMap.set(ev.nodeId, ev.stepIdx); }
            if (ev.type === 'partition_done')  phases.set(ev.nodeId, 'partition_done');
            if (ev.type === 'node_sorted')     phases.set(ev.nodeId, 'node_sorted');
        });
        return { nodePhases: phases, stepIdxMap: stepMap, scanIMap: scanMap, scanJMap: scanJM, evDataMap: evDM };
    }, [processed]);

    const visibleIds = useMemo(() => {
        const s = new Set();
        processed.forEach(ev => { if (ev.type === 'appear') s.add(ev.nodeId); });
        return s;
    }, [processed]);

    // SVG connector lines
    const svgLines = useMemo(() => {
        const lines = [];
        allNodes.forEach(node => {
            if (!visibleIds.has(node.id) || node.isBase) return;
            const sorted = nodePhases.get(node.id) === 'node_sorted';
            [node.left, node.right].forEach(child => {
                if (!child || !visibleIds.has(child.id)) return;
                // y1: top of node + call-label (14px) + badge-row (BADGE+6) + cell box (CELL_H+14+7px pad) 
                lines.push({
                    key: `${node.id}->${child.id}`,
                    x1: node.x, y1: node.y + 14 + (BADGE + 6) + CELL_H + 18,
                    x2: child.x, y2: child.y + 8,
                    sorted,
                });
            });
        });
        return lines;
    }, [allNodes, visibleIds, nodePhases]);

    const currentEv = events[eventIdx];
    const meta      = currentEv ? (STEP_META[currentEv.type] ?? STEP_META.appear) : null;
    const activeId  = currentEv?.nodeId ?? null;

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden">

            {/* ── Shared playback controls ──────────────────────────────────── */}
            <VisualizerControls
                speed={speed} setSpeed={setSpeed}
                eventIdx={eventIdx} playing={playing} finished={finished}
                onPlay={handlePlay}
                onPause={() => setPlaying(false)}
                onReset={() => { setPlaying(false); setFinished(false); setEventIdx(-1); }}
                onBack={() => { setPlaying(false); setFinished(false); setEventIdx(i => Math.max(-1, i - 1)); }}
                onNext={() => {
                    setPlaying(false);
                    const ni = eventIdx + 1;
                    if (ni >= events.length) setFinished(true);
                    else setEventIdx(ni);
                }}
            />

            {/* ── Scrollable call-tree canvas ───────────────────────────────── */}
            <div ref={scrollRef} className="flex-1 overflow-auto">
                <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, minHeight: '100%' }}>

                    {/* SVG connector lines */}
                    <svg className="absolute inset-0 pointer-events-none"
                        width={canvasW} height={canvasH} overflow="visible">
                        <defs>
                            <marker id="cl-arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                <path d="M0,0 L0,8 L8,4 Z" fill="#6366f1" />
                            </marker>
                            <marker id="cl-sort" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                <path d="M0,0 L0,8 L8,4 Z" fill="#10b981" />
                            </marker>
                        </defs>
                        <AnimatePresence>
                            {svgLines.map(l => (
                                <motion.line key={l.key}
                                    x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                                    stroke={l.sorted ? '#10b981' : '#6366f1'} strokeWidth={2}
                                    markerEnd={l.sorted ? 'url(#cl-sort)' : 'url(#cl-arr)'}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.45, ease: 'easeOut' }} />
                            ))}
                        </AnimatePresence>
                    </svg>

                    {/* Node cards */}
                    <AnimatePresence>
                        {allNodes.map(node => {
                            if (!visibleIds.has(node.id)) return null;
                            const phase    = nodePhases.get(node.id) ?? 'appear';
                            const st       = stepIdxMap.get(node.id) ?? 0;
                            const isActive = node.id === activeId;
                            const arrLen   = node.high - node.low + 1;
                            const cellsW2  = arrLen * CELL_W + Math.max(0, arrLen - 1) * CELL_GAP;
                            const cardW    = Math.max(cellsW2 + NODE_PAD * 2 + 4, 80);

                            return (
                                <motion.div key={node.id}
                                    className="absolute flex flex-col items-center"
                                    style={{ left: node.x - cardW / 2, top: node.y }}
                                    initial={{ opacity: 0, scale: 0.6, y: -14 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.4, y: 18 }}
                                    transition={nodeSpring}>
                                    {/* Call label — amber when active */}
                                    <div className={`text-[10px] font-mono mb-0.5 transition-colors duration-200 ${isActive ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                                        sort({node.low}, {node.high})
                                    </div>
                                    <NodeCard
                                        node={node}
                                        phase={phase}
                                        stepIdx={st}
                                        isActive={isActive}
                                        scanIAbs={scanIMap.get(node.id) ?? null}
                                        scanJAbs={scanJMap.get(node.id) ?? null}
                                        evData={evDataMap.get(node.id) ?? null}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* ── Floating annotation tooltip — only for scan / swap steps ── */}
                    <AnimatePresence>
                        {currentEv && !finished && (() => {
                            const SHOW_TYPES = new Set([
                                'scan_i_move', 'scan_i_found',
                                'scan_j_move', 'scan_j_found',
                                'pre_swap', 'post_swap',
                            ]);
                            if (!SHOW_TYPES.has(currentEv.type)) return null;

                            const isJSide = currentEv.type === 'scan_j_explain' || currentEv.type === 'scan_j_move' || currentEv.type === 'scan_j_found';
                            const nd = currentEv.nodeId ? allNodes.find(n => n.id === currentEv.nodeId && visibleIds.has(n.id)) : null;
                            if (!nd) return null;

                            const aLen = nd.high - nd.low + 1;
                            const cWid = aLen * CELL_W + Math.max(0, aLen - 1) * CELL_GAP;
                            const bWid = Math.max(cWid + NODE_PAD * 2 + 4, 80);
                            const tipLeft = isJSide ? nd.x - bWid / 2 - 256 : nd.x + bWid / 2 + 16;
                            const tipTop  = nd.y + 28;
                            const m = meta ?? STEP_META.appear;

                            const tipCls =
                                currentEv.type === 'scan_i_found'
                                    ? 'border-emerald-500/60 bg-emerald-900/85 text-emerald-100'
                                : currentEv.type === 'scan_i_move' || currentEv.type === 'scan_j_move'
                                    ? 'border-slate-600/50 bg-slate-800/90 text-slate-200'
                                : currentEv.type === 'scan_j_found'
                                    ? 'border-pink-500/60 bg-pink-900/85 text-pink-100'
                                : currentEv.type === 'pre_swap'
                                    ? 'border-rose-500/60 bg-rose-900/85 text-rose-100'
                                : 'border-sky-600/50 bg-sky-950/85 text-sky-100'; // post_swap

                            return (
                                <motion.div
                                    key={`tip-${eventIdx}`}
                                    className="absolute z-30 pointer-events-none"
                                    style={{ left: tipLeft, top: tipTop }}
                                    initial={{ opacity: 0, x: isJSide ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isJSide ? 6 : -6 }}
                                    transition={{ duration: 0.18 }}>
                                    <div className={`rounded-xl border px-4 py-2.5 shadow-xl backdrop-blur max-w-[260px] ${tipCls}`}>
                                        <div className="flex items-start gap-2">
                                            <span className="text-base leading-none flex-shrink-0 mt-0.5">{m.icon}</span>
                                            <span className="text-sm font-medium leading-snug">{currentEv.annotation}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>

                    {/* idle hint */}
                    {eventIdx < 0 && !finished && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 px-6 py-3 text-sm text-slate-400 backdrop-blur shadow-xl">
                                ▶ Press Start to begin the Quick Sort visualization
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickSortCoreLogicVisualizer;
