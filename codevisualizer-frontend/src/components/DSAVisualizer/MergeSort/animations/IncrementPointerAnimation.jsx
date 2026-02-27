import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * IncrementPointerAnimation
 * Shows BOTH arrays (left with i-pointer, right with j-pointer).
 * The active array's pointer slides from oldValue to newValue.
 * The other array is shown statically with its current pointer.
 */
const CELL_W = 44; // w-10 (40px) + gap-1 (4px)

/** Single array panel — sliding=true means the pointer animates */
const ArrayPanel = ({ array, label, ptrName, anchorIdx, targetIdx, sliding, phase }) => {
    const isCyan = ptrName === 'i';
    const activeBoxCls = isCyan
        ? 'bg-cyan-600 border-cyan-400 text-white ring-2 ring-cyan-300'
        : 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300';
    const ptrColor    = isCyan ? 'text-cyan-400' : 'text-amber-400';
    const labelColor  = isCyan ? 'text-cyan-400' : 'text-amber-400';
    const inactiveCls = 'bg-slate-700 border-slate-500 text-slate-300';

    const arrowX      = sliding ? (phase === 1 ? (targetIdx - anchorIdx) * CELL_W : 0) : 0;
    const highlightIdx = sliding ? (phase === 1 ? targetIdx : anchorIdx) : anchorIdx;
    const displayVal   = sliding ? (phase === 1 ? targetIdx : anchorIdx) : anchorIdx;

    if (!array || array.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-2">
            <span className={`text-xs ${labelColor}`}>{label}</span>
            <div className="flex gap-1">
                {array.map((val, idx) => (
                    <motion.div
                        key={idx}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm border-2 transition-colors duration-300
                            ${idx === highlightIdx ? activeBoxCls : inactiveCls}`}
                        animate={sliding && idx === highlightIdx ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={{ duration: 0.35, delay: sliding && phase === 1 ? 0.55 : 0 }}
                    >
                        {val}
                    </motion.div>
                ))}
            </div>
            {/* Arrow anchored at anchorIdx cell, slides for the active panel */}
            <div className="relative h-8 w-full">
                <motion.div
                    className="absolute flex flex-col items-center w-10"
                    style={{ left: anchorIdx * CELL_W }}
                    animate={sliding ? { x: arrowX } : {}}
                    transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.05 }}
                >
                    <motion.span
                        className={`${ptrColor} text-lg leading-none`}
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        &#8593;
                    </motion.span>
                    <span className={`${ptrColor} text-xs font-mono`}>
                        {ptrName}={displayVal}
                    </span>
                </motion.div>
            </div>
        </div>
    );
};

const IncrementPointerAnimation = ({ pointerName, oldValue, newValue, iPtr = 0, jPtr = 0, leftArray = [], rightArray = [] }) => {
    const isI = pointerName === 'i';
    const ptrColor = isI ? 'text-cyan-400' : 'text-amber-400';

    const [phase, setPhase] = useState(0);
    useEffect(() => {
        const id = setTimeout(() => setPhase(1), 700);
        return () => clearTimeout(id);
    }, []);

    return (
        <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Code expression + inline transition badge */}
            <motion.div
                className="flex items-center gap-3 flex-wrap justify-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {/* The statement */}
                <span className="text-lg font-mono">
                    <span className={`font-bold ${ptrColor}`}>{pointerName}</span>
                    <span className="text-slate-500"> += </span>
                    <span className="text-emerald-400 font-bold">1</span>
                </span>

                {/* Separator */}
                <span className="text-slate-600 text-lg">→</span>

                {/* Transition text: e.g. j: 0 → 1 */}
                <motion.span
                    className="flex items-center gap-1 text-base font-mono"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 16 }}
                >
                    <span className={`font-bold ${ptrColor}`}>{pointerName}</span>
                    <span className="text-slate-400">:</span>
                    {/* old value — fades out */}
                    <motion.span
                        className="text-slate-400 line-through"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ delay: 0.9, duration: 0.4 }}
                    >
                        {oldValue}
                    </motion.span>
                    <span className="text-slate-500">→</span>
                    {/* new value — pops in */}
                    <motion.span
                        className={`font-bold ${ptrColor}`}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, type: 'spring', stiffness: 260, damping: 18 }}
                    >
                        {newValue}
                    </motion.span>
                </motion.span>
            </motion.div>

            {/* Both arrays side by side */}
            <motion.div
                className="flex items-start gap-16 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {/* Left array — slides when incrementing i */}
                <ArrayPanel
                    array={leftArray}
                    label="left"
                    ptrName="i"
                    anchorIdx={isI ? oldValue : iPtr}
                    targetIdx={isI ? newValue : iPtr}
                    sliding={isI}
                    phase={phase}
                />

                {/* Right array — slides when incrementing j */}
                <ArrayPanel
                    array={rightArray}
                    label="right"
                    ptrName="j"
                    anchorIdx={!isI ? oldValue : jPtr}
                    targetIdx={!isI ? newValue : jPtr}
                    sliding={!isI}
                    phase={phase}
                />
            </motion.div>
        </motion.div>
    );
};

export default IncrementPointerAnimation;
