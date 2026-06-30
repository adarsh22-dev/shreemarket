import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    ShoppingBag,
    Search,
    SlidersHorizontal,
    X,
    Heart,
    Share2,
    GitCompare,
    Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useWishlist } from '../context/WishlistContext';
import './ShopPage.css';
import { getAllProducts, BACKEND_URL, getPrimaryGalleryImage, getGalleryImageUrl, PLACEHOLDER_IMG } from '../api/api';

const PRODUCTS_PER_PAGE = 9;

const ShopPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

    const queryParams = new URLSearchParams(location.search);
    const initialCategory = queryParams.get('category') || 'All';

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const displayPrice = product.discountPrice || product.regularPrice || 0;
        addToCart({
            id: product.id,
            name: product.name,
            price: displayPrice,
            image: getPrimaryGalleryImage(product) || PLACEHOLDER_IMG,
            quantity: 1
        });
        toast.success(`${product.name} added to cart!`);
    };

    const handleHeartClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            const productImageUrl = getPrimaryGalleryImage(product) || PLACEHOLDER_IMG;
            addToWishlist({
                ...product,
                image: productImageUrl,
                price: product.discountPrice || product.regularPrice || 0
            });
        }
    };

    const [shareProductId, setShareProductId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (shareProductId && !e.target.closest('.sp-share-wrapper')) {
                setShareProductId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [shareProductId]);

    const handleShareClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setShareProductId(shareProductId === product.id ? null : product.id);
    };

    const shareToWhatsApp = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        const text = `Check out ${product.name} on SreeMarket!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToFacebook = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToTwitter = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        const text = `Check out ${product.name} on SreeMarket!`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToLinkedIn = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const copyShareLink = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied to clipboard!');
        }).catch(() => {});
        setShareProductId(null);
    };

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [viewMode, setViewMode] = useState('grid');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('featured');
    const [currentPage, setCurrentPage] = useState(1);

    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dynamicCategories, setDynamicCategories] = useState([]);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

                // Build categories from products
                const catCount = {};
                (data || []).forEach(p => {
                    if (p.category) {
                        catCount[p.category] = (catCount[p.category] || 0) + 1;
                    }
                });
                const cats = Object.entries(catCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => ({ name, count }));
                setDynamicCategories(cats);
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

    const categories = useMemo(() => {
        return [
            { name: 'All Categories', value: 'All', icon: LayoutGrid, count: allProducts.length },
            ...dynamicCategories.map(cat => ({
                name: cat.name,
                value: cat.name,
                icon: ShoppingBag,
                count: cat.count,
            })),
        ];
    }, [dynamicCategories, allProducts.length]);

    // ── Derived: filter → sort → paginate ──
    const processedProducts = useMemo(() => {
        let result = [...allProducts];

        // 1. Category filter
        if (selectedCategory !== 'All') {
            result = result.filter(p =>
                p.category === selectedCategory ||
                p.category?.toLowerCase() === selectedCategory.toLowerCase()
            );
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
                    {/* Mobile Filter Toggle */}
                    <button
                        className="shop-mobile-filter-toggle"
                        onClick={() => setMobileFiltersOpen(true)}
                    >
                        <SlidersHorizontal size={18} /> Filters
                    </button>

                    {/* Sidebar / Filters */}
                    <aside className={`shop-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
                        {/* Mobile close button */}
                        {mobileFiltersOpen && (
                            <button
                                className="shop-mobile-filter-toggle"
                                onClick={() => setMobileFiltersOpen(false)}
                                style={{ marginBottom: '1rem' }}
                            >
                                <X size={18} /> Close Filters
                            </button>
                        )}
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
                                        <span className="category-count">({cat.count})</span>
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
                                    const productImageUrl = getPrimaryGalleryImage(product) || PLACEHOLDER_IMG;
                                    const secondImageUrl = getGalleryImageUrl(product, 1);

                                    const displayPrice = product.discountPrice ? product.discountPrice : (product.regularPrice || 0);

                                    return (
                                        <div key={product.id} className="shop-product-card">
                                            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="sp-image-container">
                                                    <img src={productImageUrl} alt={product.name} className="sp-image sp-image-primary" style={{ objectFit: 'contain', backgroundColor: 'white' }} />
                                                    {secondImageUrl && (
                                                        <img src={secondImageUrl} alt={product.name} className="sp-image sp-image-secondary" style={{ objectFit: 'contain', backgroundColor: 'white' }} />
                                                    )}
                                                    <div className="inner-rating-badge">{(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})</div>
                                                    <div className="sp-actions">
                                                        <button className="sp-action-btn" title="Add to Wishlist" onClick={(e) => handleHeartClick(e, product)}>
                                                            <Heart size={16} color={isInWishlist(product.id) ? "#D4857F" : "#555"} fill={isInWishlist(product.id) ? "#D4857F" : "none"} />
                                                        </button>
                                                        <div className="sp-share-wrapper">
                                                            <button className="sp-action-btn" title="Share" onClick={(e) => handleShareClick(e, product)}>
                                                                <Share2 size={16} />
                                                            </button>
                                                            {shareProductId === product.id && (
                                                                <div className="sp-share-dropdown">
                                                                    <p className="sp-share-dropdown-title">Share via</p>
                                                                    <div className="sp-share-icons-row">
                                                                        <button onClick={() => shareToWhatsApp(product)} className="share-icon-btn whatsapp" title="WhatsApp">W</button>
                                                                        <button onClick={() => shareToFacebook(product)} className="share-icon-btn facebook" title="Facebook">f</button>
                                                                        <button onClick={() => shareToTwitter(product)} className="share-icon-btn twitter" title="Twitter">X</button>
                                                                        <button onClick={() => shareToLinkedIn(product)} className="share-icon-btn linkedin" title="LinkedIn">in</button>
                                                                        <button onClick={() => copyShareLink(product)} className="share-icon-btn copy" title="Copy Link"><LinkIcon size={16} /></button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button className="sp-action-btn" title={isInCompare(product.id) ? "Remove from Compare" : "Compare"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product); }}>
                                                            <GitCompare size={16} color={isInCompare(product.id) ? "#FF5722" : "#fff"} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="sp-info">
                                                <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <h4 className="sp-name">{product.name}</h4>
                                                </Link>
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
                                                <button className="sp-add-to-cart-btn" onClick={(e) => handleAddToCart(e, product)}>
                                                    <ShoppingBag size={14} /> Add to Cart
                                                </button>
                                            </div>
                                        </div>
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
