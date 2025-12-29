import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
                    }, 5000);
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
                                        loop_info: frame.loop_info
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
                    <div className="relative text-center px-6 pb-8 pt-2">
                        <p className="text-white/90 text-base font-medium">See your Python code come alive</p>
                        <p className="text-white/60 text-sm mt-1">Step-by-step execution visualization</p>
                    </div>
                </div>
                
                {/* Mobile Editor Card - Floating above gradient */}
                <div className="flex-1 flex flex-col px-4 -mt-4 relative z-10 pb-4">
                    <div className="bg-white rounded-2xl flex-1 flex flex-col shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        {/* Editor Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05z" />
                                    </svg>
                                </div>
                                <span className="text-slate-700 font-semibold text-sm">Python Editor</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-emerald-700">Ready</span>
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
                
                {/* Mobile Footer - Minimal */}
                <div className="bg-white border-t border-slate-100 py-4 px-4">
                    <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                        <Link to="/feedback" className="hover:text-indigo-600 transition-colors">Feedback</Link>
                        <span className="text-slate-300">•</span>
                        <Link to="/terms-and-conditions" className="hover:text-indigo-600 transition-colors">Terms</Link>
                        <span className="text-slate-300">•</span>
                        <Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy</Link>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2">© 2025 EasyLearnova</p>
                </div>
            </div>

            {/* DESKTOP: Original gradient hero design */}
            <div className="hidden lg:block">
                {/* Top gradient section - Matching login/signup style */}
                <div className="absolute top-0 left-0 right-0 h-[65vh] bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-600">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Subtle gradient orbs */}
                        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-15 blur-3xl" />
                        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400 to-blue-300 opacity-15 blur-3xl" />
                    </div>

                    {/* Wave separator with text flowing along the curve */}
                    <div className="absolute bottom-0 left-0 right-0 transform translate-y-[1px] z-10">
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
                    </div>
                </div>

                {/* Main Content - Editor centered and prominent */}
                <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
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
            </div>

            {/* Input Modal */}
            <InputModal
                isOpen={showInputModal}
                onClose={() => setShowInputModal(false)}
                inputs={detectedInputs}
                onSubmit={handleInputSubmit}
                codeType={codeMetadata?.codeType}
                functionName={codeMetadata?.functionName}
                className={codeMetadata?.className}
            />

            {/* Immersive Full-Screen Visualizer */}
            <ImmersiveVisualizer
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
        </div>
    );
}

export default CodeVisualizerPage;
