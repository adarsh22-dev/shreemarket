import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import './RegisterPage.css';
import toast from 'react-hot-toast';
import { registerUser } from '../api/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        newsletter: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Check if user is already logged in
        const user = localStorage.getItem('user');
        if (user) {
            window.location.replace('/admin/dashboard');
        }
    }, []);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user types
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";

        // Phone validation: 10 digits
        const phoneRegex = /^\d{10}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = "Phone number must be exactly 10 digits";
        }

        if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };





    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            const loadingToast = toast.loading('Creating account...');
            try {
                const data = await registerUser(formData);
                toast.dismiss(loadingToast);
                console.log("Registration successful:", data);

                // Save user to localStorage
                localStorage.setItem('user', JSON.stringify(data));

                // Clear form
                setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    newsletter: false
                });

                toast.success("Registration successful! Welcome.");
                // Redirect to admin dashboard
                window.location.replace('/admin/dashboard');
            } catch (error) {
                toast.dismiss(loadingToast);
                console.error("Registration failed:", error);

                const errorMessage = error.message || "Registration failed";

                if (errorMessage.includes("Email already in use")) {
                    setErrors(prev => ({ ...prev, email: errorMessage }));
                } else if (errorMessage.includes("Phone number already in use")) {
                    setErrors(prev => ({ ...prev, phone: errorMessage }));
                } else {
                    setErrors(prev => ({ ...prev, form: errorMessage }));
                    toast.error(errorMessage);
                }
            }
        }
    };

    return (
        <div className="register-page">
            {/* Form Panel - Centered */}
            <div className="register-content">
                <div className="register-container">
                    <div className="register-header">
                        <h2>Create Your Account</h2>
                        <p>
                            Already have an account? <Link to="/login" style={{ color: 'var(--primary-orange)', fontWeight: '600', marginLeft: '0.25rem' }}>Login</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-row">
                                <Input
                                    id="fullName"
                                    label="Full Name"
                                    placeholder="John Doe"
                                    icon={User}
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    error={errors.fullName}
                                />
                                <Input
                                    id="phone"
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="1234567890"
                                    icon={Phone}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    error={errors.phone}
                                    maxLength={10}
                                />
                            </div>

                            <Input
                                id="email"
                                label="Email Address"
                                type="email"
                                placeholder="name@example.com"
                                icon={Mail}
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />

                            <div className="form-row">
                                <div className="relative">
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
                            <div className="password-requirements">
                                Must be at least 8 characters.
                            </div>
                        </div>

                        {/* <div className="newsletter-section">
                            <Checkbox
                                id="newsletter"
                                label="Sign up for our newsletter to hear artisan stories and receive exclusive home decor tips."
                                checked={formData.newsletter}
                                onChange={handleChange}
                            />
                        </div> */}

                        <Button type="submit" fullWidth>
                            Create Account
                        </Button>
                    </form>

                    <div className="divider-container">
                        <div className="divider-line"></div>
                        <span className="divider-text">
                            Or sign up with
                        </span>
                    </div>

                    <div className="social-buttons">
                        <Button variant="outline" fullWidth className="gap-2">
                            <svg className="social-icon" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                    </div>

                    <div className="register-footer">
                        <Link to="#">Privacy Policy</Link>
                        <Link to="#">Terms of Service</Link>
                        <Link to="#">Contact Support</Link>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default RegisterPage;
