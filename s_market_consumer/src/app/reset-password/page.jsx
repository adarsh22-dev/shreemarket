'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, Eye, EyeOff, Home } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { resetPassword } from '@/lib/api/client';
import './ForgotPasswordPage.css'; // Reuse existing styles

const ResetPasswordPage = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        const loadingToast = toast.loading('Resetting password...');
        try {
            await resetPassword(token, password);
            toast.dismiss(loadingToast);
            toast.success("Password reset successful! Please login.");
            router.push('/');
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Error resetting password:", error);
            toast.error(error.message);
        }
    };

    if (!token) {
        return (
            <div className="forgot-password-page">
                <div className="forgot-password-content">
                    <div className="forgot-password-container">
                        <div className="form-header">
                            <h2>Invalid Link</h2>
                            <p>No reset token provided.</p>
                            <div className="back-to-login">
                                <Link href="/" className="back-link">Back to Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-content">
                <div className="forgot-password-container">
                    <div className="brand-header">
                        <div className="brand-icon">
                            <Home color="white" size={20} />
                        </div>
                        <span className="brand-name">SreeMarket</span>
                    </div>

                    <div className="form-header">
                        <h2>Set New Password</h2>
                        <p>Please enter your new password below.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <Input
                                id="password"
                                label="New Password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={showPassword ? EyeOff : Eye}
                                onIconClick={() => setShowPassword(!showPassword)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Input
                                id="confirmPassword"
                                label="Confirm Password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" fullWidth icon={ArrowRight} className="justify-center">
                            Reset Password
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
