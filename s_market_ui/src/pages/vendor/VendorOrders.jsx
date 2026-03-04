import React, { useState, useEffect } from 'react';
import {
    Download,
    Plus,
    Search,
    Calendar,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorOrders.css';
import { fetchVendorOrders, updateOrderStatus, getUserDetails } from '../../api/api';

const VendorOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Orders');
    const [searchQuery, setSearchQuery] = useState('');

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
                            } catch (err) {
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
            alert("Failed to update order status.");
        }
    };

    const filteredOrders = orders.filter(order => {
        // Tab filtering
        if (activeTab !== 'All Orders') {
            const status = order.status || 'Pending';
            if (status.toLowerCase() !== activeTab.toLowerCase()) {
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
            case 'shipped': return 'status-shipped';
            case 'processing': return 'status-processing';
            case 'delivered': return 'status-delivered';
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
                        <button className="btn-export">
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
                            <button className={`tab-btn ${activeTab === 'Processing' ? 'active' : ''}`} onClick={() => handleTabClick('Processing')}>Processing</button>
                            <button className={`tab-btn ${activeTab === 'Shipped' ? 'active' : ''}`} onClick={() => handleTabClick('Shipped')}>Shipped</button>
                            <button className={`tab-btn ${activeTab === 'Delivered' ? 'active' : ''}`} onClick={() => handleTabClick('Delivered')}>Delivered</button>
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
                                <thead>
                                    <tr>
                                        <th>ORDER ID</th>
                                        <th>CUSTOMER NAME</th>
                                        <th>DATE</th>
                                        <th>TOTAL AMOUNT</th>
                                        <th>CURRENT LOCATION</th>
                                        <th>ESTIMATED DELIVERY</th>
                                        <th>FULFILLMENT STATUS</th>
                                        <th>ACTIONS</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order, index) => (
                                        <tr key={index}>
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
                                                    <button className="icon-action-btn" title="View Details">
                                                        <Eye size={18} />
                                                    </button>
                                                    {(!order.status || order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing') && (
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
                                                </div>
                                            </td>
                                        </tr>
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
        </VendorLayout>
    );
};

export default VendorOrders;
