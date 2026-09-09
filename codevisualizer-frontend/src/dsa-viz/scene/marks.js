/**
 * dsa-viz / scene / marks
 *
 * The ONLY place a semantic "tone" becomes a colour. Scene primitives ask for
 * `toneStyle('compare')`, never for a hex. Add a tone here once; every
 * primitive and every problem can use it.
 *
 * A tone style is `{ fill, stroke, text, glow }` — all optional except fill.
 */

import { palette } from '../theme/tokens';

const T = {
    // structural
    neutral:   { fill: palette.cell,   stroke: palette.cellStroke, text: palette.cellText },
    dim:       { fill: palette.dim,    stroke: palette.dimStroke,  text: palette.dimText },

    // comparison / motion
    active:    { fill: palette.skySoft,     stroke: palette.skyBright,     text: '#e0f2fe', glow: palette.sky },
    compare:   { fill: palette.pink,        stroke: palette.pinkBright,    text: '#fff',    glow: palette.pink },
    'compare-b':{ fill: palette.amber,      stroke: palette.amberBright,   text: '#1e293b', glow: palette.amber },
    swap:      { fill: palette.rose,        stroke: palette.roseBright,    text: '#fff',    glow: palette.rose },
    key:       { fill: palette.amberSoft,   stroke: palette.amberBright,   text: '#fef3c7', glow: palette.amber },

    // outcome
    sorted:    { fill: palette.emeraldSoft, stroke: palette.emeraldBright, text: '#d1fae5' },
    found:     { fill: palette.emerald,     stroke: palette.emeraldBright, text: '#fff',    glow: palette.emerald },
    eliminated:{ fill: palette.dim,         stroke: palette.dimStroke,     text: palette.dimText },
    target:    { fill: palette.violetSoft,  stroke: palette.violetBright,  text: '#ede9fe' },

    // the live working area of a loop / window / partition
    zone:      { fill: palette.indigoSoft,  stroke: palette.indigoBright,  text: '#c7d2fe' },

    // "the thing being carried" — the running max in bubble sort, the pivot in
    // quicksort, the key in insertion sort. Persistent gold so the learner can
    // track ONE element across a whole pass.
    carry:     { fill: palette.amber,       stroke: '#fde68a',             text: '#3f2500', glow: palette.amber },
    locked:    { fill: palette.emerald,     stroke: palette.emeraldBright, text: '#022c22', glow: palette.emerald },

    // pointers
    pointerA:  { fill: palette.emerald,     stroke: palette.emeraldBright, text: '#022c22' },
    pointerB:  { fill: palette.rose,        stroke: palette.roseBright,    text: '#4c0519' },
    pointerMid:{ fill: palette.sky,         stroke: palette.skyBright,     text: '#082f49' },
    pointerI:  { fill: palette.sky,         stroke: palette.skyBright,     text: '#082f49' },
    pointerJ:  { fill: palette.pink,        stroke: palette.pinkBright,    text: '#500724' },

    // recursion / tree
    call:      { fill: palette.skySoft,     stroke: palette.skyBright,     text: '#e0f2fe', glow: palette.sky },
    checking:  { fill: palette.amberSoft,   stroke: palette.amberBright,   text: '#fef3c7' },
    recursing: { fill: palette.indigoSoft,  stroke: palette.indigoBright,  text: '#c7d2fe' },
    base:      { fill: palette.amber,       stroke: palette.amberBright,   text: '#1e293b', glow: palette.amber },
    combined:  { fill: palette.violet,      stroke: palette.violetBright,  text: '#fff' },

    // edges
    edgePending:{ fill: 'none', stroke: palette.indigoSoft, text: 'none' },
    edgeActive: { fill: 'none', stroke: palette.indigoBright, text: 'none' },
    edgeDone:   { fill: 'none', stroke: palette.emerald, text: 'none' },
};

export const toneStyle = (tone) => T[tone] ?? T.neutral;

export const TONES = Object.keys(T);
