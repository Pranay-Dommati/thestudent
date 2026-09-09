/**
 * dsa-viz / scene / PointerLayer
 *
 * Labelled pointers (i, j, lo, mid, hi, slow, fast…) that dock to a slot and
 * spring horizontally as their index changes. Pointers sharing a slot + side
 * stack away from the array instead of overlapping — the whole collision story
 * is one groupBy here instead of PointerBadgeRow's ~150 lines of pixel maths.
 *
 * The badge sits BELOW the array by default and its arrow points UP at the
 * column it means, with a dashed guide running to the baseline (split around
 * the index rail so it never strikes through a digit). `side: 'top'` flips
 * both the placement and the arrow.
 *
 * ── Why placement is a pure function ────────────────────────────────────────
 * `placePointers` below owns ALL the geometry; the component only draws what it
 * returns. Framer does not emit its transforms during server rendering, so
 * markup inspection cannot tell you where a badge actually landed — a bug where
 * the group was translated in x but not y put every badge at the top of the
 * canvas while its guide line stayed correctly next to the array, and rendering
 * tests happily passed. Keeping placement pure makes that class of bug
 * assertable without a browser. Any new layer should follow the same shape.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toneStyle } from './marks';
import { springs, motionSafe, palette } from '../theme/tokens';

const BADGE_HALF = 13;
const ARROW = 19;

/**
 * placePointers — pure. Resolves side/stacking and returns, for each pointer,
 * its group origin plus every child coordinate in LOCAL space (relative to that
 * origin). Nothing the component draws may use absolute geometry values.
 *
 * @returns [{ id, label, tone, index, side, depth, x, y, w,
 *             arrowTip, arrow, guide: [[y1,y2]], arrayEdge }]
 */
export function placePointers(geom, pointers = []) {
    const seen = {};
    return pointers.map((p) => {
        const side = p.side || 'bottom';
        const key = `${side}:${p.index}`;
        const depth = seen[key] || 0;
        seen[key] = depth + 1;

        const top = side === 'top';
        const y = geom.ptrY(side, depth);
        const local = (abs) => abs - y;

        // the array edge this pointer is aiming at, and a small breathing gap
        const arrayEdge = top ? geom.plotTop - 6 : geom.baseline + 4;
        const arrowTip = top ? ARROW : -ARROW;

        // dashed guide from the badge to the array, split around the index rail
        // so it never strikes through a digit
        const guide = p.guide === false || depth > 0
            ? []
            : top
                ? [[arrowTip, local(arrayEdge)]]
                : [
                    [arrowTip, local(geom.indexY + 11)],
                    [local(geom.indexY - 11), local(arrayEdge)],
                ];

        // an out-of-range probe: the value the loop variable WOULD have taken,
        // drawn muted and beyond its brace so the reason the loop stopped is
        // visible rather than inferred. The label stays fully legible — the ✗
        // sits beside it, never through it.
        const invalid = !!p.invalid;
        const display = invalid ? `${p.label} ✗` : String(p.label);

        return {
            id: p.id,
            label: String(p.label),
            display,
            tone: p.tone || 'pointerMid',
            invalid,
            index: p.index,
            side, depth, top,
            x: geom.cx(p.index),
            y,
            w: Math.max(26, display.length * 9 + 16),
            arrowTip,
            arrow: top ? 'M -6 11 L 6 11 L 0 19 Z' : 'M -6 -11 L 6 -11 L 0 -19 Z',
            guide,
            arrayEdge,
        };
    });
}

export default function PointerLayer({ geom, pointers = [], reduced = false }) {
    const placed = placePointers(geom, pointers);

    return (
        <AnimatePresence>
            {placed.map((p) => {
                const st = toneStyle(p.tone);
                return (
                    <motion.g
                        key={p.id}
                        initial={{ opacity: 0, x: p.x, y: p.y }}
                        animate={{ opacity: 1, x: p.x, y: p.y }}
                        exit={{ opacity: 0 }}
                        transition={motionSafe(reduced, { ...springs.pointer, opacity: { duration: 0.15 } })}
                    >
                        {p.guide.map(([y1, y2], k) => (
                            <line key={k} x1={0} x2={0} y1={y1} y2={y2}
                                stroke={st.stroke} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="3 4" />
                        ))}
                        <rect x={-p.w / 2} y={-BADGE_HALF} width={p.w} height={BADGE_HALF * 2} rx={8}
                            fill={p.invalid ? palette.surfaceRaise : st.fill}
                            stroke={st.stroke} strokeWidth={1.5}
                            strokeDasharray={p.invalid ? '5 4' : undefined} />
                        <text x={0} y={1} textAnchor="middle" dominantBaseline="central"
                            fill={p.invalid ? st.stroke : st.text}
                            style={{ fontSize: 13, fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
                            {p.display}
                        </text>
                        <path d={p.arrow}
                            fill={p.invalid ? palette.surfaceRaise : st.fill}
                            stroke={st.stroke} strokeWidth={1} />
                    </motion.g>
                );
            })}
        </AnimatePresence>
    );
}
