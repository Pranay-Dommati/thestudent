/**
 * SearchArrayVisual — shared array canvas for binary-pointer-style visualizers.
 *
 * Used by: BinarySearchVisualizer, FindPeakElementVisualizer (and any future
 * Binary Search family problem visualizer).
 *
 * Renders: optional topSlot → PointerBadgeRow (L / M / R) → array cells → index row.
 *
 * Cell coloring is fully delegated to the caller via getCellBg so each
 * visualizer can apply its own highlighting semantics.
 *
 * Exported constants (imported by consumers so they never hard-code 40/5):
 *   SEARCH_CELL_W   = 40   (cell width in px)
 *   SEARCH_CELL_H   = 40   (cell height in px)
 *   SEARCH_CELL_GAP = 5    (gap between cells in px)
 */

import React from 'react';
import { motion } from 'framer-motion';
import PointerBadgeRow from './PointerBadgeRow';

export const SEARCH_CELL_W   = 40;
export const SEARCH_CELL_H   = 40;
export const SEARCH_CELL_GAP = 5;

/**
 * SearchArrayVisual
 *
 * Props:
 *   arr          {number[]}             current display array
 *   n            {number}               total element count (for pointer row width)
 *   ev           {object|null}          current event — must contain { left, right, mid }
 *   getCellBg    {(idx, ev) => string}  returns Tailwind className string for each cell
 *   showL        {boolean}              show Left   (emerald) pointer badge
 *   showR        {boolean}              show Right  (rose)    pointer badge
 *   showM        {boolean}              show Mid    (sky)     pointer badge
 *   showM1       {boolean}              show Mid+1  (amber)   pointer badge
 *   blink        {boolean}              pulse both L/R badges together (e.g. while-check)
 *   topSlot      {ReactNode}            node rendered above the pointer row (e.g. target box)
 *   shimmerIdx    {number|null}          cell index that gets the shimmer-border CSS effect
 *   shimmerIdxs   {number[]|null}        multiple cell indices that each get the shimmer-border effect
 *   shimmerColors {Object|null}          map of index→'green'|'amber' to pick shimmer colour per cell
 */
const SearchArrayVisual = ({
    arr,
    n,
    ev,
    getCellBg,
    showL        = false,
    showR        = false,
    showM        = false,
    showM1       = false,
    blink        = false,
    topSlot      = null,
    shimmerIdx   = null,
    shimmerIdxs  = null,
    shimmerColors = null,
    rLabel       = 'R',
}) => {
    if (!arr || arr.length === 0) return null;

    const left  = ev?.left ?? 0;
    const right = ev?.right ?? n - 1;
    const mid   = ev?.mid  ?? null;
    const mid1  = (showM1 && mid !== null && mid + 1 < n) ? mid + 1 : null;

    return (
        <div className="flex flex-col items-center gap-0">

            {/* Optional slot above pointer row — e.g. target badge in Binary Search */}
            {topSlot}

            {/* Pointer badges: L (emerald), R (rose), M (sky) */}
            <PointerBadgeRow
                cellW={SEARCH_CELL_W}
                cellGap={SEARCH_CELL_GAP}
                count={n}
                iRel={showL ? left  : null}
                jRel={showR ? right : null}
                j1Rel={showM ? mid  : null}
                j2Rel={mid1}
                iClass="bg-emerald-500"
                jClass="bg-rose-500"
                j1Class="bg-sky-500"
                j2Class="bg-amber-400"
                iLabel="L"
                jLabel={rLabel}
                j1Label="M"
                j2Label="M+1"
                blink={blink}
            />

            {/* Array cell box */}
            <div
                className="flex flex-col rounded-xl border-2 border-slate-600 bg-slate-800/60"
                style={{ padding: '10px 16px' }}
            >
                <div className="flex items-center" style={{ gap: SEARCH_CELL_GAP }}>
                    {arr.map((val, idx) => {
                        const shimmerSet = shimmerIdxs ? new Set(shimmerIdxs) : null;
                        const isShimmer = (shimmerIdx !== null && idx === shimmerIdx) || (shimmerSet !== null && shimmerSet.has(idx));
                        const shimmerColor = shimmerColors?.[idx] ?? 'amber';
                        const shimmerClass = shimmerColor === 'green' ? 'shimmer-border-green' : 'shimmer-border';
                        const innerBg = shimmerColor === 'green' ? 'bg-emerald-500' : 'bg-sky-500';
                        return isShimmer ? (
                            /* Shimmer effect — used in Binary Search at the if arr[mid]==target check */
                            <div
                                key={idx}
                                className={`${shimmerClass} flex-shrink-0`}
                                style={{
                                    width: SEARCH_CELL_W, height: SEARCH_CELL_H,
                                    minWidth: SEARCH_CELL_W, borderRadius: 8, padding: 2,
                                }}
                            >
                                <div className={`flex items-center justify-center rounded-[6px] ${innerBg} text-white text-sm font-bold w-full h-full`}>
                                    {val}
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                key={idx}
                                layout
                                className={`flex items-center justify-center rounded-lg border-2 text-sm font-bold flex-shrink-0 select-none transition-colors duration-300 ${getCellBg(idx, ev)}`}
                                style={{ width: SEARCH_CELL_W, height: SEARCH_CELL_H, minWidth: SEARCH_CELL_W }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0 }}
                            >
                                {val}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Index row */}
            <div className="flex items-center mt-1" style={{ gap: SEARCH_CELL_GAP }}>
                {arr.map((_, idx) => (
                    <div
                        key={idx}
                        style={{ width: SEARCH_CELL_W }}
                        className="flex justify-center text-[10px] text-slate-600 font-mono select-none"
                    >
                        {idx}
                    </div>
                ))}
            </div>

        </div>
    );
};

export default SearchArrayVisual;
