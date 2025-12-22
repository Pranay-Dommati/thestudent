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

    // Cell position (relative to array)
    const cellPos = arrayVisual.getCellPosition(currentIndex);

    const tl = gsap.timeline({
        onComplete: () => onComplete?.()
    });

    // ========================================
    // PHASE 1: GATHER - Move array to center
    // ========================================
    tl.to(arrayVisual.container, {
        x: centerX - arrayVisual.getVisualWidth() / 2,
        y: centerY - 20,
        duration: 0.4,
        ease: 'power2.inOut'
    }, 0);

    // ========================================
    // PHASE 2: INTERACT - Show pointer and extract value
    // ========================================

    // Create temporary pointer label
    const pointerContainer = new PIXI.Container();
    pointerContainer.alpha = 0;
    layers.effects.addChild(pointerContainer);

    const pointerText = new PIXI.Text({
        text: loopVar,
        style: { fontFamily: 'Inter, sans-serif', fontSize: 24, fill: COLORS.warning, fontWeight: '700' }
    });
    pointerText.anchor.set(0.5, 1);
    pointerContainer.addChild(pointerText);

    // Calculate the CENTER position where the array will be after moving
    const arrayCenterX = centerX - arrayVisual.getVisualWidth() / 2;
    const arrayCenterY = centerY - 20;

    // Calculate pointer position relative to where array WILL BE (at center)
    const pointerTargetX = arrayCenterX + cellPos.x + cellPos.width / 2;
    const pointerTargetY = arrayCenterY + cellPos.y - 10;

    // Position pointer ABOVE (starts off-screen, will drop in)
    pointerContainer.x = pointerTargetX;
    pointerContainer.y = pointerTargetY - 50;

    // Pointer drops in AFTER array has moved to center
    tl.to(pointerContainer, {
        alpha: 1,
        y: pointerTargetY,
        duration: 0.35,
        ease: 'back.out(1.5)'
    }, 0.45);

    // Highlight the cell
    tl.call(() => {
        arrayVisual.highlightCell(currentIndex, COLORS.primary);
    }, null, 0.5);

    // Create extracted value box
    const extractedValue = new PIXI.Container();
    const extractBg = new PIXI.Graphics();
    extractBg.roundRect(0, 0, 40, 36, 4);
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

    // Position extracted value at the CENTERED array position
    extractedValue.x = arrayCenterX + cellPos.x + cellPos.width / 2 - 20;
    extractedValue.y = arrayCenterY + cellPos.y + cellPos.height / 2 - 18;
    extractedValue.alpha = 0;
    extractedValue.scale.set(0.5);
    layers.effects.addChild(extractedValue);

    // Value pops out
    tl.to(extractedValue, { alpha: 1, duration: 0.2, ease: 'power2.out' }, 0.75);
    tl.to(extractedValue.scale, { x: 1.1, y: 1.1, duration: 0.25, ease: 'back.out(2)' }, 0.75);

    // Value moves up to meet pointer
    tl.to(extractedValue, {
        y: pointerTargetY - 25,
        duration: 0.35,
        ease: 'power3.inOut'
    }, 1.0);
    tl.to(extractedValue.scale, { x: 0.85, y: 0.85, duration: 0.3 }, 1.1);

    // Pointer pulses
    tl.to(pointerContainer.scale, { x: 1.15, y: 1.15, duration: 0.12 }, 1.2);
    tl.to(pointerContainer.scale, { x: 1, y: 1, duration: 0.15, ease: 'back.out(2)' }, 1.32);


    // Combine into "n = value"
    tl.call(() => {
        pointerText.text = `${loopVar} = ${currentValue}`;
        extractedValue.visible = false;
    }, null, 1.4);

    // Brief hold
    tl.to({}, { duration: 0.3 }, 1.5);

    // ========================================
    // PHASE 3: RETURN - Move array back home
    // ========================================
    tl.call(() => {
        arrayVisual.clearHighlight();
    }, null, 1.8);

    tl.to(arrayVisual.container, {
        x: arrayHome.x,
        y: arrayHome.y,
        duration: 0.4,
        ease: 'power2.inOut'
    }, 1.9);

    // Slide pointer/result to STATE zone
    tl.to(pointerContainer, {
        x: varHomeX + 50,
        y: varHomeY + 15,
        duration: 0.5,
        ease: 'power2.inOut'
    }, 1.9);

    // ========================================
    // PHASE 4: HANDOFF - Create/update VariableVisual
    // ========================================
    tl.call(() => {
        // Cleanup temporary graphics
        layers.effects.removeChild(pointerContainer);
        layers.effects.removeChild(extractedValue);
        pointerContainer.destroy({ children: true });
        extractedValue.destroy({ children: true });

        // Create or update the real VariableVisual
        if (existingVar) {
            existingVar.setValue(currentValue, true);
            existingVar.container.x = varHomeX;
            existingVar.container.y = varHomeY;
            existingVar.show();
        } else {
            // Use imported VariableVisual
            const varVisual = new VariableVisual(layers.variables, loopVar, currentValue);
            varVisual.setHomePosition(varHomeX, varHomeY);
            varVisual.container.x = varHomeX;
            varVisual.container.y = varHomeY;
            varVisual.show();
            renderer.variableCount++;
            objects.variables.set(loopVar, varVisual);
        }
    }, null, 2.4);

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
