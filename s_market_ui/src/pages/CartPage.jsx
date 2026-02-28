import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { Heart, ShieldCheck, Award, Lock, ArrowRight, Minus, Plus } from 'lucide-react';
import './CartPage.css';

const CartPage = () => {
    const {
        cartItems,
        savedItems,
        updateQuantity,
        removeFromCart,
        saveForLater,
        moveToCart,
        removeFromSaved,
        cartTotal,
        cartCount
    } = useCart();
    const navigate = useNavigate();

    // Scroll to the top when the page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // In a real app, these values would come from context or props based on actual items
    const taxRate = 0.08;
    const estimatedTax = cartTotal * taxRate;
    const finalTotal = cartTotal + estimatedTax;

    return (
        <div className="cart-page-wrapper">
            <Navbar />

            <div className="cart-page-container">
                <header className="cart-header">
                    <h1>Happy Shopping!!!</h1>
                </header>

                <div className="cart-layout">

                    {/* Main Cart Items Area */}
                    <div className="cart-main-content">

                        {/* Social Impact Banner */}
                        <div className="social-impact-banner">
                            <div className="impact-icon">
                                <Heart fill="#FF5722" size={20} />
                            </div>
                            <div className="impact-content">
                                <h3>Spread smile!!! :)</h3>
                                <p>
                                    Happy to have you shop with us<strong>.</strong>
                                </p>
                            </div>

                        </div>

                        {/* Cart Items List */}
                        <div className="cart-items-list-large">
                            {cartItems.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px' }}>
                                    Your basket is empty.
                                    <br /><br />
                                    <Link to="/shop" className="btn-primary">Shop Collection</Link>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={`${item.id}-${item.variant}`} className="cart-item-card">
                                        <div className="cart-item-image">
                                            <img src={item.image} alt={item.name} />
                                        </div>
                                        <div className="cart-item-details">
                                            <div className="cart-item-header">
                                                <div>
                                                    <h3 className="cart-item-title">{item.name}</h3>
                                                    <p className="cart-item-author">By {item.author || "Artisan"} in {item.details?.origin || "Global"}</p>
                                                </div>
                                                <span className="cart-item-price">₹{item.price.toFixed(2)}</span>
                                            </div>

                                            <div className="cart-item-actions">
                                                <div className="qty-controls">
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="qty-value">{item.quantity}</span>
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <div className="action-links">
                                                    <button
                                                        className="action-link"
                                                        onClick={() => saveForLater(item.id, item.variant)}
                                                    >
                                                        SAVE FOR LATER
                                                    </button>
                                                    <button
                                                        className="action-link remove"
                                                        onClick={() => removeFromCart(item.id, item.variant)}
                                                    >
                                                        REMOVE
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Dynamic Saved for Later Section */}
                        {savedItems.length > 0 && (
                            <div className="saved-for-later">
                                <h2 className="section-title">Saved for Later ({savedItems.length})</h2>
                                {savedItems.map((item) => (
                                    <div key={`${item.id}-${item.variant}-saved`} className="saved-item-card">
                                        <div className="saved-item-image">
                                            <img src={item.image} alt={item.name} />
                                        </div>
                                        <div className="saved-item-details">
                                            <h4 className="saved-item-title">{item.name}</h4>
                                            <p className="saved-item-price">₹{item.price.toFixed(2)}</p>
                                            <button
                                                className="action-link remove"
                                                style={{ marginTop: '0.5rem' }}
                                                onClick={() => removeFromSaved(item.id, item.variant)}
                                            >
                                                REMOVE
                                            </button>
                                        </div>
                                        <button
                                            className="btn-move-to-cart"
                                            onClick={() => moveToCart(item.id, item.variant)}
                                        >
                                            Move to Cart
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* Sidebar Area */}
                    <aside className="cart-sidebar">

                        <div className="order-summary-card">
                            <h3>Order Summary</h3>

                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Estimated Shipping</span>
                                <span className="free-shipping">FREE</span>
                            </div>
                            <div className="summary-row">
                                <span>Estimated Tax</span>
                                <span>₹{estimatedTax.toFixed(2)}</span>
                            </div>

                            <div className="summary-row total">
                                <span>Total</span>
                                <span className="total-value">₹{finalTotal.toFixed(2)}</span>
                            </div>

                            <button className="btn-checkout" disabled={cartCount === 0}>
                                <Lock size={16} /> Proceed to Checkout
                            </button>
                            <Link to="/shop" className="btn-continue">
                                Continue Shopping
                            </Link>

                            <div className="trust-badges">
                                <div className="trust-badge">
                                    <ShieldCheck size={16} color="#FF5722" /> Safe & Secure Checkout Guaranteed
                                </div>
                                <div className="trust-badge">
                                    <Award size={16} color="#FF5722" /> Direct Fair Trade Certified Sourcing
                                </div>
                            </div>
                        </div>

                        <div className="promo-code-card">
                            <h4>PROMO CODE</h4>
                            <div className="promo-input-group">
                                <input type="text" placeholder="Enter code" />
                                <button>Apply</button>
                            </div>
                        </div>

                    </aside>
                </div>

                {/* You May Also Like */}
                <section className="suggestions-section">
                    <div className="suggestions-header">
                        <h2 className="section-title">You May Also Like</h2>
                        <Link to="/shop" className="view-more-link">
                            View more crafts <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="suggestions-grid">
                        <Link to="/product/101" className="suggestion-card">
                            <div className="suggestion-image">
                                <button className="favorite-btn" onClick={(e) => { e.preventDefault(); /* handle save */ }}><Heart size={16} fill="#ccc" /></button>
                                <img src="https://images.unsplash.com/photo-1602873117565-d41c49b4af6b?q=80&w=600&auto=format&fit=crop" alt="Beeswax Candle Set" />
                            </div>
                            <h4 className="suggestion-title">Beeswax Candle Set</h4>
                            <p className="suggestion-author">Hand-poured by Maria, Guatemala</p>
                            <p className="suggestion-price">₹34.00</p>
                        </Link>

                        <Link to="/product/102" className="suggestion-card">
                            <div className="suggestion-image">
                                <button className="favorite-btn" onClick={(e) => { e.preventDefault(); /* handle save */ }}><Heart size={16} fill="#111" color="#111" /></button>
                                <img src="https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?q=80&w=600&auto=format&fit=crop" alt="Woven Rattan Coasters" />
                            </div>
                            <h4 className="suggestion-title">Woven Rattan Coasters</h4>
                            <p className="suggestion-author">By Artisans of the Philippines</p>
                            <p className="suggestion-price">₹22.00</p>
                        </Link>

                        <Link to="/product/103" className="suggestion-card">
                            <div className="suggestion-image">
                                <button className="favorite-btn" onClick={(e) => { e.preventDefault(); /* handle save */ }}><Heart size={16} fill="#111" color="#111" /></button>
                                <img src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=600&auto=format&fit=crop" alt="Indigo Dyed Linen Cover" />
                            </div>
                            <h4 className="suggestion-title">Indigo Dyed Linen Cover</h4>
                            <p className="suggestion-author">By Kirti in Jaipur, India</p>
                            <p className="suggestion-price">₹45.00</p>
                        </Link>

                        <Link to="/product/104" className="suggestion-card">
                            <div className="suggestion-image">
                                <button className="favorite-btn" onClick={(e) => { e.preventDefault(); /* handle save */ }}><Heart size={16} fill="#ccc" /></button>
                                <img src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=600&auto=format&fit=crop" alt="Terracotta Planter" />
                            </div>
                            <h4 className="suggestion-title">Terracotta Planter</h4>
                            <p className="suggestion-author">By Sofia in Algarve, Portugal</p>
                            <p className="suggestion-price">₹38.00</p>
                        </Link>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
};

export default CartPage;
