/**
 * SubsetsVisualizer — SVG-based recursive backtracking call-tree for subsets(nums).
 *
 * Input: array like [1, 2, 3] (max 4 elements) via customArray prop.
 * Shows the full DFS call tree with:
 *  – Animated pill nodes (sky=active, emerald=storing, amber=choosing, violet=done)
 *  – Animated SVG edges with "+element" labels
 *  – Per-step annotation strip
 *  – Growing result chips strip
 *  – SyncedVisualizerShell for the code panel
 *  – useTreeCanvas for auto-pan/zoom on mobile
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizerPlayback, makeGetDelay } from './visualizerShared';
import { useTreeCanvas } from './useTreeCanvas';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import VisualizerControls from './VisualizerControls';

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_H     = 30;    // pill height
const NODE_W     = 72;    // pill width (fits "[1,2,3]")
const LEVEL_H    = 92;    // vertical gap between depth levels
const TOP_PAD    = 48;    // canvas top padding
const SIDE_PAD   = 40;    // horizontal padding on each side
const MIN_LEAF_W = 92;    // minimum column width per leaf

// ── Build call tree + events ──────────────────────────────────────────────────
const simulateSubsets = (nums) => {
    let counter = 0;
    const nodeMap = {};

    // Phase 1: build tree structure (mirrors Python DFS order)
    const buildNode = (index, subset, depth, parentId, parentEdgeEl) => {
        const id = `bt${counter++}`;
        const node = {
            id, index,
            subset: [...subset],
            depth, parentId,
            parentEdgeEl,      // element chosen to reach this node (null for root)
            childEntries: [],  // [{ childId, element }]
            x: 0, y: 0, _subW: 0,
        };
        nodeMap[id] = node;
        for (let i = index; i < nums.length; i++) {
            subset.push(nums[i]);
            const child = buildNode(i + 1, subset, depth + 1, id, nums[i]);
            node.childEntries.push({ childId: child.id, element: nums[i] });
            subset.pop();
        }
        return node;
    };
    const root = buildNode(0, [], 0, null, null);

    // Phase 2: compute subtree widths for layout
    const computeSubW = (node) => {
        if (node.childEntries.length === 0) {
            node._subW = MIN_LEAF_W;
            return MIN_LEAF_W;
        }
        node._subW = node.childEntries.reduce(
            (s, { childId }) => s + computeSubW(nodeMap[childId]), 0
        );
        return node._subW;
    };
    computeSubW(root);

    // Phase 3: assign x/y positions
    const assignPos = (node, startX) => {
        node.x = startX + node._subW / 2 + SIDE_PAD;
        node.y = node.depth * LEVEL_H + TOP_PAD + NODE_H / 2;
        let cx = startX;
        for (const { childId } of node.childEntries) {
            const child = nodeMap[childId];
            assignPos(child, cx);
            cx += child._subW;
        }
    };
    assignPos(root, 0);

    // Phase 4: generate events in DFS order — mirrors Python execution
    const events = [];
    events.push({ type: 'nums_assign',  codeLine: 19, annotation: `nums = [${nums.join(', ')}]  — assign input` });
    events.push({ type: 'result_init',  codeLine: 3,  annotation: `result = []  — initialise result list` });
    events.push({ type: 'subset_init',  codeLine: 4,  annotation: `subset = []  — initialise current subset` });
    events.push({ type: 'initial_call', codeLine: 16, annotation: `backtrack(0)  — start recursion from index 0` });

    const allStoredSubsets = [];

    const dfs = (node) => {
        const subStr = `[${node.subset.join(', ')}]`;

        events.push({
            type: 'call', nodeId: node.id, codeLine: 6, scrollY: node.y,
            annotation: `backtrack(${node.index})  — enter, subset = ${subStr}`,
        });
        events.push({
            type: 'store_subset', nodeId: node.id, codeLine: 9, scrollY: node.y,
            annotation: `result.append(${subStr})  — store current subset ✓`,
            storedSubset: [...node.subset],
        });
        allStoredSubsets.push([...node.subset]);

        if (node.childEntries.length > 0) {
            events.push({
                type: 'for_loop', nodeId: node.id, codeLine: 11, scrollY: node.y,
                annotation: `for i in range(${node.index}, ${nums.length})  — try each remaining element`,
            });
        }

        for (const { childId, element } of node.childEntries) {
            const child = nodeMap[childId];
            events.push({
                type: 'choose', nodeId: node.id, childId, element, codeLine: 12, scrollY: node.y,
                annotation: `subset.append(${element})  — choose ${element}`,
            });
            events.push({
                type: 'recurse', nodeId: node.id, childId, codeLine: 13, scrollY: node.y,
                annotation: `backtrack(${child.index})  — recurse deeper`,
            });
            dfs(child);
            events.push({
                type: 'pop', nodeId: node.id, element, codeLine: 14, scrollY: node.y,
                annotation: `subset.pop()  — remove ${element}, back to [${node.subset.join(', ')}]`,
            });
        }

        events.push({
            type: 'return', nodeId: node.id, codeLine: 6, scrollY: node.y,
            annotation: `return from backtrack(${node.index})`,
        });
    };

    dfs(root);

    events.push({
        type: 'return_result', codeLine: 17,
        annotation: `return result  — ${allStoredSubsets.length} subsets found`,
    });
    events.push({
        type: 'done', codeLine: 20,
        annotation: `subsets([${nums.join(', ')}]) → ${allStoredSubsets.length} subsets  ✓  complete!`,
        result: allStoredSubsets,
    });

    const allNodes = Object.values(nodeMap);
    const maxDepth = Math.max(...allNodes.map(n => n.depth));
    const canvasW  = root._subW + SIDE_PAD * 2;
    const canvasH  = (maxDepth + 1) * LEVEL_H + TOP_PAD + NODE_H + 48;

    return { events, nodeMap, allNodes, canvasW, canvasH };
};

// ── Delay table (ms per event type) ─────────────────────────────────────────
const DELAY = {
    nums_assign: 700, result_init: 700, subset_init: 700, initial_call: 850,
    call: 700, store_subset: 950, for_loop: 650,
    choose: 750, recurse: 650, pop: 750,
    return: 600, return_result: 900, done: 1400,
};
const getDelay = makeGetDelay(DELAY, 750);

// ── Node colour palette ──────────────────────────────────────────────────────
const COLORS = {
    active:   { fill: '#0c4a6e', stroke: '#38bdf8', text: '#e0f2fe' },  // sky
    storing:  { fill: '#064e3b', stroke: '#34d399', text: '#d1fae5' },  // emerald
    choosing: { fill: '#78350f', stroke: '#fbbf24', text: '#fef3c7' },  // amber
    done:     { fill: '#4c1d95', stroke: '#a78bfa', text: '#ede9fe' },  // violet
    default:  { fill: '#1e293b', stroke: '#475569', text: '#94a3b8' },
};

// ── Main component ───────────────────────────────────────────────────────────
const SubsetsVisualizer = ({
    customArray = '[1, 2, 3]',
    code = '',
    onProgress,
    seekRef,
    drawerState,
    setDrawerState,
}) => {
    // Parse nums — clamp to max 4 elements
    const inputNums = useMemo(() => {
        let arr;
        try { arr = JSON.parse(String(customArray).trim()); } catch { arr = [1, 2, 3]; }
        if (!Array.isArray(arr)) arr = [1, 2, 3];
        arr = arr.map(Number).filter(n => !isNaN(n));
        if (arr.length === 0) arr = [1, 2, 3];
        return arr.slice(0, 4);
    }, [customArray]);

    // Stable input key for reset detection
    const inputKey = useMemo(() => inputNums, [inputNums]);

    const { events, nodeMap, allNodes, canvasW, canvasH } = useMemo(
        () => simulateSubsets(inputNums),
        [inputNums]
    );

    const {
        eventIdx, playing, finished, speed, setSpeed,
        handlePlay, handlePause, handleReset, handleBack, handleNext,
        currentEv, activeLine, executedLines,
    } = useVisualizerPlayback({ events, getDelay, inputArr: inputKey, seekRef, onProgress });

    const { scrollRef, canvasZoom } = useTreeCanvas({
        events, allNodes, eventIdx, inputArr: inputKey,
        ignoreTypes: ['nums_assign', 'result_init', 'subset_init', 'initial_call', 'return_result', 'done'],
    });

    // ── Accumulate node + edge state from all processed events ───────────────
    const { visibleIds, nodeStates, edgeStates, storedSoFar } = useMemo(() => {
        const visible = new Set();
        const states  = {};
        const edges   = {};
        const stored  = [];

        events.slice(0, eventIdx + 1).forEach(ev => {
            const id = ev.nodeId;
            if (ev.type === 'call') {
                if (id) { visible.add(id); states[id] = 'active'; }
                if (id && nodeMap[id]?.parentId) {
                    edges[`${nodeMap[id].parentId}->${id}`] = 'active';
                }
            }
            if (ev.type === 'store_subset') {
                if (id) states[id] = 'storing';
                if (ev.storedSubset) stored.push([...ev.storedSubset]);
            }
            if (ev.type === 'for_loop' || ev.type === 'choose' || ev.type === 'pop') {
                if (id) states[id] = 'choosing';
            }
            if (ev.type === 'recurse') {
                if (id && ev.childId) edges[`${id}->${ev.childId}`] = 'active';
            }
            if (ev.type === 'return') {
                if (id) {
                    states[id] = 'done';
                    if (nodeMap[id]?.parentId) {
                        edges[`${nodeMap[id].parentId}->${id}`] = 'done';
                    }
                }
            }
        });

        return { visibleIds: visible, nodeStates: states, edgeStates: edges, storedSoFar: stored };
    }, [events, eventIdx, nodeMap]);

    // ── Build SVG edge list from visible nodes ────────────────────────────────
    const edgeList = useMemo(() => {
        const list = [];
        allNodes.forEach(node => {
            node.childEntries.forEach(({ childId, element }) => {
                if (!visibleIds.has(node.id) || !visibleIds.has(childId)) return;
                const child = nodeMap[childId];
                const key   = `${node.id}->${childId}`;
                const done  = edgeStates[key] === 'done';
                list.push({
                    key, element, done,
                    x1: node.x,  y1: node.y + NODE_H / 2,
                    x2: child.x, y2: child.y - NODE_H / 2,
                    mx: (node.x + child.x) / 2,
                    my: ((node.y + NODE_H / 2) + (child.y - NODE_H / 2)) / 2,
                });
            });
        });
        return list;
    }, [allNodes, visibleIds, nodeMap, edgeStates]);

    const annotation = currentEv?.annotation ?? null;
    const activeId   = currentEv?.nodeId ?? null;

    const controls = (
        <VisualizerControls
            speed={speed} setSpeed={setSpeed}
            eventIdx={eventIdx} playing={playing} finished={finished}
            onPlay={handlePlay} onPause={handlePause} onReset={handleReset}
            onBack={handleBack} onNext={handleNext}
        />
    );

    return (
        <SyncedVisualizerShell
            code={code}
            activeLine={activeLine}
            executedLines={executedLines ?? []}
            drawerState={drawerState}
            setDrawerState={setDrawerState}
            controls={controls}
            scrollClass="flex-1 flex flex-col overflow-hidden"
        >
            {/* Annotation strip — fixed height */}
            <div className="flex-shrink-0 h-10 flex items-center justify-center px-4">
                <AnimatePresence mode="wait">
                    {annotation && (
                        <motion.div
                            key={annotation}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.16 }}
                            className="px-4 py-1.5 rounded-xl border border-amber-600/50 bg-amber-900/40 text-amber-200 text-xs font-medium whitespace-nowrap max-w-full overflow-hidden text-ellipsis"
                        >
                            {annotation}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Result chips — grows as subsets are stored */}
            {storedSoFar.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-1 px-4 pb-2 overflow-x-auto">
                    <span className="text-slate-400 text-[11px] font-mono flex-shrink-0">result:</span>
                    <AnimatePresence>
                        {storedSoFar.map((s, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="flex-shrink-0 px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 text-[10px] font-mono"
                            >
                                [{s.join(',')}]
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Scrollable tree canvas */}
            <div ref={scrollRef} className="flex-1 overflow-auto">
                <div
                    style={{
                        transform: `scale(${canvasZoom})`,
                        transformOrigin: 'top center',
                        width: canvasW,
                        height: canvasH,
                        position: 'relative',
                    }}
                >
                    {/* SVG layer: edges + element labels */}
                    <svg
                        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
                        width={canvasW}
                        height={canvasH}
                    >
                        {/* Edge lines */}
                        <AnimatePresence>
                            {edgeList.map(e => (
                                <motion.line
                                    key={e.key}
                                    x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                                    stroke={e.done ? '#10b981' : '#6366f1'}
                                    strokeWidth={1.8}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Edge element labels */}
                        <AnimatePresence>
                            {edgeList.map(e => (
                                <motion.text
                                    key={`lbl-${e.key}`}
                                    x={e.mx + 5}
                                    y={e.my + 4}
                                    fill={e.done ? '#6ee7b7' : '#a5b4fc'}
                                    fontSize="10"
                                    fontFamily="monospace"
                                    fontWeight="600"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: 0.15 }}
                                >
                                    +{e.element}
                                </motion.text>
                            ))}
                        </AnimatePresence>
                    </svg>

                    {/* HTML layer: animated pill nodes */}
                    <AnimatePresence>
                        {[...visibleIds].map(id => {
                            const node     = nodeMap[id];
                            const state    = nodeStates[id] ?? 'active';
                            const isActive = id === activeId;
                            const c        = COLORS[state] ?? COLORS.default;
                            const label    = `[${node.subset.join(',')}]`;
                            const fSize    = node.subset.length > 3 ? 9 : 11;

                            return (
                                <motion.div
                                    key={id}
                                    style={{
                                        position: 'absolute',
                                        left: node.x - NODE_W / 2,
                                        top:  node.y - NODE_H / 2,
                                        width:  NODE_W,
                                        height: NODE_H,
                                        borderRadius: NODE_H / 2,
                                        backgroundColor: c.fill,
                                        border: `${isActive ? 2.5 : 1.5}px solid ${c.stroke}`,
                                        boxShadow: isActive ? `0 0 14px ${c.stroke}80` : undefined,
                                        color: c.text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: `${fSize}px`,
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        zIndex: isActive ? 2 : 1,
                                        transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s',
                                    }}
                                    initial={{ opacity: 0, scale: 0.4 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.3 }}
                                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                                >
                                    {label}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </SyncedVisualizerShell>
    );
};

export default SubsetsVisualizer;
