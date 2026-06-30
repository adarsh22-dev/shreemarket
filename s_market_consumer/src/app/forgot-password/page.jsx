'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { forgotPassword } from '@/lib/api/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Sending reset link...');
        try {
            await forgotPassword(email);
            toast.dismiss(loadingToast);
            toast.success("Reset link sent! Check the backend console.");
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Error sending reset link:", error);
            toast.error(error.message);
        }
    };

    return (
        <div className="forgot-password-page">
            {/* Form Panel - Centered */}
            <div className="forgot-password-content">
                <div className="forgot-password-container">

                    <div className="brand-header">
                        <div className="brand-icon">
                            <Home color="white" size={20} />
                        </div>
                        <span className="brand-name">SreeMarket</span>
                    </div>

                    <div className="form-header">
                        <h2>Reset Your Password</h2>
                        <p>Enter the email address associated with your account and we&apos;ll send you a link to reset your password.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <Input
                                id="email"
                                label="Email Address"
                                type="email"
                                placeholder="e.g., alex@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={Mail}
                                required
                            />
                        </div>

                        <Button type="submit" fullWidth icon={ArrowRight} className="justify-center">
                            Send Reset Link
                        </Button>
                    </form>

                    <div className="back-to-login">
                        <Link href="/" className="back-link">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>

                    <div className="footer-links">
                        &copy; 2026 SreeMarket Inc. All rights reserved.
                        <a href="#">Privacy Policy</a> &bull; <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
