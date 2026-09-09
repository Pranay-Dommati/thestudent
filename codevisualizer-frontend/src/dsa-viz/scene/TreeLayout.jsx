/**
 * dsa-viz / scene / TreeLayout
 *
 * Pure renderer for a positioned tree. The problem's simulate() assigns x/y
 * (see layoutTree helper) and per-step tone/state; this draws it. Shared by
 * recursion trees now, merge/quick-sort trees later.
 *
 * Props
 *   nodes  [{ id, label, sub, x, y, tone, active }]
 *   edges  [{ id, from:{x,y}, to:{x,y}, state }]
 *   nodeR  number (default 26)
 *   reduced bool
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Edge from './Edge';
import { toneStyle } from './marks';
import { springs, motionSafe, durations } from '../theme/tokens';

export default function TreeLayout({ nodes = [], edges = [], nodeR = 26, reduced = false }) {
    return (
        <g>
            <AnimatePresence>
                {edges.map((e) => (
                    <motion.g key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}>
                        <Edge from={e.from} to={e.to} state={e.state} reduced={reduced} />
                    </motion.g>
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {nodes.map((n) => {
                    const st = toneStyle(n.tone || 'call');
                    return (
                        <motion.g
                            key={n.id}
                            initial={{ opacity: 0, scale: 0.3, x: n.x, y: n.y }}
                            animate={{ opacity: 1, scale: 1, x: n.x, y: n.y }}
                            exit={{ opacity: 0, scale: 0.3 }}
                            transition={motionSafe(reduced, springs.pop)}
                        >
                            {st.glow && (
                                <motion.circle r={nodeR + 4} fill="none" stroke={st.glow}
                                    initial={false}
                                    animate={{ strokeOpacity: n.active ? 0.5 : 0.2, strokeWidth: n.active ? 6 : 3 }}
                                    transition={{ duration: durations.base }} />
                            )}
                            <motion.circle r={nodeR}
                                initial={false}
                                animate={{ fill: st.fill, stroke: st.stroke }}
                                strokeWidth={n.active ? 3 : 2}
                                transition={{ duration: durations.base }} />
                            <motion.text y={n.sub ? -3 : 1} textAnchor="middle" dominantBaseline="central"
                                initial={false} animate={{ fill: st.text }}
                                style={{ fontSize: n.sub ? 13 : 12, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                                {n.label}
                            </motion.text>
                            {n.sub && (
                                <text y={13} textAnchor="middle" dominantBaseline="central" fill={st.text}
                                    style={{ fontSize: 9, opacity: 0.75, fontFamily: 'ui-monospace, monospace' }}>
                                    {n.sub}
                                </text>
                            )}
                        </motion.g>
                    );
                })}
            </AnimatePresence>
        </g>
    );
}

/**
 * layoutTree — simple "width of subtree" tidy layout. Give it a root with
 * `children: []`; it mutates each node with `x`, `y`, and returns { width, height }.
 *
 * @param root      node with .children (array; leaves have [] or undefined)
 * @param opts.levelH   vertical gap between depths
 * @param opts.leafW    min horizontal slot per leaf
 */
export function layoutTree(root, { levelH = 96, leafW = 74 } = {}) {
    let maxDepth = 0;
    const widthOf = (node, depth = 0) => {
        maxDepth = Math.max(maxDepth, depth);
        const kids = node.children || [];
        if (kids.length === 0) { node._w = leafW; return leafW; }
        node._w = kids.reduce((s, k) => s + widthOf(k, depth + 1), 0);
        return node._w;
    };
    widthOf(root);
    const place = (node, left, depth) => {
        const kids = node.children || [];
        node.y = depth * levelH + levelH / 2;
        if (kids.length === 0) { node.x = left + leafW / 2; return; }
        let cursor = left;
        kids.forEach((k) => { place(k, cursor, depth + 1); cursor += k._w; });
        node.x = (kids[0].x + kids[kids.length - 1].x) / 2;
    };
    place(root, 0, 0);
    return { width: root._w, height: (maxDepth + 1) * levelH };
}
