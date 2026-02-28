import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Megaphone,
    Banknote,
    Activity,
    Edit2,
    PauseCircle,
    Copy,
    Trash2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorPromotions.css';

const VendorPromotions = () => {
    const navigate = useNavigate();

    // KPI Data
    const metrics = [
        {
            title: 'Active Promotions',
            value: '12',
            trend: '+2% from last month',
            trendType: 'positive',
            icon: Megaphone,
            colorClass: 'blue'
        },
        {
            title: 'Total Discounted Sales',
            value: '₹45,280.00',
            trend: '-5% from last month',
            trendType: 'negative',
            icon: Banknote,
            colorClass: 'orange'
        },
        {
            title: 'Promo Conversion Rate',
            value: '8.4%',
            trend: '+1.2% from last month',
            trendType: 'positive',
            icon: Activity,
            colorClass: 'purple'
        }
    ];

    // Table Data
    const promotions = [
        {
            name: 'Summer Clearance 2024',
            id: 'PROM-8821',
            type: 'Automatic Sale',
            discount: '25% OFF',
            status: 'Active',
            duration: 'Jun 01 - Aug\n31',
            usage: '1,240',
            editable: true
        },
        {
            name: 'Flash Sale: Kitchenware',
            id: 'PROM-9012',
            type: 'Coupon',
            discount: '₹15 OFF',
            status: 'Scheduled',
            duration: 'Oct 15 - Oct\n17',
            usage: '0',
            editable: true
        },
        {
            name: 'BOGO Bedding Set',
            id: 'PROM-7654',
            type: 'Buy X Get Y',
            discount: 'Free Item',
            status: 'Expired',
            duration: 'May 01 -\nMay 15',
            usage: '452',
            editable: false
        },
        {
            name: 'New Homeowner Special',
            id: 'PROM-9220',
            type: 'Coupon',
            discount: '10% OFF',
            status: 'Active',
            duration: 'Ongoing',
            usage: '3,105',
            editable: true
        }
    ];

    const getStatusPillClass = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return 'status-active-pill';
            case 'scheduled': return 'status-scheduled-pill';
            case 'expired': return 'status-expired-pill';
            default: return '';
        }
    };

    return (
        <VendorLayout>
            <div className="vendor-promotions-container">
                {/* Header Section */}
                <div className="promo-header-row">
                    <div>
                        <h1>Promotions & Discounts</h1>
                        <p>Design, manage and track your marketing campaigns performance.</p>
                    </div>
                    <button className="btn-create-promo" onClick={() => navigate('/vendor/promotions/create')}>
                        <Plus size={18} />
                        Create New Promotion
                    </button>
                </div>

                {/* KPI Cards Row */}
                <div className="promo-kpi-row">
                    {metrics.map((metric, index) => {
                        const Icon = metric.icon;
                        return (
                            <div className="promo-kpi-card" key={index}>
                                <div className="kpi-header">
                                    <div className={`kpi-icon-wrapper ${metric.colorClass}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`kpi-trend ${metric.trendType}`}>
                                        {metric.trend}
                                    </span>
                                </div>
                                <div>
                                    <div className="kpi-title">{metric.title}</div>
                                    <div className="kpi-value">{metric.value}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="promo-content-area">
                    {/* Control Bar */}
                    <div className="promo-control-bar">
                        <div className="promo-search-wrapper">
                            <Search className="promo-search-icon" size={18} />
                            <input type="text" placeholder="Search promotions..." />
                        </div>
                        <div className="promo-filters">
                            <select className="filter-select">
                                <option>All Statuses</option>
                                <option>Active</option>
                                <option>Scheduled</option>
                                <option>Expired</option>
                            </select>
                            <select className="filter-select">
                                <option>All Types</option>
                                <option>Automatic Sale</option>
                                <option>Coupon</option>
                            </select>
                            <button className="btn-more-filters">
                                <Filter size={18} />
                                More Filters
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <table className="promo-data-table">
                        <thead>
                            <tr>
                                <th>PROMOTION NAME</th>
                                <th>TYPE</th>
                                <th>DISCOUNT</th>
                                <th>STATUS</th>
                                <th>DURATION</th>
                                <th>USAGE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.map((promo, index) => (
                                <tr key={index} onClick={() => navigate(`/vendor/promotions/${promo.id}`)} className="clickable-row">
                                    <td className="promo-name-cell">
                                        <div className="promo-name-title">{promo.name}</div>
                                        <div className="promo-id">ID: {promo.id}</div>
                                    </td>
                                    <td className="promo-type">{promo.type}</td>
                                    <td className="promo-discount">{promo.discount}</td>
                                    <td>
                                        <span className={`promo-status-pill ${getStatusPillClass(promo.status)}`}>
                                            <span className="status-dot"></span>
                                            {promo.status}
                                        </span>
                                    </td>
                                    <td className="promo-duration">
                                        {promo.duration.split('\n').map((line, i) => (
                                            <div key={i}>{line}</div>
                                        ))}
                                    </td>
                                    <td className="promo-usage">{promo.usage}</td>
                                    <td>
                                        <div className="promo-actions" onClick={(e) => e.stopPropagation()}>
                                            {promo.editable ? (
                                                <>
                                                    <button className="action-icon-btn" title="Edit">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button className="action-icon-btn" title="Pause">
                                                        <PauseCircle size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="action-icon-btn" title="Copy Settings">
                                                    <Copy size={18} />
                                                </button>
                                            )}
                                            <button className="action-icon-btn delete" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Footer */}
                    <div className="promo-pagination-footer">
                        <div className="pagination-text">
                            Showing <strong>1</strong> to <strong>4</strong> of <strong>12</strong> promotions
                        </div>
                        <div className="pagination-controls">
                            <button className="page-btn"><ChevronLeft size={16} color="#aaa" /></button>
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                            <button className="page-btn"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorPromotions;
