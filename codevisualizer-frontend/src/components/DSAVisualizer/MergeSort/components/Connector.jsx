/**
 * Connector - Visual connector lines for split/merge operations
 */
import React from 'react';
import { motion } from 'framer-motion';

const Connector = ({ type = 'split' }) => (
    <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        className="flex justify-center py-1"
    >
        <svg width="80" height="24" viewBox="0 0 80 24">
            {type === 'split' ? (
                <>
                    <motion.path
                        d="M 40 0 L 20 22"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                    <motion.path
                        d="M 40 0 L 60 22"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    />
                </>
            ) : (
                <motion.path
                    d="M 20 0 L 40 22 L 60 0"
                    stroke="#10b981"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                />
            )}
        </svg>
    </motion.div>
);

export default Connector;
