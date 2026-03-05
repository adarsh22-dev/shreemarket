import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Minus, Plus, Star, ThumbsUp, ThumbsDown, Package, RotateCcw, ShieldCheck, HeartHandshake, Leaf, MapPin, Heart, Loader2, CornerDownRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getProduct, getVendorById, getAllProducts, getProductReviews, submitProductReview, BACKEND_URL } from '../api/api';
import './ProductPage.css';

const ProductPage = () => {
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);
    const { cartItems, addToCart, removeFromCart, isProductInCart, addToRecentlyViewed } = useCart();

    const [product, setProduct] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    // Review Form State
    const [isWritingReview, setIsWritingReview] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, title: '', text: '', reviewerName: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            try {
                // Fetch Product
                const productData = await getProduct(id);
                setProduct(productData);

                // Add to recently viewed
                addToRecentlyViewed({
                    id: productData.id,
                    name: productData.name,
                    price: productData.discountPrice || productData.regularPrice,
                    image: productData.media && productData.media.length > 0
                        ? `${BACKEND_URL}/uploads/products/${productData.media.find(m => m.isPrimary)?.fileName || productData.media[0].fileName}`
                        : "https://via.placeholder.com/400x400",
                    category: productData.category
                });

                // Fetch Vendor (Artisan)
                if (productData.vendorId) {
                    const vendorData = await getVendorById(productData.vendorId);
                    setVendor(vendorData);
                }

                // Fetch Related Products (same category)
                const allProducts = await getAllProducts();
                const related = allProducts
                    .filter(p => p.category === productData.category && p.id !== productData.id)
                    .slice(0, 4);
                setRelatedProducts(related);

                // Fetch Reviews
                try {
                    const productReviews = await getProductReviews(id);
                    setReviews(productReviews);
                } catch (reviewErr) {
                    console.error("Failed to fetch reviews:", reviewErr);
                }

                window.scrollTo(0, 0);
            } catch (err) {
                console.error("Failed to fetch product details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const savedReview = await submitProductReview({
                ...newReview,
                productId: id,
                reviewerName: newReview.reviewerName || 'Anonymous',
            });
            setReviews(prev => [savedReview, ...prev]);
            setIsWritingReview(false);
            setNewReview({ rating: 5, title: '', text: '', reviewerName: '' });
        } catch (err) {
            console.error("Failed to submit review:", err);
            alert("Could not submit the review. Please try again.");
        } finally {
            setSubmittingReview(false);
        }
    };

    // Derived Statistics
    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : "5.0";

    const getRatingDistribution = () => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (dist[r.rating] !== undefined) dist[r.rating]++;
        });
        return Object.keys(dist).sort((a, b) => b - a).map(stars => ({
            stars: parseInt(stars),
            count: dist[stars],
            pct: reviews.length > 0 ? Math.round((dist[stars] / reviews.length) * 100) : 0
        }));
    };

    const renderStars = (rating) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={star <= rating ? "star-icon filled" : "star-icon"} />
                ))}
            </div>
        );
    };

    const handleHeartClick = (e) => {
        e.preventDefault();
        if (isProductInCart(product.id)) {
            removeFromCart(product.id);
        } else {
            addToCart({
                ...product,
                title: product.name,
                price: product.discountPrice || product.regularPrice || 0,
                image: product.media && product.media.length > 0 ? `${BACKEND_URL}/uploads/products/${product.media.find(m => m.isPrimary)?.fileName || product.media[0].fileName}` : null
            }, 1, null, false);
        }
    };

    const handleAddToCart = () => {
        addToCart({
            ...product,
            title: product.name,
            price: product.discountPrice || product.regularPrice || 0,
            image: product.media && product.media.length > 0 ? `${BACKEND_URL}/uploads/products/${product.media.find(m => m.isPrimary)?.fileName || product.media[0].fileName}` : null
        }, quantity, null, true);
    };

    if (loading) {
        return (
            <div className="product-page-wrapper">
                <Navbar />
                <div className="product-page-loading">
                    <Loader2 size={48} className="animate-spin" color="#FF5722" />
                    <p>Loading masterpiece...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-page-wrapper">
                <Navbar />
                <div className="product-page-error">
                    <h2>Oops! We couldn't find this product.</h2>
                    <p>{error || "The product you're looking for might have been moved or doesn't exist."}</p>
                    <Link to="/shop" className="back-to-shop-btn">Back to Shop</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const mainImageUrl = product.media && product.media.length > 0
        ? `${BACKEND_URL}/uploads/products/${product.media[activeImage]?.fileName}`
        : "https://via.placeholder.com/600x600?text=No+Image";

    const store = vendor?.stores?.[0];

    return (
        <div className="product-page-wrapper">
            <Navbar />

            <main className="product-page-main">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <Link to="/">Home</Link> <span className="separator">&gt;</span> <Link to="/shop">Shop All</Link> <span className="separator">&gt;</span> <span className="current">{product.name}</span>
                </div>

                {/* Hero Section */}
                <section className="product-hero">
                    <div className="product-gallery">
                        <div className="main-image-wrapper" style={{ position: 'relative' }}>
                            <button
                                className="heart-btn"
                                onClick={handleHeartClick}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    backgroundColor: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    zIndex: 10
                                }}
                            >
                                <Heart
                                    size={20}
                                    fill={isProductInCart(product.id) ? "#FF0000" : "#ccc"}
                                    color={isProductInCart(product.id) ? "#FF0000" : "#ccc"}
                                />
                            </button>
                            <img src={mainImageUrl} alt={product.name} className="main-image" />
                        </div>
                        <div className="thumbnails">
                            {product.media && product.media.map((med, index) => (
                                <div
                                    key={med.id}
                                    className={`thumb-wrapper ${index === activeImage ? 'active' : ''}`}
                                    onClick={() => setActiveImage(index)}
                                >
                                    <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`Thumbnail ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="product-details">
                        <div className="tag">{product.category?.toUpperCase()} | {product.status?.toUpperCase() || 'AVAILABLE'}</div>
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-price">
                            {product.discountPrice ? (
                                <div className="price-container">
                                    <span className="discount-price">₹{product.discountPrice.toFixed(2)}</span>
                                    <span className="regular-price-strike">₹{product.regularPrice.toFixed(2)}</span>
                                    {product.regularPrice > product.discountPrice && (
                                        <span className="discount-badge-inline">
                                            -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                                        </span>
                                    )}
                                </div>
                            ) : (
                                `₹${product.regularPrice.toFixed(2)}`
                            )}
                        </p>

                        <p className="product-description">{product.shortDescription || product.description}</p>

                        <div className="product-specs">
                            {product.brand && (
                                <div className="spec-item">
                                    <span className="spec-label">BRAND</span>
                                    <span className="spec-value">{product.brand}</span>
                                </div>
                            )}
                            {product.sku && (
                                <div className="spec-item">
                                    <span className="spec-label">SKU</span>
                                    <span className="spec-value">{product.sku}</span>
                                </div>
                            )}
                            {product.attributes && product.attributes.map(attr => (
                                <div key={attr.id} className="spec-item">
                                    <span className="spec-label">{attr.name?.toUpperCase()}</span>
                                    <span className="spec-value">{attr.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="product-actions">
                            <div className="quantity-selector">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn"><Minus size={16} /></button>
                                <span className="qty-value">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="qty-btn"><Plus size={16} /></button>
                            </div>
                            <button className="add-to-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
                        </div>

                        <div className="product-guarantees">
                            <div className="guarantee">
                                <Package size={14} /> Free Worldwide Shipping
                            </div>
                            <div className="guarantee">
                                <RotateCcw size={14} /> 14-Day Free Returns
                            </div>
                        </div>
                    </div>
                </section>

                {/* Artisan Section */}
                {store && (
                    <section className="artisan-section">
                        <div className="artisan-card">
                            <div className="artisan-image-wrapper">
                                <img
                                    src={store.storeLogo ? `${BACKEND_URL}/uploads/logos/${store.storeLogo}` : "https://via.placeholder.com/400x400?text=Artisan"}
                                    alt={store.storeName}
                                />
                                <div className="artisan-location-badge">
                                    <span className="location-label">LOCATION</span>
                                    <strong>{store.city || store.country || 'Global'} 🌏</strong>
                                </div>
                            </div>
                            <div className="artisan-info">
                                <h3>Meet the Artisan</h3>
                                <div className="artisan-name-title">
                                    <span className="name">{store.storeName}</span>
                                </div>
                                <div className="artisan-story">
                                    {store.description ? (
                                        store.description.split('\n\n').map((paragraph, index) => (
                                            <p key={index}>{paragraph}</p>
                                        ))
                                    ) : (
                                        <p>A dedicated creator committed to the highest standards of quality and traditional craftsmanship.</p>
                                    )}
                                </div>
                                <Link to={`/shop?vendor=${vendor.id}`} className="view-collection-link">View Store Collection &gt;</Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* Why It Matters */}
                <section className="why-it-matters-section">
                    <h2 className="section-heading">Why It Matters</h2>
                    <p className="section-subheading">Your purchase supports sustainable practices and empowers artisan communities worldwide.</p>

                    <div className="matters-grid">
                        <div className="matter-card">
                            <div className="matter-icon"><HeartHandshake size={24} color="#FF5722" /></div>
                            <h4>Fair Wages</h4>
                            <p>Artisans set their own prices, ensuring they earn a living wage that supports their families and communities.</p>
                        </div>
                        <div className="matter-card">
                            <div className="matter-icon"><ShieldCheck size={24} color="#FF5722" /></div>
                            <h4>Cultural Preservation</h4>
                            <p>By prioritizing traditional techniques, we help keep centuries-old crafting traditions alive for future generations.</p>
                        </div>
                        <div className="matter-card">
                            <div className="matter-icon"><Leaf size={24} color="#FF5722" /></div>
                            <h4>100% Organic</h4>
                            <p>We use only locally sourced natural dyes and sustainable materials that are kind to both the maker and the earth.</p>
                        </div>
                    </div>
                </section>

                {/* Reviews */}
                <section className="reviews-section">
                    <h2 className="section-heading-left">Customer Reviews</h2>

                    <div className="reviews-overview">
                        <div className="rating-summary">
                            <div className="big-rating">
                                <span className="number">{averageRating}</span>
                                <div className="stars-and-count">
                                    {renderStars(Math.round(parseFloat(averageRating)))}
                                    <span className="count">Based on {reviews.length} reviews</span>
                                </div>
                            </div>
                            {/* <button className="write-review-btn" onClick={() => setIsWritingReview(!isWritingReview)}>
                                {isWritingReview ? "Cancel" : "Write a Review"}
                            </button> */}
                        </div>

                        <div className="rating-bars">
                            {getRatingDistribution().map((bar) => (
                                <div key={bar.stars} className="rating-bar-row">
                                    <span className="star-label">{bar.stars} Star</span>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: `${bar.pct}%` }}></div>
                                    </div>
                                    <span className="pct-label">{bar.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isWritingReview && (
                        <div className="review-form-container" style={{ background: '#fcfcfc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #eee' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem' }}>Write Your Review</h3>
                            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Rating</label>
                                    <select
                                        value={newReview.rating}
                                        onChange={e => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                                        style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value={5}>5 Stars - Excellent</option>
                                        <option value={4}>4 Stars - Good</option>
                                        <option value={3}>3 Stars - Average</option>
                                        <option value={2}>2 Stars - Poor</option>
                                        <option value={1}>1 Star - Terrible</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="How you want your name to appear"
                                        value={newReview.reviewerName}
                                        onChange={e => setNewReview({ ...newReview, reviewerName: e.target.value })}
                                        style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Review Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Summarize your experience"
                                        value={newReview.title}
                                        onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                                        style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Review</label>
                                    <textarea
                                        required
                                        placeholder="What did you like or dislike? What should other shoppers know?"
                                        value={newReview.text}
                                        onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                                        rows={4}
                                        style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                                    />
                                </div>
                                <button type="submit" disabled={submittingReview} style={{
                                    padding: '12px 24px',
                                    background: '#FF5722',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: submittingReview ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    alignSelf: 'flex-start'
                                }}>
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="reviews-list">
                        {reviews.length > 0 ? reviews.map((review) => (
                            <div key={review.id || review.createdAt} className="review-item">
                                <div className="review-header">
                                    {renderStars(review.rating)}
                                    <span className="review-date">
                                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Just now'}
                                    </span>
                                </div>
                                <h4 className="review-title">{review.title}</h4>
                                <div className="reviewer-info">
                                    <span className="reviewer-name">{review.reviewerName || 'Anonymous'}</span>
                                    {review.verifiedBuyer && <span className="verified-buyer"><ShieldCheck size={12} className="verified-icon" /> Verified Buyer</span>}
                                </div>
                                <p className="review-text">{review.text}</p>

                                {/* Display Review Images if present */}
                                {review.images && review.images.length > 0 && (
                                    <div className="review-images-gallery">
                                        {review.images.map((img, index) => (
                                            <div key={index} className="review-image-thumbnail">
                                                <img
                                                    src={`${BACKEND_URL}/uploads/reviews/${img}`}
                                                    alt={`Review image ${index + 1}`}
                                                    onClick={() => window.open(`${BACKEND_URL}/uploads/reviews/${img}`, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {review.vendorReply && (
                                    <div className="vendor-reply-block">
                                        <div className="vrb-header">
                                            <span className="vrb-title"><CornerDownRight size={14} /> ARTISAN'S RESPONSE</span>
                                            <span className="vrb-date">
                                                {review.replyDate ? new Date(review.replyDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                        <p className="vrb-text">{review.vendorReply}</p>
                                    </div>
                                )}

                                <div className="review-helpful">
                                    <span className="helpful-question">Was this helpful?</span>
                                    <button className="helpful-btn"><ThumbsUp size={14} /> {review.helpfulCount || 0}</button>
                                    <button className="helpful-btn"><ThumbsDown size={14} /> {review.notHelpfulCount || 0}</button>
                                </div>
                            </div>
                        )) : (
                            <p style={{ padding: '2rem 0', color: '#666', fontStyle: 'italic' }}>No reviews yet. Be the first to review this product!</p>
                        )}
                    </div>

                    {reviews.length > 5 && (
                        <div className="load-more-container">
                            <button className="load-more-btn">Load More Reviews</button>
                        </div>
                    )}
                </section>

                {/* You May Also Like */}
                {relatedProducts.length > 0 && (
                    <section className="related-products-section">
                        <h3 className="related-heading">You May Also Like</h3>
                        <div className="related-grid">
                            {relatedProducts.map(item => (
                                <Link to={`/product/${item.id}`} key={item.id} className="related-card">
                                    <div className="related-image-wrapper">
                                        <img
                                            src={item.media && item.media.length > 0 ? `${BACKEND_URL}/uploads/products/${item.media.find(m => m.isPrimary)?.fileName || item.media[0].fileName}` : "https://via.placeholder.com/400x400"}
                                            alt={item.name}
                                        />
                                    </div>
                                    <div className="related-info">
                                        <h5 className="related-name">{item.name}</h5>
                                        <p className="related-price">₹{(item.discountPrice || item.regularPrice).toFixed(2)}</p>
                                        <span className="view-product-link">View Product &gt;</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <Footer />
        </div>
    );
};

export default ProductPage;
