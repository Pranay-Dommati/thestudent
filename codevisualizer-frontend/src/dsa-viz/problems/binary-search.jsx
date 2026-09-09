/**
 * dsa-viz / problems / binary-search  — REFERENCE
 *
 * Exercises: region shading (two-sided eliminated ranges), L/mid/hi pointers
 * with collision stacking, floating badges (mid, target), and camera focus on
 * the live search window. Replaces BinarySearchVisualizer.jsx + SearchArrayVisual.jsx.
 */
import React from 'react';
import ArrayScene from '../scene/ArrayScene';
import { makeTrace, elements, cloneEls } from '../engine/ir';

export const code = (inputStr = '[3, 12, 18, 25, 31, 42, 63],31') => {
    const c = inputStr.lastIndexOf(',');
    const arrPart = c >= 0 ? inputStr.slice(0, c).trim() : '[3, 12, 18, 25, 31, 42, 63]';
    const tgt = c >= 0 ? inputStr.slice(c + 1).trim() : '31';
    return `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            return mid

        elif arr[mid] < target:
            left = mid + 1

        else:
            right = mid - 1

    return -1


arr = ${arrPart}
target = ${tgt}
result = binary_search(arr, target)
print("Index:", result)`;
};

export const lines = {
    FN: 1, LEFT: 2, RIGHT: 3, WHILE: 5, MID: 6, IF_EQ: 8, RETURN_FOUND: 9,
    ELIF: 11, LEFT_UPD: 12, ELSE: 14, RIGHT_UPD: 15, RETURN_NEG: 17,
    ARR: 20, TARGET: 21, CALL: 22, PRINT: 23,
};
export const lineAnchors = {
    WHILE: 'while left <= right',
    MID: 'mid = left + (right - left) // 2',
    IF_EQ: 'if arr[mid] == target',
    ELIF: 'elif arr[mid] < target',
    ELSE: 'else:',
    RETURN_NEG: 'return -1',
};

export const meta = { title: 'Binary Search', pattern: 'binary-search', difficulty: 'easy' };
export const defaultInput = '[3, 12, 18, 25, 31, 42, 63],31';

export const parseInput = (raw) => {
    const str = String(raw ?? '').trim();
    const c = str.lastIndexOf(',');
    let arr = [3, 12, 18, 25, 31, 42, 63];
    let target = 31;
    try {
        if (c >= 0) {
            const p = JSON.parse(str.slice(0, c).trim());
            const tg = parseInt(str.slice(c + 1).trim(), 10);
            if (Array.isArray(p) && p.length) arr = p.map(Number).slice(0, 15);
            if (!Number.isNaN(tg)) target = tg;
        }
    } catch { /* defaults */ }
    arr = [...arr].sort((a, b) => a - b);
    return { arr, target };
};

export const validateInput = (raw) => {
    const t = String(raw ?? '').trim();
    const c = t.lastIndexOf(',');
    if (c < 0) return 'Format: [arr],target';
    const arrPart = t.slice(0, c).trim();
    const tgtPart = t.slice(c + 1).trim();
    if (!arrPart.startsWith('[') || !arrPart.endsWith(']')) return 'Array must be in []';
    if (!/^-?\d+$/.test(tgtPart)) return 'Target must be a number';
    return '';
};

export function simulate({ arr, target }) {
    const els = elements(arr);
    const n = els.length;
    const t = makeTrace();

    const view = ({ left, right, mid = null, kind = 'window', done = false }) => {
        const regions = [];
        if (!done) {
            if (left > 0) regions.push({ from: 0, to: left - 1, tone: 'eliminated', paint: true });
            if (right < n - 1) regions.push({ from: right + 1, to: n - 1, tone: 'eliminated', paint: true });
        } else {
            // collapse everything except the found index
            if (mid > 0) regions.push({ from: 0, to: mid - 1, tone: 'eliminated', paint: true });
            if (mid < n - 1) regions.push({ from: mid + 1, to: n - 1, tone: 'eliminated', paint: true });
        }
        const marks = [];
        if (mid != null) marks.push({ index: mid, tone: kind === 'found' ? 'found' : 'compare', emphasis: true });

        const pointers = [];
        if (left >= 0 && left < n) pointers.push({ id: 'L', label: 'left', index: Math.min(left, n - 1), tone: 'pointerA' });
        if (right >= 0 && right < n) pointers.push({ id: 'R', label: 'right', index: Math.max(right, 0), tone: 'pointerB' });
        if (mid != null) pointers.push({ id: 'M', label: 'mid', index: mid, tone: 'pointerMid' });

        const badges = [{ id: 'tgt', text: `target = ${target}`, index: Math.floor(n / 2), tone: 'target', row: 1 }];
        if (mid != null) badges.push({ id: 'mid', text: `arr[${mid}] = ${els[mid].v}`, index: mid, tone: 'pointerMid', row: 0 });

        return {
            values: cloneEls(els), regions, marks, pointers, badges,
            focus: done ? { from: mid, to: mid } : { from: Math.max(0, left), to: Math.min(n - 1, right) },
        };
    };

    t.push('setup', {
        codeLine: lines.ARR, caption: `arr = [${arr.join(', ')}]  (sorted)`,
        narration: `Binary search needs a sorted array of ${n} elements.`,
        frame: view({ left: 0, right: n - 1 }),
    });
    t.push('setup', {
        codeLine: lines.TARGET, caption: `target = ${target}`,
        frame: view({ left: 0, right: n - 1 }),
    });
    t.push('bounds', {
        codeLine: lines.LEFT, caption: `left = 0`,
        frame: view({ left: 0, right: n - 1 }),
    });
    t.push('bounds', {
        codeLine: lines.RIGHT, caption: `right = ${n - 1}`,
        frame: view({ left: 0, right: n - 1 }),
    });

    let left = 0, right = n - 1;

    while (left <= right) {
        t.push('bounds', {
            codeLine: lines.WHILE,
            caption: `left (${left}) ≤ right (${right}) → keep searching (${right - left + 1} left)`,
            narration: `The search window [${left}..${right}] still has ${right - left + 1} candidate${right - left ? 's' : ''}.`,
            frame: view({ left, right }),
        });

        const mid = left + Math.floor((right - left) / 2);
        t.push('mid', {
            codeLine: lines.MID,
            caption: `mid = ${left} + (${right} − ${left}) // 2 = ${mid}`,
            narration: `Check the middle of the window: index ${mid}, value ${els[mid].v}.`,
            frame: view({ left, right, mid }),
        });
        t.push('compare', {
            codeLine: lines.IF_EQ,
            caption: `arr[${mid}] = ${els[mid].v}  ==  ${target} ?  ${els[mid].v === target ? 'yes ✓' : 'no'}`,
            frame: view({ left, right, mid }),
        });

        if (els[mid].v === target) {
            t.push('found', {
                codeLine: lines.RETURN_FOUND,
                caption: `return ${mid}  →  found ${target} at index ${mid}`,
                narration: `Match! ${target} is at index ${mid}.`,
                frame: view({ left, right, mid, kind: 'found', done: true }),
            });
            t.push('done', {
                codeLine: lines.PRINT, caption: `Index: ${mid}`,
                frame: view({ left, right, mid, kind: 'found', done: true }),
            });
            return t.steps;
        }

        if (els[mid].v < target) {
            t.push('compare', {
                codeLine: lines.ELIF,
                caption: `arr[${mid}] = ${els[mid].v}  <  ${target} → answer is to the right`,
                narration: `The middle value is too small, so discard the left half including mid.`,
                frame: view({ left, right, mid }),
            });
            left = mid + 1;
            t.push('eliminate', {
                codeLine: lines.LEFT_UPD,
                caption: `left = ${mid} + 1 = ${left}`,
                frame: view({ left, right }),
            });
        } else {
            t.push('compare', {
                codeLine: lines.ELSE,
                caption: `arr[${mid}] = ${els[mid].v}  >  ${target} → answer is to the left`,
                narration: `The middle value is too big, so discard the right half including mid.`,
                frame: view({ left, right, mid }),
            });
            right = mid - 1;
            t.push('eliminate', {
                codeLine: lines.RIGHT_UPD,
                caption: `right = ${mid} − 1 = ${right}`,
                frame: view({ left, right }),
            });
        }
    }

    t.push('not-found', {
        codeLine: lines.WHILE,
        caption: `left (${left}) > right (${right}) → window empty`,
        narration: `The search window is empty; ${target} is not in the array.`,
        frame: { values: cloneEls(els), regions: [{ from: 0, to: n - 1, tone: 'eliminated', paint: true }], marks: [], pointers: [], badges: [{ id: 'tgt', text: `target = ${target}`, index: Math.floor(n / 2), tone: 'target' }], focus: null },
    });
    t.push('done', {
        codeLine: lines.RETURN_NEG, caption: `return -1`,
        frame: { values: cloneEls(els), regions: [{ from: 0, to: n - 1, tone: 'eliminated', paint: true }], marks: [], pointers: [], badges: [], focus: null },
    });
    t.push('done', {
        codeLine: lines.PRINT, caption: `Index: -1`,
        frame: { values: cloneEls(els), regions: [{ from: 0, to: n - 1, tone: 'eliminated', paint: true }], marks: [], pointers: [], badges: [], focus: null },
    });
    return t.steps;
}

export function Scene({ step, reduced }) {
    return <ArrayScene mode="cell" view={step?.frame || {}} reduced={reduced} />;
}

export default { meta, code, lines, lineAnchors, defaultInput, parseInput, validateInput, simulate, Scene };
