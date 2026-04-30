import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../App.jsx';

export default function ChatPage() {
  const { T, lang } = useLang();
  const C = T.chat;
  const [messages, setMessages] = useState([
    { role: 'assistant', content: C.greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Reset greeting when language changes
  useEffect(() => {
    setMessages([{ role: 'assistant', content: C.greeting }]);
  }, [lang]);

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
        body: JSON.stringify({ messages: updated, lang }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content || C.error }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: C.error }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>{C.title}</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{C.subtitle}</p>
      </div>

      {messages.length === 1 && (
        <div className="chips">
          {C.prompts.map(p => (
            <button key={p} className="chip" onClick={() => sendMessage(p)}>{p}</button>
          ))}
        </div>
      )}

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message message-${m.role}`}>
            {m.content.split('\n').map((line, j, arr) => (
              <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
            ))}
          </div>
        ))}
        {loading && (
          <div className="typing-indicator">
            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
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
          placeholder={C.placeholder}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
          {C.send}
        </button>
      </div>
    </div>
  );
}
