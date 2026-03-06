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
| Code highlighting, annotation card, playback state machine | `visualizerShared.jsx` |
| Playback controls UI | `VisualizerControls.jsx` |
| Mobile bottom-sheet with code | `MobileCodeDrawer.jsx` |

---

## 2. DSA Visualizer Rules

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
2. Replace the manual `scrollRef + isMobile useState + resize useEffect + canvasZoom + auto-scroll useEffect` block with:
   ```js
   const { scrollRef, isMobile, canvasZoom } = useTreeCanvas({
       events, allNodes, eventIdx, inputArr,
       ignoreTypes: ['event_types_that_should_not_trigger_scroll'],
   });
   ```
3. Keep only a single `useEffect(() => { setEventIdx(-1)... }, [inputArr])` reset — the scroll-to-top on reset is handled inside `useTreeCanvas`.
4. Do NOT copy the `isMobile` useState + resize listener pattern inline — it lives in `useTreeCanvas.js`.

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
                                 makeGetDelay
  useTreeCanvas.js            ← useIsMobile, useTreeCanvas
  SyncedVisualizerShell.jsx   ← full two-panel layout for linear visualizers
  MobileCodeDrawer.jsx        ← mobile bottom-sheet (used inside SyncedVisualizerShell)
  VisualizerControls.jsx      ← playback controls UI
```

---

## 5. When in Doubt

Ask: *"Does this logic already exist somewhere in the codebase?"*  
Search `visualizerShared.jsx`, `useTreeCanvas.js`, and `SyncedVisualizerShell.jsx` before writing new code.
