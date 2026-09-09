# dsa-viz

The animation core for the DSA sheet. One typed step model, one SVG scene-graph
primitive library, one theme, one player, one code panel, one registry.

A problem built here is ~2 screens of code (simulate + a thin Scene) instead of
a 350–1000 line bespoke file. Everything visual is shared.

```
engine/   ir.js · buildSteps.js · usePlayer.js · useCamera.js
scene/    SceneCanvas · ArrayTrack · PointerLayer · Edge · TreeLayout · BadgeLayer
          Cell · marks.js (tone→colour) · geometry.js · ArrayScene (array Scene body)
theme/    tokens.js   (palette · springs · durations · step delays · speeds)
ui/       CodePanel (prismjs) · Controls · Narration · highlight.js
ProblemPlayer.jsx     binds a registry entry to usePlayer + the sheet shell
problems/ index.js (registry) · <slug>.jsx
```

## Model

A visualization is a **precomputed immutable `Step[]`**. Playback is an index.
Each `Step` is a *declarative snapshot* of the whole world — it describes state,
never animation. Scene primitives diff consecutive frames and animate the
difference themselves (Framer Motion, keyed on entity identity).

```
Step = { i, kind, codeLine, caption, narration, frame }
```

`kind` drives pacing (theme/tokens `stepDelays`) and Scene emphasis.
`codeLine` (1-based) drives the code-panel highlight — kept honest by a DEV
assertion in `buildSteps` against `lines` + `lineAnchors`.

## Add a problem (5 steps)

1. **`problems/<slug>.jsx`** — export `meta`, `code(rawInput)`, `lines`,
   `lineAnchors`, `defaultInput`, `parseInput`, `validateInput`, `simulate`, `Scene`.
   Copy `code` **verbatim** from `pages/DSAProblemPage.jsx`'s
   `PROBLEM_CODE_TEMPLATES[slug]` and fill `lines`/`lineAnchors` to match.
2. **`simulate(parsed)`** — re-run the algorithm in JS; `makeTrace().push(kind, {…})`
   one step per meaningful moment. Wrap array values with `elements()` so swaps
   animate by identity. Build a full `frame` each push (cheap; use a local helper).
3. **`Scene({ step, reduced })`** — for an array problem, shape a `view` and
   render `<ArrayScene view={view} reduced={reduced}/>`. For a tree, use
   `<SceneCanvas><TreeLayout/></SceneCanvas>` + `layoutTree`. Add a new
   primitive under `scene/` only if no existing one fits.
4. **Register** in `problems/index.js`.
5. **Dispatch** — the slug is now in `DSA_VIZ_SLUGS`, so
   `DSAImmersiveVisualizer` routes it to `<ProblemPlayer>` automatically. Delete
   the old `components/DSAVisualizer/<Slug>Visualizer.jsx` and its import once
   you've eyeballed parity.

## Tones

Colour only ever comes from `scene/marks.js`. Ask for `toneStyle('compare')`,
never a hex. New visual state → add a tone there once.

## Reference problems

`bubble-sort` (array + pointers + swap), `binary-search` (region shading +
camera + badges), `fibonacci` (tree + edges + camera). Read these before adding
the next one.
