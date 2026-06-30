import React, { useState } from 'react';
import './CommissionSettings.css';
import { Icon, fmt } from './VendorShared';

const CATS = [];
const SPECIAL = [];

export default function CommissionSettings() {
  const [cats,   setCats]   = useState(CATS);
  const [editId, setEditId] = useState(null);
  const [ev,     setEv]     = useState({});
  const [special, setSpecial] = useState(SPECIAL);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newCat, setNewCat] = useState({name:'', icon:'Tag', color:'#475569', rate:8, gst:18, flat:0, minPay:200});
  const [newVendor, setNewVendor] = useState({vendor:'', rate:8, reason:'', expiry:'31 Dec 2025', color:'#2563eb'});

  const startEdit = c => { setEditId(c.id); setEv({rate:c.rate, gst:c.gst, flat:c.flat, minPay:c.minPay}); };
  const saveEdit  = id => {
    setCats(p => p.map(c => c.id === id ? {...c, ...ev, rate:+ev.rate, gst:+ev.gst, flat:+ev.flat, minPay:+ev.minPay} : c));
    setEditId(null);
  };

  const addCategory = () => {
    const newId = Math.max(...cats.map(c => c.id), 0) + 1;
    setCats(p => [...p, {...newCat, id:newId, rev:0}]);
    setNewCat({name:'', icon:'Tag', color:'#475569', rate:8, gst:18, flat:0, minPay:200});
    setShowAddCat(false);
  };

  const addVendorRate = () => {
    const newId = Math.max(...special.map(s => s.id), 0) + 1;
    setSpecial(p => [...p, {...newVendor, id:newId}]);
    setNewVendor({vendor:'', rate:8, reason:'', expiry:'31 Dec 2025', color:'#2563eb'});
    setShowAddVendor(false);
  };

  const deleteVendor = id => {
    setSpecial(p => p.filter(s => s.id !== id));
  };

  const totalRev = cats.reduce((s, c) => s + c.rev, 0);
  const avgRate  = (cats.reduce((s, c) => s + c.rate, 0) / cats.length).toFixed(1);
  const maxRev   = Math.max(...cats.map(c => c.rev));

  return (
    <div className="vm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Commission Settings</h2>
          <p className="vm-hdr__sub">Configure platform commission rates by category and vendor</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => {
            setCats(CATS);
            setSpecial(SPECIAL);
            toast.success('Defaults restored');
          }}><Icon name="RefreshCw" size={13} color="#475569"/>Reset Defaults</button>
          <button className="vm-btn vm-btn--primary" onClick={() => {
            toast.success('All changes saved');
          }}><Icon name="Save" size={13} color="#fff"/>Save All Changes</button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          {label:'Total Commission Revenue', value: fmt(totalRev), trend:'+18.2%', up:true,  icon:'DollarSign', c:'#16a34a', bg:'#dcfce7'},
          {label:'Avg Commission Rate',      value: `${avgRate}%`, trend:'+0.3%',  up:true,  icon:'Percent',    c:'#2563eb', bg:'#dbeafe'},
          {label:'Active Categories',        value: '8',           trend:'+1',     up:true,  icon:'Tag',        c:'#7c3aed', bg:'#ede9fe'},
          {label:'Special Rate Vendors',     value: '3',           trend:'0',      up:true,  icon:'Settings',   c:'#d97706', bg:'#fef3c7'},
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background: k.bg}}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
              </div>
              <span className={`vm-kpi__trend vm-kpi__trend--${k.up ? 'up' : 'dn'}`}>{k.up ? '↑' : '↓'} {k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vm-alert vm-alert--info">
        <Icon name="Info" size={15} color="#1d4ed8"/>
        <div className="vm-alert__text">
          Commission rates apply per order at checkout. GST is collected on commission only (not on order total).
          Flat fee is charged per transaction in addition to the percentage commission.
        </div>
      </div>

      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Category Commission Rates</p>
            <p className="vm-sh__sub">Click the edit icon to modify any category inline</p>
          </div>
          <div className="vm-sh__right">
            <button className="vm-btn vm-btn--primary vm-btn--sm" onClick={() => setShowAddCat(!showAddCat)}>
              <Icon name="Plus" size={12} color="#fff"/>Add Category
            </button>
          </div>
        </div>

        {showAddCat && (
          <div className="vm-add-form" style={{padding:'16px', background:'#f8fafc', border:'1px solid #e8ecf0', borderRadius:'8px', marginBottom:'16px'}}>
            <p style={{fontWeight:700, fontSize:'.9rem', margin:'0 0 12px', color:'#0f172a'}}>Add New Category</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
              <div>
                <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Category Name</label>
                <input className="vm-input" type="text" placeholder="e.g., Fashion" value={newCat.name} onChange={e => setNewCat(v => ({...v, name:e.target.value}))} style={{width:'100%'}}/>
              </div>
              <div>
                <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Color</label>
                <input className="vm-input" type="color" value={newCat.color} onChange={e => setNewCat(v => ({...v, color:e.target.value}))} style={{width:'100%', height:'36px', cursor:'pointer'}}/>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:12}}>
              <div>
                <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Base Rate (%)</label>
                <input className="vm-input" type="number" value={newCat.rate} onChange={e => setNewCat(v => ({...v, rate:+e.target.value}))} style={{width:'100%'}}/>
              </div>
              <div>
                <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>GST (%)</label>
                <input className="vm-input" type="number" value={newCat.gst} onChange={e => setNewCat(v => ({...v, gst:+e.target.value}))} style={{width:'100%'}}/>
              </div>
              <div>
                <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Flat Fee (Rs.)</label>
                <input className="vm-input" type="number" value={newCat.flat} onChange={e => setNewCat(v => ({...v, flat:+e.target.value}))} style={{width:'100%'}}/>
              </div>
              <div>
                <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Min Payout (Rs.)</label>
                <input className="vm-input" type="number" value={newCat.minPay} onChange={e => setNewCat(v => ({...v, minPay:+e.target.value}))} style={{width:'100%'}}/>
              </div>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={() => setShowAddCat(false)}><Icon name="X" size={12}/>Cancel</button>
              <button className="vm-btn vm-btn--success vm-btn--sm" onClick={addCategory} disabled={!newCat.name}><Icon name="Plus" size={12} color="#fff"/>Add Category</button>
            </div>
          </div>
        )}

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Category</th>
                <th>Base Rate (%)</th>
                <th>GST on Commission (%)</th>
                <th>Flat Fee (Rs.)</th>
                <th>Min Payout (Rs.)</th>
                <th>Revenue This Month</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="vm-cat-cell">
                      <div className="vm-cat-icon" style={{background: `${c.color}15`}}>
                        <Icon name={c.icon} size={15} color={c.color} sw={1.8}/>
                      </div>
                      <span style={{fontWeight:700, fontSize:'.86rem'}}>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    {editId === c.id
                      ? <input className="vm-input" style={{width:70}} type="number" value={ev.rate} onChange={e => setEv(v => ({...v, rate: e.target.value}))}/>
                      : <span className="vm-rate-val">{c.rate}%</span>}
                  </td>
                  <td>
                    {editId === c.id
                      ? <input className="vm-input" style={{width:70}} type="number" value={ev.gst} onChange={e => setEv(v => ({...v, gst: e.target.value}))}/>
                      : <span className="vm-mu">{c.gst}%</span>}
                  </td>
                  <td>
                    {editId === c.id
                      ? <input className="vm-input" style={{width:70}} type="number" value={ev.flat} onChange={e => setEv(v => ({...v, flat: e.target.value}))}/>
                      : <span className="vm-mu">{c.flat > 0 ? `Rs.${c.flat}` : '—'}</span>}
                  </td>
                  <td>
                    {editId === c.id
                      ? <input className="vm-input" style={{width:80}} type="number" value={ev.minPay} onChange={e => setEv(v => ({...v, minPay: e.target.value}))}/>
                      : <span className="vm-mu">Rs.{c.minPay}</span>}
                  </td>
                  <td>
                    <div>
                      <div style={{fontWeight:700, fontSize:'.84rem'}}>{fmt(c.rev)}</div>
                      <div className="vm-rev-bar-track">
                        <div className="vm-rev-bar-fill" style={{width: `${(c.rev / maxRev) * 100}%`, background: c.color}}/>
                      </div>
                    </div>
                  </td>
                  <td className="vm-td-r">
                    <div className="vm-acts">
                      {editId === c.id ? (
                        <>
                          <button className="vm-btn vm-btn--success vm-btn--sm" onClick={() => saveEdit(c.id)}>
                            <Icon name="Check" size={12} color="#16a34a"/>Save
                          </button>
                          <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={() => setEditId(null)}>
                            <Icon name="X" size={12} color="#475569"/>Cancel
                          </button>
                        </>
                      ) : (
                        <button className="vm-ib vm-ib--edit" onClick={() => startEdit(c)}>
                          <Icon name="Edit2" size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="vm-2col" style={{alignItems:'start'}}>
        <div className="vm-card">
          <div className="vm-sh">
            <div>
              <p className="vm-sh__title">Special Vendor Rates</p>
              <p className="vm-sh__sub">Custom commission overrides for specific vendors</p>
            </div>
            <div className="vm-sh__right">
              <button className="vm-btn vm-btn--primary vm-btn--sm" onClick={() => setShowAddVendor(!showAddVendor)}><Icon name="Plus" size={12} color="#fff"/>Add</button>
            </div>
          </div>

          {showAddVendor && (
            <div className="vm-add-form" style={{padding:'16px', background:'#f8fafc', border:'1px solid #e8ecf0', borderRadius:'8px', marginBottom:'16px'}}>
              <p style={{fontWeight:700, fontSize:'.9rem', margin:'0 0 12px', color:'#0f172a'}}>Add Special Vendor Rate</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
                <div>
                  <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Vendor Name</label>
                  <input className="vm-input" type="text" placeholder="e.g., TechZone Electronics" value={newVendor.vendor} onChange={e => setNewVendor(v => ({...v, vendor:e.target.value}))} style={{width:'100%'}}/>
                </div>
                <div>
                  <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Commission Rate (%)</label>
                  <input className="vm-input" type="number" step="0.5" value={newVendor.rate} onChange={e => setNewVendor(v => ({...v, rate:+e.target.value}))} style={{width:'100%'}}/>
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
                <div>
                  <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Reason</label>
                  <input className="vm-input" type="text" placeholder="e.g., Exclusive partnership" value={newVendor.reason} onChange={e => setNewVendor(v => ({...v, reason:e.target.value}))} style={{width:'100%'}}/>
                </div>
                <div>
                  <label style={{fontSize:'.75rem', fontWeight:600, color:'#475569', marginBottom:4, display:'block'}}>Expiry Date</label>
                  <input className="vm-input" type="text" placeholder="e.g., 31 Dec 2025" value={newVendor.expiry} onChange={e => setNewVendor(v => ({...v, expiry:e.target.value}))} style={{width:'100%'}}/>
                </div>
              </div>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={() => setShowAddVendor(false)}><Icon name="X" size={12}/>Cancel</button>
                <button className="vm-btn vm-btn--success vm-btn--sm" onClick={addVendorRate} disabled={!newVendor.vendor}><Icon name="Plus" size={12} color="#fff"/>Add Rate</button>
              </div>
            </div>
          )}

          <div className="vm-col vm-g10">
            {special.map(r => (
              <div key={r.id} className="vm-special-row">
                <div className="vm-special-icon" style={{background: `${r.color}15`}}>
                  <Icon name="Tag" size={16} color={r.color}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:'.86rem', color:'#0f172a'}}>{r.vendor}</div>
                  <div style={{fontSize:'.71rem', color:'#94a3b8', marginTop:1}}>{r.reason} · Expires {r.expiry}</div>
                </div>
                <div style={{fontWeight:800, fontSize:'1.15rem', color:r.color, flexShrink:0}}>{r.rate}%</div>
                <button className="vm-ib vm-ib--edit"><Icon name="Edit2" size={13}/></button>
                <button className="vm-ib vm-ib--del" onClick={() => deleteVendor(r.id)}><Icon name="Trash2" size={13}/></button>
              </div>
            ))}
            <div className="vm-alert vm-alert--warn vm-mt8">
              <Icon name="AlertTriangle" size={15} color="#92400e"/>
              <div className="vm-alert__text">Special rates override the category base rate for the specified vendor until the expiry date.</div>
            </div>
          </div>
        </div>

        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Revenue by Category</p>
          <p className="vm-sh__sub"  style={{marginBottom:16}}>Commission earned this month</p>
          <div className="vm-stat-list">
            {[...cats].sort((a, b) => b.rev - a.rev).map((c, i) => (
              <div key={i}>
                <div className="vm-sbar__head">
                  <span className="vm-sbar__lbl">{c.name}</span>
                  <span className="vm-sbar__val">{fmt(c.rev)}</span>
                </div>
                <div className="vm-sbar__track">
                  <div className="vm-sbar__fill" style={{width: `${(c.rev / maxRev) * 100}%`, background: c.color}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="vm-divider"/>
          <div className="vm-irow">
            <span className="vm-irow__lbl">Total this month</span>
            <span className="vm-irow__val" style={{color:'#E03E1A', fontSize:'.95rem'}}>{fmt(totalRev)}</span>
          </div>
          <div className="vm-irow">
            <span className="vm-irow__lbl">Platform avg rate</span>
            <span className="vm-irow__val">{avgRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
