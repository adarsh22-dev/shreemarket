import React, { useState, useEffect, useCallback } from 'react';
import './AdminInventoryAlerts.css';
import { Icon, fmt } from './VendorShared';
import { API_BASE_URL } from '../../api/api';
import toast from 'react-hot-toast';

const API_BASE = API_BASE_URL;

async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export default function AdminInventoryAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [stats, setStats] = useState({});
    const [thresholds, setThresholds] = useState({ criticalThreshold: 0, warningThreshold: 5, lowThreshold: 15, autoScanEnabled: true });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [viewModal, setViewModal] = useState(null);
    const [thresholdModal, setThresholdModal] = useState(false);
    const [thresholdForm, setThresholdForm] = useState({});
    const [notesModal, setNotesModal] = useState(null);
    const [notesInput, setNotesInput] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [alertsData, statsData, thresholdsData, lowStockData] = await Promise.all([
                apiFetch(`${API_BASE}/admin/inventory-alerts`),
                apiFetch(`${API_BASE}/admin/inventory-alerts/stats`),
                apiFetch(`${API_BASE}/admin/inventory-alerts/thresholds`),
                apiFetch(`${API_BASE}/admin/inventory-alerts/low-stock-products`),
            ]);
            setAlerts(Array.isArray(alertsData) ? alertsData : []);
            setStats(statsData || {});
            setThresholds(thresholdsData || {});
            setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : []);
        } catch {
            toast.error('Failed to load inventory alerts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = filter === 'All' ? alerts
        : filter === 'CRITICAL' || filter === 'WARNING' || filter === 'LOW'
            ? alerts.filter(a => a.severity === filter)
            : alerts.filter(a => a.status === filter);

    const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
    const vendorsAffected = new Set(activeAlerts.map(a => a.vendorId)).size;
    const outOfStock = activeAlerts.filter(a => a.severity === 'CRITICAL').length;

    const runScan = async () => {
        try {
            setScanning(true);
            const result = await apiFetch(`${API_BASE}/admin/inventory-alerts/scan`, { method: 'POST' });
            setScanResult(result);
            toast.success(`Scan complete: ${result.newAlerts} new alerts, ${result.resolvedAlerts} resolved`);
            fetchData();
        } catch {
            toast.error('Failed to run inventory scan');
        } finally {
            setScanning(false);
        }
    };

    const acknowledgeAlert = async (id) => {
        try {
            await apiFetch(`${API_BASE}/admin/inventory-alerts/${id}/acknowledge`, { method: 'POST' });
            toast.success('Alert acknowledged');
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: Date.now() } : a));
        } catch {
            toast.error('Failed to acknowledge alert');
        }
    };

    const resolveAlert = async (id) => {
        try {
            await apiFetch(`${API_BASE}/admin/inventory-alerts/${id}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ notes: 'Resolved by admin' }),
            });
            toast.success('Alert resolved');
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED', resolvedAt: Date.now() } : a));
        } catch {
            toast.error('Failed to resolve alert');
        }
    };

    const dismissAlert = async (id) => {
        try {
            await apiFetch(`${API_BASE}/admin/inventory-alerts/${id}/dismiss`, { method: 'POST' });
            toast.success('Alert dismissed');
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'DISMISSED' } : a));
        } catch {
            toast.error('Failed to dismiss alert');
        }
    };

    const saveThresholds = async () => {
        try {
            const updated = await apiFetch(`${API_BASE}/admin/inventory-alerts/thresholds`, {
                method: 'PUT',
                body: JSON.stringify(thresholdForm),
            });
            setThresholds(updated);
            setThresholdModal(false);
            toast.success('Thresholds updated');
        } catch {
            toast.error('Failed to update thresholds');
        }
    };

    const saveNotes = async () => {
        if (!notesModal) return;
        try {
            await apiFetch(`${API_BASE}/admin/inventory-alerts/${notesModal.id}/notes`, {
                method: 'PUT',
                body: JSON.stringify({ notes: notesInput }),
            });
            setAlerts(prev => prev.map(a => a.id === notesModal.id ? { ...a, notes: notesInput } : a));
            setNotesModal(null);
            toast.success('Notes saved');
        } catch {
            toast.error('Failed to save notes');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
            case 'WARNING': return { bg: '#fffbeb', color: '#92400e', border: '#fde68a' };
            case 'LOW': return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
            default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return { bg: '#fef2f2', color: '#991b1b' };
            case 'ACKNOWLEDGED': return { bg: '#fffbeb', color: '#92400e' };
            case 'RESOLVED': return { bg: '#dcfce7', color: '#166534' };
            case 'DISMISSED': return { bg: '#f1f5f9', color: '#475569' };
            default: return { bg: '#f1f5f9', color: '#475569' };
        }
    };

    const formatTime = (ms) => {
        if (!ms) return '—';
        const d = new Date(ms);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="vm">
                <div className="vm-hdr">
                    <div>
                        <h2 className="vm-hdr__title">Inventory Alert System</h2>
                        <p className="vm-hdr__sub">Low-stock alerts across all vendors with configurable thresholds</p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Loading inventory alerts...
                </div>
            </div>
        );
    }

    return (
        <div className="vm">
            {/* Header */}
            <div className="vm-hdr">
                <div>
                    <h2 className="vm-hdr__title">Inventory Alert System</h2>
                    <p className="vm-hdr__sub">Low-stock alerts across all vendors with configurable thresholds</p>
                </div>
                <div className="vm-hdr__actions">
                    <button className="vm-btn vm-btn--outline" onClick={() => { setThresholdForm({ ...thresholds }); setThresholdModal(true); }}>
                        <Icon name="Sliders" size={13} color="#475569" />Thresholds
                    </button>
                    <button className="vm-btn vm-btn--outline" onClick={runScan} disabled={scanning}>
                        <Icon name={scanning ? "Loader" : "RefreshCw"} size={13} color="#475569" />
                        {scanning ? 'Scanning...' : 'Scan Now'}
                    </button>
                </div>
            </div>

            {/* Info Alert */}
            <div className="inv-alert-info">
                <Icon name="Info" size={15} color="#2563eb" />
                <span>Inventory alerts are generated based on configurable thresholds. Products below the warning threshold trigger vendor notifications. Out-of-stock products are marked critical.</span>
            </div>

            {/* KPIs */}
            <div className="vm-kpi-grid">
                {[
                    { label: 'Active Alerts', value: stats.totalActive || 0, sub: `${stats.totalAcknowledged || 0} acknowledged`, icon: 'AlertTriangle', c: '#dc2626', bg: '#fef2f2' },
                    { label: 'Critical (Out of Stock)', value: outOfStock, sub: 'Requires immediate action', icon: 'XCircle', c: '#991b1b', bg: '#fef2f2' },
                    { label: 'Vendors Affected', value: vendorsAffected, sub: 'With active alerts', icon: 'Store', c: '#d97706', bg: '#fef3c7' },
                    { label: 'Resolved Today', value: stats.totalResolved || 0, sub: `${stats.totalDismissed || 0} dismissed`, icon: 'CheckCircle', c: '#16a34a', bg: '#dcfce7' },
                ].map((k, i) => (
                    <div key={i} className="vm-kpi">
                        <div className="vm-kpi__top">
                            <div className="vm-kpi__icon" style={{ background: k.bg }}>
                                <Icon name={k.icon} size={18} color={k.c} sw={2.1} />
                            </div>
                        </div>
                        <div>
                            <div className="vm-kpi__value">{k.value}</div>
                            <div className="vm-kpi__label">{k.label}</div>
                            <div className="vm-kpi__sub">{k.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Thresholds Bar */}
            <div className="inv-thresholds-bar">
                <div className="inv-thresholds-bar__title">
                    <Icon name="Sliders" size={16} color="#475569" />
                    <span>Alert Thresholds</span>
                </div>
                <div className="inv-thresholds-bar__items">
                    <div className="inv-threshold-item inv-threshold-item--critical">
                        <span className="inv-threshold-item__label">Critical</span>
                        <span className="inv-threshold-item__val">≤ {thresholds.criticalThreshold} units</span>
                    </div>
                    <div className="inv-threshold-item inv-threshold-item--warning">
                        <span className="inv-threshold-item__label">Warning</span>
                        <span className="inv-threshold-item__val">≤ {thresholds.warningThreshold} units</span>
                    </div>
                    <div className="inv-threshold-item inv-threshold-item--low">
                        <span className="inv-threshold-item__label">Low</span>
                        <span className="inv-threshold-item__val">≤ {thresholds.lowThreshold} units</span>
                    </div>
                    <div className="inv-threshold-item">
                        <span className="inv-threshold-item__label">Auto Scan</span>
                        <span className={`inv-threshold-item__val ${thresholds.autoScanEnabled ? 'inv-on' : 'inv-off'}`}>
                            {thresholds.autoScanEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                </div>
                <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={() => { setThresholdForm({ ...thresholds }); setThresholdModal(true); }}>
                    <Icon name="Edit2" size={12} />Edit
                </button>
            </div>

            {/* Scan Result */}
            {scanResult && (
                <div className="inv-scan-result">
                    <div className="inv-scan-result__header">
                        <Icon name="Scan" size={16} color="#16a34a" />
                        <span>Last Scan Results</span>
                        <button className="inv-scan-result__close" onClick={() => setScanResult(null)}>
                            <Icon name="X" size={14} />
                        </button>
                    </div>
                    <div className="inv-scan-result__grid">
                        <div className="inv-scan-result__item">
                            <span className="inv-scan-result__label">Products Scanned</span>
                            <span className="inv-scan-result__val">{scanResult.totalProductsScanned}</span>
                        </div>
                        <div className="inv-scan-result__item">
                            <span className="inv-scan-result__label">New Alerts</span>
                            <span className="inv-scan-result__val" style={{ color: scanResult.newAlerts > 0 ? '#dc2626' : '#16a34a' }}>{scanResult.newAlerts}</span>
                        </div>
                        <div className="inv-scan-result__item">
                            <span className="inv-scan-result__label">Resolved</span>
                            <span className="inv-scan-result__val" style={{ color: '#16a34a' }}>{scanResult.resolvedAlerts}</span>
                        </div>
                        <div className="inv-scan-result__item">
                            <span className="inv-scan-result__label">Unchanged</span>
                            <span className="inv-scan-result__val">{scanResult.unchanged}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Table */}
            <div className="vm-card">
                <div className="vm-sh">
                    <div>
                        <p className="vm-sh__title">Inventory Alerts</p>
                        <p className="vm-sh__sub">Cross-vendor low-stock alerts sorted by severity</p>
                    </div>
                    <div className="vm-pills">
                        {['All', 'ACTIVE', 'CRITICAL', 'WARNING', 'LOW', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'].map(c => (
                            <button key={c} className={`vm-pill${filter === c ? ' vm-pill--active' : ''}`}
                                onClick={() => setFilter(c)}>{c}</button>
                        ))}
                    </div>
                </div>

                <div className="vm-tw">
                    <table className="vm-tbl">
                        <thead>
                            <tr>
                                <th>Severity</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Vendor</th>
                                <th>Stock</th>
                                <th>Threshold</th>
                                <th>Status</th>
                                <th>Detected</th>
                                <th className="vm-th-r">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, 50).map(alert => {
                                const sevColors = getSeverityColor(alert.severity);
                                const statusColors = getStatusColor(alert.status);
                                return (
                                    <tr key={alert.id} style={{ opacity: alert.status === 'RESOLVED' || alert.status === 'DISMISSED' ? 0.55 : 1 }}>
                                        <td>
                                            <span className="inv-severity-badge" style={{ background: sevColors.bg, color: sevColors.color, border: `1px solid ${sevColors.border}` }}>
                                                {alert.severity === 'CRITICAL' ? '🔴' : alert.severity === 'WARNING' ? '🟡' : '🔵'} {alert.severity}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '.83rem' }}>{alert.productName || 'Product #' + alert.productId}</div>
                                                <div style={{ fontSize: '.68rem', color: '#94a3b8' }}>ID: {alert.productId}</div>
                                            </div>
                                        </td>
                                        <td className="vm-mu">{alert.productSku || '—'}</td>
                                        <td>
                                            <span className="inv-cat-badge">{alert.productCategory || '—'}</span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{alert.vendorName || 'Vendor #' + alert.vendorId}</div>
                                        </td>
                                        <td>
                                            <span className="inv-stock-val" style={{ color: alert.currentStock === 0 ? '#dc2626' : alert.currentStock <= 5 ? '#d97706' : '#2563eb' }}>
                                                {alert.currentStock}
                                            </span>
                                        </td>
                                        <td className="vm-mu">≤ {alert.threshold}</td>
                                        <td>
                                            <span className="inv-status-badge" style={{ background: statusColors.bg, color: statusColors.color }}>
                                                {alert.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '.78rem', color: '#94a3b8' }}>{formatTime(alert.createdAt)}</td>
                                        <td className="vm-td-r">
                                            <div className="vm-acts">
                                                {alert.status === 'ACTIVE' && (
                                                    <>
                                                        <button className="vm-ib vm-ib--edit" onClick={() => acknowledgeAlert(alert.id)} title="Acknowledge">
                                                            <Icon name="Check" size={13} />
                                                        </button>
                                                        <button className="vm-ib vm-ib--view" onClick={() => resolveAlert(alert.id)} title="Resolve">
                                                            <Icon name="CheckCircle" size={13} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="vm-ib vm-ib--view" onClick={() => setViewModal(alert)} title="View Details">
                                                    <Icon name="Eye" size={13} />
                                                </button>
                                                <button className="vm-ib vm-ib--edit" onClick={() => { setNotesModal(alert); setNotesInput(alert.notes || ''); }} title="Add Notes">
                                                    <Icon name="FileText" size={13} />
                                                </button>
                                                {alert.status !== 'DISMISSED' && (
                                                    <button className="vm-ib vm-ib--del" onClick={() => dismissAlert(alert.id)} title="Dismiss">
                                                        <Icon name="X" size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                        No alerts found for this filter
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Low Stock Products (Live) */}
            <div className="vm-card">
                <p className="vm-sh__title" style={{ marginBottom: 4 }}>Low Stock Products (Live Scan)</p>
                <p className="vm-sh__sub" style={{ marginBottom: 16 }}>Products currently below the low threshold across all vendors</p>
                <div className="vm-tw">
                    <table className="vm-tbl">
                        <thead>
                            <tr>
                                <th>Severity</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Vendor</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockProducts.slice(0, 20).map((p, i) => {
                                const sevColors = getSeverityColor(p.severity);
                                return (
                                    <tr key={i}>
                                        <td>
                                            <span className="inv-severity-badge" style={{ background: sevColors.bg, color: sevColors.color, border: `1px solid ${sevColors.border}` }}>
                                                {p.severity === 'CRITICAL' ? '🔴' : p.severity === 'WARNING' ? '🟡' : '🔵'} {p.severity}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, fontSize: '.83rem' }}>{p.name}</td>
                                        <td><span className="inv-cat-badge">{p.category || '—'}</span></td>
                                        <td style={{ fontSize: '.82rem', fontWeight: 600 }}>{p.vendorName}</td>
                                        <td>
                                            <span className="inv-stock-val" style={{ color: p.stock === 0 ? '#dc2626' : p.stock <= 5 ? '#d97706' : '#2563eb' }}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td><span className="inv-status-badge" style={{ background: p.status === 'out' ? '#fef2f2' : '#fffbeb', color: p.status === 'out' ? '#991b1b' : '#92400e' }}>{p.status}</span></td>
                                    </tr>
                                );
                            })}
                            {lowStockProducts.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '.85rem' }}>All products are well stocked</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {viewModal && (
                <div className="vm-overlay" onClick={() => setViewModal(null)}>
                    <div className="vm-modal inv-view-modal" onClick={e => e.stopPropagation()}>
                        <div className="vm-modal__hdr">
                            <div>
                                <p className="vm-modal__title">Alert Details</p>
                                <p className="vm-modal__sub">{viewModal.productName}</p>
                            </div>
                            <button className="vm-ib vm-ib--view" onClick={() => setViewModal(null)}><Icon name="X" size={14} /></button>
                        </div>
                        <div className="inv-view-body">
                            <div className="inv-view-grid">
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Severity</span>
                                    <span className="inv-severity-badge" style={{ background: getSeverityColor(viewModal.severity).bg, color: getSeverityColor(viewModal.severity).color, border: `1px solid ${getSeverityColor(viewModal.severity).border}` }}>
                                        {viewModal.severity}
                                    </span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Status</span>
                                    <span className="inv-status-badge" style={{ background: getStatusColor(viewModal.status).bg, color: getStatusColor(viewModal.status).color }}>
                                        {viewModal.status}
                                    </span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Current Stock</span>
                                    <span className="inv-view-value" style={{ color: viewModal.currentStock === 0 ? '#dc2626' : '#d97706', fontSize: '1.1rem' }}>
                                        {viewModal.currentStock} units
                                    </span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Threshold</span>
                                    <span className="inv-view-value">≤ {viewModal.threshold} units</span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Product ID</span>
                                    <span className="inv-view-value">{viewModal.productId}</span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">SKU</span>
                                    <span className="inv-view-value">{viewModal.productSku || '—'}</span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Category</span>
                                    <span className="inv-view-value">{viewModal.productCategory || '—'}</span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Vendor</span>
                                    <span className="inv-view-value">{viewModal.vendorName}</span>
                                </div>
                                <div className="inv-view-item">
                                    <span className="inv-view-label">Detected</span>
                                    <span className="inv-view-value">{formatTime(viewModal.createdAt)}</span>
                                </div>
                                {viewModal.acknowledgedAt && (
                                    <div className="inv-view-item">
                                        <span className="inv-view-label">Acknowledged</span>
                                        <span className="inv-view-value">{formatTime(viewModal.acknowledgedAt)}</span>
                                    </div>
                                )}
                                {viewModal.resolvedAt && (
                                    <div className="inv-view-item">
                                        <span className="inv-view-label">Resolved</span>
                                        <span className="inv-view-value">{formatTime(viewModal.resolvedAt)}</span>
                                    </div>
                                )}
                            </div>
                            {viewModal.notes && (
                                <div className="inv-view-notes">
                                    <span className="inv-view-label">Admin Notes</span>
                                    <p>{viewModal.notes}</p>
                                </div>
                            )}
                            {viewModal.status === 'ACTIVE' && (
                                <div className="inv-view-actions">
                                    <button className="vm-btn vm-btn--outline" onClick={() => { acknowledgeAlert(viewModal.id); setViewModal(null); }}>
                                        <Icon name="Check" size={13} />Acknowledge
                                    </button>
                                    <button className="vm-btn vm-btn--primary" onClick={() => { resolveAlert(viewModal.id); setViewModal(null); }}>
                                        <Icon name="CheckCircle" size={13} color="#fff" />Resolve
                                    </button>
                                    <button className="vm-btn vm-btn--outline" style={{ borderColor: '#dc2626', color: '#dc2626' }} onClick={() => { dismissAlert(viewModal.id); setViewModal(null); }}>
                                        <Icon name="X" size={13} />Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Threshold Edit Modal */}
            {thresholdModal && (
                <div className="vm-overlay" onClick={() => setThresholdModal(false)}>
                    <div className="vm-modal inv-threshold-modal" onClick={e => e.stopPropagation()}>
                        <div className="vm-modal__hdr">
                            <div>
                                <p className="vm-modal__title">Configure Thresholds</p>
                                <p className="vm-modal__sub">Set alert trigger levels for inventory monitoring</p>
                            </div>
                            <button className="vm-ib vm-ib--view" onClick={() => setThresholdModal(false)}><Icon name="X" size={14} /></button>
                        </div>
                        <div className="inv-threshold-form">
                            <div className="inv-threshold-form__item">
                                <div className="inv-threshold-form__header">
                                    <span className="inv-threshold-form__label inv-threshold-form__label--critical">Critical Threshold (Out of Stock)</span>
                                    <span className="inv-threshold-form__current">Current: ≤ {thresholds.criticalThreshold}</span>
                                </div>
                                <input className="vm-input" type="number" min="0" max="5"
                                    value={thresholdForm.criticalThreshold}
                                    onChange={e => setThresholdForm(f => ({ ...f, criticalThreshold: +e.target.value }))} />
                                <span className="inv-threshold-form__hint">Products with stock at or below this value are marked CRITICAL</span>
                            </div>
                            <div className="inv-threshold-form__item">
                                <div className="inv-threshold-form__header">
                                    <span className="inv-threshold-form__label inv-threshold-form__label--warning">Warning Threshold</span>
                                    <span className="inv-threshold-form__current">Current: ≤ {thresholds.warningThreshold}</span>
                                </div>
                                <input className="vm-input" type="number" min="1" max="20"
                                    value={thresholdForm.warningThreshold}
                                    onChange={e => setThresholdForm(f => ({ ...f, warningThreshold: +e.target.value }))} />
                                <span className="inv-threshold-form__hint">Products with stock at or below this value trigger WARNING alerts</span>
                            </div>
                            <div className="inv-threshold-form__item">
                                <div className="inv-threshold-form__header">
                                    <span className="inv-threshold-form__label inv-threshold-form__label--low">Low Stock Threshold</span>
                                    <span className="inv-threshold-form__current">Current: ≤ {thresholds.lowThreshold}</span>
                                </div>
                                <input className="vm-input" type="number" min="5" max="50"
                                    value={thresholdForm.lowThreshold}
                                    onChange={e => setThresholdForm(f => ({ ...f, lowThreshold: +e.target.value }))} />
                                <span className="inv-threshold-form__hint">Products with stock at or below this value trigger LOW alerts</span>
                            </div>
                            <div className="inv-threshold-form__item inv-threshold-form__item--toggle">
                                <div>
                                    <span className="inv-threshold-form__label">Auto Scan</span>
                                    <span className="inv-threshold-form__hint">Automatically scan products for low stock periodically</span>
                                </div>
                                <button className={`cr-toggle ${thresholdForm.autoScanEnabled ? 'cr-toggle--on' : 'cr-toggle--off'}`}
                                    onClick={() => setThresholdForm(f => ({ ...f, autoScanEnabled: !f.autoScanEnabled }))}>
                                    <span className="cr-toggle__knob" />
                                </button>
                            </div>
                            <div className="vm-modal__acts">
                                <button className="vm-btn vm-btn--outline" style={{ flex: 1 }} onClick={() => setThresholdModal(false)}>Cancel</button>
                                <button className="vm-btn vm-btn--primary" style={{ flex: 1 }} onClick={saveThresholds}>
                                    <Icon name="Save" size={13} color="#fff" />Save Thresholds
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {notesModal && (
                <div className="vm-overlay" onClick={() => setNotesModal(null)}>
                    <div className="vm-modal inv-notes-modal" onClick={e => e.stopPropagation()}>
                        <div className="vm-modal__hdr">
                            <div>
                                <p className="vm-modal__title">Admin Notes</p>
                                <p className="vm-modal__sub">{notesModal.productName}</p>
                            </div>
                            <button className="vm-ib vm-ib--view" onClick={() => setNotesModal(null)}><Icon name="X" size={14} /></button>
                        </div>
                        <div className="inv-notes-body">
                            <textarea className="vm-input inv-notes-textarea" rows={5}
                                value={notesInput} onChange={e => setNotesInput(e.target.value)}
                                placeholder="Add admin notes about this alert..." />
                            <div className="vm-modal__acts">
                                <button className="vm-btn vm-btn--outline" style={{ flex: 1 }} onClick={() => setNotesModal(null)}>Cancel</button>
                                <button className="vm-btn vm-btn--primary" style={{ flex: 1 }} onClick={saveNotes}>
                                    <Icon name="Save" size={13} color="#fff" />Save Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
