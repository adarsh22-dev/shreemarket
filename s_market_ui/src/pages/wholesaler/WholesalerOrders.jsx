import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search, RotateCcw } from 'lucide-react';
import { getWholesalerOrders } from '../../api/api';
import toast from 'react-hot-toast';

const WholesalerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getWholesalerOrders();
                setOrders(data);
            } catch (err) {
                toast.error('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = orders.filter(o => {
        if (statusFilter && o.status !== statusFilter) return false;
        if (searchTerm && !o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading orders...</div>;

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>My Orders</h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>View your order history</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input placeholder="Search by order number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', background: '#fff', outline: 'none' }}>
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    <ShoppingCart size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No orders found</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f3f4f6', background: '#f9fafb' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Order #</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Items</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Total</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order, i) => (
                                <tr key={order.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', fontSize: '0.9rem' }}>#{order.orderNumber}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>{new Date(order.datePlaced).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{order.items?.length ?? 0} items</td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>₹{order.totalAmount}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '500', background: order.status === 'DELIVERED' ? '#d1fae5' : order.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7', color: order.status === 'DELIVERED' ? '#065f46' : order.status === 'CANCELLED' ? '#991b1b' : '#92400e' }}>{order.status}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}><RotateCcw size={14} /> Reorder</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WholesalerOrders;
