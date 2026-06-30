import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import {
    MapPin,
    Smartphone,
    Users,
    Globe,
    Monitor,
    Chrome,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import './VendorDemographics.css';
import { getVendorDemographics, getUserDetails } from '../../api/api';

const COLORS = ['#E03E1A', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const DEVICE_ICONS = { Desktop: Monitor, Mobile: Smartphone, Tablet: Globe };
const OS_COLORS = { Windows: '#0078D6', macOS: '#555', Linux: '#f39c12', Android: '#3DDC84', iOS: '#000' };
const BROWSER_COLORS = { Chrome: '#4285F4', Firefox: '#FF7139', Safari: '#006CFF', Edge: '#0078D7' };

const VendorDemographics = () => {
    const [activeTab, setActiveTab] = useState('locations');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj.userId) {
                    try {
                        const userDetails = await getUserDetails(userObj.userId);
                        const demographics = await getVendorDemographics(userDetails.id);
                        setData(demographics);
                    } catch (err) {
                        console.error('Failed to load demographics:', err);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) {
        return (
            <VendorLayout>
                <div className="demo-loading">
                    <RefreshCw className="spinner" size={40} />
                    <p>Loading customer demographics...</p>
                </div>
            </VendorLayout>
        );
    }

    if (!data) {
        return (
            <VendorLayout>
                <div className="demo-empty">
                    <AlertTriangle size={48} color="#9ca3af" />
                    <h2>No Demographics Data</h2>
                    <p>Customer demographic data will appear once you start receiving orders.</p>
                </div>
            </VendorLayout>
        );
    }

    const { cities, states, browsers, operatingSystems, deviceTypes, customerInsights, summary } = data;

    return (
        <VendorLayout>
            <div className="demo-container">
                {/* Header */}
                <div className="demo-header">
                    <div>
                        <h1 className="demo-title">Customer Demographics</h1>
                        <p className="demo-subtitle">Detailed insights about your customers' locations, devices, and buying behavior</p>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="demo-summary-grid">
                        <div className="demo-summary-card">
                            <div className="demo-summary-icon" style={{ background: '#fff1f0' }}>
                                <MapPin size={20} color="#E03E1A" />
                            </div>
                            <div className="demo-summary-info">
                                <span className="demo-summary-label">Top City</span>
                                <span className="demo-summary-value">{summary.topCity}</span>
                            </div>
                        </div>
                        <div className="demo-summary-card">
                            <div className="demo-summary-icon" style={{ background: '#eff6ff' }}>
                                <Globe size={20} color="#2563eb" />
                            </div>
                            <div className="demo-summary-info">
                                <span className="demo-summary-label">Top State</span>
                                <span className="demo-summary-value">{summary.topState}</span>
                            </div>
                        </div>
                        <div className="demo-summary-card">
                            <div className="demo-summary-icon" style={{ background: '#f0fdf4' }}>
                                <Monitor size={20} color="#16a34a" />
                            </div>
                            <div className="demo-summary-info">
                                <span className="demo-summary-label">Top Browser</span>
                                <span className="demo-summary-value">{summary.topBrowser}</span>
                            </div>
                        </div>
                        <div className="demo-summary-card">
                            <div className="demo-summary-icon" style={{ background: '#f5f3ff' }}>
                                <Smartphone size={20} color="#7c3aed" />
                            </div>
                            <div className="demo-summary-info">
                                <span className="demo-summary-label">Top Device</span>
                                <span className="demo-summary-value">{summary.topDevice}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="demo-tabs">
                    <button className={`demo-tab ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setActiveTab('locations')}>
                        <MapPin size={16} /> Locations
                    </button>
                    <button className={`demo-tab ${activeTab === 'devices' ? 'active' : ''}`} onClick={() => setActiveTab('devices')}>
                        <Smartphone size={16} /> Devices
                    </button>
                    <button className={`demo-tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
                        <Users size={16} /> Customer Insights
                    </button>
                </div>

                {/* ── LOCATIONS TAB ── */}
                {activeTab === 'locations' && (
                    <div className="demo-tab-content">
                        {/* Cities */}
                        <div className="demo-card">
                            <div className="demo-card-header">
                                <h3>Top Cities</h3>
                                <span className="demo-card-badge">{cities?.length || 0} cities</span>
                            </div>
                            <div className="demo-bar-list">
                                {cities && cities.length > 0 ? cities.slice(0, 10).map((item, i) => (
                                    <div className="demo-bar-row" key={item.city}>
                                        <div className="demo-bar-label">
                                            <span className="demo-rank">#{i + 1}</span>
                                            <span className="demo-city-name">{item.city}</span>
                                        </div>
                                        <div className="demo-bar-track">
                                            <div className="demo-bar-fill" style={{ width: `${item.width}%`, background: COLORS[i % COLORS.length] }}></div>
                                        </div>
                                        <div className="demo-bar-stats">
                                            <span className="demo-bar-count">{item.orders} orders</span>
                                            <span className="demo-bar-pct">{item.percentage}%</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="demo-empty-text">No city data available yet.</p>
                                )}
                            </div>
                        </div>

                        {/* States */}
                        <div className="demo-card">
                            <div className="demo-card-header">
                                <h3>State-wise Distribution</h3>
                                <span className="demo-card-badge">{states?.length || 0} states</span>
                            </div>
                            <div className="demo-bar-list">
                                {states && states.length > 0 ? states.slice(0, 8).map((item, i) => (
                                    <div className="demo-bar-row" key={item.state}>
                                        <div className="demo-bar-label">
                                            <span className="demo-city-name" style={{ width: 120 }}>{item.state}</span>
                                        </div>
                                        <div className="demo-bar-track">
                                            <div className="demo-bar-fill" style={{
                                                width: `${item.width}%`,
                                                background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`
                                            }}></div>
                                        </div>
                                        <div className="demo-bar-stats">
                                            <span className="demo-bar-count">{item.orders} orders</span>
                                            <span className="demo-bar-pct">{item.percentage}%</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="demo-empty-text">No state data available yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DEVICES TAB ── */}
                {activeTab === 'devices' && (
                    <div className="demo-tab-content demo-devices-grid">
                        {/* Browsers */}
                        <div className="demo-card">
                            <div className="demo-card-header">
                                <h3><Chrome size={16} /> Browsers</h3>
                            </div>
                            <div className="demo-bar-list">
                                {browsers && browsers.length > 0 ? browsers.map((item, i) => (
                                    <div className="demo-bar-row" key={item.label}>
                                        <div className="demo-bar-label">
                                            <span className="demo-device-dot" style={{
                                                background: BROWSER_COLORS[item.label] || COLORS[i % COLORS.length]
                                            }}></span>
                                            <span className="demo-city-name">{item.label}</span>
                                        </div>
                                        <div className="demo-bar-track">
                                            <div className="demo-bar-fill" style={{
                                                width: `${item.width}%`,
                                                background: BROWSER_COLORS[item.label] || COLORS[i % COLORS.length]
                                            }}></div>
                                        </div>
                                        <div className="demo-bar-stats">
                                            <span className="demo-bar-count">{item.count}</span>
                                            <span className="demo-bar-pct">{item.percentage}%</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="demo-empty-text">No browser data available yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Operating Systems */}
                        <div className="demo-card">
                            <div className="demo-card-header">
                                <h3>Operating Systems</h3>
                            </div>
                            <div className="demo-bar-list">
                                {operatingSystems && operatingSystems.length > 0 ? operatingSystems.map((item) => (
                                    <div className="demo-bar-row" key={item.label}>
                                        <div className="demo-bar-label">
                                            <span className="demo-device-dot" style={{
                                                background: OS_COLORS[item.label] || '#6b7280'
                                            }}></span>
                                            <span className="demo-city-name">{item.label}</span>
                                        </div>
                                        <div className="demo-bar-track">
                                            <div className="demo-bar-fill" style={{
                                                width: `${item.width}%`,
                                                background: OS_COLORS[item.label] || '#6b7280'
                                            }}></div>
                                        </div>
                                        <div className="demo-bar-stats">
                                            <span className="demo-bar-count">{item.count}</span>
                                            <span className="demo-bar-pct">{item.percentage}%</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="demo-empty-text">No OS data available yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Device Types */}
                        <div className="demo-card">
                            <div className="demo-card-header">
                                <h3>Device Types</h3>
                            </div>
                            <div className="demo-device-grid">
                                {deviceTypes && deviceTypes.length > 0 ? deviceTypes.map((item, i) => {
                                    const Icon = DEVICE_ICONS[item.label] || Monitor;
                                    return (
                                        <div className="demo-device-card" key={item.label}>
                                            <div className="demo-device-card-icon" style={{ background: `${COLORS[i % COLORS.length]}15` }}>
                                                <Icon size={32} color={COLORS[i % COLORS.length]} />
                                            </div>
                                            <span className="demo-device-card-name">{item.label}</span>
                                            <span className="demo-device-card-pct">{item.percentage}%</span>
                                            <span className="demo-device-card-count">{item.count} users</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="demo-empty-text">No device data available yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CUSTOMER INSIGHTS TAB ── */}
                {activeTab === 'customers' && customerInsights && (
                    <div className="demo-tab-content">
                        {/* KPIs */}
                        <div className="demo-kpi-grid">
                            <div className="demo-kpi-card">
                                <span className="demo-kpi-label">Unique Customers</span>
                                <span className="demo-kpi-value">{customerInsights.totalUniqueCustomers}</span>
                            </div>
                            <div className="demo-kpi-card">
                                <span className="demo-kpi-label">Single Purchase</span>
                                <span className="demo-kpi-value">{customerInsights.singlePurchaseCustomers}</span>
                            </div>
                            <div className="demo-kpi-card">
                                <span className="demo-kpi-label">Repeat Customers</span>
                                <span className="demo-kpi-value">{customerInsights.repeatCustomers}</span>
                            </div>
                            <div className="demo-kpi-card">
                                <span className="demo-kpi-label">Repeat Rate</span>
                                <span className="demo-kpi-value">{customerInsights.repeatRate}%</span>
                            </div>
                            <div className="demo-kpi-card">
                                <span className="demo-kpi-label">Avg Orders/Customer</span>
                                <span className="demo-kpi-value">{customerInsights.avgOrdersPerCustomer}</span>
                            </div>
                            <div className="demo-kpi-card">
                                <span className="demo-kpi-label">Total Orders</span>
                                <span className="demo-kpi-value">{customerInsights.totalOrders}</span>
                            </div>
                        </div>

                        {/* Repeat vs Single visual */}
                        <div className="demo-card">
                            <div className="demo-card-header">
                                <h3>Customer Segmentation</h3>
                            </div>
                            <div className="demo-segmentation">
                                <div className="demo-seg-bar">
                                    <div className="demo-seg-fill" style={{
                                        width: `${customerInsights.repeatRate}%`
                                    }}>
                                        <span>{customerInsights.repeatRate}% Repeat</span>
                                    </div>
                                    <div className="demo-seg-remaining" style={{
                                        width: `${100 - customerInsights.repeatRate}%`
                                    }}>
                                        <span>{100 - customerInsights.repeatRate}% One-Time</span>
                                    </div>
                                </div>
                                <div className="demo-seg-legend">
                                    <div className="demo-seg-legend-item">
                                        <span className="demo-seg-dot repeat"></span>
                                        Repeat Customers ({customerInsights.repeatCustomers})
                                    </div>
                                    <div className="demo-seg-legend-item">
                                        <span className="demo-seg-dot single"></span>
                                        One-Time Customers ({customerInsights.singlePurchaseCustomers})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorDemographics;
