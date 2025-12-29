/**
 * Choreography.js - Modular Animation Choreography
 * 
 * Contains reusable choreography patterns for cinematic animations.
 * These are high-level animation sequences that coordinate multiple visual objects.
 * 
 * Choreography Pattern:
 * 1. GATHER - Move visuals to interaction zone
 * 2. INTERACT - Perform the animation
 * 3. RETURN - Move visuals back to their home positions
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { VariableVisual } from './VisualObjects';

// Color constants
const COLORS = {
    primary: 0x6366f1,      // Indigo
    warning: 0xfbbf24,      // Amber
    text: 0xf1f5f9,         // Slate 100
    bg: 0x0f172a,           // Slate 900
};

/**
 * FOR Loop Iteration Choreography
 * 
 * Animates: for n in nums
 * 1. Move array to center
 * 2. Pointer 'n' appears above target cell
 * 3. Value is extracted from cell
 * 4. Combine into 'n = value'
 * 5. Move array back home
 * 6. Slide result to STATE zone
 * 
 * @param {Object} params - Animation parameters
 * @param {Object} renderer - PixiRenderer instance (for layers, zones, objects)
 * @param {Function} onComplete - Callback when animation completes
 * @returns {Object} GSAP timeline
 */
export function choreographForLoopIteration({
    loopVar,
    arrayName,
    currentIndex,
    currentValue,
    iteration
}, renderer, onComplete) {

    const { layers, zones, objects } = renderer;

    // Get the existing array visual
    const arrayVisual = objects.arrays.get(arrayName);
    if (!arrayVisual) {
        console.warn(`Choreography: Array ${arrayName} not found`);
        onComplete?.();
        return null;
    }

    // Get existing variable (if any)
    const existingVar = objects.variables.get(loopVar);

    // Calculate positions
    const arrayHome = { x: arrayVisual.homeX, y: arrayVisual.homeY };
    const centerX = zones.interaction.centerX;
    const centerY = zones.interaction.centerY;

    // Variable home position in STATE zone
    const varIndex = existingVar
        ? Array.from(objects.variables.keys()).indexOf(loopVar)
        : renderer.variableCount;
    const varHomeX = zones.state.x + 10;
    const varHomeY = zones.state.y + 10 + (varIndex * 50);

    // Ensure the loop variable exists as a persistent actor
    // (so each iteration animates the SAME `n` coming from the STATE zone)
    const loopVarVisual = existingVar ?? (() => {
        const v = new VariableVisual(layers.variables, loopVar, '?');
        v.setHomePosition(varHomeX, varHomeY);
        v.container.x = varHomeX;
        v.container.y = varHomeY;
        v.show();
        renderer.variableCount++;
        objects.variables.set(loopVar, v);
        return v;
    })();

    // Cell position (relative to array)
    const cellPos = arrayVisual.getCellPosition(currentIndex);

    const tl = gsap.timeline({
        onComplete: () => onComplete?.()
    });

    // Cinematic timing tuned to match ASSIGN_FROM_ARRAY_INDEX feel
    const T = {
        arrayToCenter: 0.6,
        varToCell: 0.75,
        bubblePop: 0.25,
        bubbleFly: 0.75,
        settleHold: 0.35,
        returnHome: 0.7,
        fadeBubble: 0.15
    };

    // ========================================
    // PHASE 1: GATHER - Move array to center
    // ========================================
    tl.to(arrayVisual.container, {
        x: centerX - arrayVisual.getVisualWidth() / 2,
        y: centerY - 20,
        duration: T.arrayToCenter,
        ease: 'power2.inOut'
    }, 0);

    // ========================================
    // PHASE 2: INTERACT - Bring the SAME loop variable to the array and update it
    // ========================================

    // Calculate the CENTER position where the array will be after moving
    const arrayCenterX = centerX - arrayVisual.getVisualWidth() / 2;
    const arrayCenterY = centerY - 20;

    // Target position: center the variable box above the current cell
    const cellCenterX = arrayCenterX + cellPos.x + cellPos.width / 2;
    const cellTopY = arrayCenterY + cellPos.y;
    const loopVarTargetX = cellCenterX - loopVarVisual.getVisualWidth() / 2;
    const loopVarTargetY = cellTopY - 52;

    // Bring the loop variable from the STATE zone to above the cell
    // Move `n` after the array is mostly centered (more readable, less rushed)
    const varMoveStart = 0.35;
    tl.to(loopVarVisual.container, {
        x: loopVarTargetX,
        y: loopVarTargetY,
        duration: T.varToCell,
        ease: 'power2.inOut'
    }, varMoveStart);
    tl.to(loopVarVisual.container.scale, {
        x: 0.95,
        y: 0.95,
        duration: T.varToCell,
        ease: 'power2.out'
    }, varMoveStart);

    // Highlight the cell
    tl.call(() => {
        arrayVisual.highlightCell(currentIndex, COLORS.primary);
    }, null, 0.5);

    // Create extracted value bubble in EFFECTS layer
    const extractedValue = new PIXI.Container();
    extractedValue.alpha = 0;
    extractedValue.scale.set(0.6);
    layers.effects.addChild(extractedValue);

    const extractBg = new PIXI.Graphics();
    extractBg.roundRect(0, 0, 40, 36, 6);
    extractBg.fill({ color: COLORS.primary, alpha: 0.95 });
    extractedValue.addChild(extractBg);

    const extractText = new PIXI.Text({
        text: String(currentValue),
        style: { fontFamily: 'Inter, sans-serif', fontSize: 18, fill: 0xffffff, fontWeight: 'bold' }
    });
    extractText.anchor.set(0.5);
    extractText.x = 20;
    extractText.y = 18;
    extractedValue.addChild(extractText);

    // Place bubble at the selected cell
    extractedValue.x = arrayCenterX + cellPos.x + cellPos.width / 2 - 20;
    extractedValue.y = arrayCenterY + cellPos.y + cellPos.height / 2 - 18;

    // Compute target at the variable's value box center
    const getValueBoxCenter = () => ({
        x: loopVarVisual.container.x + loopVarVisual.valueBox.x + loopVarVisual.boxWidth / 2,
        y: loopVarVisual.container.y + loopVarVisual.valueBox.y + loopVarVisual.boxHeight / 2
    });

    // Bubble pops out
    const bubblePopStart = 1.25;
    tl.to(extractedValue, { alpha: 1, duration: T.bubblePop, ease: 'power2.out' }, bubblePopStart);
    tl.to(extractedValue.scale, { x: 1.05, y: 1.05, duration: T.bubblePop, ease: 'back.out(2)' }, bubblePopStart);

    // Fly into the variable's value box
    tl.to(extractedValue, {
        x: () => getValueBoxCenter().x - 20,
        y: () => getValueBoxCenter().y - 18,
        duration: T.bubbleFly,
        ease: 'power3.inOut'
    }, bubblePopStart + 0.35);

    // Update the variable value when the bubble arrives
    tl.call(() => {
        loopVarVisual.setValue(currentValue, true);
        // fade bubble out smoothly once it lands
        extractedValue.alpha = 0;
    }, null, bubblePopStart + 0.35 + T.bubbleFly);

    // Brief hold
    tl.to({}, { duration: T.settleHold }, bubblePopStart + 0.35 + T.bubbleFly + 0.05);

    // ========================================
    // PHASE 3: RETURN - Move array and variable back home
    // ========================================
    tl.call(() => {
        arrayVisual.clearHighlight();
    }, null, 2.95);

    tl.to(arrayVisual.container, {
        x: arrayHome.x,
        y: arrayHome.y,
        duration: T.returnHome,
        ease: 'power2.inOut'
    }, 3.05);

    // Variable returns home after the interaction
    tl.to(loopVarVisual.container, {
        x: varHomeX,
        y: varHomeY,
        duration: T.returnHome,
        ease: 'power2.inOut'
    }, 3.05);
    tl.to(loopVarVisual.container.scale, {
        x: 1,
        y: 1,
        duration: T.returnHome,
        ease: 'power2.out'
    }, 3.05);

    // Cleanup bubble
    tl.call(() => {
        layers.effects.removeChild(extractedValue);
        extractedValue.destroy({ children: true });
    }, null, 3.9);

    return tl;
}

/**
 * FOR Loop End Choreography
 * 
 * Animates the final (StopIteration) execution of: for n in nums
 * - Shows the loop variable pointer at the last element
 * - Slides it out past the array and fades
 * - Returns array home
 */
export function choreographForLoopEnd({
    loopVar,
    arrayName,
    arrayValues,
    previousIndex
}, renderer, onComplete) {
    const { layers, zones, objects } = renderer;

    const arrayVisual = objects.arrays.get(arrayName);
    if (!arrayVisual) {
        console.warn(`Choreography: Array ${arrayName} not found`);
        onComplete?.();
        return null;
    }

    const arrayHome = { x: arrayVisual.homeX, y: arrayVisual.homeY };
    const centerX = zones.interaction.centerX;
    const centerY = zones.interaction.centerY;

    const arrayLen = Array.isArray(arrayValues) ? arrayValues.length : 0;
    const lastIndex = Math.max(0, arrayLen - 1);
    const safeIndex = previousIndex !== null && previousIndex !== undefined
        ? Math.max(0, Math.min(previousIndex, lastIndex))
        : lastIndex;

    const cellPos = arrayVisual.getCellPosition(safeIndex);

    const tl = gsap.timeline({
        onComplete: () => onComplete?.()
    });

    // Cinematic timing tuned to match ASSIGN_FROM_ARRAY_INDEX feel
    const T = {
        arrayToCenter: 0.6,
        varToCell: 0.75,
        holdAtCell: 0.35,
        varExit: 0.9,
        blastExpand: 0.7,
        blastFade: 0.45,
        returnHome: 0.7
    };

    // Move array to center (smooth)
    tl.to(arrayVisual.container, {
        x: centerX - arrayVisual.getVisualWidth() / 2,
        y: centerY - 20,
        duration: T.arrayToCenter,
        ease: 'power2.inOut'
    }, 0);

    // Ensure no stale highlight
    tl.call(() => {
        arrayVisual.clearHighlight?.();
    }, null, 0.05);

    // Use the SAME loop variable visual from the STATE zone
    const existingVar = objects.variables.get(loopVar);
    const loopVarVisual = existingVar ?? (() => {
        const v = new VariableVisual(layers.variables, loopVar, '?');
        // If we don't know home, keep wherever it currently is (will be removed after end)
        v.show();
        objects.variables.set(loopVar, v);
        return v;
    })();

    const arrayCenterX = centerX - arrayVisual.getVisualWidth() / 2;
    const arrayCenterY = centerY - 20;

    const cellCenterX = arrayCenterX + cellPos.x + cellPos.width / 2;
    const cellTopY = arrayCenterY + cellPos.y;
    const loopVarTargetX = cellCenterX - loopVarVisual.getVisualWidth() / 2;
    const loopVarTargetY = cellTopY - 52;

    // Pre-create blast graphics NOW so GSAP can tween real objects
    const exitX = (cellCenterX + cellPos.width / 2) + 90;
    const BLAST_Y = loopVarTargetY + 12;

    const blast = new PIXI.Container();
    blast.x = exitX;
    blast.y = BLAST_Y;
    blast.alpha = 0;
    layers.effects.addChild(blast);

    const ring = new PIXI.Graphics();
    ring.circle(0, 0, 10);
    ring.stroke({ width: 3, color: COLORS.primary, alpha: 0.9 });
    blast.addChild(ring);

    const particles = [];
    const offsets = [
        { x: -6, y: -2 },
        { x: 3, y: -6 },
        { x: 7, y: 4 },
        { x: -2, y: 7 }
    ];
    offsets.forEach((o) => {
        const p = new PIXI.Graphics();
        p.circle(0, 0, 2.2);
        p.fill({ color: COLORS.warning, alpha: 0.9 });
        p.x = o.x;
        p.y = o.y;
        p.alpha = 0; // will fade in with blast
        blast.addChild(p);
        particles.push(p);
    });

    // Bring the loop variable to the last cell (readable)
    tl.to(loopVarVisual.container, {
        x: loopVarTargetX,
        y: loopVarTargetY,
        duration: T.varToCell,
        ease: 'power2.inOut'
    }, 0.45);
    tl.to(loopVarVisual.container.scale, {
        x: 0.95,
        y: 0.95,
        duration: T.varToCell,
        ease: 'power2.out'
    }, 0.45);

    // Brief hold so it's clear we're at the last element
    tl.to({}, { duration: T.holdAtCell }, 1.25);

    // Bring blast above other effects right before it plays
    tl.call(() => {
        // re-add moves it to top of z-order
        layers.effects.addChild(blast);
    }, null, 1.03);

    // Variable exits smoothly (out-of-bounds) then vanishes
    const exitStart = 1.75;
    tl.to(loopVarVisual.container, {
        x: exitX,
        duration: T.varExit,
        ease: 'power3.inOut'
    }, exitStart);
    tl.to(loopVarVisual.container.scale, {
        x: 0.9,
        y: 0.9,
        duration: T.varExit,
        ease: 'power2.in'
    }, exitStart);
    tl.to(loopVarVisual.container, {
        alpha: 0,
        duration: 0.45,
        ease: 'power2.in'
    }, exitStart + 0.35);

    // Blast: quick pop + fade
    // Blast: pop + expand + fade (slower cinematic)
    const blastStart = exitStart + 0.55;
    tl.to(blast, { alpha: 1, duration: 0.12, ease: 'power2.out' }, blastStart);
    tl.to(blast.scale, { x: 1.9, y: 1.9, duration: T.blastExpand, ease: 'power2.out' }, blastStart);
    tl.to(blast, { alpha: 0, duration: T.blastFade, ease: 'power2.in' }, blastStart + 0.25);

    // Particles appear then drift outward
    tl.to(particles, { alpha: 1, duration: 0.12, ease: 'power2.out' }, blastStart);

    // Particles drift slightly outward
    particles.forEach((p, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        tl.to(p, {
            x: p.x + dir * (8 + i * 2),
            y: p.y + (i - 1.5) * 3,
            alpha: 0,
            duration: 0.55,
            ease: 'power2.out'
        }, blastStart + 0.1);
    });

    // Return array home AFTER the blast finishes (no overlap)
    const returnStart = blastStart + 0.75;
    tl.to(arrayVisual.container, {
        x: arrayHome.x,
        y: arrayHome.y,
        duration: T.returnHome,
        ease: 'power2.inOut'
    }, returnStart);

    // Hard guarantee: snap to home at the end (prevents any stuck-in-center edge cases)
    tl.call(() => {
        arrayVisual.container.x = arrayHome.x;
        arrayVisual.container.y = arrayHome.y;
        arrayVisual.clearHighlight?.();
    }, null, returnStart + T.returnHome + 0.1);

    // Cleanup
    tl.call(() => {
        layers.effects.removeChild(blast);
        blast.destroy({ children: true });
    }, null, returnStart + T.returnHome + 0.2);

    return tl;
}

/**
 * Comparison Choreography
 * Animates: if n > max_val
 * 
 * @param {Object} params - Animation parameters
 * @param {Object} renderer - PixiRenderer instance
 * @param {Function} onComplete - Callback when animation completes
 * @returns {Object} GSAP timeline
 */
export function choreographComparison({
    leftVar,
    rightVar,
    operator,
    leftVal,
    rightVal,
    result
}, renderer, onComplete) {
    // This can be expanded later with similar choreography pattern
    // For now, just call onComplete
    onComplete?.();
    return gsap.timeline();
}

/**
 * Assignment Choreography
 * Animates: x = y
 * 
 * @param {Object} params - Animation parameters
 * @param {Object} renderer - PixiRenderer instance
 * @param {Function} onComplete - Callback when animation completes
 * @returns {Object} GSAP timeline
 */
export function choreographAssignment({
    targetVar,
    sourceVar,
    value
}, renderer, onComplete) {
    // This can be expanded later with similar choreography pattern
    // For now, just call onComplete
    onComplete?.();
    return gsap.timeline();
}
