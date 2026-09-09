/**
 * dsa-viz / scene / geometry
 *
 * Pure layout math. A visualizer computes ONE geometry object and hands the
 * same object to ArrayTrack, PointerLayer, SpanLayer, RelationLayer and
 * BadgeLayer, so every layer lands on the same pixels with zero duplicated
 * arithmetic.
 *
 * Two shapes of array today:
 *   trackGeometry — equal-size cells (search, strings, stacks, hashing)
 *   barGeometry   — value encoded as HEIGHT (sorting, anything where relative
 *                   magnitude is the point). Sortedness becomes a staircase you
 *                   can read at a glance instead of n numbers you must parse.
 *
 * Both expose the same interface, so layers never branch on mode:
 *   x(i) cx(i)        left / centre of slot i
 *   topOf(v)          y of the top edge of a slot holding value v
 *   heightOf(v)       height of a slot holding value v
 *   baseline          y all slots sit on
 *   indexY            y of the index rail
 *   spanY             y of the dimension-brace row
 *   ptrY(side, depth) where PointerLayer docks its Nth badge
 *
 * Rows below the array are at FIXED offsets whether or not anything occupies
 * them, so the composition never jumps between steps.
 *
 * All units are SVG user units (the SceneCanvas viewBox), not pixels.
 */

const PTR_GAP = 30;
const SPAN_ROW_H = 34;

// ── equal-size cells ─────────────────────────────────────────────────────────
export const CELL = 52;
export const GAP = 10;

export function trackGeometry({
    count, cellW = CELL, cellH = CELL, gap = GAP, originX = 0, originY = 0,
    reserveSpanRow = false,
}) {
    const stride = cellW + gap;
    const baseline = originY + cellH;
    const indexY = baseline + 22;
    const spanY = indexY + 24;
    const ptrBase = baseline + 46 + (reserveSpanRow ? SPAN_ROW_H : 0);
    return {
        mode: 'cell',
        count, slotW: cellW, cellW, cellH, gap, stride, originX,
        width: count * cellW + Math.max(0, count - 1) * gap,
        x: (i) => originX + i * stride,
        cx: (i) => originX + i * stride + cellW / 2,
        heightOf: () => cellH,
        topOf: () => originY,
        baseline,
        plotTop: originY,
        plotBottom: baseline,
        indexY,
        spanY,
        ptrY: (side, depth = 0) =>
            side === 'top' ? originY - 34 - depth * PTR_GAP : ptrBase + depth * PTR_GAP,
    };
}

// ── value-as-height bars ─────────────────────────────────────────────────────
export function barGeometry({
    count,
    values = [],
    plotH = 300,
    plotTop = 96,
    gap = 14,
    originX = 0,
    minBarH = 34,
    maxSlotW = 108,
    minSlotW = 24,
    targetW = 980,
    reserveSpanRow = true,
}) {
    const slotW = Math.max(minSlotW, Math.min(maxSlotW, (targetW - (count - 1) * gap) / Math.max(count, 1)));
    const stride = slotW + gap;
    const baseline = plotTop + plotH;
    const indexY = baseline + 24;
    const spanY = indexY + 30;
    const ptrBase = baseline + 58 + (reserveSpanRow ? SPAN_ROW_H : 0);

    const nums = values.map((e) => (typeof e === 'object' ? e.v : e));
    const min = nums.length ? Math.min(...nums) : 0;
    const max = nums.length ? Math.max(...nums) : 1;
    const flat = max === min;
    const heightOf = (v) => (flat ? plotH * 0.62 : minBarH + ((v - min) / (max - min)) * (plotH - minBarH));

    return {
        mode: 'bar',
        count, slotW, cellW: slotW, gap, stride, originX,
        width: count * slotW + Math.max(0, count - 1) * gap,
        x: (i) => originX + i * stride,
        cx: (i) => originX + i * stride + slotW / 2,
        heightOf,
        topOf: (v) => baseline - heightOf(v),
        baseline,
        plotTop,
        plotBottom: baseline,
        indexY,
        spanY,
        ptrY: (side, depth = 0) =>
            side === 'top' ? plotTop - 24 - depth * PTR_GAP : ptrBase + depth * PTR_GAP,
    };
}

/** Box covering slots [from..to] inclusive — region shading + camera focus. */
export function spanBox(geom, from, to, padY = 0) {
    const a = Math.max(0, Math.min(from, to));
    const b = Math.min(geom.count - 1, Math.max(from, to));
    return {
        x: geom.x(a),
        y: geom.plotTop - padY,
        w: geom.x(b) + geom.slotW - geom.x(a),
        h: geom.plotBottom - geom.plotTop + padY * 2,
    };
}
