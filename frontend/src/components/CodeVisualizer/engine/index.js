/**
 * Animation Engine - Entry Point
 * ==============================
 * 
 * Enterprise-level code visualization engine using:
 * - PixiJS for WebGL rendering (persistent objects)
 * - GSAP for timeline-based animations (master clock)
 * - Custom orchestration layer (semantic commands)
 * 
 * Architecture:
 * - TimelineEngine: Master timeline orchestrator
 * - PixiRenderer: WebGL canvas manager
 * - VisualObjects: Persistent visual entities
 */

// Enterprise Animation Engine
export { TimelineEngine, getTimelineEngine, createTimelineEngine } from './TimelineEngine';
export { PixiRenderer, getPixiRenderer, createPixiRenderer } from './PixiRenderer';
export * from './VisualObjects';

// Layout utilities
export { default as LayoutManager } from './LayoutManager';
