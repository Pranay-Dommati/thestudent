/**
 * LinkedListCycleVisualizer
 *
 * Step-by-step visualizer for Floyd's Tortoise & Hare algorithm.
 * Reuses the shared visualizer shell, playback state machine, and pointer badges.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import { AnnotationCard, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

const NODE_D = 44;
const ARROW_W = 28;

// 1-indexed lines matching PROBLEM_CODE_TEMPLATES['linked-list-cycle']
const LINE = {
    FN_DEF:      1,
    INIT_SLOW:   3,
    INIT_FAST:   4,
    WHILE_CHECK: 7,
    ADV_SLOW:    8,
    ADV_FAST:    9,
    CHECK_MEET:  12,
    RETURN_TRUE: 13,
    RETURN_FALSE: 16,
    LL_COMMENT:  18,
    POS_COMMENT: 19,
};

const DELAY = {
    build_list:   1400,
    pos_comment:  1200,
    head_param:   1200,
    init_slow:    1200,
    init_fast:    1200,
    while_check:  1400,
    adv_slow:     1700,
    adv_fast:     1900,
    check_meet:   1500,
    cycle_found:  2300,
    no_cycle:     2300,
};

const getDelay = makeGetDelay(DELAY, 1500);

const DEFAULT_VALS = [1, 2, 3, 4, 5];
const DEFAULT_POS = 2;

const parseInput = (str) => {
    try {
        const s = String(str ?? '').trim();
        const commaIdx = s.lastIndexOf(',');
        if (commaIdx < 0) return [DEFAULT_VALS, DEFAULT_POS];

        const arrPart = s.slice(0, commaIdx).trim();
        const posPart = s.slice(commaIdx + 1).trim();
        const parsed = JSON.parse(arrPart);
        const pos = parseInt(posPart, 10);

        if (!Array.isArray(parsed) || parsed.length === 0 || isNaN(pos)) return [DEFAULT_VALS, DEFAULT_POS];
        if (pos < -1 || pos >= parsed.length) return [DEFAULT_VALS, DEFAULT_POS];
        return [parsed.map(Number), pos];
    } catch {
        return [DEFAULT_VALS, DEFAULT_POS];
    }
};

const buildNext = (n, pos) => Array.from({ length: n }, (_, i) => {
    if (i < n - 1) return i + 1;
    return pos >= 0 ? pos : null;
});

function simulate(vals, pos) {
    const events = [];
    const n = vals.length;
    const allNodes = vals.map((v, i) => ({ val: v, idx: i }));
    const next = buildNext(n, pos);

    const push = (type, extra, codeLine, annotation) => {
        events.push({
            type,
            allNodes,
            next,
            cyclePos: pos,
            ...extra,
            codeLine,
            annotation,
        });
    };

    const cycleLabel = pos >= 0 ? `tail.next -> node ${pos} (val = ${vals[pos]})` : 'tail.next -> null';

    push(
        'build_list',
        { slowIdx: null, fastIdx: null, hasCycle: null },
        LINE.LL_COMMENT,
        `#LL = [${vals.join(' -> ')}], pos = ${pos}  ->  ${cycleLabel}`
    );

    push(
        'pos_comment',
        { slowIdx: null, fastIdx: null, hasCycle: null },
        LINE.POS_COMMENT,
        `# pos = ${pos}  ->  cycle starts at index ${pos}`
    );

    push(
        'head_param',
        { slowIdx: null, fastIdx: null, hasCycle: null },
        LINE.FN_DEF,
        'head points to node 0 (first element)'
    );

    let slowIdx = 0;
    let fastIdx = 0;

    push('init_slow', { slowIdx, fastIdx: null, hasCycle: null }, LINE.INIT_SLOW, 'slow = head');
    push('init_fast', { slowIdx, fastIdx, hasCycle: null }, LINE.INIT_FAST, 'fast = head');

    const canEnterLoop = (idx) => idx !== null && next[idx] !== null;
    const maxIters = n * 2 + 4;

    for (let iter = 1; iter <= maxIters; iter++) {
        const whileTrue = canEnterLoop(fastIdx);
        push(
            'while_check',
            { slowIdx, fastIdx, hasCycle: null, iter, whileTrue },
            LINE.WHILE_CHECK,
            whileTrue
                ? `while fast and fast.next -> True  (iteration ${iter})`
                : 'while fast and fast.next -> False'
        );

        if (!whileTrue) {
            push('no_cycle', { slowIdx, fastIdx, hasCycle: false }, LINE.RETURN_FALSE, 'return False  ->  no cycle');
            return { events };
        }

        slowIdx = next[slowIdx];
        push(
            'adv_slow',
            { slowIdx, fastIdx, hasCycle: null, iter },
            LINE.ADV_SLOW,
            `slow = slow.next  ->  slow at node ${slowIdx} (val = ${vals[slowIdx]})`
        );

        const fromFastIdx = fastIdx;
        const midFastIdx = next[fromFastIdx];
        const secondFastIdx = midFastIdx !== null ? next[midFastIdx] : null;
        fastIdx = secondFastIdx;

        const fastText = fastIdx === null
            ? 'fast = fast.next.next  ->  fast at null'
            : `fast = fast.next.next  ->  fast at node ${fastIdx} (val = ${vals[fastIdx]})`;
        push(
            'adv_fast',
            {
                slowIdx,
                fastIdx,
                fastFromIdx: fromFastIdx,
                fastMidIdx: midFastIdx,
                hasCycle: null,
                iter,
            },
            LINE.ADV_FAST,
            fastText
        );

        const met = slowIdx === fastIdx;
        push(
            'check_meet',
            { slowIdx, fastIdx, hasCycle: met, iter },
            LINE.CHECK_MEET,
            met
                ? `if slow == fast -> True  (met at node ${slowIdx})`
                : 'if slow == fast -> False'
        );

        if (met) {
            push('cycle_found', { slowIdx, fastIdx, hasCycle: true }, LINE.RETURN_TRUE, 'return True  ->  cycle detected');
            return { events };
        }
    }

    push('no_cycle', { slowIdx, fastIdx, hasCycle: false }, LINE.RETURN_FALSE, 'return False  ->  no cycle');
    return { events };
}

const Arrow = ({ color = '#475569', label = null }) => (
    <div className="flex items-center flex-shrink-0">
        <svg width={ARROW_W} height={NODE_D} viewBox={`0 0 ${ARROW_W} ${NODE_D}`}>
            <line x1="2" y1={NODE_D / 2} x2={ARROW_W - 8} y2={NODE_D / 2} stroke={color} strokeWidth="1.5" />
            <polyline
                points={`${ARROW_W - 12},${NODE_D / 2 - 4} ${ARROW_W - 6},${NODE_D / 2} ${ARROW_W - 12},${NODE_D / 2 + 4}`}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
            />
        </svg>
        {label ? <span className="text-[10px] font-mono text-cyan-300 ml-1">{label}</span> : null}
    </div>
);

const getNodeStyle = (idx, ev) => {
    if (!ev) return 'bg-slate-700 border-slate-500 text-white';

    const bothHere = idx === ev.slowIdx && idx === ev.fastIdx;
    const slowHere = idx === ev.slowIdx;
    const fastHere = idx === ev.fastIdx;
    const isCycleEntry = ev.cyclePos >= 0 && idx === ev.cyclePos;
    const isCycleNode = ev.cyclePos >= 0 && idx >= ev.cyclePos;
    const isFinal = ev.type === 'cycle_found' || ev.type === 'no_cycle';

    if (ev.type === 'pos_comment' && isCycleEntry) {
        return 'bg-amber-500/20 border-amber-300 text-amber-100 ring-2 ring-amber-400/40';
    }

    if (ev.type === 'head_param' && idx === 0) {
        return 'bg-amber-500/20 border-amber-300 text-amber-100 ring-2 ring-amber-400/40';
    }

    if (ev.type === 'cycle_found' && isCycleNode) {
        return 'bg-violet-500/30 border-violet-300 text-violet-100 ring-2 ring-violet-400/60';
    }

    if (bothHere) return 'bg-amber-500/20 border-amber-400 text-amber-100 ring-2 ring-amber-400/40';
    if (slowHere) return 'bg-amber-500/20 border-amber-400 text-amber-100';
    if (fastHere) return 'bg-teal-500/20 border-teal-400 text-teal-100';
    if (isCycleEntry) {
        return isFinal
            ? 'bg-cyan-500/20 border-cyan-300 text-cyan-100'
            : 'bg-cyan-500/15 border-cyan-500/70 text-cyan-100';
    }
    return 'bg-slate-700 border-slate-500 text-white';
};

const buildFastBadgePath = (ev, nodeCount) => {
    if (!ev || ev.type !== 'adv_fast' || ev.cyclePos < 0) return null;
    if (ev.fastFromIdx === null || ev.fastMidIdx === null || ev.fastIdx === null) return null;

    const stride = NODE_D + ARROW_W;
    const badge = 20;
    const yBase = 0;
    // Drop below the pointer lane so wrap traversal is clear, without overshooting.
    const yDown = NODE_D + 80;
    const xAt = (idx) => idx * stride + NODE_D / 2 - badge / 2;
    const tailOutBadgeX = (nodeCount - 1) * stride + NODE_D - 2 - badge / 2;

    const from = ev.fastFromIdx;
    const mid = ev.fastMidIdx;
    const to = ev.fastIdx;
    const last = nodeCount - 1;

    const pts = [[xAt(from), yBase]];

    const hop1Wraps = from === last && mid === ev.cyclePos;
    const hop2Wraps = mid === last && to === ev.cyclePos;

    if (!hop1Wraps && !hop2Wraps) return null;

    if (hop1Wraps) {
        pts[0] = [tailOutBadgeX, yBase];
        pts.push([tailOutBadgeX, yDown]);
        pts.push([xAt(mid), yDown]);
        pts.push([xAt(mid), yBase]);
        if (to !== mid) pts.push([xAt(to), yBase]);
    } else {
        if (mid !== from) pts.push([xAt(mid), yBase]);
        const wrapX = hop2Wraps ? tailOutBadgeX : xAt(mid);
        pts.push([wrapX, yDown]);
        pts.push([xAt(to), yDown]);
        pts.push([xAt(to), yBase]);
    }

    const endsOnSlow = ev.slowIdx !== null && ev.fastIdx === ev.slowIdx;
    if (endsOnSlow && pts.length > 0) {
        // Land F slightly to the right when S and F meet so both badges stay readable.
        const finalIdx = pts.length - 1;
        pts[finalIdx] = [pts[finalIdx][0] + 11, pts[finalIdx][1]];
        if (pts.length > 1) {
            const preIdx = pts.length - 2;
            pts[preIdx] = [pts[preIdx][0] + 6, pts[preIdx][1]];
        }
    }

    const times = pts.map((_, i) => (pts.length === 1 ? 1 : i / (pts.length - 1)));
    return {
        x: pts.map(([x]) => x),
        y: pts.map(([, y]) => y),
        times,
        endsOnSlow,
    };
};

const LinkedListVisual = ({ ev }) => {
    if (!ev) return null;

    const { allNodes, cyclePos } = ev;
    const nodeCount = allNodes.length;
    const stride = NODE_D + ARROW_W;
    const hasCycle = cyclePos >= 0;
    const pointerRowW = nodeCount * NODE_D + Math.max(0, nodeCount - 1) * ARROW_W;
    const chainW = hasCycle
        ? nodeCount * NODE_D + Math.max(0, nodeCount - 1) * ARROW_W
        : nodeCount * NODE_D + nodeCount * ARROW_W;
    const fastBadgePath = buildFastBadgePath(ev, nodeCount);

    const cycleEdge = (() => {
        if (!hasCycle || nodeCount === 0) return null;
        const tailOutX = (nodeCount - 1) * stride + NODE_D - 2;
        const targetX = cyclePos * stride + NODE_D / 2;
        const yMid = NODE_D / 2;
        const rightX = tailOutX + 16;
        const yDown = NODE_D + 30;
        const endY = NODE_D - 1;
        const path = `M ${tailOutX} ${yMid} L ${rightX} ${yMid} L ${rightX} ${yDown} L ${targetX} ${yDown} L ${targetX} ${endY}`;
        return { path, tailOutX, rightX, targetX, yMid, yDown, endY };
    })();


    return (
        <div className="flex flex-col items-start gap-2">
            <div style={{ paddingLeft: 22, marginBottom: 4 }}>
                <div style={{ position: 'relative', width: pointerRowW, height: 24 }}>
                    <PointerBadgeRow
                        cellW={NODE_D}
                        cellGap={ARROW_W}
                        count={allNodes.length}
                        iRel={ev.slowIdx}
                        jRel={ev.fastIdx}
                        hideJ={Boolean(fastBadgePath)}
                        iClass="bg-amber-500"
                        jClass="bg-teal-500"
                        iLabel="S"
                        jLabel="F"
                    />

                    {fastBadgePath && (
                        <motion.div
                            className="rounded-full text-white flex items-center justify-center font-bold bg-teal-500"
                            style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                width: fastBadgePath.endsOnSlow ? 16 : 20,
                                height: fastBadgePath.endsOnSlow ? 16 : 20,
                                fontSize: fastBadgePath.endsOnSlow ? 9 : 10,
                            }}
                            initial={{ x: fastBadgePath.x[0], y: fastBadgePath.y[0], opacity: 1 }}
                            animate={{ x: fastBadgePath.x, y: fastBadgePath.y, opacity: 1 }}
                            transition={{ duration: 1.15, times: fastBadgePath.times, ease: 'easeInOut' }}
                        >
                            F
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="flex items-center rounded-xl border-2 border-slate-600 bg-slate-800/60 px-5 py-3.5">
                <div className="relative flex items-center" style={{ width: chainW }}>
                    {cycleEdge && (
                        <svg
                            className="absolute left-0 top-0 pointer-events-none"
                            width={chainW}
                            height={NODE_D + 48}
                            style={{ overflow: 'visible' }}
                        >
                            <motion.path
                                d={cycleEdge.path}
                                stroke="#06b6d4"
                                strokeWidth="1.8"
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0.35 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            />
                            <motion.polyline
                                points={`${cycleEdge.targetX - 4},${cycleEdge.endY + 4} ${cycleEdge.targetX},${cycleEdge.endY} ${cycleEdge.targetX + 4},${cycleEdge.endY + 4}`}
                                fill="none"
                                stroke={ev.type === 'pos_comment' ? '#22d3ee' : '#06b6d4'}
                                strokeWidth={ev.type === 'pos_comment' ? '2.4' : '1.8'}
                                animate={ev.type === 'pos_comment' ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                                transition={ev.type === 'pos_comment'
                                    ? { repeat: Infinity, duration: 0.65, ease: 'easeInOut' }
                                    : { duration: 0.2 }}
                            />
                        </svg>
                    )}

                    {allNodes.map((node, i) => {
                    const isLast = i === nodeCount - 1;
                    const tailArrowColor = '#334155';
                    const tailLabel = 'null';
                    const fastNextIdx = ev.fastIdx !== null ? ev.next[ev.fastIdx] : null;
                    const blinkFastPair = ev.type === 'while_check' && (
                        i === ev.fastIdx || (fastNextIdx !== null && i === fastNextIdx)
                    );
                    const blinkMeetPair = ev.type === 'check_meet' && (
                        i === ev.slowIdx || i === ev.fastIdx
                    );
                    const blinkPosComment = ev.type === 'pos_comment' && i === ev.cyclePos;
                    const blinkHeadParam = ev.type === 'head_param' && i === 0;
                    const highlightCycleAtReturn = ev.type === 'cycle_found' && ev.cyclePos >= 0 && i >= ev.cyclePos;
                    const animateNode = highlightCycleAtReturn
                        ? { scale: [1, 1.06, 1], opacity: 1 }
                        : (blinkFastPair || blinkMeetPair)
                            ? { scale: 1, opacity: [1, 0.2, 1] }
                            : blinkHeadParam
                                ? { scale: 1, opacity: [1, 0.2, 1] }
                            : blinkPosComment
                                ? {
                                    scale: 1,
                                    boxShadow: [
                                        '0 0 0 0 rgba(251, 191, 36, 0.0)',
                                        '0 0 0 4px rgba(251, 191, 36, 0.5)',
                                        '0 0 0 0 rgba(251, 191, 36, 0.0)',
                                    ],
                                }
                            : { scale: 1, opacity: 1 };
                    const transitionNode = highlightCycleAtReturn
                        ? { duration: 0.7, ease: 'easeInOut' }
                        : (blinkFastPair || blinkMeetPair)
                        ? {
                            scale: { type: 'spring', stiffness: 260, damping: 20 },
                            opacity: { repeat: Infinity, duration: 0.65, ease: 'easeInOut' },
                        }
                        : blinkHeadParam
                            ? {
                                opacity: { repeat: Infinity, duration: 0.65, ease: 'easeInOut' },
                            }
                        : blinkPosComment
                            ? {
                                boxShadow: { repeat: Infinity, duration: 0.85, ease: 'easeInOut' },
                            }
                        : { type: 'spring', stiffness: 260, damping: 20 };

                    return (
                        <React.Fragment key={i}>
                            <motion.div
                                animate={animateNode}
                                transition={transitionNode}
                                className={`flex-shrink-0 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${getNodeStyle(i, ev)}`}
                                style={{ width: NODE_D, height: NODE_D }}
                            >
                                {node.val}
                            </motion.div>

                            {!isLast && <Arrow color="#475569" />}
                            {isLast && !hasCycle && <Arrow color={tailArrowColor} label={tailLabel} />}
                        </React.Fragment>
                    );
                })}
                </div>
            </div>

            <div className="flex items-center mt-5" style={{ gap: 0, paddingLeft: 22 }}>
                {allNodes.map((_, i) => (
                    <React.Fragment key={i}>
                        <div style={{ width: NODE_D }} className="flex justify-center text-[9px] font-mono select-none text-slate-500">
                            {i}
                        </div>
                        {i < allNodes.length - 1 && <div style={{ width: ARROW_W }} />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const ResultBox = ({ ev }) => {
    const show = ev?.type === 'cycle_found' || ev?.type === 'no_cycle';

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className={`mt-4 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm ${
                        ev.type === 'cycle_found'
                            ? 'border-violet-400/70 bg-violet-900/20 text-violet-100'
                            : 'border-slate-500/70 bg-slate-800/40 text-slate-200'
                    }`}
                >
                    {ev.type === 'cycle_found' ? 'Cycle detected: return True' : 'No cycle: return False'}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const LinkedListCycleVisualizer = ({
    customArray = '[1,2,3,4,5],2',
    code = '',
    onProgress,
    seekRef,
    drawerState = 'peek',
    setDrawerState,
}) => {
    const [inputVals, pos] = useMemo(() => parseInput(customArray), [customArray]);
    const { events } = useMemo(() => simulate(inputVals, pos), [inputVals, pos]);

    const {
        eventIdx,
        playing,
        finished,
        speed,
        setSpeed,
        handlePlay,
        handlePause,
        handleReset,
        handleBack,
        handleNext,
        currentEv,
        activeLine,
        executedLines,
    } = useVisualizerPlayback({ events, getDelay, inputArr: inputVals, seekRef, onProgress });

    const controls = (
        <VisualizerControls
            speed={speed}
            setSpeed={setSpeed}
            eventIdx={eventIdx}
            playing={playing}
            finished={finished}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onBack={handleBack}
            onNext={handleNext}
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
            <div className="scale-90 md:scale-100 origin-center flex flex-col items-center">
                <LinkedListVisual ev={currentEv} />
                <ResultBox ev={currentEv} />
            </div>
            <AnnotationCard text={currentEv?.annotation} />
        </SyncedVisualizerShell>
    );
};

export default LinkedListCycleVisualizer;
