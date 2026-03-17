/**
 * TreeCanvas — shared scrollable SVG+HTML canvas for recursive call-tree visualizers.
 *
 * Renders:
 *  - Outer scroll container (ref={scrollRef})
 *  - Inner scale div (transform: scale(canvasZoom))
 *  - SVG layer: animated edges (indigo → emerald when done) + optional svgExtras slot
 *  - HTML layer: children (caller renders the actual nodes)
 *
 * Used by: FibonacciVisualizer, FactorialVisualizer, SubsetsVisualizer
 *
 * Props:
 *  scrollRef   {ref}        — outer scroll container ref (from useTreeCanvas)
 *  canvasW     {number}     — canvas width in px
 *  canvasH     {number}     — canvas height in px
 *  canvasZoom  {number}     — scale factor (from useTreeCanvas)
 *  edgeList    {Array}      — [{ key, x1, y1, x2, y2, done }]
 *  strokeWidth {number}     — edge stroke width (default 1.8)
 *  svgExtras   {ReactNode}  — optional SVG children rendered after edges (e.g. text labels)
 *  centered    {boolean}    — wrap inner div in flex justify-center (for linear chains)
 *  children    {ReactNode}  — HTML node layer (AnimatePresence + motion.divs from caller)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TreeCanvas = ({
    scrollRef,
    canvasW,
    canvasH,
    canvasZoom,
    edgeList,
    strokeWidth = 1.8,
    svgExtras   = null,
    centered    = false,
    children,
}) => {
    const inner = (
        <div
            style={{
                transform: `scale(${canvasZoom})`,
                transformOrigin: centered ? 'top center' : 'top left',
                width: canvasW,
                height: canvasH,
                position: 'relative',
                flexShrink: 0,
            }}
        >
            {/* SVG layer: animated edges */}
            <svg
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
                width={canvasW}
                height={canvasH}
            >
                <AnimatePresence>
                    {edgeList.map(e => (
                        <motion.line
                            key={e.key}
                            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                            stroke={e.stroke ?? (e.done ? '#10b981' : '#6366f1')}
                            strokeWidth={e.strokeWidth ?? strokeWidth}
                            markerEnd={e.markerEnd}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                    ))}
                </AnimatePresence>
                {svgExtras}
            </svg>

            {/* HTML layer: caller-rendered nodes */}
            {children}
        </div>
    );

    return (
        <div ref={scrollRef} className="flex-1 overflow-auto">
            {centered ? <div className="flex justify-center">{inner}</div> : inner}
        </div>
    );
};

export default TreeCanvas;
