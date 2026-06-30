import React, { useState, useEffect } from 'react';
import './CmsPages.css';
import {
  FileText, Plus, Trash2, Edit2, Copy, Search,
  ChevronLeft, ChevronRight, Globe, Lock, Save,
  X, Download, ExternalLink, Image, Upload, Settings, AlignLeft
} from 'lucide-react';
import { getCmsPages, createCmsPage, updateCmsPage, deleteCmsPage } from '../../api/api';
import { exportCSV } from './VendorShared';

const TEMPLATES = ['standard','landing','legal','blank'];
const STATUSES  = ['All','published','draft','archived'];
const PER = 8;

const sStyle = s => ({ published:{bg:'#dcfce7',c:'#16a34a'}, draft:{bg:'#fef3c7',c:'#d97706'}, archived:{bg:'#f1f5f9',c:'#64748b'} }[s]||{bg:'#f1f5f9',c:'#64748b'});
const tColor  = t => ({ standard:{bg:'#ede9fe',c:'#7c3aed'}, landing:{bg:'#dbeafe',c:'#2563eb'}, legal:{bg:'#fee2e2',c:'#b91c1c'}, blank:{bg:'#f1f5f9',c:'#64748b'} }[t]||{bg:'#f1f5f9',c:'#64748b'});
const autoSlug = t => '/'+t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* ─── Modal ─── */
function PageModal({ page, onSave, onClose }) {
  const isNew = !page.id;
  const [tab, setTab] = useState('content');
  const [f, sf] = useState({
    id:'pg'+Date.now(), title:'', slug:'', status:'draft', visibility:'public',
    template:'standard', author:'Admin', metaTitle:'', metaDesc:'',
    content:'', featuredImage:'', updatedAt:'Today', ...page
  });
  const set = (k,v) => sf(p=>({...p,[k]:v}));

  const handleImageFile = e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('featuredImage', ev.target.result);
    reader.readAsDataURL(file);
  };

  const TABS = [
    { key:'content',  label:'Content',  icon:AlignLeft },
    { key:'settings', label:'Settings', icon:Settings  },
  ];

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal cp-modal--lg" onClick={e=>e.stopPropagation()}>
        <div className="cp-modal-hdr">
          <div>
            <div className="cp-modal-title">{isNew ? 'New Page' : 'Edit Page'}</div>
            <div className="cp-modal-sub">{f.slug || 'slug auto-generated from title'}</div>
          </div>
          <button className="cp-icon-btn" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Tab bar */}
        <div className="cp-modal-tabs">
          {TABS.map(t=>{ const TI=t.icon; return (
            <button key={t.key} className={`cp-modal-tab${tab===t.key?' cp-modal-tab--on':''}`} onClick={()=>setTab(t.key)}>
              <TI size={13}/>{t.label}
            </button>
          );})}
        </div>

        <div className="cp-modal-body">

          {/* ── CONTENT TAB ── */}
          {tab==='content' && (<>
            <div className="cp-row2">
              <div className="cp-field">
                <label className="cp-label">Page Title <span className="cp-req">*</span></label>
                <input className="cp-input" value={f.title} placeholder="e.g. About Us"
                  onChange={e=>{ set('title',e.target.value); if(isNew) set('slug',autoSlug(e.target.value)); }}/>
              </div>
              <div className="cp-field">
                <label className="cp-label">URL Slug <span className="cp-req">*</span></label>
                <input className="cp-input cp-mono" value={f.slug} placeholder="/about-us" onChange={e=>set('slug',e.target.value)}/>
              </div>
            </div>

            {/* Featured Image */}
            <div className="cp-field">
              <label className="cp-label">Featured Image</label>
              {f.featuredImage ? (
                <div className="cp-img-preview">
                  <img src={f.featuredImage} alt="Featured" className="cp-img-preview-img"/>
                  <button className="cp-img-remove" onClick={()=>set('featuredImage','')}><X size={11}/>Remove</button>
                </div>
              ) : (
                <label className="cp-img-upload">
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={handleImageFile}/>
                  <Image size={20} color="#94a3b8"/>
                  <span className="cp-img-upload-text">Click to upload featured image</span>
                  <span className="cp-img-upload-hint">PNG, JPG, WebP — recommended 1200×630px</span>
                </label>
              )}
            </div>

            {/* Page content body */}
            <div className="cp-field">
              <label className="cp-label">Page Content</label>
              <textarea className="cp-textarea cp-textarea--tall" rows={12}
                value={f.content}
                placeholder="Write your page content here. HTML is supported — use headings, paragraphs, lists and links."
                onChange={e=>set('content',e.target.value)}/>
              <span className="cp-cc">{f.content.length} chars · {f.content.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </>)}

          {/* ── SETTINGS TAB ── */}
          {tab==='settings' && (<>
            <div className="cp-row3">
              <div className="cp-field">
                <label className="cp-label">Status</label>
                <select className="cp-select" value={f.status} onChange={e=>set('status',e.target.value)}>
                  {['draft','published','archived'].map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div className="cp-field">
                <label className="cp-label">Visibility</label>
                <select className="cp-select" value={f.visibility} onChange={e=>set('visibility',e.target.value)}>
                  <option value="public">Public</option><option value="private">Private</option>
                </select>
              </div>
              <div className="cp-field">
                <label className="cp-label">Template</label>
                <select className="cp-select" value={f.template} onChange={e=>set('template',e.target.value)}>
                  {TEMPLATES.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="cp-field">
              <label className="cp-label">Author</label>
              <input className="cp-input" value={f.author} onChange={e=>set('author',e.target.value)}/>
            </div>
            <div className="cp-divider"><span>SEO</span></div>
            <div className="cp-field">
              <label className="cp-label">Meta Title <span className="cp-note">50–60 chars recommended</span></label>
              <input className="cp-input" value={f.metaTitle} placeholder="SEO title for search engines" onChange={e=>set('metaTitle',e.target.value)}/>
              <span className="cp-cc" style={{color:f.metaTitle.length>60?'#dc2626':'#94a3b8'}}>{f.metaTitle.length}/60</span>
            </div>
            <div className="cp-field">
              <label className="cp-label">Meta Description <span className="cp-note">120–160 chars recommended</span></label>
              <textarea className="cp-textarea" rows={3} value={f.metaDesc} placeholder="Short description shown in Google results" onChange={e=>set('metaDesc',e.target.value)}/>
              <span className="cp-cc" style={{color:f.metaDesc.length>160?'#dc2626':'#94a3b8'}}>{f.metaDesc.length}/160</span>
            </div>
            <div className="cp-seo-preview">
              <div className="cp-seo-lbl">Search Preview</div>
              <div className="cp-seo-box">
                <div className="cp-seo-url">bazaarmax.in{f.slug}</div>
                <div className="cp-seo-title">{f.metaTitle||f.title||'Page Title'}</div>
                <div className="cp-seo-desc">{f.metaDesc||'Meta description will appear here…'}</div>
              </div>
            </div>
          </>)}
        </div>

        <div className="cp-modal-footer">
          <button className="cp-btn cp-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="cp-btn cp-btn-primary" disabled={!f.title.trim()||!f.slug.trim()} onClick={()=>onSave(f)}>
            <Save size={13} color="#fff"/>{isNew?'Create Page':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function CmsPages() {
  const [rows,    setRows]    = useState([]);
  const [modal,   setModal]   = useState(null);
  const [filter,  setFilter]  = useState('All');
  const [search,  setSearch]  = useState('');
  const [pg,      setPg]      = useState(0);
  const [delConf, setDelConf] = useState(null);

  useEffect(() => { getCmsPages().then(setRows).catch(() => {}); }, []);

  const list  = rows.filter(r=>
    (filter==='All'||r.status===filter)&&
    (!search||r.title.toLowerCase().includes(search.toLowerCase())||r.slug.includes(search.toLowerCase()))
  );
  const totalPg = Math.ceil(list.length/PER)||1;
  const slice   = list.slice(pg*PER,(pg+1)*PER);
  const counts  = {published:rows.filter(r=>r.status==='published').length,draft:rows.filter(r=>r.status==='draft').length,archived:rows.filter(r=>r.status==='archived').length};

  const save = async form => {
    if (form.id) { await updateCmsPage(form.id, form); } else { await createCmsPage(form); }
    getCmsPages().then(setRows); setModal(null);
  };
  const dup = async row => {
    await createCmsPage({ ...row, title: row.title + ' (Copy)', slug: row.slug + '-copy', status: 'draft', updatedAt: 'Today' });
    getCmsPages().then(setRows);
  };

  return (
    <div className="cp-wrap">
      <div className="cp-hdr">
        <div>
          <h2 className="cp-hdr-title">Pages</h2>
          <p className="cp-hdr-sub">Manage static storefront pages — about, legal, landing and more</p>
        </div>
        <div className="cp-hdr-acts">
          <button className="cp-btn cp-btn-outline" onClick={() => exportCSV(rows, 'cms-pages.csv')}><Download size={13} color="#475569"/>Export</button>
          <button className="cp-btn cp-btn-primary" onClick={()=>setModal({})}><Plus size={13} color="#fff"/>New Page</button>
        </div>
      </div>

      <div className="cp-kpis">
        {[
          {label:'Total Pages',value:rows.length,   c:'#475569'},
          {label:'Published',  value:counts.published,c:'#16a34a'},
          {label:'Drafts',     value:counts.draft,    c:'#d97706'},
          {label:'Archived',   value:counts.archived, c:'#94a3b8'},
        ].map((k,i)=>(
          <div key={i} className="cp-kpi"><div className="cp-kpi-val" style={{color:k.c}}>{k.value}</div><div className="cp-kpi-lbl">{k.label}</div></div>
        ))}
      </div>

      <div className="cp-card">
        <div className="cp-toolbar">
          <div className="cp-pills">
            {STATUSES.map(s=>(
              <button key={s} className={`cp-pill${filter===s?' cp-pill-on':''}`} onClick={()=>{setFilter(s);setPg(0);}}>
                {s==='All'?'All':s[0].toUpperCase()+s.slice(1)}
                {s!=='All'&&counts[s]!==undefined&&<span className="cp-pill-count">{counts[s]}</span>}
              </button>
            ))}
          </div>
          <div className="cp-search-wrap">
            <Search size={13} color="#94a3b8" className="cp-search-ic"/>
            <input className="cp-search-input" placeholder="Search pages…" value={search} onChange={e=>{setSearch(e.target.value);setPg(0);}}/>
          </div>
        </div>

        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead><tr>
              <th>Title</th><th>Slug</th><th>Template</th><th>Visibility</th><th>Status</th><th>Author</th><th>Updated</th><th className="cp-tar">Actions</th>
            </tr></thead>
            <tbody>
              {slice.length===0
                ? <tr><td colSpan={8} className="cp-empty">No pages match your filters</td></tr>
                : slice.map(r=>{
                    const ss=sStyle(r.status); const tc=tColor(r.template);
                    return (
                      <tr key={r.id}>
                        <td><span className="cp-page-name">{r.title}</span></td>
                        <td><code className="cp-slug">{r.slug}</code></td>
                        <td><span className="cp-badge" style={{background:tc.bg,color:tc.c}}>{r.template}</span></td>
                        <td>{r.visibility==='public'
                          ?<span className="cp-vis cp-vis-pub"><Globe size={11}/>Public</span>
                          :<span className="cp-vis cp-vis-prv"><Lock size={11}/>Private</span>}</td>
                        <td><span className="cp-status-b" style={{background:ss.bg,color:ss.c}}><span className="cp-dot"/>{r.status[0].toUpperCase()+r.status.slice(1)}</span></td>
                        <td className="cp-muted">{r.author}</td>
                        <td className="cp-muted">{r.updatedAt}</td>
                        <td className="cp-tar">
                          <div className="cp-acts">
                            {r.status==='published'&&<a className="cp-icon-btn" href={'https://bazaarmax.in'+r.slug} target="_blank" rel="noreferrer" title="View"><ExternalLink size={12}/></a>}
                            <button className="cp-icon-btn" title="Edit" onClick={()=>setModal({...r})}><Edit2 size={12}/></button>
                            <button className="cp-icon-btn" title="Duplicate" onClick={()=>dup(r)}><Copy size={12}/></button>
                            <button className="cp-icon-btn cp-icon-btn-del" title="Delete" onClick={()=>setDelConf(r.id)}><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        <div className="cp-pag">
          <span className="cp-pag-info">{pg*PER+1}–{Math.min((pg+1)*PER,list.length)} of {list.length}</span>
          <div className="cp-pag-ctrl">
            <button className="cp-pag-btn" onClick={()=>setPg(p=>p-1)} disabled={pg===0}><ChevronLeft size={13}/></button>
            <span className="cp-pag-lbl">{pg+1} / {totalPg}</span>
            <button className="cp-pag-btn" onClick={()=>setPg(p=>p+1)} disabled={(pg+1)*PER>=list.length}><ChevronRight size={13}/></button>
          </div>
        </div>
      </div>

      {modal && <PageModal page={modal} onSave={save} onClose={()=>setModal(null)}/>}

      {delConf&&(
        <div className="cp-overlay" onClick={()=>setDelConf(null)}>
          <div className="cp-confirm" onClick={e=>e.stopPropagation()}>
            <div className="cp-confirm-icon"><Trash2 size={20} color="#dc2626"/></div>
            <p className="cp-confirm-title">Delete Page?</p>
            <p className="cp-confirm-sub">This permanently removes the page from the storefront.</p>
            <div className="cp-confirm-acts">
              <button className="cp-btn cp-btn-ghost" onClick={()=>setDelConf(null)}>Cancel</button>
              <button className="cp-btn cp-btn-danger" onClick={()=>{setRows(rs=>rs.filter(r=>r.id!==delConf));setDelConf(null);}}>
                <Trash2 size={13} color="#fff"/>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}