import React, { useState, useEffect } from 'react';
import './CmsFaqs.css';
import {
  Plus, Trash2, Edit2, Search, ChevronLeft, ChevronRight,
  Save, X, ChevronDown, ChevronUp, GripVertical,
  HelpCircle, CheckCircle, EyeOff, Download, Check
} from 'lucide-react';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../../api/api';
import { exportCSV } from './VendorShared';

/* ─── data ─── */
const CATEGORIES = ['All','Orders','Payments','Returns','Shipping','Vendor','Account','Products'];
const STATUSES = ['All','published','draft'];
const PER = 8;

const sStyle = s => ({ published:{bg:'#dcfce7',c:'#16a34a'}, draft:{bg:'#fef3c7',c:'#d97706'} }[s]||{bg:'#f1f5f9',c:'#64748b'});

/* ─── Modal ─── */
function FaqModal({ faq, onSave, onClose }) {
  const isNew = !faq.id;
  const [f, sf] = useState({
    id:'f'+Date.now(), question:'', answer:'', category:'Orders',
    status:'draft', order:1, views:0, ...faq
  });
  const set = (k,v) => sf(p=>({...p,[k]:v}));

  return (
    <div className="cf-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={e=>e.stopPropagation()}>
        <div className="cf-modal-hdr">
          <div>
            <div className="cf-modal-title">{isNew?'New FAQ':'Edit FAQ'}</div>
            <div className="cf-modal-sub">{f.category} · {f.status}</div>
          </div>
          <button className="cf-icon-btn" onClick={onClose}><X size={14}/></button>
        </div>
        <div className="cf-modal-body">
          <div className="cf-field">
            <label className="cf-label">Question <span className="cf-req">*</span></label>
            <input className="cf-input" value={f.question} placeholder="e.g. How do I track my order?" onChange={e=>set('question',e.target.value)}/>
          </div>
          <div className="cf-field">
            <label className="cf-label">Answer <span className="cf-req">*</span></label>
            <textarea className="cf-textarea" rows={5} value={f.answer} placeholder="Write the full answer here…" onChange={e=>set('answer',e.target.value)}/>
            <span className="cf-cc">{f.answer.length} chars</span>
          </div>
          <div className="cf-row3">
            <div className="cf-field">
              <label className="cf-label">Category</label>
              <select className="cf-select" value={f.category} onChange={e=>set('category',e.target.value)}>
                {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="cf-field">
              <label className="cf-label">Status</label>
              <select className="cf-select" value={f.status} onChange={e=>set('status',e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="cf-field">
              <label className="cf-label">Display Order</label>
              <input className="cf-input" type="number" min="1" value={f.order} onChange={e=>set('order',Number(e.target.value))}/>
            </div>
          </div>
        </div>
        <div className="cf-modal-footer">
          <button className="cf-btn cf-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="cf-btn cf-btn-primary" disabled={!f.question.trim()||!f.answer.trim()} onClick={()=>onSave(f)}>
            <Save size={13} color="#fff"/>{isNew?'Create FAQ':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Table Row ─── */
function FaqRow({ faq, onEdit, onDelete }) {
  const ss = sStyle(faq.status);
  return (
    <tr>
      <td style={{fontWeight:700,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{faq.question}</td>
      <td style={{color:'#64748b',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{faq.answer}</td>
      <td><span className="cf-cat-badge">{faq.category}</span></td>
      <td><span className="cf-status-b" style={{background:ss.bg,color:ss.c}}><span className="cf-dot"/>{faq.status[0].toUpperCase()+faq.status.slice(1)}</span></td>
      <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
        <button className="cf-icon-btn" title="Edit" onClick={()=>onEdit(faq)} style={{marginRight:2}}><Edit2 size={12}/></button>
        <button className="cf-icon-btn cf-icon-btn-del" title="Delete" onClick={()=>onDelete(faq.id)}><Trash2 size={12}/></button>
      </td>
    </tr>
  );
}

/* ─── Main ─── */
export default function CmsFaqs() {
  const [rows,    setRows]    = useState([]);
  useEffect(() => { getFaqs().then(setRows).catch(() => {}); }, []);
  const [modal,   setModal]   = useState(null);
  const [statF,   setStatF]   = useState('All');
  const [catF,    setCatF]    = useState('All');
  const [search,  setSearch]  = useState('');
  const [pg,      setPg]      = useState(0);
  const [delConf, setDelConf] = useState(null);

  const list  = rows.filter(r=>
    (statF==='All'||r.status===statF)&&
    (catF==='All'||r.category===catF)&&
    (!search||r.question.toLowerCase().includes(search.toLowerCase())||r.answer.toLowerCase().includes(search.toLowerCase()))
  ).sort((a,b)=>a.order-b.order);

  const totalPg = Math.ceil(list.length/PER)||1;
  const slice   = list.slice(pg*PER,(pg+1)*PER);

  const published = rows.filter(r=>r.status==='published').length;
  const draft     = rows.filter(r=>r.status==='draft').length;
  const totalViews= rows.reduce((s,r)=>s+r.views,0);

  const save = async form => {
    const exists = rows.find(r => r.id === form.id);
    try {
      if (exists) {
        await updateFaq(form.id, form);
      } else {
        await createFaq(form);
      }
      const data = await getFaqs();
      setRows(data);
    } catch (e) { console.error('FAQ save failed:', e); }
    setModal(null);
  };

  return (
    <div className="cf-wrap">
      <div className="cf-hdr">
        <div>
          <h2 className="cf-hdr-title">FAQs</h2>
          <p className="cf-hdr-sub">Manage frequently asked questions shown on the Help & Support pages</p>
        </div>
        <div className="cf-hdr-acts">
          <button className="cf-btn cf-btn-outline" onClick={() => exportCSV(rows, 'cms-faqs.csv')}><Download size={13} color="#475569"/>Export</button>
          <button className="cf-btn cf-btn-primary" onClick={()=>setModal({})}><Plus size={13} color="#fff"/>Add FAQ</button>
        </div>
      </div>

      <div className="cf-kpis">
        {[
          {label:'Total FAQs',  value:rows.length,              c:'#475569'},
          {label:'Published',   value:published,                c:'#16a34a'},
          {label:'Drafts',      value:draft,                    c:'#d97706'},
          {label:'Total Views', value:totalViews.toLocaleString(), c:'#2563eb'},
        ].map((k,i)=>(
          <div key={i} className="cf-kpi">
            <div className="cf-kpi-val" style={{color:k.c}}>{k.value}</div>
            <div className="cf-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="cf-card">
        <div className="cf-toolbar">
          <div className="cf-toolbar-top">
            <div className="cf-pills">
              {STATUSES.map(s=>(
                <button key={s} className={`cf-pill${statF===s?' cf-pill-on':''}`} onClick={()=>{setStatF(s);setPg(0);}}>
                  {s==='All'?'All':s[0].toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <div className="cf-search-wrap">
              <Search size={13} color="#94a3b8" className="cf-search-ic"/>
              <input className="cf-search-input" placeholder="Search questions…" value={search} onChange={e=>{setSearch(e.target.value);setPg(0);}}/>
            </div>
          </div>
          <div className="cf-pills cf-pills--cats">
            {CATEGORIES.map(c=>(
              <button key={c} className={`cf-pill${catF===c?' cf-pill-on':''}`} onClick={()=>{setCatF(c);setPg(0);}}>{c}</button>
            ))}
          </div>
        </div>

        <div className="cf-tw">
          <table className="cf-tbl">
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
                <th>Category</th>
                <th>Status</th>
                <th className="cf-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length===0
                ? <tr><td colSpan={5} style={{textAlign:'center',padding:48,color:'#94a3b8'}}><HelpCircle size={28} color="#cbd5e1"/><p style={{margin:'6px 0 0',fontWeight:700}}>No FAQs match your filters</p></td></tr>
                : slice.map(faq=>(
                    <FaqRow key={faq.id} faq={faq}
                      onEdit={setModal}
                      onDelete={id=>setDelConf(id)}/>
                  ))
              }
            </tbody>
          </table>
        </div>

        <div className="cf-pag">
          <span className="cf-pag-info">{pg*PER+1}–{Math.min((pg+1)*PER,list.length)} of {list.length}</span>
          <div className="cf-pag-ctrl">
            <button className="cf-pag-btn" onClick={()=>setPg(p=>p-1)} disabled={pg===0}><ChevronLeft size={13}/></button>
            <span className="cf-pag-lbl">{pg+1} / {totalPg}</span>
            <button className="cf-pag-btn" onClick={()=>setPg(p=>p+1)} disabled={(pg+1)*PER>=list.length}><ChevronRight size={13}/></button>
          </div>
        </div>
      </div>

      {modal && <FaqModal faq={modal} onSave={save} onClose={()=>setModal(null)}/>}

      {delConf&&(
        <div className="cf-overlay" onClick={()=>setDelConf(null)}>
          <div className="cf-confirm" onClick={e=>e.stopPropagation()}>
            <div className="cf-confirm-icon"><Trash2 size={20} color="#dc2626"/></div>
            <p className="cf-confirm-title">Delete FAQ?</p>
            <p className="cf-confirm-sub">This removes the FAQ from the Help page permanently.</p>
            <div className="cf-confirm-acts">
              <button className="cf-btn cf-btn-ghost" onClick={()=>setDelConf(null)}>Cancel</button>
              <button className="cf-btn cf-btn-danger" onClick={()=>{deleteFaq(delConf).then(() => getFaqs().then(setRows)).catch(()=>{});setDelConf(null);}}>
                <Trash2 size={13} color="#fff"/>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
