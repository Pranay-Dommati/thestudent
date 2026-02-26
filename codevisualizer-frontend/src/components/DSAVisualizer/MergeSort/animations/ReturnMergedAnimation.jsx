import React from 'react';
import { motion } from 'framer-motion';

const ReturnMergedAnimation = ({ result, label = null }) => {
    // label: custom JSX or string to show after "return". Defaults to "result".
    const defaultLabel = <span className="text-slate-300">result</span>;
    const returnLabel = label ?? defaultLabel;
    return (
        <div className="flex flex-col items-center gap-12 py-8 w-full max-w-4xl select-none">
            {/* Visual Action Area */}
            <div className="flex flex-col items-center gap-8">

                {/* The Code Line */}
                <motion.div
                    className="font-mono text-2xl flex items-center gap-2 flex-wrap justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-purple-400 font-bold">return</span>
                    {returnLabel}
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
                    </div>
                </div>
            </div>


        </div>
    );
};

export default ReturnMergedAnimation;
