import React, { useState, useEffect } from 'react';
import { Info, Shield, RotateCcw, Save, ChevronLeft, AlertCircle, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import { getAdminRoles, createAdminRole, updateAdminRole } from '../../api/api';
import './CreateRolePage.css';

const modules = [
  { id: 'dashboard', name: 'Dashboard', desc: 'Overview stats and analytics' },
  { id: 'products', name: 'Products', desc: 'Manage catalog and inventory' },
  { id: 'orders', name: 'Orders', desc: 'Process sales and returns' },
  { id: 'finances', name: 'Finances', desc: 'Revenue, taxes, and payouts' },
  { id: 'communications', name: 'Communications', desc: 'Support chat and notifications' },
  { id: 'settings', name: 'Settings', desc: 'System config and users' },
];

const actions = ['view', 'edit', 'delete', 'export'];

const permissionsToObj = perms => {
  if (!perms) return {};
  try { return JSON.parse(perms); } catch { return {}; }
};

const objToPermissions = obj => JSON.stringify(obj);

const CreateRolePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    getAdminRoles().then(data => {
      const role = data?.find(r => String(r.id) === id);
      if (role) {
        setName(role.name || '');
        setDesc(role.description || '');
        setPermissions(permissionsToObj(role.permissions));
      }
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'Failed to load role');
      setLoading(false);
    });
  }, [id, isEdit]);

  const handlePermissionChange = (moduleId, action) => {
    setPermissions(prev => ({
      ...prev,
      [`${moduleId}-${action}`]: !prev[`${moduleId}-${action}`],
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), description: desc.trim(), permissions: objToPermissions(permissions) };
      if (isEdit) {
        await updateAdminRole(id, payload);
      } else {
        await createAdminRole(payload);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-role-page">
        <AdminNavbar breadcrumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Roles', to: null }]} />
        <div className="role-content" style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading role…</div>
      </div>
    );
  }

  return (
    <div className="create-role-page">
      <AdminNavbar breadcrumbs={[
        { label: 'Dashboard', to: '/admin/dashboard' },
        { label: 'User & Role Management', to: '/admin/dashboard' },
        { label: isEdit ? 'Edit Role' : 'Create Role', to: null },
      ]} />

      <div className="role-content">
        <Link to="/admin/dashboard" className="back-link-wrapper">
          <ChevronLeft size={20} />
          <span>Back</span>
        </Link>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '.82rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertCircle size={13} /><span style={{ flex: 1 }}>{error}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }} onClick={() => setError(null)}><X size={13} /></button>
          </div>
        )}

        <section className="role-card">
          <div className="card-header">
            <Info size={20} className="header-icon" />
            <h3>General Information</h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role Name</label>
              <input type="text" placeholder="e.g. Inventory Manager" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" placeholder="Briefly describe the responsibilities of this role..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
          </div>
        </section>

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

        <div className="role-footer">
          <div className="footer-info">
            <RotateCcw size={16} />
            <span>Last updated: <strong>Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
          <div className="footer-buttons">
            <Link to="/admin/dashboard" className="btn-secondary">Cancel</Link>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
              <Save size={16} /> {saving ? 'Saving…' : isEdit ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRolePage;
