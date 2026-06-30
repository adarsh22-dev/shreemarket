import React, { useState, useEffect, useCallback } from 'react';
import './TestimonialManagement.css';
import {
  Star, Plus, Trash2, Search, X, Loader2, CheckCircle, XCircle, User, Palette, MessageSquare
} from 'lucide-react';
import { getAdminTestimonials, addTestimonial, toggleTestimonial, deleteTestimonial, getAdminReviews, getPlatformSettings, updatePlatformSettings, BACKEND_URL } from '../../api/api';
import { CARD_TEMPLATES, SLIDER_LAYOUTS } from '../../components/TestimonialTemplateConfig';
import { CardClassic, CardBold, CardMinimal, CardBubble, CardSplit } from '../../components/TestimonialTemplates';
import toast from 'react-hot-toast';

const AV_COLORS = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626','#0891b2','#be185d'];
const avatarBg  = name => AV_COLORS[(name || '').charCodeAt(0) % AV_COLORS.length];
const initials  = name => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const TmStars = ({ rating, size = 12 }) => (
  <span className="tm-stars">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        fill={i <= rating ? '#f59e0b' : 'none'}
        color={i <= rating ? '#f59e0b' : '#d1d5db'}
        strokeWidth={1.5}
      />
    ))}
  </span>
);

const formatDate = (epoch) => {
  if (!epoch) return '';
  const d = new Date(epoch);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ── Design setting save helper ── */
const saveSettings = async (testimonialsSettings) => {
  const existing = await getPlatformSettings().catch(() => ({}));
  return updatePlatformSettings({ ...existing, testimonials: testimonialsSettings });
};

const SECTION_BG_OPTIONS = [
  { key: 'pink', label: 'Pink', color: '#fce7f3' },
  { key: 'blue', label: 'Blue', color: '#dbeafe' },
  { key: 'green', label: 'Green', color: '#dcfce7' },
  { key: 'purple', label: 'Purple', color: '#ede9fe' },
  { key: 'dark', label: 'Dark', color: '#334155' },
  { key: 'white', label: 'White', color: '#ffffff' },
  { key: 'custom', label: 'Custom', color: 'linear-gradient' },
];

/* ── Preview card map ── */
const PREVIEW_CARDS = {
  classic: CardClassic,
  bold: CardBold,
  minimal: CardMinimal,
  bubble: CardBubble,
  split: CardSplit,
};

export default function TestimonialManagement() {
  const [tab, setTab] = useState('list');
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [_reviewPage, setReviewPage] = useState(0);
  const [adding, setAdding] = useState(false);

  const [settings, setSettings] = useState({
    cardTemplate: 'classic',
    sliderLayout: 'single',
    sectionBg: 'pink',
    customBgColor: '#fdf2f8',
    heading: 'What Our Customers Say',
    subheading: 'Real reviews from happy customers',
    autoPlayInterval: 5,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminTestimonials();
      setTestimonials(data || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const settingsData = await getPlatformSettings();
        if (settingsData?.testimonials) {
          setSettings(prev => ({ ...prev, ...settingsData.testimonials }));
        }
      } catch {
        // ignore
      }
    };
    fetch();
  }, []);

  const fetchReviews = useCallback(async (search, page) => {
    try {
      const params = { page, size: 8 };
      if (search) params.search = search;
      const data = await getAdminReviews(params);
      setReviews(data.content || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load reviews');
    }
  }, []);

  const openAddModal = () => {
    setReviewSearch('');
    setReviewPage(0);
    setShowAddModal(true);
    fetchReviews('', 0);
  };

  const handleAdd = async (reviewId) => {
    setAdding(true);
    try {
      await addTestimonial(reviewId);
      toast.success('Testimonial added successfully');
      setShowAddModal(false);
      fetchTestimonials();
    } catch (err) {
      toast.error(err?.message || 'Failed to add testimonial');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const updated = await toggleTestimonial(id);
      setTestimonials(prev => prev.map(t => t.id === id ? updated : t));
      toast.success(`Testimonial ${updated.active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle testimonial');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      toast.success('Testimonial deleted');
      fetchTestimonials();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete testimonial');
    }
  };

  const handleSaveDesign = async () => {
    setSavingSettings(true);
    try {
      await saveSettings(settings);
      toast.success('Design settings saved');
    } catch (err) {
      toast.error(err?.message || 'Failed to save design settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const activeCount = testimonials.filter(t => t.active).length;
  const inactiveCount = testimonials.filter(t => !t.active).length;

  const demoTestimonial = {
    id: 0,
    reviewerName: 'Priya Sharma',
    rating: 5,
    title: 'Absolutely Love It!',
    text: 'The quality exceeded my expectations. Beautiful craftsmanship and fast delivery. Will definitely order again!',
    productName: 'Handwoven Silk Saree',
    productImage: null,
  };

  return (
    <div className="vm tm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Testimonial Management</h2>
          <p className="vm-hdr__sub">Select positive customer reviews to display as testimonials on the homepage carousel</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tm-tabs">
        <button className={`tm-tab${tab === 'list' ? ' tm-tab--active' : ''}`} onClick={() => setTab('list')}>
          <MessageSquare size={14} /> Testimonials
        </button>
        <button className={`tm-tab${tab === 'design' ? ' tm-tab--active' : ''}`} onClick={() => setTab('design')}>
          <Palette size={14} /> Design Settings
        </button>
      </div>

      {tab === 'list' && (
        <>
          <div className="vm-hdr__actions" style={{ marginTop: -8 }}>
            <button className="vm-btn vm-btn--primary" onClick={openAddModal}>
              <Plus size={13} color="#fff" /> Add Testimonial
            </button>
          </div>

          <div className="vm-kpi-grid tm-kpi-grid">
            {[
              { label: 'Active', value: activeCount, Icon: CheckCircle, c: '#16a34a', bg: '#dcfce7' },
              { label: 'Inactive', value: inactiveCount, Icon: XCircle, c: '#dc2626', bg: '#fee2e2' },
              { label: 'Total', value: testimonials.length, Icon: MessageSquare, c: '#6366f1', bg: '#eef2ff' },
            ].map((k, i) => {
              const KIcon = k.Icon;
              return (
                <div key={i} className="vm-kpi">
                  <div className="vm-kpi__top">
                    <div className="vm-kpi__icon" style={{ background: k.bg }}>
                      <KIcon size={18} color={k.c} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="vm-kpi__value">{k.value}</div>
                  <div className="vm-kpi__label">{k.label}</div>
                </div>
              );
            })}
          </div>

          <div className="vm-card">
            <div className="vm-sh">
              <div>
                <p className="vm-sh__title">Testimonial List</p>
                <p className="vm-sh__sub">{testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="vm-tw">
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
                  <Loader2 size={28} className="vm-spin" color="#6366f1" />
                </div>
              ) : (
              <table className="vm-tbl tm-tbl">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Product</th>
                    <th>Date Added</th>
                    <th>Status</th>
                    <th className="vm-th-r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                        No testimonials yet. Click "Add Testimonial" to select from customer reviews.
                      </td>
                    </tr>
                  ) : (
                    testimonials.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="vm-mn">{t.sortOrder || idx + 1}</td>
                        <td>
                          <div className="vm-vcell">
                            <div className="vm-av vm-av--sm" style={{ background: avatarBg(t.reviewerName) }}>{initials(t.reviewerName)}</div>
                            <span className="vm-vcell__name">{t.reviewerName}</span>
                          </div>
                        </td>
                        <td><TmStars rating={t.rating} /></td>
                        <td>
                          <div className="tm-review-text">
                            <p className="tm-review-title">{t.title}</p>
                            <p className="tm-review-body">{t.text}</p>
                          </div>
                        </td>
                        <td>
                          <div className="tm-product-cell">
                            {t.productImage && (
                              <img src={`${BACKEND_URL}/uploads/products/${t.productImage}`} alt={t.productName} className="tm-product-thumb" onError={(e) => { e.target.style.display = 'none'; }} />
                            )}
                            <span className="tm-product-name">{t.productName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="vm-mu">{formatDate(t.createdAt)}</td>
                        <td>
                          <span className={`vm-badge vm-badge--${t.active ? 'active' : 'inactive'}`}>
                            <span className="vm-badge__dot" />{t.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="vm-td-r">
                          <div className="vm-acts">
                            <button className={`vm-ib ${t.active ? 'vm-ib--warning' : 'vm-ib--success'}`} title={t.active ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(t.id)}>
                              {t.active ? <XCircle size={13} /> : <CheckCircle size={13} />}
                            </button>
                            <button className="vm-ib vm-ib--danger" title="Delete" onClick={() => handleDelete(t.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'design' && (
        <div className="vm-card tm-design-card">
          <div className="vm-sh">
            <p className="vm-sh__title">Design Settings</p>
            <p className="vm-sh__sub">Choose how testimonials look and behave on the homepage</p>
          </div>

          <div className="tm-design-grid">
            {/* Card Template */}
            <div className="tm-design-section">
              <h4 className="tm-design-label">Card Template</h4>
              <div className="tm-template-grid">
                {CARD_TEMPLATES.map(tmpl => {
                  const PreviewCard = PREVIEW_CARDS[tmpl.key];
                  const isActive = settings.cardTemplate === tmpl.key;
                  return (
                    <button key={tmpl.key} className={`tm-template-btn${isActive ? ' tm-template-btn--active' : ''}`} onClick={() => setSettings(s => ({ ...s, cardTemplate: tmpl.key }))}>
                      <div className="tm-template-preview">
                        <PreviewCard t={demoTestimonial} />
                      </div>
                      <div className="tm-template-name">{tmpl.name}</div>
                      <div className="tm-template-desc">{tmpl.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider Layout */}
            <div className="tm-design-section">
              <h4 className="tm-design-label">Slider Layout</h4>
              <div className="tm-layout-grid">
                {SLIDER_LAYOUTS.map(lyt => {
                  const isActive = settings.sliderLayout === lyt.key;
                  return (
                    <button key={lyt.key} className={`tm-template-btn${isActive ? ' tm-template-btn--active' : ''}`} onClick={() => setSettings(s => ({ ...s, sliderLayout: lyt.key }))}>
                      <div className="tm-layout-preview" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, background: '#f8fafc' }}>
                        {lyt.key === 'single' && <div className="tm-layout-icon"><div style={{ width: '60%', height: 4, background: '#cbd5e1', borderRadius: 2, margin: '0 auto' }} /><div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E03E1A' }} /><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d1d5db' }} /><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d1d5db' }} /></div></div>}
                        {lyt.key === 'multi' && <div className="tm-layout-icon"><div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}><div style={{ flex: 1, height: 12, background: '#cbd5e1', borderRadius: 3 }} /><div style={{ flex: 1, height: 12, background: '#E03E1A', borderRadius: 3 }} /><div style={{ flex: 1, height: 12, background: '#cbd5e1', borderRadius: 3 }} /></div></div>}
                        {lyt.key === 'fade' && <div className="tm-layout-icon"><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#E03E1A', margin: '0 auto' }} /><div style={{ width: '40%', height: 4, background: '#cbd5e1', borderRadius: 2, margin: '6px auto 0' }} /></div>}
                        {lyt.key === 'grid' && <div className="tm-layout-icon"><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}><div style={{ height: 8, background: '#cbd5e1', borderRadius: 2 }} /><div style={{ height: 8, background: '#cbd5e1', borderRadius: 2 }} /><div style={{ height: 8, background: '#cbd5e1', borderRadius: 2 }} /><div style={{ height: 8, background: '#cbd5e1', borderRadius: 2 }} /></div></div>}
                        {lyt.key === 'fullwidth' && <div className="tm-layout-icon"><div style={{ width: '100%', height: 16, background: 'linear-gradient(90deg, #334155, #1e293b)', borderRadius: 4 }} /><div style={{ width: '40%', height: 3, background: '#fff', borderRadius: 2, margin: '4px auto 0', opacity: 0.5 }} /></div>}
                      </div>
                      <div className="tm-template-name">{lyt.name}</div>
                      <div className="tm-template-desc">{lyt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Background */}
            <div className="tm-design-section">
              <h4 className="tm-design-label">Section Background</h4>
              <div className="tm-bg-grid">
                {SECTION_BG_OPTIONS.map(opt => (
                  <button key={opt.key} className={`tm-bg-btn${settings.sectionBg === opt.key ? ' tm-bg-btn--active' : ''}`} onClick={() => setSettings(s => ({ ...s, sectionBg: opt.key }))}>
                    <div className="tm-bg-swatch" style={{ background: opt.color, border: opt.key === 'white' ? '1px solid #e2e8f0' : 'none' }} />
                    <span>{opt.label}</span>
                  </button>
                ))}
                {settings.sectionBg === 'custom' && (
                  <div className="tm-custom-color-row">
                    <input type="color" className="tm-color-picker" value={settings.customBgColor || '#fdf2f8'} onChange={e => setSettings(s => ({ ...s, customBgColor: e.target.value }))} />
                    <input type="text" className="tm-input tm-color-text" value={settings.customBgColor || ''} onChange={e => setSettings(s => ({ ...s, customBgColor: e.target.value }))} placeholder="#hex or gradient" />
                  </div>
                )}
              </div>
            </div>

            {/* Heading & Subheading */}
            <div className="tm-design-section">
              <h4 className="tm-design-label">Section Text</h4>
              <div className="tm-text-inputs">
                <div>
                  <label className="tm-input-label">Heading</label>
                  <input className="tm-input" value={settings.heading} onChange={e => setSettings(s => ({ ...s, heading: e.target.value }))} />
                </div>
                <div>
                  <label className="tm-input-label">Subheading</label>
                  <input className="tm-input" value={settings.subheading} onChange={e => setSettings(s => ({ ...s, subheading: e.target.value }))} />
                </div>
                <div>
                  <label className="tm-input-label">Auto-play interval (seconds)</label>
                  <input className="tm-input" type="number" min={2} max={20} value={settings.autoPlayInterval} onChange={e => setSettings(s => ({ ...s, autoPlayInterval: parseInt(e.target.value) || 5 }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="tm-design-save">
            <button className="vm-btn vm-btn--primary" onClick={handleSaveDesign} disabled={savingSettings}>
              {savingSettings ? <Loader2 size={13} className="vm-spin" /> : <CheckCircle size={13} />}
              Save Design Settings
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="vm-overlay" onClick={() => setShowAddModal(false)}>
          <div className="vm-modal tm-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">Add Testimonial</p>
                <p className="vm-modal__sub">Select a customer review to feature on the homepage</p>
              </div>
              <button className="vm-ib" onClick={() => setShowAddModal(false)}><X size={14} /></button>
            </div>
            <div className="vm-modal__body">
              <div className="vm-search" style={{ marginBottom: 12 }}>
                <span className="vm-search__icon"><Search size={14} color="#94a3b8" /></span>
                <input className="vm-search__input" placeholder="Search reviews..." value={reviewSearch} onChange={e => { setReviewSearch(e.target.value); setReviewPage(0); fetchReviews(e.target.value, 0); }} />
              </div>
              <div className="tm-review-list">
                {reviews.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '.82rem' }}>No reviews found</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="tm-review-item">
                      <div className="tm-review-item-hdr">
                        <div className="vm-vcell">
                          <div className="vm-av vm-av--sm" style={{ background: avatarBg(r.reviewerName) }}>{initials(r.reviewerName)}</div>
                          <div>
                            <div className="tm-review-item-name">{r.reviewerName}</div>
                            <TmStars rating={r.rating} size={10} />
                          </div>
                        </div>
                        <button className="vm-btn vm-btn--primary vm-btn--sm" onClick={() => handleAdd(r.id)} disabled={adding}>
                          {adding ? <Loader2 size={12} className="vm-spin" /> : <Plus size={12} />} Select
                        </button>
                      </div>
                      <p className="tm-review-item-title">{r.title}</p>
                      <p className="tm-review-item-text">{r.text}</p>
                      {r.product?.name && <p className="tm-review-item-product"><User size={10} /> {r.product.name}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
