/**
 * dsa-viz / scene / SpanLayer
 *
 * A dimension brace under the array — the drafting-drawing convention for
 * "this range, this big":
 *
 *      |—————————— n = 6 ——————————|
 *      |———— j: 0 → 4 ————|
 *
 * This is how an abstract bound becomes a thing you can see. `n - i - 1` stops
 * being arithmetic and becomes a bracket that visibly shortens each pass.
 * Reusable for any range a problem talks about: n, a loop's reach, a sliding
 * window's width, a subarray, lo..hi.
 *
 * spans: [{ id, from, to, label, tone }]
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toneStyle } from './marks';
import { springs, motionSafe, durations } from '../theme/tokens';

export default function SpanLayer({ geom, spans = [], reduced = false }) {
    return (
        <AnimatePresence>
            {spans.map((s) => {
                const a = Math.max(0, Math.min(s.from, s.to));
                const b = Math.min(geom.count - 1, Math.max(s.from, s.to));
                if (b < a) return null;
                const st = toneStyle(s.tone || 'active');
                const x1 = geom.x(a) + 4;
                const x2 = geom.x(b) + geom.slotW - 4;
                const y = geom.spanY;
                const mid = (x1 + x2) / 2;
                const w = String(s.label).length * 8.4 + 20;

                return (
                    <motion.g
                        key={s.id}
                        initial={reduced ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={motionSafe(reduced, { duration: durations.base })}
                    >
                        {/* rule + end ticks, animated so the brace visibly
                            shortens when the range shrinks */}
                        <motion.line
                            initial={false} animate={{ x1, x2 }}
                            transition={motionSafe(reduced, springs.move)}
                            y1={y} y2={y} stroke={st.stroke} strokeWidth={2} strokeOpacity={0.8} />
                        <motion.line
                            initial={false} animate={{ x1, x2: x1 }}
                            transition={motionSafe(reduced, springs.move)}
                            y1={y - 7} y2={y + 7} stroke={st.stroke} strokeWidth={2} strokeOpacity={0.8} />
                        <motion.line
                            initial={false} animate={{ x1: x2, x2 }}
                            transition={motionSafe(reduced, springs.move)}
                            y1={y - 7} y2={y + 7} stroke={st.stroke} strokeWidth={2} strokeOpacity={0.8} />

                        <motion.g initial={false} animate={{ x: mid, y }}
                            transition={motionSafe(reduced, springs.move)}>
                            <rect x={-w / 2} y={-13} width={w} height={26} rx={8}
                                fill={st.fill} stroke={st.stroke} strokeWidth={1.5} />
                            <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill={st.text}
                                style={{ fontSize: 14, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                                {s.label}
                            </text>
                        </motion.g>
                    </motion.g>
                );
            })}
        </AnimatePresence>
    );
}
