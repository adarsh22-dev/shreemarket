import React, { useState, useEffect } from 'react';
import {
  Phone, PhoneCall, PhoneMissed, CheckCircle, Clock,
  Search, Filter, X, User, MessageSquare, RefreshCw,
  ChevronDown, Check, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getWooAICallbacks,
  updateWooAICallback,
} from '@/api/api';
import './Callbacks.css';

/* ── Static data ── */
const AGENTS   = ['Sneha R.','Arjun M.','Preethi K.','Rahul N.','Unassigned'];
const PRIORITIES = ['all','urgent','high','medium','low'];

const COLORS = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#9333ea','#0d9488','#ca8a04'];

const nameColor = name => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

/* ── Helpers ── */
const initials = name => name.split(' ').map(w=>w[0]).join('');

const PriorityBadge = ({ p }) => {
  const map = { urgent:'red', high:'amber', medium:'blue', low:'gray' };
  return <span className={`cb-badge ${map[p]||'gray'}`}>{p}</span>;
};
const StatusBadge = ({ s }) => {
  const map = { pending:'amber', completed:'green', missed:'red' };
  return <span className={`cb-badge ${map[s]||'gray'}`}>{s}</span>;
};

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(()=>{ const t=setTimeout(onDone,2500); return ()=>clearTimeout(t); },[]);
  const cfg = {
    success:['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:  ['#fee2e2','#dc2626','#fecaca','✕'],
    info:   ['#dbeafe','#2563eb','#bfdbfe','ℹ'],
    warn:   ['#fef3c7','#d97706','#fde68a','⚠'],
  };
  const [bg,fg,bd,ico] = cfg[type]||cfg.info;
  return (
    <div className="cb-toast" style={{background:bg,color:fg,border:`1px solid ${bd}`}}>
      {ico} {msg}
    </div>
  );
};

/* ── Confirm modal ── */
const ConfirmModal = ({ title, body, confirmLabel, confirmColor, onConfirm, onCancel }) => (
  <div className="cb-overlay" onClick={onCancel}>
    <div className="cb-modal" onClick={e=>e.stopPropagation()}>
      <div className="cb-modal__hdr">
        <span className="cb-modal__title">{title}</span>
        <button className="cb-modal__close" onClick={onCancel}><X size={15}/></button>
      </div>
      <div className="cb-modal__body">{body}</div>
      <div className="cb-modal__ftr">
        <button className="cb-btn-outline" onClick={onCancel}>Cancel</button>
        <button className="cb-btn-confirm" style={{background:confirmColor}} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

/* ── Note modal ── */
const NoteModal = ({ item, onSave, onCancel }) => {
  const [text, setText] = useState(item.note||'');
  return (
    <div className="cb-overlay" onClick={onCancel}>
      <div className="cb-modal" onClick={e=>e.stopPropagation()}>
        <div className="cb-modal__hdr">
          <span className="cb-modal__title">Add Note — {item.name}</span>
          <button className="cb-modal__close" onClick={onCancel}><X size={15}/></button>
        </div>
        <div className="cb-modal__body">
          <textarea className="cb-note-input" autoFocus rows={4}
            placeholder="e.g. Customer is unavailable before 2 PM…"
            value={text} onChange={e=>setText(e.target.value)}/>
        </div>
        <div className="cb-modal__ftr">
          <button className="cb-btn-outline" onClick={onCancel}>Cancel</button>
          <button className="cb-btn-confirm" style={{background:'#6d28d9'}} onClick={()=>onSave(text)}>
            <Check size={13} color="#fff"/> Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Assign agent modal ── */
const AssignModal = ({ item, onSave, onCancel }) => {
  const [agent, setAgent] = useState(item.agent);
  return (
    <div className="cb-overlay" onClick={onCancel}>
      <div className="cb-modal" onClick={e=>e.stopPropagation()}>
        <div className="cb-modal__hdr">
          <span className="cb-modal__title">Assign Agent — {item.name}</span>
          <button className="cb-modal__close" onClick={onCancel}><X size={15}/></button>
        </div>
        <div className="cb-modal__body">
          <div className="cb-assign-list">
            {AGENTS.map(a=>(
              <button key={a} className={`cb-assign-opt ${agent===a?'cb-assign-opt--active':''}`}
                onClick={()=>setAgent(a)}>
                <div className="cb-assign-av" style={{background:a==='Unassigned'?'#9ca3af':'#6d28d9'}}>
                  {a==='Unassigned'?'?':initials(a)}
                </div>
                {a}
                {agent===a && <Check size={13} color="#6d28d9" style={{marginLeft:'auto'}}/>}
              </button>
            ))}
          </div>
        </div>
        <div className="cb-modal__ftr">
          <button className="cb-btn-outline" onClick={onCancel}>Cancel</button>
          <button className="cb-btn-confirm" style={{background:'#6d28d9'}} onClick={()=>onSave(agent)}>
            <Check size={13} color="#fff"/> Assign
          </button>
        </div>
      </div>
    </div>
  );
};

const mapCallback = c => ({
  id: c.id,
  name: c.customerName,
  phone: c.phone,
  email: c.email || '',
  issue: c.issue,
  priority: c.priority,
  status: c.status,
  time: c.requestedTime,
  agent: c.agent,
  note: c.note || '',
  color: nameColor(c.customerName || ''),
});

export default function Callbacks() {
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('all');
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState(null);

  /* Filter panel */
  const [showFilter,   setShowFilter]   = useState(false);
  const [filterPrio,   setFilterPrio]   = useState('all');
  const [filterAgent,  setFilterAgent]  = useState('all');

  /* Modals */
  const [callModal,    setCallModal]    = useState(null);
  const [missModal,    setMissModal]    = useState(null);
  const [retryModal,   setRetryModal]   = useState(null);
  const [noteModal,    setNoteModal]    = useState(null);
  const [assignModal,  setAssignModal]  = useState(null);

  const showToast = (msg, type='success') => setToast({ msg, type });

  useEffect(() => {
    getWooAICallbacks()
      .then(res => setData((res || []).map(mapCallback)))
      .catch(() => showToast('Failed to load callbacks', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const update = async (id, patch) => {
    try {
      await updateWooAICallback(id, patch);
      setData(d => d.map(c => c.id === id ? { ...c, ...patch } : c));
    } catch {
      showToast('Failed to update callback', 'error');
    }
  };

  /* ── Actions ── */
  const confirmCall  = () => { update(callModal.id,{status:'completed'}); showToast(`Call with ${callModal.name} marked complete`,'success'); setCallModal(null); };
  const confirmMiss  = () => { update(missModal.id,{status:'missed'});    showToast(`${missModal.name} marked as missed`,'warn');           setMissModal(null); };
  const confirmRetry = () => { update(retryModal.id,{status:'pending'});  showToast(`${retryModal.name} moved back to pending`,'info');     setRetryModal(null); };
  const saveNote     = (text) => { update(noteModal.id,{note:text}); showToast('Note saved'); setNoteModal(null); };
  const saveAssign   = (agent) => { update(assignModal.id,{agent}); showToast(`Assigned to ${agent}`); setAssignModal(null); };

  const counts = {
    pending:   data.filter(c=>c.status==='pending').length,
    completed: data.filter(c=>c.status==='completed').length,
    missed:    data.filter(c=>c.status==='missed').length,
  };

  const filtered = data.filter(c=>{
    const mTab    = tab==='all' || c.status===tab;
    const mSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                    c.issue.toLowerCase().includes(search.toLowerCase()) ||
                    c.phone.includes(search) ||
                    c.email.includes(search);
    const mPrio   = filterPrio==='all'   || c.priority===filterPrio;
    const mAgent  = filterAgent==='all'  || c.agent===filterAgent;
    return mTab && mSearch && mPrio && mAgent;
  });

  const activeFilters = (filterPrio!=='all'?1:0)+(filterAgent!=='all'?1:0);

  return (
    <div className="cb-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Call confirm */}
      {callModal && (
        <ConfirmModal
          title="Confirm Call"
          body={
            <div className="cb-modal__info">
              <div className="cb-modal__row"><span>Customer</span><strong>{callModal.name}</strong></div>
              <div className="cb-modal__row"><span>Phone</span><strong>{callModal.phone}</strong></div>
              {callModal.email && <div className="cb-modal__row"><span>Email</span><strong>{callModal.email}</strong></div>}
              <div className="cb-modal__row"><span>Issue</span><span>{callModal.issue}</span></div>
              <div className="cb-modal__row"><span>Priority</span><PriorityBadge p={callModal.priority}/></div>
              <div className="cb-modal__row"><span>Agent</span><strong>{callModal.agent}</strong></div>
              {callModal.note && <div className="cb-modal__note">Note: {callModal.note}</div>}
            </div>
          }
          confirmLabel={<><PhoneCall size={13} color="#fff"/> Mark as Called</>}
          confirmColor="#16a34a"
          onConfirm={confirmCall}
          onCancel={()=>setCallModal(null)}
        />
      )}

      {/* Miss confirm */}
      {missModal && (
        <ConfirmModal
          title="Mark as Missed"
          body={<div className="cb-modal__warn">Mark callback for <strong>{missModal.name}</strong> as missed? You can retry it later.</div>}
          confirmLabel={<><PhoneMissed size={13} color="#fff"/> Mark Missed</>}
          confirmColor="#dc2626"
          onConfirm={confirmMiss}
          onCancel={()=>setMissModal(null)}
        />
      )}

      {/* Retry confirm */}
      {retryModal && (
        <ConfirmModal
          title="Retry Callback"
          body={<div className="cb-modal__info-green">Move <strong>{retryModal.name}</strong> back to the pending queue?</div>}
          confirmLabel={<><RefreshCw size={13} color="#fff"/> Move to Pending</>}
          confirmColor="#6d28d9"
          onConfirm={confirmRetry}
          onCancel={()=>setRetryModal(null)}
        />
      )}

      {noteModal   && <NoteModal   item={noteModal}   onSave={saveNote}   onCancel={()=>setNoteModal(null)}/>}
      {assignModal && <AssignModal item={assignModal} onSave={saveAssign} onCancel={()=>setAssignModal(null)}/>}

      {/* ── Header ── */}
      <div className="cb-header">
        <Link to="/admin/wooai/dashboard" className="wooai-back-link"><ArrowLeft size={14}/> Back to Dashboard</Link>
        <div className="cb-header-row">
          <div>
            <h1>Callbacks</h1>
            <p>Manage customer callback requests and call queue</p>
          </div>
          <button className={`cb-btn-outline ${showFilter?'cb-btn-outline--active':''}`}
            onClick={()=>setShowFilter(s=>!s)}>
            <Filter size={13}/> Filter
            {activeFilters>0 && <span className="cb-filter-badge">{activeFilters}</span>}
          </button>
        </div>
      </div>

      <div className="cb-body">

        {/* ── Filter panel ── */}
        {showFilter && (
          <div className="cb-filter-panel">
            <div className="cb-filter-panel__hdr">
              <span style={{fontWeight:600,fontSize:13}}>Filters</span>
              {activeFilters>0 && (
                <button className="cb-filter-clear" onClick={()=>{setFilterPrio('all');setFilterAgent('all');}}>
                  Clear all
                </button>
              )}
            </div>
            <div className="cb-filter-grid">
              <div>
                <label className="cb-filter-label">Priority</label>
                <div className="cb-filter-pills">
                  {PRIORITIES.map(p=>(
                    <button key={p} className={`cb-filter-pill ${filterPrio===p?'cb-filter-pill--active':''}`}
                      onClick={()=>setFilterPrio(p)}>
                      {p==='all'?'All':p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="cb-filter-label">Agent</label>
                <div className="cb-filter-pills">
                  {['all',...AGENTS].map(a=>(
                    <button key={a} className={`cb-filter-pill ${filterAgent===a?'cb-filter-pill--active':''}`}
                      onClick={()=>setFilterAgent(a)}>
                      {a==='all'?'All':a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="cb-stats">
          <div className="cb-stat amber">
            <div className="cb-stat-icon"><Clock size={15}/></div>
            <div className="cb-stat-val">{counts.pending}</div>
            <div className="cb-stat-label">Pending</div>
          </div>
          <div className="cb-stat green">
            <div className="cb-stat-icon"><CheckCircle size={15}/></div>
            <div className="cb-stat-val">{counts.completed}</div>
            <div className="cb-stat-label">Completed Today</div>
          </div>
          <div className="cb-stat red">
            <div className="cb-stat-icon"><PhoneMissed size={15}/></div>
            <div className="cb-stat-val">{counts.missed}</div>
            <div className="cb-stat-label">Missed</div>
          </div>
          <div className="cb-stat blue">
            <div className="cb-stat-icon"><Phone size={15}/></div>
            <div className="cb-stat-val">{data.length}</div>
            <div className="cb-stat-label">Total Requests</div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="cb-search-row">
          <div className="cb-search-wrap">
            <Search size={14}/>
            <input placeholder="Search by name, issue or phone…"
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="cb-tabs">
          {['all','pending','completed','missed'].map(t=>(
            <button key={t} className={`cb-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {t!=='all' && <span className="cb-tab-count">{counts[t]??0}</span>}
            </button>
          ))}
        </div>

        {/* ── List ── */}
        <div className="cb-list">
          {loading && (
            <div className="cb-empty">
              <RefreshCw size={32} className="cb-spin"/>
              <h3>Loading callbacks…</h3>
            </div>
          )}

          {!loading && filtered.length===0 && (
            <div className="cb-empty">
              <Phone size={32}/>
              <h3>No callbacks found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}

          {filtered.map(c=>(
            <div key={c.id} className={`cb-item cb-item--${c.status}`}>
              <div className="cb-avatar" style={{background:c.color}}>{initials(c.name)}</div>

              <div className="cb-info">
                <div className="cb-info-top">
                  <span className="cb-name">{c.name}</span>
                  <PriorityBadge p={c.priority}/>
                  <StatusBadge s={c.status}/>
                </div>
                <div className="cb-issue">{c.issue}</div>
                <div className="cb-meta">
                  <span>{c.phone}</span>
                  {c.email && <span>{c.email}</span>}
                  <span>Requested {c.time}</span>
                  <span>Agent: {c.agent}</span>
                </div>
                {c.note && (
                  <div className="cb-note-preview">
                    <MessageSquare size={10}/> {c.note}
                  </div>
                )}
              </div>

              <div className="cb-actions">
                {c.status==='pending' && (<>
                  <button className="cb-btn-primary" title="Call customer"
                    onClick={()=>setCallModal(c)}>
                    <PhoneCall size={13}/> Call
                  </button>
                  <button className="cb-btn-icon cb-btn-icon--note" title="Add note"
                    onClick={()=>setNoteModal(c)}>
                    <MessageSquare size={13}/>
                  </button>
                  <button className="cb-btn-icon cb-btn-icon--assign" title="Assign agent"
                    onClick={()=>setAssignModal(c)}>
                    <User size={13}/>
                  </button>
                  <button className="cb-btn-danger" title="Mark as missed"
                    onClick={()=>setMissModal(c)}>
                    <PhoneMissed size={13}/>
                  </button>
                </>)}

                {c.status==='completed' && (<>
                  <div className="cb-done"><CheckCircle size={14}/> Done</div>
                  <button className="cb-btn-icon cb-btn-icon--note" title="Add note"
                    onClick={()=>setNoteModal(c)}>
                    <MessageSquare size={13}/>
                  </button>
                </>)}

                {c.status==='missed' && (<>
                  <button className="cb-btn-outline" title="Retry callback"
                    onClick={()=>setRetryModal(c)}>
                    <RefreshCw size={12}/> Retry
                  </button>
                  <button className="cb-btn-icon cb-btn-icon--assign" title="Assign agent"
                    onClick={()=>setAssignModal(c)}>
                    <User size={13}/>
                  </button>
                </>)}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}