import React, { useState, useEffect } from 'react';
import './AdminPerformancemetrics.css';
import { Icon, initials, avatarBg, fmt, exportCSV } from './VendorShared';
import { getVendors, getAdminDashboardStats, getVendorPerformance } from '../../api/api';
import toast from 'react-hot-toast';

const METRICS = [
  {key:'gmv',          label:'GMV',            fmt: v => fmt(v),             good: v => v>500000, warn: v => v>100000 },
  {key:'orders',       label:'Orders',         fmt: v => v.toLocaleString(), good: v => v>800,    warn: v => v>200    },
  {key:'rating',       label:'Rating',         fmt: v => `★ ${v}`,           good: v => v>=4.5,   warn: v => v>=4.0   },
  {key:'fulfillment',  label:'Fulfillment %',  fmt: v => `${v}%`,            good: v => v>=95,    warn: v => v>=90    },
  {key:'onTime',       label:'On-Time %',      fmt: v => `${v}%`,            good: v => v>=95,    warn: v => v>=88    },
  {key:'cancels',      label:'Cancellations',  fmt: v => v,                  good: v => v<=10,    warn: v => v<=20,   invert:true },
  {key:'responseTime', label:'Resp. Time (h)', fmt: v => `${v}h`,            good: v => v<=2,     warn: v => v<=3,    invert:true },
  {key:'complaints',   label:'Complaints',     fmt: v => v,                  good: v => v<=3,     warn: v => v<=7,    invert:true },
];

const metricColor = (m, v) => {
  if (m.invert) return m.good(v) ? '#16a34a' : m.warn(v) ? '#d97706' : '#dc2626';
  return m.good(v) ? '#16a34a' : m.warn(v) ? '#d97706' : '#dc2626';
};
const metricBg = (m, v) => {
  if (m.invert) return m.good(v) ? '#f0fdf4' : m.warn(v) ? '#fffbeb' : '#fff5f5';
  return m.good(v) ? '#f0fdf4' : m.warn(v) ? '#fffbeb' : '#fff5f5';
};

const PER = 5;

function mapVendorToRow(v) {
  const store = v.stores && v.stores.length > 0 ? v.stores[0] : null;
  const fullName = v.name || v.fullName || 'Unknown';
  const storeName = store ? (store.storeName || fullName) : fullName;
  return {
    id:           `V-${v.id}`,
    name:         storeName,
    owner:        fullName,
    city:         store ? (store.city || store.address || '—') : '—',
    tier:         v.tier || 'basic',
    gmv:          v.totalRevenue || 0,
    orders:       v.orderCount || 0,
    returns:      0,
    rating:       v.rating || 0,
    fulfillment:  0,
    responseTime: 0,
    cancels:      0,
    growth:       0,
    complaints:   0,
    onTime:       0,
    status:       v.status,
  };
}

export default function PerformanceMetrics() {
  const [vendors,  setVendors]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sortBy,   setSortBy]   = useState('gmv');
  const [sortDir,  setSortDir]  = useState('desc');
  const [filter,   setFilter]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(0);
  const [selV,     setSelV]     = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [vendorRes, statsRes, perfRes] = await Promise.all([
          getVendors('', 0, 50),
          getAdminDashboardStats(),
          getVendorPerformance().catch(() => []),
        ]);
        const vendorList = vendorRes?.content || [];
        const perfList = perfRes || [];
        
        // Build performance lookup map: vendorId -> performance data
        const perfMap = {};
        perfList.forEach(p => { if (p.vendorId) perfMap[p.vendorId] = p; });
        
        // Merge performance data into vendor rows
        const merged = vendorList.map(v => {
          const base = mapVendorToRow(v);
          const perf = perfMap[v.id];
          if (perf) {
            base.fulfillment = perf.fulfillment || 0;
            base.returns = perf.returns || 0;
            base.rating = perf.rating || base.rating;
            base.responseTime = perf.response || 0;
            base.complaints = perf.complaints || 0;
          }
          return base;
        });
        
        setVendors(merged);
        setStats(statsRes);
      } catch (err) {
        console.error('Failed to load performance data:', err);
        toast.error('Failed to load performance metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const VENDORS = vendors;

  const sorted = [...VENDORS]
    .filter(v => (filter === 'All' || v.tier === filter) && (!search || v.name.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sortDir === 'desc' ? (b[sortBy] || 0) - (a[sortBy] || 0) : (a[sortBy] || 0) - (b[sortBy] || 0));

  const pages = Math.ceil(sorted.length / PER) || 1;
  const slice = sorted.slice(page * PER, (page + 1) * PER);

  const toggleSort = key => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const avg = key => VENDORS.length ? (VENDORS.reduce((s, v) => s + (v[key] || 0), 0) / VENDORS.length).toFixed(1) : '0';

  /* KPI cards — use real dashboard stats when available, fall back to vendor aggregates */
  const totalGmv = stats?.totalRevenue != null
    ? stats.totalRevenue
    : VENDORS.reduce((s, v) => s + v.gmv, 0);

  const kpiCards = [
    {label:'Platform GMV',      value:`Rs.${(totalGmv / 100000).toFixed(1)}L`,                          trend: stats ? `${stats.totalOrders || 0} orders` : '+14.2%', up:true,  icon:'BarChart',    c:'#2563eb', bg:'#dbeafe'},
    {label:'Avg Vendor Rating', value:`★ ${avg('rating')}`,                                              trend: stats ? `${stats.totalVendors || 0} vendors` : '+0.2', up:true,  icon:'Star',        c:'#d97706', bg:'#fef3c7'},
    {label:'Avg Fulfillment',   value:`${avg('fulfillment')}%`,                                          trend: stats ? `${stats.totalProducts || 0} products` : '+1.4%', up:true,  icon:'CheckCircle', c:'#16a34a', bg:'#dcfce7'},
    {label:'Avg Response Time', value:`${avg('responseTime')}h`,                                         trend: stats ? `${stats.totalCustomers || 0} customers` : '−0.3h', up:true,  icon:'Clock',       c:'#7c3aed', bg:'#ede9fe'},
  ];

  if (loading) {
    return (
      <div className="vm">
        <div className="vm-hdr">
          <div>
            <h2 className="vm-hdr__title">Performance Metrics</h2>
            <p className="vm-hdr__sub">Loading performance data...</p>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:300, color:'#94a3b8', fontSize:'.9rem'}}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="vm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Performance Metrics</h2>
          <p className="vm-hdr__sub">Deep dive into vendor KPIs — fulfilment, ratings, GMV and responsiveness</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => exportCSV([['Vendor','Owner','City','GMV','Orders','Rating','Fulfillment %','On-Time %','Cancellations','Resp. Time (h)','Complaints','Growth','Status'], ...VENDORS.map(v => [v.name, v.owner, v.city, v.gmv, v.orders, v.rating, v.fulfillment, v.onTime, v.cancels, v.responseTime, v.complaints, v.growth, v.status])], 'performance-metrics.csv')}><Icon name="Download" size={13} color="#475569"/>Export</button>
          <button className="vm-btn vm-btn--outline"><Icon name="Calendar" size={13} color="#475569"/>Jan 2025</button>
        </div>
      </div>

      {/* Platform summary KPIs */}
      <div className="vm-kpi-grid">
        {kpiCards.map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background: k.bg}}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
              </div>
              <span className={`vm-kpi__trend vm-kpi__trend--${k.up ? 'up' : 'dn'}`}>{k.up ? '↑' : '↓'} {k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Big metrics table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Vendor Performance Overview</p>
            <p className="vm-sh__sub">Click any column header to sort · Click a row to expand detail</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search vendor…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}/>
            </div>
            <div className="vm-pills">
              {['All', 'bronze', 'silver', 'gold', 'platinum'].map(f => (
                <button key={f} className={`vm-pill${filter === f ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f === 'All' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Vendor</th>
                {METRICS.map(m => (
                  <th key={m.key} style={{cursor:'pointer', userSelect:'none'}} onClick={() => toggleSort(m.key)}>
                    <span style={{display:'flex', alignItems:'center', gap:4, color: sortBy === m.key ? '#E03E1A' : '#94a3b8'}}>
                      {m.label}
                      {sortBy === m.key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                    </span>
                  </th>
                ))}
                <th>Growth</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr><td colSpan={METRICS.length + 2} style={{textAlign:'center', padding:24, color:'#94a3b8'}}>No vendors found.</td></tr>
              )}
              {slice.map(v => (
                <React.Fragment key={v.id}>
                  <tr style={{cursor:'pointer', background: selV === v.id ? '#fff8f6' : undefined}}
                    onClick={() => setSelV(selV === v.id ? null : v.id)}>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{background: avatarBg(v.name)}}>{initials(v.name)}</div>
                        <div>
                          <div className="vm-vcell__name">{v.name}</div>
                          <span className={`vm-badge vm-badge--${v.tier}`} style={{fontSize:'.61rem', padding:'1px 7px'}}>
                            <span className="vm-badge__dot"/>
                            {v.tier ? v.tier[0].toUpperCase() + v.tier.slice(1) : '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    {METRICS.map(m => (
                      <td key={m.key}>
                        <span style={{
                          display: 'inline-block', padding: '3px 8px', borderRadius: 7,
                          background: metricBg(m, v[m.key]),
                          color: metricColor(m, v[m.key]),
                          fontWeight: 700, fontSize: '.78rem',
                        }}>
                          {m.fmt(v[m.key])}
                        </span>
                      </td>
                    ))}
                    <td>
                      <span style={{display:'flex', alignItems:'center', gap:4, fontSize:'.82rem', fontWeight:700,
                        color: v.growth >= 20 ? '#16a34a' : v.growth >= 10 ? '#2563eb' : '#94a3b8'}}>
                        <Icon name="TrendUp" size={12} color={v.growth >= 20 ? '#16a34a' : v.growth >= 10 ? '#2563eb' : '#94a3b8'}/>
                        +{v.growth}%
                      </span>
                    </td>
                  </tr>

                  {selV === v.id && (
                    <tr>
                      <td colSpan={METRICS.length + 2} style={{padding: 0}}>
                        <div style={{padding:'20px 16px', background:'#fff8f6', borderBottom:'1px solid #fde8e4'}}>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20}}>
                            {METRICS.map(m => {
                              const maxGmv = VENDORS.length ? Math.max(...VENDORS.map(vv => vv.gmv)) : 1;
                              const maxOrders = VENDORS.length ? Math.max(...VENDORS.map(vv => vv.orders)) : 1;
                              const pctVal =
                                m.key === 'gmv'          ? Math.min(100, Math.round(v.gmv / maxGmv * 100)) :
                                m.key === 'orders'       ? Math.min(100, Math.round(v.orders / maxOrders * 100)) :
                                m.key === 'rating'       ? Math.round(v.rating / 5 * 100) :
                                m.key === 'fulfillment'  ? v.fulfillment :
                                m.key === 'onTime'       ? v.onTime :
                                m.key === 'cancels'      ? Math.max(0, 100 - v.cancels * 3) :
                                m.key === 'responseTime' ? Math.max(0, 100 - v.responseTime * 10) :
                                                           Math.max(0, 100 - v.complaints * 5);
                              const col = metricColor(m, v[m.key]);
                              return (
                                <div key={m.key} style={{padding:'12px 14px', borderRadius:10, background:'#fff', border:'1px solid #f1f5f9'}}>
                                  <div style={{fontSize:'.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6}}>
                                    {m.label}
                                  </div>
                                  <div style={{fontSize:'1.1rem', fontWeight:800, color:col, marginBottom:8}}>
                                    {m.fmt(v[m.key])}
                                  </div>
                                  <div style={{height:4, background:'#f1f5f9', borderRadius:999, overflow:'hidden'}}>
                                    <div style={{height:'100%', width:`${pctVal}%`, background:col, borderRadius:999, transition:'width .4s'}}/>
                                  </div>
                                  <div style={{fontSize:'.65rem', color:'#94a3b8', marginTop:4}}>
                                    Platform avg: {avg(m.key)}{
                                      m.key === 'rating' ? ' ★' :
                                      m.key === 'responseTime' || m.key === 'gmv' || m.key === 'orders' || m.key === 'cancels' || m.key === 'complaints' ? '' : '%'
                                    }
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{marginTop:12, display:'flex', gap:8, justifyContent:'flex-end'}}>
                            <button className="vm-btn vm-btn--outline vm-btn--sm">
                              <Icon name="Activity" size={12} color="#475569"/>View Full Report
                            </button>
                            <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={() => setSelV(null)}>
                              <Icon name="X" size={12} color="#475569"/>Close
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{sorted.length > 0 ? `${page * PER + 1}–${Math.min((page + 1) * PER, sorted.length)} of ${sorted.length}` : '0 results'}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <Icon name="ChevLeft" size={12}/>
            </button>
            <span className="vm-pag__label">{page + 1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER >= sorted.length}>
              <Icon name="ChevRight" size={12}/>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom analytics */}
      <div className="vm-2col">
        {/* Top performers */}
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Top Performers by GMV</p>
          <p className="vm-sh__sub"  style={{marginBottom:16}}>Ranked by gross merchandise value this month</p>
          <div className="vm-stat-list">
            {[...VENDORS].sort((a, b) => b.gmv - a.gmv).slice(0, 6).map((v, i) => {
              const maxG = VENDORS.length ? Math.max(...VENDORS.map(vv => vv.gmv)) : 1;
              return (
                <div key={i}>
                  <div className="vm-sbar__head">
                    <span className="vm-sbar__lbl">
                      <span style={{fontWeight:700, marginRight:6, color: i < 3 ? '#d97706' : '#94a3b8'}}>#{i + 1}</span>
                      {v.name}
                    </span>
                    <span className="vm-sbar__val">{fmt(v.gmv)}</span>
                  </div>
                  <div className="vm-sbar__track">
                    <div className="vm-sbar__fill" style={{
                      width: `${(v.gmv / maxG) * 100}%`,
                      background: i === 0 ? '#E03E1A' : i === 1 ? '#d97706' : i === 2 ? '#64748b' : '#cbd5e1',
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs attention */}
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Needs Attention</p>
          <p className="vm-sh__sub"  style={{marginBottom:16}}>Vendors with below-threshold metrics</p>
          <div className="vm-col vm-g10">
            {VENDORS
              .filter(v => v.rating < 4.0 || v.fulfillment < 90 || v.complaints > 8 || v.responseTime > 4)
              .map((v, i) => {
                const issues = [];
                if (v.rating < 4.0)       issues.push({txt: `Low rating: ★${v.rating}`,      c: '#dc2626'});
                if (v.fulfillment < 90)   issues.push({txt: `Fulfillment: ${v.fulfillment}%`, c: '#dc2626'});
                if (v.complaints > 8)     issues.push({txt: `Complaints: ${v.complaints}`,    c: '#d97706'});
                if (v.responseTime > 4)   issues.push({txt: `Response: ${v.responseTime}h`,   c: '#d97706'});
                return (
                  <div key={i} style={{padding:'12px 14px', borderRadius:10, border:'1px solid #fee2e2', background:'#fff5f5', display:'flex', gap:12, alignItems:'flex-start'}}>
                    <div className="vm-av vm-av--sm" style={{background: avatarBg(v.name)}}>{initials(v.name)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, fontSize:'.85rem', color:'#0f172a', marginBottom:4}}>{v.name}</div>
                      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                        {issues.map((iss, j) => (
                          <span key={j} style={{fontSize:'.67rem', fontWeight:600, padding:'2px 8px', borderRadius:999, background: iss.c + '20', color: iss.c}}>
                            {iss.txt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="vm-btn vm-btn--warn vm-btn--sm">
                      <Icon name="AlertTriangle" size={12} color="#d97706"/>Review
                    </button>
                  </div>
                );
              })}
            {VENDORS.filter(v => v.rating < 4.0 || v.fulfillment < 90 || v.complaints > 8 || v.responseTime > 4).length === 0 && (
              <div className="vm-alert vm-alert--success">
                <Icon name="CheckCircle" size={15} color="#16a34a"/>
                <div className="vm-alert__text">All vendors are currently meeting performance benchmarks.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric benchmarks */}
      <div className="vm-card">
        <p className="vm-sh__title" style={{marginBottom:4}}>Platform Benchmarks vs Averages</p>
        <p className="vm-sh__sub"  style={{marginBottom:16}}>Target thresholds and current platform averages</p>
        <div className="vm-2col">
          {[
            {label:'Order Fulfillment Rate', target:95,  curr: +avg('fulfillment'),   c:'#16a34a', unit:'%'},
            {label:'On-Time Delivery',       target:95,  curr: +avg('onTime'),        c:'#2563eb', unit:'%'},
            {label:'Avg Vendor Rating',      target:4.5, curr: +avg('rating'),        c:'#d97706', unit:' ★', scale:5},
            {label:'Avg Response Time',      target:2,   curr: +avg('responseTime'),  c:'#7c3aed', unit:'h',  lower:true},
          ].map((b, i) => (
            <div key={i} style={{padding:'14px 16px', borderRadius:11, border:'1px solid #f1f5f9', background:'#fafcff'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <span style={{fontWeight:600, fontSize:'.83rem', color:'#0f172a'}}>{b.label}</span>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span style={{fontSize:'.72rem', color:'#94a3b8'}}>Target: {b.target}{b.unit}</span>
                  <span style={{fontSize:'.82rem', fontWeight:800, color:
                    b.lower ? (b.curr <= b.target ? '#16a34a' : '#dc2626') : (b.curr >= b.target ? '#16a34a' : '#d97706')
                  }}>{b.curr}{b.unit}</span>
                </div>
              </div>
              <div style={{height:7, background:'#f1f5f9', borderRadius:999, overflow:'visible', position:'relative'}}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, b.scale ? b.curr / b.scale * 100 : b.curr)}%`,
                  background: b.c, borderRadius: 999,
                }}/>
                <div style={{
                  position: 'absolute', top: -3, bottom: -3,
                  left: `${b.scale ? b.target / b.scale * 100 : b.target}%`,
                  width: 2, background: '#0f172a', borderRadius: 1, opacity: .25,
                }}/>
              </div>
              <div style={{fontSize:'.66rem', color:'#94a3b8', marginTop:5}}>
                {b.lower
                  ? (b.curr <= b.target ? '✓ Meeting target' : '⚠ Above target threshold')
                  : (b.curr >= b.target ? '✓ Meeting target' : '⚠ Below target threshold')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
