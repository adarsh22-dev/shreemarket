import React, { useState, useEffect } from 'react';
import './AdminAnnouncements.css';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/api';
import { Megaphone, Plus, Edit2, Trash2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_ICON = {
  URGENT: { icon: AlertCircle, c: '#dc2626' },
  WARNING: { icon: AlertTriangle, c: '#d97706' },
  MAINTENANCE: { icon: Info, c: '#2563eb' },
  INFO: { icon: Megaphone, c: '#E03E1A' },
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', message: '', type: 'INFO', targetAudience: 'ALL', status: 'DRAFT',
    scheduledAt: '', expiresAt: ''
  });

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    try { const data = await getAnnouncements(); setAnnouncements(data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', message: '', type: 'INFO', targetAudience: 'ALL', status: 'DRAFT', scheduledAt: '', expiresAt: '' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      ...a,
      scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString().slice(0, 16) : '',
      expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).getTime() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : null
      };
      if (editing) { await updateAnnouncement(editing.id, data); toast.success('Updated'); }
      else { await createAnnouncement(data); toast.success('Created'); }
      setShowModal(false);
      loadAnnouncements();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await deleteAnnouncement(id); toast.success('Deleted'); loadAnnouncements(); }
    catch { toast.error('Failed to delete'); }
  };

  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.status === 'ACTIVE').length,
    scheduled: announcements.filter(a => a.status === 'SCHEDULED').length,
    draft: announcements.filter(a => a.status === 'DRAFT').length,
  };

  if (loading) return <div className="an"><div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading...</div></div>;

  return (
    <div className="an">
      <div className="an-hdr">
        <div>
          <h1 className="an-hdr__t"><Megaphone size={20} style={{ color: '#E03E1A' }} /> Announcements</h1>
          <p className="an-hdr__s">Create and manage platform-wide announcements</p>
        </div>
        <button className="an-btn an-btn--pri" onClick={openCreate}>
          <Plus size={15} /> New Announcement
        </button>
      </div>

      <div className="an-kpis">
        {[
          { icon: Megaphone, val: stats.total, lbl: 'Total', bg: '#f0f9ff', c: '#2563eb' },
          { icon: Megaphone, val: stats.active, lbl: 'Active', bg: '#f0fdf4', c: '#16a34a' },
          { icon: Megaphone, val: stats.scheduled, lbl: 'Scheduled', bg: '#eff6ff', c: '#2563eb' },
          { icon: Megaphone, val: stats.draft, lbl: 'Draft', bg: '#f1f5f9', c: '#64748b' },
        ].map((k, i) => (
          <div key={i} className="an-kpi">
            <div className="an-kpi__icon" style={{ background: k.bg }}><k.icon size={18} color={k.c} /></div>
            <div><div className="an-kpi__val">{k.val}</div><div className="an-kpi__lbl">{k.lbl}</div></div>
          </div>
        ))}
      </div>

      {announcements.length === 0 ? (
        <div className="an-empty">
          <Megaphone size={48} className="an-empty__icon" />
          <p className="an-empty__txt">No announcements yet</p>
        </div>
      ) : (
        <div className="an-card">
          <div className="an-tw">
            <table className="an-tbl">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Expires</th>
                  <th className="an-th-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map(a => {
                  const ti = TYPE_ICON[a.type] || TYPE_ICON.INFO;
                  const IconComp = ti.icon;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <IconComp size={14} color={ti.c} />
                          <div>
                            <div style={{ fontWeight:600, fontSize:'.82rem', color:'#0f172a' }}>{a.title}</div>
                            <div style={{ fontSize:'.72rem', color:'#94a3b8', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.message}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="an-bdg an-bdg--type">{a.type}</span></td>
                      <td><span className="an-bdg an-bdg--audience">{a.targetAudience}</span></td>
                      <td><span className={`an-bdg an-bdg--${(a.status || 'draft').toLowerCase()}`}>{a.status}</span></td>
                      <td style={{ fontSize:'.78rem', color:'#64748b' }}>{a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '-'}</td>
                      <td style={{ fontSize:'.78rem', color:'#64748b' }}>{a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '-'}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="an-ib" onClick={() => openEdit(a)} title="Edit"><Edit2 size={14} style={{ color: '#2563eb' }} /></button>
                          <button className="an-ib" onClick={() => handleDelete(a.id)} title="Delete"><Trash2 size={14} style={{ color: '#dc2626' }} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="an-overlay" onClick={() => setShowModal(false)}>
          <div className="an-modal" onClick={e => e.stopPropagation()}>
            <div className="an-modal__hdr">
              <h2>{editing ? 'Edit' : 'New'} Announcement</h2>
              <button className="an-modal__close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="an-modal__body">
              <div className="an-field">
                <label>Title</label>
                <input className="an-inp" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
              </div>
              <div className="an-field">
                <label>Message</label>
                <textarea className="an-inp an-textarea" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write your announcement..." />
              </div>
              <div className="an-fgrid">
                <div className="an-field">
                  <label>Type</label>
                  <select className="an-inp" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="URGENT">Urgent</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div className="an-field">
                  <label>Target Audience</label>
                  <select className="an-inp" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })}>
                    <option value="ALL">All</option>
                    <option value="VENDORS">Vendors</option>
                    <option value="CUSTOMERS">Customers</option>
                    <option value="ADMINS">Admins</option>
                  </select>
                </div>
              </div>
              <div className="an-fgrid">
                <div className="an-field">
                  <label>Scheduled At</label>
                  <input className="an-inp" type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
                </div>
                <div className="an-field">
                  <label>Expires At</label>
                  <input className="an-inp" type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
              </div>
              <div className="an-field">
                <label>Status</label>
                <select className="an-inp" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>
            </div>
            <div className="an-modal__ftr">
              <button className="an-btn an-btn--out" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="an-btn an-btn--pri" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
