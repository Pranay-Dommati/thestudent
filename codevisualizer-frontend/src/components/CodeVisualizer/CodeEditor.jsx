import React, { useRef, useEffect, useMemo } from 'react';

// Python syntax highlighter using tokenization
const highlightPython = (code) => {
    if (!code) return '';

    const escapeHtml = (str) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const keywords = new Set(['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'raise', 'pass', 'break', 'continue', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'global', 'nonlocal', 'assert', 'del']);
    const builtins = new Set(['print', 'len', 'range', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple', 'input', 'open', 'type', 'isinstance', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter', 'sum', 'min', 'max', 'abs', 'round', 'pow', 'hex', 'oct', 'bin', 'ord', 'chr', 'format', 'repr', 'hash', 'id', 'dir', 'vars', 'locals', 'globals', 'hasattr', 'getattr', 'setattr', 'delattr', 'callable', 'iter', 'next', 'slice', 'super']);

    // Token patterns in priority order
    const tokenPatterns = [
        { type: 'comment', regex: /#.*$/ },
        { type: 'string', regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
        { type: 'number', regex: /\b\d+\.?\d*\b/ },
        { type: 'word', regex: /\b[a-zA-Z_]\w*\b/ },
        { type: 'other', regex: /\S/ },
        { type: 'space', regex: /\s+/ },
    ];

    const combinedRegex = new RegExp(tokenPatterns.map(p => `(${p.regex.source})`).join('|'), 'gm');

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(code)) !== null) {
        // Add any skipped characters
        if (match.index > lastIndex) {
            result += escapeHtml(code.slice(lastIndex, match.index));
        }

        const token = match[0];
        let tokenType = 'other';

        // Determine token type based on which group matched
        for (let i = 1; i <= tokenPatterns.length; i++) {
            if (match[i] !== undefined) {
                tokenType = tokenPatterns[i - 1].type;
                break;
            }
        }

        // Apply highlighting based on token type
        const escaped = escapeHtml(token);
        switch (tokenType) {
            case 'comment':
                result += `<span class="text-slate-400 italic">${escaped}</span>`;
                break;
            case 'string':
                result += `<span class="text-green-600">${escaped}</span>`;
                break;
            case 'number':
                result += `<span class="text-orange-500">${escaped}</span>`;
                break;
            case 'word':
                if (keywords.has(token)) {
                    result += `<span class="text-purple-600 font-medium">${escaped}</span>`;
                } else if (builtins.has(token)) {
                    result += `<span class="text-cyan-600">${escaped}</span>`;
                } else {
                    result += escaped;
                }
                break;
            default:
                result += escaped;
        }

        lastIndex = combinedRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < code.length) {
        result += escapeHtml(code.slice(lastIndex));
    }

    return result;
};

const CodeEditor = ({
    code,
    setCode,
    onStartVisualization,
    autoGenerateInput,
    setAutoGenerateInput,
    isRunning,
    error,
    hasInputsRequired = null,  // null = unknown (show toggle), true = needs inputs (show toggle), false = no inputs (hide toggle)
    isMobile = false
}) => {
    const lines = code.split('\n');
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const highlightRef = useRef(null);
    const highlightContentRef = useRef(null);

    // Memoized highlighted code
    const highlightedCode = useMemo(() => highlightPython(code), [code]);

    // Sync scroll between textarea, line numbers, and highlight overlay
    useEffect(() => {
        const textarea = textareaRef.current;
        const lineNumbers = lineNumbersRef.current;
        const highlightContent = highlightContentRef.current;

        if (!textarea) return;

        const handleScroll = () => {
            if (lineNumbers) {
                lineNumbers.scrollTop = textarea.scrollTop;
            }
            if (highlightContent) {
                highlightContent.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`;
            }
        };

        textarea.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => textarea.removeEventListener('scroll', handleScroll);
    }, [isMobile]);

    // Mobile-optimized layout
    if (isMobile) {
        return (
            <div className="flex flex-col flex-1">
                {/* Mobile Code Area - Flex grow to fill space */}
                <div className="flex flex-1 bg-white overflow-hidden relative">
                    {/* Line Numbers */}
                    <div
                        ref={lineNumbersRef}
                        className="w-7 bg-slate-100/80 border-r border-slate-200 py-3 select-none overflow-hidden flex-shrink-0"
                        onWheel={(e) => {
                            const textarea = textareaRef.current;
                            if (!textarea) return;
                            textarea.scrollTop += e.deltaY;
                            textarea.scrollLeft += e.deltaX;
                            e.preventDefault();
                        }}
                    >
                        {(lines.length > 0 ? lines : ['']).map((_, index) => (
                            <div
                                key={index}
                                className="h-6 flex items-center justify-end pr-1.5 text-[11px] font-mono text-slate-400"
                            >
                                {index + 1}
                            </div>
                        ))}
                    </div>

                    {/* Code Editor with Syntax Highlighting */}
                    <div className="flex-1 relative">
                        {/* Syntax highlighted overlay */}
                        <pre
                            ref={highlightRef}
                            className="absolute inset-0 w-full h-full font-mono text-base leading-6 p-3 pointer-events-none overflow-hidden whitespace-pre"
                            aria-hidden="true"
                        >
                            <code
                                ref={highlightContentRef}
                                className="block"
                                style={{ willChange: 'transform' }}
                                dangerouslySetInnerHTML={{ __html: highlightedCode || '<span class="text-slate-400"># Paste your Python code here...</span>' }}
                            />
                        </pre>
                        <textarea
                            ref={textareaRef}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder=""
                            wrap="off"
                            className="code-editor-textarea absolute inset-0 w-full h-full bg-transparent text-transparent font-mono text-base leading-6 p-3 resize-none outline-none caret-blue-600 selection:bg-blue-100 z-10 overflow-auto whitespace-pre"
                            spellCheck="false"
                            disabled={isRunning}
                        />
                    </div>
                </div>

                {/* Mobile Action Area */}
                <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-red-800">Error</p>
                                <p className="text-xs text-red-600">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        {/* Auto-generate Toggle */}
                        <div className="flex-1 min-w-0">
                            {hasInputsRequired !== false ? (
                                <label className="flex items-center gap-3 cursor-pointer py-1">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={autoGenerateInput}
                                            onChange={(e) => setAutoGenerateInput(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-500 transition-all duration-300" />
                                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                                    </div>
                                    <span className="text-sm text-slate-700 font-medium truncate">
                                        ⚡ Auto-generate inputs
                                    </span>
                                </label>
                            ) : (
                                <span className="text-sm text-slate-400 italic">Ready to run</span>
                            )}
                        </div>

                        {/* Compact Start Button */}
                        <button
                            onClick={onStartVisualization}
                            disabled={!code.trim() || isRunning}
                            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${!code.trim() || isRunning
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-95 active:shadow-md'
                                }`}
                            aria-label="Start Visualization"
                        >
                            {isRunning ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop layout (original)
    return (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xl">
            {/* Editor Header - Soft, brand-aligned */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-4 bg-slate-50 border-b border-slate-200 gap-3 sm:gap-0">
                <div className="flex items-center gap-4">
                    {/* Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 256 255" fill="currentColor">
                                <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" />
                                <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-slate-800 font-semibold text-sm leading-tight">Code Visualizer</h1>
                            <p className="text-slate-500 text-xs">Paste Python code to visualize</p>
                        </div>
                    </div>
                </div>

                {/* Right side - Status indicator (subtle) */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium">Ready</span>
                    </div>
                </div>
            </div>

            {/* Code Area with Line Numbers - Light Theme */}
            <div className="flex h-[350px] md:h-[400px] bg-slate-50">
                {/* Line Numbers */}
                <div
                    ref={lineNumbersRef}
                    className="w-12 md:w-14 bg-slate-100 border-r border-slate-200 py-4 select-none overflow-hidden flex-shrink-0"
                    onWheel={(e) => {
                        const textarea = textareaRef.current;
                        if (!textarea) return;
                        textarea.scrollTop += e.deltaY;
                        textarea.scrollLeft += e.deltaX;
                        e.preventDefault();
                    }}
                >
                    {(lines.length > 0 ? lines : ['']).map((_, index) => (
                        <div
                            key={index}
                            className="h-6 flex items-center justify-end pr-3 md:pr-4 text-xs font-mono text-slate-400"
                        >
                            {index + 1}
                        </div>
                    ))}
                </div>

                {/* Code Editor with Syntax Highlighting */}
                <div className="flex-1 relative">
                    {/* Syntax highlighted overlay */}
                    <pre
                        ref={highlightRef}
                        className="absolute inset-0 w-full h-full font-mono text-sm leading-6 p-4 pointer-events-none overflow-hidden whitespace-pre"
                        aria-hidden="true"
                    >
                        <code
                            ref={highlightContentRef}
                            className="block"
                            style={{ willChange: 'transform' }}
                            dangerouslySetInnerHTML={{ __html: highlightedCode || '<span class="text-slate-400"># Paste your Python code here...</span>' }}
                        />
                    </pre>
                    <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder=""
                        wrap="off"
                        className="code-editor-textarea absolute inset-0 w-full h-full bg-transparent text-transparent font-mono text-sm leading-6 p-4 resize-none outline-none caret-blue-600 selection:bg-blue-100 z-10 overflow-auto whitespace-pre"
                        spellCheck="false"
                        disabled={isRunning}
                    />
                </div>
            </div>

            {/* Bottom Action Bar - Clean, minimal */}
            <div className="px-5 py-4 bg-white border-t border-slate-200">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-800">Error</p>
                            <p className="text-sm text-red-600 mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Action Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Auto-generate Toggle - Only shown when code requires inputs */}
                    {hasInputsRequired !== false ? (
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={autoGenerateInput}
                                    onChange={(e) => setAutoGenerateInput(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-500 transition-all duration-300" />
                                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 peer-checked:translate-x-4" />
                            </div>
                            <span className="text-sm text-slate-600 font-medium">
                                ⚡ Auto-generate inputs <span className="text-slate-400">(recommended)</span>
                            </span>
                        </label>
                    ) : (
                        <div />
                    )}

                    {/* Start Button - THE ONLY STRONG ELEMENT */}
                    <button
                        onClick={onStartVisualization}
                        disabled={!code.trim() || isRunning}
                        className={`flex-1 sm:flex-initial py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${!code.trim() || isRunning
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                                <span>Start Visualization</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
