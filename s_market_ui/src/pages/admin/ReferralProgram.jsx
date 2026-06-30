import React, { useState, useEffect } from 'react';
import './ReferralProgram.css';
import {
  Gift, Award, Users, TrendingUp, DollarSign,
  Edit2, Copy, Check, Search, Download, Star,
  ChevronUp, ChevronDown, Settings, X, Plus,
  ToggleLeft, BarChart2, Repeat, Target, Zap,
  Crown, Shield, Medal, Trash2
} from 'lucide-react';
import { getReferrers, createReferrer, deleteReferrer } from '../../api/api';

/* ── helpers ── */
const fmt  = n => n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
const fmtN = n => n >= 1e3 ? `${(n/1e3).toFixed(1)}k` : String(n);

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
  const map = {
    success: ['#f0fdf4','#16a34a','#bbf7d0','✓'],
    error:   ['#fee2e2','#dc2626','#fecaca','✕'],
    info:    ['#dbeafe','#2563eb','#bfdbfe','ℹ'],
  };
  const [bg,fg,border,ico] = map[type] || map.info;
  return (
    <div style={{
      position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
      background:bg, color:fg, border:`1px solid ${border}`,
      padding:'10px 18px', borderRadius:10, fontSize:'.82rem', fontWeight:600,
      display:'flex', alignItems:'center', gap:8,
      boxShadow:'0 8px 24px rgba(0,0,0,.14)', zIndex:2000,
      whiteSpace:'nowrap', animation:'rp-toast-in .22s ease',
      fontFamily:"'Plus Jakarta Sans',sans-serif"
    }}>
      {ico} {msg}
    </div>
  );
};

/* ── Program Config ── */
const INIT_CONFIG = {
  active: true,
  referrerReward: 200,
  refereeReward: 150,
  minOrderForReward: 500,
  maxReferralsPerUser: 20,
  rewardExpiry: 30,
  doubleRewardActive: false,
  doubleRewardMultiplier: 2,
};

const TIERS = [
  { id:'bronze', name:'Bronze', icon: Medal,  color:'#cd7f32', bg:'#fdf4e7', min:1,  max:4,   baseBonus:200, perks:['₹200 per referral','Standard support'] },
  { id:'silver', name:'Silver', icon: Shield, color:'#64748b', bg:'#f8fafc', min:5,  max:9,   baseBonus:300, perks:['₹300 per referral','Priority support','+50 loyalty pts'] },
  { id:'gold',   name:'Gold',   icon: Star,   color:'#d97706', bg:'#fefce8', min:10, max:19,  baseBonus:500, perks:['₹500 per referral','Dedicated support','+100 loyalty pts','Exclusive badge'] },
  { id:'super',  name:'Super',  icon: Crown,  color:'#E03E1A', bg:'#fff0ed', min:20, max:null,baseBonus:800, perks:['₹800 per referral','VIP support','+200 loyalty pts','Free delivery','Early access'] },
];
const TIER_META = { bronze:TIERS[0], silver:TIERS[1], gold:TIERS[2], super:TIERS[3] };

const EMPTY_REFERRER = { name:'', email:'', code:'', tier:'bronze', refs:0, earned:0, redeemed:0, pending:0, joined:'', active:true, userId: null };

export default function ReferralProgram() {
  const [referrers, setReferrers] = useState([]);
  useEffect(() => { getReferrers().then(setReferrers).catch(() => {}); }, []);
  const [config,    setConfig]    = useState(INIT_CONFIG);
  const [search,    setSearch]    = useState('');
  const [sortKey,   setSortKey]   = useState('refs');
  const [sortDir,   setSortDir]   = useState('desc');
  const [copied,    setCopied]    = useState(null);
  const [toast,     setToast]     = useState(null);

  /* Modals */
  const [configOpen,   setConfigOpen]   = useState(false);
  const [tempConfig,   setTempConfig]   = useState(config);
  const [editModal,    setEditModal]    = useState(null);  // referrer obj | 'new'
  const [editForm,     setEditForm]     = useState({});
  const [deleteModal,  setDeleteModal]  = useState(null);  // referrer obj
  const [toggleModal,  setToggleModal]  = useState(null);  // referrer obj

  const showToast = (msg, type='success') => setToast({ msg, type });

  /* ── Toggle component ── */
  const Toggle = ({ on, onChange }) => (
    <button className={`rp-toggle ${on?'rp-toggle--on':''}`} onClick={()=>onChange(!on)} type="button">
      <span className="rp-toggle__knob"/>
    </button>
  );

  /* ── Copy code ── */
  const copyCode = code => {
    navigator.clipboard?.writeText(code).catch(()=>{});
    setCopied(code);
    setTimeout(()=>setCopied(null), 1600);
    showToast(`Code "${code}" copied!`);
  };

  /* ── Sort ── */
  const sorted = [...referrers]
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      const av = a[sortKey], bv = b[sortKey];
      return sortDir==='desc' ? bv - av : av - bv;
    });

  const handleSort = key => {
    if (key === sortKey) setSortDir(d => d==='desc'?'asc':'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortIcon = ({ k }) => sortKey===k
    ? (sortDir==='desc'?<ChevronDown size={11}/>:<ChevronUp size={11}/>)
    : <ChevronDown size={11} style={{opacity:.3}}/>;

  /* ── Config save ── */
  const saveConfig = () => {
    setConfig({...tempConfig});
    setConfigOpen(false);
    showToast('Settings saved');
  };

  /* ── Edit referrer ── */
  const openEdit = r => {
    setEditForm({ ...r });
    setEditModal(r);
  };
  const openNew = () => {
    setEditForm({ ...EMPTY_REFERRER, joined: new Date().toISOString().slice(0,10) });
    setEditModal('new');
  };
  const saveEdit = async () => {
    const form = {
      ...editForm,
      refs:     Number(editForm.refs)     || 0,
      earned:   Number(editForm.earned)   || 0,
      redeemed: Number(editForm.redeemed) || 0,
      pending:  Number(editForm.pending)  || 0,
    };
    try {
      if (editModal === 'new') {
        await createReferrer(form);
        showToast(`${form.name} added`);
      } else {
        await deleteReferrer(editModal.id);
        await createReferrer(form);
        showToast(`${form.name} updated`);
      }
      const data = await getReferrers();
      setReferrers(data);
    } catch (e) { showToast(e.message, 'error'); }
    setEditModal(null);
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    try {
      await deleteReferrer(deleteModal.id);
      const data = await getReferrers();
      setReferrers(data);
      showToast(`${deleteModal.name} removed`, 'error');
    } catch (e) { showToast(e.message, 'error'); }
    setDeleteModal(null);
  };

  /* ── Toggle active ── */
  const confirmToggle = () => {
    setReferrers(prev => prev.map(r => r.id===toggleModal.id ? {...r, active:!r.active} : r));
    showToast(`${toggleModal.name} ${toggleModal.active?'deactivated':'activated'}`, toggleModal.active?'error':'success');
    setToggleModal(null);
  };

  /* ── Export CSV ── */
  const handleExport = () => {
    const rows = [
      ['ID','Name','Email','Code','Tier','Referrals','Earned','Redeemed','Pending','Status','Joined'],
      ...referrers.map(r=>[r.id,r.name,r.email,r.code,r.tier,r.refs,r.earned,r.redeemed,r.pending,r.active?'Active':'Inactive',r.joined])
    ];
    const csv  = rows.map(row => row.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a    = Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:'referrers.csv' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Referrers CSV downloaded');
  };

  /* ── KPIs ── */
  const totalRefs    = referrers.reduce((s,r)=>s+r.refs,0);
  const totalEarned  = referrers.reduce((s,r)=>s+r.earned,0);
  const totalPending = referrers.reduce((s,r)=>s+r.pending,0);
  const superCount   = referrers.filter(r=>r.tier==='super').length;
  const tierCounts   = TIERS.map(t => ({ ...t, count: referrers.filter(r=>r.tier===t.id).length }));

  return (
    <div className="rp">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Header */}
      <div className="rp-hdr">
        <div>
          <h2 className="rp-hdr__title">Referral Program</h2>
          <p className="rp-hdr__sub">Track referrals, manage rewards and configure programme settings</p>
        </div>
        <div className="rp-hdr__acts">
          <button className="rp-btn rp-btn--outline" onClick={handleExport}><Download size={13} color="#475569"/>Export CSV</button>
          <button className="rp-btn rp-btn--outline" onClick={()=>{setTempConfig({...config});setConfigOpen(true);}}>
            <Settings size={13} color="#475569"/>Settings
          </button>
          <button className="rp-btn rp-btn--primary" onClick={openNew}>
            <Plus size={13} color="#fff"/>Add Referrer
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rp-status-bar ${config.active?'rp-status-bar--on':'rp-status-bar--off'}`}>
        <div className="rp-status-bar__left">
          <Gift size={16} color={config.active?'#16a34a':'#94a3b8'}/>
          <span>Referral Program is <strong>{config.active?'Active':'Paused'}</strong></span>
          {config.doubleRewardActive && (
            <span className="rp-double-badge"><Zap size={10}/>2× Reward Active</span>
          )}
        </div>
        <Toggle on={config.active} onChange={v=>{setConfig(c=>({...c,active:v}));showToast(v?'Program activated':'Program paused',v?'success':'info');}}/>
      </div>

      {/* KPIs */}
      <div className="rp-kpis">
        <div className="rp-kpi"><div className="rp-kpi__icon" style={{background:'#fff0ed'}}><Repeat size={20} color="#E03E1A"/></div><div><div className="rp-kpi__val">{totalRefs}</div><div className="rp-kpi__lbl">Total Referrals</div></div></div>
        <div className="rp-kpi"><div className="rp-kpi__icon" style={{background:'#f0fdf4'}}><Users size={20} color="#16a34a"/></div><div><div className="rp-kpi__val">{referrers.filter(r=>r.active).length}</div><div className="rp-kpi__lbl">Active Referrers</div></div></div>
        <div className="rp-kpi"><div className="rp-kpi__icon" style={{background:'#eff6ff'}}><DollarSign size={20} color="#2563eb"/></div><div><div className="rp-kpi__val">{fmt(totalEarned)}</div><div className="rp-kpi__lbl">Rewards Issued</div></div></div>
        <div className="rp-kpi"><div className="rp-kpi__icon" style={{background:'#fef9ec'}}><TrendingUp size={20} color="#d97706"/></div><div><div className="rp-kpi__val">{fmt(totalPending)}</div><div className="rp-kpi__lbl">Pending Payouts</div></div></div>
        <div className="rp-kpi"><div className="rp-kpi__icon" style={{background:'#fff0ed'}}><Crown size={20} color="#E03E1A"/></div><div><div className="rp-kpi__val">{superCount}</div><div className="rp-kpi__lbl">Super Referrers</div></div></div>
      </div>

      {/* Main body */}
      <div className="rp-body">
        <div className="rp-main">
          {/* Config summary */}
          <div className="rp-cfg-row">
            {[
              {l:'Referrer Reward', v:`₹${config.referrerReward}`},
              {l:'New User Reward',  v:`₹${config.refereeReward}`},
              {l:'Min Order',        v:`₹${config.minOrderForReward}`},
              {l:'Max Refs/User',    v:config.maxReferralsPerUser},
              {l:'Reward Expiry',    v:`${config.rewardExpiry}d`},
            ].map((item,i)=>(
              <div key={i} className="rp-cfg-item">
                <span>{item.l}</span><strong>{item.v}</strong>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="rp-search">
            <Search size={14} color="#94a3b8"/>
            <input className="rp-search__inp" placeholder="Search by name or code…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Table */}
          <div className="rp-card">
            <div className="rp-tw">
              <table className="rp-tbl">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Referrer</th>
                    <th>Code</th>
                    <th>Tier</th>
                    <th className="rp-th-sort" onClick={()=>handleSort('refs')}>Refs <SortIcon k="refs"/></th>
                    <th className="rp-th-sort" onClick={()=>handleSort('earned')}>Earned <SortIcon k="earned"/></th>
                    <th className="rp-th-sort" onClick={()=>handleSort('pending')}>Pending <SortIcon k="pending"/></th>
                    <th>Status</th>
                    <th className="rp-th-r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length===0 && (
                    <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>No referrers match your search.</td></tr>
                  )}
                  {sorted.map((r, i) => {
                    const tier = TIER_META[r.tier];
                    const TierIcon = tier?.icon;
                    const rankColors = ['#FFD700','#C0C0C0','#cd7f32'];
                    return (
                      <tr key={r.id} className={!r.active?'rp-row--inactive':''}>
                        <td>
                          <div className="rp-rank" style={i<3?{background:rankColors[i],color:'#fff'}:{background:'#f1f5f9',color:'#64748b'}}>{i+1}</div>
                        </td>
                        <td>
                          <div className="rp-user">
                            <div className="rp-avatar" style={{background:tier?.color||'#94a3b8'}}>{(r.name||'')[0]}</div>
                            <div>
                              <div className="rp-user__name">{r.name}</div>
                              <div className="rp-user__email">{r.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="rp-code-cell">
                            <span className="rp-code">{r.code}</span>
                            <button className="rp-copy" title="Copy code" onClick={()=>copyCode(r.code)}>
                              {copied===r.code?<Check size={11} color="#16a34a"/>:<Copy size={11} color="#94a3b8"/>}
                            </button>
                          </div>
                        </td>
                        <td>
                          {tier && (
                            <span className="rp-tier-badge" style={{background:tier.bg,color:tier.color}}>
                              <TierIcon size={10}/> {tier.name}
                            </span>
                          )}
                        </td>
                        <td><span className="rp-num">{r.refs}</span></td>
                        <td><span className="rp-num">{fmt(r.earned)}</span></td>
                        <td><span className={`rp-num ${r.pending>0?'rp-num--warn':''}`}>{r.pending>0?fmt(r.pending):'—'}</span></td>
                        <td>
                          <span className={`rp-status ${r.active?'rp-status--active':'rp-status--inactive'}`}>
                            {r.active?'Active':'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="rp-acts">
                            {/* Edit */}
                            <button className="rp-ib rp-ib--edit" title="Edit" onClick={()=>openEdit(r)}><Edit2 size={12}/></button>
                            {/* Toggle active */}
                            <button className={`rp-ib ${r.active?'rp-ib--pause':'rp-ib--play'}`}
                              title={r.active?'Deactivate':'Activate'}
                              onClick={()=>setToggleModal(r)}>
                              {r.active
                                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                            </button>
                            {/* Delete */}
                            <button className="rp-ib rp-ib--del" title="Delete" onClick={()=>setDeleteModal(r)}><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="rp-sidebar">
          <div className="rp-card rp-card--tiers">
            <div className="rp-card__title">Tier Breakdown</div>
            {tierCounts.map(t=>{
              const TierIcon = t.icon;
              const pct = referrers.length>0 ? Math.round((t.count/referrers.length)*100) : 0;
              return (
                <div key={t.id} className="rp-tier-row">
                  <div className="rp-tier-row__top">
                    <div className="rp-tier-row__name" style={{color:t.color}}><TierIcon size={14}/> {t.name}</div>
                    <div className="rp-tier-row__meta">
                      <span className="rp-tier-row__count">{t.count}</span>
                      <span className="rp-tier-row__pct">{pct}%</span>
                    </div>
                  </div>
                  <div className="rp-tier-bar"><div className="rp-tier-bar__fill" style={{width:`${pct}%`,background:t.color}}/></div>
                  <div className="rp-tier-row__range">{t.min}–{t.max??'∞'} referrals · ₹{t.baseBonus}/ref</div>
                </div>
              );
            })}
          </div>

          <div className="rp-card rp-card--perks">
            <div className="rp-card__title">Tier Perks</div>
            {TIERS.map(t=>{
              const TierIcon = t.icon;
              return (
                <div key={t.id} className="rp-perks-row">
                  <div className="rp-perks-hdr" style={{color:t.color}}><TierIcon size={13}/> {t.name}</div>
                  <ul className="rp-perks-list">{t.perks.map((p,i)=><li key={i}>{p}</li>)}</ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ SETTINGS MODAL ══ */}
      {configOpen && (
        <div className="rp-overlay" onClick={()=>setConfigOpen(false)}>
          <div className="rp-modal" onClick={e=>e.stopPropagation()}>
            <div className="rp-modal__hdr">
              <h3>Programme Settings</h3>
              <button className="rp-modal__close" onClick={()=>setConfigOpen(false)}><X size={16}/></button>
            </div>
            <div className="rp-modal__body">
              <div className="rp-fgrid">
                <div className="rp-frow"><label>Referrer Reward (₹)</label><input className="rp-inp" type="number" value={tempConfig.referrerReward} onChange={e=>setTempConfig(c=>({...c,referrerReward:+e.target.value}))}/></div>
                <div className="rp-frow"><label>New User Reward (₹)</label><input className="rp-inp" type="number" value={tempConfig.refereeReward} onChange={e=>setTempConfig(c=>({...c,refereeReward:+e.target.value}))}/></div>
                <div className="rp-frow"><label>Min Order Value (₹)</label><input className="rp-inp" type="number" value={tempConfig.minOrderForReward} onChange={e=>setTempConfig(c=>({...c,minOrderForReward:+e.target.value}))}/></div>
                <div className="rp-frow"><label>Max Referrals / User</label><input className="rp-inp" type="number" value={tempConfig.maxReferralsPerUser} onChange={e=>setTempConfig(c=>({...c,maxReferralsPerUser:+e.target.value}))}/></div>
              </div>
              <div className="rp-frow"><label>Reward Expiry (days)</label><input className="rp-inp" type="number" value={tempConfig.rewardExpiry} onChange={e=>setTempConfig(c=>({...c,rewardExpiry:+e.target.value}))}/></div>
              <div className="rp-toggle-row">
                <div>
                  <div className="rp-toggle-row__label">Double Reward Event</div>
                  <div className="rp-toggle-row__sub">Temporarily multiply all rewards by {tempConfig.doubleRewardMultiplier}×</div>
                </div>
                <Toggle on={tempConfig.doubleRewardActive} onChange={v=>setTempConfig(c=>({...c,doubleRewardActive:v}))}/>
              </div>
            </div>
            <div className="rp-modal__ftr">
              <button className="rp-btn rp-btn--outline" onClick={()=>setConfigOpen(false)}>Cancel</button>
              <button className="rp-btn rp-btn--primary" onClick={saveConfig}><Check size={13} color="#fff"/>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT / NEW REFERRER MODAL ══ */}
      {editModal && (
        <div className="rp-overlay" onClick={()=>setEditModal(null)}>
          <div className="rp-modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="rp-modal__hdr">
              <h3>{editModal==='new'?'Add Referrer':'Edit Referrer'}</h3>
              <button className="rp-modal__close" onClick={()=>setEditModal(null)}><X size={16}/></button>
            </div>
            <div className="rp-modal__body">
              <div className="rp-fgrid">
                <div className="rp-frow" style={{gridColumn:'1/-1'}}>
                  <label>Full Name</label>
                  <input className="rp-inp" autoFocus value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Priya Sharma"/>
                </div>
                <div className="rp-frow">
                  <label>Email</label>
                  <input className="rp-inp" type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com"/>
                </div>
                <div className="rp-frow">
                  <label>Referral Code</label>
                  <input className="rp-inp" value={editForm.code} onChange={e=>setEditForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="MYCODE10"/>
                </div>
                <div className="rp-frow">
                  <label>Tier</label>
                  <select className="rp-inp rp-sel" value={editForm.tier} onChange={e=>setEditForm(f=>({...f,tier:e.target.value}))}>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="super">Super</option>
                  </select>
                </div>
                <div className="rp-frow">
                  <label>Total Referrals</label>
                  <input className="rp-inp" type="number" value={editForm.refs} onChange={e=>setEditForm(f=>({...f,refs:e.target.value}))}/>
                </div>
                <div className="rp-frow">
                  <label>Total Earned (₹)</label>
                  <input className="rp-inp" type="number" value={editForm.earned} onChange={e=>setEditForm(f=>({...f,earned:e.target.value}))}/>
                </div>
                <div className="rp-frow">
                  <label>Total Redeemed (₹)</label>
                  <input className="rp-inp" type="number" value={editForm.redeemed} onChange={e=>setEditForm(f=>({...f,redeemed:e.target.value}))}/>
                </div>
                <div className="rp-frow">
                  <label>Pending Payout (₹)</label>
                  <input className="rp-inp" type="number" value={editForm.pending} onChange={e=>setEditForm(f=>({...f,pending:e.target.value}))}/>
                </div>
              </div>
              <div className="rp-toggle-row">
                <div>
                  <div className="rp-toggle-row__label">Active Status</div>
                  <div className="rp-toggle-row__sub">Inactive referrers won't earn new rewards</div>
                </div>
                <Toggle on={!!editForm.active} onChange={v=>setEditForm(f=>({...f,active:v}))}/>
              </div>
            </div>
            <div className="rp-modal__ftr">
              <button className="rp-btn rp-btn--outline" onClick={()=>setEditModal(null)}>Cancel</button>
              <button className="rp-btn rp-btn--primary" disabled={!editForm.name?.trim()} onClick={saveEdit}>
                <Check size={13} color="#fff"/>{editModal==='new'?'Add Referrer':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TOGGLE ACTIVE CONFIRM ══ */}
      {toggleModal && (
        <div className="rp-overlay" onClick={()=>setToggleModal(null)}>
          <div className="rp-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="rp-modal__hdr">
              <h3>{toggleModal.active?'Deactivate':'Activate'} Referrer</h3>
              <button className="rp-modal__close" onClick={()=>setToggleModal(null)}><X size={16}/></button>
            </div>
            <div className="rp-modal__body">
              <div style={{background:toggleModal.active?'#fee2e2':'#f0fdf4',border:`1px solid ${toggleModal.active?'#fecaca':'#bbf7d0'}`,borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:toggleModal.active?'#dc2626':'#16a34a',fontWeight:600}}>
                {toggleModal.active?'✕ Deactivating':'✓ Activating'} <strong>{toggleModal.name}</strong> — {toggleModal.active?'they will no longer earn referral rewards.':'they will start earning referral rewards again.'}
              </div>
            </div>
            <div className="rp-modal__ftr">
              <button className="rp-btn rp-btn--outline" onClick={()=>setToggleModal(null)}>Cancel</button>
              <button className="rp-btn rp-btn--primary" style={toggleModal.active?{background:'#dc2626'}:{background:'#16a34a'}} onClick={confirmToggle}>
                {toggleModal.active?<><X size={13} color="#fff"/>Deactivate</>:<><Check size={13} color="#fff"/>Activate</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {deleteModal && (
        <div className="rp-overlay" onClick={()=>setDeleteModal(null)}>
          <div className="rp-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="rp-modal__hdr">
              <h3>Delete Referrer</h3>
              <button className="rp-modal__close" onClick={()=>setDeleteModal(null)}><X size={16}/></button>
            </div>
            <div className="rp-modal__body">
              <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#dc2626',fontWeight:600}}>
                ✕ Delete <strong>{deleteModal.name}</strong> and all their referral data? This cannot be undone.
              </div>
            </div>
            <div className="rp-modal__ftr">
              <button className="rp-btn rp-btn--outline" onClick={()=>setDeleteModal(null)}>Cancel</button>
              <button className="rp-btn rp-btn--primary" style={{background:'#dc2626'}} onClick={confirmDelete}>
                <Trash2 size={13} color="#fff"/>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}