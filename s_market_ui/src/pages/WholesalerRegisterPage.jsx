import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Upload, X, FileText, Image as ImageIcon, CheckCircle, Shield, Truck, Percent } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import toast from 'react-hot-toast';
import { registerWholesaler } from '../api/api';
import './WholesalerRegisterPage.css';

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
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [gstCertificate, setGstCertificate] = useState(null);
    const [businessProof, setBusinessProof] = useState(null);
    const [addressProof, setAddressProof] = useState(null);

    const gstRef = useRef();
    const businessRef = useRef();
    const addressRef = useRef();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileSelect = (setter) => (e) => {
        const file = e.target.files[0];
        if (file) setter(file);
    };

    const handleRemoveFile = (setter, ref) => () => {
        setter(null);
        if (ref.current) ref.current.value = '';
    };

    const getFileIcon = (file) => {
        if (!file) return Upload;
        const type = file.type;
        if (type && type.startsWith('image/')) return ImageIcon;
        return FileText;
    };

    const validateForm = () => {
        const errs = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[\d\s-]{10,15}$/;
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
        if (!formData.email.trim()) errs.email = 'Email is required';
        else if (!emailRegex.test(formData.email.trim())) errs.email = 'Invalid email format';
        if (!formData.phone.trim()) errs.phone = 'Phone is required';
        else if (!phoneRegex.test(formData.phone.trim())) errs.phone = 'Enter valid phone number';
        if (!formData.password.trim()) errs.password = 'Password is required';
        else if (formData.password.length < 6) errs.password = 'Min 6 characters';
        if (!formData.businessName.trim()) errs.businessName = 'Business name is required';
        if (!formData.gstNumber.trim()) errs.gstNumber = 'GST number is required';
        else if (!gstRegex.test(formData.gstNumber.trim().toUpperCase())) errs.gstNumber = 'Invalid GST format';
        if (!formData.businessAddress.trim()) errs.businessAddress = 'Business address is required';
        if (!formData.businessPhone.trim()) errs.businessPhone = 'Business phone is required';
        else if (!phoneRegex.test(formData.businessPhone.trim())) errs.businessPhone = 'Enter valid phone';

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Please fix the highlighted errors');
            return;
        }
        if (!formData.agreeTerms || !formData.agreePolicies) {
            toast.error('Please agree to Terms and Policies');
            return;
        }
        setLoading(true);
        const loadingToast = toast.loading('Submitting registration...');
        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([key, val]) => fd.append(key, val));
            if (gstCertificate) fd.append('gstCertificate', gstCertificate);
            if (businessProof) fd.append('businessProof', businessProof);
            if (addressProof) fd.append('addressProof', addressProof);

            await registerWholesaler(fd);
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

    const renderFileUpload = (label, file, setter, ref) => {
        const Icon = getFileIcon(file);
        return (
            <div className="ws-file-upload">
                <label className="ws-file-label">{label}</label>
                <input
                    ref={ref}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileSelect(setter)}
                    style={{ display: 'none' }}
                />
                <div
                    className={`ws-upload-box ${file ? 'has-file' : ''}`}
                    onClick={() => !file && ref.current?.click()}
                >
                    {file ? (
                        <>
                            <div className="ws-file-info">
                                <Icon size={18} className="ws-file-icon" />
                                <div className="ws-file-details">
                                    <span className="ws-file-name">{file.name}</span>
                                    <span className="ws-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <CheckCircle size={16} className="ws-check-icon" />
                            </div>
                            <button
                                type="button"
                                className="ws-remove-btn"
                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(setter, ref)(); }}
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Upload size={18} />
                            <span>Upload {label} <br /><small>JPG, PNG or PDF</small></span>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="ws-register-page">
            <div className="ws-layout">
                <div className="ws-hero">
                    <div className="ws-hero-content">
                        <div className="ws-hero-brand">
                            <Shield size={28} />
                            <span>SREE MARKET</span>
                        </div>
                        <h1>Wholesale<br />Partner Program</h1>
                        <p>Join thousands of businesses sourcing products at wholesale prices. Unlock exclusive deals and grow your business.</p>
                        <div className="ws-benefits">
                            <div className="ws-benefit"><Percent size={18} /><span>Exclusive wholesale pricing</span></div>
                            <div className="ws-benefit"><Truck size={18} /><span>Bulk ordering &amp; delivery</span></div>
                            <div className="ws-benefit"><Shield size={18} /><span>Verified suppliers</span></div>
                        </div>
                    </div>
                    <div className="ws-hero-footer">
                        <Link to="/wholesaler/login">Already registered? <strong>Sign in</strong></Link>
                    </div>
                </div>
                <div className="ws-form-panel">
                    <div className="ws-form-inner">
                        <div className="ws-header">
                            <h2>Create Account</h2>
                            <p>Register your business for wholesale access</p>
                        </div>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="ws-section-label">PERSONAL INFORMATION</div>
                            <div className="ws-row">
                                <Input label="Full Name" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} required />
                                <Input label="Email Address" name="email" type="email" placeholder="business@example.com" value={formData.email} onChange={handleChange} error={errors.email} required />
                            </div>
                            <div className="ws-row">
                                <Input label="Phone Number" name="phone" placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} error={errors.phone} required />
                                <div className="form-group">
                                    <label>Password</label>
                                    <Input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} icon={showPassword ? EyeOff : Eye} onIconClick={() => setShowPassword(!showPassword)} required />
                                </div>
                            </div>

                            <div className="ws-section-label">BUSINESS DETAILS</div>
                            <div className="ws-row">
                                <Input label="Business Name" name="businessName" placeholder="My Business Pvt Ltd" value={formData.businessName} onChange={handleChange} error={errors.businessName} required />
                                <Input label="GST Number" name="gstNumber" placeholder="22AAAAA0000A1Z5" value={formData.gstNumber} onChange={handleChange} error={errors.gstNumber} required />
                            </div>
                            <div className="ws-row">
                                <Input label="Business Phone" name="businessPhone" placeholder="+91 9876543210" value={formData.businessPhone} onChange={handleChange} error={errors.businessPhone} required />
                                <div className="form-group">
                                    <label>Business Type</label>
                                    <select id="businessType" name="businessType" value={formData.businessType} onChange={handleChange} required className="ws-select">
                                        <option value="retailer">Retailer</option>
                                        <option value="distributor">Distributor</option>
                                        <option value="reseller">Reseller</option>
                                    </select>
                                </div>
                            </div>
                            <Input label="Business Address" name="businessAddress" placeholder="123, Main Street, City" value={formData.businessAddress} onChange={handleChange} error={errors.businessAddress} required />

                            <div className="ws-section-label">DOCUMENT VERIFICATION</div>
                            <p className="ws-upload-desc">Upload documents for KYC verification (optional)</p>
                            <div className="ws-uploads">
                                {renderFileUpload('GST Certificate', gstCertificate, setGstCertificate, gstRef)}
                                {renderFileUpload('Business Proof', businessProof, setBusinessProof, businessRef)}
                                {renderFileUpload('Address Proof', addressProof, setAddressProof, addressRef)}
                            </div>

                            <div className="ws-checkboxes">
                                <Checkbox id="agreeTerms" name="agreeTerms" label="I agree to the Terms and Conditions" checked={formData.agreeTerms} onChange={handleChange} />
                                <Checkbox id="agreePolicies" name="agreePolicies" label="I agree to the Marketplace Policies" checked={formData.agreePolicies} onChange={handleChange} />
                            </div>

                            <Button type="submit" fullWidth disabled={loading}>
                                {loading ? 'Submitting...' : 'Register as Wholesaler'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WholesalerRegisterPage;