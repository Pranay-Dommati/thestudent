import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, MessageCircle, Loader2, Send, X } from 'lucide-react';

/**
 * AskSIAPanel v2 — Chat-based DSA Mentor Interface
 * =================================================
 * 
 * Industry-grade design:
 * - Step context pill (dismissable)
 * - Auto-generates "Why" as first message when step selected
 * - Chat-style conversation
 * - Step-scoped by default, general when cleared
 * 
 * Props:
 * - stepContext: { lineNumber, code, variables } - current step (null = general mode)
 * - fullCode: Complete source code
 * - onFetchWhy: Callback to fetch Why explanation
 * - onAskQuestion: Callback to submit a question
 * - onClearContext: Callback when user clears step context
 * - onClose: Optional callback for mobile close button
 * - hideHeader: Hide header on desktop
 */
const AskSIAPanel = ({
    stepContext = null,
    fullCode = '',
    onFetchWhy = null,
    onAskQuestion = null,
    onClearContext = null,
    onClose = null,
    hideHeader = false
}) => {
    // Chat state
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [whyLoaded, setWhyLoaded] = useState(false);

    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const prevStepRef = useRef(null);

    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-generate "Why" when step context changes
    useEffect(() => {
        const stepKey = stepContext?.lineNumber;
        const prevKey = prevStepRef.current?.lineNumber;

        // If step changed, clear messages and fetch new Why
        if (stepKey !== prevKey) {
            // Clear all messages when step changes
            setMessages([]);
            setWhyLoaded(false);

            // Fetch Why for new step
            if (stepContext && onFetchWhy) {
                fetchWhyExplanation();
            }
        }

        prevStepRef.current = stepContext;
    }, [stepContext?.lineNumber]);

    // Fetch Why explanation and add as first message
    const fetchWhyExplanation = async () => {
        if (!stepContext || !onFetchWhy) return;

        setIsLoading(true);
        try {
            const explanation = await onFetchWhy();
            if (explanation) {
                // Set Why as the only message (messages cleared on step change)
                setMessages([{
                    id: Date.now(),
                    role: 'assistant',
                    type: 'why',
                    content: explanation,
                    lineNumber: stepContext.lineNumber
                }]);
                setWhyLoaded(true);
            }
        } catch (error) {
            console.error('[AskSIA] Why fetch error:', error);
            setMessages([{
                id: Date.now(),
                role: 'assistant',
                type: 'error',
                content: `Could not load explanation: ${error.message}`,
                lineNumber: stepContext.lineNumber
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle question submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const question = inputValue.trim();
        setInputValue('');

        // Add user message
        const userMessage = {
            id: Date.now(),
            role: 'user',
            type: 'question',
            content: question,
            lineNumber: stepContext?.lineNumber || null
        };
        setMessages(prev => [...prev, userMessage]);

        // Get AI response
        setIsLoading(true);
        try {
            if (onAskQuestion) {
                const answer = await onAskQuestion(question, stepContext);
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'assistant',
                    type: 'answer',
                    content: answer,
                    lineNumber: stepContext?.lineNumber || null
                }]);
            }
        } catch (error) {
            console.error('[AskSIA] Question error:', error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                type: 'error',
                content: error.message || 'Failed to get response'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle clearing step context
    const handleClearContext = () => {
        if (onClearContext) {
            onClearContext();
        }
    };

    // Custom markdown components
    const markdownComponents = {
        p: ({ children }) => <p className="text-slate-700 leading-relaxed mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        code: ({ children, inline }) => inline ? (
            <code className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-mono text-sm">{children}</code>
        ) : (
            <code className="font-mono text-sm">{children}</code>
        ),
        pre: ({ children }) => (
            <pre className="bg-slate-800 text-slate-100 rounded-lg p-3 overflow-x-auto my-2 text-sm">{children}</pre>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-slate-700">{children}</li>,
    };

    // Strip duplicate "Why this step matters" header from explanation content
    const preprocessExplanation = (text) => {
        if (!text) return '';
        return text
            .replace(/^💡\s*Why this step matters\s*\n*/i, '')
            .replace(/^Why this step matters\s*\n*/i, '')
            .trim();
    };

    // Render a single message
    const renderMessage = (msg) => {
        if (msg.type === 'why') {
            const cleanedContent = preprocessExplanation(msg.content);
            return (
                <div key={msg.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-indigo-700">Why this step matters</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown components={markdownComponents}>{cleanedContent}</ReactMarkdown>
                    </div>
                </div>
            );
        }

        if (msg.role === 'user') {
            return (
                <div key={msg.id} className="flex justify-end mb-4">
                    <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-2.5">
                        <p className="text-sm">{msg.content}</p>
                    </div>
                </div>
            );
        }

        if (msg.type === 'error') {
            return (
                <div key={msg.id} className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-700 text-sm">{msg.content}</p>
                </div>
            );
        }

        // Assistant answer
        return (
            <div key={msg.id} className="flex justify-start mb-4">
                <div className="max-w-[90%] bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header - Hidden on desktop */}
            {!hideHeader && (
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-slate-800">Ask SIA</span>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Step Context Pill */}
            {stepContext && (
                <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-indigo-600 font-medium mb-0.5">Asking about Line {stepContext.lineNumber}:</p>
                            <code className="text-sm font-mono text-slate-800 truncate block">{stepContext.code}</code>
                        </div>
                        <button
                            onClick={handleClearContext}
                            className="ml-3 p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors flex-shrink-0"
                            title="Remove step context (chat becomes general)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Empty State */}
                {messages.length === 0 && !isLoading && !stepContext && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                            <MessageCircle className="w-7 h-7 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Ask SIA</h3>
                        <p className="text-slate-500 text-sm max-w-xs">
                            Click <span className="font-semibold text-indigo-600">✨ Understand</span> on any step, or ask a general question below.
                        </p>
                    </div>
                )}

                {/* Loading Why */}
                {isLoading && messages.length === 0 && (
                    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        <span className="text-indigo-700 text-sm font-medium">Understanding this step...</span>
                    </div>
                )}

                {/* Messages */}
                {messages.map(renderMessage)}

                {/* Loading Answer */}
                {isLoading && messages.length > 0 && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                <span className="text-slate-500 text-sm">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-3 border-t border-slate-200 bg-white">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={stepContext ? "Ask a question about this step…" : "Ask anything about this code…"}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all bg-slate-50"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="flex-shrink-0 p-2.5 rounded-xl bg-indigo-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors hover:bg-indigo-700"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AskSIAPanel;
