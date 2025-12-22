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
    ASSIGN_FROM_ARRAY_INDEX,
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
