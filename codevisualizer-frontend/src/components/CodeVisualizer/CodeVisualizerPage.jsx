import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUserCircle } from 'react-icons/fa';

import CodeEditor from './CodeEditor';
import InputModal from './InputModal';
import ImmersiveVisualizer from './ImmersiveVisualizer';
import { ConstraintAwareGenerator } from './engine/InputGenerator';
import './CodeVisualizer.css';

// API Base URL - uses Django backend visualizer API
// In development: http://localhost:8000/api/visualizer
// In production: uses relative URL through VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/visualizer`
    : 'http://localhost:8000/api/visualizer';

function CodeVisualizerPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, loading } = useAuth();
    const [code, setCode] = useState('');
    const [autoGenerateInput, setAutoGenerateInput] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [steps, setSteps] = useState([]);
    const [executionId, setExecutionId] = useState(null);  // ENTERPRISE: Backend session ID
    const [error, setError] = useState(null);

    // Input modal state
    const [showInputModal, setShowInputModal] = useState(false);
    const [detectedInputs, setDetectedInputs] = useState([]);
    const [codeMetadata, setCodeMetadata] = useState(null);
    const [hasInputsRequired, setHasInputsRequired] = useState(null);  // null = unknown, true/false = detected

    // Immersive visualizer state
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [isLoadingTrace, setIsLoadingTrace] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState(0);

    // Banner state
    const [showBetaBanner, setShowBetaBanner] = useState(true);

    // Input generator instance (memoized)
    const inputGenerator = useMemo(() => new ConstraintAwareGenerator(), []);

    // Detect inputs in the code
    const detectInputs = useCallback(async (codeToCheck) => {
        console.log('detectInputs: Starting fetch to', `${API_BASE_URL}/detect-inputs/`);
        try {
            const response = await fetch(`${API_BASE_URL}/detect-inputs/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToCheck })
            });

            console.log('detectInputs: Response status:', response.status);
            const data = await response.json();
            console.log('detectInputs: Data received:', data);
            return data;
        } catch (err) {
            console.error('detectInputs: Failed:', err);
            return { hasInputs: false, inputs: [], count: 0, codeType: 'script' };
        }
    }, []);

    // Detect inputs when code changes (debounced) to update toggle visibility
    useEffect(() => {
        if (!code.trim()) {
            setHasInputsRequired(null);  // Unknown when no code
            return;
        }

        const timeoutId = setTimeout(async () => {
            const result = await detectInputs(code);
            setHasInputsRequired(result.hasInputs && result.count > 0);
        }, 150);  // 150ms debounce - fast detection

        return () => clearTimeout(timeoutId);
    }, [code, detectInputs]);

    // Run the actual trace with streaming
    const runTrace = useCallback(async (inputValues = [], metadata = null) => {
        setIsRunning(true);
        setError(null);
        setShowInputModal(false);

        // Open immersive visualizer immediately with loading state
        setShowVisualizer(true);
        setIsLoadingTrace(true);
        setSteps([]);
        setExecutionId(null);  // ENTERPRISE: Reset for new trace

        const meta = metadata || codeMetadata;

        // Animate through loading phases
        setLoadingPhase(1); // Reading code
        await new Promise(resolve => setTimeout(resolve, 400));
        setLoadingPhase(2); // Analyzing
        await new Promise(resolve => setTimeout(resolve, 400));
        setLoadingPhase(3); // Preparing

        try {
            // Prefer SSE streaming to reduce perceived latency
            const response = await fetch(`${API_BASE_URL}/trace-stream/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({
                    code: code,
                    inputs: inputValues,
                    codeType: meta?.codeType || 'script',
                    functionName: meta?.functionName || null,
                    className: meta?.className || null,
                    inputTypes: meta?.inputs?.map(i => i.type) || []
                })
            });

            // Check if it's a streaming response
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('text/event-stream')) {
                // Handle streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let receivedFirstFrame = false;

                let silenceTimeout = null;
                const resetSilenceTimeout = () => {
                    if (silenceTimeout) clearTimeout(silenceTimeout);
                    silenceTimeout = setTimeout(() => {
                        console.log('[SSE] Silence timeout - no data for 5s. Closing stream.');
                        reader.cancel();
                        setIsLoadingTrace(false);
                        setIsRunning(false);
                        setSteps(prev => {
                            // If we have steps, assume success
                            if (prev.length > 0) return prev;
                            return prev;
                        });
                    }, 30000);
                };

                while (true) {
                    resetSilenceTimeout();
                    const { done, value } = await reader.read();

                    if (done) {
                        if (silenceTimeout) clearTimeout(silenceTimeout);
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // Process complete SSE messages
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || ''; // Keep incomplete message in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.type === 'error') {
                                    if (silenceTimeout) clearTimeout(silenceTimeout);
                                    setError(data.error);
                                    setSteps([]);
                                    setShowVisualizer(false);
                                    setIsLoadingTrace(false);
                                    setIsRunning(false);
                                    return;
                                }

                                if (data.type === 'metadata') {
                                    setLoadingPhase(4); // Starting
                                }

                                if (data.type === 'frame') {
                                    // Stop loading state on first frame
                                    if (!receivedFirstFrame) {
                                        receivedFirstFrame = true;
                                        setIsLoadingTrace(false);
                                    }

                                    const frame = data.frame;
                                    console.log(`[SSE] Frame received: Line ${frame.line} | Code: ${frame.code.trim()}`);
                                    const transformedStep = {
                                        lineNumber: frame.line,
                                        code: frame.code,
                                        explanation: frame.explanation,
                                        variables: frame.locals,
                                        changedVars: frame.changed_vars || [],
                                        computed_values: frame.computed_values,
                                        event: frame.event,
                                        functionName: frame.function_name,
                                        output: frame.output,
                                        // SSOT: Deterministic dry-run from tracer
                                        dry_run: frame.dry_run,
                                        loop_info: frame.loop_info,
                                        var_transitions: frame.var_transitions  // For showing value transitions
                                    };

                                    // Add step progressively
                                    setSteps(prev => [...prev, transformedStep]);
                                }

                                if (data.type === 'complete') {
                                    console.log('[SSE] Complete message received. Total frames:', data.totalFrames, 'ExecutionId:', data.executionId);
                                    // ENTERPRISE: Store execution ID for on-demand requests
                                    if (data.executionId) {
                                        setExecutionId(data.executionId);
                                    }
                                    // All frames received
                                    if (silenceTimeout) clearTimeout(silenceTimeout);
                                    setIsLoadingTrace(false);
                                    setIsRunning(false);
                                }

                                // DETERMINISTIC TRANSITION ENGINE: Update frames with transitions
                                // Transitions are computed post-execution by comparing consecutive locals
                                if (data.type === 'transition') {
                                    const { index, var_transitions } = data;
                                    console.log(`[SSE] Transition update for frame ${index}:`, var_transitions);
                                    setSteps(prev => {
                                        const updated = [...prev];
                                        if (updated[index]) {
                                            updated[index] = {
                                                ...updated[index],
                                                var_transitions: var_transitions
                                            };
                                        }
                                        return updated;
                                    });
                                }
                            } catch (parseError) {
                                console.error('Failed to parse SSE data:', parseError);
                            }
                        }
                    }
                }
                if (silenceTimeout) clearTimeout(silenceTimeout);

                console.log('[SSE] Stream loop exited. Buffer size:', buffer.length);

                // Process any remaining data in buffer after stream ends
                if (buffer.trim() && buffer.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(buffer.slice(6));

                        if (data.type === 'complete') {
                            setIsLoadingTrace(false);
                            setIsRunning(false);
                        } else if (data.type === 'frame') {
                            const frame = data.frame;
                            setSteps(prev => [...prev, {
                                lineNumber: frame.line,
                                code: frame.code,
                                explanation: frame.explanation,
                                variables: frame.locals,
                                changedVars: frame.changed_vars || [],
                                event: frame.event,
                                functionName: frame.function_name,
                                output: frame.output
                            }]);
                            // Implicitly done if this was the last frame
                            setIsLoadingTrace(false);
                            setIsRunning(false);
                        }
                    } catch (e) {
                        // Ignore parse errors for incomplete buffer
                    }
                }

                // Safety: Ensure loading states are cleared after stream ends
                setIsLoadingTrace(false);
                setIsRunning(false);
            } else {
                // Fall back to regular JSON response
                const fallback = await fetch(`${API_BASE_URL}/trace/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: code,
                        inputs: inputValues,
                        codeType: meta?.codeType || 'script',
                        functionName: meta?.functionName || null,
                        className: meta?.className || null,
                        inputTypes: meta?.inputs?.map(i => i.type) || []
                    })
                });

                const data = await fallback.json();

                setLoadingPhase(4); // Starting
                await new Promise(resolve => setTimeout(resolve, 300));

                if (data.success && data.frames && data.frames.length > 0) {
                    const transformedSteps = data.frames.map(frame => ({
                        lineNumber: frame.line,
                        code: frame.code,
                        explanation: frame.explanation,
                        variables: frame.locals,
                        changedVars: frame.changed_vars || [],
                        event: frame.event,
                        functionName: frame.function_name,
                        output: data.output,
                        // SSOT: Deterministic dry-run from tracer
                        dry_run: frame.dry_run,
                        loop_info: frame.loop_info
                    }));

                    setSteps(transformedSteps);
                    setIsLoadingTrace(false);
                } else {
                    setError(data.error || 'Failed to trace code');
                    setSteps([]);
                    setShowVisualizer(false);
                    setIsLoadingTrace(false);
                }
            }
        } catch (err) {
            setError(`Connection error: ${err.message}. Make sure the backend is running.`);
            setSteps([]);
            setShowVisualizer(false);
            setIsLoadingTrace(false);
        } finally {
            setIsRunning(false);
        }
    }, [code, codeMetadata]);

    // Generate inputs using AI (primary) or local generator (fallback)
    const generateInputsWithAI = useCallback(async (codeToAnalyze, inputDetection) => {
        console.log('🤖 Attempting AI-powered input generation...');

        try {
            const response = await fetch(`${API_BASE_URL}/generate-inputs/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: codeToAnalyze,
                    inputs: inputDetection.inputs
                })
            });

            const data = await response.json();
            console.log('AI generation response:', data);

            if (data.success && data.inputs) {
                console.log('✅ AI generated inputs:', data.inputs);
                return { success: true, inputs: data.inputs, source: 'ai' };
            }

            throw new Error(data.error || 'AI generation failed');
        } catch (err) {
            console.log('⚠️ AI generation failed, using local fallback:', err.message);

            // Fallback to local constraint-aware generator
            try {
                const generated = inputGenerator.generate(codeToAnalyze, inputDetection);
                const inputValues = inputDetection.inputs.map(input => {
                    const varName = input.variable || input.name;
                    return generated.inputs[varName];
                });
                return { success: true, inputs: inputValues, source: 'local' };
            } catch (localErr) {
                console.error('❌ Local generation also failed:', localErr);
                return { success: false, error: localErr.message };
            }
        }
    }, [inputGenerator]);

    // Handle start visualization button click
    const handleStartVisualization = useCallback(async () => {
        console.log('=== START VISUALIZATION CLICKED ===');
        console.log('Code length:', code.length);
        console.log('Auto-generate input:', autoGenerateInput);

        if (!code.trim()) {
            console.log('No code, returning');
            return;
        }

        setError(null);
        setIsRunning(true);  // Show loading immediately when button clicked
        setLoadingPhase(0);

        console.log('Detecting inputs...');
        // First, detect if the code needs any inputs
        const inputDetection = await detectInputs(code);
        console.log('Input detection result:', inputDetection);

        // Store metadata for later use
        setCodeMetadata(inputDetection);

        if (inputDetection.hasInputs && inputDetection.count > 0) {
            if (autoGenerateInput) {
                // Auto-generate inputs using AI (with local fallback)
                console.log('Auto-generating inputs with AI...');
                const result = await generateInputsWithAI(code, inputDetection);

                if (result.success) {
                    console.log(`Running trace with ${result.source} generated values:`, result.inputs);
                    runTrace(result.inputs, inputDetection);
                } else {
                    console.error('All input generation methods failed:', result.error);
                    // Fall back to showing modal
                    setIsRunning(false);  // Reset button state
                    setDetectedInputs(inputDetection.inputs);
                    setShowInputModal(true);
                }
            } else {
                console.log('Showing input modal');
                // Show modal to collect inputs
                setIsRunning(false);  // Reset button state
                setDetectedInputs(inputDetection.inputs);
                setShowInputModal(true);
            }
        } else {
            console.log('No inputs needed, running trace directly');
            // No inputs needed, run directly
            runTrace([], inputDetection);
        }
    }, [code, detectInputs, runTrace, autoGenerateInput, generateInputsWithAI]);

    // Handle input submission from modal
    const handleInputSubmit = useCallback((inputValues) => {
        runTrace(inputValues, codeMetadata);
    }, [runTrace, codeMetadata]);

    const handleCloseVisualizer = useCallback(() => {
        setShowVisualizer(false);
        setSteps([]);
        setIsLoadingTrace(false);
    }, []);

    // Get code lines for the visualizer
    const codeLines = code.split('\n');

    return (
        <div className="min-h-screen bg-slate-50 code-visualizer-container relative overflow-x-hidden">
            {/* MOBILE: Professional app-like design */}
            <div className="lg:hidden flex flex-col min-h-screen">
                {/* Mobile Header - Gradient background extends behind status bar */}
                <div className="bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-600 relative">
                    {/* Pattern overlay for depth */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-300 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
                    </div>

                    {/* Top Nav Bar */}
                    <div className="relative flex items-center justify-between px-4 py-4 pt-4">
                        <Link to="/" className="text-white font-bold text-xl tracking-tight">
                            Code<span className="text-blue-200">Visualizer</span>
                        </Link>
                        {loading ? (
                            <div className="w-20 h-9 rounded-full bg-white/20 animate-pulse" />
                        ) : isLoggedIn ? (
                            <Link to="/profile" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                <FaUserCircle className="text-white text-xl" />
                            </Link>
                        ) : (
                            <Link
                                to={`/auth?mode=login&returnTo=${encodeURIComponent(location.pathname)}`}
                                className="px-5 py-2 bg-white text-blue-600 rounded-full text-sm font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all"
                            >
                                Log In
                            </Link>
                        )}
                    </div>

                    {/* Hero Section */}
                    <div className="relative text-center px-6 pb-6 pt-2">
                        <p className="text-white/90 text-base font-medium">See your Python code come alive</p>
                        <p className="text-white/60 text-sm mt-1">Step-by-step execution visualization</p>
                    </div>

                    {/* Mobile Beta Banner */}
                    {showBetaBanner && (
                        <div className="mb-4 bg-white shadow-sm">
                            <div className="h-9 flex items-center justify-between px-4">
                                <div className="flex-1" />
                                <p className="text-xs font-medium text-slate-700 tracking-wide">
                                    Beta Version · Experimental · Testing Stage
                                </p>
                                <div className="flex-1 flex justify-end">
                                    <button
                                        onClick={() => setShowBetaBanner(false)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                        aria-label="Dismiss"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Editor - Clean, no card look */}
                <div className="flex-1 flex flex-col bg-white rounded-t-2xl relative z-10">
                    {/* Simple Editor Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-white" viewBox="0 0 256 255" fill="currentColor">
                                    <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" />
                                    <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" />
                                </svg>
                            </div>
                            <span className="text-slate-700 font-semibold text-sm">Python Editor</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium text-emerald-600">Ready</span>
                        </div>
                    </div>

                    <CodeEditor
                        code={code}
                        setCode={setCode}
                        onStartVisualization={handleStartVisualization}
                        autoGenerateInput={autoGenerateInput}
                        setAutoGenerateInput={setAutoGenerateInput}
                        isRunning={isRunning}
                        currentLine={null}
                        error={error}
                        isVisualizationActive={false}
                        hasInputsRequired={hasInputsRequired}
                        isMobile={true}
                    />
                </div>
            </div>

            {/* DESKTOP: Original gradient hero design */}
            <div className="hidden lg:block">
                {/* Top gradient section - Matching login/signup style */}
                < div className="absolute top-0 left-0 right-0 h-[65vh] bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-600" >
                    {/* Decorative background elements */}
                    < div className="absolute inset-0 overflow-hidden pointer-events-none" >
                        {/* Subtle gradient orbs */}
                        < div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-15 blur-3xl" />
                        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400 to-blue-300 opacity-15 blur-3xl" />
                    </div >

                    {/* Wave separator with text flowing along the curve */}
                    < div className="absolute bottom-0 left-0 right-0 transform translate-y-[1px] z-10" >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto block" preserveAspectRatio="none">
                            {/* Define the wave path for text to follow */}
                            <defs>
                                <path
                                    id="wavePath"
                                    d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,202.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192"
                                    fill="none"
                                />
                            </defs>

                            {/* Wave fill */}
                            <path
                                fill="#F9FAFB"
                                fillOpacity="1"
                                d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,202.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                            />

                            {/* Text flowing along the wave path - Single strip with repeated content for seamless loop */}
                            <text className="wave-path-text" dy="-5">
                                <textPath href="#wavePath" startOffset="100%">
                                    ✦ Visualize your code ✦ See code come alive ✦ Learn how code thinks ✦ No more blind coding ✦ Clarity over memorization ✦ Understand the "why" ✦ Concepts made visible ✦ Beyond the result ✦ Where code makes sense ✦ Visualize your code ✦ See code come alive ✦ Learn how code thinks ✦ No more blind coding ✦ Clarity over memorization ✦ Understand the "why" ✦ Concepts made visible ✦ Beyond the result ✦ Where code makes sense ✦ Visualize your code ✦ See code come alive ✦ Learn how code thinks ✦ No more blind coding ✦ Clarity over memorization ✦ Understand the "why" ✦ Concepts made visible ✦ Beyond the result ✦ Where code makes sense ✦
                                    <animate
                                        attributeName="startOffset"
                                        from="100%"
                                        to="-200%"
                                        dur="45s"
                                        repeatCount="indefinite"
                                    />
                                </textPath>
                            </text>
                        </svg>
                    </div >
                </div >

                {/* Main Content - Editor centered and prominent */}
                <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
                    {/* Public Beta Status Pill */}
                    {/* Public Beta Status Band */}
                    {showBetaBanner && (
                        <div className="absolute left-0 right-0 top-24 z-20 animate-fade-in-down bg-white shadow-sm">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="h-10 flex items-center justify-between">
                                    <div className="flex-1" />
                                    <p className="text-sm font-medium text-slate-700 tracking-wide">
                                        Beta Version · Experimental · Testing Stage
                                    </p>
                                    <div className="flex-1 flex justify-end">
                                        <button
                                            onClick={() => setShowBetaBanner(false)}
                                            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                            aria-label="Dismiss"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-4xl">
                        <CodeEditor
                            code={code}
                            setCode={setCode}
                            onStartVisualization={handleStartVisualization}
                            autoGenerateInput={autoGenerateInput}
                            setAutoGenerateInput={setAutoGenerateInput}
                            isRunning={isRunning}
                            currentLine={null}
                            error={error}
                            isVisualizationActive={false}
                            hasInputsRequired={hasInputsRequired}
                            isMobile={false}
                        />
                    </div>
                </main>
            </div >

            {/* Input Modal */}
            < InputModal
                isOpen={showInputModal}
                onClose={() => setShowInputModal(false)
                }
                inputs={detectedInputs}
                onSubmit={handleInputSubmit}
                codeType={codeMetadata?.codeType}
                functionName={codeMetadata?.functionName}
                className={codeMetadata?.className}
            />

            {/* Immersive Full-Screen Visualizer */}
            < ImmersiveVisualizer
                isOpen={showVisualizer}
                onClose={handleCloseVisualizer}
                steps={steps}
                code={code}
                codeLines={codeLines}
                sourceLines={codeLines}
                isLoading={isLoadingTrace}
                loadingPhase={loadingPhase}
                isGenerating={isRunning}
                executionId={executionId}
            />
        </div >
    );
}

export default CodeVisualizerPage;
