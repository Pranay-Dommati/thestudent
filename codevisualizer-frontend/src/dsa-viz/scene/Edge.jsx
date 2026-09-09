/**
 * dsa-viz / scene / Edge — one connector between two points. Shared by trees,
 * linked lists and graphs. `state` drives colour: 'pending' | 'active' | 'done'.
 * `draw` animates the stroke in on mount (pathLength).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { toneStyle } from './marks';
import { durations, motionSafe } from '../theme/tokens';

const STATE_TONE = { pending: 'edgePending', active: 'edgeActive', done: 'edgeDone' };

export default function Edge({
    from, to, state = 'pending', width = 2.5, draw = true, dashed = false, reduced = false,
}) {
    const st = toneStyle(STATE_TONE[state] || 'edgePending');
    const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={st.stroke}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={dashed ? '4 5' : undefined}
            initial={draw && !reduced ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 1, stroke: st.stroke }}
            transition={motionSafe(reduced, { pathLength: { duration: durations.base }, stroke: { duration: durations.base } })}
        />
    );
}
