import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    Coffee, // Ceramic
    Scissors, // Textiles
    Origami, // Woodwork
    Gem, // Jewelry
    Utensils, // Kitchenware
    Droplet, // Glassware
    Check,
} from 'lucide-react';
import './ShopPage.css';

const ShopPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const initialCategory = queryParams.get('category') || 'All';

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [viewMode, setViewMode] = useState('grid');
    const [priceRange, setPriceRange] = useState([10, 500]);
    const [selectedMaterials, setSelectedMaterials] = useState(['Reclaimed Oak']);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cat = params.get('category');
        if (cat) {
            setSelectedCategory(cat);
        } else {
            setSelectedCategory('All');
        }
    }, [location.search]);

    const handleCategoryClick = (categoryName) => {
        setSelectedCategory(categoryName);
        if (categoryName === 'All') {
            navigate('/shop');
        } else {
            navigate(`/shop?category=${categoryName}`);
        }
    };

    const toggleMaterial = (material) => {
        setSelectedMaterials(prev =>
            prev.includes(material)
                ? prev.filter(m => m !== material)
                : [...prev, material]
        );
    };

    const categories = [
        { name: 'All', icon: Coffee },
        { name: 'Ceramic', icon: Coffee },
        { name: 'Textiles', icon: Scissors },
        { name: 'Woodwork', icon: Origami },
        { name: 'Jewelry', icon: Gem },
        { name: 'Kitchenware', icon: Utensils },
        { name: 'Glassware', icon: Droplet },
    ];

    const materials = [
        'Organic Clay',
        'Reclaimed Oak',
        'Recycled Glass',
        'Linen & Cotton'
    ];

    const products = [
        { id: 1, name: 'Zen Minimalist Vase', author: 'Elena Rosso', price: 85.00, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop', tag: 'STAFF PICK', tagColor: '#FF5722', category: 'Ceramic' },
        { id: 2, name: 'Live Edge Oak Board', author: 'Marcus Thorne', price: 120.00, image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=800&auto=format&fit=crop', tag: '', category: 'Woodwork' },
        { id: 3, name: 'Hammered Silver Drops', author: 'Sia Kamara', price: 64.00, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop', tag: '', category: 'Jewelry' },
        { id: 4, name: 'Indigo Loomed Runner', author: "The Weaver's Guild", price: 45.00, image: 'https://images.unsplash.com/photo-1606744887373-30b1bc6b2c28?q=80&w=800&auto=format&fit=crop', tag: 'ECO-FRIENDLY', tagColor: '#4CAF50', category: 'Textiles' },
        { id: 5, name: 'Amber Glass Set', author: 'Classic Studio', price: 78.00, image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=800&auto=format&fit=crop', tag: '', category: 'Glassware' },
        { id: 6, name: 'Rustic Tea Ritual Set', author: 'Hiroshi Tanaka', price: 115.00, image: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800&auto=format&fit=crop', tag: '', category: 'Kitchenware' },
        { id: 7, name: 'Ebonized Walnut Clock', author: 'Wood & Time', price: 195.00, image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=800&auto=format&fit=crop', tag: '', category: 'Woodwork' },
        { id: 8, name: 'Kintsugi Legacy Bowl', author: 'Yumi Sato', price: 140.00, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop', tag: '', category: 'Ceramic' },
        { id: 9, name: 'Merino Chunky Throw', author: 'Cozy Roots', price: 210.00, image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=800&auto=format&fit=crop', tag: '', category: 'Textiles' },
    ];

    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="shop-page-wrapper">
            <Navbar />

            <main className="shop-page-main">
                {/* Header Area */}
                <header className="shop-header">
                    <div className="shop-breadcrumbs">
                        <Link to="/">Home</Link> <span className="separator">&gt;</span> <span className="current">Shop All</span>
                    </div>
                    <h1 className="shop-title">Handcrafted Collection</h1>
                    <p className="shop-description">
                        Every piece tells a story. Explore unique creations made with heart and soul by<br />
                        master artisans across the globe.
                    </p>
                </header>

                <div className="shop-layout-grid">
                    {/* Sidebar / Filters */}
                    <aside className="shop-sidebar">
                        {/* Categories */}
                        <div className="filter-section">
                            <h3 className="filter-title">
                                CATEGORIES
                            </h3>
                            <ul className="category-list">
                                {categories.map(cat => (
                                    <li key={cat.name} className={`category-item ${selectedCategory === cat.name ? 'active' : ''}`} onClick={() => handleCategoryClick(cat.name)} style={{ cursor: 'pointer' }}>
                                        <span className="category-text">{cat.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Range */}
                        <div className="filter-section">
                            <h3 className="filter-title">PRICE RANGE</h3>
                            <div className="price-slider-container">
                                <div className="slider-track">
                                    <div className="slider-fill"></div>
                                    <div className="slider-handle left"></div>
                                    <div className="slider-handle right"></div>
                                </div>
                                <div className="price-labels">
                                    <span>₹10</span>
                                    <span>₹500+</span>
                                </div>
                            </div>
                        </div>

                        {/* Material */}
                        <div className="filter-section">
                            <h3 className="filter-title">MATERIAL</h3>
                            <div className="checkbox-list">
                                {materials.map(mat => {
                                    const isSelected = selectedMaterials.includes(mat);
                                    return (
                                        <div key={mat} className="checkbox-item" onClick={() => toggleMaterial(mat)}>
                                            <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                                {isSelected && <Check size={12} color="white" />}
                                            </div>
                                            <span className="checkbox-label">{mat}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="filter-section">
                            <h3 className="filter-title">RATING</h3>
                            <div className="rating-filter">
                                <div className="stars-row">
                                    <span className="star filled">★</span>
                                    <span className="star filled">★</span>
                                    <span className="star filled">★</span>
                                    <span className="star filled">★</span>
                                    <span className="star empty">★</span>
                                </div>
                                <span className="rating-text">& Up</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="filter-actions">
                            <button className="btn-apply-filters">Apply Filters</button>
                            <button className="btn-clear-all">Clear All</button>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="shop-content">
                        {/* Top Bar */}
                        <div className="shop-top-bar">
                            <div className="product-count">
                                Showing <strong>{filteredProducts.length}</strong> products
                            </div>
                            <div className="top-bar-controls">
                                <div className="sort-dropdown-container">
                                    <select className="sort-dropdown">
                                        <option>Featured</option>
                                        <option>Newest Arrivals</option>
                                        <option>Price: Low to High</option>
                                        <option>Price: High to Low</option>
                                    </select>
                                    <ChevronDown size={14} className="dropdown-icon" />
                                </div>

                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className={`shop-products ${viewMode}`}>
                            {filteredProducts.map(product => (
                                <Link to={`/product/${product.id}`} key={product.id} className="shop-product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="sp-image-container">
                                        <img src={product.image} alt={product.name} className="sp-image" />
                                        {product.tag && (
                                            <span className="sp-badge" style={{ backgroundColor: product.tagColor }}>
                                                {product.tag}
                                            </span>
                                        )}
                                    </div>
                                    <div className="sp-info">
                                        <h4 className="sp-name">{product.name}</h4>
                                        <p className="sp-author">by {product.author}</p>
                                        <p className="sp-price">₹{product.price.toFixed(2)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="shop-pagination-wrapper">
                            <div className="shop-pagination">
                                <button className="page-btn nav-btn"><ChevronLeft size={16} /></button>
                                <button className="page-btn active">1</button>
                                <button className="page-btn">2</button>
                                <button className="page-btn">3</button>
                                <span className="page-ellipsis">...</span>
                                <button className="page-btn">12</button>
                                <button className="page-btn nav-btn"><ChevronRight size={16} /></button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ShopPage;
