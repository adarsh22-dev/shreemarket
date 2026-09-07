import React, { useState, useEffect, useCallback } from 'react';
import { Search, Check, X, AlertTriangle, Eye, ChevronLeft, ChevronRight, Building2, Mail, Phone, MapPin, Calendar, FileText, Hash, KeyRound, Plus } from 'lucide-react';
import { createAdminWholesaler } from '../../api/api';
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
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    businessName: '', businessType: '', gstNumber: '',
    businessAddress: '', businessPhone: '',
    agreeTerms: false, agreePolicies: false,
    gstCertificate: null, businessProof: null, addressProof: null
  });
  const [addLoading, setAddLoading] = useState(false);

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

  const handleResetPassword = (w) => {
    setConfirm({
      msg: `Send a password reset link to ${w.email}? They will receive an email to set a new password.`,
      onConfirm: async () => {
        setActionLoading(w.id);
        try {
          const res = await fetch(`${API}/admin/wholesalers/${w.id}/reset-password`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
          show(`Password reset email sent to ${w.fullName}`, 'success');
          setConfirm(null);
        } catch (err) {
          show(err.message, 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleAddWholesaler = async () => {
    const required = ['fullName', 'email', 'phone', 'password', 'businessName', 'businessType', 'businessAddress', 'businessPhone'];
    const missing = required.filter(field => !addForm[field]?.toString().trim());
    if (missing.length > 0) {
      show(`Please fill in all required fields: ${missing.join(', ')}`, 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
      show('Please enter a valid email address', 'error');
      return;
    }
    if (addForm.password.length < 8) {
      show('Password must be at least 8 characters', 'error');
      return;
    }
    if (!addForm.agreeTerms || !addForm.agreePolicies) {
      show('You must agree to Terms & Conditions and Marketplace Policies', 'error');
      return;
    }
    setAddLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', addForm.fullName.trim());
      formData.append('email', addForm.email.trim());
      formData.append('phone', addForm.phone.trim());
      formData.append('password', addForm.password);
      formData.append('businessName', addForm.businessName.trim());
      formData.append('businessType', addForm.businessType.trim());
      formData.append('gstNumber', addForm.gstNumber?.trim() || '');
      formData.append('businessAddress', addForm.businessAddress.trim());
      formData.append('businessPhone', addForm.businessPhone.trim());
      formData.append('agreeTerms', addForm.agreeTerms);
      formData.append('agreePolicies', addForm.agreePolicies);
      if (addForm.minMonthlyOrderValue) {
        formData.append('minMonthlyOrderValue', addForm.minMonthlyOrderValue);
      }
      if (addForm.gstCertificate) {
        formData.append('gstCertificate', addForm.gstCertificate);
      }
      if (addForm.businessProof) {
        formData.append('businessProof', addForm.businessProof);
      }
      if (addForm.addressProof) {
        formData.append('addressProof', addForm.addressProof);
      }
      
      const newWholesaler = await createAdminWholesaler(formData);
      show(`Wholesaler "${newWholesaler.fullName}" created successfully`, 'success');
      setAddModal(false);
      setAddForm({ fullName: '', email: '', phone: '', password: '', businessName: '', businessType: '', gstNumber: '', businessAddress: '', businessPhone: '', agreeTerms: false, agreePolicies: false, minMonthlyOrderValue: '', gstCertificate: null, businessProof: null, addressProof: null });
      fetchWholesalers();
    } catch (err) {
      show(err.message || 'Failed to create wholesaler', 'error');
    } finally {
      setAddLoading(false);
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
          <button className="aw-btn aw-btn--primary" onClick={() => setAddModal(true)} style={{ marginRight: 12 }}>
            <Plus size={14} style={{ marginRight: 6 }} /> Add Wholesaler
          </button>
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
                        <button className="aw-btn aw-btn--ghost aw-btn--xs" onClick={() => handleResetPassword(w)} disabled={actionLoading === w.id} title="Send password reset link">
                          <KeyRound size={14} /> Reset Password
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
              <button className="aw-btn aw-btn--ghost" onClick={() => { setSelected(null); handleResetPassword(selected); }}><KeyRound size={14} /> Reset Password</button>
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

      {/* Add Wholesaler Modal */}
      {addModal && (
        <div className="aw-modal-overlay" onClick={e => e.target === e.currentTarget && setAddModal(false)}>
          <div className="aw-modal">
            <div className="aw-modal-hdr">
              <h2><Building2 size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#E03E1A' }} />Add New Wholesaler</h2>
              <button className="aw-modal-close" onClick={() => { setAddModal(false); setAddForm({ fullName: '', email: '', phone: '', password: '', businessName: '', businessType: '', gstNumber: '', businessAddress: '', businessPhone: '', agreeTerms: false, agreePolicies: false, minMonthlyOrderValue: '', gstCertificate: null, businessProof: null, addressProof: null }); }}>✕</button>
            </div>
            <div className="aw-modal-body" style={{ padding: 24 }}>
              {/* Personal Information */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #e5e5e5' }}>PERSONAL INFORMATION</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Full Name *</label>
                    <input type="text" value={addForm.fullName} onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box' }} autoFocus />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Email Address *</label>
                    <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="business@example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Phone Number *</label>
                    <input type="text" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Password *</label>
                    <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #e5e5e5' }}>BUSINESS DETAILS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Business Name *</label>
                    <input type="text" value={addForm.businessName} onChange={e => setAddForm(f => ({ ...f, businessName: e.target.value }))} placeholder="My Business Pvt Ltd" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>GST Number</label>
                    <input type="text" value={addForm.gstNumber} onChange={e => setAddForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder="22AAAAA0000A1Z5" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Business Phone *</label>
                    <input type="text" value={addForm.businessPhone} onChange={e => setAddForm(f => ({ ...f, businessPhone: e.target.value }))} placeholder="+91 9876543210" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Business Type *</label>
                    <select value={addForm.businessType} onChange={e => setAddForm(f => ({ ...f, businessType: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box', background: '#fff' }}>
                      <option value="">Select Business Type</option>
                      <option value="Manufacturer">Manufacturer</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Retailer">Retailer</option>
                      <option value="Wholesaler">Wholesaler</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Business Address *</label>
                    <textarea value={addForm.businessAddress} onChange={e => setAddForm(f => ({ ...f, businessAddress: e.target.value }))} placeholder="123, Main Street, City" rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: '0.84rem', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              {/* Document Verification */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #e5e5e5' }}>DOCUMENT VERIFICATION (Optional)</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 16 }}>Upload documents for KYC verification</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>GST Certificate</label>
                    <div style={{ position: 'relative', border: '2px dashed #ddd', borderRadius: 8, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s' }}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAddForm(f => ({ ...f, gstCertificate: e.target.files[0] }))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.8rem', color: addForm.gstCertificate ? '#16a34a' : '#94a3b8' }}>
                        {addForm.gstCertificate ? `✓ ${addForm.gstCertificate.name}` : 'Click to upload'}
                      </span>
                      <p style={{ margin: '8px 0 0', fontSize: '0.65rem', color: '#aaa' }}>JPG, PNG or PDF</p>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Business Proof</label>
                    <div style={{ position: 'relative', border: '2px dashed #ddd', borderRadius: 8, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s' }}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAddForm(f => ({ ...f, businessProof: e.target.files[0] }))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.8rem', color: addForm.businessProof ? '#16a34a' : '#94a3b8' }}>
                        {addForm.businessProof ? `✓ ${addForm.businessProof.name}` : 'Click to upload'}
                      </span>
                      <p style={{ margin: '8px 0 0', fontSize: '0.65rem', color: '#aaa' }}>JPG, PNG or PDF</p>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Address Proof</label>
                    <div style={{ position: 'relative', border: '2px dashed #ddd', borderRadius: 8, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s' }}>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAddForm(f => ({ ...f, addressProof: e.target.files[0] }))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.8rem', color: addForm.addressProof ? '#16a34a' : '#94a3b8' }}>
                        {addForm.addressProof ? `✓ ${addForm.addressProof.name}` : 'Click to upload'}
                      </span>
                      <p style={{ margin: '8px 0 0', fontSize: '0.65rem', color: '#aaa' }}>JPG, PNG or PDF</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agreements */}
              <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={addForm.agreeTerms} onChange={e => setAddForm(f => ({ ...f, agreeTerms: e.target.checked }))} style={{ marginTop: 2, accentColor: '#E03E1A' }} />
                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>I agree to the <strong>Terms & Conditions</strong> *</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                  <input type="checkbox" checked={addForm.agreePolicies} onChange={e => setAddForm(f => ({ ...f, agreePolicies: e.target.checked }))} style={{ marginTop: 2, accentColor: '#E03E1A' }} />
                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>I agree to the <strong>Marketplace Policies</strong> *</span>
                </label>
              </div>
            </div>
            <div className="aw-modal-actions">
              <button className="aw-btn aw-btn--ghost" onClick={() => { setAddModal(false); setAddForm({ fullName: '', email: '', phone: '', password: '', businessName: '', businessType: '', gstNumber: '', businessAddress: '', businessPhone: '', agreeTerms: false, agreePolicies: false, gstCertificate: null, businessProof: null, addressProof: null }); }}>Cancel</button>
              <button className="aw-btn aw-btn--primary" disabled={addLoading} onClick={handleAddWholesaler}>
                {addLoading ? 'Creating...' : 'Create Wholesaler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWholesalers;
