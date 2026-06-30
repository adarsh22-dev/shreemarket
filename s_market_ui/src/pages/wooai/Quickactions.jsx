import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Save, X,
  Package, RefreshCw, Tag, Users, ShoppingCart, Search, HelpCircle, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getWooAIQuickActions,
  createWooAIQuickAction,
  updateWooAIQuickAction,
  deleteWooAIQuickAction,
  incrementWooAIQuickActionClick,
} from '@/api/api';
import './Quickactions.css';

const ICON_OPTIONS   = ['ShoppingCart','RefreshCw','Tag','Users','Package','Search','HelpCircle'];
const ICON_MAP       = { ShoppingCart, RefreshCw, Tag, Users, Package, Search, HelpCircle };
const ACTION_TYPES   = ['Trigger AI flow','Open product tab','Send message','Escalate to agent','Open link'];

const BLANK = { label:'', icon:'ShoppingCart', type:'Trigger AI flow', desc:'', active:true };

const TYPE_BADGE_COLOR = {
  'Trigger AI flow':   'purple',
  'Open product tab':  'blue',
  'Escalate to agent': 'red',
  'Send message':      'green',
  'Open link':         'amber',
};

const TypeBadge = ({ t }) => (
  <span className={`qa-badge ${TYPE_BADGE_COLOR[t]||'gray'}`}>{t}</span>
);

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(()=>{ const tm=setTimeout(onDone,2400); return ()=>clearTimeout(tm); },[]);
  const cfg = {
    success:['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:  ['#fee2e2','#dc2626','#fecaca','✕'],
    info:   ['#fff7ed','#e03e1a','#fcd9d2','ℹ'],
  };
  const [bg,fg,bd,ico]=cfg[type]||cfg.success;
  return (
    <div className="qa-toast" style={{background:bg,color:fg,border:`1px solid ${bd}`}}>
      {ico} {msg}
    </div>
  );
};

/* ── Delete confirm modal ── */
const DeleteModal = ({ action, onConfirm, onCancel }) => (
  <div className="qa-overlay" onClick={onCancel}>
    <div className="qa-modal" onClick={e=>e.stopPropagation()}>
      <div className="qa-modal__hdr">
        <span className="qa-modal__title">Delete Quick Action</span>
        <button className="qa-btn-ghost edit" onClick={onCancel}><X size={15}/></button>
      </div>
      <div className="qa-modal__body">
        <div className="qa-modal__warn">
          Delete <strong>"{action.label}"</strong>? It will be removed from the chat widget immediately. This cannot be undone.
        </div>
      </div>
      <div className="qa-modal__ftr">
        <button className="qa-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="qa-btn-danger" onClick={onConfirm}><Trash2 size={13}/>Delete</button>
      </div>
    </div>
  </div>
);

const FormFields = ({ form, setForm, onSave, onCancel, saveLabel='Save' }) => (
  <>
    <div className="qa-form-grid">
      <div>
        <label className="qa-label">Button Label</label>
        <input className="qa-input" placeholder="e.g. Find Artisan Rugs" autoFocus
          value={form.label} onChange={e=>setForm({...form,label:e.target.value})}
          onKeyDown={e=>e.key==='Enter'&&onSave()}/>
      </div>
      <div>
        <label className="qa-label">Description</label>
        <input className="qa-input" placeholder="Short description"
          value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}/>
      </div>
      <div>
        <label className="qa-label">Icon</label>
        <select className="qa-select" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})}>
          {ICON_OPTIONS.map(ic=><option key={ic}>{ic}</option>)}
        </select>
      </div>
      <div>
        <label className="qa-label">Action Type</label>
        <select className="qa-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
          {ACTION_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
    </div>
    {/* Live mini preview */}
    {form.label.trim() && (
      <div className="qa-form-preview">
        <span style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em'}}>Preview</span>
        <div className="qa-chip" style={{pointerEvents:'none'}}>
          {React.createElement(ICON_MAP[form.icon]||Package,{size:13,color:'#6d28d9'})} {form.label}
        </div>
        <TypeBadge t={form.type}/>
      </div>
    )}
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button className="qa-btn-primary" onClick={onSave} disabled={!form.label.trim()}>
        <Save size={14}/> {saveLabel}
      </button>
      <button className="qa-btn-outline" onClick={onCancel}>Cancel</button>
    </div>
  </>
);

export default function QuickActions() {
  const [actions,       setActions]      = useState([]);
  const [showForm,      setShowForm]     = useState(false);
  const [editId,        setEditId]       = useState(null);
  const [form,          setForm]         = useState(BLANK);
  const [search,        setSearch]       = useState('');
  const [deleteTarget,  setDeleteTarget] = useState(null);
  const [toast,         setToast]        = useState(null);

  const showToast = (msg, type='success') => setToast({ msg, type });

  useEffect(() => {
    getWooAIQuickActions()
      .then(data => setActions(data))
      .catch(() => showToast('Failed to load quick actions', 'error'));
  }, []);

  /* ── Edit ── */
  const startEdit = a => { setEditId(a.id); setForm({...a}); setShowForm(false); };
  const cancelEdit = () => { setEditId(null); setForm(BLANK); };
  const saveEdit = async () => {
    if (!form.label.trim()) return;
    try {
      await updateWooAIQuickAction(editId, form);
      setActions(aa=>aa.map(a=>a.id===editId?{...a,...form}:a));
      showToast(`"${form.label}" updated`);
      cancelEdit();
    } catch {
      showToast('Failed to update action', 'error');
    }
  };

  /* ── Add new ── */
  const addNew = async () => {
    if (!form.label.trim()) return;
    try {
      const created = await createWooAIQuickAction(form);
      setActions(aa=>[...aa,{...created,clicks:0}]);
      showToast(`"${form.label}" action added`);
      setForm(BLANK); setShowForm(false);
    } catch {
      showToast('Failed to create action', 'error');
    }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    try {
      await deleteWooAIQuickAction(deleteTarget.id);
      showToast(`"${deleteTarget.label}" deleted`,'error');
      setActions(aa=>aa.filter(a=>a.id!==deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete action', 'error');
    }
  };

  /* ── Toggle ── */
  const toggle = a => {
    setActions(aa=>aa.map(x=>x.id===a.id?{...x,active:!x.active}:x));
    showToast(`"${a.label}" ${a.active?'disabled':'enabled'}`, a.active?'error':'success');
  };

  /* ── Simulate click ── */
  const simulateClick = id => {
    setActions(aa=>aa.map(a=>a.id===id?{...a,clicks:a.clicks+1}:a));
    incrementWooAIQuickActionClick(id).catch(() => {});
    showToast('Click simulated — counter updated','info');
  };

  const filtered = actions.filter(a=>a.label.toLowerCase().includes(search.toLowerCase()));
  const total    = actions.reduce((s,a)=>s+a.clicks,0);

  return (
    <div className="qa-page">
      {toast        && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
      {deleteTarget && <DeleteModal action={deleteTarget} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)}/>}

      {/* ── Header ── */}
      <div className="qa-header">
        <Link to="/admin/wooai/dashboard" className="wooai-back-link"><ArrowLeft size={14}/> Back to Dashboard</Link>
        <div className="qa-header-row">
          <div>
            <h1>Quick Actions</h1>
            <p>Manage shortcut chips shown in the WooAI chat widget</p>
          </div>
          <button className="qa-btn-primary" onClick={()=>{ setShowForm(s=>!s); setEditId(null); setForm(BLANK); }}>
            <Plus size={15}/> Add Action
          </button>
        </div>
      </div>

      <div className="qa-body">

        {/* ── Stats ── */}
        <div className="qa-stats">
          <div className="qa-stat">
            <div className="qa-stat-val">{actions.length}</div>
            <div className="qa-stat-label">Total Actions</div>
          </div>
          <div className="qa-stat green">
            <div className="qa-stat-val">{actions.filter(a=>a.active).length}</div>
            <div className="qa-stat-label">Active</div>
          </div>
          <div className="qa-stat blue">
            <div className="qa-stat-val">{total.toLocaleString()}</div>
            <div className="qa-stat-label">Total Clicks</div>
          </div>
        </div>

        {/* ── New action form ── */}
        {showForm && (
          <div className="qa-card highlight">
            <div className="qa-card-header">
              <span className="qa-card-title">New Quick Action</span>
              <button className="qa-btn-ghost edit" onClick={()=>setShowForm(false)}><X size={15}/></button>
            </div>
            <FormFields form={form} setForm={setForm} onSave={addNew} onCancel={()=>setShowForm(false)} saveLabel="Add Action"/>
          </div>
        )}

        {/* ── Live preview ── */}
        <div className="qa-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div className="qa-card-title" style={{margin:0}}>Live Preview — Chat Widget</div>
            <span style={{fontSize:11,color:'#9ca3af'}}>{actions.filter(a=>a.active).length} active</span>
          </div>
          <div className="qa-chips-wrap">
            {actions.filter(a=>a.active).map(a=>{
              const Icon = ICON_MAP[a.icon]||Package;
              return (
                <button key={a.id} className="qa-chip qa-chip--clickable"
                  title="Click to simulate"
                  onClick={()=>simulateClick(a.id)}>
                  <Icon size={13} color="#6d28d9"/> {a.label}
                </button>
              );
            })}
            {actions.filter(a=>a.active).length===0 && (
              <span style={{fontSize:12,color:'#9ca3af'}}>No active quick actions.</span>
            )}
          </div>
          <div style={{fontSize:11,color:'#9ca3af',marginTop:8}}>Click any chip to simulate a user click and increment the counter.</div>
        </div>

        {/* ── Search ── */}
        <div className="qa-search-row">
          <div className="qa-search-wrap">
            <Search size={14}/>
            <input placeholder="Search actions…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="qa-card qa-table-card" style={{padding:0,overflow:'hidden'}}>
          <div className="qa-card-title-row" style={{padding:'16px 16px 0'}}>
            <span className="qa-card-title">All Actions</span>
          </div>

          {/* Desktop table */}
          <div className="qa-table-wrap">
            <table className="qa-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Label</th>
                  <th>Action Type</th>
                  <th>Description</th>
                  <th>Clicks</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 && (
                  <tr><td colSpan={7} style={{textAlign:'center',padding:24,color:'#9ca3af',fontSize:12}}>No actions match your search.</td></tr>
                )}
                {filtered.map(a=>{
                  const Icon = ICON_MAP[a.icon]||Package;
                  const isEditing = editId===a.id;
                  return (
                    <React.Fragment key={a.id}>
                      <tr style={{opacity:a.active?1:.5}}>
                        <td><div className="qa-icon-pill"><Icon size={14} color="#6d28d9"/></div></td>
                        <td style={{fontWeight:500}}>{a.label}</td>
                        <td><TypeBadge t={a.type}/></td>
                        <td style={{color:'#6b7280',fontSize:12}}>{a.desc}</td>
                        <td>
                          <button className="qa-clicks-btn" title="Simulate click"
                            onClick={()=>simulateClick(a.id)}>
                            {a.clicks.toLocaleString()}
                          </button>
                        </td>
                        <td>
                          <button className={`qa-toggle ${a.active?'on':''}`}
                            title={a.active?'Disable':'Enable'}
                            onClick={()=>toggle(a)}/>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="qa-btn-ghost edit" title="Edit" onClick={()=>isEditing?cancelEdit():startEdit(a)}>
                              {isEditing?<X size={13}/>:<Edit2 size={13}/>}
                            </button>
                            <button className="qa-btn-ghost del" title="Delete" onClick={()=>setDeleteTarget(a)}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr className="edit-row">
                          <td colSpan={7}>
                            <FormFields form={form} setForm={setForm} onSave={saveEdit} onCancel={cancelEdit} saveLabel="Save Changes"/>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="qa-mobile-list">
            {filtered.map(a=>{
              const Icon = ICON_MAP[a.icon]||Package;
              const isEditing = editId===a.id;
              return (
                <div key={a.id} className="qa-mobile-item" style={{opacity:a.active?1:.5}}>
                  <div className="qa-mobile-top">
                    <div className="qa-icon-pill"><Icon size={14} color="#6d28d9"/></div>
                    <div className="qa-mobile-info">
                      <div className="qa-mobile-label">{a.label}</div>
                      <div className="qa-mobile-desc">{a.desc}</div>
                    </div>
                    <button className={`qa-toggle ${a.active?'on':''}`} onClick={()=>toggle(a)}/>
                  </div>
                  <div className="qa-mobile-bottom">
                    <TypeBadge t={a.type}/>
                    <button className="qa-clicks-btn" onClick={()=>simulateClick(a.id)}>
                      <strong>{a.clicks.toLocaleString()}</strong> clicks
                    </button>
                    <div className="qa-mobile-actions">
                      <button className="qa-btn-ghost edit" onClick={()=>isEditing?cancelEdit():startEdit(a)}>
                        {isEditing?<X size={13}/>:<Edit2 size={13}/>}
                      </button>
                      <button className="qa-btn-ghost del" onClick={()=>setDeleteTarget(a)}><Trash2 size={13}/></button>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="qa-mobile-edit-form">
                      <FormFields form={form} setForm={setForm} onSave={saveEdit} onCancel={cancelEdit} saveLabel="Save Changes"/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
