import React from 'react';
import { motion } from 'framer-motion';

const CompareAnimation = ({ leftVal, rightVal, i, j }) => {
    // Determine the result of the comparison
    const isLeftSmaller = leftVal <= rightVal;

    return (
        <div className="flex flex-col items-center gap-8 py-8">
            {/* Main Title/Status */}
            <motion.div
                className="text-lg font-mono font-bold text-amber-300 bg-slate-800/80 px-6 py-2 rounded-xl border border-amber-500/30 shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                Comparing Elements
            </motion.div>

            {/* Comparison Area */}
            <div className="flex items-center gap-12">
                {/* Left Element */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider">left[{i}]</span>
                    <motion.div
                        className={`w-20 h-20 flex items-center justify-center rounded-2xl font-bold text-3xl border-4 shadow-2xl ${isLeftSmaller
                            ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-500/50'
                            : 'bg-slate-700 border-slate-500 text-slate-400'
                            }`}
                        initial={{ x: -100, opacity: 0, rotate: -45 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    >
                        {leftVal}
                    </motion.div>
                </div>

                {/* Operator */}
                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        className="text-4xl font-bold text-slate-400"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                    >
                        &le;
                    </motion.div>
                    <motion.div
                        className={`px-3 py-1 rounded text-sm font-bold ${isLeftSmaller ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        {isLeftSmaller ? "TRUE" : "FALSE"}
                    </motion.div>
                </div>

                {/* Right Element */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-amber-400 font-mono uppercase tracking-wider">right[{j}]</span>
                    <motion.div
                        className={`w-20 h-20 flex items-center justify-center rounded-2xl font-bold text-3xl border-4 shadow-2xl ${!isLeftSmaller
                            ? 'bg-amber-600 border-amber-400 text-white shadow-amber-500/50'
                            : 'bg-slate-700 border-slate-500 text-slate-400'
                            }`}
                        initial={{ x: 100, opacity: 0, rotate: 45 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    >
                        {rightVal}
                    </motion.div>
                </div>
            </div>

            {/* Explanation/Outcome */}
            <motion.div
                className="flex flex-col items-center gap-2 mt-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
            >
                <div className="text-slate-300 text-lg text-center max-w-md">
                    Since <span className="font-bold text-white">{leftVal}</span> is {isLeftSmaller ? 'less than or equal to' : 'greater than'} <span className="font-bold text-white">{rightVal}</span>...
                </div>

                <motion.div
                    className={`px-6 py-3 rounded-lg font-mono font-bold text-lg flex items-center gap-2 ${isLeftSmaller
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'}`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {isLeftSmaller ? (
                        <>
                            <span>append left[{i}]</span>
                            <span className="text-2xl">⬇</span>
                        </>
                    ) : (
                        <>
                            <span>append right[{j}]</span>
                            <span className="text-2xl">⬇</span>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default CompareAnimation;
