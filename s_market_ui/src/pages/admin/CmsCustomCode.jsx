import React, { useState, useEffect } from 'react';
import './CmsCustomCode.css';
import {
  Code2, Plus, Trash2, Eye, EyeOff, Save, Copy, Check,
  ChevronDown, ChevronUp, AlertTriangle, Info, X,
  Globe, FileCode, Layout, Layers, ToggleLeft, ToggleRight,
  Download, Upload, RefreshCw
} from 'lucide-react';
import { getCustomSnippets, createCustomSnippet, updateCustomSnippet, deleteCustomSnippet } from '../../api/api';

const LOCATIONS = [
  { key: 'head',          label: 'Head',           icon: FileCode,  desc: 'Injected inside <head> — ideal for meta tags, CSS links, fonts',       color: '#7c3aed', bg: '#ede9fe' },
  { key: 'body_start',    label: 'Body Start',     icon: Layout,    desc: 'After <body> opens — for chat widgets, init scripts',                   color: '#2563eb', bg: '#dbeafe' },
  { key: 'body_end',      label: 'Body End',       icon: Layers,    desc: 'Before </body> closes — for analytics, tracking pixels',                color: '#16a34a', bg: '#dcfce7' },
  { key: 'dynamic',       label: 'Dynamic Section',icon: Globe,     desc: 'Injected into named front-end section slots (e.g. homepage hero)',     color: '#E03E1A', bg: '#fee2e2' },
];

const DYNAMIC_SLOTS = [
  'homepage_hero', 'homepage_below_banner', 'category_top',
  'product_detail_bottom', 'cart_sidebar', 'checkout_above_total',
  'thank_you_page', 'footer_top',
];

const locationMeta = key => LOCATIONS.find(l => l.key === key) || LOCATIONS[0];

function SnippetModal({ snippet, onSave, onClose }) {
  const isNew = !snippet.id;
  const [form, setForm] = useState({
    label:    snippet.label    || '',
    location: snippet.location || 'head',
    slot:     snippet.slot     || '',
    code:     snippet.code     || '',
    notes:    snippet.notes    || '',
    active:   snippet.active   !== undefined ? snippet.active : true,
  });
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCopy = () => {
    navigator.clipboard?.writeText(form.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loc = locationMeta(form.location);
  const LocIcon = loc.icon;

  return (
    <div className="cc-overlay" onClick={onClose}>
      <div className="cc-modal" onClick={e => e.stopPropagation()}>
        <div className="cc-modal__hdr">
          <div className="cc-modal__hdr-left">
            <div className="cc-modal__icon" style={{ background: loc.bg }}>
              <LocIcon size={16} color={loc.color} />
            </div>
            <div>
              <p className="cc-modal__title">{isNew ? 'Add Custom Code Snippet' : 'Edit Snippet'}</p>
              <p className="cc-modal__sub">{isNew ? 'Inject code into any page zone' : form.label}</p>
            </div>
          </div>
          <button className="cc-ib" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="cc-modal__body">
          <div className="cc-field">
            <label className="cc-label">Snippet Label <span className="cc-req">*</span></label>
            <input className="cc-input" value={form.label}
              onChange={e => set('label', e.target.value)}
              placeholder="e.g. Google Analytics 4" />
          </div>

          <div className="cc-field">
            <label className="cc-label">Inject Location <span className="cc-req">*</span></label>
            <div className="cc-loc-grid">
              {LOCATIONS.map(l => {
                const LIcon = l.icon;
                return (
                  <button key={l.key}
                    className={`cc-loc-card ${form.location === l.key ? 'cc-loc-card--active' : ''}`}
                    style={{ '--lc': l.color, '--lb': l.bg }}
                    onClick={() => set('location', l.key)}>
                    <div className="cc-loc-card__icon">
                      <LIcon size={14} color={form.location === l.key ? '#fff' : l.color} />
                    </div>
                    <span className="cc-loc-card__label">{l.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="cc-hint">{loc.desc}</p>
          </div>

          {form.location === 'dynamic' && (
            <div className="cc-field">
              <label className="cc-label">Frontend Section Slot <span className="cc-req">*</span></label>
              <select className="cc-select" value={form.slot} onChange={e => set('slot', e.target.value)}>
                <option value="">— Select a slot —</option>
                {DYNAMIC_SLOTS.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <p className="cc-hint">The front-end template must include a matching <code>{'{{slot_name}}'}</code> placeholder.</p>
            </div>
          )}

          <div className="cc-field">
            <div className="cc-code-hdr">
              <label className="cc-label" style={{ margin: 0 }}>Code <span className="cc-req">*</span></label>
              <button className="cc-copy-btn" onClick={handleCopy}>
                {copied ? <><Check size={11} color="#16a34a" />Copied</> : <><Copy size={11} />Copy</>}
              </button>
            </div>
            <div className="cc-code-wrap">
              <textarea className="cc-code-editor" value={form.code}
                onChange={e => set('code', e.target.value)}
                placeholder="Paste your HTML, <script>, or <style> code here…"
                spellCheck={false} />
            </div>
          </div>

          <div className="cc-field">
            <label className="cc-label">Internal Notes</label>
            <input className="cc-input" value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Remove after campaign ends, replace placeholder IDs…" />
          </div>

          <div className="cc-field cc-field--inline">
            <div>
              <div className="cc-label" style={{ margin: 0 }}>Active</div>
              <div className="cc-hint" style={{ margin: 0 }}>Inactive snippets are saved but not injected</div>
            </div>
            <button className={`cc-toggle ${form.active ? 'cc-toggle--on' : 'cc-toggle--off'}`}
              onClick={() => set('active', !form.active)} type="button">
              <span className="cc-toggle__knob" />
            </button>
          </div>

          <div className="cc-alert cc-alert--warn">
            <AlertTriangle size={13} color="#d97706" />
            <span>Custom code runs on all customer-facing pages. Verify scripts before activating to avoid site breakage.</span>
          </div>
        </div>

        <div className="cc-modal__footer">
          <button className="cc-btn cc-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="cc-btn cc-btn--primary"
            disabled={!form.label.trim() || !form.code.trim() || (form.location === 'dynamic' && !form.slot)}
            onClick={() => onSave(form)}>
            <Save size={13} color="#fff" />
            {isNew ? 'Add Snippet' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SnippetCard({ s, onEdit, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const loc = locationMeta(s.location);
  const LocIcon = loc.icon;

  return (
    <div className={`cc-card ${!s.active ? 'cc-card--inactive' : ''}`}>
      <div className="cc-card__row">
        <div className="cc-card__left">
          <div className="cc-card__loc-icon" style={{ background: loc.bg }}>
            <LocIcon size={14} color={loc.color} />
          </div>
          <div className="cc-card__info">
            <div className="cc-card__label">
              {s.label}
              {!s.active && <span className="cc-chip cc-chip--grey">Inactive</span>}
              {s.active  && <span className="cc-chip cc-chip--green">Active</span>}
            </div>
            <div className="cc-card__meta">
              <span className="cc-loc-badge" style={{ background: loc.bg, color: loc.color }}>
                {loc.label}{s.location === 'dynamic' && s.slot ? ` › ${s.slot.replace(/_/g,' ')}` : ''}
              </span>
              {s.notes && <span className="cc-card__notes">{s.notes}</span>}
            </div>
          </div>
        </div>

        <div className="cc-card__actions">
          <button className="cc-ib cc-ib--sm" title={s.active ? 'Deactivate' : 'Activate'}
            onClick={() => onToggle(s.id)}>
            {s.active
              ? <ToggleRight size={16} color="#16a34a" />
              : <ToggleLeft size={16} color="#94a3b8" />}
          </button>
          <button className="cc-ib cc-ib--sm" title="Edit" onClick={() => onEdit(s)}>
            <Code2 size={13} />
          </button>
          <button className="cc-ib cc-ib--sm cc-ib--del" title="Delete" onClick={() => onDelete(s.id)}>
            <Trash2 size={13} />
          </button>
          <button className="cc-ib cc-ib--sm" title={expanded ? 'Collapse' : 'Preview code'}
            onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="cc-card__code-wrap">
          <div className="cc-card__code-bar">
            <span className="cc-card__code-tag">{s.location === 'dynamic' ? `slot: ${s.slot}` : `<${s.location === 'head' ? 'head' : s.location === 'body_start' ? 'body>…start' : 'body>…end'}`}</span>
            <span className="cc-card__timestamps">Updated {s.updatedAt}</span>
          </div>
          <pre className="cc-card__code">{s.code}</pre>
        </div>
      )}
    </div>
  );
}

export default function CmsCustomCode() {
  const [snippets,   setSnippets]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [modal,      setModal]      = useState(null);
  const [activeTab,  setActiveTab]  = useState('all');
  const [search,     setSearch]     = useState('');
  const [saved,      setSaved]      = useState(false);
  const [deleteConf, setDeleteConf] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const fetchSnippets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomSnippets();
      if (data) setSnippets(data);
    } catch (err) {
      setError(err.message || 'Failed to load snippets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSnippets(); }, []);

  const filtered = snippets.filter(s =>
    (activeTab === 'all' || s.location === activeTab) &&
    (!search || s.label.toLowerCase().includes(search.toLowerCase()) ||
     (s.notes && s.notes.toLowerCase().includes(search.toLowerCase())))
  );

  const total    = snippets.length;
  const active   = snippets.filter(s => s.active).length;
  const inactive = total - active;
  const dynamic  = snippets.filter(s => s.location === 'dynamic').length;

  const openNew  = () => setModal({});
  const openEdit = s => setModal({ ...s });

  const handleSave = async form => {
    try {
      const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const payload = {
        ...form,
        updatedAt: now,
      };
      if (modal.id) {
        const updated = await updateCustomSnippet(modal.id, payload);
        setSnippets(ss => ss.map(s => s.id === modal.id ? { ...s, ...updated } : s));
      } else {
        payload.createdAt = now;
        const created = await createCustomSnippet(payload);
        setSnippets(ss => [...ss, created]);
      }
      setModal(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to save snippet');
    }
  };

  const handleToggle = async id => {
    const s = snippets.find(s => s.id === id);
    if (!s) return;
    try {
      const updated = await updateCustomSnippet(id, {
        ...s,
        active: !s.active,
        updatedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
      setSnippets(ss => ss.map(s => s.id === id ? { ...s, ...updated } : s));
    } catch (err) {
      setError(err.message || 'Failed to toggle snippet');
    }
  };

  const handleDelete = async id => {
    setDeleting(true);
    try {
      await deleteCustomSnippet(id);
      setSnippets(ss => ss.filter(s => s.id !== id));
      setDeleteConf(null);
    } catch (err) {
      setError(err.message || 'Failed to delete snippet');
    } finally {
      setDeleting(false);
    }
  };

  const TABS = [
    { key: 'all',        label: 'All',          count: snippets.length },
    { key: 'head',       label: 'Head',         count: snippets.filter(s => s.location === 'head').length },
    { key: 'body_start', label: 'Body Start',   count: snippets.filter(s => s.location === 'body_start').length },
    { key: 'body_end',   label: 'Body End',     count: snippets.filter(s => s.location === 'body_end').length },
    { key: 'dynamic',    label: 'Dynamic',      count: snippets.filter(s => s.location === 'dynamic').length },
  ];

  return (
    <div className="cc-wrap">

      {/* ── Header ── */}
      <div className="cc-hdr">
        <div>
          <h2 className="cc-hdr__title">Custom Code</h2>
          <p className="cc-hdr__sub">Inject scripts, styles and HTML into any page zone of the storefront</p>
        </div>
        <div className="cc-hdr__acts">
          {saved && (
            <span className="cc-saved-flash"><Check size={13} color="#16a34a" />Changes saved</span>
          )}
          <button className="cc-btn cc-btn--outline" onClick={fetchSnippets} disabled={loading}>
            <RefreshCw size={13} color="#475569" />Refresh
          </button>
          <button className="cc-btn cc-btn--primary" onClick={openNew}>
            <Plus size={13} color="#fff" />Add Snippet
          </button>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="cc-info-banner">
        <Info size={14} color="#2563eb" />
        <span>Custom code snippets are injected into all storefront pages at the specified location. Use <strong>Dynamic Sections</strong> to target specific page zones via slot names defined in your theme templates.</span>
      </div>

      {/* ── Error alert ── */}
      {error && (
        <div className="cc-alert cc-alert--warn" style={{ marginBottom: 16 }}>
          <AlertTriangle size={13} color="#dc2626" />
          <span>{error}</span>
          <button className="cc-ib" style={{ marginLeft: 'auto' }} onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="cc-kpi-grid">
        {[
          { label: 'Total Snippets',  value: total,    c: '#475569', bg: '#f1f5f9' },
          { label: 'Active',          value: active,   c: '#16a34a', bg: '#dcfce7' },
          { label: 'Inactive',        value: inactive, c: '#94a3b8', bg: '#f8fafc' },
          { label: 'Dynamic Slots',   value: dynamic,  c: '#E03E1A', bg: '#fee2e2' },
        ].map((k, i) => (
          <div key={i} className="cc-kpi">
            <div className="cc-kpi__value" style={{ color: k.c }}>{loading ? '…' : k.value}</div>
            <div className="cc-kpi__label">{k.label}</div>
            <div className="cc-kpi__bar" style={{ background: k.bg }} />
          </div>
        ))}
      </div>

      {/* ── Location visual guide ── */}
      <div className="cc-zone-guide">
        <p className="cc-zone-guide__title">Injection Zones</p>
        <div className="cc-zone-diagram">
          <div className="cc-zone cc-zone--head">
            <FileCode size={12} color="#7c3aed" />
            <span>&lt;head&gt;</span>
          </div>
          <div className="cc-zone cc-zone--body-start">
            <Layout size={12} color="#2563eb" />
            <span>body start</span>
          </div>
          <div className="cc-zone cc-zone--dynamic">
            <Globe size={12} color="#E03E1A" />
            <span>dynamic slots</span>
          </div>
          <div className="cc-zone cc-zone--body-end">
            <Layers size={12} color="#16a34a" />
            <span>body end</span>
          </div>
        </div>
        <div className="cc-zone-slots">
          <span className="cc-zone-slots__lbl">Available dynamic slots:</span>
          {DYNAMIC_SLOTS.map(s => (
            <code key={s} className="cc-slot-tag">{s}</code>
          ))}
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="cc-table-card">
        <div className="cc-toolbar">
          <div className="cc-tabs">
            {TABS.map(t => (
              <button key={t.key}
                className={`cc-tab ${activeTab === t.key ? 'cc-tab--active' : ''}`}
                onClick={() => setActiveTab(t.key)}>
                {t.label}
                {t.count > 0 && <span className="cc-tab__count">{t.count}</span>}
              </button>
            ))}
          </div>
          <div className="cc-search">
            <Code2 size={13} color="#94a3b8" className="cc-search__icon" />
            <input className="cc-search__input" placeholder="Search snippets…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="cc-snippet-list">
          {loading ? (
            <div className="cc-empty">
              <div className="cc-loader" />
              <p className="cc-empty__title">Loading snippets…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="cc-empty">
              <Code2 size={28} color="#cbd5e1" />
              <p className="cc-empty__title">No snippets found</p>
              <p className="cc-empty__sub">
                {activeTab === 'all' ? 'Add your first custom code snippet to get started.' : `No snippets in the "${TABS.find(t=>t.key===activeTab)?.label}" location.`}
              </p>
              <button className="cc-btn cc-btn--outline" onClick={openNew}>
                <Plus size={13} color="#475569" />Add Snippet
              </button>
            </div>
          ) : (
            <div className="cc-tw">
              <table className="cc-tbl">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th className="cc-th-r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const loc = locationMeta(s.location);
                    const LocIcon = loc.icon;
                    return (
                      <tr key={s.id}>
                        <td style={{fontWeight:600}}>{s.label}</td>
                        <td style={{fontSize:'.78rem', color:'#64748b'}}>{s.notes || '\u2014'}</td>
                        <td>
                          <span className="cc-loc-badge" style={{background: loc.bg, color: loc.color, display:'inline-flex', alignItems:'center', gap:4}}>
                            <LocIcon size={11} />{loc.label}
                          </span>
                        </td>
                        <td>
                          {s.active ? (
                            <span className="cc-chip cc-chip--green">Active</span>
                          ) : (
                            <span className="cc-chip cc-chip--grey">Inactive</span>
                          )}
                        </td>
                        <td>
                          <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                            <button className="cc-ib cc-ib--sm" title="Toggle" onClick={() => handleToggle(s.id)}>
                              {s.active ? <ToggleRight size={16} color="#16a34a" /> : <ToggleLeft size={16} color="#94a3b8" />}
                            </button>
                            <button className="cc-ib cc-ib--sm" title="Edit" onClick={() => openEdit(s)}>
                              <Code2 size={13} />
                            </button>
                            <button className="cc-ib cc-ib--sm cc-ib--del" title="Delete" onClick={() => setDeleteConf(s.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Snippet modal ── */}
      {modal && (
        <SnippetModal snippet={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      {/* ── Delete confirmation ── */}
      {deleteConf && (
        <div className="cc-overlay" onClick={() => setDeleteConf(null)}>
          <div className="cc-confirm" onClick={e => e.stopPropagation()}>
            <div className="cc-confirm__icon">
              <Trash2 size={20} color="#dc2626" />
            </div>
            <p className="cc-confirm__title">Delete Snippet?</p>
            <p className="cc-confirm__sub">This will permanently remove the snippet and stop injecting it on the storefront.</p>
            <div className="cc-confirm__acts">
              <button className="cc-btn cc-btn--ghost" onClick={() => setDeleteConf(null)} disabled={deleting}>Cancel</button>
              <button className="cc-btn cc-btn--danger" onClick={() => handleDelete(deleteConf)} disabled={deleting}>
                {deleting ? 'Deleting…' : <><Trash2 size={13} color="#fff" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
