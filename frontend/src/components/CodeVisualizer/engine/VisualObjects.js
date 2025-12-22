/**
 * Visual Objects - Persistent Graphics Objects
 * 
 * These are the actual visual entities that exist in the canvas.
 * They are NOT re-rendered by React - they persist and animate
 * through GSAP timeline commands.
 * 
 * Updated for PixiJS v8 API
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';

// Color palette
const COLORS = {
    // Primary
    primary: 0x6366f1,      // Indigo
    secondary: 0x8b5cf6,    // Purple
    accent: 0x14b8a6,       // Teal
    
    // State colors
    active: 0x22d3ee,       // Cyan
    success: 0x22c55e,      // Green
    warning: 0xf59e0b,      // Amber
    error: 0xef4444,        // Red
    
    // Neutrals
    bg: 0x0f172a,           // Slate 900
    bgLight: 0x1e293b,      // Slate 800
    border: 0x334155,       // Slate 700
    text: 0xf1f5f9,         // Slate 100
    textMuted: 0x94a3b8,    // Slate 400
    
    // Syntax
    keyword: 0xc084fc,      // Purple 400
    variable: 0x60a5fa,     // Blue 400
    number: 0xfbbf24,       // Amber 400
    string: 0x4ade80,       // Green 400
};

// Helper to create text with PixiJS v8 API
const createText = (text, options = {}) => {
    const { 
        fontSize = 14, 
        fill = COLORS.text, 
        fontWeight = 'normal', 
        fontFamily = 'JetBrains Mono, Consolas, monospace' 
    } = options;
    
    const style = new PIXI.TextStyle({
        fontFamily,
        fontSize,
        fill,
        fontWeight
    });
    
    return new PIXI.Text({ text: String(text), style });
};

/**
 * Base Visual Object
 * 
 * CHOREOGRAPHY SYSTEM:
 * - Every visual has a HOME position (where it lives in its zone)
 * - Visuals can be MOVED to interaction zone for choreography
 * - After interaction, visuals RETURN home
 */
export class VisualObject {
    constructor(stage) {
        this.stage = stage;
        this.container = new PIXI.Container();
        if (stage) {
            this.stage.addChild(this.container);
        }
        this.isVisible = true;
        
        // HOME position - where this visual "lives"
        this.homeX = 0;
        this.homeY = 0;
        this.isAtHome = true;
    }

    setPosition(x, y) {
        this.container.x = x;
        this.container.y = y;
        return this;
    }
    
    /**
     * Set the HOME position for this visual
     * This is where the visual "lives" in its zone
     */
    setHomePosition(x, y) {
        this.homeX = x;
        this.homeY = y;
        return this;
    }
    
    /**
     * Instantly move to home position
     */
    moveToHome() {
        this.container.x = this.homeX;
        this.container.y = this.homeY;
        this.isAtHome = true;
        return this;
    }
    
    /**
     * Animate movement to a target position (for choreography)
     * @returns {Object} GSAP tween config
     */
    animateMoveTo(x, y, duration = 0.4) {
        this.isAtHome = false;
        return gsap.to(this.container, {
            x, y,
            duration,
            ease: 'power2.out'
        });
    }
    
    /**
     * Animate return to home position
     * @returns {Object} GSAP tween config
     */
    animateMoveHome(duration = 0.3) {
        this.isAtHome = true;
        return gsap.to(this.container, {
            x: this.homeX,
            y: this.homeY,
            duration,
            ease: 'power2.inOut'
        });
    }
    
    /**
     * Get current position
     */
    getPosition() {
        return { x: this.container.x, y: this.container.y };
    }

    setAlpha(alpha) {
        this.container.alpha = alpha;
        return this;
    }

    show() {
        this.container.visible = true;
        this.isVisible = true;
        return this;
    }

    hide() {
        this.container.visible = false;
        this.isVisible = false;
        return this;
    }

    destroy() {
        if (this.container) {
            this.container.destroy({ children: true });
        }
    }
}

/**
 * Array Visual - Represents an array in memory
 * Clean, compact design with inline label
 */
export class ArrayVisual extends VisualObject {
    constructor(stage, name, values = []) {
        super(stage);
        this.name = name;
        this.values = values;
        this.elementBoxes = [];
        this.indexLabels = [];
        this.valueTexts = [];
        this.highlightedIndex = -1;
        
        this.elementSize = 44;  // Compact cell size
        this.elementHeight = 40;
        this.gap = 2;  // Minimal gap between cells
        
        this._createGraphics();
    }

    _createGraphics() {
        // IMPORTANT: keep all child x >= 0 so we never clip off the left edge

        // Array name label
        this.nameLabel = createText(this.name, {
            fontSize: 16,
            fill: COLORS.variable,
            fontWeight: 'bold'
        });
        this.nameLabel.anchor.set(0, 0.5);
        this.nameLabel.x = 0;
        this.nameLabel.y = this.elementHeight / 2;
        this.container.addChild(this.nameLabel);

        // Equals sign
        this.equalsSign = createText('=', {
            fontSize: 14,
            fill: COLORS.textMuted
        });
        this.equalsSign.anchor.set(0, 0.5);
        this.equalsSign.x = this.nameLabel.width + 8;
        this.equalsSign.y = this.elementHeight / 2;
        this.container.addChild(this.equalsSign);

        // Create element boxes after "name ="
        this.elementsStartX = this.equalsSign.x + this.equalsSign.width + 10;
        this._createElements();
    }

    _createElements() {
        this.values.forEach((value, index) => {
            const x = this.elementsStartX + index * (this.elementSize + this.gap);
            
            // Element box - clean rectangular cells
            const box = new PIXI.Graphics();
            box.roundRect(0, 0, this.elementSize, this.elementHeight, 2);
            box.fill(0x1e293b);  // Dark slate background
            box.stroke({ width: 2, color: 0x475569 });  // Gray border
            box.x = x;
            box.y = 0;
            this.container.addChild(box);
            this.elementBoxes.push(box);

            // Value text (centered in cell)
            const valueText = createText(value, {
                fontSize: 16,
                fill: COLORS.text,
                fontWeight: 'bold'
            });
            valueText.anchor.set(0.5);
            valueText.x = x + this.elementSize / 2;
            valueText.y = this.elementHeight / 2;
            this.container.addChild(valueText);
            this.valueTexts.push(valueText);

            // Index label below (always visible)
            const indexLabel = createText(index, {
                fontSize: 11,
                fill: COLORS.textMuted
            });
            indexLabel.anchor.set(0.5, 0);
            indexLabel.x = x + this.elementSize / 2;
            indexLabel.y = this.elementHeight + 4;
            this.container.addChild(indexLabel);
            this.indexLabels.push(indexLabel);
        });
    }

    animateShowIndices(timeline, startTime) {
        // Indices are always visible now, but can still animate them
        this.indexLabels.forEach((label, i) => {
            timeline.to(label, {
                alpha: 1,
                duration: 0.15,
                ease: 'power2.out'
            }, startTime + i * 0.05);
        });
    }

    animateHighlightIndex(timeline, index, startTime) {
        if (index < 0 || index >= this.elementBoxes.length) return;
        
        const box = this.elementBoxes[index];
        const indexLabel = this.indexLabels[index];
        
        // Create highlight border around the element
        const highlight = new PIXI.Graphics();
        highlight.roundRect(-3, -3, this.elementSize + 6, this.elementHeight + 6, 3);
        highlight.stroke({ width: 3, color: COLORS.accent });
        highlight.x = box.x;
        highlight.y = box.y;
        highlight.alpha = 0;
        this.container.addChild(highlight);
        
        // Animate highlight appearing
        timeline.to(highlight, {
            alpha: 1,
            duration: 0.2,
            ease: 'power2.out'
        }, startTime);
        
        // Scale the highlight slightly
        timeline.from(highlight.scale, {
            x: 1.15,
            y: 1.15,
            duration: 0.25,
            ease: 'back.out(1.7)'
        }, startTime);

        // Highlight the index label
        timeline.to(indexLabel, {
            pixi: { tint: COLORS.accent },
            duration: 0.2
        }, startTime);

        this.highlightedIndex = index;
        this._currentHighlight = highlight;
    }

    getElementPosition(index) {
        if (index < 0 || index >= this.elementBoxes.length) return { x: 0, y: 0 };
        
        const box = this.elementBoxes[index];
        return {
            x: this.container.x + box.x + this.elementSize / 2,
            y: this.container.y + this.elementHeight / 2
        };
    }

    getVisualWidth() {
        // Total width from start (0) to the right edge of the last cell
        if (!this.values?.length) {
            return this.elementsStartX;
        }
        const elementsEnd = this.elementsStartX + this.values.length * (this.elementSize + this.gap) - this.gap;
        return elementsEnd;
    }

    getVisualHeight() {
        // Element row height + index labels spacing
        return this.elementHeight + 20;
    }

    updateValues(newValues) {
        // Normalize input
        const next = Array.isArray(newValues) ? newValues : [];

        // If length is the same, just update text labels
        if (this.valueTexts.length === next.length && this.valueTexts.length > 0) {
            this.values = next;
            for (let i = 0; i < next.length; i++) {
                this.valueTexts[i].text = String(next[i]);
            }
            return;
        }

        // Otherwise rebuild elements
        this.values = next;

        // Remove old element graphics/text/labels
        for (const box of this.elementBoxes) {
            try { this.container.removeChild(box); } catch {}
            try { box.destroy(); } catch {}
        }
        for (const text of this.valueTexts) {
            try { this.container.removeChild(text); } catch {}
            try { text.destroy(); } catch {}
        }
        for (const label of this.indexLabels) {
            try { this.container.removeChild(label); } catch {}
            try { label.destroy(); } catch {}
        }
        this.elementBoxes = [];
        this.valueTexts = [];
        this.indexLabels = [];
        this.highlightedIndex = -1;

        this._createElements();

        // Move closing bracket
        if (this.closeBracket) {
            this.closeBracket.x = this.elementsStartX + this.values.length * (this.elementSize + this.gap);
        }
    }
}

/**
 * Variable Visual - Represents a variable in memory
 * Compact design: "name = [value]"
 */
export class VariableVisual extends VisualObject {
    constructor(stage, name, value = null) {
        super(stage);
        this.name = name;
        this.value = value;
        this.boxWidth = 70;
        this.boxHeight = 36;
        
        this._createGraphics();
    }

    _createGraphics() {
        this.nameLabel = createText(this.name, {
            fontSize: 15,
            fill: COLORS.variable,
            fontWeight: 'bold'
        });
        this.nameLabel.y = 6;
        this.container.addChild(this.nameLabel);

        this.equalsSign = createText('=', {
            fontSize: 14,
            fill: COLORS.textMuted
        });
        this.equalsSign.x = this.nameLabel.width + 6;
        this.equalsSign.y = 6;
        this.container.addChild(this.equalsSign);

        this.valueBox = new PIXI.Graphics();
        this.valueBox.roundRect(0, 0, this.boxWidth, this.boxHeight, 6);
        this.valueBox.fill(COLORS.bgLight);
        this.valueBox.stroke({ width: 2, color: COLORS.border });
        this.valueBox.x = this.equalsSign.x + 18;
        this.valueBox.y = -3;
        this.container.addChild(this.valueBox);

        this.valueText = createText(this.value !== null ? String(this.value) : '?', {
            fontSize: 16,
            fill: this.value !== null ? COLORS.number : COLORS.textMuted,
            fontWeight: 'bold'
        });
        this.valueText.anchor.set(0.5);
        this.valueText.x = this.valueBox.x + this.boxWidth / 2;
        this.valueText.y = this.boxHeight / 2 - 3;
        this.container.addChild(this.valueText);

        this.glowGraphics = new PIXI.Graphics();
        this.glowGraphics.x = this.valueBox.x;
        this.glowGraphics.y = this.valueBox.y;
        this.glowGraphics.alpha = 0;
        this.container.addChildAt(this.glowGraphics, 0);
    }

    animateAssignment(timeline, newValue, startTime) {
        this.glowGraphics.clear();
        this.glowGraphics.roundRect(-4, -4, this.boxWidth + 8, this.boxHeight + 8, 10);
        this.glowGraphics.fill({ color: COLORS.accent, alpha: 0.5 });

        timeline.to(this.glowGraphics, {
            alpha: 0.8,
            duration: 0.2,
            ease: 'power2.out'
        }, startTime);

        timeline.to(this.glowGraphics, {
            alpha: 0,
            duration: 0.4,
            ease: 'power2.out'
        }, startTime + 0.3);

        timeline.to(this.valueText, {
            pixi: { scale: 1.2 },
            duration: 0.15
        }, startTime + 0.1);

        timeline.call(() => {
            this.value = newValue;
            this.valueText.text = String(newValue);
        }, [], startTime + 0.2);

        timeline.to(this.valueText, {
            pixi: { scale: 1 },
            duration: 0.15,
            ease: 'back.out(2)'
        }, startTime + 0.25);

        timeline.to(this.valueBox, {
            pixi: { tint: COLORS.accent },
            duration: 0.2
        }, startTime + 0.1);

        timeline.to(this.valueBox, {
            pixi: { tint: 0xffffff },
            duration: 0.3
        }, startTime + 0.5);
    }

    animateUpdate(timeline, newValue, startTime) {
        timeline.to(this.valueText, {
            pixi: { scale: 0.8 },
            duration: 0.1
        }, startTime);

        timeline.call(() => {
            this.value = newValue;
            this.valueText.text = String(newValue);
        }, [], startTime + 0.1);

        timeline.to(this.valueText, {
            pixi: { scale: 1 },
            duration: 0.2,
            ease: 'back.out(3)'
        }, startTime + 0.1);
    }
    
    /**
     * Set value instantly (with optional flash effect)
     */
    setValue(newValue, animate = true) {
        this.value = newValue;
        this.valueText.text = String(newValue);
        this.valueText.style.fill = COLORS.number;
        
        if (animate) {
            // Quick flash effect
            gsap.fromTo(this.valueBox, 
                { pixi: { tint: COLORS.accent } },
                { pixi: { tint: 0xffffff }, duration: 0.3 }
            );
            gsap.fromTo(this.valueText.scale,
                { x: 1.2, y: 1.2 },
                { x: 1, y: 1, duration: 0.2, ease: 'back.out(2)' }
            );
        }
    }

    getVisualWidth() {
        // name + " = " + box + padding
        return this.nameLabel.width + 8 + this.equalsSign.width + 20 + this.boxWidth;
    }

    getVisualHeight() {
        return Math.max(this.boxHeight, 54);
    }
}

/**
 * Value Bubble - Animated value transfer
 */
export class ValueBubble extends VisualObject {
    constructor(stage, value) {
        super(stage);
        this.value = value;
        this.size = 48;
        
        this._createGraphics();
    }

    _createGraphics() {
        this.bubble = new PIXI.Graphics();
        this.bubble.circle(0, 0, this.size / 2);
        this.bubble.fill({ color: COLORS.accent });
        this.container.addChild(this.bubble);

        this.valueText = createText(this.value, {
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        this.valueText.anchor.set(0.5);
        this.container.addChild(this.valueText);

        this.trail = new PIXI.Graphics();
        this.container.addChildAt(this.trail, 0);
    }

    animateTransfer(timeline, fromPos, toPos, startTime, duration = 0.6) {
        this.container.x = fromPos.x;
        this.container.y = fromPos.y;
        this.container.alpha = 0;
        this.container.scale.set(0);

        timeline.to(this.container, {
            alpha: 1,
            duration: 0.15,
            ease: 'power2.out'
        }, startTime);

        timeline.to(this.container.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: 'back.out(2)'
        }, startTime);

        const midX = (fromPos.x + toPos.x) / 2;
        const midY = Math.min(fromPos.y, toPos.y) - 40;

        timeline.to(this.container, {
            x: midX,
            y: midY,
            duration: duration * 0.5,
            ease: 'power2.out'
        }, startTime + 0.2);

        timeline.to(this.container, {
            x: toPos.x,
            y: toPos.y,
            duration: duration * 0.5,
            ease: 'power2.in'
        }, startTime + 0.2 + duration * 0.5);

        timeline.to(this.container, {
            alpha: 0,
            duration: 0.15
        }, startTime + 0.2 + duration - 0.1);

        timeline.to(this.container.scale, {
            x: 0,
            y: 0,
            duration: 0.1
        }, startTime + 0.2 + duration - 0.1);
    }
}

/**
 * Comparison Visual - Shows condition evaluation
 */
export class ComparisonVisual extends VisualObject {
    constructor(stage) {
        super(stage);
        this.boxPadding = 10;
        
        this._createGraphics();
    }

    _createGraphics() {
        this.bg = new PIXI.Graphics();
        this.bg.alpha = 1;  // Set to 1, container alpha controls visibility
        this.container.addChild(this.bg);

        this.leftText = createText('', {
            fontSize: 16,
            fill: COLORS.number,
            fontWeight: 'bold'
        });
        this.leftText.x = this.boxPadding;
        this.leftText.y = this.boxPadding;
        this.container.addChild(this.leftText);

        this.operatorText = createText('', {
            fontSize: 16,
            fill: COLORS.keyword,
            fontWeight: 'bold'
        });
        this.container.addChild(this.operatorText);

        this.rightText = createText('', {
            fontSize: 16,
            fill: COLORS.number,
            fontWeight: 'bold'
        });
        this.container.addChild(this.rightText);

        this.resultText = createText('', {
            fontSize: 14,
            fill: COLORS.success,
            fontWeight: 'bold'
        });
        this.resultText.alpha = 0;
        this.container.addChild(this.resultText);
    }

    animateComparison(timeline, left, operator, right, startTime) {
        this.leftText.text = String(left);
        this.operatorText.text = ` ${operator} `;
        this.rightText.text = String(right);

        this.operatorText.x = this.leftText.x + this.leftText.width;
        this.operatorText.y = this.boxPadding;
        this.rightText.x = this.operatorText.x + this.operatorText.width;
        this.rightText.y = this.boxPadding;

        const totalWidth = this.rightText.x + this.rightText.width + this.boxPadding;
        const totalHeight = this.boxPadding * 2 + 24;

        this.bg.clear();
        this.bg.roundRect(0, 0, totalWidth, totalHeight, 8);
        this.bg.fill(COLORS.bgLight);
        this.bg.stroke({ width: 2, color: COLORS.border });

        this.container.alpha = 0;
        this.container.scale.set(0.8);

        timeline.to(this.container, {
            alpha: 1,
            duration: 0.2,
            ease: 'power2.out'
        }, startTime);

        timeline.to(this.container.scale, {
            x: 1,
            y: 1,
            duration: 0.3,
            ease: 'back.out(2)'
        }, startTime);
    }

    animateResult(timeline, result, startTime) {
        this.resultText.text = result ? '→ True ✓' : '→ False ✗';
        this.resultText.style.fill = result ? COLORS.success : COLORS.error;
        this.resultText.x = this.rightText.x + this.rightText.width + 12;
        this.resultText.y = this.boxPadding;

        timeline.to(this.resultText, {
            alpha: 1,
            duration: 0.2,
            ease: 'power2.out'
        }, startTime);

        timeline.to(this.resultText.scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.15
        }, startTime);

        timeline.to(this.resultText.scale, {
            x: 1,
            y: 1,
            duration: 0.15,
            ease: 'back.out(2)'
        }, startTime + 0.15);
    }
    
    /**
     * Set comparison values instantly (for choreography)
     */
    setValues(left, operator, right) {
        this.leftText.text = String(left);
        this.operatorText.text = ` ${operator} `;
        this.rightText.text = String(right);
        
        this.operatorText.x = this.leftText.x + this.leftText.width;
        this.operatorText.y = this.boxPadding;
        this.rightText.x = this.operatorText.x + this.operatorText.width;
        this.rightText.y = this.boxPadding;
        
        const totalWidth = this.rightText.x + this.rightText.width + this.boxPadding;
        const totalHeight = this.boxPadding * 2 + 20;
        
        this.bg.clear();
        this.bg.roundRect(0, 0, totalWidth, totalHeight, 6);
        this.bg.fill(COLORS.bgLight);
        this.bg.stroke({ width: 2, color: COLORS.border });
        
        this.resultText.alpha = 0;
        this.container.alpha = 1;
        this.container.scale.set(1);
    }
    
    /**
     * Show result instantly (for choreography)
     */
    showResult(result) {
        this.resultText.text = result ? '→ True ✓' : '→ False ✗';
        this.resultText.style.fill = result ? COLORS.success : COLORS.error;
        this.resultText.x = this.rightText.x + this.rightText.width + 10;
        this.resultText.y = this.boxPadding;
        
        gsap.to(this.resultText, { alpha: 1, duration: 0.2 });
    }
}

/**
 * Loop Indicator - Shows loop iteration
 */
export class LoopIndicator extends VisualObject {
    constructor(stage) {
        super(stage);
        this.iteration = 0;
        this.size = 40;  // Smaller, more compact
        
        this._createGraphics();
    }

    _createGraphics() {
        this.circle = new PIXI.Graphics();
        this.circle.circle(0, 0, this.size / 2);
        this.circle.fill({ color: COLORS.secondary });
        this.container.addChild(this.circle);

        this.iterText = createText('1', {
            fontSize: 15,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        this.iterText.anchor.set(0.5);
        this.container.addChild(this.iterText);

        this.label = createText('iteration', {
            fontSize: 10,
            fill: COLORS.textMuted
        });
        this.label.anchor.set(0.5, 0);
        this.label.y = this.size / 2 + 3;
        this.container.addChild(this.label);
    }

    animateIteration(timeline, iteration, startTime) {
        timeline.to(this.circle.scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.15
        }, startTime);

        timeline.call(() => {
            this.iteration = iteration;
            this.iterText.text = String(iteration);
        }, [], startTime + 0.15);

        timeline.to(this.circle.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: 'back.out(2)'
        }, startTime + 0.15);
    }
}

/**
 * Return Visual - Shows return value animation
 */
export class ReturnVisual extends VisualObject {
    constructor(stage) {
        super(stage);
        this._createGraphics();
    }

    _createGraphics() {
        this.returnLabel = createText('return', {
            fontSize: 13,
            fill: COLORS.keyword,
            fontWeight: 'bold'
        });
        this.container.addChild(this.returnLabel);

        this.valueBox = new PIXI.Graphics();
        this.valueBox.roundRect(0, 0, 60, 32, 6);
        this.valueBox.fill({ color: COLORS.success });
        this.valueBox.x = this.returnLabel.width + 10;
        this.valueBox.y = -8;
        this.container.addChild(this.valueBox);

        this.valueText = createText('', {
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        this.valueText.anchor.set(0.5);
        this.valueText.x = this.valueBox.x + 30;
        this.valueText.y = 8;
        this.container.addChild(this.valueText);

        this.checkmark = createText('✓', {
            fontSize: 16,
            fill: COLORS.success
        });
        this.checkmark.x = this.valueBox.x + 68;
        this.checkmark.y = -2;
        this.checkmark.alpha = 0;
        this.container.addChild(this.checkmark);
    }

    animateReturn(timeline, value, startTime) {
        this.valueText.text = String(value);
        this.container.alpha = 0;
        this.container.scale.set(0.5);

        timeline.to(this.container, {
            alpha: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, startTime);

        timeline.to(this.container.scale, {
            x: 1,
            y: 1,
            duration: 0.4,
            ease: 'back.out(2)'
        }, startTime);

        timeline.to(this.valueBox.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.2
        }, startTime + 0.3);

        timeline.to(this.valueBox.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: 'back.out(2)'
        }, startTime + 0.5);

        timeline.to(this.checkmark, {
            alpha: 1,
            duration: 0.2
        }, startTime + 0.5);
    }

    /**
     * Set the return value (without full animation)
     */
    setValue(value) {
        console.log('🔙 ReturnVisual.setValue:', value);
        this.valueText.text = String(value ?? '');
    }

    /**
     * Simple animate method for use with primitives
     */
    animate() {
        // Pulse animation on the value box
        gsap.fromTo(this.valueBox.scale, 
            { x: 1, y: 1 },
            { x: 1.1, y: 1.1, duration: 0.2, yoyo: true, repeat: 1 }
        );
        gsap.to(this.checkmark, { alpha: 1, duration: 0.3 });
    }
}

/**
 * Code Highlight - Highlights current line in code
 */
export class CodeHighlight extends VisualObject {
    constructor(stage, lineHeight = 24) {
        super(stage);
        this.lineHeight = lineHeight;
        this.currentLine = -1;
        
        this._createGraphics();
    }

    _createGraphics() {
        this.highlight = new PIXI.Graphics();
        this.highlight.alpha = 0;
        this.container.addChild(this.highlight);
    }

    animateHighlight(timeline, lineNumber, codeWidth, startTime) {
        const y = (lineNumber - 1) * this.lineHeight;
        
        this.highlight.clear();
        this.highlight.roundRect(0, y, codeWidth, this.lineHeight, 4);
        this.highlight.fill({ color: COLORS.accent, alpha: 0.2 });

        timeline.to(this.highlight, {
            alpha: 1,
            duration: 0.2,
            ease: 'power2.out'
        }, startTime);

        this.currentLine = lineNumber;
    }
}
/**
 * Pointer Arrow - Animated connection from variable to array element
 */
export class PointerArrow extends VisualObject {
    constructor(stage) {
        super(stage);
        this.line = null;
        this.arrowHead = null;
        this.label = null;
        
        this._createGraphics();
    }

    _createGraphics() {
        // Line/path
        this.line = new PIXI.Graphics();
        this.container.addChild(this.line);
        
        // Arrow head
        this.arrowHead = new PIXI.Graphics();
        this.container.addChild(this.arrowHead);
        
        // Label showing the variable name
        this.label = createText('', {
            fontSize: 14,
            fill: COLORS.accent,
            fontWeight: 'bold'
        });
        this.label.anchor.set(0.5);
        this.container.addChild(this.label);
        
        this.container.alpha = 0;
    }

    /**
     * Animate pointer from a position to target array element
     */
    animatePointer(timeline, fromPos, toPos, varName, startTime) {
        this.label.text = varName;
        
        // Draw the curved line
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = toPos.y - 50; // Arc above
        
        timeline.call(() => {
            this.line.clear();
            this.arrowHead.clear();
            
            // Draw line with animation effect
            this.line.moveTo(fromPos.x, fromPos.y);
            this.line.quadraticCurveTo(midX, midY, toPos.x, toPos.y - 10);
            this.line.stroke({ width: 3, color: COLORS.accent, alpha: 0.8 });
            
            // Arrow head pointing down
            this.arrowHead.moveTo(toPos.x, toPos.y);
            this.arrowHead.lineTo(toPos.x - 8, toPos.y - 12);
            this.arrowHead.lineTo(toPos.x + 8, toPos.y - 12);
            this.arrowHead.closePath();
            this.arrowHead.fill({ color: COLORS.accent });
            
            // Position label at start
            this.label.x = fromPos.x;
            this.label.y = fromPos.y - 20;
        }, null, startTime);
        
        // Fade in
        timeline.to(this.container, {
            alpha: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, startTime);
        
        // Pulse effect
        timeline.to(this.arrowHead, {
            pixi: { scale: 1.3 },
            duration: 0.15,
            ease: 'power2.out'
        }, startTime + 0.3);
        
        timeline.to(this.arrowHead, {
            pixi: { scale: 1 },
            duration: 0.15,
            ease: 'power2.in'
        }, startTime + 0.45);
    }

    /**
     * Fade out the pointer
     */
    fadeOut(timeline, startTime) {
        timeline.to(this.container, {
            alpha: 0,
            duration: 0.3,
            ease: 'power2.in'
        }, startTime);
    }

    reset() {
        this.line.clear();
        this.arrowHead.clear();
        this.container.alpha = 0;
    }
}

/**
 * State Panel - Left-side panel showing settled variable states
 */
export class StatePanel extends VisualObject {
    constructor(stage, width = 160, height = 400) {
        super(stage);
        this.panelWidth = width;
        this.panelHeight = height;
        this.variables = new Map(); // name -> {text, value, y}
        this.nextY = 40;
        this.rowHeight = 32;
        
        this._createGraphics();
    }

    _createGraphics() {
        // Panel background
        this.bg = new PIXI.Graphics();
        this.bg.roundRect(0, 0, this.panelWidth, this.panelHeight, 12);
        this.bg.fill({ color: COLORS.bg, alpha: 0.7 });
        this.bg.stroke({ width: 1, color: COLORS.border, alpha: 0.5 });
        this.container.addChild(this.bg);
        
        // Header
        this.header = createText('State', {
            fontSize: 14,
            fill: COLORS.textMuted,
            fontWeight: 'bold'
        });
        this.header.x = 12;
        this.header.y = 12;
        this.container.addChild(this.header);
        
        // Divider line
        this.divider = new PIXI.Graphics();
        this.divider.moveTo(10, 32);
        this.divider.lineTo(this.panelWidth - 10, 32);
        this.divider.stroke({ width: 1, color: COLORS.border, alpha: 0.5 });
        this.container.addChild(this.divider);
    }

    /**
     * Add or update a variable in the state panel
     */
    setVariable(name, value, animate = true) {
        console.log('📊 StatePanel.setVariable:', { name, value, hasExisting: this.variables.has(name) });
        
        if (this.variables.has(name)) {
            // Update existing
            const entry = this.variables.get(name);
            const oldValue = entry.valueText.text;
            entry.valueText.text = String(value);
            
            if (animate && oldValue !== String(value)) {
                // Flash effect on change
                gsap.fromTo(entry.valueText, 
                    { pixi: { tint: COLORS.accent } },
                    { pixi: { tint: 0xffffff }, duration: 0.5 }
                );
            }
        } else {
            // Create new entry
            const y = this.nextY;
            
            // Variable name
            const nameText = createText(name + ':', {
                fontSize: 13,
                fill: COLORS.variable
            });
            nameText.x = 12;
            nameText.y = y;
            this.container.addChild(nameText);
            
            // Value
            const valueText = createText(String(value), {
                fontSize: 13,
                fill: COLORS.number,
                fontWeight: 'bold'
            });
            valueText.x = this.panelWidth - 12;
            valueText.anchor.set(1, 0);
            valueText.y = y;
            this.container.addChild(valueText);
            
            this.variables.set(name, {
                nameText,
                valueText,
                y
            });
            
            this.nextY += this.rowHeight;
            
            if (animate) {
                // Slide in animation
                nameText.alpha = 0;
                valueText.alpha = 0;
                gsap.to([nameText, valueText], {
                    alpha: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        }
    }

    /**
     * Clear all variables from the panel
     */
    clear() {
        this.variables.forEach(entry => {
            entry.nameText.destroy();
            entry.valueText.destroy();
        });
        this.variables.clear();
        this.nextY = 40;
    }
}