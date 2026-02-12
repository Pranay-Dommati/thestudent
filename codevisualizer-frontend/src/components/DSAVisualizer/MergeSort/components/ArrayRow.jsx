/**
 * ArrayRow - Row of array elements display component
 */
import React from 'react';
import { motion } from 'framer-motion';
import ArrayBox from './ArrayBox';

const ArrayRow = ({ id, data, label, state = 'default', highlightIndices = [], comparingIndices = [] }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center gap-2"
    >
        {label && (
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-mono text-slate-300 bg-slate-700 px-2 py-0.5 rounded"
            >
                {label}
            </motion.span>
        )}
        <div className="flex gap-1">
            {data.map((value, idx) => (
                <ArrayBox
                    key={`${id}-${idx}`}
                    value={value}
                    state={highlightIndices.includes(idx) ? 'selected' : state}
                    isComparing={comparingIndices.includes(idx)}
                    delay={idx * 0.05}
                />
            ))}
        </div>
    </motion.div>
);

export default ArrayRow;
