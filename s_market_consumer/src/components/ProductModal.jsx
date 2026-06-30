'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Star, ArrowRight, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { BACKEND_URL } from '@/lib/api/shared';
import './ProductModal.css';

const ProductModal = ({ product, onClose }) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    // Instagram state
    const [instagramLightboxIndex, setInstagramLightboxIndex] = useState(-1);
    const [instagramSliderIndex, setInstagramSliderIndex] = useState(0);
    const [instaFeedHovered, setInstaFeedHovered] = useState(false);
    const [inlineReelIndex, setInlineReelIndex] = useState(-1);
    const inlineReelRef = useRef(null);

    const extractInstagramShortcode = (url) => {
        if (!url) return null;
        const match = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/)([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const isInstagramReel = (url) => {
        return url && url.includes('/reel/');
    };

    const getInstagramEmbedUrl = (url) => {
        const shortcode = extractInstagramShortcode(url);
        return shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null;
    };

    // Close inline reel when clicking outside
    useEffect(() => {
        if (inlineReelIndex < 0) return;
        const handleClick = (e) => {
            if (inlineReelRef.current && !inlineReelRef.current.contains(e.target)) {
                setInlineReelIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [inlineReelIndex]);

    // Auto-play Instagram feed slider
    useEffect(() => {
        if (instagramMedia.length <= 3 || instaFeedHovered || inlineReelIndex >= 0) return;
        const timer = setInterval(() => {
            setInstagramSliderIndex(prev => {
                const maxIndex = Math.max(0, instagramMedia.length - 3);
                return prev >= maxIndex ? 0 : prev + 3;
            });
        }, 4000);
        return () => clearInterval(timer);
    }, [instagramMedia.length, instaFeedHovered, inlineReelIndex]);

    // Filter unique images and handle BACKEND_URL
    const galleryMedia = product?.media?.filter(m => m.fileName && m.fileType !== 'video-url' && m.fileType !== 'instagram-url') || [];
    const productImages = [];
    if (galleryMedia.length > 0) {
        galleryMedia.forEach(m => {
            productImages.push(`${BACKEND_URL}/uploads/products/${m.fileName}`);
        });
    } else if (product.image) {
        productImages.push(product.image);
    }

    if (productImages.length === 0) {
        productImages.push('https://placehold.co/800x800?text=No+Image');
    }

    // Ensure only unique images are shown
    const images = [...new Set(productImages)];

    // Instagram media
    const instagramMedia = product?.media?.filter(m => m.fileName && m.fileType === 'instagram-url') || [];
    const instagramFeedLayout = product?.instagramFeedLayout || 'slider';

    // Use original attributes if present
    const attributes = product.attributes || [];

    if (!product) return null;

    return (
        <div className="product-modal-overlay" onClick={onClose}>
            <div className="product-modal-content" onClick={e => e.stopPropagation()}>
                <button className="product-modal-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="product-modal-body">
                    {/* Left Column: Images */}
                    <div className="product-modal-images-column">
                        <div className="main-image-wrapper">
                            <img src={images[selectedImage]} alt={product.name} />
                        </div>
                        <div className="thumbnail-row">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(idx)}
                                >
                                    <img src={img} alt={`${product.name} view ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="product-modal-details-column">
                        <h2 className="product-modal-title">{product.name}</h2>

                        <div className="product-modal-price-row">
                            <div className="price-container-modal">
                                {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice ? (
                                    <>
                                        <span className="product-modal-price-new">&#8377;{parseFloat(product.discountPrice).toFixed(2)}</span>
                                        <span className="product-modal-price-old">&#8377;{parseFloat(product.regularPrice).toFixed(2)}</span>
                                        <span className="discount-badge-modal">
                                            -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                                        </span>
                                    </>
                                ) : (
                                    <span className="product-modal-price-new">&#8377;{parseFloat(product.regularPrice || product.price || 0).toFixed(2)}</span>
                                )}
                            </div>
                        </div>

                        <div className="product-modal-rating">
                            <span className="numeric-rating">{(product.averageRating || 0).toFixed(1)}</span>
                            <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        fill={i < Math.round(product.averageRating || 0) ? "#FFB800" : "#eee"}
                                        color={i < Math.round(product.averageRating || 0) ? "#FFB800" : "#eee"}
                                    />
                                ))}
                            </div>
                            <span className="review-count">({product.reviewCount || 0} reviews)</span>
                        </div>

                        <p className="product-modal-description">
                            {product.shortDescription || product.description || "Experience the warmth of artisanal craftsmanship. Each piece is meticulously handmade using traditional techniques."}
                        </p>

                        {(product.brandDescription || product.vendor?.description) && (
                            <div className="brand-description-section">
                                <h4 className="brand-description-title">About the Brand</h4>
                                <p className="brand-description-text">
                                    {product.brandDescription || product.vendor?.description}
                                </p>
                            </div>
                        )}

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
                            {product.weight && (
                                <div className="spec-item">
                                    <span className="spec-label">WEIGHT</span>
                                    <span className="spec-value">{product.weight} kg</span>
                                </div>
                            )}
                            {attributes.map((attr, idx) => (
                                <div className="spec-item" key={idx}>
                                    <span className="spec-label">{attr.name?.toUpperCase()}</span>
                                    <span className="spec-value">{attr.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="product-modal-actions">
                            <div className="quantity-selector">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)}><Plus size={16} /></button>
                            </div>
                            <button
                                className="add-to-cart-btn"
                                onClick={() => {
                                    addToCart({
                                        ...product,
                                        image: images[selectedImage],
                                        price: product.price || product.discountPrice || product.regularPrice || 0
                                    }, quantity, { size: 'Standard', color: 'Default' });
                                    onClose();
                                }}
                            >
                                <ShoppingBag size={18} /> Add to Cart
                            </button>
                        </div>

                        <Link href={`/product/${product.id}`} className="view-full-details" onClick={onClose}>
                            View Full Details <ArrowRight size={16} />
                        </Link>

                        {instagramMedia.length > 0 && (
                            <section className="modal-instafeed-section">
                                <div className="modal-instafeed-header">
                                    <div className="modal-instafeed-brand">
                                        <svg viewBox="0 0 24 24" className="modal-instafeed-logo" fill="none" stroke="none" width="20" height="20">
                                            <defs>
                                                <linearGradient id="instaGradModal" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#FFDC80"/>
                                                    <stop offset="25%" stopColor="#F77737"/>
                                                    <stop offset="50%" stopColor="#E1306C"/>
                                                    <stop offset="75%" stopColor="#C13584"/>
                                                    <stop offset="100%" stopColor="#833AB4"/>
                                                </linearGradient>
                                            </defs>
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instaGradModal)"/>
                                            <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.5"/>
                                            <circle cx="18" cy="6" r="1.2" fill="#fff"/>
                                        </svg>
                                        <span>Instagram</span>
                                    </div>
                                    <a href={instagramMedia[0]?.fileName?.replace(/\/[^/]+$/, '') || '#'} target="_blank" rel="noopener noreferrer" className="modal-instafeed-view-link">View Gallery →</a>
                                </div>

                                {instagramFeedLayout === 'slider' ? (
                                    <div className="modal-instafeed-slider" onMouseEnter={() => setInstaFeedHovered(true)} onMouseLeave={() => setInstaFeedHovered(false)}>
                                        <button
                                            className="modal-instafeed-slider-btn modal-instafeed-slider-prev"
                                            onClick={() => setInstagramSliderIndex(prev => Math.max(0, prev - 3))}
                                            style={{ display: instagramMedia.length <= 3 ? 'none' : 'flex' }}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <div className="modal-instafeed-slider-track">
                                            <div className="modal-instafeed-slider-wrapper" style={{ transform: `translateX(-${instagramSliderIndex * 33.33}%)` }}>
                                                {instagramMedia.map((img, index) => {
                                                    const shortcode = extractInstagramShortcode(img.fileName);
                                                    const thumbUrl = shortcode ? `${BACKEND_URL}/api/instagram/thumbnail?shortcode=${shortcode}` : null;
                                                    const reel = isInstagramReel(img.fileName);
                                                    const isPlaying = inlineReelIndex === index;
                                                    return (
                                                        <div
                                                            key={img.id}
                                                            className={`modal-instafeed-card${isPlaying ? ' is-playing' : ''}`}
                                                            onClick={() => {
                                                                if (reel) {
                                                                    setInlineReelIndex(isPlaying ? -1 : index);
                                                                } else {
                                                                    setInstagramLightboxIndex(index);
                                                                }
                                                            }}
                                                        >
                                                            <div className="modal-instafeed-card-inner">
                                                                {isPlaying ? (
                                                                    <div className="modal-instafeed-inline-player" ref={inlineReelRef} onClick={(e) => e.stopPropagation()}>
                                                                        <iframe
                                                                            src={`https://www.instagram.com/p/${shortcode}/embed/?autoplay=1`}
                                                                            title="Instagram Reel"
                                                                            className="modal-instafeed-inline-iframe"
                                                                            allow="autoplay; encrypted-media"
                                                                            allowFullScreen
                                                                        />
                                                                        <button className="modal-instafeed-inline-close" onClick={() => setInlineReelIndex(-1)}>&times;</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {thumbUrl && (
                                                                            <img src={thumbUrl} alt="Instagram post" className="modal-instafeed-thumb" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                                                        )}
                                                                        <div className="modal-instafeed-card-fallback">
                                                                            <svg viewBox="0 0 24 24" className="modal-instafeed-card-icon" fill="none" stroke="none" width="28" height="28">
                                                                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instaGradModal)"/>
                                                                                <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.5"/>
                                                                                <circle cx="18" cy="6" r="1.2" fill="#fff"/>
                                                                            </svg>
                                                                        </div>
                                                                        {reel && (
                                                                            <div className="modal-instafeed-reel-badge">
                                                                                <Play size={14} fill="#fff" />
                                                                            </div>
                                                                        )}
                                                                        <div className="modal-instafeed-overlay">
                                                                            <span className="modal-instafeed-overlay-text">View Post</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <button
                                            className="modal-instafeed-slider-btn modal-instafeed-slider-next"
                                            onClick={() => setInstagramSliderIndex(prev => Math.min(prev + 3, Math.max(0, instagramMedia.length - 3)))}
                                            style={{ display: instagramMedia.length <= 3 ? 'none' : 'flex' }}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="modal-instafeed-grid">
                                        {instagramMedia.map((img, index) => {
                                            const shortcode = extractInstagramShortcode(img.fileName);
                                            const thumbUrl = shortcode ? `${BACKEND_URL}/api/instagram/thumbnail?shortcode=${shortcode}` : null;
                                            const reel = isInstagramReel(img.fileName);
                                            const isPlaying = inlineReelIndex === index;
                                            return (
                                                <div
                                                    key={img.id}
                                                    className={`modal-instafeed-card${isPlaying ? ' is-playing' : ''}`}
                                                    onClick={() => {
                                                        if (reel) {
                                                            setInlineReelIndex(isPlaying ? -1 : index);
                                                        } else {
                                                            setInstagramLightboxIndex(index);
                                                        }
                                                    }}
                                                >
                                                    <div className="modal-instafeed-card-inner">
                                                        {isPlaying ? (
                                                            <div className="modal-instafeed-inline-player" ref={inlineReelRef} onClick={(e) => e.stopPropagation()}>
                                                                <iframe
                                                                    src={`https://www.instagram.com/p/${shortcode}/embed/?autoplay=1`}
                                                                    title="Instagram Reel"
                                                                    className="modal-instafeed-inline-iframe"
                                                                    allow="autoplay; encrypted-media"
                                                                    allowFullScreen
                                                                />
                                                                <button className="modal-instafeed-inline-close" onClick={() => setInlineReelIndex(-1)}>&times;</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {thumbUrl && (
                                                                    <img src={thumbUrl} alt="Instagram post" className="modal-instafeed-thumb" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                                                )}
                                                                <div className="modal-instafeed-card-fallback">
                                                                    <svg viewBox="0 0 24 24" className="modal-instafeed-card-icon" fill="none" stroke="none" width="28" height="28">
                                                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instaGradModal)"/>
                                                                        <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.5"/>
                                                                        <circle cx="18" cy="6" r="1.2" fill="#fff"/>
                                                                    </svg>
                                                                </div>
                                                                {reel && (
                                                                    <div className="modal-instafeed-reel-badge">
                                                                        <Play size={14} fill="#fff" />
                                                                    </div>
                                                                )}
                                                                <div className="modal-instafeed-overlay">
                                                                    <span className="modal-instafeed-overlay-text">View Post</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Instagram Lightbox */}
                                {instagramLightboxIndex >= 0 && instagramMedia[instagramLightboxIndex] && (
                                    <div className="modal-instafeed-lightbox-overlay" onClick={() => setInstagramLightboxIndex(-1)}>
                                        <div className="modal-instafeed-lightbox-content" onClick={(e) => e.stopPropagation()}>
                                            <button className="modal-instafeed-lightbox-close" onClick={() => setInstagramLightboxIndex(-1)}>&times;</button>
                                            <div className="modal-instafeed-lightbox-body">
                                                <div className="modal-instafeed-lightbox-embed">
                                                    <iframe
                                                        src={getInstagramEmbedUrl(instagramMedia[instagramLightboxIndex].fileName)}
                                                        title="Instagram Post"
                                                        className="modal-instafeed-lightbox-iframe"
                                                        allow="autoplay; encrypted-media"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            </div>
                                            {instagramMedia.length > 1 && (
                                                <div className="modal-instafeed-lightbox-nav">
                                                    <button
                                                        className="modal-instafeed-lightbox-nav-btn prev"
                                                        onClick={() => setInstagramLightboxIndex(prev => (prev - 1 + instagramMedia.length) % instagramMedia.length)}
                                                    >
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                    <div className="modal-instafeed-lightbox-counter">
                                                        {instagramLightboxIndex + 1} / {instagramMedia.length}
                                                    </div>
                                                    <button
                                                        className="modal-instafeed-lightbox-nav-btn next"
                                                        onClick={() => setInstagramLightboxIndex(prev => (prev + 1) % instagramMedia.length)}
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Slider dots */}
                                {instagramFeedLayout === 'slider' && instagramMedia.length > 3 && (
                                    <div className="modal-instafeed-dots">
                                        {Array.from({ length: Math.ceil(instagramMedia.length / 3) }, (_, i) => (
                                            <button
                                                key={i}
                                                className={`modal-instafeed-dot ${i * 3 === instagramSliderIndex ? 'active' : ''}`}
                                                onClick={() => setInstagramSliderIndex(i * 3)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
