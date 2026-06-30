import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorReviewTemplates, createVendorReviewTemplate, updateVendorReviewTemplate, deleteVendorReviewTemplate } from '../../api/api';
import { MessageSquare, Plus, Edit3, Trash2, RefreshCw, Loader2, Copy } from 'lucide-react';
import './VendorReviewTemplates.css';

const VendorReviewTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', ratingFilter: '', isDefault: false });
    const [submitting, setSubmitting] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await getVendorReviewTemplates();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const openCreate = () => {
        setEditing(null);
        setFormData({ title: '', content: '', ratingFilter: '', isDefault: false });
        setShowModal(true);
    };

    const openEdit = (template) => {
        setEditing(template.id);
        setFormData({ title: template.title, content: template.content, ratingFilter: template.ratingFilter || '', isDefault: template.isDefault || false });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editing) {
                await updateVendorReviewTemplate(editing, formData);
            } else {
                await createVendorReviewTemplate(formData);
            }
            setShowModal(false);
            fetchTemplates();
        } catch (err) {
            console.error('Failed to save template:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteVendorReviewTemplate(id);
            fetchTemplates();
        } catch (err) {
            console.error('Failed to delete template:', err);
        }
    };

    const copyToClipboard = (content) => {
        navigator.clipboard.writeText(content);
    };

    return (
        <VendorLayout>
            <div className="vendor-review-templates">
                <div className="vrt-header">
                    <h1><MessageSquare size={24} /> Review Reply Templates</h1>
                    <div className="vrt-header-actions">
                        <button className="vrt-refresh-btn" onClick={fetchTemplates}><RefreshCw size={16} /> Refresh</button>
                        <button className="vrt-create-btn" onClick={openCreate}><Plus size={16} /> New Template</button>
                    </div>
                </div>

                {loading ? (
                    <div className="vrt-loading"><Loader2 className="animate-spin" size={24} /> Loading...</div>
                ) : templates.length === 0 ? (
                    <div className="vrt-empty"><MessageSquare size={48} /><h3>No templates yet</h3><p>Create saved reply templates for responding to customer reviews</p></div>
                ) : (
                    <div className="vrt-grid">
                        {templates.map(t => (
                            <div key={t.id} className="vrt-card">
                                <div className="vrt-card-header">
                                    <h3>{t.title}</h3>
                                    <div className="vrt-card-actions">
                                        <button className="vrt-icon-btn" onClick={() => openEdit(t)}><Edit3 size={14} /></button>
                                        <button className="vrt-icon-btn" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {t.ratingFilter && <span className="vrt-rating-badge">{t.ratingFilter} stars</span>}
                                <p className="vrt-content">{t.content}</p>
                                <button className="vrt-copy-btn" onClick={() => copyToClipboard(t.content)}><Copy size={14} /> Copy</button>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <div className="vrt-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="vrt-modal" onClick={e => e.stopPropagation()}>
                            <h2>{editing ? 'Edit' : 'Create'} Template</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="vrt-form-group">
                                    <label>Title</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Thank you for your review" required />
                                </div>
                                <div className="vrt-form-group">
                                    <label>Content</label>
                                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={5} placeholder="Dear customer, thank you for your feedback..." required />
                                </div>
                                <div className="vrt-form-group">
                                    <label>Rating Filter (optional)</label>
                                    <select value={formData.ratingFilter} onChange={e => setFormData({...formData, ratingFilter: e.target.value})}>
                                        <option value="">All ratings</option>
                                        <option value="5">5 stars</option>
                                        <option value="4">4 stars</option>
                                        <option value="3">3 stars</option>
                                        <option value="2">2 stars</option>
                                        <option value="1">1 star</option>
                                    </select>
                                </div>
                                <div className="vrt-modal-actions">
                                    <button type="button" className="vrt-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="vrt-submit-btn" disabled={submitting}>
                                        {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                                        {editing ? 'Update' : 'Create'}
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

export default VendorReviewTemplates;
