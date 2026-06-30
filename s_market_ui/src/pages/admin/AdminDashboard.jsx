import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './AdminDashboard.css';
import { getAdminDashboardStats } from '../../api/api';
import {
    ArrowUpRight, TrendingUp, DollarSign, ShoppingCart, Store,
    Users, Clock, RefreshCw, Ticket, CheckCircle, Package,
    CreditCard, ShieldCheck, UserPlus, Tag, Zap, BarChart2, Loader,
} from 'lucide-react';

/* ══ HELPERS ═══════════════════════════════════════ */
const fmtCurrency = (v) => {
    if (v == null) return 'Rs.0';
    return 'Rs.' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const fmtNum = (v) => {
    if (v == null) return '0';
    return Number(v).toLocaleString('en-IN');
};

const QUICK_ACTIONS = [
    { label: 'Add Product', to: '/admin/products', Icon: Package, color: '#16a34a', bg: '#dcfce7' },
    { label: 'View Orders', to: '/admin/orders', Icon: ShoppingCart, color: '#2563eb', bg: '#dbeafe' },
    { label: 'Manage Users', to: '/admin/users', Icon: Users, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Analytics', to: '/admin/analytics', Icon: BarChart2, color: '#d97706', bg: '#fef3c7' },
];

/* ── Helpers ── */
const rankStyle = i => i === 0
    ? { bg: '#fef9c3', color: '#92400e', border: '#fde68a' }
    : i === 1 ? { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
    : i === 2 ? { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' }
    : { bg: '#f5f5f5', color: '#888', border: '#e5e5e5' };

/* ══ LINE CHART ══════════════════════════════ */
const LineChart = ({ data, labels, color = '#E03E1A', height = 180 }) => {
    const [tip, setTip] = useState(null);
    const safeData = (data || []).filter(v => v != null && !Number.isNaN(Number(v)));
    if (safeData.length < 2) return null;
    const W = 700, H = height, P = 22;
    const mn = Math.min(...safeData) * 0.82, mx = Math.max(...safeData) * 1.06;
    const range = mx - mn || 1;
    const tx = i => P + i * ((W - P*2) / (safeData.length - 1));
    const ty = v => H - P - ((v - mn) / range) * (H - P*2);
    const pts = safeData.map((v,i) => [tx(i), ty(v)]);
    let ln = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length-1; i++) {
        const [x0,y0] = pts[i], [x1,y1] = pts[i+1], mx2 = (x0+x1)/2;
        ln += ` C ${mx2} ${y0}, ${mx2} ${y1}, ${x1} ${y1}`;
    }
    const ar = ln + ` L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`;
    return (
        <div style={{ position: 'relative' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, overflow: 'visible' }}>
                <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.12" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0.2, 0.5, 0.8].map((f,i) => (
                    <line key={i} x1={P} y1={P+f*(H-P*2)} x2={W-P} y2={P+f*(H-P*2)}
                        stroke="#f0f0f0" strokeWidth="1" strokeDasharray="5 5" />
                ))}
                <path d={ar} fill="url(#dashGrad)" />
                <path d={ln} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r={tip?.i===i ? 6 : 4}
                        fill="#fff" stroke={color} strokeWidth="2.5" style={{ cursor: 'pointer', transition: 'r 0.12s' }}
                        onMouseEnter={() => setTip({i,x,y,v:data[i]})} onMouseLeave={() => setTip(null)} />
                ))}
                {tip && (
                    <g>
                        <rect x={tip.x-44} y={tip.y-36} width="88" height="26" rx="6" fill="#111" />
                        <text x={tip.x} y={tip.y-19} textAnchor="middle" fill="#fff"
                            fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                            Rs.{tip.v.toLocaleString()}
                        </text>
                    </g>
                )}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                {labels.map((l,i) => (
                    <span key={i} style={{ fontSize: '0.67rem', color: '#bbb', fontWeight: 600, flex: 1, textAlign: 'center' }}>{l}</span>
                ))}
            </div>
        </div>
    );
};

/* ══ DONUT ═══════════════════════════════════ */
const Donut = ({ data, size = 130, center, sub }) => {
    const [hov, setHov] = useState(null);
    const R = size/2, r = R*0.63, cx = R, cy = R;
    const tot = data.reduce((s,d) => s + d.pct, 0) || 1;
    let cum = 0;
    const pt = (cx,cy,r,deg) => {
        const rad = (deg-90)*Math.PI/180;
        return { x: cx+r*Math.cos(rad), y: cy+r*Math.sin(rad) };
    };
    const segs = data.map(d => {
        const s = (cum/tot)*360, e = ((cum+=d.pct)/tot)*360;
        const g=1.8, sa=s+g/2, ea=e-g/2;
        const p1=pt(cx,cy,r,sa), p2=pt(cx,cy,r,ea);
        const i1=pt(cx,cy,R*0.36,sa), i2=pt(cx,cy,R*0.36,ea);
        const la=ea-sa>180?1:0;
        return { ...d, path:`M${p1.x} ${p1.y} A${r} ${r} 0 ${la} 1 ${p2.x} ${p2.y} L${i2.x} ${i2.y} A${R*0.36} ${R*0.36} 0 ${la} 0 ${i1.x} ${i1.y}Z` };
    });
    return (
        <div className="ad-donut-wrap">
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {segs.map((seg,i) => (
                        <path key={i} d={seg.path} fill={seg.color}
                            opacity={hov===null||hov===i?1:0.3}
                            style={{ cursor: 'pointer', transition: 'opacity 0.18s' }}
                            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
                    ))}
                </svg>
                <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
                    <div style={{ fontSize:'1rem',fontWeight:800,color:'#111',lineHeight:1 }}>
                        {hov!==null?`${data[hov].pct}%`:center}
                    </div>
                    <div style={{ fontSize:'0.6rem',color:'#bbb',marginTop:2,fontWeight:600 }}>
                        {hov!==null?data[hov].label:sub}
                    </div>
                </div>
            </div>
            <div className="ad-donut-legend">
                {data.map((d,i) => (
                    <div key={i} className="ad-donut-legend-item"
                        style={{ opacity: hov===null||hov===i ? 1 : 0.35 }}
                        onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
                        <span className="ad-donut-legend-dot" style={{ background: d.color }} />
                        <span className="ad-donut-legend-label">{d.label}</span>
                        <span className="ad-donut-legend-pct">{d.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ══ ADMIN DASHBOARD ════════════════════════ */
const AdminDashboard = () => {
    const [period, setPeriod] = useState('today');
    const [chart,  setChart]  = useState('week');
    const [dashStats, setDashStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const chartData   = chart === 'week' ? (dashStats?.weeklyRevenue || []) : (dashStats?.monthlyRevenue || []);
    const chartLabels = chart === 'week' ? (dashStats?.weeklyLabels || []) : (dashStats?.monthlyLabels || []);

    useEffect(() => {
        let cancelled = false;
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await getAdminDashboardStats();
                if (!cancelled) setDashStats(data);
            } catch (err) {
                console.error('Failed to load dashboard stats:', err);
                if (!cancelled) toast.error('Failed to load dashboard statistics');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchStats();
        return () => { cancelled = true; };
    }, []);

    /* Build stats cards from API data (fallback to dashes while loading) */
    const stats = dashStats ? [
        { label: "Today's Revenue",   value: fmtCurrency(dashStats.todayRevenue),   change: `${fmtNum(dashStats.todayOrders)} today`, up: true,  Icon: DollarSign,   color: '#16a34a', bg: '#dcfce7' },
        { label: 'Total Orders',      value: fmtNum(dashStats.totalOrders),          change: `${fmtNum(dashStats.pendingOrders)} pending`, up: true,  Icon: ShoppingCart, color: '#2563eb', bg: '#dbeafe' },
        { label: 'Total Vendors',     value: fmtNum(dashStats.totalVendors),         change: '',            up: true,  Icon: Store,        color: '#7c3aed', bg: '#ede9fe' },
        { label: 'Total Customers',   value: fmtNum(dashStats.totalCustomers),       change: '',            up: true,  Icon: Users,        color: '#d97706', bg: '#fef3c7' },
        { label: 'Total Revenue',     value: fmtCurrency(dashStats.totalRevenue),    change: '',            up: true,  Icon: TrendingUp,   color: '#16a34a', bg: '#dcfce7' },
        { label: 'Total Products',    value: fmtNum(dashStats.totalProducts),        change: '',            up: null,  Icon: Package,      color: '#d97706', bg: '#fef3c7' },
        { label: 'Total Reviews',     value: fmtNum(dashStats.totalReviews),         change: `${fmtNum(dashStats.pendingReviews)} pending`, up: true,  Icon: RefreshCw,    color: '#dc2626', bg: '#fee2e2' },
        { label: 'Shipped Orders',    value: fmtNum(dashStats.shippedOrders),        change: `${fmtNum(dashStats.processingOrders)} processing`, up: null, Icon: Ticket,       color: '#7c3aed', bg: '#ede9fe' },
    ] : [
        { label: "Today's Revenue",   value: '—', change: '', up: null, Icon: DollarSign,   color: '#16a34a', bg: '#dcfce7' },
        { label: 'Total Orders',      value: '—', change: '', up: null, Icon: ShoppingCart, color: '#2563eb', bg: '#dbeafe' },
        { label: 'Total Vendors',     value: '—', change: '', up: null, Icon: Store,        color: '#7c3aed', bg: '#ede9fe' },
        { label: 'Total Customers',   value: '—', change: '', up: null, Icon: Users,        color: '#d97706', bg: '#fef3c7' },
        { label: 'Total Revenue',     value: '—', change: '', up: null, Icon: TrendingUp,   color: '#16a34a', bg: '#dcfce7' },
        { label: 'Total Products',    value: '—', change: '', up: null, Icon: Package,      color: '#d97706', bg: '#fef3c7' },
        { label: 'Total Reviews',     value: '—', change: '', up: null, Icon: RefreshCw,    color: '#dc2626', bg: '#fee2e2' },
        { label: 'Shipped Orders',    value: '—', change: '', up: null, Icon: Ticket,       color: '#7c3aed', bg: '#ede9fe' },
    ];

    /* Build order status donut from API data */
    const orderStatusData = (() => {
        if (!dashStats) return [
            { label: 'Delivered',  pct: 0, color: '#16a34a' },
            { label: 'Processing', pct: 0, color: '#2563eb' },
            { label: 'Cancelled',  pct: 0, color: '#dc2626' },
            { label: 'Returned',   pct: 0, color: '#d97706' },
            { label: 'Pending',    pct: 0, color: '#7c3aed' },
            { label: 'Shipped',    pct: 0, color: '#0891b2' },
        ];
        const total = dashStats.totalOrders || 1; // avoid division by zero
        const toPct = (v) => Math.round(((v || 0) / total) * 100);
        return [
            { label: 'Delivered',  pct: toPct(dashStats.deliveredOrders),   color: '#16a34a' },
            { label: 'Processing', pct: toPct(dashStats.processingOrders),  color: '#2563eb' },
            { label: 'Cancelled',  pct: toPct(dashStats.cancelledOrders),   color: '#dc2626' },
            { label: 'Returned',   pct: toPct(dashStats.returnedOrders),    color: '#d97706' },
            { label: 'Pending',    pct: toPct(dashStats.pendingOrders),     color: '#7c3aed' },
            { label: 'Shipped',    pct: toPct(dashStats.shippedOrders),     color: '#0891b2' },
        ].filter(s => s.pct > 0);
    })();

    const totalOrdersForDonut = dashStats ? fmtNum(dashStats.totalOrders) : '—';

    if (loading) {
        return (
            <div className="ad-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader size={32} className="ad-spinner" style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="ad-page">

            {/* ── Header ── */}
            <div className="ad-header">
                <div className="ad-title-block">
                    <h2 className="ad-title">Administration Dashboard</h2>
                    <p className="ad-subtitle">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <div className="ad-period-pills">
                    {['today','week','month','year'].map(p => (
                        <button key={p} className={`ad-period-btn${period===p?' is-active':''}`} onClick={()=>setPeriod(p)}>
                            {p.charAt(0).toUpperCase()+p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stats 4+4 grid ── */}
            <div className="ad-stats-grid">
                {stats.map((s,i) => (
                    <div key={i} className="ad-stat-card">
                        <div className="ad-stat-top">
                            <div className="ad-stat-icon" style={{ background: s.bg }}>
                                <s.Icon size={17} color={s.color} strokeWidth={2.2} />
                            </div>
                            {s.change && (
                                <span className={`ad-stat-badge ad-stat-badge--${s.up===true?'up':s.up===false?'down':'neutral'}`}>
                                    {s.change}
                                </span>
                            )}
                        </div>
                        <div>
                            <div className="ad-stat-value">{s.value}</div>
                            <div className="ad-stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Pending Tasks ── */}
            <div className="ad-card">
                <div className="ad-card-header">
                    <div>
                        <p className="ad-card-title">Pending Tasks</p>
                        <p className="ad-card-sub">Items needing immediate attention</p>
                    </div>
                    <div className="ad-card-header-right">
                        <Link to="/admin/analytics" className="ad-btn-analytics">
                            <BarChart2 size={13} /> Full Analytics
                        </Link>
                    </div>
                </div>
                <div className="ad-pending-grid">
                    {(dashStats?.pendingTasks || []).map((t,i) => (
                        <Link key={i} to={t.to} className="ad-pending-item"
                            style={{ background: t.bg, border: `1px solid ${t.color}20` }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 8px 20px ${t.color}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; }}>
                            <div className="ad-pending-count" style={{ color: t.color }}>{t.count}</div>
                            <div className="ad-pending-label" style={{ color: t.color }}>{t.label}</div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="ad-card">
                <div className="ad-card-header">
                    <div>
                        <p className="ad-card-title">Quick Actions</p>
                        <p className="ad-card-sub">Jump to common tasks instantly</p>
                    </div>
                </div>
                <div className="ad-quick-actions">
                    {QUICK_ACTIONS.map((q,i) => (
                        <Link key={i} to={q.to} className="ad-quick-btn"
                            onMouseEnter={e => { e.currentTarget.style.background=q.bg; e.currentTarget.style.borderColor=q.color+'44'; e.currentTarget.style.color=q.color; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#fafafa'; e.currentTarget.style.borderColor='#efefef'; e.currentTarget.style.color='#333'; }}>
                            <div className="ad-quick-icon" style={{ background: q.bg }}>
                                <q.Icon size={13} color={q.color} strokeWidth={2.3} />
                            </div>
                            {q.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Sales Chart ── */}
            <div className="ad-card">
                <div className="ad-card-header">
                    <div>
                        <p className="ad-card-title">Sales Performance</p>
                        <p className="ad-card-sub">Revenue growth over time</p>
                    </div>
                    <div className="ad-card-header-right">
                        <div className="ad-chart-pills">
                            {['week','month'].map(m => (
                                <button key={m} className={`ad-chart-btn${chart===m?' is-active':''}`} onClick={()=>setChart(m)}>
                                    {m.charAt(0).toUpperCase()+m.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {chartData.length > 0 ? (
                    <>
                        <LineChart data={chartData} labels={chartLabels} color="#E03E1A" height={180} />
                        <div className="ad-chart-legend">
                            {[
                                { label: chart==='week'?'This Week — Rs.'+(chartData.length ? chartData.reduce((a,b)=>a+b,0).toLocaleString() : '0'):'This Year — Rs.'+(chartData.length ? chartData.reduce((a,b)=>a+b,0).toLocaleString() : '0'), color:'#E03E1A' },
                                { label: '—', color:'#ddd' },
                            ].map((l,i) => (
                                <div key={i} className="ad-chart-legend-item">
                                    <span className="ad-chart-legend-dot" style={{ background: l.color }} />
                                    {l.label}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign:'center', padding:'40px 0', color:'#aaa', fontWeight:600, fontSize:'0.85rem' }}>
                        Data loads from backend
                    </div>
                )}
            </div>

            {/* ── Order Status + Revenue by Category ── */}
            <div className="ad-two-col">
                <div className="ad-card">
                    <div className="ad-card-header">
                        <div>
                            <p className="ad-card-title">Order Status</p>
                            <p className="ad-card-sub">All {totalOrdersForDonut} orders breakdown</p>
                        </div>
                        <Link to="/admin/orders" className="ad-link">
                            View All <ArrowUpRight size={13} />
                        </Link>
                    </div>
                    <Donut data={orderStatusData.length > 0 ? orderStatusData : [{ label: 'No Data', pct: 100, color: '#e5e5e5' }]} size={160} center={totalOrdersForDonut} sub="Orders" />
                </div>
                <div className="ad-card">
                    <div className="ad-card-header">
                        <div>
                            <p className="ad-card-title">Revenue by Category</p>
                            <p className="ad-card-sub">Category-wise sales split</p>
                        </div>
                        <Link to="/admin/analytics" className="ad-link">
                            Analytics <ArrowUpRight size={13} />
                        </Link>
                    </div>
                    <Donut data={(dashStats?.categoryDonut || []).length > 0 ? dashStats.categoryDonut : [{ label: 'No Data', pct: 100, color: '#e5e5e5' }]} size={160} center={dashStats ? fmtCurrency(dashStats.totalRevenue) : '—'} sub="Revenue" />
                </div>
            </div>

            {/* ── Activity + Vendors + Products (3-col) ── */}
            <div className="ad-three-col">

                {/* Activity */}
                <div className="ad-card">
                    <p className="ad-card-title">Recent Activity</p>
                    <p className="ad-card-sub" style={{ marginBottom: 18 }}>Latest platform events</p>
                    {(dashStats?.recentActivity || []).map((a,i) => (
                        <div key={i} className="ad-activity-item">
                            <div className="ad-activity-dot" style={{ background: '#6366f1' }} />
                            <div>
                                <div className="ad-activity-text">{a.text}</div>
                                <div className="ad-activity-time">{a.time}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Top Vendors */}
                <div className="ad-card">
                    <div className="ad-card-header">
                        <p className="ad-card-title">Top Vendors</p>
                        <Link to="/admin/vendors" className="ad-link">View all</Link>
                    </div>
                    <p className="ad-card-sub" style={{ marginBottom: 18 }}>By revenue this month</p>
                    {(dashStats?.topVendors || []).map((v,i) => {
                        const rs = rankStyle(i);
                        return (
                            <div key={i} className="ad-rank-row">
                                <div className="ad-rank-num" style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{i+1}</div>
                                <div className="ad-rank-info">
                                    <div className="ad-rank-name">{v.name}</div>
                                    <div className="ad-rank-sub">{v.orders} orders · ★{v.rating}</div>
                                </div>
                                <div className="ad-rank-right">
                                    <div className="ad-rank-value">{v.sales}</div>
                                    <div className="ad-rank-growth">{v.growth}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Top Products */}
                <div className="ad-card">
                    <div className="ad-card-header">
                        <p className="ad-card-title">Top Products</p>
                        <Link to="/admin/products" className="ad-link">View all</Link>
                    </div>
                    <p className="ad-card-sub" style={{ marginBottom: 18 }}>Best performers this month</p>
                    {(dashStats?.topProducts || []).map((p,i) => {
                        const rs = rankStyle(i);
                        return (
                            <div key={i} className="ad-rank-row">
                                <div className="ad-rank-num" style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{i+1}</div>
                                <div className="ad-rank-info">
                                    <div className="ad-rank-name">{p.name}</div>
                                    <div className="ad-rank-sub">{p.vendor}</div>
                                </div>
                                <div className="ad-rank-right">
                                    <div className="ad-rank-value">{p.revenue}</div>
                                    <div className="ad-rank-muted">{p.sales} sold</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;