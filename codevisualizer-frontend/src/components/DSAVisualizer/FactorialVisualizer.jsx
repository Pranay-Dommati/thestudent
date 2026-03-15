/**
 * FactorialVisualizer — animated linear recursive call-chain for factorial(n).
 *
 * Shows each factorial(k) call as a circle node stacked vertically.
 * Descending phase: nodes appear top-to-bottom as calls are made.
 * Ascending phase: nodes light up violet showing return values; a
 *   multiplication label "k × child" floats beside the ascending edge.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizerPlayback, makeGetDelay, TreeAnnotationStrip } from './visualizerShared';
import { useTreeCanvas } from './useTreeCanvas';
import TreeCanvas from './TreeCanvas';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import VisualizerControls from './VisualizerControls';

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_R   = 26;
const LEVEL_H  = 90;
const TOP_PAD  = 44;
const CANVAS_W = 280;
const CX       = CANVAS_W / 2;

// ── Build call-chain events ───────────────────────────────────────────────────
const simulateFactorial = (n) => {
    let counter = 0;
    const nodeMap = {};

    // Build the linear chain, depth-first (top = n, bottom = 1/0)
    const build = (val, depth, parentId) => {
        const id   = `fact${counter++}`;
        const node = {
            id, n: val, depth, parentId,
            isBase:  val <= 1,
            result:  null,
            childId: null,
            x: CX,
            y: depth * LEVEL_H + TOP_PAD + NODE_R,
        };
        nodeMap[id] = node;
        if (val > 1) {
            const child  = build(val - 1, depth + 1, id);
            node.childId = child.id;
        }
        return node;
    };

    const root     = build(n, 0, null);
    const allNodes = Object.values(nodeMap);
    const canvasH  = Math.max(0, n - 1) * LEVEL_H + TOP_PAD + NODE_R * 2 + 56;

    // Generate events in DFS order — mirrors Python execution
    const events = [];
    events.push({ type: 'n_assign',   codeLine: 9,  annotation: `n = ${n}  — assign input` });
    events.push({ type: 'print_call', codeLine: 10, annotation: `print(factorial(${n}))  — start computation` });

    const dfs = (node) => {
        events.push({
            type: 'call', nodeId: node.id, codeLine: 1, scrollY: node.y,
            annotation: `factorial(${node.n})  — enter function`,
        });
        events.push({
            type: 'check_base', nodeId: node.id, codeLine: 4, scrollY: node.y,
            annotation: `if n == 0 or n == 1  →  ${node.isBase
                ? 'True ✓ — base case!'
                : 'False — recurse deeper'}`,
        });
        if (node.isBase) {
            node.result = 1;
            events.push({
                type: 'return_base', nodeId: node.id, codeLine: 5,
                scrollY: node.y, result: 1,
                annotation: `return 1  — base case ✓`,
            });
            return 1;
        }
        events.push({
            type: 'recurse', nodeId: node.id, codeLine: 7, scrollY: node.y,
            annotation: `call factorial(${node.n - 1})  — go one level deeper`,
        });
        const cr  = dfs(nodeMap[node.childId]);
        const res = node.n * cr;
        node.result = res;
        events.push({
            type: 'return_val', nodeId: node.id, codeLine: 7,
            scrollY: Math.max(0, node.y - 40),
            result: res, childResult: cr, parentN: node.n,
            annotation: `${node.n} × ${cr} = ${res}  — return up`,
        });
        return res;
    };

    const finalResult = dfs(root);
    events.push({
        type: 'done', codeLine: 10, result: finalResult,
        annotation: `factorial(${n}) = ${finalResult}  ✓  complete!`,
    });

    return { events, nodeMap, allNodes, canvasH };
};

// ── Delay table ───────────────────────────────────────────────────────────────
const DELAY = {
    n_assign: 700,  print_call: 850,
    call: 750,      check_base: 900,
    return_base: 1000, recurse: 700,
    return_val: 1200,  done: 1400,
};
const getDelay = makeGetDelay(DELAY, 850);

// ── Colour palette for circle nodes ──────────────────────────────────────────
const COLORS = {
    active:    { fill: '#0369a1', stroke: '#7dd3fc', text: '#e0f2fe' },  // sky
    checking:  { fill: '#78350f', stroke: '#fbbf24', text: '#fef3c7' },  // amber dim
    recursing: { fill: '#1e3a5f', stroke: '#6366f1', text: '#c7d2fe' },  // indigo
    done_base: { fill: '#d97706', stroke: '#fde68a', text: '#fff'    },  // amber bright
    done:      { fill: '#6d28d9', stroke: '#c4b5fd', text: '#fff'    },  // violet
    default:   { fill: '#1e293b', stroke: '#475569', text: '#94a3b8' },
};
const nodeColors = (state, isBase) =>
    state === 'done' ? (isBase ? COLORS.done_base : COLORS.done) : (COLORS[state] ?? COLORS.default);

// ── Component ─────────────────────────────────────────────────────────────────
const FactorialVisualizer = ({
    customArray = '5',
    code = '',
    onProgress,
    seekRef,
    drawerState,
    setDrawerState,
}) => {
    // Parse n and clamp to [1, 8]
    const inputN = useMemo(() => {
        const v = parseInt(String(customArray).trim(), 10);
        return isNaN(v) || v < 1 ? 5 : Math.min(v, 8);
    }, [customArray]);

    // Stable reference array for reset detection
    const inputKey = useMemo(() => [inputN], [inputN]);

    const { events, nodeMap, allNodes, canvasH } = useMemo(
        () => simulateFactorial(inputN),
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

    // ── Accumulate visible nodes + state from processed events ───────────────
    const { visibleIds, nodeStates, returnVals, edgeStates } = useMemo(() => {
        const visible = new Set();
        const states  = {};
        const returns = {};
        const edges   = {};

        events.slice(0, eventIdx + 1).forEach(ev => {
            const id   = ev.nodeId;
            if (!id) return;
            const node = nodeMap[id];
            if (ev.type === 'call') {
                visible.add(id);
                states[id] = 'active';
                if (node?.parentId) edges[`${node.parentId}->${id}`] = 'active';
            }
            if (ev.type === 'check_base') states[id] = 'checking';
            if (ev.type === 'recurse')    states[id] = 'recursing';
            if (ev.type === 'return_base' || ev.type === 'return_val') {
                states[id]  = 'done';
                returns[id] = ev.result;
                if (node?.parentId) edges[`${node.parentId}->${id}`] = 'done';
            }
        });

        return { visibleIds: visible, nodeStates: states, returnVals: returns, edgeStates: edges };
    }, [events, eventIdx, nodeMap]);

    // ── Edge list for SVG ─────────────────────────────────────────────────────
    const edgeList = useMemo(() => (
        allNodes
            .filter(nd => nd.childId && visibleIds.has(nd.id) && visibleIds.has(nd.childId))
            .map(nd => {
                const child = nodeMap[nd.childId];
                const key   = `${nd.id}->${nd.childId}`;
                return {
                    key,
                    x1: nd.x, y1: nd.y + NODE_R,
                    x2: child.x, y2: child.y - NODE_R,
                    done: edgeStates[key] === 'done',
                };
            })
    ), [allNodes, visibleIds, nodeMap, edgeStates]);

    // ── Inline multiply label (visible only on return_val events) ────────────
    const multiplyLabel = useMemo(() => {
        if (!currentEv || currentEv.type !== 'return_val') return null;
        const node  = nodeMap[currentEv.nodeId];
        if (!node?.childId) return null;
        const child = nodeMap[node.childId];
        return {
            id:   currentEv.nodeId,
            x:    CX + NODE_R + 10,
            y:    (node.y + child.y) / 2 - 6,
            text: `${currentEv.parentN} × ${currentEv.childResult}`,
        };
    }, [currentEv, nodeMap]);

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
                canvasW={CANVAS_W} canvasH={canvasH} canvasZoom={canvasZoom}
                edgeList={edgeList}
                strokeWidth={2}
                centered
                svgExtras={
                    <AnimatePresence>
                        {multiplyLabel && (
                            <motion.text
                                key={`mul-${multiplyLabel.id}`}
                                x={multiplyLabel.x}
                                y={multiplyLabel.y + 10}
                                fill="#6ee7b7"
                                fontSize="11"
                                fontFamily="monospace"
                                fontWeight="600"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {multiplyLabel.text}
                            </motion.text>
                        )}
                    </AnimatePresence>
                }
            >
                {/* HTML layer: animated circle nodes */}
                <AnimatePresence>
                            {[...visibleIds].map(id => {
                                const node     = nodeMap[id];
                                const state    = nodeStates[id] ?? 'active';
                                const result   = returnVals[id] ?? null;
                                const isActive = id === activeId;
                                const c        = nodeColors(state, node.isBase);
                                const D        = NODE_R * 2;
                                const resStr   = result !== null ? String(result) : null;
                                const label    = state === 'done' && resStr !== null ? resStr : `f(${node.n})`;
                                const fSize    = state === 'done' && resStr
                                    ? (resStr.length > 4 ? 8 : resStr.length > 2 ? 11 : 14)
                                    : 11;

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
                                            fontSize: `${fSize}px`,
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

export default FactorialVisualizer;
