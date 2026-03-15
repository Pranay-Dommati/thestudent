/**
 * MiddleOfLinkedListVisualizer
 *
 * Step-by-step visualizer for "Middle of the Linked List" using
 * slow/fast pointers. Reuses the shared shell, pointer row, and
 * playback state machine used by other DSA visualizers.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import { AnnotationCard, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

const NODE_D = 44;
const ARROW_W = 28;

// 1-indexed lines matching PROBLEM_CODE_TEMPLATES['middle-of-linked-list']
const LINE = {
    FN_DEF: 1,
    INIT_SLOW: 2,
    INIT_FAST: 3,
    WHILE_CHECK: 6,
    ADV_SLOW: 7,
    ADV_FAST: 8,
    RETURN_SLOW: 11,
    LL_COMMENT: 13,
};

const DELAY = {
    build_list: 1400,
    head_param: 1200,
    init_slow: 1200,
    init_fast: 1200,
    while_check: 1400,
    adv_slow: 1700,
    adv_fast: 1900,
    return_middle: 2300,
};

const getDelay = makeGetDelay(DELAY, 1500);

const DEFAULT_VALS = [1, 2, 3, 4, 5];

const parseInput = (str) => {
    try {
        const s = String(str ?? '').trim();
        const parsed = JSON.parse(s);
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_VALS;
        return parsed.map(Number).filter((n) => !Number.isNaN(n));
    } catch {
        return DEFAULT_VALS;
    }
};

const buildNext = (n) => Array.from({ length: n }, (_, i) => (i < n - 1 ? i + 1 : null));

function simulate(vals) {
    const events = [];
    const n = vals.length;
    const allNodes = vals.map((v, i) => ({ val: v, idx: i }));
    const next = buildNext(n);

    const push = (type, extra, codeLine, annotation) => {
        events.push({
            type,
            allNodes,
            next,
            ...extra,
            codeLine,
            annotation,
        });
    };

    push(
        'build_list',
        { slowIdx: null, fastIdx: null, middleIdx: null },
        LINE.LL_COMMENT,
        `# LL = [${vals.join(' -> ')}]`
    );

    push(
        'head_param',
        { slowIdx: null, fastIdx: null, middleIdx: null },
        LINE.FN_DEF,
        'head points to node 0 (first element)'
    );

    let slowIdx = 0;
    let fastIdx = 0;

    push('init_slow', { slowIdx, fastIdx: null, middleIdx: null }, LINE.INIT_SLOW, 'slow = head');
    push('init_fast', { slowIdx, fastIdx, middleIdx: null }, LINE.INIT_FAST, 'fast = head');

    const canEnterLoop = (idx) => idx !== null && next[idx] !== null;
    let iter = 1;

    while (true) {
        const whileTrue = canEnterLoop(fastIdx);
        push(
            'while_check',
            { slowIdx, fastIdx, middleIdx: null, iter, whileTrue },
            LINE.WHILE_CHECK,
            whileTrue
                ? `while fast and fast.next -> True  (iteration ${iter})`
                : 'while fast and fast.next -> False'
        );

        if (!whileTrue) break;

        slowIdx = next[slowIdx];
        push(
            'adv_slow',
            { slowIdx, fastIdx, middleIdx: null, iter },
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
            { slowIdx, fastIdx, fastFromIdx: fromFastIdx, fastMidIdx: midFastIdx, middleIdx: null, iter },
            LINE.ADV_FAST,
            fastText
        );

        iter += 1;
    }

    push(
        'return_middle',
        { slowIdx, fastIdx, middleIdx: slowIdx },
        LINE.RETURN_SLOW,
        `return slow  ->  middle node is index ${slowIdx} (val = ${vals[slowIdx]})`
    );

    return { events };
}

const Arrow = ({ color = '#475569', label = null, blinkLabel = false }) => (
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
        {label ? (
            <motion.span
                className="text-[10px] font-mono text-cyan-300 ml-1"
                animate={blinkLabel ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                transition={blinkLabel
                    ? { repeat: Infinity, duration: 0.65, ease: 'easeInOut' }
                    : { duration: 0.2 }}
            >
                {label}
            </motion.span>
        ) : null}
    </div>
);

const getNodeStyle = (idx, ev) => {
    if (!ev) return 'bg-slate-700 border-slate-500 text-white';

    const bothHere = idx === ev.slowIdx && idx === ev.fastIdx;
    const slowHere = idx === ev.slowIdx;
    const fastHere = idx === ev.fastIdx;

    if (ev.type === 'head_param' && idx === 0) {
        return 'bg-amber-500/20 border-amber-300 text-amber-100 ring-2 ring-amber-400/40';
    }

    if (ev.type === 'return_middle' && idx === ev.middleIdx) {
        return 'bg-violet-500/30 border-violet-300 text-violet-100 ring-2 ring-violet-400/60';
    }

    if (bothHere) return 'bg-amber-500/20 border-amber-400 text-amber-100 ring-2 ring-amber-400/40';
    if (slowHere) return 'bg-amber-500/20 border-amber-400 text-amber-100';
    if (fastHere) return 'bg-teal-500/20 border-teal-400 text-teal-100';
    return 'bg-slate-700 border-slate-500 text-white';
};

const LinkedListVisual = ({ ev }) => {
    if (!ev) return null;

    const { allNodes } = ev;
    const nodeCount = allNodes.length;
    const hasNullTail = true;
    const stride = NODE_D + ARROW_W;
    const pointerRowW = nodeCount * NODE_D + Math.max(0, nodeCount - 1) * ARROW_W;
    const showFastAtNull = ev.fastIdx === null
        && ev.type !== 'build_list'
        && ev.type !== 'head_param'
        && ev.type !== 'init_slow';
    const nullBadgeX = nodeCount * stride + 4;
    const fastBadge = 20;
    const xAt = (idx) => idx * stride + NODE_D / 2 - fastBadge / 2;
    const fastNullFromX = (ev.type === 'adv_fast' && ev.fastFromIdx !== undefined && ev.fastFromIdx !== null)
        ? xAt(ev.fastFromIdx)
        : nullBadgeX;

    return (
        <div className="flex flex-col items-start gap-2">
            <div style={{ paddingLeft: 22, marginBottom: 4 }}>
                <div style={{ position: 'relative', width: pointerRowW, height: 24 }}>
                    <PointerBadgeRow
                        cellW={NODE_D}
                        cellGap={ARROW_W}
                        count={allNodes.length}
                        iRel={ev.slowIdx}
                        jRel={showFastAtNull ? null : ev.fastIdx}
                        iClass="bg-amber-500"
                        jClass="bg-teal-500"
                        iLabel="S"
                        jLabel="F"
                    />

                    {showFastAtNull && (
                        <motion.div
                            className="rounded-full text-white flex items-center justify-center font-bold bg-teal-500"
                            style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                width: 20,
                                height: 20,
                                fontSize: 10,
                            }}
                            initial={{ x: fastNullFromX, opacity: 1 }}
                            animate={{ x: nullBadgeX, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                        >
                            F
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="flex items-center rounded-xl border-2 border-slate-600 bg-slate-800/60 px-5 py-3.5">
                {allNodes.map((node, i) => {
                    const isLast = i === nodeCount - 1;
                    const fastNextIdx = ev.fastIdx !== null ? ev.next[ev.fastIdx] : null;
                    const blinkNullTail = ev.type === 'while_check'
                        && ev.whileTrue === false
                        && (ev.fastIdx === nodeCount - 1 || ev.fastIdx === null);
                    const blinkFastPair = ev.type === 'while_check' && (
                        i === ev.fastIdx || (fastNextIdx !== null && i === fastNextIdx)
                    );
                    const blinkHeadParam = ev.type === 'head_param' && i === 0;
                    const pulseMiddle = ev.type === 'return_middle' && i === ev.middleIdx;

                    const animateNode = pulseMiddle
                        ? { scale: [1, 1.06, 1], opacity: 1 }
                        : blinkFastPair || blinkHeadParam
                            ? { scale: 1, opacity: [1, 0.2, 1] }
                            : { scale: 1, opacity: 1 };

                    const transitionNode = pulseMiddle
                        ? { duration: 0.7, ease: 'easeInOut' }
                        : blinkFastPair || blinkHeadParam
                            ? { opacity: { repeat: Infinity, duration: 0.65, ease: 'easeInOut' } }
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
                            {isLast && hasNullTail && <Arrow color="#334155" label="null" blinkLabel={blinkNullTail} />}
                        </React.Fragment>
                    );
                })}
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
    const show = ev?.type === 'return_middle' && ev.middleIdx !== null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="mt-4 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm border-violet-400/70 bg-violet-900/20 text-violet-100"
                >
                    Middle node: index {ev.middleIdx}, value {ev.allNodes?.[ev.middleIdx]?.val}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const MiddleOfLinkedListVisualizer = ({
    customArray = '[1,2,3,4,5]',
    code = '',
    onProgress,
    seekRef,
    drawerState = 'peek',
    setDrawerState,
}) => {
    const inputVals = useMemo(() => parseInput(customArray), [customArray]);
    const { events } = useMemo(() => simulate(inputVals), [inputVals]);

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
            <div className="flex flex-col items-center">
                <LinkedListVisual ev={currentEv} />
                <ResultBox ev={currentEv} />
            </div>
            <AnnotationCard text={currentEv?.annotation || ''} />
        </SyncedVisualizerShell>
    );
};

export default MiddleOfLinkedListVisualizer;
