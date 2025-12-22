/**
 * TransitionSystem.js - Game-Engine Style Animation Primitives
 * 
 * Instead of animating "scenarios" (ASSIGN_FROM_VARIABLE, ASSIGN_FROM_ARRAY...),
 * we animate STATE TRANSITIONS using 6 fundamental primitives.
 * 
 * THE 6 TRANSITIONS:
 * 1. TRANSFER    - Value moves from one actor to another
 * 2. TRANSFORM   - Value changes form (expression → value)
 * 3. COMPARE     - Two values are evaluated
 * 4. EMPHASIZE   - Draw attention without moving state (pulse/glow)
 * 5. SPAWN/DESPAWN - Temporary visual appears/disappears
 * 6. LAYOUT_RETURN - Actors return to home positions
 * 
 * Any animation scenario is COMPOSED from these primitives:
 * 
 *   play([
 *     EMPHASIZE(source),
 *     TRANSFER({ from: source, to: target, value }),
 *     DESPAWN(overlay)
 *   ])
 * 
 * This eliminates per-syntax animations and scales to any code pattern.
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';

// ============================================
// TIMING CONSTANTS (locked visual language)
// ============================================
export const TIMING = {
    instant: 0.1,
    fast: 0.2,
    normal: 0.35,
    slow: 0.55,
    emphasis: 0.25,
    travel: 0.8,
    hold: 0.3,
};

export const EASING = {
    in: 'power2.in',
    out: 'power2.out',
    inOut: 'power3.inOut',
    bounce: 'back.out(1.7)',
    snap: 'back.out(2.5)',
    elastic: 'elastic.out(1, 0.3)',
};

// ============================================
// CENTER STAGE CONSTANTS
// ============================================
const STAGE = {
    offsetY: -40,      // Lift above center
    spacing: 80,       // Space between actors on stage
    liftHeight: 30,    // How high actors lift when grabbed
};

// ============================================
// COLOR CONSTANTS
// ============================================
const COLORS = {
    primary: 0x6366f1,
    accent: 0x14b8a6,
    warning: 0xfbbf24,
    success: 0x22c55e,
    text: 0xf1f5f9,
    bg: 0x1e293b,
    border: 0x334155,
};

// ============================================
// 1️⃣ TRANSFER
// Value moves from one actor to another
// Used for: y = x, max_val = n, return val
// ============================================
export function transfer(timeline, { from, to, value, renderer, startTime = 0 }) {
    const fromPos = getActorValueCenter(from, renderer);
    const toPos = getActorValueCenter(to, renderer);

    if (!fromPos || !toPos) {
        console.warn('TRANSFER: Missing actor positions', { from, to });
        return startTime;
    }

    // Create value bubble
    const bubble = renderer.createValueBubble(value);
    bubble.container.x = fromPos.x;
    bubble.container.y = fromPos.y;
    bubble.container.alpha = 0;
    bubble.container.scale.set(0.5);

    let t = startTime;

    // Bubble appears at source
    timeline.to(bubble.container, {
        alpha: 1,
        duration: TIMING.fast,
        ease: EASING.out
    }, t);
    timeline.to(bubble.container.scale, {
        x: 1, y: 1,
        duration: TIMING.normal,
        ease: EASING.bounce
    }, t);
    t += TIMING.normal;

    // Arc travel to destination
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = Math.min(fromPos.y, toPos.y) - 50;

    timeline.to(bubble.container, {
        x: midX, y: midY,
        duration: TIMING.travel * 0.5,
        ease: EASING.out
    }, t);
    t += TIMING.travel * 0.5;

    timeline.to(bubble.container, {
        x: toPos.x, y: toPos.y,
        duration: TIMING.travel * 0.5,
        ease: EASING.in
    }, t);
    t += TIMING.travel * 0.5;

    // Bubble lands and fades
    timeline.to(bubble.container, {
        alpha: 0,
        duration: TIMING.fast,
        ease: EASING.in
    }, t - 0.1);
    timeline.to(bubble.container.scale, {
        x: 0.3, y: 0.3,
        duration: TIMING.fast,
        ease: EASING.in
    }, t - 0.1);

    // Update destination actor
    timeline.call(() => {
        updateActorValue(to, value, renderer);
        bubble.container.destroy();
    }, null, t);

    t += TIMING.hold;
    return t;
}

// ============================================
// 2️⃣ TRANSFORM
// Value changes form (expression → result)
// Used for: nums[0] → 3, a + b → result
// ============================================
export function transform(timeline, { actor, fromText, toValue, renderer, startTime = 0 }) {
    let t = startTime;

    // Get or create a transform overlay
    const overlay = createTextOverlay(fromText, renderer);
    const center = getActorValueCenter(actor, renderer) || { x: renderer.width / 2, y: renderer.height / 2 };
    overlay.x = center.x;
    overlay.y = center.y - 40;
    overlay.alpha = 0;
    renderer.layers.effects.addChild(overlay);

    // Show expression
    timeline.to(overlay, { alpha: 1, duration: TIMING.normal, ease: EASING.out }, t);
    t += TIMING.normal + TIMING.hold;

    // Morph to value (scale down, change text, scale up)
    timeline.to(overlay.scale, { x: 0.7, y: 0.7, duration: TIMING.fast, ease: EASING.in }, t);
    timeline.call(() => {
        const text = overlay.getChildAt(0);
        if (text) text.text = String(toValue);
    }, null, t + TIMING.fast);
    timeline.to(overlay.scale, { x: 1.1, y: 1.1, duration: TIMING.normal, ease: EASING.bounce }, t + TIMING.fast);
    timeline.to(overlay.scale, { x: 1, y: 1, duration: TIMING.fast, ease: EASING.out }, t + TIMING.fast + TIMING.normal);
    t += TIMING.fast + TIMING.normal + TIMING.fast + TIMING.hold;

    // Fade and cleanup
    timeline.to(overlay, { alpha: 0, y: overlay.y + 20, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.call(() => {
        renderer.layers.effects.removeChild(overlay);
        overlay.destroy({ children: true });
    }, null, t + TIMING.normal);

    t += TIMING.normal;
    return t;
}

// ============================================
// 3️⃣ COMPARE
// Two values are evaluated together
// Used for: a > b, a == b
// ============================================
export function compare(timeline, { left, right, operator, result, renderer, startTime = 0 }) {
    let t = startTime;

    const center = renderer.getInteractionCenter?.() || { x: renderer.width / 2, y: renderer.height / 2 };

    // Create comparison overlay
    const overlay = new PIXI.Container();
    overlay.x = center.x;
    overlay.y = center.y;
    overlay.alpha = 0;
    overlay.scale.set(0.8);
    renderer.layers.effects.addChild(overlay);

    // Left value box
    const leftBox = createValueBox(left.value, COLORS.primary);
    leftBox.x = -60;
    overlay.addChild(leftBox);

    // Operator
    const opText = new PIXI.Text({
        text: operator,
        style: { fontFamily: 'Inter', fontSize: 22, fill: COLORS.warning, fontWeight: 'bold' }
    });
    opText.anchor.set(0.5);
    overlay.addChild(opText);

    // Right value box
    const rightBox = createValueBox(right.value, COLORS.primary);
    rightBox.x = 60;
    overlay.addChild(rightBox);

    // Result indicator (appears later)
    const resultColor = result ? COLORS.success : 0xef4444;
    const resultText = new PIXI.Text({
        text: result ? '✓' : '✗',
        style: { fontFamily: 'Inter', fontSize: 28, fill: resultColor, fontWeight: 'bold' }
    });
    resultText.anchor.set(0.5);
    resultText.y = 45;
    resultText.alpha = 0;
    resultText.scale.set(0);
    overlay.addChild(resultText);

    // Appear
    timeline.to(overlay, { alpha: 1, duration: TIMING.normal, ease: EASING.out }, t);
    timeline.to(overlay.scale, { x: 1, y: 1, duration: TIMING.slow, ease: EASING.bounce }, t);
    t += TIMING.slow + TIMING.hold;

    // Values pulse toward operator
    timeline.to(leftBox, { x: -45, duration: TIMING.normal, ease: EASING.inOut }, t);
    timeline.to(rightBox, { x: 45, duration: TIMING.normal, ease: EASING.inOut }, t);
    t += TIMING.normal;

    // Operator glows
    timeline.to(opText.scale, { x: 1.3, y: 1.3, duration: TIMING.emphasis, ease: EASING.out }, t);
    timeline.to(opText.scale, { x: 1, y: 1, duration: TIMING.emphasis, ease: EASING.in }, t + TIMING.emphasis);
    t += TIMING.emphasis * 2;

    // Result appears
    timeline.to(resultText, { alpha: 1, duration: TIMING.fast, ease: EASING.out }, t);
    timeline.to(resultText.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.snap }, t);
    t += TIMING.normal + TIMING.hold * 2;

    // Cleanup
    timeline.to(overlay, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.call(() => {
        renderer.layers.effects.removeChild(overlay);
        overlay.destroy({ children: true });
    }, null, t + TIMING.normal);

    t += TIMING.normal;
    return t;
}

// ============================================
// 🎭 CENTER STAGE - The Hero Animation
// Grabs actors, brings them to center, performs operation, returns them
// This is the "wow" animation for assignments, comparisons, etc.
// ============================================
export function centerStageTransfer(timeline, { from, to, value, renderer, startTime = 0 }) {
    const fromPos = getActorValueCenter(from, renderer);
    const toPos = getActorValueCenter(to, renderer);
    
    console.log('🎭 centerStageTransfer:', { from, to, value, fromPos, toPos });
    
    if (!fromPos || !toPos) {
        console.warn('centerStageTransfer: Missing positions', { from, to, fromPos, toPos });
        return transfer(timeline, { from, to, value, renderer, startTime });
    }

    const center = renderer.getInteractionCenter?.() || { 
        x: renderer.width / 2, 
        y: renderer.height / 2 + STAGE.offsetY 
    };

    let t = startTime;

    // Create ghost copies for the animation
    // For array cells, display the value being transferred
    const sourceDisplayValue = value;
    const sourceGhost = createActorGhost(from, renderer, sourceDisplayValue);
    const targetGhost = createActorGhost(to, renderer, '?');

    if (!sourceGhost || !targetGhost) {
        console.warn('centerStageTransfer: Failed to create ghosts');
        return transfer(timeline, { from, to, value, renderer, startTime });
    }

    sourceGhost.x = fromPos.x;
    sourceGhost.y = fromPos.y;
    sourceGhost.alpha = 0;
    sourceGhost.scale.set(0.9);

    targetGhost.x = toPos.x;
    targetGhost.y = toPos.y;
    targetGhost.alpha = 0;
    targetGhost.scale.set(0.9);

    renderer.layers.effects.addChild(sourceGhost);
    renderer.layers.effects.addChild(targetGhost);

    // Stage positions
    const sourceStageX = center.x - STAGE.spacing;
    const targetStageX = center.x + STAGE.spacing;
    const stageY = center.y;

    // === PHASE 1: GRAB - Ghosts appear and lift ===
    timeline.to(sourceGhost, { alpha: 1, y: fromPos.y - STAGE.liftHeight, duration: TIMING.normal, ease: EASING.out }, t);
    timeline.to(sourceGhost.scale, { x: 1.1, y: 1.1, duration: TIMING.normal, ease: EASING.out }, t);
    timeline.to(targetGhost, { alpha: 1, y: toPos.y - STAGE.liftHeight, duration: TIMING.normal, ease: EASING.out }, t);
    timeline.to(targetGhost.scale, { x: 1.1, y: 1.1, duration: TIMING.normal, ease: EASING.out }, t);
    t += TIMING.normal;

    // === PHASE 2: TRAVEL TO CENTER ===
    timeline.to(sourceGhost, { x: sourceStageX, y: stageY, duration: TIMING.travel, ease: EASING.inOut }, t);
    timeline.to(targetGhost, { x: targetStageX, y: stageY, duration: TIMING.travel, ease: EASING.inOut }, t);
    t += TIMING.travel;

    // === PHASE 3: THE TRANSFER - Value moves from source to target ===
    // Create value bubble
    const bubble = renderer.createValueBubble(value);
    bubble.container.x = sourceStageX;
    bubble.container.y = stageY;
    bubble.container.alpha = 0;
    bubble.container.scale.set(0.5);

    // Bubble emerges from source
    timeline.to(bubble.container, { alpha: 1, duration: TIMING.fast, ease: EASING.out }, t);
    timeline.to(bubble.container.scale, { x: 1.2, y: 1.2, duration: TIMING.normal, ease: EASING.bounce }, t);
    
    // Source pulses as value leaves
    timeline.to(sourceGhost.scale, { x: 0.95, y: 0.95, duration: TIMING.emphasis, ease: EASING.in }, t);
    t += TIMING.normal;

    // Bubble travels to target (with slight arc)
    const arcY = stageY - 40;
    timeline.to(bubble.container, { x: center.x, y: arcY, duration: TIMING.travel * 0.4, ease: EASING.out }, t);
    t += TIMING.travel * 0.4;
    timeline.to(bubble.container, { x: targetStageX, y: stageY, duration: TIMING.travel * 0.4, ease: EASING.in }, t);
    t += TIMING.travel * 0.4;

    // Bubble absorbs into target
    timeline.to(bubble.container.scale, { x: 0.5, y: 0.5, duration: TIMING.fast, ease: EASING.in }, t);
    timeline.to(bubble.container, { alpha: 0, duration: TIMING.fast, ease: EASING.in }, t);
    
    // Target receives value - update ghost text and pulse
    timeline.call(() => {
        const textChild = targetGhost.children.find(c => c instanceof PIXI.Text);
        if (textChild) textChild.text = String(value);
    }, null, t);
    timeline.to(targetGhost.scale, { x: 1.15, y: 1.15, duration: TIMING.emphasis, ease: EASING.out }, t);
    timeline.to(targetGhost.scale, { x: 1.05, y: 1.05, duration: TIMING.emphasis, ease: EASING.bounce }, t + TIMING.emphasis);
    t += TIMING.emphasis * 2 + TIMING.hold;

    // Cleanup bubble
    timeline.call(() => bubble.container.destroy(), null, t);

    // === PHASE 4: RETURN TO HOME ===
    // Target returns first (it has the new value)
    timeline.to(targetGhost, { x: toPos.x, y: toPos.y, duration: TIMING.travel, ease: EASING.inOut }, t);
    timeline.to(sourceGhost, { x: fromPos.x, y: fromPos.y, duration: TIMING.travel, ease: EASING.inOut }, t + 0.1);
    t += TIMING.travel;

    // === PHASE 5: MERGE BACK ===
    // Update actual actor value
    timeline.call(() => {
        updateActorValue(to, value, renderer);
    }, null, t);

    // Ghosts fade into real actors
    timeline.to(sourceGhost, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.to(sourceGhost.scale, { x: 0.9, y: 0.9, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.to(targetGhost, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.to(targetGhost.scale, { x: 0.9, y: 0.9, duration: TIMING.normal, ease: EASING.in }, t);
    
    // Cleanup
    timeline.call(() => {
        sourceGhost.destroy({ children: true });
        targetGhost.destroy({ children: true });
    }, null, t + TIMING.normal);

    t += TIMING.normal + TIMING.hold;
    return t;
}

// Center stage comparison - brings both values to center for comparison
export function centerStageCompare(timeline, { left, right, operator, result, renderer, startTime = 0 }) {
    const leftPos = getActorValueCenter(left.actor, renderer);
    const rightPos = getActorValueCenter(right.actor, renderer);
    
    const center = renderer.getInteractionCenter?.() || { 
        x: renderer.width / 2, 
        y: renderer.height / 2 + STAGE.offsetY 
    };

    let t = startTime;

    // Create value ghosts
    const leftGhost = createValueBox(left.value, COLORS.primary);
    const rightGhost = createValueBox(right.value, COLORS.primary);

    leftGhost.x = leftPos?.x || center.x - 100;
    leftGhost.y = leftPos?.y || center.y;
    leftGhost.alpha = 0;
    leftGhost.scale.set(0.8);

    rightGhost.x = rightPos?.x || center.x + 100;
    rightGhost.y = rightPos?.y || center.y;
    rightGhost.alpha = 0;
    rightGhost.scale.set(0.8);

    renderer.layers.effects.addChild(leftGhost);
    renderer.layers.effects.addChild(rightGhost);

    // Operator text (appears at center)
    const opText = new PIXI.Text({
        text: operator || '>',
        style: { fontFamily: 'Inter', fontSize: 26, fill: COLORS.warning, fontWeight: 'bold' }
    });
    opText.anchor.set(0.5);
    opText.x = center.x;
    opText.y = center.y;
    opText.alpha = 0;
    opText.scale.set(0);
    renderer.layers.effects.addChild(opText);

    // Result indicator
    const resultColor = result ? COLORS.success : 0xef4444;
    const resultText = new PIXI.Text({
        text: result ? '✓ True' : '✗ False',
        style: { fontFamily: 'Inter', fontSize: 18, fill: resultColor, fontWeight: '600' }
    });
    resultText.anchor.set(0.5);
    resultText.x = center.x;
    resultText.y = center.y + 55;
    resultText.alpha = 0;
    resultText.scale.set(0.5);
    renderer.layers.effects.addChild(resultText);

    // === PHASE 1: GRAB values ===
    timeline.to(leftGhost, { alpha: 1, y: (leftPos?.y || center.y) - STAGE.liftHeight, duration: TIMING.normal, ease: EASING.out }, t);
    timeline.to(leftGhost.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.out }, t);
    timeline.to(rightGhost, { alpha: 1, y: (rightPos?.y || center.y) - STAGE.liftHeight, duration: TIMING.normal, ease: EASING.out }, t);
    timeline.to(rightGhost.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.out }, t);
    t += TIMING.normal;

    // === PHASE 2: TRAVEL to center ===
    timeline.to(leftGhost, { x: center.x - 60, y: center.y, duration: TIMING.travel, ease: EASING.inOut }, t);
    timeline.to(rightGhost, { x: center.x + 60, y: center.y, duration: TIMING.travel, ease: EASING.inOut }, t);
    t += TIMING.travel;

    // === PHASE 3: COMPARISON ===
    // Operator appears
    timeline.to(opText, { alpha: 1, duration: TIMING.fast, ease: EASING.out }, t);
    timeline.to(opText.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.snap }, t);
    t += TIMING.normal;

    // Values squeeze toward operator
    timeline.to(leftGhost, { x: center.x - 45, duration: TIMING.normal, ease: EASING.inOut }, t);
    timeline.to(rightGhost, { x: center.x + 45, duration: TIMING.normal, ease: EASING.inOut }, t);
    timeline.to(opText.scale, { x: 1.3, y: 1.3, duration: TIMING.emphasis, ease: EASING.out }, t);
    t += TIMING.emphasis;
    timeline.to(opText.scale, { x: 1, y: 1, duration: TIMING.emphasis, ease: EASING.bounce }, t);
    t += TIMING.emphasis + TIMING.hold;

    // Result appears
    timeline.to(resultText, { alpha: 1, duration: TIMING.fast, ease: EASING.out }, t);
    timeline.to(resultText.scale, { x: 1, y: 1, duration: TIMING.normal, ease: EASING.snap }, t);
    
    // Flash the winning side
    const winner = result ? leftGhost : rightGhost;
    const winnerColor = result ? 0x22c55e : 0xef4444;
    timeline.to(winner.scale, { x: 1.15, y: 1.15, duration: TIMING.emphasis, ease: EASING.out }, t);
    timeline.to(winner.scale, { x: 1, y: 1, duration: TIMING.emphasis, ease: EASING.bounce }, t + TIMING.emphasis);
    t += TIMING.normal + TIMING.hold * 2;

    // === PHASE 4: CLEANUP ===
    // Fade everything out
    timeline.to(leftGhost, { alpha: 0, y: center.y - 30, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.to(rightGhost, { alpha: 0, y: center.y - 30, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.to(opText, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, t);
    timeline.to(resultText, { alpha: 0, y: center.y + 40, duration: TIMING.normal, ease: EASING.in }, t);

    timeline.call(() => {
        leftGhost.destroy({ children: true });
        rightGhost.destroy({ children: true });
        opText.destroy();
        resultText.destroy();
    }, null, t + TIMING.normal);

    t += TIMING.normal + TIMING.hold;
    return t;
}

// Helper: Create a ghost copy of an actor for animation
function createActorGhost(actor, renderer, displayValue) {
    const container = new PIXI.Container();

    // Get actor name for label
    let actorName = '';
    if (typeof actor === 'string') {
        actorName = actor;
    } else if (actor?.array) {
        actorName = `${actor.array}[${actor.index}]`;
    }

    // Background
    const bg = new PIXI.Graphics();
    bg.roundRect(-40, -22, 80, 44, 8);
    bg.fill({ color: 0x1e293b, alpha: 0.95 });
    bg.stroke({ width: 2, color: COLORS.primary });
    container.addChild(bg);

    // Value text
    const valueText = new PIXI.Text({
        text: String(displayValue ?? '?'),
        style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 18,
            fill: COLORS.warning,
            fontWeight: 'bold'
        }
    });
    valueText.anchor.set(0.5);
    container.addChild(valueText);

    // Label above
    if (actorName) {
        const label = new PIXI.Text({
            text: actorName,
            style: {
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                fill: 0x94a3b8,
                fontWeight: '500'
            }
        });
        label.anchor.set(0.5);
        label.y = -32;
        container.addChild(label);
    }

    return container;
}

// ============================================
// 4️⃣ EMPHASIZE
// Draw attention without moving state
// Used for: loop iteration, highlight variable, array cell
// ============================================
export function emphasize(timeline, { actor, index, renderer, color = COLORS.primary, startTime = 0 }) {
    let t = startTime;

    console.log('✨ emphasize:', { actor, index });

    // Handle array cell emphasis: { actor: 'nums', index: 0 }
    if (typeof actor === 'string' && index !== undefined) {
        const arr = renderer.getArray?.(actor);
        console.log('  Array lookup:', actor, '→', arr ? 'found' : 'NOT FOUND');
        if (arr?.highlightCell) {
            timeline.call(() => {
                arr.highlightCell(index, color);
            }, null, t);
            
            // Clear highlight after emphasis
            timeline.call(() => {
                arr.clearHighlight?.();
            }, null, t + TIMING.emphasis * 2 + TIMING.hold);
            
            t += TIMING.emphasis * 2 + TIMING.hold;
            return t;
        }
    }

    // Handle regular actor emphasis
    const visual = resolveActor(actor, renderer);
    if (!visual?.container) return startTime;

    // Glow/pulse effect
    timeline.to(visual.container.scale, {
        x: 1.08, y: 1.08,
        duration: TIMING.emphasis,
        ease: EASING.out
    }, t);
    timeline.to(visual.container.scale, {
        x: 1, y: 1,
        duration: TIMING.emphasis,
        ease: EASING.bounce
    }, t + TIMING.emphasis);

    // Optional tint flash
    if (visual.container.tint !== undefined) {
        timeline.to(visual.container, { pixi: { tint: color }, duration: TIMING.fast }, t);
        timeline.to(visual.container, { pixi: { tint: 0xffffff }, duration: TIMING.normal }, t + TIMING.emphasis);
    }

    t += TIMING.emphasis * 2;
    return t;
}

// ============================================
// 5️⃣ SPAWN / DESPAWN
// Temporary visual appears/disappears
// Used for: overlay cards, labels, indicators
// ============================================
export function spawn(timeline, { container, x, y, renderer, startTime = 0, fromDirection = 'left' }) {
    renderer.layers.effects.addChild(container);

    const startX = fromDirection === 'left' ? x - 120 : (fromDirection === 'right' ? x + 120 : x);
    const startY = fromDirection === 'top' ? y - 80 : (fromDirection === 'bottom' ? y + 80 : y);

    container.x = startX;
    container.y = startY;
    container.alpha = 0;
    container.scale.set(0.8);

    let t = startTime;

    timeline.to(container, { x, y, alpha: 1, duration: TIMING.slow, ease: EASING.out }, t);
    timeline.to(container.scale, { x: 1, y: 1, duration: TIMING.slow, ease: EASING.bounce }, t);

    t += TIMING.slow;
    return t;
}

export function despawn(timeline, { container, renderer, startTime = 0, toDirection = 'fade' }) {
    let t = startTime;

    if (toDirection === 'fade') {
        timeline.to(container, { alpha: 0, duration: TIMING.normal, ease: EASING.in }, t);
    } else {
        const targetX = toDirection === 'left' ? container.x - 100 : (toDirection === 'right' ? container.x + 100 : container.x);
        timeline.to(container, { x: targetX, alpha: 0, duration: TIMING.normal, ease: EASING.in }, t);
    }

    timeline.call(() => {
        if (container.parent) container.parent.removeChild(container);
        container.destroy({ children: true });
    }, null, t + TIMING.normal);

    t += TIMING.normal;
    return t;
}

// ============================================
// 6️⃣ LAYOUT_RETURN
// Actors return to their home positions
// Used after: every interaction
// ============================================
export function layoutReturn(timeline, { actors, renderer, startTime = 0 }) {
    let t = startTime;

    actors.forEach(actor => {
        const visual = resolveActor(actor, renderer);
        if (!visual?.container || visual.homeX === undefined) return;

        timeline.to(visual.container, {
            x: visual.homeX,
            y: visual.homeY,
            duration: TIMING.slow,
            ease: EASING.inOut
        }, t);
        timeline.to(visual.container.scale, {
            x: 1, y: 1,
            duration: TIMING.slow,
            ease: EASING.out
        }, t);
    });

    t += TIMING.slow;
    return t;
}

// ============================================
// DECLARATIVE SEQUENCE PLAYER
// ============================================
/**
 * Play a sequence of transitions declaratively
 * 
 * Usage:
 *   playSequence(timeline, renderer, [
 *     { type: 'emphasize', actor: 'n' },
 *     { type: 'transfer', from: 'n', to: 'max_val', value: 5 },
 *     { type: 'despawn', container: overlay }
 *   ]);
 */
export function playSequence(timeline, renderer, steps, startTime = 0) {
    let t = startTime;

    for (const step of steps) {
        switch (step.type) {
            case 'transfer':
                // Use center stage for assignments (the "wow" animation)
                t = centerStageTransfer(timeline, { ...step, renderer, startTime: t });
                break;
            case 'simpleTransfer':
                // Simple transfer without center stage (for quick operations)
                t = transfer(timeline, { ...step, renderer, startTime: t });
                break;
            case 'transform':
                t = transform(timeline, { ...step, renderer, startTime: t });
                break;
            case 'compare':
                // Use center stage for comparisons
                t = centerStageCompare(timeline, { ...step, renderer, startTime: t });
                break;
            case 'simpleCompare':
                // Simple compare without center stage
                t = compare(timeline, { ...step, renderer, startTime: t });
                break;
            case 'emphasize':
                t = emphasize(timeline, { ...step, renderer, startTime: t });
                break;
            case 'spawn':
                t = spawn(timeline, { ...step, renderer, startTime: t });
                break;
            case 'despawn':
                t = despawn(timeline, { ...step, renderer, startTime: t });
                break;
            case 'layoutReturn':
                t = layoutReturn(timeline, { ...step, renderer, startTime: t });
                break;
            case 'wait':
                t += step.duration || TIMING.hold;
                break;
            default:
                console.warn('Unknown transition type:', step.type);
        }
    }

    return t;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function resolveActor(actor, renderer) {
    if (typeof actor === 'string') {
        return renderer.getVariable?.(actor) || renderer.getArray?.(actor);
    }
    return actor;
}

function getActorValueCenter(actor, renderer) {
    // Handle null/undefined (for direct value spawns)
    if (actor === null || actor === undefined) {
        // Spawn from center-top of interaction zone
        const center = renderer.getInteractionCenter?.() || { x: renderer.width / 2, y: renderer.height / 2 };
        return { x: center.x, y: center.y - 60 };
    }

    // Handle string actor names
    if (typeof actor === 'string') {
        // Try variable first
        const pos = renderer.getVariableValueBoxCenter?.(actor);
        if (pos) return pos;

        // Try array (center of array)
        const arr = renderer.getArray?.(actor);
        if (arr) {
            const global = arr.container.toGlobal(new PIXI.Point(arr.getVisualWidth() / 2, 20));
            return renderer.layers.effects.toLocal(global);
        }

        // Try return visual
        if (actor === '__return__') {
            return renderer.getReturnValueBoxCenter?.();
        }
    }

    // Handle array cell reference: { array: 'nums', index: 0 }
    if (actor?.array && actor?.index !== undefined) {
        const arr = renderer.getArray?.(actor.array);
        console.log('📍 getActorValueCenter for array cell:', actor, 'array found:', !!arr);
        if (arr) {
            const cellPos = arr.getCellPosition?.(actor.index);
            console.log('   cellPos:', cellPos);
            if (cellPos) {
                const global = arr.container.toGlobal(
                    new PIXI.Point(cellPos.x + cellPos.width / 2, cellPos.y + cellPos.height / 2)
                );
                const local = renderer.layers.effects.toLocal(global);
                console.log('   global:', global, 'local:', local);
                return local;
            }
        }
    }

    // Actor is already a visual object with container
    if (actor?.container) {
        const global = actor.container.toGlobal(new PIXI.Point(0, 0));
        return renderer.layers.effects.toLocal(global);
    }

    return null;
}

function updateActorValue(actor, value, renderer) {
    if (typeof actor === 'string') {
        const variable = renderer.getVariable?.(actor);
        if (variable) {
            variable.setValue(value, true);
            return;
        }

        if (actor === '__return__') {
            const rv = renderer.getReturnVisual?.();
            if (rv) rv.setValue(value);
            return;
        }
    }

    if (actor?.setValue) {
        actor.setValue(value, true);
    }
}

function createTextOverlay(text, renderer) {
    const container = new PIXI.Container();

    const label = new PIXI.Text({
        text: String(text),
        style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 18,
            fill: COLORS.text,
            fontWeight: '600'
        }
    });
    label.anchor.set(0.5);
    container.addChild(label);

    return container;
}

function createValueBox(value, borderColor = COLORS.border) {
    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.roundRect(-25, -18, 50, 36, 6);
    bg.fill(COLORS.bg);
    bg.stroke({ width: 2, color: borderColor });
    container.addChild(bg);

    const text = new PIXI.Text({
        text: String(value),
        style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 18,
            fill: COLORS.warning,
            fontWeight: 'bold'
        }
    });
    text.anchor.set(0.5);
    container.addChild(text);

    return container;
}

// ============================================
// EXPORTS
// ============================================
export default {
    transfer,
    transform,
    compare,
    emphasize,
    spawn,
    despawn,
    layoutReturn,
    centerStageTransfer,
    centerStageCompare,
    playSequence,
    TIMING,
    EASING
};
