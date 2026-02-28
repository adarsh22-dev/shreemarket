import React, { useState } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { Download, Wallet, Truck, ShoppingBag, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './VendorAnalytics.css';

const VendorAnalytics = () => {
    const [filter, setFilter] = useState('Daily');

    return (
        <VendorLayout>
            <div className="analytics-container">
                {/* Header Section */}
                <div className="analytics-header">
                    <div>
                        <h1 className="analytics-title">Performance Overview</h1>
                        <p className="analytics-subtitle">Real-time data for Oct 1, 2023 - Oct 31, 2023</p>
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
                        <button className="export-btn">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-header">
                            <div className="icon-wrapper bg-red-light">
                                <Wallet className="text-red" size={20} />
                            </div>
                            <span className="badge badge-green">+12.5%</span>
                        </div>
                        <div className="metric-body">
                            <h3 className="metric-label">TOTAL REVENUE</h3>
                            <div className="metric-value">₹128,430.00</div>
                        </div>
                        <div className="metric-footer border-red"></div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-header">
                            <div className="icon-wrapper bg-blue-light">
                                <Truck className="text-blue" size={20} />
                            </div>
                            <span className="badge badge-red">-2.4%</span>
                        </div>
                        <div className="metric-body">
                            <h3 className="metric-label">TOTAL ORDERS</h3>
                            <div className="metric-value">1,240</div>
                        </div>
                        <div className="metric-footer border-blue"></div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-header">
                            <div className="icon-wrapper bg-orange-light">
                                <ShoppingBag className="text-orange" size={20} />
                            </div>
                            <span className="badge badge-green">+5.1%</span>
                        </div>
                        <div className="metric-body">
                            <h3 className="metric-label">AVG. ORDER VALUE</h3>
                            <div className="metric-value">₹103.57</div>
                        </div>
                        <div className="metric-footer border-orange"></div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-header">
                            <div className="icon-wrapper bg-purple-light">
                                <Zap className="text-purple" size={20} />
                            </div>
                            <span className="badge badge-green">+0.4%</span>
                        </div>
                        <div className="metric-body">
                            <h3 className="metric-label">CONVERSION RATE</h3>
                            <div className="metric-value">3.2%</div>
                        </div>
                        <div className="metric-footer border-purple"></div>
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
                        {/* Mock data for bars */}
                        {[
                            { month: 'JAN', height: '40%' },
                            { month: 'FEB', height: '60%' },
                            { month: 'MAR', height: '35%' },
                            { month: 'APR', height: '90%', active: true },
                            { month: 'MAY', height: '70%' },
                            { month: 'JUN', height: '45%' },
                            { month: 'JUL', height: '65%' },
                            { month: 'AUG', height: '85%' },
                            { month: 'SEP', height: '55%' },
                            { month: 'OCT', height: '40%' },
                            { month: 'NOV', height: '60%' },
                            { month: 'DEC', height: '75%' },
                        ].map((data, index) => (
                            <div key={index} className="bar-wrapper">
                                <div className={`bar ${data.active ? 'bar-active' : ''}`} style={{ height: data.height }}></div>
                                <span className="bar-label">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Donut and Demographics Grid */}
                <div className="category-demographics-grid">
                    <div className="chart-card">
                        <h2 className="card-title">Sales by Category</h2>
                        <div className="donut-container">
                            <div className="donut-chart">
                                <div className="donut-inner">
                                    <div className="donut-value">₹128k</div>
                                    <div className="donut-label">Total</div>
                                </div>
                            </div>
                            <div className="donut-legend">
                                <div className="legend-row">
                                    <div className="legend-dot bg-orange-dark"></div>
                                    <div className="legend-info">
                                        <span className="legend-title">Textiles</span>
                                        <span className="legend-stats">40% • ₹51.3k</span>
                                    </div>
                                </div>
                                <div className="legend-row">
                                    <div className="legend-dot bg-yellow"></div>
                                    <div className="legend-info">
                                        <span className="legend-title">Ceramics</span>
                                        <span className="legend-stats">30% • ₹38.5k</span>
                                    </div>
                                </div>
                                <div className="legend-row">
                                    <div className="legend-dot bg-grey-light"></div>
                                    <div className="legend-info">
                                        <span className="legend-title">Furniture</span>
                                        <span className="legend-stats">30% • ₹38.5k</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="chart-card demographics-card">
                        <h2 className="card-title">Customer Demographics</h2>
                        <div className="demographics-content">
                            {/* Watermark map background represented by CSS */}
                            <div className="demographics-bg"></div>
                            <div className="progress-bars">
                                {[
                                    { country: 'USA', width: '80%', val: '45%' },
                                    { country: 'CAN', width: '40%', val: '22%' },
                                    { country: 'UK', width: '30%', val: '18%' },
                                    { country: 'GER', width: '25%', val: '15%' },
                                ].map(item => (
                                    <div className="progress-row" key={item.country}>
                                        <span className="country-label">{item.country}</span>
                                        <div className="progress-track">
                                            <div className="progress-fill" style={{ width: item.width }}></div>
                                        </div>
                                        <span className="country-value">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Performing Products */}
                <div className="products-card">
                    <div className="products-header">
                        <h2 className="card-title">Top Performing Products</h2>
                        <a href="#" className="view-all-link">View All Inventory</a>
                    </div>
                    <div className="table-wrapper">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>PRODUCT NAME</th>
                                    <th>SKU</th>
                                    <th>UNITS SOLD</th>
                                    <th>REVENUE</th>
                                    <th>STOCK STATUS</th>
                                    <th>GROWTH</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className="product-info-cell">
                                            <img src="https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=100&auto=format&fit=crop" alt="Vase" className="product-img" />
                                            <div>
                                                <div className="product-name">Artisan Ceramic Vase</div>
                                                <div className="product-cat">Home Decor</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>EH-CR-012</td>
                                    <td className="font-semibold">482</td>
                                    <td className="font-semibold">₹12,050.00</td>
                                    <td><span className="status-badge stock-in">IN STOCK</span></td>
                                    <td className="growth-positive">+18%</td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="product-info-cell">
                                            <img src="https://images.unsplash.com/photo-1596401057658-3e5328eb9fa4?q=80&w=100&auto=format&fit=crop" alt="Blanket" className="product-img" />
                                            <div>
                                                <div className="product-name">Nordic Throw Blanket</div>
                                                <div className="product-cat">Textiles</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>EH-TX-984</td>
                                    <td className="font-semibold">395</td>
                                    <td className="font-semibold">₹9,875.00</td>
                                    <td><span className="status-badge stock-low">LOW STOCK</span></td>
                                    <td className="growth-positive">+12%</td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="product-info-cell">
                                            <img src="https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=100&auto=format&fit=crop" alt="Stool" className="product-img" />
                                            <div>
                                                <div className="product-name">Minimalist Oak Stool</div>
                                                <div className="product-cat">Furniture</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>EH-FR-455</td>
                                    <td className="font-semibold">210</td>
                                    <td className="font-semibold">₹18,600.00</td>
                                    <td><span className="status-badge stock-in">IN STOCK</span></td>
                                    <td className="growth-negative">-4%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorAnalytics;
