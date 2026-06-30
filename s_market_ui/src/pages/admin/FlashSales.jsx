import React, { useState, useEffect } from 'react';
import './FlashSales.css';
import {
  Zap, Plus, Edit2, Trash2, Eye, Calendar, Clock,
  TrendingUp, ShoppingBag, DollarSign, BarChart2,
  X, Check, Package, Users, Play, Pause, Copy,
  ChevronDown, AlertTriangle, Timer
} from 'lucide-react';
import { getFlashSales, createFlashSale, deleteFlashSale } from '../../api/api';

/* ── helpers ── */
const fmt  = n => n == null || isNaN(n) ? '₹0' : n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
const fmtN = n => n == null || isNaN(n) ? '0' : n >= 1e3 ? `${(n/1e3).toFixed(1)}k` : String(n);

/* ── Data ── */
const BANNER_PRESETS = ['#E03E1A','#ff6b35','#ec4899','#6366f1','#0ea5e9','#a855f7','#16a34a','#d97706','#0f172a'];
const CATEGORIES     = ['All','Electronics','Fashion','Grocery','Beauty','Books','Sports','Furniture'];

const STATUS_META = {
  live:     { bg:'#fef3c7', color:'#d97706',  label:'Live'     },
  upcoming: { bg:'#dbeafe', color:'#2563eb',  label:'Upcoming' },
  ended:    { bg:'#f1f5f9', color:'#94a3b8',  label:'Ended'    },
  draft:    { bg:'#f1f5f9', color:'#64748b',  label:'Draft'    },
};

const EMPTY = {
  name:'', discount:20, startDate:'', endDate:'', startTime:'09:00', endTime:'23:59',
  products:0, category:'All', description:'', banner:'#E03E1A', status:'draft'
};

export default function FlashSales() {
  const [sales, setSales]     = useState([]);
  const [toast, setToast]     = useState(null);
  const showToast = (msg, type='success') => setToast({ msg, type });
  useEffect(() => { getFlashSales().then(setSales).catch(e => showToast(e.message, 'error')); }, []);
  const [filter, setFilter]   = useState('all');
  const [modal, setModal]     = useState(null);   // null | 'new' | sale-obj
  const [form, setForm]       = useState(EMPTY);
  const [detailModal, setDetailModal] = useState(null);

  /* ── actions ── */
  const del    = id => { deleteFlashSale(id).then(() => getFlashSales().then(setSales)).catch(e => showToast(e.message, 'error')); };
  const openNew  = ()  => { setForm({ ...EMPTY }); setModal('new'); };
  const openEdit = s   => { setForm({ ...s });      setModal(s); };
  const save = async () => {
    try {
      if (modal === 'new') {
        await createFlashSale(form);
      } else {
        await deleteFlashSale(modal.id);
        await createFlashSale({ ...modal, ...form });
      }
      const data = await getFlashSales();
      setSales(data);
    } catch (e) { showToast(e.message, 'error'); }
    setModal(null);
  };
  const toggleStatus = id => setSales(ss => ss.map(s => {
    if (s.id !== id) return s;
    const next = { live:'ended', upcoming:'live', draft:'upcoming', ended:'draft' };
    return { ...s, status: next[s.status] || s.status };
  }));

  /* ── filter ── */
  const displayed = filter === 'all' ? sales : sales.filter(s => s.status === filter);

  /* ── KPIs ── */
  const live      = sales.filter(s => s.status === 'live').length;
  const upcoming  = sales.filter(s => s.status === 'upcoming').length;
  const totalRev  = sales.reduce((a,s) => a + (s.revenue || 0), 0);
  const totalSold = sales.reduce((a,s) => a + (s.sold || 0), 0);

  const Toast = ({ msg, type, onDone }) => {
    React.useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
    const map = { success:['#f0fdf4','#16a34a','#bbf7d0','✓'], error:['#fee2e2','#dc2626','#fecaca','✕'], info:['#dbeafe','#2563eb','#bfdbfe','ℹ'] };
    const [bg,fg,border,ico] = map[type]||map.info;
    return (
      <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:bg,color:fg,border:`1px solid ${border}`,padding:'10px 18px',borderRadius:10,fontSize:'.82rem',fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px rgba(0,0,0,.14)',zIndex:2000,whiteSpace:'nowrap',animation:'fs-toast-in .22s ease',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        {ico} {msg}
      </div>
    );
  };

  return (
    <div className="fs">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Header */}
      <div className="fs-hdr">
        <div>
          <h2 className="fs-hdr__title">Flash Sales</h2>
          <p className="fs-hdr__sub">Create and manage time-limited discount events across all categories</p>
        </div>
        <button className="fs-btn fs-btn--primary" onClick={openNew}>
          <Plus size={14} color="#fff"/> New Flash Sale
        </button>
      </div>

      {/* KPIs */}
      <div className="fs-kpis">
        <div className="fs-kpi">
          <div className="fs-kpi__icon" style={{background:'#fff0ed'}}><Zap size={20} color="#E03E1A"/></div>
          <div className="fs-kpi__body">
            <div className="fs-kpi__val">{live}</div>
            <div className="fs-kpi__lbl">Live Now</div>
          </div>
          {live > 0 && <span className="fs-live-dot"/>}
        </div>
        <div className="fs-kpi">
          <div className="fs-kpi__icon" style={{background:'#eff6ff'}}><Clock size={20} color="#2563eb"/></div>
          <div className="fs-kpi__body">
            <div className="fs-kpi__val">{upcoming}</div>
            <div className="fs-kpi__lbl">Upcoming</div>
          </div>
        </div>
        <div className="fs-kpi">
          <div className="fs-kpi__icon" style={{background:'#f0fdf4'}}><ShoppingBag size={20} color="#16a34a"/></div>
          <div className="fs-kpi__body">
            <div className="fs-kpi__val">{fmtN(totalSold)}</div>
            <div className="fs-kpi__lbl">Total Units Sold</div>
          </div>
        </div>
        <div className="fs-kpi">
          <div className="fs-kpi__icon" style={{background:'#fef9ec'}}><TrendingUp size={20} color="#d97706"/></div>
          <div className="fs-kpi__body">
            <div className="fs-kpi__val">{fmt(totalRev)}</div>
            <div className="fs-kpi__lbl">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="fs-filters">
        {['all','live','upcoming','draft','ended'].map(f => (
          <button key={f} className={`fs-filter ${filter===f?'fs-filter--active':''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Sales' : STATUS_META[f]?.label || f}
            <span className="fs-filter__count">
              {f === 'all' ? sales.length : sales.filter(s=>s.status===f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Sales Table */}
      <div className="fs-card">
        <table className="fs-tbl">
          <thead>
            <tr>
              <th>Name / Category</th>
              <th>Discount</th>
              <th>Dates</th>
              <th>Products</th>
              <th>Sold</th>
              <th>Revenue</th>
              <th>Status</th>
              <th className="fs-th-r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(s => {
              const st = STATUS_META[s.status] || STATUS_META.draft;
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:s.banner, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Zap size={14} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'.82rem', color:'#0f172a' }}>{s.name}</div>
                        <div style={{ fontSize:'.7rem', color:'#94a3b8' }}>{s.category}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight:700, color:'#E03E1A' }}>-{s.discount}%</td>
                  <td style={{ fontSize:'.78rem', color:'#64748b', whiteSpace:'nowrap' }}>
                    {new Date(s.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    {s.endDate !== s.startDate && ` – ${new Date(s.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`}
                    <div style={{ fontSize:'.7rem', color:'#94a3b8' }}>{s.startTime} – {s.endTime}</div>
                  </td>
                  <td style={{ textAlign:'center' }}>{s.products}</td>
                  <td style={{ textAlign:'center', fontWeight:600 }}>{fmtN(s.sold)}</td>
                  <td style={{ fontWeight:700, color:'#E03E1A' }}>{fmt(s.revenue)}</td>
                  <td>
                    <span className="fs-status-badge" style={{ background:st.bg, color:st.color, padding:'2px 10px', borderRadius:10, fontSize:'.7rem', fontWeight:700 }}>
                      {s.status === 'live' && <span className="fs-live-pulse"/>}
                      {st.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                      <button className="fs-btn fs-btn--ghost" onClick={() => setDetailModal(s)} title="View"><Eye size={13} color="#475569"/></button>
                      <button className="fs-btn fs-btn--ghost" onClick={() => openEdit(s)} title="Edit"><Edit2 size={13} color="#475569"/></button>
                      <button className="fs-btn fs-btn--ghost fs-btn--status" onClick={() => toggleStatus(s.id)} title="Toggle status"
                        style={{color: s.status==='live'?'#d97706': s.status==='draft'?'#2563eb':'#16a34a'}}>
                        {s.status === 'live' ? <Pause size={12}/> : <Play size={12}/>}
                      </button>
                      <button className="fs-ib fs-ib--del" onClick={() => del(s.id)} title="Delete"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════ CREATE / EDIT MODAL ═══════ */}
      {modal && (
        <div className="fs-overlay" onClick={() => setModal(null)}>
          <div className="fs-modal" onClick={e => e.stopPropagation()}>
            <div className="fs-modal__hdr">
              <h3>{modal === 'new' ? 'Create Flash Sale' : `Edit: ${modal.name}`}</h3>
              <button className="fs-modal__close" onClick={() => setModal(null)}><X size={16}/></button>
            </div>
            <div className="fs-modal__body">

              {/* Preview strip */}
              <div className="fs-preview" style={{background: form.banner}}>
                <Zap size={18} color="#fff" opacity={0.5}/>
                <span className="fs-preview__disc">-{form.discount || '?'}%</span>
                <span className="fs-preview__name">{form.name || 'Sale name preview'}</span>
              </div>

              <div className="fs-frow">
                <label>Sale Name</label>
                <input className="fs-inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Midnight Madness"/>
              </div>
              <div className="fs-fgrid">
                <div className="fs-frow">
                  <label>Discount (%)</label>
                  <input className="fs-inp" type="number" min={1} max={90} value={form.discount} onChange={e=>setForm(f=>({...f,discount:+e.target.value}))}/>
                </div>
                <div className="fs-frow">
                  <label>Category</label>
                  <select className="fs-inp" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="fs-fgrid">
                <div className="fs-frow">
                  <label>Start Date</label>
                  <input className="fs-inp" type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/>
                </div>
                <div className="fs-frow">
                  <label>End Date</label>
                  <input className="fs-inp" type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/>
                </div>
              </div>
              <div className="fs-fgrid">
                <div className="fs-frow">
                  <label>Start Time</label>
                  <input className="fs-inp" type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/>
                </div>
                <div className="fs-frow">
                  <label>End Time</label>
                  <input className="fs-inp" type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/>
                </div>
              </div>
              <div className="fs-frow">
                <label>Description</label>
                <textarea className="fs-inp fs-textarea" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Short description shown on the sale page…"/>
              </div>
              <div className="fs-frow">
                <label>Banner Colour</label>
                <div className="fs-color-row">
                  {BANNER_PRESETS.map(c => (
                    <button key={c} className={`fs-color-swatch ${form.banner===c?'fs-color-swatch--active':''}`}
                      style={{background:c}} onClick={()=>setForm(f=>({...f,banner:c}))} type="button"/>
                  ))}
                  <input className="fs-color-custom" type="color" value={form.banner} onChange={e=>setForm(f=>({...f,banner:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="fs-modal__ftr">
              <button className="fs-btn fs-btn--outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="fs-btn fs-btn--primary" onClick={save}>
                <Check size={13} color="#fff"/> {modal === 'new' ? 'Create Sale' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DETAIL MODAL ═══════ */}
      {detailModal && (
        <div className="fs-overlay" onClick={() => setDetailModal(null)}>
          <div className="fs-modal fs-modal--detail" onClick={e => e.stopPropagation()}>
            <div className="fs-modal__hdr">
              <h3>{detailModal.name}</h3>
              <button className="fs-modal__close" onClick={() => setDetailModal(null)}><X size={16}/></button>
            </div>
            <div className="fs-detail-banner" style={{background: detailModal.banner}}>
              <span className="fs-detail-disc">-{detailModal.discount}%</span>
              <span className="fs-status-badge" style={{...STATUS_META[detailModal.status]}}>
                {STATUS_META[detailModal.status]?.label}
              </span>
            </div>
            <div className="fs-modal__body">
              <p className="fs-detail-desc">{detailModal.description || 'No description set.'}</p>
              <div className="fs-detail-grid">
                <div className="fs-detail-item"><span>Category</span><strong>{detailModal.category}</strong></div>
                <div className="fs-detail-item"><span>Dates</span><strong>
                  {new Date(detailModal.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                  {detailModal.endDate !== detailModal.startDate && ` – ${new Date(detailModal.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`}
                </strong></div>
                <div className="fs-detail-item"><span>Time</span><strong>{detailModal.startTime} – {detailModal.endTime}</strong></div>
                <div className="fs-detail-item"><span>Products</span><strong>{detailModal.products}</strong></div>
                <div className="fs-detail-item"><span>Units Sold</span><strong>{fmtN(detailModal.sold)}</strong></div>
                <div className="fs-detail-item"><span>Revenue</span><strong style={{color:'#E03E1A'}}>{fmt(detailModal.revenue)}</strong></div>
              </div>
            </div>
            <div className="fs-modal__ftr">
              <button className="fs-btn fs-btn--outline" onClick={() => setDetailModal(null)}>Close</button>
              <button className="fs-btn fs-btn--primary" onClick={() => { openEdit(detailModal); setDetailModal(null); }}>
                <Edit2 size={13} color="#fff"/> Edit Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
