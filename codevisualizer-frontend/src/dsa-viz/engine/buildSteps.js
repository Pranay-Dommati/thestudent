/**
 * dsa-viz / engine / buildSteps
 *
 * Takes the raw step array from a problem's `simulate()` and finalizes it:
 *  1. stamps each step with its index `i`
 *  2. precomputes the cumulative set of executed code lines per step — ONCE,
 *     O(total lines) instead of the old O(nSteps²) recompute-every-render
 *  3. (DEV only) verifies the code-line coupling: every `codeLine` a step
 *     references is in range, and every anchor in `lines`/`lineAnchors` still
 *     points at the substring it claims to. This is what makes editing the code
 *     template a loud failure instead of a silent desync.
 */

const EMPTY = Object.freeze([]);

export function buildSteps(rawSteps, { code = '', lines = null, lineAnchors = null, problem = '?' } = {}) {
    const steps = rawSteps.map((s, i) => ({ ...s, i }));

    // Cumulative executed-lines, index-aligned. executedPrefix[i] is a frozen
    // number[] of every distinct codeLine at steps 0..i inclusive.
    const executedPrefix = new Array(steps.length);
    const seen = new Set();
    for (let i = 0; i < steps.length; i++) {
        if (steps[i].codeLine) seen.add(steps[i].codeLine);
        executedPrefix[i] = Object.freeze([...seen]);
    }

    if (import.meta.env?.DEV) validate(steps, code, lines, lineAnchors, problem);

    return {
        steps,
        total: steps.length,
        /** executed code lines at playback index `idx` (-1 → none). */
        executedAt: (idx) =>
            idx >= 0 && idx < executedPrefix.length ? executedPrefix[idx] : EMPTY,
    };
}

function validate(steps, code, lines, lineAnchors, problem) {
    const src = code.split('\n');
    const n = src.length;
    const warn = (msg) => console.error(`[dsa-viz:${problem}] ${msg}`);

    const referenced = new Set();
    for (const s of steps) {
        if (s.codeLine == null) continue;
        referenced.add(s.codeLine);
        if (s.codeLine < 1 || s.codeLine > n) {
            warn(`step ${s.i} (${s.kind}) references codeLine ${s.codeLine}, but code has ${n} lines`);
        }
    }

    // Anchors: lines = { COMPARE: 8 }  +  lineAnchors = { COMPARE: 'arr[j] >' }
    if (lines && lineAnchors) {
        for (const key of Object.keys(lineAnchors)) {
            const ln = lines[key];
            const anchor = lineAnchors[key];
            if (ln == null) { warn(`lineAnchors.${key} has no matching lines.${key}`); continue; }
            const text = src[ln - 1] ?? '';
            if (!text.includes(anchor)) {
                warn(`lines.${key} = ${ln} but line ${ln} is "${text.trim()}" — expected to contain "${anchor}". Code template and line map are out of sync.`);
            }
        }
    }

    if (lines) {
        for (const key of Object.keys(lines)) {
            if (!referenced.has(lines[key])) {
                // not fatal — a mapped line may legitimately be unused for some inputs
            }
        }
    }
}
