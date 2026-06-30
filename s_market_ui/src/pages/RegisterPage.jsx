import React, { useState, useEffect } from 'react';
import {
    Eye, EyeOff, User, Mail, Lock, Phone,
    Store, MapPin, Globe, Hash, Upload, Plus,
    CreditCard, CheckCircle, FileCheck, ArrowRight, ArrowLeft,
    Image as ImageIcon, AlignLeft, Info, Map
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import MapModal from '../components/MapModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import './RegisterPage.css';
import toast from 'react-hot-toast';
import { registerUser, registerVendor, uploadStoreLogo } from '../api/api';

const VENDOR_STEP_IMAGES = [
    'https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?q=80&w=1887&auto=format&fit=crop', // Step 1: Professional details
    'https://images.unsplash.com/photo-1534452283282-74ad09369911?q=80&w=2070&auto=format&fit=crop', // Step 2: Store front
    'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop', // Step 3: Payment/Financial
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop'  // Step 4: Agreements/Legal
];

const VENDOR_STEPS_CONTENT = [
    {
        title: "Empower Your Business",
        description: "Join over 10,000 successful vendors who have scaled their operations using our platform. Your journey to retail excellence starts here."
    },
    {
        title: "Launch your digital storefront.",
        description: "Your store details help customers find you and build trust in your brand."
    },
    {
        title: "Scale Your Business Faster.",
        description: "Join thousands of successful vendors who have automated their payouts and grown their revenue by 40% year-over-year."
    },
    {
        title: "Launch your shop with confidence.",
        description: "Join thousands of successful vendors reaching millions of customers worldwide."
    }
];

const FORM_STEPS = ["Account", "Store", "Payment", "Policies"];

const RegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isVendor = searchParams.get('type') === 'vendor';
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        // User Details (Common & Step 1)
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',

        // Step 2: Store Details (Branches)
        stores: [
            {
                storeName: '',
                storePhone: '',
                storeEmail: '',
                storeDescription: '',
                address: '',
                city: '',
                state: '',
                country: '',
                pincode: '',
                latitude: '0.00',
                longitude: '0.00',
            }
        ],

        // Step 2: Business Info (KYC fields)
        gst: '',

        // Step 3: Payment Details
        paymentMethod: '',
        paymentIdentifier: '',
        // Common KYC fields for all payment methods
        pan: '',
        aadhaar: '',
        // Bank Transfer fields
        beneficiaryName: '',
        bankAccountNumber: '',
        confirmBankAccountNumber: '',
        ifscCode: '',
        accountType: 'Savings',
        remittanceEmail: '',
        // UPI fields
        upiId: '',
        verifiedUpiBankName: '',
        panNumberUpi: '',
        remittanceEmailUpi: '',
        // PayPal fields
        paypalEmail: '',
        confirmPaypalEmail: '',
        paypalLegalName: '',
        panNumberPaypal: '',
        purposeCode: 'Goods',

        // Step 4: Agreements
        agreeTerms: false,
        agreePolicies: false,
        agreeRules: false,
        agreePrivacy: false,

        newsletter: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [logoFile, setLogoFile] = useState(null);
    const [ifscBranch, setIfscBranch] = useState('');
    const [ifscLookupLoading, setIfscLookupLoading] = useState(false);

    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [activeStoreIndex, setActiveStoreIndex] = useState(0);

    const openMapPicker = (index) => {
        setActiveStoreIndex(index);
        setIsMapModalOpen(true);
    };

    const handleSelectLocation = (locationData) => {
        const updatedStores = [...formData.stores];
        updatedStores[activeStoreIndex] = {
            ...updatedStores[activeStoreIndex],
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address || updatedStores[activeStoreIndex].address,
            city: locationData.city || updatedStores[activeStoreIndex].city,
            state: locationData.state || updatedStores[activeStoreIndex].state,
            country: locationData.country || updatedStores[activeStoreIndex].country,
            pincode: locationData.pincode || updatedStores[activeStoreIndex].pincode,
        };
        setFormData(prev => ({
            ...prev,
            stores: updatedStores
        }));
    };

    useEffect(() => {
        // Check if user is already logged in
        const user = localStorage.getItem('user');
        if (user) {
            window.location.replace('/admin/dashboard');
        }
    }, []);

    // IFSC auto-lookup
    useEffect(() => {
        if (formData.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode)) {
            setIfscLookupLoading(true);
            fetch('https://ifsc.razorpay.com/' + formData.ifscCode.toUpperCase())
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data?.BRANCH) setIfscBranch(data.BANK + ' - ' + data.BRANCH);
                    else setIfscBranch('Not found');
                })
                .catch(() => setIfscBranch('Lookup failed'))
                .finally(() => setIfscLookupLoading(false));
        } else {
            setIfscBranch('');
        }
    }, [formData.ifscCode]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;

        if (id === 'phone' && !/^\d*$/.test(value)) {
            setErrors(prev => ({ ...prev, [id]: 'Please enter numeric values only' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user types
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const handleStoreChange = (index, e) => {
        const { id, value } = e.target;

        if ((id === 'storePhone' || id === 'pincode') && !/^\d*$/.test(value)) {
            const errorKey = `store_${index}_${id}`;
            setErrors(prev => ({ ...prev, [errorKey]: 'Please enter numeric values only' }));
            return;
        }

        if ((id === 'latitude' || id === 'longitude') && !/^-?\d*\.?\d*$/.test(value)) {
            const errorKey = `store_${index}_${id}`;
            setErrors(prev => ({ ...prev, [errorKey]: 'Please enter valid coordinates' }));
            return;
        }

        const updatedStores = [...formData.stores];
        updatedStores[index] = { ...updatedStores[index], [id]: value };
        setFormData(prev => ({
            ...prev,
            stores: updatedStores
        }));

        // Clear error
        const errorKey = `store_${index}_${id}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
    };

    const addBranch = () => {
        setFormData(prev => ({
            ...prev,
            stores: [
                ...prev.stores,
                {
                    storeName: '',
                    storePhone: '',
                    storeEmail: '',
                    storeDescription: '',
                    address: '',
                    city: '',
                    state: '',
                    country: '',
                    pincode: '',
                    latitude: '0.00',
                    longitude: '0.00',
                }
            ]
        }));
    };

    const removeBranch = (index) => {
        if (formData.stores.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            stores: prev.stores.filter((_, i) => i !== index)
        }));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLogoFile(file);
        toast.success("Logo file selected. It will be uploaded upon submission.");
    };

    const validateStep1 = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email.trim())) {
            newErrors.email = "Invalid email format";
        }
        const phoneRegex = /^\d{10}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = "Phone number must be 10 digits";
        }
        if (formData.password.length < 8) newErrors.password = "Min 8 characters";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        formData.stores.forEach((store, index) => {
            if (!store.storeName.trim()) newErrors[`store_${index}_storeName`] = "Store name required";
            if (store.storeEmail.trim() && !emailRegex.test(store.storeEmail.trim())) {
                newErrors[`store_${index}_storeEmail`] = "Invalid email format";
            }
            if (!store.address.trim()) newErrors[`store_${index}_address`] = "Address required";
            if (!store.city.trim()) newErrors[`store_${index}_city`] = "City required";
            if (!store.pincode.trim()) newErrors[`store_${index}_pincode`] = "Pincode required";
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};
        const pm = formData.paymentMethod;
        if (!pm) { newErrors.paymentMethod = "Selection required"; setErrors(newErrors); return false; }
        // Common KYC fields required for all payment methods
        if (!formData.pan.trim()) newErrors.pan = 'PAN required for KYC';
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan.toUpperCase())) newErrors.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
        if (!formData.aadhaar.trim()) newErrors.aadhaar = 'Aadhaar required for KYC';
        else if (!/^\d{12}$/.test(formData.aadhaar.replace(/\s/g, ''))) newErrors.aadhaar = 'Aadhaar must be 12 digits';
        if (pm === 'bank') {
            if (!formData.beneficiaryName.trim()) newErrors.beneficiaryName = 'Beneficiary name required';
            if (!formData.bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Account number required';
            if (formData.bankAccountNumber !== formData.confirmBankAccountNumber) newErrors.confirmBankAccountNumber = 'Account numbers must match';
            if (!formData.ifscCode.trim()) newErrors.ifscCode = 'IFSC code required';
            if (formData.ifscCode.length < 11) newErrors.ifscCode = 'IFSC must be 11 characters';
            if (!formData.accountType.trim()) newErrors.accountType = 'Account type required';
            if (!formData.remittanceEmail.trim()) newErrors.remittanceEmail = 'Remittance email required';
        } else if (pm === 'upi') {
            if (!formData.upiId.trim()) newErrors.upiId = 'UPI ID required';
            if (!formData.remittanceEmailUpi.trim()) newErrors.remittanceEmailUpi = 'Remittance email required';
        } else if (pm === 'paypal') {
            if (!formData.paypalEmail.trim()) newErrors.paypalEmail = 'PayPal email required';
            if (formData.paypalEmail !== formData.confirmPaypalEmail) newErrors.confirmPaypalEmail = 'Emails must match';
            if (!formData.paypalLegalName.trim()) newErrors.paypalLegalName = 'Legal name required';
            if (!formData.purposeCode.trim()) newErrors.purposeCode = 'Purpose code required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep4 = () => {
        const newErrors = {};
        if (!formData.agreeTerms) newErrors.agreeTerms = "Required";
        if (!formData.agreePolicies) newErrors.agreePolicies = "Required";
        if (!formData.agreeRules) newErrors.agreeRules = "Required";
        if (!formData.agreePrivacy) newErrors.agreePrivacy = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        let isValid = false;
        if (currentStep === 1) isValid = validateStep1();
        else if (currentStep === 2) isValid = validateStep2();
        else if (currentStep === 3) isValid = validateStep3();

        if (isValid) {
            setCurrentStep(prev => prev + 1);
            // Target the scrollable container instead of window
            const contentArea = document.querySelector('.register-content');
            if (contentArea) contentArea.scrollTo(0, 0);
        } else {
            toast.error("Please fill in all required fields correctly.");
        }
    };

    const handleBackStep = () => {
        setCurrentStep(prev => prev - 1);
        const contentArea = document.querySelector('.register-content');
        if (contentArea) contentArea.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (isVendor) {
            if (!validateStep4()) {
                toast.error("Please accept all agreements to continue.");
                return;
            }

            const loadingToast = toast.loading('Registering as vendor...');
            try {
                let logoUrl = formData.stores[0].storeLogo || '';
                // Logo upload skipped here as it requires authentication.
                // Vendor can upload logo later from their dashboard settings.

                const updatedStores = [...formData.stores];
                if (updatedStores.length > 0) {
                    updatedStores[0] = { ...updatedStores[0], storeLogo: logoUrl };
                }

                // Map formData to vendor API structure
                const { confirmPassword, fullName, confirmBankAccountNumber, confirmPaypalEmail, ...cleanForm } = formData;
                const vendorData = {
                    ...cleanForm,
                    name: fullName,
                    stores: updatedStores,
                    roleId: 3 // Vendor Role
                };

                toast.loading('Saving account details...', { id: loadingToast });
                const data = await registerVendor(vendorData);



                toast.dismiss(loadingToast);
                toast.success("Vendor registration submitted! Welcome.");
                localStorage.setItem('user', JSON.stringify({ ...data, userId: data.userId || data.vendorId, roleId: 3 }));
                window.location.replace('/vendor/dashboard');
            } catch (error) {
                toast.dismiss(loadingToast);
                console.error("Vendor registration 400 error:", error.message);
                toast.error(error.message || "Vendor registration failed");
            }
        } else {
            if (!validateStep1()) {
                toast.error("Please fill in all required fields correctly.");
                return;
            }

            const loadingToast = toast.loading('Creating account...');
            try {
                const data = await registerUser(formData);
                toast.dismiss(loadingToast);
                localStorage.setItem('user', JSON.stringify(data));
                toast.success("Registration successful! Welcome.");
                window.location.replace('/admin/dashboard');
            } catch (error) {
                toast.dismiss(loadingToast);
                toast.error(error.message || "Registration failed");
            }
        }
    };

    const renderStepIndicators = () => {
        if (!isVendor) return null;
        return (
            <div className="step-indicator-rail">
                {[1, 2, 3, 4].map(step => (
                    <div key={step}
                        className={`step-dot-container ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                        onClick={() => {
                            if (step < currentStep) setCurrentStep(step);
                        }}
                        style={{ cursor: step < currentStep ? 'pointer' : 'default' }}
                    >
                        <div className="step-dot">
                            {currentStep > step ? <CheckCircle size={16} /> : step}
                        </div>
                        <span className="step-label">{FORM_STEPS[step - 1]}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderForm = () => {
        if (!isVendor) {
            return (
                <div className="vendor-form-container">
                    <div className="login-link-float">
                        Already have an account? <Link to="/login" className="orange-link">Login</Link>
                    </div>

                    <div className="vendor-form-card">
                        <div className="form-step-content">
                            <div className="step-header">
                                <h2>Create Your Account</h2>
                                <p>Welcome to SreeMarket! Please fill in your details to start shopping.</p>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-row">
                                        <Input id="fullName" label="Full Name" placeholder="John Doe" icon={User} value={formData.fullName} onChange={handleChange} error={errors.fullName} />
                                        <Input id="phone" label="Phone Number" type="tel" placeholder="+91 0000000000" icon={Phone} value={formData.phone} onChange={handleChange} error={errors.phone} maxLength={10} />
                                    </div>
                                    <Input id="email" label="Email Address" type="email" placeholder="name@example.com" icon={Mail} value={formData.email} onChange={handleChange} error={errors.email} />
                                    <div className="form-row">
                                        <Input id="password" label="Password" type={showPassword ? "text" : "password"} placeholder="••••••••" icon={showPassword ? EyeOff : Eye} onIconClick={() => setShowPassword(!showPassword)} value={formData.password} onChange={handleChange} error={errors.password} />
                                        <Input id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" icon={showConfirmPassword ? EyeOff : Eye} onIconClick={() => setShowConfirmPassword(!showConfirmPassword)} value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
                                    </div>
                                    <div className="password-requirements">Must be at least 8 characters.</div>
                                </div>
                                <Button type="submit" fullWidth className="mt-8 orange-btn">Create Account</Button>

                                <div className="divider-container" style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
                                    <div className="divider-line" style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                                    <span className="divider-text" style={{ padding: '0 1rem', color: '#6B7280', fontSize: '0.875rem' }}>Or sign up with</span>
                                    <div className="divider-line" style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                                </div>
                                <div className="social-buttons" style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Button variant="outline" fullWidth className="gap-2" type="button" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20" style={{ marginRight: '8px' }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                        Google
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            );
        }

        // Multi-step Vendor Flow
        return (
            <div className="vendor-form-container">
                {currentStep === 1 && (
                    <div className="login-link-float">
                        Already have an account? <Link to="/login" className="orange-link">Login</Link>
                    </div>
                )}

                <div className="vendor-form-card">
                    {currentStep === 1 && (
                        <div className="form-step-content">
                            <div className="step-header">
                                <h2>Step 1: Account Details</h2>
                                <p>Create your vendor account to start selling on SreeMarket.</p>
                            </div>
                            <div className="form-grid">
                                <div className="form-row">
                                    <Input id="fullName" label="Full Name" placeholder="John Doe" icon={User} value={formData.fullName} onChange={handleChange} error={errors.fullName} />
                                    <Input id="phone" label="Phone Number" type="tel" placeholder="1234567890" icon={Phone} value={formData.phone} onChange={handleChange} error={errors.phone} maxLength={10} />
                                </div>
                                <Input id="email" label="Email Address" type="email" placeholder="admin@traqinn.com" icon={Mail} value={formData.email} onChange={handleChange} error={errors.email} />
                                <div className="form-row">
                                    <Input id="password" label="Password" type={showPassword ? "text" : "password"} placeholder="••••••••" icon={showPassword ? EyeOff : Eye} onIconClick={() => setShowPassword(!showPassword)} value={formData.password} onChange={handleChange} error={errors.password} />
                                    <Input id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" icon={showConfirmPassword ? EyeOff : Eye} onIconClick={() => setShowConfirmPassword(!showConfirmPassword)} value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
                                </div>
                                <div className="password-requirements">Must be at least 8 characters long and include special characters.</div>
                            </div>
                            <Button fullWidth onClick={handleNextStep} className="mt-8 orange-btn">Next Step <ArrowRight size={18} className="ml-2" /></Button>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="form-step-content">
                            <div className="step-header">
                                <h2>Step 2: Store Details</h2>
                                <p>Enter your business information to set up your profile. You can add multiple branches if applicable.</p>
                            </div>

                            {formData.stores.map((store, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <hr className="store-branch-divider" />}
                                    <div className={`store-branch-container ${index === formData.stores.length - 1 ? 'mb-4' : 'mb-6'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="form-section-label m-0"><Store size={16} /> BRANCH #{index + 1} {index === 0 ? '(Main)' : ''}</div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeBranch(index)}
                                                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium transition-colors"
                                                >
                                                    <Hash size={14} className="rotate-45" /> Remove Branch
                                                </button>
                                            )}
                                        </div>

                                        <div className="form-section-label-sub"><Info size={14} /> GENERAL INFORMATION</div>
                                        {formData.stores.length > 1 && (
                                            <div className="form-row">
                                                <div className="branch-id-badge">Branch {index + 1}</div>
                                            </div>
                                        )}
                                        <div className="form-grid">
                                            <div className="form-row">
                                                <Input id="storeName" label="STORE NAME" placeholder="My Awesome Store" value={store.storeName} onChange={(e) => handleStoreChange(index, e)} error={errors[`store_${index}_storeName`]} />
                                                <Input id="storePhone" label="PHONE NUMBER" placeholder="+91 0000000000" value={store.storePhone} onChange={(e) => handleStoreChange(index, e)} error={errors[`store_${index}_storePhone`]} />
                                            </div>
                                            <div className="form-row">
                                                <Input id="storeEmail" label="EMAIL ADDRESS" placeholder="store@example.com" value={store.storeEmail} onChange={(e) => handleStoreChange(index, e)} error={errors[`store_${index}_storeEmail`]} />
                                                <Input id="storeDescription" label="DESCRIPTION" placeholder="Short bio..." icon={AlignLeft} value={store.storeDescription} onChange={(e) => handleStoreChange(index, e)} />
                                            </div>
                                        </div>

                                        <div className="form-section-label-sub mt-4"><MapPin size={14} /> STORE LOCATION</div>
                                        <div className="form-grid">
                                            <Input id="address" label="FULL ADDRESS" placeholder="123 Market Street" value={store.address} onChange={(e) => handleStoreChange(index, e)} error={errors[`store_${index}_address`]} />
                                            <div className="form-row">
                                                <Input id="city" label="CITY" placeholder="City" value={store.city} onChange={(e) => handleStoreChange(index, e)} error={errors[`store_${index}_city`]} />
                                                <Input id="state" label="STATE" placeholder="State" value={store.state} onChange={(e) => handleStoreChange(index, e)} />
                                                <Input id="country" label="COUNTRY" placeholder="" icon={Globe} value={store.country} onChange={(e) => handleStoreChange(index, e)} />
                                                <Input id="pincode" label="PINCODE" placeholder="60000" icon={Hash} value={store.pincode} onChange={(e) => handleStoreChange(index, e)} error={errors[`store_${index}_pincode`]} />
                                            </div>
                                            <div className="form-row items-end">
                                                <Input id="latitude" label="LATITUDE" placeholder="0.00" value={store.latitude} onChange={(e) => handleStoreChange(index, e)} />
                                                <div className="flex gap-2 w-full items-end">
                                                    <Input
                                                        id="longitude"
                                                        label="LONGITUDE"
                                                        placeholder="0.00"
                                                        value={store.longitude}
                                                        onChange={(e) => handleStoreChange(index, e)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => openMapPicker(index)}
                                                        className="map-picker-btn"
                                                        title="Pick from map"
                                                    >
                                                        <Map size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}

                            <div className="form-section-label-sub mt-4"><FileCheck size={14} /> BUSINESS KYC DETAILS</div>
                            <div className="form-row">
                                <Input id="gst" label="GST NUMBER (optional)" placeholder="22AAAAA0000A1Z5" icon={FileCheck} value={formData.gst} onChange={handleChange} error={errors.gst} />
                            </div>

                            <div className="form-section-label mt-2"><ImageIcon size={16} /> IDENTITY & ACTIONS</div>
                            <div className="form-row">
                                <label className="upload-placeholder-box cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/jpeg, image/png"
                                        onChange={handleLogoUpload}
                                        style={{ display: 'none' }}
                                    />
                                    {logoFile || formData.stores[0].storeLogo ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle size={20} className="text-green-500 mb-1" />
                                            <span className="text-sm font-medium text-green-600">{logoFile ? "Logo Selected" : "Logo Uploaded"}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={20} />
                                            <span>Upload Main Logo <br /><small>JPG/PNG &lt; 2MB</small></span>
                                        </>
                                    )}
                                </label>
                                <div className="upload-placeholder-box cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors" onClick={addBranch}>
                                    <Plus size={20} className="text-orange-500" />
                                    <span className="text-orange-600 font-medium">Add Another Branch</span>
                                </div>
                            </div>

                            <div className="form-row mt-3 mb-1">
                                <Button variant="outline" onClick={handleBackStep} fullWidth className="gap-2"><ArrowLeft size={18} /> Back</Button>
                                <Button onClick={handleNextStep} fullWidth className="orange-btn">Continue to Payment</Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="form-step-content">
                            <div className="step-header">
                                <h2>Step 3: Payment Details</h2>
                                <p>Set up your preferred payment method to receive earnings from SreeMarket.</p>
                            </div>
                            <div className="form-grid">
                                <div className="form-section-label-sub" style={{gridColumn:'1/-1'}}><FileCheck size={14} /> KYC DOCUMENTS (Required for all methods)</div>
                                <div className="form-row" style={{gridColumn:'1/-1'}}>
                                    <Input id="pan" label="PAN Number *" placeholder="ABCDE1234F" icon={FileCheck} value={formData.pan} onChange={handleChange} error={errors.pan} maxLength={10} />
                                    <Input id="aadhaar" label="Aadhaar Number *" placeholder="1234 5678 9012" icon={FileCheck} value={formData.aadhaar} onChange={handleChange} error={errors.aadhaar} maxLength={14} />
                                </div>
                                <div className="select-container" style={{gridColumn:'1/-1'}}>
                                    <label>Payment Method</label>
                                    <select id="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="custom-select">
                                        <option value="">Select a payment method</option>
                                        <option value="bank">Bank Transfer (NEFT/RTGS)</option>
                                        <option value="upi">UPI / GPay</option>
                                        <option value="paypal">PayPal</option>
                                    </select>
                                    {errors.paymentMethod && <span className="error-text">{errors.paymentMethod}</span>}
                                </div>

                                {/* Bank Transfer */}
                                {formData.paymentMethod === 'bank' && (
                                    <div style={{ background:'#f8faff', borderRadius:10, padding:16, border:'1px solid #e0e7ff', gridColumn:'1/-1' }}>
                                        <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#4338ca', margin:'0 0 12px' }}>Bank Transfer Details</p>
                                        <div className="form-row" style={{marginBottom:10}}>
                                            <Input id="beneficiaryName" label="Legal Business / Beneficiary Name" placeholder="Enter legal business name" icon={User} value={formData.beneficiaryName} onChange={handleChange} error={errors.beneficiaryName} />
                                            <Input id="bankAccountNumber" label="Bank Account Number" placeholder="Enter account number" icon={CreditCard} value={formData.bankAccountNumber} onChange={handleChange} error={errors.bankAccountNumber} maxLength={20} />
                                        </div>
                                        <div className="form-row" style={{marginBottom:10}}>
                                            <Input id="confirmBankAccountNumber" label="Re-enter Bank Account Number" placeholder="Re-enter account number" icon={CreditCard} value={formData.confirmBankAccountNumber} onChange={handleChange} error={errors.confirmBankAccountNumber} maxLength={20} />
                                            <Input id="ifscCode" label="IFSC Code (11 digits)" placeholder="E.g. HDFC0001234" icon={Hash} value={formData.ifscCode} onChange={handleChange} error={errors.ifscCode} maxLength={11} />
                                        </div>
                                        {ifscLookupLoading && <p style={{fontSize:'0.73rem',color:'#6366f1',margin:'0 0 8px'}}>Looking up IFSC...</p>}
                                        {ifscBranch && !ifscLookupLoading && <p style={{fontSize:'0.73rem',color:ifscBranch==='Not found'||ifscBranch==='Lookup failed'?'#dc2626':'#16a34a',margin:'0 0 8px'}}>✓ {ifscBranch}</p>}
                                        <div className="form-row" style={{marginBottom:10}}>
                                            <div className="select-container">
                                                <label>Account Type</label>
                                                <select id="accountType" value={formData.accountType||'Savings'} onChange={handleChange} className="custom-select">
                                                    <option value="Savings">Savings</option>
                                                    <option value="Current">Current</option>
                                                </select>
                                            </div>
                                            <Input id="remittanceEmail" label="Vendor Email for Remittance Advice" placeholder="finance@vendor.com" icon={Mail} type="email" value={formData.remittanceEmail} onChange={handleChange} error={errors.remittanceEmail} />
                                        </div>
                                        <p style={{fontSize:'0.7rem',color:'#6366f1',margin:'4px 0 0'}}>These details will be verified and used for KYC &amp; payout processing.</p>
                                    </div>
                                )}

                                {/* UPI / GPay */}
                                {formData.paymentMethod === 'upi' && (
                                    <div style={{ background:'#f0fdf4', borderRadius:10, padding:16, border:'1px solid #bbf7d0', gridColumn:'1/-1' }}>
                                        <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#16a34a', margin:'0 0 12px' }}>UPI / GPay Details</p>
                                        <div className="form-row" style={{marginBottom:10}}>
                                            <Input id="upiId" label="Vendor UPI ID / VPA" placeholder="name@okaxis or mobile@upi" icon={Store} value={formData.upiId} onChange={handleChange} error={errors.upiId} />

                                        </div>
                                        <div className="form-row" style={{marginBottom:10}}>
                                            <Input id="verifiedUpiBankName" label="Bank Name" placeholder="Enter bank name" icon={Store} value={formData.verifiedUpiBankName} onChange={handleChange} />
                                            <Input id="panNumberUpi" label="PAN Number (for TDS)" placeholder="ABCDE1234F" icon={Hash} value={formData.panNumberUpi} onChange={handleChange} error={errors.panNumberUpi} maxLength={10} />
                                        </div>
                                        <Input id="remittanceEmailUpi" label="Remittance Email Address" placeholder="finance@vendor.com" icon={Mail} type="email" value={formData.remittanceEmailUpi} onChange={handleChange} error={errors.remittanceEmailUpi} />
                                    </div>
                                )}

                                {/* PayPal */}
                                {formData.paymentMethod === 'paypal' && (
                                    <div style={{ background:'#fff7ed', borderRadius:10, padding:16, border:'1px solid #fed7aa', gridColumn:'1/-1' }}>
                                        <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#d97706', margin:'0 0 12px' }}>PayPal Details</p>
                                        <div className="form-row" style={{marginBottom:10}}>
                                            <Input id="paypalEmail" label="PayPal Email Address" placeholder="paypal@vendor.com" icon={Mail} type="email" value={formData.paypalEmail} onChange={handleChange} error={errors.paypalEmail} />
                                            <Input id="confirmPaypalEmail" label="Re-enter PayPal Email" placeholder="Re-enter PayPal email" icon={Mail} type="email" value={formData.confirmPaypalEmail} onChange={handleChange} error={errors.confirmPaypalEmail} />
                                        </div>
                                        <div className="form-row" style={{marginBottom:10}}>
                                            <Input id="paypalLegalName" label="Registered Legal Name" placeholder="Must match PayPal account" icon={User} value={formData.paypalLegalName} onChange={handleChange} error={errors.paypalLegalName} />
                                            <Input id="panNumberPaypal" label="PAN Number (RBI Compliance)" placeholder="ABCDE1234F" icon={Hash} value={formData.panNumberPaypal} onChange={handleChange} error={errors.panNumberPaypal} maxLength={10} />
                                        </div>
                                        <div className="select-container">
                                            <label>Purpose Code (RBI for cross-border)</label>
                                            <select id="purposeCode" value={formData.purposeCode||'Goods'} onChange={handleChange} className="custom-select">
                                                <option value="Goods">Goods (P0101)</option>
                                                <option value="Software Services">Software Services (P0102)</option>
                                                <option value="Consultancy">Consultancy (P0103)</option>
                                                <option value="Freelance">Freelance (P0104)</option>
                                                <option value="E-Commerce">E-Commerce (P0105)</option>
                                                <option value="Other">Other (P0199)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="info-text" style={{gridColumn:'1/-1'}}><Info size={14} className="mr-1" /> Your details are encrypted and stored securely.</div>
                            </div>
                            <div className="step-actions mt-12">
                                <Button variant="outline" onClick={handleBackStep} className="gap-2"><ArrowLeft size={18} /> Back</Button>
                                <Button onClick={handleNextStep} className="orange-btn">Next Step</Button>
                            </div>
                        </div>
                    )}{currentStep === 4 && (
                        <div className="form-step-content">
                            <div className="step-header">
                                <span className="step-badge">STEP 4: FINAL STEP</span>
                                <h2>Agreements & Policies</h2>
                                <p>Review and accept our legal terms to finalize your vendor profile.</p>
                            </div>
                            <div className="agreements-list">
                                <div className="agreement-item">
                                    <Checkbox id="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} />
                                    <label htmlFor="agreeTerms">I agree to the <span className="highlight">Terms & Conditions</span> and legal requirements.</label>
                                </div>
                                <div className="agreement-item">
                                    <Checkbox id="agreePolicies" checked={formData.agreePolicies} onChange={handleChange} />
                                    <label htmlFor="agreePolicies">I agree to the <span className="highlight">Marketplace Policies</span> for product quality.</label>
                                </div>
                                <div className="agreement-item">
                                    <Checkbox id="agreeRules" checked={formData.agreeRules} onChange={handleChange} />
                                    <label htmlFor="agreeRules">I have read and understood the <span className="highlight">Vendor Rules</span> and conduct.</label>
                                </div>
                                <div className="agreement-item">
                                    <Checkbox id="agreePrivacy" checked={formData.agreePrivacy} onChange={handleChange} />
                                    <label htmlFor="agreePrivacy">I agree to the <span className="highlight">Privacy Policy</span> and data processing.</label>
                                </div>
                            </div>
                            <div className="step-actions mt-12">
                                <Button variant="outline" onClick={handleBackStep} className="gap-2"><ArrowLeft size={18} /> Back</Button>
                                <Button onClick={handleSubmit} className="orange-btn large-btn">Create Vendor Account</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="register-page vendor-mode">
            <div className="register-layout-wrapper vendor-card-layout">
                {/* Hero Section */}
                <div
                    className="register-hero"
                    style={{
                        backgroundImage: `url(${isVendor ? VENDOR_STEP_IMAGES[currentStep - 1] : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80'})`
                    }}
                >
                    <div className="hero-content">
                        <h1>{isVendor ? VENDOR_STEPS_CONTENT[currentStep - 1].title : "Create Your Account"}</h1>
                        <p>{isVendor ? VENDOR_STEPS_CONTENT[currentStep - 1].description : "Join our community of creators and artisans."}</p>
                    </div>

                    <div className="hero-footer-links">
                        <Link to="#">Privacy</Link>
                        <Link to="#">Terms</Link>
                        <Link to="#">Support</Link>
                    </div>

                    {renderStepIndicators()}
                </div>

                {/* Form Content */}
                <div className="register-content">
                    {renderForm()}
                </div>
            </div>

            <MapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                onSelect={handleSelectLocation}
                initialLat={formData.stores[activeStoreIndex]?.latitude}
                initialLon={formData.stores[activeStoreIndex]?.longitude}
            />
        </div>
    );
};

export default RegisterPage;
