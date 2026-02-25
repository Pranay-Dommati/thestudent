import React from 'react';
import { motion } from 'framer-motion';

const AppendAnimation = ({ value, source, currentResult }) => {
    // Determine source color for styling
    const isLeft = source === 'left';
    const colorClass = isLeft
        ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-500/50'
        : 'bg-amber-600 border-amber-400 text-white shadow-amber-500/50';

    const borderColor = isLeft ? 'border-cyan-500/30' : 'border-amber-500/30';
    const bgColor = isLeft ? 'bg-cyan-900/30' : 'bg-amber-900/30';
    const textColor = isLeft ? 'text-cyan-300' : 'text-amber-300';

    return (
        <div className="flex flex-col items-center gap-8 py-4 w-full max-w-4xl">
            {/* The Animation Area */}
            <div className="relative flex flex-col items-center justify-center min-h-[200px] w-full">

                {/* Result Array Container */}
                <div className="flex items-center gap-2 mb-12">
                    <span className="text-xs text-purple-400 font-mono uppercase mr-4 self-center">result: </span>

                    <div className="flex items-center gap-1 p-2 rounded-xl bg-purple-900/20 border border-purple-500/30 min-h-[60px] min-w-[100px]">
                        <span className="text-purple-500 font-mono text-2xl">[</span>

                        {/* Map existing elements */}
                        {currentResult && currentResult.map((val, idx) => (
                            <motion.div
                                key={`res-${idx}`}
                                className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base bg-purple-600 border border-purple-400 text-white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {val}
                            </motion.div>
                        ))}

                        {/* The New Value dropping in */}
                        <motion.div
                            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base border-2 ${colorClass}`}
                            initial={{ opacity: 0, y: -60, width: 0, marginLeft: 0 }}
                            animate={{ opacity: 1, y: 0, width: 40, marginLeft: 4 }}
                            transition={{
                                type: "spring",
                                damping: 12,
                                stiffness: 100,
                                duration: 0.8
                            }}
                        >
                            {value}
                        </motion.div>

                        <span className="text-purple-500 font-mono text-2xl">]</span>
                    </div>
                </div>
            </div>

            {/* Context/Explanation */}
            <motion.div
                className="mt-4 text-slate-400 text-sm font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                result.append({value})
            </motion.div>
        </div>
    );
};

export default AppendAnimation;
