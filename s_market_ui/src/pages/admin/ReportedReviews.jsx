import React, { useState, useEffect, useCallback } from 'react';
import './ReportedReviews.css';
import {
  Search, Star, Eye, X, ChevronLeft, ChevronRight,
  Download, Flag, AlertTriangle, Trash2, ShieldCheck, CheckCircle
} from 'lucide-react';
import { getAdminReviews, deleteAdminReview } from '../../api/api';
import toast from 'react-hot-toast';
import { exportCSV } from './VendorShared';

/* ── Helpers ── */
const AV_COLORS = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626','#0891b2','#be185d'];
const avatarBg  = name => AV_COLORS[(name || '').charCodeAt(0) % AV_COLORS.length];
const initials  = name => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const Stars = ({ rating, size = 12 }) => (
  <span className="rp-stars">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        fill={i <= rating ? '#f59e0b' : 'none'}
        color={i <= rating ? '#f59e0b' : '#d1d5db'}
        strokeWidth={1.5}
      />
    ))}
  </span>
);

const REASON_STYLE = {
  'Fake / Counterfeit claim':     { c:'#dc2626', bg:'#fee2e2' },
  'Defamatory content':           { c:'#7c3aed', bg:'#ede9fe' },
  'Unverified medical claim':     { c:'#d97706', bg:'#fef3c7' },
  'Suspected fake / paid review': { c:'#2563eb', bg:'#dbeafe' },
  'Food safety / health claim':   { c:'#dc2626', bg:'#fee2e2' },
  'Competitor promotion':         { c:'#0891b2', bg:'#e0f2fe' },
  'Offensive / abusive language': { c:'#dc2626', bg:'#fee2e2' },
  'Off-platform solicitation':    { c:'#7c3aed', bg:'#ede9fe' },
  'Spam content':                 { c:'#64748b', bg:'#f1f5f9' },
};

const STATUS_FILTERS = ['All','pending','investigating','dismissed','removed'];
const PER = 8;

/** Map a backend review object to the shape the UI expects */
const mapReview = (r) => {
  const createdDate = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return {
    id: `RR-${String(r.id).padStart(4, '0')}`,
    reviewId: `RV-${String(r.id).padStart(4, '0')}`,
    _backendId: r.id,
    customer: r.reviewerName || 'Unknown',
    product: r.product?.name || 'Unknown Product',
    vendor: r.product?.vendorId ? `Vendor #${r.product.vendorId}` : 'Unknown Vendor',
    rating: r.rating || 0,
    title: r.title || '',
    body: r.text || '',
    reportedBy: 'System',
    reason: 'Reported',
    count: (r.notHelpfulCount || 0),
    date: createdDate,
    status: 'pending',
    images: r.images || [],
    verifiedBuyer: r.verifiedBuyer || false,
    helpfulCount: r.helpfulCount || 0,
    vendorReply: r.vendorReply || null,
    replyDate: r.replyDate || null,
  };
};

export default function ReportedReviews() {
  const [rows,       setRows]       = useState([]);
  const [filter,     setFilter]     = useState('All');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(0);
  const [modal,      setModal]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews({ page, size: PER, search: search || undefined });
      const mapped = (data.content || []).map(mapReview);
      setRows(mapped);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error(err?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* Client-side status filter (status is not a backend field, applied locally) */
  const list = rows.filter(r =>
    (filter === 'All' || r.status === filter)
  );
  const pages = totalPages;
  const slice = list;

  const pending       = rows.filter(r => r.status === 'pending').length;
  const investigating = rows.filter(r => r.status === 'investigating').length;
  const removed       = rows.filter(r => r.status === 'removed').length;
  const highRisk      = rows.filter(r => r.count >= 4).length;

  const updateStatus = (id, status) =>
    setRows(rs => rs.map(r => r.id === id ? { ...r, status } : r));

  const handleDelete = async (row) => {
    try {
      await deleteAdminReview(row._backendId);
      toast.success('Review removed successfully');
      updateStatus(row.id, 'removed');
    } catch (err) {
      toast.error(err?.message || 'Failed to remove review');
    }
  };

  return (
    <div className="vm">
      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Reported Reviews</h2>
          <p className="vm-hdr__sub">Investigate flagged reviews and take appropriate moderation action</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => {
            const csvRows = rows.map(r => [r.id, r.reviewer || '—', r.product || '—', r.rating || 0, r.reason || '—', r.reports || 0, r.status || 'Pending', r.date || '—']);
            exportCSV([['ID','Reviewer','Product','Rating','Reason','Reports','Status','Date'], ...csvRows], 'reported-reviews.csv');
            toast.success('Reported reviews exported');
          }}><Download size={13} color="#475569" />Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Awaiting Review',   value: pending,       Icon: Flag,          c:'#d97706', bg:'#fef3c7' },
          { label:'Investigating',     value: investigating,  Icon: AlertTriangle, c:'#7c3aed', bg:'#ede9fe' },
          { label:'Removed',           value: removed,        Icon: Trash2,        c:'#dc2626', bg:'#fee2e2' },
          { label:'High Risk (4+ reports)', value: highRisk,  Icon: AlertTriangle, c:'#dc2626', bg:'#fee2e2' },
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

      {/* Table card */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Reported Review Queue</p>
            <p className="vm-sh__sub">{totalElements} report{totalElements !== 1 ? 's' : ''} found</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Search size={14} color="#94a3b8" /></span>
              <input className="vm-search__input" placeholder="Search product, customer, reason…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
            <div className="vm-pills">
              {STATUS_FILTERS.map(f => (
                <button key={f} className={`vm-pill${filter === f ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f === 'All' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '.9rem' }}>Loading reviews...</div>
          ) : (
          <table className="vm-tbl rp-tbl">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Reviewer</th>
                <th>Product / Vendor</th>
                <th>Rating</th>
                <th>Report Reason</th>
                <th>Count</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>No reported reviews found</td></tr>
              ) : slice.map(r => {
                const rs = REASON_STYLE[r.reason] || { c:'#64748b', bg:'#f1f5f9' };
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="vm-mn">{r.id}</div>
                      <div style={{ fontSize: '.67rem', color: '#cbd5e1', fontFamily: 'monospace' }}>{r.reviewId}</div>
                    </td>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{ background: avatarBg(r.customer) }}>{initials(r.customer)}</div>
                        <span className="vm-vcell__name">{r.customer}</span>
                      </div>
                    </td>
                    <td>
                      <div className="rp-product">{r.product}</div>
                      <div style={{ fontSize: '.71rem', color: '#94a3b8' }}>{r.vendor}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span className="rp-rnum">{r.rating}</span>
                        <Stars rating={r.rating} />
                      </div>
                    </td>
                    <td>
                      <span className="rp-reason" style={{ background: rs.bg, color: rs.c }}>{r.reason}</span>
                    </td>
                    <td>
                      <span className={`rp-count${r.count >= 4 ? ' rp-count--high' : ''}`}>{r.count}</span>
                    </td>
                    <td className="vm-mu">{r.reportedBy}</td>
                    <td className="vm-mu">{r.date}</td>
                    <td>
                      <span className={`vm-badge rp-badge--${r.status}`}>
                        <span className="vm-badge__dot" />
                        {r.status[0].toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="vm-td-r">
                      <div className="vm-acts">
                        <button className="vm-ib vm-ib--view" title="View" onClick={() => setModal(r)}><Eye size={13} /></button>
                        {(r.status === 'pending' || r.status === 'investigating') && <>
                          <button className="vm-btn vm-btn--success vm-btn--sm"
                            onClick={() => updateStatus(r.id, 'dismissed')}>
                            <ShieldCheck size={12} color="#fff" />Dismiss
                          </button>
                          <button className="vm-btn vm-btn--danger vm-btn--sm"
                            onClick={() => handleDelete(r)}>
                            <Trash2 size={12} color="#fff" />Remove
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        <div className="vm-pag">
          <span className="vm-pag__info">{totalElements === 0 ? '0' : `${page * PER + 1}–${Math.min((page + 1) * PER, totalElements)}`} of {totalElements}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={13} /></button>
            <span className="vm-pag__label">{page + 1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= pages}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {modal && (
        <div className="vm-overlay" onClick={() => setModal(null)}>
          <div className="vm-modal rp-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">Report Detail</p>
                <p className="vm-modal__sub">{modal.id} · Review {modal.reviewId}</p>
              </div>
              <button className="vm-ib" onClick={() => setModal(null)}><X size={14} /></button>
            </div>
            <div className="vm-modal__body">
              {/* Report info */}
              <div className="rp-modal-section">
                <span className="rp-modal-lbl">Report Info</span>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '.85rem' }}>Reported by: {modal.reportedBy}</span>
                    <span className="vm-mu" style={{ fontSize: '.75rem' }}>{modal.date}</span>
                  </div>
                  {(() => {
                    const rs = REASON_STYLE[modal.reason] || { c: '#64748b', bg: '#f1f5f9' };
                    return <span className="rp-reason" style={{ background: rs.bg, color: rs.c, alignSelf: 'flex-start' }}>{modal.reason}</span>;
                  })()}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 600 }}>Total report count:</span>
                    <span className={`rp-count${modal.count >= 4 ? ' rp-count--high' : ''}`}>{modal.count}</span>
                  </div>
                </div>
              </div>

              {/* Review content */}
              <div className="rp-modal-section">
                <span className="rp-modal-lbl">Review Content</span>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div className="vm-vcell">
                      <div className="vm-av vm-av--sm" style={{ background: avatarBg(modal.customer) }}>{initials(modal.customer)}</div>
                      <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{modal.customer}</span>
                    </div>
                    <Stars rating={modal.rating} size={13} />
                  </div>
                  <div className="rp-modal-review">
                    <p style={{ margin: '0 0 7px', fontWeight: 700, fontSize: '.88rem', color: '#0f172a' }}>{modal.title}</p>
                    <p style={{ margin: 0, fontSize: '.82rem', color: '#475569', lineHeight: 1.65 }}>{modal.body}</p>
                  </div>
                </div>
              </div>

              {/* Product */}
              <div className="rp-modal-section">
                <span className="rp-modal-lbl">Product</span>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '.86rem' }}>{modal.product}</span>
                  <span style={{ fontSize: '.75rem', color: '#64748b' }}>{modal.vendor}</span>
                </div>
              </div>

              {/* Actions */}
              {(modal.status === 'pending' || modal.status === 'investigating') && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="vm-btn vm-btn--outline" style={{ flex: 1 }}
                    onClick={() => { updateStatus(modal.id, 'investigating'); setModal(null); }}>
                    <AlertTriangle size={13} color="#d97706" />Investigate
                  </button>
                  <button className="vm-btn vm-btn--success" style={{ flex: 1 }}
                    onClick={() => { updateStatus(modal.id, 'dismissed'); setModal(null); }}>
                    <ShieldCheck size={13} color="#fff" />Dismiss
                  </button>
                  <button className="vm-btn vm-btn--danger" style={{ flex: 1 }}
                    onClick={() => { handleDelete(modal); setModal(null); }}>
                    <Trash2 size={13} color="#fff" />Remove Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
