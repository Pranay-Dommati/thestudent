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
// Purpose: Show a variable's value changing (old → new)
// Input: { varName, oldValue, newValue, position }
// Visual: Old value slides up & fades, new value slides in from below
// ============================================
export function VALUE_UPDATE(layer, params, onComplete) {
    const { varName = 'x', oldValue, newValue, position } = params;
    const { x, y } = position;

    const tl = gsap.timeline({ onComplete });

    // Container for the variable box
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    layer.addChild(container);

    // Variable name label
    const nameLabel = createText(`${varName}`, { fontSize: 16, fill: COLORS.value });
    nameLabel.anchor.set(1, 0.5);
    nameLabel.x = -30;
    nameLabel.y = 18;
    container.addChild(nameLabel);

    // Equals sign
    const equalsLabel = createText('=', { fontSize: 16, fill: COLORS.text });
    equalsLabel.anchor.set(0.5, 0.5);
    equalsLabel.x = -15;
    equalsLabel.y = 18;
    container.addChild(equalsLabel);

    // Value box background
    const BOX_WIDTH = 56;
    const BOX_HEIGHT = 36;

    const boxBg = new PIXI.Graphics();
    boxBg.roundRect(0, 0, BOX_WIDTH, BOX_HEIGHT, 6);
    boxBg.fill(COLORS.bg);
    boxBg.stroke({ width: 2, color: COLORS.primary });
    container.addChild(boxBg);

    // Mask for value text (clips during animation)
    const mask = new PIXI.Graphics();
    mask.rect(0, 0, BOX_WIDTH, BOX_HEIGHT);
    mask.fill(0xffffff);
    container.addChild(mask);

    // Value container (masked)
    const valueContainer = new PIXI.Container();
    valueContainer.mask = mask;
    container.addChild(valueContainer);

    // Old value text
    const oldText = createText(oldValue, { fontSize: 18, fill: COLORS.text });
    oldText.anchor.set(0.5);
    oldText.x = BOX_WIDTH / 2;
    oldText.y = BOX_HEIGHT / 2;
    valueContainer.addChild(oldText);

    // New value text (starts below, hidden)
    const newText = createText(newValue, { fontSize: 18, fill: COLORS.success });
    newText.anchor.set(0.5);
    newText.x = BOX_WIDTH / 2;
    newText.y = BOX_HEIGHT / 2 + BOX_HEIGHT; // Below the box
    valueContainer.addChild(newText);

    // Animation sequence
    // 1. Fade in container
    container.alpha = 0;
    tl.to(container, { alpha: 1, duration: TIMING.normal, ease: EASING.out }, 0);

    // 2. Brief pause to show old value
    tl.to({}, { duration: 0.3 }, 0.25);

    // 3. Flash border to indicate change coming
    tl.to(boxBg, {
        pixi: { tint: COLORS.warning },
        duration: TIMING.fast
    }, 0.5);

    // 4. Old value slides up and fades
    tl.to(oldText, {
        y: BOX_HEIGHT / 2 - BOX_HEIGHT,
        alpha: 0,
        duration: TIMING.normal,
        ease: EASING.in
    }, 0.6);

    // 5. New value slides up into place
    tl.to(newText, {
        y: BOX_HEIGHT / 2,
        duration: TIMING.normal,
        ease: EASING.out
    }, 0.7);

    // 6. Border turns green for success
    tl.call(() => {
        boxBg.clear();
        boxBg.roundRect(0, 0, BOX_WIDTH, BOX_HEIGHT, 6);
        boxBg.fill(COLORS.bg);
        boxBg.stroke({ width: 2, color: COLORS.success });
    }, null, 0.9);

    // 7. Pulse effect
    tl.to(container.scale, {
        x: 1.08, y: 1.08,
        duration: TIMING.fast,
        ease: EASING.out
    }, 0.9);
    tl.to(container.scale, {
        x: 1, y: 1,
        duration: TIMING.normal,
        ease: EASING.bounce
    }, 1.05);

    // 8. Hold for readability
    tl.to({}, { duration: 0.5 }, 1.2);

    // 9. Fade out
    tl.to(container, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, 1.7);

    // Cleanup
    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
    }, null, 2.0);

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
// BEHAVIOR: ASSIGN_FROM_ARRAY_INDEX
// ============================================
// Purpose: Visualize `varName = arrayName[index]`
// Input: { arrayName, arrayValues, index, varName, oldValue?, position }
// Visual:
//  CINEMATIC ANIMATION SEQUENCE:
//  1. Show expression: "max_val = nums[0]"
//  2. Array name expands INTO array cells in-place, index slides right
//  3. Index bracket animates down to point at the correct cell
//  4. Highlight the target cell with glow effect
//  5. Other cells fade out smoothly
//  6. Highlighted value becomes the result
//  7. Final result: "max_val = 4"
// ============================================
export function ASSIGN_FROM_ARRAY_INDEX(layer, params, onComplete) {
    const {
        arrayName = 'nums',
        arrayValues = [4, 5],
        index = 0,
        varName = 'max_val',
        oldValue = null,
        position
    } = params;

    const { x, y } = position;
    const safeIndex = Math.max(0, Math.min(index, (arrayValues?.length ?? 1) - 1));
    const newValue = Array.isArray(arrayValues) ? arrayValues[safeIndex] : undefined;

    // Don't use onComplete in constructor - we call it manually with position info
    const tl = gsap.timeline();

    // Layout constants
    const CELL_W = 40;
    const CELL_H = 36;
    const GAP = 3;

    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.alpha = 0;
    layer.addChild(container);

    // Calculate array dimensions
    const totalArrayWidth = (arrayValues.length * CELL_W) + ((arrayValues.length - 1) * GAP);

    // ========================================
    // PHASE 1: Initial Expression "varName = arrayName[index]"
    // ========================================
    const expressionContainer = new PIXI.Container();
    expressionContainer.y = 0;
    container.addChild(expressionContainer);

    // Variable name (left side)
    const varNameText = createText(varName, { fontSize: 20, fill: COLORS.value });
    varNameText.anchor.set(1, 0.5);
    varNameText.x = -20;
    varNameText.y = 0;
    expressionContainer.addChild(varNameText);

    // Equals sign
    const equalsText = createText('=', { fontSize: 20, fill: COLORS.text });
    equalsText.anchor.set(0.5, 0.5);
    equalsText.x = -5;
    equalsText.y = 0;
    expressionContainer.addChild(equalsText);

    // Array name (will morph into array) - positioned at start of where array will be
    const arrayStartX = 10;
    const arrayNameText = createText(arrayName, { fontSize: 20, fill: COLORS.primary });
    arrayNameText.anchor.set(0, 0.5);
    arrayNameText.x = arrayStartX;
    arrayNameText.y = 0;
    expressionContainer.addChild(arrayNameText);

    // Index bracket text "[0]" - will slide right then move to pointer position
    // Use center anchor from start for smooth animation
    const indexText = createText(`[${safeIndex}]`, { fontSize: 20, fill: COLORS.warning });
    indexText.anchor.set(0.5, 0.5);
    // Position so it appears right after array name (accounting for center anchor)
    const indexInitialX = arrayStartX + arrayNameText.width + 2 + indexText.width / 2;
    indexText.x = indexInitialX;
    indexText.y = 0;
    expressionContainer.addChild(indexText);

    // ========================================
    // PHASE 2: Array Cells (hidden initially, will appear in place of arrayName)
    // ========================================
    const arrayContainer = new PIXI.Container();
    arrayContainer.x = arrayStartX;
    arrayContainer.y = 0;
    arrayContainer.alpha = 0;
    expressionContainer.addChild(arrayContainer);

    const cells = [];
    for (let i = 0; i < arrayValues.length; i++) {
        const cellContainer = new PIXI.Container();
        cellContainer.x = i * (CELL_W + GAP);
        cellContainer.y = 0;
        cellContainer.alpha = 0;
        cellContainer.scale.set(0.3);
        arrayContainer.addChild(cellContainer);

        // Cell background
        const cellBg = new PIXI.Graphics();
        cellBg.roundRect(0, -CELL_H / 2, CELL_W, CELL_H, 4);
        cellBg.fill(0x1e293b);
        cellBg.stroke({ width: 2, color: 0x475569 });
        cellContainer.addChild(cellBg);

        // Cell value
        const cellText = createText(arrayValues[i], { fontSize: 16, fill: COLORS.text });
        cellText.anchor.set(0.5, 0.5);
        cellText.x = CELL_W / 2;
        cellText.y = 0;
        cellContainer.addChild(cellText);

        cells.push({ container: cellContainer, bg: cellBg, text: cellText });
    }

    // ========================================
    // PHASE 3: Pointer arrow (will appear under index text when it moves)
    // ========================================
    const selectedCell = cells[safeIndex];
    const pointerTargetX = arrayStartX + safeIndex * (CELL_W + GAP) + CELL_W / 2;

    const pointerArrow = new PIXI.Graphics();
    pointerArrow.moveTo(0, 0);
    pointerArrow.lineTo(-5, -8);
    pointerArrow.lineTo(5, -8);
    pointerArrow.closePath();
    pointerArrow.fill(COLORS.warning);
    pointerArrow.alpha = 0;
    pointerArrow.x = pointerTargetX;
    pointerArrow.y = -CELL_H / 2 - 8;
    expressionContainer.addChild(pointerArrow);

    // ========================================
    // PHASE 4: Glow effects for selected cell
    // ========================================
    const glowOuter = new PIXI.Graphics();
    glowOuter.roundRect(-6, -CELL_H / 2 - 6, CELL_W + 12, CELL_H + 12, 8);
    glowOuter.fill({ color: COLORS.primary, alpha: 0.15 });
    glowOuter.alpha = 0;
    selectedCell.container.addChildAt(glowOuter, 0);

    const glowInner = new PIXI.Graphics();
    glowInner.roundRect(-3, -CELL_H / 2 - 3, CELL_W + 6, CELL_H + 6, 6);
    glowInner.fill({ color: COLORS.primary, alpha: 0.25 });
    glowInner.alpha = 0;
    selectedCell.container.addChildAt(glowInner, 1);

    // ========================================
    // PHASE 5: Index labels below cells (appear later)
    // ========================================
    const indexLabels = [];
    for (let i = 0; i < arrayValues.length; i++) {
        const idxLabel = createText(i, { fontSize: 11, fill: COLORS.muted });
        idxLabel.anchor.set(0.5, 0);
        idxLabel.x = i * (CELL_W + GAP) + CELL_W / 2;
        idxLabel.y = CELL_H / 2 + 4;
        idxLabel.alpha = 0;
        arrayContainer.addChild(idxLabel);
        indexLabels.push(idxLabel);
    }

    // ========================================
    // ANIMATION TIMELINE
    // ========================================
    let t = 0;

    // --- STEP 1: Fade in expression ---
    tl.to(container, { alpha: 1, duration: 0.3, ease: 'power2.out' }, t);
    t += 0.6;

    // --- STEP 2: Pulse array name, then transform ---
    tl.to(arrayNameText.scale, { x: 1.1, y: 1.1, duration: 0.12, ease: 'power2.out' }, t);
    tl.to(arrayNameText.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.in' }, t + 0.12);
    t += 0.35;

    // --- STEP 3: Slide index text to the right, fade out array name, show array ---
    // Index slides to end of array (center anchor, so position at center)
    const indexAfterArrayX = arrayStartX + totalArrayWidth + 8 + indexText.width / 2;

    // Slide index to the right smoothly
    tl.to(indexText, { x: indexAfterArrayX, duration: 0.45, ease: 'power2.inOut' }, t);

    // Fade out array name
    tl.to(arrayNameText, { alpha: 0, duration: 0.2, ease: 'power2.in' }, t);

    // Show array container
    tl.to(arrayContainer, { alpha: 1, duration: 0.15 }, t + 0.1);

    // Cells pop in with stagger from left to right
    cells.forEach((cell, i) => {
        const delay = t + 0.1 + i * 0.05;
        tl.to(cell.container, { alpha: 1, duration: 0.15, ease: 'power2.out' }, delay);
        tl.to(cell.container.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(1.5)' }, delay);
    });
    t += 0.15 + cells.length * 0.05 + 0.25;

    // --- STEP 4: Index labels fade in ---
    indexLabels.forEach((label, i) => {
        tl.to(label, { alpha: 1, duration: 0.15, ease: 'power2.out' }, t + i * 0.03);
    });
    t += 0.25;

    // --- STEP 5: Index text moves smoothly to above target cell ---
    // Target position: centered above the selected cell
    const indexTargetX = pointerTargetX;
    const indexTargetY = -CELL_H / 2 - 24;

    // Smooth arc-like movement to above the cell
    tl.to(indexText, {
        x: indexTargetX,
        y: indexTargetY,
        duration: 0.5,
        ease: 'power3.inOut'
    }, t);

    // Scale down as it moves into pointer position
    tl.to(indexText.scale, { x: 0.75, y: 0.75, duration: 0.5, ease: 'power2.inOut' }, t);
    t += 0.55;

    // Show the pointer arrow below the index text
    tl.to(pointerArrow, { alpha: 1, duration: 0.15, ease: 'power2.out' }, t);
    tl.from(pointerArrow.scale, { x: 0.5, y: 0.5, duration: 0.2, ease: 'back.out(2)' }, t);
    t += 0.25;

    // --- STEP 6: Highlight selected cell with glow ---
    tl.to(glowOuter, { alpha: 1, duration: 0.2, ease: 'power2.out' }, t);
    tl.to(glowInner, { alpha: 1, duration: 0.2, ease: 'power2.out' }, t + 0.05);

    // Pulse the selected cell
    tl.to(selectedCell.container.scale, { x: 1.12, y: 1.12, duration: 0.15, ease: 'power2.out' }, t);
    tl.to(selectedCell.container.scale, { x: 1.05, y: 1.05, duration: 0.15, ease: 'power2.inOut' }, t + 0.15);

    // Change cell to highlighted state
    tl.call(() => {
        selectedCell.bg.clear();
        selectedCell.bg.roundRect(0, -CELL_H / 2, CELL_W, CELL_H, 4);
        selectedCell.bg.fill(COLORS.primary);
        selectedCell.bg.stroke({ width: 2, color: COLORS.primary });
        selectedCell.text.style.fill = 0xffffff;
    }, null, t + 0.1);
    t += 0.45;

    // --- STEP 7: Other cells and decorations fade out ---
    // Fade out non-selected cells
    cells.forEach((cell, i) => {
        if (i !== safeIndex) {
            const dir = i < safeIndex ? -1 : 1;
            tl.to(cell.container, {
                alpha: 0,
                x: cell.container.x + dir * 20,
                duration: 0.3,
                ease: 'power2.in'
            }, t);
        }
    });

    // Fade out index text and pointer arrow
    tl.to(indexText, { alpha: 0, y: indexText.y - 10, duration: 0.25, ease: 'power2.in' }, t);
    tl.to(pointerArrow, { alpha: 0, duration: 0.2, ease: 'power2.in' }, t);

    // Fade out index labels
    indexLabels.forEach(label => {
        tl.to(label, { alpha: 0, duration: 0.2, ease: 'power2.in' }, t);
    });

    // Fade out varName and equals temporarily
    tl.to([varNameText, equalsText], { alpha: 0.3, duration: 0.2, ease: 'power2.in' }, t);
    t += 0.35;

    // --- STEP 8: Selected cell moves to result position ---
    // Calculate where the value box should end up (right after equals)
    const resultX = 10;
    const cellCurrentGlobalX = arrayStartX + safeIndex * (CELL_W + GAP);
    const moveX = resultX - cellCurrentGlobalX;

    tl.to(selectedCell.container, {
        x: selectedCell.container.x + moveX,
        duration: 0.4,
        ease: 'power2.inOut'
    }, t);

    // Bring back varName and equals
    tl.to([varNameText, equalsText], { alpha: 1, duration: 0.25, ease: 'power2.out' }, t + 0.15);
    t += 0.45;

    // --- STEP 9: Transform to final result state ---
    tl.call(() => {
        // Change border to success color
        selectedCell.bg.clear();
        selectedCell.bg.roundRect(0, -CELL_H / 2, CELL_W, CELL_H, 4);
        selectedCell.bg.fill(COLORS.bg);
        selectedCell.bg.stroke({ width: 2, color: COLORS.success });
        selectedCell.text.style.fill = COLORS.success;

        // Hide glows
        glowOuter.alpha = 0;
        glowInner.alpha = 0;
    }, null, t);

    // Success pulse
    tl.to(selectedCell.container.scale, { x: 1.15, y: 1.15, duration: 0.12, ease: 'power2.out' }, t);
    tl.to(selectedCell.container.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(2)' }, t + 0.12);
    t += 0.5;

    // --- STEP 10: Hold briefly at final state (NO FADE OUT) ---
    // The VariableVisual will be created at this exact position to take over
    tl.to({}, { duration: 0.2 }, t);
    t += 0.2;

    // Calculate the EXACT final global position of the result for handoff
    // This is relative to the container's position at (x, y)
    // varNameText.x is -20 (anchored right at 1, 0.5)
    // The overall container x is 'x' from params
    // So final position of expression is approximately at container x + small offset
    const finalResultInfo = {
        x: x - 20,  // Approximate center of "varName = [value]"
        y: y,
        value: newValue,
        varName: varName
    };

    // --- Cleanup: Destroy instantly (VariableVisual has taken over) ---
    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
        // Call onComplete with final position info for seamless handoff
        if (typeof onComplete === 'function') {
            onComplete(finalResultInfo);
        }
    }, null, t);

    return tl;
}

// ============================================
// BEHAVIOR: HIGHLIGHT_ARRAY_INDEX
// ============================================
// Purpose: Show array with all indexes, highlight specific element
// Input: { arrayName, arrayValues, index, position }
// Visual: Array boxes in a row, index labels below, highlight border on selected
// ============================================
export function HIGHLIGHT_ARRAY_INDEX(layer, params, onComplete) {
    const { arrayName = 'a', arrayValues = [5, 6, 10, 13, 56, 76, 1, 2, 4, 8], index, position } = params;
    const { x, y } = position;

    const tl = gsap.timeline({ onComplete });

    // Layout constants
    const CELL_WIDTH = 44;
    const CELL_HEIGHT = 40;
    const CELL_GAP = 2;
    const BORDER_WIDTH = 2;

    // Container for entire array
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.alpha = 0;
    layer.addChild(container);

    // Array name label (left side)
    const nameLabel = createText(arrayName, { fontSize: 18, fill: COLORS.text });
    nameLabel.anchor.set(1, 0.5);
    nameLabel.x = -15;
    nameLabel.y = CELL_HEIGHT / 2;
    container.addChild(nameLabel);

    // Calculate total width to center
    const totalWidth = arrayValues.length * (CELL_WIDTH + CELL_GAP) - CELL_GAP;
    const startX = -totalWidth / 2 + CELL_WIDTH / 2;

    // Create cells
    const cells = [];
    arrayValues.forEach((value, i) => {
        const cellX = startX + i * (CELL_WIDTH + CELL_GAP);

        // Cell background
        const cellBg = new PIXI.Graphics();
        cellBg.roundRect(0, 0, CELL_WIDTH, CELL_HEIGHT, 2);
        cellBg.fill(0x1e293b);
        cellBg.stroke({ width: BORDER_WIDTH, color: 0x475569 });
        cellBg.x = cellX - CELL_WIDTH / 2;
        cellBg.y = 0;
        container.addChild(cellBg);

        // Value text
        const valueText = createText(value, { fontSize: 16, fill: COLORS.text });
        valueText.anchor.set(0.5);
        valueText.x = cellX;
        valueText.y = CELL_HEIGHT / 2;
        container.addChild(valueText);

        // Index label below
        const indexLabel = createText(i, { fontSize: 11, fill: COLORS.muted });
        indexLabel.anchor.set(0.5);
        indexLabel.x = cellX;
        indexLabel.y = CELL_HEIGHT + 12;
        indexLabel.alpha = 0;
        container.addChild(indexLabel);

        cells.push({ bg: cellBg, value: valueText, indexLabel, x: cellX });
    });

    // Highlight border (will animate onto selected cell)
    const highlight = new PIXI.Graphics();
    highlight.roundRect(0, 0, CELL_WIDTH + 4, CELL_HEIGHT + 4, 3);
    highlight.stroke({ width: 3, color: COLORS.primary });
    highlight.x = startX + index * (CELL_WIDTH + CELL_GAP) - CELL_WIDTH / 2 - 2;
    highlight.y = -2;
    highlight.alpha = 0;
    container.addChild(highlight);

    // Pointer arrow above highlighted cell
    const pointer = new PIXI.Graphics();
    pointer.moveTo(0, 0);
    pointer.lineTo(-8, -12);
    pointer.lineTo(8, -12);
    pointer.closePath();
    pointer.fill(COLORS.primary);
    pointer.x = cells[index].x;
    pointer.y = -8;
    pointer.alpha = 0;
    container.addChild(pointer);

    // Animation sequence
    // 1. Fade in array
    tl.to(container, { alpha: 1, duration: TIMING.normal, ease: EASING.out }, 0);

    // 2. Show all index labels
    const indexLabels = cells.map(c => c.indexLabel);
    tl.to(indexLabels, { alpha: 1, duration: TIMING.fast, stagger: 0.02 }, 0.2);

    // 3. Highlight border appears
    tl.to(highlight, { alpha: 1, duration: TIMING.fast, ease: EASING.out }, 0.4);
    tl.from(highlight.scale, { x: 1.2, y: 1.2, duration: TIMING.normal, ease: EASING.bounce }, 0.4);

    // 4. Pointer appears
    tl.to(pointer, { alpha: 1, duration: TIMING.fast }, 0.5);
    tl.from(pointer, { y: -20, duration: TIMING.normal, ease: EASING.bounce }, 0.5);

    // 5. Pulse highlight
    tl.to(highlight, { alpha: 0.6, duration: 0.15, yoyo: true, repeat: 1 }, 0.8);

    // 6. Hold for readability
    tl.to({}, { duration: 0.6 }, 1.0);

    // 7. Fade out
    tl.to(container, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, 1.6);

    // Cleanup
    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
    }, null, 1.9);

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
// BEHAVIOR: FOR_LOOP_ITERATION
// ============================================
// Purpose: Visualize `for n in nums:` loop iteration
// Input: { 
//     loopVar: 'n',
//     arrayName: 'nums', 
//     arrayValues: [5, 3, 8, 2],
//     currentIndex: 0,
//     previousIndex: null (or number for smooth transition),
//     iteration: 1,
//     position 
// }
// Visual:
//   1. Show array with name: "nums = [5] [3] [8] [2]"
//                              0   1   2   3
//   2. Show loop variable "n" above the current element with arrow pointer
//   3. Highlight the current element
//   4. If previousIndex exists, animate smooth transition from previous to current
// ============================================
export function FOR_LOOP_ITERATION(layer, params, onComplete) {
    const {
        loopVar = 'n',
        arrayName = 'nums',
        arrayValues = [5, 3, 8, 2],
        currentIndex = 0,
        previousIndex = null,
        iteration = 1,
        position
    } = params;

    const { x, y } = position;
    const safeCurrentIndex = Math.max(0, Math.min(currentIndex, (arrayValues?.length ?? 1) - 1));
    const hasPreviousIndex = previousIndex !== null && previousIndex !== undefined;
    const safePreviousIndex = hasPreviousIndex ? Math.max(0, Math.min(previousIndex, (arrayValues?.length ?? 1) - 1)) : null;
    const currentValue = Array.isArray(arrayValues) ? arrayValues[safeCurrentIndex] : undefined;

    const tl = gsap.timeline({ onComplete });

    // Layout constants
    const CELL_W = 44;
    const CELL_H = 40;
    const GAP = 3;
    const TOTAL_ARRAY_WIDTH = arrayValues.length * (CELL_W + GAP) - GAP;

    // Container for everything
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.alpha = 0;
    layer.addChild(container);

    // ========================================
    // ARRAY SECTION: "arrayName = [values]"
    // ========================================
    const arraySection = new PIXI.Container();
    arraySection.y = 20; // Offset down so pointer has room above
    container.addChild(arraySection);

    // Array name label
    const arrayLabel = createText(`${arrayName}`, { fontSize: 16, fill: COLORS.value });
    arrayLabel.anchor.set(1, 0.5);
    arrayLabel.x = -15;
    arrayLabel.y = CELL_H / 2;
    arraySection.addChild(arrayLabel);

    // Equals sign
    const equalsSign = createText('=', { fontSize: 16, fill: COLORS.text });
    equalsSign.anchor.set(0.5);
    equalsSign.x = 0;
    equalsSign.y = CELL_H / 2;
    arraySection.addChild(equalsSign);

    // Array cells starting position
    const cellsStartX = 15;

    // Create array cells
    const cells = [];
    for (let i = 0; i < arrayValues.length; i++) {
        const cellX = cellsStartX + i * (CELL_W + GAP);

        // Cell background
        const cellBg = new PIXI.Graphics();
        cellBg.roundRect(0, 0, CELL_W, CELL_H, 4);
        cellBg.fill(COLORS.bg);
        cellBg.stroke({ width: 2, color: i === safeCurrentIndex ? COLORS.primary : 0x475569 });
        cellBg.x = cellX;
        cellBg.y = 0;
        arraySection.addChild(cellBg);

        // Cell value
        const cellText = createText(arrayValues[i], { fontSize: 16, fill: COLORS.text });
        cellText.anchor.set(0.5);
        cellText.x = cellX + CELL_W / 2;
        cellText.y = CELL_H / 2;
        arraySection.addChild(cellText);

        // Index label below
        const indexLabel = createText(i, { fontSize: 11, fill: COLORS.muted });
        indexLabel.anchor.set(0.5);
        indexLabel.x = cellX + CELL_W / 2;
        indexLabel.y = CELL_H + 14;
        indexLabel.alpha = 0;
        arraySection.addChild(indexLabel);

        cells.push({ bg: cellBg, text: cellText, indexLabel, x: cellX, index: i });
    }

    // ========================================
    // LOOP VARIABLE WITH POINTER: "n ▼"
    // ========================================
    const pointerSection = new PIXI.Container();
    container.addChild(pointerSection);

    // Get the X position of current cell
    const getCurrentCellX = (index) => cellsStartX + index * (CELL_W + GAP) + CELL_W / 2;

    // Starting position (either previous or current)
    const startPosX = hasPreviousIndex ? getCurrentCellX(safePreviousIndex) : getCurrentCellX(safeCurrentIndex);
    const targetPosX = getCurrentCellX(safeCurrentIndex);

    pointerSection.x = startPosX;
    pointerSection.y = 15; // Positioned right above the array cells

    // Loop variable name acts as the indicator
    const varText = createText(loopVar, {
        fontSize: 24,
        fill: COLORS.warning,
        fontWeight: '900'
    });
    varText.anchor.set(0.5, 1); // Anchor bottom-center
    varText.y = 0;
    pointerSection.addChild(varText);

    // NOTE: Iteration badge is now managed by PixiRenderer as a persistent element
    // It stays visible during the entire loop execution

    // ========================================
    // HIGHLIGHT GLOW for current cell
    // ========================================
    const highlightGlow = new PIXI.Graphics();
    highlightGlow.roundRect(-4, -4, CELL_W + 8, CELL_H + 8, 6);
    highlightGlow.fill({ color: COLORS.primary, alpha: 0.2 });
    highlightGlow.x = cellsStartX + safeCurrentIndex * (CELL_W + GAP);
    highlightGlow.y = 0;
    highlightGlow.alpha = 0;
    arraySection.addChildAt(highlightGlow, 0);

    // ========================================
    // ANIMATION TIMELINE
    // ========================================
    let t = 0;

    if (hasPreviousIndex) {
        // --- CONTINUATION: Smooth transition from previous to current ---

        // Show container immediately (already visible from previous)
        tl.to(container, { alpha: 1, duration: 0.1 }, t);
        t += 0.1;

        // Update the previous cell border to normal
        const prevCell = cells[safePreviousIndex];
        tl.call(() => {
            prevCell.bg.clear();
            prevCell.bg.roundRect(0, 0, CELL_W, CELL_H, 4);
            prevCell.bg.fill(COLORS.bg);
            prevCell.bg.stroke({ width: 2, color: 0x475569 });
        }, null, t);

        // Move glow to new position
        tl.to(highlightGlow, {
            x: cellsStartX + safeCurrentIndex * (CELL_W + GAP),
            duration: 0.35,
            ease: 'power2.inOut'
        }, t);

        // Smoothly slide pointer to new position
        tl.to(pointerSection, {
            x: targetPosX,
            duration: 0.4,
            ease: 'power2.inOut'
        }, t);

        // Variable name stays the same (just the loopVar)
        // No need to update text since it's just the variable name

        t += 0.4;

        // Highlight new cell
        const currCell = cells[safeCurrentIndex];
        tl.call(() => {
            currCell.bg.clear();
            currCell.bg.roundRect(0, 0, CELL_W, CELL_H, 4);
            currCell.bg.fill(COLORS.bg);
            currCell.bg.stroke({ width: 2, color: COLORS.primary });
        }, null, t);

        // Pulse glow
        tl.to(highlightGlow, { alpha: 1, duration: 0.15 }, t);
        tl.to(highlightGlow, { alpha: 0.5, duration: 0.15 }, t + 0.15);
        t += 0.3;



    } else {
        // --- FIRST ITERATION: Full intro animation ---

        // Fade in container
        tl.to(container, { alpha: 1, duration: 0.25, ease: 'power2.out' }, t);

        t += 0.3;

        // Show index labels with stagger
        cells.forEach((cell, i) => {
            tl.to(cell.indexLabel, { alpha: 1, duration: 0.15, ease: 'power2.out' }, t + i * 0.03);
        });
        t += 0.15 + cells.length * 0.03;

        // Pointer drops in from above
        tl.from(pointerSection, { y: -60, duration: 0.3, ease: 'back.out(1.5)' }, t);
        t += 0.3;

        // Glow appears on current cell
        tl.to(highlightGlow, { alpha: 0.7, duration: 0.2, ease: 'power2.out' }, t);

        // Pulse the current cell
        const currCell = cells[safeCurrentIndex];
        tl.to(currCell.bg.scale || currCell.bg, {
            pixi: { scaleX: 1.05, scaleY: 1.05 },
            duration: 0.1,
            ease: 'power2.out'
        }, t);
        tl.to(currCell.bg.scale || currCell.bg, {
            pixi: { scaleX: 1, scaleY: 1 },
            duration: 0.15,
            ease: 'back.out(2)'
        }, t + 0.1);
        t += 0.25;

        // Glow settles
        tl.to(highlightGlow, { alpha: 0.4, duration: 0.2 }, t);
        t += 0.2;
    }

    // --- NEW: Cinematic Value Extraction ---
    // A value box pops out of the current cell and merges with the pointerSection (the variable 'n')
    const extractionContainer = new PIXI.Container();
    extractionContainer.x = cellsStartX + safeCurrentIndex * (CELL_W + GAP) + CELL_W / 2;
    extractionContainer.y = CELL_H / 2;
    extractionContainer.alpha = 0;
    extractionContainer.scale.set(0.5);
    arraySection.addChild(extractionContainer);

    const valBox = createValueBox(currentValue, {
        width: CELL_W - 4,
        height: CELL_H - 4,
        bgColor: COLORS.primary,
        borderColor: COLORS.primary
    });
    valBox.x = - (CELL_W - 4) / 2;
    valBox.y = - (CELL_H - 4) / 2;
    extractionContainer.addChild(valBox);

    // Extraction animation
    tl.to(extractionContainer, { alpha: 1, duration: 0.2, ease: 'power2.out' }, t);
    tl.to(extractionContainer.scale, { x: 1.2, y: 1.2, duration: 0.25, ease: 'back.out(2)' }, t);
    t += 0.3;

    // Move extracted value to meet the variable name
    // The pointerSection is at y=15 relative to container. ArraySection is at y=20.
    // So target Y is approximately -5 or so relative to arraySection
    tl.to(extractionContainer, {
        x: targetPosX,
        y: -15, // Move up to meeting point
        alpha: 0.8,
        duration: 0.4,
        ease: 'power3.inOut'
    }, t);
    tl.to(extractionContainer.scale, { x: 0.6, y: 0.6, duration: 0.4 }, t);

    // Pointer pulses as it receives the value
    tl.to(pointerSection.scale, { x: 1.2, y: 1.2, duration: 0.2, ease: 'power2.out' }, t + 0.2);
    t += 0.4;

    // Show combined "n = value" state
    tl.call(() => {
        varText.text = `${loopVar} = ${currentValue}`;
        extractionContainer.visible = false;
    }, null, t);
    tl.to(pointerSection.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(2)' }, t);
    t += 0.3;

    // --- Hold for readability ---
    tl.to({}, { duration: 0.5 }, t);
    t += 0.5;

    // Position for handoff
    const finalResultInfo = {
        x: x + targetPosX - (varText.width / 2),
        y: y + 15 - varText.height, // Position of n=value
        value: currentValue,
        varName: loopVar
    };

    // --- Cleanup: Destroy instantly (VariableVisual will take over) ---
    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
        if (typeof onComplete === 'function') {
            onComplete(finalResultInfo);
        }
    }, null, t);

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
// BEHAVIOR: ASSIGN_FROM_VARIABLE (GOLD STANDARD)
// ============================================
// Purpose: Visualize `y = x` (variable to variable copy)
// CINEMATIC ANIMATION SEQUENCE:
//  1. Show expression: "y = x"
//  2. Highlight source variable
//  3. Value bubble rises from source
//  4. Value bubble travels in arc to target position
//  5. Value lands with glow effect
//  6. Result: "y = [value]"
// ============================================
export function ASSIGN_FROM_VARIABLE(layer, params, onComplete) {
    const {
        sourceVarName = 'x',
        sourceValue = 5,
        targetVarName = 'y',
        oldValue = null,
        position
    } = params;

    const { x, y } = position;
    const tl = gsap.timeline();

    // Layout constants
    const BOX_W = 50;
    const BOX_H = 36;

    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.alpha = 0;
    layer.addChild(container);

    // ========================================
    // PHASE 1: Show expression "targetVar = sourceVar"
    // ========================================
    const expressionContainer = new PIXI.Container();
    container.addChild(expressionContainer);

    // Target variable name (left side)
    const targetText = createText(targetVarName, { fontSize: 20, fill: COLORS.value });
    targetText.anchor.set(1, 0.5);
    targetText.x = -20;
    targetText.y = 0;
    expressionContainer.addChild(targetText);

    // Equals sign
    const equalsText = createText('=', { fontSize: 20, fill: COLORS.text });
    equalsText.anchor.set(0.5, 0.5);
    equalsText.x = -5;
    equalsText.y = 0;
    expressionContainer.addChild(equalsText);

    // Source variable name (will be replaced by value)
    const sourceText = createText(sourceVarName, { fontSize: 20, fill: COLORS.primary });
    sourceText.anchor.set(0, 0.5);
    sourceText.x = 10;
    sourceText.y = 0;
    expressionContainer.addChild(sourceText);

    // ========================================
    // PHASE 2: Value box (hidden initially, appears after source highlight)
    // ========================================
    const valueBox = createValueBox(sourceValue, {
        width: BOX_W,
        height: BOX_H,
        borderColor: COLORS.primary
    });
    valueBox.x = 10;
    valueBox.y = -BOX_H / 2;
    valueBox.alpha = 0;
    valueBox.scale.set(0.5);
    expressionContainer.addChild(valueBox);

    // ========================================
    // PHASE 3: Glow effect for landing
    // ========================================
    const glowOuter = new PIXI.Graphics();
    glowOuter.roundRect(-6, -BOX_H / 2 - 6, BOX_W + 12, BOX_H + 12, 10);
    glowOuter.fill({ color: COLORS.primary, alpha: 0.2 });
    glowOuter.x = 10;
    glowOuter.y = 0;
    glowOuter.alpha = 0;
    expressionContainer.addChildAt(glowOuter, 0);

    // ========================================
    // ANIMATION TIMELINE
    // ========================================
    let t = 0;

    // --- STEP 1: Fade in expression ---
    tl.to(container, { alpha: 1, duration: 0.3, ease: 'power2.out' }, t);
    t += 0.5;

    // --- STEP 2: Pulse source variable name ---
    tl.to(sourceText.scale, { x: 1.15, y: 1.15, duration: 0.12, ease: 'power2.out' }, t);
    tl.to(sourceText.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.in' }, t + 0.12);
    t += 0.35;

    // --- STEP 3: Source name fades, value box rises up ---
    tl.to(sourceText, { alpha: 0, y: -15, duration: 0.25, ease: 'power2.in' }, t);
    tl.to(valueBox, { alpha: 1, duration: 0.2, ease: 'power2.out' }, t + 0.15);
    tl.to(valueBox.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(1.5)' }, t + 0.15);
    t += 0.5;

    // --- STEP 4: Value box rises up in arc (showing extraction) ---
    tl.to(valueBox, { y: -BOX_H / 2 - 30, duration: 0.3, ease: 'power2.out' }, t);
    t += 0.35;

    // --- STEP 5: Value travels back down to position ---
    tl.to(valueBox, { y: -BOX_H / 2, duration: 0.25, ease: 'power2.in' }, t);
    t += 0.3;

    // --- STEP 6: Glow effect on landing ---
    tl.to(glowOuter, { alpha: 1, duration: 0.15, ease: 'power2.out' }, t);
    tl.to(valueBox.scale, { x: 1.1, y: 1.1, duration: 0.1, ease: 'power2.out' }, t);
    tl.to(valueBox.scale, { x: 1, y: 1, duration: 0.15, ease: 'back.out(2)' }, t + 0.1);
    t += 0.3;

    // --- STEP 7: Transform to success state ---
    tl.call(() => {
        valueBox.bg.clear();
        valueBox.bg.roundRect(0, 0, BOX_W, BOX_H, 6);
        valueBox.bg.fill(COLORS.bg);
        valueBox.bg.stroke({ width: 2, color: COLORS.success });
        valueBox.text.style.fill = COLORS.success;
        glowOuter.alpha = 0;
    }, null, t);
    t += 0.2;

    // --- STEP 8: Success pulse ---
    tl.to(valueBox.scale, { x: 1.12, y: 1.12, duration: 0.1, ease: 'power2.out' }, t);
    tl.to(valueBox.scale, { x: 1, y: 1, duration: 0.15, ease: 'back.out(2)' }, t + 0.1);
    t += 0.4;

    // --- STEP 9: Hold briefly ---
    tl.to({}, { duration: 0.2 }, t);
    t += 0.2;

    // --- Cleanup ---
    const finalResultInfo = {
        x: x - 20,
        y: y,
        value: sourceValue,
        varName: targetVarName
    };

    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
        if (typeof onComplete === 'function') {
            onComplete(finalResultInfo);
        }
    }, null, t);

    return tl;
}

// ============================================
// BEHAVIOR: ASSIGN_BINARY_OPERATION (GOLD STANDARD)
// ============================================
// Purpose: Visualize `result = a + b` (or -, *, /, %)
// CINEMATIC ANIMATION SEQUENCE:
//  1. Show expression: "result = a + b"
//  2. Variable names transform into their values
//  3. Values fly toward operator in center
//  4. Operator glows, computation "spark" effect
//  5. Result value emerges from computation
//  6. Final result: "result = [computed value]"
// ============================================
export function ASSIGN_BINARY_OPERATION(layer, params, onComplete) {
    const {
        targetVarName = 'result',
        leftVarName = 'a',
        leftValue = 3,
        rightVarName = 'b',
        rightValue = 5,
        operator = '+',
        resultValue = 8,
        position
    } = params;

    const { x, y } = position;
    const tl = gsap.timeline();

    // Layout constants
    const BOX_W = 44;
    const BOX_H = 34;

    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.alpha = 0;
    layer.addChild(container);

    // ========================================
    // PHASE 1: Expression "target = left op right"
    // ========================================
    const expressionContainer = new PIXI.Container();
    container.addChild(expressionContainer);

    // Target variable name
    const targetText = createText(targetVarName, { fontSize: 18, fill: COLORS.value });
    targetText.anchor.set(1, 0.5);
    targetText.x = -30;
    targetText.y = 0;
    expressionContainer.addChild(targetText);

    // Equals sign (assignment)
    const assignEquals = createText('=', { fontSize: 18, fill: COLORS.text });
    assignEquals.anchor.set(0.5, 0.5);
    assignEquals.x = -15;
    assignEquals.y = 0;
    expressionContainer.addChild(assignEquals);

    // Left operand name → will become value
    const leftText = createText(leftVarName, { fontSize: 18, fill: COLORS.primary });
    leftText.anchor.set(0.5, 0.5);
    leftText.x = 15;
    leftText.y = 0;
    expressionContainer.addChild(leftText);

    // Operator
    const opText = createText(operator, { fontSize: 20, fill: COLORS.warning });
    opText.anchor.set(0.5, 0.5);
    opText.x = 45;
    opText.y = 0;
    expressionContainer.addChild(opText);

    // Right operand name → will become value
    const rightText = createText(rightVarName, { fontSize: 18, fill: COLORS.primary });
    rightText.anchor.set(0.5, 0.5);
    rightText.x = 75;
    rightText.y = 0;
    expressionContainer.addChild(rightText);

    // ========================================
    // PHASE 2: Value boxes (hidden initially)
    // ========================================
    const leftBox = createValueBox(leftValue, {
        width: BOX_W,
        height: BOX_H,
        borderColor: COLORS.primary
    });
    leftBox.x = 15 - BOX_W / 2;
    leftBox.y = -BOX_H / 2;
    leftBox.alpha = 0;
    leftBox.scale.set(0.3);
    expressionContainer.addChild(leftBox);

    const rightBox = createValueBox(rightValue, {
        width: BOX_W,
        height: BOX_H,
        borderColor: COLORS.primary
    });
    rightBox.x = 75 - BOX_W / 2;
    rightBox.y = -BOX_H / 2;
    rightBox.alpha = 0;
    rightBox.scale.set(0.3);
    expressionContainer.addChild(rightBox);

    // Result box (appears after computation)
    const resultBox = createValueBox(resultValue, {
        width: BOX_W + 6,
        height: BOX_H,
        borderColor: COLORS.success,
        bgColor: COLORS.bg
    });
    resultBox.x = 45 - (BOX_W + 6) / 2;
    resultBox.y = -BOX_H / 2;
    resultBox.alpha = 0;
    resultBox.scale.set(0);
    expressionContainer.addChild(resultBox);

    // Computation spark (center glow)
    const spark = new PIXI.Graphics();
    spark.circle(0, 0, 25);
    spark.fill({ color: COLORS.warning, alpha: 0.5 });
    spark.x = 45;
    spark.y = 0;
    spark.alpha = 0;
    spark.scale.set(0.3);
    expressionContainer.addChild(spark);

    // ========================================
    // ANIMATION TIMELINE
    // ========================================
    let t = 0;

    // --- STEP 1: Fade in expression ---
    tl.to(container, { alpha: 1, duration: 0.3, ease: 'power2.out' }, t);
    t += 0.5;

    // --- STEP 2: Pulse operand names ---
    tl.to([leftText.scale, rightText.scale], {
        x: 1.1, y: 1.1,
        duration: 0.15,
        ease: 'power2.out',
        stagger: 0.05
    }, t);
    tl.to([leftText.scale, rightText.scale], {
        x: 1, y: 1,
        duration: 0.15,
        ease: 'power2.in',
        stagger: 0.05
    }, t + 0.15);
    t += 0.4;

    // --- STEP 3: Names fade, value boxes appear ---
    tl.to([leftText, rightText], { alpha: 0, duration: 0.2, ease: 'power2.in' }, t);
    tl.to([leftBox, rightBox], { alpha: 1, duration: 0.2, ease: 'power2.out' }, t + 0.1);
    tl.to([leftBox.scale, rightBox.scale], {
        x: 1, y: 1,
        duration: 0.25,
        ease: 'back.out(1.5)',
        stagger: 0.05
    }, t + 0.1);
    t += 0.45;

    // --- STEP 4: Values fly toward operator ---
    tl.to(leftBox, { x: 30 - BOX_W / 2, duration: 0.35, ease: 'power2.inOut' }, t);
    tl.to(rightBox, { x: 60 - BOX_W / 2, duration: 0.35, ease: 'power2.inOut' }, t);
    t += 0.4;

    // --- STEP 5: Operator glows, spark appears ---
    tl.to(opText.scale, { x: 1.3, y: 1.3, duration: 0.15, ease: 'power2.out' }, t);
    tl.to(spark, { alpha: 1, duration: 0.1 }, t);
    tl.to(spark.scale, { x: 1.5, y: 1.5, duration: 0.25, ease: 'power2.out' }, t);
    t += 0.3;

    // --- STEP 6: Values and operator fade, spark contracts ---
    tl.to([leftBox, rightBox, opText], { alpha: 0, duration: 0.2, ease: 'power2.in' }, t);
    tl.to(spark.scale, { x: 0, y: 0, duration: 0.25, ease: 'power2.in' }, t);
    tl.to(spark, { alpha: 0, duration: 0.25 }, t);
    t += 0.3;

    // --- STEP 7: Result emerges ---
    tl.to(resultBox, { alpha: 1, duration: 0.15 }, t);
    tl.to(resultBox.scale, { x: 1.15, y: 1.15, duration: 0.2, ease: 'back.out(2)' }, t);
    tl.to(resultBox.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.inOut' }, t + 0.2);
    t += 0.45;

    // --- STEP 8: Success flash on result ---
    tl.call(() => {
        resultBox.bg.clear();
        resultBox.bg.roundRect(0, 0, BOX_W + 6, BOX_H, 6);
        resultBox.bg.fill(COLORS.bg);
        resultBox.bg.stroke({ width: 2, color: COLORS.success });
        resultBox.text.style.fill = COLORS.success;
    }, null, t);
    tl.to(resultBox.scale, { x: 1.1, y: 1.1, duration: 0.1, ease: 'power2.out' }, t);
    tl.to(resultBox.scale, { x: 1, y: 1, duration: 0.12, ease: 'back.out(2)' }, t + 0.1);
    t += 0.4;

    // --- Hold briefly ---
    tl.to({}, { duration: 0.2 }, t);
    t += 0.2;

    // --- Cleanup ---
    const finalResultInfo = {
        x: x - 30,
        y: y,
        value: resultValue,
        varName: targetVarName
    };

    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
        if (typeof onComplete === 'function') {
            onComplete(finalResultInfo);
        }
    }, null, t);

    return tl;
}

// ============================================
// BEHAVIOR: IF_ELSE_BRANCH (GOLD STANDARD)
// ============================================
// Purpose: Visualize if/else branching with path indication
// CINEMATIC ANIMATION SEQUENCE:
//  1. Show condition expression: "if a > b:"
//  2. Values appear for comparison
//  3. Comparison evaluates with visual indicator
//  4. Branch paths illuminate (True path / False path)
//  5. Chosen path glows, other fades
//  6. "Gate" opens to chosen branch
// ============================================
export function IF_ELSE_BRANCH(layer, params, onComplete) {
    const {
        leftValue = 10,
        rightValue = 5,
        operator = '>',
        result = true,
        position
    } = params;

    const { x, y } = position;
    const tl = gsap.timeline({ onComplete });

    // Layout constants
    const BOX_W = 44;
    const BOX_H = 34;
    const PATH_WIDTH = 80;
    const PATH_HEIGHT = 50;

    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.alpha = 0;
    layer.addChild(container);

    // ========================================
    // PHASE 1: Condition expression "if left op right:"
    // ========================================
    const conditionContainer = new PIXI.Container();
    conditionContainer.y = -30;
    container.addChild(conditionContainer);

    // "if" keyword
    const ifText = createText('if', { fontSize: 18, fill: COLORS.muted });
    ifText.anchor.set(0.5, 0.5);
    ifText.x = -60;
    ifText.y = 0;
    conditionContainer.addChild(ifText);

    // Left value box
    const leftBox = createValueBox(leftValue, {
        width: BOX_W,
        height: BOX_H,
        borderColor: COLORS.value
    });
    leftBox.x = -30 - BOX_W / 2;
    leftBox.y = -BOX_H / 2;
    leftBox.alpha = 0;
    leftBox.scale.set(0.5);
    conditionContainer.addChild(leftBox);

    // Operator
    const opText = createText(operator, { fontSize: 22, fill: COLORS.warning });
    opText.anchor.set(0.5, 0.5);
    opText.x = 0;
    opText.y = 0;
    opText.alpha = 0;
    conditionContainer.addChild(opText);

    // Right value box
    const rightBox = createValueBox(rightValue, {
        width: BOX_W,
        height: BOX_H,
        borderColor: COLORS.value
    });
    rightBox.x = 30 - BOX_W / 2;
    rightBox.y = -BOX_H / 2;
    rightBox.alpha = 0;
    rightBox.scale.set(0.5);
    conditionContainer.addChild(rightBox);

    // Colon
    const colonText = createText(':', { fontSize: 18, fill: COLORS.muted });
    colonText.anchor.set(0.5, 0.5);
    colonText.x = 65;
    colonText.y = 0;
    conditionContainer.addChild(colonText);

    // ========================================
    // PHASE 2: Branch paths
    // ========================================
    const pathsContainer = new PIXI.Container();
    pathsContainer.y = 20;
    container.addChild(pathsContainer);

    // True path (left)
    const truePath = new PIXI.Graphics();
    truePath.roundRect(-PATH_WIDTH - 10, 0, PATH_WIDTH, PATH_HEIGHT, 8);
    truePath.fill({ color: COLORS.success, alpha: 0.15 });
    truePath.stroke({ width: 2, color: COLORS.success, alpha: 0.5 });
    truePath.alpha = 0;
    pathsContainer.addChild(truePath);

    const trueLabel = createText('True ✓', { fontSize: 14, fill: COLORS.success });
    trueLabel.anchor.set(0.5, 0.5);
    trueLabel.x = -PATH_WIDTH / 2 - 10;
    trueLabel.y = PATH_HEIGHT / 2;
    trueLabel.alpha = 0;
    pathsContainer.addChild(trueLabel);

    // False path (right)
    const falsePath = new PIXI.Graphics();
    falsePath.roundRect(10, 0, PATH_WIDTH, PATH_HEIGHT, 8);
    falsePath.fill({ color: COLORS.error, alpha: 0.15 });
    falsePath.stroke({ width: 2, color: COLORS.error, alpha: 0.5 });
    falsePath.alpha = 0;
    pathsContainer.addChild(falsePath);

    const falseLabel = createText('False ✗', { fontSize: 14, fill: COLORS.error });
    falseLabel.anchor.set(0.5, 0.5);
    falseLabel.x = PATH_WIDTH / 2 + 10;
    falseLabel.y = PATH_HEIGHT / 2;
    falseLabel.alpha = 0;
    pathsContainer.addChild(falseLabel);

    // Decision arrow (points to chosen path)
    const arrow = new PIXI.Graphics();
    arrow.moveTo(0, -5);
    arrow.lineTo(-8, -15);
    arrow.lineTo(8, -15);
    arrow.closePath();
    arrow.fill(result ? COLORS.success : COLORS.error);
    arrow.x = result ? (-PATH_WIDTH / 2 - 10) : (PATH_WIDTH / 2 + 10);
    arrow.y = 5;
    arrow.alpha = 0;
    arrow.scale.set(0.5);
    pathsContainer.addChild(arrow);

    // Glow ring around result
    const resultGlow = new PIXI.Graphics();
    resultGlow.circle(0, 0, 35);
    resultGlow.fill({ color: result ? COLORS.success : COLORS.error, alpha: 0.2 });
    resultGlow.x = 0;
    resultGlow.y = -30;
    resultGlow.alpha = 0;
    resultGlow.scale.set(0.5);
    container.addChild(resultGlow);

    // ========================================
    // ANIMATION TIMELINE
    // ========================================
    let t = 0;

    // --- STEP 1: Fade in container with "if" ---
    tl.to(container, { alpha: 1, duration: 0.3, ease: 'power2.out' }, t);
    t += 0.4;

    // --- STEP 2: Value boxes appear ---
    tl.to([leftBox, rightBox], { alpha: 1, duration: 0.2, stagger: 0.1 }, t);
    tl.to([leftBox.scale, rightBox.scale], { x: 1, y: 1, duration: 0.25, ease: 'back.out(1.5)', stagger: 0.1 }, t);
    t += 0.4;

    // --- STEP 3: Operator appears ---
    tl.to(opText, { alpha: 1, duration: 0.2, ease: 'power2.out' }, t);
    t += 0.3;

    // --- STEP 4: Comparison "processing" - operator pulses ---
    tl.to(opText.scale, { x: 1.3, y: 1.3, duration: 0.15, ease: 'power2.out' }, t);
    tl.to(opText.scale, { x: 1, y: 1, duration: 0.2, ease: 'power2.inOut' }, t + 0.15);
    t += 0.45;

    // --- STEP 5: Both paths appear ---
    tl.to([truePath, falsePath], { alpha: 1, duration: 0.25, stagger: 0.1 }, t);
    tl.to([trueLabel, falseLabel], { alpha: 0.5, duration: 0.25, stagger: 0.1 }, t + 0.1);
    t += 0.45;

    // --- STEP 6: Result glow expands from center ---
    tl.to(resultGlow, { alpha: 1, duration: 0.2 }, t);
    tl.to(resultGlow.scale, { x: 1.2, y: 1.2, duration: 0.3, ease: 'power2.out' }, t);
    t += 0.35;

    // --- STEP 7: Chosen path brightens, other fades ---
    const chosenPath = result ? truePath : falsePath;
    const chosenLabel = result ? trueLabel : falseLabel;
    const fadedPath = result ? falsePath : truePath;
    const fadedLabel = result ? falseLabel : trueLabel;

    tl.to(chosenPath, { alpha: 1, duration: 0.25 }, t);
    tl.to(chosenLabel, { alpha: 1, duration: 0.25 }, t);
    tl.to(fadedPath, { alpha: 0.2, duration: 0.25 }, t);
    tl.to(fadedLabel, { alpha: 0.2, duration: 0.25 }, t);
    t += 0.35;

    // --- STEP 8: Arrow appears, points to chosen path ---
    tl.to(arrow, { alpha: 1, duration: 0.2 }, t);
    tl.to(arrow.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' }, t);
    t += 0.4;

    // --- STEP 9: Chosen path "opens" (scale effect) ---
    tl.to(chosenPath.scale, { x: 1.05, y: 1.05, duration: 0.15, ease: 'power2.out' }, t);
    tl.to(chosenPath.scale, { x: 1, y: 1, duration: 0.2, ease: 'power2.inOut' }, t + 0.15);
    t += 0.5;

    // --- Hold ---
    tl.to({}, { duration: 0.3 }, t);
    t += 0.3;

    // --- Cleanup ---
    tl.to(container, { alpha: 0, duration: 0.3, ease: 'power2.in' }, t);
    tl.call(() => {
        layer.removeChild(container);
        container.destroy({ children: true });
    }, null, t + 0.35);

    return tl;
}

// ============================================
// BEHAVIOR REGISTRY
// ============================================
export const BehaviorRegistry = {
    VALUE_UPDATE,
    COMPARE,
    ASSIGN_FROM,
    ASSIGN_FROM_ARRAY_INDEX,
    ASSIGN_FROM_VARIABLE,
    ASSIGN_BINARY_OPERATION,
    IF_ELSE_BRANCH,
    HIGHLIGHT_ARRAY_INDEX,
    LOOP_ADVANCE,
    FOR_LOOP_ITERATION,
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
