/**
 * dsa-viz / scene / SceneCanvas
 *
 * The single SVG coordinate space every primitive draws into. Owns:
 *  - the <svg viewBox> (natural scene size; scales to fit its container via
 *    preserveAspectRatio, so wide arrays / deep trees never clip or need a
 *    horizontal scrollbar)
 *  - the camera: a root <motion.g> that springs to `focusBox` (from useCamera)
 *
 * Children are layers, drawn in order. A Scene composes:
 *   <SceneCanvas world={{w,h}} focusBox={box} reduced={reduced}>
 *     <ArrayTrack .../>
 *     <PointerLayer .../>
 *     <BadgeLayer .../>
 *   </SceneCanvas>
 */

import React from 'react';
import { motion } from 'framer-motion';
import { springs, motionSafe } from '../theme/tokens';
import { useCamera } from '../engine/useCamera';

export default function SceneCanvas({
    world,
    focusBox = null,
    reduced = false,
    padding = 24,
    camera: cameraOpts,
    children,
}) {
    const w = world.w + padding * 2;
    const h = world.h + padding * 2;
    const cam = useCamera({ w, h }, focusBox && shift(focusBox, padding), cameraOpts);

    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="xMidYMid meet"
            width="100%"
            height="100%"
            role="presentation"
            style={{ display: 'block', maxHeight: '100%', width: '100%', overflow: 'visible' }}
        >
            <motion.g
                animate={{ x: cam.x, y: cam.y, scale: cam.scale }}
                transition={motionSafe(reduced, springs.camera)}
                style={{ transformOrigin: '0 0' }}
            >
                <g transform={`translate(${padding} ${padding})`}>{children}</g>
            </motion.g>
        </svg>
    );
}

const shift = (box, p) => ({ x: box.x + p, y: box.y + p, w: box.w, h: box.h });
