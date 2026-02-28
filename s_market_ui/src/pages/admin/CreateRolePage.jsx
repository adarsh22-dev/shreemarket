import React, { useState } from 'react';
import { Info, Shield, RotateCcw, Save, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import './CreateRolePage.css';

const CreateRolePage = () => {
    // ... (keep existing constants)
    const modules = [
        { id: 'dashboard', name: 'Dashboard', desc: 'Overview stats and analytics' },
        { id: 'products', name: 'Products', desc: 'Manage catalog and inventory' },
        { id: 'orders', name: 'Orders', desc: 'Process sales and returns' },
        { id: 'finances', name: 'Finances', desc: 'Revenue, taxes, and payouts' },
        { id: 'communications', name: 'Communications', desc: 'Support chat and notifications' },
        { id: 'settings', name: 'Settings', desc: 'System config and users' }
    ];

    const actions = ['view', 'edit', 'delete', 'export'];

    // State for permissions matrix
    const [permissions, setPermissions] = useState({});

    const handlePermissionChange = (moduleId, action) => {
        setPermissions(prev => ({
            ...prev,
            [`${moduleId}-${action}`]: !prev[`${moduleId}-${action}`]
        }));
    };

    return (
        <div className="create-role-page">
            <AdminNavbar breadcrumbs={[
                { label: 'Dashboard', to: '/admin/dashboard' },
                { label: 'User & Role Management', to: '/admin/dashboard' },
                { label: 'Create Role', to: null }
            ]} />

            <div className="role-content">
                <Link to="/admin/dashboard" className="back-link-wrapper">
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </Link>

                {/* General Information Card */}
                <section className="role-card">
                    <div className="card-header">
                        <Info size={20} className="header-icon" />
                        <h3>General Information</h3>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Role Name</label>
                            <input type="text" placeholder="e.g. Inventory Manager" />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <input type="text" placeholder="Briefly describe the responsibilities of this role..." />
                        </div>
                    </div>
                </section>

                {/* Permissions & Access Card */}
                <section className="role-card">
                    <div className="card-header-flex">
                        <div className="card-header">
                            <Shield size={20} className="header-icon" />
                            <h3>Permissions & Access</h3>
                        </div>
                        <button className="btn-text-danger" onClick={() => setPermissions({})}>
                            Reset to Default
                        </button>
                    </div>

                    <div className="permissions-table-container">
                        <table className="permissions-table">
                            <thead>
                                <tr>
                                    <th className="col-module">MODULE / PAGE</th>
                                    {actions.map(action => (
                                        <th key={action} className="col-action">{action.toUpperCase()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map(module => (
                                    <tr key={module.id}>
                                        <td>
                                            <div className="module-info">
                                                <div className="module-icon-placeholder">
                                                    {/* Icons could be dynamic based on module */}
                                                    <div className={`icon-${module.id}`}></div>
                                                </div>
                                                <div>
                                                    <div className="module-name">{module.name}</div>
                                                    <div className="module-desc">{module.desc}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {actions.map(action => (
                                            <td key={action} className="text-center">
                                                <label className="checkbox-container">
                                                    <input
                                                        type="checkbox"
                                                        checked={permissions[`${module.id}-${action}`] || false}
                                                        onChange={() => handlePermissionChange(module.id, action)}
                                                    />
                                                    <span className="checkmark"></span>
                                                </label>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Footer Actions */}
                <div className="role-footer">
                    <div className="footer-info">
                        <RotateCcw size={16} />
                        <span>Last updated: <strong>Today, 10:45 AM</strong></span>
                    </div>
                    <div className="footer-buttons">
                        <Link to="/admin/dashboard" className="btn-secondary">Cancel</Link>
                        <button className="btn-primary">
                            <Save size={16} /> Create Role
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRolePage;
