import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorAbandonedOrders, sendFollowUpAbandonedOrder, sendBulkFollowUpAbandonedOrders } from '../../api/api';
import { Clock, Send, RefreshCw, Search, Loader2, ShoppingBag, AlertTriangle, CheckCircle } from 'lucide-react';
import './VendorAbandonedOrders.css';

const VendorAbandonedOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(new Set());

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getVendorAbandonedOrders();
            setOrders(data.abandonedOrders || []);
        } catch (err) {
            console.error('Failed to fetch abandoned orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const sendFollowUp = async (orderId) => {
        setSending(prev => new Set(prev).add(orderId));
        try {
            await sendFollowUpAbandonedOrder(orderId);
        } catch (err) {
            console.error('Failed to send follow-up:', err);
        } finally {
            setSending(prev => { const n = new Set(prev); n.delete(orderId); return n; });
        }
    };

    const sendBulkFollowUp = async () => {
        const orderIds = filteredOrders.map(o => o.id);
        try {
            await sendBulkFollowUpAbandonedOrders(orderIds);
        } catch (err) {
            console.error('Failed to send bulk follow-up:', err);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <VendorLayout>
            <div className="vendor-abandoned-orders">
                <div className="vao-header">
                    <div className="vao-header-left">
                        <h1><Clock size={24} /> Abandoned Order Recovery</h1>
                        <p className="vao-subtitle">Follow up on pending orders that are stuck in processing</p>
                    </div>
                    <div className="vao-header-actions">
                        <button className="vao-refresh-btn" onClick={fetchOrders}><RefreshCw size={16} /> Refresh</button>
                        {filteredOrders.length > 0 && (
                            <button className="vao-bulk-btn" onClick={sendBulkFollowUp}><Send size={16} /> Send Bulk Follow-up</button>
                        )}
                    </div>
                </div>

                <div className="vao-stats-row">
                    <div className="vao-stat-card">
                        <ShoppingBag size={20} />
                        <div><span className="vao-stat-num">{orders.length}</span><span className="vao-stat-label">Abandoned Orders</span></div>
                    </div>
                </div>

                <div className="vao-search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search by order number or customer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>

                {loading ? (
                    <div className="vao-loading"><Loader2 className="animate-spin" size={24} /> Loading abandoned orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="vao-empty">
                        <CheckCircle size={48} />
                        <h3>No abandoned orders</h3>
                        <p>All pending orders are being processed on time</p>
                    </div>
                ) : (
                    <div className="vao-table-container">
                        <table className="vao-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Days Pending</th>
                                    <th>Location</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="vao-order-num">{order.orderNumber}</td>
                                        <td>{order.customerName}</td>
                                        <td>₹{order.totalAmount?.toFixed(2)}</td>
                                        <td><span className="vao-days-badge">{order.daysSinceOrder} days</span></td>
                                        <td>{order.deliveryLocation}</td>
                                        <td>
                                            <button className="vao-followup-btn" onClick={() => sendFollowUp(order.id)} disabled={sending.has(order.id)}>
                                                {sending.has(order.id) ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                                Follow Up
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorAbandonedOrders;
