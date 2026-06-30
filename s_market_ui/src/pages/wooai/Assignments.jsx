import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Zap, X, Save, Check,
  Package, Tag, Star, TrendingUp, Gift, Sparkles,
  ShoppingBag, UserPlus, Users, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getWooAIAgents, createWooAIAgent, updateWooAIAgent, deleteWooAIAgent,
  getWooAIRoutingRules, createWooAIRoutingRule, updateWooAIRoutingRule, deleteWooAIRoutingRule,
  getWooAIProductAssignments, addWooAIProductAssignment, removeWooAIProductAssignmentByKey,
  getAllProducts
} from '@/api/api';
import './Assignments.css';

/* ── Static agent config ── */
const STATUS_OPTIONS = ['online','away','offline'];
const AGENT_COLORS   = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#be185d','#7c3aed'];
const BLANK_AGENT    = { name:'', role:'Support', status:'online', chats:0, cap:25, color:'#6d28d9' };

const CAT_META = {
  Electronics: { icon: Zap,         color:'#2563eb', bg:'#dbeafe' },
  Sports:      { icon: TrendingUp,  color:'#16a34a', bg:'#dcfce7' },
  Fashion:     { icon: Tag,         color:'#be185d', bg:'#fce7f3' },
  Home:        { icon: Package,     color:'#d97706', bg:'#fef3c7' },
  Beauty:      { icon: Star,        color:'#7c3aed', bg:'#ede9fe' },
  Grocery:     { icon: ShoppingBag, color:'#0891b2', bg:'#e0f2fe' },
};

const ProdIcon = ({ category, size=15 }) => {
  const m = CAT_META[category]||{ icon:Package, color:'#64748b', bg:'#f1f5f9' };
  const Icon = m.icon;
  return <div className="as-prod-icon" style={{background:m.bg}}><Icon size={size} color={m.color}/></div>;
};

const SECTIONS = [
  { key:'bestselling',  label:'Best Selling', icon:TrendingUp, color:'#16a34a', bg:'#dcfce7' },
  { key:'recommended',  label:'Recommended',  icon:Star,       color:'#6d28d9', bg:'#ede9fe' },
  { key:'new_arrivals', label:'New Arrivals', icon:Sparkles,   color:'#2563eb', bg:'#dbeafe' },
  { key:'offers',       label:'Offers',       icon:Gift,       color:'#d97706', bg:'#fef3c7' },
];

const BLANK_RULE = { intent:'', assignee:'AI Bot', priority:'auto' };
const initials   = name => name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

const PriorityBadge = ({ p }) => {
  const map = { high:'red', medium:'amber', auto:'purple' };
  return <span className={`as-badge ${map[p]||'gray'}`}>{p}</span>;
};

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(()=>{ const t=setTimeout(onDone,2400); return ()=>clearTimeout(t); },[]);
  const cfg = {
    success:['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:  ['#fee2e2','#dc2626','#fecaca','✕'],
    info:   ['#ede9fe','#6d28d9','#c4b5fd','ℹ'],
  };
  const [bg,fg,bd,ico] = cfg[type]||cfg.success;
  return <div className="as-toast" style={{background:bg,color:fg,border:`1px solid ${bd}`}}>{ico} {msg}</div>;
};

/* ── Generic confirm modal ── */
const ConfirmModal = ({ title, body, onConfirm, onCancel, confirmLabel='Delete', dangerColor='#dc2626' }) => (
  <div className="as-overlay" onClick={onCancel}>
    <div className="as-modal" onClick={e=>e.stopPropagation()}>
      <div className="as-modal__hdr">
        <span className="as-modal__title">{title}</span>
        <button className="as-btn-ghost edit" onClick={onCancel}><X size={15}/></button>
      </div>
      <div className="as-modal__body"><div className="as-modal__warn">{body}</div></div>
      <div className="as-modal__ftr">
        <button className="as-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="as-btn-danger" style={{background:dangerColor}} onClick={onConfirm}>
          <Trash2 size={13}/>{confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default function Assignments() {
  /* ── Agent state ── */
  const [agents,      setAgents]      = useState([]);
  const [agentModal,  setAgentModal]  = useState(null); // null | 'new' | agent-object
  const [agentForm,   setAgentForm]   = useState({...BLANK_AGENT});
  const [deleteAgent, setDeleteAgent] = useState(null);

  /* ── Rule state ── */
  const [rules,       setRules]       = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(BLANK_RULE);
  const [editId,      setEditId]      = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);

  /* ── Products ── */
  const [products, setProducts] = useState([]);

  /* ── Product assignment ── */
  const [assigned,      setAssigned]      = useState({ bestselling:[], recommended:[], new_arrivals:[], offers:[] });
  const [activeSection, setActiveSection] = useState('bestselling');
  const [prodSearch,    setProdSearch]    = useState('');

  const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => setToast({ msg, type });

  /* ═══ FETCH ALL DATA ON MOUNT ═══ */
  useEffect(() => {
    Promise.all([
      getWooAIAgents(),
      getWooAIRoutingRules(),
      getAllProducts()
    ]).then(([agentsData, rulesData, productsData]) => {
      setAgents(agentsData || []);
      setRules(rulesData || []);
      setProducts(productsData || []);
    }).catch(() => {
      setAgents([]);
      setRules([]);
      setProducts([]);
    });

    const sections = ['bestselling', 'recommended', 'new_arrivals', 'offers'];
    Promise.all(
      sections.map(sec =>
        getWooAIProductAssignments(sec).then(data => ({ sec, data: data || [] }))
      )
    ).then(results => {
      const assignedMap = {};
      results.forEach(({ sec, data }) => {
        assignedMap[sec] = Array.isArray(data)
          ? data.map(item => typeof item === 'string' ? item : item.productId).filter(Boolean)
          : [];
      });
      setAssigned(prev => ({ ...prev, ...assignedMap }));
    }).catch(() => {});
  }, []);

  /* ═══ AGENT ACTIONS ═══ */
  const openAddAgent  = () => { setAgentForm({...BLANK_AGENT}); setAgentModal('new'); };
  const openEditAgent = a  => { setAgentForm({...a});           setAgentModal(a); };

  const saveAgent = async () => {
    if (!agentForm.name.trim()) return;
    try {
      if (agentModal==='new') {
        const payload = { ...agentForm, chats:Number(agentForm.chats)||0, cap:Number(agentForm.cap)||25 };
        delete payload.id;
        const created = await createWooAIAgent(payload);
        setAgents(prev=>[...prev, created]);
        showToast(`${agentForm.name} added`);
      } else {
        const payload = { ...agentForm, chats:Number(agentForm.chats)||0, cap:Number(agentForm.cap)||25 };
        delete payload.id;
        const updated = await updateWooAIAgent(agentModal.id, payload);
        setAgents(prev=>prev.map(a=>a.id===agentModal.id?updated:a));
        showToast(`${agentForm.name} updated`);
      }
    } catch {
      showToast('Failed to save agent', 'error');
    }
    setAgentModal(null);
  };

  const confirmDeleteAgent = async () => {
    try {
      await deleteWooAIAgent(deleteAgent.id);
      setAgents(prev=>prev.filter(a=>a.id!==deleteAgent.id));
      showToast(`${deleteAgent.name} removed`, 'error');
    } catch {
      showToast('Failed to delete agent', 'error');
    }
    setDeleteAgent(null);
  };

  /* ═══ RULE ACTIONS ═══ */
  const toggle = async id => {
    const r = rules.find(x=>x.id===id);
    if (!r) return;
    try {
      const updated = await updateWooAIRoutingRule(id, { ...r, active:!r.active });
      setRules(prev=>prev.map(x=>x.id===id?updated:x));
      showToast(`"${r.intent}" ${r.active?'disabled':'enabled'}`);
    } catch {
      showToast('Failed to toggle rule', 'error');
    }
  };
  const openEdit = r => { setEditId(r.id); setForm({intent:r.intent,assignee:r.assignee,priority:r.priority}); setShowForm(true); };
  const save = async () => {
    if (!form.intent.trim()) return;
    try {
      if (editId) {
        const updated = await updateWooAIRoutingRule(editId, form);
        setRules(prev=>prev.map(x=>x.id===editId?updated:x));
        showToast(`"${form.intent}" rule updated`);
      } else {
        const created = await createWooAIRoutingRule({ ...form, active:true });
        setRules(prev=>[...prev, created]);
        showToast(`"${form.intent}" rule added`);
      }
    } catch {
      showToast('Failed to save rule', 'error');
    }
    setForm(BLANK_RULE);
    setShowForm(false);
    setEditId(null);
  };
  const confirmDeleteRule = async () => {
    const r = rules.find(x=>x.id===deleteId);
    if (!r) return;
    try {
      await deleteWooAIRoutingRule(deleteId);
      setRules(prev=>prev.filter(x=>x.id!==deleteId));
      showToast(`"${r.intent}" rule deleted`,'error');
    } catch {
      showToast('Failed to delete rule', 'error');
    }
    setDeleteId(null);
  };

  /* ═══ PRODUCT ACTIONS ═══ */
  const toggleProduct = async pid => {
    const secLabel = SECTIONS.find(s=>s.key===activeSection).label;
    const cur = assigned[activeSection];
    const exists = cur.includes(pid);
    if (!exists && cur.length>=10){ showToast('Max 10 products per section','info'); return; }
    try {
      if (exists) {
        await removeWooAIProductAssignmentByKey(activeSection, pid);
      } else {
        await addWooAIProductAssignment({ sectionKey: activeSection, productId: pid });
      }
      setAssigned(prev=>{
        showToast(exists?`Removed from ${secLabel}`:`Added to ${secLabel}`);
        return {...prev,[activeSection]:exists?prev[activeSection].filter(x=>x!==pid):[...prev[activeSection],pid]};
      });
    } catch {
      showToast('Failed to update assignment', 'error');
    }
  };
  const removeFromSection = async (pid,sec) => {
    const p=products.find(x=>String(x.id)===pid);
    try {
      await removeWooAIProductAssignmentByKey(sec, pid);
      setAssigned(prev=>({...prev,[sec]:prev[sec].filter(x=>x!==pid)}));
      showToast(`${p?.name||'Product'} removed`,'error');
    } catch {
      showToast('Failed to remove product', 'error');
    }
  };

  const filteredProducts = products.filter(p=>
    p.name?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    (p.category||'').toLowerCase().includes(prodSearch.toLowerCase())
  );
  const currentAssigned = assigned[activeSection];
  const activeSecMeta   = SECTIONS.find(s=>s.key===activeSection);

  /* ── All assignees for rule form ── */
  const allAssignees = ['AI Bot', ...agents.map(a=>a.name)];

  return (
    <div className="as-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* ── Delete rule confirm ── */}
      {deleteId && (
        <ConfirmModal
          title="Delete Rule"
          body={<>Delete rule <strong>"{rules.find(x=>x.id===deleteId)?.intent}"</strong>? This cannot be undone.</>}
          onConfirm={confirmDeleteRule}
          onCancel={()=>setDeleteId(null)}
          confirmLabel="Delete Rule"
        />
      )}

      {/* ── Delete agent confirm ── */}
      {deleteAgent && (
        <ConfirmModal
          title="Remove Agent"
          body={<>Remove <strong>{deleteAgent.name}</strong> from the agent list? Any rules assigned to them will need reassigning.</>}
          onConfirm={confirmDeleteAgent}
          onCancel={()=>setDeleteAgent(null)}
          confirmLabel="Remove Agent"
        />
      )}

      {/* ── Agent add/edit modal ── */}
      {agentModal && (
        <div className="as-overlay" onClick={()=>setAgentModal(null)}>
          <div className="as-modal as-modal--wide" onClick={e=>e.stopPropagation()}>
            <div className="as-modal__hdr">
              <span className="as-modal__title">{agentModal==='new'?'Add Agent':'Edit Agent'}</span>
              <button className="as-btn-ghost edit" onClick={()=>setAgentModal(null)}><X size={15}/></button>
            </div>
            <div className="as-modal__body">
              <div className="as-agent-form-grid">
                <div>
                  <label className="as-label">Full Name</label>
                  <input className="as-input" autoFocus placeholder="e.g. Sneha R."
                    value={agentForm.name} onChange={e=>setAgentForm(f=>({...f,name:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&saveAgent()}/>
                </div>
                <div>
                  <label className="as-label">Role</label>
                  <select className="as-select" value={agentForm.role} onChange={e=>setAgentForm(f=>({...f,role:e.target.value}))}>
                    <option>Support Lead</option>
                    <option>Support</option>
                    <option>Senior Support</option>
                    <option>Technical Support</option>
                  </select>
                </div>
                <div>
                  <label className="as-label">Status</label>
                  <select className="as-select" value={agentForm.status} onChange={e=>setAgentForm(f=>({...f,status:e.target.value}))}>
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="as-label">Avatar Colour</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                    {AGENT_COLORS.map(c=>(
                      <button key={c} onClick={()=>setAgentForm(f=>({...f,color:c}))}
                        style={{width:26,height:26,borderRadius:'50%',background:c,border:agentForm.color===c?'2px solid #0f172a':'2px solid transparent',cursor:'pointer',transition:'border .13s'}}/>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="as-label">Active Chats (current)</label>
                  <input className="as-input" type="number" min={0} max={agentForm.cap}
                    value={agentForm.chats} onChange={e=>setAgentForm(f=>({...f,chats:e.target.value}))}/>
                </div>
                <div>
                  <label className="as-label">Capacity (max chats)</label>
                  <input className="as-input" type="number" min={1} max={100}
                    value={agentForm.cap} onChange={e=>setAgentForm(f=>({...f,cap:e.target.value}))}/>
                </div>
              </div>

              {/* Live preview */}
              {agentForm.name.trim() && (
                <div className="as-agent-preview">
                  <div className="as-avatar" style={{background:agentForm.color,width:38,height:38}}>{initials(agentForm.name)}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{agentForm.name}</div>
                    <div style={{fontSize:11,color:'#6b7280'}}>{agentForm.role} · <span className={`as-dot ${agentForm.status}`} style={{marginRight:3}}/>{agentForm.status}</div>
                  </div>
                  <div style={{marginLeft:'auto',fontSize:12,color:'#6d28d9',fontWeight:600}}>{agentForm.chats}/{agentForm.cap} chats</div>
                </div>
              )}
            </div>
            <div className="as-modal__ftr">
              <button className="as-btn-outline" onClick={()=>setAgentModal(null)}>Cancel</button>
              <button className="as-btn-primary" disabled={!agentForm.name.trim()} onClick={saveAgent}>
                <Save size={13}/> {agentModal==='new'?'Add Agent':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="as-header">
        <Link to="/admin/wooai/dashboard" className="wooai-back-link"><ArrowLeft size={14}/> Back to Dashboard</Link>
        <div className="as-header-row">
          <div>
            <h1>Assignments</h1>
            <p>Manage agent workloads, routing rules and product sections</p>
          </div>
          <button className="as-btn-primary" onClick={()=>{ setEditId(null); setForm(BLANK_RULE); setShowForm(s=>!s); }}>
            <Plus size={15}/> New Rule
          </button>
        </div>
      </div>

      <div className="as-body">

        {/* ══ AGENT WORKLOAD ══ */}
        <div className="as-card">
          <div className="as-card-title" style={{justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <Users size={15} color="#6d28d9"/> Agent Workload
            </div>
            <button className="as-btn-add-agent" onClick={openAddAgent}>
              <UserPlus size={13}/> Add Agent
            </button>
          </div>

          <div className="as-agent-grid">
            {agents.map(a=>(
              <div key={a.id} className="as-agent-item">
                {/* Agent action icons top-right */}
                <div className="as-agent-actions">
                  <button className="as-btn-ghost edit" title="Edit agent" onClick={()=>openEditAgent(a)}><Edit2 size={12}/></button>
                  <button className="as-btn-ghost del"  title="Remove agent" onClick={()=>setDeleteAgent(a)}><Trash2 size={12}/></button>
                </div>

                <div className="as-agent-top">
                  <div className="as-avatar" style={{background:a.color}}>{initials(a.name)}</div>
                  <div>
                    <div className="as-agent-name">{a.name}</div>
                    <div className="as-agent-role">{a.role}</div>
                  </div>
                </div>
                <div className="as-agent-row">
                  <span>Status</span>
                  <span><span className={`as-dot ${a.status}`}/>{a.status}</span>
                </div>
                <div className="as-agent-row">
                  <span>Active chats</span>
                  <span className="chats">{a.chats} / {a.cap}</span>
                </div>
                <div className="as-bar-bg">
                  <div className="as-bar-fill" style={{width:`${Math.min(100,Math.round(a.chats/a.cap*100))}%`,background:a.status==='offline'?'#d1d5db':'#6d28d9'}}/>
                </div>
                <div className="as-cap-pct">{Math.min(100,Math.round(a.chats/a.cap*100))}% capacity</div>
              </div>
            ))}

            {/* Add agent card */}
            <div className="as-agent-add-card" onClick={openAddAgent}>
              <UserPlus size={22} color="#c4b5fd"/>
              <span>Add Agent</span>
            </div>
          </div>
        </div>

        {/* ══ ADD / EDIT RULE ══ */}
        {showForm && (
          <div className="as-card highlight">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <span className="as-card-title" style={{margin:0}}>{editId?'Edit Routing Rule':'Add Routing Rule'}</span>
              <button className="as-btn-ghost edit" onClick={()=>{setShowForm(false);setEditId(null);setForm(BLANK_RULE);}}><X size={15}/></button>
            </div>
            <div className="as-form-grid">
              <div>
                <label className="as-label">Intent / Keyword</label>
                <input className="as-input" placeholder="e.g. Damaged Item" autoFocus
                  value={form.intent} onChange={e=>setForm({...form,intent:e.target.value})}
                  onKeyDown={e=>e.key==='Enter'&&save()}/>
              </div>
              <div>
                <label className="as-label">Assign To</label>
                <select className="as-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>
                  {allAssignees.map(n=><option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="as-label">Priority</label>
                <select className="as-select" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option value="auto">Auto</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button className="as-btn-primary" onClick={save} style={{alignSelf:'flex-end'}} disabled={!form.intent.trim()}>
                <Save size={14}/> {editId?'Update':'Save'}
              </button>
            </div>
          </div>
        )}

        {/* ══ ROUTING RULES ══ */}
        <div className="as-card">
          <div className="as-card-title">Routing Rules</div>
          <div className="as-table-wrap">
            <table className="as-table">
              <thead>
                <tr><th>Intent</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rules.length===0 && <tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'#9ca3af',fontSize:12}}>No routing rules yet.</td></tr>}
                {rules.map(r=>(
                  <tr key={r.id} style={{opacity:r.active?1:.5}}>
                    <td style={{fontWeight:500}}>{r.intent}</td>
                    <td>
                      {r.assignee==='AI Bot'?(
                        <span className="as-badge purple"><Zap size={10}/>AI Bot</span>
                      ):(
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <div className="as-avatar" style={{width:24,height:24,fontSize:9,background:'#8b5cf6'}}>{initials(r.assignee)}</div>
                          {r.assignee}
                        </div>
                      )}
                    </td>
                    <td><PriorityBadge p={r.priority}/></td>
                    <td>
                      <button className={`as-toggle ${r.active?'on':''}`} onClick={()=>toggle(r.id)} title={r.active?'Disable':'Enable'}/>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="as-btn-ghost edit" title="Edit" onClick={()=>openEdit(r)}><Edit2 size={13}/></button>
                        <button className="as-btn-ghost del"  title="Delete" onClick={()=>setDeleteId(r.id)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ PRODUCT SECTION ASSIGNMENT ══ */}
        <div className="as-card" style={{marginBottom:0}}>
          <div className="as-card-title">
            <Package size={15} color="#6d28d9"/> Product Section Assignment
          </div>

          <div className="as-sec-tabs">
            {SECTIONS.map(s=>{
              const Icon=s.icon, count=assigned[s.key].length, isActive=activeSection===s.key;
              return (
                <button key={s.key}
                  className={`as-sec-tab ${isActive?'as-sec-tab--active':''}`}
                  style={isActive?{borderColor:s.color,color:s.color,background:s.bg}:{}}
                  onClick={()=>{setActiveSection(s.key);setProdSearch('');}}>
                  <Icon size={13}/> {s.label}
                  {count>0&&<span className="as-sec-tab__count" style={isActive?{background:s.color,color:'#fff'}:{}}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="as-prod-layout">
            {/* Left – picker */}
            <div className="as-prod-picker">
              <div className="as-prod-picker__hdr">
                <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>All Products</span>
                <span style={{fontSize:11,color:'#9ca3af'}}>{filteredProducts.length} items</span>
              </div>
              <input className="as-input as-prod-search" placeholder="Search by name or category…"
                value={prodSearch} onChange={e=>setProdSearch(e.target.value)}/>
              <div className="as-prod-list">
                {filteredProducts.map(p=>{
                  const pid = String(p.id);
                  const inSection=currentAssigned.includes(pid);
                  return (
                    <div key={p.id} className={`as-prod-row ${inSection?'as-prod-row--selected':''}`}
                      onClick={()=>toggleProduct(pid)}>
                      <ProdIcon category={p.category}/>
                      <div className="as-prod-info">
                        <div className="as-prod-name">{p.name}</div>
                        <div className="as-prod-cat">{p.category} · ₹{(p.regularPrice||0).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="as-prod-check"
                        style={{background:inSection?activeSecMeta.color:'#f3f4f6',borderColor:inSection?activeSecMeta.color:'#e5e7eb'}}>
                        {inSection&&<Check size={10} color="#fff"/>}
                      </div>
                    </div>
                  );
                })}
                {filteredProducts.length===0&&<div style={{textAlign:'center',padding:'24px 0',color:'#9ca3af',fontSize:12}}>No products found</div>}
              </div>
            </div>

            {/* Right – assigned */}
            <div className="as-prod-assigned">
              <div className="as-prod-assigned__hdr">
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {React.createElement(activeSecMeta.icon,{size:14,color:activeSecMeta.color})}
                  <span style={{fontSize:12,fontWeight:700,color:activeSecMeta.color}}>{activeSecMeta.label}</span>
                </div>
                <span style={{fontSize:11,color:'#9ca3af'}}>{currentAssigned.length}/10</span>
              </div>

              {currentAssigned.length===0?(
                <div className="as-prod-empty">
                  <Package size={26} color="#d1d5db"/>
                  <p>No products assigned yet.</p>
                  <p style={{fontSize:11}}>Select products on the left to add them here.</p>
                </div>
              ):(
                <div className="as-prod-chips">
                  {currentAssigned.map(pid=>{
                    const p=products.find(x=>String(x.id)===pid);
                    if(!p) return null;
                    return (
                      <div key={pid} className="as-prod-chip">
                        <ProdIcon category={p.category} size={13}/>
                        <div className="as-prod-chip__info">
                          <div className="as-prod-chip__name">{p.name}</div>
                          <div className="as-prod-chip__cat">{p.category}</div>
                        </div>
                        <button className="as-prod-chip__remove" title="Remove" onClick={()=>removeFromSection(pid,activeSection)}>
                          <X size={11}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="as-sec-summary">
                {SECTIONS.map(s=>{
                  const Icon=s.icon, cnt=assigned[s.key].length;
                  return (
                    <div key={s.key} className="as-sec-summary__item" onClick={()=>{setActiveSection(s.key);setProdSearch('');}}>
                      <div className="as-sec-summary__icon" style={{background:s.bg}}><Icon size={12} color={s.color}/></div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#111827'}}>{cnt}</div>
                        <div style={{fontSize:10,color:'#9ca3af'}}>{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
