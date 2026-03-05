import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronDown, HiChevronRight, HiArrowsUpDown, HiMagnifyingGlass } from 'react-icons/hi2';
import { TbArrowIteration, TbStack2, TbAppWindow } from 'react-icons/tb';

// ── Floating code tokens shown in the hero background ────────────────────────
const CODE_TOKENS = [
    'O(log n)', 'left = mid + 1', 'arr[mid]', 'while l ≤ r', 'pivot',
    'merge()', 'stack.pop()', 'i++', 'swap(i,j)', 'return mid',
    'O(n²)', 'mid = (l+r)//2', 'right = mid-1', 'for i in range',
    '{ }', '[ ]', 'def sort()', 'O(n log n)', 'base case',
    'recurse(n-1)', 'append()', 'O(1)', 'BFS', 'DFS',
];

const FloatingToken = ({ text, style }) => (
    <div
        className="absolute font-mono text-xs font-semibold select-none pointer-events-none"
        style={style}
    >
        {text}
    </div>
);

const AnimatedHero = ({ completedCount, progressPct }) => {
    // Generate fixed token positions so they don't re-randomise on re-render
    const tokens = useRef(
        CODE_TOKENS.map((t, i) => ({
            text: t,
            left: `${(i * 37 + 7) % 95}%`,
            top: `${(i * 53 + 11) % 90}%`,
            delay: `${(i * 0.4) % 6}s`,
            dur: `${6 + (i % 5)}s`,
            opacity: 0.06 + (i % 4) * 0.04,
            scale: 0.7 + (i % 3) * 0.2,
        }))
    ).current;

    return (
        <div className="relative overflow-hidden" style={{ background: '#0f172a' }}>
            {/* Animated grid — subtle perspective floor */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage: 'linear-gradient(to bottom,transparent 0%,black 30%,black 70%,transparent 100%)'
            }} />

            {/* Glowing orbs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.12] blur-3xl" style={{ background: 'radial-gradient(circle,#6366f1,transparent 70%)' }} />
            <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full opacity-[0.08] blur-3xl" style={{ background: 'radial-gradient(circle,#a855f7,transparent 70%)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-[0.07] blur-3xl" style={{ background: 'radial-gradient(ellipse,#6366f1,transparent 70%)' }} />

            {/* Floating code tokens */}
            <style>{`
                @keyframes floatUp {
                    0%   { transform: translateY(0px) scale(var(--s)); opacity: var(--o); }
                    50%  { transform: translateY(-18px) scale(var(--s)); opacity: calc(var(--o) * 1.5); }
                    100% { transform: translateY(0px) scale(var(--s)); opacity: var(--o); }
                }
            `}</style>
            {tokens.map((tk, i) => (
                <div
                    key={i}
                    className="absolute font-mono font-semibold select-none pointer-events-none text-indigo-300"
                    style={{
                        left: tk.left,
                        top: tk.top,
                        fontSize: `${10 * tk.scale}px`,
                        '--o': tk.opacity,
                        '--s': tk.scale,
                        opacity: tk.opacity,
                        animation: `floatUp ${tk.dur} ${tk.delay} ease-in-out infinite`,
                    }}
                >
                    {tk.text}
                </div>
            ))}

            {/* 3-D floating array card */}
            <div className="absolute right-[8%] top-[18%] hidden xl:block pointer-events-none"
                style={{ perspective: '600px', transform: 'rotateY(-15deg) rotateX(8deg)' }}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl" style={{ width: 220 }}>
                    <p className="text-indigo-300 text-[9px] font-mono mb-2 opacity-70">arr = [3, 12, 18, 25, 31, 42]</p>
                    <div className="flex gap-1.5">
                        {[3,12,18,25,31,42].map((v,i) => (
                            <div key={i} className={`flex-1 rounded-md flex items-center justify-center text-[10px] font-bold py-2 ${
                                i === 2 ? 'bg-sky-500 text-white' : 'bg-white/10 text-white/60'
                            }`}>{v}</div>
                        ))}
                    </div>
                    <p className="text-emerald-400 text-[9px] font-mono mt-2 opacity-80">↑ mid = 18</p>
                </div>
            </div>

            {/* 3-D floating stack card */}
            <div className="absolute left-[6%] bottom-[15%] hidden xl:block pointer-events-none"
                style={{ perspective: '600px', transform: 'rotateY(12deg) rotateX(-6deg)' }}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 shadow-2xl" style={{ width: 160 }}>
                    <p className="text-purple-300 text-[9px] font-mono mb-2 opacity-70">stack:</p>
                    {['( opened','[ opened','{ opened'].map((s,i) => (
                        <div key={i} className="text-[9px] font-mono text-white/50 py-0.5 border-b border-white/5">{s}</div>
                    ))}
                    <p className="text-rose-400 text-[9px] font-mono mt-1.5 opacity-80">→ balanced ✓</p>
                </div>
            </div>

            {/* Hero text */}
            <div className="relative max-w-2xl mx-auto px-4 py-12 text-center">
                <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-3 py-1 text-white/50 text-[10px] font-semibold tracking-widest uppercase mb-4 bg-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    EasyLearnova · DSA Sheet
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3" style={{ textShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
                    Master Algorithms
                    <span className="block bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                        Step by Step
                    </span>
                </h1>
                <p className="text-white/50 text-sm max-w-sm mx-auto mb-6">
                    Pick a pattern · Watch it visualize · Level up
                </p>

                {/* Compact progress bar */}
                <div className="inline-flex items-center gap-4 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3">
                    <div className="text-left">
                        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Progress</p>
                        <p className="text-white font-bold text-sm">{completedCount}/{AVAILABLE_TOTAL} solved</p>
                    </div>
                    <div className="w-28">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#34d399,#6ee7b7)' }}
                            />
                        </div>
                        <p className="text-white/30 text-[9px] mt-0.5 text-right">{progressPct}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Problem data grouped by pattern ─────────────────────────────────────────
const PATTERNS = [
    {
        id: 'sorting',
        name: 'Sorting',
        Icon: HiArrowsUpDown,
        description: 'Compare, swap, and order — the foundation of algorithms',
        color: 'from-blue-500 to-indigo-600',
        lightColor: 'bg-blue-50 border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-700',
        problems: [
            { id: 1,  name: 'Bubble Sort',    slug: 'bubble-sort',    difficulty: 'Easy',   available: true  },
            { id: 2,  name: 'Selection Sort', slug: 'selection-sort', difficulty: 'Easy',   available: true  },
            { id: 3,  name: 'Insertion Sort', slug: 'insertion-sort', difficulty: 'Easy',   available: true  },
            { id: 4,  name: 'Merge Sort',     slug: 'merge-sort',     difficulty: 'Medium', available: true  },
            { id: 5,  name: 'Quick Sort',     slug: 'quick-sort',     difficulty: 'Medium', available: true  },
        ],
    },
    {
        id: 'binary-search',
        name: 'Binary Search',
        Icon: HiMagnifyingGlass,
        description: 'Halve the search space every step — lightning fast',
        color: 'from-emerald-500 to-teal-600',
        lightColor: 'bg-emerald-50 border-emerald-200',
        badgeColor: 'bg-emerald-100 text-emerald-700',
        problems: [
            { id: 6,  name: 'Binary Search',        slug: 'binary-search',        difficulty: 'Easy',   available: true  },
            { id: 7,  name: 'Find Peak Element',    slug: 'find-peak-element',    difficulty: 'Medium', available: false },
            { id: 8,  name: 'First/Last Position',  slug: 'first-last-position',  difficulty: 'Medium', available: false },
            { id: 9,  name: 'Search Rotated Array', slug: 'search-rotated-array', difficulty: 'Medium', available: false },
        ],
    },
    {
        id: 'recursion',
        name: 'Recursion',
        Icon: TbArrowIteration,
        description: 'A function calling itself — elegant and powerful',
        color: 'from-violet-500 to-purple-600',
        lightColor: 'bg-violet-50 border-violet-200',
        badgeColor: 'bg-violet-100 text-violet-700',
        problems: [
            { id: 10, name: 'Fibonacci Tree',  slug: 'fibonacci',    difficulty: 'Easy',   available: false },
            { id: 11, name: 'Factorial',        slug: 'factorial',    difficulty: 'Easy',   available: false },
            { id: 12, name: 'Subsets',          slug: 'subsets',      difficulty: 'Medium', available: false },
            { id: 13, name: 'Permutations',     slug: 'permutations', difficulty: 'Hard',   available: false },
        ],
    },
    {
        id: 'stack',
        name: 'Stack',
        Icon: TbStack2,
        description: 'Last in, first out — master the bracket and histogram problems',
        color: 'from-orange-500 to-rose-500',
        lightColor: 'bg-orange-50 border-orange-200',
        badgeColor: 'bg-orange-100 text-orange-700',
        problems: [
            { id: 14, name: 'Valid Parentheses',          slug: 'valid-parentheses',          difficulty: 'Easy',   available: false },
            { id: 15, name: 'Next Greater Element',       slug: 'next-greater-element',       difficulty: 'Medium', available: false },
            { id: 16, name: 'Daily Temperatures',         slug: 'daily-temperatures',         difficulty: 'Medium', available: false },
            { id: 17, name: 'Largest Rectangle Histogram',slug: 'largest-rectangle-histogram',difficulty: 'Hard',   available: false },
        ],
    },
    {
        id: 'sliding-window',
        name: 'Sliding Window',
        Icon: TbAppWindow,
        description: 'Maintain a moving window over data — O(n) solutions',
        color: 'from-pink-500 to-fuchsia-600',
        lightColor: 'bg-pink-50 border-pink-200',
        badgeColor: 'bg-pink-100 text-pink-700',
        problems: [
            { id: 18, name: 'Char Replacement', slug: 'char-replacement', difficulty: 'Medium', available: true  },
        ],
    },
];

const DIFFICULTY_STYLE = {
    Easy:   'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard:   'bg-red-100 text-red-700',
};

// ── Completed state keys across patterns ─────────────────────────────────────
const ALL_PROBLEMS = PATTERNS.flatMap(p => p.problems);
const TOTAL = ALL_PROBLEMS.length;
const AVAILABLE_TOTAL = ALL_PROBLEMS.filter(p => p.available).length;

// ── Pattern accordion section ─────────────────────────────────────────────────
const PatternSection = ({ pattern, completed, onToggleComplete, onProblemClick, defaultOpen }) => {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const doneCount = pattern.problems.filter(p => completed.includes(p.id)).length;
    const availableCount = pattern.problems.filter(p => p.available).length;

    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${open ? pattern.lightColor : 'bg-white border-slate-200'}`}>
            {/* Header row */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
                {/* Pattern icon + gradient pill */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pattern.color} flex items-center justify-center shrink-0 shadow-sm`}>
                    <pattern.Icon className="text-white text-xl" />
                </div>

                <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-800 text-base">{pattern.name}</span>
                    <p className="text-slate-500 text-xs mt-0.5">{pattern.description}</p>
                </div>

                {/* Progress pill */}
                <div className="flex items-center gap-2 shrink-0">
                    {doneCount > 0 && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {doneCount}/{pattern.problems.length}
                        </span>
                    )}
                    {open
                        ? <HiChevronDown className="text-slate-400 text-lg" />
                        : <HiChevronRight className="text-slate-400 text-lg" />
                    }
                </div>
            </button>

            {/* Problem list */}
            {open && (
                <div className="border-t border-slate-200 divide-y divide-slate-100">
                    {pattern.problems.map((problem) => {
                        const isCompleted = completed.includes(problem.id);
                        return (
                            <div
                                key={problem.id}
                                onClick={() => onProblemClick(problem)}
                                className={`flex items-center gap-4 px-5 py-3 transition-all duration-150 group ${
                                    problem.available
                                        ? 'hover:bg-white/80 cursor-pointer'
                                        : 'opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (problem.available) onToggleComplete(problem.id); }}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-slate-300 hover:border-emerald-400'
                                    }`}
                                >
                                    {isCompleted && (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>

                                {/* Name */}
                                <span className={`flex-1 font-medium text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {problem.name}
                                </span>

                                {/* Badges */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${DIFFICULTY_STYLE[problem.difficulty]}`}>
                                        {problem.difficulty}
                                    </span>
                                    {!problem.available && (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-medium rounded-full">
                                            Soon
                                        </span>
                                    )}
                                </div>

                                {/* Arrow */}
                                {problem.available && (
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors shrink-0">
                                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const DSASheetPage = () => {
    const navigate = useNavigate();
    const [completed, setCompleted] = useState([]);

    const toggleComplete = (id) => {
        setCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleProblemClick = (problem) => {
        if (problem.available) navigate(`/dsa-sheet/${problem.slug}`);
    };

    const completedCount = completed.length;
    const progressPct = Math.round((completedCount / AVAILABLE_TOTAL) * 100);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Cinematic Hero ── */}
            <AnimatedHero completedCount={completedCount} progressPct={progressPct} />

            {/* ── Pattern sections (lift up slightly over hero bottom edge) ── */}
            <div className="max-w-2xl mx-auto px-4 -mt-4 pb-10 space-y-4 relative z-10">
                {PATTERNS.filter(p => p.id !== 'sliding-window').map((pattern) => (
                    <PatternSection
                        key={pattern.id}
                        pattern={pattern}
                        completed={completed}
                        onToggleComplete={toggleComplete}
                        onProblemClick={handleProblemClick}
                    />
                ))}

                {/* Footer note */}
                <p className="text-center text-slate-400 text-xs pt-4">
                    More patterns & problems coming soon · Built by EasyLearnova
                </p>
            </div>
        </div>
    );
};

export default DSASheetPage;
