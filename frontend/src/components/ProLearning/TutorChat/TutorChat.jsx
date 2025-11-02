import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IoHelpCircle, IoClose, IoSend } from 'react-icons/io5';
import { askTutor } from '../services';

const initialGreeting = `Hi! I'm your AI learning tutor. I’ll use the Reading Material on this page as our main reference. Ask me anything — I can explain, break things down, give examples, and guide you with questions.`;

/**
 * TutorChat
 * A lightweight floating chat specifically for the Reading tab.
 * Props:
 * - readingContent: string
 * - topicName: string
 * - courseId: string
 */
export default function TutorChat({ readingContent, topicName, courseId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: initialGreeting }
  ]);
  const [expanded, setExpanded] = useState(() => new Set()); // track expanded message indexes

  const canChat = useMemo(() => typeof readingContent === 'string' && readingContent.trim().length > 0, [readingContent]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  // Heuristic: consider a message "long" if it exceeds thresholds
  const isLongMessage = (content, role) => {
    if (!content) return false;
    const len = content.length;
    const lines = (content.match(/\n/g) || []).length;
    const hasCode = content.includes('```');
    // Treat multi-line content or code blocks as long for full-width layout
    if (lines > 1 || hasCode) return true;
    // Different length thresholds by role (assistant answers tend to be longer)
    const threshold = role === 'assistant' ? 140 : 80;
    return len > threshold;
  };

  const isShortMessage = (content) => {
    if (!content) return true;
    const len = content.trim().length;
    const lines = (content.match(/\n/g) || []).length;
    const hasCode = content.includes('```') || content.includes('|');
    return len <= 40 && lines === 0 && !hasCode;
  };

  const toggleExpand = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // Custom renderer for code blocks with a copy button
  const CodeBlock = ({ inline, className, children, ...props }) => {
    const isInline = !!inline;
    const text = String(children || '').replace(/\n$/, '');
    if (isInline) {
      return <code className={className} {...props}>{children}</code>;
    }
    const lang = (className || '').replace('language-', '') || 'text';
    const onCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {}
    };
    return (
      <div className="relative group">
        <pre className={`overflow-auto rounded-md p-3 bg-[#0b1021] text-gray-100`}>
          <code className={className} data-lang={lang} {...props}>{text}</code>
        </pre>
        <button
          onClick={onCopy}
          className="absolute top-2 right-2 hidden group-hover:inline-flex text-xs px-2 py-1 rounded bg-gray-800/80 text-gray-100 hover:bg-gray-700"
          aria-label="Copy code"
        >
          Copy code
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
    try {
      const reply = await askTutor({
        readingContent,
        message: userMsg,
        topic: topicName,
        courseId,
        history: messages,
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

  return (
    <div className="fixed z-[60]">
      {/* Floating Button (hidden when panel open) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          disabled={!canChat}
          className={`fixed bottom-5 right-5 lg:bottom-8 lg:right-8 rounded-full shadow-lg px-4 py-3 flex items-center gap-2 transition-colors ${
            canChat ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          aria-label="Open tutor chat"
          title={canChat ? 'Ask the tutor about this reading' : 'Tutor available when reading content is loaded'}
        >
          <IoHelpCircle className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-semibold">Ask Tutor</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-0 right-0 left-0 lg:left-auto lg:w-[380px] lg:mr-8 lg:mb-8 w-full bg-white border border-gray-200 shadow-2xl rounded-t-2xl lg:rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <div className="text-sm font-semibold text-gray-900">AI Tutor</div>
              <div className="text-xs text-gray-600 truncate max-w-[260px]">{topicName || 'Current Topic'}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Close chat"
            >
              <IoClose className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-[55vh] lg:max-h-[420px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => {
              const long = isLongMessage(m.content, m.role);
              const short = !long && isShortMessage(m.content);
              const isExpanded = expanded.has(i);
              const bubbleBg = m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900';
              const overlayFrom = m.role === 'user' ? 'from-blue-600' : 'from-gray-100';
              const outerClass = long ? 'w-full' : `w-full flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`;
              const widthClass = long ? 'w-full' : 'inline-block max-w-[85%]';
              return (
                <div key={i} className={outerClass}>
                  <div className={`${bubbleBg} relative ${widthClass} px-3 py-2 rounded-2xl whitespace-pre-wrap break-words text-sm leading-relaxed`}>
                    <div className={`${long && !isExpanded ? 'max-h-40 overflow-hidden pr-1' : ''}`}>
                      {m.role === 'assistant' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{ code: CodeBlock }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        m.content
                      )}
                    </div>
                    {long && !isExpanded && (
                      <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t ${overlayFrom} to-transparent rounded-b-2xl`} />
                    )}
                  </div>
                  {long && (
                    <div className="mt-1 mb-2 text-right">
                      <button
                        onClick={() => toggleExpand(i)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="border-t p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
                placeholder={canChat ? 'Ask about the reading…' : 'Reading not loaded yet'}
                disabled={!canChat || busy}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${!canChat ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
              />
              <button
                onClick={onSend}
                disabled={!canChat || busy || !input.trim()}
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 ${(!canChat || !input.trim()) ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors`}
                aria-label="Send"
              >
                <IoSend className="w-4 h-4" />
              </button>
            </div>
            {busy && <div className="px-1 pt-1 text-xs text-gray-500">Writing…</div>}
            {error && <div className="px-1 pt-1 text-xs text-red-600">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
