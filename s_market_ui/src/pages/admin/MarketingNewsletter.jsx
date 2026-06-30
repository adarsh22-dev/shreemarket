import React, { useState, useEffect } from 'react';
import './MarketingNewsletter.css';
import {
  Mail, Gift, Plus, Search, Edit2, Trash2, Send, Users,
  TrendingUp, BarChart2, Eye, CheckCircle, XCircle, Clock,
  UserPlus, Copy, Check, Calendar, Target, ArrowRight,
  Download, Filter, ChevronDown, X, AlertCircle, Star,
  Award, Repeat, DollarSign, Link, Zap, Globe
} from 'lucide-react';
import { getNewsletterCampaigns, createNewsletterCampaign, deleteNewsletterCampaign, getSubscriberLists, createSubscriberList, getReferrers, createReferrer, deleteReferrer } from '../../api/api';

/* ── helpers ── */
const fmt  = n => n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
const fmtN = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}k` : n;
const nowStr = () => new Date().toISOString().slice(0,16).replace('T',' ');

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
  const map = { success:['#f0fdf4','#16a34a','#bbf7d0','✓'], error:['#fee2e2','#dc2626','#fecaca','✕'], info:['#dbeafe','#2563eb','#bfdbfe','ℹ'] };
  const [bg,fg,border,ico] = map[type]||map.info;
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:bg,color:fg,border:`1px solid ${border}`,padding:'10px 18px',borderRadius:10,fontSize:'.82rem',fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px rgba(0,0,0,.14)',zIndex:2000,whiteSpace:'nowrap',animation:'nl-toast-in .22s ease',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {ico} {msg}
    </div>
  );
};

const Toggle = ({ on, onChange }) => (
  <button className={`nl-toggle ${on?'nl-toggle--on':''}`} onClick={()=>onChange(!on)} type="button">
    <span className="nl-toggle__knob"/>
  </button>
);

/* ── Modal shell ── */
const Modal = ({ title, onClose, children, footer, maxW=500 }) => (
  <div className="mk-overlay" onClick={onClose}>
    <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:maxW,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.18)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
      <div className="mk-modal__hdr">
        <h3>{title}</h3>
        <button className="mk-modal__close" onClick={onClose}><X size={16}/></button>
      </div>
      <div className="mk-modal__body">{children}</div>
      {footer && <div className="mk-modal__ftr">{footer}</div>}
    </div>
  </div>
);

const FRow = ({ label, children }) => <div className="mk-frow"><label>{label}</label>{children}</div>;
const Inp = (props) => <input className="mk-inp" {...props}/>;
const Sel = ({ value, onChange, options }) => (
  <select className="mk-inp" value={value} onChange={onChange}
    style={{appearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',paddingRight:30}}>
    {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>
);

/* ══════════════════════════════════════════  DATA  ══════════════════════════════════════════ */
const NL_STATUS_COLORS = {
  sent:      { bg:'#dcfce7', color:'#16a34a' },
  scheduled: { bg:'#dbeafe', color:'#2563eb' },
  draft:     { bg:'#f1f5f9', color:'#64748b' },
  failed:    { bg:'#fee2e2', color:'#dc2626' },
};

const PROGRAM_CONFIG_INIT = {
  referrerReward:180, refereeReward:150, minOrderForReward:500,
  maxReferralsPerUser:20, rewardExpiry:30, active:true,
  tiers:[
    { name:'Bronze', min:1,  max:4,  bonus:'₹200 per referral',  color:'#cd7f32' },
    { name:'Silver', min:5,  max:9,  bonus:'₹300 per referral',  color:'#94a3b8' },
    { name:'Gold',   min:10, max:19, bonus:'₹500 per referral',  color:'#d97706' },
    { name:'Super',  min:20, max:null,bonus:'₹800 + free delivery',color:'#E03E1A' },
  ]
};

const TIER_COLORS = { Super:'#E03E1A', Gold:'#d97706', Silver:'#64748b', Bronze:'#cd7f32' };
const EMPTY_CAMPAIGN = { subject:'', listId:'all', scheduled:'', status:'draft' };

export default function MarketingNewsletter() {
  const [tab,        setTab]        = useState('newsletter');
  const [campaigns,  setCampaigns]  = useState([]);
  const [lists,      setLists]      = useState([]);
  const [config,     setConfig]     = useState(PROGRAM_CONFIG_INIT);
  const [referrers,  setReferrers]  = useState([]);
  useEffect(() => {
    getNewsletterCampaigns().then(setCampaigns).catch(() => {});
    getSubscriberLists().then(setLists).catch(() => {});
    getReferrers().then(setReferrers).catch(() => {});
  }, []);
  const [search,     setSearch]     = useState('');
  const [toast,      setToast]      = useState(null);
  const [copied,     setCopied]     = useState(null);

  /* Campaign modals */
  const [campaignModal, setCampaignModal] = useState(null); // null | 'new' | campaign-obj
  const [form,          setForm]          = useState(EMPTY_CAMPAIGN);
  const [deleteModal,   setDeleteModal]   = useState(null);
  const [sendModal,     setSendModal]     = useState(null);

  /* Referral modals */
  const [configEdit,  setConfigEdit]  = useState(false);
  const [tempConfig,  setTempConfig]  = useState(config);
  const [refEditModal, setRefEditModal] = useState(null); // referrer obj
  const [refForm,      setRefForm]     = useState({});

  const showToast = (msg, type='success') => setToast({ msg, type });

  /* ── Campaign: open new / edit ── */
  const openNew  = () => { setForm({...EMPTY_CAMPAIGN}); setCampaignModal('new'); };
  const openEdit = (c) => { setForm({ subject:c.subject, listId:c.listId, scheduled:c.scheduled||'', status:c.status }); setCampaignModal(c); };

  /* ── Campaign: save ── */
  const saveCampaign = async (sendNow=false) => {
    const status   = sendNow ? 'sent' : (form.scheduled ? 'scheduled' : 'draft');
    try {
      if (campaignModal === 'new') {
        await createNewsletterCampaign({ ...form, status });
        showToast(sendNow?'Campaign sent!':status==='scheduled'?'Campaign scheduled':'Saved as draft');
      } else {
        await deleteNewsletterCampaign(campaignModal.id);
        await createNewsletterCampaign({ ...form, status });
        showToast(sendNow?'Campaign sent!':'Campaign updated');
      }
      const data = await getNewsletterCampaigns();
      setCampaigns(data);
    } catch (e) { showToast(e.message, 'error'); }
    setCampaignModal(null);
  };

  /* ── Campaign: quick send from table ── */
  const quickSend = async (c) => {
    try {
      await deleteNewsletterCampaign(c.id);
      await createNewsletterCampaign({ ...c, status:'sent', scheduled:null });
      const data = await getNewsletterCampaigns();
      setCampaigns(data);
      showToast(`"${c.subject.slice(0,30)}…" sent!`);
    } catch (e) { showToast(e.message, 'error'); }
    setSendModal(null);
  };

  /* ── Campaign: delete ── */
  const confirmDelete = async () => {
    try {
      await deleteNewsletterCampaign(deleteModal.id);
      const data = await getNewsletterCampaigns();
      setCampaigns(data);
      showToast(`Campaign deleted`,'error');
    } catch (e) { showToast(e.message, 'error'); }
    setDeleteModal(null);
  };

  /* ── Export CSV ── */
  const handleExport = () => {
    if (tab==='newsletter') {
      const rows=[['ID','Subject','List','Status','Recipients','Opens','Clicks','Unsubscribes','Sent','Scheduled'],
        ...campaigns.map(c=>[c.id,c.subject,c.listId,c.status,c.recipients,c.opens,c.clicks,c.unsubscribes,c.sent||'',c.scheduled||''])];
      const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
      const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'newsletter_campaigns.csv'});
      a.click(); URL.revokeObjectURL(a.href);
      showToast('CSV downloaded');
    } else if (tab==='referral') {
      const rows=[['ID','Name','Email','Tier','Referrals','Earned','Redeemed','Pending','Code'],
        ...referrers.map(r=>[r.id,r.name,r.email,r.tier,r.refs,r.earned,r.redeemed,r.earned-r.redeemed,r.code])];
      const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
      const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'referrers.csv'});
      a.click(); URL.revokeObjectURL(a.href);
      showToast('Referrers CSV downloaded');
    } else {
      const rows=[['ID','List Name','Subscribers','Growth'],
        ...lists.map(l=>[l.id,l.name,l.count,l.growth])];
      const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
      const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'subscriber_lists.csv'});
      a.click(); URL.revokeObjectURL(a.href);
      showToast('Lists CSV downloaded');
    }
  };

  /* ── Lists tab campaign button ── */
  const launchListCampaign = (listId) => {
    setForm({ subject:'', listId, scheduled:'', status:'draft' });
    setCampaignModal('new');
    setTab('newsletter');
  };

  /* ── Referrer edit ── */
  const openRefEdit = (r) => { setRefForm({...r}); setRefEditModal(r); };
  const saveRefEdit = async () => {
    try {
      await deleteReferrer(refEditModal.id);
      await createReferrer(refForm);
      const data = await getReferrers();
      setReferrers(data);
      showToast(`${refForm.name} updated`);
    } catch (e) { showToast(e.message, 'error'); }
    setRefEditModal(null);
  };

  /* ── Config ── */
  const saveConfig = () => { setConfig({...tempConfig}); setConfigEdit(false); showToast('Referral settings saved'); };

  /* ── Copy code ── */
  const copyCTA = code => { navigator.clipboard?.writeText(code).catch(()=>{}); setCopied(code); setTimeout(()=>setCopied(null),1600); };

  /* ── KPIs ── */
  const totalSubs     = lists.length > 0 ? lists.reduce((s, l) => s + (l.count || 0), 0) : 0;
  const sentCampaigns = campaigns.filter(c=>c.status==='sent');
  const avgOpenRate   = sentCampaigns.length>0 ? (sentCampaigns.reduce((s,c)=>s+((c.opens/c.recipients)*100),0)/sentCampaigns.length).toFixed(1) : 0;
  const totalReferrals      = referrers.reduce((s,r)=>s+r.refs,0);
  const totalReferralEarned = referrers.reduce((s,r)=>s+r.earned,0);

  const filteredCampaigns = campaigns.filter(c=>c.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="nl">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Header */}
      <div className="nl-hdr">
        <div>
          <h2 className="nl-hdr__title">Newsletter & Referral Program</h2>
          <p className="nl-hdr__sub">Email campaigns, subscriber lists and reward-based referral tracking</p>
        </div>
        <div className="nl-hdr__acts">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}><Download size={13} color="#475569"/>Export CSV</button>
          {tab==='newsletter' && (
            <button className="vm-btn vm-btn--primary" onClick={openNew}><Plus size={13} color="#fff"/>New Campaign</button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="nl-kpis">
        <div className="nl-kpi"><div className="nl-kpi__icon" style={{background:'#fff0ed'}}><Mail size={18} color="#E03E1A"/></div><div><div className="nl-kpi__val">{fmtN(totalSubs)}</div><div className="nl-kpi__lbl">Total Subscribers</div></div></div>
        <div className="nl-kpi"><div className="nl-kpi__icon" style={{background:'#f0fdf4'}}><Eye size={18} color="#16a34a"/></div><div><div className="nl-kpi__val">{avgOpenRate}%</div><div className="nl-kpi__lbl">Avg Open Rate</div></div></div>
        <div className="nl-kpi"><div className="nl-kpi__icon" style={{background:'#eff6ff'}}><UserPlus size={18} color="#2563eb"/></div><div><div className="nl-kpi__val">{totalReferrals}</div><div className="nl-kpi__lbl">Total Referrals</div></div></div>
        <div className="nl-kpi"><div className="nl-kpi__icon" style={{background:'#fef9ec'}}><DollarSign size={18} color="#d97706"/></div><div><div className="nl-kpi__val">{fmt(totalReferralEarned)}</div><div className="nl-kpi__lbl">Referral Rewards Given</div></div></div>
      </div>

      {/* Tabs */}
      <div className="nl-tabs">
        <button className={`nl-tab ${tab==='newsletter'?'nl-tab--active':''}`} onClick={()=>setTab('newsletter')}><Mail size={14}/> Newsletter</button>
        <button className={`nl-tab ${tab==='lists'?'nl-tab--active':''}`} onClick={()=>setTab('lists')}><Users size={14}/> Subscriber Lists</button>
        <button className={`nl-tab ${tab==='referral'?'nl-tab--active':''}`} onClick={()=>setTab('referral')}><Gift size={14}/> Referral Program</button>
      </div>

      {/* ═══════════════ NEWSLETTER TAB ═══════════════ */}
      {tab==='newsletter' && (
        <div className="nl-card">
          <div className="nl-toolbar">
            <div className="nl-search">
              <Search size={14} color="#94a3b8"/>
              <input className="nl-search__inp" placeholder="Search campaigns…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <div className="nl-tw">
            <table className="nl-tbl">
              <thead>
                <tr>
                  <th>Campaign</th><th>List</th><th>Date / Scheduled</th>
                  <th>Recipients</th><th>Opens</th><th>Clicks</th>
                  <th>Unsubs</th><th>Status</th><th className="nl-th-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.length===0 && (
                  <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:'.82rem'}}>No campaigns found.</td></tr>
                )}
                {filteredCampaigns.map(c=>{
                  const st       = NL_STATUS_COLORS[c.status]||NL_STATUS_COLORS.draft;
                  const openRate = c.recipients>0 ? ((c.opens/c.recipients)*100).toFixed(1) : 0;
                  const ctr      = c.opens>0 ? ((c.clicks/c.opens)*100).toFixed(1) : 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="nl-subj-cell">
                          <div className="nl-subj-icon"><Mail size={13} color="#E03E1A"/></div>
                          <div className="nl-subj">{c.subject}</div>
                        </div>
                      </td>
                      <td><span className="nl-list-badge">{c.listId}</span></td>
                      <td><div className="nl-date"><Clock size={11} color="#94a3b8"/>{c.sent||c.scheduled||'—'}</div></td>
                      <td className="nl-bold">{c.recipients>0?fmtN(c.recipients):'—'}</td>
                      <td>{c.opens>0?(<div className="nl-stat-cell"><span className="nl-bold">{fmtN(c.opens)}</span><span className="nl-sub">{openRate}%</span></div>):'—'}</td>
                      <td>{c.clicks>0?(<div className="nl-stat-cell"><span className="nl-bold">{fmtN(c.clicks)}</span><span className="nl-sub">{ctr}% CTR</span></div>):'—'}</td>
                      <td className="nl-bold">{c.unsubscribes>0?c.unsubscribes:'—'}</td>
                      <td><span className="mk-badge" style={st}>{c.status}</span></td>
                      <td>
                        <div className="nl-acts">
                          {(c.status==='draft'||c.status==='scheduled') && (
                            <button className="vm-btn vm-btn--primary vm-btn--sm" onClick={()=>setSendModal(c)}>
                              <Send size={11} color="#fff"/>Send Now
                            </button>
                          )}
                          <button className="vm-ib vm-ib--edit" title="Edit" onClick={()=>openEdit(c)}><Edit2 size={12}/></button>
                          <button className="vm-ib vm-ib--del"  title="Delete" onClick={()=>setDeleteModal(c)}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ lists TAB ═══════════════ */}
      {tab==='lists' && (
        <div className="nl-lists-grid">
          {lists.map(l=>(
            <div key={l.id} className="nl-list-card">
              <div className="nl-list-card__top">
                <div className="nl-list-card__icon"><Users size={16} color="#E03E1A"/></div>
                <div className={`nl-list-growth ${l.growth.startsWith('+')?'nl-list-growth--up':'nl-list-growth--down'}`}>{l.growth}</div>
              </div>
              <div className="nl-list-card__name">{l.name}</div>
              <div className="nl-list-card__count">{fmtN(l.count)}</div>
              <div className="nl-list-card__lbl">subscribers</div>
              <div className="nl-list-card__foot">
                <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={()=>launchListCampaign(l.id)}>
                  <Send size={11} color="#475569"/>Campaign
                </button>
                <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={()=>{
                  const csv=`"List","Subscribers","Growth"\n"${l.name}","${l.count}","${l.growth}"`;
                  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:`list_${l.id}.csv`});
                  a.click(); URL.revokeObjectURL(a.href);
                  showToast(`${l.name} exported`);
                }}>
                  <Download size={11} color="#475569"/>Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ REFERRAL TAB ═══════════════ */}
      {tab==='referral' && (
        <div className="nl-referral">
          {/* Program Config */}
          <div className="nl-ref-config">
            <div className="nl-ref-config__hdr">
              <div>
                <div className="nl-ref-config__title">Referral Program Settings</div>
                <div className="nl-ref-config__sub">Configure rewards, limits and tier bonuses</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Toggle on={config.active} onChange={v=>{setConfig(c=>({...c,active:v}));showToast(v?'Program activated':'Program paused',v?'success':'info');}}/>
                <span style={{fontSize:'.75rem',fontWeight:700,color:config.active?'#16a34a':'#94a3b8'}}>{config.active?'Active':'Paused'}</span>
                <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={()=>{setTempConfig({...config});setConfigEdit(true);}}>
                  <Edit2 size={12} color="#475569"/>Edit
                </button>
              </div>
            </div>
            <div className="nl-ref-config__grid">
              {[
                {l:'Referrer Reward',          v:`₹${config.referrerReward}`},
                {l:'Referee Reward (New User)',  v:`₹${config.refereeReward}`},
                {l:'Min Order for Reward',       v:`₹${config.minOrderForReward}`},
                {l:'Max Referrals / User',        v:config.maxReferralsPerUser},
                {l:'Reward Expiry',               v:`${config.rewardExpiry} days`},
              ].map((item,i)=>(
                <div key={i} className="nl-ref-cfg-item">
                  <span className="nl-ref-cfg-lbl">{item.l}</span>
                  <span className="nl-ref-cfg-val">{item.v}</span>
                </div>
              ))}
            </div>
            <div className="nl-tiers">
              {config.tiers.map(t=>(
                <div key={t.name} className="nl-tier" style={{borderLeftColor:t.color}}>
                  <div className="nl-tier__name" style={{color:t.color}}>{t.name}</div>
                  <div className="nl-tier__range">{t.min}–{t.max??'∞'} refs</div>
                  <div className="nl-tier__bonus">{t.bonus}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="nl-card">
            <div className="nl-card__hdr">
              <div>
                <div className="nl-card__title">Top Referrers</div>
                <div className="nl-card__sub">All-time referral leaders with earnings</div>
              </div>
              <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={handleExport}>
                <Download size={11} color="#475569"/>Export
              </button>
            </div>
            <div className="nl-tw">
              <table className="nl-tbl">
                <thead>
                  <tr><th>#</th><th>Referrer</th><th>Code</th><th>Tier</th><th>Referrals</th><th>Earned</th><th>Redeemed</th><th>Pending</th><th className="nl-th-r">Actions</th></tr>
                </thead>
                <tbody>
                  {referrers.map((r,i)=>(
                    <tr key={r.id}>
                      <td>
                        {i<3?(
                          <span className="nl-rank" style={{background:['#FFD700','#C0C0C0','#cd7f32'][i]}}>{i+1}</span>
                        ):(
                          <span className="nl-rank nl-rank--plain">{i+1}</span>
                        )}
                      </td>
                      <td>
                        <div className="nl-ref-user">
                          <div className="nl-ref-avatar">{r.name.split(' ').map(n=>n[0]).join('')}</div>
                          <div><div className="nl-ref-name">{r.name}</div><div className="nl-ref-email">{r.email}</div></div>
                        </div>
                      </td>
                      <td>
                        <div className="mk-code-cell">
                          <span className="mk-code">{r.code}</span>
                          <button className="mk-copy" onClick={()=>copyCTA(r.code)}>
                            {copied===r.code?<Check size={11} color="#16a34a"/>:<Copy size={11} color="#94a3b8"/>}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="nl-tier-badge" style={{background:`${TIER_COLORS[r.tier]}18`,color:TIER_COLORS[r.tier]}}>
                          <Award size={10}/> {r.tier}
                        </span>
                      </td>
                      <td className="nl-bold">{r.refs}</td>
                      <td className="nl-bold">{fmt(r.earned)}</td>
                      <td className="nl-bold">{fmt(r.redeemed)}</td>
                      <td className={`nl-bold ${r.earned-r.redeemed>0?'nl-pending':''}`}>{fmt(r.earned-r.redeemed)}</td>
                      <td>
                        <div className="nl-acts">
                          <button className="vm-ib vm-ib--edit" title="Edit" onClick={()=>openRefEdit(r)}><Edit2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CAMPAIGN MODAL (New / Edit) ═══════════════ */}
      {campaignModal && (
        <Modal title={campaignModal==='new'?'New Email Campaign':'Edit Campaign'} onClose={()=>setCampaignModal(null)}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setCampaignModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--outline" onClick={()=>saveCampaign(false)}>
              {form.scheduled?<><Calendar size={13}/>Schedule</>:<>Save Draft</>}
            </button>
            <button className="vm-btn vm-btn--primary" disabled={!form.subject.trim()} onClick={()=>saveCampaign(!form.scheduled)}>
              <Send size={13} color="#fff"/> {form.scheduled?'Schedule':'Send Now'}
            </button>
          </>}>
          <FRow label="Subject Line">
            <Inp autoFocus placeholder="e.g. Exclusive Offer Inside…" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
          </FRow>
          <FRow label="Subscriber List">
            <Sel value={form.listId} onChange={e=>setForm(f=>({...f,listId:e.target.value}))}
              options={lists.map(l=>({v:l.id,l:`${l.name} (${fmtN(l.count)})`}))}/>
          </FRow>
          <FRow label="Schedule (leave blank to send now)">
            <Inp type="datetime-local" value={form.scheduled} onChange={e=>setForm(f=>({...f,scheduled:e.target.value}))}/>
          </FRow>
          {form.listId && (
            <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'10px 12px',fontSize:'.78rem',color:'#2563eb',fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
              <Target size={13} color="#2563eb"/>
              Estimated reach: <strong>{fmtN(lists.find(l=>l.id===form.listId)?.count||0)}</strong> subscribers
            </div>
          )}
        </Modal>
      )}

      {/* ═══════════════ SEND CONFIRM MODAL ═══════════════ */}
      {sendModal && (
        <Modal title="Send Campaign Now" onClose={()=>setSendModal(null)} maxW={420}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setSendModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--primary" onClick={()=>quickSend(sendModal)}>
              <Send size={13} color="#fff"/>Confirm & Send
            </button>
          </>}>
          <div style={{background:'#dbeafe',border:'1px solid #bfdbfe',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#2563eb',fontWeight:600}}>
            ℹ This will immediately send to <strong>{fmtN(lists.find(l=>l.id===sendModal.listId)?.count||0)}</strong> subscribers in the <strong>{lists.find(l=>l.id===sendModal.listId)?.name}</strong> list.
          </div>
          {[{l:'Subject',v:sendModal.subject},{l:'List',v:lists.find(l=>l.id===sendModal.listId)?.name},{l:'Status',v:sendModal.status}].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<2?'1px solid #f1f5f9':'none',gap:12}}>
              <span style={{fontSize:'.74rem',color:'#94a3b8',fontWeight:600}}>{r.l}</span>
              <span style={{fontSize:'.82rem',color:'#0f172a',fontWeight:700,textAlign:'right'}}>{r.v}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* ═══════════════ DELETE CONFIRM ═══════════════ */}
      {deleteModal && (
        <Modal title="Delete Campaign" onClose={()=>setDeleteModal(null)} maxW={400}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setDeleteModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--primary" style={{background:'#dc2626'}} onClick={confirmDelete}>
              <Trash2 size={13} color="#fff"/>Delete
            </button>
          </>}>
          <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#dc2626',fontWeight:600}}>
            ✕ Delete <strong>"{deleteModal.subject}"</strong>? This cannot be undone.
          </div>
        </Modal>
      )}

      {/* ═══════════════ REFERRAL CONFIG MODAL ═══════════════ */}
      {configEdit && (
        <Modal title="Edit Referral Settings" onClose={()=>setConfigEdit(false)}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setConfigEdit(false)}>Cancel</button>
            <button className="vm-btn vm-btn--primary" onClick={saveConfig}><Check size={13} color="#fff"/>Save Settings</button>
          </>}>
          <div className="mk-fgrid">
            <FRow label="Referrer Reward (₹)"><Inp type="number" value={tempConfig.referrerReward} onChange={e=>setTempConfig(c=>({...c,referrerReward:+e.target.value}))}/></FRow>
            <FRow label="Referee Reward (₹)"><Inp type="number" value={tempConfig.refereeReward} onChange={e=>setTempConfig(c=>({...c,refereeReward:+e.target.value}))}/></FRow>
            <FRow label="Min Order for Reward (₹)"><Inp type="number" value={tempConfig.minOrderForReward} onChange={e=>setTempConfig(c=>({...c,minOrderForReward:+e.target.value}))}/></FRow>
            <FRow label="Max Referrals / User"><Inp type="number" value={tempConfig.maxReferralsPerUser} onChange={e=>setTempConfig(c=>({...c,maxReferralsPerUser:+e.target.value}))}/></FRow>
          </div>
          <FRow label="Reward Expiry (days)"><Inp type="number" value={tempConfig.rewardExpiry} onChange={e=>setTempConfig(c=>({...c,rewardExpiry:+e.target.value}))}/></FRow>
        </Modal>
      )}

      {/* ═══════════════ REFERRER EDIT MODAL ═══════════════ */}
      {refEditModal && (
        <Modal title="Edit Referrer" sub={refEditModal.name} onClose={()=>setRefEditModal(null)}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setRefEditModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--primary" onClick={saveRefEdit}><Check size={13} color="#fff"/>Save</button>
          </>}>
          <div className="mk-fgrid">
            <FRow label="Name"><Inp value={refForm.name} onChange={e=>setRefForm(f=>({...f,name:e.target.value}))}/></FRow>
            <FRow label="Email"><Inp type="email" value={refForm.email} onChange={e=>setRefForm(f=>({...f,email:e.target.value}))}/></FRow>
            <FRow label="Total Referrals"><Inp type="number" value={refForm.refs} onChange={e=>setRefForm(f=>({...f,refs:e.target.value}))}/></FRow>
            <FRow label="Total Earned (₹)"><Inp type="number" value={refForm.earned} onChange={e=>setRefForm(f=>({...f,earned:e.target.value}))}/></FRow>
            <FRow label="Total Redeemed (₹)"><Inp type="number" value={refForm.redeemed} onChange={e=>setRefForm(f=>({...f,redeemed:e.target.value}))}/></FRow>
            <FRow label="Tier">
              <Sel value={refForm.tier} onChange={e=>setRefForm(f=>({...f,tier:e.target.value}))} options={['Bronze','Silver','Gold','Super']}/>
            </FRow>
          </div>
          <FRow label="Referral Code"><Inp value={refForm.code} onChange={e=>setRefForm(f=>({...f,code:e.target.value}))}/></FRow>
        </Modal>
      )}
    </div>
  );
}