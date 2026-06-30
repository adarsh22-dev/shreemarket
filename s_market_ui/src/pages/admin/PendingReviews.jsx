import React, { useState, useEffect, useCallback } from 'react';
import './PendingReviews.css';
import {
  Search, Star, Eye, Check, X, ChevronLeft, ChevronRight,
  Download, Clock, CheckCircle, XCircle, AlertCircle, User, ShieldCheck, Loader2
} from 'lucide-react';
import { getAdminReviews, deleteAdminReview } from '../../api/api';
import { exportCSV } from './VendorShared';
import toast from 'react-hot-toast';

/* ── Helpers ── */
const AV_COLORS = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626','#0891b2','#be185d'];
const avatarBg  = name => AV_COLORS[(name || '').charCodeAt(0) % AV_COLORS.length];
const initials  = name => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const Stars = ({ rating, size = 12 }) => (
  <span className="rv-stars">
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

/* ── Constants ── */
const STATUS_FILTERS = ['All','pending','approved','rejected'];
const RATING_FILTERS = ['All','5','4','3','2','1'];
const PER = 8;

const ratingColor = r => r >= 4 ? '#16a34a' : r === 3 ? '#d97706' : '#dc2626';
const ratingBg    = r => r >= 4 ? '#dcfce7'  : r === 3 ? '#fef3c7'  : '#fee2e2';

export default function PendingReviews() {
  const [rows,       setRows]       = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filter,     setFilter]     = useState('All');
  const [ratingF,    setRatingF]    = useState('All');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(0);
  const [modal,      setModal]      = useState(null);
  const [loading,    setLoading]    = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PER };
      if (search) params.search = search;
      if (filter !== 'All') params.status = filter;
      if (ratingF !== 'All') params.rating = ratingF;
      const data = await getAdminReviews(params);
      const mapped = (data.content || []).map(r => ({
        id:       r.id,
        customer: r.reviewerName || `User #${r.userId}`,
        product:  r.product?.name || 'Unknown Product',
        vendor:   r.product?.vendorId ? `Vendor #${r.product.vendorId}` : '',
        rating:   r.rating,
        title:    r.title || '',
        body:     r.text || '',
        date:     formatDate(r.createdAt),
        verified: r.verifiedBuyer,
        status:   r.status || 'pending',
        images:   r.images || [],
        helpfulCount:    r.helpfulCount || 0,
        notHelpfulCount: r.notHelpfulCount || 0,
        vendorReply:     r.vendorReply || null,
        replyDate:       r.replyDate ? formatDate(r.replyDate) : null,
        productMedia:    r.product?.media || [],
        userId:          r.userId,
      }));
      setRows(mapped);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalElements || 0);
    } catch (err) {
      toast.error(err?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, search, filter, ratingF]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* ── Derived counts (from current page; totals come from API) ── */
  const pending  = rows.filter(r => r.status === 'pending').length;
  const approved = rows.filter(r => r.status === 'approved').length;
  const rejected = rows.filter(r => r.status === 'rejected').length;
  const avgRating = rows.length
    ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1)
    : '0.0';

  const approve = id => setRows(rs => rs.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  const reject  = id => setRows(rs => rs.map(r => r.id === id ? { ...r, status: 'rejected' } : r));

  const handleDelete = async (id) => {
    try {
      await deleteAdminReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="vm">
      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Pending Reviews</h2>
          <p className="vm-hdr__sub">Review and moderate customer product reviews before they go live on the storefront</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => exportCSV(rows, 'pending-reviews.csv')}><Download size={13} color="#475569" />Export</button>
          <button className="vm-btn vm-btn--primary"
            onClick={() => setRows(rs => rs.map(r => r.status === 'pending' ? { ...r, status: 'approved' } : r))}>
            <CheckCircle size={13} color="#fff" />Approve All Pending
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Pending Approval', value: pending,   Icon: Clock,       c:'#d97706', bg:'#fef3c7' },
          { label:'Approved',         value: approved,  Icon: CheckCircle, c:'#16a34a', bg:'#dcfce7' },
          { label:'Rejected',         value: rejected,  Icon: XCircle,     c:'#dc2626', bg:'#fee2e2' },
          { label:'Avg Star Rating',  value: avgRating, Icon: Star,        c:'#f59e0b', bg:'#fef9c3' },
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
            <p className="vm-sh__title">Review Queue</p>
            <p className="vm-sh__sub">{totalItems} review{totalItems !== 1 ? 's' : ''} found</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Search size={14} color="#94a3b8" /></span>
              <input className="vm-search__input" placeholder="Search customer, product or ID…"
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
            <div className="vm-pills">
              {RATING_FILTERS.map(r => (
                <button key={r} className={`vm-pill${ratingF === r ? ' vm-pill--active' : ''}`}
                  onClick={() => { setRatingF(r); setPage(0); }}>
                  {r === 'All' ? 'All Stars' : `${r}★`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
              <Loader2 size={28} className="vm-spin" color="#6366f1" />
            </div>
          ) : (
          <table className="vm-tbl rv-tbl">
            <thead>
              <tr>
                <th>Review ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Vendor</th>
                <th>Rating</th>
                <th>Title</th>
                <th>Date</th>
                <th>Verified</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="vm-mn">{r.id}</td>
                  <td>
                    <div className="vm-vcell">
                      <div className="vm-av vm-av--sm" style={{ background: avatarBg(r.customer) }}>{initials(r.customer)}</div>
                      <span className="vm-vcell__name">{r.customer}</span>
                    </div>
                  </td>
                  <td><span className="rv-product">{r.product}</span></td>
                  <td className="vm-mu">{r.vendor}</td>
                  <td>
                    <div className="rv-rating-cell">
                      <span className="rv-rnum" style={{ background: ratingBg(r.rating), color: ratingColor(r.rating) }}>{r.rating}</span>
                      <Stars rating={r.rating} />
                    </div>
                  </td>
                  <td><span className="rv-review-title">{r.title}</span></td>
                  <td className="vm-mu">{r.date}</td>
                  <td>
                    {r.verified
                      ? <span className="rv-chip rv-chip--green"><CheckCircle size={11} color="#16a34a" />Verified</span>
                      : <span className="rv-chip rv-chip--grey"><User size={11} color="#64748b" />Guest</span>
                    }
                  </td>
                  <td>
                    <span className={`vm-badge vm-badge--${r.status}`}>
                      <span className="vm-badge__dot" />
                      {r.status[0].toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td className="vm-td-r">
                    <div className="vm-acts">
                      <button className="vm-ib vm-ib--view" title="View" onClick={() => setModal(r)}><Eye size={13} /></button>
                      {r.status === 'pending' && <>
                        <button className="vm-btn vm-btn--success vm-btn--sm" onClick={() => approve(r.id)}>
                          <Check size={12} color="#fff" />Approve
                        </button>
                        <button className="vm-btn vm-btn--danger vm-btn--sm" onClick={() => reject(r.id)}>
                          <X size={12} color="#fff" />Reject
                        </button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        <div className="vm-pag">
          <span className="vm-pag__info">{totalItems === 0 ? '0' : `${page * PER + 1}–${Math.min((page + 1) * PER, totalItems)}`} of {totalItems}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={13} /></button>
            <span className="vm-pag__label">{page + 1} / {totalPages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {modal && (
        <div className="vm-overlay" onClick={() => setModal(null)}>
          <div className="vm-modal rv-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">Review Detail</p>
                <p className="vm-modal__sub">Review #{modal.id}</p>
              </div>
              <button className="vm-ib" onClick={() => setModal(null)}><X size={14} /></button>
            </div>
            <div className="vm-modal__body">
              {/* Customer + rating */}
              <div className="rv-modal-meta">
                <div className="vm-vcell">
                  <div className="vm-av vm-av--sm" style={{ background: avatarBg(modal.customer) }}>{initials(modal.customer)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{modal.customer}</div>
                    <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>{modal.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stars rating={modal.rating} size={15} />
                  <span className="rv-rnum" style={{ background: ratingBg(modal.rating), color: ratingColor(modal.rating), fontSize: '.78rem', padding: '3px 10px' }}>
                    {modal.rating}/5
                  </span>
                </div>
              </div>
              {/* Product */}
              <div className="rv-modal-product">
                <span className="rv-modal-plbl">Product</span>
                <span className="rv-modal-pname">{modal.product}</span>
                <span style={{ fontSize: '.75rem', color: '#64748b' }}>{modal.vendor}</span>
              </div>
              {/* Review body */}
              <div className="rv-modal-review">
                <p style={{ margin: '0 0 7px', fontWeight: 700, fontSize: '.88rem', color: '#0f172a' }}>{modal.title}</p>
                <p style={{ margin: 0, fontSize: '.82rem', color: '#475569', lineHeight: 1.65 }}>{modal.body}</p>
              </div>
              {/* Vendor reply */}
              {modal.vendorReply && (
                <div className="rv-modal-review" style={{ background: '#f1f5f9', borderLeft: '3px solid #6366f1' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '.78rem', color: '#6366f1' }}>Vendor Reply {modal.replyDate ? `· ${modal.replyDate}` : ''}</p>
                  <p style={{ margin: 0, fontSize: '.82rem', color: '#475569', lineHeight: 1.65 }}>{modal.vendorReply}</p>
                </div>
              )}
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {modal.verified
                  ? <span className="rv-chip rv-chip--green"><CheckCircle size={11} color="#16a34a" />Verified Purchase</span>
                  : <span className="rv-chip rv-chip--grey"><User size={11} color="#64748b" />Guest Purchase</span>
                }
                <span className={`vm-badge vm-badge--${modal.status}`}>
                  <span className="vm-badge__dot" />
                  {modal.status[0].toUpperCase() + modal.status.slice(1)}
                </span>
              </div>
              {/* Actions */}
              {modal.status === 'pending' && (
                <div className="vm-modal__acts">
                  <button className="vm-btn vm-btn--danger" style={{ flex: 1 }}
                    onClick={() => { reject(modal.id); setModal(null); }}>
                    <X size={13} color="#fff" />Reject Review
                  </button>
                  <button className="vm-btn vm-btn--success" style={{ flex: 1 }}
                    onClick={() => { approve(modal.id); setModal(null); }}>
                    <Check size={13} color="#fff" />Approve Review
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
