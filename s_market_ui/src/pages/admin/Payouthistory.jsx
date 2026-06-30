import React, { useState, useEffect, useCallback } from 'react';
import './Payouthistory.css';
import { Icon, initials, avatarBg, fmt } from './VendorShared';
import { getPayouts, updatePayout } from '../../api/api';
import toast from 'react-hot-toast';

const PER     = 8;
const FILTERS = ['All', 'paid', 'processing', 'failed'];

export default function PayoutHistory() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState([]);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'All' ? undefined : filter;
      const res = await getPayouts(status, search || undefined);
      const arr = Array.isArray(res) ? res : (res.content || []);
      setPayouts(arr.map(p => ({
        id: p.payoutId,
        dbId: p.id,
        vendor: p.vendorName,
        amount: p.grossAmount,
        comm: p.commission,
        net: p.netAmount,
        method: p.method,
        bank: p.bank,
        date: p.date,
        status: p.status
      })));
    } catch {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const list  = payouts.filter(p =>
    (filter === 'All' || p.status === filter) &&
    (!search || p.vendor.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(list.length / PER) || 1;
  const slice = list.slice(page * PER, (page + 1) * PER);

  const totalPaid    = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.net, 0);
  const totalPending = payouts.filter(p => p.status === 'processing').reduce((s, p) => s + p.net, 0);
  const totalComm    = payouts.reduce((s, p) => s + p.comm, 0);
  const failedCount  = payouts.filter(p => p.status === 'failed').length;
  const failedAmount = payouts.filter(p => p.status === 'failed').reduce((s, p) => s + p.net, 0);

  const monthlyData = (() => {
    const monthMap = {};
    payouts.forEach(p => {
      const d = new Date(p.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      if (!monthMap[key]) monthMap[key] = { m: label, v: 0, key };
      monthMap[key].v += p.net;
    });
    return Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
  })();
  const maxM = Math.max(...(monthlyData.length ? monthlyData.map(x => x.v) : [1]), 1);

  const methodAgg = {};
  payouts.forEach(p => {
    if (!methodAgg[p.method]) methodAgg[p.method] = 0;
    methodAgg[p.method] += p.net;
  });
  const methodTotal = Object.values(methodAgg).reduce((s, v) => s + v, 0) || 1;
  const methodColors = ['#2563eb', '#16a34a', '#d97706', '#8b5cf6', '#ec4899'];
  const methodSplit = Object.entries(methodAgg).map(([method, amount], i) => ({
    l: method,
    v: amount,
    pct: Math.round((amount / methodTotal) * 100),
    c: methodColors[i % methodColors.length]
  }));

  const pendingPayouts = payouts.filter(p => p.status === 'processing');

  const retryPayout = async (payoutId) => {
    setPayouts(prev => prev.map(p => 
      p.id === payoutId ? {...p, status: 'processing'} : p
    ));
    try {
      const payout = payouts.find(p => p.id === payoutId);
      if (payout) {
        await updatePayout({ id: payout.dbId, status: 'paid' });
        setPayouts(prev => prev.map(p => 
          p.id === payoutId ? {...p, status: 'paid'} : p
        ));
        toast.success(`\u2713 Payout ${payoutId} retried successfully and marked as paid!`);
      }
    } catch {
      toast.error('Failed to retry payout');
      fetchPayouts();
    }
  };

  const openProcessModal = () => {
    if (pendingPayouts.length === 0) {
      toast.error('No pending payouts to process!');
      return;
    }
    setSelectedVendors([]);
    setShowProcessModal(true);
  };

  const toggleVendorSelection = (payoutId) => {
    setSelectedVendors(prev =>
      prev.includes(payoutId)
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const selectAllVendors = () => {
    if (selectedVendors.length === pendingPayouts.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(pendingPayouts.map(p => p.id));
    }
  };

  const calculateStats = () => {
    const selected = pendingPayouts.filter(p => selectedVendors.includes(p.id));
    const totalAmount = selected.reduce((s, p) => s + p.net, 0);
    return {
      count: selected.length,
      amount: totalAmount,
      payouts: selected
    };
  };

  const confirmProcessPayouts = async () => {
    const stats = calculateStats();
    if (stats.count === 0) {
      toast.error('Please select at least one vendor!');
      return;
    }
    try {
      for (const payout of stats.payouts) {
        await updatePayout({ id: payout.dbId, status: 'paid' });
      }
      toast.success(`\u2713 Successfully processed ${stats.count} payouts!\n\nTotal Amount: \u20B9${fmt(stats.amount)}\n\nVendors:\n${stats.payouts.map(p => `\u2022 ${p.vendor}`).join('\n')}`);
      setShowProcessModal(false);
      setSelectedVendors([]);
      fetchPayouts();
    } catch {
      toast.error('Failed to process payouts');
    }
  };

  const viewDetails = (payout) => {
    toast.success(`Payout Details:\n\nID: ${payout.id}\nVendor: ${payout.vendor}\nGross Sales: \u20B9${fmt(payout.amount)}\nCommission: \u20B9${fmt(payout.comm)}\nNet Payout: \u20B9${fmt(payout.net)}\nMethod: ${payout.method}\nBank: ${payout.bank}\nDate: ${payout.date}\nStatus: ${payout.status.toUpperCase()}`);
  };

  return (
    <div className="vm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Payout History</h2>
          <p className="vm-hdr__sub">Track all vendor payouts, pending transfers and failed transactions</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => toast.success('Exporting payout history...')}><Icon name="Download" size={13} color="#475569"/>Export</button>
          <button className="vm-btn vm-btn--primary" onClick={openProcessModal}><Icon name="Zap" size={13} color="#fff"/>Process Payouts</button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          {label:'Total Paid (Jan)',    value: fmt(totalPaid),    trend:'+8.4%', up:true,  icon:'DollarSign',  c:'#16a34a', bg:'#dcfce7'},
          {label:'Pending Payouts',     value: fmt(totalPending), trend:'+2',    up:false, icon:'Clock',       c:'#d97706', bg:'#fef3c7'},
          {label:'Failed Transactions', value: failedCount,     trend:'0',     up:true,  icon:'AlertCircle', c:'#dc2626', bg:'#fee2e2'},
          {label:'Platform Commission', value: fmt(totalComm),   trend:'+12%',  up:true,  icon:'Percent',     c:'#2563eb', bg:'#dbeafe'},
        ].map((k, i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background: k.bg}}>
                <Icon name={k.icon} size={18} color={k.c} sw={2.1}/>
              </div>
              <span className={`vm-kpi__trend vm-kpi__trend--${k.up ? 'up' : 'dn'}`}>{k.up ? '\u2191' : '\u2193'} {k.trend}</span>
            </div>
            <div>
              <div className="vm-kpi__value">{k.value}</div>
              <div className="vm-kpi__label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">Payout Transactions</p>
            <p className="vm-sh__sub">All vendor payout records</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search vendor, payout ID\u2026"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}/>
            </div>
            <div className="vm-pills">
              {FILTERS.map(f => (
                <button key={f} className={`vm-pill${filter === f ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f === 'All' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          {loading ? (
            <div style={{textAlign:'center', padding:'40px', color:'#64748b', fontSize:'.9rem'}}>Loading payouts...</div>
          ) : (
          <table className="vm-tbl">
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Vendor</th>
                <th>Gross Sales</th>
                <th>Commission</th>
                <th>Net Payout</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map(p => (
                <tr key={p.id}>
                  <td className="vm-mn">{p.id}</td>
                  <td>
                    <div className="vm-vcell">
                      <div className="vm-av vm-av--sm" style={{background: avatarBg(p.vendor)}}>{initials(p.vendor)}</div>
                      <span className="vm-vcell__name">{p.vendor}</span>
                    </div>
                  </td>
                  <td className="vm-mu">{fmt(p.amount)}</td>
                  <td>
                    <span style={{color:'#dc2626', fontWeight:600, fontSize:'.82rem'}}>
                      -{fmt(p.comm)}
                    </span>
                  </td>
                  <td className="vm-bo">{fmt(p.net)}</td>
                  <td>
                    <div>
                      <div style={{fontWeight:600, fontSize:'.82rem'}}>{p.method}</div>
                      <div style={{fontSize:'.68rem', color:'#94a3b8', fontFamily:'monospace'}}>{p.bank}</div>
                    </div>
                  </td>
                  <td className="vm-mu">{p.date}</td>
                  <td>
                    <span className={`vm-badge vm-badge--${p.status}`}>
                      <span className="vm-badge__dot"/>
                      {p.status[0].toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                  <td className="vm-td-r">
                    <div className="vm-acts">
                      {p.status === 'failed' && (
                        <button className="vm-btn vm-btn--warn vm-btn--sm" onClick={() => retryPayout(p.id)}>
                          <Icon name="RefreshCw" size={12} color="#d97706"/>Retry
                        </button>
                      )}
                      <button className="vm-ib vm-ib--view" onClick={() => viewDetails(p)}><Icon name="Eye" size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{`${page * PER + 1}\u2013${Math.min((page + 1) * PER, list.length)} of ${list.length}`}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <Icon name="ChevLeft" size={12}/>
            </button>
            <span className="vm-pag__label">{page + 1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER >= list.length}>
              <Icon name="ChevRight" size={12}/>
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="vm-2col">
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Monthly Payout Volume</p>
          <p className="vm-sh__sub"  style={{marginBottom:16}}>Total net payouts last 6 months</p>
          <div className="vm-bchart">
            {monthlyData.map((m, i) => {
              const isLast = i === monthlyData.length - 1;
              const h = Math.max(12, Math.round((m.v / maxM) * 90));
              return (
                <div key={i} className="vm-bchart__col">
                  <span className="vm-bchart__num">
                    {m.v >= 100000 ? `${(m.v / 100000).toFixed(1)}L` : fmt(m.v)}
                  </span>
                  <div className="vm-bchart__bar" style={{
                    height: h,
                    background: isLast ? '#E03E1A' : '#f1f5f9',
                    border: isLast ? 'none' : '1px solid #e8ecf0',
                    boxShadow: isLast ? '0 2px 10px rgba(224,62,26,.3)' : 'none',
                  }}/>
                  <span className="vm-bchart__lbl">{m.m}</span>
                </div>
              );
            })}
          </div>
          <div className="vm-partial-note">
            Jan is a partial month — 8 of 31 days completed
          </div>
        </div>

        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Payment Method Split</p>
          <p className="vm-sh__sub"  style={{marginBottom:16}}>Distribution by transfer type</p>
          <div className="vm-stat-list">
            {methodSplit.map((s, i) => (
              <div key={i}>
                <div className="vm-sbar__head">
                  <span className="vm-sbar__lbl">{s.l}</span>
                  <span className="vm-sbar__val">{fmt(s.v)} ({s.pct}%)</span>
                </div>
                <div className="vm-sbar__track">
                  <div className="vm-sbar__fill" style={{width: `${s.pct}%`, background: s.c}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="vm-divider"/>
          <span className="vm-sec-lbl">Summary</span>
          {[
            {l:'Total Net Paid',     v: fmt(totalPaid),    c:'#16a34a'},
            {l:'Pending',           v: fmt(totalPending), c:'#d97706'},
            {l:'Failed',            v: fmt(failedAmount), c:'#dc2626'},
            {l:'Commission Earned', v: fmt(totalComm),    c:'#E03E1A'},
          ].map((r, i) => (
            <div key={i} className="vm-irow">
              <span className="vm-irow__lbl">{r.l}</span>
              <span className="vm-irow__val" style={{color: r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Process Payouts Modal */}
      {showProcessModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%',
            maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a'}}>
                Select Vendors to Process
              </h3>
              <button onClick={() => setShowProcessModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: '#64748b', fontSize: '24px', lineHeight: 1
              }}>×</button>
            </div>

            {/* Select All Option */}
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
              padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
            }} onClick={selectAllVendors}>
              <input
                type="checkbox"
                checked={selectedVendors.length === pendingPayouts.length && pendingPayouts.length > 0}
                onChange={() => {}}
                style={{width: '18px', height: '18px', cursor: 'pointer'}}
              />
              <div>
                <div style={{fontSize: '.9rem', fontWeight: 600, color: '#166534'}}>
                  Select All Pending ({pendingPayouts.length})
                </div>
                <div style={{fontSize: '.8rem', color: '#65a30d', marginTop: '2px'}}>
                  Total: ₹{fmt(pendingPayouts.reduce((s, p) => s + p.net, 0))}
                </div>
              </div>
            </div>

            {/* Vendor List */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto',
              border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px'
            }}>
              {pendingPayouts.length === 0 ? (
                <div style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>
                  No pending payouts to process
                </div>
              ) : (
                pendingPayouts.map(payout => (
                  <label key={payout.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                    padding: '12px', borderRadius: '6px', background: selectedVendors.includes(payout.id) ? '#f0fdf4' : '#f8fafc',
                    border: selectedVendors.includes(payout.id) ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(payout.id)}
                      onChange={() => toggleVendorSelection(payout.id)}
                      style={{width: '16px', height: '16px', cursor: 'pointer'}}
                    />
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{fontSize: '.9rem', fontWeight: 600, color: '#0f172a'}}>
                        {payout.vendor}
                      </div>
                      <div style={{fontSize: '.8rem', color: '#64748b', marginTop: '2px'}}>
                        {payout.id} • {payout.method}
                      </div>
                    </div>
                    <div style={{textAlign: 'right', flexShrink: 0}}>
                      <div style={{fontSize: '.9rem', fontWeight: 700, color: '#16a34a'}}>
                        ₹{fmt(payout.net)}
                      </div>
                      <div style={{fontSize: '.8rem', color: '#64748b'}}>
                        {payout.date}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Selected Summary */}
            {selectedVendors.length > 0 && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                padding: '12px', margin: '16px 0', fontSize: '.875rem'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{color: '#64748b'}}>Selected Payouts:</span>
                  <span style={{fontWeight: 600, color: '#0f172a'}}>{selectedVendors.length}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#64748b'}}>Total Amount:</span>
                  <span style={{fontWeight: 700, color: '#16a34a'}}>₹{fmt(calculateStats().amount)}</span>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div style={{
              background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px',
              padding: '12px', marginBottom: '20px', fontSize: '.875rem', color: '#1e40af'
            }}>
              <strong>Note:</strong> Selected payouts will be processed and transferred to vendor bank accounts immediately. This action cannot be undone.
            </div>

            {/* Action Buttons */}
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setShowProcessModal(false)}
                style={{
                  padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '6px',
                  background: '#f8fafc', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                  color: '#475569', transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmProcessPayouts}
                disabled={selectedVendors.length === 0}
                style={{
                  padding: '10px 20px', border: 'none', borderRadius: '6px',
                  background: selectedVendors.length === 0 ? '#cbd5e1' : '#16a34a',
                  color: '#fff', cursor: selectedVendors.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '.875rem', fontWeight: 600,
                  transition: 'all 0.2s', opacity: selectedVendors.length === 0 ? 0.6 : 1
                }}
              >
                Process {selectedVendors.length > 0 ? selectedVendors.length : ''} Payout{selectedVendors.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
