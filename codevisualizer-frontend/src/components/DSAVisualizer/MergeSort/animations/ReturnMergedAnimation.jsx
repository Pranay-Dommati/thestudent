import React from 'react';
import { motion } from 'framer-motion';

const ReturnMergedAnimation = ({ result }) => {
    return (
        <div className="flex flex-col items-center gap-12 py-8 w-full max-w-4xl select-none">
            {/* Celebration Badge */}
            <motion.div
                className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-900/40 text-emerald-300 shadow-2xl shadow-emerald-500/20 font-mono font-bold text-xl"
                initial={{ opacity: 0, scale: 0.8, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 15 }}
            >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </div>
                <span>Merge Complete: Returning Result</span>
            </motion.div>

            {/* Visual Action Area */}
            <div className="flex flex-col items-center gap-8">

                {/* The Code Line */}
                <motion.div
                    className="font-mono text-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-purple-400 font-bold">return</span>
                    <span className="ml-3 text-slate-300">result</span>
                </motion.div>

                {/* The Array being returned */}
                <div className="relative flex flex-col items-center gap-6">
                    <motion.div
                        className="p-6 bg-slate-800/80 border-2 border-indigo-500/40 rounded-3xl shadow-inner-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-slate-950/50">
                            {result && result.map((val, idx) => (
                                <motion.div
                                    key={`ret-val-${idx}`}
                                    className="w-14 h-14 flex items-center justify-center rounded-xl font-black text-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-300 text-white shadow-lg"
                                    initial={{ opacity: 0, scale: 0, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    transition={{
                                        delay: 0.7 + idx * 0.1,
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20
                                    }}
                                >
                                    {val}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Upward Animation Effect */}
                    <div className="flex flex-col items-center gap-2">
                        <motion.div
                            className="text-emerald-400 text-3xl"
                            animate={{ y: [-10, 10, -10], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            ▲
                        </motion.div>
                        <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">Returning to Sort Frame</span>
                    </div>
                </div>
            </div>

            {/* Context Message */}
            <motion.div
                className="text-slate-400 text-center max-w-md italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
            >
                This sorted subarray will now be used by the higher-level recursion...
            </motion.div>
        </div>
    );
};

export default ReturnMergedAnimation;
