import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { getDeliveryPartners, createDeliveryPartner, updateDeliveryPartner, deleteDeliveryPartner } from '../../api/api';
import './AdminDeliverypartners.css';

/* ── Icons ── */
const Ico = ({ d, size = 14, color = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const ICONS = {
  edit:  ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  copy:  ['M9 9h13v13H9z','M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  trash: ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M10 11v6M14 11v6','M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  star:  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  truck: ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z','M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  globe: ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z','M2 12h20','M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.27a16 16 0 0 0 6 6l.85-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  check: 'M20 6 9 17l-5-5',
  ban:   ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z','M4.93 4.93l14.14 14.14'],
  plus:  ['M12 5v14M5 12h14'],
};

const Stars = ({ val }) => (
  <div className="dp-stars">
    {[1,2,3,4,5].map(i => (
      <svg key={i} width="12" height="12" viewBox="0 0 24 24"
        fill={i <= Math.round(val) ? '#f59e0b' : 'none'}
        stroke={i <= Math.round(val) ? '#f59e0b' : '#cbd5e1'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS.star}/>
      </svg>
    ))}
    <span className="dp-stars__val">{val}</span>
  </div>
);

const Bar = ({ pct, color }) => (
  <div className="dp-bar">
    <div className="dp-bar__fill" style={{ width:`${pct}%`, background: color }}/>
  </div>
);

const StatusBdg = ({ status }) => (
  <span className={`dp-bdg dp-bdg--${status === 'Active' ? 'act' : 'inact'}`}>
    <span className="dp-bdg__dot"/>
    {status}
  </span>
);

const blankForm = () => ({ name:'', code:'', coverage:'', phone:'', email:'', cost:'', status:'Active' });

export default function DeliveryPartners() {
  const [checked,     setChecked]     = useState({});
  const [filter,      setFilter]      = useState('All');
  const [partners,    setPartners]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editModal,   setEditModal]   = useState(null);
  const [editForm,    setEditForm]    = useState(blankForm());
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryPartners();
      setPartners(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const list = filter === 'All' ? partners : partners.filter(p => p.status === filter);
  const allChecked = list.length > 0 && list.every(p => checked[p.id]);
  const toggleAll = () => allChecked ? setChecked({}) : setChecked(Object.fromEntries(list.map(p => [p.id, true])));
  const toggle = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const maxDelivered = Math.max(...partners.map(p => p.delivered), 0);

  /* ── Add ── */
  const handleAddOpen = () => {
    setEditForm(blankForm());
    setEditModal('__new__');
  };

  /* ── Edit ── */
  const handleEditOpen = id => {
    const item = partners.find(p => p.id === id);
    if (!item) return;
    setEditForm({ name: item.name, code: item.code || '', coverage: item.coverage, phone: item.phone, email: item.email, cost: item.cost, status: item.status });
    setEditModal(id);
  };

  const handleEditChange = (field, value) => setEditForm(f => ({ ...f, [field]: value }));

  const handleEditSave = async () => {
    if (!editForm.name.trim()) return;
    const isNew = editModal === '__new__';
    try {
      if (isNew) {
        const created = await createDeliveryPartner(editForm);
        setPartners(prev => [created, ...prev]);
        toast.success('Partner created successfully');
      } else {
        await updateDeliveryPartner(editModal, editForm);
        setPartners(prev => prev.map(p => p.id === editModal ? { ...p, ...editForm } : p));
        toast.success('Partner updated successfully');
      }
      setEditModal(null);
    } catch (err) {
      toast.error(err.message || `Failed to ${isNew ? 'create' : 'update'} partner`);
    }
  };

  const handleEditClose = () => setEditModal(null);

  /* ── Delete ── */
  const handleDeleteOpen = id => setDeleteModal(id);
  const handleDeleteConfirm = async () => {
    try {
      await deleteDeliveryPartner(deleteModal);
      setPartners(prev => prev.filter(p => p.id !== deleteModal));
      setChecked(prev => { const n={...prev}; delete n[deleteModal]; return n; });
      toast.success('Partner deleted successfully');
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete partner');
    }
  };

  /* ── Duplicate ── */
  const handleDuplicate = async id => {
    const item = partners.find(p => p.id === id);
    if (!item) return;
    const { id: _id, joined: _j, rating: _r, avgDays: _a, activeOrders: _ao, delivered: _d, color: _c, ...rest } = item;
    try {
      const created = await createDeliveryPartner({ ...rest, name: `${item.name} (Copy)` });
      setPartners(prev => [created, ...prev]);
      toast.success('Partner duplicated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to duplicate partner');
    }
  };

  /* ── Toggle status ── */
  const handleToggleStatus = async id => {
    const item = partners.find(p => p.id === id);
    if (!item) return;
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateDeliveryPartner(id, { ...item, status: newStatus });
      setPartners(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast.success(`Partner ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const isAddMode = editModal === '__new__';

  return (
    <div className="dp">

      {/* Header */}
      <div className="dp-hdr">
        <div>
          <h2 className="dp-hdr__title">Delivery Partners</h2>
          <p className="dp-hdr__sub">{list.length} partner{list.length !== 1 ? 's' : ''} · {partners.filter(p=>p.status==='Active').length} active</p>
        </div>
        <div className="dp-hdr__right">
          <div className="dp-hdr__pills">
            {['All','Active','Inactive'].map(f => (
              <button key={f} className={`dp-pill${filter === f ? ' dp-pill--on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <button className="dp-add-btn" onClick={handleAddOpen}>
            <Ico d={ICONS.plus} size={14} color="#fff" sw={2.5}/>
            Add Partner
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="dp-card">
        <div className="dp-tw">
          <table className="dp-tbl">
            <thead>
              <tr>
                <th className="dp-th dp-th--chk">
                  <input type="checkbox" className="dp-chk" checked={allChecked} onChange={toggleAll}/>
                </th>
                <th className="dp-th">Partner</th>
                <th className="dp-th dp-hm">Coverage</th>
                <th className="dp-th dp-hm">Contact</th>
                <th className="dp-th">Active Orders</th>
                <th className="dp-th dp-hm">Total Delivered</th>
                <th className="dp-th">Rating</th>
                <th className="dp-th dp-hm">Avg. Days</th>
                <th className="dp-th dp-hm">Rate</th>
                <th className="dp-th">Status</th>
                <th className="dp-th dp-th--r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="dp-td" colSpan={11} style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>
                    Loading delivery partners...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td className="dp-td" colSpan={11} style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>
                    No delivery partners found
                  </td>
                </tr>
              ) : list.map(p => {
                const deliveredPct = maxDelivered > 0 ? Math.round((p.delivered / maxDelivered) * 100) : 0;
                return (
                  <tr key={p.id} className={`dp-tr${checked[p.id] ? ' dp-tr--sel' : ''}`}>
                    <td className="dp-td dp-td--chk">
                      <input type="checkbox" className="dp-chk" checked={!!checked[p.id]} onChange={() => toggle(p.id)}/>
                    </td>
                    <td className="dp-td">
                      <div className="dp-partner">
                        <div className="dp-logo" style={{ background: (p.color || '#2563eb')+'18', border:`1px solid ${(p.color || '#2563eb')}30` }}>
                          <Ico d={ICONS.truck} size={16} color={p.color || '#2563eb'} sw={1.8}/>
                        </div>
                        <div className="dp-partner__text">
                          <span className="dp-partner__name">{p.name}</span>
                          <span className="dp-partner__meta">
                            <span className="dp-code" style={{ color: p.color || '#2563eb', background: (p.color || '#2563eb')+'12' }}>{p.code}</span>
                            <span className="dp-partner__since">Since {p.joined}</span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="dp-td dp-hm">
                      <div className="dp-coverage">
                        <Ico d={ICONS.globe} size={13} color="#94a3b8"/>
                        <span>{p.coverage}</span>
                      </div>
                    </td>
                    <td className="dp-td dp-hm">
                      <div className="dp-contact">
                        <div className="dp-contact__row"><Ico d={ICONS.phone} size={11} color="#94a3b8"/><span>{p.phone}</span></div>
                        <div className="dp-contact__row dp-contact__email"><span>{p.email}</span></div>
                      </div>
                    </td>
                    <td className="dp-td"><span className="dp-num" style={{ color: p.color || '#2563eb' }}>{p.activeOrders?.toLocaleString()}</span></td>
                    <td className="dp-td dp-hm">
                      <div className="dp-delivered">
                        <span className="dp-delivered__val">{p.delivered?.toLocaleString()}</span>
                        <Bar pct={deliveredPct} color={p.color || '#2563eb'}/>
                      </div>
                    </td>
                    <td className="dp-td"><Stars val={p.rating}/></td>
                    <td className="dp-td dp-hm"><span className="dp-days">{p.avgDays}d avg</span></td>
                    <td className="dp-td dp-hm"><span className="dp-rate">{p.cost}</span></td>
                    <td className="dp-td"><StatusBdg status={p.status}/></td>
                    <td className="dp-td dp-td--r">
                      <div className="dp-acts">
                        <button className="dp-act dp-act--edit"  title="Edit"      onClick={() => handleEditOpen(p.id)}><Ico d={ICONS.edit}  size={13}/></button>
                        <button className="dp-act dp-act--copy"  title="Duplicate" onClick={() => handleDuplicate(p.id)}><Ico d={ICONS.copy}  size={13}/></button>
                        <button className={`dp-act dp-act--tog dp-act--tog-${p.status === 'Active' ? 'off' : 'on'}`}
                          title={p.status === 'Active' ? 'Disable' : 'Enable'} onClick={() => handleToggleStatus(p.id)}>
                          <Ico d={p.status === 'Active' ? ICONS.ban : ICONS.check} size={13}/>
                        </button>
                        <button className="dp-act dp-act--trash" title="Delete" onClick={() => handleDeleteOpen(p.id)}><Ico d={ICONS.trash} size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit / Add Modal ── */}
      <Modal
        isOpen={!!editModal}
        onClose={handleEditClose}
        title={isAddMode ? 'Add Delivery Partner' : 'Edit Delivery Partner'}
        children={
          <div className="modal-edit-grid">

            {/* Partner Name */}
            <div className="modal-form-group modal-span-2">
              <label className="modal-label">Partner Name</label>
              <input
                type="text"
                className="modal-input"
                value={editForm.name}
                onChange={e => handleEditChange('name', e.target.value)}
                autoFocus
              />
            </div>

            {/* Code */}
            <div className="modal-form-group">
              <label className="modal-label">Code</label>
              <input
                type="text"
                className="modal-input"
                value={editForm.code}
                onChange={e => handleEditChange('code', e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="modal-form-group">
              <label className="modal-label">Phone</label>
              <input
                type="text"
                className="modal-input"
                value={editForm.phone}
                onChange={e => handleEditChange('phone', e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="modal-form-group">
              <label className="modal-label">Email</label>
              <input
                type="email"
                className="modal-input"
                value={editForm.email}
                onChange={e => handleEditChange('email', e.target.value)}
              />
            </div>

            {/* Coverage */}
            <div className="modal-form-group">
              <label className="modal-label">Coverage</label>
              <input
                type="text"
                className="modal-input"
                value={editForm.coverage}
                onChange={e => handleEditChange('coverage', e.target.value)}
              />
            </div>

            {/* Cost */}
            <div className="modal-form-group">
              <label className="modal-label">Rate (per kg)</label>
              <input
                type="text"
                className="modal-input"
                value={editForm.cost}
                onChange={e => handleEditChange('cost', e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="modal-form-group">
              <label className="modal-label">Status</label>
              <select
                className="modal-input modal-select"
                value={editForm.status}
                onChange={e => handleEditChange('status', e.target.value)}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

          </div>
        }
        footer={
          <>
            <button className="modal-btn modal-btn--secondary" onClick={handleEditClose}>Cancel</button>
            <button className="modal-btn modal-btn--primary"   onClick={handleEditSave}>
              {isAddMode ? 'Add Partner' : 'Save Changes'}
            </button>
          </>
        }
      />

      {/* ── Delete Modal ── */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Delivery Partner"
        children={
          <div className="modal-alert modal-alert--danger">
            Are you sure you want to delete this delivery partner? This action cannot be undone.
          </div>
        }
        footer={
          <>
            <button className="modal-btn modal-btn--secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="modal-btn modal-btn--danger"    onClick={handleDeleteConfirm}>Delete</button>
          </>
        }
      />

    </div>
  );
}
