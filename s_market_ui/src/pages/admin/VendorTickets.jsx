import React, { useState, useEffect, useCallback } from 'react';
import './VendorTickets.css';
import { Icon, initials, avatarBg, fmt, fmtDate } from './VendorShared';
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
const ASSIGNEES   = ['Priya M.','Dev Team','Rahul S.','Neha K.','Amit R.','Sara T.'];
const CATEGORIES  = ['Finance','Technical','Listing','Policy','Shipping','Returns','Other'];
const TIERS       = ['bronze','silver','gold','platinum'];
const PER         = 5;
const today       = () => new Date().toISOString().slice(0,10);

const mapTicket = (t) => ({
  id: t.id,
  ticketNumber: t.ticketNumber,
  subject: t.subject,
  description: t.description,
  status: t.status,
  priority: t.priority,
  category: t.category,
  vendor: t.createdBy || '',
  vendorId: t.createdById != null ? String(t.createdById) : '',
  city: '',
  tier: 'bronze',
  assignee: t.assignedTo || 'Unassigned',
  gmv: 0,
  msgs: 0,
  notes: t.notes || '',
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  createdByEmail: t.createdByEmail || '',
  assignedToEmail: t.assignedToEmail || '',
});

const Modal = ({ title, sub, onClose, children, footer, wide }) => (
  <div className="vt-overlay" onClick={onClose}>
    <div className={`vt-modal${wide?' vt-modal--wide':''}`} onClick={e=>e.stopPropagation()}>
      <div className="vt-modal__hdr">
        <div>
          <p className="vt-modal__title">{title}</p>
          {sub && <p className="vt-modal__sub">{sub}</p>}
        </div>
        <button className="vt-modal__close" onClick={onClose}><Icon name="X" size={14}/></button>
      </div>
      <div className="vt-modal__body">{children}</div>
      {footer && <div className="vt-modal__footer">{footer}</div>}
    </div>
  </div>
);

const Field = ({ label, span2, children }) => (
  <div className={`vt-field${span2?' vt-field--span2':''}`}>
    <label className="vt-label">{label}</label>
    {children}
  </div>
);
const Inp  = (props) => <input  className="vt-inp"            {...props}/>;
const Txta = (props) => <textarea className="vt-inp vt-txta" rows={3} {...props}/>;
const Sel  = ({ value, onChange, options }) => (
  <select className="vt-inp vt-sel" value={value} onChange={onChange}>
    {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>
);

const Btn = ({ children, onClick, variant='outline', size='md', disabled, style={} }) => {
  const base = { display:'inline-flex',alignItems:'center',gap:6,cursor:disabled?'not-allowed':'pointer',borderRadius:8,fontWeight:700,transition:'all .15s',whiteSpace:'nowrap',fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:disabled?.5:1,padding:size==='sm'?'5px 10px':'8px 14px',fontSize:size==='sm'?'.74rem':'.8rem' };
  const v = {
    outline: { border:'1px solid #e2e8f0',background:'#fff',color:'#475569' },
    primary: { border:'none',background:'#E03E1A',color:'#fff',boxShadow:'0 2px 8px rgba(224,62,26,.22)' },
    green:   { border:'1px solid #bbf7d0',background:'#dcfce7',color:'#16a34a' },
    danger:  { border:'1px solid #fecaca',background:'#fee2e2',color:'#dc2626' },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>;
};

const PriorityBdg = ({ p }) => { const c=PRIORITY_CFG[p]||PRIORITY_CFG.low; return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,background:c.bg,color:c.color,fontWeight:700,fontSize:'.7rem'}}><span style={{width:6,height:6,borderRadius:'50%',background:c.dot}}/>{p}</span>; };
const StatusBdg   = ({ s }) => { const c=STATUS_CFG[s]||STATUS_CFG.closed; return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,background:c.bg,color:c.color,fontWeight:700,fontSize:'.7rem'}}><span style={{width:6,height:6,borderRadius:'50%',background:c.dot}}/>{s}</span>; };

export default function VendorTickets() {
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('All');
  const [catF,       setCatF]       = useState('All');
  const [page,       setPage]       = useState(0);
  const [sel,        setSel]        = useState(null);

  const [viewModal,    setViewModal]    = useState(null);
  const [editModal,    setEditModal]    = useState(null);
  const [replyModal,   setReplyModal]   = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [newModal,     setNewModal]     = useState(false);

  const [editForm,  setEditForm]  = useState({});
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [newForm,   setNewForm]   = useState({ subject:'', vendor:'', vendorId:'', city:'', tier:'silver', category:'Finance', priority:'medium', assignee:'Priya M.', gmv:0, notes:'' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTicketsByRole('vendor', { page, size: 20 });
      setTickets((data.content || []).map(mapTicket));
    } catch (e) {
      toast.error(e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const cats = ['All',...new Set(tickets.map(t=>t.category))];

  const filtered = tickets
    .filter(t => filter==='All' || t.status===filter || t.priority===filter || t.tier===filter)
    .filter(t => catF==='All' || t.category===catF)
    .filter(t => !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.vendor.toLowerCase().includes(search.toLowerCase()) || String(t.id).toLowerCase().includes(search.toLowerCase()));

  const pages = Math.ceil(filtered.length/PER)||1;
  const slice = filtered.slice(page*PER,(page+1)*PER);

  const handleResolve = async (t) => {
    try {
      await updateTicketStatus(t.id, 'resolved');
      toast.success(`${t.id} marked as resolved`);
      fetchTickets();
    } catch (e) {
      toast.error(e.message || 'Failed to resolve ticket');
    }
    setResolveModal(null); setSel(null);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await updateTicket(replyModal.id, { notes: replyText, status: replyStatus || undefined });
      toast.success(`Reply sent on ${replyModal.id}`);
      fetchTickets();
    } catch (e) {
      toast.error(e.message || 'Failed to send reply');
    }
    setReplyText(''); setReplyStatus(''); setReplyModal(null);
  };

  const openEdit = (e, t) => { e.stopPropagation(); setEditForm({...t}); setEditModal(t); };
  const handleEditSave = async () => {
    try {
      await updateTicket(editModal.id, {
        subject: editForm.subject, priority: editForm.priority,
        status: editForm.status, category: editForm.category,
        notes: editForm.notes || '',
      });
      toast.success(`${editModal.id} updated`);
      fetchTickets();
    } catch (e) {
      toast.error(e.message || 'Failed to update ticket');
    }
    setEditModal(null);
  };

  const handleNewTicket = async () => {
    if (!newForm.subject.trim()||!newForm.vendor.trim()) return;
    try {
      await createTicket({
        subject: newForm.subject, category: newForm.category,
        priority: newForm.priority, createdBy: newForm.vendor,
        createdById: newForm.vendorId || undefined,
        notes: newForm.notes || undefined,
      });
      toast.success('Ticket created');
      fetchTickets();
    } catch (e) {
      toast.error(e.message || 'Failed to create ticket');
    }
    setNewModal(false);
    setNewForm({ subject:'', vendor:'', vendorId:'', city:'', tier:'silver', category:'Finance', priority:'medium', assignee:'Priya M.', gmv:0, notes:'' });
    setFilter('All'); setPage(0);
  };

  const handleExport = () => {
    const rows = [
      ['ID','Subject','Vendor','Vendor ID','City','Tier','Category','Priority','Status','Assignee','GMV','Messages','Created','Updated'],
      ...tickets.map(t=>[t.id,t.subject,t.vendor,t.vendorId,t.city,t.tier,t.category,t.priority,t.status,t.assignee,t.gmv,t.msgs,t.createdAt,t.updatedAt])
    ];
    const csv  = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='vendor_tickets.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="vm">

      {loading && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(255,255,255,.7)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{padding:'20px 32px',background:'#fff',borderRadius:12,boxShadow:'0 4px 24px rgba(0,0,0,.12)',fontSize:'.9rem',fontWeight:600,color:'#E03E1A'}}>Loading tickets…</div>
        </div>
      )}

      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Vendor Tickets</h2>
          <p className="vm-hdr__sub">Support requests raised by vendors — payments, technical, listings and more</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}><Icon name="Download" size={13} color="#475569"/>Export CSV</button>
          <button className="vm-btn vm-btn--primary" onClick={()=>setNewModal(true)}><Icon name="Plus" size={13} color="#fff"/>Create Ticket</button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          { label:'Total Vendor Tickets', value:tickets.length,                                                                    icon:'Building',    c:'#2563eb',bg:'#dbeafe',trend:'All vendors'       },
          { label:'Urgent / High',        value:tickets.filter(t=>t.priority==='urgent'||t.priority==='high').length,              icon:'Zap',         c:'#dc2626',bg:'#fee2e2',trend:'Immediate action'  },
          { label:'In Progress',          value:tickets.filter(t=>t.status==='in-progress').length,                                icon:'Activity',    c:'#d97706',bg:'#fef3c7',trend:'Being handled'     },
          { label:'Resolved / Closed',    value:tickets.filter(t=>t.status==='resolved'||t.status==='closed').length,             icon:'CheckCircle', c:'#16a34a',bg:'#dcfce7',trend:'Completed'         },
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

      <div className="vm-2col">
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:14}}>By Category</p>
          <div className="vm-col vm-g10">
            {[...new Set(tickets.map(t=>t.category))].map(cat=>{
              const all  = tickets.filter(t=>t.category===cat);
              const open = all.filter(t=>t.status==='open'||t.status==='in-progress').length;
              return (
                <div key={cat} style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}
                  onClick={()=>{setCatF(catF===cat?'All':cat);setPage(0);}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:'.82rem',fontWeight:600,color:catF===cat?'#E03E1A':'#0f172a'}}>{cat}</span>
                      <span style={{fontSize:'.75rem',fontWeight:700,color:'#E03E1A'}}>{all.length} tickets</span>
                    </div>
                    <div style={{height:5,background:'#f1f5f9',borderRadius:999,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${(all.length/tickets.length)*100}%`,background:'#E03E1A',borderRadius:999}}/>
                    </div>
                  </div>
                  {open>0 && <span style={{marginLeft:10,fontSize:'.68rem',padding:'1px 7px',borderRadius:999,background:'#fef3c7',color:'#d97706',fontWeight:700,whiteSpace:'nowrap'}}>{open} open</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Urgent / High Priority</p>
          <p className="vm-sh__sub" style={{marginBottom:14}}>Requires immediate attention</p>
          <div className="vm-col vm-g10">
            {tickets.filter(t=>t.priority==='urgent'||t.priority==='high').map((t,i)=>{
              const cfg = PRIORITY_CFG[t.priority];
              return (
                <div key={i} style={{padding:'10px 12px',borderRadius:10,border:`1px solid ${cfg.bg}`,background:cfg.bg+'88',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,cursor:'pointer'}}
                  onClick={()=>setViewModal(t)}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'.8rem',fontWeight:700,color:'#0f172a',marginBottom:3,lineHeight:1.3}}>{t.subject}</div>
                    <div style={{fontSize:'.72rem',color:'#64748b'}}>{t.vendor} · {t.id}</div>
                  </div>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,background:cfg.bg,color:cfg.color,fontWeight:700,fontSize:'.68rem',flexShrink:0,border:`1px solid ${cfg.color}33`}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:cfg.dot}}/>{t.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Vendor Ticket Queue</p>
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
              <input className="vm-search__input" placeholder="Search vendor or ticket…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
            </div>
            <div className="vm-pills">
              {['All','open','in-progress','resolved','closed','urgent','high'].map(f=>(
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
                <th>Vendor</th>
                <th>Tier</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length===0 && !loading && <tr><td colSpan={10} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>No tickets match your filters.</td></tr>}
              {slice.map(t=>{
                const prCfg = PRIORITY_CFG[t.priority];
                const stCfg = STATUS_CFG[t.status];
                return (
                  <React.Fragment key={t.id}>
                    <tr style={{cursor:'pointer',background:sel===t.id?'#fff8f6':undefined}}
                      onClick={()=>setSel(sel===t.id?null:t.id)}>

                      <td><span style={{fontFamily:'monospace',fontSize:'.78rem',fontWeight:700,color:'#E03E1A'}}>{t.id}</span></td>

                      <td style={{maxWidth:200}}>
                        <div style={{fontSize:'.83rem',fontWeight:600,color:'#0f172a',lineHeight:1.4}}>{t.subject}</div>
                      </td>

                      <td>
                        <div className="vm-vcell">
                          <div className="vm-av vm-av--sm" style={{background:avatarBg(t.vendor)}}>{initials(t.vendor)}</div>
                          <div>
                            <div className="vm-vcell__name">{t.vendor}</div>
                            <div className="vm-vcell__id">{t.vendorId} · {t.city}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`vm-badge vm-badge--${t.tier}`} style={{fontSize:'.63rem',padding:'2px 7px'}}>
                          <span className="vm-badge__dot"/>{t.tier[0].toUpperCase()+t.tier.slice(1)}
                        </span>
                      </td>

                      <td><span style={{fontSize:'.78rem',color:'#475569'}}>{t.category}</span></td>
                      <td><PriorityBdg p={t.priority}/></td>
                      <td><StatusBdg s={t.status}/></td>
                      <td><span style={{fontSize:'.8rem',color:'#475569',fontWeight:600}}>{t.assignee}</span></td>
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

                    {sel===t.id && (
                      <tr>
                        <td colSpan={10} style={{padding:0}}>
                          <div className="vt-expand-inner">
                            <div style={{fontSize:'.9rem',fontWeight:800,color:'#0f172a',marginBottom:10}}>{t.subject}</div>

                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:12}}>
                              {[
                                {label:'Ticket ID',   value:t.id},
                                {label:'Vendor',      value:t.vendor},
                                {label:'Vendor GMV',  value:fmt(t.gmv)},
                                {label:'Category',    value:t.category},
                                {label:'Assignee',    value:t.assignee},
                                {label:'Last Update', value:fmtDate?fmtDate(t.updatedAt):t.updatedAt},
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

                            <div style={{display:'flex',gap:8,justifyContent:'flex-end',flexWrap:'wrap'}}>
                              <Btn size="sm" variant="primary" onClick={()=>{setReplyModal(t);setReplyText('');setReplyStatus(t.status);}}>
                                <Icon name="Send" size={12} color="#fff"/>Reply
                              </Btn>
                              {(t.status==='open'||t.status==='in-progress') && (
                                <Btn size="sm" variant="green" onClick={()=>setResolveModal(t)}>
                                  <Icon name="CheckCircle" size={12} color="#16a34a"/>Resolve
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
            {l:'Vendor',      v:viewModal.vendor},
            {l:'Vendor ID',   v:viewModal.vendorId},
            {l:'City',        v:viewModal.city},
            {l:'Vendor GMV',  v:fmt(viewModal.gmv)},
            {l:'Category',    v:viewModal.category},
            {l:'Assignee',    v:viewModal.assignee},
            {l:'Messages',    v:`${viewModal.msgs} messages`},
            {l:'Created',     v:viewModal.createdAt},
            {l:'Last Update', v:viewModal.updatedAt},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<8?'1px solid #f1f5f9':'none'}}>
              <span style={{fontSize:'.74rem',color:'#94a3b8',fontWeight:600}}>{r.l}</span>
              <span style={{fontSize:'.82rem',color:'#0f172a',fontWeight:700,textAlign:'right'}}>{r.v}</span>
            </div>
          ))}
          {viewModal.notes && (
            <div style={{background:'#f8fafc',border:'1px solid #e8ecf0',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#475569',marginTop:4}}>
              <span style={{fontWeight:700,color:'#0f172a'}}>Notes: </span>{viewModal.notes}
            </div>
          )}
        </Modal>
      )}

      {replyModal && (
        <Modal title="Reply to Ticket" sub={`${replyModal.id} · ${replyModal.vendor}`} onClose={()=>{setReplyModal(null);setReplyText('');}}
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
            <Txta placeholder="Type your reply to the vendor…" value={replyText} onChange={e=>setReplyText(e.target.value)} autoFocus rows={5}/>
          </Field>
          <Field label="Update Status (optional)">
            <Sel value={replyStatus} onChange={e=>setReplyStatus(e.target.value)} options={['open','in-progress','resolved','closed']}/>
          </Field>
        </Modal>
      )}

      {resolveModal && (
        <Modal title="Resolve Ticket" sub={`${resolveModal.id} · ${resolveModal.vendor}`} onClose={()=>setResolveModal(null)}
          footer={<>
            <Btn onClick={()=>setResolveModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="green" onClick={()=>handleResolve(resolveModal)} style={{flex:1,justifyContent:'center'}}>
              <Icon name="CheckCircle" size={13} color="#16a34a"/>Mark as Resolved
            </Btn>
          </>}>
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#16a34a',fontWeight:600}}>
            ✓ This will mark <strong>{resolveModal.id}</strong> as <strong>Resolved</strong> and update today's date.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{l:'Vendor',v:resolveModal.vendor},{l:'Category',v:resolveModal.category},{l:'Assignee',v:resolveModal.assignee},{l:'Priority',v:resolveModal.priority}].map((r,i)=>(
              <div key={i} style={{background:'#f8fafc',borderRadius:8,padding:'8px 12px',border:'1px solid #e8ecf0'}}>
                <div style={{fontSize:'.67rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.3px'}}>{r.l}</div>
                <div style={{fontSize:'.8rem',fontWeight:600,color:'#0f172a',marginTop:2}}>{r.v}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Vendor Ticket" sub={editModal.id} onClose={()=>setEditModal(null)} wide
          footer={<>
            <Btn onClick={()=>setEditModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleEditSave} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Check" size={13} color="#fff"/>Save Changes
            </Btn>
          </>}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Subject" span2><Inp value={editForm.subject} onChange={e=>setEditForm(f=>({...f,subject:e.target.value}))}/></Field>
            <Field label="Vendor Name"><Inp value={editForm.vendor} onChange={e=>setEditForm(f=>({...f,vendor:e.target.value}))}/></Field>
            <Field label="Vendor ID"><Inp value={editForm.vendorId} onChange={e=>setEditForm(f=>({...f,vendorId:e.target.value}))}/></Field>
            <Field label="City"><Inp value={editForm.city} onChange={e=>setEditForm(f=>({...f,city:e.target.value}))}/></Field>
            <Field label="Vendor GMV (Rs.)"><Inp type="number" value={editForm.gmv} onChange={e=>setEditForm(f=>({...f,gmv:e.target.value}))}/></Field>
            <Field label="Tier"><Sel value={editForm.tier} onChange={e=>setEditForm(f=>({...f,tier:e.target.value}))} options={TIERS}/></Field>
            <Field label="Category"><Sel value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))} options={CATEGORIES}/></Field>
            <Field label="Priority"><Sel value={editForm.priority} onChange={e=>setEditForm(f=>({...f,priority:e.target.value}))} options={['low','medium','high','urgent']}/></Field>
            <Field label="Status"><Sel value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} options={['open','in-progress','resolved','closed']}/></Field>
            <Field label="Assignee"><Sel value={editForm.assignee} onChange={e=>setEditForm(f=>({...f,assignee:e.target.value}))} options={ASSIGNEES}/></Field>
            <Field label="Internal Notes" span2><Txta value={editForm.notes||''} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} placeholder="Internal notes…"/></Field>
          </div>
        </Modal>
      )}

      {newModal && (
        <Modal title="Create Vendor Ticket" sub="Fill in vendor and issue details" onClose={()=>setNewModal(false)} wide
          footer={<>
            <Btn onClick={()=>setNewModal(false)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleNewTicket} disabled={!newForm.subject.trim()||!newForm.vendor.trim()} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Plus" size={13} color="#fff"/>Create Ticket
            </Btn>
          </>}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Subject" span2><Inp autoFocus placeholder="Describe the vendor's issue…" value={newForm.subject} onChange={e=>setNewForm(f=>({...f,subject:e.target.value}))}/></Field>
            <Field label="Vendor Name"><Inp placeholder="e.g. Sports Arena" value={newForm.vendor} onChange={e=>setNewForm(f=>({...f,vendor:e.target.value}))}/></Field>
            <Field label="Vendor ID"><Inp placeholder="V-XXXX" value={newForm.vendorId} onChange={e=>setNewForm(f=>({...f,vendorId:e.target.value}))}/></Field>
            <Field label="City"><Inp placeholder="e.g. Mumbai" value={newForm.city} onChange={e=>setNewForm(f=>({...f,city:e.target.value}))}/></Field>
            <Field label="Vendor GMV (Rs.)"><Inp type="number" placeholder="0" value={newForm.gmv} onChange={e=>setNewForm(f=>({...f,gmv:e.target.value}))}/></Field>
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
