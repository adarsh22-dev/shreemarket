import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ChevronDown, SlidersHorizontal, LayoutGrid, List, X, Loader, Heart, ShoppingBag, Share2, GitCompare, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { getAllProducts, getPublicCategories, getProductImageUrl, getPrimaryGalleryImage } from '../api/api';
import './ProductListingPage.css';

const ProductListingPage = () => {
    const { category: categorySlug } = useParams();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [viewMode, setViewMode] = useState('grid');
    const { addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();

    const categoryName = useMemo(() => {
        if (!categorySlug) return null;
        const found = categories.find(c => c.slug === categorySlug);
        return found ? found.name : categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }, [categorySlug, categories]);

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);
        Promise.all([
            getPublicCategories(),
            getAllProducts(categoryName || undefined)
        ]).then(([cats, prods]) => {
            setCategories(cats || []);
            const list = Array.isArray(prods) ? prods : [];
            setProducts(list);
            setTotalItems(list.length);
        }).catch(() => {
            toast.error('Failed to load products');
        }).finally(() => {
            setLoading(false);
        });
    }, [categorySlug, categoryName]);

    const currentCategory = useMemo(() => {
        if (!categorySlug) return null;
        return categories.find(c => c.slug === categorySlug) || null;
    }, [categorySlug, categories]);

    const pageTitle = currentCategory?.name || (categorySlug ? categoryName : 'All Products');
    const pageDesc = currentCategory?.description || 'Explore our collection featuring sustainable materials and artisan craftsmanship.';

    const handleHeartClick = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
    };

    const [shareProductId, setShareProductId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (shareProductId && !e.target.closest('.lp-share-wrapper')) {
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

    const productPrice = (p) => p.discountPrice || p.regularPrice || 0;
    const productOriginalPrice = (p) => p.regularPrice || 0;
    const hasDiscount = (p) => p.discountPrice != null && p.discountPrice < (p.regularPrice || 0);
    const productImage = (p) => getPrimaryGalleryImage(p) || 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop';

    if (loading) {
        return (
            <div className="loading-screen">
                <Navbar />
                <div style={{ height: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Loader size={48} className="spinner" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="product-listing-page">
            <Navbar />

            <div className="listing-container">
                <div className="breadcrumbs">
                    <Link to="/">HOME</Link>  &gt;
                    <span className="current-crumb">{categorySlug ? categorySlug.toUpperCase().replace(/-/g, ' ') : 'SHOP'}</span>
                </div>

                <header className="listing-header">
                    <div>
                        <div className="breadcrumb-small">HOME &gt; SHOP &gt; <span style={{ color: '#FF5722' }}>{categorySlug ? categorySlug.toUpperCase().replace(/-/g, ' ') : ''}</span></div>
                        <h1 className="category-title">{pageTitle}</h1>
                        <p className="category-description">{pageDesc}</p>
                    </div>
                    <div className="item-count">{totalItems} items found</div>
                </header>

                <div className="listing-toolbar">
                    <div className="filter-groups">
                        <button className="filter-dropdown">Price Range <ChevronDown size={14} /></button>
                        <button className="filter-dropdown">Category <ChevronDown size={14} /></button>
                    </div>
                    <div className="toolbar-actions">
                        <div className="sort-dropdown">
                            <span>Sort by: </span>
                            <span className="sort-value">Newest Arrivals</span>
                        </div>
                    </div>
                </div>

                <div className={`product-grid ${viewMode}`}>
                    {products.map(product => {
                        const price = productPrice(product);
                        const origPrice = productOriginalPrice(product);
                        const discount = hasDiscount(product);
                        const img = productImage(product);
                        const avgRating = product.averageRating || 0;
                        const reviewCount = product.reviewCount || 0;
                        return (
                            <div key={product.id} className="listing-product-card">
                                <div className="lp-image-wrapper">
                                    {discount && (
                                        <span className="lp-tag sale">
                                            -{Math.round((1 - price / origPrice) * 100)}% OFF
                                        </span>
                                    )}
                                    <img src={img} alt={product.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop'; }} />
                                    <div className="lp-action-btns">
                                        <button
                                            className="lp-action-btn"
                                            title="Wishlist"
                                            onClick={(e) => handleHeartClick(e, product)}
                                        >
                                            <Heart
                                                size={16}
                                                color={isInWishlist(product.id) ? "#D4857F" : "#fff"}
                                                fill={isInWishlist(product.id) ? "#D4857F" : "none"}
                                            />
                                        </button>
                                        <div className="lp-share-wrapper">
                                            <button
                                                className="lp-action-btn"
                                                title="Share"
                                                onClick={(e) => handleShareClick(e, product)}
                                            >
                                                <Share2 size={16} />
                                            </button>
                                            {shareProductId === product.id && (
                                                <div className="lp-share-dropdown">
                                                    <p className="lp-share-dropdown-title">Share via</p>
                                                    <div className="lp-share-icons-row">
                                                        <button onClick={(e) => { e.stopPropagation(); shareToWhatsApp(product); }} className="share-icon-btn whatsapp" title="WhatsApp">W</button>
                                                        <button onClick={(e) => { e.stopPropagation(); shareToFacebook(product); }} className="share-icon-btn facebook" title="Facebook">f</button>
                                                        <button onClick={(e) => { e.stopPropagation(); shareToTwitter(product); }} className="share-icon-btn twitter" title="Twitter">X</button>
                                                        <button onClick={(e) => { e.stopPropagation(); shareToLinkedIn(product); }} className="share-icon-btn linkedin" title="LinkedIn">in</button>
                                                        <button onClick={(e) => { e.stopPropagation(); copyShareLink(product); }} className="share-icon-btn copy" title="Copy Link"><LinkIcon size={16} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="lp-action-btn"
                                            title={isInCompare(product.id) ? "Remove from Compare" : "Compare"}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product); }}
                                        >
                                            <GitCompare size={16} color={isInCompare(product.id) ? "#FF5722" : "#fff"} />
                                        </button>
                                    </div>
                                </div>
                                <div className="lp-details">
                                    <div className="lp-header">
                                        <h3 className="lp-name">{product.name}</h3>
                                        <div className="lp-price">
                                            {discount && (
                                                <span className="lp-original-price">₹{origPrice}</span>
                                            )}
                                            <span className={`lp-current-price ${discount ? 'sale-price' : ''}`}>
                                                ₹{price}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="lp-desc">{product.shortDescription || product.category}</p>
                                    <div className="lp-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} style={{ color: i < Math.floor(avgRating) ? '#FF5722' : '#ddd' }}>★</span>
                                        ))}
                                        <span className="lp-review-count">({reviewCount} REVIEWS)</span>
                                    </div>
                                    <button className="lp-add-to-cart-btn" onClick={(e) => handleAddToCart(e, product)}>
                                        <ShoppingBag size={14} /> Add to Cart
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {products.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                        <h3>No products found</h3>
                        <p>Try browsing a different category.</p>
                    </div>
                )}

                <div className="load-more-container">
                    <div className="load-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '100%' }}></div>
                        </div>
                        <p>SHOWING {products.length} OF {totalItems} ITEMS</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductListingPage;
