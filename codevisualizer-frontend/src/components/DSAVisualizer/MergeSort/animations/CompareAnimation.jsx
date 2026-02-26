import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cinematic comparison animation for `if left[i] <= right[j]:`
 *
 * Phase 0 — raw code:       if left[0] <= right[0]:
 * Phase 1 — arrays pop:     if [38][0] <= [27,43][0]:
 * Phase 2 — pointer drops + slides to element → highlight + pulse
 * Collapse — other elems + brackets fade/shrink, value morphs to styled box
 * Verdict  — TRUE / FALSE badge
 */

const COLLAPSE_DUR = 0.7;
const COLLAPSE_EASE = [0.4, 0, 0.2, 1];

/* ---- Bracket helper ---- */
const Bracket = React.forwardRef(({ label, color }, ref) => (
    <span ref={ref} className="font-mono whitespace-nowrap">
        <span className="text-slate-500">[</span>
        <span className={`font-bold ${color}`}>{label}</span>
        <span className="text-slate-500">]</span>
    </span>
));
Bracket.displayName = 'Bracket';

/* ================================================================ */
const CompareAnimation = ({ leftVal, rightVal, leftArray = [], rightArray = [], i = 0, j = 0 }) => {
    const [phase, setPhase]           = useState(0);
    const [ptrState, setPtrState]     = useState('inline');
    const [hlReady, setHlReady]       = useState(false);
    const [collapsing, setCollapsing] = useState(false);
    const [showVerdict, setShowVerdict] = useState(false);
    const isTrue = leftVal <= rightVal;

    /* refs for measuring pointer slide distance */
    const leftChipRef  = useRef(null);
    const rightChipRef = useRef(null);
    const leftPtrRef   = useRef(null);
    const rightPtrRef  = useRef(null);
    const [slideL, setSlideL] = useState(40);
    const [slideR, setSlideR] = useState(40);

    /* ---- timer chain ---- */
    useEffect(() => {
        const t = [
            setTimeout(() => setPhase(1), 1400),
            setTimeout(() => setPhase(2), 2800),
            setTimeout(() => setHlReady(true), 4400),
            setTimeout(() => setCollapsing(true), 5400),
            setTimeout(() => setShowVerdict(true), 6400),
        ];
        return () => t.forEach(clearTimeout);
    }, []);

    /* ---- pointer drop → slide ---- */
    useEffect(() => {
        if (phase === 2) {
            setPtrState('drop');
            const id = setTimeout(() => setPtrState('slide'), 700);
            return () => clearTimeout(id);
        }
    }, [phase]);

    /* ---- measure bracket → chip distance ---- */
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
            }, 500);
            return () => clearTimeout(id);
        }
    }, [phase]);

    /* ---- pointer position ---- */
    const ptrXY = (offset) => {
        if (ptrState === 'drop')  return { x: 0, y: 28 };
        if (ptrState === 'slide') return { x: -offset, y: 28 };
        return {};
    };
    const ptrSpring = ptrState !== 'inline'
        ? { type: 'spring', stiffness: 170, damping: 22 }
        : {};

    /* ---- color palettes ---- */
    const pal = (isCyan) => {
        const hlBg     = isCyan ? 'rgba(6,182,212,0.3)'   : 'rgba(245,158,11,0.3)';
        const hlShadow = isCyan ? '0 0 8px rgba(34,211,238,0.4)'  : '0 0 8px rgba(251,191,36,0.4)';
        const hlBorder = isCyan ? 'rgba(34,211,238,0.6)'  : 'rgba(251,191,36,0.6)';
        const finalBg  = isCyan ? 'rgba(8,145,178,0.2)'   : 'rgba(217,119,6,0.2)';
        const finalSh  = isCyan ? '0 0 14px rgba(34,211,238,0.35)' : '0 0 14px rgba(251,191,36,0.35)';
        return { hlBg, hlShadow, hlBorder, finalBg, finalSh };
    };

    /* ---- render array with smooth collapse ---- */
    const renderArray = (arr, targetIdx, color, chipRef) => {
        const isCyan = color === 'cyan';
        const { hlBg, hlShadow, hlBorder, finalBg, finalSh } = pal(isCyan);
        const colT = { duration: COLLAPSE_DUR, ease: COLLAPSE_EASE };
        const hlIdx = hlReady ? targetIdx : -1;

        return (
            <span className="inline-flex items-center font-mono">
                {/* opening [ */}
                <motion.span
                    className="text-slate-500"
                    style={{ display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    animate={collapsing ? { opacity: 0, maxWidth: 0 } : { opacity: 1, maxWidth: 20 }}
                    transition={colT}
                >[</motion.span>

                {arr.map((v, idx) => {
                    const isHL = hlIdx === idx;
                    const hide = collapsing && !isHL;

                    return (
                        <React.Fragment key={idx}>
                            {/* comma */}
                            {idx > 0 && (
                                <motion.span
                                    className="text-slate-600"
                                    style={{ display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap' }}
                                    animate={collapsing ? { opacity: 0, maxWidth: 0 } : { opacity: 1, maxWidth: 30 }}
                                    transition={colT}
                                >,&nbsp;</motion.span>
                            )}

                            {/* outer wrapper — handles hide/show shrink */}
                            <motion.span
                                style={{ display: 'inline-flex', overflow: 'hidden' }}
                                animate={
                                    hide
                                        ? { opacity: 0, maxWidth: 0, paddingLeft: 0, paddingRight: 0 }
                                        : { opacity: 1, maxWidth: 80 }
                                }
                                transition={colT}
                            >
                                {/* inner chip — handles highlight glow, pulse, collapse morph */}
                                <motion.span
                                    ref={targetIdx === idx ? chipRef : null}
                                    className={`inline-flex items-center justify-center text-center font-bold
                                        ${isHL
                                            ? (isCyan ? 'text-cyan-100' : 'text-amber-100')
                                            : 'text-slate-400'}`}
                                    style={{
                                        whiteSpace: 'nowrap',
                                        borderStyle: 'solid',
                                    }}
                                    animate={
                                        isHL && collapsing
                                            ? {
                                                scale: 1,
                                                backgroundColor: finalBg,
                                                boxShadow: finalSh,
                                                borderColor: hlBorder,
                                                borderWidth: 2,
                                                borderRadius: 12,
                                                paddingLeft: 12, paddingRight: 12,
                                                paddingTop: 4, paddingBottom: 4,
                                                fontSize: 24,
                                                fontWeight: 900,
                                            }
                                            : isHL && hlReady
                                                ? {
                                                    scale: [1, 1.15, 1],
                                                    backgroundColor: hlBg,
                                                    boxShadow: hlShadow,
                                                    borderColor: hlBorder,
                                                    borderWidth: 2,
                                                    borderRadius: 4,
                                                    paddingLeft: 4, paddingRight: 4,
                                                    paddingTop: 0, paddingBottom: 0,
                                                    fontSize: 20,
                                                    fontWeight: 700,
                                                }
                                                : {
                                                    scale: 1,
                                                    backgroundColor: 'rgba(0,0,0,0)',
                                                    boxShadow: '0 0 0 rgba(0,0,0,0)',
                                                    borderColor: 'rgba(0,0,0,0)',
                                                    borderWidth: 2,
                                                    borderRadius: 4,
                                                    paddingLeft: 4, paddingRight: 4,
                                                    paddingTop: 0, paddingBottom: 0,
                                                    fontSize: 20,
                                                    fontWeight: 700,
                                                }
                                    }
                                    transition={
                                        isHL && hlReady && !collapsing
                                            ? {
                                                scale: { duration: 0.6, repeat: 10, ease: 'easeInOut' },
                                                default: { duration: 0.4, ease: 'easeOut' },
                                            }
                                            : { duration: COLLAPSE_DUR, ease: COLLAPSE_EASE }
                                    }
                                >
                                    {v}
                                </motion.span>
                            </motion.span>
                        </React.Fragment>
                    );
                })}

                {/* closing ] */}
                <motion.span
                    className="text-slate-500"
                    style={{ display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    animate={collapsing ? { opacity: 0, maxWidth: 0 } : { opacity: 1, maxWidth: 20 }}
                    transition={colT}
                >]</motion.span>
            </span>
        );
    };

    /* dot state */
    const dotIdx = showVerdict ? 3 : collapsing ? 2 : hlReady ? 2 : phase;

    /* ================================================================ */
    return (
        <div className="flex flex-col items-center justify-center gap-5 py-6 select-none">
            <div className="font-mono text-xl md:text-2xl flex items-end gap-1.5 flex-wrap justify-center leading-relaxed">

                <span className="text-purple-400 font-bold">if</span>

                {/* ===== LEFT ===== */}
                <AnimatePresence mode="wait">
                    {phase < 1 ? (
                        <motion.span key="lw" className="text-cyan-400 font-bold"
                            exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}>
                            left
                        </motion.span>
                    ) : (
                        <motion.span key="la" className="inline-flex items-center"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
                            {renderArray(leftArray, i, 'cyan', leftChipRef)}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* [i] pointer */}
                <AnimatePresence>
                    {!collapsing && (
                        <motion.span key="pi" className="inline-flex items-center"
                            animate={ptrXY(slideL)}
                            transition={ptrSpring}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.4 } }}>
                            <Bracket ref={leftPtrRef} label={i} color="text-cyan-300" />
                        </motion.span>
                    )}
                </AnimatePresence>

                <span className="text-yellow-300 font-bold mx-1">&lt;=</span>

                {/* ===== RIGHT ===== */}
                <AnimatePresence mode="wait">
                    {phase < 1 ? (
                        <motion.span key="rw" className="text-amber-400 font-bold"
                            exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}>
                            right
                        </motion.span>
                    ) : (
                        <motion.span key="ra" className="inline-flex items-center"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
                            {renderArray(rightArray, j, 'amber', rightChipRef)}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* [j] pointer */}
                <AnimatePresence>
                    {!collapsing && (
                        <motion.span key="pj" className="inline-flex items-center"
                            animate={ptrXY(slideR)}
                            transition={ptrSpring}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.4 } }}>
                            <Bracket ref={rightPtrRef} label={j} color="text-amber-300" />
                        </motion.span>
                    )}
                </AnimatePresence>

                <span className="text-slate-400">:</span>
            </div>

            {/* ---- verdict ---- */}
            <AnimatePresence>
                {showVerdict && (
                    <motion.div
                        className={`px-6 py-2 rounded-xl font-black text-xl tracking-widest border-2 ${
                            isTrue
                                ? 'bg-green-500/15 border-green-400/50 text-green-400'
                                : 'bg-red-500/15 border-red-400/50 text-red-400'
                        }`}
                        initial={{ opacity: 0, y: 16, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 20 }}>
                        {isTrue ? 'TRUE' : 'FALSE'}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---- dots ---- */}
            <div className="flex items-center gap-1.5 mt-1">
                {[0, 1, 2, 3].map(p => (
                    <motion.div key={p}
                        className={`w-1.5 h-1.5 rounded-full ${p <= dotIdx ? 'bg-indigo-400' : 'bg-slate-700'}`}
                        animate={p === dotIdx ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 0.5 }} />
                ))}
            </div>
        </div>
    );
};

export default CompareAnimation;
