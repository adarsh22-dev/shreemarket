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
        responseRate: 0,
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

                {/* Review List */}
                <div className="vr-review-list">
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
                        reviews.map((review) => (
                            <div key={review.id} className={`review-card ${review.rating <= 2 && !review.vendorReply ? 'issue-highlight' : ''}`}>
                                <div className="review-header-flex">
                                    <div className="reviewer-info-group">
                                        <div className="reviewer-avatar" style={{ backgroundColor: '#FDF0F1', color: '#F45A56' }}>
                                            {getInitials(review.reviewerName)}
                                        </div>
                                        <div>
                                            <div className="reviewer-name-line">
                                                <h4>{review.reviewerName}</h4>
                                                {review.verifiedBuyer && <span className="badge-verified">VERIFIED PURCHASE</span>}
                                            </div>
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <div className="review-meta-group">
                                        <span className="review-date">REVIEWED ON {new Date(review.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                                        {review.product && (
                                            <div className="review-product-info-simple">
                                                <span className="review-product-name-only">{review.product.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="review-text">{review.text}</p>

                                {review.images && review.images.length > 0 && (
                                    <div className="review-images-flex">
                                        {review.images.map((img, i) => (
                                            <img key={i} src={`${BACKEND_URL}/uploads/reviews/${img}`} alt="review" className="review-customer-img" />
                                        ))}
                                    </div>
                                )}

                                {review.vendorReply && (
                                    <div className="vendor-reply-block">
                                        <div className="vrb-header">
                                            <span className="vrb-title"><CornerDownRight size={14} /> YOUR RESPONSE</span>
                                            <span className="vrb-date">{new Date(review.replyDate).toLocaleDateString()}</span>
                                        </div>
                                        <p className="vrb-text">{review.vendorReply}</p>
                                    </div>
                                )}

                                {replyingTo === review.id && (
                                    <div className="reply-editor-box">
                                        <textarea
                                            placeholder="Write your response..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            rows={3}
                                        />
                                        <div className="reply-actions">
                                            <button className="cancel-btn" onClick={() => setReplyingTo(null)}>Cancel</button>
                                            <button className="submit-btn" onClick={() => handleReply(review.id)}>Submit Response</button>
                                        </div>
                                    </div>
                                )}

                                <div className="review-footer-flex">
                                    <div className="review-status-indicator">
                                        {review.vendorReply ? (
                                            <span className="status-badge replied"><CheckCircle size={14} /> Replied</span>
                                        ) : (
                                            <span className="status-badge pending"><AlertCircle size={14} /> Pending Reply</span>
                                        )}
                                    </div>
                                    {!review.vendorReply && replyingTo !== review.id && (
                                        <div className="review-actions-group">
                                            <button className="action-btn-primary btn-orange" onClick={() => setReplyingTo(review.id)}>
                                                <CornerDownRight size={16} /> Reply
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
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
