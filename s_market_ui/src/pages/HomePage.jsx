import React, { useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './HomePage.css';
import { ArrowRight, ChevronRight, ChevronLeft, Heart, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import unnamedMan from '../assets/unnamedman1.png';
import FarmhouseWovenBasket from '../assets/FarmhouseWovenBasket.png';
import WalnutEdgeBoard from '../assets/WalnutEdgeBoard.png';
import { useCart } from '../context/CartContext';
import { getAllProducts, BACKEND_URL } from '../api/api';
import homepageim1 from '../assets/homepgI1.png'
import healthhouseholdcat from '../assets/Natural_Cleaning_Products.png'
import toygamecat from '../assets/Fabric_Dolls _ Plushies.png'
import gardencat from '../assets/Handmade_Planters.png'
import homepgI2 from '../assets/homepgI2.png'
import homepgI3 from '../assets/Traditional_Potli_Gift.png'
import handcraftcarousel from '../assets/WalnutEdgeBoard.png'
import unnatiSilksSaree from '../assets/unnatisilks-saree-734930_1280.jpg'
import unnatiSilksSaree2 from '../assets/unnatisilks-saree-734931_1280.jpg'
import kanjivaramSaree from '../assets/kanjivaramsaree1.jpeg'
import kanjivaramSaree2 from '../assets/kanjivaramsaree2.jpeg'
import kanjivaramSaree3 from '../assets/kanjivaram3.jpeg'
import logo from '../assets/smarketlogo.svg';

const HomePage = () => {
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const { cartItems, addToCart, removeFromCart } = useCart();
    const [trendingProducts, setTrendingProducts] = React.useState([]);
    const [featuredProducts, setFeaturedProducts] = React.useState([]);

    React.useEffect(() => {
        const fetchHomePageProducts = async () => {
            try {
                const data = await getAllProducts();
                setTrendingProducts(data.slice(0, 4));
                setFeaturedProducts(data.length > 4 ? data.slice(4, 8) : data.slice(0, 4));
            } catch (error) {
                console.error("Failed to load products for home page:", error);
            }
        };
        fetchHomePageProducts();
    }, []);

    const handleHeartClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const isInCart = cartItems.some(item => item.id === product.id);
        if (isInCart) {
            removeFromCart(product.id, product.variant);
        } else {
            addToCart({
                ...product,
                price: product.price || product.discountPrice || product.regularPrice || 0
            }, 1, product.variant);
        }
    };

    const isProductInCart = (id) => cartItems.some(item => item.id === id);

    return (
        <div className="home-page">
            <Navbar />

            {/* Hero Grid Section */}
            <section className="hero-grid-section">
                <div className="hero-main-banner" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${homepageim1})` }}>
                    <div className="hero-main-content">
                        <h2>online experiences for indian handmade goods</h2>
                        <Link to="/shop" className="btn-hero-explore">EXPLORE</Link>
                    </div>
                </div>
                <div className="hero-side-banners">
                    <div className="hero-side-banner" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${homepgI3})` }}>
                        <div className="hero-side-content">
                            <h3>Timeless Traditions</h3>
                            <Link to="/shop" className="btn-hero-link">Shop now <ArrowRight size={14} /></Link>
                        </div>
                    </div>
                    <div className="hero-side-banner" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600")' }}>
                        <div className="hero-side-content">
                            <h3>Premium Quality</h3>
                            <Link to="/shop" className="btn-hero-link">Shop now <ArrowRight size={14} /></Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="featured-categories-section">
                <div className="section-header-row">
                    <h2 className="section-heading">FEATURED CATEGORIES</h2>
                    <Link to="/shop" className="view-all-link">
                        See All <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="categories-grid-strip">
                    <Link to="/shop?category=grocery" className="strip-cat-item">
                        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200" alt="Grocery" />
                        <span>Grocery & Gourmet Food</span>
                    </Link>
                    <Link to="/shop?category=health" className="strip-cat-item">
                        <img src={healthhouseholdcat} alt="Health" />
                        <span>Health & Household</span>
                    </Link>
                    <Link to="/shop?category=home" className="strip-cat-item">
                        <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=200" alt="Home" />
                        <span>Home & Kitchen</span>
                    </Link>
                    <Link to="/shop?category=beauty" className="strip-cat-item">
                        <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=200" alt="Beauty" />
                        <span>Beauty & Personal Care</span>
                    </Link>
                    <Link to="/shop?category=clothing" className="strip-cat-item">
                        <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200" alt="Clothing" />
                        <span>Clothing, Shoes & Jewellery</span>
                    </Link>
                    <Link to="/shop?category=toys" className="strip-cat-item">
                        <img src={toygamecat} alt="Toys" />
                        <span>Toys & Games</span>
                    </Link>
                    <Link to="/shop?category=patio" className="strip-cat-item">
                        <img src={gardencat} alt="Patio" />
                        <span>Patio, Lawn & Garden</span>
                    </Link>
                    <Link to="/shop?category=musical" className="strip-cat-item">
                        <img src="https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=200" alt="Musical" />
                        <span>Musical Instruments</span>
                    </Link>
                </div>
            </section>

            {/* Trust Banners */}
            <div className="trust-banners-fullwidth">
                <div className="trust-banners-container">
                    <div className="trust-item">
                        <div className="trust-text">
                            <h4>Easy Payment Options</h4>
                            <p>100% Protected</p>
                        </div>
                        <div className="trust-icon-img">
                            <img src="https://cdn-icons-png.flaticon.com/512/4108/4108047.png" alt="Payment" />
                        </div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-text">
                            <h4>Easy Returns</h4>
                            <p>7 Day Return Policy</p>
                        </div>
                        <div className="trust-icon-img">
                            <img src="https://cdn-icons-png.flaticon.com/512/8144/8144422.png" alt="Returns" />
                        </div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-text">
                            <h4>Verified Artisans</h4>
                            <p>Certified & Authenticated</p>
                        </div>
                        <div className="trust-icon-img">
                            <img src="https://cdn-icons-png.flaticon.com/512/3273/3273117.png" alt="Verified" />
                        </div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-text">
                            <h4>Genuine Products</h4>
                            <p>Directly Sourced</p>
                        </div>
                        <div className="trust-icon-img">
                            <img src="https://cdn-icons-png.flaticon.com/512/8701/8701658.png" alt="Handmade" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Deals Section */}
            <section className="deals-trending-section">
                <div className="section-header-row">
                    <h2 className="section-heading">TOP DEALS</h2>
                    <Link to="/shop" className="view-all-link">
                        View All <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="top-deals-grid">
                    {/* Left Side Deal Card (New Design) */}
                    <div className="figma-product-card" onClick={() => setSelectedProduct({
                        id: 'td2', name: 'Kanjivaram Silk Saree', price: 2110, reviews: 256, category: 'Clothing',
                        image: kanjivaramSaree,
                        details: { material: 'Handwoven' }
                    })}>
                        <div className="figma-img-wrapper">
                            <span className="discount-badge">-50%</span>
                            <button className="heart-btn heart-top-right">
                                <Heart size={18} color="white" />
                            </button>
                            <img src={kanjivaramSaree} alt="Kanjivaram Silk Saree" />
                            <div className="inner-rating-badge">4.5 <span style={{ color: '#FFB800' }}>★</span> (256)</div>
                        </div>
                        <div className="figma-info-wrapper">
                            <h3 className="figma-product-title">Kanjivaram Silk Saree</h3>
                            <p className="figma-product-subtitle">Handwoven</p>
                        </div>
                    </div>

                    {/* Center Hero Deal Card */}
                    <div className="top-deal-hero-card" onClick={() => setSelectedProduct({
                        id: 'td1',
                        name: 'Royal Bloom Pure Silk Saree',
                        price: 0,
                        reviews: 256,
                        rating: 4.5,
                        category: 'Clothing',
                        image: kanjivaramSaree,
                        details: { material: 'Pure Silk', origin: 'Kanchipuram, India' }
                    })}>
                        <div className="deal-image-wrapper">
                            <span className="discount-badge">-50%</span>
                            <button className="heart-btn heart-top-right">
                                <Heart size={18} color="white" />
                            </button>
                            <img src={kanjivaramSaree} alt="Royal Bloom Pure Silk Saree" />
                            <div className="inner-rating-badge">4.5 <span style={{ color: '#FFB800' }}>★</span> (256)</div>
                        </div>
                        <div className="deal-text-content">
                            <h3 className="deal-title">Royal Bloom Pure Silk Saree</h3>
                            <p className="deal-desc">An elegant rose gold pure silk saree crafted with fine zari detailing and a luxurious finish. Perfect for weddings, festive occasions, and special celebrations.</p>
                            <span className="deal-shop-link">Shop Now</span>
                        </div>
                    </div>

                    {/* Right Side Deal Card (New Design) */}
                    <div className="figma-product-card" onClick={() => setSelectedProduct({
                        id: 'td3', name: 'Kanjivaram Silk Saree', price: 2110, reviews: 256, category: 'Clothing',
                        image: kanjivaramSaree3,
                        details: { material: 'Handwoven' }
                    })}>
                        <div className="figma-img-wrapper">
                            <span className="discount-badge">-50%</span>
                            <button className="heart-btn heart-top-right">
                                <Heart size={18} color="white" />
                            </button>
                            <img src={kanjivaramSaree3} alt="Kanjivaram Silk Saree" />
                            <div className="inner-rating-badge">4.5 <span style={{ color: '#FFB800' }}>★</span> (256)</div>
                        </div>
                        <div className="figma-info-wrapper">
                            <h3 className="figma-product-title">Kanjivaram Silk Saree</h3>
                            <p className="figma-product-subtitle">Handwoven</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Authentic Handmade Promo Banner */}
            <div className="promo-banner-fullwidth">
                <div className="promo-banner-container">
                    <div className="promo-banner-content">
                        <h2 className="promo-banner-title">Authentic Indian Handmade Products, Delivered to Your Door</h2>
                        <p className="promo-banner-desc">Supporting local artisans with quality products at retail and wholesale prices across India.</p>
                    </div>
                    <div className="promo-banner-image">
                        <img src="/assets/promo_banner_craft.png" alt="Indian Handmade Crafts" />
                    </div>
                </div>
            </div>

            {/* Trending Products */}
            <section className="trending-featured-section">
                <div className="section-header-row">
                    <h2 className="section-heading">TRENDING PRODUCTS</h2>
                    <Link to="/shop" className="view-all-link">
                        View All <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="four-col-products-grid">
                    {trendingProducts.length > 0 ? (
                        trendingProducts.map((product) => {
                            const productImageUrl = product.media && product.media.length > 0
                                ? `${BACKEND_URL}/uploads/products/${product.media[0].fileName}`
                                : 'https://placehold.co/800x800?text=No+Image';

                            const displayPrice = product.discountPrice ? product.discountPrice : (product.regularPrice || 0);

                            return (
                                <div key={`trend-${product.id}`} className="figma-product-card" onClick={() => setSelectedProduct({
                                    ...product,
                                    image: productImageUrl,
                                    price: product.discountPrice || product.regularPrice || 0,
                                    details: product.details || { material: 'Handwoven' }
                                })}>
                                    <div className="figma-img-wrapper">
                                        {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
                                            <span className="discount-badge">
                                                -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                                            </span>
                                        )}
                                        <button
                                            className="heart-btn heart-top-right"
                                            onClick={(e) => handleHeartClick(e, product)}
                                        >
                                            <Heart
                                                size={18}
                                                color={isProductInCart(product.id) ? "red" : "white"}
                                                fill={isProductInCart(product.id) ? "red" : "none"}
                                            />
                                        </button>
                                        <img src={productImageUrl} alt={product.name} style={{ objectFit: 'contain', backgroundColor: 'white' }} />
                                        <div className="inner-rating-badge">4.5 <span style={{ color: '#FFB800' }}>★</span> (256)</div>
                                    </div>
                                    <div className="figma-info-wrapper">
                                        <h3 className="figma-product-title">{product.name}</h3>
                                        <p className="figma-product-subtitle">{product.vendor?.storeName || 'SreeMarket Vendor'}</p>
                                        <div className="figma-price-row">
                                            <span className="price-new">₹{parseFloat(displayPrice).toFixed(2)}</span>
                                            {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
                                                <span className="price-old">₹{parseFloat(product.regularPrice).toFixed(2)}</span>
                                            )}
                                            <span className="color-count">1 Color</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>Loading trending products...</p>
                    )}
                </div>
            </section>

            {/* Hand Crafted With Tradition */}
            <section className="handcrafted-section">
                <div className="handcrafted-header">
                    <h2 className="section-heading">HAND CRAFTED WITH TRADITION</h2>
                    <span className="handcrafted-badge">UP TO 60% OFF</span>
                </div>
                <div className="handcrafted-content">
                    <div className="handcrafted-banner">
                        <img src={handcraftcarousel} alt="Handcrafted Tradition" />
                        <div className="handcrafted-overlay">
                            <p className="handcrafted-overlay-text">
                                WOVEN IN <strong>TRADITION</strong> AND ROOTED IN TIMELESS <strong>CRAFT</strong>
                            </p>
                            <Link to="/shop" className="handcrafted-view-all">View All</Link>
                        </div>
                    </div>
                    <div className="handcrafted-categories">
                        <div className="handcrafted-cat-tab" onClick={() => { }}>
                            <span className="handcrafted-cat-icon">🏺</span>
                            <span className="handcrafted-cat-label">HANDMADE POTTERY</span>
                        </div>
                        <div className="handcrafted-cat-tab" onClick={() => { }}>
                            <span className="handcrafted-cat-icon">🎨</span>
                            <span className="handcrafted-cat-label">ART & CRAFT PIECES</span>
                        </div>
                        <div className="handcrafted-cat-tab" onClick={() => { }}>
                            <span className="handcrafted-cat-icon">🧴</span>
                            <span className="handcrafted-cat-label">AYURVEDIC HANDMADE SOAPS</span>
                        </div>
                        <div className="handcrafted-cat-tab" onClick={() => { }}>
                            <span className="handcrafted-cat-icon">🔔</span>
                            <span className="handcrafted-cat-label">BRASS & WOODEN CRAFTS</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="trending-featured-section">
                <div className="section-header-row">
                    <h2 className="section-heading">FEATURED PRODUCTS</h2>
                    <Link to="/shop" className="view-all-link">
                        View All <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="four-col-products-grid">
                    {featuredProducts.length > 0 ? (
                        featuredProducts.map((product) => {
                            const productImageUrl = product.media && product.media.length > 0
                                ? `${BACKEND_URL}/uploads/products/${product.media[0].fileName}`
                                : 'https://placehold.co/800x800?text=No+Image';

                            const displayPrice = product.discountPrice ? product.discountPrice : (product.regularPrice || 0);

                            return (
                                <div key={`feat-${product.id}`} className="figma-product-card" onClick={() => setSelectedProduct({
                                    ...product,
                                    image: productImageUrl,
                                    price: product.discountPrice || product.regularPrice || 0,
                                    details: product.details || { material: 'Handwoven' }
                                })}>
                                    <div className="figma-img-wrapper">
                                        {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
                                            <span className="discount-badge">
                                                -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                                            </span>
                                        )}
                                        <button
                                            className="heart-btn heart-top-right"
                                            onClick={(e) => handleHeartClick(e, product)}
                                        >
                                            <Heart
                                                size={18}
                                                color={isProductInCart(product.id) ? "red" : "white"}
                                                fill={isProductInCart(product.id) ? "red" : "none"}
                                            />
                                        </button>
                                        <img src={productImageUrl} alt={product.name} style={{ objectFit: 'contain', backgroundColor: 'white' }} />
                                        <div className="inner-rating-badge">4.5 <span style={{ color: '#FFB800' }}>★</span> (256)</div>
                                    </div>
                                    <div className="figma-info-wrapper">
                                        <h3 className="figma-product-title">{product.name}</h3>
                                        <p className="figma-product-subtitle">{product.vendor?.storeName || 'SreeMarket Vendor'}</p>
                                        <div className="figma-price-row">
                                            <span className="price-new">₹{parseFloat(displayPrice).toFixed(2)}</span>
                                            {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
                                                <span className="price-old">₹{parseFloat(product.regularPrice).toFixed(2)}</span>
                                            )}
                                            <span className="color-count">1 Color</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>Loading featured products...</p>
                    )}
                </div>
            </section>

            {/* Values/Mission Section */}
            <section className="values-mission-section">
                <div className="vm-content">
                    <div className="vm-logo">
                        <img
                            src={logo}
                            alt="SreeMarket"
                            className="vm-logo-image"
                            style={{ height: '60px', width: 'auto', marginBottom: '15px' }}
                        />
                    </div>
                    <h2 className="vm-title">We believe a home should <br />reflect your values.</h2>
                    <p className="vm-desc">
                        Founded on the belief that luxury and social responsibility are not mutually exclusive, SreeMarket works directly with over 45 artisan co-ops across 12 countries. Every item in our collection is a testament to human skill and a step toward economic equality.
                    </p>
                    <div className="vm-stats-row">
                        <div className="vm-stat">
                            <span className="vm-stat-number">45+</span>
                            <span className="vm-stat-label">PARTNER CO-OPS</span>
                        </div>
                        <div className="vm-stat">
                            <span className="vm-stat-number">2.4M</span>
                            <span className="vm-stat-label">DIRECT ARTISAN INCOME</span>
                        </div>
                    </div>
                </div>
                <div className="vm-image">
                    <img src={homepgI2} alt="Weaver artisan" />
                </div>
            </section>

            <Footer />

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
};

export default HomePage;
