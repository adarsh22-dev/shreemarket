import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { Instagram, Camera, Rss } from 'lucide-react';
import { subscribeNewsletter } from '../api/api';
import toast from 'react-hot-toast';
import logo from '../assets/smarketlogo.svg';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }
        setSubscribing(true);
        try {
            await subscribeNewsletter(email);
            toast.success('Subscribed successfully!');
            setEmail('');
        } catch (err) {
            toast.error(err?.message || 'Subscription failed. Please try again.');
        } finally {
            setSubscribing(false);
        }
    };

    return (
        <footer className="footer-container">
            <div className="footer-top">
                <div className="footer-brand">
                    <img
                        src={logo}
                        alt="SreeMarket"
                        className="vm-logo-image"
                        style={{ height: '60px', width: 'auto', marginBottom: '15px' }}
                    />
                    <p className="brand-desc">
                        Supporting independent artisans and preserving traditional crafts for a more conscious world.
                    </p>
                    <div className="social-icons">
                        <a href="#" className="social-icon" onClick={e => e.preventDefault()}><Camera size={14} /></a>
                        <a href="#" className="social-icon" onClick={e => e.preventDefault()}><Instagram size={14} /></a>
                        <a href="#" className="social-icon" onClick={e => e.preventDefault()}><Rss size={14} /></a>
                    </div>
                </div>

                <div className="footer-links-container">
                    <div className="footer-column">
                        <h4>Support</h4>
                        <ul>
                            <li><Link to="/support/shipping">Shipping & Delivery</Link></li>
                            <li><Link to="/support/returns">Returns & Exchanges</Link></li>
                            <li><Link to="/support/contact">Contact Us</Link></li>
                            <li><Link to="/support/faq">Store FAQ</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-newsletter">
                    <h4>Stay Inspired</h4>
                    <p className="newsletter-text">
                        Join our mailing list for exclusive artisan stories and new featured collections.
                    </p>
                    <form className="newsletter-input-group" onSubmit={handleSubscribe}>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={subscribing}>
                            {subscribing ? '...' : 'GO'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="footer-bottom">
                <div>&copy; 2026 Sreemarket. All rights reserved.</div>
                <div className="footer-bottom-links">
                    <Link to="/support/privacy">Privacy Policy</Link>
                    <Link to="/support/terms">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

