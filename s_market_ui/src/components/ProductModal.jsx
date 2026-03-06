import React, { useState } from 'react';
import { X, Star, ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { BACKEND_URL } from '../api/api';
import './ProductModal.css';

const ProductModal = ({ product, onClose }) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    // Filter unique images and handle BACKEND_URL
    const productImages = [];
    if (product.media && product.media.length > 0) {
        product.media.forEach(m => {
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
                                        <span className="product-modal-price-new">₹{parseFloat(product.discountPrice).toFixed(2)}</span>
                                        <span className="product-modal-price-old">₹{parseFloat(product.regularPrice).toFixed(2)}</span>
                                        <span className="discount-badge-modal">
                                            -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                                        </span>
                                    </>
                                ) : (
                                    <span className="product-modal-price-new">₹{parseFloat(product.regularPrice || product.price || 0).toFixed(2)}</span>
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
                            {product.description || product.shortDescription || "Experience the warmth of artisanal craftsmanship. Each piece is meticulously handmade using traditional techniques."}
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
                                        price: product.price || product.discountPrice || product.regularPrice || 0
                                    }, quantity, { size: 'Standard', color: 'Default' });
                                    onClose();
                                }}
                            >
                                <ShoppingBag size={18} /> Add to Cart
                            </button>
                        </div>

                        <Link to={`/product/${product.id}`} className="view-full-details" onClick={onClose}>
                            View Full Details <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
