import React from 'react';
import { motion } from 'framer-motion';

const LoopConditionAnimation = ({ i, j, leftLen, rightLen }) => {
    // Determine the results of the conditions
    const isLeftValid = i < leftLen;
    const isRightValid = j < rightLen;
    const isLoopValid = isLeftValid && isRightValid;

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Main Title/Status */}
            <motion.div
                className="text-lg font-mono font-bold text-indigo-300 bg-slate-800/80 px-4 py-2 rounded-xl border border-indigo-500/30 shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                Checking Loop Condition
            </motion.div>

            <div className="flex items-center gap-8">
                {/* Condition 1: i < len(left) */}
                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        className="flex items-center gap-2 font-mono text-xl"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        <span className="text-cyan-400 font-bold">i</span>
                        <span className="text-slate-500">&lt;</span>
                        <span className="text-slate-400">len(</span>
                        <span className="text-emerald-400">left</span>
                        <span className="text-slate-400">)</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-2 text-lg bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <span className="text-cyan-300">{i}</span>
                        <span className="text-slate-500">&lt;</span>
                        <span className="text-emerald-300">{leftLen}</span>
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={`text-2xl font-bold ${isLeftValid ? 'text-green-500' : 'text-red-500'}`}
                    >
                        {isLeftValid ? 'TRUE' : 'FALSE'}
                    </motion.div>
                </div>

                {/* AND Operator */}
                <motion.div
                    className="text-slate-500 font-bold text-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                >
                    AND
                </motion.div>

                {/* Condition 2: j < len(right) */}
                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        className="flex items-center gap-2 font-mono text-xl"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className="text-amber-400 font-bold">j</span>
                        <span className="text-slate-500">&lt;</span>
                        <span className="text-slate-400">len(</span>
                        <span className="text-orange-400">right</span>
                        <span className="text-slate-400">)</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-2 text-lg bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <span className="text-amber-300">{j}</span>
                        <span className="text-slate-500">&lt;</span>
                        <span className="text-orange-300">{rightLen}</span>
                    </motion.div>

                    {/* Only show result for second condition if we get to evaluate it (technically short-circuit, but visuals usually show both if checking loop) */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className={`text-2xl font-bold ${isRightValid ? 'text-green-500' : 'text-red-500'}`}
                    >
                        {isRightValid ? 'TRUE' : 'FALSE'}
                    </motion.div>
                </div>
            </div>

            {/* Overall Result */}
            <motion.div
                className={`mt-4 px-6 py-3 rounded-xl text-xl font-bold border-2 ${isLoopValid
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                    }`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
            >
                {isLoopValid ? 'LOOP CONTINUES' : 'LOOP TERMINATES'}
            </motion.div>
        </div>
    );
};

export default LoopConditionAnimation;
