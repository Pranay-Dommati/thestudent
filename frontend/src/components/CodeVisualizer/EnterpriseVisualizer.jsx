/**
 * EnterpriseVisualizer - React Component
 * 
 * This is the ONLY React component that touches the animation engine.
 * It provides:
 * - A container for the PixiJS canvas
 * - Playback controls (play/pause/seek/speed)
 * - Step indicator UI
 * 
 * React does NOT control the animations - it only provides the UI shell.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createTimelineEngine } from './engine/TimelineEngine';
import { createPixiRenderer } from './engine/PixiRenderer';

// Playback control icons as SVG
const Icons = {
    Play: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>
    ),
    Pause: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
        </svg>
    ),
    Restart: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
        </svg>
    ),
    SkipBack: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="19,20 9,12 19,4"/>
            <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/>
        </svg>
    ),
    SkipForward: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,4 15,12 5,20"/>
            <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2"/>
        </svg>
    ),
    Expand: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,3 21,3 21,9"/>
            <polyline points="9,21 3,21 3,15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
    )
};

const EnterpriseVisualizer = ({ 
    steps = [], 
    code = '',
    onStepChange,
    className = ''
}) => {
    // Refs for engine instances (not React state)
    const containerRef = useRef(null);
    const engineRef = useRef(null);
    const rendererRef = useRef(null);
    const isInitializedRef = useRef(false);
    const isMountedRef = useRef(true);
    
    // UI State only
    const [uiState, setUiState] = useState({
        isPlaying: false,
        currentStep: -1,
        totalSteps: 0,
        progress: 0,
        duration: 0,
        speed: 1,
        stepByStepMode: true
    });
    const [isReady, setIsReady] = useState(false);
    const [initError, setInitError] = useState(null);

    // Initialize engine and renderer
    useEffect(() => {
        isMountedRef.current = true;
        
        if (!containerRef.current || isInitializedRef.current) return;
        
        const initializeEngine = async () => {
            try {
                const container = containerRef.current;
                if (!container || !isMountedRef.current) return;
                
                const width = container.clientWidth || 800;
                const height = container.clientHeight || 500;
                
                // Create renderer
                rendererRef.current = createPixiRenderer();
                await rendererRef.current.initialize(container, width, height);
                
                if (!isMountedRef.current) {
                    rendererRef.current?.destroy();
                    return;
                }
                
                // Create timeline engine
                engineRef.current = createTimelineEngine();
                
                // Wire up callbacks
                engineRef.current.onStateChange = (state) => {
                    if (!isMountedRef.current) return;
                    setUiState(prev => ({
                        ...prev,
                        isPlaying: state.isPlaying,
                        currentStep: state.currentStepIndex,
                        totalSteps: state.totalSteps,
                        progress: state.progress,
                        duration: state.duration,
                        stepByStepMode: state.stepByStepMode ?? true
                    }));
                };
                
                engineRef.current.onStepChange = (index, step) => {
                    if (isMountedRef.current) {
                        onStepChange?.(index, step);
                    }
                };
                
                isInitializedRef.current = true;
                if (isMountedRef.current) {
                    setIsReady(true);
                    console.log('🎬 Enterprise Visualizer initialized');
                }
            } catch (err) {
                console.error('Failed to initialize visualizer:', err);
                if (isMountedRef.current) {
                    setInitError(err.message);
                }
            }
        };
        
        initializeEngine();
        
        // Cleanup
        return () => {
            isMountedRef.current = false;
            isInitializedRef.current = false;
            
            if (engineRef.current) {
                try {
                    engineRef.current.dispose();
                } catch (e) {
                    console.warn('Error disposing engine:', e);
                }
                engineRef.current = null;
            }
            
            if (rendererRef.current) {
                try {
                    rendererRef.current.destroy();
                } catch (e) {
                    console.warn('Error destroying renderer:', e);
                }
                rendererRef.current = null;
            }
        };
    }, []);

    // Load steps when they change
    useEffect(() => {
        if (!isReady || !steps.length || !isMountedRef.current) return;
        
        // Reset renderer state
        rendererRef.current?.reset();
        
        // Initialize timeline with steps
        engineRef.current?.initialize(steps, rendererRef.current);

        // Seed pre-run snapshot (inputs like nums) so Start screen isn't empty
        rendererRef.current?.seedInitialStateFromSteps(steps);
        
        console.log(`📊 Loaded ${steps.length} steps into timeline`);
    }, [steps, isReady]);

    // Handle resize
    useEffect(() => {
        if (!isReady) return;
        
        const container = containerRef.current;
        if (!container) return;
        
        const handleResize = () => {
            if (!isMountedRef.current || !containerRef.current || !rendererRef.current) return;
            
            const width = containerRef.current.clientWidth || 800;
            const height = containerRef.current.clientHeight || 500;
            rendererRef.current.resize(width, height);
        };
        
        const observer = new ResizeObserver(handleResize);
        observer.observe(container);
        
        return () => {
            observer.disconnect();
        };
    }, [isReady]);

    // Playback controls - these just call engine methods
    const handlePlay = useCallback(() => {
        if (uiState.stepByStepMode) {
            // In step-by-step mode, play button advances to next step
            engineRef.current?.playNextStep();
        } else if (uiState.isPlaying) {
            engineRef.current?.pause();
        } else {
            engineRef.current?.play();
        }
    }, [uiState.isPlaying, uiState.stepByStepMode]);

    const handleRestart = useCallback(() => {
        engineRef.current?.restart();
    }, []);

    const handlePrevStep = useCallback(() => {
        engineRef.current?.playPreviousStep();
    }, []);

    const handleNextStep = useCallback(() => {
        engineRef.current?.playNextStep();
    }, []);

    const handleSeek = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const time = progress * uiState.duration;
        engineRef.current?.seek(time);
    }, [uiState.duration]);

    const handleSpeedChange = useCallback((speed) => {
        engineRef.current?.setSpeed(speed);
        setUiState(prev => ({ ...prev, speed }));
    }, []);

    const handleStepClick = useCallback((index) => {
        engineRef.current?.goToStep(index);
        // Don't auto-play, user must click next
    }, []);

    const handleToggleMode = useCallback(() => {
        const newMode = !uiState.stepByStepMode;
        engineRef.current?.setStepByStepMode(newMode);
        setUiState(prev => ({ ...prev, stepByStepMode: newMode }));
    }, [uiState.stepByStepMode]);

    return (
        <div className={`flex flex-col bg-slate-900 rounded-xl overflow-hidden ${className}`}>
            {/* Canvas Container */}
            <div 
                ref={containerRef}
                className="relative w-full h-[500px] bg-slate-900"
            >
                {/* Error State */}
                {initError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
                        <div className="flex flex-col items-center gap-4 text-center p-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" y1="9" x2="9" y2="15"/>
                                    <line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Visualization Error</h3>
                                <p className="text-slate-400 text-sm max-w-md">{initError}</p>
                            </div>
                            <p className="text-xs text-slate-500">Try switching to Timeline mode</p>
                        </div>
                    </div>
                )}
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-400 text-sm">Initializing visualizer...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/50 border-t border-slate-700">
                {/* Playback Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRestart}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Restart"
                    >
                        <Icons.Restart />
                    </button>
                    
                    <button
                        onClick={handlePrevStep}
                        disabled={uiState.currentStep <= 0 && uiState.currentStep !== 0}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Previous Step"
                    >
                        <Icons.SkipBack />
                    </button>
                    
                    {/* Main Action Button - Shows "Next" in step mode, Play/Pause otherwise */}
                    <button
                        onClick={handleNextStep}
                        disabled={uiState.isPlaying || uiState.currentStep >= uiState.totalSteps - 1}
                        className={`group relative px-5 py-3 rounded-xl font-semibold text-white transition-all ${
                            uiState.isPlaying 
                                ? 'bg-amber-500 hover:bg-amber-400' 
                                : uiState.currentStep >= uiState.totalSteps - 1
                                    ? 'bg-slate-600 cursor-not-allowed'
                                    : 'bg-teal-500 hover:bg-teal-400 hover:scale-105'
                        }`}
                        title={uiState.currentStep >= uiState.totalSteps - 1 ? 'Complete' : 'Next Step'}
                    >
                        <div className="flex items-center gap-2">
                            {uiState.isPlaying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Running...</span>
                                </>
                            ) : uiState.currentStep >= uiState.totalSteps - 1 ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20,6 9,17 4,12"/>
                                    </svg>
                                    <span>Complete</span>
                                </>
                            ) : uiState.currentStep === -1 ? (
                                <>
                                    <Icons.Play />
                                    <span>Start</span>
                                </>
                            ) : (
                                <>
                                    <Icons.SkipForward />
                                    <span>Next</span>
                                </>
                            )}
                        </div>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 flex items-center gap-3">
                    <div 
                        className="flex-1 h-2 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
                        onClick={handleSeek}
                    >
                        <div 
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all"
                            style={{ width: `${uiState.progress * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Counter */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Step</span>
                    <span className="font-mono text-teal-400 font-bold">
                        {uiState.currentStep >= 0 ? uiState.currentStep + 1 : 0}
                    </span>
                    <span className="text-slate-500">/</span>
                    <span className="font-mono text-slate-400">
                        {uiState.totalSteps}
                    </span>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-1">
                    {[0.5, 1, 1.5, 2].map(speed => (
                        <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                                uiState.speed === speed 
                                    ? 'bg-teal-500 text-white' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Step Timeline */}
            {uiState.totalSteps > 0 && (
                <div className="flex gap-1 p-3 bg-slate-800/30 border-t border-slate-700 overflow-x-auto">
                    {Array.from({ length: uiState.totalSteps }).map((_, index) => {
                        const step = steps[index];
                        const isActive = index === uiState.currentStep;
                        const isCompleted = index < uiState.currentStep;
                        
                        return (
                            <button
                                key={index}
                                onClick={() => handleStepClick(index)}
                                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                                    isActive 
                                        ? 'bg-teal-500 text-white scale-105 shadow-lg shadow-teal-500/30' 
                                        : isCompleted
                                            ? 'bg-slate-700 text-slate-300'
                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                                        isActive ? 'bg-white/20' : 'bg-slate-600'
                                    }`}>
                                        {index + 1}
                                    </span>
                                    <span className="max-w-[100px] truncate">
                                        {step?.code?.trim().substring(0, 20) || `Step ${index + 1}`}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EnterpriseVisualizer;
