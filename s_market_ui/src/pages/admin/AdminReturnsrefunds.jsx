import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/Modal';
import { getAdminOrders, updateOrderStatus } from '../../api/api';
import toast from 'react-hot-toast';
import { exportCSV } from './VendorShared';
import './AdminReturnsrefunds.css';

const PALETTE = ['#E03E1A','#2563eb','#16a34a','#7c3aed','#d97706','#0d9488','#db2777','#64748b'];

const STATUS_COLORS = {
  Refunded: '#16a34a',
  Approved: '#2563eb',
  Processing: '#d97706',
  Pending: '#f59e0b',
  Rejected: '#dc2626',
};

const mapOrderToReturn = (order) => ({
  id: order.id,
  orderId: order.orderNumber || `ORD-${order.id}`,
  customer: order.customerName || 'Unknown Customer',
  city: order.deliveryLocation || '—',
  item: `Order #${order.orderNumber || order.id}`,
  amount: order.totalAmount || 0,
  reason: order.returnReason || 'No reason provided',
  returnImages: order.returnImages || [],
  status: order.status === 'RETURN REQUESTED' ? 'Pending'
        : order.status === 'RETURN APPROVED' ? 'Approved'
        : order.status === 'RETURN PROCESSING' ? 'Processing'
        : order.status === 'RETURNED' ? 'Refunded'
        : order.status === 'RETURN REJECTED' ? 'Rejected'
        : order.status || 'Pending',
  date: order.datePlaced
    ? new Date(order.datePlaced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—',
  refundMode: 'Original Payment',
  category: '—',
  vendorId: order.vendorId,
  userId: order.userId,
});

const STATUSES = ['All','Pending','Approved','Processing','Rejected','Refunded'];
const REPLACE_STATUSES = ['All','Replace Pending','Replace Approved','Replace Shipped','Replaced','Rejected'];
const PER_PAGE = 6;

const mapOrderToReplace = (order) => ({
  id: order.id,
  orderId: order.orderNumber || `ORD-${order.id}`,
  customer: order.customerName || 'Unknown Customer',
  city: order.deliveryLocation || '—',
  item: `Order #${order.orderNumber || order.id}`,
  amount: order.totalAmount || 0,
  reason: order.returnReason || 'No reason provided',
  status: order.status === 'REPLACEMENT REQUESTED' ? 'Replace Pending'
        : order.status === 'REPLACEMENT APPROVED' ? 'Replace Approved'
        : order.status === 'REPLACEMENT SHIPPED' ? 'Replace Shipped'
        : order.status === 'REPLACED' ? 'Replaced'
        : order.status === 'REPLACEMENT REJECTED' ? 'Rejected'
        : order.status || 'Replace Pending',
  date: order.datePlaced
    ? new Date(order.datePlaced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—',
  vendorId: order.vendorId,
  userId: order.userId,
});

const initials = (n) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const avatarBg = (n) => PALETTE[n.charCodeAt(0) % PALETTE.length];
const fmt      = (n) => 'Rs.' + Number(n).toLocaleString('en-IN');

const Icon = ({ name, size = 16, color = 'currentColor', sw = 2 }) => {
  const paths = {
    RotateCcw:     'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
    Clock:         'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2',
    DollarSign:    'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    TrendingUp:    'M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6',
    Search:        'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
    Check:         'M20 6 9 17l-5-5',
    X:             'M18 6 6 18M6 6l12 12',
    Eye:           'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    ChevronLeft:   'M15 18l-6-6 6-6',
    ChevronRight:  'M9 18l6-6-6-6',
    Download:      'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    AlertTriangle: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
    User:          'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    MapPin:        'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    Calendar:      'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
    RefreshCw:     'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    Tag:           'M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2zM7 7h.01',
    Package:       'M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
    Plus:          'M12 5v14M5 12h14',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || ''}/>
    </svg>
  );
};

const Avatar = ({ name, size = 'sm' }) => (
  <div className={`rr-avatar rr-avatar--${size}`} style={{ background: avatarBg(name) }}>
    {initials(name)}
  </div>
);

const Badge = ({ status }) => (
  <span className={`rr-badge rr-badge--${status}`}>
    <span className="rr-badge__dot" />
    {status}
  </span>
);

const StatBar = ({ label, count, pct, color, showCount }) => (
  <div>
    <div className="rr-stat-bar__head">
      <span className="rr-stat-bar__label">{label}</span>
      <span className="rr-stat-bar__value">{showCount ? `${count} (${pct}%)` : `${pct}%`}</span>
    </div>
    <div className="rr-stat-bar__track">
      <div className="rr-stat-bar__fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  </div>
);

const KpiCard = ({ label, value, trend, up, iconName, iconColor, iconBg }) => (
  <div className="rr-kpi">
    <div className="rr-kpi__top">
      <div className="rr-kpi__icon" style={{ background: iconBg }}>
        <Icon name={iconName} size={16} color={iconColor} sw={2.1} />
      </div>
      <span className={`rr-kpi__trend rr-kpi__trend--${up ? 'up' : 'down'}`}>
        {up ? '\u2191' : '\u2193'} {trend}
      </span>
    </div>
    <div>
      <div className="rr-kpi__value">{value}</div>
      <div className="rr-kpi__label">{label}</div>
    </div>
  </div>
);

const ReturnDetail = ({ item, onClose, onApprove, onReject, onProcess, onRefund, onViewOrder }) => {
  const steps = [
    { label: 'Return Requested', done: true,  time: item.date },
    { label: 'Return Approved',  done: ['Approved','Processing','Refunded'].includes(item.status), time: item.status !== 'Pending' ? 'Next business day' : '' },
    { label: 'Item Picked Up',   done: ['Processing','Refunded'].includes(item.status), time: ['Processing','Refunded'].includes(item.status) ? 'Within 3 days' : '' },
    { label: 'QC Inspection',    done: item.status === 'Refunded', time: item.status === 'Refunded' ? '2 days after pickup' : '' },
    { label: 'Refund Processed', done: item.status === 'Refunded', time: item.status === 'Refunded' ? '5\u20137 business days' : '' },
  ];

  const infoRows = [
    { label: 'Return ID',   val: item.id },
    { label: 'Order ID',    val: item.orderId },
    { label: 'Amount',      val: fmt(item.amount) },
    { label: 'Return Date', val: item.date },
    { label: 'Refund Mode', val: item.refundMode },
    { label: 'Category',    val: item.category },
  ];

  return (
    <div className="rr-detail">
      <div className="rr-detail__hd">
        <div>
          <p className="rr-detail__hd-title">{item.id} \u2014 Return Detail</p>
          <p className="rr-detail__hd-sub">{item.orderId} \u00B7 {item.item}</p>
        </div>
        <div className="rr-detail__hd-right">
          <Badge status={item.status} />
          <button className="rr-ib rr-ib--close" title="Close" onClick={onClose}>
            <Icon name="X" size={13} />
          </button>
        </div>
      </div>

      <div className="rr-detail__body">
        <div className="rr-detail__left">
          <p className="rr-detail__sec-label">Product</p>
          <div className="rr-product-strip">
            <div className="rr-product-strip__icon">
              <Icon name="Package" size={20} color="#94a3b8" sw={1.6} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="rr-product-strip__name">{item.item}</p>
              <p className="rr-product-strip__meta">{item.category} \u00B7 {item.orderId}</p>
            </div>
            <div className="rr-product-strip__price">{fmt(item.amount)}</div>
          </div>

          <p className="rr-detail__sec-label">Return Reason</p>
          <div className="rr-reason-box">
            <Icon name="AlertTriangle" size={14} color="#92400e" sw={2} />
            <p>{item.reason}</p>
          </div>

          <p className="rr-detail__sec-label">Return Progress</p>
          <div className="rr-timeline">
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              const isCurr = !step.done && (i === 0 || steps[i - 1].done);
              const dotCls = step.done ? 'done' : isCurr ? 'curr' : 'pend';
              return (
                <div key={i} className="rr-tl-step">
                  <div className="rr-tl-step__left">
                    <div className={`rr-tl-step__dot rr-tl-step__dot--${dotCls}`}>
                      {step.done
                        ? <Icon name="Check" size={12} color="#16a34a" sw={2.5} />
                        : <span className="rr-tl-step__dot-inner"
                            style={{ background: isCurr ? '#E03E1A' : '#cbd5e1' }} />
                      }
                    </div>
                    {!isLast && (
                      <div className={`rr-tl-step__line rr-tl-step__line--${step.done ? 'done' : 'pend'}`} />
                    )}
                  </div>
                  <div className={`rr-tl-step__body${isLast ? ' rr-tl-step__body--last' : ''}`}>
                    <p className={`rr-tl-step__title${isCurr ? ' rr-tl-step__title--curr' : ''}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="rr-tl-step__time">
                        <Icon name="Clock" size={11} color="#94a3b8" />{step.time}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rr-detail__right">
          <div>
            <p className="rr-detail__sec-label">Customer</p>
            <div className="rr-customer">
              <Avatar name={item.customer} size="md" />
              <div>
                <p className="rr-customer__name">{item.customer}</p>
                <p className="rr-customer__city">
                  <Icon name="MapPin" size={11} color="#94a3b8" />{item.city}
                </p>
              </div>
            </div>
          </div>

          <div className="rr-divider" />

          <div>
            <p className="rr-detail__sec-label">Refund Info</p>
            {infoRows.map((row, i) => (
              <div key={i} className="rr-info-row">
                <span className="rr-info-row__label">{row.label}</span>
                <span className="rr-info-row__value">{row.val}</span>
              </div>
            ))}
          </div>

          {(item.status === 'Pending' || item.status === 'Approved' || item.status === 'Processing') && (
            <div>
              <p className="rr-detail__sec-label">Actions</p>
              <div className="rr-detail__acts">
                {item.status === 'Pending' && (
                  <>
                    <button className="rr-btn rr-btn--success" onClick={() => onApprove && onApprove(item)}>
                      <Icon name="Check" size={13} color="#16a34a" />Approve Return
                    </button>
                    <button className="rr-btn rr-btn--danger" onClick={() => onReject && onReject(item)}>
                      <Icon name="X" size={13} color="#dc2626" />Reject Return
                    </button>
                  </>
                )}
                {item.status === 'Approved' && (
                  <button className="rr-btn rr-btn--warn" onClick={() => onProcess && onProcess(item)}>
                    <Icon name="RefreshCw" size={13} color="#d97706" />Start Processing
                  </button>
                )}
                {item.status === 'Processing' && (
                  <button className="rr-btn rr-btn--success" onClick={() => onRefund && onRefund(item)}>
                    <Icon name="Check" size={13} color="#16a34a" />Complete Refund
                  </button>
                )}
                <button className="rr-btn rr-btn--outline" onClick={() => onViewOrder && onViewOrder(item)}>
                  <Icon name="Eye" size={13} color="#475569" />View Original Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReturnsRefunds() {
  const [tab, setTab] = useState('returns');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [page, setPage]     = useState(0);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({ page: 0, size: 500 });
      let orders = (res.content || [])
        .filter(o => ['RETURN REQUESTED', 'RETURN APPROVED', 'RETURN PROCESSING', 'RETURNED', 'RETURN REJECTED'].includes(o.status))
        .map(mapOrderToReturn);
      if (search) {
        const q = search.toLowerCase();
        orders = orders.filter(o =>
          o.id.toLowerCase().includes(q) ||
          o.orderId.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q)
        );
      }
      const start = page * PER_PAGE;
      setData(orders.slice(start, start + PER_PAGE));
      setTotalPages(Math.ceil(orders.length / PER_PAGE));
      setTotalElements(orders.length);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch return requests');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await getAdminOrders({ page: 0, size: 500 });
      const returnOrders = (res.content || [])
        .filter(o => ['RETURN REQUESTED', 'RETURN APPROVED', 'RETURN PROCESSING', 'RETURNED', 'RETURN REJECTED'].includes(o.status))
        .map(mapOrderToReturn);
      setAnalyticsData(returnOrders);
    } catch {
      console.warn('Analytics fetch failed');
    }
  }, []);

  useEffect(() => {
    fetchReturns();
    fetchAnalytics();
  }, [fetchReturns, fetchAnalytics]);

  const totalReturns = analyticsData.length;
  const pendingReview = analyticsData.filter(r => r.status === 'Pending').length;
  const refundAmount = analyticsData.reduce((sum, r) => sum + (r.amount || 0), 0);
  const approvedOrRefunded = analyticsData.filter(r => r.status === 'Refunded' || r.status === 'Approved').length;
  const approvalRate = totalReturns ? (approvedOrRefunded / totalReturns) * 100 : 0;

  const filtered = filter === 'All' ? data : data.filter(r => r.status === filter);
  const pageSlice  = filtered;

  const handleApprove = (item) => {
    setActionModal({ type: 'approve', item });
  };

  const handleApproveConfirm = async () => {
    if (!actionModal || !actionModal.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'RETURN APPROVED');
      toast.success('Return approved successfully');
      setDetail(prev => prev && prev.id === actionModal.item.id ? { ...prev, status: 'Approved' } : prev);
      setActionModal(null);
      fetchReturns();
      fetchAnalytics();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve return');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (item) => {
    setActionModal({ type: 'reject', item });
  };

  const handleRejectConfirm = async () => {
    if (!actionModal || !actionModal.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'RETURN REJECTED');
      toast.success('Return rejected successfully');
      setDetail(prev => prev && prev.id === actionModal.item.id ? { ...prev, status: 'Rejected' } : prev);
      setActionModal(null);
      fetchReturns();
      fetchAnalytics();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject return');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = (item) => {
    setActionModal({ type: 'process', item });
  };

  const handleProcessConfirm = async () => {
    if (!actionModal || !actionModal.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'RETURN PROCESSING');
      toast.success('Return marked as processing');
      setDetail(prev => prev && prev.id === actionModal.item.id ? { ...prev, status: 'Processing' } : prev);
      setActionModal(null);
      fetchReturns();
      fetchAnalytics();
    } catch (err) {
      toast.error(err?.message || 'Failed to process return');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = (item) => {
    setActionModal({ type: 'refund', item });
  };

  const handleRefundConfirm = async () => {
    if (!actionModal || !actionModal.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'RETURNED');
      toast.success('Refund completed successfully');
      setDetail(prev => prev && prev.id === actionModal.item.id ? { ...prev, status: 'Refunded' } : prev);
      setActionModal(null);
      fetchReturns();
      fetchAnalytics();
    } catch (err) {
      toast.error(err?.message || 'Failed to complete refund');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewOrder = (item) => {
    setActionModal({ type: 'view', item });
  };

  const handleFilter = (f) => { setFilter(f); setPage(0); setDetail(null); };
  const handleToggle = (r) => setDetail(prev => prev?.id === r.id ? null : r);

  // ── Replacements ──
  const [repData, setRepData] = useState([]);
  const [repTotalPages, setRepTotalPages] = useState(1);
  const [repTotalElements, setRepTotalElements] = useState(0);
  const [repLoading, setRepLoading] = useState(false);
  const [repFilter, setRepFilter] = useState('All');
  const [repSearch, setRepSearch] = useState('');
  const [repPage, setRepPage] = useState(0);
  const [repAnalytics, setRepAnalytics] = useState([]);

  const fetchReplacements = useCallback(async () => {
    setRepLoading(true);
    try {
      const res = await getAdminOrders({ page: 0, size: 500 });
      let orders = (res.content || [])
        .filter(o => ['REPLACEMENT REQUESTED', 'REPLACEMENT APPROVED', 'REPLACEMENT SHIPPED', 'REPLACED', 'REPLACEMENT REJECTED'].includes(o.status))
        .map(mapOrderToReplace);
      if (repSearch) {
        const q = repSearch.toLowerCase();
        orders = orders.filter(o =>
          String(o.id).toLowerCase().includes(q) ||
          o.orderId.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q)
        );
      }
      const start = repPage * PER_PAGE;
      setRepData(orders.slice(start, start + PER_PAGE));
      setRepTotalPages(Math.ceil(orders.length / PER_PAGE));
      setRepTotalElements(orders.length);
      setRepAnalytics(orders);
    } catch { toast.error('Failed to load replacements'); }
    finally { setRepLoading(false); }
  }, [repPage, repSearch]);

  useEffect(() => { if (tab === 'replacements') fetchReplacements(); }, [tab, fetchReplacements]);

  const repFiltered = repFilter === 'All' ? repData : repData.filter(r => r.status === repFilter);

  const handleRepApprove = (item) => setActionModal({ type: 'rep-approve', item });
  const handleRepApproveConfirm = async () => {
    if (!actionModal?.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'REPLACEMENT APPROVED');
      toast.success('Replacement approved');
      setActionModal(null);
      fetchReplacements();
    } catch { toast.error('Failed to approve replacement'); }
    finally { setActionLoading(false); }
  };
  const handleRepShip = (item) => setActionModal({ type: 'rep-ship', item });
  const handleRepShipConfirm = async () => {
    if (!actionModal?.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'REPLACEMENT SHIPPED');
      toast.success('Replacement marked as shipped');
      setActionModal(null);
      fetchReplacements();
    } catch { toast.error('Failed to update replacement'); }
    finally { setActionLoading(false); }
  };
  const handleRepComplete = (item) => setActionModal({ type: 'rep-complete', item });
  const handleRepCompleteConfirm = async () => {
    if (!actionModal?.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'REPLACED');
      toast.success('Replacement completed');
      setActionModal(null);
      fetchReplacements();
    } catch { toast.error('Failed to complete replacement'); }
    finally { setActionLoading(false); }
  };
  const handleRepReject = (item) => setActionModal({ type: 'rep-reject', item });
  const handleRepRejectConfirm = async () => {
    if (!actionModal?.item) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(actionModal.item.id, 'REPLACEMENT REJECTED');
      toast.success('Replacement rejected');
      setActionModal(null);
      fetchReplacements();
    } catch { toast.error('Failed to reject replacement'); }
    finally { setActionLoading(false); }
  };
  const handleRepView = (item) => setActionModal({ type: 'view', item });

  const totalReplacements = repAnalytics.length;
  const repPending = repAnalytics.filter(r => r.status === 'Replace Pending').length;
  const repCompleted = repAnalytics.filter(r => r.status === 'Replaced').length;

  return (
    <div className="rr">

      <div className="rr-hdr">
        <div className="rr-hdr__info">
          <h2 className="rr-hdr__title">{tab === 'returns' ? 'Returns & Refunds' : 'Replacements'}</h2>
          <p className="rr-hdr__sub">{tab === 'returns' ? 'Manage return requests and process customer refunds.' : 'Manage product replacement requests and track shipments.'}</p>
        </div>
        <div className="rr-hdr__actions">
          <div className="rr-tabs" style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:10, padding:4 }}>
            <button className={`rr-tab${tab === 'returns' ? ' active' : ''}`} style={{ padding:'6px 14px', borderRadius:7, border:'none', fontSize:'.8rem', fontWeight:600, cursor:'pointer', background: tab === 'returns' ? '#fff' : 'transparent', color: tab === 'returns' ? '#E03E1A' : '#64748b', boxShadow: tab === 'returns' ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }} onClick={() => setTab('returns')}>Returns & Refunds</button>
            <button className={`rr-tab${tab === 'replacements' ? ' active' : ''}`} style={{ padding:'6px 14px', borderRadius:7, border:'none', fontSize:'.8rem', fontWeight:600, cursor:'pointer', background: tab === 'replacements' ? '#fff' : 'transparent', color: tab === 'replacements' ? '#E03E1A' : '#64748b', boxShadow: tab === 'replacements' ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }} onClick={() => { setTab('replacements'); setActionModal(null); }}>Replacements</button>
          </div>
          <button className="rr-btn rr-btn--outline" title="Export data" onClick={() => {
            if (tab === 'returns') {
              const rows = pageSlice.map(r => [r.orderId, r.customer, r.amount, r.status, r.date, r.reason]);
              exportCSV([['Order ID','Customer','Amount','Status','Date','Reason'], ...rows], 'returns.csv');
            } else {
              const rows = repFiltered.map(r => [r.orderId, r.customer, r.amount, r.status, r.date, r.reason]);
              exportCSV([['Order ID','Customer','Amount','Status','Date','Reason'], ...rows], 'replacements.csv');
            }
            toast.success(`${tab === 'returns' ? 'Returns' : 'Replacements'} exported`);
          }}>
            <Icon name="Download" size={13} color="#475569" />Export
          </button>
          <button className="rr-btn rr-btn--primary" title="Sync with latest data" onClick={() => { tab === 'returns' ? (fetchReturns(), fetchAnalytics()) : fetchReplacements(); }}>
            <Icon name="RefreshCw" size={13} color="#fff" />Sync
          </button>
        </div>
      </div>

      {tab === 'returns' && <>

      <div className="rr-kpi-grid">
        <KpiCard label="Total Returns"  value={String(totalReturns)} trend="All time" up={false} iconName="RotateCcw"  iconColor="#db2777" iconBg="#fce7f3" />
        <KpiCard label="Pending Review" value={String(pendingReview)} trend="Awaiting action" up={false} iconName="Clock" iconColor="#d97706" iconBg="#fef3c7" />
        <KpiCard label="Refund Amount"  value={fmt(refundAmount)} trend="Total issued" up={false} iconName="DollarSign" iconColor="#dc2626" iconBg="#fee2e2" />
        <KpiCard label="Approval Rate"  value={approvalRate.toFixed(1) + '%'} trend={approvedOrRefunded + ' resolved'} up iconName="TrendingUp" iconColor="#16a34a" iconBg="#dcfce7" />
      </div>

      <div className="rr-card">
        <div className="rr-sh">
          <div className="rr-sh__left">
            <p className="rr-sh__title">All Return Requests</p>
            <p className="rr-sh__sub">Review, approve or reject incoming requests</p>
          </div>
          <div className="rr-sh__right">
            <div className="rr-search">
              <span className="rr-search__icon">
                <Icon name="Search" size={14} color="#94a3b8" />
              </span>
              <input
                className="rr-search__input"
                placeholder="Search order, customer\u2026"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); setDetail(null); }}
              />
            </div>
            <div className="rr-pills">
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`rr-pill${filter === s ? ' rr-pill--active' : ''}`}
                  onClick={() => handleFilter(s)}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="rr-table-wrap">
          <table className="rr-tbl">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="rr-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7}><div className="rr-empty">Loading return requests...</div></td></tr>
              )}
              {!loading && pageSlice.length === 0 && (
                <tr><td colSpan={7}><div className="rr-empty">No returns match your search or filter.</div></td></tr>
              )}

              {pageSlice.map(r => (
                <React.Fragment key={r.id}>
                  <tr>
                    <td style={{fontWeight:600}}>{r.orderId}</td>
                    <td>{r.customer}</td>
                    <td>{fmt(r.amount)}</td>
                    <td style={{fontSize:'.78rem', color:'#94a3b8', whiteSpace:'nowrap'}}>{r.date}</td>
                    <td style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.78rem'}}>{r.reason}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                        <button className="rr-ib rr-ib--view" onClick={() => handleToggle(r)} title="Details"><Icon name="Eye" size={13}/></button>
                        {r.status === 'Pending' && (
                          <>
                            <button className="rr-ib" style={{color:'#16a34a'}} onClick={() => handleApprove(r)} title="Approve"><Icon name="Check" size={13}/></button>
                            <button className="rr-ib" style={{color:'#dc2626'}} onClick={() => handleReject(r)} title="Reject"><Icon name="X" size={13}/></button>
                          </>
                        )}
                        {r.status === 'Approved' && (
                          <button className="rr-ib" style={{color:'#d97706'}} onClick={() => handleProcess(r)} title="Process"><Icon name="RefreshCw" size={13}/></button>
                        )}
                        {r.status === 'Processing' && (
                          <button className="rr-ib" style={{color:'#16a34a'}} onClick={() => handleRefund(r)} title="Refund"><Icon name="Check" size={13}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {detail?.id === r.id && (
                    <tr><td colSpan={7} style={{padding:0, border:'none'}}>
                      <ReturnDetail
                        item={r}
                        onClose={() => setDetail(null)}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onProcess={handleProcess}
                        onRefund={handleRefund}
                        onViewOrder={handleViewOrder}
                      />
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rr-pag">
          <span className="rr-pag__info">
            {totalElements === 0
              ? '0 returns'
              : `${page * PER_PAGE + 1}\u2013${Math.min((page + 1) * PER_PAGE, totalElements)} of ${totalElements}`
            }
          </span>
          <div className="rr-pag__ctrl">
            <button className="rr-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <Icon name="ChevronLeft" size={13} color="#475569" />
            </button>
            <span className="rr-pag__label">{page + 1} / {totalPages}</span>
            <button className="rr-pag__btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}>
              <Icon name="ChevronRight" size={13} color="#475569" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={actionModal?.type === 'approve'}
        onClose={() => setActionModal(null)}
        title="Approve Return"
        children={
          <div className="modal-alert modal-alert--info">
            <p>Approve this return request from <strong>{actionModal?.item?.customer}</strong>?</p>
            <p style={{ marginTop: '8px', fontSize: '13px', opacity: 0.85 }}>
              Return ID: {actionModal?.item?.id} \u00B7 Amount: {fmt(actionModal?.item?.amount)}
            </p>
          </div>
        }
        footer={
          <>
            <button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button>
            <button className="modal-btn modal-btn--success" onClick={handleApproveConfirm} disabled={actionLoading}>{actionLoading ? 'Approving...' : 'Approve Return'}</button>
          </>
        }
      />

      <Modal
        isOpen={actionModal?.type === 'reject'}
        onClose={() => setActionModal(null)}
        title="Reject Return"
        children={
          <div className="modal-alert modal-alert--danger">
            <p>Reject this return request from <strong>{actionModal?.item?.customer}</strong>?</p>
            <p style={{ marginTop: '8px', fontSize: '13px', opacity: 0.85 }}>
              Return ID: {actionModal?.item?.id} \u00B7 Amount: {fmt(actionModal?.item?.amount)}
            </p>
          </div>
        }
        footer={
          <>
            <button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button>
            <button className="modal-btn modal-btn--danger" onClick={handleRejectConfirm} disabled={actionLoading}>{actionLoading ? 'Rejecting...' : 'Reject Return'}</button>
          </>
        }
      />

      <Modal
        isOpen={actionModal?.type === 'process'}
        onClose={() => setActionModal(null)}
        title="Start Processing"
        children={
          <div className="modal-alert modal-alert--warn">
            <p>Mark this return as <strong>Processing</strong> for <strong>{actionModal?.item?.customer}</strong>?</p>
            <p style={{ marginTop: '8px', fontSize: '13px', opacity: 0.85 }}>
              Return ID: {actionModal?.item?.id} \u00B7 Amount: {fmt(actionModal?.item?.amount)}
            </p>
          </div>
        }
        footer={
          <>
            <button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button>
            <button className="modal-btn modal-btn--warn" onClick={handleProcessConfirm} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Start Processing'}</button>
          </>
        }
      />

      <Modal
        isOpen={actionModal?.type === 'refund'}
        onClose={() => setActionModal(null)}
        title="Complete Refund"
        children={
          <div className="modal-alert modal-alert--success">
            <p>Complete refund for <strong>{actionModal?.item?.customer}</strong>?</p>
            <p style={{ marginTop: '8px', fontSize: '13px', opacity: 0.85 }}>
              Return ID: {actionModal?.item?.id} \u00B7 Amount: {fmt(actionModal?.item?.amount)} \u00B7 Mode: {actionModal?.item?.refundMode}
            </p>
          </div>
        }
        footer={
          <>
            <button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button>
            <button className="modal-btn modal-btn--success" onClick={handleRefundConfirm} disabled={actionLoading}>{actionLoading ? 'Completing...' : 'Complete Refund'}</button>
          </>
        }
      />

      <Modal
        isOpen={actionModal?.type === 'view'}
        onClose={() => setActionModal(null)}
        title="Order Details"
        children={
          <div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Order ID</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>{actionModal?.item?.orderId}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Product</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>{actionModal?.item?.item}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Customer</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>{actionModal?.item?.customer}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Amount</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>{fmt(actionModal?.item?.amount)}</p>
            </div>
            <div className="modal-alert modal-alert--info">
              Full order details would be fetched from the backend via API: /orders/{actionModal?.item?.orderId}
            </div>
          </div>
        }
        footer={
          <>
            <button className="modal-btn modal-btn--primary" onClick={() => setActionModal(null)}>Close</button>
          </>
        }
      />

      <Modal isOpen={actionModal?.type === 'manualStatus'} onClose={() => setActionModal(null)} title="Update Return Status"
        children={
          <div>
            <p style={{marginBottom:16,color:'#64748b'}}>Order: <strong>{actionModal?.item?.orderId}</strong></p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {['Pending','Approved','Processing','Refunded','Rejected'].filter(s => s !== actionModal?.item?.status).map(s => (
                <button key={s} className="modal-btn modal-btn--secondary" style={{textAlign:'left',justifyContent:'flex-start',width:'100%',padding:'10px 14px'}}
                  onClick={() => handleManualStatusConfirm(s)} disabled={actionLoading}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        }
        footer={<button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)}>Cancel</button>}
      />

      </>}

      {tab === 'replacements' && (
      <>

      <div className="rr-kpi-grid">
        <KpiCard label="Total Replacements" value={String(totalReplacements)} trend="All time" up={false} iconName="RefreshCw" iconColor="#2563eb" iconBg="#dbeafe" />
        <KpiCard label="Pending Approval" value={String(repPending)} trend="Awaiting action" up={false} iconName="Clock" iconColor="#d97706" iconBg="#fef3c7" />
        <KpiCard label="Completed" value={String(repCompleted)} trend="Resolved" up iconName="Check" iconColor="#16a34a" iconBg="#dcfce7" />
        <KpiCard label="Replacement Value" value={fmt(repAnalytics.reduce((s, r) => s + (r.amount || 0), 0))} trend="Total" up={false} iconName="DollarSign" iconColor="#7c3aed" iconBg="#ede9fe" />
      </div>

      <div className="rr-card">
        <div className="rr-sh">
          <div className="rr-sh__left">
            <p className="rr-sh__title">All Replacement Requests</p>
            <p className="rr-sh__sub">Approve, ship, and complete product replacements</p>
          </div>
          <div className="rr-sh__right">
            <div className="rr-search">
              <span className="rr-search__icon"><Icon name="Search" size={14} color="#94a3b8" /></span>
              <input className="rr-search__input" placeholder="Search order, customer\u2026" value={repSearch}
                onChange={e => { setRepSearch(e.target.value); setRepPage(0); setRepDetail(null); }} />
            </div>
            <div className="rr-pills">
              {REPLACE_STATUSES.map(s => (
                <button key={s} className={`rr-pill${repFilter === s ? ' rr-pill--active' : ''}`}
                  onClick={() => { setRepFilter(s); setRepPage(0); }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="rr-table-wrap">
          <table className="rr-tbl">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="rr-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {repLoading && (
                <tr><td colSpan={7}><div className="rr-empty">Loading replacement requests...</div></td></tr>
              )}
              {!repLoading && repFiltered.length === 0 && (
                <tr><td colSpan={7}><div className="rr-empty">No replacements match your search or filter.</div></td></tr>
              )}

              {repFiltered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:600}}>{r.orderId}</td>
                  <td>{r.customer}</td>
                  <td>{fmt(r.amount)}</td>
                  <td style={{fontSize:'.78rem', color:'#94a3b8', whiteSpace:'nowrap'}}>{r.date}</td>
                  <td style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.78rem'}}>{r.reason}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                      <button className="rr-ib rr-ib--view" onClick={() => handleRepView(r)} title="Details"><Icon name="Eye" size={13}/></button>
                      {r.status === 'Replace Pending' && (
                        <>
                          <button className="rr-ib" style={{color:'#16a34a'}} onClick={() => handleRepApprove(r)} title="Approve"><Icon name="Check" size={13}/></button>
                          <button className="rr-ib" style={{color:'#dc2626'}} onClick={() => handleRepReject(r)} title="Reject"><Icon name="X" size={13}/></button>
                        </>
                      )}
                      {r.status === 'Replace Approved' && (
                        <button className="rr-ib" style={{color:'#d97706'}} onClick={() => handleRepShip(r)} title="Ship"><Icon name="RefreshCw" size={13}/></button>
                      )}
                      {r.status === 'Replace Shipped' && (
                        <button className="rr-ib" style={{color:'#16a34a'}} onClick={() => handleRepComplete(r)} title="Complete"><Icon name="Check" size={13}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rr-pag">
          <span className="rr-pag__info">
            {repTotalElements === 0 ? '0 replacements'
              : `${repPage * PER_PAGE + 1}\u2013${Math.min((repPage + 1) * PER_PAGE, repTotalElements)} of ${repTotalElements}`}
          </span>
          <div className="rr-pag__ctrl">
            <button className="rr-pag__btn" onClick={() => setRepPage(p => p - 1)} disabled={repPage === 0}>
              <Icon name="ChevronLeft" size={13} color="#475569" />
            </button>
            <span className="rr-pag__label">{repPage + 1} / {repTotalPages}</span>
            <button className="rr-pag__btn" onClick={() => setRepPage(p => p + 1)} disabled={repPage + 1 >= repTotalPages}>
              <Icon name="ChevronRight" size={13} color="#475569" />
            </button>
          </div>
        </div>
      </div>

      <div className="rr-card">
        <p className="rr-sh__title" style={{ marginBottom: 3 }}>Replacement Summary</p>
        <p className="rr-sh__sub" style={{ marginBottom: 16 }}>Overview of replacement request statuses</p>
        <div className="rr-stat-list">
          {['Replace Pending','Replace Approved','Replace Shipped','Replaced','Rejected'].map(s => {
            const count = repAnalytics.filter(r => r.status === s).length;
            const pct = totalReplacements ? Math.round((count / totalReplacements) * 100) : 0;
            const color = ({ 'Replace Pending':'#f59e0b', 'Replace Approved':'#2563eb', 'Replace Shipped':'#d97706', 'Replaced':'#16a34a', 'Rejected':'#dc2626' })[s] || '#64748b';
            return <StatBar key={s} label={s} count={count} pct={pct} color={color} showCount />;
          })}
        </div>
      </div>

      <Modal isOpen={actionModal?.type === 'rep-approve'} onClose={() => setActionModal(null)} title="Approve Replacement"
        children={<div className="modal-alert modal-alert--info"><p>Approve replacement for <strong>{actionModal?.item?.customer}</strong>?</p><p style={{marginTop:8,fontSize:13,opacity:.85}}>Order: {actionModal?.item?.orderId}</p></div>}
        footer={<><button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button><button className="modal-btn modal-btn--success" onClick={handleRepApproveConfirm} disabled={actionLoading}>{actionLoading ? 'Approving...' : 'Approve Replacement'}</button></>} />

      <Modal isOpen={actionModal?.type === 'rep-reject'} onClose={() => setActionModal(null)} title="Reject Replacement"
        children={<div className="modal-alert modal-alert--danger"><p>Reject replacement for <strong>{actionModal?.item?.customer}</strong>?</p><p style={{marginTop:8,fontSize:13,opacity:.85}}>Order: {actionModal?.item?.orderId}</p></div>}
        footer={<><button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button><button className="modal-btn modal-btn--danger" onClick={handleRepRejectConfirm} disabled={actionLoading}>{actionLoading ? 'Rejecting...' : 'Reject Replacement'}</button></>} />

      <Modal isOpen={actionModal?.type === 'rep-ship'} onClose={() => setActionModal(null)} title="Mark as Shipped"
        children={<div className="modal-alert modal-alert--warn"><p>Mark replacement as <strong>Shipped</strong> for <strong>{actionModal?.item?.customer}</strong>?</p><p style={{marginTop:8,fontSize:13,opacity:.85}}>Order: {actionModal?.item?.orderId}</p></div>}
        footer={<><button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button><button className="modal-btn modal-btn--warn" onClick={handleRepShipConfirm} disabled={actionLoading}>{actionLoading ? 'Updating...' : 'Mark Shipped'}</button></>} />

      <Modal isOpen={actionModal?.type === 'rep-complete'} onClose={() => setActionModal(null)} title="Complete Replacement"
        children={<div className="modal-alert modal-alert--success"><p>Complete replacement for <strong>{actionModal?.item?.customer}</strong>?</p><p style={{marginTop:8,fontSize:13,opacity:.85}}>Order: {actionModal?.item?.orderId}</p></div>}
        footer={<><button className="modal-btn modal-btn--secondary" onClick={() => setActionModal(null)} disabled={actionLoading}>Cancel</button><button className="modal-btn modal-btn--success" onClick={handleRepCompleteConfirm} disabled={actionLoading}>{actionLoading ? 'Completing...' : 'Complete Replacement'}</button></>} />

      </>
      )}

    </div>
  );
}
