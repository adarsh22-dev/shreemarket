import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Bell,
    DollarSign,
    ShoppingCart,
    BarChart2,
    MoreVertical,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorDashboard.css';
import { fetchVendorOrders, getVendorProducts, BACKEND_URL } from '../../api/api';

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    if (userObj.userId) {
                        const [ordersData, productsData] = await Promise.all([
                            fetchVendorOrders(userObj.userId),
                            getVendorProducts(userObj.userId)
                        ]);
                        setOrders(Array.isArray(ordersData) ? ordersData : []);
                        setProducts(productsData?.content || (Array.isArray(productsData) ? productsData : []));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch vendor dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Calculate Metrics
    const totalSales = orders
        .filter(o => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = orders.filter(o => {
        if (!o.datePlaced) return false;
        const orderDate = new Date(o.datePlaced);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    }).length;

    const avgOrderValue = orders.length > 0 ? (totalSales / orders.length) : 0;

    const formatDate = (epoch) => {
        if (!epoch) return 'N/A';
        const date = new Date(epoch);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

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

    if (loading) {
        return (
            <VendorLayout>
                <div className="orders-loading" style={{ height: '60vh' }}>
                    <Loader2 className="spinning-loader" size={32} />
                    <span>Loading dashboard...</span>
                </div>
            </VendorLayout>
        );
    }

    return (
        <VendorLayout>
            <div className="vendor-dashboard-content">
                {/* Header */}
                <header className="vendor-header">
                    <div className="header-title-section">
                        <h1>Welcome back, Artisan!</h1>
                        <p>Here's what's happening with your store today.</p>
                    </div>
                    <div className="header-actions">
                        <div className="search-bar">
                            <Search size={18} color="#888" />
                            <input type="text" placeholder="Search orders..." />
                        </div>
                        <button className="btn-add-product" onClick={() => navigate('/vendor/products/add')}>
                            <Plus size={18} />
                            Add New Product
                        </button>
                        <button className="icon-btn">
                            <Bell size={20} />
                        </button>
                        {/* <div className="profile-avatar">
                            <img src="https://ui-avatars.com/api/?name=Artisan&background=e0d5c1&color=333" alt="Profile" style={{ width: '100%', height: '100%' }} />
                        </div> */}
                    </div>
                </header>

                <div className="dashboard-top-grid">
                    {/* Left Column (Metrics + Chart) */}
                    <div className="left-column">
                        {/* KPI Metrics */}
                        <div className="metrics-row">
                            <div className="metric-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                                <div className="metric-icon" style={{ margin: 0 }}>
                                    <DollarSign size={20} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div className="metric-value" style={{ fontSize: '1.5rem', lineHeight: '1.1' }}>₹{totalSales.toFixed(2)}</div>
                                    <div className="metric-title" style={{ marginTop: '0.2rem' }}>Total Sales</div>
                                </div>
                            </div>
                            <div className="metric-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                                <div className="metric-icon" style={{ margin: 0 }}>
                                    <ShoppingCart size={20} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div className="metric-value" style={{ fontSize: '1.5rem', lineHeight: '1.1' }}>{ordersToday}</div>
                                    <div className="metric-title" style={{ marginTop: '0.2rem' }}>Orders Today</div>
                                </div>
                            </div>
                            <div className="metric-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                                <div className="metric-icon" style={{ margin: 0 }}>
                                    <BarChart2 size={20} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div className="metric-value" style={{ fontSize: '1.5rem', lineHeight: '1.1' }}>₹{avgOrderValue.toFixed(2)}</div>
                                    <div className="metric-title" style={{ marginTop: '0.2rem' }}>Avg. Order Value</div>
                                </div>
                            </div>
                        </div>

                        {/* Sales Chart Area */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <div className="chart-title">
                                    <h3>Sales Performance</h3>
                                    <p>Track your revenue growth over time</p>
                                </div>
                                <div className="chart-filters">
                                    <button className="chart-filter-btn active">Weekly</button>
                                    <button className="chart-filter-btn">Monthly</button>
                                </div>
                            </div>

                            <div className="chart-area">
                                <svg className="chart-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(224, 62, 26, 0.2)" />
                                            <stop offset="100%" stopColor="rgba(224, 62, 26, 0)" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    <line x1="0" y1="50" x2="800" y2="50" stroke="#f0f0f0" strokeWidth="1" />
                                    <line x1="0" y1="100" x2="800" y2="100" stroke="#f0f0f0" strokeWidth="1" />
                                    <line x1="0" y1="150" x2="800" y2="150" stroke="#f0f0f0" strokeWidth="1" />

                                    {/* Chart Path Area */}
                                    <path
                                        d="M 0 130 C 100 120, 150 145, 200 135 C 300 115, 350 50, 400 60 C 500 80, 550 40, 600 20 C 700 -20, 750 60, 800 65 L 800 200 L 0 200 Z"
                                        fill="url(#gradient)"
                                    />
                                    {/* Chart Line */}
                                    <path
                                        d="M 0 130 C 100 120, 150 145, 200 135 C 300 115, 350 50, 400 60 C 500 80, 550 40, 600 20 C 700 -20, 750 60, 800 65"
                                        fill="none"
                                        stroke="#E03E1A"
                                        strokeWidth="3"
                                    />

                                    {/* Data Points */}
                                    <circle cx="200" cy="135" r="4" fill="white" stroke="#E03E1A" strokeWidth="2" />
                                    <circle cx="400" cy="60" r="4" fill="white" stroke="#E03E1A" strokeWidth="2" />
                                    <circle cx="600" cy="20" r="4" fill="white" stroke="#E03E1A" strokeWidth="2" />
                                </svg>

                                <div className="chart-labels">
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                    <span>Sun</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Top Products) */}
                    <div className="top-products-card">
                        <h3>Your Products</h3>
                        <div className="product-list">
                            {products.slice(0, 4).map(product => {
                                const primaryMedia = product.media && product.media.length > 0
                                    ? product.media.find(m => m.isPrimary) || product.media[0]
                                    : null;
                                const imageUrl = primaryMedia
                                    ? `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`
                                    : "https://via.placeholder.com/100?text=No+Image";

                                return (
                                    <div className="product-list-item" key={product.id}>
                                        <img src={imageUrl} alt={product.name} className="product-thumb" />
                                        <div className="product-info">
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-sales" style={{ color: '#888', fontSize: '12px' }}>{product.category || 'N/A'}</div>
                                        </div>
                                        <div className="product-meta">
                                            <div className="product-price">₹{(product.discountPrice || product.regularPrice || 0).toFixed(2)}</div>
                                            {product.status === 'ACTIVE' ? (
                                                <div className="stock-status stock-in">Active</div>
                                            ) : (
                                                <div className="stock-status stock-low">{product.status}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {products.length === 0 && (
                                <p style={{ padding: '2rem 0', textAlign: 'center', color: '#888' }}>No products found.</p>
                            )}
                        </div>
                        <button className="btn-view-all" onClick={() => navigate('/vendor/products')}>View All Products</button>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="orders-card">
                    <div className="orders-header">
                        <h3>Recent Orders</h3>
                        <Link to="/vendor/orders" className="link-view-all">View All Orders</Link>
                    </div>

                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 5).map(order => (
                                <tr key={order.id}>
                                    <td className="order-id">{order.orderNumber || `#${order.id}`}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <div className="customer-avatar">
                                                {(order.customerName || 'N').charAt(0).toUpperCase()}
                                            </div>
                                            {order.customerName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>{order.deliveryLocation || 'N/A'}</td>
                                    <td>{formatDate(order.datePlaced)}</td>
                                    <td style={{ fontWeight: 600 }}>₹{(order.totalAmount || 0).toFixed(2)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                                            {order.status || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No recent orders.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorDashboard;
