import React, { useState, useEffect } from 'react';
import { useLang } from '../App.jsx';

export default function AdminPage() {
  const { lang } = useLang();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [loadError, setLoadError] = useState('');

  const isZh = lang === 'zh';
  const labels = {
    title: isZh ? 'AI顾问后台管理' : 'AI Advisor Admin',
    loginTitle: isZh ? '管理员登录' : 'Admin Login',
    passwordLabel: isZh ? '密码' : 'Password',
    loginBtn: isZh ? '登录' : 'Log In',
    loginError: isZh ? '密码错误' : 'Wrong password',
    promptTitle: isZh ? 'AI系统提示词' : 'AI System Prompt',
    promptDesc: isZh
      ? '编辑此内容以更新AI顾问的知识库和回答规则。保存后立即生效，无需重启服务。'
      : 'Edit this to update the AI advisor\'s knowledge base and answer rules. Changes take effect immediately — no restart needed.',
    save: isZh ? '保存' : 'Save Changes',
    saving: isZh ? '保存中...' : 'Saving...',
    saved: isZh ? '已保存！' : 'Saved!',
    saveError: isZh ? '保存失败，请重试' : 'Save failed, please try again',
    loadError: isZh ? '无法加载提示词' : 'Could not load prompt',
    logout: isZh ? '退出' : 'Log Out',
    tips: isZh ? [
      '可以直接修改贷款限额、信用分要求、DTI上限等参数',
      '添加新贷款类型时，请遵循现有的格式',
      '规则部分控制AI的行为边界，请谨慎修改',
      '修改后建议在前台/chat页面测试效果',
    ] : [
      'Edit loan limits, credit score requirements, DTI caps directly',
      'Follow the existing format when adding new loan programs',
      'The RULES section controls AI behavior — edit carefully',
      'Test changes on the /chat page after saving',
    ],
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { setLoginError(labels.loginError); return; }
      setAuthed(true);
      loadPrompt(password);
    } catch { setLoginError(labels.loginError); }
  }

  async function loadPrompt(pw) {
    setLoadError('');
    try {
      const res = await fetch('/api/admin/prompt', {
        headers: { 'x-admin-password': pw || password },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPrompt(data.content);
    } catch { setLoadError(labels.loadError); }
  }

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ content: prompt }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--cream)' }}>
        <div className="card" style={{ maxWidth: '360px', width: '100%' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.25rem' }}>{labels.loginTitle}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>{labels.title}</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{labels.passwordLabel}</label>
              <input
                className="form-input"
                type="password"
                required
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {loginError && <p style={{ color: 'red', fontSize: '0.82rem' }}>{loginError}</p>}
            <button className="btn btn-primary">{labels.loginBtn}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', marginBottom: '0.25rem' }}>{labels.title}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{labels.promptDesc}</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setAuthed(false)}>{labels.logout}</button>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr', marginBottom: '1.25rem' }}>
        {labels.tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600, flexShrink: 0 }}>•</span>
            {tip}
          </div>
        ))}
      </div>

      <div className="form-section">
        <div className="form-section-title">{labels.promptTitle}</div>
        {loadError && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{loadError}</p>}
        <textarea
          className="form-textarea"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{
            minHeight: '520px',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            lineHeight: '1.6',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.75rem', alignItems: 'center' }}>
          {saveStatus === 'saved' && (
            <span style={{ color: 'green', fontSize: '0.85rem', fontWeight: 500 }}>{labels.saved}</span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: 'red', fontSize: '0.85rem' }}>{labels.saveError}</span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !prompt.trim()}
          >
            {saveStatus === 'saving' ? labels.saving : labels.save}
          </button>
        </div>
      </div>
    </div>
  );
}
