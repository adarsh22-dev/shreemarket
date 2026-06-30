import React, { useState, useEffect } from 'react';
import './MarketingBanners.css';
import {
  Image, Bell, Plus, Edit2, Trash2, Eye, EyeOff,
  Search, Download, Monitor, Smartphone, Tablet,
  ArrowRight, Clock, Send, Users, CheckCircle, XCircle,
  BarChart2, TrendingUp, Target, Megaphone, Calendar,
  Globe, X, Check, ChevronDown, AlertCircle, Filter,
  Link, Layers
} from 'lucide-react';
import { getBanners, createBanner, deleteBanner, getPushNotifications, createPushNotification, deletePushNotification } from '../../api/api';

/* ── helpers ── */
const fmt  = n => n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
const fmtN = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}k` : n;
const today = () => new Date().toISOString().slice(0,16);

/* ── Toast ── */
const Toast = ({ msg, type, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
  const map = { success:['#f0fdf4','#16a34a','#bbf7d0','✓'], error:['#fee2e2','#dc2626','#fecaca','✕'], info:['#dbeafe','#2563eb','#bfdbfe','ℹ'] };
  const [bg,fg,border,ico] = map[type]||map.info;
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:bg,color:fg,border:`1px solid ${border}`,padding:'10px 18px',borderRadius:10,fontSize:'.82rem',fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px rgba(0,0,0,.14)',zIndex:2000,whiteSpace:'nowrap',animation:'bn-toast-in .22s ease',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {ico} {msg}
    </div>
  );
};

const Toggle = ({ on, onChange }) => (
  <button className={`bn-toggle ${on ? 'bn-toggle--on' : ''}`} onClick={() => onChange(!on)} type="button">
    <span className="bn-toggle__knob" />
  </button>
);

/* ── Modal shell ── */
const Modal = ({ title, onClose, children, footer, maxW=520 }) => (
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

/* ── Form row ── */
const FRow = ({ label, children, half }) => (
  <div className="mk-frow" style={half?{}:{}}><label>{label}</label>{children}</div>
);
const Inp = (props) => <input  className="mk-inp" {...props}/>;
const Sel = ({ value, onChange, options }) => (
  <select className="mk-inp" value={value} onChange={onChange} style={{appearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',paddingRight:30}}>
    {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>
);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const POSITIONS  = ['All','hero','sub-hero','sticky-top','category','sidebar','footer'];
const PAGES      = ['home','all','fashion','grocery','product','category'];
const DEVICES    = ['all','desktop','mobile','tablet'];
const SEGMENTS   = ['all','ordered','wishlist','cart','platinum','inactive','new_users'];
const GRADIENTS  = [
  'linear-gradient(135deg,#ff6b35,#f72585)',
  'linear-gradient(135deg,#6366f1,#0ea5e9)',
  'linear-gradient(135deg,#0f172a,#E03E1A)',
  'linear-gradient(135deg,#ec4899,#a855f7)',
  'linear-gradient(135deg,#16a34a,#0ea5e9)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#7c3aed,#E03E1A)',
  'linear-gradient(135deg,#0ea5e9,#16a34a)',
];

const PUSH_STATUS_COLORS = {
  sent:      { bg:'#dcfce7', color:'#16a34a' },
  scheduled: { bg:'#dbeafe', color:'#2563eb' },
  draft:     { bg:'#f1f5f9', color:'#64748b' },
  failed:    { bg:'#fee2e2', color:'#dc2626' },
};

const EMPTY_BANNER = { title:'', position:'hero', page:'home', device:'all', cta:'Shop Now', url:'', gradient:GRADIENTS[0], startDate:'', endDate:'', active:true };
const EMPTY_PUSH   = { title:'', body:'', segment:'all', scheduled:'', status:'draft' };

export default function MarketingBanners() {
  const [tab,       setTab]       = useState('banners');
  const [banners,   setBanners]   = useState([]);
  const [pushList,  setPushList]  = useState([]);
  useEffect(() => {
    getBanners().then(setBanners).catch(e => showToast(e.message, 'error'));
    getPushNotifications().then(setPushList).catch(e => showToast(e.message, 'error'));
  }, []);
  const [search,    setSearch]    = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [toast,     setToast]     = useState(null);

  /* Banner modals */
  const [bannerModal, setBannerModal] = useState(null); // null | 'new' | banner-object
  const [bannerForm,  setBannerForm]  = useState(EMPTY_BANNER);
  const [deleteModal, setDeleteModal] = useState(null); // banner or push object
  const [deleteType,  setDeleteType]  = useState('');   // 'banner' | 'push'

  /* Push modals */
  const [pushModal, setPushModal] = useState(null); // null | 'new' | push-object
  const [pushForm,  setPushForm]  = useState(EMPTY_PUSH);
  const [sendModal, setSendModal] = useState(null); // push object to send now

  const showToast = (msg, type='success') => setToast({ msg, type });

  /* ── Banner actions ── */
  const toggleBanner = async id => {
    const b = banners.find(b => b.id === id);
    if (!b) return;
    try {
      await deleteBanner(id);
      await createBanner({ ...b, active: !b.active });
      const data = await getBanners();
      setBanners(data);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const openNewBanner = () => { setBannerForm({...EMPTY_BANNER}); setBannerModal('new'); };
  const openEditBanner = (b) => { setBannerForm({...b}); setBannerModal(b); };

  const saveBanner = async () => {
    if (!bannerForm.title.trim()) return;
    try {
      if (bannerModal === 'new') {
        await createBanner(bannerForm);
        showToast('Banner created successfully');
      } else {
        await deleteBanner(bannerModal.id);
        await createBanner({ ...bannerForm });
        showToast('Banner updated');
      }
      const data = await getBanners();
      setBanners(data);
    } catch (e) { showToast(e.message, 'error'); }
    setBannerModal(null);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === 'banner') {
        await deleteBanner(deleteModal.id);
        const data = await getBanners();
        setBanners(data);
        showToast(`${deleteModal.id} deleted`, 'error');
      } else {
        await deletePushNotification(deleteModal.id);
        const data = await getPushNotifications();
        setPushList(data);
        showToast(`${deleteModal.id} deleted`, 'error');
      }
    } catch (e) { showToast(e.message, 'error'); }
    setDeleteModal(null);
  };

  /* ── Push actions ── */
  const openNewPush  = () => { setPushForm({...EMPTY_PUSH}); setPushModal('new'); };
  const openEditPush = (p) => { setPushForm({...p}); setPushModal(p); };

  const savePush = async (statusOverride) => {
    const status = statusOverride || (pushForm.scheduled ? 'scheduled' : pushForm.status === 'draft' ? 'draft' : 'sent');
    try {
      if (pushModal === 'new') {
        await createPushNotification({ ...pushForm, status });
        showToast(status==='sent'?'Campaign sent!':status==='scheduled'?'Campaign scheduled':'Saved as draft');
      } else {
        await deletePushNotification(pushModal.id);
        await createPushNotification({ ...pushForm, status });
        showToast('Campaign updated');
      }
      const data = await getPushNotifications();
      setPushList(data);
    } catch (e) { showToast(e.message, 'error'); }
    setPushModal(null);
  };

  const sendNow = async (p) => {
    try {
      await deletePushNotification(p.id);
      await createPushNotification({ ...p, status:'sent', scheduled:null });
      showToast(`"${p.title}" sent!`,'success');
      const data = await getPushNotifications();
      setPushList(data);
    } catch (e) { showToast(e.message, 'error'); }
    setSendModal(null);
  };

  /* ── Export ── */
  const handleExport = () => {
    if (tab === 'banners') {
      const rows = [['ID','Title','Position','Page','Device','Active','Impressions','Clicks','CTR','Start','End','CTA','URL'],
        ...banners.map(b=>[b.id,b.title,b.position,b.page,b.device,b.active,b.impressions,b.clicks,b.impressions>0?((b.clicks/b.impressions)*100).toFixed(1)+'%':'0%',b.startDate,b.endDate,b.cta,b.url])];
      const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
      const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'banners.csv'});
      a.click(); URL.revokeObjectURL(a.href);
    } else {
      const rows = [['ID','Title','Segment','Status','Delivered','Opened','CTR','Sent','Scheduled'],
        ...pushList.map(p=>[p.id,p.title,p.segment,p.status,p.delivered,p.opened,p.ctr+'%',p.sent||'',p.scheduled||''])];
      const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
      const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'push_campaigns.csv'});
      a.click(); URL.revokeObjectURL(a.href);
    }
    showToast('CSV downloaded');
  };

  /* ── Filtered banners ── */
  const filteredBanners = banners.filter(b => {
    const mS = b.title.toLowerCase().includes(search.toLowerCase());
    const mP = posFilter === 'All' || b.position === posFilter;
    return mS && mP;
  });

  /* ── KPIs ── */
  const totalImpressions = banners.reduce((s,b)=>s+b.impressions,0);
  const totalClicks      = banners.reduce((s,b)=>s+b.clicks,0);
  const avgCtr           = totalImpressions > 0 ? ((totalClicks/totalImpressions)*100).toFixed(1) : 0;
  const activeBanners    = banners.filter(b=>b.active).length;
  const totalDelivered   = pushList.reduce((s,p)=>s+p.delivered,0);
  const scheduledPush    = pushList.filter(p=>p.status==='scheduled').length;

  return (
    <div className="bn">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Header */}
      <div className="bn-hdr">
        <div>
          <h2 className="bn-hdr__title">Banners & Push Notifications</h2>
          <p className="bn-hdr__sub">Manage homepage banners, promotional displays and push campaigns</p>
        </div>
        <div className="bn-hdr__acts">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}><Download size={13} color="#475569"/>Export CSV</button>
          <button className="vm-btn vm-btn--primary" onClick={tab==='banners'?openNewBanner:openNewPush}>
            <Plus size={13} color="#fff"/> {tab==='banners'?'New Banner':'New Campaign'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="bn-kpis">
        <div className="bn-kpi"><div className="bn-kpi__icon" style={{background:'#fff0ed'}}><Image size={18} color="#E03E1A"/></div><div><div className="bn-kpi__val">{activeBanners}</div><div className="bn-kpi__lbl">Active Banners</div></div></div>
        <div className="bn-kpi"><div className="bn-kpi__icon" style={{background:'#f0fdf4'}}><Eye size={18} color="#16a34a"/></div><div><div className="bn-kpi__val">{fmtN(totalImpressions)}</div><div className="bn-kpi__lbl">Impressions</div></div></div>
        <div className="bn-kpi"><div className="bn-kpi__icon" style={{background:'#eff6ff'}}><Target size={18} color="#2563eb"/></div><div><div className="bn-kpi__val">{avgCtr}%</div><div className="bn-kpi__lbl">Avg. CTR</div></div></div>
        <div className="bn-kpi"><div className="bn-kpi__icon" style={{background:'#fef9ec'}}><Bell size={18} color="#d97706"/></div><div><div className="bn-kpi__val">{fmtN(totalDelivered)}</div><div className="bn-kpi__lbl">Push Delivered</div></div></div>
        <div className="bn-kpi"><div className="bn-kpi__icon" style={{background:'#f5f3ff'}}><Clock size={18} color="#7c3aed"/></div><div><div className="bn-kpi__val">{scheduledPush}</div><div className="bn-kpi__lbl">Scheduled Campaigns</div></div></div>
      </div>

      {/* Tabs */}
      <div className="bn-tabs">
        <button className={`bn-tab ${tab==='banners'?'bn-tab--active':''}`} onClick={()=>setTab('banners')}><Image size={14}/> Banners</button>
        <button className={`bn-tab ${tab==='push'?'bn-tab--active':''}`} onClick={()=>setTab('push')}>
          <Bell size={14}/> Push Notifications <span className="bn-tab__badge">{scheduledPush} scheduled</span>
        </button>
      </div>

      {/* ═══════════════ BANNERS TAB ═══════════════ */}
      {tab === 'banners' && (
        <>
          <div className="bn-toolbar">
            <div className="bn-search">
              <Search size={14} color="#94a3b8"/>
              <input className="bn-search__inp" placeholder="Search banners…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="bn-pills">
              {POSITIONS.map(p=>(
                <button key={p} className={`mk-pill ${posFilter===p?'mk-pill--active':''}`} onClick={()=>setPosFilter(p)}>{p}</button>
              ))}
            </div>
          </div>

          <div className="bn-grid">
            {filteredBanners.map(b => {
              const ctr = b.impressions > 0 ? ((b.clicks/b.impressions)*100).toFixed(1) : 0;
              return (
                <div key={b.id} className={`bn-card ${!b.active?'bn-card--inactive':''}`}>
                  <div className="bn-card__preview" style={{background:b.gradient}}>
                    <div className="bn-card__preview-txt">
                      <div className="bn-card__preview-title">{b.title}</div>
                      <div className="bn-card__preview-cta">{b.cta} <ArrowRight size={10}/></div>
                    </div>
                    <div className="bn-card__overlay-acts">
                      <Toggle on={b.active} onChange={()=>toggleBanner(b.id)}/>
                    </div>
                  </div>
                  <div className="bn-card__body">
                    <div className="bn-card__row">
                      <span className="bn-pos-badge">{b.position}</span>
                      <span className="bn-device">
                        {b.device==='all'?<><Monitor size={10}/><Smartphone size={10}/></>:b.device==='desktop'?<Monitor size={10}/>:b.device==='mobile'?<Smartphone size={10}/>:<Tablet size={10}/>}
                        {b.device}
                      </span>
                    </div>
                    <div className="bn-card__stats">
                      <div className="bn-card__stat"><span className="bn-card__stat-val">{fmtN(b.impressions)}</span><span className="bn-card__stat-lbl">Impressions</span></div>
                      <div className="bn-card__stat"><span className="bn-card__stat-val">{fmtN(b.clicks)}</span><span className="bn-card__stat-lbl">Clicks</span></div>
                      <div className="bn-card__stat"><span className="bn-card__stat-val" style={{color:'#E03E1A'}}>{ctr}%</span><span className="bn-card__stat-lbl">CTR</span></div>
                    </div>
                    <div className="bn-card__dates">
                      <Calendar size={10} color="#94a3b8"/>
                      {b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—'}
                      {' – '}
                      {b.endDate ? new Date(b.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </div>
                    <div className="bn-card__foot">
                      <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={()=>openEditBanner(b)}><Edit2 size={11} color="#2563eb"/>Edit</button>
                      <button className="vm-ib vm-ib--del" title="Delete" onClick={()=>{setDeleteModal(b);setDeleteType('banner');}}><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="bn-card bn-card--add" onClick={openNewBanner}>
              <Plus size={28} color="#cbd5e1"/>
              <span>New Banner</span>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ PUSH TAB ═══════════════ */}
      {tab === 'push' && (
        <div className="bn-push-wrap">
          <div className="bn-push-summary">
            <div className="bn-push-stat"><BarChart2 size={14} color="#E03E1A"/><span><strong>{fmtN(pushList.reduce((s,p)=>s+p.delivered,0))}</strong> total delivered</span></div>
            <div className="bn-push-stat"><CheckCircle size={14} color="#16a34a"/><span><strong>{fmtN(pushList.reduce((s,p)=>s+p.opened,0))}</strong> opened</span></div>
            <div className="bn-push-stat">
              <Target size={14} color="#2563eb"/>
              <span><strong>{pushList.filter(p=>p.status==='sent'&&p.delivered>0).length > 0
                ? (pushList.filter(p=>p.status==='sent'&&p.delivered>0).reduce((s,p)=>s+p.ctr,0)/pushList.filter(p=>p.status==='sent'&&p.delivered>0).length).toFixed(1)
                : 0}%</strong> avg open rate</span>
            </div>
          </div>

          <div className="bn-card" style={{overflow:'hidden'}}>
            <div className="bn-tw">
              <table className="bn-tbl">
                <thead>
                  <tr>
                    <th>Notification</th>
                    <th>Segment</th>
                    <th>Schedule / Sent</th>
                    <th>Delivered</th>
                    <th>Opened</th>
                    <th>Open Rate</th>
                    <th>Status</th>
                    <th className="bn-th-r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pushList.map(p => {
                    const st = PUSH_STATUS_COLORS[p.status]||PUSH_STATUS_COLORS.draft;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="bn-push-cell">
                            <div className="bn-push-icon"><Bell size={13} color="#E03E1A"/></div>
                            <div>
                              <div className="bn-push-title">{p.title}</div>
                              <div className="bn-push-body">{p.body.length>55?p.body.slice(0,55)+'…':p.body}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="bn-seg">{p.segment}</span></td>
                        <td><div className="bn-time"><Clock size={11} color="#94a3b8"/>{p.sent||p.scheduled||'—'}</div></td>
                        <td className="bn-bold">{p.delivered>0?fmtN(p.delivered):'—'}</td>
                        <td className="bn-bold">{p.opened>0?fmtN(p.opened):'—'}</td>
                        <td>
                          {p.ctr>0?(
                            <div className="bn-ctr">
                              <span className="bn-ctr__val" style={{color:p.ctr>50?'#16a34a':p.ctr>20?'#d97706':'#E03E1A'}}>{p.ctr}%</span>
                              <div className="bn-ctr__bar"><div className="bn-ctr__fill" style={{width:`${Math.min(100,p.ctr)}%`,background:p.ctr>50?'#16a34a':'#E03E1A'}}/></div>
                            </div>
                          ):'—'}
                        </td>
                        <td><span className="mk-badge" style={st}>{p.status}</span></td>
                        <td>
                          <div className="mk-acts">
                            {(p.status==='draft'||p.status==='scheduled') && (
                              <button className="vm-btn vm-btn--primary vm-btn--sm" onClick={()=>setSendModal(p)}>
                                <Send size={11} color="#fff"/>Send Now
                              </button>
                            )}
                            <button className="vm-ib vm-ib--edit" title="Edit" onClick={()=>openEditPush(p)}><Edit2 size={12}/></button>
                            <button className="vm-ib vm-ib--del" title="Delete" onClick={()=>{setDeleteModal(p);setDeleteType('push');}}><Trash2 size={12}/></button>
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
      )}

      {/* ═══════════════ BANNER MODAL (New / Edit) ═══════════════ */}
      {bannerModal && (
        <Modal title={bannerModal==='new'?'New Banner':'Edit Banner'} onClose={()=>setBannerModal(null)} maxW={560}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setBannerModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--primary" onClick={saveBanner}><Check size={13} color="#fff"/>{bannerModal==='new'?'Create Banner':'Save Changes'}</button>
          </>}>

          {/* Live preview */}
          <div style={{height:80,borderRadius:10,background:bannerForm.gradient,display:'flex',alignItems:'flex-end',padding:'10px 14px',position:'relative',overflow:'hidden',marginBottom:4}}>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.45),transparent 60%)'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <div style={{fontSize:'.82rem',fontWeight:800,color:'#fff',marginBottom:3}}>{bannerForm.title||'Banner title…'}</div>
              <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.85)',fontWeight:700}}>{bannerForm.cta||'CTA'} →</div>
            </div>
          </div>

          {/* Gradient picker */}
          <div style={{marginBottom:4}}>
            <label style={{fontSize:'.72rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.3px',display:'block',marginBottom:6}}>Background</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {GRADIENTS.map((g,i)=>(
                <button key={i} onClick={()=>setBannerForm(f=>({...f,gradient:g}))}
                  style={{width:28,height:28,borderRadius:6,background:g,border:bannerForm.gradient===g?'2px solid #0f172a':'2px solid transparent',cursor:'pointer',transition:'border .13s'}}/>
              ))}
            </div>
          </div>

          <div className="mk-fgrid">
            <div className="mk-frow" style={{gridColumn:'1/-1'}}>
              <label>Banner Title</label>
              <Inp autoFocus placeholder="e.g. Summer Sale – 50% Off" value={bannerForm.title} onChange={e=>setBannerForm(f=>({...f,title:e.target.value}))}/>
            </div>
            <div className="mk-frow">
              <label>CTA Text</label>
              <Inp placeholder="e.g. Shop Now" value={bannerForm.cta} onChange={e=>setBannerForm(f=>({...f,cta:e.target.value}))}/>
            </div>
            <div className="mk-frow">
              <label>URL / Link</label>
              <Inp placeholder="/sale/summer" value={bannerForm.url} onChange={e=>setBannerForm(f=>({...f,url:e.target.value}))}/>
            </div>
            <div className="mk-frow">
              <label>Position</label>
              <Sel value={bannerForm.position} onChange={e=>setBannerForm(f=>({...f,position:e.target.value}))} options={POSITIONS.filter(p=>p!=='All')}/>
            </div>
            <div className="mk-frow">
              <label>Page</label>
              <Sel value={bannerForm.page} onChange={e=>setBannerForm(f=>({...f,page:e.target.value}))} options={PAGES}/>
            </div>
            <div className="mk-frow">
              <label>Device</label>
              <Sel value={bannerForm.device} onChange={e=>setBannerForm(f=>({...f,device:e.target.value}))} options={DEVICES}/>
            </div>
            <div className="mk-frow" style={{gridColumn:'1/-1',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="mk-frow">
                <label>Start Date</label>
                <Inp type="date" value={bannerForm.startDate} onChange={e=>setBannerForm(f=>({...f,startDate:e.target.value}))}/>
              </div>
              <div className="mk-frow">
                <label>End Date</label>
                <Inp type="date" value={bannerForm.endDate} onChange={e=>setBannerForm(f=>({...f,endDate:e.target.value}))}/>
              </div>
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#f8fafc',borderRadius:8,border:'1px solid #e8ecf0'}}>
            <Toggle on={bannerForm.active} onChange={v=>setBannerForm(f=>({...f,active:v}))}/>
            <span style={{fontSize:'.82rem',fontWeight:600,color:'#475569'}}>Banner Active</span>
          </div>
        </Modal>
      )}

      {/* ═══════════════ PUSH MODAL (New / Edit) ═══════════════ */}
      {pushModal && (
        <Modal title={pushModal==='new'?'New Push Campaign':'Edit Campaign'} onClose={()=>setPushModal(null)} maxW={560}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setPushModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--outline" onClick={()=>savePush('draft')}>Save Draft</button>
            <button className="vm-btn vm-btn--primary" onClick={()=>savePush(pushForm.scheduled?'scheduled':'sent')}>
              <Send size={13} color="#fff"/> {pushForm.scheduled?'Schedule':'Send Now'}
            </button>
          </>}>

          {/* Live preview */}
          <div className="bn-push-preview">
            <div className="bn-push-preview__phone">
              <div className="bn-push-preview__notif">
                <div className="bn-push-preview__app">EmpowerHome <span>now</span></div>
                <div className="bn-push-preview__title">{pushForm.title||'Notification title…'}</div>
                <div className="bn-push-preview__body">{pushForm.body||'Notification body text…'}</div>
              </div>
            </div>
          </div>

          <div className="mk-frow">
            <label>Title <span className="bn-char">{pushForm.title.length}/65</span></label>
            <Inp maxLength={65} value={pushForm.title} onChange={e=>setPushForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Flash Sale Starts Now!"/>
          </div>
          <div className="mk-frow">
            <label>Message Body <span className="bn-char">{pushForm.body.length}/150</span></label>
            <textarea className="mk-inp bn-textarea" maxLength={150} rows={3} value={pushForm.body} onChange={e=>setPushForm(f=>({...f,body:e.target.value}))} placeholder="Short, compelling message…"/>
          </div>
          <div className="mk-fgrid">
            <div className="mk-frow">
              <label>Target Segment</label>
              <Sel value={pushForm.segment} onChange={e=>setPushForm(f=>({...f,segment:e.target.value}))} options={SEGMENTS}/>
            </div>
            <div className="mk-frow">
              <label>Schedule (leave blank to send now)</label>
              <Inp type="datetime-local" value={pushForm.scheduled||''} onChange={e=>setPushForm(f=>({...f,scheduled:e.target.value}))}/>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════ SEND CONFIRM MODAL ═══════════════ */}
      {sendModal && (
        <Modal title="Send Push Now" onClose={()=>setSendModal(null)} maxW={420}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setSendModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--primary" onClick={()=>sendNow(sendModal)}>
              <Send size={13} color="#fff"/>Confirm & Send
            </button>
          </>}>
          <div style={{background:'#dbeafe',border:'1px solid #bfdbfe',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#2563eb',fontWeight:600,marginBottom:4}}>
            ℹ This will immediately send the notification to all users in the <strong>{sendModal.segment}</strong> segment.
          </div>
          {[{l:'Title',v:sendModal.title},{l:'Segment',v:sendModal.segment},{l:'Body',v:sendModal.body}].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'8px 0',borderBottom:i<2?'1px solid #f1f5f9':'none',gap:12}}>
              <span style={{fontSize:'.74rem',color:'#94a3b8',fontWeight:600,flexShrink:0}}>{r.l}</span>
              <span style={{fontSize:'.82rem',color:'#0f172a',fontWeight:700,textAlign:'right'}}>{r.v}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* ═══════════════ DELETE CONFIRM ═══════════════ */}
      {deleteModal && (
        <Modal title={`Delete ${deleteType==='banner'?'Banner':'Campaign'}`} onClose={()=>setDeleteModal(null)} maxW={400}
          footer={<>
            <button className="vm-btn vm-btn--outline" onClick={()=>setDeleteModal(null)}>Cancel</button>
            <button className="vm-btn vm-btn--primary" style={{background:'#dc2626'}} onClick={confirmDelete}>
              <Trash2 size={13} color="#fff"/>Delete
            </button>
          </>}>
          <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 14px',fontSize:'.82rem',color:'#dc2626',fontWeight:600}}>
            ✕ Are you sure you want to delete <strong>"{deleteModal.title}"</strong>? This cannot be undone.
          </div>
        </Modal>
      )}

    </div>
  );
}