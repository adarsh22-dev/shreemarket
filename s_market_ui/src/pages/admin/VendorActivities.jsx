import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    RefreshCw,
    User,
    Package,
    LogIn,
    Settings,
    Shield,
    AlertTriangle
} from 'lucide-react';
import { getVendorActivities } from '../../api/api';
import toast from 'react-hot-toast';
import './VendorActivities.css';

const ACTION_ICONS = {
    vendor_registered: { icon: User, color: '#3B82F6', label: 'Registration' },
    vendor_status_changed: { icon: Shield, color: '#8B5CF6', label: 'Status' },
    product_created: { icon: Package, color: '#10B981', label: 'Product Created' },
    product_updated: { icon: Package, color: '#F59E0B', label: 'Product Updated' },
    vendor_login: { icon: LogIn, color: '#6366F1', label: 'Login' },
    settings_updated: { icon: Settings, color: '#6B7280', label: 'Settings' },
};

const getActionMeta = (action) => {
    return ACTION_ICONS[action] || { icon: AlertTriangle, color: '#6B7280', label: action || 'Unknown' };
};

const formatDate = (epoch) => {
    if (!epoch) return 'N/A';
    const date = new Date(epoch);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const PER_PAGE = 15;

export default function VendorActivities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getVendorActivities({
                page,
                size: PER_PAGE,
                search: search || undefined,
            });
            setActivities(res.content || []);
            setTotalPages(res.totalPages || 0);
            setTotalElements(res.totalElements || 0);
        } catch (err) {
            toast.error('Failed to load vendor activities');
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchActivities();
    };

    return (
        <div className="va-container">
            <div className="va-header">
                <div>
                    <h1 className="va-title">Vendor Activities</h1>
                    <p className="va-subtitle">
                        Track all vendor actions across the platform
                    </p>
                </div>
                <button className="va-refresh-btn" onClick={fetchActivities}>
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="va-kpi-row">
                <div className="va-kpi-card">
                    <div className="va-kpi-value">{totalElements}</div>
                    <div className="va-kpi-label">Total Activities</div>
                </div>
                <div className="va-kpi-card">
                    <div className="va-kpi-value">
                        {activities.filter(a => a.action === 'product_created').length}
                    </div>
                    <div className="va-kpi-label">New Products</div>
                </div>
                <div className="va-kpi-card">
                    <div className="va-kpi-value">
                        {activities.filter(a => a.action === 'vendor_registered').length}
                    </div>
                    <div className="va-kpi-label">New Registrations</div>
                </div>
                <div className="va-kpi-card">
                    <div className="va-kpi-value">{totalPages}</div>
                    <div className="va-kpi-label">Pages</div>
                </div>
            </div>

            <div className="va-card">
                <div className="va-card-header">
                    <form onSubmit={handleSearch} className="va-search-form">
                        <Search size={18} className="va-search-icon" />
                        <input
                            type="text"
                            className="va-search-input"
                            placeholder="Search by vendor name, action, or details..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>

                {loading ? (
                    <div className="va-loading">
                        <div className="va-spinner" />
                        <span>Loading activities...</span>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="va-empty">
                        <p>No vendor activities found.</p>
                    </div>
                ) : (
                    <div className="va-timeline">
                        {activities.map((activity) => {
                            const meta = getActionMeta(activity.action);
                            const Icon = meta.icon;
                            return (
                                <div key={activity.id} className="va-timeline-item">
                                    <div className="va-timeline-dot" style={{ borderColor: meta.color }}>
                                        <Icon size={14} color={meta.color} />
                                    </div>
                                    <div className="va-timeline-content">
                                        <div className="va-timeline-header">
                                            <span className="va-vendor-name">
                                                <User size={14} />
                                                {activity.vendorName || `Vendor #${activity.vendorId}`}
                                            </span>
                                            <span className="va-timeline-time">
                                                {formatDate(activity.timestamp)}
                                            </span>
                                        </div>
                                        <div className="va-timeline-body">
                                            <span className="va-action-badge" style={{
                                                background: `${meta.color}15`,
                                                color: meta.color,
                                                border: `1px solid ${meta.color}30`
                                            }}>
                                                {meta.label}
                                            </span>
                                            <span className="va-details">{activity.details}</span>
                                        </div>
                                        {activity.ipAddress && (
                                            <div className="va-timeline-footer">
                                                <span className="va-ip">IP: {activity.ipAddress}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="va-pagination">
                        <button
                            className="va-page-btn"
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                        >
                            Previous
                        </button>
                        <span className="va-page-info">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            className="va-page-btn"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
