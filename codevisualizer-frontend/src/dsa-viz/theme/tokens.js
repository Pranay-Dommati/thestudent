/**
 * dsa-viz / theme / tokens
 *
 * The single source of truth for colour, motion and timing across every
 * visualizer built on the dsa-viz core. No visualizer should hard-code a hex
 * value, a spring constant, or a step delay — pull it from here.
 *
 * Palette is dark-first (the DSA sheet shell is `bg-slate-950`).
 */

// ── Raw palette ──────────────────────────────────────────────────────────────
export const palette = {
    surface:      '#020617', // slate-950  (canvas backdrop)
    surfaceRaise: '#0f172a', // slate-900
    cell:         '#334155', // slate-700  (neutral element)
    cellStroke:   '#64748b', // slate-500
    cellText:     '#f1f5f9', // slate-100
    dim:          '#1e293b', // slate-800  (eliminated / out of range)
    dimStroke:    '#334155',
    dimText:      '#64748b',

    indigo:   '#6366f1', indigoSoft: '#312e81', indigoBright: '#818cf8',
    sky:      '#0ea5e9', skySoft:    '#075985', skyBright:    '#7dd3fc',
    emerald:  '#10b981', emeraldSoft:'#065f46', emeraldBright:'#6ee7b7',
    amber:    '#f59e0b', amberSoft:  '#78350f', amberBright:  '#fcd34d',
    rose:     '#f43f5e', roseSoft:   '#881337', roseBright:   '#fda4af',
    violet:   '#8b5cf6', violetSoft: '#4c1d95', violetBright: '#c4b5fd',
    pink:     '#ec4899', pinkBright: '#f9a8d4',
};

// ── Motion: spring / tween presets ───────────────────────────────────────────
// One vocabulary. `move` for entities changing slot, `pointer` for pointer
// badges, `soft` for camera and non-urgent settles, `pop` for enter/exit.
export const springs = {
    move:    { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 },
    pointer: { type: 'spring', stiffness: 340, damping: 30 },
    soft:    { type: 'spring', stiffness: 170, damping: 24 },
    pop:     { type: 'spring', stiffness: 380, damping: 24 },
    camera:  { type: 'spring', stiffness: 120, damping: 22 },
};

export const durations = { fast: 0.16, base: 0.3, slow: 0.55 };

// Transition helpers that collapse to instant when the viewer prefers reduced
// motion. Pass the boolean from usePlayer()'s `reduced`.
export const motionSafe = (reduced, transition) =>
    reduced ? { duration: 0 } : transition;

// ── Step pacing (ms at 1× speed) ─────────────────────────────────────────────
// Keyed by semantic step `kind`. A problem may override any of these, but the
// defaults should already read well.
export const stepDelays = {
    setup:       1500,
    enter:       1400,
    scan:         900,
    compare:     1500,
    'compare-eq':1900,
    swap:        1700,
    shift:       1200,
    move:        1100,
    pivot:       1600,
    recurse:      700,
    'return':     950,
    combine:     1100,
    bounds:      1600,
    mid:         1500,
    eliminate:   1600,
    found:       2400,
    'not-found': 2400,
    push:        1000,
    pop:         1000,
    match:       1400,
    done:        2400,
    default:     1200,
};

export const speedOptions = [0.5, 1, 2];

// Delay resolver: (step, speed, reduced) => ms
export const resolveDelay = (step, speed = 1, reduced = false) => {
    if (reduced) return 350 / speed;
    const base = stepDelays[step?.kind] ?? stepDelays.default;
    return base / speed;
};
