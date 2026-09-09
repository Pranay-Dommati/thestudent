/**
 * dsa-viz / scene / BadgeLayer — free-floating labelled chips ("mid = 3",
 * "sum = 7", "return 1"). The Scene resolves each badge's anchor to an {x,y}
 * and passes it here.
 *
 * Props: badges [{ id, text, x, y, tone }], reduced
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toneStyle } from './marks';
import { springs, motionSafe } from '../theme/tokens';

export default function BadgeLayer({ badges = [], reduced = false }) {
    return (
        <AnimatePresence>
            {badges.map((b) => {
                const st = toneStyle(b.tone || 'active');
                const w = Math.max(28, b.text.length * 7.5 + 16);
                return (
                    <motion.g
                        key={b.id}
                        initial={{ opacity: 0, scale: 0.7, x: b.x, y: b.y }}
                        animate={{ opacity: 1, scale: 1, x: b.x, y: b.y }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={motionSafe(reduced, springs.pop)}
                    >
                        <rect x={-w / 2} y={-13} width={w} height={26} rx={8}
                            fill={st.fill} stroke={st.stroke} strokeWidth={1.5} />
                        <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill={st.text}
                            style={{ fontSize: 12, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                            {b.text}
                        </text>
                    </motion.g>
                );
            })}
        </AnimatePresence>
    );
}
