import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
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
    Loader2,
    FileText
} from 'lucide-react';
import { fetchUserAddresses, createOrder, getActiveTaxRatesPublic, createRazorpayOrder, verifyRazorpayPayment, getRazorpayConfig, loadRazorpayScript, PLACEHOLDER_IMG, BACKEND_URL, quickPincodeCheck, validateCartShipping } from '../api/api';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { cartItems, cartTotal, cartCount, clearCart } = useCart();
    const navigate = useNavigate();
    const resolveImage = (item) => {
        if (item.image && item.image !== PLACEHOLDER_IMG) return item.image;
        const gallery = (item.media || []).filter(m => m.mediaType !== 'manufacturer');
        if (gallery.length > 0) {
            const primary = gallery.find(m => m.isPrimary) || gallery[0];
            if (primary?.fileName) return `${BACKEND_URL}/uploads/products/${primary.fileName}`;
        }
        const imgUrl = item.images?.[0] || item.imageUrls?.[0];
        if (imgUrl) return imgUrl.startsWith('http') ? imgUrl : `${BACKEND_URL}${imgUrl}`;
        return PLACEHOLDER_IMG;
    };

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

    // Tax rate states
    const [taxRates, setTaxRates] = useState([]);
    const [selectedTaxRate, setSelectedTaxRate] = useState(null);
    const [loadingTaxRates, setLoadingTaxRates] = useState(true);

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

    const [billingData, setBillingData] = useState({
        fullName: '',
        streetAddress: '',
        city: '',
        state: 'Andhra Pradesh',
        zipCode: '',
        phoneNumber: '',
        country: 'IN'
    });

    // Pincode validation states
    const [pincodeInput, setPincodeInput] = useState('');
    const [pincodeStatus, setPincodeStatus] = useState(null);
    const [debounceTimer, setDebounceTimer] = useState(null);
    const [cartValidation, setCartValidation] = useState(null);
    const [validatingCart, setValidatingCart] = useState(false);

    // Wholesale state
    const checkoutUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const isWholesaler = checkoutUser.roleId === 4;
    const [poNumber, setPoNumber] = useState('');
    const [requestInvoice, setRequestInvoice] = useState(false);

    // Gift wrapping state
    const [giftWrapping, setGiftWrapping] = useState({ enabled: false, message: '', option: 'standard' });
    const GIFT_WRAP_PRICE = 49;

    // Fetch addresses on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.userId) {
                loadAddresses(parsedUser.userId);
            } else {
                setLoadingAddresses(false);
                setShowNewAddressForm(true);
            }
        } else {
            setLoadingAddresses(false);
            setShowNewAddressForm(true);
        }
    }, []);

    const loadAddresses = async (userId) => {
        try {
            const data = await fetchUserAddresses(userId);
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

    // Fetch active tax rates on mount
    useEffect(() => {
        loadTaxRates();
    }, []);

    const loadTaxRates = async () => {
        try {
            const data = await getActiveTaxRatesPublic();
            setTaxRates(data);
            const defaultRate = data.filter(r => r.rate > 0).sort((a, b) => b.rate - a.rate)[0] || data[0];
            if (defaultRate) setSelectedTaxRate(defaultRate);
        } catch (error) {
            console.error("Failed to load tax rates:", error);
        } finally {
            setLoadingTaxRates(false);
        }
    };

    // Debounced pincode quick check
    const handlePincodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPincodeInput(value);
        if (debounceTimer) clearTimeout(debounceTimer);
        setCartValidation(null);
        if (value.length === 6) {
            setPincodeStatus({ serviceable: null, message: 'Checking...' });
            const timer = setTimeout(async () => {
                try {
                    const result = await quickPincodeCheck(value);
                    setPincodeStatus(result);
                } catch (err) {
                    setPincodeStatus({ serviceable: false, message: 'Failed to check pincode.' });
                }
            }, 500);
            setDebounceTimer(timer);
        } else {
            setPincodeStatus(null);
        }
    };

    // Validate entire cart shipping before proceeding to payment
    const handleContinueToPayment = async () => {
        if (!pincodeInput || pincodeInput.length !== 6) {
            setPincodeStatus({ serviceable: false, message: 'Please enter a valid 6-digit pincode.' });
            return;
        }
        if (!cartItems || cartItems.length === 0) {
            return;
        }
        setValidatingCart(true);
        try {
            const productIds = cartItems.map(item => item.productId || item.id);
            const result = await validateCartShipping(productIds, pincodeInput);
            setCartValidation(result);
            if (result.serviceable) {
                setStep(2);
            }
        } catch (err) {
            console.error('Cart validation failed:', err);
            setCartValidation({ serviceable: false, message: 'Failed to validate shipping.' });
        } finally {
            setValidatingCart(false);
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
     * Loads the Razorpay script and opens the Razorpay checkout modal.
     * 1. Creates a Razorpay order via backend
     * 2. Opens Razorpay checkout modal
     * 3. On success: verifies signature, then creates the order
     * 4. On failure: shows error
     */
    const handleRazorpayPayment = async () => {
        setIsPlacingOrder(true);
        try {
            const storedUser = localStorage.getItem('user');
            const parsedUser = storedUser ? JSON.parse(storedUser) : null;
            const userId = parsedUser?.userId;

            // Build order data
            const productQuantities = {};
            cartItems.forEach(item => {
                productQuantities[item.id] = (productQuantities[item.id] || 0) + item.quantity;
            });

            const orderNumber = "#EH-" + Math.random().toString(36).substr(2, 8).toUpperCase();
            const amountInPaise = Math.round(finalTotal * 100); // Convert ₹ to paise

            // Step 1: Get Razorpay config (key ID)
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
                    // Step 5: Verify payment signature on backend
                    try {
                        const verificationResult = await verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verificationResult.isValid) {
                            // Step 6: Create the actual order in the system
                            const billingAddress = sameAsShipping ? formData : billingData;

                            const orderData = {
                                userId,
                                vendorId: cartItems.length > 0 ? cartItems[0].vendorId : null,
                                customerName: formData.fullName || 'Guest',
                                deliveryLocation: formData.city ? `${formData.city}, ${formData.state}` : 'N/A',
                                billingName: billingAddress.fullName || formData.fullName || 'Guest',
                                billingAddress: billingAddress.streetAddress ? `${billingAddress.streetAddress}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.zipCode}, ${billingAddress.country === 'IN' ? 'India' : billingAddress.country}` : '',
                                pincode: pincodeInput || formData.zipCode,
                                estimatedDelivery: selectedDelivery ? selectedDelivery.time : (cartValidation?.estimatedDelivery || 'N/A'),
                                shippingCharges: shippingCost,
                                totalAmount: finalTotal,
                                status: 'PROCESSING',
                                images: cartItems.map(item => item.image).slice(0, 5),
                                additionalItems: cartItems.length > 5 ? cartItems.length - 5 : 0,
                                productQuantities: productQuantities,
                                impactNote: "This order supports fair wages and community education funds.",
                                orderNumber: orderNumber,
                                taxAmount: estimatedTax,
                                taxRate: taxRateValue,
                                cgst: cgstAmount,
                                sgst: sgstAmount,
                                cgstRate: cgstRate,
                                sgstRate: sgstRate,
                                paymentId: response.razorpay_payment_id,
                                paymentMethod: 'razorpay',
                                giftWrappingEnabled: giftWrapping.enabled,
                                giftMessage: giftWrapping.enabled ? giftWrapping.message : '',
                                giftWrapPrice: giftWrapping.enabled ? GIFT_WRAP_PRICE : 0
                            };

                            const result = await createOrder(orderData);
                            setPlacedOrder({ ...result, paymentId: response.razorpay_payment_id });
                            clearCart();
                            setStep(3);
                            window.scrollTo(0, 0);
                        } else {
                            toast.error('Payment verification failed. Please contact support.');
                        }
                    } catch (err) {
                        console.error("Order creation after payment failed:", err);
                        toast.error('Payment was successful but order creation failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
                    } finally {
                        setIsPlacingOrder(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.error('Payment failed:', response.error);
                toast.error('Payment failed: ' + (response.error?.description || 'Please try again.'));
                setIsPlacingOrder(false);
            });

            rzp.open();
        } catch (error) {
            console.error("Payment initialization failed:", error);
            toast.error("Failed to initialize payment. Please try again.");
            setIsPlacingOrder(false);
        }
    };

    useEffect(() => {
        if (!sameAsShipping && !billingData.streetAddress) {
            setBillingData({ ...formData });
        }
    }, [sameAsShipping]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBillingChange = (e) => {
        const { name, value } = e.target;
        setBillingData(prev => ({ ...prev, [name]: value }));
    };

    // Build delivery options from API if available, otherwise use defaults
    const getDeliveryOptions = () => {
        if (cartValidation && cartValidation.serviceable && cartValidation.courierOptions && cartValidation.courierOptions.length > 0) {
            return cartValidation.courierOptions.map((co, i) => ({
                id: co.courierCode || `option-${i}`,
                name: co.courierName || co.courierCode || 'Shipping',
                price: co.charge || 0,
                time: co.estimatedDaysMin && co.estimatedDaysMax
                    ? `Arrives in ${co.estimatedDaysMin}-${co.estimatedDaysMax} business days`
                    : cartValidation.estimatedDelivery || 'Estimated delivery available',
                label: co.charge ? `₹${co.charge.toFixed(2)}` : 'Free'
            }));
        }
        return [
            {
                id: 'standard',
                name: 'Standard Delivery',
                price: 0,
                time: 'Delivery estimate available after pincode validation',
                label: 'Free'
            }
        ];
    };

    const deliveryOptions = getDeliveryOptions();
    const selectedDelivery = deliveryOptions.find(opt => opt.id === deliveryMethod);
    const shippingCost = selectedDelivery ? selectedDelivery.price : (cartValidation?.shippingCharges || 0);

    // Auto-reset delivery method when cart validation provides new options
    const prevValidationRef = useRef(null);
    useEffect(() => {
        if (cartValidation !== prevValidationRef.current) {
            prevValidationRef.current = cartValidation;
            const deliveryOptions = cartValidation && cartValidation.serviceable && cartValidation.courierOptions
                ? cartValidation.courierOptions.map((co, i) => ({
                    id: co.courierCode || `option-${i}`,
                    name: co.courierName || co.courierCode || 'Shipping',
                    price: co.charge || 0,
                    time: co.estimatedDaysMin && co.estimatedDaysMax
                        ? `Arrives in ${co.estimatedDaysMin}-${co.estimatedDaysMax} business days`
                        : cartValidation.estimatedDelivery || 'Estimated delivery available',
                    label: co.charge ? `₹${co.charge.toFixed(2)}` : 'Free'
                }))
                : [];
            if (deliveryOptions.length > 0 && !deliveryOptions.find(o => o.id === deliveryMethod)) {
                setDeliveryMethod(deliveryOptions[0].id);
            }
        }
    }, [cartValidation, deliveryMethod]);
    const taxRateValue = selectedTaxRate ? selectedTaxRate.rate : 0;
    const cgstRate = selectedTaxRate ? selectedTaxRate.cgst : taxRateValue / 2;
    const sgstRate = selectedTaxRate ? selectedTaxRate.sgst : taxRateValue / 2;
    const estimatedTax = cartTotal * (taxRateValue / 100);
    const cgstAmount = cartTotal * (cgstRate / 100);
    const sgstAmount = cartTotal * (sgstRate / 100);
    const finalTotal = cartTotal + shippingCost + estimatedTax + (giftWrapping.enabled ? GIFT_WRAP_PRICE : 0);

    const steps = [
        { id: 1, name: 'SHIPPING', icon: <MapPin size={18} /> },
        { id: 2, name: 'PAYMENT', icon: <CreditCard size={18} /> },
        { id: 3, name: 'REVIEW', icon: <CheckCircle2 size={18} /> }
    ];

    return (
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
                                                            <label>Pincode / Zip Code</label>
                                                            <div className="pincode-input-wrapper">
                                                                <input
                                                                    type="text"
                                                                    name="zipCode"
                                                                    value={pincodeInput || formData.zipCode}
                                                                    onChange={(e) => {
                                                                        handlePincodeChange(e);
                                                                        handleInputChange(e);
                                                                    }}
                                                                    placeholder="6-digit pincode"
                                                                    maxLength={6}
                                                                    className={pincodeStatus ? (pincodeStatus.serviceable === true ? 'valid' : pincodeStatus.serviceable === false ? 'invalid' : '') : ''}
                                                                    required
                                                                />
                                                                {pincodeStatus && (
                                                                    <div className={`pincode-status-badge ${pincodeStatus.serviceable === true ? 'success' : pincodeStatus.serviceable === false ? 'error' : 'checking'}`}>
                                                                        {pincodeStatus.serviceable === null ? (
                                                                            <Loader2 className="animate-spin" size={14} />
                                                                        ) : pincodeStatus.serviceable ? (
                                                                            <span className="check-icon">✓</span>
                                                                        ) : (
                                                                            <span className="x-icon">✕</span>
                                                                        )}
                                                                        <span>{pincodeStatus.message}</span>
                                                                    </div>
                                                                )}
                                                            </div>
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

                                        {/* Gift Wrapping Section */}
                                        <section className="form-section" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#FFF9F8', borderRadius: '12px', border: '1px solid #FFE8E0' }}>
                                            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
                                                🎁 Gift Wrapping
                                            </h2>
                                            <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: giftWrapping.enabled ? '1rem' : 0, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={giftWrapping.enabled}
                                                    onChange={e => setGiftWrapping(prev => ({ ...prev, enabled: e.target.checked }))}
                                                    style={{ width: '18px', height: '18px', accentColor: '#FF5722' }}
                                                />
                                                <span style={{ fontSize: '0.9rem', color: '#444', fontWeight: 500 }}>
                                                    Wrap as a gift <span style={{ color: '#FF5722', fontWeight: 700 }}>+₹{GIFT_WRAP_PRICE.toFixed(2)}</span>
                                                </span>
                                            </label>
                                            {giftWrapping.enabled && (
                                                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', fontWeight: 600, marginBottom: '0.4rem' }}>Gift Message (optional)</label>
                                                    <textarea
                                                        value={giftWrapping.message}
                                                        onChange={e => setGiftWrapping(prev => ({ ...prev, message: e.target.value }))}
                                                        placeholder="Write a personal message..."
                                                        rows={2}
                                                        maxLength={200}
                                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD4', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                                                    />
                                                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>{giftWrapping.message.length}/200</div>
                                                </div>
                                            )}
                                        </section>

                                        <section className="delivery-section">
                                            <h2 className="section-title">
                                                <Truck size={20} className="section-icon" /> Delivery Method
                                            </h2>

                                            {cartValidation && !cartValidation.serviceable && cartValidation.vendorBreakdown && (
                                                <div className="cart-validation-summary">
                                                    <h4>Shipping Availability</h4>
                                                    {cartValidation.vendorBreakdown.map(vs => (
                                                        <div key={vs.vendorId} className={`vendor-shipping-status ${vs.serviceable ? 'ok' : 'not-ok'}`}>
                                                            <div className="vendor-header">
                                                                <span className="vendor-name">{vs.vendorName || `Vendor #${vs.vendorId}`}</span>
                                                                <span className={`badge ${vs.serviceable ? 'badge-success' : 'badge-error'}`}>
                                                                    {vs.serviceable ? 'Deliverable' : 'Not Available'}
                                                                </span>
                                                            </div>
                                                            <p className="vendor-pincode">Ships from: {vs.vendorPincode}</p>
                                                            <p className="vendor-message">{vs.message}</p>
                                                            {vs.serviceable && (
                                                                <div className="vendor-shipping-details">
                                                                    <span>₹{vs.shippingCharges?.toFixed(2)} shipping</span>
                                                                    <span>Est. {vs.estimatedDelivery}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {cartValidation && cartValidation.serviceable && deliveryOptions.length > 0 ? (
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
                                            ) : !cartValidation && pincodeInput.length === 6 && pincodeStatus?.serviceable ? (
                                                <p className="delivery-hint">Enter your pincode and continue to see delivery options.</p>
                                            ) : (
                                                <p className="delivery-hint">Enter a valid pincode to check delivery availability.</p>
                                            )}
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
                                                    <span className="checkbox-text">Same as shipping address</span>
                                                </label>

                                                {sameAsShipping ? (
                                                    <div className="address-display-box">
                                                        {formData.streetAddress ? (
                                                            <p>{formData.streetAddress}, {formData.city}, {formData.state} {formData.zipCode}<br />{formData.country === 'IN' ? 'India' : formData.country}</p>
                                                        ) : (
                                                            <p className="no-address-msg">Enter a shipping address first</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="billing-form-box">
                                                        <div className="form-group">
                                                            <label>Full Name</label>
                                                            <input type="text" name="fullName" value={billingData.fullName} onChange={handleBillingChange} placeholder="Full name" />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Street Address</label>
                                                            <input type="text" name="streetAddress" value={billingData.streetAddress} onChange={handleBillingChange} placeholder="Street address" />
                                                        </div>
                                                        <div className="form-row">
                                                            <div className="form-group col-city">
                                                                <label>City</label>
                                                                <input type="text" name="city" value={billingData.city} onChange={handleBillingChange} placeholder="City" />
                                                            </div>
                                                            <div className="form-group col-state">
                                                                <label>State</label>
                                                                <div className="select-wrapper">
                                                                    <select name="state" value={billingData.state} onChange={handleBillingChange}>
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
                                                                <input type="text" name="zipCode" value={billingData.zipCode} onChange={handleBillingChange} placeholder="Zip" />
                                                            </div>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Country</label>
                                                            <div className="select-wrapper">
                                                                <select name="country" value={billingData.country} onChange={handleBillingChange}>
                                                                    <option value="IN">India</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Phone Number</label>
                                                            <input type="text" name="phoneNumber" value={billingData.phoneNumber} onChange={handleBillingChange} placeholder="(555) 000-0000" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        {isWholesaler && (
                                            <section className="form-section" style={{ marginTop: '1.5rem' }}>
                                                <h2 className="section-title" style={{ marginBottom: '1rem' }}>
                                                    <FileText size={20} className="section-icon" /> Wholesale Invoice
                                                </h2>
                                                <div className="form-group">
                                                    <label>GST Number</label>
                                                    <input type="text" value={checkoutUser.gstNumber || ''} disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '0.9rem' }} />
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>Registered GST from your account</span>
                                                </div>
                                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                                    <label>PO Number (optional)</label>
                                                    <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Enter your Purchase Order number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' }} />
                                                </div>
                                                <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={requestInvoice} onChange={e => setRequestInvoice(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#FF5722' }} />
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Request GST Invoice</span>
                                                </label>
                                            </section>
                                        )}
                                    </div>
                                )}

                                <div className="checkout-footer-actions">
                                    {step === 1 ? (
                                        <Link to="/cart" className="back-link">
                                            <ChevronLeft size={16} /> Return to Cart
                                        </Link>
                                    ) : (
                                        <button className="back-link-btn" onClick={() => setStep(prev => prev - 1)}>
                                            <ChevronLeft size={16} /> Return to Shipping
                                        </button>
                                    )}
                                    {step === 1 && (
                                        <button className="continue-btn" onClick={handleContinueToPayment} disabled={validatingCart}>
                                            {validatingCart ? (
                                                <><Loader2 className="animate-spin" size={16} /> Checking Shipping...</>
                                            ) : (
                                                <>Continue to Payment <ChevronRight size={16} /></>
                                            )}
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
                                                    <img
                                                        src={resolveImage(item)}
                                                        alt={item.name}
                                                        onError={(e) => { if (e.target.src !== PLACEHOLDER_IMG) e.target.src = PLACEHOLDER_IMG; }}
                                                    />
                                                </div>
                                                <div className="summary-item-info">
                                                    <h4 className="item-name">{item.name}</h4>
                                                    <p className="item-qty">Qty: {item.quantity} • {item.variant?.size || 'Standard'}</p>
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
                                            <span className={shippingCost > 0 ? '' : 'free-text'}>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'FREE'}</span>
                                        </div>
                                        <div className="tax-breakdown">
                                            <div className="calc-row tax-header">
                                                <span>
                                                    GST {taxRateValue > 0 ? `(${taxRateValue}% Slab)` : ''}
                                                    {loadingTaxRates && <span className="tax-loading-hint"> loading...</span>}
                                                </span>
                                                <span>₹{estimatedTax.toFixed(2)}</span>
                                            </div>
                                            {taxRateValue > 0 && (
                                                <div className="tax-split">
                                                    <div className="calc-row tax-sub">
                                                        <span>CGST ({cgstRate}%)</span>
                                                        <span>₹{cgstAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="calc-row tax-sub">
                                                        <span>SGST ({sgstRate}%)</span>
                                                        <span>₹{sgstAmount.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}
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
                                        <button className="continue-btn-summary" onClick={handleContinueToPayment} disabled={validatingCart}>
                                            {validatingCart ? (
                                                <><Loader2 className="animate-spin" size={18} /> Checking...</>
                                            ) : (
                                                <>Continue <ChevronRight size={18} /></>
                                            )}
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
                                        By clicking "Place Order" you agree to EmpowerHome's <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>. Secure transaction processed via encrypted gateway.
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
                                                <p>Your order for ₹{(placedOrder?.totalAmount || finalTotal).toFixed(2)} has been placed successfully.</p>
                                                <div className="order-images-preview">
                                                    {placedOrder.images?.map((img, idx) => (
                                                        <img key={idx} src={img} alt="Ordered item" className="order-summary-img" onError={(e) => { if (e.target.src !== PLACEHOLDER_IMG) e.target.src = PLACEHOLDER_IMG; }} />
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
                                            <span>₹{placedOrder ? (placedOrder.totalAmount - (placedOrder.taxAmount || 0) - shippingCost).toFixed(2) : '0.00'}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Shipping (Eco-Friendly)</span>
                                            <span>₹{shippingCost.toFixed(2)}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>GST ({placedOrder?.taxRate || taxRateValue}% Slab)</span>
                                            <span>₹{(placedOrder?.taxAmount || estimatedTax).toFixed(2)}</span>
                                        </div>
                                        {(placedOrder?.taxRate || taxRateValue) > 0 && (
                                            <>
                                                <div className="calc-row tax-sub">
                                                    <span>  CGST ({(placedOrder?.cgstRate || cgstRate)}%)</span>
                                                    <span>₹{(placedOrder?.cgst || cgstAmount).toFixed(2)}</span>
                                                </div>
                                                <div className="calc-row tax-sub">
                                                    <span>  SGST ({(placedOrder?.sgstRate || sgstRate)}%)</span>
                                                    <span>₹{(placedOrder?.sgst || sgstAmount).toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
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

                                    <div className="side-card info-card">
                                        <h3 className="side-card-title">Billing Address</h3>
                                        <p className="address-text">
                                            {sameAsShipping ? formData.fullName : billingData.fullName}<br />
                                            {sameAsShipping ? formData.streetAddress : billingData.streetAddress}<br />
                                            {sameAsShipping ? `${formData.city}, ${formData.state} ${formData.zipCode}` : `${billingData.city}, ${billingData.state} ${billingData.zipCode}`}<br />
                                            {sameAsShipping ? (formData.country === 'IN' ? 'India' : formData.country) : (billingData.country === 'IN' ? 'India' : billingData.country)}
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

                                    <button className="continue-shopping-btn" onClick={() => navigate('/shop')}>
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
    );
};

export default CheckoutPage;
