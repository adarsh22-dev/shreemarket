import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CartDropdown.css';

const CartDropdown = () => {
    const {
        cartItems,
        isCartOpen,
        closeCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        cartCount
    } = useCart();

    if (!isCartOpen) return null;

    return (
        <>
            <div className="cart-backdrop" onClick={closeCart}></div>
            <div className="cart-dropdown">
                <div className="cart-header">
                    <h3>My Cart</h3>
                    <span className="cart-count-label">{cartCount} items</span>
                    <button className="cart-close-mobile" onClick={closeCart}>
                        <X size={20} />
                    </button>
                </div>

                <div className="cart-items-list">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart-message">
                            Your cart is empty.
                            <br />
                            <Link to="/shop" onClick={closeCart}>Start Shopping</Link>
                        </div>
                    ) : (
                        cartItems.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="cart-item">
                                <div className="cart-item-image">
                                    <img
                                        src={item.image || (item.media && item.media.length > 0 ? `${BACKEND_URL}/uploads/products/${item.media.find(m => m.isPrimary)?.fileName || item.media[0].fileName}` : '/placeholder-product.png')}
                                        alt={item.name}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/100x100?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="cart-item-details">
                                    <div className="cart-item-header">
                                        <h4 className="cart-item-name">{item.name}</h4>
                                        <button
                                            className="remove-item-btn"
                                            onClick={() => removeFromCart(item.id, item.variant)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <p className="cart-item-variant">
                                        {item.details?.material} • {item.details?.size || 'Standard'}
                                    </p>
                                    <div className="cart-item-footer">
                                        <span className="cart-item-price">₹{(item.price || 0).toFixed(2)}</span>
                                        <div className="cart-qty-control">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={10} />
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}>
                                                <Plus size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <span className="subtotal-amount">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="shipping-note">Shipping and taxes calculated at checkout.</p>

                        <div className="cart-actions">
                            <Link to="/checkout" className="btn-checkout" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }} onClick={closeCart}>Checkout</Link>
                            <Link to="/cart" className="btn-view-cart" onClick={closeCart} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>View Cart</Link>
                            <Link to="/wishlist" className="btn-view-wishlist" onClick={closeCart} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px', color: '#666', fontSize: '0.9rem' }}>Go to Wishlist</Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDropdown;
