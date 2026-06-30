import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp,
    DollarSign,
    Package,
    Eye,
    ShoppingCart,
    Star,
    BarChart3,
    RefreshCw,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Loader2
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorProductAnalytics.css';
import { getVendorProductAnalytics, getUserDetails, getVendorProducts, BACKEND_URL } from '../../api/api';

const VendorProductAnalytics = () => {
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [vendorId, setVendorId] = useState(null);

    // Fetch vendor's products on mount
    useEffect(() => {
        const init = async () => {
            setLoadingProducts(true);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.userId) {
                try {
                    const userDetails = await getUserDetails(userData.userId);
                    const vid = userDetails.id;
                    setVendorId(vid);
                    const data = await getVendorProducts(vid, { size: 100 });
                    const list = data?.content || data || [];
                    setProducts(list);
                } catch (error) {
                    console.error('Failed to load products:', error);
                } finally {
                    setLoadingProducts(false);
                }
            } else {
                setLoadingProducts(false);
            }
        };
        init();
    }, []);

    // Fetch analytics when product is selected
    const fetchProductAnalytics = useCallback(async (productId) => {
        if (!vendorId || !productId) return;
        setLoading(true);
        try {
            const data = await getVendorProductAnalytics(vendorId, productId);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch product analytics:', error);
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    }, [vendorId]);

    useEffect(() => {
        if (selectedProductId) {
            fetchProductAnalytics(selectedProductId);
        } else {
            setAnalytics(null);
        }
    }, [selectedProductId, fetchProductAnalytics]);

    const filteredProducts = products.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.name || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q)
        );
    });

    const handleProductSelect = (e) => {
        setSelectedProductId(e.target.value);
    };

    return (
        <VendorLayout>
            <div className="vp-analytics-container">
                {/* Header */}
                <div className="vp-analytics-header">
                    <div>
                        <h1>Product Analytics</h1>
                        <p>Detailed performance metrics for each of your products</p>
                    </div>
                </div>

                {/* Product Selector */}
                <div className="vp-analytics-selector">
                    <div className="vp-search-wrapper">
                        <Search size={18} className="vp-search-icon" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="vp-product-select"
                        value={selectedProductId}
                        onChange={handleProductSelect}
                        disabled={loadingProducts}
                    >
                        <option value="">{loadingProducts ? 'Loading products...' : 'Select a product to analyze'}</option>
                        {filteredProducts.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.sku ? `(${p.sku})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="vp-analytics-loading">
                        <Loader2 className="spinning-loader" size={32} />
                        <p>Loading product analytics...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !analytics && selectedProductId && (
                    <div className="vp-analytics-empty">
                        <AlertTriangle size={48} />
                        <h3>No Data Available</h3>
                        <p>We couldn't find analytics data for this product. It may not have any orders yet.</p>
                    </div>
                )}

                {/* Analytics Content */}
                {!loading && analytics && (
                    <>
                        {/* Product Info Header */}
                        <div className="vp-product-info-bar">
                            <div className="vp-product-info-left">
                                {analytics.image && (
                                    <img
                                        src={`${BACKEND_URL}/uploads/products/${analytics.image}`}
                                        alt={analytics.productName}
                                        className="vp-product-thumb"
                                    />
                                )}
                                <div>
                                    <h2>{analytics.productName}</h2>
                                    <div className="vp-product-meta">
                                        {analytics.sku && <span className="vp-meta-tag">SKU: {analytics.sku}</span>}
                                        {analytics.category && <span className="vp-meta-tag">{analytics.category}</span>}
                                        <span className={`vp-status-badge ${analytics.status === 'in' ? 'stock-in' : analytics.status === 'low' ? 'stock-low' : 'stock-out'}`}>
                                            {analytics.status === 'in' ? 'IN STOCK' : analytics.status === 'low' ? 'LOW STOCK' : 'OUT OF STOCK'}
                                        </span>
                                        <span className="vp-meta-tag price-tag">₹{analytics.price?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`vp-growth-badge ${analytics.growth?.startsWith('+') ? 'growth-up' : 'growth-down'}`}>
                                {analytics.growth?.startsWith('+') ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {analytics.growth} vs last period
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="vp-kpi-grid">
                            <div className="vp-kpi-card">
                                <div className="vp-kpi-icon bg-blue"><Package size={22} /></div>
                                <div className="vp-kpi-info">
                                    <span className="vp-kpi-label">Units Sold</span>
                                    <span className="vp-kpi-value">{analytics.unitsSold}</span>
                                </div>
                            </div>
                            <div className="vp-kpi-card">
                                <div className="vp-kpi-icon bg-green"><DollarSign size={22} /></div>
                                <div className="vp-kpi-info">
                                    <span className="vp-kpi-label">Total Revenue</span>
                                    <span className="vp-kpi-value">₹{analytics.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div className="vp-kpi-card">
                                <div className="vp-kpi-icon bg-purple"><Eye size={22} /></div>
                                <div className="vp-kpi-info">
                                    <span className="vp-kpi-label">Est. Views</span>
                                    <span className="vp-kpi-value">{analytics.estimatedViews?.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="vp-kpi-card">
                                <div className="vp-kpi-icon bg-orange"><ShoppingCart size={22} /></div>
                                <div className="vp-kpi-info">
                                    <span className="vp-kpi-label">Add-to-Cart Rate</span>
                                    <span className="vp-kpi-value">{analytics.addToCartRate}%</span>
                                </div>
                            </div>
                            <div className="vp-kpi-card">
                                <div className="vp-kpi-icon bg-red"><TrendingUp size={22} /></div>
                                <div className="vp-kpi-info">
                                    <span className="vp-kpi-label">Conversion Rate</span>
                                    <span className="vp-kpi-value">{analytics.conversionRate}%</span>
                                </div>
                            </div>
                            <div className="vp-kpi-card">
                                <div className="vp-kpi-icon bg-yellow"><Star size={22} /></div>
                                <div className="vp-kpi-info">
                                    <span className="vp-kpi-label">Avg. Rating</span>
                                    <span className="vp-kpi-value">{analytics.avgRating} <span style={{ fontSize: 14, color: '#f59e0b' }}>★</span> ({analytics.reviewCount})</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="vp-charts-grid">
                            {/* Monthly Sales Trend */}
                            <div className="vp-chart-card">
                                <div className="vp-chart-card-header">
                                    <h3>Sales Trend (Monthly)</h3>
                                    <p>Units sold per month</p>
                                </div>
                                <div className="vp-bar-chart">
                                    {analytics.monthlySales?.map((item, idx) => (
                                        <div key={idx} className="vp-bar-wrapper">
                                            <div
                                                className={`vp-bar ${item.units > 0 ? 'vp-bar-filled' : ''}`}
                                                style={{ height: item.height }}
                                                title={`${item.month}: ${item.units} units (₹${item.revenue?.toFixed(0)})`}
                                            >
                                                {item.units > 0 && (
                                                    <span className="vp-bar-tooltip">{item.units}</span>
                                                )}
                                            </div>
                                            <span className="vp-bar-label">{item.month}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Revenue Trend */}
                            <div className="vp-chart-card">
                                <div className="vp-chart-card-header">
                                    <h3>Revenue Trend (Monthly)</h3>
                                    <p>Revenue generated per month</p>
                                </div>
                                <div className="vp-bar-chart">
                                    {(() => {
                                        const revenues = analytics.monthlySales || [];
                                        const maxRev = Math.max(...revenues.map(r => r.revenue || 0), 1);
                                        return revenues.map((item, idx) => (
                                            <div key={idx} className="vp-bar-wrapper">
                                                <div
                                                    className="vp-bar vp-bar-revenue"
                                                    style={{ height: item.revenue > 0 ? `${(item.revenue / maxRev) * 100}%` : '0%' }}
                                                    title={`${item.month}: ₹${item.revenue?.toFixed(2)}`}
                                                >
                                                    {item.revenue > 0 && (
                                                        <span className="vp-bar-tooltip">₹{(item.revenue / 1000).toFixed(1)}k</span>
                                                    )}
                                                </div>
                                                <span className="vp-bar-label">{item.month}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Funnel / Summary Section */}
                        <div className="vp-funnel-card">
                            <h3>Performance Funnel</h3>
                            <div className="vp-funnel-steps">
                                <div className="vp-funnel-step">
                                    <span className="vp-funnel-step-label">Views</span>
                                    <div className="vp-funnel-step-bar">
                                        <div className="vp-funnel-fill" style={{ width: '100%' }}>
                                            <span>{analytics.estimatedViews}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="vp-funnel-step">
                                    <span className="vp-funnel-step-label">Add to Cart</span>
                                    <div className="vp-funnel-step-bar">
                                        <div className="vp-funnel-fill fill-cart" style={{ width: `${Math.min(analytics.addToCartRate * 10, 100)}%` }}>
                                            <span>{analytics.addToCarts}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="vp-funnel-step">
                                    <span className="vp-funnel-step-label">Orders</span>
                                    <div className="vp-funnel-step-bar">
                                        <div className="vp-funnel-fill fill-orders" style={{ width: `${Math.min(analytics.orderCount * 5, 100)}%` }}>
                                            <span>{analytics.orderCount}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="vp-funnel-step">
                                    <span className="vp-funnel-step-label">Units Sold</span>
                                    <div className="vp-funnel-step-bar">
                                        <div className="vp-funnel-fill fill-sold" style={{ width: `${Math.min(analytics.unitsSold * 3, 100)}%` }}>
                                            <span>{analytics.unitsSold}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Initial State */}
                {!loading && !selectedProductId && (
                    <div className="vp-analytics-empty">
                        <BarChart3 size={64} />
                        <h3>Select a Product</h3>
                        <p>Choose a product from the dropdown above to view its detailed analytics, including sales trends, conversion rates, and review summaries.</p>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorProductAnalytics;
