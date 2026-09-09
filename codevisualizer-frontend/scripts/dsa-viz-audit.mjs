/**
 * dsa-viz audit — headless correctness check for a migrated problem.
 *
 *   node scripts/dsa-viz-audit.mjs [slug ...]
 *
 * Catches, without a browser, the classes of bug that reading the code does not:
 *
 *   1 placement — every pointer badge sits in its row and its arrow + guide
 *                 actually reach the array. (A badge translated in x but not y
 *                 once put every pointer at the top of the canvas while its
 *                 guide line stayed correctly beside the array; render tests
 *                 passed, because framer emits no transforms during SSR. Hence
 *                 placement lives in pure functions that this can assert on.)
 *   2 honesty   — no step may show a variable the highlighted line has not
 *                 produced yet, e.g. drawing `j` while line 4 is active.
 *   3 flow      — the code-line sequence must be a legal path through the
 *                 Python on screen, so stepping never appears to skip a line.
 *   3b required — if a line is highlighted, the variable that line is about must
 *                 be on screen (`for j in ...` active with no `j` anywhere).
 *   4 motion    — every step carries a visual event, or Play stutters.
 *   5 layout    — index rail / brace row / pointer row never overlap and
 *                 nothing is drawn outside the viewBox.
 *   6 continuity— a pointer never blinks out for a single step.
 *   7 bands     — regions partition the array rather than overlapping, and
 *                 braces (which share one row) do not overlap either.
 *
 * Every rule here exists because it caught a real bug; each is verified by
 * fault injection before being trusted. Add a rule whenever a defect gets past
 * this and reaches a human.
 */
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

const ARROW = 19;
const BADGE_HALF = 13;

const SLUGS = process.argv.slice(2).length ? process.argv.slice(2) : ['bubble-sort'];

const INPUTS = {
    'bubble-sort': [
        '[5, 1, 4, 2, 8, 0, 2]',
        '[1,2,3,4,5]',
        '[5,4,3,2,1]',
        '[3,3,3]',
        '[9]',
        '[-5,12,0,-2,7,7,3,11,-8,4,6,1]',
    ],
};

// legal predecessor lines for each line of the traced control flow
const FLOW = {
    'bubble-sort': (L) => ({
        [L.CALL]: [L.ARR],
        [L.N]: [L.CALL],
        [L.OUTER]: [L.N, L.CHECK_SORTED],
        [L.SWAPPED_FALSE]: [L.OUTER],
        [L.INNER]: [L.SWAPPED_FALSE, L.COMPARE, L.SWAPPED_TRUE],
        [L.COMPARE]: [L.INNER],
        [L.SWAP]: [L.COMPARE],
        [L.SWAPPED_TRUE]: [L.SWAP],
        [L.CHECK_SORTED]: [L.INNER],
        [L.BREAK]: [L.CHECK_SORTED],
        [L.RETURN]: [L.CHECK_SORTED, L.BREAK],
        [L.PRINT]: [L.RETURN],
    }),
};

// variables that must not appear in any visual before their defining line runs
const NOT_BEFORE = {
    'bubble-sort': (L) => [{ name: 'j', line: L.INNER }],
};

// variables that MUST be visible whenever their line is the active one — a
// loop header that highlights while its counter is nowhere on screen leaves the
// reader guessing why the loop did what it did
const MUST_SHOW = {
    'bubble-sort': (L) => [{ name: 'j', line: L.INNER }],
};

const vite = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
});

const { placePointers } = await vite.ssrLoadModule('/src/dsa-viz/scene/PointerLayer.jsx');
const { barGeometry } = await vite.ssrLoadModule('/src/dsa-viz/scene/geometry.js');

let failures = 0;
const fail = (msg) => { console.log(`   FAIL ${msg}`); failures++; };

for (const slug of SLUGS) {
    const P = (await vite.ssrLoadModule(`/src/dsa-viz/problems/${slug}.jsx`)).default;
    const L = P.lines;
    const flow = FLOW[slug]?.(L);
    const guards = NOT_BEFORE[slug]?.(L) ?? [];
    const required = MUST_SHOW[slug]?.(L) ?? [];
    const src = P.code(P.defaultInput).split('\n');

    for (const raw of INPUTS[slug] || [P.defaultInput]) {
        const input = P.parseInput(raw);
        const steps = P.simulate(input);
        const n = input.length;
        const geom = barGeometry({
            count: n,
            values: input.map((v) => ({ v })),
            maxSlotW: n <= 4 ? 150 : n <= 6 ? 124 : 108,
        });
        const worldH = geom.ptrY('bottom', 0) + 40;
        const tag = `[${slug} ${raw}]`;

        // ── 5 layout: the fixed rows below the array must not collide ───────
        const rows = [
            ['index', geom.indexY - 8, geom.indexY + 8],
            ['brace', geom.spanY - BADGE_HALF, geom.spanY + BADGE_HALF],
            ['pointer', geom.ptrY('bottom', 0) - ARROW, geom.ptrY('bottom', 0) + BADGE_HALF],
        ];
        for (let a = 0; a < rows.length; a++) {
            for (let b = a + 1; b < rows.length; b++) {
                const ov = Math.min(rows[a][2], rows[b][2]) - Math.max(rows[a][1], rows[b][1]);
                if (ov > 0) fail(`${tag} row "${rows[a][0]}" overlaps "${rows[b][0]}" by ${ov}`);
            }
        }

        let prevLine = null;
        const seenAt = new Map();   // pointer id -> [step indices]
        steps.forEach((s, ix) => {
            const f = s.frame;
            const at = `${tag} step ${ix} (${s.kind}, line ${s.codeLine})`;

            // ── 1 placement ────────────────────────────────────────────────
            for (const p of placePointers(geom, f.pointers || [])) {
                if (p.y !== geom.ptrY(p.side, p.depth)) {
                    fail(`${at}: pointer "${p.label}" y=${p.y} is off its row`);
                }
                const tipAbs = p.y + p.arrowTip;
                const pointsAtArray = p.top
                    ? tipAbs > p.y && tipAbs <= geom.plotTop
                    : tipAbs < p.y && tipAbs >= geom.baseline;
                if (!pointsAtArray) {
                    fail(`${at}: pointer "${p.label}" arrow tip at ${tipAbs} does not point at the array (badge ${p.y}, array edge ${p.arrayEdge})`);
                }
                for (const [y1, y2] of p.guide) {
                    for (const gy of [p.y + y1, p.y + y2]) {
                        const ok = p.top
                            ? gy >= p.y && gy <= geom.plotTop
                            : gy <= p.y && gy >= geom.baseline;
                        if (!ok) fail(`${at}: pointer "${p.label}" guide point ${gy} falls outside the badge..array span`);
                    }
                }
                if (p.y + BADGE_HALF > worldH) fail(`${at}: pointer "${p.label}" is below the viewBox`);
                if (p.x < 0 || p.x > geom.width) fail(`${at}: pointer "${p.label}" x=${p.x} is outside the track`);
            }

            // ── 2 honesty ──────────────────────────────────────────────────
            for (const g of guards) {
                if (s.codeLine >= g.line) continue;
                const re = new RegExp(`\\b${g.name}\\b`);
                if ((f.pointers || []).some((p) => re.test(String(p.label)))) {
                    fail(`${at}: shows a "${g.name}" pointer before line ${g.line} ("${src[g.line - 1]?.trim()}") has run`);
                }
                if ((f.spans || []).some((sp) => re.test(String(sp.label)))) {
                    fail(`${at}: brace mentions "${g.name}" before line ${g.line} has run`);
                }
                if (re.test(String(s.caption)) || re.test(String(s.narration))) {
                    fail(`${at}: text mentions "${g.name}" before line ${g.line} has run`);
                }
            }

            // ── 2b required: the active line's own variable must be on screen
            for (const r of required) {
                if (s.codeLine !== r.line) continue;
                const re = new RegExp(String.raw`\b${r.name}\b`);
                if (!(f.pointers || []).some((p) => re.test(String(p.label)))) {
                    fail(`${at}: line ${r.line} ("${src[r.line - 1]?.trim()}") is active but no "${r.name}" pointer is shown`);
                }
            }

            // record pointer presence for the continuity pass
            for (const p of f.pointers || []) {
                if (!seenAt.has(p.id)) seenAt.set(p.id, []);
                seenAt.get(p.id).push(ix);
            }

            // ── 3 flow ─────────────────────────────────────────────────────
            if (flow && prevLine !== null && s.codeLine !== prevLine) {
                const allowed = flow[s.codeLine];
                if (allowed && !allowed.includes(prevLine)) {
                    fail(`${at}: illegal jump from line ${prevLine} ("${src[prevLine - 1]?.trim()}") to line ${s.codeLine} ("${src[s.codeLine - 1]?.trim()}")`);
                }
            }
            prevLine = s.codeLine;

            // ── 4 motion ───────────────────────────────────────────────────
            const moves = f.reveal || f.pulse || f.exchange
                || (f.lock !== null && f.lock !== undefined)
                || f.relation || (f.spans || []).length || (f.pointers || []).length;
            if (!moves) fail(`${at}: no visual event — Play will stall on this step`);

            // ── 7 bands: regions partition the array, they never overlap; and
            //    braces share one row, so they must not overlap either
            const overlaps = (list, what) => {
                for (let a = 0; a < list.length; a++) {
                    for (let b = a + 1; b < list.length; b++) {
                        const A = list[a], B = list[b];
                        const ov = Math.min(A.to, B.to) - Math.max(A.from, B.from) + 1;
                        if (ov > 0) {
                            fail(`${at}: ${what} "${A.key || A.id || A.tone}" [${A.from}..${A.to}] and "${B.key || B.id || B.tone}" [${B.from}..${B.to}] both cover ${ov} slot(s)`);
                        }
                    }
                }
            };
            overlaps(f.regions || [], 'regions');
            overlaps(f.spans || [], 'braces');
        });

        // ── 6 continuity: a pointer must not blink out for a single step ───
        for (const [id, at] of seenAt) {
            for (let k = 1; k < at.length; k++) {
                if (at[k] - at[k - 1] === 2) {
                    fail(`${tag} pointer "${id}" vanishes for exactly one step (present at ${at[k - 1]} and ${at[k]}, gone at ${at[k - 1] + 1} — line ${steps[at[k - 1] + 1].codeLine}) — reads as a flicker`);
                }
            }
        }

        // render a spread of steps to catch throws
        let rendered = 0;
        const stride = Math.max(1, Math.floor(steps.length / 10));
        for (let k = 0; k < steps.length; k += stride) {
            renderToStaticMarkup(React.createElement(P.Scene, { step: steps[k], reduced: false }));
            rendered++;
        }
        console.log(`${slug.padEnd(13)} ${raw.padEnd(32)} steps=${String(steps.length).padStart(3)} rendered=${rendered}`);
    }
}

await vite.close();
console.log(failures
    ? `\n${failures} FAILURE(S)`
    : '\nAUDIT CLEAN — placement · honesty · flow · motion · layout · continuity · bands');
process.exit(failures ? 1 : 0);
