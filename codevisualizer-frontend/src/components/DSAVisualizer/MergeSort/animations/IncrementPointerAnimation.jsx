import React from 'react';
import { motion } from 'framer-motion';

const IncrementPointerAnimation = ({ pointerName, newValue }) => {
    const isI = pointerName === 'i';

    // Choose colors based on which pointer (i=blue/left, j=amber/right)
    const colorClass = isI
        ? 'text-blue-300 bg-blue-900/40 border-blue-500/30 shadow-blue-500/20'
        : 'text-amber-300 bg-amber-900/40 border-amber-500/30 shadow-amber-500/20';

    const arrowColor = isI ? 'text-blue-500' : 'text-amber-500';
    const valueColor = isI ? 'text-blue-400' : 'text-amber-400';

    return (
        <div className="flex flex-col items-center gap-12 py-12 w-full max-w-2xl">
            {/* Title Badge */}
            <motion.div
                className={`flex items-center gap-3 px-6 py-3 rounded-xl border shadow-lg font-mono font-bold text-lg ${colorClass}`}
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <span>👉</span>
                <span>Moving {isI ? "left" : "right"} pointer ({pointerName}++)</span>
            </motion.div>

            {/* Visual Action Area */}
            <div className="flex items-center justify-center gap-8 text-4xl font-mono">

                {/* Variable Name */}
                <div className="font-bold text-slate-500">{pointerName}</div>

                {/* Equals */}
                <div className="text-slate-600">=</div>

                {/* Transformation Group */}
                <div className="relative flex items-center justify-center min-w-[120px] h-16">

                    {/* Old Value (fading out and moving left) */}
                    <motion.div
                        className="absolute font-bold text-slate-600"
                        initial={{ x: 0, opacity: 1, scale: 1 }}
                        animate={{ x: -60, opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {newValue - 1}
                    </motion.div>

                    {/* Arrow (appearing) */}
                    <motion.div
                        className={`absolute text-2xl ${arrowColor}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        ➡️
                    </motion.div>

                    {/* New Value (sliding in from right and popping) */}
                    <motion.div
                        className={`absolute font-extrabold ${valueColor}`}
                        initial={{ x: 60, opacity: 0, scale: 1.5 }}
                        animate={{ x: 0, opacity: 1, scale: 1.2 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 0.3
                        }}
                    >
                        {newValue}
                    </motion.div>
                </div>
            </div>

            {/* Context/Explanation */}
            <motion.div
                className="mt-4 text-slate-400 text-sm font-mono flex flex-col items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <span>Updating index for next comparison...</span>
            </motion.div>
        </div>
    );
};

export default IncrementPointerAnimation;
