import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Clock, ShieldAlert, Mail, Ban } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import './VendorProtectedRoute.css';

const WholesalerProtectedRoute = () => {
    const [status, setStatus] = useState('loading');
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (!storedUser || !storedUser.userId) {
                    setStatus('no-auth');
                    return;
                }
                if (storedUser.roleId !== 4) {
                    setStatus('not-wholesaler');
                    return;
                }
                setUserDetails(storedUser);
                const userStatus = (storedUser.status || 'Pending').toLowerCase();
                if (userStatus === 'active' || userStatus === 'approved') {
                    setStatus('approved');
                } else if (userStatus === 'rejected') {
                    setStatus('rejected');
                } else if (userStatus === 'suspended') {
                    setStatus('suspended');
                } else {
                    setStatus('pending');
                }
            } catch (err) {
                setStatus('no-auth');
            }
        };
        checkStatus();
    }, []);

    if (status === 'loading') {
        return (
            <div className="vpr-wrapper">
                <Navbar />
                <div className="vpr-loading"><p>Checking account status...</p></div>
                <Footer />
            </div>
        );
    }

    if (status === 'no-auth') return <Navigate to="/wholesaler/login" replace />;
    if (status === 'not-wholesaler') return <Navigate to="/" replace />;
    if (status === 'approved') return <Outlet />;

    return (
        <div className="vpr-wrapper">
            <Navbar />
            <div className="vpr-status-page">
                <div className="vpr-card">
                    {status === 'pending' ? (
                        <>
                            <div className="vpr-icon-circle vpr-icon-circle--pending"><Clock size={32} color="#D97706" /></div>
                            <h2 className="vpr-title">Account Pending Approval</h2>
                            <p className="vpr-text">Your wholesaler account is under review. You'll gain access once approved.</p>
                            <div className="vpr-notice"><Mail size={18} color="#C9A87C" /><span>We'll notify you at <strong>{userDetails?.email || 'your email'}</strong> once approved.</span></div>
                            <a href="/" className="vpr-btn">Back to Home</a>
                        </>
                    ) : status === 'suspended' ? (
                        <>
                            <div className="vpr-icon-circle vpr-icon-circle--suspended"><Ban size={32} color="#DC2626" /></div>
                            <h2 className="vpr-title">Account Suspended</h2>
                            <p className="vpr-text">Your account has been suspended. Please contact support.</p>
                            <div className="vpr-actions"><a href="/contact" className="vpr-btn">Contact Support</a><a href="/" className="vpr-btn--outline">Back to Home</a></div>
                        </>
                    ) : (
                        <>
                            <div className="vpr-icon-circle vpr-icon-circle--rejected"><ShieldAlert size={32} color="#DC2626" /></div>
                            <h2 className="vpr-title">Account Not Approved</h2>
                            <p className="vpr-text">Your wholesaler application was not approved. Please contact support.</p>
                            <div className="vpr-actions"><a href="/contact" className="vpr-btn">Contact Support</a><a href="/" className="vpr-btn--outline">Back to Home</a></div>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default WholesalerProtectedRoute;
