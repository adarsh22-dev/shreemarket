import React from 'react';
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
    Star
} from 'lucide-react';
import smarketLogo from '../../assets/smarketlogo.svg';
import { logoutUser } from '../../api/api';
import '../../pages/vendor/VendorDashboard.css'; // Inheriting sidebar styling

const VendorLayout = ({ children }) => {
    const location = useLocation();
    const currentPath = location.pathname;

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
                    <Link to="/vendor/notifications" className={`nav-item ${currentPath.includes('/vendor/notifications') ? 'active' : ''}`}>
                        <Bell size={20} />
                        Notifications
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
                    <Link to="/vendor/shipping" className={`nav-item ${currentPath.includes('/vendor/shipping') ? 'active' : ''}`}>
                        <Truck size={20} />
                        Shipping
                    </Link>
                    <Link to="/vendor/promotions" className={`nav-item ${currentPath.includes('/vendor/promotions') ? 'active' : ''}`}>
                        <Tag size={20} />
                        Promotions
                    </Link>
                    <Link to="/vendor/payouts" className={`nav-item ${currentPath === '/vendor/payouts' ? 'active' : ''}`}>
                        <CreditCard size={20} />
                        Payouts
                    </Link>
                    <Link to="/vendor/staffmanagement" className={`nav-item ${currentPath === '/vendor/staffmanagement' ? 'active' : ''}`}>
                        <Users size={20} />
                        Staff Manager
                    </Link>
                    <Link to="/vendor/guide" className={`nav-item ${currentPath === '/vendor/guide' ? 'active' : ''}`}>
                        <BookOpen size={20} />
                        Vendor Guide
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
