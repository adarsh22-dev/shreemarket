import React from 'react';
import {
    Plus,
    Package,
    ClipboardList,
    Truck,
    AlertCircle,
    Filter,
    ChevronDown,
    Eye,
    Printer,
    ChevronLeft,
    ChevronRight,
    PlusCircle
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorShipping.css';

const VendorShipping = () => {
    // KPI Data
    const metrics = [
        {
            title: 'Total Shipments',
            value: '1,284',
            trend: '+12.5%',
            trendType: 'positive',
            icon: Package,
            colorClass: 'blue',
            badgeText: ''
        },
        {
            title: 'Pending Pickup',
            value: '42',
            trend: '',
            trendType: '',
            icon: ClipboardList,
            colorClass: 'orange',
            badgeText: 'Active',
            badgeClass: 'badge-orange'
        },
        {
            title: 'In Transit',
            value: '156',
            trend: '',
            trendType: '',
            icon: Truck,
            colorClass: 'green',
            badgeText: 'On Time',
            badgeClass: 'badge-green'
        },
        {
            title: 'Delayed Shipments',
            value: '8',
            trend: '',
            trendType: '',
            icon: AlertCircle,
            colorClass: 'red',
            badgeText: 'Critical',
            badgeClass: 'badge-red',
            isAlert: true
        }
    ];

    // Table Data
    const shipments = [
        {
            id: '#ORD-90210',
            customerName: 'Sarah Miller',
            customerLocation: 'Portland, OR',
            carrierLogoText: 'FX',
            carrierLogoClass: 'logo-fedex',
            carrierName: 'FedEx Express',
            status: 'IN TRANSIT',
            statusClass: 'status-transit',
            shipDate: 'Oct 24, 2023',
            estDelivery: 'Oct 27, 2023'
        },
        {
            id: '#ORD-90211',
            customerName: 'TechNova Solutions',
            customerLocation: 'Austin, TX',
            carrierLogoText: 'UPS',
            carrierLogoClass: 'logo-ups',
            carrierName: 'UPS Ground',
            status: 'DELIVERED',
            statusClass: 'status-delivered',
            shipDate: 'Oct 22, 2023',
            estDelivery: 'Oct 25, 2023'
        },
        {
            id: '#ORD-90212',
            customerName: 'Marcus Chen',
            customerLocation: 'Miami, FL',
            carrierLogoText: 'DHL',
            carrierLogoClass: 'logo-dhl',
            carrierName: 'DHL Express',
            status: 'DELAYED',
            statusClass: 'status-delayed',
            shipDate: 'Oct 21, 2023',
            estDelivery: 'Oct 24, 2023',
            isAlertDate: true
        },
        {
            id: '#ORD-90213',
            customerName: 'Elite Designs Inc',
            customerLocation: 'Chicago, IL',
            carrierLogoText: 'FX',
            carrierLogoClass: 'logo-fedex',
            carrierName: 'FedEx Ground',
            status: 'SHIPPED',
            statusClass: 'status-shipped',
            shipDate: 'Oct 25, 2023',
            estDelivery: 'Oct 30, 2023'
        }
    ];

    return (
        <VendorLayout>
            <div className="shipping-container">
                {/* Header Section */}
                <div className="shipping-header-row">
                    <div>
                        <h1>Shipping Overview</h1>
                        <p>Manage your logistics pipeline and track vendor shipments in real-time.</p>
                    </div>
                    <button className="btn-ship-order">
                        <Plus size={18} strokeWidth={2.5} />
                        Ship Order
                    </button>
                </div>

                {/* KPI Cards Row */}
                <div className="shipping-kpi-row">
                    {metrics.map((metric, index) => {
                        const Icon = metric.icon;
                        return (
                            <div className={`shipping-kpi-card ${metric.isAlert ? 'border-alert' : ''}`} key={index}>
                                <div className="kpi-header">
                                    <div className={`kpi-icon-wrapper bg-${metric.colorClass}`}>
                                        <Icon size={20} className={`icon-${metric.colorClass}`} />
                                    </div>
                                    {metric.trend && (
                                        <span className={`kpi-trend ${metric.trendType}`}>
                                            {metric.trend}
                                        </span>
                                    )}
                                    {metric.badgeText && (
                                        <span className={`kpi-badge ${metric.badgeClass}`}>
                                            {metric.badgeText}
                                        </span>
                                    )}
                                </div>
                                <div className="kpi-body">
                                    <div className="kpi-title">{metric.title}</div>
                                    <div className={`kpi-value ${metric.isAlert ? 'text-red' : ''}`}>{metric.value}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Shipment Tracking Section */}
                <div className="shipping-tracking-card">
                    <div className="tracking-header">
                        <h2>Shipment Tracking</h2>
                        <div className="tracking-controls">
                            <button className="btn-filter-dropdown">
                                All Carriers
                            </button>
                            <button className="btn-filter-dropdown">
                                All Statuses
                            </button>
                            <button className="btn-icon">
                                <Filter size={18} />
                                <div className="filter-lines">
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="tracking-table-responsive">
                        <table className="tracking-table">
                            <thead><tr>
                                <th>ORDER ID</th>
                                <th>CUSTOMER</th>
                                <th>CARRIER</th>
                                <th>STATUS</th>
                                <th>SHIPPING DATE</th>
                                <th>EST. DELIVERY</th>
                                <th>ACTIONS</th>
                            </tr></thead>
                            <tbody>
                                {shipments.map((shipment, index) => (
                                    <tr key={index}><td className="cell-order-id">{shipment.id}</td>
                                        <td>
                                            <div className="customer-name">{shipment.customerName}</div>
                                            <div className="customer-location">{shipment.customerLocation}</div>
                                        </td>
                                        <td>
                                            <div className="carrier-info">
                                                <div className={`carrier-logo ${shipment.carrierLogoClass}`}>
                                                    {shipment.carrierLogoText}
                                                </div>
                                                <span className="carrier-name">{shipment.carrierName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${shipment.statusClass}`}>
                                                {shipment.status}
                                            </span>
                                        </td>
                                        <td className="cell-date">{shipment.shipDate}</td>
                                        <td className={`cell-date ${shipment.isAlertDate ? 'text-red font-bold' : ''}`}>
                                            {shipment.estDelivery}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn" title="View Details">
                                                    <Eye size={18} className="text-orange" />
                                                </button>
                                                <button className="action-btn" title="Print Label">
                                                    <Printer size={18} className="text-grey" />
                                                </button>
                                            </div>
                                        </td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="tracking-footer">
                        <div className="tracking-hint">Showing 4 of 1,284 results</div>
                        <div className="tracking-pagination">
                            <button className="page-btn text-btn">Previous</button>
                            <button className="page-btn number active">1</button>
                            <button className="page-btn number">2</button>
                            <button className="page-btn text-btn">Next</button>
                        </div>
                    </div>
                </div>

                {/* Shipping Carriers Integration */}
                <div className="carriers-section">
                    <div className="carriers-header">
                        <h2>Shipping Carriers & Methods</h2>
                        <a href="#" className="link-manage">Manage Integrations</a>
                    </div>

                    <div className="carriers-grid">
                        {/* FedEx Card */}
                        <div className="carrier-card">
                            <div className="carrier-card-top">
                                <div className="carrier-logo-lg bg-purple-light">
                                    {/* Placeholder for complex FedEx logo */}
                                    <div className="fedex-icon-mock">
                                        <div className="mock-dot center"></div>
                                        <div className="mock-dot top"></div>
                                        <div className="mock-dot bottom-left"></div>
                                        <div className="mock-dot bottom-right"></div>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6f42c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 9v-2m0 10v-2m3-8l1.5-1.5M7.5 16.5L9 15m6 0l1.5 1.5M7.5 7.5L9 9"></path></svg>
                                    </div>
                                </div>
                                <div>
                                    <div className="carrier-title">FedEx API</div>
                                    <div className="carrier-status">Status: Connected</div>
                                </div>
                                <div className="status-dot green"></div>
                            </div>
                            <div className="carrier-card-bottom">
                                <div className="methods-label">ACTIVE METHODS</div>
                                <div className="methods-tags">
                                    <span className="method-tag">Overnight</span>
                                    <span className="method-tag">Ground</span>
                                    <span className="method-tag">2-Day</span>
                                </div>
                            </div>
                        </div>

                        {/* UPS Card */}
                        <div className="carrier-card">
                            <div className="carrier-card-top">
                                <div className="carrier-logo-lg bg-orange-light">
                                    <div className="ups-icon-mock">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d35400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                    </div>
                                </div>
                                <div>
                                    <div className="carrier-title">UPS Connect</div>
                                    <div className="carrier-status">Status: Connected</div>
                                </div>
                                <div className="status-dot green"></div>
                            </div>
                            <div className="carrier-card-bottom">
                                <div className="methods-label">ACTIVE METHODS</div>
                                <div className="methods-tags">
                                    <span className="method-tag">Standard</span>
                                    <span className="method-tag">Express</span>
                                </div>
                            </div>
                        </div>

                        {/* Add New Carrier Card */}
                        <div className="carrier-card-dashed">
                            <div className="add-carrier-content">
                                <div className="add-icon-circle">
                                    <PlusCircle size={28} className="text-red" />
                                </div>
                                <div className="add-title">Add New Carrier</div>
                                <div className="add-desc">Connect DHL, USPS, or Freight</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorShipping;
