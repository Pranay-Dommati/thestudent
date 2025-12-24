import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
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
    const [code, setCode] = useState('');
    const [autoGenerateInput, setAutoGenerateInput] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [steps, setSteps] = useState([]);
    const [error, setError] = useState(null);

    // Input modal state
    const [showInputModal, setShowInputModal] = useState(false);
    const [detectedInputs, setDetectedInputs] = useState([]);
    const [codeMetadata, setCodeMetadata] = useState(null);

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

    // Run the actual trace with streaming
    const runTrace = useCallback(async (inputValues = [], metadata = null) => {
        setIsRunning(true);
        setError(null);
        setShowInputModal(false);

        // Open immersive visualizer immediately with loading state
        setShowVisualizer(true);
        setIsLoadingTrace(true);
        setSteps([]);

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

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Process complete SSE messages
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || ''; // Keep incomplete message in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.type === 'error') {
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
                                    const transformedStep = {
                                        lineNumber: frame.line,
                                        code: frame.code,
                                        explanation: frame.explanation,
                                        variables: frame.locals,
                                        changedVars: frame.changed_vars || [],
                                        event: frame.event,
                                        functionName: frame.function_name,
                                        output: frame.output
                                    };

                                    // Add step progressively
                                    setSteps(prev => [...prev, transformedStep]);
                                }

                                if (data.type === 'complete') {
                                    // All frames received
                                    setIsLoadingTrace(false);
                                    setIsRunning(false);
                                }
                            } catch (parseError) {
                                console.error('Failed to parse SSE data:', parseError);
                            }
                        }
                    }
                }
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
                        output: data.output
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
                    setDetectedInputs(inputDetection.inputs);
                    setShowInputModal(true);
                }
            } else {
                console.log('Showing input modal');
                // Show modal to collect inputs
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
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 code-visualizer-container">
            <Navbar initialStyle="transparent" />

            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Large gradient orbs */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 h-72 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-3xl" />
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-72 h-72 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-20 blur-3xl" />

                {/* Subtle floating shapes */}
                <div className="absolute top-32 left-8 w-3 h-3 bg-white/20 rounded rotate-45" />
                <div className="absolute top-1/4 right-16 w-2 h-6 bg-white/10 rounded-full" />
                <div className="absolute bottom-1/3 left-12 w-4 h-4 border border-white/20 rounded-full" />
                <div className="absolute top-1/2 right-8 w-4 h-4 bg-yellow-300/20 rounded-full" />

                {/* Grid background */}
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:24px_24px]" />
            </div>

            {/* Main Content - Editor centered and prominent */}
            <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-6 pt-20 md:pt-24">
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
                    />
                </div>
            </main>

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
                isLoading={isLoadingTrace}
                loadingPhase={loadingPhase}
                isGenerating={isRunning}
            />
        </div>
    );
}

export default CodeVisualizerPage;
