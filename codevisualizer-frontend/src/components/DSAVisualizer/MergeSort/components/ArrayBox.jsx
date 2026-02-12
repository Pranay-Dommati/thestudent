/**
 * ArrayBox - Single array element display component
 */
import React from 'react';
import { motion } from 'framer-motion';

const ArrayBox = ({ value, state = 'default', delay = 0, isComparing = false, isActive = false }) => {
    const getStyles = () => {
        switch (state) {
            case 'new': return 'bg-blue-500 border-blue-300 text-white shadow-lg shadow-blue-500/30';
            case 'comparing': return 'bg-amber-500 border-amber-300 text-white ring-2 ring-amber-300 shadow-lg shadow-amber-500/40';
            case 'selected': return 'bg-emerald-500 border-emerald-300 text-white shadow-lg shadow-emerald-500/30';
            case 'sorted': return 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 text-white shadow-lg shadow-emerald-500/30';
            case 'active': return 'bg-indigo-500 border-indigo-300 text-white ring-2 ring-indigo-300 shadow-lg shadow-indigo-500/30';
            case 'merging': return 'bg-purple-500 border-purple-300 text-white shadow-lg shadow-purple-500/30';
            default: return 'bg-slate-700 border-slate-500 text-white shadow-md';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{
                opacity: 1,
                scale: isComparing ? 1.15 : isActive ? 1.1 : 1,
                y: 0,
                boxShadow: isComparing ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none'
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, delay, type: 'spring', stiffness: 300 }}
            className={`
                relative w-12 h-12 flex items-center justify-center
                font-mono font-bold text-lg rounded-xl border-2
                transition-all duration-300 shadow-sm
                ${getStyles()}
            `}
        >
            {value}
            {isComparing && (
                <motion.div
                    className="absolute -inset-1 rounded-xl border-2 border-amber-400"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            )}
        </motion.div>
    );
};

export default ArrayBox;
