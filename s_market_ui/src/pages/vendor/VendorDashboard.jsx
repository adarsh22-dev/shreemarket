import React from 'react';
import {
    Search,
    Plus,
    Bell,
    DollarSign,
    ShoppingCart,
    BarChart2,
    MoreVertical,
    CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorDashboard.css';

const VendorDashboard = () => {
    const navigate = useNavigate();

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
                        <div className="profile-avatar">
                            <img src="https://ui-avatars.com/api/?name=Artisan&background=e0d5c1&color=333" alt="Profile" style={{ width: '100%', height: '100%' }} />
                        </div>
                    </div>
                </header>

                <div className="dashboard-top-grid">
                    {/* Left Column (Metrics + Chart) */}
                    <div className="left-column">
                        {/* KPI Metrics */}
                        <div className="metrics-row">
                            <div className="metric-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <div className="metric-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: 0 }}>
                                    <div className="metric-icon" style={{ width: '32px', height: '32px' }}>
                                        <DollarSign size={18} />
                                    </div>
                                    <div className="metric-badge">+12.5%</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="metric-title" style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.85rem' }}>Total Sales</div>
                                    <div className="metric-value" style={{ fontSize: '1.75rem' }}>$12,450.00</div>
                                </div>
                            </div>
                            <div className="metric-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <div className="metric-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: 0 }}>
                                    <div className="metric-icon" style={{ width: '32px', height: '32px' }}>
                                        <ShoppingCart size={18} />
                                    </div>
                                    <div className="metric-badge">+5.2%</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="metric-title" style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.85rem' }}>Orders Today</div>
                                    <div className="metric-value" style={{ fontSize: '1.75rem' }}>18</div>
                                </div>
                            </div>
                            <div className="metric-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <div className="metric-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: 0 }}>
                                    <div className="metric-icon" style={{ width: '32px', height: '32px' }}>
                                        <BarChart2 size={18} />
                                    </div>
                                    <div className="metric-badge">+2.1%</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="metric-title" style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.85rem' }}>Avg. Order Value</div>
                                    <div className="metric-value" style={{ fontSize: '1.75rem' }}>$68.50</div>
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
                        <h3>Top Selling Products</h3>
                        <div className="product-list">
                            <div className="product-list-item">
                                <img src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=100&q=80" alt="Vase" className="product-thumb" />
                                <div className="product-info">
                                    <div className="product-name">Astra Ceramic Vase</div>
                                    <div className="product-sales">42 sold this month</div>
                                </div>
                                <div className="product-meta">
                                    <div className="product-price">$45.00</div>
                                    <div className="stock-status stock-in">In Stock</div>
                                </div>
                            </div>

                            <div className="product-list-item">
                                <img src="https://images.unsplash.com/photo-1596484552993-3bdfeb50570b?w=100&q=80" alt="Basket" className="product-thumb" />
                                <div className="product-info">
                                    <div className="product-name">Seagrass Storage Basket</div>
                                    <div className="product-sales">38 sold this month</div>
                                </div>
                                <div className="product-meta" style={{ textAlign: 'right' }}>
                                    <div className="product-price">$32.00</div>
                                    <div className="stock-status stock-low" style={{ fontSize: '0.7rem' }}>Low<br />Stock (5)</div>
                                </div>
                            </div>

                            <div className="product-list-item">
                                <img src="https://images.unsplash.com/photo-1615873968403-89e068629265?w=100&q=80" alt="Throw" className="product-thumb" />
                                <div className="product-info">
                                    <div className="product-name">Loomed Cotton Throw</div>
                                    <div className="product-sales">24 sold this month</div>
                                </div>
                                <div className="product-meta">
                                    <div className="product-price">$78.00</div>
                                    <div className="stock-status stock-in">In Stock</div>
                                </div>
                            </div>

                            <div className="product-list-item">
                                <img src="https://images.unsplash.com/photo-1602874801007-bd458cb6c04f?w=100&q=80" alt="Tea Lights" className="product-thumb" />
                                <div className="product-info">
                                    <div className="product-name">Bamboo Tea Lights</div>
                                    <div className="product-sales">19 sold this month</div>
                                </div>
                                <div className="product-meta">
                                    <div className="product-price">$18.00</div>
                                    <div className="stock-status stock-in">In Stock</div>
                                </div>
                            </div>
                        </div>
                        <button className="btn-view-all">View All Products</button>
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
                                <th>ORDER ID</th>
                                <th>CUSTOMER</th>
                                <th>PRODUCT</th>
                                <th>DATE</th>
                                <th>TOTAL</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="order-id">#EH-29401</td>
                                <td>
                                    <div className="customer-cell">
                                        <div className="customer-avatar" style={{ backgroundColor: '#fff0e5', color: '#e65100' }}>AM</div>
                                        Alice Miller
                                    </div>
                                </td>
                                <td>Astra Ceramic Vase</td>
                                <td>Oct 24, 2023</td>
                                <td style={{ fontWeight: 600 }}>$45.00</td>
                                <td><span className="status-badge status-processing">Processing</span></td>
                                <td>
                                    <button className="action-btn" style={{ color: '#E03E1A' }}><CheckCircle size={18} /></button>
                                </td>
                            </tr>
                            <tr>
                                <td className="order-id">#EH-29398</td>
                                <td>
                                    <div className="customer-cell">
                                        <div className="customer-avatar" style={{ backgroundColor: '#fff0e5', color: '#e65100' }}>JS</div>
                                        James Smith
                                    </div>
                                </td>
                                <td>Cotton Throw</td>
                                <td>Oct 24, 2023</td>
                                <td style={{ fontWeight: 600 }}>$78.00</td>
                                <td><span className="status-badge status-shipped">Shipped</span></td>
                                <td>
                                    <button className="action-btn"><MoreVertical size={18} /></button>
                                </td>
                            </tr>
                            <tr>
                                <td className="order-id">#EH-29395</td>
                                <td>
                                    <div className="customer-cell">
                                        <div className="customer-avatar" style={{ backgroundColor: '#ffebee', color: '#c62828' }}>KL</div>
                                        Kate Lee
                                    </div>
                                </td>
                                <td>Seagrass Basket (x2)</td>
                                <td>Oct 23, 2023</td>
                                <td style={{ fontWeight: 600 }}>$64.00</td>
                                <td><span className="status-badge status-delivered">Delivered</span></td>
                                <td>
                                    <button className="action-btn"><MoreVertical size={18} /></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorDashboard;
