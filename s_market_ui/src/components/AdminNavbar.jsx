import React from 'react';
import { Search, Bell, HelpCircle, User, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logoutUser } from '../api/api';
import './AdminNavbar.css';

const AdminNavbar = ({ title, breadcrumbs }) => {
    const handleLogout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem('user');
            // Keep rememberedEmail if present
            window.location.replace('/');
        } catch (error) {
            console.error("Logout failed:", error);
            // Force logout on error
            localStorage.removeItem('user');
            window.location.replace('/');
        }
    };

    return (
        <header className="admin-navbar">
            <div className="admin-navbar-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link to="/admin/dashboard" replace style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#FF5722', // Orange color from logo
                            transform: 'rotate(45deg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px'
                        }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }}></div>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333' }}>SreeMarket</span>

                    </Link>
                </div>

                {breadcrumbs ? (
                    <div className="admin-breadcrumbs">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <span className="breadcrumb-separator">/</span>}
                                {crumb.to ? (
                                    <Link to={crumb.to} className="breadcrumb-link">{crumb.label}</Link>
                                ) : (
                                    <span className="breadcrumb-current">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <h1>{title}</h1>
                )}
            </div>

            <div className="admin-navbar-actions">

                <div className="admin-profile">
                    <div className="profile-icon">
                        <User size={20} />
                    </div>
                    <div className="profile-info">
                        <span className="profile-name">Admin User</span>
                        <span className="profile-role">Super Admin</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminNavbar;
