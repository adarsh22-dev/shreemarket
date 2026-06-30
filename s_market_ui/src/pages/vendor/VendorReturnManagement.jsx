import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Search, Eye, Check, X, Truck, Package, RefreshCw, ChevronLeft, ChevronRight, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import Modal from '../../components/Modal';
import { getVendorReturns, approveVendorReturn, rejectVendorReturn, processVendorReturn, refundVendorReturn, approveVendorReplacement, rejectVendorReplacement, shipVendorReplacement, completeVendorReplacement, getProduct, BACKEND_URL } from '../../api/api';
import toast from 'react-hot-toast';
import './VendorReturnManagement.css';

const STATUS_MAP = {
    'RETURN REQUESTED': { label: 'Return Requested', color: '#f59e0b', bg: '#fef3c7', step: 0 },
    'RETURN APPROVED': { label: 'Return Approved', color: '#2563eb', bg: '#dbeafe', step: 1 },
    'RETURN PROCESSING': { label: 'Return Processing', color: '#d97706', bg: '#fef3c7', step: 2 },
    'RETURNED': { label: 'Refunded', color: '#16a34a', bg: '#dcfce7', step: 3 },
    'RETURN REJECTED': { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', step: -1 },
    'REPLACEMENT REQUESTED': { label: 'Replacement Requested', color: '#7c3aed', bg: '#ede9fe', step: 0 },
    'REPLACEMENT APPROVED': { label: 'Replacement Approved', color: '#2563eb', bg: '#dbeafe', step: 1 },
    'REPLACEMENT SHIPPED': { label: 'Replacement Shipped', color: '#d97706', bg: '#fef3c7', step: 2 },
    'REPLACED': { label: 'Replaced', color: '#16a34a', bg: '#dcfce7', step: 3 },
    'REPLACEMENT REJECTED': { label: 'Replacement Rejected', color: '#dc2626', bg: '#fee2e2', step: -1 },
};

const VendorReturnManagement = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('returns');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [products, setProducts] = useState({});

    const fetchReturns = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getVendorReturns();
            if (Array.isArray(data)) setReturns(data);
            else setReturns([]);
        } catch (err) {
            console.error('Failed to fetch returns:', err);
            toast.error('Failed to load returns');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReturns(); }, [fetchReturns]);

    const handleAction = async (orderId, actionFn, successMsg) => {
        try {
            await actionFn(orderId);
            toast.success(successMsg);
            fetchReturns();
        } catch (err) {
            toast.error(err.message || 'Action failed');
        }
    };

    const handleViewDetails = async (returnOrder) => {
        setSelectedReturn(returnOrder);
        setShowDetailModal(true);

        // Fetch product data
        if (returnOrder.productQuantities) {
            const productIds = Object.keys(returnOrder.productQuantities);
            const productData = {};
            for (const pid of productIds) {
                try {
                    const p = await getProduct(pid);
                    productData[pid] = p;
                } catch { productData[pid] = { id: pid, name: 'Product unavailable' }; }
            }
            setProducts(productData);
        }
    };

    const getStatusInfo = (status) => STATUS_MAP[status?.toUpperCase()] || { label: status || 'Unknown', color: '#6b7280', bg: '#f3f4f6', step: 0 };

    const formatDate = (epoch) => {
        if (!epoch) return 'N/A';
        return new Date(epoch).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isReturn = (order) => order.status?.toUpperCase().includes('RETURN');
    const isReplacement = (order) => order.status?.toUpperCase().includes('REPLACEMENT');

    const filteredReturns = returns.filter(r => {
        if (activeTab === 'returns' && !isReturn(r)) return false;
        if (activeTab === 'replacements' && !isReplacement(r)) return false;
        if (activeTab === 'all') return true;
        if (activeTab.startsWith('status:')) {
            return r.status?.toUpperCase() === activeTab.replace('status:', '');
        }
        return true;
    }).filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (r.orderNumber?.toLowerCase() || '').includes(q) ||
               (r.customerName?.toLowerCase() || '').includes(q) ||
               (r.id?.toString() || '').includes(q);
    });

    const renderStatusBadge = (status) => {
        const info = getStatusInfo(status);
        return <span className="vrm-badge" style={{ background: info.bg, color: info.color }}>{info.label}</span>;
    };

    const returnCount = returns.filter(r => isReturn(r)).length;
    const replacementCount = returns.filter(r => isReplacement(r)).length;
    const pendingReturnCount = returns.filter(r => r.status?.toUpperCase() === 'RETURN REQUESTED').length;
    const pendingReplacementCount = returns.filter(r => r.status?.toUpperCase() === 'REPLACEMENT REQUESTED').length;

    return (
        <VendorLayout>
            <div className="vrm-container">
                {/* Header */}
                <div className="vrm-header">
                    <div>
                        <h1>Returns & Refunds</h1>
                        <p>Manage customer return requests, replacements, and process refunds for your store.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="vrm-kpi-row">
                    <div className="vrm-kpi">
                        <div className="vrm-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <RotateCcw size={20} />
                        </div>
                        <div className="vrm-kpi-info">
                            <span className="vrm-kpi-value">{returnCount}</span>
                            <span className="vrm-kpi-label">Total Returns</span>
                        </div>
                    </div>
                    <div className="vrm-kpi">
                        <div className="vrm-kpi-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div className="vrm-kpi-info">
                            <span className="vrm-kpi-value">{pendingReturnCount}</span>
                            <span className="vrm-kpi-label">Pending Return Review</span>
                        </div>
                    </div>
                    <div className="vrm-kpi">
                        <div className="vrm-kpi-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                            <RefreshCw size={20} />
                        </div>
                        <div className="vrm-kpi-info">
                            <span className="vrm-kpi-value">{replacementCount}</span>
                            <span className="vrm-kpi-label">Total Replacements</span>
                        </div>
                    </div>
                    <div className="vrm-kpi">
                        <div className="vrm-kpi-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                            <Clock size={20} />
                        </div>
                        <div className="vrm-kpi-info">
                            <span className="vrm-kpi-value">{pendingReplacementCount}</span>
                            <span className="vrm-kpi-label">Pending Replacement</span>
                        </div>
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="vrm-controls">
                    <div className="vrm-tabs">
                        <button className={`vrm-tab ${activeTab === 'returns' ? 'active' : ''}`} onClick={() => setActiveTab('returns')}>
                            Returns {returnCount > 0 && <span className="vrm-tab-count">{returnCount}</span>}
                        </button>
                        <button className={`vrm-tab ${activeTab === 'replacements' ? 'active' : ''}`} onClick={() => setActiveTab('replacements')}>
                            Replacements {replacementCount > 0 && <span className="vrm-tab-count">{replacementCount}</span>}
                        </button>
                    </div>
                    <div className="vrm-search">
                        <Search size={16} />
                        <input type="text" placeholder="Search by order ID or customer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="vrm-loading">Loading return requests...</div>
                ) : filteredReturns.length === 0 ? (
                    <div className="vrm-empty">
                        <RotateCcw size={48} color="#d1d5db" />
                        <h3>No {activeTab === 'returns' ? 'Return' : 'Replacement'} Requests</h3>
                        <p>When customers request returns or replacements, they will appear here.</p>
                    </div>
                ) : (
                    <div className="vrm-table-wrap">
                        <table className="vrm-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th className="vrm-th-r">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReturns.map(r => {
                                    const info = getStatusInfo(r.status);
                                    return (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight:600, color:'#0f172a' }}>{r.orderNumber || `#${r.id}`}</td>
                                            <td>{r.customerName || 'N/A'}</td>
                                            <td style={{ fontWeight:600 }}>₹{(r.totalAmount || 0).toFixed(2)}</td>
                                            <td style={{ color:'#64748b', fontSize:'.78rem', whiteSpace:'nowrap' }}>{formatDate(r.datePlaced)}</td>
                                            <td style={{ color:'#64748b', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.returnReason || 'N/A'}</td>
                                            <td>{renderStatusBadge(r.status)}</td>
                                            <td>
                                                <div style={{ display:'flex', gap:4, justifyContent:'flex-end', flexWrap:'wrap' }}>
                                                    <button className="vrm-btn vrm-btn--outline" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleViewDetails(r)}>
                                                        <Eye size={13} /> Details
                                                    </button>
                                                    {r.status?.toUpperCase() === 'RETURN REQUESTED' && (
                                                        <>
                                                            <button className="vrm-btn vrm-btn--success" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, approveVendorReturn, 'Return approved')}>
                                                                <Check size={13} /> Approve
                                                            </button>
                                                            <button className="vrm-btn vrm-btn--danger" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, rejectVendorReturn, 'Return rejected')}>
                                                                <X size={13} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status?.toUpperCase() === 'RETURN APPROVED' && (
                                                        <button className="vrm-btn vrm-btn--warn" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, processVendorReturn, 'Return processing started')}>
                                                            <RefreshCw size={13} /> Process
                                                        </button>
                                                    )}
                                                    {r.status?.toUpperCase() === 'RETURN PROCESSING' && (
                                                        <button className="vrm-btn vrm-btn--success" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, refundVendorReturn, 'Refund completed')}>
                                                            <DollarSign size={13} /> Refund
                                                        </button>
                                                    )}
                                                    {r.status?.toUpperCase() === 'REPLACEMENT REQUESTED' && (
                                                        <>
                                                            <button className="vrm-btn vrm-btn--success" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, approveVendorReplacement, 'Replacement approved')}>
                                                                <Check size={13} /> Approve
                                                            </button>
                                                            <button className="vrm-btn vrm-btn--danger" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, rejectVendorReplacement, 'Replacement rejected')}>
                                                                <X size={13} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status?.toUpperCase() === 'REPLACEMENT APPROVED' && (
                                                        <button className="vrm-btn vrm-btn--warn" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, shipVendorReplacement, 'Replacement marked shipped')}>
                                                            <Truck size={13} /> Ship
                                                        </button>
                                                    )}
                                                    {r.status?.toUpperCase() === 'REPLACEMENT SHIPPED' && (
                                                        <button className="vrm-btn vrm-btn--success" style={{ padding:'4px 10px', fontSize:'.72rem' }} onClick={() => handleAction(r.id, completeVendorReplacement, 'Replacement completed')}>
                                                            <Package size={13} /> Complete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => { setShowDetailModal(false); setSelectedReturn(null); setProducts({}); }}
                    title={`Return Details — ${selectedReturn?.orderNumber || `#${selectedReturn?.id}`}`}
                    footer={
                        <button className="modal-btn modal-btn--primary" onClick={() => setShowDetailModal(false)}>Close</button>
                    }
                >
                    {selectedReturn && (
                        <div className="vrm-detail-content">
                            <div className="vrm-detail-grid">
                                <div className="vrm-detail-item">
                                    <span className="vrm-detail-label">Status</span>
                                    {renderStatusBadge(selectedReturn.status)}
                                </div>
                                <div className="vrm-detail-item">
                                    <span className="vrm-detail-label">Customer</span>
                                    <span>{selectedReturn.customerName || 'N/A'}</span>
                                </div>
                                <div className="vrm-detail-item">
                                    <span className="vrm-detail-label">Total Amount</span>
                                    <span className="vrm-detail-amount">₹{(selectedReturn.totalAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="vrm-detail-item">
                                    <span className="vrm-detail-label">Date</span>
                                    <span>{formatDate(selectedReturn.datePlaced)}</span>
                                </div>
                                <div className="vrm-detail-item">
                                    <span className="vrm-detail-label">Delivery Location</span>
                                    <span>{selectedReturn.deliveryLocation || 'N/A'}</span>
                                </div>
                                <div className="vrm-detail-item">
                                    <span className="vrm-detail-label">Payment Method</span>
                                    <span>{selectedReturn.paymentMethod || 'N/A'}</span>
                                </div>
                            </div>

                            {selectedReturn.returnReason && (
                                <div className="vrm-detail-section">
                                    <h4>Return Reason</h4>
                                    <p className="vrm-detail-reason">{selectedReturn.returnReason}</p>
                                </div>
                            )}

                            {selectedReturn.returnImages && selectedReturn.returnImages.length > 0 && (
                                <div className="vrm-detail-section">
                                    <h4>Return Images</h4>
                                    <div className="vrm-detail-images">
                                        {selectedReturn.returnImages.map((img, i) => (
                                            <img key={i} src={`${BACKEND_URL}/uploads/returns/${img}`} alt={`Return ${i+1}`} className="vrm-return-img" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="vrm-detail-section">
                                <h4>Products in Order</h4>
                                {selectedReturn.productQuantities && Object.keys(selectedReturn.productQuantities).length > 0 ? (
                                    <div className="vrm-product-list">
                                        {Object.entries(selectedReturn.productQuantities).map(([productId, qty]) => {
                                            const product = products[productId];
                                            return (
                                                <div key={productId} className="vrm-product-item">
                                                    <div className="vrm-product-info">
                                                        <span className="vrm-product-name">{product?.name || `Product #${productId}`}</span>
                                                        {product?.sku && <span className="vrm-product-sku">SKU: {product.sku}</span>}
                                                    </div>
                                                    <span className="vrm-product-qty">Qty: {qty}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="vrm-no-data">No product data available.</p>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </VendorLayout>
    );
};

export default VendorReturnManagement;
