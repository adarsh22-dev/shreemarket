import React, { useState, useEffect, useCallback } from 'react';
import './CustomerTickets.css';
import { Icon, initials, avatarBg, fmtDate } from './VendorShared';
import { getTicketsByRole, createTicket, updateTicket, updateTicketStatus, deleteTicket } from '../../api/api';
import toast from 'react-hot-toast';

const PRIORITY_CFG = {
  urgent:{ bg:'#fee2e2',color:'#dc2626',dot:'#ef4444' },
  high:  { bg:'#fff7ed',color:'#ea580c',dot:'#f97316' },
  medium:{ bg:'#fef3c7',color:'#d97706',dot:'#f59e0b' },
  low:   { bg:'#f0fdf4',color:'#16a34a',dot:'#22c55e' },
};
const STATUS_CFG = {
  'open':        { bg:'#dbeafe',color:'#2563eb',dot:'#3b82f6' },
  'in-progress': { bg:'#fef3c7',color:'#d97706',dot:'#f59e0b' },
  'resolved':    { bg:'#dcfce7',color:'#16a34a',dot:'#22c55e' },
  'closed':      { bg:'#f1f5f9',color:'#64748b',dot:'#94a3b8' },
};
const ASSIGNEES  = ['Rahul S.','Neha K.','Priya M.','Dev Team','Amit R.','Sara T.'];
const CATEGORIES = ['Delivery','Product','Refund','Technical','Loyalty','Order','Return','Promo','Other'];
const TIERS      = ['bronze','silver','gold','platinum'];
const PER        = 6;
const today      = () => new Date().toISOString().slice(0,10);

const CSAT_STARS = (n) => Array.from({length:5},(_,i)=>(
  <span key={i} style={{color:i<n?'#f59e0b':'#e2e8f0',fontSize:'.9rem'}}>★</span>
));

/* ── Modal ── */
const Modal = ({ title, sub, onClose, children, footer, wide }) => (
  <div className="ct-overlay" onClick={onClose}>
    <div className={`ct-modal${wide?' ct-modal--wide':''}`} onClick={e=>e.stopPropagation()}>
      <div className="ct-modal__hdr">
        <div>
          <p className="ct-modal__title">{title}</p>
          {sub && <p className="ct-modal__sub">{sub}</p>}
        </div>
        <button className="ct-modal__close" onClick={onClose}><Icon name="X" size={14}/></button>
      </div>
      <div className="ct-modal__body">{children}</div>
      {footer && <div className="ct-modal__footer">{footer}</div>}
    </div>
  </div>
);

/* ── Form helpers ── */
const Field = ({ label, span2, children }) => (
  <div className={`ct-field${span2?' ct-field--span2':''}`}>
    <label className="ct-label">{label}</label>
    {children}
  </div>
);
const Inp  = (props) => <input    className="ct-inp"            {...props}/>;
const Txta = (props) => <textarea className="ct-inp ct-txta"   rows={3} {...props}/>;
const Sel  = ({ value, onChange, options }) => (
  <select className="ct-inp ct-sel" value={value} onChange={onChange}>
    {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>
);

/* ── Button ── */
const Btn = ({ children, onClick, variant='outline', size='md', disabled, style={} }) => {
  const base = { display:'inline-flex',alignItems:'center',gap:6,cursor:disabled?'not-allowed':'pointer',borderRadius:8,fontWeight:700,transition:'all .15s',whiteSpace:'nowrap',fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:disabled?.5:1,padding:size==='sm'?'5px 10px':'8px 14px',fontSize:size==='sm'?'.74rem':'.8rem' };
  const v = {
    outline: { border:'1px solid #e2e8f0',background:'#fff',color:'#475569' },
    primary: { border:'none',background:'#E03E1A',color:'#fff',boxShadow:'0 2px 8px rgba(224,62,26,.22)' },
    green:   { border:'1px solid #bbf7d0',background:'#dcfce7',color:'#16a34a' },
    danger:  { border:'1px solid #fecaca',background:'#fee2e2',color:'#dc2626' },
    amber:   { border:'1px solid #fde68a',background:'#fef3c7',color:'#d97706' },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>;
};

/* ── Badges ── */
const PriorityBdg = ({ p }) => { const c=PRIORITY_CFG[p]||PRIORITY_CFG.low; return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,background:c.bg,color:c.color,fontWeight:700,fontSize:'.7rem'}}><span style={{width:6,height:6,borderRadius:'50%',background:c.dot}}/>{p}</span>; };
const StatusBdg   = ({ s }) => { const c=STATUS_CFG[s]||STATUS_CFG.closed; return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,background:c.bg,color:c.color,fontWeight:700,fontSize:'.7rem'}}><span style={{width:6,height:6,borderRadius:'50%',background:c.dot}}/>{s}</span>; };

/* ── Interactive CSAT picker ── */
const CsatPicker = ({ value, onChange }) => (
  <div style={{display:'flex',gap:6,alignItems:'center'}}>
    {[1,2,3,4,5].map(n=>(
      <button key={n} onClick={()=>onChange(n)} style={{fontSize:'1.5rem',background:'none',border:'none',cursor:'pointer',color:value>=n?'#f59e0b':'#e2e8f0',transition:'color .1s',padding:0}}
        onMouseEnter={e=>e.target.style.color='#f59e0b'}
        onMouseLeave={e=>e.target.style.color=value>=n?'#f59e0b':'#e2e8f0'}>
        ★
      </button>
    ))}
    {value>0 && <span style={{fontSize:'.82rem',fontWeight:700,color:'#d97706',marginLeft:4}}>{value}/5</span>}
  </div>
);

export default function CustomerTickets() {
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('All');
  const [catF,       setCatF]       = useState('All');
  const [page,       setPage]       = useState(0);
  const [sel,        setSel]        = useState(null);

  /* Modals */
  const [viewModal,    setViewModal]    = useState(null);
  const [editModal,    setEditModal]    = useState(null);
  const [replyModal,   setReplyModal]   = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [csatModal,    setCsatModal]    = useState(null);
  const [newModal,     setNewModal]     = useState(false);

  /* Forms */
  const [editForm,    setEditForm]    = useState({});
  const [replyText,   setReplyText]   = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [csatValue,   setCsatValue]   = useState(0);
  const [newForm,     setNewForm]     = useState({ subject:'', customer:'', cId:'', email:'', tier:'silver', category:'Delivery', priority:'medium', assignee:'Rahul S.', orderId:'', notes:'' });

  const mapTicket = (t) => ({
    id: t.ticketNumber,
    _id: t.id,
    subject: t.subject,
    description: t.description || '',
    status: t.status,
    priority: t.priority,
    category: t.category,
    customer: t.createdBy,
    cId: t.createdById,
    email: t.createdByEmail,
    assignee: t.assignedTo,
    notes: t.notes || '',
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    msgs: 0,
    satisfaction: null,
    orderId: '',
    tier: 'silver',
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTicketsByRole('customer', { page: 0, size: 200 });
      const mapped = (res.content || []).map(mapTicket);
      setTickets(mapped);
    } catch (err) {
      toast.error('Failed to load customer tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const cats = ['All',...new Set(tickets.map(t=>t.category))];

  const filtered = tickets
    .filter(t => filter==='All' || t.status===filter || t.priority===filter || t.tier===filter)
    .filter(t => catF==='All' || t.category===catF)
    .filter(t => !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));

  const pages = Math.ceil(filtered.length/PER)||1;
  const slice = filtered.slice(page*PER,(page+1)*PER);

  const avgCsat = () => {
    const rated = tickets.filter(t=>t.satisfaction);
    if (!rated.length) return '—';
    return (rated.reduce((s,t)=>s+t.satisfaction,0)/rated.length).toFixed(1);
  };

  /* ── Resolve ── */
  const handleResolve = async (t) => {
    try {
      await updateTicketStatus(t._id, 'resolved');
      toast.success(`${t.id} marked as resolved`);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to resolve ticket');
    }
    setResolveModal(null); setSel(null);
  };

  /* ── Reply ── */
  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      if (replyStatus && replyStatus !== replyModal.status) {
        await updateTicketStatus(replyModal._id, replyStatus);
      }
      toast.success(`Reply sent on ${replyModal.id}`);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to send reply');
    }
    setReplyText(''); setReplyStatus(''); setReplyModal(null);
  };

  /* ── Edit ── */
  const openEdit = (e, t) => { e.stopPropagation(); setEditForm({...t}); setEditModal(t); };
  const handleEditSave = async () => {
    try {
      const payload = {
        subject: editForm.subject,
        description: editForm.description || editForm.subject,
        status: editForm.status,
        priority: editForm.priority,
        category: editForm.category,
        createdBy: editForm.customer,
        createdById: editForm.cId,
        createdByEmail: editForm.email,
        assignedTo: editForm.assignee,
        notes: editForm.notes || '',
      };
      await updateTicket(editModal._id, payload);
      toast.success(`${editModal.id} updated`);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to update ticket');
    }
    setEditModal(null);
  };

  /* ── CSAT ── */
  const openCsat = (e, t) => { e.stopPropagation(); setCsatModal(t); setCsatValue(t.satisfaction||0); };
  const handleCsatSave = () => {
    setTickets(prev=>prev.map(tk=>tk.id===csatModal.id?{...tk,satisfaction:csatValue}:tk));
    toast.success(`CSAT rating saved for ${csatModal.id}`);
    setCsatModal(null);
  };

  /* ── New Ticket ── */
  const handleNewTicket = async () => {
    if (!newForm.subject.trim()||!newForm.customer.trim()) return;
    try {
      const payload = {
        subject: newForm.subject,
        description: newForm.subject,
        category: newForm.category,
        priority: newForm.priority,
        createdBy: newForm.customer,
        createdById: newForm.cId,
        createdByEmail: newForm.email,
        assignedTo: newForm.assignee,
        notes: newForm.notes || '',
        role: 'customer',
      };
      await createTicket(payload);
      toast.success('Ticket created');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to create ticket');
    }
    setNewModal(false);
    setNewForm({ subject:'', customer:'', cId:'', email:'', tier:'silver', category:'Delivery', priority:'medium', assignee:'Rahul S.', orderId:'', notes:'' });
    setFilter('All'); setPage(0);
  };

  /* ── Export ── */
  const handleExport = () => {
    const rows = [
      ['ID','Subject','Customer','Customer ID','Email','Tier','Category','Priority','Status','Assignee','Order ID','Messages','CSAT','Created','Updated'],
      ...tickets.map(t=>[t.id,t.subject,t.customer,t.cId,t.email,t.tier,t.category,t.priority,t.status,t.assignee,t.orderId||'',t.msgs,t.satisfaction||'',t.createdAt,t.updatedAt])
    ];
    const csv  = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='customer_tickets.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="vm">
      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Customer Tickets</h2>
          <p className="vm-hdr__sub">Support requests from customers — deliveries, refunds, technical issues and more</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}><Icon name="Download" size={13} color="#475569"/>Export CSV</button>
          <button className="vm-btn vm-btn--primary" onClick={()=>setNewModal(true)}><Icon name="Plus" size={13} color="#fff"/>Raise Ticket</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Customer Tickets', value:tickets.length,                                                                                              icon:'Users',        c:'#2563eb',bg:'#dbeafe',trend:'All time'    },
          { label:'Open / Active',    value:tickets.filter(t=>t.status==='open'||t.status==='in-progress').length,                                       icon:'AlertTriangle',c:'#E03E1A',bg:'#ffe4de',trend:'Needs action'},
          { label:'Avg CSAT Score',   value:`${avgCsat()} / 5`,                                                                                          icon:'Star',         c:'#d97706',bg:'#fef3c7',trend:`${tickets.filter(t=>t.satisfaction).length} rated`},
          { label:'Resolution Rate',  value:`${Math.round(tickets.filter(t=>t.status==='resolved'||t.status==='closed').length/tickets.length*100)||0}%`, icon:'CheckCircle',  c:'#16a34a',bg:'#dcfce7',trend:'This month' },
        ].map((k,i)=>(
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background:k.bg}}><Icon name={k.icon} size={18} color={k.c} sw={2.1}/></div>
              <span className={`vm-kpi__trend vm-kpi__trend--${i===1?'dn':'up'}`}>{k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category + CSAT panels */}
      <div className="vm-2col">
        {/* Category breakdown — clickable */}
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:14}}>By Issue Category</p>
          <div className="vm-col vm-g10">
            {[...new Set(tickets.map(t=>t.category))].map(cat=>{
              const all  = tickets.filter(t=>t.category===cat);
              const open = all.filter(t=>t.status==='open'||t.status==='in-progress').length;
              return (
                <div key={cat} style={{cursor:'pointer'}} onClick={()=>{setCatF(catF===cat?'All':cat);setPage(0);}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:'.82rem',fontWeight:600,color:catF===cat?'#E03E1A':'#0f172a'}}>{cat}</span>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {open>0&&<span style={{fontSize:'.67rem',padding:'1px 6px',borderRadius:999,background:'#fef3c7',color:'#d97706',fontWeight:700}}>{open} open</span>}
                      <span style={{fontSize:'.75rem',fontWeight:700,color:'#E03E1A'}}>{all.length}</span>
                    </div>
                  </div>
                  <div style={{height:5,background:'#f1f5f9',borderRadius:999,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${(all.length/tickets.length)*100}%`,background:'#E03E1A',borderRadius:999}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CSAT breakdown */}
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>CSAT Ratings</p>
          <p className="vm-sh__sub" style={{marginBottom:14}}>Post-resolution customer satisfaction</p>
          <div className="vm-col vm-g10">
            {[5,4,3,2,1].map(star=>{
              const count = tickets.filter(t=>t.satisfaction===star).length;
              const total = tickets.filter(t=>t.satisfaction).length;
              return (
                <div key={star} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{display:'flex',gap:1,flexShrink:0}}>{CSAT_STARS(star)}</span>
                  <div style={{flex:1,height:6,background:'#f1f5f9',borderRadius:999,overflow:'hidden'}}>
                    <div style={{height:'100%',width:total?`${(count/total)*100}%`:'0%',background:star>=4?'#16a34a':star===3?'#d97706':'#dc2626',borderRadius:999}}/>
                  </div>
                  <span style={{fontSize:'.75rem',fontWeight:700,color:'#475569',flexShrink:0,minWidth:14,textAlign:'right'}}>{count}</span>
                </div>
              );
            })}
            <div style={{marginTop:4,padding:'10px',background:'#f8fafc',borderRadius:8,textAlign:'center'}}>
              <div style={{fontSize:'1.5rem',fontWeight:800,color:'#0f172a',lineHeight:1}}>{avgCsat()}</div>
              <div style={{fontSize:'.7rem',color:'#94a3b8',marginTop:2}}>Average CSAT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Customer Ticket Queue</p>
            <p className="vm-sh__sub">{filtered.length} tickets · Click row to expand</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-pills">
              {cats.map(c=>(
                <button key={c} className={`vm-pill${catF===c?' vm-pill--active':''}`} onClick={()=>{setCatF(c);setPage(0);}}>{c}</button>
              ))}
            </div>
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search customer or ticket…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
            </div>
            <div className="vm-pills">
              {['All','open','in-progress','resolved','closed','urgent','high','platinum','gold'].map(f=>(
                <button key={f} className={`vm-pill${filter===f?' vm-pill--active':''}`} onClick={()=>{setFilter(f);setPage(0);}}>
                  {f==='All'?'All':f[0].toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Customer</th>
                <th>Tier</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>CSAT</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>Loading tickets…</td></tr>
              ) : slice.length===0 && (
                <tr><td colSpan={11} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>No tickets match your filters.</td></tr>
              )}
              {!loading && slice.map(t=>{
                const prCfg = PRIORITY_CFG[t.priority];
                const stCfg = STATUS_CFG[t.status];
                return (
                  <React.Fragment key={t.id}>
                    <tr style={{cursor:'pointer',background:sel===t.id?'#fff8f6':undefined}}
                      onClick={()=>setSel(sel===t.id?null:t.id)}>

                      <td><span style={{fontFamily:'monospace',fontSize:'.78rem',fontWeight:700,color:'#E03E1A'}}>{t.id}</span></td>

                      <td style={{maxWidth:200}}>
                        <div style={{fontSize:'.83rem',fontWeight:600,color:'#0f172a',lineHeight:1.4}}>{t.subject}</div>
                        {t.orderId&&<div style={{fontSize:'.7rem',color:'#94a3b8'}}>{t.orderId}</div>}
                      </td>

                      <td>
                        <div className="vm-vcell">
                          <div className="vm-av vm-av--sm" style={{background:avatarBg(t.customer)}}>{initials(t.customer)}</div>
                          <div>
                            <div className="vm-vcell__name">{t.customer}</div>
                            <div className="vm-vcell__id">{t.cId}</div>
                          </div>
                        </div>
                      </td>

                      <td><span className={`vm-badge vm-badge--${t.tier}`} style={{fontSize:'.63rem',padding:'2px 7px'}}><span className="vm-badge__dot"/>{t.tier[0].toUpperCase()+t.tier.slice(1)}</span></td>
                      <td><span style={{fontSize:'.78rem',color:'#475569'}}>{t.category}</span></td>
                      <td><PriorityBdg p={t.priority}/></td>
                      <td><StatusBdg s={t.status}/></td>
                      <td><span style={{fontSize:'.8rem',color:'#475569',fontWeight:600}}>{t.assignee}</span></td>

                      <td onClick={e=>e.stopPropagation()}>
                        {t.satisfaction
                          ? <button style={{display:'flex',gap:1,background:'none',border:'none',cursor:'pointer',padding:0}} onClick={e=>openCsat(e,t)} title="Edit CSAT">{CSAT_STARS(t.satisfaction)}</button>
                          : (t.status==='resolved'||t.status==='closed')
                            ? <button style={{fontSize:'.72rem',color:'#d97706',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:6,padding:'2px 8px',cursor:'pointer',fontWeight:600,fontFamily:'inherit'}} onClick={e=>openCsat(e,t)}>Rate</button>
                            : <span style={{fontSize:'.72rem',color:'#e2e8f0'}}>—</span>}
                      </td>

                      <td><span style={{fontSize:'.75rem',color:'#94a3b8'}}>{fmtDate?fmtDate(t.updatedAt):t.updatedAt}</span></td>

                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:4}}>
                          <button className="vm-btn vm-btn--primary vm-btn--sm" onClick={e=>{e.stopPropagation();setViewModal(t);}}>
                            <Icon name="Eye" size={11} color="#fff"/>Open
                          </button>
                          <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={e=>openEdit(e,t)}>
                            <Icon name="Edit2" size={11} color="#2563eb"/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {sel===t.id && (
                      <tr>
                        <td colSpan={11} style={{padding:0}}>
                          <div className="ct-expand-inner">
                            <div style={{fontSize:'.9rem',fontWeight:800,color:'#0f172a',marginBottom:10}}>{t.subject}</div>

                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:12}}>
                              {[
                                {label:'Ticket ID',  value:t.id},
                                {label:'Customer',   value:t.customer},
                                {label:'Email',      value:t.email},
                                {label:'Tier',       value:t.tier[0].toUpperCase()+t.tier.slice(1)},
                                {label:'Category',   value:t.category},
                                {label:'Assignee',   value:t.assignee},
                                ...(t.orderId?[{label:'Order ID',value:t.orderId}]:[]),
                                {label:'Messages',   value:`${t.msgs} messages`},
                              ].map((item,i)=>(
                                <div key={i} style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:8,padding:'9px 12px'}}>
                                  <div style={{fontSize:'.63rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.4px'}}>{item.label}</div>
                                  <div style={{fontSize:'.83rem',fontWeight:700,color:'#0f172a',marginTop:2}}>{item.value}</div>
                                </div>
                              ))}
                            </div>

                            {t.notes && (
                              <div style={{padding:'10px 12px',background:'#fff',borderRadius:8,border:'1px solid #f1f5f9',fontSize:'.82rem',color:'#475569',marginBottom:12}}>
                                <span style={{fontWeight:700,color:'#0f172a'}}>Notes: </span>{t.notes}
                              </div>
                            )}

                            {t.satisfaction && (
                              <div style={{padding:'10px 12px',background:'#fef9c3',borderRadius:8,border:'1px solid #fde68a',marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
                                <span style={{fontSize:'.78rem',fontWeight:700,color:'#92400e'}}>Customer rated:</span>
                                <span style={{display:'flex',gap:2}}>{CSAT_STARS(t.satisfaction)}</span>
                                <span style={{fontSize:'.78rem',fontWeight:800,color:'#d97706'}}>{t.satisfaction}/5</span>
                              </div>
                            )}

                            <div style={{display:'flex',gap:8,justifyContent:'flex-end',flexWrap:'wrap'}}>
                              <Btn size="sm" variant="primary" onClick={()=>{setReplyModal(t);setReplyText('');setReplyStatus(t.status);}}>
                                <Icon name="Send" size={12} color="#fff"/>Reply
                              </Btn>
                              {(t.status==='open'||t.status==='in-progress') && (
                                <Btn size="sm" variant="green" onClick={()=>setResolveModal(t)}>
                                  <Icon name="CheckCircle" size={12} color="#16a34a"/>Resolve
                                </Btn>
                              )}
                              {(t.status==='resolved'||t.status==='closed') && (
                                <Btn size="sm" variant="amber" onClick={e=>openCsat(e,t)}>
                                  <Icon name="Star" size={12} color="#d97706"/>CSAT
                                </Btn>
                              )}
                              <Btn size="sm" onClick={e=>openEdit(e,t)}>
                                <Icon name="Edit2" size={12} color="#475569"/>Edit
                              </Btn>
                              <Btn size="sm" onClick={()=>setSel(null)}>
                                <Icon name="X" size={12} color="#475569"/>Close
                              </Btn>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{page*PER+1}–{Math.min((page+1)*PER,filtered.length)} of {filtered.length}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={()=>setPage(p=>p-1)} disabled={page===0}><Icon name="ChevLeft" size={12}/></button>
            <span className="vm-pag__label">{page+1} / {pages}</span>
            <button className="vm-pag__btn" onClick={()=>setPage(p=>p+1)} disabled={(page+1)*PER>=filtered.length}><Icon name="ChevRight" size={12}/></button>
          </div>
        </div>
      </div>

      {/* ══ VIEW MODAL ══ */}
      {viewModal && (
        <Modal title={viewModal.id} sub={viewModal.subject} onClose={()=>setViewModal(null)} wide
          footer={<>
            <Btn onClick={()=>setViewModal(null)} style={{flex:1,justifyContent:'center'}}>Close</Btn>
            <Btn variant="primary" onClick={()=>{setReplyModal(viewModal);setReplyText('');setReplyStatus(viewModal.status);setViewModal(null);}} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Send" size={13} color="#fff"/>Reply
            </Btn>
            {(viewModal.status==='open'||viewModal.status==='in-progress') && (
              <Btn variant="green" onClick={()=>{setResolveModal(viewModal);setViewModal(null);}} style={{flex:1,justifyContent:'center'}}>
                <Icon name="CheckCircle" size={13} color="#16a34a"/>Resolve
              </Btn>
            )}
          </>}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:4}}>
            <PriorityBdg p={viewModal.priority}/>
            <StatusBdg s={viewModal.status}/>
            <span className={`vm-badge vm-badge--${viewModal.tier}`} style={{fontSize:'.67rem',padding:'2px 8px'}}>
              <span className="vm-badge__dot"/>{viewModal.tier[0].toUpperCase()+viewModal.tier.slice(1)}
            </span>
          </div>
          {[
            {l:'Customer',   v:viewModal.customer},
            {l:'Email',      v:viewModal.email},
            {l:'Category',   v:viewModal.category},
            {l:'Assignee',   v:viewModal.assignee},
            {l:'Order ID',   v:viewModal.orderId||'—'},
            {l:'Messages',   v:`${viewModal.msgs} messages`},
            {l:'Created',    v:viewModal.createdAt},
            {l:'Last Update',v:viewModal.updatedAt},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<7?'1px solid #f1f5f9':'none'}}>
              <span style={{fontSize:'.74rem',color:'#94a3b8',fontWeight:600}}>{r.l}</span>
              <span style={{fontSize:'.82rem',color:'#0f172a',fontWeight:700,textAlign:'right'}}>{r.v}</span>
            </div>
          ))}
          {viewModal.satisfaction && (
            <div style={{background:'#fef9c3',border:'1px solid #fde68a',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,marginTop:4}}>
              <span style={{fontSize:'.78rem',fontWeight:700,color:'#92400e'}}>CSAT:</span>
              <span style={{display:'flex',gap:2}}>{CSAT_STARS(viewModal.satisfaction)}</span>
              <span style={{fontSize:'.78rem',fontWeight:800,color:'#d97706'}}>{viewModal.satisfaction}/5</span>
            </div>
          )}
          {viewModal.notes && (
            <div style={{background:'#f8fafc',border:'1px solid #e8ecf0',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#475569'}}>
              <span style={{fontWeight:700,color:'#0f172a'}}>Notes: </span>{viewModal.notes}
            </div>
          )}
        </Modal>
      )}

      {/* ══ REPLY MODAL ══ */}
      {replyModal && (
        <Modal title="Reply to Customer" sub={`${replyModal.id} · ${replyModal.customer}`} onClose={()=>{setReplyModal(null);setReplyText('');}}
          footer={<>
            <Btn onClick={()=>{setReplyModal(null);setReplyText('');}} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleReply} disabled={!replyText.trim()} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Send" size={13} color="#fff"/>Send Reply
            </Btn>
          </>}>
          <div style={{background:'#f8fafc',border:'1px solid #e8ecf0',borderRadius:10,padding:'12px 14px',marginBottom:4}}>
            <div style={{fontSize:'.68rem',color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:3}}>Subject</div>
            <div style={{fontSize:'.85rem',fontWeight:700,color:'#0f172a'}}>{replyModal.subject}</div>
          </div>
          <Field label="Your Reply">
            <Txta placeholder="Type your reply to the customer…" value={replyText} onChange={e=>setReplyText(e.target.value)} autoFocus rows={5}/>
          </Field>
          <Field label="Update Status (optional)">
            <Sel value={replyStatus} onChange={e=>setReplyStatus(e.target.value)} options={['open','in-progress','resolved','closed']}/>
          </Field>
        </Modal>
      )}

      {/* ══ RESOLVE MODAL ══ */}
      {resolveModal && (
        <Modal title="Resolve Ticket" sub={`${resolveModal.id} · ${resolveModal.customer}`} onClose={()=>setResolveModal(null)}
          footer={<>
            <Btn onClick={()=>setResolveModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="green" onClick={()=>handleResolve(resolveModal)} style={{flex:1,justifyContent:'center'}}>
              <Icon name="CheckCircle" size={13} color="#16a34a"/>Mark as Resolved
            </Btn>
          </>}>
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#16a34a',fontWeight:600}}>
            ✓ This will mark <strong>{resolveModal.id}</strong> as <strong>Resolved</strong> and set today as the updated date.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{l:'Customer',v:resolveModal.customer},{l:'Category',v:resolveModal.category},{l:'Assignee',v:resolveModal.assignee},{l:'Priority',v:resolveModal.priority}].map((r,i)=>(
              <div key={i} style={{background:'#f8fafc',borderRadius:8,padding:'8px 12px',border:'1px solid #e8ecf0'}}>
                <div style={{fontSize:'.67rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.3px'}}>{r.l}</div>
                <div style={{fontSize:'.8rem',fontWeight:600,color:'#0f172a',marginTop:2}}>{r.v}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ══ CSAT MODAL ══ */}
      {csatModal && (
        <Modal title="Rate Customer Satisfaction" sub={`${csatModal.id} · ${csatModal.customer}`} onClose={()=>setCsatModal(null)}
          footer={<>
            <Btn onClick={()=>setCsatModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="amber" onClick={handleCsatSave} disabled={csatValue===0} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Star" size={13} color="#d97706"/>Save Rating
            </Btn>
          </>}>
          <div style={{background:'#fef9c3',border:'1px solid #fde68a',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#92400e',fontWeight:600,marginBottom:4}}>
            Rate how well this ticket was resolved from the customer's perspective.
          </div>
          <Field label="CSAT Score (click to rate)">
            <div style={{padding:'14px',background:'#f8fafc',borderRadius:10,border:'1px solid #e8ecf0'}}>
              <CsatPicker value={csatValue} onChange={setCsatValue}/>
              {csatValue > 0 && (
                <div style={{marginTop:10,fontSize:'.78rem',color:'#475569'}}>
                  {['','😞 Very dissatisfied','😕 Dissatisfied','😐 Neutral','😊 Satisfied','😄 Very satisfied'][csatValue]}
                </div>
              )}
            </div>
          </Field>
          {csatModal.satisfaction && (
            <div style={{fontSize:'.78rem',color:'#94a3b8'}}>Current rating: {csatModal.satisfaction}/5</div>
          )}
        </Modal>
      )}

      {/* ══ EDIT MODAL ══ */}
      {editModal && (
        <Modal title="Edit Customer Ticket" sub={editModal.id} onClose={()=>setEditModal(null)} wide
          footer={<>
            <Btn onClick={()=>setEditModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleEditSave} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Check" size={13} color="#fff"/>Save Changes
            </Btn>
          </>}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Subject" span2><Inp value={editForm.subject} onChange={e=>setEditForm(f=>({...f,subject:e.target.value}))}/></Field>
            <Field label="Customer Name"><Inp value={editForm.customer} onChange={e=>setEditForm(f=>({...f,customer:e.target.value}))}/></Field>
            <Field label="Customer ID"><Inp value={editForm.cId} onChange={e=>setEditForm(f=>({...f,cId:e.target.value}))}/></Field>
            <Field label="Email" span2><Inp type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/></Field>
            <Field label="Order ID"><Inp value={editForm.orderId||''} onChange={e=>setEditForm(f=>({...f,orderId:e.target.value||null}))}/></Field>
            <Field label="Tier"><Sel value={editForm.tier} onChange={e=>setEditForm(f=>({...f,tier:e.target.value}))} options={TIERS}/></Field>
            <Field label="Category"><Sel value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))} options={CATEGORIES}/></Field>
            <Field label="Priority"><Sel value={editForm.priority} onChange={e=>setEditForm(f=>({...f,priority:e.target.value}))} options={['low','medium','high','urgent']}/></Field>
            <Field label="Status"><Sel value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} options={['open','in-progress','resolved','closed']}/></Field>
            <Field label="Assignee"><Sel value={editForm.assignee} onChange={e=>setEditForm(f=>({...f,assignee:e.target.value}))} options={ASSIGNEES}/></Field>
            <Field label="Internal Notes" span2><Txta value={editForm.notes||''} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} placeholder="Internal notes…"/></Field>
          </div>
        </Modal>
      )}

      {/* ══ NEW TICKET MODAL ══ */}
      {newModal && (
        <Modal title="Raise Customer Ticket" sub="Fill in customer and issue details" onClose={()=>setNewModal(false)} wide
          footer={<>
            <Btn onClick={()=>setNewModal(false)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleNewTicket} disabled={!newForm.subject.trim()||!newForm.customer.trim()} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Plus" size={13} color="#fff"/>Raise Ticket
            </Btn>
          </>}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Subject" span2><Inp autoFocus placeholder="Describe the customer's issue…" value={newForm.subject} onChange={e=>setNewForm(f=>({...f,subject:e.target.value}))}/></Field>
            <Field label="Customer Name"><Inp placeholder="e.g. Arjun Nair" value={newForm.customer} onChange={e=>setNewForm(f=>({...f,customer:e.target.value}))}/></Field>
            <Field label="Customer ID"><Inp placeholder="C-XXXX" value={newForm.cId} onChange={e=>setNewForm(f=>({...f,cId:e.target.value}))}/></Field>
            <Field label="Email" span2><Inp type="email" placeholder="customer@email.com" value={newForm.email} onChange={e=>setNewForm(f=>({...f,email:e.target.value}))}/></Field>
            <Field label="Order ID"><Inp placeholder="ORD-XXXXX (optional)" value={newForm.orderId} onChange={e=>setNewForm(f=>({...f,orderId:e.target.value}))}/></Field>
            <Field label="Tier"><Sel value={newForm.tier} onChange={e=>setNewForm(f=>({...f,tier:e.target.value}))} options={TIERS}/></Field>
            <Field label="Category"><Sel value={newForm.category} onChange={e=>setNewForm(f=>({...f,category:e.target.value}))} options={CATEGORIES}/></Field>
            <Field label="Priority"><Sel value={newForm.priority} onChange={e=>setNewForm(f=>({...f,priority:e.target.value}))} options={['low','medium','high','urgent']}/></Field>
            <Field label="Assignee"><Sel value={newForm.assignee} onChange={e=>setNewForm(f=>({...f,assignee:e.target.value}))} options={ASSIGNEES}/></Field>
            <Field label="Notes" span2><Txta placeholder="Optional internal notes…" value={newForm.notes} onChange={e=>setNewForm(f=>({...f,notes:e.target.value}))}/></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
