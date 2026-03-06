/**
 * visualizerShared.jsx — Universal shared utilities for all DSA visualizers
 *
 * Exports:
 *  - highlightSyntax(line)         Python syntax colouring used in code panels
 *  - SyncedCodePanel               Code panel with active-line highlight + scroll
 *  - AnnotationCard                Animated amber description card below the array
 *  - BLINK_ANIM                    Framer Motion opacity keyframe for cell blink
 *  - BLINK_TRANS                   Framer Motion transition config for cell blink
 *  - parseInputArray(str, default) Parse JSON array string → number[]
 *  - useVisualizerPlayback(params) Full playback state machine as a custom hook
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Python keyword set ────────────────────────────────────────────────────────
const KW = new Set([
    'def', 'if', 'for', 'while', 'return', 'True', 'False',
    'break', 'in', 'not', 'and', 'or', 'range', 'print', 'len',
]);

/**
 * highlightSyntax — tokenises a single Python code line and wraps tokens in
 * coloured <span> elements. Handles keywords, numbers, strings, comments.
 */
export const highlightSyntax = (line) => {
    const tokens = line.split(/(\s+|[(),=\[\]#:+><!])/);
    let key = 0;
    const result = [];
    for (const tok of tokens) {
        if (!tok) continue;
        if (tok.startsWith('#')) {
            result.push(<span key={key++} className="text-slate-500 italic">{tok}</span>);
            break;
        }
        if (KW.has(tok)) {
            result.push(<span key={key++} className="text-purple-400 font-semibold">{tok}</span>);
            continue;
        }
        if (/^[0-9]+$/.test(tok)) {
            result.push(<span key={key++} className="text-amber-300">{tok}</span>);
            continue;
        }
        if (/^["']/.test(tok)) {
            result.push(<span key={key++} className="text-emerald-300">{tok}</span>);
            continue;
        }
        result.push(<span key={key++} className="text-slate-300">{tok}</span>);
    }
    return result;
};

/**
 * SyncedCodePanel — scrollable code panel with:
 *  - Active line highlighted in blue
 *  - Previously executed lines dimmed in slate
 *  - Auto-scroll to keep active line in view
 *
 * Props:
 *  code          {string}    Full code string (newline-separated)
 *  activeLine    {number}    1-based line number currently executing
 *  executedLines {number[]}  Array of 1-based line numbers already executed
 */
export const SyncedCodePanel = ({ code, activeLine, executedLines }) => {
    const lines    = code ? code.split('\n') : [];
    const lineRefs = useRef({});

    useEffect(() => {
        if (activeLine && lineRefs.current[activeLine]) {
            lineRefs.current[activeLine].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeLine]);

    return (
        <div className="flex-1 overflow-y-auto py-2 font-mono text-[13px] leading-[1.7]">
            {lines.map((line, idx) => {
                const num     = idx + 1;
                const isCur   = num === activeLine;
                const wasDone = executedLines.includes(num);
                return (
                    <div
                        key={idx}
                        ref={el => lineRefs.current[num] = el}
                        className={`flex transition-all duration-200 ${
                            isCur    ? 'bg-blue-500/20 border-l-2 border-blue-400'
                            : wasDone ? 'bg-slate-800/30 border-l-2 border-emerald-500/30'
                            : 'border-l-2 border-transparent'
                        }`}
                    >
                        <span className={`w-10 text-right pr-3 select-none shrink-0 ${
                            isCur    ? 'text-blue-400 font-bold'
                            : wasDone ? 'text-emerald-500/70'
                            : 'text-slate-600'
                        }`}>
                            {num}
                        </span>
                        <span
                            className={`pr-4 select-text cursor-text ${
                                isCur ? 'text-blue-100' : wasDone ? 'text-slate-400' : 'text-slate-500'
                            }`}
                            style={{ whiteSpace: 'pre' }}
                        >
                            {highlightSyntax(line) || <span>&nbsp;</span>}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

/**
 * AnnotationCard — animated amber card that displays the current step's
 * human-readable description. Fades + slides in on change.
 *
 * Props:
 *  text {string|null} — annotation text; renders nothing when null/empty
 */
export const AnnotationCard = ({ text }) => (
    <AnimatePresence mode="wait">
        {text && (
            <motion.div
                key={text}
                className="hidden md:flex max-w-lg text-center px-5 py-3 rounded-xl border border-amber-600/50 bg-amber-900/40 text-amber-200 text-sm font-medium leading-snug shadow-xl backdrop-blur-sm"
                initial={{ opacity: 0, y: 8  }}
                animate={{ opacity: 1, y: 0  }}
                exit={{    opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
            >
                {text}
            </motion.div>
        )}
    </AnimatePresence>
);

/**
 * BLINK_ANIM / BLINK_TRANS — shared Framer Motion values for cell blink
 * (used when two elements are being compared / swapped).
 *
 * Usage:
 *   animate={shouldBlink ? BLINK_ANIM : { opacity: 1 }}
 *   transition={shouldBlink ? BLINK_TRANS : { duration: 0 }}
 */
export const BLINK_ANIM  = { opacity: [1, 0.1, 1, 0.1, 1] };
export const BLINK_TRANS = { duration: 1.4, repeat: Infinity, ease: 'easeInOut' };

/**
 * parseInputArray — parses a JSON array string into a number array.
 * Falls back to defaultArr when the string is invalid or not an array.
 *
 * Usage:
 *   const inputArr = useMemo(() => parseInputArray(customArray, [5,1,4,2,8]), [customArray]);
 */
export const parseInputArray = (customArray, defaultArr) => {
    try {
        const p = JSON.parse(customArray.trim());
        if (Array.isArray(p)) return p.map(Number);
    } catch {}
    return defaultArr;
};

/**
 * useVisualizerPlayback — full playback state machine for step-by-step DSA
 * visualizers. Handles:
 *  - eventIdx / playing / finished / speed state
 *  - Auto-advance timer (caller supplies getDelay)
 *  - Reset when inputArr changes
 *  - handlePlay / handlePause / handleReset / handleBack / handleNext
 *  - seekRef wiring for scrubber support
 *  - onProgress callbacks
 *  - Derived currentEv, activeLine, executedLines
 *
 * @param {object}   params.events      Event array from simulate*() function
 * @param {Function} params.getDelay    (event, speed) => ms — per-event delay
 * @param {Array}    params.inputArr    Parsed number array (drives reset)
 * @param {object}   params.seekRef     Ref passed from parent for scrubber seek
 * @param {Function} params.onProgress  Callback ({ idx, total })
 *
 * @returns {{ eventIdx, playing, finished, speed, setSpeed,
 *             handlePlay, handlePause, handleReset, handleBack, handleNext,
 *             currentEv, activeLine, executedLines }}
 */
export const useVisualizerPlayback = ({ events, getDelay, inputArr, seekRef, onProgress }) => {
    const [eventIdx, setEventIdx] = useState(-1);
    const [playing,  setPlaying]  = useState(false);
    const [finished, setFinished] = useState(false);
    const [speed,    setSpeed]    = useState(1);

    // Reset when input changes
    useEffect(() => {
        setEventIdx(-1); setPlaying(false); setFinished(false);
    }, [inputArr]);

    // Auto-advance timer
    useEffect(() => {
        if (!playing || finished) return;
        const nextIdx = eventIdx + 1;
        if (nextIdx >= events.length) { setFinished(true); setPlaying(false); return; }
        const t = setTimeout(() => {
            setEventIdx(nextIdx);
            if (nextIdx >= events.length - 1) { setFinished(true); setPlaying(false); }
        }, getDelay(events[nextIdx], speed));
        return () => clearTimeout(t);
    }, [playing, eventIdx, events, finished, speed]);

    // Controls
    const handlePlay  = () => {
        if (finished) { setEventIdx(-1); setFinished(false); setTimeout(() => setPlaying(true), 80); }
        else setPlaying(true);
    };
    const handlePause = () => setPlaying(false);
    const handleReset = () => { setPlaying(false); setFinished(false); setEventIdx(-1); };
    const handleBack  = () => {
        setPlaying(false); setFinished(false);
        setEventIdx(i => Math.max(-1, i - 1));
    };
    const handleNext  = () => {
        setPlaying(false);
        const ni = eventIdx + 1;
        if (ni >= events.length) { setFinished(true); }
        else { setEventIdx(ni); if (ni >= events.length - 1) setFinished(true); }
    };

    // Seek support
    useEffect(() => {
        if (seekRef) seekRef.current = (idx) => {
            setPlaying(false);
            setFinished(idx >= events.length - 1);
            setEventIdx(Math.max(-1, Math.min(events.length - 1, idx)));
        };
    }, [seekRef, events.length]);

    // Progress report
    useEffect(() => { onProgress?.({ idx: eventIdx, total: events.length }); }, [eventIdx, events.length, onProgress]);

    // Derived state
    const currentEv     = events[eventIdx] ?? null;
    const activeLine    = currentEv?.codeLine ?? null;
    const executedLines = useMemo(() => {
        const s = new Set();
        events.slice(0, eventIdx + 1).forEach(e => { if (e.codeLine) s.add(e.codeLine); });
        return [...s];
    }, [events, eventIdx]);

    return { eventIdx, playing, finished, speed, setSpeed, handlePlay, handlePause, handleReset, handleBack, handleNext, currentEv, activeLine, executedLines };
};

/**
 * makeGetDelay — factory that creates the standard per-event delay function.
 *
 * Each visualizer defines its own DELAY map (event type → ms). This factory
 * avoids repeating the same one-liner across every file.
 *
 * @param {object} DELAY      Map of { eventType: milliseconds }
 * @param {number} defaultMs  Fallback when the event type isn't in the map
 * @returns {Function}        (event, speed) => ms
 *
 * Usage:
 *   const getDelay = makeGetDelay(DELAY, 1200);
 */
export const makeGetDelay = (DELAY, defaultMs = 1200) =>
    (ev, speed) => (DELAY[ev.type] ?? defaultMs) / speed;
