import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Shield, Truck, RefreshCw, Bot, Search, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWooAIPolicies, createWooAIPolicy, updateWooAIPolicy, deleteWooAIPolicy } from '@/api/api';
import './Policies.css';

const ICON_MAP = { Returns:'RefreshCw', Shipping:'Truck', Privacy:'Shield', Escalation:'Bot', Custom:'FileText' };
const ICON_COMPONENTS = { RefreshCw, Truck, Shield, Bot, FileText };

const BLANK      = { name:'', category:'Custom', active:true, content:'' };
const CATEGORIES = ['All categories','Returns','Shipping','Privacy','Escalation','Custom'];

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(()=>{ const t=setTimeout(onDone,2400); return ()=>clearTimeout(t); },[]);
  const cfg = {
    success:['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:  ['#fee2e2','#dc2626','#fecaca','✕'],
    info:   ['#ede9fe','#6d28d9','#c4b5fd','ℹ'],
  };
  const [bg,fg,bd,ico] = cfg[type]||cfg.success;
  return (
    <div className="po-toast" style={{background:bg,color:fg,border:`1px solid ${bd}`}}>
      {ico} {msg}
    </div>
  );
};

/* ── Delete confirm modal ── */
const DeleteModal = ({ policy, onConfirm, onCancel }) => (
  <div className="po-overlay" onClick={onCancel}>
    <div className="po-modal" onClick={e=>e.stopPropagation()}>
      <div className="po-modal__hdr">
        <span className="po-modal__title">Delete Policy</span>
        <button className="po-btn-ghost edit" onClick={onCancel}><X size={15}/></button>
      </div>
      <div className="po-modal__body">
        <div className="po-modal__warn">
          Delete <strong>"{policy.name}"</strong>? This policy will no longer be used by WooAI. This cannot be undone.
        </div>
      </div>
      <div className="po-modal__ftr">
        <button className="po-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="po-btn-danger" onClick={onConfirm}><Trash2 size={13}/>Delete</button>
      </div>
    </div>
  </div>
);

/* ── Form fields ── */
const FormFields = ({ form, setForm, onSave, onCancel, saveLabel='Save Policy' }) => (
  <>
    <div className="po-grid-2">
      <div>
        <label className="po-label">Policy Name</label>
        <input className="po-input" placeholder="e.g. Damage Policy" autoFocus
          value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
          onKeyDown={e=>e.key==='Enter'&&onSave()}/>
      </div>
      <div>
        <label className="po-label">Category</label>
        <select className="po-select-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
          <option>Returns</option><option>Shipping</option>
          <option>Privacy</option><option>Escalation</option><option>Custom</option>
        </select>
      </div>
    </div>
    <div style={{marginBottom:14}}>
      <label className="po-label">Policy Content</label>
      <textarea className="po-textarea" placeholder="Write the policy text that WooAI will use…"
        value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
    </div>
    <div className="po-form-actions">
      <button className="po-btn-primary" onClick={onSave} disabled={!form.name.trim()||!form.content.trim()}>
        <Save size={14}/> {saveLabel}
      </button>
      <button className="po-btn-outline" onClick={onCancel}>Cancel</button>
    </div>
  </>
);

export default function Policies() {
  const [policies,   setPolicies]  = useState([]);
  const [editId,     setEditId]    = useState(null);
  const [showNew,    setShowNew]   = useState(false);
  const [form,       setForm]      = useState(BLANK);
  const [search,     setSearch]    = useState('');
  const [catFilter,  setCatFilter] = useState('All categories');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,      setToast]     = useState(null);

  const showToast = (msg, type='success') => setToast({ msg, type });

  useEffect(() => {
    getWooAIPolicies()
      .then(res => setPolicies(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  /* ── Edit ── */
  const startEdit = p => { setEditId(p.id); setForm({...p}); setShowNew(false); };
  const cancelEdit = () => { setEditId(null); setForm(BLANK); };
  const saveEdit = () => {
    if (!form.name.trim()||!form.content.trim()) return;
    updateWooAIPolicy(editId, form).catch(() => {});
    setPolicies(pp=>pp.map(p=>p.id===editId?{...p,...form,updatedAt:'Just now'}:p));
    showToast(`"${form.name}" updated`);
    cancelEdit();
  };

  /* ── Add new ── */
  const addNew = () => {
    if (!form.name.trim()||!form.content.trim()) return;
    createWooAIPolicy(form).then(() => {
      getWooAIPolicies()
        .then(res => setPolicies(Array.isArray(res) ? res : []))
        .catch(() => {});
    }).catch(() => {});
    showToast(`"${form.name}" policy added`);
    setForm(BLANK); setShowNew(false);
  };

  /* ── Delete ── */
  const confirmDelete = () => {
    deleteWooAIPolicy(deleteTarget.id).catch(() => {});
    showToast(`"${deleteTarget.name}" deleted`,'error');
    setPolicies(pp=>pp.filter(p=>p.id!==deleteTarget.id));
    setDeleteTarget(null);
  };

  /* ── Toggle active ── */
  const toggleActive = p => {
    setPolicies(pp=>pp.map(x=>x.id===p.id?{...x,active:!x.active}:x));
    showToast(`"${p.name}" ${p.active?'disabled':'enabled'}`, p.active?'error':'success');
  };

  /* ── Filter ── */
  const filtered = policies.filter(p=>{
    const mSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                    p.content.toLowerCase().includes(search.toLowerCase());
    const mCat    = catFilter==='All categories' || p.category===catFilter;
    return mSearch && mCat;
  });

  return (
    <div className="po-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
      {deleteTarget && <DeleteModal policy={deleteTarget} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)}/>}

      <div className="po-header">
        <Link to="/admin/wooai/dashboard" className="wooai-back-link"><ArrowLeft size={14}/> Back to Dashboard</Link>
        <div className="po-header-row">
          <div>
            <h1>Policies</h1>
            <p>Manage response policies used by the WooAI bot</p>
          </div>
          <button className="po-btn-primary" onClick={()=>{ setShowNew(true); setEditId(null); setForm(BLANK); }}>
            <Plus size={15}/> Add Policy
          </button>
        </div>
      </div>

      <div className="po-body">

        {/* ── Search + category filter ── */}
        <div className="po-search-row">
          <div className="po-search-wrap">
            <Search size={14}/>
            <input placeholder="Search policies…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="po-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        {/* ── Stats row ── */}
        <div className="po-stats-row">
          {[
            { label:'Total',    val:policies.length,                       color:'#6d28d9', bg:'#ede9fe' },
            { label:'Active',   val:policies.filter(p=>p.active).length,   color:'#16a34a', bg:'#dcfce7' },
            { label:'Inactive', val:policies.filter(p=>!p.active).length,  color:'#d97706', bg:'#fef3c7' },
            { label:'Showing',  val:filtered.length,                        color:'#2563eb', bg:'#dbeafe' },
          ].map((s,i)=>(
            <div key={i} className="po-stat-pill" style={{background:s.bg}}>
              <span style={{fontWeight:700,color:s.color,fontSize:15}}>{s.val}</span>
              <span style={{fontSize:11,color:s.color,opacity:.8}}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── New policy form ── */}
        {showNew && (
          <div className="po-card highlight">
            <div className="po-form-header">
              <span className="po-card-title" style={{margin:0}}>New Policy</span>
              <button className="po-btn-ghost edit" onClick={()=>setShowNew(false)}><X size={15}/></button>
            </div>
            <FormFields form={form} setForm={setForm} onSave={addNew} onCancel={()=>setShowNew(false)} saveLabel="Save Policy"/>
          </div>
        )}

        {/* ── Policy list ── */}
        {filtered.length===0 && (
          <div className="po-empty">
            <FileText size={28} color="#d1d5db"/>
            <p>No policies match your search.</p>
          </div>
        )}

        {filtered.map(p=>{
          const iconKey = ICON_MAP[p.category]||'FileText';
          const Icon    = ICON_COMPONENTS[iconKey]||FileText;
          const isEditing = editId===p.id;
          return (
            <div key={p.id} className={`po-card${isEditing?' highlight':''}`} style={{opacity:p.active?1:.6}}>
              {isEditing ? (
                <>
                  <div className="po-form-header">
                    <span className="po-card-title" style={{margin:0}}>Editing: {p.name}</span>
                    <button className="po-btn-ghost edit" onClick={cancelEdit}><X size={15}/></button>
                  </div>
                  <FormFields form={form} setForm={setForm} onSave={saveEdit} onCancel={cancelEdit} saveLabel="Save Changes"/>
                </>
              ) : (
                <div className="po-policy-body">
                  <div className="po-policy-top-row">
                    <div className="po-policy-icon-wrap"><Icon size={18} color="#6d28d9"/></div>
                    <div className="po-policy-content">
                      <div className="po-policy-meta">
                        <span className="po-policy-name">{p.name}</span>
                        <span className="po-badge gray">{p.category}</span>
                        {!p.active && <span className="po-badge red">Inactive</span>}
                        <span className="po-policy-updated">Updated {p.updatedAt}</span>
                      </div>
                      <p className="po-policy-text">{p.content}</p>
                    </div>
                  </div>
                  <div className="po-policy-actions">
                    <div className="po-policy-actions-inner">
                      <button
                        className={`po-toggle ${p.active?'on':''}`}
                        title={p.active?'Disable policy':'Enable policy'}
                        onClick={()=>toggleActive(p)}/>
                      <div style={{display:'flex',gap:4}}>
                        <button className="po-btn-ghost edit" title="Edit policy" onClick={()=>startEdit(p)}><Edit2 size={13}/></button>
                        <button className="po-btn-ghost del" title="Delete policy" onClick={()=>setDeleteTarget(p)}><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
