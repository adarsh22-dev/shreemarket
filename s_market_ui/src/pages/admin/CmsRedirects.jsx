import React, { useState, useEffect } from 'react';
import './CmsRedirects.css';
import {
  Plus, Trash2, Edit2, Search, ChevronLeft, ChevronRight,
  Save, X, Download, ArrowRight, AlertTriangle, Check,
  RefreshCw, ExternalLink, Info
} from 'lucide-react';
import { getUrlRedirects, createUrlRedirect, updateUrlRedirect, deleteUrlRedirect } from '../../api/api';

const REDIRECT_TYPES = ['301 Permanent','302 Temporary'];
const PER = 8;

const typeStyle = t => t.startsWith('301')
  ? {bg:'#ede9fe',c:'#7c3aed'}
  : {bg:'#dbeafe',c:'#2563eb'};

function RedirectModal({ redirect, onSave, onClose }) {
  const isNew = !redirect.id;
  const [f, sf] = useState({
    from: '', to: '', type: '301 Permanent',
    active: true, note: '', ...redirect
  });
  const set = (k,v) => sf(p=>({...p,[k]:v}));

  const isExternal = f.to.startsWith('http');
  const hasLoop    = f.from.trim()===f.to.trim() && f.from.trim()!=='';

  return (
    <div className="cr-overlay" onClick={onClose}>
      <div className="cr-modal" onClick={e=>e.stopPropagation()}>
        <div className="cr-modal-hdr">
          <div>
            <div className="cr-modal-title">{isNew?'New Redirect':'Edit Redirect'}</div>
            <div className="cr-modal-sub">{f.from||'set source path'} → {f.to||'set destination'}</div>
          </div>
          <button className="cr-icon-btn" onClick={onClose}><X size={14}/></button>
        </div>
        <div className="cr-modal-body">
          <div className="cr-redirect-preview">
            <div className="cr-redirect-preview-from">{f.from||'/source-path'}</div>
            <div className="cr-redirect-preview-arrow">
              <ArrowRight size={16} color="#E03E1A"/>
              <span className="cr-redirect-type-chip" style={typeStyle(f.type)}>{f.type}</span>
            </div>
            <div className="cr-redirect-preview-to">{f.to||'/destination'}</div>
          </div>

          {hasLoop && (
            <div className="cr-alert cr-alert--warn">
              <AlertTriangle size={13} color="#d97706"/>
              <span>Source and destination are the same — this will create a redirect loop.</span>
            </div>
          )}

          <div className="cr-field">
            <label className="cr-label">From (Source Path) <span className="cr-req">*</span></label>
            <input className="cr-input cr-mono" value={f.from} placeholder="/old-url-path" onChange={e=>set('from',e.target.value)}/>
            <span className="cr-hint">Relative path starting with / — no domain needed</span>
          </div>
          <div className="cr-field">
            <label className="cr-label">To (Destination) <span className="cr-req">*</span></label>
            <input className="cr-input cr-mono" value={f.to} placeholder="/new-url or https://external.com" onChange={e=>set('to',e.target.value)}/>
            {isExternal && <span className="cr-hint cr-hint--blue">External URL — visitors will be redirected off-site</span>}
          </div>
          <div className="cr-row2">
            <div className="cr-field">
              <label className="cr-label">Redirect Type</label>
              <select className="cr-select" value={f.type} onChange={e=>set('type',e.target.value)}>
                {REDIRECT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <span className="cr-hint">{f.type.startsWith('301')?'Permanent — passes SEO value to destination':'Temporary — source keeps SEO value'}</span>
            </div>
            <div className="cr-field">
              <label className="cr-label">Internal Note</label>
              <input className="cr-input" value={f.note} placeholder="Optional team note" onChange={e=>set('note',e.target.value)}/>
            </div>
          </div>
          <div className="cr-field cr-field--inline">
            <div>
              <div className="cr-label" style={{margin:0}}>Active</div>
              <div className="cr-hint" style={{margin:0}}>Inactive redirects are saved but not applied</div>
            </div>
            <button className={`cr-toggle${f.active?' cr-toggle--on':' cr-toggle--off'}`} onClick={()=>set('active',!f.active)}>
              <span className="cr-toggle-knob"/>
            </button>
          </div>
        </div>
        <div className="cr-modal-footer">
          <button className="cr-btn cr-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="cr-btn cr-btn-primary"
            disabled={!f.from.trim()||!f.to.trim()||hasLoop}
            onClick={()=>onSave(f)}>
            <Save size={13} color="#fff"/>{isNew?'Create Redirect':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CmsRedirects() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [modal,   setModal]   = useState(null);
  const [typeF,   setTypeF]   = useState('All');
  const [activeF, setActiveF] = useState('All');
  const [search,  setSearch]  = useState('');
  const [pg,      setPg]      = useState(0);
  const [delConf, setDelConf]  = useState(null);
  const [deleting,setDeleting] = useState(false);
  const [saved,   setSaved]    = useState(false);

  const fetchRedirects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUrlRedirects();
      if (data) setRows(data);
    } catch (err) {
      setError(err.message || 'Failed to load redirects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRedirects(); }, []);

  const list = rows.filter(r=>
    (typeF==='All'||r.type===typeF)&&
    (activeF==='All'||(activeF==='active'?r.active:!r.active))&&
    (!search||r.fromPath.toLowerCase().includes(search.toLowerCase())||r.toPath.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPg = Math.ceil(list.length/PER)||1;
  const slice   = list.slice(pg*PER,(pg+1)*PER);

  const active     = rows.filter(r=>r.active).length;
  const permanent  = rows.filter(r=>r.type.startsWith('301')).length;
  const totalHits  = rows.reduce((s,r)=>s+(r.hits||0),0);

  const save = async form => {
    try {
      const payload = {
        fromPath: form.from,
        toPath: form.to,
        type: form.type,
        active: form.active,
        note: form.note,
        hits: form.hits || 0,
        createdAt: form.createdAt || new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
      };
      if (form.id) {
        const updated = await updateUrlRedirect(form.id, payload);
        setRows(rs=>rs.map(r=>r.id===form.id?{...r,...updated}:r));
      } else {
        const created = await createUrlRedirect(payload);
        setRows(rs=>[...rs,created]);
      }
      setModal(null);
      setSaved(true);
      setTimeout(()=>setSaved(false),2500);
    } catch (err) {
      setError(err.message || 'Failed to save redirect');
    }
  };

  const toggle = async id => {
    const r = rows.find(r=>r.id===id);
    if (!r) return;
    try {
      const updated = await updateUrlRedirect(id, { ...r, active: !r.active, fromPath: r.fromPath, toPath: r.toPath });
      setRows(rs=>rs.map(r=>r.id===id?{...r,...updated}:r));
    } catch (err) {
      setError(err.message || 'Failed to toggle redirect');
    }
  };

  const handleDelete = async id => {
    setDeleting(true);
    try {
      await deleteUrlRedirect(id);
      setRows(rs=>rs.filter(r=>r.id!==id));
      setDelConf(null);
    } catch (err) {
      setError(err.message || 'Failed to delete redirect');
    } finally {
      setDeleting(false);
    }
  };

  const FILTERS = ['All','active','inactive'];

  return (
    <div className="cr-wrap">
      <div className="cr-hdr">
        <div>
          <h2 className="cr-hdr-title">URL Redirects</h2>
          <p className="cr-hdr-sub">Manage 301/302 redirects to preserve SEO and route legacy URLs</p>
        </div>
        <div className="cr-hdr-acts">
          {saved && <span className="cr-saved-flash"><Check size={13} color="#16a34a"/>Saved</span>}
          <button className="cr-btn cr-btn-outline" onClick={fetchRedirects} disabled={loading}><RefreshCw size={13} color="#475569"/>Refresh</button>
          <button className="cr-btn cr-btn-primary" onClick={()=>setModal({})}><Plus size={13} color="#fff"/>Add Redirect</button>
        </div>
      </div>

      <div className="cr-info-banner">
        <Info size={14} color="#2563eb"/>
        <span><strong>301 Permanent</strong> redirects pass SEO link equity to the destination and should be used for permanently moved pages. <strong>302 Temporary</strong> redirects retain SEO value at the source and are best for seasonal campaigns or A/B tests.</span>
      </div>

      {error && (
        <div className="cr-alert cr-alert--warn" style={{marginBottom:16}}>
          <AlertTriangle size={13} color="#dc2626"/>
          <span>{error}</span>
          <button className="cr-icon-btn" style={{marginLeft:'auto'}} onClick={()=>setError(null)}><X size={13}/></button>
        </div>
      )}

      <div className="cr-kpis">
        {[
          {label:'Total Redirects', value:loading?'…':rows.length, c:'#475569'},
          {label:'Active',          value:loading?'…':active,      c:'#16a34a'},
          {label:'301 Permanent',   value:loading?'…':permanent,   c:'#7c3aed'},
          {label:'Total Hits',      value:loading?'…':totalHits.toLocaleString(), c:'#2563eb'},
        ].map((k,i)=>(
          <div key={i} className="cr-kpi">
            <div className="cr-kpi-val" style={{color:k.c}}>{k.value}</div>
            <div className="cr-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="cr-card">
        <div className="cr-toolbar">
          <div className="cr-toolbar-filters">
            <div className="cr-pills">
              {['All','301 Permanent','302 Temporary'].map(t=>(
                <button key={t} className={`cr-pill${typeF===t?' cr-pill-on':''}`} onClick={()=>{setTypeF(t);setPg(0);}}>{t}</button>
              ))}
            </div>
            <div className="cr-pills">
              {FILTERS.map(f=>(
                <button key={f} className={`cr-pill${activeF===f?' cr-pill-on':''}`} onClick={()=>{setActiveF(f);setPg(0);}}>
                  {f[0].toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="cr-search-wrap">
            <Search size={13} color="#94a3b8" className="cr-search-ic"/>
            <input className="cr-search-input" placeholder="Search redirects…" value={search} onChange={e=>{setSearch(e.target.value);setPg(0);}}/>
          </div>
        </div>

        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead><tr>
              <th>From</th><th/>
              <th>To</th><th>Type</th>
              <th>Hits</th><th>Status</th><th>Created</th>
              <th className="cr-tar">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="cr-empty">Loading redirects…</td></tr>
              ) : slice.length===0 ? (
                <tr><td colSpan={8} className="cr-empty">No redirects match your filters</td></tr>
              ) : slice.map(r=>{
                  const ts = typeStyle(r.type);
                  const isExt = r.toPath.startsWith('http');
                  return (
                    <tr key={r.id} className={!r.active?'cr-row--inactive':''}>
                      <td><code className="cr-path">{r.fromPath}</code></td>
                      <td className="cr-arrow-cell"><ArrowRight size={13} color="#E03E1A"/></td>
                      <td>
                        <div className="cr-to-cell">
                          <code className="cr-path">{r.toPath}</code>
                          {isExt && <ExternalLink size={10} color="#94a3b8"/>}
                        </div>
                        {r.note && <div className="cr-note">{r.note}</div>}
                      </td>
                      <td><span className="cr-type-badge" style={{background:ts.bg,color:ts.c}}>{r.type}</span></td>
                      <td className="cr-muted">{r.hits>0?r.hits.toLocaleString():'—'}</td>
                      <td>
                        <button className={`cr-active-toggle${r.active?' cr-active-toggle--on':''}`} onClick={()=>toggle(r.id)}>
                          {r.active?'Active':'Inactive'}
                        </button>
                      </td>
                      <td className="cr-muted">{r.createdAt}</td>
                      <td className="cr-tar">
                        <div className="cr-acts">
                          <button className="cr-icon-btn" title="Edit" onClick={()=>setModal({...r})}><Edit2 size={12}/></button>
                          <button className="cr-icon-btn cr-icon-btn-del" title="Delete" onClick={()=>setDelConf(r.id)}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        <div className="cr-pag">
          <span className="cr-pag-info">{pg*PER+1}–{Math.min((pg+1)*PER,list.length)} of {list.length}</span>
          <div className="cr-pag-ctrl">
            <button className="cr-pag-btn" onClick={()=>setPg(p=>p-1)} disabled={pg===0}><ChevronLeft size={13}/></button>
            <span className="cr-pag-lbl">{pg+1} / {totalPg}</span>
            <button className="cr-pag-btn" onClick={()=>setPg(p=>p+1)} disabled={(pg+1)*PER>=list.length}><ChevronRight size={13}/></button>
          </div>
        </div>
      </div>

      {modal && <RedirectModal redirect={modal} onSave={save} onClose={()=>setModal(null)}/>}

      {delConf&&(
        <div className="cr-overlay" onClick={()=>setDelConf(null)}>
          <div className="cr-confirm" onClick={e=>e.stopPropagation()}>
            <div className="cr-confirm-icon"><Trash2 size={20} color="#dc2626"/></div>
            <p className="cr-confirm-title">Delete Redirect?</p>
            <p className="cr-confirm-sub">This permanently removes the redirect rule. Traffic to the old URL will no longer be forwarded.</p>
            <div className="cr-confirm-acts">
              <button className="cr-btn cr-btn-ghost" onClick={()=>setDelConf(null)} disabled={deleting}>Cancel</button>
              <button className="cr-btn cr-btn-danger" onClick={()=>handleDelete(delConf)} disabled={deleting}>
                {deleting?'Deleting…':<><Trash2 size={13} color="#fff"/>Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
