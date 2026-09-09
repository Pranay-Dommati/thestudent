/**
 * dsa-viz / scene / ArrayTrack
 *
 * An array. Elements are identity-stable ({id,v}) so a swap animates as two
 * elements trading slots — Framer interpolates the path, no hand-authored
 * keyframes per problem.
 *
 * Capabilities (all declarative, all reusable by any array problem):
 *   mode         cell | bar          — comes from the geometry object
 *   regions      shaded, labelled spans with a boundary rule (sorted zone,
 *                eliminated range, current window)
 *   marks        per-slot tone + emphasis + an independent tracking `ring`
 *   spotlight    dim everything that isn't in the given set
 *   exchange     { over, under } — the `over` element arcs across the top of
 *                the `under` one and is raised in paint order, so a swap reads
 *                as one value being carried over another rather than two
 *                rectangles blinking
 *   reveal       { from, to } — slots grow up from the baseline, staggered
 *   pulse        { from, to, tone? } — staggered ripple across a span
 *   lock         one slot snaps into its final position with a pulse
 *
 * Between them these cover "something visible happens" for EVERY step of an
 * array algorithm, which is what makes continuous playback read as a film
 * rather than a slideshow with gaps.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Slot from './Slot';
import { toneStyle } from './marks';
import { springs, durations, motionSafe } from '../theme/tokens';

// Spotlight dims the *bars* only — region bands stay lit, so progress (the
// growing sorted wall) never disappears while you focus on a comparison.
const DIM = 0.32;

const inSpan = (s, i) => s && i >= s.from && i <= s.to;

export default function ArrayTrack({
    geom,
    values,
    toneAt = () => 'neutral',
    emphasisAt = () => false,
    ringAt = () => null,
    regions = [],
    exchange = null,
    spotlight = null,
    reveal = null,
    pulse = null,
    lock = null,
    showIndices = true,
    reduced = false,
}) {
    const bar = geom.mode === 'bar';
    const spot = spotlight && spotlight.length ? new Set(spotlight) : null;

    // paint order: the exchanging "over" element renders last so it crosses on
    // top. Keys stay stable, so reordering does not remount or reset motion.
    const order = values.map((el, i) => ({ el, i }));
    if (exchange?.over) {
        const k = order.findIndex((o) => o.el.id === exchange.over);
        if (k >= 0) order.push(order.splice(k, 1)[0]);
    }

    return (
        <g>
            {/* ── region bands ── */}
            <AnimatePresence>
                {regions.map((r) => {
                    const a = Math.max(0, Math.min(r.from, r.to));
                    const b = Math.min(geom.count - 1, Math.max(r.from, r.to));
                    if (b < a) return null;
                    const st = toneStyle(r.tone);
                    const x = geom.x(a) - 7;
                    const w = geom.x(b) + geom.slotW - geom.x(a) + 14;
                    const y = geom.plotTop - 10;
                    const h = geom.plotBottom - geom.plotTop + 20;
                    return (
                        <motion.g key={`region-${r.key || r.tone}`}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={motionSafe(reduced, { duration: durations.base })}>
                            <motion.rect
                                initial={false} animate={{ x, width: w }}
                                transition={motionSafe(reduced, springs.move)}
                                y={y} height={h} rx={16}
                                fill={st.fill} fillOpacity={0.16} stroke={st.stroke} strokeOpacity={0.4}
                            />
                            {r.rule !== false && (
                                <motion.line
                                    initial={false} animate={{ x1: x, x2: x }}
                                    transition={motionSafe(reduced, springs.move)}
                                    y1={y} y2={y + h}
                                    stroke={st.stroke} strokeOpacity={0.75} strokeWidth={2} strokeDasharray="6 6"
                                />
                            )}
                            {r.label && (
                                <motion.text
                                    initial={false} animate={{ x: x + w / 2 }}
                                    transition={motionSafe(reduced, springs.move)}
                                    y={y - 12} textAnchor="middle" fill={st.stroke}
                                    style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.3, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                                >
                                    {r.label}
                                </motion.text>
                            )}
                        </motion.g>
                    );
                })}
            </AnimatePresence>

            {/* ── baseline ── */}
            {bar && (
                <line x1={-10} x2={geom.width + 10} y1={geom.baseline} y2={geom.baseline}
                    stroke="#334155" strokeWidth={2} />
            )}

            {/* ── slots ── */}
            <AnimatePresence>
                {order.map(({ el, i }) => {
                    const isOver = exchange?.over === el.id;
                    const isUnder = exchange?.under === el.id;
                    const h = geom.heightOf(el.v);
                    const top = bar ? geom.baseline - h : geom.plotTop;
                    const dim = spot && !spot.has(i);
                    const isLocked = lock === i;
                    const revealing = inSpan(reveal, i);
                    const pulsing = !revealing && !isLocked && inSpan(pulse, i);
                    // hop height, clamped so a full-height bar never lifts out
                    // of the viewBox
                    const arc = bar
                        ? -Math.min(h * 0.35 + 46, Math.max(18, top - 24))
                        : -26;

                    const anim = {
                        x: geom.x(i),
                        y: isOver ? [0, arc, 0] : 0,
                        opacity: dim ? DIM : 1,
                        scaleY: revealing ? [0.02, 1] : 1,
                        scale: isLocked ? [1, 1.1, 1] : pulsing ? [1, 1.07, 1] : 1,
                    };

                    return (
                        <motion.g
                            key={el.id}
                            initial={{ opacity: 0, x: geom.x(i), y: 0 }}
                            animate={anim}
                            exit={{ opacity: 0 }}
                            style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
                            transition={reduced ? { duration: 0 } : {
                                x: isOver ? { duration: 0.62, ease: [0.4, 0, 0.2, 1] }
                                    : isUnder ? { duration: 0.62, ease: [0.65, 0, 0.35, 1] }
                                        : springs.move,
                                y: isOver ? { duration: 0.62, ease: 'easeInOut' } : { duration: 0.001 },
                                opacity: { duration: durations.base },
                                scaleY: revealing
                                    ? { duration: 0.5, delay: (i - reveal.from) * 0.07, ease: [0.34, 1.25, 0.64, 1] }
                                    : { duration: 0.2 },
                                scale: pulsing
                                    ? { duration: 0.45, delay: (i - pulse.from) * 0.055 }
                                    : { duration: 0.42 },
                            }}
                        >
                            <Slot
                                v={el.v} w={geom.slotW} top={top} h={h}
                                mode={geom.mode}
                                tone={toneAt(i)}
                                emphasis={emphasisAt(i)}
                                ring={ringAt(i)}
                                reduced={reduced}
                            />
                        </motion.g>
                    );
                })}
            </AnimatePresence>

            {/* ── index rail (below the baseline — never collides with pointers) ── */}
            {showIndices && values.map((_, i) => (
                <text key={`idx-${i}`} x={geom.cx(i)} y={geom.indexY} textAnchor="middle"
                    dominantBaseline="central" fill={spot && !spot.has(i) ? '#334155' : '#64748b'}
                    style={{ fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
                    {i}
                </text>
            ))}
        </g>
    );
}
