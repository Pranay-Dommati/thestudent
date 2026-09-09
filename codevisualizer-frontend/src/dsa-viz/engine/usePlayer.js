/**
 * dsa-viz / engine / usePlayer
 *
 * Playback state machine for a precomputed Step[] (rewrite of the old
 * useVisualizerPlayback). Keeps the exact external contract the DSA sheet shell
 * depends on — `seekRef.current(idx)` and `onProgress({ idx, total })` — so
 * DSAImmersiveVisualizer's header scrubber keeps working untouched.
 *
 * Additions over the old hook:
 *  - honours prefers-reduced-motion (exposed as `reduced`; also compresses delays)
 *  - arrow-key / space stepping (opt out with enableKeys={false})
 *  - executed lines come from the O(n) prefix table in buildSteps
 *  - Play + speed are real here (the shell can now render them)
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { resolveDelay } from '../theme/tokens';

export function usePlayer({
    steps,
    executedAt,
    seekRef,
    onProgress,
    enableKeys = true,
}) {
    const total = steps.length;
    const reduced = !!useReducedMotion();

    const [idx, setIdx] = useState(-1);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);

    const atStart = idx < 0;
    const atEnd = idx >= total - 1;
    const finished = atEnd;

    // Reset when the step array identity changes (new input → new simulation).
    useEffect(() => {
        setIdx(-1);
        setPlaying(false);
    }, [steps]);

    // Auto-advance
    useEffect(() => {
        if (!playing || atEnd) { if (atEnd) setPlaying(false); return; }
        const next = idx + 1;
        const t = setTimeout(() => setIdx(next), resolveDelay(steps[next], speed, reduced));
        return () => clearTimeout(t);
    }, [playing, idx, atEnd, steps, speed, reduced]);

    const play = useCallback(() => {
        setIdx((i) => (i >= total - 1 ? -1 : i));
        setPlaying(true);
    }, [total]);
    const pause = useCallback(() => setPlaying(false), []);
    const reset = useCallback(() => { setPlaying(false); setIdx(-1); }, []);
    const back = useCallback(() => { setPlaying(false); setIdx((i) => Math.max(-1, i - 1)); }, []);
    const next = useCallback(() => { setPlaying(false); setIdx((i) => Math.min(total - 1, i + 1)); }, [total]);

    // External scrubber
    useEffect(() => {
        if (!seekRef) return;
        seekRef.current = (to) => {
            setPlaying(false);
            setIdx(Math.max(-1, Math.min(total - 1, to)));
        };
    }, [seekRef, total]);

    // Progress out
    useEffect(() => { onProgress?.({ idx, total }); }, [idx, total, onProgress]);

    // Keyboard
    useEffect(() => {
        if (!enableKeys) return;
        const onKey = (e) => {
            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
            else if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [enableKeys, next, back, play, pause, playing]);

    const currentStep = idx >= 0 ? steps[idx] : null;
    const activeLine = currentStep?.codeLine ?? null;
    const executedLines = useMemo(() => executedAt(idx), [executedAt, idx]);

    return {
        idx, total, playing, finished, atStart, atEnd,
        speed, setSpeed, reduced,
        currentStep, activeLine, executedLines,
        play, pause, reset, back, next,
    };
}
