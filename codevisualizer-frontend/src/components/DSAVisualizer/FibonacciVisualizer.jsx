/**
 * FibonacciVisualizer — SVG-based recursive call-tree for fib(n).
 *
 * Input: single integer n (1–7) via customArray prop.
 * Shows the full DFS call tree with:
 *  – Animated circle nodes (sky=active, amber=base returned, violet=combined)
 *  – Animated SVG edges (indigo when drawn → emerald when child returns)
 *  – Per-step annotation strip
 *  – SyncedVisualizerShell for the code panel
 *  – useTreeCanvas for auto-pan/zoom on mobile
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizerPlayback, makeGetDelay, TreeAnnotationStrip } from './visualizerShared';
import { useTreeCanvas } from './useTreeCanvas';
import TreeCanvas from './TreeCanvas';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import VisualizerControls from './VisualizerControls';

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_R     = 24;   // pixel radius of each circle
const LEVEL_H    = 92;   // vertical gap between depth levels
const TOP_PAD    = 48;   // canvas top padding (room for annotation + root)
const SIDE_PAD   = 32;   // horizontal padding on each side
const MIN_LEAF_W = 62;   // minimum column width per leaf (≥ 2*NODE_R + gap)

// ── Build the full call tree + generate events in one pass ───────────────────
const simulateFib = (n) => {
    let counter = 0;
    const nodeMap = {};

    // Phase 1: build tree structure
    const buildNode = (val, depth, parentId) => {
        const id = `fib${counter++}`;
        const node = {
            id, n: val, depth, parentId,
            isBase: val <= 1,
            result: val <= 1 ? val : null,
            left: null, right: null,
            leftId: null, rightId: null,
            x: 0, y: 0, _subW: 0,
        };
        nodeMap[id] = node;
        if (val > 1) {
            node.left  = buildNode(val - 1, depth + 1, id);
            node.right = buildNode(val - 2, depth + 1, id);
            node.leftId  = node.left.id;
            node.rightId = node.right.id;
        }
        return node;
    };
    const root = buildNode(n, 0, null);

    // Phase 2: compute layout
    const computeSubW = (node) => {
        if (!node) return 0;
        if (node.isBase) { node._subW = MIN_LEAF_W; return MIN_LEAF_W; }
        node._subW = computeSubW(node.left) + computeSubW(node.right);
        return node._subW;
    };
    computeSubW(root);

    // Phase 2b: equalize only the root's two direct children so the top-level
    // split is visually symmetric, without cascading and blowing up the canvas.
    if (!root.isBase && root.left && root.right) {
        const maxW = Math.max(root.left._subW, root.right._subW);
        root.left._subW  = maxW;
        root.right._subW = maxW;
        root._subW = maxW * 2;
    }

    const assignPos = (node, cx) => {
        if (!node) return;
        node.x = cx + SIDE_PAD;
        node.y = node.depth * LEVEL_H + TOP_PAD + NODE_R;
        if (!node.isBase) {
            assignPos(node.left,  cx - node.right._subW / 2);
            assignPos(node.right, cx + node.left._subW  / 2);
        }
    };
    assignPos(root, root._subW / 2);

    // Phase 3: DFS event generation (mirrors code execution order)
    const events = [];
    events.push({ type: 'n_assign',   codeLine: 14, annotation: `n = ${n}  — assign input` });
    events.push({ type: 'print_call', codeLine: 15, annotation: `print(fibonacci(${n}))  — start computation` });

    const dfs = (node) => {
        events.push({
            type: 'call', nodeId: node.id, codeLine: 1, scrollY: node.y - NODE_R,
            annotation: `fibonacci(${node.n})  — enter function`,
        });
        events.push({
            type: 'check_base0', nodeId: node.id, codeLine: 3, scrollY: node.y,
            annotation: `if ${node.n} == 0  →  ${node.n === 0 ? 'True ✓ — take base case' : 'False — continue'}`,
        });
        if (node.n === 0) {
            events.push({
                type: 'return_zero', nodeId: node.id, codeLine: 4, scrollY: node.y, result: 0,
                annotation: `return 0  — base case`,
            });
            return 0;
        }
        events.push({
            type: 'check_base1', nodeId: node.id, codeLine: 5, scrollY: node.y,
            annotation: `if ${node.n} == 1  →  ${node.n === 1 ? 'True ✓ — take base case' : 'False — continue'}`,
        });
        if (node.n === 1) {
            events.push({
                type: 'return_one', nodeId: node.id, codeLine: 6, scrollY: node.y, result: 1,
                annotation: `return 1  — base case`,
            });
            return 1;
        }
        events.push({
            type: 'recurse_left', nodeId: node.id, codeLine: 9, scrollY: node.y,
            annotation: `call fibonacci(${node.n - 1})  — recurse left branch`,
        });
        const lr = dfs(node.left);

        events.push({
            type: 'recurse_right', nodeId: node.id, codeLine: 10, scrollY: node.y,
            annotation: `call fibonacci(${node.n - 2})  — recurse right branch`,
        });
        const rr = dfs(node.right);

        const res = lr + rr;
        node.result = res;
        events.push({
            type: 'combine', nodeId: node.id, codeLine: 12, scrollY: node.y, result: res,
            annotation: `${lr} + ${rr} = ${res}  — return combined result`,
        });
        return res;
    };

    const finalResult = dfs(root);
    events.push({
        type: 'done', codeLine: 15, result: finalResult,
        annotation: `fibonacci(${n}) = ${finalResult}  ✓  complete!`,
    });

    const allNodes = Object.values(nodeMap);
    const maxDepth = Math.max(...allNodes.map(nd => nd.depth));
    const canvasW  = root._subW + SIDE_PAD * 2;
    const canvasH  = (maxDepth + 1) * LEVEL_H + TOP_PAD + NODE_R + 48;

    return { events, nodeMap, allNodes, canvasW, canvasH };
};

// ── Delay table (ms per event type) ─────────────────────────────────────────
const DELAY = {
    n_assign: 700, print_call: 850,
    call: 750, check_base0: 850, return_zero: 900,
    check_base1: 850, return_one: 900,
    recurse_left: 650, recurse_right: 650,
    combine: 1000, done: 1400,
};
const getDelay = makeGetDelay(DELAY, 850);

// ── Node colour palette ──────────────────────────────────────────────────────
const COLORS = {
    active:    { fill: '#0369a1', stroke: '#7dd3fc', text: '#e0f2fe' },  // sky
    checking:  { fill: '#78350f', stroke: '#fbbf24', text: '#fef3c7' },  // amber dim
    recursing: { fill: '#1e3a5f', stroke: '#6366f1', text: '#c7d2fe' },  // indigo muted
    done_base: { fill: '#d97706', stroke: '#fde68a', text: '#fff' },     // amber bright
    done:      { fill: '#6d28d9', stroke: '#c4b5fd', text: '#fff' },     // violet
    default:   { fill: '#1e293b', stroke: '#475569', text: '#94a3b8' },
};

const nodeColors = (state, isBase) => {
    if (state === 'done') return isBase ? COLORS.done_base : COLORS.done;
    return COLORS[state] ?? COLORS.default;
};

// ── Main component ───────────────────────────────────────────────────────────
const FibonacciVisualizer = ({
    customArray = '5',
    code = '',
    onProgress,
    seekRef,
    drawerState,
    setDrawerState,
}) => {
    // Parse n — clamp to [1, 7] to keep the tree manageable
    const inputN = useMemo(() => {
        const v = parseInt(String(customArray).trim(), 10);
        return isNaN(v) || v < 1 ? 5 : Math.min(v, 7);
    }, [customArray]);

    // Stable inputArr ref for reset detection in useVisualizerPlayback / useTreeCanvas
    const inputKey = useMemo(() => [inputN], [inputN]);

    const { events, nodeMap, allNodes, canvasW, canvasH } = useMemo(
        () => simulateFib(inputN),
        [inputN]
    );

    const {
        eventIdx, playing, finished, speed, setSpeed,
        handlePlay, handlePause, handleReset, handleBack, handleNext,
        currentEv, activeLine, executedLines,
    } = useVisualizerPlayback({ events, getDelay, inputArr: inputKey, seekRef, onProgress });

    const { scrollRef, canvasZoom } = useTreeCanvas({
        events, allNodes, eventIdx, inputArr: inputKey,
        ignoreTypes: ['n_assign', 'print_call', 'done'],
    });

    // ── Accumulate node + edge state from all processed events ───────────────
    const { visibleIds, nodeStates, returnVals, edgeStates } = useMemo(() => {
        const visible = new Set();
        const states  = {};
        const returns = {};
        const edges   = {};  // key: `parentId->childId`

        events.slice(0, eventIdx + 1).forEach(ev => {
            const id   = ev.nodeId;
            if (!id) return;
            const node = nodeMap[id];

            if (ev.type === 'call') {
                visible.add(id);
                states[id] = 'active';
                if (node?.parentId) edges[`${node.parentId}->${id}`] = 'active';
            }
            if (ev.type === 'check_base0' || ev.type === 'check_base1') {
                states[id] = 'checking';
            }
            if (ev.type === 'recurse_left' || ev.type === 'recurse_right') {
                states[id] = 'recursing';
            }
            if (ev.type === 'return_zero' || ev.type === 'return_one' || ev.type === 'combine') {
                states[id]  = 'done';
                returns[id] = ev.result;
                if (node?.parentId) edges[`${node.parentId}->${id}`] = 'done';
            }
        });

        return { visibleIds: visible, nodeStates: states, returnVals: returns, edgeStates: edges };
    }, [events, eventIdx, nodeMap]);

    // ── Build SVG edge list from visible nodes ────────────────────────────────
    const edgeList = useMemo(() => {
        const list = [];
        allNodes.forEach(node => {
            [node.leftId, node.rightId].forEach(childId => {
                if (!childId || !visibleIds.has(childId) || !visibleIds.has(node.id)) return;
                const child = nodeMap[childId];
                const key   = `${node.id}->${childId}`;
                list.push({
                    key,
                    x1: node.x,  y1: node.y + NODE_R,
                    x2: child.x, y2: child.y - NODE_R,
                    done: edgeStates[key] === 'done',
                });
            });
        });
        return list;
    }, [allNodes, visibleIds, nodeMap, edgeStates]);

    // ── Call / Return edge pulse animation ─────────────────────────────────────
    // On 'call' → bright indigo line draws DOWN (parent → child) — forward call
    // On return events → bright emerald line draws UP (child → parent) — backtrack
    const edgeAnim = useMemo(() => {
        if (!currentEv?.nodeId) return null;
        const node = nodeMap[currentEv.nodeId];
        if (!node?.parentId) return null;
        const edge = edgeList.find(e => e.key === `${node.parentId}->${currentEv.nodeId}`);
        if (!edge) return null;
        if (currentEv.type === 'call')
            return { ...edge, dir: 'call' };
        if (['return_zero', 'return_one', 'combine'].includes(currentEv.type))
            return { ...edge, dir: 'return' };
        return null;
    }, [currentEv, nodeMap, edgeList]);

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
            <TreeAnnotationStrip annotation={annotation} />

            <TreeCanvas
                scrollRef={scrollRef}
                canvasW={canvasW} canvasH={canvasH} canvasZoom={canvasZoom}
                edgeList={edgeList}
                centered
                svgExtras={
                    edgeAnim && (
                        <motion.path
                            key={`edgeanim-${eventIdx}`}
                            d={edgeAnim.dir === 'return'
                                ? `M ${edgeAnim.x2},${edgeAnim.y2} L ${edgeAnim.x1},${edgeAnim.y1}`
                                : `M ${edgeAnim.x1},${edgeAnim.y1} L ${edgeAnim.x2},${edgeAnim.y2}`}
                            stroke={edgeAnim.dir === 'return' ? '#34d399' : '#818cf8'}
                            strokeWidth={3}
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 1 }}
                            animate={{ pathLength: 1, opacity: 0 }}
                            transition={{ duration: edgeAnim.dir === 'return' ? 0.5 : 0.3, ease: 'easeOut' }}
                        />
                    )
                }
            >
                {/* HTML layer: animated circle nodes */}
                <AnimatePresence>
                        {[...visibleIds].map(id => {
                            const node    = nodeMap[id];
                            const state   = nodeStates[id] ?? 'active';
                            const result  = returnVals[id] ?? null;
                            const isActive = id === activeId;
                            const c       = nodeColors(state, node.isBase);
                            const D       = NODE_R * 2;
                            const label   = state === 'done' ? String(result) : `f(${node.n})`;

                            return (
                                <motion.div
                                    key={id}
                                    style={{
                                        position: 'absolute',
                                        left: node.x - NODE_R,
                                        top:  node.y - NODE_R,
                                        width: D, height: D,
                                        borderRadius: '50%',
                                        backgroundColor: c.fill,
                                        border: `${isActive ? 2.5 : 1.5}px solid ${c.stroke}`,
                                        boxShadow: isActive ? `0 0 14px ${c.stroke}90` : undefined,
                                        color: c.text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: state === 'done' ? '15px' : '11px',
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        zIndex: isActive ? 2 : 1,
                                        transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s',
                                    }}
                                    initial={{ opacity: 0, scale: 0.3 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.3 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                >
                                    {label}
                                </motion.div>
                            );
                        })}
                </AnimatePresence>
            </TreeCanvas>
        </SyncedVisualizerShell>
    );
};

export default FibonacciVisualizer;
