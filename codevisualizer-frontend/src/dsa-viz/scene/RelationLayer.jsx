/**
 * dsa-viz / scene / RelationLayer
 *
 * Draws the comparison WHERE IT HAPPENS — a bracket joining the two slots being
 * compared, with the actual expression and its verdict sitting on top of them.
 *
 * This is the difference between reading "arr[1] > arr[2]?" in a caption at the
 * bottom of the screen and seeing `5 > 1 ✓` bridging the two bars it is about.
 * Reusable by every comparison-driven problem: sorts, binary search, two
 * pointers, sliding window.
 *
 * relation = { a, b, op, lhs, rhs, verdict: true|false|null, yA, yB }
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { palette, springs, motionSafe, durations } from '../theme/tokens';

export default function RelationLayer({ geom, relation, reduced = false }) {
    return (
        <AnimatePresence>
            {relation && <Bracket key={`${relation.a}-${relation.b}-${relation.verdict}`} geom={geom} r={relation} reduced={reduced} />}
        </AnimatePresence>
    );
}

function Bracket({ geom, r, reduced }) {
    const xa = geom.cx(r.a);
    const xb = geom.cx(r.b);
    const barTop = Math.min(r.yA ?? geom.plotTop, r.yB ?? geom.plotTop);
    const y = Math.max(34, barTop - 54);
    const mid = (xa + xb) / 2;

    const yes = r.verdict === true;
    const no = r.verdict === false;
    const stroke = yes ? palette.rose : no ? palette.emerald : palette.indigoBright;
    const fill = yes ? palette.roseSoft : no ? palette.emeraldSoft : palette.indigoSoft;
    const text = yes ? '#ffe4e6' : no ? '#d1fae5' : '#e0e7ff';

    const label = `${r.lhs} ${r.op} ${r.rhs}`;
    const verdictText = r.verdict == null ? '?' : yes ? '✓' : '✗';
    const note = r.note || '';
    const full = note ? `${label}  ${verdictText}  ${note}` : `${label}  ${verdictText}`;
    const w = full.length * 9.6 + 26;

    return (
        <motion.g
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={motionSafe(reduced, { duration: durations.base })}
        >
            <motion.path
                d={`M ${xa} ${(r.yA ?? geom.plotTop) - 10} L ${xa} ${y + 16} L ${xb} ${y + 16} L ${xb} ${(r.yB ?? geom.plotTop) - 10}`}
                fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                strokeOpacity={0.85}
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={motionSafe(reduced, { duration: 0.3, ease: 'easeOut' })}
            />
            <motion.g
                initial={false}
                animate={{ x: mid, y }}
                transition={motionSafe(reduced, springs.pointer)}
            >
                <rect x={-w / 2} y={-17} width={w} height={34} rx={11}
                    fill={fill} stroke={stroke} strokeWidth={2} />
                <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill={text}
                    style={{ fontSize: 16, fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
                    {full}
                </text>
            </motion.g>
        </motion.g>
    );
}
