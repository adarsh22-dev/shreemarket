import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Minus, Plus, Star, ThumbsUp, ThumbsDown, Package, RotateCcw, ShieldCheck, HeartHandshake, Leaf, MapPin, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductPage.css';

const ProductPage = () => {
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);
    const { cartItems, addToCart, removeFromCart } = useCart();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const product = {
        id: 'pp1',
        title: "Handwoven Desert Sand Wool Throw",
        price: 185.00,
        description: "A masterpiece of traditional craftsmanship, this throw captures the incredible tones inspired by the natural landscape. Hand spun in natural wool and colored with rich, plant-based dyes, each piece takes over three weeks to complete.",
        materials: "100% Oaxacan Merino Wool",
        dimensions: "50\" x 70\" (Includes 4\" tassels on each end)",
        mainImage: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=1200&auto=format&fit=crop",
        thumbnails: [
            "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522758971460-1d21fac222d1?q=80&w=200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1606744887373-30b1bc6b2c28?q=80&w=200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1528156172605-cf4ca715d2a9?q=80&w=200&auto=format&fit=crop"
        ],
        artisan: {
            name: "Elena Garcia",
            title: "Master Weaver",
            location: "Oaxaca, Mexico",
            image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
            story: "“Every thread holds a piece of our land,” says Elena. With over 40 years of experience, Elena leads a small collective of five women in her village. Using a traditional backstrap loom, she translates the textures of the Sierra Norte mountains into timeless textiles.\n\nElena's work is not just a livelihood; it's a preservation of indigenous Zapotec weaving techniques passed down for generations."
        }
    };

    const reviews = [
        {
            user: "Madeleine M.",
            date: "October 12, 2023",
            rating: 5,
            title: "Absolutely stunning craftsmanship",
            verified: true,
            text: "This throw is even more beautiful in person! You can really feel the handmade quality. It's warm, surprisingly soft, and the desert sand color is perfectly represented in the photos. A true heirloom to be cherished for a long time.",
            helpful: 24,
            notHelpful: 1
        },
        {
            user: "Sarah J.",
            date: "September 24, 2023",
            rating: 5,
            title: "Worth every penny!",
            verified: true,
            text: "I love knowing exactly where my products come from. The story of Elena Garcia makes this piece even more special. The weight of the throw is perfect for chilly evenings.",
            helpful: 12,
            notHelpful: 0
        }
    ];

    const relatedProducts = [
        { id: 101, name: "Hand-Dyed Indigo Throw", price: 175.00, image: "https://images.unsplash.com/photo-1606744887373-30b1bc6b2c28?q=80&w=400&auto=format&fit=crop" },
        { id: 102, name: "Artisanal Ceramic Vase", price: 85.00, image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=400&auto=format&fit=crop" },
        { id: 103, name: "Woven Wall Hanging", price: 120.00, image: "https://images.unsplash.com/photo-1522758971460-1d21fac222d1?q=80&w=400&auto=format&fit=crop" },
        { id: 104, name: "Organic Linen Pillows", price: 65.00, image: "https://images.unsplash.com/photo-1528156172605-cf4ca715d2a9?q=80&w=400&auto=format&fit=crop" }
    ];

    const renderStars = (rating) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={star <= rating ? "star-icon filled" : "star-icon"} />
                ))}
            </div>
        );
    };

    const isProductInCart = (productId) => cartItems.some(item => item.id === productId);

    const handleHeartClick = (e) => {
        e.preventDefault();
        if (isProductInCart(product.id)) {
            removeFromCart(product.id);
        } else {
            addToCart({ ...product, name: product.title, image: product.mainImage }, 1, null, false);
        }
    };

    const handleAddToCart = () => {
        addToCart({ ...product, name: product.title, image: product.mainImage }, quantity, null, false);
    };

    return (
        <div className="product-page-wrapper">
            <Navbar />

            <main className="product-page-main">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <Link to="/">Home</Link> <span className="separator">&gt;</span> <Link to="/shop">Shop All</Link> <span className="separator">&gt;</span> <span className="current">Throw</span>
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
                            <img src={product.mainImage} alt={product.title} className="main-image" />
                        </div>
                        <div className="thumbnails">
                            {product.thumbnails.map((thumb, index) => (
                                <div key={index} className={`thumb-wrapper ${index === 0 ? 'active' : ''}`}>
                                    <img src={thumb} alt={`Thumbnail ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="product-details">
                        <div className="tag">LIMITED EDITION ARTISANAL</div>
                        <h1 className="product-title">{product.title}</h1>
                        <p className="product-price">₹{product.price.toFixed(2)}</p>

                        <p className="product-description">{product.description}</p>

                        <div className="product-specs">
                            <div className="spec-item">
                                <span className="spec-label">MATERIALS</span>
                                <span className="spec-value"><ShieldCheck size={14} className="spec-icon" /> {product.materials}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">DIMENSIONS</span>
                                <span className="spec-value"><Package size={14} className="spec-icon" /> {product.dimensions}</span>
                            </div>
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
                <section className="artisan-section">
                    <div className="artisan-card">
                        <div className="artisan-image-wrapper">
                            <img src={product.artisan.image} alt={product.artisan.name} />
                            <div className="artisan-location-badge">
                                <span className="location-label">LOCATION</span>
                                <strong>{product.artisan.location} 🇲🇽</strong>
                            </div>
                        </div>
                        <div className="artisan-info">
                            <h3>Meet the Artisan</h3>
                            <div className="artisan-name-title">
                                <span className="name">{product.artisan.name}</span>, <span className="title">{product.artisan.title}</span>
                            </div>
                            <div className="artisan-story">
                                {product.artisan.story.split('\n\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                            <Link to="#" className="view-collection-link">View Elena's Collection &gt;</Link>
                        </div>
                    </div>
                </section>

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
                                <span className="number">4.9</span>
                                <div className="stars-and-count">
                                    {renderStars(5)}
                                    <span className="count">Based on 28 reviews</span>
                                </div>
                            </div>
                            <button className="write-review-btn">Write a Review</button>
                        </div>

                        <div className="rating-bars">
                            {[
                                { stars: 5, pct: 90 },
                                { stars: 4, pct: 10 },
                                { stars: 3, pct: 0 },
                                { stars: 2, pct: 0 },
                                { stars: 1, pct: 0 },
                            ].map((bar) => (
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

                    <div className="reviews-list">
                        {reviews.map((review, index) => (
                            <div key={index} className="review-item">
                                <div className="review-header">
                                    {renderStars(review.rating)}
                                    <span className="review-date">{review.date}</span>
                                </div>
                                <h4 className="review-title">{review.title}</h4>
                                <div className="reviewer-info">
                                    <span className="reviewer-name">{review.user}</span>
                                    {review.verified && <span className="verified-buyer"><ShieldCheck size={12} className="verified-icon" /> Verified Buyer</span>}
                                </div>
                                <p className="review-text">{review.text}</p>
                                <div className="review-helpful">
                                    <span className="helpful-question">Was this helpful?</span>
                                    <button className="helpful-btn"><ThumbsUp size={14} /> {review.helpful}</button>
                                    <button className="helpful-btn"><ThumbsDown size={14} /> {review.notHelpful}</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="load-more-container">
                        <button className="load-more-btn">Load More Reviews</button>
                    </div>
                </section>

                {/* You May Also Like */}
                <section className="related-products-section">
                    <h3 className="related-heading">You May Also Like</h3>
                    <div className="related-grid">
                        {relatedProducts.map(item => (
                            <Link to={`/product/${item.id}`} key={item.id} className="related-card">
                                <div className="related-image-wrapper">
                                    <img src={item.image} alt={item.name} />
                                </div>
                                <div className="related-info">
                                    <h5 className="related-name">{item.name}</h5>
                                    <p className="related-price">₹{item.price.toFixed(2)}</p>
                                    <span className="view-product-link">View Product &gt;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default ProductPage;
