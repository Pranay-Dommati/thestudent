import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizerPlayback, makeGetDelay, TreeAnnotationStrip } from './visualizerShared';
import { useTreeCanvas } from './useTreeCanvas';
import TreeCanvas from './TreeCanvas';
import ArrayIntroPreview from './ArrayIntroPreview';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';

// ── Layout constants ──────────────────────────────────────────────────────────
const BOX_S      = 32;    // array box size
const GAP        = 4;     // gap between boxes
const PILL_P     = 6;     // padding inside node
const MIN_LEAF_W = 180;   // enough for largest array [1,2,3,4] (4*32 + 3*4 + 2*6 = 152)
const LEVEL_H    = 130;   // vertical gap between depth levels
const TOP_PAD    = 70;    // canvas top padding
const SIDE_PAD   = 60;    // horizontal padding on each side
const ARRAY_CELL_W = 44;
const ARRAY_NONE_GAP = 6;

const SUBSETS_LINE_MAP = {
    numsAssign: 19, printCall: 20, resultInit: 3, subsetInit: 4,
    call: 6, storeSubset: 9, forLoop: 11, choose: 12, recurse: 13,
    pop: 14, initialCall: 16, returnResult: 17, done: 20,
};

const SUBSETS2_LINE_MAP = {
    numsAssign: 26, printCall: 27, resultInit: 3, subsetInit: 4,
    call: 6, storeSubset: 9, forLoop: 11, choose: 14, recurse: 17,
    pop: 20, initialCall: 22, returnResult: 23, done: 27,
};

// ── Build call tree + events ──────────────────────────────────────────────────
const simulateSubsets = (nums, lineMap) => {
    let counter = 0;
    const nodeMap = {};

    const buildNode = (index, subset, depth, parentId, parentEdgeEl) => {
        const id = `bt${counter++}`;
        const node = {
            id, index,
            subset: [...subset],
            depth, parentId,
            parentEdgeEl,
            childEntries: [],
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

    const computeSubW = (node) => {
        if (node.childEntries.length === 0) {
            node._subW = MIN_LEAF_W;
            return MIN_LEAF_W;
        }
        node._subW = node.childEntries.reduce((s, { childId }) => s + computeSubW(nodeMap[childId]), 0);
        return node._subW;
    };
    computeSubW(root);

    const assignPos = (node, startX) => {
        node.x = startX + node._subW / 2 + SIDE_PAD;
        node.y = node.depth * LEVEL_H + TOP_PAD; // top aligned to y
        let cx = startX;
        for (const { childId } of node.childEntries) {
            const child = nodeMap[childId];
            assignPos(child, cx);
            cx += child._subW;
        }
    };
    assignPos(root, 0);

    const events = [];
    let currentSubsetState = [];

    events.push({ type: 'nums_assign',  codeLine: lineMap.numsAssign, annotation: `nums = [${nums.join(', ')}]  — assign input`, currentSubset: [], iVal: null });
    events.push({ type: 'print_call',   codeLine: lineMap.printCall,  annotation: `start call  — recurse through all subsets of [${nums.join(', ')}]`, currentSubset: [], iVal: null });
    events.push({ type: 'result_init',  codeLine: lineMap.resultInit, annotation: `result = []  — initialise result list`, currentSubset: [], iVal: null });
    events.push({ type: 'subset_init',  codeLine: lineMap.subsetInit, annotation: `subset = []  — initialise current subset`, currentSubset: [], iVal: null });
    events.push({ type: 'initial_call', codeLine: lineMap.initialCall, annotation: `dfs(0)  — start recursion from index 0`, currentSubset: [], iVal: 0 });

    const allStoredSubsets = [];

    const dfs = (node, enteringI = null) => {
        const subStr = `[${node.subset.join(', ')}]`;

        events.push({
            type: 'call', nodeId: node.id, codeLine: lineMap.call, scrollY: node.y,
            annotation: `dfs(${node.index})  — enter, subset = ${subStr}`,
            currentSubset: [...currentSubsetState],
            iVal: enteringI,
        });
        events.push({
            type: 'store_subset', nodeId: node.id, codeLine: lineMap.storeSubset, scrollY: node.y,
            annotation: `result.append(${subStr})  — store current subset ✓`,
            storedSubset: [...node.subset],
            currentSubset: [...currentSubsetState],
            iVal: enteringI,
        });
        allStoredSubsets.push([...node.subset]);

        if (node.childEntries.length > 0) {
            events.push({
                type: 'for_loop', nodeId: node.id, codeLine: lineMap.forLoop, scrollY: node.y,
                annotation: `for i in range(${node.index}, ${nums.length})  — try each remaining element`,
                currentSubset: [...currentSubsetState],
                iVal: node.index,
            });
        }

        for (const { childId, element } of node.childEntries) {
            const child = nodeMap[childId];
            const loopI = child.index - 1;
            
            currentSubsetState.push(element);
            events.push({
                type: 'choose', nodeId: node.id, childId, element, codeLine: lineMap.choose, scrollY: node.y,
                annotation: `subset.append(${element})  — choose ${element}`,
                iVal: loopI,
                currentSubset: [...currentSubsetState],
            });
            events.push({
                type: 'recurse', nodeId: node.id, childId, codeLine: lineMap.recurse, scrollY: node.y,
                loopI,
                childIndex: child.index,
                availableSliceStart: child.index,
                annotation: `dfs(${loopI} + 1)  — recurse deeper`,
                currentSubset: [...currentSubsetState],
                iVal: loopI,
            });
            dfs(child, loopI);
            
            currentSubsetState.pop();
            events.push({
                type: 'pop', nodeId: node.id, childId, element, codeLine: lineMap.pop, scrollY: node.y,
                annotation: `subset.pop()  — backtrack, remove ${element}`,
                currentSubset: [...currentSubsetState],
                iVal: loopI,
            });
        }

        events.push({
            type: 'return', nodeId: node.id, parentId: node.parentId, codeLine: lineMap.call, scrollY: Math.max(0, node.y - LEVEL_H),
            annotation: `return from dfs(${node.index})  — back to caller`,
            currentSubset: [...currentSubsetState],
            iVal: enteringI,
        });
    };

    dfs(root);

    events.push({
        type: 'return_result', codeLine: lineMap.returnResult,
        annotation: `return result  — returning ${allStoredSubsets.length} subsets`,
        currentSubset: [],
        iVal: null,
    });
    events.push({
        type: 'done', codeLine: lineMap.done,
        annotation: `subsets([${nums.join(', ')}]) → ${allStoredSubsets.length} subsets  ✓  complete!`,
        result: allStoredSubsets,
        currentSubset: [],
        iVal: null,
    });

    const allNodes = Object.values(nodeMap);
    const maxDepth = Math.max(...allNodes.map(n => n.depth));
    const canvasW  = root._subW + SIDE_PAD * 2;
    const canvasH  = (maxDepth + 1) * LEVEL_H + TOP_PAD + BOX_S + 64;

    return { events, nodeMap, allNodes, canvasW, canvasH };
};

// ── Delay table ─────────────────────────────────────────────────────────────
const DELAY = {
    nums_assign: 700, print_call: 700, result_init: 700, subset_init: 700, initial_call: 850,
    call: 800, store_subset: 1000, for_loop: 750,
    choose: 800, recurse: 900, pop: 850,
    return: 700, return_result: 1000, done: 1400,
};
const getDelay = makeGetDelay(DELAY, 850);

// ── Main component ───────────────────────────────────────────────────────────
const SubsetsVisualizer = ({
    customArray = '[1, 2, 3]', code = '', onProgress, seekRef, drawerState, setDrawerState,
}) => {
    const isSubsets2Template = (code || '').includes('def visualize_subsets(');
    const lineMap = isSubsets2Template ? SUBSETS2_LINE_MAP : SUBSETS_LINE_MAP;

    const inputNums = useMemo(() => {
        let arr;
        try { arr = JSON.parse(String(customArray).trim()); } catch { arr = [1, 2, 3]; }
        if (!Array.isArray(arr)) arr = [1, 2, 3];
        arr = arr.map(Number).filter(n => !isNaN(n));
        if (arr.length === 0) arr = [1, 2, 3];
        return arr.slice(0, 4);
    }, [customArray]);

    const inputKey = useMemo(() => inputNums, [inputNums]);

    const { events, nodeMap, allNodes, canvasW, canvasH } = useMemo(
        () => simulateSubsets(inputNums, lineMap),
        [inputNums, lineMap]
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

    const { visibleIds, nodeStates, edgeStates, storedSoFar } = useMemo(() => {
        const visible = new Set();
        const states  = {};
        const edges   = {};
        const stored  = [];

        events.slice(0, eventIdx + 1).forEach(ev => {
            const id = ev.nodeId;
            if (ev.type === 'call') {
                if (id) { visible.add(id); states[id] = 'active'; }
                if (id && nodeMap[id]?.parentId) edges[`${nodeMap[id].parentId}->${id}`] = 'active';
            }
            if (ev.type === 'store_subset') {
                if (id) states[id] = 'storing';
                if (ev.storedSubset) stored.push([...ev.storedSubset]);
            }
            if (ev.type === 'for_loop' || ev.type === 'choose') {
                if (id) states[id] = 'choosing';
            }
            if (ev.type === 'pop') {
                if (id) states[id] = 'popping';
            }
            if (ev.type === 'recurse') {
                if (id && ev.childId) edges[`${id}->${ev.childId}`] = 'active';
            }
            if (ev.type === 'return') {
                if (id) {
                    states[id] = 'done';
                    if (ev.parentId) edges[`${ev.parentId}->${id}`] = 'done';
                }
            }
        });

        return { visibleIds: visible, nodeStates: states, edgeStates: edges, storedSoFar: stored };
    }, [events, eventIdx, nodeMap]);

    const edgeList = useMemo(() => {
        const list = [];
        const rootNode = allNodes.find(n => n.parentId === null) ?? null;
        const rootId = rootNode?.id ?? null;
        
        const activeRecurseKey = currentEv?.type === 'recurse' && currentEv.nodeId && currentEv.childId
            ? `${currentEv.nodeId}->${currentEv.childId}` : null;

        allNodes.forEach(node => {
            node.childEntries.forEach(({ childId, element }) => {
                const child = nodeMap[childId];
                if (!child) return;

                const isRootEdge = rootId !== null && node.id === rootId;
                if (!isRootEdge && !visibleIds.has(node.id)) return;

                const key   = `${node.id}->${childId}`;
                const isActiveRecurseEdge = activeRecurseKey === key;
                if (!visibleIds.has(childId) && !isActiveRecurseEdge && !isRootEdge && edgeStates[key] !== 'done') return;

                const state = edgeStates[key] ?? null;
                const done  = state === 'done';
                const active = state === 'active' || isActiveRecurseEdge;

                if (!active && !done && !visibleIds.has(childId)) return;

                const fromX = node.x;
                const fromY = node.y + BOX_S + PILL_P * 2;

                list.push({
                    key, element, done, active, isRootEdge,
                    nextIndex: child.index,
                    x1: fromX, y1: fromY,
                    x2: child.x, y2: child.y - 8,
                    mx: (fromX + child.x) / 2, my: (fromY + child.y) / 2 - 10,
                    stroke: done ? '#10b981' : active ? '#38bdf8' : '#475569', // dimmed done/default
                    strokeWidth: active ? 2.4 : 1.8,
                });
            });
        });
        return list;
    }, [allNodes, visibleIds, nodeMap, edgeStates, currentEv]);

    const edgeAnim = useMemo(() => {
        if (!currentEv) return null;
        if (currentEv.type === 'recurse') {
            const e = edgeList.find(c => c.key === `${currentEv.nodeId}->${currentEv.childId}`);
            if (e) return { ...e, dir: 'call' };
        }
        if (currentEv.type === 'return' && currentEv.parentId) {
            const e = edgeList.find(c => c.key === `${currentEv.parentId}->${currentEv.nodeId}`);
            if (e) return { ...e, dir: 'return' };
        }
        return null;
    }, [currentEv, edgeList]);

    const arrayIPointerIdx = useMemo(() => {
        if (!currentEv) return null;
        return Number.isInteger(currentEv.iVal) ? currentEv.iVal : null;
    }, [currentEv]);

    const isStoreStep = currentEv?.type === 'store_subset';
    const highlightedResultIdx = isStoreStep ? storedSoFar.length - 1 : -1;

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
            <TreeAnnotationStrip annotation={currentEv?.annotation} />

            {/* Result chips — grows as subsets are stored */}
            {storedSoFar.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-2 px-4 pb-2 pt-1 overflow-x-auto min-h-[44px]">
                    <span className="text-slate-400 text-xs font-mono flex-shrink-0 font-bold tracking-widest text-emerald-400">result = </span>
                    <AnimatePresence>
                        {storedSoFar.map((s, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.6, x: -10 }}
                                animate={
                                    i === highlightedResultIdx
                                        ? { opacity: [1, 0.35, 1], scale: [1, 1.06, 1], x: 0 }
                                        : { opacity: 1, scale: 1, x: 0 }
                                }
                                transition={
                                    i === highlightedResultIdx
                                        ? {
                                            opacity: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' },
                                            scale: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' },
                                            x: { type: 'spring', stiffness: 300, damping: 20 },
                                        }
                                        : { type: 'spring', stiffness: 300, damping: 20 }
                                }
                                className={`flex-shrink-0 px-2 py-1 rounded border-2 text-xs font-mono shadow-lg transition-all duration-300 ${
                                    i === highlightedResultIdx
                                        ? 'bg-emerald-500 border-emerald-300 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)]'
                                        : 'bg-slate-800 border-emerald-500/40 text-emerald-400'
                                }`}
                            >
                                [{s.join(', ')}]
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <TreeCanvas
                scrollRef={scrollRef}
                canvasW={canvasW} canvasH={canvasH} canvasZoom={canvasZoom}
                edgeList={edgeList}
                centered
                svgExtras={
                    <AnimatePresence>
                        {/* Static Edges Background */}
                        {edgeList.map((e, idx) => (
                            <motion.path
                                key={`bg-edge-${e.key}`}
                                d={`M ${e.x1},${e.y1} L ${e.x2},${e.y2}`}
                                stroke={e.done ? '#064e3b' : e.active ? '#0c4a6e' : '#1e293b'}
                                strokeWidth={e.strokeWidth * 1.5}
                                fill="none"
                            />
                        ))}
                        {edgeList.map(e => (
                            <motion.text
                                key={`lbl-${e.key}`}
                                x={e.mx + 6} y={e.my + 8}
                                fill={e.done ? '#10b981' : e.active ? '#38bdf8' : '#475569'}
                                fontSize="11" fontFamily="monospace" fontWeight="bold"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                                i + 1 = {e.nextIndex}
                            </motion.text>
                        ))}
                        
                        {/* Edge Call / Return Pulses */}
                        {edgeAnim && (
                            <motion.path
                                key={`edgeanim-${eventIdx}`}
                                d={edgeAnim.dir === 'return'
                                    ? `M ${edgeAnim.x2},${edgeAnim.y2} L ${edgeAnim.x1},${edgeAnim.y1}`
                                    : `M ${edgeAnim.x1},${edgeAnim.y1} L ${edgeAnim.x2},${edgeAnim.y2}`}
                                stroke={edgeAnim.dir === 'return' ? '#34d399' : '#818cf8'}
                                strokeWidth={3}
                                strokeLinecap="round"
                                fill="none"
                                initial={{ pathLength: 0, opacity: 1 }}
                                animate={{ pathLength: 1, opacity: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                        )}
                    </AnimatePresence>
                }
            >
            <AnimatePresence>
                    {[...visibleIds].map(id => {
                        const node = nodeMap[id];
                        if (!node) return null;
                        const state    = nodeStates[id] || 'active';
                        const isActive = id === currentEv?.nodeId;
                        
                        // Width calculation
                        const isRootNode = node.parentId === null;
                        const displayArr = isRootNode ? inputNums : node.subset;
                        const bCount = Math.max(1, displayArr.length);
                        const nodeW = PILL_P * 2 + bCount * BOX_S + (bCount - 1) * GAP;
                        const nodeH = PILL_P * 2 + BOX_S;

                        return (
                            <React.Fragment key={id}>
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    left: node.x - nodeW / 2,
                                    top:  node.y,
                                    width: nodeW,
                                    height: nodeH,
                                    zIndex: isActive ? 5 : 1,
                                }}
                                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                                animate={{ opacity: 1, scale: isActive ? 1.05 : 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                                className={`
                                    flex items-center gap-[4px] px-[6px] py-[6px] rounded-xl border-2
                                    ${isActive ? 'bg-slate-800 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 
                                      state === 'done' ? 'bg-slate-800/50 border-emerald-600/30' : 
                                      'bg-slate-800 border-slate-600 shadow-lg'
                                    }
                                    transition-all duration-300
                                `}
                            >
                                {displayArr.length === 0 ? (
                                    <div className={`w-[32px] h-[32px] rounded border-2 border-dashed flex items-center justify-center font-bold text-sm
                                        ${isActive ? 'border-indigo-400 text-indigo-300' : 
                                          state === 'done' ? 'border-emerald-700/50 text-emerald-700/50' :
                                          'border-slate-500 text-slate-500'}
                                    `}>
                                        ∅
                                    </div>
                                ) : (
                                    displayArr.map((val, i) => {
                                        const isLast = i === displayArr.length - 1 && !isRootNode;
                                        
                                        // Colors mapping matches QuickSort/MergeSort styles
                                        let boxCls = 'bg-slate-700 border-slate-500 text-slate-200';
                                        
                                        if (isRootNode) {
                                            if (state === 'done') {
                                                boxCls = 'bg-slate-700/50 border-emerald-700/40 text-emerald-600/50';
                                            } else {
                                                boxCls = 'bg-slate-700 border-slate-500 text-slate-200';
                                            }
                                        } else if (state === 'done') {
                                            boxCls = 'bg-slate-700/50 border-emerald-700/40 text-emerald-600/50';
                                        } else if (isActive) {
                                            if (state === 'storing') boxCls = 'bg-emerald-500 border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]';
                                            else if (state === 'choosing' && isLast) boxCls = 'bg-amber-500 border-amber-300 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]';
                                            else if (state === 'popping' && isLast) boxCls = 'bg-rose-500 border-rose-300 text-white';
                                            else boxCls = 'bg-indigo-500 border-indigo-300 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]';
                                        }

                                        return (
                                            <motion.div
                                                key={i}
                                                className={`w-[32px] h-[32px] rounded flex items-center justify-center font-bold text-[15px] border-2 transition-colors duration-300 ${boxCls}`}
                                                layout
                                            >
                                                {val}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>
                            
                            {/* Render indices and 'i' pointer only under the root node */}
                            {isRootNode && (
                                <>
                                    <motion.div
                                        className="absolute flex items-center pointer-events-none"
                                        style={{
                                            left: node.x - nodeW / 2 + PILL_P,
                                            top: node.y + nodeH + 8,
                                            gap: GAP,
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {displayArr.map((_, i) => (
                                            <div key={i} className="flex justify-center w-[32px]">
                                                <span className="text-[11px] font-mono select-none text-slate-400">
                                                    {i}
                                                </span>
                                            </div>
                                        ))}
                                    </motion.div>

                                    <motion.div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: node.x - nodeW / 2 + PILL_P,
                                            top: node.y - 28,
                                        }}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <PointerBadgeRow
                                            cellW={BOX_S}
                                            cellGap={GAP}
                                            count={displayArr.length}
                                            iRel={arrayIPointerIdx}
                                            iClass="bg-amber-500"
                                            iLabel="i"
                                            jRel={null}
                                        />
                                    </motion.div>
                                </>
                            )}

                            {/* Render active subset array next to the root node */}
                            {isRootNode && currentEv?.currentSubset && (
                                <motion.div
                                    className="absolute flex items-center gap-[4px] px-[6px] py-[6px] rounded-xl border-2 bg-slate-800 border-slate-600 shadow-lg"
                                    style={{
                                        left: node.x + nodeW / 2 + SIDE_PAD,
                                        top: node.y,
                                        height: nodeH,
                                    }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="absolute -top-7 text-indigo-400 font-mono text-sm font-bold tracking-wider whitespace-nowrap">
                                        subset =
                                    </div>
                                    {currentEv.currentSubset.length === 0 ? (
                                        <motion.div
                                            animate={isStoreStep ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                                            transition={isStoreStep ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
                                            className={`w-[32px] h-[32px] rounded border-2 border-dashed flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                                                isStoreStep ? 'border-emerald-300 text-emerald-100 bg-emerald-500/20' : 'border-slate-500 text-slate-500'
                                            }`}
                                        >
                                            ∅
                                        </motion.div>
                                    ) : (
                                        currentEv.currentSubset.map((val, i) => (
                                            <motion.div
                                                key={`sub-${i}`}
                                                animate={isStoreStep ? { opacity: [1, 0.35, 1], scale: [1, 1.06, 1] } : { opacity: 1, scale: 1 }}
                                                transition={
                                                    isStoreStep
                                                        ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
                                                        : { duration: 0 }
                                                }
                                                className={`w-[32px] h-[32px] rounded flex items-center justify-center font-bold text-[15px] border-2 transition-colors duration-300 ${
                                                    isStoreStep
                                                        ? 'bg-emerald-500 border-emerald-300 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)]'
                                                        : 'bg-indigo-500 border-indigo-300 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                                                }`}
                                                layout
                                            >
                                                {val}
                                            </motion.div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                            </React.Fragment>
                        );
                    })}
            </AnimatePresence>
            </TreeCanvas>
        </SyncedVisualizerShell>
    );
};

export default SubsetsVisualizer;
