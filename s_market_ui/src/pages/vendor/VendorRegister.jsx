import React, { useState } from 'react';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { registerVendor } from '../../api/api';
import './VendorRegister.css';

const VendorRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));

        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";

        const phoneRegex = /^\d{10}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = "Must be exactly 10 digits";
        }

        if (formData.password.length < 8) newErrors.password = "Must be at least 8 characters";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            const loadingToast = toast.loading('Registering vendor account...');
            try {
                const { confirmPassword, fullName, ...restForm } = formData;
                const data = await registerVendor({ ...restForm, name: fullName });
                toast.dismiss(loadingToast);
                toast.success("Vendor registration successful!");

                // Store the registered vendor ID so Step 2 knows who this is
                if (data && data.vendorId) {
                    localStorage.setItem('registeredVendorId', data.vendorId);
                }

                navigate('/vendor/setup-store');
            } catch (error) {
                toast.dismiss(loadingToast);
                toast.error(error.message || "Registration failed");
            }
        }
    };

    return (
        <div className="vr-page">
            <div className="vr-card">
                <div className="vr-left-panel">
                    <div className="vr-image-bg"></div>
                    <div className="vr-overlay"></div>
                    <div className="vr-left-content">
                        <h1>Empower Your Business</h1>
                        <p>
                            Join over 10,000 successful vendors who have scaled their operations using our platform. Your journey to retail excellence starts here.
                        </p>
                        <div className="vr-community">
                            <div className="vr-avatars">
                                <div className="vr-avatar" style={{ backgroundColor: '#7E9162' }}></div>
                                <div className="vr-avatar" style={{ backgroundColor: '#E0E7D2', left: '-10px' }}>
                                    <User size={12} color="#7E9162" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                </div>
                                <div className="vr-avatar" style={{ backgroundColor: '#E0E7D2', left: '-20px' }}>
                                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', color: '#7E9162', fontWeight: 'bold' }}>V</span>
                                </div>
                            </div>
                            <span className="vr-join-text">Join our community</span>
                        </div>
                    </div>
                </div>

                <div className="vr-right-panel">
                    <div className="vr-form-wrapper">

                        {/* Stepper Column */}
                        <div className="vr-stepper-col">
                            <div className="vr-step-item">
                                <div className="vr-step-circle active">1</div>
                                <div className="vr-step-line active-line"></div>
                            </div>
                            <div className="vr-step-item">
                                <div className="vr-step-circle">2</div>
                                <div className="vr-step-line"></div>
                            </div>
                            <div className="vr-step-item">
                                <div className="vr-step-circle">3</div>
                                <div className="vr-step-line"></div>
                            </div>
                            <div className="vr-step-item">
                                <div className="vr-step-circle">4</div>
                            </div>
                        </div>

                        {/* Form Column */}
                        <div className="vr-form-col">
                            <div className="vr-header">
                                <h2>Step 1: Vendor Details</h2>
                                <p className="vr-login-text">
                                    Already have an account? <Link to="/login" className="vr-login-link">Login</Link>
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="vr-form">
                                <div className="vr-form-row">
                                    <div className="vr-form-group">
                                        <Input
                                            id="fullName"
                                            label="Full Name"
                                            placeholder="Enter your full name"
                                            icon={User}
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            error={errors.fullName}
                                        />
                                    </div>
                                    <div className="vr-form-group">
                                        <Input
                                            id="phone"
                                            label="Phone Number"
                                            type="tel"
                                            placeholder="Enter your phone number"
                                            icon={Phone}
                                            value={formData.phone}
                                            onChange={handleChange}
                                            error={errors.phone}
                                            maxLength={10}
                                        />
                                    </div>
                                </div>

                                <div className="vr-form-group vr-email-group">
                                    <Input
                                        id="email"
                                        label="Email Address"
                                        type="email"
                                        placeholder="you@example.com"
                                        icon={Mail}
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={errors.email}
                                    />
                                </div>

                                <div className="vr-form-row">
                                    <div className="vr-form-group">
                                        <Input
                                            id="password"
                                            label="Password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            icon={Lock}
                                            value={formData.password}
                                            onChange={handleChange}
                                            error={errors.password}
                                        />
                                    </div>
                                    <div className="vr-form-group">
                                        <Input
                                            id="confirmPassword"
                                            label="Confirm Password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            icon={Lock}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            error={errors.confirmPassword}
                                        />
                                    </div>
                                </div>

                                <p className="vr-password-hint">
                                    Must be at least 8 characters long and include special characters.
                                </p>

                                <Button type="submit" className="vr-submit-btn">
                                    Next Step <ArrowRight size={18} className="vr-arrow-icon" />
                                </Button>
                            </form>

                            <div className="vr-footer-links">
                                <Link to="#">Privacy Policy</Link>
                                <Link to="#">Terms of Service</Link>
                                <Link to="#">Contact Support</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorRegister;
