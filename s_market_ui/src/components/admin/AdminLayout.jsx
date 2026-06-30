import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import {
    LayoutDashboard, BarChart2, Store, Package, ShoppingCart,
    Users, DollarSign, Megaphone, Star, FileText, Settings,
    LogOut, ChevronDown, ChevronRight,
    Ticket, Shield, Bot, Receipt, Warehouse,
} from 'lucide-react';
import smarketLogo from '../../assets/smarketlogo.svg';

import { logoutUser } from '../../api/api';
import './AdminLayout.css';

const NAV = [
    { label: 'Dashboard',  icon: LayoutDashboard, path: '/admin/dashboard', exact: true },
    { label: 'Analytics',  icon: BarChart2,        path: '/admin/analytics' },
    {
        label: 'Vendor Management', icon: Store,
        children: [
            { label: 'All Vendors',           path: '/admin/vendors' },
            { label: 'Applications',          path: '/admin/vendors/tab/apps' },
            { label: 'KYC Verification',      path: '/admin/vendors/tab/kyc' },
            { label: 'Commission Settings',   path: '/admin/vendors/tab/commission' },
            { label: 'Tier System',           path: '/admin/vendors/tab/tiers' },
            { label: 'Payout History',        path: '/admin/vendors/tab/payouts' },
            { label: 'Performance Metrics',   path: '/admin/vendors/tab/performance' },
            { label: 'Vendor Activities',     path: '/admin/vendors/activities' },
        ],
    },
    {
        label: 'Wholesaler', icon: Warehouse,
        children: [
            { label: 'All Wholesalers',       path: '/admin/wholesalers' },
        ],
    },
    {
        label: 'Product Management', icon: Package,
        children: [
            { label: 'All Products',          path: '/admin/products' },
            { label: 'Pending Approval',      path: '/admin/products/tab/pending' },
            { label: 'Categories',            path: '/admin/products/tab/cats' },
            { label: 'Brands',                path: '/admin/products/tab/brands' },
            { label: 'Featured Products',     path: '/admin/products/tab/featured' },
            { label: 'Flagged Products',      path: '/admin/products/tab/flagged' },
            { label: 'SEO Meta',              path: '/admin/products/tab/seo' },
        ],
    },
    {
        label: 'Order Management', icon: ShoppingCart,
        children: [
            { label: 'All Orders',            path: '/admin/orders' },
            { label: 'Returns & Refunds',     path: '/admin/orders/returns' },
            { label: 'Cancellations',         path: '/admin/orders/cancellations' },
            { label: 'Delivery Partners',     path: '/admin/orders/delivery' },
            { label: 'Shipping Zones',        path: '/admin/orders/shipping-zones' },
        ],
    },
    {
        label: 'Tax & GST', icon: Receipt,
        children: [
            { label: 'Tax Rates',             path: '/admin/tax' },
            { label: 'Currencies',            path: '/admin/currencies' },
            { label: 'GST & Invoices',        path: '/admin/payouts/gst' },
        ],
    },
    {
        label: 'Commission & Payouts', icon: DollarSign,
        children: [
            { label: 'Payout Requests',       path: '/admin/payouts' },
            { label: 'Commission Rules',      path: '/admin/payouts/commission' },
            { label: 'Payout Scheduler',      path: '/admin/payouts/scheduler' },
            { label: 'Payment Gateway Logs',  path: '/admin/payouts/gateway' },
        ],
    },
    {
        label: 'Customer Management', icon: Users,
        children: [
            { label: 'All Customers',         path: '/admin/customers' },
            { label: 'Customer Segments',     path: '/admin/customer-segments' },
            { label: 'Loyalty Points',        path: '/admin/customers/loyalty' },
            { label: 'Refund History',        path: '/admin/customers/refunds' },
        ],
    },
    {
        label: 'WooAI', icon: Bot,
        children: [
            { label: 'Dashboard',            path: '/admin/wooai/dashboard' },
            { label: 'Assignments',          path: '/admin/wooai/assignments' },
            { label: 'Quick Actions',        path: '/admin/wooai/quick-actions' },
            { label: 'Policies',             path: '/admin/wooai/policies' },
            { label: 'Callbacks',            path: '/admin/wooai/callbacks' },
            { label: 'Chat Logs',            path: '/admin/wooai/chatlogs' },
            { label: 'Settings',             path: '/admin/wooai/settings' },
        ],
    },
    {
        label: 'Support & Tickets', icon: Ticket,
        children: [
            { label: 'All Tickets',           path: '/admin/support' },
            { label: 'Vendor Tickets',        path: '/admin/support/vendor' },
            { label: 'Customer Tickets',      path: '/admin/support/customer' },
            { label: 'Help Center',         path: '/admin/support/contacts' },
        ],
    },
    {
        label: 'Marketing', icon: Megaphone,
        children: [
            { label: 'Abandoned Carts',       path: '/admin/abandoned-carts' },
            { label: 'Marketplace Fees',      path: '/admin/marketplace-fees' },
            { label: 'Inventory Alerts',     path: '/admin/inventory-alerts' },
            { label: 'Coupons',               path: '/admin/marketing/coupons' },
            { label: 'Flash Sales',           path: '/admin/marketing/flash-sales' },
            { label: 'Banners',               path: '/admin/marketing/banners' },
            { label: 'Push Notifications',    path: '/admin/marketing/notifications' },
            { label: 'Newsletter',            path: '/admin/marketing/newsletter' },
            { label: 'Referral Program',      path: '/admin/marketing/referrals' },
            { label: 'Announcements',         path: '/admin/marketing/announcements' },
            { label: 'Gift Cards',            path: '/admin/gift-cards' },
            { label: 'Product Bundles',       path: '/admin/product-bundles' },
        ],
    },
    {
        label: 'Reviews & Ratings', icon: Star,
        children: [
            { label: 'Pending Reviews',       path: '/admin/reviews' },
            { label: 'Reported Reviews',      path: '/admin/reviews/reported' },
            { label: 'Vendor Ratings',        path: '/admin/reviews/vendors' },
            { label: 'Testimonials',          path: '/admin/reviews/testimonials' },
        ],
    },
    {
        label: 'CMS', icon: FileText,
        children: [
            { label: 'Pages',                 path: '/admin/cms/pages' },
            { label: 'Blog',                  path: '/admin/cms/blog' },
            { label: 'Homepage Builder',      path: '/admin/cms/homepage' },
            { label: 'Real-Life Looks',       path: '/admin/real-life-looks' },
            { label: 'FAQs',                  path: '/admin/cms/faqs' },
            { label: 'URL Redirects',         path: '/admin/cms/redirects' },
            { label: 'Custom Code',           path: '/admin/cms/custom-code' },
        ],
    },
    {
        label: 'System', icon: Settings,
        children: [
            { label: 'Bulk Stock Import/Export', path: '/admin/system/bulk-stock' },
            { label: 'Maintenance Mode',         path: '/admin/system/maintenance' },
            { label: 'Activity Dashboard',      path: '/admin/system/activity' },
            { label: 'System Health',            path: '/admin/system/health' },
        ],
    },
    {
        label: 'Users & Roles', icon: Shield,
        children: [
            { label: 'All Users',             path: '/admin/users' },
            { label: 'Roles & Permissions',   path: '/admin/roles' },
            { label: 'Add User',              path: '/admin/users/create' },
        ],
    },    {
        label: 'Reports & Reports', icon: BarChart2,
        children: [
            { label: 'Report Builder',        path: '/admin/reports' },
            { label: 'Tax / GST Reports',     path: '/admin/tax-reports' },
            { label: 'Competitor Prices',     path: '/admin/competitor-prices' },
        ],
    },
    {
        label: 'Content', icon: FileText,
        children: [
            { label: 'Size Guides',           path: '/admin/size-guides' },
        ],
    },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const AdminLayout = () => {
    const location = useLocation();
    const p = location.pathname;

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

    const [openGroups, setOpenGroups] = useState(() => {
        const init = {};
        NAV.forEach(item => {
            if (item.children) {
                const active = item.children.some(c => p === c.path || p.startsWith(c.path + '/'));
                if (active) init[item.label] = true;
            }
        });
        return init;
    });

    // Auto-expand the group containing the active route whenever path changes
    useEffect(() => {
        setOpenGroups(prev => {
            const next = { ...prev };
            NAV.forEach(item => {
                if (item.children) {
                    const hasActiveChild = item.children.some(c => p === c.path || p.startsWith(c.path + '/'));
                    if (hasActiveChild) next[item.label] = true;
                }
            });
            return next;
        });
    }, [p]);

    const toggle = (label) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

    const isActive = (path, exact) =>
        exact ? p === path : p === path || p.startsWith(path + '/');

    return (
        <div className="al-root">
            {/* ══ SIDEBAR ══ */}
            <aside className="al-sidebar">
                <div className="al-logo">
                    <img src={smarketLogo} alt="S-Market Logo" className="al-logo-img" />
                </div>

                <nav className="al-nav">
                    {NAV.map(item => {
                        const Icon = item.icon;
                        const hasChildren = !!item.children;
                        const groupActive = hasChildren
                            ? item.children.some(c => isActive(c.path))
                            : isActive(item.path, item.exact);
                        const open = openGroups[item.label];

                        if (!hasChildren) {
                            return (
                                <Link key={item.label} to={item.path}
                                    className={`al-nav-item${groupActive ? ' al-active' : ''}`}>
                                    <Icon size={20} className="al-nav-icon" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        }

                        return (
                            <div key={item.label} className="al-group">
                                <button
                                    className={`al-group-btn${groupActive ? ' al-group-active' : ''}`}
                                    onClick={() => toggle(item.label)}>
                                    <Icon size={20} className="al-nav-icon" />
                                    <span>{item.label}</span>
                                    <span className="al-chevron">
                                        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </span>
                                </button>
                                {open && (
                                    <div className="al-sub-nav">
                                        {item.children.map(child => (
                                            <Link key={child.label} to={child.path}
                                                className={`al-sub-item${p === child.path ? ' al-sub-active' : ''}`}>
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="al-footer">
                    <button
                        className="al-nav-item al-nav-btn"
                        onClick={handleLogout}
                        style={{ border: 'none', background: 'transparent', textAlign: 'left', width: '100%', fontFamily: 'inherit', fontSize: '1rem', cursor: 'pointer' }}
                    >
                        <LogOut size={20} className="al-nav-icon" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ══ MAIN ══ */}
            <main className="al-body">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
};

export default AdminLayout;
