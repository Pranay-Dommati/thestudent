/**
 * dsa-viz / problems / bubble-sort  — REFERENCE
 *
 * Note how little is here: code + line map + a simulate() that states WHAT IS
 * TRUE at each step, and a one-line Scene. Every visual decision — bar
 * heights, swap arcs, comparison brackets, dimension braces, spotlighting, the
 * sorted wall, the success ripple — lives in the reusable core and is switched
 * on by naming it in a frame.
 *
 * Three rules this file follows, and every future problem should too:
 *
 *  1. EVERY step carries a visual event. No step is a caption over a still
 *     image, so continuous playback reads as a film rather than a slideshow
 *     with holes in it.
 *  2. Pointers and regions PERSIST across the steps they are true for, instead
 *     of appearing only on the "interesting" ones — that is what lets `j`
 *     visibly travel across the array instead of teleporting.
 *  3. The trace follows the REAL control flow of the Python on screen, line by
 *     line. `for j in range(...)` is a line that executes, so it gets its own
 *     step every iteration — and nothing may show `j` before that line has run
 *     for the first time. A visual that says something the highlighted line has
 *     not done yet teaches the wrong model.
 *
 * The teaching idea this build is shaped around: bubble sort *carries the
 * largest remaining value to the right*, one pass at a time. So the visual
 * tracks that one element with a persistent gold ring while it travels, and
 * locks it into the emerald wall when it arrives — while the brace underneath
 * visibly shortens each pass, which is what `n - i - 1` actually means.
 */
import React from 'react';
import ArrayScene from '../scene/ArrayScene';
import { makeTrace, elements, cloneEls } from '../engine/ir';

// ── code + line coupling ─────────────────────────────────────────────────────
export const code = (arrString = '[5, 1, 4, 2, 8, 0, 2]') => `def bubble_sort(arr):
    n = len(arr)

    for i in range(n):
        swapped = False

        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True

        # If no swaps -> already sorted
        if not swapped:
            break

    return arr



arr = ${arrString}

sorted_arr = bubble_sort(arr)
print("Sorted Array:", sorted_arr)`;

export const lines = {
    FN: 1, N: 2, OUTER: 4, SWAPPED_FALSE: 5, INNER: 7, COMPARE: 8,
    SWAP: 9, SWAPPED_TRUE: 10, CHECK_SORTED: 13, BREAK: 14, RETURN: 16,
    ARR: 20, CALL: 22, PRINT: 23,
};
export const lineAnchors = {
    N: 'n = len(arr)',
    OUTER: 'for i in range(n)',
    SWAPPED_FALSE: 'swapped = False',
    INNER: 'for j in range(0, n - i - 1)',
    COMPARE: 'arr[j] > arr[j + 1]',
    SWAP: 'arr[j], arr[j + 1] = arr[j + 1], arr[j]',
    SWAPPED_TRUE: 'swapped = True',
    CHECK_SORTED: 'if not swapped',
    BREAK: 'break',
    RETURN: 'return arr',
};

// ── meta / input ─────────────────────────────────────────────────────────────
export const meta = { title: 'Bubble Sort', pattern: 'sorting', difficulty: 'easy' };
export const defaultInput = '[5, 1, 4, 2, 8, 0, 2]';

export const parseInput = (raw) => {
    try {
        const p = JSON.parse(String(raw ?? '').trim());
        if (Array.isArray(p) && p.length) return p.map(Number).slice(0, 12);
    } catch { /* fall through */ }
    return [5, 1, 4, 2, 8, 0, 2];
};

export const validateInput = (raw) => {
    const t = String(raw ?? '').trim();
    if (!t.startsWith('[') || !t.endsWith(']')) return 'Format: [5, 1, 4, 2]';
    const inner = t.slice(1, -1).trim();
    if (!inner) return 'Array cannot be empty';
    const parts = inner.split(',').map((s) => s.trim());
    for (const p of parts) if (!/^-?\d+$/.test(p)) return `Invalid: ${p}`;
    if (parts.length > 12) return 'Max 12 elements';
    return '';
};

// ── simulation ───────────────────────────────────────────────────────────────
export function simulate(input) {
    const els = elements(input);
    const n = els.length;
    const t = makeTrace();

    let sortedFrom = n;      // els[sortedFrom..n-1] are in final position
    let bound = n;           // this pass's exclusive j limit (n - i - 1)
    let carryId = null;      // the largest value seen so far this pass
    const all = { from: 0, to: n - 1 };
    const plural = (k, one, many) => (k === 1 ? one : many);

    /** merge a patch onto one slot's mark without clobbering its other keys */
    const put = (arr, index, patch) => {
        const hit = arr.find((m) => m.index === index);
        if (hit) Object.assign(hit, patch);
        else arr.push({ index, ...patch });
        return arr;
    };

    /** the gold tracking ring follows the carried value wherever it now sits */
    const carryMark = (m = []) => {
        const ci = carryId ? els.findIndex((e) => e.id === carryId) : -1;
        if (ci >= 0 && ci < sortedFrom) put(m, ci, { ring: 'carry' });
        return m;
    };

    const pairMark = (k, tones) => {
        const m = carryMark();
        put(m, k, { tone: tones[0], emphasis: true });
        put(m, k + 1, { tone: tones[1], emphasis: true });
        return m;
    };

    /**
     * The two standing regions. Both derive from the SAME boundary, so they can
     * never overlap — taking the unsorted half from `bound` while the sorted
     * half came from `sortedFrom` once painted both bands over the same slot.
     */
    const zones = () => {
        const r = [];
        if (sortedFrom > 0) {
            r.push({ key: 'zone', from: 0, to: sortedFrom - 1, tone: 'zone', label: 'still unsorted', rule: false });
        }
        if (sortedFrom <= n - 1) {
            r.push({ key: 'sorted', from: sortedFrom, to: n - 1, tone: 'sorted', label: 'sorted — final positions' });
        }
        return r;
    };

    /** j and j+1 — only ever used on steps at or after line 7 has run */
    const jPointers = (k) => [
        { id: 'j', label: 'j', index: k, tone: 'pointerJ' },
        { id: 'j1', label: 'j+1', index: k + 1, tone: 'compare-b' },
    ];

    const frame = (x = {}) => ({
        values: cloneEls(els),
        regions: x.regions ?? zones(),
        spans: x.spans ?? [],
        marks: x.marks ?? carryMark(),
        pointers: x.pointers ?? [],
        relation: x.relation ?? null,
        exchange: x.exchange ?? null,
        spotlight: x.spotlight ?? null,
        reveal: x.reveal ?? null,
        pulse: x.pulse ?? null,
        lock: x.lock ?? null,
    });

    // ── setup ────────────────────────────────────────────────────────────────
    // the array grows in from the baseline, left to right
    t.push('setup', {
        codeLine: lines.ARR,
        caption: `arr = [${els.map((e) => e.v).join(', ')}]`,
        narration: `An unsorted array of ${n} values. Bar height is the value, so "sorted" will look like a staircase climbing to the right.`,
        frame: frame({ regions: [], reveal: all }),
    });

    // handing the array to the function — a ripple travels across it
    t.push('setup', {
        codeLine: lines.CALL,
        caption: `bubble_sort(arr)`,
        narration: `Bubble sort sweeps left to right, swapping any pair that is out of order. Each sweep carries the largest remaining value to the far right.`,
        frame: frame({ regions: [], pulse: { ...all, tone: 'zone' } }),
    });

    // n becomes a brace you can see, not a number you have to hold
    t.push('setup', {
        codeLine: lines.N,
        caption: `n = len(arr) = ${n}`,
        narration: `n is how many values there are — ${n}. The brace underneath measures exactly what n counts.`,
        frame: frame({ regions: [], spans: [{ id: 'n', from: 0, to: n - 1, label: `n = ${n}`, tone: 'active' }] }),
    });

    // ── passes ───────────────────────────────────────────────────────────────
    for (let i = 0; i < n; i++) {
        bound = n - i - 1;
        carryId = null;

        // Line 4 talks about i and the region still in play. It must NOT mention
        // j — j does not exist until line 7 runs.
        const regionSpan = [{
            id: 'region', from: 0, to: Math.max(bound, 0), tone: 'zone',
            label: bound > 0 ? `unsorted: 0 → ${bound}` : 'nothing left to sort',
        }];

        t.push('bounds', {
            codeLine: lines.OUTER,
            caption: i === 0
                ? `Pass 1 — nothing is final yet`
                : `Pass ${i + 1} — the last ${i} ${plural(i, 'value is', 'values are')} already final`,
            narration: `Start pass ${i + 1}. i = ${i}, so ${i} ${plural(i, 'value has', 'values have')} already been parked on the right and only indices 0 to ${Math.max(bound, 0)} are still in play.`,
            frame: frame({ spans: regionSpan, pulse: { from: 0, to: Math.max(bound, 0) } }),
        });

        let swapped = false;

        t.push('bounds', {
            codeLine: lines.SWAPPED_FALSE,
            caption: `swapped = False — nothing has moved yet`,
            narration: `Reset the swap flag. If this entire sweep makes no swaps, every neighbouring pair must already be in order and we can stop early.`,
            frame: frame({ spans: regionSpan, pulse: { from: 0, to: Math.max(bound, 0) } }),
        });

        // The inner loop's own brace: one shorter than the unsorted region,
        // because j is always compared against j+1.
        const sweepSpan = bound > 0
            ? [{ id: 'sweep', from: 0, to: bound - 1, label: `j: 0 → ${bound - 1}`, tone: 'pointerJ' }]
            : [{ id: 'sweep', from: 0, to: n - 1, label: 'range is empty — no j', tone: 'zone' }];

        for (let k = 0; k < bound; k++) {
            // Line 7 — this is where j is born and where it advances. The
            // pointer appears here, one beat before the comparison it enables.
            t.push('scan', {
                codeLine: lines.INNER,
                caption: `j = ${k}`,
                narration: `The inner loop hands j the value ${k}. That points at arr[${k}], and j+1 points at its right-hand neighbour arr[${k + 1}].`,
                frame: frame({
                    spans: sweepSpan,
                    pointers: jPointers(k),
                    spotlight: [k, k + 1],
                }),
            });

            const a = els[k].v, b = els[k + 1].v;
            const out = a > b;

            t.push('compare', {
                codeLine: lines.COMPARE,
                caption: out ? `${a} > ${b} — out of order, swap` : `${a} > ${b} is false — leave them`,
                narration: `Compare the neighbours at j=${k} and j+1=${k + 1}. ${out
                    ? `${a} is bigger than ${b}, so they are out of order — swap them.`
                    : `${a} is not bigger than ${b}, so this pair is already in order.`}`,
                frame: frame({
                    spans: sweepSpan,
                    marks: pairMark(k, ['compare', 'compare-b']),
                    pointers: jPointers(k),
                    relation: { a: k, b: k + 1, op: '>', lhs: a, rhs: b, verdict: out, note: out ? 'swap' : 'keep' },
                    spotlight: [k, k + 1],
                }),
            });

            if (out) {
                const bigId = els[k].id;        // the larger value — it gets carried right
                const smallId = els[k + 1].id;
                [els[k], els[k + 1]] = [els[k + 1], els[k]];
                carryId = bigId;

                t.push('swap', {
                    codeLine: lines.SWAP,
                    caption: `${a} hops over ${b}`,
                    narration: `Swap them. ${a} arcs over to index ${k + 1}; ${b} slides under it to index ${k}.`,
                    frame: frame({
                        spans: sweepSpan,
                        marks: pairMark(k, ['swap', 'swap']),
                        pointers: jPointers(k),
                        exchange: { over: bigId, under: smallId },
                        spotlight: [k, k + 1],
                    }),
                });

                swapped = true;

                t.push('bounds', {
                    codeLine: lines.SWAPPED_TRUE,
                    caption: `swapped = True — this sweep moved something`,
                    narration: `Record that a swap happened, so we know another pass will be needed. ${a} is now the largest value seen so far in this sweep, and the gold ring will follow it from here.`,
                    frame: frame({
                        spans: sweepSpan,
                        pointers: jPointers(k),
                        pulse: { from: k + 1, to: k + 1, tone: 'carry' },
                    }),
                });
            } else {
                // no swap: the larger of the pair is already on the right, so
                // the running maximum simply moves along with j
                carryId = els[k + 1].id;
            }
        }

        // Line 7 once more — the range is exhausted and the loop falls through.
        // j is drawn muted at the value it WOULD have taken, sitting past the
        // right end of its own brace, so the reason the loop stopped is visible
        // rather than something the reader infers from a caption.
        //
        // The arrival belongs to THIS beat, not to line 13: a completed sweep is
        // exactly what makes the largest remaining value final, so the wall
        // grows and the slot locks here. Line 13 only tests a flag, and putting
        // "X is now final" against `if not swapped:` described something that
        // line does not do.
        const landedValue = els[bound]?.v;
        sortedFrom = Math.max(bound, 0);
        carryId = null;

        t.push('scan', {
            codeLine: lines.INNER,
            caption: bound > 0
                ? `j = ${bound} is past ${bound - 1} — sweep over, ${landedValue} locks in`
                : `range(0, 0) is empty — there is no j to take`,
            narration: bound > 0
                ? `The inner loop asks for the next j. It would be ${bound}, but the range only runs up to ${bound - 1} — see how j has stepped past the right end of its brace. The sweep is over, and because a full sweep always carries the largest remaining value to the right, arr[${bound}] = ${landedValue} is now in its final position.`
                : `On the final pass the range is empty, so the inner loop body never runs at all.`,
            frame: frame({
                spans: sweepSpan,
                pointers: [{ id: 'j', label: `j = ${bound}`, index: Math.min(bound, n - 1), tone: 'pointerJ', invalid: true }],
                lock: bound > 0 ? bound : null,
                pulse: bound > 0 ? null : { from: 0, to: n - 1 },
            }),
        });

        // Line 13 tests the flag — nothing more. The visual answers the only
        // question the line asks: do we go around again, or are we done?
        t.push('bounds', {
            codeLine: lines.CHECK_SORTED,
            caption: swapped
                ? `swapped is True — something moved, so go around again`
                : `swapped is False — nothing moved all sweep`,
            narration: swapped
                ? `The flag is True, so at least one pair was out of order during that sweep. The array may still be unsorted, so we do not break — another pass will run over the ${sortedFrom} value${plural(sortedFrom, '', 's')} still in play.`
                : `The flag is still False, so not one pair was out of order. Every neighbour is already in the right order, which means the whole array is sorted.`,
            frame: frame({
                marks: [],
                pulse: swapped
                    ? { from: 0, to: Math.max(sortedFrom - 1, 0) }
                    : { from: 0, to: n - 1 },
                spans: swapped
                    ? [{ id: 'todo', from: 0, to: Math.max(sortedFrom - 1, 0), label: `${sortedFrom} still to sort`, tone: 'zone' }]
                    : [{ id: 'nosw', from: 0, to: n - 1, label: 'every pair already in order', tone: 'sorted' }],
            }),
        });

        if (!swapped) {
            sortedFrom = 0;
            bound = 0;
            t.push('done', {
                codeLine: lines.BREAK,
                caption: `break — skip the remaining passes`,
                narration: `Break out of the loop. This early exit is why an already-sorted array costs bubble sort only one sweep instead of n of them.`,
                frame: frame({ marks: [], pulse: all }),
            });
            break;
        }
    }

    sortedFrom = 0;
    bound = 0;

    t.push('done', {
        codeLine: lines.RETURN,
        caption: `return [${els.map((e) => e.v).join(', ')}]`,
        narration: `Sorted — every bar is now shorter than the one to its right, so the array reads as a staircase.`,
        frame: frame({ marks: [], pulse: all }),
    });

    t.push('done', {
        codeLine: lines.PRINT,
        caption: `Sorted Array: [${els.map((e) => e.v).join(', ')}]`,
        narration: `Done. Bubble sort compares every neighbouring pair on every pass, which is why it costs on the order of n² comparisons as the array grows.`,
        frame: frame({
            marks: [],
            spans: [{ id: 'final', from: 0, to: n - 1, label: 'sorted ✓', tone: 'sorted' }],
        }),
    });

    return t.steps;
}

// ── Scene ────────────────────────────────────────────────────────────────────
export function Scene({ step, reduced }) {
    return <ArrayScene mode="bar" view={step?.frame || {}} reduced={reduced} />;
}

export default { meta, code, lines, lineAnchors, defaultInput, parseInput, validateInput, simulate, Scene };
