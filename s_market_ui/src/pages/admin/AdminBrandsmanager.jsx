import React, { useState, useEffect } from 'react';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../../api/api';
import { exportCSV } from './VendorShared';
import './AdminBrandsmanager.css';

/* ================================================================
   BrandsManager — Table + Add/Edit Modal
   ================================================================ */

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const colorFor = s => PALETTE[s.charCodeAt(0) % PALETTE.length];
const initials = s => s.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

/* ── DATA ── */

const CATEGORIES_LIST = ['All','Solar Panels','Batteries','Smart Home','Inverters','Lighting','Water Heaters','EV Accessories','Charge Controllers'];
const STATUS_LIST     = ['All','Active','Inactive','Draft'];
const COUNTRIES_LIST  = ['All','India','Germany','China'];
const PER_PAGE = 8;

/* ── Icons ── */
const I = ({ d, size=14, color='currentColor', sw=2, fill='none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const IC = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  edit:     ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:    ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M10 11v6M14 11v6','M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  plus:     'M12 5v14M5 12h14',
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  check:    'M20 6 9 17l-5-5',
  x:        'M18 6 6 18M6 6l12 12',
  shield:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  globe:    ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z','M2 12h20','M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  tag:      'M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2zM7 7h.01',
  box:      ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96 12 12.01l8.73-5.05','M12 22.08V12'],
  mappin:   'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  award:    ['M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z','M8.21 13.89 7 23l5-3 5 3-1.21-9.12'],
};

/* ── Shared UI ── */
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="br-search">
    <span className="br-search__ico"><I d={IC.search} size={14} color="#94a3b8"/></span>
    <input className="br-search__inp" placeholder={placeholder} value={value} onChange={onChange}/>
  </div>
);

const Pills = ({ options, value, onChange }) => (
  <div className="br-pills">
    {options.map(o=>(
      <button key={o} className={`br-pill${value===o?' br-pill--on':''}`} onClick={()=>onChange(o)}>{o}</button>
    ))}
  </div>
);

const StatusBdg = ({ status }) => {
  const m = { Active:'act', Inactive:'inact', Draft:'draft' };
  return <span className={`br-bdg br-bdg--${m[status]||'inact'}`}><span className="br-bdg__dot"/>{status}</span>;
};

const Pager = ({ page, total, onPrev, onNext }) => {
  const pages = Math.ceil(total/PER_PAGE)||1;
  return (
    <div className="br-pag">
      <span className="br-pag__info">
        {total===0?'0 results':`${page*PER_PAGE+1}–${Math.min((page+1)*PER_PAGE,total)} of ${total}`}
      </span>
      <div className="br-pag__ctrl">
        <button className="br-pag__btn" onClick={onPrev} disabled={page===0}><I d={IC.chevL} size={13} color="#475569"/></button>
        <span className="br-pag__lbl">{page+1} / {pages}</span>
        <button className="br-pag__btn" onClick={onNext} disabled={(page+1)*PER_PAGE>=total}><I d={IC.chevR} size={13} color="#475569"/></button>
      </div>
    </div>
  );
};

/* ── Add / Edit Modal ── */
const Modal = ({ mode, item, onClose, onSave }) => {
  const [name,     setName]     = useState(item?.name     || '');
  const [slug,     setSlug]     = useState(item?.slug     || '');
  const [category, setCategory] = useState(item?.category || CATEGORIES_LIST[1]);
  const [country,  setCountry]  = useState(item?.country  || 'India');
  const [website,  setWebsite]  = useState(item?.website  || '');
  const [desc,     setDesc]     = useState(item?.desc     || '');
  const [status,   setStatus]   = useState(item?.status   || 'Active');
  const [featured, setFeatured] = useState(item?.featured || false);
  const [verified, setVerified] = useState(item?.verified || false);

  const autoSlug = v => v.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const handleName = v => { setName(v); if(!item) setSlug(autoSlug(v)); };

  return (
    <div className="br-overlay" onClick={e=>{ if(e.target.className==='br-overlay') onClose(); }}>
      <div className="br-modal">
        <div className="br-modal__hd">
          <div className="br-modal__hd-left">
            <div className="br-modal__hd-icon">
              <I d={IC.award} size={16} color="#E03E1A" sw={2}/>
            </div>
            <p className="br-modal__title">{mode==='add'?'Add New Brand':'Edit Brand'}</p>
          </div>
          <button className="br-modal__close" onClick={onClose}>
            <I d={IC.x} size={14}/>
          </button>
        </div>

        <div className="br-modal__body">
          {/* Row 1: Name + Slug */}
          <div className="br-field-row">
            <div className="br-field" style={{flex:2}}>
              <label className="br-field__lbl">Brand Name *</label>
              <input className="br-field__inp" placeholder="e.g. SunPower India"
                value={name} onChange={e=>handleName(e.target.value)}/>
            </div>
            <div className="br-field" style={{flex:1}}>
              <label className="br-field__lbl">Slug</label>
              <input className="br-field__inp br-field__inp--mono" placeholder="auto-generated"
                value={slug} onChange={e=>setSlug(e.target.value)}/>
            </div>
          </div>

          {/* Row 2: Category + Country */}
          <div className="br-field-row">
            <div className="br-field" style={{flex:1}}>
              <label className="br-field__lbl">Primary Category *</label>
              <select className="br-field__sel" value={category} onChange={e=>setCategory(e.target.value)}>
                {CATEGORIES_LIST.slice(1).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="br-field" style={{flex:1}}>
              <label className="br-field__lbl">Country</label>
              <select className="br-field__sel" value={country} onChange={e=>setCountry(e.target.value)}>
                {['India','Germany','China','USA','Japan','South Korea','Other'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Website */}
          <div className="br-field">
            <label className="br-field__lbl">Website</label>
            <input className="br-field__inp" placeholder="e.g. brand.com"
              value={website} onChange={e=>setWebsite(e.target.value)}/>
          </div>

          {/* Description */}
          <div className="br-field">
            <label className="br-field__lbl">Description</label>
            <textarea className="br-field__ta" rows={3} placeholder="Brief description of the brand…"
              value={desc} onChange={e=>setDesc(e.target.value)}/>
          </div>

          {/* Row 3: Status + Featured + Verified */}
          <div className="br-field-row">
            <div className="br-field" style={{flex:1}}>
              <label className="br-field__lbl">Status</label>
              <select className="br-field__sel" value={status} onChange={e=>setStatus(e.target.value)}>
                <option>Active</option><option>Inactive</option><option>Draft</option>
              </select>
            </div>
            <div className="br-field" style={{flex:1}}>
              <label className="br-field__lbl">Featured</label>
              <div className="br-toggle" onClick={()=>setFeatured(!featured)}>
                <div className={`br-toggle__track${featured?' br-toggle__track--on':''}`}>
                  <div className="br-toggle__thumb"/>
                </div>
                <span>{featured?'Yes':'No'}</span>
              </div>
            </div>
            <div className="br-field" style={{flex:1}}>
              <label className="br-field__lbl">Verified</label>
              <div className="br-toggle" onClick={()=>setVerified(!verified)}>
                <div className={`br-toggle__track${verified?' br-toggle__track--on br-toggle__track--blue':''}`}>
                  <div className="br-toggle__thumb"/>
                </div>
                <span>{verified?'Yes':'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="br-modal__ft">
          <button className="br-btn br-btn--out" onClick={onClose}>Cancel</button>
          <button className="br-btn br-btn--pri"
            onClick={()=>onSave({ name, slug, category, country, website, desc, status, featured, verified })}>
            <I d={IC.check} size={13} color="#fff" sw={2.5}/>
            {mode==='add'?'Create Brand':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function BrandsManager() {
  const [search,   setSearch]   = useState('');
  const [catF,     setCatF]     = useState('All');
  const [statusF,  setStatusF]  = useState('All');
  const [countryF, setCountryF] = useState('All');
  const [checked,  setChecked]  = useState({});
  const [page,     setPage]     = useState(0);
  const [modal,    setModal]    = useState(null);
  const [brands,   setBrands]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getBrands()
      .then(data => setBrands(data))
      .catch(err => console.error('Failed to fetch brands:', err))
      .finally(() => setLoading(false));
  }, []);

  const list = brands.filter(b => {
    const mC  = catF     === 'All' || b.category === catF;
    const mS  = statusF  === 'All' || b.status   === statusF;
    const mCo = countryF === 'All' || b.country  === countryF;
    const q   = search.toLowerCase();
    const mQ  = !q || b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
                   || b.slug.toLowerCase().includes(q)  || b.category.toLowerCase().includes(q)
                   || b.country.toLowerCase().includes(q);
    return mC && mS && mCo && mQ;
  });

  const slice    = list.slice(page*PER_PAGE, (page+1)*PER_PAGE);
  const allC     = slice.length>0 && slice.every(b=>checked[b.id]);
  const toggleAll = () => {
    if(allC) setChecked(p=>{const n={...p};slice.forEach(b=>delete n[b.id]);return n;});
    else     setChecked(p=>{const n={...p};slice.forEach(b=>n[b.id]=true);return n;});
  };

  const handleSave = (data) => {
    const promise = modal.mode === 'add'
      ? createBrand(data)
      : updateBrand(modal.item.id, data);

    promise.then(saved => {
      if (modal.mode === 'add') {
        setBrands(p => [saved, ...p]);
      } else {
        setBrands(p => p.map(b => b.id === modal.item.id ? { ...b, ...saved } : b));
      }
      setModal(null);
    }).catch(err => console.error('Failed to save brand:', err));
  };

  const handleDelete = id => {
    deleteBrand(id).then(() => {
      setBrands(p => p.filter(b => b.id !== id));
      setChecked(p => { const n = { ...p }; delete n[id]; return n; });
    }).catch(err => console.error('Failed to delete brand:', err));
  };

  const totalProducts  = brands.reduce((a,b)=>a+b.products,0);
  const verifiedCount  = brands.filter(b=>b.verified).length;
  const featuredCount  = brands.filter(b=>b.featured).length;

  return (
    <div className="br">

      {/* ── Header ── */}
      <div className="br-hdr">
        <div>
          <h2 className="br-hdr__t">Brands</h2>
          <p className="br-hdr__s">Manage all brands listed in your product catalogue.</p>
        </div>
        <button className="br-btn br-btn--pri" onClick={()=>setModal({mode:'add'})}>
          <I d={IC.plus} size={14} color="#fff"/>Add Brand
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="br-kpi-strip">
        {[
          { label:'Total Brands',    val: brands.length,    color:'#E03E1A', bg:'#fff0ed', ico: IC.award   },
          { label:'Active Brands',   val: brands.filter(b=>b.status==='Active').length, color:'#16a34a', bg:'#dcfce7', ico: IC.check },
          { label:'Verified Brands', val: verifiedCount,   color:'#2563eb', bg:'#dbeafe', ico: IC.shield  },
          { label:'Featured Brands', val: featuredCount,   color:'#d97706', bg:'#fef3c7', ico: IC.star    },
          { label:'Total Products',  val: totalProducts,   color:'#7c3aed', bg:'#ede9fe', ico: IC.box     },
        ].map((k,i)=>(
          <div key={i} className="br-kpi">
            <div className="br-kpi__ico" style={{ background: k.bg }}>
              <I d={k.ico} size={16} color={k.color} sw={2.1}/>
            </div>
            <div>
              <div className="br-kpi__val" style={{ color: k.color }}>{k.val}</div>
              <div className="br-kpi__lbl">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="br-card">
        <div className="br-sh">
          <div>
            <p className="br-sh__t">All Brands</p>
            <p className="br-sh__s">{list.length} brand{list.length!==1?'s':''} found</p>
          </div>
          <div className="br-sh__r">
            <SearchBar value={search}
              onChange={e=>{setSearch(e.target.value);setPage(0);}}
              placeholder="Search brand, category…"/>
            <Pills options={STATUS_LIST}   value={statusF}  onChange={v=>{setStatusF(v);setPage(0);}}/>
            <Pills options={COUNTRIES_LIST} value={countryF} onChange={v=>{setCountryF(v);setPage(0);}}/>
            <Pills options={['All','Solar Panels','Batteries','Smart Home','Lighting']}
              value={catF} onChange={v=>{setCatF(v);setPage(0);}}/>
            <button className="br-btn br-btn--out" onClick={() => exportCSV([['Brand','ID','Slug','Category','Country','Website','Products','Featured','Verified','Status'],...list.map(b=>[b.name,b.id,b.slug,b.category,b.country,b.website,b.products,b.featured?'Yes':'No',b.verified?'Yes':'No',b.status])],'brands.csv')}><I d={IC.download} size={13} color="#475569"/>Export</button>
          </div>
        </div>

        {/* Table */}
        <div className="br-tw">
          <table className="br-tbl">
            <thead>
              <tr>
                <th className="br-th br-th--chk">
                  <input type="checkbox" className="br-chk" checked={allC} onChange={toggleAll}/>
                </th>
                <th className="br-th">Brand</th>
                <th className="br-th br-hm">Category</th>
                <th className="br-th br-hm">Country</th>
                <th className="br-th br-hm">Website</th>
                <th className="br-th">Products</th>
                <th className="br-th br-hm">Founded</th>
                <th className="br-th br-hm">Joined</th>
                <th className="br-th br-hm">Featured</th>
                <th className="br-th">Verified</th>
                <th className="br-th">Status</th>
                <th className="br-th br-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="12" className="br-empty">Loading brands...</td></tr>
              )}
              {!loading && slice.length===0 && (
                <tr><td colSpan="12" className="br-empty">No brands match your search or filter.</td></tr>
              )}
              {slice.map(b => (
                <tr key={b.id} className={`br-tr${checked[b.id]?' br-tr--sel':''}`}>

                  {/* Checkbox */}
                  <td className="br-td br-td--chk">
                    <input type="checkbox" className="br-chk" checked={!!checked[b.id]}
                      onChange={()=>setChecked(p=>({...p,[b.id]:!p[b.id]}))}/>
                  </td>

                  {/* Brand */}
                  <td className="br-td">
                    <div className="br-brand-cell">
                      <div className="br-logo" style={{ background:`${colorFor(b.name)}18`, border:`1px solid ${colorFor(b.name)}28` }}>
                        <span className="br-logo__txt" style={{ color: colorFor(b.name) }}>
                          {initials(b.name)}
                        </span>
                      </div>
                      <div className="br-brand-cell__info">
                        <span className="br-brand-cell__name">{b.name}</span>
                        <span className="br-brand-cell__id">{b.id} · {b.slug}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="br-td br-hm">
                    <span className="br-cat">{b.category}</span>
                  </td>

                  {/* Country */}
                  <td className="br-td br-hm">
                    <div className="br-country">
                      <I d={IC.mappin} size={12} color="#94a3b8"/>
                      <span>{b.country}</span>
                    </div>
                  </td>

                  {/* Website */}
                  <td className="br-td br-hm">
                    <div className="br-website">
                      <I d={IC.globe} size={11} color="#94a3b8"/>
                      <span>{b.website}</span>
                    </div>
                  </td>

                  {/* Products */}
                  <td className="br-td">
                    <div className="br-prod-count">
                      <I d={IC.box} size={12} color="#94a3b8"/>
                      <span>{b.products}</span>
                    </div>
                  </td>

                  {/* Founded */}
                  <td className="br-td br-hm">
                    <span className="br-founded">{b.founded}</span>
                  </td>

                  {/* Joined */}
                  <td className="br-td br-hm">
                    <span className="br-date">{b.joinedOn}</span>
                  </td>

                  {/* Featured */}
                  <td className="br-td br-hm">
                    {b.featured
                      ? <span className="br-feat-badge"><I d={IC.star} size={11} color="#d97706" sw={2.2}/>Yes</span>
                      : <span className="br-no-badge">—</span>}
                  </td>

                  {/* Verified */}
                  <td className="br-td">
                    {b.verified
                      ? <span className="br-verified"><I d={IC.shield} size={11} color="#2563eb" sw={2.2}/>Verified</span>
                      : <span className="br-unverified"><I d={IC.shield} size={11} color="#94a3b8" sw={2}/>Unverified</span>}
                  </td>

                  {/* Status */}
                  <td className="br-td">
                    <StatusBdg status={b.status}/>
                  </td>

                  {/* Actions */}
                  <td className="br-td br-td--r">
                    <div className="br-acts">
                      <button className="br-act br-act--view" title="View products">
                        <I d={IC.eye} size={13}/>
                      </button>
                      <button className="br-act br-act--edit" title="Edit"
                        onClick={()=>setModal({mode:'edit',item:b})}>
                        <I d={IC.edit} size={13}/>
                      </button>
                      <button className="br-act br-act--trash" title="Delete"
                        onClick={()=>handleDelete(b.id)}>
                        <I d={IC.trash} size={13}/>
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pager page={page} total={list.length}
          onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
      </div>

      {/* Modal */}
      {modal && (
        <Modal mode={modal.mode} item={modal.item}
          onClose={()=>setModal(null)} onSave={handleSave}/>
      )}
    </div>
  );
}