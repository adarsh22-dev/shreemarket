import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Pencil, Trash2, Plus, Bell, Hash, CreditCard, Home as HomeIcon, Briefcase } from 'lucide-react';
import './SettingsPage.css';

const SettingsPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const user = JSON.parse(localStorage.getItem('user')) || {
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.j@example.com'
    };

    const phoneNumber = '+1 (555) 000-0000';
    const fullName = `${user.firstName || 'Alex'} ${user.lastName || 'Johnson'}`;

    return (
        <div className="settings-page-wrapper">
            <Navbar />

            <div className="settings-container">
                <div className="settings-breadcrumbs">
                    <Link to="/">Home</Link>&gt; <span>Settings</span>
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
                            <div className="profile-image-container">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150" alt="Profile avatar" className="profile-avatar" />
                                <button className="edit-avatar-btn">
                                    <Pencil size={12} color="white" />
                                </button>
                            </div>
                            <div className="profile-hero-info">
                                <h3>{fullName}</h3>
                                <p>Member since March 2023</p>
                            </div>
                        </div>

                        <form className="personal-info-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" defaultValue={fullName} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" defaultValue={user.email || 'alex.j@example.com'} />
                                </div>
                            </div>
                            <div className="form-row" style={{ marginBottom: 0 }}>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" defaultValue={phoneNumber} />
                                </div>
                                <div className="form-group form-actions-inline">
                                    <button type="submit" className="btn-save">Save Changes</button>
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
                        <button className="btn-text-action"><Plus size={14} /> Add New Address</button>
                    </div>
                    <div className="address-grid">
                        <div className="address-card default-address">
                            <div className="address-card-header">
                                <h3><HomeIcon size={16} /> Home</h3>
                                <span className="badge-default">DEFAULT</span>
                            </div>
                            <div className="address-body">
                                <p>123 Sustainability Way</p>
                                <p>Eco-Friendly District</p>
                                <p>Portland, OR 97201</p>
                                <p>United States</p>
                            </div>
                            <div className="address-actions">
                                <button className="btn-link">EDIT</button>
                                <button className="btn-link">DELETE</button>
                            </div>
                        </div>

                        <div className="address-card">
                            <div className="address-card-header">
                                <h3><Briefcase size={16} /> Office</h3>
                            </div>
                            <div className="address-body">
                                <p>456 Innovation Park</p>
                                <p>Suite 200</p>
                                <p>Portland, OR 97205</p>
                                <p>United States</p>
                            </div>
                            <div className="address-actions">
                                <button className="btn-link">EDIT</button>
                                <button className="btn-link">DELETE</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <div className="settings-section">
                    <div className="section-header with-action">
                        <div>
                            <h2>Payment Methods</h2>
                            <p>Securely manage your saved cards.</p>
                        </div>
                        <button className="btn-text-action"><Plus size={14} /> Add New Card</button>
                    </div>
                    <div className="settings-card p-0">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>CARD TYPE</th>
                                    <th>CARD NUMBER</th>
                                    <th>EXPIRY</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className="payment-type">
                                            <span className="card-brand visa">VISA</span>
                                            <span>Visa Ending in 4242</span>
                                        </div>
                                    </td>
                                    <td>**** **** **** 4242</td>
                                    <td>12/25</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon"><Pencil size={14} /></button>
                                            <button className="btn-icon"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="payment-type">
                                            <span className="card-brand mastercard">
                                                <div className="mc-circle-1"></div>
                                                <div className="mc-circle-2"></div>
                                            </span>
                                            <span>Mastercard Ending in 8888</span>
                                        </div>
                                    </td>
                                    <td>**** **** **** 8888</td>
                                    <td>08/24</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon"><Pencil size={14} /></button>
                                            <button className="btn-icon"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div> */}

                <div className="settings-grid">
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>Security</h2>
                            <p>Manage your password and security settings.</p>
                        </div>
                        <div className="settings-card">
                            <form className="security-form" onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" defaultValue="••••••••" />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" placeholder="••••••••" />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input type="password" placeholder="••••••••" />
                                </div>
                                <button type="submit" className="btn-outline-primary full-width">Update Password</button>
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
                                {/* <div className="toggle-row">
                                    <span>Impact reports and community news</span>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div> */}
                            </div>

                            {/* <div className="preferences-group mt-xl">
                                <h3 className="pref-title"><Hash size={16} /> Interests</h3>
                                <div className="tags-container">
                                    <span className="pref-tag selected">Sustainable Decor</span>
                                    <span className="pref-tag selected">Zero Waste Kitchen</span>
                                    <span className="pref-tag default">Solar Solutions</span>
                                    <span className="pref-tag default">Upcycled Textiles</span>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>

                <div className="danger-zone-section">
                    <div className="danger-zone-content">
                        <h2>Danger Zone</h2>
                        <p>Permanently delete your account and all your data.</p>
                    </div>
                    <button className="btn-outline-danger">Delete Account</button>
                </div>

            </div>
            <Footer />
        </div>
    );
};

export default SettingsPage;
