import React, { useState, useEffect } from 'react';
import {
    Tag, Plus, Search, Edit2, Trash2, Copy, Check, Percent,
    DollarSign, Calendar, X, Filter, ToggleLeft, ToggleRight,
    TrendingUp, Users, ShoppingCart, AlertTriangle
} from 'lucide-react';
import { getVendorCoupons, createVendorCoupon, updateVendorCoupon, deleteVendorCoupon, getCategories } from '../../api/api';
import VendorLayout from '../../components/vendor/VendorLayout';
import toast from 'react-hot-toast';
import './VendorCoupons.css';

const EMPTY_COUPON = {
    code: '', type: 'percentage', value: 10, minOrder: 0,
    maxDisc: '', maxUses: '', expiry: '', categories: 'All',
    status: 'active'
};

const FALLBACK_CAT_OPTS = ['All', 'Electronics', 'Fashion', 'Grocery', 'Beauty', 'Books', 'Sports', 'Furniture'];

const STATUS_COLORS = {
    active:    { bg: '#dcfce7', color: '#16a34a' },
    expired:   { bg: '#f1f5f9', color: '#94a3b8' },
    scheduled: { bg: '#dbeafe', color: '#2563eb' },
    draft:     { bg: '#f1f5f9', color: '#64748b' },
};

export default function VendorCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_COUPON);
    const [deleting, setDeleting] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);
    const [copied, setCopied] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState(FALLBACK_CAT_OPTS);

    useEffect(() => {
        loadCoupons();
        getCategories().then(data => {
            if (Array.isArray(data) && data.length) {
                const names = data.map(c => c.name || c.categoryName || c).filter(Boolean);
                setCategoryOptions(['All', ...names]);
            }
        }).catch(() => {});
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const data = await getVendorCoupons();
            setCoupons(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 1800);
    };

    const openNew = () => {
        setForm({ ...EMPTY_COUPON, code: `PROMO${Math.floor(Math.random() * 900 + 100)}` });
        setModal('new');
    };

    const openEdit = (c) => {
        setForm({ ...c });
        setModal(c);
    };

    const saveCoupon = async () => {
        try {
            const payload = { ...form };
            if (payload.maxDisc === '' || payload.maxDisc === null) delete payload.maxDisc;
            if (payload.maxUses === '' || payload.maxUses === null) delete payload.maxUses;

            if (modal === 'new') {
                await createVendorCoupon(payload);
            } else {
                await updateVendorCoupon(modal.id, payload);
            }
            await loadCoupons();
            toast.success(modal === 'new' ? 'Coupon created!' : 'Coupon updated!');
            setModal(null);
        } catch (err) {
            toast.error(err?.message || 'Failed to save coupon');
        }
    };

    const confirmDelete = (id) => setDeleting(id);

    const executeDelete = async () => {
        setDeletingLoading(true);
        try {
            await deleteVendorCoupon(deleting);
            await loadCoupons();
            toast.success('Coupon deleted');
        } catch (err) {
            toast.error(err?.message || 'Failed to delete');
        } finally {
            setDeleting(null);
            setDeletingLoading(false);
        }
    };

    const toggleStatus = async (c) => {
        const newStatus = c.status === 'active' ? 'expired' : 'active';
        try {
            await updateVendorCoupon(c.id, { ...c, status: newStatus });
            setCoupons(cs => cs.map(c2 => c2.id === c.id ? { ...c2, status: newStatus } : c2));
        } catch {
            toast.error('Failed to update status');
        }
    };

    const filteredCoupons = coupons.filter(c => {
        const matchSearch = c.code?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalRedemptions = coupons.reduce((s, c) => s + (c.uses || 0), 0);
    const totalRevenue = coupons.reduce((s, c) => s + (c.revenue || 0), 0);
    const activeCount = coupons.filter(c => c.status === 'active').length;

    const fmt = n => n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
    const fmtN = n => n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : n;

    return (
        <VendorLayout>
            <div className="vc">
                {/* Header */}
                <div className="vc-hdr">
                    <div>
                        <h2 className="vc-hdr__title">Promotions & Coupons</h2>
                        <p className="vc-hdr__sub">Create and manage discount coupons to boost your sales</p>
                    </div>
                    <button className="vm-btn vm-btn--primary" onClick={openNew}>
                        <Plus size={14} color="#fff" /> New Coupon
                    </button>
                </div>

                {/* KPIs */}
                <div className="vc-kpis">
                    <div className="vc-kpi">
                        <div className="vc-kpi__icon" style={{ background: '#fff0ed' }}>
                            <Tag size={18} color="#E03E1A" />
                        </div>
                        <div>
                            <div className="vc-kpi__val">{activeCount}</div>
                            <div className="vc-kpi__lbl">Active Coupons</div>
                        </div>
                    </div>
                    <div className="vc-kpi">
                        <div className="vc-kpi__icon" style={{ background: '#f0fdf4' }}>
                            <Users size={18} color="#16a34a" />
                        </div>
                        <div>
                            <div className="vc-kpi__val">{fmtN(totalRedemptions)}</div>
                            <div className="vc-kpi__lbl">Total Redemptions</div>
                        </div>
                    </div>
                    <div className="vc-kpi">
                        <div className="vc-kpi__icon" style={{ background: '#eff6ff' }}>
                            <TrendingUp size={18} color="#2563eb" />
                        </div>
                        <div>
                            <div className="vc-kpi__val">{fmt(totalRevenue)}</div>
                            <div className="vc-kpi__lbl">Revenue Driven</div>
                        </div>
                    </div>
                    <div className="vc-kpi">
                        <div className="vc-kpi__icon" style={{ background: '#fef9ec' }}>
                            <ShoppingCart size={18} color="#d97706" />
                        </div>
                        <div>
                            <div className="vc-kpi__val">{coupons.length}</div>
                            <div className="vc-kpi__lbl">Total Coupons</div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="vc-card">
                    <div className="vc-toolbar">
                        <div className="vc-search">
                            <Search size={14} color="#94a3b8" />
                            <input
                                className="vc-search__inp"
                                placeholder="Search coupon code..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="vc-pills">
                            {['all', 'active', 'expired', 'draft'].map(s => (
                                <button
                                    key={s}
                                    className={`vc-pill ${statusFilter === s ? 'vc-pill--active' : ''}`}
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="vc-loading">Loading coupons...</div>
                    ) : filteredCoupons.length === 0 ? (
                        <div className="vc-empty">
                            <Tag size={40} color="#cbd5e1" />
                            <h3>No coupons yet</h3>
                            <p>Create your first coupon to start driving sales</p>
                            <button className="vm-btn vm-btn--primary" onClick={openNew}>
                                <Plus size={14} color="#fff" /> Create Coupon
                            </button>
                        </div>
                    ) : (
                        <div className="vc-tw">
                            <table className="vc-tbl">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Type</th>
                                        <th>Discount</th>
                                        <th>Min Order</th>
                                        <th>Usage</th>
                                        <th>Expiry</th>
                                        <th>Revenue</th>
                                        <th>Status</th>
                                        <th className="vc-th-r">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCoupons.map(c => {
                                        const st = STATUS_COLORS[c.status] || STATUS_COLORS.draft;
                                        const usePct = c.maxUses ? Math.min(100, ((c.uses || 0) / c.maxUses) * 100) : 0;
                                        return (
                                            <tr key={c.id}>
                                                <td>
                                                    <div className="vc-code-cell">
                                                        <span className="vc-code">{c.code}</span>
                                                        <button className="vc-copy" onClick={() => copyCode(c.code)}>
                                                            {copied === c.code
                                                                ? <Check size={11} color="#16a34a" />
                                                                : <Copy size={11} color="#94a3b8" />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`vc-type vc-type--${c.type}`}>
                                                        {c.type === 'percentage'
                                                            ? <Percent size={10} />
                                                            : <DollarSign size={10} />}
                                                        {c.type}
                                                    </span>
                                                </td>
                                                <td className="vc-bold">
                                                    {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                                                    {c.maxDisc && <span className="vc-sub"> max ₹{c.maxDisc}</span>}
                                                </td>
                                                <td>₹{c.minOrder}</td>
                                                <td>
                                                    <div className="vc-usage">
                                                        <span className="vc-usage__txt">
                                                            {(c.uses || 0).toLocaleString()}
                                                            {c.maxUses ? ` / ${c.maxUses.toLocaleString()}` : ''}
                                                        </span>
                                                        {c.maxUses && (
                                                            <div className="vc-usage__bar">
                                                                <div
                                                                    className="vc-usage__fill"
                                                                    style={{
                                                                        width: `${usePct}%`,
                                                                        background: usePct > 85 ? '#E03E1A' : '#E03E1A88'
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {c.expiry && (
                                                        <div className="vc-expiry">
                                                            <Calendar size={11} color="#94a3b8" />
                                                            {new Date(c.expiry).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short', year: 'numeric'
                                                            })}
                                                        </div>
                                                    )}
                                                    {!c.expiry && <span className="vc-sub">No expiry</span>}
                                                </td>
                                                <td className="vc-bold">{c.revenue ? fmt(c.revenue) : '₹0'}</td>
                                                <td>
                                                    <span className="vc-badge" style={st}>{c.status}</span>
                                                </td>
                                                <td>
                                                    <div className="vc-acts">
                                                        <button
                                                            className="vc-act-toggle"
                                                            onClick={() => toggleStatus(c)}
                                                            title={c.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {c.status === 'active'
                                                                ? <ToggleRight size={16} color="#16a34a" />
                                                                : <ToggleLeft size={16} color="#94a3b8" />}
                                                        </button>
                                                        <button className="vm-ib vm-ib--edit" onClick={() => openEdit(c)}>
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button className="vm-ib vm-ib--del" onClick={() => confirmDelete(c.id)}>
                                                            <Trash2 size={12} />
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
                </div>

                {/* Coupon Modal */}
                {modal && (
                    <div className="vc-overlay" onClick={() => setModal(null)}>
                        <div className="vc-modal" onClick={e => e.stopPropagation()}>
                            <div className="vc-modal__hdr">
                                <h3>{modal === 'new' ? 'Create Coupon' : 'Edit Coupon'}</h3>
                                <button className="vc-modal__close" onClick={() => setModal(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="vc-modal__body">
                                <div className="vc-frow">
                                    <label>Coupon Code</label>
                                    <input
                                        className="vc-inp"
                                        value={form.code}
                                        onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. SAVE20"
                                    />
                                </div>
                                <div className="vc-fgrid">
                                    <div className="vc-frow">
                                        <label>Discount Type</label>
                                        <select
                                            className="vc-inp"
                                            value={form.type}
                                            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat (₹)</option>
                                        </select>
                                    </div>
                                    <div className="vc-frow">
                                        <label>Value</label>
                                        <input
                                            className="vc-inp"
                                            type="number"
                                            value={form.value}
                                            onChange={e => setForm(f => ({ ...f, value: +e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="vc-fgrid">
                                    <div className="vc-frow">
                                        <label>Min Order (₹)</label>
                                        <input
                                            className="vc-inp"
                                            type="number"
                                            value={form.minOrder}
                                            onChange={e => setForm(f => ({ ...f, minOrder: +e.target.value }))}
                                        />
                                    </div>
                                    <div className="vc-frow">
                                        <label>Max Discount (₹)</label>
                                        <input
                                            className="vc-inp"
                                            type="number"
                                            value={form.maxDisc}
                                            onChange={e => setForm(f => ({ ...f, maxDisc: e.target.value }))}
                                            placeholder="No limit"
                                        />
                                    </div>
                                </div>
                                <div className="vc-fgrid">
                                    <div className="vc-frow">
                                        <label>Max Uses</label>
                                        <input
                                            className="vc-inp"
                                            type="number"
                                            value={form.maxUses}
                                            onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                    <div className="vc-frow">
                                        <label>Expiry Date</label>
                                        <input
                                            className="vc-inp"
                                            type="date"
                                            value={form.expiry}
                                            onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="vc-frow">
                                    <label>Applicable Category</label>
                                    <select
                                        className="vc-inp"
                                        value={form.categories || 'All'}
                                        onChange={e => setForm(f => ({ ...f, categories: e.target.value }))}
                                    >
                                        {categoryOptions.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="vc-modal__ftr">
                                <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)}>
                                    Cancel
                                </button>
                                <button className="vm-btn vm-btn--primary" onClick={saveCoupon}>
                                    <Check size={13} color="#fff" />
                                    {modal === 'new' ? 'Create Coupon' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deleting && (
                    <div className="vc-overlay" onClick={() => !deletingLoading && setDeleting(null)}>
                        <div className="vc-modal vc-modal--sm" onClick={e => e.stopPropagation()}>
                            <div className="vc-modal__body" style={{ textAlign: 'center' }}>
                                <Trash2 size={32} color="#dc2626" style={{ marginBottom: 8 }} />
                                <h3>Delete Coupon</h3>
                                <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', margin: '8px 0 20px' }}>
                                    Are you sure you want to delete this coupon? This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                    <button className="vm-btn vm-btn--outline" onClick={() => setDeleting(null)} disabled={deletingLoading}>
                                        Cancel
                                    </button>
                                    <button className="vm-btn vm-btn--danger" onClick={executeDelete} disabled={deletingLoading}>
                                        {deletingLoading ? 'Deleting...' : <><Trash2 size={13} color="#fff" /> Delete</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
}
