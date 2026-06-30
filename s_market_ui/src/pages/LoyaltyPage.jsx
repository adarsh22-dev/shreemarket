import React, { useState, useEffect } from 'react';
import {
    Star,
    Gift,
    TrendingUp,
    Award,
    Clock,
    ChevronRight,
    RefreshCw,
    AlertTriangle,
    ArrowUpRight,
    Zap
} from 'lucide-react';
import { getMyLoyalty, getLoyaltyTransactions } from '../api/api';
import './LoyaltyPage.css';

const LoyaltyPage = () => {
    const [loyalty, setLoyalty] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLoyalty = async () => {
            setLoading(true);
            setError(null);
            try {
                const [loyaltyData, txData] = await Promise.all([
                    getMyLoyalty(),
                    getLoyaltyTransactions()
                ]);
                setLoyalty(loyaltyData);
                setTransactions(txData || []);
            } catch (err) {
                console.error('Failed to fetch loyalty data:', err);
                setError(err.message || 'Failed to load loyalty data');
            } finally {
                setLoading(false);
            }
        };
        fetchLoyalty();
    }, []);

    const formatDate = (epoch) => {
        if (!epoch) return 'N/A';
        return new Date(epoch).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const getTierColor = (tier) => {
        const colors = {
            bronze: '#f97316',
            silver: '#64748b',
            gold: '#d97706',
            platinum: '#6d28d9'
        };
        return colors[tier?.toLowerCase()] || '#64748b';
    };

    const getTierBg = (tier) => {
        const bg = {
            bronze: '#fff7ed',
            silver: '#f8fafc',
            gold: '#fef9c3',
            platinum: '#ede9fe'
        };
        return bg[tier?.toLowerCase()] || '#f8fafc';
    };

    if (loading) {
        return (
            <div className="loyalty-page">
                <div className="loyalty-loading">
                    <RefreshCw className="spinning-loader" size={40} />
                    <p>Loading your loyalty rewards...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loyalty-page">
                <div className="loyalty-error">
                    <AlertTriangle size={48} />
                    <h2>Unable to Load</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="loyalty-page">
            <div className="loyalty-container">
                {/* Header */}
                <div className="loyalty-header">
                    <div className="loyalty-header-left">
                        <Award size={28} style={{ color: getTierColor(loyalty?.tier) }} />
                        <div>
                            <h1>My Loyalty Rewards</h1>
                            <p>Earn points on every purchase and unlock exclusive perks</p>
                        </div>
                    </div>
                </div>

                {/* Points & Tier Card */}
                <div className="loyalty-hero-card" style={{ background: `linear-gradient(135deg, ${getTierColor(loyalty?.tier)}15, ${getTierColor(loyalty?.tier)}08)` }}>
                    <div className="loyalty-hero-left">
                        <div className="loyalty-tier-badge" style={{ background: getTierColor(loyalty?.tier), color: '#fff' }}>
                            {loyalty?.tier?.[0]?.toUpperCase() || 'B'}
                        </div>
                        <div>
                            <span className="loyalty-tier-name" style={{ color: getTierColor(loyalty?.tier) }}>
                                {loyalty?.tier ? loyalty.tier.charAt(0).toUpperCase() + loyalty.tier.slice(1) : 'Bronze'} Member
                            </span>
                            <div className="loyalty-points-display">
                                <span className="loyalty-points-value">{loyalty?.points?.toLocaleString() || 0}</span>
                                <span className="loyalty-points-label">Active Points</span>
                            </div>
                        </div>
                    </div>
                    <div className="loyalty-hero-right">
                        <div className="loyalty-stat-item">
                            <span className="loyalty-stat-value">{loyalty?.earned?.toLocaleString() || 0}</span>
                            <span className="loyalty-stat-label">Total Earned</span>
                        </div>
                        <div className="loyalty-stat-divider"></div>
                        <div className="loyalty-stat-item">
                            <span className="loyalty-stat-value">{loyalty?.redeemed?.toLocaleString() || 0}</span>
                            <span className="loyalty-stat-label">Redeemed</span>
                        </div>
                        <div className="loyalty-stat-divider"></div>
                        <div className="loyalty-stat-item">
                            <span className="loyalty-stat-value" style={{ color: '#059669' }}>₹{((loyalty?.points || 0) / 5).toFixed(0)}</span>
                            <span className="loyalty-stat-label">Value</span>
                        </div>
                    </div>
                </div>

                {/* Progress to Next Tier */}
                <div className="loyalty-progress-card">
                    <div className="loyalty-progress-header">
                        <span>
                            {loyalty?.nextTier
                                ? `Progress to ${loyalty.nextTier.charAt(0).toUpperCase() + loyalty.nextTier.slice(1)}`
                                : 'Maximum Tier Reached'}
                        </span>
                        <span className="loyalty-progress-pct">{loyalty?.tierProgress || 0}%</span>
                    </div>
                    <div className="loyalty-progress-track">
                        <div
                            className="loyalty-progress-fill"
                            style={{
                                width: `${loyalty?.tierProgress || 0}%`,
                                background: getTierColor(loyalty?.tier)
                            }}
                        ></div>
                    </div>
                </div>

                {/* Perks */}
                <div className="loyalty-perks-card">
                    <h3><Gift size={18} /> Your Perks</h3>
                    <div className="loyalty-perks-list">
                        {loyalty?.perks?.map((perk, idx) => (
                            <div key={idx} className="loyalty-perk-item">
                                <Zap size={14} style={{ color: getTierColor(loyalty?.tier) }} />
                                <span>{perk}</span>
                            </div>
                        )) || (
                            <div className="loyalty-perk-item">
                                <span>Place your first order to unlock perks!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* How It Works */}
                <div className="loyalty-info-card">
                    <h3><Star size={18} /> How Points Work</h3>
                    <div className="loyalty-info-grid">
                        <div className="loyalty-info-item">
                            <div className="loyalty-info-icon earn-icon">+</div>
                            <div>
                                <strong>Earn Points</strong>
                                <p>Get 5% of your order total back as loyalty points on every delivered order.</p>
                            </div>
                        </div>
                        <div className="loyalty-info-item">
                            <div className="loyalty-info-icon redeem-icon">₹</div>
                            <div>
                                <strong>Redeem at Checkout</strong>
                                <p>5 points = ₹1 discount. Use your points to save on future orders.</p>
                            </div>
                        </div>
                        <div className="loyalty-info-item">
                            <div className="loyalty-info-icon tier-icon">↑</div>
                            <div>
                                <strong>Unlock Tiers</strong>
                                <p>Earn more to unlock Silver, Gold, and Platinum tiers with better perks.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="loyalty-tx-card">
                    <div className="loyalty-tx-header">
                        <h3><Clock size={18} /> Points History</h3>
                    </div>
                    {transactions.length === 0 ? (
                        <div className="loyalty-tx-empty">
                            <p>No transactions yet. Start earning points by placing orders!</p>
                        </div>
                    ) : (
                        <div className="loyalty-tx-list">
                            {transactions.map((tx, idx) => (
                                <div key={tx.id || idx} className={`loyalty-tx-item ${tx.type === 'EARNED' ? 'tx-earned' : 'tx-redeemed'}`}>
                                    <div className="loyalty-tx-icon">
                                        {tx.type === 'EARNED' ? (
                                            <ArrowUpRight size={16} style={{ color: '#059669' }} />
                                        ) : (
                                            <ArrowUpRight size={16} style={{ color: '#dc2626', transform: 'rotate(90deg)' }} />
                                        )}
                                    </div>
                                    <div className="loyalty-tx-info">
                                        <span className="loyalty-tx-reason">{tx.reason || 'Reward'}</span>
                                        {tx.reference && <span className="loyalty-tx-ref">{tx.reference}</span>}
                                    </div>
                                    <div className={`loyalty-tx-amount ${tx.type === 'EARNED' ? 'amount-earned' : 'amount-redeemed'}`}>
                                        {tx.type === 'EARNED' ? '+' : '-'}{tx.points} pts
                                    </div>
                                    <span className="loyalty-tx-date">{formatDate(tx.createdAt)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoyaltyPage;
