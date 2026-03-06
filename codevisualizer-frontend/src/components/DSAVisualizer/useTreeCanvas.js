/**
 * useTreeCanvas — shared hook for tree-based visualizers (QuickSort, MergeSort).
 *
 * Encapsulates:
 *   • Mobile detection + resize listener
 *   • Canvas zoom (0.6 on mobile, 1 on desktop)
 *   • scrollRef creation
 *   • Scroll-to-top on input change
 *   • Auto-pan X + Y to the active node on each event step
 *
 * Usage:
 *   const { scrollRef, isMobile, canvasZoom } = useTreeCanvas({
 *       events, allNodes, eventIdx, inputArr,
 *       ignoreTypes: ['merge_detail'],   // optional — skip scroll for these event types
 *   });
 *   // Attach scrollRef to the scrollable <div ref={scrollRef}>
 */

import { useState, useEffect, useRef } from 'react';

/**
 * useIsMobile — returns true when the viewport is narrower than 768 px (md breakpoint).
 * Updates automatically on window resize.
 */
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.innerWidth < 768
    );
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
    return isMobile;
};

/**
 * useTreeCanvas — camera / scroll manager for SVG tree canvases.
 *
 * @param {object}   params
 * @param {Array}    params.events      Full events array from the simulation
 * @param {Array}    params.allNodes    Flat list of all tree nodes (must have .id, .x, .y)
 * @param {number}   params.eventIdx    Current step index (-1 = not started)
 * @param {*}        params.inputArr    The parsed input array (used only to detect resets)
 * @param {string[]} params.ignoreTypes Event types that should NOT trigger auto-scroll
 */
export const useTreeCanvas = ({ events, allNodes, eventIdx, inputArr, ignoreTypes = [] }) => {
    const scrollRef  = useRef(null);
    const isMobile   = useIsMobile();
    const canvasZoom = isMobile ? 0.6 : 1;

    // Reset scroll position whenever the input array changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    }, [inputArr]);

    // Auto-pan: scroll both X (to active node's column) and Y (to active node's row)
    useEffect(() => {
        const ev = events[eventIdx];
        if (!ev || !scrollRef.current) return;
        if (ignoreTypes.includes(ev.type)) return;

        const c          = scrollRef.current;
        const activeNode = allNodes.find(n => n.id === ev.nodeId);
        const scrollLeft = activeNode
            ? Math.max(0, activeNode.x * canvasZoom - c.clientWidth / 2)
            : c.scrollLeft;

        c.scrollTo({
            top:  Math.max(0, (ev.scrollY ?? 0) * canvasZoom - c.clientHeight / 2 + 80 * canvasZoom),
            left: scrollLeft,
            behavior: 'smooth',
        });
    }, [eventIdx, events, allNodes, canvasZoom, ignoreTypes]);

    return { scrollRef, isMobile, canvasZoom };
};
