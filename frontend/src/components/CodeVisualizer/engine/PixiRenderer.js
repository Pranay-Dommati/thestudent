/**
 * PixiRenderer - WebGL Canvas Renderer
 * 
 * ZONE-BASED CHOREOGRAPHY ENGINE
 * 
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │ INPUT ZONE          (arrays, parameters)    │
 * ├────────────┬────────────────────────────────┤
 * │ STATE ZONE │ INTERACTION ZONE               │
 * │ (variables)│ (temporary choreography)       │
 * ├────────────┴────────────────────────────────┤
 * │ OUTPUT ZONE         (return / result)       │
 * └─────────────────────────────────────────────┘
 * 
 * Variables are PERSISTENT ACTORS:
 * - Created once, have a HOME position
 * - Move to INTERACTION zone for comparisons/assignments
 * - Return HOME after interaction
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
    CodeHighlight,
    PointerArrow
} from './VisualObjects';
import { ASSIGN_FROM_ARRAY_INDEX, FOR_LOOP_ITERATION, playBehavior } from './BehaviorLibrary';
import { choreographForLoopIteration } from './Choreography';

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
        // These are the ACTORS that participate in choreography
        this.objects = {
            arrays: new Map(),      // name -> ArrayVisual (INPUT zone)
            variables: new Map(),   // name -> VariableVisual (STATE zone - these ARE the state display)
            bubbles: [],            // ValueBubble instances (temporary)
            comparison: null,       // ComparisonVisual (INTERACTION zone)
            loopIndicator: null,    // LoopIndicator (INPUT zone, top-right)
            returnVisual: null,     // ReturnVisual (OUTPUT zone)
            codeHighlight: null,    // CodeHighlight
            pointerArrow: null      // PointerArrow (for connections)
        };

        // ============================================
        // ZONE-BASED LAYOUT SYSTEM
        // ============================================
        // Zones are FIXED regions - visuals have HOME positions within zones
        // Choreography TEMPORARILY moves visuals to INTERACTION zone
        // After interaction, visuals return HOME
        //
        // ┌─────────────────────────────────────────────┐
        // │ INPUT ZONE          (arrays, parameters)    │
        // ├────────────┬────────────────────────────────┤
        // │ STATE ZONE │ INTERACTION ZONE               │
        // │ (variables)│ (temporary choreography)       │
        // │            │                                │
        // ├────────────┴────────────────────────────────┤
        // │ OUTPUT ZONE         (return / result)       │
        // └─────────────────────────────────────────────┘

        this.zones = {
            input: { x: 0, y: 0, width: 0, height: 0 },
            state: { x: 0, y: 0, width: 0, height: 0 },
            interaction: { x: 0, y: 0, width: 0, height: 0 },
            output: { x: 0, y: 0, width: 0, height: 0 }
        };

        this.variableCount = 0;
        this.layers = null;
    }

    _computeLayout() {
        const padX = 20;
        const padY = 56;
        const canvasWidth = this.width;
        const canvasHeight = this.height;

        // ============================================
        // ZONE CALCULATIONS
        // ============================================
        const stateZoneWidth = 140;  // Left column for state
        const outputZoneHeight = 60; // Bottom row for output
        const inputZoneHeight = 80;  // Top row for input

        // INPUT ZONE: Top strip (arrays, parameters)
        this.zones.input = {
            x: padX,
            y: padY,
            width: canvasWidth - padX * 2,
            height: inputZoneHeight
        };

        // STATE ZONE: Left column below input (variables)
        this.zones.state = {
            x: padX,
            y: padY + inputZoneHeight + 10,
            width: stateZoneWidth,
            height: canvasHeight - padY - inputZoneHeight - outputZoneHeight - 30
        };

        // INTERACTION ZONE: Center-right area (choreography happens here)
        this.zones.interaction = {
            x: padX + stateZoneWidth + 20,
            y: padY + inputZoneHeight + 10,
            width: canvasWidth - padX * 2 - stateZoneWidth - 20,
            height: canvasHeight - padY - inputZoneHeight - outputZoneHeight - 30
        };

        // OUTPUT ZONE: Bottom strip (return values)
        this.zones.output = {
            x: padX,
            y: canvasHeight - outputZoneHeight - 10,
            width: canvasWidth - padX * 2,
            height: outputZoneHeight
        };

        // Store centers for choreography targets
        this.zones.interaction.centerX = this.zones.interaction.x + this.zones.interaction.width / 2;
        this.zones.interaction.centerY = this.zones.interaction.y + this.zones.interaction.height / 2;
    }

    _layoutAll() {
        if (!this.isInitialized || this.isDestroyed) return;

        // Position visuals in their HOME positions within zones
        this._layoutInputZone();
        this._layoutStateZone();
        this._layoutOutputZone();
        this._layoutInteractionZone();
    }

    /**
     * Layout INPUT ZONE: Arrays and parameters
     */
    _layoutInputZone() {
        const arrays = Array.from(this.objects.arrays.values());
        const zone = this.zones.input;

        const leftPad = 10;
        const rightPad = 10;
        let currentX = zone.x + leftPad;

        arrays.forEach((arr) => {
            // Ensure arrays never overflow the canvas/zone.
            // Scale down if needed, but never scale up.
            const maxWidth = Math.max(50, zone.width - leftPad - rightPad);
            const baseWidth = Math.max(1, arr.getVisualWidth());
            const scale = Math.min(1, maxWidth / baseWidth);
            arr.container.scale.set(scale);

            const visualHeight = arr.getVisualHeight() * scale;
            const y = zone.y + Math.max(6, (zone.height - visualHeight) / 2);

            arr.setHomePosition(currentX, y);
            arr.moveToHome();

            currentX += baseWidth * scale + 30;
        });

        // Loop indicator in top-right of input zone
        if (this.objects.loopIndicator) {
            this.objects.loopIndicator.setPosition(
                zone.x + zone.width - 50,
                zone.y + 20
            );
        }
    }

    /**
     * Layout STATE ZONE: Variables (persistent actors, vertically stacked)
     * These are the ONLY state display - no separate panel
     */
    _layoutStateZone() {
        const vars = Array.from(this.objects.variables.values());
        const zone = this.zones.state;

        // Variables stacked vertically in STATE zone
        const startY = zone.y + 10;
        vars.forEach((v, idx) => {
            const y = startY + idx * 45;
            v.setHomePosition(zone.x + 5, y);
            v.moveToHome();
        });
    }

    /**
     * Layout INTERACTION ZONE: Comparison visual (center)
     */
    _layoutInteractionZone() {
        const zone = this.zones.interaction;

        // Comparison visual lives in center of interaction zone
        if (this.objects.comparison) {
            this.objects.comparison.setPosition(zone.centerX - 60, zone.centerY - 20);
        }
    }

    /**
     * Layout OUTPUT ZONE: Return visual
     */
    _layoutOutputZone() {
        const zone = this.zones.output;

        if (this.objects.returnVisual) {
            this.objects.returnVisual.setPosition(
                zone.x + zone.width / 2 - 50,
                zone.y + 10
            );
        }
    }

    // ============================================
    // CHOREOGRAPHY METHODS
    // ============================================
    // These methods animate visuals INTO the interaction zone,
    // perform the interaction, then return them HOME.

    /**
     * Get the interaction zone center point
     */
    getInteractionCenter() {
        return {
            x: this.zones.interaction.centerX,
            y: this.zones.interaction.centerY
        };
    }

    /**
     * Get a variable visual by name
     */
    getVariable(name) {
        return this.objects.variables.get(name);
    }

    /**
     * Get an array visual by name
     */
    getArray(name) {
        return this.objects.arrays.get(name);
    }

    /**
     * Choreograph a comparison: gather value representations, compare, show result
     * 
     * PROPER CHOREOGRAPHY:
     * 1. Create value bubbles representing the two values
     * 2. Animate them to interaction zone with proper spacing
     * 3. Show operator between them
     * 4. Show result (True ✓ / False ✗)
     * 5. Clean up
     * 
     * Original variables STAY in place - we animate VALUE representations
     */
    /**
     * Play cinematic IF_ELSE_BRANCH animation
     * Delegates to the standardized BehaviorLibrary
     */
    playCinematicComparison(params, onComplete) {
        console.log('🎭 PixiRenderer.playCinematicComparison:', params);

        // Calculate center position for the comparison animation
        const zone = this.zones.interaction;
        const position = {
            x: zone?.centerX || this.width / 2,
            y: zone?.centerY || this.height / 2
        };

        // Map params to behavior params
        const behaviorParams = {
            leftValue: params.left,
            rightValue: params.right,
            leftVarName: params.leftVar,
            rightVarName: params.rightVar,
            operator: params.operator,
            result: params.result,
            position: position
        };

        // Use the BehaviorLibrary to execute the animation
        return playBehavior('IF_ELSE_BRANCH', this.layers.effects, behaviorParams, (result) => {
            onComplete?.(result);
        });
    }

    /**
     * Choreograph an assignment: highlight source, transfer value to target
     * Variables STAY in place - we animate a value bubble transfer
     * 
     * @param {Object} timeline - GSAP timeline
     * @param {string} targetVar - Target variable name
     * @param {string} sourceVar - Source variable name (or null if literal)
     * @param {*} value - Value being assigned
     * @param {number} startTime - Start time in timeline
     */
    choreographAssignment(timeline, targetVar, sourceVar, value, startTime) {
        const targetVisual = this.objects.variables.get(targetVar);
        const sourceVisual = sourceVar ? this.objects.variables.get(sourceVar) : null;

        if (sourceVisual && targetVisual) {
            // Highlight source variable
            timeline.to(sourceVisual.container, {
                pixi: { tint: 0x6366f1 },
                duration: 0.15
            }, startTime);

            // Create value bubble at source position
            timeline.call(() => {
                const bubble = this.createValueBubble(value);
                const sourcePos = sourceVisual.getPosition();
                bubble.setPosition(sourcePos.x + 80, sourcePos.y + 15);
                bubble.show();

                // Animate bubble to target
                const targetPos = targetVisual.getPosition();
                gsap.to(bubble.container, {
                    x: targetPos.x + 80,
                    y: targetPos.y + 15,
                    duration: 0.4,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        // Update target value
                        targetVisual.setValue(value, true);
                        // Remove bubble
                        bubble.hide();
                        setTimeout(() => bubble.destroy(), 100);
                    }
                });
            }, null, startTime + 0.2);

            // Remove highlight from source
            timeline.to(sourceVisual.container, {
                pixi: { tint: 0xffffff },
                duration: 0.2
            }, startTime + 0.7);
        } else if (targetVisual) {
            // Direct value assignment (no source visual)
            timeline.call(() => {
                targetVisual.setValue(value, true);
            }, null, startTime + 0.2);
        }
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
     * These are positioned within their respective ZONES
     */
    _createPersistentObjects() {
        // NOTE: No StatePanel - VariableVisuals ARE the state display
        // They are persistent actors that live in STATE zone and move for choreography

        // Pointer arrow for showing connections
        this.objects.pointerArrow = new PointerArrow(this.layers.effects);

        // Code highlight
        this.objects.codeHighlight = new CodeHighlight(this.layers.code);

        // Comparison visual lives in INTERACTION ZONE (center)
        this.objects.comparison = new ComparisonVisual(this.layers.effects);
        this.objects.comparison.setPosition(
            this.zones.interaction.centerX - 60,
            this.zones.interaction.centerY - 20
        );
        this.objects.comparison.hide();

        // Loop indicator lives in INPUT ZONE (top-right)
        this.objects.loopIndicator = new LoopIndicator(this.layers.ui);
        this.objects.loopIndicator.setPosition(
            this.zones.input.x + this.zones.input.width - 50,
            this.zones.input.y + 20
        );
        this.objects.loopIndicator.hide();

        // Return visual lives in OUTPUT ZONE (bottom-center)
        this.objects.returnVisual = new ReturnVisual(this.layers.effects);
        this.objects.returnVisual.setPosition(
            this.zones.output.x + this.zones.output.width / 2 - 50,
            this.zones.output.y + 10
        );
        this.objects.returnVisual.hide();

        // Zone labels removed for cleaner visualization
    }

    /**
     * Draw a zone label
     */
    _drawZoneLabel(text, x, y) {
        const label = new PIXI.Text({
            text,
            style: new PIXI.TextStyle({
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                fill: 0x475569,
                fontWeight: 'bold'
            })
        });
        label.x = x;
        label.y = y;
        this.layers.ui.addChild(label);
    }

    /**
     * Get or create an array visual
     * Arrays live in the INPUT ZONE with fixed home positions
     */
    getOrCreateArray(name, values = []) {
        console.log(`🎨 getOrCreateArray: ${name} =`, values, 'exists:', this.objects.arrays.has(name));

        if (!this.objects.arrays.has(name)) {
            const arrayVisual = new ArrayVisual(this.layers.arrays, name, values);

            // Calculate HOME position in INPUT zone
            const zone = this.zones.input;
            const arrayCount = this.objects.arrays.size;
            const homeX = zone.x;
            const homeY = zone.y + 10 + arrayCount * 70;  // Stack vertically if multiple arrays

            arrayVisual.setHomePosition(homeX, homeY);
            arrayVisual.moveToHome();

            // Hidden until seeded/animated
            arrayVisual.container.alpha = 0;
            arrayVisual.show();

            this.objects.arrays.set(name, arrayVisual);
            console.log(`✅ Created array visual: ${name} with ${values.length} elements at home (${homeX}, ${homeY})`);
        } else if (Array.isArray(values) && values.length) {
            const existing = this.objects.arrays.get(name);
            existing.updateValues(values);
        }
        return this.objects.arrays.get(name);
    }

    /**
     * Get or create a variable visual
     * Variables are PERSISTENT ACTORS in the STATE ZONE
     * They move for choreography, then return home
     */
    getOrCreateVariable(name, value = null) {
        // Skip self and other internal variables
        if (name === 'self' || name.startsWith('_')) {
            return null;
        }

        console.log(`🎨 getOrCreateVariable: ${name} =`, value, 'exists:', this.objects.variables.has(name));

        // Display value - show actual value or '?' if undefined
        const displayValue = (value !== null && value !== undefined) ? value : '?';

        if (!this.objects.variables.has(name)) {
            const varVisual = new VariableVisual(this.layers.variables, name, displayValue);

            // Calculate HOME position in STATE zone
            const zone = this.zones.state;
            const homeX = zone.x + 5;
            const homeY = zone.y + 10 + this.variableCount * 45;

            varVisual.setHomePosition(homeX, homeY);
            varVisual.moveToHome();

            // Start visible but faded, will animate in
            varVisual.show();
            varVisual.container.alpha = 0;

            // Fade in animation
            gsap.to(varVisual.container, {
                alpha: 1,
                duration: 0.3,
                ease: 'power2.out'
            });

            this.variableCount++;
            this.objects.variables.set(name, varVisual);
            console.log(`✅ Created variable: ${name} at home (${homeX}, ${homeY})`);
        } else if (value !== null && value !== undefined) {
            // Update existing variable
            const existing = this.objects.variables.get(name);
            existing.setValue(value, true);
        }
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
        console.log('🎨 PixiRenderer.createAnimation:', command.type, command);
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

            // Legacy cases removed: SHOW_COMPARISON, EVALUATE_CONDITION, SHOW_BRANCH

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

            // CINEMATIC BEHAVIORS - Renderer just executes, doesn't decide
            case 'PLAY_BEHAVIOR':
                return this._playBehavior(command);

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
     * Execute a cinematic behavior from BehaviorLibrary
     * PixiRenderer is just the executor - it doesn't decide which behavior to play
     * 
     * @param {Object} command - { behaviorId, params, onComplete }
     */
    _playBehavior(command) {
        const { behaviorId, params } = command;

        // Add position from interaction zone center
        const fullParams = {
            ...params,
            position: {
                x: this.zones.interaction.centerX,
                y: this.zones.interaction.centerY
            }
        };

        console.log(`🎬 PixiRenderer._playBehavior: ${behaviorId}`, fullParams);

        // Let BehaviorLibrary handle the animation
        // Returns GSAP timeline that TimelineEngine will sequence
        return playBehavior(behaviorId, this.layers.effects, fullParams, (finalResultInfo) => {
            // Handle handoff to persistent visuals if needed
            if (finalResultInfo?.varName && finalResultInfo?.value !== undefined) {
                this._handleBehaviorComplete(finalResultInfo);
            }
        });
    }

    /**
     * Handle behavior completion - create/update persistent variable
     * Called after cinematic behavior finishes
     */
    _handleBehaviorComplete(resultInfo) {
        const { varName, value, x, y } = resultInfo;

        // Check if variable already exists
        const existingVar = this.objects.variables.get(varName);

        if (existingVar) {
            // Variable exists - just update value with pulse
            existingVar.setValue(value, true);
        } else {
            // Create new variable at behavior's final position, then slide to home
            const varVisual = this.getOrCreateVariable(varName, value);
            if (varVisual && x !== undefined && y !== undefined) {
                // Start at behavior's final position
                varVisual.container.x = x;
                varVisual.container.y = y;
                varVisual.container.alpha = 1;
                varVisual.container.scale.set(1);

                // Slide to home position
                gsap.to(varVisual.container, {
                    x: varVisual.homeX,
                    y: varVisual.homeY,
                    duration: 0.5,
                    ease: 'power2.inOut'
                });
            }
        }
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

        // Reset pointer arrow
        this.objects.pointerArrow?.reset();

        // Clear state panel
        this.objects.statePanel?.clear();
    }

    // ==========================================
    // NEW METHODS FOR VISUAL ENGINE PRIMITIVES
    // ==========================================

    /**
     * Highlight a specific line of code
     */
    highlightLine(lineNumber) {
        // This is handled by the React shell via events
        // The renderer doesn't control the code editor
        console.log(`📍 Highlight line: ${lineNumber}`);
    }

    /**
     * Show value bubble floating toward a variable
     */
    showValueBubble(value, targetVarName) {
        const bubble = this.createValueBubble(value);
        const targetVar = this.objects.variables.get(targetVarName);

        // Position bubble above the variable
        const targetPos = targetVar
            ? { x: targetVar.container.x + 60, y: targetVar.container.y - 40 }
            : { x: this.width / 2, y: this.height / 2 - 50 };

        bubble.setPosition(targetPos.x, targetPos.y);
        bubble.container.alpha = 0;
        bubble.container.scale.set(0);

        gsap.to(bubble.container, {
            alpha: 1,
            duration: 0.2
        });
        gsap.to(bubble.container.scale, {
            x: 1,
            y: 1,
            duration: 0.3,
            ease: 'back.out(2)'
        });

        // Store reference for clearing
        this._currentBubble = bubble;
    }

    /**
     * Clear the current value bubble
     */
    clearValueBubble() {
        if (this._currentBubble) {
            const bubble = this._currentBubble;
            gsap.to(bubble.container, {
                alpha: 0,
                duration: 0.2,
                onComplete: () => bubble.destroy()
            });
            this._currentBubble = null;
        }
    }

    /**
     * Animate value assignment to variable
     */
    animateAssignment(varName, value) {
        const variable = this.objects.variables.get(varName);
        if (!variable) return;

        variable.show();
        variable.container.alpha = 1;

        const tl = gsap.timeline();
        variable.animateAssignment(tl, value, 0);
    }

    /**
     * Highlight array index
     */
    highlightArrayIndex(arrayName, index) {
        const array = this.objects.arrays.get(arrayName);
        if (!array) return;

        array.show();
        const tl = gsap.timeline();
        array.animateHighlightIndex(tl, index, 0);
    }

    /**
     * Clear array highlight
     */
    clearArrayHighlight(arrayName) {
        const array = this.objects.arrays.get(arrayName);
        if (array) {
            array.clearHighlight?.();
        }
    }

    /**
     * Animate extraction from array
     */
    animateExtraction(arrayName, index, targetVarName) {
        const array = this.objects.arrays.get(arrayName);
        const targetVar = this.objects.variables.get(targetVarName);
        if (!array) return;

        const fromPos = array.getElementPosition(index);
        const toPos = targetVar
            ? { x: targetVar.container.x + 60, y: targetVar.container.y }
            : { x: 200, y: 280 };

        const value = array.values[index];
        const bubble = this.createValueBubble(value);

        const tl = gsap.timeline();
        bubble.animateTransfer(tl, fromPos, toPos, 0, 0.5);
    }

    /**
     * Show loop indicator with iteration count
     */
    showLoopIndicator(iteration) {
        if (this.objects.loopIndicator) {
            this.objects.loopIndicator.show();
            this.objects.loopIndicator.update(iteration);
        }
    }

    /**
     * Pulse the loop indicator
     */
    pulseLoopIndicator() {
        if (this.objects.loopIndicator) {
            this.objects.loopIndicator.pulse?.();
        }
    }

    /**
     * Show comparison visual
     */
    showComparison(left, operator, right) {
        console.log('🔍 showComparison called:', {
            left, operator, right,
            hasComparison: !!this.objects.comparison,
            comparisonPosition: this.objects.comparison ? {
                x: this.objects.comparison.container?.x,
                y: this.objects.comparison.container?.y
            } : null
        });

        if (this.objects.comparison) {
            this.objects.comparison.show();
            // Use the animateComparison method with a timeline
            const tl = gsap.timeline();
            this.objects.comparison.animateComparison(tl, left, operator, right, 0);
        } else {
            console.warn('⚠️ No comparison object exists!');
        }
    }

    /**
     * Animate condition evaluation result
     */
    animateConditionEvaluation(result) {
        if (this.objects.comparison) {
            const tl = gsap.timeline();
            this.objects.comparison.animateResult(tl, result, 0);
        }
    }

    /**
     * Show branch taken indicator
     */
    showBranchTaken(result) {
        if (this.objects.comparison) {
            this.objects.comparison.showBranch?.(result);
        }
    }

    /**
     * Show return value visual
     */
    showReturnValue(value) {
        if (this.objects.returnVisual) {
            this.objects.returnVisual.show();
            this.objects.returnVisual.setValue(value);
        }
    }

    /**
     * Animate return
     */
    animateReturn(value) {
        if (this.objects.returnVisual) {
            this.objects.returnVisual.animate?.();
        }
    }

    /**
     * Update variable instantly (no animation) - for state rebuilding
     */
    updateVariableInstantly(varName, value) {
        let variable = this.objects.variables.get(varName);
        if (!variable) {
            variable = this.getOrCreateVariable(varName, value);
        }
        variable.show();
        variable.container.alpha = 1;
        variable.container.scale.set(1);
        variable.value = value;
        variable.valueText.text = String(value);
    }

    /**
     * Animate pointer from variable label to array element
     * Creates a visual connection showing which element is being accessed
     */
    animatePointerToArrayElement(arrayName, index, varName) {
        const array = this.objects.arrays.get(arrayName);
        if (!array || !this.objects.pointerArrow) return;

        const elementPos = array.getElementPosition(index);

        // Variable position (or use a starting point near the variable name)
        const variable = this.objects.variables.get(varName);
        let fromPos;
        if (variable) {
            fromPos = {
                x: variable.container.x + 30,
                y: variable.container.y + variable.boxHeight / 2
            };
        } else {
            // Default position above the element
            fromPos = {
                x: elementPos.x,
                y: elementPos.y - 80
            };
        }

        const tl = gsap.timeline();
        this.objects.pointerArrow.animatePointer(tl, fromPos, elementPos, varName, 0);
    }

    /**
     * Hide the pointer arrow
     */
    hidePointer() {
        if (this.objects.pointerArrow) {
            const tl = gsap.timeline();
            this.objects.pointerArrow.fadeOut(tl, 0);
        }
    }

    /**
     * Animate value transfer from array element to variable with visual bubble
     */
    animateValueFromArray(arrayName, index, varName, value) {
        const array = this.objects.arrays.get(arrayName);
        const variable = this.objects.variables.get(varName);

        if (!array) return;

        const fromPos = array.getElementPosition(index);
        const toPos = variable ? {
            x: variable.container.x + variable.valueBox.x + variable.boxWidth / 2,
            y: variable.container.y + variable.boxHeight / 2
        } : {
            x: fromPos.x,
            y: fromPos.y + 100
        };

        // Create value bubble for transfer animation
        const bubble = this.createValueBubble(value);
        const tl = gsap.timeline();
        bubble.animateTransfer(tl, fromPos, toPos, 0, 0.5);

        // Update variable after bubble arrives
        tl.call(() => {
            if (variable) {
                variable.value = value;
                variable.valueText.text = String(value);
            }
        }, null, 0.5);
    }

    /**
     * Play the cinematic ASSIGN_FROM_ARRAY_INDEX animation
     * Uses the tested behavior from BehaviorLibrary for professional animation
     * 
     * After animation completes, the variable smoothly slides from center to STATE zone
     * The behavior passes finalResultInfo with exact position for seamless handoff
     * 
     * @param {Object} options - Animation options
     * @param {string} options.arrayName - Name of the source array
     * @param {Array} options.arrayValues - Array values
     * @param {number} options.index - Index being accessed
     * @param {string} options.varName - Target variable name
     * @param {*} options.oldValue - Previous value (optional)
     * @param {Function} onComplete - Callback when animation completes
     * @returns {Object} GSAP timeline
     */
    playAssignFromArrayIndex({ arrayName, arrayValues, index, varName, oldValue = null }, onComplete) {
        // Use the interaction zone center for positioning
        const position = {
            x: this.zones.interaction.centerX,
            y: this.zones.interaction.centerY
        };

        console.log('🎬 playAssignFromArrayIndex:', { arrayName, arrayValues, index, varName, oldValue, position });

        // Get the value early
        const value = arrayValues?.[index];

        // Use the effects layer for the animation
        // The behavior calls our callback with finalResultInfo containing exact position
        const timeline = ASSIGN_FROM_ARRAY_INDEX(this.layers.effects, {
            arrayName,
            arrayValues: arrayValues || [],
            index: index ?? 0,
            varName,
            oldValue,
            position
        }, (finalResultInfo) => {
            // finalResultInfo contains: { x, y, value, varName } - exact position of the final result
            console.log('🎬 Behavior complete, finalResultInfo:', finalResultInfo);

            // After cinematic animation: Create variable at EXACT POSITION, then slide to HOME
            if (value !== undefined) {
                // Check if variable already exists
                const existingVar = this.objects.variables.get(varName);

                if (existingVar) {
                    // Variable exists - just update value with pulse
                    existingVar.setValue(value, true);
                    onComplete?.();
                } else {
                    // NEW VARIABLE: Create at EXACT position where behavior ended
                    const varVisual = new VariableVisual(this.layers.variables, varName, value);

                    // Calculate HOME position in STATE zone
                    const zone = this.zones.state;
                    const homeX = zone.x + 5;
                    const homeY = zone.y + 10 + this.variableCount * 45;

                    // Set home position for future reference
                    varVisual.setHomePosition(homeX, homeY);

                    // START at the EXACT position from the behavior's final result
                    // Use finalResultInfo if available, fallback to center position
                    const startX = finalResultInfo?.x ?? (position.x - 25);
                    const startY = finalResultInfo?.y ?? position.y;

                    varVisual.container.x = startX;
                    varVisual.container.y = startY;
                    varVisual.show();
                    varVisual.container.alpha = 1;
                    varVisual.container.scale.set(1);

                    // Register the variable
                    this.variableCount++;
                    this.objects.variables.set(varName, varVisual);

                    console.log(`🎯 Created VariableVisual at (${startX}, ${startY}), sliding to (${homeX}, ${homeY})`);

                    // ANIMATE: Slide from exact position to home (STATE zone on left)
                    const slideTl = gsap.timeline({
                        onComplete: () => {
                            console.log(`✅ Variable ${varName} slid to home position`);
                            onComplete?.();
                        }
                    });

                    // Immediate slide to left (no delay since we're taking over seamlessly)
                    slideTl.to(varVisual.container, {
                        x: homeX,
                        y: homeY,
                        duration: 0.5,
                        ease: 'power2.inOut'
                    });

                    // Subtle scale pulse when landing
                    slideTl.to(varVisual.container.scale, {
                        x: 1.08,
                        y: 1.08,
                        duration: 0.1,
                        ease: 'power2.out'
                    }, '-=0.1');
                    slideTl.to(varVisual.container.scale, {
                        x: 1,
                        y: 1,
                        duration: 0.15,
                        ease: 'back.out(2)'
                    });
                }
            } else {
                onComplete?.();
            }
        });

        return timeline;
    }

    /**
     * Show/update the persistent loop iteration indicator
     */
    showIterationIndicator(iteration) {
        // Create or update the persistent iteration indicator
        if (!this.objects.iterationIndicator) {
            const container = new PIXI.Container();

            // Position in top-right of interaction zone
            container.x = this.width - 160;
            container.y = 100;

            // Badge background: Sleek dark panel with primary glow
            const badgeBg = new PIXI.Graphics();
            badgeBg.roundRect(0, 0, 130, 40, 8);
            badgeBg.fill({ color: 0x0f172a, alpha: 0.95 });
            badgeBg.stroke({ width: 2, color: 0x6366f1, alpha: 0.8 });
            container.addChild(badgeBg);

            // "Iteration:" label
            const labelText = new PIXI.Text({
                text: 'Iteration:',
                style: { fontFamily: 'Inter, sans-serif', fontSize: 14, fill: 0xf8fafc }
            });
            labelText.x = 12;
            labelText.y = 10;
            container.addChild(labelText);

            // Iteration number
            const numText = new PIXI.Text({
                text: String(iteration),
                style: { fontFamily: 'Inter, sans-serif', fontSize: 20, fill: 0xfbbf24, fontWeight: '900' }
            });
            numText.anchor.set(0.5);
            numText.x = 105;
            numText.y = 20;
            container.addChild(numText);

            container.alpha = 0;
            this.layers.effects.addChild(container);

            this.objects.iterationIndicator = { container, numText };

            // Fade in with scale pop
            gsap.to(container, { alpha: 1, duration: 0.3, ease: 'power2.out' });
            gsap.from(container.scale, { x: 0.7, y: 0.7, duration: 0.4, ease: 'back.out(2)' });
        } else {
            // Update existing indicator
            const { numText, container } = this.objects.iterationIndicator;
            numText.text = String(iteration);

            // Pulse animation on update
            gsap.to(numText.scale, { x: 1.4, y: 1.4, duration: 0.12, ease: 'power2.out' });
            gsap.to(numText.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(2)', delay: 0.12 });
        }
    }

    /**
     * Hide the iteration indicator (when loop ends)
     */
    hideIterationIndicator() {
        if (this.objects.iterationIndicator) {
            const { container } = this.objects.iterationIndicator;
            gsap.to(container, {
                alpha: 0,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    this.layers.effects.removeChild(container);
                    container.destroy({ children: true });
                    this.objects.iterationIndicator = null;
                }
            });
        }
    }

    /**
     * Play a cinematic FOR loop iteration
     * Uses modular choreography from Choreography.js
     */
    playForLoopIteration({ loopVar, arrayName, arrayValues, currentIndex, previousIndex, iteration, currentValue }, onComplete) {
        // Show/update the persistent iteration indicator
        this.showIterationIndicator(iteration);

        // Delegate to modular choreography function
        return choreographForLoopIteration({
            loopVar,
            arrayName,
            currentIndex,
            currentValue,
            iteration
        }, this, onComplete);
    }

    /**
     * Update a variable's value (the VariableVisual IS the state display)
     */
    updateStatePanel(varName, value) {
        console.log('🔄 PixiRenderer.updateVariable:', { varName, value });
        const variable = this.objects.variables.get(varName);
        if (variable) {
            variable.setValue(value, true);
        }
    }

    /**
     * Clear all variables (reset state)
     */
    clearStatePanel() {
        // Variables are persistent actors - just reset their values
        this.objects.variables.forEach((v, name) => {
            v.setValue('?', false);
        });
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
