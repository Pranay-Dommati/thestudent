/**
 * QuickSortSyncedVisualizer
 *
 * "Code Execution" tab — the call-tree animation and the code panel 
 * are perfectly in sync: each animation event highlights the exact
 * code line and shows a contextual annotation card.
 *
 * Quick Sort uses middle element as pivot (in-place).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Layout constants ─────────────────────────────────────────────────────────
const CELL_W   = 40;
const CELL_H   = 40;
const CELL_GAP = 4;
const ELEM_W   = 56;
const LEVEL_H  = 180;
const NODE_PAD = 16;
const LEFT_PAD = 340;

// ── Line numbers in the quick sort code ─────────────────────────────────────
const LINE = {
    SORT_DEF:       1,
    BASE_CHECK:     2,
    BASE_RETURN:    3,
    PIVOT:          5,
    INIT_I:         7,
    INIT_J:         8,
    WHILE_OUTER:   10,
    WHILE_I:       11,
    INC_I:         12,
    WHILE_J:       13,
    DEC_J:         14,
    IF_SWAP:       16,
    SWAP:          17,
    POST_I:        18,
    POST_J:        19,
    RECURSE_LEFT:  21,
    RECURSE_RIGHT: 22,
    NUMS_ASSIGN:   26,
    CALL_SORT:     27,
    RETURN_NUMS:   28,
};

// ── Delays per event type ─────────────────────────────────────────────────────
const DELAY = {
    call:              3200,
    check_base:        2800,
    base_return:       2400,
    pivot_select:      3200,
    init_i:            2400,
    init_j:            2400,
    while_outer:       2800,
    i_scan:            2200,
    i_scan_done:       2200,
    j_scan:            2200,
    j_scan_done:       2200,
    if_swap:           2600,
    swap_exec:         2800,
    post_i:            2000,
    post_j:            2000,
    while_outer_exit:  2600,
    recurse_left:      2800,
    recurse_right:     2800,
    node_sorted:       2400,
    final_done:        3600,
};

const getDelay = (ev, speed) => (DELAY[ev.type] ?? 1200) / speed;

// ── Simulation: captures full execution detail for synced events ──────────────
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
            iHistory: [], // all i scan steps: { iFrom, iTo, arr }
            jHistory: [], // all j scan steps: { jFrom, jTo, arr }
            partitionIter: [], // each outer-while iteration
            finalI: null, finalJ: null,
            arrAfterPartition: null,
            leftChildId: null, rightChildId: null,
            left: null, right: null,
            x: 0, y: 0,
        };
        nodeMap.set(id, node);

        if (low >= high) return id;

        const pivotIdx = Math.floor((low + high) / 2);
        node.pivot  = nums[pivotIdx];
        node.pivotIdx = pivotIdx;

        let i = low, j = high;

        while (i <= j) {
            const iterStart = { i, j, arr: [...nums] };

            // Scan i
            const iScanSteps = [];
            while (nums[i] < node.pivot) {
                iScanSteps.push({ from: i, to: i + 1, arr: [...nums] });
                i++;
            }

            // Scan j
            const jScanSteps = [];
            while (nums[j] > node.pivot) {
                jScanSteps.push({ from: j, to: j - 1, arr: [...nums] });
                j--;
            }

            const iStop = i, jStop = j;
            let didSwap = false, si = null, sj = null;
            let arrBeforeSwap = [...nums], arrAfterSwap = null;

            if (i <= j) {
                didSwap = true;
                si = i; sj = j;
                arrBeforeSwap = [...nums];
                [nums[i], nums[j]] = [nums[j], nums[i]];
                arrAfterSwap = [...nums];
                i++; j--;
            }

            node.partitionIter.push({
                iterStart,
                iScanSteps,
                jScanSteps,
                iStop, jStop,
                didSwap, si, sj,
                arrBeforeSwap,
                arrAfterSwap: arrAfterSwap ?? [...nums],
                iAfter: i, jAfter: j,
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

// ── Layout ───────────────────────────────────────────────────────────────────
const assignLayout = (nodeMap) => {
    for (const node of nodeMap.values()) {
        node.x = ((node.low + node.high) / 2) * ELEM_W + LEFT_PAD;
        node.y = node.depth * LEVEL_H;
    }
};

// ── Build detailed synced events ─────────────────────────────────────────────
const buildSyncedEvents = (nodeMap, rootId) => {
    const evs = [];
    const fmt = arr => `[${arr.join(', ')}]`;

    const dfs = (node, isRoot) => {
        // For root: show nums assignment then the initial call site before entering function
        if (isRoot) {
            evs.push({
                type: 'call', nodeId: node.id, scrollY: node.y,
                codeLine: LINE.NUMS_ASSIGN,
                annotation: `nums = ${fmt(node.arrAtEntry)}`,
            });
            evs.push({
                type: 'call', nodeId: node.id, scrollY: node.y,
                codeLine: LINE.CALL_SORT,
                annotation: `Calling quick_sort(nums, 0, ${node.high})`,
            });
        }

        // Enter the function
        evs.push({
            type: 'call', nodeId: node.id, scrollY: node.y,
            codeLine: LINE.SORT_DEF,
            annotation: isRoot
                ? `quick_sort(0, ${node.high}) — start sorting nums = ${fmt(node.arrAtEntry)}`
                : `quick_sort(${node.low}, ${node.high}) — subarray: ${fmt(node.arrAtEntry.slice(node.low, node.high + 1))}`,
        });

        // base check
        const baseResult = node.isBase ? 'True → return' : `False → continue (${node.high - node.low + 1} elements)`;
        evs.push({
            type: 'check_base', nodeId: node.id, scrollY: node.y,
            codeLine: LINE.BASE_CHECK,
            annotation: `if ${node.low} >= ${node.high}: ${baseResult}`,
        });

        if (node.isBase) {
            evs.push({
                type: 'base_return', nodeId: node.id, scrollY: node.y,
                codeLine: LINE.BASE_RETURN,
                annotation: `return — nothing to sort`,
            });
            return;
        }

        // pivot
        evs.push({
            type: 'pivot_select', nodeId: node.id, scrollY: node.y,
            codeLine: LINE.PIVOT,
            annotation: `pivot = nums[(${node.low}+${node.high})//2] = nums[${node.pivotIdx}] = ${node.pivot}`,
        });

        // init i, j
        evs.push({
            type: 'init_i', nodeId: node.id, scrollY: node.y,
            codeLine: LINE.INIT_I,
            annotation: `i = low = ${node.low}`,
        });
        evs.push({
            type: 'init_j', nodeId: node.id, scrollY: node.y,
            codeLine: LINE.INIT_J,
            annotation: `j = high = ${node.high}`,
        });

        node.partitionIter.forEach((iter, iterIdx) => {
            const { iStop, jStop, iScanSteps, jScanSteps, didSwap, si, sj, arrBeforeSwap, arrAfterSwap, iAfter, jAfter } = iter;

            // outer while check
            const outerI = iter.iterStart.i, outerJ = iter.iterStart.j;
            evs.push({
                type: 'while_outer', nodeId: node.id, scrollY: node.y,
                codeLine: LINE.WHILE_OUTER,
                annotation: `while ${outerI} <= ${outerJ} → True, continue`,
                i: outerI, j: outerJ, arr: iter.iterStart.arr,
            });

            // i scan steps
            iScanSteps.forEach(step => {
                evs.push({
                    type: 'i_scan', nodeId: node.id, scrollY: node.y,
                    codeLine: LINE.WHILE_I,
                    annotation: `while nums[${step.from}]=${step.arr[step.from]} < pivot=${node.pivot}: True → i += 1`,
                    i: step.from, j: jStop, arr: step.arr,
                });
                evs.push({
                    type: 'i_scan', nodeId: node.id, scrollY: node.y,
                    codeLine: LINE.INC_I,
                    annotation: `i += 1 → i = ${step.to}`,
                    i: step.to, j: jStop, arr: step.arr,
                });
            });
            // i scan done
            evs.push({
                type: 'i_scan_done', nodeId: node.id, scrollY: node.y,
                codeLine: LINE.WHILE_I,
                annotation: `while nums[${iStop}]=${arrBeforeSwap[iStop]} < pivot=${node.pivot}: False → i stays at ${iStop}`,
                i: iStop, j: jStop, arr: arrBeforeSwap,
            });

            // j scan steps
            jScanSteps.forEach(step => {
                evs.push({
                    type: 'j_scan', nodeId: node.id, scrollY: node.y,
                    codeLine: LINE.WHILE_J,
                    annotation: `while nums[${step.from}]=${step.arr[step.from]} > pivot=${node.pivot}: True → j -= 1`,
                    i: iStop, j: step.from, arr: step.arr,
                });
                evs.push({
                    type: 'j_scan', nodeId: node.id, scrollY: node.y,
                    codeLine: LINE.DEC_J,
                    annotation: `j -= 1 → j = ${step.to}`,
                    i: iStop, j: step.to, arr: step.arr,
                });
            });
            // j scan done
            evs.push({
                type: 'j_scan_done', nodeId: node.id, scrollY: node.y,
                codeLine: LINE.WHILE_J,
                annotation: `while nums[${jStop}]=${arrBeforeSwap[jStop]} > pivot=${node.pivot}: False → j stays at ${jStop}`,
                i: iStop, j: jStop, arr: arrBeforeSwap,
            });

            // if i <= j
            evs.push({
                type: 'if_swap', nodeId: node.id, scrollY: node.y,
                codeLine: LINE.IF_SWAP,
                annotation: `if ${iStop} <= ${jStop}: ${didSwap ? 'True → swap' : 'False → no swap'}`,
                i: iStop, j: jStop, arr: arrBeforeSwap,
            });

            if (didSwap) {
                evs.push({
                    type: 'swap_exec', nodeId: node.id, scrollY: node.y,
                    codeLine: LINE.SWAP,
                    annotation: `nums[${si}]=${arrBeforeSwap[si]} ↔ nums[${sj}]=${arrBeforeSwap[sj]} — swapped!`,
                    i: si, j: sj, arr: arrAfterSwap, si, sj,
                });
                evs.push({
                    type: 'post_i', nodeId: node.id, scrollY: node.y,
                    codeLine: LINE.POST_I,
                    annotation: `i += 1 → i = ${si + 1}`,
                    i: si + 1, j: sj, arr: arrAfterSwap,
                });
                evs.push({
                    type: 'post_j', nodeId: node.id, scrollY: node.y,
                    codeLine: LINE.POST_J,
                    annotation: `j -= 1 → j = ${sj - 1}`,
                    i: iAfter, j: jAfter, arr: arrAfterSwap,
                });
            }
        });

        // outer while exits
        evs.push({
            type: 'while_outer_exit', nodeId: node.id, scrollY: node.y,
            codeLine: LINE.WHILE_OUTER,
            annotation: `while ${node.finalI} <= ${node.finalJ}: False → exit loop  →  left [${node.low}..${node.finalJ}] | right [${node.finalI}..${node.high}]`,
            i: node.finalI, j: node.finalJ, arr: node.arrAfterPartition,
        });

        // recurse left
        evs.push({
            type: 'recurse_left', nodeId: node.id, scrollY: Math.max(0, node.y + LEVEL_H - 80),
            codeLine: LINE.RECURSE_LEFT,
            annotation: `sort(${node.low}, ${node.finalJ}) — recurse into left partition`,
        });

        if (node.left) dfs(node.left, false);

        // recurse right
        evs.push({
            type: 'recurse_right', nodeId: node.id, scrollY: Math.max(0, node.y + LEVEL_H - 80),
            codeLine: LINE.RECURSE_RIGHT,
            annotation: `sort(${node.finalI}, ${node.high}) — recurse into right partition`,
        });

        if (node.right) dfs(node.right, false);

        // node sorted
        evs.push({
            type: 'node_sorted', nodeId: node.id, scrollY: Math.max(0, node.y - 40),
            codeLine: node.parentId ? LINE.RECURSE_LEFT : LINE.RETURN_NUMS,
            annotation: `Range [${node.low}..${node.high}] is sorted ✓`,
        });
    };

    dfs(nodeMap.get(rootId), true);
    evs.push({
        type: 'final_done', scrollY: 0,
        codeLine: LINE.RETURN_NUMS,
        annotation: `return nums — quick sort complete! Array is sorted.`,
    });
    return evs;
};

// ── Syntax highlighter ───────────────────────────────────────────────────────
const highlightSyntax = (line) => {
    if (!line) return <span>&nbsp;</span>;
    const leadingSpaces = (line.match(/^(\s*)/) || ['', ''])[1];
    const codeContent   = line.slice(leadingSpaces.length);
    const result = []; let key = 0;
    if (leadingSpaces) result.push(<span key={key++} style={{ whiteSpace: 'pre' }}>{leadingSpaces}</span>);
    let rem = codeContent;
    const keywords = ['def','if','else','elif','for','while','return','and','or','not','in','True','False','None'];
    const builtins = ['len','print','range','sort'];
    while (rem.length > 0) {
        if (rem.startsWith('#')) { result.push(<span key={key++} className="text-slate-500 italic">{rem}</span>); break; }
        const strM = rem.match(/^(["'])(?:(?!\1)[^\\]|\\.)*?\1/);
        if (strM) { result.push(<span key={key++} className="text-green-400">{strM[0]}</span>); rem = rem.slice(strM[0].length); continue; }
        const numM = rem.match(/^\d+/);
        if (numM) { result.push(<span key={key++} className="text-amber-400">{numM[0]}</span>); rem = rem.slice(numM[0].length); continue; }
        const wrdM = rem.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
        if (wrdM) {
            const w = wrdM[0];
            let cls = 'text-slate-300';
            if (keywords.includes(w)) cls = 'text-purple-400 font-semibold';
            else if (builtins.includes(w)) cls = 'text-blue-400';
            result.push(<span key={key++} className={cls}>{w}</span>);
            rem = rem.slice(w.length); continue;
        }
        result.push(<span key={key++} className="text-slate-400">{rem[0]}</span>);
        rem = rem.slice(1);
    }
    return result;
};

// ── Code panel ────────────────────────────────────────────────────────────────
const SyncedCodePanel = ({ code, activeLine, executedLines }) => {
    const lines    = code ? code.split('\n') : [];
    const lineRefs = useRef({});

    useEffect(() => {
        if (activeLine && lineRefs.current[activeLine]) {
            lineRefs.current[activeLine].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeLine]);

    return (
        <div className="w-[380px] flex-shrink-0 h-full bg-slate-900 border-l border-slate-700/60 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto py-2 font-mono text-[13px] leading-[1.7]">
                {lines.map((line, idx) => {
                    const num    = idx + 1;
                    const isCur  = num === activeLine;
                    const wasDone = executedLines.includes(num);
                    return (
                        <div key={idx} ref={el => lineRefs.current[num] = el}
                            className={`flex transition-all duration-200 ${
                                isCur    ? 'bg-blue-500/20 border-l-2 border-blue-400'
                                : wasDone ? 'bg-slate-800/30 border-l-2 border-emerald-500/30'
                                : 'border-l-2 border-transparent'}`}>
                            <span className={`w-10 text-right pr-3 select-none shrink-0 ${
                                isCur    ? 'text-blue-400 font-bold'
                                : wasDone ? 'text-emerald-500/70'
                                : 'text-slate-600'}`}>{num}</span>
                            <span className={`pr-4 select-text cursor-text ${isCur ? 'text-blue-100' : wasDone ? 'text-slate-400' : 'text-slate-500'}`}>
                                {highlightSyntax(line) || <span>&nbsp;</span>}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Node display ──────────────────────────────────────────────────────────────
const NodeVisual = ({ node, phase, currentEvForNode }) => {
    const isBase = node.isBase;

    // Pick which array state and highlights to show
    let arr = node.arrAtEntry.slice(node.low, node.high + 1);
    let pivotRelIdx = null;
    let iRel = null, jRel = null;
    let swapI = null, swapJ = null;
    let zones = null;
    let compareIIdx = null; // cell highlighted when checking nums[i] < pivot
    let compareJIdx = null; // cell highlighted when checking nums[j] > pivot

    if (phase === 'pivot_select') {
        pivotRelIdx = node.pivotIdx - node.low;
    } else if (phase === 'init_i' || phase === 'init_j') {
        if (phase === 'init_i') {
            iRel = 0;
        } else if (phase === 'init_j') {
            iRel = 0;
            jRel = node.high - node.low;
        }
    } else if (['while_outer', 'i_scan', 'i_scan_done', 'j_scan', 'j_scan_done', 'if_swap', 'swap_exec', 'post_i', 'post_j'].includes(phase)) {
        const ev = currentEvForNode;
        if (ev?.arr) {
            arr = ev.arr.slice(node.low, node.high + 1);
            if (ev.i !== undefined) iRel = Math.max(0, Math.min(ev.i - node.low, arr.length - 1));
            if (ev.j !== undefined) jRel = Math.max(0, Math.min(ev.j - node.low, arr.length - 1));
            if (phase === 'swap_exec' && ev.si !== undefined) {
                swapI = ev.si - node.low;
                swapJ = ev.sj - node.low;
            }
        }
        // highlight the cell being compared; pivot highlighted only during scan comparisons
        if ((phase === 'i_scan' || phase === 'i_scan_done') && iRel !== null) {
            compareIIdx = iRel;
            pivotRelIdx = node.pivotIdx - node.low;
        }
        if ((phase === 'j_scan' || phase === 'j_scan_done') && jRel !== null) {
            compareJIdx = jRel;
            pivotRelIdx = node.pivotIdx - node.low;
        }
    } else if (phase === 'while_outer_exit' || phase === 'recurse_left' || phase === 'recurse_right') {
        arr = node.arrAfterPartition.slice(node.low, node.high + 1);
        zones = { leftEnd: node.finalJ - node.low, rightStart: node.finalI - node.low };
    } else if (phase === 'node_sorted') {
        arr = node.arrAfterPartition.slice(node.low, node.high + 1);
        zones = 'sorted';
    }

    const isAllSorted = zones === 'sorted';
    const isBase2 = isBase || (phase === 'base_return' || phase === 'check_base' && node.isBase);
    const showLowHigh  = phase === 'check_base';

    if (isBase) {
        const cell = node.low <= node.high ? node.arrAtEntry[node.low] : null;
        return (
            <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center rounded-xl border-2 bg-emerald-900/40 border-emerald-500/60"
                    style={{ padding: `5px ${NODE_PAD}px` }}>
                    {cell !== null
                        ? <div className="flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 bg-emerald-600 border-emerald-400 text-white"
                            style={{ width: CELL_W, height: CELL_H }}>{cell}</div>
                        : <span className="text-slate-500 text-xs italic px-1">∅</span>}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">sorted ✓</span>
            </div>
        );
    }

    const boxBg = isAllSorted
        ? 'bg-emerald-900/40 border-emerald-500/60 shadow-emerald-900/30 shadow-lg'
        : zones ? 'bg-slate-800/60 border-slate-600/50'
        : 'bg-slate-800/80 border-indigo-500/40';

    const getZone = (idx) => {
        if (!zones || zones === 'sorted') return null;
        if (idx <= zones.leftEnd)   return 'left';
        if (idx < zones.rightStart) return 'pivot';
        return 'right';
    };

    return (
        <div className="flex flex-col items-center gap-0.5">
            {isAllSorted && (
                <motion.span className="text-xs text-emerald-400 font-semibold mb-0.5"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    sorted ✓
                </motion.span>
            )}
            {/* Pointer row */}
            <div className="flex items-end" style={{ gap: CELL_GAP, height: 20 }}>
                {arr.map((_, idx) => {
                    const isI = iRel !== null && idx === iRel;
                    const isJ = jRel !== null && idx === jRel;
                    return (
                        <div key={idx} style={{ width: CELL_W }} className="flex justify-center">
                            {isI && !isJ && <motion.div className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${compareIIdx !== null ? 'bg-sky-500' : 'bg-indigo-600'}`}
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>i</motion.div>}
                            {isJ && !isI && <motion.div className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${compareJIdx !== null ? 'bg-pink-500' : 'bg-pink-600'}`}
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>j</motion.div>}
                            {isI && isJ && <motion.div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>ij</motion.div>}
                        </div>
                    );
                })}
            </div>
            {/* Array box */}
            <div className={`flex flex-col rounded-xl border-2 ${boxBg}`}
                style={{ padding: `10px ${NODE_PAD}px` }}>
                <div className="flex items-center" style={{ gap: CELL_GAP }}>
                    {arr.map((v, idx) => {
                        const zone = getZone(idx);
                        const isPivCell = pivotRelIdx !== null && idx === pivotRelIdx;
                        const isSorted  = zones === 'sorted';
                        const isLeft    = zone === 'left';
                        const isPivZone = zone === 'pivot';
                        const isSwp     = idx === swapI || idx === swapJ;
                        const isCompareI = compareIIdx !== null && idx === compareIIdx;
                        const isCompareJ = compareJIdx !== null && idx === compareJIdx;

                        let bg = 'bg-slate-700 border-slate-500 text-slate-200';
                        if (isSorted)   bg = 'bg-emerald-600 border-emerald-400 text-white';
                        if (isLeft)     bg = 'bg-indigo-800 border-indigo-500 text-white';
                        if (isPivZone)  bg = 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300';
                        if (zone === 'right') bg = 'bg-slate-600 border-slate-400 text-slate-200';
                        if (isPivCell)  bg = 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-300 shadow-md shadow-amber-500/50';
                        if (isCompareI) bg = 'bg-sky-500 border-sky-300 text-white ring-2 ring-sky-300 shadow-md shadow-sky-500/50';
                        if (isCompareJ) bg = 'bg-pink-500 border-pink-300 text-white ring-2 ring-pink-300 shadow-md shadow-pink-500/50';
                        if (isSwp)      bg = 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300';

                        return (
                            <motion.div key={idx}
                                className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 ${bg}`}
                                style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W }}
                                animate={isSwp ? { scale: [1, 1.3, 1] } : {}}
                                transition={isSwp ? { duration: 0.35 } : {}}>
                                {v}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            {/* low / high labels below box during base-check */}
            <AnimatePresence>
            {showLowHigh && (
                <motion.div
                    className="flex items-center w-full"
                    style={{ gap: CELL_GAP, paddingLeft: NODE_PAD, paddingRight: NODE_PAD }}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}>
                    {/* low badge aligned under first cell */}
                    <div style={{ width: CELL_W }} className="flex justify-center">
                        <span className="px-1.5 py-0.5 rounded-md bg-sky-900/60 border border-sky-500/50 text-[10px] font-bold font-mono text-sky-300 whitespace-nowrap">
                            low={node.low}
                        </span>
                    </div>
                    {/* middle: < centered */}
                    <div className="flex-1 flex items-center justify-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-700/60 border border-slate-500/50 text-sm font-bold font-mono text-emerald-300">&lt;</span>
                    </div>
                    {/* high badge aligned under last cell */}
                    <div style={{ width: CELL_W }} className="flex justify-center">
                        <span className="px-1.5 py-0.5 rounded-md bg-violet-900/60 border border-violet-500/50 text-[10px] font-bold font-mono text-violet-300 whitespace-nowrap">
                            high={node.high}
                        </span>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const QuickSortSyncedVisualizer = ({
    customArray = '[8, 3, 1, 5, 2, 7, 4]',
    code = '',
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
    const events   = useMemo(() => buildSyncedEvents(nodeMap, rootId), [nodeMap, rootId]);
    const maxDepth = useMemo(() => Math.max(...allNodes.map(n => n.depth)), [allNodes]);

    const n       = inputArr.length;
    const canvasW = n * ELEM_W + LEFT_PAD * 2;
    const canvasH = (maxDepth + 1) * LEVEL_H + 180;

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
        if (!ev || !scrollRef.current) return;
        const ignore = ['i_scan', 'j_scan', 'i_scan_done', 'j_scan_done', 'if_swap', 'swap_exec', 'post_i', 'post_j'];
        if (ignore.includes(ev.type)) return;
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

    const visibleIds = useMemo(() => {
        const s = new Set();
        processed.forEach(ev => { if (ev.type === 'call') s.add(ev.nodeId); });
        return s;
    }, [processed]);

    // Phase per node (based on latest event for that node)
    const nodePhases = useMemo(() => {
        const m = new Map(); // nodeId -> { phase, ev }
        const PHASE_ORDER = {
            call: 0, check_base: 1, base_return: 2,
            pivot_select: 3, init_i: 4, init_j: 5,
            while_outer: 6, i_scan: 7, i_scan_done: 8,
            j_scan: 9, j_scan_done: 10, if_swap: 11,
            swap_exec: 12, post_i: 13, post_j: 14,
            while_outer_exit: 15, recurse_left: 16, recurse_right: 17,
            node_sorted: 18,
        };
        processed.forEach(ev => {
            if (!ev.nodeId) return;
            const cur = m.get(ev.nodeId);
            const curPriority   = cur  ? (PHASE_ORDER[cur.phase] ?? -1) : -1;
            const thisPriority  = PHASE_ORDER[ev.type] ?? -1;
            if (thisPriority >= curPriority) m.set(ev.nodeId, { phase: ev.type, ev });
        });
        return m;
    }, [processed]);

    // SVG lines
    const svgLines = useMemo(() => {
        const lines = [];
        allNodes.forEach(node => {
            if (!visibleIds.has(node.id) || node.isBase) return;
            const phaseInfo = nodePhases.get(node.id);
            const sorted = phaseInfo?.phase === 'node_sorted';
            [node.left, node.right].forEach(child => {
                if (!child || !visibleIds.has(child.id)) return;
                lines.push({
                    key: `${node.id}->${child.id}`,
                    x1: node.x, y1: node.y + CELL_H + 14,
                    x2: child.x, y2: child.y - 4,
                    sorted,
                });
            });
        });
        return lines;
    }, [allNodes, visibleIds, nodePhases]);

    const currentEv   = events[eventIdx];
    const activeLine  = currentEv?.codeLine ?? null;
    const executedLines = useMemo(() => {
        const s = new Set();
        processed.forEach(e => { if (e.codeLine) s.add(e.codeLine); });
        return [...s];
    }, [processed]);

    const statusLabel = (() => {
        if (!currentEv) return 'Press ▶ Start to begin';
        if (finished)   return '✅ Sorted! Replay to watch again.';
        const map = {
            call:             '📋 Entering sort()',
            check_base:       '🔎 Checking base case',
            base_return:      '↩️ Base case — returning',
            pivot_select:     '🎯 Selecting pivot',
            init_i:           '👆 Setting left pointer i',
            init_j:           '👇 Setting right pointer j',
            while_outer:      '🔁 Checking while i ≤ j',
            i_scan:           '→ Scanning i rightward',
            i_scan_done:      '→ i scan complete',
            j_scan:           '← Scanning j leftward',
            j_scan_done:      '← j scan complete',
            if_swap:          '🔀 Checking if i ≤ j',
            swap_exec:        '↔️ Swapping elements',
            post_i:           '→ i += 1',
            post_j:           '← j -= 1',
            while_outer_exit: '🏁 Partition complete',
            recurse_left:     '🔁 Recursing left',
            recurse_right:    '🔁 Recursing right',
            node_sorted:      '✅ Range sorted',
            final_done:       '🎉 Quick Sort complete',
        };
        return map[currentEv.type] ?? '';
    })();

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Tree canvas */}
                <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
                    {/* Status + controls */}
                    <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/80">
                        <span className="text-sm text-slate-200 font-medium truncate max-w-xs">{statusLabel}</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                                {[0.5, 1, 1.5, 2, 3].map(s => (
                                    <button key={s} onClick={() => setSpeed(s)}
                                        className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${speed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                                        {s}×
                                    </button>
                                ))}
                            </div>
                            <div className="w-px h-5 bg-slate-700" />
                            <button onClick={() => { setPlaying(false); setFinished(false); setEventIdx(-1); }}
                                disabled={eventIdx < 0}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <div className="w-px h-5 bg-slate-700" />
                            <button onClick={() => { setPlaying(false); setFinished(false); setEventIdx(i => Math.max(-1, i - 1)); }}
                                disabled={eventIdx < 0}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 disabled:opacity-25 transition-all text-slate-300">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                                </svg>
                            </button>

                            {!playing && !finished && eventIdx < 0 && (
                                <button onClick={handlePlay} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/40">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 translate-x-px">
                                        <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd" />
                                    </svg> Start
                                </button>
                            )}
                            {playing && (
                                <button onClick={() => setPlaying(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded-xl transition-all">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" clipRule="evenodd" />
                                    </svg> Pause
                                </button>
                            )}
                            {!playing && eventIdx >= 0 && !finished && (
                                <button onClick={handlePlay} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 translate-x-px">
                                        <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd" />
                                    </svg> Resume
                                </button>
                            )}
                            {finished && (
                                <button onClick={handlePlay} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                    </svg> Replay
                                </button>
                            )}

                            <button onClick={() => { setPlaying(false); const ni = eventIdx + 1; if (ni >= events.length) setFinished(true); else setEventIdx(ni); }}
                                disabled={finished}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 disabled:opacity-25 transition-all text-slate-300">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable tree */}
                    <div ref={scrollRef} className="flex-1 overflow-auto">
                        <div className="relative mx-auto" style={{ width: canvasW, height: canvasH + 80, minHeight: '100%' }}>
                            {/* SVG lines */}
                            <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH + 80} overflow="visible">
                                <defs>
                                    <marker id="qss-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                        <path d="M0,0 L0,8 L8,4 Z" fill="#6366f1" />
                                    </marker>
                                    <marker id="qss-sort" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                        <path d="M0,0 L0,8 L8,4 Z" fill="#10b981" />
                                    </marker>
                                </defs>
                                <AnimatePresence>
                                    {svgLines.map(l => (
                                        <motion.line key={l.key}
                                            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                                            stroke={l.sorted ? '#10b981' : '#6366f1'} strokeWidth={2}
                                            markerEnd={l.sorted ? 'url(#qss-sort)' : 'url(#qss-down)'}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.45, ease: 'easeOut' }} />
                                    ))}
                                </AnimatePresence>
                            </svg>

                            {/* Nodes */}
                            <AnimatePresence>
                                {allNodes.map(node => {
                                    if (!visibleIds.has(node.id)) return null;
                                    const phInfo  = nodePhases.get(node.id);
                                    const phase   = phInfo?.phase ?? 'call';
                                    const curEvForNode = phInfo?.ev;
                                    const span    = node.high - node.low + 1;
                                    const boxW    = Math.max(span * (CELL_W + CELL_GAP) + NODE_PAD * 2, 70);

                                    return (
                                        <motion.div key={node.id}
                                            className="absolute flex flex-col items-center"
                                            style={{ left: node.x - boxW / 2, top: node.y }}
                                            initial={{ opacity: 0, scale: 0.6, y: -12 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.4, y: 20 }}
                                            transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
                                            <div className="text-[10px] text-slate-500 font-mono mb-0.5">
                                                sort({node.low}, {node.high})
                                            </div>
                                            <NodeVisual node={node} phase={phase} currentEvForNode={curEvForNode} />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Annotation badge */}
                            <AnimatePresence mode="wait">
                                {currentEv?.annotation && (() => {
                                    const activeNode = allNodes.find(n => n.id === currentEv.nodeId && visibleIds.has(n.id));
                                    if (!activeNode) return null;
                                    const span = activeNode.high - activeNode.low + 1;
                                    const boxW = Math.max(span * (CELL_W + CELL_GAP) + NODE_PAD * 2, 70);
                                    const parentNode = allNodes.find(p => !p.isBase && (p.left?.id === activeNode.id || p.right?.id === activeNode.id));
                                    const isRight = !parentNode || parentNode.right?.id === activeNode.id;
                                    return (
                                        <motion.div key={currentEv.annotation}
                                            style={{
                                                position: 'absolute',
                                                left: isRight ? activeNode.x + boxW / 2 + 12 : activeNode.x - boxW / 2 - 12,
                                                top: activeNode.y + 2, zIndex: 30, maxWidth: 250,
                                                transform: isRight ? 'none' : 'translateX(-100%)',
                                            }}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}>
                                            <div className="rounded-xl border border-amber-600/50 px-3 py-2 text-xs font-medium leading-snug shadow-xl backdrop-blur bg-amber-900/60 text-amber-200">
                                                {currentEv.annotation}
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Code panel */}
                <SyncedCodePanel
                    code={code}
                    activeLine={activeLine}
                    executedLines={executedLines}
                />
            </div>
        </div>
    );
};

export default QuickSortSyncedVisualizer;
