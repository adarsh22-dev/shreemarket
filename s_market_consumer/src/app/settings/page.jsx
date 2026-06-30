'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { Pencil, Trash2, Plus, Bell, Hash, CreditCard, Home as HomeIcon, Briefcase, MapPin, X, Eye, EyeOff, MonitorSmartphone, Monitor, Smartphone, CheckCircle, LogOut } from 'lucide-react';
import {
    getUserDetails, updateUserDetails,
    fetchUserAddresses, addUserAddress,
    updateUserAddress, deleteUserAddress, setAddressAsDefault,
    updateUserPassword, updateVendorPassword,
    deleteUser, deleteVendor,
    getUserDevices, logoutDevice
} from '@/lib/api/client';
import './SettingsPage.css';

const SettingsPage = () => {
    const router = useRouter();
    const { user: authUser, logout } = useAuth();
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: ''
    });
    const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null, success: false });

    // Devices State
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    // Address State
    const [addresses, setAddresses] = useState([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressForm, setAddressForm] = useState({
        title: '',
        fullName: '',
        phoneNumber: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
    });
    const [addressLoading, setAddressLoading] = useState(false);

    // Password Visibility State
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: null, success: false });

    // Account Deletion State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletionPassword, setDeletionPassword] = useState('');
    const [deletionLoading, setDeletionLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchUserDetailsData = async () => {
            try {
                if (authUser && authUser.userId) {
                    const data = await getUserDetails(authUser.userId);
                    setUserDetails(data);
                    setFormData({
                        fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        email: data.email || '',
                        phone: data.phone || ''
                    });

                    // Fetch their addresses
                    try {
                        const userAddresses = await fetchUserAddresses(authUser.userId);
                        setAddresses(userAddresses);
                    } catch (addrErr) {
                        console.error("Failed to fetch addresses:", addrErr);
                    }

                    // Fetch active devices
                    try {
                        setLoadingDevices(true);
                        const devResponse = await getUserDevices(authUser.userId, authUser.roleId);
                        let rawDevices = [];
                        if (devResponse && Array.isArray(devResponse)) {
                            rawDevices = devResponse;
                        } else if (devResponse && devResponse.data) {
                            rawDevices = devResponse.data;
                        }

                        // Deduplicate: keep only the latest session per unique device (OS + browser combo)
                        const deviceMap = new Map();
                        for (const d of rawDevices) {
                            const key = `${d.os || ''}_${d.browser || ''}_${d.deviceType || ''}`;
                            const existing = deviceMap.get(key);
                            if (!existing || new Date(d.lastActive) > new Date(existing.lastActive)) {
                                deviceMap.set(key, d);
                            }
                        }

                        // Sort newest first
                        const uniqueDevices = Array.from(deviceMap.values())
                            .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

                        setDevices(uniqueDevices);
                    } catch (devErr) {
                        console.error("Failed to fetch devices:", devErr);
                    } finally {
                        setLoadingDevices(false);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetailsData();
    }, [authUser]);

    const user = userDetails || authUser || {
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.j@example.com',
        phone: '+1 (555) 000-0000',
        fullName: 'Alex Johnson'
    };

    const phoneNumber = user.phone || '+1 (555) 000-0000';
    const fullName = user.fullName || `${user.firstName || 'Alex'} ${user.lastName || 'Johnson'}`;
    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' })
        : 'March 2023';

    if (loading) {
        return <div className="settings-page-wrapper"><Navbar /><div className="settings-container"><p>Loading...</p></div></div>;
    }

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear status messages when user starts typing
        if (updateStatus.error || updateStatus.success) {
            setUpdateStatus({ loading: false, error: null, success: false });
        }
    };

    const handlePasswordInputChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
        if (passwordStatus.error || passwordStatus.success) {
            setPasswordStatus({ loading: false, error: null, success: false });
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        // Basic frontend validation
        if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
            setUpdateStatus({ loading: false, error: 'All fields are required', success: false });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setUpdateStatus({ loading: false, error: 'Please enter a valid email address', success: false });
            return;
        }

        setUpdateStatus({ loading: true, error: null, success: false });

        try {
            if (!authUser || !authUser.userId) {
                throw new Error("User session not found");
            }

            const updatedData = await updateUserDetails(authUser.userId, {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone
            });

            setUserDetails(updatedData);
            setUpdateStatus({ loading: false, error: null, success: true });
            toast.success("Profile updated successfully!");

            // Optionally update local storage with new base values
            const storedUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({
                ...storedUser,
                fullName: updatedData.fullName,
                firstName: updatedData.fullName.split(' ')[0],
                lastName: updatedData.fullName.split(' ').slice(1).join(' ') || '',
                email: updatedData.email
            }));

            // Hide success message after 3 seconds
            setTimeout(() => {
                setUpdateStatus(prev => ({ ...prev, success: false }));
            }, 3000);

        } catch (error) {
            const errorMsg = error.message || 'Failed to update user details';
            setUpdateStatus({ loading: false, error: errorMsg, success: false });
            toast.error(errorMsg);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordStatus({ ...passwordStatus, error: "New passwords do not match" });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            const errorMsg = "Password must be at least 8 characters";
            setPasswordStatus({ ...passwordStatus, error: errorMsg });
            toast.error(errorMsg);
            return;
        }

        setPasswordStatus({ ...passwordStatus, loading: true, error: null });

        try {
            if (!authUser || !authUser.userId) throw new Error("User session not found");

            const roleId = authUser.roleId;
            const userId = authUser.userId;

            if (roleId === 3) {
                await updateVendorPassword(userId, {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                });
            } else {
                await updateUserPassword(userId, {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                });
            }

            setPasswordStatus({ loading: false, error: null, success: true });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password updated successfully!");

            // Hide success message after 3 seconds
            setTimeout(() => {
                setPasswordStatus(prev => ({ ...prev, success: false }));
            }, 3000);
        } catch (error) {
            const errorMsg = error.message || 'Failed to update password';
            setPasswordStatus({ loading: false, error: errorMsg, success: false });
            toast.error(errorMsg);
        }
    };

    const handleAddressInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setAddressForm({
            ...addressForm,
            [e.target.name]: value
        });
    };

    const handleDeleteAccount = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteAccount = async (e) => {
        e.preventDefault();

        if (!deletionPassword.trim()) {
            toast.error("Please enter your password to confirm");
            return;
        }

        setDeletionLoading(true);

        try {
            if (!authUser || !authUser.userId) throw new Error("User session not found");

            if (authUser.roleId === 3) {
                await deleteVendor(authUser.userId, deletionPassword);
            } else {
                await deleteUser(authUser.userId, deletionPassword);
            }

            toast.success("Account deleted successfully");
            setIsDeleteModalOpen(false);
            await logout();
            router.push('/');
        } catch (error) {
            console.error("Failed to delete account:", error);
            toast.error(error.message || "Failed to delete account");
        } finally {
            setDeletionLoading(false);
        }
    };

    const handleLogoutDevice = async (deviceId) => {
        try {
            if (!authUser || !authUser.userId) return;

            await logoutDevice(deviceId, authUser.userId, authUser.roleId);
            toast.success("Device logged out successfully");

            // Remove the device from the UI
            setDevices(prevDevices => prevDevices.filter(d => d.id !== deviceId));
        } catch (error) {
            console.error("Failed to log out device:", error);
            toast.error("Failed to log out device");
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setAddressLoading(true);
        try {
            if (!authUser || !authUser.userId) throw new Error("User session not found");

            const payload = {
                ...addressForm,
                userId: authUser.userId,
                roleId: authUser.roleId || 1 // Fallback role if undefined
            };

            const savedAddress = await addUserAddress(payload);

            // Reload addresses from the server to guarantee true state
            const updatedAddresses = await fetchUserAddresses(authUser.userId);
            setAddresses(updatedAddresses);

            setIsAddressModalOpen(false);
            setAddressForm({
                title: '', fullName: '', phoneNumber: '',
                streetAddress: '', city: '', state: '',
                zipCode: '', country: '', isDefault: false
            });
            toast.success("Address saved successfully!");
        } catch (error) {
            console.error("Failed to save address:", error);
            const errorMsg = error.message || "Failed to save address. Please try again.";
            toast.error(errorMsg);
        } finally {
            setAddressLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            await deleteUserAddress(addressId, authUser.userId);

            const updatedAddresses = await fetchUserAddresses(authUser.userId);
            setAddresses(updatedAddresses);
            toast.success("Address deleted successfully!");
        } catch (error) {
            console.error("Failed to delete address:", error);
            toast.error("Could not delete address.");
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        try {
            await setAddressAsDefault(addressId, authUser.userId);

            const updatedAddresses = await fetchUserAddresses(authUser.userId);
            setAddresses(updatedAddresses);
            toast.success("Default address updated!");
        } catch (error) {
            console.error("Failed to set default address:", error);
            toast.error("Failed to set default address.");
        }
    };

    return (
        <div className="settings-page-wrapper">
            <Navbar />

            <div className="settings-container">
                <div className="settings-breadcrumbs">
                    <Link href="/">Home</Link>&gt; <span>Settings</span>
                </div>

                <div className="settings-header">
                    <h1>Account Settings</h1>
                    <p>Manage your personal information, security, and preferences.</p>
                </div>

                <div className="settings-section">
                    <div className="section-header">
                        <h2>Personal Information</h2>
                        <p>Update your basic profile information.</p>
                    </div>
                    <div className="settings-card">
                        <div className="profile-hero">
                            <div className="profile-hero-info">
                                <h3>Hi {fullName}</h3>
                                <p>Member since {memberSince}</p>
                            </div>
                        </div>

                        <form className="personal-info-form" onSubmit={handleUpdateProfile}>
                            {updateStatus.error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{updateStatus.error}</div>}
                            {updateStatus.success && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>Profile updated successfully!</div>}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>
                            <div className="form-row" style={{ marginBottom: 0 }}>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                <div className="form-group form-actions-inline">
                                    <button
                                        type="submit"
                                        className="btn-save"
                                        disabled={updateStatus.loading}
                                    >
                                        {updateStatus.loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="section-header with-action">
                        <div>
                            <h2>Address Book</h2>
                            <p>Manage your shipping and billing addresses.</p>
                        </div>
                        <button className="btn-text-action" onClick={() => setIsAddressModalOpen(true)}>
                            <Plus size={14} /> Add New Address
                        </button>
                    </div>
                    <div className="address-grid">
                        {addresses.length === 0 ? (
                            <p style={{ color: '#777', gridColumn: '1 / -1' }}>No addresses found. Add a new address to get started.</p>
                        ) : (
                            addresses.map((addr) => (
                                <div key={addr.id} className={`address-card ${addr.isDefault ? 'default-address' : ''}`}>
                                    <div className="address-card-header">
                                        <h3>
                                            {addr.title?.toLowerCase() === 'home' ? <HomeIcon size={16} /> :
                                                addr.title?.toLowerCase() === 'office' ? <Briefcase size={16} /> :
                                                    <MapPin size={16} />}
                                            {addr.title || 'Address'}
                                        </h3>
                                        {addr.isDefault && <span className="badge-default">DEFAULT</span>}
                                    </div>
                                    <div className="address-body">
                                        <p><strong>{addr.fullName}</strong> {addr.phoneNumber ? `| ${addr.phoneNumber}` : ''}</p>
                                        <p>{addr.streetAddress}</p>
                                        <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                                        <p>{addr.country}</p>
                                    </div>
                                    <div className="address-actions">
                                        {!addr.isDefault && (
                                            <button className="btn-link" onClick={() => handleSetDefaultAddress(addr.id)}>
                                                SET AS DEFAULT
                                            </button>
                                        )}
                                        <button className="btn-link" onClick={() => handleDeleteAddress(addr.id)}>DELETE</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="settings-grid">
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>Security</h2>
                            <p>Manage your password and security settings.</p>
                        </div>
                        <div className="settings-card">
                            <form className="security-form" onSubmit={handleUpdatePassword}>
                                {passwordStatus.error && <p className="status-message error">{passwordStatus.error}</p>}
                                {passwordStatus.success && <p className="status-message success">Password updated successfully!</p>}

                                <div className="form-group">
                                    <label>Current Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordInputChange}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordInputChange}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordInputChange}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="btn-outline-primary full-width" disabled={passwordStatus.loading}>
                                    {passwordStatus.loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="settings-section">
                        <div className="section-header">
                            <h2>Preferences</h2>
                            <p>Customize your notification and shopping experience.</p>
                        </div>
                        <div className="settings-card">
                            <div className="preferences-group">
                                <h3 className="pref-title"><Bell size={16} /> Notifications</h3>
                                <div className="toggle-row">
                                    <span>Order updates and delivery status</span>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Sessions / Devices Section */}
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>Active Sessions</h2>
                            <p>Manage devices currently logged into your account.</p>
                        </div>
                        <div className="settings-card devices-card">
                            {loadingDevices ? (
                                <p>Loading your devices...</p>
                            ) : devices.length > 0 ? (
                                <div className="devices-list">
                                    {devices.map((device) => {
                                        return (
                                            <div key={device.id} className="device-item">
                                                <div className="device-icon-wrapper">
                                                    {device.deviceType === 'Mobile' ? <Smartphone size={24} /> : <Monitor size={24} />}
                                                </div>
                                                <div className="device-info">
                                                    <h4 className="device-name">
                                                        {device.os} &bull; {device.browser}
                                                    </h4>
                                                    <p className="device-meta">
                                                        {device.ipAddress} &bull; Last active: {new Date(device.lastActive).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="device-actions">
                                                    <button
                                                        className="btn-text text-danger"
                                                        onClick={() => handleLogoutDevice(device.id)}
                                                    >
                                                        <LogOut size={16} /> Log Out
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-muted">No active sessions found.</p>
                            )}
                        </div>
                    </div>

                </div>

                <div className="danger-zone-section">
                    <div className="danger-zone-content">
                        <h2>Danger Zone</h2>
                        <p>Permanently Delete.</p>
                    </div>
                    <button className="btn-outline-danger" onClick={handleDeleteAccount}>Delete Account</button>
                </div>

            </div>

            {/* Address Modal */}
            {isAddressModalOpen && (
                <div className="address-modal-overlay">
                    <div className="address-modal-content">
                        <div className="address-modal-header">
                            <h2>Add New Address</h2>
                            <button type="button" className="close-modal-btn" onClick={() => setIsAddressModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form className="address-modal-form" onSubmit={handleSaveAddress}>
                            <div className="form-group">
                                <label>Address Title (e.g., Home, Office)</label>
                                <input type="text" name="title" value={addressForm.title} onChange={handleAddressInputChange} placeholder="Enter address title" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="fullName" value={addressForm.fullName} onChange={handleAddressInputChange} placeholder="Enter full name" required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phoneNumber" value={addressForm.phoneNumber} onChange={handleAddressInputChange} placeholder="Enter phone number" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Street Address</label>
                                <input type="text" name="streetAddress" value={addressForm.streetAddress} onChange={handleAddressInputChange} placeholder="Enter street address" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" name="city" value={addressForm.city} onChange={handleAddressInputChange} placeholder="City" required />
                                </div>
                                <div className="form-group">
                                    <label>State / Province</label>
                                    <input type="text" name="state" value={addressForm.state} onChange={handleAddressInputChange} placeholder="State" required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Zip / Postal Code</label>
                                    <input type="text" name="zipCode" value={addressForm.zipCode} onChange={handleAddressInputChange} placeholder="Zip code" required />
                                </div>
                                <div className="form-group">
                                    <label>Country</label>
                                    <select name="country" value={addressForm.country} onChange={handleAddressInputChange} required>
                                        <option value="">Select country</option>
                                        <option value="IN">India</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" name="isDefault" checked={addressForm.isDefault} onChange={handleAddressInputChange} /> Set as default address
                                </label>
                            </div>
                            <div className="address-modal-actions">
                                <button type="button" className="btn-outline" onClick={() => setIsAddressModalOpen(false)} disabled={addressLoading}>Cancel</button>
                                <button type="submit" className="btn-save" disabled={addressLoading}>{addressLoading ? 'Saving...' : 'Save Address'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
            {/* Account Deletion Modal */}
            {isDeleteModalOpen && (
                <div className="address-modal-overlay">
                    <div className="address-modal-content delete-modal">
                        <div className="address-modal-header">
                            <h2 className="text-danger">Confirm Account Deletion</h2>
                            <button type="button" className="close-modal-btn" onClick={() => setIsDeleteModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="delete-modal-body">
                            <p className="warning-text">
                                <strong>Warning:</strong> This action is permanent and cannot be undone. All your data, includes addresses, orders, and store settings, will be permanently removed.
                            </p>
                            <p className="instruction-text">
                                Please enter your current password to confirm deletion.
                            </p>
                        </div>
                        <form onSubmit={confirmDeleteAccount}>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={deletionPassword}
                                        onChange={(e) => setDeletionPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="address-modal-actions mt-lg">
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setDeletionPassword('');
                                    }}
                                    disabled={deletionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-danger-filled"
                                    disabled={deletionLoading}
                                >
                                    {deletionLoading ? 'Deleting...' : 'Permanently Delete My Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
