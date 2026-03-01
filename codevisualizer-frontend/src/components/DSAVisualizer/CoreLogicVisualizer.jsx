/**
 * CoreLogicVisualizer
 *
 * Shows the full Merge Sort algorithm as a growing, animated tree:
 *  - Divide phase  : tree expands downward, auto-scrolling down
 *  - Merge phase   : sorted results bubble upward, auto-scrolling up
 *
 * Computes its own tree from `customArray` — no tracer steps needed.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Layout constants ───────────────────────────────────────────────────────
const CELL_W   = 38;   // px per element cell
const CELL_H   = 38;
const CELL_GAP = 4;
const LEAF_W   = 110;  // horizontal space allocated per leaf node
const LEVEL_H  = 160;  // vertical gap between tree levels
const NODE_EXTRA_PAD = 16; // extra internal padding in node box

// ─── Pure helpers ───────────────────────────────────────────────────────────
const mergeSorted = (a, b) => {
    const res = []; let i = 0, j = 0;
    while (i < a.length && j < b.length) res.push(a[i] <= b[j] ? a[i++] : b[j++]);
    return [...res, ...a.slice(i), ...b.slice(j)];
};

const buildTree = (arr, id = 'root', depth = 0) => {
    if (arr.length <= 1) {
        return { id, arr, depth, left: null, right: null, merged: [...arr], isLeaf: true, mid: null };
    }
    const mid = Math.floor(arr.length / 2);
    const left  = buildTree(arr.slice(0, mid), id + 'L', depth + 1);
    const right = buildTree(arr.slice(mid),    id + 'R', depth + 1);
    return { id, arr, depth, left, right, merged: mergeSorted(left.merged, right.merged), isLeaf: false, mid };
};

const countLeaves = (node) => node.isLeaf ? 1 : countLeaves(node.left) + countLeaves(node.right);

/** Assign x (center) and y positions to every node */
const assignLayout = (node, offsetX = 0) => {
    const leaves = countLeaves(node);
    node.blockW = leaves * LEAF_W;
    node.y = node.depth * LEVEL_H;
    if (node.isLeaf) {
        node.x = offsetX + LEAF_W / 2;
    } else {
        const leftLeaves = countLeaves(node.left);
        assignLayout(node.left,  offsetX);
        assignLayout(node.right, offsetX + leftLeaves * LEAF_W);
        node.x = (node.left.x + node.right.x) / 2;
    }
};

/** Compute pixel width of a node's array box */
const nodeBoxW = (arr) => arr.length * CELL_W + (arr.length - 1) * CELL_GAP + NODE_EXTRA_PAD * 2;

/** Flatten tree into all nodes (for rendering) */
const flattenTree = (node, acc = []) => {
    acc.push(node);
    if (!node.isLeaf) { flattenTree(node.left, acc); flattenTree(node.right, acc); }
    return acc;
};

/** Build the step-by-step comparison states for merging two sorted arrays */
const generateMergeSteps = (nodeId, left, right, scrollY) => {
    const steps = [];
    let i = 0, j = 0, result = [];

    steps.push({ type: 'merge_detail', phase: 'intro', nodeId, left, right, i: 0, j: 0, result: [], scrollY });

    while (i < left.length && j < right.length) {
        steps.push({ type: 'merge_detail', phase: 'compare', nodeId, left, right, i, j, result: [...result], scrollY });
        if (left[i] <= right[j]) {
            result = [...result, left[i]];
            steps.push({ type: 'merge_detail', phase: 'add_left',  nodeId, left, right, i, j, result: [...result], addedVal: left[i], scrollY });
            i++;
        } else {
            result = [...result, right[j]];
            steps.push({ type: 'merge_detail', phase: 'add_right', nodeId, left, right, i, j, result: [...result], addedVal: right[j], scrollY });
            j++;
        }
    }

    const remaining = [...left.slice(i), ...right.slice(j)];
    if (remaining.length > 0) {
        result = [...result, ...remaining];
        steps.push({ type: 'merge_detail', phase: 'remaining', nodeId, left, right, i, j, result: [...result], remaining, scrollY });
    }
    steps.push({ type: 'merge_detail', phase: 'done', nodeId, left, right, i: left.length, j: right.length, result: [...result], scrollY });
    return steps;
};

/**
 * Build ordered event list for the animation:
 *  appear        – node box appears
 *  highlight_mid – middle element pulses/highlights
 *  split         – connecting lines animate to children
 *  merge_detail  – step-by-step comparison (first MAX_DETAIL_MERGES merges only)
 *  merge_result  – show merged result replacing original at this node
 */
const buildEvents = (node) => {
    const evs = [];

    const dfs = (n) => {
        evs.push({ type: 'appear',        nodeId: n.id, scrollY: n.y });
        if (!n.isLeaf) {
            evs.push({ type: 'highlight_mid', nodeId: n.id, scrollY: n.y });
            evs.push({ type: 'split',         nodeId: n.id, scrollY: Math.max(0, n.y + LEVEL_H - 80) });
            dfs(n.left);
            dfs(n.right);

            const panelScrollY = Math.max(0, n.y + LEVEL_H * 0.5);
            generateMergeSteps(n.id, n.left.merged, n.right.merged, panelScrollY)
                .forEach(ev => evs.push(ev));

            evs.push({ type: 'merge_result', nodeId: n.id, scrollY: Math.max(0, n.y - 60) });
        }
    };
    dfs(node);
    return evs;
};

// ─── Per-event timing (ms to wait before advancing) ────────────────────────
const EVENT_DELAY = {
    appear:        700,
    highlight_mid: 700,
    split:         900,
    merge_result:  900,
    'merge_detail:intro':     900,
    'merge_detail:compare':   950,
    'merge_detail:add_left':  700,
    'merge_detail:add_right': 700,
    'merge_detail:remaining': 1200,
    'merge_detail:done':      500,
};

const getEventDelay = (ev) => {
    if (ev?.type === 'merge_detail') return EVENT_DELAY[`merge_detail:${ev.phase}`] ?? 800;
    return EVENT_DELAY[ev?.type] ?? 800;
};

// ─── Small UI components ─────────────────────────────────────────────────────

const ArrayCell = ({ val, highlight, sorted, small, pointer, dim }) => {
    const size = small ? 28 : CELL_H;
    const font = small ? 'text-xs' : 'text-sm';
    let bg = 'bg-slate-700 border-slate-500 text-slate-200';
    if (highlight) bg = 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-300';
    if (sorted)    bg = 'bg-emerald-500 border-emerald-300 text-white';
    if (dim)       bg = 'bg-slate-800 border-slate-700 text-slate-500';
    return (
        <div className="flex flex-col items-center gap-0.5">
            {pointer && (
                <motion.div
                    className="text-indigo-400 font-bold text-base leading-none"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    ▼
                </motion.div>
            )}
            <div
                className={`flex items-center justify-center rounded-lg border-2 font-bold ${font} ${bg}`}
                style={{ width: size, height: size, minWidth: size, flexShrink: 0 }}
            >
                {val}
            </div>
        </div>
    );
};

const ResultCell = ({ val }) => (
    <motion.div
        className="flex items-center justify-center rounded-lg border-2 font-bold text-sm bg-emerald-700 border-emerald-400 text-white"
        style={{ width: CELL_H, height: CELL_H, minWidth: CELL_H, flexShrink: 0 }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
        {val}
    </motion.div>
);

const ArrayRow = ({ arr, highlightIdx, sorted, small }) => (
    <div className="flex items-center" style={{ gap: CELL_GAP }}>
        {arr.map((v, i) => (
            <ArrayCell key={i} val={v} highlight={!sorted && highlightIdx === i} sorted={sorted} small={small} />
        ))}
    </div>
);

// ─── Merge Detail Panel ──────────────────────────────────────────────────────
const MergeDetailPanel = ({ ev, mergeCount }) => {
    if (!ev) return null;
    const { phase, left, right, i, j, result, remaining, addedVal } = ev;

    const phaseDesc = {
        intro:     `Pointers start at index 0 on both sides`,
        compare:   `Comparing  left[${i}] = ${left[i] ?? '?'}  vs  right[${j}] = ${right[j] ?? '?'}`,
        add_left:  `${addedVal} is smaller — take from left, advance i`,
        add_right: `${addedVal} is smaller — take from right, advance j`,
        remaining: `One side exhausted — copy remaining ${remaining?.length ?? 0} element(s)`,
        done:      `Merge complete`,
    }[phase] ?? '';

    const phaseColor = {
        intro:     'text-indigo-300',
        compare:   'text-amber-300',
        add_left:  'text-emerald-300',
        add_right: 'text-emerald-300',
        remaining: 'text-sky-300',
        done:      'text-emerald-400',
    }[phase] ?? 'text-slate-300';

    const showPointerLeft  = phase !== 'remaining' && phase !== 'done';
    const showPointerRight = phase !== 'remaining' && phase !== 'done';

    return (
        <motion.div
            className="flex-shrink-0 border-t-2 border-indigo-900/60 bg-slate-900 px-8 py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
            {/* Header bar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" style={{ animation: 'pulse 1.5s infinite' }} />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                        Merge {mergeCount}
                    </span>
                </div>
                <div className="h-px flex-1 bg-slate-700/60" />
                <span className={`text-sm font-semibold ${phaseColor}`}>{phaseDesc}</span>
            </div>

            {/* Arrays row */}
            <div className="flex items-center justify-center gap-4">

                {/* Left card */}
                <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700/80 rounded-2xl px-5 py-3 gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Left</span>
                    <div className="flex gap-2 items-end" style={{ minHeight: CELL_H + 24 }}>
                        {left.map((v, idx) => (
                            <ArrayCell
                                key={idx}
                                val={v}
                                highlight={phase === 'compare' && idx === i}
                                pointer={showPointerLeft && idx === i && i < left.length}
                                dim={idx < i}
                                sorted={false}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400">i = {Math.min(i, left.length)}</span>
                </div>

                {/* Comparison operator */}
                {(() => {
                    let sym = 'vs', color = 'text-slate-500';
                    if (phase === 'compare' && i < left.length && j < right.length) {
                        if (left[i] < right[j])       { sym = '<'; color = 'text-amber-400'; }
                        else if (left[i] > right[j])  { sym = '>'; color = 'text-amber-400'; }
                        else                           { sym = '='; color = 'text-sky-400'; }
                    } else if (phase === 'add_left' || phase === 'add_right') {
                        sym = phase === 'add_left' ? '<' : '>';
                        color = 'text-emerald-400';
                    }
                    return (
                        <div className="flex flex-col items-center gap-1 self-center pt-2">
                            <div className="w-px h-4 bg-slate-700" />
                            <motion.span
                                key={sym}
                                className={`text-lg font-black ${color}`}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                            >
                                {sym}
                            </motion.span>
                            <div className="w-px h-4 bg-slate-700" />
                        </div>
                    );
                })()}

                {/* Right card */}
                <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700/80 rounded-2xl px-5 py-3 gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Right</span>
                    <div className="flex gap-2 items-end" style={{ minHeight: CELL_H + 24 }}>
                        {right.map((v, idx) => (
                            <ArrayCell
                                key={idx}
                                val={v}
                                highlight={phase === 'compare' && idx === j}
                                pointer={showPointerRight && idx === j && j < right.length}
                                dim={idx < j}
                                sorted={false}
                            />
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

                {/* Result card */}
                <div className="flex flex-col items-center bg-emerald-900/20 border border-emerald-800/40 rounded-2xl px-5 py-3 gap-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Result</span>
                    <div className="flex gap-2 items-center" style={{ minHeight: CELL_H + 24 }}>
                        <AnimatePresence mode="popLayout">
                            {result.map((v, idx) => (
                                <ResultCell key={`${idx}-${v}`} val={v} />
                            ))}
                            {result.length === 0 && (
                                <span className="text-xs text-slate-600 italic self-center px-1">empty</span>
                            )}
                        </AnimatePresence>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600">{result.length} / {left.length + right.length}</span>
                </div>

            </div>
        </motion.div>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────
const CoreLogicVisualizer = ({ customArray = '[38, 27, 43, 3, 9, 82, 10]', onProgress, seekRef }) => {
    // Parse customArray string → number[]
    const inputArr = useMemo(() => {
        try {
            const parsed = JSON.parse(customArray.trim());
            if (Array.isArray(parsed)) return parsed.map(Number);
        } catch {}
        return [38, 27, 43, 3, 9, 82, 10];
    }, [customArray]);

    // Build and layout tree
    const tree = useMemo(() => {
        const t = buildTree(inputArr);
        assignLayout(t, 0);
        return t;
    }, [inputArr]);

    const allNodes   = useMemo(() => flattenTree(tree), [tree]);
    const events     = useMemo(() => buildEvents(tree), [tree]);
    const totalLeaves = useMemo(() => countLeaves(tree), [tree]);
    const maxDepth    = useMemo(() => Math.max(...allNodes.map(n => n.depth)), [allNodes]);

    const canvasW = totalLeaves * LEAF_W + 80;
    const canvasH = (maxDepth + 1) * LEVEL_H + 200; // extra for merge labels

    // Animation state
    const [eventIdx,    setEventIdx]    = useState(-1); // current event index
    const [playing,     setPlaying]     = useState(false);
    const [finished,    setFinished]    = useState(false);
    const [seenEvents,  setSeenEvents]  = useState(new Set()); // all fired event indices
    const [speed,       setSpeed]       = useState(1); // playback speed multiplier

    // Derived state from events processed so far
    const processedEvents = useMemo(() => events.slice(0, eventIdx + 1), [events, eventIdx]);

    const visibleNodeIds  = useMemo(() => new Set(processedEvents.filter(e => e.type === 'appear').map(e => e.nodeId)), [processedEvents]);
    const highlightedMids = useMemo(() => new Set(processedEvents.filter(e => e.type === 'highlight_mid').map(e => e.nodeId)), [processedEvents]);
    const splitNodeIds    = useMemo(() => new Set(processedEvents.filter(e => e.type === 'split').map(e => e.nodeId)), [processedEvents]);
    const mergedNodeIds   = useMemo(() => new Set(processedEvents.filter(e => e.type === 'merge_result').map(e => e.nodeId)), [processedEvents]);

    // Dismiss children (and their descendants) once their parent is merged
    const dismissedIds = useMemo(() => {
        const ids = new Set();
        processedEvents.forEach(e => {
            if (e.type === 'merge_result') {
                const mergedNode = allNodes.find(n => n.id === e.nodeId);
                if (mergedNode && !mergedNode.isLeaf) {
                    const collectAll = (n) => {
                        if (!n) return;
                        ids.add(n.id);
                        if (!n.isLeaf) { collectAll(n.left); collectAll(n.right); }
                    };
                    collectAll(mergedNode.left);
                    collectAll(mergedNode.right);
                }
            }
        });
        return ids;
    }, [processedEvents, allNodes]);

    // Derived: is the current event a detail-panel event?
    const currentEvent  = events[eventIdx];
    const isDetailEvent = currentEvent?.type === 'merge_detail' && currentEvent?.phase !== 'done';

    // Which merge number (1-indexed) is currently showing (for panel header)
    const detailMergeCount = useMemo(() => {
        let count = 0;
        let lastId = null;
        for (let k = 0; k <= eventIdx; k++) {
            const ev = events[k];
            if (ev?.type === 'merge_detail' && ev?.phase === 'intro' && ev.nodeId !== lastId) {
                count++;
                lastId = ev.nodeId;
            }
        }
        return count;
    }, [events, eventIdx]);

    // Scroll ref
    const scrollRef = useRef(null);

    // Auto-scroll to follow current event (skip during detail events)
    useEffect(() => {
        const ev = events[eventIdx];
        if (!ev || !scrollRef.current) return;
        if (ev.type === 'merge_detail') return; // panel is sticky — don't scroll
        const container = scrollRef.current;
        const targetScrollTop = Math.max(0, ev.scrollY - container.clientHeight / 2 + 100);
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }, [eventIdx, events]);

    // Reset animation when input array changes
    useEffect(() => {
        setEventIdx(-1);
        setPlaying(false);
        setFinished(false);
        setSeenEvents(new Set());
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, [inputArr]);

    // Advance event timer
    useEffect(() => {
        if (!playing || finished) return;
        const nextIdx = eventIdx + 1;
        if (nextIdx >= events.length) { setFinished(true); setPlaying(false); return; }
        const delay = getEventDelay(events[nextIdx]) / speed;
        const t = setTimeout(() => {
            setEventIdx(nextIdx);
            setSeenEvents(prev => new Set([...prev, nextIdx]));
        }, delay);
        return () => clearTimeout(t);
    }, [playing, eventIdx, events, finished, speed]);

    const handlePlay = () => {
        if (finished) {
            setEventIdx(-1);
            setFinished(false);
            setSeenEvents(new Set());
            setTimeout(() => setPlaying(true), 100);
        } else {
            setPlaying(true);
        }
    };

    const handlePause = () => setPlaying(false);

    const handleReset = () => {
        setPlaying(false);
        setEventIdx(-1);
        setFinished(false);
        setSeenEvents(new Set());
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrev = () => {
        setPlaying(false);
        setEventIdx(prev => Math.max(-1, prev - 1));
    };

    const handleNext = () => {
        setPlaying(false);
        if (finished) return;
        const nextIdx = eventIdx + 1;
        if (nextIdx >= events.length) { setFinished(true); return; }
        setEventIdx(nextIdx);
        setSeenEvents(prev => new Set([...prev, nextIdx]));
    };

    // Register seek function for external scrubber
    useEffect(() => {
        if (seekRef) seekRef.current = (idx) => {
            setPlaying(false);
            setFinished(idx >= events.length - 1);
            setEventIdx(Math.max(-1, Math.min(events.length - 1, idx)));
        };
    }, [seekRef, events.length]);

    // Report progress to parent scrubber
    useEffect(() => {
        onProgress?.({ idx: eventIdx, total: events.length });
    }, [eventIdx, events.length, onProgress]);

    // Build SVG lines between parent and children (only if split has happened and children not dismissed)
    const svgLines = useMemo(() => {
        const lines = [];
        allNodes.forEach(node => {
            if (node.isLeaf || !splitNodeIds.has(node.id)) return;
            if (dismissedIds.has(node.left.id) || dismissedIds.has(node.right.id)) return;
            // line from node to left child
            lines.push({ key: node.id + '-L', x1: node.x, y1: node.y + CELL_H + 8, x2: node.left.x,  y2: node.left.y  - 4, merging: mergedNodeIds.has(node.id) });
            lines.push({ key: node.id + '-R', x1: node.x, y1: node.y + CELL_H + 8, x2: node.right.x, y2: node.right.y - 4, merging: mergedNodeIds.has(node.id) });
        });
        return lines;
    }, [allNodes, splitNodeIds, mergedNodeIds, dismissedIds]);

    const getPhaseLabel = () => {
        if (!currentEvent) return 'Press Start to begin';
        if (finished) return '✅ Sorted!';
        switch (currentEvent.type) {
            case 'appear':        return '📋 Viewing array';
            case 'highlight_mid': return '🎯 Finding middle element';
            case 'split':         return '✂️ Splitting into two halves';
            case 'merge_result':  return '🔀 Merging sorted halves';
            case 'merge_detail':  return '🔍 Step-by-step merge — watch the panel below';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white select-none">
            {/* Top status bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-3 border-b border-slate-800 bg-slate-900">
                <div className="text-sm text-slate-400 font-medium">
                    <span className="text-slate-200">{getPhaseLabel()}</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Speed selector */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                        {[0.5, 1, 1.5, 2, 3].map(s => (
                            <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                    speed === s
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                            >
                                {s}×
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-slate-700" />

                    {/* Reset — separate */}
                    <button
                        onClick={handleReset}
                        disabled={eventIdx < 0}
                        title="Reset"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/>
                        </svg>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-slate-700" />

                    {/* Prev | Play/Pause/Resume/Replay | Next */}
                    <div className="flex items-center gap-2">
                        {/* Prev */}
                        <button
                            onClick={handlePrev}
                            disabled={eventIdx < 0}
                            title="Previous step"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
                            </svg>
                        </button>

                        {/* Start */}
                        {!playing && !finished && eventIdx < 0 && (
                            <button onClick={handlePlay} title="Start"
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/40"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 translate-x-px">
                                    <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd"/>
                                </svg>
                                Start
                            </button>
                        )}
                        {/* Pause */}
                        {playing && (
                            <button onClick={handlePause} title="Pause"
                                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" clipRule="evenodd"/>
                                </svg>
                                Pause
                            </button>
                        )}
                        {/* Resume */}
                        {!playing && eventIdx >= 0 && !finished && (
                            <button onClick={handlePlay} title="Resume"
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 translate-x-px">
                                    <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd"/>
                                </svg>
                                Resume
                            </button>
                        )}
                        {/* Replay */}
                        {finished && (
                            <button onClick={handlePlay} title="Replay"
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/>
                                </svg>
                                Replay
                            </button>
                        )}

                        {/* Next */}
                        <button
                            onClick={handleNext}
                            disabled={finished}
                            title="Next step"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable canvas */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-auto"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div
                    className="relative mx-auto"
                    style={{ width: canvasW, height: canvasH + 80, minHeight: '100%' }}
                >
                    {/* SVG for connector lines */}
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        width={canvasW}
                        height={canvasH + 80}
                        overflow="visible"
                    >
                        <defs>
                            <marker id="arrow-divide" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                                <path d="M0,0 L0,8 L8,4 Z" fill="#6366f1" />
                            </marker>
                            <marker id="arrow-merge" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
                                <path d="M0,0 L0,8 L8,4 Z" fill="#10b981" />
                            </marker>
                        </defs>
                        <AnimatePresence>
                            {svgLines.map(l => (
                                <motion.line
                                    key={l.key}
                                    x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                                    stroke={l.merging ? '#10b981' : '#6366f1'}
                                    strokeWidth={2}
                                    markerEnd={!l.merging ? 'url(#arrow-divide)' : undefined}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            ))}
                        </AnimatePresence>
                    </svg>

                    {/* Nodes */}
                    <AnimatePresence>
                    {allNodes.filter(node => visibleNodeIds.has(node.id) && !dismissedIds.has(node.id)).map(node => {
                        const isMerged   = mergedNodeIds.has(node.id);
                        const isHighMid  = highlightedMids.has(node.id) && !splitNodeIds.has(node.id);
                        const displayArr = isMerged ? node.merged : node.arr;
                        const label      = isMerged && !node.isLeaf ? 'Merged ✓' : null;

                        const boxW = nodeBoxW(displayArr);

                        return (
                            <motion.div
                                key={node.id}
                                className="absolute flex flex-col items-center gap-1"
                                style={{ left: node.x - boxW / 2, top: node.y }}
                                initial={{ opacity: 0, scale: 0.6, y: -12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.4, y: 20 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                            >
                                {/* Merged label */}
                                {label && (
                                    <motion.span
                                        className="text-xs text-emerald-400 font-semibold mb-0.5"
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {label}
                                    </motion.span>
                                )}

                                {/* Array box */}
                                <motion.div
                                    className={`flex items-center rounded-xl border-2 transition-colors duration-500 ${
                                        isMerged
                                            ? 'bg-emerald-900/40 border-emerald-500/70 shadow-lg shadow-emerald-900/40'
                                            : node.isLeaf
                                                ? 'bg-slate-800 border-slate-600'
                                                : 'bg-slate-800/80 border-indigo-500/50'
                                    }`}
                                    style={{ padding: `6px ${NODE_EXTRA_PAD}px`, gap: CELL_GAP }}
                                    animate={isHighMid ? { boxShadow: ['0 0 0 0 rgba(251,191,36,0)', '0 0 0 8px rgba(251,191,36,0.35)', '0 0 0 0 rgba(251,191,36,0)'] } : {}}
                                    transition={isHighMid ? { duration: 0.8, repeat: 2 } : {}}
                                >
                                    {displayArr.map((v, i) => {
                                        const isMidEl = !node.isLeaf && !isMerged && isHighMid && i === node.mid;
                                        return (
                                            <motion.div
                                                key={i}
                                                animate={isMidEl ? { scale: [1, 1.3, 1] } : {}}
                                                transition={isMidEl ? { duration: 0.6, repeat: 1 } : {}}
                                            >
                                                <ArrayCell
                                                    val={v}
                                                    highlight={isMidEl}
                                                    sorted={isMerged}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>

                                {/* Split label */}
                                {isHighMid && (
                                    <motion.span
                                        className="text-xs text-amber-400 font-medium"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        mid = {node.mid} &nbsp;|&nbsp; split: [{node.arr.slice(0, node.mid).join(', ')}] · [{node.arr.slice(node.mid).join(', ')}]
                                    </motion.span>
                                )}
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Merge Detail Panel — sticky above legend */}
            <AnimatePresence>
                {isDetailEvent && (
                    <MergeDetailPanel ev={currentEvent} mergeCount={detailMergeCount} />
                )}
            </AnimatePresence>


        </div>
    );
};

export default CoreLogicVisualizer;
