import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Info, Zap, Ticket, Percent, Hash, PlusSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './CreatePromotion.css';

const CreatePromotion = () => {
    const navigate = useNavigate();

    // Form State
    const [promoName, setPromoName] = useState('');
    const [promoType, setPromoType] = useState('automatic'); // 'automatic' or 'coupon'
    const [couponCode, setCouponCode] = useState('');
    const [discountType, setDiscountType] = useState('percentage'); // 'percentage', 'fixed', 'bogo'
    const [discountValue, setDiscountValue] = useState('');

    const generateCouponCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCouponCode(result);
    };

    return (
        <VendorLayout>
            <div className="create-promo-container">
                {/* Breadcrumbs & Back Navigation */}
                <div className="breadcrumb-nav">
                    <div className="breadcrumbs">
                        <Link to="/vendor/promotions">Promotions</Link>
                        <ChevronRight size={14} className="breadcrumb-separator" />
                        <span className="current-page">Create New</span>
                    </div>
                    <button className="btn-back" onClick={() => navigate('/vendor/promotions')}>
                        <ChevronLeft size={20} />
                        Back
                    </button>
                </div>

                {/* Header */}
                <div className="create-promo-header">
                    <h1>Create New Promotion</h1>
                    <p>Set up a new discount or coupon code to boost your sales and attract more customers.</p>
                </div>

                <div className="promo-form-content">
                    {/* Section 1: Basic Information */}
                    <div className="form-section-card">
                        <div className="section-title">
                            <div className="section-icon-circle bg-red-badge">
                                <Info size={16} className="text-red-icon" />
                            </div>
                            <h2>1. Basic Information</h2>
                        </div>

                        <div className="form-group">
                            <label>Promotion Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Summer Flash Sale 2024"
                                value={promoName}
                                onChange={(e) => setPromoName(e.target.value)}
                            />
                            <span className="input-hint">Customers will see this at checkout.</span>
                        </div>

                        <div className="form-group">
                            <label>Promotion Type</label>
                            <div className="promo-type-grid">
                                <div
                                    className={`type-card ${promoType === 'automatic' ? 'active' : ''}`}
                                    onClick={() => setPromoType('automatic')}
                                >
                                    <div className="type-icon-circle bg-red-light">
                                        <Zap size={20} className="text-red-icon" />
                                    </div>
                                    <div className="type-info">
                                        <div className="type-title">Automatic Sale</div>
                                        <div className="type-desc">Applied automatically at checkout</div>
                                    </div>
                                </div>

                                <div
                                    className={`type-card ${promoType === 'coupon' ? 'active' : ''}`}
                                    onClick={() => setPromoType('coupon')}
                                >
                                    <div className="type-icon-circle bg-grey-light">
                                        <Ticket size={20} className="text-grey-icon" />
                                    </div>
                                    <div className="type-info">
                                        <div className="type-title">Coupon Code</div>
                                        <div className="type-desc">Customers enter a code manually</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {promoType === 'coupon' && (
                            <div className="form-group">
                                <label>Coupon Code</label>
                                <div className="coupon-input-group">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. SUMMER24"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    />
                                    <button
                                        type="button"
                                        className="btn-generate"
                                        onClick={generateCouponCode}
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Discount Details */}
                    <div className="form-section-card">
                        <div className="section-title">
                            <div className="section-icon-circle bg-red-badge">
                                <Ticket size={16} className="text-red-icon" />
                            </div>
                            <h2>2. Discount Details</h2>
                        </div>

                        <div className="discount-details-grid">
                            <div className="form-group">
                                <label>Discount Type</label>
                                <div className="radio-group">
                                    <label className="custom-radio">
                                        <input
                                            type="radio"
                                            name="discountType"
                                            checked={discountType === 'percentage'}
                                            onChange={() => setDiscountType('percentage')}
                                        />
                                        <span className="radio-mark"></span>
                                        Percentage (%)
                                    </label>
                                    <label className="custom-radio">
                                        <input
                                            type="radio"
                                            name="discountType"
                                            checked={discountType === 'fixed'}
                                            onChange={() => setDiscountType('fixed')}
                                        />
                                        <span className="radio-mark"></span>
                                        Fixed Amount ($)
                                    </label>
                                    <label className="custom-radio">
                                        <input
                                            type="radio"
                                            name="discountType"
                                            checked={discountType === 'bogo'}
                                            onChange={() => setDiscountType('bogo')}
                                        />
                                        <span className="radio-mark"></span>
                                        Buy X Get Y
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Discount Value</label>
                                <div className="input-with-suffix">
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        disabled={discountType === 'bogo'}
                                    />
                                    <span className="input-suffix">
                                        {discountType === 'percentage' ? '%' : (discountType === 'fixed' ? '$' : '-')}
                                    </span>
                                </div>
                                <span className="input-hint">
                                    Example: A ₹100 product will cost {
                                        discountType === 'percentage' ? `$${100 - (Number(discountValue) || 0)}` :
                                            (discountType === 'fixed' ? `$${100 - (Number(discountValue) || 0)}` : 'N/A')
                                    }.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="create-promo-footer">
                    <div className="autosave-status">
                        <PlusSquare size={16} className="text-red-icon" />
                        <span>All changes are autosaved to drafts.</span>
                    </div>
                    <div className="footer-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate('/vendor/promotions')}
                        >
                            Cancel
                        </button>
                        <button type="button" className="btn-submit">
                            Create Promotion
                        </button>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default CreatePromotion;
