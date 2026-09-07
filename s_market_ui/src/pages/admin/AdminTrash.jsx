import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Trash2, RotateCcw, Search, Filter, X, AlertTriangle, Clock, Package, Users, Store, Tag, Truck, FileText, HelpCircle, Image, Zap, Star, Ruler } from 'lucide-react';
import { getTrashItems, getTrashStats, restoreTrashItem, permanentDeleteTrashItem, emptyTrash } from '../../api/api';

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'products', label: 'Products' },
    { value: 'vendors', label: 'Vendors' },
    { value: 'customers', label: 'Customers' },
    { value: 'categories', label: 'Categories' },
    { value: 'brands', label: 'Brands' },
    { value: 'coupons', label: 'Coupons' },
    { value: 'shipping-zones', label: 'Shipping Zones' },
    { value: 'tax-rates', label: 'Tax Rates' },
    { value: 'delivery-partners', label: 'Delivery Partners' },
    { value: 'blog-posts', label: 'Blog Posts' },
    { value: 'faqs', label: 'FAQs' },
    { value: 'banners', label: 'Banners' },
    { value: 'flash-sales', label: 'Flash Sales' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'size-guides', label: 'Size Guides' },
];

const TYPE_ICONS = {
    products: Package,
    vendors: Store,
    customers: Users,
    categories: Tag,
    brands: Tag,
    coupons: Tag,
    'shipping-zones': Truck,
    'tax-rates': Tag,
    'delivery-partners': Truck,
    'blog-posts': FileText,
    faqs: HelpCircle,
    banners: Image,
    'flash-sales': Zap,
    testimonials: Star,
    'size-guides': Ruler,
};

const TYPE_COLORS = {
    products: { bg: '#dbeafe', color: '#2563eb' },
    vendors: { bg: '#dcfce7', color: '#16a34a' },
    customers: { bg: '#fce7f3', color: '#db2777' },
    categories: { bg: '#fef3c7', color: '#d97706' },
    brands: { bg: '#e0e7ff', color: '#4f46e5' },
    coupons: { bg: '#d1fae5', color: '#059669' },
    'shipping-zones': { bg: '#cffafe', color: '#0891b2' },
    'tax-rates': { bg: '#f3e8ff', color: '#9333ea' },
    'delivery-partners': { bg: '#e0f2fe', color: '#0284c7' },
    'blog-posts': { bg: '#fef9c3', color: '#ca8a04' },
    faqs: { bg: '#f1f5f9', color: '#475569' },
    banners: { bg: '#fce7f3', color: '#be185d' },
    'flash-sales': { bg: '#fff7ed', color: '#ea580c' },
    testimonials: { bg: '#f0fdf4', color: '#15803d' },
    'size-guides': { bg: '#faf5ff', color: '#7c3aed' },
};

function timeAgo(ts) {
    if (!ts) return 'Unknown';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

export default function AdminTrash() {
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [confirmEmpty, setConfirmEmpty] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsRes, statsRes] = await Promise.all([
                getTrashItems({ type: typeFilter, search, page, size: 20 }),
                getTrashStats()
            ]);
            setItems(itemsRes.content || []);
            setTotalPages(itemsRes.totalPages || 0);
            setTotalElements(itemsRes.totalElements || 0);
            setStats(statsRes || {});
        } catch (err) {
            toast.error('Failed to load trash');
        } finally {
            setLoading(false);
        }
    }, [typeFilter, search, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRestore = async (item) => {
        setActionLoading(item.id);
        try {
            await restoreTrashItem(item.type, item.id);
            toast.success(`${item.entityType} "${item.name}" restored`);
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to restore');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePermanentDelete = async (item) => {
        setActionLoading(item.id);
        try {
            await permanentDeleteTrashItem(item.type, item.id);
            toast.success(`${item.entityType} permanently deleted`);
            setConfirmDelete(null);
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to delete');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEmptyTrash = async () => {
        setActionLoading('empty');
        try {
            const res = await emptyTrash();
            toast.success(`Trash emptied. ${res.deletedCount} items permanently deleted.`);
            setConfirmEmpty(false);
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to empty trash');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Trash
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
                        {totalElements} item{totalElements !== 1 ? 's' : ''} in trash
                    </p>
                </div>
                <button
                    onClick={() => setConfirmEmpty(true)}
                    disabled={totalElements === 0}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                        background: totalElements === 0 ? '#f1f5f9' : '#fee2e2',
                        color: totalElements === 0 ? '#94a3b8' : '#dc2626',
                        fontSize: '0.82rem', fontWeight: 700, cursor: totalElements === 0 ? 'not-allowed' : 'pointer',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                >
                    <Trash2 size={14} /> Empty Trash
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {Object.entries(stats).filter(([k]) => k !== 'total').map(([key, val]) => {
                    if (!val) return null;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                    return (
                        <div key={key} style={{
                            background: '#fff', borderRadius: '10px', padding: '12px',
                            border: '1px solid #f1f5f9', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{val}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search trashed items..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        style={{
                            width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
                            border: '1px solid #e2e8f0', fontSize: '0.82rem', outline: 'none',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
                    style={{
                        padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        fontSize: '0.82rem', outline: 'none', background: '#fff',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                >
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                        <tr style={{ background: '#fafbfc' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deleted</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <Trash2 size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                                <div>Trash is empty</div>
                            </td></tr>
                        ) : items.map(item => {
                            const Icon = TYPE_ICONS[item.type] || Package;
                            const colors = TYPE_COLORS[item.type] || { bg: '#f1f5f9', color: '#475569' };
                            return (
                                <tr key={`${item.type}-${item.id}`} style={{ borderTop: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={14} color={colors.color} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {item.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                                            background: colors.bg, color: colors.color, fontSize: '0.7rem', fontWeight: 700,
                                        }}>
                                            {item.entityType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {timeAgo(item.deletedAt)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                                            background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: 600,
                                        }}>
                                            {item.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleRestore(item)}
                                                disabled={actionLoading === item.id}
                                                title="Restore"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    padding: '4px 10px', borderRadius: '6px', border: '1px solid #dcfce7',
                                                    background: '#f0fdf4', color: '#16a34a', fontSize: '0.72rem', fontWeight: 700,
                                                    cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                }}
                                            >
                                                <RotateCcw size={12} /> Restore
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(item)}
                                                disabled={actionLoading === item.id}
                                                title="Delete permanently"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca',
                                                    background: '#fef2f2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700,
                                                    cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                }}
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={{
                            padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                            background: page === 0 ? '#f1f5f9' : '#fff', color: page === 0 ? '#94a3b8' : '#475569',
                            fontSize: '0.78rem', fontWeight: 600, cursor: page === 0 ? 'not-allowed' : 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    >Previous</button>
                    <span style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#64748b' }}>
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        style={{
                            padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                            background: page >= totalPages - 1 ? '#f1f5f9' : '#fff',
                            color: page >= totalPages - 1 ? '#94a3b8' : '#475569',
                            fontSize: '0.78rem', fontWeight: 600,
                            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    >Next</button>
                </div>
            )}

            {/* Empty Trash Confirmation Modal */}
            {confirmEmpty && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setConfirmEmpty(false)}>
                    <div style={{
                        background: '#fff', borderRadius: '14px', padding: '28px', width: '100%',
                        maxWidth: '400px', textAlign: 'center',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        }}>
                            <AlertTriangle size={24} color="#dc2626" />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                            Empty Trash?
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 20px' }}>
                            This will permanently delete all {totalElements} items. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmEmpty(false)}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    background: '#fff', color: '#475569', fontSize: '0.82rem', fontWeight: 700,
                                    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleEmptyTrash}
                                disabled={actionLoading === 'empty'}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: '#dc2626', color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                                    cursor: actionLoading === 'empty' ? 'not-allowed' : 'pointer',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                            >{actionLoading === 'empty' ? 'Deleting...' : 'Empty Trash'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permanent Delete Confirmation Modal */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setConfirmDelete(null)}>
                    <div style={{
                        background: '#fff', borderRadius: '14px', padding: '28px', width: '100%',
                        maxWidth: '400px', textAlign: 'center',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        }}>
                            <AlertTriangle size={24} color="#dc2626" />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                            Delete Permanently?
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 20px' }}>
                            Are you sure you want to permanently delete "{confirmDelete.name}"? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    background: '#fff', color: '#475569', fontSize: '0.82rem', fontWeight: 700,
                                    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                            >Cancel</button>
                            <button
                                onClick={() => handlePermanentDelete(confirmDelete)}
                                disabled={actionLoading === confirmDelete.id}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: '#dc2626', color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                                    cursor: actionLoading === confirmDelete.id ? 'not-allowed' : 'pointer',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                            >{actionLoading === confirmDelete.id ? 'Deleting...' : 'Delete Permanently'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
