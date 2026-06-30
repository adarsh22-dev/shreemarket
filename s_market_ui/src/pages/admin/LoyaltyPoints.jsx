import React, { useState, useEffect } from 'react';
import './LoyaltyPoints.css';
import { Icon, initials, avatarBg, fmt, fmtDate } from './VendorShared';
import { getLoyaltyCustomers, createLoyaltyCustomer } from '../../api/api';

const TIERS = {
  bronze:   { min:0,     max:999,      color:'#f97316', bg:'#fff7ed', border:'#fed7aa', perks:['5% cashback','Birthday bonus'] },
  silver:   { min:1000,  max:4999,     color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', perks:['8% cashback','Free shipping','Birthday bonus'] },
  gold:     { min:5000,  max:19999,    color:'#d97706', bg:'#fef9c3', border:'#fde68a', perks:['12% cashback','Priority support','Free shipping','Early access'] },
  platinum: { min:20000, max:Infinity, color:'#6d28d9', bg:'#ede9fe', border:'#c4b5fd', perks:['18% cashback','Dedicated manager','Free express','VIP events','Early access'] },
};

const TIER_ORDER = ['bronze','silver','gold','platinum'];

/* Derive tier from points */
const deriveTier = pts => {
  if (pts >= 20000) return 'platinum';
  if (pts >= 5000)  return 'gold';
  if (pts >= 1000)  return 'silver';
  return 'bronze';
};

const PER = 6;

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  const colors = { success:['#f0fdf4','#16a34a','#bbf7d0'], error:['#fee2e2','#dc2626','#fecaca'], info:['#dbeafe','#2563eb','#bfdbfe'] };
  const [bg, fg, border] = colors[type] || colors.info;
  return (
    <div style={{
      position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
      background:bg, color:fg, border:`1px solid ${border}`,
      padding:'10px 18px', borderRadius:10, fontSize:'.82rem', fontWeight:600,
      display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 24px rgba(0,0,0,.14)',
      zIndex:500, whiteSpace:'nowrap', animation:'lp-toast-in .22s ease',
      fontFamily:"'Plus Jakarta Sans',sans-serif"
    }}>
      {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} {msg}
    </div>
  );
};

/* ── Modal shell ── */
const Modal = ({ title, sub, onClose, children, footer }) => (
  <div style={{
    position:'fixed', inset:0, background:'rgba(15,23,42,.44)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:400, padding:16, backdropFilter:'blur(3px)'
  }} onClick={onClose}>
    <div style={{
      background:'#fff', borderRadius:16, width:'100%', maxWidth:460,
      maxHeight:'90vh', display:'flex', flexDirection:'column',
      boxShadow:'0 24px 64px rgba(0,0,0,.18)', overflow:'hidden'
    }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'20px 22px 16px', borderBottom:'1px solid #f1f5f9', flexShrink:0}}>
        <div>
          <p style={{margin:'0 0 3px', fontSize:'1rem', fontWeight:800, color:'#0f172a'}}>{title}</p>
          {sub && <p style={{margin:0, fontSize:'.72rem', color:'#94a3b8'}}>{sub}</p>}
        </div>
        <button onClick={onClose} style={{width:28, height:28, borderRadius:7, border:'1px solid #e8ecf0', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', flexShrink:0}}>
          <Icon name="X" size={14}/>
        </button>
      </div>
      {/* Body */}
      <div style={{padding:'20px 22px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:14}}>
        {children}
      </div>
      {/* Footer */}
      {footer && (
        <div style={{display:'flex', gap:8, padding:'14px 22px', borderTop:'1px solid #f1f5f9', flexShrink:0}}>
          {footer}
        </div>
      )}
    </div>
  </div>
);

/* ── Form field ── */
const Field = ({ label, children }) => (
  <div style={{display:'flex', flexDirection:'column', gap:5}}>
    <label style={{fontSize:'.71rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.3px'}}>{label}</label>
    {children}
  </div>
);
const Inp = (props) => (
  <input style={{
    width:'100%', padding:'9px 11px', border:'1px solid #e2e8f0', borderRadius:8,
    fontSize:'.82rem', fontWeight:500, color:'#0f172a', background:'#fff',
    outline:'none', fontFamily:"'Plus Jakarta Sans',sans-serif",
    transition:'border-color .15s, box-shadow .15s'
  }} {...props}
  onFocus={e => { e.target.style.borderColor='#E03E1A'; e.target.style.boxShadow='0 0 0 3px rgba(224,62,26,.08)'; }}
  onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
  />
);
const Sel = ({ value, onChange, options }) => (
  <select value={value} onChange={onChange} style={{
    width:'100%', padding:'9px 30px 9px 11px', border:'1px solid #e2e8f0', borderRadius:8,
    fontSize:'.82rem', fontWeight:500, color:'#0f172a', background:'#fff',
    appearance:'none', outline:'none', cursor:'pointer',
    fontFamily:"'Plus Jakarta Sans',sans-serif",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center'
  }}>
    {options.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>
);

/* ── Primary / outline btn ── */
const Btn = ({ children, onClick, variant='outline', size='md', style={} }) => {
  const base = {
    display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer',
    borderRadius:8, fontWeight:700, transition:'all .15s', whiteSpace:'nowrap',
    fontFamily:"'Plus Jakarta Sans',sans-serif",
    padding: size==='sm' ? '5px 10px' : '8px 14px',
    fontSize: size==='sm' ? '.74rem' : '.8rem',
  };
  const variants = {
    outline: { border:'1px solid #e2e8f0', background:'#fff', color:'#475569' },
    primary: { border:'none', background:'#E03E1A', color:'#fff', boxShadow:'0 2px 8px rgba(224,62,26,.22)' },
    danger:  { border:'none', background:'#dc2626', color:'#fff' },
    green:   { border:'1px solid #bbf7d0', background:'#dcfce7', color:'#16a34a' },
  };
  return <button onClick={onClick} style={{...base, ...variants[variant], ...style}}>{children}</button>;
};

export default function LoyaltyPoints() {
  const [loyalty,  setLoyalty]  = useState([]);
  useEffect(() => { getLoyaltyCustomers().then(setLoyalty).catch(() => {}); }, []);
  const [filter,   setFilter]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(0);
  const [sel,      setSel]      = useState(null);
  const [toast,    setToast]    = useState(null);

  /* Modals */
  const [addModal,    setAddModal]    = useState(null);   // customer id OR 'global'
  const [editModal,   setEditModal]   = useState(null);
  const [viewModal,   setViewModal]   = useState(null);

  /* Add-points form */
  const [addForm, setAddForm] = useState({ points:'', reason:'Purchase reward', targetId:'' });

  /* Edit form */
  const [editForm, setEditForm] = useState({});

  /* Global award form (header button) */
  const [globalForm, setGlobalForm] = useState({ targetId:'', points:'', reason:'Bonus reward' });

  const showToast = (msg, type='success') => setToast({ msg, type });

  const filtered = loyalty
    .filter(c => filter==='All' || c.tier===filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));

  const pages = Math.ceil(filtered.length / PER) || 1;
  const slice = filtered.slice(page * PER, (page + 1) * PER);

  const totalPoints   = loyalty.reduce((s,c) => s + c.points, 0);
  const totalEarned   = loyalty.reduce((s,c) => s + c.earned, 0);
  const totalRedeemed = loyalty.reduce((s,c) => s + c.redeemed, 0);

  /* ── Add points (row button) ── */
  const openAddForCustomer = (e, c) => {
    e.stopPropagation();
    setAddForm({ points:'', reason:'Purchase reward', targetId: c.id });
    setAddModal('row');
  };

  const handleAddPoints = () => {
    const pts = Number(addForm.points);
    if (!pts || pts <= 0) return;
    setLoyalty(prev => prev.map(c => {
      if (c.id !== addForm.targetId) return c;
      const newPoints  = c.points + pts;
      const newEarned  = c.earned + pts;
      const newTier    = deriveTier(newPoints);
      return { ...c, points: newPoints, earned: newEarned, tier: newTier };
    }));
    const cust = loyalty.find(c => c.id === addForm.targetId);
    showToast(`+${pts} pts added to ${cust?.name}`, 'success');
    setAddModal(null);
    setAddForm({ points:'', reason:'Purchase reward', targetId:'' });
  };

  /* ── Award Bonus (expand panel button) ── */
  const handleExpandBonus = (e, c) => {
    e.stopPropagation();
    setAddForm({ points:'', reason:'Bonus reward', targetId: c.id });
    setAddModal('row');
  };

  /* ── Global "Award Points" header button ── */
  const openGlobalAward = () => {
    setGlobalForm({ targetId: loyalty[0]?.id || '', points:'', reason:'Bonus reward' });
    setAddModal('global');
  };

  const handleGlobalAward = () => {
    const pts = Number(globalForm.points);
    if (!pts || pts <= 0 || !globalForm.targetId) return;
    setLoyalty(prev => prev.map(c => {
      if (c.id !== globalForm.targetId) return c;
      const newPoints = c.points + pts;
      return { ...c, points: newPoints, earned: c.earned + pts, tier: deriveTier(newPoints) };
    }));
    const cust = loyalty.find(c => c.id === globalForm.targetId);
    showToast(`+${pts} pts awarded to ${cust?.name}`, 'success');
    setAddModal(null);
  };

  /* ── Edit ── */
  const openEdit = (e, c) => {
    e.stopPropagation();
    setEditForm({ ...c });
    setEditModal(c);
  };

  const handleEditSave = () => {
    const pts   = Number(editForm.points);
    const earn  = Number(editForm.earned);
    const red   = Number(editForm.redeemed);
    setLoyalty(prev => prev.map(c => c.id === editModal.id
      ? { ...editForm, points: pts, earned: earn, redeemed: red, tier: deriveTier(pts) }
      : c
    ));
    showToast(`${editForm.name} updated`, 'success');
    setEditModal(null);
  };

  /* ── View ── */
  const openView = (e, c) => {
    e.stopPropagation();
    setViewModal(c);
  };

  /* ── Export CSV ── */
  const handleExport = () => {
    const rows = [
      ['ID','Name','Email','Tier','Points','Earned','Redeemed','Expires','Last Activity'],
      ...loyalty.map(c => [c.id, c.name, c.email, c.tier, c.points, c.earned, c.redeemed, c.expires, c.lastActivity])
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='loyalty_points.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded', 'success');
  };

  return (
    <div className="vm">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}

      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Loyalty Points</h2>
          <p className="vm-hdr__sub">Track and manage customer reward points, tiers and redemptions</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}>
            <Icon name="Download" size={13} color="#475569"/>Export CSV
          </button>
          <button className="vm-btn vm-btn--primary" onClick={openGlobalAward}>
            <Icon name="Gift" size={13} color="#fff"/>Award Points
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Active Points',    value: totalPoints.toLocaleString(),                                        icon:'Star',    c:'#d97706', bg:'#fef3c7', trend:'Across all tiers'                              },
          { label:'Total Earned',     value: totalEarned.toLocaleString(),                                        icon:'TrendUp', c:'#16a34a', bg:'#dcfce7', trend:'+12.4% this month'                             },
          { label:'Total Redeemed',   value: totalRedeemed.toLocaleString(),                                      icon:'Gift',    c:'#7c3aed', bg:'#ede9fe', trend:`${((totalRedeemed/totalEarned)*100).toFixed(1)}% rate` },
          { label:'Platinum Members', value: loyalty.filter(c=>c.tier==='platinum').length,                       icon:'Award',   c:'#E03E1A', bg:'#ffe4de', trend:'Top tier customers'                            },
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background:k.bg}}><Icon name={k.icon} size={18} color={k.c} sw={2.1}/></div>
              <span className="vm-kpi__trend vm-kpi__trend--up">{k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tier overview */}
      <div className="vm-2col">
        {Object.entries(TIERS).reverse().map(([tier, info]) => {
          const count = loyalty.filter(c => c.tier === tier).length;
          const pts   = loyalty.filter(c => c.tier === tier).reduce((s,c) => s + c.points, 0);
          return (
            <div key={tier} className="vm-card" style={{borderTop:`3px solid ${info.color}`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                <div>
                  <span className={`vm-badge vm-badge--${tier}`}><span className="vm-badge__dot"/>{tier[0].toUpperCase()+tier.slice(1)}</span>
                  <p style={{fontSize:'.73rem', color:'#94a3b8', marginTop:6}}>{info.min.toLocaleString()} – {info.max===Infinity?'∞':info.max.toLocaleString()} pts</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'1.4rem', fontWeight:800, color:'#0f172a', lineHeight:1}}>{count}</div>
                  <div style={{fontSize:'.7rem', color:'#94a3b8'}}>members</div>
                </div>
              </div>
              <div style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:6}}>Perks:</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                {info.perks.map((p, i) => (
                  <span key={i} style={{fontSize:'.67rem', padding:'2px 8px', borderRadius:999, background:info.bg, color:info.color, border:`1px solid ${info.border}`, fontWeight:600}}>{p}</span>
                ))}
              </div>
              <div style={{marginTop:10, fontSize:'.75rem', color:'#94a3b8'}}>{pts.toLocaleString()} total active points</div>
            </div>
          );
        })}
      </div>

      {/* Points table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Customer Points Ledger</p>
            <p className="vm-sh__sub">Active balances · Click row for details</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search customer…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}/>
            </div>
            <div className="vm-pills">
              {['All','platinum','gold','silver','bronze'].map(f => (
                <button key={f} className={`vm-pill${filter===f?' vm-pill--active':''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f === 'All' ? 'All' : f[0].toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Tier</th>
                <th>Active Points</th>
                <th>Total Earned</th>
                <th>Redeemed</th>
                <th>Points Bar</th>
                <th>Expires</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map(c => {
                const info = TIERS[c.tier];
                const pct  = c.tier === 'platinum' ? 100 : Math.min(100, Math.round((c.points - info.min) / (info.max - info.min) * 100));
                return (
                  <React.Fragment key={c.id}>
                    <tr style={{cursor:'pointer', background: sel===c.id ? '#fff8f6' : undefined}}
                      onClick={() => setSel(sel === c.id ? null : c.id)}>
                      <td>
                        <div className="vm-vcell">
                          <div className="vm-av vm-av--sm" style={{background:avatarBg(c.name)}}>{initials(c.name)}</div>
                          <div>
                            <div className="vm-vcell__name">{c.name}</div>
                            <div className="vm-vcell__id">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`vm-badge vm-badge--${c.tier}`} style={{fontSize:'.65rem', padding:'2px 8px'}}>
                          <span className="vm-badge__dot"/>{c.tier[0].toUpperCase()+c.tier.slice(1)}
                        </span>
                      </td>
                      <td><span style={{fontWeight:800, fontSize:'.9rem', color:info.color}}>{c.points.toLocaleString()}</span></td>
                      <td><span style={{fontWeight:700, fontSize:'.83rem', color:'#0f172a'}}>{c.earned.toLocaleString()}</span></td>
                      <td><span style={{fontWeight:600, fontSize:'.83rem', color:'#64748b'}}>{c.redeemed.toLocaleString()}</span></td>
                      <td style={{minWidth:120}}>
                        <div style={{height:6, background:'#f1f5f9', borderRadius:999, overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${pct}%`, background:info.color, borderRadius:999, transition:'width .4s'}}/>
                        </div>
                        <div style={{fontSize:'.63rem', color:'#94a3b8', marginTop:3}}>
                          {c.tier === 'platinum' ? 'Max tier' : `${pct}% to next`}
                        </div>
                      </td>
                      <td><span style={{fontSize:'.75rem', color:'#94a3b8'}}>{fmtDate ? fmtDate(c.expires) : c.expires}</span></td>
                      <td><span style={{fontSize:'.75rem', color:'#94a3b8'}}>{fmtDate ? fmtDate(c.lastActivity) : c.lastActivity}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex', gap:4}}>
                          {/* Add points */}
                          <button className="vm-btn vm-btn--outline vm-btn--sm lp-btn-add"
                            title="Add points"
                            onClick={e => openAddForCustomer(e, c)}>
                            <Icon name="Plus" size={11} color="#16a34a"/>Add
                          </button>
                          {/* View */}
                          <button className="vm-btn vm-btn--outline vm-btn--sm"
                            title="View details"
                            onClick={e => openView(e, c)}>
                            <Icon name="Eye" size={11} color="#475569"/>
                          </button>
                          {/* Edit */}
                          <button className="vm-btn vm-btn--outline vm-btn--sm"
                            title="Edit record"
                            onClick={e => openEdit(e, c)}>
                            <Icon name="Edit2" size={11} color="#2563eb"/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail panel */}
                    {sel === c.id && (
                      <tr>
                        <td colSpan={9} style={{padding:0}}>
                          <div style={{padding:16, background:'#fff8f6', borderBottom:'1px solid #fde8e4', borderTop:'2px solid #E03E1A', animation:'lp-slide .18s ease'}}>
                            <div style={{marginBottom:10, fontSize:'.85rem', fontWeight:700, color:'#0f172a'}}>
                              Membership Perks — {c.tier[0].toUpperCase()+c.tier.slice(1)}
                            </div>
                            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
                              {info.perks.map((p, i) => (
                                <span key={i} style={{fontSize:'.72rem', padding:'3px 10px', borderRadius:999, background:info.bg, color:info.color, border:`1px solid ${info.border}`, fontWeight:600, display:'flex', alignItems:'center', gap:4}}>
                                  <Icon name="CheckCircle" size={11} color={info.color}/>{p}
                                </span>
                              ))}
                            </div>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
                              {[
                                { label:'Active Balance',  value:`${c.points.toLocaleString()} pts` },
                                { label:'Lifetime Earned', value:`${c.earned.toLocaleString()} pts` },
                                { label:'Total Redeemed',  value:`${c.redeemed.toLocaleString()} pts` },
                              ].map((item, i) => (
                                <div key={i} style={{background:'#fff', border:'1px solid #f1f5f9', borderRadius:8, padding:'10px 12px'}}>
                                  <div style={{fontSize:'.65rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px'}}>{item.label}</div>
                                  <div style={{fontSize:'1rem', fontWeight:800, color:'#0f172a', marginTop:3}}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{marginTop:10, display:'flex', gap:8, justifyContent:'flex-end'}}>
                              <button className="vm-btn vm-btn--primary vm-btn--sm"
                                onClick={e => handleExpandBonus(e, c)}>
                                <Icon name="Gift" size={12} color="#fff"/>Award Bonus
                              </button>
                              <button className="vm-btn vm-btn--outline vm-btn--sm"
                                onClick={e => { e.stopPropagation(); openEdit(e, c); }}>
                                <Icon name="Edit2" size={12} color="#475569"/>Edit
                              </button>
                              <button className="vm-btn vm-btn--outline vm-btn--sm"
                                onClick={e => { e.stopPropagation(); setSel(null); }}>
                                <Icon name="X" size={12} color="#475569"/>Close
                              </button>
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
          <span className="vm-pag__info">{page*PER+1}–{Math.min((page+1)*PER, filtered.length)} of {filtered.length}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p=>p-1)} disabled={page===0}><Icon name="ChevLeft" size={12}/></button>
            <span className="vm-pag__label">{page+1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p=>p+1)} disabled={(page+1)*PER>=filtered.length}><Icon name="ChevRight" size={12}/></button>
          </div>
        </div>
      </div>

      {/* ══ ADD POINTS MODAL (row + expand bonus) ══ */}
      {addModal === 'row' && (
        <Modal
          title="Add Points"
          sub={`Customer: ${loyalty.find(c=>c.id===addForm.targetId)?.name || ''}`}
          onClose={() => setAddModal(null)}
          footer={<>
            <Btn onClick={() => setAddModal(null)} style={{flex:1, justifyContent:'center'}}>Cancel</Btn>
            <Btn onClick={handleAddPoints} variant="primary" style={{flex:1, justifyContent:'center'}}>
              <Icon name="Plus" size={13} color="#fff"/>Add Points
            </Btn>
          </>}
        >
          <Field label="Points to Add">
            <Inp type="number" min={1} placeholder="e.g. 500" autoFocus
              value={addForm.points}
              onChange={e => setAddForm(f=>({...f, points:e.target.value}))}/>
          </Field>
          <Field label="Reason">
            <Sel value={addForm.reason} onChange={e => setAddForm(f=>({...f, reason:e.target.value}))}
              options={['Purchase reward','Bonus reward','Referral bonus','Birthday bonus','Manual adjustment','Promotion']}/>
          </Field>
          {addForm.points > 0 && (() => {
            const cust    = loyalty.find(c => c.id === addForm.targetId);
            const newPts  = (cust?.points || 0) + Number(addForm.points);
            const newTier = deriveTier(newPts);
            const tierUp  = cust && TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(cust.tier);
            return (
              <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px', fontSize:'.82rem', color:'#16a34a', fontWeight:600}}>
                ✓ New balance: <strong>{newPts.toLocaleString()} pts</strong>
                {tierUp && <span style={{marginLeft:8, background:'#dcfce7', padding:'2px 8px', borderRadius:999}}>🎉 Tier upgrade → {newTier[0].toUpperCase()+newTier.slice(1)}</span>}
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ══ GLOBAL AWARD MODAL (header button) ══ */}
      {addModal === 'global' && (
        <Modal
          title="Award Points to Customer"
          sub="Select a customer and enter points"
          onClose={() => setAddModal(null)}
          footer={<>
            <Btn onClick={() => setAddModal(null)} style={{flex:1, justifyContent:'center'}}>Cancel</Btn>
            <Btn onClick={handleGlobalAward} variant="primary" style={{flex:1, justifyContent:'center'}}>
              <Icon name="Gift" size={13} color="#fff"/>Award Points
            </Btn>
          </>}
        >
          <Field label="Select Customer">
            <Sel value={globalForm.targetId} onChange={e => setGlobalForm(f=>({...f, targetId:e.target.value}))}
              options={loyalty.map(c => ({ v:c.id, l:`${c.name} (${c.id}) — ${c.points.toLocaleString()} pts` }))}/>
          </Field>
          <Field label="Points to Award">
            <Inp type="number" min={1} placeholder="e.g. 1000" autoFocus
              value={globalForm.points}
              onChange={e => setGlobalForm(f=>({...f, points:e.target.value}))}/>
          </Field>
          <Field label="Reason">
            <Sel value={globalForm.reason} onChange={e => setGlobalForm(f=>({...f, reason:e.target.value}))}
              options={['Bonus reward','Purchase reward','Referral bonus','Birthday bonus','Promotion','Manual adjustment']}/>
          </Field>
          {globalForm.points > 0 && globalForm.targetId && (() => {
            const cust   = loyalty.find(c => c.id === globalForm.targetId);
            const newPts = (cust?.points || 0) + Number(globalForm.points);
            const newTier = deriveTier(newPts);
            const tierUp  = cust && TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(cust.tier);
            return (
              <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px', fontSize:'.82rem', color:'#16a34a', fontWeight:600}}>
                ✓ New balance: <strong>{newPts.toLocaleString()} pts</strong>
                {tierUp && <span style={{marginLeft:8, background:'#dcfce7', padding:'2px 8px', borderRadius:999}}>🎉 Tier upgrade → {newTier[0].toUpperCase()+newTier.slice(1)}</span>}
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ══ EDIT MODAL ══ */}
      {editModal && (
        <Modal
          title="Edit Loyalty Record"
          sub={`${editModal.name} · ${editModal.id}`}
          onClose={() => setEditModal(null)}
          footer={<>
            <Btn onClick={() => setEditModal(null)} style={{flex:1, justifyContent:'center'}}>Cancel</Btn>
            <Btn onClick={handleEditSave} variant="primary" style={{flex:1, justifyContent:'center'}}>
              <Icon name="Check" size={13} color="#fff"/>Save Changes
            </Btn>
          </>}
        >
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div style={{gridColumn:'1/-1'}}>
              <Field label="Customer Name">
                <Inp value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/>
              </Field>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <Field label="Email">
                <Inp type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/>
              </Field>
            </div>
            <Field label="Points Balance">
              <Inp type="number" value={editForm.points} onChange={e=>setEditForm(f=>({...f,points:e.target.value}))}/>
            </Field>
            <Field label="Total Earned">
              <Inp type="number" value={editForm.earned} onChange={e=>setEditForm(f=>({...f,earned:e.target.value}))}/>
            </Field>
            <Field label="Total Redeemed">
              <Inp type="number" value={editForm.redeemed} onChange={e=>setEditForm(f=>({...f,redeemed:e.target.value}))}/>
            </Field>
            <Field label="Expiry Date">
              <Inp type="date" value={editForm.expires} onChange={e=>setEditForm(f=>({...f,expires:e.target.value}))}/>
            </Field>
          </div>
          <div style={{background:'#f8fafc', border:'1px solid #e8ecf0', borderRadius:10, padding:'10px 14px', fontSize:'.78rem', color:'#64748b'}}>
            Tier will be auto-calculated from points balance on save.
          </div>
        </Modal>
      )}

      {/* ══ VIEW MODAL ══ */}
      {viewModal && (
        <Modal
          title="Customer Loyalty Details"
          sub={`${viewModal.name} · ${viewModal.id}`}
          onClose={() => setViewModal(null)}
          footer={
            <Btn onClick={() => setViewModal(null)} style={{flex:1, justifyContent:'center'}}>Close</Btn>
          }
        >
          {[
            { l:'Email',          v: viewModal.email },
            { l:'Tier',           v: viewModal.tier[0].toUpperCase()+viewModal.tier.slice(1) },
            { l:'Points Balance', v: `${viewModal.points.toLocaleString()} pts` },
            { l:'Total Earned',   v: `${viewModal.earned.toLocaleString()} pts` },
            { l:'Total Redeemed', v: `${viewModal.redeemed.toLocaleString()} pts` },
            { l:'Redemption Rate',v: `${((viewModal.redeemed/viewModal.earned)*100).toFixed(1)}%` },
            { l:'Expires',        v: viewModal.expires },
            { l:'Last Activity',  v: viewModal.lastActivity },
          ].map((r, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom: i < 7 ? '1px solid #f1f5f9' : 'none'}}>
              <span style={{fontSize:'.74rem', color:'#94a3b8', fontWeight:600}}>{r.l}</span>
              <span style={{fontSize:'.82rem', color:'#0f172a', fontWeight:700, textAlign:'right'}}>{r.v}</span>
            </div>
          ))}
          <div style={{background:'#f8fafc', border:'1px solid #e8ecf0', borderRadius:10, padding:'12px 14px'}}>
            <div style={{fontSize:'.69rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6}}>Perks</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
              {TIERS[viewModal.tier].perks.map((p, i) => {
                const info = TIERS[viewModal.tier];
                return <span key={i} style={{fontSize:'.7rem', padding:'2px 9px', borderRadius:999, background:info.bg, color:info.color, border:`1px solid ${info.border}`, fontWeight:600}}>{p}</span>;
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}