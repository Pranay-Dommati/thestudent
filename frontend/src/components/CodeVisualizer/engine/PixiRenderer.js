/**
 * PixiRenderer - WebGL Canvas Renderer
 * 
 * This class manages the PixiJS application and handles
 * all visual object creation and animation command execution.
 * 
 * React does NOT control this - it's a standalone rendering engine.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import {
    ArrayVisual,
    VariableVisual,
    ValueBubble,
    ComparisonVisual,
    LoopIndicator,
    ReturnVisual,
    CodeHighlight
} from './VisualObjects';

// Register GSAP PixiJS plugin
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export class PixiRenderer {
    constructor() {
        this.app = null;
        this.stage = null;
        this.width = 800;
        this.height = 500;
        this.isInitialized = false;
        this.isDestroyed = false;
        
        // Persistent visual objects registry
        this.objects = {
            arrays: new Map(),      // name -> ArrayVisual
            variables: new Map(),   // name -> VariableVisual
            bubbles: [],            // ValueBubble instances
            comparison: null,       // ComparisonVisual
            loopIndicator: null,    // LoopIndicator
            returnVisual: null,     // ReturnVisual
            codeHighlight: null     // CodeHighlight
        };
        
        // Layout positions (computed responsively; these are fallbacks)
        this.layout = {
            arrays: { x: 40, y: 80, rowSpacing: 130 },
            variables: { x: 40, y: 200, spacing: 78 },
            comparison: { x: 400, y: 100 },
            loopIndicator: { x: 400, y: 60 },
            return: { x: 300, y: 350 }
        };
        
        this.variableCount = 0;
        this.layers = null;
    }

    _computeLayout() {
        const padX = 64;
        const padY = 56;

        // Center-top loop indicator
        this.layout.loopIndicator.x = Math.round(this.width / 2);
        this.layout.loopIndicator.y = 56;

        // Secondary visuals (avoid edges)
        this.layout.comparison.x = Math.round(this.width * 0.60);
        this.layout.comparison.y = Math.round(this.height * 0.20);
        this.layout.return.x = Math.round(this.width * 0.54);
        this.layout.return.y = Math.round(this.height * 0.72);

        // Fallback anchors; arrays/vars are centered via _layoutAll()
        this.layout.arrays.x = padX;
        this.layout.arrays.y = padY + 30;
        this.layout.variables.x = padX;
        this.layout.variables.y = padY + 220;
    }

    _layoutAll() {
        if (!this.isInitialized || this.isDestroyed) return;

        const arrays = Array.from(this.objects.arrays.values());
        const vars = Array.from(this.objects.variables.values());

        const maxArrayWidth = arrays.reduce((m, a) => Math.max(m, a?.getVisualWidth?.() || 0), 0);
        const arraysHeight = arrays.length ? arrays.length * this.layout.arrays.rowSpacing : 0;

        const maxVarWidth = vars.reduce((m, v) => Math.max(m, v?.getVisualWidth?.() || 0), 0);
        const varsHeight = vars.length
            ? ((vars.length - 1) * this.layout.variables.spacing + (vars[0]?.getVisualHeight?.() || 54))
            : 0;

        const gapBetween = arrays.length && vars.length ? 90 : 0;
        const groupWidth = Math.max(maxArrayWidth, maxVarWidth, 460);
        const groupHeight = Math.max(arraysHeight + gapBetween + varsHeight, 280);

        const originX = Math.max(48, Math.round((this.width - groupWidth) / 2));
        const originY = Math.max(48, Math.round((this.height - groupHeight) / 2));

        arrays.forEach((arr, idx) => {
            const y = originY + idx * this.layout.arrays.rowSpacing;
            arr.setPosition(originX, y);
        });

        const varsBaseY = originY + (arrays.length ? arraysHeight + gapBetween : 0);
        vars.forEach((v, idx) => {
            const y = varsBaseY + idx * this.layout.variables.spacing;
            v.setPosition(originX, y);
        });

        this.objects.comparison?.setPosition(this.layout.comparison.x, this.layout.comparison.y);
        this.objects.loopIndicator?.setPosition(this.layout.loopIndicator.x, this.layout.loopIndicator.y);
        this.objects.returnVisual?.setPosition(this.layout.return.x, this.layout.return.y);
    }

    _unwrapTracerValue(payload) {
        // Backend tracer format: { value, type }
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'value' in payload) {
            return payload.value;
        }
        return payload;
    }

    _normalizeVars(step) {
        const raw = step?.variables || step?.locals || {};
        const out = {};
        for (const [k, v] of Object.entries(raw)) {
            out[k] = this._unwrapTracerValue(v);
        }
        return out;
    }

    /**
     * Seed a pre-run snapshot (inputs) so the canvas isn't empty before Start.
     * Picks the earliest step that contains any variables.
     */
    seedInitialStateFromSteps(steps = []) {
        if (!this.isInitialized || this.isDestroyed) return;
        if (!Array.isArray(steps) || steps.length === 0) return;

        const firstWithVars = steps.find(s => {
            const vars = s?.variables || s?.locals;
            return vars && Object.keys(vars).length > 0;
        }) || steps[0];

        this.seedInitialState(firstWithVars);
    }

    /**
     * Seed initial visuals from a single step.
     * Only shows ARRAYS (function inputs like nums).
     * Scalar variables will appear when they are assigned during animation.
     */
    seedInitialState(step) {
        if (!this.isInitialized || this.isDestroyed) return;

        // Ensure persistent objects are hidden at rest
        this.objects.comparison?.hide();
        this.objects.loopIndicator?.hide();
        this.objects.returnVisual?.hide();
        
        // Hide ALL existing scalar variables (they should only appear during animation)
        this.objects.variables.forEach(v => {
            v.hide();
            v.container.alpha = 0;
        });

        const vars = this._normalizeVars(step);

        // Show arrays ONLY (inputs like nums) - these are the function parameters
        for (const [name, value] of Object.entries(vars)) {
            if (Array.isArray(value)) {
                const arrayVisual = this.getOrCreateArray(name, value);
                arrayVisual.show();
                arrayVisual.container.visible = true;
                arrayVisual.container.alpha = 1;
                arrayVisual.container.scale.set(1);
            }
        }

        // DO NOT show scalar variables in initial state - they appear during animation

        this._layoutAll();
    }

    /**
     * Initialize the PixiJS application
     */
    async initialize(container, width = 800, height = 500) {
        if (this.isDestroyed) return this;
        
        this.width = width || 800;
        this.height = height || 500;

        try {
            // Create PixiJS Application
            this.app = new PIXI.Application();
            await this.app.init({
                width: this.width,
                height: this.height,
                backgroundColor: 0x0f172a, // Slate 900
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            if (this.isDestroyed) {
                this.app?.destroy(true);
                return this;
            }

            // Add canvas to container
            if (container && this.app.canvas) {
                container.appendChild(this.app.canvas);
            }
            
            this.stage = this.app.stage;
            
            if (!this.stage) {
                throw new Error('Stage not available after init');
            }
            
            // Create layer containers for z-ordering
            this.layers = {
                background: new PIXI.Container(),
                code: new PIXI.Container(),
                arrays: new PIXI.Container(),
                variables: new PIXI.Container(),
                effects: new PIXI.Container(),
                ui: new PIXI.Container()
            };
            
            Object.values(this.layers).forEach(layer => {
                if (this.stage && layer) {
                    this.stage.addChild(layer);
                }
            });

            this._computeLayout();

            // Create persistent objects
            this._createPersistentObjects();
            
            this.isInitialized = true;
            this._layoutAll();
            return this;
        } catch (err) {
            console.error('PixiRenderer initialization failed:', err);
            try {
                // Prevent Pixi ticker from rendering a half-initialized stage
                this.app?.destroy(true, { children: true, texture: true });
            } catch (e) {
                console.warn('Error destroying PixiJS app after init failure:', e);
            }
            this.app = null;
            this.stage = null;
            this.layers = null;
            this.isInitialized = false;
            throw err;
        }
    }

    /**
     * Create objects that persist across the animation
     */
    _createPersistentObjects() {
        // Code highlight
        this.objects.codeHighlight = new CodeHighlight(this.layers.code);
        
        // Comparison visual
        this.objects.comparison = new ComparisonVisual(this.layers.effects);
        this.objects.comparison.setPosition(this.layout.comparison.x, this.layout.comparison.y);
        this.objects.comparison.hide();
        
        // Loop indicator
        this.objects.loopIndicator = new LoopIndicator(this.layers.ui);
        this.objects.loopIndicator.setPosition(this.layout.loopIndicator.x, this.layout.loopIndicator.y);
        this.objects.loopIndicator.hide();
        
        // Return visual
        this.objects.returnVisual = new ReturnVisual(this.layers.effects);
        this.objects.returnVisual.setPosition(this.layout.return.x, this.layout.return.y);
        this.objects.returnVisual.hide();
    }

    /**
     * Get or create an array visual
     */
    getOrCreateArray(name, values = []) {
        console.log(`🎨 getOrCreateArray: ${name} =`, values, 'exists:', this.objects.arrays.has(name));
        
        if (!this.objects.arrays.has(name)) {
            const arrayVisual = new ArrayVisual(this.layers.arrays, name, values);
            const arrayCount = this.objects.arrays.size;
            arrayVisual.setPosition(
                this.layout.arrays.x,
                this.layout.arrays.y + arrayCount * this.layout.arrays.rowSpacing
            );
            // Hide until seeded/animated
            arrayVisual.hide();
            arrayVisual.container.alpha = 0;
            this.objects.arrays.set(name, arrayVisual);
            console.log(`✅ Created array visual: ${name} with ${values.length} elements`);
        } else if (Array.isArray(values) && values.length) {
            const existing = this.objects.arrays.get(name);
            existing.updateValues(values);
        }
        this._layoutAll();
        return this.objects.arrays.get(name);
    }

    /**
     * Get or create a variable visual
     */
    getOrCreateVariable(name, value = null) {
        console.log(`🎨 getOrCreateVariable: ${name} =`, value, 'exists:', this.objects.variables.has(name));
        
        if (!this.objects.variables.has(name)) {
            const varVisual = new VariableVisual(this.layers.variables, name, value);
            varVisual.setPosition(
                this.layout.variables.x,
                this.layout.variables.y + this.variableCount * this.layout.variables.spacing
            );
            // Hide until seeded/animated
            varVisual.hide();
            varVisual.container.alpha = 0;
            this.variableCount++;
            this.objects.variables.set(name, varVisual);
            console.log(`✅ Created variable visual: ${name} = ${value}`);
        } else if (value !== null && value !== undefined) {
            // Update existing variable display if a new initial value is provided
            const existing = this.objects.variables.get(name);
            existing.value = value;
            existing.valueText.text = String(value);
        }
        this._layoutAll();
        return this.objects.variables.get(name);
    }

    /**
     * Create a value bubble for transfer animation
     */
    createValueBubble(value) {
        const bubble = new ValueBubble(this.layers.effects, value);
        this.objects.bubbles.push(bubble);
        return bubble;
    }

    /**
     * Create animation from command - returns a GSAP tween/timeline
     */
    createAnimation(command) {
        const timeline = gsap.timeline();
        
        switch (command.type) {
            case 'HIGHLIGHT_CODE':
                // For now, just a placeholder - would integrate with code editor
                return null;
                
            case 'SHOW_ARRAY':
                return this._animateShowArray(command);
                
            case 'SHOW_INDICES':
                return this._animateShowIndices(command);
                
            case 'HIGHLIGHT_INDEX':
                return this._animateHighlightIndex(command);
                
            case 'EXTRACT_VALUE':
                return this._animateExtractValue(command);
                
            case 'CREATE_VARIABLE':
                return this._animateCreateVariable(command);
                
            case 'ASSIGN_VALUE':
                return this._animateAssignValue(command);
                
            case 'UPDATE_VARIABLE':
                return this._animateUpdateVariable(command);
                
            case 'SHOW_VALUE_BUBBLE':
                return this._animateShowValueBubble(command);
                
            case 'SHOW_COMPARISON':
                return this._animateShowComparison(command);
                
            case 'EVALUATE_CONDITION':
                return this._animateEvaluateCondition(command);
                
            case 'SHOW_BRANCH':
                return this._animateShowBranch(command);
                
            case 'SHOW_LOOP_INDICATOR':
                return this._animateShowLoopIndicator(command);
                
            case 'PULSE_LOOP':
                return this._animatePulseLoop(command);
                
            case 'SHOW_RETURN_VALUE':
                return this._animateShowReturnValue(command);
                
            case 'ANIMATE_RETURN':
                return this._animateReturn(command);
                
            case 'COMPLETE_STEP':
                return this._animateCompleteStep(command);
                
            default:
                return null;
        }
    }

    // Animation implementations
    _animateShowArray(command) {
        const { name, values, duration } = command;
        const array = this.getOrCreateArray(name, values);
        array.show();
        
        const tl = gsap.timeline();
        array.container.alpha = 0;
        array.container.scale.set(0.8);
        
        tl.to(array.container, {
            alpha: 1,
            duration: duration * 0.5
        });
        tl.to(array.container.scale, {
            x: 1,
            y: 1,
            duration: duration * 0.5,
            ease: 'back.out(1.5)'
        }, '<');
        
        return tl;
    }

    _animateShowIndices(command) {
        const { name, duration } = command;
        const array = this.objects.arrays.get(name);
        if (!array) return null;
        
        const tl = gsap.timeline();
        array.animateShowIndices(tl, 0);
        return tl;
    }

    _animateHighlightIndex(command) {
        const { name, index, duration } = command;
        const array = this.objects.arrays.get(name);
        if (!array) return null;
        
        const tl = gsap.timeline();
        array.animateHighlightIndex(tl, index, 0);
        return tl;
    }

    _animateExtractValue(command) {
        const { from, index, value, duration } = command;
        const array = this.objects.arrays.get(from);
        if (!array) return null;
        
        const bubble = this.createValueBubble(value);
        const fromPos = array.getElementPosition(index);
        // Target will be set later when we know the variable position
        const toPos = { x: 200, y: 280 }; // Default position
        
        const tl = gsap.timeline();
        bubble.animateTransfer(tl, fromPos, toPos, 0, duration);
        return tl;
    }

    _animateCreateVariable(command) {
        const { name, value = null, duration } = command;
        const isNew = !this.objects.variables.has(name);
        const variable = this.getOrCreateVariable(name, value);
        variable.show();
        
        const tl = gsap.timeline();
        
        // Only animate "pop in" if this is a new variable
        if (isNew) {
            variable.container.alpha = 0;
            variable.container.scale.set(0);
            
            tl.to(variable.container, {
                alpha: 1,
                duration: duration * 0.3
            });
            tl.to(variable.container.scale, {
                x: 1,
                y: 1,
                duration: duration * 0.7,
                ease: 'back.out(2)'
            }, '<');
        } else {
            // Variable exists, just ensure visible and update value
            variable.container.alpha = 1;
            variable.container.scale.set(1);
            if (value !== null && value !== undefined) {
                variable.value = value;
                variable.valueText.text = String(value);
            }
            // Small pulse to indicate update
            tl.to(variable.container.scale, { x: 1.05, y: 1.05, duration: 0.1 });
            tl.to(variable.container.scale, { x: 1, y: 1, duration: 0.1, ease: 'back.out(2)' });
        }
        
        return tl;
    }

    _animateAssignValue(command) {
        const { target, value, duration } = command;
        const variable = this.objects.variables.get(target);
        if (!variable) return null;
        variable.show();
        
        const tl = gsap.timeline();
        variable.animateAssignment(tl, value, 0);
        return tl;
    }

    _animateUpdateVariable(command) {
        const { name, value, duration } = command;
        console.log('📝 Updating variable:', name, '=', value);
        let variable = this.objects.variables.get(name);
        
        // Create if doesn't exist (for loop variables)
        if (!variable) {
            variable = this.getOrCreateVariable(name, value);
        }
        variable.show();
        // Ensure visible for existing variables
        variable.container.alpha = 1;
        variable.container.scale.set(1);
        
        const tl = gsap.timeline();
        variable.animateUpdate(tl, value, 0);
        return tl;
    }

    _animateShowValueBubble(command) {
        const { value, duration } = command;
        const bubble = this.createValueBubble(value);
        bubble.setPosition(400, 100);
        
        const tl = gsap.timeline();
        bubble.container.alpha = 0;
        bubble.container.scale.set(0);
        
        tl.to(bubble.container, {
            alpha: 1,
            duration: duration * 0.3
        });
        tl.to(bubble.container.scale, {
            x: 1,
            y: 1,
            duration: duration * 0.5,
            ease: 'back.out(2)'
        }, '<');
        
        return tl;
    }

    _animateShowComparison(command) {
        const { left, operator, right, duration } = command;
        const comparison = this.objects.comparison;
        console.log('⚖️ Showing comparison:', left, operator, right);
        comparison.show();
        // Reset result text for new comparison
        comparison.resultText.alpha = 0;
        
        const tl = gsap.timeline();
        comparison.animateComparison(tl, left, operator, right, 0);
        return tl;
    }

    _animateEvaluateCondition(command) {
        const { result, duration } = command;
        const comparison = this.objects.comparison;
        
        const tl = gsap.timeline();
        comparison.animateResult(tl, result, 0);
        return tl;
    }

    _animateShowBranch(command) {
        const { taken, duration } = command;
        // Could show branch path visualization
        const tl = gsap.timeline();
        tl.to({}, { duration }); // Placeholder
        return tl;
    }

    _animateShowLoopIndicator(command) {
        const { iteration, duration } = command;
        const indicator = this.objects.loopIndicator;
        console.log('🔁 Showing loop indicator, iteration:', iteration);
        indicator.show();
        // Ensure visible and reset for animation
        indicator.container.alpha = 1;
        indicator.container.scale.set(1);
        
        const tl = gsap.timeline();
        indicator.animateIteration(tl, iteration, 0);
        return tl;
    }

    _animatePulseLoop(command) {
        const indicator = this.objects.loopIndicator;
        
        const tl = gsap.timeline();
        tl.to(indicator.container.scale, {
            x: 1.15,
            y: 1.15,
            duration: 0.15
        });
        tl.to(indicator.container.scale, {
            x: 1,
            y: 1,
            duration: 0.15,
            ease: 'back.out(2)'
        });
        return tl;
    }

    _animateShowReturnValue(command) {
        const { value, duration } = command;
        const returnVisual = this.objects.returnVisual;
        returnVisual.show();
        
        const tl = gsap.timeline();
        returnVisual.animateReturn(tl, value, 0);
        return tl;
    }

    _animateReturn(command) {
        const { value, duration } = command;
        // Additional return animation effects
        const tl = gsap.timeline();
        
        // Flash screen effect
        const flash = new PIXI.Graphics();
        flash.rect(0, 0, this.width, this.height);
        flash.fill({ color: 0x22c55e, alpha: 0 });
        this.layers.effects.addChild(flash);
        
        tl.to(flash, {
            alpha: 0.1,
            duration: 0.2
        });
        tl.to(flash, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => flash.destroy()
        });
        
        return tl;
    }

    _animateCompleteStep(command) {
        const tl = gsap.timeline();
        // Could add step completion indicator
        tl.to({}, { duration: command.duration });
        return tl;
    }

    /**
     * Reset all visual objects
     */
    reset() {
        if (!this.isInitialized || this.isDestroyed) return;
        
        // Clear arrays
        this.objects.arrays.forEach(arr => arr?.destroy());
        this.objects.arrays.clear();
        
        // Clear variables
        this.objects.variables.forEach(v => v?.destroy());
        this.objects.variables.clear();
        this.variableCount = 0;
        
        // Clear bubbles
        this.objects.bubbles.forEach(b => b?.destroy());
        this.objects.bubbles = [];
        
        // Hide persistent objects
        this.objects.comparison?.hide();
        this.objects.loopIndicator?.hide();
        this.objects.returnVisual?.hide();
    }

    /**
     * Resize the canvas
     */
    resize(width, height) {
        if (!this.isInitialized || this.isDestroyed || !this.app) return;
        
        this.width = width;
        this.height = height;
        this.app.renderer?.resize(width, height);
        this._computeLayout();
        this._layoutAll();
    }

    /**
     * Destroy the renderer
     */
    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.isInitialized = false;
        
        try {
            this.reset();
        } catch (e) {
            console.warn('Error during reset:', e);
        }
        
        try {
            if (this.app) {
                this.app.destroy(true, { children: true, texture: true });
            }
        } catch (e) {
            console.warn('Error destroying PixiJS app:', e);
        }
        
        this.app = null;
        this.stage = null;
        this.layers = null;
    }
}

// Singleton instance
let rendererInstance = null;

export const getPixiRenderer = () => {
    if (!rendererInstance) {
        rendererInstance = new PixiRenderer();
    }
    return rendererInstance;
};

export const createPixiRenderer = () => {
    return new PixiRenderer();
};
