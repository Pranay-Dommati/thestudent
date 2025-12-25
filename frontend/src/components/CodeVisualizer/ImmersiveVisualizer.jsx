import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import EnterpriseVisualizer from './EnterpriseVisualizer';

const BATCH_SIZE = 6; // Number of steps to show/generate at a time

const ImmersiveVisualizer = ({
    isOpen,
    onClose,
    steps,
    code,
    codeLines,
    isLoading,
    loadingPhase,
    isGenerating = false,
    sourceLines = [],  // For generating more explanations
    totalSteps = null,
    generatedUpTo = null,
}) => {
    const [visibleSteps, setVisibleSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isStreaming, setIsStreaming] = useState(false); // Track if we're receiving streamed data
    const [selectedStepIndex, setSelectedStepIndex] = useState(null); // Track which step user clicked

    // Visualization mode: 'timeline' (legacy) or 'enterprise' (PixiJS + GSAP)
    const [visualizationMode, setVisualizationMode] = useState('timeline');

    // Cinematic step reveal: queue incoming steps and animate one-by-one
    const [pendingSteps, setPendingSteps] = useState([]);
    const [isStepAnimating, setIsStepAnimating] = useState(false);

    // Resizable sidebar state
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);

    // Progressive loading state
    const [displayedStepsCount, setDisplayedStepsCount] = useState(BATCH_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allSteps, setAllSteps] = useState([]);  // Store all steps with explanations
    const [scrollToStepIndex, setScrollToStepIndex] = useState(null);  // Index to scroll to after loading

    const scrollContainerRef = useRef(null);
    const latestStepRef = useRef(null);
    const prevStepsLengthRef = useRef(0);
    const stepRefs = useRef({});  // Store refs for each step

    // Reset when opened
    useEffect(() => {
        if (isOpen && !isLoading) {
            setVisibleSteps([]);
            setCurrentStepIndex(-1);
            setSelectedStepIndex(null);
            prevStepsLengthRef.current = 0;
            setPendingSteps([]);
            setIsStepAnimating(false);
            setDisplayedStepsCount(BATCH_SIZE);
            setAllSteps([]);
            // Wait for steps to stream in
        }
    }, [isOpen, isLoading]);

    // Handle streaming steps - show them as they arrive (limited by displayedStepsCount)
    useEffect(() => {
        if (!isOpen || isLoading) return;

        const newStepsCount = steps.length - prevStepsLengthRef.current;

        if (newStepsCount > 0) {
            // New steps have arrived
            const newSteps = steps.slice(prevStepsLengthRef.current);

            // If we received a very large batch in one go (likely non-streaming),
            // only show first BATCH_SIZE and allow user to load more
            const isInitialLoad = prevStepsLengthRef.current === 0;
            if (isInitialLoad && steps.length > BATCH_SIZE) {
                // Only show first BATCH_SIZE steps
                setVisibleSteps(steps.slice(0, displayedStepsCount));
                setCurrentStepIndex(Math.min(displayedStepsCount - 1, steps.length - 1));
                setIsStreaming(false);
                setPendingSteps([]);
                setAllSteps(steps);
            } else if (isInitialLoad && steps.length > 80) {
                setVisibleSteps(steps);
                setCurrentStepIndex(steps.length - 1);
                setIsStreaming(false);
                setPendingSteps([]);
            } else {
                // Treat as streaming: queue for progressive reveal (only within limit)
                setIsStreaming(true);
                // Only queue steps that are within our display limit
                const stepsToQueue = newSteps.filter((_, i) =>
                    prevStepsLengthRef.current + i < displayedStepsCount
                );
                if (stepsToQueue.length > 0) {
                    setPendingSteps(prev => [...prev, ...stepsToQueue]);
                }
            }

            prevStepsLengthRef.current = steps.length;
            setAllSteps(steps);
        }
    }, [steps, isOpen, isLoading, displayedStepsCount]);

    // Reveal next pending step (streamed) without relying on card animations
    useEffect(() => {
        if (!isOpen || isLoading) return;
        if (isStepAnimating) return;
        if (pendingSteps.length === 0) return;

        setIsStepAnimating(true);
        setVisibleSteps(prev => {
            const next = pendingSteps[0];
            const nextVisible = [...prev, next];
            setCurrentStepIndex(nextVisible.length - 1);
            return nextVisible;
        });
        setPendingSteps(prev => prev.slice(1));

        // Release immediately to process next step
        // DO NOT cleanup this timeout - canceling it causes a deadlock where isStepAnimating stays true forever
        setTimeout(() => setIsStepAnimating(false), 0);
    }, [pendingSteps, isStepAnimating, isOpen, isLoading]);

    // Stop streaming mode when we've shown all available steps (up to limit)
    useEffect(() => {
        // console.log(`[Immersive] State: streaming=${isStreaming}, gen=${isGenerating}, steps=${steps.length}, visible=${visibleSteps.length}, pending=${pendingSteps.length}, limit=${displayedStepsCount}`);

        // Stop streaming when:
        // 1. We've shown all steps up to our display limit, OR
        // 2. We've shown all steps if total is less than limit
        const targetCount = Math.min(displayedStepsCount, steps.length);
        const hasShownEnough = visibleSteps.length >= targetCount;

        if (isStreaming && steps.length > 0 && hasShownEnough && !isGenerating && pendingSteps.length === 0) {
            console.log('[Immersive] Batch complete: shown', visibleSteps.length, 'of', steps.length, '(limit:', displayedStepsCount, ')');
            setIsStreaming(false);
        }

        // Safety: If parent says generation halted and we have no pending steps
        if (isStreaming && !isGenerating && pendingSteps.length === 0 && hasShownEnough) {
            console.log('[Immersive] Safety finish: parent stopped and batch shown');
            const t = setTimeout(() => setIsStreaming(false), 200);
            return () => clearTimeout(t);
        }
    }, [isStreaming, steps.length, visibleSteps.length, isGenerating, pendingSteps.length, displayedStepsCount]);


    // Auto-scroll to latest step only if user is near the bottom
    useEffect(() => {
        if (latestStepRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

            // Only auto-scroll if user is within 300px of the bottom (not reading previous content)
            if (scrollBottom < 300) {
                latestStepRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [visibleSteps]);

    // Scroll to specific step when scrollToStepIndex changes
    useEffect(() => {
        if (scrollToStepIndex !== null && stepRefs.current[scrollToStepIndex]) {
            setTimeout(() => {
                stepRefs.current[scrollToStepIndex]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                setScrollToStepIndex(null);  // Clear after scrolling
            }, 100);  // Small delay to ensure element is rendered
        }
    }, [scrollToStepIndex, visibleSteps]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // Don't capture shortcuts when typing in an input field
            const activeElement = document.activeElement;
            const isTyping = activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable;

            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);


    // Resizing logic
    const startResizing = useCallback((e) => {
        setIsResizing(true);
        e.preventDefault(); // Prevent text selection
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing) {
            // Calculate width from the right edge
            const newWidth = window.innerWidth - e.clientX;
            // Min width 300px, Max width 800px (or percentage of screen)
            if (newWidth > 300 && newWidth < window.innerWidth * 0.6) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // Load more explanations on-demand with SSE streaming
    const loadMoreExplanations = useCallback(async () => {
        if (isLoadingMore) return;

        const currentCount = displayedStepsCount;
        const remainingSteps = steps.slice(currentCount, currentCount + BATCH_SIZE);

        if (remainingSteps.length === 0) return;

        setIsLoadingMore(true);
        setIsStreaming(true);

        const newVisibleCount = Math.min(currentCount + BATCH_SIZE, steps.length);
        setDisplayedStepsCount(newVisibleCount);

        try {
            const response = await fetch('/api/visualizer/generate-explanations-stream/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frames: remainingSteps,
                    sourceLines: sourceLines || codeLines,
                    startIndex: currentCount
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const updatedSteps = [...steps];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'explanation') {
                                console.log(`[Progressive] Step ${data.index + 1}: Received explanation`, data.explanation ? '✅' : '❌ NULL');

                                // Create the step with the explanation
                                const stepWithExplanation = {
                                    ...updatedSteps[data.index],
                                    explanation: data.explanation
                                };

                                // Update the local tracking array
                                updatedSteps[data.index] = stepWithExplanation;
                                console.log(`[Progressive] Step ${data.index + 1}: Prepared step with explanation:`, !!stepWithExplanation.explanation);

                                // Scroll to first step of the new batch
                                if (data.index === currentCount) {
                                    setScrollToStepIndex(data.index);
                                }

                                // Immediately add to pending for progressive reveal (use the explicit object)
                                setPendingSteps(prev => [...prev, stepWithExplanation]);
                            } else if (data.type === 'complete') {
                                console.log(`[Progressive] ✅ Completed ${data.count} explanations`);
                                setAllSteps(updatedSteps);
                            } else if (data.type === 'error') {
                                console.error('[Progressive] Error:', data.error);
                            }
                        } catch (e) {
                            // Skip malformed JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[ImmersiveVisualizer] Error loading more explanations:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [displayedStepsCount, steps, sourceLines, codeLines, isLoadingMore]);

    // Get syntax highlighted code line - returns React elements (Light Theme Optimized)
    const highlightSyntax = (codeLine) => {
        if (!codeLine) return <span>&nbsp;</span>;

        const keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'break', 'continue', 'pass', 'raise', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'self'];
        const builtins = ['print', 'range', 'len', 'int', 'str', 'list', 'dict', 'set', 'tuple', 'float', 'bool', 'type', 'input', 'open', 'map', 'filter', 'sorted', 'enumerate', 'zip', 'sum', 'max', 'min', 'abs'];

        const result = [];
        let remaining = codeLine;
        let key = 0;

        while (remaining.length > 0) {
            // Check for string (single or double quotes)
            const stringMatch = remaining.match(/^(["'])(?:(?!\1)[^\\]|\\.)*?\1/);
            if (stringMatch) {
                result.push(<span key={key++} className="text-green-600 font-medium">{stringMatch[0]}</span>);
                remaining = remaining.slice(stringMatch[0].length);
                continue;
            }

            // Check for comment
            if (remaining.startsWith('#')) {
                result.push(<span key={key++} className="text-slate-400 italic">{remaining}</span>);
                break;
            }

            // Check for number
            const numMatch = remaining.match(/^\d+(\.\d+)?/);
            if (numMatch) {
                result.push(<span key={key++} className="text-orange-600 font-medium">{numMatch[0]}</span>);
                remaining = remaining.slice(numMatch[0].length);
                continue;
            }

            // Check for word (keyword, builtin, or identifier)
            const wordMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            if (wordMatch) {
                const word = wordMatch[0];
                let className = 'text-slate-700';

                if (keywords.includes(word)) {
                    className = 'text-purple-600 font-bold';
                } else if (builtins.includes(word)) {
                    className = 'text-blue-600 font-semibold';
                }

                result.push(<span key={key++} className={className}>{word}</span>);
                remaining = remaining.slice(word.length);
                continue;
            }

            // Check for operators and punctuation
            const opMatch = remaining.match(/^[+\-*/%=<>!&|^~@:,.\[\](){}]+/);
            if (opMatch) {
                result.push(<span key={key++} className="text-indigo-600">{opMatch[0]}</span>);
                remaining = remaining.slice(opMatch[0].length);
                continue;
            }

            // Default: take one character (whitespace or unknown)
            result.push(<span key={key++}>{remaining[0]}</span>);
            remaining = remaining.slice(1);
        }

        return result;
    };

    // Render explanation with styled dry-run section
    // If deterministicDryRun is provided (from tracer), use it instead of parsing from AI text
    const renderExplanationWithDryRun = (explanation, deterministicDryRun = null) => {
        if (!explanation) return null;

        // Extract just the text explanation (remove any DRY-RUN section from AI text)
        let explanationPart = explanation;
        if (explanation.includes('DRY-RUN:')) {
            explanationPart = explanation.substring(0, explanation.indexOf('DRY-RUN:')).replace(/🔍/g, '').trim();
        }

        // Use deterministic dry_run from tracer if available, otherwise parse from AI
        let dryRunLines = [];
        if (deterministicDryRun && Array.isArray(deterministicDryRun) && deterministicDryRun.length > 0) {
            // Use the pre-computed deterministic dry run from the tracer
            dryRunLines = deterministicDryRun;
        } else if (explanation.includes('DRY-RUN:')) {
            // Fallback: parse from AI-generated text
            const dryRunMatch = explanation.match(/DRY-RUN:\s*([\s\S]*?)(?:$)/i);
            if (dryRunMatch) {
                dryRunLines = dryRunMatch[1].trim().split('\n').filter(line => line.trim());
            }
        }

        if (dryRunLines.length > 0) {

            return (
                <>
                    {/* Text explanation - Soft style */}
                    <p className="text-slate-700 leading-relaxed pt-0.5">
                        {explanationPart}
                    </p>

                    {/* Dry-run box - Clean light design with subtle border */}
                    <div className="mt-3 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-500">
                                    <polyline points="4,17 10,11 4,5" />
                                    <line x1="12" y1="19" x2="20" y2="19" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Dry Run</span>
                        </div>
                        <div className="font-mono text-sm space-y-1.5 whitespace-pre">
                            {dryRunLines.map((line, idx) => {
                                // Enhanced styling with inline element coloring
                                const renderLine = () => {
                                    // Check for checkmark or truthy indicator
                                    if (line.includes('✔') || line.includes('✓')) {
                                        const parts = line.split(/(✔|✓)/);
                                        return (
                                            <span className="text-slate-600">
                                                {parts.map((part, i) =>
                                                    part === '✔' || part === '✓'
                                                        ? <span key={i} className="text-emerald-500 font-bold"> ✓</span>
                                                        : part
                                                )}
                                            </span>
                                        );
                                    }
                                    // Check for X or falsy indicator
                                    if (line.includes('✗') || line.includes('✕')) {
                                        const parts = line.split(/(✗|✕)/);
                                        return (
                                            <span className="text-slate-600">
                                                {parts.map((part, i) =>
                                                    part === '✗' || part === '✕'
                                                        ? <span key={i} className="text-rose-500 font-bold"> ✗</span>
                                                        : part
                                                )}
                                            </span>
                                        );
                                    }
                                    // Arrow indicators (→) for flow
                                    if (line.includes('→')) {
                                        return <span className="text-indigo-600">{line}</span>;
                                    }
                                    // Arrows at start (result lines)
                                    if (line.startsWith('→') || line.startsWith('↑')) {
                                        return <span className="text-violet-600 font-medium">{line}</span>;
                                    }
                                    // True/truthy results
                                    if (line.includes('True') || line.includes('truthy')) {
                                        return <span className="text-emerald-600 font-medium">{line}</span>;
                                    }
                                    // False/falsy results
                                    if (line.includes('False') || line.includes('falsy') || line.includes('skipped')) {
                                        return <span className="text-amber-600">{line}</span>;
                                    }
                                    // Assignment lines (var = value)
                                    if (line.includes(' = ') && !line.includes('==')) {
                                        const [varPart, ...rest] = line.split(' = ');
                                        return (
                                            <>
                                                <span className="text-indigo-700 font-medium">{varPart}</span>
                                                <span className="text-slate-400"> = </span>
                                                <span className="text-emerald-600">{rest.join(' = ')}</span>
                                            </>
                                        );
                                    }
                                    // Loop continues/exits
                                    if (line.includes('Loop continues') || line.includes('continues')) {
                                        return <span className="text-blue-600 font-medium">{line}</span>;
                                    }
                                    if (line.includes('Loop exits') || line.includes('exits')) {
                                        return <span className="text-amber-600 font-medium">{line}</span>;
                                    }
                                    // Taking branch
                                    if (line.includes("Taking the '")) {
                                        return <span className="text-violet-600">{line}</span>;
                                    }
                                    // Default - subtle dark text
                                    return <span className="text-slate-700">{line}</span>;
                                };

                                return (
                                    <div key={idx} className="leading-relaxed">
                                        {renderLine()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            );
        }

        // No dry-run section, just render as plain text
        return (
            <p className="mt-1 text-slate-700 leading-relaxed">
                {explanation}
            </p>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-hidden font-sans">
            {/* MINIMAL TOP BAR - No gradients, pure calm */}
            <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all font-medium text-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>

                    <div className="h-5 w-px bg-slate-200" />

                    <h1 className="text-base font-semibold text-slate-800">
                        Code Visualizer
                    </h1>
                </div>

                {/* Mode Toggle - More Prominent */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button
                        onClick={() => setVisualizationMode('timeline')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${visualizationMode === 'timeline'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setVisualizationMode('enterprise')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${visualizationMode === 'enterprise'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        Visualize
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-row-reverse overflow-hidden">
                {/* Left Side - Code Panel (Fixed) */}
                <div
                    style={{ width: `${sidebarWidth}px` }}
                    className="flex-shrink-0 bg-white border-l border-slate-200 flex flex-col relative shadow-sm z-10"
                >
                    {/* Drag Handle */}
                    <div
                        onMouseDown={startResizing}
                        className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-500/50 transition-colors z-10 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
                        style={{ transform: 'translateX(-50%)' }}
                    />

                    {/* Source Code Panel (Light Theme) */}
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-white text-slate-800">
                        {codeLines.map((line, idx) => {
                            const lineNum = idx + 1;

                            // In Enterprise mode, use currentStepIndex; in Timeline mode, use selectedStep or latest visible step
                            const activeStep = visualizationMode === 'enterprise'
                                ? (currentStepIndex >= 0 ? steps[currentStepIndex] : null)
                                : (selectedStepIndex !== null ? visibleSteps[selectedStepIndex] : visibleSteps[visibleSteps.length - 1]);

                            const isCurrentLine = activeStep?.lineNumber === lineNum ||
                                activeStep?.line_no === lineNum ||
                                activeStep?.line === lineNum;

                            // Check which lines have been executed so far
                            const executedLines = visualizationMode === 'enterprise'
                                ? steps.slice(0, currentStepIndex + 1).map(s => s.lineNumber || s.line_no || s.line)
                                : visibleSteps.map(s => s.lineNumber || s.line_no || s.line);
                            const wasExecuted = executedLines.includes(lineNum);

                            return (
                                <div
                                    key={idx}
                                    className={`flex transition-all duration-300 rounded-lg ${isCurrentLine
                                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                                        : ''
                                        }`}
                                >
                                    <span className={`w-12 min-w-[3rem] text-right pr-4 select-none flex-shrink-0 ${isCurrentLine ? 'text-indigo-600 font-bold' : 'text-slate-400'
                                        }`}>
                                        {lineNum}
                                    </span>
                                    <span
                                        className={`flex-1 whitespace-pre ${isCurrentLine
                                            ? 'text-slate-900'
                                            : 'text-slate-600'
                                            }`}
                                    >
                                        {highlightSyntax(line)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side - Execution Timeline (Scrollable) */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto bg-[#F8FAFC]"
                >
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse" />
                                </div>
                            </div>
                            <p className="mt-6 text-lg text-slate-500 font-medium animate-pulse">
                                {loadingPhase === 1 && "📖 Reading your code..."}
                                {loadingPhase === 2 && "🧠 Analyzing execution flow..."}
                                {loadingPhase === 3 && "✨ Preparing visualization..."}
                                {loadingPhase === 4 && "🚀 Starting execution..."}
                            </p>
                        </div>
                    )}

                    {/* Enterprise Mode - PixiJS + GSAP Visualizer */}
                    {!isLoading && visualizationMode === 'enterprise' && (
                        <div className="h-full p-6">
                            <EnterpriseVisualizer
                                steps={steps}
                                code={code}
                                onStepChange={(index, step) => setCurrentStepIndex(index)}
                                className="h-full"
                            />
                        </div>
                    )}

                    {/* Timeline Mode - Clean Stage Design */}
                    {!isLoading && visualizationMode === 'timeline' && (
                        <div className="max-w-3xl mx-auto py-8 px-6">
                            {/* Timeline Items */}
                            <div className="relative">
                                {/* Timeline Line - Stops at last step */}
                                <div className="absolute left-[11px] top-3 bottom-12 w-[2px] bg-gradient-to-b from-indigo-400 to-emerald-400" />

                                {/* Steps */}
                                {visibleSteps.map((step, idx) => {
                                    const isLatest = idx === visibleSteps.length - 1;
                                    const isSelected = selectedStepIndex === idx;

                                    // Get the actual step index from the step object
                                    const stepIndex = step.step !== undefined ? step.step - 1 : idx;

                                    return (
                                        <div
                                            key={idx}
                                            ref={(el) => {
                                                if (isLatest) latestStepRef.current = el;
                                                stepRefs.current[stepIndex] = el;
                                            }}
                                            className={`relative pl-10 pb-6 transition-all duration-300 ${isLatest ? 'animate-fade-in-up' : ''}`}
                                            onClick={() => setSelectedStepIndex(idx)}
                                        >
                                            {/* Timeline Node */}
                                            <div className={`absolute left-0 w-6 h-6 rounded-full border-2 transition-all ${isSelected
                                                ? 'bg-indigo-600 border-indigo-600 scale-110'
                                                : isLatest
                                                    ? 'bg-white border-indigo-400 shadow-sm'
                                                    : 'bg-white border-slate-300'
                                                }`} />

                                            {/* Step Card */}
                                            <div className={`bg-white rounded-2xl p-6 shadow-lg cursor-pointer transition-all ${isSelected
                                                ? 'ring-2 ring-indigo-400'
                                                : 'hover:shadow-xl'
                                                }`}>
                                                {/* Line Badge */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                                                        Line {step.lineNumber}
                                                    </span>
                                                    <span className="text-xs text-slate-400">Step {idx + 1}</span>
                                                </div>

                                                {/* Code - Big, prominent */}
                                                <div className="font-mono text-base text-slate-900 mb-4 py-3 px-4 bg-slate-50 rounded-lg">
                                                    {highlightSyntax(step.code)}
                                                </div>

                                                {/* AI Explanation - Soft, inline */}
                                                {step.explanation ? (
                                                    <div className="mb-4 p-4 bg-indigo-50 rounded-xl">
                                                        <div className="flex items-start gap-2">
                                                            <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-1" />
                                                            <div className="flex-1">
                                                                {renderExplanationWithDryRun(step.explanation, step.dry_run)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                            <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-400 rounded-full animate-spin" />
                                                            <span>Generating explanation...</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Variables - Inline chips */}
                                                {(step.variables && Object.keys(step.variables).length > 0) || (step.computed_values && Object.keys(step.computed_values).length > 0) || (step.changedVars && step.changedVars.length > 0) ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-slate-500 font-medium shrink-0">Variables:</span>
                                                        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 -mb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent px-1">
                                                            {(() => {
                                                                const allVars = new Map();

                                                                // 1. Existing variables
                                                                if (step.variables) {
                                                                    Object.entries(step.variables).forEach(([name, data]) => {
                                                                        allVars.set(name, {
                                                                            value: data.value,
                                                                            isChanged: false
                                                                        });
                                                                    });
                                                                }

                                                                // 2. Process changed variables
                                                                if (step.changedVars) {
                                                                    step.changedVars.forEach(name => {
                                                                        const existing = allVars.get(name);
                                                                        const hasComputed = step.computed_values && step.computed_values[name] !== undefined;

                                                                        if (existing) {
                                                                            existing.isChanged = true;
                                                                            if (hasComputed) existing.value = step.computed_values[name];
                                                                        } else {
                                                                            allVars.set(name, {
                                                                                value: hasComputed ? step.computed_values[name] : undefined,
                                                                                isChanged: true
                                                                            });
                                                                        }
                                                                    });
                                                                }

                                                                // 3. Catch strictly new computed values not in changedVars
                                                                if (step.computed_values) {
                                                                    Object.entries(step.computed_values).forEach(([name, val]) => {
                                                                        if (!allVars.has(name)) {
                                                                            allVars.set(name, {
                                                                                value: val,
                                                                                isChanged: true
                                                                            });
                                                                        }
                                                                    });
                                                                }

                                                                // 4. Sort: Changed first, then alphabetical
                                                                const sortedVars = Array.from(allVars.entries()).sort((a, b) => {
                                                                    if (a[1].isChanged && !b[1].isChanged) return -1;
                                                                    if (!a[1].isChanged && b[1].isChanged) return 1;
                                                                    return a[0].localeCompare(b[0]);
                                                                });

                                                                // 5. Render
                                                                return sortedVars.map(([name, data]) => {
                                                                    let valueStr;
                                                                    if (data.value === undefined) {
                                                                        valueStr = "assigning...";
                                                                    } else {
                                                                        valueStr = typeof data.value === 'object'
                                                                            ? JSON.stringify(data.value)
                                                                            : String(data.value);
                                                                    }

                                                                    const isAssigning = data.value === undefined;

                                                                    return (
                                                                        <span
                                                                            key={name}
                                                                            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-mono ${data.isChanged
                                                                                ? isAssigning
                                                                                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                                                                                    : 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                                                                                : 'bg-slate-100 text-slate-700'
                                                                                }`}
                                                                        >
                                                                            <span className="font-semibold">{name}</span>
                                                                            <span className={data.isChanged ? "text-indigo-400" : "text-slate-400"}>=</span>
                                                                            <span className={isAssigning ? "italic opacity-80" : ""}>
                                                                                {valueStr.length > 50 ? valueStr.slice(0, 50) + '...' : valueStr}
                                                                            </span>
                                                                        </span>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Output */}
                                                {step.output && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm text-emerald-400">
                                                            <span className="text-slate-500 mr-2 select-none">$</span>{step.output}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Load More Steps Button */}
                                {!isStreaming && !isGenerating && visibleSteps.length < steps.length && (
                                    <div className="relative pl-10 py-6">
                                        {/* Timeline continuation dot */}
                                        <div className="absolute left-0 w-6 h-6 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center">
                                            <span className="text-slate-400 text-sm">⋯</span>
                                        </div>

                                        <button
                                            onClick={loadMoreExplanations}
                                            disabled={isLoadingMore}
                                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${isLoadingMore
                                                ? 'bg-slate-100 text-slate-400'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                                }`}
                                        >
                                            {isLoadingMore ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Continue • {steps.length - visibleSteps.length} more steps
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* End Marker - Only show when ALL steps are displayed */}
                                {!isStreaming && !isGenerating && visibleSteps.length >= steps.length && visibleSteps.length > 0 && steps.length > 0 && (
                                    <div className="relative pl-10 pt-2 animate-fade-in">
                                        {/* Green completion dot - aligned with timeline */}
                                        <div className="absolute left-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-emerald-800">Execution Complete! 🎉</h3>
                                                <p className="text-xs text-emerald-600">
                                                    Successfully executed {steps.length} steps
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Waiting for more steps indicator */}
                                {(isStreaming || isGenerating) && (
                                    <div className="relative pl-10 pt-2">
                                        <div className={`absolute left-0 w-6 h-6 rounded-full border-2 animate-pulse ${isStreaming ? 'bg-blue-500 border-blue-400' : 'bg-slate-600 border-slate-500'}`} />
                                        <div className="text-slate-500 text-sm flex items-center gap-2 font-medium py-2">
                                            <span className="inline-flex gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isStreaming ? 'bg-blue-500' : 'bg-indigo-500'}`} style={{ animationDelay: '0ms' }}></span>
                                                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isStreaming ? 'bg-blue-500' : 'bg-indigo-500'}`} style={{ animationDelay: '150ms' }}></span>
                                                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isStreaming ? 'bg-blue-500' : 'bg-indigo-500'}`} style={{ animationDelay: '300ms' }}></span>
                                            </span>
                                            {isStreaming ? 'Receiving steps from AI...' : 'Executing next step...'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Empty state */}
                            {
                                visibleSteps.length === 0 && !isLoading && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 6v12M6 12h12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 mb-2">Ready to Start</h3>
                                        <p className="text-slate-500">Waiting for execution to start...</p>
                                    </div>
                                )
                            }
                        </div>
                    )}
                </div>
            </div >
            <div className="flex-shrink-0 h-1 bg-slate-100">
                <div
                    className={`h-full transition-all duration-300 ${isStreaming ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-purple-700 animate-pulse' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700'}`}
                    style={{ width: isStreaming ? '100%' : `${steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0}%` }}
                />
            </div>
        </div >
    );
};

export default ImmersiveVisualizer;
