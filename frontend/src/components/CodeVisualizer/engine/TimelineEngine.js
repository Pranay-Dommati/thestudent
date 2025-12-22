/**
 * TimelineEngine - Master Animation Orchestrator
 * 
 * Enterprise-level animation timeline engine that:
 * - Manages a single master clock for deterministic playback
 * - Queues semantic animation commands
 * - Supports pause/resume/seek/replay
 * - Decouples animation logic from React render cycle
 */

import gsap from 'gsap';

export class TimelineEngine {
    constructor() {
        // Master timeline - single source of truth
        this.masterTimeline = gsap.timeline({
            paused: true,
            onUpdate: () => this._onUpdate(),
            onComplete: () => this._onComplete()
        });

        // State
        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.currentStepIndex = -1;
        this.steps = [];
        this.stepByStepMode = true; // Default to step-by-step mode
        this.stepAnimation = null; // Track current step animation

        // Callbacks
        this.onStepChange = null;
        this.onProgress = null;
        this.onComplete = null;
        this.onStateChange = null;

        // Step markers for seeking
        this.stepMarkers = [];
    }

    /**
     * Initialize timeline with execution steps
     * @param {Array} steps - Execution steps from tracer
     * @param {Object} renderer - PixiJS renderer instance
     */
    initialize(steps, renderer) {
        this.clear();
        this.steps = steps;
        this.renderer = renderer;

        console.log('🎬 TimelineEngine initializing with', steps.length, 'steps');
        console.log('📊 First step data:', steps[0]);

        // Pre-scan all steps to find all arrays and variables we'll need
        this._prescanSteps(steps);

        let timeOffset = 0;

        steps.forEach((step, index) => {
            // Mark step start time
            this.stepMarkers.push({
                index,
                startTime: timeOffset,
                step
            });

            // Generate animation commands for this step
            const commands = this._generateCommands(step, index);
            console.log(`Step ${index} commands:`, commands);

            // Add commands to master timeline
            commands.forEach(cmd => {
                this._addCommand(cmd, timeOffset);
                timeOffset += cmd.duration || 0;
            });

            // Add pause point between steps (optional)
            timeOffset += 0.1; // Small gap between steps
        });

        this.duration = this.masterTimeline.duration();
        this._notifyStateChange();
    }

    /**
     * Normalize tracer step locals.
     * Backend tracer sends: locals[var] = { value, type }
     * We want: { var: value }
     */
    _normalizeLocals(step) {
        const raw = step?.locals || step?.variables || {};
        const normalized = {};

        for (const [name, payload] of Object.entries(raw)) {
            if (payload && typeof payload === 'object' && 'value' in payload) {
                normalized[name] = payload.value;
            } else {
                normalized[name] = payload;
            }
        }
        return normalized;
    }

    _getStepLine(step) {
        return step?.line_no ?? step?.line ?? step?.lineNumber ?? null;
    }

    /**
     * Pre-scan steps to identify all arrays and variables
     */
    _prescanSteps(steps) {
        if (!this.renderer) return;

        const seenArrays = new Set();
        const seenVars = new Set();

        steps.forEach((step, index) => {
            // Try different data structures that steps might have
            const locals = this._normalizeLocals(step);
            const variables = step?.variables ? this._normalizeLocals({ variables: step.variables }) : {};
            const allVars = { ...variables, ...locals };

            // Log all data for debugging
            if (index === 0) {
                console.log('📋 Step 0 full data:', step);
                console.log('📋 Step 0 locals:', locals);
                console.log('📋 Step 0 variables:', variables);
                console.log('📋 Step 0 combined:', allVars);
            }

            // Find and create arrays
            Object.entries(allVars).forEach(([name, value]) => {
                if (Array.isArray(value) && !seenArrays.has(name)) {
                    console.log(`🔍 Found array: ${name} =`, value);
                    this.renderer.getOrCreateArray(name, value);
                    seenArrays.add(name);
                } else if (name !== 'self' && typeof value !== 'function' && !seenVars.has(name)) {
                    // Also pre-create variables we'll encounter
                    // Skip 'self' and functions
                    seenVars.add(name);
                }
            });
        });

        console.log('📊 Pre-scanned arrays:', [...seenArrays]);
        console.log('📊 Pre-scanned vars:', [...seenVars]);
    }

    /**
     * Generate semantic animation commands from a step
     */
    _generateCommands(step, stepIndex) {
        const commands = [];
        const code = step?.code;
        const stepLine = this._getStepLine(step);

        // Parse the step type
        const stepType = this._parseStepType(step);
        console.log(`🔎 Step ${stepIndex}:`, {
            type: stepType.type,
            code: code,
            lineNumber: step?.lineNumber,
            locals: this._normalizeLocals(step),
            parsed: stepType
        });

        switch (stepType.type) {
            case 'array_access':
                // Use cinematic ASSIGN_FROM_ARRAY_INDEX behavior
                commands.push(
                    { type: 'HIGHLIGHT_CODE', line: stepLine, duration: 0.3 },
                    {
                        type: 'PLAY_BEHAVIOR',
                        behaviorId: 'ASSIGN_FROM_ARRAY_INDEX',
                        params: {
                            arrayName: stepType.sourceArray,
                            arrayValues: stepType.arrayValue,
                            index: stepType.index,
                            varName: stepType.targetVar
                        },
                        duration: 3.5 // Cinematic behavior duration
                    },
                    { type: 'COMPLETE_STEP', stepIndex, duration: 0.2 }
                );
                break;

            case 'assignment':
                // Check if this is a variable-to-variable assignment
                if (stepType.sourceVar && stepType.sourceVar !== stepType.targetVar) {
                    // Use cinematic ASSIGN_FROM_VARIABLE behavior
                    commands.push(
                        { type: 'HIGHLIGHT_CODE', line: stepLine, duration: 0.3 },
                        {
                            type: 'PLAY_BEHAVIOR',
                            behaviorId: 'ASSIGN_FROM_VARIABLE',
                            params: {
                                sourceVarName: stepType.sourceVar,
                                sourceValue: stepType.value,
                                targetVarName: stepType.targetVar
                            },
                            duration: 2.5
                        },
                        { type: 'COMPLETE_STEP', stepIndex, duration: 0.2 }
                    );
                } else {
                    // Simple literal assignment - use basic animation
                    commands.push(
                        { type: 'HIGHLIGHT_CODE', line: stepLine, duration: 0.3 },
                        { type: 'CREATE_VARIABLE', name: stepType.targetVar, value: stepType.value, duration: 0.2 },
                        { type: 'SHOW_VALUE_BUBBLE', value: stepType.value, duration: 0.4 },
                        { type: 'ASSIGN_VALUE', target: stepType.targetVar, value: stepType.value, duration: 0.5 },
                        { type: 'COMPLETE_STEP', stepIndex, duration: 0.2 }
                    );
                }
                break;

            case 'for_loop':
                commands.push(
                    { type: 'HIGHLIGHT_CODE', line: stepLine, duration: 0.3 },
                    { type: 'SHOW_LOOP_INDICATOR', iteration: stepType.iteration, duration: 0.3 },
                    // Create/update the loop variable with current value
                    { type: 'CREATE_VARIABLE', name: stepType.loopVar, value: stepType.currentValue, duration: 0.3 },
                    { type: 'UPDATE_VARIABLE', name: stepType.loopVar, value: stepType.currentValue, duration: 0.4 },
                    // Highlight the array element being accessed
                    { type: 'HIGHLIGHT_INDEX', name: stepType.iterableName, index: Math.max(0, stepType.iteration - 1), duration: 0.4 },
                    { type: 'PULSE_LOOP', duration: 0.3 },
                    { type: 'COMPLETE_STEP', stepIndex, duration: 0.2 }
                );
                break;

            case 'condition':
                // Use cinematic IF_ELSE_BRANCH behavior
                commands.push(
                    { type: 'HIGHLIGHT_CODE', line: stepLine, duration: 0.3 },
                    {
                        type: 'PLAY_BEHAVIOR',
                        behaviorId: 'IF_ELSE_BRANCH',
                        params: {
                            leftValue: stepType.left,
                            rightValue: stepType.right,
                            leftVarName: stepType.leftVar,
                            rightVarName: stepType.rightVar,
                            operator: stepType.operator,
                            result: stepType.result
                        },
                        duration: 5.0
                    },
                    { type: 'COMPLETE_STEP', stepIndex, duration: 0.2 }
                );
                break;

            case 'return':
                commands.push(
                    { type: 'HIGHLIGHT_CODE', line: stepLine, duration: 0.3 },
                    {
                        type: 'SHOW_RETURN_VALUE',
                        expression: stepType.expression,
                        value: stepType.value,
                        sourceVar: stepType.sourceVar,
                        duration: 1.8
                    },
                    { type: 'ANIMATE_RETURN', value: stepType.value, duration: 0.6 },
                    { type: 'COMPLETE_STEP', stepIndex, duration: 0.2 }
                );
                break;

            default:
                commands.push(
                    { type: 'HIGHLIGHT_CODE', line: stepLine, duration: 0.3 },
                    { type: 'GENERIC_STEP', step, duration: 0.5 },
                    { type: 'COMPLETE_STEP', stepIndex, duration: 0.2 }
                );
        }

        return commands;
    }

    /**
     * Parse step to determine its type and extract relevant data
     */
    _parseStepType(step) {
        const code = step.code?.trim() || '';
        const locals = this._normalizeLocals(step);
        // Handle both camelCase (from frontend transform) and snake_case (from raw tracer)
        const changedVarNames = Array.isArray(step?.changedVars)
            ? step.changedVars
            : (Array.isArray(step?.changed_vars) ? step.changed_vars : []);

        // Array access: target = array[index]
        const arrayAccessMatch = code.match(/(\w+)\s*=\s*(\w+)\[(\d+|\w+)\]/);
        if (arrayAccessMatch) {
            const [, targetVar, sourceArray, indexStr] = arrayAccessMatch;
            const index = isNaN(indexStr) ? locals[indexStr] : parseInt(indexStr);
            const arrayValue = locals[sourceArray] || [];
            const resultValue = Array.isArray(arrayValue) ? arrayValue[index] : undefined;

            return {
                type: 'array_access',
                targetVar,
                sourceArray,
                index,
                arrayValue: Array.isArray(arrayValue) ? arrayValue : [],
                resultValue
            };
        }

        // For loop: for var in iterable
        const forLoopMatch = code.match(/for\s+(\w+)\s+in\s+(\w+)/);
        if (forLoopMatch) {
            const [, loopVar, iterableName] = forLoopMatch;
            const iterable = locals[iterableName] || [];
            const currentValue = locals[loopVar];
            const iteration = Array.isArray(iterable) ? iterable.indexOf(currentValue) + 1 : 1;

            return {
                type: 'for_loop',
                loopVar,
                iterableName,
                iterable,
                currentValue,
                iteration
            };
        }

        // Condition: if/elif with comparison
        const conditionMatch = code.match(/(?:if|elif)\s+(.+?):/);
        if (conditionMatch) {
            const condition = conditionMatch[1];
            const compMatch = condition.match(/(\w+)\s*(>|<|>=|<=|==|!=)\s*(\w+)/);

            if (compMatch) {
                const [, leftVar, operator, rightVar] = compMatch;
                const left = locals[leftVar] !== undefined ? locals[leftVar] : leftVar;
                const right = locals[rightVar] !== undefined ? locals[rightVar] : rightVar;

                let result = false;
                switch (operator) {
                    case '>': result = left > right; break;
                    case '<': result = left < right; break;
                    case '>=': result = left >= right; break;
                    case '<=': result = left <= right; break;
                    case '==': result = left == right; break;
                    case '!=': result = left != right; break;
                }

                return {
                    type: 'condition',
                    condition,
                    left,
                    leftVar,
                    operator,
                    right,
                    rightVar,
                    result
                };
            }
        }

        // Return statement
        const returnMatch = code.match(/return\s+(.+)/);
        if (returnMatch) {
            const returnExpr = returnMatch[1].trim();
            const isIdentifier = /^[_a-zA-Z]\w*$/.test(returnExpr);
            const sourceVar = (isIdentifier && locals[returnExpr] !== undefined) ? returnExpr : null;
            const value = sourceVar ? locals[sourceVar] : (locals[returnExpr] !== undefined ? locals[returnExpr] : returnExpr);

            return {
                type: 'return',
                expression: returnExpr,
                value,
                sourceVar
            };
        }

        // Simple assignment: var = value
        const assignMatch = code.match(/(\w+)\s*=\s*(.+)/);
        if (assignMatch) {
            const [, targetVar, expression] = assignMatch;
            // Tracer provides locals as the current state; changed_vars is just a list of names.
            // Prefer current locals value (new value), else fall back to expression.
            const value = locals[targetVar] !== undefined ? locals[targetVar] : expression;

            // Detect variable-to-variable assignment: check if expression is a known local variable
            const sourceVar = (expression.trim().match(/^\w+$/) && locals[expression.trim()] !== undefined)
                ? expression.trim()
                : null;

            return {
                type: 'assignment',
                targetVar,
                expression,
                value,
                sourceVar  // Will be null for literal assignments, or the source var name
            };
        }

        return { type: 'generic', code };
    }

    /**
     * Add animation command to the master timeline
     */
    _addCommand(command, startTime) {
        if (!this.renderer) return;

        const tween = this.renderer.createAnimation(command);
        if (tween) {
            this.masterTimeline.add(tween, startTime);
        }
    }

    /**
     * Enable/disable step-by-step mode
     */
    setStepByStepMode(enabled) {
        this.stepByStepMode = enabled;
    }

    /**
     * Play next step only (for step-by-step mode)
     */
    playNextStep() {
        console.log('▶️ playNextStep called, currentStep:', this.currentStepIndex, 'totalSteps:', this.stepMarkers.length);

        // Cancel any existing step animation
        if (this.stepAnimation) {
            this.stepAnimation.kill();
            this.stepAnimation = null;
        }

        const nextIndex = this.currentStepIndex + 1;
        if (nextIndex >= this.stepMarkers.length) {
            // Already at the end
            console.log('⏹️ Already at end, no more steps');
            this.isPlaying = false;
            this._notifyStateChange();
            return;
        }

        const startMarker = this.stepMarkers[nextIndex];
        const endMarker = this.stepMarkers[nextIndex + 1];
        const endTime = endMarker ? endMarker.startTime : this.duration;

        console.log(`📍 Playing step ${nextIndex}: time ${startMarker.startTime} -> ${endTime}`);

        // Jump to step start
        this.masterTimeline.pause();
        this.masterTimeline.seek(startMarker.startTime);
        this.currentStepIndex = nextIndex;
        this.isPlaying = true;

        // Notify step change for code highlighting
        if (this.onStepChange) {
            this.onStepChange(nextIndex, startMarker.step);
        }
        this._notifyStateChange();

        // Animate to step end, then pause
        const stepDuration = endTime - startMarker.startTime;
        const animDuration = stepDuration / this.masterTimeline.timeScale();

        // Safety: ensure duration is positive and reasonable
        if (animDuration <= 0 || !isFinite(animDuration)) {
            console.warn('⚠️ Invalid animation duration, completing step immediately');
            this.masterTimeline.seek(endTime);
            this.currentTime = endTime;
            this.isPlaying = false;
            this._notifyStateChange();
            return;
        }

        this.stepAnimation = gsap.to(this.masterTimeline, {
            time: endTime,
            duration: animDuration,
            ease: 'none',
            onUpdate: () => {
                this.currentTime = this.masterTimeline.time();
                this._notifyStateChange();
            },
            onComplete: () => {
                console.log(`✅ Step ${nextIndex} animation complete`);
                this.isPlaying = false;
                this.stepAnimation = null;
                this._notifyStateChange();
            }
        });
    }

    /**
     * Play previous step (reverse to previous step)
     * Since visuals are destroyed during playback, we restart and replay to target step
     */
    playPreviousStep() {
        if (this.stepAnimation) {
            this.stepAnimation.kill();
            this.stepAnimation = null;
        }

        const targetStepIndex = this.currentStepIndex - 1;

        // If we're at step 0 or before, go to initial state
        if (targetStepIndex < 0) {
            this.restart();
            return;
        }

        console.log(`⏪ Going back to step ${targetStepIndex} from ${this.currentStepIndex}`);

        // Save current state
        const savedSteps = this.steps;
        const savedRenderer = this.renderer;
        const savedCallbacks = {
            onStepChange: this.onStepChange,
            onProgress: this.onProgress,
            onComplete: this.onComplete,
            onStateChange: this.onStateChange
        };

        // Kill current timeline
        this.masterTimeline.pause();
        this.masterTimeline.kill();

        // Create a new master timeline
        this.masterTimeline = gsap.timeline({
            paused: true,
            onUpdate: () => this._onUpdate(),
            onComplete: () => this._onComplete()
        });

        // Reset renderer to clean state
        if (this.renderer) {
            this.renderer.reset();
        }

        // Clear timeline state
        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.currentStepIndex = -1;
        this.steps = [];
        this.stepMarkers = [];

        // Restore callbacks
        this.onStepChange = savedCallbacks.onStepChange;
        this.onProgress = savedCallbacks.onProgress;
        this.onComplete = savedCallbacks.onComplete;
        this.onStateChange = savedCallbacks.onStateChange;

        // Reinitialize with same steps
        if (savedSteps.length > 0 && savedRenderer) {
            this.initialize(savedSteps, savedRenderer);
        }

        // Re-seed initial state
        if (this.renderer && savedSteps.length > 0) {
            this.renderer.seedInitialStateFromSteps?.(savedSteps);
        }

        // Now seek to the END of the target step (so it appears complete)
        if (targetStepIndex >= 0 && targetStepIndex < this.stepMarkers.length) {
            const targetMarker = this.stepMarkers[targetStepIndex];
            const nextMarker = this.stepMarkers[targetStepIndex + 1];
            const endTime = nextMarker ? nextMarker.startTime - 0.05 : targetMarker.startTime + 1;

            // Seek to end of target step
            this.masterTimeline.seek(endTime);
            this.currentStepIndex = targetStepIndex;
            this.currentTime = endTime;

            // Notify step change
            if (this.onStepChange) {
                this.onStepChange(targetStepIndex, targetMarker.step);
            }
        }

        this.isPlaying = false;
        this._notifyStateChange();
    }

    // Playback controls
    play() {
        if (this.stepByStepMode) {
            // In step-by-step mode, play means "play next step"
            this.playNextStep();
            return;
        }
        this.isPlaying = true;
        this.masterTimeline.play();
        this._notifyStateChange();
    }

    pause() {
        this.isPlaying = false;
        this.masterTimeline.pause();
        this._notifyStateChange();
    }

    resume() {
        this.isPlaying = true;
        this.masterTimeline.resume();
        this._notifyStateChange();
    }

    stop() {
        this.isPlaying = false;
        this.masterTimeline.pause();
        this.masterTimeline.seek(0);
        this.currentStepIndex = -1;
        this._notifyStateChange();
    }

    restart() {
        console.log('🔄 TimelineEngine restart called');

        // Kill any pending step animation
        if (this.stepAnimation) {
            this.stepAnimation.kill();
            this.stepAnimation = null;
        }

        // Pause and reset timeline position
        this.masterTimeline.pause();
        this.masterTimeline.seek(0);
        this.currentStepIndex = -1;
        this.currentTime = 0;
        this.isPlaying = false;

        // Notify step change to reset code highlighting
        if (this.onStepChange) {
            this.onStepChange(-1, null);
        }

        // Reset renderer visuals
        if (this.renderer) {
            this.renderer.reset();
        }

        // Clear and rebuild the master timeline with the same steps
        // This is necessary because the old animations reference destroyed objects
        const savedSteps = this.steps;
        const savedRenderer = this.renderer;

        this.clear();

        if (savedSteps.length > 0 && savedRenderer) {
            this.initialize(savedSteps, savedRenderer);
        }

        // Re-seed initial snapshot so inputs are visible before Start
        if (this.renderer && savedSteps.length > 0) {
            this.renderer.seedInitialStateFromSteps?.(savedSteps);
        }

        this._notifyStateChange();
        console.log('✅ TimelineEngine restart complete, ready for playback');
    }

    /**
     * Seek to specific time
     */
    seek(time) {
        this.masterTimeline.seek(time);
        this._updateCurrentStep();
        this._notifyStateChange();
    }

    /**
     * Jump to specific step
     */
    goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.stepMarkers.length) return;

        const marker = this.stepMarkers[stepIndex];
        this.masterTimeline.seek(marker.startTime);
        this.currentStepIndex = stepIndex;
        this._notifyStateChange();
    }

    /**
     * Play specific step only
     */
    playStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.stepMarkers.length) return;

        const startMarker = this.stepMarkers[stepIndex];
        const endMarker = this.stepMarkers[stepIndex + 1];

        this.masterTimeline.seek(startMarker.startTime);
        this.currentStepIndex = stepIndex;

        // Play until next step or end
        const endTime = endMarker ? endMarker.startTime : this.duration;

        // Create a temporary timeline segment
        gsap.to(this.masterTimeline, {
            time: endTime,
            duration: endTime - startMarker.startTime,
            ease: 'none',
            onComplete: () => {
                this.pause();
            }
        });

        this.isPlaying = true;
        this._notifyStateChange();
    }

    /**
     * Clear timeline and reset state
     */
    clear() {
        this.masterTimeline.clear();
        this.masterTimeline.seek(0);
        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.currentStepIndex = -1;
        this.steps = [];
        this.stepMarkers = [];
    }

    /**
     * Get playback speed
     */
    getSpeed() {
        return this.masterTimeline.timeScale();
    }

    /**
     * Set playback speed
     */
    setSpeed(speed) {
        this.masterTimeline.timeScale(speed);
    }

    // Private callbacks
    _onUpdate() {
        this.currentTime = this.masterTimeline.time();
        this._updateCurrentStep();

        if (this.onProgress) {
            this.onProgress(this.currentTime / this.duration);
        }
    }

    _onComplete() {
        this.isPlaying = false;
        if (this.onComplete) {
            this.onComplete();
        }
        this._notifyStateChange();
    }

    _updateCurrentStep() {
        // Find which step we're currently in based on time
        for (let i = this.stepMarkers.length - 1; i >= 0; i--) {
            if (this.currentTime >= this.stepMarkers[i].startTime) {
                if (this.currentStepIndex !== i) {
                    this.currentStepIndex = i;
                    if (this.onStepChange) {
                        this.onStepChange(i, this.stepMarkers[i].step);
                    }
                }
                break;
            }
        }
    }

    _notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange({
                isPlaying: this.isPlaying,
                currentTime: this.currentTime,
                duration: this.duration,
                currentStepIndex: this.currentStepIndex,
                totalSteps: this.steps.length,
                progress: this.duration > 0 ? this.currentTime / this.duration : 0,
                stepByStepMode: this.stepByStepMode
            });
        }
    }

    /**
     * Dispose of the timeline
     */
    dispose() {
        this.masterTimeline.kill();
        this.masterTimeline = null;
        this.renderer = null;
        this.steps = [];
        this.stepMarkers = [];
    }
}

// Singleton instance for global access
let engineInstance = null;

export const getTimelineEngine = () => {
    if (!engineInstance) {
        engineInstance = new TimelineEngine();
    }
    return engineInstance;
};

export const createTimelineEngine = () => {
    return new TimelineEngine();
};
