/**
 * InitPointersAnimation - Animation for i = j = 0 initialization
 * Shows pointer variables being initialized for the merge function
 */
import React from 'react';
import { motion } from 'framer-motion';

const InitPointersAnimation = ({ leftArray, rightArray }) => {
    return (
        <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Code expression */}
            <motion.div
                className="flex items-center gap-2 text-lg font-mono"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <span className="text-cyan-400 font-bold">i</span>
                <span className="text-slate-500">=</span>
                <span className="text-amber-400 font-bold">j</span>
                <span className="text-slate-500">=</span>
                <span className="text-emerald-400 font-bold">0</span>
            </motion.div>

            {/* Arrays with pointer indicators */}
            {(leftArray || rightArray) && (
                <motion.div
                    className="flex items-start gap-8 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    {/* Left array with i pointer */}
                    {leftArray && leftArray.length > 0 && (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-xs text-cyan-400">left</span>
                            <div className="flex gap-1">
                                {leftArray.map((val, idx) => (
                                    <motion.div
                                        key={`left-${idx}`}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm border-2
                                            ${idx === 0
                                                ? 'bg-cyan-600 border-cyan-400 text-white ring-2 ring-cyan-300'
                                                : 'bg-slate-700 border-slate-500 text-slate-300'
                                            }`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1 + idx * 0.05 }}
                                    >
                                        {val}
                                    </motion.div>
                                ))}
                            </div>
                            {/* Pointer arrow */}
                            <motion.div
                                className="flex flex-col items-start w-full pl-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                            >
                                <motion.span
                                    className="text-cyan-400 text-lg"
                                    animate={{ y: [-2, 2, -2] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                    ↑
                                </motion.span>
                                <span className="text-cyan-400 text-xs font-mono">i=0</span>
                            </motion.div>
                        </div>
                    )}

                    {/* Right array with j pointer */}
                    {rightArray && rightArray.length > 0 && (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-xs text-amber-400">right</span>
                            <div className="flex gap-1">
                                {rightArray.map((val, idx) => (
                                    <motion.div
                                        key={`right-${idx}`}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm border-2
                                            ${idx === 0
                                                ? 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300'
                                                : 'bg-slate-700 border-slate-500 text-slate-300'
                                            }`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.1 + idx * 0.05 }}
                                    >
                                        {val}
                                    </motion.div>
                                ))}
                            </div>
                            {/* Pointer arrow */}
                            <motion.div
                                className="flex flex-col items-start w-full pl-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                            >
                                <motion.span
                                    className="text-amber-400 text-lg"
                                    animate={{ y: [-2, 2, -2] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                                >
                                    ↑
                                </motion.span>
                                <span className="text-amber-400 text-xs font-mono">j=0</span>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Explanation */}
            <motion.div
                className="text-sm text-slate-400 text-center max-w-md mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
            >
                👆 Initializing pointers to track positions in both arrays during merge
            </motion.div>
        </motion.div>
    );
};

export default InitPointersAnimation;
