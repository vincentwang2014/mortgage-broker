import React, { useState, useEffect } from 'react';
import { useLang } from '../App.jsx';

const LABELS = {
  en: {
    title: 'AI Advisor Admin',
    loginTitle: 'Admin Login',
    password: 'Password', login: 'Log In', loginError: 'Wrong password',
    logout: 'Log Out',
    tabKnowledge: 'Knowledge Base',
    tabPrompt: 'System Prompt (Advanced)',
    knowledgeTitle: 'Knowledge Base',
    knowledgeDesc: 'Add your business info, specialties, FAQ, and current promotions here. The AI will use this in every conversation.',
    knowledgeTips: [
      'Your specialties and target clients (e.g. Chinese-speaking buyers, self-employed)',
      'Frequently asked questions and your standard answers',
      'Current promotions or special programs you offer',
      'Your contact info and consultation process',
    ],
    promptTitle: 'System Prompt',
    promptDesc: 'Core AI knowledge base — loan programs, underwriting guidelines, and behavior rules. Edit carefully.',
    promptTips: [
      'Change loan limits, credit score minimums, DTI caps',
      'Update preferred lenders or rate lock policy',
      'The RULES section controls AI behavior boundaries',
      'Test changes on the /chat page after saving',
    ],
    save: 'Save', saving: 'Saving...', saved: 'Saved!',
    saveError: 'Save failed', loadError: 'Could not load',
    placeholder: 'Password',
  },
  zh: {
    title: 'AI顾问后台管理',
    loginTitle: '管理员登录',
    password: '密码', login: '登录', loginError: '密码错误',
    logout: '退出',
    tabKnowledge: '知识库',
    tabPrompt: '系统提示词（高级）',
    knowledgeTitle: '知识库编辑',
    knowledgeDesc: '在这里填写你的特色服务、常见问题解答、最新政策等。AI 会在每次对话中自动使用这些内容。',
    knowledgeTips: [
      '你的特色服务和目标客户群（如华人买家、自雇人士）',
      '常见问题及标准解答',
      '当前优惠活动或特色贷款项目',
      '联系方式和预约咨询流程',
    ],
    promptTitle: '系统提示词',
    promptDesc: 'AI 的核心知识库——贷款类型、核保规则和行为准则。如不确定请勿随意修改。',
    promptTips: [
      '可修改贷款额度、最低信用分、DTI上限等参数',
      '更新优选贷款机构或利率锁定政策',
      '规则部分控制 AI 的回答边界，请谨慎修改',
      '保存后在 /chat 页面测试效果',
    ],
    save: '保存', saving: '保存中...', saved: '已保存！',
    saveError: '保存失败', loadError: '加载失败',
    placeholder: '请输入密码',
  },
};

function Editor({ apiPath, password, title, desc, tips, placeholder, labels }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function load() {
      setLoadError('');
      try {
        const res = await fetch(`/api/admin/${apiPath}`, {
          headers: { 'x-admin-password': password },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setContent(data.content);
      } catch { setLoadError(labels.loadError); }
    }
    load();
  }, [apiPath, password]);

  async function handleSave() {
    setStatus('saving');
    try {
      const res = await fetch(`/api/admin/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch { setStatus('error'); setTimeout(() => setStatus('idle'), 3000); }
  }

  return (
    <div className="form-section">
      <div className="form-section-title">{title}</div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.25rem', padding: '0.875rem', background: 'var(--cream)', borderRadius: '8px' }}>
        {tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--gold)', flexShrink: 0 }}>•</span>{tip}
          </div>
        ))}
      </div>
      {loadError && <p style={{ color: 'red', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{loadError}</p>}
      <textarea
        className="form-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: apiPath === 'knowledge' ? '400px' : '520px', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: '1.6', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
        {status === 'saved' && <span style={{ color: 'green', fontSize: '0.85rem', fontWeight: 500 }}>{labels.saved}</span>}
        {status === 'error' && <span style={{ color: 'red', fontSize: '0.85rem' }}>{labels.saveError}</span>}
        <button className="btn btn-primary" onClick={handleSave} disabled={status === 'saving' || !content.trim()}>
          {status === 'saving' ? labels.saving : labels.save}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { lang } = useLang();
  const L = LABELS[lang] || LABELS.en;
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('knowledge');

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { setLoginError(L.loginError); return; }
      setAuthed(true);
    } catch { setLoginError(L.loginError); }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--cream)' }}>
        <div className="card" style={{ maxWidth: '360px', width: '100%' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.25rem' }}>{L.loginTitle}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>{L.title}</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{L.password}</label>
              <input className="form-input" type="password" required autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder={L.placeholder} />
            </div>
            {loginError && <p style={{ color: 'red', fontSize: '0.82rem' }}>{loginError}</p>}
            <button className="btn btn-primary">{L.login}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}>{L.title}</h1>
        <button className="btn btn-outline btn-sm" onClick={() => setAuthed(false)}>{L.logout}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'knowledge', label: L.tabKnowledge },
          { key: 'prompt', label: L.tabPrompt },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--navy)' : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--navy)' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'knowledge' && (
        <Editor
          apiPath="knowledge"
          password={password}
          title={L.knowledgeTitle}
          desc={L.knowledgeDesc}
          tips={L.knowledgeTips}
          placeholder="# 在这里添加你的特色服务、FAQ、政策更新..."
          labels={L}
        />
      )}

      {tab === 'prompt' && (
        <Editor
          apiPath="prompt"
          password={password}
          title={L.promptTitle}
          desc={L.promptDesc}
          tips={L.promptTips}
          placeholder="System prompt content..."
          labels={L}
        />
      )}
    </div>
  );
}
