import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { Heart, ShieldCheck, Award, Lock, ArrowRight, Minus, Plus, Loader2 } from 'lucide-react';
import { getAllProducts, BACKEND_URL } from '../api/api';
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
        cartCount,
        recentlyViewed
    } = useCart();
    const navigate = useNavigate();

    const [suggestedProducts, setSuggestedProducts] = React.useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = React.useState(true);

    // Scroll to the top when the page loads
    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchSuggestions = async () => {
            setLoadingSuggestions(true);
            try {
                const allProducts = await getAllProducts();
                const cartIds = new Set(cartItems.map(item => item.id));

                // 1. Get recently viewed that aren't in cart
                let suggestions = recentlyViewed.filter(p => !cartIds.has(p.id));

                // 2. If we need more, get random products from catalog
                if (suggestions.length < 4) {
                    const otherProducts = allProducts
                        .filter(p => !cartIds.has(p.id) && !suggestions.some(s => s.id === p.id))
                        .map(p => ({
                            id: p.id,
                            name: p.name,
                            price: p.discountPrice || p.regularPrice,
                            image: p.media && p.media.length > 0
                                ? `${BACKEND_URL}/uploads/products/${p.media.find(m => m.isPrimary)?.fileName || p.media[0].fileName}`
                                : "https://via.placeholder.com/400x400",
                            category: p.category
                        }));

                    // Shuffle other products
                    const shuffled = otherProducts.sort(() => 0.5 - Math.random());
                    suggestions = [...suggestions, ...shuffled].slice(0, 4);
                }

                setSuggestedProducts(suggestions.slice(0, 4));
            } catch (error) {
                console.error("Failed to fetch suggested products:", error);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [recentlyViewed, cartItems]);

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
                                <Heart fill="#FF5722" size={20} strokeWidth={3} />
                            </div>
                            <div className="impact-content">
                                <h3>Your Social Impact Summary</h3>
                                <p>
                                    This order supports <strong>5 days of fair wages</strong> for women in Mexico and Kenya, contributing to local community education funds.
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

                            {cartCount === 0 ? (
                                <button className="btn-checkout disabled" disabled style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Lock size={16} /> Proceed to Checkout
                                </button>
                            ) : (
                                <Link to="/checkout" className="btn-checkout" style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    Proceed to Checkout
                                </Link>
                            )}
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
                        {loadingSuggestions ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                <Loader2 size={32} className="animate-spin" color="#FF5722" style={{ margin: '0 auto' }} />
                                <p>Finding things you'll love...</p>
                            </div>
                        ) : suggestedProducts.length > 0 ? (
                            suggestedProducts.map((product) => (
                                <Link key={product.id} to={`/product/${product.id}`} className="suggestion-card">
                                    <div className="suggestion-image">
                                        <button className="favorite-btn" onClick={(e) => { e.preventDefault(); }}>
                                            <Heart size={16} fill="#ccc" />
                                        </button>
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                    <h4 className="suggestion-title">{product.name}</h4>
                                    <p className="suggestion-author">in {product.category || "General"}</p>
                                    <p className="suggestion-price">₹{product.price.toFixed(2)}</p>
                                </Link>
                            ))
                        ) : (
                            <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No suggestions available at the moment.</p>
                        )}
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
};

export default CartPage;
