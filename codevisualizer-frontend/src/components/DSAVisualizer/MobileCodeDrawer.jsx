/**
 * MobileCodeDrawer
 *
 * Mobile-only bottom-sheet drawer that shows the code panel with 3 states:
 *   - "peek"  : default — shows drag handle + current-line badge only (~80px)
 *   - "half"  : shows ~45% of screen height — partial code visible
 *   - "full"  : full screen overlay — full code panel
 *
 * The desktop code panel is completely separate and unaffected.
 *
 * Props:
 *   code          {string}    Full code string
 *   activeLine    {number}    1-based currently-executing line
 *   executedLines {number[]}  1-based already-executed lines
 *   drawerState   {"peek"|"half"|"full"}
 *   setDrawerState Function
 *   children      Optional content to render above SyncedCodePanel (e.g. VisualizerControls)
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncedCodePanel } from './visualizerShared';

const HEIGHTS = {
    peek: 64,     // handle + header row with inline controls
    half: 0.35,   // fraction of window.innerHeight
    full: 0.92,   // fraction of window.innerHeight
};

const getHeightPx = (state) => {
    const wh = window.innerHeight;
    if (state === 'peek') return HEIGHTS.peek;
    if (state === 'half') return Math.round(wh * HEIGHTS.half);
    return Math.round(wh * HEIGHTS.full);
};

const STATES_ORDER = ['peek', 'half', 'full'];

const MobileCodeDrawer = ({
    code,
    activeLine,
    executedLines,
    drawerState = 'peek',
    setDrawerState,
    children,  // VisualizerControls rendered here
}) => {
    // Touch drag tracking
    const dragStartY   = useRef(null);
    const dragStartH   = useRef(null);
    const [dragH, setDragH] = useState(null);   // override height while dragging

    const currentH = dragH ?? getHeightPx(drawerState);

    const onTouchStart = useCallback((e) => {
        dragStartY.current = e.touches[0].clientY;
        dragStartH.current = getHeightPx(drawerState);
    }, [drawerState]);

    const onTouchMove = useCallback((e) => {
        if (dragStartY.current == null) return;
        const dy = dragStartY.current - e.touches[0].clientY;  // positive = drag up = taller
        const newH = Math.max(HEIGHTS.peek, Math.min(getHeightPx('full') + 40, dragStartH.current + dy));
        setDragH(newH);
    }, []);

    const onTouchEnd = useCallback(() => {
        if (dragH == null) { dragStartY.current = null; return; }
        const wh = window.innerHeight;
        const halfH = Math.round(wh * HEIGHTS.half);
        const fullH = Math.round(wh * HEIGHTS.full);
        const peekH = HEIGHTS.peek;

        let snapped;
        if (dragH < (peekH + halfH) / 2) {
            snapped = 'peek';
        } else if (dragH < (halfH + fullH) / 2) {
            snapped = 'half';
        } else {
            snapped = 'full';
        }
        setDrawerState(snapped);
        setDragH(null);
        dragStartY.current = null;
    }, [dragH, setDrawerState]);

    // Tap the handle to cycle: peek → half → full → peek
    const handleTap = useCallback(() => {
        if (dragH != null) return; // was a drag, not a tap
        const idx = STATES_ORDER.indexOf(drawerState);
        setDrawerState(STATES_ORDER[(idx + 1) % STATES_ORDER.length]);
    }, [drawerState, setDrawerState, dragH]);

    // Derive the currently-executing line text for peek chip
    const lines = code ? code.split('\n') : [];
    const activeLineText = activeLine ? lines[activeLine - 1]?.trim() : null;

    return (
        // Only visible on mobile (hidden md:)
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-40"
            style={{
                height: currentH,
                transition: dragH != null ? 'none' : 'height 0.28s cubic-bezier(0.25,0.8,0.25,1)',
            }}
        >
            {/* Sheet surface */}
            <div className="flex flex-col h-full bg-slate-900 border-t-2 border-slate-600/70 rounded-t-2xl overflow-hidden shadow-2xl">

                {/* ── Drag handle ── */}
                <div
                    className="flex-shrink-0 flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing select-none"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onClick={handleTap}
                >
                    <div className="w-10 h-1 rounded-full bg-slate-600 mb-1.5" />

                    {/* Header row: code icon + line chip + inline controls */}
                    <div className="flex items-center justify-between w-full px-3">
                        <div className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 flex-shrink-0">
                                <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
                            </svg>
                            <span className="text-[11px] font-semibold text-slate-400 tracking-wide">CODE</span>
                            {activeLine && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-mono">
                                    line {activeLine}
                                </span>
                            )}
                        </div>
                        {/* Controls inline on the right — stop propagation so clicks don't trigger handleTap */}
                        <div onClick={e => e.stopPropagation()}>
                            {children && React.cloneElement(children, { compactMobile: true })}
                        </div>
                    </div>
                </div>

                {/* ── Code panel: only visible in half / full states ── */}
                <AnimatePresence>
                    {drawerState !== 'peek' && (
                        <motion.div
                            key="code-panel"
                            className="flex flex-col flex-1 min-h-0 overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <SyncedCodePanel
                                code={code}
                                activeLine={activeLine}
                                executedLines={executedLines}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MobileCodeDrawer;
