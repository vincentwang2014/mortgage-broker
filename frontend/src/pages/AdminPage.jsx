import React, { useState, useEffect } from 'react';
import { useLang } from '../App.jsx';

const LABELS = {
  en: {
    title: 'AI Advisor Admin',
    loginTitle: 'Admin Login',
    password: 'Password', login: 'Log In', loginError: 'Wrong password',
    logout: 'Log Out',
    tabKnowledge: 'Knowledge Base',
    tabPrompt: 'System Prompt',
    tabAgents: 'Agents',
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
    // Agents tab
    agentsNew: '+ New Agent',
    agentProvider: 'Provider',
    agentModel: 'Model',
    agentBaseUrl: 'Base URL',
    agentOptional: 'optional',
    agentApiKeyEnv: 'Env var:',
    agentName: 'Name',
    agentDesc: 'Description',
    agentTasks: 'Tasks (comma-separated)',
    agentTemp: 'Temperature',
    agentMaxTokens: 'Max Tokens',
    agentPrompt: 'System Prompt',
    agentPromptHint: 'Leave empty to use the default System Prompt tab content.',
    agentKnowledge: 'Knowledge Base',
    agentKnowledgeHint: 'Leave empty to use the default Knowledge Base tab content.',
    agentIsDefault: 'Default Agent',
    agentEnabled: 'Enabled',
    agentEdit: 'Edit',
    agentDelete: 'Delete',
    agentCancel: 'Cancel',
    agentSave: 'Save Agent',
    agentSaving: 'Saving...',
    agentDeleteConfirm: 'Delete this agent? This cannot be undone.',
    agentDefault: 'Default',
    agentDisabled: 'Disabled',
    agentNoAgents: 'No agents yet. Create one to get started.',
    agentLoadError: 'Failed to load agents',
    agentSaveError: 'Save failed',
    // Documents tab
    tabDocuments: 'Documents',
    docTitle: 'Knowledge Documents',
    docDesc: 'Upload lender guidelines, rate sheets, emails, or any reference material. The AI will search these documents when answering questions.',
    docAddText: '+ Add Text / Email',
    docAddFile: '+ Upload PDF',
    docFormTitle: 'Document Title',
    docFormType: 'Type',
    docFormLender: 'Lender',
    docFormDate: 'Date',
    docFormContent: 'Content',
    docFormFile: 'File (PDF or .txt)',
    docCancel: 'Cancel',
    docSave: 'Save',
    docSaving: 'Saving...',
    docDelete: 'Delete',
    docDeleteConfirm: 'Delete this document? This cannot be undone.',
    docChunks: 'chunks',
    docNoDocuments: 'No documents yet. Upload lender guidelines or paste email content to get started.',
    docLoadError: 'Failed to load documents',
    docSaveError: 'Failed to save document',
    docTypeOptions: ['general', 'guideline', 'rate-sheet', 'email', 'announcement', 'other'],
  },
  zh: {
    title: 'AI顾问后台管理',
    loginTitle: '管理员登录',
    password: '密码', login: '登录', loginError: '密码错误',
    logout: '退出',
    tabKnowledge: '知识库',
    tabPrompt: '系统提示词',
    tabAgents: 'Agents',
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
    // Agents tab
    agentsNew: '+ 新建 Agent',
    agentProvider: '供应商',
    agentModel: '模型',
    agentBaseUrl: 'Base URL',
    agentOptional: '可选',
    agentApiKeyEnv: '环境变量:',
    agentName: '名称',
    agentDesc: '描述',
    agentTasks: '任务（逗号分隔）',
    agentTemp: '温度 (Temperature)',
    agentMaxTokens: '最大 Token 数',
    agentPrompt: '系统提示词',
    agentPromptHint: '为空时使用「系统提示词」tab 中的默认内容。',
    agentKnowledge: '知识库',
    agentKnowledgeHint: '为空时使用「知识库」tab 中的默认内容。',
    agentIsDefault: '设为默认',
    agentEnabled: '启用',
    agentEdit: '编辑',
    agentDelete: '删除',
    agentCancel: '取消',
    agentSave: '保存 Agent',
    agentSaving: '保存中...',
    agentDeleteConfirm: '确认删除此 Agent？此操作不可撤销。',
    agentDefault: '默认',
    agentDisabled: '已禁用',
    agentNoAgents: '还没有 Agent，请创建一个。',
    agentLoadError: '加载 Agent 失败',
    agentSaveError: '保存失败',
    // Documents tab
    tabDocuments: '文档库',
    docTitle: '知识文档管理',
    docDesc: '上传贷款机构指南、利率表、邮件或其他参考资料。AI 在回答问题时会自动检索这些文档。',
    docAddText: '+ 添加文字/邮件',
    docAddFile: '+ 上传 PDF',
    docFormTitle: '文档标题',
    docFormType: '类型',
    docFormLender: '贷款机构',
    docFormDate: '日期',
    docFormContent: '内容',
    docFormFile: '文件（PDF 或 .txt）',
    docCancel: '取消',
    docSave: '保存',
    docSaving: '保存中...',
    docDelete: '删除',
    docDeleteConfirm: '确认删除此文档？此操作不可撤销。',
    docChunks: '段落',
    docNoDocuments: '还没有文档。请上传贷款机构指南或粘贴邮件内容来开始。',
    docLoadError: '加载文档失败',
    docSaveError: '保存文档失败',
    docTypeOptions: ['general', 'guideline', 'rate-sheet', 'email', 'announcement', 'other'],
  },
};

const PROVIDER_MODELS = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai:    ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini', 'o1-mini', 'gpt-3.5-turbo'],
  gemini:    ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama:    [],
};

// Which env var each provider needs (shown as a hint in the form)
const PROVIDER_API_KEY = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai:    'OPENAI_API_KEY',
  gemini:    'GEMINI_API_KEY',
  ollama:    null,
};

// Whether to show baseUrl field and how
const PROVIDER_BASE_URL = {
  ollama: { required: true,  placeholder: 'http://localhost:11434',  hint: 'Ollama server URL' },
  openai: { required: false, placeholder: 'https://api.openai.com/v1', hint: 'Override for Azure OpenAI, Together.ai, etc.' },
};

const MODEL_PLACEHOLDER = {
  anthropic: 'claude-sonnet-4-6',
  openai:    'gpt-4o',
  gemini:    'gemini-2.0-flash',
  ollama:    'llama3.1, qwen2.5, deepseek-r1...',
};

// ── Existing content editor (Knowledge Base / System Prompt) ──────────────────
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

// ── Agent card (collapsed view) ───────────────────────────────────────────────
function AgentCard({ agent, onEdit, labels }) {
  return (
    <div className="card" style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{agent.name}</span>
            {agent.isDefault && (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(201,169,110,0.2)', color: 'var(--gold)', padding: '0.15rem 0.5rem', borderRadius: '100px', border: '1px solid rgba(201,169,110,0.35)' }}>
                {labels.agentDefault}
              </span>
            )}
            {!agent.enabled && (
              <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'var(--cream-dark)', color: 'var(--text-muted)', padding: '0.15rem 0.5rem', borderRadius: '100px' }}>
                {labels.agentDisabled}
              </span>
            )}
          </div>
          {agent.description && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>{agent.description}</p>
          )}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', background: 'var(--cream-dark)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
              {agent.provider === 'ollama' ? 'Ollama' : 'Anthropic'}
            </span>
            <span style={{ fontSize: '0.72rem', background: 'var(--cream-dark)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
              {agent.model}
            </span>
            {(agent.tasks || []).map(t => (
              <span key={t} style={{ fontSize: '0.68rem', background: 'rgba(10,22,40,0.06)', color: 'var(--navy)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onEdit}>{labels.agentEdit}</button>
      </div>
    </div>
  );
}

// ── Agent create/edit form ────────────────────────────────────────────────────
function AgentForm({ initial, onSave, onDelete, onCancel, labels }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    description: initial?.description || '',
    provider: initial?.provider || 'anthropic',
    model: initial?.model || 'claude-sonnet-4-6',
    baseUrl: initial?.baseUrl || '',
    temperature: initial?.temperature ?? 0.7,
    maxTokens: initial?.maxTokens || 1000,
    systemPrompt: initial?.systemPrompt || '',
    knowledgeBase: initial?.knowledgeBase || '',
    tasks: Array.isArray(initial?.tasks) ? initial.tasks.join(', ') : '',
    enabled: initial?.enabled !== false,
    isDefault: initial?.isDefault || false,
  }));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return e => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm(prev => ({ ...prev, [field]: val }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...(initial || {}),
        ...form,
        tasks: form.tasks.split(',').map(t => t.trim()).filter(Boolean),
        temperature: parseFloat(form.temperature) || 0.7,
        maxTokens: parseInt(form.maxTokens) || 1000,
      });
    } catch (err) {
      setError(err.message || labels.agentSaveError);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(labels.agentDeleteConfirm)) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="form-section" style={{ border: '2px solid rgba(201,169,110,0.4)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="form-section-title" style={{ margin: 0 }}>
          {isNew ? labels.agentsNew : `${labels.agentEdit}: ${initial.name}`}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>{labels.agentCancel}</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name + Description */}
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">{labels.agentName} *</label>
            <input className="form-input" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">{labels.agentDesc}</label>
            <input className="form-input" value={form.description} onChange={set('description')} />
          </div>
        </div>

        {/* Provider + Model */}
        <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">{labels.agentProvider}</label>
            <select className="form-select" value={form.provider} onChange={set('provider')}>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT / o-series)</option>
              <option value="gemini">Google (Gemini)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
            {PROVIDER_API_KEY[form.provider] && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {labels.agentApiKeyEnv} <code style={{ background: 'var(--cream-dark)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{PROVIDER_API_KEY[form.provider]}</code>
              </p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">{labels.agentModel}</label>
            {/* datalist gives dropdown suggestions while still allowing free-form input */}
            <input
              className="form-input"
              list={`ml-${form.provider}`}
              value={form.model}
              onChange={set('model')}
              placeholder={MODEL_PLACEHOLDER[form.provider] || ''}
              autoComplete="off"
            />
            <datalist id={`ml-${form.provider}`}>
              {(PROVIDER_MODELS[form.provider] || []).map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Base URL — required for Ollama, optional override for OpenAI */}
        {PROVIDER_BASE_URL[form.provider] && (
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">
              {labels.agentBaseUrl}
              {!PROVIDER_BASE_URL[form.provider].required && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.3rem' }}>({labels.agentOptional})</span>
              )}
            </label>
            <input
              className="form-input"
              value={form.baseUrl}
              onChange={set('baseUrl')}
              placeholder={PROVIDER_BASE_URL[form.provider].placeholder}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {PROVIDER_BASE_URL[form.provider].hint}
            </p>
          </div>
        )}

        {/* Temperature + Max Tokens */}
        <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">{labels.agentTemp}: <strong>{parseFloat(form.temperature).toFixed(1)}</strong></label>
            <input
              type="range" min="0" max="1" step="0.1"
              value={form.temperature} onChange={set('temperature')}
              style={{ width: '100%', marginTop: '0.375rem' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{labels.agentMaxTokens}</label>
            <input
              className="form-input" type="number"
              min="100" max="8000" step="100"
              value={form.maxTokens} onChange={set('maxTokens')}
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">{labels.agentTasks}</label>
          <input
            className="form-input"
            value={form.tasks}
            onChange={set('tasks')}
            placeholder="Q&A, Rate estimates, Loan programs, Qualification"
          />
        </div>

        {/* System Prompt */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">{labels.agentPrompt}</label>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{labels.agentPromptHint}</p>
          <textarea
            className="form-textarea"
            value={form.systemPrompt}
            onChange={set('systemPrompt')}
            placeholder="Leave empty to use default System Prompt..."
            style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.6', resize: 'vertical' }}
          />
        </div>

        {/* Knowledge Base */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">{labels.agentKnowledge}</label>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{labels.agentKnowledgeHint}</p>
          <textarea
            className="form-textarea"
            value={form.knowledgeBase}
            onChange={set('knowledgeBase')}
            placeholder="Leave empty to use default Knowledge Base..."
            style={{ minHeight: '140px', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.6', resize: 'vertical' }}
          />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.enabled} onChange={set('enabled')} />
            {labels.agentEnabled}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} />
            {labels.agentIsDefault}
          </label>
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.82rem', marginTop: '0.875rem' }}>{error}</p>}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          {!isNew ? (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ color: '#dc2626', borderColor: '#dc2626' }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '...' : labels.agentDelete}
            </button>
          ) : <div />}
          <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
            {saving ? labels.agentSaving : labels.agentSave}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────
function AddDocumentForm({ mode, password, labels, onDone, onCancel }) {
  const [form, setForm] = useState({
    title: '', type: 'general', lender: '', date: new Date().toISOString().slice(0, 10), content: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let res;
      if (mode === 'file') {
        if (!file) { setError('Please select a file'); setSaving(false); return; }
        const fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ ...form, fileBase64, fileName: file.name }),
        });
      } else {
        if (!form.content.trim()) { setError(labels.docFormContent + ' required'); setSaving(false); return; }
        res = await fetch('/api/documents/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || labels.docSaveError);
      }
      const saved = await res.json();
      onDone(saved);
    } catch (err) {
      setError(err.message || labels.docSaveError);
      setSaving(false);
    }
  }

  return (
    <div className="form-section" style={{ border: '2px solid rgba(201,169,110,0.4)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div className="form-section-title" style={{ margin: 0 }}>
          {mode === 'file' ? labels.docAddFile : labels.docAddText}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>{labels.docCancel}</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">{labels.docFormTitle}</label>
            <input className="form-input" value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-group">
            <label className="form-label">{labels.docFormType}</label>
            <select className="form-select" value={form.type} onChange={set('type')}>
              {labels.docTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">{labels.docFormLender}</label>
            <input className="form-input" value={form.lender} onChange={set('lender')} placeholder="e.g. UWM, loanDepot" />
          </div>
          <div className="form-group">
            <label className="form-label">{labels.docFormDate}</label>
            <input className="form-input" type="date" value={form.date} onChange={set('date')} />
          </div>
        </div>

        {mode === 'file' ? (
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">{labels.docFormFile}</label>
            <input
              className="form-input"
              type="file"
              accept=".pdf,.txt,.md"
              onChange={e => setFile(e.target.files[0] || null)}
            />
          </div>
        ) : (
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">{labels.docFormContent}</label>
            <textarea
              className="form-textarea"
              value={form.content}
              onChange={set('content')}
              placeholder="Paste lender email, rate sheet, guideline text..."
              style={{ minHeight: '260px', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.6', resize: 'vertical' }}
              required
            />
          </div>
        )}

        {error && <p style={{ color: 'red', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? labels.docSaving : labels.docSave}
          </button>
        </div>
      </form>
    </div>
  );
}

function DocumentsManager({ password, labels }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [addMode, setAddMode] = useState(null); // null | 'text' | 'file'

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/documents', {
        headers: { 'x-admin-password': password },
      });
      if (!res.ok) throw new Error();
      setDocs(await res.json());
    } catch { setLoadError(labels.docLoadError); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm(labels.docDeleteConfirm)) return;
    await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem 0' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{labels.docDesc}</p>

      {loadError && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{loadError}</p>}

      {addMode ? (
        <AddDocumentForm
          mode={addMode}
          password={password}
          labels={labels}
          onDone={saved => { setDocs(prev => [saved, ...prev]); setAddMode(null); }}
          onCancel={() => setAddMode(null)}
        />
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-gold btn-sm" onClick={() => setAddMode('text')}>{labels.docAddText}</button>
          <button className="btn btn-outline btn-sm" onClick={() => setAddMode('file')}>{labels.docAddFile}</button>
        </div>
      )}

      {docs.length === 0 && !addMode && (
        <div className="state-box"><p>{labels.docNoDocuments}</p></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {docs.map(doc => (
          <div key={doc.id} className="card" style={{ padding: '0.875rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.title}</span>
                  <span style={{ fontSize: '0.68rem', background: 'var(--cream-dark)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {doc.type}
                  </span>
                  {doc.lender && (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(10,22,40,0.07)', color: 'var(--navy)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {doc.lender}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {doc.date} · {doc.chunkCount} {labels.docChunks}
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#dc2626', flexShrink: 0 }}
                onClick={() => handleDelete(doc.id)}
              >
                {labels.docDelete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Agents tab manager ────────────────────────────────────────────────────────
function AgentsManager({ password, labels }) {
  const [agents, setAgents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/agents', {
        headers: { 'x-admin-password': password },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch { setLoadError(labels.agentLoadError); }
    finally { setLoading(false); }
  }

  async function handleSave(formData) {
    const isNew = !formData.id;
    const url = isNew ? '/api/agents' : `/api/agents/${formData.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error(labels.agentSaveError);
    const saved = await res.json();
    setAgents(prev => {
      const updated = isNew ? [...prev, saved] : prev.map(a => a.id === saved.id ? saved : a);
      if (saved.isDefault) return updated.map(a => ({ ...a, isDefault: a.id === saved.id }));
      return updated;
    });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/agents/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    if (!res.ok) throw new Error('Delete failed');
    setAgents(prev => prev.filter(a => a.id !== id));
    setEditingId(null);
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (loadError) return <p style={{ color: 'red', fontSize: '0.85rem' }}>{loadError}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {agents.length} agent{agents.length !== 1 ? 's' : ''} · <span style={{ fontSize: '0.78rem' }}>empty prompt/knowledge falls back to the default tabs</span>
        </p>
        {editingId !== 'new' && (
          <button className="btn btn-gold btn-sm" onClick={() => setEditingId('new')}>
            {labels.agentsNew}
          </button>
        )}
      </div>

      {editingId === 'new' && (
        <AgentForm
          initial={null}
          onSave={handleSave}
          onDelete={() => {}}
          onCancel={() => setEditingId(null)}
          labels={labels}
        />
      )}

      {agents.length === 0 && editingId !== 'new' && (
        <div className="state-box"><p>{labels.agentNoAgents}</p></div>
      )}

      {agents.map(agent =>
        editingId === agent.id ? (
          <AgentForm
            key={agent.id}
            initial={agent}
            onSave={handleSave}
            onDelete={() => handleDelete(agent.id)}
            onCancel={() => setEditingId(null)}
            labels={labels}
          />
        ) : (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={() => setEditingId(agent.id)}
            labels={labels}
          />
        )
      )}
    </div>
  );
}

// ── Admin page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { lang } = useLang();
  const L = LABELS[lang] || LABELS.en;
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('agents');

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

  const tabs = [
    { key: 'agents', label: L.tabAgents },
    { key: 'documents', label: L.tabDocuments },
    { key: 'knowledge', label: L.tabKnowledge },
    { key: 'prompt', label: L.tabPrompt },
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}>{L.title}</h1>
        <button className="btn btn-outline btn-sm" onClick={() => setAuthed(false)}>{L.logout}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        {tabs.map(t => (
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

      {tab === 'agents' && <AgentsManager password={password} labels={L} />}

      {tab === 'documents' && <DocumentsManager password={password} labels={L} />}

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
