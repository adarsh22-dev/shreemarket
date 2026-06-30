import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Truck, Tag, Weight, DollarSign, Edit3, Trash2, Clock, ToggleLeft, ToggleRight, GripVertical, AlertCircle } from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorShippingRules, createVendorShippingRule, updateVendorShippingRule, deleteVendorShippingRule, toggleVendorShippingRule } from '../../api/api';
import toast from 'react-hot-toast';
import './VendorShippingRules.css';

const RULE_TYPES = [
    { value: 'flat_rate', label: 'Flat Rate', icon: DollarSign, desc: 'Single fixed shipping cost per order' },
    { value: 'free_shipping', label: 'Free Shipping', icon: Truck, desc: 'Free shipping above a minimum order amount' },
    { value: 'per_product', label: 'Per Product', icon: Tag, desc: 'Base rate + additional charge per item' },
    { value: 'weight_based', label: 'Weight Based', icon: Weight, desc: 'Rate per kilogram of total order weight' },
];

const EMPTY_RULE = {
    name: '',
    ruleType: 'flat_rate',
    rate: '',
    minOrderAmount: '',
    perProductRate: '',
    ratePerKg: '',
    maxWeight: '',
    estimatedDaysMin: '',
    estimatedDaysMax: '',
    applicableCategories: '',
    applicablePincodes: '',
    isActive: true,
    sortOrder: 0,
};

const VendorShippingRules = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_RULE });
    const [saving, setSaving] = useState(false);

    const fetchRules = useCallback(async () => {
        try {
            const data = await getVendorShippingRules();
            if (Array.isArray(data)) setRules(data);
            else if (data?.content) setRules(data.content);
            else setRules([]);
        } catch (err) {
            console.error('Failed to fetch shipping rules:', err);
            toast.error('Failed to load shipping rules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRules(); }, [fetchRules]);

    const openCreateModal = () => {
        setEditingRule(null);
        setFormData({ ...EMPTY_RULE });
        setShowModal(true);
    };

    const openEditModal = (rule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name || '',
            ruleType: rule.ruleType || 'flat_rate',
            rate: rule.rate?.toString() || '',
            minOrderAmount: rule.minOrderAmount?.toString() || '',
            perProductRate: rule.perProductRate?.toString() || '',
            ratePerKg: rule.ratePerKg?.toString() || '',
            maxWeight: rule.maxWeight?.toString() || '',
            estimatedDaysMin: rule.estimatedDaysMin?.toString() || '',
            estimatedDaysMax: rule.estimatedDaysMax?.toString() || '',
            applicableCategories: rule.applicableCategories || '',
            applicablePincodes: rule.applicablePincodes || '',
            isActive: rule.isActive ?? true,
            sortOrder: rule.sortOrder || 0,
        });
        setShowModal(true);
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Rule name is required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                ruleType: formData.ruleType,
                rate: formData.rate ? parseFloat(formData.rate) : null,
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
                perProductRate: formData.perProductRate ? parseFloat(formData.perProductRate) : null,
                ratePerKg: formData.ratePerKg ? parseFloat(formData.ratePerKg) : null,
                maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : null,
                estimatedDaysMin: formData.estimatedDaysMin ? parseInt(formData.estimatedDaysMin) : null,
                estimatedDaysMax: formData.estimatedDaysMax ? parseInt(formData.estimatedDaysMax) : null,
                applicableCategories: formData.applicableCategories || null,
                applicablePincodes: formData.applicablePincodes || null,
                isActive: formData.isActive,
                sortOrder: formData.sortOrder,
            };

            if (editingRule) {
                await updateVendorShippingRule(editingRule.id, payload);
                toast.success('Shipping rule updated');
            } else {
                await createVendorShippingRule(payload);
                toast.success('Shipping rule created');
            }
            setShowModal(false);
            fetchRules();
        } catch (err) {
            toast.error(err.message || 'Failed to save shipping rule');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (rule) => {
        if (!window.confirm(`Delete "${rule.name}"? This cannot be undone.`)) return;
        try {
            await deleteVendorShippingRule(rule.id);
            toast.success('Shipping rule deleted');
            fetchRules();
        } catch (err) {
            toast.error(err.message || 'Failed to delete shipping rule');
        }
    };

    const handleToggle = async (rule) => {
        try {
            const updated = await toggleVendorShippingRule(rule.id);
            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: updated.isActive } : r));
            toast.success(updated.isActive ? 'Rule enabled' : 'Rule disabled');
        } catch (err) {
            toast.error(err.message || 'Failed to toggle rule');
        }
    };

    const getRuleTypeInfo = (type) => RULE_TYPES.find(t => t.value === type) || RULE_TYPES[0];

    const renderFormFields = () => {
        const type = formData.ruleType;
        return (
            <>
                <div className="vsr-form-row">
                    <label className="vsr-label">Rule Name <span className="vsr-req">*</span></label>
                    <input type="text" className="vsr-input" placeholder="e.g. Standard Shipping"
                        value={formData.name} onChange={e => handleFieldChange('name', e.target.value)} />
                </div>

                <div className="vsr-form-row">
                    <label className="vsr-label">Rule Type</label>
                    <select className="vsr-input" value={formData.ruleType} onChange={e => handleFieldChange('ruleType', e.target.value)}>
                        {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                {(type === 'flat_rate' || type === 'per_product') && (
                    <div className="vsr-form-row">
                        <label className="vsr-label">Base Rate (₹)</label>
                        <input type="number" min="0" step="0.01" className="vsr-input"
                            placeholder="e.g. 49" value={formData.rate} onChange={e => handleFieldChange('rate', e.target.value)} />
                    </div>
                )}

                {type === 'free_shipping' && (
                    <div className="vsr-form-row">
                        <label className="vsr-label">Minimum Order Amount (₹)</label>
                        <input type="number" min="0" step="0.01" className="vsr-input"
                            placeholder="e.g. 499" value={formData.minOrderAmount} onChange={e => handleFieldChange('minOrderAmount', e.target.value)} />
                    </div>
                )}

                {type === 'per_product' && (
                    <div className="vsr-form-row">
                        <label className="vsr-label">Per-Product Rate (₹)</label>
                        <input type="number" min="0" step="0.01" className="vsr-input"
                            placeholder="e.g. 10" value={formData.perProductRate} onChange={e => handleFieldChange('perProductRate', e.target.value)} />
                    </div>
                )}

                {type === 'weight_based' && (
                    <>
                        <div className="vsr-form-row">
                            <label className="vsr-label">Rate per Kg (₹)</label>
                            <input type="number" min="0" step="0.01" className="vsr-input"
                                placeholder="e.g. 15" value={formData.ratePerKg} onChange={e => handleFieldChange('ratePerKg', e.target.value)} />
                        </div>
                        <div className="vsr-form-row">
                            <label className="vsr-label">Max Weight (kg)</label>
                            <input type="number" min="0" step="0.1" className="vsr-input"
                                placeholder="Leave empty for unlimited" value={formData.maxWeight} onChange={e => handleFieldChange('maxWeight', e.target.value)} />
                        </div>
                    </>
                )}

                <div className="vsr-form-row vsr-row-half">
                    <div>
                        <label className="vsr-label">Est. Delivery (Min Days)</label>
                        <input type="number" min="1" className="vsr-input"
                            placeholder="e.g. 3" value={formData.estimatedDaysMin} onChange={e => handleFieldChange('estimatedDaysMin', e.target.value)} />
                    </div>
                    <div>
                        <label className="vsr-label">Est. Delivery (Max Days)</label>
                        <input type="number" min="1" className="vsr-input"
                            placeholder="e.g. 7" value={formData.estimatedDaysMax} onChange={e => handleFieldChange('estimatedDaysMax', e.target.value)} />
                    </div>
                </div>

                <div className="vsr-form-row">
                    <label className="vsr-label">Applicable Pincodes</label>
                    <input type="text" className="vsr-input" placeholder="Comma-separated pincodes (e.g. 400001, 400002). Leave empty for all."
                        value={formData.applicablePincodes} onChange={e => handleFieldChange('applicablePincodes', e.target.value)} />
                </div>
            </>
        );
    };

    if (loading) {
        return (
            <VendorLayout>
                <div className="vsr-container">
                    <div className="vsr-loading">Loading shipping rules...</div>
                </div>
            </VendorLayout>
        );
    }

    return (
        <VendorLayout>
            <div className="vsr-container">
                {/* Header */}
                <div className="vsr-header">
                    <div>
                        <h1>Shipping Rules</h1>
                        <p>Configure custom shipping rules for your store — flat rates, free shipping thresholds, per-product charges, and weight-based rates.</p>
                    </div>
                    <button className="vsr-btn-primary" onClick={openCreateModal}>
                        <Plus size={18} /> Add Rule
                    </button>
                </div>

                {/* Rule Types Overview */}
                <div className="vsr-types-row">
                    {RULE_TYPES.map(type => {
                        const Icon = type.icon;
                        const count = rules.filter(r => r.ruleType === type.value).length;
                        return (
                            <div key={type.value} className="vsr-type-card">
                                <div className="vsr-type-icon"><Icon size={22} /></div>
                                <div className="vsr-type-info">
                                    <div className="vsr-type-name">{type.label}</div>
                                    <div className="vsr-type-desc">{type.desc}</div>
                                </div>
                                <div className="vsr-type-count">{count}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Rules List */}
                {rules.length === 0 ? (
                    <div className="vsr-empty">
                        <Truck size={48} color="#ccc" />
                        <h3>No Shipping Rules Yet</h3>
                        <p>Add your first shipping rule to control how customers are charged for delivery.</p>
                        <button className="vsr-btn-primary" onClick={openCreateModal}>
                            <Plus size={18} /> Create Your First Rule
                        </button>
                    </div>
                ) : (
                    <div className="vsr-tw">
                        <table className="vsr-tbl">
                            <thead>
                                <tr>
                                    <th>Rule Name</th>
                                    <th>Type</th>
                                    <th>Rate</th>
                                    <th>Free Above</th>
                                    <th>Est. Days</th>
                                    <th>Status</th>
                                    <th className="vsr-th-r">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule, index) => {
                                    const typeInfo = getRuleTypeInfo(rule.ruleType);
                                    const TypeIcon = typeInfo.icon;
                                    const rate = rule.rate != null ? `₹${rule.rate}` : (rule.ruleType === 'free_shipping' ? 'Free' : (rule.ruleType === 'weight_based' ? `₹${rule.ratePerKg}/kg` : '\u2014'));
                                    const freeAbove = rule.minOrderAmount != null ? `₹${rule.minOrderAmount}` : '\u2014';
                                    const estDays = rule.estimatedDaysMin ? `${rule.estimatedDaysMin}\u2013${rule.estimatedDaysMax || '-'} days` : '\u2014';
                                    return (
                                        <tr key={rule.id} className={rule.isActive ? '' : 'vsr-inactive'}>
                                            <td style={{fontWeight:600}}>{rule.name}</td>
                                            <td><span className="vsr-rule-type-label">{typeInfo.label}</span></td>
                                            <td>{rate}</td>
                                            <td>{freeAbove}</td>
                                            <td style={{fontSize:'.78rem', color:'#64748b'}}>{estDays}</td>
                                            <td>{rule.isActive ? <span style={{background:'#dcfce7', color:'#16a34a', padding:'2px 8px', borderRadius:5, fontSize:'.68rem', fontWeight:700}}>Active</span> : <span style={{background:'#f1f5f9', color:'#64748b', padding:'2px 8px', borderRadius:5, fontSize:'.68rem', fontWeight:700}}>Disabled</span>}</td>
                                            <td>
                                                <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                                                    <button className="vsr-action-btn" onClick={() => handleToggle(rule)} title={rule.isActive ? 'Disable' : 'Enable'}>
                                                        {rule.isActive ? <ToggleRight size={16} className="vsr-icon-active" /> : <ToggleLeft size={16} className="vsr-icon-inactive" />}
                                                    </button>
                                                    <button className="vsr-action-btn" onClick={() => openEditModal(rule)} title="Edit">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button className="vsr-action-btn vsr-action-delete" onClick={() => handleDelete(rule)} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="vsr-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="vsr-modal" onClick={e => e.stopPropagation()}>
                            <div className="vsr-modal-header">
                                <h2>{editingRule ? 'Edit Shipping Rule' : 'Create Shipping Rule'}</h2>
                                <button className="vsr-modal-close" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <div className="vsr-modal-body">
                                {renderFormFields()}
                            </div>
                            <div className="vsr-modal-footer">
                                <button className="vsr-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="vsr-btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorShippingRules;
