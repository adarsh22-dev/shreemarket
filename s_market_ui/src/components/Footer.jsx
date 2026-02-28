import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { Instagram, Camera, Rss } from 'lucide-react'; // Some placeholder icons for social

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-top">
                {/* Brand & Mission */}
                <div className="footer-brand">
                    <div className="brand-logo-container">
                        <div className="brand-icon">
                            <div className="brand-icon-inner"></div>
                        </div>
                        <span className="brand-name">HANDCRAFTED</span>
                    </div>
                    <p className="brand-desc">
                        Supporting independent artisans and preserving traditional crafts for a more conscious world.
                    </p>
                    <div className="social-icons">
                        <a href="#" className="social-icon"><Camera size={14} /></a>
                        <a href="#" className="social-icon"><Instagram size={14} /></a>
                        <a href="#" className="social-icon"><Rss size={14} /></a>
                    </div>
                </div>

                {/* Links Sections */}
                <div className="footer-links-container">
                    <div className="footer-column">
                        <h4>Support</h4>
                        <ul>
                            <li><Link to="/support/shipping">Shipping & Delivery</Link></li>
                            <li><Link to="/support/returns">Returns & Exchanges</Link></li>
                            <li><Link to="/support/contact">Contact Us</Link></li>
                            <li><Link to="/support/faq">Store FAQ</Link></li>
                            <li><Link to="/shop/gift-cards">Gift Cards</Link></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>About</h4>
                        <ul>
                            <li><Link to="/about/story">Our Story</Link></li>
                            <li><Link to="/about/artisans">Meet the Makers</Link></li>
                            <li><Link to="/about/standards">Artisan Standards</Link></li>
                            <li><Link to="/about/sustainability">Sustainability</Link></li>
                            <li><Link to="/about/press">Press & Media</Link></li>
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
                <div>&copy; 2026 Handcrafted Marketplaces Inc. All rights reserved.</div>
                <div className="footer-bottom-links">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                    <Link to="/accessibility">Accessibility</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

