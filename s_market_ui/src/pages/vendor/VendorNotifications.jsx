import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Settings,
    CreditCard,
    Truck,
    Megaphone,
    Banknote,
    Wrench,
    RefreshCw,
    Loader2,
    AlertTriangle,
    Package
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorNotifications.css';
import { fetchVendorNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/api';
import { toast } from 'react-hot-toast';

// Configurable notification tabs - maps UI label to backend notification type
const NOTIFICATION_TABS = [
    { label: 'All', type: 'All' },
    { label: 'Orders', type: 'ORDER' },
    { label: 'Stock', type: 'STOCK' },
    { label: 'Payments', type: 'PAYMENT' },
    { label: 'Deliveries', type: 'DELIVERY' },
    { label: 'Platform', type: 'PLATFORM' }
];

const VendorNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [vendorId, setVendorId] = useState(null);

    const tabs = NOTIFICATION_TABS.map(t => t.label);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userObj = JSON.parse(userStr);
            if (userObj.userId) {
                setVendorId(userObj.userId);
            }
        }
    }, []);

    const loadNotifications = async () => {
        if (!vendorId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const selectedTab = NOTIFICATION_TABS.find(t => t.label === activeTab);
            const typeFilter = selectedTab ? selectedTab.type : 'All';
            const data = await fetchVendorNotifications(vendorId, typeFilter);
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load notifications');
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vendorId) loadNotifications();
    }, [vendorId, activeTab]);

    const handleMarkAsRead = async (id) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
        } catch (error) {
            toast.error('Failed to mark as read');
            console.error("Failed to mark as read:", error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!vendorId) return;
        try {
            await markAllNotificationsAsRead(vendorId);
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
            console.error("Failed to mark all as read:", error);
        }
    };

    const getNotificationRoute = (item) => {
        const type = item.type?.toUpperCase();
        const refId = item.referenceId;
        switch (type) {
            case 'ORDER':
                return '/vendor/orders';
            case 'LOW_STOCK':
            case 'OUT_OF_STOCK':
                return refId ? `/vendor/products/edit/${refId}` : '/vendor/products';
            case 'PAYMENT':
                return '/vendor/payouts';
            case 'DELIVERY':
                return '/vendor/shipping';
            case 'PLATFORM':
                return '/vendor/dashboard';
            default:
                return null;
        }
    };

    const handleNotificationClick = async (item) => {
        if (item.unread) {
            await handleMarkAsRead(item.id);
        }
        const route = getNotificationRoute(item);
        if (route) {
            navigate(route);
        }
    };

    const getIcon = (type) => {
        switch (type?.toUpperCase()) {
            case 'ORDER': return { icon: CreditCard, bg: 'bg-red-light', color: 'text-red' };
            case 'LOW_STOCK': return { icon: AlertTriangle, bg: 'bg-yellow-light', color: 'text-yellow' };
            case 'OUT_OF_STOCK': return { icon: Package, bg: 'bg-orange-light', color: 'text-orange' };
            case 'PAYMENT': return { icon: Banknote, bg: 'bg-green-light', color: 'text-green' };
            case 'DELIVERY': return { icon: Truck, bg: 'bg-blue-light', color: 'text-blue' };
            case 'PLATFORM': return { icon: Megaphone, bg: 'bg-yellow-light', color: 'text-yellow' };
            default: return { icon: Settings, bg: 'bg-grey-light', color: 'text-grey' };
        }
    };

    const formatTime = (epoch) => {
        if (!epoch) return '';
        const now = new Date();
        const date = new Date(epoch);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 172800) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const groupNotifications = () => {
        const groups = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        notifications.forEach(n => {
            const d = new Date(n.createdAt);
            d.setHours(0, 0, 0, 0);

            let label = d.getTime() === today.getTime() ? 'TODAY'
                : d.getTime() === yesterday.getTime() ? 'YESTERDAY'
                    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

            if (!groups[label]) groups[label] = [];
            groups[label].push(n);
        });

        return Object.keys(groups).map(label => ({
            dateLabel: label,
            items: groups[label]
        }));
    };

    const notificationGroups = groupNotifications();

    if (loading && notifications.length === 0) {
        return (
            <VendorLayout>
                <div className="orders-loading" style={{ height: '60vh' }}>
                    <Loader2 className="spinning-loader" size={32} />
                    <span>Loading notifications...</span>
                </div>
            </VendorLayout>
        );
    }

    return (
        <VendorLayout>
            <div className="notifications-container">
                {/* Header Row */}
                <div className="notifications-header-row">
                    <h1>Notifications</h1>
                    <div className="header-actions">
                        <button className="btn-mark-read" onClick={handleMarkAllRead}>
                            <CheckCircle2 size={16} strokeWidth={2.5} />
                            Mark all as read
                        </button>
                        <button className="btn-icon-square">
                            <Settings size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Tabs Row */}
                <div className="notifications-tabs-row">
                    <div className="tabs-container">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                                {tab === 'All' && notifications.filter(n => n.unread).length > 0 && (
                                    <span className="tab-pill">{notifications.filter(n => n.unread).length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List Area */}
                <div className="notifications-list-area">
                    {notificationGroups.length > 0 ? (
                        notificationGroups.map((group, groupIdx) => (
                            <div key={groupIdx} className="notification-group">
                                <h3 className="group-date-label">{group.dateLabel}</h3>
                                <div className="group-items-wrapper">
                                    {group.items.map((item) => {
                                        const { icon: Icon, bg, color } = getIcon(item.type);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`notification-card ${item.unread ? 'is-unread' : ''}`}
                                                onClick={() => handleNotificationClick(item)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="nc-left">
                                                    <div className={`nc-icon-box ${bg}`}>
                                                        <Icon size={20} className={color} />
                                                    </div>
                                                </div>

                                                <div className="nc-middle">
                                                    <div className="nc-title">{item.title}</div>
                                                    <div className="nc-message">{item.message}</div>
                                                </div>

                                                <div className="nc-right">
                                                    <div className="nc-time">{formatTime(item.createdAt)}</div>
                                                    {item.unread && <div className="nc-unread-dot"></div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-notifications">
                            <p>No notifications found.</p>
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorNotifications;
