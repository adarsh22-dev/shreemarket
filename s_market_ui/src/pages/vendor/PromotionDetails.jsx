import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Edit2,
    Wallet,
    Tag,
    Users,
    Activity,
    Copy,
    TrendingUp,
    TrendingDown,
    MoreHorizontal
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './PromotionDetails.css';

const PromotionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // KPI Data specific to this mock promotion
    const metrics = [
        { title: 'Total Revenue', value: '₹24,500.00', trend: '+12.5%', trendType: 'positive', icon: Wallet, colorClass: 'red' },
        { title: 'Total Discount Given', value: '₹6,125.00', trend: '+8.2%', trendType: 'positive', icon: Tag, colorClass: 'orange' },
        { title: 'Number of Uses', value: '1,240', trend: '+15.3%', trendType: 'positive', icon: Users, colorClass: 'blue' },
        { title: 'Conversion Rate', value: '4.8%', trend: '+0.4%', trendType: 'positive', icon: Activity, colorClass: 'purple' }
    ];

    // Dummy Chart Data (Days 1 to 30) representing a sine-wave like curve
    const chartData = [
        15, 25, 38, 42, 35, 20, 18, 25, 50, 85,
        92, 80, 50, 20, 18, 45, 90, 95, 85, 40,
        15, 25, 95, 98, 80, 30, 10, 55, 95, 60
    ];

    const generatePath = (data) => {
        const width = 100;
        const height = 100; // viewBox scale
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1; // Prevent division by zero

        let d = `M 0 ${(1 - (data[0] - min) / range) * height}`;
        data.forEach((val, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = (1 - (val - min) / range) * height;

            if (index > 0) {
                // Smooth curve using cubic bezier
                const prevX = ((index - 1) / (data.length - 1)) * width;
                const prevY = (1 - (data[index - 1] - min) / range) * height;
                const controlX1 = prevX + (x - prevX) / 2;
                const controlX2 = prevX + (x - prevX) / 2;
                d += ` C ${controlX1} ${prevY}, ${controlX2} ${y}, ${x} ${y}`;
            }
        });
        return d;
    };


    const chartPath = generatePath(chartData);
    const gradientFill = `${chartPath} L 100 100 L 0 100 Z`;

    return (
        <VendorLayout>
            <div className="promo-details-container">
                {/* Breadcrumbs & Back Navigation */}
                <div className="pd-breadcrumb-nav">
                    <div className="pd-breadcrumbs">
                        <Link to="/vendor/promotions" className="pd-breadcrumb-link">Promotions</Link>
                        <ChevronRight size={14} className="pd-breadcrumb-separator" />
                        <span className="pd-current-page">Summer Clearance 2024</span>
                    </div>
                    <button className="pd-btn-back" onClick={() => navigate('/vendor/promotions')}>
                        <ChevronLeft size={20} />
                        Back
                    </button>
                </div>

                {/* Header Profile */}
                <div className="pd-header-profile">
                    <div className="pd-title-section">
                        <div className="pd-title-row">
                            <h1>Summer Clearance 2024</h1>
                            <span className="pd-status-badge pd-stock-in"><span className="pd-status-dot"></span>Active</span>
                        </div>
                        <p className="pd-subtitle">Running since June 1, 2024 • Ends Aug 31, 2024</p>
                    </div>
                    <div className="pd-actions">
                        <button className="pd-btn-outline">
                            <Download size={16} /> Download Report
                        </button>
                        <button className="pd-btn-primary">
                            <Edit2 size={16} /> Edit Promotion
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="pd-metrics-grid">
                    {metrics.map((m, i) => {
                        const Icon = m.icon;
                        return (
                            <div className="pd-metric-card" key={i}>
                                <div className="pd-metric-header">
                                    <div className={`pd-icon-box pd-bg-${m.colorClass}-light`}>
                                        <Icon size={18} className={`pd-text-${m.colorClass}`} />
                                    </div>
                                    <span className={`pd-trend-badge ${m.trendType === 'positive' ? 'pd-badge-green' : 'pd-badge-red'}`}>
                                        {m.trend}
                                    </span>
                                </div>
                                <div className="pd-metric-title">{m.title}</div>
                                <div className="pd-metric-value">{m.value}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Middle Content: Chart & Details */}
                <div className="pd-middle-grid">
                    {/* Performance Chart */}
                    <div className="pd-chart-card">
                        <div className="pd-chart-header">
                            <div>
                                <h2 className="pd-card-title">Daily Performance</h2>
                                <p className="pd-card-subtitle">Sales and usage trends over the last 30 days</p>
                            </div>
                            <div className="pd-chart-legend">
                                <span className="pd-legend-item"><span className="pd-dot pd-bg-red"></span> Revenue</span>
                                <span className="pd-legend-item"><span className="pd-dot pd-bg-grey"></span> Usage</span>
                            </div>
                        </div>

                        <div className="pd-chart-area">
                            <svg className="pd-line-chart" viewBox="0 -10 100 120" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#dc4c38" stopOpacity="0.15" />
                                        <stop offset="100%" stopColor="#dc4c38" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d={gradientFill} fill="url(#chartGradient)" />
                                <path d={chartPath} fill="none" stroke="#dc4c38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="pd-chart-x-axis">
                                <span>Jun 01</span>
                                <span>Jun 07</span>
                                <span>Jun 14</span>
                                <span>Jun 21</span>
                                <span>Jun 28</span>
                                <span>Jul 05</span>
                                <span>Jul 12</span>
                            </div>
                        </div>
                    </div>

                    {/* Promotion Details Summary */}
                    <div className="pd-details-summary-card">
                        <h2 className="pd-card-title pd-mb-lg">Promotion Details</h2>

                        <div className="pd-detail-group">
                            <label className="pd-detail-label">COUPON CODE</label>
                            <div className="pd-coupon-box">
                                <span className="pd-coupon-text">SUMMER25</span>
                                <button className="pd-copy-btn"><Copy size={16} /></button>
                            </div>
                        </div>

                        <div className="pd-detail-row">
                            <div className="pd-detail-col">
                                <label className="pd-detail-label">DISCOUNT TYPE</label>
                                <div className="pd-detail-value">Percentage</div>
                            </div>
                            <div className="pd-detail-col">
                                <label className="pd-detail-label">VALUE</label>
                                <div className="pd-detail-value pd-font-bold">25% OFF</div>
                            </div>
                        </div>

                        <div className="pd-detail-group">
                            <label className="pd-detail-label">USAGE LIMIT</label>
                            <div className="pd-detail-value pd-font-bold">1 use per customer</div>
                        </div>

                        <div className="pd-detail-group">
                            <label className="pd-detail-label">MINIMUM PURCHASE</label>
                            <div className="pd-detail-value pd-font-bold">₹150.00</div>
                        </div>

                        <div className="pd-detail-group pd-terms-group">
                            <label className="pd-detail-label">TERMS & CONDITIONS</label>
                            <ul className="pd-terms-list">
                                <li>Applicable on select furniture items only.</li>
                                <li>Cannot be combined with other offers.</li>
                                <li>Excludes final sale clearance items.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Top Performing Products */}
                <div className="pd-products-card">
                    <div className="pd-products-header">
                        <h2 className="pd-card-title">Top Performing Products</h2>
                        <a href="#" className="pd-link-red">View All Products</a>
                    </div>
                    <div className="pd-table-responsive">
                        <table className="pd-table">
                            <thead><tr>
                                <th>PRODUCT INFO</th>
                                <th>SKU</th>
                                <th>UNITS SOLD</th>
                                <th>REVENUE</th>
                                <th>TREND</th>
                            </tr></thead>
                            <tbody>
                                {/* Row 1 */}
                                <tr><td>
                                    <div className="pd-product-cell">
                                        <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&q=80" alt="Sofa" className="pd-product-img" />
                                        <div>
                                            <div className="pd-product-name">Nordic Velvet Sofa</div>
                                            <div className="pd-product-cat">Furniture & Living</div>
                                        </div>
                                    </div>
                                </td>
                                    <td>NV-SOFA-GR-01</td>
                                    <td className="pd-font-bold">142</td>
                                    <td className="pd-font-bold">₹8,450.00</td>
                                    <td>
                                        <span className="pd-trend-positive">
                                            <TrendingUp size={14} /> 24%
                                        </span>
                                    </td></tr>
                                {/* Row 2 */}
                                <tr><td>
                                    <div className="pd-product-cell">
                                        <img src="https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=100&q=80" alt="Table" className="pd-product-img" />
                                        <div>
                                            <div className="pd-product-name">Minimalist Dining Table</div>
                                            <div className="pd-product-cat">Dining Room</div>
                                        </div>
                                    </div>
                                </td>
                                    <td>MN-DINE-WD-04</td>
                                    <td className="pd-font-bold">98</td>
                                    <td className="pd-font-bold">₹5,280.00</td>
                                    <td>
                                        <span className="pd-trend-positive">
                                            <TrendingUp size={14} /> 18%
                                        </span>
                                    </td></tr>
                                {/* Row 3 */}
                                <tr><td>
                                    <div className="pd-product-cell">
                                        <img src="https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=100&q=80" alt="Chair" className="pd-product-img" />
                                        <div>
                                            <div className="pd-product-name">Pro-Series Office Chair</div>
                                            <div className="pd-product-cat">Workspace</div>
                                        </div>
                                    </div>
                                </td>
                                    <td>PRO-CH-BK-22</td>
                                    <td className="pd-font-bold">76</td>
                                    <td className="pd-font-bold">₹3,420.00</td>
                                    <td>
                                        <span className="pd-trend-positive">
                                            <TrendingUp size={14} /> 12%
                                        </span>
                                    </td></tr>
                                {/* Row 4 */}
                                <tr><td>
                                    <div className="pd-product-cell">
                                        <img src="https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=100&q=80" alt="Lamp" className="pd-product-img" />
                                        <div>
                                            <div className="pd-product-name">Industrial Floor Lamp</div>
                                            <div className="pd-product-cat">Lighting</div>
                                        </div>
                                    </div>
                                </td>
                                    <td>IND-LMP-MTL-09</td>
                                    <td className="pd-font-bold">54</td>
                                    <td className="pd-font-bold">₹2,150.00</td>
                                    <td>
                                        <span className="pd-trend-negative">
                                            <TrendingDown size={14} /> -3%
                                        </span>
                                    </td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Footer */}
                    <div className="pd-pagination-flex">
                        <div className="pd-pagination-text">Showing 4 of 28 products using this promotion</div>
                        <div className="pd-pagination-controls">
                            <button className="pd-page-btn"><ChevronLeft size={16} color="#aaa" /></button>
                            <button className="pd-page-btn"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

            </div>
        </VendorLayout>
    );
};

export default PromotionDetails;
