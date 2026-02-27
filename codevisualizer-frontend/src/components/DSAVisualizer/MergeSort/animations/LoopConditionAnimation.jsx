import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LoopConditionAnimation — only the CHANGING part morphs each step:
 *
 * Phase 0:  i < len( [38] )          AND   j < len( [27,43] )
 * Phase 1:  i < 1                    AND   j < 2               ← only len(…) morphs to number
 * Phase 2:  1 < 1                    AND   0 < 2               ← only i/j morph to values
 * Phase 3:  FALSE                    AND   TRUE                ← entire comparison morphs to bool
 * Phase 4:  FALSE                                              ← collapse to final
 */

const MORPH = { duration: 0.28, ease: [0.4, 0, 0.2, 1] };

/* Cross-fade: only the element with a changing `id` key re-renders */
const Morph = ({ id, children }) => (
    <AnimatePresence mode="wait">
        <motion.span
            key={id}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={MORPH}
            className="inline-flex items-center"
        >
            {children}
        </motion.span>
    </AnimatePresence>
);

/* Format array as [38, 27, 43] styled string */
const ArrayChip = ({ arr, color }) => (
    <span className={color}>
        [{arr.join(', ')}]
    </span>
);

const LoopConditionAnimation = ({ i, j, leftLen, rightLen, leftArray = [], rightArray = [] }) => {
    const isLeftValid  = i < leftLen;
    const isRightValid = j < rightLen;
    const isLoopValid  = isLeftValid && isRightValid;

    /*
     * Phase 0:  1 < len([38])      AND   1 < len([27,43])   — raw
     * Phase 1:  1 < 1              AND   1 < len([27,43])   — left len resolves
     * Phase 2:  FALSE              AND   1 < len([27,43])   — left → bool
     * Phase 3:  FALSE              AND   1 < 2              — right len resolves
     * Phase 4:  FALSE              AND   TRUE               — right → bool
     * Phase 5:  FALSE                                       — final
     */
    const [phase, setPhase] = useState(0);
    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 700),
            setTimeout(() => setPhase(2), 1900),   // extra pause so user reads 1<1 before FALSE
            setTimeout(() => setPhase(3), 2600),
            setTimeout(() => setPhase(4), 4000),   // extra pause so user reads 1<2 before TRUE
            setTimeout(() => setPhase(5), 4700),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    const boolColor = (val) => val ? 'text-green-400' : 'text-red-400';

    /* ── Left side — uses a fixed grid so 1 < never shifts ── */
    const leftSide = () => {
        if (phase >= 2) return (
            /* same 13rem left-anchored container so FALSE appears in place of 1 < 1 */
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '13rem' }}>
                <Morph id="l-bool">
                    <span className={`font-bold text-xl ${boolColor(isLeftValid)}`}>
                        {isLeftValid ? 'TRUE' : 'FALSE'}
                    </span>
                </Morph>
            </span>
        );
        return (
            /* grid: [value-slot fixed] [< fixed] [len/num left-anchored] */
            <span style={{ display: 'inline-grid', gridTemplateColumns: '1.2rem 1.5rem 1fr', alignItems: 'center', gap: '0 4px', minWidth: '13rem' }}>
                <span className="text-cyan-300 font-bold text-right">{i}</span>
                <span className="text-slate-500 text-center">&lt;</span>
                <span style={{ display: 'inline-flex', justifyContent: 'flex-start' }}>
                    {phase === 0
                        ? <Morph id="ll-raw">
                            <span>
                                <span className="text-slate-400">len(</span>
                                <ArrayChip arr={leftArray} color="text-emerald-400" />
                                <span className="text-slate-400">)</span>
                            </span>
                          </Morph>
                        : <Morph id="ll-num"><span className="text-emerald-300 font-bold">{leftLen}</span></Morph>
                    }
                </span>
            </span>
        );
    };

    /* ── Right side ── */
    const rightSide = () => {
        // Phase 0-2: j < len([arr])
        if (phase <= 2) return (
            <span className="inline-flex items-center gap-1" style={{ minWidth: '10rem', justifyContent: 'flex-start' }}>
                <span className="text-amber-300 font-bold">{j}</span>
                <span className="text-slate-500"> &lt; </span>
                <span style={{ display: 'inline-flex', justifyContent: 'flex-start' }}>
                    <Morph id="rl-raw">
                        <span>
                            <span className="text-slate-400">len(</span>
                            <ArrayChip arr={rightArray} color="text-orange-400" />
                            <span className="text-slate-400">)</span>
                        </span>
                    </Morph>
                </span>
            </span>
        );
        // Phase 3: j < number
        if (phase === 3) return (
            <span className="inline-flex items-center gap-1" style={{ minWidth: '10rem', justifyContent: 'flex-start' }}>
                <span className="text-amber-300 font-bold">{j}</span>
                <span className="text-slate-500"> &lt; </span>
                <span style={{ display: 'inline-flex', justifyContent: 'flex-start' }}>
                    <Morph id="rl-num"><span className="text-orange-300 font-bold">{rightLen}</span></Morph>
                </span>
            </span>
        );
        // Phase 4+: TRUE/FALSE — same flex-start container so it appears in place of j < nnn
        return (
            <span className="inline-flex items-center" style={{ minWidth: '10rem', justifyContent: 'flex-start' }}>
                <Morph id="r-bool">
                    <span className={`font-bold text-xl ${boolColor(isRightValid)}`}>
                        {isRightValid ? 'TRUE' : 'FALSE'}
                    </span>
                </Morph>
            </span>
        );
    };

    return (
        <div className="flex flex-col items-center gap-4 font-mono select-none">
            <motion.div
                className="flex items-center justify-center gap-3 text-lg min-h-[2.5rem] flex-wrap"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                {phase < 5 ? (
                    <>
                        {leftSide()}
                        <span className="text-slate-500 font-bold text-base mx-4">AND</span>
                        {rightSide()}
                    </>
                ) : (
                    <Morph id="final">
                        <span className={`text-3xl font-black ${boolColor(isLoopValid)}`}>
                            {isLoopValid ? 'TRUE' : 'FALSE'}
                        </span>
                    </Morph>
                )}
            </motion.div>
        </div>
    );
};

export default LoopConditionAnimation;
