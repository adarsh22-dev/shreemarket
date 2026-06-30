import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getVendorById, log, logError } from '../api/api';
import Navbar from './Navbar';
import Footer from './Footer';
import { Clock, ShieldAlert, Mail, Ban } from 'lucide-react';
import './VendorProtectedRoute.css';

const VendorProtectedRoute = () => {
    const [status, setStatus] = useState('loading');
    const [vendorDetails, setVendorDetails] = useState(null);

    useEffect(() => {
        const checkVendorStatus = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));

                if (!storedUser || !storedUser.userId) {
                    logError('VENDOR_GUARD', 'no-auth: no user in localStorage or missing userId');
                    setStatus('no-auth');
                    return;
                }

                log('VENDOR_GUARD', 'user found', { userId: storedUser.userId, roleId: storedUser.roleId });

                if (storedUser.roleId !== 3) {
                    logError('VENDOR_GUARD', 'not-vendor: roleId is', storedUser.roleId);
                    setStatus('not-vendor');
                    return;
                }

                const vendor = await getVendorById(storedUser.userId);
                setVendorDetails(vendor);

                log('VENDOR_GUARD', 'vendor status from API:', vendor.status);

                const vendorStatus = (vendor.status || 'Pending').toLowerCase();

                if (vendorStatus === 'active' || vendorStatus === 'approved') {
                    setStatus('approved');
                } else if (vendorStatus === 'rejected') {
                    setStatus('rejected');
                } else if (vendorStatus === 'suspended') {
                    setStatus('suspended');
                } else {
                    logError('VENDOR_GUARD', 'vendor not yet approved, status:', vendor.status);
                    setStatus('pending');
                }
            } catch (err) {
                logError('VENDOR_GUARD', 'exception:', err.message);
                setStatus('pending');
            }
        };

        checkVendorStatus();
    }, []);

    if (status === 'loading') {
        return (
            <div className="vpr-wrapper">
                <Navbar />
                <div className="vpr-loading">
                    <p>Checking account status...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (status === 'no-auth') {
        return <Navigate to="/login" replace />;
    }

    if (status === 'not-vendor') {
        return <Navigate to="/" replace />;
    }

    if (status === 'approved') {
        return <Outlet />;
    }

    return (
        <div className="vpr-wrapper">
            <Navbar />
            <div className="vpr-status-page">
                <div className="vpr-card">
                    {status === 'pending' ? (
                        <>
                            <div className="vpr-icon-circle vpr-icon-circle--pending">
                                <Clock size={32} color="#D97706" />
                            </div>
                            <h2 className="vpr-title">Account Pending Approval</h2>
                            <p className="vpr-text">
                                Your vendor account is currently under review by our admin team.
                                You'll gain access to the vendor dashboard once your account is approved.
                            </p>
                            <div className="vpr-notice">
                                <Mail size={18} color="#C9A87C" />
                                <span>
                                    We'll notify you at <strong>{vendorDetails?.email || 'your email'}</strong> once approved.
                                </span>
                            </div>
                            <a href="/" className="vpr-btn">Back to Home</a>
                        </>
                    ) : status === 'suspended' ? (
                        <>
                            <div className="vpr-icon-circle vpr-icon-circle--suspended">
                                <Ban size={32} color="#DC2626" />
                            </div>
                            <h2 className="vpr-title">Account Suspended</h2>
                            <p className="vpr-text">
                                Your vendor account has been suspended. Please contact our support team for more information and to resolve this issue.
                            </p>
                            <div className="vpr-actions">
                                <a href="/contact" className="vpr-btn">Contact Support</a>
                                <a href="/" className="vpr-btn--outline">Back to Home</a>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="vpr-icon-circle vpr-icon-circle--rejected">
                                <ShieldAlert size={32} color="#DC2626" />
                            </div>
                            <h2 className="vpr-title">Account Not Approved</h2>
                            <p className="vpr-text">
                                Unfortunately, your vendor account application was not approved at this time.
                                Please contact our support team for more information.
                            </p>
                            <div className="vpr-actions">
                                <a href="/contact" className="vpr-btn">Contact Support</a>
                                <a href="/" className="vpr-btn--outline">Back to Home</a>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default VendorProtectedRoute;
