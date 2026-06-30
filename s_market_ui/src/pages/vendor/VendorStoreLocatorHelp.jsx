import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
import { getPublicHelpArticles, getVendorTickets, getPublicFaqs } from '../../api/api';
import './VendorStoreLocatorHelp.css';

const CATEGORY_META = {
    orders:    { icon: ShoppingBag, bg: '#f0f7ff', color: '#3b82f6', title: 'Orders & Fulfillment',   desc: 'Processing, shipping & returns' },
    payments:  { icon: CreditCard,  bg: '#f0fdf4', color: '#059669', title: 'Payments & Payouts',     desc: 'Billing, invoices & settlements' },
    promotions:{ icon: Tag,         bg: '#fff5f3', color: '#E03E1A', title: 'Promotions & Discounts', desc: 'Coupons, sales & campaigns' },
    account:   { icon: Settings,    bg: '#f5f5f5', color: '#555555', title: 'Account & Settings',     desc: 'Profile, security & preferences' },
    products:  { icon: Package,     bg: '#f8f5ff', color: '#8b5cf6', title: 'Products & Inventory',   desc: 'Listings, stock & bulk uploads' },
    analytics: { icon: BarChart2,   bg: '#fff8e1', color: '#b8860b', title: 'Analytics & Reports',    desc: 'Revenue, traffic & insights' },
};

const TIPS = [
    'Enable low-stock alerts under Settings → Notifications to avoid missed orders.',
    'Use the "Duplicate" button on any promotion to reuse settings for flash sales.',
    'Export your analytics as CSV monthly to keep an offline record for accounting.',
];

const ARTICLES_FALLBACK = [
    { icon: ShoppingBag, title: 'Complete guide to order management & fulfilment',    time: '5 min read', badge: 'popular' },
    { icon: CreditCard,  title: 'Understanding your payout breakdown and timeline',    time: '4 min read', badge: 'new'     },
    { icon: Tag,         title: 'How to set up Buy X Get Y promotions',                time: '3 min read', badge: null      },
    { icon: Package,     title: 'Bulk uploading products with a CSV file',             time: '6 min read', badge: 'updated' },
    { icon: BarChart2,   title: 'Reading your sales analytics dashboard',              time: '4 min read', badge: 'popular' },
    { icon: Bell,        title: 'Configuring order & stock alert notifications',       time: '3 min read', badge: null      },
    { icon: FileText,    title: 'Generating and exporting custom reports',             time: '5 min read', badge: null      },
    { icon: Megaphone,   title: 'Creating your first promotional campaign end-to-end', time: '7 min read', badge: 'new'     },
];

const TICKETS_FALLBACK = [
    { id: '#TKT-6614', title: 'Payout for Oct cycle not received',      status: 'open',    time: '3h ago' },
    { id: '#TKT-6598', title: 'Bulk CSV upload returning format error',  status: 'pending', time: '1d ago' },
    { id: '#TKT-6541', title: 'Coupon not applying to bundled products', status: 'closed',  time: '4d ago' },
];

/* ─── Component ─────────────────────────────────── */
const VendorHelpCenter = () => {
    const [query,      setQuery]      = useState('');
    const [openFaq,    setOpenFaq]    = useState(null);
    const [activeTab,  setActiveTab]  = useState('All');
    const [voted,      setVoted]      = useState(null);
    const [articles,   setArticles]   = useState(ARTICLES_FALLBACK);
    const [tickets,    setTickets]    = useState(TICKETS_FALLBACK);
    const [faqs,       setFaqs]       = useState([]);
    const [categories, setCategories] = useState([]);
    const [kpis,       setKpis]       = useState([]);
    const [faqTabs,    setFaqTabs]    = useState(['All']);

    useEffect(() => {
        const loadData = async () => {
            let articleResult, ticketResult, faqResult;
            try {
                [faqResult, articleResult, ticketResult] = await Promise.allSettled([
                    getPublicFaqs(),
                    getPublicHelpArticles(),
                    getVendorTickets(),
                ]);
            } catch (e) { /* ignore */ }

            if (faqResult?.status === 'fulfilled' && Array.isArray(faqResult.value) && faqResult.value.length) {
                const data = faqResult.value;
                setFaqs(data);

                const tagCount = {};
                data.forEach(f => { const t = (f.category || 'general').toLowerCase(); tagCount[t] = (tagCount[t] || 0) + 1; });
                const cats = Object.entries(tagCount).map(([tag, count]) => {
                    const meta = CATEGORY_META[tag] || { icon: BookOpen, bg: '#f0f7ff', color: '#3b82f6', title: tag.charAt(0).toUpperCase() + tag.slice(1), desc: '' };
                    return { ...meta, count, tag };
                });
                setCategories(cats);
                setFaqTabs(['All', ...Object.keys(tagCount).map(t => t.charAt(0).toUpperCase() + t.slice(1))]);

                const totalArticles = articleResult?.status === 'fulfilled' && Array.isArray(articleResult.value) ? articleResult.value.length : 0;
                const openTickets = ticketResult?.status === 'fulfilled' && Array.isArray(ticketResult.value) ? ticketResult.value.filter(t => t.status === 'open' || t.status === 'pending').length : 0;

                setKpis([
                    { label: 'Help Articles',         value: `${totalArticles || articles.length}+`, trend: `${totalArticles || articles.length} available`, trendType: 'positive', icon: BookOpen, color: 'blue' },
                    { label: 'Frequently Asked Questions', value: `${data.length}`, trend: `${data.filter(f => f.views > 0).length} with views`, trendType: 'positive', icon: Activity, color: 'green' },
                    { label: 'Open Tickets',          value: `${openTickets}`, trend: openTickets ? 'Requires attention' : 'All clear', trendType: openTickets ? 'neutral' : 'positive', icon: HelpCircle, color: 'orange' },
                ]);
            }

            if (articleResult?.status === 'fulfilled' && Array.isArray(articleResult.value) && articleResult.value.length) {
                setArticles(articleResult.value);
            }
            if (ticketResult?.status === 'fulfilled' && Array.isArray(ticketResult.value) && ticketResult.value.length) {
                setTickets(ticketResult.value);
            }
        };

        loadData();
    }, []);

    const visibleFaqs = faqs.filter(f => {
        const tag = (f.category || 'general').toLowerCase();
        return activeTab === 'All' || tag === activeTab.toLowerCase();
    });

    const popularTags = [...new Set(faqs.map(f => (f.category || 'general').toLowerCase()))].slice(0, 5);
    const popularLabels = popularTags.map(t => (CATEGORY_META[t]?.title || t.charAt(0).toUpperCase() + t.slice(1)));

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
                        <button className="hc-btn-ghost" onClick={() => toast.success('Opening all articles…')}><BookOpen size={16} /> All Articles</button>
                        <button className="hc-btn-primary" onClick={() => toast.success('Contact support ticket created')}><MessageCircle size={16} /> Contact Support</button>
                    </div>
                </div>

                {/* Hero */}
                <div className="hc-hero">
                    <div className="hc-hero-dots" />
                    <div className="hc-hero-badge"><HelpCircle size={11} /> Vendor Help Center</div>
                    <h2>What do you need help with?</h2>
                    <p className="hc-hero-sub">
                        Search {articles.length} articles covering orders, payments, promotions, and more.
                    </p>
                    <div className="hc-search-wrap">
                        <Search className="hc-search-ico" size={17} />
                        <input
                            type="text"
                            placeholder="e.g. process a refund, payout schedule, coupon setup…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <button className="hc-search-btn" onClick={() => toast.success(query ? `Searching "${query}"…` : 'Enter a search query')}>Search</button>
                    </div>
                    <div className="hc-popular-wrap">
                        <span>Popular:</span>
                        {(popularLabels.length ? popularLabels : ['Orders', 'Payments', 'Promotions', 'Account', 'Products']).map(t => (
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
                    {(kpis.length ? kpis : [
                        { label: 'Help Articles', value: `${articles.length}+`, trend: `${articles.length} available`, trendType: 'positive', icon: BookOpen, color: 'blue' },
                        { label: 'Frequently Asked Questions', value: `${faqs.length || '—'}`, trend: 'Dynamic', trendType: 'positive', icon: Activity, color: 'green' },
                        { label: 'Open Tickets', value: `${tickets.length}`, trend: tickets.length ? 'Requires attention' : 'All clear', trendType: tickets.length ? 'neutral' : 'positive', icon: HelpCircle, color: 'orange' },
                    ]).map((k, i) => {
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
                            {(categories.length ? categories : [
                                { icon: BookOpen, bg: '#f0f7ff', color: '#3b82f6', title: 'All Topics', desc: 'Browse all help categories', count: faqs.length || articles.length },
                            ]).map((cat, i) => {
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
                                    {faqTabs.map(tab => (
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
                            {visibleFaqs.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                    {faqs.length === 0 ? 'Loading FAQs…' : 'No FAQs match this category.'}
                                </div>
                            )}
                            {visibleFaqs.map((faq, i) => (
                                <div key={faq.id || i} className={`hc-faq-item${openFaq === i ? ' open' : ''}`}>
                                    <div className="hc-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                        <div className="hc-faq-q-left">
                                            <div className="hc-faq-num">{i + 1}</div>
                                            <div className="hc-faq-q-text">{faq.question}</div>
                                        </div>
                                        <ChevronDown size={16} className="hc-faq-chevron" />
                                    </div>
                                    <div className="hc-faq-answer"><p>{faq.answer}</p></div>
                                </div>
                            ))}
                        </div>

                        {/* Articles */}
                        <div className="hc-sec-lbl" style={{ marginTop: '1.5rem' }}>Featured Articles</div>
                        <div className="hc-panel">
                            {articles.map((a, i) => {
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
                                        <div className="hc-contact-item" key={i} onClick={() => toast.success(`Opening ${c.label}…`)} style={{cursor:'pointer'}}>
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
                                {tickets.map((t, i) => (
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
                            <button className="hc-view-all" onClick={() => toast.success('Opening all tickets…')}>
                                View all tickets <ChevronRight size={13} />
                            </button>
                        </div>

                        {/* Announcement */}
                        <div className="hc-announce">
                            <div className="hc-announce-label"><Bell size={10} /> What's New</div>
                            <h4>Promotions v2 is live!</h4>
                            <p>Stackable coupons, spend-based tiers, and a new campaign analytics dashboard are now available.</p>
                            <button className="hc-announce-btn" onClick={() => toast.success('Opening release notes…')}>
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