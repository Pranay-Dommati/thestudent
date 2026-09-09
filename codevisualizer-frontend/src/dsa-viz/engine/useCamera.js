/**
 * dsa-viz / engine / useCamera
 *
 * Turns a step's `frame.focus` into a `{ x, y, scale }` transform for the
 * scene's root <motion.g>. Generalizes the old useTreeCanvas auto-pan: any
 * structure (array window, tree node, arbitrary box) can be focused, and the
 * camera springs to it. No CSS `zoom`, no scrollTo, no `scale-110 md:scale-100`.
 *
 * @param world     { w, h }  natural size of the scene content (svg units)
 * @param focusBox  { x, y, w, h } | null   region to center on (svg units)
 * @param opts.fill fraction of the viewport the focus box should fill (0–1)
 * @param opts.maxScale  clamp — never zoom in more than this
 */
import { useMemo } from 'react';

export function useCamera(world, focusBox, { fill = 0.62, maxScale = 2.2 } = {}) {
    return useMemo(() => {
        if (!focusBox || !world?.w || !world?.h) {
            return { x: 0, y: 0, scale: 1 };
        }
        const { x, y, w, h } = focusBox;
        // scale so the focus box fills `fill` of the world viewport, clamped so
        // we never zoom OUT (that would waste space) or past maxScale.
        const s = Math.min(
            maxScale,
            Math.max(1, Math.min((world.w * fill) / Math.max(w, 1), (world.h * fill) / Math.max(h, 1)))
        );
        const cx = x + w / 2;
        const cy = y + h / 2;
        // translate the world so (cx,cy) lands at the world centre after scaling
        return {
            scale: s,
            x: world.w / 2 - cx * s,
            y: world.h / 2 - cy * s,
        };
    }, [world?.w, world?.h, focusBox?.x, focusBox?.y, focusBox?.w, focusBox?.h, fill, maxScale]);
}
