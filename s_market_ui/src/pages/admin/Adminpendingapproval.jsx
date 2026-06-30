import React, { useState, useEffect, useCallback } from 'react';
import { getAdminProducts, updateProductStatus, updateProductApprovalStatus, BACKEND_URL } from '../../api/api';
import toast from 'react-hot-toast';
import './Adminpendingapproval.css';

/* ================================================================
   ProductPendingApproval — Table + Detail Panel
   ================================================================ */

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const avatarBg = n => PALETTE[(n || '').charCodeAt(0) % PALETTE.length];
const initials = n => (n || '').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
const fmt      = n => 'Rs.' + Number(n).toLocaleString('en-IN');
const fmtDate  = epoch => {
  if (!epoch) return '—';
  const d = new Date(epoch);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CATEGORIES = ['All','Solar Panels','Batteries','Smart Home'];
const PRIORITIES  = ['All','High','Normal','Low'];
const PER_PAGE    = 6;

/* ── SVG Icons ── */
const I = ({ d, size=14, color='currentColor', sw=2, fill='none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const ICONS = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  check:    'M20 6 9 17l-5-5',
  x:        'M18 6 6 18M6 6l12 12',
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  edit:     ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  flag:     ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z','M4 22v-7'],
  tag:      'M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2zM7 7h.01',
  box:      ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96 12 12.01l8.73-5.05','M12 22.08V12'],
  user:     ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  clock:    'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2',
  alert:    'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  image:    ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z','M12 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  close:    'M18 6 6 18M6 6l12 12',
  info:     ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z','M12 8v4','M12 16h.01'],
  dollar:   'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  layers:   ['M12 2 2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
};

/* ── Shared components ── */
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="pa-search">
    <span className="pa-search__ico"><I d={ICONS.search} size={14} color="#94a3b8"/></span>
    <input className="pa-search__inp" placeholder={placeholder} value={value} onChange={onChange}/>
  </div>
);

const Pills = ({ options, value, onChange }) => (
  <div className="pa-pills">
    {options.map(o => (
      <button key={o} className={`pa-pill${value===o?' pa-pill--on':''}`} onClick={()=>onChange(o)}>{o}</button>
    ))}
  </div>
);

const PriBadge = ({ priority }) => {
  const map = { High:'hi', Normal:'nm', Low:'lo' };
  return <span className={`pa-pri pa-pri--${map[priority]||'nm'}`}>{priority || 'Normal'}</span>;
};

const CatPill = ({ label }) => <span className="pa-cat">{label}</span>;

const FlagTag = ({ text }) => (
  <div className="pa-flag">
    <I d={ICONS.flag} size={11} color="#dc2626" sw={2}/>
    <span>{text}</span>
  </div>
);

/* ── Product image helper ── */
const ProductImage = ({ product }) => {
  const primaryMedia = product.media?.find(m => m.primary) || product.media?.[0];
  if (primaryMedia?.fileName) {
    return (
      <img
        src={`${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`}
        alt={product.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
      />
    );
  }
  return null;
};

const ProductThumb = ({ product, size = 16, style = {} }) => {
  const primaryMedia = product.media?.find(m => m.primary) || product.media?.[0];
  if (primaryMedia?.fileName) {
    return (
      <div className="pa-prod__thumb" style={{ overflow: 'hidden', ...style }}>
        <img
          src={`${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentElement.style.background = avatarBg(product.name) + '18';
            e.target.parentElement.style.border = `1px solid ${avatarBg(product.name)}28`;
          }}
        />
      </div>
    );
  }
  return (
    <div className="pa-prod__thumb" style={{ background: avatarBg(product.name)+'18', border:`1px solid ${avatarBg(product.name)}28`, ...style }}>
      <I d={ICONS.box} size={size} color={avatarBg(product.name)} sw={1.7}/>
    </div>
  );
};

/* ── Detail panel ── */
const DetailPanel = ({ item, onClose, onApprove, onReject, onRequestChanges, changesReqId }) => (
  <tr className="pa-detail-row">
    <td colSpan="10" className="pa-detail-td">
      <div className="pa-detail">
        {/* Header */}
        <div className="pa-detail__hd">
          <div className="pa-detail__hd-left">
            <div className="pa-detail__thumb" style={{ background: avatarBg(item.name)+'18', border:`1px solid ${avatarBg(item.name)}30`, overflow: 'hidden' }}>
              <ProductImage product={item}/>
              <I d={ICONS.box} size={22} color={avatarBg(item.name)} sw={1.6}/>
            </div>
            <div>
              <p className="pa-detail__name">{item.name}</p>
              <p className="pa-detail__meta">#{item.id} · {item.sku || '—'} · {item.category}</p>
            </div>
          </div>
          <div className="pa-detail__hd-right">
            <PriBadge priority={item.priority}/>
            <button className="pa-ib pa-ib--close" onClick={onClose}><I d={ICONS.close} size={13}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="pa-detail__body">

          {/* Left col */}
          <div className="pa-detail__col">
            <p className="pa-detail__sec">Description</p>
            <p className="pa-detail__desc">{item.desc || 'No description provided.'}</p>

            {item.specs && Object.keys(item.specs).length > 0 && (
              <>
                <p className="pa-detail__sec" style={{marginTop:16}}>Specifications</p>
                <div className="pa-specs">
                  {Object.entries(item.specs).map(([k,v]) => (
                    <div key={k} className="pa-spec-row">
                      <span className="pa-spec-row__k">{k}</span>
                      <span className="pa-spec-row__v">{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right col */}
          <div className="pa-detail__col pa-detail__col--r">
            <p className="pa-detail__sec">Pricing & Stock</p>
            <div className="pa-info-grid">
              {[
                { label:'Price',     val: fmt(item.price),       ico: ICONS.dollar  },
                { label:'Stock',     val: `${item.stock} units`, ico: ICONS.layers  },
                { label:'Images',    val: `${item.images} uploaded`, ico: ICONS.image },
                { label:'Submitted', val: item.submittedOn,      ico: ICONS.calendar},
                ...(item.reviewDue ? [{ label:'Due By', val: item.reviewDue, ico: ICONS.clock }] : []),
              ].map((r,i) => (
                <div key={i} className="pa-info-item">
                  <div className="pa-info-item__ico">
                    <I d={r.ico} size={13} color="#94a3b8"/>
                  </div>
                  <div>
                    <p className="pa-info-item__l">{r.label}</p>
                    <p className="pa-info-item__v">{r.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="pa-detail__sec" style={{marginTop:16}}>Seller</p>
            <div className="pa-seller">
              <div className="pa-seller__av" style={{ background: avatarBg(item.seller) }}>
                {initials(item.seller)}
              </div>
              <div>
                <p className="pa-seller__n">{item.seller}</p>
                <p className="pa-seller__id">{item.sellerCode}</p>
              </div>
            </div>

            {item.flags && item.flags.length > 0 && (
              <>
                <p className="pa-detail__sec" style={{marginTop:16}}>Review Flags</p>
                <div className="pa-flag-list">
                  {item.flags.map((f,i) => <FlagTag key={i} text={f}/>)}
                </div>
              </>
            )}

            <p className="pa-detail__sec" style={{marginTop:16}}>Decision</p>
            <div className="pa-decision">
              <button className="pa-btn pa-btn--approve" onClick={() => onApprove(item.id)}>
                <I d={ICONS.check} size={14} color="#fff" sw={2.5}/>Approve Product
              </button>
              <button className="pa-btn pa-btn--reject" onClick={() => onReject(item.id)}>
                <I d={ICONS.x} size={14} color="#dc2626" sw={2.5}/>Reject
              </button>
              <button className={`pa-btn pa-btn--edit${changesReqId === item.id ? ' pa-btn--loading' : ''}`}
                onClick={() => onRequestChanges(item.id)}>
                <I d={ICONS.edit} size={13} color={changesReqId === item.id ? '#fff' : '#475569'}/>
                {changesReqId === item.id ? 'Sending...' : 'Request Changes'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </td>
  </tr>
);

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function ProductPendingApproval() {
  const [search,   setSearch]   = useState('');
  const [catF,     setCatF]     = useState('All');
  const [priF,     setPriF]     = useState('All');
  const [checked,  setChecked]  = useState({});
  const [expanded, setExpanded] = useState(null);
  const [page,     setPage]     = useState(0);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [changesReqId, setChangesReqId] = useState(null);

  /* ── Map API product to UI shape ── */
  const mapProduct = (p) => ({
    id: p.id,
    name: p.name || 'Untitled Product',
    sku: p.sku || '—',
    category: p.category || '—',
    subCategory: p.subCategory || '',
    seller: p.vendorId ? `Vendor #${p.vendorId}` : 'Unknown Seller',
    sellerCode: p.vendorId ? `VEN-${String(p.vendorId).padStart(3,'0')}` : '—',
    price: p.discountPrice || p.regularPrice || 0,
    stock: p.initialStock || 0,
    submittedOn: fmtDate(p.createdAt),
    reviewDue: '',
    priority: 'Normal',
    images: p.media?.length || 0,
    media: p.media || [],
    desc: p.description || '',
    flags: [],
    status: p.status,
    specs: {
      ...(p.brand ? { Brand: p.brand } : {}),
      ...(p.sku ? { SKU: p.sku } : {}),
      ...(p.category ? { Category: p.category } : {}),
      ...(p.subCategory ? { 'Sub Category': p.subCategory } : {}),
      ...(p.regularPrice ? { 'Regular Price': fmt(p.regularPrice) } : {}),
      ...(p.discountPrice ? { 'Discount Price': fmt(p.discountPrice) } : {}),
      ...(p.averageRating ? { Rating: `${p.averageRating} (${p.reviewCount || 0} reviews)` } : {}),
    },
  });

  /* ── Fetch products from API ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        status: 'Pending',
        page,
        size: PER_PAGE,
      };
      if (search.trim()) params.search = search.trim();
      if (catF !== 'All') params.category = catF;

      const data = await getAdminProducts(params);
      const mapped = (data.content || []).map(mapProduct);
      setProducts(mapped);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error(err?.message || 'Failed to load pending products');
      setProducts([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, catF]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Filter by priority (client-side since API may not support it) ── */
  const list = products.filter(p => {
    const mP = priF === 'All' || p.priority === priF;
    return mP;
  });

  const slice = list;
  const allC  = slice.length > 0 && slice.every(p => checked[p.id]);

  const toggleAll = () => {
    if (allC) setChecked(prev => { const n = {...prev}; slice.forEach(p => delete n[p.id]); return n; });
    else      setChecked(prev => { const n = {...prev}; slice.forEach(p => n[p.id] = true); return n; });
  };

  const handleApprove = async (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      await updateProductStatus(id, 'Active');
      toast.success(`${product.name} approved successfully!`);
      setExpanded(null);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve product');
    }
  };

  const handleReject = async (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      await updateProductStatus(id, 'Rejected');
      toast.success(`${product.name} rejected.`);
      setExpanded(null);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject product');
    }
  };

  const handleRequestChanges = (id) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setChangesReqId(id);
      toast.success(`Change request sent to seller for ${product.name}.`);
      setTimeout(() => setChangesReqId(null), 1500);
    }
  };

  const handleBulkApprove = async () => {
    const ids = Object.keys(checked).filter(id => checked[id]);
    if (ids.length === 0) {
      toast('Please select products to approve');
      return;
    }
    try {
      await Promise.all(ids.map(id => updateProductStatus(id, 'Active')));
      setChecked({});
      toast.success(`${ids.length} product${ids.length > 1 ? 's' : ''} approved!`);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve selected products');
    }
  };

  const handleBulkReject = async () => {
    const ids = Object.keys(checked).filter(id => checked[id]);
    if (ids.length === 0) {
      toast('Please select products to reject');
      return;
    }
    try {
      await Promise.all(ids.map(id => updateProductStatus(id, 'Rejected')));
      setChecked({});
      toast.success(`${ids.length} product${ids.length > 1 ? 's' : ''} rejected!`);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject selected products');
    }
  };

  const handleExport = () => {
    if (list.length === 0) {
      toast('No products to export');
      return;
    }
    const data = list.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      seller: p.seller,
      category: p.category,
      price: p.price,
      stock: p.stock,
      priority: p.priority,
      submittedOn: p.submittedOn,
      flags: p.flags.join('; ') || 'None',
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${list.length} product${list.length !== 1 ? 's' : ''}`);
  };

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  const flagCount = products.reduce((acc, p) => acc + (p.flags?.length || 0), 0);
  const highCount = products.filter(p => p.priority === 'High').length;

  return (
    <div className="pa">

      {/* ── Header ── */}
      <div className="pa-hdr">
        <div>
          <h2 className="pa-hdr__t">Product Pending Approval</h2>
          <p className="pa-hdr__s">Review and approve submitted products before they go live.</p>
        </div>
        <button className="pa-btn pa-btn--dl" onClick={handleExport}>
          <I d={ICONS.download} size={13} color="#475569"/>Export
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="pa-kpi-strip">
        {[
          { label:'Pending Review', val: totalElements, color:'#E03E1A', bg:'#fff0ed', ico: ICONS.clock   },
          { label:'High Priority',  val: highCount,        color:'#dc2626', bg:'#fee2e2', ico: ICONS.alert   },
          { label:'With Flags',     val: flagCount,        color:'#d97706', bg:'#fef3c7', ico: ICONS.flag    },
          { label:'Categories',     val: new Set(products.map(p => p.category)).size, color:'#2563eb', bg:'#dbeafe', ico: ICONS.tag },
        ].map((k, i) => (
          <div key={i} className="pa-kpi">
            <div className="pa-kpi__ico" style={{ background: k.bg }}>
              <I d={k.ico} size={16} color={k.color} sw={2.1}/>
            </div>
            <div>
              <div className="pa-kpi__val" style={{ color: k.color }}>{k.val}</div>
              <div className="pa-kpi__lbl">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="pa-card">
        {/* Section head */}
        <div className="pa-sh">
          <div>
            <p className="pa-sh__t">Pending Products</p>
            <p className="pa-sh__s">{totalElements} product{totalElements!==1?'s':''} awaiting review</p>
          </div>
          <div className="pa-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setExpanded(null);}}
              placeholder="Search product, SKU, seller…"/>
            <Pills options={CATEGORIES} value={catF} onChange={v=>{setCatF(v);setPage(0);setExpanded(null);}}/>
            <Pills options={PRIORITIES} value={priF} onChange={v=>{setPriF(v);setPage(0);setExpanded(null);}}/>
            {Object.keys(checked).some(id => checked[id]) && (
              <div className="pa-bulk-acts">
                <button className="pa-btn pa-btn--approve" onClick={handleBulkApprove}>
                  <I d={ICONS.check} size={12} color="#fff" sw={2.5}/>Approve Selected
                </button>
                <button className="pa-btn pa-btn--reject" onClick={handleBulkReject}>
                  <I d={ICONS.x} size={12} color="#dc2626" sw={2.5}/>Reject Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="pa-tw">
          <table className="pa-tbl">
            <thead>
              <tr>
                <th className="pa-th pa-th--chk">
                  <input type="checkbox" className="pa-chk" checked={allC} onChange={toggleAll}/>
                </th>
                <th className="pa-th">Product</th>
                <th className="pa-th pa-hm">SKU</th>
                <th className="pa-th pa-hm">Seller</th>
                <th className="pa-th">Category</th>
                <th className="pa-th">Price</th>
                <th className="pa-th pa-hm">Stock</th>
                <th className="pa-th pa-hm">Submitted</th>
                <th className="pa-th pa-hm">Due By</th>
                <th className="pa-th">Priority</th>
                <th className="pa-th pa-hm">Flags</th>
                <th className="pa-th pa-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="12" className="pa-empty">Loading pending products...</td></tr>
              )}
              {!loading && slice.length === 0 && (
                <tr><td colSpan="12" className="pa-empty">No products match your search or filter.</td></tr>
              )}
              {!loading && slice.map(p => (
                <React.Fragment key={p.id}>
                  <tr className={`pa-tr${checked[p.id]?' pa-tr--sel':''}${expanded===p.id?' pa-tr--exp':''}`}>
                    {/* Checkbox */}
                    <td className="pa-td pa-td--chk">
                      <input type="checkbox" className="pa-chk" checked={!!checked[p.id]}
                        onChange={()=>setChecked(prev=>({...prev,[p.id]:!prev[p.id]}))}/>
                    </td>

                    {/* Product */}
                    <td className="pa-td">
                      <div className="pa-prod">
                        <ProductThumb product={p}/>
                        <div>
                          <div className="pa-prod__name">{p.name}</div>
                          <div className="pa-prod__id">#{p.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="pa-td pa-hm">
                      <span className="pa-sku">{p.sku}</span>
                    </td>

                    {/* Seller */}
                    <td className="pa-td pa-hm">
                      <div className="pa-seller-cell">
                        <div className="pa-seller-cell__av" style={{ background: avatarBg(p.seller) }}>
                          {initials(p.seller)}
                        </div>
                        <div>
                          <div className="pa-seller-cell__n">{p.seller}</div>
                          <div className="pa-seller-cell__id">{p.sellerCode}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="pa-td"><CatPill label={p.category}/></td>

                    {/* Price */}
                    <td className="pa-td">
                      <span className="pa-price">{fmt(p.price)}</span>
                    </td>

                    {/* Stock */}
                    <td className="pa-td pa-hm">
                      <span className="pa-stock">{p.stock}</span>
                    </td>

                    {/* Submitted */}
                    <td className="pa-td pa-hm">
                      <span className="pa-date">{p.submittedOn}</span>
                    </td>

                    {/* Due By */}
                    <td className="pa-td pa-hm">
                      <span className="pa-due">{p.reviewDue || '—'}</span>
                    </td>

                    {/* Priority */}
                    <td className="pa-td"><PriBadge priority={p.priority}/></td>

                    {/* Flags */}
                    <td className="pa-td pa-hm">
                      {p.flags && p.flags.length > 0
                        ? <span className="pa-flag-count"><I d={ICONS.flag} size={11} color="#dc2626" sw={2}/>{p.flags.length}</span>
                        : <span className="pa-no-flag"><I d={ICONS.check} size={11} color="#16a34a" sw={2.5}/>Clean</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="pa-td pa-td--r">
                      <div className="pa-acts">
                        <button className="pa-act pa-act--approve" title="Approve" onClick={()=>handleApprove(p.id)}>
                          <I d={ICONS.check} size={13} color="#16a34a" sw={2.5}/>
                        </button>
                        <button className="pa-act pa-act--reject" title="Reject" onClick={()=>handleReject(p.id)}>
                          <I d={ICONS.x} size={13} color="#dc2626" sw={2.5}/>
                        </button>
                        <button className={`pa-act pa-act--view${expanded===p.id?' pa-act--view--on':''}`}
                          title="Review" onClick={()=>toggleExpand(p.id)}>
                          <I d={ICONS.eye} size={13} color={expanded===p.id?'#fff':'#2563eb'}/>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline detail panel */}
                  {expanded === p.id && (
                    <DetailPanel item={p} onClose={()=>setExpanded(null)}
                      onApprove={handleApprove} onReject={handleReject}
                      onRequestChanges={handleRequestChanges} changesReqId={changesReqId}/>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pa-pag">
          <span className="pa-pag__info">
            {totalElements === 0 ? '0 results'
              : `${page*PER_PAGE+1}–${Math.min((page+1)*PER_PAGE, totalElements)} of ${totalElements}`}
          </span>
          <div className="pa-pag__ctrl">
            <button className="pa-pag__btn" onClick={()=>setPage(p=>p-1)} disabled={page===0}>
              <I d={ICONS.chevL} size={13} color="#475569"/>
            </button>
            <span className="pa-pag__lbl">{page+1} / {totalPages}</span>
            <button className="pa-pag__btn" onClick={()=>setPage(p=>p+1)} disabled={page+1>=totalPages}>
              <I d={ICONS.chevR} size={13} color="#475569"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
