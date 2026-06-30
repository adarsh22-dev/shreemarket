import React, { useState, useEffect } from 'react';
import { getSeoPages, createSeoPage, updateSeoPage, deleteSeoPage } from '../../api/api';
import './AdminSeoMeta.css';
import { exportCSV } from './VendorShared';

/* ================================================================
   SeoMeta — Manage SEO meta for Products, Categories & Pages
   ================================================================ */

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];
const colorFor = s => PALETTE[s.charCodeAt(0) % PALETTE.length];

/* ── DATA ── */
const PER_PAGE = 8;

const TYPES    = ['All','Product','Category','Page'];
const STATUSES = ['All','Published','Draft'];
const SCORES   = ['All','Excellent (80+)','Good (60–79)','Needs Work (<60)'];

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
  check:    'M20 6 9 17l-5-5',
  x:        'M18 6 6 18M6 6l12 12',
  plus:     'M12 5v14M5 12h14',
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  close:    'M18 6 6 18M6 6l12 12',
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff:   ['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94','M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19','M1 1l22 22'],
  globe:    ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z','M2 12h20','M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  tag:      'M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2zM7 7h.01',
  zap:      'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  link:     ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71','M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  fileText: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  layout:   ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  trending: ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  twitter:  'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z',
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  key:      ['M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'],
  copy:     ['M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z','M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1'],
};

/* ── SEO Score Ring ── */
const ScoreRing = ({ score }) => {
  const r = 18, c = 2*Math.PI*r;
  const fill = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : score > 0 ? '#dc2626' : '#e2e8f0';
  const dash = score > 0 ? (score/100)*c : 0;
  return (
    <div className="seo-ring">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4"/>
        <circle cx="22" cy="22" r={r} fill="none" stroke={fill} strokeWidth="4"
          strokeDasharray={`${dash} ${c}`} strokeDashoffset={c*0.25}
          strokeLinecap="round" style={{transition:'stroke-dasharray .4s ease'}}/>
      </svg>
      <span className="seo-ring__n" style={{color: fill}}>{score > 0 ? score : '—'}</span>
    </div>
  );
};

/* ── Char counter bar ── */
const CharBar = ({ value, min, max, label }) => {
  const len = value.length;
  const pct = Math.min(100, (len/max)*100);
  const ok  = len >= min && len <= max;
  const bar = len > max ? '#dc2626' : len >= min ? '#16a34a' : '#d97706';
  return (
    <div className="seo-cbar">
      <div className="seo-cbar__top">
        <span className="seo-cbar__lbl">{label}</span>
        <span className="seo-cbar__cnt" style={{color: bar}}>{len} / {max}</span>
      </div>
      <div className="seo-cbar__track">
        <div className="seo-cbar__fill" style={{width:`${pct}%`, background: bar}}/>
      </div>
      {!ok && (
        <p className="seo-cbar__hint">
          {len < min ? `Add ${min-len} more characters` : `${len-max} characters over limit`}
        </p>
      )}
    </div>
  );
};

/* ── SERP Preview ── */
const SerpPreview = ({ title, slug, desc }) => (
  <div className="seo-serp">
    <p className="seo-serp__lbl">SERP Preview</p>
    <div className="seo-serp__card">
      <p className="seo-serp__url">greenstore.in › {slug}</p>
      <p className="seo-serp__title">{title || 'Page Title'}</p>
      <p className="seo-serp__desc">{desc || 'Meta description will appear here.'}</p>
    </div>
  </div>
);

/* ── Shared UI ── */
const SearchBar = ({ value, onChange }) => (
  <div className="seo-search">
    <span className="seo-search__ico"><I d={IC.search} size={14} color="#94a3b8"/></span>
    <input className="seo-search__inp" placeholder="Search title, slug, keyword…"
      value={value} onChange={onChange}/>
  </div>
);

const Pills = ({ options, value, onChange }) => (
  <div className="seo-pills">
    {options.map(o=>(
      <button key={o} className={`seo-pill${value===o?' seo-pill--on':''}`} onClick={()=>onChange(o)}>{o}</button>
    ))}
  </div>
);

const TypeBadge = ({ t }) => {
  const m = { Product:'prod', Category:'cat', Page:'page' };
  return <span className={`seo-type seo-type--${m[t]||'page'}`}>{t}</span>;
};

const StatusBdg = ({ s }) => {
  const m = { Published:'pub', Draft:'dft' };
  return <span className={`seo-st seo-st--${m[s]||'dft'}`}><span className="seo-st__dot"/>{s}</span>;
};

const ScoreBadge = ({ score }) => {
  if(score===0) return <span className="seo-sc seo-sc--none">Not set</span>;
  if(score>=80) return <span className="seo-sc seo-sc--good">Excellent</span>;
  if(score>=60) return <span className="seo-sc seo-sc--ok">Good</span>;
  return <span className="seo-sc seo-sc--bad">Needs Work</span>;
};

const Pager = ({ page, total, onPrev, onNext }) => {
  const pages = Math.ceil(total/PER_PAGE)||1;
  return (
    <div className="seo-pag">
      <span className="seo-pag__info">
        {total===0?'0 results':`${page*PER_PAGE+1}–${Math.min((page+1)*PER_PAGE,total)} of ${total}`}
      </span>
      <div className="seo-pag__ctrl">
        <button className="seo-pag__btn" onClick={onPrev} disabled={page===0}><I d={IC.chevL} size={13} color="#475569"/></button>
        <span className="seo-pag__lbl">{page+1} / {pages}</span>
        <button className="seo-pag__btn" onClick={onNext} disabled={(page+1)*PER_PAGE>=total}><I d={IC.chevR} size={13} color="#475569"/></button>
      </div>
    </div>
  );
};

/* ── Edit Modal ── */
const Modal = ({ item, onClose, onSave }) => {
  const [title,     setTitle]     = useState(item.title);
  const [metaDesc,  setMetaDesc]  = useState(item.metaDesc);
  const [slug,      setSlug]      = useState(item.slug);
  const [focusKw,   setFocusKw]   = useState(item.focusKw);
  const [canonical, setCanonical] = useState(item.canonical);
  const [ogTitle,   setOgTitle]   = useState(item.ogTitle);
  const [ogDesc,    setOgDesc]    = useState(item.ogDesc);
  const [indexable, setIndexable] = useState(item.indexable);
  const [status,    setStatus]    = useState(item.status);
  const [tab,       setTab]       = useState('basic');

  const TABS = ['basic','social','advanced'];

  return (
    <div className="seo-overlay" onClick={e=>{ if(e.target.className==='seo-overlay') onClose(); }}>
      <div className="seo-modal">
        {/* Head */}
        <div className="seo-modal__hd">
          <div className="seo-modal__hd-l">
            <div className="seo-modal__hd-icon"><I d={IC.globe} size={16} color="#E03E1A" sw={2}/></div>
            <div>
              <p className="seo-modal__title">Edit SEO Meta</p>
              <p className="seo-modal__sub">{item.pageId} · <TypeBadge t={item.type}/></p>
            </div>
          </div>
          <button className="seo-modal__close" onClick={onClose}><I d={IC.close} size={14}/></button>
        </div>

        {/* Tab bar */}
        <div className="seo-modal__tabs">
          {[['basic','Basic SEO'],['social','Social / OG'],['advanced','Advanced']].map(([k,l])=>(
            <button key={k} className={`seo-modal__tab${tab===k?' seo-modal__tab--on':''}`}
              onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {/* Body */}
        <div className="seo-modal__body">

          {tab==='basic' && (
            <>
              {/* SERP live preview */}
              <SerpPreview title={title} slug={slug} desc={metaDesc}/>

              <CharBar value={title} min={30} max={60} label="Meta Title"/>
              <div className="seo-field">
                <textarea className="seo-field__ta" rows={2}
                  value={title} onChange={e=>setTitle(e.target.value)}/>
              </div>

              <CharBar value={metaDesc} min={120} max={160} label="Meta Description"/>
              <div className="seo-field">
                <textarea className="seo-field__ta" rows={3}
                  value={metaDesc} onChange={e=>setMetaDesc(e.target.value)}/>
              </div>

              <div className="seo-field-row">
                <div className="seo-field" style={{flex:2}}>
                  <label className="seo-field__lbl">URL Slug</label>
                  <div className="seo-slug-wrap">
                    <span className="seo-slug-pre">greenstore.in/</span>
                    <input className="seo-field__inp seo-field__inp--mono"
                      value={slug} onChange={e=>setSlug(e.target.value)}/>
                  </div>
                </div>
                <div className="seo-field" style={{flex:1}}>
                  <label className="seo-field__lbl">Status</label>
                  <select className="seo-field__sel" value={status} onChange={e=>setStatus(e.target.value)}>
                    <option>Published</option><option>Draft</option>
                  </select>
                </div>
              </div>

              <div className="seo-field">
                <label className="seo-field__lbl">
                  <I d={IC.key} size={12} color="#94a3b8"/> Focus Keyword
                </label>
                <input className="seo-field__inp" placeholder="e.g. solar panel 400w monocrystalline"
                  value={focusKw} onChange={e=>setFocusKw(e.target.value)}/>
              </div>
            </>
          )}

          {tab==='social' && (
            <>
              <div className="seo-og-preview">
                <p className="seo-og-preview__lbl">Open Graph Preview</p>
                <div className="seo-og-card">
                  <div className="seo-og-img"><I d={IC.layout} size={28} color="#cbd5e1" sw={1.5}/></div>
                  <div className="seo-og-body">
                    <p className="seo-og-domain">greenstore.in</p>
                    <p className="seo-og-title">{ogTitle || 'OG Title'}</p>
                    <p className="seo-og-desc">{ogDesc || 'OG description will appear here.'}</p>
                  </div>
                </div>
              </div>

              <CharBar value={ogTitle} min={30} max={60} label="OG Title"/>
              <div className="seo-field">
                <textarea className="seo-field__ta" rows={2}
                  value={ogTitle} onChange={e=>setOgTitle(e.target.value)}/>
              </div>

              <CharBar value={ogDesc} min={60} max={155} label="OG Description"/>
              <div className="seo-field">
                <textarea className="seo-field__ta" rows={3}
                  value={ogDesc} onChange={e=>setOgDesc(e.target.value)}/>
              </div>
            </>
          )}

          {tab==='advanced' && (
            <>
              <div className="seo-field">
                <label className="seo-field__lbl">
                  <I d={IC.link} size={12} color="#94a3b8"/> Canonical URL
                </label>
                <input className="seo-field__inp seo-field__inp--mono"
                  placeholder="Leave blank to use current URL"
                  value={canonical} onChange={e=>setCanonical(e.target.value)}/>
              </div>

              <div className="seo-field">
                <label className="seo-field__lbl">Indexing</label>
                <div className="seo-radio-group">
                  {[
                    { val:true,  label:'Index',    hint:'Allow search engines to index this page' },
                    { val:false, label:'No-Index',  hint:'Prevent search engines from indexing' },
                  ].map(r=>(
                    <div key={r.label} className={`seo-radio${indexable===r.val?' seo-radio--on':''}`}
                      onClick={()=>setIndexable(r.val)}>
                      <div className="seo-radio__dot"/>
                      <div>
                        <p className="seo-radio__lbl">{r.label}</p>
                        <p className="seo-radio__hint">{r.hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="seo-adv-info">
                <div className="seo-adv-row">
                  <span className="seo-adv-row__k">Page ID</span>
                  <span className="seo-adv-row__v">{item.pageId}</span>
                </div>
                <div className="seo-adv-row">
                  <span className="seo-adv-row__k">Type</span>
                  <span className="seo-adv-row__v">{item.type}</span>
                </div>
                <div className="seo-adv-row">
                  <span className="seo-adv-row__k">Last Updated</span>
                  <span className="seo-adv-row__v">{item.updatedOn}</span>
                </div>
                <div className="seo-adv-row">
                  <span className="seo-adv-row__k">SEO Score</span>
                  <span className="seo-adv-row__v">{item.score > 0 ? item.score + ' / 100' : 'Not analysed'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="seo-modal__ft">
          <button className="seo-btn seo-btn--out" onClick={onClose}>Cancel</button>
          <button className="seo-btn seo-btn--pri"
            onClick={()=>onSave({ title, metaDesc, slug, focusKw, canonical, ogTitle, ogDesc, indexable, status })}>
            <I d={IC.check} size={13} color="#fff" sw={2.5}/>Save Meta
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function SeoMeta() {
  const [search,  setSearch]  = useState('');
  const [typeF,   setTypeF]   = useState('All');
  const [statF,   setStatF]   = useState('All');
  const [scoreF,  setScoreF]  = useState('All');
  const [checked, setChecked] = useState({});
  const [page,    setPage]    = useState(0);
  const [modal,   setModal]   = useState(null);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSeoPages()
      .then(data => {
        const mapped = data.map(p => ({
          id: p.id,
          pageId: `PG-${p.id}`,
          title: p.title || '',
          metaDesc: p.description || '',
          slug: p.url || '',
          type: p.page || 'Page',
          category: '—',
          focusKw: '',
          score: 0,
          indexable: true,
          canonical: '',
          ogTitle: '',
          ogDesc: '',
          updatedOn: '',
          status: p.status || 'Draft'
        }));
        setItems(mapped);
      })
      .catch(err => console.error('Failed to fetch SEO pages:', err))
      .finally(() => setLoading(false));
  }, []);

  const list = items.filter(p => {
    const mT = typeF  === 'All' || p.type   === typeF;
    const mS = statF  === 'All' || p.status === statF;
    const mSc = scoreF === 'All'
      || (scoreF==='Excellent (80+)'  && p.score >= 80)
      || (scoreF==='Good (60–79)'     && p.score >= 60 && p.score < 80)
      || (scoreF==='Needs Work (<60)' && p.score  < 60);
    const q  = search.toLowerCase();
    const mQ = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
                  || p.focusKw.toLowerCase().includes(q) || p.pageId.toLowerCase().includes(q);
    return mT && mS && mSc && mQ;
  });

  const slice = list.slice(page*PER_PAGE, (page+1)*PER_PAGE);
  const allC  = slice.length>0 && slice.every(p=>checked[p.id]);
  const toggleAll = () => {
    if(allC) setChecked(pr=>{const n={...pr};slice.forEach(p=>delete n[p.id]);return n;});
    else     setChecked(pr=>{const n={...pr};slice.forEach(p=>n[p.id]=true);return n;});
  };

  const handleSave = (id, data) => {
    const payload = {
      page: data.type || 'Page',
      url: data.slug || '',
      title: data.title || '',
      description: data.metaDesc || '',
      status: data.status || 'Draft'
    };
    (id
      ? updateSeoPage(id, payload)
      : createSeoPage(payload)
    ).then(saved => {
      setItems(p => {
        if (id) return p.map(x => x.id === id ? { ...x, ...data, id: saved.id } : x);
        const newItem = {
          id: saved.id,
          pageId: `PG-${saved.id}`,
          ...data,
          updatedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        return [newItem, ...p];
      });
      setModal(null);
    }).catch(err => console.error('Failed to save SEO page:', err));
  };

  const handleDelete = id => {
    deleteSeoPage(id).then(() => {
      setItems(p => p.filter(x => x.id !== id));
      setChecked(p => { const n = { ...p }; delete n[id]; return n; });
    }).catch(err => console.error('Failed to delete SEO page:', err));
  };

  const excellent = items.filter(p=>p.score>=80).length;
  const needsWork = items.filter(p=>p.score>0&&p.score<60).length;
  const noMeta    = items.filter(p=>p.score===0).length;
  const indexed   = items.filter(p=>p.indexable).length;

  return (
    <div className="seo">

      {/* ── Header ── */}
      <div className="seo-hdr">
        <div>
          <h2 className="seo-hdr__t">SEO Meta</h2>
          <p className="seo-hdr__s">Manage meta titles, descriptions, slugs and Open Graph data for all pages.</p>
        </div>
        <button className="seo-btn seo-btn--out" onClick={() => setModal({ _new: true, id: null, title: '', metaDesc: '', slug: '', type: 'Page', status: 'Draft', focusKw: '', canonical: '', ogTitle: '', ogDesc: '', indexable: true })}>
          <I d={IC.plus} size={13} color="#475569"/>Add SEO
        </button>
        <button className="seo-btn seo-btn--out" onClick={() => exportCSV([['Page ID','Title','Meta Description','Slug','Type','Focus Keyword','SEO Score','Indexable','Status'], ...items.map(p => [p.pageId, p.title, p.metaDesc, p.slug, p.type, p.focusKw, p.score, p.indexable ? 'Yes' : 'No', p.status])], 'seo-meta.csv')}>
          <I d={IC.download} size={13} color="#475569"/>Export
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="seo-kpi-strip">
        {[
          { label:'Total Pages',   val: items.length, color:'#E03E1A', bg:'#fff0ed', ico: IC.globe   },
          { label:'Excellent SEO', val: excellent,    color:'#16a34a', bg:'#dcfce7', ico: IC.trending },
          { label:'Needs Work',    val: needsWork,    color:'#d97706', bg:'#fef3c7', ico: IC.zap      },
          { label:'No Meta Set',   val: noMeta,       color:'#dc2626', bg:'#fee2e2', ico: IC.fileText },
          { label:'Indexed',       val: indexed,      color:'#2563eb', bg:'#dbeafe', ico: IC.eye      },
        ].map((k,i)=>(
          <div key={i} className="seo-kpi">
            <div className="seo-kpi__ico" style={{background:k.bg}}>
              <I d={k.ico} size={16} color={k.color} sw={2.1}/>
            </div>
            <div>
              <div className="seo-kpi__val" style={{color:k.color}}>{k.val}</div>
              <div className="seo-kpi__lbl">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="seo-card">
        <div className="seo-sh">
          <div>
            <p className="seo-sh__t">All Pages</p>
            <p className="seo-sh__s">{list.length} page{list.length!==1?'s':''} found</p>
          </div>
          <div className="seo-sh__r">
            <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
            <Pills options={TYPES}    value={typeF}  onChange={v=>{setTypeF(v);setPage(0);}}/>
            <Pills options={STATUSES} value={statF}  onChange={v=>{setStatF(v);setPage(0);}}/>
            <Pills options={SCORES}   value={scoreF} onChange={v=>{setScoreF(v);setPage(0);}}/>
          </div>
        </div>

        <div className="seo-tw">
          <table className="seo-tbl">
            <thead>
              <tr>
                <th className="seo-th seo-th--chk">
                  <input type="checkbox" className="seo-chk" checked={allC} onChange={toggleAll}/>
                </th>
                <th className="seo-th">Page / Title</th>
                <th className="seo-th seo-hm">Type</th>
                <th className="seo-th seo-hm">Slug</th>
                <th className="seo-th seo-hm">Focus Keyword</th>
                <th className="seo-th">SEO Score</th>
                <th className="seo-th seo-hm">Indexable</th>
                <th className="seo-th seo-hm">Updated</th>
                <th className="seo-th">Status</th>
                <th className="seo-th seo-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="10" className="seo-empty">Loading SEO pages...</td></tr>
              )}
              {!loading && slice.length===0 && (
                <tr><td colSpan="10" className="seo-empty">No pages match your search or filter.</td></tr>
              )}
              {slice.map(p=>(
                <tr key={p.id} className={`seo-tr${checked[p.id]?' seo-tr--sel':''}`}>

                  {/* Checkbox */}
                  <td className="seo-td seo-td--chk">
                    <input type="checkbox" className="seo-chk" checked={!!checked[p.id]}
                      onChange={()=>setChecked(pr=>({...pr,[p.id]:!pr[p.id]}))}/>
                  </td>

                  {/* Page / Title */}
                  <td className="seo-td">
                    <div className="seo-page-cell">
                      <div className="seo-page-icon" style={{background:`${colorFor(p.title)}18`,border:`1px solid ${colorFor(p.title)}28`}}>
                        <I d={p.type==='Product'?IC.tag:p.type==='Category'?IC.layout:IC.fileText}
                          size={14} color={colorFor(p.title)} sw={1.8}/>
                      </div>
                      <div>
                        <span className="seo-page-cell__title">{p.title}</span>
                        <span className="seo-page-cell__id">{p.pageId}</span>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="seo-td seo-hm"><TypeBadge t={p.type}/></td>

                  {/* Slug */}
                  <td className="seo-td seo-hm">
                    <div className="seo-slug-cell">
                      <I d={IC.link} size={11} color="#94a3b8"/>
                      <span>{p.slug}</span>
                    </div>
                  </td>

                  {/* Focus Keyword */}
                  <td className="seo-td seo-hm">
                    <div className="seo-kw-cell">
                      <I d={IC.key} size={11} color="#94a3b8"/>
                      <span>{p.focusKw || '—'}</span>
                    </div>
                  </td>

                  {/* SEO Score */}
                  <td className="seo-td">
                    <div className="seo-score-cell">
                      <ScoreRing score={p.score}/>
                      <ScoreBadge score={p.score}/>
                    </div>
                  </td>

                  {/* Indexable */}
                  <td className="seo-td seo-hm">
                    {p.indexable
                      ? <span className="seo-idx-yes"><I d={IC.eye}    size={12} color="#16a34a" sw={2}/>Index</span>
                      : <span className="seo-idx-no" ><I d={IC.eyeOff} size={12} color="#dc2626" sw={2}/>No-index</span>}
                  </td>

                  {/* Updated */}
                  <td className="seo-td seo-hm">
                    <span className="seo-date">{p.updatedOn}</span>
                  </td>

                  {/* Status */}
                  <td className="seo-td"><StatusBdg s={p.status}/></td>

                  {/* Actions */}
                  <td className="seo-td seo-td--r">
                    <div className="seo-acts">
                      <button className="seo-act seo-act--edit" title="Edit SEO"
                        onClick={()=>setModal(p)}>
                        <I d={IC.edit} size={13}/>
                      </button>
                      <button className="seo-act seo-act--copy" title="Copy slug" onClick={() => {
                        navigator.clipboard.writeText(p.slug || '');
                        toast.success('Slug copied');
                      }}>
                        <I d={IC.copy} size={13}/>
                      </button>
                      <button className="seo-act seo-act--trash" title="Delete"
                        onClick={()=>handleDelete(p.id)}>
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

      {modal && (
        <Modal item={modal}
          onClose={()=>setModal(null)}
          onSave={(data)=>handleSave(modal._new ? null : modal.id, data)}/>
      )}
    </div>
  );
}