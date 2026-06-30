import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Download,
    Search,
    Calendar,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorOrders.css';
import { fetchVendorOrders, updateOrderStatus, bulkUpdateOrderStatus, getUserDetails, getProduct, BACKEND_URL } from '../../api/api';
import Modal from '../../components/Modal';

const VendorOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Orders');
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkStatus, setBulkStatus] = useState('ACCEPTED');
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);

    // Order detail modal state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderProducts, setOrderProducts] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj.userId) {
                    const data = await fetchVendorOrders(userObj.userId);

                    // Fetch missing user details for orders mapping
                    const uniqueUserIds = [...new Set(data
                        .filter(order => !order.customerName && order.userId)
                        .map(order => order.userId))];

                    const namesMap = {};
                    // Use Promise.all to fetch missing names concurrently
                    await Promise.all(
                        uniqueUserIds.map(async (id) => {
                            try {
                                const userDetails = await getUserDetails(id);
                                namesMap[id] = userDetails.fullName || 'Unknown User';
                            } catch {
                                namesMap[id] = 'Unknown User';
                            }
                        })
                    );

                    // Enrich orders with displayCustomerName
                    const enrichedOrders = data.map(order => ({
                        ...order,
                        displayCustomerName: order.customerName || namesMap[order.userId] || 'N/A'
                    }));

                    setOrders(enrichedOrders);
                    setSelectedIds(new Set()); // Clear selection on data refresh
                }
            }
        } catch (error) {
            console.error("Failed to fetch vendor orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            // After successful update, re-fetch to see the changes
            fetchOrders();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update order status.");
        }
    };

    // ── Bulk selection handlers ──
    const toggleSelect = (orderId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredOrders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredOrders.map(o => o.id)));
        }
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleBulkUpdate = async () => {
        const ids = Array.from(selectedIds).filter(id => id != null);
        if (ids.length === 0) return;

        setBulkProcessing(true);
        setBulkResult(null);
        try {
            const result = await bulkUpdateOrderStatus(ids, bulkStatus);
            setBulkResult(result);
            toast.success(`${result.successCount} order(s) updated to ${bulkStatus}${result.failedCount > 0 ? ', Failed: ' + result.failedCount : ''}`);
            if (result.successCount > 0) {
                fetchOrders();
            }
        } catch (error) {
            console.error("Bulk update failed:", error);
            toast.error("Bulk update failed: " + (error.message || 'Unknown error'));
        } finally {
            setBulkProcessing(false);
            setShowBulkModal(false);
        }
    };

    const handleViewDetails = async (order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
        setDetailLoading(true);
        setOrderProducts([]);

        try {
            if (order.productQuantities && Object.keys(order.productQuantities).length > 0) {
                const productEntries = Object.entries(order.productQuantities);
                const products = await Promise.all(
                    productEntries.map(async ([productId, qty]) => {
                        try {
                            const product = await getProduct(productId);
                            return { ...product, orderedQty: qty };
                        } catch {
                            return { id: productId, name: 'Product unavailable', orderedQty: qty };
                        }
                    })
                );
                setOrderProducts(products);
            }
        } catch (err) {
            console.error('Failed to fetch product details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const getProductImage = (product) => {
        const galleryImages = product.media?.filter(m => m.mediaType !== 'manufacturer') || [];
        if (galleryImages.length > 0) {
            const primary = galleryImages.find(m => m.isPrimary) || galleryImages[0];
            return primary.fileName ? `${BACKEND_URL}/uploads/products/${primary.fileName}` : null;
        }
        return null;
    };

    const exportCSV = () => {
        const headers = ['Order ID','Customer','Date','Amount','Location','Estimated Delivery','Status'];
        const rows = filteredOrders.map(o => [
            o.orderNumber || `#${o.id}`,
            o.displayCustomerName || '--',
            formatDate(o.datePlaced),
            `Rs.${(o.totalAmount || 0).toFixed(2)}`,
            o.deliveryLocation || 'N/A',
            o.estimatedDelivery || 'N/A',
            o.status || 'Pending',
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendor-orders-${activeTab.replace(/\s+/g, '-').toLowerCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast.success(`Exported ${filteredOrders.length} order(s) to CSV`);
    };

    const filteredOrders = orders.filter(order => {
        // Tab filtering
        if (activeTab !== 'All Orders') {
            const status = order.status || 'Pending';
            if (activeTab === 'Returned') {
                const s = status.toLowerCase();
                if (s !== 'returned' && s !== 'return requested') {
                    return false;
                }
            } else if (status.toLowerCase() !== activeTab.toLowerCase()) {
                return false;
            }
        }
        // Search filtering
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const orderIdStr = order.orderNumber ? order.orderNumber.toLowerCase() : `#${order.id}`;
            const customerStr = (order.displayCustomerName || '').toLowerCase();
            if (!orderIdStr.includes(query) && !customerStr.includes(query)) {
                return false;
            }
        }
        return true;
    });

    const getStatusClass = (status) => {
        if (!status) return '';
        switch (status.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'accepted': return 'status-accepted';
            case 'shipped': return 'status-shipped';
            case 'processing': return 'status-processing';
            case 'delivered': return 'status-delivered';
            case 'rejected':
            case 'cancelled': return 'status-returned'; // Reuse red for cancelled/rejected
            case 'returned':
            case 'return requested': return 'status-returned';
            default: return '';
        }
    };

    const formatDate = (epoch) => {
        if (!epoch) return 'N/A';
        const date = new Date(epoch);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <VendorLayout>
            <div className="vendor-orders-container">
                {/* Header Section */}
                <div className="orders-header-row">
                    <div>
                        <h1>Order Management</h1>
                        <p>Track and fulfill your customer orders efficiently</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-export" onClick={exportCSV}>
                            <Download size={18} />
                            Export Orders
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="orders-content-area">
                    {/* Control Bar */}
                    <div className="orders-control-bar">
                        <div className="order-tabs">
                            <button className={`tab-btn ${activeTab === 'All Orders' ? 'active' : ''}`} onClick={() => handleTabClick('All Orders')}>All Orders</button>
                            <button className={`tab-btn ${activeTab === 'Pending' ? 'active' : ''}`} onClick={() => handleTabClick('Pending')}>Pending</button>
                            <button className={`tab-btn ${activeTab === 'Accepted' ? 'active' : ''}`} onClick={() => handleTabClick('Accepted')}>Accepted</button>
                            <button className={`tab-btn ${activeTab === 'Processing' ? 'active' : ''}`} onClick={() => handleTabClick('Processing')}>Processing</button>
                            <button className={`tab-btn ${activeTab === 'Shipped' ? 'active' : ''}`} onClick={() => handleTabClick('Shipped')}>Shipped</button>
                            <button className={`tab-btn ${activeTab === 'Delivered' ? 'active' : ''}`} onClick={() => handleTabClick('Delivered')}>Delivered</button>
                            <button className={`tab-btn ${activeTab === 'Cancelled' ? 'active' : ''}`} onClick={() => handleTabClick('Cancelled')}>Cancelled</button>
                            <button className={`tab-btn ${activeTab === 'Returned' ? 'active' : ''}`} onClick={() => handleTabClick('Returned')}>Returned</button>
                        </div>
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Order ID or customer name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Bulk Action Bar */}
                    {selectedIds.size > 0 && (
                        <div className="bulk-action-bar">
                            <span className="bulk-action-count">{selectedIds.size} order(s) selected</span>
                            <button className="bulk-action-btn clear" onClick={clearSelection}>Clear</button>
                            <div className="bulk-action-spacer" />
                            <select
                                className="bulk-action-select"
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value)}
                            >
                                <option value="ACCEPTED">Accept</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancel</option>
                            </select>
                            <button
                                className="bulk-action-btn apply"
                                onClick={() => setShowBulkModal(true)}
                                disabled={bulkProcessing}
                            >
                                {bulkProcessing ? 'Processing...' : `Apply ${bulkStatus}`}
                            </button>
                        </div>
                    )}

                    {/* Data Table */}
                    <div className="orders-table-container">
                        {loading ? (
                            <div className="orders-loading">
                                <Loader2 className="spinning-loader" size={24} />
                                <span>Loading orders...</span>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="orders-empty">
                                <p>No orders found.</p>
                            </div>
                        ) : (
                            <table className="orders-data-table">
                                <thead><tr>
                                    <th style={{ width: 40 }}>
                                                <input
                                                    type="checkbox"
                                                    className="bulk-select-checkbox"
                                                    checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                    <th>ORDER ID</th>
                                    <th>CUSTOMER NAME</th>
                                    <th>DATE</th>
                                    <th>TOTAL AMOUNT</th>
                                    <th>CURRENT LOCATION</th>
                                    <th>ESTIMATED DELIVERY</th>
                                    <th>LOCK PERIOD</th>
                                    <th>FULFILLMENT STATUS</th>
                                    <th>ACTIONS</th>
                                    <th></th>
                                </tr></thead>
                                <tbody>
                                    {filteredOrders.map((order, index) => (
                                        <tr key={index} className={selectedIds.has(order.id) ? 'row-selected' : ''}>
                                            <td style={{ width: 40,paddingLeft: 15 }}>
                                                <input
                                                    type="checkbox"
                                                    className="bulk-select-checkbox"
                                                    checked={selectedIds.has(order.id)}
                                                    onChange={() => toggleSelect(order.id)}
                                                />
                                            </td>
                                            <td className="order-id">{order.orderNumber || `#${order.id}`}</td>
                                            <td className="customer-name">{order.displayCustomerName}</td>
                                            <td className="date-cell">
                                                <div>{formatDate(order.datePlaced)}</div>
                                            </td>
                                            <td className="total-amount">₹{(order.totalAmount || 0).toFixed(2)}</td>
                                            <td className="location-cell">{order.deliveryLocation || 'N/A'}</td>
                                            <td className="delivery-cell">
                                                <div>{order.estimatedDelivery || 'N/A'}</div>
                                            </td>
                                            <td className="lock-cell">
                                                {order.status?.toLowerCase() === 'delivered' ? (
                                                    <span className="lock-badge">
                                                        {order.withdrawalLockDays || 90}d lock
                                                        {order.deliveredAt && (
                                                            <span className="lock-remaining">
                                                                &nbsp;(releases {new Date(order.deliveredAt + ((order.withdrawalLockDays || 90) * 86400000)).toLocaleDateString()})
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : order.withdrawalLockDays ? (
                                                    <span className="lock-badge lock-pending">{order.withdrawalLockDays}d after delivery</span>
                                                ) : (
                                                    <span className="lock-badge lock-pending">90d after delivery</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="order-actions">
                                                    <button className="icon-action-btn" title="Schedule">
                                                        <Calendar size={18} />
                                                    </button>
                                                    <button className="icon-action-btn" title="View Details" onClick={() => handleViewDetails(order)}>
                                                        <Eye size={18} />
                                                    </button>
                                                    {(!order.status || order.status.toLowerCase() === 'pending') && (
                                                        <>
                                                            <button
                                                                className="btn-accept"
                                                                onClick={() => handleStatusUpdate(order.id, 'ACCEPTED')}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                className="btn-reject"
                                                                onClick={() => handleStatusUpdate(order.id, 'REJECTED')}
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {(order.status?.toLowerCase() === 'accepted' || order.status?.toLowerCase() === 'processing') && (
                                                        <button
                                                            className="btn-mark-shipped"
                                                            onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                                                        >
                                                            Mark as Shipped
                                                        </button>
                                                    )}
                                                    {order.status && order.status.toLowerCase() === 'shipped' && (
                                                        <button
                                                            className="btn-mark-shipped"
                                                            onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                                                            style={{ backgroundColor: '#4CAF50', color: 'white' }}
                                                        >
                                                            Mark Delivered
                                                        </button>
                                                    )}
                                                    {order.status && (order.status.toLowerCase() === 'return requested' || order.status.toLowerCase() === 'returned') && (
                                                        <button
                                                            className="btn-mark-shipped"
                                                            onClick={() => handleStatusUpdate(order.id, 'RETURNED')}
                                                            style={{ backgroundColor: '#D32F2F', color: 'white', opacity: order.status.toLowerCase() === 'returned' ? 0.6 : 1, cursor: order.status.toLowerCase() === 'returned' ? 'default' : 'pointer' }}
                                                            disabled={order.status.toLowerCase() === 'returned'}
                                                        >
                                                            {order.status.toLowerCase() === 'returned' ? 'Return Accepted' : 'Accept Return'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td></tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination Footer */}
                        <div className="orders-pagination-footer">
                            <div className="pagination-text">
                                Showing 1 to 5 of 248 orders
                            </div>
                            <div className="pagination-controls">
                                <button className="page-btn"><ChevronLeft size={16} color="#f0f0f0" /></button>
                                <button className="page-btn active">1</button>
                                <button className="page-btn">2</button>
                                <button className="page-btn">3</button>
                                <button className="page-btn"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Update Confirmation Modal */}
            {showBulkModal && (
                <Modal
                    isOpen={showBulkModal}
                    onClose={() => { if (!bulkProcessing) { setShowBulkModal(false); setBulkResult(null); }}}
                    title="Confirm Bulk Order Update"
                    footer={
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                className="modal-btn modal-btn--secondary"
                                onClick={() => { setShowBulkModal(false); setBulkResult(null); }}
                                disabled={bulkProcessing}
                            >
                                Cancel
                            </button>
                            {!bulkResult && (
                                <button
                                    className="modal-btn modal-btn--primary"
                                    onClick={handleBulkUpdate}
                                    disabled={bulkProcessing}
                                >
                                    {bulkProcessing ? 'Updating...' : `Update ${selectedIds.size} Order(s)`}
                                </button>
                            )}
                        </div>
                    }
                >
                    <div style={{ padding: '8px 0' }}>
                        <p style={{ marginBottom: 16, color: '#94a3b8', fontSize: 14 }}>
                            You are about to update <strong>{selectedIds.size} order(s)</strong> to status:
                        </p>
                        <div style={{
                            display: 'inline-block',
                            padding: '8px 20px',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 16,
                            marginBottom: 16,
                            background: bulkStatus === 'CANCELLED' ? '#fee2e2' :
                                bulkStatus === 'DELIVERED' ? '#dcfce7' :
                                bulkStatus === 'SHIPPED' ? '#dbeafe' : '#f1f5f9',
                            color: bulkStatus === 'CANCELLED' ? '#dc2626' :
                                bulkStatus === 'DELIVERED' ? '#16a34a' :
                                bulkStatus === 'SHIPPED' ? '#2563eb' : '#475569',
                        }}>
                            {bulkStatus}
                        </div>
                        {bulkResult && (
                            <div style={{
                                marginTop: 16,
                                padding: 12,
                                borderRadius: 8,
                                background: bulkResult.failedCount > 0 ? '#fef2f2' : '#f0fdf4',
                                border: `1px solid ${bulkResult.failedCount > 0 ? '#fecaca' : '#bbf7d0'}`,
                            }}>
                                <p style={{ fontWeight: 600, color: bulkResult.failedCount > 0 ? '#dc2626' : '#16a34a' }}>
                                    {bulkResult.successCount} succeeded, {bulkResult.failedCount} failed
                                </p>
                                {bulkResult.errors && bulkResult.errors.length > 0 && (
                                    <ul style={{ marginTop: 8, fontSize: 13, color: '#dc2626', paddingLeft: 16 }}>
                                        {bulkResult.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Order Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSelectedOrder(null); setOrderProducts([]); }}
                title={`Order Details — ${selectedOrder?.orderNumber || `#${selectedOrder?.id}`}`}
                footer={
                    <button className="modal-btn modal-btn--primary" onClick={() => setShowDetailModal(false)}>
                        Close
                    </button>
                }
            >
                {selectedOrder && (
                    <div className="order-detail-content">
                        {/* Order Summary */}
                        <div className="order-detail-section">
                            <h3 className="order-detail-section-title">Order Information</h3>
                            <div className="order-detail-grid">
                                <div className="order-detail-item">
                                    <span className="order-detail-label">Customer</span>
                                    <span className="order-detail-value">{selectedOrder.displayCustomerName || 'N/A'}</span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="order-detail-label">Date Placed</span>
                                    <span className="order-detail-value">{formatDate(selectedOrder.datePlaced)}</span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="order-detail-label">Total Amount</span>
                                    <span className="order-detail-value" style={{ fontWeight: 700 }}>₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="order-detail-label">Status</span>
                                    <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                                        {selectedOrder.status || 'Pending'}
                                    </span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="order-detail-label">Delivery Location</span>
                                    <span className="order-detail-value">{selectedOrder.deliveryLocation || 'N/A'}</span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="order-detail-label">Estimated Delivery</span>
                                    <span className="order-detail-value">{selectedOrder.estimatedDelivery || 'N/A'}</span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="order-detail-label">Withdrawal Lock</span>
                                    <span className="order-detail-value">
                                        {selectedOrder.withdrawalLockDays || 90} days after delivery
                                        {selectedOrder.deliveredAt && (
                                            <span style={{ display: 'block', fontSize: '.78rem', color: '#6b7280' }}>
                                                Releases {new Date(selectedOrder.deliveredAt + ((selectedOrder.withdrawalLockDays || 90) * 86400000)).toLocaleDateString()}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="order-detail-section">
                            <h3 className="order-detail-section-title">Products</h3>
                            {detailLoading ? (
                                <div className="order-detail-loading">
                                    <Loader2 className="spinning-loader" size={20} />
                                    <span>Loading products...</span>
                                </div>
                            ) : orderProducts.length > 0 ? (
                                <div className="order-detail-products">
                                    {orderProducts.map((product) => (
                                        <div key={product.id} className="order-detail-product-card">
                                            <div className="order-detail-product-img">
                                                {getProductImage(product) ? (
                                                    <img src={getProductImage(product)} alt={product.name} />
                                                ) : (
                                                    <div className="order-detail-no-img">No Image</div>
                                                )}
                                            </div>
                                            <div className="order-detail-product-info">
                                                <span className="order-detail-product-name">{product.name}</span>
                                                {product.sku && <span className="order-detail-product-meta">SKU: {product.sku}</span>}
                                                <span className="order-detail-product-meta">Qty: {product.orderedQty}</span>
                                                {product.regularPrice != null && (
                                                    <span className="order-detail-product-price">₹{product.discountPrice || product.regularPrice}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="order-detail-empty">No product details available.</p>
                            )}
                        </div>

                        {/* Return Section — only for returned / return requested orders */}
                        {(selectedOrder.status?.toLowerCase() === 'returned' || selectedOrder.status?.toLowerCase() === 'return requested') && (
                            <div className="order-detail-section order-detail-return-section">
                                <h3 className="order-detail-section-title">Return Details</h3>
                                <div className="order-detail-return-reason">
                                    <span className="order-detail-label">Return Reason</span>
                                    <p className="order-detail-return-message">
                                        {selectedOrder.returnReason || 'No reason provided.'}
                                    </p>
                                </div>
                                {selectedOrder.returnImages && selectedOrder.returnImages.length > 0 && (
                                    <div className="order-detail-return-images">
                                        <span className="order-detail-label">Return Images</span>
                                        <div className="order-detail-image-grid">
                                            {selectedOrder.returnImages.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`${BACKEND_URL}/uploads/reviews/${img}`}
                                                    alt={`Return image ${idx + 1}`}
                                                    className="order-detail-return-img"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Impact Note */}
                        {selectedOrder.impactNote && (
                            <div className="order-detail-section">
                                <h3 className="order-detail-section-title">Impact Note</h3>
                                <p className="order-detail-return-message">{selectedOrder.impactNote}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </VendorLayout>
    );
};

export default VendorOrders;
