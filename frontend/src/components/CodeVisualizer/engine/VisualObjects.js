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
 */
export class VisualObject {
    constructor(stage) {
        this.stage = stage;
        this.container = new PIXI.Container();
        if (stage) {
            this.stage.addChild(this.container);
        }
        this.isVisible = true;
    }

    setPosition(x, y) {
        this.container.x = x;
        this.container.y = y;
        return this;
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
        
        this.elementSize = 72;
        this.gap = 10;
        
        this._createGraphics();
    }

    _createGraphics() {
        // Array name label
        this.nameLabel = createText(this.name, {
            fontSize: 18,
            fill: COLORS.variable,
            fontWeight: 'bold'
        });
        this.nameLabel.y = -30;
        this.container.addChild(this.nameLabel);

        // Equals sign
        this.equalsSign = createText('=', {
            fontSize: 16,
            fill: COLORS.textMuted
        });
        this.equalsSign.x = this.nameLabel.width + 8;
        this.equalsSign.y = -24;
        this.container.addChild(this.equalsSign);

        // Opening bracket
        this.openBracket = createText('[', {
            fontSize: 24,
            fill: COLORS.textMuted
        });
        this.openBracket.x = 0;
        this.openBracket.y = (this.elementSize - 24) / 2;
        this.container.addChild(this.openBracket);

        // Create element boxes
        this._createElements();

        // Closing bracket
        this.closeBracket = createText(']', {
            fontSize: 24,
            fill: COLORS.textMuted
        });
        this.closeBracket.x = 20 + this.values.length * (this.elementSize + this.gap);
        this.closeBracket.y = (this.elementSize - 24) / 2;
        this.container.addChild(this.closeBracket);
    }

    _createElements() {
        this.values.forEach((value, index) => {
            const x = 20 + index * (this.elementSize + this.gap);
            
            // Element box
            const box = new PIXI.Graphics();
            box.roundRect(0, 0, this.elementSize, this.elementSize, 8);
            box.fill(COLORS.bgLight);
            box.stroke({ width: 2, color: COLORS.border });
            box.x = x;
            box.y = 0;
            this.container.addChild(box);
            this.elementBoxes.push(box);

            // Value text
            const valueText = createText(value, {
                fontSize: 22,
                fill: COLORS.text,
                fontWeight: 'bold'
            });
            valueText.anchor.set(0.5);
            valueText.x = x + this.elementSize / 2;
            valueText.y = this.elementSize / 2;
            this.container.addChild(valueText);
            this.valueTexts.push(valueText);

            // Index label (hidden initially)
            const indexLabel = createText(`[${index}]`, {
                fontSize: 12,
                fill: COLORS.textMuted
            });
            indexLabel.anchor.set(0.5, 0);
            indexLabel.x = x + this.elementSize / 2;
            indexLabel.y = this.elementSize + 4;
            indexLabel.alpha = 0;
            this.container.addChild(indexLabel);
            this.indexLabels.push(indexLabel);
        });
    }

    animateShowIndices(timeline, startTime) {
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
        
        timeline.to(box, {
            pixi: { tint: COLORS.accent, scale: 1.1 },
            duration: 0.3,
            ease: 'power2.out'
        }, startTime);

        timeline.to(indexLabel, {
            pixi: { tint: COLORS.accent },
            duration: 0.2
        }, startTime);

        const glow = new PIXI.Graphics();
        glow.roundRect(-4, -4, this.elementSize + 8, this.elementSize + 8, 10);
        glow.fill({ color: COLORS.accent, alpha: 0 });
        glow.x = box.x;
        glow.y = box.y;
        this.container.addChildAt(glow, 0);

        timeline.to(glow, {
            alpha: 0.3,
            duration: 0.3,
            ease: 'power2.out'
        }, startTime);

        this.highlightedIndex = index;
    }

    getElementPosition(index) {
        if (index < 0 || index >= this.elementBoxes.length) return { x: 0, y: 0 };
        
        const box = this.elementBoxes[index];
        return {
            x: this.container.x + box.x + this.elementSize / 2,
            y: this.container.y + this.elementSize / 2
        };
    }

    getVisualWidth() {
        // Approximate total width including brackets and padding.
        // open bracket starts at x=0, elements start at x=20.
        return 20 + this.values.length * (this.elementSize + this.gap) + 32;
    }

    getVisualHeight() {
        // Element row height + index labels spacing
        return this.elementSize + 28;
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
            this.closeBracket.x = 20 + this.values.length * (this.elementSize + this.gap);
        }
    }
}

/**
 * Variable Visual - Represents a variable in memory
 */
export class VariableVisual extends VisualObject {
    constructor(stage, name, value = null) {
        super(stage);
        this.name = name;
        this.value = value;
        this.boxWidth = 130;
        this.boxHeight = 54;
        
        this._createGraphics();
    }

    _createGraphics() {
        this.nameLabel = createText(this.name, {
            fontSize: 18,
            fill: COLORS.variable,
            fontWeight: 'bold'
        });
        this.container.addChild(this.nameLabel);

        this.equalsSign = createText('=', {
            fontSize: 16,
            fill: COLORS.textMuted
        });
        this.equalsSign.x = this.nameLabel.width + 8;
        this.container.addChild(this.equalsSign);

        this.valueBox = new PIXI.Graphics();
        this.valueBox.roundRect(0, 0, this.boxWidth, this.boxHeight, 8);
        this.valueBox.fill(COLORS.bgLight);
        this.valueBox.stroke({ width: 2, color: COLORS.border });
        this.valueBox.x = this.equalsSign.x + 20;
        this.valueBox.y = -12;
        this.container.addChild(this.valueBox);

        this.valueText = createText(this.value !== null ? String(this.value) : '?', {
            fontSize: 20,
            fill: this.value !== null ? COLORS.number : COLORS.textMuted,
            fontWeight: 'bold'
        });
        this.valueText.anchor.set(0.5);
        this.valueText.x = this.valueBox.x + this.boxWidth / 2;
        this.valueText.y = this.boxHeight / 2 - 12;
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
        this.boxPadding = 12;
        
        this._createGraphics();
    }

    _createGraphics() {
        this.bg = new PIXI.Graphics();
        this.bg.alpha = 1;  // Set to 1, container alpha controls visibility
        this.container.addChild(this.bg);

        this.leftText = createText('', {
            fontSize: 18,
            fill: COLORS.number,
            fontWeight: 'bold'
        });
        this.leftText.x = this.boxPadding;
        this.leftText.y = this.boxPadding;
        this.container.addChild(this.leftText);

        this.operatorText = createText('', {
            fontSize: 18,
            fill: COLORS.keyword,
            fontWeight: 'bold'
        });
        this.container.addChild(this.operatorText);

        this.rightText = createText('', {
            fontSize: 18,
            fill: COLORS.number,
            fontWeight: 'bold'
        });
        this.container.addChild(this.rightText);

        this.resultText = createText('', {
            fontSize: 16,
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
}

/**
 * Loop Indicator - Shows loop iteration
 */
export class LoopIndicator extends VisualObject {
    constructor(stage) {
        super(stage);
        this.iteration = 0;
        this.size = 52;
        
        this._createGraphics();
    }

    _createGraphics() {
        this.circle = new PIXI.Graphics();
        this.circle.circle(0, 0, this.size / 2);
        this.circle.fill({ color: COLORS.secondary });
        this.container.addChild(this.circle);

        this.iterText = createText('1', {
            fontSize: 18,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        this.iterText.anchor.set(0.5);
        this.container.addChild(this.iterText);

        this.label = createText('iteration', {
            fontSize: 12,
            fill: COLORS.textMuted
        });
        this.label.anchor.set(0.5, 0);
        this.label.y = this.size / 2 + 4;
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
            fontSize: 14,
            fill: COLORS.keyword,
            fontWeight: 'bold'
        });
        this.container.addChild(this.returnLabel);

        this.valueBox = new PIXI.Graphics();
        this.valueBox.roundRect(0, 0, 80, 40, 8);
        this.valueBox.fill({ color: COLORS.success });
        this.valueBox.x = this.returnLabel.width + 12;
        this.valueBox.y = -10;
        this.container.addChild(this.valueBox);

        this.valueText = createText('', {
            fontSize: 18,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        this.valueText.anchor.set(0.5);
        this.valueText.x = this.valueBox.x + 40;
        this.valueText.y = 10;
        this.container.addChild(this.valueText);

        this.checkmark = createText('✓', {
            fontSize: 20,
            fill: COLORS.success
        });
        this.checkmark.x = this.valueBox.x + 90;
        this.checkmark.y = 0;
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
