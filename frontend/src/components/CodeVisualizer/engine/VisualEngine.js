/**
 * VisualEngine - Master Orchestrator
 * ===================================
 * 
 * ARCHITECTURE (Critical to understand):
 * 
 * 1. Steps are NORMALIZED once at initialization
 * 2. Each normalized step contains ALL data needed for its animation
 * 3. Primitives are PURE FUNCTIONS of step data
 * 4. Primitives NEVER read from renderer state
 * 5. Animation = f(stepData) - nothing else
 * 
 * This fixes bugs like "second iteration shows first value"
 * because we're not deriving state during animation.
 */

import gsap from 'gsap';
import { createStepCursor } from './StepCursor';
import { getPrimitive } from './PrimitiveRegistry';
import { normalizeSteps, extractArraysFromSteps } from './StepNormalizer';

export class VisualEngine {
    constructor() {
        // Core components
        this.cursor = createStepCursor();
        this.renderer = null;
        this.timeline = null;
        
        // NORMALIZED steps - single source of truth
        this.normalizedSteps = [];
        
        // State
        this.isPlaying = false;
        this.isAnimating = false;
        this.speed = 1;
        
        // Event callbacks (for React shell)
        this.onStateChange = null;
        this.onStepStart = null;
        this.onStepComplete = null;
        this.onComplete = null;
        this.onError = null;
        
        // Bind cursor callback
        this.cursor.onStepChange = (index, step) => {
            this._emitStateChange();
        };
    }

    /**
     * Initialize engine with steps and renderer
     * 
     * CRITICAL: Steps are normalized ONCE here.
     * All animation data is pre-computed.
     */
    initialize(rawSteps, renderer) {
        // CRITICAL: Full reset on new initialization
        this.destroy();
        
        this.renderer = renderer;
        
        // NORMALIZE STEPS - This is the key!
        // After this, each step has ALL data needed for animation
        this.normalizedSteps = normalizeSteps(rawSteps);
        
        console.log('📊 Normalized steps:', this.normalizedSteps.map(s => ({
            line: s.line,
            type: s.type,
            meta: s.meta
        })));
        
        // Load normalized steps into cursor
        this.cursor.load(this.normalizedSteps);
        
        // Pre-create arrays from normalized data
        const arrays = extractArraysFromSteps(this.normalizedSteps);
        arrays.forEach((values, name) => {
            this.renderer?.getOrCreateArray(name, values);
        });
        
        // Seed initial state
        if (this.normalizedSteps.length > 0) {
            this.renderer?.seedInitialState(this.normalizedSteps[0]);
        }
        
        this._emitStateChange();
        console.log('🎬 VisualEngine initialized with', this.normalizedSteps.length, 'normalized steps');
    }

    /**
     * Play the next step
     * This is the main step-by-step execution method
     */
    playNextStep() {
        if (this.isAnimating) {
            console.log('⏳ Animation in progress, skipping');
            return;
        }
        
        const step = this.cursor.next();
        if (!step) {
            console.log('✅ All steps completed');
            this.onComplete?.();
            this._emitStateChange();
            return;
        }
        
        this._animateStep(step);
    }

    /**
     * Play previous step (rewind)
     */
    playPreviousStep() {
        if (this.isAnimating) return;
        
        const step = this.cursor.previous();
        if (!step) return;
        
        // For previous step, we rebuild state up to this point
        this._rebuildToStep(this.cursor.getCurrentIndex());
    }

    /**
     * Go to specific step
     */
    goToStep(index) {
        if (this.isAnimating) return;
        
        this.cursor.goTo(index);
        this._rebuildToStep(index);
    }

    /**
     * Start continuous playback (auto-advance)
     */
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this._emitStateChange();
        this._autoAdvance();
    }

    /**
     * Pause playback
     */
    pause() {
        this.isPlaying = false;
        this._emitStateChange();
    }

    /**
     * Restart from beginning
     */
    restart() {
        // CRITICAL: Kill any running animation
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
        
        this.isPlaying = false;
        this.isAnimating = false;
        
        // Reset cursor
        this.cursor.reset();
        
        // Reset renderer visuals
        this.renderer?.reset();
        
        // Re-create arrays from normalized data
        const arrays = extractArraysFromSteps(this.normalizedSteps);
        arrays.forEach((values, name) => {
            this.renderer?.getOrCreateArray(name, values);
        });
        
        // Re-seed initial state
        if (this.normalizedSteps.length > 0) {
            this.renderer?.seedInitialState(this.normalizedSteps[0]);
        }
        
        this._emitStateChange();
        console.log('🔄 VisualEngine restarted');
    }

    /**
     * Set playback speed
     */
    setSpeed(speed) {
        this.speed = speed;
        if (this.timeline) {
            this.timeline.timeScale(speed);
        }
    }

    /**
     * Destroy engine and release resources
     */
    destroy() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
        
        this.isPlaying = false;
        this.isAnimating = false;
        this.cursor.reset();
    }

    /**
     * Animate a single step
     * 
     * CRITICAL: Step is already normalized!
     * - step.type is already computed
     * - step.meta has ALL data needed
     * - We do NOT parse or derive anything here
     */
    _animateStep(step) {
        this.isAnimating = true;
        this._emitStateChange();
        
        // Emit step start event
        this.onStepStart?.(step.index, step);
        
        console.log('🎬 VisualEngine._animateStep:', {
            index: step.index,
            type: step.type,
            meta: step.meta,
            line: step.line
        });
        
        // Get the appropriate primitive based on pre-computed type
        const Primitive = getPrimitive(step.type);
        
        // Create a new timeline for this step
        this.timeline = gsap.timeline({
            onComplete: () => this._onStepAnimationComplete(step)
        });
        this.timeline.timeScale(this.speed);
        
        // Step already has lineNumber and meta from normalization
        // Primitive receives COMPLETE data - no derivation needed
        Primitive.animate(step, this.renderer, this.timeline, () => {
            // Individual animation complete callback
        });
    }

    /**
     * Called when step animation completes
     */
    _onStepAnimationComplete(step) {
        this.isAnimating = false;
        this.timeline = null;
        
        // Emit step complete
        this.onStepComplete?.(this.cursor.getCurrentIndex(), step);
        
        this._emitStateChange();
        
        // Continue auto-advance if playing
        if (this.isPlaying && this.cursor.hasNext()) {
            setTimeout(() => this._autoAdvance(), 100);
        } else if (this.isPlaying && !this.cursor.hasNext()) {
            this.isPlaying = false;
            this.onComplete?.();
            this._emitStateChange();
        }
    }

    /**
     * Auto-advance to next step (continuous play mode)
     */
    _autoAdvance() {
        if (!this.isPlaying) return;
        this.playNextStep();
    }

    /**
     * Rebuild visual state up to a specific step
     * Used for seeking/rewinding
     */
    _rebuildToStep(targetIndex) {
        // Reset renderer
        this.renderer?.reset();
        
        // Re-prescan to create arrays
        this._prescanSteps(this.cursor.steps);
        
        // Apply all steps up to target without animation
        for (let i = 0; i <= targetIndex; i++) {
            const step = this.cursor.steps[i];
            if (step) {
                this._applyStepInstantly(step);
            }
        }
        
        this._emitStateChange();
    }

    /**
     * Apply a step's changes instantly (no animation)
     * Used for rebuilding state
     */
    _applyStepInstantly(step) {
        const vars = this._normalizeVariables(step);
        const changedVars = step.changedVars || step.changed_vars || [];
        
        // Update all changed variables
        changedVars.forEach(varName => {
            if (vars[varName] !== undefined) {
                this.renderer?.updateVariableInstantly(varName, vars[varName]);
            }
        });
        
        // Highlight current line
        const line = step.line || step.lineNumber || step.line_no;
        this.renderer?.highlightLine(line);
    }

    /**
     * Emit state change to listeners
     */
    _emitStateChange() {
        if (this.onStateChange) {
            this.onStateChange({
                currentStep: this.cursor.getCurrentIndex(),
                totalSteps: this.cursor.getTotalSteps(),
                isPlaying: this.isPlaying,
                isAnimating: this.isAnimating,
                hasNext: this.cursor.hasNext(),
                hasPrevious: this.cursor.hasPrevious(),
                isAtStart: this.cursor.isAtStart(),
                isAtEnd: this.cursor.isAtEnd(),
                speed: this.speed
            });
        }
    }

    // Getters for React shell
    getCurrentStep() {
        return this.cursor.getCurrentStep();
    }

    getCurrentIndex() {
        return this.cursor.getCurrentIndex();
    }

    getTotalSteps() {
        return this.cursor.getTotalSteps();
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    getIsAnimating() {
        return this.isAnimating;
    }
}

/**
 * Factory function
 */
export function createVisualEngine() {
    return new VisualEngine();
}
