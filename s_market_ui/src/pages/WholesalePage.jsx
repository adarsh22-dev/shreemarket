import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Check, ShoppingBag,
    Heart, Home, Sparkles, Shirt, Puzzle, Flower2, Music, Search,
    Percent, MessageSquareText, UserPlus, LogIn, IndianRupee, Tag,
    Share2, GitCompare, Eye, Link as LinkIcon
} from 'lucide-react';
import './ShopPage.css';
import { getWholesaleProducts, BACKEND_URL, getPrimaryGalleryImage, PLACEHOLDER_IMG, submitBulkInquiry } from '../api/api';
import toast from 'react-hot-toast';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';

const PRODUCTS_PER_PAGE = 9;

const WholesalePage = () => {
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

    const [showBulkInquiry, setShowBulkInquiry] = useState(false);
    const [bulkProduct, setBulkProduct] = useState('');
    const [bulkMessage, setBulkMessage] = useState('');
    const [bulkQty, setBulkQty] = useState('');

    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isWholesaler = currentUser?.roleId === 4;
    const isLoggedIn = !!currentUser;

    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();
    const { addToCart } = useCart();
    const [shareProductId, setShareProductId] = useState(null);

    const handleHeartClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) { toast.error('Please login to add to wishlist'); return; }
        isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
    };

    const handleShareClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setShareProductId(shareProductId === product.id ? null : product.id);
    };

    const shareToWhatsApp = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} - ${url}`)}`, '_blank');
        setShareProductId(null);
    };

    const shareToFacebook = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToTwitter = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(product.name)}`, '_blank');
        setShareProductId(null);
    };

    const shareToLinkedIn = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const copyShareLink = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
        setShareProductId(null);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cat = params.get('category');
        if (cat) { setSelectedCategory(cat); } else { setSelectedCategory('All'); }
    }, [location.search]);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProducts = async () => {
            try {
                const data = await getWholesaleProducts();
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
        if (categoryName === 'All') navigate('/wholesale');
        else navigate(`/wholesale?category=${encodeURIComponent(categoryName)}`);
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

    const processedProducts = useMemo(() => {
        let result = [...allProducts].filter(p => p.supportsWholesale === true);
        if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => (p.name && p.name.toLowerCase().includes(q)));
        }
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        if (!isNaN(min)) result = result.filter(p => (p.wholesalePrice || p.regularPrice || 0) >= min);
        if (!isNaN(max)) result = result.filter(p => (p.wholesalePrice || p.regularPrice || 0) <= max);
        switch (sortOption) {
            case 'newest': result.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
            case 'price-low': result.sort((a, b) => (a.wholesalePrice || 0) - (b.wholesalePrice || 0)); break;
            case 'price-high': result.sort((a, b) => (b.wholesalePrice || 0) - (a.wholesalePrice || 0)); break;
            default: break;
        }
        return result;
    }, [allProducts, selectedCategory, searchQuery, minPrice, maxPrice, sortOption]);

    const totalPages = Math.ceil(processedProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = processedProducts.slice(
        (currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE
    );

    useEffect(() => { setCurrentPage(1); }, [selectedCategory, searchQuery, minPrice, maxPrice, sortOption]);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else {
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

    const handleBulkSubmit = async () => {
        try {
            await submitBulkInquiry({ productName: bulkProduct, requestedQuantity: parseInt(bulkQty) || 0, message: bulkMessage });
            toast.success('Bulk inquiry submitted! We\'ll contact you shortly.');
            setShowBulkInquiry(false);
            setBulkProduct(''); setBulkQty(''); setBulkMessage('');
        } catch (err) {
            toast.error(err.message || 'Failed to submit inquiry');
        }
    };

    const getEffectiveWholesalePrice = (product) => {
        let price = product.wholesalePrice || product.regularPrice || 0;
        if (product.wholesaleDiscountType === 'percentage') {
            price = (product.regularPrice || 0) - ((product.regularPrice || 0) * (product.wholesalePrice / 100));
        }
        return price;
    };

    const getSavingsPercent = (product) => {
        const retail = product.discountPrice || product.regularPrice;
        const wholesale = getEffectiveWholesalePrice(product);
        if (retail && wholesale && retail > wholesale) {
            return Math.round(((retail - wholesale) / retail) * 100);
        }
        return 0;
    };

    return (
        <div className="shop-page-wrapper">
            <Navbar />

            {/* Minimum Order Value Banner */}
            <div style={{ background: 'linear-gradient(90deg, #fffbeb, #fef3c7)', padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#92400e' }}>
                    <IndianRupee size={16} />
                    <span><strong>Wholesale Pricing</strong> — Minimum order value of ₹1,000 applies. Prices shown are per unit at wholesale quantities.</span>
                </div>
            </div>

            <main className="shop-page-main">
                <div className="shop-layout-grid">
                    <aside className="shop-sidebar">
                        <div className="filter-section">
                            <h3 className="filter-title">SEARCH</h3>
                            <div className="search-input-container">
                                <Search size={16} className="search-icon" />
                                <input type="text" className="shop-search-input" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
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
                        <div className="filter-section">
                            <h3 className="filter-title">PRICE RANGE</h3>
                            <div className="price-inputs-row">
                                <input type="number" className="price-input" placeholder="Min ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} min="0" />
                                <span className="price-separator">—</span>
                                <input type="number" className="price-input" placeholder="Max ₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} min="0" />
                            </div>
                        </div>
                        <div className="filter-actions">
                            <button className="btn-apply-filters" onClick={() => setCurrentPage(1)}>Apply Filters</button>
                            <button className="btn-clear-all" onClick={() => { setMinPrice(''); setMaxPrice(''); setSearchQuery(''); setSortOption('featured'); setSelectedCategory('All'); setCurrentPage(1); navigate('/wholesale'); }}>Clear All</button>
                        </div>
                    </aside>

                    <div className="shop-content">
                        <div className="shop-top-bar">
                            <div className="product-count">
                                Showing <strong>{paginatedProducts.length}</strong> of <strong>{processedProducts.length}</strong> wholesale products
                            </div>
                            <div className="top-bar-controls">
                                <div className="sort-dropdown-container">
                                    <select className="sort-dropdown" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                                        <option value="featured">Featured</option>
                                        <option value="newest">Newest Arrivals</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                    <ChevronDown size={14} className="dropdown-icon" />
                                </div>
                            </div>
                        </div>

                        <div className={`shop-products ${viewMode}`}>
                            {loading ? (
                                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>Loading products...</p>
                            ) : paginatedProducts.length > 0 ? (
                                paginatedProducts.map(product => {
                                    const productImageUrl = getPrimaryGalleryImage(product) || PLACEHOLDER_IMG;
                                    const retailPrice = product.discountPrice || product.regularPrice || 0;
                                    const wholesalePrice = getEffectiveWholesalePrice(product);
                                    const savingsPercent = getSavingsPercent(product);
                                    const tiers = product.pricingTiers || [];

                                    return (
                                        <Link to={`/wholesale/product/${product.id}`} key={product.id} className="shop-product-card" style={{ textDecoration: 'none', color: 'inherit', position: 'relative' }}>
                                            {/* Wholesale Badge */}
                                            <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 2, display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                <span style={{ background: '#d97706', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Tag size={10} /> Wholesale</span>
                                                {savingsPercent > 0 && (
                                                    <span style={{ background: '#059669', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Save {savingsPercent}%</span>
                                                )}
                                            </div>

                                            <div className="sp-image-container">
                                                <img src={productImageUrl} alt={product.name} className="sp-image" style={{ objectFit: 'contain', backgroundColor: 'white' }} />
                                                <div className="inner-rating-badge">{(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})</div>
                                                {/* Action Buttons Overlay */}
                                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                    {/* Wishlist */}
                                                    <button onClick={(e) => handleHeartClick(e, product)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: isLoggedIn && isInWishlist(product.id) ? '#FF5722' : '#666' }} title="Add to Wishlist">
                                                        <Heart size={16} fill={isLoggedIn && isInWishlist(product.id) ? "#FF5722" : "none"} />
                                                    </button>
                                                    {/* Compare */}
                                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product); }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: isInCompare(product.id) ? '#FF5722' : '#666' }} title="Add to Compare">
                                                        <GitCompare size={16} />
                                                    </button>
                                                    {/* Share */}
                                                    <div className="sp-share-wrapper" style={{ position: 'relative' }}>
                                                        <button onClick={(e) => handleShareClick(e, product)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#666' }} title="Share">
                                                            <Share2 size={16} />
                                                        </button>
                                                        {shareProductId === product.id && (
                                                            <div className="sp-share-dropdown" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.35rem', background: '#fff', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '0.75rem', minWidth: '180px', zIndex: 10, border: '1px solid #f3f4f6' }}>
                                                                <p className="sp-share-dropdown-title" style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Share via</p>
                                                                <div className="sp-share-icons-row" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    <button onClick={() => shareToWhatsApp(product)} className="share-icon-btn whatsapp" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#25D366', color: '#fff' }} title="WhatsApp">W</button>
                                                                    <button onClick={() => shareToFacebook(product)} className="share-icon-btn facebook" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#1877F2', color: '#fff' }} title="Facebook">f</button>
                                                                    <button onClick={() => shareToTwitter(product)} className="share-icon-btn twitter" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#000', color: '#fff' }} title="Twitter">X</button>
                                                                    <button onClick={() => shareToLinkedIn(product)} className="share-icon-btn linkedin" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#0A66C2', color: '#fff' }} title="LinkedIn">in</button>
                                                                    <button onClick={() => copyShareLink(product)} className="share-icon-btn copy" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#374151' }} title="Copy Link"><LinkIcon size={16} /></button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Quick View */}
                                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/product/${product.id}`, '_blank'); }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#666' }} title="Quick View">
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="sp-info">
                                                <h4 className="sp-name">{product.name}</h4>
                                                <p className="sp-author">by {product.vendor?.storeName || 'SreeMarket Vendor'}</p>
                                                <p className="sp-flexible-qty">Flexible Quantity</p>

                                                <div className="sp-price-row" style={{ marginTop: '0.75rem', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Wholesale Price</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <p className="sp-price" style={{ fontSize: '1.2rem', marginBottom: 0 }}>₹{wholesalePrice.toFixed(2)}</p>
                                                            {wholesalePrice < retailPrice && (
                                                                <p className="sp-original-price" style={{ marginBottom: 0, fontSize: '0.85rem' }}>₹{retailPrice.toFixed(2)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#666', marginBottom: '6px' }}>Min. Qty</span>
                                                        <span style={{ backgroundColor: '#FFF0EB', color: '#FF5722', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>{product.minimumWholesaleQuantity || 10} units</span>
                                                    </div>
                                                </div>

                                                {/* Tiered Pricing Table */}
                                                {tiers.length > 0 && (
                                                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Volume Pricing</span>
                                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                            {tiers.sort((a, b) => a.minQuantity - b.minQuantity).map((tier, i) => (
                                                                <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#fffbeb', color: '#d97706', fontSize: '0.7rem', fontWeight: '600', border: '1px solid #fde68a' }}>
                                                                    {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} @ ₹{tier.unitPrice}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Add to Cart */}
                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart({ ...product, quantity: product.minimumWholesaleQuantity || 10, price: wholesalePrice }); toast.success('Added to cart'); }} className="sp-add-to-cart-btn" style={{ marginTop: '0.75rem' }}>
                                                    <ShoppingBag size={14} /> Add to Cart
                                                </button>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>No wholesale products found matching your criteria.</p>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="shop-pagination-wrapper">
                                <div className="shop-pagination">
                                    <button className="page-btn nav-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
                                    {getPageNumbers().map((page, index) =>
                                        page === '...' ? <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>
                                            : <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>
                                    )}
                                    <button className="page-btn nav-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bulk Inquiry FAB */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50 }}>
                {showBulkInquiry ? (
                    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '1.25rem', width: '320px' }}>
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: '600' }}>Bulk Order Inquiry</h3>
                        <input placeholder="Product name" value={bulkProduct} onChange={e => setBulkProduct(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '0.5rem', fontSize: '0.85rem', outline: 'none' }} />
                        <input type="number" placeholder="Requested quantity" value={bulkQty} onChange={e => setBulkQty(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '0.5rem', fontSize: '0.85rem', outline: 'none' }} />
                        <textarea placeholder="Message (optional)" value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '0.75rem', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowBulkInquiry(false)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                            <button onClick={handleBulkSubmit} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#d97706', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>Submit</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowBulkInquiry(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '50px', border: 'none', background: '#d97706', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217,119,6,0.3)', fontSize: '0.9rem', fontWeight: '600' }}>
                        <MessageSquareText size={18} /> Bulk Inquiry
                    </button>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default WholesalePage;
