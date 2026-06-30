'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    Truck,
    CreditCard,
    CheckCircle2,
    Lock,
    ShieldCheck,
    RotateCcw,
    Info,
    Check,
    Wallet,
    Smartphone,
    CreditCard as CardIcon,
    ArrowRight,
    Printer,
    HelpCircle,
    Share2,
    Heart,
    Loader2
} from 'lucide-react';
import { fetchUserAddresses, createOrder, createRazorpayOrder, verifyRazorpayPayment, getRazorpayConfig, loadRazorpayScript } from '@/lib/api/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { cartItems, cartTotal, cartCount, clearCart } = useCart();
    const { userId } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
    const [deliveryMethod, setDeliveryMethod] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);

    // Address states
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        fullName: '',
        streetAddress: '',
        city: '',
        state: 'Andhra Pradesh',
        zipCode: '',
        phoneNumber: '',
        country: 'IN'
    });

    // Fetch addresses on mount
    useEffect(() => {
        if (userId) {
            loadAddresses(userId);
        } else {
            setLoadingAddresses(false);
            setShowNewAddressForm(true);
        }
    }, [userId]);

    const loadAddresses = async (uid) => {
        try {
            const data = await fetchUserAddresses(uid);
            setAddresses(data);

            const defaultAddr = data.find(addr => addr.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
                setFormData({
                    fullName: defaultAddr.fullName || '',
                    streetAddress: defaultAddr.streetAddress || '',
                    city: defaultAddr.city || '',
                    state: defaultAddr.state || 'Andhra Pradesh',
                    zipCode: defaultAddr.zipCode || '',
                    phoneNumber: defaultAddr.phoneNumber || '',
                    country: defaultAddr.country || 'IN'
                });
            } else if (data.length > 0) {
                setSelectedAddressId(data[0].id);
                setFormData({
                    fullName: data[0].fullName || '',
                    streetAddress: data[0].streetAddress || '',
                    city: data[0].city || '',
                    state: data[0].state || 'Andhra Pradesh',
                    zipCode: data[0].zipCode || '',
                    phoneNumber: data[0].phoneNumber || '',
                    country: data[0].country || 'IN'
                });
            } else {
                setShowNewAddressForm(true);
            }
        } catch (error) {
            console.error("Failed to load addresses:", error);
            setShowNewAddressForm(true);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleAddressSelect = (addr) => {
        setSelectedAddressId(addr.id);
        setFormData({
            fullName: addr.fullName || '',
            streetAddress: addr.streetAddress || '',
            city: addr.city || '',
            state: addr.state || 'Andhra Pradesh',
            zipCode: addr.zipCode || '',
            phoneNumber: addr.phoneNumber || '',
            country: addr.country || 'IN'
        });
        setShowNewAddressForm(false);
    };

    /**
     * Handles the complete Razorpay payment flow:
     * 1. Creates a Razorpay order via backend
     * 2. Opens Razorpay checkout modal
     * 3. Verifies payment signature after success
     * 4. Creates the order in the system
     */
    const handleRazorpayPayment = async () => {
        setIsPlacingOrder(true);
        try {
            // Guest checkout — userId can be undefined; backend auto-creates a guest user

            const productQuantities = {};
            cartItems.forEach(item => {
                productQuantities[item.id] = (productQuantities[item.id] || 0) + item.quantity;
            });

            const orderNumber = "#EH-" + Math.random().toString(36).substr(2, 8).toUpperCase();
            const amountInPaise = Math.round(finalTotal * 100);

            // Step 1: Get Razorpay config
            const config = await getRazorpayConfig();

            // Step 2: Create a Razorpay order
            const razorpayOrder = await createRazorpayOrder({
                amount: amountInPaise,
                currency: 'INR',
                receipt: orderNumber.replace('#', ''),
                notes: {
                    userId: String(userId),
                    orderNumber: orderNumber
                }
            });

            // Step 3: Load Razorpay checkout script
            await loadRazorpayScript();

            // Step 4: Open Razorpay checkout
            const options = {
                key: config.key_id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'SreeMarket',
                description: `Order ${orderNumber}`,
                order_id: razorpayOrder.id,
                prefill: {
                    name: formData.fullName || '',
                    contact: formData.phoneNumber || '',
                },
                theme: {
                    color: '#FF5722'
                },
                modal: {
                    ondismiss: () => {
                        setIsPlacingOrder(false);
                    }
                },
                handler: async function (response) {
                    try {
                        // Step 5: Verify payment signature
                        const verificationResult = await verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verificationResult.isValid) {
                            // Step 6: Create the actual order
                            const orderData = {
                                userId: userId,
                                vendorId: cartItems.length > 0 ? cartItems[0].vendorId : null,
                                customerName: formData.fullName || 'Guest',
                                deliveryLocation: formData.city ? `${formData.city}, ${formData.state}` : 'N/A',
                                country: formData.country,
                                estimatedDelivery: selectedDelivery ? selectedDelivery.time : 'N/A',
                                totalAmount: finalTotal,
                                status: 'PROCESSING',
                                images: cartItems.map(item => item.image).slice(0, 5),
                                additionalItems: cartItems.length > 5 ? cartItems.length - 5 : 0,
                                productQuantities: productQuantities,
                                impactNote: "This order supports fair wages and community education funds.",
                                orderNumber: orderNumber,
                                paymentId: response.razorpay_payment_id,
                                paymentMethod: 'razorpay'
                            };

                            const result = await createOrder(orderData);
                            setPlacedOrder({ ...result, paymentId: response.razorpay_payment_id });
                            clearCart();
                            setStep(3);
                            window.scrollTo(0, 0);
                        } else {
                            alert('Payment verification failed. Please contact support.');
                        }
                    } catch (err) {
                        console.error("Order creation after payment failed:", err);
                        alert('Payment was successful but order creation failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
                    } finally {
                        setIsPlacingOrder(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.error('Payment failed:', response.error);
                alert('Payment failed: ' + (response.error?.description || 'Please try again.'));
                setIsPlacingOrder(false);
            });

            rzp.open();
        } catch (error) {
            console.error("Payment initialization failed:", error);
            alert("Failed to initialize payment. Please try again.");
            setIsPlacingOrder(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const deliveryOptions = [
        {
            id: 'standard',
            name: 'Standard Delivery',
            price: 0,
            time: 'Arrives Oct 24 - Oct 26 (3-5 business days)',
            label: 'Free'
        },
        {
            id: 'express',
            name: 'Express Shipping',
            price: 15.00,
            time: 'Arrives Oct 22 - Oct 23 (1-2 business days)',
            label: '₹15.00'
        },
        {
            id: 'overnight',
            name: 'Priority Overnight',
            price: 35.00,
            time: 'Arrives Oct 21 by 12:00 PM',
            label: '₹35.00'
        }
    ];

    const selectedDelivery = deliveryOptions.find(opt => opt.id === deliveryMethod);
    const shippingCost = selectedDelivery ? selectedDelivery.price : 0;
    const estimatedTax = cartTotal * 0.07; // 7% tax example
    const finalTotal = cartTotal + shippingCost + estimatedTax;

    const steps = [
        { id: 1, name: 'SHIPPING', icon: <MapPin size={18} /> },
        { id: 2, name: 'PAYMENT', icon: <CreditCard size={18} /> },
        { id: 3, name: 'REVIEW', icon: <CheckCircle2 size={18} /> }
    ];

    return (
        <>
        <Navbar />
        <div className="checkout-page">
            {/* Header / Stepper */}
            <header className="checkout-header">
                <div className="checkout-container">
                    <div className="stepper">
                        {steps.map((s, index) => (
                            <React.Fragment key={s.id}>
                                <div className={`step ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`}>
                                    <div className="step-number">
                                        {step > s.id ? <Check size={16} /> : s.id}
                                    </div>
                                    <span className="step-name">{s.name}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`step-line ${step > s.id ? 'active' : ''}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </header>

            <main className="checkout-main">
                <div className="checkout-container">
                    {step < 3 ? (
                        <div className="checkout-grid">
                            {/* Left Column: Forms */}
                            <div className="checkout-form-section">
                                {step === 1 && (
                                    <div className="shipping-step">
                                        <section className="form-section">
                                            <h2 className="section-title">
                                                <MapPin size={20} className="section-icon" /> Shipping Address
                                            </h2>

                                            {/* Saved Addresses Section */}
                                            {!loadingAddresses && addresses.length > 0 && (
                                                <div className="saved-addresses-list">
                                                    {addresses.map(addr => (
                                                        <div
                                                            key={addr.id}
                                                            className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                                                            onClick={() => handleAddressSelect(addr)}
                                                        >
                                                            <div className="address-card-header">
                                                                <span className="address-name">{addr.fullName}</span>
                                                                {addr.isDefault && <span className="primary-badge">Primary</span>}
                                                                <div className={`radio-circle ${selectedAddressId === addr.id ? 'checked' : ''}`}></div>
                                                            </div>
                                                            <div className="address-details">
                                                                <p>{addr.streetAddress}</p>
                                                                <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                                                                <p>{addr.country === 'IN' ? 'India' : addr.country}</p>
                                                                <p className="address-phone">{addr.phoneNumber}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        className={`add-new-address-btn ${showNewAddressForm ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setShowNewAddressForm(true);
                                                            setSelectedAddressId(null);
                                                            setFormData({
                                                                fullName: '',
                                                                streetAddress: '',
                                                                city: '',
                                                                state: 'Andhra Pradesh',
                                                                zipCode: '',
                                                                phoneNumber: '',
                                                                country: 'IN'
                                                            });
                                                        }}
                                                    >
                                                        + Add New Address
                                                    </button>
                                                </div>
                                            )}

                                            {/* Loading State */}
                                            {loadingAddresses && (
                                                <div className="loading-addresses-indicator">
                                                    <Loader2 className="animate-spin" size={24} />
                                                    <span>Loading saved addresses...</span>
                                                </div>
                                            )}

                                            {/* Address Form */}
                                            {(showNewAddressForm || addresses.length === 0) && !loadingAddresses && (
                                                <div className="new-address-form-container">
                                                    {addresses.length > 0 && <h3 className="new-address-form-title">Enter New Shipping Address</h3>}
                                                    <div className="form-group">
                                                        <label>Full Name</label>
                                                        <input
                                                            type="text"
                                                            name="fullName"
                                                            value={formData.fullName}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter your full name"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Street Address</label>
                                                        <input
                                                            type="text"
                                                            name="streetAddress"
                                                            value={formData.streetAddress}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter your street address"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="form-row">
                                                        <div className="form-group col-city">
                                                            <label>City</label>
                                                            <input
                                                                type="text"
                                                                name="city"
                                                                value={formData.city}
                                                                onChange={handleInputChange}
                                                                placeholder="City"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-group col-state">
                                                            <label>State</label>
                                                            <div className="select-wrapper">
                                                                <select
                                                                    name="state"
                                                                    value={formData.state}
                                                                    onChange={handleInputChange}
                                                                >
                                                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                                                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                                                    <option value="Assam">Assam</option>
                                                                    <option value="Bihar">Bihar</option>
                                                                    <option value="Chhattisgarh">Chhattisgarh</option>
                                                                    <option value="Goa">Goa</option>
                                                                    <option value="Gujarat">Gujarat</option>
                                                                    <option value="Haryana">Haryana</option>
                                                                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                                                                    <option value="Jharkhand">Jharkhand</option>
                                                                    <option value="Karnataka">Karnataka</option>
                                                                    <option value="Kerala">Kerala</option>
                                                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                                                    <option value="Maharashtra">Maharashtra</option>
                                                                    <option value="Manipur">Manipur</option>
                                                                    <option value="Meghalaya">Meghalaya</option>
                                                                    <option value="Mizoram">Mizoram</option>
                                                                    <option value="Nagaland">Nagaland</option>
                                                                    <option value="Odisha">Odisha</option>
                                                                    <option value="Punjab">Punjab</option>
                                                                    <option value="Rajasthan">Rajasthan</option>
                                                                    <option value="Sikkim">Sikkim</option>
                                                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                                                    <option value="Telangana">Telangana</option>
                                                                    <option value="Tripura">Tripura</option>
                                                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                                                    <option value="Uttarakhand">Uttarakhand</option>
                                                                    <option value="West Bengal">West Bengal</option>
                                                                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                                                                    <option value="Chandigarh">Chandigarh</option>
                                                                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                                                                    <option value="Delhi">Delhi</option>
                                                                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                                                                    <option value="Ladakh">Ladakh</option>
                                                                    <option value="Lakshadweep">Lakshadweep</option>
                                                                    <option value="Puducherry">Puducherry</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="form-group col-zip">
                                                            <label>Zip Code</label>
                                                            <input
                                                                type="text"
                                                                name="zipCode"
                                                                value={formData.zipCode}
                                                                onChange={handleInputChange}
                                                                placeholder="Zip"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Country</label>
                                                        <div className="select-wrapper">
                                                            <select
                                                                name="country"
                                                                value={formData.country}
                                                                onChange={handleInputChange}
                                                            >
                                                                <option value="IN">India</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Phone Number</label>
                                                        <input
                                                            type="text"
                                                            name="phoneNumber"
                                                            value={formData.phoneNumber}
                                                            onChange={handleInputChange}
                                                            placeholder="(555) 000-0000"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </section>

                                        <section className="delivery-section">
                                            <h2 className="section-title">
                                                <Truck size={20} className="section-icon" /> Delivery Method
                                            </h2>

                                            <div className="delivery-options">
                                                {deliveryOptions.map(option => (
                                                    <div
                                                        key={option.id}
                                                        className={`delivery-card ${deliveryMethod === option.id ? 'selected' : ''}`}
                                                        onClick={() => setDeliveryMethod(option.id)}
                                                    >
                                                        <div className="delivery-info">
                                                            <div className="delivery-header">
                                                                <span className="delivery-name">{option.name}</span>
                                                                <span className="delivery-price">{option.label}</span>
                                                            </div>
                                                            <span className="delivery-time">{option.time}</span>
                                                        </div>
                                                        <div className="delivery-radio">
                                                            <div className={`radio-circle ${deliveryMethod === option.id ? 'checked' : ''}`}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="payment-step">
                                        <section className="form-section">
                                            <h2 className="section-title">
                                                <CardIcon size={20} className="section-icon" /> Payment Method
                                            </h2>

                                            <div className="payment-methods-grid">
                                                <div
                                                    className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                                                    onClick={() => setPaymentMethod('card')}
                                                >
                                                    <CardIcon size={24} />
                                                    <span>Credit Card</span>
                                                    {paymentMethod === 'card' && <div className="selected-badge"><Check size={10} /></div>}
                                                </div>
                                                <div
                                                    className={`payment-method-card ${paymentMethod === 'paypal' ? 'selected' : ''}`}
                                                    onClick={() => setPaymentMethod('paypal')}
                                                >
                                                    <Wallet size={24} />
                                                    <span>PayPal</span>
                                                    {paymentMethod === 'paypal' && <div className="selected-badge"><Check size={10} /></div>}
                                                </div>
                                                <div
                                                    className={`payment-method-card ${paymentMethod === 'gpay' ? 'selected' : ''}`}
                                                    onClick={() => setPaymentMethod('gpay')}
                                                >
                                                    <Smartphone size={24} />
                                                    <span>Google Pay</span>
                                                    {paymentMethod === 'gpay' && <div className="selected-badge"><Check size={10} /></div>}
                                                </div>
                                            </div>

                                            <div className="card-details-form">
                                                <div className="form-group">
                                                    <label>Card Number</label>
                                                    <div className="input-with-icon">
                                                        <input type="text" placeholder="0000 0000 0000 0000" />
                                                        <div className="card-icons-preview">
                                                            <div className="mini-card visa"></div>
                                                            <div className="mini-card master"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group field-expiry">
                                                        <label>Expiry Date</label>
                                                        <input type="text" placeholder="MM/YY" />
                                                    </div>
                                                    <div className="form-group field-cvv">
                                                        <label>CVV</label>
                                                        <div className="input-with-icon">
                                                            <input type="password" placeholder="***" />
                                                            <Info size={14} className="info-icon-hint" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="billing-section">
                                            <h2 className="section-title">
                                                <MapPin size={20} className="section-icon" /> Billing Address
                                            </h2>
                                            <div className="billing-address-box">
                                                <label className="checkbox-container">
                                                    <input
                                                        type="checkbox"
                                                        checked={sameAsShipping}
                                                        onChange={(e) => setSameAsShipping(e.target.checked)}
                                                    />
                                                    <span className="checkmark"></span>
                                                    Same as shipping address
                                                </label>

                                                <div className="address-display-box">
                                                    <p>{formData.streetAddress}, {formData.city}, {formData.state} {formData.zipCode}<br />{formData.country === 'IN' ? 'India' : formData.country}</p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                <div className="checkout-footer-actions">
                                    {step === 1 ? (
                                        <Link href="/cart" className="back-link">
                                            <ChevronLeft size={16} /> Return to Cart
                                        </Link>
                                    ) : (
                                        <button className="back-link-btn" onClick={() => setStep(prev => prev - 1)}>
                                            <ChevronLeft size={16} /> Return to Shipping
                                        </button>
                                    )}
                                    {step === 1 && (
                                        <button className="continue-btn" onClick={() => setStep(2)}>
                                            Continue to Payment <ChevronRight size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Summary */}
                            <aside className="checkout-summary-section">
                                <div className="summary-card">
                                    <h3 className="summary-title">Order Summary</h3>

                                    <div className="summary-items">
                                        {cartItems.map((item, idx) => (
                                            <div key={`${item.id}-${idx}`} className="summary-item">
                                                <div className="summary-item-image">
                                                    <img src={item.image} alt={item.name} />
                                                </div>
                                                <div className="summary-item-info">
                                                    <h4 className="item-name">{item.name}</h4>
                                                    <p className="item-qty">Qty: {item.quantity} &bull; {item.variant?.size || 'Standard'}</p>
                                                    <p className="item-price">₹{(item.price || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {cartItems.length === 0 && <p className="empty-summary">Your cart is empty</p>}
                                    </div>

                                    <div className="summary-calculations">
                                        <div className="calc-row">
                                            <span>Subtotal ({cartCount} items)</span>
                                            <span>₹{cartTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Shipping & Handling</span>
                                            <span className="free-text">FREE</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Estimated Tax</span>
                                            <span>₹{estimatedTax.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="promo-code-section">
                                        <label>PROMO CODE</label>
                                        <div className="promo-input-group">
                                            <input type="text" placeholder="Enter code" />
                                            <button className="apply-btn">Apply</button>
                                        </div>
                                    </div>

                                    <div className="total-amount-display">
                                        <span className="total-label">Total amount</span>
                                        <span className="total-price">₹{finalTotal.toFixed(2)}</span>
                                    </div>

                                    {step === 1 ? (
                                        <button className="continue-btn-summary" onClick={() => setStep(2)}>
                                            Continue <ChevronRight size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            className="place-order-btn"
                                            onClick={handleRazorpayPayment}
                                            disabled={isPlacingOrder}
                                        >
                                            {isPlacingOrder ? (
                                                <><Loader2 className="animate-spin" size={18} /> Processing Payment...</>
                                            ) : (
                                                <>Pay ₹{finalTotal.toFixed(2)} <ChevronRight size={18} /></>
                                            )}
                                        </button>
                                    )}

                                    <p className="legal-notice">
                                        By clicking &quot;Place Order&quot; you agree to EmpowerHome&apos;s <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>. Secure transaction processed via encrypted gateway.
                                    </p>

                                    <div className="trust-badges-row">
                                        <ShieldCheck size={20} />
                                        <Lock size={20} />
                                        <Truck size={20} />
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="confirmation-step">
                            <div className="confirmation-header">
                                <div className="success-icon-wrapper">
                                    <Check size={32} />
                                </div>
                                <h1 className="confirmation-title">Thank you!</h1>
                                <p className="confirmation-subtitle">
                                    Your order <span className="order-number">{placedOrder?.orderNumber || '#EH-98234'}</span> is confirmed.
                                </p>
                            </div>

                            <div className="confirmation-details-grid">
                                <div className="confirmation-items-box">
                                    <h3 className="section-title-mini">
                                        <Truck size={18} /> Order Items
                                    </h3>
                                    <div className="order-items-list">
                                        {/* Use placedOrder data if available, otherwise fallback */}
                                        {placedOrder ? (
                                            <div className="order-items-summary">
                                                <div className="order-details-header" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>
                                                        <span style={{ color: '#666', marginRight: '0.5rem' }}>Customer:</span>
                                                        {placedOrder.customerName || 'N/A'}
                                                    </p>
                                                    <p style={{ margin: '0', fontWeight: '500' }}>
                                                        <span style={{ color: '#666', marginRight: '0.5rem' }}>Status:</span>
                                                        <span style={{
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85rem',
                                                            backgroundColor: '#E3F2FD',
                                                            color: '#1565C0',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {placedOrder.status || 'PROCESSING'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <p>Your order for {finalTotal.toFixed(2)} has been placed successfully.</p>
                                                <div className="order-images-preview">
                                                    {placedOrder.images?.map((img, idx) => (
                                                        <img key={idx} src={img} alt="Ordered item" className="order-summary-img" />
                                                    ))}
                                                    {placedOrder.additionalItems > 0 && (
                                                        <div className="additional-items-badge">+{placedOrder.additionalItems} more</div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p>Loading order details...</p>
                                        )}
                                    </div>
                                    <div className="confirmation-summary-footer">
                                        <div className="calc-row">
                                            <span>Subtotal</span>
                                            <span>₹{placedOrder?.totalAmount ? (placedOrder.totalAmount - shippingCost - estimatedTax).toFixed(2) : '0.00'}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Shipping (Eco-Friendly)</span>
                                            <span>₹{shippingCost.toFixed(2)}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Estimated Tax</span>
                                            <span>₹{estimatedTax.toFixed(2)}</span>
                                        </div>
                                        <div className="calc-row total-paid">
                                            <span>Total Paid</span>
                                            <span>₹{(placedOrder?.totalAmount || finalTotal).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="confirmation-side-column">
                                    <div className="side-card info-card">
                                        <h3 className="side-card-title">Shipping Address</h3>
                                        <p className="address-text">
                                            {formData.fullName}<br />
                                            {formData.streetAddress}<br />
                                            {formData.city}, {formData.state} {formData.zipCode}<br />
                                            {formData.country === 'IN' ? 'India' : formData.country}
                                        </p>
                                    </div>

                                    <div className="side-card support-card">
                                        <h3 className="side-card-title">Support</h3>
                                        <p className="support-text">
                                            Need help with your order? Our team is here to assist you.
                                        </p>
                                        <button className="contact-support-link">
                                            <HelpCircle size={14} /> Contact Support
                                        </button>
                                    </div>

                                    <button className="continue-shopping-btn" onClick={() => router.push('/shop')}>
                                        Continue Shopping <ArrowRight size={18} />
                                    </button>
                                    <button className="print-receipt-btn">
                                        <Printer size={18} /> Print Receipt
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
        <Footer />
        </>
    );
};

export default CheckoutPage;
