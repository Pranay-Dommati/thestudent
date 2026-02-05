/**
 * InitResultAnimation - Animation for result = [] initialization
 * Shows an empty result array being created in the merge function
 */
import React from 'react';
import { motion } from 'framer-motion';

const InitResultAnimation = ({ leftArray, rightArray }) => {
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
                <span className="text-purple-400 font-bold">result</span>
                <span className="text-slate-500">=</span>
                <span className="text-emerald-400">[]</span>
            </motion.div>

            {/* Visual representation of empty array */}
            <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <span className="text-xs text-purple-400 uppercase">Empty Result Array</span>
                <motion.div
                    className="px-8 py-4 bg-purple-950/40 border-2 border-dashed border-purple-500/50 rounded-xl min-w-[120px] flex justify-center items-center"
                    animate={{
                        borderColor: ['rgba(168,85,247,0.3)', 'rgba(168,85,247,0.7)', 'rgba(168,85,247,0.3)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.span
                        className="text-purple-300 text-sm"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        [ ]
                    </motion.span>
                </motion.div>
            </motion.div>

            {/* Show what will be merged */}
            {(leftArray || rightArray) && (
                <motion.div
                    className="flex flex-col items-center gap-3 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <span className="text-xs text-slate-400">Will merge:</span>
                    <div className="flex items-center gap-4">
                        {leftArray && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-cyan-400">left</span>
                                <div className="flex gap-1">
                                    {leftArray.map((val, idx) => (
                                        <motion.div
                                            key={`preview-left-${idx}`}
                                            className="w-8 h-8 flex items-center justify-center rounded-md text-sm bg-cyan-700/50 border border-cyan-500/30 text-cyan-300"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.9 + idx * 0.05 }}
                                        >
                                            {val}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <span className="text-slate-500 text-xl">+</span>
                        {rightArray && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-amber-400">right</span>
                                <div className="flex gap-1">
                                    {rightArray.map((val, idx) => (
                                        <motion.div
                                            key={`preview-right-${idx}`}
                                            className="w-8 h-8 flex items-center justify-center rounded-md text-sm bg-amber-700/50 border border-amber-500/30 text-amber-300"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1 + idx * 0.05 }}
                                        >
                                            {val}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Explanation */}
            <motion.div
                className="text-sm text-slate-400 text-center max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                📦 Creating empty result array to store merged elements
            </motion.div>
        </motion.div>
    );
};

export default InitResultAnimation;
