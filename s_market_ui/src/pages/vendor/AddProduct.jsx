import React, { useState } from 'react';
import { Image as ImageIcon, Plus, ArrowLeft, ChevronRight } from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './AddProduct.css';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
    const navigate = useNavigate();

    const [regularPrice, setRegularPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [priceError, setPriceError] = useState('');
    const [initialStock, setInitialStock] = useState('');
    const [supportsWholesale, setSupportsWholesale] = useState(false);
    const [wholesaleDiscountType, setWholesaleDiscountType] = useState('percentage');

    const handleInitialStockChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            setInitialStock('');
            return;
        }
        const num = parseInt(val, 10);
        if (num < 0) {
            setInitialStock('0');
        } else {
            setInitialStock(num.toString());
        }
    };

    const handleRegularPriceChange = (e) => {
        const val = e.target.value;
        setRegularPrice(val);
        validatePrices(val, discountPrice);
    };

    const handleDiscountPriceChange = (e) => {
        const val = e.target.value;
        setDiscountPrice(val);
        validatePrices(regularPrice, val);
    };

    const validatePrices = (reg, disc) => {
        if (reg && disc && parseFloat(disc) >= parseFloat(reg)) {
            setPriceError('Discount price must be less than regular price');
        } else {
            setPriceError('');
        }
    };

    const handleCancel = () => {
        navigate('/vendor/products');
    };

    return (
        <VendorLayout>
            <div className="add-product-container">

                {/* Back Button & Breadcrumbs */}
                <div className="add-product-top-nav">

                    <div className="breadcrumbs">
                        <span className="breadcrumb-item" onClick={handleCancel}>My Products</span>
                        <ChevronRight size={14} color="#888" />
                        <span className="breadcrumb-item active">Add New Product</span>
                    </div>
                    <button className="btn-back" onClick={handleCancel}>
                        <ArrowLeft size={16} />
                        Back to Products
                    </button>

                </div>

                {/* Header */}
                <div className="add-product-header">
                    <div>
                        <h1>Add New Product</h1>
                        <p>List a new item in your marketplace store.</p>
                    </div>
                    {/* <div className="header-actions">
                        <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
                        <button className="btn-primary">Save Product</button>
                    </div> */}
                </div>

                {/* Form Content */}

                {/* Section 1: Basic Information */}
                <div className="form-section">
                    <div className="section-header">
                        <div className="step-indicator">1</div>
                        <h2>Basic Information</h2>
                    </div>

                    <div className="form-group">
                        <label>Product Name</label>
                        <input type="text" className="form-control" placeholder="e.g. Minimalist Oak Coffee Table" />
                    </div>

                    <div className="form-group">
                        <label>Product Type</label>
                        <select className="form-control" defaultValue="single">
                            <option value="single">Single Product</option>
                            <option value="grouped">Grouped Product</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group form-col">
                            <label>Category</label>
                            <select className="form-control">
                                <option value="">Select Category</option>
                                <option value="furniture">Furniture</option>
                                <option value="electronics">Electronics</option>
                                <option value="smart-home">Smart Home</option>
                                <option value="solar">Solar Energy</option>
                            </select>
                        </div>
                        <div className="form-group form-col">
                            <label>Brand</label>
                            <input type="text" className="form-control" defaultValue="EmpowerHome Basics" />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Description</label>
                        <textarea className="form-control" placeholder="Provide a detailed description of the product features and benefits..."></textarea>
                    </div>
                </div>

                {/* Section 2: Pricing & Inventory */}
                <div className="form-section">
                    <div className="section-header">
                        <div className="step-indicator">2</div>
                        <h2>Pricing & Inventory</h2>
                    </div>

                    <div className="pricing-grid">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Regular Price (₹)</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="0.00"
                                value={regularPrice}
                                onChange={handleRegularPriceChange}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Discount Price (₹)</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="0.00"
                                value={discountPrice}
                                onChange={handleDiscountPriceChange}
                                style={{ borderColor: priceError ? '#E03E1A' : undefined }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>SKU</label>
                            <input type="text" className="form-control" placeholder="EHOME-001" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Initial Stock</label>
                            <input
                                type="number"
                                min="0"
                                className="form-control"
                                placeholder="100"
                                value={initialStock}
                                onChange={handleInitialStockChange}
                            />
                        </div>
                    </div>
                    {priceError && (
                        <div style={{ color: '#E03E1A', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                            {priceError}
                        </div>
                    )}

                    <div className="checkbox-group" style={{ marginTop: '1.5rem', marginBottom: supportsWholesale ? '1rem' : 0 }}>
                        <input
                            type="checkbox"
                            id="supportsWholesale"
                            className="checkbox-custom"
                            checked={supportsWholesale}
                            onChange={(e) => setSupportsWholesale(e.target.checked)}
                        />
                        <label htmlFor="supportsWholesale">This product supports wholesale</label>
                    </div>

                    {supportsWholesale && (
                        <div className="pricing-grid" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Wholesale Price (₹)</label>
                                <input type="number" min="0" className="form-control" placeholder="0.00" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Minimum Order Quantity</label>
                                <input type="number" min="1" className="form-control" placeholder="10" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Discount Type</label>
                                <select
                                    className="form-control"
                                    value={wholesaleDiscountType}
                                    onChange={(e) => setWholesaleDiscountType(e.target.value)}
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                            {wholesaleDiscountType === 'percentage' && (
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Discount Value</label>
                                    <select className="form-control" defaultValue="5">
                                        <option value="5">5%</option>
                                        <option value="10">10%</option>
                                        <option value="15">15%</option>
                                        <option value="20">20%</option>
                                        <option value="25">25%</option>
                                        <option value="30">30%</option>
                                        <option value="40">40%</option>
                                        <option value="50">50%</option>
                                        <option value="60">60%</option>
                                        <option value="70">70%</option>
                                        <option value="75">75%</option>
                                        <option value="80">80%</option>
                                        <option value="90">90%</option>
                                        <option value="100">100%</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 3: Product Media */}
                <div className="form-section">
                    <div className="section-header">
                        <div className="step-indicator">3</div>
                        <h2>Product Media</h2>
                    </div>

                    <div className="upload-zone">
                        <div className="upload-icon-wrapper">
                            <ImageIcon size={24} />
                        </div>
                        <h3>Drag and drop product images here</h3>
                        <p>PNG, JPG, or WEBP up to 10MB each. Suggested ratio 1:1.</p>
                        <button className="btn-file">Browse files</button>
                    </div>

                    <div className="image-preview-row">
                        <button className="add-thumbnail-btn">
                            <Plus size={24} />
                        </button>
                        <button className="add-thumbnail-btn">
                            <Plus size={24} />
                        </button>
                        <button className="add-thumbnail-btn">
                            <Plus size={24} />
                        </button>
                    </div>
                </div>

                {/* Section 4: Attributes */}
                <div className="form-section">
                    <div className="section-header">
                        <div className="step-indicator">4</div>
                        <h2>Attributes</h2>
                    </div>

                    <div className="attributes-grid">
                        <div className="form-group">
                            <label>Material</label>
                            <input type="text" className="form-control" placeholder="Solid Oak, Metal" />
                        </div>
                        <div className="form-group">
                            <label>Dimensions (L x W x H)</label>
                            <input type="text" className="form-control" placeholder="120 x 60 x 45 cm" />
                        </div>
                        <div className="form-group">
                            <label>Country of Origin</label>
                            <select className="form-control">
                                <option value="us">United States</option>
                                <option value="cn">China</option>
                                <option value="in">India</option>
                                <option value="uk">United Kingdom</option>
                            </select>
                        </div>
                    </div>

                    <div className="checkbox-group">
                        <input type="checkbox" id="fragileHandling" className="checkbox-custom" />
                        <label htmlFor="fragileHandling">This product requires special fragile shipping handling</label>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="form-footer-actions">
                    <button className="btn-secondary" onClick={handleCancel}>Discard</button>
                    <button className="btn-primary">Save Product</button>
                </div>

            </div>
        </VendorLayout>
    );
};

export default AddProduct;