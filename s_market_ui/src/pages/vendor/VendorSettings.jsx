import React, { useState, useEffect, useCallback, useRef } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorSettings.css';
import { saveStoreSettings, getStoreSettings, getVendorProfile } from '../../api/api';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
// CONSTANTS & STORAGE HELPERS
// ═══════════════════════════════════════════════════════════
const LS_KEY = 'vendor_settings_data_v2';

const DEFAULT_STATE = {
    store: {
        name: '', slug: '', email: '', phone: '',
        bannerType: 'Static Image', bannerImg: null, logoImg: null,
        mobileBannerImg: null, listBannerType: 'Static Image', listBannerImg: null,
        shopDescription: '', namePosition: 'At Header', perPage: '10',
        hideEmail: false, hidePhone: false, hideAddress: false,
        hideMap: false, hideAbout: false, hidePolicy: false,
    },
    location: {
        street: '', street2: '', city: '', postcode: '',
        country: 'India', state: 'Maharashtra',
        latitude: '', longitude: ''
    },
    payment: { 
        selectedMethod: 'PayPal', 
        paypalEmail: '',
        skrillEmail: '',
        bankDetails: {
            accountName: '',
            accountNumber: '',
            bankName: '',
            bankAddress: '',
            routingNumber: '',
            iban: '',
            swiftCode: '',
            ifscCode: ''
        }
    },
    shipping: { enabled: true, processingTime: 'Ready to ship in...', type: 'Shipping by Zone' },
    seo: { 
        title: '', metaDesc: '', metaKeywords: '', 
        fbTitle: '', fbDesc: '', fbImg: null,
        twTitle: '', twDesc: '', twImg: null 
    },
    policies: { tabLabel: '', shipping: '', refund: '', cancellation: '' },
    support: { phone: '', email: '', address1: '', address2: '', country: 'India', city: '', state: 'Maharashtra', postcode: '' },
    hours: {
        enabled: false, disablePurchaseOff: false, weekOff: [],
        slots: {
            Monday: { open: '', close: '' }, Tuesday: { open: '', close: '' },
            Wednesday: { open: '', close: '' }, Thursday: { open: '', close: '' },
            Friday: { open: '', close: '' }, Saturday: { open: '', close: '' },
            Sunday: { open: '', close: '' }
        }
    }
};

// ═══════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════

const Section = ({ title, children }) => (
    <div className="vs-section-card">
        <h3 className="vs-section-title">{title}</h3>
        <div className="vs-section-content">{children}</div>
    </div>
);

const FormRow = ({ label, required, hint, children, vertical = false }) => (
    <div className={`vs-form-row ${vertical ? 'vs-row-vertical' : ''}`}>
        <label className="vs-label">
            {label} {required && <span className="vs-req">*</span>}
            {hint && <span className="vs-hint-icon" title={hint}>?</span>}
        </label>
        <div className="vs-input-wrap">{children}</div>
    </div>
);

const ImageUpload = ({ value, onChange, label, sublabel }) => {
    const fileRef = useRef();
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => onChange(ev.target.result);
            reader.readAsDataURL(file);
        }
    };
    return (
        <div className="vs-upload-container">
            <div className="vs-upload-box" onClick={() => fileRef.current.click()}>
                {value ? <img src={value} alt="upload" className="vs-preview" /> : 
                <div className="vs-placeholder-box"><span className="vs-placeholder-icon">Upload</span></div>}
                <input type="file" hidden ref={fileRef} onChange={handleFile} accept="image/*" />
            </div>
            {sublabel && <p className="vs-upload-sublabel">{sublabel}</p>}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const VendorSettings = () => {
    const [activeTab, setActiveTab] = useState('Store');
    const [formData, setFormData] = useState(DEFAULT_STATE);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) { setLoading(false); return; }
        let vendorId;
        try {
            const user = JSON.parse(userStr);
            vendorId = user.userId || user.id;
        } catch (e) { setLoading(false); return; }
        if (!vendorId) { setLoading(false); return; }

        Promise.all([
            getStoreSettings().catch(() => null),
            getVendorProfile().catch(() => null),
        ]).then(([settingsData, profile]) => {
            const updates = {};

            // Apply saved store settings
            if (settingsData && settingsData.settings) {
                try {
                    const parsed = JSON.parse(settingsData.settings);
                    Object.assign(updates, parsed);
                } catch (e) {}
            }

            // Apply vendor registration profile data dynamically
            if (profile) {
                if (profile.name) updates.store = { ...updates.store, name: profile.name };
                if (profile.email) updates.store = { ...updates.store, email: profile.email };
                if (profile.phone) updates.store = { ...updates.store, phone: profile.phone };
                if (profile.paymentEmail) updates.payment = { ...updates.payment, paypalEmail: profile.paymentEmail };
                if (profile.paymentMethod) updates.payment = { ...updates.payment, selectedMethod: profile.paymentMethod };
                if (profile.stores && profile.stores.length > 0) {
                    const s = profile.stores[0];
                    if (s.street) updates.location = { ...updates.location, street: s.street };
                    if (s.city) updates.location = { ...updates.location, city: s.city };
                    if (s.state) updates.location = { ...updates.location, state: s.state };
                    if (s.country) updates.location = { ...updates.location, country: s.country };
                    if (s.pincode) updates.location = { ...updates.location, postcode: s.pincode };
                }
            }

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));
            }
        }).catch(() => {
            const saved = localStorage.getItem(LS_KEY);
            if (saved) {
                try { setFormData(JSON.parse(saved)); } catch (e) {}
            }
        }).finally(() => setLoading(false));
    }, []);

    const getVendorId = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.userId || user.id;
        } catch (e) { return null; }
    };

    const calculateProgress = () => {
        const fields = [
            formData.store.name, formData.store.logoImg, formData.store.bannerImg,
            formData.store.shopDescription, formData.location.street, 
            formData.payment.selectedMethod === 'PayPal' ? formData.payment.paypalEmail : formData.payment.bankDetails.accountName, 
            formData.seo.title
        ];
        const completed = fields.filter(f => f && f.length > 0).length;
        return Math.round((completed / fields.length) * 100);
    };

    const updateField = (tab, field, value) => {
        setFormData(prev => ({
            ...prev,
            [tab]: { ...prev[tab], [field]: value }
        }));
    };

    const updateBankDetail = (field, value) => {
        setFormData(prev => ({
            ...prev,
            payment: {
                ...prev.payment,
                bankDetails: {
                    ...prev.payment.bankDetails,
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const vendorId = getVendorId();
        if (!vendorId) {
            toast.error('Vendor ID not found. Please re-login.');
            setSaving(false);
            return;
        }
        try {
            await saveStoreSettings(JSON.stringify(formData));
            localStorage.setItem(LS_KEY, JSON.stringify(formData));
            toast.success('Settings saved successfully!');
        } catch (err) {
            toast.error(err?.message || 'Failed to save settings. Saved locally.');
            localStorage.setItem(LS_KEY, JSON.stringify(formData));
        } finally {
            setSaving(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Store':
                return (
                    <>
                        <Section title="General Setting">
                            <FormRow label="Store Name" required>
                                <input type="text" placeholder="Enter store name" value={formData.store.name} onChange={e => updateField('store', 'name', e.target.value)} />
                            </FormRow>
                            <FormRow label="Store Slug" required>
                                <input type="text" placeholder="your-store-slug" value={formData.store.slug} onChange={e => updateField('store', 'slug', e.target.value)} />
                            </FormRow>
                            <FormRow label="Store Email">
                                <input type="email" placeholder="store@example.com" value={formData.store.email} onChange={e => updateField('store', 'email', e.target.value)} />
                            </FormRow>
                            <FormRow label="Store Phone">
                                <input type="text" placeholder="+1 234 567 8900" value={formData.store.phone} onChange={e => updateField('store', 'phone', e.target.value)} />
                            </FormRow>
                        </Section>

                        <Section title="Store Brand Setup">
                            <FormRow label="Store Logo" hint="Upload your store logo">
                                <ImageUpload value={formData.store.logoImg} onChange={v => updateField('store', 'logoImg', v)} />
                            </FormRow>
                            <FormRow label="Store Banner Type">
                                <select value={formData.store.bannerType} onChange={e => updateField('store', 'bannerType', e.target.value)}>
                                    <option>Static Image</option><option>Video</option><option>Slider</option>
                                </select>
                            </FormRow>
                            <FormRow label="Store Banner" hint="Upload store banner">
                                <ImageUpload value={formData.store.bannerImg} onChange={v => updateField('store', 'bannerImg', v)} />
                            </FormRow>
                            <div className="vs-brand-grid">
                                <FormRow label="Mobile Banner" hint="Upload mobile banner" vertical>
                                    <ImageUpload value={formData.store.mobileBannerImg} onChange={v => updateField('store', 'mobileBannerImg', v)} />
                                </FormRow>
                                <FormRow label="Store List Banner Type" vertical>
                                    <select value={formData.store.listBannerType} onChange={e => updateField('store', 'listBannerType', e.target.value)}>
                                        <option>Static Image</option><option>Video</option>
                                    </select>
                                </FormRow>
                            </div>
                            <FormRow label="Store List Banner" hint="Upload list banner">
                                <ImageUpload value={formData.store.listBannerImg} onChange={v => updateField('store', 'listBannerImg', v)} />
                            </FormRow>
                            <FormRow label="Shop Description" hint="Write your description" vertical>
                                <div className="vs-rich-editor">
                                    <textarea rows="5" placeholder="Write your description here..." value={formData.store.shopDescription} onChange={e => updateField('store', 'shopDescription', e.target.value)} />
                                </div>
                            </FormRow>
                        </Section>

                        <Section title="Store Visibility Setup">
                            <FormRow label="Store Name Position" hint="Select where to show name">
                                <select value={formData.store.namePosition} onChange={e => updateField('store', 'namePosition', e.target.value)}>
                                    <option>At Header</option><option>On Banner</option><option>All results</option>
                                </select>
                            </FormRow>
                            <FormRow label="Products per page" hint="Number of products">
                                <input type="number" value={formData.store.perPage} onChange={e => updateField('store', 'perPage', e.target.value)} />
                            </FormRow>
                            {['Email', 'Phone', 'Address', 'Map', 'About', 'Policy'].map(item => (
                                <FormRow label={`Hide ${item} from Store`} key={item}>
                                    <input type="checkbox" checked={formData.store[`hide${item}`]} onChange={e => updateField('store', `hide${item}`, e.target.checked)} />
                                </FormRow>
                            ))}
                        </Section>
                    </>
                );

            case 'Location':
                return (
                    <>
                        <Section title="Store Address">
                            <FormRow label="Street">
                                <input type="text" value={formData.location.street} onChange={e => updateField('location', 'street', e.target.value)} />
                            </FormRow>
                            <FormRow label="Street 2">
                                <input type="text" value={formData.location.street2} onChange={e => updateField('location', 'street2', e.target.value)} />
                            </FormRow>
                            <FormRow label="City/Town">
                                <input type="text" value={formData.location.city} onChange={e => updateField('location', 'city', e.target.value)} />
                            </FormRow>
                            <FormRow label="Postcode/Zip">
                                <input type="text" value={formData.location.postcode} onChange={e => updateField('location', 'postcode', e.target.value)} />
                            </FormRow>
                            <FormRow label="Country">
                                <select value={formData.location.country} onChange={e => updateField('location', 'country', e.target.value)}>
                                    <option>India</option>
                                    <option>United States</option>
                                    <option>United Kingdom</option>
                                    <option>Canada</option>
                                    <option>Australia</option>
                                    <option>Germany</option>
                                    <option>France</option>
                                    <option>Singapore</option>
                                    <option>United Arab Emirates</option>
                                </select>
                            </FormRow>
                        </Section>
                        <Section title="Store Location">
                            <FormRow label="Find Location">
                                <div className="vs-map-search">
                                    <input type="text" placeholder="Search for location..." onChange={e => updateField('location', 'address', e.target.value)} />
                                    {formData.location.latitude && formData.location.longitude ? (
                                        <iframe
                                            title="Store Map"
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.location.longitude) - 0.01},${parseFloat(formData.location.latitude) - 0.01},${parseFloat(formData.location.longitude) + 0.01},${parseFloat(formData.location.latitude) + 0.01}&layer=mapnik&marker=${formData.location.latitude},${formData.location.longitude}`}
                                            width="100%" height="250" style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="vs-map-placeholder">Enter latitude/longitude above to preview location on map</div>
                                    )}
                                </div>
                            </FormRow>
                            <FormRow label="Latitude" hint="Decimal latitude, e.g. 19.0760">
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 19.0760"
                                    value={formData.location.latitude}
                                    onChange={e => updateField('location', 'latitude', e.target.value)}
                                />
                            </FormRow>
                            <FormRow label="Longitude" hint="Decimal longitude, e.g. 72.8777">
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 72.8777"
                                    value={formData.location.longitude}
                                    onChange={e => updateField('location', 'longitude', e.target.value)}
                                />
                            </FormRow>
                        </Section>
                    </>
                );

            case 'Payment':
                return (
                    <Section title="Payment Method">
                        <FormRow label="Preferred Payment Method">
                            <select 
                                value={formData.payment.selectedMethod} 
                                onChange={e => updateField('payment', 'selectedMethod', e.target.value)}
                            >
                                <option value="PayPal">PayPal</option>
                                <option value="Skrill">Skrill</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash Pay">Cash Pay</option>
                                <option value="Wirecard">Wirecard (Moip)</option>
                            </select>
                        </FormRow>

                        {formData.payment.selectedMethod === 'PayPal' && (
                            <FormRow label="PayPal Email">
                                <input 
                                    type="email" 
                                    placeholder="paypal@example.com"
                                    value={formData.payment.paypalEmail} 
                                    onChange={e => updateField('payment', 'paypalEmail', e.target.value)} 
                                />
                            </FormRow>
                        )}

                        {formData.payment.selectedMethod === 'Skrill' && (
                            <FormRow label="Skrill Email">
                                <input 
                                    type="email" 
                                    placeholder="skrill@example.com"
                                    value={formData.payment.skrillEmail} 
                                    onChange={e => updateField('payment', 'skrillEmail', e.target.value)} 
                                />
                            </FormRow>
                        )}

                        {formData.payment.selectedMethod === 'Bank Transfer' && (
                            <div className="vs-bank-details-sub">
                                <h4 className="vs-sub-title">Bank Details</h4>
                                <FormRow label="Account Name">
                                    <input type="text" placeholder="Account Name" value={formData.payment.bankDetails.accountName} onChange={e => updateBankDetail('accountName', e.target.value)} />
                                </FormRow>
                                <FormRow label="Account Number">
                                    <input type="text" placeholder="Account Number" value={formData.payment.bankDetails.accountNumber} onChange={e => updateBankDetail('accountNumber', e.target.value)} />
                                </FormRow>
                                <FormRow label="Bank Name">
                                    <input type="text" placeholder="Bank Name" value={formData.payment.bankDetails.bankName} onChange={e => updateBankDetail('bankName', e.target.value)} />
                                </FormRow>
                                <FormRow label="Bank Address">
                                    <input type="text" placeholder="Bank Address" value={formData.payment.bankDetails.bankAddress} onChange={e => updateBankDetail('bankAddress', e.target.value)} />
                                </FormRow>
                                <FormRow label="Routing Number">
                                    <input type="text" placeholder="Routing Number" value={formData.payment.bankDetails.routingNumber} onChange={e => updateBankDetail('routingNumber', e.target.value)} />
                                </FormRow>
                                <FormRow label="IBAN">
                                    <input type="text" placeholder="IBAN" value={formData.payment.bankDetails.iban} onChange={e => updateBankDetail('iban', e.target.value)} />
                                </FormRow>
                                <FormRow label="Swift Code">
                                    <input type="text" placeholder="Swift Code" value={formData.payment.bankDetails.swiftCode} onChange={e => updateBankDetail('swiftCode', e.target.value)} />
                                </FormRow>
                                <FormRow label="IFSC Code">
                                    <input type="text" placeholder="IFSC Code" value={formData.payment.bankDetails.ifscCode} onChange={e => updateBankDetail('ifscCode', e.target.value)} />
                                </FormRow>
                            </div>
                        )}
                    </Section>
                );

            case 'Shipping':
                return (
                    <Section title="Shipping Settings">
                        <FormRow label="Enable Shipping" hint="Enable store shipping">
                            <input type="checkbox" checked={formData.shipping.enabled} onChange={e => updateField('shipping', 'enabled', e.target.checked)} />
                        </FormRow>
                        <FormRow label="Processing Time" hint="Ready to ship in...">
                            <select value={formData.shipping.processingTime} onChange={e => updateField('shipping', 'processingTime', e.target.value)}>
                                <option>Ready to ship in...</option><option>1-3 business days</option>
                            </select>
                        </FormRow>
                        <FormRow label="Shipping Type" hint="Type of shipping">
                            <select value={formData.shipping.type} onChange={e => updateField('shipping', 'type', e.target.value)}>
                                <option>Shipping by Zone</option>
                            </select>
                        </FormRow>
                        <div className="vs-info-box">No shipping zone found for configuration. Please contact admin.</div>
                    </Section>
                );

            case 'SEO':
                return (
                    <>
                        <Section title="General Setup">
                            <FormRow label="SEO Title" hint="Search engine title">
                                <input type="text" value={formData.seo.title} onChange={e => updateField('seo', 'title', e.target.value)} />
                            </FormRow>
                            <FormRow label="Meta Description" hint="Description for search engines" vertical>
                                <textarea value={formData.seo.metaDesc} onChange={e => updateField('seo', 'metaDesc', e.target.value)} />
                            </FormRow>
                            <FormRow label="Meta Keywords" hint="Keywords for search engines" vertical>
                                <textarea value={formData.seo.metaKeywords} onChange={e => updateField('seo', 'metaKeywords', e.target.value)} />
                            </FormRow>
                        </Section>
                        <Section title="Facebook Setup">
                            <FormRow label="Facebook Title">
                                <input type="text" value={formData.seo.fbTitle} onChange={e => updateField('seo', 'fbTitle', e.target.value)} />
                            </FormRow>
                            <FormRow label="Facebook Description" vertical>
                                <textarea value={formData.seo.fbDesc} onChange={e => updateField('seo', 'fbDesc', e.target.value)} />
                            </FormRow>
                            <FormRow label="Facebook Image">
                                <ImageUpload value={formData.seo.fbImg} onChange={v => updateField('seo', 'fbImg', v)} />
                            </FormRow>
                        </Section>
                    </>
                );

            case 'Store Policies':
                return (
                    <Section title="Policies Setting">
                        <FormRow label="Policy Tab Label">
                            <input type="text" value={formData.policies.tabLabel} onChange={e => updateField('policies', 'tabLabel', e.target.value)} />
                        </FormRow>
                        <FormRow label="Shipping Policy" vertical>
                            <textarea rows="6" value={formData.policies.shipping} onChange={e => updateField('policies', 'shipping', e.target.value)} />
                        </FormRow>
                        <FormRow label="Refund Policy" vertical>
                            <textarea rows="6" value={formData.policies.refund} onChange={e => updateField('policies', 'refund', e.target.value)} />
                        </FormRow>
                        <FormRow label="Cancellation Policy" vertical>
                            <textarea rows="6" value={formData.policies.cancellation} onChange={e => updateField('policies', 'cancellation', e.target.value)} />
                        </FormRow>
                    </Section>
                );

            case 'Customer Support':
                return (
                    <Section title="Support Details">
                        <FormRow label="Phone">
                            <input type="text" value={formData.support.phone} onChange={e => updateField('support', 'phone', e.target.value)} />
                        </FormRow>
                        <FormRow label="Email">
                            <input type="email" value={formData.support.email} onChange={e => updateField('support', 'email', e.target.value)} />
                        </FormRow>
                        <FormRow label="Address 1">
                            <input type="text" value={formData.support.address1} onChange={e => updateField('support', 'address1', e.target.value)} />
                        </FormRow>
                        <FormRow label="Country">
                            <select value={formData.support.country} onChange={e => updateField('support', 'country', e.target.value)}>
                                <option>India</option>
                            </select>
                        </FormRow>
                        <FormRow label="City/Town">
                            <input type="text" value={formData.support.city} onChange={e => updateField('support', 'city', e.target.value)} />
                        </FormRow>
                    </Section>
                );

            case 'Store Hours':
                return (
                    <>
                        <Section title="Store Hours Setting">
                            <FormRow label="Enable Store Hours">
                                <input type="checkbox" checked={formData.hours.enabled} onChange={e => updateField('hours', 'enabled', e.target.checked)} />
                            </FormRow>
                            <FormRow label="Disable Purchase Off Time">
                                <input type="checkbox" checked={formData.hours.disablePurchaseOff} onChange={e => updateField('hours', 'disablePurchaseOff', e.target.checked)} />
                            </FormRow>
                        </Section>
                        <Section title="Daily Basis Opening & Closing Hours">
                            {Object.keys(formData.hours.slots).map(day => (
                                <div key={day} className="vs-hours-row-card">
                                    <div className="vs-day-header">{day} Time Slots</div>
                                    <div className="vs-slots-flex">
                                        <div className="vs-slot-input">
                                            <label>Opening</label>
                                            <input type="time" value={formData.hours.slots[day].open} onChange={e => {
                                                const newSlots = { ...formData.hours.slots, [day]: { ...formData.hours.slots[day], open: e.target.value } };
                                                setFormData({ ...formData, hours: { ...formData.hours, slots: newSlots } });
                                            }} />
                                        </div>
                                        <div className="vs-slot-input">
                                            <label>Closing</label>
                                            <input type="time" value={formData.hours.slots[day].close} onChange={e => {
                                                const newSlots = { ...formData.hours.slots, [day]: { ...formData.hours.slots[day], close: e.target.value } };
                                                setFormData({ ...formData, hours: { ...formData.hours, slots: newSlots } });
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Section>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <VendorLayout>
            <div className="vs-wrapper">
                <div className="vs-tab-header">
                    <h2>{activeTab}</h2>
                    <p>Manage your {activeTab.toLowerCase()} settings below.</p>
                </div>
                <div className="vs-header-area">
                    <div className="vs-completeness">
                        <div className="vs-comp-text">
                            <span>Profile Completeness</span>
                            <span>{calculateProgress()}%</span>
                        </div>
                        <div className="vs-progress-bg">
                            <div className="vs-progress-fill" style={{ width: `${calculateProgress()}%` }}></div>
                        </div>
                        <p className="vs-suggestions">Suggestions: Add Store Logo, Add Store Banner, Add Store Description, Setup SEO</p>
                    </div>
                </div>

                <div className="vs-main-layout">
                    <aside className="vs-sidebar">
                        <div className="vs-sidebar-label"></div>
                        {['Store', 'Location', 'Payment', 'Shipping', 'SEO', 'Store Policies', 'Customer Support', 'Store Hours'].map(tab => (
                            <button
                                key={tab}
                                className={`vs-tab-link ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </aside>

                    <main className="vs-content-body">
                        {loading ? (
                            <div style={{textAlign:'center',padding:'60px 0',color:'var(--text-3)'}}>Loading settings...</div>
                        ) : (
                            <>
                            {renderContent()}
                            <div className="vs-footer-actions">
                                <button className="vs-btn-cancel" onClick={() => window.location.reload()}>Reset</button>
                                <button className="vs-btn-save" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorSettings;