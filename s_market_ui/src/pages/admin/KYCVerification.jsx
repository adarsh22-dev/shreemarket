import React, { useState, useEffect, useCallback } from 'react';
import './KYCVerification.css';
import { Icon, initials, avatarBg } from './VendorShared';
import { getVendorKyc, updateVendorKyc } from '../../api/api';
import toast from 'react-hot-toast';

const maskAccount = (num) => {
  if (!num || num.length < 4) return num;
  return 'XXXX' + num.slice(-4);
};

const DOC_LABELS = {gst:'GST Certificate', pan:'PAN Card', aadhaar:'Aadhaar Card', bank:'Bank Account', address:'Address Proof'};

const docStyle = s => ({
  verified: {color:'#16a34a', bg:'#dcfce7', icon:'Check'},
  pending:  {color:'#d97706', bg:'#fef3c7', icon:'Clock'},
  missing:  {color:'#dc2626', bg:'#fee2e2', icon:'X'},
  rejected: {color:'#dc2626', bg:'#fee2e2', icon:'X'},
}[s] || {color:'#94a3b8', bg:'#f1f5f9', icon:'Clock'});

const PER     = 5;
const FILTERS = ['All', 'pending', 'verified', 'rejected'];

const fmtDate = (epoch) => {
  if (!epoch) return '—';
  const d = new Date(epoch);
  return d.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
};

const PAYMENT_LABELS = {
  bank: { label: 'Bank Transfer', fields: { beneficiaryName:'Beneficiary', accountNumber:'Account No', accountType:'Account Type', ifscCode:'IFSC', remittanceEmail:'Remittance Email' }},
  upi:  { label: 'UPI',           fields: { upiId:'UPI ID', bankName:'Bank Name', panNumber:'PAN', remittanceEmail:'Remittance Email' }},
  paypal:{ label: 'PayPal',       fields: { paypalEmail:'PayPal Email', legalName:'Legal Name', panNumber:'PAN', purposeCode:'Purpose Code' }},
};

const parseBankString = (bankStr) => {
  if (!bankStr) return null;
  const parts = bankStr.split('||');
  if (parts.length < 2) return null;
  const raw = parts[1].toLowerCase();
  const method = raw === 'bank transfer' ? 'bank' : raw === 'upi' ? 'upi' : raw === 'paypal' ? 'paypal' : raw;
  const info = { bankStatus: parts[0], paymentMethod: method };
  if (method === 'bank' && parts.length >= 6) {
    info.beneficiaryName = parts[2];
    info.accountNumber = parts[3];
    info.accountType = parts[4];
    info.ifscCode = parts[5];
    info.remittanceEmail = parts[6] || '';
  } else if (method === 'upi' && parts.length >= 5) {
    info.upiId = parts[2];
    info.bankName = parts[3];
    info.panNumber = parts[4];
    info.remittanceEmail = parts[5] || '';
  } else if (method === 'paypal' && parts.length >= 5) {
    info.paypalEmail = parts[2];
    info.legalName = parts[3];
    info.panNumber = parts[4];
    info.purposeCode = parts[5] || '';
  }
  return info;
};

export default function KYCVerification() {
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [page,   setPage]       = useState(0);
  const [open,   setOpen]       = useState(null);
  const [data,   setData]       = useState([]);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(null);
  const [revealedAccounts, setRevealedAccounts] = useState({});

  const fetchKycData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVendorKyc(search);
      const arr = Array.isArray(res) ? res : res.content || [];
      const mapped = arr.map(k => {
        // Derive status from actual field values
        const panStatus = k.pan && k.pan !== 'Not Started' && k.pan !== 'Pending' ? 'verified' : 'pending';
        const gstStatus = k.gst && k.gst !== 'Not Started' && k.gst !== 'Pending' ? 'verified' : 'pending';
        const aadhaarStatus = k.aadhaarStatus || (k.aadhaar && k.aadhaar !== 'Not Started' ? 'verified' : 'pending');
        const bankStatus = k.bankStatus || (k.bank && !k.bank.startsWith('Not') && !k.bank.startsWith('Pending') ? 'verified' : (k.bank && k.bank !== 'Not Started' && k.bank !== '' ? 'pending' : 'missing'));
        const addressStatus = k.addressStatus || (k.address && k.address !== 'Not Started' ? 'verified' : 'pending');
        const overallStatus = k.overall || 'pending';

        return {
          id: k.id,
          vendor: k.vendorName || '—',
          owner: k.vendorName || '—',
          city: '—',
          submitted: k.updated || '—',
          status: overallStatus.toLowerCase(),
          pan: k.pan && k.pan !== 'Not Started' ? k.pan : null,
          gst: k.gst && k.gst !== 'Not Started' ? k.gst : null,
          aadhaar: k.aadhaar && k.aadhaar !== 'Not Started' ? k.aadhaar : null,
          paymentInfo: k.paymentInfo || parseBankString(k.bank),
          docs: {
            gst: gstStatus,
            pan: panStatus,
            aadhaar: aadhaarStatus,
            bank: bankStatus,
            address: addressStatus,
          }
        };
      });
      setData(mapped);
      setTotalPages(Math.ceil(arr.length / PER) || 1);
      setTotalElements(arr.length);
    } catch (err) {
      toast.error('Failed to load KYC records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchKycData();
  }, [fetchKycData]);

  const list  = data.filter(k =>
    (filter === 'All' || k.status === filter)
  );
  const pages   = totalPages;
  const slice   = list.slice(page * PER, (page + 1) * PER);
  const verified = d => Object.values(d).filter(v => v === 'verified').length;

  const approveAll = async (vendorId) => {
    setActionLoading(vendorId);
    try {
      await updateVendorKyc({ vendorId, status: 'verified' });
      toast.success('KYC approved successfully!');
      setOpen(null);
      await fetchKycData();
    } catch (err) {
      toast.error('Failed to approve KYC');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const flagReject = async (vendorId) => {
    setActionLoading(vendorId);
    try {
      await updateVendorKyc({ vendorId, status: 'rejected' });
      toast.success('KYC flagged and rejected!');
      setOpen(null);
      await fetchKycData();
    } catch (err) {
      toast.error('Failed to reject KYC');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const requestDocs = (kycId) => {
    toast('Requested missing documents for vendor #' + kycId);
  };

  const verifiedCount = data.filter(k => k.status === 'verified').length;
  const pendingCount  = data.filter(k => k.status === 'pending').length;
  const rejectedCount = data.filter(k => k.status === 'rejected').length;

  const docsDistribution = {
    gst: data.filter(d => d.docs.gst === 'verified').length,
    pan: data.filter(d => d.docs.pan === 'verified').length,
    aadhaar: data.filter(d => d.docs.aadhaar === 'verified').length,
    bank: data.filter(d => d.docs.bank === 'verified').length,
    address: data.filter(d => d.docs.address === 'verified').length,
  };
  const totalDocs = data.length || 1;

  return (
    <div className="vm">
      <div className="vm-hdr">
        <div>
          <h2 className="vm-hdr__title">KYC Verification</h2>
          <p className="vm-hdr__sub">Verify vendor identity and compliance documents</p>
        </div>
        <div className="vm-hdr__actions">
          <button className="vm-btn vm-btn--outline" onClick={() => toast('Exporting KYC records...')}><Icon name="Download" size={13} color="#475569"/>Export</button>
          <button className="vm-btn vm-btn--primary" onClick={() => { fetchKycData(); toast('Running compliance checks...'); }}><Icon name="RefreshCw" size={13} color="#fff"/>Run Checks</button>
        </div>
      </div>

      <div className="vm-kpi-grid">
        {[
          {label:'Total KYC Records',  value: totalElements, trend:'+' + totalElements, up:true,  icon:'Shield',        c:'#2563eb', bg:'#dbeafe'},
          {label:'Pending Review',     value: pendingCount,  trend:'' + pendingCount,   up:false, icon:'Clock',         c:'#d97706', bg:'#fef3c7'},
          {label:'Fully Verified',     value: verifiedCount, trend:'' + verifiedCount,  up:true,  icon:'ShieldCheck',   c:'#16a34a', bg:'#dcfce7'},
          {label:'Rejected / Flagged', value: rejectedCount, trend:'' + rejectedCount,  up:false, icon:'AlertTriangle', c:'#dc2626', bg:'#fee2e2'},
        ].map((k, i) => (
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

      <div className="vm-card">
        <div className="vm-sh">
          <div>
            <p className="vm-sh__title">KYC Records</p>
            <p className="vm-sh__sub">Review documents and approve or flag submissions</p>
          </div>
          <div className="vm-sh__right">
            <div className="vm-search">
              <span className="vm-search__icon"><Icon name="Search" size={14} color="#94a3b8"/></span>
              <input className="vm-search__input" placeholder="Search vendor, KYC ID…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); setOpen(null); }}/>
            </div>
            <div className="vm-pills">
              {FILTERS.map(f => (
                <button key={f} className={`vm-pill${filter === f ? ' vm-pill--active' : ''}`}
                  onClick={() => { setFilter(f); setPage(0); setOpen(null); }}>
                  {f === 'All' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="kyc-tw">
          <table className="kyc-tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Documents</th>
                <th>PAN / GST / Aadhaar</th>
                <th>Payment Details</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="kyc-th-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'#94a3b8',fontSize:'.9rem'}}>Loading KYC records...</td></tr>
              ) : slice.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'#94a3b8',fontSize:'.9rem'}}>No KYC records found</td></tr>
              ) : slice.map(k => {
                const st = k.status;
                const isActioning = actionLoading === k.id;
                const pi = k.paymentInfo;
                const payLabels = pi ? PAYMENT_LABELS[pi.paymentMethod] : null;
                return (
                  <tr key={k.id} style={{opacity: isActioning ? 0.5 : 1}}>
                    <td>
                      <div className="vm-vcell">
                        <div className="vm-av vm-av--sm" style={{background: avatarBg(k.vendor)}}>{initials(k.vendor)}</div>
                        <div>
                          <div className="vm-vcell__name">{k.vendor}</div>
                          <div className="vm-vcell__sub">#{k.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        {Object.entries(k.docs).map(([key, val]) => {
                          const s = docStyle(val);
                          return (
                            <span key={key} className="vm-kyc-chip" style={{background: s.bg, color: s.color}}>
                              <Icon name={s.icon} size={9} color={s.color} sw={2.5}/>
                              {DOC_LABELS[key]}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{fontSize:'.78rem'}}>
                      {k.pan ? <div><strong>PAN:</strong> {k.pan}</div> : <div style={{color:'#94a3b8'}}>PAN: —</div>}
                      {k.gst ? <div><strong>GST:</strong> {k.gst}</div> : <div style={{color:'#94a3b8'}}>GST: —</div>}
                      {k.aadhaar ? <div><strong>Aadhaar:</strong> {k.aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}</div> : <div style={{color:'#94a3b8'}}>Aadhaar: —</div>}
                    </td>
                    <td style={{fontSize:'.78rem'}}>
                      {pi ? (
                        <div>
                          <span className="vm-kyc-chip" style={{background:'#ede9fe',color:'#7c3aed',marginBottom:4,display:'inline-block'}}>
                            {payLabels ? payLabels.label : pi.paymentMethod}
                          </span>
                          <button
                            className="vm-btn vm-btn--outline vm-btn--sm"
                            style={{marginLeft:4,fontSize:'.7rem',padding:'2px 6px'}}
                            onClick={(e) => { e.stopPropagation(); setShowPaymentDetail(showPaymentDetail === k.id ? null : k.id); }}>
                            <Icon name="Eye" size={10} color="#475569"/> View
                          </button>
                          {showPaymentDetail === k.id && (
                            <div style={{marginTop:4,padding:'6px',background:'#f8fafc',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
                              {payLabels && Object.entries(payLabels.fields).map(([key, label]) => {
                                if (!pi[key]) return null;
                                const isAccount = key === 'accountNumber';
                                const revealed = revealedAccounts[k.id];
                                return (
                                  <div key={key} style={{display:'flex',alignItems:'center',gap:4}}>
                                    <span style={{color:'#64748b'}}>{label}:</span>
                                    <span style={{fontFamily: isAccount ? 'monospace' : 'inherit'}}>
                                      {isAccount && !revealed ? maskAccount(pi[key]) : pi[key]}
                                    </span>
                                    {isAccount && (
                                      <button
                                        onClick={() => setRevealedAccounts(p => ({...p, [k.id]: !p[k.id]}))}
                                        style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex',alignItems:'center',color:'#64748b'}}
                                        title={revealed ? 'Hide account number' : 'Show account number'}
                                      >
                                        <Icon name={revealed ? 'EyeOff' : 'Eye'} size={12}/>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{color:'#94a3b8'}}>No payment details</span>
                      )}
                    </td>
                    <td>
                      <span className={`vm-badge vm-badge--${st}`}>
                        <span className="vm-badge__dot"/>{st[0].toUpperCase() + st.slice(1)}
                      </span>
                    </td>
                    <td style={{color:'#64748b',fontSize:'.78rem'}}>{k.submitted}</td>
                    <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                      <button className="vm-btn vm-btn--success vm-btn--sm" disabled={isActioning} onClick={() => approveAll(k.id)} style={{marginRight:3}}><Icon name="Check" size={10} color="#16a34a"/></button>
                      <button className="vm-btn vm-btn--danger vm-btn--sm" disabled={isActioning} onClick={() => flagReject(k.id)} style={{marginRight:3}}><Icon name="X" size={10} color="#dc2626"/></button>
                      <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={() => requestDocs(k.id)}><Icon name="Upload" size={10} color="#475569"/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="vm-pag">
          <span className="vm-pag__info">{list.length === 0 ? '0' : `${page * PER + 1}–${Math.min((page + 1) * PER, totalElements)} of ${totalElements}`}</span>
          <div className="vm-pag__ctrl">
            <button className="vm-pag__btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <Icon name="ChevLeft" size={12}/>
            </button>
            <span className="vm-pag__label">{page + 1} / {pages}</span>
            <button className="vm-pag__btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= pages}>
              <Icon name="ChevRight" size={12}/>
            </button>
          </div>
        </div>
      </div>

      <div className="vm-2col">
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>Document Completion Rate</p>
          <p className="vm-sh__sub" style={{marginBottom:16}}>% of vendors with each doc verified</p>
          <div className="vm-stat-list">
            {[
              {l:'GST Certificate', pct:Math.round(docsDistribution.gst / totalDocs * 100), c:'#2563eb'},
              {l:'PAN Card',        pct:Math.round(docsDistribution.pan / totalDocs * 100), c:'#16a34a'},
              {l:'Aadhaar Card',    pct:Math.round(docsDistribution.aadhaar / totalDocs * 100), c:'#d97706'},
              {l:'Bank Account',    pct:Math.round(docsDistribution.bank / totalDocs * 100), c:'#7c3aed'},
              {l:'Address Proof',   pct:Math.round(docsDistribution.address / totalDocs * 100), c:'#0d9488'},
            ].map((s, i) => (
              <div key={i}>
                <div className="vm-sbar__head">
                  <span className="vm-sbar__lbl">{s.l}</span>
                  <span className="vm-sbar__val">{s.pct}%</span>
                </div>
                <div className="vm-sbar__track">
                  <div className="vm-sbar__fill" style={{width: `${s.pct}%`, background: s.c}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="vm-card">
          <p className="vm-sh__title" style={{marginBottom:4}}>KYC Status Breakdown</p>
          <p className="vm-sh__sub" style={{marginBottom:16}}>Current verification queue</p>
          <div className="vm-stat-list">
            {[
              {l:'Fully Verified', val: verifiedCount, pct: totalElements ? Math.round(verifiedCount / totalElements * 100) : 0, c:'#16a34a'},
              {l:'Pending Review', val: pendingCount,  pct: totalElements ? Math.round(pendingCount / totalElements * 100) : 0,  c:'#d97706'},
              {l:'Rejected',       val: rejectedCount, pct: totalElements ? Math.round(rejectedCount / totalElements * 100) : 0, c:'#dc2626'},
            ].map((s, i) => (
              <div key={i}>
                <div className="vm-sbar__head">
                  <span className="vm-sbar__lbl">{s.l}</span>
                  <span className="vm-sbar__val">{s.val} ({s.pct}%)</span>
                </div>
                <div className="vm-sbar__track">
                  <div className="vm-sbar__fill" style={{width: `${s.pct}%`, background: s.c}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
