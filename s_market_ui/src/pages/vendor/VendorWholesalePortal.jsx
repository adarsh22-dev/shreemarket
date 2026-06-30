import React, { useState, useEffect, useCallback } from 'react';
import {
    Package, TrendingUp, DollarSign, Layers, RefreshCw,
    Search, Check, X, Edit2, ToggleLeft, AlertTriangle,
    ShoppingCart, Eye, Building2, Mail, Phone, FileText,
    MessageSquare, Send, UserCheck, UserX, Clock, Hash,
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import {
    getVendorWholesaleDashboard,
    getVendorWholesaleProducts,
    updateVendorWholesaleProduct,
    getVendorWholesaleOrders,
    getVendorWholesaleRfqs,
    respondToWholesaleRfq,
    getVendorWholesaleOverrides,
    setVendorWholesaleOverride,
    deleteVendorWholesaleOverride,
} from '../../api/api';
import './VendorWholesalePortal.css';

const VendorWholesalePortal = () => {
    const [dashboard, setDashboard] = useState(null);
    const [products, setProducts] = useState([]);
    const [wholesaleOrders, setWholesaleOrders] = useState([]);
    const [rfqs, setRfqs] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [editModal, setEditModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [rfqFilter, setRfqFilter] = useState('ALL');
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideForm, setOverrideForm] = useState({ wholesalerId: '', productId: '', customPrice: '' });
    const [showOrderDetail, setShowOrderDetail] = useState(null);
    const [toasts, setToasts] = useState([]);

    const show = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashData, prodData, orderData, rfqData, ovData] = await Promise.all([
                getVendorWholesaleDashboard(),
                getVendorWholesaleProducts(),
                getVendorWholesaleOrders(),
                getVendorWholesaleRfqs(),
                getVendorWholesaleOverrides(),
            ]);
            setDashboard(dashData);
            setProducts(Array.isArray(prodData) ? prodData : []);
            setWholesaleOrders(Array.isArray(orderData) ? orderData : []);
            setRfqs(Array.isArray(rfqData) ? rfqData : []);
            setOverrides(Array.isArray(ovData) ? ovData : []);
        } catch (err) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredProducts = products.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (p.name && p.name.toLowerCase().includes(term)) || (p.sku && p.sku.toLowerCase().includes(term));
    });

    const handleToggleWholesale = async (product) => {
        try {
            await updateVendorWholesaleProduct(product.id, { supportsWholesale: !product.supportsWholesale });
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, supportsWholesale: !p.supportsWholesale } : p));
        } catch (err) {
            show('Failed to toggle', 'error');
        }
    };

    const handleSaveWholesaleSettings = async () => {
        if (!editModal) return;
        setSaving(true);
        try {
            await updateVendorWholesaleProduct(editModal.id, {
                supportsWholesale: editModal.supportsWholesale,
                wholesalePrice: editModal.wholesalePrice ? parseFloat(editModal.wholesalePrice) : null,
                wholesaleDiscountType: editModal.wholesaleDiscountType,
                minimumWholesaleQuantity: editModal.minimumWholesaleQuantity ? parseInt(editModal.minimumWholesaleQuantity) : null,
                wholesaleOnly: editModal.wholesaleOnly,
            });
            setProducts(prev => prev.map(p => p.id === editModal.id ? { ...p, ...editModal } : p));
            setEditModal(null);
            show('Settings saved');
        } catch (err) {
            show('Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRespondRfq = async (id, action, message) => {
        try {
            await respondToWholesaleRfq(id, { action, responseMessage: message || '' });
            show(`RFQ ${action.toLowerCase()}`);
            fetchData();
        } catch (err) {
            show('Failed to respond', 'error');
        }
    };

    const handleSaveOverride = async () => {
        try {
            await setVendorWholesaleOverride({
                wholesalerId: parseInt(overrideForm.wholesalerId),
                productId: parseInt(overrideForm.productId),
                customPrice: parseFloat(overrideForm.customPrice),
            });
            setShowOverrideModal(false);
            setOverrideForm({ wholesalerId: '', productId: '', customPrice: '' });
            show('Override saved');
            fetchData();
        } catch (err) {
            show('Failed to save override', 'error');
        }
    };

    const handleDeleteOverride = async (id) => {
        try {
            await deleteVendorWholesaleOverride(id);
            show('Override removed');
            fetchData();
        } catch (err) {
            show('Failed to delete', 'error');
        }
    };

    const openEditModal = (product) => {
        setEditModal({
            id: product.id,
            name: product.name,
            supportsWholesale: product.supportsWholesale || false,
            wholesalePrice: product.wholesalePrice || '',
            wholesaleDiscountType: product.wholesaleDiscountType || 'fixed',
            minimumWholesaleQuantity: product.minimumWholesaleQuantity || 10,
            wholesaleOnly: product.wholesaleOnly || false,
        });
    };

    const wholesaleProducts = products.filter(p => p.supportsWholesale || p.wholesaleOnly);

    const getStatusBadge = (status) => {
        const map = {
            'in': { label: 'In Stock', cls: 'wp-badge-success' },
            'out': { label: 'Out of Stock', cls: 'wp-badge-danger' },
            'low': { label: 'Low Stock', cls: 'wp-badge-warning' },
            'pending': { label: 'Pending', cls: 'wp-badge-warning' },
            'approved': { label: 'Approved', cls: 'wp-badge-success' },
            'PROCESSING': { label: 'Processing', cls: 'wp-badge-warning' },
            'SHIPPED': { label: 'Shipped', cls: 'wp-badge-info' },
            'DELIVERED': { label: 'Delivered', cls: 'wp-badge-success' },
            'CANCELLED': { label: 'Cancelled', cls: 'wp-badge-danger' },
            'PENDING': { label: 'Pending', cls: 'wp-badge-warning' },
            'ACCEPTED': { label: 'Accepted', cls: 'wp-badge-success' },
            'REJECTED': { label: 'Rejected', cls: 'wp-badge-danger' },
            'COUNTERED': { label: 'Countered', cls: 'wp-badge-info' },
        };
        const s = (status || '').toUpperCase();
        const info = map[s] || map[status] || { label: status || 'Unknown', cls: 'wp-badge-default' };
        return <span className={`wp-badge ${info.cls}`}>{info.label}</span>;
    };

    const formatPrice = (val) => {
        if (val === null || val === undefined) return '—';
        return `₹${parseFloat(val).toFixed(2)}`;
    };

    const formatDate = (ts) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <VendorLayout>
                <div className="wp-loading">
                    <RefreshCw className="spinning" size={32} />
                    <p>Loading wholesale portal...</p>
                </div>
            </VendorLayout>
        );
    }

    return (
        <VendorLayout>
            <div className="wp-container">
                {toasts.map(t => (
                    <div key={t.id} style={{
                        position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 18px', borderRadius: 12,
                        background: t.type === 'success' ? '#16a34a' : '#dc2626',
                        color: '#fff', fontSize: '0.83rem', fontWeight: 600,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                    }}>
                        {t.type === 'success' ? <Check size={15} /> : <X size={15} />}
                        {t.message}
                    </div>
                ))}

                <div className="wp-header">
                    <div>
                        <h1>Wholesale Management</h1>
                        <p>Manage wholesale products, buyer info, RFQs, and pricing overrides</p>
                    </div>
                    <button className="wp-btn wp-btn-primary" onClick={fetchData}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {error && (
                    <div className="wp-error-banner">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                        <button onClick={fetchData}><RefreshCw size={14} /></button>
                    </div>
                )}

                <div className="wp-kpi-row">
                    <div className="wp-kpi-card">
                        <div className="wp-kpi-icon orange"><Package size={22} /></div>
                        <div className="wp-kpi-body">
                            <span className="wp-kpi-value">{dashboard?.totalWholesaleProducts || 0}</span>
                            <span className="wp-kpi-label">Wholesale Products</span>
                            <span className="wp-kpi-sub">of {dashboard?.totalProducts || 0} total</span>
                        </div>
                    </div>
                    <div className="wp-kpi-card">
                        <div className="wp-kpi-icon blue"><Layers size={22} /></div>
                        <div className="wp-kpi-body">
                            <span className="wp-kpi-value">{dashboard?.totalPricingTiers || 0}</span>
                            <span className="wp-kpi-label">Bulk Pricing Tiers</span>
                            <span className="wp-kpi-sub">Across all products</span>
                        </div>
                    </div>
                    <div className="wp-kpi-card">
                        <div className="wp-kpi-icon green"><ShoppingCart size={22} /></div>
                        <div className="wp-kpi-body">
                            <span className="wp-kpi-value">{dashboard?.wholesaleOrderCount || 0}</span>
                            <span className="wp-kpi-label">Wholesale Orders</span>
                            <span className="wp-kpi-sub">From wholesalers</span>
                        </div>
                    </div>
                    <div className="wp-kpi-card">
                        <div className="wp-kpi-icon purple"><DollarSign size={22} /></div>
                        <div className="wp-kpi-body">
                            <span className="wp-kpi-value">₹{((dashboard?.wholesaleRevenue || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            <span className="wp-kpi-label">Wholesale Revenue</span>
                            <span className="wp-kpi-sub">From bulk orders</span>
                        </div>
                    </div>
                    <div className="wp-kpi-card">
                        <div className="wp-kpi-icon red"><MessageSquare size={22} /></div>
                        <div className="wp-kpi-body">
                            <span className="wp-kpi-value">{dashboard?.pendingRfqCount || 0}</span>
                            <span className="wp-kpi-label">Pending RFQs</span>
                            <span className="wp-kpi-sub">Awaiting response</span>
                        </div>
                    </div>
                </div>

                <div className="wp-tabs-row">
                    <button className={`wp-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <Package size={16} /> Overview
                    </button>
                    <button className={`wp-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        <Layers size={16} /> Products ({wholesaleProducts.length})
                    </button>
                    <button className={`wp-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <ShoppingCart size={16} /> Orders ({wholesaleOrders.length})
                    </button>
                    <button className={`wp-tab ${activeTab === 'rfqs' ? 'active' : ''}`} onClick={() => setActiveTab('rfqs')}>
                        <MessageSquare size={16} /> RFQs ({dashboard?.pendingRfqCount || 0})
                    </button>
                    <button className={`wp-tab ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>
                        <DollarSign size={16} /> Per-Wholesaler Pricing
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <div className="wp-card">
                        <div className="wp-card-header"><h3>Quick Overview</h3></div>
                        <div className="wp-overview-grid">
                            <div className="wp-overview-item">
                                <strong>Wholesale Products</strong>
                                <span>{wholesaleProducts.length} products enabled for wholesale ({products.filter(p => p.wholesaleOnly).length} wholesale-only)</span>
                            </div>
                            <div className="wp-overview-item">
                                <strong>Bulk Pricing Tiers</strong>
                                <span>{dashboard?.totalPricingTiers || 0} tier rules configured</span>
                            </div>
                            <div className="wp-overview-item">
                                <strong>Pending RFQs</strong>
                                <span>{dashboard?.pendingRfqCount || 0} requests awaiting your response</span>
                            </div>
                            <div className="wp-overview-item">
                                <strong>Per-Wholesaler Overrides</strong>
                                <span>{overrides.length} custom pricing rules set</span>
                            </div>
                        </div>
                        <div className="wp-tip">
                            <TrendingUp size={16} />
                            Enable wholesale-only visibility to hide products from regular customers. Use RFQs to negotiate bulk deals. Set per-wholesaler pricing for your best B2B buyers.
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="wp-card">
                        <div className="wp-card-header">
                            <h3>Wholesale Products</h3>
                            <div className="wp-search-box">
                                <Search size={16} />
                                <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        {filteredProducts.length === 0 ? (
                            <div className="wp-empty">
                                <Package size={48} />
                                <h3>No Products Found</h3>
                                <p>Enable wholesale on your products to manage them here.</p>
                            </div>
                        ) : (
                            <div className="wp-table-wrap">
                                <table className="wp-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>SKU</th>
                                            <th>Status</th>
                                            <th>Wholesale</th>
                                            <th>Wholesale Only</th>
                                            <th>Wholesale Price</th>
                                            <th>Min Qty</th>
                                            <th>Pricing Tiers</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map(p => (
                                            <tr key={p.id}>
                                                <td className="wp-cell-name">{p.name}</td>
                                                <td className="wp-cell-sku">{p.sku || '—'}</td>
                                                <td>{getStatusBadge(p.status)}</td>
                                                <td>
                                                    <span className={`wp-toggle-label ${p.supportsWholesale ? 'enabled' : 'disabled'}`}>
                                                        {p.supportsWholesale ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {p.wholesaleOnly ? <span className="wp-badge wp-badge-info">Yes</span> : '—'}
                                                </td>
                                                <td>{p.supportsWholesale ? formatPrice(p.wholesalePrice) : '—'}</td>
                                                <td>{p.supportsWholesale ? (p.minimumWholesaleQuantity || '—') : '—'}</td>
                                                <td><span className="wp-tier-count">{p.pricingTiers?.length || 0} tiers</span></td>
                                                <td>
                                                    <div className="wp-actions">
                                                        <button className="wp-action-btn" title="Toggle Wholesale" onClick={() => handleToggleWholesale(p)}>
                                                            <ToggleLeft size={15} />
                                                        </button>
                                                        <button className="wp-action-btn" title="Edit Settings" onClick={() => openEditModal(p)}>
                                                            <Edit2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="wp-card">
                        <div className="wp-card-header">
                            <h3>Wholesale Orders</h3>
                            <p>Orders from registered wholesalers or containing wholesale quantities</p>
                        </div>
                        {wholesaleOrders.length === 0 ? (
                            <div className="wp-empty">
                                <ShoppingCart size={48} />
                                <h3>No Wholesale Orders</h3>
                                <p>Wholesale orders will appear here when wholesalers place bulk orders.</p>
                            </div>
                        ) : (
                            <div className="wp-table-wrap">
                                <table className="wp-table">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Wholesaler</th>
                                            <th>Contact</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wholesaleOrders.map((o, i) => (
                                            <tr key={o.orderId || i}>
                                                <td className="wp-cell-order">{o.orderNumber || `#${o.orderId}`}</td>
                                                <td>
                                                    {o.wholesalerId ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Building2 size={14} color="#E03E1A" />
                                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{o.wholesalerName || 'Wholesaler'}</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{o.customerName || 'Customer'}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {o.wholesalerId ? (
                                                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                            {o.wholesalerEmail && <div><Mail size={10} style={{ marginRight: 3 }} />{o.wholesalerEmail}</div>}
                                                            {o.wholesalerPhone && <div><Phone size={10} style={{ marginRight: 3 }} />{o.wholesalerPhone}</div>}
                                                            {o.wholesalerGst && <div><Hash size={10} style={{ marginRight: 3 }} />{o.wholesalerGst}</div>}
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                                <td>
                                                    <div className="wp-order-items">
                                                        {(o.items || []).map((item, idx) => (
                                                            <div key={idx} className="wp-order-item">
                                                                <span>{item.productName}</span>
                                                                <span className="wp-order-qty">x{item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="wp-cell-amount">{formatPrice(o.totalAmount)}</td>
                                                <td>{getStatusBadge(o.status)}</td>
                                                <td className="wp-cell-date">{formatDate(o.datePlaced)}</td>
                                                <td>
                                                    <button className="wp-action-btn" title="View Details" onClick={() => setShowOrderDetail(o)}>
                                                        <Eye size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rfqs' && (
                    <div className="wp-card">
                        <div className="wp-card-header">
                            <h3>Request for Quotes (RFQs)</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED'].map(f => (
                                    <button key={f} className={`wp-btn ${rfqFilter === f ? 'wp-btn-primary' : 'wp-btn-secondary'}`}
                                        style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                                        onClick={() => setRfqFilter(f)}>{f}</button>
                                ))}
                            </div>
                        </div>
                        {rfqs.length === 0 ? (
                            <div className="wp-empty">
                                <MessageSquare size={48} />
                                <h3>No RFQs Yet</h3>
                                <p>Wholesalers can send quote requests from the wholesale product page.</p>
                            </div>
                        ) : (
                            <div className="wp-table-wrap">
                                <table className="wp-table">
                                    <thead>
                                        <tr>
                                            <th>Wholesaler</th>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Requested Price</th>
                                            <th>Notes</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rfqs
                                            .filter(r => rfqFilter === 'ALL' || r.status === rfqFilter)
                                            .map(r => (
                                            <tr key={r.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.wholesalerName || `WS #${r.wholesalerId}`}</div>
                                                    {r.wholesalerEmail && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.wholesalerEmail}</div>}
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{r.productName}</td>
                                                <td>{r.quantity}</td>
                                                <td>{r.requestedPrice ? formatPrice(r.requestedPrice) : '—'}</td>
                                                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem', color: '#64748b' }}>
                                                    {r.notes || '—'}
                                                </td>
                                                <td>{getStatusBadge(r.status)}</td>
                                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(r.createdAt)}</td>
                                                <td>
                                                    <RfqActions rfq={r} onRespond={handleRespondRfq} formatPrice={formatPrice} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <div className="wp-card">
                        <div className="wp-card-header">
                            <h3>Per-Wholesaler Pricing Overrides</h3>
                            <button className="wp-btn wp-btn-primary" onClick={() => setShowOverrideModal(true)}>
                                <DollarSign size={15} /> Add Override
                            </button>
                        </div>
                        {overrides.length === 0 ? (
                            <div className="wp-empty">
                                <DollarSign size={48} />
                                <h3>No Overrides Set</h3>
                                <p>Set custom wholesale prices for specific wholesalers.</p>
                            </div>
                        ) : (
                            <div className="wp-table-wrap">
                                <table className="wp-table">
                                    <thead>
                                        <tr>
                                            <th>Wholesaler</th>
                                            <th>Product</th>
                                            <th>Custom Price</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overrides.map(o => (
                                            <tr key={o.id}>
                                                <td style={{ fontWeight: 600 }}>{o.wholesalerName || `WS #${o.wholesalerId}`}</td>
                                                <td>{o.productName}</td>
                                                <td style={{ fontWeight: 600, color: '#16a34a' }}>{formatPrice(o.customPrice)}</td>
                                                <td>
                                                    <button className="wp-action-btn" title="Remove" onClick={() => handleDeleteOverride(o.id)}>
                                                        <X size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {editModal && (
                    <div className="wp-modal-overlay" onClick={() => setEditModal(null)}>
                        <div className="wp-modal" onClick={e => e.stopPropagation()}>
                            <div className="wp-modal-header">
                                <h3>Wholesale Settings — {editModal.name}</h3>
                                <button className="wp-modal-close" onClick={() => setEditModal(null)}><X size={20} /></button>
                            </div>
                            <div className="wp-modal-body">
                                <div className="wp-form-group">
                                    <label>Enable Wholesale</label>
                                    <div className="wp-toggle-row">
                                        <button className={`wp-toggle-btn ${editModal.supportsWholesale ? 'on' : 'off'}`}
                                            onClick={() => setEditModal(prev => ({ ...prev, supportsWholesale: !prev.supportsWholesale }))}>
                                            {editModal.supportsWholesale ? <Check size={14} /> : <X size={14} />}
                                            {editModal.supportsWholesale ? ' Enabled' : ' Disabled'}
                                        </button>
                                    </div>
                                </div>
                                <div className="wp-form-group">
                                    <label>Wholesale-Only (hidden from regular customers)</label>
                                    <div className="wp-toggle-row">
                                        <button className={`wp-toggle-btn ${editModal.wholesaleOnly ? 'on' : 'off'}`}
                                            onClick={() => setEditModal(prev => ({ ...prev, wholesaleOnly: !prev.wholesaleOnly }))}>
                                            {editModal.wholesaleOnly ? <Check size={14} /> : <X size={14} />}
                                            {editModal.wholesaleOnly ? ' Yes' : ' No'}
                                        </button>
                                    </div>
                                </div>
                                {editModal.supportsWholesale && (
                                    <>
                                        <div className="wp-form-group">
                                            <label>Wholesale Price (₹)</label>
                                            <input type="number" step="0.01" min="0" className="wp-input"
                                                value={editModal.wholesalePrice}
                                                onChange={e => setEditModal(prev => ({ ...prev, wholesalePrice: e.target.value }))} />
                                        </div>
                                        <div className="wp-form-group">
                                            <label>Discount Type</label>
                                            <select className="wp-select" value={editModal.wholesaleDiscountType}
                                                onChange={e => setEditModal(prev => ({ ...prev, wholesaleDiscountType: e.target.value }))}>
                                                <option value="fixed">Fixed Price</option>
                                                <option value="percentage">Percentage Off</option>
                                            </select>
                                        </div>
                                        <div className="wp-form-group">
                                            <label>Minimum Wholesale Quantity</label>
                                            <input type="number" min="1" className="wp-input"
                                                value={editModal.minimumWholesaleQuantity}
                                                onChange={e => setEditModal(prev => ({ ...prev, minimumWholesaleQuantity: e.target.value }))} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="wp-modal-footer">
                                <button className="wp-btn wp-btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
                                <button className="wp-btn wp-btn-primary" onClick={handleSaveWholesaleSettings} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showOrderDetail && (
                    <div className="wp-modal-overlay" onClick={() => setShowOrderDetail(null)}>
                        <div className="wp-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                            <div className="wp-modal-header">
                                <h3>Order {showOrderDetail.orderNumber}</h3>
                                <button className="wp-modal-close" onClick={() => setShowOrderDetail(null)}><X size={20} /></button>
                            </div>
                            <div className="wp-modal-body">
                                {showOrderDetail.wholesalerId && (
                                    <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, marginBottom: 16, border: '1px solid #bbf7d0' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Building2 size={16} color="#16a34a" /> Wholesaler Info
                                        </h4>
                                        <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            <div><strong>Name:</strong> {showOrderDetail.wholesalerName}</div>
                                            <div><strong>Email:</strong> {showOrderDetail.wholesalerEmail || '—'}</div>
                                            <div><strong>Phone:</strong> {showOrderDetail.wholesalerPhone || '—'}</div>
                                            <div><strong>GST:</strong> {showOrderDetail.wholesalerGst || '—'}</div>
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                                    <div><strong>Order #:</strong> {showOrderDetail.orderNumber}</div>
                                    <div><strong>Status:</strong> {getStatusBadge(showOrderDetail.status)}</div>
                                    <div><strong>Total:</strong> {formatPrice(showOrderDetail.totalAmount)}</div>
                                    <div><strong>Date:</strong> {formatDate(showOrderDetail.datePlaced)}</div>
                                    {showOrderDetail.estimatedDelivery && <div><strong>Est. Delivery:</strong> {formatDate(showOrderDetail.estimatedDelivery)}</div>}
                                    <div><strong>Items:</strong> {(showOrderDetail.items || []).reduce((s, i) => s + i.quantity, 0)} units</div>
                                </div>
                                {(showOrderDetail.items || []).length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 8px' }}>Products</h4>
                                        {showOrderDetail.items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                                                <span>{item.productName} <span style={{ color: '#64748b' }}>x{item.quantity}</span></span>
                                                {item.wholesalePrice && <span style={{ fontWeight: 600 }}>{formatPrice(item.wholesalePrice)}/unit</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="wp-modal-footer">
                                <button className="wp-btn wp-btn-secondary" onClick={() => setShowOrderDetail(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {showOverrideModal && (
                    <div className="wp-modal-overlay" onClick={() => setShowOverrideModal(false)}>
                        <div className="wp-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                            <div className="wp-modal-header">
                                <h3>Add Per-Wholesaler Price Override</h3>
                                <button className="wp-modal-close" onClick={() => setShowOverrideModal(false)}><X size={20} /></button>
                            </div>
                            <div className="wp-modal-body">
                                <div className="wp-form-group">
                                    <label>Wholesaler ID</label>
                                    <input className="wp-input" type="number" min="1"
                                        value={overrideForm.wholesalerId}
                                        onChange={e => setOverrideForm(p => ({ ...p, wholesalerId: e.target.value }))}
                                        placeholder="Enter wholesaler user ID" />
                                </div>
                                <div className="wp-form-group">
                                    <label>Product ID</label>
                                    <input className="wp-input" type="number" min="1"
                                        value={overrideForm.productId}
                                        onChange={e => setOverrideForm(p => ({ ...p, productId: e.target.value }))}
                                        placeholder="Enter product ID" />
                                </div>
                                <div className="wp-form-group">
                                    <label>Custom Price (₹)</label>
                                    <input className="wp-input" type="number" step="0.01" min="0"
                                        value={overrideForm.customPrice}
                                        onChange={e => setOverrideForm(p => ({ ...p, customPrice: e.target.value }))}
                                        placeholder="Enter custom price" />
                                </div>
                            </div>
                            <div className="wp-modal-footer">
                                <button className="wp-btn wp-btn-secondary" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                                <button className="wp-btn wp-btn-primary" onClick={handleSaveOverride}>Save Override</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

const RfqActions = ({ rfq, onRespond, formatPrice }) => {
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [responseMsg, setResponseMsg] = useState('');
    const [counterPrice, setCounterPrice] = useState('');

    if (rfq.status !== 'PENDING') {
        return (
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {rfq.responseMessage && <div>Response: {rfq.responseMessage}</div>}
                {rfq.counterPrice && <div>Counter: {formatPrice(rfq.counterPrice)}</div>}
            </div>
        );
    }

    return (
        <>
            <div style={{ display: 'flex', gap: 4 }}>
                <button className="wp-action-btn" title="Accept" style={{ color: '#16a34a' }}
                    onClick={() => setShowRespondModal(true)}><Check size={15} /></button>
                <button className="wp-action-btn" title="Reject" style={{ color: '#dc2626' }}
                    onClick={() => onRespond(rfq.id, 'REJECTED', '')}><X size={15} /></button>
            </div>
            {showRespondModal && (
                <div className="wp-modal-overlay" onClick={() => setShowRespondModal(false)}>
                    <div className="wp-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="wp-modal-header">
                            <h3>Respond to RFQ — {rfq.productName}</h3>
                            <button className="wp-modal-close" onClick={() => setShowRespondModal(false)}><X size={20} /></button>
                        </div>
                        <div className="wp-modal-body">
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
                                <div><strong>Requested:</strong> {rfq.quantity} units @ {rfq.requestedPrice ? formatPrice(rfq.requestedPrice) : 'negotiable'}/unit</div>
                                {rfq.notes && <div style={{ marginTop: 4, color: '#64748b' }}>Notes: {rfq.notes}</div>}
                            </div>
                            <div className="wp-form-group">
                                <label>Response Message (optional)</label>
                                <textarea className="wp-input" style={{ minHeight: 70, resize: 'vertical' }}
                                    value={responseMsg}
                                    onChange={e => setResponseMsg(e.target.value)}
                                    placeholder="Add a message to the wholesaler..." />
                            </div>
                            <div className="wp-form-group">
                                <label>Counter Price (₹) — leave empty to accept requested price</label>
                                <input className="wp-input" type="number" step="0.01" min="0"
                                    value={counterPrice}
                                    onChange={e => setCounterPrice(e.target.value)}
                                    placeholder="Enter counter offer price" />
                            </div>
                        </div>
                        <div className="wp-modal-footer">
                            <button className="wp-btn wp-btn-secondary" onClick={() => setShowRespondModal(false)}>Cancel</button>
                            <button className="wp-btn wp-btn-success" onClick={() => {
                                if (counterPrice) {
                                    onRespond(rfq.id, 'COUNTERED', responseMsg);
                                } else {
                                    onRespond(rfq.id, 'ACCEPTED', responseMsg);
                                }
                                setShowRespondModal(false);
                            }}>Submit Response</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VendorWholesalePortal;
