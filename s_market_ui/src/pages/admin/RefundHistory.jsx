import React, { useState, useEffect } from 'react';
import './RefundHistory.css';
import { Icon, initials, avatarBg, fmt, fmtDate } from './VendorShared';
import { getRefunds, createRefund, deleteRefund } from '../../api/api';

const STATUS_CFG = {
  completed:  { bg:'#dcfce7', color:'#16a34a', dot:'#22c55e' },
  processing: { bg:'#dbeafe', color:'#2563eb', dot:'#3b82f6' },
  pending:    { bg:'#fef3c7', color:'#d97706', dot:'#f59e0b' },
  rejected:   { bg:'#fee2e2', color:'#dc2626', dot:'#ef4444' },
};

const MONTHS = ['Jan 2024','Feb 2024','Mar 2024','Apr 2024','May 2024','Jun 2024',
                 'Jul 2024','Aug 2024','Sep 2024','Oct 2024','Nov 2024','Dec 2024','All'];

const today = () => new Date().toISOString().slice(0,10);

const PER = 6;

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  const map = {
    success: ['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:   ['#fee2e2','#dc2626','#fecaca','✕'],
    info:    ['#dbeafe','#2563eb','#bfdbfe','ℹ'],
  };
  const [bg, fg, border, ico] = map[type] || map.info;
  return (
    <div className="rh-toast" style={{ background:bg, color:fg, border:`1px solid ${border}` }}>
      {ico} {msg}
    </div>
  );
};

/* ── Modal shell ── */
const Modal = ({ title, sub, onClose, children, footer }) => (
  <div className="rh-overlay" onClick={onClose}>
    <div className="rh-modal" onClick={e => e.stopPropagation()}>
      <div className="rh-modal__hdr">
        <div>
          <p className="rh-modal__title">{title}</p>
          {sub && <p className="rh-modal__sub">{sub}</p>}
        </div>
        <button className="rh-modal__close" onClick={onClose}>
          <Icon name="X" size={14}/>
        </button>
      </div>
      <div className="rh-modal__body">{children}</div>
      {footer && <div className="rh-modal__footer">{footer}</div>}
    </div>
  </div>
);

/* ── Form helpers ── */
const Field = ({ label, span2, children }) => (
  <div className={`rh-field${span2 ? ' rh-field--span2' : ''}`}>
    <label className="rh-label">{label}</label>
    {children}
  </div>
);
const Inp = (props) => <input className="rh-inp" {...props}/>;
const Sel = ({ value, onChange, options }) => (
  <select className="rh-inp rh-sel" value={value} onChange={onChange}>
    {options.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>
);

/* ── Btn ── */
const Btn = ({ children, onClick, variant='outline', size='md', disabled, style={} }) => {
  const base = {
    display:'inline-flex', alignItems:'center', gap:6, cursor: disabled?'not-allowed':'pointer',
    borderRadius:8, fontWeight:700, transition:'all .15s', whiteSpace:'nowrap',
    fontFamily:"'Plus Jakarta Sans',sans-serif", opacity: disabled ? .5 : 1,
    padding: size==='sm' ? '5px 10px' : '8px 14px',
    fontSize: size==='sm' ? '.74rem' : '.8rem',
  };
  const variants = {
    outline: { border:'1px solid #e2e8f0', background:'#fff', color:'#475569' },
    primary: { border:'none', background:'#E03E1A', color:'#fff', boxShadow:'0 2px 8px rgba(224,62,26,.22)' },
    danger:  { border:'1px solid #fecaca', background:'#fee2e2', color:'#dc2626' },
    green:   { border:'1px solid #bbf7d0', background:'#dcfce7', color:'#16a34a' },
  };
  return <button onClick={disabled ? undefined : onClick} style={{...base, ...variants[variant], ...style}}>{children}</button>;
};

export default function RefundHistory() {
  const [refunds, setRefunds] = useState([]);
  useEffect(() => { getRefunds().then(setRefunds).catch(() => {}); }, []);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('All');
  const [month,   setMonth]   = useState('Dec 2024');
  const [page,    setPage]    = useState(0);
  const [sel,     setSel]     = useState(null);
  const [toast,   setToast]   = useState(null);

  /* Modals */
  const [viewModal,     setViewModal]     = useState(null);
  const [editModal,     setEditModal]     = useState(null);
  const [approveModal,  setApproveModal]  = useState(null);
  const [rejectModal,   setRejectModal]   = useState(null);
  const [monthModal,    setMonthModal]    = useState(false);
  const [editForm,      setEditForm]      = useState({});
  const [rejectReason,  setRejectReason]  = useState('');
  const [approveMethod, setApproveMethod] = useState('Original payment');

  const showToast = (msg, type='success') => setToast({ msg, type });

  /* Filtering */
  const filtered = refunds
    .filter(r => filter==='All' || r.status===filter)
    .filter(r => month==='All' || r.requestedOn.startsWith(
      (() => { const [m,y]=month.split(' '); return `${y}-${String(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m)+1).padStart(2,'0')}`; })()
    ))
    .filter(r => !search || r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase()));

  const pages    = Math.ceil(filtered.length / PER) || 1;
  const slice    = filtered.slice(page * PER, (page+1) * PER);
  const totalAmt = refunds.filter(r=>r.status==='completed').reduce((s,r)=>s+r.amount,0);
  const pending  = refunds.filter(r=>r.status==='pending'||r.status==='processing').length;

  /* ── Approve ── */
  const handleApprove = () => {
    setRefunds(prev => prev.map(r => r.id === approveModal.id
      ? { ...r, status:'completed', method: approveMethod, resolvedOn: today() }
      : r
    ));
    showToast(`${approveModal.id} approved — refund initiated`, 'success');
    setApproveModal(null);
    setSel(null);
  };

  /* ── Reject ── */
  const handleReject = () => {
    setRefunds(prev => prev.map(r => r.id === rejectModal.id
      ? { ...r, status:'rejected', reason: rejectReason || r.reason, resolvedOn: today() }
      : r
    ));
    showToast(`${rejectModal.id} rejected`, 'error');
    setRejectModal(null);
    setSel(null);
  };

  /* ── Edit ── */
  const openEdit = (e, r) => {
    e.stopPropagation();
    setEditForm({ ...r });
    setEditModal(r);
  };
  const handleEditSave = () => {
    setRefunds(prev => prev.map(r => r.id === editModal.id
      ? { ...editForm, amount: Number(editForm.amount) || editModal.amount }
      : r
    ));
    showToast(`${editModal.id} updated`, 'success');
    setEditModal(null);
  };

  /* ── Export CSV ── */
  const handleExport = () => {
    const rows = [
      ['Refund ID','Customer','Email','Order ID','Product','Amount','Status','Reason','Method','Requested','Resolved','Vendor'],
      ...refunds.map(r=>[r.id,r.customer,r.email,r.orderId,r.product,r.amount,r.status,r.reason,r.method,r.requestedOn,r.resolvedOn||'',r.vendor])
    ];
    const csv  = rows.map(row => row.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='refund_history.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded', 'success');
  };

  const openApprove = (e, r) => { e.stopPropagation(); setApproveMethod(r.method==='N/A'?'Original payment':r.method); setApproveModal(r); };
  const openReject  = (e, r) => { e.stopPropagation(); setRejectReason(''); setRejectModal(r); };

  return (
    <div className="vm">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}

      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Refund History</h2>
          <p className="vm-hdr__sub">Track all refund requests — from initiation to resolution</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}>
            <Icon name="Download" size={13} color="#475569"/>Export CSV
          </button>
          <button className="vm-btn vm-btn--outline" onClick={() => setMonthModal(true)}>
            <Icon name="Calendar" size={13} color="#475569"/>{month}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Total Refunds',        value: refunds.length,                                                           icon:'RefreshCcw',  c:'#2563eb', bg:'#dbeafe', trend:'All time' },
          { label:'Completed',            value: refunds.filter(r=>r.status==='completed').length,                         icon:'CheckCircle', c:'#16a34a', bg:'#dcfce7', trend:`${Math.round(refunds.filter(r=>r.status==='completed').length/refunds.length*100)}% success rate` },
          { label:'Pending / In-Progress',value: pending,                                                                  icon:'Clock',       c:'#d97706', bg:'#fef3c7', trend: pending > 2 ? 'Needs action' : 'On track' },
          { label:'Amount Refunded',      value: fmt(totalAmt),                                                            icon:'DollarSign',  c:'#E03E1A', bg:'#ffe4de', trend:'Completed refunds' },
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background:k.bg}}><Icon name={k.icon} size={18} color={k.c} sw={2.1}/></div>
              <span className={`vm-kpi__trend vm-kpi__trend--${i===2&&pending>2?'dn':'up'}`}>{k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown — clickable to filter */}
      <div className="vm-card">
        <p className="vm-sh__title" style={{marginBottom:14}}>Refund Status Breakdown</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12}}>
          {Object.entries(STATUS_CFG).map(([status, cfg]) => {
            const count  = refunds.filter(r=>r.status===status).length;
            const amount = refunds.filter(r=>r.status===status).reduce((s,r)=>s+r.amount,0);
            const active = filter === status;
            return (
              <div key={status}
                style={{
                  padding:14, borderRadius:11, cursor:'pointer',
                  background: cfg.bg + (active ? 'ff' : '88'),
                  border:`2px solid ${active ? cfg.color : cfg.bg}`,
                  transition:'all .15s', transform: active ? 'translateY(-2px)' : 'none',
                  boxShadow: active ? `0 4px 14px ${cfg.bg}` : 'none',
                }}
                onClick={() => { setFilter(filter===status?'All':status); setPage(0); }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                  <span style={{fontSize:'.7rem', fontWeight:700, color:cfg.color, textTransform:'capitalize'}}>{status}</span>
                  <span style={{width:8, height:8, borderRadius:'50%', background:cfg.dot, display:'inline-block'}}/>
                </div>
                <div style={{fontSize:'1.5rem', fontWeight:800, color:'#0f172a', lineHeight:1}}>{count}</div>
                <div style={{fontSize:'.7rem', color:'#64748b', marginTop:4}}>{fmt(amount)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Refund Requests</p>
            <p className="vm-sh__sub">{filtered.length} records · Click row for details</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search customer, order, product…"
                value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
            </div>
            <div className="vm-pills">
              {['All','pending','processing','completed','rejected'].map(f=>(
                <button key={f} className={`vm-pill${filter===f?' vm-pill--active':''}`}
                  onClick={()=>{setFilter(f);setPage(0);}}>
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
                <th>Refund ID</th>
                <th>Customer</th>
                <th>Order / Product</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Method</th>
                <th>Requested</th>
                <th>Resolved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr><td colSpan={10} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>No refunds match your filters.</td></tr>
              )}
              {slice.map(r => {
                const cfg = STATUS_CFG[r.status];
                return (
                  <React.Fragment key={r.id}>
                    <tr style={{cursor:'pointer', background: sel===r.id ? '#fff8f6' : undefined}}
                      onClick={() => setSel(sel===r.id ? null : r.id)}>

                      {/* Refund ID */}
                      <td><span style={{fontFamily:'monospace',fontSize:'.78rem',fontWeight:700,color:'#E03E1A'}}>{r.id}</span></td>

                      {/* Customer */}
                      <td>
                        <div className="vm-vcell">
                          <div className="vm-av vm-av--sm" style={{background:avatarBg(r.customer)}}>{initials(r.customer)}</div>
                          <div>
                            <div className="vm-vcell__name">{r.customer}</div>
                            <div className="vm-vcell__id">{r.customerId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Order / Product */}
                      <td>
                        <div style={{fontSize:'.8rem',fontWeight:600,color:'#0f172a'}}>{r.orderId}</div>
                        <div style={{fontSize:'.72rem',color:'#94a3b8'}}>{r.product}</div>
                      </td>

                      {/* Amount */}
                      <td><span style={{fontWeight:800,fontSize:'.88rem',color:'#0f172a'}}>{fmt(r.amount)}</span></td>

                      {/* Reason */}
                      <td><span style={{fontSize:'.78rem',color:'#475569'}}>{r.reason}</span></td>

                      {/* Status */}
                      <td>
                        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:999,background:cfg.bg,color:cfg.color,fontWeight:700,fontSize:'.7rem'}}>
                          <span style={{width:6,height:6,borderRadius:'50%',background:cfg.dot}}/>
                          {r.status[0].toUpperCase()+r.status.slice(1)}
                        </span>
                      </td>

                      {/* Method */}
                      <td><span style={{fontSize:'.75rem',color:'#475569'}}>{r.method}</span></td>

                      {/* Requested */}
                      <td><span style={{fontSize:'.75rem',color:'#94a3b8'}}>{fmtDate ? fmtDate(r.requestedOn) : r.requestedOn}</span></td>

                      {/* Resolved */}
                      <td>
                        {r.resolvedOn
                          ? <span style={{fontSize:'.75rem',color:'#16a34a',fontWeight:600}}>{fmtDate ? fmtDate(r.resolvedOn) : r.resolvedOn}</span>
                          : <span style={{fontSize:'.72rem',color:'#d97706'}}>Pending</span>}
                      </td>

                      {/* Actions */}
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex',gap:4,flexWrap:'nowrap'}}>
                          {/* Approve / Reject for actionable statuses */}
                          {(r.status==='pending'||r.status==='processing') && <>
                            <button className="vm-btn vm-btn--primary vm-btn--sm" onClick={e=>openApprove(e,r)}>
                              <Icon name="Check" size={11} color="#fff"/>Approve
                            </button>
                            <button className="vm-btn vm-btn--danger vm-btn--sm" onClick={e=>openReject(e,r)}>
                              <Icon name="X" size={11} color="#dc2626"/>Reject
                            </button>
                          </>}
                          {/* View for completed / rejected */}
                          {(r.status==='completed'||r.status==='rejected') &&
                            <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={e=>{e.stopPropagation();setViewModal(r);}}>
                              <Icon name="Eye" size={11} color="#475569"/>View
                            </button>}
                          {/* Edit always */}
                          <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={e=>openEdit(e,r)}>
                            <Icon name="Edit2" size={11} color="#2563eb"/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {sel === r.id && (
                      <tr>
                        <td colSpan={10} style={{padding:0}}>
                          <div className="rh-expand-inner">
                            {/* Detail cards */}
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:12}}>
                              {[
                                {label:'Refund ID',    value:r.id},
                                {label:'Order ID',     value:r.orderId},
                                {label:'Product',      value:r.product},
                                {label:'Vendor',       value:r.vendor},
                                {label:'Amount',       value:fmt(r.amount)},
                                {label:'Method',       value:r.method},
                                {label:'Requested On', value:r.requestedOn},
                                {label:'Resolved On',  value:r.resolvedOn||'—'},
                              ].map((item,i)=>(
                                <div key={i} style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:8,padding:'9px 12px'}}>
                                  <div style={{fontSize:'.63rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.4px'}}>{item.label}</div>
                                  <div style={{fontSize:'.83rem',fontWeight:700,color:'#0f172a',marginTop:2}}>{item.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Reason */}
                            <div style={{padding:'10px 12px',background:'#fff',borderRadius:8,border:'1px solid #f1f5f9',fontSize:'.82rem',color:'#475569',marginBottom:10}}>
                              <span style={{fontWeight:700,color:'#0f172a'}}>Reason: </span>{r.reason}
                            </div>

                            {/* Actions */}
                            <div style={{display:'flex',gap:8,justifyContent:'flex-end',flexWrap:'wrap'}}>
                              {(r.status==='pending'||r.status==='processing') && <>
                                <Btn variant="primary" size="sm" onClick={e=>openApprove(e,r)}>
                                  <Icon name="CheckCircle" size={12} color="#fff"/>Approve Refund
                                </Btn>
                                <Btn variant="danger" size="sm" onClick={e=>openReject(e,r)}>
                                  <Icon name="X" size={12} color="#dc2626"/>Reject
                                </Btn>
                              </>}
                              <Btn size="sm" onClick={e=>openEdit(e,r)}>
                                <Icon name="Edit2" size={12} color="#475569"/>Edit
                              </Btn>
                              <Btn size="sm" onClick={e=>{e.stopPropagation();setSel(null);}}>
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

        {/* Pagination */}
        <div className="vm-pag">
          <span className="vm-pag__info">{page*PER+1}–{Math.min((page+1)*PER,filtered.length)} of {filtered.length}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={()=>setPage(p=>p-1)} disabled={page===0}><Icon name="ChevLeft" size={12}/></button>
            <span className="vm-pag__label">{page+1} / {pages}</span>
            <button className="vm-pag__btn" onClick={()=>setPage(p=>p+1)} disabled={(page+1)*PER>=filtered.length}><Icon name="ChevRight" size={12}/></button>
          </div>
        </div>
      </div>

      {/* ══ APPROVE MODAL ══ */}
      {approveModal && (
        <Modal
          title="Approve Refund"
          sub={`${approveModal.id} · ${approveModal.customer} · ${fmt(approveModal.amount)}`}
          onClose={() => setApproveModal(null)}
          footer={<>
            <Btn onClick={() => setApproveModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleApprove} style={{flex:1,justifyContent:'center'}}>
              <Icon name="CheckCircle" size={13} color="#fff"/>Confirm Approval
            </Btn>
          </>}
        >
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#16a34a',fontWeight:600,marginBottom:4}}>
            ✓ Approving will mark this refund as <strong>Completed</strong> and initiate the payout.
          </div>
          <Field label="Refund Method">
            <Sel value={approveMethod} onChange={e=>setApproveMethod(e.target.value)}
              options={['Original payment','Store credit','Bank transfer','UPI','Wallet']}/>
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              {l:'Product',    v:approveModal.product},
              {l:'Vendor',     v:approveModal.vendor},
              {l:'Reason',     v:approveModal.reason},
              {l:'Requested',  v:approveModal.requestedOn},
            ].map((r,i)=>(
              <div key={i} style={{background:'#f8fafc',borderRadius:8,padding:'8px 12px',border:'1px solid #e8ecf0'}}>
                <div style={{fontSize:'.67rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.3px'}}>{r.l}</div>
                <div style={{fontSize:'.8rem',fontWeight:600,color:'#0f172a',marginTop:2}}>{r.v}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ══ REJECT MODAL ══ */}
      {rejectModal && (
        <Modal
          title="Reject Refund"
          sub={`${rejectModal.id} · ${rejectModal.customer}`}
          onClose={() => setRejectModal(null)}
          footer={<>
            <Btn onClick={() => setRejectModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="danger" onClick={handleReject} style={{flex:1,justifyContent:'center'}}>
              <Icon name="X" size={13} color="#dc2626"/>Confirm Rejection
            </Btn>
          </>}
        >
          <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#dc2626',fontWeight:600,marginBottom:4}}>
            ✕ This refund will be marked as <strong>Rejected</strong>. This action can be revised by editing the record.
          </div>
          <Field label="Original Reason">
            <Inp value={rejectModal.reason} disabled style={{background:'#f8fafc',color:'#94a3b8'}}/>
          </Field>
          <Field label="Rejection Reason (optional — overrides original)">
            <Inp placeholder="e.g. Beyond return window, fraud suspected…"
              value={rejectReason} onChange={e=>setRejectReason(e.target.value)} autoFocus/>
          </Field>
        </Modal>
      )}

      {/* ══ VIEW MODAL ══ */}
      {viewModal && (
        <Modal
          title="Refund Details"
          sub={`${viewModal.id} · ${viewModal.orderId}`}
          onClose={() => setViewModal(null)}
          footer={<Btn onClick={() => setViewModal(null)} style={{flex:1,justifyContent:'center'}}>Close</Btn>}
        >
          {[
            {l:'Customer',    v:viewModal.customer},
            {l:'Email',       v:viewModal.email},
            {l:'Product',     v:viewModal.product},
            {l:'Vendor',      v:viewModal.vendor},
            {l:'Amount',      v:fmt(viewModal.amount)},
            {l:'Status',      v:viewModal.status[0].toUpperCase()+viewModal.status.slice(1)},
            {l:'Reason',      v:viewModal.reason},
            {l:'Method',      v:viewModal.method},
            {l:'Requested',   v:viewModal.requestedOn},
            {l:'Resolved',    v:viewModal.resolvedOn||'—'},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<9?'1px solid #f1f5f9':'none'}}>
              <span style={{fontSize:'.74rem',color:'#94a3b8',fontWeight:600}}>{r.l}</span>
              <span style={{fontSize:'.82rem',color:'#0f172a',fontWeight:700,textAlign:'right',maxWidth:'60%'}}>{r.v}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* ══ EDIT MODAL ══ */}
      {editModal && (
        <Modal
          title="Edit Refund Record"
          sub={`${editModal.id} · ${editModal.customer}`}
          onClose={() => setEditModal(null)}
          footer={<>
            <Btn onClick={() => setEditModal(null)} style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
            <Btn variant="primary" onClick={handleEditSave} style={{flex:1,justifyContent:'center'}}>
              <Icon name="Check" size={13} color="#fff"/>Save Changes
            </Btn>
          </>}
        >
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="Customer" span2><Inp value={editForm.customer} onChange={e=>setEditForm(f=>({...f,customer:e.target.value}))}/></Field>
            <Field label="Product" span2><Inp value={editForm.product} onChange={e=>setEditForm(f=>({...f,product:e.target.value}))}/></Field>
            <Field label="Amount (Rs.)"><Inp type="number" value={editForm.amount} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))}/></Field>
            <Field label="Status">
              <Sel value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}
                options={['pending','processing','completed','rejected']}/>
            </Field>
            <Field label="Refund Method">
              <Sel value={editForm.method} onChange={e=>setEditForm(f=>({...f,method:e.target.value}))}
                options={['Original payment','Store credit','Bank transfer','UPI','Wallet','N/A']}/>
            </Field>
            <Field label="Resolved On"><Inp type="date" value={editForm.resolvedOn||''} onChange={e=>setEditForm(f=>({...f,resolvedOn:e.target.value||null}))}/></Field>
            <Field label="Reason" span2><Inp value={editForm.reason} onChange={e=>setEditForm(f=>({...f,reason:e.target.value}))}/></Field>
          </div>
        </Modal>
      )}

      {/* ══ MONTH PICKER MODAL ══ */}
      {monthModal && (
        <Modal
          title="Filter by Month"
          sub="Select a month to narrow results"
          onClose={() => setMonthModal(false)}
          footer={<Btn onClick={() => setMonthModal(false)} style={{flex:1,justifyContent:'center'}}>Close</Btn>}
        >
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {MONTHS.map(m => (
              <button key={m} onClick={() => { setMonth(m); setPage(0); setMonthModal(false); }}
                style={{
                  padding:'10px 8px', borderRadius:8, border:'1px solid',
                  cursor:'pointer', fontWeight:700, fontSize:'.78rem',
                  fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'all .13s',
                  borderColor: month===m ? '#E03E1A' : '#e2e8f0',
                  background:  month===m ? '#fff0ed' : '#f8fafc',
                  color:       month===m ? '#E03E1A' : '#475569',
                }}>
                {m}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}