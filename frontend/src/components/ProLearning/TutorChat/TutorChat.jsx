import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { IoHelpCircle, IoSend, IoSparkles } from 'react-icons/io5';
import { askTutor } from '../services';

const initialGreeting = `Hi, I'm Sia. Ask me anything about this reading.`;

/**
 * TutorChat
 * An inline chat interface that appears below the reading material.
 * Props:
 * - readingContent: string
 * - topicName: string
 * - courseId: string
 * - sidebarVisible: boolean (optional)
 */
const TutorChat = forwardRef(({ readingContent, topicName, courseId, sidebarVisible = false }, ref) => {
  const [open, setOpen] = useState(true); // Show chat by default
  const [showFloatingButton, setShowFloatingButton] = useState(false); // Hide button initially
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: initialGreeting }
  ]);
  const [expanded, setExpanded] = useState(() => new Set());

  // Expose method to parent component for text selection
  useImperativeHandle(ref, () => ({
    handleSelectedText: (text) => {
      if (text) {
        setSelectedContext(text);
        setInput(`About this text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\n`);
        
        // Focus input after a brief delay
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
          }
        }, 100);
        
        // Scroll to chat
        setTimeout(() => {
          const container = chatContainerRef.current;
          if (container) {
            const inputArea = container.querySelector('[data-chat-input]');
            if (inputArea) {
              inputArea.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end',
                inline: 'nearest'
              });
            }
          }
        }, 150);
      }
    }
  }), []);

  const canChat = useMemo(() => typeof readingContent === 'string' && readingContent.trim().length > 0, [readingContent]);

  // Check if user is near the bottom of the page to show/hide floating button
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      
      const chatRect = chatContainerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const chatBottom = chatRect.bottom;
      
      // If chat bottom is visible (within 100px of viewport), hide button
      const isNearBottom = chatBottom <= viewportHeight + 100;
      setShowFloatingButton(!isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      // Scroll within the messages container, not the whole page
      const messagesContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (messagesContainer) {
        messagesContainer.scrollTo({ 
          top: messagesContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, open]);

  // Opening scroll is handled in handleToggle via a continuous rAF loop to avoid jitter.
  // Intentionally no-op here to prevent double scrolling.
  useEffect(() => {}, [open]);

  const isLongMessage = (content, role) => {
    if (!content) return false;
    const len = content.length;
    const lines = (content.match(/\n/g) || []).length;
    const hasCode = content.includes('```');
    if (lines > 3 || hasCode) return true;
    const threshold = role === 'assistant' ? 200 : 100;
    return len > threshold;
  };

  const toggleExpand = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const CodeBlock = ({ inline, className, children, ...props }) => {
    const isInline = !!inline;
    const text = String(children || '').replace(/\n$/, '');
    if (isInline) {
      return <code className="bg-gray-800 text-green-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
    }

    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : undefined;

    const onCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {}
    };

    return (
      <div className="relative group my-3">
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          wrapLongLines
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            padding: '1rem',
          }}
          PreTag="div"
          {...props}
        >
          {text}
        </SyntaxHighlighter>
        <button
          onClick={onCopy}
          className="absolute top-2 right-2 hidden group-hover:inline-flex text-xs px-2 py-1 rounded bg-gray-700/90 text-gray-100 hover:bg-gray-600"
          aria-label="Copy code"
        >
          Copy
        </button>
      </div>
    );
  };

  const onSend = async () => {
    if (!input.trim() || busy) return;
    const userMsg = input.trim();
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setBusy(true);
    
    // Clear selected context after sending
    const contextToSend = selectedContext;
    setSelectedContext('');
    
    try {
      const reply = await askTutor({
        readingContent,
        message: userMsg,
        topic: topicName,
        courseId,
        history: messages,
        selectedText: contextToSend
      });
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const msg = e?.message || 'Tutor is unavailable right now.';
      setError(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = () => {
    // Just scroll to the chat bottom when clicked
    setTimeout(() => {
      const container = chatContainerRef.current;
      if (container) {
        const inputArea = container.querySelector('[data-chat-input]');
        if (inputArea) {
          inputArea.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end',
            inline: 'nearest'
          });
        }
      }
    }, 50);
  };

  return (
    <>
      {/* Enhanced smooth scrolling styles */}
      <style>{`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 100px;
        }
        
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
        
        .sia-floating-button {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          left: auto !important;
          top: auto !important;
          transform: none !important;
          margin: 0 !important;
          z-index: 9999 !important;
        }
      `}</style>

      {/* Floating Button - Only show when chat is off-screen - FIXED POSITION FROM VIEWPORT */}
      {showFloatingButton && (
        <button
          onClick={handleToggle}
          disabled={!canChat}
          className={`sia-floating-button flex items-center rounded-full shadow-2xl gap-2 px-3 lg:gap-3 lg:px-5 py-3 ${
            canChat
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-110 hover:shadow-blue-500/50'
              : 'bg-gray-400 cursor-not-allowed text-white'
          }`}
          title="Scroll to Sia"
        >
          <IoSparkles className="text-xl" />
          <span className="text-sm font-semibold hidden sm:inline">Ask Sia</span>
        </button>
      )}

      {/* Inline Chat Interface - Matches MainContentLayout structure */}
      <div className={`transition-all duration-300 ${
        sidebarVisible ? 'lg:mr-[400px]' : ''
      }`}>
        <div 
          ref={chatContainerRef} 
          className="w-full px-0 lg:px-6 mt-8 mb-6"
        >
          {/* Chat Panel - Always visible, responsive height */}
          <div className="h-[850px] sm:h-[900px] lg:h-[950px] opacity-100">
            <div 
              className="bg-white border-2 border-gray-200 rounded-xl shadow-lg h-full flex flex-col"
              data-chat-panel
            >
            {/* Header (close button removed per request) */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <IoHelpCircle className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">Sia</div>
                  <div className="text-sm text-gray-600">{topicName || 'Current Topic'}</div>
                </div>
              </div>
            </div>

            {/* Messages - Scrollable area that takes remaining space */}
            <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50 min-h-0">
              <div className="space-y-4">
                {messages.map((m, i) => {
                  const long = isLongMessage(m.content, m.role);
                  const isExpanded = expanded.has(i);
                  const isUser = m.role === 'user';
                  
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
                        {!isUser && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <IoSparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Sia</span>
                          </div>
                        )}
                        <div 
                          className={`relative rounded-2xl px-4 py-3 ${
                            isUser 
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                              : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                          }`}
                        >
                          <div className={`${long && !isExpanded ? 'max-h-48 overflow-hidden' : ''}`}>
                            {isUser ? (
                              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {m.content}
                              </div>
                            ) : (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{ 
                                    code: CodeBlock,
                                    p: ({node, ...props}) => <p className="text-sm leading-relaxed my-2" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                                    li: ({node, ...props}) => <li className="text-sm" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                  }}
                                >
                                  {m.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                          {long && !isExpanded && (
                            <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${
                              isUser ? 'from-blue-600' : 'from-white'
                            } to-transparent rounded-b-2xl`} />
                          )}
                        </div>
                        {long && (
                          <button
                            onClick={() => toggleExpand(i)}
                            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Loading indicator in message flow */}
                {busy && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <IoSparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Sia</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed Input Area - Always at bottom */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0" data-chat-input>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    placeholder={canChat ? 'Ask Sia about this topic…' : 'Reading not loaded yet'}
                    disabled={!canChat || busy}
                    rows={1}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm outline-none resize-none transition-all ${
                      !canChat 
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  {error && (
                    <div className="mt-2 px-2 text-xs text-red-600 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={onSend}
                  disabled={!canChat || busy || !input.trim()}
                  className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${
                    (!canChat || !input.trim()) 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                  }`}
                  aria-label="Send message"
                >
                  <IoSend className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Shift + Enter</kbd> for new line
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
});

TutorChat.displayName = 'TutorChat';

export default TutorChat;
