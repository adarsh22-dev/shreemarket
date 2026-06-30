import React, { useState, useEffect, useCallback } from 'react';
import './AdminPayoutRequests.css';
import { Icon, initials, avatarBg, fmt, exportCSV } from './VendorShared';
import { getPayouts, updatePayout, processBatchPayouts } from '../../api/api';
import toast from 'react-hot-toast';

const FILTERS = ['All','pending','approved','processing','paid','rejected'];
const PER = 8;

const priorityColor = p => p === 'high' ? '#dc2626' : p === 'normal' ? '#2563eb' : '#94a3b8';
const priorityBg    = p => p === 'high' ? '#fee2e2' : p === 'normal' ? '#dbeafe' : '#f1f5f9';

export default function PayoutRequests() {
  const [filter,  setFilter]  = useState('All');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(0);
  const [modal,   setModal]   = useState(null);
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForBatch, setSelectedForBatch] = useState([]);
  const [batchModal, setBatchModal] = useState(false);
  const [batchMethod, setBatchMethod] = useState('NEFT');
  const [batchProcessing, setBatchProcessing] = useState(false);

  const fetchRequests = useCallback(async (statusFilter, searchTerm) => {
    setLoading(true);
    try {
      const s = statusFilter === 'All' ? '' : statusFilter;
      const res = await getPayouts(s || undefined, searchTerm || undefined);
      const data = Array.isArray(res) ? res : (res.content || []);
      const mapped = data.map(p => ({
        id: p.payoutId,
        vendor: p.vendorName,
        amount: p.grossAmount,
        netAmount: p.netAmount,
        commission: p.commission,
        fee: p.fee,
        tds: p.tds,
        penalty: p.penalty,
        method: p.method,
        bank: p.paymentMethod,
        requested: p.date,
        due: '',
        status: (p.status || '').toLowerCase(),
        priority: 'normal',
        note: p.notes || '',
        dbId: p.id,
        vendorId: p.vendorId,
        orderIds: p.orderIds || '',
        orders: p.orders || 0,
      }));
      setRows(mapped);
    } catch (e) {
      toast.error('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(filter, search);
  }, [filter, search, fetchRequests]);

  const list  = rows.filter(r =>
    (filter === 'All' || (r.status || '').toLowerCase() === filter.toLowerCase()) &&
    (!search || r.vendor.toLowerCase().includes(search.toLowerCase()) || (r.id||'').toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(list.length / PER) || 1;
  const slice = list.slice(page * PER, (page + 1) * PER);

  const pending    = rows.filter(r => (r.status||'').toLowerCase() === 'pending').length;
  const totalPend  = rows.filter(r => (r.status||'').toLowerCase() === 'pending').reduce((s,r) => s + (r.amount || 0), 0);
  const totalProc  = rows.filter(r => (r.status||'').toLowerCase() === 'processing').reduce((s,r) => s + (r.amount || 0), 0);
  const totalPaid  = rows.filter(r => (r.status||'').toLowerCase() === 'paid').reduce((s,r) => s + (r.amount || 0), 0);

  const approve = async id => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    try {
      await updatePayout({ id: row.dbId, status: 'approved' });
      toast.success('Payout approved successfully');
      setRows(rs => rs.map(r => r.id === id ? {...r, status:'approved', note:'Manually approved'} : r));
    } catch (e) {
      toast.error('Failed to approve payout');
    }
  };

  const reject = async id => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    try {
      await updatePayout({ id: row.dbId, status: 'rejected' });
      toast.success('Payout rejected');
      setRows(rs => rs.map(r => r.id === id ? {...r, status:'rejected', note:'Admin rejected'} : r));
    } catch (e) {
      toast.error('Failed to reject payout');
    }
  };

  const openBatchModal = () => {
    const selected = rows.filter(r => selectedForBatch.includes(r.id) && (r.status === 'pending' || r.status === 'approved'));
    if (selected.length === 0) {
      toast.error('Select pending/approved payouts using checkboxes');
      return;
    }
    setBatchModal(true);
  };

  const processBatch = async () => {
    const selected = rows.filter(r => selectedForBatch.includes(r.id));
    if (selected.length === 0) return;
    setBatchProcessing(true);
    try {
      const payoutIds = selected.map(r => r.dbId);
      const result = await processBatchPayouts(payoutIds, batchMethod, 'Admin', 1);
      toast.success(`Batch processed! ${result.successCount || 0} succeeded, ${result.failedCount || 0} failed`);
      setBatchModal(false);
      setSelectedForBatch([]);
      fetchRequests(filter, search);
    } catch (e) {
      toast.error('Batch processing failed: ' + e.message);
    } finally {
      setBatchProcessing(false);
    }
  };

  const toggleBatchSelect = (id) => {
    setSelectedForBatch(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="vm">
      {/* Header */}
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">Payout Requests</h2>
          <p className="vm-hdr__sub">Review, approve or batch-process vendor payout requests via NEFT/IMPS/RTGS/UPI</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => exportCSV([['Request ID','Vendor','Gross Amount','Commission','TDS','Fee','Penalty','Net Amount','Method','Requested','Status','Orders'],...rows.map(r=>[r.id,r.vendor,r.amount,r.commission,r.tds,r.fee,r.penalty,r.netAmount,r.method,r.requested,r.status,r.orders])],'payout-requests.csv')}><Icon name="Download" size={13} color="#475569"/>Export</button>
          <button className="vm-btn vm-btn--primary" disabled={selectedForBatch.length === 0} onClick={openBatchModal} style={{opacity: selectedForBatch.length === 0 ? 0.5 : 1}}>
            <Icon name="Zap" size={13} color="#fff"/>Process Selected ({selectedForBatch.length})
          </button>          </div>
        </div>

      {/* KPIs */}
      <div className="vm-kpi-grid">
        {[
          { label:'Pending Requests', value: pending,       sub: fmt(totalPend)+' total',  icon:'Clock',       c:'#d97706', bg:'#fef3c7' },
          { label:'Awaiting Transfer', value: rows.filter(r => r.status === 'approved').length,          sub: fmt(totalProc)+' in-flight',icon:'Loader',    c:'#2563eb', bg:'#dbeafe' },
          { label:'Paid This Month',   value: rows.filter(r => r.status === 'paid').length, sub: fmt(totalPaid)+' total',           icon:'CheckCircle',c:'#16a34a', bg:'#dcfce7' },
          { label:'Selected',          value: selectedForBatch.length, sub:'ready to process', icon:'CheckSquare', c:'#7c3aed', bg:'#ede9fe' },
        ].map((k,i) => (
          <div key={i} className="vm-kpi">
            <div className="vm-kpi__top">
              <div className="vm-kpi__icon" style={{background:k.bg}}>
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

      {/* Table */}
      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">All Requests</p>
            <p className="vm-sh__sub">{list.length} requests found &middot; {selectedForBatch.length} selected for batch</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search vendor or request ID…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}/>
            </div>
            <div className="vm-pills">
              {FILTERS.map(f => (
                <button key={f} className={`vm-pill${filter===f?' vm-pill--active':''}`}
                  onClick={() => { setFilter(f); setPage(0); }}>
                  {f==='All'?'All':f[0].toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vm-tw">
          <table className="vm-tbl">
            <thead>
              <tr>
                <th style={{width:30}}><input type="checkbox" onChange={e => {
                  if (e.target.checked) setSelectedForBatch(list.map(r => r.id));
                  else setSelectedForBatch([]);
                }} checked={selectedForBatch.length === list.length && list.length > 0}/></th>
                <th style={{width:40}}>Request ID</th>
                <th>Vendor</th>
                <th>Gross Amount</th>
                <th>Commission</th>
                <th>Net Amount</th>
                <th>Orders</th>
                <th>Requested</th>
                <th>Status</th>
                <th className="vm-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map(r => (
                <tr key={r.id}>
                  <td><input type="checkbox" checked={selectedForBatch.includes(r.id)} onChange={() => toggleBatchSelect(r.id)}/></td>
                  <td className="vm-mn">{r.id}</td>
                  <td>
                    <div className="vm-vcell">
                      <div className="vm-av vm-av--sm" style={{background: avatarBg(r.vendor)}}>{initials(r.vendor)}</div>
                      <span className="vm-vcell__name">{r.vendor}</span>
                    </div>
                  </td>
                  <td className="vm-bo">{fmt(r.amount)}</td>
                  <td className="vm-mu">{r.commission ? fmt(r.commission) : '—'}</td>
                  <td className="vm-bo">{r.netAmount ? fmt(r.netAmount) : fmt(r.amount)}</td>
                  <td className="vm-mu">{r.orders || '—'}</td>
                  <td className="vm-mu">{r.requested}</td>
                  <td>
                    <span className={`vm-badge vm-badge--${r.status}`}>
                      <span className="vm-badge__dot"/>
                      {r.status[0].toUpperCase()+r.status.slice(1)}
                    </span>
                  </td>
                  <td className="vm-td-r">
                    <div className="vm-acts">
                      {r.status === 'pending' && <>
                        <button className="vm-btn vm-btn--success vm-btn--sm" onClick={() => approve(r.id)}>
                          <Icon name="Check" size={12} color="#fff"/>Approve
                        </button>
                        <button className="vm-btn vm-btn--danger vm-btn--sm" onClick={() => reject(r.id)}>
                          <Icon name="X" size={12} color="#fff"/>Reject
                        </button>
                      </>}
                      <button className="vm-ib vm-ib--view" onClick={() => setModal(r)}><Icon name="Eye" size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{page*PER+1}–{Math.min((page+1)*PER,list.length)} of {list.length}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p=>p-1)} disabled={page===0}><Icon name="ChevLeft" size={12}/></button>
            <span className="vm-pag__label">{page+1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p=>p+1)} disabled={(page+1)*PER>=list.length}><Icon name="ChevRight" size={12}/></button>
          </div>
        </div>
      </div>


      {/* Batch Processing Modal */}
      {batchModal && (
        <div className="vm-overlay" onClick={() => setBatchModal(false)}>
          <div className="vm-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">Batch Process Payouts</p>
                <p className="vm-modal__sub">{selectedForBatch.length} payout(s) selected</p>
              </div>
              <button className="vm-ib vm-ib--view" onClick={() => setBatchModal(false)}><Icon name="X" size={14}/></button>
            </div>
            <div className="vm-modal__body">
              <div className="cr-field">
                <label className="cr-label">Payment Method</label>
                <select className="cr-input cr-select" value={batchMethod} onChange={e => setBatchMethod(e.target.value)}>
                  <option value="NEFT">NEFT (1-2 hours)</option>
                  <option value="IMPS">IMPS (Instant)</option>
                  <option value="RTGS">RTGS (Real-time, &gt;₹2L)</option>
                  <option value="UPI">UPI (Instant, ≤₹1L)</option>
                </select>
              </div>

              <div style={{margin: '16px 0', padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '.875rem', color: '#92400e'}}>
                <strong>⚠️ Important:</strong> This will initiate actual transfers via {batchMethod}. This action simulates bank/UPI transfer processing.
              </div>

              <div className="vm-stat-list" style={{marginBottom: 16}}>
                <p className="cr-label" style={{marginBottom: 8}}>Selected Payouts:</p>
                {rows.filter(r => selectedForBatch.includes(r.id)).map(r => (
                  <div key={r.id} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f1f5f9'}}>
                    <span style={{fontSize:'.82rem'}}>{r.vendor} — {r.id} ({r.orders || 0} orders)</span>
                    <span style={{fontWeight:600, fontSize:'.82rem'}}>Gross: {fmt(r.amount)} | Net: {fmt(r.netAmount || r.amount)}</span>
                  </div>
                ))}
                <div style={{display:'flex', justifyContent:'space-between', padding:'8px 0', marginTop:8, borderTop:'2px solid #e2e8f0'}}>
                  <span style={{fontWeight:700}}>Total</span>
                  <span style={{fontWeight:700, color:'#16a34a'}}>Gross: {fmt(rows.filter(r => selectedForBatch.includes(r.id)).reduce((s, r) => s + (r.amount || 0), 0))} | Net: {fmt(rows.filter(r => selectedForBatch.includes(r.id)).reduce((s, r) => s + (r.netAmount || r.amount || 0), 0))}</span>
                </div>
              </div>

              <div className="vm-modal__acts">
                <button className="vm-btn vm-btn--outline" style={{flex:1}} onClick={() => setBatchModal(false)} disabled={batchProcessing}>Cancel</button>
                <button className="vm-btn vm-btn--primary" style={{flex:1}} onClick={processBatch} disabled={batchProcessing}>
                  <Icon name="Zap" size={13} color="#fff"/>{batchProcessing ? 'Processing...' : 'Process Payments via ' + batchMethod}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal && (
        <div className="vm-overlay" onClick={() => setModal(null)}>
          <div className="vm-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-modal__hdr">
              <div>
                <p className="vm-modal__title">Request Detail — {modal.id}</p>
                <p className="vm-modal__sub">{modal.vendor} &middot; {modal.orders || 0} orders</p>
              </div>
              <button className="vm-ib vm-ib--view" onClick={() => setModal(null)}><Icon name="X" size={14}/></button>
            </div>
            <div className="vm-modal__body">
              {/* Financial Breakdown */}
              <div style={{marginBottom: 16, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <p style={{fontWeight: 700, fontSize: '.9rem', marginBottom: 8, color: '#1e293b'}}>Financial Breakdown</p>
                <div className="vm-drow"><span className="vm-drow__lbl">Gross Amount</span><span className="vm-drow__val">{fmt(modal.amount)}</span></div>
                <div className="vm-drow"><span className="vm-drow__lbl">Commission</span><span className="vm-drow__val" style={{color:'#dc2626'}}>-{fmt(modal.commission || 0)}</span></div>
                <div className="vm-drow"><span className="vm-drow__lbl">Platform Fee</span><span className="vm-drow__val" style={{color:'#dc2626'}}>-{fmt(modal.fee || 0)}</span></div>
                <div className="vm-drow"><span className="vm-drow__lbl">TDS</span><span className="vm-drow__val" style={{color:'#dc2626'}}>-{fmt(modal.tds || 0)}</span></div>
                <div className="vm-drow"><span className="vm-drow__lbl">Penalty</span><span className="vm-drow__val" style={{color:'#dc2626'}}>-{fmt(modal.penalty || 0)}</span></div>
                <div style={{borderTop:'2px solid #e2e8f0', marginTop: 8, paddingTop: 8, display:'flex', justifyContent:'space-between'}}>
                  <span style={{fontWeight: 700}}>Net Amount</span>
                  <span style={{fontWeight: 700, color: '#16a34a', fontSize: '1.1rem'}}>{fmt(modal.netAmount || modal.amount)}</span>
                </div>
              </div>

              {/* Order Info */}
              {modal.orderIds && (
                <div style={{marginBottom: 16}}>
                  <p style={{fontWeight: 600, fontSize: '.82rem', color: '#475569', marginBottom: 4}}>Order IDs: {modal.orderIds}</p>
                </div>
              )}

              <div className="vm-drow"><span className="vm-drow__lbl">Vendor</span><span className="vm-drow__val">{modal.vendor}</span></div>
              <div className="vm-drow"><span className="vm-drow__lbl">Payment Method</span><span className="vm-drow__val">{modal.method || '—'}</span></div>
              <div className="vm-drow"><span className="vm-drow__lbl">Requested On</span><span className="vm-drow__val">{modal.requested}</span></div>
              <div className="vm-drow"><span className="vm-drow__lbl">Status</span>
                <span className={`vm-badge vm-badge--${modal.status}`}>
                  <span className="vm-badge__dot"/>
                  {modal.status[0].toUpperCase()+modal.status.slice(1)}
                </span>
              </div>
              {modal.note && (
                <div className="vm-drow"><span className="vm-drow__lbl">Note</span><span className="vm-drow__val">{modal.note}</span></div>
              )}
              {modal.status === 'pending' && (
                <div className="vm-modal__acts">
                  <button className="vm-btn vm-btn--success" style={{flex:1}} onClick={() => { approve(modal.id); setModal(null); }}>
                    <Icon name="Check" size={13} color="#fff"/>Approve Request
                  </button>
                  <button className="vm-btn vm-btn--danger" style={{flex:1}} onClick={() => { reject(modal.id); setModal(null); }}>
                    <Icon name="X" size={13} color="#fff"/>Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
