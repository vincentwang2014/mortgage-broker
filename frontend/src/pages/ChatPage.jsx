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
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const bottomRef = useRef(null);
  const sessionIdRef = useRef(Date.now().toString(36) + Math.random().toString(36).slice(2));

  useEffect(() => {
    setMessages([{ role: 'assistant', content: C.greeting }]);
  }, [lang]);

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data);
          const def = data.find(a => a.isDefault) || data[0];
          setSelectedAgentId(def.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleAgentChange(id) {
    setSelectedAgentId(id);
    sessionIdRef.current = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setMessages([{ role: 'assistant', content: C.greeting }]);
    setInput('');
  }

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    const history = [...messages, { role: 'user', content: userMsg }];
    setMessages(history);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, lang, agentId: selectedAgentId }),
      });

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';
      let msgAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.delta) {
              if (!msgAdded) {
                msgAdded = true;
                setLoading(false);
              }
              accumulated += parsed.delta;
              setMessages(prev => {
                const copy = [...prev];
                if (copy[copy.length - 1]?.role === 'assistant') {
                  copy[copy.length - 1] = { role: 'assistant', content: accumulated };
                } else {
                  copy.push({ role: 'assistant', content: accumulated });
                }
                return copy;
              });
            }
          } catch { /* skip malformed chunk */ }
        }
      }

      if (!accumulated) {
        setMessages(prev => [...prev, { role: 'assistant', content: C.error }]);
      } else {
        fetch('/api/chatlog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            messages: [...history, { role: 'assistant', content: accumulated }],
            agentId: selectedAgentId,
            lang,
          }),
        }).catch(() => {});
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: C.error }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="chat-page">
      <div className="chat-header">
        {agents.length > 1 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <select
              className="form-select"
              style={{ maxWidth: '280px', fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
              value={selectedAgentId || ''}
              onChange={e => handleAgentChange(e.target.value)}
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.isDefault ? ' ★' : ''}
                </option>
              ))}
            </select>
            {selectedAgent?.description && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {selectedAgent.description}
              </p>
            )}
          </div>
        )}
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
