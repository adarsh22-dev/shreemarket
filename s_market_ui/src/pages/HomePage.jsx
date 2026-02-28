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

const HomePage = () => {
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const { cartItems, addToCart, removeFromCart } = useCart();

    const handleHeartClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const isInCart = cartItems.some(item => item.id === product.id);
        if (isInCart) {
            removeFromCart(product.id, product.variant);
        } else {
            addToCart(product, 1, product.variant);
        }
    };

    const isProductInCart = (id) => cartItems.some(item => item.id === id);

    return (
        <div className="home-page">
            <Navbar />

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <span className="hero-tag">CURATED COLLECTION</span>
                    <h1 className="hero-title">The Art of the<br /> Handmade</h1>
                    <p className="hero-subtitle">
                        Discover unique pieces for the home, perfectly<br />
                        uneven and rich with patina. Every item tells a story of<br />
                        tradition and slow craft.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/shop" className="btn-primary">Shop the collection</Link>
                    </div>
                </div>
            </header>

            {/* Shop by Category */}
            <section className="category-section">
                <div className="home-section-header">
                    <div>
                        <h2 className="section-title">
                            <span className="title-highlight">Shop by Category</span>
                        </h2>
                    </div>
                    {/* <Link to="/shop" className="view-all-link">
                        View all categories <ArrowRight size={16} />
                    </Link> */}
                </div>

                <div className="categories-circular-grid">
                    <Link to="/shop?category=Ceramic" className="category-circle-item">
                        <div className="category-circle-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=400&auto=format&fit=crop" alt="Ceramic" />
                        </div>
                        <span className="category-circle-name">Ceramic</span>
                    </Link>
                    <Link to="/shop?category=Textiles" className="category-circle-item">
                        <div className="category-circle-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=400&auto=format&fit=crop" alt="Textiles" />
                        </div>
                        <span className="category-circle-name">Textiles</span>
                    </Link>
                    <Link to="/shop?category=Woodwork" className="category-circle-item">
                        <div className="category-circle-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=400&auto=format&fit=crop" alt="Woodwork" />
                        </div>
                        <span className="category-circle-name">Woodwork</span>
                    </Link>
                    <Link to="/shop?category=Jewelry" className="category-circle-item">
                        <div className="category-circle-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=400&auto=format&fit=crop" alt="Jewelry" />
                        </div>
                        <span className="category-circle-name">Jewelry</span>
                    </Link>
                    <Link to="/shop?category=Kitchenware" className="category-circle-item">
                        <div className="category-circle-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=400&auto=format&fit=crop" alt="Kitchenware" />
                        </div>
                        <span className="category-circle-name">Kitchenware</span>
                    </Link>
                    <Link to="/shop?category=Glassware" className="category-circle-item">
                        <div className="category-circle-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=400&auto=format&fit=crop" alt="Glassware" />
                        </div>
                        <span className="category-circle-name">Glassware</span>
                    </Link>
                </div>
            </section>

            {/* Featured Items */}
            <section className="featured-section" style={{ marginBottom: '4rem' }}>
                <div className="home-section-header">
                    <div>
                        <h2 className="section-title">
                            <span className="title-highlight">New</span>Arrivals
                        </h2>

                    </div>
                    <Link to="/shop" className="view-all-link">
                        View all products <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="products-grid">
                    {/* Product 1 */}
                    <div className="product-card" onClick={() => setSelectedProduct({
                        id: 'hp1',
                        name: 'Speckled Ceramic Bowl',
                        price: 48.00,
                        reviews: 48,
                        category: 'CERAMIC',
                        image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop',
                        details: {
                            material: 'Stoneware Clay',
                            dimensions: '6" diameter',
                            origin: 'Handmade in Kyoto',
                            care: 'Dishwasher Safe'
                        }
                    })}>
                        <div className="product-image-wrapper">
                            <button className="heart-btn" onClick={(e) => handleHeartClick(e, {
                                id: 'hp1', name: 'Speckled Ceramic Bowl', price: 48.00, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop'
                            })}>
                                <Heart size={16} fill={isProductInCart('hp1') ? "#FF0000" : "#ccc"} color={isProductInCart('hp1') ? "#FF0000" : "#ccc"} />
                            </button>
                            <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop" alt="Speckled Ceramic Bowl" />
                        </div>
                        <div className="product-info-featured">
                            <h3 className="product-name">Speckled Ceramic Bowl</h3>
                            <p className="product-author">By Olivia Moss</p>
                            <span className="product-price">₹48.00</span>
                        </div>
                    </div>

                    {/* Product 2 */}
                    <div className="product-card" onClick={() => setSelectedProduct({
                        id: 'hp2',
                        name: 'Woven Storage Basket',
                        price: 120.00,
                        reviews: 24,
                        category: 'DECOR',
                        image: `${FarmhouseWovenBasket}`,
                        details: {
                            material: 'Seagrass',
                            dimensions: '14" x 14"',
                            origin: 'Ghana',
                            care: 'Wipe with dry cloth'
                        }
                    })}>
                        <div className="product-image-wrapper">
                            <button className="heart-btn" onClick={(e) => handleHeartClick(e, {
                                id: 'hp2', name: 'Woven Storage Basket', price: 120.00, image: FarmhouseWovenBasket
                            })}>
                                <Heart size={16} fill={isProductInCart('hp2') ? "#FF0000" : "#ccc"} color={isProductInCart('hp2') ? "#FF0000" : "#ccc"} />
                            </button>
                            <img src={FarmhouseWovenBasket} alt="Woven Storage Basket" />
                        </div>
                        <div className="product-info-featured">
                            <h3 className="product-name">Woven Storage Basket</h3>
                            <p className="product-author">By Aria Weaver</p>
                            <span className="product-price">₹120.00</span>
                        </div>
                    </div>

                    {/* Product 3 */}
                    <div className="product-card" onClick={() => setSelectedProduct({
                        id: 'hp3',
                        name: 'Walnut Edge Board',
                        price: 85.00,
                        reviews: 15,
                        category: 'WOODWORK',
                        image: `${WalnutEdgeBoard}`,
                        details: {
                            material: 'Solid Walnut Wood',
                            dimensions: '18" x 8" x 1"',
                            origin: 'Portland, OR',
                            care: 'Hand wash, oil regularly'
                        }
                    })}>
                        <div className="product-image-wrapper">
                            <button className="heart-btn" onClick={(e) => handleHeartClick(e, {
                                id: 'hp3', name: 'Walnut Edge Board', price: 85.00, image: WalnutEdgeBoard
                            })}>
                                <Heart size={16} fill={isProductInCart('hp3') ? "#FF0000" : "#ccc"} color={isProductInCart('hp3') ? "#FF0000" : "#ccc"} />
                            </button>
                            <img src={WalnutEdgeBoard} alt="Walnut Edge Board" />
                        </div>
                        <div className="product-info-featured">
                            <h3 className="product-name">Walnut Edge Board</h3>
                            <p className="product-author">By Timber & Trade</p>
                            <span className="product-price">₹85.00</span>
                        </div>
                    </div>

                    {/* Product 4 */}
                    <div className="product-card" onClick={() => setSelectedProduct({
                        id: 'hp4',
                        name: 'Azure Morning Mug',
                        price: 32.00,
                        reviews: 32,
                        category: 'CERAMIC',
                        image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
                        details: {
                            material: 'Glazed Ceramic',
                            dimensions: '12 oz',
                            origin: 'Cornwall, UK',
                            care: 'Microwave Safe'
                        }
                    })}>
                        <div className="product-image-wrapper">
                            <button className="heart-btn" onClick={(e) => handleHeartClick(e, {
                                id: 'hp4', name: 'Azure Morning Mug', price: 32.00, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop'
                            })}>
                                <Heart size={16} fill={isProductInCart('hp4') ? "#FF0000" : "#ccc"} color={isProductInCart('hp4') ? "#FF0000" : "#ccc"} />
                            </button>
                            <img src="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop" alt="Azure Morning Mug" />
                        </div>
                        <div className="product-info-featured">
                            <h3 className="product-name">Azure Morning Mug</h3>
                            <p className="product-author">By Clay Collective</p>
                            <span className="product-price">₹32.00</span>
                        </div>
                    </div>
                    {/* Product 5 */}
                    <div className="product-card" onClick={() => setSelectedProduct({
                        id: 'hp5',
                        name: 'Linen Throw Pillow',
                        price: 55.00,
                        reviews: 18,
                        category: 'TEXTILES',
                        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
                        details: {
                            material: '100% Belgian Linen',
                            dimensions: '20" x 20"',
                            origin: 'Hand Sewn in LA',
                            care: 'Machine Wash Cold'
                        }
                    })}>
                        <div className="product-image-wrapper">
                            <button className="heart-btn" onClick={(e) => handleHeartClick(e, {
                                id: 'hp5', name: 'Linen Throw Pillow', price: 55.00, image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop'
                            })}>
                                <Heart size={16} fill={isProductInCart('hp5') ? "#FF0000" : "#ccc"} color={isProductInCart('hp5') ? "#FF0000" : "#ccc"} />
                            </button>
                            <img src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop" alt="Linen Throw Pillow" />
                        </div>
                        <div className="product-info-featured">
                            <h3 className="product-name">Linen Throw Pillow</h3>
                            <p className="product-author">By Thread & Loom</p>
                            <span className="product-price">₹55.00</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meet the Makers Section */}
            <section className="makers-section">
                <div className="makers-image">
                    <img src={unnamedMan} alt="Artisan working" />
                </div>
                <div className="makers-content">
                    <span className="makers-label">MEET THE MAKERS</span>
                    <h2 className="makers-title">
                        "The slow craft movement isn't just about making objects; it's about preserving human connection through every brushstroke and chisel mark."
                    </h2>
                    <p className="makers-desc">
                        Join us as we explore the stories of over 600 independent artists who are redefining luxury through intentionality and tradition.
                    </p>
                    <Link to="/our-story" className="btn-dark">Read Our Story</Link>
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
