import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import toast from 'react-hot-toast';
import { registerWholesaler } from '../api/api';

const WholesalerRegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        businessName: '',
        gstNumber: '',
        businessAddress: '',
        businessPhone: '',
        businessType: 'retailer',
        agreeTerms: false,
        agreePolicies: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.agreeTerms || !formData.agreePolicies) {
            toast.error('Please agree to Terms and Policies');
            return;
        }
        setLoading(true);
        const loadingToast = toast.loading('Submitting registration...');
        try {
            await registerWholesaler(formData);
            toast.dismiss(loadingToast);
            toast.success('Registration submitted for approval');
            navigate('/wholesaler/login');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-content">
                <div className="login-container" style={{ maxWidth: '520px' }}>
                    <Link to="/" className="home-button">
                        <Home size={20} /><span>Home</span>
                    </Link>
                    <div className="login-header">
                        <h2>Wholesaler Registration</h2>
                        <p>Register your business for wholesale pricing</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <Input label="Full Name" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} required />
                        <Input label="Email Address" name="email" type="email" placeholder="business@example.com" value={formData.email} onChange={handleChange} required />
                        <Input label="Phone Number" name="phone" placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} required />
                        <div className="form-group">
                            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Password</label>
                            <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} icon={showPassword ? EyeOff : Eye} onIconClick={() => setShowPassword(!showPassword)} required />
                        </div>
                        <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                        <Input label="Business Name" name="businessName" placeholder="My Business Pvt Ltd" value={formData.businessName} onChange={handleChange} required />
                        <Input label="GST Number" name="gstNumber" placeholder="22AAAAA0000A1Z5" value={formData.gstNumber} onChange={handleChange} required />
                        <Input label="Business Address" name="businessAddress" placeholder="123, Main Street, City" value={formData.businessAddress} onChange={handleChange} required />
                        <Input label="Business Phone" name="businessPhone" placeholder="+91 9876543210" value={formData.businessPhone} onChange={handleChange} required />
                        <div className="form-group">
                            <label htmlFor="businessType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Business Type</label>
                            <select id="businessType" name="businessType" value={formData.businessType} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="retailer">Retailer</option>
                                <option value="distributor">Distributor</option>
                                <option value="reseller">Reseller</option>
                            </select>
                        </div>
                        <div style={{ margin: '1rem 0' }}>
                            <Checkbox id="agreeTerms" name="agreeTerms" label="I agree to the Terms and Conditions" checked={formData.agreeTerms} onChange={handleChange} />
                            <Checkbox id="agreePolicies" name="agreePolicies" label="I agree to the Marketplace Policies" checked={formData.agreePolicies} onChange={handleChange} />
                        </div>
                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'Submitting...' : 'Register as Wholesaler'}
                        </Button>
                    </form>
                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/wholesaler/login" style={{ color: 'var(--primary-orange)', fontWeight: '600' }}>Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WholesalerRegisterPage;
