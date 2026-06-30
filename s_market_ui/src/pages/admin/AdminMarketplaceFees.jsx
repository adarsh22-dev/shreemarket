import React, { useState, useEffect, useCallback } from 'react';
import './AdminMarketplaceFees.css';
import { Icon, fmt } from './VendorShared';
import { API_BASE_URL } from '../../api/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Books', 'Grocery', 'Beauty', 'Furniture', 'Sports'];

const EMPTY_FORM = {
    name: '',
    feeType: 'FLAT',
    flatAmount: 15,
    percentage: 0,
    tierData: '[]',
    applicableCategories: 'All',
    maxCap: 50,
    minOrderAmount: 0,
    active: true,
    priority: 1,
    gstOnFee: true,
    description: '',
    estimatedRevenue: 0,
};

const API_BASE = API_BASE_URL;

async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export default function AdminMarketplaceFees() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [viewModal, setViewModal] = useState(null);
    const [calcModal, setCalcModal] = useState(false);
    const [calcInput, setCalcInput] = useState({ orderTotal: 1000, category: 'All' });
    const [calcResult, setCalcResult] = useState(null);

    const fetchFees = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiFetch(`${API_BASE}/admin/marketplace-fees`);
            setFees(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load marketplace fees');
            setFees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFees(); }, [fetchFees]);

    const filtered = filter === 'All' ? fees : fees.filter(f =>
        filter === 'Active' ? f.active : filter === 'Inactive' ? !f.active : f.feeType === filter
    );

    const activeCount = fees.filter(f => f.active).length;
    const totalRevenue = fees.reduce((s, f) => s + (f.estimatedRevenue || 0), 0);
    const avgFee = fees.length > 0
        ? fees.reduce((s, f) => s + (f.flatAmount || 0), 0) / fees.length
        : 0;

    const openNew = () => { setForm({ ...EMPTY_FORM }); setModal('new'); };
    const openEdit = (f) => {
        setForm({
            ...f,
            tierData: f.tierData || '[]',
            applicableCategories: f.applicableCategories || 'All',
        });
        setModal(f);
    };

    const save = async () => {
        try {
            setSaving(true);
            const payload = { ...form };
            if (modal === 'new') {
                const created = await apiFetch(`${API_BASE}/admin/marketplace-fees`, {
                    method: 'POST', body: JSON.stringify(payload),
                });
                toast.success('Fee rule created');
                setFees(prev => [...prev, created]);
            } else {
                const updated = await apiFetch(`${API_BASE}/admin/marketplace-fees/${modal.id}`, {
                    method: 'PUT', body: JSON.stringify(payload),
                });
                toast.success('Fee rule updated');
                setFees(prev => prev.map(f => f.id === modal.id ? updated : f));
            }
            setModal(null);
        } catch {
            toast.error('Failed to save fee rule');
        } finally {
            setSaving(false);
        }
    };

    const del = async (id) => {
        try {
            await apiFetch(`${API_BASE}/admin/marketplace-fees/${id}`, { method: 'DELETE' });
            toast.success('Fee rule deleted');
            setFees(prev => prev.filter(f => f.id !== id));
        } catch {
            toast.error('Failed to delete fee rule');
        }
    };

    const toggle = async (id) => {
        const fee = fees.find(f => f.id === id);
        if (!fee) return;
        try {
            const updated = await apiFetch(`${API_BASE}/admin/marketplace-fees/${id}`, {
                method: 'PUT', body: JSON.stringify({ ...fee, active: !fee.active }),
            });
            setFees(prev => prev.map(f => f.id === id ? updated : f));
            toast.success(`Fee rule ${updated.active ? 'activated' : 'deactivated'}`);
        } catch {
            toast.error('Failed to toggle fee rule');
        }
    };

    const calculateFee = async () => {
        try {
            const result = await apiFetch(`${API_BASE}/admin/marketplace-fees/calculate`, {
                method: 'POST', body: JSON.stringify(calcInput),
            });
            setCalcResult(result);
        } catch {
            toast.error('Failed to calculate fee');
        }
    };

    const getTierPreview = (tierData) => {
        if (!tierData || tierData === '[]') return null;
        try {
            const tiers = JSON.parse(tierData);
            if (!Array.isArray(tiers) || tiers.length === 0) return null;
            return tiers;
        } catch {
            return null;
        }
    };

    if (loading) {
        return (
            <div className="vm">
                <div className="vm-hdr">
                    <div>
                        <h2 className="vm-hdr__title">Marketplace Fee Configuration</h2>
                        <p className="vm-hdr__sub">Configure platform fees per order (flat or tiered)</p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Loading marketplace fees...
                </div>
            </div>
        );
    }

    return (
        <div className="vm">
            {/* Header */}
            <div className="vm-hdr">
                <div>
                    <h2 className="vm-hdr__title">Marketplace Fee Configuration</h2>
                    <p className="vm-hdr__sub">Configure platform fees per order (flat or tiered) on top of commission</p>
                </div>
                <div className="vm-hdr__actions">
                    <button className="vm-btn vm-btn--outline" onClick={() => setCalcModal(true)}>
                        <Icon name="Calculator" size={13} color="#475569" />Fee Calculator
                    </button>
                    <button className="vm-btn vm-btn--primary" onClick={openNew}>
                        <Icon name="Plus" size={13} color="#fff" />New Fee Rule
                    </button>
                </div>
            </div>

            {/* Info Alert */}
            <div className="mpf-alert">
                <Icon name="Info" size={15} color="#2563eb" />
                <span>Marketplace fees are charged per order in addition to commission. Fees can be flat (fixed ₹ per order) or tiered (different rates based on order value). GST on fees is applied at 18% where enabled.</span>
            </div>

            {/* KPIs */}
            <div className="vm-kpi-grid">
                {[
                    { label: 'Total Rules', value: fees.length, sub: `${activeCount} active`, icon: 'FileText', c: '#475569', bg: '#f1f5f9' },
                    { label: 'Active Fees', value: activeCount, sub: `${fees.length - activeCount} inactive`, icon: 'CheckCircle', c: '#16a34a', bg: '#dcfce7' },
                    { label: 'Total Fee Revenue', value: fmt(totalRevenue), sub: 'This month', icon: 'DollarSign', c: '#d97706', bg: '#fef3c7' },
                    { label: 'Avg Flat Fee', value: fmt(avgFee), sub: 'Across active rules', icon: 'TrendingUp', c: '#2563eb', bg: '#dbeafe' },
                ].map((k, i) => (
                    <div key={i} className="vm-kpi">
                        <div className="vm-kpi__top">
                            <div className="vm-kpi__icon" style={{ background: k.bg }}>
                                <Icon name={k.icon} size={18} color={k.c} sw={2.1} />
                            </div>
                        </div>
                        <div>
                            <div className="vm-kpi__value">{k.value}</div>
                            <div className="vm-kpi__label">{k.label}</div>
                            <div className="vm-kpi__sub">{k.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fee Rules Table */}
            <div className="vm-card">
                <div className="vm-sh">
                    <div>
                        <p className="vm-sh__title">Fee Rules</p>
                        <p className="vm-sh__sub">Platform fees applied per order, separate from commission</p>
                    </div>
                    <div className="vm-pills">
                        {['All', 'Active', 'Inactive', 'FLAT', 'TIERED'].map(c => (
                            <button key={c} className={`vm-pill${filter === c ? ' vm-pill--active' : ''}`}
                                onClick={() => setFilter(c)}>{c}</button>
                        ))}
                    </div>
                </div>

                <div className="vm-tw">
                    <table className="vm-tbl">
                        <thead>
                            <tr>
                                <th>Priority</th>
                                <th>Fee Name</th>
                                <th>Type</th>
                                <th>Flat Fee</th>
                                <th>Percentage</th>
                                <th>Min Order</th>
                                <th>Max Cap</th>
                                <th>Categories</th>
                                <th>GST</th>
                                <th>Revenue</th>
                                <th>Status</th>
                                <th className="vm-th-r">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.sort((a, b) => (a.priority || 99) - (b.priority || 99)).map(f => (
                                <tr key={f.id} style={{ opacity: f.active ? 1 : 0.55 }}>
                                    <td>
                                        <div className="mpf-pri">{f.priority || '—'}</div>
                                    </td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '.83rem' }}>{f.name}</div>
                                            <div style={{ fontSize: '.68rem', color: '#94a3b8' }}>{f.id} · {f.description ? f.description.substring(0, 50) + '...' : 'No description'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`mpf-type-badge mpf-type-badge--${(f.feeType || '').toLowerCase()}`}>
                                            {f.feeType === 'TIERED' ? '📊 Tiered' : '💰 Flat'}
                                        </span>
                                    </td>
                                    <td className="vm-bo">{fmt(f.flatAmount)}</td>
                                    <td className="vm-bo">{f.percentage ? `${f.percentage}%` : '—'}</td>
                                    <td className="vm-mu">{fmt(f.minOrderAmount)}</td>
                                    <td className="vm-mu">{f.maxCap ? fmt(f.maxCap) : '—'}</td>
                                    <td>
                                        <span className="mpf-cat-badge">{f.applicableCategories || 'All'}</span>
                                    </td>
                                    <td>
                                        <span className={`mpf-bool ${f.gstOnFee ? 'mpf-bool--yes' : 'mpf-bool--no'}`}>
                                            {f.gstOnFee ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, fontSize: '.82rem', color: (f.estimatedRevenue || 0) > 0 ? '#0f172a' : '#94a3b8' }}>
                                            {(f.estimatedRevenue || 0) > 0 ? fmt(f.estimatedRevenue) : '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <button className={`cr-toggle ${f.active ? 'cr-toggle--on' : 'cr-toggle--off'}`} onClick={() => toggle(f.id)}>
                                            <span className="cr-toggle__knob" />
                                        </button>
                                    </td>
                                    <td className="vm-td-r">
                                        <div className="vm-acts">
                                            <button className="vm-ib vm-ib--view" onClick={() => setViewModal(f)} title="View Details">
                                                <Icon name="Eye" size={13} />
                                            </button>
                                            <button className="vm-ib vm-ib--edit" onClick={() => openEdit(f)} title="Edit">
                                                <Icon name="Edit2" size={13} />
                                            </button>
                                            <button className="vm-ib vm-ib--del" onClick={() => del(f.id)} title="Delete">
                                                <Icon name="Trash2" size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="12" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                        No fee rules found. Create your first fee rule.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tier Preview Cards */}
            {fees.filter(f => f.feeType === 'TIERED' && getTierPreview(f.tierData)).length > 0 && (
                <div className="vm-card">
                    <p className="vm-sh__title" style={{ marginBottom: 4 }}>Tiered Fee Breakdown</p>
                    <p className="vm-sh__sub" style={{ marginBottom: 16 }}>Order value ranges and corresponding fees</p>
                    <div className="mpf-tier-grid">
                        {fees.filter(f => f.feeType === 'TIERED').map(f => {
                            const tiers = getTierPreview(f.tierData);
                            if (!tiers) return null;
                            return (
                                <div key={f.id} className="mpf-tier-card">
                                    <div className="mpf-tier-card__header">
                                        <span className="mpf-tier-card__name">{f.name}</span>
                                        <span className="mpf-tier-card__type">Tiered</span>
                                    </div>
                                    <div className="mpf-tier-card__list">
                                        {tiers.map((tier, idx) => (
                                            <div key={idx} className="mpf-tier-card__row">
                                                <span className="mpf-tier-card__range">
                                                    {fmt(tier.minOrder || 0)} – {tier.maxOrder ? fmt(tier.maxOrder) : '∞'}
                                                </span>
                                                <span className="mpf-tier-card__fee">
                                                    {tier.flatAmount ? `₹${tier.flatAmount}` : ''}
                                                    {tier.percentage ? ` + ${tier.percentage}%` : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Revenue by Fee Rule */}
            <div className="vm-card">
                <p className="vm-sh__title" style={{ marginBottom: 4 }}>Revenue by Fee Rule</p>
                <p className="vm-sh__sub" style={{ marginBottom: 16 }}>Current month earnings per rule</p>
                <div className="vm-stat-list">
                    {fees.filter(f => (f.estimatedRevenue || 0) > 0)
                        .sort((a, b) => (b.estimatedRevenue || 0) - (a.estimatedRevenue || 0))
                        .map((f, i) => (
                            <div key={i}>
                                <div className="vm-sbar__head">
                                    <span className="vm-sbar__lbl">{f.name}</span>
                                    <span className="vm-sbar__val">{fmt(f.estimatedRevenue)}</span>
                                </div>
                                <div className="vm-sbar__track">
                                    <div className="vm-sbar__fill" style={{
                                        width: `${Math.round(((f.estimatedRevenue || 0) / Math.max(totalRevenue, 1)) * 100)}%`,
                                        background: '#E03E1A'
                                    }} />
                                </div>
                            </div>
                        ))}
                    {fees.filter(f => (f.estimatedRevenue || 0) > 0).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '.85rem' }}>
                            No revenue data yet
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {modal && (
                <div className="vm-overlay" onClick={() => { if (!saving) setModal(null); }}>
                    <div className="vm-modal mpf-modal" onClick={e => e.stopPropagation()}>
                        <div className="vm-modal__hdr">
                            <div>
                                <p className="vm-modal__title">{modal === 'new' ? 'New Fee Rule' : 'Edit Fee Rule'}</p>
                                <p className="vm-modal__sub">{modal === 'new' ? 'Create a new marketplace fee rule' : `Editing: ${form.name}`}</p>
                            </div>
                            <button className="vm-ib vm-ib--view" onClick={() => { if (!saving) setModal(null); }}>
                                <Icon name="X" size={14} />
                            </button>
                        </div>
                        <div className="mpf-form">
                            <div className="mpf-form-row">
                                <label className="mpf-label">Fee Name</label>
                                <input className="mpf-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Standard Platform Fee" />
                            </div>

                            <div className="mpf-form-2col">
                                <div>
                                    <label className="mpf-label">Fee Type</label>
                                    <select className="mpf-select" value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))}>
                                        <option value="FLAT">Flat Fee (Fixed ₹ per order)</option>
                                        <option value="TIERED">Tiered (Value-based ranges)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mpf-label">Category</label>
                                    <select className="mpf-select" value={form.applicableCategories} onChange={e => setForm(f => ({ ...f, applicableCategories: e.target.value }))}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {form.feeType === 'FLAT' ? (
                                <div className="mpf-form-2col">
                                    <div>
                                        <label className="mpf-label">Flat Amount (₹)</label>
                                        <input className="mpf-input" type="number" min="0" step="0.5"
                                            value={form.flatAmount} onChange={e => setForm(f => ({ ...f, flatAmount: +e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="mpf-label">Percentage (%)</label>
                                        <input className="mpf-input" type="number" min="0" step="0.1"
                                            value={form.percentage} onChange={e => setForm(f => ({ ...f, percentage: +e.target.value }))} />
                                    </div>
                                </div>
                            ) : (
                                <div className="mpf-form-row">
                                    <label className="mpf-label">Tier Data (JSON)</label>
                                    <textarea className="mpf-textarea" rows={4} value={form.tierData}
                                        onChange={e => setForm(f => ({ ...f, tierData: e.target.value }))}
                                        placeholder='[{"minOrder":0,"maxOrder":500,"flatAmount":5,"percentage":0},{"minOrder":500,"maxOrder":null,"flatAmount":10,"percentage":0.5}]' />
                                    <span className="mpf-hint">JSON array of tier objects with minOrder, maxOrder, flatAmount, percentage</span>
                                </div>
                            )}

                            <div className="mpf-form-2col">
                                <div>
                                    <label className="mpf-label">Min Order Amount (₹)</label>
                                    <input className="mpf-input" type="number" min="0" step="1"
                                        value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: +e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mpf-label">Max Fee Cap (₹)</label>
                                    <input className="mpf-input" type="number" min="0" step="1"
                                        value={form.maxCap || ''} onChange={e => setForm(f => ({ ...f, maxCap: e.target.value ? +e.target.value : null }))} />
                                </div>
                            </div>

                            <div className="mpf-form-2col">
                                <div>
                                    <label className="mpf-label">Priority (lower = applies first)</label>
                                    <input className="mpf-input" type="number" min="1" step="1"
                                        value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mpf-label">Description</label>
                                    <input className="mpf-input" value={form.description || ''}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Brief description" />
                                </div>
                            </div>

                            <div className="mpf-form-row mpf-checkrow">
                                <label className="mpf-label">Apply GST on Fee (18%)</label>
                                <button className={`cr-toggle ${form.gstOnFee ? 'cr-toggle--on' : 'cr-toggle--off'}`}
                                    onClick={() => setForm(f => ({ ...f, gstOnFee: !f.gstOnFee }))}>
                                    <span className="cr-toggle__knob" />
                                </button>
                            </div>

                            <div className="mpf-form-row mpf-checkrow">
                                <label className="mpf-label">Fee Active</label>
                                <button className={`cr-toggle ${form.active ? 'cr-toggle--on' : 'cr-toggle--off'}`}
                                    onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
                                    <span className="cr-toggle__knob" />
                                </button>
                            </div>

                            <div className="vm-modal__acts">
                                <button className="vm-btn vm-btn--outline" style={{ flex: 1 }} onClick={() => { if (!saving) setModal(null); }} disabled={saving}>
                                    Cancel
                                </button>
                                <button className="vm-btn vm-btn--primary" style={{ flex: 1 }} onClick={save} disabled={saving || !form.name}>
                                    <Icon name={modal === 'new' ? 'Plus' : 'Check'} size={13} color="#fff" />
                                    {saving ? 'Saving...' : (modal === 'new' ? 'Create Fee Rule' : 'Save Changes')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewModal && (
                <div className="vm-overlay" onClick={() => setViewModal(null)}>
                    <div className="vm-modal mpf-view-modal" onClick={e => e.stopPropagation()}>
                        <div className="vm-modal__hdr">
                            <div>
                                <p className="vm-modal__title">{viewModal.name}</p>
                                <p className="vm-modal__sub">Fee Rule Details</p>
                            </div>
                            <button className="vm-ib vm-ib--view" onClick={() => setViewModal(null)}>
                                <Icon name="X" size={14} />
                            </button>
                        </div>
                        <div className="mpf-view-body">
                            <div className="mpf-view-grid">
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Fee Type</span>
                                    <span className="mpf-view-value">
                                        <span className={`mpf-type-badge mpf-type-badge--${(viewModal.feeType || '').toLowerCase()}`}>
                                            {viewModal.feeType === 'TIERED' ? '📊 Tiered' : '💰 Flat'}
                                        </span>
                                    </span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Flat Amount</span>
                                    <span className="mpf-view-value">{fmt(viewModal.flatAmount)}</span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Percentage</span>
                                    <span className="mpf-view-value">{viewModal.percentage ? `${viewModal.percentage}%` : '—'}</span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Categories</span>
                                    <span className="mpf-view-value">{viewModal.applicableCategories || 'All'}</span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Min Order</span>
                                    <span className="mpf-view-value">{fmt(viewModal.minOrderAmount)}</span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Max Cap</span>
                                    <span className="mpf-view-value">{viewModal.maxCap ? fmt(viewModal.maxCap) : 'No cap'}</span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Priority</span>
                                    <span className="mpf-view-value">{viewModal.priority || '—'}</span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">GST on Fee</span>
                                    <span className="mpf-view-value">{viewModal.gstOnFee ? 'Yes (18%)' : 'No'}</span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Status</span>
                                    <span className="mpf-view-value">
                                        <span className={`mpf-status ${viewModal.active ? 'mpf-status--active' : 'mpf-status--inactive'}`}>
                                            {viewModal.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </span>
                                </div>
                                <div className="mpf-view-item">
                                    <span className="mpf-view-label">Revenue</span>
                                    <span className="mpf-view-value">{fmt(viewModal.estimatedRevenue || 0)}</span>
                                </div>
                            </div>
                            {viewModal.description && (
                                <div className="mpf-view-desc">
                                    <span className="mpf-view-label">Description</span>
                                    <p>{viewModal.description}</p>
                                </div>
                            )}
                            {viewModal.feeType === 'TIERED' && getTierPreview(viewModal.tierData) && (
                                <div className="mpf-view-tiers">
                                    <span className="mpf-view-label">Tier Breakdown</span>
                                    <div className="mpf-tier-card" style={{ marginTop: 8 }}>
                                        <div className="mpf-tier-card__list">
                                            {getTierPreview(viewModal.tierData).map((tier, idx) => (
                                                <div key={idx} className="mpf-tier-card__row">
                                                    <span className="mpf-tier-card__range">
                                                        ₹{tier.minOrder || 0} – {tier.maxOrder ? `₹${tier.maxOrder}` : '∞'}
                                                    </span>
                                                    <span className="mpf-tier-card__fee">
                                                        {tier.flatAmount ? `₹${tier.flatAmount}` : ''}
                                                        {tier.percentage ? ` + ${tier.percentage}%` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Fee Calculator Modal */}
            {calcModal && (
                <div className="vm-overlay" onClick={() => { setCalcModal(false); setCalcResult(null); }}>
                    <div className="vm-modal mpf-calc-modal" onClick={e => e.stopPropagation()}>
                        <div className="vm-modal__hdr">
                            <div>
                                <p className="vm-modal__title">Fee Calculator</p>
                                <p className="vm-modal__sub">Test fee calculation for an order</p>
                            </div>
                            <button className="vm-ib vm-ib--view" onClick={() => { setCalcModal(false); setCalcResult(null); }}>
                                <Icon name="X" size={14} />
                            </button>
                        </div>
                        <div className="mpf-calc-body">
                            <div className="mpf-form-2col">
                                <div>
                                    <label className="mpf-label">Order Total (₹)</label>
                                    <input className="mpf-input" type="number" min="0" step="1"
                                        value={calcInput.orderTotal}
                                        onChange={e => setCalcInput(prev => ({ ...prev, orderTotal: +e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mpf-label">Category</label>
                                    <select className="mpf-select" value={calcInput.category}
                                        onChange={e => setCalcInput(prev => ({ ...prev, category: e.target.value }))}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button className="vm-btn vm-btn--primary" onClick={calculateFee} style={{ marginTop: 12, width: '100%' }}>
                                <Icon name="Calculator" size={13} color="#fff" />Calculate Fee
                            </button>
                            {calcResult && (
                                <div className="mpf-calc-result">
                                    <div className="mpf-calc-result__row">
                                        <span>Platform Fee</span>
                                        <span className="mpf-calc-result__val">{fmt(calcResult.totalFee)}</span>
                                    </div>
                                    <div className="mpf-calc-result__row">
                                        <span>GST on Fee (18%)</span>
                                        <span className="mpf-calc-result__val">{fmt(calcResult.gstAmount)}</span>
                                    </div>
                                    <div className="mpf-calc-result__divider" />
                                    <div className="mpf-calc-result__row mpf-calc-result__row--total">
                                        <span>Total Fee (incl. GST)</span>
                                        <span className="mpf-calc-result__val">{fmt(calcResult.totalWithGst)}</span>
                                    </div>
                                    {calcResult.appliedRuleName && (
                                        <div className="mpf-calc-result__row" style={{ marginTop: 8 }}>
                                            <span style={{ color: '#94a3b8', fontSize: '.78rem' }}>Applied Rule</span>
                                            <span style={{ color: '#94a3b8', fontSize: '.78rem' }}>{calcResult.appliedRuleName}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
