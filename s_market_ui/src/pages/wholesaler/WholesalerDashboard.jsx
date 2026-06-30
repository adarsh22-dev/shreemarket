import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, IndianRupee, Truck, PiggyBank, ArrowRight, Clock } from 'lucide-react';
import { getWholesalerDashboard } from '../../api/api';
import toast from 'react-hot-toast';

const WholesalerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getWholesalerDashboard();
                setStats(data);
            } catch (err) {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading dashboard...</div>;

    const cards = [
        { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: Package, color: '#d97706' },
        { label: 'Total Spent', value: `₹${(stats?.totalSpent ?? 0).toLocaleString()}`, icon: IndianRupee, color: '#059669' },
        { label: 'Pending Deliveries', value: stats?.pendingDeliveries ?? 0, icon: Truck, color: '#dc2626' },
        { label: 'Total Savings', value: `₹${(stats?.totalSavings ?? 0).toLocaleString()}`, icon: PiggyBank, color: '#2563eb' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Dashboard</h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Overview of your wholesale account</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {cards.map(card => (
                    <div key={card.label} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <card.icon size={24} color={card.color} />
                        <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.75rem', fontWeight: '700' }}>{card.value}</h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{card.label}</p>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>Recent Orders</h2>
                    <button onClick={() => navigate('/wholesaler/orders')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>View All <ArrowRight size={14} /></button>
                </div>
                {stats?.recentOrders?.length > 0 ? (
                    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        {stats.recentOrders.map((order, i) => (
                            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: i < stats.recentOrders.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                <div>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>#{order.orderNumber}</span>
                                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: '0.75rem' }}><Clock size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />{new Date(order.datePlaced).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: '600' }}>₹{order.totalAmount}</span>
                                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '500', background: order.status === 'DELIVERED' ? '#d1fae5' : order.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7', color: order.status === 'DELIVERED' ? '#065f46' : order.status === 'CANCELLED' ? '#991b1b' : '#92400e' }}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No orders yet. Start by browsing wholesale products.</div>
                )}
            </div>
        </div>
    );
};

export default WholesalerDashboard;
