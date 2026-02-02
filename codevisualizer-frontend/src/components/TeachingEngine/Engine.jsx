import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRedo, FaCode, FaArrowLeft, FaTimes } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

/**
 * TeachingEngine v1.3 - Cleaner Full-Screen Layout
 * 
 * Focus: Visualization is the STAR, code is secondary reference
 */

// ============ MERGE SORT CODE ============
const MERGE_SORT_CODE = `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = arr[:mid]
    right = arr[mid:]
    
    return merge(
        merge_sort(left),
        merge_sort(right)
    )

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# arr = [38, 27, 43, 3, 9, 82, 10]`;

// ============ TYPEWRITER ============
const TypewriterText = ({ text, speed = 20 }) => {
    const [displayText, setDisplayText] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayText('');
        setDone(false);
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.slice(0, i + 1));
                i++;
            } else {
                setDone(true);
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return (
        <>
            {displayText}
            {!done && <span className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5 animate-pulse" />}
        </>
    );
};

// ============ ARRAY BOX ============
const ArrayBox = ({ value, isFinal, isHighlighted, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.7, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay, type: "spring", stiffness: 250 }}
        className={`
      w-12 h-12 flex items-center justify-center font-mono font-bold text-lg
      rounded-xl border-2 shadow-sm transition-colors
      ${isFinal ? 'bg-emerald-100 border-emerald-500 text-emerald-700' :
                isHighlighted ? 'bg-blue-100 border-blue-500 text-blue-700' :
                    'bg-white border-slate-200 text-slate-800'}
    `}
    >
        {value}
    </motion.div>
);

// ============ ARRAY ROW ============
const ArrayRow = ({ id, data, label, isHighlighted, isFinal }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2"
    >
        {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
        <div className="flex gap-1">
            {data.map((v, i) => (
                <ArrayBox key={`${id}-${i}`} value={v} isFinal={isFinal} isHighlighted={isHighlighted} delay={i * 0.06} />
            ))}
        </div>
    </motion.div>
);

// ============ CONNECTOR ============
const Connector = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center py-1"
    >
        <svg width="80" height="20" viewBox="0 0 80 20">
            <path d="M 40 0 L 20 18 M 40 0 L 60 18" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
    </motion.div>
);

// ============ MAIN ENGINE ============
const TeachingEngine = ({ lesson, onClose }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [board, setBoard] = useState(new Map());
    const [highlighted, setHighlighted] = useState(new Set());
    const [showCode, setShowCode] = useState(true);

    const timeline = lesson?.timeline || [];
    const step = timeline[stepIndex];
    const total = timeline.length;
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === total - 1;

    const process = useCallback((s) => {
        if (!s?.visuals) return;
        s.visuals.forEach(v => {
            if (v.type === 'SHOW_ARRAY') {
                setBoard(p => new Map(p).set(v.id, { data: v.data, label: v.label, y: v.position?.y || 0 }));
            } else if (v.type === 'SPLIT') {
                setBoard(p => {
                    const n = new Map(p);
                    n.set(v.leftId, { data: v.leftData, y: v.position?.y || 1 });
                    n.set(v.rightId, { data: v.rightData, y: v.position?.y || 1 });
                    return n;
                });
            } else if (v.type === 'MERGE') {
                setBoard(p => new Map(p).set(v.resultId, { data: v.resultData, y: v.position?.y || 5, isFinal: v.isFinal }));
            } else if (v.type === 'HIGHLIGHT') {
                setHighlighted(p => new Set(p).add(v.targetId));
            } else if (v.type === 'HIGHLIGHT_ALL_LEAVES') {
                setBoard(p => {
                    const leaves = [];
                    p.forEach((val, key) => { if (val.data.length === 1) leaves.push(key); });
                    setHighlighted(new Set(leaves));
                    return p;
                });
            }
        });
    }, []);

    const reset = () => { setStepIndex(0); setBoard(new Map()); setHighlighted(new Set()); setIsPlaying(false); };
    const next = useCallback(() => {
        if (stepIndex < total - 1) { setStepIndex(i => i + 1); process(timeline[stepIndex + 1]); }
        else setIsPlaying(false);
    }, [stepIndex, total, timeline, process]);
    const prev = useCallback(() => {
        if (stepIndex > 0) {
            setBoard(new Map()); setHighlighted(new Set());
            for (let i = 0; i < stepIndex; i++) process(timeline[i]);
            setStepIndex(i => i - 1);
        }
    }, [stepIndex, timeline, process]);

    useEffect(() => {
        if (isPlaying && !isLast) {
            const t = setTimeout(next, 3500);
            return () => clearTimeout(t);
        } else if (isLast) setIsPlaying(false);
    }, [isPlaying, isLast, next]);

    useEffect(() => { if (step && board.size === 0) process(step); }, [step, board.size, process]);

    // Render board
    const renderBoard = () => {
        const levels = new Map();
        board.forEach((v, id) => {
            if (!levels.has(v.y)) levels.set(v.y, []);
            levels.get(v.y).push({ id, ...v });
        });
        return Array.from(levels.entries()).sort((a, b) => a[0] - b[0]).map(([y, arrs], i) => (
            <React.Fragment key={y}>
                {i > 0 && <Connector />}
                <div className="flex justify-center gap-6 flex-wrap">
                    {arrs.map(a => <ArrayRow key={a.id} {...a} isHighlighted={highlighted.has(a.id)} />)}
                </div>
            </React.Fragment>
        ));
    };

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <FaArrowLeft className="text-sm" />
                    <span className="text-sm font-medium">Back</span>
                </button>
                <div className="flex items-center gap-3">
                    <HiSparkles className="text-amber-400 text-xl" />
                    <span className="font-bold text-lg">{lesson.meta.title}</span>
                    <span className="text-slate-400 text-sm">• Step {stepIndex + 1}/{total}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showCode ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                    >
                        <FaCode className="text-xs" />
                        {showCode ? 'Hide Code' : 'Show Code'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                        <FaTimes className="text-slate-400 text-sm" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Code Panel (Toggleable) */}
                <AnimatePresence>
                    {showCode && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-slate-950 border-r border-white/10 flex flex-col overflow-hidden"
                        >
                            <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
                                <FaCode className="text-blue-400 text-sm" />
                                <span className="text-sm text-slate-300 font-mono">merge_sort.py</span>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <pre className="text-xs font-mono leading-relaxed text-slate-400">
                                    {MERGE_SORT_CODE.split('\n').map((line, i) => (
                                        <div key={i} className="flex">
                                            <span className="w-6 text-right pr-2 text-slate-600 select-none">{i + 1}</span>
                                            <span>{line}</span>
                                        </div>
                                    ))}
                                </pre>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Visualization Area */}
                <div className="flex-1 flex flex-col">
                    {/* Narration */}
                    <div className="px-8 py-5 bg-white/5 border-b border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                <span className="text-white font-bold">{stepIndex + 1}</span>
                            </div>
                            <p className="text-slate-200 text-lg leading-relaxed flex-1">
                                <TypewriterText key={step?.id} text={step?.narration?.text || ''} />
                            </p>
                        </div>
                    </div>

                    {/* Board */}
                    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 min-w-[500px]">
                            <motion.div layout className="flex flex-col items-center gap-4">
                                {renderBoard()}
                            </motion.div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="px-8 py-4 bg-white/5 border-t border-white/10">
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={reset} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                <FaRedo className="text-slate-400 text-sm" />
                            </button>
                            <button onClick={prev} disabled={isFirst} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFirst ? 'bg-white/5 text-slate-600' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}>
                                <FaStepBackward className="text-sm" />
                            </button>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                disabled={isLast}
                                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isLast ? 'bg-emerald-500' : isPlaying ? 'bg-amber-500 hover:bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500'
                                    }`}
                            >
                                {isLast ? <span className="text-white text-lg">✓</span> : isPlaying ? <FaPause className="text-white" /> : <FaPlay className="text-white ml-0.5" />}
                            </button>
                            <button onClick={next} disabled={isLast} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLast ? 'bg-white/5 text-slate-600' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}>
                                <FaStepForward className="text-sm" />
                            </button>

                            {/* Progress */}
                            <div className="ml-6 flex-1 max-w-xs flex items-center gap-3">
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                        animate={{ width: `${((stepIndex + 1) / total) * 100}%` }}
                                    />
                                </div>
                                <span className="text-slate-400 text-sm font-medium">{Math.round(((stepIndex + 1) / total) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeachingEngine;
