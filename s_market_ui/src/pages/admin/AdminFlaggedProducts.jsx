import React, { useState, useEffect, useCallback } from 'react';
import { getAdminProducts, updateProductStatus, deleteProduct, BACKEND_URL } from '../../api/api';
import { exportCSV } from './VendorShared';
import toast from 'react-hot-toast';
import './AdminFlaggedProducts.css';

/* ================================================================
   FlaggedProducts — Review, resolve, or remove flagged listings
   ================================================================ */

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const colorFor = s => PALETTE[(s || '').charCodeAt(0) % PALETTE.length];
const fmt      = n => 'Rs.' + Number(n || 0).toLocaleString('en-IN');

const FLAG_TYPES = ['All','Misleading Specs','Counterfeit Product','Safety Hazard','Missing Certification','Pricing Violation','Incomplete Listing','Policy Violation'];
const SEVERITIES = ['All','Critical','High','Medium','Low'];
const STATUSES   = ['All','Under Review','Resolved','Dismissed'];
const PER_PAGE   = 8;

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
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  check:    'M20 6 9 17l-5-5',
  x:        'M18 6 6 18M6 6l12 12',
  plus:     'M12 5v14M5 12h14',
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  close:    'M18 6 6 18M6 6l12 12',
  flag:     ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z','M4 22v-7'],
  alert:    'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  box:      ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96 12 12.01l8.73-5.05','M12 22.08V12'],
  user:     ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  shield:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  ban:      'M18.364 18.364A9 9 0 1 1 5.636 5.636a9 9 0 0 1 12.728 12.728zM5.636 5.636l12.728 12.728',
  checkCirc:'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  msgCirc:  ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  trendUp:  ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
};

/* ── Helper: map backend product to flagged-product shape ── */
const mapProduct = (p) => {
  const primaryMedia = p.media?.find(m => m.primary) || p.media?.[0];
  const imageUrl = primaryMedia
    ? `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`
    : null;
  const createdDate = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return {
    id: p.id,
    productId: `PRD-${p.id}`,
    name: p.name || 'Unnamed Product',
    sku: p.sku || 'N/A',
    category: p.category || 'Uncategorized',
    brand: p.brand || 'Unknown',
    price: p.discountPrice || p.regularPrice || 0,
    seller: p.vendorId ? `Vendor #${p.vendorId}` : 'Unknown Seller',
    flagType: 'Policy Violation',
    flaggedBy: 'System',
    flaggedOn: createdDate,
    severity: 'Medium',
    status: p.status === 'Flagged' ? 'Under Review'
          : p.status === 'Inactive' ? 'Under Review'
          : p.status === 'Rejected' ? 'Dismissed'
          : 'Under Review',
    reports: p.reviewCount || 0,
    notes: `Product status: ${p.status || 'Unknown'}. Rating: ${p.averageRating ?? 'N/A'}.`,
    imageUrl,
    rawStatus: p.status,
  };
};

/* ── Shared UI ── */
const SearchBar = ({ value, onChange }) => (
  <div className="flg-search">
    <span className="flg-search__ico"><I d={IC.search} size={14} color="#94a3b8"/></span>
    <input className="flg-search__inp" placeholder="Search product, seller, flag type..."
      value={value} onChange={onChange}/>
  </div>
);

const Pills = ({ options, value, onChange }) => (
  <div className="flg-pills">
    {options.map(o=>(
      <button key={o} className={`flg-pill${value===o?' flg-pill--on':''}`} onClick={()=>onChange(o)}>{o}</button>
    ))}
  </div>
);

const SeverityBdg = ({ s }) => {
  const m = { Critical:'crit', High:'high', Medium:'med', Low:'low' };
  return <span className={`flg-sev flg-sev--${m[s]||'med'}`}>{s}</span>;
};

const StatusBdg = ({ s }) => {
  const m = { 'Under Review':'rev', Resolved:'res', Dismissed:'dis' };
  return <span className={`flg-st flg-st--${m[s]||'rev'}`}><span className="flg-st__dot"/>{s}</span>;
};

const FlagTypePill = ({ t }) => {
  const m = {
    'Misleading Specs':'spec','Counterfeit Product':'fake',
    'Safety Hazard':'safe','Missing Certification':'cert',
    'Pricing Violation':'price','Incomplete Listing':'inc','Policy Violation':'pol',
  };
  return <span className={`flg-ft flg-ft--${m[t]||'pol'}`}>{t}</span>;
};

const Pager = ({ page, total, onPrev, onNext }) => {
  const pages = Math.ceil(total/PER_PAGE)||1;
  return (
    <div className="flg-pag">
      <span className="flg-pag__info">
        {total===0?'0 results':`${page*PER_PAGE+1}–${Math.min((page+1)*PER_PAGE,total)} of ${total}`}
      </span>
      <div className="flg-pag__ctrl">
        <button className="flg-pag__btn" onClick={onPrev} disabled={page===0}><I d={IC.chevL} size={13} color="#475569"/></button>
        <span className="flg-pag__lbl">{page+1} / {pages}</span>
        <button className="flg-pag__btn" onClick={onNext} disabled={(page+1)*PER_PAGE>=total}><I d={IC.chevR} size={13} color="#475569"/></button>
      </div>
    </div>
  );
};

/* ── Detail panel (inline) ── */
const DetailPanel = ({ item, onClose, onResolve, onDismiss, onRemove }) => (
  <tr className="flg-detail-row">
    <td colSpan="11" className="flg-detail-td">
      <div className="flg-detail">

        {/* Head */}
        <div className="flg-detail__hd">
          <div className="flg-detail__hd-l">
            <div className="flg-detail__thumb" style={{background:`${colorFor(item.name)}18`,border:`1px solid ${colorFor(item.name)}28`}}>
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}}/>
                : <I d={IC.box} size={20} color={colorFor(item.name)} sw={1.7}/>}
            </div>
            <div>
              <p className="flg-detail__name">{item.name}</p>
              <p className="flg-detail__meta">{item.productId} · {item.sku} · {item.category}</p>
            </div>
          </div>
          <div className="flg-detail__hd-r">
            <SeverityBdg s={item.severity}/>
            <StatusBdg   s={item.status}/>
            <button className="flg-ib" onClick={onClose}><I d={IC.close} size={13}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="flg-detail__body">

          {/* Left */}
          <div className="flg-detail__col">
            <p className="flg-detail__sec">Flag Details</p>
            <div className="flg-info-grid">
              {[
                { label:'Flag Type',   val:<FlagTypePill t={item.flagType}/>,         ico:IC.flag    },
                { label:'Flagged By',  val:item.flaggedBy,                            ico:IC.user    },
                { label:'Flagged On',  val:item.flaggedOn,                            ico:IC.calendar},
                { label:'Reports',     val:`${item.reports} report${item.reports!==1?'s':''}`, ico:IC.alert },
                { label:'Seller',      val:item.seller,                               ico:IC.user    },
                { label:'Price',       val:fmt(item.price),                           ico:IC.trendUp },
              ].map((r,i)=>(
                <div key={i} className="flg-info-row">
                  <div className="flg-info-row__ico"><I d={r.ico} size={12} color="#94a3b8"/></div>
                  <div>
                    <p className="flg-info-row__l">{r.label}</p>
                    <p className="flg-info-row__v">{r.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flg-detail__col flg-detail__col--r">
            <p className="flg-detail__sec">Review Notes</p>
            <div className="flg-notes">
              <I d={IC.msgCirc} size={14} color="#94a3b8"/>
              <p>{item.notes}</p>
            </div>

            <p className="flg-detail__sec" style={{marginTop:18}}>Actions</p>
            <div className="flg-actions-row">
              <button className="flg-abtn flg-abtn--resolve" onClick={()=>onResolve(item.id)}>
                <I d={IC.checkCirc} size={14} color="#fff" sw={2.5}/>Mark Resolved
              </button>
              <button className="flg-abtn flg-abtn--dismiss" onClick={()=>onDismiss(item.id)}>
                <I d={IC.x} size={13} color="#d97706" sw={2.5}/>Dismiss Flag
              </button>
              <button className="flg-abtn flg-abtn--remove" onClick={()=>onRemove(item.id)}>
                <I d={IC.ban} size={13} color="#dc2626" sw={2}/>Remove Product
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
export default function FlaggedProducts() {
  const [search,   setSearch]   = useState('');
  const [typeF,    setTypeF]    = useState('All');
  const [sevF,     setSevF]     = useState('All');
  const [statF,    setStatF]    = useState('All');
  const [checked,  setChecked]  = useState({});
  const [expanded, setExpanded] = useState(null);
  const [page,     setPage]     = useState(0);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  /* ── Fetch flagged products from backend ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Try fetching with 'Flagged' status first; fall back to fetching all and filtering
      let data;
      try {
        data = await getAdminProducts({ status: 'Flagged', page, size: 100, search: search || undefined });
      } catch {
        data = null;
      }

      // If 'Flagged' status returned no content, try fetching Inactive/Rejected as flagged
      if (!data || !data.content || data.content.length === 0) {
        const [inactiveData, rejectedData] = await Promise.all([
          getAdminProducts({ status: 'Inactive', page: 0, size: 100, search: search || undefined }).catch(() => ({ content: [] })),
          getAdminProducts({ status: 'Rejected', page: 0, size: 100, search: search || undefined }).catch(() => ({ content: [] })),
        ]);
        const combined = [...(inactiveData?.content || []), ...(rejectedData?.content || [])];
        // Also use flagged data if it had content
        if (data?.content?.length) {
          combined.push(...data.content);
        }
        setItems(combined.map(mapProduct));
        setTotalElements(combined.length);
      } else {
        setItems(data.content.map(mapProduct));
        setTotalElements(data.totalElements || data.content.length);
      }
    } catch (err) {
      console.error('Failed to fetch flagged products:', err);
      toast.error('Failed to load flagged products');
      setItems([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Client-side filtering (flag type, severity, status are local UI concepts) ── */
  const list = items.filter(p => {
    const mT = typeF === 'All' || p.flagType === typeF;
    const mSev = sevF === 'All' || p.severity === sevF;
    const mSt  = statF === 'All' || p.status === statF;
    const q = search.toLowerCase();
    const mQ = !q || p.name.toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q)
                  || p.seller.toLowerCase().includes(q) || p.flagType.toLowerCase().includes(q)
                  || p.productId.toLowerCase().includes(q);
    return mT && mSev && mSt && mQ;
  });

  const slice = list.slice(page*PER_PAGE, (page+1)*PER_PAGE);
  const allC  = slice.length>0 && slice.every(p=>checked[p.id]);
  const toggleAll = () => {
    if(allC) setChecked(pr=>{const n={...pr};slice.forEach(p=>delete n[p.id]);return n;});
    else     setChecked(pr=>{const n={...pr};slice.forEach(p=>n[p.id]=true);return n;});
  };

  /* ── Actions wired to backend ── */
  const handleUnflag = async (id) => {
    try {
      await updateProductStatus(id, 'Active');
      toast.success('Product unflagged (set to Active)');
      setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'Resolved' } : x));
      setExpanded(null);
    } catch (err) {
      console.error('Failed to unflag product:', err);
      toast.error('Failed to unflag product');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await updateProductStatus(id, 'Active');
      toast.success('Flag dismissed, product reactivated');
      setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'Dismissed' } : x));
      setExpanded(null);
    } catch (err) {
      console.error('Failed to dismiss flag:', err);
      toast.error('Failed to dismiss flag');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully');
      setItems(prev => prev.filter(x => x.id !== id));
      setExpanded(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('Failed to delete product');
    }
  };

  /* KPIs */
  const underReview = items.filter(p=>p.status==='Under Review').length;
  const critical    = items.filter(p=>p.severity==='Critical').length;
  const resolved    = items.filter(p=>p.status==='Resolved').length;
  const totalRep    = items.reduce((a,p)=>a+p.reports,0);

  return (
    <div className="flg">

      {/* ── Header ── */}
      <div className="flg-hdr">
        <div>
          <h2 className="flg-hdr__t">Flagged Products</h2>
          <p className="flg-hdr__s">Review reported listings for policy violations, safety issues, and counterfeit claims.</p>
        </div>
        <button className="flg-btn flg-btn--out" onClick={() => exportCSV([['Product','ID','SKU','Category','Seller','Flag Type','Flagged By','Reports','Price','Flagged On','Severity','Status'],...list.map(p=>[p.name,p.productId,p.sku,p.category,p.seller,p.flagType,p.flaggedBy,p.reports,p.price,p.flaggedOn,p.severity,p.status])],'flagged-products.csv')}>
          <I d={IC.download} size={13} color="#475569"/>Export Report
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="flg-kpi-strip">
        {[
          { label:'Under Review',  val: underReview,  color:'#E03E1A', bg:'#fff0ed', ico: IC.flag       },
          { label:'Critical',      val: critical,     color:'#dc2626', bg:'#fee2e2', ico: IC.alert      },
          { label:'Total Reports', val: totalRep,     color:'#d97706', bg:'#fef3c7', ico: IC.msgCirc    },
          { label:'Resolved',      val: resolved,     color:'#16a34a', bg:'#dcfce7', ico: IC.checkCirc  },
          { label:'Total Flagged', val: items.length, color:'#7c3aed', bg:'#ede9fe', ico: IC.shield     },
        ].map((k,i)=>(
          <div key={i} className="flg-kpi">
            <div className="flg-kpi__ico" style={{background:k.bg}}>
              <I d={k.ico} size={16} color={k.color} sw={2.1}/>
            </div>
            <div>
              <div className="flg-kpi__val" style={{color:k.color}}>{k.val}</div>
              <div className="flg-kpi__lbl">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="flg-card">
        <div className="flg-sh">
          <div>
            <p className="flg-sh__t">Flagged Listings</p>
            <p className="flg-sh__s">{loading ? 'Loading...' : `${list.length} item${list.length!==1?'s':''} found`}</p>
          </div>
          <div className="flg-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setExpanded(null);}}/>
            <Pills options={STATUSES.slice(0,3)}   value={statF} onChange={v=>{setStatF(v);setPage(0);setExpanded(null);}}/>
            <Pills options={SEVERITIES} value={sevF}  onChange={v=>{setSevF(v);setPage(0);setExpanded(null);}}/>
          </div>
        </div>

        <div className="flg-tw">
          <table className="flg-tbl">
            <thead>
              <tr>
                <th className="flg-th flg-th--chk">
                  <input type="checkbox" className="flg-chk" checked={allC} onChange={toggleAll}/>
                </th>
                <th className="flg-th">Product</th>
                <th className="flg-th flg-hm">Seller</th>
                <th className="flg-th">Flag Type</th>
                <th className="flg-th flg-hm">Flagged By</th>
                <th className="flg-th flg-hm">Reports</th>
                <th className="flg-th flg-hm">Price</th>
                <th className="flg-th flg-hm">Flagged On</th>
                <th className="flg-th">Severity</th>
                <th className="flg-th">Status</th>
                <th className="flg-th flg-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="11" className="flg-empty">Loading flagged products...</td></tr>
              )}
              {!loading && slice.length===0 && (
                <tr><td colSpan="11" className="flg-empty">No flagged products match your filters.</td></tr>
              )}
              {!loading && slice.map(p=>(
                <React.Fragment key={p.id}>
                  <tr className={`flg-tr${checked[p.id]?' flg-tr--sel':''}${expanded===p.id?' flg-tr--exp':''}`}>

                    {/* Checkbox */}
                    <td className="flg-td flg-td--chk">
                      <input type="checkbox" className="flg-chk" checked={!!checked[p.id]}
                        onChange={()=>setChecked(pr=>({...pr,[p.id]:!pr[p.id]}))}/>
                    </td>

                    {/* Product */}
                    <td className="flg-td">
                      <div className="flg-prod">
                        <div className="flg-prod__thumb" style={{background:`${colorFor(p.name)}18`,border:`1px solid ${colorFor(p.name)}28`}}>
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}}/>
                            : <I d={IC.box} size={15} color={colorFor(p.name)} sw={1.7}/>}
                        </div>
                        <div>
                          <span className="flg-prod__name">{p.name}</span>
                          <span className="flg-prod__id">{p.productId} · {p.sku}</span>
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="flg-td flg-hm">
                      <div className="flg-seller">
                        <div className="flg-seller__av" style={{background:colorFor(p.seller)}}>
                          {p.seller.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <span className="flg-seller__n">{p.seller}</span>
                      </div>
                    </td>

                    {/* Flag Type */}
                    <td className="flg-td"><FlagTypePill t={p.flagType}/></td>

                    {/* Flagged By */}
                    <td className="flg-td flg-hm">
                      <span className="flg-by">{p.flaggedBy}</span>
                    </td>

                    {/* Reports */}
                    <td className="flg-td flg-hm">
                      <div className="flg-rep">
                        <I d={IC.alert} size={12} color={p.reports>=10?'#dc2626':p.reports>=5?'#d97706':'#94a3b8'} sw={2}/>
                        <span style={{color:p.reports>=10?'#dc2626':p.reports>=5?'#d97706':'#0f172a'}}>{p.reports}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="flg-td flg-hm">
                      <span className="flg-price">{fmt(p.price)}</span>
                    </td>

                    {/* Flagged On */}
                    <td className="flg-td flg-hm">
                      <span className="flg-date">{p.flaggedOn}</span>
                    </td>

                    {/* Severity */}
                    <td className="flg-td"><SeverityBdg s={p.severity}/></td>

                    {/* Status */}
                    <td className="flg-td"><StatusBdg s={p.status}/></td>

                    {/* Actions */}
                    <td className="flg-td flg-td--r">
                      <div className="flg-acts">
                        <button className="flg-act flg-act--resolve" title="Unflag (set Active)"
                          onClick={()=>handleUnflag(p.id)}>
                          <I d={IC.check} size={13} color="#16a34a" sw={2.5}/>
                        </button>
                        <button className="flg-act flg-act--dismiss" title="Dismiss"
                          onClick={()=>handleDismiss(p.id)}>
                          <I d={IC.x} size={13} color="#d97706" sw={2.5}/>
                        </button>
                        <button className={`flg-act flg-act--view${expanded===p.id?' flg-act--view--on':''}`}
                          title="Review details" onClick={()=>setExpanded(pr=>pr===p.id?null:p.id)}>
                          <I d={IC.eye} size={13} color={expanded===p.id?'#fff':'#2563eb'}/>
                        </button>
                        <button className="flg-act flg-act--trash" title="Remove product"
                          onClick={()=>handleRemove(p.id)}>
                          <I d={IC.trash} size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded===p.id && (
                    <DetailPanel item={p}
                      onClose={()=>setExpanded(null)}
                      onResolve={handleUnflag}
                      onDismiss={handleDismiss}
                      onRemove={handleRemove}/>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <Pager page={page} total={list.length}
          onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>

    </div>
  );
}
