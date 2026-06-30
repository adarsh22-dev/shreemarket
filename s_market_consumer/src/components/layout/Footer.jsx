'use client';

import React from 'react';
import Link from 'next/link';
import './Footer.css';
import { Globe, Camera, Rss } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-top">
                {/* Brand & Mission */}
                <div className="footer-brand">
                    <img
                        src="/assets/smarketlogo.svg"
                        alt="SreeMarket"
                        className="vm-logo-image"
                        style={{ height: '60px', width: 'auto', marginBottom: '15px' }}
                    />
                    <p className="brand-desc">
                        Supporting independent artisans and preserving traditional crafts for a more conscious world.
                    </p>
                    <div className="social-icons">
                        <a href="#" className="social-icon"><Camera size={14} /></a>
                        <a href="#" className="social-icon"><Globe size={14} /></a>
                        <a href="#" className="social-icon"><Rss size={14} /></a>
                    </div>
                </div>

                {/* Links Sections */}
                <div className="footer-links-container">
                    <div className="footer-column">
                        <h4>Support</h4>
                        <ul>
                            <li><Link href="/support/shipping">Shipping & Delivery</Link></li>
                            <li><Link href="/support/returns">Returns & Exchanges</Link></li>
                            <li><Link href="/support/contact">Contact Us</Link></li>
                            <li><Link href="/support/faq">Store FAQ</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter Section */}
                <div className="footer-newsletter">
                    <h4>Stay Inspired</h4>
                    <p className="newsletter-text">
                        Join our mailing list for exclusive artisan stories and new featured collections.
                    </p>
                    <div className="newsletter-input-group">
                        <input type="email" placeholder="Email address" />
                        <button type="button">GO</button>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <div>&copy; 2026 Sreemarket. All rights reserved.</div>
                <div className="footer-bottom-links">
                    <Link href="/support/privacy">Privacy Policy</Link>
                    <Link href="/support/terms">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
