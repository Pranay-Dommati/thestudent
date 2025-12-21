/**
 * DevSandbox - BEHAVIOR TESTING SCREEN
 * =====================================
 * 
 * ARCHITECTURE RULE:
 * - No real code runs here
 * - No backend involved
 * - Manually trigger behaviors with dummy values
 * - Test until it looks PROFESSIONAL
 * - Once satisfied → LOCK IT
 * 
 * Questions to answer:
 * ✓ Does this look serious?
 * ✓ Is it readable?
 * ✓ Is it fast enough?
 * ✓ Is it non-childish?
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { playBehavior, BehaviorRegistry } from './engine/BehaviorLibrary';
import './DevSandbox.css';

// ============================================
// TEST CASES FOR EACH BEHAVIOR
// ============================================
const TEST_CASES = {
    VALUE_UPDATE: [
        { label: 'Small → Small', params: { varName: 'x', oldValue: 3, newValue: 5 } },
        { label: 'Zero → Large', params: { varName: 'count', oldValue: 0, newValue: 99 } },
        { label: 'Negative', params: { varName: 'temp', oldValue: -5, newValue: 10 } },
        { label: 'Float', params: { varName: 'pi', oldValue: 3.14, newValue: 3.141 } },
    ],
    COMPARE: [
        { label: '3 > 5 (False)', params: { left: 3, right: 5, operator: '>', result: false } },
        { label: '10 > 3 (True)', params: { left: 10, right: 3, operator: '>', result: true } },
        { label: '5 == 5 (True)', params: { left: 5, right: 5, operator: '==', result: true } },
        { label: '7 != 7 (False)', params: { left: 7, right: 7, operator: '!=', result: false } },
        { label: '99 < 1 (False)', params: { left: 99, right: 1, operator: '<', result: false } },
        { label: '1 <= 1 (True)', params: { left: 1, right: 1, operator: '<=', result: true } },
    ],
    ASSIGN_FROM: [
        { label: 'x = y (5)', params: { sourceValue: 5 } },
        { label: 'Large value', params: { sourceValue: 999 } },
        { label: 'Zero', params: { sourceValue: 0 } },
        { label: 'Negative', params: { sourceValue: -42 } },
    ],
    HIGHLIGHT_ARRAY_INDEX: [
        { label: 'Index 0', params: { index: 0, value: 10 } },
        { label: 'Index 3', params: { index: 3, value: 55 } },
        { label: 'Index 5', params: { index: 5, value: 88 } },
    ],
    LOOP_ADVANCE: [
        { label: 'Iteration 1', params: { iteration: 1 } },
        { label: 'Iteration 5', params: { iteration: 5 } },
        { label: 'Iteration 10', params: { iteration: 10 } },
    ],
    RETURN_VALUE: [
        { label: 'Return 42', params: { value: 42 } },
        { label: 'Return 0', params: { value: 0 } },
        { label: 'Return -1', params: { value: -1 } },
        { label: 'Return True', params: { value: 'True' } },
    ],
};

// ============================================
// DEV SANDBOX COMPONENT
// ============================================
export default function DevSandbox() {
    const canvasRef = useRef(null);
    const appRef = useRef(null);
    const layerRef = useRef(null);
    
    const [selectedBehavior, setSelectedBehavior] = useState('COMPARE');
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastPlayed, setLastPlayed] = useState(null);
    
    // Initialize PixiJS
    useEffect(() => {
        const initPixi = async () => {
            if (!canvasRef.current || appRef.current) return;
            
            const app = new PIXI.Application();
            await app.init({
                canvas: canvasRef.current,
                width: 600,
                height: 400,
                backgroundColor: 0x0f172a, // Dark slate
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });
            
            appRef.current = app;
            
            // Create animation layer
            const layer = new PIXI.Container();
            app.stage.addChild(layer);
            layerRef.current = layer;
            
            // Add grid for reference
            drawGrid(app.stage);
            
            // Add zone labels
            addZoneLabels(app.stage);
        };
        
        initPixi();
        
        return () => {
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
        };
    }, []);
    
    // Draw reference grid
    const drawGrid = (stage) => {
        const grid = new PIXI.Graphics();
        grid.alpha = 0.1;
        
        // Vertical lines
        for (let x = 0; x <= 600; x += 50) {
            grid.moveTo(x, 0);
            grid.lineTo(x, 400);
        }
        
        // Horizontal lines
        for (let y = 0; y <= 400; y += 50) {
            grid.moveTo(0, y);
            grid.lineTo(600, y);
        }
        
        grid.stroke({ width: 1, color: 0x475569 });
        stage.addChildAt(grid, 0);
    };
    
    // Add zone reference labels
    const addZoneLabels = (stage) => {
        const labels = [
            { text: 'CENTER', x: 300, y: 200 },
        ];
        
        labels.forEach(({ text, x, y }) => {
            const label = new PIXI.Text({
                text,
                style: new PIXI.TextStyle({
                    fontFamily: 'sans-serif',
                    fontSize: 10,
                    fill: 0x475569,
                })
            });
            label.anchor.set(0.5);
            label.x = x;
            label.y = y;
            stage.addChildAt(label, 1);
        });
        
        // Crosshair at center
        const crosshair = new PIXI.Graphics();
        crosshair.moveTo(290, 200);
        crosshair.lineTo(310, 200);
        crosshair.moveTo(300, 190);
        crosshair.lineTo(300, 210);
        crosshair.stroke({ width: 1, color: 0x6366f1 });
        stage.addChildAt(crosshair, 1);
    };
    
    // Clear animation layer
    const clearLayer = useCallback(() => {
        if (layerRef.current) {
            layerRef.current.removeChildren();
        }
    }, []);
    
    // Play a behavior with test params
    const handlePlayBehavior = useCallback((testCase) => {
        if (!layerRef.current || isPlaying) return;
        
        clearLayer();
        setIsPlaying(true);
        setLastPlayed({ behavior: selectedBehavior, testCase });
        
        // Build full params with position
        const fullParams = {
            ...testCase.params,
            position: { x: 300, y: 200 }, // Center of canvas
        };
        
        // For ASSIGN_FROM, add source/target positions
        if (selectedBehavior === 'ASSIGN_FROM') {
            fullParams.sourcePosition = { x: 150, y: 200 };
            fullParams.targetPosition = { x: 450, y: 200 };
        }
        
        // For HIGHLIGHT_ARRAY_INDEX, add array position
        if (selectedBehavior === 'HIGHLIGHT_ARRAY_INDEX') {
            fullParams.arrayPosition = { x: 100, y: 180 };
        }
        
        playBehavior(
            selectedBehavior,
            layerRef.current,
            fullParams,
            () => setIsPlaying(false)
        );
    }, [selectedBehavior, isPlaying, clearLayer]);
    
    // Play random test case
    const playRandom = useCallback(() => {
        const testCases = TEST_CASES[selectedBehavior];
        const randomCase = testCases[Math.floor(Math.random() * testCases.length)];
        handlePlayBehavior(randomCase);
    }, [selectedBehavior, handlePlayBehavior]);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                playRandom();
            }
            if (e.key === 'c' || e.key === 'C') {
                clearLayer();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playRandom, clearLayer]);
    
    return (
        <div className="dev-sandbox">
            <header className="dev-sandbox__header">
                <h1>🧪 Behavior Sandbox</h1>
                <p>Test visual behaviors with dummy values. Space/Enter = play random, C = clear</p>
            </header>
            
            <div className="dev-sandbox__main">
                {/* Sidebar - Behavior Selection */}
                <aside className="dev-sandbox__sidebar">
                    <h2>Behaviors</h2>
                    <div className="behavior-list">
                        {Object.keys(BehaviorRegistry).map(behaviorId => (
                            <button
                                key={behaviorId}
                                className={`behavior-btn ${selectedBehavior === behaviorId ? 'active' : ''}`}
                                onClick={() => setSelectedBehavior(behaviorId)}
                            >
                                {behaviorId}
                            </button>
                        ))}
                    </div>
                    
                    <h2>Test Cases</h2>
                    <div className="test-cases">
                        {TEST_CASES[selectedBehavior]?.map((testCase, i) => (
                            <button
                                key={i}
                                className={`test-case-btn ${isPlaying ? 'disabled' : ''}`}
                                onClick={() => handlePlayBehavior(testCase)}
                                disabled={isPlaying}
                            >
                                {testCase.label}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        className="random-btn"
                        onClick={playRandom}
                        disabled={isPlaying}
                    >
                        🎲 Play Random
                    </button>
                    
                    <button 
                        className="clear-btn"
                        onClick={clearLayer}
                    >
                        🗑️ Clear
                    </button>
                </aside>
                
                {/* Canvas */}
                <div className="dev-sandbox__canvas-container">
                    <canvas ref={canvasRef} />
                    
                    {isPlaying && (
                        <div className="playing-indicator">
                            ▶ Playing...
                        </div>
                    )}
                </div>
                
                {/* Info Panel */}
                <aside className="dev-sandbox__info">
                    <h2>Quality Check</h2>
                    <div className="quality-checklist">
                        <label>
                            <input type="checkbox" /> Looks serious (not childish)
                        </label>
                        <label>
                            <input type="checkbox" /> Readable values
                        </label>
                        <label>
                            <input type="checkbox" /> Good timing
                        </label>
                        <label>
                            <input type="checkbox" /> Smooth motion
                        </label>
                        <label>
                            <input type="checkbox" /> Clear result
                        </label>
                    </div>
                    
                    {lastPlayed && (
                        <div className="last-played">
                            <h3>Last Played</h3>
                            <code>
                                playBehavior("{lastPlayed.behavior}", {'{'}
                                {JSON.stringify(lastPlayed.testCase.params, null, 2)}
                                {'}'})
                            </code>
                        </div>
                    )}
                    
                    <div className="instructions">
                        <h3>How to Use</h3>
                        <ol>
                            <li>Select a behavior</li>
                            <li>Click test cases or play random</li>
                            <li>Check quality boxes</li>
                            <li>If all ✓ → behavior is LOCKED</li>
                            <li>If any ✗ → refine in BehaviorLibrary.js</li>
                        </ol>
                    </div>
                </aside>
            </div>
        </div>
    );
}
