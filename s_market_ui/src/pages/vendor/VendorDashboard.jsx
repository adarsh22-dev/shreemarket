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
import { fetchVendorOrders, getVendorProducts, BACKEND_URL, fetchVendorNotifications, PLACEHOLDER_IMG } from '../../api/api';

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartFilter, setChartFilter] = useState('Weekly');
    const [vendorName, setVendorName] = useState('');
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);


    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const settingsStr = localStorage.getItem('vendor_settings_data_v2');

                let name = '';
                if (settingsStr) {
                    const settingsObj = JSON.parse(settingsStr);
                    name = settingsObj.store?.name || '';
                }

                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    if (!name) {
                        name = userObj.vendorName || userObj.firstName || userObj.name || '';
                    }
                    setVendorName(name);

                    if (userObj.userId) {
                        const [ordersData, productsData, notificationsData] = await Promise.all([
                            fetchVendorOrders(userObj.userId),
                            getVendorProducts(userObj.userId),
                            fetchVendorNotifications(userObj.userId)
                        ]);
                        setOrders(Array.isArray(ordersData) ? ordersData : []);
                        setProducts(productsData?.content || (Array.isArray(productsData) ? productsData : []));
                        setUnreadNotificationsCount(Array.isArray(notificationsData) ? notificationsData.filter(n => n.unread).length : 0);

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

    // Chart Data Processing
    const getChartData = () => {
        const now = new Date();
        const data = [];
        const labels = [];

        if (chartFilter === 'Weekly') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                date.setHours(0, 0, 0, 0);

                const dailyTotal = orders
                    .filter(o => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
                    .filter(o => {
                        const orderDate = new Date(o.datePlaced);
                        orderDate.setHours(0, 0, 0, 0);
                        return orderDate.getTime() === date.getTime();
                    })
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                data.push(dailyTotal);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            }
        } else {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const start = new Date(now);
                start.setDate(now.getDate() - (i * 7 + 6));
                start.setHours(0, 0, 0, 0);

                const end = new Date(now);
                end.setDate(now.getDate() - (i * 7));
                end.setHours(23, 59, 59, 999);

                const weeklyTotal = orders
                    .filter(o => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
                    .filter(o => o.datePlaced >= start.getTime() && o.datePlaced <= end.getTime())
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                data.push(weeklyTotal);
                labels.push(`Week ${4 - i}`);
            }
        }

        return { data, labels };
    };

    const [hoveredPoint, setHoveredPoint] = useState(null);

    const { data: chartValues, labels: chartLabels } = getChartData();
    const maxVal = Math.max(...chartValues, 100);

    const generateChartPath = (isArea = false) => {
        if (chartValues.length === 0) return "";

        const width = 800;
        const height = 150; // Use 150 of the 200 viewbox height for padding
        const step = width / (chartValues.length - 1);

        let path = `M 0 ${height - (chartValues[0] / maxVal) * height}`;

        for (let i = 1; i < chartValues.length; i++) {
            const x = i * step;
            const y = height - (chartValues[i] / maxVal) * height;
            path += ` L ${x} ${y}`;
        }

        if (isArea) {
            path += ` L ${width} 200 L 0 200 Z`;
        }

        return path;
    };

    const getStockBadgeClass = (qty) => {
        if (qty === 0) return 'stock-out';
        if (qty <= 5) return 'stock-low';
        return 'stock-in';
    };

    const getStockText = (qty) => {
        if (qty === 0) return 'Out of Stock';
        if (qty <= 5) return `Low Stock (${qty})`;
        return `In Stock (${qty})`;
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
                        <h1>Welcome back{vendorName ? `, ${vendorName}!` : '!'}</h1>
                        <p>Here's what's happening with your store today.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-add-product" onClick={() => navigate('/vendor/products/add')}>
                            <Plus size={18} />
                            Add New Product
                        </button>
                        <button className="icon-btn" onClick={() => navigate('/vendor/notifications')} style={{ position: 'relative' }}>
                            <Bell size={20} />
                            {unreadNotificationsCount > 0 && (
                                <span className="notification-badge-bell">
                                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                </span>
                            )}
                        </button>

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
                                    <button
                                        className={`chart-filter-btn ${chartFilter === 'Weekly' ? 'active' : ''}`}
                                        onClick={() => setChartFilter('Weekly')}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        className={`chart-filter-btn ${chartFilter === 'Monthly' ? 'active' : ''}`}
                                        onClick={() => setChartFilter('Monthly')}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>

                            <div className="chart-area" style={{ position: 'relative' }}>
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
                                        d={generateChartPath(true)}
                                        fill="url(#gradient)"
                                    />
                                    {/* Chart Line */}
                                    <path
                                        d={generateChartPath(false)}
                                        fill="none"
                                        stroke="#E03E1A"
                                        strokeWidth="3"
                                    />

                                    {/* Data Points */}
                                    {chartValues.map((val, i) => {
                                        const x = i * (800 / (chartValues.length - 1));
                                        const y = 150 - (val / maxVal) * 150;
                                        return (
                                            <circle
                                                key={i}
                                                cx={x}
                                                cy={y}
                                                r={hoveredPoint?.index === i ? "6" : "4"}
                                                fill={hoveredPoint?.index === i ? "#E03E1A" : "white"}
                                                stroke="#E03E1A"
                                                strokeWidth="2"
                                                onMouseEnter={() => setHoveredPoint({ index: i, value: val, label: chartLabels[i], x, y })}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                            />
                                        );
                                    })}
                                </svg>

                                {hoveredPoint && (
                                    <div
                                        className="chart-tooltip"
                                        style={{
                                            left: `${(hoveredPoint.x / 800) * 100}%`,
                                            top: `${(hoveredPoint.y / 200) * 100}%`
                                        }}
                                    >
                                        <div className="tooltip-label">{hoveredPoint.label}</div>
                                        <div className="tooltip-value">₹{hoveredPoint.value.toLocaleString()}</div>
                                    </div>
                                )}

                                <div className="chart-labels">
                                    {chartLabels.map((label, i) => <span key={i}>{label}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Top Products) */}
                    <div className="top-products-card">
                        <h3>Your Products</h3>
                        <div className="product-list">
                            {products.slice(0, 4).map(product => {
                                const galleryImages = product.media?.filter(m => m.mediaType !== 'manufacturer') || [];
                                const primaryMedia = galleryImages.length > 0
                                    ? galleryImages.find(m => m.isPrimary) || galleryImages[0]
                                    : null;
                                const imageUrl = primaryMedia?.fileName
                                    ? `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`
                                    : PLACEHOLDER_IMG;

                                return (
                                    <div className="product-list-item" key={product.id}>
                                        <img src={imageUrl} alt={product.name} className="product-thumb" />
                                        <div className="product-info">
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-sales" style={{ color: '#888', fontSize: '12px' }}>
                                                {product.category || 'N/A'}
                                                <span style={{ marginLeft: '10px', color: '#FFB800' }}>
                                                    ★ {(product.averageRating || 0).toFixed(1)} ({product.reviewCount || 0})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="product-meta">
                                            <div className="product-price">₹{(product.discountPrice || product.regularPrice || 0).toFixed(2)}</div>
                                            <div className={`stock-status ${getStockBadgeClass(product.initialStock || 0)}`}>
                                                {getStockText(product.initialStock || 0)}
                                            </div>
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
                        <thead><tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Products</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                        </tr></thead>
                        <tbody>
                            {orders.slice(0, 5).map(order => (
                                <tr key={order.id}><td className="order-id">{order.orderNumber || `#${order.id}`}</td>
                                    <td>
                                        <div className="customer-cell">
                                            <div className="customer-avatar">
                                                {(order.customerName || 'N').charAt(0).toUpperCase()}
                                            </div>
                                            {order.customerName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="order-products-cell">
                                            {order.productQuantities && Object.keys(order.productQuantities).length > 0 ? (
                                                Object.entries(order.productQuantities).map(([pid, qty], idx) => {
                                                    const product = products.find(p => p.id === parseInt(pid));
                                                    return (
                                                        <div key={pid} className="order-product-item">
                                                            <span className="product-name-link">{product?.name || `Product #${pid}`}</span>
                                                            <span className="product-qty">x{qty}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <span>No products</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{formatDate(order.datePlaced)}</td>
                                    <td style={{ fontWeight: 600 }}>₹{(order.totalAmount || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                                            {order.status || 'Pending'}
                                        </span>
                                    </td></tr>
                            ))}
                            {orders.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No recent orders.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorDashboard;
