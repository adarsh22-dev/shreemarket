import React, { useState, useEffect } from 'react';
import './CmsBlog.css';
import {
  Plus, Trash2, Edit2, Copy, Search, ChevronLeft, ChevronRight,
  Save, X, Download, ExternalLink, Eye, MessageSquare,
  TrendingUp, BookOpen, Clock, Tag, Image, Settings, AlignLeft
} from 'lucide-react';
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '../../api/api';
import { exportCSV } from './VendorShared';

/* ─── config ─── */
const CATEGORIES = ['All','Guides','News','Vendor Tips','Product Updates','Trends'];
const CAT_COLORS = {
  'Guides':         {bg:'#ede9fe',c:'#7c3aed'},
  'News':           {bg:'#dbeafe',c:'#2563eb'},
  'Vendor Tips':    {bg:'#dcfce7',c:'#16a34a'},
  'Product Updates':{bg:'#fee2e2',c:'#E03E1A'},
  'Trends':         {bg:'#fef3c7',c:'#d97706'},
};

const STATUSES = ['All','published','draft','archived'];
const PER = 8;

const sStyle = s => ({ published:{bg:'#dcfce7',c:'#16a34a'}, draft:{bg:'#fef3c7',c:'#d97706'}, archived:{bg:'#f1f5f9',c:'#64748b'} }[s]||{bg:'#f1f5f9',c:'#64748b'});
const autoSlug = t => '/blog/'+t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* ─── Modal ─── */
function PostModal({ post, onSave, onClose }) {
  const isNew = !post.id;
  const [tab, setTab] = useState('content');
  const [f, sf] = useState({
    id:'bl'+Date.now(), title:'', slug:'', category:'Guides', author:'Admin',
    status:'draft', readMin:5, metaTitle:'', metaDesc:'',
    content:'', featuredImage:'',
    views:0, comments:0, date:'Today', ...post,
    tags: post.tags ? [...post.tags] : [],
  });
  const [tagInput, setTagInput] = useState('');
  const set = (k,v) => sf(p=>({...p,[k]:v}));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g,'-');
    if(t && !f.tags.includes(t)) set('tags',[...f.tags,t]);
    setTagInput('');
  };

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
    <div className="cb-overlay" onClick={onClose}>
      <div className="cb-modal cb-modal--lg" onClick={e=>e.stopPropagation()}>
        <div className="cb-modal-hdr">
          <div>
            <div className="cb-modal-title">{isNew ? 'New Post' : 'Edit Post'}</div>
            <div className="cb-modal-sub">{f.slug || 'slug auto-generated from title'}</div>
          </div>
          <button className="cb-icon-btn" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Tab bar */}
        <div className="cb-modal-tabs">
          {TABS.map(t=>{ const TI=t.icon; return (
            <button key={t.key} className={`cb-modal-tab${tab===t.key?' cb-modal-tab--on':''}`} onClick={()=>setTab(t.key)}>
              <TI size={13}/>{t.label}
            </button>
          );})}
        </div>

        <div className="cb-modal-body">

          {/* ── CONTENT TAB ── */}
          {tab==='content' && (<>
            <div className="cb-field">
              <label className="cb-label">Post Title <span className="cb-req">*</span></label>
              <input className="cb-input" value={f.title} placeholder="e.g. Top 10 Home Decor Trends for 2025"
                onChange={e=>{ set('title',e.target.value); if(isNew) set('slug',autoSlug(e.target.value)); }}/>
            </div>

            {/* Featured Image */}
            <div className="cb-field">
              <label className="cb-label">Featured Image</label>
              {f.featuredImage ? (
                <div className="cb-img-preview">
                  <img src={f.featuredImage} alt="Featured" className="cb-img-preview-img"/>
                  <button className="cb-img-remove" onClick={()=>set('featuredImage','')}><X size={11}/>Remove</button>
                </div>
              ) : (
                <label className="cb-img-upload">
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={handleImageFile}/>
                  <Image size={20} color="#94a3b8"/>
                  <span className="cb-img-upload-text">Click to upload featured image</span>
                  <span className="cb-img-upload-hint">PNG, JPG, WebP — recommended 1200×630px</span>
                </label>
              )}
            </div>

            {/* Post body */}
            <div className="cb-field">
              <label className="cb-label">Post Content</label>
              <textarea className="cb-textarea cb-textarea--tall" rows={12}
                value={f.content}
                placeholder="Write your post content here. HTML is supported."
                onChange={e=>set('content',e.target.value)}/>
              <span className="cb-cc">{f.content.length} chars · {f.content.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </>)}

          {/* ── SETTINGS TAB ── */}
          {tab==='settings' && (<>
            <div className="cb-row2">
              <div className="cb-field">
                <label className="cb-label">URL Slug <span className="cb-req">*</span></label>
                <input className="cb-input cb-mono" value={f.slug} placeholder="/blog/my-post" onChange={e=>set('slug',e.target.value)}/>
              </div>
              <div className="cb-field">
                <label className="cb-label">Category</label>
                <select className="cb-select" value={f.category} onChange={e=>set('category',e.target.value)}>
                  {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="cb-row3">
              <div className="cb-field">
                <label className="cb-label">Author</label>
                <input className="cb-input" value={f.author} onChange={e=>set('author',e.target.value)}/>
              </div>
              <div className="cb-field">
                <label className="cb-label">Status</label>
                <select className="cb-select" value={f.status} onChange={e=>set('status',e.target.value)}>
                  {['draft','published','archived'].map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div className="cb-field">
                <label className="cb-label">Read Time (min)</label>
                <input className="cb-input" type="number" min="1" max="60" value={f.readMin} onChange={e=>set('readMin',Number(e.target.value))}/>
              </div>
            </div>
            <div className="cb-field">
              <label className="cb-label">Tags</label>
              <div className="cb-tag-row">
                <input className="cb-input" value={tagInput} placeholder="Type a tag and press Enter"
                  onChange={e=>setTagInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTag();}}}/>
                <button className="cb-btn cb-btn-outline cb-btn-sm" type="button" onClick={addTag}>Add</button>
              </div>
              {f.tags.length>0&&(
                <div className="cb-tags-list">
                  {f.tags.map(t=>(
                    <span key={t} className="cb-tag">#{t}
                      <button className="cb-tag-rm" onClick={()=>set('tags',f.tags.filter(x=>x!==t))}><X size={9}/></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="cb-divider"><span>SEO</span></div>
            <div className="cb-field">
              <label className="cb-label">Meta Title <span className="cb-note">50–60 chars</span></label>
              <input className="cb-input" value={f.metaTitle} placeholder="SEO title" onChange={e=>set('metaTitle',e.target.value)}/>
              <span className="cb-cc" style={{color:f.metaTitle.length>60?'#dc2626':'#94a3b8'}}>{f.metaTitle.length}/60</span>
            </div>
            <div className="cb-field">
              <label className="cb-label">Meta Description <span className="cb-note">120–160 chars</span></label>
              <textarea className="cb-textarea" rows={2} value={f.metaDesc} placeholder="SEO description" onChange={e=>set('metaDesc',e.target.value)}/>
              <span className="cb-cc" style={{color:f.metaDesc.length>160?'#dc2626':'#94a3b8'}}>{f.metaDesc.length}/160</span>
            </div>
          </>)}
        </div>

        <div className="cb-modal-footer">
          <button className="cb-btn cb-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="cb-btn cb-btn-primary" disabled={!f.title.trim()||!f.slug.trim()} onClick={()=>onSave(f)}>
            <Save size={13} color="#fff"/>{isNew?'Create Post':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function CmsBlog() {
  const [rows,    setRows]    = useState([]);
  const [modal,   setModal]   = useState(null);
  const [statF,   setStatF]   = useState('All');
  const [catF,    setCatF]    = useState('All');
  const [search,  setSearch]  = useState('');
  const [pg,      setPg]      = useState(0);
  const [delConf, setDelConf] = useState(null);

  useEffect(() => { getBlogPosts().then(setRows).catch(() => {}); }, []);

  const list  = rows.filter(r=>
    (statF==='All'||r.status===statF)&&
    (catF==='All'||r.category===catF)&&
    (!search||r.title.toLowerCase().includes(search.toLowerCase())||r.author.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPg = Math.ceil(list.length/PER)||1;
  const slice   = list.slice(pg*PER,(pg+1)*PER);

  const totalViews    = rows.reduce((s,r)=>s+r.views,0);
  const totalComments = rows.reduce((s,r)=>s+r.comments,0);
  const published     = rows.filter(r=>r.status==='published').length;
  const draft         = rows.filter(r=>r.status==='draft').length;
  const archived      = rows.filter(r=>r.status==='archived').length;

  const save = async form => {
    if (form.id) { await updateBlogPost(form.id, form); } else { await createBlogPost(form); }
    getBlogPosts().then(setRows); setModal(null);
  };
  const dup = async row => {
    await createBlogPost({ ...row, title: row.title + ' (Copy)', slug: row.slug + '-copy', status: 'draft', views: 0, comments: 0, date: 'Today' });
    getBlogPosts().then(setRows);
  };

  return (
    <div className="cb-wrap">
      <div className="cb-hdr">
        <div>
          <h2 className="cb-hdr-title">Blog</h2>
          <p className="cb-hdr-sub">Manage blog posts, categories and editorial content</p>
        </div>
        <div className="cb-hdr-acts">
          <button className="cb-btn cb-btn-outline" onClick={() => {
  const csv = rows.map(r => [r.title, r.category, r.author, r.status, r.views, r.comments, r.date]);
  exportCSV([['Title','Category','Author','Status','Views','Comments','Date'], ...csv], 'cms-blog.csv');
}}><Download size={13} color="#475569"/>Export</button>
          <button className="cb-btn cb-btn-primary" onClick={()=>setModal({})}><Plus size={13} color="#fff"/>New Post</button>
        </div>
      </div>

      <div className="cb-kpis">
        {[
          {label:'Total Posts',  value:rows.length,              icon:BookOpen,      c:'#475569',bg:'#f1f5f9'},
          {label:'Published',    value:published,                icon:Eye,           c:'#16a34a',bg:'#dcfce7'},
          {label:'Total Views',  value:totalViews.toLocaleString(),icon:TrendingUp,  c:'#2563eb',bg:'#dbeafe'},
          {label:'Comments',     value:totalComments,            icon:MessageSquare, c:'#d97706',bg:'#fef3c7'},
        ].map((k,i)=>{
          const KI = k.icon;
          return (
            <div key={i} className="cb-kpi">
              <div className="cb-kpi-icon" style={{background:k.bg}}><KI size={15} color={k.c}/></div>
              <div>
                <div className="cb-kpi-val" style={{color:k.c}}>{k.value}</div>
                <div className="cb-kpi-lbl">{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cb-card">
        <div className="cb-toolbar">
          <div className="cb-toolbar-filters">
            <div className="cb-pills">
              {STATUSES.map(s=>(
                <button key={s} className={`cb-pill${statF===s?' cb-pill-on':''}`} onClick={()=>{setStatF(s);setPg(0);}}>
                  {s==='All'?'All':s[0].toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <div className="cb-pills">
              {CATEGORIES.map(c=>(
                <button key={c} className={`cb-pill${catF===c?' cb-pill-on':''}`} onClick={()=>{setCatF(c);setPg(0);}}>{c}</button>
              ))}
            </div>
          </div>
          <div className="cb-search-wrap">
            <Search size={13} color="#94a3b8" className="cb-search-ic"/>
            <input className="cb-search-input" placeholder="Search posts…" value={search} onChange={e=>{setSearch(e.target.value);setPg(0);}}/>
          </div>
        </div>

        <div className="cb-table-wrap">
          <table className="cb-table">
            <thead><tr>
              <th>Title</th><th>Category</th><th>Author</th><th>Status</th>
              <th>Views</th><th>Comments</th><th>Read</th><th>Date</th>
              <th className="cb-tar">Actions</th>
            </tr></thead>
            <tbody>
              {slice.length===0
                ? <tr><td colSpan={9} className="cb-empty">No posts match your filters</td></tr>
                : slice.map(r=>{
                    const ss=sStyle(r.status);
                    const cc=CAT_COLORS[r.category]||{bg:'#f1f5f9',c:'#64748b'};
                    const av=r.author.split(' ').map(w=>w[0]).join('').slice(0,2);
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="cb-post-title">{r.title}</div>
                          <div className="cb-post-tags">{r.tags.slice(0,3).map(t=><span key={t} className="cb-tag-sm">#{t}</span>)}</div>
                        </td>
                        <td><span className="cb-cat-b" style={{background:cc.bg,color:cc.c}}>{r.category}</span></td>
                        <td>
                          <div className="cb-author">
                            <div className="cb-av">{av}</div>
                            <span className="cb-muted">{r.author.split(' ')[0]}</span>
                          </div>
                        </td>
                        <td><span className="cb-status-b" style={{background:ss.bg,color:ss.c}}><span className="cb-dot"/>{r.status[0].toUpperCase()+r.status.slice(1)}</span></td>
                        <td className="cb-muted">{r.views>0?r.views.toLocaleString():'—'}</td>
                        <td className="cb-muted">{r.comments>0?r.comments:'—'}</td>
                        <td className="cb-muted">{r.readMin} min</td>
                        <td className="cb-muted">{r.date}</td>
                        <td className="cb-tar">
                          <div className="cb-acts">
                            {r.status==='published'&&<a className="cb-icon-btn" href={'https://bazaarmax.in'+r.slug} target="_blank" rel="noreferrer" title="View"><ExternalLink size={12}/></a>}
                            <button className="cb-icon-btn" title="Edit" onClick={()=>setModal({...r,tags:[...r.tags]})}><Edit2 size={12}/></button>
                            <button className="cb-icon-btn" title="Duplicate" onClick={()=>dup(r)}><Copy size={12}/></button>
                            <button className="cb-icon-btn cb-icon-btn-del" title="Delete" onClick={()=>setDelConf(r.id)}><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        <div className="cb-pag">
          <span className="cb-pag-info">{pg*PER+1}–{Math.min((pg+1)*PER,list.length)} of {list.length}</span>
          <div className="cb-pag-ctrl">
            <button className="cb-pag-btn" onClick={()=>setPg(p=>p-1)} disabled={pg===0}><ChevronLeft size={13}/></button>
            <span className="cb-pag-lbl">{pg+1} / {totalPg}</span>
            <button className="cb-pag-btn" onClick={()=>setPg(p=>p+1)} disabled={(pg+1)*PER>=list.length}><ChevronRight size={13}/></button>
          </div>
        </div>
      </div>

      {modal && <PostModal post={modal} onSave={save} onClose={()=>setModal(null)}/>}

      {delConf&&(
        <div className="cb-overlay" onClick={()=>setDelConf(null)}>
          <div className="cb-confirm" onClick={e=>e.stopPropagation()}>
            <div className="cb-confirm-icon"><Trash2 size={20} color="#dc2626"/></div>
            <p className="cb-confirm-title">Delete Post?</p>
            <p className="cb-confirm-sub">This permanently removes the post and all its content.</p>
            <div className="cb-confirm-acts">
              <button className="cb-btn cb-btn-ghost" onClick={()=>setDelConf(null)}>Cancel</button>
              <button className="cb-btn cb-btn-danger" onClick={async ()=>{await deleteBlogPost(delConf);getBlogPosts().then(setRows);setDelConf(null);}}>
                <Trash2 size={13} color="#fff"/>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}