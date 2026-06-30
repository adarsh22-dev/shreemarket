import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import {
  getCustomerSegments, createCustomerSegment, updateCustomerSegment,
  toggleCustomerSegmentStatus, deleteCustomerSegment,
  getSegmentStats, getSegmentCustomers, recalculateSegmentCounts
} from '../../api/api';
import './AdminCustomerSegments.css';

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
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  target:'M22 12h-4l-3 9L9 3l-3 9H2',
  refresh:['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  eye:   'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  search:'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  download:['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  check:'M20 6 9 17l-5-5',
  x:'M18 6 6 18M6 6l12 12',
  mail:'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
  phone:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.27a16 16 0 0 0 6 6l.85-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  star:  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  zap:   'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  crown: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14',
  'user-plus': ['M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M8.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z','M20 8v6M23 11h-6'],
  'alert-triangle': ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4M12 17h.01'],
  repeat:['M17 1l4 4-4 4','M3 11V9a4 4 0 0 1 4-4h14','M7 23l-4-4 4-4','M21 13v2a4 4 0 0 1-4 4H3'],
   'user':['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
};

const SEGMENT_COLORS = ['#6366f1', '#16a34a', '#2563eb', '#d97706', '#E03E1A', '#64748b', '#7c3aed', '#0891b2', '#db2777'];

const getIcon = (iconName) => ICONS[iconName] || ICONS.users;

const blankForm = () => ({
  name: '', description: '', color: '#6366f1', icon: 'users',
  criteria: '{"minTotalSpent":10000}', isActive: true,
});

const parseCriteriaForDisplay = (criteria) => {
  if (!criteria) return [];
  try {
    const obj = JSON.parse(criteria);
    return Object.entries(obj).map(([key, val]) => {
      const labels = {
        minTotalSpent: 'Min Spend',
        maxTotalSpent: 'Max Spend',
        minOrders: 'Min Orders',
        maxOrders: 'Max Orders',
        exactOrders: 'Exact Orders',
        maxDaysSinceJoin: 'Joined Within (days)',
        minDaysSinceLastOrder: 'Inactive After (days)',
        maxDaysSinceLastOrder: 'Active Within (days)',
      };
      return { label: labels[key] || key, value: key.includes('Spent') ? `₹${Number(val).toLocaleString()}` : val };
    });
  } catch { return []; }
};

export default function AdminCustomerSegments() {
  const [segments, setSegments] = useState([]);
  const [stats, setStats] = useState({ totalSegments: 0, activeSegments: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState(blankForm());
  const [deleteId, setDeleteId] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [viewCustomers, setViewCustomers] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [segData, statsData] = await Promise.all([
        getCustomerSegments(),
        getSegmentStats()
      ]);
      setSegments(segData || []);
      setStats(statsData || { totalSegments: 0, activeSegments: 0, totalCustomers: 0 });
    } catch (err) {
      toast.error(err.message || 'Failed to load segments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const list = filter === 'All' ? segments : segments.filter(s => filter === 'Active' ? s.isActive : !s.isActive);
  const activeSegments = segments.filter(s => s.isActive);

  const handleAddOpen = () => {
    setEditForm(blankForm());
    setEditModal('__new__');
  };

  const handleEditOpen = id => {
    const item = segments.find(s => s.id === id);
    if (!item) return;
    setEditForm({
      name: item.name, description: item.description || '',
      color: item.color || '#6366f1', icon: item.icon || 'users',
      criteria: item.criteria || '{}', isActive: item.isActive,
    });
    setEditModal(id);
  };

  const handleEditChange = (field, value) => setEditForm(f => ({ ...f, [field]: value }));

  const handleEditSave = async () => {
    if (!editForm.name.trim()) {
      toast.error('Segment name is required');
      return;
    }
    // Validate criteria JSON
    try {
      if (editForm.criteria) JSON.parse(editForm.criteria);
    } catch {
      toast.error('Invalid criteria JSON');
      return;
    }
    const payload = { ...editForm };
    const isNew = editModal === '__new__';
    try {
      if (isNew) {
        const created = await createCustomerSegment(payload);
        setSegments(prev => [...prev, created]);
        toast.success('Segment created');
      } else {
        const updated = await updateCustomerSegment(editModal, payload);
        setSegments(prev => prev.map(s => s.id === editModal ? { ...s, ...updated } : s));
        toast.success('Segment updated');
      }
      setEditModal(null);
      // Refresh stats
      const statsData = await getSegmentStats();
      setStats(statsData);
    } catch (err) {
      toast.error(err.message || `Failed to ${isNew ? 'create' : 'update'} segment`);
    }
  };

  const handleToggleStatus = async id => {
    try {
      const updated = await toggleCustomerSegmentStatus(id);
      setSegments(prev => prev.map(s => s.id === id ? { ...s, isActive: updated.isActive } : s));
      toast.success(updated.isActive ? 'Activated' : 'Deactivated');
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCustomerSegment(deleteId);
      setSegments(prev => prev.filter(s => s.id !== deleteId));
      toast.success('Segment deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleRecalculate = async () => {
    try {
      await recalculateSegmentCounts();
      toast.success('All segment counts recalculated');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to recalculate');
    }
  };

  const handleViewCustomers = async (id) => {
    const seg = segments.find(s => s.id === id);
    if (!seg) return;
    setViewModal(seg);
    setViewLoading(true);
    try {
      const customers = await getSegmentCustomers(id);
      setViewCustomers(customers || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load customers');
      setViewCustomers([]);
    } finally {
      setViewLoading(false);
    }
  };

  const formatDate = (epoch) => {
    if (!epoch) return '—';
    return new Date(epoch).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="seg-root">
      <div className="seg-header">
        <div>
          <h1 className="seg-title">Customer Segments</h1>
          <p className="seg-sub">Create and manage customer groups for targeted marketing campaigns</p>
        </div>
        <div className="seg-header-actions">
          <button className="seg-refresh-btn" onClick={handleRecalculate} title="Recalculate all segment counts">
            <Ico d={ICONS.refresh} size={15} color="#475569"/>
          </button>
          <button className="seg-add-btn" onClick={handleAddOpen}>
            <Ico d={ICONS.plus} size={16} color="#fff"/>
            Create Segment
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="seg-stats">
        <div className="seg-stat-card">
          <div className="seg-stat-icon" style={{background:'#ede9fe'}}>
            <Ico d={ICONS.target} size={18} color="#7c3aed"/>
          </div>
          <div>
            <div className="seg-stat-val">{stats.totalSegments || 0}</div>
            <div className="seg-stat-lbl">Total Segments</div>
          </div>
        </div>
        <div className="seg-stat-card">
          <div className="seg-stat-icon" style={{background:'#dcfce7'}}>
            <Ico d={ICONS.check} size={18} color="#16a34a"/>
          </div>
          <div>
            <div className="seg-stat-val">{stats.activeSegments || 0}</div>
            <div className="seg-stat-lbl">Active Segments</div>
          </div>
        </div>
        <div className="seg-stat-card">
          <div className="seg-stat-icon" style={{background:'#dbeafe'}}>
            <Ico d={ICONS.users} size={18} color="#2563eb"/>
          </div>
          <div>
            <div className="seg-stat-val">{stats.totalCustomers || 0}</div>
            <div className="seg-stat-lbl">Total Customers</div>
          </div>
        </div>
        <div className="seg-stat-card">
          <div className="seg-stat-icon" style={{background:'#fef3c7'}}>
            <Ico d={ICONS.zap} size={18} color="#d97706"/>
          </div>
          <div>
            <div className="seg-stat-val">{activeSegments.reduce((sum, s) => sum + (s.customerCount || 0), 0)}</div>
            <div className="seg-stat-lbl">Segmented Customers</div>
          </div>
        </div>
      </div>

      {/* Segment Table */}
      <div className="seg-toolbar">
        <div className="seg-tabs">
          {['All', 'Active', 'Inactive'].map(f => (
            <button key={f} className={`seg-tab${filter === f ? ' seg-tab--act' : ''}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="seg-tw">
        {loading ? (
          <div className="seg-loading">Loading segments...</div>
        ) : list.length === 0 ? (
          <div className="seg-empty">No segments found. Create your first segment to start grouping customers.</div>
        ) : (
          <table className="seg-tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Customers</th>
                <th>Criteria</th>
                <th>Status</th>
                <th className="seg-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(seg => {
                const criteriaItems = parseCriteriaForDisplay(seg.criteria);
                return (
                  <tr key={seg.id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="seg-card-icon" style={{width:32,height:32,background:seg.color+'20',color:seg.color}}>
                          <Ico d={getIcon(seg.icon)} size={16} color={seg.color}/>
                        </div>
                        <span style={{fontWeight:600,color:'#1e293b',fontSize:'.85rem'}}>{seg.name}</span>
                      </div>
                    </td>
                    <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{seg.description || 'No description'}</td>
                    <td><span style={{fontWeight:700,color:seg.color||'#6366f1'}}>{seg.customerCount || 0}</span></td>
                    <td>
                      {criteriaItems.length > 0 ? (
                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                          {criteriaItems.map((c,i) => (
                            <span key={i} className="seg-criteria-tag">{c.label}: {c.value}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{color:'#9ca3af',fontSize:'.78rem'}}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`seg-status-badge ${seg.isActive ? 'seg-status-badge--act' : 'seg-status-badge--inact'}`}>
                        <span className="seg-status-dot"/>
                        {seg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{textAlign:'right'}}>
                      <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                        <button className="seg-card-btn" onClick={() => handleViewCustomers(seg.id)} title="View customers">
                          <Ico d={ICONS.eye} size={13}/>
                        </button>
                        <button className="seg-card-btn" onClick={() => handleEditOpen(seg.id)} title="Edit">
                          <Ico d={ICONS.edit} size={13}/>
                        </button>
                        <button className="seg-card-btn seg-card-btn--del" onClick={() => setDeleteId(seg.id)} title="Delete">
                          <Ico d={ICONS.trash} size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={editModal !== null} onClose={() => setEditModal(null)} title={editModal === '__new__' ? 'Create Segment' : 'Edit Segment'}>
        <div className="seg-modal-form">
          <label className="seg-fld">
            <span>Segment Name <span className="seg-req">*</span></span>
            <input value={editForm.name} onChange={e => handleEditChange('name', e.target.value)}
              placeholder="e.g. High-Value Customers"/>
          </label>
          <label className="seg-fld">
            <span>Description</span>
            <textarea value={editForm.description} onChange={e => handleEditChange('description', e.target.value)}
              placeholder="Describe this customer segment..." rows={2}/>
          </label>
          <div className="seg-fld-row">
            <label className="seg-fld">
              <span>Color</span>
              <div className="seg-color-picker">
                {SEGMENT_COLORS.map(c => (
                  <button key={c} className={`seg-color-swatch${editForm.color === c ? ' seg-color-swatch--sel' : ''}`}
                    style={{background: c}} onClick={() => handleEditChange('color', c)}/>
                ))}
              </div>
            </label>
            <label className="seg-fld">
              <span>Icon</span>
              <select value={editForm.icon} onChange={e => handleEditChange('icon', e.target.value)}>
                <option value="users">Users</option>
                <option value="crown">Crown (VIP)</option>
                <option value="star">Star</option>
                <option value="zap">Lightning</option>
                <option value="repeat">Repeat</option>
                <option value="user-plus">New User</option>
                <option value="alert-triangle">Alert</option>
                <option value="user">Single User</option>
                <option value="target">Target</option>
              </select>
            </label>
          </div>
          <label className="seg-fld">
            <span>Criteria (JSON) <span className="seg-req">*</span></span>
            <textarea value={editForm.criteria} onChange={e => handleEditChange('criteria', e.target.value)}
              placeholder='{"minTotalSpent":10000}' rows={3} className="seg-json-input"/>
            <span className="seg-fld-hint">
              Supported keys: minTotalSpent, maxTotalSpent, minOrders, maxOrders, exactOrders, maxDaysSinceJoin, minDaysSinceLastOrder, maxDaysSinceLastOrder
            </span>
          </label>
          <div className="seg-modal-actions">
            <button className="seg-btn seg-btn--sec" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="seg-btn seg-btn--pri" onClick={handleEditSave} disabled={!editForm.name.trim()}>
              {editModal === '__new__' ? 'Create Segment' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Customers Modal */}
      <Modal isOpen={viewModal !== null} onClose={() => { setViewModal(null); setViewCustomers([]); }}
        title={`${viewModal?.name || ''} — Customers`} sub={`${viewCustomers.length} customer(s) matched`}>
        <div className="seg-view-list">
          {viewLoading ? (
            <div className="seg-loading">Loading customers...</div>
          ) : viewCustomers.length === 0 ? (
            <div className="seg-empty">No customers match this segment's criteria.</div>
          ) : viewCustomers.map(c => (
            <div key={c.id} className="seg-view-customer">
              <div className="seg-view-avatar" style={{background: SEGMENT_COLORS[c.id % SEGMENT_COLORS.length]}}>
                {(c.fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="seg-view-info">
                <div className="seg-view-name">{c.fullName || '—'}</div>
                <div className="seg-view-email">{c.email}</div>
              </div>
              <div className="seg-view-meta">
                <span className={`seg-status-badge ${c.status === 'Active' ? 'seg-status-badge--act' : 'seg-status-badge--inact'}`}>
                  {c.status}
                </span>
                <span className="seg-view-date">{formatDate(c.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Segment">
        <p className="seg-del-msg">Are you sure you want to delete this segment? This action cannot be undone.</p>
        <div className="seg-modal-actions">
          <button className="seg-btn seg-btn--sec" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="seg-btn seg-btn--del" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
