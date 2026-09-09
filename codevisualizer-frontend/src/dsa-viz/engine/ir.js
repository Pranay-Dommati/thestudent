/**
 * dsa-viz / engine / ir  —  the Step / Frame intermediate representation.
 *
 * A visualization is a precomputed, immutable array of `Step`s. Playback is an
 * index into that array. Every `Step` is a complete, declarative snapshot of
 * the world at one moment — it describes STATE, never animations. Scene
 * primitives diff consecutive frames and animate the difference themselves.
 *
 * ┌─ Step ────────────────────────────────────────────────────────────────────┐
 * │ i         number   filled by buildSteps()                                 │
 * │ kind      string   semantic tag — drives pacing + Scene emphasis          │
 * │                    'setup'|'compare'|'swap'|'shift'|'recurse'|'return'|…   │
 * │ codeLine  number   1-based line into the problem's code (drives highlight) │
 * │ caption   string   short present-tense line ("arr[1]=5 > arr[2]=4 → swap") │
 * │ narration string?   fuller sentence — mobile strip + screen-reader         │
 * │ frame     Frame     the world state (below)                               │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ Frame ───────────────────────────────────────────────────────────────────┐
 * │ arrays?   [{ id, values:[{id,v}], regions?:[{from,to,tone,label}],         │
 * │             lift?:[elId] }]                                                │
 * │ pointers? [{ id, label, at, tone, side }]  at = {trackId,index}|{nodeId}   │
 * │ tree?     { nodes:[{id,label,x,y,tone,active}], edges:[{from,to,state}] }  │
 * │ stack?    { id, items:[{id,v,tone}], label? }                             │
 * │ badges?   [{ id, text, at, tone }]        at = {x,y}|{trackId,index}|{nodeId}
 * │ result?   { text, tone }                                                   │
 * │ focus?    { trackId?, index?, nodeId?, box?:{x,y,w,h} }  — camera target   │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

/**
 * makeTrace — tiny ergonomic helper for `simulate()` functions.
 *
 *   const t = makeTrace();
 *   t.push('compare', { codeLine: L.COMPARE, caption: '...', frame: {...} });
 *   return t.steps;
 */
export function makeTrace() {
    const steps = [];
    return {
        steps,
        push(kind, { codeLine = null, caption = '', narration = '', frame = {} } = {}) {
            steps.push({ kind, codeLine, caption, narration: narration || caption, frame });
            return steps[steps.length - 1];
        },
    };
}

/**
 * elements — wrap a raw value array as identity-stable elements so that a swap
 * animates as two elements trading slots (Framer keys on `el.id`).
 * Duplicate values stay distinguishable.
 */
export const elements = (values, prefix = 'e') =>
    values.map((v, i) => ({ id: `${prefix}${i}`, v }));

/** cloneEls — deep-ish copy of an element array for a frame snapshot. */
export const cloneEls = (els) => els.map((e) => ({ ...e }));

/** region — half-open [from, to] inclusive span descriptor for ArrayTrack. */
export const region = (from, to, tone, label) => ({ from, to, tone, label });
