import React, { useState } from 'react';
import { X, Star, ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductModal.css';

const ProductModal = ({ product, onClose }) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    // Mock extra data if not present in product object
    const images = product.images || [product.image, product.image, product.image, product.image];
    const details = product.details || {
        material: "100% Organic Material",
        dimensions: "Standard Size",
        origin: "Handmade Locally",
        care: "Hand wash only"
    };

    if (!product) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-body">
                    {/* Left Column: Images */}
                    <div className="modal-images-column">
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
                    <div className="modal-details-column">
                        <div className="modal-breadcrumb">
                            HOME &gt; ARTISAN SERIES &gt; <span className="highlight">{product.category || 'PRODUCTS'}</span>
                        </div>

                        <h2 className="modal-title">{product.name}</h2>

                        <div className="modal-price-row">
                            <span className="modal-price">${product.price.toFixed(2)}</span>
                            <div className="modal-rating">
                                <div className="stars">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < 4 ? "#FFC107" : "#eee"} color={i < 4 ? "#FFC107" : "#eee"} />
                                    ))}
                                </div>
                                <span className="review-count">({product.reviews || 0} reviews)</span>
                            </div>
                        </div>

                        <p className="modal-description">
                            Experience the warmth of artisanal craftsmanship. Each piece is meticulously handmade using traditional techniques, featuring unique details that complement any modern interior.
                        </p>

                        <div className="product-specs">
                            <div className="spec-item">
                                <span className="spec-label">MATERIAL</span>
                                <span className="spec-value">{details.material}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">DIMENSIONS</span>
                                <span className="spec-value">{details.dimensions}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">ORIGIN</span>
                                <span className="spec-value">{details.origin}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">CARE</span>
                                <span className="spec-value">{details.care}</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <div className="quantity-selector">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)}><Plus size={16} /></button>
                            </div>
                            <button
                                className="add-to-cart-btn"
                                onClick={() => {
                                    addToCart(product, quantity, { size: 'Standard', color: 'Default' });
                                    onClose();
                                }}
                            >
                                <ShoppingBag size={18} /> Add to Cart
                            </button>
                        </div>

                        <div className="view-full-details">
                            View Full Details <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
