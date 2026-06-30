import React, { useState, useEffect, useCallback } from 'react';
import './VendorRatings.css';
import {
  Search, Star, Eye, ChevronLeft, ChevronRight, Download,
  TrendingUp, TrendingDown, Minus, MessageSquare,
  ThumbsUp, ThumbsDown, X, ArrowUp, ArrowDown,
  Flag, Send, Check, AlertTriangle, Trash2, Loader
} from 'lucide-react';
import { getAdminReviews, deleteAdminReview } from '../../api/api';
import toast from 'react-hot-toast';

/* ── Helpers ── */
const AV_COLORS = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626','#0891b2','#be185d'];
const avatarBg  = name => AV_COLORS[(name || '').charCodeAt(0) % AV_COLORS.length];
const initials  = name => (name || '').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
const fmt       = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

const Stars = ({ rating, size=13 }) => (
  <span className="vr-stars">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        fill={i<=Math.round(rating)?'#f59e0b':'none'}
        color={i<=Math.round(rating)?'#f59e0b':'#d1d5db'}
        strokeWidth={1.5}/>
    ))}
  </span>
);

const RatingBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count/total)*100 : 0;
  return (
    <div className="vr-rbar">
      <span className="vr-rbar__lbl">{label}</span>
      <div className="vr-rbar__track"><div className="vr-rbar__fill" style={{width:`${pct}%`,background:color}}/></div>
      <span className="vr-rbar__count">{count}</span>
    </div>
  );
};

const ratingColor = r => r >= 4.5 ? '#16a34a' : r >= 4.0 ? '#d97706' : r >= 3.0 ? '#f97316' : '#dc2626';

const SORT_OPTIONS = [
  { value:'rating-desc',  label:'Rating: High to Low' },
  { value:'rating-asc',   label:'Rating: Low to High' },
  { value:'date-desc',    label:'Newest First'         },
  { value:'date-asc',     label:'Oldest First'         },
];

const RATING_FILTERS = ['All','5','4','3','2','1'];

const PER = 6;

/** Map a backend review object to the shape used by this UI. */
function mapReview(r) {
  const productName = r.product?.name || 'Unknown Product';
  const productImage = r.product?.media?.[0]?.url || r.product?.media?.[0]?.mediaUrl || null;
  return {
    id: r.id,
    productId: r.product?.id,
    productName,
    productImage,
    vendorId: r.product?.vendorId || r.vendorId,
    reviewerName: r.reviewerName || 'Anonymous',
    userId: r.userId,
    rating: r.rating || 0,
    title: r.title || '',
    text: r.text || '',
    images: r.images || [],
    verifiedBuyer: r.verifiedBuyer || false,
    helpfulCount: r.helpfulCount || 0,
    notHelpfulCount: r.notHelpfulCount || 0,
    createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    vendorReply: r.vendorReply || null,
    replyDate: r.replyDate ? new Date(r.replyDate) : null,
  };
}

function formatDate(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function VendorRatings() {
  const [reviews,      setReviews]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalElements,setTotalElements]= useState(0);
  const [filter,       setFilter]       = useState('All');
  const [search,       setSearch]       = useState('');
  const [sort,         setSort]         = useState('date-desc');
  const [page,         setPage]         = useState(0);
  const [modalReview,  setModalReview]  = useState(null);
  const [deleteConfirm,setDeleteConfirm]= useState(null);
  const [deleting,     setDeleting]     = useState(false);

  /* ── Fetch reviews ── */
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PER };
      if (search.trim()) params.search = search.trim();
      if (filter !== 'All') params.rating = filter;

      const data = await getAdminReviews(params);
      const mapped = (data.content || []).map(mapReview);
      setReviews(mapped);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error(err?.message || 'Failed to load reviews');
      setReviews([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* ── Sort locally within fetched page ── */
  let list = [...reviews];
  list.sort((a, b) => {
    if (sort === 'rating-desc')  return b.rating - a.rating;
    if (sort === 'rating-asc')   return a.rating - b.rating;
    if (sort === 'date-desc')    return b.createdAt - a.createdAt;
    if (sort === 'date-asc')     return a.createdAt - b.createdAt;
    return 0;
  });

  /* ── Delete ── */
  const handleDelete = async (reviewId) => {
    setDeleting(true);
    try {
      await deleteAdminReview(reviewId);
      toast.success('Review deleted successfully');
      setDeleteConfirm(null);
      if (modalReview?.id === reviewId) setModalReview(null);
      fetchReviews();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Export all ── */
  const handleExport = () => {
    const rows = [
      ['ID','Product','Reviewer','Rating','Title','Text','Verified','Helpful','Not Helpful','Date'],
      ...reviews.map(r => [r.id, r.productName, r.reviewerName, r.rating, r.title, r.text, r.verifiedBuyer, r.helpfulCount, r.notHelpfulCount, formatDate(r.createdAt)])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'vendor_ratings.csv' });
    a.click(); URL.revokeObjectURL(a.href);
    toast.success('Vendor ratings exported');
  };

  /* ── KPIs (from current page — best we can do without a dedicated stats endpoint) ── */
  const avgRating     = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const highRated     = reviews.filter(r => r.rating >= 4).length;
  const needAttention = reviews.filter(r => r.rating <= 2).length;

  /* ── Breakdown for modal ── */
  const getBreakdown = (review) => {
    // Show the single review's rating context
    const bd = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    bd[Math.round(review.rating)] = 1;
    return bd;
  };

  return (
    <div className="vm">

      {/* ── Header ── */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Vendor Ratings</h2>
          <p className="vm-hdr__sub">Monitor vendor review scores, trends and customer sentiment across the platform</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={handleExport}>
            <Download size={13} color="#475569"/>Export Report
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="vm-kpi-grid">
        {[
          { label:'Avg Rating (Page)',  value: avgRating,           Icon: Star,          c:'#f59e0b', bg:'#fef9c3', sub:'Current page average' },
          { label:'Total Reviews',      value: fmt(totalElements),  Icon: MessageSquare, c:'#2563eb', bg:'#dbeafe', sub:'All time' },
          { label:'Positive Reviews',   value: highRated,           Icon: ThumbsUp,      c:'#16a34a', bg:'#dcfce7', sub:'4+ stars on this page' },
          { label:'Needs Attention',    value: needAttention,       Icon: ThumbsDown,    c:'#dc2626', bg:'#fee2e2', sub:'2 stars or below' },
        ].map((k, i) => {
          const KIcon = k.Icon;
          return (
            <div key={i} className="vm-kpi">
              <div className="vm-kpi__top">
                <div className="vm-kpi__icon" style={{ background: k.bg }}><KIcon size={18} color={k.c} strokeWidth={2}/></div>
              </div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
              <div className="vm-kpi__sub">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Table card ── */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Review Overview</p>
            <p className="vm-sh__sub">{totalElements} review{totalElements !== 1 ? 's' : ''} total</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Search size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search product, reviewer..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}/>
            </div>
            <div className="vm-pills">
              {RATING_FILTERS.map(f => (
                <button key={f} className={`vm-pill${filter === f ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f === 'All' ? 'All' : `${f}★`}
                </button>
              ))}
            </div>
            <select className="vr-select" value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="vm-tw">
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, color:'#94a3b8', gap:8, fontSize:'.85rem' }}>
              <Loader size={18} className="vr-spin"/> Loading reviews...
            </div>
          ) : (
          <table className="vm-tbl vr-tbl">
            <thead>
              <tr>
                <th>Reviewer</th><th>Product</th><th>Rating</th>
                <th>Stars</th><th>Title</th><th>Date</th>
                <th>Verified</th><th>Helpful</th>
                <th>Reply</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:32, color:'#94a3b8', fontSize:'.82rem' }}>No reviews match your filters.</td></tr>
              )}
              {list.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="vm-vcell">
                      <div className="vm-av vm-av--sm" style={{ background: avatarBg(r.reviewerName) }}>{initials(r.reviewerName)}</div>
                      <div>
                        <div className="vm-vcell__name">{r.reviewerName}</div>
                        <div style={{ fontSize:'.68rem', color:'#94a3b8' }}>ID: {r.userId || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="vm-mu" style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.productName}</td>
                  <td><span className="vr-score" style={{ color: ratingColor(r.rating) }}>{r.rating.toFixed(1)}</span></td>
                  <td><Stars rating={r.rating}/></td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.8rem', color:'#475569' }}>
                    {r.title || <span style={{ color:'#cbd5e1' }}>No title</span>}
                  </td>
                  <td style={{ fontSize:'.76rem', color:'#64748b', whiteSpace:'nowrap' }}>{formatDate(r.createdAt)}</td>
                  <td>
                    {r.verifiedBuyer
                      ? <span className="vm-badge vr-status--active"><span className="vm-badge__dot"/>Verified</span>
                      : <span style={{ fontSize:'.75rem', color:'#94a3b8' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.78rem' }}>
                      <span style={{ color:'#16a34a', display:'flex', alignItems:'center', gap:2 }}><ThumbsUp size={11}/>{r.helpfulCount}</span>
                      <span style={{ color:'#dc2626', display:'flex', alignItems:'center', gap:2 }}><ThumbsDown size={11}/>{r.notHelpfulCount}</span>
                    </div>
                  </td>
                  <td>
                    {r.vendorReply
                      ? <span className="vm-badge vr-status--active"><span className="vm-badge__dot"/>Replied</span>
                      : <span style={{ fontSize:'.75rem', color:'#94a3b8' }}>Pending</span>
                    }
                  </td>
                  <td className="vm-td-r">
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="vm-ib vm-ib--view" title="View details" onClick={() => setModalReview(r)}>
                        <Eye size={13}/>
                      </button>
                      <button className="vm-ib" title="Delete review" style={{ color:'#dc2626' }} onClick={() => setDeleteConfirm(r.id)}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">
            {totalElements > 0 ? `${page * PER + 1}–${Math.min((page + 1) * PER, totalElements)} of ${totalElements}` : '0 results'}
          </span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={13}/></button>
            <span className="vm-pag__label">{page + 1} / {totalPages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}><ChevronRight size={13}/></button>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      {deleteConfirm && (
        <div className="vm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="vm-modal vr-modal" onClick={e => e.stopPropagation()} style={{ maxWidth:420 }}>
            <div className="vm-modal__hdr">
              <p className="vm-modal__title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <AlertTriangle size={16} color="#dc2626"/>Delete Review
              </p>
              <button className="vm-ib" onClick={() => setDeleteConfirm(null)}><X size={14}/></button>
            </div>
            <div className="vm-modal__body">
              <p style={{ fontSize:'.85rem', color:'#475569', marginBottom:16 }}>
                Are you sure you want to permanently delete this review? This action cannot be undone.
              </p>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="vm-btn vm-btn--outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
                <button className="vm-btn vm-btn--primary" style={{ background:'#dc2626' }} onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
                  {deleting ? <><Loader size={13} className="vr-spin"/> Deleting...</> : <><Trash2 size={13} color="#fff"/> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL MODAL ══ */}
      {modalReview && (() => {
        const r = modalReview;
        return (
          <div className="vm-overlay" onClick={() => setModalReview(null)}>
            <div className="vm-modal vr-modal" onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className="vm-modal__hdr">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="vm-av" style={{ background: avatarBg(r.reviewerName), width:40, height:40, fontSize:'.82rem', borderRadius:10 }}>{initials(r.reviewerName)}</div>
                  <div>
                    <p className="vm-modal__title">{r.reviewerName}</p>
                    <p className="vm-modal__sub">Review #{r.id} · {r.productName}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button className="vm-ib" title="Delete review" style={{ color:'#dc2626' }} onClick={() => { setModalReview(null); setDeleteConfirm(r.id); }}>
                    <Trash2 size={13}/>
                  </button>
                  <button className="vm-ib" onClick={() => setModalReview(null)}><X size={14}/></button>
                </div>
              </div>

              <div className="vm-modal__body">

                {/* Score hero */}
                <div className="vr-score-hero">
                  <div className="vr-score-hero__left">
                    <span className="vr-score-hero__num" style={{ color: ratingColor(r.rating) }}>{r.rating.toFixed(1)}</span>
                    <Stars rating={r.rating} size={18}/>
                    <span style={{ fontSize:'.78rem', color:'#94a3b8' }}>{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="vr-score-hero__right">
                    {r.verifiedBuyer && (
                      <span className="vr-tier" style={{ background:'#dcfce7', color:'#16a34a', fontSize:'.8rem', padding:'4px 12px' }}>
                        <Check size={12}/> Verified Buyer
                      </span>
                    )}
                  </div>
                </div>

                {/* Review title and text */}
                {r.title && (
                  <div>
                    <p className="vr-section-lbl">Title</p>
                    <p style={{ fontSize:'.88rem', color:'#1e293b', fontWeight:600, marginTop:4 }}>{r.title}</p>
                  </div>
                )}
                <div>
                  <p className="vr-section-lbl">Review</p>
                  <p style={{ fontSize:'.84rem', color:'#475569', lineHeight:1.6, marginTop:4 }}>
                    {r.text || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>No review text provided.</span>}
                  </p>
                </div>

                {/* Review images */}
                {r.images && r.images.length > 0 && (
                  <div>
                    <p className="vr-section-lbl">Images</p>
                    <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                      {r.images.map((img, i) => (
                        <img key={i} src={typeof img === 'string' ? img : img.url || img.mediaUrl}
                          alt={`Review ${i + 1}`}
                          style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'1px solid #e2e8f0' }}/>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product info */}
                <div>
                  <p className="vr-section-lbl">Product</p>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
                    {r.productImage && (
                      <img src={r.productImage} alt={r.productName}
                        style={{ width:48, height:48, objectFit:'cover', borderRadius:8, border:'1px solid #e2e8f0' }}/>
                    )}
                    <div>
                      <div style={{ fontSize:'.84rem', fontWeight:600, color:'#1e293b' }}>{r.productName}</div>
                      <div style={{ fontSize:'.72rem', color:'#94a3b8' }}>Product ID: {r.productId || '—'} · Vendor ID: {r.vendorId || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="vr-stats-grid">
                  {[
                    { label:'Helpful',      value: r.helpfulCount,    color:'#16a34a' },
                    { label:'Not Helpful',   value: r.notHelpfulCount, color:'#dc2626' },
                    { label:'Verified',      value: r.verifiedBuyer ? 'Yes' : 'No', color: r.verifiedBuyer ? '#16a34a' : '#94a3b8' },
                    { label:'Vendor Reply',  value: r.vendorReply ? 'Yes' : 'No',  color: r.vendorReply ? '#2563eb' : '#94a3b8' },
                  ].map((s, i) => (
                    <div key={i} className="vr-stat-card">
                      <div className="vr-stat-val" style={{ color: s.color }}>{s.value}</div>
                      <div className="vr-stat-lbl">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Vendor reply */}
                {r.vendorReply && (
                  <div>
                    <p className="vr-section-lbl">Vendor Reply</p>
                    <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', marginTop:8 }}>
                      <p style={{ fontSize:'.82rem', color:'#475569', lineHeight:1.5 }}>{r.vendorReply}</p>
                      {r.replyDate && (
                        <p style={{ fontSize:'.7rem', color:'#94a3b8', marginTop:6 }}>Replied on {formatDate(r.replyDate)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rating breakdown visual */}
                <div>
                  <p className="vr-section-lbl">Rating</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                    {[5,4,3,2,1].map(star => {
                      const bd = getBreakdown(r);
                      const total = Object.values(bd).reduce((s, n) => s + n, 0);
                      const colors = { 5:'#16a34a', 4:'#84cc16', 3:'#f59e0b', 2:'#f97316', 1:'#dc2626' };
                      return <RatingBar key={star} label={`${star}★`} count={bd[star]} total={total} color={colors[star]}/>;
                    })}
                  </div>
                </div>

                {/* Footer actions */}
                <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #f1f5f9', marginTop:4 }}>
                  <button className="vm-btn vm-btn--outline" style={{ flex:1, justifyContent:'center' }} onClick={() => setModalReview(null)}>Close</button>
                  <button className="vm-btn vm-btn--primary" style={{ flex:1, justifyContent:'center', background:'#dc2626' }}
                    onClick={() => { setModalReview(null); setDeleteConfirm(r.id); }}>
                    <Trash2 size={13} color="#fff"/>Delete Review
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
