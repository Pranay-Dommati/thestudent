/**
 * dsa-viz / problems / fibonacci  — REFERENCE
 *
 * Exercises: TreeLayout + layoutTree, Edge draw-on with call/return states,
 * camera auto-pan to the active node. Replaces FibonacciVisualizer.jsx and
 * proves the tree path the merge/quick-sort visualizers will later reuse.
 */
import React from 'react';
import SceneCanvas from '../scene/SceneCanvas';
import TreeLayout, { layoutTree } from '../scene/TreeLayout';
import { makeTrace } from '../engine/ir';

const NODE_R = 26;

export const code = (inputStr = '5') => {
    const n = parseInt(String(inputStr).trim(), 10) || 5;
    return `def fibonacci(n):
    # base cases
    if n == 0:
        return 0
    if n == 1:
        return 1

    # recursive calls stored in variables
    first = fibonacci(n - 1)
    second = fibonacci(n - 2)

    return first + second

n = ${n}
print(fibonacci(n))`;
};

export const lines = { FN: 1, IF0: 3, RET0: 4, IF1: 5, RET1: 6, FIRST: 9, SECOND: 10, RETURN: 12, N: 14, PRINT: 15 };
export const lineAnchors = {
    FN: 'def fibonacci(n):',
    IF0: 'if n == 0:',
    RET0: 'return 0',
    IF1: 'if n == 1:',
    RET1: 'return 1',
    FIRST: 'first = fibonacci(n - 1)',
    SECOND: 'second = fibonacci(n - 2)',
    RETURN: 'return first + second',
};

export const meta = { title: 'Fibonacci', pattern: 'recursion', difficulty: 'easy' };
export const defaultInput = '5';

export const parseInput = (raw) => {
    const v = parseInt(String(raw ?? '').trim(), 10);
    return Number.isNaN(v) || v < 1 ? 5 : Math.min(v, 7);
};

export const validateInput = (raw) => {
    const v = parseInt(String(raw ?? '').trim(), 10);
    if (Number.isNaN(v) || v < 1) return 'Must be a positive integer';
    if (v > 7) return 'Max n = 7 (tree gets too large)';
    return '';
};

// state → node tone
const TONE = { active: 'call', checking: 'checking', recursing: 'recursing' };
const doneTone = (isBase) => (isBase ? 'base' : 'combined');

export function simulate(n) {
    // build tree
    let seq = 0;
    const build = (val, depth) => {
        const node = { id: `f${seq++}`, n: val, depth, children: [], isBase: val <= 1, result: val <= 1 ? val : null };
        if (val > 1) node.children = [build(val - 1, depth + 1), build(val - 2, depth + 1)];
        return node;
    };
    const root = build(n, 0);
    const { width, height } = layoutTree(root, { levelH: 92, leafW: 72 });
    const OY = NODE_R + 6;

    const all = [];
    (function collect(x) { all.push(x); x.children.forEach(collect); })(root);
    const byId = Object.fromEntries(all.map((x) => [x.id, x]));

    const world = { w: Math.max(width, 260), h: height + OY * 2 };

    const state = {};        // id -> 'active'|'checking'|'recursing'|'done'
    const returns = {};      // id -> value
    const edgeState = {};    // 'pid>cid' -> 'active'|'done'
    const visible = new Set();

    const t = makeTrace();

    const snapshot = (activeId, extra = {}) => {
        const nodes = [...visible].map((id) => {
            const nd = byId[id];
            const s = state[id] || 'active';
            const done = s === 'done';
            return {
                id,
                label: done ? String(returns[id]) : `f(${nd.n})`,
                sub: done ? `f(${nd.n})` : null,
                x: nd.x, y: nd.y + OY,
                tone: done ? doneTone(nd.isBase) : (TONE[s] || 'call'),
                active: id === activeId,
            };
        });
        const edges = [];
        all.forEach((p) => p.children.forEach((c) => {
            if (!visible.has(p.id) || !visible.has(c.id)) return;
            const k = `${p.id}>${c.id}`;
            edges.push({
                id: k,
                from: { x: p.x, y: p.y + OY + NODE_R },
                to: { x: c.x, y: c.y + OY - NODE_R },
                state: edgeState[k] || 'pending',
            });
        }));
        const a = activeId ? byId[activeId] : null;
        const focusBox = a
            ? { x: a.x - 90, y: a.y + OY - 90, w: 180, h: 180 }
            : (extra.wholeTree ? { x: 0, y: 0, w: world.w, h: world.h } : null);
        return { tree: { nodes, edges }, focusBox, world };
    };

    t.push('setup', {
        codeLine: lines.N, caption: `n = ${n}`,
        narration: `Compute fibonacci(${n}) by recursion — watch the call tree grow, then collapse as results return.`,
        frame: snapshot(null),
    });
    t.push('setup', { codeLine: lines.PRINT, caption: `print(fibonacci(${n}))`, frame: snapshot(null) });

    const dfs = (node) => {
        visible.add(node.id);
        state[node.id] = 'active';
        if (node.depth > 0) {
            const parent = all.find((p) => p.children.some((c) => c.id === node.id));
            edgeState[`${parent.id}>${node.id}`] = 'active';
        }
        t.push('recurse', {
            codeLine: lines.FN, caption: `fibonacci(${node.n})  — enter`,
            narration: `Call fibonacci(${node.n}).`,
            frame: snapshot(node.id),
        });

        state[node.id] = 'checking';
        t.push('recurse', {
            codeLine: lines.IF0, caption: `if ${node.n} == 0 ?  ${node.n === 0 ? 'yes → base case' : 'no'}`,
            frame: snapshot(node.id),
        });
        if (node.n === 0) {
            state[node.id] = 'done'; returns[node.id] = 0;
            markDoneEdge(node);
            t.push('return', {
                codeLine: lines.RET0, caption: `return 0  — base case`,
                narration: `fibonacci(0) returns 0.`,
                frame: snapshot(node.id),
            });
            return 0;
        }
        t.push('recurse', {
            codeLine: lines.IF1, caption: `if ${node.n} == 1 ?  ${node.n === 1 ? 'yes → base case' : 'no'}`,
            frame: snapshot(node.id),
        });
        if (node.n === 1) {
            state[node.id] = 'done'; returns[node.id] = 1;
            markDoneEdge(node);
            t.push('return', {
                codeLine: lines.RET1, caption: `return 1  — base case`,
                narration: `fibonacci(1) returns 1.`,
                frame: snapshot(node.id),
            });
            return 1;
        }

        state[node.id] = 'recursing';
        t.push('recurse', {
            codeLine: lines.FIRST, caption: `first = fibonacci(${node.n - 1})`,
            narration: `Recurse into the left child, fibonacci(${node.n - 1}).`,
            frame: snapshot(node.id),
        });
        const l = dfs(node.children[0]);

        state[node.id] = 'recursing';
        t.push('recurse', {
            codeLine: lines.SECOND, caption: `second = fibonacci(${node.n - 2})`,
            narration: `Recurse into the right child, fibonacci(${node.n - 2}).`,
            frame: snapshot(node.id),
        });
        const r = dfs(node.children[1]);

        const res = l + r;
        state[node.id] = 'done'; returns[node.id] = res;
        markDoneEdge(node);
        t.push('combine', {
            codeLine: lines.RETURN, caption: `return ${l} + ${r} = ${res}`,
            narration: `fibonacci(${node.n}) combines its children: ${l} + ${r} = ${res}.`,
            frame: snapshot(node.id),
        });
        return res;
    };

    function markDoneEdge(node) {
        if (node.depth === 0) return;
        const parent = all.find((p) => p.children.some((c) => c.id === node.id));
        edgeState[`${parent.id}>${node.id}`] = 'done';
    }

    const result = dfs(root);

    t.push('done', {
        codeLine: lines.PRINT, caption: `fibonacci(${n}) = ${result}  ✓`,
        narration: `Done — fibonacci(${n}) = ${result}.`,
        frame: snapshot(root.id, { wholeTree: true }),
    });

    return t.steps;
}

export function Scene({ step, reduced }) {
    const f = step?.frame || {};
    const tree = f.tree || { nodes: [], edges: [] };
    const world = f.world || { w: 320, h: 240 };
    return (
        <SceneCanvas world={world} focusBox={f.focusBox || null} reduced={reduced} camera={{ fill: 0.5, maxScale: 1.9 }}>
            <TreeLayout nodes={tree.nodes} edges={tree.edges} nodeR={NODE_R} reduced={reduced} />
        </SceneCanvas>
    );
}

export default { meta, code, lines, lineAnchors, defaultInput, parseInput, validateInput, simulate, Scene };
