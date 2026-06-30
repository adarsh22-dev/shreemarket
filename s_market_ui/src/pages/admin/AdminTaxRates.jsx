import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { getTaxRates, createTaxRate, updateTaxRate, toggleTaxRateStatus, deleteTaxRate } from '../../api/api';
import './AdminTaxRates.css';

const Ico = ({ d, size = 14, color = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const ICONS = {
  edit:  ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash: ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M10 11v6M14 11v6','M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  plus:  ['M12 5v14M5 12h14'],
  toggle:['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  tag:   'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  perc:  'M14.12 14.12L9.88 9.88M9.88 14.12l4.24-4.24',
  star:  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  info:  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01',
  split: ['M5 5l14 14M13 5h6v6M5 13h6v6'],
};

const ListIcon = ({ d, bg }) => (
  <div className="tr-list-icon" style={{ background: bg || '#e0e7ff' }}>
    <Ico d={d} size={18} color={bg ? '#fff' : '#6366f1'}/>
  </div>
);

const GST_COLORS = ['#16a34a', '#2563eb', '#d97706', '#E03E1A', '#7c3aed'];
const GST_LABELS = ['0% (Exempted)', '5% (Essential)', '12% (Standard)', '18% (Standard)', '28% (Luxury)'];

const TAX_TYPES = ['GST', 'IGST', 'CESS'];

const blankForm = () => ({
  name: '', rate: '', taxType: 'GST', hsnCode: '', description: '',
  applicableCategories: 'all', status: 'ACTIVE', isDefault: false,
  tcsRate: 1.0, effectiveFrom: null, effectiveTo: null,
});

export default function AdminTaxRates() {
  const [taxRates,  setTaxRates]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('All');
  const [editModal, setEditModal] = useState(null);
  const [editForm,  setEditForm]  = useState(blankForm());
  const [deleteId,  setDeleteId]  = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTaxRates();
      setTaxRates(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load tax rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const list = filter === 'All' ? taxRates : taxRates.filter(t => t.status === filter);

  const handleAddOpen = () => {
    setEditForm(blankForm());
    setEditModal('__new__');
  };

  const handleEditOpen = id => {
    const item = taxRates.find(t => t.id === id);
    if (!item) return;
    setEditForm({
      name: item.name, rate: item.rate, taxType: item.taxType || 'GST',
      hsnCode: item.hsnCode || '', description: item.description || '',
      applicableCategories: item.applicableCategories || 'all',
      status: item.status, isDefault: item.isDefault,
      tcsRate: item.tcsRate ?? 1.0,
      effectiveFrom: item.effectiveFrom, effectiveTo: item.effectiveTo,
    });
    setEditModal(id);
  };

  const handleEditChange = (field, value) => setEditForm(f => ({ ...f, [field]: value }));

  const handleEditSave = async () => {
    if (!editForm.name.trim() || !editForm.rate) return;
    const payload = {
      ...editForm,
      rate: parseFloat(editForm.rate),
      tcsRate: parseFloat(editForm.tcsRate) || 0,
      effectiveFrom: editForm.effectiveFrom ? Number(editForm.effectiveFrom) : null,
      effectiveTo: editForm.effectiveTo ? Number(editForm.effectiveTo) : null,
    };
    const isNew = editModal === '__new__';
    try {
      if (isNew) {
        const created = await createTaxRate(payload);
        setTaxRates(prev => [created, ...prev]);
        toast.success('Tax rate created');
      } else {
        await updateTaxRate(editModal, payload);
        const half = payload.rate / 2;
        setTaxRates(prev => prev.map(t => t.id === editModal ? { ...t, ...payload, cgst: half, sgst: half, igst: payload.rate } : t));
        toast.success('Tax rate updated');
      }
      setEditModal(null);
    } catch (err) {
      toast.error(err.message || `Failed to ${isNew ? 'create' : 'update'} tax rate`);
    }
  };

  const handleToggleStatus = async id => {
    try {
      const updated = await toggleTaxRateStatus(id);
      setTaxRates(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t));
      toast.success(updated.status === 'ACTIVE' ? 'Activated' : 'Deactivated');
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTaxRate(deleteId);
      setTaxRates(prev => prev.filter(t => t.id !== deleteId));
      toast.success('Tax rate deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="tr-root">
      <div className="tr-header">
        <div>
          <h1 className="tr-title">GST Slabs & Tax Rates</h1>
          <p className="tr-sub">Configure Indian GST slabs (0%, 5%, 12%, 18%, 28%), HSN codes, TCS, and cess</p>
        </div>
        <button className="tr-add-btn" onClick={handleAddOpen}>
          <Ico d={ICONS.plus} size={16} color="#fff"/>
          Add Rate
        </button>
      </div>

      {/* Indian GST Slab Reference */}
      <div className="tr-slab-ref">
        <div className="tr-slab-ref__title">Standard Indian GST Slabs</div>
        <div className="tr-slab-ref__grid">
          {[
            { rate: 0, label: 'Exempted', items: 'Food grains, books, education, health services' },
            { rate: 5, label: 'Essential', items: 'Packaged food, footwear <₹1000, fabric' },
            { rate: 12, label: 'Standard I', items: 'Computers, processed food, mobile accessories' },
            { rate: 18, label: 'Standard II', items: 'Smartphones, soaps, IT services, restaurants' },
            { rate: 28, label: 'Luxury', items: 'Cars, tobacco, ACs, luxury goods + cess' },
          ].map((slab, i) => (
            <div key={i} className="tr-slab-card" style={{ borderTop: `3px solid ${GST_COLORS[i]}` }}>
              <div className="tr-slab-rate">{slab.rate}%</div>
              <div className="tr-slab-label">{slab.label}</div>
              <div className="tr-slab-items">{slab.items}</div>
              <div className="tr-slab-split">
                CGST {slab.rate / 2}% + SGST {slab.rate / 2}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tr-stats">
        <div className="tr-stat-card">
          <ListIcon d={ICONS.tag} bg="#6366f1"/>
          <div>
            <div className="tr-stat-val">{taxRates.length}</div>
            <div className="tr-stat-lbl">Total Tax Rates</div>
          </div>
        </div>
        <div className="tr-stat-card">
          <ListIcon d={ICONS.perc} bg="#10b981"/>
          <div>
            <div className="tr-stat-val">{taxRates.filter(t => t.status === 'ACTIVE').length}</div>
            <div className="tr-stat-lbl">Active</div>
          </div>
        </div>
        <div className="tr-stat-card">
          <ListIcon d={ICONS.split} bg="#d97706"/>
          <div>
            <div className="tr-stat-val">1% TCS</div>
            <div className="tr-stat-lbl">E-commerce operator TCS</div>
          </div>
        </div>
      </div>

      <div className="tr-toolbar">
        <div className="tr-tabs">
          {['All', 'ACTIVE', 'INACTIVE'].map(f => (
            <button key={f} className={`tr-tab${filter === f ? ' tr-tab--act' : ''}`}
              onClick={() => setFilter(f)}>{f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      <div className="tr-table-wrap">
        <table className="tr-table">
          <thead>
            <tr>
              <th>Slab / HSN</th>
              <th>Total GST</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>TCS</th>
              <th>Status</th>
              <th>Default</th>
              <th className="tr-th-r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="tr-loading">Loading tax rates...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="9" className="tr-empty">No tax rates found</td></tr>
            ) : list.map(tr => (
              <tr key={tr.id}>
                <td className="tr-name-cell">
                  <span className="tr-name">{tr.name}</span>
                  {tr.hsnCode && <span className="tr-hsn">HSN: {tr.hsnCode}</span>}
                  {tr.description && <span className="tr-desc">{tr.description}</span>}
                </td>
                <td><span className="tr-rate">{tr.rate}%</span></td>
                <td><span className="tr-gst-split">{tr.cgst != null ? `${tr.cgst}%` : '—'}</span></td>
                <td><span className="tr-gst-split">{tr.sgst != null ? `${tr.sgst}%` : '—'}</span></td>
                <td><span className="tr-gst-split">{tr.igst != null ? `${tr.igst}%` : '—'}</span></td>
                <td><span className="tr-tcs">{tr.tcsRate != null ? `${tr.tcsRate}%` : '1%'}</span></td>
                <td>
                  <span className={`tr-bdg tr-bdg--${tr.status === 'ACTIVE' ? 'act' : 'inact'}`}>
                    <span className="tr-bdg__dot"/>
                    {tr.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{tr.isDefault ? <span className="tr-default-star" title="Default rate">★</span> : '—'}</td>
                <td>
                  <div className="tr-actions">
                    <button className="tr-action-btn" onClick={() => handleToggleStatus(tr.id)}
                      title={tr.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                      <Ico d={ICONS.toggle} size={14}/>
                    </button>
                    <button className="tr-action-btn" onClick={() => handleEditOpen(tr.id)} title="Edit">
                      <Ico d={ICONS.edit} size={14}/>
                    </button>
                    <button className="tr-action-btn tr-action-btn--del" onClick={() => setDeleteId(tr.id)} title="Delete">
                      <Ico d={ICONS.trash} size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={editModal !== null} onClose={() => setEditModal(null)} title={editModal === '__new__' ? 'Add GST Slab' : 'Edit GST Slab'}>
        <div className="tr-modal-form">
          <label className="tr-fld">
            <span>Slab Name <span className="tr-req">*</span></span>
            <input value={editForm.name} onChange={e => handleEditChange('name', e.target.value)}
              placeholder="e.g. GST 18%"/>
          </label>
          <div className="tr-fld-row">
            <label className="tr-fld">
              <span>Total GST Rate (%) <span className="tr-req">*</span></span>
              <input type="number" step="0.01" min="0" max="100" value={editForm.rate}
                onChange={e => handleEditChange('rate', e.target.value)} placeholder="e.g. 18"/>
              {editForm.rate > 0 && (
                <span className="tr-split-hint">Auto-splits → CGST {editForm.rate / 2}% + SGST {editForm.rate / 2}%</span>
              )}
            </label>
            <label className="tr-fld">
              <span>Tax Type</span>
              <select value={editForm.taxType} onChange={e => handleEditChange('taxType', e.target.value)}>
                {TAX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <div className="tr-fld-row">
            <label className="tr-fld">
              <span>HSN Code / Range</span>
              <input value={editForm.hsnCode} onChange={e => handleEditChange('hsnCode', e.target.value)}
                placeholder="e.g. 61, 85, 99, or leave empty"/>
              <span className="tr-split-hint">Products with HSN starting with this code will use this rate</span>
            </label>
            <label className="tr-fld">
              <span>TCS Rate (%)</span>
              <input type="number" step="0.01" min="0" max="10" value={editForm.tcsRate}
                onChange={e => handleEditChange('tcsRate', e.target.value)} placeholder="1.0"/>
              <span className="tr-split-hint">1% TCS required for e-commerce operators</span>
            </label>
          </div>
          <label className="tr-fld">
            <span>Description</span>
            <textarea value={editForm.description} onChange={e => handleEditChange('description', e.target.value)}
              placeholder="e.g. Standard rate — smartphones, soaps, services" rows={2}/>
          </label>
          <label className="tr-fld">
            <span>Applicable Categories</span>
            <input value={editForm.applicableCategories}
              onChange={e => handleEditChange('applicableCategories', e.target.value)}
              placeholder="all, electronics, clothing, food, ..."/>
          </label>
          <div className="tr-fld-row">
            <label className="tr-fld">
              <span>Effective From</span>
              <input type="date" value={editForm.effectiveFrom ? new Date(editForm.effectiveFrom).toISOString().split('T')[0] : ''}
                onChange={e => handleEditChange('effectiveFrom', e.target.value ? new Date(e.target.value).getTime() : null)}/>
            </label>
            <label className="tr-fld">
              <span>Effective To</span>
              <input type="date" value={editForm.effectiveTo ? new Date(editForm.effectiveTo).toISOString().split('T')[0] : ''}
                onChange={e => handleEditChange('effectiveTo', e.target.value ? new Date(e.target.value).getTime() : null)}/>
            </label>
          </div>
          <label className="tr-fld tr-fld--chk">
            <input type="checkbox" checked={editForm.isDefault}
              onChange={e => handleEditChange('isDefault', e.target.checked)}/>
            <span>Set as default tax rate (18% recommended for general goods)</span>
          </label>
          <div className="tr-modal-actions">
            <button className="tr-btn tr-btn--sec" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="tr-btn tr-btn--pri" onClick={handleEditSave} disabled={!editForm.name.trim() || !editForm.rate}>
              {editModal === '__new__' ? 'Create Slab' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation ── */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Tax Rate">
        <p className="tr-del-msg">Are you sure you want to delete this tax rate? This action cannot be undone.</p>
        <div className="tr-modal-actions">
          <button className="tr-btn tr-btn--sec" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="tr-btn tr-btn--del" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
