/**
 * RemoveNthFromEndVisualizer
 *
 * Step-by-step visualizer for "Remove Nth Node From End of List".
 * Uses the slow & fast pointer technique:
 *   1. Advance fast n steps ahead of slow
 *   2. Move both until fast reaches the tail
 *   3. slow.next is the node to remove — unlink it
 *
 * Renders a linked list with:
 *   S (amber) = slow pointer
 *   F (teal)  = fast pointer
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import { AnnotationCard, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_D  = 44;   // node circle diameter (px)
const ARROW_W = 28;   // arrow connector width (px)

// ── Line numbers (1-indexed, matching PROBLEM_CODE_TEMPLATES) ─────────────────
//  1   def remove_nth_from_end(head, n):
//  2   (blank)
//  3       # create dummy node before head
//  4       dummy = ListNode(0)
//  5       dummy.next = head
//  6   (blank)
//  7       slow = dummy
//  8       fast = dummy
//  9   (blank)
// 10       # move fast pointer n steps ahead
// 11       for _ in range(n):
// 12           fast = fast.next
// 13   (blank)
// 14       # move both pointers until fast reaches last node
// 15       while fast.next:
// 16           slow = slow.next
// 17           fast = fast.next
// 18   (blank)
// 19       # remove the nth node from end
// 20       slow.next = slow.next.next
// 21   (blank)
// 22       return dummy.next
// 23   (blank)
// 24   #LL = [1 -> 2 -> 3 -> 4 -> 5]
// 25   (blank)
// 26   # class ListNode:
// 27   #     def __init__(self, val=0, next=None):
// 28   #         self.val = val
// 29   #         self.next = next
const LINE = {
    FN_DEF:       1,
    CREATE_DUMMY: 4,
    LINK_DUMMY:   5,
    INIT_SLOW:    7,
    INIT_FAST:    8,
    FOR_LOOP:     11,
    ADV_FAST:     12,
    WHILE_CHECK:  15,
    ADV_SLOW:     16,
    ADV_FAST2:    17,
    REMOVE_NODE:  20,
    RETURN_HEAD:  22,
    LL_COMMENT:   24,
};

// ── Delays per event type (ms at 1× speed) ────────────────────────────────────
const DELAY = {
    build_list:   1400,
    create_dummy: 1600,
    link_dummy:   1400,
    init_slow:    1400,
    init_fast:    1600,
    for_loop:     1200,
    adv_fast:     1800,
    while_check:  1800,
    adv_slow:     1800,
    adv_fast2:    1800,
    remove:       2400,
    return_head:  2200,
    show_result:  2400,
};

const getDelay = makeGetDelay(DELAY, 1600);

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_VALS = [1, 2, 3, 4, 5];
const DEFAULT_N    = 2;

const parseInput = (str) => {
    try {
        const s        = String(str ?? '').trim();
        const commaIdx = s.lastIndexOf(',');
        if (commaIdx < 0) return [DEFAULT_VALS, DEFAULT_N];
        const arrPart = s.slice(0, commaIdx).trim();
        const nPart   = s.slice(commaIdx + 1).trim();
        const parsed  = JSON.parse(arrPart);
        const n       = parseInt(nPart, 10);
        if (!Array.isArray(parsed) || parsed.length === 0 || isNaN(n) || n < 1 || n > parsed.length)
            return [DEFAULT_VALS, DEFAULT_N];
        return [parsed.map(Number), n];
    } catch {
        return [DEFAULT_VALS, DEFAULT_N];
    }
};

// ── Simulation ────────────────────────────────────────────────────────────────
function simulate(vals, n) {
    const events   = [];
    const numNodes = vals.length; // count of real nodes (excl. dummy)
    // allNodes[0] = dummy, allNodes[1..numNodes] = actual nodes
    const allNodes = [{ val: 0, isDummy: true }, ...vals.map(v => ({ val: v, isDummy: false }))];

    const push = (type, extra, codeLine, annotation) =>
        events.push({ type, allNodes, ...extra, codeLine, annotation });

    push('build_list',   { slowIdx: null, fastIdx: null, removeIdx: null, showDummy: false, dummyConnected: false },
        LINE.LL_COMMENT,   `#LL = [${vals.join(' -> ')}]  →  linked list: ${vals.join(' → ')} → null`);

    push('create_dummy', { slowIdx: null, fastIdx: null, removeIdx: null, showDummy: true, dummyConnected: false },
        LINE.CREATE_DUMMY, `dummy = ListNode(0)  →  sentinel node created (not yet connected to list)`);

    push('link_dummy',   { slowIdx: null, fastIdx: null, removeIdx: null, showDummy: true, dummyConnected: true },
        LINE.LINK_DUMMY,   `dummy.next = head  →  dummy → ${vals[0]} → ${vals[1] ?? 'null'} → ...`);

    push('init_slow',    { slowIdx: 0, fastIdx: null, removeIdx: null },
        LINE.INIT_SLOW,    `slow = dummy  →  slow starts at index 0 (dummy node)`);

    push('init_fast',    { slowIdx: 0, fastIdx: 0, removeIdx: null },
        LINE.INIT_FAST,    `fast = dummy  →  both slow and fast start at dummy`);

    let fastIdx = 0;
    for (let i = 0; i < n; i++) {
        push('for_loop', { slowIdx: 0, fastIdx, removeIdx: null, forStep: i + 1, forTotal: n },
            LINE.FOR_LOOP,
            `for _ in range(${n}): step ${i + 1}/${n}  →  advancing fast ${n} steps ahead of slow`);
        fastIdx++;
        push('adv_fast', { slowIdx: 0, fastIdx, removeIdx: null, forStep: i + 1, forTotal: n },
            LINE.ADV_FAST,
            `fast = fast.next  →  fast at node ${fastIdx} (val = ${allNodes[fastIdx].val})`);
    }

    let slowIdx = 0;
    while (fastIdx < numNodes) {
        push('while_check', { slowIdx, fastIdx, removeIdx: null },
            LINE.WHILE_CHECK,
            `while fast.next: fast.next = node ${fastIdx + 1} (val = ${allNodes[fastIdx + 1].val}) → True`);
        slowIdx++;
        push('adv_slow', { slowIdx, fastIdx, removeIdx: null },
            LINE.ADV_SLOW,
            `slow = slow.next  →  slow at node ${slowIdx} (val = ${allNodes[slowIdx].val})`);
        fastIdx++;
        push('adv_fast2', { slowIdx, fastIdx, removeIdx: null },
            LINE.ADV_FAST2,
            `fast = fast.next  →  fast at node ${fastIdx} (val = ${allNodes[fastIdx].val})`);
    }

    const removeIdx = slowIdx + 1; // allNodes index of the node to remove
    push('while_check', { slowIdx, fastIdx, removeIdx: null },
        LINE.WHILE_CHECK,
        `while fast.next: fast at tail → fast.next = None → False  →  slow.next is the target node`);

    push('remove', { slowIdx, fastIdx, removeIdx },
        LINE.REMOVE_NODE,
        `slow.next = slow.next.next  →  unlinking node ${removeIdx} (val = ${allNodes[removeIdx].val})`);

    push('return_head', { slowIdx: null, fastIdx: null, removeIdx },
        LINE.RETURN_HEAD,
        `return dummy.next  →  result = [${vals.filter((_, i) => i !== removeIdx - 1).join(' → ')}]`);

    push('show_result', { slowIdx: null, fastIdx: null, removeIdx },
        LINE.RETURN_HEAD,
        `✓  Result: [${vals.filter((_, i) => i !== removeIdx - 1).join(' → ')}]  —  returned from dummy.next`);

    return { events };
}

// ── Range counter strip ───────────────────────────────────────────────────────
const RANGE_CELL = 30;
const RANGE_GAP  = 6;

const RangeStrip = ({ step, total, isAdvancing }) => {
    if (!step || !total) return null;
    return (
        <div className="flex flex-col items-center gap-1.5 mb-3">
            <span className="text-[10px] font-mono text-slate-500 tracking-wide">
                for _ in range({total})
            </span>
            <div className="flex items-center" style={{ gap: RANGE_GAP }}>
                {Array.from({ length: total }, (_, i) => {
                    const num        = i + 1;
                    const isActive   = num === step && !isAdvancing;
                    const isComplete = num < step || (num === step && isAdvancing);
                    return (
                        <motion.div
                            key={num}
                            animate={{ scale: isActive ? 1.15 : 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                            className={`flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 ${
                                isActive
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-100 ring-2 ring-amber-400/40'
                                    : isComplete
                                        ? 'bg-teal-500/20 border-teal-400 text-teal-100'
                                        : 'bg-slate-700/50 border-slate-600 text-slate-400'
                            }`}
                            style={{ width: RANGE_CELL, height: RANGE_CELL }}
                        >
                            {num}
                        </motion.div>
                    );
                })}
            </div>
            <span className="text-[10px] font-mono text-slate-500">
                step {step} / {total}
            </span>
        </div>
    );
};

// ── Arrow SVG ─────────────────────────────────────────────────────────────────
const Arrow = ({ color = '#475569', fadeOut = false }) => (
    <motion.svg
        width={ARROW_W}
        height={NODE_D}
        viewBox={`0 0 ${ARROW_W} ${NODE_D}`}
        className="flex-shrink-0"
        animate={{ opacity: fadeOut ? 0 : 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
    >
        <line
            x1="2" y1={NODE_D / 2}
            x2={ARROW_W - 8} y2={NODE_D / 2}
            stroke={color} strokeWidth="1.5"
        />
        <polyline
            points={`${ARROW_W - 12},${NODE_D / 2 - 4} ${ARROW_W - 6},${NODE_D / 2} ${ARROW_W - 12},${NODE_D / 2 + 4}`}
            fill="none" stroke={color} strokeWidth="1.5"
        />
    </motion.svg>
);

// ── Node & arrow styling ──────────────────────────────────────────────────────
const getNodeStyle = (node, idx, ev) => {
    if (!ev) return 'bg-slate-700 border-slate-500 text-white';
    const { type, slowIdx, fastIdx, removeIdx } = ev;

    // Removed node highlight
    if (removeIdx !== null && idx === removeIdx) {
        if (type === 'return_head')
            return 'bg-rose-900/20 border-rose-800/40 text-rose-700/40';
        if (type === 'remove')
            return 'bg-rose-500/30 border-rose-400 text-rose-200 ring-2 ring-rose-400/60';
    }

    // Pointer highlights
    const bothHere = idx === slowIdx && idx === fastIdx;
    const slowHere = idx === slowIdx;
    const fastHere = idx === fastIdx;

    if (node.isDummy) {
        if (bothHere) return 'bg-slate-600 border-amber-400 text-slate-200 ring-2 ring-amber-400/40';
        if (slowHere) return 'bg-slate-600 border-amber-400 text-slate-200';
        if (fastHere) return 'bg-slate-600 border-teal-400 text-slate-200';
        return 'bg-slate-600 border-slate-400 text-slate-300';
    }

    if (bothHere) return 'bg-amber-500/20 border-amber-400 text-amber-100 ring-2 ring-amber-400/40';
    if (slowHere) return 'bg-amber-500/20 border-amber-400 text-amber-100';
    if (fastHere) return 'bg-teal-500/20 border-teal-400 text-teal-100';
    return 'bg-slate-700 border-slate-500 text-white';
};

const getArrowColor = (fromIdx, ev) => {
    if (!ev || ev.removeIdx === null) return '#475569';
    const { type, removeIdx, slowIdx } = ev;
    if (type !== 'remove' && type !== 'return_head') return '#475569';
    if (fromIdx === slowIdx || fromIdx === removeIdx)
        return type === 'return_head' ? '#4c0519' : '#f43f5e';
    return '#475569';
};

// ── Linked List Visual ────────────────────────────────────────────────────────
const LinkedListVisual = ({ ev }) => {
    if (!ev) return null;
    const { allNodes, slowIdx, fastIdx } = ev;
    const showDummy      = ev.showDummy      ?? true;
    const dummyConnected = ev.dummyConnected ?? true;
    const idxOffset      = showDummy ? 0 : 1;
    const isReturnHead   = ev.type === 'return_head';
    const isShowResult   = ev.type === 'show_result';

    // Filter removed node at return_head + show_result (AnimatePresence handles exit animation)
    const filterRemoved  = isReturnHead || isShowResult;
    const baseNodes      = showDummy ? allNodes : allNodes.slice(1);
    const displayEntries = baseNodes
        .map((node, di) => ({ node, allIdx: di + idxOffset }))
        .filter(({ allIdx }) => !(filterRemoved && allIdx === ev.removeIdx));

    const dummyEntries = displayEntries.filter(e => e.node.isDummy);
    const realEntries  = displayEntries.filter(e => !e.node.isDummy);
    const hasDummy     = dummyEntries.length > 0;

    return (
        <div className="flex flex-col items-start gap-1">
            {/* Pointer badge row */}
            <div style={{ paddingLeft: 14 }}>
                <PointerBadgeRow
                    cellW={NODE_D}
                    cellGap={ARROW_W}
                    count={displayEntries.length}
                    iRel={slowIdx !== null ? slowIdx - idxOffset : null}
                    jRel={fastIdx !== null ? fastIdx - idxOffset : null}
                    iClass="bg-amber-500"
                    jClass="bg-teal-500"
                    iLabel="S"
                    jLabel="F"
                />
            </div>

            {/* Node row */}
            <div className="flex items-center rounded-xl border-2 border-slate-600 bg-slate-800/60 px-3 py-2.5">
                {/* Dummy node — stays fixed, outside the sliding section */}
                {hasDummy && dummyEntries.map(({ node, allIdx }) => (
                    <motion.div
                        key={allIdx}
                        layout
                        initial={!dummyConnected ? { scale: 0.3, opacity: 0 } : false}
                        animate={!dummyConnected ? { scale: 1, opacity: 1 } : {}}
                        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                        className={`flex-shrink-0 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${getNodeStyle(node, allIdx, ev)}`}
                        style={{ width: NODE_D, height: NODE_D }}
                    >
                        0
                    </motion.div>
                ))}

                {/* Arrow from dummy + real nodes + null — all slide down at show_result */}
                <motion.div
                    className="flex items-center"
                    animate={isShowResult ? { y: 60, opacity: 0 } : { y: 0, opacity: 1 }}
                    transition={isShowResult
                        ? { duration: 0.55, ease: 'easeIn' }
                        : { duration: 0.2 }}
                >
                    {/* Arrow connecting dummy → head */}
                    {hasDummy && (
                        dummyConnected
                            ? <Arrow color={isShowResult ? '#0d9488' : '#475569'} />
                            : <div className="flex-shrink-0" style={{ width: ARROW_W }} />
                    )}

                    {/* Real nodes — AnimatePresence handles remove-step exit */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        {realEntries.map(({ node, allIdx }, di) => (
                            <motion.div
                                key={allIdx}
                                layout
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="flex items-center flex-shrink-0"
                            >
                                <motion.div
                                    className={`flex-shrink-0 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${getNodeStyle(node, allIdx, ev)}`}
                                    style={{ width: NODE_D, height: NODE_D }}
                                >
                                    {node.val}
                                </motion.div>
                                {di < realEntries.length - 1 && (
                                    <Arrow color={getArrowColor(allIdx, ev)} />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Null tail — blink at while_check false, teal at show_result */}
                    {(() => {
                        const blinkNull = ev?.type === 'while_check' &&
                            fastIdx !== null && fastIdx === (allNodes?.length ?? 0) - 1;
                        return (
                            <>
                                <Arrow color={isShowResult ? '#0d9488' : blinkNull ? '#0d9488' : '#334155'} />
                                <motion.span
                                    className="text-[11px] font-mono flex-shrink-0"
                                    animate={blinkNull
                                        ? { opacity: [1, 0.15, 1], color: ['#0d9488', '#0d9488', '#0d9488'] }
                                        : isShowResult
                                            ? { opacity: 1, color: '#0d9488' }
                                            : { opacity: 1, color: '#475569' }}
                                    transition={blinkNull
                                        ? { repeat: Infinity, duration: 0.7, ease: 'easeInOut' }
                                        : { duration: 0.3 }}
                                >
                                    null
                                </motion.span>
                            </>
                        );
                    })()}
                </motion.div>
            </div>

            {/* Label row */}
            <div className="flex items-center" style={{ gap: 0, paddingLeft: 14 }}>
                {displayEntries.map(({ node, allIdx }, displayIdx) => (
                    <React.Fragment key={allIdx}>
                        <div
                            style={{ width: NODE_D }}
                            className="flex justify-center text-[9px] font-mono select-none text-slate-500"
                        >
                            {node.isDummy ? 'dummy' : ''}
                        </div>
                        {displayIdx < displayEntries.length - 1 && <div style={{ width: ARROW_W }} />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const RemoveNthFromEndVisualizer = ({
    customArray    = '[1,2,3,4,5],2',
    code           = '',
    onProgress,
    seekRef,
    drawerState    = 'peek',
    setDrawerState,
}) => {
    const [inputVals, n] = useMemo(() => parseInput(customArray), [customArray]);

    const { events } = useMemo(() => simulate(inputVals, n), [inputVals, n]);

    const { eventIdx, playing, finished, speed, setSpeed,
            handlePlay, handlePause, handleReset, handleBack, handleNext,
            currentEv, activeLine, executedLines } =
        useVisualizerPlayback({ events, getDelay, inputArr: inputVals, seekRef, onProgress });

    const controls = (
        <VisualizerControls
            speed={speed} setSpeed={setSpeed}
            eventIdx={eventIdx} playing={playing} finished={finished}
            onPlay={handlePlay} onPause={handlePause}
            onReset={handleReset} onBack={handleBack} onNext={handleNext}
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
                {(currentEv?.type === 'for_loop' || currentEv?.type === 'adv_fast') && (
                    <RangeStrip
                        step={currentEv.forStep}
                        total={currentEv.forTotal}
                        isAdvancing={currentEv.type === 'adv_fast'}
                    />
                )}
                <LinkedListVisual ev={currentEv} />
            </div>
            <AnnotationCard text={currentEv?.annotation} />
        </SyncedVisualizerShell>
    );
};

export default RemoveNthFromEndVisualizer;
