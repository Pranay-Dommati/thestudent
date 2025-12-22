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
    ASSIGN_FROM_ARRAY_INDEX: [
        { label: 'max_val = nums[0]', params: { arrayName: 'nums', arrayValues: [4, 5], index: 0, varName: 'max_val', oldValue: '—' } },
        { label: 'max_val = nums[1]', params: { arrayName: 'nums', arrayValues: [4, 5], index: 1, varName: 'max_val', oldValue: '—' } },
        { label: 'n = arr[3] (longer)', params: { arrayName: 'arr', arrayValues: [5, 6, 10, 13, 56, 76, 1, 2, 4, 8], index: 3, varName: 'n', oldValue: '—' } },
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
        { label: 'Index 0 (first)', params: { arrayName: 'a', arrayValues: [5, 6, 10, 13, 56, 76, 1, 2, 4, 8], index: 0 } },
        { label: 'Index 3 (middle)', params: { arrayName: 'nums', arrayValues: [5, 6, 10, 13, 56, 76, 1, 2, 4, 8], index: 3 } },
        { label: 'Index 9 (last)', params: { arrayName: 'arr', arrayValues: [5, 6, 10, 13, 56, 76, 1, 2, 4, 8], index: 9 } },
        { label: 'Small array [0]', params: { arrayName: 'x', arrayValues: [4, 5], index: 0 } },
        { label: 'Small array [1]', params: { arrayName: 'x', arrayValues: [4, 5], index: 1 } },
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
    const mountedRef = useRef(true);
    
    const [selectedBehavior, setSelectedBehavior] = useState('COMPARE');
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastPlayed, setLastPlayed] = useState(null);
    const [isReady, setIsReady] = useState(false);
    
    // Initialize PixiJS
    useEffect(() => {
        mountedRef.current = true;
        let app = null;
        
        const initPixi = async () => {
            // Wait a tick to ensure canvas is mounted
            await new Promise(resolve => setTimeout(resolve, 0));
            
            if (!mountedRef.current || !canvasRef.current) return;
            
            // Destroy any existing app first
            if (appRef.current) {
                try {
                    appRef.current.destroy(true, { children: true });
                } catch (e) {
                    console.warn('Error destroying previous Pixi app:', e);
                }
                appRef.current = null;
                layerRef.current = null;
            }
            
            try {
                app = new PIXI.Application();
                await app.init({
                    canvas: canvasRef.current,
                    width: 700,
                    height: 300,
                    backgroundColor: 0x0f172a, // Dark slate
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true
                });
                
                // Check if still mounted after async init
                if (!mountedRef.current) {
                    app.destroy(true, { children: true });
                    return;
                }
                
                appRef.current = app;
                
                // Create animation layer
                const layer = new PIXI.Container();
                app.stage.addChild(layer);
                layerRef.current = layer;
                
                // Add grid for reference
                drawGrid(app.stage);
                
                setIsReady(true);
            } catch (error) {
                console.error('Failed to initialize PixiJS:', error);
            }
        };
        
        initPixi();
        
        return () => {
            mountedRef.current = false;
            setIsReady(false);
            
            if (appRef.current) {
                try {
                    appRef.current.destroy(true, { children: true });
                } catch (e) {
                    console.warn('Error during Pixi cleanup:', e);
                }
                appRef.current = null;
                layerRef.current = null;
            }
        };
    }, []);
    
    // Draw reference grid
    const drawGrid = (stage) => {
        const grid = new PIXI.Graphics();
        grid.alpha = 0.1;
        
        // Vertical lines
        for (let x = 0; x <= 700; x += 50) {
            grid.moveTo(x, 0);
            grid.lineTo(x, 300);
        }
        
        // Horizontal lines
        for (let y = 0; y <= 300; y += 50) {
            grid.moveTo(0, y);
            grid.lineTo(700, y);
        }
        
        grid.stroke({ width: 1, color: 0x475569 });
        stage.addChildAt(grid, 0);
    };
    

    
    // Clear animation layer
    const clearLayer = useCallback(() => {
        if (layerRef.current) {
            layerRef.current.removeChildren();
        }
    }, []);
    
    // Play a behavior with test params
    const handlePlayBehavior = useCallback((testCase) => {
        if (!layerRef.current || !isReady || isPlaying) return;
        
        clearLayer();
        setIsPlaying(true);
        setLastPlayed({ behavior: selectedBehavior, testCase });
        
        // Build full params with position
        const fullParams = {
            ...testCase.params,
            position: { x: 350, y: 150 }, // Center of canvas
        };
        
        // For ASSIGN_FROM, add source/target positions
        if (selectedBehavior === 'ASSIGN_FROM') {
            fullParams.sourcePosition = { x: 200, y: 150 };
            fullParams.targetPosition = { x: 500, y: 150 };
        }
        
        // For HIGHLIGHT_ARRAY_INDEX, position is already handled (uses position for center)
        
        playBehavior(
            selectedBehavior,
            layerRef.current,
            fullParams,
            () => {
                if (mountedRef.current) {
                    setIsPlaying(false);
                }
            }
        );
    }, [selectedBehavior, isPlaying, isReady, clearLayer]);
    
    // Play random test case
    const playRandom = useCallback(() => {
        if (!isReady) return;
        const testCases = TEST_CASES[selectedBehavior];
        const randomCase = testCases[Math.floor(Math.random() * testCases.length)];
        handlePlayBehavior(randomCase);
    }, [selectedBehavior, handlePlayBehavior, isReady]);
    
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
