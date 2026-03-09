import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Trash2, Heart, HeartHandshake } from 'lucide-react';
import './WishlistPage.css';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [activeTab, setActiveTab] = React.useState('all');

    const filteredItems = React.useMemo(() => {
        if (activeTab === 'in-stock') {
            return wishlistItems.filter(item => item.initialStock > 0);
        }
        return wishlistItems; // 'recently-added' and 'all' just return all for now
    }, [wishlistItems, activeTab]);

    const handleAddToCart = (product) => {
        addToCart(product);
        removeFromWishlist(product.id);
    };

    return (
        <div className="wishlist-page">
            <Navbar />
            <div className="wishlist-container">
                <div className="wishlist-header">
                    <h1>My Wishlist</h1>
                    <p>Your curated selection of artisan-made treasures.</p>
                </div>

                {wishlistItems.length > 0 ? (
                    <>
                        <div className="wishlist-banner">
                            <div className="wishlist-banner-icon">
                                <HeartHandshake size={24} color="#E64A19" />
                            </div>
                            <p className="wishlist-banner-text">
                                Save the items that inspire you and help empower women artisans with every purchase. Your support creates sustainable livelihoods.
                            </p>
                        </div>

                        <div className="wishlist-tabs">
                            <button
                                className={`wishlist-tab ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All Items <span className="tab-badge">{wishlistItems.length}</span>
                            </button>
                            <button
                                className={`wishlist-tab ${activeTab === 'in-stock' ? 'active' : ''}`}
                                onClick={() => setActiveTab('in-stock')}
                            >
                                In Stock
                            </button>
                            <button
                                className={`wishlist-tab ${activeTab === 'recently-added' ? 'active' : ''}`}
                                onClick={() => setActiveTab('recently-added')}
                            >
                                Recently Added
                            </button>
                        </div>

                        <div className="wishlist-grid">
                            {filteredItems.map((product) => {
                                const stockStatus = product.initialStock > 10 ? 'IN STOCK' : (product.initialStock > 0 ? 'LOW STOCK' : 'OUT OF STOCK');
                                const stockClass = product.initialStock > 10 ? 'in-stock' : (product.initialStock > 0 ? 'low-stock' : 'out-of-stock');

                                return (
                                    <div key={product.id} className="wishlist-item-card">
                                        <div className="wishlist-img-wrapper">
                                            <img src={product.image} alt={product.name} />
                                            <button
                                                className="remove-wishlist-btn"
                                                onClick={() => removeFromWishlist(product.id)}
                                                title="Remove from wishlist"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <span className={`stock-badge ${stockClass}`}>
                                                {stockStatus}
                                            </span>
                                        </div>
                                        <div className="wishlist-info">
                                            <h3 className="wishlist-product-name">{product.name}</h3>
                                            <p className="wishlist-price">${parseFloat(product.price || product.discountPrice || product.regularPrice || 0).toFixed(2)}</p>
                                            <button
                                                className="wishlist-add-to-cart-btn"
                                                onClick={() => handleAddToCart(product)}
                                            >
                                                <ShoppingCart size={18} /> Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="empty-wishlist">
                        <Heart size={64} color="#ddd" strokeWidth={1} />
                        <h2>Your wishlist is empty</h2>
                        <p>Browse our collection and save your favorite items here.</p>
                        <Link to="/shop" className="continue-shopping">Continue Shopping</Link>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default WishlistPage;
