import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAdminCustomerDetails } from '../../api/api';

function formatDate(ts) {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
    if (!ts) return 'Unknown';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

const STATUS_STYLES = {
    Active: { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
    Inactive: { bg: '#f1f5f9', color: '#64748b', icon: XCircle },
    Blocked: { bg: '#fee2e2', color: '#dc2626', icon: XCircle },
    Suspended: { bg: '#fef3c7', color: '#d97706', icon: Clock },
};

export default function AdminCustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        setLoading(true);
        try {
            const data = await getAdminCustomerDetails(id);
            setCustomer(data);
        } catch (err) {
            toast.error('Failed to load customer details');
            navigate('/admin/customers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                Loading customer details...
            </div>
        );
    }

    if (!customer) return null;

    const statusStyle = STATUS_STYLES[customer.status] || STATUS_STYLES.Active;
    const StatusIcon = statusStyle.icon;
    const defaultAddress = customer.addresses?.find(a => a.defaultAddress);
    const otherAddresses = customer.addresses?.filter(a => !a.defaultAddress) || [];

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/admin/customers')}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: '#fff', cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <ArrowLeft size={16} color="#475569" />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {customer.fullName}
                    </h1>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
                        Customer ID: #{customer.id}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 12px', borderRadius: '8px',
                        background: statusStyle.bg, color: statusStyle.color,
                        fontSize: '0.78rem', fontWeight: 700,
                    }}>
                        <StatusIcon size={12} /> {customer.status}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0' }}>
                {['overview', 'addresses'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px', border: 'none', background: 'none',
                            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                            color: activeTab === tab ? '#E03E1A' : '#64748b',
                            borderBottom: activeTab === tab ? '2px solid #E03E1A' : '2px solid transparent',
                            marginBottom: '-2px', fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    >
                        {tab === 'overview' ? 'Overview' : `Addresses (${customer.addresses?.length || 0})`}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* Personal Info Card */}
                    <div style={{
                        background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9',
                        padding: '20px',
                    }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                            Personal Information
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={14} color="#16a34a" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Full Name</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{customer.fullName}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Mail size={14} color="#2563eb" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Email</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{customer.email}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Phone size={14} color="#d97706" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Phone</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{customer.phone || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Info Card */}
                    <div style={{
                        background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9',
                        padding: '20px',
                    }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                            Account Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={14} color="#db2777" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Role</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                                        {customer.roleId === 2 ? 'Customer' : customer.roleId === 3 ? 'Vendor' : 'User'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={14} color="#16a34a" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Status</div>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '2px 8px', borderRadius: '6px',
                                        background: statusStyle.bg, color: statusStyle.color,
                                        fontSize: '0.75rem', fontWeight: 700,
                                    }}>
                                        <StatusIcon size={10} /> {customer.status}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={14} color="#4f46e5" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Joined</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                                        {formatDate(customer.createdAt)} ({timeAgo(customer.createdAt)})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'addresses' && (
                <div>
                    {/* Default Address */}
                    {defaultAddress && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                                Default Address
                            </h3>
                            <AddressCard address={defaultAddress} isDefault={true} />
                        </div>
                    )}

                    {/* Other Addresses */}
                    {otherAddresses.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                                Other Addresses ({otherAddresses.length})
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                                {otherAddresses.map(addr => (
                                    <AddressCard key={addr.id} address={addr} isDefault={false} />
                                ))}
                            </div>
                        </div>
                    )}

                    {!defaultAddress && otherAddresses.length === 0 && (
                        <div style={{
                            background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9',
                            padding: '40px', textAlign: 'center',
                        }}>
                            <MapPin size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No addresses found</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AddressCard({ address, isDefault }) {
    return (
        <div style={{
            background: '#fff', borderRadius: '12px', border: isDefault ? '2px solid #16a34a' : '1px solid #f1f5f9',
            padding: '16px', position: 'relative',
        }}>
            {isDefault && (
                <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    padding: '2px 8px', borderRadius: '6px',
                    background: '#dcfce7', color: '#16a34a',
                    fontSize: '0.65rem', fontWeight: 700,
                }}>
                    DEFAULT
                </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={14} color="#64748b" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                    {address.title || 'Address'}
                </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                <div>{address.fullName}</div>
                <div>{address.streetAddress}</div>
                <div>{address.city}, {address.state} {address.zipCode}</div>
                <div>{address.country}</div>
                {address.phoneNumber && <div style={{ marginTop: '4px', color: '#64748b' }}>Phone: {address.phoneNumber}</div>}
            </div>
        </div>
    );
}
