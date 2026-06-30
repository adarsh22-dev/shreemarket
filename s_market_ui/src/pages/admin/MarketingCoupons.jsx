import React, { useState, useEffect } from 'react';
import './MarketingCoupons.css';
import {
  Tag, Zap, Plus, Search, Download, Edit2, Trash2,
  Copy, CheckCircle, XCircle, Clock, Filter, BarChart2,
  TrendingUp, Users, ShoppingCart, Calendar, ChevronDown,
  AlertTriangle, ToggleLeft, ToggleRight, Eye, Percent,
  DollarSign, Package, X, Check
} from 'lucide-react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, getFlashSales, createFlashSale, deleteFlashSale } from '../../api/api';
import { exportCSV } from './VendorShared';
import toast from 'react-hot-toast';

/* ── helpers ── */
const fmt  = n => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
const fmtN = n => n >= 1e3 ? `${(n/1e3).toFixed(1)}k` : n;

const Toggle = ({ on, onChange }) => (
  <button className={`mk-toggle ${on ? 'mk-toggle--on' : ''}`} onClick={() => onChange(!on)} type="button">
    <span className="mk-toggle__knob" />
  </button>
);

const EMPTY_COUPON = { code:'', type:'percentage', value:10, minOrder:0, maxDisc:'', maxUses:'', expiry:'', categories:['All'], status:'active' };
const CAT_OPTS = ['All','Electronics','Fashion','Grocery','Beauty','Books','Sports','Furniture'];

const STATUS_COLORS = {
  active:    { bg:'#dcfce7', color:'#16a34a' },
  expired:   { bg:'#f1f5f9', color:'#94a3b8' },
  scheduled: { bg:'#dbeafe', color:'#2563eb' },
  draft:     { bg:'#f1f5f9', color:'#64748b' },
  live:      { bg:'#fef3c7', color:'#d97706' },
  upcoming:  { bg:'#dbeafe', color:'#2563eb' },
  ended:     { bg:'#f1f5f9', color:'#94a3b8' },
};

export default function MarketingCoupons() {
  const [tab, setTab]             = useState('coupons');
  const [coupons, setCoupons]     = useState([]);
  const [sales, setSales]         = useState([]);
  const [loading, setLoading]     = useState(false);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCoupons().then(setCoupons).catch(() => { toast.error('Failed to load coupons'); }),
      getFlashSales().then(setSales).catch(() => { toast.error('Failed to load flash sales'); })
    ]).finally(() => setLoading(false));
  }, []);
  const [search, setSearch]       = useState('');
  const [statusFilter, setFilter] = useState('all');
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY_COUPON);
  const [copied, setCopied]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  /* ── Coupon actions ── */
  const copyCode = code => {
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  };
  const confirmDeleteCoupon = (id) => {
    const coupon = coupons.find(c => c.id === id);
    setDeleteTarget({ type: 'coupon', id, name: coupon?.code || id });
  };
  const confirmDeleteSale = (id) => {
    const sale = sales.find(s => s.id === id);
    setDeleteTarget({ type: 'sale', id, name: sale?.title || id });
  };
  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'coupon') {
        await deleteCoupon(deleteTarget.id);
        const data = await getCoupons();
        setCoupons(data);
        toast.success('Coupon deleted successfully');
      } else {
        await deleteFlashSale(deleteTarget.id);
        const data = await getFlashSales();
        setSales(data);
        toast.success('Flash sale deleted successfully');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };
  const toggleCoupon = id => setCoupons(cs => cs.map(c =>
    c.id === id ? { ...c, status: c.status === 'active' ? 'expired' : 'active' } : c
  ));
  const saveCoupon = async () => {
    try {
      if (modal === 'new') {
        await createCoupon(form);
      } else {
        await updateCoupon(modal.id, form);
      }
      const data = await getCoupons();
      setCoupons(data);
      toast.success('Coupon saved successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to save coupon');
    }
    setModal(null);
  };
  const openEdit = c => { setForm({ ...c }); setModal(c); };
  const openNew  = () => { setForm({ ...EMPTY_COUPON, code:`PROMO${Math.floor(Math.random()*900+100)}`}); setModal('new'); };

  /* ── Flash Sale actions ── */
  const toggleSale = id => setSales(ss => ss.map(s =>
    s.id === id ? { ...s, status: s.status === 'live' ? 'ended' : (s.status === 'draft' ? 'upcoming' : s.status) } : s
  ));

  /* ── Filter ── */
  const filteredCoupons = coupons.filter(c => {
    const matchSearch = c.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── KPIs ── */
  const totalSavings  = coupons.reduce((s,c) => s + c.revenue, 0);
  const totalUses     = coupons.reduce((s,c) => s + c.uses, 0);
  const activeCoupons = coupons.filter(c => c.status === 'active').length;
  const liveSales     = sales.filter(s => s.status === 'live').length;
  const totalSaleRev  = sales.reduce((s,fs) => s + fs.revenue, 0);

  return (
    <div className="mk">

      {/* ── Header ── */}
      <div className="mk-hdr">
        <div>
          <h2 className="mk-hdr__title">Coupons & Flash Sales</h2>
          <p className="mk-hdr__sub">Manage discount codes, promotional offers and time-limited sales events</p>
        </div>
        <div className="mk-hdr__acts">
          <button className="vm-btn vm-btn--outline" onClick={() => exportCSV([['Code','Type','Discount','Min Order','Max Uses','Used','Expiry','Revenue','Status'],...filteredCoupons.map(c=>[c.code,c.type,c.type==='percentage'?`${c.value}%`:`₹${c.value}`,c.minOrder,c.maxUses||'Unlimited',c.uses,c.expiry,c.revenue,c.status])],'coupons.csv')}>
            <Download size={13} color="#475569" /> Export
          </button>
          <button className="vm-btn vm-btn--primary" onClick={tab === 'coupons' ? openNew : () => {}}>
            <Plus size={13} color="#fff" /> {tab === 'coupons' ? 'New Coupon' : 'New Sale'}
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="mk-kpis">
        <div className="mk-kpi">
          <div className="mk-kpi__icon" style={{ background:'#fff0ed' }}><Tag size={18} color="#E03E1A" /></div>
          <div>
            <div className="mk-kpi__val">{activeCoupons}</div>
            <div className="mk-kpi__lbl">Active Coupons</div>
          </div>
        </div>
        <div className="mk-kpi">
          <div className="mk-kpi__icon" style={{ background:'#f0fdf4' }}><Users size={18} color="#16a34a" /></div>
          <div>
            <div className="mk-kpi__val">{fmtN(totalUses)}</div>
            <div className="mk-kpi__lbl">Total Redemptions</div>
          </div>
        </div>
        <div className="mk-kpi">
          <div className="mk-kpi__icon" style={{ background:'#eff6ff' }}><Zap size={18} color="#2563eb" /></div>
          <div>
            <div className="mk-kpi__val">{liveSales}</div>
            <div className="mk-kpi__lbl">Live Flash Sales</div>
          </div>
        </div>
        <div className="mk-kpi">
          <div className="mk-kpi__icon" style={{ background:'#fef9ec' }}><TrendingUp size={18} color="#d97706" /></div>
          <div>
            <div className="mk-kpi__val">{fmt(totalSaleRev)}</div>
            <div className="mk-kpi__lbl">Flash Sale Revenue</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mk-tabs">
        <button className={`mk-tab ${tab==='coupons'?'mk-tab--active':''}`} onClick={() => setTab('coupons')}>
          <Tag size={14} /> Coupons <span className="mk-tab__badge">{coupons.length}</span>
        </button>
        <button className={`mk-tab ${tab==='flash'?'mk-tab--active':''}`} onClick={() => setTab('flash')}>
          <Zap size={14} /> Flash Sales <span className="mk-tab__badge">{sales.length}</span>
        </button>
      </div>

      {/* ═══════════════ COUPONS TAB ═══════════════ */}
      {tab === 'coupons' && (
        <div className="mk-card">
          {/* Toolbar */}
          <div className="mk-toolbar">
            <div className="mk-search">
              <Search size={14} color="#94a3b8" />
              <input className="mk-search__inp" placeholder="Search coupon code…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="mk-pills">
              {['all','active','expired','scheduled'].map(s => (
                <button key={s} className={`mk-pill ${statusFilter===s?'mk-pill--active':''}`} onClick={() => setFilter(s)}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="mk-tw">
            <table className="mk-tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Expiry</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th className="mk-th-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map(c => {
                  const st = STATUS_COLORS[c.status] || STATUS_COLORS.draft;
                  const usePct = c.maxUses ? Math.min(100,(c.uses/c.maxUses)*100) : 60;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="mk-code-cell">
                          <span className="mk-code">{c.code}</span>
                          <button className="mk-copy" onClick={() => copyCode(c.code)}>
                            {copied === c.code ? <Check size={11} color="#16a34a"/> : <Copy size={11} color="#94a3b8"/>}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`mk-type mk-type--${c.type}`}>
                          {c.type === 'percentage' ? <Percent size={10}/> : <DollarSign size={10}/>}
                          {c.type}
                        </span>
                      </td>
                      <td className="mk-bold">
                        {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                        {c.maxDisc && <span className="mk-sub"> max ₹{c.maxDisc}</span>}
                      </td>
                      <td>₹{c.minOrder}</td>
                      <td>
                        <div className="mk-usage">
                          <span className="mk-usage__txt">{c.uses.toLocaleString()}{c.maxUses ? ` / ${c.maxUses.toLocaleString()}` : ''}</span>
                          <div className="mk-usage__bar">
                            <div className="mk-usage__fill" style={{ width:`${usePct}%`, background: usePct > 85 ? '#E03E1A' : '#E03E1A88' }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="mk-expiry">
                          <Calendar size={11} color="#94a3b8"/>
                          {new Date(c.expiry).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        </div>
                      </td>
                      <td className="mk-bold">{fmt(c.revenue)}</td>
                      <td><span className="mk-badge" style={st}>{c.status}</span></td>
                      <td>
                        <div className="mk-acts">
                          <Toggle on={c.status === 'active'} onChange={() => toggleCoupon(c.id)} />
                          <button className="vm-ib vm-ib--edit" onClick={() => openEdit(c)}><Edit2 size={12}/></button>
                          <button className="vm-ib vm-ib--del"  onClick={() => confirmDeleteCoupon(c.id)}><Trash2 size={12}/></button>
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

      {/* ═══════════════ FLASH SALES TAB ═══════════════ */}
      {tab === 'flash' && (
        <div className="mk-card">
          <div className="mk-tw">
            <table className="mk-tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Discount</th>
                  <th>Dates</th>
                  <th>Products</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th className="mk-th-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => {
                  const st = STATUS_COLORS[s.status] || STATUS_COLORS.draft;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:s.banner }} />
                          <span style={{ fontWeight:600 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ color:'#E03E1A', fontWeight:700 }}>-{s.discount}%</td>
                      <td style={{ fontSize:'.78rem', color:'#64748b', whiteSpace:'nowrap' }}>
                        {new Date(s.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        {s.endDate !== s.startDate && ` – ${new Date(s.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`}
                      </td>
                      <td style={{ textAlign:'center' }}>{s.products}</td>
                      <td style={{ textAlign:'center', fontWeight:600 }}>{s.sold.toLocaleString()}</td>
                      <td style={{ fontWeight:700, color:'#E03E1A' }}>{fmt(s.revenue)}</td>
                      <td><span className="mk-badge" style={st}>{s.status}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                          <button className="vm-ib vm-ib--edit"><Eye size={12}/></button>
                          <button className="vm-ib vm-ib--edit"><Edit2 size={12}/></button>
                          <button className="vm-ib vm-ib--del" onClick={() => confirmDeleteSale(s.id)}><Trash2 size={12}/></button>
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

      {/* ═══════════════ COUPON MODAL ═══════════════ */}
      {modal && (
        <div className="mk-overlay" onClick={() => setModal(null)}>
          <div className="mk-modal" onClick={e => e.stopPropagation()}>
            <div className="mk-modal__hdr">
              <h3>{modal === 'new' ? 'Create Coupon' : 'Edit Coupon'}</h3>
              <button className="mk-modal__close" onClick={() => setModal(null)}><X size={16}/></button>
            </div>
            <div className="mk-modal__body">
              <div className="mk-frow">
                <label>Coupon Code</label>
                <input className="mk-inp" value={form.code} onChange={e => setForm(f=>({...f, code:e.target.value.toUpperCase()}))} placeholder="e.g. SAVE20"/>
              </div>
              <div className="mk-fgrid">
                <div className="mk-frow">
                  <label>Discount Type</label>
                  <select className="mk-inp" value={form.type} onChange={e => setForm(f=>({...f, type:e.target.value}))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div className="mk-frow">
                  <label>Value</label>
                  <input className="mk-inp" type="number" value={form.value} onChange={e => setForm(f=>({...f, value:+e.target.value}))} />
                </div>
              </div>
              <div className="mk-fgrid">
                <div className="mk-frow">
                  <label>Min Order (₹)</label>
                  <input className="mk-inp" type="number" value={form.minOrder} onChange={e => setForm(f=>({...f, minOrder:+e.target.value}))} />
                </div>
                <div className="mk-frow">
                  <label>Max Discount (₹)</label>
                  <input className="mk-inp" type="number" value={form.maxDisc} onChange={e => setForm(f=>({...f, maxDisc:e.target.value}))} placeholder="No limit" />
                </div>
              </div>
              <div className="mk-fgrid">
                <div className="mk-frow">
                  <label>Max Uses</label>
                  <input className="mk-inp" type="number" value={form.maxUses} onChange={e => setForm(f=>({...f, maxUses:e.target.value}))} placeholder="Unlimited"/>
                </div>
                <div className="mk-frow">
                  <label>Expiry Date</label>
                  <input className="mk-inp" type="date" value={form.expiry} onChange={e => setForm(f=>({...f, expiry:e.target.value}))} />
                </div>
              </div>
              <div className="mk-frow">
                <label>Applicable Category</label>
                <select className="mk-inp" value={form.categories[0]} onChange={e => setForm(f=>({...f, categories:[e.target.value]}))}>
                  {CAT_OPTS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mk-modal__ftr">
              <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="vm-btn vm-btn--primary" onClick={saveCoupon}>
                <Check size={13} color="#fff"/> {modal === 'new' ? 'Create Coupon' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="mk-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="mk-modal mk-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="mk-modal__body" style={{textAlign:'center'}}>
              <Trash2 size={32} color="#dc2626" style={{marginBottom:8}} />
              <h3>Delete {deleteTarget.type === 'coupon' ? 'Coupon' : 'Flash Sale'}</h3>
              <p style={{color:'var(--text-2)',fontSize:'0.88rem',margin:'8px 0 20px'}}>
                Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This action cannot be undone.
              </p>
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <button className="vm-btn vm-btn--outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                <button className="vm-btn vm-btn--danger" onClick={executeDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : <><Trash2 size={13} color="#fff"/> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
