import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { getVendorPlans, getMySubscription, subscribeToPlan } from '../../api/api';
import { Crown, Check, Loader2, Zap, Shield, BarChart3, Store, Code2 } from 'lucide-react';
import './VendorSubscription.css';

const getPlanFeatures = (plan) => {
    const features = [];
    if (plan.maxProducts) features.push(`Up to ${plan.maxProducts} products`);
    if (plan.maxOrders) features.push(`Up to ${plan.maxOrders} orders/month`);
    if (plan.commissionRate !== undefined) features.push(`${plan.commissionRate}% commission`);
    if (plan.featuredListing) features.push('Featured Listing');
    if (plan.prioritySupport) features.push('Priority Support');
    if (plan.advancedAnalytics) features.push('Advanced Analytics');
    if (plan.customStorefront) features.push('Custom Storefront');
    if (plan.apiAccess) features.push('API Access');
    return features;
};

const VendorSubscription = () => {
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [subscribing, setSubscribing] = useState(null);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const [plansData, subData] = await Promise.all([
                getVendorPlans(),
                getMySubscription()
            ]);
            setPlans(Array.isArray(plansData) ? plansData : []);
            setSubscription(subData || null);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSubscribe = async (planId) => {
        setSubscribing(planId);
        try {
            const data = await subscribeToPlan(planId, billingCycle);
            if (data.subscription) {
                setSubscription(data.subscription);
            }
            fetchPlans();
        } catch (err) {
            console.error('Failed to subscribe:', err);
        } finally {
            setSubscribing(null);
        }
    };

    const getPlanIcon = (name) => {
        const icons = { 'Free': <Zap size={24} />, 'Starter': <Shield size={24} />, 'Professional': <BarChart3 size={24} />, 'Enterprise': <Crown size={24} /> };
        return icons[name] || <Zap size={24} />;
    };

    return (
        <VendorLayout>
            <div className="vendor-subscription">
                <div className="vs-header">
                    <h1><Crown size={24} /> Subscription & Plans</h1>
                    <p className="vs-subtitle">Choose the plan that fits your business needs</p>
                </div>

                {subscription && (
                    <div className="vs-current-plan">
                        <Crown size={20} />
                        <div>
                            <strong>Current Plan: {subscription.planName}</strong>
                            <span>{subscription.billingCycle} · ₹{subscription.amount?.toFixed(2)} · {subscription.status}</span>
                        </div>
                    </div>
                )}

                <div className="vs-billing-toggle">
                    <button className={`vs-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`} onClick={() => setBillingCycle('monthly')}>Monthly</button>
                    <button className={`vs-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`} onClick={() => setBillingCycle('yearly')}>Yearly</button>
                </div>

                {loading ? (
                    <div className="vs-loading"><Loader2 className="animate-spin" size={24} /> Loading plans...</div>
                ) : (
                    <div className="vs-plans-grid">
                        {plans.map(plan => {
                            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                            const features = getPlanFeatures(plan);
                            const isCurrentPlan = subscription?.planId === plan.id;
                            return (
                                <div key={plan.id} className={`vs-plan-card ${isCurrentPlan ? 'current' : ''} ${plan.name === 'Enterprise' ? 'featured' : ''}`}>
                                    {plan.name === 'Enterprise' && <div className="vs-plan-badge">Best Value</div>}
                                    <div className="vs-plan-icon">{getPlanIcon(plan.name)}</div>
                                    <h3>{plan.name}</h3>
                                    <div className="vs-plan-price">
                                        <span className="vs-price">₹{price?.toFixed(0) || '0'}</span>
                                        <span className="vs-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                    <p className="vs-plan-desc">{plan.description}</p>
                                    <ul className="vs-plan-features">
                                        {features.map((f, i) => <li key={i}><Check size={16} /> {f}</li>)}
                                    </ul>
                                    <button className={`vs-subscribe-btn ${isCurrentPlan ? 'current-plan' : ''}`}
                                        onClick={() => handleSubscribe(plan.id)} disabled={subscribing === plan.id || isCurrentPlan}>
                                        {subscribing === plan.id ? <Loader2 className="animate-spin" size={16} /> : null}
                                        {isCurrentPlan ? 'Current Plan' : (price === 0 ? 'Get Started Free' : `Subscribe ₹${price?.toFixed(0)}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`)}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorSubscription;
