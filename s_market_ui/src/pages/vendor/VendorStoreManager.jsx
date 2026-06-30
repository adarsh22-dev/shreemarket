import React, { useState, useEffect } from 'react';
import { getVendorStores, createVendorStore, updateVendorStore, deleteVendorStore, uploadStoreLogo } from '../../api/api';
import { Store, Plus, Edit2, Trash2, Loader2, Check, X } from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import toast from 'react-hot-toast';

const VendorStoreManager = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStore, setEditingStore] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        storeName: '', description: '', city: '', state: '', country: 'IN',
        pincode: '', phoneNumber: '', emailAddress: '', fullAddress: '', storeLogo: ''
    });

    const fetchStores = async () => {
        setLoading(true);
        try {
            const data = await getVendorStores();
            setStores(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch stores:', err);
            toast.error('Could not load stores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStores(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateForm = () => {
        setFormData({ storeName: '', description: '', city: '', state: '', country: 'IN', pincode: '', phoneNumber: '', emailAddress: '', fullAddress: '', storeLogo: '' });
        setEditingStore(null);
        setShowForm(true);
    };

    const openEditForm = (store) => {
        setFormData({
            storeName: store.storeName || '',
            description: store.description || '',
            city: store.city || '',
            state: store.state || '',
            country: store.country || 'IN',
            pincode: store.pincode || '',
            phoneNumber: store.phoneNumber || '',
            emailAddress: store.emailAddress || '',
            fullAddress: store.fullAddress || '',
            storeLogo: store.storeLogo || ''
        });
        setEditingStore(store);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStore) {
                await updateVendorStore(editingStore.id, formData);
                toast.success('Store updated successfully!');
            } else {
                await createVendorStore(formData);
                toast.success('Store created successfully!');
            }
            setShowForm(false);
            setEditingStore(null);
            fetchStores();
        } catch (err) {
            toast.error('Failed to save store: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (storeId) => {
        if (!window.confirm('Are you sure you want to delete this store?')) return;
        try {
            await deleteVendorStore(storeId);
            toast.success('Store deleted');
            fetchStores();
        } catch (err) {
            toast.error('Failed to delete store');
        }
    };

    return (
        <VendorLayout>
            <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e' }}>
                            <Store size={22} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Store Management
                        </h1>
                        <p style={{ margin: '0.5rem 0 0', color: '#8A7F75', fontSize: '0.85rem' }}>
                            Manage your multiple storefronts
                        </p>
                    </div>
                    <button onClick={openCreateForm} style={{
                        padding: '0.75rem 1.5rem', background: '#FF5722', color: '#fff',
                        border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <Plus size={18} /> Add Store
                    </button>
                </div>

                {showForm && (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', border: '1px solid #eee' }}>
                        <h3 style={{ margin: '0 0 1.5rem', color: '#1a1a2e' }}>{editingStore ? 'Edit Store' : 'Create New Store'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>Store Name *</label>
                                    <input name="storeName" value={formData.storeName} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>City</label>
                                    <input name="city" value={formData.city} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>State</label>
                                    <input name="state" value={formData.state} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>Country</label>
                                    <input name="country" value={formData.country} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>Pincode</label>
                                    <input name="pincode" value={formData.pincode} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>Phone</label>
                                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A7F75', marginBottom: '0.4rem' }}>Email</label>
                                    <input name="emailAddress" value={formData.emailAddress} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.9rem' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.5rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                    Cancel
                                </button>
                                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#FF5722', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                    {editingStore ? 'Update Store' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#8A7F75' }}>
                        <Loader2 className="animate-spin" size={32} />
                        <p style={{ marginTop: '1rem' }}>Loading stores...</p>
                    </div>
                ) : stores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#8A7F75', border: '2px dashed #E8DDD4', borderRadius: '16px' }}>
                        <Store size={48} style={{ color: '#ddd' }} />
                        <h3 style={{ margin: '1rem 0 0.5rem', color: '#1a1a2e' }}>No stores yet</h3>
                        <p>Create your first store to start selling across multiple storefronts.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
                        {stores.map(store => (
                            <div key={store.id} style={{
                                background: '#fff', borderRadius: '16px', padding: '1.5rem',
                                border: '1px solid #eee', transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F5EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#C9A87C' }}>
                                            {store.storeName?.charAt(0)?.toUpperCase() || 'S'}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' }}>{store.storeName}</h3>
                                            {store.city && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#8A7F75' }}>{store.city}{store.state ? `, ${store.state}` : ''}</p>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openEditForm(store)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }} title="Edit">
                                            <Edit2 size={16} color="#8A7F75" />
                                        </button>
                                        <button onClick={() => handleDelete(store.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }} title="Delete">
                                            <Trash2 size={16} color="#ef4444" />
                                        </button>
                                    </div>
                                </div>
                                {store.description && (
                                    <p style={{ fontSize: '0.82rem', color: '#6B635B', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                                        {store.description}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#8A7F75' }}>
                                    {store.phoneNumber && <span>📞 {store.phoneNumber}</span>}
                                    {store.emailAddress && <span>✉️ {store.emailAddress}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorStoreManager;
