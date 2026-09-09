/**
 * dsa-viz / scene / Slot — one array element. Works for both geometry modes:
 * an equal-size cell, or a bar whose HEIGHT encodes the value.
 *
 * Fill/stroke/text animate between tones. Two optional decorations:
 *   glow  — from the tone itself (`emphasis` thickens it)
 *   ring  — an independent second outline in another tone, used to keep tracking
 *           one element ("the value being carried") while its fill says
 *           something else ("currently comparing").
 *
 * Drawn in the parent group's local space; the caller positions it in x.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { toneStyle } from './marks';
import { durations, motionSafe } from '../theme/tokens';

export default function Slot({
    v, w, top, h, tone = 'neutral', emphasis = false, ring = null,
    mode = 'cell', reduced = false, radius = 12,
}) {
    const s = toneStyle(tone);
    const r = ring ? toneStyle(ring) : null;
    const t = motionSafe(reduced, { duration: durations.base });
    const labelY = mode === 'bar' ? top + Math.min(24, h / 2 + 2) : top + h / 2 + 1;
    const fontSize = mode === 'bar' ? Math.min(20, Math.max(12, w * 0.34)) : Math.round(h * 0.4);

    return (
        <g>
            {/* tracking ring — sits outside the shape, independent of fill */}
            {r && (
                <motion.rect
                    x={-5} y={top - 5} width={w + 10} height={h + 10} rx={radius + 5}
                    fill="none" stroke={r.stroke}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, strokeWidth: 3 }}
                    exit={{ opacity: 0 }}
                    strokeDasharray="7 5"
                    transition={motionSafe(reduced, { duration: durations.base })}
                />
            )}

            {s.glow && (
                <motion.rect
                    x={-3} y={top - 3} width={w + 6} height={h + 6} rx={radius + 3}
                    fill="none" stroke={s.glow}
                    initial={false}
                    animate={{ strokeOpacity: emphasis ? 0.6 : 0.26, strokeWidth: emphasis ? 8 : 4 }}
                    transition={motionSafe(reduced, { duration: durations.base })}
                />
            )}

            <motion.rect
                width={w} height={h} y={top} rx={radius}
                initial={false}
                animate={{ fill: s.fill, stroke: s.stroke }}
                transition={t}
                strokeWidth={2}
            />

            <motion.text
                x={w / 2} y={labelY}
                textAnchor="middle" dominantBaseline="central"
                initial={false}
                animate={{ fill: s.text }}
                transition={t}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700, fontSize }}
            >
                {v}
            </motion.text>
        </g>
    );
}
