import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, LogOut, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { logoutUser } from '../../api/api';

const NAV = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/wholesaler/dashboard' },
    { label: 'Orders', icon: ShoppingCart, path: '/wholesaler/orders' },
    { label: 'Products', icon: Package, path: '/wholesaler/products' },
    { label: 'RFQs', icon: MessageSquare, path: '/wholesaler/rfqs' },
    { label: 'Settings', icon: Settings, path: '/wholesaler/settings' },
];

const WholesalerLayout = () => {
    const location = useLocation();
    const p = location.pathname;
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('user'));
            setUser(stored);
        } catch {}
    }, []);

    const handleLogout = async () => {
        try { await logoutUser(); } catch {}
        localStorage.removeItem('user');
        window.location.replace('/wholesaler/login');
    };

    const isActive = (path) => p === path || p.startsWith(path + '/');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
            <aside style={{ width: '240px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>Wholesaler</h2>
                    {user && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{user.businessName || user.fullName}</p>}
                </div>
                <nav style={{ flex: 1, padding: '0.75rem' }}>
                    {NAV.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link key={item.label} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', textDecoration: 'none', color: active ? '#d97706' : '#374151', background: active ? '#fffbeb' : 'transparent', fontWeight: active ? '600' : '400', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                <Icon size={18} /><span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div style={{ padding: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', width: '100%', fontSize: '0.9rem', fontWeight: '500' }}>
                        <LogOut size={18} /><span>Logout</span>
                    </button>
                </div>
            </aside>
            <main style={{ marginLeft: '240px', flex: 1, padding: '1.5rem' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default WholesalerLayout;
