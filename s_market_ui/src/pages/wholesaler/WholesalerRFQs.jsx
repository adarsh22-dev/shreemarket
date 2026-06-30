import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Check, X, AlertTriangle, Clock, RefreshCw, Package, Search, Filter } from 'lucide-react';
import { getWholesalerRfqs, createWholesalerRfq } from '../../api/api';

const STATUS_COLORS = {
    PENDING: { bg: '#fef3c7', color: '#d97706' },
    ACCEPTED: { bg: '#dcfce7', color: '#16a34a' },
    REJECTED: { bg: '#fee2e2', color: '#dc2626' },
    COUNTERED: { bg: '#dbeafe', color: '#2563eb' },
};

const WholesalerRFQs = () => {
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState({ productId: '', quantity: '', requestedPrice: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [toasts, setToasts] = useState([]);

    const show = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, message: msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    }, []);

    const fetchRfqs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getWholesalerRfqs();
            setRfqs(Array.isArray(data) ? data : []);
        } catch {
            show('Failed to load RFQs', 'error');
        } finally {
            setLoading(false);
        }
    }, [show]);

    useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

    const handleSubmit = async () => {
        if (!form.productId || !form.quantity) {
            show('Product ID and quantity are required', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await createWholesalerRfq({
                productId: parseInt(form.productId),
                quantity: parseInt(form.quantity),
                requestedPrice: form.requestedPrice ? parseFloat(form.requestedPrice) : null,
                notes: form.notes,
            });
            show('RFQ submitted successfully');
            setShowNew(false);
            setForm({ productId: '', quantity: '', requestedPrice: '', notes: '' });
            fetchRfqs();
        } catch {
            show('Failed to submit RFQ', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatPrice = (v) => v != null ? `₹${Number(v).toFixed(2)}` : '—';
    const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const filtered = rfqs.filter(r => filter === 'ALL' || r.status === filter);

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12,
                    background: t.type === 'success' ? '#16a34a' : '#dc2626',
                    color: '#fff', fontSize: '0.83rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                }}>
                    {t.type === 'success' ? <Check size={15} /> : <X size={15} />}{t.message}
                </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Request for Quotes</h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>Send bulk purchase inquiries to vendors</p>
                </div>
                <button onClick={() => setShowNew(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <Send size={15} /> New RFQ
                </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                            background: filter === f ? '#d97706' : '#fff',
                            color: filter === f ? '#fff' : '#475569',
                            fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                        }}>{f}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: 10 }}>Loading RFQs...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    <MessageSquare size={48} color="#d1d5db" />
                    <h3 style={{ margin: '12px 0 4px', color: '#64748b' }}>No RFQs</h3>
                    <p style={{ fontSize: '0.85rem' }}>Send a quote request to a vendor to get started.</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8ecf0' }}>
                                {['Product', 'Vendor', 'Qty', 'Requested Price', 'Notes', 'Status', 'Response', 'Date'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.87rem' }}>{r.productName}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b' }}>Vendor #{r.vendorId}</td>
                                    <td style={{ padding: '12px 16px' }}>{r.quantity}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{formatPrice(r.requestedPrice)}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.notes || '—'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            padding: '3px 10px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700,
                                            ...STATUS_COLORS[r.status] || { bg: '#f1f5f9', color: '#64748b' },
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                                            {r.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                                        {r.status !== 'PENDING' ? (
                                            <div>
                                                {r.responseMessage && <div style={{ color: '#475569' }}>{r.responseMessage}</div>}
                                                {r.counterPrice && <div style={{ color: '#2563eb', fontWeight: 600, marginTop: 3 }}>Counter: {formatPrice(r.counterPrice)}</div>}
                                            </div>
                                        ) : <span style={{ color: '#94a3b8' }}>Awaiting response</span>}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{formatDate(r.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showNew && (
                <div onClick={() => setShowNew(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700 }}>New RFQ</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Product ID *</label>
                                <input value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
                                    placeholder="Enter product ID"
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Quantity *</label>
                                <input type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                                    placeholder="Minimum 1"
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Requested Price (₹) per unit</label>
                                <input type="number" step="0.01" min="0" value={form.requestedPrice} onChange={e => setForm(p => ({ ...p, requestedPrice: e.target.value }))}
                                    placeholder="Leave blank for vendor to set price"
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</label>
                                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Add any special requirements or negotiation notes..."
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowNew(false)}
                                style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e5e5e5', background: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: '#555' }}>Cancel</button>
                            <button onClick={handleSubmit} disabled={submitting}
                                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: submitting ? '#aaa' : '#d97706', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {submitting ? 'Submitting...' : <><Send size={13} /> Submit RFQ</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );
};

export default WholesalerRFQs;
