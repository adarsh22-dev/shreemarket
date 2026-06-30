import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorProductSchedules, createVendorProductSchedule, deleteVendorProductSchedule } from '../../api/api';
import { Calendar, Clock, Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import './VendorProductSchedules.css';

const VendorProductSchedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ productId: '', publishAt: '', unpublishAt: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const data = await getVendorProductSchedules();
            setSchedules(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch schedules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSchedules(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                productId: parseInt(formData.productId),
                publishAt: formData.publishAt ? new Date(formData.publishAt).getTime() : null,
                unpublishAt: formData.unpublishAt ? new Date(formData.unpublishAt).getTime() : null
            };
            await createVendorProductSchedule(payload);
            setShowModal(false);
            setFormData({ productId: '', publishAt: '', unpublishAt: '' });
            fetchSchedules();
        } catch (err) {
            console.error('Failed to create schedule:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteVendorProductSchedule(id);
            fetchSchedules();
        } catch (err) {
            console.error('Failed to delete schedule:', err);
        }
    };

    const formatDate = (ts) => ts ? new Date(ts).toLocaleString() : '-';

    return (
        <VendorLayout>
            <div className="vendor-schedules">
                <div className="vsched-header">
                    <h1><Calendar size={24} /> Product Scheduling</h1>
                    <div className="vsched-header-actions">
                        <button className="vsched-refresh-btn" onClick={fetchSchedules}><RefreshCw size={16} /> Refresh</button>
                        <button className="vsched-create-btn" onClick={() => setShowModal(true)}><Plus size={16} /> New Schedule</button>
                    </div>
                </div>

                {loading ? (
                    <div className="vsched-loading"><Loader2 className="animate-spin" size={24} /> Loading...</div>
                ) : schedules.length === 0 ? (
                    <div className="vsched-empty"><Calendar size={48} /><h3>No schedules yet</h3><p>Schedule products to auto-publish or unpublish</p></div>
                ) : (
                    <div className="vsched-table-container">
                        <table className="vsched-table">
                            <thead>
                                <tr>
                                    <th>Product ID</th>
                                    <th>Publish At</th>
                                    <th>Unpublish At</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map(s => (
                                    <tr key={s.id}>
                                        <td>#{s.productId}</td>
                                        <td><Clock size={14} /> {formatDate(s.publishAt)}</td>
                                        <td><Clock size={14} /> {formatDate(s.unpublishAt)}</td>
                                        <td><span className={`vsched-status ${s.published ? 'published' : 'pending'}`}>{s.published ? 'Published' : 'Pending'}</span></td>
                                        <td><button className="vsched-delete-btn" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="vsched-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="vsched-modal" onClick={e => e.stopPropagation()}>
                            <h2><Calendar size={20} /> Create Schedule</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="vsched-form-group">
                                    <label>Product ID</label>
                                    <input type="number" value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} required />
                                </div>
                                <div className="vsched-form-group">
                                    <label>Publish At</label>
                                    <input type="datetime-local" value={formData.publishAt} onChange={e => setFormData({...formData, publishAt: e.target.value})} />
                                </div>
                                <div className="vsched-form-group">
                                    <label>Unpublish At</label>
                                    <input type="datetime-local" value={formData.unpublishAt} onChange={e => setFormData({...formData, unpublishAt: e.target.value})} />
                                </div>
                                <div className="vsched-modal-actions">
                                    <button type="button" className="vsched-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="vsched-submit-btn" disabled={submitting}>
                                        {submitting ? <Loader2 className="animate-spin" size={16} /> : null} Create Schedule
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

export default VendorProductSchedules;
