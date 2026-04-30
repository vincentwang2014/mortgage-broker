import React, { useState, useRef, useEffect } from 'react';

const QUICK_PROMPTS = [
  "What credit score do I need to buy a home?",
  "How much down payment do I need?",
  "What's the difference between FHA and conventional?",
  "Can I qualify if I'm self-employed?",
  "What is a DSCR loan?",
  "Explain DTI ratio",
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm ClearPath's AI mortgage advisor. Ask me anything about loan programs, qualification, rates, or the homebuying process. I'll give you straight answers with real numbers.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const updated = [...messages, { role: 'user', content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content || 'Sorry, I had trouble with that. Please try again.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your backend is running and try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>AI Mortgage Advisor</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Powered by Claude &mdash; Not a commitment to lend
        </p>
      </div>

      {messages.length === 1 && (
        <div className="chips">
          {QUICK_PROMPTS.map(p => (
            <button key={p} className="chip" onClick={() => sendMessage(p)}>{p}</button>
          ))}
        </div>
      )}

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message message-${m.role}`}>
            {m.content.split('\n').map((line, j) => (
              <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
            ))}
          </div>
        ))}
        {loading && (
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="form-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about rates, programs, qualification..."
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
