import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { Download, Wallet, Truck, ShoppingBag, Zap, ArrowUpRight, ArrowDownRight, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import './VendorAnalytics.css';
import toast from 'react-hot-toast';
import { getVendorAnalytics, getUserDetails, BACKEND_URL, PLACEHOLDER_IMG } from '../../api/api';
import { exportCSV } from '../admin/VendorShared';

const VendorAnalytics = () => {
    const [filter, setFilter] = useState('Daily');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAnalytics = async () => {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.userId) {
                try {
                    const userDetails = await getUserDetails(userData.userId);
                    const analytics = await getVendorAnalytics(userDetails.id);
                    setData(analytics);
                } catch (error) {
                    console.error("Failed to fetch analytics:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        initAnalytics();
    }, []);

    if (loading) {
        return (
            <VendorLayout>
                <div className="analytics-loading">
                    <RefreshCw className="spinner" size={40} />
                    <p>Loading your performance data...</p>
                </div>
            </VendorLayout>
        );
    }

    if (!data) {
        return (
            <VendorLayout>
                <div className="analytics-empty">
                    <AlertTriangle size={48} color="#9ca3af" />
                    <h2>No Analytics Data Available</h2>
                    <p>We couldn't find any performance data for your store yet. Start selling to see your growth!</p>
                </div>
            </VendorLayout>
        );
    }

    const { metrics, trends, categorySales, topProducts, demographics } = data;

    return (
        <VendorLayout>
            <div className="analytics-container">
                {/* Header Section */}
                <div className="analytics-header">
                    <div>
                        <h1 className="analytics-title">Performance Overview</h1>
                        <p className="analytics-subtitle">Real-time data for {new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="analytics-actions">
                        <div className="filter-group">
                            {['Daily', 'Weekly', 'Monthly'].map(f => (
                                <button
                                    key={f}
                                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button className="export-btn" onClick={() => {
                            const rows = [
                                ['Metric', 'Value'],
                                ['Total Revenue', metrics.totalRevenue || 0],
                                ['Total Orders', metrics.totalOrders || 0],
                                ['Avg Order Value', metrics.avgOrderValue || 0],
                                ['Conversion Rate', metrics.conversionRate || 0],
                                ['Revenue Growth', metrics.revenueGrowth || '--'],
                                ['Orders Growth', metrics.ordersGrowth || '--'],
                            ];
                            if (topProducts?.length > 0) {
                                rows.push([]);
                                rows.push(['Top Products', '', '', '', '']);
                                rows.push(['Name', 'SKU', 'Units Sold', 'Revenue', 'Stock Status']);
                                topProducts.forEach(p => {
                                    rows.push([p.name, p.sku || '', p.unitsSold || 0, p.revenue || 0, p.status || '']);
                                });
                            }
                            exportCSV(rows, 'vendor-analytics.csv');
                            toast.success('Analytics exported to CSV');
                        }}>
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-content-horizontal">
                            <div className="icon-box-modern bg-red-light">
                                <Wallet className="text-red" size={24} />
                            </div>
                            <div className="metric-info-modern">
                                <h3 className="metric-label-modern">TOTAL REVENUE</h3>
                                <div className="metric-value-modern">₹{metrics.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="metric-trend-badge">
                                <span className={`trend-pill ${metrics.revenueGrowth?.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
                                    {metrics.revenueGrowth?.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {metrics.revenueGrowth}
                                </span>
                            </div>
                        </div>
                        <div className="metric-under-bar bg-red"></div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-content-horizontal">
                            <div className="icon-box-modern bg-blue-light">
                                <Truck className="text-blue" size={24} />
                            </div>
                            <div className="metric-info-modern">
                                <h3 className="metric-label-modern">TOTAL ORDERS</h3>
                                <div className="metric-value-modern">{metrics.totalOrders}</div>
                            </div>
                            <div className="metric-trend-badge">
                                <span className={`trend-pill ${metrics.ordersGrowth?.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
                                    {metrics.ordersGrowth?.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {metrics.ordersGrowth}
                                </span>
                            </div>
                        </div>
                        <div className="metric-under-bar bg-blue"></div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-content-horizontal">
                            <div className="icon-box-modern bg-orange-light">
                                <ShoppingBag className="text-orange" size={24} />
                            </div>
                            <div className="metric-info-modern">
                                <h3 className="metric-label-modern">AVG. ORDER VALUE</h3>
                                <div className="metric-value-modern">₹{metrics.avgOrderValue?.toFixed(2)}</div>
                            </div>
                            <div className="metric-trend-badge">
                                <span className={`trend-pill ${metrics.avgValueGrowth?.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
                                    {metrics.avgValueGrowth?.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {metrics.avgValueGrowth}
                                </span>
                            </div>
                        </div>
                        <div className="metric-under-bar bg-orange"></div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-content-horizontal">
                            <div className="icon-box-modern bg-purple-light">
                                <Zap className="text-purple" size={24} />
                            </div>
                            <div className="metric-info-modern">
                                <h3 className="metric-label-modern">CONVERSION RATE</h3>
                                <div className="metric-value-modern">{metrics.conversionRate}%</div>
                            </div>
                            <div className="metric-trend-badge">
                                <span className={`trend-pill ${metrics.conversionGrowth?.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
                                    {metrics.conversionGrowth?.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {metrics.conversionGrowth}
                                </span>
                            </div>
                        </div>
                        <div className="metric-under-bar bg-purple"></div>
                    </div>
                </div>

                {/* Revenue Trends Chart */}
                <div className="chart-card trends-card">
                    <div className="chart-header">
                        <div>
                            <h2 className="card-title">Revenue Trends</h2>
                            <p className="card-subtitle">Monthly sales volume compared to target</p>
                        </div>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot dot-red"></span> This Year</span>
                            <span className="legend-item"><span className="dot dot-grey"></span> Last Year</span>
                        </div>
                    </div>
                    <div className="bar-chart">
                        {trends.map((item, index) => (
                            <div key={index} className="bar-wrapper">
                                <div className={`bar ${item.active ? 'bar-active' : ''}`} style={{ height: item.height }}></div>
                                <span className="bar-label">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Donut and Demographics Grid */}
                <div className="category-demographics-grid">
                    <div className="chart-card">
                        <h2 className="card-title">Sales by Category</h2>
                        {categorySales && categorySales.length > 0 ? (
                            <div className="donut-container">
                                <div className="donut-chart">
                                    <svg viewBox="0 0 36 36" className="donut-svg">
                                        <circle className="donut-ring-bg" cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f3f4f6" strokeWidth="3"></circle>
                                        {(() => {
                                            const colors = ['#e84c1e', '#f59e0b', '#6b7280', '#3b82f6', '#10b981', '#8b5cf6'];
                                            let offset = 25;
                                            return categorySales.map((cat, i) => {
                                                const segment = (
                                                    <circle
                                                        key={i}
                                                        className="donut-segment"
                                                        cx="18" cy="18" r="15.9155"
                                                        fill="transparent"
                                                        stroke={colors[i % colors.length]}
                                                        strokeWidth="3.2"
                                                        strokeDasharray={`${cat.percentage} ${100 - cat.percentage}`}
                                                        strokeDashoffset={offset}
                                                    />
                                                );
                                                offset -= cat.percentage;
                                                return segment;
                                            });
                                        })()}
                                    </svg>
                                </div>
                                <div className="donut-legend">
                                    {categorySales.map((cat, i) => {
                                        const dotColors = ['bg-orange-dark', 'bg-yellow', 'bg-grey-light', 'bg-blue', 'bg-green', 'bg-purple'];
                                        return (
                                            <div className="legend-row" key={i}>
                                                <div className={`legend-dot ${dotColors[i % dotColors.length]}`}></div>
                                                <div className="legend-info">
                                                    <span className="legend-title">{cat.category}</span>
                                                    <span className="legend-stats">{cat.percentage}% • ₹{cat.value >= 1000 ? (cat.value / 1000).toFixed(1) + 'k' : cat.value.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-section">
                                <p>No category sales data yet. Sales data will appear once orders are placed.</p>
                            </div>
                        )}
                    </div>

                    <div className="chart-card demographics-card">
                        <h2 className="card-title">Customer Demographics</h2>
                        <div className="demographics-content">
                            {demographics && demographics.length > 0 ? (
                                <div className="progress-bars">
                                    {demographics.map((item, index) => (
                                        <div className="progress-row" key={item.country + '-' + index}>
                                            <span className="country-label">{item.country}</span>
                                            <div className="progress-track">
                                                <div className="progress-fill" style={{ width: item.width }}></div>
                                            </div>
                                            <span className="country-value">{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section">
                                    <p>No customer location data yet. Demographics will appear as orders come in.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Performing Products */}
                <div className="products-card">
                    <div className="products-header">
                        <h2 className="card-title">Top Performing Products</h2>
                        <a href="/vendor/products" className="view-all-link">View All Inventory</a>
                    </div>
                    <div className="table-wrapper">
                        <table className="products-table">
                            <thead><tr>
                                <th>PRODUCT NAME</th>
                                <th>SKU</th>
                                <th>UNITS SOLD</th>
                                <th>REVENUE</th>
                                <th>STOCK STATUS</th>
                                <th>GROWTH</th>
                            </tr></thead>
                            <tbody>
                                {topProducts.map((p, i) => (
                                    <tr key={p.id || i}><td>
                                        <div className="product-info-cell">
                                            <img
                                                src={p.image && p.image !== '/placeholder-image.png' ? `${BACKEND_URL}/uploads/products/${p.image}` : PLACEHOLDER_IMG}
                                                alt={p.name}
                                                className="product-img"
                                            />
                                            <div>
                                                <div className="product-name">{p.name}</div>
                                                <div className="product-cat">{p.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                        <td>{p.sku}</td>
                                        <td className="font-semibold">{p.unitsSold}</td>
                                        <td className="font-semibold">₹{p.revenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td>
                                            <span className={`status-badge ${p.status === 'out' ? 'stock-out' : p.status === 'low' ? 'stock-low' : 'stock-in'}`}>
                                                {p.status === 'out' ? 'OUT OF STOCK' : p.status === 'low' ? 'LOW STOCK' : 'IN STOCK'}
                                            </span>
                                        </td>
                                        <td className="growth-positive">{p.growth}</td></tr>
                                ))}
                                {topProducts.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        No sales recorded yet.
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorAnalytics;

