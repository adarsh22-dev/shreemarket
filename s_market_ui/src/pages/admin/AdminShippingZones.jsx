import React, { useState, useEffect } from 'react';
import { getShippingZones, createShippingZone, updateShippingZone, deleteShippingZone } from '../../api/api';
import { MapPin, Plus, Edit2, Trash2, Globe } from 'lucide-react';
import './AdminShippingZones.css';
import toast from 'react-hot-toast';

const AdminShippingZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', regions: '', deliveryType: 'STANDARD', baseRate: 0,
    ratePerKg: 0, freeShippingAbove: 0, estimatedDaysMin: 3, estimatedDaysMax: 7, isActive: true
  });

  useEffect(() => { loadZones(); }, []);

  const loadZones = async () => {
    try {
      const data = await getShippingZones();
      setZones(data || []);
    } catch { toast.error('Failed to load zones'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', regions: '', deliveryType: 'STANDARD', baseRate: 0, ratePerKg: 0, freeShippingAbove: 0, estimatedDaysMin: 3, estimatedDaysMax: 7, isActive: true });
    setShowModal(true);
  };

  const openEdit = (zone) => {
    setEditing(zone);
    setForm({ ...zone, regions: Array.isArray(zone.regions) ? zone.regions.join(', ') : zone.regions });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const data = { ...form, regions: form.regions };
      if (editing) {
        await updateShippingZone(editing.id, data);
        toast.success('Zone updated');
      } else {
        await createShippingZone(data);
        toast.success('Zone created');
      }
      setShowModal(false);
      loadZones();
    } catch { toast.error('Failed to save zone'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this shipping zone?')) return;
    try { await deleteShippingZone(id); toast.success('Zone deleted'); loadZones(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="sz-loading">Loading shipping zones...</div>;

  return (
    <div className="sz-root">
      <div className="sz-header">
        <div className="sz-header-left">
          <h1 className="sz-title">
            <MapPin className="sz-title-icon" size={24} />
            Shipping Zones
          </h1>
          <p className="sz-subtitle">Manage zone-based shipping rates and delivery rules</p>
        </div>
        <button onClick={openCreate} className="sz-add-btn">
          <Plus size={18} /> Add Zone
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="sz-empty">
          <Globe size={48} className="sz-empty-icon" />
          <p className="sz-empty-title">No shipping zones configured yet</p>
          <p className="sz-empty-sub">Create your first zone to start managing shipping rates</p>
        </div>
      ) : (
        <div className="sz-table-wrap">
          <table className="sz-table">
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Delivery Type</th>
                <th>Base Rate</th>
                <th>Rate Per Kg</th>
                <th>Free Above</th>
                <th>Est. Days</th>
                <th>Status</th>
                <th className="sz-th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.id}>
                  <td className="sz-name-cell">{z.name}</td>
                  <td><span className="sz-badge">{z.deliveryType}</span></td>
                  <td>₹{z.baseRate}</td>
                  <td>₹{z.ratePerKg}</td>
                  <td>{z.freeShippingAbove ? `₹${z.freeShippingAbove}` : '—'}</td>
                  <td>{z.estimatedDaysMin}–{z.estimatedDaysMax}</td>
                  <td>
                    <span className={`sz-status ${z.isActive ? 'sz-status--active' : 'sz-status--inactive'}`}>
                      <span className="sz-status-dot" />
                      {z.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="sz-actions">
                      <button className="sz-action-btn" onClick={() => openEdit(z)} title="Edit"><Edit2 size={14} /></button>
                      <button className="sz-action-btn sz-action-btn--delete" onClick={() => handleDelete(z.id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="sz-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sz-modal" onClick={e => e.stopPropagation()}>
            <h2 className="sz-modal-title">{editing ? 'Edit Zone' : 'Create Zone'}</h2>
            <div className="sz-form">
              <div className="sz-field">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Zone name" />
              </div>
              <div className="sz-field">
                <label>Regions (comma separated)</label>
                <input value={form.regions} onChange={e => setForm({...form, regions: e.target.value})} placeholder="e.g. Maharashtra, Gujarat, Delhi" />
              </div>
              <div className="sz-form-row">
                <div className="sz-field">
                  <label>Delivery Type</label>
                  <select value={form.deliveryType} onChange={e => setForm({...form, deliveryType: e.target.value})}>
                    <option>STANDARD</option>
                    <option>EXPRESS</option>
                    <option>SAME_DAY</option>
                  </select>
                </div>
                <div className="sz-field">
                  <label>Base Rate (₹)</label>
                  <input type="number" value={form.baseRate} onChange={e => setForm({...form, baseRate: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="sz-form-row-3">
                <div className="sz-field">
                  <label>Rate/Kg (₹)</label>
                  <input type="number" value={form.ratePerKg} onChange={e => setForm({...form, ratePerKg: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="sz-field">
                  <label>Free Above (₹)</label>
                  <input type="number" value={form.freeShippingAbove} onChange={e => setForm({...form, freeShippingAbove: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="sz-field">
                  <label>Est. Days</label>
                  <input type="text" value={`${form.estimatedDaysMin}–${form.estimatedDaysMax}`} onChange={e => {
                    const parts = e.target.value.split(/[–-]/);
                    setForm({...form, estimatedDaysMin: parseInt(parts[0]) || 3, estimatedDaysMax: parseInt(parts[1]) || 7 });
                  }} placeholder="3-7" />
                </div>
              </div>
              <div className="sz-field sz-field--checkbox">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} id="sz-active" />
                <label htmlFor="sz-active">Active</label>
              </div>
            </div>
            <div className="sz-modal-actions">
              <button className="sz-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="sz-btn-save" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShippingZones;
