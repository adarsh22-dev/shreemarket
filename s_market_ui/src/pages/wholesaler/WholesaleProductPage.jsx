import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
    Minus, Plus, ShoppingCart, ArrowLeft, Star, IndianRupee, Tag, ShieldCheck, Truck,
    Heart, Share2, GitCompare, Link as LinkIcon, ChevronLeft, ChevronRight, Package, RotateCcw,
    ShoppingBag, Loader2, CornerDownRight, ThumbsUp, ThumbsDown, HeartHandshake, Leaf
} from 'lucide-react';
import { getProduct, getVendorById, getAllProducts, getProductReviews, BACKEND_URL, PLACEHOLDER_IMG, handleImageError } from '../../api/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import toast from 'react-hot-toast';
import '../ProductPage.css';

const WholesaleProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist, isLoggedIn } = useWishlist();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();

    const [product, setProduct] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [upsellProducts, setUpsellProducts] = useState([]);
    const [crossSellProducts, setCrossSellProducts] = useState([]);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(10);
    const [activeImage, setActiveImage] = useState(0);

    const [isZooming, setIsZooming] = useState(false);
    const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(3);
    const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
    const LENS_SIZE = 160;
    const imgRef = useRef(null);

    // Share
    const [showShareDropdown, setShowShareDropdown] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState(null);

    const handleMouseMove = (e) => {
        const rect = imgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pctX = x / rect.width;
        const pctY = y / rect.height;
        const bgW = LENS_SIZE * zoomLevel;
        const bgH = LENS_SIZE * zoomLevel;
        setLensPos({ x, y });
        setBgPos({
            x: -(pctX * bgW - LENS_SIZE / 2),
            y: -(pctY * bgH - LENS_SIZE / 2),
        });
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = imgRef.current.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const pctX = x / rect.width;
            const pctY = y / rect.height;
            const bgW = LENS_SIZE * zoomLevel;
            const bgH = LENS_SIZE * zoomLevel;
            setLensPos({ x, y });
            setBgPos({
                x: -(pctX * bgW - LENS_SIZE / 2),
                y: -(pctY * bgH - LENS_SIZE / 2),
            });
        }
    };

    const handleTouchStart = (e) => {
        setIsZooming(true);
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        setIsZooming(false);
    };

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await getProduct(id);
                setProduct(data);
                setQuantity(data.minimumWholesaleQuantity || 10);

                if (data.vendorId) {
                    const vendorData = await getVendorById(data.vendorId);
                    setVendor(vendorData);
                }

                const allProducts = await getAllProducts();
                const sameCategory = (allProducts || [])
                    .filter(p => p.category === data.category && p.id !== data.id)
                    .slice(0, 8);
                setRelatedProducts(sameCategory);

                const autoUpsells = [...sameCategory]
                    .sort((a, b) => (a.discountPrice || a.regularPrice) - (b.discountPrice || b.regularPrice))
                    .slice(0, 5);
                const autoCrossSells = [...sameCategory]
                    .sort((a, b) => (b.discountPrice || b.regularPrice) - (a.discountPrice || a.regularPrice))
                    .slice(0, 5);
                setUpsellProducts(autoUpsells);
                setCrossSellProducts(autoCrossSells);

                try {
                    const productReviews = await getProductReviews(id);
                    setReviews(productReviews);
                } catch (e) { /* ignore */ }
            } catch (err) {
                toast.error('Failed to load product');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showShareDropdown && !e.target.closest('.share-btn') && !e.target.closest('.share-dropdown')) {
                setShowShareDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showShareDropdown]);

    if (loading) return (
        <div className="product-page-wrapper">
            <Navbar />
            <div className="product-page-loading">
                <Loader2 size={48} className="animate-spin" color="#d97706" />
                <p>Loading wholesale product...</p>
            </div>
            <Footer />
        </div>
    );

    if (!product) return (
        <div className="product-page-wrapper">
            <Navbar />
            <div className="product-page-error">
                <h2>Product not found</h2>
                <Link to="/wholesale" className="back-to-shop-btn">Back to Wholesale</Link>
            </div>
            <Footer />
        </div>
    );

    const galleryMedia = (product.media || []).filter(m => m.mediaType !== 'manufacturer' && m.fileType !== 'instagram-url');
    const currentImage = galleryMedia.length > 0
        ? `${BACKEND_URL}/uploads/products/${galleryMedia[activeImage]?.fileName || galleryMedia[0]?.fileName}`
        : PLACEHOLDER_IMG;

    const wholesalePrice = product.wholesalePrice || 0;
    const retailPrice = product.discountPrice || product.regularPrice || 0;
    const savingsPercent = wholesalePrice && retailPrice > wholesalePrice
        ? Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100) : 0;

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : (product?.averageRating || 0).toFixed(1);

    const getEffectivePrice = (qty) => {
        let price = wholesalePrice;
        if (product.pricingTiers && product.pricingTiers.length > 0) {
            const sorted = [...product.pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
            for (const tier of sorted) {
                if (qty >= tier.minQuantity && (!tier.maxQuantity || qty <= tier.maxQuantity)) {
                    price = tier.unitPrice || price;
                }
            }
        }
        return price;
    };

    const effectivePrice = getEffectivePrice(quantity);
    const totalPrice = effectivePrice * quantity;

    const handleAddToCart = () => {
        addToCart({
            ...product,
            title: product.name,
            price: effectivePrice,
            image: currentImage,
        }, quantity, null, true);
        toast.success(`${product.name} added to cart`);
    };

    const renderStars = (rating) => (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={14} className={star <= rating ? "star-icon filled" : "star-icon"} />
            ))}
        </div>
    );

    const handleHeartClick = (e) => {
        e.preventDefault();
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist({
                ...product,
                image: currentImage,
                price: retailPrice || 0
            });
        }
    };

    const shareUrl = window.location.href;
    const shareText = `Check out ${product?.name || 'this product'} on SreeMarket Wholesale!`;

    const shareToWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'); setShowShareDropdown(false); };
    const shareToFacebook = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'); setShowShareDropdown(false); };
    const shareToTwitter = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank'); setShowShareDropdown(false); };
    const shareToLinkedIn = () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank'); setShowShareDropdown(false); };
    const copyShareLink = async () => {
        try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied to clipboard!"); }
        catch { toast.error("Failed to copy link"); }
        setShowShareDropdown(false);
    };

    const getGalleryImage = (item, index = 0) => {
        const gMedia = (item.media || []).filter(m => m.mediaType !== 'manufacturer' && m.fileType !== 'instagram-url');
        if (gMedia.length <= index || !gMedia[index].fileName) return null;
        return `${BACKEND_URL}/uploads/products/${gMedia[index].fileName}`;
    };

    const store = vendor?.stores?.[0];
    const isOutOfStock = selectedVariation
        ? (selectedVariation.stock != null && selectedVariation.stock <= 0)
        : (product.initialStock != null && product.initialStock <= 0);

    return (
        <div className="product-page-wrapper">
            <Navbar />

            <main className="product-page-main">
                <div className="breadcrumbs">
                    <Link to="/">Home</Link> <span className="separator">&gt;</span>
                    <Link to="/wholesale">Wholesale</Link> <span className="separator">&gt;</span>
                    <span className="current">{product.name}</span>
                </div>

                <div className="product-page-layout">
                    <div className="product-gallery">
                        <div className="main-image-wrapper">
                            <div className="gallery-actions-bar">
                                <button className="gallery-action-btn share-btn" onClick={() => setShowShareDropdown(!showShareDropdown)} title="Share">
                                    <Share2 size={18} />
                                </button>
                                <button className="gallery-action-btn" onClick={handleHeartClick} title="Wishlist">
                                    <Heart size={18} fill={isLoggedIn && isInWishlist(product.id) ? "#FF5722" : "none"} color={isLoggedIn && isInWishlist(product.id) ? "#FF5722" : "#fff"} />
                                </button>
                                <button className="gallery-action-btn" title={isInCompare(product.id) ? "Remove from Compare" : "Compare"} onClick={(e) => { e.preventDefault(); isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product); }}>
                                    <GitCompare size={18} color={isInCompare(product.id) ? "#FF5722" : "#fff"} />
                                </button>
                            </div>
                            {showShareDropdown && (
                                <div className="share-dropdown share-dropdown-popup">
                                    <p className="share-dropdown-title">Share via</p>
                                    <div className="share-icons-row">
                                        <button onClick={shareToWhatsApp} className="share-icon-btn whatsapp" title="WhatsApp">W</button>
                                        <button onClick={shareToFacebook} className="share-icon-btn facebook" title="Facebook">f</button>
                                        <button onClick={shareToTwitter} className="share-icon-btn twitter" title="Twitter">X</button>
                                        <button onClick={shareToLinkedIn} className="share-icon-btn linkedin" title="LinkedIn">in</button>
                                        <button onClick={copyShareLink} className="share-icon-btn copy" title="Copy Link"><LinkIcon size={16} /></button>
                                    </div>
                                </div>
                            )}
                            <div className="zoom-container">
                                <img
                                    ref={imgRef}
                                    src={currentImage}
                                    alt={product.name}
                                    className="main-image"
                                    onMouseEnter={() => setIsZooming(true)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={() => setIsZooming(false)}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                />
                                {isZooming && (
                                    <div className="zoom-magnifier" style={{
                                        left: lensPos.x - 80,
                                        top: lensPos.y - 80,
                                    }}>
                                        <div className="zoom-lens-inner" style={{
                                            backgroundImage: `url(${currentImage})`,
                                            backgroundSize: `${zoomLevel * 100}%`,
                                            backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
                                            backgroundRepeat: 'no-repeat',
                                        }} />
                                        <span className="zoom-lens-label">{zoomLevel.toFixed(1)}x</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {galleryMedia.length > 1 && (
                            <div className="thumbnails">
                                {galleryMedia.map((m, i) => (
                                    <div key={m.id} className={`thumb-wrapper ${i === activeImage ? 'active' : ''}`} onClick={() => setActiveImage(i)}>
                                        <img src={`${BACKEND_URL}/uploads/products/${m.fileName}`} alt={`Thumbnail ${i + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="product-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ background: '#d97706', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Wholesale</span>
                            {product.category && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{product.category?.toUpperCase()}</span>}
                            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>{product.status?.toUpperCase() || 'AVAILABLE'}</span>
                        </div>

                        <h1 className="product-title">
                            {product.name}
                            {selectedVariation && <span className="variation-suffix"> — {selectedVariation.name}</span>}
                        </h1>

                        <div className="product-price">
                            {selectedVariation && !selectedVariation.useMainPricing && selectedVariation.price ? (
                                <span className="discount-price">₹{selectedVariation.price.toFixed(2)}</span>
                            ) : product.discountPrice ? (
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
                                `₹${product.regularPrice?.toFixed(2)}`
                            )}
                        </div>

                        <div className="product-rating-summary">
                            {renderStars(Math.round(parseFloat(averageRating)))}
                            <span style={{ fontSize: '0.9rem', color: '#8A7F75' }}>
                                {averageRating} ({reviews.length} reviews)
                            </span>
                        </div>

                        {product.shortDescription && (
                            <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>{product.shortDescription}</p>
                        )}

                        {/* Variations */}
                        {product.variations && product.variations.length > 0 && (
                            <div className="product-variations-box">
                                <div className="variations-header">
                                    <span className="variations-label">Available Variants:</span>
                                    {selectedVariation && (
                                        <button className="back-to-main-btn" onClick={() => { setSelectedVariation(null); setActiveImage(0); }}>
                                            <ArrowLeft size={14} /> Back to main product
                                        </button>
                                    )}
                                </div>
                                <div className="variations-list">
                                    {product.variations.map(v => (
                                        <button
                                            key={v.id}
                                            className={`variation-chip ${selectedVariation?.id === v.id ? 'active' : ''} ${v.stock != null && v.stock <= 0 ? 'out-of-stock' : ''}`}
                                            onClick={() => {
                                                const isDeselecting = selectedVariation?.id === v.id;
                                                setSelectedVariation(isDeselecting ? null : v);
                                                if (isDeselecting) setActiveImage(0);
                                            }}
                                        >
                                            <span className="variation-name">{v.name}</span>
                                            {!v.useMainPricing && v.price && (
                                                <span className="variation-price">₹{v.price.toFixed(2)}</span>
                                            )}
                                            {v.stock != null && v.stock <= 0 && (
                                                <span className="variation-oos-tag">Out of stock</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vendor Store Info */}
                        {vendor && store && (
                            <div className="vendor-store-info" style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', background: '#FFFBF8', borderRadius: '12px',
                                border: '1px solid #E8DDD4', marginBottom: '1.25rem'
                            }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: '#F5EDE6', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700,
                                    color: '#C9A87C', overflow: 'hidden'
                                }}>
                                    {store.storeLogo ? (
                                        <img src={`${BACKEND_URL}${store.storeLogo}`} alt={store.storeName} onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        store.storeName?.charAt(0)?.toUpperCase()
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.72rem', color: '#A0978E', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Sold by</div>
                                    <span style={{ color: '#2C2C2C', fontWeight: 600, fontSize: '0.95rem' }}>
                                        {store.storeName || vendor.fullName}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div style={{ background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '500' }}>Wholesale Price</span>
                                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>₹{effectivePrice.toFixed(2)}</span>
                                {retailPrice > 0 && (
                                    <span style={{ fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{retailPrice.toFixed(2)}</span>
                                )}
                                {savingsPercent > 0 && (
                                    <span style={{ background: '#059669', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Save {savingsPercent}%</span>
                                )}
                            </div>

                            {product.minimumWholesaleQuantity && (
                                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#92400e' }}>
                                    <Tag size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                    Minimum order: <strong>{product.minimumWholesaleQuantity} units</strong>
                                </p>
                            )}

                            {product.pricingTiers && product.pricingTiers.length > 0 && (
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#92400e', display: 'block', marginBottom: '0.5rem' }}>Volume Pricing Tiers</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {[...product.pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity).map((tier, i) => (
                                            <div key={i} style={{
                                                padding: '0.5rem 0.75rem', borderRadius: '8px',
                                                background: quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity) ? '#d97706' : '#fff',
                                                color: quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity) ? '#fff' : '#d97706',
                                                fontSize: '0.8rem', fontWeight: '600',
                                                border: quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity) ? '1px solid #d97706' : '1px solid #fde68a',
                                                transition: 'all 0.2s'
                                            }}>
                                                {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} units — <IndianRupee size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />{tier.unitPrice}/unit
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

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
                            {product.initialStock != null && (
                                <div className="spec-item">
                                    <span className="spec-label">STOCK</span>
                                    <span className="spec-value">{product.initialStock > 0 ? `${product.initialStock} available` : 'Out of stock'}</span>
                                </div>
                            )}
                            {product.attributes && product.attributes.map(attr => (
                                <div key={attr.id} className="spec-item">
                                    <span className="spec-label">{attr.name?.toUpperCase()}</span>
                                    <span className="spec-value">{attr.value}</span>
                                </div>
                            ))}
                        </div>

                        {isOutOfStock && (
                            <div className="out-of-stock-banner">This item is currently out of stock</div>
                        )}

                        <div className="product-actions">
                            <div className={`quantity-selector ${isOutOfStock ? 'disabled' : ''}`}>
                                <button onClick={() => setQuantity(Math.max(product.minimumWholesaleQuantity || 1, quantity - 1))} className="qty-btn" disabled={isOutOfStock}><Minus size={16} /></button>
                                <span className="qty-value">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="qty-btn" disabled={isOutOfStock}><Plus size={16} /></button>
                            </div>
                            <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={isOutOfStock}>
                                {isOutOfStock ? 'Out of Stock' : <><ShoppingCart size={18} /> Add to Cart — <IndianRupee size={14} />{totalPrice.toFixed(2)}</>}
                            </button>
                        </div>

                        <div className="product-guarantees">
                            <div className="guarantee"><ShieldCheck size={14} /> Wholesale Price Guarantee</div>
                            <div className="guarantee"><Truck size={14} /> Bulk Shipping Available</div>
                            <div className="guarantee"><Package size={14} /> Min {product.minimumWholesaleQuantity || 10} units</div>
                        </div>

                        {product.tags && product.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                {product.tags.map((tag, index) => (
                                    <span key={tag.id || index} style={{
                                        background: '#F5EDE6', padding: '5px 12px', borderRadius: '20px',
                                        fontSize: '0.82rem', color: '#8A7F75', fontWeight: 500
                                    }}>
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Full Description */}
                    {product.description && (
                        <section className="product-full-description">
                            <h2 className="section-heading">Product Details</h2>
                            <div className="description-content">
                                {product.description.split('\n').map((line, index) => (
                                    <p key={index}>{line}</p>
                                ))}
                            </div>
                            <div className="additional-details" style={{ marginTop: '2rem' }}>
                                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: '1rem', borderBottom: '1px solid #E8DDD4', paddingBottom: '0.75rem', fontSize: '1.3rem', color: '#2C2C2C', fontWeight: 600 }}>Specifications</h3>
                                <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                    <tbody>
                                        {product.brand && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75', width: '30%' }}>Brand</td>
                                                <td style={{ padding: '12px 8px' }}>{product.brand}</td>
                                            </tr>
                                        )}
                                        {product.sku && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>SKU</td>
                                                <td style={{ padding: '12px 8px' }}>{product.sku}</td>
                                            </tr>
                                        )}
                                        {product.category && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Category</td>
                                                <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{product.category}</td>
                                            </tr>
                                        )}
                                        {product.weight > 0 && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Weight</td>
                                                <td style={{ padding: '12px 8px' }}>{product.weight} kg</td>
                                            </tr>
                                        )}
                                        {product.attributes && product.attributes.map(attr => (
                                            <tr key={attr.id} style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>{attr.name?.charAt(0).toUpperCase() + attr.name?.slice(1)}</td>
                                                <td style={{ padding: '12px 8px' }}>{attr.value}</td>
                                            </tr>
                                        ))}
                                        {product.status && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Availability</td>
                                                <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                                                    {product.status === 'in' ? 'In Stock' : product.status === 'low' ? 'Low Stock' : product.status === 'out' ? 'Out of Stock' : product.status}
                                                </td>
                                            </tr>
                                        )}
                                        {(product.length > 0 || product.width > 0 || product.height > 0) && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Dimensions</td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    {product.length || 0} x {product.width || 0} x {product.height || 0} cm <span style={{ fontSize: '0.8rem', color: '#A0978E' }}>(L x W x H)</span>
                                                </td>
                                            </tr>
                                        )}
                                        {product.shippingClass && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Shipping Class</td>
                                                <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{product.shippingClass}</td>
                                            </tr>
                                        )}
                                        {product.taxStatus && product.taxStatus !== 'none' && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Tax Status</td>
                                                <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                                                    {product.taxStatus} {product.taxClass && `(${product.taxClass})`}
                                                </td>
                                            </tr>
                                        )}
                                        {product.minimumWholesaleQuantity && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Minimum Order</td>
                                                <td style={{ padding: '12px 8px' }}>{product.minimumWholesaleQuantity} units</td>
                                            </tr>
                                        )}
                                        {product.wholesalePrice > 0 && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Wholesale Price</td>
                                                <td style={{ padding: '12px 8px' }}>₹{product.wholesalePrice.toFixed(2)} / unit</td>
                                            </tr>
                                        )}
                                        {product.tags && product.tags.length > 0 && (
                                            <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Tags</td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    {product.tags.map((tag, index) => (
                                                        <span key={tag.id || index} style={{
                                                            display: 'inline-block', background: '#F5EDE6',
                                                            padding: '5px 12px', borderRadius: '20px',
                                                            fontSize: '0.82rem', marginRight: '8px', marginBottom: '4px',
                                                            color: '#8A7F75', fontWeight: 500
                                                        }}>
                                                            {tag.name}
                                                        </span>
                                                    ))}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Reviews Section */}
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
                            </div>
                            <div className="rating-bars">
                                {[5, 4, 3, 2, 1].map(stars => {
                                    const count = reviews.filter(r => r.rating === stars).length;
                                    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                                    return (
                                        <div key={stars} className="rating-bar-row">
                                            <span className="star-label">{stars} Star</span>
                                            <div className="bar-track">
                                                <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                                            </div>
                                            <span className="pct-label">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="reviews-list">
                            {reviews.length > 0 ? reviews.map((review) => (
                                <div key={review.id || review.createdAt} className="review-item">
                                    <div className="review-header">
                                        {renderStars(review.rating)}
                                        <span className="review-date">
                                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                        </span>
                                    </div>
                                    <h4 className="review-title">{review.title}</h4>
                                    <div className="reviewer-info">
                                        <span className="reviewer-name">{review.reviewerName || 'Anonymous'}</span>
                                        {review.verifiedBuyer && <span className="verified-buyer"><ShieldCheck size={12} /> Verified Buyer</span>}
                                    </div>
                                    <p className="review-text">{review.text}</p>
                                    {review.images && review.images.length > 0 && (
                                        <div className="review-images-gallery">
                                            {review.images.map((img, index) => (
                                                <div key={index} className="review-image-thumbnail">
                                                    <img src={`${BACKEND_URL}/uploads/reviews/${img}`} alt="" onClick={() => window.open(`${BACKEND_URL}/uploads/reviews/${img}`, '_blank')} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {review.vendorReply && (
                                        <div className="vendor-reply-block">
                                            <div className="vrb-header">
                                                <span className="vrb-title"><CornerDownRight size={14} /> SELLER'S RESPONSE</span>
                                                <span className="vrb-date">{review.replyDate ? new Date(review.replyDate).toLocaleDateString() : ''}</span>
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
                                <p style={{ padding: '2rem 0', color: '#8A7F75', fontStyle: 'italic' }}>No reviews yet for this product.</p>
                            )}
                        </div>
                    </section>

                    {/* Artisan Section */}
                    {store && (
                        <section className="artisan-section">
                            <div className="artisan-card">
                                <div className="artisan-image-wrapper">
                                    <img
                                        src={store.storeLogo ? `${BACKEND_URL}${store.storeLogo}` : PLACEHOLDER_IMG}
                                        alt={store.storeName}
                                        onError={handleImageError}
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
                                <div className="matter-icon"><HeartHandshake size={24} color="#C9A87C" /></div>
                                <h4>Fair Wages</h4>
                                <p>Artisans set their own prices, ensuring they earn a living wage that supports their families and communities.</p>
                            </div>
                            <div className="matter-card">
                                <div className="matter-icon"><ShieldCheck size={24} color="#C9A87C" /></div>
                                <h4>Cultural Preservation</h4>
                                <p>By prioritizing traditional techniques, we help keep centuries-old crafting traditions alive for future generations.</p>
                            </div>
                            <div className="matter-card">
                                <div className="matter-icon"><Leaf size={24} color="#C9A87C" /></div>
                                <h4>100% Organic</h4>
                                <p>We use only locally sourced natural dyes and sustainable materials that are kind to both the maker and the earth.</p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section className="faq-section">
                        <h2 className="section-heading-left">Frequently Asked Questions</h2>
                        <div className="faq-list">
                            {[
                                { question: 'What is the return policy?', answer: 'We offer a 30-day return policy for all unused items in their original packaging. Please contact our support team to initiate a return.' },
                                { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days delivery.' },
                                { question: 'Is this product authentic?', answer: 'Yes, all products on SreeMarket are 100% authentic and sourced directly from verified vendors.' },
                                { question: 'Do you offer international shipping?', answer: 'Currently, we ship within India. International shipping will be available soon.' },
                                { question: 'How can I track my order?', answer: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can also track it in your Orders section.' },
                            ].map((faq, index) => (
                                <div key={index} className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}>
                                    <button className="faq-question" onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}>
                                        <span>{faq.question}</span>
                                        <span className="faq-toggle">{openFaqIndex === index ? '−' : '+'}</span>
                                    </button>
                                    {openFaqIndex === index && (
                                        <div className="faq-answer"><p>{faq.answer}</p></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Customers Who Viewed Also Viewed */}
                    {relatedProducts.length > 0 && (
                        <section className="related-products-section">
                            <h3 className="related-heading">Customers who viewed this item also viewed</h3>
                            <div className="related-carousel">
                                <button className="carousel-btn carousel-prev" onClick={() => { const el = document.getElementById('wp-viewed-track'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}>‹</button>
                                <div className="related-carousel-track" id="wp-viewed-track">
                                    {relatedProducts.slice(0, 8).map(item => (
                                        <div key={item.id} className="related-card">
                                            <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="related-image-wrapper">
                                                    <img src={getGalleryImage(item) || PLACEHOLDER_IMG} alt={item.name} className="related-img-primary" />
                                                </div>
                                            </Link>
                                            <div className="related-info">
                                                <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <h5 className="related-name">{item.name}</h5>
                                                </Link>
                                                <p className="related-price">₹{(item.wholesalePrice || item.discountPrice || item.regularPrice || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="carousel-btn carousel-next" onClick={() => { const el = document.getElementById('wp-viewed-track'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}>›</button>
                            </div>
                        </section>
                    )}

                    {/* Top Picks (Upsells) */}
                    {upsellProducts.length > 0 && (
                        <section className="related-products-section top-picks-section">
                            <h3 className="related-heading">Top Picks</h3>
                            <p className="section-subheading">Recommended alternatives you might love</p>
                            <div className="related-carousel">
                                <button className="carousel-btn carousel-prev" onClick={() => { const el = document.getElementById('wp-upsell-track'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}>‹</button>
                                <div className="related-carousel-track" id="wp-upsell-track">
                                    {upsellProducts.map(item => (
                                        <div key={item.id} className="related-card top-pick-card">
                                            <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="top-pick-badge">Top Pick</div>
                                                <div className="related-image-wrapper">
                                                    <img src={getGalleryImage(item) || PLACEHOLDER_IMG} alt={item.name} className="related-img-primary" />
                                                </div>
                                            </Link>
                                            <div className="related-info">
                                                <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <h5 className="related-name">{item.name}</h5>
                                                </Link>
                                                <p className="related-price">₹{(item.wholesalePrice || item.discountPrice || item.regularPrice || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="carousel-btn carousel-next" onClick={() => { const el = document.getElementById('wp-upsell-track'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}>›</button>
                            </div>
                        </section>
                    )}

                    {/* You May Also Like (Cross-sells) */}
                    {crossSellProducts.length > 0 && (
                        <section className="related-products-section">
                            <h3 className="related-heading">You May Also Like</h3>
                            <div className="related-carousel">
                                <button className="carousel-btn carousel-prev" onClick={() => { const el = document.getElementById('wp-crossell-track'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}>‹</button>
                                <div className="related-carousel-track" id="wp-crossell-track">
                                    {crossSellProducts.map(item => (
                                        <div key={item.id} className="related-card">
                                            <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="related-image-wrapper">
                                                    <img src={getGalleryImage(item) || PLACEHOLDER_IMG} alt={item.name} className="related-img-primary" />
                                                </div>
                                            </Link>
                                            <div className="related-info">
                                                <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <h5 className="related-name">{item.name}</h5>
                                                </Link>
                                                <p className="related-price">₹{(item.wholesalePrice || item.discountPrice || item.regularPrice || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="carousel-btn carousel-next" onClick={() => { const el = document.getElementById('wp-crossell-track'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}>›</button>
                            </div>
                        </section>
                    )}

                    {/* Related Products */}
                    <section className="related-products-section">
                        <h3 className="related-heading">More Wholesale Products</h3>
                        {relatedProducts.length > 0 && (
                            <div className="related-carousel">
                                <button className="carousel-btn carousel-prev" onClick={() => { const el = document.getElementById('wp-related-track'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}>‹</button>
                                <div className="related-carousel-track" id="wp-related-track">
                                    {relatedProducts.map(item => (
                                        <div key={item.id} className="related-card">
                                            <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="related-image-wrapper">
                                                    <img src={getGalleryImage(item) || PLACEHOLDER_IMG} alt={item.name} className="related-img-primary" />
                                                </div>
                                            </Link>
                                            <div className="related-info">
                                                <Link to={`/wholesale/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <h5 className="related-name">{item.name}</h5>
                                                </Link>
                                                <p className="related-price">₹{(item.wholesalePrice || item.discountPrice || item.regularPrice || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="carousel-btn carousel-next" onClick={() => { const el = document.getElementById('wp-related-track'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}>›</button>
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default WholesaleProductPage;
