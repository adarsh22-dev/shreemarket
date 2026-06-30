import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorFulfillments, createVendorFulfillment, fetchVendorOrders } from '../../api/api';
import { Package, Plus, RefreshCw, Loader2, Truck, Clock } from 'lucide-react';
import './VendorFulfillments.css';

const VendorFulfillments = () => {
    const [fulfillments, setFulfillments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ orderId: '', productQuantitiesJson: '{}', trackingNumber: '', carrierName: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const uid = user.userId;
            const [fulfillmentsData, ordRes] = await Promise.all([
                getVendorFulfillments(),
                fetchVendorOrders(uid)
            ]);
            setFulfillments(Array.isArray(fulfillmentsData) ? fulfillmentsData : []);
            setOrders(Array.isArray(ordRes) ? ordRes.filter(o => o.status === 'PROCESSING' || o.status === 'ACCEPTED') : []);
        } catch (err) {
            console.error('Failed to fetch fulfillments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createVendorFulfillment(formData);
            setShowModal(false);
            setFormData({ orderId: '', productQuantitiesJson: '{}', trackingNumber: '', carrierName: '' });
            fetchData();
        } catch (err) {
            console.error('Failed to create fulfillment:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <VendorLayout>
            <div className="vendor-fulfillments">
                <div className="vf-header">
                    <h1><Package size={24} /> Partial Fulfillment</h1>
                    <div className="vf-header-actions">
                        <button className="vf-refresh-btn" onClick={fetchData}><RefreshCw size={16} /> Refresh</button>
                        <button className="vf-create-btn" onClick={() => setShowModal(true)}><Plus size={16} /> New Shipment</button>
                    </div>
                </div>

                {loading ? (
                    <div className="vf-loading"><Loader2 className="animate-spin" size={24} /> Loading...</div>
                ) : fulfillments.length === 0 ? (
                    <div className="vf-empty"><Package size={48} /><h3>No partial shipments yet</h3><p>Create partial shipments for multi-item orders</p></div>
                ) : (
                    <div className="vf-table-container">
                        <table className="vf-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Status</th>
                                    <th>Tracking</th>
                                    <th>Carrier</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fulfillments.map(f => (
                                    <tr key={f.id}>
                                        <td>#{f.orderId}</td>
                                        <td><span className={`vf-status ${f.status?.toLowerCase()}`}>{f.status}</span></td>
                                        <td>{f.trackingNumber || '-'}</td>
                                        <td>{f.carrierName || '-'}</td>
                                        <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="vf-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="vf-modal" onClick={e => e.stopPropagation()}>
                            <h2><Truck size={20} /> Create Partial Shipment</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="vf-form-group">
                                    <label>Select Order</label>
                                    <select value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} required>
                                        <option value="">Choose an order...</option>
                                        {orders.map(o => (
                                            <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName} (₹{o.totalAmount?.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="vf-form-group">
                                    <label>Product Quantities (JSON)</label>
                                    <textarea value={formData.productQuantitiesJson} onChange={e => setFormData({...formData, productQuantitiesJson: e.target.value})}
                                        placeholder='{"1": 2, "3": 1}' rows={3} required />
                                </div>
                                <div className="vf-form-row">
                                    <div className="vf-form-group">
                                        <label>Tracking Number</label>
                                        <input type="text" value={formData.trackingNumber} onChange={e => setFormData({...formData, trackingNumber: e.target.value})} />
                                    </div>
                                    <div className="vf-form-group">
                                        <label>Carrier</label>
                                        <input type="text" value={formData.carrierName} onChange={e => setFormData({...formData, carrierName: e.target.value})} placeholder="Delhivery, Shiprocket..." />
                                    </div>
                                </div>
                                <div className="vf-modal-actions">
                                    <button type="button" className="vf-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="vf-submit-btn" disabled={submitting}>
                                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <Truck size={16} />}
                                        Create Shipment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorFulfillments;
