import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAdminDashboardStats } from '../../api/api';
import './Adminanalytics.css';
import {
    BarChart2, Truck, Percent, CreditCard, ShoppingCart,
    Users, TrendingUp, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Download,
} from 'lucide-react';
import { exportCSV } from './VendorShared';

/* ══════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════ */
const fmtCurrency = v => `Rs.${Number(v || 0).toLocaleString('en-IN')}`;
const fmtNum      = v => Number(v || 0).toLocaleString('en-IN');

const buildOrderStatus = (stats) => {
    const items = [
        { label: 'Delivered',  count: stats.deliveredOrders   || 0, color: '#10b981' },
        { label: 'Processing', count: stats.processingOrders  || 0, color: '#6366f1' },
        { label: 'Shipped',    count: stats.shippedOrders     || 0, color: '#3b82f6' },
        { label: 'Cancelled',  count: stats.cancelledOrders   || 0, color: '#ef4444' },
        { label: 'Returned',   count: stats.returnedOrders    || 0, color: '#f59e0b' },
        { label: 'Pending',    count: stats.pendingOrders     || 0, color: '#94a3b8' },
    ];
    const total = items.reduce((s, o) => s + o.count, 0) || 1;
    return items.map(o => ({ ...o, pct: Math.round((o.count / total) * 100) }));
};

const PAGE = 5;

/* ── Helpers ── */
const rankBadge   = i => i===0?{bg:'#fef9c3',color:'#92400e',b:'#fde68a'}:i===1?{bg:'#f3f4f6',color:'#374151',b:'#d1d5db'}:i===2?{bg:'#fff7ed',color:'#9a3412',b:'#fed7aa'}:{bg:'#f5f5f5',color:'#aaa',b:'#e5e5e5'};
const statusStyle = s => s==='Paid'?{bg:'#dcfce7',color:'#16a34a'}:s==='Pending'?{bg:'#fef3c7',color:'#d97706'}:{bg:'#fee2e2',color:'#dc2626'};
const tierStyle   = t => t==='Enterprise'?{bg:'#dbeafe',color:'#2563eb'}:t==='Premium'?{bg:'#ede9fe',color:'#7c3aed'}:{bg:'#f5f5f5',color:'#555'};

/* ══════════════════════════════════════════════════
   LINE CHART
══════════════════════════════════════════════════ */
const LineChart = ({ data, labels }) => {
    const [tip, setTip] = useState(null);
    const W=740, H=200, PL=52, PR=20, PT=20, PB=40;
    const IW = W-PL-PR, IH = H-PT-PB;
    const safeData = (data || []).filter(v => v != null && !Number.isNaN(Number(v)));

    if (safeData.length < 2) {
        const yTicks = [0,0.25,0.5,0.75,1].map(f => ({ y: PT+IH - f*IH, v: 0 }));
        return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:220, overflow:'visible' }}>
                {yTicks.map((t,i) => (
                    <line key={i} x1={PL} y1={t.y} x2={W-PR} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
                ))}
                <text x={W/2} y={H/2} textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="Plus Jakarta Sans, sans-serif">
                    No data available
                </text>
            </svg>
        );
    }

    const mn  = Math.min(...safeData)*0.88;
    const mx  = Math.max(...safeData)*1.06;
    const range = mx - mn || 1;
    const tx  = i => PL + i*(IW/(safeData.length-1));
    const ty  = v => PT + IH - ((v-mn)/range)*IH;
    const pts = safeData.map((v,i)=>[tx(i),ty(v)]);

    let path = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i=0;i<pts.length-1;i++){
        const [x0,y0]=pts[i],[x1,y1]=pts[i+1],cpx=(x0+x1)/2;
        path += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    const area = path + ` L ${pts[pts.length-1][0]} ${H-PB} L ${PL} ${H-PB} Z`;

    const yTicks = [0,0.25,0.5,0.75,1].map(f => ({
        y: PT+IH - f*IH,
        v: Math.round((mn + f*(mx-mn))/1000),
    }));

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:220, overflow:'visible' }}>
            <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#64748b" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#64748b" stopOpacity="0.01" />
                </linearGradient>
            </defs>
            {yTicks.map((t,i) => (
                <g key={i}>
                    <line x1={PL} y1={t.y} x2={W-PR} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={PL-8} y={t.y+4} textAnchor="end" fontSize="11" fill="#94a3b8" fontFamily="Plus Jakarta Sans, sans-serif">
                        {t.v}k
                    </text>
                </g>
            ))}
            <path d={area} fill="url(#areaFill)" />
            <path d={path} fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x,y],i)=>(
                <circle key={i} cx={x} cy={y} r={tip?.i===i ? 5.5 : 3.5}
                    fill="#fff" stroke="#1e293b" strokeWidth="2"
                    style={{ cursor:'pointer', transition:'r 0.12s' }}
                    onMouseEnter={()=>setTip({i,x,y,v:data[i]})}
                    onMouseLeave={()=>setTip(null)} />
            ))}
            {tip && (
                <g>
                    <rect x={tip.x-40} y={tip.y-36} width="80" height="24" rx="6" fill="#1e293b" />
                    <text x={tip.x} y={tip.y-20} textAnchor="middle" fill="#fff" fontSize="11.5"
                        fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                        Rs.{tip.v.toLocaleString()}
                    </text>
                </g>
            )}
            {labels.map((l,i)=>(
                <text key={i} x={tx(i)} y={H-6} textAnchor="middle" fontSize="11"
                    fill="#94a3b8" fontFamily="Plus Jakarta Sans, sans-serif">{l}</text>
            ))}
        </svg>
    );
};

/* ══════════════════════════════════════════════════
   DONUT CHART
══════════════════════════════════════════════════ */
const DonutChart = ({ data }) => {
    const [hov, setHov] = useState(null);
    const SIZE=180, R=SIZE/2, r=R*0.65, cx=R, cy=R;
    const tot = data.reduce((s,d)=>s+d.pct,0);
    let cum=0;
    const pt=(cx,cy,r,deg)=>{ const a=(deg-90)*Math.PI/180; return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}; };
    const segs = data.map(d=>{
        const s=(cum/tot)*360, e=((cum+=d.pct)/tot)*360;
        const g=1.8, sa=s+g/2, ea=e-g/2;
        const p1=pt(cx,cy,r,sa),p2=pt(cx,cy,r,ea);
        const i1=pt(cx,cy,R*0.35,sa),i2=pt(cx,cy,R*0.35,ea);
        const la=ea-sa>180?1:0;
        return {...d,path:`M${p1.x} ${p1.y} A${r} ${r} 0 ${la} 1 ${p2.x} ${p2.y} L${i2.x} ${i2.y} A${R*0.35} ${R*0.35} 0 ${la} 0 ${i1.x} ${i1.y}Z`};
    });

    return (
        <div className="aa-donut-wrap">
            <div style={{ position:'relative', width:SIZE, height:SIZE, flexShrink:0 }}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                    {segs.map((seg,i)=>(
                        <path key={i} d={seg.path} fill={seg.color}
                            opacity={hov===null||hov===i?1:0.3}
                            style={{ cursor:'pointer', transition:'opacity 0.18s' }}
                            onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} />
                    ))}
                </svg>
                <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
                    <div style={{ fontSize:'1.1rem',fontWeight:800,color:'#111',lineHeight:1 }}>
                        {hov!==null ? `${data[hov].pct}%` : data.length > 0 ? 'Total' : '—'}
                    </div>
                    <div style={{ fontSize:'0.65rem',color:'#94a3b8',marginTop:3,fontWeight:500 }}>
                        {hov!==null ? data[hov].label : 'Revenue'}
                    </div>
                </div>
            </div>
            <div className="aa-donut-legend">
                {data.map((d,i)=>(
                    <div key={i} className="aa-donut-legend-item"
                        style={{ opacity: hov===null||hov===i?1:0.35 }}
                        onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
                        <span className="aa-donut-dot" style={{ background: d.color }} />
                        <span className="aa-donut-label">{d.label}</span>
                        <span className="aa-donut-pct">{d.pct*4}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════
   PAGINATION ROW
══════════════════════════════════════════════════ */
const PagRow = ({ page, total, onPrev, onNext }) => (
    <div className="aa-pag">
        <span className="aa-pag-info">
            {page*PAGE+1}–{Math.min((page+1)*PAGE,total)} of {total}
        </span>
        <div className="aa-pag-ctrl">
            <button className="aa-pag-btn" onClick={onPrev} disabled={page===0}>
                <ChevronLeft size={13}/>
            </button>
            <span className="aa-pag-label">{page+1} / {Math.ceil(total/PAGE)}</span>
            <button className="aa-pag-btn" onClick={onNext} disabled={(page+1)*PAGE>=total}>
                <ChevronRight size={13}/>
            </button>
        </div>
    </div>
);

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const AdminAnalytics = () => {
    const [range,      setRange]      = useState('year');
    const [chartMode,  setChartMode]  = useState('week');
    const [vendorPage, setVendorPage] = useState(0);
    const [prodPage,   setProdPage]   = useState(0);
    const [stats,      setStats]      = useState(null);
    const [loading,    setLoading]    = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await getAdminDashboardStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to load dashboard stats:', err);
                toast.error('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const chartData   = chartMode==='week' ? (stats?.weeklyRevenue || []) : (stats?.monthlyRevenue || []);
    const chartLabels = chartMode==='week' ? (stats?.weeklyLabels || []) : (stats?.monthlyLabels || []);
    const vSlice = (stats?.topVendors || []).slice(vendorPage*PAGE,(vendorPage+1)*PAGE);
    const pSlice = (stats?.topProducts || []).slice(prodPage*PAGE,(prodPage+1)*PAGE);

    const s = stats || {};

    const KPI_TOP = [
        { label: 'Total Revenue',     value: fmtCurrency(s.totalRevenue),  Icon: BarChart2  },
        { label: 'Total Vendors',     value: fmtNum(s.totalVendors),       Icon: Truck      },
        { label: 'Total Products',    value: fmtNum(s.totalProducts),      Icon: Percent    },
        { label: 'Total Customers',   value: fmtNum(s.totalCustomers),     Icon: CreditCard },
    ];
    const KPI_BTM = [
        { label: 'Total Orders',      value: fmtNum(s.totalOrders),        Icon: ShoppingCart },
        { label: 'Today Orders',      value: fmtNum(s.todayOrders),        Icon: Users        },
        { label: 'Today Revenue',     value: fmtCurrency(s.todayRevenue),  Icon: TrendingUp   },
        { label: 'Pending Reviews',   value: fmtNum(s.pendingReviews),     Icon: BarChart2    },
    ];

    const orderStatus = stats ? buildOrderStatus(stats) : [];
    const totalOrders = orderStatus.reduce((sum, o) => sum + o.count, 0);

    if (loading) {
        return (
            <div className="aa-page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
                <p style={{ color:'#64748b', fontSize:'1rem' }}>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="aa-page">

            {/* ─── Header ─────────────────────────────────────── */}
            <div className="aa-header">
                <div>
                    <h2 className="aa-title">Analytics & Insights</h2>
                    <p className="aa-subtitle">Complete platform performance — revenue, vendors, products, orders and customers.</p>
                </div>
                <div className="aa-header-right">
                    <div className="aa-pills">
                        {['Today','Week','Month','Year'].map(p=>(
                            <button key={p} className={`aa-pill${range===p.toLowerCase()?' is-active':''}`}
                                onClick={()=>setRange(p.toLowerCase())}>{p}</button>
                        ))}
                    </div>
                    <button className="aa-export-btn" onClick={() => exportCSV([['Metric','Value'],['Total Revenue',s.totalRevenue],['Total Vendors',s.totalVendors],['Total Products',s.totalProducts],['Total Customers',s.totalCustomers],['Total Orders',s.totalOrders],['Today Orders',s.todayOrders],['Today Revenue',s.todayRevenue],['Pending Reviews',s.pendingReviews]],'analytics.csv')}>
                        <Download size={14}/> Export CSV
                    </button>
                </div>
            </div>

            {/* ─── KPI Row 1 ──────────────────────────────────── */}
            <div className="aa-kpi-grid">
                {KPI_TOP.map((k,i) => (
                    <div key={i} className="aa-stat-card">
                        <div className="aa-stat-top">
                            <div className="aa-stat-icon">
                                <k.Icon size={20} color="#64748b" strokeWidth={1.8} />
                            </div>
                        </div>
                        <div className="aa-stat-label">{k.label}</div>
                        <div className="aa-stat-value">{k.value}</div>
                    </div>
                ))}
            </div>

            {/* ─── KPI Row 2 ──────────────────────────────────── */}
            <div className="aa-kpi-grid">
                {KPI_BTM.map((k,i) => (
                    <div key={i} className="aa-stat-card">
                        <div className="aa-stat-top">
                            <div className="aa-stat-icon">
                                <k.Icon size={20} color="#64748b" strokeWidth={1.8} />
                            </div>
                        </div>
                        <div className="aa-stat-label">{k.label}</div>
                        <div className="aa-stat-value">{k.value}</div>
                    </div>
                ))}
            </div>

            {/* ─── Sales Chart + Donut ────────────────────────── */}
            <div className="aa-chart-row">

                {/* Line chart */}
                <div className="aa-card">
                    <div className="aa-card-head">
                        <div>
                            <p className="aa-card-title">Sales Analytics</p>
                            <p className="aa-card-sub">Revenue growth over time</p>
                        </div>
                        <div className="aa-card-head-right">
                            <div className="aa-chart-pills">
                                {['week','month'].map(m=>(
                                    <button key={m} className={`aa-chart-pill${chartMode===m?' is-active':''}`}
                                        onClick={()=>setChartMode(m)}>
                                        {m==='week'?'Last 7 Days':'Monthly'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <LineChart data={chartData} labels={chartLabels} />
                </div>

                {/* Donut */}
                <div className="aa-card">
                    <p className="aa-card-title">Revenue by Category</p>
                    <p className="aa-card-sub" style={{ marginBottom: 24 }}>Sales split by category</p>
                    <DonutChart data={stats?.categoryDonut || []} />
                </div>
            </div>

            {/* ─── Order Status ────────────────────────────────── */}
            <div className="aa-card">
                <div className="aa-card-head">
                    <div>
                        <p className="aa-card-title">Order Status Breakdown</p>
                        <p className="aa-card-sub">Distribution across all {fmtNum(totalOrders)} orders</p>
                    </div>
                    <Link to="/admin/orders" className="aa-view-link">
                        View All Orders <ArrowUpRight size={14}/>
                    </Link>
                </div>

                {/* Stacked bar */}
                <div className="aa-status-bar">
                    {orderStatus.map((o,i)=>(
                        <div key={i} style={{ width:`${o.pct}%`, background:o.color }} title={`${o.label}: ${o.pct}%`} />
                    ))}
                </div>

                <div className="aa-status-grid">
                    {orderStatus.map((o,i)=>(
                        <div key={i} className="aa-status-item">
                            <div className="aa-status-item-head">
                                <span className="aa-status-dot" style={{ background: o.color }} />
                                <span className="aa-status-name">{o.label}</span>
                            </div>
                            <div className="aa-status-count">{o.count.toLocaleString()}</div>
                            <div className="aa-status-pct">{o.pct}% of total</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Top Vendors ────────────────────────────────── */}
            <div className="aa-card">
                <div className="aa-card-head">
                    <div>
                        <p className="aa-card-title">Top Selling Vendors</p>
                        <p className="aa-card-sub">Ranked by revenue this year</p>
                    </div>
                    <Link to="/admin/vendors" className="aa-manage-btn">
                        Manage Vendors <ArrowUpRight size={13}/>
                    </Link>
                </div>
                <div className="aa-table-wrap">
                    <table className="aa-table">
                        <thead>
                            <tr>
                                {['#','Vendor','Revenue','Orders','Growth','Tier'].map((h,i)=>(
                                    <th key={i}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {vSlice.map((v,i)=>{
                                const idx = vendorPage*PAGE+i;
                                const rb  = rankBadge(idx);
                                const tb  = tierStyle(v.tier);
                                return (
                                    <tr key={i}>
                                        <td>
                                            <div className="aa-rank-badge" style={{ background:rb.bg, color:rb.color, border:`1px solid ${rb.b}` }}>
                                                {idx+1}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="aa-vendor-cell">
                                                <div className="aa-vendor-avatar">{v.name?.charAt(0)}</div>
                                                <span style={{ fontWeight:600, color:'#0f172a' }}>{v.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight:700, color:'#0f172a' }}>{v.rev}</td>
                                        <td style={{ color:'#64748b' }}>{v.orders}</td>
                                        <td>
                                            <span className="aa-pill-badge" style={{ background:'#dcfce7', color:'#16a34a' }}>
                                                {v.growth}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="aa-pill-badge" style={{ background:tb.bg, color:tb.color }}>
                                                {v.tier}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <PagRow page={vendorPage} total={(stats?.topVendors || []).length}
                    onPrev={()=>setVendorPage(p=>p-1)} onNext={()=>setVendorPage(p=>p+1)} />
            </div>

            {/* ─── Top Products ───────────────────────────────── */}
            <div className="aa-card">
                <div className="aa-card-head">
                    <div>
                        <p className="aa-card-title">Top Selling Products</p>
                        <p className="aa-card-sub">Best performers by units sold</p>
                    </div>
                    <Link to="/admin/products" className="aa-manage-btn">
                        Manage Products <ArrowUpRight size={13}/>
                    </Link>
                </div>
                <div className="aa-table-wrap">
                    <table className="aa-table">
                        <thead>
                            <tr>
                                {['#','Product','Vendor','Units Sold','Revenue','Stock'].map((h,i)=>(
                                    <th key={i}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pSlice.map((p,i)=>{
                                const idx = prodPage*PAGE+i;
                                const rb  = rankBadge(idx);
                                return (
                                    <tr key={i}>
                                        <td>
                                            <div className="aa-rank-badge" style={{ background:rb.bg, color:rb.color, border:`1px solid ${rb.b}` }}>
                                                {idx+1}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight:600, color:'#0f172a' }}>{p.name}</td>
                                        <td style={{ color:'#64748b' }}>{p.vendor}</td>
                                        <td style={{ fontWeight:700, color:'#0f172a' }}>{p.sales}</td>
                                        <td style={{ fontWeight:700, color:'#0f172a' }}>{p.revenue}</td>
                                        <td>
                                            <span className="aa-pill-badge" style={{
                                                background: p.stock<30?'#fef3c7':'#dcfce7',
                                                color: p.stock<30?'#d97706':'#16a34a',
                                            }}>
                                                {p.stock<30?`Low ${p.stock}`:p.stock}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <PagRow page={prodPage} total={(stats?.topProducts || []).length}
                    onPrev={()=>setProdPage(p=>p-1)} onNext={()=>setProdPage(p=>p+1)} />
            </div>

            {/* ─── Recent Payouts ─────────────────────────────── */}
            <div className="aa-card">
                <div className="aa-card-head">
                    <div>
                        <p className="aa-card-title">Recent Payouts</p>
                        <p className="aa-card-sub">Latest vendor payout transactions</p>
                    </div>
                    <Link to="/admin/payouts" className="aa-view-link">
                        View All <ArrowUpRight size={13}/>
                    </Link>
                </div>
                <div>
                    {stats?.recentPayouts?.length > 0 ? stats.recentPayouts.map((p,i)=>{
                        const sc = statusStyle(p.status);
                        return (
                            <div key={i} className="aa-payout-item">
                                <div className="aa-payout-avatar">{p.vendor.charAt(0)}</div>
                                <div className="aa-payout-info">
                                    <div className="aa-payout-name">{p.vendor}</div>
                                    <div className="aa-payout-meta">{p.date} · {p.method}</div>
                                </div>
                                <div className="aa-payout-right">
                                    <div className="aa-payout-amount">{p.amount}</div>
                                    <span className="aa-pill-badge" style={{ background:sc.bg, color:sc.color }}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                        );
                    }) : <p style={{ textAlign:'center', padding:24, color:'#94a3b8', fontSize:'0.85rem' }}>No payouts yet</p>}
                </div>
            </div>

        </div>
    );
};

export default AdminAnalytics;
