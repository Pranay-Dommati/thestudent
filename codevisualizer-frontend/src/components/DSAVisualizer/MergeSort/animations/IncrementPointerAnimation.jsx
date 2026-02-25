import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IncrementPointerAnimation = ({ pointerName, oldValue, newValue }) => {
    const isI = pointerName === 'i';

    const colorClass = isI
        ? 'text-blue-300 bg-blue-900/40 border-blue-500/30'
        : 'text-amber-300 bg-amber-900/40 border-amber-500/30';

    const valueBg = isI ? 'bg-blue-600/20' : 'bg-amber-600/20';
    const valueBorder = isI ? 'border-blue-500/50' : 'border-amber-500/50';
    const valueText = isI ? 'text-blue-400' : 'text-amber-400';

    return (
        <div className="flex flex-col items-center gap-16 py-12 w-full max-w-2xl select-none">
            {/* Visual Action Area */}
            <div className="flex items-center justify-center gap-10">

                {/* Variable Icon Label */}
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold font-mono border-2 shadow-inner ${colorClass}`}>
                        {pointerName}
                    </div>
                </div>

                <div className="text-4xl text-slate-700 font-light">
                    :
                </div>

                {/* Transformation Box */}
                <div className="flex items-center gap-8 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 shadow-inner">

                    {/* Old Value */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <motion.div
                            className={`absolute w-full h-full rounded-xl border-2 flex items-center justify-center text-2xl font-bold bg-slate-700/50 border-slate-600 text-slate-400`}
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 0.3, scale: 0.8, x: -20 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                            {oldValue}
                        </motion.div>
                    </div>

                    {/* Transition Arrow */}
                    <motion.div
                        className="text-4xl text-slate-500"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        &rarr;
                    </motion.div>

                    {/* New Value */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <motion.div
                            className={`absolute w-full h-full rounded-xl border-2 flex items-center justify-center text-3xl font-black shadow-lg ${valueBg} ${valueBorder} ${valueText}`}
                            initial={{ opacity: 0, scale: 1.5, x: 20 }}
                            animate={{ opacity: 1, scale: 1.2, x: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 12,
                                delay: 0.4
                            }}
                        >
                            {newValue}
                        </motion.div>

                        {/* Glow and Pop Effect */}
                        <motion.div
                            className={`absolute inset-0 rounded-xl blur-md -z-10 ${valueBg}`}
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ opacity: [0, 1, 0], scale: [1, 2, 2.5] }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        />
                    </div>
                </div>
            </div>

            {/* Status Text */}
            <motion.div
                className="text-slate-500 text-sm font-mono tracking-widest uppercase opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                Pointing to next element...
            </motion.div>
        </div>
    );
};

export default IncrementPointerAnimation;
