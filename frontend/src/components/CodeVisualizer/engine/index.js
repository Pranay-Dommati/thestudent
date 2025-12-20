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

// NEW: Enterprise Animation Engine
export { TimelineEngine, getTimelineEngine, createTimelineEngine } from './TimelineEngine';
export { PixiRenderer, getPixiRenderer, createPixiRenderer } from './PixiRenderer';
export * from './VisualObjects';

// Legacy exports (still available for compatibility)
export { default as cinematicDirector } from './CinematicDirector';
export { default as renderingEngine } from './RenderingEngine';
export { default as LayoutManager } from './LayoutManager';
export { default as sceneProcessor } from './SceneProcessor';
export { default as SceneType, SceneCommands } from './SceneTypes';
