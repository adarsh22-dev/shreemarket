import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';

import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { loginUser, googleLogin, logoutUser } from '../api/api';
import './LoginPage.css';

const LoginPage = () => {
    const [isVendorLogin, setIsVendorLogin] = useState(false);
    const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.roleId === 1) {
                    navigate('/admin/dashboard', { replace: true });
                } else if (user.roleId === 3) {
                    navigate('/vendor/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } catch {
                localStorage.removeItem('user');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Signing in...');
        try {
            const data = await loginUser(email, password, isVendorLogin);
            toast.dismiss(loadingToast);

            if (isVendorLogin && data.roleId !== 3) {
                await logoutUser();
                toast.dismiss(loadingToast);
                toast.error("This login is restricted to vendors only.");
                return;
            }

            // Save user to localStorage
            localStorage.setItem('user', JSON.stringify(data));
            window.dispatchEvent(new Event('storage'));

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            toast.success(`Welcome back, ${data.fullName}!`);

            // Clear fields
            setEmail('');
            setPassword('');

            // Redirect based on role id
            if (data.roleId === 1) {
                navigate('/admin/dashboard', { replace: true });
            } else if (data.roleId === 3) {
                navigate('/vendor/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Login failed:", error);
            toast.error(error.message);
        }
    };

    return (
        <div className="login-page">
            {/* Left Panel Removed */}
            <div className="login-content">
                <div className="login-container">
                    <Link to="/" className="home-button">
                        <Home size={20} />
                        <span>Home</span>
                    </Link>
                    <div className="login-header">
                        <h2>Welcome back</h2>
                        <p>Please enter your details to sign in.</p>
                    </div>

                    <div className="user-type-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${!isVendorLogin ? 'active' : ''}`}
                            onClick={() => setIsVendorLogin(false)}
                        >
                            Regular Login
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${isVendorLogin ? 'active' : ''}`}
                            onClick={() => setIsVendorLogin(true)}
                        >
                            Vendor Login
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <Input
                                id="email"
                                label="Email Address"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Password</label>

                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={showPassword ? EyeOff : Eye}
                                onIconClick={() => setShowPassword(!showPassword)}
                                required
                            />

                            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                <Link to="/forgot-password" className="forgot-password" style={{ color: 'var(--primary-orange)', fontSize: '0.875rem', fontWeight: '500' }}>
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* <div className="form-actions">
                            <Checkbox
                                id="remember"
                                label="Remember me for 30 days"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                        </div> */}

                        <Button type="submit" fullWidth>
                            Sign in
                        </Button>
                    </form>

                    {!isVendorLogin && (
                        <div className="divider">
                            <span>Or login with</span>
                        </div>
                    )}                    {!isVendorLogin && (
                        <div className="social-login" style={{ display: 'flex', justifyContent: 'center' }}>
                            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    const loadingToast = toast.loading('Verifying Google Sign-In...');
                                    try {
                                        const data = await googleLogin(credentialResponse.credential, isVendorLogin);
                                        toast.dismiss(loadingToast);

                                        if (isVendorLogin && data.roleId !== 3) {
                                            await logoutUser();
                                            toast.dismiss(loadingToast);
                                            toast.error("This login is restricted to vendors only.");
                                            return;
                                        }

                                        toast.success(`Welcome back, ${data.fullName}!`);

                                        localStorage.setItem('user', JSON.stringify(data));
                                        window.dispatchEvent(new Event('storage'));
                                        setEmail('');
                                        setPassword('');

                                        if (data.roleId === 1) {
                                            navigate('/admin/dashboard', { replace: true });
                                        } else if (data.roleId === 3) {
                                            navigate('/vendor/dashboard', { replace: true });
                                        } else {
                                            navigate('/', { replace: true });
                                        }
                                    } catch (error) {
                                        toast.dismiss(loadingToast);
                                        console.error("Error verifying Google login:", error);
                                        toast.error(error.message);
                                    }
                                }}
                                onError={() => {
                                    toast.error("Google Sign-In failed");
                                }}
                                width={300}
                            />
                            ) : (
                            <div style={{padding:'12px 20px',background:'#f1f5f9',borderRadius:'8px',textAlign:'center',color:'#94a3b8',fontSize:'0.85rem',width:'100%'}}>
                                Google Sign-In not configured (set VITE_GOOGLE_CLIENT_ID)
                            </div>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to={isVendorLogin ? "/register?type=vendor" : "/register"} style={{ color: 'var(--primary-orange)', fontWeight: '600' }}>
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
