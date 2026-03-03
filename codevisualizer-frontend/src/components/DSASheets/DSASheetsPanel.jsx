import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaArrowLeft } from 'react-icons/fa';
import { HiBookOpen } from 'react-icons/hi2';

// List of DSA Problems
const dsaProblems = [
    { id: 1,  name: "Merge Sort",          slug: "merge-sort",          difficulty: "Medium", category: "Divide & Conquer",    available: true  },
    { id: 2,  name: "Quick Sort",          slug: "quick-sort",          difficulty: "Medium", category: "Divide & Conquer",    available: true  },
    { id: 3,  name: "Bubble Sort",         slug: "bubble-sort",         difficulty: "Easy",   category: "Sorting",             available: true  },
    { id: 4,  name: "Selection Sort",      slug: "selection-sort",      difficulty: "Easy",   category: "Sorting",             available: true  },
    { id: 5,  name: "Binary Search",       slug: "binary-search",       difficulty: "Easy",   category: "Searching",           available: false },
    { id: 6,  name: "Two Sum",             slug: "two-sum",             difficulty: "Easy",   category: "Arrays",              available: false },
    { id: 7,  name: "Linked List Reversal", slug: "linked-list-reversal", difficulty: "Easy", category: "Linked List",        available: false },
    { id: 8,  name: "Valid Parentheses",   slug: "valid-parentheses",   difficulty: "Easy",   category: "Stack",               available: false },
    { id: 9,  name: "Maximum Subarray",    slug: "maximum-subarray",    difficulty: "Medium", category: "Dynamic Programming", available: false },
    { id: 10, name: "Binary Tree Inorder", slug: "binary-tree-inorder", difficulty: "Easy",   category: "Trees",               available: false },
];

const DSASheetsPanel = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [completedProblems, setCompletedProblems] = useState([]);

    if (!isOpen) return null;

    const toggleComplete = (e, problemId) => {
        e.stopPropagation();
        setCompletedProblems(prev =>
            prev.includes(problemId)
                ? prev.filter(id => id !== problemId)
                : [...prev, problemId]
        );
    };

    const handleProblemClick = (problem) => {
        if (problem.available) {
            onClose();
            navigate(`/dsa-sheet/${problem.slug}`);
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'bg-emerald-100 text-emerald-700';
            case 'Medium': return 'bg-amber-100 text-amber-700';
            case 'Hard': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <div
                className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl animate-slideInRight lg:rounded-l-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-4 shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <HiBookOpen className="text-lg text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">EasyLearnova's DSA Sheet</h2>
                                <p className="text-blue-100 text-xs">Master algorithms step by step</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                        >
                            <FaTimes className="text-white text-sm" />
                        </button>
                    </div>
                </div>

                {/* Problem List */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    <div className="space-y-3">
                        {dsaProblems.map((problem, index) => {
                            const isCompleted = completedProblems.includes(problem.id);

                            return (
                                <div
                                    key={problem.id}
                                    onClick={() => handleProblemClick(problem)}
                                    className={`bg-white rounded-xl p-4 border-2 transition-all duration-200 ${problem.available
                                            ? 'border-slate-200 hover:border-blue-400 hover:shadow-lg cursor-pointer group'
                                            : 'border-slate-100 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Number */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                                            }`}>
                                            {isCompleted ? '✓' : index + 1}
                                        </div>

                                        {/* Checkbox */}
                                        <button
                                            onClick={(e) => toggleComplete(e, problem.id)}
                                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isCompleted
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-slate-300 hover:border-emerald-400'
                                                }`}
                                        >
                                            {isCompleted && (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>

                                        {/* Problem Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-semibold text-slate-800 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                                                    {problem.name}
                                                </h4>
                                                {!problem.available && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-medium rounded-full">
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                                                    {problem.difficulty}
                                                </span>
                                                <span className="text-slate-400 text-xs">
                                                    {problem.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        {problem.available && (
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                                                <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress */}
                    <div className="mt-6 bg-white rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Progress</span>
                            <span className="text-sm font-bold text-blue-600">{completedProblems.length}/{dsaProblems.length}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${(completedProblems.length / dsaProblems.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Click a problem to start</span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default DSASheetsPanel;
