import React, { useState, useEffect, useCallback } from 'react';
import './AdminPaymentGatewayLogs.css';
import { Icon, fmt, exportCSV } from './VendorShared';
import { getPaymentGatewayLogs } from '../../api/api';
import toast from 'react-hot-toast';

const GATEWAYS = ['All','Razorpay','PayU','Cashfree'];
const TYPES    = ['All','payout','refund','webhook'];
const STATUSES = ['All','success','failed','pending'];
const PER      = 8;

const gwColor = g => g==='Razorpay'?'#2563eb': g==='PayU'?'#d97706': '#7c3aed';
const gwBg    = g => g==='Razorpay'?'#dbeafe': g==='PayU'?'#fef3c7': '#ede9fe';

const normalizeLog = (l) => ({
  id: l.transactionId || l.id,
  gateway: l.gateway,
  type: l.type,
  vendor: l.vendorName,
  amount: l.amount,
  currency: l.currency,
  status: l.status,
  code: l.code,
  latency: l.latency,
  ip: l.ipAddress,
  ts: l.timestamp,
  ref: l.reference,
});

export default function PaymentGatewayLogs() {
  const [logs,   setLogs]   = useState([]);
  const [total,  setTotal]  = useState(0);
  const [pages,  setPages]  = useState(1);
  const [gw,     setGw]     = useState('All');
  const [type,   setType]   = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);
  const [exp,    setExp]    = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PER };
      if (gw !== 'All') params.gateway = gw;
      if (type !== 'All') params.type = type;
      if (status !== 'All') params.status = status;
      if (search) params.search = search;
      const data = await getPaymentGatewayLogs(params);
      setLogs((data.content || []).map(normalizeLog));
      setTotal(data.totalElements || 0);
      setPages(data.totalPages || 1);
    } catch (e) {
      toast.error(e.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, gw, type, status, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const success = logs.filter(l => l.status === 'success').length;
  const failed  = logs.filter(l => l.status === 'failed').length;
  const avgLat  = logs.length
    ? Math.round(
        logs.filter(l => l.latency < 2000).reduce((s, l) => s + l.latency, 0) /
        (logs.filter(l => l.latency < 2000).length || 1)
      )
    : 0;

  const from = total ? page * PER + 1 : 0;
  const to = Math.min((page + 1) * PER, total);

  return (
    <div className="vm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Payment Gateway Logs</h2>
          <p className="vm-hdr__sub">All outbound payout, refund and webhook transactions across gateways</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => exportCSV([['TXN ID','Gateway','Type','Vendor','Amount','Code','Latency','Timestamp','Status'],...logs.map(l=>[l.id,l.gateway,l.type,l.vendor,l.amount,l.code,l.latency,l.ts,l.status])],'payment-gateway-logs.csv')}><Icon name="Download" size={13} color="#475569"/>Export CSV</button>
          <button className="vm-btn vm-btn--outline"><Icon name="RefreshCw" size={13} color="#475569"/>Refresh</button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          { label:'Total Transactions', value: total,                              sub:'last 3 days',      icon:'Activity',    c:'#475569', bg:'#f1f5f9' },
          { label:'Success Rate',       value: `${total ? Math.round(success/total*100) : 0}%`, sub:`${success} succeeded`, icon:'CheckCircle', c:'#16a34a', bg:'#dcfce7' },
          { label:'Failed',             value: failed,                                   sub:'needs attention',  icon:'XCircle',     c:'#dc2626', bg:'#fee2e2' },
          { label:'Avg Latency',        value: `${avgLat}ms`,                            sub:'p50 normal calls', icon:'Zap',         c:'#2563eb', bg:'#dbeafe' },
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{ background: k.bg }}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
              </div>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
              <div className="vm-kpi__sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Transaction Log</p>
            <p className="vm-sh__sub">{total} entries</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search TXN ID, vendor, ref…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}/>
            </div>
            <div className="gl-filter-row">
              <div className="vm-pills">
                {GATEWAYS.map(g => (
                  <button key={g} className={`vm-pill${gw===g?' vm-pill--active':''}`}
                    onClick={() => { setGw(g); setPage(0); }}>{g}</button>
                ))}
              </div>
              <div className="vm-pills">
                {TYPES.map(t => (
                  <button key={t} className={`vm-pill${type===t?' vm-pill--active':''}`}
                    onClick={() => { setType(t); setPage(0); }}>{t[0].toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
              <div className="vm-pills">
                {STATUSES.map(s => (
                  <button key={s} className={`vm-pill${status===s?' vm-pill--active':''}`}
                    onClick={() => { setStatus(s); setPage(0); }}>{s[0].toUpperCase()+s.slice(1)}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Gateway</th>
                <th>Type</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Code</th>
                <th>Latency</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>Loading…</td></tr>
              ) : logs.map(l => (
                <React.Fragment key={l.id}>
                  <tr className={exp === l.id ? 'gl-row--expanded' : ''}>
                    <td className="vm-mn">{l.id}</td>
                    <td>
                      <span className="gl-gw" style={{ background: gwBg(l.gateway), color: gwColor(l.gateway) }}>{l.gateway}</span>
                    </td>
                    <td>
                      <span className={`gl-type gl-type--${l.type}`}>{l.type[0].toUpperCase()+l.type.slice(1)}</span>
                    </td>
                    <td style={{ fontSize:'.82rem', fontWeight:600 }}>{l.vendor}</td>
                    <td className="vm-bo">{l.amount > 0 ? fmt(l.amount) : '—'}</td>
                    <td>
                      <span className={`gl-code gl-code--${l.status}`}>{l.code}</span>
                    </td>
                    <td>
                      <span className={`gl-lat ${l.latency>2000?'gl-lat--slow':l.latency>500?'gl-lat--mid':''}`}>
                        {l.latency >= 1000 ? `${(l.latency/1000).toFixed(1)}s` : `${l.latency}ms`}
                      </span>
                    </td>
                    <td className="vm-mu" style={{ fontSize:'.74rem' }}>{l.ts}</td>
                    <td>
                      <span className={`vm-badge vm-badge--${l.status}`}>
                        <span className="vm-badge__dot"/>
                        {l.status[0].toUpperCase()+l.status.slice(1)}
                      </span>
                    </td>
                    <td className="vm-td-r">
                      <div className="vm-acts">
                        <button className={`vm-ib ${exp===l.id ? 'vm-ib--view' : ''}`}
                          title="Detail" onClick={() => setExp(exp === l.id ? null : l.id)}>
                          <Icon name={exp===l.id ? 'ChevronUp' : 'ChevronDown'} size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {exp === l.id && (
                    <tr className="gl-detail-row">
                      <td colSpan={10}>
                        <div className="gl-detail">
                          <div className="gl-detail__grid">
                            {[
                              { l:'Reference ID', v: l.ref },
                              { l:'Gateway',      v: l.gateway },
                              { l:'Type',         v: l.type },
                              { l:'IP Address',   v: l.ip },
                              { l:'Currency',     v: l.currency },
                              { l:'HTTP Code',    v: l.code },
                              { l:'Latency',      v: l.latency >= 1000 ? `${(l.latency/1000).toFixed(1)}s` : `${l.latency}ms` },
                              { l:'Timestamp',    v: l.ts },
                            ].map((r, i) => (
                              <div key={i} className="gl-detail__item">
                                <span className="gl-detail__lbl">{r.l}</span>
                                <span className="gl-detail__val">{r.v}</span>
                              </div>
                            ))}
                          </div>
                          {l.status === 'failed' && (
                            <div className="gl-detail__error">
                              <Icon name="AlertCircle" size={13} color="#dc2626"/>
                              <span>Transaction failed — {
                                l.code === '503' ? 'Gateway timeout. Retry after 5 minutes.' :
                                l.code === '422' ? 'Unprocessable entity. Check beneficiary details.' :
                                'Bad request. Validate payload and retry.'
                              }</span>
                            </div>
                          )}
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
          <span className="vm-pag__info">{from}–{to} of {total}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p-1)} disabled={page === 0}>
              <Icon name="ChevLeft" size={12}/>
            </button>
            <span className="vm-pag__label">{page+1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p+1)} disabled={page+1 >= pages}>
              <Icon name="ChevRight" size={12}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
