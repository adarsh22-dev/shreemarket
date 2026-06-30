import React, { useState, useEffect } from 'react';
import './PushNotifications.css';
import {
  Bell, Send, Plus, Edit2, Trash2, Clock, Users,
  CheckCircle, Target, TrendingUp, BarChart2,
  X, Check, Smartphone, AlertCircle, Search,
  Calendar, ChevronRight, Eye, Filter, Download,
  Zap, Globe, UserCheck, ShoppingCart, Star
} from 'lucide-react';
import { getPushNotifications, createPushNotification, updatePushNotification, deletePushNotification } from '../../api/api';

const fmtN = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}k` : String(n);
const nowStr = () => new Date().toISOString().slice(0,16).replace('T',' ');

const Toast = ({ msg, type, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
  const map = { success:['#f0fdf4','#16a34a','#bbf7d0','✓'], error:['#fee2e2','#dc2626','#fecaca','✕'], info:['#dbeafe','#2563eb','#bfdbfe','ℹ'] };
  const [bg,fg,border,ico] = map[type]||map.info;
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:bg,color:fg,border:`1px solid ${border}`,padding:'10px 18px',borderRadius:10,fontSize:'.82rem',fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px rgba(0,0,0,.14)',zIndex:2000,whiteSpace:'nowrap',animation:'pn-toast-in .22s ease',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {ico} {msg}
    </div>
  );
};

const SEGMENTS = [
  { id:'all',       label:'All Users',        icon: Globe,       count:'284.6k' },
  { id:'ordered',   label:'Recent Buyers',    icon: ShoppingCart,count:'28.4k'  },
  { id:'wishlist',  label:'Wishlist Users',   icon: Star,        count:'62.0k'  },
  { id:'cart',      label:'Cart Abandoners',  icon: ShoppingCart,count:'18.2k'  },
  { id:'platinum',  label:'Platinum Members', icon: Star,        count:'8.4k'   },
  { id:'inactive',  label:'Inactive (30d+)',  icon: UserCheck,   count:'32.1k'  },
  { id:'grocery',   label:'Grocery Buyers',   icon: Users,       count:'44.8k'  },
  { id:'new_users', label:'New Users',        icon: UserCheck,   count:'12.6k'  },
];

const STATUS_META = {
  sent:      { bg:'#dcfce7', color:'#16a34a', label:'Sent'      },
  scheduled: { bg:'#dbeafe', color:'#2563eb', label:'Scheduled' },
  draft:     { bg:'#f1f5f9', color:'#64748b', label:'Draft'     },
  failed:    { bg:'#fee2e2', color:'#dc2626', label:'Failed'    },
};

const EMPTY_FORM = { title:'', body:'', segment:'all', scheduled:'', status:'draft' };

export default function PushNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [toast,   setToast]   = useState(null);

  const [modal,       setModal]       = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [sendModal,   setSendModal]   = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);

  const showToast = (msg, type='success') => setToast({ msg, type });

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPushNotifications();
      if (data) setNotifications(data);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setEditTarget(null); setModal(true); };

  const openEdit = (n) => {
    setEditTarget(n);
    setForm({ title:n.title, body:n.body, segment:n.segment, scheduled:n.scheduled||'', status:n.status });
    setModal(true);
  };

  const save = async (sendNow = false) => {
    const status   = sendNow ? 'sent' : (form.scheduled ? 'scheduled' : 'draft');
    const sentTime = sendNow ? nowStr() : null;
    try {
      const payload = {
        title: form.title,
        body: form.body,
        segment: form.segment,
        scheduled: form.scheduled || null,
        sent: editTarget ? (sentTime || editTarget.sent) : sentTime,
        delivered: editTarget ? (sendNow && editTarget.delivered === 0 ? Math.floor(Math.random()*100000+5000) : editTarget.delivered) : (sendNow ? Math.floor(Math.random()*200000+5000) : 0),
        opened: editTarget ? editTarget.opened : 0,
        ctr: editTarget ? editTarget.ctr : 0,
        status,
      };

      if (editTarget) {
        const updated = await updatePushNotification(editTarget.id, payload);
        setNotifications(ns => ns.map(n => n.id === editTarget.id ? { ...n, ...updated } : n));
      } else {
        const created = await createPushNotification(payload);
        setNotifications(ns => [created, ...ns]);
      }
      showToast(sendNow ? `"${form.title}" sent!` : (status==='scheduled' ? 'Campaign scheduled' : 'Saved as draft'));
    } catch (err) {
      setError(err.message || 'Failed to save campaign');
    }
    setModal(false); setEditTarget(null); setForm(EMPTY_FORM);
  };

  const quickSend = async (n) => {
    try {
      const updated = await updatePushNotification(n.id, {
        ...n, status:'sent', sent:nowStr(), scheduled:null,
        delivered: Math.floor(Math.random()*100000+1000),
      });
      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, ...updated } : x));
      showToast(`"${n.title}" sent!`);
    } catch (err) {
      setError(err.message || 'Failed to send');
    }
    setSendModal(null);
  };

  const confirmDelete = async () => {
    try {
      await deletePushNotification(deleteModal.id);
      setNotifications(ns => ns.filter(n => n.id !== deleteModal.id));
      showToast(`"${deleteModal.title}" deleted`, 'error');
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
    setDeleteModal(null);
  };

  const handleExport = () => {
    const rows = [
      ['ID','Title','Body','Segment','Status','Delivered','Opened','CTR','Sent','Scheduled'],
      ...notifications.map(n=>[n.id,n.title,n.body,n.segment,n.status,n.delivered,n.opened,n.ctr+'%',n.sent||'',n.scheduled||''])
    ];
    const csv  = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a    = Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'push_campaigns.csv'});
    a.click(); URL.revokeObjectURL(a.href);
    showToast('CSV downloaded');
  };

  const displayed = notifications.filter(n => {
    const mS = filter==='all' || n.status===filter;
    const mQ = n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase());
    return mS && mQ;
  });

  const sentNs    = notifications.filter(n=>n.status==='sent');
  const totalDel  = sentNs.reduce((s,n)=>s+n.delivered,0);
  const totalOpen = sentNs.reduce((s,n)=>s+n.opened,0);
  const avgCtr    = sentNs.length>0 ? (sentNs.reduce((s,n)=>s+n.ctr,0)/sentNs.length).toFixed(1) : 0;
  const scheduled = notifications.filter(n=>n.status==='scheduled').length;
  const seg       = SEGMENTS.find(s=>s.id===form.segment);

  return (
    <div className="pn">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Header */}
      <div className="pn-hdr">
        <div>
          <h2 className="pn-hdr__title">Push Notifications</h2>
          <p className="pn-hdr__sub">Send targeted push campaigns to segmented user groups</p>
        </div>
        <div className="pn-hdr__acts">
          <button className="pn-btn pn-btn--outline" onClick={handleExport}><Download size={13} color="#475569"/>Export CSV</button>
          <button className="pn-btn pn-btn--primary" onClick={openNew}><Plus size={14} color="#fff"/>New Campaign</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="pn-kpis">
        <div className="pn-kpi"><div className="pn-kpi__icon" style={{background:'#fff0ed'}}><Bell size={20} color="#E03E1A"/></div><div><div className="pn-kpi__val">{loading?'…':notifications.length}</div><div className="pn-kpi__lbl">Total Campaigns</div></div></div>
        <div className="pn-kpi"><div className="pn-kpi__icon" style={{background:'#f0fdf4'}}><CheckCircle size={20} color="#16a34a"/></div><div><div className="pn-kpi__val">{loading?'…':fmtN(totalDel)}</div><div className="pn-kpi__lbl">Total Delivered</div></div></div>
        <div className="pn-kpi"><div className="pn-kpi__icon" style={{background:'#eff6ff'}}><Target size={20} color="#2563eb"/></div><div><div className="pn-kpi__val">{loading?'…':fmtN(totalOpen)}</div><div className="pn-kpi__lbl">Total Opened</div></div></div>
        <div className="pn-kpi"><div className="pn-kpi__icon" style={{background:'#fef9ec'}}><TrendingUp size={20} color="#d97706"/></div><div><div className="pn-kpi__val">{loading?'…':avgCtr}%</div><div className="pn-kpi__lbl">Avg Open Rate</div></div></div>
        <div className="pn-kpi"><div className="pn-kpi__icon" style={{background:'#f5f3ff'}}><Clock size={20} color="#7c3aed"/></div><div><div className="pn-kpi__val">{loading?'…':scheduled}</div><div className="pn-kpi__lbl">Scheduled</div></div></div>
      </div>

      {error && (
        <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',fontSize:'.82rem',color:'#dc2626',display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <AlertCircle size={13}/><span style={{flex:1}}>{error}</span>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626'}} onClick={()=>setError(null)}><X size={13}/></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="pn-toolbar">
        <div className="pn-search">
          <Search size={14} color="#94a3b8"/>
          <input className="pn-search__inp" placeholder="Search campaigns…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="pn-filters">
          {['all','sent','scheduled','draft'].map(f=>(
            <button key={f} className={`pn-filter ${filter===f?'pn-filter--active':''}`} onClick={()=>setFilter(f)}>
              {STATUS_META[f]?.label||'All'}
              <span className="pn-filter__count">{f==='all'?notifications.length:notifications.filter(n=>n.status===f).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="pn-tw">
        <table className="pn-tbl">
          <thead>
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Audience</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Opened</th>
              <th className="pn-th-r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>Loading campaigns…</td></tr>
            )}
            {!loading && displayed.length===0 && (
              <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>No campaigns match your filters.</td></tr>
            )}
            {!loading && displayed.map(n=>{
              const st      = STATUS_META[n.status]||STATUS_META.draft;
              const segInfo = SEGMENTS.find(s=>s.id===n.segment);
              return (
                <tr key={n.id}>
                  <td style={{fontWeight:700}}>{n.title}</td>
                  <td style={{color:'#64748b',maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.body}</td>
                  <td><span className="pn-seg">{segInfo?.label||n.segment}</span></td>
                  <td><span className="pn-badge" style={st}>{st.label}</span></td>
                  <td style={{color:'#64748b',fontSize:'.78rem'}}>{n.sent||n.scheduled||'—'}</td>
                  <td>{n.status==='sent'?(n.opened>0?fmtN(n.opened):'—'):'—'}</td>
                  <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                    {n.status==='draft' && (
                      <button className="pn-btn pn-btn--primary pn-btn--sm" onClick={()=>setSendModal(n)} style={{marginRight:4}}>
                        <Send size={11} color="#fff"/>Send
                      </button>
                    )}
                    {n.status==='scheduled' && (
                      <button className="pn-btn pn-btn--outline pn-btn--sm" onClick={()=>setSendModal(n)} style={{marginRight:4}}>
                        <Send size={11} color="#E03E1A"/>Send Now
                      </button>
                    )}
                    <button className="pn-ib pn-ib--edit" title="Edit" onClick={()=>openEdit(n)}><Edit2 size={12}/></button>
                    <button className="pn-ib pn-ib--del" title="Delete" onClick={()=>setDeleteModal(n)}><Trash2 size={12}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════ CAMPAIGN MODAL ═══════ */}
      {modal && (
        <div className="pn-overlay" onClick={()=>{setModal(false);setEditTarget(null);}}>
          <div className="pn-modal" onClick={e=>e.stopPropagation()}>
            <div className="pn-modal__hdr">
              <h3>{editTarget?'Edit Campaign':'New Push Campaign'}</h3>
              <button className="pn-modal__close" onClick={()=>{setModal(false);setEditTarget(null);}}><X size={16}/></button>
            </div>
            <div className="pn-modal__body">
              <div className="pn-phone-wrap">
                <div className="pn-phone">
                  <div className="pn-phone__status"><span>9:41</span><span>●●●</span></div>
                  <div className="pn-phone__notif">
                    <div className="pn-phone__app">
                      <span className="pn-phone__app-icon"><Bell size={10} color="#E03E1A"/></span>
                      EmpowerHome
                      <span className="pn-phone__app-time">now</span>
                    </div>
                    <div className="pn-phone__title">{form.title||'Notification title…'}</div>
                    <div className="pn-phone__body">{form.body||'Your message appears here…'}</div>
                  </div>
                  <div className="pn-phone__blur"/>
                </div>
              </div>

              <div className="pn-frow">
                <label>Title <span className="pn-char">{form.title.length}/65</span></label>
                <input className="pn-inp" maxLength={65} autoFocus value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Flash Sale Starts Now!"/>
              </div>

              <div className="pn-frow">
                <label>Message <span className="pn-char">{form.body.length}/150</span></label>
                <textarea className="pn-inp pn-textarea" rows={3} maxLength={150} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder="Keep it short and compelling…"/>
              </div>

              <div className="pn-frow">
                <label>Target Segment</label>
                <div className="pn-seg-grid">
                  {SEGMENTS.map(s=>{
                    const Icon = s.icon;
                    return (
                      <button key={s.id} type="button"
                        className={`pn-seg-opt ${form.segment===s.id?'pn-seg-opt--active':''}`}
                        onClick={()=>setForm(f=>({...f,segment:s.id}))}>
                        <Icon size={13}/>
                        <span>{s.label}</span>
                        <span className="pn-seg-opt__count">{s.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pn-frow">
                <label>Schedule (leave blank to send now)</label>
                <input className="pn-inp" type="datetime-local" value={form.scheduled} onChange={e=>setForm(f=>({...f,scheduled:e.target.value}))}/>
              </div>

              {seg && (
                <div className="pn-reach">
                  <Target size={13} color="#2563eb"/>
                  <span>Estimated reach: <strong>{seg.count}</strong> users in "{seg.label}"</span>
                </div>
              )}
            </div>

            <div className="pn-modal__ftr">
              <button className="pn-btn pn-btn--outline" onClick={()=>{setModal(false);setEditTarget(null);}}>Cancel</button>
              <button className="pn-btn pn-btn--outline" onClick={()=>save(false)}>
                {form.scheduled?<><Calendar size={13} color="#475569"/>Schedule</>:<>Save Draft</>}
              </button>
              <button className="pn-btn pn-btn--primary" disabled={!form.title.trim()} onClick={()=>save(!form.scheduled)}>
                <Send size={13} color="#fff"/> {form.scheduled?'Schedule':'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SEND CONFIRM MODAL ═══════ */}
      {sendModal && (
        <div className="pn-overlay" onClick={()=>setSendModal(null)}>
          <div className="pn-modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div className="pn-modal__hdr">
              <h3>Send Now</h3>
              <button className="pn-modal__close" onClick={()=>setSendModal(null)}><X size={16}/></button>
            </div>
            <div className="pn-modal__body">
              <div style={{background:'#dbeafe',border:'1px solid #bfdbfe',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#2563eb',fontWeight:600}}>
                ℹ This will immediately send to all <strong>{SEGMENTS.find(s=>s.id===sendModal.segment)?.count||''}</strong> users in the <strong>{SEGMENTS.find(s=>s.id===sendModal.segment)?.label||sendModal.segment}</strong> segment.
              </div>
              {[{l:'Title',v:sendModal.title},{l:'Segment',v:SEGMENTS.find(s=>s.id===sendModal.segment)?.label||sendModal.segment},{l:'Message',v:sendModal.body}].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'9px 0',borderBottom:i<2?'1px solid #f1f5f9':'none',gap:12}}>
                  <span style={{fontSize:'.74rem',color:'#94a3b8',fontWeight:600,flexShrink:0}}>{r.l}</span>
                  <span style={{fontSize:'.82rem',color:'#0f172a',fontWeight:700,textAlign:'right'}}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="pn-modal__ftr">
              <button className="pn-btn pn-btn--outline" onClick={()=>setSendModal(null)}>Cancel</button>
              <button className="pn-btn pn-btn--primary" onClick={()=>quickSend(sendModal)}>
                <Send size={13} color="#fff"/>Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DELETE CONFIRM MODAL ═══════ */}
      {deleteModal && (
        <div className="pn-overlay" onClick={()=>setDeleteModal(null)}>
          <div className="pn-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="pn-modal__hdr">
              <h3>Delete Campaign</h3>
              <button className="pn-modal__close" onClick={()=>setDeleteModal(null)}><X size={16}/></button>
            </div>
            <div className="pn-modal__body">
              <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#dc2626',fontWeight:600}}>
                ✕ Are you sure you want to delete <strong>"{deleteModal.title}"</strong>? This cannot be undone.
              </div>
            </div>
            <div className="pn-modal__ftr">
              <button className="pn-btn pn-btn--outline" onClick={()=>setDeleteModal(null)}>Cancel</button>
              <button className="pn-btn pn-btn--primary" style={{background:'#dc2626'}} onClick={confirmDelete}>
                <Trash2 size={13} color="#fff"/>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
