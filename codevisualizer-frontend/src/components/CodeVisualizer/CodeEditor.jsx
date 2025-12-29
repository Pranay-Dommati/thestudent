import React, { useRef, useEffect } from 'react';

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

    // Sync scroll between textarea and line numbers
    useEffect(() => {
        const textarea = textareaRef.current;
        const lineNumbers = lineNumbersRef.current;

        if (textarea && lineNumbers) {
            const handleScroll = () => {
                lineNumbers.scrollTop = textarea.scrollTop;
            };
            textarea.addEventListener('scroll', handleScroll);
            return () => textarea.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Mobile-optimized layout
    if (isMobile) {
        return (
            <div className="flex flex-col flex-1">
                {/* Mobile Code Area */}
                <div className="flex flex-1 min-h-[200px] max-h-[340px] bg-white">
                    {/* Line Numbers */}
                    <div
                        ref={lineNumbersRef}
                        className="w-7 bg-slate-100/80 border-r border-slate-200 py-3 select-none overflow-hidden flex-shrink-0"
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

                    {/* Code Editor */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={`# Paste your Python code here...

# Example: Bubble Sort
arr = [64, 34, 25, 12, 22, 11, 90]
n = len(arr)

for i in range(n):
    for j in range(0, n-i-1):
        if arr[j] > arr[j+1]:
            arr[j], arr[j+1] = arr[j+1], arr[j]

print(arr)`}
                            className="w-full h-full bg-transparent text-slate-800 font-mono text-sm leading-6 p-3 resize-none outline-none placeholder:text-slate-400 caret-indigo-500 selection:bg-indigo-100"
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

                    {/* Auto-generate Toggle */}
                    {hasInputsRequired !== false && (
                        <label className="flex items-center gap-3 cursor-pointer py-1">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={autoGenerateInput}
                                    onChange={(e) => setAutoGenerateInput(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-500 transition-all duration-300" />
                                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                            </div>
                            <span className="text-sm text-slate-700 font-medium">
                                ⚡ Auto-generate inputs
                            </span>
                        </label>
                    )}

                    {/* Start Button */}
                    <button
                        onClick={onStartVisualization}
                        disabled={!code.trim() || isRunning}
                        className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2.5 transition-all duration-200 ${!code.trim() || isRunning
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] active:shadow-md'
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                                <span>Start Visualization</span>
                            </>
                        )}
                    </button>
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
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
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

                {/* Code Editor */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={`# Paste your Python code here...

# Example: Bubble Sort
arr = [64, 34, 25, 12, 22, 11, 90]
n = len(arr)

for i in range(n):
    for j in range(0, n-i-1):
        if arr[j] > arr[j+1]:
            arr[j], arr[j+1] = arr[j+1], arr[j]

print(arr)`}
                        className="w-full h-full bg-transparent text-slate-800 font-mono text-sm leading-6 p-4 resize-none outline-none placeholder:text-slate-400 caret-indigo-500 selection:bg-indigo-100"
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
