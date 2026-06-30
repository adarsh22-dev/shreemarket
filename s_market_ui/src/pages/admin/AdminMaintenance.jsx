import React, { useState, useEffect } from 'react';
import './AdminMaintenance.css';
import { getMaintenanceStatus, toggleMaintenanceMode } from '../../api/api';
import { Shield, AlertTriangle, Wifi, WifiOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMaintenance = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const data = await getMaintenanceStatus();
      setMaintenanceMode(data.maintenanceMode);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const data = await toggleMaintenanceMode(!maintenanceMode);
      setMaintenanceMode(data.maintenanceMode);
      toast.success(data.message);
    } catch {
      toast.error('Failed to toggle maintenance mode');
    } finally { setToggling(false); }
  };

  if (loading) {
    return (
      <div className="mm">
        <div className="mm-hdr">
          <h1 className="mm-hdr__t"><Shield size={20} style={{ color: '#E03E1A' }} /> Maintenance Mode</h1>
          <p className="mm-hdr__s">Enable or disable platform-wide maintenance mode</p>
        </div>
        <div className="mm-loading"><Loader size={24} style={{ marginBottom: 8 }} /><div>Loading...</div></div>
      </div>
    );
  }

  return (
    <div className="mm">
      <div className="mm-hdr">
        <h1 className="mm-hdr__t"><Shield size={20} style={{ color: '#E03E1A' }} /> Maintenance Mode</h1>
        <p className="mm-hdr__s">Enable or disable platform-wide maintenance mode</p>
      </div>

      <div className={`mm-card ${maintenanceMode ? 'mm-card--offline' : 'mm-card--online'}`}>
        <div className="mm-status">
          <div className={`mm-status__icon ${maintenanceMode ? 'mm-status__icon--offline' : 'mm-status__icon--online'}`}>
            {maintenanceMode ? <WifiOff size={26} style={{ color: '#dc2626' }} /> : <Wifi size={26} style={{ color: '#16a34a' }} />}
          </div>
          <div>
            <h2 className="mm-status__ttl">{maintenanceMode ? 'Maintenance Mode Active' : 'System Online'}</h2>
            <p className="mm-status__sub">
              {maintenanceMode
                ? 'The platform is currently in maintenance mode. Only admins can access the system.'
                : 'The platform is operating normally. All users have full access.'}
            </p>
          </div>
        </div>

        {maintenanceMode && (
          <div className="mm-warn">
            <AlertTriangle size={16} style={{ color: '#dc2626', marginTop: 2, flexShrink: 0 }} />
            <p className="mm-warn__txt">When maintenance mode is enabled, all non-admin users will see a "Platform under maintenance" message when trying to access the site.</p>
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`mm-btn ${maintenanceMode ? 'mm-btn--disable' : 'mm-btn--enable'}`}
        >
          {toggling ? 'Processing...' : maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
        </button>
      </div>
    </div>
  );
};

export default AdminMaintenance;
