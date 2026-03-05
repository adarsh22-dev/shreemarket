import React, { useState } from 'react';
import {
    Search, MessageCircle, Mail, Phone,
    ChevronDown, ChevronRight, ExternalLink,
    ThumbsUp, ThumbsDown, Zap, BookOpen, Clock,
    ShoppingBag, Tag, BarChart2, Settings,
    CreditCard, Package, FileText, Bell,
    AlertCircle, CheckCircle, LifeBuoy,
    HelpCircle, Megaphone, Activity,
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorStoreLocatorHelp.css';

/* ─── Data ───────────────────────────────────────── */
const KPIS = [
    { label: 'Help Articles',         value: '120+', trend: '+8 this month',      trendType: 'positive', icon: BookOpen,   color: 'blue'   },
    { label: 'Avg. Resolution Time',  value: '3 min',trend: '-0.8 min vs last mo',trendType: 'positive', icon: Activity,   color: 'green'  },
    { label: 'Open Tickets',          value: '2',    trend: '1 awaiting reply',    trendType: 'neutral',  icon: HelpCircle, color: 'orange' },
];

const CATEGORIES = [
    { icon: ShoppingBag, bg: '#f0f7ff', color: '#3b82f6', title: 'Orders & Fulfillment',    desc: 'Processing, shipping & returns',        count: 28 },
    { icon: Tag,         bg: '#fff5f3', color: '#E03E1A', title: 'Promotions & Discounts',  desc: 'Coupons, sales & campaigns',            count: 18 },
    { icon: CreditCard,  bg: '#f0fdf4', color: '#059669', title: 'Payments & Payouts',      desc: 'Billing, invoices & settlements',       count: 22 },
    { icon: Package,     bg: '#f8f5ff', color: '#8b5cf6', title: 'Products & Inventory',    desc: 'Listings, stock & bulk uploads',        count: 19 },
    { icon: BarChart2,   bg: '#fff8e1', color: '#b8860b', title: 'Analytics & Reports',     desc: 'Revenue, traffic & insights',           count: 14 },
    { icon: Settings,    bg: '#f5f5f5', color: '#555555', title: 'Account & Settings',      desc: 'Profile, security & preferences',       count: 11 },
];

const FAQ_TABS = ['All', 'Orders', 'Payments', 'Promotions', 'Account'];

const FAQS = [
    {
        tag: 'orders',
        q: 'How do I process and fulfil a new order?',
        a: `Once a customer places an order it appears under Orders → New Orders with an "Unfulfilled" status. Click the order to review items, then hit "Mark as Fulfilled" after packaging. You can print a packing slip directly from this screen. If you use a third-party shipping provider, paste the tracking number in the "Add Tracking" field — the customer receives an automatic notification.`,
    },
    {
        tag: 'payments',
        q: 'When will my payout be processed?',
        a: `Payouts are processed on a 7-day rolling cycle. Funds from orders marked fulfilled before midnight Monday are disbursed the following Monday. You can view your upcoming payout amount and breakdown in Payments → Payout Schedule. If you'd prefer bi-weekly or monthly cycles, update your preference under Settings → Payment Schedule.`,
    },
    {
        tag: 'promotions',
        q: 'How do I create a coupon code for customers?',
        a: `Go to Promotions → Create New Promotion, select "Coupon" as the type, and fill in the discount value (fixed or percentage), usage limits, and an optional minimum cart value. After saving, the coupon is live immediately unless you set a future start date. You can pause or delete active coupons at any time from the Promotions table.`,
    },
    {
        tag: 'orders',
        q: 'Can I process a partial refund on an order?',
        a: `Yes. Open the order, scroll to the Refund section, and select individual line items or enter a custom refund amount. Partial refunds appear in the order timeline and the customer receives an email confirmation. The refunded amount is deducted from your next scheduled payout. Note that shipping costs can only be refunded if the full order is refunded.`,
    },
    {
        tag: 'account',
        q: 'How do I add a team member to my vendor account?',
        a: `Navigate to Settings → Team Members → Invite Member. Enter their email and select a role: Admin (full access), Manager (no billing), or Staff (read-only). The invite expires after 48 hours. Once accepted, their account appears in your team list where you can adjust permissions or revoke access at any time.`,
    },
    {
        tag: 'payments',
        q: 'What fees are deducted from my payouts?',
        a: `Each order carries a platform commission fee (visible in your vendor agreement) plus a payment processing fee of 2% + ₹2 per transaction. These are itemised on every payout statement under Payments → Payout History. There are no monthly subscription fees — you're only charged on successful sales.`,
    },
    {
        tag: 'promotions',
        q: 'Why is my discount not applying at checkout?',
        a: `Check three things: (1) the promotion's status is Active, not Scheduled or Paused; (2) the cart meets any minimum order value you set; (3) the coupon hasn't hit its usage limit. If all three look correct, verify that the applicable products are included in the promo's scope. If the issue persists, contact support with the order ID.`,
    },
];

const ARTICLES = [
    { icon: ShoppingBag, title: 'Complete guide to order management & fulfilment',    time: '5 min read', badge: 'popular' },
    { icon: CreditCard,  title: 'Understanding your payout breakdown and timeline',    time: '4 min read', badge: 'new'     },
    { icon: Tag,         title: 'How to set up Buy X Get Y promotions',                time: '3 min read', badge: null      },
    { icon: Package,     title: 'Bulk uploading products with a CSV file',             time: '6 min read', badge: 'updated' },
    { icon: BarChart2,   title: 'Reading your sales analytics dashboard',              time: '4 min read', badge: 'popular' },
    { icon: Bell,        title: 'Configuring order & stock alert notifications',       time: '3 min read', badge: null      },
    { icon: FileText,    title: 'Generating and exporting custom reports',             time: '5 min read', badge: null      },
    { icon: Megaphone,   title: 'Creating your first promotional campaign end-to-end', time: '7 min read', badge: 'new'     },
];

const TICKETS = [
    { id: '#TKT-6614', title: 'Payout for Oct cycle not received',      status: 'open',    time: '3h ago' },
    { id: '#TKT-6598', title: 'Bulk CSV upload returning format error',  status: 'pending', time: '1d ago' },
    { id: '#TKT-6541', title: 'Coupon not applying to bundled products', status: 'closed',  time: '4d ago' },
];

const TIPS = [
    'Enable low-stock alerts under Settings → Notifications to avoid missed orders.',
    'Use the "Duplicate" button on any promotion to reuse settings for flash sales.',
    'Export your analytics as CSV monthly to keep an offline record for accounting.',
];

/* ─── Component ─────────────────────────────────── */
const VendorHelpCenter = () => {
    const [query,     setQuery]     = useState('');
    const [openFaq,   setOpenFaq]   = useState(0);
    const [activeTab, setActiveTab] = useState('All');
    const [voted,     setVoted]     = useState(null);

    const visibleFaqs = FAQS.filter(f =>
        activeTab === 'All' || f.tag === activeTab.toLowerCase()
    );

    return (
        <VendorLayout>
            <div className="hc-container">

                {/* Header */}
                <div className="hc-header">
                    <div>
                        <h1>Help Center</h1>
                        <p>Guides, FAQs, and support for every part of your vendor account.</p>
                    </div>
                    <div className="hc-header-btns">
                        <button className="hc-btn-ghost"><BookOpen size={16} /> All Articles</button>
                        <button className="hc-btn-primary"><MessageCircle size={16} /> Contact Support</button>
                    </div>
                </div>

                {/* Hero */}
                <div className="hc-hero">
                    <div className="hc-hero-dots" />
                    <div className="hc-hero-badge"><HelpCircle size={11} /> Vendor Help Center</div>
                    <h2>What do you need help with?</h2>
                    <p className="hc-hero-sub">
                        Search 120+ articles covering orders, payments, promotions, and more.
                    </p>
                    <div className="hc-search-wrap">
                        <Search className="hc-search-ico" size={17} />
                        <input
                            type="text"
                            placeholder="e.g. process a refund, payout schedule, coupon setup…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <button className="hc-search-btn">Search</button>
                    </div>
                    <div className="hc-popular-wrap">
                        <span>Popular:</span>
                        {['Payout timeline', 'Create coupon', 'Process refund', 'Bulk upload', 'Analytics export'].map(t => (
                            <button key={t} className="hc-pop-tag" onClick={() => setQuery(t)}>{t}</button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="hc-status">
                    <span className="hc-status-pulse" />
                    <CheckCircle size={15} />
                    All systems operational — no active incidents.
                    <span className="hc-status-right">
                        Updated 6 min ago · <u style={{ cursor: 'pointer' }}>View status page</u>
                    </span>
                </div>

                {/* KPIs */}
                <div className="hc-kpi-row">
                    {KPIS.map((k, i) => {
                        const Icon = k.icon;
                        return (
                            <div className="hc-kpi-card" key={i}>
                                <div className="hc-kpi-top">
                                    <div className={`hc-kpi-icon ${k.color}`}><Icon size={20} /></div>
                                    <span className={`hc-kpi-trend ${k.trendType}`}>{k.trend}</span>
                                </div>
                                <div>
                                    <div className="hc-kpi-label">{k.label}</div>
                                    <div className="hc-kpi-value">{k.value}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="hc-body">

                    {/* ── Left column ── */}
                    <div>

                        {/* Categories */}
                        <div className="hc-sec-lbl">Browse by Category</div>
                        <div className="hc-cat-grid">
                            {CATEGORIES.map((cat, i) => {
                                const Icon = cat.icon;
                                return (
                                    <div className="hc-cat-card" key={i}>
                                        <div className="hc-cat-icon" style={{ background: cat.bg, color: cat.color }}>
                                            <Icon size={20} />
                                        </div>
                                        <h4>{cat.title}</h4>
                                        <p>{cat.desc}</p>
                                        <div className="hc-cat-link">
                                            {cat.count} articles <ChevronRight size={13} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* FAQ Accordion */}
                        <div className="hc-sec-lbl">Frequently Asked Questions</div>
                        <div className="hc-panel">
                            <div className="hc-panel-header">
                                <h3>Common Questions</h3>
                                <div className="hc-tabs">
                                    {FAQ_TABS.map(tab => (
                                        <button
                                            key={tab}
                                            className={`hc-tab${activeTab === tab ? ' active' : ''}`}
                                            onClick={() => { setActiveTab(tab); setOpenFaq(null); }}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {visibleFaqs.map((faq, i) => (
                                <div key={i} className={`hc-faq-item${openFaq === i ? ' open' : ''}`}>
                                    <div className="hc-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                        <div className="hc-faq-q-left">
                                            <div className="hc-faq-num">{i + 1}</div>
                                            <div className="hc-faq-q-text">{faq.q}</div>
                                        </div>
                                        <ChevronDown size={16} className="hc-faq-chevron" />
                                    </div>
                                    <div className="hc-faq-answer"><p>{faq.a}</p></div>
                                </div>
                            ))}
                        </div>

                        {/* Articles */}
                        <div className="hc-sec-lbl" style={{ marginTop: '1.5rem' }}>Featured Articles</div>
                        <div className="hc-panel">
                            {ARTICLES.map((a, i) => {
                                const Icon = a.icon;
                                return (
                                    <div className="hc-article-row" key={i}>
                                        <div className="hc-article-ico"><Icon size={15} /></div>
                                        <div className="hc-article-info">
                                            <strong>{a.title}</strong>
                                            <span><Clock size={11} />{a.time}</span>
                                        </div>
                                        {a.badge && (
                                            <span className={`hc-article-badge badge-${a.badge}`}>{a.badge}</span>
                                        )}
                                        <ChevronRight size={14} color="#ccc" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Feedback */}
                        <div className="hc-feedback">
                            <p>Was this page helpful?</p>
                            <button className={`hc-thumb${voted === 'up' ? ' voted' : ''}`} onClick={() => setVoted('up')}>
                                <ThumbsUp size={14} /> Yes
                            </button>
                            <button className={`hc-thumb${voted === 'down' ? ' voted' : ''}`} onClick={() => setVoted('down')}>
                                <ThumbsDown size={14} /> No
                            </button>
                            {voted && (
                                <div className="hc-feedback-confirm">
                                    <CheckCircle size={13} /> Thanks for your feedback!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="hc-sidebar">

                        {/* Contact */}
                        <div className="hc-card">
                            <div className="hc-card-title"><LifeBuoy size={16} color="#E03E1A" /> Contact Support</div>
                            <div className="hc-contact-list">
                                {[
                                    { icon: MessageCircle, bg: '#f0f7ff', color: '#3b82f6', label: 'Live Chat',       sub: 'Avg. reply in 2 min'  },
                                    { icon: Mail,          bg: '#fff5f3', color: '#E03E1A', label: 'Email Support',   sub: 'Reply within 24 hrs'  },
                                    { icon: Phone,         bg: '#f0fdf4', color: '#059669', label: 'Schedule a Call', sub: 'Mon–Fri, 9 AM – 6 PM' },
                                ].map((c, i) => {
                                    const Icon = c.icon;
                                    return (
                                        <div className="hc-contact-item" key={i}>
                                            <div className="hc-contact-ic" style={{ background: c.bg, color: c.color }}>
                                                <Icon size={17} />
                                            </div>
                                            <div>
                                                <strong>{c.label}</strong>
                                                <span>{c.sub}</span>
                                            </div>
                                            <ExternalLink size={13} className="hc-contact-arrow" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tickets */}
                        <div className="hc-card">
                            <div className="hc-card-title"><AlertCircle size={16} color="#E03E1A" /> My Support Tickets</div>
                            <div className="hc-ticket-list">
                                {TICKETS.map((t, i) => (
                                    <div className="hc-ticket" key={i}>
                                        <div className={`hc-ticket-dot td-${t.status}`} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <strong>{t.title}</strong>
                                            <span>{t.id} · {t.time}</span>
                                        </div>
                                        <ChevronRight size={13} color="#ccc" />
                                    </div>
                                ))}
                            </div>
                            <button className="hc-view-all">
                                View all tickets <ChevronRight size={13} />
                            </button>
                        </div>

                        {/* Announcement */}
                        <div className="hc-announce">
                            <div className="hc-announce-label"><Bell size={10} /> What's New</div>
                            <h4>Promotions v2 is live!</h4>
                            <p>Stackable coupons, spend-based tiers, and a new campaign analytics dashboard are now available.</p>
                            <button className="hc-announce-btn">
                                Read release notes <ChevronRight size={13} />
                            </button>
                        </div>

                        {/* Tips */}
                        <div className="hc-card">
                            <div className="hc-card-title"><Zap size={16} color="#E03E1A" /> Pro Tips</div>
                            <div className="hc-tips">
                                {TIPS.map((tip, i) => (
                                    <div className="hc-tip" key={i}><Zap size={13} /><span>{tip}</span></div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorHelpCenter;