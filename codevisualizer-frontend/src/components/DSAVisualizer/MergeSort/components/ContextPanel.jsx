/**
 * ContextPanel - Shows current scope's assigned variables (left_sorted, right_sorted)
 */
import React from 'react';
import { motion } from 'framer-motion';

const ContextPanel = ({ leftSorted, rightSorted, stepType }) => {
    // Hide during return_base since those values are from a parent scope
    if (stepType === 'return_base') return null;
    if ((!leftSorted || leftSorted.length === 0) && (!rightSorted || rightSorted.length === 0)) return null;

    return (
        <motion.div
            className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-3 shadow-lg z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="text-xs text-slate-400 uppercase mb-2 font-medium">Current Scope</div>
            <div className="flex flex-col gap-2">
                {/* Show left_sorted if available */}
                {leftSorted && leftSorted.length > 0 && (
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <span className="text-cyan-400 font-mono text-sm font-bold">left_sorted</span>
                        <span className="text-slate-500">=</span>
                        <div className="flex items-center gap-0.5">
                            {leftSorted.map((val, idx) => (
                                <motion.div
                                    key={`ctx-left-${idx}`}
                                    className="w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm bg-cyan-600/80 border border-cyan-400/50 text-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.15 + idx * 0.05, type: "spring" }}
                                >
                                    {val}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
                {/* Show right_sorted if available */}
                {rightSorted && rightSorted.length > 0 && (
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="text-amber-400 font-mono text-sm font-bold">right_sorted</span>
                        <span className="text-slate-500">=</span>
                        <div className="flex items-center gap-0.5">
                            {rightSorted.map((val, idx) => (
                                <motion.div
                                    key={`ctx-right-${idx}`}
                                    className="w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm bg-amber-600/80 border border-amber-400/50 text-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.25 + idx * 0.05, type: "spring" }}
                                >
                                    {val}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default ContextPanel;
