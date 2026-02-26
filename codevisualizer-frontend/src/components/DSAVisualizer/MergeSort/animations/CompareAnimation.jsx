import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cinematic comparison animation for `if left[i] <= right[j]:`
 *
 * Phase 0 — raw code:    if left[0] <= right[0]:
 * Phase 1 — arrays pop in:  if [38][0] <= [27,43][0]:
 * Phase 2 — [i] drops DOWN below line, then slides LEFT to indexed element → highlight
 * Phase 3 — collapse to single values + TRUE / FALSE verdict
 */

/* ------------------------------------------------------------------ */
/*  Helper components — defined OUTSIDE to keep stable React identity */
/* ------------------------------------------------------------------ */

const ArrayInline = ({ arr, highlightIdx, targetIdx, color, chipRef }) => {
    const isCyan = color === 'cyan';
    return (
        <span className="inline-flex items-center font-mono">
            <span className="text-slate-500">[</span>
            {arr.map((v, idx) => (
                <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-600">,&nbsp;</span>}
                    <motion.span
                        ref={targetIdx === idx ? chipRef : null}
                        className={`inline-flex items-center justify-center px-1 min-w-[1.4rem] text-center font-bold rounded
                            ${highlightIdx === idx
                                ? (isCyan
                                    ? 'bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400 shadow-[0_0_8px_rgba(34,211,238,.4)]'
                                    : 'bg-amber-500/30 text-amber-100 ring-2 ring-amber-400 shadow-[0_0_8px_rgba(251,191,36,.4)]')
                                : 'text-slate-400'}`}
                        animate={highlightIdx === idx ? { scale: [1, 1.22, 1] } : {}}
                        transition={highlightIdx === idx ? { duration: 0.6, repeat: 2, ease: 'easeInOut' } : {}}
                    >
                        {v}
                    </motion.span>
                </React.Fragment>
            ))}
            <span className="text-slate-500">]</span>
        </span>
    );
};

const Bracket = React.forwardRef(({ label, color }, ref) => (
    <span ref={ref} className="font-mono whitespace-nowrap">
        <span className="text-slate-500">[</span>
        <span className={`font-bold ${color}`}>{label}</span>
        <span className="text-slate-500">]</span>
    </span>
));
Bracket.displayName = 'Bracket';

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const CompareAnimation = ({ leftVal, rightVal, leftArray = [], rightArray = [], i = 0, j = 0 }) => {
    const [phase, setPhase] = useState(0);
    const [ptrState, setPtrState] = useState('inline'); // 'inline' | 'drop' | 'slide'
    const [hlReady, setHlReady] = useState(false);
    const isTrue = leftVal <= rightVal;

    /* refs to measure pixel distance for the slide */
    const leftChipRef  = useRef(null);
    const rightChipRef = useRef(null);
    const leftPtrRef   = useRef(null);
    const rightPtrRef  = useRef(null);
    const [slideL, setSlideL] = useState(40);   // fallback px
    const [slideR, setSlideR] = useState(40);

    /* ---- phase timer chain ---- */
    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 1400),    // arrays pop in
            setTimeout(() => setPhase(2), 2800),    // pointer starts moving
            setTimeout(() => setHlReady(true), 4400), // element highlights
            setTimeout(() => setPhase(3), 5800),    // resolve to values
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    /* ---- pointer sub-phases inside phase 2 ---- */
    useEffect(() => {
        if (phase === 2) {
            setPtrState('drop');                         // step 1: drop down
            const id = setTimeout(() => setPtrState('slide'), 700); // step 2: slide left
            return () => clearTimeout(id);
        }
    }, [phase]);

    /* ---- measure bracket → chip distance once arrays settle (phase 1) ---- */
    useEffect(() => {
        if (phase === 1) {
            const id = setTimeout(() => {
                const measure = (chipEl, ptrEl) => {
                    if (!chipEl || !ptrEl) return 40;
                    const c = chipEl.getBoundingClientRect();
                    const p = ptrEl.getBoundingClientRect();
                    return (p.left + p.width / 2) - (c.left + c.width / 2);
                };
                setSlideL(measure(leftChipRef.current, leftPtrRef.current));
                setSlideR(measure(rightChipRef.current, rightPtrRef.current));
            }, 500);          // 500 ms lets the spring pop-in settle
            return () => clearTimeout(id);
        }
    }, [phase]);

    /* ---- pointer animate helper ---- */
    const ptrXY = (offset) => {
        if (ptrState === 'drop')  return { x: 0, y: 28 };
        if (ptrState === 'slide') return { x: -offset, y: 28 };
        return {};  // inline — no transform
    };
    const ptrSpring = ptrState !== 'inline'
        ? { type: 'spring', stiffness: 170, damping: 22 }
        : {};

    /* ================================================================ */
    return (
        <div className="flex flex-col items-center justify-center gap-5 py-6 select-none">
            {/* ---- main code line ---- */}
            <div className="font-mono text-xl md:text-2xl flex items-end gap-1.5 flex-wrap justify-center leading-relaxed">

                <span className="text-purple-400 font-bold">if</span>

                {/* ===== LEFT side ===== */}
                <AnimatePresence mode="wait">
                    {phase < 1 ? (
                        <motion.span key="lw" className="text-cyan-400 font-bold"
                            exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}>
                            left
                        </motion.span>
                    ) : phase < 3 ? (
                        <motion.span key="la" className="inline-flex items-center"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
                            <ArrayInline arr={leftArray}
                                highlightIdx={hlReady && phase === 2 ? i : -1}
                                targetIdx={i} color="cyan" chipRef={leftChipRef} />
                        </motion.span>
                    ) : (
                        <motion.span key="lv"
                            className="inline-flex items-center justify-center rounded-xl px-3 py-1
                                       font-black text-2xl border-2 bg-cyan-600/20 border-cyan-400/60 text-cyan-200"
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                            {leftVal}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* [i] pointer — drops down then slides left */}
                <AnimatePresence>
                    {phase < 3 && (
                        <motion.span key="pi" className="inline-flex items-center"
                            animate={ptrXY(slideL)}
                            transition={ptrSpring}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}>
                            <Bracket ref={leftPtrRef} label={i} color="text-cyan-300" />
                        </motion.span>
                    )}
                </AnimatePresence>

                <span className="text-yellow-300 font-bold mx-1">&lt;=</span>

                {/* ===== RIGHT side ===== */}
                <AnimatePresence mode="wait">
                    {phase < 1 ? (
                        <motion.span key="rw" className="text-amber-400 font-bold"
                            exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}>
                            right
                        </motion.span>
                    ) : phase < 3 ? (
                        <motion.span key="ra" className="inline-flex items-center"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
                            <ArrayInline arr={rightArray}
                                highlightIdx={hlReady && phase === 2 ? j : -1}
                                targetIdx={j} color="amber" chipRef={rightChipRef} />
                        </motion.span>
                    ) : (
                        <motion.span key="rv"
                            className="inline-flex items-center justify-center rounded-xl px-3 py-1
                                       font-black text-2xl border-2 bg-amber-600/20 border-amber-400/60 text-amber-200"
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}>
                            {rightVal}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* [j] pointer — drops down then slides left */}
                <AnimatePresence>
                    {phase < 3 && (
                        <motion.span key="pj" className="inline-flex items-center"
                            animate={ptrXY(slideR)}
                            transition={ptrSpring}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}>
                            <Bracket ref={rightPtrRef} label={j} color="text-amber-300" />
                        </motion.span>
                    )}
                </AnimatePresence>

                <span className="text-slate-400">:</span>
            </div>

            {/* ---- TRUE / FALSE verdict ---- */}
            <AnimatePresence>
                {phase === 3 && (
                    <motion.div
                        className={`px-6 py-2 rounded-xl font-black text-xl tracking-widest border-2 ${
                            isTrue
                                ? 'bg-green-500/15 border-green-400/50 text-green-400'
                                : 'bg-red-500/15 border-red-400/50 text-red-400'
                        }`}
                        initial={{ opacity: 0, y: 16, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 240, damping: 20 }}>
                        {isTrue ? 'TRUE' : 'FALSE'}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---- phase dots ---- */}
            <div className="flex items-center gap-1.5 mt-1">
                {[0, 1, 2, 3].map(p => (
                    <motion.div key={p}
                        className={`w-1.5 h-1.5 rounded-full ${p <= phase ? 'bg-indigo-400' : 'bg-slate-700'}`}
                        animate={p === phase ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 0.5 }} />
                ))}
            </div>
        </div>
    );
};

export default CompareAnimation;
