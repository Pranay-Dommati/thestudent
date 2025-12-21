/**
 * BehaviorLibrary - FINITE SET OF VISUAL BEHAVIORS
 * ================================================
 * 
 * ARCHITECTURE RULE:
 * - These behaviors are TESTED in Dev Mode
 * - Once they look professional, they are LOCKED
 * - Runtime ONLY SELECTS behaviors, never creates them
 * - NO per-code tuning, NO improvisation
 * 
 * Each behavior is:
 * - Self-contained
 * - Deterministic
 * - Professional looking
 * - Tested with dummy values
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';

// ============================================
// CONSTANTS - Tuned once, used everywhere
// ============================================
const COLORS = {
    primary: 0x6366f1,      // Indigo - highlights
    success: 0x22c55e,      // Green - true/success
    error: 0xef4444,        // Red - false/error
    warning: 0xf59e0b,      // Amber - operators
    value: 0x3b82f6,        // Blue - values
    bg: 0x1e293b,           // Dark slate - backgrounds
    text: 0xf8fafc,         // White - text
    muted: 0x64748b         // Gray - muted text
};

const TIMING = {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    pause: 0.3
};

const EASING = {
    out: 'power2.out',
    in: 'power2.in',
    inOut: 'power2.inOut',
    bounce: 'back.out(1.7)'
};

// ============================================
// HELPER: Create styled text
// ============================================
function createText(content, options = {}) {
    const {
        fontSize = 18,
        fill = COLORS.text,
        fontWeight = 'bold'
    } = options;
    
    return new PIXI.Text({
        text: String(content),
        style: new PIXI.TextStyle({
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            fontSize,
            fill,
            fontWeight
        })
    });
}

// ============================================
// HELPER: Create value box (rounded rect with value)
// ============================================
function createValueBox(value, options = {}) {
    const {
        width = 50,
        height = 36,
        bgColor = COLORS.bg,
        textColor = COLORS.text,
        borderColor = COLORS.primary
    } = options;
    
    const container = new PIXI.Container();
    
    // Background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, width, height, 6);
    bg.fill(bgColor);
    bg.stroke({ width: 2, color: borderColor });
    container.addChild(bg);
    
    // Value text
    const text = createText(value, { fontSize: 16, fill: textColor });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;
    container.addChild(text);
    
    container.bg = bg;
    container.text = text;
    
    return container;
}

// ============================================
// BEHAVIOR: VALUE_UPDATE
// ============================================
// Purpose: Show a variable's value changing
// Input: { varName, oldValue, newValue, position }
// ============================================
export function VALUE_UPDATE(layer, params, onComplete) {
    const { varName, oldValue, newValue, position } = params;
    const { x, y } = position;
    
    const tl = gsap.timeline({ onComplete });
    
    // Create value box
    const box = createValueBox(oldValue, { borderColor: COLORS.primary });
    box.x = x;
    box.y = y;
    box.alpha = 1;
    layer.addChild(box);
    
    // Pulse and change value
    tl.to(box.scale, {
        x: 1.15, y: 1.15,
        duration: TIMING.fast,
        ease: EASING.out
    }, 0);
    
    tl.call(() => {
        box.text.text = String(newValue);
        box.bg.clear();
        box.bg.roundRect(0, 0, 50, 36, 6);
        box.bg.fill(COLORS.bg);
        box.bg.stroke({ width: 2, color: COLORS.success });
    }, null, TIMING.fast);
    
    tl.to(box.scale, {
        x: 1, y: 1,
        duration: TIMING.normal,
        ease: EASING.bounce
    }, TIMING.fast);
    
    // Cleanup
    tl.call(() => {
        layer.removeChild(box);
        box.destroy();
    }, null, 1.0);
    
    return tl;
}

// ============================================
// BEHAVIOR: COMPARE
// ============================================
// Purpose: Compare two values, show result
// Input: { left, right, operator, result, position }
// ============================================
export function COMPARE(layer, params, onComplete) {
    const { left, right, operator, result, position } = params;
    const { x, y } = position;
    
    const tl = gsap.timeline({ onComplete });
    
    // Container for entire comparison
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    layer.addChild(container);
    
    // Left value box
    const leftBox = createValueBox(left, { borderColor: COLORS.value });
    leftBox.x = -80;
    leftBox.y = 0;
    leftBox.alpha = 0;
    leftBox.scale.set(0.5);
    container.addChild(leftBox);
    
    // Operator text
    const opText = createText(operator, { fontSize: 22, fill: COLORS.warning });
    opText.anchor.set(0.5);
    opText.x = 0;
    opText.y = 18;
    opText.alpha = 0;
    container.addChild(opText);
    
    // Right value box
    const rightBox = createValueBox(right, { borderColor: COLORS.value });
    rightBox.x = 30;
    rightBox.y = 0;
    rightBox.alpha = 0;
    rightBox.scale.set(0.5);
    container.addChild(rightBox);
    
    // Result text
    const resultColor = result ? COLORS.success : COLORS.error;
    const resultSymbol = result ? 'True ✓' : 'False ✗';
    const resultText = createText(resultSymbol, { fontSize: 14, fill: resultColor });
    resultText.anchor.set(0.5);
    resultText.x = 0;
    resultText.y = 55;
    resultText.alpha = 0;
    container.addChild(resultText);
    
    // Animation sequence
    // 1. Left value slides in
    tl.to(leftBox, { alpha: 1, duration: TIMING.normal, ease: EASING.out }, 0);
    tl.to(leftBox.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.bounce }, 0);
    
    // 2. Right value slides in
    tl.to(rightBox, { alpha: 1, duration: TIMING.normal, ease: EASING.out }, 0.1);
    tl.to(rightBox.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.bounce }, 0.1);
    
    // 3. Operator appears
    tl.to(opText, { alpha: 1, duration: TIMING.fast, ease: EASING.out }, 0.25);
    
    // 4. Brief pause (processing)
    tl.to({}, { duration: TIMING.pause }, 0.4);
    
    // 5. Result appears
    tl.to(resultText, { alpha: 1, duration: TIMING.fast }, 0.7);
    tl.from(resultText.scale, { x: 0.5, y: 0.5, duration: TIMING.normal, ease: EASING.bounce }, 0.7);
    
    // 6. Hold for readability
    tl.to({}, { duration: 0.5 }, 0.9);
    
    // 7. Fade out
    tl.to(container, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, 1.4);
    
    // Cleanup
    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
    }, null, 1.7);
    
    return tl;
}

// ============================================
// BEHAVIOR: ASSIGN_FROM
// ============================================
// Purpose: Transfer value from source to target
// Input: { sourceValue, targetPosition, sourcePosition }
// ============================================
export function ASSIGN_FROM(layer, params, onComplete) {
    const { sourceValue, targetPosition, sourcePosition } = params;
    
    const tl = gsap.timeline({ onComplete });
    
    // Create flying value bubble
    const bubble = createValueBox(sourceValue, { 
        width: 44, 
        height: 32,
        bgColor: COLORS.primary,
        borderColor: COLORS.primary
    });
    bubble.x = sourcePosition.x;
    bubble.y = sourcePosition.y;
    bubble.alpha = 0;
    bubble.scale.set(0.5);
    layer.addChild(bubble);
    
    // 1. Appear at source
    tl.to(bubble, { alpha: 1, duration: TIMING.fast, ease: EASING.out }, 0);
    tl.to(bubble.scale, { x: 1, y: 1, duration: TIMING.fast, ease: EASING.out }, 0);
    
    // 2. Fly to target
    tl.to(bubble, {
        x: targetPosition.x,
        y: targetPosition.y,
        duration: TIMING.slow,
        ease: EASING.inOut
    }, 0.15);
    
    // 3. Land effect (pulse)
    tl.to(bubble.scale, { x: 1.2, y: 1.2, duration: TIMING.fast, ease: EASING.out }, 0.55);
    tl.to(bubble.scale, { x: 1, y: 1, duration: TIMING.fast, ease: EASING.bounce }, 0.7);
    
    // 4. Fade out
    tl.to(bubble, { alpha: 0, duration: TIMING.fast, ease: EASING.in }, 0.9);
    
    // Cleanup
    tl.call(() => {
        layer.removeChild(bubble);
        bubble.destroy({ children: true });
    }, null, 1.1);
    
    return tl;
}

// ============================================
// BEHAVIOR: HIGHLIGHT_ARRAY_INDEX
// ============================================
// Purpose: Highlight a specific array element
// Input: { arrayPosition, index, value, elementWidth }
// ============================================
export function HIGHLIGHT_ARRAY_INDEX(layer, params, onComplete) {
    const { arrayPosition, index, value, elementWidth = 50 } = params;
    const { x, y } = arrayPosition;
    
    const tl = gsap.timeline({ onComplete });
    
    // Calculate element position
    const elementX = x + index * (elementWidth + 6) + elementWidth / 2;
    const elementY = y + 25;
    
    // Highlight ring
    const ring = new PIXI.Graphics();
    ring.circle(0, 0, 30);
    ring.stroke({ width: 3, color: COLORS.primary });
    ring.x = elementX;
    ring.y = elementY;
    ring.alpha = 0;
    ring.scale.set(1.5);
    layer.addChild(ring);
    
    // Index label
    const label = createText(`[${index}]`, { fontSize: 12, fill: COLORS.muted });
    label.anchor.set(0.5);
    label.x = elementX;
    label.y = elementY + 35;
    label.alpha = 0;
    layer.addChild(label);
    
    // 1. Ring appears and contracts
    tl.to(ring, { alpha: 1, duration: TIMING.fast }, 0);
    tl.to(ring.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.out }, 0);
    
    // 2. Index label appears
    tl.to(label, { alpha: 1, duration: TIMING.fast }, 0.2);
    
    // 3. Pulse
    tl.to(ring.scale, { x: 1.1, y: 1.1, duration: TIMING.fast }, 0.4);
    tl.to(ring.scale, { x: 1, y: 1, duration: TIMING.fast, ease: EASING.bounce }, 0.55);
    
    // 4. Hold
    tl.to({}, { duration: 0.3 }, 0.7);
    
    // 5. Fade out
    tl.to([ring, label], { alpha: 0, duration: TIMING.normal }, 1.0);
    
    // Cleanup
    tl.call(() => {
        layer.removeChild(ring);
        layer.removeChild(label);
        ring.destroy();
        label.destroy();
    }, null, 1.3);
    
    return tl;
}

// ============================================
// BEHAVIOR: LOOP_ADVANCE
// ============================================
// Purpose: Show loop iteration advancing
// Input: { iteration, position }
// ============================================
export function LOOP_ADVANCE(layer, params, onComplete) {
    const { iteration, position } = params;
    const { x, y } = position;
    
    const tl = gsap.timeline({ onComplete });
    
    // Circle indicator
    const circle = new PIXI.Graphics();
    circle.circle(0, 0, 22);
    circle.fill(COLORS.primary);
    circle.x = x;
    circle.y = y;
    circle.scale.set(0.8);
    layer.addChild(circle);
    
    // Iteration number
    const numText = createText(iteration, { fontSize: 16 });
    numText.anchor.set(0.5);
    numText.x = x;
    numText.y = y;
    layer.addChild(numText);
    
    // Label
    const label = createText('iteration', { fontSize: 10, fill: COLORS.muted });
    label.anchor.set(0.5);
    label.x = x;
    label.y = y + 30;
    label.alpha = 0;
    layer.addChild(label);
    
    // 1. Pop in
    tl.to(circle.scale, { x: 1.2, y: 1.2, duration: TIMING.fast, ease: EASING.out }, 0);
    tl.to(circle.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.bounce }, TIMING.fast);
    
    // 2. Label appears
    tl.to(label, { alpha: 1, duration: TIMING.fast }, 0.2);
    
    // Keep visible (don't auto-cleanup for loop indicator)
    return tl;
}

// ============================================
// BEHAVIOR: RETURN_VALUE
// ============================================
// Purpose: Show final return value
// Input: { value, position }
// ============================================
export function RETURN_VALUE(layer, params, onComplete) {
    const { value, position } = params;
    const { x, y } = position;
    
    const tl = gsap.timeline({ onComplete });
    
    // Container
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.alpha = 0;
    container.scale.set(0.5);
    layer.addChild(container);
    
    // "return" label
    const returnLabel = createText('return', { fontSize: 14, fill: COLORS.muted });
    container.addChild(returnLabel);
    
    // Value box (green for success)
    const valueBox = createValueBox(value, {
        width: 56,
        height: 32,
        bgColor: COLORS.success,
        borderColor: COLORS.success
    });
    valueBox.x = returnLabel.width + 10;
    valueBox.y = -4;
    container.addChild(valueBox);
    
    // Checkmark
    const check = createText('✓', { fontSize: 18, fill: COLORS.success });
    check.x = valueBox.x + 65;
    check.y = 2;
    check.alpha = 0;
    container.addChild(check);
    
    // 1. Container appears
    tl.to(container, { alpha: 1, duration: TIMING.normal, ease: EASING.out }, 0);
    tl.to(container.scale, { x: 1, y: 1, duration: TIMING.slow, ease: EASING.bounce }, 0);
    
    // 2. Checkmark appears
    tl.to(check, { alpha: 1, duration: TIMING.fast }, 0.4);
    
    // Keep visible (final result)
    return tl;
}

// ============================================
// BEHAVIOR REGISTRY
// ============================================
export const BehaviorRegistry = {
    VALUE_UPDATE,
    COMPARE,
    ASSIGN_FROM,
    HIGHLIGHT_ARRAY_INDEX,
    LOOP_ADVANCE,
    RETURN_VALUE
};

/**
 * Play a behavior by ID
 * @param {string} behaviorId - Behavior identifier
 * @param {PIXI.Container} layer - Layer to render on
 * @param {Object} params - Behavior parameters
 * @param {Function} onComplete - Callback when done
 */
export function playBehavior(behaviorId, layer, params, onComplete) {
    const behavior = BehaviorRegistry[behaviorId];
    if (!behavior) {
        console.warn(`Unknown behavior: ${behaviorId}`);
        onComplete?.();
        return null;
    }
    
    console.log(`🎬 Playing behavior: ${behaviorId}`, params);
    return behavior(layer, params, onComplete);
}

export default BehaviorRegistry;
