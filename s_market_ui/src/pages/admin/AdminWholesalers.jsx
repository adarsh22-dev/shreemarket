import React, { useState, useEffect, useCallback } from 'react';
import { Search, Check, X, AlertTriangle, Eye, ChevronLeft, ChevronRight, Building2, Mail, Phone, MapPin, Calendar, FileText, Hash } from 'lucide-react';
import './AdminWholesalers.css';

const API = window.API_BASE_URL || 'http://localhost:8082/api';

const STATUSES = ['All', 'Pending', 'Active', 'Rejected', 'Suspended'];
const STATUS_COLORS = {
  Active: 'active', Pending: 'pending', Rejected: 'rejected', Suspended: 'suspended',
};

const Toast = ({ toasts, removeToast }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12,
        background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#0f172a',
        color: '#fff', fontSize: '0.83rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        animation: 'slideInToast 0.3s ease', pointerEvents: 'auto', minWidth: 220,
      }}>
        {t.type === 'success' ? <Check size={15} /> : <X size={15} />}
        {t.message}
      </div>
    ))}
    <style>{`@keyframes slideInToast { from { transform: translateX(120%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
};

const ConfirmDialog = ({ msg, onConfirm, onCancel }) => (
  <div onClick={e => e.target === e.currentTarget && onCancel()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertTriangle size={20} color="#dc2626" />
        </div>
        <div>
          <p style={{ fontWeight: 800, color: '#111', margin: '0 0 4px', fontSize: '0.95rem' }}>Confirm Action</p>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.83rem', lineHeight: 1.5 }}>{msg}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e5e5e5', background: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: '#555' }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Confirm</button>
      </div>
    </div>
  </div>
);

const AdminWholesalers = () => {
  const { toasts, show } = useToast();
  const [wholesalers, setWholesalers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchWholesalers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '10' });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'All') params.append('status', statusFilter);
      const res = await fetch(`${API}/admin/wholesalers?${params}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setWholesalers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWholesalers(); }, [page, statusFilter]);

  const handleSearch = () => { setPage(0); fetchWholesalers(); };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/admin/wholesalers/${id}/${action}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      show(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`, 'success');
      setConfirm(null);
      fetchWholesalers();
      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await fetch(`${API}/admin/wholesalers/${id}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setSelected(data);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  return (
    <div className="aw">
      <Toast toasts={toasts} removeToast={() => {}} />

      <div className="aw-hdr">
        <div>
          <h1 className="aw-hdr__title">Wholesaler Management</h1>
          <p className="aw-hdr__sub">Manage wholesaler registrations, approvals, and account status</p>
        </div>
        <div className="aw-hdr__actions">
          <span style={{ padding: '6px 16px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
            {totalElements} wholesalers
          </span>
        </div>
      </div>

      <div className="aw-toolbar">
        <div className="aw-search">
          <Search size={16} color="#94a3b8" />
          <input
            placeholder="Search by name, email, business name, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select className="aw-filter" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="aw-btn aw-btn--primary" onClick={handleSearch}>Search</button>
      </div>

      <div className="aw-table-wrap">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #f1f5f9', borderTopColor: '#E03E1A', borderRadius: '50%', animation: 'awSpin 0.7s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: 12, color: '#94a3b8', fontSize: '0.85rem' }}>Loading wholesalers...</p>
          </div>
        ) : wholesalers.length === 0 ? (
          <div className="aw-empty">
            <Building2 size={40} color="#d1d5db" />
            <p>No wholesalers found</p>
          </div>
        ) : (
          <>
            <table className="aw-table">
              <thead>
                <tr>
                  <th>Wholesaler</th>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {wholesalers.map(w => (
                  <tr key={w.id}>
                    <td>
                      <div className="aw-name-cell">
                        <div className="aw-avatar">{w.fullName?.charAt(0) || '?'}</div>
                        <div>
                          <div>{w.fullName}</div>
                          <div className="aw-email">{w.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{w.businessName || '—'}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>{w.businessType || ''}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
                        <Phone size={12} color="#94a3b8" /> {w.phone || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`aw-badge aw-badge--${STATUS_COLORS[w.status] || 'pending'}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                        {w.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="aw-actions">
                        <button className="aw-btn aw-btn--ghost aw-btn--xs" onClick={() => handleViewDetail(w.id)} title="View details">
                          <Eye size={14} /> View
                        </button>
                        {w.status === 'Pending' && (
                          <>
                            <button className="aw-btn aw-btn--success aw-btn--xs" disabled={actionLoading === w.id}
                              onClick={() => setConfirm({ msg: `Approve ${w.fullName} as a wholesaler?`, onConfirm: () => handleAction(w.id, 'approve') })}>
                              <Check size={14} /> Approve
                            </button>
                            <button className="aw-btn aw-btn--danger aw-btn--xs" disabled={actionLoading === w.id}
                              onClick={() => setConfirm({ msg: `Reject ${w.fullName}'s wholesaler application?`, onConfirm: () => handleAction(w.id, 'reject') })}>
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}
                        {w.status === 'Active' && (
                          <button className="aw-btn aw-btn--warning aw-btn--xs" disabled={actionLoading === w.id}
                            onClick={() => setConfirm({ msg: `Suspend ${w.fullName}'s wholesaler account?`, onConfirm: () => handleAction(w.id, 'suspend') })}>
                            <AlertTriangle size={14} /> Suspend
                          </button>
                        )}
                        {w.status === 'Suspended' && (
                          <button className="aw-btn aw-btn--success aw-btn--xs" disabled={actionLoading === w.id}
                            onClick={() => setConfirm({ msg: `Reactivate ${w.fullName}'s wholesaler account?`, onConfirm: () => handleAction(w.id, 'approve') })}>
                            <Check size={14} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="aw-pagination">
                <button className="aw-page-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} className={`aw-page-btn ${i === page ? 'aw-page-btn--active' : ''}`} onClick={() => setPage(i)}>
                    {i + 1}
                  </button>
                ))}
                <button className="aw-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          msg={confirm.msg}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {selected && (
        <div className="aw-modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="aw-modal">
            <div className="aw-modal-hdr">
              <h2><Building2 size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#E03E1A' }} />Wholesaler Details</h2>
              <button className="aw-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="aw-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div className="aw-avatar" style={{ width: 52, height: 52, fontSize: '1.2rem' }}>{selected.fullName?.charAt(0) || '?'}</div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{selected.fullName}</h3>
                  <span className={`aw-badge aw-badge--${STATUS_COLORS[selected.status] || 'pending'}`} style={{ marginTop: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {selected.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="aw-detail-grid">
                <div className="aw-detail-item">
                  <label><Mail size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Email</label>
                  <span>{selected.email || '—'}</span>
                </div>
                <div className="aw-detail-item">
                  <label><Phone size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Phone</label>
                  <span>{selected.phone || '—'}</span>
                </div>
                <div className="aw-detail-item">
                  <label><Building2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Business Name</label>
                  <span>{selected.businessName || '—'}</span>
                </div>
                <div className="aw-detail-item">
                  <label><FileText size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Business Type</label>
                  <span>{selected.businessType || '—'}</span>
                </div>
                <div className="aw-detail-item">
                  <label><Hash size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> GST Number</label>
                  <span>{selected.gstNumber || '—'}</span>
                </div>
                <div className="aw-detail-item">
                  <label><MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Address</label>
                  <span>{selected.address || '—'}</span>
                </div>
                <div className="aw-detail-item">
                  <label><Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Registered</label>
                  <span>{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                </div>
                <div className="aw-detail-item">
                  <label><Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Last Updated</label>
                  <span>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                </div>
              </div>

              {selected.notes && (
                <div style={{ marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: 6 }}>Notes</label>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>{selected.notes}</p>
                </div>
              )}
            </div>
            <div className="aw-modal-actions">
              <button className="aw-btn aw-btn--ghost" onClick={() => setSelected(null)}>Close</button>
              {selected.status === 'Pending' && (
                <>
                  <button className="aw-btn aw-btn--success" onClick={() => { setSelected(null); setConfirm({ msg: `Approve ${selected.fullName} as a wholesaler?`, onConfirm: () => handleAction(selected.id, 'approve') }); }}>Approve</button>
                  <button className="aw-btn aw-btn--danger" onClick={() => { setSelected(null); setConfirm({ msg: `Reject ${selected.fullName}'s wholesaler application?`, onConfirm: () => handleAction(selected.id, 'reject') }); }}>Reject</button>
                </>
              )}
              {selected.status === 'Active' && (
                <button className="aw-btn aw-btn--warning" onClick={() => { setSelected(null); setConfirm({ msg: `Suspend ${selected.fullName}'s wholesaler account?`, onConfirm: () => handleAction(selected.id, 'suspend') }); }}>Suspend</button>
              )}
              {selected.status === 'Suspended' && (
                <button className="aw-btn aw-btn--success" onClick={() => { setSelected(null); setConfirm({ msg: `Reactivate ${selected.fullName}'s wholesaler account?`, onConfirm: () => handleAction(selected.id, 'approve') }); }}>Reactivate</button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes awSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default AdminWholesalers;
