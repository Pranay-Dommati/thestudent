# Copilot Instructions — EasyLearnVA Codebase

These rules apply to every prompt in this workspace. Follow them strictly before writing any code.

---

## 1. Check Before Creating

Before writing any new component, hook, utility, or constant, search the codebase for an existing one that does the same job.

| What you need | Where to look first |
|---|---|
| Layout shell (left animation + right code panel + mobile drawer) | `SyncedVisualizerShell.jsx` |
| Mobile detection + canvas zoom + auto-scroll (tree visualizers) | `useTreeCanvas.js` → `useTreeCanvas()` |
| Mobile-only responsive boolean | `useTreeCanvas.js` → `useIsMobile()` |
| Per-event animation delay function | `visualizerShared.jsx` → `makeGetDelay(DELAY, defaultMs)` |
| Array cells + L/M/R pointer row + index row (binary-search family) | `SearchArrayVisual.jsx` → `SearchArrayVisual` (default export) |
| Cell size constants for binary-search-style visualizers | `SearchArrayVisual.jsx` → `SEARCH_CELL_W`, `SEARCH_CELL_H`, `SEARCH_CELL_GAP` |
| Code highlighting, annotation card, playback state machine | `visualizerShared.jsx` |
| Compact annotation strip for tree visualizers | `visualizerShared.jsx` → `TreeAnnotationStrip` |
| Scrollable SVG+HTML canvas with animated edges (tree visualizers) | `TreeCanvas.jsx` → `TreeCanvas` (default export) |
| Playback controls UI | `VisualizerControls.jsx` |
| Mobile bottom-sheet with code | `MobileCodeDrawer.jsx` |

---

## 2. DSA Visualizer Rules

### Adding a new BINARY SEARCH family visualizer (Find Peak Element, First/Last Position, etc.)

1. Import `SearchArrayVisual` (default) and constants from `SearchArrayVisual.jsx`:
   ```js
   import SearchArrayVisual, { SEARCH_CELL_W, SEARCH_CELL_H, SEARCH_CELL_GAP } from './SearchArrayVisual';
   ```
2. Define `getCellBg(idx, ev) → Tailwind className` for your specific highlight logic.
3. Define module-scope `SHOW_L`, `SHOW_R`, `SHOW_M` Sets of event types where each pointer is visible.
4. Render in the `SyncedVisualizerShell` children:
   ```jsx
   <SearchArrayVisual
       arr={displayArr} n={n} ev={currentEv}
       getCellBg={getCellBg}
       showL={SHOW_L.has(type)} showR={SHOW_R.has(type)} showM={SHOW_M.has(type)}
       blink={type === 'while_exit'}
       topSlot={<TargetBox ... />}  {/* optional — only if problem has a target */}
       shimmerIdx={null}            {/* optional — shimmer one cell (Binary Search uses this) */}
   />
   ```
5. Do NOT copy `PointerBadgeRow`, manual cell rendering, or index row — `SearchArrayVisual` owns all of that.

### Adding a new LINEAR visualizer (array-based: sorts, searches, sliding window)

1. Import `SyncedVisualizerShell` instead of wiring up `MobileCodeDrawer` + `SyncedCodePanel` manually.
2. Import `makeGetDelay` from `visualizerShared` and use it:
   ```js
   const getDelay = makeGetDelay(DELAY, 1200); // or 1400 — match the algo's pace
   ```
3. Define a `controls` const (single `<VisualizerControls>` element) and pass it to the shell — it renders in both mobile and desktop panels automatically.
4. Return:
   ```jsx
   const controls = <VisualizerControls speed={speed} setSpeed={setSpeed} ... />;
   return (
     <SyncedVisualizerShell code={code} activeLine={activeLine} executedLines={executedLines}
         drawerState={drawerState} setDrawerState={setDrawerState} controls={controls}>
       {/* algorithm-specific animation content only */}
     </SyncedVisualizerShell>
   );
   ```
5. Use `scrollClass` prop on the shell ONLY when `justify-center` must be overridden (e.g. `justify-start` for tall content).
6. Do NOT import or use `MobileCodeDrawer` or `SyncedCodePanel` directly in new linear visualizers.

### Adding a new TREE visualizer (recursive call-tree: sorts, BST, etc.)

1. Import `useTreeCanvas` from `useTreeCanvas.js`:
   ```js
   import { useTreeCanvas } from './useTreeCanvas';
   ```
2. Import `TreeCanvas` (default) from `TreeCanvas.jsx` and `TreeAnnotationStrip` from `visualizerShared.jsx`:
   ```js
   import TreeCanvas from './TreeCanvas';
   import { ..., TreeAnnotationStrip } from './visualizerShared';
   ```
3. Replace the manual `scrollRef + isMobile useState + resize useEffect + canvasZoom + auto-scroll useEffect` block with:
   ```js
   const { scrollRef, isMobile, canvasZoom } = useTreeCanvas({
       events, allNodes, eventIdx, inputArr,
       ignoreTypes: ['event_types_that_should_not_trigger_scroll'],
   });
   ```
4. In the render, use `TreeAnnotationStrip` for the annotation bar and `TreeCanvas` for the canvas:
   ```jsx
   <TreeAnnotationStrip annotation={annotation} />
   <TreeCanvas
       scrollRef={scrollRef}
       canvasW={canvasW} canvasH={canvasH} canvasZoom={canvasZoom}
       edgeList={edgeList}          {/* [{ key, x1,y1, x2,y2, done }] */}
       strokeWidth={1.8}            {/* optional, default 1.8 */}
       centered={false}             {/* true for linear chains (Factorial) */}
       svgExtras={null}             {/* optional SVG JSX rendered after edges (e.g. text labels) */}
   >
       {/* HTML node layer only — AnimatePresence + motion.divs */}
   </TreeCanvas>
   ```
5. Keep only a single `useEffect(() => { setEventIdx(-1)... }, [inputArr])` reset — the scroll-to-top on reset is handled inside `useTreeCanvas`.
6. Do NOT copy the `isMobile` useState + resize listener pattern inline — it lives in `useTreeCanvas.js`.
7. Do NOT inline the annotation strip div or the canvas scroll/SVG structure — they live in `TreeAnnotationStrip` and `TreeCanvas`.

---

## 3. General Modularity Rules

- **No inline duplication across files.** If the same logic appears in 2+ places, extract it.
- **No 1000+ line files.** If a component file exceeds ~400 lines, split out sub-components or hooks.
- **Shared logic lives in shared files.** Hooks → `hooks/` or alongside consumers if DSA-specific. UI primitives → dedicated component files.
- **One export per concern.** `visualizerShared.jsx` owns shared DSA UI + utilities. Do not paste its exports into other files.
- **Pass elements as props, not duplicated JSX.** The `controls` prop pattern in `SyncedVisualizerShell` is the model — render once, pass everywhere.

---

## 4. File Reference

```
codevisualizer-frontend/src/components/DSAVisualizer/
  visualizerShared.jsx        ← highlightSyntax, SyncedCodePanel, AnnotationCard,
                                 BLINK_ANIM/TRANS, parseInputArray, useVisualizerPlayback,
                                 makeGetDelay, TreeAnnotationStrip
  useTreeCanvas.js            ← useIsMobile, useTreeCanvas
  TreeCanvas.jsx              ← scrollable SVG+HTML canvas for tree visualizers
                                 props: scrollRef, canvasW/H, canvasZoom, edgeList,
                                        strokeWidth, svgExtras, centered, children
  SyncedVisualizerShell.jsx   ← full two-panel layout for linear visualizers
  SearchArrayVisual.jsx       ← pointer-array canvas (L/M/R) for Binary Search family
                                 exports: SearchArrayVisual (default), SEARCH_CELL_W/H/GAP
  MobileCodeDrawer.jsx        ← mobile bottom-sheet (used inside SyncedVisualizerShell)
  VisualizerControls.jsx      ← playback controls UI
```

---

## 5. When in Doubt

Ask: *"Does this logic already exist somewhere in the codebase?"*  
Search `visualizerShared.jsx`, `useTreeCanvas.js`, and `SyncedVisualizerShell.jsx` before writing new code.

---

## 6. Validation and Build Policy

- Do NOT run a full build for every small fix.
- Prefer targeted validation first (lint only for touched files, focused tests, or type-check for changed scope).
- Run a full build only when changes affect build configuration, shared foundations, or release-critical flows.
- If full validation is skipped for speed, clearly state what was run and what was not run.
