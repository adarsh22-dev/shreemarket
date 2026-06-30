import React, { useState, useEffect, useCallback } from 'react';
import './AllTickets.css';
import { Icon, initials, avatarBg, fmtDate } from './VendorShared';
import { getTickets, createTicket, updateTicket, updateTicketStatus, deleteTicket } from '../../api/api';
import toast from 'react-hot-toast';

const PRIORITY_CFG = {
  urgent: {bg:'#fee2e2',color:'#dc2626',dot:'#ef4444'},
  high:   {bg:'#fff7ed',color:'#ea580c',dot:'#f97316'},
  medium: {bg:'#fef3c7',color:'#d97706',dot:'#f59e0b'},
  low:    {bg:'#f0fdf4',color:'#16a34a',dot:'#22c55e'},
};
const STATUS_CFG = {
  'open':        {bg:'#dbeafe',color:'#2563eb',dot:'#3b82f6'},
  'in-progress': {bg:'#fef3c7',color:'#d97706',dot:'#f59e0b'},
  'resolved':    {bg:'#dcfce7',color:'#16a34a',dot:'#22c55e'},
  'closed':      {bg:'#f1f5f9',color:'#64748b',dot:'#94a3b8'},
};
const ASSIGNEES = ['Rahul S.','Priya M.','Neha K.','Dev Team','Amit R.','Sara T.'];
const CATEGORIES = ['Delivery','Finance','Product','Technical','Refund','Listing','Loyalty','Other'];
const PER = 6;

const Modal = ({ title, sub, onClose, children, footer, wide }) => (
  <div className="at-overlay" onClick={onClose}>
    <div className={`at-modal${wide?' at-modal--wide':''}`} onClick={e=>e.stopPropagation()}>
      <div className="at-modal__hdr">
        <div>
          <p className="at-modal__title">{title}</p>
          {sub && <p className="at-modal__sub">{sub}</p>}
        </div>
        <button className="at-modal__close" onClick={onClose}><Icon name="X" size={14}/></button>
      </div>
      <div className="at-modal__body">{children}</div>
      {footer && <div className="at-modal__footer">{footer}</div>}
    </div>
  </div>
);

const Field = ({ label, span2, children }) => (
  <div className={`at-field${span2?' at-field--span2':''}`}>
    <label className="at-label">{label}</label>
    {children}
  </div>
);
const Inp  = (props) => <input className="at-inp" {...props}/>;
const Txta = (props) => <textarea className="at-inp at-txta" rows={3} {...props}/>;
const Sel  = ({ value, onChange, options }) => (
  <select className="at-inp at-sel" value={value} onChange={onChange}>
    {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>
);
const Btn = ({ children, onClick, variant='outline', size='md', disabled, style={} }) => {
  const base = { display:'inline-flex',alignItems:'center',gap:6,cursor:disabled?'not-allowed':'pointer',borderRadius:8,fontWeight:700,transition:'all .15s',whiteSpace:'nowrap',fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:disabled?.5:1,padding:size==='sm'?'5px 10px':'8px 14px',fontSize:size==='sm'?'.74rem':'.8rem' };
  const v = { outline:{border:'1px solid #e2e8f0',background:'#fff',color:'#475569'}, primary:{border:'none',background:'#E03E1A',color:'#fff',boxShadow:'0 2px 8px rgba(224,62,26,.22)'}, green:{border:'1px solid #bbf7d0',background:'#dcfce7',color:'#16a34a'}, danger:{border:'1px solid #fecaca',background:'#fee2e2',color:'#dc2626'} };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>;
};

const PriorityBdg = ({ p }) => {
  const c = PRIORITY_CFG[p]||PRIORITY_CFG.low;
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,background:c.bg,color:c.color,fontWeight:700,fontSize:'.7rem'}}><span style={{width:6,height:6,borderRadius:'50%',background:c.dot}}/>{p}</span>;
};
const StatusBdg = ({ s }) => {
  const c = STATUS_CFG[s]||STATUS_CFG.closed;
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,background:c.bg,color:c.color,fontWeight:700,fontSize:'.7rem'}}><span style={{width:6,height:6,borderRadius:'50%',background:c.dot}}/>{s}</span>;
};

export default function AllTickets() {
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('All');
  const [typeF,      setTypeF]      = useState('all');
  const [page,       setPage]       = useState(0);
  const [sel,        setSel]        = useState(null);
  const [totalElements, setTotalElements] = useState(0);

  const [viewModal,    setViewModal]    = useState(null);
  const [editModal,    setEditModal]    = useState(null);
  const [replyModal,   setReplyModal]   = useState(null);
  const [newModal,     setNewModal]     = useState(false);
  const [resolveModal, setResolveModal] = useState(null);

  const [editForm,   setEditForm]   = useState({});
  const [replyText,  setReplyText]  = useState('');
  const [newForm,    setNewForm]    = useState({ subject:'', customer:'', customerId:'', type:'customer', category:'Delivery', priority:'medium', assignee:'Rahul S.', notes:'' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTickets({ search, page: 0, size: 1000 });
      const mapped = (data.content || []).map(t => ({
        id: t.ticketNumber,
        subject: t.subject || '',
        customer: t.createdBy || '',
        customerId: t.createdById || '',
        type: t.role || 'customer',
        priority: t.priority || 'medium',
        status: t.status || 'open',
        category: t.category || 'Other',
        assignee: t.assignedTo || '',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        msgs: 0,
        notes: t.notes || '',
      }));
      setTickets(mapped);
      setTotalElements(data.totalElements || 0);
    } catch (e) {
      toast.error('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filtered = tickets
    .filter(t => filter==='All' || t.status===filter || t.priority===filter)
    .filter(t => typeF==='all' || t.type===typeF);

  const pages    = Math.ceil(filtered.length/PER)||1;
  const slice    = filtered.slice(page*PER,(page+1)*PER);

  const handleResolve = async (t) => {
    try {
      await updateTicketStatus(t.id, 'resolved');
      toast.success(`${t.id} marked as resolved`);
      fetchTickets();
    } catch (e) {
      toast.error('Failed to resolve ticket');
    }
    setResolveModal(null); setSel(null);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      if (editForm.status && editForm.status !== replyModal.status) {
        await updateTicketStatus(replyModal.id, editForm.status);
      }
      toast.success(`Reply sent on ${replyModal.id}`);
      fetchTickets();
    } catch (e) {
      toast.error('Failed to send reply');
    }
    setReplyText(''); setReplyModal(null); setEditForm({});
  };

  const openEdit = (e, t) => { e.stopPropagation(); setEditForm({...t}); setEditModal(t); };
  const handleEditSave = async () => {
    try {
      await updateTicket(editModal.id, {
        subject: editForm.subject,
        category: editForm.category,
        priority: editForm.priority,
        status: editForm.status,
        assignedTo: editForm.assignee,
        notes: editForm.notes,
        role: editForm.type,
      });
      toast.success(`${editModal.id} updated`);
      fetchTickets();
    } catch (e) {
      toast.error('Failed to update ticket');
    }
    setEditModal(null);
  };

  const handleNewTicket = async () => {
    if (!newForm.subject.trim()||!newForm.customer.trim()) return;
    try {
      await createTicket({
        subject: newForm.subject,
        createdBy: newForm.customer,
        createdById: newForm.customerId,
        role: newForm.type,
        category: newForm.category,
        priority: newForm.priority,
        assignedTo: newForm.assignee,
        notes: newForm.notes,
      });
      toast.success('Ticket created');
      fetchTickets();
    } catch (e) {
      toast.error('Failed to create ticket');
    }
    setNewModal(false);
    setNewForm({ subject:'', customer:'', customerId:'', type:'customer', category:'Delivery', priority:'medium', assignee:'Rahul S.', notes:'' });
  };

  const handleExport = () => {
    const rows = [
      ['ID','Subject','Type','Customer','Customer ID','Category','Priority','Status','Assignee','Created','Updated','Messages'],
      ...tickets.map(t=>[t.id,t.subject,t.type,t.customer,t.customerId,t.category,t.priority,t.status,t.assignee,fmtDate?fmtDate(t.createdAt):t.createdAt,fmtDate?fmtDate(t.updatedAt):t.updatedAt,t.msgs])
    ];
    const csv  = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='tickets.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Tickets CSV downloaded');
  };

  return (
    <div className="vm">
      {loading && (
        <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,height:3,background:'#f1f5f9'}}>
          <div style={{height:'100%',width:'30%',background:'linear-gradient(90deg,#E03E1A,#f97316)',borderRadius:2,animation:'shimmer 1.2s ease-in-out infinite'}}/>
        </div>
      )}

      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">All Tickets</h2>
          <p className="vm-hdr__sub">Unified view of all support tickets — customer and vendor</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}><Icon name="Download" size={13} color="#475569"/>Export CSV</button>
          <button className="vm-btn vm-btn--primary" onClick={()=>setNewModal(true)}><Icon name="Plus" size={13} color="#fff"/>New Ticket</button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          {label:'Total Tickets',    value:loading?'...':tickets.length,                                                           icon:'Ticket',       c:'#2563eb',bg:'#dbeafe',trend:'All time'},
          {label:'Open / Active',    value:loading?'...':tickets.filter(t=>t.status==='open'||t.status==='in-progress').length,   icon:'AlertTriangle',c:'#E03E1A',bg:'#ffe4de',trend:'Needs attention'},
          {label:'Resolved',         value:loading?'...':tickets.filter(t=>t.status==='resolved').length,                         icon:'CheckCircle',  c:'#16a34a',bg:'#dcfce7',trend:'This month'},
          {label:'Urgent Priority',  value:loading?'...':tickets.filter(t=>t.priority==='urgent').length,                         icon:'Zap',          c:'#dc2626',bg:'#fee2e2',trend:'Immediate action'},
        ].map((k,i)=>(
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background:k.bg}}><Icon name={k.icon} size={18} color={k.c} sw={2.1}/></div>
              <span className={`vm-kpi__trend vm-kpi__trend--${i===1||i===3?'dn':'up'}`}>{k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vm-card">
        <p className="vm-sh__title" style={{marginBottom:14}}>Tickets by Category</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {[...new Set(tickets.map(t=>t.category))].map(cat=>{
            const count = tickets.filter(t=>t.category===cat).length;
            return (
              <div key={cat}
                style={{padding:'10px 16px',borderRadius:10,background:'#f8fafc',border:'1px solid #e8ecf0',display:'flex',gap:10,alignItems:'center',cursor:'pointer',transition:'all .14s'}}
                onClick={()=>{setFilter('All');setSearch(cat);setPage(0);}}>
                <span style={{fontSize:'.82rem',fontWeight:700,color:'#0f172a'}}>{cat}</span>
                <span style={{background:'#E03E1A',color:'#fff',fontSize:'.7rem',fontWeight:800,padding:'1px 7px',borderRadius:999}}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Ticket Queue</p>
            <p className="vm-sh__sub">{filtered.length} tickets · Click row to expand</p>
          </div>
          <div className="vm-sh__right">
            <div style={{display:'flex',gap:6}}>
              {['all','customer','vendor'].map(t=>(
                <button key={t} className={`vm-pill${typeF===t?' vm-pill--active':''}`}
                  style={{border:'1px solid #e8ecf0',borderRadius:6}}
                  onClick={()=>{setTypeF(t);setPage(0);}}>
                  {t==='all'?'All Types':t[0].toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search tickets…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
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
                <th>From</th>
                <th>Type</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Created</th>
                <th>Msgs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length===0 && !loading && <tr><td colSpan={11} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>No tickets match your filters.</td></tr>}
              {slice.length===0 && loading && <tr><td colSpan={11} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>Loading tickets...</td></tr>}
              {slice.map(t=>{
                const prCfg = PRIORITY_CFG[t.priority];
                const stCfg = STATUS_CFG[t.status];
                return (
                  <React.Fragment key={t.id}>
                    <tr style={{cursor:'pointer',background:sel===t.id?'#fff8f6':undefined}}
                      onClick={()=>setSel(sel===t.id?null:t.id)}>

                      <td><span style={{fontFamily:'monospace',fontSize:'.78rem',fontWeight:700,color:'#E03E1A'}}>{t.id}</span></td>

                      <td style={{maxWidth:200}}>
                        <div style={{fontSize:'.83rem',fontWeight:600,color:'#0f172a',whiteSpace:'normal',lineHeight:1.4}}>{t.subject}</div>
                      </td>

                      <td>
                        <div className="vm-vcell">
                          <div className="vm-av vm-av--sm" style={{background:avatarBg(t.customer)}}>{initials(t.customer)}</div>
                          <div>
                            <div className="vm-vcell__name">{t.customer}</div>
                            <div className="vm-vcell__id">{t.customerId}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{fontSize:'.7rem',fontWeight:700,padding:'2px 9px',borderRadius:999,background:t.type==='vendor'?'#ede9fe':'#dbeafe',color:t.type==='vendor'?'#7c3aed':'#2563eb'}}>
                          {t.type[0].toUpperCase()+t.type.slice(1)}
                        </span>
                      </td>

                      <td><span style={{fontSize:'.78rem',color:'#475569'}}>{t.category}</span></td>

                      <td><PriorityBdg p={t.priority}/></td>

                      <td><StatusBdg s={t.status}/></td>

                      <td><span style={{fontSize:'.8rem',color:'#475569',fontWeight:600}}>{t.assignee}</span></td>

                      <td><span style={{fontSize:'.75rem',color:'#94a3b8'}}>{fmtDate?fmtDate(t.createdAt):t.createdAt}</span></td>

                      <td>
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:'.8rem',fontWeight:700,color:'#0f172a'}}>
                          <Icon name="MessageSquare" size={12} color="#94a3b8"/>{t.msgs}
                        </span>
                      </td>

                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:4,flexWrap:'nowrap'}}>
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
                        <td colSpan={11} style={{padding:0}}>
                          <div className="at-expand-inner">
                            <div style={{fontSize:'.9rem',fontWeight:800,color:'#0f172a',marginBottom:10}}>{t.subject}</div>

                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:12}}>
                              {[
                                {label:'Ticket ID',   value:t.id},
                                {label:'Category',    value:t.category},
                                {label:'Type',        value:t.type},
                                {label:'Assignee',    value:t.assignee},
                                {label:'Created',     value:fmtDate?fmtDate(t.createdAt):t.createdAt},
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
                              <Btn size="sm" variant="primary" onClick={()=>setReplyModal(t)}>
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
            <Btn variant="primary" onClick={()=>{setReplyModal(viewModal);setViewModal(null);}} style={{flex:1,justifyContent:'center'}}>
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
            <span style={{fontSize:'.7rem',fontWeight:700,padding:'2px 9px',borderRadius:999,background:viewModal.type==='vendor'?'#ede9fe':'#dbeafe',color:viewModal.type==='vendor'?'#7c3aed':'#2563eb'}}>
              {viewModal.type[0].toUpperCase()+viewModal.type.slice(1)}
            </span>
          </div>
          {[
            {l:'Customer',   v:viewModal.customer},
            {l:'Customer ID',v:viewModal.customerId},
            {l:'Category',   v:viewModal.category},
            {l:'Assignee',   v:viewModal.assignee},
            {l:'Messages',   v:`${viewModal.msgs} messages`},
            {l:'Created',    v:fmtDate?fmtDate(viewModal.createdAt):viewModal.createdAt},
            {l:'Last Update',v:fmtDate?fmtDate(viewModal.updatedAt):viewModal.updatedAt},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<6?'1px solid #f1f5f9':'none'}}>
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
        <Modal title="Reply to Ticket" sub={`${replyModal.id} · ${replyModal.customer}`} onClose={()=>{setReplyModal(null);setReplyText('');setEditForm({});}}
          footer={<>
            <Btn onClick={()=>{setReplyModal(null);setReplyText('');setEditForm({});}} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleReply} disabled={!replyText.trim()} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Send" size={13} color="#fff"/>Send Reply
            </Btn>
          </>}>
          <div style={{background:'#f8fafc',border:'1px solid #e8ecf0',borderRadius:10,padding:'12px 14px',marginBottom:4}}>
            <div style={{fontSize:'.68rem',color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:3}}>Subject</div>
            <div style={{fontSize:'.85rem',fontWeight:700,color:'#0f172a'}}>{replyModal.subject}</div>
          </div>
          <Field label="Your Reply">
            <Txta placeholder="Type your reply here…" value={replyText} onChange={e=>setReplyText(e.target.value)} autoFocus rows={5}/>
          </Field>
          <Field label="Update Status (optional)">
            <Sel value={editForm.status||replyModal.status}
              onChange={e=>setEditForm({...editForm,status:e.target.value})}
              options={['open','in-progress','resolved','closed']}/>
          </Field>
        </Modal>
      )}

      {resolveModal && (
        <Modal title="Resolve Ticket" sub={`${resolveModal.id} · ${resolveModal.subject}`} onClose={()=>setResolveModal(null)}
          footer={<>
            <Btn onClick={()=>setResolveModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="green" onClick={()=>handleResolve(resolveModal)} style={{flex:1,justifyContent:'center'}}>
              <Icon name="CheckCircle" size={13} color="#16a34a"/>Mark as Resolved
            </Btn>
          </>}>
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#16a34a',fontWeight:600}}>
            ✓ This will mark <strong>{resolveModal.id}</strong> as <strong>Resolved</strong> and set the updated date to today.
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

      {editModal && (
        <Modal title="Edit Ticket" sub={`${editModal.id}`} onClose={()=>setEditModal(null)} wide
          footer={<>
            <Btn onClick={()=>setEditModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleEditSave} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Check" size={13} color="#fff"/>Save Changes
            </Btn>
          </>}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Subject" span2><Inp value={editForm.subject} onChange={e=>setEditForm(f=>({...f,subject:e.target.value}))}/></Field>
            <Field label="Customer"><Inp value={editForm.customer} onChange={e=>setEditForm(f=>({...f,customer:e.target.value}))}/></Field>
            <Field label="Customer ID"><Inp value={editForm.customerId} onChange={e=>setEditForm(f=>({...f,customerId:e.target.value}))}/></Field>
            <Field label="Type"><Sel value={editForm.type} onChange={e=>setEditForm(f=>({...f,type:e.target.value}))} options={['customer','vendor']}/></Field>
            <Field label="Category"><Sel value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))} options={CATEGORIES}/></Field>
            <Field label="Priority"><Sel value={editForm.priority} onChange={e=>setEditForm(f=>({...f,priority:e.target.value}))} options={['low','medium','high','urgent']}/></Field>
            <Field label="Status"><Sel value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} options={['open','in-progress','resolved','closed']}/></Field>
            <Field label="Assignee"><Sel value={editForm.assignee} onChange={e=>setEditForm(f=>({...f,assignee:e.target.value}))} options={ASSIGNEES}/></Field>
            <Field label="Notes" span2><Txta value={editForm.notes||''} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} placeholder="Internal notes…"/></Field>
          </div>
        </Modal>
      )}

      {newModal && (
        <Modal title="Create New Ticket" sub="Fill in the details below" onClose={()=>setNewModal(false)} wide
          footer={<>
            <Btn onClick={()=>setNewModal(false)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleNewTicket} disabled={!newForm.subject.trim()||!newForm.customer.trim()} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Plus" size={13} color="#fff"/>Create Ticket
            </Btn>
          </>}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Subject" span2><Inp autoFocus placeholder="Describe the issue…" value={newForm.subject} onChange={e=>setNewForm(f=>({...f,subject:e.target.value}))}/></Field>
            <Field label="Customer Name"><Inp placeholder="Customer / Vendor name" value={newForm.customer} onChange={e=>setNewForm(f=>({...f,customer:e.target.value}))}/></Field>
            <Field label="Customer ID"><Inp placeholder="C-XXXX or V-XXXX" value={newForm.customerId} onChange={e=>setNewForm(f=>({...f,customerId:e.target.value}))}/></Field>
            <Field label="Type"><Sel value={newForm.type} onChange={e=>setNewForm(f=>({...f,type:e.target.value}))} options={['customer','vendor']}/></Field>
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
