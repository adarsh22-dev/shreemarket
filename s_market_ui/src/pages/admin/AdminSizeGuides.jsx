import React, { useState, useEffect } from 'react';
import { getSizeGuides, createSizeGuide, updateSizeGuide, deleteSizeGuide } from '../../api/api';
import { Plus, Edit2, Trash2, Search, Ruler } from 'lucide-react';

const EMPTY = { name: '', category: '', sizeChart: '[{"size":"S","chest":"36","waist":"30","length":"28"},{"size":"M","chest":"38","waist":"32","length":"29"}]', measurementUnit: 'inches', fitTips: '', active: true };

export default function AdminSizeGuides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setGuides(await getSizeGuides()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openNew = () => { setForm({ ...EMPTY }); setModal('new'); };
  const openEdit = (g) => { setForm({ ...g }); setModal(g); };

  const save = async () => {
    try {
      if (modal === 'new') {
        await createSizeGuide(form);
        showToast('Size guide created');
      } else {
        await updateSizeGuide(modal.id, form);
        showToast('Size guide updated');
      }
      await load();
      setModal(null);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const confirmDelete = async (g) => {
    if (!window.confirm(`Delete "${g.name}"?`)) return;
    try {
      await deleteSizeGuide(g.id);
      await load();
      showToast('Size guide deleted', 'error');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const filtered = guides.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="nl">
      {toast && <div className="nl-toast" style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:toast.type==='error'?'#fee2e2':'#f0fdf4',color:toast.type==='error'?'#dc2626':'#16a34a',padding:'10px 18px',borderRadius:10,fontWeight:600,zIndex:2000}}>{toast.msg}</div>}

      <div className="nl-hdr">
        <div>
          <h2 className="nl-hdr__title">Size & Fit Guides</h2>
          <p className="nl-hdr__sub">Manage size charts and fit tips for product categories</p>
        </div>
        <button className="vm-btn vm-btn--primary" onClick={openNew}><Plus size={13} color="#fff" /> New Size Guide</button>
      </div>

      <div className="nl-card">
        <div className="nl-toolbar" style={{ marginBottom: 12 }}>
          <div className="nl-search">
            <Search size={14} color="#94a3b8" />
            <input className="nl-search__inp" placeholder="Search guides..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="ad-state"><div className="ad-spinner" />Loading...</div> : (
          <div className="nl-tw">
            <table className="nl-tbl">
              <thead>
                <tr><th>Name</th><th>Category</th><th>Unit</th><th>Active</th><th className="nl-th-r">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No size guides found.</td></tr>
                )}
                {filtered.map(g => (
                  <tr key={g.id}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Ruler size={14} color="#E03E1A" /><span className="nl-bold">{g.name}</span></div></td>
                    <td><span className="nl-list-badge">{g.category || '—'}</span></td>
                    <td>{g.measurementUnit || 'inches'}</td>
                    <td><span className={`mk-badge`} style={{background: g.active ? '#dcfce7' : '#f1f5f9', color: g.active ? '#16a34a' : '#64748b'}}>{g.active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="nl-acts">
                        <button className="vm-ib vm-ib--edit" onClick={() => openEdit(g)}><Edit2 size={12} /></button>
                        <button className="vm-ib vm-ib--del" onClick={() => confirmDelete(g)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="mk-overlay" onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="mk-modal__hdr">
              <h3>{modal === 'new' ? 'New Size Guide' : 'Edit Size Guide'}</h3>
              <button className="mk-modal__close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="mk-modal__body">
              <div className="mk-fgrid">
                <div className="mk-frow"><label>Name</label><input className="mk-inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Men's T-Shirts" /></div>
                <div className="mk-frow"><label>Category</label><input className="mk-inp" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Fashion" /></div>
                <div className="mk-frow"><label>Measurement Unit</label>
                  <select className="mk-inp" value={form.measurementUnit} onChange={e => setForm(f => ({ ...f, measurementUnit: e.target.value }))}>
                    <option value="inches">Inches</option>
                    <option value="cm">Centimeters</option>
                  </select>
                </div>
                <div className="mk-frow"><label>Fit Tips</label><textarea className="mk-inp" rows={2} value={form.fitTips} onChange={e => setForm(f => ({ ...f, fitTips: e.target.value }))} placeholder="e.g. Regular fit, true to size" /></div>
                <div className="mk-frow"><label>Active</label>
                  <label className="ad-switch"><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /><span className="ad-slider" /></label>
                </div>
                <div className="mk-frow" style={{ gridColumn: '1 / -1' }}><label>Size Chart (JSON)</label>
                  <textarea className="mk-inp" rows={6} value={form.sizeChart} onChange={e => setForm(f => ({ ...f, sizeChart: e.target.value }))} style={{ fontFamily: 'monospace', fontSize: '.78rem' }} />
                </div>
              </div>
            </div>
            <div className="mk-modal__ftr">
              <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="vm-btn vm-btn--primary" onClick={save}><Plus size={13} color="#fff" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
