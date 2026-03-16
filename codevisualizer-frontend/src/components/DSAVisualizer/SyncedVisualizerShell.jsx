/**
 * SyncedVisualizerShell — shared layout wrapper for the five linear DSA visualizers:
 *   BubbleSort · SelectionSort · InsertionSort · BinarySearch · CharReplacement
 *
 * Renders the standard two-panel shell:
 *   Left  — algorithm animation area (scrollable) + MobileCodeDrawer at the bottom
 *   Right — desktop-only code panel + controls (hidden on mobile)
 *
 * The `controls` prop (a <VisualizerControls> element) is rendered in BOTH panels:
 *   • In MobileCodeDrawer's children slot (so MobileCodeDrawer can cloneElement it
 *     and inject compactMobile={true} automatically)
 *   • At the top of the desktop right panel, without modifications
 *
 * Props:
 *   code          {string}             Pseudocode string for the SyncedCodePanel
 *   activeLine    {number|null}        Currently executing line number
 *   executedLines {number[]}           Lines that have been executed so far
 *   drawerState   {string}             MobileCodeDrawer state ('peek'|'half'|'full')
 *   setDrawerState {Function}          Updater for drawerState
 *   controls      {React.Element}      A <VisualizerControls> element (rendered twice)
 *   scrollClass   {string=}            Optional override for the animation area's className
 *                                      (CharReplacement uses justify-start instead of justify-center)
 *   children      {React.ReactNode}    Algorithm-specific animation content
 */

import React from 'react';
import MobileCodeDrawer from './MobileCodeDrawer';
import { SyncedCodePanel } from './visualizerShared';

const DEFAULT_SCROLL_CLASS =
    'flex-1 flex flex-col items-center justify-center overflow-y-auto overscroll-contain ' +
    'touch-pan-y px-3 py-4 gap-5 md:px-8 md:py-10 md:gap-8';

const SyncedVisualizerShell = ({
    code,
    activeLine,
    executedLines,
    drawerState,
    setDrawerState,
    controls,
    scrollClass,
    children,
}) => (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
        <div className="flex-1 flex overflow-hidden min-h-0">

            {/* ── Left: animation area ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden relative min-w-0 pb-[64px] md:pb-0">
                <div className={scrollClass ?? DEFAULT_SCROLL_CLASS}>
                    {children}
                </div>

                {/* Mobile bottom-sheet: code drawer + controls */}
                <MobileCodeDrawer
                    code={code}
                    activeLine={activeLine}
                    executedLines={[...executedLines]}
                    drawerState={drawerState}
                    setDrawerState={setDrawerState}
                >
                    {controls}
                </MobileCodeDrawer>
            </div>

            {/* ── Right: controls + code panel (desktop only) ──────────── */}
            <div className="hidden md:flex flex-col border-l border-slate-700/60 bg-slate-900 overflow-hidden flex-shrink-0 h-full w-[380px]">
                {controls}
                <SyncedCodePanel
                    code={code}
                    activeLine={activeLine}
                    executedLines={[...executedLines]}
                />
            </div>

        </div>
    </div>
);

export default SyncedVisualizerShell;