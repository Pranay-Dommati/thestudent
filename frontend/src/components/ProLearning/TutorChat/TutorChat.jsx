import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { IoHelpCircle, IoSend, IoSparkles, IoChevronDown } from 'react-icons/io5';
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
  const [open, setOpen] = useState(true); // Show chat by default on desktop
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile drawer state
  const [showFloatingButton, setShowFloatingButton] = useState(false); // Hide button initially
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const mobileMessagesEndRef = useRef(null);
  const desktopMessagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: initialGreeting }
  ]);

  // Expose method to parent component for text selection
  useImperativeHandle(ref, () => ({
    handleSelectedText: (text) => {
      if (text) {
        setSelectedContext(text);
        setInput(`About this text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\n`);
        
        // On mobile, open the drawer
        if (window.innerWidth < 1024) {
          setMobileOpen(true);
        }
        
        // Focus input after a brief delay
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
          }
        }, 100);
        
        // Scroll to chat on desktop
        if (window.innerWidth >= 1024) {
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
    }
  }), []);

  const canChat = useMemo(() => typeof readingContent === 'string' && readingContent.trim().length > 0, [readingContent]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

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
    if (open) {
      // Scroll desktop
      if (desktopMessagesEndRef.current) {
        const container = desktopMessagesEndRef.current.closest('.overflow-y-auto');
        if (container) {
          container.scrollTo({ 
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
      // Scroll mobile
      if (mobileMessagesEndRef.current) {
        const container = mobileMessagesEndRef.current.closest('.overflow-y-auto');
        if (container) {
          container.scrollTo({ 
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [messages, open]);

  // Opening scroll is handled in handleToggle via a continuous rAF loop to avoid jitter.
  // Intentionally no-op here to prevent double scrolling.
  useEffect(() => {}, [open]);

  const [copySuccess, setCopySuccess] = React.useState({});
  
  const CodeBlock = ({ inline, className, children, ...props }) => {
    const isInline = !!inline;
    const text = String(children || '').replace(/\n$/, '');
    if (isInline) {
      return <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200" {...props}>{children}</code>;
    }

    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : 'code';
    const blockId = text.slice(0, 50);

    const onCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopySuccess(prev => ({ ...prev, [blockId]: true }));
        setTimeout(() => {
          setCopySuccess(prev => ({ ...prev, [blockId]: false }));
        }, 2000);
      } catch (_) {}
    };

    return (
      <div className="relative my-3">
        {/* Header bar with language and copy button - always visible */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border border-gray-200 border-b-0 rounded-t-xl">
          <span className="text-xs text-gray-600 font-medium">{lang}</span>
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Copy code"
          >
            {copySuccess[blockId] ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy code
              </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          language={lang === 'code' ? undefined : lang}
          style={vs}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.75rem 0.75rem',
            fontSize: '0.875rem',
            padding: '1rem',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderTop: 'none',
            overflowX: 'auto',
            overscrollBehaviorX: 'contain',
          }}
          PreTag="div"
          {...props}
        >
          {text}
        </SyntaxHighlighter>
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
    // On mobile, toggle drawer
    if (window.innerWidth < 1024) {
      setMobileOpen(!mobileOpen);
      return;
    }
    
    // On desktop, just scroll to the chat bottom when clicked
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
        
        /* Mobile drawer overlay */
        .mobile-drawer-overlay {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(0, 0, 0, 0.5) !important;
          z-index: 9998 !important;
          transition: opacity 300ms ease-in-out !important;
        }
        
        /* Mobile drawer */
        .mobile-drawer {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 85vh !important;
          background: white !important;
          z-index: 9999 !important;
          border-radius: 32px 32px 0 0 !important;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2) !important;
          transform: translateY(100%) !important;
          transition: transform 300ms ease-in-out !important;
          overflow: hidden !important;
        }
        
        .mobile-drawer.open {
          transform: translateY(0) !important;
        }
        
        @media (min-width: 1024px) {
          .mobile-drawer,
          .mobile-drawer-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Button - Show on desktop when scrolled, always show on mobile */}
      <div className="sia-floating-button">
        {((showFloatingButton && window.innerWidth >= 1024) || (window.innerWidth < 1024 && !mobileOpen)) && (
          <button
            onClick={handleToggle}
            disabled={!canChat}
            className={`flex items-center rounded-full shadow-2xl gap-2 px-3 lg:gap-3 lg:px-5 py-3 w-full ${
              canChat
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-110 hover:shadow-blue-500/50'
                : 'bg-gray-400 cursor-not-allowed text-white'
            }`}
            title="Ask Sia"
          >
            <IoSparkles className="text-xl" />
            <span className="text-sm font-semibold hidden sm:inline">Ask Sia</span>
          </button>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="mobile-drawer-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="h-full flex flex-col bg-white">
          {/* Mobile Header with Close Button */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-200 flex-shrink-0 rounded-t-[32px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <IoHelpCircle className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">Sia</div>
                  <div className="text-sm text-gray-600">{topicName || 'Current Topic'}</div>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <IoChevronDown className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Mobile Messages - Same structure as desktop */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50 min-h-0 overscroll-y-contain">
            <div className="space-y-4">
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                
                return (
                  <div key={`mobile-${i}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
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
                        <div>
                          {isUser ? (
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {m.content}
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{ 
                                  pre: ({children}) => <>{children}</>,
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
                      </div>
                    </div>
                  </div>
                );
              })}
              
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
              
              <div ref={mobileMessagesEndRef} />
            </div>
          </div>

          {/* Mobile Input */}
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
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
          </div>
        </div>
      </div>

      {/* Desktop Inline Chat Interface - Hidden on mobile */}
      <div className="hidden lg:block">
      <div className={`transition-all duration-300 ${
        sidebarVisible ? 'lg:mr-[400px]' : ''
      }`}>
        <div 
          ref={chatContainerRef} 
          className="w-full px-0 lg:px-6 mt-8 mb-6"
        >
          {/* Chat Panel - Always visible, responsive height */}
          <div className="h-[600px] sm:h-[650px] lg:h-[700px] opacity-100">
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
                          <div>
                            {isUser ? (
                              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {m.content}
                              </div>
                            ) : (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{ 
                                    pre: ({children}) => <>{children}</>,
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
                        </div>
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
                
                <div ref={desktopMessagesEndRef} />
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
      </div>
    </>
  );
});

TutorChat.displayName = 'TutorChat';

export default TutorChat;
