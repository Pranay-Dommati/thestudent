/**
 * SyncedCoreLogicVisualizer
 *
 * "New Code Exec Vis" tab — the tree animation and the code panel
 * are perfectly in sync: each animation event lights up the exact
 * code line that triggered it, and a contextual annotation card
 * explains what is happening in plain English.
 *
 * Completely independent of CoreLogicVisualizer and
 * MergeSortVisualizer. Changing this file has zero effect on the
 * other two tabs.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Layout constants (same as CoreLogicVisualizer) ─────────────────────────
const CELL_W        = 38;
const CELL_H        = 38;
const CELL_GAP      = 4;
const LEAF_W        = 110;
const LEVEL_H       = 160;
const NODE_EXTRA_PAD = 16;

// ─── Tree helpers (pure, recreated here to stay independent) ─────────────────
const mergeSorted = (a, b) => {
    const res = []; let i = 0, j = 0;
    while (i < a.length && j < b.length) res.push(a[i] <= b[j] ? a[i++] : b[j++]);
    return [...res, ...a.slice(i), ...b.slice(j)];
};

const buildTree = (arr, id = 'root', depth = 0) => {
    if (arr.length <= 1)
        return { id, arr, depth, left: null, right: null, merged: [...arr], isLeaf: true, mid: null };
    const mid   = Math.floor(arr.length / 2);
    const left  = buildTree(arr.slice(0, mid), id + 'L', depth + 1);
    const right = buildTree(arr.slice(mid),    id + 'R', depth + 1);
    return { id, arr, depth, left, right, merged: mergeSorted(left.merged, right.merged), isLeaf: false, mid };
};

const countLeaves  = (n) => n.isLeaf ? 1 : countLeaves(n.left) + countLeaves(n.right);
const nodeBoxW     = (arr) => arr.length * CELL_W + (arr.length - 1) * CELL_GAP + NODE_EXTRA_PAD * 2;
const flattenTree  = (n, acc = []) => { acc.push(n); if (!n.isLeaf) { flattenTree(n.left, acc); flattenTree(n.right, acc); } return acc; };

const assignLayout = (node, offsetX = 0) => {
    node.blockW = countLeaves(node) * LEAF_W;
    node.y      = node.depth * LEVEL_H;
    if (node.isLeaf) {
        node.x = offsetX + LEAF_W / 2;
    } else {
        assignLayout(node.left,  offsetX);
        assignLayout(node.right, offsetX + countLeaves(node.left) * LEAF_W);
        node.x = (node.left.x + node.right.x) / 2;
    }
};

// ─── Code-line reference ─────────────────────────────────────────────────────
// These line numbers must match the `code` prop passed from the parent.
// The parent passes the same Python merge sort code used everywhere.
const LINE = {
    ARR_INIT:      39,
    CALL_SORT:     40,
    BASE_CHECK:     3,
    BASE_RETURN:    4,
    MID:            7,
    SPLIT_LEFT:     8,
    SPLIT_RIGHT:    9,
    RECURSE_LEFT:  12,
    RECURSE_RIGHT: 13,
    RETURN_MERGE:  16,
    MERGE_INIT_R:  20,
    MERGE_INIT_IJ: 21,
    MERGE_WHILE:   24,
    MERGE_IF:      25,
    APPEND_LEFT:   26,
    INC_I:         27,
    APPEND_RIGHT:  29,
    INC_J:         30,
    EXTEND_LEFT:   33,
    EXTEND_RIGHT:  34,
    RETURN_RESULT: 35,
};

// ─── Event timing — base = 1× comfortable reading pace per code step ─────────
// At 0.5× every delay doubles (very slow / study mode)
// At 1×  each code-highlighted line stays ~1.5-2 s (normal)
// At 2×  fast; at 3× quick review
const DELAY = {
    arr_init:      2000,
    call_sort:     2000,
    check_base:    1600,
    base_return:   1600,
    highlight_mid: 1800,
    split:         1800,
    split_right:   1600,
    recurse_left:  1600,
    recurse_right: 1600,
    call_merge:    1800,
    merge_result:  1800,
    'md:intro':     1800,
    'md:compare':   2000,
    'md:add_left':  1600,
    'md:add_right': 1600,
    'md:remaining': 2000,
    'md:done':      1200,
};

const getDelay = (ev, speed) => {
    const key = ev.type === 'merge_detail' ? `md:${ev.phase}` : ev.type;
    return (DELAY[key] ?? 800) / speed;
};

// ─── Generate per-step merge detail events ───────────────────────────────────
const generateMergeSteps = (nodeId, left, right, scrollY) => {
    const steps = [];
    let i = 0, j = 0, result = [];

    const mkLine = (phase) => {
        const map = {
            intro:     [LINE.MERGE_INIT_R, LINE.MERGE_INIT_IJ],
            compare:   [LINE.MERGE_WHILE, LINE.MERGE_IF],
            add_left:  [LINE.APPEND_LEFT, LINE.INC_I],
            add_right: [LINE.APPEND_RIGHT, LINE.INC_J],
            remaining: [LINE.EXTEND_LEFT, LINE.EXTEND_RIGHT],
            done:      [LINE.RETURN_RESULT],
        };
        return map[phase]?.[0] ?? LINE.MERGE_WHILE;
    };

    const mkAnnotation = (phase, _i, _j, addedVal, remaining) => ({
        intro:     `Entering merge() — initialise result = [], i = 0, j = 0`,
        compare:   `Compare  left[${_i}] = ${left[_i] ?? '—'}  vs  right[${_j}] = ${right[_j] ?? '—'}`,
        add_left:  `${addedVal} ≤ right[${_j}] → append ${addedVal} from left, i → ${_i + 1}`,
        add_right: `${addedVal} < left[${_i}] → append ${addedVal} from right, j → ${_j + 1}`,
        remaining: `One pointer exhausted — copy remaining ${remaining?.length ?? 0} element(s) directly`,
        done:      `return result  →  [${[...result].join(', ')}]`,
    }[phase] ?? '');

    steps.push({ type: 'merge_detail', phase: 'intro', nodeId, left, right, i: 0, j: 0, result: [], scrollY,
        codeLine: mkLine('intro'), annotation: mkAnnotation('intro', 0, 0) });

    while (i < left.length && j < right.length) {
        steps.push({ type: 'merge_detail', phase: 'compare', nodeId, left, right, i, j, result: [...result], scrollY,
            codeLine: mkLine('compare'), annotation: mkAnnotation('compare', i, j) });
        if (left[i] <= right[j]) {
            result = [...result, left[i]];
            steps.push({ type: 'merge_detail', phase: 'add_left', nodeId, left, right, i, j, result: [...result], addedVal: left[i], scrollY,
                codeLine: mkLine('add_left'), annotation: mkAnnotation('add_left', i, j, left[i]) });
            i++;
        } else {
            result = [...result, right[j]];
            steps.push({ type: 'merge_detail', phase: 'add_right', nodeId, left, right, i, j, result: [...result], addedVal: right[j], scrollY,
                codeLine: mkLine('add_right'), annotation: mkAnnotation('add_right', i, j, right[j]) });
            j++;
        }
    }

    const remaining = [...left.slice(i), ...right.slice(j)];
    if (remaining.length > 0) {
        result = [...result, ...remaining];
        steps.push({ type: 'merge_detail', phase: 'remaining', nodeId, left, right, i, j, result: [...result], remaining, scrollY,
            codeLine: mkLine('remaining'), annotation: mkAnnotation('remaining', i, j, null, remaining) });
    }
    result = [...result]; // final form
    steps.push({ type: 'merge_detail', phase: 'done', nodeId, left, right, i: left.length, j: right.length, result: [...result], scrollY,
        codeLine: mkLine('done'), annotation: mkAnnotation('done') });
    return steps;
};

// ─── Build the full synced event list ────────────────────────────────────────
const buildSyncedEvents = (node) => {
    const evs = [];

    const fmt = (arr) => `[${arr.join(', ')}]`;

    // skipAppear: child node was already revealed at split time, don't duplicate
    const dfs = (n, isRoot, parentSide, skipAppear = false) => {
        if (!skipAppear) {
            const appearLine = isRoot ? LINE.ARR_INIT
                : parentSide === 'left' ? LINE.RECURSE_LEFT : LINE.RECURSE_RIGHT;
            const appearNote = isRoot
                ? `arr = ${fmt(n.arr)}  — the unsorted input array`
                : `merge_sort(${fmt(n.arr)})  called recursively`;
            evs.push({ type: 'appear', nodeId: n.id, scrollY: n.y, codeLine: appearLine, annotation: appearNote });
        }

        if (n.isLeaf) {
            evs.push({ type: 'check_base', nodeId: n.id, scrollY: n.y, codeLine: LINE.BASE_CHECK,
                annotation: `len(${fmt(n.arr)}) = 1 ≤ 1  →  base case reached` });
            evs.push({ type: 'base_return', nodeId: n.id, scrollY: n.y, codeLine: LINE.BASE_RETURN,
                annotation: `return ${fmt(n.arr)}  (single element is already sorted)` });
            return;
        }

        // Root gets an extra "calling merge_sort" step
        if (isRoot) {
            evs.push({ type: 'call_sort', nodeId: n.id, scrollY: n.y, codeLine: LINE.CALL_SORT,
                annotation: `Calling merge_sort(arr) — recursion begins` });
        }

        evs.push({ type: 'check_base', nodeId: n.id, scrollY: n.y, codeLine: LINE.BASE_CHECK,
            annotation: `len(${fmt(n.arr)}) = ${n.arr.length} > 1  →  continue dividing` });

        evs.push({ type: 'highlight_mid', nodeId: n.id, scrollY: n.y, codeLine: LINE.MID,
            annotation: `mid = ${n.arr.length} // 2 = ${n.mid}  →  split point` });

        // split event draws the connector lines AND reveals the left child node immediately
        evs.push({ type: 'split', nodeId: n.id,
            scrollY: Math.max(0, n.y + LEVEL_H - 80),
            codeLine: LINE.SPLIT_LEFT,
            annotation: `left = arr[:${n.mid}] = ${fmt(n.arr.slice(0, n.mid))}` });
        // Left child appears right here (same code line, same moment)
        evs.push({ type: 'appear', nodeId: n.left.id, scrollY: n.left.y,
            codeLine: LINE.SPLIT_LEFT,
            annotation: `left = arr[:${n.mid}] = ${fmt(n.arr.slice(0, n.mid))}` });

        // split_right reveals the right child node immediately
        evs.push({ type: 'split_right', nodeId: n.id, scrollY: Math.max(0, n.y + LEVEL_H - 80),
            codeLine: LINE.SPLIT_RIGHT,
            annotation: `right = arr[${n.mid}:] = ${fmt(n.arr.slice(n.mid))}` });
        // Right child appears right here (same code line, same moment)
        evs.push({ type: 'appear', nodeId: n.right.id, scrollY: n.right.y,
            codeLine: LINE.SPLIT_RIGHT,
            annotation: `right = arr[${n.mid}:] = ${fmt(n.arr.slice(n.mid))}` });

        evs.push({ type: 'recurse_left', nodeId: n.id, scrollY: n.left.y, codeLine: LINE.RECURSE_LEFT,
            annotation: `left_sorted = merge_sort(${fmt(n.left.arr)})  — diving into left half` });
        // skipAppear=true: child already shown at split time
        dfs(n.left, false, 'left', true);

        evs.push({ type: 'recurse_right', nodeId: n.id, scrollY: n.right.y, codeLine: LINE.RECURSE_RIGHT,
            annotation: `right_sorted = merge_sort(${fmt(n.right.arr)})  — diving into right half` });
        // skipAppear=true: child already shown at split_right time
        dfs(n.right, false, 'right', true);

        const panelScrollY = Math.max(0, n.y + LEVEL_H * 0.5);
        evs.push({ type: 'call_merge', nodeId: n.id, scrollY: panelScrollY, codeLine: LINE.RETURN_MERGE,
            annotation: `return merge(${fmt(n.left.merged)}, ${fmt(n.right.merged)})` });

        generateMergeSteps(n.id, n.left.merged, n.right.merged, panelScrollY)
            .forEach(ev => evs.push(ev));

        evs.push({ type: 'merge_result', nodeId: n.id, scrollY: Math.max(0, n.y - 60),
            codeLine: LINE.RETURN_RESULT,
            annotation: `Merged & sorted: ${fmt(n.merged)}` });
    };

    dfs(node, true, null);
    return evs;
};

// ─── Small shared UI ─────────────────────────────────────────────────────────
const ArrayCell = ({ val, highlight, sorted, pointer, dim, small }) => {
    const size = small ? 28 : CELL_H;
    const font = small ? 'text-xs' : 'text-sm';
    let bg = 'bg-slate-700 border-slate-500 text-slate-200';
    if (highlight) bg = 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-300';
    if (sorted)    bg = 'bg-emerald-500 border-emerald-300 text-white';
    if (dim)       bg = 'bg-slate-800 border-slate-700 text-slate-500';
    return (
        <div className="flex flex-col items-center gap-0.5">
            {pointer && (
                <motion.div className="text-indigo-400 font-bold text-base leading-none"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}>▼</motion.div>
            )}
            <div className={`flex items-center justify-center rounded-lg border-2 font-bold ${font} ${bg}`}
                style={{ width: size, height: size, minWidth: size, flexShrink: 0 }}>
                {val}
            </div>
        </div>
    );
};

const ResultCell = ({ val }) => (
    <motion.div
        className="flex items-center justify-center rounded-lg border-2 font-bold text-sm bg-emerald-700 border-emerald-400 text-white"
        style={{ width: CELL_H, height: CELL_H, minWidth: CELL_H, flexShrink: 0 }}
        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
        {val}
    </motion.div>
);

// ─── Merge Detail Panel ───────────────────────────────────────────────────────
const MergeDetailPanel = ({ ev, mergeCount }) => {
    if (!ev) return null;
    const { phase, left, right, i, j, result, remaining, addedVal } = ev;

    const showPointer = phase !== 'remaining' && phase !== 'done';

    const sym = (() => {
        if (phase === 'compare' && i < left.length && j < right.length) {
            if (left[i] < right[j])  return { s: '<', c: 'text-amber-400' };
            if (left[i] > right[j])  return { s: '>', c: 'text-amber-400' };
            return { s: '=', c: 'text-sky-400' };
        }
        if (phase === 'add_left')  return { s: '<', c: 'text-emerald-400' };
        if (phase === 'add_right') return { s: '>', c: 'text-emerald-400' };
        return { s: 'vs', c: 'text-slate-500' };
    })();

    return (
        <motion.div
            className="flex-shrink-0 border-t-2 border-indigo-900/60 bg-slate-900 px-8 py-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" style={{ animation: 'pulse 1.5s infinite' }} />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Merge {mergeCount}</span>
                </div>
                <div className="h-px flex-1 bg-slate-700/60" />
                <span className="text-sm font-semibold text-slate-300">{ev.annotation}</span>
            </div>
            <div className="flex items-center justify-center gap-4">
                {/* Left */}
                <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700/80 rounded-2xl px-5 py-3 gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Left</span>
                    <div className="flex gap-2 items-end" style={{ minHeight: CELL_H + 24 }}>
                        {left.map((v, idx) => (
                            <ArrayCell key={idx} val={v}
                                highlight={phase === 'compare' && idx === i}
                                pointer={showPointer && idx === i && i < left.length}
                                dim={idx < i} sorted={false} />
                        ))}
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400">i = {Math.min(i, left.length)}</span>
                </div>
                {/* Operator */}
                <div className="flex flex-col items-center gap-1 self-center pt-2">
                    <div className="w-px h-4 bg-slate-700" />
                    <motion.span key={sym.s} className={`text-lg font-black ${sym.c}`}
                        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 20 }}>
                        {sym.s}
                    </motion.span>
                    <div className="w-px h-4 bg-slate-700" />
                </div>
                {/* Right */}
                <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700/80 rounded-2xl px-5 py-3 gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Right</span>
                    <div className="flex gap-2 items-end" style={{ minHeight: CELL_H + 24 }}>
                        {right.map((v, idx) => (
                            <ArrayCell key={idx} val={v}
                                highlight={phase === 'compare' && idx === j}
                                pointer={showPointer && idx === j && j < right.length}
                                dim={idx < j} sorted={false} />
                        ))}
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400">j = {Math.min(j, right.length)}</span>
                </div>
                {/* Arrow */}
                <div className="self-center pt-2">
                    <svg width="36" height="14" viewBox="0 0 36 14" fill="none">
                        <line x1="0" y1="7" x2="26" y2="7" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
                        <polygon points="26,2 36,7 26,12" fill="#4b5563" />
                    </svg>
                </div>
                {/* Result */}
                <div className="flex flex-col items-center bg-emerald-900/20 border border-emerald-800/40 rounded-2xl px-5 py-3 gap-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Result</span>
                    <div className="flex gap-2 items-center" style={{ minHeight: CELL_H + 24 }}>
                        <AnimatePresence mode="popLayout">
                            {result.map((v, idx) => <ResultCell key={`${idx}-${v}`} val={v} />)}
                            {result.length === 0 && (
                                <span key="empty" className="text-xs text-slate-600 italic self-center px-1">empty</span>
                            )}
                        </AnimatePresence>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600">{result.length} / {left.length + right.length}</span>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Syntax highlighter (self-contained, same logic as DSAImmersiveVisualizer) ──
const highlightSyntax = (line) => {
    if (!line) return <span>&nbsp;</span>;
    const leadingSpaces = line.match(/^(\s*)/)[1];
    const codeContent   = line.slice(leadingSpaces.length);
    const result = []; let key = 0;
    if (leadingSpaces) result.push(<span key={key++} style={{ whiteSpace: 'pre' }}>{leadingSpaces}</span>);
    let rem = codeContent;
    const keywords = ['def','if','else','elif','for','while','return','and','or','not','in','True','False','None'];
    const builtins = ['len','print','range','append','extend'];
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

// ─── Inline Code Panel ────────────────────────────────────────────────────────
const SyncedCodePanel = ({ code, activeLine, executedLines }) => {
    const lines     = code ? code.split('\n') : [];
    const lineRefs  = useRef({});

    useEffect(() => {
        if (activeLine && lineRefs.current[activeLine]) {
            lineRefs.current[activeLine].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeLine]);

    return (
        <div className="w-[380px] flex-shrink-0 h-full bg-slate-900 border-l border-slate-700/60 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-slate-800 flex-shrink-0">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-slate-400 font-mono ml-2">merge_sort.py</span>
            </div>
            {/* Lines */}
            <div className="flex-1 overflow-y-auto py-2 font-mono text-[13px] leading-[1.7]">
                {lines.map((line, idx) => {
                    const num   = idx + 1;
                    const isCur = num === activeLine;
                    const wasDone = executedLines.includes(num);
                    return (
                        <div key={idx} ref={el => lineRefs.current[num] = el}
                            className={`flex transition-all duration-200 ${
                                isCur   ? 'bg-blue-500/20 border-l-2 border-blue-400'
                                : wasDone ? 'bg-slate-800/30 border-l-2 border-emerald-500/30'
                                : 'border-l-2 border-transparent'}`}>
                            <span className={`w-10 text-right pr-3 select-none shrink-0 ${
                                isCur   ? 'text-blue-400 font-bold'
                                : wasDone ? 'text-emerald-500/70'
                                : 'text-slate-600'}`}>{num}</span>
                            <span className={`pr-4 ${isCur ? 'text-blue-100' : wasDone ? 'text-slate-400' : 'text-slate-500'}`}>
                                {highlightSyntax(line) || <span>&nbsp;</span>}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Annotation badge (shown in top-right of canvas) ─────────────────────────
const AnnotationBadge = ({ text, type }) => {
    const colors = {
        appear:        'border-slate-600 text-slate-300 bg-slate-800/90',
        call_sort:     'border-indigo-600/60 text-indigo-200 bg-indigo-900/80',
        check_base:    'border-amber-600/50 text-amber-200 bg-amber-900/60',
        base_return:   'border-emerald-600/50 text-emerald-200 bg-emerald-900/60',
        highlight_mid: 'border-amber-500/60 text-amber-100 bg-amber-900/70',
        split:         'border-indigo-500/60 text-indigo-100 bg-indigo-900/70',
        split_right:   'border-indigo-500/60 text-indigo-100 bg-indigo-900/70',
        recurse_left:  'border-purple-500/60 text-purple-100 bg-purple-900/70',
        recurse_right: 'border-purple-500/60 text-purple-100 bg-purple-900/70',
        call_merge:    'border-teal-500/60 text-teal-100 bg-teal-900/70',
        merge_result:  'border-emerald-500/60 text-emerald-100 bg-emerald-900/70',
        merge_detail:  'border-sky-500/60 text-sky-100 bg-sky-900/70',
    };
    const cls = colors[type] ?? 'border-slate-600 text-slate-300 bg-slate-800/90';

    return (
        <motion.div
            key={text}
            className={`max-w-sm rounded-xl border px-4 py-2.5 text-sm font-medium leading-snug shadow-xl backdrop-blur ${cls}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
            {text}
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SyncedCoreLogicVisualizer = ({ customArray = '[38, 27, 43, 3, 9, 82, 10]', code = '' }) => {

    const inputArr = useMemo(() => {
        try {
            const p = JSON.parse(customArray.trim());
            if (Array.isArray(p)) return p.map(Number);
        } catch {}
        return [38, 27, 43, 3, 9, 82, 10];
    }, [customArray]);

    const tree = useMemo(() => {
        const t = buildTree(inputArr);
        assignLayout(t, 0);
        return t;
    }, [inputArr]);

    const allNodes    = useMemo(() => flattenTree(tree),  [tree]);
    const events      = useMemo(() => buildSyncedEvents(tree), [tree]);
    const totalLeaves = useMemo(() => countLeaves(tree),  [tree]);
    const maxDepth    = useMemo(() => Math.max(...allNodes.map(n => n.depth)), [allNodes]);

    const canvasW = totalLeaves * LEAF_W + 80;
    const canvasH = (maxDepth + 1) * LEVEL_H + 200;

    // ── Animation state ──────────────────────────────────────────────────────
    const [eventIdx,  setEventIdx]  = useState(-1);
    const [playing,   setPlaying]   = useState(false);
    const [finished,  setFinished]  = useState(false);
    const [speed,     setSpeed]     = useState(1);

    const scrollRef = useRef(null);

    // Reset when array changes
    useEffect(() => {
        setEventIdx(-1); setPlaying(false); setFinished(false);
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, [inputArr]);

    // ── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!playing || finished) return;
        const nextIdx = eventIdx + 1;
        if (nextIdx >= events.length) { setFinished(true); setPlaying(false); return; }
        const t = setTimeout(() => setEventIdx(nextIdx), getDelay(events[nextIdx], speed));
        return () => clearTimeout(t);
    }, [playing, eventIdx, events, finished, speed]);

    // ── Auto-scroll (skip during merge detail — panel is sticky) ─────────────
    useEffect(() => {
        const ev = events[eventIdx];
        if (!ev || !scrollRef.current || ev.type === 'merge_detail') return;
        const c = scrollRef.current;
        c.scrollTo({ top: Math.max(0, ev.scrollY - c.clientHeight / 2 + 100), behavior: 'smooth' });
    }, [eventIdx, events]);

    const handlePlay = () => {
        if (finished) {
            setEventIdx(-1); setFinished(false);
            setTimeout(() => setPlaying(true), 80);
        } else { setPlaying(true); }
    };

    // ── Derived sets ─────────────────────────────────────────────────────────
    const processed     = useMemo(() => events.slice(0, eventIdx + 1), [events, eventIdx]);
    const visibleIds    = useMemo(() => new Set(processed.filter(e => e.type === 'appear').map(e => e.nodeId)),        [processed]);
    const highlightMids = useMemo(() => new Set(processed.filter(e => e.type === 'highlight_mid').map(e => e.nodeId)), [processed]);
    const splitIds      = useMemo(() => new Set(processed.filter(e => e.type === 'split').map(e => e.nodeId)),          [processed]);
    const mergedIds     = useMemo(() => new Set(processed.filter(e => e.type === 'merge_result').map(e => e.nodeId)),   [processed]);

    // ── Current event derived values ─────────────────────────────────────────
    const currentEv     = events[eventIdx];
    const isDetailEvent = currentEv?.type === 'merge_detail' && currentEv?.phase !== 'done';
    const activeLine    = currentEv?.codeLine ?? null;

    const detailMergeCount = useMemo(() => {
        let count = 0, lastId = null;
        for (let k = 0; k <= eventIdx; k++) {
            const e = events[k];
            if (e?.type === 'merge_detail' && e?.phase === 'intro' && e.nodeId !== lastId) {
                count++; lastId = e.nodeId;
            }
        }
        return count;
    }, [events, eventIdx]);

    const executedLines = useMemo(() => {
        const seen = new Set();
        processed.forEach(e => { if (e.codeLine) seen.add(e.codeLine); });
        return [...seen];
    }, [processed]);

    // ── SVG connector lines ───────────────────────────────────────────────────
    const svgLines = useMemo(() => {
        const lines = [];
        allNodes.forEach(node => {
            if (node.isLeaf || !splitIds.has(node.id)) return;
            const merging = mergedIds.has(node.id);
            lines.push({ key: node.id + '-L', x1: node.x, y1: node.y + CELL_H + 8, x2: node.left.x,  y2: node.left.y  - 4, merging });
            lines.push({ key: node.id + '-R', x1: node.x, y1: node.y + CELL_H + 8, x2: node.right.x, y2: node.right.y - 4, merging });
        });
        return lines;
    }, [allNodes, splitIds, mergedIds]);

    // ── Status bar label ──────────────────────────────────────────────────────
    const statusLabel = (() => {
        if (!currentEv)             return 'Press ▶ Start to begin';
        if (finished)               return '✅ Sorted! Replay to watch again.';
        const map = {
            appear:        '📋 Viewing array',
            call_sort:     '📞 Calling merge_sort()',
            check_base:    '🔎 Checking base case',
            base_return:   '↩️ Base case — returning',
            highlight_mid: '🎯 Computing mid index',
            split:         '✂️ Splitting left half',
            split_right:   '✂️ Splitting right half',
            recurse_left:  '🔁 Recursing into left',
            recurse_right: '🔁 Recursing into right',
            call_merge:    '🔀 Calling merge()',
            merge_detail:  '🔍 Stepping through merge()',
            merge_result:  '✅ Merge complete',
        };
        return map[currentEv.type] ?? '';
    })();

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden">

            {/* ── Top control bar ─────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900">
                <span className="text-sm text-slate-300 font-medium">{statusLabel}</span>
                <div className="flex items-center gap-3">
                    {/* Speed — labelled as code-step pace */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 whitespace-nowrap">Code speed:</span>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                            {[0.5, 1, 1.5, 2, 3].map(s => (
                                <button key={s} onClick={() => setSpeed(s)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                        speed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                                    {s}×
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Play / Pause / Resume / Replay */}
                    {!playing && !finished && eventIdx < 0 && (
                        <button onClick={handlePlay}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all">
                            ▶ Start
                        </button>
                    )}
                    {playing && (
                        <button onClick={() => setPlaying(false)}
                            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-all">
                            ⏸ Pause
                        </button>
                    )}
                    {!playing && eventIdx >= 0 && !finished && (
                        <button onClick={handlePlay}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
                            ▶ Resume
                        </button>
                    )}
                    {finished && (
                        <button onClick={handlePlay}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all">
                            ↺ Replay
                        </button>
                    )}
                    <span className="text-xs text-slate-500 font-mono">{Math.max(0, eventIdx + 1)}/{events.length}</span>
                </div>
            </div>

            {/* ── Body: tree canvas + code panel ─────────────────────────── */}
            <div className="flex-1 flex overflow-hidden min-h-0">

                {/* Tree canvas */}
                <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">

                    {/* Scrollable tree area */}
                    <div ref={scrollRef} className="flex-1 overflow-auto">
                        <div className="relative mx-auto" style={{ width: canvasW, height: canvasH + 80, minHeight: '100%' }}>

                            {/* Annotation badge — sticky top-right of canvas */}
                            <div className="sticky top-4 z-20 flex justify-end pr-4 pointer-events-none">
                                <AnimatePresence mode="wait">
                                    {currentEv?.annotation && !isDetailEvent && (
                                        <AnnotationBadge key={currentEv.annotation} text={currentEv.annotation} type={currentEv.type} />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* SVG lines */}
                            <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH + 80} overflow="visible">
                                <defs>
                                    <marker id="sc-arr-div" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                        <path d="M0,0 L0,8 L8,4 Z" fill="#6366f1" />
                                    </marker>
                                    <marker id="sc-arr-mrg" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
                                        <path d="M0,0 L0,8 L8,4 Z" fill="#10b981" />
                                    </marker>
                                </defs>
                                <AnimatePresence>
                                    {svgLines.map(l => (
                                        <motion.line key={l.key}
                                            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                                            stroke={l.merging ? '#10b981' : '#6366f1'} strokeWidth={2}
                                            markerEnd={!l.merging ? 'url(#sc-arr-div)' : undefined}
                                            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                                    ))}
                                </AnimatePresence>
                            </svg>

                            {/* Nodes */}
                            {allNodes.map(node => {
                                if (!visibleIds.has(node.id)) return null;
                                const isMerged  = mergedIds.has(node.id);
                                const isHighMid = highlightMids.has(node.id) && !splitIds.has(node.id);
                                const displayArr = isMerged ? node.merged : node.arr;
                                const boxW       = nodeBoxW(displayArr);

                                return (
                                    <motion.div key={node.id}
                                        className="absolute flex flex-col items-center gap-1"
                                        style={{ left: node.x - boxW / 2, top: node.y }}
                                        initial={{ opacity: 0, scale: 0.6, y: -12 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}>

                                        {isMerged && !node.isLeaf && (
                                            <motion.span className="text-xs text-emerald-400 font-semibold mb-0.5"
                                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}>Merged ✓</motion.span>
                                        )}

                                        <motion.div
                                            className={`flex items-center rounded-xl border-2 transition-colors duration-500 ${
                                                isMerged
                                                    ? 'bg-emerald-900/40 border-emerald-500/70 shadow-lg shadow-emerald-900/40'
                                                    : node.isLeaf
                                                        ? 'bg-slate-800 border-slate-600'
                                                        : 'bg-slate-800/80 border-indigo-500/50'}`}
                                            style={{ padding: `6px ${NODE_EXTRA_PAD}px`, gap: CELL_GAP }}
                                            animate={isHighMid ? { boxShadow: ['0 0 0 0 rgba(251,191,36,0)', '0 0 0 8px rgba(251,191,36,0.35)', '0 0 0 0 rgba(251,191,36,0)'] } : {}}
                                            transition={isHighMid ? { duration: 0.8, repeat: 2 } : {}}>
                                            {displayArr.map((v, i) => {
                                                const isMidEl = !node.isLeaf && !isMerged && isHighMid && i === node.mid;
                                                return (
                                                    <motion.div key={i}
                                                        animate={isMidEl ? { scale: [1, 1.3, 1] } : {}}
                                                        transition={isMidEl ? { duration: 0.6, repeat: 1 } : {}}>
                                                        <ArrayCell val={v} highlight={isMidEl} sorted={isMerged} />
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>

                                        {isHighMid && (
                                            <motion.span className="text-xs text-amber-400 font-medium"
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                mid = {node.mid}&nbsp;|&nbsp;split: [{node.arr.slice(0, node.mid).join(', ')}] · [{node.arr.slice(node.mid).join(', ')}]
                                            </motion.span>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Merge detail panel — sticky above legend */}
                    <AnimatePresence>
                        {isDetailEvent && (
                            <MergeDetailPanel ev={currentEv} mergeCount={detailMergeCount} />
                        )}
                    </AnimatePresence>

                    {/* Bottom legend */}
                    <div className="flex-shrink-0 flex items-center justify-center gap-8 py-2.5 border-t border-slate-800 bg-slate-900 text-xs text-slate-500">
                        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-indigo-500" /><span>Divide</span></div>
                        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-emerald-500" /><span>Merge</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500/80 border border-amber-400" /><span>Mid element</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500/80 border border-emerald-400" /><span>Sorted</span></div>
                    </div>
                </div>

                {/* Code panel */}
                <SyncedCodePanel code={code} activeLine={activeLine} executedLines={executedLines} />
            </div>
        </div>
    );
};

export default SyncedCoreLogicVisualizer;
