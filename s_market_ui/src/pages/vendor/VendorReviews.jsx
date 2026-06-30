import React, { useState, useEffect, useCallback } from 'react';
import {
    Download,
    Star,
    Search,
    ChevronDown,
    Flag,
    CheckCircle,
    AlertCircle,
    CornerDownRight,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorReviews, replyToReview, BACKEND_URL, getUserDetails, getVendorReviewStats } from '../../api/api';
import toast from 'react-hot-toast';
import './VendorReviews.css';

const VendorReviews = () => {
    // --- State Management ---
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        pendingReviews: 0,
        distribution: [
            { stars: 5, pct: 0 },
            { stars: 4, pct: 0 },
            { stars: 3, pct: 0 },
            { stars: 2, pct: 0 },
            { stars: 1, pct: 0 }
        ]
    });

    // Filtering & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [vendorId, setVendorId] = useState(null);

    // Reply State
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    // --- Helpers ---
    // Fetch vendor ID on mount
    useEffect(() => {
        const initVendorInfo = async () => {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.userId) {
                try {
                    const userDetails = await getUserDetails(userData.userId);
                    setVendorId(userDetails.id);
                } catch (error) {
                    console.error("Failed to fetch user details:", error);
                    // Fallback to local storage id if API fails
                    setVendorId(userData.userId);
                }
            } else {
                setLoading(false);
                console.error("No user session found. Please log in as a vendor.");
            }
        };
        initVendorInfo();
    }, []);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(0);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- Data Fetching ---
    const fetchStats = useCallback(async () => {
        if (!vendorId) return;
        try {
            const data = await getVendorReviewStats(vendorId);
            setStats({
                averageRating: data.averageRating || 0,
                totalReviews: data.totalReviews || 0,
                pendingReviews: data.pendingReviews || 0,
                distribution: data.distribution || [
                    { stars: 5, pct: 0 },
                    { stars: 4, pct: 0 },
                    { stars: 3, pct: 0 },
                    { stars: 2, pct: 0 },
                    { stars: 1, pct: 0 }
                ]
            });
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }, [vendorId]);

    const fetchReviews = useCallback(async () => {
        if (!vendorId) return;

        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                search: debouncedSearch,
                status: statusFilter,
                rating: ratingFilter,
                sortBy: 'createdAt',
                sortDir: 'desc'
            };

            const data = await getVendorReviews(vendorId, params);
            setReviews(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
            toast.error("Error loading reviews");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearch, statusFilter, ratingFilter, vendorId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);


    // --- Handlers ---
    const handleReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await replyToReview(reviewId, replyText);
            toast.success("Reply submitted successfully");
            setReplyingTo(null);
            setReplyText('');
            fetchReviews(); // Refresh list
        } catch (error) {
            toast.error("Failed to submit reply");
        }
    };

    const handleRatingFilter = (rating) => {
        setRatingFilter(rating === ratingFilter ? null : rating);
        setCurrentPage(0);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setRatingFilter(null);
        setStatusFilter('All');
        setCurrentPage(0);
    };

    // Quick helper to safely render stars
    const renderStars = (rating) => {
        return (
            <div className="review-stars">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        fill={i < rating ? '#E74C3C' : 'transparent'}
                        color={i < rating ? '#E74C3C' : '#D1D5DB'}
                        className={i < rating ? 'star-filled' : 'star-empty'}
                    />
                ))}
            </div>
        );
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <VendorLayout>
            <div className="vendor-reviews-container">
                {/* Header Section */}
                <header className="vr-header">
                    <div>
                        <h1 className="vr-title">Reviews & Ratings</h1>
                        <p className="vr-subtitle">Monitor customer sentiment and build trust through engagement.</p>
                    </div>
                    <button className="vr-export-btn">
                        <Download size={16} />
                        Export Data
                    </button>
                </header>

                {/* Stats Dashboard */}
                <div className="vr-stats-grid">
                    <div className="stat-card average-rating-card">
                        <h3 className="stat-label">AVERAGE RATING</h3>
                        <div className="ar-value">{stats.averageRating.toFixed(1)}</div>
                        <div className="ar-stars">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star
                                    key={i}
                                    size={20}
                                    fill={i <= Math.round(stats.averageRating) ? "#E74C3C" : "transparent"}
                                    color={i <= Math.round(stats.averageRating) ? "#E74C3C" : "#D1D5DB"}
                                />
                            ))}
                        </div>
                        <div className="ar-trend trend-up">
                            <ArrowUpRight size={12} />
                            Overall Rating
                        </div>
                    </div>

                    <div className="stat-card">
                        <h3 className="stat-label">Total<br />Reviews</h3>
                        <div className="stat-value">{stats.totalReviews}</div>
                        <div className="stat-trend trend-up">All Time</div>
                    </div>

                    <div className="stat-card">
                        <h3 className="stat-label">Pending<br />Replies</h3>
                        <div className="stat-value">{stats.pendingReviews}</div>
                        <div className="stat-trend trend-down">Needs Attention</div>
                    </div>

                    <div className="stat-card distribution-card">
                        <h3 className="stat-label">RATING DISTRIBUTION</h3>
                        <div className="dist-bars">
                            {stats.distribution.map((row) => (
                                <div key={row.stars} className="dist-row">
                                    <span className="dist-star-label">{row.stars}★</span>
                                    <div className="dist-bar-bg">
                                        <div className="dist-bar-fill" style={{ width: `${row.pct}%` }}></div>
                                    </div>
                                    <span className="dist-pct-label">{Math.round(row.pct)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="vr-filter-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search reviewer or comment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="reviews-search-input"
                        />
                    </div>
                    <div className="filter-dropdowns">
                        <div className="filter-dropdown-container">
                            <select
                                className="filter-dropdown-select"
                                value={ratingFilter || 'All Ratings'}
                                onChange={(e) => setRatingFilter(e.target.value === 'All Ratings' ? null : Number(e.target.value))}
                            >
                                <option value="All Ratings">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                            <ChevronDown size={16} color="#666" className="dropdown-icon" />
                        </div>

                        <div className="filter-dropdown-container">
                            <select
                                className="filter-dropdown-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Replied">Replied</option>
                                <option value="Pending">Pending</option>
                            </select>
                            <ChevronDown size={16} color="#666" className="dropdown-icon" />
                        </div>

                        <button className="clear-filters-btn" onClick={handleClearFilters}>
                            Clear
                        </button>
                    </div>
                </div>

                {/* Review Table */}
                <div className="vr-table-wrap">
                    {loading ? (
                        <div className="vr-loading-state">
                            <Loader2 size={40} className="animate-spin" />
                            <p>Loading reviews...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="vr-empty-state">
                            <p>No reviews found matching your criteria.</p>
                        </div>
                    ) : (
                        <table className="vr-table">
                            <thead>
                                <tr>
                                    <th>Reviewer</th>
                                    <th>Rating</th>
                                    <th>Product</th>
                                    <th>Review</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th className="vr-th-r">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map((review) => (
                                    <tr key={review.id} className={review.rating <= 2 && !review.vendorReply ? 'vr-row-issue' : ''}>
                                        <td>
                                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                <div className="vr-avatar-sm">{getInitials(review.reviewerName)}</div>
                                                <div>
                                                    <div style={{ fontWeight:600, fontSize:'.82rem', color:'#1a1a2e' }}>{review.reviewerName}</div>
                                                    {review.verifiedBuyer && <span className="vr-verified">Verified</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{renderStars(review.rating)}</td>
                                        <td style={{ fontSize:'.78rem', color:'#6b7280', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{review.product?.name || '-'}</td>
                                        <td style={{ maxWidth:250, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#6b7280', fontSize:'.78rem' }}>{review.text}</td>
                                        <td style={{ whiteSpace:'nowrap', fontSize:'.78rem', color:'#9ca3af' }}>{new Date(review.createdAt).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' })}</td>
                                        <td>
                                            {review.vendorReply ? (
                                                <span className="vr-badge vr-badge--replied"><CheckCircle size={12} /> Replied</span>
                                            ) : (
                                                <span className="vr-badge vr-badge--pending"><AlertCircle size={12} /> Pending</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                                                {!review.vendorReply && replyingTo !== review.id && (
                                                    <button className="vr-action-btn" onClick={() => setReplyingTo(review.id)}>
                                                        <CornerDownRight size={13} /> Reply
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {replyingTo && (
                        <div className="vr-reply-inline">
                            <textarea className="vr-reply-ta" placeholder="Write your response..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} />
                            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                                <button className="vr-cancel-btn" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                                <button className="vr-submit-btn" onClick={() => handleReply(replyingTo)}>Submit Response</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="vr-pagination-footer">
                        <span className="vr-showing-text">
                            SHOWING {reviews.length} OF {totalElements} REVIEWS
                        </span>
                        <div className="pagination-controls">
                            <button
                                className="page-btn"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    className={`page-btn ${currentPage === i ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                className="page-btn"
                                disabled={currentPage === totalPages - 1}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

const ArrowUpRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
);

export default VendorReviews;
