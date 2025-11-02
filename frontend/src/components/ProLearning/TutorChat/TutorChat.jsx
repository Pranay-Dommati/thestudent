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

  const canChat = useMemo(() => typeof readingContent === 'string' && readingContent.trim().length > 0, [readingContent]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

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
        courseId
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
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-2 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed`}>
                  {m.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
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
