import React, { useState, useEffect, useCallback } from 'react';
import './AdminCommissionRules.css';
import { Icon, fmt, exportCSV } from './VendorShared';
import { getCommissionCategories, saveCommissionCategory, updateCommissionCategory, deleteCommissionCategory } from '../../api/api';
import toast from 'react-hot-toast';

const CATS   = ['All','Electronics','Fashion','Books','Grocery','Beauty','Furniture','Sports'];
const EMPTY  = { name:'', category:'Electronics', type:'percentage', value:10, minOrder:0, maxCap:null, gst:true, flatFee:0, active:true, priority:99, appliedTo:'All vendors', revenue:0 };

export default function CommissionRules() {
  const [rules,   setRules]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCommissionCategories();
      setRules(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load commission rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const filtered = filter === 'All' ? rules : rules.filter(r => r.category === filter);

  const totalRevenue = rules.reduce((s,r) => s + (r.revenue || 0), 0);
  const active       = rules.filter(r => r.active).length;
  const maxRev       = Math.max(...rules.map(r => r.revenue || 0), 1);

  const openNew  = () => { setForm({...EMPTY}); setModal('new'); };
  const openEdit = r  => { setForm({...r}); setModal(r); };

  const save = async () => {
    try {
      setSaving(true);
      if (modal === 'new') {
        const created = await saveCommissionCategory(form);
        toast.success('Rule created');
        setRules(rs => [...rs, created]);
      } else {
        const updated = await updateCommissionCategory(modal.id, form);
        toast.success('Rule updated');
        setRules(rs => rs.map(r => r.id === modal.id ? {...updated, id: r.id} : r));
      }
      setModal(null);
    } catch (e) {
      toast.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const del = async id => {
    try {
      await deleteCommissionCategory(id);
      toast.success('Rule deleted');
      setRules(rs => rs.filter(r => r.id !== id));
    } catch (e) {
      toast.error('Failed to delete rule');
    }
  };

  const toggle = async id => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    try {
      const updated = await updateCommissionCategory(id, { ...rule, active: !rule.active });
      setRules(rs => rs.map(r => r.id === id ? {...r, active: !r.active} : r));
      toast.success(`Rule ${updated.active ? 'activated' : 'paused'}`);
    } catch (e) {
      toast.error('Failed to toggle rule');
    }
  };

  if (loading) {
    return (
      <div className="vm">
        <div className="vm-hdr">
          <div>
            <h2 className="vm-hdr__title">Commission Rules</h2>
            <p className="vm-hdr__sub">Define platform-wide commission logic by category, type and vendor tier</p>
          </div>
        </div>
        <div style={{textAlign:'center', padding:'60px 0', color:'#94a3b8', fontSize:'0.9rem'}}>Loading commission rules...</div>
      </div>
    );
  }

  return (
    <div className="vm">
      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Commission Rules</h2>
          <p className="vm-hdr__sub">Define platform-wide commission logic by category, type and vendor tier</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => {
            const rows = rules.map(r => [r.name, r.category, r.type, r.value, r.minOrder, r.maxCap ?? '', r.gst ? 'Yes' : 'No', r.flatFee, r.active ? 'Active' : 'Inactive', r.priority, r.appliedTo, r.revenue]);
            exportCSV([['Name','Category','Type','Value','Min Order','Max Cap','GST','Flat Fee','Status','Priority','Applied To','Revenue'], ...rows], 'commission-rules.csv');
            toast.success('Commission rules exported');
          }}><Icon name="Download" size={13} color="#475569"/>Export</button>
          <button className="vm-btn vm-btn--primary" onClick={openNew}><Icon name="Plus" size={13} color="#fff"/>New Rule</button>
        </div>
      </div>

      {/* Alert */}
      <div className="cr-alert">
        <Icon name="Info" size={15} color="#2563eb"/>
        <span>Commission is deducted from gross sales before vendor payout. GST on commission (18%) is applied separately where enabled. Flat fee is added on top of percentage commissions.</span>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Total Rules',         value: rules.length, sub:`${active} active`, icon:'List',        c:'#475569', bg:'#f1f5f9' },
          { label:'Total Commission Rev',value: fmt(totalRevenue), sub:'This month', icon:'TrendingUp',  c:'#16a34a', bg:'#dcfce7' },
          { label:'Active Rules',        value: active,       sub:`${rules.length-active} paused`, icon:'CheckCircle', c:'#2563eb', bg:'#dbeafe' },
          { label:'Categories Covered',  value: new Set(rules.map(r=>r.category)).size, sub:'with rules set', icon:'Tag', c:'#d97706', bg:'#fef3c7' },
        ].map((k,i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background:k.bg}}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
              </div>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
              <div className="vm-kpi__sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rules Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Commission Rules</p>
            <p className="vm-sh__sub">Sorted by priority — higher priority rules apply first</p>
          </div>
          <div className="vm-pills">
            {CATS.map(c => (
              <button key={c} className={`vm-pill${filter===c?' vm-pill--active':''}`}
                onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Rule Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Rate</th>
                <th>Min Order</th>
                <th>Max Cap</th>
                <th>GST</th>
                <th>Flat Fee</th>
                <th>Revenue (Mo)</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a,b)=>(a.priority||99)-(b.priority||99)).map(r => (
                <tr key={r.id} style={{opacity: r.active ? 1 : .55}}>
                  <td>
                    <div className="cr-pri">{(r.priority || r.priority === 0) && r.priority !== 99 ? (r.priority === 0 ? '\u2605' : r.priority) : '\u2014'}</div>
                  </td>
                  <td>
                    <div>
                      <div style={{fontWeight:700, fontSize:'.83rem'}}>{r.name}</div>
                      <div style={{fontSize:'.68rem', color:'#94a3b8'}}>{r.id} · {r.appliedTo}</div>
                    </div>
                  </td>
                  <td>
                    <span className="cr-cat-badge">{r.category}</span>
                  </td>
                  <td>
                    <span className={`cr-type-badge cr-type-badge--${r.type||'percentage'}`}>
                      {(r.type||'') === 'percentage' ? '%' : '\u20B9'} {r.type ? r.type[0].toUpperCase()+r.type.slice(1) : '—'}
                    </span>
                  </td>
                  <td className="vm-bo">{r.type==='percentage' ? `${r.value}%` : fmt(r.value)}</td>
                  <td className="vm-mu">{fmt(r.minOrder)}</td>
                  <td className="vm-mu">{r.maxCap ? fmt(r.maxCap) : '\u2014'}</td>
                  <td>
                    <span className={`cr-bool ${r.gst ? 'cr-bool--yes' : 'cr-bool--no'}`}>
                      {r.gst ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="vm-mu">{r.flatFee ? fmt(r.flatFee) : '\u2014'}</td>
                  <td>
                    <div>
                      <div style={{fontWeight:700, fontSize:'.82rem', color: (r.revenue||0)>0?'#0f172a':'#94a3b8'}}>{(r.revenue||0) > 0 ? fmt(r.revenue) : '\u2014'}</div>
                      {(r.revenue||0) > 0 && (
                        <div className="cr-mini-bar">
                          <div className="cr-mini-bar__fill" style={{width:`${Math.round(((r.revenue||0)/maxRev)*100)}%`}}/>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <button className={`cr-toggle ${r.active ? 'cr-toggle--on' : 'cr-toggle--off'}`} onClick={() => toggle(r.id)}>
                      <span className="cr-toggle__knob"/>
                    </button>
                  </td>
                  <td className="vm-td-r">
                    <div className="vm-acts">
                      <button className="vm-ib vm-ib--edit" onClick={() => openEdit(r)}><Icon name="Edit2" size={13}/></button>
                      <button className="vm-ib vm-ib--del"  onClick={() => del(r.id)}><Icon name="Trash2" size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="vm-card">
        <p className="vm-sh__title" style={{marginBottom:4}}>Revenue by Commission Rule</p>
        <p className="vm-sh__sub" style={{marginBottom:16}}>Current month earnings per rule</p>
        <div className="vm-stat-list">
          {rules.filter(r=>(r.revenue||0)>0).sort((a,b)=>(b.revenue||0)-(a.revenue||0)).map((r,i) => (
            <div key={i}>
              <div className="vm-sbar__head">
                <span className="vm-sbar__lbl">{r.name}</span>
                <span className="vm-sbar__val">{fmt(r.revenue)}</span>
              </div>
              <div className="vm-sbar__track">
                <div className="vm-sbar__fill" style={{width:`${Math.round(((r.revenue||0)/maxRev)*100)}%`, background:'#E03E1A'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="vm-overlay" onClick={() => { if (!saving) setModal(null); }}>
          <div className="vm-modal cr-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">{modal === 'new' ? 'New Commission Rule' : 'Edit Rule'}</p>
                <p className="vm-modal__sub">{form.id || 'New'}</p>
              </div>
              <button className="vm-ib vm-ib--view" onClick={() => { if (!saving) setModal(null); }}><Icon name="X" size={14}/></button>
            </div>
            <div className="cr-form">
              <div className="cr-form-row">
                <label className="cr-label">Rule Name</label>
                <input className="cr-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Electronics Base"/>
              </div>
              <div className="cr-form-2col">
                <div>
                  <label className="cr-label">Category</label>
                  <select className="cr-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {['Electronics','Fashion','Books','Grocery','Beauty','Furniture','Sports','All'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="cr-label">Type</label>
                  <select className="cr-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Fee (₹)</option>
                  </select>
                </div>
              </div>
              <div className="cr-form-2col">
                <div>
                  <label className="cr-label">Rate {form.type==='percentage'?'(%)':'(₹)'}</label>
                  <input className="cr-input" type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:+e.target.value}))}/>
                </div>
                <div>
                  <label className="cr-label">Flat Fee (₹)</label>
                  <input className="cr-input" type="number" value={form.flatFee} onChange={e=>setForm(f=>({...f,flatFee:+e.target.value}))}/>
                </div>
              </div>
              <div className="cr-form-2col">
                <div>
                  <label className="cr-label">Min Order (₹)</label>
                  <input className="cr-input" type="number" value={form.minOrder} onChange={e=>setForm(f=>({...f,minOrder:+e.target.value}))}/>
                </div>
                <div>
                  <label className="cr-label">Max Cap (₹, blank=none)</label>
                  <input className="cr-input" type="number" value={form.maxCap || ''} onChange={e=>setForm(f=>({...f,maxCap:e.target.value?+e.target.value:null}))}/>
                </div>
              </div>
              <div className="cr-form-row cr-checkrow">
                <label className="cr-label">Apply GST on Commission (18%)</label>
                <button className={`cr-toggle ${form.gst?'cr-toggle--on':'cr-toggle--off'}`} onClick={()=>setForm(f=>({...f,gst:!f.gst}))}>
                  <span className="cr-toggle__knob"/>
                </button>
              </div>
              <div className="cr-form-row cr-checkrow">
                <label className="cr-label">Rule Active</label>
                <button className={`cr-toggle ${form.active?'cr-toggle--on':'cr-toggle--off'}`} onClick={()=>setForm(f=>({...f,active:!f.active}))}>
                  <span className="cr-toggle__knob"/>
                </button>
              </div>
              <div className="vm-modal__acts">
                <button className="vm-btn vm-btn--outline" style={{flex:1}} onClick={()=>{ if (!saving) setModal(null); }} disabled={saving}>Cancel</button>
                <button className="vm-btn vm-btn--primary" style={{flex:1}} onClick={save} disabled={saving}>
                  <Icon name={modal==='new'?'Plus':'Check'} size={13} color="#fff"/>
                  {saving ? 'Saving...' : (modal==='new' ? 'Create Rule' : 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
