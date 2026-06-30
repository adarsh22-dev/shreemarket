import React, { useEffect, useState } from 'react';
import { getWholesalerSettings, updateWholesalerSettings } from '../../api/api';
import { Save, Loader, User, Mail, Phone, Building2, MapPin, Hash, Briefcase, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

const WholesalerSettings = () => {
    const [form, setForm] = useState({
        fullName: '', email: '', phone: '',
        businessName: '', gstNumber: '', businessAddress: '',
        businessPhone: '', businessType: '', minMonthlyOrderValue: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getWholesalerSettings();
                setForm({
                    fullName: data.fullName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    businessName: data.businessName || '',
                    gstNumber: data.gstNumber || '',
                    businessAddress: data.businessAddress || '',
                    businessPhone: data.businessPhone || '',
                    businessType: data.businessType || '',
                    minMonthlyOrderValue: data.minMonthlyOrderValue != null ? String(data.minMonthlyOrderValue) : ''
                });
            } catch (err) {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form };
            payload.minMonthlyOrderValue = form.minMonthlyOrderValue ? parseFloat(form.minMonthlyOrderValue) : null;
            await updateWholesalerSettings(payload);
            toast.success('Settings updated successfully');
        } catch (err) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading settings...</div>;

    const inputStyle = {
        width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem',
        borderRadius: '8px', border: '1px solid #e5e7eb',
        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
    };

    const labelStyle = { fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem', display: 'block' };

    const fieldGroup = (icon, label, name, type = 'text', opts = {}) => (
        <div style={{ marginBottom: '1rem', flex: opts.fullWidth ? '1 1 100%' : '1 1 calc(50% - 0.5rem)', minWidth: opts.fullWidth ? '100%' : '200px' }}>
            <label style={labelStyle}>{label}</label>
            <div style={{ position: 'relative' }}>
                {icon}
                <input name={name} value={form[name] || ''} onChange={handleChange} type={type}
                    placeholder={opts.placeholder || `Enter ${label.toLowerCase()}`}
                    style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
            </div>
        </div>
    );

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Settings</h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Manage your wholesaler profile and business information</p>

            <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>Personal Information</h2>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {fieldGroup(<User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Full Name', 'fullName')}
                        {fieldGroup(<Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Email', 'email', 'email')}
                        {fieldGroup(<Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Phone', 'phone', 'tel')}
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>Business Information</h2>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {fieldGroup(<Building2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Business Name', 'businessName')}
                        {fieldGroup(<Hash size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'GST Number', 'gstNumber')}
                        {fieldGroup(<Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Business Phone', 'businessPhone', 'tel')}
                        {fieldGroup(<Briefcase size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Business Type', 'businessType')}
                        {fieldGroup(<IndianRupee size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Min Monthly Order Value', 'minMonthlyOrderValue', 'number', { placeholder: 'Enter minimum monthly order value' })}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {fieldGroup(<MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />, 'Business Address', 'businessAddress', 'text', { fullWidth: true })}
                    </div>
                </div>

                <button type="submit" disabled={saving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#d97706', color: '#fff', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.target.style.background = '#b45309'}
                    onMouseLeave={e => e.target.style.background = '#d97706'}>
                    {saving ? <Loader size={16} className="spinner" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spinner { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default WholesalerSettings;
