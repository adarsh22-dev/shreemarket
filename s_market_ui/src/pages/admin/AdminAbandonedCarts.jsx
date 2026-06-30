import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import {
  getAbandonedCarts, getAbandonedCartStats, sendRecoveryEmail,
  sendBulkRecoveryEmails, dismissAbandonedCart, scanAbandonedCarts
} from '../../api/api';
import './AdminAbandonedCarts.css';

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
  mail:  ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  refresh:['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  eye:   'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  search:'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  download:['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  check:'M20 6 9 17l-5-5',
  x:'M18 6 6 18M6 6l12 12',
  cart:  ['M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z','M3 6h18','M16 10a4 4 0 0 1-8 0'],
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
  zap:   'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  'alert-triangle': ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4M12 17h.01'],
  trendUp: ['M23 6l-9.5 9.5-5-5L1 18'],
};

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const formatDate = (epoch) => {
  if (!epoch) return '—';
  const d = new Date(epoch);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_OPTS = ['All', 'PENDING', 'RECOVERED', 'EXPIRED', 'DISMISSED'];
const STATUS_COLORS = {
  PENDING: '#d97706', RECOVERED: '#16a34a', EXPIRED: '#94a3b8', DISMISSED: '#64748b'
};

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cartsData, statsData] = await Promise.all([
        getAbandonedCarts(),
        getAbandonedCartStats()
      ]);
      setCarts(cartsData || []);
      setStats(statsData || {});
    } catch (err) {
      toast.error(err.message || 'Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const list = carts.filter(c => {
    const matchFilter = filter === 'All' || c.status === filter;
    const matchSearch = !search ||
      (c.emailSentTo && c.emailSentTo.toLowerCase().includes(search.toLowerCase())) ||
      (c.userId && c.userId.toString().includes(search));
    return matchFilter && matchSearch;
  });

  const handleSendRecovery = async (id) => {
    setSending(true);
    try {
      await sendRecoveryEmail(id);
      toast.success('Recovery email sent');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to send recovery email');
    } finally {
      setSending(false);
    }
  };

  const handleBulkRecovery = async () => {
    setSending(true);
    try {
      const result = await sendBulkRecoveryEmails();
      toast.success(`Sent ${result.sent} recovery emails, ${result.skipped} skipped`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to send bulk recovery emails');
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissAbandonedCart(id);
      toast.success('Cart dismissed');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to dismiss');
    }
  };

  const handleScan = async () => {
    try {
      await scanAbandonedCarts();
      toast.success('Abandoned cart scan completed');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to scan');
    }
  };

  const parseItems = (json) => {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  };

  return (
    <div className="ac-root">
      <div className="ac-header">
        <div>
          <h1 className="ac-title">Abandoned Cart Recovery</h1>
          <p className="ac-sub">Detect abandoned carts and send recovery emails to bring customers back</p>
        </div>
        <div className="ac-header-actions">
          <button className="ac-scan-btn" onClick={handleScan} title="Scan for abandoned carts now">
            <Ico d={ICONS.refresh} size={15} color="#475569"/>
            Scan Now
          </button>
          <button className="ac-bulk-btn" onClick={handleBulkRecovery} disabled={sending}>
            <Ico d={ICONS.mail} size={15} color="#fff"/>
            {sending ? 'Sending...' : 'Send All Due'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="ac-stats">
        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{background:'#fef3c7'}}>
            <Ico d={ICONS.cart} size={18} color="#d97706"/>
          </div>
          <div>
            <div className="ac-stat-val">{stats.pending || 0}</div>
            <div className="ac-stat-lbl">Pending Recovery</div>
          </div>
        </div>
        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{background:'#dcfce7'}}>
            <Ico d={ICONS.check} size={18} color="#16a34a"/>
          </div>
          <div>
            <div className="ac-stat-val">{stats.recovered || 0}</div>
            <div className="ac-stat-lbl">Recovered</div>
          </div>
        </div>
        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{background:'#ede9fe'}}>
            <Ico d={ICONS.trendUp} size={18} color="#7c3aed"/>
          </div>
          <div>
            <div className="ac-stat-val">{stats.recoveryRate || 0}%</div>
            <div className="ac-stat-lbl">Recovery Rate</div>
          </div>
        </div>
        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{background:'#dbeafe'}}>
            <Ico d={ICONS.zap} size={18} color="#2563eb"/>
          </div>
          <div>
            <div className="ac-stat-val">{fmt(stats.totalRecoveredValue || 0)}</div>
            <div className="ac-stat-lbl">Recovered Value</div>
          </div>
        </div>
      </div>

      {/* Settings Info */}
      <div className="ac-settings-bar">
        <div className="ac-settings-item">
          <span className="ac-settings-label">Threshold:</span>
          <span className="ac-settings-value">{stats.thresholdHours || 2}h idle</span>
        </div>
        <div className="ac-settings-item">
          <span className="ac-settings-label">Max Attempts:</span>
          <span className="ac-settings-value">{stats.maxRecoveryAttempts || 3}</span>
        </div>
        <div className="ac-settings-item">
          <span className="ac-settings-label">Recovery Interval:</span>
          <span className="ac-settings-value">{stats.recoveryIntervalHours || 24}h</span>
        </div>
        <div className="ac-settings-item">
          <span className="ac-settings-label">Total Carts:</span>
          <span className="ac-settings-value">{stats.total || 0}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ac-toolbar">
        <div className="ac-search">
          <Ico d={ICONS.search} size={14} color="#94a3b8"/>
          <input placeholder="Search by email or user ID..." value={search}
            onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="ac-tabs">
          {STATUS_OPTS.map(f => (
            <button key={f} className={`ac-tab${filter === f ? ' ac-tab--act' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ac-table-wrap">
        <table className="ac-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Cart Value</th>
              <th>Items</th>
              <th>Abandoned</th>
              <th>Attempts</th>
              <th>Status</th>
              <th className="ac-th-r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="ac-loading">Loading abandoned carts...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="7" className="ac-empty">No abandoned carts found</td></tr>
            ) : list.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="ac-user">
                    <div className="ac-user-avatar" style={{background: STATUS_COLORS[c.status] || '#6366f1'}}>
                      {(c.emailSentTo || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="ac-user-email">{c.emailSentTo || 'No email'}</div>
                      <div className="ac-user-id">User #{c.userId}</div>
                    </div>
                  </div>
                </td>
                <td><span className="ac-total">{fmt(c.cartTotal)}</span></td>
                <td><span className="ac-items">{c.itemCount || 0} items</span></td>
                <td><span className="ac-date">{formatDate(c.abandonedAt)}</span></td>
                <td>
                  <span className="ac-attempts">
                    {c.recoveryAttempts || 0}/{stats.maxRecoveryAttempts || 3}
                  </span>
                </td>
                <td>
                  <span className="ac-status" style={{
                    background: (STATUS_COLORS[c.status] || '#64748b') + '20',
                    color: STATUS_COLORS[c.status] || '#64748b'
                  }}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <div className="ac-actions">
                    <button className="ac-action-btn" onClick={() => setViewModal(c)} title="View details">
                      <Ico d={ICONS.eye} size={13}/>
                    </button>
                    {c.status === 'PENDING' && (
                      <>
                        <button className="ac-action-btn ac-action-btn--mail"
                          onClick={() => handleSendRecovery(c.id)} disabled={sending} title="Send recovery email">
                          <Ico d={ICONS.mail} size={13}/>
                        </button>
                        <button className="ac-action-btn ac-action-btn--dismiss"
                          onClick={() => handleDismiss(c.id)} title="Dismiss">
                          <Ico d={ICONS.x} size={13}/>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <Modal isOpen={viewModal !== null} onClose={() => setViewModal(null)}
        title="Abandoned Cart Details" sub={viewModal ? `User #${viewModal.userId}` : ''}>
        {viewModal && (
          <div className="ac-modal-content">
            <div className="ac-modal-grid">
              <div className="ac-modal-field">
                <span className="ac-modal-label">Status</span>
                <span className="ac-modal-value">
                  <span className="ac-status" style={{
                    background: (STATUS_COLORS[viewModal.status] || '#64748b') + '20',
                    color: STATUS_COLORS[viewModal.status] || '#64748b'
                  }}>{viewModal.status}</span>
                </span>
              </div>
              <div className="ac-modal-field">
                <span className="ac-modal-label">Cart Total</span>
                <span className="ac-modal-value ac-modal-total">{fmt(viewModal.cartTotal)}</span>
              </div>
              <div className="ac-modal-field">
                <span className="ac-modal-label">Items</span>
                <span className="ac-modal-value">{viewModal.itemCount || 0}</span>
              </div>
              <div className="ac-modal-field">
                <span className="ac-modal-label">Recovery Attempts</span>
                <span className="ac-modal-value">{viewModal.recoveryAttempts || 0}</span>
              </div>
              <div className="ac-modal-field">
                <span className="ac-modal-label">Abandoned At</span>
                <span className="ac-modal-value">{formatDate(viewModal.abandonedAt)}</span>
              </div>
              <div className="ac-modal-field">
                <span className="ac-modal-label">Email Sent To</span>
                <span className="ac-modal-value">{viewModal.emailSentTo || '—'}</span>
              </div>
            </div>
            {viewModal.cartSummary && (
              <div className="ac-modal-items">
                <span className="ac-modal-label">Cart Items</span>
                <div className="ac-modal-items-list">
                  {parseItems(viewModal.cartSummary).map((item, i) => (
                    <div key={i} className="ac-modal-item">
                      <span className="ac-modal-item-name">{item.productName || 'Product'}</span>
                      <span className="ac-modal-item-qty">x{item.quantity || 1}</span>
                      <span className="ac-modal-item-price">{fmt(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewModal.status === 'PENDING' && (
              <div className="ac-modal-actions">
                <button className="ac-btn ac-btn--pri" onClick={() => { handleSendRecovery(viewModal.id); setViewModal(null); }}>
                  <Ico d={ICONS.mail} size={14} color="#fff"/> Send Recovery Email
                </button>
                <button className="ac-btn ac-btn--sec" onClick={() => { handleDismiss(viewModal.id); setViewModal(null); }}>
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
