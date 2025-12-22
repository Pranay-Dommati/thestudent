/**
 * PrimitiveRegistry - Visual Primitive Mapping
 * 
 * Maps step types to their visual animations.
 * Each primitive knows:
 * - How to animate
 * - What visuals it needs
 * - How long it takes
 * 
 * This is the CORE IP - reusable animation patterns.
 */

import gsap from 'gsap';

/**
 * Base Primitive class
 */
class BasePrimitive {
    /**
     * Animate this step
     * @param {Object} step - The step data
     * @param {Object} renderer - PixiRenderer instance
     * @param {Object} timeline - GSAP timeline
     * @param {Function} onComplete - Callback when animation completes
     */
    static animate(step, renderer, timeline, onComplete) {
        throw new Error('Primitive must implement animate()');
    }

    /**
     * Get total duration for this primitive
     */
    static getDuration() {
        return 1.0;
    }
}

/**
 * Assignment Primitive
 * Handles: x = value, x = expression, x = otherVar
 * 
 * CHOREOGRAPHY MODEL:
 * - If assigning from another variable: GATHER source, TRANSFER, RETURN
 * - If assigning literal: Simple animation
 * 
 * step.meta contains:
 * - targetVar: string
 * - expression: string (source expression)
 * - sourceVar: string | null (if assigning from another variable)
 * - value: the resolved value
 */
export class AssignmentPrimitive extends BasePrimitive {
    static getDuration() {
        return 1.4;
    }

    static animate(step, renderer, timeline, onComplete) {
        const { targetVar, value, expression, sourceVar } = step.meta;
        const lineNumber = step.line;

        console.log('📝 AssignmentPrimitive [CHOREOGRAPHY]:', { targetVar, value, expression, sourceVar, lineNumber });

        const tl = gsap.timeline({
            onComplete: () => onComplete?.()
        });

        // 1. Highlight code line
        tl.call(() => {
            renderer.highlightLine(lineNumber);
        }, null, 0);

        // 2. Ensure target variable exists
        tl.call(() => {
            renderer.getOrCreateVariable(targetVar, '?');
        }, null, 0.15);

        // 3. Use CHOREOGRAPHY for variable-to-variable assignment
        if (sourceVar && renderer.getVariable(sourceVar)) {
            renderer.choreographAssignment(tl, targetVar, sourceVar, value, 0.3);
        } else {
            // Simple literal assignment
            tl.call(() => {
                renderer.showValueBubble(value, targetVar);
            }, null, 0.3);

            tl.call(() => {
                const variable = renderer.getVariable(targetVar);
                variable?.setValue(value);
            }, null, 0.6);

            tl.call(() => {
                renderer.clearValueBubble();
            }, null, 0.9);
        }

        // 4. Update state panel
        tl.call(() => {
            renderer.updateStatePanel(targetVar, value);
        }, null, 1.1);

        timeline.add(tl);
    }
}

/**
 * Array Access Primitive
 * Handles: x = arr[i]
 * 
 * Uses the cinematic ASSIGN_FROM_ARRAY_INDEX animation from BehaviorLibrary
 * This provides a professional, unified animation:
 * 1. Show expression: "max_val = nums[0]"
 * 2. Array name expands INTO array cells in-place
 * 3. Index bracket animates down to point at the correct cell
 * 4. Highlight the target cell with glow effect
 * 5. Other cells fade out smoothly
 * 6. Final result: "max_val = 4"
 * 
 * step.meta contains:
 * - targetVar: string (e.g., "max_val")
 * - arrayName: string (e.g., "nums")
 * - arrayValue: array (e.g., [4, 7])
 * - index: number (e.g., 0)
 * - value: the value at that index (e.g., 4)
 */
export class ArrayAccessPrimitive extends BasePrimitive {
    static getDuration() {
        return 4.5; // Longer duration for the cinematic animation
    }

    static animate(step, renderer, timeline, onComplete) {
        const { targetVar, arrayName, arrayValue, index, value } = step.meta;
        const lineNumber = step.line;

        console.log('📥 ArrayAccessPrimitive [CINEMATIC]:', { targetVar, arrayName, arrayValue, index, value });

        const tl = gsap.timeline({
            onComplete: () => onComplete?.()
        });

        // 1. Highlight code
        tl.call(() => {
            renderer.highlightLine(lineNumber);
        }, null, 0);

        // 2. Play the cinematic ASSIGN_FROM_ARRAY_INDEX animation
        tl.call(() => {
            // Use the cinematic animation from BehaviorLibrary
            renderer.playAssignFromArrayIndex({
                arrayName,
                arrayValues: arrayValue,
                index,
                varName: targetVar,
                oldValue: null
            }, () => {
                // Animation cleanup happens inside the behavior
                console.log('✅ Cinematic array access animation complete');
            });
        }, null, 0.15);

        // 3. Wait for the cinematic animation to complete
        // The animation takes about 4 seconds in total
        tl.to({}, { duration: 4.0 }, 0.2);

        // 4. Update state panel (variable is already updated by the animation)
        tl.call(() => {
            renderer.updateStatePanel(targetVar, value);
        }, null, 4.2);

        timeline.add(tl);
    }
}

/**
 * For Loop Primitive
 * Handles: for x in iterable
 * 
 * ARCHITECTURE: This is a PURE FUNCTION
 * - ALL data comes from step.meta (pre-computed by StepNormalizer)
 * - We NEVER derive state during animation
 * - We NEVER read from renderer's previous state
 * 
 * step.meta contains:
 * - loopVar: string (e.g., "n")
 * - iterableName: string (e.g., "nums")
 * - iterableValue: array (e.g., [44, 2])
 * - currentValue: number (e.g., 44) - THE CORRECT VALUE
 * - iteration: number (1, 2, 3...) - PRE-CALCULATED
 * - arrayIndex: number (0, 1, 2...) - PRE-CALCULATED
 */
export class ForLoopPrimitive extends BasePrimitive {
    static getDuration() {
        return 4.8; // Longer for cinematic animation (actual duration comes from choreography)
    }

    static animate(step, renderer, timeline, onComplete) {
        // ALL data from step.meta - no derivation!
        const {
            loopVar,
            iterableName,
            currentValue,
            iteration,
            arrayIndex,
            iterableValue,
            isLoopEnd
        } = step.meta;

        const lineNumber = step.line;

        console.log('🔄 ForLoopPrimitive [CINEMATIC]:', {
            loopVar,
            currentValue,
            iteration,
            arrayIndex,
            lineNumber
        });

        const tl = gsap.timeline({
            onComplete: () => onComplete?.()
        });

        // 1. Highlight code line
        tl.call(() => {
            renderer.highlightLine(lineNumber);
        }, null, 0);

        // 2. Play the cinematic FOR loop animation and SEQUENCE based on its real duration
        // This avoids hard-coded waits and lets us tune speed to match ASSIGN_FROM_ARRAY_INDEX.
        const prevIndexKey = `perf_last_idx_${loopVar}`;
        const previousIndex = renderer[prevIndexKey] !== undefined ? renderer[prevIndexKey] : null;

        const choreoTl = isLoopEnd
            ? renderer.playForLoopEnd({
                loopVar,
                arrayName: iterableName,
                arrayValues: iterableValue,
                previousIndex
            }, () => {
                delete renderer[prevIndexKey];
                console.log('✅ Cinematic loop end complete');
            })
            : renderer.playForLoopIteration({
                loopVar,
                arrayName: iterableName,
                arrayValues: iterableValue,
                currentIndex: arrayIndex,
                previousIndex,
                iteration,
                currentValue
            }, () => {
                renderer[prevIndexKey] = arrayIndex;
                console.log('✅ Cinematic loop step complete');
            });

        const startAt = 0.15;
        if (choreoTl) {
            tl.add(choreoTl, startAt);
        }

        const choreoDuration = choreoTl?.duration?.() ?? 4.0;
        const afterChoreo = startAt + choreoDuration + 0.05;

        // 3. Update state panel right after choreography (skip on loop-end cleanup step)
        if (!isLoopEnd) {
            tl.call(() => {
                renderer.updateStatePanel(loopVar, currentValue);
            }, null, afterChoreo);
        }

        timeline.add(tl);
    }
}

/**
 * Condition Primitive
 * Handles: if x > y, while x < n
 * 
 * CHOREOGRAPHY MODEL:
 * 1. GATHER: Move existing variable visuals to interaction zone
 * 2. INTERACT: Show comparison with operator
 * 3. RESOLVE: Show result, return variables home
 * 
 * step.meta contains:
 * - left: actual value (e.g., 44)
 * - right: actual value (e.g., 44)
 * - leftVar: variable name for left operand
 * - rightVar: variable name for right operand
 * - operator: string (e.g., ">")
 * - result: boolean (pre-evaluated!)
 */
export class ConditionPrimitive extends BasePrimitive {
    static getDuration() {
        return 5.5;  // Cinematic duration
    }

    static animate(step, renderer, timeline, onComplete) {
        const { left, operator, right, result, leftVar, rightVar, expression } = step.meta;
        const lineNumber = step.line;

        console.log('🔀 ConditionPrimitive [CINEMATIC]:', {
            leftVar, rightVar, left, operator, right, result, lineNumber
        });

        const tl = gsap.timeline({
            onComplete: () => onComplete?.()
        });

        // 1. Highlight code
        tl.call(() => {
            renderer.highlightLine(lineNumber);
        }, null, 0);

        // 2. Play the cinematic IF_ELSE_BRANCH animation
        tl.call(() => {
            // Use the cinematic animation from BehaviorLibrary via PixiRenderer
            renderer.playCinematicComparison({
                left,
                right,
                leftVar,
                rightVar,
                operator,
                result
            }, () => {
                console.log('✅ Cinematic comparison animation complete');
            });
        }, null, 0.15);

        // 3. Wait for the cinematic animation to complete
        // The behavior duration is set to 5.0s in BehaviorLibrary
        tl.to({}, { duration: 5.0 }, 0.2);

        timeline.add(tl);
    }
}

/**
 * Return Primitive
 * Handles: return value
 * 
 * ARCHITECTURE: PURE FUNCTION
 * step.meta contains:
 * - value: the return value
 * - expression: original expression
 */
export class ReturnPrimitive extends BasePrimitive {
    static getDuration() {
        return 1.2;
    }

    static animate(step, renderer, timeline, onComplete) {
        const { value, expression } = step.meta;
        const lineNumber = step.line;

        console.log('🔙 ReturnPrimitive [PURE]:', { value, expression, lineNumber, meta: step.meta });

        const tl = gsap.timeline({
            onComplete: () => onComplete?.()
        });

        // 1. Highlight code
        tl.call(() => {
            renderer.highlightLine(lineNumber);
        }, null, 0);

        // 2. Show return value
        tl.call(() => {
            renderer.showReturnValue(value);
        }, null, 0.3);

        // 3. Animate return
        tl.call(() => {
            renderer.animateReturn(value);
        }, null, 0.7);

        timeline.add(tl);
    }
}

/**
 * Generic Step Primitive
 * Fallback for unrecognized step types
 */
export class GenericPrimitive extends BasePrimitive {
    static getDuration() {
        return 0.8;
    }

    static animate(step, renderer, timeline, onComplete) {
        const lineNumber = step.line;

        const tl = gsap.timeline({
            onComplete: () => onComplete?.()
        });

        // Just highlight the line
        tl.call(() => {
            renderer.highlightLine(lineNumber);
        }, null, 0);

        // Update any changed variables from normalized step data
        tl.call(() => {
            const changedVars = step.changedVars || [];
            const variables = step.variables || {};

            changedVars.forEach(varName => {
                const value = variables[varName];
                if (value !== undefined) {
                    renderer.getOrCreateVariable(varName, value);
                    renderer.animateAssignment(varName, value);
                    renderer.updateStatePanel(varName, value);
                }
            });
        }, null, 0.3);

        timeline.add(tl);
    }
}

/**
 * Primitive Registry
 * Maps step types to their animation primitives
 */
export const PrimitiveRegistry = {
    'assign': AssignmentPrimitive,
    'assignment': AssignmentPrimitive,
    'array_access': ArrayAccessPrimitive,
    'for_loop': ForLoopPrimitive,
    'loop': ForLoopPrimitive,
    'condition': ConditionPrimitive,
    'if': ConditionPrimitive,
    'return': ReturnPrimitive,
    'generic': GenericPrimitive,
    'default': GenericPrimitive
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
export function getPrimitiveDuration(stepType) {
    const primitive = getPrimitive(stepType);
    return primitive.getDuration();
}
