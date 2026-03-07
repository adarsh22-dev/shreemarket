import React, { useState, useEffect } from 'react';
import { Plus, Edit2, MoreVertical, ChevronDown, ChevronLeft, ChevronRight, User, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminNavbar from '../../components/AdminNavbar';
import { getVendors, updateVendorStatus } from '../../api/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    // Mock Data for Roles
    const [roles] = useState([
        { id: 1, name: 'Super Admin', description: 'Unrestricted access to all platform modules and financial data.', users: 4, color: '#FF5722' },
        { id: 2, name: 'Moderator', description: 'Manage user comments, reviews, and basic storefront listings.', users: 12, color: '#FF9800' },
        { id: 3, name: 'Vendor Manager', description: 'Review vendor applications and manage seller payouts.', users: 8, color: '#2196F3' }
    ]);

    // State for Vendors
    const [vendors, setVendors] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Status Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        user: null,
        newStatus: ''
    });

    // Fetch Vendors
    const fetchVendors = async () => {
        setLoading(true);
        try {
            const data = await getVendors(search, page, 10); // Page size 10
            setVendors(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error("Failed to fetch vendors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchVendors();
        }, 300); // Debounce search
        return () => clearTimeout(debounce);
    }, [page, search]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0); // Reset to first page on search
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getRoleName = (roleId) => {
        switch (roleId) {
            case 1: return 'Admin';
            case 2: return 'Customer';
            case 3: return 'Vendor';
            case 4: return 'Moderator';
            default: return 'User';
        }
    };

    const handleToggleStatus = (user) => {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        if (newStatus === 'Inactive') {
            // Require confirmation for deactivation
            setConfirmModal({
                isOpen: true,
                user: user,
                newStatus: newStatus
            });
        } else {
            // Instantly activate without confirmation
            updateStatus(user.id, newStatus);
        }
    };

    const confirmStatusChange = () => {
        updateStatus(confirmModal.user.id, confirmModal.newStatus);
        setConfirmModal({ isOpen: false, user: null, newStatus: '' });
    };

    const updateStatus = async (userId, newStatus) => {
        const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
        try {
            await updateVendorStatus(userId, newStatus);
            toast.dismiss(loadingToast);
            toast.success(`User status updated to ${newStatus}`);
            // Refresh table
            fetchVendors();
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Failed to update status", error);
            toast.error(error.message || "Failed to update status");
        }
    };

    return (
        <div className="admin-dashboard">
            {/* Navbar */}
            <AdminNavbar title="User & Role Management" />

            {/* Main Content */}
            <main className="admin-content">
                <div className="dashboard-title-section">
                    <h2>Administration Dashboard</h2>
                </div>


                {/* User & Vendor Directory Section */}
                <section className="admin-section">
                    <div className="section-header">
                        <div>
                            <h3>User & Vendor Directory</h3>
                        </div>
                        <div className="header-actions">
                            <div className="search-wrapper" style={{ position: 'relative', marginRight: '1rem' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="search-input"
                                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem', height: '40px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    value={search}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <Link to="/admin/users/create" className="btn-primary" style={{ textDecoration: 'none' }}>
                                <Plus size={16} /> Add New User/Vendor
                            </Link>
                        </div>
                    </div>

                    <div className="table-container">
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                        ) : (
                            <table className="admin-table">
                                <thead><tr>
                                    <th>NAME</th>
                                    <th>EMAIL ADDRESS</th>
                                    <th>ASSIGNED ROLE</th>
                                    <th>STATUS</th>
                                    <th>DATE ADDED</th>
                                    <th className="text-right">ACTIONS</th>
                                </tr></thead>
                                <tbody>
                                    {vendors.length > 0 ? (
                                        vendors.map(user => (
                                            <tr key={user.id}><td>
                                                <div className="user-info">
                                                    <div className="user-avatar">
                                                        {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : <User size={20} />}
                                                    </div>
                                                    <span className="user-name">{user.fullName}</span>
                                                </div>
                                            </td>
                                                <td className="user-email">{user.email}</td>
                                                <td>
                                                    <span className={`role-badge role-${getRoleName(user.roleId).toLowerCase()}`}>
                                                        {getRoleName(user.roleId)} <ChevronDown size={12} className="ml-1" />
                                                    </span>
                                                </td>
                                                <td>
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={user.status === 'Active'}
                                                            onChange={() => handleToggleStatus(user)}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </td>
                                                <td className="user-date">{formatDate(user.createdAt)}</td>
                                                <td className="text-right">
                                                    <button className="action-btn"><MoreVertical size={16} /></button>
                                                </td></tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                            No vendors found.
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="pagination-container">
                        <span className="pagination-info">
                            Showing {Math.min(page * 10 + 1, totalElements)} to {Math.min((page + 1) * 10, totalElements)} of {totalElements} users
                        </span>
                        <div className="pagination-controls">
                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {/* Simple pagination: showing Page X of Y */}
                            <span style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0.5rem' }}>
                                Page {page + 1} of {totalPages || 1}
                            </span>

                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages - 1}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content text-center">
                        <h3 style={{ marginBottom: '1rem', color: '#111' }}>Deactivate Account?</h3>
                        <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Are you sure you want to deactivate <strong>{confirmModal.user?.fullName}</strong>?
                            They will immediately lose access to the portal.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                className="btn-outline"
                                onClick={() => setConfirmModal({ isOpen: false, user: null, newStatus: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                style={{ backgroundColor: '#dc2626' }}
                                onClick={confirmStatusChange}
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
