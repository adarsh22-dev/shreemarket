import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './TierSystem.css';
import { Icon, initials, avatarBg, fmt } from './VendorShared';
import { getTiers, updateTier, createTier, deleteTier, getVendors, recalculateAllTiers } from '../../api/api';

const PER = 6;

export default function TierSystem() {
  const [tiers, setTiers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTier, setEditTier] = useState(null);
  const [tierForm, setTierForm] = useState({ discount: 0, minRating: 0, perks: [] });
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', color: '#6366f1', bg: '#eef2ff', minSales: 0, maxSales: 0, minRating: 0, discount: 0, perks: [], icon: 'Award' });

  useEffect(() => {
    Promise.all([getTiers(), getVendors('', 0, 100)])
      .then(([tierData, vendorData]) => {
        const items = Array.isArray(tierData) ? tierData : [];
        setTiers(items);
        const list = vendorData?.content || (Array.isArray(vendorData) ? vendorData : []);
        setVendors(list);
      })
      .catch(() => toast.error('Failed to load tier data'))
      .finally(() => setLoading(false));
  }, []);

  const tierOf = t => tiers.find(x => x.id === t);

  const totalVendors = vendors.length;

  const tierVendorCounts = {};
  tiers.forEach(t => {
    tierVendorCounts[t.id] = vendors.filter(v => v.tier === t.id).length;
  });

  const parsePerks = (p) => {
    if (!p) return [];
    if (Array.isArray(p)) return p;
    try { return JSON.parse(p); } catch { return []; }
  };

  const list = vendors.filter(v => filter === 'All' || v.tier === filter);
  const pages = Math.ceil(list.length / PER) || 1;
  const slice = list.slice(page * PER, (page + 1) * PER);

  const openEditModal = (tier) => {
    setEditTier(tier);
    setTierForm({
      discount: tier.discount || 0,
      minRating: tier.minRating || 0,
      perks: parsePerks(tier.perks)
    });
    setShowEditModal(true);
  };

  const saveTierChanges = async () => {
    if (!editTier) return;
    setSaving(true);
    try {
      const updated = { ...editTier, discount: tierForm.discount, minRating: tierForm.minRating, perks: JSON.stringify(tierForm.perks) };
      await updateTier(updated);
      const refreshed = await getTiers();
      setTiers(Array.isArray(refreshed) ? refreshed : []);
      setShowEditModal(false);
    } catch (e) {
      toast.error('Save failed: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTier = async () => {
    setSaving(true);
    try {
      await createTier({ ...createForm, perks: JSON.stringify(createForm.perks) });
      const refreshed = await getTiers();
      setTiers(Array.isArray(refreshed) ? refreshed : []);
      setShowCreateModal(false);
      setCreateForm({ name: '', color: '#6366f1', bg: '#eef2ff', minSales: 0, maxSales: 0, minRating: 0, discount: 0, perks: [], icon: 'Award' });
      toast.success('Tier created');
    } catch (e) {
      toast.error('Create failed: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (tier) => {
    if (!window.confirm(`Delete "${tier.name}" tier? This cannot be undone.`)) return;
    try {
      await deleteTier(tier.id);
      const refreshed = await getTiers();
      setTiers(Array.isArray(refreshed) ? refreshed : []);
      toast.success(`"${tier.name}" deleted`);
    } catch (e) {
      toast.error('Delete failed: ' + (e.message || e));
    }
  };

  const recalculateTiers = async () => {
    if (vendors.length === 0) return;
    try {
      const result = await recalculateAllTiers();
      const count = result?.updated || 0;
      const [tierData, vendorData] = await Promise.all([getTiers(), getVendors('', 0, 100)]);
      setTiers(Array.isArray(tierData) ? tierData : []);
      const list = vendorData?.content || (Array.isArray(vendorData) ? vendorData : []);
      setVendors(list);
      setPage(0);
      setFilter('All');
      toast.success(`${count} vendor${count !== 1 ? 's' : ''} tier${count !== 1 ? 's' : ''} updated`);
    } catch (e) {
      toast.error('Recalculation failed: ' + (e.message || e));
    }
  };

  if (loading) {
    return (
      <div className="vm">
        <div className="vm-hdr"><h2 className="vm-hdr__title">Tier System</h2></div>
        <div className="vm-card" style={{ textAlign: 'center', padding: '3rem' }}><p>Loading tiers...</p></div>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="vm">
        <div className="vm-hdr"><h2 className="vm-hdr__title">Tier System</h2></div>
        <div className="vm-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Icon name="Award" size={40} color="#94a3b8"/>
          <p style={{ marginTop: 16, fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>No tiers configured yet</p>
          <p style={{ fontSize: '.85rem', color: '#94a3b8', marginTop: 4 }}>Tiers will appear here once they are set up in the backend.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Tier System</h2>
          <p className="vm-hdr__sub">Vendor loyalty tiers with perks, discounts and performance thresholds</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => setShowCreateModal(true)}>
            <Icon name="Plus" size={13} color="#475569"/>Create Tier
          </button>
          {tiers.length > 0 && (
            <button className="vm-btn vm-btn--outline" onClick={() => openEditModal(tiers[0])}>
              <Icon name="Edit2" size={13} color="#475569"/>Edit Tiers
            </button>
          )}
          <button className="vm-btn vm-btn--primary" onClick={recalculateTiers} disabled={vendors.length === 0}>
            <Icon name="RefreshCw" size={13} color="#fff"/>Recalculate
          </button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          {label:'Total Vendors', value: totalVendors, icon:'Users', c:'#2563eb', bg:'#dbeafe'},
          {label:'Bronze Vendors', value: tierVendorCounts['bronze'] || 0, icon:'Award', c:'#7c3aed', bg:'#ede9fe'},
          {label:'Silver Vendors', value: tierVendorCounts['silver'] || 0, icon:'Star', c:'#d97706', bg:'#fef3c7'},
          {label:'Gold Vendors', value: tierVendorCounts['gold'] || 0, icon:'ArrowUp', c:'#16a34a', bg:'#dcfce7'},
          {label:'Platinum Vendors', value: tierVendorCounts['platinum'] || 0, icon:'Award', c:'#7c3aed', bg:'#ede9fe'},
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background: k.bg}}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
              </div>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vm-4col">
        {tiers.map(tier => (
          <div key={tier.id} className="vm-tier-card"
            style={{background: tier.bg, border: `1.5px solid ${tier.borderColor || tier.color}`}}>
            <div className="vm-tier-card__hd">
              <div className="vm-tier-card__icon" style={{background: `${tier.color}18`, border: `1px solid ${tier.color}30`}}>
                <Icon name={tier.icon || 'Award'} size={20} color={tier.color} sw={2}/>
              </div>
              <div>
                <div className="vm-tier-card__name" style={{color: tier.color}}>{tier.name}</div>
                <div className="vm-tier-card__count">{tierVendorCounts[tier.id] || 0} vendors · {totalVendors > 0 ? Math.round(((tierVendorCounts[tier.id] || 0) / totalVendors) * 100) : 0}%</div>
              </div>
            </div>

            <div className="vm-tier-card__req">
              <div className="vm-tier-card__req-lbl">Requirements</div>
              <div className="vm-tier-card__req-row">
                Sales: {tier.maxSales ? `${fmt(tier.minSales)} – ${fmt(tier.maxSales)}` : tier.minSales ? `${fmt(tier.minSales)}+` : '—'}
              </div>
              <div className="vm-tier-card__req-row">
                Rating: {tier.minRating > 0 ? `${tier.minRating} min` : 'None'}
              </div>
            </div>

            {tier.discount > 0 && (
              <div className="vm-tier-card__disc" style={{background:'rgba(255,255,255,.65)'}}>
                <Icon name="Percent" size={13} color={tier.color}/>
                <span style={{fontSize:'.77rem', fontWeight:700, color: tier.color}}>{tier.discount}% commission discount</span>
              </div>
            )}

            <div className="vm-tier-card__perks-lbl">Perks</div>
            <div className="vm-col vm-g4">
              {parsePerks(tier.perks).map((p, i) => (
                <div key={i} className="vm-tier-card__perk">
                  <Icon name="Zap" size={11} color={tier.color} sw={2}/>
                  <span>{p}</span>
                </div>
              ))}
            </div>

            <div className="vm-tier-card__bar-track">
              <div className="vm-tier-card__bar-fill"
                style={{width: `${totalVendors > 0 ? ((tierVendorCounts[tier.id] || 0) / totalVendors) * 100 : 0}%`, background: tier.color}}/>
            </div>
            <button className="vm-btn vm-btn--danger" style={{marginTop:8,width:'100%',padding:'4px 0',fontSize:'.75rem'}} onClick={() => handleDeleteTier(tier)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Vendor Tier Status</p>
            <p className="vm-sh__sub">Current tier and next-tier progress</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-pills">
              {['All', 'bronze', 'silver', 'gold', 'platinum'].map(f => (
                <button key={f} className={`vm-pill${filter === f ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f === 'All' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Tier</th>
                <th>Total Sales</th>
                <th>Rating</th>
                <th>Next Tier Progress</th>
              </tr>
            </thead>
            <tbody>
              {slice.map(v => {
                const tier = tierOf(v.tier);
                const tIdx = tiers.findIndex(t => t.id === v.tier);
                const nextT = tiers[tIdx + 1];
                const prog = nextT && nextT.minSales ? Math.min(100, Math.round(((v.sales || 0) / nextT.minSales) * 100)) : 100;
                return (
                  <tr key={v.id}>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{background: avatarBg(v.fullName || v.name)}}>{initials(v.fullName || v.name)}</div>
                        <div>
                          <div className="vm-vcell__name">{v.fullName || v.name}</div>
                          <div className="vm-vcell__sub">{v.id} · {v.city || v.storeCity || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {tier ? (
                        <span className={`vm-badge vm-badge--${v.tier}`}>
                          <span className="vm-badge__dot"/>
                          {tier.name}
                        </span>
                      ) : (
                        <span className="vm-badge">{v.tier || 'Basic'}</span>
                      )}
                    </td>
                    <td className="vm-bo">{v.sales ? fmt(v.sales) : '—'}</td>
                    <td>
                      <span style={{display:'flex', alignItems:'center', gap:4, fontSize:'.82rem', fontWeight:700, color:'#d97706'}}>
                        ★ {v.rating || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="vm-tier-prog">
                        <div className="vm-tier-prog__track">
                          <div className="vm-tier-prog__fill"
                            style={{width: `${prog}%`, background: nextT ? (tier ? tier.color : '#6366f1') : '#16a34a'}}/>
                        </div>
                        <span className="vm-tier-prog__lbl">
                          {nextT ? `${prog}% to ${nextT.name}` : 'Max tier'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{`${page * PER + 1}–${Math.min((page + 1) * PER, list.length)} of ${list.length}`}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <Icon name="ChevLeft" size={12}/>
            </button>
            <span className="vm-pag__label">{page + 1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER >= list.length}>
              <Icon name="ChevRight" size={12}/>
            </button>
          </div>
        </div>
      </div>

      <div className="vm-card">
        <p className="vm-sh__title" style={{marginBottom:4}}>Tier Distribution</p>
        <p className="vm-sh__sub" style={{marginBottom:16}}>Vendor count and % across all tiers</p>
        <div className="vm-stat-list">
          {tiers.map((t, i) => (
            <div key={i}>
              <div className="vm-sbar__head">
                <span className="vm-sbar__lbl">{t.name}</span>
                <span className="vm-sbar__val">{tierVendorCounts[t.id] || 0} vendors ({totalVendors > 0 ? Math.round(((tierVendorCounts[t.id] || 0) / totalVendors) * 100) : 0}%)</span>
              </div>
              <div className="vm-sbar__track">
                <div className="vm-sbar__fill" style={{width: `${totalVendors > 0 ? ((tierVendorCounts[t.id] || 0) / totalVendors) * 100 : 0}%`, background: t.color}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
          <div style={{background:'#fff',borderRadius:'12px',padding:'24px',maxWidth:'500px',width:'90%',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h3 style={{margin:0,fontSize:'1.25rem',fontWeight:700,color:'#0f172a'}}>Create Tier</h3>
              <button onClick={()=>setShowCreateModal(false)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px',color:'#64748b',fontSize:'24px',lineHeight:1}}>×</button>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'8px',color:'#0f172a'}}>Tier Name</label>
              <input type="text" value={createForm.name} onChange={e=>setCreateForm(p=>({...p,name:e.target.value}))}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:'6px',fontSize:'.875rem',boxSizing:'border-box'}} placeholder="e.g. Silver"/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              <div>
                <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'8px',color:'#0f172a'}}>Color</label>
                <input type="color" value={createForm.color} onChange={e=>setCreateForm(p=>({...p,color:e.target.value}))}
                  style={{width:'100%',height:'38px',border:'1px solid #cbd5e1',borderRadius:'6px',padding:'2px',cursor:'pointer'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'8px',color:'#0f172a'}}>BG Color</label>
                <input type="color" value={createForm.bg} onChange={e=>setCreateForm(p=>({...p,bg:e.target.value}))}
                  style={{width:'100%',height:'38px',border:'1px solid #cbd5e1',borderRadius:'6px',padding:'2px',cursor:'pointer'}}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              <div>
                <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'8px',color:'#0f172a'}}>Min Sales</label>
                <input type="number" min="0" value={createForm.minSales} onChange={e=>setCreateForm(p=>({...p,minSales:parseFloat(e.target.value)}))}
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:'6px',fontSize:'.875rem',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'8px',color:'#0f172a'}}>Max Sales</label>
                <input type="number" min="0" value={createForm.maxSales} onChange={e=>setCreateForm(p=>({...p,maxSales:parseFloat(e.target.value)}))}
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:'6px',fontSize:'.875rem',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              <div>
                <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'8px',color:'#0f172a'}}>Discount (%)</label>
                <input type="number" min="0" max="100" value={createForm.discount} onChange={e=>setCreateForm(p=>({...p,discount:parseFloat(e.target.value)}))}
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:'6px',fontSize:'.875rem',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'8px',color:'#0f172a'}}>Min Rating</label>
                <input type="number" min="0" max="5" step="0.1" value={createForm.minRating} onChange={e=>setCreateForm(p=>({...p,minRating:parseFloat(e.target.value)}))}
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:'6px',fontSize:'.875rem',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'.875rem',fontWeight:600,marginBottom:'12px',color:'#0f172a'}}>Perks</label>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {createForm.perks.map((perk,idx)=>(
                  <div key={idx} style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <input type="text" value={perk} onChange={e=>{const n=[...createForm.perks];n[idx]=e.target.value;setCreateForm(p=>({...p,perks:n}))}}
                      style={{flex:1,padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:'6px',fontSize:'.875rem',boxSizing:'border-box'}}/>
                    <button onClick={()=>setCreateForm(p=>({...p,perks:p.perks.filter((_,i)=>i!==idx)}))}
                      style={{padding:'6px 12px',border:'1px solid #dc2626',borderRadius:'6px',background:'#fee2e2',color:'#dc2626',cursor:'pointer',fontSize:'.75rem',fontWeight:600}}>Remove</button>
                  </div>
                ))}
                <button onClick={()=>setCreateForm(p=>({...p,perks:[...p.perks,'New perk']}))}
                  style={{padding:'8px 12px',border:'1px dashed #2563eb',borderRadius:'6px',background:'#dbeafe',color:'#2563eb',cursor:'pointer',fontSize:'.875rem',fontWeight:600}}>+ Add Perk</button>
              </div>
            </div>
            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button onClick={()=>setShowCreateModal(false)}
                style={{padding:'8px 16px',border:'1px solid #cbd5e1',borderRadius:'6px',background:'#f8fafc',cursor:'pointer',fontSize:'.875rem',fontWeight:600,color:'#475569'}}>Cancel</button>
              <button onClick={handleCreateTier} disabled={saving||!createForm.name.trim()}
                style={{padding:'8px 16px',border:'none',borderRadius:'6px',background:'#6366f1',color:'#fff',cursor:'pointer',fontSize:'.875rem',fontWeight:600,opacity:saving||!createForm.name.trim()?0.6:1}}>
                {saving?'Creating...':'Create Tier'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && editTier && (
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{margin: 0, fontSize: '1.25rem', fontWeight: 700, color: editTier.color}}>
                Edit {editTier.name} Tier
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: '#64748b', fontSize: '24px', lineHeight: 1
              }}>×</button>
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '8px', color: '#0f172a'}}>
                Commission Discount (%)
              </label>
              <input type="number" min="0" max="10" step="0.5"
                value={tierForm.discount}
                onChange={e => setTierForm(prev => ({...prev, discount: parseFloat(e.target.value)}))}
                style={{width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '.875rem', boxSizing: 'border-box'}}
              />
              <p style={{fontSize: '.75rem', color: '#64748b', marginTop: '4px'}}>Current: {tierForm.discount}%</p>
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '8px', color: '#0f172a'}}>
                Minimum Rating Requirement
              </label>
              <input type="number" min="0" max="5" step="0.1"
                value={tierForm.minRating}
                onChange={e => setTierForm(prev => ({...prev, minRating: parseFloat(e.target.value)}))}
                style={{width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '.875rem', boxSizing: 'border-box'}}
              />
              <p style={{fontSize: '.75rem', color: '#64748b', marginTop: '4px'}}>Current: {tierForm.minRating} ⭐</p>
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontSize: '.875rem', fontWeight: 600, marginBottom: '12px', color: '#0f172a'}}>Tier Perks</label>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {tierForm.perks.map((perk, idx) => (
                  <div key={idx} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input type="text" value={perk}
                      onChange={e => { const n = [...tierForm.perks]; n[idx] = e.target.value; setTierForm(p => ({...p, perks: n})); }}
                      style={{flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '.875rem', boxSizing: 'border-box'}}
                    />
                    <button onClick={() => { setTierForm(p => ({...p, perks: p.perks.filter((_, i) => i !== idx)})); }}
                      style={{padding: '6px 12px', border: '1px solid #dc2626', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600}}>
                      Remove
                    </button>
                  </div>
                ))}
                <button onClick={() => setTierForm(p => ({...p, perks: [...p.perks, 'New perk']}))}
                  style={{padding: '8px 12px', border: '1px dashed #2563eb', borderRadius: '6px', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600}}>
                  + Add Perk
                </button>
              </div>
            </div>

            <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px', marginBottom: '20px', fontSize: '.875rem', color: '#166534'}}>
              <strong>Note:</strong> Changes will be applied to this tier for all future calculations.
            </div>

            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowEditModal(false)}
                style={{padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600, color: '#475569'}}>
                Cancel
              </button>
              <button onClick={saveTierChanges} disabled={saving}
                style={{padding: '8px 16px', border: 'none', borderRadius: '6px', background: editTier.color, color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600, opacity: saving ? 0.6 : 1}}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
