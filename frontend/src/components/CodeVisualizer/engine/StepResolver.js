/**
 * StepResolver.js - Semantic Step → Transition Sequence Mapper
 * 
 * This is the ONLY place where code semantics are mapped to animations.
 * 
 * ARCHITECTURE:
 * ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 * │  Normalized     │ --> │  StepResolver   │ --> │ TransitionSystem│
 * │  Step (what)    │     │  (mapping)      │     │ (how to animate)│
 * └─────────────────┘     └─────────────────┘     └─────────────────┘
 * 
 * WHEN TO MODIFY THIS FILE:
 * - New Python syntax needs visualization → Add a resolver rule
 * - Existing animation doesn't fit a case → Adjust the sequence here
 * - NEVER modify TransitionSystem for specific cases
 * 
 * WHEN TO MODIFY TransitionSystem:
 * - New fundamental motion needed (rare)
 * - Timing/easing polish (affects everything)
 * 
 * Each resolver returns an array of transition steps that playSequence() executes.
 */

import { TIMING } from './TransitionSystem';

/**
 * Main resolver - maps step type to transition sequence
 * 
 * @param {Object} step - Normalized step with type and meta
 * @param {Object} renderer - PixiRenderer instance
 * @returns {Array} Sequence of transition steps
 */
export function resolveStepToTransitions(step, renderer) {
    const { type, meta } = step;

    // Lookup resolver by type
    const resolver = RESOLVERS[type];
    
    if (resolver) {
        return resolver(meta, renderer, step);
    }

    // Fallback: just emphasize changed variables
    return resolveFallback(meta, renderer, step);
}

/**
 * RESOLVER REGISTRY
 * 
 * Add new resolvers here as needed.
 * Each resolver is a pure function: (meta, renderer, step) => transitionSequence[]
 */
const RESOLVERS = {
    // ============================================
    // ASSIGNMENT RESOLVERS
    // ============================================
    
    /**
     * Variable to Variable: max_val = n
     * Sequence: emphasize source → transfer value → done
     */
    assign: (meta, renderer) => {
        const { targetVar, sourceVar, value } = meta;

        // Variable-to-variable assignment
        if (sourceVar && renderer.getVariable?.(sourceVar)) {
            return [
                { type: 'emphasize', actor: sourceVar },
                { type: 'transfer', from: sourceVar, to: targetVar, value },
            ];
        }

        // Literal assignment (x = 5)
        return [
            { type: 'emphasize', actor: targetVar },
            { type: 'wait', duration: TIMING.fast },
        ];
    },

    // Alias
    assignment: (...args) => RESOLVERS.assign(...args),

    // ============================================
    // ARRAY ACCESS RESOLVERS
    // ============================================
    
    /**
     * Array Index Access: x = arr[i]
     * Sequence: emphasize array cell → transfer to variable
     */
    array_access: (meta, renderer) => {
        const { targetVar, arrayName, index, value } = meta;

        return [
            { type: 'emphasize', actor: arrayName, index },
            { type: 'transfer', from: { array: arrayName, index }, to: targetVar, value },
        ];
    },

    // ============================================
    // LOOP RESOLVERS
    // ============================================
    
    /**
     * For Loop Iteration: for n in nums
     * Sequence: emphasize array cell → transfer to loop var
     */
    for_loop: (meta, renderer) => {
        const { loopVar, iterableName, arrayIndex, currentValue, isLoopEnd } = meta;

        // Loop termination - just emphasize end
        if (isLoopEnd) {
            return [
                { type: 'emphasize', actor: loopVar },
                { type: 'wait', duration: TIMING.normal },
            ];
        }

        // Normal iteration - transfer from array cell to loop variable
        return [
            { type: 'emphasize', actor: iterableName, index: arrayIndex },
            { type: 'transfer', from: { array: iterableName, index: arrayIndex }, to: loopVar, value: currentValue },
        ];
    },

    // ============================================
    // CONDITION RESOLVERS
    // ============================================
    
    /**
     * Condition: if n > max_val
     * Sequence: compare two values → show result
     */
    condition: (meta, renderer) => {
        const { leftVar, rightVar, left, right, operator, result } = meta;

        return [
            { 
                type: 'compare', 
                left: { actor: leftVar, value: left },
                right: { actor: rightVar, value: right },
                operator,
                result 
            },
        ];
    },

    // ============================================
    // RETURN RESOLVERS
    // ============================================
    
    /**
     * Return Statement: return max_val
     * Sequence: emphasize source → transfer to return zone
     */
    return: (meta, renderer) => {
        const { sourceVar, value, expression } = meta;

        if (sourceVar && renderer.getVariable?.(sourceVar)) {
            return [
                { type: 'emphasize', actor: sourceVar },
                { type: 'transfer', from: sourceVar, to: '__return__', value },
            ];
        }

        // Direct value return
        return [
            { type: 'transfer', from: null, to: '__return__', value },
        ];
    },

    // ============================================
    // BINARY OPERATION RESOLVERS
    // ============================================
    
    /**
     * Binary Op: result = a + b
     * Sequence: transform expression → transfer result
     */
    binary_op: (meta, renderer) => {
        const { targetVar, leftVar, rightVar, operator, value } = meta;
        const expression = `${leftVar} ${operator} ${rightVar}`;

        return [
            { type: 'transform', actor: targetVar, fromText: expression, toValue: value },
            { type: 'wait', duration: TIMING.hold },
        ];
    },
};

/**
 * Fallback resolver for unhandled step types
 * Just emphasizes any changed variables
 */
function resolveFallback(meta, renderer, step) {
    const changedVars = step.changedVars || [];
    
    if (changedVars.length === 0) {
        return [{ type: 'wait', duration: TIMING.fast }];
    }

    // Emphasize each changed variable
    return changedVars.map(varName => ({
        type: 'emphasize',
        actor: varName
    }));
}

/**
 * Register a custom resolver at runtime
 * 
 * Usage:
 *   registerResolver('function_call', (meta, renderer) => [...transitions]);
 * 
 * @param {string} stepType - The step type to handle
 * @param {Function} resolver - (meta, renderer, step) => transitionSequence[]
 */
export function registerResolver(stepType, resolver) {
    if (typeof resolver !== 'function') {
        console.error('Resolver must be a function');
        return;
    }
    RESOLVERS[stepType] = resolver;
    console.log(`✅ Registered resolver for: ${stepType}`);
}

/**
 * Check if a resolver exists for a step type
 */
export function hasResolver(stepType) {
    return stepType in RESOLVERS;
}

/**
 * Get list of all registered resolvers (for debugging)
 */
export function getRegisteredResolvers() {
    return Object.keys(RESOLVERS);
}

export default {
    resolveStepToTransitions,
    registerResolver,
    hasResolver,
    getRegisteredResolvers,
};
