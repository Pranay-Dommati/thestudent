import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';
import { AnnotationCard, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

const CELL = 42;
const GAP = 6;

const LINE = {
    FN_DEF: 1,
    STACK_INIT: 2,
    MAP_INIT: 3,
    FOR_CHAR: 5,
    IF_OPEN: 6,
    PUSH: 7,
    CHECK_MISMATCH: 9,
    RETURN_FALSE: 10,
    POP: 11,
    RETURN_FINAL: 13,
    S_ASSIGN: 16,
    PRINT: 17,
};

const OPEN = new Set(['(', '{', '[']);
const MAP = { ')': '(', '}': '{', ']': '[' };

const parseInput = (raw) => {
    const trimmed = String(raw ?? '').trim();
    const unquoted = (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ? trimmed.slice(1, -1)
        : trimmed;
    const cleaned = unquoted.replace(/\s+/g, '');
    const valid = cleaned.split('').filter((ch) => '(){}[]'.includes(ch)).join('');
    return valid || '({[()]})[]';
};

const simulate = (s) => {
    const events = [];
    const push = (type, payload) => events.push({ type, ...payload });

    let stack = [];

    push('s_assign', {
        codeLine: LINE.S_ASSIGN,
        annotation: `s = "${s}"`,
        idx: -1,
        ch: null,
        stack: [],
    });
    push('call_fn', {
        codeLine: LINE.PRINT,
        annotation: 'Calling is_valid(s)',
        idx: -1,
        ch: null,
        stack: [],
    });
    push('stack_init', {
        codeLine: LINE.STACK_INIT,
        annotation: 'stack = []',
        idx: -1,
        ch: null,
        stack: [],
    });
    push('map_init', {
        codeLine: LINE.MAP_INIT,
        annotation: "mapping = {')':'(', '}':'{', ']':'['}",
        idx: -1,
        ch: null,
        stack: [],
    });

    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        push('for_char', {
            codeLine: LINE.FOR_CHAR,
            annotation: `for char in s -> char = '${ch}' at index ${i}`,
            idx: i,
            ch,
            stack: [...stack],
        });

        const isOpen = OPEN.has(ch);
        push('if_open', {
            codeLine: LINE.IF_OPEN,
            annotation: isOpen
                ? `'${ch}' is opening bracket -> push`
                : `'${ch}' is closing bracket -> verify top`,
            idx: i,
            ch,
            stack: [...stack],
            isOpen,
        });

        if (isOpen) {
            stack.push(ch);
            push('push', {
                codeLine: LINE.PUSH,
                annotation: `stack.append('${ch}')`,
                idx: i,
                ch,
                stack: [...stack],
            });
            continue;
        }

        const expected = MAP[ch];
        const top = stack.length ? stack[stack.length - 1] : null;
        const mismatch = !stack.length || top !== expected;

        push('check_mismatch', {
            codeLine: LINE.CHECK_MISMATCH,
            annotation: mismatch
                ? `Mismatch! expected '${expected}' on stack top, got ${top === null ? 'empty stack' : `'${top}'`}`
                : `Matched '${ch}' with '${top}'`,
            idx: i,
            ch,
            expected,
            mismatch,
            stack: [...stack],
        });

        if (mismatch) {
            push('return_false', {
                codeLine: LINE.RETURN_FALSE,
                annotation: 'return False',
                idx: i,
                ch,
                stack: [...stack],
                result: false,
            });
            push('done', {
                codeLine: LINE.PRINT,
                annotation: `is_valid("${s}") -> False`,
                idx: i,
                ch,
                stack: [...stack],
                result: false,
            });
            return { events };
        }

        const popped = stack.pop();
        push('pop', {
            codeLine: LINE.POP,
            annotation: `stack.pop() -> removed '${popped}'`,
            idx: i,
            ch,
            popped,
            stack: [...stack],
        });
    }

    const ok = stack.length === 0;
    push('return_final', {
        codeLine: LINE.RETURN_FINAL,
        annotation: `return len(stack) == 0 -> ${ok}`,
        idx: s.length - 1,
        ch: null,
        stack: [...stack],
        result: ok,
    });
    push('done', {
        codeLine: LINE.PRINT,
        annotation: `is_valid("${s}") -> ${ok}`,
        idx: s.length - 1,
        ch: null,
        stack: [...stack],
        result: ok,
    });

    return { events };
};

const DELAY = {
    s_assign: 700,
    call_fn: 700,
    stack_init: 700,
    map_init: 700,
    for_char: 850,
    if_open: 850,
    push: 900,
    check_mismatch: 900,
    pop: 900,
    return_false: 1000,
    return_final: 1000,
    done: 1200,
};
const getDelay = makeGetDelay(DELAY, 900);

const cellBg = (idx, ev) => {
    const cur = ev?.idx ?? -1;
    if (cur === idx) {
        if (ev?.type === 'return_false' || (ev?.type === 'check_mismatch' && ev?.mismatch)) {
            return 'bg-rose-500 border-rose-300 text-white shadow-[0_0_12px_rgba(244,63,94,0.45)]';
        }
        if (ev?.type === 'if_open' || ev?.type === 'push') {
            return 'bg-amber-500 border-amber-300 text-white';
        }
        return 'bg-cyan-500 border-cyan-300 text-white';
    }
    if (cur > idx) return 'bg-emerald-700/30 border-emerald-600/40 text-emerald-200';
    return 'bg-slate-700 border-slate-500 text-slate-300';
};

const ValidParenthesesVisualizer = ({
    customArray = '({[()]})[]',
    code = '',
    onProgress,
    seekRef,
    drawerState,
    setDrawerState,
}) => {
    const input = useMemo(() => parseInput(customArray), [customArray]);
    const { events } = useMemo(() => simulate(input), [input]);

    const {
        eventIdx, playing, finished, speed, setSpeed,
        handlePlay, handlePause, handleReset, handleBack, handleNext,
        currentEv, activeLine, executedLines,
    } = useVisualizerPlayback({ events, getDelay, inputArr: input, seekRef, onProgress });

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

    const stack = currentEv?.stack ?? [];
    const topIdx = stack.length - 1;

    return (
        <SyncedVisualizerShell
            code={code}
            activeLine={activeLine}
            executedLines={executedLines ?? []}
            drawerState={drawerState}
            setDrawerState={setDrawerState}
            controls={controls}
        >
            <div className="h-full flex flex-col items-center justify-center gap-6 p-4 overflow-auto">
                <AnnotationCard text={currentEv?.annotation} />

                <div className="flex flex-col items-center gap-2">
                    <PointerBadgeRow
                        cellW={CELL}
                        cellGap={GAP}
                        count={input.length}
                        iRel={Number.isInteger(currentEv?.idx) ? currentEv.idx : null}
                        iClass="bg-amber-500"
                        iLabel="i"
                        jRel={null}
                    />

                    <div className="flex items-center" style={{ gap: GAP }}>
                        {input.split('').map((ch, idx) => (
                            <motion.div
                                key={`${idx}-${ch}`}
                                className={`w-[42px] h-[42px] rounded-lg border-2 flex items-center justify-center font-bold text-lg ${cellBg(idx, currentEv)}`}
                                animate={currentEv?.idx === idx ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                                transition={currentEv?.idx === idx ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
                            >
                                {ch}
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex items-center" style={{ gap: GAP }}>
                        {input.split('').map((_, idx) => (
                            <div key={idx} className="w-[42px] text-center text-[10px] text-slate-400 font-mono">{idx}</div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-[520px] rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Stack</span>
                        {stack.length > 0 && <span className="text-xs text-amber-300 font-mono">top {'->'} '{stack[topIdx]}'</span>}
                    </div>

                    <div className="min-h-[170px] rounded-lg border border-slate-700/60 bg-slate-950/40 p-3 flex flex-col-reverse items-center gap-2">
                        {stack.length === 0 ? (
                            <div className="w-[56px] h-[56px] border-2 border-dashed border-slate-600 rounded-lg text-slate-500 flex items-center justify-center font-bold">
                                empty
                            </div>
                        ) : (
                            <AnimatePresence>
                                {stack.map((ch, idx) => (
                                    <motion.div
                                        key={`st-${idx}-${ch}`}
                                        initial={{ opacity: 0, y: 14, scale: 0.85 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -12, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                        className={`w-[56px] h-[40px] rounded-lg border-2 flex items-center justify-center text-lg font-bold ${
                                            idx === topIdx
                                                ? 'bg-indigo-500 border-indigo-300 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]'
                                                : 'bg-slate-700 border-slate-500 text-slate-200'
                                        }`}
                                    >
                                        {ch}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {typeof currentEv?.result === 'boolean' && (
                    <div className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
                        currentEv.result
                            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                            : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                    }`}>
                        Result: {String(currentEv.result)}
                    </div>
                )}
            </div>
        </SyncedVisualizerShell>
    );
};

export default ValidParenthesesVisualizer;
