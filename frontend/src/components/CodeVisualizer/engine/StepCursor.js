/**
 * StepCursor - Step Index Controller
 * 
 * Single source of truth for current step position.
 * No other component should track step index.
 */

export class StepCursor {
    constructor() {
        this.current = -1;
        this.steps = [];
        this.onStepChange = null;
    }

    /**
     * Load steps into cursor
     */
    load(steps) {
        this.steps = steps || [];
        this.current = -1;
    }

    /**
     * Get current step
     */
    getCurrentStep() {
        if (this.current < 0 || this.current >= this.steps.length) {
            return null;
        }
        return this.steps[this.current];
    }

    /**
     * Get current index
     */
    getCurrentIndex() {
        return this.current;
    }

    /**
     * Move to next step
     * @returns {Object|null} The next step or null if at end
     */
    next() {
        if (this.current < this.steps.length - 1) {
            this.current++;
            const step = this.steps[this.current];
            this._notify();
            return step;
        }
        return null;
    }

    /**
     * Move to previous step
     * @returns {Object|null} The previous step or null if at start
     */
    previous() {
        if (this.current > 0) {
            this.current--;
            const step = this.steps[this.current];
            this._notify();
            return step;
        }
        return null;
    }

    /**
     * Go to specific step
     */
    goTo(index) {
        if (index >= -1 && index < this.steps.length) {
            this.current = index;
            this._notify();
            return this.getCurrentStep();
        }
        return null;
    }

    /**
     * Reset to beginning (before first step)
     */
    reset() {
        this.current = -1;
        this._notify();
    }

    /**
     * Check if at the beginning
     */
    isAtStart() {
        return this.current <= 0;
    }

    /**
     * Check if at the end (completed all steps)
     */
    isAtEnd() {
        // Not at end if no steps loaded or haven't started
        if (this.steps.length === 0) return false;
        if (this.current < 0) return false;
        return this.current >= this.steps.length - 1;
    }

    /**
     * Check if has more steps
     */
    hasNext() {
        if (this.steps.length === 0) return false;
        return this.current < this.steps.length - 1;
    }

    /**
     * Check if has previous steps
     */
    hasPrevious() {
        return this.current > 0;
    }

    /**
     * Get total step count
     */
    getTotalSteps() {
        return this.steps.length;
    }

    _notify() {
        if (this.onStepChange) {
            this.onStepChange(this.current, this.getCurrentStep());
        }
    }
}

export function createStepCursor() {
    return new StepCursor();
}
