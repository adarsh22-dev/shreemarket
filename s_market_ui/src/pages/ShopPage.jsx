import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    Check,
    ShoppingBag,
    Heart,
    Home,
    Sparkles,
    Shirt,
    Puzzle,
    Flower2,
    Music,
    Search,
} from 'lucide-react';
import './ShopPage.css';
import { getAllProducts, BACKEND_URL } from '../api/api';

const PRODUCTS_PER_PAGE = 9;

const ShopPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const initialCategory = queryParams.get('category') || 'All';

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [viewMode, setViewMode] = useState('grid');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('featured');
    const [currentPage, setCurrentPage] = useState(1);

    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sync category from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cat = params.get('category');
        if (cat) {
            setSelectedCategory(cat);
        } else {
            setSelectedCategory('All');
        }
    }, [location.search]);

    // Fetch products on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProducts = async () => {
            try {
                const data = await getAllProducts();
                setAllProducts(data);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleCategoryClick = (categoryName) => {
        setSelectedCategory(categoryName);
        setCurrentPage(1);
        if (categoryName === 'All') {
            navigate('/shop');
        } else {
            navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
        }
    };

    const categories = [
        { name: 'All Categories', value: 'All', icon: LayoutGrid },
        { name: 'Grocery & Gourmet Food', value: 'grocery', icon: ShoppingBag },
        { name: 'Health & Household', value: 'health', icon: Heart },
        { name: 'Home & Kitchen', value: 'home', icon: Home },
        { name: 'Beauty & Personal Care', value: 'beauty', icon: Sparkles },
        { name: 'Clothing, Shoes & Jewellery', value: 'clothing', icon: Shirt },
        { name: 'Toys & Games', value: 'toys', icon: Puzzle },
        { name: 'Patio, Lawn & Garden', value: 'patio', icon: Flower2 },
        { name: 'Musical Instruments', value: 'musical', icon: Music },
    ];

    // ── Derived: filter → sort → paginate ──
    const processedProducts = useMemo(() => {
        let result = [...allProducts];

        // 1. Category filter
        if (selectedCategory !== 'All') {
            result = result.filter(p => p.category === selectedCategory);
        }

        // 2. Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.vendor?.storeName && p.vendor.storeName.toLowerCase().includes(q))
            );
        }

        // 3. Price filter
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        if (!isNaN(min)) {
            result = result.filter(p => (p.discountPrice || p.regularPrice || 0) >= min);
        }
        if (!isNaN(max)) {
            result = result.filter(p => (p.discountPrice || p.regularPrice || 0) <= max);
        }

        // 4. Sort
        switch (sortOption) {
            case 'newest':
                result.sort((a, b) => (b.id || 0) - (a.id || 0));
                break;
            case 'price-low':
                result.sort((a, b) => (a.discountPrice || a.regularPrice || 0) - (b.discountPrice || b.regularPrice || 0));
                break;
            case 'price-high':
                result.sort((a, b) => (b.discountPrice || b.regularPrice || 0) - (a.discountPrice || a.regularPrice || 0));
                break;
            default: // featured — keep original order
                break;
        }

        return result;
    }, [allProducts, selectedCategory, searchQuery, minPrice, maxPrice, sortOption]);

    // Pagination math
    const totalPages = Math.ceil(processedProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = processedProducts.slice(
        (currentPage - 1) * PRODUCTS_PER_PAGE,
        currentPage * PRODUCTS_PER_PAGE
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery, minPrice, maxPrice, sortOption]);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
    };

    const handleClearAll = () => {
        setMinPrice('');
        setMaxPrice('');
        setSearchQuery('');
        setSortOption('featured');
        setSelectedCategory('All');
        setCurrentPage(1);
        navigate('/shop');
    };

    return (
        <div className="shop-page-wrapper">
            <Navbar />

            <main className="shop-page-main">
                {/* Header Area */}
                <header className="shop-header">
                    <div className="shop-breadcrumbs">
                        <Link to="/">Home</Link> <span className="separator">&gt;</span> <span className="current">Shop All</span>
                    </div>
                </header>

                <div className="shop-layout-grid">
                    {/* Sidebar / Filters */}
                    <aside className="shop-sidebar">
                        {/* Search */}
                        <div className="filter-section">
                            <h3 className="filter-title">SEARCH</h3>
                            <div className="search-input-container">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    className="shop-search-input"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="filter-section">
                            <h3 className="filter-title">CATEGORIES</h3>
                            <ul className="category-list">
                                {categories.map(cat => (
                                    <li key={cat.value} className={`category-item ${selectedCategory === cat.value ? 'active' : ''}`} onClick={() => handleCategoryClick(cat.value)} style={{ cursor: 'pointer' }}>
                                        <cat.icon size={18} />
                                        <span className="category-text">{cat.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Range */}
                        <div className="filter-section">
                            <h3 className="filter-title">PRICE RANGE</h3>
                            <div className="price-inputs-row">
                                <input
                                    type="number"
                                    className="price-input"
                                    placeholder="Min ₹"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    min="0"
                                />
                                <span className="price-separator">—</span>
                                <input
                                    type="number"
                                    className="price-input"
                                    placeholder="Max ₹"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="filter-actions">
                            <button className="btn-apply-filters" onClick={handleApplyFilters}>Apply Filters</button>
                            <button className="btn-clear-all" onClick={handleClearAll}>Clear All</button>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="shop-content">
                        {/* Top Bar */}
                        <div className="shop-top-bar">
                            <div className="product-count">
                                Showing <strong>{paginatedProducts.length}</strong> of <strong>{processedProducts.length}</strong> products
                            </div>
                            <div className="top-bar-controls">
                                <div className="sort-dropdown-container">
                                    <select
                                        className="sort-dropdown"
                                        value={sortOption}
                                        onChange={(e) => setSortOption(e.target.value)}
                                    >
                                        <option value="featured">Featured</option>
                                        <option value="newest">Newest Arrivals</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                    <ChevronDown size={14} className="dropdown-icon" />
                                </div>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className={`shop-products ${viewMode}`}>
                            {loading ? (
                                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>Loading products...</p>
                            ) : paginatedProducts.length > 0 ? (
                                paginatedProducts.map(product => {
                                    const productImageUrl = product.media && product.media.length > 0
                                        ? `${BACKEND_URL}/uploads/products/${product.media[0].fileName}`
                                        : 'https://placehold.co/800x800?text=No+Image';

                                    const displayPrice = product.discountPrice ? product.discountPrice : (product.regularPrice || 0);

                                    return (
                                        <Link to={`/product/${product.id}`} key={product.id} className="shop-product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="sp-image-container">
                                                <img src={productImageUrl} alt={product.name} className="sp-image" style={{ objectFit: 'contain', backgroundColor: 'white' }} />
                                                <div className="inner-rating-badge">{(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})</div>
                                            </div>
                                            <div className="sp-info">
                                                <h4 className="sp-name">{product.name}</h4>
                                                <p className="sp-author">by {product.vendor?.storeName || 'SreeMarket Vendor'}</p>
                                                <div className="sp-price-row">
                                                    {product.discountPrice ? (
                                                        <>
                                                            <p className="sp-price">₹{parseFloat(product.discountPrice).toFixed(2)}</p>
                                                            <p className="sp-original-price">₹{parseFloat(product.regularPrice).toFixed(2)}</p>
                                                        </>
                                                    ) : (
                                                        <p className="sp-price">₹{parseFloat(displayPrice).toFixed(2)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>No products found matching your criteria.</p>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="shop-pagination-wrapper">
                                <div className="shop-pagination">
                                    <button
                                        className="page-btn nav-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {getPageNumbers().map((page, index) =>
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>
                                        ) : (
                                            <button
                                                key={page}
                                                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}
                                    <button
                                        className="page-btn nav-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ShopPage;
