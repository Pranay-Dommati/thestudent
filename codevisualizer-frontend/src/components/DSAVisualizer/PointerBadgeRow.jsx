/**
 * PointerBadgeRow — shared spring-sliding pointer badge row
 *
 * Renders up to two pointer badges (e.g. i & j) above an array.
 * Features:
 *  - Spring-slide animation for both badges
 *  - Collision handling: when i and j land on the same cell, both shrink
 *    and sit side-by-side so they both remain visible within the cell width
 *  - Off-left-edge support: jRel = -1 slides badge off the left boundary
 *  - Optional extra label pill (e.g. "low" / "high" used in QuickSort recurse)
 *    — handled gracefully when it collides with i or j
 *  - Configurable badge colours via Tailwind class strings
 *  - Optional blink animation (used in QuickSort while_outer / if_swap phases)
 *
 * Props:
 *  cellW       {number}  — width of each array cell (px)
 *  cellGap     {number}  — gap between cells (px)
 *  count       {number}  — total number of cells (used to compute row width)
 *  iRel        {number|null} — position of i badge (relative cell index), null = hidden
 *  jRel        {number|null} — position of j badge, null = hidden, -1 = off left edge
 *  iClass      {string}  — Tailwind bg class for i badge  (default: 'bg-sky-500')
 *  jClass      {string}  — Tailwind bg class for j badge  (default: 'bg-pink-600')
 *  blink       {boolean} — when true both badges pulse opacity
 *  extraLabel  {{ rel: number, text: string }|null}
 *              — optional pill label drawn at extraLabel.rel cell index
 */

import React from 'react';
import { motion } from 'framer-motion';

const BADGE    = 20;   // normal badge diameter (px)
const BADGE_SM = 16;   // shrunken diameter when two badges share a cell
const LABEL_W  = 22;   // estimated width of an extra pill label at normal size
const LABEL_SM = 18;   // pill width when collision-shrunken
const PAIR_GAP = 2;    // gap between two badges that share a cell

const PointerBadgeRow = ({
    cellW      = 40,
    cellGap    = 4,
    count      = 0,
    iRel       = null,
    jRel       = null,
    j1Rel      = null,   // j+1 pointer (third badge)
    j2Rel      = null,   // fourth badge (e.g. mid+1 in Find Peak Element)
    iClass     = 'bg-sky-500',
    jClass     = 'bg-pink-600',
    j1Class    = 'bg-yellow-400',
    j2Class    = 'bg-amber-400',
    iLabel     = 'i',
    jLabel     = 'j',
    j1Label    = 'j+1',
    j2Label    = 'M+1',
    blink      = false,
    jBlink     = false,   // blink only j badge (e.g. OOB in InsertionSort)
    extraLabel = null,   // { rel, text }
}) => {
    const hasPointers = iRel !== null || jRel !== null || j1Rel !== null || j2Rel !== null;
    const hasLabel    = extraLabel !== null;
    if (!hasPointers && !hasLabel) return null;

    const rowW    = count * cellW + Math.max(0, count - 1) * cellGap;
    const STRIDE  = cellW + cellGap;
    const centerX = (rel) => rel * STRIDE + cellW / 2;

    // ── Collision detection ─────────────────────────────────────────────────
    const ijSame     = iRel !== null && jRel !== null && iRel === jRel;
    const jj1Same    = jRel !== null && j1Rel !== null && jRel === j1Rel;
    const ij1Same    = iRel !== null && j1Rel !== null && iRel === j1Rel;  // L ≡ M
    const jj2Same    = jRel !== null && j2Rel !== null && jRel === j2Rel;  // R ≡ M+1
    const labelHitsJ = hasLabel && jRel !== null && extraLabel.rel === jRel;
    const labelHitsI = hasLabel && iRel !== null && extraLabel.rel === iRel;

    // ── Badge sizes ─────────────────────────────────────────────────────────
    const iSize  = (ijSame || labelHitsI || ij1Same) ? BADGE_SM : BADGE;
    const jSize  = (ijSame || labelHitsJ || jj1Same || jj2Same) ? BADGE_SM : BADGE;
    const j1Size = (jj1Same || ij1Same) ? BADGE_SM : BADGE;
    const j2Size = jj2Same ? BADGE_SM : BADGE;

    // ── Badge x positions ───────────────────────────────────────────────────
    let iX = iRel !== null
        ? ijSame
            ? centerX(iRel) - BADGE_SM - PAIR_GAP / 2           // i on left when sharing with j
            : ij1Same
                ? centerX(iRel) - BADGE_SM - PAIR_GAP / 2       // i on left when sharing with j1 (M)
                : labelHitsI
                    ? centerX(iRel) - (BADGE_SM + PAIR_GAP + LABEL_SM) / 2
                    : centerX(iRel) - BADGE / 2                  // normal centre
        : null;

    let jX = jRel === -1
        ? -(BADGE + cellGap + 4)                                  // off left edge
        : jRel !== null
            ? ijSame
                ? centerX(jRel) + PAIR_GAP / 2                  // j on right when sharing with i
                : jj1Same
                    ? centerX(jRel) + PAIR_GAP / 2              // j (R) on right when sharing with j1 (M)
                    : jj2Same
                        ? centerX(jRel) + PAIR_GAP / 2          // j (R) on right when sharing with j2 (M+1)
                        : labelHitsJ
                            ? centerX(jRel) + (LABEL_SM + PAIR_GAP) / 2
                            : centerX(jRel) - BADGE / 2          // normal centre
            : null;

    // ── Extra label position ────────────────────────────────────────────────
    let labelLeft      = hasLabel ? centerX(extraLabel.rel) : 0;
    let labelTransform = 'translateX(-50%)';
    let labelSm        = false;

    if (labelHitsJ && jX !== null) {
        // label sits LEFT of j badge
        const start   = centerX(extraLabel.rel) - (LABEL_SM + PAIR_GAP + BADGE_SM) / 2;
        labelLeft     = start;
        labelTransform = 'none';
        jX            = start + LABEL_SM + PAIR_GAP;
        labelSm       = true;
    } else if (labelHitsI && iX !== null) {
        // label sits RIGHT of i badge
        const start   = centerX(extraLabel.rel) - (BADGE_SM + PAIR_GAP + LABEL_SM) / 2;
        iX            = start;
        labelLeft     = start + BADGE_SM + PAIR_GAP;
        labelTransform = 'none';
        labelSm       = true;
    }

    // ── Transitions ─────────────────────────────────────────────────────────
    const slide = { type: 'spring', stiffness: 260, damping: 28 };
    const blinkT = {
        x:       slide,
        opacity: { repeat: Infinity, duration: 0.6, ease: 'easeInOut' },
    };
    const iTrans  = blink ? blinkT : slide;
    const jTrans  = (blink || jBlink) ? blinkT : slide;
    const j1Trans = slide;

    // ── j+1 and j+2 badge x positions ────────────────────────────────────────
    // j1 (M) sits LEFT of j (R) when they share a cell
    // j1 (M) sits RIGHT of i (L) when they share a cell
    const j1X = j1Rel !== null
        ? jj1Same
            ? centerX(j1Rel) - BADGE_SM - PAIR_GAP / 2
            : ij1Same
                ? centerX(j1Rel) + PAIR_GAP / 2                 // M on right when sharing with L
                : centerX(j1Rel) - BADGE / 2
        : null;
    // j2 (M+1) pill is 28px wide — centre it, or shift left of j (R) when sharing
    const J2_W = 28;
    const j2X = j2Rel !== null
        ? jj2Same
            ? centerX(j2Rel) - BADGE_SM - PAIR_GAP / 2 - (J2_W - BADGE_SM) / 2  // M+1 left of R, pill-centred
            : centerX(j2Rel) - J2_W / 2                                           // normal centre
        : null;

    return (
        <div style={{ position: 'relative', width: rowW, height: BADGE + 2, flexShrink: 0 }}>
            {/* Extra label pill */}
            {hasLabel && (
                <div style={{ position: 'absolute', bottom: 0, left: labelLeft, transform: labelTransform }}>
                    <motion.div
                        className={`rounded-full bg-sky-600 text-white flex items-center justify-center font-bold
                            ${labelSm ? 'px-1 h-4 text-[8px]' : 'px-1.5 h-5 text-[9px]'}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {extraLabel.text}
                    </motion.div>
                </div>
            )}

            {/* i badge */}
            {iX !== null && (
                <motion.div
                    className={`rounded-full text-white flex items-center justify-center font-bold ${iClass}`}
                    style={{
                        position: 'absolute', bottom: 0, left: 0,
                        width: iSize, height: iSize,
                        fontSize: iSize < BADGE ? 9 : 10,
                    }}
                    initial={{ x: iX }}
                    animate={blink ? { x: iX, opacity: [1, 0.1, 1] } : { x: iX, opacity: 1 }}
                    transition={iTrans}
                >
                    {iLabel}
                </motion.div>
            )}

            {/* j badge */}
            {jX !== null && (
                <motion.div
                    className={`rounded-full text-white flex items-center justify-center font-bold ${jClass}`}
                    style={{
                        position: 'absolute', bottom: 0, left: 0,
                        width: jSize, height: jSize,
                        fontSize: jSize < BADGE ? 9 : 10,
                    }}
                    initial={{ x: jX }}
                    animate={(blink || jBlink) ? { x: jX, opacity: [1, 0.1, 1] } : { x: jX, opacity: 1 }}
                    transition={jTrans}
                >
                    {jLabel}
                </motion.div>
            )}

            {/* j+1 badge */}
            {j1X !== null && (
                <motion.div
                    className={`rounded-full text-slate-900 flex items-center justify-center font-bold ${j1Class}`}
                    style={{
                        position: 'absolute', bottom: 0, left: 0,
                        width: j1Size, height: j1Size,
                        fontSize: j1Size < BADGE ? 9 : 8,
                    }}
                    initial={{ x: j1X }}
                    animate={{ x: j1X, opacity: 1 }}
                    transition={j1Trans}
                >
                    {j1Label}
                </motion.div>
            )}

            {/* j+2 / fourth badge (e.g. mid+1 in Find Peak Element) — pill shape to fit "M+1" */}
            {j2X !== null && (
                <motion.div
                    className={`text-slate-900 flex items-center justify-center font-bold ${j2Class}`}
                    style={{
                        position: 'absolute', bottom: 0, left: 0,
                        width: 28, height: j2Size,
                        borderRadius: 8,
                        fontSize: 9,
                        paddingLeft: 1, paddingRight: 1,
                    }}
                    initial={{ x: j2X }}
                    animate={{ x: j2X, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                >
                    {j2Label}
                </motion.div>
            )}
        </div>
    );
};

export default PointerBadgeRow;
