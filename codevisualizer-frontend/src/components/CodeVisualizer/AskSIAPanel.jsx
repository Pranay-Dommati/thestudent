import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageCircle, Loader2, Send, X } from 'lucide-react';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
import StructuredBlockRenderer from '../Shared/StructuredBlockRenderer';

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
 * - externalMessages: Optional - pass to lift state up to parent
 * - setExternalMessages: Optional - pass to lift state up to parent
 * - externalChatId: Optional - pass to lift state up to parent
 */
// Isolated Input Component to prevent re-renders of the heavy chat list
const ChatInput = ({ onSend, isLoading, placeholder }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!value.trim() || isLoading) return;
        onSend(value.trim());
        setValue('');
    };

    return (
        <form onSubmit={onSubmit} className="flex items-center gap-2">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all bg-slate-50"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={!value.trim() || isLoading}
                className="flex-shrink-0 p-2.5 rounded-xl bg-indigo-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors hover:bg-indigo-700"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
        </form>
    );
};

const AskSIAPanel = ({
    stepContext = null,
    fullCode = '',
    onFetchWhy = null,
    onAskQuestion = null,
    onClearContext = null,
    onClose = null,
    hideHeader = false,
    externalMessages = null,
    setExternalMessages = null,
    externalChatId = null
}) => {
    // Chat state - use external if provided (for persistence), otherwise internal
    const [internalChatId] = useState(() => `chat_${Date.now()}`);
    const [internalMessages, setInternalMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Use external state if provided, otherwise use internal
    const chatId = externalChatId || internalChatId;
    const messages = externalMessages !== null ? externalMessages : internalMessages;
    const setMessages = setExternalMessages || setInternalMessages;

    const messagesContainerRef = useRef(null);

    const prevStepRef = useRef(null);

    const lastMessageRef = useRef(null);

    // Scroll to the START of the new message (so user sees the top of it)
    const scrollToNewMessage = () => {
        if (messagesContainerRef.current && lastMessageRef.current) {
            const container = messagesContainerRef.current;
            const messageTop = lastMessageRef.current.offsetTop;

            // Scroll container to show the start of the message with a little buffer
            container.scrollTo({
                top: messageTop - 20, // 20px buffer for breathing room
                behavior: 'smooth'
            });
        }
    };

    // Auto-generate "Why" when step context changes (PERSISTENT CHAT)
    useEffect(() => {
        const stepKey = stepContext?.lineNumber;
        const prevKey = prevStepRef.current?.lineNumber;

        // If step changed, append new Why to existing chat (NOT clear)
        if (stepKey !== prevKey && stepContext && onFetchWhy) {
            // Append new "Why" explanation to existing chat
            fetchWhyExplanation();
        }

        prevStepRef.current = stepContext;
    }, [stepContext?.lineNumber]);

    // Fetch Why explanation and APPEND to existing chat (persistent history)
    const fetchWhyExplanation = async () => {
        if (!stepContext || !onFetchWhy) return;

        // First, add a system-generated "user" message to show what's being asked
        const systemUserMessage = {
            id: Date.now(),
            role: 'user',
            type: 'system-prompt',  // Special type for auto-generated prompts
            content: `Line ${stepContext.lineNumber}: Why does this step matter?`,
            lineNumber: stepContext.lineNumber
        };
        setMessages(prev => [...prev, systemUserMessage]);

        // Scroll to the new message after a brief delay for render
        setTimeout(scrollToNewMessage, 100);

        setIsLoading(true);
        try {
            const response = await onFetchWhy();
            if (response) {
                // Response now includes both explanation and blocks for structured rendering
                const { explanation, blocks } = response;
                // APPEND AI response after the system prompt
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'assistant',
                    type: 'why',
                    content: explanation,
                    blocks: blocks,  // Structured blocks for enterprise rendering
                    lineNumber: stepContext.lineNumber
                }]);
                // Scroll to show the response
                setTimeout(scrollToNewMessage, 100);
            }
        } catch (error) {
            console.error('[AskSIA] Why fetch error:', error);
            setMessages(prev => [...prev, {
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
    const handleSend = async (questionText) => {
        if (!questionText || isLoading) return;

        const question = questionText;

        // Add user message
        const userMessage = {
            id: Date.now(),
            role: 'user',
            type: 'question',
            content: question,
            lineNumber: stepContext?.lineNumber || null
        };
        setMessages(prev => [...prev, userMessage]);

        // Scroll to show the user's message
        setTimeout(scrollToNewMessage, 50);

        // Get AI response with full conversation history
        setIsLoading(true);
        try {
            if (onAskQuestion) {
                // Build conversation object for context-aware AI
                const conversationForAI = {
                    id: chatId,
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                };

                const response = await onAskQuestion(question, { stepContext, conversation: conversationForAI });
                // Response now includes both answer and blocks for structured rendering
                const { answer, blocks } = response;
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'assistant',
                    type: 'answer',
                    content: answer,
                    blocks: blocks,  // Structured blocks for enterprise rendering
                    lineNumber: stepContext?.lineNumber || null
                }]);
                // Scroll to show the AI response
                setTimeout(scrollToNewMessage, 100);
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
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-700">Why this step matters</span>
                    </div>
                    {msg.blocks && Array.isArray(msg.blocks) && msg.blocks.length > 0 ? (
                        <StructuredBlockRenderer
                            blocks={msg.blocks.filter(b =>
                                !(b.type === 'heading' && b.content.includes('Why this step matters'))
                            )}
                        />
                    ) : (
                        <MarkdownRenderer content={cleanedContent} />
                    )}
                </div>
            );
        }

        if (msg.role === 'user') {
            const isSystemPrompt = msg.type === 'system-prompt';
            return (
                <div className="flex justify-end mb-4">
                    <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-2.5">
                        <p className="text-sm flex items-center gap-2">
                            {isSystemPrompt && <Sparkles className="w-3 h-3 opacity-70" />}
                            {msg.content}
                        </p>
                    </div>
                </div>
            );
        }

        if (msg.type === 'error') {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-700 text-sm">{msg.content}</p>
                </div>
            );
        }

        // Assistant answer - full width like Why block
        // Use StructuredBlockRenderer if blocks are available, otherwise fall back to MarkdownRenderer
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-4 overflow-hidden">
                {msg.blocks && Array.isArray(msg.blocks) && msg.blocks.length > 0 ? (
                    <StructuredBlockRenderer blocks={msg.blocks} />
                ) : (
                    <MarkdownRenderer content={msg.content} />
                )}
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

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 relative"
            >
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
                {messages.map((msg, index) => (
                    <div key={msg.id} ref={index === messages.length - 1 ? lastMessageRef : null}>
                        {renderMessage(msg)}
                    </div>
                ))}

                {/* Loading Answer */}
                {isLoading && messages.length > 0 && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                <span className="text-slate-500 text-sm">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}


            </div>

            {/* Step Context Pill */}
            {stepContext && (
                <div className="flex-shrink-0 px-4 py-2 border-t border-indigo-100 bg-indigo-50/50">
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

            {/* Input Area */}
            <div className={`flex-shrink-0 p-3 bg-white ${!stepContext ? 'border-t border-slate-200' : ''}`}>
                <ChatInput
                    onSend={handleSend}
                    isLoading={isLoading}
                    placeholder={stepContext ? "Ask a question about this step…" : "Ask anything about this code…"}
                />
            </div>
        </div>
    );
};

export default AskSIAPanel;
