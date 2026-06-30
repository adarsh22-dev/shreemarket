'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { loginUser, googleLogin, logoutUser } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: authUser, login } = useAuth();
    const [isVendorLogin, setIsVendorLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        if (authUser) {
            router.push('/');
        }

        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, [authUser, router]);

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

            // Save user via auth context
            login(data);

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            toast.success(`Welcome back, ${data.fullName}!`);

            // Clear fields
            setEmail('');
            setPassword('');

            // Redirect based on role id or redirect param
            const redirect = searchParams.get('redirect');
            if (redirect) {
                router.push(redirect);
            } else {
                router.push('/');
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
                    <Link href="/" className="home-button">
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
                                <Link href="/forgot-password" className="forgot-password" style={{ color: 'var(--primary-orange)', fontSize: '0.875rem', fontWeight: '500' }}>
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

                                        // Save user via auth context
                                        login(data);

                                        // Clear fields
                                        setEmail('');
                                        setPassword('');

                                        // Redirect based on role or redirect param
                                        const redirect = searchParams.get('redirect');
                                        if (redirect) {
                                            router.push(redirect);
                                        } else {
                                            router.push('/');
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
                                width="100%"
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Don&apos;t have an account?{' '}
                        <Link href={isVendorLogin ? "/register?type=vendor" : "/register"} style={{ color: 'var(--primary-orange)', fontWeight: '600' }}>
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
