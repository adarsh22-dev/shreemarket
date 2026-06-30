import React, { useState, useEffect } from 'react';
import './AdminProductBundles.css';
import { getAllBundles, createBundle, updateBundle, deleteBundle } from '../../api/api';
import { Package, Plus, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProductBundles = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', discountPercent: 10, status: 'ACTIVE' });

  useEffect(() => { loadBundles(); }, []);

  const loadBundles = async () => {
    try { const data = await getAllBundles(); setBundles(data || []); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', discountPercent: 10, status: 'ACTIVE' });
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ name: b.name, description: b.description || '', discountPercent: b.discountPercent, status: b.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) { await updateBundle(editing.id, form); toast.success('Updated'); }
      else { await createBundle(form); toast.success('Created'); }
      setShowModal(false);
      loadBundles();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product bundle?')) return;
    try { await deleteBundle(id); toast.success('Deleted'); loadBundles(); }
    catch { toast.error('Failed to delete'); }
  };

  const stats = {
    total: bundles.length,
    active: bundles.filter(b => b.status === 'ACTIVE').length,
    inactive: bundles.filter(b => b.status === 'INACTIVE').length,
  };

  if (loading) return <div className="pb"><div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading...</div></div>;

  return (
    <div className="pb">
      <div className="pb-hdr">
        <div>
          <h1 className="pb-hdr__t"><Package size={20} style={{ color: '#E03E1A' }} /> Product Bundles</h1>
          <p className="pb-hdr__s">Create and manage product bundles with discounts</p>
        </div>
        <button className="pb-btn pb-btn--pri" onClick={openCreate}>
          <Plus size={15} /> New Bundle
        </button>
      </div>

      <div className="pb-kpis">
        {[
          { icon: Package, val: stats.total, lbl: 'Total Bundles', bg: '#f0f9ff', c: '#2563eb' },
          { icon: Package, val: stats.active, lbl: 'Active', bg: '#f0fdf4', c: '#16a34a' },
          { icon: Package, val: stats.inactive, lbl: 'Inactive', bg: '#f1f5f9', c: '#64748b' },
        ].map((k, i) => (
          <div key={i} className="pb-kpi">
            <div className="pb-kpi__icon" style={{ background: k.bg }}><k.icon size={18} color={k.c} /></div>
            <div><div className="pb-kpi__val">{k.val}</div><div className="pb-kpi__lbl">{k.lbl}</div></div>
          </div>
        ))}
      </div>

      {bundles.length === 0 ? (
        <div className="pb-empty">
          <Package size={48} className="pb-empty__icon" />
          <p className="pb-empty__txt">No product bundles yet</p>
        </div>
      ) : (
        <div className="pb-card">
          <div className="pb-tw">
            <table className="pb-tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Discount</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="pb-th-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight:600, color:'#0f172a' }}>{b.name}</td>
                    <td style={{ color:'#64748b', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.description || 'No description'}</td>
                    <td style={{ fontWeight:700, color:'#E03E1A' }}>{b.discountPercent}% off</td>
                    <td>{b.productCount || 0}</td>
                    <td><span className={`pb-bdg pb-bdg--${(b.status || 'active').toLowerCase()}`}>{b.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                        <button className="pb-btn pb-btn--out" onClick={() => openEdit(b)}><Edit2 size={13} /> Edit</button>
                        <button className="pb-btn pb-btn--dan" onClick={() => handleDelete(b.id)}><X size={13} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="pb-overlay" onClick={() => setShowModal(false)}>
          <div className="pb-modal" onClick={e => e.stopPropagation()}>
            <div className="pb-modal__hdr">
              <h2>{editing ? 'Edit' : 'New'} Bundle</h2>
              <button className="pb-modal__close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="pb-modal__body">
              <div className="pb-field">
                <label>Bundle Name</label>
                <input className="pb-inp" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Essentials" />
              </div>
              <div className="pb-field">
                <label>Description</label>
                <textarea className="pb-inp pb-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this bundle..." />
              </div>
              <div className="pb-fgrid">
                <div className="pb-field">
                  <label>Discount (%)</label>
                  <input className="pb-inp" type="number" min={0} max={100} value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="pb-field">
                  <label>Status</label>
                  <select className="pb-inp" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pb-modal__ftr">
              <button className="pb-btn pb-btn--out" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="pb-btn pb-btn--pri" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductBundles;
