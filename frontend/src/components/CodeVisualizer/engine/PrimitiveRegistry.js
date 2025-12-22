/**
 * PrimitiveRegistry - Visual Primitive Mapping
 * 
 * ARCHITECTURE:
 * Step → StepResolver (what transitions) → TransitionSystem (how to animate)
 * 
 * This file is a THIN ORCHESTRATION LAYER.
 * - It highlights code
 * - Calls the resolver to get transitions
 * - Plays them via TransitionSystem
 * - Updates state panel
 * 
 * TO ADD NEW ANIMATIONS:
 * Add resolvers in StepResolver.js - NOT here.
 */

import gsap from 'gsap';
import { playSequence, TIMING } from './TransitionSystem';
import { resolveStepToTransitions } from './StepResolver';

/**
 * Universal Primitive - Handles ALL step types via TransitionSystem
 */
export class UniversalPrimitive {
    static getDuration(step) {
        const transitions = resolveStepToTransitions(step, null) || [];
        const transitionCount = transitions.length;
        return Math.max(1.2, transitionCount * 0.9);
    }

    static animate(step, renderer, timeline, onComplete) {
        const lineNumber = step.line;
        const { type, meta } = step;

        console.log(`🎬 UniversalPrimitive [${type}]:`, meta);

        const tl = gsap.timeline({
            onComplete: () => onComplete?.()
        });

        // 1. Highlight code line
        tl.call(() => {
            renderer.highlightLine(lineNumber);
        }, null, 0);

        // 2. Ensure actors exist SYNCHRONOUSLY before building animation
        // This MUST happen before playSequence so positions can be calculated
        ensureActorsExist(step, renderer);

        // 3. Resolve step to transitions and play them
        const transitions = resolveStepToTransitions(step, renderer);
        
        if (transitions && transitions.length > 0) {
            const duration = playSequence(tl, renderer, transitions, 0.15);
            
            // 4. Update state panel after transitions complete
            tl.call(() => {
                updateStatePanelFromStep(step, renderer);
            }, null, duration + 0.1);
        } else {
            // Fallback: just update state
            tl.call(() => {
                updateStatePanelFromStep(step, renderer);
            }, null, 0.5);
        }

        timeline.add(tl);
    }
}

/**
 * Ensure all actors referenced in step exist in renderer
 */
function ensureActorsExist(step, renderer) {
    const { meta, variables } = step;
    
    console.log('🎯 ensureActorsExist:', { type: step.type, meta });
    
    if (meta?.targetVar) {
        renderer.getOrCreateVariable(meta.targetVar, meta.value ?? '?');
    }
    
    if (meta?.sourceVar) {
        renderer.getOrCreateVariable(meta.sourceVar, variables?.[meta.sourceVar] ?? '?');
    }
    
    if (meta?.loopVar) {
        renderer.getOrCreateVariable(meta.loopVar, meta.currentValue ?? '?');
    }
    
    // Ensure array exists for array access and for loops
    if (meta?.arrayName && meta?.arrayValue && Array.isArray(meta.arrayValue)) {
        console.log('📦 Creating array:', meta.arrayName, meta.arrayValue);
        renderer.getOrCreateArray?.(meta.arrayName, meta.arrayValue);
    }
    if (meta?.iterableName && meta?.iterableValue && Array.isArray(meta.iterableValue)) {
        console.log('📦 Creating iterable array:', meta.iterableName, meta.iterableValue);
        renderer.getOrCreateArray?.(meta.iterableName, meta.iterableValue);
    }
    
    if (meta?.leftVar && typeof meta.leftVar === 'string') {
        renderer.getOrCreateVariable(meta.leftVar, meta.left ?? '?');
    }
    if (meta?.rightVar && typeof meta.rightVar === 'string') {
        renderer.getOrCreateVariable(meta.rightVar, meta.right ?? '?');
    }
}

/**
 * Update state panel from step data
 */
function updateStatePanelFromStep(step, renderer) {
    const { meta, changedVars = [], variables = {} } = step;
    
    if (meta?.targetVar && meta?.value !== undefined) {
        renderer.updateStatePanel?.(meta.targetVar, meta.value);
    }
    
    if (meta?.loopVar && meta?.currentValue !== undefined) {
        renderer.updateStatePanel?.(meta.loopVar, meta.currentValue);
    }
    
    changedVars.forEach(varName => {
        const value = variables[varName];
        if (value !== undefined) {
            renderer.updateStatePanel?.(varName, value);
        }
    });
}

/**
 * Primitive Registry - All types route through UniversalPrimitive
 */
export const PrimitiveRegistry = {
    'assign': UniversalPrimitive,
    'assignment': UniversalPrimitive,
    'array_access': UniversalPrimitive,
    'for_loop': UniversalPrimitive,
    'loop': UniversalPrimitive,
    'condition': UniversalPrimitive,
    'if': UniversalPrimitive,
    'return': UniversalPrimitive,
    'binary_op': UniversalPrimitive,
    'generic': UniversalPrimitive,
    'default': UniversalPrimitive
};

/**
 * Get primitive for a step type
 */
export function getPrimitive(stepType) {
    return PrimitiveRegistry[stepType] || PrimitiveRegistry['default'];
}

/**
 * Get duration for a step type
 */
export function getPrimitiveDuration(stepType, step = null) {
    const primitive = getPrimitive(stepType);
    
    if (primitive === UniversalPrimitive && step) {
        return UniversalPrimitive.getDuration(step);
    }
    
    return primitive.getDuration?.() || 1.0;
}
