import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Package,
    ShoppingCart,
    CreditCard,
    Settings,
    HelpCircle,
    LogOut,
    Tag,
    BarChart2,
    Truck,
    Bell,
    Users,
    BookOpen,
    Star,
    RotateCcw,
    FileText,
    ClipboardList,
    MapPin,
    Clock,
    Calendar,
    Crown,
    Download,
    MessageSquare,
    QrCode,
    Send,
    Store
} from 'lucide-react';
import smarketLogo from '../../assets/smarketlogo.svg';
import { logoutUser, fetchVendorNotifications } from '../../api/api';
import '../../pages/vendor/VendorDashboard.css'; // Inheriting sidebar styling


const VendorLayout = ({ children }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj.userId) {
                    try {
                        const notifications = await fetchVendorNotifications(userObj.userId);
                        const unread = notifications.filter(n => n.unread).length;
                        setUnreadCount(unread);
                    } catch (error) {
                        console.error("Failed to fetch unread notifications:", error);
                    }
                }
            }
        };

        fetchUnreadCount();
        // Optional: Set up interval for polling
        const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);


    const handleLogout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem('user');
            window.location.replace('/');
        } catch (error) {
            console.error("Logout failed:", error);
            localStorage.removeItem('user');
            window.location.replace('/');
        }
    };

    return (
        <div className="vendor-dashboard-container">
            {/* Shared Sidebar */}
            <aside className="vendor-sidebar">
                <div className="sidebar-logo">
                    <img src={smarketLogo} alt="S-Market Logo" className="logo-img" style={{ height: '45px', width: 'auto' }} />

                </div>

                <nav className="sidebar-nav">
                    <Link to="/vendor/dashboard" className={`nav-item ${currentPath === '/vendor/dashboard' ? 'active' : ''}`}>
                        <Home size={20} />
                        Dashboard
                    </Link>
                    <Link to="/vendor/notifications" className={`nav-item ${currentPath.includes('/vendor/notifications') ? 'active' : ''}`} style={{ position: 'relative' }}>
                        <Bell size={20} />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="notification-badge-sidebar">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    <Link to="/vendor/products" className={`nav-item ${currentPath === '/vendor/products' ? 'active' : ''}`}>
                        <Package size={20} />
                        My Products
                    </Link>
                    <Link to="/vendor/analytics" className={`nav-item ${currentPath === '/vendor/analytics' ? 'active' : ''}`}>
                        <BarChart2 size={20} />
                        Analytics
                    </Link>
                    <Link to="/vendor/reviews" className={`nav-item ${currentPath === '/vendor/reviews' ? 'active' : ''}`}>
                        <Star size={20} />
                        Reviews & Ratings
                    </Link>
                    <Link to="/vendor/orders" className={`nav-item ${currentPath.includes('/vendor/orders') ? 'active' : ''}`}>
                        <ShoppingCart size={20} />
                        Orders
                    </Link>
                    <Link to="/vendor/shipping" className={`nav-item ${currentPath.startsWith('/vendor/shipping') ? 'active' : ''}`}>
                        <Truck size={20} />
                        Shipping
                    </Link>

                    <Link to="/vendor/payouts" className={`nav-item ${currentPath === '/vendor/payouts' ? 'active' : ''}`}>
                        <CreditCard size={20} />
                        Payouts
                    </Link>
                    <Link to="/vendor/staffmanagement" className={`nav-item ${currentPath === '/vendor/staffmanagement' ? 'active' : ''}`}>
                        <Users size={20} />
                        Staff Manager
                    </Link>
                    <Link to="/vendor/coupons" className={`nav-item ${currentPath === '/vendor/coupons' ? 'active' : ''}`}>
                        <Tag size={20} />
                        Promotions
                    </Link>
                    <Link to="/vendor/returns" className={`nav-item ${currentPath === '/vendor/returns' ? 'active' : ''}`}>
                        <RotateCcw size={20} />
                        Returns & Refunds
                    </Link>
                    <Link to="/vendor/invoices" className={`nav-item ${currentPath === '/vendor/invoices' ? 'active' : ''}`}>
                        <FileText size={20} />
                        Invoices
                    </Link>
                    <Link to="/vendor/product-analytics" className={`nav-item ${currentPath === '/vendor/product-analytics' ? 'active' : ''}`}>
                        <BarChart2 size={20} />
                        Product Analytics
                    </Link>
                    <Link to="/vendor/wholesale" className={`nav-item ${currentPath === '/vendor/wholesale' ? 'active' : ''}`}>
                        <Package size={20} />
                        Wholesale
                    </Link>
                    <Link to="/vendor/inventory-history" className={`nav-item ${currentPath === '/vendor/inventory-history' ? 'active' : ''}`}>
                        <ClipboardList size={20} />
                        Inventory History
                    </Link>
                    <Link to="/vendor/customer-demographics" className={`nav-item ${currentPath === '/vendor/customer-demographics' ? 'active' : ''}`}>
                        <MapPin size={20} />
                        Demographics
                    </Link>
                    <Link to="/vendor/abandoned-orders" className={`nav-item ${currentPath === '/vendor/abandoned-orders' ? 'active' : ''}`}>
                        <Send size={20} />
                        Abandoned Recovery
                    </Link>
                    <Link to="/vendor/fulfillments" className={`nav-item ${currentPath === '/vendor/fulfillments' ? 'active' : ''}`}>
                        <Package size={20} />
                        Partial Fulfillment
                    </Link>
                    <Link to="/vendor/reports" className={`nav-item ${currentPath === '/vendor/reports' ? 'active' : ''}`}>
                        <Download size={20} />
                        Reports
                    </Link>
                    <Link to="/vendor/subscription" className={`nav-item ${currentPath === '/vendor/subscription' ? 'active' : ''}`}>
                        <Crown size={20} />
                        Subscription
                    </Link>
                    <Link to="/vendor/product-schedules" className={`nav-item ${currentPath === '/vendor/product-schedules' ? 'active' : ''}`}>
                        <Calendar size={20} />
                        Product Scheduling
                    </Link>
                    <Link to="/vendor/review-templates" className={`nav-item ${currentPath === '/vendor/review-templates' ? 'active' : ''}`}>
                        <MessageSquare size={20} />
                        Reply Templates
                    </Link>
                    <Link to="/vendor/qr-codes" className={`nav-item ${currentPath === '/vendor/qr-codes' ? 'active' : ''}`}>
                        <QrCode size={20} />
                        QR Codes
                    </Link>
                    <Link to="/vendor/guide" className={`nav-item ${currentPath === '/vendor/guide' ? 'active' : ''}`}>
                        <BookOpen size={20} />
                        Vendor Guide
                    </Link>
                    <Link to="/vendor/stores" className={`nav-item ${currentPath === '/vendor/stores' ? 'active' : ''}`}>
                        <Store size={20} />
                        Store Management
                    </Link>
                    <Link to="/vendor/settings" className={`nav-item ${currentPath === '/vendor/settings' ? 'active' : ''}`}>
                        <Settings size={20} />
                        Settings
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <Link to="/vendor/help" className="nav-item">
                        <HelpCircle size={20} />
                        Help Center
                    </Link>
                    <button className="nav-item" onClick={handleLogout} style={{ border: 'none', background: 'transparent', textAlign: 'left', width: '100%', fontFamily: 'inherit', fontSize: '1rem', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Dynamic Main Content injected here */}
            <main className="vendor-main-content">
                {children}
            </main>
        </div>
    );
};

export default VendorLayout;
