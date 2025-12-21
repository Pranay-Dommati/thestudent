/**
 * Visual Execution Engine - Entry Point
 * ======================================
 * 
 * CORRECT ARCHITECTURE:
 * 1. Execution Layer (Backend) - Python tracing
 * 2. StepNormalizer - Pre-processes ALL steps into self-contained packets
 * 3. Visual Engine - Orchestrates animations
 * 4. Primitives - PURE FUNCTIONS of step data
 * 5. UI Shell (React) - Dumb display layer
 * 
 * KEY PRINCIPLE:
 * - Steps are normalized ONCE at initialization
 * - Primitives receive COMPLETE data, never derive during animation
 * - Animation = f(stepData) - nothing else
 */

// Core Engine (Correct Architecture)
export { VisualEngine, createVisualEngine } from './VisualEngine';
export { StepCursor, createStepCursor } from './StepCursor';
export { normalizeSteps, extractArraysFromSteps } from './StepNormalizer';
export * from './PrimitiveRegistry';

// Legacy (still available for compatibility)
export { parseStepType, classifyStep } from './StepParser';
export { TimelineEngine, getTimelineEngine, createTimelineEngine } from './TimelineEngine';

// Rendering
export { PixiRenderer, getPixiRenderer, createPixiRenderer } from './PixiRenderer';
export * from './VisualObjects';

// Layout utilities
export { default as LayoutManager } from './LayoutManager';
