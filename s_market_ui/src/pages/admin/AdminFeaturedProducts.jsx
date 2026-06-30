import React, { useState, useEffect, useCallback } from 'react';
import { getAdminProducts, updateProductStatus, BACKEND_URL } from '../../api/api';
import { exportCSV } from './VendorShared';
import toast from 'react-hot-toast';
import './AdminFeaturedProducts.css';

/* ================================================================
   FeaturedProducts — Manage homepage / campaign featured slots
   ================================================================ */

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const colorFor = s => PALETTE[s.charCodeAt(0) % PALETTE.length];
const fmt      = n => 'Rs.' + Number(n).toLocaleString('en-IN');

const PLACEMENTS  = ['All','Homepage Hero','Category Banner','Deals of the Day'];
const STATUS_OPTS = ['All','Active','Scheduled','Expired'];
const PER_PAGE    = 8;

/* ── Icons ── */
const I = ({ d, size=14, color='currentColor', sw=2, fill='none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d)?d.map((p,i)=><path key={i} d={p}/>):<path d={d}/>}
  </svg>
);
const IC = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  edit:     ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:    ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M10 11v6M14 11v6','M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  plus:     'M12 5v14M5 12h14',
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  check:    'M20 6 9 17l-5-5',
  x:        'M18 6 6 18M6 6l12 12',
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  zap:      'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  layout:   ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  tag:      'M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2zM7 7h.01',
  box:      ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96 12 12.01l8.73-5.05','M12 22.08V12'],
  trendUp:  ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  hash:     'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
  toggle:   ['M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 0 2 2v4M9 3v11','M12 3v13','M3 9h18','M3 14h18','M3 19h18'],
  move:     ['M5 9l-3 3 3 3','M9 5l3-3 3 3','M15 19l-3 3-3-3','M19 9l3 3-3 3','M2 12h20','M12 2v20'],
  percent:  ['M19 5 5 19','M6.5 6.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0','M16.5 16.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0'],
};

/* ── Shared UI ── */
const SearchBar = ({ value, onChange }) => (
  <div className="fp-search">
    <span className="fp-search__ico"><I d={IC.search} size={14} color="#94a3b8"/></span>
    <input className="fp-search__inp" placeholder="Search product, ID, brand…"
      value={value} onChange={onChange}/>
  </div>
);

const Pills = ({ options, value, onChange }) => (
  <div className="fp-pills">
    {options.map(o=>(
      <button key={o} className={`fp-pill${value===o?' fp-pill--on':''}`} onClick={()=>onChange(o)}>{o}</button>
    ))}
  </div>
);

const StarRating = ({ r }) => {
  const full = Math.floor(r), half = r - full >= .5;
  return (
    <div className="fp-stars">
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i<=full?'#f59e0b':i===full+1&&half?'url(#half)':'none'}
          stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs><linearGradient id="half"><stop offset="50%" stopColor="#f59e0b"/><stop offset="50%" stopColor="none"/></linearGradient></defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span className="fp-stars__n">{r}</span>
    </div>
  );
};

const StatusBdg = ({ status }) => {
  const m = { Active:'act', Scheduled:'sch', Expired:'exp', ACTIVE:'act', INACTIVE:'exp', PENDING:'sch' };
  return <span className={`fp-bdg fp-bdg--${m[status]||'exp'}`}><span className="fp-bdg__dot"/>{status}</span>;
};

const PlacementBdg = ({ p }) => {
  const m = { 'Homepage Hero':'hero', 'Category Banner':'cat', 'Deals of the Day':'deal' };
  return <span className={`fp-plc fp-plc--${m[p]||'cat'}`}>{p}</span>;
};

const BadgePill = ({ label }) => {
  if(!label) return null;
  const m = { 'Best Seller':'sell', 'New Arrival':'new', 'Top Rated':'top', 'Hot Deal':'hot' };
  return <span className={`fp-badge fp-badge--${m[label]||'sell'}`}>{label}</span>;
};

const PriBadge = ({ p }) => {
  const m = { High:'hi', Normal:'nm', Low:'lo' };
  return <span className={`fp-pri fp-pri--${m[p]||'nm'}`}>{p}</span>;
};

const Pager = ({ page, total, onPrev, onNext }) => {
  const pages = Math.ceil(total/PER_PAGE)||1;
  return (
    <div className="fp-pag">
      <span className="fp-pag__info">
        {total===0?'0 results':`${page*PER_PAGE+1}–${Math.min((page+1)*PER_PAGE,total)} of ${total}`}
      </span>
      <div className="fp-pag__ctrl">
        <button className="fp-pag__btn" onClick={onPrev} disabled={page===0}><I d={IC.chevL} size={13} color="#475569"/></button>
        <span className="fp-pag__lbl">{page+1} / {pages}</span>
        <button className="fp-pag__btn" onClick={onNext} disabled={(page+1)*PER_PAGE>=total}><I d={IC.chevR} size={13} color="#475569"/></button>
      </div>
    </div>
  );
};

/* ── Add/Edit Modal ── */
const Modal = ({ mode, item, onClose, onSave }) => {
  const [productId, setProductId] = useState(item?.productId || item?.id || '');
  const [name,      setName]      = useState(item?.name      || '');
  const [slot,      setSlot]      = useState(item?.slot      || 1);
  const [placement, setPlacement] = useState(item?.placement || 'Homepage Hero');
  const [startDate, setStartDate] = useState(item?.startDate || '');
  const [endDate,   setEndDate]   = useState(item?.endDate   || '');
  const [status,    setStatus]    = useState(item?.status    || 'Active');
  const [priority,  setPriority]  = useState(item?.priority  || 'Normal');
  const [badge,     setBadge]     = useState(item?.badge     || '');

  return (
    <div className="fp-overlay" onClick={e=>{ if(e.target.className==='fp-overlay') onClose(); }}>
      <div className="fp-modal">
        <div className="fp-modal__hd">
          <div className="fp-modal__hd-left">
            <div className="fp-modal__hd-icon"><I d={IC.star} size={16} color="#E03E1A" sw={2}/></div>
            <p className="fp-modal__title">{mode==='add'?'Add Featured Product':'Edit Featured Product'}</p>
          </div>
          <button className="fp-modal__close" onClick={onClose}><I d={IC.x} size={14}/></button>
        </div>

        <div className="fp-modal__body">
          {/* Product ID + Name */}
          <div className="fp-field-row">
            <div className="fp-field" style={{flex:'0 0 140px'}}>
              <label className="fp-field__lbl">Product ID *</label>
              <input className="fp-field__inp fp-field__inp--mono"
                placeholder="e.g. PRD-3041"
                value={productId} onChange={e=>setProductId(e.target.value)}/>
            </div>
            <div className="fp-field" style={{flex:1}}>
              <label className="fp-field__lbl">Product Name *</label>
              <input className="fp-field__inp" placeholder="Product display name"
                value={name} onChange={e=>setName(e.target.value)}/>
            </div>
          </div>

          {/* Placement + Slot */}
          <div className="fp-field-row">
            <div className="fp-field" style={{flex:2}}>
              <label className="fp-field__lbl">Placement *</label>
              <select className="fp-field__sel" value={placement} onChange={e=>setPlacement(e.target.value)}>
                {['Homepage Hero','Category Banner','Deals of the Day'].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="fp-field" style={{flex:'0 0 90px'}}>
              <label className="fp-field__lbl">Slot #</label>
              <input className="fp-field__inp" type="number" min="1" max="12"
                value={slot} onChange={e=>setSlot(Number(e.target.value))}/>
            </div>
          </div>

          {/* Dates */}
          <div className="fp-field-row">
            <div className="fp-field" style={{flex:1}}>
              <label className="fp-field__lbl">Start Date *</label>
              <input className="fp-field__inp" placeholder="e.g. Jan 1, 2025"
                value={startDate} onChange={e=>setStartDate(e.target.value)}/>
            </div>
            <div className="fp-field" style={{flex:1}}>
              <label className="fp-field__lbl">End Date *</label>
              <input className="fp-field__inp" placeholder="e.g. Jan 31, 2025"
                value={endDate} onChange={e=>setEndDate(e.target.value)}/>
            </div>
          </div>

          {/* Status + Priority + Badge */}
          <div className="fp-field-row">
            <div className="fp-field" style={{flex:1}}>
              <label className="fp-field__lbl">Status</label>
              <select className="fp-field__sel" value={status} onChange={e=>setStatus(e.target.value)}>
                <option>Active</option><option>Scheduled</option><option>Expired</option>
              </select>
            </div>
            <div className="fp-field" style={{flex:1}}>
              <label className="fp-field__lbl">Priority</label>
              <select className="fp-field__sel" value={priority} onChange={e=>setPriority(e.target.value)}>
                <option>High</option><option>Normal</option><option>Low</option>
              </select>
            </div>
            <div className="fp-field" style={{flex:1}}>
              <label className="fp-field__lbl">Badge Label</label>
              <select className="fp-field__sel" value={badge} onChange={e=>setBadge(e.target.value)}>
                <option value="">None</option>
                <option>Best Seller</option><option>New Arrival</option>
                <option>Top Rated</option><option>Hot Deal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="fp-modal__ft">
          <button className="fp-btn fp-btn--out" onClick={onClose}>Cancel</button>
          <button className="fp-btn fp-btn--pri"
            onClick={()=>onSave({ productId, name, slot, placement, startDate, endDate, status, priority, badge })}>
            <I d={IC.check} size={13} color="#fff" sw={2.5}/>
            {mode==='add'?'Add to Featured':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Helper: map backend product to UI shape ── */
const mapProduct = (p) => {
  const discount = p.regularPrice && p.discountPrice
    ? Math.round(((p.regularPrice - p.discountPrice) / p.regularPrice) * 100)
    : 0;

  const primaryMedia = p.media?.find(m => m.primary) || p.media?.[0];
  const imageUrl = primaryMedia
    ? `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`
    : null;

  const createdDate = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  // Map backend status to UI status
  const statusMap = { ACTIVE: 'Active', INACTIVE: 'Expired', PENDING: 'Scheduled' };
  const uiStatus = statusMap[p.status] || p.status || 'Active';

  return {
    id: `FP-${String(p.id).padStart(3, '0')}`,
    productId: String(p.id),
    name: p.name || 'Unnamed Product',
    sku: p.sku || '—',
    category: p.category || '—',
    subCategory: p.subCategory || '',
    brand: p.brand || '—',
    price: p.discountPrice || p.regularPrice || 0,
    mrp: p.regularPrice || 0,
    discount,
    rating: p.averageRating || 0,
    reviews: p.reviewCount || 0,
    stock: p.initialStock || 0,
    slot: 1,
    placement: 'Homepage Hero',
    startDate: createdDate,
    endDate: '—',
    status: uiStatus,
    priority: 'Normal',
    badge: '',
    sales: 0,
    vendorId: p.vendorId,
    imageUrl,
  };
};

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function FeaturedProducts() {
  const [search,    setSearch]    = useState('');
  const [placF,     setPlacF]     = useState('All');
  const [statusF,   setStatusF]   = useState('All');
  const [checked,   setChecked]   = useState({});
  const [page,      setPage]      = useState(0);
  const [modal,     setModal]     = useState(null);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /* ── Fetch products from API ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts({ page, size: PER_PAGE, search: search || undefined });
      const mapped = (data.content || []).map(mapProduct);
      setProducts(mapped);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch featured products:', err);
      toast.error('Failed to load featured products');
      setProducts([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
    }, search ? 400 : 0);
    return () => clearTimeout(debounce);
  }, [fetchProducts]);

  /* ── Client-side filters (placement & status are local since API doesn't support them) ── */
  const list = products.filter(p => {
    const mP  = placF   === 'All' || p.placement === placF;
    const mS  = statusF === 'All' || p.status    === statusF;
    return mP && mS;
  });

  const slice = list;
  const allC  = slice.length>0 && slice.every(p=>checked[p.id]);
  const toggleAll = () => {
    if(allC) setChecked(pr=>{const n={...pr};slice.forEach(p=>delete n[p.id]);return n;});
    else     setChecked(pr=>{const n={...pr};slice.forEach(p=>n[p.id]=true);return n;});
  };

  const handleSave = (data) => {
    if(modal.mode==='add') {
      const np = {
        id:`FP-${String(products.length+1).padStart(3,'0')}`,
        productId: data.productId,
        sku:'', category:'', brand:'', price:0, mrp:0, discount:0,
        rating:0, reviews:0, stock:0, sales:0, imageUrl: null, ...data,
      };
      setProducts(p=>[np,...p]);
      toast.success('Featured product added (local)');
    } else {
      setProducts(p=>p.map(x=>x.id===modal.item.id?{...x,...data}:x));
      toast.success('Featured product updated');
    }
    setModal(null);
  };

  const handleDelete = async (p) => {
    const productId = p.productId || p.id;
    if (!window.confirm(`Remove "${p.name || productId}" from featured?`)) return;
    try {
      if (p.productId) {
        const numericId = String(p.productId).replace(/[^0-9]/g, '');
        if (numericId) {
          await updateProductStatus(numericId, 'INACTIVE');
        }
      }
      toast.success('Product removed from featured');
      setProducts(prev => prev.filter(x => x.id !== p.id));
      setChecked(prev => { const n = { ...prev }; delete n[p.id]; return n; });
    } catch (err) {
      toast.error(err?.message || 'Failed to remove product');
    }
  };

  const handleToggle = async (p) => {
    const newStatus = p.status === 'Active' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateProductStatus(p.productId, newStatus);
      toast.success(`Product ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
      setProducts(prev => prev.map(x =>
        x.id === p.id ? { ...x, status: newStatus === 'ACTIVE' ? 'Active' : 'Expired' } : x
      ));
    } catch (err) {
      console.error('Failed to toggle product status:', err);
      toast.error('Failed to update product status');
    }
  };

  /* KPIs */
  const active    = products.filter(p=>p.status==='Active').length;
  const scheduled = products.filter(p=>p.status==='Scheduled').length;
  const totalSales = products.reduce((a,p)=>a+p.sales,0);
  const slots     = new Set(products.filter(p=>p.status==='Active').map(p=>p.slot)).size;

  return (
    <div className="fp">

      {/* ── Header ── */}
      <div className="fp-hdr">
        <div>
          <h2 className="fp-hdr__t">Featured Products</h2>
          <p className="fp-hdr__s">Control which products are highlighted across placements and campaigns.</p>
        </div>
        <button className="fp-btn fp-btn--pri" onClick={()=>setModal({mode:'add'})}>
          <I d={IC.plus} size={14} color="#fff"/>Add Featured
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="fp-kpi-strip">
        {[
          { label:'Total Featured',   val: totalElements, color:'#E03E1A', bg:'#fff0ed', ico: IC.star    },
          { label:'Currently Active', val: active,          color:'#16a34a', bg:'#dcfce7', ico: IC.check   },
          { label:'Scheduled',        val: scheduled,       color:'#2563eb', bg:'#dbeafe', ico: IC.calendar },
          { label:'Active Slots',     val: slots,           color:'#7c3aed', bg:'#ede9fe', ico: IC.layout  },
          { label:'Total Sales',      val: totalSales.toLocaleString('en-IN'), color:'#d97706', bg:'#fef3c7', ico: IC.trendUp },
        ].map((k,i)=>(
          <div key={i} className="fp-kpi">
            <div className="fp-kpi__ico" style={{background:k.bg}}>
              <I d={k.ico} size={16} color={k.color} sw={2.1}/>
            </div>
            <div>
              <div className="fp-kpi__val" style={{color:k.color}}>{k.val}</div>
              <div className="fp-kpi__lbl">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="fp-card">
        <div className="fp-sh">
          <div>
            <p className="fp-sh__t">Featured Slots</p>
            <p className="fp-sh__s">{totalElements} entr{totalElements===1?'y':'ies'} found</p>
          </div>
          <div className="fp-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
            <Pills options={STATUS_OPTS}  value={statusF} onChange={v=>{setStatusF(v);}}/>
            <Pills options={PLACEMENTS}   value={placF}   onChange={v=>{setPlacF(v);}}/>
            <button className="fp-btn fp-btn--out" onClick={() => exportCSV([['Product','ID','Brand','Category','Placement','Slot','Price','Discount','Rating','Reviews','Sales','Priority','Status'],...products.map(p=>[p.name,p.id,p.brand,p.category,p.placement,p.slot,p.price,p.discount,p.rating,p.reviews,p.sales,p.priority,p.status])],'featured-products.csv')}>
              <I d={IC.download} size={13} color="#475569"/>Export
            </button>
          </div>
        </div>

        <div className="fp-tw">
          {loading ? (
            <div className="fp-empty" style={{padding:'48px 0',textAlign:'center',color:'#94a3b8'}}>Loading products…</div>
          ) : (
          <table className="fp-tbl">
            <thead>
              <tr>
                <th className="fp-th fp-th--chk">
                  <input type="checkbox" className="fp-chk" checked={allC} onChange={toggleAll}/>
                </th>
                <th className="fp-th">Product</th>
                <th className="fp-th fp-hm">Brand / Category</th>
                <th className="fp-th">Placement</th>
                <th className="fp-th fp-hm">Slot</th>
                <th className="fp-th fp-hm">Price</th>
                <th className="fp-th fp-hm">Discount</th>
                <th className="fp-th fp-hm">Rating</th>
                <th className="fp-th fp-hm">Sales</th>
                <th className="fp-th fp-hm">Duration</th>
                <th className="fp-th">Priority</th>
                <th className="fp-th">Status</th>
                <th className="fp-th fp-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length===0 && (
                <tr><td colSpan="13" className="fp-empty">No featured products match your filters.</td></tr>
              )}
              {slice.map(p => (
                <tr key={p.id} className={`fp-tr${checked[p.id]?' fp-tr--sel':''}`}>

                  {/* Checkbox */}
                  <td className="fp-td fp-td--chk">
                    <input type="checkbox" className="fp-chk" checked={!!checked[p.id]}
                      onChange={()=>setChecked(pr=>({...pr,[p.id]:!pr[p.id]}))}/>
                  </td>

                  {/* Product */}
                  <td className="fp-td">
                    <div className="fp-prod">
                      {p.imageUrl ? (
                        <img className="fp-prod__thumb" src={p.imageUrl} alt={p.name}
                          style={{width:36,height:36,borderRadius:6,objectFit:'cover'}}
                          onError={e=>{e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex');}}/>
                      ) : null}
                      <div className="fp-prod__thumb" style={{
                        background:`${colorFor(p.name)}18`,border:`1px solid ${colorFor(p.name)}28`,
                        display: p.imageUrl ? 'none' : 'flex'
                      }}>
                        <I d={IC.box} size={16} color={colorFor(p.name)} sw={1.7}/>
                      </div>
                      <div>
                        <div className="fp-prod__name">{p.name}</div>
                        <div className="fp-prod__meta">
                          <span>{p.id}</span>
                          {p.badge && <BadgePill label={p.badge}/>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Brand / Category */}
                  <td className="fp-td fp-hm">
                    <div className="fp-bc">
                      <span className="fp-bc__brand">{p.brand}</span>
                      <span className="fp-bc__cat">{p.category}</span>
                    </div>
                  </td>

                  {/* Placement */}
                  <td className="fp-td"><PlacementBdg p={p.placement}/></td>

                  {/* Slot */}
                  <td className="fp-td fp-hm">
                    <span className="fp-slot">
                      <I d={IC.hash} size={11} color="#94a3b8"/>
                      {p.slot}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="fp-td fp-hm">
                    <div className="fp-price-cell">
                      <span className="fp-price">{fmt(p.price)}</span>
                      {p.mrp !== p.price && <span className="fp-mrp">{fmt(p.mrp)}</span>}
                    </div>
                  </td>

                  {/* Discount */}
                  <td className="fp-td fp-hm">
                    <span className="fp-disc">
                      <I d={IC.percent} size={11} color="#16a34a" sw={2.5}/>
                      {p.discount}% off
                    </span>
                  </td>

                  {/* Rating */}
                  <td className="fp-td fp-hm">
                    {p.rating > 0 ? (
                      <div>
                        <StarRating r={p.rating}/>
                        <span className="fp-reviews">({p.reviews})</span>
                      </div>
                    ) : <span className="fp-no-data">—</span>}
                  </td>

                  {/* Sales */}
                  <td className="fp-td fp-hm">
                    <div className="fp-sales">
                      <I d={IC.trendUp} size={12} color="#16a34a"/>
                      <span>{p.sales.toLocaleString('en-IN')}</span>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="fp-td fp-hm">
                    <div className="fp-duration">
                      <span className="fp-dur-start">{p.startDate}</span>
                      <span className="fp-dur-arrow">to</span>
                      <span className="fp-dur-end">{p.endDate}</span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="fp-td"><PriBadge p={p.priority}/></td>

                  {/* Status */}
                  <td className="fp-td"><StatusBdg status={p.status}/></td>

                  {/* Actions */}
                  <td className="fp-td fp-td--r">
                    <div className="fp-acts">
                      <button className={`fp-act fp-act--toggle${p.status==='Active'?' fp-act--toggle--on':''}`}
                        title={p.status==='Active'?'Deactivate':'Activate'}
                        onClick={()=>handleToggle(p)}>
                        <I d={IC.toggle} size={13}/>
                      </button>
                      <button className="fp-act fp-act--edit" title="Edit"
                        onClick={()=>setModal({mode:'edit',item:p})}>
                        <I d={IC.edit} size={13}/>
                      </button>
                      <button className="fp-act fp-act--trash" title="Remove"
                        onClick={()=>handleDelete(p)}>
                        <I d={IC.trash} size={13}/>
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <Pager page={page} total={totalElements}
          onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>

      {modal && <Modal mode={modal.mode} item={modal.item}
        onClose={()=>setModal(null)} onSave={handleSave}/>}
    </div>
  );
}
