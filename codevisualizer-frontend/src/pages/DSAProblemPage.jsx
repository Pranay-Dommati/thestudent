import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaCode, FaLightbulb, FaClock, FaCheckCircle } from 'react-icons/fa';
import { HiSparkles, HiChartBar, HiBookOpen } from 'react-icons/hi2';
import { TeachingEngine, mergeSortLesson } from '../components/TeachingEngine';

// Problem metadata (not the teaching plan)
const problemsData = {
    'merge-sort': {
        id: 1,
        name: "Merge Sort",
        difficulty: "Medium",
        category: "Divide & Conquer",
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        description: "Implement the Merge Sort algorithm to sort an array of integers in ascending order. Merge Sort is a divide-and-conquer algorithm that divides the input array into two halves, recursively sorts them, and then merges the sorted halves.",
        concepts: [
            "Divide and Conquer Strategy",
            "Recursion",
            "Merging Sorted Arrays",
            "Time Complexity Analysis"
        ],
        lesson: mergeSortLesson
    }
};

const DSAProblemPage = () => {
    const { problemName } = useParams();
    const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
    const problem = problemsData[problemName];

    if (!problem) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Problem Not Found</h1>
                    <p className="text-slate-500 mb-4">This problem is coming soon!</p>
                    <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
                </div>
            </div>
        );
    }

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Hard': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Visualizer View - TRUE FULL SCREEN
    if (isVisualizerOpen) {
        return (
            <div className="fixed inset-0 w-screen h-screen z-50">
                <TeachingEngine lesson={problem.lesson} onClose={() => setIsVisualizerOpen(false)} />
            </div>
        );
    }

    // Problem Detail View
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                            <FaArrowLeft className="text-sm" />
                            <span className="text-sm font-medium">Back to Home</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <HiBookOpen className="text-blue-400" />
                            <span className="text-white/80 text-sm font-medium">EasyLearnova DSA Sheet</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Problem Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                        </span>
                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
                            {problem.category}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        {problem.name}
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Problem #{problem.id} • Sorting Algorithm
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-10 max-w-md mx-auto">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
                            <FaClock className="text-sm" />
                            <span className="text-xs font-medium text-slate-400">Time</span>
                        </div>
                        <p className="text-white font-bold">{problem.timeComplexity}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                            <HiChartBar className="text-sm" />
                            <span className="text-xs font-medium text-slate-400">Space</span>
                        </div>
                        <p className="text-white font-bold">{problem.spaceComplexity}</p>
                    </div>
                </div>

                {/* Description Card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <FaLightbulb className="text-amber-400" />
                        About this Problem
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                        {problem.description}
                    </p>
                </div>

                {/* Concepts */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-10">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <FaCheckCircle className="text-emerald-400" />
                        What You'll Learn
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {problem.concepts.map((concept, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-emerald-400 text-xs">✓</span>
                                </div>
                                <span className="text-slate-300 text-sm">{concept}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                    <button
                        onClick={() => setIsVisualizerOpen(true)}
                        className="group relative inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />

                        <div className="relative flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FaPlay className="text-lg" />
                            </div>
                            <div className="text-left">
                                <span className="block text-xl font-bold">Let's Visualize!</span>
                                <span className="block text-sm text-white/70 font-normal">See the algorithm in action</span>
                            </div>
                            <HiSparkles className="text-2xl text-amber-300 group-hover:animate-pulse" />
                        </div>
                    </button>

                    <p className="mt-6 text-slate-500 text-sm">
                        Watch each step of the algorithm execute with our interactive visualizer
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 mt-16">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-sm">© 2026 EasyLearnova</span>
                        <Link to="/" className="text-slate-400 hover:text-white text-sm transition-colors">
                            ← Back to Code Visualizer
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DSAProblemPage;
